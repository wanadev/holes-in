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

    getUVVertFaces: function(outerShape, verticalGeom) {
        let boundaryTex = uvHelper.getO1BoudnaryTex();
        let uvs = [];
        let boundaryPath = pathHelper.getPathBoundary(outerShape.path);
        boundaryPath.Y={min:0, max:outerShape.depth};

        let points = verticalGeom.points;

        let uv = uvHelper.mapVertical(boundaryPath, boundaryTex, points);
        uvHelper.addUvToGeom(uv, verticalGeom);

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

    mapVertical: function(boundaryShape, boundaryTex, points) {
        let res = [];
        for (let i = 0; i < points.length; i += 3) {
            let point = points.slice(i, i + 3);
            res.push(...uvHelper.getUVFromVertPoint(boundaryShape, boundaryTex, point));
        }
        return res;

    },
    getUVFromVertPoint: function(boundaryShape, boundaryTex, point) {

        let U = uvHelper.interpolate(boundaryShape.X, boundaryTex.X, point[0]);
        let V = uvHelper.interpolate(boundaryShape.Y, boundaryTex.Y, point[2]);
        return [U, V];
    },

    createUvs: function(pathsByDepth){

        let pathsZeroDepth=pathsByDepth[0];
        for(let j in pathsZeroDepth){
            let uvs=[];
            for (let )
        }

        for(let i=1;i< pathsByDepth.length;i++){
            pathsByDepth[i].uvs=[];
            for(let j=0;j< pathsByDepth[i].paths.length;j++){
                let numPts= pathsByDepth[i].paths[j].length;
                let uvs=Array(numPts).fill({U:-1,V:-1});
                pathsByDepth[i].uvs.push( uvs);
            }
        }
    },
    getUvsVertPath0: function(pathsByDepth){
        let paths0= pathsByDepth[0];
        for(let i in paths0){
            let path= paths0[i];
            let pathLength= pathHelper.getTotalLength(path);

        }


    }

    getUvsVertPath: function(indPath, pathsByDepth, indexDepth,boundaryTex){
        let pathsAtDepth= pathsByDepth[indexDepth];
        let path= pathsAtDepth.paths[indPath];
        let uv= pathsAtDepth.uvs[indPath];

        let minIndex= pathHelper.getMinIndex(path);
        let pathLength= pathHelper.getTotalLength(path);
        let boundaryShape= {X:{min: }}


        if(uv[minIndex].U!==-1){return;}
        uv[minIndex].U=
        for(let i =minIndex;i< path.length+minIndex;i++){
            let indexPt= i%path.length;


            // if(uvHelper.getMatchingUvs(i,indPath, pathsByDepth,indexDepth))
            // {}
        }

    }

    getMatchingUvs: function(indPtUp, indPathUp, pathsByDepth, indexDepth) {
        let pathUp= pathsByDepth[indexDepth].paths[indPathUp];
        let nIndPtUp= (indPtUp+1)%pathUp.length;
        let edgeUp= pathHelper.getEdge(pathUp[indPtUp], pathUp[nIndPtUp]);

        let uvInterp;
        for (let i = indexDepth - 1; i >= 0; i--) {
            let pathsAtDepth = pathsByDepth[i].paths;
            for (let j in pathsAtDepth) {
                let match = pathHelper.getMatchingEdge(pathsAtDepth.paths[j], edgeUp);
                if (match === undefined) {
                    continue;
                }
                let uvUp1=pathsByDepth[indexDepth].uvs[indPathUp][indPtUp];
                let uvUp2=pathsByDepth[indexDepth].uvs[indPathUp][nIndPtUp];
                let ptUp1=pathUp[indPtUp];
                let ptUp2=pathUp[nIndPtUp];

                let boundaryUp= pathHelper.getPathBoundary( [uvUp1,uvUp2]);
                let boundaryDwn= pathHelper.getPathBoundary(ptUp1,ptUp2);


                let uvDwn1= uvHelper.interpolate(boundaryDwn, boundaryUp,pathsAtDepth.paths[j][match.ind1]);
                let uvDwn2= uvHelper.interpolate(boundaryDwn, boundaryUp,pathsAtDepth.paths[j][match.ind2]);
                pathsAtDepth[j].uvs[match.ind1]=uvDwn1;
                pathsAtDepth[j].uvs[match.ind2]=uvDwn2;
                return true;
            }
        }
        return false;
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
        if (!uvs) uvs = new Array(2 * geom.points.length / 3).fill(0);
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
