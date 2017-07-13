"use strict";

var pathHelper = require("./path-helper.js");
var geomHelper = require("./geom-helper.js");
var cdt2dHelper = require("./cdt2d-helper.js");
var uvHelper = require("./uv-helper.js");
var babylonHelper = require("./babylon-helper.js");

var extruder = {

    /**
     * returns a mesh from an outer shape and holes
     */
    getGeometry: function getGeometry(outerShape, holes) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : { inMesh: true, outMesh: true, frontMesh: true, backMesh: true, horizontalMesh: true, doNotBuild: [] };


        // get the topology 2D paths by depth
        var data = extruder.getDataByDepth(outerShape, holes);
        var outerPathsByDepth = data.outerPathsByDepth;
        var innerPathsByDepth = data.innerPathsByDepth;
        var horizontalPathsByDepth = data.horizontalPathsByDepth;

        if (options.doNotBuild) {
            pathHelper.scaleUpPaths(options.doNotBuild);
            extruder.markAsForbidden(outerPathsByDepth, options.doNotBuild);
            extruder.markAsForbidden(innerPathsByDepth, options.doNotBuild);
        }

        uvHelper.mapVertical(outerPathsByDepth, outerShape, options);

        var res = {};

        if (options.frontMesh) {
            res.frontMesh = extruder.getHorizontalGeom(horizontalPathsByDepth, innerPathsByDepth, [0], 0, true);
            uvHelper.mapHorizontal(innerPathsByDepth, outerShape, res.frontMesh, options);
        }
        if (options.backMesh) {
            res.backMesh = extruder.getHorizontalGeom(horizontalPathsByDepth, innerPathsByDepth, [horizontalPathsByDepth.length - 1], 0, false);
            uvHelper.mapHorizontal(innerPathsByDepth, outerShape, res.backMesh, options);
        }
        if (options.inMesh) {
            uvHelper.mapVertical(innerPathsByDepth, outerShape, options);
            res.inMesh = extruder.getVerticalGeom(innerPathsByDepth, 0, true);
        }
        if (options.horizontalMesh) {
            var indexes = [];
            for (var i = 1; i < horizontalPathsByDepth.length - 1; i++) {
                indexes.push(i);
            }
            var meshHor = extruder.getHorizontalGeom(horizontalPathsByDepth, innerPathsByDepth, indexes, 0);
            if (meshHor) {
                uvHelper.mapHorizontal(innerPathsByDepth, outerShape, meshHor, options);
            }
            res.horizontalMesh = meshHor;
        }
        if (options.outMesh) {
            var outMesh = extruder.getVerticalGeom(outerPathsByDepth, null, 0, false);
            res.outMesh = outMesh;
        }

        if (options.swapToBabylon) {
            babylonHelper.swapAllToBabylon(res);
        }
        return res;
    },
    getVerticalGeom: function getVerticalGeom(innerPathsByDepth) {
        var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var invertNormal = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        var geom = [];

        for (var indexDepth = innerPathsByDepth.length - 1; indexDepth > 0; indexDepth--) {
            var pathsAtDepth = innerPathsByDepth[indexDepth].paths;
            // for each point at each path at each depth we look for the corresponding point into the upper paths:
            for (var i = 0; i < pathsAtDepth.length; i++) {
                var path = pathsAtDepth[i];
                for (var idxPtDwn = 0; idxPtDwn < path.length; idxPtDwn++) {
                    var idxNPtDwn = (idxPtDwn + 1) % path.length;
                    if (path[idxPtDwn]._holesInForbidden) continue;

                    var currgeom = geomHelper.getOneVerticalGeom(idxPtDwn, idxNPtDwn, +indexDepth, path, innerPathsByDepth, +offset, invertNormal);
                    if (!currgeom) {
                        continue;
                    }
                    geom.push(currgeom);
                    offset = currgeom.offset;
                }
            }
        }
        return geomHelper.mergeMeshes(geom, false);
    },


    /**
     * Returns the geometry of the inner horizontal facess
     */
    getHorizontalGeom: function getHorizontalGeom(horizontalPathsByDepth, innerPathsByDepth, indexes) {
        var offset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
        var invertNormal = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;

        var horrGeom = [];
        for (var i = 0; i < indexes.length; i++) {
            var innerPaths = innerPathsByDepth[indexes[i]].paths;
            var paths = horizontalPathsByDepth[indexes[i]].paths;
            var triangles = cdt2dHelper.computeTriangulation(paths);
            triangles.depth = horizontalPathsByDepth[indexes[i]].depth;
            horrGeom.push(geomHelper.getHorizontalGeom(triangles, 0, invertNormal));
        }
        // get points, normal and faces from it:
        return geomHelper.mergeMeshes(horrGeom, true);
    },
    getDataByDepth: function getDataByDepth(outerShape, holes) {
        var outerPaths = [];
        var innerPaths = [];
        var horizontalPaths = [];

        pathHelper.scaleUpPath(outerShape.path);
        for (var i = 0; i < holes.length; i++) {
            pathHelper.scaleUpPath(holes[i].path);
        }
        holes = holes.map(function (hole) {
            return { path: pathHelper.offsetPath(hole.path), depth: hole.depth };
        });

        var holesByDepth = extruder.getHolesByDepth(holes, outerShape);
        var stack = 0;

        for (var _i = 0; _i < holesByDepth.length; _i++) {

            var outer = JSON.parse(JSON.stringify([outerShape.path]));

            var removeFromOuter = pathHelper.getUnionOfPaths(holesByDepth[_i].keep.concat(holesByDepth[_i].stop));
            outer = pathHelper.getDiffOfPaths(outer, removeFromOuter);
            outer = pathHelper.getUnionOfPaths(outer);
            outer = pathHelper.cleanPaths(outer, 20);
            outerPaths.push(outer);

            // fit the inner paths into the outer:
            var innerPath = pathHelper.getInterOfPaths(holesByDepth[Math.max(_i - 1, 0)].keep, outer);
            innerPath = pathHelper.getUnionOfPaths(innerPath);
            innerPaths.push(innerPath);

            //finds the horizontatl path:
            var horr = JSON.parse(JSON.stringify([outerShape.path]));
            if (holesByDepth[_i].stop.length > 0) {
                horr = pathHelper.getInterOfPaths(horr, holesByDepth[_i].stop);
            }
            // let inneAtThisDepth = pathHelper.getInterOfPaths(horr, holesByDepth[i].keep);
            horr = pathHelper.getDiffOfPaths(horr, holesByDepth[_i].keep);
            horr = pathHelper.cleanPaths(horr, 20);
            horizontalPaths.push(horr);
        }

        for (var _i2 = 0; _i2 < outerPaths.length; _i2++) {
            outerPaths[_i2] = pathHelper.cleanPaths(outerPaths[_i2], 3);
            innerPaths[_i2] = pathHelper.cleanPaths(innerPaths[_i2], 3);
            horizontalPaths[_i2] = pathHelper.cleanPaths(horizontalPaths[_i2], 3);

            pathHelper.setDirectionPaths(outerPaths[_i2], -1);
            pathHelper.setDirectionPaths(innerPaths[_i2], -1);
            pathHelper.setDirectionPaths(horizontalPaths[_i2], -1);
        }

        for (var _i3 = 0; _i3 < holesByDepth.length; _i3++) {
            outerPaths[_i3] = { paths: outerPaths[_i3], depth: holesByDepth[_i3].depth };
            innerPaths[_i3] = { paths: innerPaths[_i3], depth: holesByDepth[_i3].depth };
            horizontalPaths[_i3] = { paths: horizontalPaths[_i3], depth: holesByDepth[_i3].depth };
        }

        return { outerPathsByDepth: outerPaths,
            innerPathsByDepth: innerPaths,
            horizontalPathsByDepth: horizontalPaths,
            holesByDepth: holesByDepth };
    },


    /**
     *  Takes an array of paths representing holes at different depths.
     *  One depth value/ path.
     *  returns an array of paths at each depth: simplify the geometry for each stage.
     */
    getHolesByDepth: function getHolesByDepth(holes, outerShape) {

        // sets all depths deeper than outerDepth  or equals to 0 to outerDepth:
        holes.forEach(function (elt) {
            elt.depth >= outerShape.depth || elt.depth === 0 ? elt.depth = outerShape.depth + 1 : elt.depth = elt.depth; // eslint-disable-line
        });

        holes.forEach(function (elt) {
            if (!elt.path) return;
            pathHelper.setDirectionPath(elt.path, 1);
        });

        // get all depths:
        var depths = new Set();
        for (var i = 0; i < holes.length; i++) {
            if (holes[i].depth < outerShape.depth) {
                depths.add(holes[i].depth);
            }
        }
        depths.add(0);
        depths.add(outerShape.depth);
        depths = Array.from(depths);
        depths.sort(function (a, b) {
            return a - b;
        });

        // filter:
        holes = holes.filter(function (hole) {
            return hole.path !== undefined;
        });
        for (var _i4 = 0; _i4 < holes.length; _i4++) {}
        // pathHelper.displaceColinearEdges(outerShape.path, holes[i].path);


        // get paths by depth:
        var res = [];

        var _loop = function _loop(_i5) {
            var deeperHoles = holes.filter(function (s) {
                return s.depth > depths[_i5];
            });
            var keep = [];
            deeperHoles.forEach(function (s) {
                return keep.push(s.path);
            });

            var stopHoles = holes.filter(function (s) {
                return s.depth === depths[_i5];
            });
            var stop = [];
            stopHoles.forEach(function (s) {
                return stop.push(s.path);
            });

            // take only the paths of the holes which reach this depth
            res.push({
                keep: keep,
                stop: stop,
                depth: depths[_i5]
            });
        };

        for (var _i5 = 0; _i5 < depths.length; _i5++) {
            _loop(_i5);
        }

        // gets the difference between keep and stop:
        for (var _i6 = 0; _i6 < depths.length; _i6++) {
            res[_i6].stop = pathHelper.getDiffOfPaths(res[_i6].stop, res[_i6].keep);
        }

        for (var _i7 = 0; _i7 < depths.length; _i7++) {
            res[_i7].stop = pathHelper.getUnionOfPaths(res[_i7].stop);
            res[_i7].keep = pathHelper.getUnionOfPaths(res[_i7].keep);
        }

        return res;
    },


    // mark all points that bbelong to one of the edges as forbidden
    markAsForbidden: function markAsForbidden(pathsByDepth, edges) {
        for (var j = 0; j < edges.length; j++) {
            var edge = edges[j];
            for (var i = pathsByDepth.length - 1; i >= 0; i--) {
                var paths = pathsByDepth[i].paths;
                for (var k = 0; k < paths.length; k++) {
                    var path = paths[k];
                    var toMark = pathHelper.getPointsOnEdge(path, edge);
                    toMark.map(function (pt) {
                        return pt._holesInForbidden = true;
                    });
                }
            }
        }
    }
};

module.exports = extruder;