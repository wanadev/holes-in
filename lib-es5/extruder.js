"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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
            res.frontMesh = extruder.getHorizontalGeom(horizontalPathsByDepth, [0], 0);
            uvHelper.mapHorizontal(innerPathsByDepth, outerShape, res.frontMesh, options);
        }
        if (options.backMesh) {
            res.backMesh = extruder.getHorizontalGeom(horizontalPathsByDepth, [horizontalPathsByDepth.length - 1], 0, false);
            uvHelper.mapHorizontal(innerPathsByDepth, outerShape, res.backMesh, options);
        }
        if (options.inMesh) {
            uvHelper.mapVertical(innerPathsByDepth, outerShape, options);
            res.inMesh = extruder.getVerticalGeom(innerPathsByDepth, outerPathsByDepth, 0, true);
        }
        if (options.horizontalMesh) {
            var indexes = [];
            for (var i = 1; i < horizontalPathsByDepth.length - 1; i++) {
                indexes.push(i);
            }
            var meshHor = extruder.getHorizontalGeom(horizontalPathsByDepth, indexes, 0);
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
    getVerticalGeom: function getVerticalGeom(innerPathsByDepth, toMarkPaths) {
        var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var invertNormal = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

        var geom = [];

        for (var indexDepth = innerPathsByDepth.length - 1; indexDepth > 0; indexDepth--) {
            var pathsAtDepth = innerPathsByDepth[indexDepth].paths;
            // for each point at each path at each depth we look for the corresponding point into the upper paths:
            for (var i = 0; i < pathsAtDepth.length; i++) {
                var path = pathsAtDepth[i];
                for (var idxPtDwn = 0; idxPtDwn < path.length; idxPtDwn++) {
                    var idxNPtDwn = (idxPtDwn + 1) % path.length;
                    var currgeom = geomHelper.getOneVerticalGeom(idxPtDwn, idxNPtDwn, +indexDepth, path, innerPathsByDepth, toMarkPaths, +offset, invertNormal);
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
    getHorizontalGeom: function getHorizontalGeom(horizontalPathsByDepth, indexes) {
        var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var invertNormal = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

        var horrGeom = [];

        var _loop = function _loop(i) {

            var allTriangles = horizontalPathsByDepth[indexes[i]].paths.map(function (path) {
                return cdt2dHelper.computeTriangulation([path]);
            });
            var allGeoms = allTriangles.map(function (triangles) {
                triangles.depth = horizontalPathsByDepth[indexes[i]].depth;
                return geomHelper.getHorizontalGeom(triangles, 0, invertNormal);
            });
            horrGeom.push.apply(horrGeom, _toConsumableArray(allGeoms));
        };

        for (var i = 0; i < indexes.length; i++) {
            _loop(i);
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
        var holesByDepth = extruder.getHolesByDepth(holes, outerShape);
        var outer = [outerShape.path];
        var stack = 0;
        for (var _i = holesByDepth.length - 1; _i >= 0; _i--) {
            // compute the outer path:
            var removeFromOuter = pathHelper.getUnionOfPaths(holesByDepth[_i].keep.concat(holesByDepth[_i].stop));

            outer = pathHelper.getDiffOfPaths(outer, removeFromOuter);
            outer = pathHelper.simplifyPaths(pathHelper.getUnionOfPaths(outer));
            outerPaths.push(outer);

            // fit the inner paths into the outer:
            var innerPath = pathHelper.getInterOfPaths(holesByDepth[Math.max(_i - 1, 0)].keep, outer);
            innerPath = pathHelper.simplifyPaths(pathHelper.getUnionOfPaths(innerPath));
            innerPaths.push(innerPath);
            // computes the horizontal Geom:
            var horizontalPath = void 0;
            if (_i === 0 || _i === holesByDepth.length - 1) {
                horizontalPath = JSON.parse(JSON.stringify(outer.concat(innerPath)));
            } else {
                // fit holes that stops at this depth into the outer:
                horizontalPath = pathHelper.getInterOfPaths(holesByDepth[_i].stop, outerPaths[Math.max(stack - 1, 0)]);
                horizontalPath = pathHelper.simplifyPaths(horizontalPath);
            }
            horizontalPaths.push(horizontalPath);
            stack++;
        }
        for (var _i2 = 0; _i2 < outerPaths.length; _i2++) {
            outerPaths[_i2] = pathHelper.cleanPaths(outerPaths[_i2], 3);
            innerPaths[_i2] = pathHelper.cleanPaths(innerPaths[_i2], 3);
            horizontalPaths[_i2] = pathHelper.cleanPaths(horizontalPaths[_i2], 3);

            pathHelper.setDirectionPaths(outerPaths[_i2], -1);
            pathHelper.setDirectionPaths(innerPaths[_i2], -1);
            pathHelper.setDirectionPaths(horizontalPaths[_i2], -1);
        }

        outerPaths = outerPaths.reverse();
        innerPaths = innerPaths.reverse();
        horizontalPaths = horizontalPaths.reverse();

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
        holes.map(function (elt) {
            // eslint-disable-line
            elt.depth >= outerShape.depth || elt.depth === 0 ? elt.depth = outerShape.depth + 1 : elt.depth = elt.depth; // eslint-disable-line
        });

        holes.map(function (elt) {
            // eslint-disable-line
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
        for (var _i4 = 0; _i4 < holes.length; _i4++) {
            pathHelper.displaceColinearEdges(outerShape.path, holes[_i4].path);
        }

        // get paths by depth:
        var res = [];

        var _loop2 = function _loop2(_i5) {
            var deeperHoles = holes.filter(function (s) {
                return s.depth > depths[_i5];
            });
            var keep = [];
            deeperHoles.map(function (s) {
                return keep.push(s.path);
            });

            var stopHoles = holes.filter(function (s) {
                return s.depth === depths[_i5];
            });
            var stop = [];
            stopHoles.map(function (s) {
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
            _loop2(_i5);
        }

        // gets the difference between keep and stop:
        for (var _i6 = 0; _i6 < depths.length; _i6++) {
            res[_i6].stop = pathHelper.getDiffOfPaths(res[_i6].stop, res[_i6].keep);
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