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
    getOneVerticalGeom: function getOneVerticalGeom(idxPtDwn, nIdxPtDwn, indexDepthDwn, pathDwn, pathsByDepth) {
        var offset = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
        var invertNormal = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;

        var ptDwn = pathDwn[idxPtDwn];
        var nPtDwn = pathDwn[nIdxPtDwn];
        var indexDepthUp = geomHelper.getMatchDepths(ptDwn, nPtDwn, +indexDepthDwn, pathsByDepth);
        if (indexDepthUp === undefined || indexDepthUp < 0) {
            return;
        }
        var depthUp = pathsByDepth[indexDepthUp].depth;
        var depthDwn = pathsByDepth[indexDepthDwn].depth;
        var res = geomHelper.getPtsNormsIndx2d(ptDwn, nPtDwn, depthUp, depthDwn, +offset, invertNormal);

        res.uvs = [];
        //add uvs:
        geomHelper.addUvsToVertGeom(res, +idxPtDwn, pathDwn, pathsByDepth, indexDepthDwn, indexDepthUp);

        return res;
    },

    /**
     * Returns the depths at which they are two edges with the same 2D coords.
     * If it does not exists such a edge, returns the current depth and the depth above
     */
    getMatchDepths: function getMatchDepths(ptDwn, nPtDwn, indexDepth, pathsByDepth) {
        //for each depth deeper than pathUp,we look for a corresponding point:
        var res = indexDepth - 1;
        var found = false;
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
                var perfectMatch = match1 && match2 && (match1.index + 1) % pathUp.length === match2.index;
                if (!match1) {
                    continue;
                }
                if (pathsByDepth[i].paths[j][match1.index]._holesInVisited) {
                    return;
                }
                pathsByDepth[i].paths[j][match1.index]._holesInVisited = true;
                if (perfectMatch) {
                    res = i;
                    continue;
                } else {
                    return i;
                }
            }
        }
        return res;
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

        var resFaces = void 0;
        var normal = void 0;
        if (invertNormal) {
            resFaces = [0, 1, 2, 0, 2, 3].map(function (elt) {
                return elt + offset;
            });
            normal = geomHelper.getNormalToPlan(points3d[0], points3d[1], points3d[2]);
        } else {
            resFaces = [2, 1, 0, 3, 2, 0].map(function (elt) {
                return elt + offset;
            });
            normal = geomHelper.getNormalToPlan(points3d[2], points3d[1], points3d[0]);
        }

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

        return {
            points: resPoints,
            normals: resNorm,
            faces: resFaces,
            offset: offset + 4
        };
    },

    addUvsToVertGeom: function addUvsToVertGeom(geom, indexPtDwn, pathDwn, pathsByDepth, indexDepth, indexDepthUp) {
        var _geom$uvs;

        var vUp = pathsByDepth[indexDepthUp].holesInV;
        var vDwn = pathsByDepth[indexDepth].holesInV;

        var nIndexPtDwn = (indexPtDwn + 1) % pathDwn.length;
        var u = pathDwn[indexPtDwn].holesInU;
        var nu = pathDwn[nIndexPtDwn].holesInU;

        if (pathDwn[nIndexPtDwn].holesInU2) {
            nu = pathDwn[nIndexPtDwn].holesInU2;
        }

        var uvs = [u, vUp, u, vDwn, nu, vDwn, nu, vUp];
        (_geom$uvs = geom.uvs).push.apply(_geom$uvs, uvs);
    },

    getHorrizontalGeom: function getHorrizontalGeom(triangles) {
        var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var invertNormal = arguments[2];

        if (triangles.triangles.length > 0) {
            var currGeom = geomHelper.getGeomFromTriangulation(triangles, +triangles.depth, invertNormal, offset);
            offset = currGeom.offset;
            return currGeom;
        }
    },

    getGeomFromTriangulation: function getGeomFromTriangulation(triangles, depth) {
        var invertNormal = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var offset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

        var points = [];

        for (var i in triangles.points) {
            points.push(triangles.points[i][0] / 10000);
            points.push(triangles.points[i][1] / 10000);
            points.push(depth);
        }

        if (!invertNormal) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = triangles.triangles[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var t = _step.value;

                    t.reverse();
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
        //offsets faces
        var faces = [];
        for (var _i in triangles.triangles) {
            faces.push.apply(faces, _toConsumableArray(triangles.triangles[_i].map(function (index) {
                return index + offset;
            })));
        }
        offset += triangles.points.length;

        //get normals:
        var normals = [];
        var idxs = triangles.triangles[0].map(function (elt) {
            return elt * 3;
        });
        var pt1 = points.slice(idxs[0], idxs[0] + 3);
        var pt2 = points.slice(idxs[1], idxs[1] + 3);
        var pt3 = points.slice(idxs[2], idxs[2] + 3);
        var normal = geomHelper.getNormalToPlan(pt1, pt2, pt3);

        for (var _i2 in triangles.points) {
            normals.push.apply(normals, _toConsumableArray(normal));
        }

        return {
            points: points,
            faces: faces,
            normals: normals,
            offset: offset
        };
    },

    getNormalToPlan: function getNormalToPlan(point1, point2, point4) {
        var vec1 = geomHelper.pointsToVec(point1, point2);
        var vec2 = geomHelper.pointsToVec(point1, point4);
        return geomHelper.normalizeVec(geomHelper.cross(vec2, vec1));
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