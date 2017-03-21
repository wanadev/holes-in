"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var pathHelper = require("./path-helper.js");
var cdt2dHelper = require("./cdt2d-helper.js");

var geomHelper = {

    mergeMeshes: function mergeMeshes(geoms) {
        var considerOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

        var res = geoms[0];
        for (var i = 1; i < geoms.length; i++) {
            res = geomHelper.mergeMesh(res, geoms[i], considerOffset);
        }
        return res;
    },

    mergeMesh: function mergeMesh(geom1, geom2, considerOffset) {
        var _geom1$points, _geom1$normals;

        if (!geom2) return geom1;
        if (!geom1) return geom2;

        if (considerOffset) {
            var _geom1$faces;

            (_geom1$faces = geom1.faces).push.apply(_geom1$faces, _toConsumableArray(geom2.faces.map(function (f) {
                return f + +geom1.offset;
            })));
            geom1.offset = +geom1.offset + +geom2.offset;
        } else {
            var _geom1$faces2;

            (_geom1$faces2 = geom1.faces).push.apply(_geom1$faces2, _toConsumableArray(geom2.faces));
            geom1.offset = Math.max(geom1.offset, geom2.offset);
        }
        (_geom1$points = geom1.points).push.apply(_geom1$points, _toConsumableArray(geom2.points));
        (_geom1$normals = geom1.normals).push.apply(_geom1$normals, _toConsumableArray(geom2.normals));
        if (geom1.uvs && geom2.uvs) {
            var _geom1$uvs;

            (_geom1$uvs = geom1.uvs).push.apply(_geom1$uvs, _toConsumableArray(geom2.uvs));
        }
        return geom1;
    },

    /*
     * Returns two triangles representing the larger face we can build from the edge ptDwn->nPtDwn
     */
    getOneInnerVerticalGeom: function getOneInnerVerticalGeom(idxPtDwn, nIdxPtDwn, indexDepthDwn, pathDwn, pathsByDepth) {
        var offset = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;

        var ptDwn = pathDwn[idxPtDwn];
        var nPtDwn = pathDwn[nIdxPtDwn];
        var match = geomHelper.getMatchDepths(ptDwn, nPtDwn, +indexDepthDwn, pathsByDepth);
        if (!match) {
            return;
        }
        var res = geomHelper.getPtsNormsIndx2d(ptDwn, nPtDwn, +match.depthUp, +match.depthDwn, +offset);

        res.uvs = [];
        //add uvs:
        geomHelper.addUvsToInnerVertGeom(res, +idxPtDwn, match.pathUp, pathDwn, pathsByDepth, indexDepthDwn);

        return res;
    },

    /**
     * Returns the depths at which they are two edges with the same 2D coords.
     * If it does not exists such a edge, returns the current depth and the depth above
     */
    getMatchDepths: function getMatchDepths(ptDwn, nPtDwn, indexDepth, pathsByDepth) {
        //for each depth deeper than pathUp,we look for a corresponding point:
        var depthUp = pathsByDepth[indexDepth - 1].depth;
        var depthDwn = pathsByDepth[indexDepth].depth;
        var pathUpRes = void 0;
        for (var i = indexDepth - 1; i >= 0; i--) {
            var pathsAtDepth = pathsByDepth[i].paths;
            if (!pathsAtDepth) {
                continue;
            }

            for (var j = 0; j < pathsAtDepth.length; j++) {
                //for each path at each depth:
                var pathUp = pathsAtDepth[j];
                var match1 = pathHelper.getPointMatch(pathUp, ptDwn);
                var match2 = pathHelper.getPointMatch(pathUp, nPtDwn);
                if (!match1 || !match2) {
                    continue;
                }
                if (pathUp[match1.index].visited) {
                    return;
                }
                depthUp = pathsByDepth[i].depth;
                depthDwn = pathsByDepth[indexDepth].depth;
                pathsByDepth[i].paths[j][match1.index].visited = true;
                pathUpRes = pathUp;
                i = -1;
                break;
            }
        }
        return {
            depthUp: depthUp,
            pathUp: pathUpRes,
            depthDwn: depthDwn
        };
    },

    getPtsNormsIndx2d: function getPtsNormsIndx2d(point2d1, point2d2, depthUp, depthDwn, offset) {
        var invertNormal = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;


        var point1 = geomHelper.getPoint3(point2d1, depthUp);
        var point2 = geomHelper.getPoint3(point2d1, depthDwn);
        var point3 = geomHelper.getPoint3(point2d2, depthDwn);
        var point4 = geomHelper.getPoint3(point2d2, depthUp);

        return geomHelper.getPtsNormsIndx3d([point1, point2, point3, point4], +offset, invertNormal);
    },

    getPtsNormsIndx3d: function getPtsNormsIndx3d(points3d, offset, invertNormal) {
        var normal = geomHelper.getNormalToPlan(points3d[0], points3d[1], points3d[2], invertNormal);
        var resNorm = [];
        resNorm.push.apply(resNorm, _toConsumableArray(normal));
        resNorm.push.apply(resNorm, _toConsumableArray(normal));
        resNorm.push.apply(resNorm, _toConsumableArray(normal));
        resNorm.push.apply(resNorm, _toConsumableArray(normal));
        var resPoints = [];
        resPoints.push.apply(resPoints, _toConsumableArray(points3d[0]));
        resPoints.push.apply(resPoints, _toConsumableArray(points3d[1]));
        resPoints.push.apply(resPoints, _toConsumableArray(points3d[2]));
        resPoints.push.apply(resPoints, _toConsumableArray(points3d[3]));
        var resFaces = void 0;
        if (invertNormal) {
            resFaces = [0, 1, 2, 0, 2, 3].map(function (elt) {
                return elt + offset;
            });
        } else {
            resFaces = [0, 2, 1, 0, 3, 2].map(function (elt) {
                return elt + offset;
            });
        }

        return {
            points: resPoints,
            normals: resNorm,
            faces: resFaces,
            offset: offset + 4
        };
    },

    addUvsToInnerVertGeom: function addUvsToInnerVertGeom(geom, indexPtDwn, pathUp, pathDwn, pathsByDepth, indexDepth) {
        var _geom$uvs;

        var vUp = pathsByDepth[indexDepth - 1].V;
        var vDwn = pathsByDepth[indexDepth].V;

        var nIndexPtDwn = (indexPtDwn + 1) % pathDwn.length;
        var u = pathDwn[indexPtDwn].U;
        var nu = pathDwn[nIndexPtDwn].U;

        if (pathDwn[nIndexPtDwn].U2) {
            nu = pathDwn[nIndexPtDwn].U2;
        }
        var uvs = [u, vUp, u, vDwn, nu, vDwn, nu, vUp];
        (_geom$uvs = geom.uvs).push.apply(_geom$uvs, uvs);
    },

    getInnerHorizontalGeom: function getInnerHorizontalGeom(trianglesByDepth, options) {
        var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

        var res = [];
        var indexes = [];

        if (options.frontMesh) {
            indexes.push(0);
        }
        if (options.inMesh) {
            indexes.push.apply(indexes, _toConsumableArray(Array.from(new Array(trianglesByDepth.length - 2), function (val, index) {
                return index + 1;
            })));
        }
        if (options.backMesh) {
            indexes.push(trianglesByDepth.length - 1);
        }

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = indexes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var i = _step.value;

                var triangles = trianglesByDepth[i];
                var invertNormal = true;
                if (options.backMesh) {
                    invertNormal = false;
                }
                var currGeom = geomHelper.getGeomFromTriangulation(triangles, +triangles.depth, invertNormal, offset);
                offset = currGeom.offset;
                res.push(currGeom);
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

        return res;
    },

    getGeomFromTriangulation: function getGeomFromTriangulation(triangles, depth) {
        var invertNormal = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var offset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

        var points = [];
        Object.values(triangles.points).forEach(function (point) {
            points.push(point[0]);
            points.push(point[1]);
            points.push(depth);
        });
        if (!invertNormal) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = triangles.triangles[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var t = _step2.value;

                    t.reverse();
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }
        //offsets faces
        var faces = [];
        Object.values(triangles.triangles).forEach(function (triangle) {
            faces.push.apply(faces, _toConsumableArray(triangle.map(function (index) {
                return index + offset;
            })));
        });
        offset += triangles.points.length;

        //get normals:
        var normals = [];
        var normal = geomHelper.getNormalToPlan(points.slice(0, 3), points.slice(3, 6), points.slice(6, 9), invertNormal);

        Object.values(triangles.points).forEach(function (point) {
            normals.push.apply(normals, _toConsumableArray(normal));
        });
        return {
            points: points,
            faces: faces,
            normals: normals,
            offset: offset
        };
    },

    getNormalToPlan: function getNormalToPlan(point1, point2, point4) {
        var invertNormal = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

        var vec1 = void 0;
        if (invertNormal) {
            vec1 = geomHelper.pointsToVec(point2, point1);
        } else {
            vec1 = geomHelper.pointsToVec(point1, point2);
        }
        var vec2 = geomHelper.pointsToVec(point1, point4);
        return geomHelper.normalizeVec(geomHelper.cross(vec1, vec2));
    },

    pointsToVec: function pointsToVec(point1, point2) {
        return [point2[0] - point1[0], point2[1] - point1[1], point2[2] - point1[2]];
    },

    getPoint3: function getPoint3(point2, depth) {
        return [point2.X, point2.Y, depth];
    },

    cross: function cross(vec1, vec2) {
        return [vec1[1] * vec2[2] - vec1[2] * vec2[1], vec1[2] * vec2[0] - vec1[0] * vec2[2], vec1[0] * vec2[1] - vec1[1] * vec2[0]];
    },

    normalizeVec: function normalizeVec(vec) {
        var norm = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
        return [vec[0] / norm, vec[1] / norm, vec[2] / norm];
    }

};
module.exports = geomHelper;