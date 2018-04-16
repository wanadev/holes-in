"use strict";

var pathHelper = require("./path-helper.js");
var geomHelper = require("./geom-helper.js");
var cdt2dHelper = require("./cdt2d-helper.js");
var uvHelper = require("./uv-helper.js");
var constants = require("./constants.js");

var extruder = {

    /**
     * returns a mesh from an outer shape and holes
     */
    getGeometry: function getGeometry(outerShape, holes) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};


        options = Object.assign(extruder.getDefaultOptions(), options);
        extruder.convertInputToHolesInConvention(outerShape, holes);
        extruder.generateDebugLink(outerShape, holes, options);

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
            res.inMesh = extruder.getVerticalGeom(innerPathsByDepth, 0, true, options.mergeVerticalGeometries);
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
            var outMesh = extruder.getVerticalGeom(outerPathsByDepth, 0, true, options.mergeVerticalGeometries);
            res.outMesh = outMesh;
        }

        return res;
    },
    getVerticalGeom: function getVerticalGeom(innerPathsByDepth) {
        var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var invertNormal = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var mergeMeshes = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

        var geom = [];

        for (var indexDepth = innerPathsByDepth.length - 1; indexDepth > 0; indexDepth--) {
            var pathsAtDepth = innerPathsByDepth[indexDepth].paths;
            // for each point at each path at each depth we look for the corresponding point into the upper paths:
            for (var i = 0; i < pathsAtDepth.length; i++) {
                var path = pathsAtDepth[i];
                for (var idxPtDwn = 0; idxPtDwn < path.length; idxPtDwn++) {
                    var idxNPtDwn = (idxPtDwn + 1) % path.length;
                    if (path[idxPtDwn]._holesInForbidden) continue;

                    var currgeom = geomHelper.getOneVerticalGeom(idxPtDwn, idxNPtDwn, +indexDepth, path, innerPathsByDepth, 0, invertNormal);
                    if (!currgeom) {
                        continue;
                    }
                    geom.push(currgeom);
                }
            }
        }
        if (mergeMeshes) {
            return geomHelper.mergeMeshes(geom);
        }
        return geom;
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
        return geomHelper.mergeMeshes(horrGeom);
    },
    getDataByDepth: function getDataByDepth(outerShape, holes) {
        // sets all depths deeper than outerDepth  or equals to 0 to outerDepth:
        holes.forEach(function (elt) {
            elt.depth >= outerShape.depth || elt.depth === 0 ? elt.depth = outerShape.depth + 1 : elt.depth = elt.depth; // eslint-disable-line
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
        holes.forEach(function (hole) {
            return pathHelper.scaleUpPath(hole.path);
        });

        pathHelper.scaleUpPath(outerShape.path);

        var outerPaths = [];
        var innerPaths = [];
        var horriPaths = [];

        depths.forEach(function (depth, i) {
            var keep = holes.filter(function (hole) {
                return hole.depth >= depth;
            }).map(function (hole) {
                return hole.path;
            });
            var diff = pathHelper.getDiffOfPaths([outerShape.path], keep, { polyTree: false });

            var outerPathAtDepth = diff.filter(function (path) {
                return pathHelper.getDirectionPath(path) > 0;
            });
            var innerPathAtDepth = diff.filter(function (path) {
                return pathHelper.getDirectionPath(path) < 0;
            });

            outerPaths.push({ paths: pathHelper.cleanPaths(outerPathAtDepth, 20), depth: depth });
            innerPaths.push({ paths: pathHelper.cleanPaths(innerPathAtDepth, 20), depth: depth });

            var horr = void 0;
            if (i === 0) {
                horr = outerPathAtDepth.concat(innerPathAtDepth);
            } else {
                keep = holes.filter(function (hole) {
                    return hole.depth > depth;
                }).map(function (hole) {
                    return hole.path;
                });
                var stop = pathHelper.getUnionOfPaths(holes.filter(function (hole) {
                    return hole.depth === depth;
                }).map(function (hole) {
                    return hole.path;
                }));
                horr = [JSON.parse(JSON.stringify(outerShape.path))];
                if (stop.length > 0) {
                    horr = pathHelper.getInterOfPaths(horr, stop, { pathPreProcess: false });
                }
                horr = pathHelper.getDiffOfPaths(horr, keep, { pathPreProcess: false });
                horr = pathHelper.cleanPaths(horr, 20);
            }
            horriPaths.push({ paths: horr, depth: depth });
        });
        var allHorrizontals = horriPaths.map(function (elt) {
            return elt.paths;
        });
        horriPaths[horriPaths.length - 1].paths = outerPaths[outerPaths.length - 1].paths.concat(innerPaths[innerPaths.length - 1].paths);
        return { outerPathsByDepth: outerPaths,
            innerPathsByDepth: innerPaths,
            horizontalPathsByDepth: horriPaths,
            depthsCount: outerPaths.length
        };
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
    },
    getDefaultOptions: function getDefaultOptions() {
        return {
            inMesh: true,
            outMesh: true,
            frontMesh: true,
            backMesh: true,
            horizontalMesh: true,
            mergeVerticalGeometries: true,
            doNotBuild: [],
            debug: false
        };
    },
    generateDebugLink: function generateDebugLink(outerShape, holes, options) {
        if (options.debug) {
            try {
                var pako = require("pako");
                var data64 = pako.deflate(JSON.stringify({ holes: holes, outerShape: outerShape, doNotBuild: options.doNotBuild }));
                var urlParam = "data=" + encodeURIComponent(data64);
                console.info("Holes in debug: https://wanadev.github.io/holes-in/debugPage.html?" + urlParam);
            } catch (error) {
                console.warn("error on holes-in generate debug link. You may need to install pako", error);
            }
        }
    },
    convertInputToHolesInConvention: function convertInputToHolesInConvention(outerShape, holes) {
        outerShape.path = extruder.convertPathToHolesInConvention(outerShape.path);
        holes.forEach(function (hole) {
            return hole.path = extruder.convertPathToHolesInConvention(hole.path);
        });
    },


    // checks if there is X,Y coordinates, if not uses x,y
    convertPathToHolesInConvention: function convertPathToHolesInConvention(path) {
        return path.map(function (point) {
            return {
                X: point.X !== undefined ? point.X : point.x,
                Y: point.Y !== undefined ? point.Y : point.y
            };
        });
    }
};

module.exports = extruder;