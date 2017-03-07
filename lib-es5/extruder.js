"use strict";

var clipperLib = require("clipper-lib");
var pathHelper = require("./path-helper.js");
var geomHelper = require("./geom-helper.js");
var cdt2dHelper = require("./cdt2d-helper.js");

var extruder = {

    /**
     * getGeometry([{ X: 0, Y: 3 }, ...], [{
     *    path: [{ X, Y }, { X, Y }, ...],
     *    depth: 50
     * }, {
     *    ...
     * }], {
     *    bottom: true,
     *    sides: false,
     *    ...
     * });
     */
    getGeometry: function getGeometry(outerShape, holes, depthsHoles) {
        //get the topology 2D paths by depth
        var pathsByDepth = extruder.getPathsByDepth(holes, depthsHoles);
        var topoPathsByDepth = extruder.getTopoPathByDepth(pathsByDepth, outerShape);
        //get the inner triangles
        var horizontalGeom = extruder.getInnerHorizontalGeom(topoPathsByDepth);
        var verticalGeom = extruder.getInnerVerticalGeom(pathsByDepth, horizontalGeom.offset);
        var totalGeom = geomHelper.concatGeometries([horizontalGeom, verticalGeom], false);
        // let totalGeom = verticalGeom;

        var faces = totalGeom.faces;
        var points = totalGeom.points;
        var normals = totalGeom.normals;
        var uvs = [];
        // let uvs = Array.apply(1, Array(2 * points.length / 3));
        return {
            faces: faces,
            points: points,
            normals: normals,
            uvs: uvs
        };
    },

    getInnerVerticalGeom: function getInnerVerticalGeom(pathsByDepth) {
        var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        //ensure the paths are all in the same direction
        Object.keys(pathsByDepth.paths).forEach(function (i) {
            pathHelper.setDirectionPaths(pathsByDepth.paths[i], 1);
        });

        var geom = [];

        var _loop = function _loop(indexDepth) {
            var pathsAtDepth = pathsByDepth.paths[indexDepth];
            //for each point at each path at each depth we look for the corresponding point into the upper paths:
            Object.values(pathsAtDepth).forEach(function (path) {
                Object.keys(path).forEach(function (indexPtDwn) {
                    var ptDwn = path[indexPtDwn];
                    var nPtDwn = path[(+indexPtDwn + 1) % path.length];
                    var currgeom = geomHelper.getOneInnerVerticalGeom(ptDwn, nPtDwn, +indexDepth, pathsByDepth, +offset);
                    if (!currgeom) return;
                    geom.push(currgeom);
                    offset = currgeom.offset;
                });
            });
        };

        for (var indexDepth = pathsByDepth.depths.length - 1; indexDepth >= 0; indexDepth--) {
            _loop(indexDepth);
        }
        return geomHelper.concatGeometries(geom, false);
    },

    /**
    * Returns the geometry of the inner horizontal facess
    */
    getInnerHorizontalGeom: function getInnerHorizontalGeom(topoPathsByDepth) {
        var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        //gets all the triangles by depth:
        var trianglesByDepth = [];
        for (var i in topoPathsByDepth) {
            var totaltopo = topoPathsByDepth[i].pos.concat(topoPathsByDepth[i].neg);
            trianglesByDepth.push(cdt2dHelper.computeTriangulation(totaltopo));
            trianglesByDepth[i].depth = topoPathsByDepth[i].depth;
        }
        // get points, normal and faces from it:
        return geomHelper.getInnerHorizontalGeom(trianglesByDepth, +offset);
    },

    /**
    * Returns the paths sorted by sens. Negativess paths are holes.
    * Positives paths are the end of holes( solids)
    * For convinience, all paths are set to positive
    */
    getTopoPathByDepth: function getTopoPathByDepth(pathsByDepth, outerShape) {
        var paths = pathsByDepth.paths;
        var topoByDepth = [];
        topoByDepth.push({
            pos: [outerShape],
            neg: paths[0],
            depth: 0
        });

        for (var i = 1; i < pathsByDepth.depths.length - 1; i++) {
            var xor = pathHelper.getXorOfPaths(paths[i], paths[i + 1]);
            var posxor = xor.filter(pathHelper.isPositivePath);
            var negxor = xor.filter(pathHelper.isNegativePath);

            pathHelper.setDirectionPaths(negxor, 1);
            topoByDepth.push({
                pos: posxor,
                neg: negxor,
                depth: pathsByDepth.depths[i]
            });
        }
        pathHelper.setDirectionPaths(paths[paths.length - 1], 1);
        topoByDepth.push({
            pos: paths[paths.length - 1],
            neg: [],
            depth: pathsByDepth.depths[pathsByDepth.depths.length - 1]
        });

        return topoByDepth;
    },

    /**
     *  Takes an array of paths representing holes at different depths.
     *  One depth value/ path.
     *  returns an array of paths at each depth: simplify the geometry for each stage.
     */
    getPathsByDepth: function getPathsByDepth(initialPaths, depths) {
        //sort paths  by depth
        var sorted = extruder.sortPathByDepth(initialPaths, depths);
        //remove duplicate depths values:
        depths = new Set(depths);
        depths = Array.from(depths);
        depths.sort(function (a, b) {
            return a - b;
        });
        //compute the paths for each depth:
        var res = [];

        //add zero depth
        if (depths[0] != 0) {
            depths = [0].concat(depths);
        }

        for (var i in depths) {
            //take only the paths of the holes which reach this depth
            var pathsAtThisDepth = extruder.getPathAtDepth(sorted, depths[i]);
            //simplify the geometry of this path:
            res.push(pathsAtThisDepth);
        }
        return {
            paths: res,
            depths: depths
        };
    },

    /**
     * Returns a simplified [path] representing all the paths that reachs depth
     */
    getPathAtDepth: function getPathAtDepth(pathAndDepth, depth) {
        var res = [];
        var pathAtDepth = pathAndDepth.filter(function (s) {
            return s.depth >= depth;
        });
        for (var i in pathAtDepth) {
            res.push(pathAtDepth[i].path);
        }
        return pathHelper.simplifyPaths(res);
    },

    /**
     * Sort initial path by depth.
     */
    sortPathByDepth: function sortPathByDepth(initialPaths, depths) {
        //sort paths by depth
        var pathAndDepth = [];
        for (var i in initialPaths) {
            pathAndDepth.push({
                path: initialPaths[i],
                depth: depths[i]
            });
        }
        pathAndDepth.sort(function (a, b) {
            return a.depth - b.depth;
        });
        return pathAndDepth;
    }

};

module.exports = extruder;