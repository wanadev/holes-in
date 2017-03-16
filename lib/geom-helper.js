const pathHelper = require("./path-helper.js");
const cdt2dHelper = require("./cdt2d-helper.js");


var geomHelper = {


    mergeMeshes: function(geoms, considerOffset = true) {
        let res = geoms[0];
        for (let i = 1; i < geoms.length; i++) {
            res = geomHelper.mergeMesh(res, geoms[i], considerOffset);
        }
        return res;
    },

    mergeMesh: function(geom1, geom2, considerOffset) {
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
        if(geom1.uvs && geom2.uvs)
        {
            geom1.uvs.push(...geom2.uvs);
        }
        return geom1;
    },

    getOuterVerticalGeom: function(outerShape, depth, offset = 0) {

        let res = []

        for (let i = 0; i < outerShape.path.length; i++) {
            let pt1 = outerShape.path[i];
            let pt2 = outerShape.path[(i + 1) % outerShape.path.length];
            let geom = geomHelper.getPtsNormsIndx2d(pt1, pt2, 0, depth, +offset, true);
            offset = geom.offset;
            geom.uvs=[];
            geomHelper.addUvsToOuterVertGeom(geom, pt1,pt2);
            res.push(geom);
        }
        return geomHelper.mergeMeshes(res, false);
    },

    /*
     * Returns two triangles representing the larger face we can build from the edge ptDwn->nPtDwn
     */
    getOneInnerVerticalGeom: function(idxPtDwn, nIdxPtDwn, indexDepthDwn,pathDwn, pathsByDepth, offset = 0) {
        let ptDwn= pathDwn[idxPtDwn];
        let nPtDwn= pathDwn[nIdxPtDwn];
        let match = geomHelper.getMatchDepths(ptDwn, nPtDwn, +indexDepthDwn, pathsByDepth);
        if (!match) {
            return;
        }
        let res = geomHelper.getPtsNormsIndx2d(ptDwn, nPtDwn, +match.depthUp, +match.depthDwn, +offset);

        res.uvs=[];
        //add uvs:
        geomHelper.addUvsToInnerVertGeom(res, +idxPtDwn,match.pathUp ,pathDwn,pathsByDepth, indexDepthDwn);


        return res;
    },

    /**
     * Returns the depths at which they are two edges with the same 2D coords.
     * If it does not exists such a edge, returns the current depth and the depth above
     */
    getMatchDepths: function(ptDwn, nPtDwn, indexDepth, pathsByDepth) {
        //for each depth deeper than pathUp,we look for a corresponding point:
        let depthUp = pathsByDepth[indexDepth - 1].depth;
        let depthDwn = pathsByDepth[indexDepth].depth;
        let pathUpRes;
        for (let i = indexDepth - 1; i >= 0; i--) {
            let pathsAtDepth = pathsByDepth[i].paths;
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
                depthUp = pathsByDepth[i].depth;
                depthDwn = pathsByDepth[indexDepth].depth;
                pathsByDepth[i].paths[j][match1.index].visited = true;
                pathUpRes=pathUp;
                i=-1;
                break;
            }
        }
        return {
            depthUp: depthUp,
            pathUp:pathUpRes,
            depthDwn: depthDwn,
        };
    },

    getPtsNormsIndx2d: function(point2d1, point2d2, depthUp, depthDwn, offset,invertNormal=false) {

        let point1 = geomHelper.getPoint3(point2d1, depthUp);
        let point2 = geomHelper.getPoint3(point2d1, depthDwn);
        let point3 = geomHelper.getPoint3(point2d2, depthDwn);
        let point4 = geomHelper.getPoint3(point2d2, depthUp);

        return geomHelper.getPtsNormsIndx3d([point1, point2, point3, point4], +offset,invertNormal);
    },

    getPtsNormsIndx3d: function(points3d, offset,invertNormal) {
        let normal = geomHelper.getNormalToPlan(points3d[0], points3d[1], points3d[2],invertNormal);
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
        let resFaces;
        if(invertNormal){
            resFaces= ([0, 1, 2, 0, 2, 3]).map(elt => elt + offset);
        }
        else{
            resFaces= ([0, 2, 1, 0, 3, 2]).map(elt => elt + offset);
        }

        return {
            points: resPoints,
            normals: resNorm,
            faces: resFaces,
            offset: offset + 4
        };
    },

    addUvsToInnerVertGeom: function(geom,indexPtDwn,pathUp,pathDwn,pathsByDepth,indexDepth){

        let vUp;
        if(pathUp)
        {
            vUp= pathUp[0].UV[1];
        }
        else {
            vUp= pathsByDepth[indexDepth-1].paths[0][0].UV[1];
        }

        let nIndexPtDwn= (indexPtDwn+1)%pathDwn.length;
        let u=pathDwn[indexPtDwn].UV[0];
        let v=pathDwn[indexPtDwn].UV[1];
        let nu=pathDwn[nIndexPtDwn].UV[0];

        if(pathDwn[nIndexPtDwn].UV2)
        {
            nu=pathDwn[nIndexPtDwn].UV2[0];
        }
        let uvs= [u,vUp,
                  u,v,
                  nu,v,
                  nu,vUp];
        geom.uvs.push(...uvs);

    },

    addUvsToOuterVertGeom:function(geom,pt1, pt2)
    {
        let u1= pt1.UV[0];
        let u2= pt2.UV[0];
        if(pt2.UV2)
        {
            u2=pt2.UV2[0];
        }
        let vUp= pt1.UV[1];
        let vDwn= pt2.VDown;
        let uvs= [u1,vUp, u1,vDwn,u2,vDwn, u2,vUp];
        geom.uvs.push(...uvs);
    },

    getInnerHorizontalGeom: function(trianglesByDepth, options, offset = 0) {
        let res = [];
        let indexes = [];

        if (options.frontMesh) {
            indexes.push(0);
        }
        if (options.inMesh) {
            indexes.push(...Array.from(new Array(trianglesByDepth.length - 2), (val, index) => index + 1));
        }
        if (options.backMesh) {
            indexes.push(trianglesByDepth.length - 1);
        }


        for (let i of indexes) {
            let triangles = trianglesByDepth[i];
            let invertNormal = true;
            if (options.backMesh) {
              invertNormal = false;
            }
            let currGeom = geomHelper.getGeomFromTriangulation(triangles, +triangles.depth, invertNormal, offset);
            offset = currGeom.offset;
            res.push(currGeom);
        }
        return res;
    },


    getGeomFromTriangulation: function(triangles, depth, invertNormal=false, offset = 0) {
        let points = [];
        Object.values(triangles.points).forEach(point => {
            points.push(point[0]);
            points.push(point[1]);
            points.push(depth);
        });
        if(!invertNormal){
            for( let t of triangles.triangles){
                t.reverse();
            }
        }
        //offsets faces
        let faces = [];
        Object.values(triangles.triangles).forEach(triangle => {
            faces.push(...triangle.map(index => index + offset));
        });
        offset += triangles.points.length;

        //get normals:
        let normals = [];
        let normal = geomHelper.getNormalToPlan(points.slice(0, 3),
                points.slice(3, 6),
                points.slice(6, 9),invertNormal);

        Object.values(triangles.points).forEach(point => {
            normals.push(...normal);
        });
        return {
            points: points,
            faces: faces,
            normals: normals,
            offset: offset
        };
    },


    getNormalToPlan: function(point1, point2, point4, invertNormal=false) {
        let vec1;
        if (invertNormal) {
            vec1 = geomHelper.pointsToVec(point2, point1);
        } else {
            vec1 = geomHelper.pointsToVec(point1, point2);
        }
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
