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
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};


        options = Object.assign(extruder.getDefaultOptions(), options);

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

        if (options.swapToBabylon) {
            babylonHelper.swapAllToBabylon(res);
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
            var paths = horizontalPathsByDepth[indexes[i]].paths; //.concat(innerPaths);
            var triangles = cdt2dHelper.computeTriangulation(paths);
            triangles.depth = horizontalPathsByDepth[indexes[i]].depth;
            horrGeom.push(geomHelper.getHorizontalGeom(triangles, 0, invertNormal));
        }
        // get points, normal and faces from it:
        return geomHelper.mergeMeshes(horrGeom);
    },

    /*
        getDataByDepth(outerShape, holes) {
            let outerPaths = [];
            let innerPaths = [];
            let horizontalPaths = [];
    
            pathHelper.scaleUpPath(outerShape.path);
            for (let i = 0; i < holes.length; i++) {
                pathHelper.scaleUpPath(holes[i].path);
            }
            holes = holes.map(hole => ({path: pathHelper.offsetPath(hole.path), depth: hole.depth }) );
    
            const holesByDepth = extruder.getHolesByDepth(holes, outerShape);
    
            let stackOuter = [];
            for (let i = 0; i < holesByDepth.length; i++) {
    
                let outer = JSON.parse(JSON.stringify(outerShape.paths));
    
                const removeFromOuter = pathHelper.getUnionOfPaths(holesByDepth[i].keep.concat(holesByDepth[i].stop));
                outer = pathHelper.getDiffOfPaths(outer, removeFromOuter);
                outer = pathHelper.getUnionOfPaths(outer);
                outer.push(...holesByDepth[i].outer);
                outer = pathHelper.cleanPaths(outer,20);
                outerPaths.push(outer);
    
                // fit the inner paths into the outer:
                let innerPath = pathHelper.getInterOfPaths(holesByDepth[Math.max(i-1, 0)].keep, outer);
                innerPath = pathHelper.getUnionOfPaths(innerPath);
                innerPaths.push(innerPath);
    
                //finds the horizontatl path:
                let horr = JSON.parse(JSON.stringify(outerShape.paths));
                if(holesByDepth[i].stop.length > 0) {
                    horr = pathHelper.getInterOfPaths(horr, holesByDepth[i].stop);
                }
    
                // Adding non-holes in holes
                const nonHolesHorr = (i === 0) ? holesByDepth[i].outer :
                    (i === holesByDepth.length - 1) ?  holesByDepth[i].outer :
                    pathHelper.getDiffOfPaths(holesByDepth[i+1].outer,holesByDepth[i].outer);
    
                horr = pathHelper.getDiffOfPaths(horr,holesByDepth[i].keep);
                horr.push(...nonHolesHorr);
    
                horr = pathHelper.cleanPaths(horr, 20);
    
                horizontalPaths.push(horr)
            }
    
            for (let i = 0; i < outerPaths.length; i++) {
                outerPaths[i] = pathHelper.cleanPaths(outerPaths[i],3);
                innerPaths[i] = pathHelper.cleanPaths(innerPaths[i],3);
                horizontalPaths[i] = pathHelper.cleanPaths(horizontalPaths[i],3);
    
                pathHelper.setDirectionPaths(outerPaths[i], -1);
                pathHelper.setDirectionPaths(innerPaths[i], -1);
                pathHelper.setDirectionPaths(horizontalPaths[i], -1);
            }
    
            for (let i = 0; i < holesByDepth.length; i++) {
                outerPaths[i] = { paths: outerPaths[i], depth: holesByDepth[i].depth };
                innerPaths[i] = { paths: innerPaths[i], depth: holesByDepth[i].depth };
                horizontalPaths[i] = { paths: horizontalPaths[i], depth: holesByDepth[i].depth };
            }
    
            return { outerPathsByDepth: outerPaths,
                innerPathsByDepth: innerPaths,
                horizontalPathsByDepth: horizontalPaths,
                holesByDepth };
        },*/

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
        holes = holes.map(function (hole) {
            return { path: pathHelper.offsetPath(hole.path), depth: hole.depth };
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


    /**
     *  Takes an array of paths representing holes at different depths.
     *  One depth value/ path.
     *  returns an array of paths at each depth: simplify the geometry for each stage.
     */
    /*getHolesByDepth(holes, outerShape) {
        if (!outerShape.paths) outerShape.paths = [outerShape.path];
         holes.forEach(hole => {
            if(hole.depth !== 0) return;
            if(pathHelper.getDiffOfPaths([hole.path], outerShape.paths).length === 0 ) return;
            outerShape.paths = pathHelper.getDiffOfPaths(outerShape.paths, [hole.path]);
        })
         // sets all depths deeper than outerDepth  or equals to 0 to outerDepth:
        holes.forEach(elt => {
             (elt.depth >= outerShape.depth || elt.depth === 0) ? elt.depth = outerShape.depth + 1 : elt.depth = elt.depth; // eslint-disable-line
        });
         holes.forEach(elt => {
            if(!elt.path) return;
            // TODO: remove to use holes in holes
            pathHelper.setDirectionPath(elt.path, 1);
        });
         // get all depths:
        let depths = new Set();
        for (let i = 0; i < holes.length; i++) {
            if (holes[i].depth < outerShape.depth) { depths.add(holes[i].depth); }
        }
        depths.add(0);
        depths.add(outerShape.depth);
        depths = Array.from(depths);
        depths.sort(
            function (a, b) {
                return a - b;
            });
          // filter:
        holes = holes.filter(hole => hole.path !== undefined);
         // get paths by depth:
        const res = [];
        for (let i = 0; i < depths.length; i++) {
            const deeperHoles = holes.filter(s => s.depth > depths[i]);
            const keep = [];
            deeperHoles.forEach(s => keep.push(s.path));
             const stopHoles = holes.filter(s => s.depth === depths[i]);
            const stop = [];
            stopHoles.forEach(s => stop.push(s.path));
             // take only the paths of the holes which reach this depth
            res.push({
                keep,
                stop,
                depth: depths[i],
            });
        }
         // gets the difference between keep and stop:
        for (let i = 0; i < depths.length; i++) {
            res[i].stop = pathHelper.getDiffOfPaths(res[i].stop, res[i].keep);
        }
         for (let i = 0; i < depths.length; i++) {
            const keepAndStop = pathHelper.getUnionOfPaths(res[i].keep.concat(res[i].stop));
            res[i].outer = keepAndStop.filter(path => pathHelper.getDirectionPath(path) < 0);
             res[i].stop = pathHelper.getUnionOfPaths(res[i].stop);
            res[i].keep = pathHelper.getUnionOfPaths(res[i].keep);
        }
         return res;
    },*/

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
            doNotBuild: []
        };
    }
};

module.exports = extruder;