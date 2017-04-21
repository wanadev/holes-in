"use strict";

var clipperLib = require("clipper-lib");
var pathHelper = require("./path-helper.js");
var geomHelper = require("./geom-helper.js");
var cdt2dHelper = require("./cdt2d-helper.js");
var uvHelper = require("./uv-helper.js");
var exportHelper = require("./export-helper.js");
var babylonHelper = require("./babylon-helper.js");

var extruder = {

    /**
     * returns a mesh from an outer shape and holes
     */
    getGeometry: function getGeometry(outerShape, holes) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : { inMesh: true, outMesh: true, frontMesh: true, backMesh: true };

        //get the topology 2D paths by depth
        var data = extruder.getDataByDepth(outerShape, holes);
        var outerPathsByDepth = data.outerPathsByDepth;
        var innerPathsByDepth = data.innerPathsByDepth;
        var horrizontalPathsByDepth = data.horrizontalPathsByDepth;

        uvHelper.mapVertical(outerPathsByDepth, outerShape, options);

        var res = {};

        if (options.frontMesh) {
            res.frontMesh = extruder.getHorrizontalGeom(horrizontalPathsByDepth, [0], 0);
            uvHelper.mapHorrizontal(innerPathsByDepth, outerShape, res.frontMesh, options);
        }
        if (options.backMesh) {
            res.backMesh = extruder.getHorrizontalGeom(horrizontalPathsByDepth, [horrizontalPathsByDepth.length - 1], 0, false);
            uvHelper.mapHorrizontal(innerPathsByDepth, outerShape, res.backMesh, options);
        }
        if (options.inMesh) {
            uvHelper.mapVertical(innerPathsByDepth, outerShape, options);
            var indexes = [];
            for (var i = 1; i < horrizontalPathsByDepth.length - 1; i++) {
                indexes.push(i);
            }
            var inMeshHor = extruder.getHorrizontalGeom(horrizontalPathsByDepth, indexes, 0);

            var offset = 0;
            if (inMeshHor) {
                uvHelper.mapHorrizontal(innerPathsByDepth, outerShape, inMeshHor, options);
                offset = inMeshHor.offset;
            }

            var inMeshVert = extruder.getVerticalGeom(innerPathsByDepth, +offset, true);
            if (inMeshVert) {
                offset = inMeshVert.offset;
            }

            res.inMesh = geomHelper.mergeMeshes([inMeshHor, inMeshVert], false);
        }
        if (options.outMesh) {
            var outMesh = extruder.getVerticalGeom(outerPathsByDepth, 0, false);
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
            //for each point at each path at each depth we look for the corresponding point into the upper paths:
            for (var i in pathsAtDepth) {
                var path = pathsAtDepth[i];
                for (var indexPtDwn in path) {
                    var idxPtDwn = indexPtDwn;
                    var idxNPtDwn = (+indexPtDwn + 1) % path.length;
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
     * Returns the geometry of the inner horrizontal facess
     */
    getHorrizontalGeom: function getHorrizontalGeom(horrizontalPathsByDepth, indexes) {
        var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var invertNormal = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

        var horrGeom = [];
        for (var i in indexes) {
            var totaltopo = horrizontalPathsByDepth[indexes[i]].paths;
            var triangles = cdt2dHelper.computeTriangulation(totaltopo);
            triangles.depth = horrizontalPathsByDepth[indexes[i]].depth;
            var horrGeomAtDepth = geomHelper.getHorrizontalGeom(triangles, offset = 0, invertNormal);
            horrGeom.push(horrGeomAtDepth);
        }
        // get points, normal and faces from it:
        return geomHelper.mergeMeshes(horrGeom, false);
    },

    getDataByDepth: function getDataByDepth(outerShape, holes) {
        var outerPaths = [];
        var innerPaths = [];
        var horrizontalPaths = [];

        pathHelper.scaleUpPath(outerShape.path);
        for (var i in holes) {
            pathHelper.scaleUpPath(holes[i].path);
        }
        var holesByDepth = extruder.getHolesByDepth(holes, outerShape);
        var outer = [outerShape.path];
        var stack = 0;
        for (var _i = holesByDepth.length - 1; _i >= 0; _i--) {
            //compute the outer path:
            var removeFromOuter = pathHelper.getUnionOfPaths(holesByDepth[_i].keep.concat(holesByDepth[_i].stop));

            outer = pathHelper.getDiffOfPaths(outer, removeFromOuter);
            outer = pathHelper.simplifyPaths(pathHelper.getUnionOfPaths(outer));
            outerPaths.push(outer);

            //fit the inner paths into the outer:
            var innerPath = pathHelper.getInterOfPaths(holesByDepth[Math.max(_i - 1, 0)].keep, outer);
            innerPath = pathHelper.simplifyPaths(pathHelper.getUnionOfPaths(innerPath));
            innerPaths.push(innerPath);
            //computes the horrizontal Geom:
            var horrizontalPath = void 0;
            if (_i === 0 || _i === holesByDepth.length - 1) {
                horrizontalPath = JSON.parse(JSON.stringify(outer.concat(innerPath)));
            } else {

                var horrizontalPathOut = pathHelper.getDiffOfPaths(outerPaths[Math.max(stack - 1, 0)], outerPaths[stack]);
                var horrizontalPathIn = pathHelper.getUnionOfPaths(holesByDepth[_i].stop);
                horrizontalPath = pathHelper.getUnionOfPaths(horrizontalPathOut, horrizontalPathIn);
                horrizontalPath = pathHelper.getDiffOfPaths(horrizontalPath, holesByDepth[_i].keep);
            }
            horrizontalPaths.push(horrizontalPath);
            stack++;
        }

        for (var _i2 in outerPaths) {

            pathHelper.setDirectionPaths(outerPaths[_i2], -1);
            pathHelper.setDirectionPaths(innerPaths[_i2], -1);
            pathHelper.setDirectionPaths(horrizontalPaths[_i2], 1);
            pathHelper.scaleDownPaths(outerPaths[_i2]);
            pathHelper.scaleDownPaths(innerPaths[_i2]);

            outerPaths[_i2] = pathHelper.simplifyPaths(outerPaths[_i2]);
            // pathHelper.scaleDownPaths(horrizontalPaths[i]);
        }
        pathHelper.scaleDownPath(outerShape.path);

        for (var _i3 in holes) {
            if (!holes[_i3].path) {
                continue;
            }
            pathHelper.scaleDownPath(holes[_i3].path);
        }

        outerPaths = outerPaths.reverse();
        innerPaths = innerPaths.reverse();
        horrizontalPaths = horrizontalPaths.reverse();

        for (var _i4 in holesByDepth) {
            outerPaths[_i4] = { paths: outerPaths[_i4], depth: holesByDepth[_i4].depth };
            innerPaths[_i4] = { paths: innerPaths[_i4], depth: holesByDepth[_i4].depth };
            horrizontalPaths[_i4] = { paths: horrizontalPaths[_i4], depth: holesByDepth[_i4].depth };
        }
        return { outerPathsByDepth: outerPaths,
            innerPathsByDepth: innerPaths,
            horrizontalPathsByDepth: horrizontalPaths };
    },

    /**
     *  Takes an array of paths representing holes at different depths.
     *  One depth value/ path.
     *  returns an array of paths at each depth: simplify the geometry for each stage.
     */
    getHolesByDepth: function getHolesByDepth(holes, outerShape) {

        //sets all depths deeper than outerDepth  or equals to 0 to outerDepth:
        holes.map(function (elt) {
            elt.depth >= outerShape.depth || elt.depth === 0 ? elt.depth = outerShape.depth + 1 : elt.depth = elt.depth;
        });

        holes.map(function (elt) {
            pathHelper.setDirectionPath(elt.path, 1);
        });

        //get all depths:
        var depths = new Set();
        for (var i in holes) {
            if (holes[i].depth < outerShape.depth) depths.add(holes[i].depth);
        }
        depths.add(0);
        depths.add(outerShape.depth);
        depths = Array.from(depths);
        depths.sort(function (a, b) {
            return a - b;
        });

        //fit paths into outer:
        for (var _i5 in holes) {
            holes[_i5].path = pathHelper.getInterOfPaths([holes[_i5].path], [outerShape.path])[0];
        }
        //filter:
        holes = holes.filter(function (hole) {
            return hole.path !== undefined;
        });
        for (var _i6 in holes) {
            pathHelper.displaceColinearEdges(outerShape.path, holes[_i6].path);
        }

        //get paths by depth:
        var res = [];

        var _loop = function _loop(_i7) {
            var deeperHoles = holes.filter(function (s) {
                return s.depth > depths[_i7];
            });
            var keep = [];
            deeperHoles.map(function (s) {
                return keep.push(s.path);
            });

            var stopHoles = holes.filter(function (s) {
                return s.depth === depths[_i7];
            });
            var stop = [];
            stopHoles.map(function (s) {
                return stop.push(s.path);
            });

            //take only the paths of the holes which reach this depth
            res.push({
                keep: keep,
                stop: stop,
                depth: depths[_i7]
            });
        };

        for (var _i7 in depths) {
            _loop(_i7);
        }
        return res;
    }

};

module.exports = extruder;