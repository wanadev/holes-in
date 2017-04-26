"use strict";

const pathHelper = require("./path-helper.js");
const constants = require("./constants.js");

var uvHelper = {

    /*************************************
        First paradygm: map on vertival and horizontal independantly.
        Don't care about discontinuities between vertical and horizontal.
    ***************************************/

    mapHorrizontal: function(pathsByDepth,outerShape, horizontalGeom,options) {
        if(!horizontalGeom){return;}
        let points = horizontalGeom.points;
        let boundaries= uvHelper.getBoundaries(pathsByDepth,outerShape,options);
        uvHelper.setMinBoundaryHorr(outerShape, boundaries);
        let uv = uvHelper.getUVHorFaces(pathsByDepth,outerShape,boundaries, points);
        uvHelper.addUvToGeom(uv, horizontalGeom);
    },


    mapVertical: function(pathsByDepth,outerShape,options) {

        //determine the interpolation function:
        let boundaries= uvHelper.getBoundaries(pathsByDepth, outerShape,options);
        //for each depth: constructs the uvs:

        for (let depth in pathsByDepth) {
            let pathsAtDepth = pathsByDepth[depth];
            for (let i in pathsAtDepth.paths) {
                uvHelper.getUVertPath(i, pathsByDepth, +depth, boundaries);
            }
            let v= uvHelper.interpolate(boundaries.boundary.Z, boundaries.boundaryTex.V,pathsAtDepth.depth*constants.scaleFactor);
            pathsAtDepth.holesInV= v;
        }

    },

    getUVHorFaces: function(pathsByDepth,outerShape,boundaries, points) {
        let res = [];
        for (let i = 0; i < points.length; i += 3) {
            let point = points.slice(i, i + 3);
            res.push(...uvHelper.getUVFromHorrPoint(boundaries, point));
        }
        return res;
    },

    getUVertPath: function(indPath, pathsByDepth, indexDepth,boundaries) {
        let pathsAtDepth = pathsByDepth[indexDepth];
        let path = pathsAtDepth.paths[indPath];

        //finds into the upper paths if there is a matching edge
        let match;
        for (let i = indexDepth - 1; i >= 0; i--) {
            for (let j in pathsByDepth[i].paths) {
                let pathToMatch = pathsByDepth[i].paths[j];
                match = pathHelper.getMatchingEdgeIndex(path, pathToMatch);
                if (match) {
                    i = -1;
                    break;
                }
            }
        }
        let offset = {index:0,distance:0,u:0};
        //if so, offsets it to keep a max of continuity belong Z
        if (match) {
            offset.distance= pathHelper.getDistance(path[match.index],match.pointmatch);
            offset.index= match.index;
            offset.u= match.pointmatch.holesInU;
        }

        //interpolates
        uvHelper.interpolatePathU(path,boundaries,offset);

    },



    getMaxPathLength:function(pathsByDepth){
        let max=0;
        for(let i in pathsByDepth)
        {
            max= Math.max(max,  Math.max(pathHelper.getTotalLength(...pathsByDepth[i].paths)))
        }
        return max;
    },

    getUVFromHorrPoint: function(boundaries, point) {
        let U = uvHelper.interpolate(boundaries.boundary.XY, boundaries.boundaryTex.U, point[0]*constants.scaleFactor);
        let V = uvHelper.interpolate(boundaries.boundary.Z, boundaries.boundaryTex.V, point[1]*constants.scaleFactor);

        return [U, V];
    },

    interpolatePathU:function(path, boundaries,offset )
    {
        let dist=0;
        let startIndex= offset.index;
        for (let i = startIndex; i < path.length+startIndex; i++) {
            let valueU= (dist+offset.distance);
            let u= uvHelper.interpolate(boundaries.boundary.XY, boundaries.boundaryTex.U,valueU);
            path[i%path.length].holesInU=u;
            dist = dist + pathHelper.getDistance(path[i%path.length], path[(i + 1) % path.length]);
        }
        let valueU= (dist+offset.distance);
        let u= uvHelper.interpolate(boundaries.boundary.XY, boundaries.boundaryTex.U,valueU);
        path[startIndex].holesInU2=u;
    },

    interpolate: function(boundarySrc, boundaryDst, value) {
        return (value - boundarySrc.min) / (boundarySrc.max - boundarySrc.min) * (boundaryDst.max - boundaryDst.min) + boundaryDst.min;
    },

    addUvsToGeoms: function(uvs, geoms) {
        for (let i in geoms) {
            let uv = [];
            if (geoms[i].uv) {
                continue;
            }
            if (!uvs[i]) {
                uv = Array(2 * geoms[i].points.length / 3);
            };
            geoms[i].uvs = uv;
        }
    },

    addUvToGeom: function(uvs, geom) {
        if (geom.uvs) {
            return;
        }
        if (!uvs || uvs.length ===0) {uvs = new Array(2 * geom.points.length / 3).fill(0);}
        geom.uvs = uvs;
    },

    setMinBoundaryHorr: function(outerShape, boundaries){
        let minX = outerShape.path[0].X;
        let minY = outerShape.path[0].Y;

        for(let i =1; i < outerShape.path.length;i++){
            const x= outerShape.path[i].X;
            const y= outerShape.path[i].Y;
            if(x < minX) minX = x;
            if(y < minY) minY = y
        }
        boundaries.boundary.XY.min += minX;
        boundaries.boundary.Z.min += minY;

        boundaries.boundary.XY.max += minX;
        boundaries.boundary.Z.max += minY;
    },

    getBoundaries: function(pathsByDepth,outerShape,options)
    {
        let boundary;
        let boundaryTex;
        let maxLength = uvHelper.getMaxPathLength(pathsByDepth);
        maxLength= Math.max(pathHelper.getTotalLength(outerShape.path));
        let maxDepth= outerShape.depth;
        let max= Math.max(maxLength,maxDepth);
        boundaryTex= {U:{min:0, max:1} ,V:{min:0,max:1}};
        boundary= {XY:{min:0, max:max} ,Z:{min:0,max:max}};
        if(options.lengthU)
        {
            boundary.XY.max= options.lengthU * constants.scaleFactor;
        }
        if(options.lengthV)
        {
            boundary.Z.max= options.lengthV * constants.scaleFactor;
        }

        return {boundary:boundary,boundaryTex:boundaryTex};
    },

    getO1BoudnaryTex: function() {
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
