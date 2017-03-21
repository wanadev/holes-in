"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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
    getGeometry: function getGeometry(outerShape, holes, options) {
        //get the topology 2D paths by depth

        var pathsByDepth = extruder.getPathsByDepth(holes, outerShape);
        var outerPathsByDepth = extruder.getOuterPathsByDepth(pathsByDepth, outerShape);
        var topoPathsByDepth = extruder.getTopoPathByDepth(pathsByDepth, outerPathsByDepth, options);
        extruder.scaleDownHoles(holes);
        extruder.scaleDownTopoByDepth(topoPathsByDepth, outerShape);
        extruder.scaleDownPathsByDepth(pathsByDepth);
        extruder.scaleDownOuterPathsByDepth(outerPathsByDepth);
        extruder.setDirectionPaths(pathsByDepth, outerPathsByDepth, topoPathsByDepth);
        //set all paths to positive:


        // uvHelper.mapVertical(pathsByDepth, outerShape, options);
        var res = {};
        if (options.frontMesh) {
            res.frontMesh = extruder.getInnerHorizontalGeom(topoPathsByDepth, {
                frontMesh: true
            });
            uvHelper.getUVHorFaces(pathsByDepth, outerShape, res.frontMesh, options);
        }
        if (options.backMesh) {
            res.backMesh = extruder.getInnerHorizontalGeom(topoPathsByDepth, {
                backMesh: true
            });
            uvHelper.getUVHorFaces(pathsByDepth, outerShape, res.backMesh, options);
        }
        if (options.inMesh) {
            uvHelper.mapVertical(pathsByDepth, outerShape, options);
            // let inMeshHor;
            var inMeshHor = extruder.getInnerHorizontalGeom(topoPathsByDepth, {
                inMesh: true
            });

            var offset = 0;
            if (inMeshHor) {
                uvHelper.getUVHorFaces(pathsByDepth, outerShape, inMeshHor, options);
                offset = inMeshHor.offset;
            }

            var inMeshVert = extruder.getInnerVerticalGeom(pathsByDepth, +offset);
            res.inMesh = geomHelper.mergeMeshes([inMeshHor, inMeshVert], false);
        }

        if (options.outMesh) {
            uvHelper.mapVertical(outerPathsByDepth, outerShape, options);
            var outMesh = extruder.getInnerVerticalGeom(outerPathsByDepth, 0);
            res.outMesh = outMesh;
        }

        if (options.swapToBabylon) {
            babylonHelper.swapAllToBabylon(res);
        }

        return res;
    },

    getInnerVerticalGeom: function getInnerVerticalGeom(pathsByDepth) {
        var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        var geom = [];
        for (var indexDepth = pathsByDepth.length - 1; indexDepth > 0; indexDepth--) {
            var pathsAtDepth = pathsByDepth[indexDepth].paths;
            //for each point at each path at each depth we look for the corresponding point into the upper paths:
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = pathsAtDepth[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var path = _step.value;

                    for (var indexPtDwn in path) {
                        var idxPtDwn = indexPtDwn;
                        var idxNPtDwn = (+indexPtDwn + 1) % path.length;
                        var currgeom = geomHelper.getOneInnerVerticalGeom(idxPtDwn, idxNPtDwn, +indexDepth, path, pathsByDepth, +offset);
                        if (!currgeom) {
                            continue;
                        }
                        geom.push(currgeom);
                        offset = currgeom.offset;
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
        return geomHelper.mergeMeshes(geom, false);
    },

    /**
     * Returns the geometry of the inner horizontal facess
     */
    getInnerHorizontalGeom: function getInnerHorizontalGeom(topoPathsByDepth, options) {
        var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

        //gets all the triangles by depth:
        var trianglesByDepth = [];
        var innerHorGeom = [];
        for (var i in topoPathsByDepth) {
            var totaltopo = topoPathsByDepth[i].pos.concat(topoPathsByDepth[i].neg);
            trianglesByDepth.push(cdt2dHelper.computeTriangulation(totaltopo));
            trianglesByDepth[i].depth = topoPathsByDepth[i].depth;
        }
        // get points, normal and faces from it:
        var horizontalGeomByDepth = geomHelper.getInnerHorizontalGeom(trianglesByDepth, options, +offset);
        return geomHelper.mergeMeshes(horizontalGeomByDepth, false);
    },

    /**
     * Returns the paths sorted by sens. Negativess paths are holes.
     * Positives paths are the end of holes( solids)
     * For convinience, all paths are set to positive
     */
    getTopoPathByDepth: function getTopoPathByDepth(pathsByDepth, outerPathsByDepth, options) {
        // let paths = pathsByDepth.paths;
        var topoByDepth = [];
        // pathHelper.setDirectionPath(outerShape.path, 1);

        topoByDepth.push({
            pos: outerPathsByDepth[0].paths,
            neg: pathsByDepth[0].paths,
            depth: 0
        });

        for (var i = 1; i < pathsByDepth.length - 1; i++) {

            //compute xor for inner paths
            var xor = pathHelper.getXorOfPaths(pathsByDepth[i].paths, pathsByDepth[i + 1].paths);
            var posxor = xor.filter(pathHelper.isPositivePath);
            var negxor = xor.filter(pathHelper.isNegativePath);
            //compute xor for outer paths
            xor = pathHelper.getXorOfPaths(outerPathsByDepth[i].paths, outerPathsByDepth[i + 1].paths);
            posxor.push.apply(posxor, _toConsumableArray(xor.filter(pathHelper.isPositivePath)));

            pathHelper.setDirectionPaths(negxor, 1);
            topoByDepth.push({
                pos: posxor,
                neg: negxor,
                depth: pathsByDepth[i].depth
            });
        }

        pathHelper.setDirectionPaths(pathsByDepth[pathsByDepth.length - 1], 1);
        topoByDepth.push({
            pos: outerPathsByDepth[outerPathsByDepth.length - 1].paths,
            neg: pathsByDepth[pathsByDepth.length - 1].paths,
            depth: pathsByDepth[pathsByDepth.length - 1].depth
        });
        return topoByDepth;
    },

    scaleUpHoles: function scaleUpHoles(holes) {
        for (var i in holes) {
            pathHelper.scaleUpPath(holes[i].path);
        }
    },

    scaleDownHoles: function scaleDownHoles(holes) {
        for (var i in holes) {
            pathHelper.scaleDownPath(holes[i].path);
        }
    },
    scaleDownPathsByDepth: function scaleDownPathsByDepth(pathsByDepth) {
        for (var i in pathsByDepth) {
            pathHelper.scaleDownPaths(pathsByDepth[i].paths);
        }
    },
    scaleDownOuterPathsByDepth: function scaleDownOuterPathsByDepth(outerPathsByDepth) {
        for (var i in outerPathsByDepth) {
            if (outerPathsByDepth[i].toScaleDown) {
                pathHelper.scaleDownPaths(outerPathsByDepth[i].paths);
            }
        }
    },
    scaleDownTopoByDepth: function scaleDownTopoByDepth(topoByDepth, outerShape) {
        pathHelper.scaleDownPath(outerShape.path);
        for (var i = 1; i < topoByDepth.length - 1; i++) {
            pathHelper.scaleDownPaths(topoByDepth[i].pos);
            pathHelper.scaleDownPaths(topoByDepth[i].neg);
        }
    },
    setDirectionPaths: function setDirectionPaths(pathsByDepth, outerPathsByDepth, topoPathsByDepth) {
        for (var i in pathsByDepth) {
            pathHelper.setDirectionPaths(pathsByDepth[i].paths, 1);
        }
        for (var _i in topoPathsByDepth) {
            pathHelper.setDirectionPaths(topoPathsByDepth[_i].pos, 1);
            pathHelper.setDirectionPaths(topoPathsByDepth[_i].neg, 1);
        }
        for (var _i2 in outerPathsByDepth) {
            pathHelper.setDirectionPaths(outerPathsByDepth[_i2].paths, -1);
        }
    },

    getOuterPathsByDepth: function getOuterPathsByDepth(pathsByDepth, outerShape) {
        var res = [];
        for (var i in pathsByDepth) {
            res.push(extruder.getOuterPathsAtDepth(pathsByDepth[i], outerShape));
        }
        return res;
    },

    getOuterPathsAtDepth: function getOuterPathsAtDepth(pathsAtDepth, outerShape) {
        var res = {
            depth: pathsAtDepth.depth,
            paths: [outerShape.path]
        };

        for (var i = 0; i < pathsAtDepth.paths.length; i++) {
            var p = pathsAtDepth.paths[i];
            if (pathHelper.getDiffOfPaths([p], res.paths).length > 0) {
                res.paths = pathHelper.getDiffOfPaths(res.paths, [p]);
                pathHelper.setDirectionPaths(res.paths, 1);
                res.toScaleDown = true;
                pathsAtDepth.paths.splice(i);
                i--;
            }
        }
        return res;
    },

    /**
     *  Takes an array of paths representing holes at different depths.
     *  One depth value/ path.
     *  returns an array of paths at each depth: simplify the geometry for each stage.
     */
    getPathsByDepth: function getPathsByDepth(holes, outerPath) {
        //gets all paths into the bounds of outerPath:
        // pathHelper.fitPathsIntoPath(outerPath.path, holes.map( h=>return h.path));
        /*for(let i in holes){
            if(pathHelper.getXorOfPaths([holes[i].path],[outerPath.path])[0])
            {
            holes[i].path=pathHelper.getInterOfPaths([holes[i].path],[outerPath.path])[0];
            }
        }*/
        //scales up all holes to prevent from int imprecision
        pathHelper.scaleUpPath(outerPath.path);

        //sets all depths deeper than outerDepth  or equals to 0 to outerDepth:
        holes.map(function (elt) {
            elt.depth > outerPath.depth || elt.depth === 0 ? elt.depth = outerPath.depth : elt.depth = elt.depth;
        });

        extruder.scaleUpHoles(holes);
        holes.map(function (elt) {
            pathHelper.setDirectionPath(elt.path, 1);
        });

        //get all depths:
        var depths = new Set();
        for (var i in holes) {
            depths.add(holes[i].depth);
        }
        depths.add(0);
        depths.add(outerPath.depth);
        depths = Array.from(depths);
        depths.sort(function (a, b) {
            return a - b;
        });

        //get paths by depth:
        var res = [];

        var _loop = function _loop(_i3) {
            var pathAtDepth = holes.filter(function (s) {
                return s.depth >= depths[_i3];
            });
            pathAtDepth = pathHelper.simplifyPaths(pathAtDepth.map(function (s) {
                return s.path;
            }));
            //take only the paths of the holes which reach this depth
            res.push({
                paths: pathAtDepth,
                depth: depths[_i3]
            });
        };

        for (var _i3 in depths) {
            _loop(_i3);
        }
        return res;
    }
};

module.exports = extruder;