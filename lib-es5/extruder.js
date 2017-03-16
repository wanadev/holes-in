"use strict";

var clipperLib = require("clipper-lib");
var pathHelper = require("./path-helper.js");
var geomHelper = require("./geom-helper.js");
var cdt2dHelper = require("./cdt2d-helper.js");
var uvHelper = require("./uv-helper.js");
var exportHelper = require("./export-helper.js");

var extruder = {

    /**
    * returns a mesh from an outer shape and holes
     */
    getGeometry: function getGeometry(outerShape, holes, options, optionsUV) {
        //get the topology 2D paths by depth

        var pathsByDepth = extruder.getPathsByDepth(holes, outerShape);
        var topoPathsByDepth = extruder.getTopoPathByDepth(pathsByDepth, outerShape, options);

        extruder.scaleDownHoles(holes);
        extruder.scaleDownTopoByDepth(topoPathsByDepth, outerShape);
        extruder.scaleDownPathsByDepth(pathsByDepth);
        extruder.setDirectionPaths(pathsByDepth, topoPathsByDepth);
        //set all paths to positive:


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
            // let inMeshHor;
            var inMeshHor = extruder.getInnerHorizontalGeom(topoPathsByDepth, {
                inMesh: true
            });
            uvHelper.getUVHorFaces(pathsByDepth, outerShape, inMeshHor, options);

            var offset = 0;
            if (inMeshHor) {
                offset = inMeshHor.offset;
            }

            var inMeshVert = extruder.getInnerVerticalGeom(pathsByDepth, outerShape, optionsUV, +offset);
            res.inMesh = geomHelper.mergeMeshes([inMeshHor, inMeshVert], false);
        }

        if (options.outMesh) {
            uvHelper.getUVOuterShape(pathsByDepth, outerShape);
            res.outMesh = geomHelper.getOuterVerticalGeom(outerShape, outerShape.depth);
        }
        Object.values(res).forEach(function (elt) {
            return uvHelper.addUvToGeom({}, elt);
        });
        return res;
    },

    getInnerVerticalGeom: function getInnerVerticalGeom(pathsByDepth, outerShape, optionsUV) {
        var offset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

        //ensure the paths are all in the same direction
        Object.keys(pathsByDepth).forEach(function (i) {
            pathHelper.setDirectionPaths(pathsByDepth[i].paths, 1);
        });
        uvHelper.mapVertical(pathsByDepth, outerShape, optionsUV);
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
    getTopoPathByDepth: function getTopoPathByDepth(pathsByDepth, outerShape, options) {
        // let paths = pathsByDepth.paths;
        var topoByDepth = [];
        pathHelper.setDirectionPath(outerShape.path, 1);

        topoByDepth.push({
            pos: [outerShape.path],
            neg: pathsByDepth[0].paths,
            depth: 0
        });

        for (var i = 1; i < pathsByDepth.length - 1; i++) {
            var xor = pathHelper.getXorOfPaths(pathsByDepth[i].paths, pathsByDepth[i + 1].paths);
            var posxor = xor.filter(pathHelper.isPositivePath);
            var negxor = xor.filter(pathHelper.isNegativePath);
            pathHelper.setDirectionPaths(negxor, 1);
            topoByDepth.push({
                pos: posxor,
                neg: negxor,
                depth: pathsByDepth[i].depth
            });
        }

        pathHelper.setDirectionPaths(pathsByDepth[pathsByDepth.length - 1], 1);
        topoByDepth.push({
            pos: [outerShape.path],
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

    scaleDownTopoByDepth: function scaleDownTopoByDepth(topoByDepth, outerShape) {
        pathHelper.scaleDownPath(outerShape.path);
        for (var i = 1; i < topoByDepth.length - 1; i++) {
            pathHelper.scaleDownPaths(topoByDepth[i].pos);
            pathHelper.scaleDownPaths(topoByDepth[i].neg);
        }
    },
    setDirectionPaths: function setDirectionPaths(pathsByDepth, topoPathsByDepth) {
        for (var i in pathsByDepth) {
            pathHelper.setDirectionPaths(pathsByDepth[i].paths, 1);
        }
        for (var _i in topoPathsByDepth) {
            pathHelper.setDirectionPaths(topoPathsByDepth[_i].pos, 1);
            pathHelper.setDirectionPaths(topoPathsByDepth[_i].neg, 1);
        }
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

        var _loop = function _loop(_i2) {
            var pathAtDepth = holes.filter(function (s) {
                return s.depth >= depths[_i2];
            });
            pathAtDepth = pathHelper.simplifyPaths(pathAtDepth.map(function (s) {
                return s.path;
            }));
            //take only the paths of the holes which reach this depth
            res.push({
                paths: pathAtDepth,
                depth: depths[_i2]
            });
        };

        for (var _i2 in depths) {
            _loop(_i2);
        }
        return res;
    }
};

module.exports = extruder;