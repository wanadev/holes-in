
const pathHelper = require("./path-helper.js");

var geomHelper = {


    concatGeometries: function(geoms, considerOffset) {
        let res = geoms[0];
        for (let i = 1; i < geoms.length; i++) {
            res = geomHelper.concatGeometry(res, geoms[i], considerOffset);
        }
        return res;
    },

    concatGeometry: function(geom1, geom2, considerOffset) {
        if (considerOffset) {
            geom1.faces.push(...geom2.faces.map(f => f + (+geom1.offset)));
            geom1.offset += geom2.offset;
        } else {
            geom1.faces.push(...geom2.faces);
            geom1.offset += geom2.offset;
        }
        geom1.points.push(...geom2.points);
        geom1.normals.push(...geom2.normals);
        return geom1;
    },


    getOuterGeom: function(pathOuter, depths, options){


    },


    /*
    * Returns two triangles representing the larger face we can build from the edge ptDwn->nPtDwn
    */
    getOneInnerVerticalGeom: function(ptDwn, nPtDwn, indexDepthDwn, pathsByDepth, offset = 0) {

        let match = geomHelper.getMatchDepths(ptDwn, nPtDwn, +indexDepthDwn, pathsByDepth);
        if (!match) {
            return;
        }
        let res = geomHelper.getPtsNormsIndx2d(ptDwn, nPtDwn, +match.depthUp, +match.depthDwn, +offset);
        return res;
    },

    /**
     * Returns the inner geometry from an array of triangles by depth
     */
    getHorizontalInnerGeom: function(trianglesByDepth, offset = 0) {
        let faces = [];
        let points = [];
        let normals = [];
        Object.keys(trianglesByDepth).forEach(i => {
            //creates points
            let currPoint = [];
            Object.values(trianglesByDepth[i].points).forEach(point => {
                currPoint.push(point[0]);
                currPoint.push(point[1]);
                currPoint.push(trianglesByDepth[i].depth);
            });
            points.push(...currPoint);
            //offsets faces
            Object.values(trianglesByDepth[i].triangles).forEach(triangle => {
                faces.push(...triangle.map(index => index + offset));
            });
            offset += trianglesByDepth[i].points.length;

            //get normals:
            let normal = geomHelper.getNormalToPlan(currPoint.slice(0, 3),
                currPoint.slice(3, 6),
                currPoint.slice(6, 9));
            Object.values(trianglesByDepth[i].points).forEach(point => {
                normals.push(...normal);
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
    getMatchDepths: function(ptDwn, nPtDwn, indexDepth, pathsByDepth) {
        //for each depth deeper than pathUp,we look for a corresponding point:
        let depthUp = pathsByDepth.depths[indexDepth - 1];
        let depthDwn = pathsByDepth.depths[indexDepth];
        for (let i = indexDepth - 1; i >= 0; i--) {
            let pathsAtDepth = pathsByDepth.paths[i];
            for (let j = 0; j < pathsAtDepth.length; j++) {
                //for each path at each depth:
                let pathUp = pathsAtDepth[j];
                let match1 = pathHelper.getPointMatch(pathUp, ptDwn);
                let match2 = pathHelper.getPointMatch(pathUp, nPtDwn);
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

    getPtsNormsIndx2d: function(point2d1, point2d2, depthUp, depthDwn, offset) {

        let point1 = geomHelper.getPoint3(point2d1, depthUp);
        let point2 = geomHelper.getPoint3(point2d1, depthDwn);
        let point3 = geomHelper.getPoint3(point2d2, depthDwn);
        let point4 = geomHelper.getPoint3(point2d2, depthUp);

        return geomHelper.getPtsNormsIndx3d([point1, point2, point3, point4], +offset);
    },

    getPtsNormsIndx3d: function(points3d, offset) {
        let normal = geomHelper.getNormalToPlan(points3d[0], points3d[1], points3d[2], offset);
        let resNorm = [];
        resNorm.push(...normal);
        resNorm.push(...normal);
        resNorm.push(...normal);
        resNorm.push(...normal);
        let resPoints = [];
        resPoints.push(...points3d[0]);
        resPoints.push(...points3d[1]);
        resPoints.push(...points3d[2]);
        resPoints.push(...points3d[3]);
        let resFaces = ([0, 2, 1, 0, 3, 2]).map(elt => elt + offset);
        return {
            points: resPoints,
            normals: resNorm,
            faces: resFaces,
            offset: offset + 4
        };
    },

    getInnerHorizontalGeom: function(trianglesByDepth, offset = 0) {
        let faces = [];
        let points = [];
        let normals = [];
        Object.keys(trianglesByDepth).forEach(i => {
            //creates points
            let currPoint = [];
            Object.values(trianglesByDepth[i].points).forEach(point => {
                currPoint.push(point[0]);
                currPoint.push(point[1]);
                currPoint.push(trianglesByDepth[i].depth);
            });
            points.push(...currPoint);
            //offsets faces
            Object.values(trianglesByDepth[i].triangles).forEach(triangle => {
                faces.push(...triangle.map(index => index + offset));
            });
            offset += trianglesByDepth[i].points.length;

            //get normals:
            let normal = geomHelper.getNormalToPlan(currPoint.slice(0, 3),
                currPoint.slice(3, 6),
                currPoint.slice(6, 9));
            Object.values(trianglesByDepth[i].points).forEach(point => {
                normals.push(...normal);
            });
        });

        return {
            points: points,
            faces: faces,
            normals: normals,
            offset: offset
        };
    },


    getNormalToPlan: function(point1, point2, point4) {
        let vec1 = geomHelper.pointsToVec(point1, point2);
        let vec2 = geomHelper.pointsToVec(point1, point4);
        return geomHelper.normalizeVec(geomHelper.cross(vec1, vec2));
    },

    pointsToVec: function(point1, point2) {
        return [point2[0] - point1[0], point2[1] - point1[1], point2[2] - point1[2]];
    },

    getPoint3: function(point2, depth) {
        return [point2.X, point2.Y, depth];
    },

    cross: function(vec1, vec2) {
        return [vec1[1] * vec2[2] - vec1[2] * vec2[1],
            vec1[2] * vec2[0] - vec1[0] * vec2[2],
            vec1[0] * vec2[1] - vec1[1] * vec2[0]
        ];
    },

    normalizeVec: function(vec) {
        let norm = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
        return [vec[0] / norm, vec[1] / norm, vec[2] / norm];
    },


};
module.exports = geomHelper;
