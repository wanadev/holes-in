"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var pathHelper = require("./path-helper.js");

var geomHelper = {

    concatGeometries: function concatGeometries(geoms, considerOffset) {
        var res = geoms[0];
        for (var i = 1; i < geoms.length; i++) {
            res = geomHelper.concatGeometry(res, geoms[i], considerOffset);
        }
        return res;
    },

    concatGeometry: function concatGeometry(geom1, geom2, considerOffset) {
        var _geom1$points, _geom1$normals;

        if (considerOffset) {
            var _geom1$faces;

            (_geom1$faces = geom1.faces).push.apply(_geom1$faces, _toConsumableArray(geom2.faces.map(function (f) {
                return f + +geom1.offset;
            })));
            geom1.offset += geom2.offset;
        } else {
            var _geom1$faces2;

            (_geom1$faces2 = geom1.faces).push.apply(_geom1$faces2, _toConsumableArray(geom2.faces));
            geom1.offset += geom2.offset;
        }
        (_geom1$points = geom1.points).push.apply(_geom1$points, _toConsumableArray(geom2.points));
        (_geom1$normals = geom1.normals).push.apply(_geom1$normals, _toConsumableArray(geom2.normals));
        return geom1;
    },

    getOuterGeom: function getOuterGeom(pathOuter, depths, options) {},

    /*
    * Returns two triangles representing the larger face we can build from the edge ptDwn->nPtDwn
    */
    getOneInnerVerticalGeom: function getOneInnerVerticalGeom(ptDwn, nPtDwn, indexDepthDwn, pathsByDepth) {
        var offset = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;


        var match = geomHelper.getMatchDepths(ptDwn, nPtDwn, +indexDepthDwn, pathsByDepth);
        if (!match) {
            return;
        }
        var res = geomHelper.getPtsNormsIndx2d(ptDwn, nPtDwn, +match.depthUp, +match.depthDwn, +offset);
        return res;
    },

    /**
     * Returns the inner geometry from an array of triangles by depth
     */
    getHorizontalInnerGeom: function getHorizontalInnerGeom(trianglesByDepth) {
        var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        var faces = [];
        var points = [];
        var normals = [];
        Object.keys(trianglesByDepth).forEach(function (i) {
            //creates points
            var currPoint = [];
            Object.values(trianglesByDepth[i].points).forEach(function (point) {
                currPoint.push(point[0]);
                currPoint.push(point[1]);
                currPoint.push(trianglesByDepth[i].depth);
            });
            points.push.apply(points, currPoint);
            //offsets faces
            Object.values(trianglesByDepth[i].triangles).forEach(function (triangle) {
                faces.push.apply(faces, _toConsumableArray(triangle.map(function (index) {
                    return index + offset;
                })));
            });
            offset += trianglesByDepth[i].points.length;

            //get normals:
            var normal = geomHelper.getNormalToPlan(currPoint.slice(0, 3), currPoint.slice(3, 6), currPoint.slice(6, 9));
            Object.values(trianglesByDepth[i].points).forEach(function (point) {
                normals.push.apply(normals, _toConsumableArray(normal));
            });
        });

        return {
            points: points,
            faces: faces,
            normals: normals,
            offset: offset
        };
    },

    /**
    * Returns the depths at which they are two edges with the same 2D coords.
    * If it does not exists such a edge, returns the current depth and the depth above
    */
    getMatchDepths: function getMatchDepths(ptDwn, nPtDwn, indexDepth, pathsByDepth) {
        //for each depth deeper than pathUp,we look for a corresponding point:
        var depthUp = pathsByDepth.depths[indexDepth - 1];
        var depthDwn = pathsByDepth.depths[indexDepth];
        for (var i = indexDepth - 1; i >= 0; i--) {
            var pathsAtDepth = pathsByDepth.paths[i];
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
                depthUp = pathsByDepth.depths[i];
                depthDwn = pathsByDepth.depths[indexDepth];
                pathsByDepth.paths[i][j][match1.index].visited = true;
            }
        }
        return {
            depthUp: depthUp,
            depthDwn: depthDwn
        };
    },

    getPtsNormsIndx2d: function getPtsNormsIndx2d(point2d1, point2d2, depthUp, depthDwn, offset) {

        var point1 = geomHelper.getPoint3(point2d1, depthUp);
        var point2 = geomHelper.getPoint3(point2d1, depthDwn);
        var point3 = geomHelper.getPoint3(point2d2, depthDwn);
        var point4 = geomHelper.getPoint3(point2d2, depthUp);

        return geomHelper.getPtsNormsIndx3d([point1, point2, point3, point4], +offset);
    },

    getPtsNormsIndx3d: function getPtsNormsIndx3d(points3d, offset) {
        var normal = geomHelper.getNormalToPlan(points3d[0], points3d[1], points3d[2], offset);
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
        var resFaces = [0, 2, 1, 0, 3, 2].map(function (elt) {
            return elt + offset;
        });
        return {
            points: resPoints,
            normals: resNorm,
            faces: resFaces,
            offset: offset + 4
        };
    },

    getInnerHorizontalGeom: function getInnerHorizontalGeom(trianglesByDepth) {
        var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        var faces = [];
        var points = [];
        var normals = [];
        Object.keys(trianglesByDepth).forEach(function (i) {
            //creates points
            var currPoint = [];
            Object.values(trianglesByDepth[i].points).forEach(function (point) {
                currPoint.push(point[0]);
                currPoint.push(point[1]);
                currPoint.push(trianglesByDepth[i].depth);
            });
            points.push.apply(points, currPoint);
            //offsets faces
            Object.values(trianglesByDepth[i].triangles).forEach(function (triangle) {
                faces.push.apply(faces, _toConsumableArray(triangle.map(function (index) {
                    return index + offset;
                })));
            });
            offset += trianglesByDepth[i].points.length;

            //get normals:
            var normal = geomHelper.getNormalToPlan(currPoint.slice(0, 3), currPoint.slice(3, 6), currPoint.slice(6, 9));
            Object.values(trianglesByDepth[i].points).forEach(function (point) {
                normals.push.apply(normals, _toConsumableArray(normal));
            });
        });

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