"use strict";

const pathHelper = require("./path-helper.js");
const constants = require("./constants.js");

const geomHelper = {


    mergeMeshes(geoms, considerOffset = true) {
        let res = geoms[0];
        for (let i = 1; i < geoms.length; i++) {
            res = geomHelper.mergeMesh(res, geoms[i], considerOffset);
        }
        return res;
    },

    mergeMesh(geom1, geom2, considerOffset) {
        if (!geom2) return geom1;
        if (!geom1) return geom2;

        if (considerOffset) {
            geom1.faces.push(...geom2.faces.map(f => f + (+geom1.offset)));
            geom1.offset = (+geom1.offset) + (+geom2.offset);
        } else {
            geom1.faces.push(...geom2.faces);
            geom1.offset = Math.max(geom1.offset, geom2.offset);
        }
        geom1.points.push(...geom2.points);
        geom1.normals.push(...geom2.normals);
        if (geom1.uvs && geom2.uvs) {
            geom1.uvs.push(...geom2.uvs);
        }
        return geom1;
    },

    /*
     * Returns two triangles representing the larger face we can build from the edge ptDwn->nPtDwn
     */
    getOneVerticalGeom(idxPtDwn, nIdxPtDwn, indexDepthDwn, pathDwn, pathsByDepth, toMarkPaths, offset = 0, invertNormal = false) {
        const ptDwn = pathDwn[idxPtDwn];
        const nPtDwn = pathDwn[nIdxPtDwn];
        // if(!toMarkPaths && !ptDwn._holesInForbidden){return;}

        const indexDepthUp = geomHelper.getMatchDepths(ptDwn, nPtDwn, +indexDepthDwn, pathsByDepth);
        if (indexDepthUp === undefined || indexDepthUp < 0) {
            return;
        }
        // geomHelper.markAsVisited(ptDwn,nPtDwn, toMarkPaths,indexDepthDwn);
        const depthUp = pathsByDepth[indexDepthUp].depth;
        const depthDwn = pathsByDepth[indexDepthDwn].depth;
        const res = geomHelper.getPtsNormsIndx2d(ptDwn, nPtDwn, depthUp, depthDwn, +offset, invertNormal);

        res.uvs = [];
        // add uvs:
        geomHelper.addUvsToVertGeom(res, +idxPtDwn, pathDwn, pathsByDepth, indexDepthDwn, indexDepthUp);


        return res;
    },

    /**
     * Returns the depths at which they are two edges with the same 2D coords.
     * If it does not exists such a edge, returns the current depth and the depth above
     */
    getMatchDepths(ptDwn, nPtDwn, indexDepth, pathsByDepth) {
        // for each depth deeper than pathUp,we look for a corresponding point:
        let res = indexDepth - 1;
        for (let i = indexDepth - 1; i >= 0; i--) {
            const pathsAtDepth = pathsByDepth[i].paths;
            if (!pathsAtDepth) { continue; }

            for (let j = 0; j < pathsAtDepth.length; j++) {
                // for each path at each depth:
                const pathUp = pathsAtDepth[j];
                const match1 = pathHelper.getPointMatch(pathUp, ptDwn);
                const match2 = pathHelper.getPointMatch(pathUp, nPtDwn);
                const perfectMatch = match1 && match2 && (match1.index + 1) % pathUp.length === match2.index;
                if (!match1) { continue; }
                if (pathsByDepth[i].paths[j][match1.index]._holesInVisited) { return; }
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

    markAsVisited(pointA, pointB, toMarkPaths, depth) {
        if (!toMarkPaths) { return; }
        for (let i = depth; i >= 0; i--) {
            const paths = toMarkPaths[i].paths;
            for (const j in paths) {
                const match1 = pathHelper.getPointMatch(paths[j], pointA);
                const match2 = pathHelper.getPointMatch(paths[j], pointB);
                if (!match1 || !match2) { continue; }
                paths[j][match1.index]._holesInForbidden = true;
            }
        }
    },

    getPtsNormsIndx2d(point2d1, point2d2, depthUp, depthDwn, offset, invertNormal = false) {

        const point1 = geomHelper.getPoint3(point2d1, depthUp);
        const point2 = geomHelper.getPoint3(point2d1, depthDwn);
        const point3 = geomHelper.getPoint3(point2d2, depthDwn);
        const point4 = geomHelper.getPoint3(point2d2, depthUp);

        return geomHelper.getPtsNormsIndx3d([point1, point2, point3, point4], +offset, invertNormal);
    },

    getPtsNormsIndx3d(points3d, offset, invertNormal) {

        let resFaces;
        let normal;
        if (invertNormal) {
            resFaces = ([0, 1, 2, 0, 2, 3]).map(elt => elt + offset);
            normal = geomHelper.getNormalToPlan(points3d[0], points3d[1], points3d[2]);
        } else {
            resFaces = ([2, 1, 0, 3, 2, 0]).map(elt => elt + offset);
            normal = geomHelper.getNormalToPlan(points3d[2], points3d[1], points3d[0]);
        }

        const resNorm = [];
        resNorm.push(...normal);
        resNorm.push(...normal);
        resNorm.push(...normal);
        resNorm.push(...normal);
        const resPoints = [];
        resPoints.push(...points3d[0]);
        resPoints.push(...points3d[1]);
        resPoints.push(...points3d[2]);
        resPoints.push(...points3d[3]);


        return {
            points: resPoints,
            normals: resNorm,
            faces: resFaces,
            offset: offset + 4,
        };
    },

    addUvsToVertGeom(geom, indexPtDwn, pathDwn, pathsByDepth, indexDepth, indexDepthUp) {

        const vUp = pathsByDepth[indexDepthUp].holesInV;
        const vDwn = pathsByDepth[indexDepth].holesInV;

        const nIndexPtDwn = (indexPtDwn + 1) % pathDwn.length;
        const u = pathDwn[indexPtDwn].holesInU;
        let nu = pathDwn[nIndexPtDwn].holesInU;

        if (pathDwn[nIndexPtDwn].holesInU2) {
            nu = pathDwn[nIndexPtDwn].holesInU2;
        }

        const uvs = [u, vUp,
            u, vDwn,
            nu, vDwn,
            nu, vUp];
        geom.uvs.push(...uvs);

    },

    getHorrizontalGeom(triangles, offset = 0, invertNormal) {
        if (triangles.triangles.length > 0) {
            const currGeom = geomHelper.getGeomFromTriangulation(triangles, +triangles.depth, invertNormal, offset);
            offset = currGeom.offset;
            return currGeom;
        }
    },


    getGeomFromTriangulation(triangles, depth, invertNormal = false, offset = 0) {
        const points = [];

        for (const i in triangles.points) {
            points.push(triangles.points[i][0] / constants.scaleFactor);
            points.push(triangles.points[i][1] / constants.scaleFactor);
            points.push(depth);
        }

        if (!invertNormal) {
            for (const i in triangles.triangles) {
                triangles.triangles[i].reverse();
            }
        }
        // offsets faces
        const faces = [];
        for (const i in triangles.triangles) {
            faces.push(...triangles.triangles[i].map(index => index + offset)); // eslint-disable-line
        }
        offset += triangles.points.length;

        // get normals:
        const normals = [];
        const idxs = triangles.triangles[0].map(elt => elt * 3);
        const pt1 = points.slice(idxs[0], idxs[0] + 3);
        const pt2 = points.slice(idxs[1], idxs[1] + 3);
        const pt3 = points.slice(idxs[2], idxs[2] + 3);
        const normal = geomHelper.getNormalToPlan(pt1, pt2, pt3);

        for (const i in triangles.points) { // eslint-disable-line
            normals.push(...normal);
        }

        return {
            points,
            faces,
            normals,
            offset,
        };
    },


    getNormalToPlan(point1, point2, point4) {
        const vec1 = geomHelper.pointsToVec(point1, point2);
        const vec2 = geomHelper.pointsToVec(point1, point4);
        return geomHelper.normalizeVec(geomHelper.cross(vec2, vec1));

    },

    pointsToVec(point1, point2) {
        return [point2[0] - point1[0], point2[1] - point1[1], point2[2] - point1[2]];
    },

    getPoint3(point2, depth) {
        return [point2.X / constants.scaleFactor, point2.Y / constants.scaleFactor, depth];
    },

    cross(vec1, vec2) {
        return [vec1[1] * vec2[2] - vec1[2] * vec2[1],
            vec1[2] * vec2[0] - vec1[0] * vec2[2],
            vec1[0] * vec2[1] - vec1[1] * vec2[0],
        ];
    },

    normalizeVec(vec) {
        const norm = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
        return [vec[0] / norm, vec[1] / norm, vec[2] / norm];
    },


};
module.exports = geomHelper;
