"use strict";

const pathHelper = require("./path-helper.js");
const constants = require("./constants.js");

const uvHelper = {

    /** ***********************************
        First paradygm: map on vertival and horizontal independantly.
        Don't care about discontinuities between vertical and horizontal.
    ***************************************/

    mapHorrizontal(pathsByDepth, outerShape, horizontalGeom, options) {
        if (!horizontalGeom) { return; }
        const points = horizontalGeom.points;
        const boundaries = uvHelper.getBoundaries(pathsByDepth, outerShape, options);
        uvHelper.setMinBoundaryHorr(outerShape, boundaries);
        const uv = uvHelper.getUVHorFaces(pathsByDepth, outerShape, boundaries, points);
        uvHelper.addUvToGeom(uv, horizontalGeom);
    },


    mapVertical(pathsByDepth, outerShape, options) {

        // determine the interpolation function:
        const boundaries = uvHelper.getBoundaries(pathsByDepth, outerShape, options);
        // for each depth: constructs the uvs:

        for (const depth in pathsByDepth) {
            const pathsAtDepth = pathsByDepth[depth];
            for (const i in pathsAtDepth.paths) {
                uvHelper.getUVertPath(i, pathsByDepth, +depth, boundaries);
            }
            const v = uvHelper.interpolate(boundaries.boundary.Z, boundaries.boundaryTex.V, pathsAtDepth.depth * constants.scaleFactor);
            pathsAtDepth.holesInV = v;
        }

    },

    getUVHorFaces(pathsByDepth, outerShape, boundaries, points) {
        const res = [];
        for (let i = 0; i < points.length; i += 3) {
            const point = points.slice(i, i + 3);
            res.push(...uvHelper.getUVFromHorrPoint(boundaries, point));
        }
        return res;
    },

    getUVertPath(indPath, pathsByDepth, indexDepth, boundaries) {
        const pathsAtDepth = pathsByDepth[indexDepth];
        const path = pathsAtDepth.paths[indPath];

        // finds into the upper paths if there is a matching edge
        let match;
        for (let i = indexDepth - 1; i >= 0; i--) {
            for (const j in pathsByDepth[i].paths) {
                const pathToMatch = pathsByDepth[i].paths[j];
                match = pathHelper.getMatchingEdgeIndex(path, pathToMatch);
                if (match) {
                    i = -1;
                    break;
                }
            }
        }
        const offset = { index: 0, distance: 0, u: 0 };
        // if so, offsets it to keep a max of continuity belong Z
        if (match) {
            offset.distance = pathHelper.getDistance(path[match.index], match.pointmatch);
            offset.index = match.index;
            offset.u = match.pointmatch.holesInU;
        }

        // interpolates
        uvHelper.interpolatePathU(path, boundaries, offset);

    },


    getMaxPathLength(pathsByDepth) {
        let max = 0;
        for (const i in pathsByDepth) {
            max = Math.max(max, Math.max(pathHelper.getTotalLength(...pathsByDepth[i].paths)));
        }
        return max;
    },

    getUVFromHorrPoint(boundaries, point) {
        const U = uvHelper.interpolate(boundaries.boundary.XY, boundaries.boundaryTex.U, point[0] * constants.scaleFactor);
        const V = uvHelper.interpolate(boundaries.boundary.Z, boundaries.boundaryTex.V, point[1] * constants.scaleFactor);

        return [U, V];
    },

    interpolatePathU(path, boundaries, offset) {
        let dist = 0;
        const startIndex = offset.index;
        for (let i = startIndex; i < path.length + startIndex; i++) {
            const valueU = (dist + offset.distance);
            const u = uvHelper.interpolate(boundaries.boundary.XY, boundaries.boundaryTex.U, valueU);
            path[i % path.length].holesInU = u;
            dist += pathHelper.getDistance(path[i % path.length], path[(i + 1) % path.length]);
        }
        const valueU = (dist + offset.distance);
        const u = uvHelper.interpolate(boundaries.boundary.XY, boundaries.boundaryTex.U, valueU);
        path[startIndex].holesInU2 = u;
    },

    interpolate(boundarySrc, boundaryDst, value) {
        return (value - boundarySrc.min) / (boundarySrc.max - boundarySrc.min) * (boundaryDst.max - boundaryDst.min) + boundaryDst.min;
    },

    addUvsToGeoms(uvs, geoms) {
        for (const i in geoms) {
            let uv = [];
            if (geoms[i].uv) {
                continue;
            }
            if (!uvs[i]) {
                uv = Array(2 * geoms[i].points.length / 3);
            }
            geoms[i].uvs = uv;
        }
    },

    addUvToGeom(uvs, geom) {
        if (geom.uvs) {
            return;
        }
        if (!uvs || uvs.length === 0) { uvs = new Array(2 * geom.points.length / 3).fill(0); }
        geom.uvs = uvs;
    },

    setMinBoundaryHorr(outerShape, boundaries) {
        let minX = outerShape.path[0].X;
        let minY = outerShape.path[0].Y;

        for (let i = 1; i < outerShape.path.length; i++) {
            const x = outerShape.path[i].X;
            const y = outerShape.path[i].Y;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
        }
        boundaries.boundary.XY.min += minX;
        boundaries.boundary.Z.min += minY;

        boundaries.boundary.XY.max += minX;
        boundaries.boundary.Z.max += minY;
    },

    getBoundaries(pathsByDepth, outerShape, options) {
        let maxLength = uvHelper.getMaxPathLength(pathsByDepth);
        maxLength = Math.max(pathHelper.getTotalLength(outerShape.path));
        const maxDepth = outerShape.depth;
        const max = Math.max(maxLength, maxDepth);

        const boundaryTex = { U: { min: 0, max: 1 }, V: { min: 0, max: 1 } };
        const boundary = { XY: { min: 0, max }, Z: { min: 0, max } };

        if (options.lengthU) {
            boundary.XY.max = options.lengthU * constants.scaleFactor;
        }
        if (options.lengthV) {
            boundary.Z.max = options.lengthV * constants.scaleFactor;
        }

        return { boundary, boundaryTex };
    },

    getO1BoudnaryTex() {
        return {
            X: {
                min: 0,
                max: 1,
            },
            Y: {
                min: 0,
                max: 1,
            },
        };
    },

};
module.exports = uvHelper;
