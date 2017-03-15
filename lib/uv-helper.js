"use strict";

const pathHelper = require("./path-helper.js");


var uvHelper = {

    /*************************************
        First paradygm: map on vertival and horizontal independantly.
        Don't care about discontinuities between vertical and horizontal.
    ***************************************/

    getUVHorFaces: function(outerShape, horizontalGeom) {
        let boundaryTex = uvHelper.getO1BoudnaryTex();
        let uvs = [];
        let boundaryPath = pathHelper.getPathBoundary(outerShape.path);
        let points = horizontalGeom.points;

        let uv = uvHelper.mapHorizontal(boundaryPath, boundaryTex, points);
        uvHelper.addUvToGeom(uv, horizontalGeom);
        return uvs;
    },


    mapHorizontal: function(boundaryShape, boundaryTex, points) {
        let res = [];
        for (let i = 0; i < points.length; i += 3) {
            let point = points.slice(i, i + 3);
            res.push(...uvHelper.getUVFromHorrPoint(boundaryShape, boundaryTex, point));
        }
        return res;
    },

    mapVertical: function(pathsByDepth) {

        //determine the interpolation function:
        // let interp = uvHelper.getInterpVert(pathsByDepth);
        let maxLength = Math.max(pathHelper.getTotalLength(...pathsByDepth[0].paths));
        let maxDepth= pathsByDepth[pathsByDepth.length-1].depth;

        let boundary= {XY:{min:0, max:maxLength} ,Z:{min:0,max:maxDepth}};
        let boundaryTex= {U:{min:0, max:1} ,V:{min:0,max:1}};

        //for each depth: constructs the uvs:

        for (let depth in pathsByDepth) {
            let pathsAtDepth = pathsByDepth[depth];
            for (let i in pathsAtDepth.paths) {
                uvHelper.getUvsVertPath(i, pathsByDepth, +depth, boundary,boundaryTex);
            }
        }
    },



    getUvsVertPath: function(indPath, pathsByDepth, indexDepth,boundary, boundaryTex) {
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
            offset.u= match.pointmatch.UV[0];
        }

        //interpolates
        // uvHelper.interpolateVert(path, pathsAtDepth.depth, offset,maxLength,maxDepth);
        uvHelper.interpolatePath(path,boundary,boundaryTex,offset,pathsAtDepth.depth);
    },

    interpolatePath:function(path, boundary,boundaryTex,offset,depth )
    {
        let dist=0;
        let startIndex= offset.index;
        for (let i = startIndex; i < path.length+startIndex; i++) {
            let valueU= (dist+offset.distance);
            let valueV=depth ;
            // uvHelper.addUVToPt(path[i%path.length], valueU,valueV, boundary,boundaryTex);
            let u= uvHelper.interpolate(boundary.XY, boundaryTex.U,valueU);
            let v= uvHelper.interpolate(boundary.Z, boundaryTex.V,valueV);
            path[i%path.length].UV=[u,v];
            dist = dist + pathHelper.getDistance(path[i%path.length], path[(i + 1) % path.length]);
        }
        let valueU= (dist+offset.distance);
        let valueV=depth;
        let u= uvHelper.interpolate(boundary.XY, boundaryTex.U,valueU);
        let v= uvHelper.interpolate(boundary.Z, boundaryTex.V,valueV);
        path[startIndex].UV2=[u,v];
        // uvHelper.addUVToPt(path[startIndex%path.length], valueU,valueV, boundary,boundaryTex);


    },

/**    addUVToPt: function(pt, valueU, valueV, boundary,boundaryTex)
    {
        let u= uvHelper.interpolate(boundary.XY, boundaryTex.U,valueU);
        let v= uvHelper.interpolate(boundary.Z, boundaryTex.V,valueV);
        path[i%path.length].UV=[u,v];
    },
*/
    getMaxPathLength:function(pathsByDepth){
        let max=0;
        for(let i in pathsByDepth)
        {
            max= Math.max(max,  Math.max(pathHelper.getTotalLength(...pathsByDepth[i].paths)))
        }
        return max;
    },

    /*interpolateVert: function(path, depth, offset,maxLength,maxDepth) {
        let dist = 0;

        let startIndex= offset.index;  //pathHelper.getTopLeftIndex(path);
        for (let i = startIndex; i < path.length+startIndex; i++) {
            let value= (dist+offset.distance);

            path[i%path.length].UV = [(offset.u+/maxLength),
                depth/maxDepth
            ];
            dist = dist + pathHelper.getDistance(path[i%path.length], path[(i + 1) % path.length]);
        }

        path[startIndex].UV2 = [offset.u+(dist+offset.distance)/maxLength,
            depth/maxDepth
        ];
    },*/

    getInterpVert: function(pathsByDepth) {
        //finds the max length:
        let paths= pathsByDepth[0].paths;
        let maxLength = Math.max(pathHelper.getTotalLength(...paths));
        let maxDepth= paths[paths.length-1].depth;
        let funcHorrizontal = (x, offset = 0) => x / maxLength + offset;
        let funcVertical = (x) => x / outerShape.depth;
        return {
            U: funcHorrizontal,
            V: funcVertical
        };
    },


    // interpolateVertUV:  function(uvs, indexUV,   )

    getUVFromHorrPoint: function(boundaryShape, boundaryTex, point) {

        let U = uvHelper.interpolate(boundaryShape.X, boundaryTex.X, point[0]);
        let V = uvHelper.interpolate(boundaryShape.Y, boundaryTex.Y, point[1]);
        return [U, V];

    },

    interpolate: function(boundarySrc, boundaryDst, value) {
        return (value - boundarySrc.min) / (boundarySrc.max - boundarySrc.min) * (boundaryDst.max - boundaryDst.min) + boundaryDst.min;
    },

    addUvsToGeoms: function(uvs, geoms) {
        for (let i in geoms) {
            let uv = []
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
        if (!uvs[0]) uvs = new Array(2 * geom.points.length / 3).fill(0);
        geom.uvs = uvs;
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
