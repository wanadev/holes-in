"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var pathHelper = require("./path-helper.js");
var constants = require("./constants.js");

var uvHelper = {

    /** ***********************************
        First paradygm: map on vertival and horizontal independantly.
        Don't care about discontinuities between vertical and horizontal.
    ***************************************/

    mapHorizontal: function mapHorizontal(pathsByDepth, outerShape, horizontalGeom, options) {
        if (!horizontalGeom) {
            return;
        }
        var points = horizontalGeom.points;
        var boundaries = uvHelper.getBoundaries(pathsByDepth, outerShape, options);
        uvHelper.setMinBoundaryHorr(outerShape, boundaries);
        var uv = uvHelper.getUVHorFaces(pathsByDepth, outerShape, boundaries, points);
        uvHelper.addUvToGeom(uv, horizontalGeom);
    },
    mapVertical: function mapVertical(pathsByDepth, outerShape, options) {

        // determine the interpolation function:
        var boundaries = uvHelper.getBoundaries(pathsByDepth, outerShape, options);
        // for each depth: constructs the uvs:
        for (var depth = 0; depth < pathsByDepth.length; depth++) {
            var pathsAtDepth = pathsByDepth[depth];
            for (var i = 0; i < pathsAtDepth.paths.length; i++) {
                uvHelper.getUVertPath(i, pathsByDepth, +depth, boundaries);
            }
            var v = uvHelper.interpolate(boundaries.boundary.Z, boundaries.boundaryTex.V, pathsAtDepth.depth * constants.scaleFactor);
            pathsAtDepth.holesInV = v;
        }
    },
    getUVHorFaces: function getUVHorFaces(pathsByDepth, outerShape, boundaries, points) {
        if (points.length === 0) return;
        var res = [];
        for (var i = 0; i < points.length; i += 3) {
            var point = points.slice(i, i + 3);
            res.push.apply(res, _toConsumableArray(uvHelper.getUVFromHorrPoint(boundaries, point)));
        }
        return res;
    },
    getUVertPath: function getUVertPath(indPath, pathsByDepth, indexDepth, boundaries) {
        var pathsAtDepth = pathsByDepth[indexDepth];
        var path = pathsAtDepth.paths[indPath];
        if (path.length === 0) return;
        // finds into the upper paths if there is a matching edge
        var match = void 0;
        for (var i = indexDepth - 1; i >= 0; i--) {
            for (var j = 0; j < pathsByDepth[i].paths.length; j++) {
                var pathToMatch = pathsByDepth[i].paths[j];
                match = pathHelper.getMatchingEdgeIndex(path, pathToMatch);
                if (match) {
                    i = -1;
                    break;
                }
            }
        }
        var offset = { index: 0, distance: 0, u: 0 };
        // if so, offsets it to keep a max of continuity belong Z
        if (match) {
            offset.distance = pathHelper.getDistance(path[match.index], match.pointmatch);
            offset.index = match.index;
            offset.u = match.pointmatch.holesInU;
        }

        // interpolates
        uvHelper.interpolatePathU(path, boundaries, offset);
    },
    getMaxPathLength: function getMaxPathLength(pathsByDepth) {
        var max = 0;
        for (var i = 0; i < pathsByDepth.length; i++) {
            max = Math.max(max, Math.max(pathHelper.getTotalLength.apply(pathHelper, _toConsumableArray(pathsByDepth[i].paths))));
        }
        return max;
    },
    getUVFromHorrPoint: function getUVFromHorrPoint(boundaries, point) {
        var U = uvHelper.interpolateInv(boundaries.boundary.XY, boundaries.boundaryTex.U, point[0] * constants.scaleFactor);
        var V = uvHelper.interpolate(boundaries.boundary.Z, boundaries.boundaryTex.V, point[1] * constants.scaleFactor);

        return [U, V];
    },
    interpolatePathU: function interpolatePathU(path, boundaries, offset) {
        var dist = 0;
        var startIndex = offset.index;
        for (var i = startIndex; i < path.length + startIndex; i++) {
            var _valueU = dist + offset.distance;
            var _u = uvHelper.interpolateInv(boundaries.boundary.XY, boundaries.boundaryTex.U, _valueU);
            path[i % path.length].holesInU = _u;
            dist += pathHelper.getDistance(path[i % path.length], path[(i + 1) % path.length]);
        }
        var valueU = dist + offset.distance;
        var u = uvHelper.interpolateInv(boundaries.boundary.XY, boundaries.boundaryTex.U, valueU);
        path[startIndex].holesInU2 = u;
    },
    interpolate: function interpolate(boundarySrc, boundaryDst, value) {
        return (value - boundarySrc.min) / (boundarySrc.max - boundarySrc.min) * (boundaryDst.max - boundaryDst.min) + boundaryDst.min;
    },
    interpolateInv: function interpolateInv(boundarySrc, boundaryDst, value) {
        return (1.0 - (value - boundarySrc.min) / (boundarySrc.max - boundarySrc.min)) * (boundaryDst.max - boundaryDst.min) + boundaryDst.min;
    },
    addUvsToGeoms: function addUvsToGeoms(uvs, geoms) {
        for (var i = 0; i < geoms.length; i++) {
            var uv = [];
            if (geoms[i].uv) {
                continue;
            }
            if (!uvs[i]) {
                uv = Array(2 * geoms[i].points.length / 3);
            }
            geoms[i].uvs = uv;
        }
    },
    addUvToGeom: function addUvToGeom(uvs, geom) {
        if (geom.uvs.length > 0) {
            return;
        }
        if (!uvs || uvs.length === 0) {
            uvs = new Array(2 * geom.points.length / 3).fill(0);
        }
        geom.uvs = uvs;
    },
    setMinBoundaryHorr: function setMinBoundaryHorr(outerShape, boundaries) {
        var minX = outerShape.path[0].X;
        var minY = outerShape.path[0].Y;

        for (var i = 1; i < outerShape.path.length; i++) {
            var x = outerShape.path[i].X;
            var y = outerShape.path[i].Y;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
        }
        boundaries.boundary.XY.min += minX;
        boundaries.boundary.Z.min += minY;

        boundaries.boundary.XY.max += minX;
        boundaries.boundary.Z.max += minY;
    },
    getBoundaries: function getBoundaries(pathsByDepth, outerShape, options) {
        var maxLength = uvHelper.getMaxPathLength(pathsByDepth);
        maxLength = Math.max(pathHelper.getTotalLength(outerShape.path));
        var maxDepth = outerShape.depth;
        var max = Math.max(maxLength, maxDepth);

        var boundaryTex = { U: { min: 0, max: 1 }, V: { min: 0, max: 1 } };
        var boundary = { XY: { min: 0, max: max }, Z: { min: 0, max: max } };

        if (options.lengthU) {
            boundary.XY.max = options.lengthU * constants.scaleFactor;
        }
        if (options.lengthV) {
            boundary.Z.max = options.lengthV * constants.scaleFactor;
        }

        return { boundary: boundary, boundaryTex: boundaryTex };
    },
    getO1BoudnaryTex: function getO1BoudnaryTex() {
        return {
            X: {
                min: 0,
                max: 1
            },
            Y: {
                min: 0,
                max: 1
            }
        };
    }
};
module.exports = uvHelper;