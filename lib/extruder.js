"use strict";

const clipperLib = require("clipper-lib");
const pathHelper = require("./path-helper.js");
const geomHelper = require ("./geom-helper.js");
const cdt2dHelper = require("./cdt2d-helper.js");

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
    getGeometry: function(outerShape, holes, depthsHoles) {
        //get the topology 2D paths by depth
        let pathsByDepth = extruder.getPathsByDepth(holes, depthsHoles);
        let topoPathsByDepth = extruder.getTopoPathByDepth(pathsByDepth, outerShape);
        //get the inner triangles
        let horizontalGeom = extruder.getInnerHorizontalGeom(topoPathsByDepth);
        let verticalGeom = extruder.getInnerVerticalGeom(pathsByDepth, horizontalGeom.offset);
        let totalGeom = geomHelper.concatGeometries([horizontalGeom, verticalGeom], false);
        // let totalGeom = verticalGeom;

        let faces = totalGeom.faces;
        let points = totalGeom.points;
        let normals = totalGeom.normals;
        let uvs=[];
        // let uvs = Array.apply(1, Array(2 * points.length / 3));
        return {
            faces: faces,
            points: points,
            normals: normals,
            uvs: uvs
        };
    },



    getInnerVerticalGeom: function(pathsByDepth, offset = 0) {
      //ensure the paths are all in the same direction
        Object.keys(pathsByDepth.paths).forEach(i => {
            pathHelper.setDirectionPaths(pathsByDepth.paths[i], 1)
        });

        let geom = [];
        for (let indexDepth = pathsByDepth.depths.length - 1; indexDepth >= 0; indexDepth--) {
            let pathsAtDepth = pathsByDepth.paths[indexDepth];
            //for each point at each path at each depth we look for the corresponding point into the upper paths:
            Object.values(pathsAtDepth).forEach(path => {
                Object.keys(path).forEach(indexPtDwn => {
                    let ptDwn = path[indexPtDwn];
                    let nPtDwn = path[((+indexPtDwn) + 1) % path.length];
                    let currgeom = geomHelper.getOneInnerVerticalGeom(ptDwn, nPtDwn, +indexDepth, pathsByDepth, +offset);
                    if (!currgeom) return;
                    geom.push(currgeom);
                    offset = currgeom.offset;
                });
            });
        }
        return geomHelper.concatGeometries(geom, false);
    },

    /**
    * Returns the geometry of the inner horizontal facess
    */
    getInnerHorizontalGeom: function(topoPathsByDepth, offset = 0) {
        //gets all the triangles by depth:
        let trianglesByDepth = [];
        for (let i in topoPathsByDepth) {
            let totaltopo = topoPathsByDepth[i].pos.concat(topoPathsByDepth[i].neg);
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
    getTopoPathByDepth: function(pathsByDepth, outerShape) {
        let paths = pathsByDepth.paths;
        let topoByDepth = [];
        topoByDepth.push({
            pos: [outerShape],
            neg: paths[0],
            depth: 0
        });

        for (let i = 1; i < pathsByDepth.depths.length - 1; i++) {
            let xor = pathHelper.getXorOfPaths(paths[i], paths[i + 1]);
            let posxor = xor.filter(pathHelper.isPositivePath);
            let negxor = xor.filter(pathHelper.isNegativePath);

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
    getPathsByDepth: function(initialPaths, depths) {
        //sort paths  by depth
        let sorted = extruder.sortPathByDepth(initialPaths, depths);
        //remove duplicate depths values:
        depths = new Set(depths);
        depths = Array.from(depths);
        depths.sort(function(a, b) {
            return a - b;
        });
        //compute the paths for each depth:
        let res = [];

        //add zero depth
        if (depths[0] != 0) {
            depths = [0].concat(depths);
        }

        for (let i in depths) {
            //take only the paths of the holes which reach this depth
            let pathsAtThisDepth = extruder.getPathAtDepth(sorted, depths[i]);
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
    getPathAtDepth: function(pathAndDepth, depth) {
        let res = [];
        let pathAtDepth = pathAndDepth.filter((s) => s.depth >= depth);
        for (let i in pathAtDepth) {
            res.push(pathAtDepth[i].path);
        }
        return pathHelper.simplifyPaths(res);
    },

    /**
     * Sort initial path by depth.
     */
    sortPathByDepth: function(initialPaths, depths) {
        //sort paths by depth
        let pathAndDepth = [];
        for (let i in initialPaths) {
            pathAndDepth.push({
                path: initialPaths[i],
                depth: depths[i]
            });
        }
        pathAndDepth.sort(function(a, b) {
            return a.depth - b.depth
        });
        return pathAndDepth;
    }

};

module.exports = extruder;
