(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.holesIn = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var babylonHelper = {


swapAllToBabylon(geoms){
    Object.values(geoms).forEach( g => babylonHelper.swapToBabylon(g));
},

swapToBabylon(geom){
    if(!geom){return;}
    babylonHelper.swapValuesYZ(geom.normals);
    babylonHelper.swapValuesYZ(geom.points);
    babylonHelper.swapValuesTriangle(geom.faces);

},

swapValuesYZ(array) {
    let oldY;
    const step = 3;
    const Y = 1;
    const Z = 2;
    for (let i = 0; i < array.length; i += step) {
        oldY = array[i + Y];
        array[i + Y] = -array[i + Z];
        array[i + Z] = -oldY;
    }
},

swapValuesTriangle(array) {
    let oldIdx;
    const step = 3;
    const Y = 1;
    const Z = 2;
    for (let i = 0; i < array.length; i += step) {
        oldIdx = array[i + Y];
        array[i + Y] = array[i + Z];
        array[i + Z] = oldIdx;
    }
},

};
module.exports= babylonHelper;

},{}],2:[function(require,module,exports){
"use strict";

const cdt2d = require('cdt2d');

var cdt2dHelper = {


    computeTriangulation: function(points, options) {
        // let points= xor.concat(intersection).concat(pathOuter);
        let cdtPoints = cdt2dHelper.clipperTocdt2d(points);
        let cdtEdges = cdt2dHelper.pathsToEdges(points);
        if (!options) {
            options = {
                exterior: false,
                interior: true
            };
        }
        let triangles = cdt2d(cdtPoints, cdtEdges, options);
        return {
            points: cdtPoints,
            triangles: triangles
        };
    },

    pathsToEdges: function(paths) {
        let res = [];
        let offset = 0;
        for (let i = 0; i < paths.length; i++) {
            res = res.concat(cdt2dHelper.pathToEdges(paths[i], offset));
            offset += paths[i].length;
        }
        return res;
    },

    pathToEdges: function(path, offset) {
        let res = [];
        for (let i = 0; i < path.length - 1; i++) {
            res.push([offset + i, offset + i + 1]);
        }
        res.push([offset + path.length - 1, offset]);
        return res;
    },

    clipperTocdt2d: function(points) {
        let res = [];
        for (let i in points) {
            for (let j in points[i]) {
                res.push(cdt2dHelper.clipperPointTocdt2dPoint(points[i][j]));
            }
        }
        return res;
    },

    clipperPointTocdt2dPoint: function(point) {
        return [point.X, point.Y];
    },

};
module.exports = cdt2dHelper;

},{"cdt2d":11}],3:[function(require,module,exports){
"use strict";

var pathHelper= require("./path-helper.js");

var drawHelper={

getTopTrianglesByDepth: function(topoPathsByDepth, offset = 0) {
    let geomByDepth = [];
    for (let i in topoPathsByDepth) {
        let totaltopo = topoPathsByDepth[i].pos.concat(topoPathsByDepth[i].neg);
        geomByDepth.push(cdt2dHelper.computeTriangulation(totaltopo));
        geomByDepth[i].depth = topoPathsByDepth[i].depth;
    }
    return geomByDepth;
},

drawPaths: function(ctx, paths, position, fillColors, strokeColors, fillModes) {
    if (!fillModes) fillModes = [];
    for (let i in paths) {
        drawHelper.drawPath(ctx, paths[i], position, fillColors[i], strokeColors[i], fillModes[i]);
    }
},

drawPath: function(ctx, pathToDraw, position, fillColor, strokeColor, fillMode) {
    if (!position) position = {
        X: 0,
        Y: 0
    };
    let path = [];
    if (pathToDraw.length === 0) return;
    for (let i in pathToDraw) {
        path.push({
            X: pathToDraw[i].X + position.X,
            Y: pathToDraw[i].Y + position.Y
        });
    }


    ctx.lineWidth = 2;
    if (!fillColor) {
        fillColor = 'black';
    }
    ctx.fillStyle = fillColor;
    if (!strokeColor) {
        strokeColor = "black";
    }
    ctx.strokeStyle = strokeColor;
    if (!fillMode) {
        fillMode = "nonzero";
    }
    ctx.mozFillRule = fillMode;

    //Draws the inner of the path
    var pathFill = new Path2D();
    pathFill.moveTo(path[0].X, path[0].Y);
    for (let i = 0; i < path.length; i++) {
        pathFill.lineTo(path[i].X, path[i].Y);
    }
    pathFill.lineTo(path[0].X, path[0].Y);
    ctx.fill(pathFill, fillMode);
    ctx.closePath();
    //Draws the arrows
    var pathArrow = new Path2D();
    for (let i = 0; i < path.length - 1; i++) {
        drawHelper.drawArrow(ctx, path[i], path[i + 1]);
    }
    drawHelper.drawArrow(ctx, path[path.length - 1], path[0]);

    //Draws the dots:
    for (let i = 0; i < path.length; i++) {
        drawHelper.drawDot(ctx, path[i]);
    }
},
drawArrow(ctx, begin, end) {

    ctx.save();
    ctx.moveTo(begin.X, begin.Y);
    ctx.lineTo(end.X, end.Y);
    ctx.stroke();

    let vect = {
        X: end.X - begin.X,
        Y: end.Y - begin.Y
    };
    let norm = Math.sqrt(vect.X * vect.X + vect.Y * vect.Y);
    vect = {
        X: vect.X / norm,
        Y: vect.Y / norm
    };

    let angle = Math.PI / 2 + Math.atan2(vect.Y, vect.X);

    ctx.translate(begin.X + vect.X * norm * 0.75, begin.Y + vect.Y * norm * 0.75);
    ctx.rotate(angle);

    let sizeA = 5;
    let branch1 = {
        X: sizeA,
        Y: sizeA
    };
    let branch2 = {
        X: -sizeA,
        Y: sizeA
    };

    ctx.beginPath();
    ctx.moveTo(branch1.X, branch1.Y);
    ctx.lineTo(0, 0);
    ctx.lineTo(branch2.X, branch2.Y);
    ctx.stroke();

    ctx.restore();
},

drawDot: function(ctx, dot) {

    ctx.fillStyle = "red";
    ctx.fillRect(dot.X, dot.Y, 4, 4);
},

drawTriangles: function(ctx, pointsAndTriangles, translation) {
    for (let i in pointsAndTriangles.triangles) {
        cdt2dHelper.drawTriangle(ctx, pointsAndTriangles.points, pointsAndTriangles.triangles[i], translation);
    }
},

drawTriangle: function(ctx, points, triangle, translation) {
    if (!translation) {
        translation = {
            X: 0,
            Y: 0
        };
    }
    ctx.beginPath();
    ctx.moveTo(points[triangle[0]][0] + translation.X, points[triangle[0]][1] + translation.Y);
    ctx.lineTo(points[triangle[1]][0] + translation.X, points[triangle[1]][1] + translation.Y);
    ctx.lineTo(points[triangle[2]][0] + translation.X, points[triangle[2]][1] + translation.Y);
    ctx.lineTo(points[triangle[0]][0] + translation.X, points[triangle[0]][1] + translation.Y);
    ctx.stroke();

}

};
module.exports= drawHelper;

},{"./path-helper.js":8}],4:[function(require,module,exports){
"use-strict";


var exportHelper = {


    meshesToObj(meshes){
        let res="";

        for(let i in meshes){
            res+=exportHelper.meshToObj(meshes.inMesh, "mesh"+i);
            res += "\n";
        }

        return res;
    },

    meshToObj: function(mesh, meshName) {
        let res = "o " + meshName + "\n\n";
        res += exportHelper.verticesToObj(mesh.points);
        res += "\n";
        res += exportHelper.normalsToObj(mesh.normals);
        res+="\n";
        res+= exportHelper.texturesToObj(mesh.uvs);
        res += "\n";
        res += exportHelper.facesToObj(mesh.faces);
        return res;

    },
    verticesToObj: function(vertices) {

        return exportHelper.stepThreeArrayToObj(vertices, "v");
    },

    texturesToObj: function(textures) {
        return exportHelper.stepThreeArrayToObj(textures, "vt");
    },

    normalsToObj: function(normals) {
        return exportHelper.stepThreeArrayToObj(normals, "vt");
    },

    facesToObj: function(faces) {
        let res = "";
        for (let i = 0; i < faces.length; i += 3) {
            res += "f " + exportHelper.faceElement(faces[i]) + " " +
                exportHelper.faceElement(faces[i + 1]) + " " +
                exportHelper.faceElement(faces[i + 2]) + "\n";
        }
        return res;
    },
    faceElement: function(index) {
        return "v" + index + "/vt" + index + "/vn" + index;
    },


    stepThreeArrayToObj: function(array, prefix) {
        let res = "";
        for (let i = 0; i < array.length; i += 3) {
            res += prefix + " " + array[i] + " " + array[i + 1] + " " + array[i + 2] + "\n";
        }
        return res;
    }


};

module.exports = exportHelper;

},{}],5:[function(require,module,exports){
"use strict";

const clipperLib = require("clipper-lib");
const pathHelper = require("./path-helper.js");
const geomHelper = require("./geom-helper.js");
const cdt2dHelper = require("./cdt2d-helper.js");
const uvHelper = require("./uv-helper.js");
const exportHelper = require("./export-helper.js");
const babylonHelper = require("./babylon-helper.js");

var extruder = {

    /**
     * returns a mesh from an outer shape and holes
     */
    getGeometry: function(outerShape, holes, options) {
        //get the topology 2D paths by depth
        let data = extruder.getDataByDepth(outerShape, holes);
        let outerPathsByDepth= data.outerPathsByDepth;
        let innerPathsByDepth= data.innerPathsByDepth;
        let horrizontalPathsByDepth= data.horrizontalPathsByDepth;


        uvHelper.mapVertical(outerPathsByDepth, outerShape, options);

        let res = {};

        if (options.frontMesh) {
            res.frontMesh = extruder.getHorrizontalGeom(horrizontalPathsByDepth, {
                frontMesh: true
            },0,false);
            uvHelper.mapHorrizontal(innerPathsByDepth, outerShape, res.frontMesh, options);
        }
        if (options.backMesh) {
            res.backMesh = extruder.getHorrizontalGeom(horrizontalPathsByDepth, {
                backMesh: true
            });
            uvHelper.mapHorrizontal(innerPathsByDepth, outerShape, res.backMesh, options);
        }
        if (options.inMesh) {
            uvHelper.mapVertical(innerPathsByDepth, outerShape, options);
            let inMeshHor = extruder.getHorrizontalGeom(horrizontalPathsByDepth, {
                inMesh: true
            });

            let offset = 0;
            if (inMeshHor) {
                uvHelper.mapHorrizontal(innerPathsByDepth, outerShape, inMeshHor, options);
                offset = inMeshHor.offset;
            }

            let inMeshVert = extruder.getVerticalGeom(innerPathsByDepth, +offset,true);
            if (inMeshVert) {
                offset=inMeshVert.offset;
            }

            res.inMesh = geomHelper.mergeMeshes([inMeshHor,inMeshVert], false);
        }
        if (options.outMesh) {
            let outMesh = extruder.getVerticalGeom(outerPathsByDepth, 0,false);
            res.outMesh = outMesh;
        }



        if (options.swapToBabylon) {
            babylonHelper.swapAllToBabylon(res);
        }
        return res;
    },

    getVerticalGeom: function(innerPathsByDepth, offset = 0,invertNormal = false) {
        let geom = [];

        for (let indexDepth = innerPathsByDepth.length - 1; indexDepth > 0; indexDepth--) {
            let pathsAtDepth = innerPathsByDepth[indexDepth].paths;
            //for each point at each path at each depth we look for the corresponding point into the upper paths:
            for (let path of pathsAtDepth) {
                for (let indexPtDwn in path) {
                    let idxPtDwn = indexPtDwn;
                    let idxNPtDwn = ((+indexPtDwn) + 1) % path.length;
                    let currgeom = geomHelper.getOneVerticalGeom(idxPtDwn, idxNPtDwn, +indexDepth, path, innerPathsByDepth, +offset,invertNormal);
                    if (!currgeom) {
                        continue;
                    }
                    geom.push(currgeom);
                    offset = currgeom.offset;
                }
            }
        }
        return geomHelper.mergeMeshes(geom, false);
    },

    /**
     * Returns the geometry of the inner horrizontal facess
     */
    getHorrizontalGeom: function(horrizontalPathsByDepth, options, offset = 0,invertNormal=false) {
        //gets all the triangles by depth:
        let trianglesByDepth = [];
        let innerHorGeom = [];
        for (let i in horrizontalPathsByDepth) {
            let totaltopo = horrizontalPathsByDepth[i].paths;
            trianglesByDepth.push(cdt2dHelper.computeTriangulation(totaltopo));
            trianglesByDepth[i].depth = horrizontalPathsByDepth[i].depth;

        }
        // get points, normal and faces from it:
        let horrizontalGeomByDepth = geomHelper.getHorrizontalGeom(trianglesByDepth, options, +offset,invertNormal);
        return geomHelper.mergeMeshes(horrizontalGeomByDepth, false);
    },

    getDataByDepth: function(outerShape,holes){
        let outerPaths=[];
        let innerPaths=[];
        let horrizontalPaths=[];

        pathHelper.scaleUpPath(outerShape.path);
        for(let i in holes){
            pathHelper.scaleUpPath(holes[i].path);
        }

        let holesByDepth= extruder.getHolesByDepth(holes,outerShape);
        let outer= [outerShape.path];

        let stack=0;
        for(let i= holesByDepth.length-1;i>=0;i-- ){
            //compute the outer path:
            let removeFromOuter= pathHelper.getUnionOfPaths(holesByDepth[i].keep.concat(holesByDepth[i].stop));
            let diffInOut=pathHelper.getDiffOfPaths(removeFromOuter, outer);

            if(diffInOut.length>0){
                outer= pathHelper.getDiffOfPaths(outer, removeFromOuter);
            }
            outerPaths.push(outer);

            //fit the inner paths into the outer:
            let innerPath= pathHelper.getInterOfPaths(holesByDepth[i].keep, outer );
            innerPaths.push(innerPath);

            //computes the horrizontal Geom:
            let horrizontalPath;
             if(i===0 || i===holesByDepth.length-1){
                 horrizontalPath = outer.concat(innerPath);
             }else{
                horrizontalPath = pathHelper.getDiffOfPaths(holesByDepth[i].stop,holesByDepth[i].keep);
                //2=> fit it into the deeper outer
                let deeperOuter=outer;
                if(stack>0){deeperOuter= outerPaths[stack-1];}
                horrizontalPath=pathHelper.getInterOfPaths(horrizontalPath,deeperOuter);
             }
            horrizontalPaths.push(horrizontalPath);
            stack++;
        }

        for(let i in outerPaths){
            outerPaths[i]= pathHelper.simplifyPaths(outerPaths[i]);
            innerPaths[i]= pathHelper.simplifyPaths(innerPaths[i]);
            horrizontalPaths[i]= pathHelper.simplifyPaths(horrizontalPaths[i]);
            pathHelper.setDirectionPaths(outerPaths[i],-1);
            pathHelper.setDirectionPaths(innerPaths[i],-1);
            pathHelper.setDirectionPaths(horrizontalPaths[i],1);
            pathHelper.scaleDownPaths(outerPaths[i]);
            pathHelper.scaleDownPaths(innerPaths[i]);
            pathHelper.scaleDownPaths(horrizontalPaths[i]);
        }
        pathHelper.scaleDownPath(outerShape.path);

        for(let i in holes){
            pathHelper.scaleDownPath(holes[i].path);
        }

        outerPaths= outerPaths.reverse();
        innerPaths= innerPaths.reverse();
        horrizontalPaths= horrizontalPaths.reverse();


        for(let i in holesByDepth){
            outerPaths[i]= {paths: outerPaths[i], depth:holesByDepth[i].depth};
            innerPaths[i]= {paths: innerPaths[i], depth:holesByDepth[i].depth};
            horrizontalPaths[i]= {paths: horrizontalPaths[i], depth:holesByDepth[i].depth};

        }
        return {  outerPathsByDepth : outerPaths,
                  innerPathsByDepth: innerPaths,
                  horrizontalPathsByDepth: horrizontalPaths};



    },

    /**
     *  Takes an array of paths representing holes at different depths.
     *  One depth value/ path.
     *  returns an array of paths at each depth: simplify the geometry for each stage.
     */
    getHolesByDepth: function(holes, outerShape) {

        //sets all depths deeper than outerDepth  or equals to 0 to outerDepth:
        holes.map(function(elt) {
            (elt.depth >= outerShape.depth || elt.depth === 0) ? elt.depth = outerShape.depth + 1: elt.depth = elt.depth
        });

        holes.map(function(elt) {
            pathHelper.setDirectionPath(elt.path, 1);
        });

        //get all depths:
        let depths = new Set();
        for (let i in holes) {
            if (holes[i].depth < outerShape.depth)
                depths.add(holes[i].depth);
        }
        depths.add(0);
        depths.add(outerShape.depth);
        depths = Array.from(depths);
        depths.sort(
            function(a, b) {
                return a - b;
            });

        //get paths by depth:
        let res = [];
        for (let i in depths) {
            let deeperHoles = holes.filter((s) => s.depth > depths[i]);
            let keep=[];
            deeperHoles.map((s) => keep.push(s.path));

            let stopHoles = holes.filter((s) => s.depth === depths[i]);
            let stop=[];
            stopHoles.map((s) => stop.push(s.path));

            //take only the paths of the holes which reach this depth
            res.push({
                keep: keep,
                stop: stop,
                depth: depths[i]
            });
        }
        return res;
    },


};

module.exports = extruder;

},{"./babylon-helper.js":1,"./cdt2d-helper.js":2,"./export-helper.js":4,"./geom-helper.js":6,"./path-helper.js":8,"./uv-helper.js":9,"clipper-lib":16}],6:[function(require,module,exports){
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

    /*
     * Returns two triangles representing the larger face we can build from the edge ptDwn->nPtDwn
     */
    getOneVerticalGeom: function(idxPtDwn, nIdxPtDwn, indexDepthDwn,pathDwn, pathsByDepth, offset = 0,invertNormal=false) {
        let ptDwn= pathDwn[idxPtDwn];
        let nPtDwn= pathDwn[nIdxPtDwn];
        let match = geomHelper.getMatchDepths(ptDwn, nPtDwn, +indexDepthDwn, pathsByDepth);
        if (match===undefined) {
            return;
        }
        let depthDwn= pathsByDepth[indexDepthDwn].depth;
        let res = geomHelper.getPtsNormsIndx2d(ptDwn, nPtDwn, match, depthDwn, +offset,invertNormal);

        res.uvs=[];
        //add uvs:
        geomHelper.addUvsToVertGeom(res, +idxPtDwn,pathDwn,pathsByDepth, indexDepthDwn,indexDepthDwn-1);


        return res;
    },

    /**
     * Returns the depths at which they are two edges with the same 2D coords.
     * If it does not exists such a edge, returns the current depth and the depth above
     */
    getMatchDepths: function(ptDwn, nPtDwn, indexDepth, pathsByDepth) {
        //for each depth deeper than pathUp,we look for a corresponding point:
        let res = pathsByDepth[indexDepth -1].depth;
        let found=false;
        for (let i = indexDepth - 1; i >= 0; i--) {
            let pathsAtDepth = pathsByDepth[i].paths;
            if(!pathsAtDepth){continue;}

            for (let j = 0; j < pathsAtDepth.length; j++) {
                //for each path at each depth:
                let pathUp = pathsAtDepth[j];
                let match1 = pathHelper.getPointMatch(pathUp, ptDwn);
                let match2 = pathHelper.getPointMatch(pathUp, nPtDwn);
                let perfectMatch= match1 && match2 && (match2.index - match1.index)===1;

                if(!match1){continue;}
                if(pathsByDepth[i].paths[j][match1.index]._holesInVisited){return;}
                pathsByDepth[i].paths[j][match1.index]._holesInVisited = true;
                if(perfectMatch){
                    res = pathsByDepth[i].depth;
                    continue;
                }else {
                    return pathsByDepth[i].depth;
                }

            }
        }
        return res;
    },

    getPtsNormsIndx2d: function(point2d1, point2d2, depthUp, depthDwn, offset,invertNormal=false) {

        let point1 = geomHelper.getPoint3(point2d1, depthUp);
        let point2 = geomHelper.getPoint3(point2d1, depthDwn);
        let point3 = geomHelper.getPoint3(point2d2, depthDwn);
        let point4 = geomHelper.getPoint3(point2d2, depthUp);

        return geomHelper.getPtsNormsIndx3d([point1, point2, point3, point4], +offset,invertNormal);
    },

    getPtsNormsIndx3d: function(points3d, offset,invertNormal) {

        let resFaces;
        let normal;
        if(invertNormal){
            resFaces= ([0, 1, 2, 0, 2, 3]).map(elt => elt + offset);
            normal= geomHelper.getNormalToPlan(points3d[0], points3d[1], points3d[2]);
        }
        else{
            resFaces= ([2, 1, 0, 3, 2, 0]).map(elt => elt + offset);

            // resFaces= ([2, 1, 0, 3, 2, 0]).map(elt => elt + offset);
            normal= geomHelper.getNormalToPlan(points3d[2], points3d[1], points3d[0]);
        }




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


        return {
            points: resPoints,
            normals: resNorm,
            faces: resFaces,
            offset: offset + 4
        };
    },

    addUvsToVertGeom: function(geom,indexPtDwn,pathDwn,pathsByDepth,indexDepth,indexDepthUp){


        let vUp= pathsByDepth[indexDepthUp].V;
        let vDwn=pathsByDepth[indexDepth].V;

        let nIndexPtDwn= (indexPtDwn+1)%pathDwn.length;
        let u=pathDwn[indexPtDwn].U;
        let nu=pathDwn[nIndexPtDwn].U;

        if(pathDwn[nIndexPtDwn].U2)
        {
            nu=pathDwn[nIndexPtDwn].U2;
        }
        let uvs= [u,vUp,
                  u,vDwn,
                  nu,vDwn,
                  nu,vUp];
        geom.uvs.push(...uvs);

    },

    getHorrizontalGeom: function(trianglesByDepth, options, offset = 0) {
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
            if(triangles.points.length>0){
                let currGeom = geomHelper.getGeomFromTriangulation(triangles, +triangles.depth, invertNormal, offset);
                offset = currGeom.offset;
                res.push(currGeom);
            }
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
        let idxs= triangles.triangles[0].map (elt => elt*3);
        let pt1= points.slice(idxs[0],idxs[0]+3);
        let pt2= points.slice(idxs[1],idxs[1]+3);
        let pt3= points.slice(idxs[2],idxs[2]+3);
        let normal = geomHelper.getNormalToPlan(pt1,pt2,pt3);

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


    getNormalToPlan: function(point1, point2, point4) {
        let vec1 = geomHelper.pointsToVec(point1, point2);
        let vec2 = geomHelper.pointsToVec(point1, point4);
        return geomHelper.normalizeVec(geomHelper.cross(vec2, vec1));

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

},{"./cdt2d-helper.js":2,"./path-helper.js":8}],7:[function(require,module,exports){
"use strict";



const extruder = require("./extruder.js");
const geomHelper = require("./geom-helper.js");
const exportHelper= require("./export-helper.js");
const drawHelper= require("./draw-helper.js");
const pathHelper= require("./path-helper.js");

var holesIn = {

    meshesToObj: exportHelper.meshesToObj,
    meshToObj: exportHelper.meshToObj,
    getGeometry: extruder.getGeometry,
    mergeMeshes: geomHelper.mergeMeshes,

    drawPath: drawHelper.drawPath,
    drawPaths: drawHelper.drawPaths,

    scaleDownPath: pathHelper.scaleDownPath,
    scaleDownPaths: pathHelper.scaleDownPaths,
    getDataByDepth:extruder.getDataByDepth,
};

module.exports = holesIn;

},{"./draw-helper.js":3,"./export-helper.js":4,"./extruder.js":5,"./geom-helper.js":6,"./path-helper.js":8}],8:[function(require,module,exports){
"use strict";

const clipperLib = require("clipper-lib");

var pathHelper = {


    /**
     * Compute the xor of two arrays of path
     *
     */
    getXorOfPaths: function(pathsSubj, pathsClip) {
        let options = {
            subjectFillType: clipperLib.PolyFillType.pftNonZero,
            clipFillType: clipperLib.PolyFillType.pftNonZero,
            clipType: clipperLib.ClipType.ctXor
        };
        return pathHelper.executeClipper(pathsSubj, pathsClip, options);
    },

    /**
     * Compute the xor of two arrays of path
     *
     */
    getUnionOfPaths: function(pathsSubj, pathsClip, op) {
        let options = {
            subjectFillType: clipperLib.PolyFillType.pftNonZero,
            clipFillType: clipperLib.PolyFillType.pftNonZero,
            clipType: clipperLib.ClipType.ctUnion
        };
        return pathHelper.executeClipper(pathsSubj, pathsClip, options);
    },

    /**
     * Compute the xor of two arrays of path
     *
     */
    getDiffOfPaths: function(pathsSubj, pathsClip, op) {
        let options = {
            subjectFillType: clipperLib.PolyFillType.pftNonZero,
            clipFillType: clipperLib.PolyFillType.pftNonZero,
            clipType: clipperLib.ClipType.ctDifference
        };
        return pathHelper.executeClipper(pathsSubj, pathsClip, options);
    },

    /**
     * Compute the xor of two arrays of path
     *
     */
    getInterOfPaths: function(pathsSubj, pathsClip, op) {
        let options = {
            subjectFillType: clipperLib.PolyFillType.pftNonZero,
            clipFillType: clipperLib.PolyFillType.pftNonZero,
            clipType: clipperLib.ClipType.ctIntersection
        };
        return pathHelper.executeClipper(pathsSubj, pathsClip, options);
    },

    /**
     * Simplify an array of paths
     *
     */
    simplifyPaths: function(paths, options = {
        fillType: clipperLib.PolyFillType.pftNonZero
    }) {
        return clipperLib.Clipper.SimplifyPolygons(paths, options.fillType);
    },

    /**
     * Apply Clipper operation to pathsSubj and pathClip
     * clipType: {ctIntersection,ctUnion,ctDifference,ctXor}
     * subjectFill: {pftEvenOdd,pftNonZero,pftPositive,pftNegative}
     * clipFill: same as upon
     */
    executeClipper: function(pathsSubj, pathsClip, options = {
        clipType: clipperLib.ClipType
            .ctUnion,
        subjectFill: clipperLib.PolyFillType.pftNonZero,
        clipFill: clipperLib
            .PolyFillType.pftNonZero
    }) {
        if (!pathsSubj && !pathsClip) {
            return;
        }
        //turn paths so they are negatives:
        pathHelper.setDirectionPaths(pathsSubj, -1);
        if (pathsClip) {
            pathHelper.setDirectionPaths(pathsClip, -1);
        }
        //settup and execute clipper
        let cpr = new clipperLib.Clipper();
        cpr.AddPaths(pathsSubj, clipperLib.PolyType.ptSubject, true);
        if (pathsClip) {
            cpr.AddPaths(pathsClip, clipperLib.PolyType.ptClip, true);
        }
        let res = new clipperLib.Paths();
        cpr.Execute(options.clipType, res, options.subjectFill, options.clipFill);
        return res;
    },

    /**
     *  sets the direction of an array of path
     */
    setDirectionPaths: function(paths, direction) {
        for (let i in paths) {
            pathHelper.setDirectionPath(paths[i], direction);
        }
    },

    /**
     *  sets the direction of a path
     */
    setDirectionPath: function(path, direction) {
        if (clipperLib.JS.AreaOfPolygon(path) * direction < 0) {
            path.reverse();
        }
    },

    /**
     *  checks if the signed area of the path is positive
     */
    isPositivePath: function(path) {
        return pathHelper.getDirectionPath(path) > 0;
    },

    /**
     *  checks if the signed area of the path is negative
     */
    isNegativePath: function(path) {
        return pathHelper.getDirectionPath(path) < 0;
    },

    /**
     *  get the direction of an arary of path
     */
    getDirectionPaths: function(paths) {
        return paths.map(pathHelper.getDirectionPath);
    },

    /**
     *  get the direction of a path
     */
    getDirectionPath: function(path) {
        return (clipperLib.JS.AreaOfPolygon(path) > 0) ? 1 : -1;
    },

    scaleUpPath: function(path) {
        clipperLib.JS.ScaleUpPath(path, 10000);
    },

    scaleDownPath(path) {
        clipperLib.JS.ScaleDownPath(path, 10000);
    },
    scaleDownPaths(paths) {
        clipperLib.JS.ScaleDownPaths(paths, 10000);
    },


    addColinearPointsPaths: function(paths, toAdd){

        for(let i in paths){
            for(let j in toAdd){
                paths[i]= pathHelper.addColinearPointsPath(paths[i], toAdd[j]);
            }
        }

    },

    addColinearPointsPath: function(path,toAdd ){

        let resPath=[];
        let addedIndexes=[];
        for(let i =0;i< path.length; i++){
            let pt1= path[i];
            let pt2= path[(i+1)%path.length];

            resPath.push(pt1)
            for(let j =0;j<= toAdd.length; j++){
                let idx1= j%toAdd.length;
                let idx2= (j+1)%toAdd.length;
                let add1= toAdd[idx1];
                let add2= toAdd[idx2];
                if(!pathHelper.isAligned(pt1, pt2, add1, add2)){continue;}

                if(!pathHelper.isEqual(pt1, add2)&& !pathHelper.isEqual(pt2, add2)&&
                   !addedIndexes.includes(idx2)  && pathHelper.inOnSegment(pt1,pt2,add2) ){
                    resPath.push(add2);
                    addedIndexes.push(idx2);
                }

                if(!pathHelper.isEqual(pt1, add1)&& !pathHelper.isEqual(pt2, add1)&&
                   !addedIndexes.includes(idx1)  && pathHelper.inOnSegment(pt1,pt2,add1)){
                    resPath.push(add1);
                    addedIndexes.push(idx1);
                }

            }
        }
        return resPath;
    },

    getMatchingEdgeIndex: function(path, pathToMatch,offset= 0) {
        let prevAligned = false;
        let res = {};
        for (let i = path.length - 1-offset; i >= 0; i--) {
            for (let j = pathToMatch.length - 1; j >= 0; j--) {

                let p1 = pathToMatch[j];
                let p2 = pathToMatch[(j + 1) % pathToMatch.length];
                let currAlgigned = pathHelper.isAligned(path[i], path[(i + 1) % path.length], p1, p2);
                if (!currAlgigned && prevAligned) {
                    return res;
                }
                if (currAlgigned) {
                    res = {
                        index: i,
                        pointmatch: p1
                    };
                    prevAligned = currAlgigned;
                    break;
                }

            }
        }

    },

    isAligned: function(e11, e12, e21, e22) {
        let edge1 = pathHelper.getEdge(e11, e12);
        let edge2 = pathHelper.getEdge(e11, e21);
        let edge3 = pathHelper.getEdge(e11, e22);
        return pathHelper.isColinear(edge1, edge2) && pathHelper.isColinear(edge1, edge3);
    },

    isColinear: function(edge1, edge2) {
        return edge1.X * edge2.Y === edge1.Y * edge2.X;
    },

    getEdge: function(point1, point2) {
        return {
            X: (point2.X - point1.X),
            Y: (point2.Y - point1.Y)
        };
    },

    /**
     * returns the index of the point in path matching with point
     *
     */
    getPointMatch: function(path, point) {
        for (let i = 0; i < path.length; i++) {
            if(pathHelper.isEqual(path[i], point)) {
                return {
                    index: i
                };
            }
        }
    },

    getNorm: function(point) {
        return Math.sqrt(point.X * point.X + point.Y * point.Y);
    },
    getDistance: function(point1, point2) {
        let edge = pathHelper.getEdge(point1, point2);
        return pathHelper.getNorm(edge);
    },

    getTotalLength: function(path) {
        let res = 0;
        if (!path) {
            return 0;
        }
        for (let i = 0; i < path.length; i++) {
            let curr = path[i];
            let next = path[(i + 1) % path.length];
            res += pathHelper.getDistance(curr, next);
        }
        return res;
    },

    /**
     *  checks if two points have the same coordinates
     *
     */
    isEqual: function(point1, point2) {
        return (point1.X === point2.X) && (point1.Y === point2.Y);
    },

    inOnSegment:function( ptOrigin, ptDest, pt){
            return pathHelper.isInRange(ptOrigin, ptDest, pt)||
                   pathHelper.isInRange(ptDest, ptOrigin, pt);
    },

    isInRange: function( ptOrigin, ptDest,pt ){
        return pt.X>=ptOrigin.X && pt.X<= ptDest.X &&
               pt.Y>=ptOrigin.Y && pt.Y<= ptDest.Y;
    },

};
module.exports = pathHelper;

},{"clipper-lib":16}],9:[function(require,module,exports){
"use strict";

const pathHelper = require("./path-helper.js");


var uvHelper = {

    /*************************************
        First paradygm: map on vertival and horizontal independantly.
        Don't care about discontinuities between vertical and horizontal.
    ***************************************/

    mapHorrizontal: function(pathsByDepth,outerShape, horizontalGeom,options) {
        if(!horizontalGeom){return;}
        let points = horizontalGeom.points;
        let boundaries= uvHelper.getBoundaries(pathsByDepth,outerShape,options);

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
            let v= uvHelper.interpolate(boundaries.boundary.Z, boundaries.boundaryTex.V,pathsAtDepth.depth);
            pathsAtDepth.V= v;
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
            offset.u= match.pointmatch.U;
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
        let U = uvHelper.interpolate(boundaries.boundary.XY, boundaries.boundaryTex.U, point[0]);
        let V = uvHelper.interpolate(boundaries.boundary.Z, boundaries.boundaryTex.V, point[1]);

        return [U, V];

    },

    interpolatePathU:function(path, boundaries,offset )
    {
        let dist=0;
        let startIndex= offset.index;
        for (let i = startIndex; i < path.length+startIndex; i++) {
            let valueU= (dist+offset.distance);
            let u= uvHelper.interpolate(boundaries.boundary.XY, boundaries.boundaryTex.U,valueU);
            path[i%path.length].U=u;
            dist = dist + pathHelper.getDistance(path[i%path.length], path[(i + 1) % path.length]);
        }
        let valueU= (dist+offset.distance);
        let u= uvHelper.interpolate(boundaries.boundary.XY, boundaries.boundaryTex.U,valueU);
        path[startIndex].U2=u;
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
            boundary.XY.max= options.lengthU;
        }
        if(options.lengthV)
        {
            boundary.Z.max= options.lengthV;
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

},{"./path-helper.js":8}],10:[function(require,module,exports){
"use strict"

function compileSearch(funcName, predicate, reversed, extraArgs, earlyOut) {
  var code = [
    "function ", funcName, "(a,l,h,", extraArgs.join(","),  "){",
earlyOut ? "" : "var i=", (reversed ? "l-1" : "h+1"),
";while(l<=h){\
var m=(l+h)>>>1,x=a[m]"]
  if(earlyOut) {
    if(predicate.indexOf("c") < 0) {
      code.push(";if(x===y){return m}else if(x<=y){")
    } else {
      code.push(";var p=c(x,y);if(p===0){return m}else if(p<=0){")
    }
  } else {
    code.push(";if(", predicate, "){i=m;")
  }
  if(reversed) {
    code.push("l=m+1}else{h=m-1}")
  } else {
    code.push("h=m-1}else{l=m+1}")
  }
  code.push("}")
  if(earlyOut) {
    code.push("return -1};")
  } else {
    code.push("return i};")
  }
  return code.join("")
}

function compileBoundsSearch(predicate, reversed, suffix, earlyOut) {
  var result = new Function([
  compileSearch("A", "x" + predicate + "y", reversed, ["y"], earlyOut),
  compileSearch("P", "c(x,y)" + predicate + "0", reversed, ["y", "c"], earlyOut),
"function dispatchBsearch", suffix, "(a,y,c,l,h){\
if(typeof(c)==='function'){\
return P(a,(l===void 0)?0:l|0,(h===void 0)?a.length-1:h|0,y,c)\
}else{\
return A(a,(c===void 0)?0:c|0,(l===void 0)?a.length-1:l|0,y)\
}}\
return dispatchBsearch", suffix].join(""))
  return result()
}

module.exports = {
  ge: compileBoundsSearch(">=", false, "GE"),
  gt: compileBoundsSearch(">", false, "GT"),
  lt: compileBoundsSearch("<", true, "LT"),
  le: compileBoundsSearch("<=", true, "LE"),
  eq: compileBoundsSearch("-", true, "EQ", true)
}

},{}],11:[function(require,module,exports){
'use strict'

var monotoneTriangulate = require('./lib/monotone')
var makeIndex = require('./lib/triangulation')
var delaunayFlip = require('./lib/delaunay')
var filterTriangulation = require('./lib/filter')

module.exports = cdt2d

function canonicalizeEdge(e) {
  return [Math.min(e[0], e[1]), Math.max(e[0], e[1])]
}

function compareEdge(a, b) {
  return a[0]-b[0] || a[1]-b[1]
}

function canonicalizeEdges(edges) {
  return edges.map(canonicalizeEdge).sort(compareEdge)
}

function getDefault(options, property, dflt) {
  if(property in options) {
    return options[property]
  }
  return dflt
}

function cdt2d(points, edges, options) {

  if(!Array.isArray(edges)) {
    options = edges || {}
    edges = []
  } else {
    options = options || {}
    edges = edges || []
  }

  //Parse out options
  var delaunay = !!getDefault(options, 'delaunay', true)
  var interior = !!getDefault(options, 'interior', true)
  var exterior = !!getDefault(options, 'exterior', true)
  var infinity = !!getDefault(options, 'infinity', false)

  //Handle trivial case
  if((!interior && !exterior) || points.length === 0) {
    return []
  }

  //Construct initial triangulation
  var cells = monotoneTriangulate(points, edges)

  //If delaunay refinement needed, then improve quality by edge flipping
  if(delaunay || interior !== exterior || infinity) {

    //Index all of the cells to support fast neighborhood queries
    var triangulation = makeIndex(points.length, canonicalizeEdges(edges))
    for(var i=0; i<cells.length; ++i) {
      var f = cells[i]
      triangulation.addTriangle(f[0], f[1], f[2])
    }

    //Run edge flipping
    if(delaunay) {
      delaunayFlip(points, triangulation)
    }

    //Filter points
    if(!exterior) {
      return filterTriangulation(triangulation, -1)
    } else if(!interior) {
      return filterTriangulation(triangulation,  1, infinity)
    } else if(infinity) {
      return filterTriangulation(triangulation, 0, infinity)
    } else {
      return triangulation.cells()
    }
    
  } else {
    return cells
  }
}

},{"./lib/delaunay":12,"./lib/filter":13,"./lib/monotone":14,"./lib/triangulation":15}],12:[function(require,module,exports){
'use strict'

var inCircle = require('robust-in-sphere')[4]
var bsearch = require('binary-search-bounds')

module.exports = delaunayRefine

function testFlip(points, triangulation, stack, a, b, x) {
  var y = triangulation.opposite(a, b)

  //Test boundary edge
  if(y < 0) {
    return
  }

  //Swap edge if order flipped
  if(b < a) {
    var tmp = a
    a = b
    b = tmp
    tmp = x
    x = y
    y = tmp
  }

  //Test if edge is constrained
  if(triangulation.isConstraint(a, b)) {
    return
  }

  //Test if edge is delaunay
  if(inCircle(points[a], points[b], points[x], points[y]) < 0) {
    stack.push(a, b)
  }
}

//Assume edges are sorted lexicographically
function delaunayRefine(points, triangulation) {
  var stack = []

  var numPoints = points.length
  var stars = triangulation.stars
  for(var a=0; a<numPoints; ++a) {
    var star = stars[a]
    for(var j=1; j<star.length; j+=2) {
      var b = star[j]

      //If order is not consistent, then skip edge
      if(b < a) {
        continue
      }

      //Check if edge is constrained
      if(triangulation.isConstraint(a, b)) {
        continue
      }

      //Find opposite edge
      var x = star[j-1], y = -1
      for(var k=1; k<star.length; k+=2) {
        if(star[k-1] === b) {
          y = star[k]
          break
        }
      }

      //If this is a boundary edge, don't flip it
      if(y < 0) {
        continue
      }

      //If edge is in circle, flip it
      if(inCircle(points[a], points[b], points[x], points[y]) < 0) {
        stack.push(a, b)
      }
    }
  }

  while(stack.length > 0) {
    var b = stack.pop()
    var a = stack.pop()

    //Find opposite pairs
    var x = -1, y = -1
    var star = stars[a]
    for(var i=1; i<star.length; i+=2) {
      var s = star[i-1]
      var t = star[i]
      if(s === b) {
        y = t
      } else if(t === b) {
        x = s
      }
    }

    //If x/y are both valid then skip edge
    if(x < 0 || y < 0) {
      continue
    }

    //If edge is now delaunay, then don't flip it
    if(inCircle(points[a], points[b], points[x], points[y]) >= 0) {
      continue
    }

    //Flip the edge
    triangulation.flip(a, b)

    //Test flipping neighboring edges
    testFlip(points, triangulation, stack, x, a, y)
    testFlip(points, triangulation, stack, a, y, x)
    testFlip(points, triangulation, stack, y, b, x)
    testFlip(points, triangulation, stack, b, x, y)
  }
}

},{"binary-search-bounds":10,"robust-in-sphere":17}],13:[function(require,module,exports){
'use strict'

var bsearch = require('binary-search-bounds')

module.exports = classifyFaces

function FaceIndex(cells, neighbor, constraint, flags, active, next, boundary) {
  this.cells       = cells
  this.neighbor    = neighbor
  this.flags       = flags
  this.constraint  = constraint
  this.active      = active
  this.next        = next
  this.boundary    = boundary
}

var proto = FaceIndex.prototype

function compareCell(a, b) {
  return a[0] - b[0] ||
         a[1] - b[1] ||
         a[2] - b[2]
}

proto.locate = (function() {
  var key = [0,0,0]
  return function(a, b, c) {
    var x = a, y = b, z = c
    if(b < c) {
      if(b < a) {
        x = b
        y = c
        z = a
      }
    } else if(c < a) {
      x = c
      y = a
      z = b
    }
    if(x < 0) {
      return -1
    }
    key[0] = x
    key[1] = y
    key[2] = z
    return bsearch.eq(this.cells, key, compareCell)
  }
})()

function indexCells(triangulation, infinity) {
  //First get cells and canonicalize
  var cells = triangulation.cells()
  var nc = cells.length
  for(var i=0; i<nc; ++i) {
    var c = cells[i]
    var x = c[0], y = c[1], z = c[2]
    if(y < z) {
      if(y < x) {
        c[0] = y
        c[1] = z
        c[2] = x
      }
    } else if(z < x) {
      c[0] = z
      c[1] = x
      c[2] = y
    }
  }
  cells.sort(compareCell)

  //Initialize flag array
  var flags = new Array(nc)
  for(var i=0; i<flags.length; ++i) {
    flags[i] = 0
  }

  //Build neighbor index, initialize queues
  var active = []
  var next   = []
  var neighbor = new Array(3*nc)
  var constraint = new Array(3*nc)
  var boundary = null
  if(infinity) {
    boundary = []
  }
  var index = new FaceIndex(
    cells,
    neighbor,
    constraint,
    flags,
    active,
    next,
    boundary)
  for(var i=0; i<nc; ++i) {
    var c = cells[i]
    for(var j=0; j<3; ++j) {
      var x = c[j], y = c[(j+1)%3]
      var a = neighbor[3*i+j] = index.locate(y, x, triangulation.opposite(y, x))
      var b = constraint[3*i+j] = triangulation.isConstraint(x, y)
      if(a < 0) {
        if(b) {
          next.push(i)
        } else {
          active.push(i)
          flags[i] = 1
        }
        if(infinity) {
          boundary.push([y, x, -1])
        }
      }
    }
  }
  return index
}

function filterCells(cells, flags, target) {
  var ptr = 0
  for(var i=0; i<cells.length; ++i) {
    if(flags[i] === target) {
      cells[ptr++] = cells[i]
    }
  }
  cells.length = ptr
  return cells
}

function classifyFaces(triangulation, target, infinity) {
  var index = indexCells(triangulation, infinity)

  if(target === 0) {
    if(infinity) {
      return index.cells.concat(index.boundary)
    } else {
      return index.cells
    }
  }

  var side = 1
  var active = index.active
  var next = index.next
  var flags = index.flags
  var cells = index.cells
  var constraint = index.constraint
  var neighbor = index.neighbor

  while(active.length > 0 || next.length > 0) {
    while(active.length > 0) {
      var t = active.pop()
      if(flags[t] === -side) {
        continue
      }
      flags[t] = side
      var c = cells[t]
      for(var j=0; j<3; ++j) {
        var f = neighbor[3*t+j]
        if(f >= 0 && flags[f] === 0) {
          if(constraint[3*t+j]) {
            next.push(f)
          } else {
            active.push(f)
            flags[f] = side
          }
        }
      }
    }

    //Swap arrays and loop
    var tmp = next
    next = active
    active = tmp
    next.length = 0
    side = -side
  }

  var result = filterCells(cells, flags, target)
  if(infinity) {
    return result.concat(index.boundary)
  }
  return result
}

},{"binary-search-bounds":10}],14:[function(require,module,exports){
'use strict'

var bsearch = require('binary-search-bounds')
var orient = require('robust-orientation')[3]

var EVENT_POINT = 0
var EVENT_END   = 1
var EVENT_START = 2

module.exports = monotoneTriangulate

//A partial convex hull fragment, made of two unimonotone polygons
function PartialHull(a, b, idx, lowerIds, upperIds) {
  this.a = a
  this.b = b
  this.idx = idx
  this.lowerIds = lowerIds
  this.upperIds = upperIds
}

//An event in the sweep line procedure
function Event(a, b, type, idx) {
  this.a    = a
  this.b    = b
  this.type = type
  this.idx  = idx
}

//This is used to compare events for the sweep line procedure
// Points are:
//  1. sorted lexicographically
//  2. sorted by type  (point < end < start)
//  3. segments sorted by winding order
//  4. sorted by index
function compareEvent(a, b) {
  var d =
    (a.a[0] - b.a[0]) ||
    (a.a[1] - b.a[1]) ||
    (a.type - b.type)
  if(d) { return d }
  if(a.type !== EVENT_POINT) {
    d = orient(a.a, a.b, b.b)
    if(d) { return d }
  }
  return a.idx - b.idx
}

function testPoint(hull, p) {
  return orient(hull.a, hull.b, p)
}

function addPoint(cells, hulls, points, p, idx) {
  var lo = bsearch.lt(hulls, p, testPoint)
  var hi = bsearch.gt(hulls, p, testPoint)
  for(var i=lo; i<hi; ++i) {
    var hull = hulls[i]

    //Insert p into lower hull
    var lowerIds = hull.lowerIds
    var m = lowerIds.length
    while(m > 1 && orient(
        points[lowerIds[m-2]],
        points[lowerIds[m-1]],
        p) > 0) {
      cells.push(
        [lowerIds[m-1],
         lowerIds[m-2],
         idx])
      m -= 1
    }
    lowerIds.length = m
    lowerIds.push(idx)

    //Insert p into upper hull
    var upperIds = hull.upperIds
    var m = upperIds.length
    while(m > 1 && orient(
        points[upperIds[m-2]],
        points[upperIds[m-1]],
        p) < 0) {
      cells.push(
        [upperIds[m-2],
         upperIds[m-1],
         idx])
      m -= 1
    }
    upperIds.length = m
    upperIds.push(idx)
  }
}

function findSplit(hull, edge) {
  var d
  if(hull.a[0] < edge.a[0]) {
    d = orient(hull.a, hull.b, edge.a)
  } else {
    d = orient(edge.b, edge.a, hull.a)
  }
  if(d) { return d }
  if(edge.b[0] < hull.b[0]) {
    d = orient(hull.a, hull.b, edge.b)
  } else {
    d = orient(edge.b, edge.a, hull.b)
  }
  return d || hull.idx - edge.idx
}

function splitHulls(hulls, points, event) {
  var splitIdx = bsearch.le(hulls, event, findSplit)
  var hull = hulls[splitIdx]
  var upperIds = hull.upperIds
  var x = upperIds[upperIds.length-1]
  hull.upperIds = [x]
  hulls.splice(splitIdx+1, 0,
    new PartialHull(event.a, event.b, event.idx, [x], upperIds))
}


function mergeHulls(hulls, points, event) {
  //Swap pointers for merge search
  var tmp = event.a
  event.a = event.b
  event.b = tmp
  var mergeIdx = bsearch.eq(hulls, event, findSplit)
  var upper = hulls[mergeIdx]
  var lower = hulls[mergeIdx-1]
  lower.upperIds = upper.upperIds
  hulls.splice(mergeIdx, 1)
}


function monotoneTriangulate(points, edges) {

  var numPoints = points.length
  var numEdges = edges.length

  var events = []

  //Create point events
  for(var i=0; i<numPoints; ++i) {
    events.push(new Event(
      points[i],
      null,
      EVENT_POINT,
      i))
  }

  //Create edge events
  for(var i=0; i<numEdges; ++i) {
    var e = edges[i]
    var a = points[e[0]]
    var b = points[e[1]]
    if(a[0] < b[0]) {
      events.push(
        new Event(a, b, EVENT_START, i),
        new Event(b, a, EVENT_END, i))
    } else if(a[0] > b[0]) {
      events.push(
        new Event(b, a, EVENT_START, i),
        new Event(a, b, EVENT_END, i))
    }
  }

  //Sort events
  events.sort(compareEvent)

  //Initialize hull
  var minX = events[0].a[0] - (1 + Math.abs(events[0].a[0])) * Math.pow(2, -52)
  var hull = [ new PartialHull([minX, 1], [minX, 0], -1, [], [], [], []) ]

  //Process events in order
  var cells = []
  for(var i=0, numEvents=events.length; i<numEvents; ++i) {
    var event = events[i]
    var type = event.type
    if(type === EVENT_POINT) {
      addPoint(cells, hull, points, event.a, event.idx)
    } else if(type === EVENT_START) {
      splitHulls(hull, points, event)
    } else {
      mergeHulls(hull, points, event)
    }
  }

  //Return triangulation
  return cells
}

},{"binary-search-bounds":10,"robust-orientation":18}],15:[function(require,module,exports){
'use strict'

var bsearch = require('binary-search-bounds')

module.exports = createTriangulation

function Triangulation(stars, edges) {
  this.stars = stars
  this.edges = edges
}

var proto = Triangulation.prototype

function removePair(list, j, k) {
  for(var i=1, n=list.length; i<n; i+=2) {
    if(list[i-1] === j && list[i] === k) {
      list[i-1] = list[n-2]
      list[i] = list[n-1]
      list.length = n - 2
      return
    }
  }
}

proto.isConstraint = (function() {
  var e = [0,0]
  function compareLex(a, b) {
    return a[0] - b[0] || a[1] - b[1]
  }
  return function(i, j) {
    e[0] = Math.min(i,j)
    e[1] = Math.max(i,j)
    return bsearch.eq(this.edges, e, compareLex) >= 0
  }
})()

proto.removeTriangle = function(i, j, k) {
  var stars = this.stars
  removePair(stars[i], j, k)
  removePair(stars[j], k, i)
  removePair(stars[k], i, j)
}

proto.addTriangle = function(i, j, k) {
  var stars = this.stars
  stars[i].push(j, k)
  stars[j].push(k, i)
  stars[k].push(i, j)
}

proto.opposite = function(j, i) {
  var list = this.stars[i]
  for(var k=1, n=list.length; k<n; k+=2) {
    if(list[k] === j) {
      return list[k-1]
    }
  }
  return -1
}

proto.flip = function(i, j) {
  var a = this.opposite(i, j)
  var b = this.opposite(j, i)
  this.removeTriangle(i, j, a)
  this.removeTriangle(j, i, b)
  this.addTriangle(i, b, a)
  this.addTriangle(j, a, b)
}

proto.edges = function() {
  var stars = this.stars
  var result = []
  for(var i=0, n=stars.length; i<n; ++i) {
    var list = stars[i]
    for(var j=0, m=list.length; j<m; j+=2) {
      result.push([list[j], list[j+1]])
    }
  }
  return result
}

proto.cells = function() {
  var stars = this.stars
  var result = []
  for(var i=0, n=stars.length; i<n; ++i) {
    var list = stars[i]
    for(var j=0, m=list.length; j<m; j+=2) {
      var s = list[j]
      var t = list[j+1]
      if(i < Math.min(s, t)) {
        result.push([i, s, t])
      }
    }
  }
  return result
}

function createTriangulation(numVerts, edges) {
  var stars = new Array(numVerts)
  for(var i=0; i<numVerts; ++i) {
    stars[i] = []
  }
  return new Triangulation(stars, edges)
}

},{"binary-search-bounds":10}],16:[function(require,module,exports){
// rev 482
/********************************************************************************
 *                                                                              *
 * Author    :  Angus Johnson                                                   *
 * Version   :  6.2.1                                                          *
 * Date      :  31 October 2014                                                 *
 * Website   :  http://www.angusj.com                                           *
 * Copyright :  Angus Johnson 2010-2014                                         *
 *                                                                              *
 * License:                                                                     *
 * Use, modification & distribution is subject to Boost Software License Ver 1. *
 * http://www.boost.org/LICENSE_1_0.txt                                         *
 *                                                                              *
 * Attributions:                                                                *
 * The code in this library is an extension of Bala Vatti's clipping algorithm: *
 * "A generic solution to polygon clipping"                                     *
 * Communications of the ACM, Vol 35, Issue 7 (July 1992) pp 56-63.             *
 * http://portal.acm.org/citation.cfm?id=129906                                 *
 *                                                                              *
 * Computer graphics and geometric modeling: implementation and algorithms      *
 * By Max K. Agoston                                                            *
 * Springer; 1 edition (January 4, 2005)                                        *
 * http://books.google.com/books?q=vatti+clipping+agoston                       *
 *                                                                              *
 * See also:                                                                    *
 * "Polygon Offsetting by Computing Winding Numbers"                            *
 * Paper no. DETC2005-85513 pp. 565-575                                         *
 * ASME 2005 International Design Engineering Technical Conferences             *
 * and Computers and Information in Engineering Conference (IDETC/CIE2005)      *
 * September 24-28, 2005 , Long Beach, California, USA                          *
 * http://www.me.berkeley.edu/~mcmains/pubs/DAC05OffsetPolygon.pdf              *
 *                                                                              *
 *******************************************************************************/
/*******************************************************************************
 *                                                                              *
 * Author    :  Timo                                                            *
 * Version   :  6.2.1.0                                                         *
 * Date      :  17 June 2016                                                 *
 *                                                                              *
 * This is a translation of the C# Clipper library to Javascript.               *
 * Int128 struct of C# is implemented using JSBN of Tom Wu.                     *
 * Because Javascript lacks support for 64-bit integers, the space              *
 * is a little more restricted than in C# version.                              *
 *                                                                              *
 * C# version has support for coordinate space:                                 *
 * +-4611686018427387903 ( sqrt(2^127 -1)/2 )                                   *
 * while Javascript version has support for space:                              *
 * +-4503599627370495 ( sqrt(2^106 -1)/2 )                                      *
 *                                                                              *
 * Tom Wu's JSBN proved to be the fastest big integer library:                  *
 * http://jsperf.com/big-integer-library-test                                   *
 *                                                                              *
 * This class can be made simpler when (if ever) 64-bit integer support comes.  *
 *                                                                              *
 *******************************************************************************/
/*******************************************************************************
 *                                                                              *
 * Basic JavaScript BN library - subset useful for RSA encryption.              *
 * http://www-cs-students.stanford.edu/~tjw/jsbn/                               *
 * Copyright (c) 2005  Tom Wu                                                   *
 * All Rights Reserved.                                                         *
 * See "LICENSE" for details:                                                   *
 * http://www-cs-students.stanford.edu/~tjw/jsbn/LICENSE                        *
 *                                                                              *
 *******************************************************************************/
(function ()
{
  "use strict";
  //use_int32: When enabled 32bit ints are used instead of 64bit ints. This
  //improve performance but coordinate values are limited to the range +/- 46340
  var use_int32 = false;
  //use_xyz: adds a Z member to IntPoint. Adds a minor cost to performance.
  var use_xyz = false;
  //UseLines: Enables open path clipping. Adds a very minor cost to performance.
  var use_lines = true;

  var ClipperLib = {};
  var isNode = false;
  if (typeof module !== 'undefined' && module.exports)
  {
    module.exports = ClipperLib;
    isNode = true;
  }
  else
  {
    if (typeof define === 'function' && define.amd) {
      define(ClipperLib);
    }
    if (typeof (document) !== "undefined") window.ClipperLib = ClipperLib;
    else self['ClipperLib'] = ClipperLib;
  }
  var navigator_appName;
  if (!isNode)
  {
    var nav = navigator.userAgent.toString().toLowerCase();
    navigator_appName = navigator.appName;
  }
  else
  {
    var nav = "chrome"; // Node.js uses Chrome's V8 engine
    navigator_appName = "Netscape"; // Firefox, Chrome and Safari returns "Netscape", so Node.js should also
  }
  // Browser test to speedup performance critical functions
  var browser = {};
  if (nav.indexOf("chrome") != -1 && nav.indexOf("chromium") == -1) browser.chrome = 1;
  else browser.chrome = 0;
  if (nav.indexOf("chromium") != -1) browser.chromium = 1;
  else browser.chromium = 0;
  if (nav.indexOf("safari") != -1 && nav.indexOf("chrome") == -1 && nav.indexOf("chromium") == -1) browser.safari = 1;
  else browser.safari = 0;
  if (nav.indexOf("firefox") != -1) browser.firefox = 1;
  else browser.firefox = 0;
  if (nav.indexOf("firefox/17") != -1) browser.firefox17 = 1;
  else browser.firefox17 = 0;
  if (nav.indexOf("firefox/15") != -1) browser.firefox15 = 1;
  else browser.firefox15 = 0;
  if (nav.indexOf("firefox/3") != -1) browser.firefox3 = 1;
  else browser.firefox3 = 0;
  if (nav.indexOf("opera") != -1) browser.opera = 1;
  else browser.opera = 0;
  if (nav.indexOf("msie 10") != -1) browser.msie10 = 1;
  else browser.msie10 = 0;
  if (nav.indexOf("msie 9") != -1) browser.msie9 = 1;
  else browser.msie9 = 0;
  if (nav.indexOf("msie 8") != -1) browser.msie8 = 1;
  else browser.msie8 = 0;
  if (nav.indexOf("msie 7") != -1) browser.msie7 = 1;
  else browser.msie7 = 0;
  if (nav.indexOf("msie ") != -1) browser.msie = 1;
  else browser.msie = 0;
  ClipperLib.biginteger_used = null;

  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // See "LICENSE" for details.
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary & 0xffffff) == 0xefcafe);
  // (public) Constructor
  function BigInteger(a, b, c)
  {
    // This test variable can be removed,
    // but at least for performance tests it is useful piece of knowledge
    // This is the only ClipperLib related variable in BigInteger library
    ClipperLib.biginteger_used = 1;
    if (a != null)
      if ("number" == typeof a && "undefined" == typeof (b)) this.fromInt(a); // faster conversion
      else if ("number" == typeof a) this.fromNumber(a, b, c);
    else if (b == null && "string" != typeof a) this.fromString(a, 256);
    else this.fromString(a, b);
  }
  // return new, unset BigInteger
  function nbi()
  {
    return new BigInteger(null,undefined,undefined);
  }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i, x, w, j, c, n)
  {
    while (--n >= 0)
    {
      var v = x * this[i++] + w[j] + c;
      c = Math.floor(v / 0x4000000);
      w[j++] = v & 0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i, x, w, j, c, n)
  {
    var xl = x & 0x7fff,
      xh = x >> 15;
    while (--n >= 0)
    {
      var l = this[i] & 0x7fff;
      var h = this[i++] >> 15;
      var m = xh * l + h * xl;
      l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff);
      c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
      w[j++] = l & 0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i, x, w, j, c, n)
  {
    var xl = x & 0x3fff,
      xh = x >> 14;
    while (--n >= 0)
    {
      var l = this[i] & 0x3fff;
      var h = this[i++] >> 14;
      var m = xh * l + h * xl;
      l = xl * l + ((m & 0x3fff) << 14) + w[j] + c;
      c = (l >> 28) + (m >> 14) + xh * h;
      w[j++] = l & 0xfffffff;
    }
    return c;
  }
  if (j_lm && (navigator_appName == "Microsoft Internet Explorer"))
  {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if (j_lm && (navigator_appName != "Netscape"))
  {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else
  { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1 << dbits) - 1);
  BigInteger.prototype.DV = (1 << dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2, BI_FP);
  BigInteger.prototype.F1 = BI_FP - dbits;
  BigInteger.prototype.F2 = 2 * dbits - BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr, vv;
  rr = "0".charCodeAt(0);
  for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n)
  {
    return BI_RM.charAt(n);
  }

  function intAt(s, i)
  {
    var c = BI_RC[s.charCodeAt(i)];
    return (c == null) ? -1 : c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r)
  {
    for (var i = this.t - 1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x)
  {
    this.t = 1;
    this.s = (x < 0) ? -1 : 0;
    if (x > 0) this[0] = x;
    else if (x < -1) this[0] = x + this.DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i)
  {
    var r = nbi();
    r.fromInt(i);
    return r;
  }
  // (protected) set from string and radix
  function bnpFromString(s, b)
  {
    var k;
    if (b == 16) k = 4;
    else if (b == 8) k = 3;
    else if (b == 256) k = 8; // byte array
    else if (b == 2) k = 1;
    else if (b == 32) k = 5;
    else if (b == 4) k = 2;
    else
    {
      this.fromRadix(s, b);
      return;
    }
    this.t = 0;
    this.s = 0;
    var i = s.length,
      mi = false,
      sh = 0;
    while (--i >= 0)
    {
      var x = (k == 8) ? s[i] & 0xff : intAt(s, i);
      if (x < 0)
      {
        if (s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if (sh == 0)
        this[this.t++] = x;
      else if (sh + k > this.DB)
      {
        this[this.t - 1] |= (x & ((1 << (this.DB - sh)) - 1)) << sh;
        this[this.t++] = (x >> (this.DB - sh));
      }
      else
        this[this.t - 1] |= x << sh;
      sh += k;
      if (sh >= this.DB) sh -= this.DB;
    }
    if (k == 8 && (s[0] & 0x80) != 0)
    {
      this.s = -1;
      if (sh > 0) this[this.t - 1] |= ((1 << (this.DB - sh)) - 1) << sh;
    }
    this.clamp();
    if (mi) BigInteger.ZERO.subTo(this, this);
  }
  // (protected) clamp off excess high words
  function bnpClamp()
  {
    var c = this.s & this.DM;
    while (this.t > 0 && this[this.t - 1] == c)--this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b)
  {
    if (this.s < 0) return "-" + this.negate().toString(b);
    var k;
    if (b == 16) k = 4;
    else if (b == 8) k = 3;
    else if (b == 2) k = 1;
    else if (b == 32) k = 5;
    else if (b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1 << k) - 1,
      d, m = false,
      r = "",
      i = this.t;
    var p = this.DB - (i * this.DB) % k;
    if (i-- > 0)
    {
      if (p < this.DB && (d = this[i] >> p) > 0)
      {
        m = true;
        r = int2char(d);
      }
      while (i >= 0)
      {
        if (p < k)
        {
          d = (this[i] & ((1 << p) - 1)) << (k - p);
          d |= this[--i] >> (p += this.DB - k);
        }
        else
        {
          d = (this[i] >> (p -= k)) & km;
          if (p <= 0)
          {
            p += this.DB;
            --i;
          }
        }
        if (d > 0) m = true;
        if (m) r += int2char(d);
      }
    }
    return m ? r : "0";
  }
  // (public) -this
  function bnNegate()
  {
    var r = nbi();
    BigInteger.ZERO.subTo(this, r);
    return r;
  }
  // (public) |this|
  function bnAbs()
  {
    return (this.s < 0) ? this.negate() : this;
  }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a)
  {
    var r = this.s - a.s;
    if (r != 0) return r;
    var i = this.t;
    r = i - a.t;
    if (r != 0) return (this.s < 0) ? -r : r;
    while (--i >= 0)
      if ((r = this[i] - a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x)
  {
    var r = 1,
      t;
    if ((t = x >>> 16) != 0)
    {
      x = t;
      r += 16;
    }
    if ((t = x >> 8) != 0)
    {
      x = t;
      r += 8;
    }
    if ((t = x >> 4) != 0)
    {
      x = t;
      r += 4;
    }
    if ((t = x >> 2) != 0)
    {
      x = t;
      r += 2;
    }
    if ((t = x >> 1) != 0)
    {
      x = t;
      r += 1;
    }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength()
  {
    if (this.t <= 0) return 0;
    return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ (this.s & this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n, r)
  {
    var i;
    for (i = this.t - 1; i >= 0; --i) r[i + n] = this[i];
    for (i = n - 1; i >= 0; --i) r[i] = 0;
    r.t = this.t + n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n, r)
  {
    for (var i = n; i < this.t; ++i) r[i - n] = this[i];
    r.t = Math.max(this.t - n, 0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n, r)
  {
    var bs = n % this.DB;
    var cbs = this.DB - bs;
    var bm = (1 << cbs) - 1;
    var ds = Math.floor(n / this.DB),
      c = (this.s << bs) & this.DM,
      i;
    for (i = this.t - 1; i >= 0; --i)
    {
      r[i + ds + 1] = (this[i] >> cbs) | c;
      c = (this[i] & bm) << bs;
    }
    for (i = ds - 1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t + ds + 1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n, r)
  {
    r.s = this.s;
    var ds = Math.floor(n / this.DB);
    if (ds >= this.t)
    {
      r.t = 0;
      return;
    }
    var bs = n % this.DB;
    var cbs = this.DB - bs;
    var bm = (1 << bs) - 1;
    r[0] = this[ds] >> bs;
    for (var i = ds + 1; i < this.t; ++i)
    {
      r[i - ds - 1] |= (this[i] & bm) << cbs;
      r[i - ds] = this[i] >> bs;
    }
    if (bs > 0) r[this.t - ds - 1] |= (this.s & bm) << cbs;
    r.t = this.t - ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a, r)
  {
    var i = 0,
      c = 0,
      m = Math.min(a.t, this.t);
    while (i < m)
    {
      c += this[i] - a[i];
      r[i++] = c & this.DM;
      c >>= this.DB;
    }
    if (a.t < this.t)
    {
      c -= a.s;
      while (i < this.t)
      {
        c += this[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else
    {
      c += this.s;
      while (i < a.t)
      {
        c -= a[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c < 0) ? -1 : 0;
    if (c < -1) r[i++] = this.DV + c;
    else if (c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a, r)
  {
    var x = this.abs(),
      y = a.abs();
    var i = x.t;
    r.t = i + y.t;
    while (--i >= 0) r[i] = 0;
    for (i = 0; i < y.t; ++i) r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
    r.s = 0;
    r.clamp();
    if (this.s != a.s) BigInteger.ZERO.subTo(r, r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r)
  {
    var x = this.abs();
    var i = r.t = 2 * x.t;
    while (--i >= 0) r[i] = 0;
    for (i = 0; i < x.t - 1; ++i)
    {
      var c = x.am(i, x[i], r, 2 * i, 0, 1);
      if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV)
      {
        r[i + x.t] -= x.DV;
        r[i + x.t + 1] = 1;
      }
    }
    if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m, q, r)
  {
    var pm = m.abs();
    if (pm.t <= 0) return;
    var pt = this.abs();
    if (pt.t < pm.t)
    {
      if (q != null) q.fromInt(0);
      if (r != null) this.copyTo(r);
      return;
    }
    if (r == null) r = nbi();
    var y = nbi(),
      ts = this.s,
      ms = m.s;
    var nsh = this.DB - nbits(pm[pm.t - 1]); // normalize modulus
    if (nsh > 0)
    {
      pm.lShiftTo(nsh, y);
      pt.lShiftTo(nsh, r);
    }
    else
    {
      pm.copyTo(y);
      pt.copyTo(r);
    }
    var ys = y.t;
    var y0 = y[ys - 1];
    if (y0 == 0) return;
    var yt = y0 * (1 << this.F1) + ((ys > 1) ? y[ys - 2] >> this.F2 : 0);
    var d1 = this.FV / yt,
      d2 = (1 << this.F1) / yt,
      e = 1 << this.F2;
    var i = r.t,
      j = i - ys,
      t = (q == null) ? nbi() : q;
    y.dlShiftTo(j, t);
    if (r.compareTo(t) >= 0)
    {
      r[r.t++] = 1;
      r.subTo(t, r);
    }
    BigInteger.ONE.dlShiftTo(ys, t);
    t.subTo(y, y); // "negative" y so we can replace sub with am later
    while (y.t < ys) y[y.t++] = 0;
    while (--j >= 0)
    {
      // Estimate quotient digit
      var qd = (r[--i] == y0) ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
      if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd)
      { // Try it out
        y.dlShiftTo(j, t);
        r.subTo(t, r);
        while (r[i] < --qd) r.subTo(t, r);
      }
    }
    if (q != null)
    {
      r.drShiftTo(ys, q);
      if (ts != ms) BigInteger.ZERO.subTo(q, q);
    }
    r.t = ys;
    r.clamp();
    if (nsh > 0) r.rShiftTo(nsh, r); // Denormalize remainder
    if (ts < 0) BigInteger.ZERO.subTo(r, r);
  }
  // (public) this mod a
  function bnMod(a)
  {
    var r = nbi();
    this.abs().divRemTo(a, null, r);
    if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r, r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m)
  {
    this.m = m;
  }

  function cConvert(x)
  {
    if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }

  function cRevert(x)
  {
    return x;
  }

  function cReduce(x)
  {
    x.divRemTo(this.m, null, x);
  }

  function cMulTo(x, y, r)
  {
    x.multiplyTo(y, r);
    this.reduce(r);
  }

  function cSqrTo(x, r)
  {
    x.squareTo(r);
    this.reduce(r);
  }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit()
  {
    if (this.t < 1) return 0;
    var x = this[0];
    if ((x & 1) == 0) return 0;
    var y = x & 3; // y == 1/x mod 2^2
    y = (y * (2 - (x & 0xf) * y)) & 0xf; // y == 1/x mod 2^4
    y = (y * (2 - (x & 0xff) * y)) & 0xff; // y == 1/x mod 2^8
    y = (y * (2 - (((x & 0xffff) * y) & 0xffff))) & 0xffff; // y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y * (2 - x * y % this.DV)) % this.DV; // y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y > 0) ? this.DV - y : -y;
  }
  // Montgomery reduction
  function Montgomery(m)
  {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp & 0x7fff;
    this.mph = this.mp >> 15;
    this.um = (1 << (m.DB - 15)) - 1;
    this.mt2 = 2 * m.t;
  }
  // xR mod m
  function montConvert(x)
  {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t, r);
    r.divRemTo(this.m, null, r);
    if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r, r);
    return r;
  }
  // x/R mod m
  function montRevert(x)
  {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x)
  {
    while (x.t <= this.mt2) // pad x so am has enough room later
      x[x.t++] = 0;
    for (var i = 0; i < this.m.t; ++i)
    {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i] & 0x7fff;
      var u0 = (j * this.mpl + (((j * this.mph + (x[i] >> 15) * this.mpl) & this.um) << 15)) & x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i + this.m.t;
      x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
      // propagate carry
      while (x[j] >= x.DV)
      {
        x[j] -= x.DV;
        x[++j]++;
      }
    }
    x.clamp();
    x.drShiftTo(this.m.t, x);
    if (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x, r)
  {
    x.squareTo(r);
    this.reduce(r);
  }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x, y, r)
  {
    x.multiplyTo(y, r);
    this.reduce(r);
  }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven()
  {
    return ((this.t > 0) ? (this[0] & 1) : this.s) == 0;
  }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e, z)
  {
    if (e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(),
      r2 = nbi(),
      g = z.convert(this),
      i = nbits(e) - 1;
    g.copyTo(r);
    while (--i >= 0)
    {
      z.sqrTo(r, r2);
      if ((e & (1 << i)) > 0) z.mulTo(r2, g, r);
      else
      {
        var t = r;
        r = r2;
        r2 = t;
      }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e, m)
  {
    var z;
    if (e < 256 || m.isEven()) z = new Classic(m);
    else z = new Montgomery(m);
    return this.exp(e, z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // Copyright (c) 2005-2009  Tom Wu
  // All Rights Reserved.
  // See "LICENSE" for details.
  // Extended JavaScript BN functions, required for RSA private ops.
  // Version 1.1: new BigInteger("0", 10) returns "proper" zero
  // Version 1.2: square() API, isProbablePrime fix
  // (public)
  function bnClone()
  {
    var r = nbi();
    this.copyTo(r);
    return r;
  }
  // (public) return value as integer
  function bnIntValue()
  {
    if (this.s < 0)
    {
      if (this.t == 1) return this[0] - this.DV;
      else if (this.t == 0) return -1;
    }
    else if (this.t == 1) return this[0];
    else if (this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1] & ((1 << (32 - this.DB)) - 1)) << this.DB) | this[0];
  }
  // (public) return value as byte
  function bnByteValue()
  {
    return (this.t == 0) ? this.s : (this[0] << 24) >> 24;
  }
  // (public) return value as short (assumes DB>=16)
  function bnShortValue()
  {
    return (this.t == 0) ? this.s : (this[0] << 16) >> 16;
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r)
  {
    return Math.floor(Math.LN2 * this.DB / Math.log(r));
  }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum()
  {
    if (this.s < 0) return -1;
    else if (this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) convert to radix string
  function bnpToRadix(b)
  {
    if (b == null) b = 10;
    if (this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b, cs);
    var d = nbv(a),
      y = nbi(),
      z = nbi(),
      r = "";
    this.divRemTo(d, y, z);
    while (y.signum() > 0)
    {
      r = (a + z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d, y, z);
    }
    return z.intValue().toString(b) + r;
  }
  // (protected) convert from radix string
  function bnpFromRadix(s, b)
  {
    this.fromInt(0);
    if (b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b, cs),
      mi = false,
      j = 0,
      w = 0;
    for (var i = 0; i < s.length; ++i)
    {
      var x = intAt(s, i);
      if (x < 0)
      {
        if (s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b * w + x;
      if (++j >= cs)
      {
        this.dMultiply(d);
        this.dAddOffset(w, 0);
        j = 0;
        w = 0;
      }
    }
    if (j > 0)
    {
      this.dMultiply(Math.pow(b, j));
      this.dAddOffset(w, 0);
    }
    if (mi) BigInteger.ZERO.subTo(this, this);
  }
  // (protected) alternate constructor
  function bnpFromNumber(a, b, c)
  {
    if ("number" == typeof b)
    {
      // new BigInteger(int,int,RNG)
      if (a < 2) this.fromInt(1);
      else
      {
        this.fromNumber(a, c);
        if (!this.testBit(a - 1)) // force MSB set
          this.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, this);
        if (this.isEven()) this.dAddOffset(1, 0); // force odd
        while (!this.isProbablePrime(b))
        {
          this.dAddOffset(2, 0);
          if (this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a - 1), this);
        }
      }
    }
    else
    {
      // new BigInteger(int,RNG)
      var x = new Array(),
        t = a & 7;
      x.length = (a >> 3) + 1;
      b.nextBytes(x);
      if (t > 0) x[0] &= ((1 << t) - 1);
      else x[0] = 0;
      this.fromString(x, 256);
    }
  }
  // (public) convert to bigendian byte array
  function bnToByteArray()
  {
    var i = this.t,
      r = new Array();
    r[0] = this.s;
    var p = this.DB - (i * this.DB) % 8,
      d, k = 0;
    if (i-- > 0)
    {
      if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p)
        r[k++] = d | (this.s << (this.DB - p));
      while (i >= 0)
      {
        if (p < 8)
        {
          d = (this[i] & ((1 << p) - 1)) << (8 - p);
          d |= this[--i] >> (p += this.DB - 8);
        }
        else
        {
          d = (this[i] >> (p -= 8)) & 0xff;
          if (p <= 0)
          {
            p += this.DB;
            --i;
          }
        }
        if ((d & 0x80) != 0) d |= -256;
        if (k == 0 && (this.s & 0x80) != (d & 0x80))++k;
        if (k > 0 || d != this.s) r[k++] = d;
      }
    }
    return r;
  }

  function bnEquals(a)
  {
    return (this.compareTo(a) == 0);
  }

  function bnMin(a)
  {
    return (this.compareTo(a) < 0) ? this : a;
  }

  function bnMax(a)
  {
    return (this.compareTo(a) > 0) ? this : a;
  }
  // (protected) r = this op a (bitwise)
  function bnpBitwiseTo(a, op, r)
  {
    var i, f, m = Math.min(a.t, this.t);
    for (i = 0; i < m; ++i) r[i] = op(this[i], a[i]);
    if (a.t < this.t)
    {
      f = a.s & this.DM;
      for (i = m; i < this.t; ++i) r[i] = op(this[i], f);
      r.t = this.t;
    }
    else
    {
      f = this.s & this.DM;
      for (i = m; i < a.t; ++i) r[i] = op(f, a[i]);
      r.t = a.t;
    }
    r.s = op(this.s, a.s);
    r.clamp();
  }
  // (public) this & a
  function op_and(x, y)
  {
    return x & y;
  }

  function bnAnd(a)
  {
    var r = nbi();
    this.bitwiseTo(a, op_and, r);
    return r;
  }
  // (public) this | a
  function op_or(x, y)
  {
    return x | y;
  }

  function bnOr(a)
  {
    var r = nbi();
    this.bitwiseTo(a, op_or, r);
    return r;
  }
  // (public) this ^ a
  function op_xor(x, y)
  {
    return x ^ y;
  }

  function bnXor(a)
  {
    var r = nbi();
    this.bitwiseTo(a, op_xor, r);
    return r;
  }
  // (public) this & ~a
  function op_andnot(x, y)
  {
    return x & ~y;
  }

  function bnAndNot(a)
  {
    var r = nbi();
    this.bitwiseTo(a, op_andnot, r);
    return r;
  }
  // (public) ~this
  function bnNot()
  {
    var r = nbi();
    for (var i = 0; i < this.t; ++i) r[i] = this.DM & ~this[i];
    r.t = this.t;
    r.s = ~this.s;
    return r;
  }
  // (public) this << n
  function bnShiftLeft(n)
  {
    var r = nbi();
    if (n < 0) this.rShiftTo(-n, r);
    else this.lShiftTo(n, r);
    return r;
  }
  // (public) this >> n
  function bnShiftRight(n)
  {
    var r = nbi();
    if (n < 0) this.lShiftTo(-n, r);
    else this.rShiftTo(n, r);
    return r;
  }
  // return index of lowest 1-bit in x, x < 2^31
  function lbit(x)
  {
    if (x == 0) return -1;
    var r = 0;
    if ((x & 0xffff) == 0)
    {
      x >>= 16;
      r += 16;
    }
    if ((x & 0xff) == 0)
    {
      x >>= 8;
      r += 8;
    }
    if ((x & 0xf) == 0)
    {
      x >>= 4;
      r += 4;
    }
    if ((x & 3) == 0)
    {
      x >>= 2;
      r += 2;
    }
    if ((x & 1) == 0)++r;
    return r;
  }
  // (public) returns index of lowest 1-bit (or -1 if none)
  function bnGetLowestSetBit()
  {
    for (var i = 0; i < this.t; ++i)
      if (this[i] != 0) return i * this.DB + lbit(this[i]);
    if (this.s < 0) return this.t * this.DB;
    return -1;
  }
  // return number of 1 bits in x
  function cbit(x)
  {
    var r = 0;
    while (x != 0)
    {
      x &= x - 1;
      ++r;
    }
    return r;
  }
  // (public) return number of set bits
  function bnBitCount()
  {
    var r = 0,
      x = this.s & this.DM;
    for (var i = 0; i < this.t; ++i) r += cbit(this[i] ^ x);
    return r;
  }
  // (public) true iff nth bit is set
  function bnTestBit(n)
  {
    var j = Math.floor(n / this.DB);
    if (j >= this.t) return (this.s != 0);
    return ((this[j] & (1 << (n % this.DB))) != 0);
  }
  // (protected) this op (1<<n)
  function bnpChangeBit(n, op)
  {
    var r = BigInteger.ONE.shiftLeft(n);
    this.bitwiseTo(r, op, r);
    return r;
  }
  // (public) this | (1<<n)
  function bnSetBit(n)
  {
    return this.changeBit(n, op_or);
  }
  // (public) this & ~(1<<n)
  function bnClearBit(n)
  {
    return this.changeBit(n, op_andnot);
  }
  // (public) this ^ (1<<n)
  function bnFlipBit(n)
  {
    return this.changeBit(n, op_xor);
  }
  // (protected) r = this + a
  function bnpAddTo(a, r)
  {
    var i = 0,
      c = 0,
      m = Math.min(a.t, this.t);
    while (i < m)
    {
      c += this[i] + a[i];
      r[i++] = c & this.DM;
      c >>= this.DB;
    }
    if (a.t < this.t)
    {
      c += a.s;
      while (i < this.t)
      {
        c += this[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else
    {
      c += this.s;
      while (i < a.t)
      {
        c += a[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c < 0) ? -1 : 0;
    if (c > 0) r[i++] = c;
    else if (c < -1) r[i++] = this.DV + c;
    r.t = i;
    r.clamp();
  }
  // (public) this + a
  function bnAdd(a)
  {
    var r = nbi();
    this.addTo(a, r);
    return r;
  }
  // (public) this - a
  function bnSubtract(a)
  {
    var r = nbi();
    this.subTo(a, r);
    return r;
  }
  // (public) this * a
  function bnMultiply(a)
  {
    var r = nbi();
    this.multiplyTo(a, r);
    return r;
  }
  // (public) this^2
  function bnSquare()
  {
    var r = nbi();
    this.squareTo(r);
    return r;
  }
  // (public) this / a
  function bnDivide(a)
  {
    var r = nbi();
    this.divRemTo(a, r, null);
    return r;
  }
  // (public) this % a
  function bnRemainder(a)
  {
    var r = nbi();
    this.divRemTo(a, null, r);
    return r;
  }
  // (public) [this/a,this%a]
  function bnDivideAndRemainder(a)
  {
    var q = nbi(),
      r = nbi();
    this.divRemTo(a, q, r);
    return new Array(q, r);
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n)
  {
    this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n, w)
  {
    if (n == 0) return;
    while (this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while (this[w] >= this.DV)
    {
      this[w] -= this.DV;
      if (++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // A "null" reducer
  function NullExp()
  {}

  function nNop(x)
  {
    return x;
  }

  function nMulTo(x, y, r)
  {
    x.multiplyTo(y, r);
  }

  function nSqrTo(x, r)
  {
    x.squareTo(r);
  }
  NullExp.prototype.convert = nNop;
  NullExp.prototype.revert = nNop;
  NullExp.prototype.mulTo = nMulTo;
  NullExp.prototype.sqrTo = nSqrTo;
  // (public) this^e
  function bnPow(e)
  {
    return this.exp(e, new NullExp());
  }
  // (protected) r = lower n words of "this * a", a.t <= n
  // "this" should be the larger one if appropriate.
  function bnpMultiplyLowerTo(a, n, r)
  {
    var i = Math.min(this.t + a.t, n);
    r.s = 0; // assumes a,this >= 0
    r.t = i;
    while (i > 0) r[--i] = 0;
    var j;
    for (j = r.t - this.t; i < j; ++i) r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
    for (j = Math.min(a.t, n); i < j; ++i) this.am(0, a[i], r, i, 0, n - i);
    r.clamp();
  }
  // (protected) r = "this * a" without lower n words, n > 0
  // "this" should be the larger one if appropriate.
  function bnpMultiplyUpperTo(a, n, r)
  {
    --n;
    var i = r.t = this.t + a.t - n;
    r.s = 0; // assumes a,this >= 0
    while (--i >= 0) r[i] = 0;
    for (i = Math.max(n - this.t, 0); i < a.t; ++i)
      r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
    r.clamp();
    r.drShiftTo(1, r);
  }
  // Barrett modular reduction
  function Barrett(m)
  {
    // setup Barrett
    this.r2 = nbi();
    this.q3 = nbi();
    BigInteger.ONE.dlShiftTo(2 * m.t, this.r2);
    this.mu = this.r2.divide(m);
    this.m = m;
  }

  function barrettConvert(x)
  {
    if (x.s < 0 || x.t > 2 * this.m.t) return x.mod(this.m);
    else if (x.compareTo(this.m) < 0) return x;
    else
    {
      var r = nbi();
      x.copyTo(r);
      this.reduce(r);
      return r;
    }
  }

  function barrettRevert(x)
  {
    return x;
  }
  // x = x mod m (HAC 14.42)
  function barrettReduce(x)
  {
    x.drShiftTo(this.m.t - 1, this.r2);
    if (x.t > this.m.t + 1)
    {
      x.t = this.m.t + 1;
      x.clamp();
    }
    this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
    this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
    while (x.compareTo(this.r2) < 0) x.dAddOffset(1, this.m.t + 1);
    x.subTo(this.r2, x);
    while (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
  }
  // r = x^2 mod m; x != r
  function barrettSqrTo(x, r)
  {
    x.squareTo(r);
    this.reduce(r);
  }
  // r = x*y mod m; x,y != r
  function barrettMulTo(x, y, r)
  {
    x.multiplyTo(y, r);
    this.reduce(r);
  }
  Barrett.prototype.convert = barrettConvert;
  Barrett.prototype.revert = barrettRevert;
  Barrett.prototype.reduce = barrettReduce;
  Barrett.prototype.mulTo = barrettMulTo;
  Barrett.prototype.sqrTo = barrettSqrTo;
  // (public) this^e % m (HAC 14.85)
  function bnModPow(e, m)
  {
    var i = e.bitLength(),
      k, r = nbv(1),
      z;
    if (i <= 0) return r;
    else if (i < 18) k = 1;
    else if (i < 48) k = 3;
    else if (i < 144) k = 4;
    else if (i < 768) k = 5;
    else k = 6;
    if (i < 8)
      z = new Classic(m);
    else if (m.isEven())
      z = new Barrett(m);
    else
      z = new Montgomery(m);
    // precomputation
    var g = new Array(),
      n = 3,
      k1 = k - 1,
      km = (1 << k) - 1;
    g[1] = z.convert(this);
    if (k > 1)
    {
      var g2 = nbi();
      z.sqrTo(g[1], g2);
      while (n <= km)
      {
        g[n] = nbi();
        z.mulTo(g2, g[n - 2], g[n]);
        n += 2;
      }
    }
    var j = e.t - 1,
      w, is1 = true,
      r2 = nbi(),
      t;
    i = nbits(e[j]) - 1;
    while (j >= 0)
    {
      if (i >= k1) w = (e[j] >> (i - k1)) & km;
      else
      {
        w = (e[j] & ((1 << (i + 1)) - 1)) << (k1 - i);
        if (j > 0) w |= e[j - 1] >> (this.DB + i - k1);
      }
      n = k;
      while ((w & 1) == 0)
      {
        w >>= 1;
        --n;
      }
      if ((i -= n) < 0)
      {
        i += this.DB;
        --j;
      }
      if (is1)
      { // ret == 1, don't bother squaring or multiplying it
        g[w].copyTo(r);
        is1 = false;
      }
      else
      {
        while (n > 1)
        {
          z.sqrTo(r, r2);
          z.sqrTo(r2, r);
          n -= 2;
        }
        if (n > 0) z.sqrTo(r, r2);
        else
        {
          t = r;
          r = r2;
          r2 = t;
        }
        z.mulTo(r2, g[w], r);
      }
      while (j >= 0 && (e[j] & (1 << i)) == 0)
      {
        z.sqrTo(r, r2);
        t = r;
        r = r2;
        r2 = t;
        if (--i < 0)
        {
          i = this.DB - 1;
          --j;
        }
      }
    }
    return z.revert(r);
  }
  // (public) gcd(this,a) (HAC 14.54)
  function bnGCD(a)
  {
    var x = (this.s < 0) ? this.negate() : this.clone();
    var y = (a.s < 0) ? a.negate() : a.clone();
    if (x.compareTo(y) < 0)
    {
      var t = x;
      x = y;
      y = t;
    }
    var i = x.getLowestSetBit(),
      g = y.getLowestSetBit();
    if (g < 0) return x;
    if (i < g) g = i;
    if (g > 0)
    {
      x.rShiftTo(g, x);
      y.rShiftTo(g, y);
    }
    while (x.signum() > 0)
    {
      if ((i = x.getLowestSetBit()) > 0) x.rShiftTo(i, x);
      if ((i = y.getLowestSetBit()) > 0) y.rShiftTo(i, y);
      if (x.compareTo(y) >= 0)
      {
        x.subTo(y, x);
        x.rShiftTo(1, x);
      }
      else
      {
        y.subTo(x, y);
        y.rShiftTo(1, y);
      }
    }
    if (g > 0) y.lShiftTo(g, y);
    return y;
  }
  // (protected) this % n, n < 2^26
  function bnpModInt(n)
  {
    if (n <= 0) return 0;
    var d = this.DV % n,
      r = (this.s < 0) ? n - 1 : 0;
    if (this.t > 0)
      if (d == 0) r = this[0] % n;
      else
        for (var i = this.t - 1; i >= 0; --i) r = (d * r + this[i]) % n;
    return r;
  }
  // (public) 1/this % m (HAC 14.61)
  function bnModInverse(m)
  {
    var ac = m.isEven();
    if ((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO;
    var u = m.clone(),
      v = this.clone();
    var a = nbv(1),
      b = nbv(0),
      c = nbv(0),
      d = nbv(1);
    while (u.signum() != 0)
    {
      while (u.isEven())
      {
        u.rShiftTo(1, u);
        if (ac)
        {
          if (!a.isEven() || !b.isEven())
          {
            a.addTo(this, a);
            b.subTo(m, b);
          }
          a.rShiftTo(1, a);
        }
        else if (!b.isEven()) b.subTo(m, b);
        b.rShiftTo(1, b);
      }
      while (v.isEven())
      {
        v.rShiftTo(1, v);
        if (ac)
        {
          if (!c.isEven() || !d.isEven())
          {
            c.addTo(this, c);
            d.subTo(m, d);
          }
          c.rShiftTo(1, c);
        }
        else if (!d.isEven()) d.subTo(m, d);
        d.rShiftTo(1, d);
      }
      if (u.compareTo(v) >= 0)
      {
        u.subTo(v, u);
        if (ac) a.subTo(c, a);
        b.subTo(d, b);
      }
      else
      {
        v.subTo(u, v);
        if (ac) c.subTo(a, c);
        d.subTo(b, d);
      }
    }
    if (v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
    if (d.compareTo(m) >= 0) return d.subtract(m);
    if (d.signum() < 0) d.addTo(m, d);
    else return d;
    if (d.signum() < 0) return d.add(m);
    else return d;
  }
  var lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
  var lplim = (1 << 26) / lowprimes[lowprimes.length - 1];
  // (public) test primality with certainty >= 1-.5^t
  function bnIsProbablePrime(t)
  {
    var i, x = this.abs();
    if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1])
    {
      for (i = 0; i < lowprimes.length; ++i)
        if (x[0] == lowprimes[i]) return true;
      return false;
    }
    if (x.isEven()) return false;
    i = 1;
    while (i < lowprimes.length)
    {
      var m = lowprimes[i],
        j = i + 1;
      while (j < lowprimes.length && m < lplim) m *= lowprimes[j++];
      m = x.modInt(m);
      while (i < j)
        if (m % lowprimes[i++] == 0) return false;
    }
    return x.millerRabin(t);
  }
  // (protected) true if probably prime (HAC 4.24, Miller-Rabin)
  function bnpMillerRabin(t)
  {
    var n1 = this.subtract(BigInteger.ONE);
    var k = n1.getLowestSetBit();
    if (k <= 0) return false;
    var r = n1.shiftRight(k);
    t = (t + 1) >> 1;
    if (t > lowprimes.length) t = lowprimes.length;
    var a = nbi();
    for (var i = 0; i < t; ++i)
    {
      //Pick bases at random, instead of starting at 2
      a.fromInt(lowprimes[Math.floor(Math.random() * lowprimes.length)]);
      var y = a.modPow(r, this);
      if (y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0)
      {
        var j = 1;
        while (j++ < k && y.compareTo(n1) != 0)
        {
          y = y.modPowInt(2, this);
          if (y.compareTo(BigInteger.ONE) == 0) return false;
        }
        if (y.compareTo(n1) != 0) return false;
      }
    }
    return true;
  }
  // protected
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.fromNumber = bnpFromNumber;
  BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
  BigInteger.prototype.changeBit = bnpChangeBit;
  BigInteger.prototype.addTo = bnpAddTo;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
  BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
  BigInteger.prototype.modInt = bnpModInt;
  BigInteger.prototype.millerRabin = bnpMillerRabin;
  // public
  BigInteger.prototype.clone = bnClone;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.byteValue = bnByteValue;
  BigInteger.prototype.shortValue = bnShortValue;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.toByteArray = bnToByteArray;
  BigInteger.prototype.equals = bnEquals;
  BigInteger.prototype.min = bnMin;
  BigInteger.prototype.max = bnMax;
  BigInteger.prototype.and = bnAnd;
  BigInteger.prototype.or = bnOr;
  BigInteger.prototype.xor = bnXor;
  BigInteger.prototype.andNot = bnAndNot;
  BigInteger.prototype.not = bnNot;
  BigInteger.prototype.shiftLeft = bnShiftLeft;
  BigInteger.prototype.shiftRight = bnShiftRight;
  BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
  BigInteger.prototype.bitCount = bnBitCount;
  BigInteger.prototype.testBit = bnTestBit;
  BigInteger.prototype.setBit = bnSetBit;
  BigInteger.prototype.clearBit = bnClearBit;
  BigInteger.prototype.flipBit = bnFlipBit;
  BigInteger.prototype.add = bnAdd;
  BigInteger.prototype.subtract = bnSubtract;
  BigInteger.prototype.multiply = bnMultiply;
  BigInteger.prototype.divide = bnDivide;
  BigInteger.prototype.remainder = bnRemainder;
  BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
  BigInteger.prototype.modPow = bnModPow;
  BigInteger.prototype.modInverse = bnModInverse;
  BigInteger.prototype.pow = bnPow;
  BigInteger.prototype.gcd = bnGCD;
  BigInteger.prototype.isProbablePrime = bnIsProbablePrime;
  // JSBN-specific extension
  BigInteger.prototype.square = bnSquare;
  var Int128 = BigInteger;
  // BigInteger interfaces not implemented in jsbn:
  // BigInteger(int signum, byte[] magnitude)
  // double doubleValue()
  // float floatValue()
  // int hashCode()
  // long longValue()
  // static BigInteger valueOf(long val)
  // Helper functions to make BigInteger functions callable with two parameters
  // as in original C# Clipper
  Int128.prototype.IsNegative = function ()
  {
    if (this.compareTo(Int128.ZERO) == -1) return true;
    else return false;
  };
  Int128.op_Equality = function (val1, val2)
  {
    if (val1.compareTo(val2) == 0) return true;
    else return false;
  };
  Int128.op_Inequality = function (val1, val2)
  {
    if (val1.compareTo(val2) != 0) return true;
    else return false;
  };
  Int128.op_GreaterThan = function (val1, val2)
  {
    if (val1.compareTo(val2) > 0) return true;
    else return false;
  };
  Int128.op_LessThan = function (val1, val2)
  {
    if (val1.compareTo(val2) < 0) return true;
    else return false;
  };
  Int128.op_Addition = function (lhs, rhs)
  {
    return new Int128(lhs).add(new Int128(rhs));
  };
  Int128.op_Subtraction = function (lhs, rhs)
  {
    return new Int128(lhs).subtract(new Int128(rhs));
  };
  Int128.Int128Mul = function (lhs, rhs)
  {
    return new Int128(lhs).multiply(new Int128(rhs));
  };
  Int128.op_Division = function (lhs, rhs)
  {
    return lhs.divide(rhs);
  };
  Int128.prototype.ToDouble = function ()
  {
    return parseFloat(this.toString()); // This could be something faster
  };
  // end of Int128 section
  /*
  // Uncomment the following two lines if you want to use Int128 outside ClipperLib
  if (typeof(document) !== "undefined") window.Int128 = Int128;
  else self.Int128 = Int128;
  */


  // ---------------------------------------------
  // Here starts the actual Clipper library:
  // Helper function to support Inheritance in Javascript
	var Inherit = function (ce, ce2)
	{
		var p;
		if (typeof (Object.getOwnPropertyNames) == 'undefined')
		{
			for (p in ce2.prototype)
				if (typeof (ce.prototype[p]) == 'undefined' || ce.prototype[p] == Object.prototype[p]) ce.prototype[p] = ce2.prototype[p];
			for (p in ce2)
				if (typeof (ce[p]) == 'undefined') ce[p] = ce2[p];
			ce.$baseCtor = ce2;
		}
		else
		{
			var props = Object.getOwnPropertyNames(ce2.prototype);
			for (var i = 0; i < props.length; i++)
				if (typeof (Object.getOwnPropertyDescriptor(ce.prototype, props[i])) == 'undefined') Object.defineProperty(ce.prototype, props[i], Object.getOwnPropertyDescriptor(ce2.prototype, props[i]));
			for (p in ce2)
				if (typeof (ce[p]) == 'undefined') ce[p] = ce2[p];
			ce.$baseCtor = ce2;
		}
	};
  ClipperLib.Path = function ()
  {
    return [];
  };
  ClipperLib.Paths = function ()
  {
    return []; // Was previously [[]], but caused problems when pushed
  };
  // Preserves the calling way of original C# Clipper
  // Is essential due to compatibility, because DoublePoint is public class in original C# version
  ClipperLib.DoublePoint = function ()
  {
    var a = arguments;
    this.X = 0;
    this.Y = 0;
    // public DoublePoint(DoublePoint dp)
    // public DoublePoint(IntPoint ip)
    if (a.length == 1)
    {
      this.X = a[0].X;
      this.Y = a[0].Y;
    }
    else if (a.length == 2)
    {
      this.X = a[0];
      this.Y = a[1];
    }
  }; // This is internal faster function when called without arguments
  ClipperLib.DoublePoint0 = function ()
  {
    this.X = 0;
    this.Y = 0;
  };
  // This is internal faster function when called with 1 argument (dp or ip)
  ClipperLib.DoublePoint1 = function (dp)
  {
    this.X = dp.X;
    this.Y = dp.Y;
  };
  // This is internal faster function when called with 2 arguments (x and y)
  ClipperLib.DoublePoint2 = function (x, y)
  {
    this.X = x;
    this.Y = y;
  };
  // PolyTree & PolyNode start
  // -------------------------------
  ClipperLib.PolyNode = function ()
  {
    this.m_Parent = null;
    this.m_polygon = new ClipperLib.Path();
    this.m_Index = 0;
    this.m_jointype = 0;
    this.m_endtype = 0;
    this.m_Childs = [];
    this.IsOpen = false;
  };
  ClipperLib.PolyNode.prototype.IsHoleNode = function ()
  {
    var result = true;
    var node = this.m_Parent;
    while (node !== null)
    {
      result = !result;
      node = node.m_Parent;
    }
    return result;
  };
  ClipperLib.PolyNode.prototype.ChildCount = function ()
  {
    return this.m_Childs.length;
  };
  ClipperLib.PolyNode.prototype.Contour = function ()
  {
    return this.m_polygon;
  };
  ClipperLib.PolyNode.prototype.AddChild = function (Child)
  {
    var cnt = this.m_Childs.length;
    this.m_Childs.push(Child);
    Child.m_Parent = this;
    Child.m_Index = cnt;
  };
  ClipperLib.PolyNode.prototype.GetNext = function ()
  {
    if (this.m_Childs.length > 0)
      return this.m_Childs[0];
    else
      return this.GetNextSiblingUp();
  };
  ClipperLib.PolyNode.prototype.GetNextSiblingUp = function ()
  {
    if (this.m_Parent === null)
      return null;
    else if (this.m_Index == this.m_Parent.m_Childs.length - 1)
      return this.m_Parent.GetNextSiblingUp();
    else
      return this.m_Parent.m_Childs[this.m_Index + 1];
  };
  ClipperLib.PolyNode.prototype.Childs = function ()
  {
    return this.m_Childs;
  };
  ClipperLib.PolyNode.prototype.Parent = function ()
  {
    return this.m_Parent;
  };
  ClipperLib.PolyNode.prototype.IsHole = function ()
  {
    return this.IsHoleNode();
  };
  // PolyTree : PolyNode
  ClipperLib.PolyTree = function ()
  {
    this.m_AllPolys = [];
    ClipperLib.PolyNode.call(this);
  };
  ClipperLib.PolyTree.prototype.Clear = function ()
  {
    for (var i = 0, ilen = this.m_AllPolys.length; i < ilen; i++)
      this.m_AllPolys[i] = null;
    this.m_AllPolys.length = 0;
    this.m_Childs.length = 0;
  };
  ClipperLib.PolyTree.prototype.GetFirst = function ()
  {
    if (this.m_Childs.length > 0)
      return this.m_Childs[0];
    else
      return null;
  };
  ClipperLib.PolyTree.prototype.Total = function ()
  {
		var result = this.m_AllPolys.length;
		//with negative offsets, ignore the hidden outer polygon ...
		if (result > 0 && this.m_Childs[0] != this.m_AllPolys[0]) result--;
		return result;
  };
  Inherit(ClipperLib.PolyTree, ClipperLib.PolyNode);
  // -------------------------------
  // PolyTree & PolyNode end
  ClipperLib.Math_Abs_Int64 = ClipperLib.Math_Abs_Int32 = ClipperLib.Math_Abs_Double = function (a)
  {
    return Math.abs(a);
  };
  ClipperLib.Math_Max_Int32_Int32 = function (a, b)
  {
    return Math.max(a, b);
  };
  /*
  -----------------------------------
  cast_32 speedtest: http://jsperf.com/truncate-float-to-integer/2
  -----------------------------------
  */
  if (browser.msie || browser.opera || browser.safari) ClipperLib.Cast_Int32 = function (a)
  {
    return a | 0;
  };
  else ClipperLib.Cast_Int32 = function (a)
  { // eg. browser.chrome || browser.chromium || browser.firefox
    return~~ a;
  };
  /*
  --------------------------
  cast_64 speedtests: http://jsperf.com/truncate-float-to-integer
  Chrome: bitwise_not_floor
  Firefox17: toInteger (typeof test)
  IE9: bitwise_or_floor
  IE7 and IE8: to_parseint
  Chromium: to_floor_or_ceil
  Firefox3: to_floor_or_ceil
  Firefox15: to_floor_or_ceil
  Opera: to_floor_or_ceil
  Safari: to_floor_or_ceil
  --------------------------
  */
  if (browser.chrome) ClipperLib.Cast_Int64 = function (a)
  {
    if (a < -2147483648 || a > 2147483647)
      return a < 0 ? Math.ceil(a) : Math.floor(a);
    else return~~ a;
  };
  else if (browser.firefox && typeof (Number.toInteger) == "function") ClipperLib.Cast_Int64 = function (a)
  {
    return Number.toInteger(a);
  };
  else if (browser.msie7 || browser.msie8) ClipperLib.Cast_Int64 = function (a)
  {
    return parseInt(a, 10);
  };
  else if (browser.msie) ClipperLib.Cast_Int64 = function (a)
  {
    if (a < -2147483648 || a > 2147483647)
      return a < 0 ? Math.ceil(a) : Math.floor(a);
    return a | 0;
  };
  // eg. browser.chromium || browser.firefox || browser.opera || browser.safari
  else ClipperLib.Cast_Int64 = function (a)
  {
    return a < 0 ? Math.ceil(a) : Math.floor(a);
  };
  ClipperLib.Clear = function (a)
  {
    a.length = 0;
  };
  //ClipperLib.MaxSteps = 64; // How many steps at maximum in arc in BuildArc() function
  ClipperLib.PI = 3.141592653589793;
  ClipperLib.PI2 = 2 * 3.141592653589793;
  ClipperLib.IntPoint = function ()
  {
    var a = arguments,
      alen = a.length;
    this.X = 0;
    this.Y = 0;
    if (use_xyz)
    {
      this.Z = 0;
      if (alen == 3) // public IntPoint(cInt x, cInt y, cInt z = 0)
      {
        this.X = a[0];
        this.Y = a[1];
        this.Z = a[2];
      }
      else if (alen == 2) // public IntPoint(cInt x, cInt y)
      {
        this.X = a[0];
        this.Y = a[1];
        this.Z = 0;
      }
      else if (alen == 1)
      {
        if (a[0] instanceof ClipperLib.DoublePoint) // public IntPoint(DoublePoint dp)
        {
          var dp = a[0];
          this.X = ClipperLib.Clipper.Round(dp.X);
          this.Y = ClipperLib.Clipper.Round(dp.Y);
          this.Z = 0;
        }
        else // public IntPoint(IntPoint pt)
        {
          var pt = a[0];
          if (typeof (pt.Z) == "undefined") pt.Z = 0;
          this.X = pt.X;
          this.Y = pt.Y;
          this.Z = pt.Z;
        }
      }
      else // public IntPoint()
      {
        this.X = 0;
        this.Y = 0;
        this.Z = 0;
      }
    }
    else // if (!use_xyz)
    {
      if (alen == 2) // public IntPoint(cInt X, cInt Y)
      {
        this.X = a[0];
        this.Y = a[1];
      }
      else if (alen == 1)
      {
        if (a[0] instanceof ClipperLib.DoublePoint) // public IntPoint(DoublePoint dp)
        {
          var dp = a[0];
          this.X = ClipperLib.Clipper.Round(dp.X);
          this.Y = ClipperLib.Clipper.Round(dp.Y);
        }
        else // public IntPoint(IntPoint pt)
        {
          var pt = a[0];
          this.X = pt.X;
          this.Y = pt.Y;
        }
      }
      else // public IntPoint(IntPoint pt)
      {
        this.X = 0;
        this.Y = 0;
      }
    }
  };
  ClipperLib.IntPoint.op_Equality = function (a, b)
  {
    //return a == b;
    return a.X == b.X && a.Y == b.Y;
  };
  ClipperLib.IntPoint.op_Inequality = function (a, b)
  {
    //return a != b;
    return a.X != b.X || a.Y != b.Y;
  };
  /*
  ClipperLib.IntPoint.prototype.Equals = function (obj)
  {
    if (obj === null)
        return false;
    if (obj instanceof ClipperLib.IntPoint)
    {
        var a = Cast(obj, ClipperLib.IntPoint);
        return (this.X == a.X) && (this.Y == a.Y);
    }
    else
        return false;
  };
*/
  if (use_xyz)
  {
    ClipperLib.IntPoint0 = function ()
    {
      this.X = 0;
      this.Y = 0;
      this.Z = 0;
    };
    ClipperLib.IntPoint1 = function (pt)
    {
      this.X = pt.X;
      this.Y = pt.Y;
      this.Z = pt.Z;
    };
    ClipperLib.IntPoint1dp = function (dp)
    {
      this.X = ClipperLib.Clipper.Round(dp.X);
      this.Y = ClipperLib.Clipper.Round(dp.Y);
      this.Z = 0;
    };
    ClipperLib.IntPoint2 = function (x, y)
    {
      this.X = x;
      this.Y = y;
      this.Z = 0;
    };
    ClipperLib.IntPoint3 = function (x, y, z)
    {
      this.X = x;
      this.Y = y;
      this.Z = z;
    };
  }
  else // if (!use_xyz)
  {
    ClipperLib.IntPoint0 = function ()
    {
      this.X = 0;
      this.Y = 0;
    };
    ClipperLib.IntPoint1 = function (pt)
    {
      this.X = pt.X;
      this.Y = pt.Y;
    };
    ClipperLib.IntPoint1dp = function (dp)
    {
      this.X = ClipperLib.Clipper.Round(dp.X);
      this.Y = ClipperLib.Clipper.Round(dp.Y);
    };
    ClipperLib.IntPoint2 = function (x, y)
    {
      this.X = x;
      this.Y = y;
    };
  }
  ClipperLib.IntRect = function ()
  {
    var a = arguments,
      alen = a.length;
    if (alen == 4) // function (l, t, r, b)
    {
      this.left = a[0];
      this.top = a[1];
      this.right = a[2];
      this.bottom = a[3];
    }
    else if (alen == 1) // function (ir)
    {
      this.left = ir.left;
      this.top = ir.top;
      this.right = ir.right;
      this.bottom = ir.bottom;
    }
    else // function ()
    {
      this.left = 0;
      this.top = 0;
      this.right = 0;
      this.bottom = 0;
    }
  };
  ClipperLib.IntRect0 = function ()
  {
    this.left = 0;
    this.top = 0;
    this.right = 0;
    this.bottom = 0;
  };
  ClipperLib.IntRect1 = function (ir)
  {
    this.left = ir.left;
    this.top = ir.top;
    this.right = ir.right;
    this.bottom = ir.bottom;
  };
  ClipperLib.IntRect4 = function (l, t, r, b)
  {
    this.left = l;
    this.top = t;
    this.right = r;
    this.bottom = b;
  };
  ClipperLib.ClipType = {
    ctIntersection: 0,
    ctUnion: 1,
    ctDifference: 2,
    ctXor: 3
  };
  ClipperLib.PolyType = {
    ptSubject: 0,
    ptClip: 1
  };
  ClipperLib.PolyFillType = {
    pftEvenOdd: 0,
    pftNonZero: 1,
    pftPositive: 2,
    pftNegative: 3
  };
  ClipperLib.JoinType = {
    jtSquare: 0,
    jtRound: 1,
    jtMiter: 2
  };
  ClipperLib.EndType = {
    etOpenSquare: 0,
    etOpenRound: 1,
    etOpenButt: 2,
    etClosedLine: 3,
    etClosedPolygon: 4
  };
  ClipperLib.EdgeSide = {
    esLeft: 0,
    esRight: 1
  };
  ClipperLib.Direction = {
    dRightToLeft: 0,
    dLeftToRight: 1
  };
  ClipperLib.TEdge = function ()
  {
    this.Bot = new ClipperLib.IntPoint();
    this.Curr = new ClipperLib.IntPoint();
    this.Top = new ClipperLib.IntPoint();
    this.Delta = new ClipperLib.IntPoint();
    this.Dx = 0;
    this.PolyTyp = ClipperLib.PolyType.ptSubject;
    this.Side = ClipperLib.EdgeSide.esLeft;
    this.WindDelta = 0;
    this.WindCnt = 0;
    this.WindCnt2 = 0;
    this.OutIdx = 0;
    this.Next = null;
    this.Prev = null;
    this.NextInLML = null;
    this.NextInAEL = null;
    this.PrevInAEL = null;
    this.NextInSEL = null;
    this.PrevInSEL = null;
  };
  ClipperLib.IntersectNode = function ()
  {
    this.Edge1 = null;
    this.Edge2 = null;
    this.Pt = new ClipperLib.IntPoint();
  };
  ClipperLib.MyIntersectNodeSort = function () {};
  ClipperLib.MyIntersectNodeSort.Compare = function (node1, node2)
  {
    var i = node2.Pt.Y - node1.Pt.Y;
    if (i > 0) return 1;
    else if (i < 0) return -1;
    else return 0;
  };

  ClipperLib.LocalMinima = function ()
  {
    this.Y = 0;
    this.LeftBound = null;
    this.RightBound = null;
    this.Next = null;
  };
  ClipperLib.Scanbeam = function ()
  {
    this.Y = 0;
    this.Next = null;
  };
  ClipperLib.OutRec = function ()
  {
    this.Idx = 0;
    this.IsHole = false;
    this.IsOpen = false;
    this.FirstLeft = null;
    this.Pts = null;
    this.BottomPt = null;
    this.PolyNode = null;
  };
  ClipperLib.OutPt = function ()
  {
    this.Idx = 0;
    this.Pt = new ClipperLib.IntPoint();
    this.Next = null;
    this.Prev = null;
  };
  ClipperLib.Join = function ()
  {
    this.OutPt1 = null;
    this.OutPt2 = null;
    this.OffPt = new ClipperLib.IntPoint();
  };
  ClipperLib.ClipperBase = function ()
  {
    this.m_MinimaList = null;
    this.m_CurrentLM = null;
    this.m_edges = new Array();
    this.m_UseFullRange = false;
    this.m_HasOpenPaths = false;
    this.PreserveCollinear = false;
    this.m_MinimaList = null;
    this.m_CurrentLM = null;
    this.m_UseFullRange = false;
    this.m_HasOpenPaths = false;
  };
  // Ranges are in original C# too high for Javascript (in current state 2013 september):
  // protected const double horizontal = -3.4E+38;
  // internal const cInt loRange = 0x3FFFFFFF; // = 1073741823 = sqrt(2^63 -1)/2
  // internal const cInt hiRange = 0x3FFFFFFFFFFFFFFFL; // = 4611686018427387903 = sqrt(2^127 -1)/2
  // So had to adjust them to more suitable for Javascript.
  // If JS some day supports truly 64-bit integers, then these ranges can be as in C#
  // and biginteger library can be more simpler (as then 128bit can be represented as two 64bit numbers)
  ClipperLib.ClipperBase.horizontal = -9007199254740992; //-2^53
  ClipperLib.ClipperBase.Skip = -2;
  ClipperLib.ClipperBase.Unassigned = -1;
  ClipperLib.ClipperBase.tolerance = 1E-20;
  if (use_int32)
  {
    ClipperLib.ClipperBase.loRange = 0x7FFF;
    ClipperLib.ClipperBase.hiRange = 0x7FFF;
  }
  else
  {
    ClipperLib.ClipperBase.loRange = 47453132; // sqrt(2^53 -1)/2
    ClipperLib.ClipperBase.hiRange = 4503599627370495; // sqrt(2^106 -1)/2
  }

  ClipperLib.ClipperBase.near_zero = function (val)
  {
    return (val > -ClipperLib.ClipperBase.tolerance) && (val < ClipperLib.ClipperBase.tolerance);
  };
  ClipperLib.ClipperBase.IsHorizontal = function (e)
  {
    return e.Delta.Y === 0;
  };
  ClipperLib.ClipperBase.prototype.PointIsVertex = function (pt, pp)
  {
    var pp2 = pp;
    do {
      if (ClipperLib.IntPoint.op_Equality(pp2.Pt, pt))
        return true;
      pp2 = pp2.Next;
    }
    while (pp2 != pp)
    return false;
  };
  ClipperLib.ClipperBase.prototype.PointOnLineSegment = function (pt, linePt1, linePt2, UseFullRange)
  {
    if (UseFullRange)
      return ((pt.X == linePt1.X) && (pt.Y == linePt1.Y)) ||
        ((pt.X == linePt2.X) && (pt.Y == linePt2.Y)) ||
        (((pt.X > linePt1.X) == (pt.X < linePt2.X)) &&
        ((pt.Y > linePt1.Y) == (pt.Y < linePt2.Y)) &&
        (Int128.op_Equality(Int128.Int128Mul((pt.X - linePt1.X), (linePt2.Y - linePt1.Y)),
          Int128.Int128Mul((linePt2.X - linePt1.X), (pt.Y - linePt1.Y)))));
    else
      return ((pt.X == linePt1.X) && (pt.Y == linePt1.Y)) || ((pt.X == linePt2.X) && (pt.Y == linePt2.Y)) || (((pt.X > linePt1.X) == (pt.X < linePt2.X)) && ((pt.Y > linePt1.Y) == (pt.Y < linePt2.Y)) && ((pt.X - linePt1.X) * (linePt2.Y - linePt1.Y) == (linePt2.X - linePt1.X) * (pt.Y - linePt1.Y)));
  };
  ClipperLib.ClipperBase.prototype.PointOnPolygon = function (pt, pp, UseFullRange)
  {
    var pp2 = pp;
    while (true)
    {
      if (this.PointOnLineSegment(pt, pp2.Pt, pp2.Next.Pt, UseFullRange))
        return true;
      pp2 = pp2.Next;
      if (pp2 == pp)
        break;
    }
    return false;
  };
  ClipperLib.ClipperBase.prototype.SlopesEqual = ClipperLib.ClipperBase.SlopesEqual = function ()
  {
    var a = arguments,
      alen = a.length;
    var e1, e2, pt1, pt2, pt3, pt4, UseFullRange;
    if (alen == 3) // function (e1, e2, UseFullRange)
    {
      e1 = a[0];
      e2 = a[1];
      UseFullRange = a[2];
      if (UseFullRange)
        return Int128.op_Equality(Int128.Int128Mul(e1.Delta.Y, e2.Delta.X), Int128.Int128Mul(e1.Delta.X, e2.Delta.Y));
      else
        return ClipperLib.Cast_Int64((e1.Delta.Y) * (e2.Delta.X)) == ClipperLib.Cast_Int64((e1.Delta.X) * (e2.Delta.Y));
    }
    else if (alen == 4) // function (pt1, pt2, pt3, UseFullRange)
    {
      pt1 = a[0];
      pt2 = a[1];
      pt3 = a[2];
      UseFullRange = a[3];
      if (UseFullRange)
        return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt2.X - pt3.X), Int128.Int128Mul(pt1.X - pt2.X, pt2.Y - pt3.Y));
      else
        return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt2.X - pt3.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt2.Y - pt3.Y)) === 0;
    }
    else // function (pt1, pt2, pt3, pt4, UseFullRange)
    {
      pt1 = a[0];
      pt2 = a[1];
      pt3 = a[2];
      pt4 = a[3];
      UseFullRange = a[4];
      if (UseFullRange)
        return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt3.X - pt4.X), Int128.Int128Mul(pt1.X - pt2.X, pt3.Y - pt4.Y));
      else
        return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt3.X - pt4.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt3.Y - pt4.Y)) === 0;
    }
  };
  ClipperLib.ClipperBase.SlopesEqual3 = function (e1, e2, UseFullRange)
  {
    if (UseFullRange)
      return Int128.op_Equality(Int128.Int128Mul(e1.Delta.Y, e2.Delta.X), Int128.Int128Mul(e1.Delta.X, e2.Delta.Y));
    else
      return ClipperLib.Cast_Int64((e1.Delta.Y) * (e2.Delta.X)) == ClipperLib.Cast_Int64((e1.Delta.X) * (e2.Delta.Y));
  };
  ClipperLib.ClipperBase.SlopesEqual4 = function (pt1, pt2, pt3, UseFullRange)
  {
    if (UseFullRange)
      return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt2.X - pt3.X), Int128.Int128Mul(pt1.X - pt2.X, pt2.Y - pt3.Y));
    else
      return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt2.X - pt3.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt2.Y - pt3.Y)) === 0;
  };
  ClipperLib.ClipperBase.SlopesEqual5 = function (pt1, pt2, pt3, pt4, UseFullRange)
  {
    if (UseFullRange)
      return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt3.X - pt4.X), Int128.Int128Mul(pt1.X - pt2.X, pt3.Y - pt4.Y));
    else
      return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt3.X - pt4.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt3.Y - pt4.Y)) === 0;
  };
  ClipperLib.ClipperBase.prototype.Clear = function ()
  {
    this.DisposeLocalMinimaList();
    for (var i = 0, ilen = this.m_edges.length; i < ilen; ++i)
    {
      for (var j = 0, jlen = this.m_edges[i].length; j < jlen; ++j)
        this.m_edges[i][j] = null;
      ClipperLib.Clear(this.m_edges[i]);
    }
    ClipperLib.Clear(this.m_edges);
    this.m_UseFullRange = false;
    this.m_HasOpenPaths = false;
  };
  ClipperLib.ClipperBase.prototype.DisposeLocalMinimaList = function ()
  {
    while (this.m_MinimaList !== null)
    {
      var tmpLm = this.m_MinimaList.Next;
      this.m_MinimaList = null;
      this.m_MinimaList = tmpLm;
    }
    this.m_CurrentLM = null;
  };
  ClipperLib.ClipperBase.prototype.RangeTest = function (Pt, useFullRange)
  {
    if (useFullRange.Value)
    {
      if (Pt.X > ClipperLib.ClipperBase.hiRange || Pt.Y > ClipperLib.ClipperBase.hiRange || -Pt.X > ClipperLib.ClipperBase.hiRange || -Pt.Y > ClipperLib.ClipperBase.hiRange)
        ClipperLib.Error("Coordinate outside allowed range in RangeTest().");
    }
    else if (Pt.X > ClipperLib.ClipperBase.loRange || Pt.Y > ClipperLib.ClipperBase.loRange || -Pt.X > ClipperLib.ClipperBase.loRange || -Pt.Y > ClipperLib.ClipperBase.loRange)
    {
      useFullRange.Value = true;
      this.RangeTest(Pt, useFullRange);
    }
  };
  ClipperLib.ClipperBase.prototype.InitEdge = function (e, eNext, ePrev, pt)
  {
    e.Next = eNext;
    e.Prev = ePrev;
    //e.Curr = pt;
    e.Curr.X = pt.X;
    e.Curr.Y = pt.Y;
    e.OutIdx = -1;
  };
  ClipperLib.ClipperBase.prototype.InitEdge2 = function (e, polyType)
  {
    if (e.Curr.Y >= e.Next.Curr.Y)
    {
      //e.Bot = e.Curr;
      e.Bot.X = e.Curr.X;
      e.Bot.Y = e.Curr.Y;
      //e.Top = e.Next.Curr;
      e.Top.X = e.Next.Curr.X;
      e.Top.Y = e.Next.Curr.Y;
    }
    else
    {
      //e.Top = e.Curr;
      e.Top.X = e.Curr.X;
      e.Top.Y = e.Curr.Y;
      //e.Bot = e.Next.Curr;
      e.Bot.X = e.Next.Curr.X;
      e.Bot.Y = e.Next.Curr.Y;
    }
    this.SetDx(e);
    e.PolyTyp = polyType;
  };
  ClipperLib.ClipperBase.prototype.FindNextLocMin = function (E)
  {
    var E2;
    for (;;)
    {
      while (ClipperLib.IntPoint.op_Inequality(E.Bot, E.Prev.Bot) || ClipperLib.IntPoint.op_Equality(E.Curr, E.Top))
        E = E.Next;
      if (E.Dx != ClipperLib.ClipperBase.horizontal && E.Prev.Dx != ClipperLib.ClipperBase.horizontal)
        break;
      while (E.Prev.Dx == ClipperLib.ClipperBase.horizontal)
        E = E.Prev;
      E2 = E;
      while (E.Dx == ClipperLib.ClipperBase.horizontal)
        E = E.Next;
      if (E.Top.Y == E.Prev.Bot.Y)
        continue;
      //ie just an intermediate horz.
      if (E2.Prev.Bot.X < E.Bot.X)
        E = E2;
      break;
    }
    return E;
  };
  ClipperLib.ClipperBase.prototype.ProcessBound = function (E, LeftBoundIsForward)
  {
    var EStart;
    var Result = E;
    var Horz;

      if (Result.OutIdx == ClipperLib.ClipperBase.Skip)
      {
        //check if there are edges beyond the skip edge in the bound and if so
        //create another LocMin and calling ProcessBound once more ...
        E = Result;
        if (LeftBoundIsForward)
        {
          while (E.Top.Y == E.Next.Bot.Y) E = E.Next;
          while (E != Result && E.Dx == ClipperLib.ClipperBase.horizontal) E = E.Prev;
        }
        else
        {
          while (E.Top.Y == E.Prev.Bot.Y) E = E.Prev;
          while (E != Result && E.Dx == ClipperLib.ClipperBase.horizontal) E = E.Next;
        }
        if (E == Result)
        {
          if (LeftBoundIsForward) Result = E.Next;
          else Result = E.Prev;
        }
        else
        {
          //there are more edges in the bound beyond result starting with E
          if (LeftBoundIsForward)
            E = Result.Next;
          else
            E = Result.Prev;
          var locMin = new ClipperLib.LocalMinima();
          locMin.Next = null;
          locMin.Y = E.Bot.Y;
          locMin.LeftBound = null;
          locMin.RightBound = E;
          E.WindDelta = 0;
          Result = this.ProcessBound(E, LeftBoundIsForward);
          this.InsertLocalMinima(locMin);
        }
        return Result;
      }

      if (E.Dx == ClipperLib.ClipperBase.horizontal)
      {
        //We need to be careful with open paths because this may not be a
        //true local minima (ie E may be following a skip edge).
        //Also, consecutive horz. edges may start heading left before going right.
        if (LeftBoundIsForward) EStart = E.Prev;
        else EStart = E.Next;
        if (EStart.OutIdx != ClipperLib.ClipperBase.Skip)
        {
          if (EStart.Dx == ClipperLib.ClipperBase.horizontal) //ie an adjoining horizontal skip edge
          {
            if (EStart.Bot.X != E.Bot.X && EStart.Top.X != E.Bot.X)
              this.ReverseHorizontal(E);
          }
          else if (EStart.Bot.X != E.Bot.X)
            this.ReverseHorizontal(E);
        }
      }

      EStart = E;
      if (LeftBoundIsForward)
      {
        while (Result.Top.Y == Result.Next.Bot.Y && Result.Next.OutIdx != ClipperLib.ClipperBase.Skip)
          Result = Result.Next;
        if (Result.Dx == ClipperLib.ClipperBase.horizontal && Result.Next.OutIdx != ClipperLib.ClipperBase.Skip)
        {
          //nb: at the top of a bound, horizontals are added to the bound
          //only when the preceding edge attaches to the horizontal's left vertex
          //unless a Skip edge is encountered when that becomes the top divide
          Horz = Result;
          while (Horz.Prev.Dx == ClipperLib.ClipperBase.horizontal)
            Horz = Horz.Prev;
          if (Horz.Prev.Top.X == Result.Next.Top.X)
          {
            if (!LeftBoundIsForward)
              Result = Horz.Prev;
          }
          else if (Horz.Prev.Top.X > Result.Next.Top.X)
            Result = Horz.Prev;
        }
        while (E != Result)
        {
          E.NextInLML = E.Next;
          if (E.Dx == ClipperLib.ClipperBase.horizontal && E != EStart && E.Bot.X != E.Prev.Top.X)
            this.ReverseHorizontal(E);
          E = E.Next;
        }
        if (E.Dx == ClipperLib.ClipperBase.horizontal && E != EStart && E.Bot.X != E.Prev.Top.X)
          this.ReverseHorizontal(E);
        Result = Result.Next;
        //move to the edge just beyond current bound
      }
      else
      {
        while (Result.Top.Y == Result.Prev.Bot.Y && Result.Prev.OutIdx != ClipperLib.ClipperBase.Skip)
          Result = Result.Prev;
        if (Result.Dx == ClipperLib.ClipperBase.horizontal && Result.Prev.OutIdx != ClipperLib.ClipperBase.Skip)
        {
          Horz = Result;
          while (Horz.Next.Dx == ClipperLib.ClipperBase.horizontal)
            Horz = Horz.Next;
          if (Horz.Next.Top.X == Result.Prev.Top.X)
          {
            if (!LeftBoundIsForward)
              Result = Horz.Next;
          }
          else if (Horz.Next.Top.X > Result.Prev.Top.X)
            Result = Horz.Next;
        }
        while (E != Result)
        {
          E.NextInLML = E.Prev;
          if (E.Dx == ClipperLib.ClipperBase.horizontal && E != EStart && E.Bot.X != E.Next.Top.X)
            this.ReverseHorizontal(E);
          E = E.Prev;
        }
        if (E.Dx == ClipperLib.ClipperBase.horizontal && E != EStart && E.Bot.X != E.Next.Top.X)
          this.ReverseHorizontal(E);
        Result = Result.Prev;
        //move to the edge just beyond current bound
      }

    return Result;
  };

  ClipperLib.ClipperBase.prototype.AddPath = function (pg, polyType, Closed)
  {
    if (use_lines)
    {
      if (!Closed && polyType == ClipperLib.PolyType.ptClip)
        ClipperLib.Error("AddPath: Open paths must be subject.");
    }
    else
    {
      if (!Closed)
        ClipperLib.Error("AddPath: Open paths have been disabled.");
    }
    var highI = pg.length - 1;
    if (Closed)
      while (highI > 0 && (ClipperLib.IntPoint.op_Equality(pg[highI], pg[0])))
    --highI;
    while (highI > 0 && (ClipperLib.IntPoint.op_Equality(pg[highI], pg[highI - 1])))
    --highI;
    if ((Closed && highI < 2) || (!Closed && highI < 1))
      return false;
    //create a new edge array ...
    var edges = new Array();
    for (var i = 0; i <= highI; i++)
      edges.push(new ClipperLib.TEdge());
    var IsFlat = true;
    //1. Basic (first) edge initialization ...

    //edges[1].Curr = pg[1];
    edges[1].Curr.X = pg[1].X;
    edges[1].Curr.Y = pg[1].Y;

    var $1 = {Value: this.m_UseFullRange};
    this.RangeTest(pg[0], $1);
    this.m_UseFullRange = $1.Value;

    $1.Value = this.m_UseFullRange;
    this.RangeTest(pg[highI], $1);
    this.m_UseFullRange = $1.Value;

    this.InitEdge(edges[0], edges[1], edges[highI], pg[0]);
    this.InitEdge(edges[highI], edges[0], edges[highI - 1], pg[highI]);
    for (var i = highI - 1; i >= 1; --i)
    {
      $1.Value = this.m_UseFullRange;
      this.RangeTest(pg[i], $1);
      this.m_UseFullRange = $1.Value;

      this.InitEdge(edges[i], edges[i + 1], edges[i - 1], pg[i]);
    }

    var eStart = edges[0];
    //2. Remove duplicate vertices, and (when closed) collinear edges ...
    var E = eStart,
      eLoopStop = eStart;
    for (;;)
    {
    //console.log(E.Next, eStart);
    	//nb: allows matching start and end points when not Closed ...
      if (E.Curr == E.Next.Curr && (Closed || E.Next != eStart))
      {
        if (E == E.Next)
          break;
        if (E == eStart)
          eStart = E.Next;
        E = this.RemoveEdge(E);
        eLoopStop = E;
        continue;
      }
      if (E.Prev == E.Next)
        break;
      else if (Closed && ClipperLib.ClipperBase.SlopesEqual(E.Prev.Curr, E.Curr, E.Next.Curr, this.m_UseFullRange) && (!this.PreserveCollinear || !this.Pt2IsBetweenPt1AndPt3(E.Prev.Curr, E.Curr, E.Next.Curr)))
      {
        //Collinear edges are allowed for open paths but in closed paths
        //the default is to merge adjacent collinear edges into a single edge.
        //However, if the PreserveCollinear property is enabled, only overlapping
        //collinear edges (ie spikes) will be removed from closed paths.
        if (E == eStart)
          eStart = E.Next;
        E = this.RemoveEdge(E);
        E = E.Prev;
        eLoopStop = E;
        continue;
      }
      E = E.Next;
      if ((E == eLoopStop) || (!Closed && E.Next == eStart)) break;
    }
    if ((!Closed && (E == E.Next)) || (Closed && (E.Prev == E.Next)))
      return false;
    if (!Closed)
    {
      this.m_HasOpenPaths = true;
      eStart.Prev.OutIdx = ClipperLib.ClipperBase.Skip;
    }
    //3. Do second stage of edge initialization ...
    E = eStart;
    do {
      this.InitEdge2(E, polyType);
      E = E.Next;
      if (IsFlat && E.Curr.Y != eStart.Curr.Y)
        IsFlat = false;
    }
    while (E != eStart)
    //4. Finally, add edge bounds to LocalMinima list ...
    //Totally flat paths must be handled differently when adding them
    //to LocalMinima list to avoid endless loops etc ...
    if (IsFlat)
    {
      if (Closed)
        return false;
      E.Prev.OutIdx = ClipperLib.ClipperBase.Skip;
      if (E.Prev.Bot.X < E.Prev.Top.X)
        this.ReverseHorizontal(E.Prev);
      var locMin = new ClipperLib.LocalMinima();
      locMin.Next = null;
      locMin.Y = E.Bot.Y;
      locMin.LeftBound = null;
      locMin.RightBound = E;
      locMin.RightBound.Side = ClipperLib.EdgeSide.esRight;
      locMin.RightBound.WindDelta = 0;
      while (E.Next.OutIdx != ClipperLib.ClipperBase.Skip)
      {
        E.NextInLML = E.Next;
        if (E.Bot.X != E.Prev.Top.X)
          this.ReverseHorizontal(E);
        E = E.Next;
      }
      this.InsertLocalMinima(locMin);
      this.m_edges.push(edges);
      return true;
    }
    this.m_edges.push(edges);
    var leftBoundIsForward;
    var EMin = null;

		//workaround to avoid an endless loop in the while loop below when
    //open paths have matching start and end points ...
    if(ClipperLib.IntPoint.op_Equality(E.Prev.Bot, E.Prev.Top))
    	E = E.Next;

    for (;;)
    {
      E = this.FindNextLocMin(E);
      if (E == EMin)
        break;
      else if (EMin == null)
        EMin = E;
      //E and E.Prev now share a local minima (left aligned if horizontal).
      //Compare their slopes to find which starts which bound ...
      var locMin = new ClipperLib.LocalMinima();
      locMin.Next = null;
      locMin.Y = E.Bot.Y;
      if (E.Dx < E.Prev.Dx)
      {
        locMin.LeftBound = E.Prev;
        locMin.RightBound = E;
        leftBoundIsForward = false;
        //Q.nextInLML = Q.prev
      }
      else
      {
        locMin.LeftBound = E;
        locMin.RightBound = E.Prev;
        leftBoundIsForward = true;
        //Q.nextInLML = Q.next
      }
      locMin.LeftBound.Side = ClipperLib.EdgeSide.esLeft;
      locMin.RightBound.Side = ClipperLib.EdgeSide.esRight;
      if (!Closed)
        locMin.LeftBound.WindDelta = 0;
      else if (locMin.LeftBound.Next == locMin.RightBound)
        locMin.LeftBound.WindDelta = -1;
      else
        locMin.LeftBound.WindDelta = 1;
      locMin.RightBound.WindDelta = -locMin.LeftBound.WindDelta;
      E = this.ProcessBound(locMin.LeftBound, leftBoundIsForward);
      if (E.OutIdx == ClipperLib.ClipperBase.Skip)
      	E = this.ProcessBound(E, leftBoundIsForward);
      var E2 = this.ProcessBound(locMin.RightBound, !leftBoundIsForward);
      if (E2.OutIdx == ClipperLib.ClipperBase.Skip) E2 = this.ProcessBound(E2, !leftBoundIsForward);
      if (locMin.LeftBound.OutIdx == ClipperLib.ClipperBase.Skip)
        locMin.LeftBound = null;
      else if (locMin.RightBound.OutIdx == ClipperLib.ClipperBase.Skip)
        locMin.RightBound = null;
      this.InsertLocalMinima(locMin);
      if (!leftBoundIsForward)
        E = E2;
    }
    return true;
  };
  ClipperLib.ClipperBase.prototype.AddPaths = function (ppg, polyType, closed)
  {
    //  console.log("-------------------------------------------");
    //  console.log(JSON.stringify(ppg));
    var result = false;
    for (var i = 0, ilen = ppg.length; i < ilen; ++i)
      if (this.AddPath(ppg[i], polyType, closed))
        result = true;
    return result;
  };
  //------------------------------------------------------------------------------
  ClipperLib.ClipperBase.prototype.Pt2IsBetweenPt1AndPt3 = function (pt1, pt2, pt3)
  {
    if ((ClipperLib.IntPoint.op_Equality(pt1, pt3)) || (ClipperLib.IntPoint.op_Equality(pt1, pt2)) ||       (ClipperLib.IntPoint.op_Equality(pt3, pt2)))

   //if ((pt1 == pt3) || (pt1 == pt2) || (pt3 == pt2))
   return false;

    else if (pt1.X != pt3.X)
      return (pt2.X > pt1.X) == (pt2.X < pt3.X);
    else
      return (pt2.Y > pt1.Y) == (pt2.Y < pt3.Y);
  };
  ClipperLib.ClipperBase.prototype.RemoveEdge = function (e)
  {
    //removes e from double_linked_list (but without removing from memory)
    e.Prev.Next = e.Next;
    e.Next.Prev = e.Prev;
    var result = e.Next;
    e.Prev = null; //flag as removed (see ClipperBase.Clear)
    return result;
  };
  ClipperLib.ClipperBase.prototype.SetDx = function (e)
  {
    e.Delta.X = (e.Top.X - e.Bot.X);
    e.Delta.Y = (e.Top.Y - e.Bot.Y);
    if (e.Delta.Y === 0) e.Dx = ClipperLib.ClipperBase.horizontal;
    else e.Dx = (e.Delta.X) / (e.Delta.Y);
  };
  ClipperLib.ClipperBase.prototype.InsertLocalMinima = function (newLm)
  {
    if (this.m_MinimaList === null)
    {
      this.m_MinimaList = newLm;
    }
    else if (newLm.Y >= this.m_MinimaList.Y)
    {
      newLm.Next = this.m_MinimaList;
      this.m_MinimaList = newLm;
    }
    else
    {
      var tmpLm = this.m_MinimaList;
      while (tmpLm.Next !== null && (newLm.Y < tmpLm.Next.Y))
        tmpLm = tmpLm.Next;
      newLm.Next = tmpLm.Next;
      tmpLm.Next = newLm;
    }
  };
  ClipperLib.ClipperBase.prototype.PopLocalMinima = function ()
  {
    if (this.m_CurrentLM === null)
      return;
    this.m_CurrentLM = this.m_CurrentLM.Next;
  };
  ClipperLib.ClipperBase.prototype.ReverseHorizontal = function (e)
  {
    //swap horizontal edges' top and bottom x's so they follow the natural
    //progression of the bounds - ie so their xbots will align with the
    //adjoining lower edge. [Helpful in the ProcessHorizontal() method.]
    var tmp = e.Top.X;
    e.Top.X = e.Bot.X;
    e.Bot.X = tmp;
    if (use_xyz)
    {
      tmp = e.Top.Z;
      e.Top.Z = e.Bot.Z;
      e.Bot.Z = tmp;
    }
  };
  ClipperLib.ClipperBase.prototype.Reset = function ()
  {
    this.m_CurrentLM = this.m_MinimaList;
    if (this.m_CurrentLM == null)
      return;
    //ie nothing to process
    //reset all edges ...
    var lm = this.m_MinimaList;
    while (lm != null)
    {
      var e = lm.LeftBound;
      if (e != null)
      {
        //e.Curr = e.Bot;
        e.Curr.X = e.Bot.X;
        e.Curr.Y = e.Bot.Y;
        e.Side = ClipperLib.EdgeSide.esLeft;
        e.OutIdx = ClipperLib.ClipperBase.Unassigned;
      }
      e = lm.RightBound;
      if (e != null)
      {
        //e.Curr = e.Bot;
        e.Curr.X = e.Bot.X;
        e.Curr.Y = e.Bot.Y;
        e.Side = ClipperLib.EdgeSide.esRight;
        e.OutIdx = ClipperLib.ClipperBase.Unassigned;
      }
      lm = lm.Next;
    }
  };
  ClipperLib.Clipper = function (InitOptions) // public Clipper(int InitOptions = 0)
  {
    if (typeof (InitOptions) == "undefined") InitOptions = 0;
    this.m_PolyOuts = null;
    this.m_ClipType = ClipperLib.ClipType.ctIntersection;
    this.m_Scanbeam = null;
    this.m_ActiveEdges = null;
    this.m_SortedEdges = null;
    this.m_IntersectList = null;
    this.m_IntersectNodeComparer = null;
    this.m_ExecuteLocked = false;
    this.m_ClipFillType = ClipperLib.PolyFillType.pftEvenOdd;
    this.m_SubjFillType = ClipperLib.PolyFillType.pftEvenOdd;
    this.m_Joins = null;
    this.m_GhostJoins = null;
    this.m_UsingPolyTree = false;
    this.ReverseSolution = false;
    this.StrictlySimple = false;
    ClipperLib.ClipperBase.call(this);
    this.m_Scanbeam = null;
    this.m_ActiveEdges = null;
    this.m_SortedEdges = null;
    this.m_IntersectList = new Array();
    this.m_IntersectNodeComparer = ClipperLib.MyIntersectNodeSort.Compare;
    this.m_ExecuteLocked = false;
    this.m_UsingPolyTree = false;
    this.m_PolyOuts = new Array();
    this.m_Joins = new Array();
    this.m_GhostJoins = new Array();
    this.ReverseSolution = (1 & InitOptions) !== 0;
    this.StrictlySimple = (2 & InitOptions) !== 0;
    this.PreserveCollinear = (4 & InitOptions) !== 0;
    if (use_xyz)
    {
      this.ZFillFunction = null; // function (IntPoint vert1, IntPoint vert2, ref IntPoint intersectPt);
    }
  };
  ClipperLib.Clipper.ioReverseSolution = 1;
  ClipperLib.Clipper.ioStrictlySimple = 2;
  ClipperLib.Clipper.ioPreserveCollinear = 4;

  ClipperLib.Clipper.prototype.Clear = function ()
  {
    if (this.m_edges.length === 0)
      return;
    //avoids problems with ClipperBase destructor
    this.DisposeAllPolyPts();
    ClipperLib.ClipperBase.prototype.Clear.call(this);
  };

  ClipperLib.Clipper.prototype.DisposeScanbeamList = function ()
  {
    while (this.m_Scanbeam !== null)
    {
      var sb2 = this.m_Scanbeam.Next;
      this.m_Scanbeam = null;
      this.m_Scanbeam = sb2;
    }
  };
  ClipperLib.Clipper.prototype.Reset = function ()
  {
    ClipperLib.ClipperBase.prototype.Reset.call(this);
    this.m_Scanbeam = null;
    this.m_ActiveEdges = null;
    this.m_SortedEdges = null;

    var lm = this.m_MinimaList;
    while (lm !== null)
    {
      this.InsertScanbeam(lm.Y);
      lm = lm.Next;
    }
  };
  ClipperLib.Clipper.prototype.InsertScanbeam = function (Y)
  {
    if (this.m_Scanbeam === null)
    {
      this.m_Scanbeam = new ClipperLib.Scanbeam();
      this.m_Scanbeam.Next = null;
      this.m_Scanbeam.Y = Y;
    }
    else if (Y > this.m_Scanbeam.Y)
    {
      var newSb = new ClipperLib.Scanbeam();
      newSb.Y = Y;
      newSb.Next = this.m_Scanbeam;
      this.m_Scanbeam = newSb;
    }
    else
    {
      var sb2 = this.m_Scanbeam;
      while (sb2.Next !== null && (Y <= sb2.Next.Y))
        sb2 = sb2.Next;
      if (Y == sb2.Y)
        return;
      //ie ignores duplicates
      var newSb = new ClipperLib.Scanbeam();
      newSb.Y = Y;
      newSb.Next = sb2.Next;
      sb2.Next = newSb;
    }
  };
  // ************************************
  ClipperLib.Clipper.prototype.Execute = function ()
  {
    var a = arguments,
      alen = a.length,
      ispolytree = a[1] instanceof ClipperLib.PolyTree;
    if (alen == 4 && !ispolytree) // function (clipType, solution, subjFillType, clipFillType)
    {
      var clipType = a[0],
        solution = a[1],
        subjFillType = a[2],
        clipFillType = a[3];
      if (this.m_ExecuteLocked)
        return false;
      if (this.m_HasOpenPaths)
        ClipperLib.Error("Error: PolyTree struct is need for open path clipping.");
      this.m_ExecuteLocked = true;
      ClipperLib.Clear(solution);
      this.m_SubjFillType = subjFillType;
      this.m_ClipFillType = clipFillType;
      this.m_ClipType = clipType;
      this.m_UsingPolyTree = false;
      try
      {
        var succeeded = this.ExecuteInternal();
        //build the return polygons ...
        if (succeeded) this.BuildResult(solution);
      }
      finally
      {
        this.DisposeAllPolyPts();
        this.m_ExecuteLocked = false;
      }
      return succeeded;
    }
    else if (alen == 4 && ispolytree) // function (clipType, polytree, subjFillType, clipFillType)
    {
      var clipType = a[0],
        polytree = a[1],
        subjFillType = a[2],
        clipFillType = a[3];
      if (this.m_ExecuteLocked)
        return false;
      this.m_ExecuteLocked = true;
      this.m_SubjFillType = subjFillType;
      this.m_ClipFillType = clipFillType;
      this.m_ClipType = clipType;
      this.m_UsingPolyTree = true;
      try
      {
        var succeeded = this.ExecuteInternal();
        //build the return polygons ...
        if (succeeded) this.BuildResult2(polytree);
      }
      finally
      {
        this.DisposeAllPolyPts();
        this.m_ExecuteLocked = false;
      }
      return succeeded;
    }
    else if (alen == 2 && !ispolytree) // function (clipType, solution)
    {
      var clipType = a[0],
        solution = a[1];
      return this.Execute(clipType, solution, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
    }
    else if (alen == 2 && ispolytree) // function (clipType, polytree)
    {
      var clipType = a[0],
        polytree = a[1];
      return this.Execute(clipType, polytree, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
    }
  };
  ClipperLib.Clipper.prototype.FixHoleLinkage = function (outRec)
  {
    //skip if an outermost polygon or
    //already already points to the correct FirstLeft ...
    if (outRec.FirstLeft === null || (outRec.IsHole != outRec.FirstLeft.IsHole && outRec.FirstLeft.Pts !== null))
      return;
    var orfl = outRec.FirstLeft;
    while (orfl !== null && ((orfl.IsHole == outRec.IsHole) || orfl.Pts === null))
      orfl = orfl.FirstLeft;
    outRec.FirstLeft = orfl;
  };
  ClipperLib.Clipper.prototype.ExecuteInternal = function ()
  {
    try
    {
      this.Reset();
      if (this.m_CurrentLM === null)
        return false;
      var botY = this.PopScanbeam();
      do {
        this.InsertLocalMinimaIntoAEL(botY);
        ClipperLib.Clear(this.m_GhostJoins);
        this.ProcessHorizontals(false);
        if (this.m_Scanbeam === null)
          break;
        var topY = this.PopScanbeam();
        if (!this.ProcessIntersections(topY)) return false;

        this.ProcessEdgesAtTopOfScanbeam(topY);
        botY = topY;
      }
      while (this.m_Scanbeam !== null || this.m_CurrentLM !== null)
      //fix orientations ...
      for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
      {
        var outRec = this.m_PolyOuts[i];
        if (outRec.Pts === null || outRec.IsOpen)
          continue;
        if ((outRec.IsHole ^ this.ReverseSolution) == (this.Area(outRec) > 0))
          this.ReversePolyPtLinks(outRec.Pts);
      }
      this.JoinCommonEdges();
      for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
      {
        var outRec = this.m_PolyOuts[i];
        if (outRec.Pts !== null && !outRec.IsOpen)
          this.FixupOutPolygon(outRec);
      }
      if (this.StrictlySimple)
        this.DoSimplePolygons();
      return true;
    }
    finally
    {
      ClipperLib.Clear(this.m_Joins);
      ClipperLib.Clear(this.m_GhostJoins);
    }
  };
  ClipperLib.Clipper.prototype.PopScanbeam = function ()
  {
    var Y = this.m_Scanbeam.Y;
    this.m_Scanbeam = this.m_Scanbeam.Next;
    return Y;
  };

  ClipperLib.Clipper.prototype.DisposeAllPolyPts = function ()
  {
    for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; ++i)
      this.DisposeOutRec(i);
    ClipperLib.Clear(this.m_PolyOuts);
  };
  ClipperLib.Clipper.prototype.DisposeOutRec = function (index)
  {
    var outRec = this.m_PolyOuts[index];
    outRec.Pts = null;
    outRec = null;
    this.m_PolyOuts[index] = null;
  };

  ClipperLib.Clipper.prototype.AddJoin = function (Op1, Op2, OffPt)
  {
    var j = new ClipperLib.Join();
    j.OutPt1 = Op1;
    j.OutPt2 = Op2;
    //j.OffPt = OffPt;
    j.OffPt.X = OffPt.X;
    j.OffPt.Y = OffPt.Y;
    this.m_Joins.push(j);
  };
  ClipperLib.Clipper.prototype.AddGhostJoin = function (Op, OffPt)
  {
    var j = new ClipperLib.Join();
    j.OutPt1 = Op;
    //j.OffPt = OffPt;
    j.OffPt.X = OffPt.X;
    j.OffPt.Y = OffPt.Y;
    this.m_GhostJoins.push(j);
  };
  if (use_xyz)
  {
    ClipperLib.Clipper.prototype.SetZ = function (pt, e1, e2)
    {
      if (this.ZFillFunction !== null)
      {
        if (pt.Z != 0 || this.ZFillFunction === null) return;
        else if (ClipperLib.IntPoint.op_Equality(pt, e1.Bot)) pt.Z = e1.Bot.Z;
        else if (ClipperLib.IntPoint.op_Equality(pt, e1.Top)) pt.Z = e1.Top.Z;
        else if (ClipperLib.IntPoint.op_Equality(pt, e2.Bot)) pt.Z = e2.Bot.Z;
        else if (ClipperLib.IntPoint.op_Equality(pt, e2.Top)) pt.Z = e2.Top.Z;
        else ZFillFunction(e1.Bot, e1.Top, e2.Bot, e2.Top, pt);
      }
    };

    //------------------------------------------------------------------------------
  }

  ClipperLib.Clipper.prototype.InsertLocalMinimaIntoAEL = function (botY)
  {
    while (this.m_CurrentLM !== null && (this.m_CurrentLM.Y == botY))
    {
      var lb = this.m_CurrentLM.LeftBound;
      var rb = this.m_CurrentLM.RightBound;
      this.PopLocalMinima();
      var Op1 = null;
      if (lb === null)
      {
        this.InsertEdgeIntoAEL(rb, null);
        this.SetWindingCount(rb);
        if (this.IsContributing(rb))
          Op1 = this.AddOutPt(rb, rb.Bot);
      }
      else if (rb == null)
      {
        this.InsertEdgeIntoAEL(lb, null);
        this.SetWindingCount(lb);
        if (this.IsContributing(lb))
          Op1 = this.AddOutPt(lb, lb.Bot);
        this.InsertScanbeam(lb.Top.Y);
      }
      else
      {
        this.InsertEdgeIntoAEL(lb, null);
        this.InsertEdgeIntoAEL(rb, lb);
        this.SetWindingCount(lb);
        rb.WindCnt = lb.WindCnt;
        rb.WindCnt2 = lb.WindCnt2;
        if (this.IsContributing(lb))
          Op1 = this.AddLocalMinPoly(lb, rb, lb.Bot);
        this.InsertScanbeam(lb.Top.Y);
      }
      if (rb != null)
      {
        if (ClipperLib.ClipperBase.IsHorizontal(rb))
          this.AddEdgeToSEL(rb);
        else
          this.InsertScanbeam(rb.Top.Y);
      }
      if (lb == null || rb == null) continue;
      //if output polygons share an Edge with a horizontal rb, they'll need joining later ...
      if (Op1 !== null && ClipperLib.ClipperBase.IsHorizontal(rb) && this.m_GhostJoins.length > 0 && rb.WindDelta !== 0)
      {
        for (var i = 0, ilen = this.m_GhostJoins.length; i < ilen; i++)
        {
          //if the horizontal Rb and a 'ghost' horizontal overlap, then convert
          //the 'ghost' join to a real join ready for later ...
          var j = this.m_GhostJoins[i];

					if (this.HorzSegmentsOverlap(j.OutPt1.Pt.X, j.OffPt.X, rb.Bot.X, rb.Top.X))
            this.AddJoin(j.OutPt1, Op1, j.OffPt);
        }
      }
      if (lb.OutIdx >= 0 && lb.PrevInAEL !== null &&
        lb.PrevInAEL.Curr.X == lb.Bot.X &&
        lb.PrevInAEL.OutIdx >= 0 &&
        ClipperLib.ClipperBase.SlopesEqual(lb.PrevInAEL, lb, this.m_UseFullRange) &&
        lb.WindDelta !== 0 && lb.PrevInAEL.WindDelta !== 0)
      {
        var Op2 = this.AddOutPt(lb.PrevInAEL, lb.Bot);
        this.AddJoin(Op1, Op2, lb.Top);
      }
      if (lb.NextInAEL != rb)
      {
        if (rb.OutIdx >= 0 && rb.PrevInAEL.OutIdx >= 0 &&
          ClipperLib.ClipperBase.SlopesEqual(rb.PrevInAEL, rb, this.m_UseFullRange) &&
          rb.WindDelta !== 0 && rb.PrevInAEL.WindDelta !== 0)
        {
          var Op2 = this.AddOutPt(rb.PrevInAEL, rb.Bot);
          this.AddJoin(Op1, Op2, rb.Top);
        }
        var e = lb.NextInAEL;
        if (e !== null)
          while (e != rb)
          {
            //nb: For calculating winding counts etc, IntersectEdges() assumes
            //that param1 will be to the right of param2 ABOVE the intersection ...
            this.IntersectEdges(rb, e, lb.Curr, false);
            //order important here
            e = e.NextInAEL;
          }
      }
    }
  };
  ClipperLib.Clipper.prototype.InsertEdgeIntoAEL = function (edge, startEdge)
  {
    if (this.m_ActiveEdges === null)
    {
      edge.PrevInAEL = null;
      edge.NextInAEL = null;
      this.m_ActiveEdges = edge;
    }
    else if (startEdge === null && this.E2InsertsBeforeE1(this.m_ActiveEdges, edge))
    {
      edge.PrevInAEL = null;
      edge.NextInAEL = this.m_ActiveEdges;
      this.m_ActiveEdges.PrevInAEL = edge;
      this.m_ActiveEdges = edge;
    }
    else
    {
      if (startEdge === null)
        startEdge = this.m_ActiveEdges;
      while (startEdge.NextInAEL !== null && !this.E2InsertsBeforeE1(startEdge.NextInAEL, edge))
        startEdge = startEdge.NextInAEL;
      edge.NextInAEL = startEdge.NextInAEL;
      if (startEdge.NextInAEL !== null)
        startEdge.NextInAEL.PrevInAEL = edge;
      edge.PrevInAEL = startEdge;
      startEdge.NextInAEL = edge;
    }
  };
  ClipperLib.Clipper.prototype.E2InsertsBeforeE1 = function (e1, e2)
  {
    if (e2.Curr.X == e1.Curr.X)
    {
      if (e2.Top.Y > e1.Top.Y)
        return e2.Top.X < ClipperLib.Clipper.TopX(e1, e2.Top.Y);
      else
        return e1.Top.X > ClipperLib.Clipper.TopX(e2, e1.Top.Y);
    }
    else
      return e2.Curr.X < e1.Curr.X;
  };
  ClipperLib.Clipper.prototype.IsEvenOddFillType = function (edge)
  {
    if (edge.PolyTyp == ClipperLib.PolyType.ptSubject)
      return this.m_SubjFillType == ClipperLib.PolyFillType.pftEvenOdd;
    else
      return this.m_ClipFillType == ClipperLib.PolyFillType.pftEvenOdd;
  };
  ClipperLib.Clipper.prototype.IsEvenOddAltFillType = function (edge)
  {
    if (edge.PolyTyp == ClipperLib.PolyType.ptSubject)
      return this.m_ClipFillType == ClipperLib.PolyFillType.pftEvenOdd;
    else
      return this.m_SubjFillType == ClipperLib.PolyFillType.pftEvenOdd;
  };
  ClipperLib.Clipper.prototype.IsContributing = function (edge)
  {
    var pft, pft2;
    if (edge.PolyTyp == ClipperLib.PolyType.ptSubject)
    {
      pft = this.m_SubjFillType;
      pft2 = this.m_ClipFillType;
    }
    else
    {
      pft = this.m_ClipFillType;
      pft2 = this.m_SubjFillType;
    }
    switch (pft)
    {
    case ClipperLib.PolyFillType.pftEvenOdd:
      if (edge.WindDelta === 0 && edge.WindCnt != 1)
        return false;
      break;
    case ClipperLib.PolyFillType.pftNonZero:
      if (Math.abs(edge.WindCnt) != 1)
        return false;
      break;
    case ClipperLib.PolyFillType.pftPositive:
      if (edge.WindCnt != 1)
        return false;
      break;
    default:
      if (edge.WindCnt != -1)
        return false;
      break;
    }
    switch (this.m_ClipType)
    {
    case ClipperLib.ClipType.ctIntersection:
      switch (pft2)
      {
      case ClipperLib.PolyFillType.pftEvenOdd:
      case ClipperLib.PolyFillType.pftNonZero:
        return (edge.WindCnt2 !== 0);
      case ClipperLib.PolyFillType.pftPositive:
        return (edge.WindCnt2 > 0);
      default:
        return (edge.WindCnt2 < 0);
      }
    case ClipperLib.ClipType.ctUnion:
      switch (pft2)
      {
      case ClipperLib.PolyFillType.pftEvenOdd:
      case ClipperLib.PolyFillType.pftNonZero:
        return (edge.WindCnt2 === 0);
      case ClipperLib.PolyFillType.pftPositive:
        return (edge.WindCnt2 <= 0);
      default:
        return (edge.WindCnt2 >= 0);
      }
    case ClipperLib.ClipType.ctDifference:
      if (edge.PolyTyp == ClipperLib.PolyType.ptSubject)
        switch (pft2)
        {
        case ClipperLib.PolyFillType.pftEvenOdd:
        case ClipperLib.PolyFillType.pftNonZero:
          return (edge.WindCnt2 === 0);
        case ClipperLib.PolyFillType.pftPositive:
          return (edge.WindCnt2 <= 0);
        default:
          return (edge.WindCnt2 >= 0);
        }
      else
        switch (pft2)
        {
        case ClipperLib.PolyFillType.pftEvenOdd:
        case ClipperLib.PolyFillType.pftNonZero:
          return (edge.WindCnt2 !== 0);
        case ClipperLib.PolyFillType.pftPositive:
          return (edge.WindCnt2 > 0);
        default:
          return (edge.WindCnt2 < 0);
        }
    case ClipperLib.ClipType.ctXor:
      if (edge.WindDelta === 0)
        switch (pft2)
        {
        case ClipperLib.PolyFillType.pftEvenOdd:
        case ClipperLib.PolyFillType.pftNonZero:
          return (edge.WindCnt2 === 0);
        case ClipperLib.PolyFillType.pftPositive:
          return (edge.WindCnt2 <= 0);
        default:
          return (edge.WindCnt2 >= 0);
        }
      else
        return true;
    }
    return true;
  };
  ClipperLib.Clipper.prototype.SetWindingCount = function (edge)
  {
    var e = edge.PrevInAEL;
    //find the edge of the same polytype that immediately preceeds 'edge' in AEL
    while (e !== null && ((e.PolyTyp != edge.PolyTyp) || (e.WindDelta === 0)))
      e = e.PrevInAEL;
    if (e === null)
    {
      edge.WindCnt = (edge.WindDelta === 0 ? 1 : edge.WindDelta);
      edge.WindCnt2 = 0;
      e = this.m_ActiveEdges;
      //ie get ready to calc WindCnt2
    }
    else if (edge.WindDelta === 0 && this.m_ClipType != ClipperLib.ClipType.ctUnion)
    {
      edge.WindCnt = 1;
      edge.WindCnt2 = e.WindCnt2;
      e = e.NextInAEL;
      //ie get ready to calc WindCnt2
    }
    else if (this.IsEvenOddFillType(edge))
    {
      //EvenOdd filling ...
      if (edge.WindDelta === 0)
      {
        //are we inside a subj polygon ...
        var Inside = true;
        var e2 = e.PrevInAEL;
        while (e2 !== null)
        {
          if (e2.PolyTyp == e.PolyTyp && e2.WindDelta !== 0)
            Inside = !Inside;
          e2 = e2.PrevInAEL;
        }
        edge.WindCnt = (Inside ? 0 : 1);
      }
      else
      {
        edge.WindCnt = edge.WindDelta;
      }
      edge.WindCnt2 = e.WindCnt2;
      e = e.NextInAEL;
      //ie get ready to calc WindCnt2
    }
    else
    {
      //nonZero, Positive or Negative filling ...
      if (e.WindCnt * e.WindDelta < 0)
      {
        //prev edge is 'decreasing' WindCount (WC) toward zero
        //so we're outside the previous polygon ...
        if (Math.abs(e.WindCnt) > 1)
        {
          //outside prev poly but still inside another.
          //when reversing direction of prev poly use the same WC
          if (e.WindDelta * edge.WindDelta < 0)
            edge.WindCnt = e.WindCnt;
          else
            edge.WindCnt = e.WindCnt + edge.WindDelta;
        }
        else
          edge.WindCnt = (edge.WindDelta === 0 ? 1 : edge.WindDelta);
      }
      else
      {
        //prev edge is 'increasing' WindCount (WC) away from zero
        //so we're inside the previous polygon ...
        if (edge.WindDelta === 0)
          edge.WindCnt = (e.WindCnt < 0 ? e.WindCnt - 1 : e.WindCnt + 1);
        else if (e.WindDelta * edge.WindDelta < 0)
          edge.WindCnt = e.WindCnt;
        else
          edge.WindCnt = e.WindCnt + edge.WindDelta;
      }
      edge.WindCnt2 = e.WindCnt2;
      e = e.NextInAEL;
      //ie get ready to calc WindCnt2
    }
    //update WindCnt2 ...
    if (this.IsEvenOddAltFillType(edge))
    {
      //EvenOdd filling ...
      while (e != edge)
      {
        if (e.WindDelta !== 0)
          edge.WindCnt2 = (edge.WindCnt2 === 0 ? 1 : 0);
        e = e.NextInAEL;
      }
    }
    else
    {
      //nonZero, Positive or Negative filling ...
      while (e != edge)
      {
        edge.WindCnt2 += e.WindDelta;
        e = e.NextInAEL;
      }
    }
  };
  ClipperLib.Clipper.prototype.AddEdgeToSEL = function (edge)
  {
    //SEL pointers in PEdge are reused to build a list of horizontal edges.
    //However, we don't need to worry about order with horizontal edge processing.
    if (this.m_SortedEdges === null)
    {
      this.m_SortedEdges = edge;
      edge.PrevInSEL = null;
      edge.NextInSEL = null;
    }
    else
    {
      edge.NextInSEL = this.m_SortedEdges;
      edge.PrevInSEL = null;
      this.m_SortedEdges.PrevInSEL = edge;
      this.m_SortedEdges = edge;
    }
  };
  ClipperLib.Clipper.prototype.CopyAELToSEL = function ()
  {
    var e = this.m_ActiveEdges;
    this.m_SortedEdges = e;
    while (e !== null)
    {
      e.PrevInSEL = e.PrevInAEL;
      e.NextInSEL = e.NextInAEL;
      e = e.NextInAEL;
    }
  };
  ClipperLib.Clipper.prototype.SwapPositionsInAEL = function (edge1, edge2)
  {
    //check that one or other edge hasn't already been removed from AEL ...
    if (edge1.NextInAEL == edge1.PrevInAEL || edge2.NextInAEL == edge2.PrevInAEL)
      return;
    if (edge1.NextInAEL == edge2)
    {
      var next = edge2.NextInAEL;
      if (next !== null)
        next.PrevInAEL = edge1;
      var prev = edge1.PrevInAEL;
      if (prev !== null)
        prev.NextInAEL = edge2;
      edge2.PrevInAEL = prev;
      edge2.NextInAEL = edge1;
      edge1.PrevInAEL = edge2;
      edge1.NextInAEL = next;
    }
    else if (edge2.NextInAEL == edge1)
    {
      var next = edge1.NextInAEL;
      if (next !== null)
        next.PrevInAEL = edge2;
      var prev = edge2.PrevInAEL;
      if (prev !== null)
        prev.NextInAEL = edge1;
      edge1.PrevInAEL = prev;
      edge1.NextInAEL = edge2;
      edge2.PrevInAEL = edge1;
      edge2.NextInAEL = next;
    }
    else
    {
      var next = edge1.NextInAEL;
      var prev = edge1.PrevInAEL;
      edge1.NextInAEL = edge2.NextInAEL;
      if (edge1.NextInAEL !== null)
        edge1.NextInAEL.PrevInAEL = edge1;
      edge1.PrevInAEL = edge2.PrevInAEL;
      if (edge1.PrevInAEL !== null)
        edge1.PrevInAEL.NextInAEL = edge1;
      edge2.NextInAEL = next;
      if (edge2.NextInAEL !== null)
        edge2.NextInAEL.PrevInAEL = edge2;
      edge2.PrevInAEL = prev;
      if (edge2.PrevInAEL !== null)
        edge2.PrevInAEL.NextInAEL = edge2;
    }
    if (edge1.PrevInAEL === null)
      this.m_ActiveEdges = edge1;
    else if (edge2.PrevInAEL === null)
      this.m_ActiveEdges = edge2;
  };
  ClipperLib.Clipper.prototype.SwapPositionsInSEL = function (edge1, edge2)
  {
    if (edge1.NextInSEL === null && edge1.PrevInSEL === null)
      return;
    if (edge2.NextInSEL === null && edge2.PrevInSEL === null)
      return;
    if (edge1.NextInSEL == edge2)
    {
      var next = edge2.NextInSEL;
      if (next !== null)
        next.PrevInSEL = edge1;
      var prev = edge1.PrevInSEL;
      if (prev !== null)
        prev.NextInSEL = edge2;
      edge2.PrevInSEL = prev;
      edge2.NextInSEL = edge1;
      edge1.PrevInSEL = edge2;
      edge1.NextInSEL = next;
    }
    else if (edge2.NextInSEL == edge1)
    {
      var next = edge1.NextInSEL;
      if (next !== null)
        next.PrevInSEL = edge2;
      var prev = edge2.PrevInSEL;
      if (prev !== null)
        prev.NextInSEL = edge1;
      edge1.PrevInSEL = prev;
      edge1.NextInSEL = edge2;
      edge2.PrevInSEL = edge1;
      edge2.NextInSEL = next;
    }
    else
    {
      var next = edge1.NextInSEL;
      var prev = edge1.PrevInSEL;
      edge1.NextInSEL = edge2.NextInSEL;
      if (edge1.NextInSEL !== null)
        edge1.NextInSEL.PrevInSEL = edge1;
      edge1.PrevInSEL = edge2.PrevInSEL;
      if (edge1.PrevInSEL !== null)
        edge1.PrevInSEL.NextInSEL = edge1;
      edge2.NextInSEL = next;
      if (edge2.NextInSEL !== null)
        edge2.NextInSEL.PrevInSEL = edge2;
      edge2.PrevInSEL = prev;
      if (edge2.PrevInSEL !== null)
        edge2.PrevInSEL.NextInSEL = edge2;
    }
    if (edge1.PrevInSEL === null)
      this.m_SortedEdges = edge1;
    else if (edge2.PrevInSEL === null)
      this.m_SortedEdges = edge2;
  };
  ClipperLib.Clipper.prototype.AddLocalMaxPoly = function (e1, e2, pt)
  {
    this.AddOutPt(e1, pt);
    if (e2.WindDelta == 0) this.AddOutPt(e2, pt);
    if (e1.OutIdx == e2.OutIdx)
    {
      e1.OutIdx = -1;
      e2.OutIdx = -1;
    }
    else if (e1.OutIdx < e2.OutIdx)
      this.AppendPolygon(e1, e2);
    else
      this.AppendPolygon(e2, e1);
  };
  ClipperLib.Clipper.prototype.AddLocalMinPoly = function (e1, e2, pt)
  {
    var result;
    var e, prevE;
    if (ClipperLib.ClipperBase.IsHorizontal(e2) || (e1.Dx > e2.Dx))
    {
      result = this.AddOutPt(e1, pt);
      e2.OutIdx = e1.OutIdx;
      e1.Side = ClipperLib.EdgeSide.esLeft;
      e2.Side = ClipperLib.EdgeSide.esRight;
      e = e1;
      if (e.PrevInAEL == e2)
        prevE = e2.PrevInAEL;
      else
        prevE = e.PrevInAEL;
    }
    else
    {
      result = this.AddOutPt(e2, pt);
      e1.OutIdx = e2.OutIdx;
      e1.Side = ClipperLib.EdgeSide.esRight;
      e2.Side = ClipperLib.EdgeSide.esLeft;
      e = e2;
      if (e.PrevInAEL == e1)
        prevE = e1.PrevInAEL;
      else
        prevE = e.PrevInAEL;
    }
    if (prevE !== null && prevE.OutIdx >= 0 && (ClipperLib.Clipper.TopX(prevE, pt.Y) == ClipperLib.Clipper.TopX(e, pt.Y)) && ClipperLib.ClipperBase.SlopesEqual(e, prevE, this.m_UseFullRange) && (e.WindDelta !== 0) && (prevE.WindDelta !== 0))
    {
      var outPt = this.AddOutPt(prevE, pt);
      this.AddJoin(result, outPt, e.Top);
    }
    return result;
  };
  ClipperLib.Clipper.prototype.CreateOutRec = function ()
  {
    var result = new ClipperLib.OutRec();
    result.Idx = -1;
    result.IsHole = false;
    result.IsOpen = false;
    result.FirstLeft = null;
    result.Pts = null;
    result.BottomPt = null;
    result.PolyNode = null;
    this.m_PolyOuts.push(result);
    result.Idx = this.m_PolyOuts.length - 1;
    return result;
  };
  ClipperLib.Clipper.prototype.AddOutPt = function (e, pt)
  {
    var ToFront = (e.Side == ClipperLib.EdgeSide.esLeft);
    if (e.OutIdx < 0)
    {
      var outRec = this.CreateOutRec();
      outRec.IsOpen = (e.WindDelta === 0);
      var newOp = new ClipperLib.OutPt();
      outRec.Pts = newOp;
      newOp.Idx = outRec.Idx;
      //newOp.Pt = pt;
      newOp.Pt.X = pt.X;
      newOp.Pt.Y = pt.Y;
      newOp.Next = newOp;
      newOp.Prev = newOp;
      if (!outRec.IsOpen)
        this.SetHoleState(e, outRec);
      e.OutIdx = outRec.Idx;
      //nb: do this after SetZ !
      return newOp;
    }
    else
    {
      var outRec = this.m_PolyOuts[e.OutIdx];
      //OutRec.Pts is the 'Left-most' point & OutRec.Pts.Prev is the 'Right-most'
      var op = outRec.Pts;
      if (ToFront && ClipperLib.IntPoint.op_Equality(pt, op.Pt))
        return op;
      else if (!ToFront && ClipperLib.IntPoint.op_Equality(pt, op.Prev.Pt))
        return op.Prev;
      var newOp = new ClipperLib.OutPt();
      newOp.Idx = outRec.Idx;
      //newOp.Pt = pt;
      newOp.Pt.X = pt.X;
      newOp.Pt.Y = pt.Y;
      newOp.Next = op;
      newOp.Prev = op.Prev;
      newOp.Prev.Next = newOp;
      op.Prev = newOp;
      if (ToFront)
        outRec.Pts = newOp;
      return newOp;
    }
  };
  ClipperLib.Clipper.prototype.SwapPoints = function (pt1, pt2)
  {
    var tmp = new ClipperLib.IntPoint(pt1.Value);
    //pt1.Value = pt2.Value;
    pt1.Value.X = pt2.Value.X;
    pt1.Value.Y = pt2.Value.Y;
    //pt2.Value = tmp;
    pt2.Value.X = tmp.X;
    pt2.Value.Y = tmp.Y;
  };
  ClipperLib.Clipper.prototype.HorzSegmentsOverlap = function (seg1a, seg1b, seg2a, seg2b)
	{
		var tmp;
		if (seg1a > seg1b)
		{
			tmp = seg1a;
			seg1a = seg1b;
			seg1b = tmp;
		}
		if (seg2a > seg2b)
		{
			tmp = seg2a;
			seg2a = seg2b;
			seg2b = tmp;
		}
		return (seg1a < seg2b) && (seg2a < seg1b);
	}

  ClipperLib.Clipper.prototype.SetHoleState = function (e, outRec)
  {
    var isHole = false;
    var e2 = e.PrevInAEL;
    while (e2 !== null)
    {
      if (e2.OutIdx >= 0 && e2.WindDelta != 0)
      {
        isHole = !isHole;
        if (outRec.FirstLeft === null)
          outRec.FirstLeft = this.m_PolyOuts[e2.OutIdx];
      }
      e2 = e2.PrevInAEL;
    }
    if (isHole)
      outRec.IsHole = true;
  };
  ClipperLib.Clipper.prototype.GetDx = function (pt1, pt2)
  {
    if (pt1.Y == pt2.Y)
      return ClipperLib.ClipperBase.horizontal;
    else
      return (pt2.X - pt1.X) / (pt2.Y - pt1.Y);
  };
  ClipperLib.Clipper.prototype.FirstIsBottomPt = function (btmPt1, btmPt2)
  {
    var p = btmPt1.Prev;
    while ((ClipperLib.IntPoint.op_Equality(p.Pt, btmPt1.Pt)) && (p != btmPt1))
      p = p.Prev;
    var dx1p = Math.abs(this.GetDx(btmPt1.Pt, p.Pt));
    p = btmPt1.Next;
    while ((ClipperLib.IntPoint.op_Equality(p.Pt, btmPt1.Pt)) && (p != btmPt1))
      p = p.Next;
    var dx1n = Math.abs(this.GetDx(btmPt1.Pt, p.Pt));
    p = btmPt2.Prev;
    while ((ClipperLib.IntPoint.op_Equality(p.Pt, btmPt2.Pt)) && (p != btmPt2))
      p = p.Prev;
    var dx2p = Math.abs(this.GetDx(btmPt2.Pt, p.Pt));
    p = btmPt2.Next;
    while ((ClipperLib.IntPoint.op_Equality(p.Pt, btmPt2.Pt)) && (p != btmPt2))
      p = p.Next;
    var dx2n = Math.abs(this.GetDx(btmPt2.Pt, p.Pt));
    return (dx1p >= dx2p && dx1p >= dx2n) || (dx1n >= dx2p && dx1n >= dx2n);
  };
  ClipperLib.Clipper.prototype.GetBottomPt = function (pp)
  {
    var dups = null;
    var p = pp.Next;
    while (p != pp)
    {
      if (p.Pt.Y > pp.Pt.Y)
      {
        pp = p;
        dups = null;
      }
      else if (p.Pt.Y == pp.Pt.Y && p.Pt.X <= pp.Pt.X)
      {
        if (p.Pt.X < pp.Pt.X)
        {
          dups = null;
          pp = p;
        }
        else
        {
          if (p.Next != pp && p.Prev != pp)
            dups = p;
        }
      }
      p = p.Next;
    }
    if (dups !== null)
    {
      //there appears to be at least 2 vertices at bottomPt so ...
      while (dups != p)
      {
        if (!this.FirstIsBottomPt(p, dups))
          pp = dups;
        dups = dups.Next;
        while (ClipperLib.IntPoint.op_Inequality(dups.Pt, pp.Pt))
          dups = dups.Next;
      }
    }
    return pp;
  };
  ClipperLib.Clipper.prototype.GetLowermostRec = function (outRec1, outRec2)
  {
    //work out which polygon fragment has the correct hole state ...
    if (outRec1.BottomPt === null)
      outRec1.BottomPt = this.GetBottomPt(outRec1.Pts);
    if (outRec2.BottomPt === null)
      outRec2.BottomPt = this.GetBottomPt(outRec2.Pts);
    var bPt1 = outRec1.BottomPt;
    var bPt2 = outRec2.BottomPt;
    if (bPt1.Pt.Y > bPt2.Pt.Y)
      return outRec1;
    else if (bPt1.Pt.Y < bPt2.Pt.Y)
      return outRec2;
    else if (bPt1.Pt.X < bPt2.Pt.X)
      return outRec1;
    else if (bPt1.Pt.X > bPt2.Pt.X)
      return outRec2;
    else if (bPt1.Next == bPt1)
      return outRec2;
    else if (bPt2.Next == bPt2)
      return outRec1;
    else if (this.FirstIsBottomPt(bPt1, bPt2))
      return outRec1;
    else
      return outRec2;
  };
  ClipperLib.Clipper.prototype.Param1RightOfParam2 = function (outRec1, outRec2)
  {
    do {
      outRec1 = outRec1.FirstLeft;
      if (outRec1 == outRec2)
        return true;
    }
    while (outRec1 !== null)
    return false;
  };
  ClipperLib.Clipper.prototype.GetOutRec = function (idx)
  {
    var outrec = this.m_PolyOuts[idx];
    while (outrec != this.m_PolyOuts[outrec.Idx])
      outrec = this.m_PolyOuts[outrec.Idx];
    return outrec;
  };
  ClipperLib.Clipper.prototype.AppendPolygon = function (e1, e2)
  {
    //get the start and ends of both output polygons ...
    var outRec1 = this.m_PolyOuts[e1.OutIdx];
    var outRec2 = this.m_PolyOuts[e2.OutIdx];
    var holeStateRec;
    if (this.Param1RightOfParam2(outRec1, outRec2))
      holeStateRec = outRec2;
    else if (this.Param1RightOfParam2(outRec2, outRec1))
      holeStateRec = outRec1;
    else
      holeStateRec = this.GetLowermostRec(outRec1, outRec2);
    var p1_lft = outRec1.Pts;
    var p1_rt = p1_lft.Prev;
    var p2_lft = outRec2.Pts;
    var p2_rt = p2_lft.Prev;
    var side;
    //join e2 poly onto e1 poly and delete pointers to e2 ...
    if (e1.Side == ClipperLib.EdgeSide.esLeft)
    {
      if (e2.Side == ClipperLib.EdgeSide.esLeft)
      {
        //z y x a b c
        this.ReversePolyPtLinks(p2_lft);
        p2_lft.Next = p1_lft;
        p1_lft.Prev = p2_lft;
        p1_rt.Next = p2_rt;
        p2_rt.Prev = p1_rt;
        outRec1.Pts = p2_rt;
      }
      else
      {
        //x y z a b c
        p2_rt.Next = p1_lft;
        p1_lft.Prev = p2_rt;
        p2_lft.Prev = p1_rt;
        p1_rt.Next = p2_lft;
        outRec1.Pts = p2_lft;
      }
      side = ClipperLib.EdgeSide.esLeft;
    }
    else
    {
      if (e2.Side == ClipperLib.EdgeSide.esRight)
      {
        //a b c z y x
        this.ReversePolyPtLinks(p2_lft);
        p1_rt.Next = p2_rt;
        p2_rt.Prev = p1_rt;
        p2_lft.Next = p1_lft;
        p1_lft.Prev = p2_lft;
      }
      else
      {
        //a b c x y z
        p1_rt.Next = p2_lft;
        p2_lft.Prev = p1_rt;
        p1_lft.Prev = p2_rt;
        p2_rt.Next = p1_lft;
      }
      side = ClipperLib.EdgeSide.esRight;
    }
    outRec1.BottomPt = null;
    if (holeStateRec == outRec2)
    {
      if (outRec2.FirstLeft != outRec1)
        outRec1.FirstLeft = outRec2.FirstLeft;
      outRec1.IsHole = outRec2.IsHole;
    }
    outRec2.Pts = null;
    outRec2.BottomPt = null;
    outRec2.FirstLeft = outRec1;
    var OKIdx = e1.OutIdx;
    var ObsoleteIdx = e2.OutIdx;
    e1.OutIdx = -1;
    //nb: safe because we only get here via AddLocalMaxPoly
    e2.OutIdx = -1;
    var e = this.m_ActiveEdges;
    while (e !== null)
    {
      if (e.OutIdx == ObsoleteIdx)
      {
        e.OutIdx = OKIdx;
        e.Side = side;
        break;
      }
      e = e.NextInAEL;
    }
    outRec2.Idx = outRec1.Idx;
  };
  ClipperLib.Clipper.prototype.ReversePolyPtLinks = function (pp)
  {
    if (pp === null)
      return;
    var pp1;
    var pp2;
    pp1 = pp;
    do {
      pp2 = pp1.Next;
      pp1.Next = pp1.Prev;
      pp1.Prev = pp2;
      pp1 = pp2;
    }
    while (pp1 != pp)
  };
  ClipperLib.Clipper.SwapSides = function (edge1, edge2)
  {
    var side = edge1.Side;
    edge1.Side = edge2.Side;
    edge2.Side = side;
  };
  ClipperLib.Clipper.SwapPolyIndexes = function (edge1, edge2)
  {
    var outIdx = edge1.OutIdx;
    edge1.OutIdx = edge2.OutIdx;
    edge2.OutIdx = outIdx;
  };
  ClipperLib.Clipper.prototype.IntersectEdges = function (e1, e2, pt)
  {
    //e1 will be to the left of e2 BELOW the intersection. Therefore e1 is before
    //e2 in AEL except when e1 is being inserted at the intersection point ...
    var e1Contributing = (e1.OutIdx >= 0);
    var e2Contributing = (e2.OutIdx >= 0);

    if (use_xyz)
    	this.SetZ(pt, e1, e2);

    if (use_lines)
    {
      //if either edge is on an OPEN path ...
      if (e1.WindDelta === 0 || e2.WindDelta === 0)
      {
        //ignore subject-subject open path intersections UNLESS they
        //are both open paths, AND they are both 'contributing maximas' ...
				if (e1.WindDelta == 0 && e2.WindDelta == 0) return;
        //if intersecting a subj line with a subj poly ...
        else if (e1.PolyTyp == e2.PolyTyp &&
          e1.WindDelta != e2.WindDelta && this.m_ClipType == ClipperLib.ClipType.ctUnion)
        {
          if (e1.WindDelta === 0)
          {
            if (e2Contributing)
            {
              this.AddOutPt(e1, pt);
              if (e1Contributing)
                e1.OutIdx = -1;
            }
          }
          else
          {
            if (e1Contributing)
            {
              this.AddOutPt(e2, pt);
              if (e2Contributing)
                e2.OutIdx = -1;
            }
          }
        }
        else if (e1.PolyTyp != e2.PolyTyp)
        {
          if ((e1.WindDelta === 0) && Math.abs(e2.WindCnt) == 1 &&
            (this.m_ClipType != ClipperLib.ClipType.ctUnion || e2.WindCnt2 === 0))
          {
            this.AddOutPt(e1, pt);
            if (e1Contributing)
              e1.OutIdx = -1;
          }
          else if ((e2.WindDelta === 0) && (Math.abs(e1.WindCnt) == 1) &&
            (this.m_ClipType != ClipperLib.ClipType.ctUnion || e1.WindCnt2 === 0))
          {
            this.AddOutPt(e2, pt);
            if (e2Contributing)
              e2.OutIdx = -1;
          }
        }
        return;
      }
    }
    //update winding counts...
    //assumes that e1 will be to the Right of e2 ABOVE the intersection
    if (e1.PolyTyp == e2.PolyTyp)
    {
      if (this.IsEvenOddFillType(e1))
      {
        var oldE1WindCnt = e1.WindCnt;
        e1.WindCnt = e2.WindCnt;
        e2.WindCnt = oldE1WindCnt;
      }
      else
      {
        if (e1.WindCnt + e2.WindDelta === 0)
          e1.WindCnt = -e1.WindCnt;
        else
          e1.WindCnt += e2.WindDelta;
        if (e2.WindCnt - e1.WindDelta === 0)
          e2.WindCnt = -e2.WindCnt;
        else
          e2.WindCnt -= e1.WindDelta;
      }
    }
    else
    {
      if (!this.IsEvenOddFillType(e2))
        e1.WindCnt2 += e2.WindDelta;
      else
        e1.WindCnt2 = (e1.WindCnt2 === 0) ? 1 : 0;
      if (!this.IsEvenOddFillType(e1))
        e2.WindCnt2 -= e1.WindDelta;
      else
        e2.WindCnt2 = (e2.WindCnt2 === 0) ? 1 : 0;
    }
    var e1FillType, e2FillType, e1FillType2, e2FillType2;
    if (e1.PolyTyp == ClipperLib.PolyType.ptSubject)
    {
      e1FillType = this.m_SubjFillType;
      e1FillType2 = this.m_ClipFillType;
    }
    else
    {
      e1FillType = this.m_ClipFillType;
      e1FillType2 = this.m_SubjFillType;
    }
    if (e2.PolyTyp == ClipperLib.PolyType.ptSubject)
    {
      e2FillType = this.m_SubjFillType;
      e2FillType2 = this.m_ClipFillType;
    }
    else
    {
      e2FillType = this.m_ClipFillType;
      e2FillType2 = this.m_SubjFillType;
    }
    var e1Wc, e2Wc;
    switch (e1FillType)
    {
    case ClipperLib.PolyFillType.pftPositive:
      e1Wc = e1.WindCnt;
      break;
    case ClipperLib.PolyFillType.pftNegative:
      e1Wc = -e1.WindCnt;
      break;
    default:
      e1Wc = Math.abs(e1.WindCnt);
      break;
    }
    switch (e2FillType)
    {
    case ClipperLib.PolyFillType.pftPositive:
      e2Wc = e2.WindCnt;
      break;
    case ClipperLib.PolyFillType.pftNegative:
      e2Wc = -e2.WindCnt;
      break;
    default:
      e2Wc = Math.abs(e2.WindCnt);
      break;
    }
    if (e1Contributing && e2Contributing)
    {
			if ((e1Wc != 0 && e1Wc != 1) || (e2Wc != 0 && e2Wc != 1) ||
			(e1.PolyTyp != e2.PolyTyp && this.m_ClipType != ClipperLib.ClipType.ctXor))
			{
				this.AddLocalMaxPoly(e1, e2, pt);
			}
      else
      {
        this.AddOutPt(e1, pt);
        this.AddOutPt(e2, pt);
        ClipperLib.Clipper.SwapSides(e1, e2);
        ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
      }
    }
    else if (e1Contributing)
    {
      if (e2Wc === 0 || e2Wc == 1)
      {
        this.AddOutPt(e1, pt);
        ClipperLib.Clipper.SwapSides(e1, e2);
        ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
      }
    }
    else if (e2Contributing)
    {
      if (e1Wc === 0 || e1Wc == 1)
      {
        this.AddOutPt(e2, pt);
        ClipperLib.Clipper.SwapSides(e1, e2);
        ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
      }
    }
		else if ( (e1Wc == 0 || e1Wc == 1) && (e2Wc == 0 || e2Wc == 1))
    {
      //neither edge is currently contributing ...
      var e1Wc2, e2Wc2;
      switch (e1FillType2)
      {
      case ClipperLib.PolyFillType.pftPositive:
        e1Wc2 = e1.WindCnt2;
        break;
      case ClipperLib.PolyFillType.pftNegative:
        e1Wc2 = -e1.WindCnt2;
        break;
      default:
        e1Wc2 = Math.abs(e1.WindCnt2);
        break;
      }
      switch (e2FillType2)
      {
      case ClipperLib.PolyFillType.pftPositive:
        e2Wc2 = e2.WindCnt2;
        break;
      case ClipperLib.PolyFillType.pftNegative:
        e2Wc2 = -e2.WindCnt2;
        break;
      default:
        e2Wc2 = Math.abs(e2.WindCnt2);
        break;
      }
      if (e1.PolyTyp != e2.PolyTyp)
      {
        this.AddLocalMinPoly(e1, e2, pt);
      }
      else if (e1Wc == 1 && e2Wc == 1)
        switch (this.m_ClipType)
        {
        case ClipperLib.ClipType.ctIntersection:
          if (e1Wc2 > 0 && e2Wc2 > 0)
            this.AddLocalMinPoly(e1, e2, pt);
          break;
        case ClipperLib.ClipType.ctUnion:
          if (e1Wc2 <= 0 && e2Wc2 <= 0)
            this.AddLocalMinPoly(e1, e2, pt);
          break;
        case ClipperLib.ClipType.ctDifference:
          if (((e1.PolyTyp == ClipperLib.PolyType.ptClip) && (e1Wc2 > 0) && (e2Wc2 > 0)) ||
            ((e1.PolyTyp == ClipperLib.PolyType.ptSubject) && (e1Wc2 <= 0) && (e2Wc2 <= 0)))
            this.AddLocalMinPoly(e1, e2, pt);
          break;
        case ClipperLib.ClipType.ctXor:
          this.AddLocalMinPoly(e1, e2, pt);
          break;
        }
      else
        ClipperLib.Clipper.SwapSides(e1, e2);
    }
  };
  ClipperLib.Clipper.prototype.DeleteFromAEL = function (e)
  {
    var AelPrev = e.PrevInAEL;
    var AelNext = e.NextInAEL;
    if (AelPrev === null && AelNext === null && (e != this.m_ActiveEdges))
      return;
    //already deleted
    if (AelPrev !== null)
      AelPrev.NextInAEL = AelNext;
    else
      this.m_ActiveEdges = AelNext;
    if (AelNext !== null)
      AelNext.PrevInAEL = AelPrev;
    e.NextInAEL = null;
    e.PrevInAEL = null;
  };
  ClipperLib.Clipper.prototype.DeleteFromSEL = function (e)
  {
    var SelPrev = e.PrevInSEL;
    var SelNext = e.NextInSEL;
    if (SelPrev === null && SelNext === null && (e != this.m_SortedEdges))
      return;
    //already deleted
    if (SelPrev !== null)
      SelPrev.NextInSEL = SelNext;
    else
      this.m_SortedEdges = SelNext;
    if (SelNext !== null)
      SelNext.PrevInSEL = SelPrev;
    e.NextInSEL = null;
    e.PrevInSEL = null;
  };
  ClipperLib.Clipper.prototype.UpdateEdgeIntoAEL = function (e)
  {
    if (e.NextInLML === null)
      ClipperLib.Error("UpdateEdgeIntoAEL: invalid call");
    var AelPrev = e.PrevInAEL;
    var AelNext = e.NextInAEL;
    e.NextInLML.OutIdx = e.OutIdx;
    if (AelPrev !== null)
      AelPrev.NextInAEL = e.NextInLML;
    else
      this.m_ActiveEdges = e.NextInLML;
    if (AelNext !== null)
      AelNext.PrevInAEL = e.NextInLML;
    e.NextInLML.Side = e.Side;
    e.NextInLML.WindDelta = e.WindDelta;
    e.NextInLML.WindCnt = e.WindCnt;
    e.NextInLML.WindCnt2 = e.WindCnt2;
    e = e.NextInLML;
    //    e.Curr = e.Bot;
    e.Curr.X = e.Bot.X;
    e.Curr.Y = e.Bot.Y;
    e.PrevInAEL = AelPrev;
    e.NextInAEL = AelNext;
    if (!ClipperLib.ClipperBase.IsHorizontal(e))
      this.InsertScanbeam(e.Top.Y);
    return e;
  };
  ClipperLib.Clipper.prototype.ProcessHorizontals = function (isTopOfScanbeam)
  {
    var horzEdge = this.m_SortedEdges;
    while (horzEdge !== null)
    {
      this.DeleteFromSEL(horzEdge);
      this.ProcessHorizontal(horzEdge, isTopOfScanbeam);
      horzEdge = this.m_SortedEdges;
    }
  };
  ClipperLib.Clipper.prototype.GetHorzDirection = function (HorzEdge, $var)
  {
    if (HorzEdge.Bot.X < HorzEdge.Top.X)
    {
        $var.Left = HorzEdge.Bot.X;
        $var.Right = HorzEdge.Top.X;
        $var.Dir = ClipperLib.Direction.dLeftToRight;
    }
    else
    {
        $var.Left = HorzEdge.Top.X;
        $var.Right = HorzEdge.Bot.X;
        $var.Dir = ClipperLib.Direction.dRightToLeft;
    }
  };
  ClipperLib.Clipper.prototype.ProcessHorizontal = function (horzEdge, isTopOfScanbeam)
  {
    var $var = {Dir: null, Left: null, Right: null};
    this.GetHorzDirection(horzEdge, $var);
    var dir = $var.Dir;
    var horzLeft = $var.Left;
    var horzRight = $var.Right;

    var eLastHorz = horzEdge,
      eMaxPair = null;
    while (eLastHorz.NextInLML !== null && ClipperLib.ClipperBase.IsHorizontal(eLastHorz.NextInLML))
      eLastHorz = eLastHorz.NextInLML;
    if (eLastHorz.NextInLML === null)
      eMaxPair = this.GetMaximaPair(eLastHorz);
    for (;;)
    {
      var IsLastHorz = (horzEdge == eLastHorz);
      var e = this.GetNextInAEL(horzEdge, dir);
      while (e !== null)
      {
        //Break if we've got to the end of an intermediate horizontal edge ...
        //nb: Smaller Dx's are to the right of larger Dx's ABOVE the horizontal.
        if (e.Curr.X == horzEdge.Top.X && horzEdge.NextInLML !== null && e.Dx < horzEdge.NextInLML.Dx)
          break;
        var eNext = this.GetNextInAEL(e, dir);
        //saves eNext for later
        if ((dir == ClipperLib.Direction.dLeftToRight && e.Curr.X <= horzRight) || (dir == ClipperLib.Direction.dRightToLeft && e.Curr.X >= horzLeft))
        {
          //so far we're still in range of the horizontal Edge  but make sure
          //we're at the last of consec. horizontals when matching with eMaxPair
          if (e == eMaxPair && IsLastHorz)
          {
						if (horzEdge.OutIdx >= 0)
						{
							var op1 = this.AddOutPt(horzEdge, horzEdge.Top);
							var eNextHorz = this.m_SortedEdges;
							while (eNextHorz !== null)
							{
								if (eNextHorz.OutIdx >= 0 &&
									this.HorzSegmentsOverlap(horzEdge.Bot.X,
									horzEdge.Top.X, eNextHorz.Bot.X, eNextHorz.Top.X))
								{
									var op2 = this.AddOutPt(eNextHorz, eNextHorz.Bot);
									this.AddJoin(op2, op1, eNextHorz.Top);
								}
								eNextHorz = eNextHorz.NextInSEL;
							}
							this.AddGhostJoin(op1, horzEdge.Bot);
							this.AddLocalMaxPoly(horzEdge, eMaxPair, horzEdge.Top);
						}
						this.DeleteFromAEL(horzEdge);
						this.DeleteFromAEL(eMaxPair);
            return;
          }
          else if (dir == ClipperLib.Direction.dLeftToRight)
          {
            var Pt = new ClipperLib.IntPoint(e.Curr.X, horzEdge.Curr.Y);
            this.IntersectEdges(horzEdge, e, Pt);
          }
          else
          {
            var Pt = new ClipperLib.IntPoint(e.Curr.X, horzEdge.Curr.Y);
            this.IntersectEdges(e, horzEdge, Pt);
          }
          this.SwapPositionsInAEL(horzEdge, e);
        }
        else if ((dir == ClipperLib.Direction.dLeftToRight && e.Curr.X >= horzRight) || (dir == ClipperLib.Direction.dRightToLeft && e.Curr.X <= horzLeft))
          break;
        e = eNext;
      }
      //end while
      if (horzEdge.NextInLML !== null && ClipperLib.ClipperBase.IsHorizontal(horzEdge.NextInLML))
      {
        horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
        if (horzEdge.OutIdx >= 0)
          this.AddOutPt(horzEdge, horzEdge.Bot);

          var $var = {Dir: dir, Left: horzLeft, Right: horzRight};
          this.GetHorzDirection(horzEdge, $var);
          dir = $var.Dir;
          horzLeft = $var.Left;
          horzRight = $var.Right;
      }
      else
        break;
    }
    //end for (;;)
    if (horzEdge.NextInLML !== null)
    {
      if (horzEdge.OutIdx >= 0)
      {
        var op1 = this.AddOutPt(horzEdge, horzEdge.Top);
				if (isTopOfScanbeam) this.AddGhostJoin(op1, horzEdge.Bot);
        horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
        if (horzEdge.WindDelta === 0)
          return;
        //nb: HorzEdge is no longer horizontal here
        var ePrev = horzEdge.PrevInAEL;
        var eNext = horzEdge.NextInAEL;
        if (ePrev !== null && ePrev.Curr.X == horzEdge.Bot.X &&
          ePrev.Curr.Y == horzEdge.Bot.Y && ePrev.WindDelta !== 0 &&
          (ePrev.OutIdx >= 0 && ePrev.Curr.Y > ePrev.Top.Y &&
            ClipperLib.ClipperBase.SlopesEqual(horzEdge, ePrev, this.m_UseFullRange)))
        {
          var op2 = this.AddOutPt(ePrev, horzEdge.Bot);
          this.AddJoin(op1, op2, horzEdge.Top);
        }
        else if (eNext !== null && eNext.Curr.X == horzEdge.Bot.X &&
          eNext.Curr.Y == horzEdge.Bot.Y && eNext.WindDelta !== 0 &&
          eNext.OutIdx >= 0 && eNext.Curr.Y > eNext.Top.Y &&
          ClipperLib.ClipperBase.SlopesEqual(horzEdge, eNext, this.m_UseFullRange))
        {
          var op2 = this.AddOutPt(eNext, horzEdge.Bot);
          this.AddJoin(op1, op2, horzEdge.Top);
        }
      }
      else horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
    }
  	else
    {
      if (horzEdge.OutIdx >= 0)
        this.AddOutPt(horzEdge, horzEdge.Top);
      this.DeleteFromAEL(horzEdge);
    }
  };
  ClipperLib.Clipper.prototype.GetNextInAEL = function (e, Direction)
  {
    return Direction == ClipperLib.Direction.dLeftToRight ? e.NextInAEL : e.PrevInAEL;
  };
  ClipperLib.Clipper.prototype.IsMinima = function (e)
  {
    return e !== null && (e.Prev.NextInLML != e) && (e.Next.NextInLML != e);
  };
  ClipperLib.Clipper.prototype.IsMaxima = function (e, Y)
  {
    return (e !== null && e.Top.Y == Y && e.NextInLML === null);
  };
  ClipperLib.Clipper.prototype.IsIntermediate = function (e, Y)
  {
    return (e.Top.Y == Y && e.NextInLML !== null);
  };
  ClipperLib.Clipper.prototype.GetMaximaPair = function (e)
  {
    var result = null;
    if ((ClipperLib.IntPoint.op_Equality(e.Next.Top, e.Top)) && e.Next.NextInLML === null)
      result = e.Next;
    else if ((ClipperLib.IntPoint.op_Equality(e.Prev.Top, e.Top)) && e.Prev.NextInLML === null)
      result = e.Prev;
    if (result !== null && (result.OutIdx == -2 || (result.NextInAEL == result.PrevInAEL && !ClipperLib.ClipperBase.IsHorizontal(result))))
      return null;
    return result;
  };

  ClipperLib.Clipper.prototype.ProcessIntersections = function (topY)
  {
    if (this.m_ActiveEdges == null)
      return true;
    try
    {
      this.BuildIntersectList(topY);
      if (this.m_IntersectList.length == 0)
        return true;
      if (this.m_IntersectList.length == 1 || this.FixupIntersectionOrder())
        this.ProcessIntersectList();
      else
        return false;
    }
    catch ($$e2)
    {
      this.m_SortedEdges = null;
      this.m_IntersectList.length = 0;
      ClipperLib.Error("ProcessIntersections error");
    }
    this.m_SortedEdges = null;
    return true;
  };
  ClipperLib.Clipper.prototype.BuildIntersectList = function (topY)
  {
    if (this.m_ActiveEdges === null)
      return;
    //prepare for sorting ...
    var e = this.m_ActiveEdges;
    //console.log(JSON.stringify(JSON.decycle( e )));
    this.m_SortedEdges = e;
    while (e !== null)
    {
      e.PrevInSEL = e.PrevInAEL;
      e.NextInSEL = e.NextInAEL;
      e.Curr.X = ClipperLib.Clipper.TopX(e, topY);
      e = e.NextInAEL;
    }
    //bubblesort ...
    var isModified = true;
    while (isModified && this.m_SortedEdges !== null)
    {
      isModified = false;
      e = this.m_SortedEdges;
      while (e.NextInSEL !== null)
      {
        var eNext = e.NextInSEL;
        var pt = new ClipperLib.IntPoint();
        //console.log("e.Curr.X: " + e.Curr.X + " eNext.Curr.X" + eNext.Curr.X);
        if (e.Curr.X > eNext.Curr.X)
        {
					this.IntersectPoint(e, eNext, pt);
          var newNode = new ClipperLib.IntersectNode();
          newNode.Edge1 = e;
          newNode.Edge2 = eNext;
          //newNode.Pt = pt;
          newNode.Pt.X = pt.X;
          newNode.Pt.Y = pt.Y;
          this.m_IntersectList.push(newNode);
          this.SwapPositionsInSEL(e, eNext);
          isModified = true;
        }
        else
          e = eNext;
      }
      if (e.PrevInSEL !== null)
        e.PrevInSEL.NextInSEL = null;
      else
        break;
    }
    this.m_SortedEdges = null;
  };
  ClipperLib.Clipper.prototype.EdgesAdjacent = function (inode)
  {
    return (inode.Edge1.NextInSEL == inode.Edge2) || (inode.Edge1.PrevInSEL == inode.Edge2);
  };
  ClipperLib.Clipper.IntersectNodeSort = function (node1, node2)
  {
    //the following typecast is safe because the differences in Pt.Y will
    //be limited to the height of the scanbeam.
    return (node2.Pt.Y - node1.Pt.Y);
  };
  ClipperLib.Clipper.prototype.FixupIntersectionOrder = function ()
  {
    //pre-condition: intersections are sorted bottom-most first.
    //Now it's crucial that intersections are made only between adjacent edges,
    //so to ensure this the order of intersections may need adjusting ...
    this.m_IntersectList.sort(this.m_IntersectNodeComparer);
    this.CopyAELToSEL();
    var cnt = this.m_IntersectList.length;
    for (var i = 0; i < cnt; i++)
    {
      if (!this.EdgesAdjacent(this.m_IntersectList[i]))
      {
        var j = i + 1;
        while (j < cnt && !this.EdgesAdjacent(this.m_IntersectList[j]))
          j++;
        if (j == cnt)
          return false;
        var tmp = this.m_IntersectList[i];
        this.m_IntersectList[i] = this.m_IntersectList[j];
        this.m_IntersectList[j] = tmp;
      }
      this.SwapPositionsInSEL(this.m_IntersectList[i].Edge1, this.m_IntersectList[i].Edge2);
    }
    return true;
  };
  ClipperLib.Clipper.prototype.ProcessIntersectList = function ()
  {
    for (var i = 0, ilen = this.m_IntersectList.length; i < ilen; i++)
    {
      var iNode = this.m_IntersectList[i];
      this.IntersectEdges(iNode.Edge1, iNode.Edge2, iNode.Pt);
      this.SwapPositionsInAEL(iNode.Edge1, iNode.Edge2);
    }
    this.m_IntersectList.length = 0;
  };
  /*
  --------------------------------
  Round speedtest: http://jsperf.com/fastest-round
  --------------------------------
  */
  var R1 = function (a)
  {
    return a < 0 ? Math.ceil(a - 0.5) : Math.round(a)
  };
  var R2 = function (a)
  {
    return a < 0 ? Math.ceil(a - 0.5) : Math.floor(a + 0.5)
  };
  var R3 = function (a)
  {
    return a < 0 ? -Math.round(Math.abs(a)) : Math.round(a)
  };
  var R4 = function (a)
  {
    if (a < 0)
    {
      a -= 0.5;
      return a < -2147483648 ? Math.ceil(a) : a | 0;
    }
    else
    {
      a += 0.5;
      return a > 2147483647 ? Math.floor(a) : a | 0;
    }
  };
  if (browser.msie) ClipperLib.Clipper.Round = R1;
  else if (browser.chromium) ClipperLib.Clipper.Round = R3;
  else if (browser.safari) ClipperLib.Clipper.Round = R4;
  else ClipperLib.Clipper.Round = R2; // eg. browser.chrome || browser.firefox || browser.opera
  ClipperLib.Clipper.TopX = function (edge, currentY)
  {
    //if (edge.Bot == edge.Curr) alert ("edge.Bot = edge.Curr");
    //if (edge.Bot == edge.Top) alert ("edge.Bot = edge.Top");
    if (currentY == edge.Top.Y)
      return edge.Top.X;
    return edge.Bot.X + ClipperLib.Clipper.Round(edge.Dx * (currentY - edge.Bot.Y));
  };
  ClipperLib.Clipper.prototype.IntersectPoint = function (edge1, edge2, ip)
  {
    ip.X = 0;
    ip.Y = 0;
    var b1, b2;
    //nb: with very large coordinate values, it's possible for SlopesEqual() to
    //return false but for the edge.Dx value be equal due to double precision rounding.
    if (edge1.Dx == edge2.Dx)
		{
			ip.Y = edge1.Curr.Y;
			ip.X = ClipperLib.Clipper.TopX(edge1, ip.Y);
			return;
    }
    if (edge1.Delta.X === 0)
    {
      ip.X = edge1.Bot.X;
      if (ClipperLib.ClipperBase.IsHorizontal(edge2))
      {
        ip.Y = edge2.Bot.Y;
      }
      else
      {
        b2 = edge2.Bot.Y - (edge2.Bot.X / edge2.Dx);
        ip.Y = ClipperLib.Clipper.Round(ip.X / edge2.Dx + b2);
      }
    }
    else if (edge2.Delta.X === 0)
    {
      ip.X = edge2.Bot.X;
      if (ClipperLib.ClipperBase.IsHorizontal(edge1))
      {
        ip.Y = edge1.Bot.Y;
      }
      else
      {
        b1 = edge1.Bot.Y - (edge1.Bot.X / edge1.Dx);
        ip.Y = ClipperLib.Clipper.Round(ip.X / edge1.Dx + b1);
      }
    }
    else
    {
      b1 = edge1.Bot.X - edge1.Bot.Y * edge1.Dx;
      b2 = edge2.Bot.X - edge2.Bot.Y * edge2.Dx;
      var q = (b2 - b1) / (edge1.Dx - edge2.Dx);
      ip.Y = ClipperLib.Clipper.Round(q);
      if (Math.abs(edge1.Dx) < Math.abs(edge2.Dx))
        ip.X = ClipperLib.Clipper.Round(edge1.Dx * q + b1);
      else
        ip.X = ClipperLib.Clipper.Round(edge2.Dx * q + b2);
    }
    if (ip.Y < edge1.Top.Y || ip.Y < edge2.Top.Y)
    {
      if (edge1.Top.Y > edge2.Top.Y)
      {
        ip.Y = edge1.Top.Y;
        ip.X = ClipperLib.Clipper.TopX(edge2, edge1.Top.Y);
        return ip.X < edge1.Top.X;
      }
      else
        ip.Y = edge2.Top.Y;
      if (Math.abs(edge1.Dx) < Math.abs(edge2.Dx))
        ip.X = ClipperLib.Clipper.TopX(edge1, ip.Y);
      else
        ip.X = ClipperLib.Clipper.TopX(edge2, ip.Y);
    }
		//finally, don't allow 'ip' to be BELOW curr.Y (ie bottom of scanbeam) ...
		if (ip.Y > edge1.Curr.Y)
		{
			ip.Y = edge1.Curr.Y;
			//better to use the more vertical edge to derive X ...
			if (Math.abs(edge1.Dx) > Math.abs(edge2.Dx))
				ip.X = ClipperLib.Clipper.TopX(edge2, ip.Y);
			else
				ip.X = ClipperLib.Clipper.TopX(edge1, ip.Y);
		}
  };

  ClipperLib.Clipper.prototype.ProcessEdgesAtTopOfScanbeam = function (topY)
  {
    var e = this.m_ActiveEdges;
    while (e !== null)
    {
      //1. process maxima, treating them as if they're 'bent' horizontal edges,
      //   but exclude maxima with horizontal edges. nb: e can't be a horizontal.
      var IsMaximaEdge = this.IsMaxima(e, topY);
      if (IsMaximaEdge)
      {
        var eMaxPair = this.GetMaximaPair(e);
        IsMaximaEdge = (eMaxPair === null || !ClipperLib.ClipperBase.IsHorizontal(eMaxPair));
      }
      if (IsMaximaEdge)
      {
        var ePrev = e.PrevInAEL;
        this.DoMaxima(e);
        if (ePrev === null)
          e = this.m_ActiveEdges;
        else
          e = ePrev.NextInAEL;
      }
      else
      {
        //2. promote horizontal edges, otherwise update Curr.X and Curr.Y ...
        if (this.IsIntermediate(e, topY) && ClipperLib.ClipperBase.IsHorizontal(e.NextInLML))
        {
          e = this.UpdateEdgeIntoAEL(e);
          if (e.OutIdx >= 0)
            this.AddOutPt(e, e.Bot);
          this.AddEdgeToSEL(e);
        }
        else
        {
          e.Curr.X = ClipperLib.Clipper.TopX(e, topY);
          e.Curr.Y = topY;
        }
        if (this.StrictlySimple)
        {
          var ePrev = e.PrevInAEL;
          if ((e.OutIdx >= 0) && (e.WindDelta !== 0) && ePrev !== null &&
            (ePrev.OutIdx >= 0) && (ePrev.Curr.X == e.Curr.X) &&
            (ePrev.WindDelta !== 0))
          {
           	var ip = new ClipperLib.IntPoint(e.Curr);

						if(use_xyz)
						{
							this.SetZ(ip, ePrev, e);
						}

            var op = this.AddOutPt(ePrev, ip);
            var op2 = this.AddOutPt(e, ip);
            this.AddJoin(op, op2, ip);
            //StrictlySimple (type-3) join
          }
        }
        e = e.NextInAEL;
      }
    }
    //3. Process horizontals at the Top of the scanbeam ...
    this.ProcessHorizontals(true);
    //4. Promote intermediate vertices ...
    e = this.m_ActiveEdges;
    while (e !== null)
    {
      if (this.IsIntermediate(e, topY))
      {
        var op = null;
        if (e.OutIdx >= 0)
          op = this.AddOutPt(e, e.Top);
        e = this.UpdateEdgeIntoAEL(e);
        //if output polygons share an edge, they'll need joining later ...
        var ePrev = e.PrevInAEL;
        var eNext = e.NextInAEL;
        if (ePrev !== null && ePrev.Curr.X == e.Bot.X &&
          ePrev.Curr.Y == e.Bot.Y && op !== null &&
          ePrev.OutIdx >= 0 && ePrev.Curr.Y > ePrev.Top.Y &&
          ClipperLib.ClipperBase.SlopesEqual(e, ePrev, this.m_UseFullRange) &&
          (e.WindDelta !== 0) && (ePrev.WindDelta !== 0))
        {
          var op2 = this.AddOutPt(ePrev, e.Bot);
          this.AddJoin(op, op2, e.Top);
        }
        else if (eNext !== null && eNext.Curr.X == e.Bot.X &&
          eNext.Curr.Y == e.Bot.Y && op !== null &&
          eNext.OutIdx >= 0 && eNext.Curr.Y > eNext.Top.Y &&
          ClipperLib.ClipperBase.SlopesEqual(e, eNext, this.m_UseFullRange) &&
          (e.WindDelta !== 0) && (eNext.WindDelta !== 0))
        {
          var op2 = this.AddOutPt(eNext, e.Bot);
          this.AddJoin(op, op2, e.Top);
        }
      }
      e = e.NextInAEL;
    }
  };
  ClipperLib.Clipper.prototype.DoMaxima = function (e)
  {
    var eMaxPair = this.GetMaximaPair(e);
    if (eMaxPair === null)
    {
      if (e.OutIdx >= 0)
        this.AddOutPt(e, e.Top);
      this.DeleteFromAEL(e);
      return;
    }
    var eNext = e.NextInAEL;
    var use_lines = true;
    while (eNext !== null && eNext != eMaxPair)
    {
      this.IntersectEdges(e, eNext, e.Top);
      this.SwapPositionsInAEL(e, eNext);
      eNext = e.NextInAEL;
    }
    if (e.OutIdx == -1 && eMaxPair.OutIdx == -1)
    {
      this.DeleteFromAEL(e);
      this.DeleteFromAEL(eMaxPair);
    }
    else if (e.OutIdx >= 0 && eMaxPair.OutIdx >= 0)
    {
    	if (e.OutIdx >= 0) this.AddLocalMaxPoly(e, eMaxPair, e.Top);
      this.DeleteFromAEL(e);
      this.DeleteFromAEL(eMaxPair);
    }
    else if (use_lines && e.WindDelta === 0)
    {
      if (e.OutIdx >= 0)
      {
        this.AddOutPt(e, e.Top);
        e.OutIdx = -1;
      }
      this.DeleteFromAEL(e);
      if (eMaxPair.OutIdx >= 0)
      {
        this.AddOutPt(eMaxPair, e.Top);
        eMaxPair.OutIdx = -1;
      }
      this.DeleteFromAEL(eMaxPair);
    }
    else
      ClipperLib.Error("DoMaxima error");
  };
  ClipperLib.Clipper.ReversePaths = function (polys)
  {
    for (var i = 0, len = polys.length; i < len; i++)
      polys[i].reverse();
  };
  ClipperLib.Clipper.Orientation = function (poly)
  {
    return ClipperLib.Clipper.Area(poly) >= 0;
  };
  ClipperLib.Clipper.prototype.PointCount = function (pts)
  {
    if (pts === null)
      return 0;
    var result = 0;
    var p = pts;
    do {
      result++;
      p = p.Next;
    }
    while (p != pts)
    return result;
  };
  ClipperLib.Clipper.prototype.BuildResult = function (polyg)
  {
    ClipperLib.Clear(polyg);
    for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
    {
      var outRec = this.m_PolyOuts[i];
      if (outRec.Pts === null)
        continue;
      var p = outRec.Pts.Prev;
      var cnt = this.PointCount(p);
      if (cnt < 2)
        continue;
      var pg = new Array(cnt);
      for (var j = 0; j < cnt; j++)
      {
        pg[j] = p.Pt;
        p = p.Prev;
      }
      polyg.push(pg);
    }
  };
  ClipperLib.Clipper.prototype.BuildResult2 = function (polytree)
  {
    polytree.Clear();
    //add each output polygon/contour to polytree ...
    //polytree.m_AllPolys.set_Capacity(this.m_PolyOuts.length);
    for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
    {
      var outRec = this.m_PolyOuts[i];
      var cnt = this.PointCount(outRec.Pts);
      if ((outRec.IsOpen && cnt < 2) || (!outRec.IsOpen && cnt < 3))
        continue;
      this.FixHoleLinkage(outRec);
      var pn = new ClipperLib.PolyNode();
      polytree.m_AllPolys.push(pn);
      outRec.PolyNode = pn;
      pn.m_polygon.length = cnt;
      var op = outRec.Pts.Prev;
      for (var j = 0; j < cnt; j++)
      {
        pn.m_polygon[j] = op.Pt;
        op = op.Prev;
      }
    }
    //fixup PolyNode links etc ...
    //polytree.m_Childs.set_Capacity(this.m_PolyOuts.length);
    for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
    {
      var outRec = this.m_PolyOuts[i];
      if (outRec.PolyNode === null)
        continue;
      else if (outRec.IsOpen)
      {
        outRec.PolyNode.IsOpen = true;
        polytree.AddChild(outRec.PolyNode);
      }
      else if (outRec.FirstLeft !== null && outRec.FirstLeft.PolyNode != null)
        outRec.FirstLeft.PolyNode.AddChild(outRec.PolyNode);
      else
        polytree.AddChild(outRec.PolyNode);
    }
  };
  ClipperLib.Clipper.prototype.FixupOutPolygon = function (outRec)
  {
    //FixupOutPolygon() - removes duplicate points and simplifies consecutive
    //parallel edges by removing the middle vertex.
    var lastOK = null;
    outRec.BottomPt = null;
    var pp = outRec.Pts;
    for (;;)
    {
      if (pp.Prev == pp || pp.Prev == pp.Next)
      {
        outRec.Pts = null;
        return;
      }
      //test for duplicate points and collinear edges ...
      if ((ClipperLib.IntPoint.op_Equality(pp.Pt, pp.Next.Pt)) || (ClipperLib.IntPoint.op_Equality(pp.Pt, pp.Prev.Pt)) ||
        (ClipperLib.ClipperBase.SlopesEqual(pp.Prev.Pt, pp.Pt, pp.Next.Pt, this.m_UseFullRange) &&
          (!this.PreserveCollinear || !this.Pt2IsBetweenPt1AndPt3(pp.Prev.Pt, pp.Pt, pp.Next.Pt))))
      {
        lastOK = null;
        pp.Prev.Next = pp.Next;
        pp.Next.Prev = pp.Prev;
        pp = pp.Prev;
      }
      else if (pp == lastOK)
        break;
      else
      {
        if (lastOK === null)
          lastOK = pp;
        pp = pp.Next;
      }
    }
    outRec.Pts = pp;
  };
  ClipperLib.Clipper.prototype.DupOutPt = function (outPt, InsertAfter)
  {
    var result = new ClipperLib.OutPt();
    //result.Pt = outPt.Pt;
    result.Pt.X = outPt.Pt.X;
    result.Pt.Y = outPt.Pt.Y;
    result.Idx = outPt.Idx;
    if (InsertAfter)
    {
      result.Next = outPt.Next;
      result.Prev = outPt;
      outPt.Next.Prev = result;
      outPt.Next = result;
    }
    else
    {
      result.Prev = outPt.Prev;
      result.Next = outPt;
      outPt.Prev.Next = result;
      outPt.Prev = result;
    }
    return result;
  };
  ClipperLib.Clipper.prototype.GetOverlap = function (a1, a2, b1, b2, $val)
  {
    if (a1 < a2)
    {
      if (b1 < b2)
      {
        $val.Left = Math.max(a1, b1);
        $val.Right = Math.min(a2, b2);
      }
      else
      {
        $val.Left = Math.max(a1, b2);
        $val.Right = Math.min(a2, b1);
      }
    }
    else
    {
      if (b1 < b2)
      {
        $val.Left = Math.max(a2, b1);
        $val.Right = Math.min(a1, b2);
      }
      else
      {
        $val.Left = Math.max(a2, b2);
        $val.Right = Math.min(a1, b1);
      }
    }
    return $val.Left < $val.Right;
  };
  ClipperLib.Clipper.prototype.JoinHorz = function (op1, op1b, op2, op2b, Pt, DiscardLeft)
  {
    var Dir1 = (op1.Pt.X > op1b.Pt.X ? ClipperLib.Direction.dRightToLeft : ClipperLib.Direction.dLeftToRight);
    var Dir2 = (op2.Pt.X > op2b.Pt.X ? ClipperLib.Direction.dRightToLeft : ClipperLib.Direction.dLeftToRight);
    if (Dir1 == Dir2)
      return false;
    //When DiscardLeft, we want Op1b to be on the Left of Op1, otherwise we
    //want Op1b to be on the Right. (And likewise with Op2 and Op2b.)
    //So, to facilitate this while inserting Op1b and Op2b ...
    //when DiscardLeft, make sure we're AT or RIGHT of Pt before adding Op1b,
    //otherwise make sure we're AT or LEFT of Pt. (Likewise with Op2b.)
    if (Dir1 == ClipperLib.Direction.dLeftToRight)
    {
      while (op1.Next.Pt.X <= Pt.X &&
        op1.Next.Pt.X >= op1.Pt.X && op1.Next.Pt.Y == Pt.Y)
        op1 = op1.Next;
      if (DiscardLeft && (op1.Pt.X != Pt.X))
        op1 = op1.Next;
      op1b = this.DupOutPt(op1, !DiscardLeft);
      if (ClipperLib.IntPoint.op_Inequality(op1b.Pt, Pt))
      {
        op1 = op1b;
        //op1.Pt = Pt;
        op1.Pt.X = Pt.X;
        op1.Pt.Y = Pt.Y;
        op1b = this.DupOutPt(op1, !DiscardLeft);
      }
    }
    else
    {
      while (op1.Next.Pt.X >= Pt.X &&
        op1.Next.Pt.X <= op1.Pt.X && op1.Next.Pt.Y == Pt.Y)
        op1 = op1.Next;
      if (!DiscardLeft && (op1.Pt.X != Pt.X))
        op1 = op1.Next;
      op1b = this.DupOutPt(op1, DiscardLeft);
      if (ClipperLib.IntPoint.op_Inequality(op1b.Pt, Pt))
      {
        op1 = op1b;
        //op1.Pt = Pt;
        op1.Pt.X = Pt.X;
        op1.Pt.Y = Pt.Y;
        op1b = this.DupOutPt(op1, DiscardLeft);
      }
    }
    if (Dir2 == ClipperLib.Direction.dLeftToRight)
    {
      while (op2.Next.Pt.X <= Pt.X &&
        op2.Next.Pt.X >= op2.Pt.X && op2.Next.Pt.Y == Pt.Y)
        op2 = op2.Next;
      if (DiscardLeft && (op2.Pt.X != Pt.X))
        op2 = op2.Next;
      op2b = this.DupOutPt(op2, !DiscardLeft);
      if (ClipperLib.IntPoint.op_Inequality(op2b.Pt, Pt))
      {
        op2 = op2b;
        //op2.Pt = Pt;
        op2.Pt.X = Pt.X;
        op2.Pt.Y = Pt.Y;
        op2b = this.DupOutPt(op2, !DiscardLeft);
      }
    }
    else
    {
      while (op2.Next.Pt.X >= Pt.X &&
        op2.Next.Pt.X <= op2.Pt.X && op2.Next.Pt.Y == Pt.Y)
        op2 = op2.Next;
      if (!DiscardLeft && (op2.Pt.X != Pt.X))
        op2 = op2.Next;
      op2b = this.DupOutPt(op2, DiscardLeft);
      if (ClipperLib.IntPoint.op_Inequality(op2b.Pt, Pt))
      {
        op2 = op2b;
        //op2.Pt = Pt;
        op2.Pt.X = Pt.X;
        op2.Pt.Y = Pt.Y;
        op2b = this.DupOutPt(op2, DiscardLeft);
      }
    }
    if ((Dir1 == ClipperLib.Direction.dLeftToRight) == DiscardLeft)
    {
      op1.Prev = op2;
      op2.Next = op1;
      op1b.Next = op2b;
      op2b.Prev = op1b;
    }
    else
    {
      op1.Next = op2;
      op2.Prev = op1;
      op1b.Prev = op2b;
      op2b.Next = op1b;
    }
    return true;
  };
  ClipperLib.Clipper.prototype.JoinPoints = function (j, outRec1, outRec2)
  {
    var op1 = j.OutPt1,
      op1b = new ClipperLib.OutPt();
    var op2 = j.OutPt2,
      op2b = new ClipperLib.OutPt();
    //There are 3 kinds of joins for output polygons ...
    //1. Horizontal joins where Join.OutPt1 & Join.OutPt2 are a vertices anywhere
    //along (horizontal) collinear edges (& Join.OffPt is on the same horizontal).
    //2. Non-horizontal joins where Join.OutPt1 & Join.OutPt2 are at the same
    //location at the Bottom of the overlapping segment (& Join.OffPt is above).
    //3. StrictlySimple joins where edges touch but are not collinear and where
    //Join.OutPt1, Join.OutPt2 & Join.OffPt all share the same point.
    var isHorizontal = (j.OutPt1.Pt.Y == j.OffPt.Y);
    if (isHorizontal && (ClipperLib.IntPoint.op_Equality(j.OffPt, j.OutPt1.Pt)) && (ClipperLib.IntPoint.op_Equality(j.OffPt, j.OutPt2.Pt)))
    {
      //Strictly Simple join ...
			if (outRec1 != outRec2) return false;

      op1b = j.OutPt1.Next;
      while (op1b != op1 && (ClipperLib.IntPoint.op_Equality(op1b.Pt, j.OffPt)))
        op1b = op1b.Next;
      var reverse1 = (op1b.Pt.Y > j.OffPt.Y);
      op2b = j.OutPt2.Next;
      while (op2b != op2 && (ClipperLib.IntPoint.op_Equality(op2b.Pt, j.OffPt)))
        op2b = op2b.Next;
      var reverse2 = (op2b.Pt.Y > j.OffPt.Y);
      if (reverse1 == reverse2)
        return false;
      if (reverse1)
      {
        op1b = this.DupOutPt(op1, false);
        op2b = this.DupOutPt(op2, true);
        op1.Prev = op2;
        op2.Next = op1;
        op1b.Next = op2b;
        op2b.Prev = op1b;
        j.OutPt1 = op1;
        j.OutPt2 = op1b;
        return true;
      }
      else
      {
        op1b = this.DupOutPt(op1, true);
        op2b = this.DupOutPt(op2, false);
        op1.Next = op2;
        op2.Prev = op1;
        op1b.Prev = op2b;
        op2b.Next = op1b;
        j.OutPt1 = op1;
        j.OutPt2 = op1b;
        return true;
      }
    }
    else if (isHorizontal)
    {
      //treat horizontal joins differently to non-horizontal joins since with
      //them we're not yet sure where the overlapping is. OutPt1.Pt & OutPt2.Pt
      //may be anywhere along the horizontal edge.
      op1b = op1;
      while (op1.Prev.Pt.Y == op1.Pt.Y && op1.Prev != op1b && op1.Prev != op2)
        op1 = op1.Prev;
      while (op1b.Next.Pt.Y == op1b.Pt.Y && op1b.Next != op1 && op1b.Next != op2)
        op1b = op1b.Next;
      if (op1b.Next == op1 || op1b.Next == op2)
        return false;
      //a flat 'polygon'
      op2b = op2;
      while (op2.Prev.Pt.Y == op2.Pt.Y && op2.Prev != op2b && op2.Prev != op1b)
        op2 = op2.Prev;
      while (op2b.Next.Pt.Y == op2b.Pt.Y && op2b.Next != op2 && op2b.Next != op1)
        op2b = op2b.Next;
      if (op2b.Next == op2 || op2b.Next == op1)
        return false;
      //a flat 'polygon'
      //Op1 -. Op1b & Op2 -. Op2b are the extremites of the horizontal edges

      var $val = {Left: null, Right: null};
      if (!this.GetOverlap(op1.Pt.X, op1b.Pt.X, op2.Pt.X, op2b.Pt.X, $val))
        return false;
      var Left = $val.Left;
      var Right = $val.Right;

      //DiscardLeftSide: when overlapping edges are joined, a spike will created
      //which needs to be cleaned up. However, we don't want Op1 or Op2 caught up
      //on the discard Side as either may still be needed for other joins ...
      var Pt = new ClipperLib.IntPoint();
      var DiscardLeftSide;
      if (op1.Pt.X >= Left && op1.Pt.X <= Right)
      {
        //Pt = op1.Pt;
        Pt.X = op1.Pt.X;
        Pt.Y = op1.Pt.Y;
        DiscardLeftSide = (op1.Pt.X > op1b.Pt.X);
      }
      else if (op2.Pt.X >= Left && op2.Pt.X <= Right)
      {
        //Pt = op2.Pt;
        Pt.X = op2.Pt.X;
        Pt.Y = op2.Pt.Y;
        DiscardLeftSide = (op2.Pt.X > op2b.Pt.X);
      }
      else if (op1b.Pt.X >= Left && op1b.Pt.X <= Right)
      {
        //Pt = op1b.Pt;
        Pt.X = op1b.Pt.X;
        Pt.Y = op1b.Pt.Y;
        DiscardLeftSide = op1b.Pt.X > op1.Pt.X;
      }
      else
      {
        //Pt = op2b.Pt;
        Pt.X = op2b.Pt.X;
        Pt.Y = op2b.Pt.Y;
        DiscardLeftSide = (op2b.Pt.X > op2.Pt.X);
      }
      j.OutPt1 = op1;
      j.OutPt2 = op2;
      return this.JoinHorz(op1, op1b, op2, op2b, Pt, DiscardLeftSide);
    }
    else
    {
      //nb: For non-horizontal joins ...
      //    1. Jr.OutPt1.Pt.Y == Jr.OutPt2.Pt.Y
      //    2. Jr.OutPt1.Pt > Jr.OffPt.Y
      //make sure the polygons are correctly oriented ...
      op1b = op1.Next;
      while ((ClipperLib.IntPoint.op_Equality(op1b.Pt, op1.Pt)) && (op1b != op1))
        op1b = op1b.Next;
      var Reverse1 = ((op1b.Pt.Y > op1.Pt.Y) || !ClipperLib.ClipperBase.SlopesEqual(op1.Pt, op1b.Pt, j.OffPt, this.m_UseFullRange));
      if (Reverse1)
      {
        op1b = op1.Prev;
        while ((ClipperLib.IntPoint.op_Equality(op1b.Pt, op1.Pt)) && (op1b != op1))
          op1b = op1b.Prev;
        if ((op1b.Pt.Y > op1.Pt.Y) || !ClipperLib.ClipperBase.SlopesEqual(op1.Pt, op1b.Pt, j.OffPt, this.m_UseFullRange))
          return false;
      }
      op2b = op2.Next;
      while ((ClipperLib.IntPoint.op_Equality(op2b.Pt, op2.Pt)) && (op2b != op2))
        op2b = op2b.Next;
      var Reverse2 = ((op2b.Pt.Y > op2.Pt.Y) || !ClipperLib.ClipperBase.SlopesEqual(op2.Pt, op2b.Pt, j.OffPt, this.m_UseFullRange));
      if (Reverse2)
      {
        op2b = op2.Prev;
        while ((ClipperLib.IntPoint.op_Equality(op2b.Pt, op2.Pt)) && (op2b != op2))
          op2b = op2b.Prev;
        if ((op2b.Pt.Y > op2.Pt.Y) || !ClipperLib.ClipperBase.SlopesEqual(op2.Pt, op2b.Pt, j.OffPt, this.m_UseFullRange))
          return false;
      }
      if ((op1b == op1) || (op2b == op2) || (op1b == op2b) ||
        ((outRec1 == outRec2) && (Reverse1 == Reverse2)))
        return false;
      if (Reverse1)
      {
        op1b = this.DupOutPt(op1, false);
        op2b = this.DupOutPt(op2, true);
        op1.Prev = op2;
        op2.Next = op1;
        op1b.Next = op2b;
        op2b.Prev = op1b;
        j.OutPt1 = op1;
        j.OutPt2 = op1b;
        return true;
      }
      else
      {
        op1b = this.DupOutPt(op1, true);
        op2b = this.DupOutPt(op2, false);
        op1.Next = op2;
        op2.Prev = op1;
        op1b.Prev = op2b;
        op2b.Next = op1b;
        j.OutPt1 = op1;
        j.OutPt2 = op1b;
        return true;
      }
    }
  };
  ClipperLib.Clipper.GetBounds = function (paths)
  {
    var i = 0,
      cnt = paths.length;
    while (i < cnt && paths[i].length == 0) i++;
    if (i == cnt) return new ClipperLib.IntRect(0, 0, 0, 0);
    var result = new ClipperLib.IntRect();
    result.left = paths[i][0].X;
    result.right = result.left;
    result.top = paths[i][0].Y;
    result.bottom = result.top;
    for (; i < cnt; i++)
      for (var j = 0, jlen = paths[i].length; j < jlen; j++)
      {
        if (paths[i][j].X < result.left) result.left = paths[i][j].X;
        else if (paths[i][j].X > result.right) result.right = paths[i][j].X;
        if (paths[i][j].Y < result.top) result.top = paths[i][j].Y;
        else if (paths[i][j].Y > result.bottom) result.bottom = paths[i][j].Y;
      }
    return result;
  }
  ClipperLib.Clipper.prototype.GetBounds2 = function (ops)
  {
    var opStart = ops;
    var result = new ClipperLib.IntRect();
    result.left = ops.Pt.X;
    result.right = ops.Pt.X;
    result.top = ops.Pt.Y;
    result.bottom = ops.Pt.Y;
    ops = ops.Next;
    while (ops != opStart)
    {
      if (ops.Pt.X < result.left)
        result.left = ops.Pt.X;
      if (ops.Pt.X > result.right)
        result.right = ops.Pt.X;
      if (ops.Pt.Y < result.top)
        result.top = ops.Pt.Y;
      if (ops.Pt.Y > result.bottom)
        result.bottom = ops.Pt.Y;
      ops = ops.Next;
    }
    return result;
  };

  ClipperLib.Clipper.PointInPolygon = function (pt, path)
  {
    //returns 0 if false, +1 if true, -1 if pt ON polygon boundary
		//See "The Point in Polygon Problem for Arbitrary Polygons" by Hormann & Agathos
    //http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.88.5498&rep=rep1&type=pdf
    var result = 0,
      cnt = path.length;
    if (cnt < 3)
      return 0;
    var ip = path[0];
    for (var i = 1; i <= cnt; ++i)
    {
      var ipNext = (i == cnt ? path[0] : path[i]);
      if (ipNext.Y == pt.Y)
      {
        if ((ipNext.X == pt.X) || (ip.Y == pt.Y && ((ipNext.X > pt.X) == (ip.X < pt.X))))
          return -1;
      }
      if ((ip.Y < pt.Y) != (ipNext.Y < pt.Y))
      {
        if (ip.X >= pt.X)
        {
          if (ipNext.X > pt.X)
            result = 1 - result;
          else
          {
            var d = (ip.X - pt.X) * (ipNext.Y - pt.Y) - (ipNext.X - pt.X) * (ip.Y - pt.Y);
            if (d == 0)
              return -1;
            else if ((d > 0) == (ipNext.Y > ip.Y))
              result = 1 - result;
          }
        }
        else
        {
          if (ipNext.X > pt.X)
          {
            var d = (ip.X - pt.X) * (ipNext.Y - pt.Y) - (ipNext.X - pt.X) * (ip.Y - pt.Y);
            if (d == 0)
              return -1;
            else if ((d > 0) == (ipNext.Y > ip.Y))
              result = 1 - result;
          }
        }
      }
      ip = ipNext;
    }
    return result;
  };

  ClipperLib.Clipper.prototype.PointInPolygon = function (pt, op)
  {
    //returns 0 if false, +1 if true, -1 if pt ON polygon boundary
		//See "The Point in Polygon Problem for Arbitrary Polygons" by Hormann & Agathos
    //http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.88.5498&rep=rep1&type=pdf
    var result = 0;
    var startOp = op;
		var ptx = pt.X, pty = pt.Y;
    var poly0x = op.Pt.X, poly0y = op.Pt.Y;
    do
    {
			op = op.Next;
			var poly1x = op.Pt.X, poly1y = op.Pt.Y;
      if (poly1y == pty)
      {
        if ((poly1x == ptx) || (poly0y == pty && ((poly1x > ptx) == (poly0x < ptx))))
          return -1;
      }
      if ((poly0y < pty) != (poly1y < pty))
      {
        if (poly0x >= ptx)
        {
          if (poly1x > ptx)
            result = 1 - result;
          else
          {
            var d = (poly0x - ptx) * (poly1y - pty) - (poly1x - ptx) * (poly0y - pty);
            if (d == 0)
              return -1;
            if ((d > 0) == (poly1y > poly0y))
              result = 1 - result;
          }
        }
        else
        {
          if (poly1x > ptx)
          {
            var d = (poly0x - ptx) * (poly1y - pty) - (poly1x - ptx) * (poly0y - pty);
            if (d == 0)
              return -1;
            if ((d > 0) == (poly1y > poly0y))
              result = 1 - result;
          }
        }
      }
      poly0x = poly1x;
      poly0y = poly1y;
    } while (startOp != op);

    return result;
  };

  ClipperLib.Clipper.prototype.Poly2ContainsPoly1 = function (outPt1, outPt2)
  {
    var op = outPt1;
    do
    {
			//nb: PointInPolygon returns 0 if false, +1 if true, -1 if pt on polygon
      var res = this.PointInPolygon(op.Pt, outPt2);
      if (res >= 0)
        return res > 0;
      op = op.Next;
    }
    while (op != outPt1)
    return true;
  };
  ClipperLib.Clipper.prototype.FixupFirstLefts1 = function (OldOutRec, NewOutRec)
  {
    for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
    {
			var outRec = this.m_PolyOuts[i];
			if (outRec.Pts == null || outRec.FirstLeft == null)
				continue;
			var firstLeft = ClipperLib.Clipper.ParseFirstLeft(outRec.FirstLeft);
			if (firstLeft == OldOutRec)
			{
        if (this.Poly2ContainsPoly1(outRec.Pts, NewOutRec.Pts))
          outRec.FirstLeft = NewOutRec;
      }
    }
  };
  ClipperLib.Clipper.prototype.FixupFirstLefts2 = function (OldOutRec, NewOutRec)
  {
    for (var $i2 = 0, $t2 = this.m_PolyOuts, $l2 = $t2.length, outRec = $t2[$i2]; $i2 < $l2; $i2++, outRec = $t2[$i2])
      if (outRec.FirstLeft == OldOutRec)
        outRec.FirstLeft = NewOutRec;
  };
  ClipperLib.Clipper.ParseFirstLeft = function (FirstLeft)
  {
    while (FirstLeft != null && FirstLeft.Pts == null)
      FirstLeft = FirstLeft.FirstLeft;
    return FirstLeft;
  };
  ClipperLib.Clipper.prototype.JoinCommonEdges = function ()
  {
    for (var i = 0, ilen = this.m_Joins.length; i < ilen; i++)
    {
      var join = this.m_Joins[i];
      var outRec1 = this.GetOutRec(join.OutPt1.Idx);
      var outRec2 = this.GetOutRec(join.OutPt2.Idx);
      if (outRec1.Pts == null || outRec2.Pts == null)
        continue;
      //get the polygon fragment with the correct hole state (FirstLeft)
      //before calling JoinPoints() ...
      var holeStateRec;
      if (outRec1 == outRec2)
        holeStateRec = outRec1;
      else if (this.Param1RightOfParam2(outRec1, outRec2))
        holeStateRec = outRec2;
      else if (this.Param1RightOfParam2(outRec2, outRec1))
        holeStateRec = outRec1;
      else
        holeStateRec = this.GetLowermostRec(outRec1, outRec2);

      if (!this.JoinPoints(join, outRec1, outRec2)) continue;

      if (outRec1 == outRec2)
      {
        //instead of joining two polygons, we've just created a new one by
        //splitting one polygon into two.
        outRec1.Pts = join.OutPt1;
        outRec1.BottomPt = null;
        outRec2 = this.CreateOutRec();
        outRec2.Pts = join.OutPt2;
        //update all OutRec2.Pts Idx's ...
        this.UpdateOutPtIdxs(outRec2);
        //We now need to check every OutRec.FirstLeft pointer. If it points
        //to OutRec1 it may need to point to OutRec2 instead ...
        if (this.m_UsingPolyTree)
          for (var j = 0, jlen = this.m_PolyOuts.length; j < jlen - 1; j++)
          {
            var oRec = this.m_PolyOuts[j];
            if (oRec.Pts == null || ClipperLib.Clipper.ParseFirstLeft(oRec.FirstLeft) != outRec1 || oRec.IsHole == outRec1.IsHole)
              continue;
            if (this.Poly2ContainsPoly1(oRec.Pts, join.OutPt2))
              oRec.FirstLeft = outRec2;
          }
        if (this.Poly2ContainsPoly1(outRec2.Pts, outRec1.Pts))
        {
          //outRec2 is contained by outRec1 ...
          outRec2.IsHole = !outRec1.IsHole;
          outRec2.FirstLeft = outRec1;
          //fixup FirstLeft pointers that may need reassigning to OutRec1
          if (this.m_UsingPolyTree)
            this.FixupFirstLefts2(outRec2, outRec1);
          if ((outRec2.IsHole ^ this.ReverseSolution) == (this.Area(outRec2) > 0))
            this.ReversePolyPtLinks(outRec2.Pts);
        }
        else if (this.Poly2ContainsPoly1(outRec1.Pts, outRec2.Pts))
        {
          //outRec1 is contained by outRec2 ...
          outRec2.IsHole = outRec1.IsHole;
          outRec1.IsHole = !outRec2.IsHole;
          outRec2.FirstLeft = outRec1.FirstLeft;
          outRec1.FirstLeft = outRec2;
          //fixup FirstLeft pointers that may need reassigning to OutRec1
          if (this.m_UsingPolyTree)
            this.FixupFirstLefts2(outRec1, outRec2);
          if ((outRec1.IsHole ^ this.ReverseSolution) == (this.Area(outRec1) > 0))
            this.ReversePolyPtLinks(outRec1.Pts);
        }
        else
        {
          //the 2 polygons are completely separate ...
          outRec2.IsHole = outRec1.IsHole;
          outRec2.FirstLeft = outRec1.FirstLeft;
          //fixup FirstLeft pointers that may need reassigning to OutRec2
          if (this.m_UsingPolyTree)
            this.FixupFirstLefts1(outRec1, outRec2);
        }
      }
      else
      {
        //joined 2 polygons together ...
        outRec2.Pts = null;
        outRec2.BottomPt = null;
        outRec2.Idx = outRec1.Idx;
        outRec1.IsHole = holeStateRec.IsHole;
        if (holeStateRec == outRec2)
          outRec1.FirstLeft = outRec2.FirstLeft;
        outRec2.FirstLeft = outRec1;
        //fixup FirstLeft pointers that may need reassigning to OutRec1
        if (this.m_UsingPolyTree)
          this.FixupFirstLefts2(outRec2, outRec1);
      }
    }
  };
  ClipperLib.Clipper.prototype.UpdateOutPtIdxs = function (outrec)
  {
    var op = outrec.Pts;
    do {
      op.Idx = outrec.Idx;
      op = op.Prev;
    }
    while (op != outrec.Pts)
  };
  ClipperLib.Clipper.prototype.DoSimplePolygons = function ()
  {
    var i = 0;
    while (i < this.m_PolyOuts.length)
    {
      var outrec = this.m_PolyOuts[i++];
      var op = outrec.Pts;
			if (op == null || outrec.IsOpen)
				continue;
      do //for each Pt in Polygon until duplicate found do ...
      {
        var op2 = op.Next;
        while (op2 != outrec.Pts)
        {
          if ((ClipperLib.IntPoint.op_Equality(op.Pt, op2.Pt)) && op2.Next != op && op2.Prev != op)
          {
            //split the polygon into two ...
            var op3 = op.Prev;
            var op4 = op2.Prev;
            op.Prev = op4;
            op4.Next = op;
            op2.Prev = op3;
            op3.Next = op2;
            outrec.Pts = op;
            var outrec2 = this.CreateOutRec();
            outrec2.Pts = op2;
            this.UpdateOutPtIdxs(outrec2);
            if (this.Poly2ContainsPoly1(outrec2.Pts, outrec.Pts))
            {
              //OutRec2 is contained by OutRec1 ...
              outrec2.IsHole = !outrec.IsHole;
              outrec2.FirstLeft = outrec;
							if (this.m_UsingPolyTree) this.FixupFirstLefts2(outrec2, outrec);

            }
            else if (this.Poly2ContainsPoly1(outrec.Pts, outrec2.Pts))
            {
              //OutRec1 is contained by OutRec2 ...
              outrec2.IsHole = outrec.IsHole;
              outrec.IsHole = !outrec2.IsHole;
              outrec2.FirstLeft = outrec.FirstLeft;
              outrec.FirstLeft = outrec2;
              if (this.m_UsingPolyTree) this.FixupFirstLefts2(outrec, outrec2);
            }
            else
            {
              //the 2 polygons are separate ...
              outrec2.IsHole = outrec.IsHole;
              outrec2.FirstLeft = outrec.FirstLeft;
							if (this.m_UsingPolyTree) this.FixupFirstLefts1(outrec, outrec2);
            }
            op2 = op;
            //ie get ready for the next iteration
          }
          op2 = op2.Next;
        }
        op = op.Next;
      }
      while (op != outrec.Pts)
    }
  };
  ClipperLib.Clipper.Area = function (poly)
  {
    var cnt = poly.length;
    if (cnt < 3)
      return 0;
    var a = 0;
    for (var i = 0, j = cnt - 1; i < cnt; ++i)
    {
      a += (poly[j].X + poly[i].X) * (poly[j].Y - poly[i].Y);
      j = i;
    }
    return -a * 0.5;
  };
  ClipperLib.Clipper.prototype.Area = function (outRec)
  {
    var op = outRec.Pts;
    if (op == null)
      return 0;
    var a = 0;
    do {
      a = a + (op.Prev.Pt.X + op.Pt.X) * (op.Prev.Pt.Y - op.Pt.Y);
      op = op.Next;
    }
    while (op != outRec.Pts)
    return a * 0.5;
  };
  ClipperLib.Clipper.SimplifyPolygon = function (poly, fillType)
  {
    var result = new Array();
    var c = new ClipperLib.Clipper(0);
    c.StrictlySimple = true;
    c.AddPath(poly, ClipperLib.PolyType.ptSubject, true);
    c.Execute(ClipperLib.ClipType.ctUnion, result, fillType, fillType);
    return result;
  };
  ClipperLib.Clipper.SimplifyPolygons = function (polys, fillType)
  {
    if (typeof (fillType) == "undefined") fillType = ClipperLib.PolyFillType.pftEvenOdd;
    var result = new Array();
    var c = new ClipperLib.Clipper(0);
    c.StrictlySimple = true;
    c.AddPaths(polys, ClipperLib.PolyType.ptSubject, true);
    c.Execute(ClipperLib.ClipType.ctUnion, result, fillType, fillType);
    return result;
  };
  ClipperLib.Clipper.DistanceSqrd = function (pt1, pt2)
  {
    var dx = (pt1.X - pt2.X);
    var dy = (pt1.Y - pt2.Y);
    return (dx * dx + dy * dy);
  };
  ClipperLib.Clipper.DistanceFromLineSqrd = function (pt, ln1, ln2)
  {
    //The equation of a line in general form (Ax + By + C = 0)
    //given 2 points (x¹,y¹) & (x²,y²) is ...
    //(y¹ - y²)x + (x² - x¹)y + (y² - y¹)x¹ - (x² - x¹)y¹ = 0
    //A = (y¹ - y²); B = (x² - x¹); C = (y² - y¹)x¹ - (x² - x¹)y¹
    //perpendicular distance of point (x³,y³) = (Ax³ + By³ + C)/Sqrt(A² + B²)
    //see http://en.wikipedia.org/wiki/Perpendicular_distance
    var A = ln1.Y - ln2.Y;
    var B = ln2.X - ln1.X;
    var C = A * ln1.X + B * ln1.Y;
    C = A * pt.X + B * pt.Y - C;
    return (C * C) / (A * A + B * B);
  };

	ClipperLib.Clipper.SlopesNearCollinear = function(pt1, pt2, pt3, distSqrd)
	{
		//this function is more accurate when the point that's GEOMETRICALLY
		//between the other 2 points is the one that's tested for distance.
		//nb: with 'spikes', either pt1 or pt3 is geometrically between the other pts
		if (Math.abs(pt1.X - pt2.X) > Math.abs(pt1.Y - pt2.Y))
		{
		if ((pt1.X > pt2.X) == (pt1.X < pt3.X))
			return ClipperLib.Clipper.DistanceFromLineSqrd(pt1, pt2, pt3) < distSqrd;
		else if ((pt2.X > pt1.X) == (pt2.X < pt3.X))
			return ClipperLib.Clipper.DistanceFromLineSqrd(pt2, pt1, pt3) < distSqrd;
				else
				return ClipperLib.Clipper.DistanceFromLineSqrd(pt3, pt1, pt2) < distSqrd;
		}
		else
		{
		if ((pt1.Y > pt2.Y) == (pt1.Y < pt3.Y))
			return ClipperLib.Clipper.DistanceFromLineSqrd(pt1, pt2, pt3) < distSqrd;
		else if ((pt2.Y > pt1.Y) == (pt2.Y < pt3.Y))
			return ClipperLib.Clipper.DistanceFromLineSqrd(pt2, pt1, pt3) < distSqrd;
				else
			return ClipperLib.Clipper.DistanceFromLineSqrd(pt3, pt1, pt2) < distSqrd;
		}
	}

  ClipperLib.Clipper.PointsAreClose = function (pt1, pt2, distSqrd)
  {
    var dx = pt1.X - pt2.X;
    var dy = pt1.Y - pt2.Y;
    return ((dx * dx) + (dy * dy) <= distSqrd);
  };
  //------------------------------------------------------------------------------
  ClipperLib.Clipper.ExcludeOp = function (op)
  {
    var result = op.Prev;
    result.Next = op.Next;
    op.Next.Prev = result;
    result.Idx = 0;
    return result;
  };
  ClipperLib.Clipper.CleanPolygon = function (path, distance)
  {
    if (typeof (distance) == "undefined") distance = 1.415;
    //distance = proximity in units/pixels below which vertices will be stripped.
    //Default ~= sqrt(2) so when adjacent vertices or semi-adjacent vertices have
    //both x & y coords within 1 unit, then the second vertex will be stripped.
    var cnt = path.length;
    if (cnt == 0)
      return new Array();
    var outPts = new Array(cnt);
    for (var i = 0; i < cnt; ++i)
      outPts[i] = new ClipperLib.OutPt();
    for (var i = 0; i < cnt; ++i)
    {
      outPts[i].Pt = path[i];
      outPts[i].Next = outPts[(i + 1) % cnt];
      outPts[i].Next.Prev = outPts[i];
      outPts[i].Idx = 0;
    }
    var distSqrd = distance * distance;
    var op = outPts[0];
    while (op.Idx == 0 && op.Next != op.Prev)
    {
      if (ClipperLib.Clipper.PointsAreClose(op.Pt, op.Prev.Pt, distSqrd))
      {
        op = ClipperLib.Clipper.ExcludeOp(op);
        cnt--;
      }
      else if (ClipperLib.Clipper.PointsAreClose(op.Prev.Pt, op.Next.Pt, distSqrd))
      {
        ClipperLib.Clipper.ExcludeOp(op.Next);
        op = ClipperLib.Clipper.ExcludeOp(op);
        cnt -= 2;
      }
      else if (ClipperLib.Clipper.SlopesNearCollinear(op.Prev.Pt, op.Pt, op.Next.Pt, distSqrd))
      {
        op = ClipperLib.Clipper.ExcludeOp(op);
        cnt--;
      }
      else
      {
        op.Idx = 1;
        op = op.Next;
      }
    }
    if (cnt < 3)
      cnt = 0;
    var result = new Array(cnt);
    for (var i = 0; i < cnt; ++i)
    {
      result[i] = new ClipperLib.IntPoint(op.Pt);
      op = op.Next;
    }
    outPts = null;
    return result;
  };
  ClipperLib.Clipper.CleanPolygons = function (polys, distance)
  {
    var result = new Array(polys.length);
    for (var i = 0, ilen = polys.length; i < ilen; i++)
      result[i] = ClipperLib.Clipper.CleanPolygon(polys[i], distance);
    return result;
  };
  ClipperLib.Clipper.Minkowski = function (pattern, path, IsSum, IsClosed)
  {
    var delta = (IsClosed ? 1 : 0);
    var polyCnt = pattern.length;
    var pathCnt = path.length;
    var result = new Array();
    if (IsSum)
      for (var i = 0; i < pathCnt; i++)
      {
        var p = new Array(polyCnt);
        for (var j = 0, jlen = pattern.length, ip = pattern[j]; j < jlen; j++, ip = pattern[j])
          p[j] = new ClipperLib.IntPoint(path[i].X + ip.X, path[i].Y + ip.Y);
        result.push(p);
      }
    else
      for (var i = 0; i < pathCnt; i++)
      {
        var p = new Array(polyCnt);
        for (var j = 0, jlen = pattern.length, ip = pattern[j]; j < jlen; j++, ip = pattern[j])
          p[j] = new ClipperLib.IntPoint(path[i].X - ip.X, path[i].Y - ip.Y);
        result.push(p);
      }
    var quads = new Array();
    for (var i = 0; i < pathCnt - 1 + delta; i++)
      for (var j = 0; j < polyCnt; j++)
      {
        var quad = new Array();
        quad.push(result[i % pathCnt][j % polyCnt]);
        quad.push(result[(i + 1) % pathCnt][j % polyCnt]);
        quad.push(result[(i + 1) % pathCnt][(j + 1) % polyCnt]);
        quad.push(result[i % pathCnt][(j + 1) % polyCnt]);
        if (!ClipperLib.Clipper.Orientation(quad))
          quad.reverse();
        quads.push(quad);
      }
			return quads;
  };

	ClipperLib.Clipper.MinkowskiSum = function(pattern, path_or_paths, pathIsClosed)
	{
		if(!(path_or_paths[0] instanceof Array))
		{
			var path = path_or_paths;
			var paths = ClipperLib.Clipper.Minkowski(pattern, path, true, pathIsClosed);
			var c = new ClipperLib.Clipper();
			c.AddPaths(paths, ClipperLib.PolyType.ptSubject, true);
			c.Execute(ClipperLib.ClipType.ctUnion, paths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
			return paths;
		}
		else
		{
 			var paths = path_or_paths;
			var solution = new ClipperLib.Paths();
			var c = new ClipperLib.Clipper();
			for (var i = 0; i < paths.length; ++i)
			{
				var tmp = ClipperLib.Clipper.Minkowski(pattern, paths[i], true, pathIsClosed);
				c.AddPaths(tmp, ClipperLib.PolyType.ptSubject, true);
				if (pathIsClosed)
				{
					var path = ClipperLib.Clipper.TranslatePath(paths[i], pattern[0]);
					c.AddPath(path, ClipperLib.PolyType.ptClip, true);
				}
			}
			c.Execute(ClipperLib.ClipType.ctUnion, solution,
				ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
			return solution;
		}
	}
	//------------------------------------------------------------------------------

	ClipperLib.Clipper.TranslatePath = function (path, delta)
	{
		var outPath = new ClipperLib.Path();
		for (var i = 0; i < path.length; i++)
			outPath.push(new ClipperLib.IntPoint(path[i].X + delta.X, path[i].Y + delta.Y));
		return outPath;
	}
	//------------------------------------------------------------------------------

	ClipperLib.Clipper.MinkowskiDiff = function (poly1, poly2)
	{
		var paths = ClipperLib.Clipper.Minkowski(poly1, poly2, false, true);
		var c = new ClipperLib.Clipper();
		c.AddPaths(paths, ClipperLib.PolyType.ptSubject, true);
		c.Execute(ClipperLib.ClipType.ctUnion, paths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
		return paths;
	}

  ClipperLib.Clipper.PolyTreeToPaths = function (polytree)
  {
    var result = new Array();
    //result.set_Capacity(polytree.get_Total());
    ClipperLib.Clipper.AddPolyNodeToPaths(polytree, ClipperLib.Clipper.NodeType.ntAny, result);
    return result;
  };
  ClipperLib.Clipper.AddPolyNodeToPaths = function (polynode, nt, paths)
  {
    var match = true;
    switch (nt)
    {
    case ClipperLib.Clipper.NodeType.ntOpen:
      return;
    case ClipperLib.Clipper.NodeType.ntClosed:
      match = !polynode.IsOpen;
      break;
    default:
      break;
    }
    if (polynode.m_polygon.length > 0 && match)
      paths.push(polynode.m_polygon);
    for (var $i3 = 0, $t3 = polynode.Childs(), $l3 = $t3.length, pn = $t3[$i3]; $i3 < $l3; $i3++, pn = $t3[$i3])
      ClipperLib.Clipper.AddPolyNodeToPaths(pn, nt, paths);
  };
  ClipperLib.Clipper.OpenPathsFromPolyTree = function (polytree)
  {
    var result = new ClipperLib.Paths();
    //result.set_Capacity(polytree.ChildCount());
    for (var i = 0, ilen = polytree.ChildCount(); i < ilen; i++)
      if (polytree.Childs()[i].IsOpen)
        result.push(polytree.Childs()[i].m_polygon);
    return result;
  };
  ClipperLib.Clipper.ClosedPathsFromPolyTree = function (polytree)
  {
    var result = new ClipperLib.Paths();
    //result.set_Capacity(polytree.Total());
    ClipperLib.Clipper.AddPolyNodeToPaths(polytree, ClipperLib.Clipper.NodeType.ntClosed, result);
    return result;
  };
  Inherit(ClipperLib.Clipper, ClipperLib.ClipperBase);
  ClipperLib.Clipper.NodeType = {
    ntAny: 0,
    ntOpen: 1,
    ntClosed: 2
  };
  ClipperLib.ClipperOffset = function (miterLimit, arcTolerance)
  {
    if (typeof (miterLimit) == "undefined") miterLimit = 2;
    if (typeof (arcTolerance) == "undefined") arcTolerance = ClipperLib.ClipperOffset.def_arc_tolerance;
    this.m_destPolys = new ClipperLib.Paths();
    this.m_srcPoly = new ClipperLib.Path();
    this.m_destPoly = new ClipperLib.Path();
    this.m_normals = new Array();
    this.m_delta = 0;
    this.m_sinA = 0;
    this.m_sin = 0;
    this.m_cos = 0;
    this.m_miterLim = 0;
    this.m_StepsPerRad = 0;
    this.m_lowest = new ClipperLib.IntPoint();
    this.m_polyNodes = new ClipperLib.PolyNode();
    this.MiterLimit = miterLimit;
    this.ArcTolerance = arcTolerance;
    this.m_lowest.X = -1;
  };
  ClipperLib.ClipperOffset.two_pi = 6.28318530717959;
  ClipperLib.ClipperOffset.def_arc_tolerance = 0.25;
  ClipperLib.ClipperOffset.prototype.Clear = function ()
  {
    ClipperLib.Clear(this.m_polyNodes.Childs());
    this.m_lowest.X = -1;
  };
  ClipperLib.ClipperOffset.Round = ClipperLib.Clipper.Round;
  ClipperLib.ClipperOffset.prototype.AddPath = function (path, joinType, endType)
  {
    var highI = path.length - 1;
    if (highI < 0)
      return;
    var newNode = new ClipperLib.PolyNode();
    newNode.m_jointype = joinType;
    newNode.m_endtype = endType;
    //strip duplicate points from path and also get index to the lowest point ...
    if (endType == ClipperLib.EndType.etClosedLine || endType == ClipperLib.EndType.etClosedPolygon)
      while (highI > 0 && ClipperLib.IntPoint.op_Equality(path[0], path[highI]))
        highI--;
    //newNode.m_polygon.set_Capacity(highI + 1);
    newNode.m_polygon.push(path[0]);
    var j = 0,
      k = 0;
    for (var i = 1; i <= highI; i++)
      if (ClipperLib.IntPoint.op_Inequality(newNode.m_polygon[j], path[i]))
      {
        j++;
        newNode.m_polygon.push(path[i]);
        if (path[i].Y > newNode.m_polygon[k].Y || (path[i].Y == newNode.m_polygon[k].Y && path[i].X < newNode.m_polygon[k].X))
          k = j;
      }
    if (endType == ClipperLib.EndType.etClosedPolygon && j < 2) return;

    this.m_polyNodes.AddChild(newNode);
    //if this path's lowest pt is lower than all the others then update m_lowest
    if (endType != ClipperLib.EndType.etClosedPolygon)
      return;
    if (this.m_lowest.X < 0)
      this.m_lowest = new ClipperLib.IntPoint(this.m_polyNodes.ChildCount() - 1, k);
    else
    {
      var ip = this.m_polyNodes.Childs()[this.m_lowest.X].m_polygon[this.m_lowest.Y];
      if (newNode.m_polygon[k].Y > ip.Y || (newNode.m_polygon[k].Y == ip.Y && newNode.m_polygon[k].X < ip.X))
        this.m_lowest = new ClipperLib.IntPoint(this.m_polyNodes.ChildCount() - 1, k);
    }
  };
  ClipperLib.ClipperOffset.prototype.AddPaths = function (paths, joinType, endType)
  {
    for (var i = 0, ilen = paths.length; i < ilen; i++)
      this.AddPath(paths[i], joinType, endType);
  };
  ClipperLib.ClipperOffset.prototype.FixOrientations = function ()
  {
    //fixup orientations of all closed paths if the orientation of the
    //closed path with the lowermost vertex is wrong ...
    if (this.m_lowest.X >= 0 && !ClipperLib.Clipper.Orientation(this.m_polyNodes.Childs()[this.m_lowest.X].m_polygon))
    {
      for (var i = 0; i < this.m_polyNodes.ChildCount(); i++)
      {
        var node = this.m_polyNodes.Childs()[i];
        if (node.m_endtype == ClipperLib.EndType.etClosedPolygon || (node.m_endtype == ClipperLib.EndType.etClosedLine && ClipperLib.Clipper.Orientation(node.m_polygon)))
          node.m_polygon.reverse();
      }
    }
    else
    {
      for (var i = 0; i < this.m_polyNodes.ChildCount(); i++)
      {
        var node = this.m_polyNodes.Childs()[i];
        if (node.m_endtype == ClipperLib.EndType.etClosedLine && !ClipperLib.Clipper.Orientation(node.m_polygon))
          node.m_polygon.reverse();
      }
    }
  };
  ClipperLib.ClipperOffset.GetUnitNormal = function (pt1, pt2)
  {
    var dx = (pt2.X - pt1.X);
    var dy = (pt2.Y - pt1.Y);
    if ((dx == 0) && (dy == 0))
      return new ClipperLib.DoublePoint(0, 0);
    var f = 1 / Math.sqrt(dx * dx + dy * dy);
    dx *= f;
    dy *= f;
    return new ClipperLib.DoublePoint(dy, -dx);
  };
  ClipperLib.ClipperOffset.prototype.DoOffset = function (delta)
  {
    this.m_destPolys = new Array();
    this.m_delta = delta;
    //if Zero offset, just copy any CLOSED polygons to m_p and return ...
    if (ClipperLib.ClipperBase.near_zero(delta))
    {
      //this.m_destPolys.set_Capacity(this.m_polyNodes.ChildCount);
      for (var i = 0; i < this.m_polyNodes.ChildCount(); i++)
      {
        var node = this.m_polyNodes.Childs()[i];
        if (node.m_endtype == ClipperLib.EndType.etClosedPolygon)
          this.m_destPolys.push(node.m_polygon);
      }
      return;
    }
    //see offset_triginometry3.svg in the documentation folder ...
    if (this.MiterLimit > 2)
      this.m_miterLim = 2 / (this.MiterLimit * this.MiterLimit);
    else
      this.m_miterLim = 0.5;
    var y;
    if (this.ArcTolerance <= 0)
      y = ClipperLib.ClipperOffset.def_arc_tolerance;
    else if (this.ArcTolerance > Math.abs(delta) * ClipperLib.ClipperOffset.def_arc_tolerance)
      y = Math.abs(delta) * ClipperLib.ClipperOffset.def_arc_tolerance;
    else
      y = this.ArcTolerance;
    //see offset_triginometry2.svg in the documentation folder ...
    var steps = 3.14159265358979 / Math.acos(1 - y / Math.abs(delta));
    this.m_sin = Math.sin(ClipperLib.ClipperOffset.two_pi / steps);
    this.m_cos = Math.cos(ClipperLib.ClipperOffset.two_pi / steps);
    this.m_StepsPerRad = steps / ClipperLib.ClipperOffset.two_pi;
    if (delta < 0)
      this.m_sin = -this.m_sin;
    //this.m_destPolys.set_Capacity(this.m_polyNodes.ChildCount * 2);
    for (var i = 0; i < this.m_polyNodes.ChildCount(); i++)
    {
      var node = this.m_polyNodes.Childs()[i];
      this.m_srcPoly = node.m_polygon;
      var len = this.m_srcPoly.length;
      if (len == 0 || (delta <= 0 && (len < 3 || node.m_endtype != ClipperLib.EndType.etClosedPolygon)))
        continue;
      this.m_destPoly = new Array();
      if (len == 1)
      {
        if (node.m_jointype == ClipperLib.JoinType.jtRound)
        {
          var X = 1,
            Y = 0;
          for (var j = 1; j <= steps; j++)
          {
            this.m_destPoly.push(new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + Y * delta)));
            var X2 = X;
            X = X * this.m_cos - this.m_sin * Y;
            Y = X2 * this.m_sin + Y * this.m_cos;
          }
        }
        else
        {
          var X = -1,
            Y = -1;
          for (var j = 0; j < 4; ++j)
          {
            this.m_destPoly.push(new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + Y * delta)));
            if (X < 0)
              X = 1;
            else if (Y < 0)
              Y = 1;
            else
              X = -1;
          }
        }
        this.m_destPolys.push(this.m_destPoly);
        continue;
      }
      //build m_normals ...
      this.m_normals.length = 0;
      //this.m_normals.set_Capacity(len);
      for (var j = 0; j < len - 1; j++)
        this.m_normals.push(ClipperLib.ClipperOffset.GetUnitNormal(this.m_srcPoly[j], this.m_srcPoly[j + 1]));
      if (node.m_endtype == ClipperLib.EndType.etClosedLine || node.m_endtype == ClipperLib.EndType.etClosedPolygon)
        this.m_normals.push(ClipperLib.ClipperOffset.GetUnitNormal(this.m_srcPoly[len - 1], this.m_srcPoly[0]));
      else
        this.m_normals.push(new ClipperLib.DoublePoint(this.m_normals[len - 2]));
      if (node.m_endtype == ClipperLib.EndType.etClosedPolygon)
      {
        var k = len - 1;
        for (var j = 0; j < len; j++)
          k = this.OffsetPoint(j, k, node.m_jointype);
        this.m_destPolys.push(this.m_destPoly);
      }
      else if (node.m_endtype == ClipperLib.EndType.etClosedLine)
      {
        var k = len - 1;
        for (var j = 0; j < len; j++)
          k = this.OffsetPoint(j, k, node.m_jointype);
        this.m_destPolys.push(this.m_destPoly);
        this.m_destPoly = new Array();
        //re-build m_normals ...
        var n = this.m_normals[len - 1];
        for (var j = len - 1; j > 0; j--)
          this.m_normals[j] = new ClipperLib.DoublePoint(-this.m_normals[j - 1].X, -this.m_normals[j - 1].Y);
        this.m_normals[0] = new ClipperLib.DoublePoint(-n.X, -n.Y);
        k = 0;
        for (var j = len - 1; j >= 0; j--)
          k = this.OffsetPoint(j, k, node.m_jointype);
        this.m_destPolys.push(this.m_destPoly);
      }
      else
      {
        var k = 0;
        for (var j = 1; j < len - 1; ++j)
          k = this.OffsetPoint(j, k, node.m_jointype);
        var pt1;
        if (node.m_endtype == ClipperLib.EndType.etOpenButt)
        {
          var j = len - 1;
          pt1 = new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * delta));
          this.m_destPoly.push(pt1);
          pt1 = new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X - this.m_normals[j].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y - this.m_normals[j].Y * delta));
          this.m_destPoly.push(pt1);
        }
        else
        {
          var j = len - 1;
          k = len - 2;
          this.m_sinA = 0;
          this.m_normals[j] = new ClipperLib.DoublePoint(-this.m_normals[j].X, -this.m_normals[j].Y);
          if (node.m_endtype == ClipperLib.EndType.etOpenSquare)
            this.DoSquare(j, k);
          else
            this.DoRound(j, k);
        }
        //re-build m_normals ...
        for (var j = len - 1; j > 0; j--)
          this.m_normals[j] = new ClipperLib.DoublePoint(-this.m_normals[j - 1].X, -this.m_normals[j - 1].Y);
        this.m_normals[0] = new ClipperLib.DoublePoint(-this.m_normals[1].X, -this.m_normals[1].Y);
        k = len - 1;
        for (var j = k - 1; j > 0; --j)
          k = this.OffsetPoint(j, k, node.m_jointype);
        if (node.m_endtype == ClipperLib.EndType.etOpenButt)
        {
          pt1 = new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X - this.m_normals[0].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y - this.m_normals[0].Y * delta));
          this.m_destPoly.push(pt1);
          pt1 = new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + this.m_normals[0].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + this.m_normals[0].Y * delta));
          this.m_destPoly.push(pt1);
        }
        else
        {
          k = 1;
          this.m_sinA = 0;
          if (node.m_endtype == ClipperLib.EndType.etOpenSquare)
            this.DoSquare(0, 1);
          else
            this.DoRound(0, 1);
        }
        this.m_destPolys.push(this.m_destPoly);
      }
    }
  };
  ClipperLib.ClipperOffset.prototype.Execute = function ()
  {
    var a = arguments,
      ispolytree = a[0] instanceof ClipperLib.PolyTree;
    if (!ispolytree) // function (solution, delta)
    {
      var solution = a[0],
        delta = a[1];
      ClipperLib.Clear(solution);
      this.FixOrientations();
      this.DoOffset(delta);
      //now clean up 'corners' ...
      var clpr = new ClipperLib.Clipper(0);
      clpr.AddPaths(this.m_destPolys, ClipperLib.PolyType.ptSubject, true);
      if (delta > 0)
      {
        clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftPositive, ClipperLib.PolyFillType.pftPositive);
      }
      else
      {
        var r = ClipperLib.Clipper.GetBounds(this.m_destPolys);
        var outer = new ClipperLib.Path();
        outer.push(new ClipperLib.IntPoint(r.left - 10, r.bottom + 10));
        outer.push(new ClipperLib.IntPoint(r.right + 10, r.bottom + 10));
        outer.push(new ClipperLib.IntPoint(r.right + 10, r.top - 10));
        outer.push(new ClipperLib.IntPoint(r.left - 10, r.top - 10));
        clpr.AddPath(outer, ClipperLib.PolyType.ptSubject, true);
        clpr.ReverseSolution = true;
        clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftNegative, ClipperLib.PolyFillType.pftNegative);
        if (solution.length > 0)
          solution.splice(0, 1);
      }
      //console.log(JSON.stringify(solution));
    }
    else // function (polytree, delta)
    {
      var solution = a[0],
        delta = a[1];
      solution.Clear();
      this.FixOrientations();
      this.DoOffset(delta);
      //now clean up 'corners' ...
      var clpr = new ClipperLib.Clipper(0);
      clpr.AddPaths(this.m_destPolys, ClipperLib.PolyType.ptSubject, true);
      if (delta > 0)
      {
        clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftPositive, ClipperLib.PolyFillType.pftPositive);
      }
      else
      {
        var r = ClipperLib.Clipper.GetBounds(this.m_destPolys);
        var outer = new ClipperLib.Path();
        outer.push(new ClipperLib.IntPoint(r.left - 10, r.bottom + 10));
        outer.push(new ClipperLib.IntPoint(r.right + 10, r.bottom + 10));
        outer.push(new ClipperLib.IntPoint(r.right + 10, r.top - 10));
        outer.push(new ClipperLib.IntPoint(r.left - 10, r.top - 10));
        clpr.AddPath(outer, ClipperLib.PolyType.ptSubject, true);
        clpr.ReverseSolution = true;
        clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftNegative, ClipperLib.PolyFillType.pftNegative);
        //remove the outer PolyNode rectangle ...
        if (solution.ChildCount() == 1 && solution.Childs()[0].ChildCount() > 0)
        {
          var outerNode = solution.Childs()[0];
          //solution.Childs.set_Capacity(outerNode.ChildCount);
          solution.Childs()[0] = outerNode.Childs()[0];
          solution.Childs()[0].m_Parent = solution;
          for (var i = 1; i < outerNode.ChildCount(); i++)
            solution.AddChild(outerNode.Childs()[i]);
        }
        else
          solution.Clear();
      }
    }
  };
  ClipperLib.ClipperOffset.prototype.OffsetPoint = function (j, k, jointype)
  {
		//cross product ...
		this.m_sinA = (this.m_normals[k].X * this.m_normals[j].Y - this.m_normals[j].X * this.m_normals[k].Y);

		if (Math.abs(this.m_sinA * this.m_delta) < 1.0)
		{
			//dot product ...
			var cosA = (this.m_normals[k].X * this.m_normals[j].X + this.m_normals[j].Y * this.m_normals[k].Y);
			if (cosA > 0) // angle ==> 0 degrees
			{
				this.m_destPoly.push(new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[k].X * this.m_delta),
					ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[k].Y * this.m_delta)));
				return k;
			}
			//else angle ==> 180 degrees
		}
    else if (this.m_sinA > 1)
      this.m_sinA = 1.0;
    else if (this.m_sinA < -1)
      this.m_sinA = -1.0;
    if (this.m_sinA * this.m_delta < 0)
    {
      this.m_destPoly.push(new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[k].X * this.m_delta),
        ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[k].Y * this.m_delta)));
      this.m_destPoly.push(new ClipperLib.IntPoint(this.m_srcPoly[j]));
      this.m_destPoly.push(new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * this.m_delta),
        ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * this.m_delta)));
    }
    else
      switch (jointype)
      {
      case ClipperLib.JoinType.jtMiter:
        {
          var r = 1 + (this.m_normals[j].X * this.m_normals[k].X + this.m_normals[j].Y * this.m_normals[k].Y);
          if (r >= this.m_miterLim)
            this.DoMiter(j, k, r);
          else
            this.DoSquare(j, k);
          break;
        }
      case ClipperLib.JoinType.jtSquare:
        this.DoSquare(j, k);
        break;
      case ClipperLib.JoinType.jtRound:
        this.DoRound(j, k);
        break;
      }
    k = j;
    return k;
  };
  ClipperLib.ClipperOffset.prototype.DoSquare = function (j, k)
  {
    var dx = Math.tan(Math.atan2(this.m_sinA,
      this.m_normals[k].X * this.m_normals[j].X + this.m_normals[k].Y * this.m_normals[j].Y) / 4);
    this.m_destPoly.push(new ClipperLib.IntPoint(
      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_delta * (this.m_normals[k].X - this.m_normals[k].Y * dx)),
      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_delta * (this.m_normals[k].Y + this.m_normals[k].X * dx))));
    this.m_destPoly.push(new ClipperLib.IntPoint(
      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_delta * (this.m_normals[j].X + this.m_normals[j].Y * dx)),
      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_delta * (this.m_normals[j].Y - this.m_normals[j].X * dx))));
  };
  ClipperLib.ClipperOffset.prototype.DoMiter = function (j, k, r)
  {
    var q = this.m_delta / r;
    this.m_destPoly.push(new ClipperLib.IntPoint(
      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + (this.m_normals[k].X + this.m_normals[j].X) * q),
      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + (this.m_normals[k].Y + this.m_normals[j].Y) * q)));
  };
  ClipperLib.ClipperOffset.prototype.DoRound = function (j, k)
  {
    var a = Math.atan2(this.m_sinA,
      this.m_normals[k].X * this.m_normals[j].X + this.m_normals[k].Y * this.m_normals[j].Y);

    	var steps = Math.max(ClipperLib.Cast_Int32(ClipperLib.ClipperOffset.Round(this.m_StepsPerRad * Math.abs(a))), 1);

    var X = this.m_normals[k].X,
      Y = this.m_normals[k].Y,
      X2;
    for (var i = 0; i < steps; ++i)
    {
      this.m_destPoly.push(new ClipperLib.IntPoint(
        ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + X * this.m_delta),
        ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + Y * this.m_delta)));
      X2 = X;
      X = X * this.m_cos - this.m_sin * Y;
      Y = X2 * this.m_sin + Y * this.m_cos;
    }
    this.m_destPoly.push(new ClipperLib.IntPoint(
      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * this.m_delta),
      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * this.m_delta)));
  };
  ClipperLib.Error = function (message)
  {
    try
    {
      throw new Error(message);
    }
    catch (err)
    {
      alert(err.message);
    }
  };
  // ---------------------------------
  // JS extension by Timo 2013
  ClipperLib.JS = {};
  ClipperLib.JS.AreaOfPolygon = function (poly, scale)
  {
    if (!scale) scale = 1;
    return ClipperLib.Clipper.Area(poly) / (scale * scale);
  };
  ClipperLib.JS.AreaOfPolygons = function (poly, scale)
  {
    if (!scale) scale = 1;
    var area = 0;
    for (var i = 0; i < poly.length; i++)
    {
      area += ClipperLib.Clipper.Area(poly[i]);
    }
    return area / (scale * scale);
  };
  ClipperLib.JS.BoundsOfPath = function (path, scale)
  {
    return ClipperLib.JS.BoundsOfPaths([path], scale);
  };
  ClipperLib.JS.BoundsOfPaths = function (paths, scale)
  {
    if (!scale) scale = 1;
    var bounds = ClipperLib.Clipper.GetBounds(paths);
    bounds.left /= scale;
    bounds.bottom /= scale;
    bounds.right /= scale;
    bounds.top /= scale;
    return bounds;
  };
  // Clean() joins vertices that are too near each other
  // and causes distortion to offsetted polygons without cleaning
  ClipperLib.JS.Clean = function (polygon, delta)
  {
    if (!(polygon instanceof Array)) return [];
    var isPolygons = polygon[0] instanceof Array;
    var polygon = ClipperLib.JS.Clone(polygon);
    if (typeof delta != "number" || delta === null)
    {
      ClipperLib.Error("Delta is not a number in Clean().");
      return polygon;
    }
    if (polygon.length === 0 || (polygon.length == 1 && polygon[0].length === 0) || delta < 0) return polygon;
    if (!isPolygons) polygon = [polygon];
    var k_length = polygon.length;
    var len, poly, result, d, p, j, i;
    var results = [];
    for (var k = 0; k < k_length; k++)
    {
      poly = polygon[k];
      len = poly.length;
      if (len === 0) continue;
      else if (len < 3)
      {
        result = poly;
        results.push(result);
        continue;
      }
      result = poly;
      d = delta * delta;
      //d = Math.floor(c_delta * c_delta);
      p = poly[0];
      j = 1;
      for (i = 1; i < len; i++)
      {
        if ((poly[i].X - p.X) * (poly[i].X - p.X) +
          (poly[i].Y - p.Y) * (poly[i].Y - p.Y) <= d)
          continue;
        result[j] = poly[i];
        p = poly[i];
        j++;
      }
      p = poly[j - 1];
      if ((poly[0].X - p.X) * (poly[0].X - p.X) +
        (poly[0].Y - p.Y) * (poly[0].Y - p.Y) <= d)
        j--;
      if (j < len)
        result.splice(j, len - j);
      if (result.length) results.push(result);
    }
    if (!isPolygons && results.length) results = results[0];
    else if (!isPolygons && results.length === 0) results = [];
    else if (isPolygons && results.length === 0) results = [
      []
    ];
    return results;
  }
  // Make deep copy of Polygons or Polygon
  // so that also IntPoint objects are cloned and not only referenced
  // This should be the fastest way
  ClipperLib.JS.Clone = function (polygon)
  {
    if (!(polygon instanceof Array)) return [];
    if (polygon.length === 0) return [];
    else if (polygon.length == 1 && polygon[0].length === 0) return [[]];
    var isPolygons = polygon[0] instanceof Array;
    if (!isPolygons) polygon = [polygon];
    var len = polygon.length,
      plen, i, j, result;
    var results = new Array(len);
    for (i = 0; i < len; i++)
    {
      plen = polygon[i].length;
      result = new Array(plen);
      for (j = 0; j < plen; j++)
      {
        result[j] = {
          X: polygon[i][j].X,
          Y: polygon[i][j].Y
        };
      }
      results[i] = result;
    }
    if (!isPolygons) results = results[0];
    return results;
  };
  // Removes points that doesn't affect much to the visual appearance.
  // If middle point is at or under certain distance (tolerance) of the line segment between
  // start and end point, the middle point is removed.
  ClipperLib.JS.Lighten = function (polygon, tolerance)
  {
    if (!(polygon instanceof Array)) return [];
    if (typeof tolerance != "number" || tolerance === null)
    {
      ClipperLib.Error("Tolerance is not a number in Lighten().")
      return ClipperLib.JS.Clone(polygon);
    }
    if (polygon.length === 0 || (polygon.length == 1 && polygon[0].length === 0) || tolerance < 0)
    {
      return ClipperLib.JS.Clone(polygon);
    }
    if (!(polygon[0] instanceof Array)) polygon = [polygon];
    var i, j, poly, k, poly2, plen, A, B, P, d, rem, addlast;
    var bxax, byay, l, ax, ay;
    var len = polygon.length;
    var toleranceSq = tolerance * tolerance;
    var results = [];
    for (i = 0; i < len; i++)
    {
      poly = polygon[i];
      plen = poly.length;
      if (plen == 0) continue;
      for (k = 0; k < 1000000; k++) // could be forever loop, but wiser to restrict max repeat count
      {
        poly2 = [];
        plen = poly.length;
        // the first have to added to the end, if first and last are not the same
        // this way we ensure that also the actual last point can be removed if needed
        if (poly[plen - 1].X != poly[0].X || poly[plen - 1].Y != poly[0].Y)
        {
          addlast = 1;
          poly.push(
          {
            X: poly[0].X,
            Y: poly[0].Y
          });
          plen = poly.length;
        }
        else addlast = 0;
        rem = []; // Indexes of removed points
        for (j = 0; j < plen - 2; j++)
        {
          A = poly[j]; // Start point of line segment
          P = poly[j + 1]; // Middle point. This is the one to be removed.
          B = poly[j + 2]; // End point of line segment
          ax = A.X;
          ay = A.Y;
          bxax = B.X - ax;
          byay = B.Y - ay;
          if (bxax !== 0 || byay !== 0) // To avoid Nan, when A==P && P==B. And to avoid peaks (A==B && A!=P), which have lenght, but not area.
          {
            l = ((P.X - ax) * bxax + (P.Y - ay) * byay) / (bxax * bxax + byay * byay);
            if (l > 1)
            {
              ax = B.X;
              ay = B.Y;
            }
            else if (l > 0)
            {
              ax += bxax * l;
              ay += byay * l;
            }
          }
          bxax = P.X - ax;
          byay = P.Y - ay;
          d = bxax * bxax + byay * byay;
          if (d <= toleranceSq)
          {
            rem[j + 1] = 1;
            j++; // when removed, transfer the pointer to the next one
          }
        }
        // add all unremoved points to poly2
        poly2.push(
        {
          X: poly[0].X,
          Y: poly[0].Y
        });
        for (j = 1; j < plen - 1; j++)
          if (!rem[j]) poly2.push(
          {
            X: poly[j].X,
            Y: poly[j].Y
          });
        poly2.push(
        {
          X: poly[plen - 1].X,
          Y: poly[plen - 1].Y
        });
        // if the first point was added to the end, remove it
        if (addlast) poly.pop();
        // break, if there was not anymore removed points
        if (!rem.length) break;
        // else continue looping using poly2, to check if there are points to remove
        else poly = poly2;
      }
      plen = poly2.length;
      // remove duplicate from end, if needed
      if (poly2[plen - 1].X == poly2[0].X && poly2[plen - 1].Y == poly2[0].Y)
      {
        poly2.pop();
      }
      if (poly2.length > 2) // to avoid two-point-polygons
        results.push(poly2);
    }
    if (!(polygon[0] instanceof Array)) results = results[0];
    if (typeof (results) == "undefined") results = [
      []
    ];
    return results;
  }
  ClipperLib.JS.PerimeterOfPath = function (path, closed, scale)
  {
    if (typeof (path) == "undefined") return 0;
    var sqrt = Math.sqrt;
    var perimeter = 0.0;
    var p1, p2, p1x = 0.0,
      p1y = 0.0,
      p2x = 0.0,
      p2y = 0.0;
    var j = path.length;
    if (j < 2) return 0;
    if (closed)
    {
      path[j] = path[0];
      j++;
    }
    while (--j)
    {
      p1 = path[j];
      p1x = p1.X;
      p1y = p1.Y;
      p2 = path[j - 1];
      p2x = p2.X;
      p2y = p2.Y;
      perimeter += sqrt((p1x - p2x) * (p1x - p2x) + (p1y - p2y) * (p1y - p2y));
    }
    if (closed) path.pop();
    return perimeter / scale;
  };
  ClipperLib.JS.PerimeterOfPaths = function (paths, closed, scale)
  {
    if (!scale) scale = 1;
    var perimeter = 0;
    for (var i = 0; i < paths.length; i++)
    {
      perimeter += ClipperLib.JS.PerimeterOfPath(paths[i], closed, scale);
    }
    return perimeter;
  };
  ClipperLib.JS.ScaleDownPath = function (path, scale)
  {
    var i, p;
    if (!scale) scale = 1;
    i = path.length;
    while (i--)
    {
      p = path[i];
      p.X = p.X / scale;
      p.Y = p.Y / scale;
    }
  };
  ClipperLib.JS.ScaleDownPaths = function (paths, scale)
  {
    var i, j, p;
    if (!scale) scale = 1;
    i = paths.length;
    while (i--)
    {
      j = paths[i].length;
      while (j--)
      {
        p = paths[i][j];
        p.X = p.X / scale;
        p.Y = p.Y / scale;
      }
    }
  };
  ClipperLib.JS.ScaleUpPath = function (path, scale)
  {
    var i, p, round = Math.round;
    if (!scale) scale = 1;
    i = path.length;
    while (i--)
    {
      p = path[i];
      p.X = round(p.X * scale);
      p.Y = round(p.Y * scale);
    }
  };
  ClipperLib.JS.ScaleUpPaths = function (paths, scale)
  {
    var i, j, p, round = Math.round;
    if (!scale) scale = 1;
    i = paths.length;
    while (i--)
    {
      j = paths[i].length;
      while (j--)
      {
        p = paths[i][j];
        p.X = round(p.X * scale);
        p.Y = round(p.Y * scale);
      }
    }
  };
  ClipperLib.ExPolygons = function ()
  {
    return [];
  }
  ClipperLib.ExPolygon = function ()
  {
    this.outer = null;
    this.holes = null;
  };
  ClipperLib.JS.AddOuterPolyNodeToExPolygons = function (polynode, expolygons)
  {
    var ep = new ClipperLib.ExPolygon();
    ep.outer = polynode.Contour();
    var childs = polynode.Childs();
    var ilen = childs.length;
    ep.holes = new Array(ilen);
    var node, n, i, j, childs2, jlen;
    for (i = 0; i < ilen; i++)
    {
      node = childs[i];
      ep.holes[i] = node.Contour();
      //Add outer polygons contained by (nested within) holes ...
      for (j = 0, childs2 = node.Childs(), jlen = childs2.length; j < jlen; j++)
      {
        n = childs2[j];
        ClipperLib.JS.AddOuterPolyNodeToExPolygons(n, expolygons);
      }
    }
    expolygons.push(ep);
  };
  ClipperLib.JS.ExPolygonsToPaths = function (expolygons)
  {
    var a, i, alen, ilen;
    var paths = new ClipperLib.Paths();
    for (a = 0, alen = expolygons.length; a < alen; a++)
    {
      paths.push(expolygons[a].outer);
      for (i = 0, ilen = expolygons[a].holes.length; i < ilen; i++)
      {
        paths.push(expolygons[a].holes[i]);
      }
    }
    return paths;
  }
  ClipperLib.JS.PolyTreeToExPolygons = function (polytree)
  {
    var expolygons = new ClipperLib.ExPolygons();
    var node, i, childs, ilen;
    for (i = 0, childs = polytree.Childs(), ilen = childs.length; i < ilen; i++)
    {
      node = childs[i];
      ClipperLib.JS.AddOuterPolyNodeToExPolygons(node, expolygons);
    }
    return expolygons;
  };
})();

},{}],17:[function(require,module,exports){
"use strict"

var twoProduct = require("two-product")
var robustSum = require("robust-sum")
var robustDiff = require("robust-subtract")
var robustScale = require("robust-scale")

var NUM_EXPAND = 6

function cofactor(m, c) {
  var result = new Array(m.length-1)
  for(var i=1; i<m.length; ++i) {
    var r = result[i-1] = new Array(m.length-1)
    for(var j=0,k=0; j<m.length; ++j) {
      if(j === c) {
        continue
      }
      r[k++] = m[i][j]
    }
  }
  return result
}

function matrix(n) {
  var result = new Array(n)
  for(var i=0; i<n; ++i) {
    result[i] = new Array(n)
    for(var j=0; j<n; ++j) {
      result[i][j] = ["m", j, "[", (n-i-2), "]"].join("")
    }
  }
  return result
}

function generateSum(expr) {
  if(expr.length === 1) {
    return expr[0]
  } else if(expr.length === 2) {
    return ["sum(", expr[0], ",", expr[1], ")"].join("")
  } else {
    var m = expr.length>>1
    return ["sum(", generateSum(expr.slice(0, m)), ",", generateSum(expr.slice(m)), ")"].join("")
  }
}

function makeProduct(a, b) {
  if(a.charAt(0) === "m") {
    if(b.charAt(0) === "w") {
      var toks = a.split("[")
      return ["w", b.substr(1), "m", toks[0].substr(1)].join("")
    } else {
      return ["prod(", a, ",", b, ")"].join("")
    }
  } else {
    return makeProduct(b, a)
  }
}

function sign(s) {
  if(s & 1 !== 0) {
    return "-"
  }
  return ""
}

function determinant(m) {
  if(m.length === 2) {
    return [["diff(", makeProduct(m[0][0], m[1][1]), ",", makeProduct(m[1][0], m[0][1]), ")"].join("")]
  } else {
    var expr = []
    for(var i=0; i<m.length; ++i) {
      expr.push(["scale(", generateSum(determinant(cofactor(m, i))), ",", sign(i), m[0][i], ")"].join(""))
    }
    return expr
  }
}

function makeSquare(d, n) {
  var terms = []
  for(var i=0; i<n-2; ++i) {
    terms.push(["prod(m", d, "[", i, "],m", d, "[", i, "])"].join(""))
  }
  return generateSum(terms)
}

function orientation(n) {
  var pos = []
  var neg = []
  var m = matrix(n)
  for(var i=0; i<n; ++i) {
    m[0][i] = "1"
    m[n-1][i] = "w"+i
  } 
  for(var i=0; i<n; ++i) {
    if((i&1)===0) {
      pos.push.apply(pos,determinant(cofactor(m, i)))
    } else {
      neg.push.apply(neg,determinant(cofactor(m, i)))
    }
  }
  var posExpr = generateSum(pos)
  var negExpr = generateSum(neg)
  var funcName = "exactInSphere" + n
  var funcArgs = []
  for(var i=0; i<n; ++i) {
    funcArgs.push("m" + i)
  }
  var code = ["function ", funcName, "(", funcArgs.join(), "){"]
  for(var i=0; i<n; ++i) {
    code.push("var w",i,"=",makeSquare(i,n),";")
    for(var j=0; j<n; ++j) {
      if(j !== i) {
        code.push("var w",i,"m",j,"=scale(w",i,",m",j,"[0]);")
      }
    }
  }
  code.push("var p=", posExpr, ",n=", negExpr, ",d=diff(p,n);return d[d.length-1];}return ", funcName)
  var proc = new Function("sum", "diff", "prod", "scale", code.join(""))
  return proc(robustSum, robustDiff, twoProduct, robustScale)
}

function inSphere0() { return 0 }
function inSphere1() { return 0 }
function inSphere2() { return 0 }

var CACHED = [
  inSphere0,
  inSphere1,
  inSphere2
]

function slowInSphere(args) {
  var proc = CACHED[args.length]
  if(!proc) {
    proc = CACHED[args.length] = orientation(args.length)
  }
  return proc.apply(undefined, args)
}

function generateInSphereTest() {
  while(CACHED.length <= NUM_EXPAND) {
    CACHED.push(orientation(CACHED.length))
  }
  var args = []
  var procArgs = ["slow"]
  for(var i=0; i<=NUM_EXPAND; ++i) {
    args.push("a" + i)
    procArgs.push("o" + i)
  }
  var code = [
    "function testInSphere(", args.join(), "){switch(arguments.length){case 0:case 1:return 0;"
  ]
  for(var i=2; i<=NUM_EXPAND; ++i) {
    code.push("case ", i, ":return o", i, "(", args.slice(0, i).join(), ");")
  }
  code.push("}var s=new Array(arguments.length);for(var i=0;i<arguments.length;++i){s[i]=arguments[i]};return slow(s);}return testInSphere")
  procArgs.push(code.join(""))

  var proc = Function.apply(undefined, procArgs)

  module.exports = proc.apply(undefined, [slowInSphere].concat(CACHED))
  for(var i=0; i<=NUM_EXPAND; ++i) {
    module.exports[i] = CACHED[i]
  }
}

generateInSphereTest()
},{"robust-scale":19,"robust-subtract":20,"robust-sum":21,"two-product":22}],18:[function(require,module,exports){
"use strict"

var twoProduct = require("two-product")
var robustSum = require("robust-sum")
var robustScale = require("robust-scale")
var robustSubtract = require("robust-subtract")

var NUM_EXPAND = 5

var EPSILON     = 1.1102230246251565e-16
var ERRBOUND3   = (3.0 + 16.0 * EPSILON) * EPSILON
var ERRBOUND4   = (7.0 + 56.0 * EPSILON) * EPSILON

function cofactor(m, c) {
  var result = new Array(m.length-1)
  for(var i=1; i<m.length; ++i) {
    var r = result[i-1] = new Array(m.length-1)
    for(var j=0,k=0; j<m.length; ++j) {
      if(j === c) {
        continue
      }
      r[k++] = m[i][j]
    }
  }
  return result
}

function matrix(n) {
  var result = new Array(n)
  for(var i=0; i<n; ++i) {
    result[i] = new Array(n)
    for(var j=0; j<n; ++j) {
      result[i][j] = ["m", j, "[", (n-i-1), "]"].join("")
    }
  }
  return result
}

function sign(n) {
  if(n & 1) {
    return "-"
  }
  return ""
}

function generateSum(expr) {
  if(expr.length === 1) {
    return expr[0]
  } else if(expr.length === 2) {
    return ["sum(", expr[0], ",", expr[1], ")"].join("")
  } else {
    var m = expr.length>>1
    return ["sum(", generateSum(expr.slice(0, m)), ",", generateSum(expr.slice(m)), ")"].join("")
  }
}

function determinant(m) {
  if(m.length === 2) {
    return [["sum(prod(", m[0][0], ",", m[1][1], "),prod(-", m[0][1], ",", m[1][0], "))"].join("")]
  } else {
    var expr = []
    for(var i=0; i<m.length; ++i) {
      expr.push(["scale(", generateSum(determinant(cofactor(m, i))), ",", sign(i), m[0][i], ")"].join(""))
    }
    return expr
  }
}

function orientation(n) {
  var pos = []
  var neg = []
  var m = matrix(n)
  var args = []
  for(var i=0; i<n; ++i) {
    if((i&1)===0) {
      pos.push.apply(pos, determinant(cofactor(m, i)))
    } else {
      neg.push.apply(neg, determinant(cofactor(m, i)))
    }
    args.push("m" + i)
  }
  var posExpr = generateSum(pos)
  var negExpr = generateSum(neg)
  var funcName = "orientation" + n + "Exact"
  var code = ["function ", funcName, "(", args.join(), "){var p=", posExpr, ",n=", negExpr, ",d=sub(p,n);\
return d[d.length-1];};return ", funcName].join("")
  var proc = new Function("sum", "prod", "scale", "sub", code)
  return proc(robustSum, twoProduct, robustScale, robustSubtract)
}

var orientation3Exact = orientation(3)
var orientation4Exact = orientation(4)

var CACHED = [
  function orientation0() { return 0 },
  function orientation1() { return 0 },
  function orientation2(a, b) { 
    return b[0] - a[0]
  },
  function orientation3(a, b, c) {
    var l = (a[1] - c[1]) * (b[0] - c[0])
    var r = (a[0] - c[0]) * (b[1] - c[1])
    var det = l - r
    var s
    if(l > 0) {
      if(r <= 0) {
        return det
      } else {
        s = l + r
      }
    } else if(l < 0) {
      if(r >= 0) {
        return det
      } else {
        s = -(l + r)
      }
    } else {
      return det
    }
    var tol = ERRBOUND3 * s
    if(det >= tol || det <= -tol) {
      return det
    }
    return orientation3Exact(a, b, c)
  },
  function orientation4(a,b,c,d) {
    var adx = a[0] - d[0]
    var bdx = b[0] - d[0]
    var cdx = c[0] - d[0]
    var ady = a[1] - d[1]
    var bdy = b[1] - d[1]
    var cdy = c[1] - d[1]
    var adz = a[2] - d[2]
    var bdz = b[2] - d[2]
    var cdz = c[2] - d[2]
    var bdxcdy = bdx * cdy
    var cdxbdy = cdx * bdy
    var cdxady = cdx * ady
    var adxcdy = adx * cdy
    var adxbdy = adx * bdy
    var bdxady = bdx * ady
    var det = adz * (bdxcdy - cdxbdy) 
            + bdz * (cdxady - adxcdy)
            + cdz * (adxbdy - bdxady)
    var permanent = (Math.abs(bdxcdy) + Math.abs(cdxbdy)) * Math.abs(adz)
                  + (Math.abs(cdxady) + Math.abs(adxcdy)) * Math.abs(bdz)
                  + (Math.abs(adxbdy) + Math.abs(bdxady)) * Math.abs(cdz)
    var tol = ERRBOUND4 * permanent
    if ((det > tol) || (-det > tol)) {
      return det
    }
    return orientation4Exact(a,b,c,d)
  }
]

function slowOrient(args) {
  var proc = CACHED[args.length]
  if(!proc) {
    proc = CACHED[args.length] = orientation(args.length)
  }
  return proc.apply(undefined, args)
}

function generateOrientationProc() {
  while(CACHED.length <= NUM_EXPAND) {
    CACHED.push(orientation(CACHED.length))
  }
  var args = []
  var procArgs = ["slow"]
  for(var i=0; i<=NUM_EXPAND; ++i) {
    args.push("a" + i)
    procArgs.push("o" + i)
  }
  var code = [
    "function getOrientation(", args.join(), "){switch(arguments.length){case 0:case 1:return 0;"
  ]
  for(var i=2; i<=NUM_EXPAND; ++i) {
    code.push("case ", i, ":return o", i, "(", args.slice(0, i).join(), ");")
  }
  code.push("}var s=new Array(arguments.length);for(var i=0;i<arguments.length;++i){s[i]=arguments[i]};return slow(s);}return getOrientation")
  procArgs.push(code.join(""))

  var proc = Function.apply(undefined, procArgs)
  module.exports = proc.apply(undefined, [slowOrient].concat(CACHED))
  for(var i=0; i<=NUM_EXPAND; ++i) {
    module.exports[i] = CACHED[i]
  }
}

generateOrientationProc()
},{"robust-scale":19,"robust-subtract":20,"robust-sum":21,"two-product":22}],19:[function(require,module,exports){
"use strict"

var twoProduct = require("two-product")
var twoSum = require("two-sum")

module.exports = scaleLinearExpansion

function scaleLinearExpansion(e, scale) {
  var n = e.length
  if(n === 1) {
    var ts = twoProduct(e[0], scale)
    if(ts[0]) {
      return ts
    }
    return [ ts[1] ]
  }
  var g = new Array(2 * n)
  var q = [0.1, 0.1]
  var t = [0.1, 0.1]
  var count = 0
  twoProduct(e[0], scale, q)
  if(q[0]) {
    g[count++] = q[0]
  }
  for(var i=1; i<n; ++i) {
    twoProduct(e[i], scale, t)
    var pq = q[1]
    twoSum(pq, t[0], q)
    if(q[0]) {
      g[count++] = q[0]
    }
    var a = t[1]
    var b = q[1]
    var x = a + b
    var bv = x - a
    var y = b - bv
    q[1] = x
    if(y) {
      g[count++] = y
    }
  }
  if(q[1]) {
    g[count++] = q[1]
  }
  if(count === 0) {
    g[count++] = 0.0
  }
  g.length = count
  return g
}
},{"two-product":22,"two-sum":23}],20:[function(require,module,exports){
"use strict"

module.exports = robustSubtract

//Easy case: Add two scalars
function scalarScalar(a, b) {
  var x = a + b
  var bv = x - a
  var av = x - bv
  var br = b - bv
  var ar = a - av
  var y = ar + br
  if(y) {
    return [y, x]
  }
  return [x]
}

function robustSubtract(e, f) {
  var ne = e.length|0
  var nf = f.length|0
  if(ne === 1 && nf === 1) {
    return scalarScalar(e[0], -f[0])
  }
  var n = ne + nf
  var g = new Array(n)
  var count = 0
  var eptr = 0
  var fptr = 0
  var abs = Math.abs
  var ei = e[eptr]
  var ea = abs(ei)
  var fi = -f[fptr]
  var fa = abs(fi)
  var a, b
  if(ea < fa) {
    b = ei
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
      ea = abs(ei)
    }
  } else {
    b = fi
    fptr += 1
    if(fptr < nf) {
      fi = -f[fptr]
      fa = abs(fi)
    }
  }
  if((eptr < ne && ea < fa) || (fptr >= nf)) {
    a = ei
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
      ea = abs(ei)
    }
  } else {
    a = fi
    fptr += 1
    if(fptr < nf) {
      fi = -f[fptr]
      fa = abs(fi)
    }
  }
  var x = a + b
  var bv = x - a
  var y = b - bv
  var q0 = y
  var q1 = x
  var _x, _bv, _av, _br, _ar
  while(eptr < ne && fptr < nf) {
    if(ea < fa) {
      a = ei
      eptr += 1
      if(eptr < ne) {
        ei = e[eptr]
        ea = abs(ei)
      }
    } else {
      a = fi
      fptr += 1
      if(fptr < nf) {
        fi = -f[fptr]
        fa = abs(fi)
      }
    }
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
  }
  while(eptr < ne) {
    a = ei
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
    }
  }
  while(fptr < nf) {
    a = fi
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    } 
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
    fptr += 1
    if(fptr < nf) {
      fi = -f[fptr]
    }
  }
  if(q0) {
    g[count++] = q0
  }
  if(q1) {
    g[count++] = q1
  }
  if(!count) {
    g[count++] = 0.0  
  }
  g.length = count
  return g
}
},{}],21:[function(require,module,exports){
"use strict"

module.exports = linearExpansionSum

//Easy case: Add two scalars
function scalarScalar(a, b) {
  var x = a + b
  var bv = x - a
  var av = x - bv
  var br = b - bv
  var ar = a - av
  var y = ar + br
  if(y) {
    return [y, x]
  }
  return [x]
}

function linearExpansionSum(e, f) {
  var ne = e.length|0
  var nf = f.length|0
  if(ne === 1 && nf === 1) {
    return scalarScalar(e[0], f[0])
  }
  var n = ne + nf
  var g = new Array(n)
  var count = 0
  var eptr = 0
  var fptr = 0
  var abs = Math.abs
  var ei = e[eptr]
  var ea = abs(ei)
  var fi = f[fptr]
  var fa = abs(fi)
  var a, b
  if(ea < fa) {
    b = ei
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
      ea = abs(ei)
    }
  } else {
    b = fi
    fptr += 1
    if(fptr < nf) {
      fi = f[fptr]
      fa = abs(fi)
    }
  }
  if((eptr < ne && ea < fa) || (fptr >= nf)) {
    a = ei
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
      ea = abs(ei)
    }
  } else {
    a = fi
    fptr += 1
    if(fptr < nf) {
      fi = f[fptr]
      fa = abs(fi)
    }
  }
  var x = a + b
  var bv = x - a
  var y = b - bv
  var q0 = y
  var q1 = x
  var _x, _bv, _av, _br, _ar
  while(eptr < ne && fptr < nf) {
    if(ea < fa) {
      a = ei
      eptr += 1
      if(eptr < ne) {
        ei = e[eptr]
        ea = abs(ei)
      }
    } else {
      a = fi
      fptr += 1
      if(fptr < nf) {
        fi = f[fptr]
        fa = abs(fi)
      }
    }
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
  }
  while(eptr < ne) {
    a = ei
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
    }
  }
  while(fptr < nf) {
    a = fi
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    } 
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
    fptr += 1
    if(fptr < nf) {
      fi = f[fptr]
    }
  }
  if(q0) {
    g[count++] = q0
  }
  if(q1) {
    g[count++] = q1
  }
  if(!count) {
    g[count++] = 0.0  
  }
  g.length = count
  return g
}
},{}],22:[function(require,module,exports){
"use strict"

module.exports = twoProduct

var SPLITTER = +(Math.pow(2, 27) + 1.0)

function twoProduct(a, b, result) {
  var x = a * b

  var c = SPLITTER * a
  var abig = c - a
  var ahi = c - abig
  var alo = a - ahi

  var d = SPLITTER * b
  var bbig = d - b
  var bhi = d - bbig
  var blo = b - bhi

  var err1 = x - (ahi * bhi)
  var err2 = err1 - (alo * bhi)
  var err3 = err2 - (ahi * blo)

  var y = alo * blo - err3

  if(result) {
    result[0] = y
    result[1] = x
    return result
  }

  return [ y, x ]
}
},{}],23:[function(require,module,exports){
"use strict"

module.exports = fastTwoSum

function fastTwoSum(a, b, result) {
	var x = a + b
	var bv = x - a
	var av = x - bv
	var br = b - bv
	var ar = a - av
	if(result) {
		result[0] = ar + br
		result[1] = x
		return result
	}
	return [ar+br, x]
}
},{}]},{},[7])(7)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYmFieWxvbi1oZWxwZXIuanMiLCJsaWIvY2R0MmQtaGVscGVyLmpzIiwibGliL2RyYXctaGVscGVyLmpzIiwibGliL2V4cG9ydC1oZWxwZXIuanMiLCJsaWIvZXh0cnVkZXIuanMiLCJsaWIvZ2VvbS1oZWxwZXIuanMiLCJsaWIvaW5kZXguanMiLCJsaWIvcGF0aC1oZWxwZXIuanMiLCJsaWIvdXYtaGVscGVyLmpzIiwibm9kZV9tb2R1bGVzL2JpbmFyeS1zZWFyY2gtYm91bmRzL3NlYXJjaC1ib3VuZHMuanMiLCJub2RlX21vZHVsZXMvY2R0MmQvY2R0MmQuanMiLCJub2RlX21vZHVsZXMvY2R0MmQvbGliL2RlbGF1bmF5LmpzIiwibm9kZV9tb2R1bGVzL2NkdDJkL2xpYi9maWx0ZXIuanMiLCJub2RlX21vZHVsZXMvY2R0MmQvbGliL21vbm90b25lLmpzIiwibm9kZV9tb2R1bGVzL2NkdDJkL2xpYi90cmlhbmd1bGF0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2NsaXBwZXItbGliL2NsaXBwZXIuanMiLCJub2RlX21vZHVsZXMvcm9idXN0LWluLXNwaGVyZS9pbi1zcGhlcmUuanMiLCJub2RlX21vZHVsZXMvcm9idXN0LW9yaWVudGF0aW9uL29yaWVudGF0aW9uLmpzIiwibm9kZV9tb2R1bGVzL3JvYnVzdC1zY2FsZS9yb2J1c3Qtc2NhbGUuanMiLCJub2RlX21vZHVsZXMvcm9idXN0LXN1YnRyYWN0L3JvYnVzdC1kaWZmLmpzIiwibm9kZV9tb2R1bGVzL3JvYnVzdC1zdW0vcm9idXN0LXN1bS5qcyIsIm5vZGVfbW9kdWxlcy90d28tcHJvZHVjdC90d28tcHJvZHVjdC5qcyIsIm5vZGVfbW9kdWxlcy90d28tc3VtL3R3by1zdW0uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdHdOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgYmFieWxvbkhlbHBlciA9IHtcblxuXG5zd2FwQWxsVG9CYWJ5bG9uKGdlb21zKXtcbiAgICBPYmplY3QudmFsdWVzKGdlb21zKS5mb3JFYWNoKCBnID0+IGJhYnlsb25IZWxwZXIuc3dhcFRvQmFieWxvbihnKSk7XG59LFxuXG5zd2FwVG9CYWJ5bG9uKGdlb20pe1xuICAgIGlmKCFnZW9tKXtyZXR1cm47fVxuICAgIGJhYnlsb25IZWxwZXIuc3dhcFZhbHVlc1laKGdlb20ubm9ybWFscyk7XG4gICAgYmFieWxvbkhlbHBlci5zd2FwVmFsdWVzWVooZ2VvbS5wb2ludHMpO1xuICAgIGJhYnlsb25IZWxwZXIuc3dhcFZhbHVlc1RyaWFuZ2xlKGdlb20uZmFjZXMpO1xuXG59LFxuXG5zd2FwVmFsdWVzWVooYXJyYXkpIHtcbiAgICBsZXQgb2xkWTtcbiAgICBjb25zdCBzdGVwID0gMztcbiAgICBjb25zdCBZID0gMTtcbiAgICBjb25zdCBaID0gMjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSArPSBzdGVwKSB7XG4gICAgICAgIG9sZFkgPSBhcnJheVtpICsgWV07XG4gICAgICAgIGFycmF5W2kgKyBZXSA9IC1hcnJheVtpICsgWl07XG4gICAgICAgIGFycmF5W2kgKyBaXSA9IC1vbGRZO1xuICAgIH1cbn0sXG5cbnN3YXBWYWx1ZXNUcmlhbmdsZShhcnJheSkge1xuICAgIGxldCBvbGRJZHg7XG4gICAgY29uc3Qgc3RlcCA9IDM7XG4gICAgY29uc3QgWSA9IDE7XG4gICAgY29uc3QgWiA9IDI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkgKz0gc3RlcCkge1xuICAgICAgICBvbGRJZHggPSBhcnJheVtpICsgWV07XG4gICAgICAgIGFycmF5W2kgKyBZXSA9IGFycmF5W2kgKyBaXTtcbiAgICAgICAgYXJyYXlbaSArIFpdID0gb2xkSWR4O1xuICAgIH1cbn0sXG5cbn07XG5tb2R1bGUuZXhwb3J0cz0gYmFieWxvbkhlbHBlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBjZHQyZCA9IHJlcXVpcmUoJ2NkdDJkJyk7XG5cbnZhciBjZHQyZEhlbHBlciA9IHtcblxuXG4gICAgY29tcHV0ZVRyaWFuZ3VsYXRpb246IGZ1bmN0aW9uKHBvaW50cywgb3B0aW9ucykge1xuICAgICAgICAvLyBsZXQgcG9pbnRzPSB4b3IuY29uY2F0KGludGVyc2VjdGlvbikuY29uY2F0KHBhdGhPdXRlcik7XG4gICAgICAgIGxldCBjZHRQb2ludHMgPSBjZHQyZEhlbHBlci5jbGlwcGVyVG9jZHQyZChwb2ludHMpO1xuICAgICAgICBsZXQgY2R0RWRnZXMgPSBjZHQyZEhlbHBlci5wYXRoc1RvRWRnZXMocG9pbnRzKTtcbiAgICAgICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIGV4dGVyaW9yOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBpbnRlcmlvcjogdHJ1ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdHJpYW5nbGVzID0gY2R0MmQoY2R0UG9pbnRzLCBjZHRFZGdlcywgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwb2ludHM6IGNkdFBvaW50cyxcbiAgICAgICAgICAgIHRyaWFuZ2xlczogdHJpYW5nbGVzXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIHBhdGhzVG9FZGdlczogZnVuY3Rpb24ocGF0aHMpIHtcbiAgICAgICAgbGV0IHJlcyA9IFtdO1xuICAgICAgICBsZXQgb2Zmc2V0ID0gMDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRocy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcmVzID0gcmVzLmNvbmNhdChjZHQyZEhlbHBlci5wYXRoVG9FZGdlcyhwYXRoc1tpXSwgb2Zmc2V0KSk7XG4gICAgICAgICAgICBvZmZzZXQgKz0gcGF0aHNbaV0ubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSxcblxuICAgIHBhdGhUb0VkZ2VzOiBmdW5jdGlvbihwYXRoLCBvZmZzZXQpIHtcbiAgICAgICAgbGV0IHJlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICByZXMucHVzaChbb2Zmc2V0ICsgaSwgb2Zmc2V0ICsgaSArIDFdKTtcbiAgICAgICAgfVxuICAgICAgICByZXMucHVzaChbb2Zmc2V0ICsgcGF0aC5sZW5ndGggLSAxLCBvZmZzZXRdKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgY2xpcHBlclRvY2R0MmQ6IGZ1bmN0aW9uKHBvaW50cykge1xuICAgICAgICBsZXQgcmVzID0gW107XG4gICAgICAgIGZvciAobGV0IGkgaW4gcG9pbnRzKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBqIGluIHBvaW50c1tpXSkge1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKGNkdDJkSGVscGVyLmNsaXBwZXJQb2ludFRvY2R0MmRQb2ludChwb2ludHNbaV1bal0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cbiAgICBjbGlwcGVyUG9pbnRUb2NkdDJkUG9pbnQ6IGZ1bmN0aW9uKHBvaW50KSB7XG4gICAgICAgIHJldHVybiBbcG9pbnQuWCwgcG9pbnQuWV07XG4gICAgfSxcblxufTtcbm1vZHVsZS5leHBvcnRzID0gY2R0MmRIZWxwZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIHBhdGhIZWxwZXI9IHJlcXVpcmUoXCIuL3BhdGgtaGVscGVyLmpzXCIpO1xuXG52YXIgZHJhd0hlbHBlcj17XG5cbmdldFRvcFRyaWFuZ2xlc0J5RGVwdGg6IGZ1bmN0aW9uKHRvcG9QYXRoc0J5RGVwdGgsIG9mZnNldCA9IDApIHtcbiAgICBsZXQgZ2VvbUJ5RGVwdGggPSBbXTtcbiAgICBmb3IgKGxldCBpIGluIHRvcG9QYXRoc0J5RGVwdGgpIHtcbiAgICAgICAgbGV0IHRvdGFsdG9wbyA9IHRvcG9QYXRoc0J5RGVwdGhbaV0ucG9zLmNvbmNhdCh0b3BvUGF0aHNCeURlcHRoW2ldLm5lZyk7XG4gICAgICAgIGdlb21CeURlcHRoLnB1c2goY2R0MmRIZWxwZXIuY29tcHV0ZVRyaWFuZ3VsYXRpb24odG90YWx0b3BvKSk7XG4gICAgICAgIGdlb21CeURlcHRoW2ldLmRlcHRoID0gdG9wb1BhdGhzQnlEZXB0aFtpXS5kZXB0aDtcbiAgICB9XG4gICAgcmV0dXJuIGdlb21CeURlcHRoO1xufSxcblxuZHJhd1BhdGhzOiBmdW5jdGlvbihjdHgsIHBhdGhzLCBwb3NpdGlvbiwgZmlsbENvbG9ycywgc3Ryb2tlQ29sb3JzLCBmaWxsTW9kZXMpIHtcbiAgICBpZiAoIWZpbGxNb2RlcykgZmlsbE1vZGVzID0gW107XG4gICAgZm9yIChsZXQgaSBpbiBwYXRocykge1xuICAgICAgICBkcmF3SGVscGVyLmRyYXdQYXRoKGN0eCwgcGF0aHNbaV0sIHBvc2l0aW9uLCBmaWxsQ29sb3JzW2ldLCBzdHJva2VDb2xvcnNbaV0sIGZpbGxNb2Rlc1tpXSk7XG4gICAgfVxufSxcblxuZHJhd1BhdGg6IGZ1bmN0aW9uKGN0eCwgcGF0aFRvRHJhdywgcG9zaXRpb24sIGZpbGxDb2xvciwgc3Ryb2tlQ29sb3IsIGZpbGxNb2RlKSB7XG4gICAgaWYgKCFwb3NpdGlvbikgcG9zaXRpb24gPSB7XG4gICAgICAgIFg6IDAsXG4gICAgICAgIFk6IDBcbiAgICB9O1xuICAgIGxldCBwYXRoID0gW107XG4gICAgaWYgKHBhdGhUb0RyYXcubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgZm9yIChsZXQgaSBpbiBwYXRoVG9EcmF3KSB7XG4gICAgICAgIHBhdGgucHVzaCh7XG4gICAgICAgICAgICBYOiBwYXRoVG9EcmF3W2ldLlggKyBwb3NpdGlvbi5YLFxuICAgICAgICAgICAgWTogcGF0aFRvRHJhd1tpXS5ZICsgcG9zaXRpb24uWVxuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIGN0eC5saW5lV2lkdGggPSAyO1xuICAgIGlmICghZmlsbENvbG9yKSB7XG4gICAgICAgIGZpbGxDb2xvciA9ICdibGFjayc7XG4gICAgfVxuICAgIGN0eC5maWxsU3R5bGUgPSBmaWxsQ29sb3I7XG4gICAgaWYgKCFzdHJva2VDb2xvcikge1xuICAgICAgICBzdHJva2VDb2xvciA9IFwiYmxhY2tcIjtcbiAgICB9XG4gICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlQ29sb3I7XG4gICAgaWYgKCFmaWxsTW9kZSkge1xuICAgICAgICBmaWxsTW9kZSA9IFwibm9uemVyb1wiO1xuICAgIH1cbiAgICBjdHgubW96RmlsbFJ1bGUgPSBmaWxsTW9kZTtcblxuICAgIC8vRHJhd3MgdGhlIGlubmVyIG9mIHRoZSBwYXRoXG4gICAgdmFyIHBhdGhGaWxsID0gbmV3IFBhdGgyRCgpO1xuICAgIHBhdGhGaWxsLm1vdmVUbyhwYXRoWzBdLlgsIHBhdGhbMF0uWSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHBhdGhGaWxsLmxpbmVUbyhwYXRoW2ldLlgsIHBhdGhbaV0uWSk7XG4gICAgfVxuICAgIHBhdGhGaWxsLmxpbmVUbyhwYXRoWzBdLlgsIHBhdGhbMF0uWSk7XG4gICAgY3R4LmZpbGwocGF0aEZpbGwsIGZpbGxNb2RlKTtcbiAgICBjdHguY2xvc2VQYXRoKCk7XG4gICAgLy9EcmF3cyB0aGUgYXJyb3dzXG4gICAgdmFyIHBhdGhBcnJvdyA9IG5ldyBQYXRoMkQoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgIGRyYXdIZWxwZXIuZHJhd0Fycm93KGN0eCwgcGF0aFtpXSwgcGF0aFtpICsgMV0pO1xuICAgIH1cbiAgICBkcmF3SGVscGVyLmRyYXdBcnJvdyhjdHgsIHBhdGhbcGF0aC5sZW5ndGggLSAxXSwgcGF0aFswXSk7XG5cbiAgICAvL0RyYXdzIHRoZSBkb3RzOlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICBkcmF3SGVscGVyLmRyYXdEb3QoY3R4LCBwYXRoW2ldKTtcbiAgICB9XG59LFxuZHJhd0Fycm93KGN0eCwgYmVnaW4sIGVuZCkge1xuXG4gICAgY3R4LnNhdmUoKTtcbiAgICBjdHgubW92ZVRvKGJlZ2luLlgsIGJlZ2luLlkpO1xuICAgIGN0eC5saW5lVG8oZW5kLlgsIGVuZC5ZKTtcbiAgICBjdHguc3Ryb2tlKCk7XG5cbiAgICBsZXQgdmVjdCA9IHtcbiAgICAgICAgWDogZW5kLlggLSBiZWdpbi5YLFxuICAgICAgICBZOiBlbmQuWSAtIGJlZ2luLllcbiAgICB9O1xuICAgIGxldCBub3JtID0gTWF0aC5zcXJ0KHZlY3QuWCAqIHZlY3QuWCArIHZlY3QuWSAqIHZlY3QuWSk7XG4gICAgdmVjdCA9IHtcbiAgICAgICAgWDogdmVjdC5YIC8gbm9ybSxcbiAgICAgICAgWTogdmVjdC5ZIC8gbm9ybVxuICAgIH07XG5cbiAgICBsZXQgYW5nbGUgPSBNYXRoLlBJIC8gMiArIE1hdGguYXRhbjIodmVjdC5ZLCB2ZWN0LlgpO1xuXG4gICAgY3R4LnRyYW5zbGF0ZShiZWdpbi5YICsgdmVjdC5YICogbm9ybSAqIDAuNzUsIGJlZ2luLlkgKyB2ZWN0LlkgKiBub3JtICogMC43NSk7XG4gICAgY3R4LnJvdGF0ZShhbmdsZSk7XG5cbiAgICBsZXQgc2l6ZUEgPSA1O1xuICAgIGxldCBicmFuY2gxID0ge1xuICAgICAgICBYOiBzaXplQSxcbiAgICAgICAgWTogc2l6ZUFcbiAgICB9O1xuICAgIGxldCBicmFuY2gyID0ge1xuICAgICAgICBYOiAtc2l6ZUEsXG4gICAgICAgIFk6IHNpemVBXG4gICAgfTtcblxuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHgubW92ZVRvKGJyYW5jaDEuWCwgYnJhbmNoMS5ZKTtcbiAgICBjdHgubGluZVRvKDAsIDApO1xuICAgIGN0eC5saW5lVG8oYnJhbmNoMi5YLCBicmFuY2gyLlkpO1xuICAgIGN0eC5zdHJva2UoKTtcblxuICAgIGN0eC5yZXN0b3JlKCk7XG59LFxuXG5kcmF3RG90OiBmdW5jdGlvbihjdHgsIGRvdCkge1xuXG4gICAgY3R4LmZpbGxTdHlsZSA9IFwicmVkXCI7XG4gICAgY3R4LmZpbGxSZWN0KGRvdC5YLCBkb3QuWSwgNCwgNCk7XG59LFxuXG5kcmF3VHJpYW5nbGVzOiBmdW5jdGlvbihjdHgsIHBvaW50c0FuZFRyaWFuZ2xlcywgdHJhbnNsYXRpb24pIHtcbiAgICBmb3IgKGxldCBpIGluIHBvaW50c0FuZFRyaWFuZ2xlcy50cmlhbmdsZXMpIHtcbiAgICAgICAgY2R0MmRIZWxwZXIuZHJhd1RyaWFuZ2xlKGN0eCwgcG9pbnRzQW5kVHJpYW5nbGVzLnBvaW50cywgcG9pbnRzQW5kVHJpYW5nbGVzLnRyaWFuZ2xlc1tpXSwgdHJhbnNsYXRpb24pO1xuICAgIH1cbn0sXG5cbmRyYXdUcmlhbmdsZTogZnVuY3Rpb24oY3R4LCBwb2ludHMsIHRyaWFuZ2xlLCB0cmFuc2xhdGlvbikge1xuICAgIGlmICghdHJhbnNsYXRpb24pIHtcbiAgICAgICAgdHJhbnNsYXRpb24gPSB7XG4gICAgICAgICAgICBYOiAwLFxuICAgICAgICAgICAgWTogMFxuICAgICAgICB9O1xuICAgIH1cbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4Lm1vdmVUbyhwb2ludHNbdHJpYW5nbGVbMF1dWzBdICsgdHJhbnNsYXRpb24uWCwgcG9pbnRzW3RyaWFuZ2xlWzBdXVsxXSArIHRyYW5zbGF0aW9uLlkpO1xuICAgIGN0eC5saW5lVG8ocG9pbnRzW3RyaWFuZ2xlWzFdXVswXSArIHRyYW5zbGF0aW9uLlgsIHBvaW50c1t0cmlhbmdsZVsxXV1bMV0gKyB0cmFuc2xhdGlvbi5ZKTtcbiAgICBjdHgubGluZVRvKHBvaW50c1t0cmlhbmdsZVsyXV1bMF0gKyB0cmFuc2xhdGlvbi5YLCBwb2ludHNbdHJpYW5nbGVbMl1dWzFdICsgdHJhbnNsYXRpb24uWSk7XG4gICAgY3R4LmxpbmVUbyhwb2ludHNbdHJpYW5nbGVbMF1dWzBdICsgdHJhbnNsYXRpb24uWCwgcG9pbnRzW3RyaWFuZ2xlWzBdXVsxXSArIHRyYW5zbGF0aW9uLlkpO1xuICAgIGN0eC5zdHJva2UoKTtcblxufVxuXG59O1xubW9kdWxlLmV4cG9ydHM9IGRyYXdIZWxwZXI7XG4iLCJcInVzZS1zdHJpY3RcIjtcblxuXG52YXIgZXhwb3J0SGVscGVyID0ge1xuXG5cbiAgICBtZXNoZXNUb09iaihtZXNoZXMpe1xuICAgICAgICBsZXQgcmVzPVwiXCI7XG5cbiAgICAgICAgZm9yKGxldCBpIGluIG1lc2hlcyl7XG4gICAgICAgICAgICByZXMrPWV4cG9ydEhlbHBlci5tZXNoVG9PYmoobWVzaGVzLmluTWVzaCwgXCJtZXNoXCIraSk7XG4gICAgICAgICAgICByZXMgKz0gXCJcXG5cIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSxcblxuICAgIG1lc2hUb09iajogZnVuY3Rpb24obWVzaCwgbWVzaE5hbWUpIHtcbiAgICAgICAgbGV0IHJlcyA9IFwibyBcIiArIG1lc2hOYW1lICsgXCJcXG5cXG5cIjtcbiAgICAgICAgcmVzICs9IGV4cG9ydEhlbHBlci52ZXJ0aWNlc1RvT2JqKG1lc2gucG9pbnRzKTtcbiAgICAgICAgcmVzICs9IFwiXFxuXCI7XG4gICAgICAgIHJlcyArPSBleHBvcnRIZWxwZXIubm9ybWFsc1RvT2JqKG1lc2gubm9ybWFscyk7XG4gICAgICAgIHJlcys9XCJcXG5cIjtcbiAgICAgICAgcmVzKz0gZXhwb3J0SGVscGVyLnRleHR1cmVzVG9PYmoobWVzaC51dnMpO1xuICAgICAgICByZXMgKz0gXCJcXG5cIjtcbiAgICAgICAgcmVzICs9IGV4cG9ydEhlbHBlci5mYWNlc1RvT2JqKG1lc2guZmFjZXMpO1xuICAgICAgICByZXR1cm4gcmVzO1xuXG4gICAgfSxcbiAgICB2ZXJ0aWNlc1RvT2JqOiBmdW5jdGlvbih2ZXJ0aWNlcykge1xuXG4gICAgICAgIHJldHVybiBleHBvcnRIZWxwZXIuc3RlcFRocmVlQXJyYXlUb09iaih2ZXJ0aWNlcywgXCJ2XCIpO1xuICAgIH0sXG5cbiAgICB0ZXh0dXJlc1RvT2JqOiBmdW5jdGlvbih0ZXh0dXJlcykge1xuICAgICAgICByZXR1cm4gZXhwb3J0SGVscGVyLnN0ZXBUaHJlZUFycmF5VG9PYmoodGV4dHVyZXMsIFwidnRcIik7XG4gICAgfSxcblxuICAgIG5vcm1hbHNUb09iajogZnVuY3Rpb24obm9ybWFscykge1xuICAgICAgICByZXR1cm4gZXhwb3J0SGVscGVyLnN0ZXBUaHJlZUFycmF5VG9PYmoobm9ybWFscywgXCJ2dFwiKTtcbiAgICB9LFxuXG4gICAgZmFjZXNUb09iajogZnVuY3Rpb24oZmFjZXMpIHtcbiAgICAgICAgbGV0IHJlcyA9IFwiXCI7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmFjZXMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgICAgIHJlcyArPSBcImYgXCIgKyBleHBvcnRIZWxwZXIuZmFjZUVsZW1lbnQoZmFjZXNbaV0pICsgXCIgXCIgK1xuICAgICAgICAgICAgICAgIGV4cG9ydEhlbHBlci5mYWNlRWxlbWVudChmYWNlc1tpICsgMV0pICsgXCIgXCIgK1xuICAgICAgICAgICAgICAgIGV4cG9ydEhlbHBlci5mYWNlRWxlbWVudChmYWNlc1tpICsgMl0pICsgXCJcXG5cIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG4gICAgZmFjZUVsZW1lbnQ6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHJldHVybiBcInZcIiArIGluZGV4ICsgXCIvdnRcIiArIGluZGV4ICsgXCIvdm5cIiArIGluZGV4O1xuICAgIH0sXG5cblxuICAgIHN0ZXBUaHJlZUFycmF5VG9PYmo6IGZ1bmN0aW9uKGFycmF5LCBwcmVmaXgpIHtcbiAgICAgICAgbGV0IHJlcyA9IFwiXCI7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgICAgIHJlcyArPSBwcmVmaXggKyBcIiBcIiArIGFycmF5W2ldICsgXCIgXCIgKyBhcnJheVtpICsgMV0gKyBcIiBcIiArIGFycmF5W2kgKyAyXSArIFwiXFxuXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRIZWxwZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgY2xpcHBlckxpYiA9IHJlcXVpcmUoXCJjbGlwcGVyLWxpYlwiKTtcbmNvbnN0IHBhdGhIZWxwZXIgPSByZXF1aXJlKFwiLi9wYXRoLWhlbHBlci5qc1wiKTtcbmNvbnN0IGdlb21IZWxwZXIgPSByZXF1aXJlKFwiLi9nZW9tLWhlbHBlci5qc1wiKTtcbmNvbnN0IGNkdDJkSGVscGVyID0gcmVxdWlyZShcIi4vY2R0MmQtaGVscGVyLmpzXCIpO1xuY29uc3QgdXZIZWxwZXIgPSByZXF1aXJlKFwiLi91di1oZWxwZXIuanNcIik7XG5jb25zdCBleHBvcnRIZWxwZXIgPSByZXF1aXJlKFwiLi9leHBvcnQtaGVscGVyLmpzXCIpO1xuY29uc3QgYmFieWxvbkhlbHBlciA9IHJlcXVpcmUoXCIuL2JhYnlsb24taGVscGVyLmpzXCIpO1xuXG52YXIgZXh0cnVkZXIgPSB7XG5cbiAgICAvKipcbiAgICAgKiByZXR1cm5zIGEgbWVzaCBmcm9tIGFuIG91dGVyIHNoYXBlIGFuZCBob2xlc1xuICAgICAqL1xuICAgIGdldEdlb21ldHJ5OiBmdW5jdGlvbihvdXRlclNoYXBlLCBob2xlcywgb3B0aW9ucykge1xuICAgICAgICAvL2dldCB0aGUgdG9wb2xvZ3kgMkQgcGF0aHMgYnkgZGVwdGhcbiAgICAgICAgbGV0IGRhdGEgPSBleHRydWRlci5nZXREYXRhQnlEZXB0aChvdXRlclNoYXBlLCBob2xlcyk7XG4gICAgICAgIGxldCBvdXRlclBhdGhzQnlEZXB0aD0gZGF0YS5vdXRlclBhdGhzQnlEZXB0aDtcbiAgICAgICAgbGV0IGlubmVyUGF0aHNCeURlcHRoPSBkYXRhLmlubmVyUGF0aHNCeURlcHRoO1xuICAgICAgICBsZXQgaG9ycml6b250YWxQYXRoc0J5RGVwdGg9IGRhdGEuaG9ycml6b250YWxQYXRoc0J5RGVwdGg7XG5cblxuICAgICAgICB1dkhlbHBlci5tYXBWZXJ0aWNhbChvdXRlclBhdGhzQnlEZXB0aCwgb3V0ZXJTaGFwZSwgb3B0aW9ucyk7XG5cbiAgICAgICAgbGV0IHJlcyA9IHt9O1xuXG4gICAgICAgIGlmIChvcHRpb25zLmZyb250TWVzaCkge1xuICAgICAgICAgICAgcmVzLmZyb250TWVzaCA9IGV4dHJ1ZGVyLmdldEhvcnJpem9udGFsR2VvbShob3JyaXpvbnRhbFBhdGhzQnlEZXB0aCwge1xuICAgICAgICAgICAgICAgIGZyb250TWVzaDogdHJ1ZVxuICAgICAgICAgICAgfSwwLGZhbHNlKTtcbiAgICAgICAgICAgIHV2SGVscGVyLm1hcEhvcnJpem9udGFsKGlubmVyUGF0aHNCeURlcHRoLCBvdXRlclNoYXBlLCByZXMuZnJvbnRNZXNoLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5iYWNrTWVzaCkge1xuICAgICAgICAgICAgcmVzLmJhY2tNZXNoID0gZXh0cnVkZXIuZ2V0SG9ycml6b250YWxHZW9tKGhvcnJpem9udGFsUGF0aHNCeURlcHRoLCB7XG4gICAgICAgICAgICAgICAgYmFja01lc2g6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdXZIZWxwZXIubWFwSG9ycml6b250YWwoaW5uZXJQYXRoc0J5RGVwdGgsIG91dGVyU2hhcGUsIHJlcy5iYWNrTWVzaCwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuaW5NZXNoKSB7XG4gICAgICAgICAgICB1dkhlbHBlci5tYXBWZXJ0aWNhbChpbm5lclBhdGhzQnlEZXB0aCwgb3V0ZXJTaGFwZSwgb3B0aW9ucyk7XG4gICAgICAgICAgICBsZXQgaW5NZXNoSG9yID0gZXh0cnVkZXIuZ2V0SG9ycml6b250YWxHZW9tKGhvcnJpem9udGFsUGF0aHNCeURlcHRoLCB7XG4gICAgICAgICAgICAgICAgaW5NZXNoOiB0cnVlXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGV0IG9mZnNldCA9IDA7XG4gICAgICAgICAgICBpZiAoaW5NZXNoSG9yKSB7XG4gICAgICAgICAgICAgICAgdXZIZWxwZXIubWFwSG9ycml6b250YWwoaW5uZXJQYXRoc0J5RGVwdGgsIG91dGVyU2hhcGUsIGluTWVzaEhvciwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gaW5NZXNoSG9yLm9mZnNldDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGluTWVzaFZlcnQgPSBleHRydWRlci5nZXRWZXJ0aWNhbEdlb20oaW5uZXJQYXRoc0J5RGVwdGgsICtvZmZzZXQsdHJ1ZSk7XG4gICAgICAgICAgICBpZiAoaW5NZXNoVmVydCkge1xuICAgICAgICAgICAgICAgIG9mZnNldD1pbk1lc2hWZXJ0Lm9mZnNldDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzLmluTWVzaCA9IGdlb21IZWxwZXIubWVyZ2VNZXNoZXMoW2luTWVzaEhvcixpbk1lc2hWZXJ0XSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLm91dE1lc2gpIHtcbiAgICAgICAgICAgIGxldCBvdXRNZXNoID0gZXh0cnVkZXIuZ2V0VmVydGljYWxHZW9tKG91dGVyUGF0aHNCeURlcHRoLCAwLGZhbHNlKTtcbiAgICAgICAgICAgIHJlcy5vdXRNZXNoID0gb3V0TWVzaDtcbiAgICAgICAgfVxuXG5cblxuICAgICAgICBpZiAob3B0aW9ucy5zd2FwVG9CYWJ5bG9uKSB7XG4gICAgICAgICAgICBiYWJ5bG9uSGVscGVyLnN3YXBBbGxUb0JhYnlsb24ocmVzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cbiAgICBnZXRWZXJ0aWNhbEdlb206IGZ1bmN0aW9uKGlubmVyUGF0aHNCeURlcHRoLCBvZmZzZXQgPSAwLGludmVydE5vcm1hbCA9IGZhbHNlKSB7XG4gICAgICAgIGxldCBnZW9tID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgaW5kZXhEZXB0aCA9IGlubmVyUGF0aHNCeURlcHRoLmxlbmd0aCAtIDE7IGluZGV4RGVwdGggPiAwOyBpbmRleERlcHRoLS0pIHtcbiAgICAgICAgICAgIGxldCBwYXRoc0F0RGVwdGggPSBpbm5lclBhdGhzQnlEZXB0aFtpbmRleERlcHRoXS5wYXRocztcbiAgICAgICAgICAgIC8vZm9yIGVhY2ggcG9pbnQgYXQgZWFjaCBwYXRoIGF0IGVhY2ggZGVwdGggd2UgbG9vayBmb3IgdGhlIGNvcnJlc3BvbmRpbmcgcG9pbnQgaW50byB0aGUgdXBwZXIgcGF0aHM6XG4gICAgICAgICAgICBmb3IgKGxldCBwYXRoIG9mIHBhdGhzQXREZXB0aCkge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGluZGV4UHREd24gaW4gcGF0aCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgaWR4UHREd24gPSBpbmRleFB0RHduO1xuICAgICAgICAgICAgICAgICAgICBsZXQgaWR4TlB0RHduID0gKCgraW5kZXhQdER3bikgKyAxKSAlIHBhdGgubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBsZXQgY3Vycmdlb20gPSBnZW9tSGVscGVyLmdldE9uZVZlcnRpY2FsR2VvbShpZHhQdER3biwgaWR4TlB0RHduLCAraW5kZXhEZXB0aCwgcGF0aCwgaW5uZXJQYXRoc0J5RGVwdGgsICtvZmZzZXQsaW52ZXJ0Tm9ybWFsKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdXJyZ2VvbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZ2VvbS5wdXNoKGN1cnJnZW9tKTtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gY3Vycmdlb20ub2Zmc2V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ2VvbUhlbHBlci5tZXJnZU1lc2hlcyhnZW9tLCBmYWxzZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGdlb21ldHJ5IG9mIHRoZSBpbm5lciBob3JyaXpvbnRhbCBmYWNlc3NcbiAgICAgKi9cbiAgICBnZXRIb3JyaXpvbnRhbEdlb206IGZ1bmN0aW9uKGhvcnJpem9udGFsUGF0aHNCeURlcHRoLCBvcHRpb25zLCBvZmZzZXQgPSAwLGludmVydE5vcm1hbD1mYWxzZSkge1xuICAgICAgICAvL2dldHMgYWxsIHRoZSB0cmlhbmdsZXMgYnkgZGVwdGg6XG4gICAgICAgIGxldCB0cmlhbmdsZXNCeURlcHRoID0gW107XG4gICAgICAgIGxldCBpbm5lckhvckdlb20gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSBpbiBob3JyaXpvbnRhbFBhdGhzQnlEZXB0aCkge1xuICAgICAgICAgICAgbGV0IHRvdGFsdG9wbyA9IGhvcnJpem9udGFsUGF0aHNCeURlcHRoW2ldLnBhdGhzO1xuICAgICAgICAgICAgdHJpYW5nbGVzQnlEZXB0aC5wdXNoKGNkdDJkSGVscGVyLmNvbXB1dGVUcmlhbmd1bGF0aW9uKHRvdGFsdG9wbykpO1xuICAgICAgICAgICAgdHJpYW5nbGVzQnlEZXB0aFtpXS5kZXB0aCA9IGhvcnJpem9udGFsUGF0aHNCeURlcHRoW2ldLmRlcHRoO1xuXG4gICAgICAgIH1cbiAgICAgICAgLy8gZ2V0IHBvaW50cywgbm9ybWFsIGFuZCBmYWNlcyBmcm9tIGl0OlxuICAgICAgICBsZXQgaG9ycml6b250YWxHZW9tQnlEZXB0aCA9IGdlb21IZWxwZXIuZ2V0SG9ycml6b250YWxHZW9tKHRyaWFuZ2xlc0J5RGVwdGgsIG9wdGlvbnMsICtvZmZzZXQsaW52ZXJ0Tm9ybWFsKTtcbiAgICAgICAgcmV0dXJuIGdlb21IZWxwZXIubWVyZ2VNZXNoZXMoaG9ycml6b250YWxHZW9tQnlEZXB0aCwgZmFsc2UpO1xuICAgIH0sXG5cbiAgICBnZXREYXRhQnlEZXB0aDogZnVuY3Rpb24ob3V0ZXJTaGFwZSxob2xlcyl7XG4gICAgICAgIGxldCBvdXRlclBhdGhzPVtdO1xuICAgICAgICBsZXQgaW5uZXJQYXRocz1bXTtcbiAgICAgICAgbGV0IGhvcnJpem9udGFsUGF0aHM9W107XG5cbiAgICAgICAgcGF0aEhlbHBlci5zY2FsZVVwUGF0aChvdXRlclNoYXBlLnBhdGgpO1xuICAgICAgICBmb3IobGV0IGkgaW4gaG9sZXMpe1xuICAgICAgICAgICAgcGF0aEhlbHBlci5zY2FsZVVwUGF0aChob2xlc1tpXS5wYXRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBob2xlc0J5RGVwdGg9IGV4dHJ1ZGVyLmdldEhvbGVzQnlEZXB0aChob2xlcyxvdXRlclNoYXBlKTtcbiAgICAgICAgbGV0IG91dGVyPSBbb3V0ZXJTaGFwZS5wYXRoXTtcblxuICAgICAgICBsZXQgc3RhY2s9MDtcbiAgICAgICAgZm9yKGxldCBpPSBob2xlc0J5RGVwdGgubGVuZ3RoLTE7aT49MDtpLS0gKXtcbiAgICAgICAgICAgIC8vY29tcHV0ZSB0aGUgb3V0ZXIgcGF0aDpcbiAgICAgICAgICAgIGxldCByZW1vdmVGcm9tT3V0ZXI9IHBhdGhIZWxwZXIuZ2V0VW5pb25PZlBhdGhzKGhvbGVzQnlEZXB0aFtpXS5rZWVwLmNvbmNhdChob2xlc0J5RGVwdGhbaV0uc3RvcCkpO1xuICAgICAgICAgICAgbGV0IGRpZmZJbk91dD1wYXRoSGVscGVyLmdldERpZmZPZlBhdGhzKHJlbW92ZUZyb21PdXRlciwgb3V0ZXIpO1xuXG4gICAgICAgICAgICBpZihkaWZmSW5PdXQubGVuZ3RoPjApe1xuICAgICAgICAgICAgICAgIG91dGVyPSBwYXRoSGVscGVyLmdldERpZmZPZlBhdGhzKG91dGVyLCByZW1vdmVGcm9tT3V0ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3V0ZXJQYXRocy5wdXNoKG91dGVyKTtcblxuICAgICAgICAgICAgLy9maXQgdGhlIGlubmVyIHBhdGhzIGludG8gdGhlIG91dGVyOlxuICAgICAgICAgICAgbGV0IGlubmVyUGF0aD0gcGF0aEhlbHBlci5nZXRJbnRlck9mUGF0aHMoaG9sZXNCeURlcHRoW2ldLmtlZXAsIG91dGVyICk7XG4gICAgICAgICAgICBpbm5lclBhdGhzLnB1c2goaW5uZXJQYXRoKTtcblxuICAgICAgICAgICAgLy9jb21wdXRlcyB0aGUgaG9ycml6b250YWwgR2VvbTpcbiAgICAgICAgICAgIGxldCBob3JyaXpvbnRhbFBhdGg7XG4gICAgICAgICAgICAgaWYoaT09PTAgfHwgaT09PWhvbGVzQnlEZXB0aC5sZW5ndGgtMSl7XG4gICAgICAgICAgICAgICAgIGhvcnJpem9udGFsUGF0aCA9IG91dGVyLmNvbmNhdChpbm5lclBhdGgpO1xuICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGhvcnJpem9udGFsUGF0aCA9IHBhdGhIZWxwZXIuZ2V0RGlmZk9mUGF0aHMoaG9sZXNCeURlcHRoW2ldLnN0b3AsaG9sZXNCeURlcHRoW2ldLmtlZXApO1xuICAgICAgICAgICAgICAgIC8vMj0+IGZpdCBpdCBpbnRvIHRoZSBkZWVwZXIgb3V0ZXJcbiAgICAgICAgICAgICAgICBsZXQgZGVlcGVyT3V0ZXI9b3V0ZXI7XG4gICAgICAgICAgICAgICAgaWYoc3RhY2s+MCl7ZGVlcGVyT3V0ZXI9IG91dGVyUGF0aHNbc3RhY2stMV07fVxuICAgICAgICAgICAgICAgIGhvcnJpem9udGFsUGF0aD1wYXRoSGVscGVyLmdldEludGVyT2ZQYXRocyhob3JyaXpvbnRhbFBhdGgsZGVlcGVyT3V0ZXIpO1xuICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGhvcnJpem9udGFsUGF0aHMucHVzaChob3JyaXpvbnRhbFBhdGgpO1xuICAgICAgICAgICAgc3RhY2srKztcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihsZXQgaSBpbiBvdXRlclBhdGhzKXtcbiAgICAgICAgICAgIG91dGVyUGF0aHNbaV09IHBhdGhIZWxwZXIuc2ltcGxpZnlQYXRocyhvdXRlclBhdGhzW2ldKTtcbiAgICAgICAgICAgIGlubmVyUGF0aHNbaV09IHBhdGhIZWxwZXIuc2ltcGxpZnlQYXRocyhpbm5lclBhdGhzW2ldKTtcbiAgICAgICAgICAgIGhvcnJpem9udGFsUGF0aHNbaV09IHBhdGhIZWxwZXIuc2ltcGxpZnlQYXRocyhob3JyaXpvbnRhbFBhdGhzW2ldKTtcbiAgICAgICAgICAgIHBhdGhIZWxwZXIuc2V0RGlyZWN0aW9uUGF0aHMob3V0ZXJQYXRoc1tpXSwtMSk7XG4gICAgICAgICAgICBwYXRoSGVscGVyLnNldERpcmVjdGlvblBhdGhzKGlubmVyUGF0aHNbaV0sLTEpO1xuICAgICAgICAgICAgcGF0aEhlbHBlci5zZXREaXJlY3Rpb25QYXRocyhob3JyaXpvbnRhbFBhdGhzW2ldLDEpO1xuICAgICAgICAgICAgcGF0aEhlbHBlci5zY2FsZURvd25QYXRocyhvdXRlclBhdGhzW2ldKTtcbiAgICAgICAgICAgIHBhdGhIZWxwZXIuc2NhbGVEb3duUGF0aHMoaW5uZXJQYXRoc1tpXSk7XG4gICAgICAgICAgICBwYXRoSGVscGVyLnNjYWxlRG93blBhdGhzKGhvcnJpem9udGFsUGF0aHNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHBhdGhIZWxwZXIuc2NhbGVEb3duUGF0aChvdXRlclNoYXBlLnBhdGgpO1xuXG4gICAgICAgIGZvcihsZXQgaSBpbiBob2xlcyl7XG4gICAgICAgICAgICBwYXRoSGVscGVyLnNjYWxlRG93blBhdGgoaG9sZXNbaV0ucGF0aCk7XG4gICAgICAgIH1cblxuICAgICAgICBvdXRlclBhdGhzPSBvdXRlclBhdGhzLnJldmVyc2UoKTtcbiAgICAgICAgaW5uZXJQYXRocz0gaW5uZXJQYXRocy5yZXZlcnNlKCk7XG4gICAgICAgIGhvcnJpem9udGFsUGF0aHM9IGhvcnJpem9udGFsUGF0aHMucmV2ZXJzZSgpO1xuXG5cbiAgICAgICAgZm9yKGxldCBpIGluIGhvbGVzQnlEZXB0aCl7XG4gICAgICAgICAgICBvdXRlclBhdGhzW2ldPSB7cGF0aHM6IG91dGVyUGF0aHNbaV0sIGRlcHRoOmhvbGVzQnlEZXB0aFtpXS5kZXB0aH07XG4gICAgICAgICAgICBpbm5lclBhdGhzW2ldPSB7cGF0aHM6IGlubmVyUGF0aHNbaV0sIGRlcHRoOmhvbGVzQnlEZXB0aFtpXS5kZXB0aH07XG4gICAgICAgICAgICBob3JyaXpvbnRhbFBhdGhzW2ldPSB7cGF0aHM6IGhvcnJpem9udGFsUGF0aHNbaV0sIGRlcHRoOmhvbGVzQnlEZXB0aFtpXS5kZXB0aH07XG5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyAgb3V0ZXJQYXRoc0J5RGVwdGggOiBvdXRlclBhdGhzLFxuICAgICAgICAgICAgICAgICAgaW5uZXJQYXRoc0J5RGVwdGg6IGlubmVyUGF0aHMsXG4gICAgICAgICAgICAgICAgICBob3JyaXpvbnRhbFBhdGhzQnlEZXB0aDogaG9ycml6b250YWxQYXRoc307XG5cblxuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqICBUYWtlcyBhbiBhcnJheSBvZiBwYXRocyByZXByZXNlbnRpbmcgaG9sZXMgYXQgZGlmZmVyZW50IGRlcHRocy5cbiAgICAgKiAgT25lIGRlcHRoIHZhbHVlLyBwYXRoLlxuICAgICAqICByZXR1cm5zIGFuIGFycmF5IG9mIHBhdGhzIGF0IGVhY2ggZGVwdGg6IHNpbXBsaWZ5IHRoZSBnZW9tZXRyeSBmb3IgZWFjaCBzdGFnZS5cbiAgICAgKi9cbiAgICBnZXRIb2xlc0J5RGVwdGg6IGZ1bmN0aW9uKGhvbGVzLCBvdXRlclNoYXBlKSB7XG5cbiAgICAgICAgLy9zZXRzIGFsbCBkZXB0aHMgZGVlcGVyIHRoYW4gb3V0ZXJEZXB0aCAgb3IgZXF1YWxzIHRvIDAgdG8gb3V0ZXJEZXB0aDpcbiAgICAgICAgaG9sZXMubWFwKGZ1bmN0aW9uKGVsdCkge1xuICAgICAgICAgICAgKGVsdC5kZXB0aCA+PSBvdXRlclNoYXBlLmRlcHRoIHx8IGVsdC5kZXB0aCA9PT0gMCkgPyBlbHQuZGVwdGggPSBvdXRlclNoYXBlLmRlcHRoICsgMTogZWx0LmRlcHRoID0gZWx0LmRlcHRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGhvbGVzLm1hcChmdW5jdGlvbihlbHQpIHtcbiAgICAgICAgICAgIHBhdGhIZWxwZXIuc2V0RGlyZWN0aW9uUGF0aChlbHQucGF0aCwgMSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vZ2V0IGFsbCBkZXB0aHM6XG4gICAgICAgIGxldCBkZXB0aHMgPSBuZXcgU2V0KCk7XG4gICAgICAgIGZvciAobGV0IGkgaW4gaG9sZXMpIHtcbiAgICAgICAgICAgIGlmIChob2xlc1tpXS5kZXB0aCA8IG91dGVyU2hhcGUuZGVwdGgpXG4gICAgICAgICAgICAgICAgZGVwdGhzLmFkZChob2xlc1tpXS5kZXB0aCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVwdGhzLmFkZCgwKTtcbiAgICAgICAgZGVwdGhzLmFkZChvdXRlclNoYXBlLmRlcHRoKTtcbiAgICAgICAgZGVwdGhzID0gQXJyYXkuZnJvbShkZXB0aHMpO1xuICAgICAgICBkZXB0aHMuc29ydChcbiAgICAgICAgICAgIGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYSAtIGI7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAvL2dldCBwYXRocyBieSBkZXB0aDpcbiAgICAgICAgbGV0IHJlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpIGluIGRlcHRocykge1xuICAgICAgICAgICAgbGV0IGRlZXBlckhvbGVzID0gaG9sZXMuZmlsdGVyKChzKSA9PiBzLmRlcHRoID4gZGVwdGhzW2ldKTtcbiAgICAgICAgICAgIGxldCBrZWVwPVtdO1xuICAgICAgICAgICAgZGVlcGVySG9sZXMubWFwKChzKSA9PiBrZWVwLnB1c2gocy5wYXRoKSk7XG5cbiAgICAgICAgICAgIGxldCBzdG9wSG9sZXMgPSBob2xlcy5maWx0ZXIoKHMpID0+IHMuZGVwdGggPT09IGRlcHRoc1tpXSk7XG4gICAgICAgICAgICBsZXQgc3RvcD1bXTtcbiAgICAgICAgICAgIHN0b3BIb2xlcy5tYXAoKHMpID0+IHN0b3AucHVzaChzLnBhdGgpKTtcblxuICAgICAgICAgICAgLy90YWtlIG9ubHkgdGhlIHBhdGhzIG9mIHRoZSBob2xlcyB3aGljaCByZWFjaCB0aGlzIGRlcHRoXG4gICAgICAgICAgICByZXMucHVzaCh7XG4gICAgICAgICAgICAgICAga2VlcDoga2VlcCxcbiAgICAgICAgICAgICAgICBzdG9wOiBzdG9wLFxuICAgICAgICAgICAgICAgIGRlcHRoOiBkZXB0aHNbaV1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSxcblxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4dHJ1ZGVyO1xuIiwiY29uc3QgcGF0aEhlbHBlciA9IHJlcXVpcmUoXCIuL3BhdGgtaGVscGVyLmpzXCIpO1xuY29uc3QgY2R0MmRIZWxwZXIgPSByZXF1aXJlKFwiLi9jZHQyZC1oZWxwZXIuanNcIik7XG5cblxudmFyIGdlb21IZWxwZXIgPSB7XG5cblxuICAgIG1lcmdlTWVzaGVzOiBmdW5jdGlvbihnZW9tcywgY29uc2lkZXJPZmZzZXQgPSB0cnVlKSB7XG4gICAgICAgIGxldCByZXMgPSBnZW9tc1swXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBnZW9tcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcmVzID0gZ2VvbUhlbHBlci5tZXJnZU1lc2gocmVzLCBnZW9tc1tpXSwgY29uc2lkZXJPZmZzZXQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSxcblxuICAgIG1lcmdlTWVzaDogZnVuY3Rpb24oZ2VvbTEsIGdlb20yLCBjb25zaWRlck9mZnNldCkge1xuICAgICAgICBpZiAoIWdlb20yKSByZXR1cm4gZ2VvbTE7XG4gICAgICAgIGlmICghZ2VvbTEpIHJldHVybiBnZW9tMjtcblxuICAgICAgICBpZiAoY29uc2lkZXJPZmZzZXQpIHtcbiAgICAgICAgICAgIGdlb20xLmZhY2VzLnB1c2goLi4uZ2VvbTIuZmFjZXMubWFwKGYgPT4gZiArICgrZ2VvbTEub2Zmc2V0KSkpO1xuICAgICAgICAgICAgZ2VvbTEub2Zmc2V0ID0gKCtnZW9tMS5vZmZzZXQpICsgKCtnZW9tMi5vZmZzZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2VvbTEuZmFjZXMucHVzaCguLi5nZW9tMi5mYWNlcyk7XG4gICAgICAgICAgICBnZW9tMS5vZmZzZXQgPSBNYXRoLm1heChnZW9tMS5vZmZzZXQsIGdlb20yLm9mZnNldCk7XG4gICAgICAgIH1cbiAgICAgICAgZ2VvbTEucG9pbnRzLnB1c2goLi4uZ2VvbTIucG9pbnRzKTtcbiAgICAgICAgZ2VvbTEubm9ybWFscy5wdXNoKC4uLmdlb20yLm5vcm1hbHMpO1xuICAgICAgICBpZihnZW9tMS51dnMgJiYgZ2VvbTIudXZzKVxuICAgICAgICB7XG4gICAgICAgICAgICBnZW9tMS51dnMucHVzaCguLi5nZW9tMi51dnMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBnZW9tMTtcbiAgICB9LFxuXG4gICAgLypcbiAgICAgKiBSZXR1cm5zIHR3byB0cmlhbmdsZXMgcmVwcmVzZW50aW5nIHRoZSBsYXJnZXIgZmFjZSB3ZSBjYW4gYnVpbGQgZnJvbSB0aGUgZWRnZSBwdER3bi0+blB0RHduXG4gICAgICovXG4gICAgZ2V0T25lVmVydGljYWxHZW9tOiBmdW5jdGlvbihpZHhQdER3biwgbklkeFB0RHduLCBpbmRleERlcHRoRHduLHBhdGhEd24sIHBhdGhzQnlEZXB0aCwgb2Zmc2V0ID0gMCxpbnZlcnROb3JtYWw9ZmFsc2UpIHtcbiAgICAgICAgbGV0IHB0RHduPSBwYXRoRHduW2lkeFB0RHduXTtcbiAgICAgICAgbGV0IG5QdER3bj0gcGF0aER3bltuSWR4UHREd25dO1xuICAgICAgICBsZXQgbWF0Y2ggPSBnZW9tSGVscGVyLmdldE1hdGNoRGVwdGhzKHB0RHduLCBuUHREd24sICtpbmRleERlcHRoRHduLCBwYXRoc0J5RGVwdGgpO1xuICAgICAgICBpZiAobWF0Y2g9PT11bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZGVwdGhEd249IHBhdGhzQnlEZXB0aFtpbmRleERlcHRoRHduXS5kZXB0aDtcbiAgICAgICAgbGV0IHJlcyA9IGdlb21IZWxwZXIuZ2V0UHRzTm9ybXNJbmR4MmQocHREd24sIG5QdER3biwgbWF0Y2gsIGRlcHRoRHduLCArb2Zmc2V0LGludmVydE5vcm1hbCk7XG5cbiAgICAgICAgcmVzLnV2cz1bXTtcbiAgICAgICAgLy9hZGQgdXZzOlxuICAgICAgICBnZW9tSGVscGVyLmFkZFV2c1RvVmVydEdlb20ocmVzLCAraWR4UHREd24scGF0aER3bixwYXRoc0J5RGVwdGgsIGluZGV4RGVwdGhEd24saW5kZXhEZXB0aER3bi0xKTtcblxuXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGRlcHRocyBhdCB3aGljaCB0aGV5IGFyZSB0d28gZWRnZXMgd2l0aCB0aGUgc2FtZSAyRCBjb29yZHMuXG4gICAgICogSWYgaXQgZG9lcyBub3QgZXhpc3RzIHN1Y2ggYSBlZGdlLCByZXR1cm5zIHRoZSBjdXJyZW50IGRlcHRoIGFuZCB0aGUgZGVwdGggYWJvdmVcbiAgICAgKi9cbiAgICBnZXRNYXRjaERlcHRoczogZnVuY3Rpb24ocHREd24sIG5QdER3biwgaW5kZXhEZXB0aCwgcGF0aHNCeURlcHRoKSB7XG4gICAgICAgIC8vZm9yIGVhY2ggZGVwdGggZGVlcGVyIHRoYW4gcGF0aFVwLHdlIGxvb2sgZm9yIGEgY29ycmVzcG9uZGluZyBwb2ludDpcbiAgICAgICAgbGV0IHJlcyA9IHBhdGhzQnlEZXB0aFtpbmRleERlcHRoIC0xXS5kZXB0aDtcbiAgICAgICAgbGV0IGZvdW5kPWZhbHNlO1xuICAgICAgICBmb3IgKGxldCBpID0gaW5kZXhEZXB0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBsZXQgcGF0aHNBdERlcHRoID0gcGF0aHNCeURlcHRoW2ldLnBhdGhzO1xuICAgICAgICAgICAgaWYoIXBhdGhzQXREZXB0aCl7Y29udGludWU7fVxuXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhdGhzQXREZXB0aC5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIC8vZm9yIGVhY2ggcGF0aCBhdCBlYWNoIGRlcHRoOlxuICAgICAgICAgICAgICAgIGxldCBwYXRoVXAgPSBwYXRoc0F0RGVwdGhbal07XG4gICAgICAgICAgICAgICAgbGV0IG1hdGNoMSA9IHBhdGhIZWxwZXIuZ2V0UG9pbnRNYXRjaChwYXRoVXAsIHB0RHduKTtcbiAgICAgICAgICAgICAgICBsZXQgbWF0Y2gyID0gcGF0aEhlbHBlci5nZXRQb2ludE1hdGNoKHBhdGhVcCwgblB0RHduKTtcbiAgICAgICAgICAgICAgICBsZXQgcGVyZmVjdE1hdGNoPSBtYXRjaDEgJiYgbWF0Y2gyICYmIChtYXRjaDIuaW5kZXggLSBtYXRjaDEuaW5kZXgpPT09MTtcblxuICAgICAgICAgICAgICAgIGlmKCFtYXRjaDEpe2NvbnRpbnVlO31cbiAgICAgICAgICAgICAgICBpZihwYXRoc0J5RGVwdGhbaV0ucGF0aHNbal1bbWF0Y2gxLmluZGV4XS5faG9sZXNJblZpc2l0ZWQpe3JldHVybjt9XG4gICAgICAgICAgICAgICAgcGF0aHNCeURlcHRoW2ldLnBhdGhzW2pdW21hdGNoMS5pbmRleF0uX2hvbGVzSW5WaXNpdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZihwZXJmZWN0TWF0Y2gpe1xuICAgICAgICAgICAgICAgICAgICByZXMgPSBwYXRoc0J5RGVwdGhbaV0uZGVwdGg7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1lbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhdGhzQnlEZXB0aFtpXS5kZXB0aDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cbiAgICBnZXRQdHNOb3Jtc0luZHgyZDogZnVuY3Rpb24ocG9pbnQyZDEsIHBvaW50MmQyLCBkZXB0aFVwLCBkZXB0aER3biwgb2Zmc2V0LGludmVydE5vcm1hbD1mYWxzZSkge1xuXG4gICAgICAgIGxldCBwb2ludDEgPSBnZW9tSGVscGVyLmdldFBvaW50Myhwb2ludDJkMSwgZGVwdGhVcCk7XG4gICAgICAgIGxldCBwb2ludDIgPSBnZW9tSGVscGVyLmdldFBvaW50Myhwb2ludDJkMSwgZGVwdGhEd24pO1xuICAgICAgICBsZXQgcG9pbnQzID0gZ2VvbUhlbHBlci5nZXRQb2ludDMocG9pbnQyZDIsIGRlcHRoRHduKTtcbiAgICAgICAgbGV0IHBvaW50NCA9IGdlb21IZWxwZXIuZ2V0UG9pbnQzKHBvaW50MmQyLCBkZXB0aFVwKTtcblxuICAgICAgICByZXR1cm4gZ2VvbUhlbHBlci5nZXRQdHNOb3Jtc0luZHgzZChbcG9pbnQxLCBwb2ludDIsIHBvaW50MywgcG9pbnQ0XSwgK29mZnNldCxpbnZlcnROb3JtYWwpO1xuICAgIH0sXG5cbiAgICBnZXRQdHNOb3Jtc0luZHgzZDogZnVuY3Rpb24ocG9pbnRzM2QsIG9mZnNldCxpbnZlcnROb3JtYWwpIHtcblxuICAgICAgICBsZXQgcmVzRmFjZXM7XG4gICAgICAgIGxldCBub3JtYWw7XG4gICAgICAgIGlmKGludmVydE5vcm1hbCl7XG4gICAgICAgICAgICByZXNGYWNlcz0gKFswLCAxLCAyLCAwLCAyLCAzXSkubWFwKGVsdCA9PiBlbHQgKyBvZmZzZXQpO1xuICAgICAgICAgICAgbm9ybWFsPSBnZW9tSGVscGVyLmdldE5vcm1hbFRvUGxhbihwb2ludHMzZFswXSwgcG9pbnRzM2RbMV0sIHBvaW50czNkWzJdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgICAgcmVzRmFjZXM9IChbMiwgMSwgMCwgMywgMiwgMF0pLm1hcChlbHQgPT4gZWx0ICsgb2Zmc2V0KTtcblxuICAgICAgICAgICAgLy8gcmVzRmFjZXM9IChbMiwgMSwgMCwgMywgMiwgMF0pLm1hcChlbHQgPT4gZWx0ICsgb2Zmc2V0KTtcbiAgICAgICAgICAgIG5vcm1hbD0gZ2VvbUhlbHBlci5nZXROb3JtYWxUb1BsYW4ocG9pbnRzM2RbMl0sIHBvaW50czNkWzFdLCBwb2ludHMzZFswXSk7XG4gICAgICAgIH1cblxuXG5cblxuICAgICAgICBsZXQgcmVzTm9ybSA9IFtdO1xuICAgICAgICByZXNOb3JtLnB1c2goLi4ubm9ybWFsKTtcbiAgICAgICAgcmVzTm9ybS5wdXNoKC4uLm5vcm1hbCk7XG4gICAgICAgIHJlc05vcm0ucHVzaCguLi5ub3JtYWwpO1xuICAgICAgICByZXNOb3JtLnB1c2goLi4ubm9ybWFsKTtcbiAgICAgICAgbGV0IHJlc1BvaW50cyA9IFtdO1xuICAgICAgICByZXNQb2ludHMucHVzaCguLi5wb2ludHMzZFswXSk7XG4gICAgICAgIHJlc1BvaW50cy5wdXNoKC4uLnBvaW50czNkWzFdKTtcbiAgICAgICAgcmVzUG9pbnRzLnB1c2goLi4ucG9pbnRzM2RbMl0pO1xuICAgICAgICByZXNQb2ludHMucHVzaCguLi5wb2ludHMzZFszXSk7XG5cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcG9pbnRzOiByZXNQb2ludHMsXG4gICAgICAgICAgICBub3JtYWxzOiByZXNOb3JtLFxuICAgICAgICAgICAgZmFjZXM6IHJlc0ZhY2VzLFxuICAgICAgICAgICAgb2Zmc2V0OiBvZmZzZXQgKyA0XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGFkZFV2c1RvVmVydEdlb206IGZ1bmN0aW9uKGdlb20saW5kZXhQdER3bixwYXRoRHduLHBhdGhzQnlEZXB0aCxpbmRleERlcHRoLGluZGV4RGVwdGhVcCl7XG5cblxuICAgICAgICBsZXQgdlVwPSBwYXRoc0J5RGVwdGhbaW5kZXhEZXB0aFVwXS5WO1xuICAgICAgICBsZXQgdkR3bj1wYXRoc0J5RGVwdGhbaW5kZXhEZXB0aF0uVjtcblxuICAgICAgICBsZXQgbkluZGV4UHREd249IChpbmRleFB0RHduKzEpJXBhdGhEd24ubGVuZ3RoO1xuICAgICAgICBsZXQgdT1wYXRoRHduW2luZGV4UHREd25dLlU7XG4gICAgICAgIGxldCBudT1wYXRoRHduW25JbmRleFB0RHduXS5VO1xuXG4gICAgICAgIGlmKHBhdGhEd25bbkluZGV4UHREd25dLlUyKVxuICAgICAgICB7XG4gICAgICAgICAgICBudT1wYXRoRHduW25JbmRleFB0RHduXS5VMjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdXZzPSBbdSx2VXAsXG4gICAgICAgICAgICAgICAgICB1LHZEd24sXG4gICAgICAgICAgICAgICAgICBudSx2RHduLFxuICAgICAgICAgICAgICAgICAgbnUsdlVwXTtcbiAgICAgICAgZ2VvbS51dnMucHVzaCguLi51dnMpO1xuXG4gICAgfSxcblxuICAgIGdldEhvcnJpem9udGFsR2VvbTogZnVuY3Rpb24odHJpYW5nbGVzQnlEZXB0aCwgb3B0aW9ucywgb2Zmc2V0ID0gMCkge1xuICAgICAgICBsZXQgcmVzID0gW107XG4gICAgICAgIGxldCBpbmRleGVzID0gW107XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuZnJvbnRNZXNoKSB7XG4gICAgICAgICAgICBpbmRleGVzLnB1c2goMCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuaW5NZXNoKSB7XG4gICAgICAgICAgICBpbmRleGVzLnB1c2goLi4uQXJyYXkuZnJvbShuZXcgQXJyYXkodHJpYW5nbGVzQnlEZXB0aC5sZW5ndGggLSAyKSwgKHZhbCwgaW5kZXgpID0+IGluZGV4ICsgMSkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmJhY2tNZXNoKSB7XG4gICAgICAgICAgICBpbmRleGVzLnB1c2godHJpYW5nbGVzQnlEZXB0aC5sZW5ndGggLSAxKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgZm9yIChsZXQgaSBvZiBpbmRleGVzKSB7XG4gICAgICAgICAgICBsZXQgdHJpYW5nbGVzID0gdHJpYW5nbGVzQnlEZXB0aFtpXTtcbiAgICAgICAgICAgIGxldCBpbnZlcnROb3JtYWwgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYmFja01lc2gpIHtcbiAgICAgICAgICAgICAgaW52ZXJ0Tm9ybWFsID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0cmlhbmdsZXMucG9pbnRzLmxlbmd0aD4wKXtcbiAgICAgICAgICAgICAgICBsZXQgY3Vyckdlb20gPSBnZW9tSGVscGVyLmdldEdlb21Gcm9tVHJpYW5ndWxhdGlvbih0cmlhbmdsZXMsICt0cmlhbmdsZXMuZGVwdGgsIGludmVydE5vcm1hbCwgb2Zmc2V0KTtcbiAgICAgICAgICAgICAgICBvZmZzZXQgPSBjdXJyR2VvbS5vZmZzZXQ7XG4gICAgICAgICAgICAgICAgcmVzLnB1c2goY3Vyckdlb20pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSxcblxuXG4gICAgZ2V0R2VvbUZyb21Ucmlhbmd1bGF0aW9uOiBmdW5jdGlvbih0cmlhbmdsZXMsIGRlcHRoLCBpbnZlcnROb3JtYWw9ZmFsc2UsIG9mZnNldCA9IDApIHtcbiAgICAgICAgbGV0IHBvaW50cyA9IFtdO1xuICAgICAgICBPYmplY3QudmFsdWVzKHRyaWFuZ2xlcy5wb2ludHMpLmZvckVhY2gocG9pbnQgPT4ge1xuICAgICAgICAgICAgcG9pbnRzLnB1c2gocG9pbnRbMF0pO1xuICAgICAgICAgICAgcG9pbnRzLnB1c2gocG9pbnRbMV0pO1xuICAgICAgICAgICAgcG9pbnRzLnB1c2goZGVwdGgpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYoIWludmVydE5vcm1hbCl7XG4gICAgICAgICAgICBmb3IoIGxldCB0IG9mIHRyaWFuZ2xlcy50cmlhbmdsZXMpe1xuICAgICAgICAgICAgICAgIHQucmV2ZXJzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vb2Zmc2V0cyBmYWNlc1xuICAgICAgICBsZXQgZmFjZXMgPSBbXTtcbiAgICAgICAgT2JqZWN0LnZhbHVlcyh0cmlhbmdsZXMudHJpYW5nbGVzKS5mb3JFYWNoKHRyaWFuZ2xlID0+IHtcbiAgICAgICAgICAgIGZhY2VzLnB1c2goLi4udHJpYW5nbGUubWFwKGluZGV4ID0+IGluZGV4ICsgb2Zmc2V0KSk7XG4gICAgICAgIH0pO1xuICAgICAgICBvZmZzZXQgKz0gdHJpYW5nbGVzLnBvaW50cy5sZW5ndGg7XG5cbiAgICAgICAgLy9nZXQgbm9ybWFsczpcbiAgICAgICAgbGV0IG5vcm1hbHMgPSBbXTtcbiAgICAgICAgbGV0IGlkeHM9IHRyaWFuZ2xlcy50cmlhbmdsZXNbMF0ubWFwIChlbHQgPT4gZWx0KjMpO1xuICAgICAgICBsZXQgcHQxPSBwb2ludHMuc2xpY2UoaWR4c1swXSxpZHhzWzBdKzMpO1xuICAgICAgICBsZXQgcHQyPSBwb2ludHMuc2xpY2UoaWR4c1sxXSxpZHhzWzFdKzMpO1xuICAgICAgICBsZXQgcHQzPSBwb2ludHMuc2xpY2UoaWR4c1syXSxpZHhzWzJdKzMpO1xuICAgICAgICBsZXQgbm9ybWFsID0gZ2VvbUhlbHBlci5nZXROb3JtYWxUb1BsYW4ocHQxLHB0MixwdDMpO1xuXG4gICAgICAgIE9iamVjdC52YWx1ZXModHJpYW5nbGVzLnBvaW50cykuZm9yRWFjaChwb2ludCA9PiB7XG4gICAgICAgICAgICBub3JtYWxzLnB1c2goLi4ubm9ybWFsKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwb2ludHM6IHBvaW50cyxcbiAgICAgICAgICAgIGZhY2VzOiBmYWNlcyxcbiAgICAgICAgICAgIG5vcm1hbHM6IG5vcm1hbHMsXG4gICAgICAgICAgICBvZmZzZXQ6IG9mZnNldFxuICAgICAgICB9O1xuICAgIH0sXG5cblxuICAgIGdldE5vcm1hbFRvUGxhbjogZnVuY3Rpb24ocG9pbnQxLCBwb2ludDIsIHBvaW50NCkge1xuICAgICAgICBsZXQgdmVjMSA9IGdlb21IZWxwZXIucG9pbnRzVG9WZWMocG9pbnQxLCBwb2ludDIpO1xuICAgICAgICBsZXQgdmVjMiA9IGdlb21IZWxwZXIucG9pbnRzVG9WZWMocG9pbnQxLCBwb2ludDQpO1xuICAgICAgICByZXR1cm4gZ2VvbUhlbHBlci5ub3JtYWxpemVWZWMoZ2VvbUhlbHBlci5jcm9zcyh2ZWMyLCB2ZWMxKSk7XG5cbiAgICB9LFxuXG4gICAgcG9pbnRzVG9WZWM6IGZ1bmN0aW9uKHBvaW50MSwgcG9pbnQyKSB7XG4gICAgICAgIHJldHVybiBbcG9pbnQyWzBdIC0gcG9pbnQxWzBdLCBwb2ludDJbMV0gLSBwb2ludDFbMV0sIHBvaW50MlsyXSAtIHBvaW50MVsyXV07XG4gICAgfSxcblxuICAgIGdldFBvaW50MzogZnVuY3Rpb24ocG9pbnQyLCBkZXB0aCkge1xuICAgICAgICByZXR1cm4gW3BvaW50Mi5YLCBwb2ludDIuWSwgZGVwdGhdO1xuICAgIH0sXG5cbiAgICBjcm9zczogZnVuY3Rpb24odmVjMSwgdmVjMikge1xuICAgICAgICByZXR1cm4gW3ZlYzFbMV0gKiB2ZWMyWzJdIC0gdmVjMVsyXSAqIHZlYzJbMV0sXG4gICAgICAgICAgICB2ZWMxWzJdICogdmVjMlswXSAtIHZlYzFbMF0gKiB2ZWMyWzJdLFxuICAgICAgICAgICAgdmVjMVswXSAqIHZlYzJbMV0gLSB2ZWMxWzFdICogdmVjMlswXVxuICAgICAgICBdO1xuICAgIH0sXG5cbiAgICBub3JtYWxpemVWZWM6IGZ1bmN0aW9uKHZlYykge1xuICAgICAgICBsZXQgbm9ybSA9IE1hdGguc3FydCh2ZWNbMF0gKiB2ZWNbMF0gKyB2ZWNbMV0gKiB2ZWNbMV0gKyB2ZWNbMl0gKiB2ZWNbMl0pO1xuICAgICAgICByZXR1cm4gW3ZlY1swXSAvIG5vcm0sIHZlY1sxXSAvIG5vcm0sIHZlY1syXSAvIG5vcm1dO1xuICAgIH0sXG5cblxufTtcbm1vZHVsZS5leHBvcnRzID0gZ2VvbUhlbHBlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5cblxuY29uc3QgZXh0cnVkZXIgPSByZXF1aXJlKFwiLi9leHRydWRlci5qc1wiKTtcbmNvbnN0IGdlb21IZWxwZXIgPSByZXF1aXJlKFwiLi9nZW9tLWhlbHBlci5qc1wiKTtcbmNvbnN0IGV4cG9ydEhlbHBlcj0gcmVxdWlyZShcIi4vZXhwb3J0LWhlbHBlci5qc1wiKTtcbmNvbnN0IGRyYXdIZWxwZXI9IHJlcXVpcmUoXCIuL2RyYXctaGVscGVyLmpzXCIpO1xuY29uc3QgcGF0aEhlbHBlcj0gcmVxdWlyZShcIi4vcGF0aC1oZWxwZXIuanNcIik7XG5cbnZhciBob2xlc0luID0ge1xuXG4gICAgbWVzaGVzVG9PYmo6IGV4cG9ydEhlbHBlci5tZXNoZXNUb09iaixcbiAgICBtZXNoVG9PYmo6IGV4cG9ydEhlbHBlci5tZXNoVG9PYmosXG4gICAgZ2V0R2VvbWV0cnk6IGV4dHJ1ZGVyLmdldEdlb21ldHJ5LFxuICAgIG1lcmdlTWVzaGVzOiBnZW9tSGVscGVyLm1lcmdlTWVzaGVzLFxuXG4gICAgZHJhd1BhdGg6IGRyYXdIZWxwZXIuZHJhd1BhdGgsXG4gICAgZHJhd1BhdGhzOiBkcmF3SGVscGVyLmRyYXdQYXRocyxcblxuICAgIHNjYWxlRG93blBhdGg6IHBhdGhIZWxwZXIuc2NhbGVEb3duUGF0aCxcbiAgICBzY2FsZURvd25QYXRoczogcGF0aEhlbHBlci5zY2FsZURvd25QYXRocyxcbiAgICBnZXREYXRhQnlEZXB0aDpleHRydWRlci5nZXREYXRhQnlEZXB0aCxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaG9sZXNJbjtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBjbGlwcGVyTGliID0gcmVxdWlyZShcImNsaXBwZXItbGliXCIpO1xuXG52YXIgcGF0aEhlbHBlciA9IHtcblxuXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZSB0aGUgeG9yIG9mIHR3byBhcnJheXMgb2YgcGF0aFxuICAgICAqXG4gICAgICovXG4gICAgZ2V0WG9yT2ZQYXRoczogZnVuY3Rpb24ocGF0aHNTdWJqLCBwYXRoc0NsaXApIHtcbiAgICAgICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBzdWJqZWN0RmlsbFR5cGU6IGNsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm8sXG4gICAgICAgICAgICBjbGlwRmlsbFR5cGU6IGNsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm8sXG4gICAgICAgICAgICBjbGlwVHlwZTogY2xpcHBlckxpYi5DbGlwVHlwZS5jdFhvclxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcGF0aEhlbHBlci5leGVjdXRlQ2xpcHBlcihwYXRoc1N1YmosIHBhdGhzQ2xpcCwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENvbXB1dGUgdGhlIHhvciBvZiB0d28gYXJyYXlzIG9mIHBhdGhcbiAgICAgKlxuICAgICAqL1xuICAgIGdldFVuaW9uT2ZQYXRoczogZnVuY3Rpb24ocGF0aHNTdWJqLCBwYXRoc0NsaXAsIG9wKSB7XG4gICAgICAgIGxldCBvcHRpb25zID0ge1xuICAgICAgICAgICAgc3ViamVjdEZpbGxUeXBlOiBjbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvLFxuICAgICAgICAgICAgY2xpcEZpbGxUeXBlOiBjbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvLFxuICAgICAgICAgICAgY2xpcFR5cGU6IGNsaXBwZXJMaWIuQ2xpcFR5cGUuY3RVbmlvblxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcGF0aEhlbHBlci5leGVjdXRlQ2xpcHBlcihwYXRoc1N1YmosIHBhdGhzQ2xpcCwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENvbXB1dGUgdGhlIHhvciBvZiB0d28gYXJyYXlzIG9mIHBhdGhcbiAgICAgKlxuICAgICAqL1xuICAgIGdldERpZmZPZlBhdGhzOiBmdW5jdGlvbihwYXRoc1N1YmosIHBhdGhzQ2xpcCwgb3ApIHtcbiAgICAgICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBzdWJqZWN0RmlsbFR5cGU6IGNsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm8sXG4gICAgICAgICAgICBjbGlwRmlsbFR5cGU6IGNsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm8sXG4gICAgICAgICAgICBjbGlwVHlwZTogY2xpcHBlckxpYi5DbGlwVHlwZS5jdERpZmZlcmVuY2VcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHBhdGhIZWxwZXIuZXhlY3V0ZUNsaXBwZXIocGF0aHNTdWJqLCBwYXRoc0NsaXAsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDb21wdXRlIHRoZSB4b3Igb2YgdHdvIGFycmF5cyBvZiBwYXRoXG4gICAgICpcbiAgICAgKi9cbiAgICBnZXRJbnRlck9mUGF0aHM6IGZ1bmN0aW9uKHBhdGhzU3ViaiwgcGF0aHNDbGlwLCBvcCkge1xuICAgICAgICBsZXQgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHN1YmplY3RGaWxsVHlwZTogY2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybyxcbiAgICAgICAgICAgIGNsaXBGaWxsVHlwZTogY2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybyxcbiAgICAgICAgICAgIGNsaXBUeXBlOiBjbGlwcGVyTGliLkNsaXBUeXBlLmN0SW50ZXJzZWN0aW9uXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBwYXRoSGVscGVyLmV4ZWN1dGVDbGlwcGVyKHBhdGhzU3ViaiwgcGF0aHNDbGlwLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2ltcGxpZnkgYW4gYXJyYXkgb2YgcGF0aHNcbiAgICAgKlxuICAgICAqL1xuICAgIHNpbXBsaWZ5UGF0aHM6IGZ1bmN0aW9uKHBhdGhzLCBvcHRpb25zID0ge1xuICAgICAgICBmaWxsVHlwZTogY2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVyb1xuICAgIH0pIHtcbiAgICAgICAgcmV0dXJuIGNsaXBwZXJMaWIuQ2xpcHBlci5TaW1wbGlmeVBvbHlnb25zKHBhdGhzLCBvcHRpb25zLmZpbGxUeXBlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQXBwbHkgQ2xpcHBlciBvcGVyYXRpb24gdG8gcGF0aHNTdWJqIGFuZCBwYXRoQ2xpcFxuICAgICAqIGNsaXBUeXBlOiB7Y3RJbnRlcnNlY3Rpb24sY3RVbmlvbixjdERpZmZlcmVuY2UsY3RYb3J9XG4gICAgICogc3ViamVjdEZpbGw6IHtwZnRFdmVuT2RkLHBmdE5vblplcm8scGZ0UG9zaXRpdmUscGZ0TmVnYXRpdmV9XG4gICAgICogY2xpcEZpbGw6IHNhbWUgYXMgdXBvblxuICAgICAqL1xuICAgIGV4ZWN1dGVDbGlwcGVyOiBmdW5jdGlvbihwYXRoc1N1YmosIHBhdGhzQ2xpcCwgb3B0aW9ucyA9IHtcbiAgICAgICAgY2xpcFR5cGU6IGNsaXBwZXJMaWIuQ2xpcFR5cGVcbiAgICAgICAgICAgIC5jdFVuaW9uLFxuICAgICAgICBzdWJqZWN0RmlsbDogY2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybyxcbiAgICAgICAgY2xpcEZpbGw6IGNsaXBwZXJMaWJcbiAgICAgICAgICAgIC5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVyb1xuICAgIH0pIHtcbiAgICAgICAgaWYgKCFwYXRoc1N1YmogJiYgIXBhdGhzQ2xpcCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vdHVybiBwYXRocyBzbyB0aGV5IGFyZSBuZWdhdGl2ZXM6XG4gICAgICAgIHBhdGhIZWxwZXIuc2V0RGlyZWN0aW9uUGF0aHMocGF0aHNTdWJqLCAtMSk7XG4gICAgICAgIGlmIChwYXRoc0NsaXApIHtcbiAgICAgICAgICAgIHBhdGhIZWxwZXIuc2V0RGlyZWN0aW9uUGF0aHMocGF0aHNDbGlwLCAtMSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zZXR0dXAgYW5kIGV4ZWN1dGUgY2xpcHBlclxuICAgICAgICBsZXQgY3ByID0gbmV3IGNsaXBwZXJMaWIuQ2xpcHBlcigpO1xuICAgICAgICBjcHIuQWRkUGF0aHMocGF0aHNTdWJqLCBjbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdCwgdHJ1ZSk7XG4gICAgICAgIGlmIChwYXRoc0NsaXApIHtcbiAgICAgICAgICAgIGNwci5BZGRQYXRocyhwYXRoc0NsaXAsIGNsaXBwZXJMaWIuUG9seVR5cGUucHRDbGlwLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzID0gbmV3IGNsaXBwZXJMaWIuUGF0aHMoKTtcbiAgICAgICAgY3ByLkV4ZWN1dGUob3B0aW9ucy5jbGlwVHlwZSwgcmVzLCBvcHRpb25zLnN1YmplY3RGaWxsLCBvcHRpb25zLmNsaXBGaWxsKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogIHNldHMgdGhlIGRpcmVjdGlvbiBvZiBhbiBhcnJheSBvZiBwYXRoXG4gICAgICovXG4gICAgc2V0RGlyZWN0aW9uUGF0aHM6IGZ1bmN0aW9uKHBhdGhzLCBkaXJlY3Rpb24pIHtcbiAgICAgICAgZm9yIChsZXQgaSBpbiBwYXRocykge1xuICAgICAgICAgICAgcGF0aEhlbHBlci5zZXREaXJlY3Rpb25QYXRoKHBhdGhzW2ldLCBkaXJlY3Rpb24pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqICBzZXRzIHRoZSBkaXJlY3Rpb24gb2YgYSBwYXRoXG4gICAgICovXG4gICAgc2V0RGlyZWN0aW9uUGF0aDogZnVuY3Rpb24ocGF0aCwgZGlyZWN0aW9uKSB7XG4gICAgICAgIGlmIChjbGlwcGVyTGliLkpTLkFyZWFPZlBvbHlnb24ocGF0aCkgKiBkaXJlY3Rpb24gPCAwKSB7XG4gICAgICAgICAgICBwYXRoLnJldmVyc2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAgY2hlY2tzIGlmIHRoZSBzaWduZWQgYXJlYSBvZiB0aGUgcGF0aCBpcyBwb3NpdGl2ZVxuICAgICAqL1xuICAgIGlzUG9zaXRpdmVQYXRoOiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgIHJldHVybiBwYXRoSGVscGVyLmdldERpcmVjdGlvblBhdGgocGF0aCkgPiAwO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAgY2hlY2tzIGlmIHRoZSBzaWduZWQgYXJlYSBvZiB0aGUgcGF0aCBpcyBuZWdhdGl2ZVxuICAgICAqL1xuICAgIGlzTmVnYXRpdmVQYXRoOiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgIHJldHVybiBwYXRoSGVscGVyLmdldERpcmVjdGlvblBhdGgocGF0aCkgPCAwO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAgZ2V0IHRoZSBkaXJlY3Rpb24gb2YgYW4gYXJhcnkgb2YgcGF0aFxuICAgICAqL1xuICAgIGdldERpcmVjdGlvblBhdGhzOiBmdW5jdGlvbihwYXRocykge1xuICAgICAgICByZXR1cm4gcGF0aHMubWFwKHBhdGhIZWxwZXIuZ2V0RGlyZWN0aW9uUGF0aCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqICBnZXQgdGhlIGRpcmVjdGlvbiBvZiBhIHBhdGhcbiAgICAgKi9cbiAgICBnZXREaXJlY3Rpb25QYXRoOiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgIHJldHVybiAoY2xpcHBlckxpYi5KUy5BcmVhT2ZQb2x5Z29uKHBhdGgpID4gMCkgPyAxIDogLTE7XG4gICAgfSxcblxuICAgIHNjYWxlVXBQYXRoOiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgIGNsaXBwZXJMaWIuSlMuU2NhbGVVcFBhdGgocGF0aCwgMTAwMDApO1xuICAgIH0sXG5cbiAgICBzY2FsZURvd25QYXRoKHBhdGgpIHtcbiAgICAgICAgY2xpcHBlckxpYi5KUy5TY2FsZURvd25QYXRoKHBhdGgsIDEwMDAwKTtcbiAgICB9LFxuICAgIHNjYWxlRG93blBhdGhzKHBhdGhzKSB7XG4gICAgICAgIGNsaXBwZXJMaWIuSlMuU2NhbGVEb3duUGF0aHMocGF0aHMsIDEwMDAwKTtcbiAgICB9LFxuXG5cbiAgICBhZGRDb2xpbmVhclBvaW50c1BhdGhzOiBmdW5jdGlvbihwYXRocywgdG9BZGQpe1xuXG4gICAgICAgIGZvcihsZXQgaSBpbiBwYXRocyl7XG4gICAgICAgICAgICBmb3IobGV0IGogaW4gdG9BZGQpe1xuICAgICAgICAgICAgICAgIHBhdGhzW2ldPSBwYXRoSGVscGVyLmFkZENvbGluZWFyUG9pbnRzUGF0aChwYXRoc1tpXSwgdG9BZGRbal0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9LFxuXG4gICAgYWRkQ29saW5lYXJQb2ludHNQYXRoOiBmdW5jdGlvbihwYXRoLHRvQWRkICl7XG5cbiAgICAgICAgbGV0IHJlc1BhdGg9W107XG4gICAgICAgIGxldCBhZGRlZEluZGV4ZXM9W107XG4gICAgICAgIGZvcihsZXQgaSA9MDtpPCBwYXRoLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIGxldCBwdDE9IHBhdGhbaV07XG4gICAgICAgICAgICBsZXQgcHQyPSBwYXRoWyhpKzEpJXBhdGgubGVuZ3RoXTtcblxuICAgICAgICAgICAgcmVzUGF0aC5wdXNoKHB0MSlcbiAgICAgICAgICAgIGZvcihsZXQgaiA9MDtqPD0gdG9BZGQubGVuZ3RoOyBqKyspe1xuICAgICAgICAgICAgICAgIGxldCBpZHgxPSBqJXRvQWRkLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBsZXQgaWR4Mj0gKGorMSkldG9BZGQubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGxldCBhZGQxPSB0b0FkZFtpZHgxXTtcbiAgICAgICAgICAgICAgICBsZXQgYWRkMj0gdG9BZGRbaWR4Ml07XG4gICAgICAgICAgICAgICAgaWYoIXBhdGhIZWxwZXIuaXNBbGlnbmVkKHB0MSwgcHQyLCBhZGQxLCBhZGQyKSl7Y29udGludWU7fVxuXG4gICAgICAgICAgICAgICAgaWYoIXBhdGhIZWxwZXIuaXNFcXVhbChwdDEsIGFkZDIpJiYgIXBhdGhIZWxwZXIuaXNFcXVhbChwdDIsIGFkZDIpJiZcbiAgICAgICAgICAgICAgICAgICAhYWRkZWRJbmRleGVzLmluY2x1ZGVzKGlkeDIpICAmJiBwYXRoSGVscGVyLmluT25TZWdtZW50KHB0MSxwdDIsYWRkMikgKXtcbiAgICAgICAgICAgICAgICAgICAgcmVzUGF0aC5wdXNoKGFkZDIpO1xuICAgICAgICAgICAgICAgICAgICBhZGRlZEluZGV4ZXMucHVzaChpZHgyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZighcGF0aEhlbHBlci5pc0VxdWFsKHB0MSwgYWRkMSkmJiAhcGF0aEhlbHBlci5pc0VxdWFsKHB0MiwgYWRkMSkmJlxuICAgICAgICAgICAgICAgICAgICFhZGRlZEluZGV4ZXMuaW5jbHVkZXMoaWR4MSkgICYmIHBhdGhIZWxwZXIuaW5PblNlZ21lbnQocHQxLHB0MixhZGQxKSl7XG4gICAgICAgICAgICAgICAgICAgIHJlc1BhdGgucHVzaChhZGQxKTtcbiAgICAgICAgICAgICAgICAgICAgYWRkZWRJbmRleGVzLnB1c2goaWR4MSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc1BhdGg7XG4gICAgfSxcblxuICAgIGdldE1hdGNoaW5nRWRnZUluZGV4OiBmdW5jdGlvbihwYXRoLCBwYXRoVG9NYXRjaCxvZmZzZXQ9IDApIHtcbiAgICAgICAgbGV0IHByZXZBbGlnbmVkID0gZmFsc2U7XG4gICAgICAgIGxldCByZXMgPSB7fTtcbiAgICAgICAgZm9yIChsZXQgaSA9IHBhdGgubGVuZ3RoIC0gMS1vZmZzZXQ7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gcGF0aFRvTWF0Y2gubGVuZ3RoIC0gMTsgaiA+PSAwOyBqLS0pIHtcblxuICAgICAgICAgICAgICAgIGxldCBwMSA9IHBhdGhUb01hdGNoW2pdO1xuICAgICAgICAgICAgICAgIGxldCBwMiA9IHBhdGhUb01hdGNoWyhqICsgMSkgJSBwYXRoVG9NYXRjaC5sZW5ndGhdO1xuICAgICAgICAgICAgICAgIGxldCBjdXJyQWxnaWduZWQgPSBwYXRoSGVscGVyLmlzQWxpZ25lZChwYXRoW2ldLCBwYXRoWyhpICsgMSkgJSBwYXRoLmxlbmd0aF0sIHAxLCBwMik7XG4gICAgICAgICAgICAgICAgaWYgKCFjdXJyQWxnaWduZWQgJiYgcHJldkFsaWduZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJBbGdpZ25lZCkge1xuICAgICAgICAgICAgICAgICAgICByZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50bWF0Y2g6IHAxXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHByZXZBbGlnbmVkID0gY3VyckFsZ2lnbmVkO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgfSxcblxuICAgIGlzQWxpZ25lZDogZnVuY3Rpb24oZTExLCBlMTIsIGUyMSwgZTIyKSB7XG4gICAgICAgIGxldCBlZGdlMSA9IHBhdGhIZWxwZXIuZ2V0RWRnZShlMTEsIGUxMik7XG4gICAgICAgIGxldCBlZGdlMiA9IHBhdGhIZWxwZXIuZ2V0RWRnZShlMTEsIGUyMSk7XG4gICAgICAgIGxldCBlZGdlMyA9IHBhdGhIZWxwZXIuZ2V0RWRnZShlMTEsIGUyMik7XG4gICAgICAgIHJldHVybiBwYXRoSGVscGVyLmlzQ29saW5lYXIoZWRnZTEsIGVkZ2UyKSAmJiBwYXRoSGVscGVyLmlzQ29saW5lYXIoZWRnZTEsIGVkZ2UzKTtcbiAgICB9LFxuXG4gICAgaXNDb2xpbmVhcjogZnVuY3Rpb24oZWRnZTEsIGVkZ2UyKSB7XG4gICAgICAgIHJldHVybiBlZGdlMS5YICogZWRnZTIuWSA9PT0gZWRnZTEuWSAqIGVkZ2UyLlg7XG4gICAgfSxcblxuICAgIGdldEVkZ2U6IGZ1bmN0aW9uKHBvaW50MSwgcG9pbnQyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBYOiAocG9pbnQyLlggLSBwb2ludDEuWCksXG4gICAgICAgICAgICBZOiAocG9pbnQyLlkgLSBwb2ludDEuWSlcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogcmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIHBvaW50IGluIHBhdGggbWF0Y2hpbmcgd2l0aCBwb2ludFxuICAgICAqXG4gICAgICovXG4gICAgZ2V0UG9pbnRNYXRjaDogZnVuY3Rpb24ocGF0aCwgcG9pbnQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZihwYXRoSGVscGVyLmlzRXF1YWwocGF0aFtpXSwgcG9pbnQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGlcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldE5vcm06IGZ1bmN0aW9uKHBvaW50KSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQocG9pbnQuWCAqIHBvaW50LlggKyBwb2ludC5ZICogcG9pbnQuWSk7XG4gICAgfSxcbiAgICBnZXREaXN0YW5jZTogZnVuY3Rpb24ocG9pbnQxLCBwb2ludDIpIHtcbiAgICAgICAgbGV0IGVkZ2UgPSBwYXRoSGVscGVyLmdldEVkZ2UocG9pbnQxLCBwb2ludDIpO1xuICAgICAgICByZXR1cm4gcGF0aEhlbHBlci5nZXROb3JtKGVkZ2UpO1xuICAgIH0sXG5cbiAgICBnZXRUb3RhbExlbmd0aDogZnVuY3Rpb24ocGF0aCkge1xuICAgICAgICBsZXQgcmVzID0gMDtcbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBjdXJyID0gcGF0aFtpXTtcbiAgICAgICAgICAgIGxldCBuZXh0ID0gcGF0aFsoaSArIDEpICUgcGF0aC5sZW5ndGhdO1xuICAgICAgICAgICAgcmVzICs9IHBhdGhIZWxwZXIuZ2V0RGlzdGFuY2UoY3VyciwgbmV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogIGNoZWNrcyBpZiB0d28gcG9pbnRzIGhhdmUgdGhlIHNhbWUgY29vcmRpbmF0ZXNcbiAgICAgKlxuICAgICAqL1xuICAgIGlzRXF1YWw6IGZ1bmN0aW9uKHBvaW50MSwgcG9pbnQyKSB7XG4gICAgICAgIHJldHVybiAocG9pbnQxLlggPT09IHBvaW50Mi5YKSAmJiAocG9pbnQxLlkgPT09IHBvaW50Mi5ZKTtcbiAgICB9LFxuXG4gICAgaW5PblNlZ21lbnQ6ZnVuY3Rpb24oIHB0T3JpZ2luLCBwdERlc3QsIHB0KXtcbiAgICAgICAgICAgIHJldHVybiBwYXRoSGVscGVyLmlzSW5SYW5nZShwdE9yaWdpbiwgcHREZXN0LCBwdCl8fFxuICAgICAgICAgICAgICAgICAgIHBhdGhIZWxwZXIuaXNJblJhbmdlKHB0RGVzdCwgcHRPcmlnaW4sIHB0KTtcbiAgICB9LFxuXG4gICAgaXNJblJhbmdlOiBmdW5jdGlvbiggcHRPcmlnaW4sIHB0RGVzdCxwdCApe1xuICAgICAgICByZXR1cm4gcHQuWD49cHRPcmlnaW4uWCAmJiBwdC5YPD0gcHREZXN0LlggJiZcbiAgICAgICAgICAgICAgIHB0Llk+PXB0T3JpZ2luLlkgJiYgcHQuWTw9IHB0RGVzdC5ZO1xuICAgIH0sXG5cbn07XG5tb2R1bGUuZXhwb3J0cyA9IHBhdGhIZWxwZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgcGF0aEhlbHBlciA9IHJlcXVpcmUoXCIuL3BhdGgtaGVscGVyLmpzXCIpO1xuXG5cbnZhciB1dkhlbHBlciA9IHtcblxuICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEZpcnN0IHBhcmFkeWdtOiBtYXAgb24gdmVydGl2YWwgYW5kIGhvcml6b250YWwgaW5kZXBlbmRhbnRseS5cbiAgICAgICAgRG9uJ3QgY2FyZSBhYm91dCBkaXNjb250aW51aXRpZXMgYmV0d2VlbiB2ZXJ0aWNhbCBhbmQgaG9yaXpvbnRhbC5cbiAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICBtYXBIb3JyaXpvbnRhbDogZnVuY3Rpb24ocGF0aHNCeURlcHRoLG91dGVyU2hhcGUsIGhvcml6b250YWxHZW9tLG9wdGlvbnMpIHtcbiAgICAgICAgaWYoIWhvcml6b250YWxHZW9tKXtyZXR1cm47fVxuICAgICAgICBsZXQgcG9pbnRzID0gaG9yaXpvbnRhbEdlb20ucG9pbnRzO1xuICAgICAgICBsZXQgYm91bmRhcmllcz0gdXZIZWxwZXIuZ2V0Qm91bmRhcmllcyhwYXRoc0J5RGVwdGgsb3V0ZXJTaGFwZSxvcHRpb25zKTtcblxuICAgICAgICBsZXQgdXYgPSB1dkhlbHBlci5nZXRVVkhvckZhY2VzKHBhdGhzQnlEZXB0aCxvdXRlclNoYXBlLGJvdW5kYXJpZXMsIHBvaW50cyk7XG4gICAgICAgIHV2SGVscGVyLmFkZFV2VG9HZW9tKHV2LCBob3Jpem9udGFsR2VvbSk7XG4gICAgfSxcblxuXG4gICAgbWFwVmVydGljYWw6IGZ1bmN0aW9uKHBhdGhzQnlEZXB0aCxvdXRlclNoYXBlLG9wdGlvbnMpIHtcblxuICAgICAgICAvL2RldGVybWluZSB0aGUgaW50ZXJwb2xhdGlvbiBmdW5jdGlvbjpcbiAgICAgICAgbGV0IGJvdW5kYXJpZXM9IHV2SGVscGVyLmdldEJvdW5kYXJpZXMocGF0aHNCeURlcHRoLCBvdXRlclNoYXBlLG9wdGlvbnMpO1xuICAgICAgICAvL2ZvciBlYWNoIGRlcHRoOiBjb25zdHJ1Y3RzIHRoZSB1dnM6XG5cbiAgICAgICAgZm9yIChsZXQgZGVwdGggaW4gcGF0aHNCeURlcHRoKSB7XG4gICAgICAgICAgICBsZXQgcGF0aHNBdERlcHRoID0gcGF0aHNCeURlcHRoW2RlcHRoXTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgaW4gcGF0aHNBdERlcHRoLnBhdGhzKSB7XG4gICAgICAgICAgICAgICAgdXZIZWxwZXIuZ2V0VVZlcnRQYXRoKGksIHBhdGhzQnlEZXB0aCwgK2RlcHRoLCBib3VuZGFyaWVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCB2PSB1dkhlbHBlci5pbnRlcnBvbGF0ZShib3VuZGFyaWVzLmJvdW5kYXJ5LlosIGJvdW5kYXJpZXMuYm91bmRhcnlUZXguVixwYXRoc0F0RGVwdGguZGVwdGgpO1xuICAgICAgICAgICAgcGF0aHNBdERlcHRoLlY9IHY7XG4gICAgICAgIH1cblxuICAgIH0sXG5cbiAgICBnZXRVVkhvckZhY2VzOiBmdW5jdGlvbihwYXRoc0J5RGVwdGgsb3V0ZXJTaGFwZSxib3VuZGFyaWVzLCBwb2ludHMpIHtcbiAgICAgICAgbGV0IHJlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGg7IGkgKz0gMykge1xuICAgICAgICAgICAgbGV0IHBvaW50ID0gcG9pbnRzLnNsaWNlKGksIGkgKyAzKTtcbiAgICAgICAgICAgIHJlcy5wdXNoKC4uLnV2SGVscGVyLmdldFVWRnJvbUhvcnJQb2ludChib3VuZGFyaWVzLCBwb2ludCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSxcblxuICAgIGdldFVWZXJ0UGF0aDogZnVuY3Rpb24oaW5kUGF0aCwgcGF0aHNCeURlcHRoLCBpbmRleERlcHRoLGJvdW5kYXJpZXMpIHtcbiAgICAgICAgbGV0IHBhdGhzQXREZXB0aCA9IHBhdGhzQnlEZXB0aFtpbmRleERlcHRoXTtcbiAgICAgICAgbGV0IHBhdGggPSBwYXRoc0F0RGVwdGgucGF0aHNbaW5kUGF0aF07XG5cbiAgICAgICAgLy9maW5kcyBpbnRvIHRoZSB1cHBlciBwYXRocyBpZiB0aGVyZSBpcyBhIG1hdGNoaW5nIGVkZ2VcbiAgICAgICAgbGV0IG1hdGNoO1xuICAgICAgICBmb3IgKGxldCBpID0gaW5kZXhEZXB0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBqIGluIHBhdGhzQnlEZXB0aFtpXS5wYXRocykge1xuICAgICAgICAgICAgICAgIGxldCBwYXRoVG9NYXRjaCA9IHBhdGhzQnlEZXB0aFtpXS5wYXRoc1tqXTtcbiAgICAgICAgICAgICAgICBtYXRjaCA9IHBhdGhIZWxwZXIuZ2V0TWF0Y2hpbmdFZGdlSW5kZXgocGF0aCwgcGF0aFRvTWF0Y2gpO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICBpID0gLTE7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgb2Zmc2V0ID0ge2luZGV4OjAsZGlzdGFuY2U6MCx1OjB9O1xuICAgICAgICAvL2lmIHNvLCBvZmZzZXRzIGl0IHRvIGtlZXAgYSBtYXggb2YgY29udGludWl0eSBiZWxvbmcgWlxuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIG9mZnNldC5kaXN0YW5jZT0gcGF0aEhlbHBlci5nZXREaXN0YW5jZShwYXRoW21hdGNoLmluZGV4XSxtYXRjaC5wb2ludG1hdGNoKTtcbiAgICAgICAgICAgIG9mZnNldC5pbmRleD0gbWF0Y2guaW5kZXg7XG4gICAgICAgICAgICBvZmZzZXQudT0gbWF0Y2gucG9pbnRtYXRjaC5VO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9pbnRlcnBvbGF0ZXNcbiAgICAgICAgdXZIZWxwZXIuaW50ZXJwb2xhdGVQYXRoVShwYXRoLGJvdW5kYXJpZXMsb2Zmc2V0KTtcblxuICAgIH0sXG5cblxuXG4gICAgZ2V0TWF4UGF0aExlbmd0aDpmdW5jdGlvbihwYXRoc0J5RGVwdGgpe1xuICAgICAgICBsZXQgbWF4PTA7XG4gICAgICAgIGZvcihsZXQgaSBpbiBwYXRoc0J5RGVwdGgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIG1heD0gTWF0aC5tYXgobWF4LCAgTWF0aC5tYXgocGF0aEhlbHBlci5nZXRUb3RhbExlbmd0aCguLi5wYXRoc0J5RGVwdGhbaV0ucGF0aHMpKSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWF4O1xuICAgIH0sXG5cbiAgICBnZXRVVkZyb21Ib3JyUG9pbnQ6IGZ1bmN0aW9uKGJvdW5kYXJpZXMsIHBvaW50KSB7XG4gICAgICAgIGxldCBVID0gdXZIZWxwZXIuaW50ZXJwb2xhdGUoYm91bmRhcmllcy5ib3VuZGFyeS5YWSwgYm91bmRhcmllcy5ib3VuZGFyeVRleC5VLCBwb2ludFswXSk7XG4gICAgICAgIGxldCBWID0gdXZIZWxwZXIuaW50ZXJwb2xhdGUoYm91bmRhcmllcy5ib3VuZGFyeS5aLCBib3VuZGFyaWVzLmJvdW5kYXJ5VGV4LlYsIHBvaW50WzFdKTtcblxuICAgICAgICByZXR1cm4gW1UsIFZdO1xuXG4gICAgfSxcblxuICAgIGludGVycG9sYXRlUGF0aFU6ZnVuY3Rpb24ocGF0aCwgYm91bmRhcmllcyxvZmZzZXQgKVxuICAgIHtcbiAgICAgICAgbGV0IGRpc3Q9MDtcbiAgICAgICAgbGV0IHN0YXJ0SW5kZXg9IG9mZnNldC5pbmRleDtcbiAgICAgICAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPCBwYXRoLmxlbmd0aCtzdGFydEluZGV4OyBpKyspIHtcbiAgICAgICAgICAgIGxldCB2YWx1ZVU9IChkaXN0K29mZnNldC5kaXN0YW5jZSk7XG4gICAgICAgICAgICBsZXQgdT0gdXZIZWxwZXIuaW50ZXJwb2xhdGUoYm91bmRhcmllcy5ib3VuZGFyeS5YWSwgYm91bmRhcmllcy5ib3VuZGFyeVRleC5VLHZhbHVlVSk7XG4gICAgICAgICAgICBwYXRoW2klcGF0aC5sZW5ndGhdLlU9dTtcbiAgICAgICAgICAgIGRpc3QgPSBkaXN0ICsgcGF0aEhlbHBlci5nZXREaXN0YW5jZShwYXRoW2klcGF0aC5sZW5ndGhdLCBwYXRoWyhpICsgMSkgJSBwYXRoLmxlbmd0aF0pO1xuICAgICAgICB9XG4gICAgICAgIGxldCB2YWx1ZVU9IChkaXN0K29mZnNldC5kaXN0YW5jZSk7XG4gICAgICAgIGxldCB1PSB1dkhlbHBlci5pbnRlcnBvbGF0ZShib3VuZGFyaWVzLmJvdW5kYXJ5LlhZLCBib3VuZGFyaWVzLmJvdW5kYXJ5VGV4LlUsdmFsdWVVKTtcbiAgICAgICAgcGF0aFtzdGFydEluZGV4XS5VMj11O1xuICAgIH0sXG5cbiAgICBpbnRlcnBvbGF0ZTogZnVuY3Rpb24oYm91bmRhcnlTcmMsIGJvdW5kYXJ5RHN0LCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gKHZhbHVlIC0gYm91bmRhcnlTcmMubWluKSAvIChib3VuZGFyeVNyYy5tYXggLSBib3VuZGFyeVNyYy5taW4pICogKGJvdW5kYXJ5RHN0Lm1heCAtIGJvdW5kYXJ5RHN0Lm1pbikgKyBib3VuZGFyeURzdC5taW47XG4gICAgfSxcblxuICAgIGFkZFV2c1RvR2VvbXM6IGZ1bmN0aW9uKHV2cywgZ2VvbXMpIHtcbiAgICAgICAgZm9yIChsZXQgaSBpbiBnZW9tcykge1xuICAgICAgICAgICAgbGV0IHV2ID0gW107XG4gICAgICAgICAgICBpZiAoZ2VvbXNbaV0udXYpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdXZzW2ldKSB7XG4gICAgICAgICAgICAgICAgdXYgPSBBcnJheSgyICogZ2VvbXNbaV0ucG9pbnRzLmxlbmd0aCAvIDMpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGdlb21zW2ldLnV2cyA9IHV2O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFkZFV2VG9HZW9tOiBmdW5jdGlvbih1dnMsIGdlb20pIHtcbiAgICAgICAgaWYgKGdlb20udXZzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF1dnMgfHwgdXZzLmxlbmd0aCA9PT0wKSB7dXZzID0gbmV3IEFycmF5KDIgKiBnZW9tLnBvaW50cy5sZW5ndGggLyAzKS5maWxsKDApO31cbiAgICAgICAgZ2VvbS51dnMgPSB1dnM7XG4gICAgfSxcblxuICAgIGdldEJvdW5kYXJpZXM6IGZ1bmN0aW9uKHBhdGhzQnlEZXB0aCxvdXRlclNoYXBlLG9wdGlvbnMpXG4gICAge1xuICAgICAgICBsZXQgYm91bmRhcnk7XG4gICAgICAgIGxldCBib3VuZGFyeVRleDtcbiAgICAgICAgbGV0IG1heExlbmd0aCA9IHV2SGVscGVyLmdldE1heFBhdGhMZW5ndGgocGF0aHNCeURlcHRoKTtcbiAgICAgICAgbWF4TGVuZ3RoPSBNYXRoLm1heChwYXRoSGVscGVyLmdldFRvdGFsTGVuZ3RoKG91dGVyU2hhcGUucGF0aCkpO1xuICAgICAgICBsZXQgbWF4RGVwdGg9IG91dGVyU2hhcGUuZGVwdGg7XG4gICAgICAgIGxldCBtYXg9IE1hdGgubWF4KG1heExlbmd0aCxtYXhEZXB0aCk7XG4gICAgICAgIGJvdW5kYXJ5VGV4PSB7VTp7bWluOjAsIG1heDoxfSAsVjp7bWluOjAsbWF4OjF9fTtcbiAgICAgICAgYm91bmRhcnk9IHtYWTp7bWluOjAsIG1heDptYXh9ICxaOnttaW46MCxtYXg6bWF4fX07XG5cbiAgICAgICAgaWYob3B0aW9ucy5sZW5ndGhVKVxuICAgICAgICB7XG4gICAgICAgICAgICBib3VuZGFyeS5YWS5tYXg9IG9wdGlvbnMubGVuZ3RoVTtcbiAgICAgICAgfVxuICAgICAgICBpZihvcHRpb25zLmxlbmd0aFYpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGJvdW5kYXJ5LloubWF4PSBvcHRpb25zLmxlbmd0aFY7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge2JvdW5kYXJ5OmJvdW5kYXJ5LGJvdW5kYXJ5VGV4OmJvdW5kYXJ5VGV4fTtcbiAgICB9LFxuXG4gICAgZ2V0TzFCb3VkbmFyeVRleDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBYOiB7XG4gICAgICAgICAgICAgICAgbWluOiAwLFxuICAgICAgICAgICAgICAgIG1heDogMVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFk6IHtcbiAgICAgICAgICAgICAgICBtaW46IDAsXG4gICAgICAgICAgICAgICAgbWF4OiAxXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICB9XG5cbn07XG5tb2R1bGUuZXhwb3J0cyA9IHV2SGVscGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuZnVuY3Rpb24gY29tcGlsZVNlYXJjaChmdW5jTmFtZSwgcHJlZGljYXRlLCByZXZlcnNlZCwgZXh0cmFBcmdzLCBlYXJseU91dCkge1xuICB2YXIgY29kZSA9IFtcbiAgICBcImZ1bmN0aW9uIFwiLCBmdW5jTmFtZSwgXCIoYSxsLGgsXCIsIGV4dHJhQXJncy5qb2luKFwiLFwiKSwgIFwiKXtcIixcbmVhcmx5T3V0ID8gXCJcIiA6IFwidmFyIGk9XCIsIChyZXZlcnNlZCA/IFwibC0xXCIgOiBcImgrMVwiKSxcblwiO3doaWxlKGw8PWgpe1xcXG52YXIgbT0obCtoKT4+PjEseD1hW21dXCJdXG4gIGlmKGVhcmx5T3V0KSB7XG4gICAgaWYocHJlZGljYXRlLmluZGV4T2YoXCJjXCIpIDwgMCkge1xuICAgICAgY29kZS5wdXNoKFwiO2lmKHg9PT15KXtyZXR1cm4gbX1lbHNlIGlmKHg8PXkpe1wiKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb2RlLnB1c2goXCI7dmFyIHA9Yyh4LHkpO2lmKHA9PT0wKXtyZXR1cm4gbX1lbHNlIGlmKHA8PTApe1wiKVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb2RlLnB1c2goXCI7aWYoXCIsIHByZWRpY2F0ZSwgXCIpe2k9bTtcIilcbiAgfVxuICBpZihyZXZlcnNlZCkge1xuICAgIGNvZGUucHVzaChcImw9bSsxfWVsc2V7aD1tLTF9XCIpXG4gIH0gZWxzZSB7XG4gICAgY29kZS5wdXNoKFwiaD1tLTF9ZWxzZXtsPW0rMX1cIilcbiAgfVxuICBjb2RlLnB1c2goXCJ9XCIpXG4gIGlmKGVhcmx5T3V0KSB7XG4gICAgY29kZS5wdXNoKFwicmV0dXJuIC0xfTtcIilcbiAgfSBlbHNlIHtcbiAgICBjb2RlLnB1c2goXCJyZXR1cm4gaX07XCIpXG4gIH1cbiAgcmV0dXJuIGNvZGUuam9pbihcIlwiKVxufVxuXG5mdW5jdGlvbiBjb21waWxlQm91bmRzU2VhcmNoKHByZWRpY2F0ZSwgcmV2ZXJzZWQsIHN1ZmZpeCwgZWFybHlPdXQpIHtcbiAgdmFyIHJlc3VsdCA9IG5ldyBGdW5jdGlvbihbXG4gIGNvbXBpbGVTZWFyY2goXCJBXCIsIFwieFwiICsgcHJlZGljYXRlICsgXCJ5XCIsIHJldmVyc2VkLCBbXCJ5XCJdLCBlYXJseU91dCksXG4gIGNvbXBpbGVTZWFyY2goXCJQXCIsIFwiYyh4LHkpXCIgKyBwcmVkaWNhdGUgKyBcIjBcIiwgcmV2ZXJzZWQsIFtcInlcIiwgXCJjXCJdLCBlYXJseU91dCksXG5cImZ1bmN0aW9uIGRpc3BhdGNoQnNlYXJjaFwiLCBzdWZmaXgsIFwiKGEseSxjLGwsaCl7XFxcbmlmKHR5cGVvZihjKT09PSdmdW5jdGlvbicpe1xcXG5yZXR1cm4gUChhLChsPT09dm9pZCAwKT8wOmx8MCwoaD09PXZvaWQgMCk/YS5sZW5ndGgtMTpofDAseSxjKVxcXG59ZWxzZXtcXFxucmV0dXJuIEEoYSwoYz09PXZvaWQgMCk/MDpjfDAsKGw9PT12b2lkIDApP2EubGVuZ3RoLTE6bHwwLHkpXFxcbn19XFxcbnJldHVybiBkaXNwYXRjaEJzZWFyY2hcIiwgc3VmZml4XS5qb2luKFwiXCIpKVxuICByZXR1cm4gcmVzdWx0KClcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdlOiBjb21waWxlQm91bmRzU2VhcmNoKFwiPj1cIiwgZmFsc2UsIFwiR0VcIiksXG4gIGd0OiBjb21waWxlQm91bmRzU2VhcmNoKFwiPlwiLCBmYWxzZSwgXCJHVFwiKSxcbiAgbHQ6IGNvbXBpbGVCb3VuZHNTZWFyY2goXCI8XCIsIHRydWUsIFwiTFRcIiksXG4gIGxlOiBjb21waWxlQm91bmRzU2VhcmNoKFwiPD1cIiwgdHJ1ZSwgXCJMRVwiKSxcbiAgZXE6IGNvbXBpbGVCb3VuZHNTZWFyY2goXCItXCIsIHRydWUsIFwiRVFcIiwgdHJ1ZSlcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgbW9ub3RvbmVUcmlhbmd1bGF0ZSA9IHJlcXVpcmUoJy4vbGliL21vbm90b25lJylcbnZhciBtYWtlSW5kZXggPSByZXF1aXJlKCcuL2xpYi90cmlhbmd1bGF0aW9uJylcbnZhciBkZWxhdW5heUZsaXAgPSByZXF1aXJlKCcuL2xpYi9kZWxhdW5heScpXG52YXIgZmlsdGVyVHJpYW5ndWxhdGlvbiA9IHJlcXVpcmUoJy4vbGliL2ZpbHRlcicpXG5cbm1vZHVsZS5leHBvcnRzID0gY2R0MmRcblxuZnVuY3Rpb24gY2Fub25pY2FsaXplRWRnZShlKSB7XG4gIHJldHVybiBbTWF0aC5taW4oZVswXSwgZVsxXSksIE1hdGgubWF4KGVbMF0sIGVbMV0pXVxufVxuXG5mdW5jdGlvbiBjb21wYXJlRWRnZShhLCBiKSB7XG4gIHJldHVybiBhWzBdLWJbMF0gfHwgYVsxXS1iWzFdXG59XG5cbmZ1bmN0aW9uIGNhbm9uaWNhbGl6ZUVkZ2VzKGVkZ2VzKSB7XG4gIHJldHVybiBlZGdlcy5tYXAoY2Fub25pY2FsaXplRWRnZSkuc29ydChjb21wYXJlRWRnZSlcbn1cblxuZnVuY3Rpb24gZ2V0RGVmYXVsdChvcHRpb25zLCBwcm9wZXJ0eSwgZGZsdCkge1xuICBpZihwcm9wZXJ0eSBpbiBvcHRpb25zKSB7XG4gICAgcmV0dXJuIG9wdGlvbnNbcHJvcGVydHldXG4gIH1cbiAgcmV0dXJuIGRmbHRcbn1cblxuZnVuY3Rpb24gY2R0MmQocG9pbnRzLCBlZGdlcywgb3B0aW9ucykge1xuXG4gIGlmKCFBcnJheS5pc0FycmF5KGVkZ2VzKSkge1xuICAgIG9wdGlvbnMgPSBlZGdlcyB8fCB7fVxuICAgIGVkZ2VzID0gW11cbiAgfSBlbHNlIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgIGVkZ2VzID0gZWRnZXMgfHwgW11cbiAgfVxuXG4gIC8vUGFyc2Ugb3V0IG9wdGlvbnNcbiAgdmFyIGRlbGF1bmF5ID0gISFnZXREZWZhdWx0KG9wdGlvbnMsICdkZWxhdW5heScsIHRydWUpXG4gIHZhciBpbnRlcmlvciA9ICEhZ2V0RGVmYXVsdChvcHRpb25zLCAnaW50ZXJpb3InLCB0cnVlKVxuICB2YXIgZXh0ZXJpb3IgPSAhIWdldERlZmF1bHQob3B0aW9ucywgJ2V4dGVyaW9yJywgdHJ1ZSlcbiAgdmFyIGluZmluaXR5ID0gISFnZXREZWZhdWx0KG9wdGlvbnMsICdpbmZpbml0eScsIGZhbHNlKVxuXG4gIC8vSGFuZGxlIHRyaXZpYWwgY2FzZVxuICBpZigoIWludGVyaW9yICYmICFleHRlcmlvcikgfHwgcG9pbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBbXVxuICB9XG5cbiAgLy9Db25zdHJ1Y3QgaW5pdGlhbCB0cmlhbmd1bGF0aW9uXG4gIHZhciBjZWxscyA9IG1vbm90b25lVHJpYW5ndWxhdGUocG9pbnRzLCBlZGdlcylcblxuICAvL0lmIGRlbGF1bmF5IHJlZmluZW1lbnQgbmVlZGVkLCB0aGVuIGltcHJvdmUgcXVhbGl0eSBieSBlZGdlIGZsaXBwaW5nXG4gIGlmKGRlbGF1bmF5IHx8IGludGVyaW9yICE9PSBleHRlcmlvciB8fCBpbmZpbml0eSkge1xuXG4gICAgLy9JbmRleCBhbGwgb2YgdGhlIGNlbGxzIHRvIHN1cHBvcnQgZmFzdCBuZWlnaGJvcmhvb2QgcXVlcmllc1xuICAgIHZhciB0cmlhbmd1bGF0aW9uID0gbWFrZUluZGV4KHBvaW50cy5sZW5ndGgsIGNhbm9uaWNhbGl6ZUVkZ2VzKGVkZ2VzKSlcbiAgICBmb3IodmFyIGk9MDsgaTxjZWxscy5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIGYgPSBjZWxsc1tpXVxuICAgICAgdHJpYW5ndWxhdGlvbi5hZGRUcmlhbmdsZShmWzBdLCBmWzFdLCBmWzJdKVxuICAgIH1cblxuICAgIC8vUnVuIGVkZ2UgZmxpcHBpbmdcbiAgICBpZihkZWxhdW5heSkge1xuICAgICAgZGVsYXVuYXlGbGlwKHBvaW50cywgdHJpYW5ndWxhdGlvbilcbiAgICB9XG5cbiAgICAvL0ZpbHRlciBwb2ludHNcbiAgICBpZighZXh0ZXJpb3IpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJUcmlhbmd1bGF0aW9uKHRyaWFuZ3VsYXRpb24sIC0xKVxuICAgIH0gZWxzZSBpZighaW50ZXJpb3IpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJUcmlhbmd1bGF0aW9uKHRyaWFuZ3VsYXRpb24sICAxLCBpbmZpbml0eSlcbiAgICB9IGVsc2UgaWYoaW5maW5pdHkpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJUcmlhbmd1bGF0aW9uKHRyaWFuZ3VsYXRpb24sIDAsIGluZmluaXR5KVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdHJpYW5ndWxhdGlvbi5jZWxscygpXG4gICAgfVxuICAgIFxuICB9IGVsc2Uge1xuICAgIHJldHVybiBjZWxsc1xuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIGluQ2lyY2xlID0gcmVxdWlyZSgncm9idXN0LWluLXNwaGVyZScpWzRdXG52YXIgYnNlYXJjaCA9IHJlcXVpcmUoJ2JpbmFyeS1zZWFyY2gtYm91bmRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBkZWxhdW5heVJlZmluZVxuXG5mdW5jdGlvbiB0ZXN0RmxpcChwb2ludHMsIHRyaWFuZ3VsYXRpb24sIHN0YWNrLCBhLCBiLCB4KSB7XG4gIHZhciB5ID0gdHJpYW5ndWxhdGlvbi5vcHBvc2l0ZShhLCBiKVxuXG4gIC8vVGVzdCBib3VuZGFyeSBlZGdlXG4gIGlmKHkgPCAwKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICAvL1N3YXAgZWRnZSBpZiBvcmRlciBmbGlwcGVkXG4gIGlmKGIgPCBhKSB7XG4gICAgdmFyIHRtcCA9IGFcbiAgICBhID0gYlxuICAgIGIgPSB0bXBcbiAgICB0bXAgPSB4XG4gICAgeCA9IHlcbiAgICB5ID0gdG1wXG4gIH1cblxuICAvL1Rlc3QgaWYgZWRnZSBpcyBjb25zdHJhaW5lZFxuICBpZih0cmlhbmd1bGF0aW9uLmlzQ29uc3RyYWludChhLCBiKSkge1xuICAgIHJldHVyblxuICB9XG5cbiAgLy9UZXN0IGlmIGVkZ2UgaXMgZGVsYXVuYXlcbiAgaWYoaW5DaXJjbGUocG9pbnRzW2FdLCBwb2ludHNbYl0sIHBvaW50c1t4XSwgcG9pbnRzW3ldKSA8IDApIHtcbiAgICBzdGFjay5wdXNoKGEsIGIpXG4gIH1cbn1cblxuLy9Bc3N1bWUgZWRnZXMgYXJlIHNvcnRlZCBsZXhpY29ncmFwaGljYWxseVxuZnVuY3Rpb24gZGVsYXVuYXlSZWZpbmUocG9pbnRzLCB0cmlhbmd1bGF0aW9uKSB7XG4gIHZhciBzdGFjayA9IFtdXG5cbiAgdmFyIG51bVBvaW50cyA9IHBvaW50cy5sZW5ndGhcbiAgdmFyIHN0YXJzID0gdHJpYW5ndWxhdGlvbi5zdGFyc1xuICBmb3IodmFyIGE9MDsgYTxudW1Qb2ludHM7ICsrYSkge1xuICAgIHZhciBzdGFyID0gc3RhcnNbYV1cbiAgICBmb3IodmFyIGo9MTsgajxzdGFyLmxlbmd0aDsgais9Mikge1xuICAgICAgdmFyIGIgPSBzdGFyW2pdXG5cbiAgICAgIC8vSWYgb3JkZXIgaXMgbm90IGNvbnNpc3RlbnQsIHRoZW4gc2tpcCBlZGdlXG4gICAgICBpZihiIDwgYSkge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvL0NoZWNrIGlmIGVkZ2UgaXMgY29uc3RyYWluZWRcbiAgICAgIGlmKHRyaWFuZ3VsYXRpb24uaXNDb25zdHJhaW50KGEsIGIpKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vRmluZCBvcHBvc2l0ZSBlZGdlXG4gICAgICB2YXIgeCA9IHN0YXJbai0xXSwgeSA9IC0xXG4gICAgICBmb3IodmFyIGs9MTsgazxzdGFyLmxlbmd0aDsgays9Mikge1xuICAgICAgICBpZihzdGFyW2stMV0gPT09IGIpIHtcbiAgICAgICAgICB5ID0gc3RhcltrXVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy9JZiB0aGlzIGlzIGEgYm91bmRhcnkgZWRnZSwgZG9uJ3QgZmxpcCBpdFxuICAgICAgaWYoeSA8IDApIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy9JZiBlZGdlIGlzIGluIGNpcmNsZSwgZmxpcCBpdFxuICAgICAgaWYoaW5DaXJjbGUocG9pbnRzW2FdLCBwb2ludHNbYl0sIHBvaW50c1t4XSwgcG9pbnRzW3ldKSA8IDApIHtcbiAgICAgICAgc3RhY2sucHVzaChhLCBiKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHdoaWxlKHN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICB2YXIgYiA9IHN0YWNrLnBvcCgpXG4gICAgdmFyIGEgPSBzdGFjay5wb3AoKVxuXG4gICAgLy9GaW5kIG9wcG9zaXRlIHBhaXJzXG4gICAgdmFyIHggPSAtMSwgeSA9IC0xXG4gICAgdmFyIHN0YXIgPSBzdGFyc1thXVxuICAgIGZvcih2YXIgaT0xOyBpPHN0YXIubGVuZ3RoOyBpKz0yKSB7XG4gICAgICB2YXIgcyA9IHN0YXJbaS0xXVxuICAgICAgdmFyIHQgPSBzdGFyW2ldXG4gICAgICBpZihzID09PSBiKSB7XG4gICAgICAgIHkgPSB0XG4gICAgICB9IGVsc2UgaWYodCA9PT0gYikge1xuICAgICAgICB4ID0gc1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vSWYgeC95IGFyZSBib3RoIHZhbGlkIHRoZW4gc2tpcCBlZGdlXG4gICAgaWYoeCA8IDAgfHwgeSA8IDApIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgLy9JZiBlZGdlIGlzIG5vdyBkZWxhdW5heSwgdGhlbiBkb24ndCBmbGlwIGl0XG4gICAgaWYoaW5DaXJjbGUocG9pbnRzW2FdLCBwb2ludHNbYl0sIHBvaW50c1t4XSwgcG9pbnRzW3ldKSA+PSAwKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIC8vRmxpcCB0aGUgZWRnZVxuICAgIHRyaWFuZ3VsYXRpb24uZmxpcChhLCBiKVxuXG4gICAgLy9UZXN0IGZsaXBwaW5nIG5laWdoYm9yaW5nIGVkZ2VzXG4gICAgdGVzdEZsaXAocG9pbnRzLCB0cmlhbmd1bGF0aW9uLCBzdGFjaywgeCwgYSwgeSlcbiAgICB0ZXN0RmxpcChwb2ludHMsIHRyaWFuZ3VsYXRpb24sIHN0YWNrLCBhLCB5LCB4KVxuICAgIHRlc3RGbGlwKHBvaW50cywgdHJpYW5ndWxhdGlvbiwgc3RhY2ssIHksIGIsIHgpXG4gICAgdGVzdEZsaXAocG9pbnRzLCB0cmlhbmd1bGF0aW9uLCBzdGFjaywgYiwgeCwgeSlcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBic2VhcmNoID0gcmVxdWlyZSgnYmluYXJ5LXNlYXJjaC1ib3VuZHMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzaWZ5RmFjZXNcblxuZnVuY3Rpb24gRmFjZUluZGV4KGNlbGxzLCBuZWlnaGJvciwgY29uc3RyYWludCwgZmxhZ3MsIGFjdGl2ZSwgbmV4dCwgYm91bmRhcnkpIHtcbiAgdGhpcy5jZWxscyAgICAgICA9IGNlbGxzXG4gIHRoaXMubmVpZ2hib3IgICAgPSBuZWlnaGJvclxuICB0aGlzLmZsYWdzICAgICAgID0gZmxhZ3NcbiAgdGhpcy5jb25zdHJhaW50ICA9IGNvbnN0cmFpbnRcbiAgdGhpcy5hY3RpdmUgICAgICA9IGFjdGl2ZVxuICB0aGlzLm5leHQgICAgICAgID0gbmV4dFxuICB0aGlzLmJvdW5kYXJ5ICAgID0gYm91bmRhcnlcbn1cblxudmFyIHByb3RvID0gRmFjZUluZGV4LnByb3RvdHlwZVxuXG5mdW5jdGlvbiBjb21wYXJlQ2VsbChhLCBiKSB7XG4gIHJldHVybiBhWzBdIC0gYlswXSB8fFxuICAgICAgICAgYVsxXSAtIGJbMV0gfHxcbiAgICAgICAgIGFbMl0gLSBiWzJdXG59XG5cbnByb3RvLmxvY2F0ZSA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGtleSA9IFswLDAsMF1cbiAgcmV0dXJuIGZ1bmN0aW9uKGEsIGIsIGMpIHtcbiAgICB2YXIgeCA9IGEsIHkgPSBiLCB6ID0gY1xuICAgIGlmKGIgPCBjKSB7XG4gICAgICBpZihiIDwgYSkge1xuICAgICAgICB4ID0gYlxuICAgICAgICB5ID0gY1xuICAgICAgICB6ID0gYVxuICAgICAgfVxuICAgIH0gZWxzZSBpZihjIDwgYSkge1xuICAgICAgeCA9IGNcbiAgICAgIHkgPSBhXG4gICAgICB6ID0gYlxuICAgIH1cbiAgICBpZih4IDwgMCkge1xuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIGtleVswXSA9IHhcbiAgICBrZXlbMV0gPSB5XG4gICAga2V5WzJdID0gelxuICAgIHJldHVybiBic2VhcmNoLmVxKHRoaXMuY2VsbHMsIGtleSwgY29tcGFyZUNlbGwpXG4gIH1cbn0pKClcblxuZnVuY3Rpb24gaW5kZXhDZWxscyh0cmlhbmd1bGF0aW9uLCBpbmZpbml0eSkge1xuICAvL0ZpcnN0IGdldCBjZWxscyBhbmQgY2Fub25pY2FsaXplXG4gIHZhciBjZWxscyA9IHRyaWFuZ3VsYXRpb24uY2VsbHMoKVxuICB2YXIgbmMgPSBjZWxscy5sZW5ndGhcbiAgZm9yKHZhciBpPTA7IGk8bmM7ICsraSkge1xuICAgIHZhciBjID0gY2VsbHNbaV1cbiAgICB2YXIgeCA9IGNbMF0sIHkgPSBjWzFdLCB6ID0gY1syXVxuICAgIGlmKHkgPCB6KSB7XG4gICAgICBpZih5IDwgeCkge1xuICAgICAgICBjWzBdID0geVxuICAgICAgICBjWzFdID0gelxuICAgICAgICBjWzJdID0geFxuICAgICAgfVxuICAgIH0gZWxzZSBpZih6IDwgeCkge1xuICAgICAgY1swXSA9IHpcbiAgICAgIGNbMV0gPSB4XG4gICAgICBjWzJdID0geVxuICAgIH1cbiAgfVxuICBjZWxscy5zb3J0KGNvbXBhcmVDZWxsKVxuXG4gIC8vSW5pdGlhbGl6ZSBmbGFnIGFycmF5XG4gIHZhciBmbGFncyA9IG5ldyBBcnJheShuYylcbiAgZm9yKHZhciBpPTA7IGk8ZmxhZ3MubGVuZ3RoOyArK2kpIHtcbiAgICBmbGFnc1tpXSA9IDBcbiAgfVxuXG4gIC8vQnVpbGQgbmVpZ2hib3IgaW5kZXgsIGluaXRpYWxpemUgcXVldWVzXG4gIHZhciBhY3RpdmUgPSBbXVxuICB2YXIgbmV4dCAgID0gW11cbiAgdmFyIG5laWdoYm9yID0gbmV3IEFycmF5KDMqbmMpXG4gIHZhciBjb25zdHJhaW50ID0gbmV3IEFycmF5KDMqbmMpXG4gIHZhciBib3VuZGFyeSA9IG51bGxcbiAgaWYoaW5maW5pdHkpIHtcbiAgICBib3VuZGFyeSA9IFtdXG4gIH1cbiAgdmFyIGluZGV4ID0gbmV3IEZhY2VJbmRleChcbiAgICBjZWxscyxcbiAgICBuZWlnaGJvcixcbiAgICBjb25zdHJhaW50LFxuICAgIGZsYWdzLFxuICAgIGFjdGl2ZSxcbiAgICBuZXh0LFxuICAgIGJvdW5kYXJ5KVxuICBmb3IodmFyIGk9MDsgaTxuYzsgKytpKSB7XG4gICAgdmFyIGMgPSBjZWxsc1tpXVxuICAgIGZvcih2YXIgaj0wOyBqPDM7ICsraikge1xuICAgICAgdmFyIHggPSBjW2pdLCB5ID0gY1soaisxKSUzXVxuICAgICAgdmFyIGEgPSBuZWlnaGJvclszKmkral0gPSBpbmRleC5sb2NhdGUoeSwgeCwgdHJpYW5ndWxhdGlvbi5vcHBvc2l0ZSh5LCB4KSlcbiAgICAgIHZhciBiID0gY29uc3RyYWludFszKmkral0gPSB0cmlhbmd1bGF0aW9uLmlzQ29uc3RyYWludCh4LCB5KVxuICAgICAgaWYoYSA8IDApIHtcbiAgICAgICAgaWYoYikge1xuICAgICAgICAgIG5leHQucHVzaChpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFjdGl2ZS5wdXNoKGkpXG4gICAgICAgICAgZmxhZ3NbaV0gPSAxXG4gICAgICAgIH1cbiAgICAgICAgaWYoaW5maW5pdHkpIHtcbiAgICAgICAgICBib3VuZGFyeS5wdXNoKFt5LCB4LCAtMV0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGluZGV4XG59XG5cbmZ1bmN0aW9uIGZpbHRlckNlbGxzKGNlbGxzLCBmbGFncywgdGFyZ2V0KSB7XG4gIHZhciBwdHIgPSAwXG4gIGZvcih2YXIgaT0wOyBpPGNlbGxzLmxlbmd0aDsgKytpKSB7XG4gICAgaWYoZmxhZ3NbaV0gPT09IHRhcmdldCkge1xuICAgICAgY2VsbHNbcHRyKytdID0gY2VsbHNbaV1cbiAgICB9XG4gIH1cbiAgY2VsbHMubGVuZ3RoID0gcHRyXG4gIHJldHVybiBjZWxsc1xufVxuXG5mdW5jdGlvbiBjbGFzc2lmeUZhY2VzKHRyaWFuZ3VsYXRpb24sIHRhcmdldCwgaW5maW5pdHkpIHtcbiAgdmFyIGluZGV4ID0gaW5kZXhDZWxscyh0cmlhbmd1bGF0aW9uLCBpbmZpbml0eSlcblxuICBpZih0YXJnZXQgPT09IDApIHtcbiAgICBpZihpbmZpbml0eSkge1xuICAgICAgcmV0dXJuIGluZGV4LmNlbGxzLmNvbmNhdChpbmRleC5ib3VuZGFyeSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGluZGV4LmNlbGxzXG4gICAgfVxuICB9XG5cbiAgdmFyIHNpZGUgPSAxXG4gIHZhciBhY3RpdmUgPSBpbmRleC5hY3RpdmVcbiAgdmFyIG5leHQgPSBpbmRleC5uZXh0XG4gIHZhciBmbGFncyA9IGluZGV4LmZsYWdzXG4gIHZhciBjZWxscyA9IGluZGV4LmNlbGxzXG4gIHZhciBjb25zdHJhaW50ID0gaW5kZXguY29uc3RyYWludFxuICB2YXIgbmVpZ2hib3IgPSBpbmRleC5uZWlnaGJvclxuXG4gIHdoaWxlKGFjdGl2ZS5sZW5ndGggPiAwIHx8IG5leHQubGVuZ3RoID4gMCkge1xuICAgIHdoaWxlKGFjdGl2ZS5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgdCA9IGFjdGl2ZS5wb3AoKVxuICAgICAgaWYoZmxhZ3NbdF0gPT09IC1zaWRlKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICBmbGFnc1t0XSA9IHNpZGVcbiAgICAgIHZhciBjID0gY2VsbHNbdF1cbiAgICAgIGZvcih2YXIgaj0wOyBqPDM7ICsraikge1xuICAgICAgICB2YXIgZiA9IG5laWdoYm9yWzMqdCtqXVxuICAgICAgICBpZihmID49IDAgJiYgZmxhZ3NbZl0gPT09IDApIHtcbiAgICAgICAgICBpZihjb25zdHJhaW50WzMqdCtqXSkge1xuICAgICAgICAgICAgbmV4dC5wdXNoKGYpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFjdGl2ZS5wdXNoKGYpXG4gICAgICAgICAgICBmbGFnc1tmXSA9IHNpZGVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL1N3YXAgYXJyYXlzIGFuZCBsb29wXG4gICAgdmFyIHRtcCA9IG5leHRcbiAgICBuZXh0ID0gYWN0aXZlXG4gICAgYWN0aXZlID0gdG1wXG4gICAgbmV4dC5sZW5ndGggPSAwXG4gICAgc2lkZSA9IC1zaWRlXG4gIH1cblxuICB2YXIgcmVzdWx0ID0gZmlsdGVyQ2VsbHMoY2VsbHMsIGZsYWdzLCB0YXJnZXQpXG4gIGlmKGluZmluaXR5KSB7XG4gICAgcmV0dXJuIHJlc3VsdC5jb25jYXQoaW5kZXguYm91bmRhcnkpXG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBic2VhcmNoID0gcmVxdWlyZSgnYmluYXJ5LXNlYXJjaC1ib3VuZHMnKVxudmFyIG9yaWVudCA9IHJlcXVpcmUoJ3JvYnVzdC1vcmllbnRhdGlvbicpWzNdXG5cbnZhciBFVkVOVF9QT0lOVCA9IDBcbnZhciBFVkVOVF9FTkQgICA9IDFcbnZhciBFVkVOVF9TVEFSVCA9IDJcblxubW9kdWxlLmV4cG9ydHMgPSBtb25vdG9uZVRyaWFuZ3VsYXRlXG5cbi8vQSBwYXJ0aWFsIGNvbnZleCBodWxsIGZyYWdtZW50LCBtYWRlIG9mIHR3byB1bmltb25vdG9uZSBwb2x5Z29uc1xuZnVuY3Rpb24gUGFydGlhbEh1bGwoYSwgYiwgaWR4LCBsb3dlcklkcywgdXBwZXJJZHMpIHtcbiAgdGhpcy5hID0gYVxuICB0aGlzLmIgPSBiXG4gIHRoaXMuaWR4ID0gaWR4XG4gIHRoaXMubG93ZXJJZHMgPSBsb3dlcklkc1xuICB0aGlzLnVwcGVySWRzID0gdXBwZXJJZHNcbn1cblxuLy9BbiBldmVudCBpbiB0aGUgc3dlZXAgbGluZSBwcm9jZWR1cmVcbmZ1bmN0aW9uIEV2ZW50KGEsIGIsIHR5cGUsIGlkeCkge1xuICB0aGlzLmEgICAgPSBhXG4gIHRoaXMuYiAgICA9IGJcbiAgdGhpcy50eXBlID0gdHlwZVxuICB0aGlzLmlkeCAgPSBpZHhcbn1cblxuLy9UaGlzIGlzIHVzZWQgdG8gY29tcGFyZSBldmVudHMgZm9yIHRoZSBzd2VlcCBsaW5lIHByb2NlZHVyZVxuLy8gUG9pbnRzIGFyZTpcbi8vICAxLiBzb3J0ZWQgbGV4aWNvZ3JhcGhpY2FsbHlcbi8vICAyLiBzb3J0ZWQgYnkgdHlwZSAgKHBvaW50IDwgZW5kIDwgc3RhcnQpXG4vLyAgMy4gc2VnbWVudHMgc29ydGVkIGJ5IHdpbmRpbmcgb3JkZXJcbi8vICA0LiBzb3J0ZWQgYnkgaW5kZXhcbmZ1bmN0aW9uIGNvbXBhcmVFdmVudChhLCBiKSB7XG4gIHZhciBkID1cbiAgICAoYS5hWzBdIC0gYi5hWzBdKSB8fFxuICAgIChhLmFbMV0gLSBiLmFbMV0pIHx8XG4gICAgKGEudHlwZSAtIGIudHlwZSlcbiAgaWYoZCkgeyByZXR1cm4gZCB9XG4gIGlmKGEudHlwZSAhPT0gRVZFTlRfUE9JTlQpIHtcbiAgICBkID0gb3JpZW50KGEuYSwgYS5iLCBiLmIpXG4gICAgaWYoZCkgeyByZXR1cm4gZCB9XG4gIH1cbiAgcmV0dXJuIGEuaWR4IC0gYi5pZHhcbn1cblxuZnVuY3Rpb24gdGVzdFBvaW50KGh1bGwsIHApIHtcbiAgcmV0dXJuIG9yaWVudChodWxsLmEsIGh1bGwuYiwgcClcbn1cblxuZnVuY3Rpb24gYWRkUG9pbnQoY2VsbHMsIGh1bGxzLCBwb2ludHMsIHAsIGlkeCkge1xuICB2YXIgbG8gPSBic2VhcmNoLmx0KGh1bGxzLCBwLCB0ZXN0UG9pbnQpXG4gIHZhciBoaSA9IGJzZWFyY2guZ3QoaHVsbHMsIHAsIHRlc3RQb2ludClcbiAgZm9yKHZhciBpPWxvOyBpPGhpOyArK2kpIHtcbiAgICB2YXIgaHVsbCA9IGh1bGxzW2ldXG5cbiAgICAvL0luc2VydCBwIGludG8gbG93ZXIgaHVsbFxuICAgIHZhciBsb3dlcklkcyA9IGh1bGwubG93ZXJJZHNcbiAgICB2YXIgbSA9IGxvd2VySWRzLmxlbmd0aFxuICAgIHdoaWxlKG0gPiAxICYmIG9yaWVudChcbiAgICAgICAgcG9pbnRzW2xvd2VySWRzW20tMl1dLFxuICAgICAgICBwb2ludHNbbG93ZXJJZHNbbS0xXV0sXG4gICAgICAgIHApID4gMCkge1xuICAgICAgY2VsbHMucHVzaChcbiAgICAgICAgW2xvd2VySWRzW20tMV0sXG4gICAgICAgICBsb3dlcklkc1ttLTJdLFxuICAgICAgICAgaWR4XSlcbiAgICAgIG0gLT0gMVxuICAgIH1cbiAgICBsb3dlcklkcy5sZW5ndGggPSBtXG4gICAgbG93ZXJJZHMucHVzaChpZHgpXG5cbiAgICAvL0luc2VydCBwIGludG8gdXBwZXIgaHVsbFxuICAgIHZhciB1cHBlcklkcyA9IGh1bGwudXBwZXJJZHNcbiAgICB2YXIgbSA9IHVwcGVySWRzLmxlbmd0aFxuICAgIHdoaWxlKG0gPiAxICYmIG9yaWVudChcbiAgICAgICAgcG9pbnRzW3VwcGVySWRzW20tMl1dLFxuICAgICAgICBwb2ludHNbdXBwZXJJZHNbbS0xXV0sXG4gICAgICAgIHApIDwgMCkge1xuICAgICAgY2VsbHMucHVzaChcbiAgICAgICAgW3VwcGVySWRzW20tMl0sXG4gICAgICAgICB1cHBlcklkc1ttLTFdLFxuICAgICAgICAgaWR4XSlcbiAgICAgIG0gLT0gMVxuICAgIH1cbiAgICB1cHBlcklkcy5sZW5ndGggPSBtXG4gICAgdXBwZXJJZHMucHVzaChpZHgpXG4gIH1cbn1cblxuZnVuY3Rpb24gZmluZFNwbGl0KGh1bGwsIGVkZ2UpIHtcbiAgdmFyIGRcbiAgaWYoaHVsbC5hWzBdIDwgZWRnZS5hWzBdKSB7XG4gICAgZCA9IG9yaWVudChodWxsLmEsIGh1bGwuYiwgZWRnZS5hKVxuICB9IGVsc2Uge1xuICAgIGQgPSBvcmllbnQoZWRnZS5iLCBlZGdlLmEsIGh1bGwuYSlcbiAgfVxuICBpZihkKSB7IHJldHVybiBkIH1cbiAgaWYoZWRnZS5iWzBdIDwgaHVsbC5iWzBdKSB7XG4gICAgZCA9IG9yaWVudChodWxsLmEsIGh1bGwuYiwgZWRnZS5iKVxuICB9IGVsc2Uge1xuICAgIGQgPSBvcmllbnQoZWRnZS5iLCBlZGdlLmEsIGh1bGwuYilcbiAgfVxuICByZXR1cm4gZCB8fCBodWxsLmlkeCAtIGVkZ2UuaWR4XG59XG5cbmZ1bmN0aW9uIHNwbGl0SHVsbHMoaHVsbHMsIHBvaW50cywgZXZlbnQpIHtcbiAgdmFyIHNwbGl0SWR4ID0gYnNlYXJjaC5sZShodWxscywgZXZlbnQsIGZpbmRTcGxpdClcbiAgdmFyIGh1bGwgPSBodWxsc1tzcGxpdElkeF1cbiAgdmFyIHVwcGVySWRzID0gaHVsbC51cHBlcklkc1xuICB2YXIgeCA9IHVwcGVySWRzW3VwcGVySWRzLmxlbmd0aC0xXVxuICBodWxsLnVwcGVySWRzID0gW3hdXG4gIGh1bGxzLnNwbGljZShzcGxpdElkeCsxLCAwLFxuICAgIG5ldyBQYXJ0aWFsSHVsbChldmVudC5hLCBldmVudC5iLCBldmVudC5pZHgsIFt4XSwgdXBwZXJJZHMpKVxufVxuXG5cbmZ1bmN0aW9uIG1lcmdlSHVsbHMoaHVsbHMsIHBvaW50cywgZXZlbnQpIHtcbiAgLy9Td2FwIHBvaW50ZXJzIGZvciBtZXJnZSBzZWFyY2hcbiAgdmFyIHRtcCA9IGV2ZW50LmFcbiAgZXZlbnQuYSA9IGV2ZW50LmJcbiAgZXZlbnQuYiA9IHRtcFxuICB2YXIgbWVyZ2VJZHggPSBic2VhcmNoLmVxKGh1bGxzLCBldmVudCwgZmluZFNwbGl0KVxuICB2YXIgdXBwZXIgPSBodWxsc1ttZXJnZUlkeF1cbiAgdmFyIGxvd2VyID0gaHVsbHNbbWVyZ2VJZHgtMV1cbiAgbG93ZXIudXBwZXJJZHMgPSB1cHBlci51cHBlcklkc1xuICBodWxscy5zcGxpY2UobWVyZ2VJZHgsIDEpXG59XG5cblxuZnVuY3Rpb24gbW9ub3RvbmVUcmlhbmd1bGF0ZShwb2ludHMsIGVkZ2VzKSB7XG5cbiAgdmFyIG51bVBvaW50cyA9IHBvaW50cy5sZW5ndGhcbiAgdmFyIG51bUVkZ2VzID0gZWRnZXMubGVuZ3RoXG5cbiAgdmFyIGV2ZW50cyA9IFtdXG5cbiAgLy9DcmVhdGUgcG9pbnQgZXZlbnRzXG4gIGZvcih2YXIgaT0wOyBpPG51bVBvaW50czsgKytpKSB7XG4gICAgZXZlbnRzLnB1c2gobmV3IEV2ZW50KFxuICAgICAgcG9pbnRzW2ldLFxuICAgICAgbnVsbCxcbiAgICAgIEVWRU5UX1BPSU5ULFxuICAgICAgaSkpXG4gIH1cblxuICAvL0NyZWF0ZSBlZGdlIGV2ZW50c1xuICBmb3IodmFyIGk9MDsgaTxudW1FZGdlczsgKytpKSB7XG4gICAgdmFyIGUgPSBlZGdlc1tpXVxuICAgIHZhciBhID0gcG9pbnRzW2VbMF1dXG4gICAgdmFyIGIgPSBwb2ludHNbZVsxXV1cbiAgICBpZihhWzBdIDwgYlswXSkge1xuICAgICAgZXZlbnRzLnB1c2goXG4gICAgICAgIG5ldyBFdmVudChhLCBiLCBFVkVOVF9TVEFSVCwgaSksXG4gICAgICAgIG5ldyBFdmVudChiLCBhLCBFVkVOVF9FTkQsIGkpKVxuICAgIH0gZWxzZSBpZihhWzBdID4gYlswXSkge1xuICAgICAgZXZlbnRzLnB1c2goXG4gICAgICAgIG5ldyBFdmVudChiLCBhLCBFVkVOVF9TVEFSVCwgaSksXG4gICAgICAgIG5ldyBFdmVudChhLCBiLCBFVkVOVF9FTkQsIGkpKVxuICAgIH1cbiAgfVxuXG4gIC8vU29ydCBldmVudHNcbiAgZXZlbnRzLnNvcnQoY29tcGFyZUV2ZW50KVxuXG4gIC8vSW5pdGlhbGl6ZSBodWxsXG4gIHZhciBtaW5YID0gZXZlbnRzWzBdLmFbMF0gLSAoMSArIE1hdGguYWJzKGV2ZW50c1swXS5hWzBdKSkgKiBNYXRoLnBvdygyLCAtNTIpXG4gIHZhciBodWxsID0gWyBuZXcgUGFydGlhbEh1bGwoW21pblgsIDFdLCBbbWluWCwgMF0sIC0xLCBbXSwgW10sIFtdLCBbXSkgXVxuXG4gIC8vUHJvY2VzcyBldmVudHMgaW4gb3JkZXJcbiAgdmFyIGNlbGxzID0gW11cbiAgZm9yKHZhciBpPTAsIG51bUV2ZW50cz1ldmVudHMubGVuZ3RoOyBpPG51bUV2ZW50czsgKytpKSB7XG4gICAgdmFyIGV2ZW50ID0gZXZlbnRzW2ldXG4gICAgdmFyIHR5cGUgPSBldmVudC50eXBlXG4gICAgaWYodHlwZSA9PT0gRVZFTlRfUE9JTlQpIHtcbiAgICAgIGFkZFBvaW50KGNlbGxzLCBodWxsLCBwb2ludHMsIGV2ZW50LmEsIGV2ZW50LmlkeClcbiAgICB9IGVsc2UgaWYodHlwZSA9PT0gRVZFTlRfU1RBUlQpIHtcbiAgICAgIHNwbGl0SHVsbHMoaHVsbCwgcG9pbnRzLCBldmVudClcbiAgICB9IGVsc2Uge1xuICAgICAgbWVyZ2VIdWxscyhodWxsLCBwb2ludHMsIGV2ZW50KVxuICAgIH1cbiAgfVxuXG4gIC8vUmV0dXJuIHRyaWFuZ3VsYXRpb25cbiAgcmV0dXJuIGNlbGxzXG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIGJzZWFyY2ggPSByZXF1aXJlKCdiaW5hcnktc2VhcmNoLWJvdW5kcycpXG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlVHJpYW5ndWxhdGlvblxuXG5mdW5jdGlvbiBUcmlhbmd1bGF0aW9uKHN0YXJzLCBlZGdlcykge1xuICB0aGlzLnN0YXJzID0gc3RhcnNcbiAgdGhpcy5lZGdlcyA9IGVkZ2VzXG59XG5cbnZhciBwcm90byA9IFRyaWFuZ3VsYXRpb24ucHJvdG90eXBlXG5cbmZ1bmN0aW9uIHJlbW92ZVBhaXIobGlzdCwgaiwgaykge1xuICBmb3IodmFyIGk9MSwgbj1saXN0Lmxlbmd0aDsgaTxuOyBpKz0yKSB7XG4gICAgaWYobGlzdFtpLTFdID09PSBqICYmIGxpc3RbaV0gPT09IGspIHtcbiAgICAgIGxpc3RbaS0xXSA9IGxpc3Rbbi0yXVxuICAgICAgbGlzdFtpXSA9IGxpc3Rbbi0xXVxuICAgICAgbGlzdC5sZW5ndGggPSBuIC0gMlxuICAgICAgcmV0dXJuXG4gICAgfVxuICB9XG59XG5cbnByb3RvLmlzQ29uc3RyYWludCA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGUgPSBbMCwwXVxuICBmdW5jdGlvbiBjb21wYXJlTGV4KGEsIGIpIHtcbiAgICByZXR1cm4gYVswXSAtIGJbMF0gfHwgYVsxXSAtIGJbMV1cbiAgfVxuICByZXR1cm4gZnVuY3Rpb24oaSwgaikge1xuICAgIGVbMF0gPSBNYXRoLm1pbihpLGopXG4gICAgZVsxXSA9IE1hdGgubWF4KGksailcbiAgICByZXR1cm4gYnNlYXJjaC5lcSh0aGlzLmVkZ2VzLCBlLCBjb21wYXJlTGV4KSA+PSAwXG4gIH1cbn0pKClcblxucHJvdG8ucmVtb3ZlVHJpYW5nbGUgPSBmdW5jdGlvbihpLCBqLCBrKSB7XG4gIHZhciBzdGFycyA9IHRoaXMuc3RhcnNcbiAgcmVtb3ZlUGFpcihzdGFyc1tpXSwgaiwgaylcbiAgcmVtb3ZlUGFpcihzdGFyc1tqXSwgaywgaSlcbiAgcmVtb3ZlUGFpcihzdGFyc1trXSwgaSwgailcbn1cblxucHJvdG8uYWRkVHJpYW5nbGUgPSBmdW5jdGlvbihpLCBqLCBrKSB7XG4gIHZhciBzdGFycyA9IHRoaXMuc3RhcnNcbiAgc3RhcnNbaV0ucHVzaChqLCBrKVxuICBzdGFyc1tqXS5wdXNoKGssIGkpXG4gIHN0YXJzW2tdLnB1c2goaSwgailcbn1cblxucHJvdG8ub3Bwb3NpdGUgPSBmdW5jdGlvbihqLCBpKSB7XG4gIHZhciBsaXN0ID0gdGhpcy5zdGFyc1tpXVxuICBmb3IodmFyIGs9MSwgbj1saXN0Lmxlbmd0aDsgazxuOyBrKz0yKSB7XG4gICAgaWYobGlzdFtrXSA9PT0gaikge1xuICAgICAgcmV0dXJuIGxpc3Rbay0xXVxuICAgIH1cbiAgfVxuICByZXR1cm4gLTFcbn1cblxucHJvdG8uZmxpcCA9IGZ1bmN0aW9uKGksIGopIHtcbiAgdmFyIGEgPSB0aGlzLm9wcG9zaXRlKGksIGopXG4gIHZhciBiID0gdGhpcy5vcHBvc2l0ZShqLCBpKVxuICB0aGlzLnJlbW92ZVRyaWFuZ2xlKGksIGosIGEpXG4gIHRoaXMucmVtb3ZlVHJpYW5nbGUoaiwgaSwgYilcbiAgdGhpcy5hZGRUcmlhbmdsZShpLCBiLCBhKVxuICB0aGlzLmFkZFRyaWFuZ2xlKGosIGEsIGIpXG59XG5cbnByb3RvLmVkZ2VzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzdGFycyA9IHRoaXMuc3RhcnNcbiAgdmFyIHJlc3VsdCA9IFtdXG4gIGZvcih2YXIgaT0wLCBuPXN0YXJzLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICB2YXIgbGlzdCA9IHN0YXJzW2ldXG4gICAgZm9yKHZhciBqPTAsIG09bGlzdC5sZW5ndGg7IGo8bTsgais9Mikge1xuICAgICAgcmVzdWx0LnB1c2goW2xpc3Rbal0sIGxpc3RbaisxXV0pXG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxucHJvdG8uY2VsbHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHN0YXJzID0gdGhpcy5zdGFyc1xuICB2YXIgcmVzdWx0ID0gW11cbiAgZm9yKHZhciBpPTAsIG49c3RhcnMubGVuZ3RoOyBpPG47ICsraSkge1xuICAgIHZhciBsaXN0ID0gc3RhcnNbaV1cbiAgICBmb3IodmFyIGo9MCwgbT1saXN0Lmxlbmd0aDsgajxtOyBqKz0yKSB7XG4gICAgICB2YXIgcyA9IGxpc3Rbal1cbiAgICAgIHZhciB0ID0gbGlzdFtqKzFdXG4gICAgICBpZihpIDwgTWF0aC5taW4ocywgdCkpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goW2ksIHMsIHRdKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVRyaWFuZ3VsYXRpb24obnVtVmVydHMsIGVkZ2VzKSB7XG4gIHZhciBzdGFycyA9IG5ldyBBcnJheShudW1WZXJ0cylcbiAgZm9yKHZhciBpPTA7IGk8bnVtVmVydHM7ICsraSkge1xuICAgIHN0YXJzW2ldID0gW11cbiAgfVxuICByZXR1cm4gbmV3IFRyaWFuZ3VsYXRpb24oc3RhcnMsIGVkZ2VzKVxufVxuIiwiLy8gcmV2IDQ4MlxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIEF1dGhvciAgICA6ICBBbmd1cyBKb2huc29uICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogVmVyc2lvbiAgIDogIDYuMi4xICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIERhdGUgICAgICA6ICAzMSBPY3RvYmVyIDIwMTQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogV2Vic2l0ZSAgIDogIGh0dHA6Ly93d3cuYW5ndXNqLmNvbSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBDb3B5cmlnaHQgOiAgQW5ndXMgSm9obnNvbiAyMDEwLTIwMTQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogTGljZW5zZTogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBVc2UsIG1vZGlmaWNhdGlvbiAmIGRpc3RyaWJ1dGlvbiBpcyBzdWJqZWN0IHRvIEJvb3N0IFNvZnR3YXJlIExpY2Vuc2UgVmVyIDEuICpcbiAqIGh0dHA6Ly93d3cuYm9vc3Qub3JnL0xJQ0VOU0VfMV8wLnR4dCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBBdHRyaWJ1dGlvbnM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIFRoZSBjb2RlIGluIHRoaXMgbGlicmFyeSBpcyBhbiBleHRlbnNpb24gb2YgQmFsYSBWYXR0aSdzIGNsaXBwaW5nIGFsZ29yaXRobTogKlxuICogXCJBIGdlbmVyaWMgc29sdXRpb24gdG8gcG9seWdvbiBjbGlwcGluZ1wiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIENvbW11bmljYXRpb25zIG9mIHRoZSBBQ00sIFZvbCAzNSwgSXNzdWUgNyAoSnVseSAxOTkyKSBwcCA1Ni02My4gICAgICAgICAgICAgKlxuICogaHR0cDovL3BvcnRhbC5hY20ub3JnL2NpdGF0aW9uLmNmbT9pZD0xMjk5MDYgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIENvbXB1dGVyIGdyYXBoaWNzIGFuZCBnZW9tZXRyaWMgbW9kZWxpbmc6IGltcGxlbWVudGF0aW9uIGFuZCBhbGdvcml0aG1zICAgICAgKlxuICogQnkgTWF4IEsuIEFnb3N0b24gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBTcHJpbmdlcjsgMSBlZGl0aW9uIChKYW51YXJ5IDQsIDIwMDUpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIGh0dHA6Ly9ib29rcy5nb29nbGUuY29tL2Jvb2tzP3E9dmF0dGkrY2xpcHBpbmcrYWdvc3RvbiAgICAgICAgICAgICAgICAgICAgICAgKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBTZWUgYWxzbzogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIFwiUG9seWdvbiBPZmZzZXR0aW5nIGJ5IENvbXB1dGluZyBXaW5kaW5nIE51bWJlcnNcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBQYXBlciBuby4gREVUQzIwMDUtODU1MTMgcHAuIDU2NS01NzUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIEFTTUUgMjAwNSBJbnRlcm5hdGlvbmFsIERlc2lnbiBFbmdpbmVlcmluZyBUZWNobmljYWwgQ29uZmVyZW5jZXMgICAgICAgICAgICAgKlxuICogYW5kIENvbXB1dGVycyBhbmQgSW5mb3JtYXRpb24gaW4gRW5naW5lZXJpbmcgQ29uZmVyZW5jZSAoSURFVEMvQ0lFMjAwNSkgICAgICAqXG4gKiBTZXB0ZW1iZXIgMjQtMjgsIDIwMDUgLCBMb25nIEJlYWNoLCBDYWxpZm9ybmlhLCBVU0EgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIGh0dHA6Ly93d3cubWUuYmVya2VsZXkuZWR1L35tY21haW5zL3B1YnMvREFDMDVPZmZzZXRQb2x5Z29uLnBkZiAgICAgICAgICAgICAgKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIEF1dGhvciAgICA6ICBUaW1vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogVmVyc2lvbiAgIDogIDYuMi4xLjAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBEYXRlICAgICAgOiAgMTcgSnVuZSAyMDE2ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogVGhpcyBpcyBhIHRyYW5zbGF0aW9uIG9mIHRoZSBDIyBDbGlwcGVyIGxpYnJhcnkgdG8gSmF2YXNjcmlwdC4gICAgICAgICAgICAgICAqXG4gKiBJbnQxMjggc3RydWN0IG9mIEMjIGlzIGltcGxlbWVudGVkIHVzaW5nIEpTQk4gb2YgVG9tIFd1LiAgICAgICAgICAgICAgICAgICAgICpcbiAqIEJlY2F1c2UgSmF2YXNjcmlwdCBsYWNrcyBzdXBwb3J0IGZvciA2NC1iaXQgaW50ZWdlcnMsIHRoZSBzcGFjZSAgICAgICAgICAgICAgKlxuICogaXMgYSBsaXR0bGUgbW9yZSByZXN0cmljdGVkIHRoYW4gaW4gQyMgdmVyc2lvbi4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIEMjIHZlcnNpb24gaGFzIHN1cHBvcnQgZm9yIGNvb3JkaW5hdGUgc3BhY2U6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogKy00NjExNjg2MDE4NDI3Mzg3OTAzICggc3FydCgyXjEyNyAtMSkvMiApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiB3aGlsZSBKYXZhc2NyaXB0IHZlcnNpb24gaGFzIHN1cHBvcnQgZm9yIHNwYWNlOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICstNDUwMzU5OTYyNzM3MDQ5NSAoIHNxcnQoMl4xMDYgLTEpLzIgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBUb20gV3UncyBKU0JOIHByb3ZlZCB0byBiZSB0aGUgZmFzdGVzdCBiaWcgaW50ZWdlciBsaWJyYXJ5OiAgICAgICAgICAgICAgICAgICpcbiAqIGh0dHA6Ly9qc3BlcmYuY29tL2JpZy1pbnRlZ2VyLWxpYnJhcnktdGVzdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBUaGlzIGNsYXNzIGNhbiBiZSBtYWRlIHNpbXBsZXIgd2hlbiAoaWYgZXZlcikgNjQtYml0IGludGVnZXIgc3VwcG9ydCBjb21lcy4gICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBCYXNpYyBKYXZhU2NyaXB0IEJOIGxpYnJhcnkgLSBzdWJzZXQgdXNlZnVsIGZvciBSU0EgZW5jcnlwdGlvbi4gICAgICAgICAgICAgICpcbiAqIGh0dHA6Ly93d3ctY3Mtc3R1ZGVudHMuc3RhbmZvcmQuZWR1L350ancvanNibi8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogQ29weXJpZ2h0IChjKSAyMDA1ICBUb20gV3UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBBbGwgUmlnaHRzIFJlc2VydmVkLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIFNlZSBcIkxJQ0VOU0VcIiBmb3IgZGV0YWlsczogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBodHRwOi8vd3d3LWNzLXN0dWRlbnRzLnN0YW5mb3JkLmVkdS9+dGp3L2pzYm4vTElDRU5TRSAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4oZnVuY3Rpb24gKClcbntcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIC8vdXNlX2ludDMyOiBXaGVuIGVuYWJsZWQgMzJiaXQgaW50cyBhcmUgdXNlZCBpbnN0ZWFkIG9mIDY0Yml0IGludHMuIFRoaXNcbiAgLy9pbXByb3ZlIHBlcmZvcm1hbmNlIGJ1dCBjb29yZGluYXRlIHZhbHVlcyBhcmUgbGltaXRlZCB0byB0aGUgcmFuZ2UgKy8tIDQ2MzQwXG4gIHZhciB1c2VfaW50MzIgPSBmYWxzZTtcbiAgLy91c2VfeHl6OiBhZGRzIGEgWiBtZW1iZXIgdG8gSW50UG9pbnQuIEFkZHMgYSBtaW5vciBjb3N0IHRvIHBlcmZvcm1hbmNlLlxuICB2YXIgdXNlX3h5eiA9IGZhbHNlO1xuICAvL1VzZUxpbmVzOiBFbmFibGVzIG9wZW4gcGF0aCBjbGlwcGluZy4gQWRkcyBhIHZlcnkgbWlub3IgY29zdCB0byBwZXJmb3JtYW5jZS5cbiAgdmFyIHVzZV9saW5lcyA9IHRydWU7XG5cbiAgdmFyIENsaXBwZXJMaWIgPSB7fTtcbiAgdmFyIGlzTm9kZSA9IGZhbHNlO1xuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXG4gIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IENsaXBwZXJMaWI7XG4gICAgaXNOb2RlID0gdHJ1ZTtcbiAgfVxuICBlbHNlXG4gIHtcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICBkZWZpbmUoQ2xpcHBlckxpYik7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgKGRvY3VtZW50KSAhPT0gXCJ1bmRlZmluZWRcIikgd2luZG93LkNsaXBwZXJMaWIgPSBDbGlwcGVyTGliO1xuICAgIGVsc2Ugc2VsZlsnQ2xpcHBlckxpYiddID0gQ2xpcHBlckxpYjtcbiAgfVxuICB2YXIgbmF2aWdhdG9yX2FwcE5hbWU7XG4gIGlmICghaXNOb2RlKVxuICB7XG4gICAgdmFyIG5hdiA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpO1xuICAgIG5hdmlnYXRvcl9hcHBOYW1lID0gbmF2aWdhdG9yLmFwcE5hbWU7XG4gIH1cbiAgZWxzZVxuICB7XG4gICAgdmFyIG5hdiA9IFwiY2hyb21lXCI7IC8vIE5vZGUuanMgdXNlcyBDaHJvbWUncyBWOCBlbmdpbmVcbiAgICBuYXZpZ2F0b3JfYXBwTmFtZSA9IFwiTmV0c2NhcGVcIjsgLy8gRmlyZWZveCwgQ2hyb21lIGFuZCBTYWZhcmkgcmV0dXJucyBcIk5ldHNjYXBlXCIsIHNvIE5vZGUuanMgc2hvdWxkIGFsc29cbiAgfVxuICAvLyBCcm93c2VyIHRlc3QgdG8gc3BlZWR1cCBwZXJmb3JtYW5jZSBjcml0aWNhbCBmdW5jdGlvbnNcbiAgdmFyIGJyb3dzZXIgPSB7fTtcbiAgaWYgKG5hdi5pbmRleE9mKFwiY2hyb21lXCIpICE9IC0xICYmIG5hdi5pbmRleE9mKFwiY2hyb21pdW1cIikgPT0gLTEpIGJyb3dzZXIuY2hyb21lID0gMTtcbiAgZWxzZSBicm93c2VyLmNocm9tZSA9IDA7XG4gIGlmIChuYXYuaW5kZXhPZihcImNocm9taXVtXCIpICE9IC0xKSBicm93c2VyLmNocm9taXVtID0gMTtcbiAgZWxzZSBicm93c2VyLmNocm9taXVtID0gMDtcbiAgaWYgKG5hdi5pbmRleE9mKFwic2FmYXJpXCIpICE9IC0xICYmIG5hdi5pbmRleE9mKFwiY2hyb21lXCIpID09IC0xICYmIG5hdi5pbmRleE9mKFwiY2hyb21pdW1cIikgPT0gLTEpIGJyb3dzZXIuc2FmYXJpID0gMTtcbiAgZWxzZSBicm93c2VyLnNhZmFyaSA9IDA7XG4gIGlmIChuYXYuaW5kZXhPZihcImZpcmVmb3hcIikgIT0gLTEpIGJyb3dzZXIuZmlyZWZveCA9IDE7XG4gIGVsc2UgYnJvd3Nlci5maXJlZm94ID0gMDtcbiAgaWYgKG5hdi5pbmRleE9mKFwiZmlyZWZveC8xN1wiKSAhPSAtMSkgYnJvd3Nlci5maXJlZm94MTcgPSAxO1xuICBlbHNlIGJyb3dzZXIuZmlyZWZveDE3ID0gMDtcbiAgaWYgKG5hdi5pbmRleE9mKFwiZmlyZWZveC8xNVwiKSAhPSAtMSkgYnJvd3Nlci5maXJlZm94MTUgPSAxO1xuICBlbHNlIGJyb3dzZXIuZmlyZWZveDE1ID0gMDtcbiAgaWYgKG5hdi5pbmRleE9mKFwiZmlyZWZveC8zXCIpICE9IC0xKSBicm93c2VyLmZpcmVmb3gzID0gMTtcbiAgZWxzZSBicm93c2VyLmZpcmVmb3gzID0gMDtcbiAgaWYgKG5hdi5pbmRleE9mKFwib3BlcmFcIikgIT0gLTEpIGJyb3dzZXIub3BlcmEgPSAxO1xuICBlbHNlIGJyb3dzZXIub3BlcmEgPSAwO1xuICBpZiAobmF2LmluZGV4T2YoXCJtc2llIDEwXCIpICE9IC0xKSBicm93c2VyLm1zaWUxMCA9IDE7XG4gIGVsc2UgYnJvd3Nlci5tc2llMTAgPSAwO1xuICBpZiAobmF2LmluZGV4T2YoXCJtc2llIDlcIikgIT0gLTEpIGJyb3dzZXIubXNpZTkgPSAxO1xuICBlbHNlIGJyb3dzZXIubXNpZTkgPSAwO1xuICBpZiAobmF2LmluZGV4T2YoXCJtc2llIDhcIikgIT0gLTEpIGJyb3dzZXIubXNpZTggPSAxO1xuICBlbHNlIGJyb3dzZXIubXNpZTggPSAwO1xuICBpZiAobmF2LmluZGV4T2YoXCJtc2llIDdcIikgIT0gLTEpIGJyb3dzZXIubXNpZTcgPSAxO1xuICBlbHNlIGJyb3dzZXIubXNpZTcgPSAwO1xuICBpZiAobmF2LmluZGV4T2YoXCJtc2llIFwiKSAhPSAtMSkgYnJvd3Nlci5tc2llID0gMTtcbiAgZWxzZSBicm93c2VyLm1zaWUgPSAwO1xuICBDbGlwcGVyTGliLmJpZ2ludGVnZXJfdXNlZCA9IG51bGw7XG5cbiAgLy8gQ29weXJpZ2h0IChjKSAyMDA1ICBUb20gV3VcbiAgLy8gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAgLy8gU2VlIFwiTElDRU5TRVwiIGZvciBkZXRhaWxzLlxuICAvLyBCYXNpYyBKYXZhU2NyaXB0IEJOIGxpYnJhcnkgLSBzdWJzZXQgdXNlZnVsIGZvciBSU0EgZW5jcnlwdGlvbi5cbiAgLy8gQml0cyBwZXIgZGlnaXRcbiAgdmFyIGRiaXRzO1xuICAvLyBKYXZhU2NyaXB0IGVuZ2luZSBhbmFseXNpc1xuICB2YXIgY2FuYXJ5ID0gMHhkZWFkYmVlZmNhZmU7XG4gIHZhciBqX2xtID0gKChjYW5hcnkgJiAweGZmZmZmZikgPT0gMHhlZmNhZmUpO1xuICAvLyAocHVibGljKSBDb25zdHJ1Y3RvclxuICBmdW5jdGlvbiBCaWdJbnRlZ2VyKGEsIGIsIGMpXG4gIHtcbiAgICAvLyBUaGlzIHRlc3QgdmFyaWFibGUgY2FuIGJlIHJlbW92ZWQsXG4gICAgLy8gYnV0IGF0IGxlYXN0IGZvciBwZXJmb3JtYW5jZSB0ZXN0cyBpdCBpcyB1c2VmdWwgcGllY2Ugb2Yga25vd2xlZGdlXG4gICAgLy8gVGhpcyBpcyB0aGUgb25seSBDbGlwcGVyTGliIHJlbGF0ZWQgdmFyaWFibGUgaW4gQmlnSW50ZWdlciBsaWJyYXJ5XG4gICAgQ2xpcHBlckxpYi5iaWdpbnRlZ2VyX3VzZWQgPSAxO1xuICAgIGlmIChhICE9IG51bGwpXG4gICAgICBpZiAoXCJudW1iZXJcIiA9PSB0eXBlb2YgYSAmJiBcInVuZGVmaW5lZFwiID09IHR5cGVvZiAoYikpIHRoaXMuZnJvbUludChhKTsgLy8gZmFzdGVyIGNvbnZlcnNpb25cbiAgICAgIGVsc2UgaWYgKFwibnVtYmVyXCIgPT0gdHlwZW9mIGEpIHRoaXMuZnJvbU51bWJlcihhLCBiLCBjKTtcbiAgICBlbHNlIGlmIChiID09IG51bGwgJiYgXCJzdHJpbmdcIiAhPSB0eXBlb2YgYSkgdGhpcy5mcm9tU3RyaW5nKGEsIDI1Nik7XG4gICAgZWxzZSB0aGlzLmZyb21TdHJpbmcoYSwgYik7XG4gIH1cbiAgLy8gcmV0dXJuIG5ldywgdW5zZXQgQmlnSW50ZWdlclxuICBmdW5jdGlvbiBuYmkoKVxuICB7XG4gICAgcmV0dXJuIG5ldyBCaWdJbnRlZ2VyKG51bGwsdW5kZWZpbmVkLHVuZGVmaW5lZCk7XG4gIH1cbiAgLy8gYW06IENvbXB1dGUgd19qICs9ICh4KnRoaXNfaSksIHByb3BhZ2F0ZSBjYXJyaWVzLFxuICAvLyBjIGlzIGluaXRpYWwgY2FycnksIHJldHVybnMgZmluYWwgY2FycnkuXG4gIC8vIGMgPCAzKmR2YWx1ZSwgeCA8IDIqZHZhbHVlLCB0aGlzX2kgPCBkdmFsdWVcbiAgLy8gV2UgbmVlZCB0byBzZWxlY3QgdGhlIGZhc3Rlc3Qgb25lIHRoYXQgd29ya3MgaW4gdGhpcyBlbnZpcm9ubWVudC5cbiAgLy8gYW0xOiB1c2UgYSBzaW5nbGUgbXVsdCBhbmQgZGl2aWRlIHRvIGdldCB0aGUgaGlnaCBiaXRzLFxuICAvLyBtYXggZGlnaXQgYml0cyBzaG91bGQgYmUgMjYgYmVjYXVzZVxuICAvLyBtYXggaW50ZXJuYWwgdmFsdWUgPSAyKmR2YWx1ZV4yLTIqZHZhbHVlICg8IDJeNTMpXG4gIGZ1bmN0aW9uIGFtMShpLCB4LCB3LCBqLCBjLCBuKVxuICB7XG4gICAgd2hpbGUgKC0tbiA+PSAwKVxuICAgIHtcbiAgICAgIHZhciB2ID0geCAqIHRoaXNbaSsrXSArIHdbal0gKyBjO1xuICAgICAgYyA9IE1hdGguZmxvb3IodiAvIDB4NDAwMDAwMCk7XG4gICAgICB3W2orK10gPSB2ICYgMHgzZmZmZmZmO1xuICAgIH1cbiAgICByZXR1cm4gYztcbiAgfVxuICAvLyBhbTIgYXZvaWRzIGEgYmlnIG11bHQtYW5kLWV4dHJhY3QgY29tcGxldGVseS5cbiAgLy8gTWF4IGRpZ2l0IGJpdHMgc2hvdWxkIGJlIDw9IDMwIGJlY2F1c2Ugd2UgZG8gYml0d2lzZSBvcHNcbiAgLy8gb24gdmFsdWVzIHVwIHRvIDIqaGR2YWx1ZV4yLWhkdmFsdWUtMSAoPCAyXjMxKVxuICBmdW5jdGlvbiBhbTIoaSwgeCwgdywgaiwgYywgbilcbiAge1xuICAgIHZhciB4bCA9IHggJiAweDdmZmYsXG4gICAgICB4aCA9IHggPj4gMTU7XG4gICAgd2hpbGUgKC0tbiA+PSAwKVxuICAgIHtcbiAgICAgIHZhciBsID0gdGhpc1tpXSAmIDB4N2ZmZjtcbiAgICAgIHZhciBoID0gdGhpc1tpKytdID4+IDE1O1xuICAgICAgdmFyIG0gPSB4aCAqIGwgKyBoICogeGw7XG4gICAgICBsID0geGwgKiBsICsgKChtICYgMHg3ZmZmKSA8PCAxNSkgKyB3W2pdICsgKGMgJiAweDNmZmZmZmZmKTtcbiAgICAgIGMgPSAobCA+Pj4gMzApICsgKG0gPj4+IDE1KSArIHhoICogaCArIChjID4+PiAzMCk7XG4gICAgICB3W2orK10gPSBsICYgMHgzZmZmZmZmZjtcbiAgICB9XG4gICAgcmV0dXJuIGM7XG4gIH1cbiAgLy8gQWx0ZXJuYXRlbHksIHNldCBtYXggZGlnaXQgYml0cyB0byAyOCBzaW5jZSBzb21lXG4gIC8vIGJyb3dzZXJzIHNsb3cgZG93biB3aGVuIGRlYWxpbmcgd2l0aCAzMi1iaXQgbnVtYmVycy5cbiAgZnVuY3Rpb24gYW0zKGksIHgsIHcsIGosIGMsIG4pXG4gIHtcbiAgICB2YXIgeGwgPSB4ICYgMHgzZmZmLFxuICAgICAgeGggPSB4ID4+IDE0O1xuICAgIHdoaWxlICgtLW4gPj0gMClcbiAgICB7XG4gICAgICB2YXIgbCA9IHRoaXNbaV0gJiAweDNmZmY7XG4gICAgICB2YXIgaCA9IHRoaXNbaSsrXSA+PiAxNDtcbiAgICAgIHZhciBtID0geGggKiBsICsgaCAqIHhsO1xuICAgICAgbCA9IHhsICogbCArICgobSAmIDB4M2ZmZikgPDwgMTQpICsgd1tqXSArIGM7XG4gICAgICBjID0gKGwgPj4gMjgpICsgKG0gPj4gMTQpICsgeGggKiBoO1xuICAgICAgd1tqKytdID0gbCAmIDB4ZmZmZmZmZjtcbiAgICB9XG4gICAgcmV0dXJuIGM7XG4gIH1cbiAgaWYgKGpfbG0gJiYgKG5hdmlnYXRvcl9hcHBOYW1lID09IFwiTWljcm9zb2Z0IEludGVybmV0IEV4cGxvcmVyXCIpKVxuICB7XG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuYW0gPSBhbTI7XG4gICAgZGJpdHMgPSAzMDtcbiAgfVxuICBlbHNlIGlmIChqX2xtICYmIChuYXZpZ2F0b3JfYXBwTmFtZSAhPSBcIk5ldHNjYXBlXCIpKVxuICB7XG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuYW0gPSBhbTE7XG4gICAgZGJpdHMgPSAyNjtcbiAgfVxuICBlbHNlXG4gIHsgLy8gTW96aWxsYS9OZXRzY2FwZSBzZWVtcyB0byBwcmVmZXIgYW0zXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuYW0gPSBhbTM7XG4gICAgZGJpdHMgPSAyODtcbiAgfVxuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5EQiA9IGRiaXRzO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5ETSA9ICgoMSA8PCBkYml0cykgLSAxKTtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuRFYgPSAoMSA8PCBkYml0cyk7XG4gIHZhciBCSV9GUCA9IDUyO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5GViA9IE1hdGgucG93KDIsIEJJX0ZQKTtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuRjEgPSBCSV9GUCAtIGRiaXRzO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5GMiA9IDIgKiBkYml0cyAtIEJJX0ZQO1xuICAvLyBEaWdpdCBjb252ZXJzaW9uc1xuICB2YXIgQklfUk0gPSBcIjAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5elwiO1xuICB2YXIgQklfUkMgPSBuZXcgQXJyYXkoKTtcbiAgdmFyIHJyLCB2djtcbiAgcnIgPSBcIjBcIi5jaGFyQ29kZUF0KDApO1xuICBmb3IgKHZ2ID0gMDsgdnYgPD0gOTsgKyt2dikgQklfUkNbcnIrK10gPSB2djtcbiAgcnIgPSBcImFcIi5jaGFyQ29kZUF0KDApO1xuICBmb3IgKHZ2ID0gMTA7IHZ2IDwgMzY7ICsrdnYpIEJJX1JDW3JyKytdID0gdnY7XG4gIHJyID0gXCJBXCIuY2hhckNvZGVBdCgwKTtcbiAgZm9yICh2diA9IDEwOyB2diA8IDM2OyArK3Z2KSBCSV9SQ1tycisrXSA9IHZ2O1xuXG4gIGZ1bmN0aW9uIGludDJjaGFyKG4pXG4gIHtcbiAgICByZXR1cm4gQklfUk0uY2hhckF0KG4pO1xuICB9XG5cbiAgZnVuY3Rpb24gaW50QXQocywgaSlcbiAge1xuICAgIHZhciBjID0gQklfUkNbcy5jaGFyQ29kZUF0KGkpXTtcbiAgICByZXR1cm4gKGMgPT0gbnVsbCkgPyAtMSA6IGM7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgY29weSB0aGlzIHRvIHJcbiAgZnVuY3Rpb24gYm5wQ29weVRvKHIpXG4gIHtcbiAgICBmb3IgKHZhciBpID0gdGhpcy50IC0gMTsgaSA+PSAwOyAtLWkpIHJbaV0gPSB0aGlzW2ldO1xuICAgIHIudCA9IHRoaXMudDtcbiAgICByLnMgPSB0aGlzLnM7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgc2V0IGZyb20gaW50ZWdlciB2YWx1ZSB4LCAtRFYgPD0geCA8IERWXG4gIGZ1bmN0aW9uIGJucEZyb21JbnQoeClcbiAge1xuICAgIHRoaXMudCA9IDE7XG4gICAgdGhpcy5zID0gKHggPCAwKSA/IC0xIDogMDtcbiAgICBpZiAoeCA+IDApIHRoaXNbMF0gPSB4O1xuICAgIGVsc2UgaWYgKHggPCAtMSkgdGhpc1swXSA9IHggKyB0aGlzLkRWO1xuICAgIGVsc2UgdGhpcy50ID0gMDtcbiAgfVxuICAvLyByZXR1cm4gYmlnaW50IGluaXRpYWxpemVkIHRvIHZhbHVlXG4gIGZ1bmN0aW9uIG5idihpKVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICByLmZyb21JbnQoaSk7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgc2V0IGZyb20gc3RyaW5nIGFuZCByYWRpeFxuICBmdW5jdGlvbiBibnBGcm9tU3RyaW5nKHMsIGIpXG4gIHtcbiAgICB2YXIgaztcbiAgICBpZiAoYiA9PSAxNikgayA9IDQ7XG4gICAgZWxzZSBpZiAoYiA9PSA4KSBrID0gMztcbiAgICBlbHNlIGlmIChiID09IDI1NikgayA9IDg7IC8vIGJ5dGUgYXJyYXlcbiAgICBlbHNlIGlmIChiID09IDIpIGsgPSAxO1xuICAgIGVsc2UgaWYgKGIgPT0gMzIpIGsgPSA1O1xuICAgIGVsc2UgaWYgKGIgPT0gNCkgayA9IDI7XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIHRoaXMuZnJvbVJhZGl4KHMsIGIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnQgPSAwO1xuICAgIHRoaXMucyA9IDA7XG4gICAgdmFyIGkgPSBzLmxlbmd0aCxcbiAgICAgIG1pID0gZmFsc2UsXG4gICAgICBzaCA9IDA7XG4gICAgd2hpbGUgKC0taSA+PSAwKVxuICAgIHtcbiAgICAgIHZhciB4ID0gKGsgPT0gOCkgPyBzW2ldICYgMHhmZiA6IGludEF0KHMsIGkpO1xuICAgICAgaWYgKHggPCAwKVxuICAgICAge1xuICAgICAgICBpZiAocy5jaGFyQXQoaSkgPT0gXCItXCIpIG1pID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBtaSA9IGZhbHNlO1xuICAgICAgaWYgKHNoID09IDApXG4gICAgICAgIHRoaXNbdGhpcy50KytdID0geDtcbiAgICAgIGVsc2UgaWYgKHNoICsgayA+IHRoaXMuREIpXG4gICAgICB7XG4gICAgICAgIHRoaXNbdGhpcy50IC0gMV0gfD0gKHggJiAoKDEgPDwgKHRoaXMuREIgLSBzaCkpIC0gMSkpIDw8IHNoO1xuICAgICAgICB0aGlzW3RoaXMudCsrXSA9ICh4ID4+ICh0aGlzLkRCIC0gc2gpKTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgICAgdGhpc1t0aGlzLnQgLSAxXSB8PSB4IDw8IHNoO1xuICAgICAgc2ggKz0gaztcbiAgICAgIGlmIChzaCA+PSB0aGlzLkRCKSBzaCAtPSB0aGlzLkRCO1xuICAgIH1cbiAgICBpZiAoayA9PSA4ICYmIChzWzBdICYgMHg4MCkgIT0gMClcbiAgICB7XG4gICAgICB0aGlzLnMgPSAtMTtcbiAgICAgIGlmIChzaCA+IDApIHRoaXNbdGhpcy50IC0gMV0gfD0gKCgxIDw8ICh0aGlzLkRCIC0gc2gpKSAtIDEpIDw8IHNoO1xuICAgIH1cbiAgICB0aGlzLmNsYW1wKCk7XG4gICAgaWYgKG1pKSBCaWdJbnRlZ2VyLlpFUk8uc3ViVG8odGhpcywgdGhpcyk7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgY2xhbXAgb2ZmIGV4Y2VzcyBoaWdoIHdvcmRzXG4gIGZ1bmN0aW9uIGJucENsYW1wKClcbiAge1xuICAgIHZhciBjID0gdGhpcy5zICYgdGhpcy5ETTtcbiAgICB3aGlsZSAodGhpcy50ID4gMCAmJiB0aGlzW3RoaXMudCAtIDFdID09IGMpLS10aGlzLnQ7XG4gIH1cbiAgLy8gKHB1YmxpYykgcmV0dXJuIHN0cmluZyByZXByZXNlbnRhdGlvbiBpbiBnaXZlbiByYWRpeFxuICBmdW5jdGlvbiBiblRvU3RyaW5nKGIpXG4gIHtcbiAgICBpZiAodGhpcy5zIDwgMCkgcmV0dXJuIFwiLVwiICsgdGhpcy5uZWdhdGUoKS50b1N0cmluZyhiKTtcbiAgICB2YXIgaztcbiAgICBpZiAoYiA9PSAxNikgayA9IDQ7XG4gICAgZWxzZSBpZiAoYiA9PSA4KSBrID0gMztcbiAgICBlbHNlIGlmIChiID09IDIpIGsgPSAxO1xuICAgIGVsc2UgaWYgKGIgPT0gMzIpIGsgPSA1O1xuICAgIGVsc2UgaWYgKGIgPT0gNCkgayA9IDI7XG4gICAgZWxzZSByZXR1cm4gdGhpcy50b1JhZGl4KGIpO1xuICAgIHZhciBrbSA9ICgxIDw8IGspIC0gMSxcbiAgICAgIGQsIG0gPSBmYWxzZSxcbiAgICAgIHIgPSBcIlwiLFxuICAgICAgaSA9IHRoaXMudDtcbiAgICB2YXIgcCA9IHRoaXMuREIgLSAoaSAqIHRoaXMuREIpICUgaztcbiAgICBpZiAoaS0tID4gMClcbiAgICB7XG4gICAgICBpZiAocCA8IHRoaXMuREIgJiYgKGQgPSB0aGlzW2ldID4+IHApID4gMClcbiAgICAgIHtcbiAgICAgICAgbSA9IHRydWU7XG4gICAgICAgIHIgPSBpbnQyY2hhcihkKTtcbiAgICAgIH1cbiAgICAgIHdoaWxlIChpID49IDApXG4gICAgICB7XG4gICAgICAgIGlmIChwIDwgaylcbiAgICAgICAge1xuICAgICAgICAgIGQgPSAodGhpc1tpXSAmICgoMSA8PCBwKSAtIDEpKSA8PCAoayAtIHApO1xuICAgICAgICAgIGQgfD0gdGhpc1stLWldID4+IChwICs9IHRoaXMuREIgLSBrKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICBkID0gKHRoaXNbaV0gPj4gKHAgLT0gaykpICYga207XG4gICAgICAgICAgaWYgKHAgPD0gMClcbiAgICAgICAgICB7XG4gICAgICAgICAgICBwICs9IHRoaXMuREI7XG4gICAgICAgICAgICAtLWk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChkID4gMCkgbSA9IHRydWU7XG4gICAgICAgIGlmIChtKSByICs9IGludDJjaGFyKGQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbSA/IHIgOiBcIjBcIjtcbiAgfVxuICAvLyAocHVibGljKSAtdGhpc1xuICBmdW5jdGlvbiBibk5lZ2F0ZSgpXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIEJpZ0ludGVnZXIuWkVSTy5zdWJUbyh0aGlzLCByKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSB8dGhpc3xcbiAgZnVuY3Rpb24gYm5BYnMoKVxuICB7XG4gICAgcmV0dXJuICh0aGlzLnMgPCAwKSA/IHRoaXMubmVnYXRlKCkgOiB0aGlzO1xuICB9XG4gIC8vIChwdWJsaWMpIHJldHVybiArIGlmIHRoaXMgPiBhLCAtIGlmIHRoaXMgPCBhLCAwIGlmIGVxdWFsXG4gIGZ1bmN0aW9uIGJuQ29tcGFyZVRvKGEpXG4gIHtcbiAgICB2YXIgciA9IHRoaXMucyAtIGEucztcbiAgICBpZiAociAhPSAwKSByZXR1cm4gcjtcbiAgICB2YXIgaSA9IHRoaXMudDtcbiAgICByID0gaSAtIGEudDtcbiAgICBpZiAociAhPSAwKSByZXR1cm4gKHRoaXMucyA8IDApID8gLXIgOiByO1xuICAgIHdoaWxlICgtLWkgPj0gMClcbiAgICAgIGlmICgociA9IHRoaXNbaV0gLSBhW2ldKSAhPSAwKSByZXR1cm4gcjtcbiAgICByZXR1cm4gMDtcbiAgfVxuICAvLyByZXR1cm5zIGJpdCBsZW5ndGggb2YgdGhlIGludGVnZXIgeFxuICBmdW5jdGlvbiBuYml0cyh4KVxuICB7XG4gICAgdmFyIHIgPSAxLFxuICAgICAgdDtcbiAgICBpZiAoKHQgPSB4ID4+PiAxNikgIT0gMClcbiAgICB7XG4gICAgICB4ID0gdDtcbiAgICAgIHIgKz0gMTY7XG4gICAgfVxuICAgIGlmICgodCA9IHggPj4gOCkgIT0gMClcbiAgICB7XG4gICAgICB4ID0gdDtcbiAgICAgIHIgKz0gODtcbiAgICB9XG4gICAgaWYgKCh0ID0geCA+PiA0KSAhPSAwKVxuICAgIHtcbiAgICAgIHggPSB0O1xuICAgICAgciArPSA0O1xuICAgIH1cbiAgICBpZiAoKHQgPSB4ID4+IDIpICE9IDApXG4gICAge1xuICAgICAgeCA9IHQ7XG4gICAgICByICs9IDI7XG4gICAgfVxuICAgIGlmICgodCA9IHggPj4gMSkgIT0gMClcbiAgICB7XG4gICAgICB4ID0gdDtcbiAgICAgIHIgKz0gMTtcbiAgICB9XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgcmV0dXJuIHRoZSBudW1iZXIgb2YgYml0cyBpbiBcInRoaXNcIlxuICBmdW5jdGlvbiBibkJpdExlbmd0aCgpXG4gIHtcbiAgICBpZiAodGhpcy50IDw9IDApIHJldHVybiAwO1xuICAgIHJldHVybiB0aGlzLkRCICogKHRoaXMudCAtIDEpICsgbmJpdHModGhpc1t0aGlzLnQgLSAxXSBeICh0aGlzLnMgJiB0aGlzLkRNKSk7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgPDwgbipEQlxuICBmdW5jdGlvbiBibnBETFNoaWZ0VG8obiwgcilcbiAge1xuICAgIHZhciBpO1xuICAgIGZvciAoaSA9IHRoaXMudCAtIDE7IGkgPj0gMDsgLS1pKSByW2kgKyBuXSA9IHRoaXNbaV07XG4gICAgZm9yIChpID0gbiAtIDE7IGkgPj0gMDsgLS1pKSByW2ldID0gMDtcbiAgICByLnQgPSB0aGlzLnQgKyBuO1xuICAgIHIucyA9IHRoaXMucztcbiAgfVxuICAvLyAocHJvdGVjdGVkKSByID0gdGhpcyA+PiBuKkRCXG4gIGZ1bmN0aW9uIGJucERSU2hpZnRUbyhuLCByKVxuICB7XG4gICAgZm9yICh2YXIgaSA9IG47IGkgPCB0aGlzLnQ7ICsraSkgcltpIC0gbl0gPSB0aGlzW2ldO1xuICAgIHIudCA9IE1hdGgubWF4KHRoaXMudCAtIG4sIDApO1xuICAgIHIucyA9IHRoaXMucztcbiAgfVxuICAvLyAocHJvdGVjdGVkKSByID0gdGhpcyA8PCBuXG4gIGZ1bmN0aW9uIGJucExTaGlmdFRvKG4sIHIpXG4gIHtcbiAgICB2YXIgYnMgPSBuICUgdGhpcy5EQjtcbiAgICB2YXIgY2JzID0gdGhpcy5EQiAtIGJzO1xuICAgIHZhciBibSA9ICgxIDw8IGNicykgLSAxO1xuICAgIHZhciBkcyA9IE1hdGguZmxvb3IobiAvIHRoaXMuREIpLFxuICAgICAgYyA9ICh0aGlzLnMgPDwgYnMpICYgdGhpcy5ETSxcbiAgICAgIGk7XG4gICAgZm9yIChpID0gdGhpcy50IC0gMTsgaSA+PSAwOyAtLWkpXG4gICAge1xuICAgICAgcltpICsgZHMgKyAxXSA9ICh0aGlzW2ldID4+IGNicykgfCBjO1xuICAgICAgYyA9ICh0aGlzW2ldICYgYm0pIDw8IGJzO1xuICAgIH1cbiAgICBmb3IgKGkgPSBkcyAtIDE7IGkgPj0gMDsgLS1pKSByW2ldID0gMDtcbiAgICByW2RzXSA9IGM7XG4gICAgci50ID0gdGhpcy50ICsgZHMgKyAxO1xuICAgIHIucyA9IHRoaXMucztcbiAgICByLmNsYW1wKCk7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgPj4gblxuICBmdW5jdGlvbiBibnBSU2hpZnRUbyhuLCByKVxuICB7XG4gICAgci5zID0gdGhpcy5zO1xuICAgIHZhciBkcyA9IE1hdGguZmxvb3IobiAvIHRoaXMuREIpO1xuICAgIGlmIChkcyA+PSB0aGlzLnQpXG4gICAge1xuICAgICAgci50ID0gMDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGJzID0gbiAlIHRoaXMuREI7XG4gICAgdmFyIGNicyA9IHRoaXMuREIgLSBicztcbiAgICB2YXIgYm0gPSAoMSA8PCBicykgLSAxO1xuICAgIHJbMF0gPSB0aGlzW2RzXSA+PiBicztcbiAgICBmb3IgKHZhciBpID0gZHMgKyAxOyBpIDwgdGhpcy50OyArK2kpXG4gICAge1xuICAgICAgcltpIC0gZHMgLSAxXSB8PSAodGhpc1tpXSAmIGJtKSA8PCBjYnM7XG4gICAgICByW2kgLSBkc10gPSB0aGlzW2ldID4+IGJzO1xuICAgIH1cbiAgICBpZiAoYnMgPiAwKSByW3RoaXMudCAtIGRzIC0gMV0gfD0gKHRoaXMucyAmIGJtKSA8PCBjYnM7XG4gICAgci50ID0gdGhpcy50IC0gZHM7XG4gICAgci5jbGFtcCgpO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzIC0gYVxuICBmdW5jdGlvbiBibnBTdWJUbyhhLCByKVxuICB7XG4gICAgdmFyIGkgPSAwLFxuICAgICAgYyA9IDAsXG4gICAgICBtID0gTWF0aC5taW4oYS50LCB0aGlzLnQpO1xuICAgIHdoaWxlIChpIDwgbSlcbiAgICB7XG4gICAgICBjICs9IHRoaXNbaV0gLSBhW2ldO1xuICAgICAgcltpKytdID0gYyAmIHRoaXMuRE07XG4gICAgICBjID4+PSB0aGlzLkRCO1xuICAgIH1cbiAgICBpZiAoYS50IDwgdGhpcy50KVxuICAgIHtcbiAgICAgIGMgLT0gYS5zO1xuICAgICAgd2hpbGUgKGkgPCB0aGlzLnQpXG4gICAgICB7XG4gICAgICAgIGMgKz0gdGhpc1tpXTtcbiAgICAgICAgcltpKytdID0gYyAmIHRoaXMuRE07XG4gICAgICAgIGMgPj49IHRoaXMuREI7XG4gICAgICB9XG4gICAgICBjICs9IHRoaXMucztcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIGMgKz0gdGhpcy5zO1xuICAgICAgd2hpbGUgKGkgPCBhLnQpXG4gICAgICB7XG4gICAgICAgIGMgLT0gYVtpXTtcbiAgICAgICAgcltpKytdID0gYyAmIHRoaXMuRE07XG4gICAgICAgIGMgPj49IHRoaXMuREI7XG4gICAgICB9XG4gICAgICBjIC09IGEucztcbiAgICB9XG4gICAgci5zID0gKGMgPCAwKSA/IC0xIDogMDtcbiAgICBpZiAoYyA8IC0xKSByW2krK10gPSB0aGlzLkRWICsgYztcbiAgICBlbHNlIGlmIChjID4gMCkgcltpKytdID0gYztcbiAgICByLnQgPSBpO1xuICAgIHIuY2xhbXAoKTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSByID0gdGhpcyAqIGEsIHIgIT0gdGhpcyxhIChIQUMgMTQuMTIpXG4gIC8vIFwidGhpc1wiIHNob3VsZCBiZSB0aGUgbGFyZ2VyIG9uZSBpZiBhcHByb3ByaWF0ZS5cbiAgZnVuY3Rpb24gYm5wTXVsdGlwbHlUbyhhLCByKVxuICB7XG4gICAgdmFyIHggPSB0aGlzLmFicygpLFxuICAgICAgeSA9IGEuYWJzKCk7XG4gICAgdmFyIGkgPSB4LnQ7XG4gICAgci50ID0gaSArIHkudDtcbiAgICB3aGlsZSAoLS1pID49IDApIHJbaV0gPSAwO1xuICAgIGZvciAoaSA9IDA7IGkgPCB5LnQ7ICsraSkgcltpICsgeC50XSA9IHguYW0oMCwgeVtpXSwgciwgaSwgMCwgeC50KTtcbiAgICByLnMgPSAwO1xuICAgIHIuY2xhbXAoKTtcbiAgICBpZiAodGhpcy5zICE9IGEucykgQmlnSW50ZWdlci5aRVJPLnN1YlRvKHIsIHIpO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzXjIsIHIgIT0gdGhpcyAoSEFDIDE0LjE2KVxuICBmdW5jdGlvbiBibnBTcXVhcmVUbyhyKVxuICB7XG4gICAgdmFyIHggPSB0aGlzLmFicygpO1xuICAgIHZhciBpID0gci50ID0gMiAqIHgudDtcbiAgICB3aGlsZSAoLS1pID49IDApIHJbaV0gPSAwO1xuICAgIGZvciAoaSA9IDA7IGkgPCB4LnQgLSAxOyArK2kpXG4gICAge1xuICAgICAgdmFyIGMgPSB4LmFtKGksIHhbaV0sIHIsIDIgKiBpLCAwLCAxKTtcbiAgICAgIGlmICgocltpICsgeC50XSArPSB4LmFtKGkgKyAxLCAyICogeFtpXSwgciwgMiAqIGkgKyAxLCBjLCB4LnQgLSBpIC0gMSkpID49IHguRFYpXG4gICAgICB7XG4gICAgICAgIHJbaSArIHgudF0gLT0geC5EVjtcbiAgICAgICAgcltpICsgeC50ICsgMV0gPSAxO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoci50ID4gMCkgcltyLnQgLSAxXSArPSB4LmFtKGksIHhbaV0sIHIsIDIgKiBpLCAwLCAxKTtcbiAgICByLnMgPSAwO1xuICAgIHIuY2xhbXAoKTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSBkaXZpZGUgdGhpcyBieSBtLCBxdW90aWVudCBhbmQgcmVtYWluZGVyIHRvIHEsIHIgKEhBQyAxNC4yMClcbiAgLy8gciAhPSBxLCB0aGlzICE9IG0uICBxIG9yIHIgbWF5IGJlIG51bGwuXG4gIGZ1bmN0aW9uIGJucERpdlJlbVRvKG0sIHEsIHIpXG4gIHtcbiAgICB2YXIgcG0gPSBtLmFicygpO1xuICAgIGlmIChwbS50IDw9IDApIHJldHVybjtcbiAgICB2YXIgcHQgPSB0aGlzLmFicygpO1xuICAgIGlmIChwdC50IDwgcG0udClcbiAgICB7XG4gICAgICBpZiAocSAhPSBudWxsKSBxLmZyb21JbnQoMCk7XG4gICAgICBpZiAociAhPSBudWxsKSB0aGlzLmNvcHlUbyhyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHIgPT0gbnVsbCkgciA9IG5iaSgpO1xuICAgIHZhciB5ID0gbmJpKCksXG4gICAgICB0cyA9IHRoaXMucyxcbiAgICAgIG1zID0gbS5zO1xuICAgIHZhciBuc2ggPSB0aGlzLkRCIC0gbmJpdHMocG1bcG0udCAtIDFdKTsgLy8gbm9ybWFsaXplIG1vZHVsdXNcbiAgICBpZiAobnNoID4gMClcbiAgICB7XG4gICAgICBwbS5sU2hpZnRUbyhuc2gsIHkpO1xuICAgICAgcHQubFNoaWZ0VG8obnNoLCByKTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIHBtLmNvcHlUbyh5KTtcbiAgICAgIHB0LmNvcHlUbyhyKTtcbiAgICB9XG4gICAgdmFyIHlzID0geS50O1xuICAgIHZhciB5MCA9IHlbeXMgLSAxXTtcbiAgICBpZiAoeTAgPT0gMCkgcmV0dXJuO1xuICAgIHZhciB5dCA9IHkwICogKDEgPDwgdGhpcy5GMSkgKyAoKHlzID4gMSkgPyB5W3lzIC0gMl0gPj4gdGhpcy5GMiA6IDApO1xuICAgIHZhciBkMSA9IHRoaXMuRlYgLyB5dCxcbiAgICAgIGQyID0gKDEgPDwgdGhpcy5GMSkgLyB5dCxcbiAgICAgIGUgPSAxIDw8IHRoaXMuRjI7XG4gICAgdmFyIGkgPSByLnQsXG4gICAgICBqID0gaSAtIHlzLFxuICAgICAgdCA9IChxID09IG51bGwpID8gbmJpKCkgOiBxO1xuICAgIHkuZGxTaGlmdFRvKGosIHQpO1xuICAgIGlmIChyLmNvbXBhcmVUbyh0KSA+PSAwKVxuICAgIHtcbiAgICAgIHJbci50KytdID0gMTtcbiAgICAgIHIuc3ViVG8odCwgcik7XG4gICAgfVxuICAgIEJpZ0ludGVnZXIuT05FLmRsU2hpZnRUbyh5cywgdCk7XG4gICAgdC5zdWJUbyh5LCB5KTsgLy8gXCJuZWdhdGl2ZVwiIHkgc28gd2UgY2FuIHJlcGxhY2Ugc3ViIHdpdGggYW0gbGF0ZXJcbiAgICB3aGlsZSAoeS50IDwgeXMpIHlbeS50KytdID0gMDtcbiAgICB3aGlsZSAoLS1qID49IDApXG4gICAge1xuICAgICAgLy8gRXN0aW1hdGUgcXVvdGllbnQgZGlnaXRcbiAgICAgIHZhciBxZCA9IChyWy0taV0gPT0geTApID8gdGhpcy5ETSA6IE1hdGguZmxvb3IocltpXSAqIGQxICsgKHJbaSAtIDFdICsgZSkgKiBkMik7XG4gICAgICBpZiAoKHJbaV0gKz0geS5hbSgwLCBxZCwgciwgaiwgMCwgeXMpKSA8IHFkKVxuICAgICAgeyAvLyBUcnkgaXQgb3V0XG4gICAgICAgIHkuZGxTaGlmdFRvKGosIHQpO1xuICAgICAgICByLnN1YlRvKHQsIHIpO1xuICAgICAgICB3aGlsZSAocltpXSA8IC0tcWQpIHIuc3ViVG8odCwgcik7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChxICE9IG51bGwpXG4gICAge1xuICAgICAgci5kclNoaWZ0VG8oeXMsIHEpO1xuICAgICAgaWYgKHRzICE9IG1zKSBCaWdJbnRlZ2VyLlpFUk8uc3ViVG8ocSwgcSk7XG4gICAgfVxuICAgIHIudCA9IHlzO1xuICAgIHIuY2xhbXAoKTtcbiAgICBpZiAobnNoID4gMCkgci5yU2hpZnRUbyhuc2gsIHIpOyAvLyBEZW5vcm1hbGl6ZSByZW1haW5kZXJcbiAgICBpZiAodHMgPCAwKSBCaWdJbnRlZ2VyLlpFUk8uc3ViVG8ociwgcik7XG4gIH1cbiAgLy8gKHB1YmxpYykgdGhpcyBtb2QgYVxuICBmdW5jdGlvbiBibk1vZChhKVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB0aGlzLmFicygpLmRpdlJlbVRvKGEsIG51bGwsIHIpO1xuICAgIGlmICh0aGlzLnMgPCAwICYmIHIuY29tcGFyZVRvKEJpZ0ludGVnZXIuWkVSTykgPiAwKSBhLnN1YlRvKHIsIHIpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIE1vZHVsYXIgcmVkdWN0aW9uIHVzaW5nIFwiY2xhc3NpY1wiIGFsZ29yaXRobVxuICBmdW5jdGlvbiBDbGFzc2ljKG0pXG4gIHtcbiAgICB0aGlzLm0gPSBtO1xuICB9XG5cbiAgZnVuY3Rpb24gY0NvbnZlcnQoeClcbiAge1xuICAgIGlmICh4LnMgPCAwIHx8IHguY29tcGFyZVRvKHRoaXMubSkgPj0gMCkgcmV0dXJuIHgubW9kKHRoaXMubSk7XG4gICAgZWxzZSByZXR1cm4geDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNSZXZlcnQoeClcbiAge1xuICAgIHJldHVybiB4O1xuICB9XG5cbiAgZnVuY3Rpb24gY1JlZHVjZSh4KVxuICB7XG4gICAgeC5kaXZSZW1Ubyh0aGlzLm0sIG51bGwsIHgpO1xuICB9XG5cbiAgZnVuY3Rpb24gY011bFRvKHgsIHksIHIpXG4gIHtcbiAgICB4Lm11bHRpcGx5VG8oeSwgcik7XG4gICAgdGhpcy5yZWR1Y2Uocik7XG4gIH1cblxuICBmdW5jdGlvbiBjU3FyVG8oeCwgcilcbiAge1xuICAgIHguc3F1YXJlVG8ocik7XG4gICAgdGhpcy5yZWR1Y2Uocik7XG4gIH1cbiAgQ2xhc3NpYy5wcm90b3R5cGUuY29udmVydCA9IGNDb252ZXJ0O1xuICBDbGFzc2ljLnByb3RvdHlwZS5yZXZlcnQgPSBjUmV2ZXJ0O1xuICBDbGFzc2ljLnByb3RvdHlwZS5yZWR1Y2UgPSBjUmVkdWNlO1xuICBDbGFzc2ljLnByb3RvdHlwZS5tdWxUbyA9IGNNdWxUbztcbiAgQ2xhc3NpYy5wcm90b3R5cGUuc3FyVG8gPSBjU3FyVG87XG4gIC8vIChwcm90ZWN0ZWQpIHJldHVybiBcIi0xL3RoaXMgJSAyXkRCXCI7IHVzZWZ1bCBmb3IgTW9udC4gcmVkdWN0aW9uXG4gIC8vIGp1c3RpZmljYXRpb246XG4gIC8vICAgICAgICAgeHkgPT0gMSAobW9kIG0pXG4gIC8vICAgICAgICAgeHkgPSAgMStrbVxuICAvLyAgIHh5KDIteHkpID0gKDEra20pKDEta20pXG4gIC8vIHhbeSgyLXh5KV0gPSAxLWteMm1eMlxuICAvLyB4W3koMi14eSldID09IDEgKG1vZCBtXjIpXG4gIC8vIGlmIHkgaXMgMS94IG1vZCBtLCB0aGVuIHkoMi14eSkgaXMgMS94IG1vZCBtXjJcbiAgLy8gc2hvdWxkIHJlZHVjZSB4IGFuZCB5KDIteHkpIGJ5IG1eMiBhdCBlYWNoIHN0ZXAgdG8ga2VlcCBzaXplIGJvdW5kZWQuXG4gIC8vIEpTIG11bHRpcGx5IFwib3ZlcmZsb3dzXCIgZGlmZmVyZW50bHkgZnJvbSBDL0MrKywgc28gY2FyZSBpcyBuZWVkZWQgaGVyZS5cbiAgZnVuY3Rpb24gYm5wSW52RGlnaXQoKVxuICB7XG4gICAgaWYgKHRoaXMudCA8IDEpIHJldHVybiAwO1xuICAgIHZhciB4ID0gdGhpc1swXTtcbiAgICBpZiAoKHggJiAxKSA9PSAwKSByZXR1cm4gMDtcbiAgICB2YXIgeSA9IHggJiAzOyAvLyB5ID09IDEveCBtb2QgMl4yXG4gICAgeSA9ICh5ICogKDIgLSAoeCAmIDB4ZikgKiB5KSkgJiAweGY7IC8vIHkgPT0gMS94IG1vZCAyXjRcbiAgICB5ID0gKHkgKiAoMiAtICh4ICYgMHhmZikgKiB5KSkgJiAweGZmOyAvLyB5ID09IDEveCBtb2QgMl44XG4gICAgeSA9ICh5ICogKDIgLSAoKCh4ICYgMHhmZmZmKSAqIHkpICYgMHhmZmZmKSkpICYgMHhmZmZmOyAvLyB5ID09IDEveCBtb2QgMl4xNlxuICAgIC8vIGxhc3Qgc3RlcCAtIGNhbGN1bGF0ZSBpbnZlcnNlIG1vZCBEViBkaXJlY3RseTtcbiAgICAvLyBhc3N1bWVzIDE2IDwgREIgPD0gMzIgYW5kIGFzc3VtZXMgYWJpbGl0eSB0byBoYW5kbGUgNDgtYml0IGludHNcbiAgICB5ID0gKHkgKiAoMiAtIHggKiB5ICUgdGhpcy5EVikpICUgdGhpcy5EVjsgLy8geSA9PSAxL3ggbW9kIDJeZGJpdHNcbiAgICAvLyB3ZSByZWFsbHkgd2FudCB0aGUgbmVnYXRpdmUgaW52ZXJzZSwgYW5kIC1EViA8IHkgPCBEVlxuICAgIHJldHVybiAoeSA+IDApID8gdGhpcy5EViAtIHkgOiAteTtcbiAgfVxuICAvLyBNb250Z29tZXJ5IHJlZHVjdGlvblxuICBmdW5jdGlvbiBNb250Z29tZXJ5KG0pXG4gIHtcbiAgICB0aGlzLm0gPSBtO1xuICAgIHRoaXMubXAgPSBtLmludkRpZ2l0KCk7XG4gICAgdGhpcy5tcGwgPSB0aGlzLm1wICYgMHg3ZmZmO1xuICAgIHRoaXMubXBoID0gdGhpcy5tcCA+PiAxNTtcbiAgICB0aGlzLnVtID0gKDEgPDwgKG0uREIgLSAxNSkpIC0gMTtcbiAgICB0aGlzLm10MiA9IDIgKiBtLnQ7XG4gIH1cbiAgLy8geFIgbW9kIG1cbiAgZnVuY3Rpb24gbW9udENvbnZlcnQoeClcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgeC5hYnMoKS5kbFNoaWZ0VG8odGhpcy5tLnQsIHIpO1xuICAgIHIuZGl2UmVtVG8odGhpcy5tLCBudWxsLCByKTtcbiAgICBpZiAoeC5zIDwgMCAmJiByLmNvbXBhcmVUbyhCaWdJbnRlZ2VyLlpFUk8pID4gMCkgdGhpcy5tLnN1YlRvKHIsIHIpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIHgvUiBtb2QgbVxuICBmdW5jdGlvbiBtb250UmV2ZXJ0KHgpXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHguY29weVRvKHIpO1xuICAgIHRoaXMucmVkdWNlKHIpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIHggPSB4L1IgbW9kIG0gKEhBQyAxNC4zMilcbiAgZnVuY3Rpb24gbW9udFJlZHVjZSh4KVxuICB7XG4gICAgd2hpbGUgKHgudCA8PSB0aGlzLm10MikgLy8gcGFkIHggc28gYW0gaGFzIGVub3VnaCByb29tIGxhdGVyXG4gICAgICB4W3gudCsrXSA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm0udDsgKytpKVxuICAgIHtcbiAgICAgIC8vIGZhc3RlciB3YXkgb2YgY2FsY3VsYXRpbmcgdTAgPSB4W2ldKm1wIG1vZCBEVlxuICAgICAgdmFyIGogPSB4W2ldICYgMHg3ZmZmO1xuICAgICAgdmFyIHUwID0gKGogKiB0aGlzLm1wbCArICgoKGogKiB0aGlzLm1waCArICh4W2ldID4+IDE1KSAqIHRoaXMubXBsKSAmIHRoaXMudW0pIDw8IDE1KSkgJiB4LkRNO1xuICAgICAgLy8gdXNlIGFtIHRvIGNvbWJpbmUgdGhlIG11bHRpcGx5LXNoaWZ0LWFkZCBpbnRvIG9uZSBjYWxsXG4gICAgICBqID0gaSArIHRoaXMubS50O1xuICAgICAgeFtqXSArPSB0aGlzLm0uYW0oMCwgdTAsIHgsIGksIDAsIHRoaXMubS50KTtcbiAgICAgIC8vIHByb3BhZ2F0ZSBjYXJyeVxuICAgICAgd2hpbGUgKHhbal0gPj0geC5EVilcbiAgICAgIHtcbiAgICAgICAgeFtqXSAtPSB4LkRWO1xuICAgICAgICB4Wysral0rKztcbiAgICAgIH1cbiAgICB9XG4gICAgeC5jbGFtcCgpO1xuICAgIHguZHJTaGlmdFRvKHRoaXMubS50LCB4KTtcbiAgICBpZiAoeC5jb21wYXJlVG8odGhpcy5tKSA+PSAwKSB4LnN1YlRvKHRoaXMubSwgeCk7XG4gIH1cbiAgLy8gciA9IFwieF4yL1IgbW9kIG1cIjsgeCAhPSByXG4gIGZ1bmN0aW9uIG1vbnRTcXJUbyh4LCByKVxuICB7XG4gICAgeC5zcXVhcmVUbyhyKTtcbiAgICB0aGlzLnJlZHVjZShyKTtcbiAgfVxuICAvLyByID0gXCJ4eS9SIG1vZCBtXCI7IHgseSAhPSByXG4gIGZ1bmN0aW9uIG1vbnRNdWxUbyh4LCB5LCByKVxuICB7XG4gICAgeC5tdWx0aXBseVRvKHksIHIpO1xuICAgIHRoaXMucmVkdWNlKHIpO1xuICB9XG4gIE1vbnRnb21lcnkucHJvdG90eXBlLmNvbnZlcnQgPSBtb250Q29udmVydDtcbiAgTW9udGdvbWVyeS5wcm90b3R5cGUucmV2ZXJ0ID0gbW9udFJldmVydDtcbiAgTW9udGdvbWVyeS5wcm90b3R5cGUucmVkdWNlID0gbW9udFJlZHVjZTtcbiAgTW9udGdvbWVyeS5wcm90b3R5cGUubXVsVG8gPSBtb250TXVsVG87XG4gIE1vbnRnb21lcnkucHJvdG90eXBlLnNxclRvID0gbW9udFNxclRvO1xuICAvLyAocHJvdGVjdGVkKSB0cnVlIGlmZiB0aGlzIGlzIGV2ZW5cbiAgZnVuY3Rpb24gYm5wSXNFdmVuKClcbiAge1xuICAgIHJldHVybiAoKHRoaXMudCA+IDApID8gKHRoaXNbMF0gJiAxKSA6IHRoaXMucykgPT0gMDtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSB0aGlzXmUsIGUgPCAyXjMyLCBkb2luZyBzcXIgYW5kIG11bCB3aXRoIFwiclwiIChIQUMgMTQuNzkpXG4gIGZ1bmN0aW9uIGJucEV4cChlLCB6KVxuICB7XG4gICAgaWYgKGUgPiAweGZmZmZmZmZmIHx8IGUgPCAxKSByZXR1cm4gQmlnSW50ZWdlci5PTkU7XG4gICAgdmFyIHIgPSBuYmkoKSxcbiAgICAgIHIyID0gbmJpKCksXG4gICAgICBnID0gei5jb252ZXJ0KHRoaXMpLFxuICAgICAgaSA9IG5iaXRzKGUpIC0gMTtcbiAgICBnLmNvcHlUbyhyKTtcbiAgICB3aGlsZSAoLS1pID49IDApXG4gICAge1xuICAgICAgei5zcXJUbyhyLCByMik7XG4gICAgICBpZiAoKGUgJiAoMSA8PCBpKSkgPiAwKSB6Lm11bFRvKHIyLCBnLCByKTtcbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgdmFyIHQgPSByO1xuICAgICAgICByID0gcjI7XG4gICAgICAgIHIyID0gdDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHoucmV2ZXJ0KHIpO1xuICB9XG4gIC8vIChwdWJsaWMpIHRoaXNeZSAlIG0sIDAgPD0gZSA8IDJeMzJcbiAgZnVuY3Rpb24gYm5Nb2RQb3dJbnQoZSwgbSlcbiAge1xuICAgIHZhciB6O1xuICAgIGlmIChlIDwgMjU2IHx8IG0uaXNFdmVuKCkpIHogPSBuZXcgQ2xhc3NpYyhtKTtcbiAgICBlbHNlIHogPSBuZXcgTW9udGdvbWVyeShtKTtcbiAgICByZXR1cm4gdGhpcy5leHAoZSwgeik7XG4gIH1cbiAgLy8gcHJvdGVjdGVkXG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmNvcHlUbyA9IGJucENvcHlUbztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuZnJvbUludCA9IGJucEZyb21JbnQ7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmZyb21TdHJpbmcgPSBibnBGcm9tU3RyaW5nO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5jbGFtcCA9IGJucENsYW1wO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5kbFNoaWZ0VG8gPSBibnBETFNoaWZ0VG87XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmRyU2hpZnRUbyA9IGJucERSU2hpZnRUbztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUubFNoaWZ0VG8gPSBibnBMU2hpZnRUbztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuclNoaWZ0VG8gPSBibnBSU2hpZnRUbztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuc3ViVG8gPSBibnBTdWJUbztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUubXVsdGlwbHlUbyA9IGJucE11bHRpcGx5VG87XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLnNxdWFyZVRvID0gYm5wU3F1YXJlVG87XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmRpdlJlbVRvID0gYm5wRGl2UmVtVG87XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmludkRpZ2l0ID0gYm5wSW52RGlnaXQ7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmlzRXZlbiA9IGJucElzRXZlbjtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuZXhwID0gYm5wRXhwO1xuICAvLyBwdWJsaWNcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUudG9TdHJpbmcgPSBiblRvU3RyaW5nO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5uZWdhdGUgPSBibk5lZ2F0ZTtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuYWJzID0gYm5BYnM7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmNvbXBhcmVUbyA9IGJuQ29tcGFyZVRvO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5iaXRMZW5ndGggPSBibkJpdExlbmd0aDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUubW9kID0gYm5Nb2Q7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLm1vZFBvd0ludCA9IGJuTW9kUG93SW50O1xuICAvLyBcImNvbnN0YW50c1wiXG4gIEJpZ0ludGVnZXIuWkVSTyA9IG5idigwKTtcbiAgQmlnSW50ZWdlci5PTkUgPSBuYnYoMSk7XG4gIC8vIENvcHlyaWdodCAoYykgMjAwNS0yMDA5ICBUb20gV3VcbiAgLy8gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAgLy8gU2VlIFwiTElDRU5TRVwiIGZvciBkZXRhaWxzLlxuICAvLyBFeHRlbmRlZCBKYXZhU2NyaXB0IEJOIGZ1bmN0aW9ucywgcmVxdWlyZWQgZm9yIFJTQSBwcml2YXRlIG9wcy5cbiAgLy8gVmVyc2lvbiAxLjE6IG5ldyBCaWdJbnRlZ2VyKFwiMFwiLCAxMCkgcmV0dXJucyBcInByb3BlclwiIHplcm9cbiAgLy8gVmVyc2lvbiAxLjI6IHNxdWFyZSgpIEFQSSwgaXNQcm9iYWJsZVByaW1lIGZpeFxuICAvLyAocHVibGljKVxuICBmdW5jdGlvbiBibkNsb25lKClcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgdGhpcy5jb3B5VG8ocik7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgcmV0dXJuIHZhbHVlIGFzIGludGVnZXJcbiAgZnVuY3Rpb24gYm5JbnRWYWx1ZSgpXG4gIHtcbiAgICBpZiAodGhpcy5zIDwgMClcbiAgICB7XG4gICAgICBpZiAodGhpcy50ID09IDEpIHJldHVybiB0aGlzWzBdIC0gdGhpcy5EVjtcbiAgICAgIGVsc2UgaWYgKHRoaXMudCA9PSAwKSByZXR1cm4gLTE7XG4gICAgfVxuICAgIGVsc2UgaWYgKHRoaXMudCA9PSAxKSByZXR1cm4gdGhpc1swXTtcbiAgICBlbHNlIGlmICh0aGlzLnQgPT0gMCkgcmV0dXJuIDA7XG4gICAgLy8gYXNzdW1lcyAxNiA8IERCIDwgMzJcbiAgICByZXR1cm4gKCh0aGlzWzFdICYgKCgxIDw8ICgzMiAtIHRoaXMuREIpKSAtIDEpKSA8PCB0aGlzLkRCKSB8IHRoaXNbMF07XG4gIH1cbiAgLy8gKHB1YmxpYykgcmV0dXJuIHZhbHVlIGFzIGJ5dGVcbiAgZnVuY3Rpb24gYm5CeXRlVmFsdWUoKVxuICB7XG4gICAgcmV0dXJuICh0aGlzLnQgPT0gMCkgPyB0aGlzLnMgOiAodGhpc1swXSA8PCAyNCkgPj4gMjQ7XG4gIH1cbiAgLy8gKHB1YmxpYykgcmV0dXJuIHZhbHVlIGFzIHNob3J0IChhc3N1bWVzIERCPj0xNilcbiAgZnVuY3Rpb24gYm5TaG9ydFZhbHVlKClcbiAge1xuICAgIHJldHVybiAodGhpcy50ID09IDApID8gdGhpcy5zIDogKHRoaXNbMF0gPDwgMTYpID4+IDE2O1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHJldHVybiB4IHMudC4gcl54IDwgRFZcbiAgZnVuY3Rpb24gYm5wQ2h1bmtTaXplKHIpXG4gIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLkxOMiAqIHRoaXMuREIgLyBNYXRoLmxvZyhyKSk7XG4gIH1cbiAgLy8gKHB1YmxpYykgMCBpZiB0aGlzID09IDAsIDEgaWYgdGhpcyA+IDBcbiAgZnVuY3Rpb24gYm5TaWdOdW0oKVxuICB7XG4gICAgaWYgKHRoaXMucyA8IDApIHJldHVybiAtMTtcbiAgICBlbHNlIGlmICh0aGlzLnQgPD0gMCB8fCAodGhpcy50ID09IDEgJiYgdGhpc1swXSA8PSAwKSkgcmV0dXJuIDA7XG4gICAgZWxzZSByZXR1cm4gMTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSBjb252ZXJ0IHRvIHJhZGl4IHN0cmluZ1xuICBmdW5jdGlvbiBibnBUb1JhZGl4KGIpXG4gIHtcbiAgICBpZiAoYiA9PSBudWxsKSBiID0gMTA7XG4gICAgaWYgKHRoaXMuc2lnbnVtKCkgPT0gMCB8fCBiIDwgMiB8fCBiID4gMzYpIHJldHVybiBcIjBcIjtcbiAgICB2YXIgY3MgPSB0aGlzLmNodW5rU2l6ZShiKTtcbiAgICB2YXIgYSA9IE1hdGgucG93KGIsIGNzKTtcbiAgICB2YXIgZCA9IG5idihhKSxcbiAgICAgIHkgPSBuYmkoKSxcbiAgICAgIHogPSBuYmkoKSxcbiAgICAgIHIgPSBcIlwiO1xuICAgIHRoaXMuZGl2UmVtVG8oZCwgeSwgeik7XG4gICAgd2hpbGUgKHkuc2lnbnVtKCkgPiAwKVxuICAgIHtcbiAgICAgIHIgPSAoYSArIHouaW50VmFsdWUoKSkudG9TdHJpbmcoYikuc3Vic3RyKDEpICsgcjtcbiAgICAgIHkuZGl2UmVtVG8oZCwgeSwgeik7XG4gICAgfVxuICAgIHJldHVybiB6LmludFZhbHVlKCkudG9TdHJpbmcoYikgKyByO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIGNvbnZlcnQgZnJvbSByYWRpeCBzdHJpbmdcbiAgZnVuY3Rpb24gYm5wRnJvbVJhZGl4KHMsIGIpXG4gIHtcbiAgICB0aGlzLmZyb21JbnQoMCk7XG4gICAgaWYgKGIgPT0gbnVsbCkgYiA9IDEwO1xuICAgIHZhciBjcyA9IHRoaXMuY2h1bmtTaXplKGIpO1xuICAgIHZhciBkID0gTWF0aC5wb3coYiwgY3MpLFxuICAgICAgbWkgPSBmYWxzZSxcbiAgICAgIGogPSAwLFxuICAgICAgdyA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzLmxlbmd0aDsgKytpKVxuICAgIHtcbiAgICAgIHZhciB4ID0gaW50QXQocywgaSk7XG4gICAgICBpZiAoeCA8IDApXG4gICAgICB7XG4gICAgICAgIGlmIChzLmNoYXJBdChpKSA9PSBcIi1cIiAmJiB0aGlzLnNpZ251bSgpID09IDApIG1pID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB3ID0gYiAqIHcgKyB4O1xuICAgICAgaWYgKCsraiA+PSBjcylcbiAgICAgIHtcbiAgICAgICAgdGhpcy5kTXVsdGlwbHkoZCk7XG4gICAgICAgIHRoaXMuZEFkZE9mZnNldCh3LCAwKTtcbiAgICAgICAgaiA9IDA7XG4gICAgICAgIHcgPSAwO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaiA+IDApXG4gICAge1xuICAgICAgdGhpcy5kTXVsdGlwbHkoTWF0aC5wb3coYiwgaikpO1xuICAgICAgdGhpcy5kQWRkT2Zmc2V0KHcsIDApO1xuICAgIH1cbiAgICBpZiAobWkpIEJpZ0ludGVnZXIuWkVSTy5zdWJUbyh0aGlzLCB0aGlzKTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSBhbHRlcm5hdGUgY29uc3RydWN0b3JcbiAgZnVuY3Rpb24gYm5wRnJvbU51bWJlcihhLCBiLCBjKVxuICB7XG4gICAgaWYgKFwibnVtYmVyXCIgPT0gdHlwZW9mIGIpXG4gICAge1xuICAgICAgLy8gbmV3IEJpZ0ludGVnZXIoaW50LGludCxSTkcpXG4gICAgICBpZiAoYSA8IDIpIHRoaXMuZnJvbUludCgxKTtcbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgdGhpcy5mcm9tTnVtYmVyKGEsIGMpO1xuICAgICAgICBpZiAoIXRoaXMudGVzdEJpdChhIC0gMSkpIC8vIGZvcmNlIE1TQiBzZXRcbiAgICAgICAgICB0aGlzLmJpdHdpc2VUbyhCaWdJbnRlZ2VyLk9ORS5zaGlmdExlZnQoYSAtIDEpLCBvcF9vciwgdGhpcyk7XG4gICAgICAgIGlmICh0aGlzLmlzRXZlbigpKSB0aGlzLmRBZGRPZmZzZXQoMSwgMCk7IC8vIGZvcmNlIG9kZFxuICAgICAgICB3aGlsZSAoIXRoaXMuaXNQcm9iYWJsZVByaW1lKGIpKVxuICAgICAgICB7XG4gICAgICAgICAgdGhpcy5kQWRkT2Zmc2V0KDIsIDApO1xuICAgICAgICAgIGlmICh0aGlzLmJpdExlbmd0aCgpID4gYSkgdGhpcy5zdWJUbyhCaWdJbnRlZ2VyLk9ORS5zaGlmdExlZnQoYSAtIDEpLCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgLy8gbmV3IEJpZ0ludGVnZXIoaW50LFJORylcbiAgICAgIHZhciB4ID0gbmV3IEFycmF5KCksXG4gICAgICAgIHQgPSBhICYgNztcbiAgICAgIHgubGVuZ3RoID0gKGEgPj4gMykgKyAxO1xuICAgICAgYi5uZXh0Qnl0ZXMoeCk7XG4gICAgICBpZiAodCA+IDApIHhbMF0gJj0gKCgxIDw8IHQpIC0gMSk7XG4gICAgICBlbHNlIHhbMF0gPSAwO1xuICAgICAgdGhpcy5mcm9tU3RyaW5nKHgsIDI1Nik7XG4gICAgfVxuICB9XG4gIC8vIChwdWJsaWMpIGNvbnZlcnQgdG8gYmlnZW5kaWFuIGJ5dGUgYXJyYXlcbiAgZnVuY3Rpb24gYm5Ub0J5dGVBcnJheSgpXG4gIHtcbiAgICB2YXIgaSA9IHRoaXMudCxcbiAgICAgIHIgPSBuZXcgQXJyYXkoKTtcbiAgICByWzBdID0gdGhpcy5zO1xuICAgIHZhciBwID0gdGhpcy5EQiAtIChpICogdGhpcy5EQikgJSA4LFxuICAgICAgZCwgayA9IDA7XG4gICAgaWYgKGktLSA+IDApXG4gICAge1xuICAgICAgaWYgKHAgPCB0aGlzLkRCICYmIChkID0gdGhpc1tpXSA+PiBwKSAhPSAodGhpcy5zICYgdGhpcy5ETSkgPj4gcClcbiAgICAgICAgcltrKytdID0gZCB8ICh0aGlzLnMgPDwgKHRoaXMuREIgLSBwKSk7XG4gICAgICB3aGlsZSAoaSA+PSAwKVxuICAgICAge1xuICAgICAgICBpZiAocCA8IDgpXG4gICAgICAgIHtcbiAgICAgICAgICBkID0gKHRoaXNbaV0gJiAoKDEgPDwgcCkgLSAxKSkgPDwgKDggLSBwKTtcbiAgICAgICAgICBkIHw9IHRoaXNbLS1pXSA+PiAocCArPSB0aGlzLkRCIC0gOCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgZCA9ICh0aGlzW2ldID4+IChwIC09IDgpKSAmIDB4ZmY7XG4gICAgICAgICAgaWYgKHAgPD0gMClcbiAgICAgICAgICB7XG4gICAgICAgICAgICBwICs9IHRoaXMuREI7XG4gICAgICAgICAgICAtLWk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICgoZCAmIDB4ODApICE9IDApIGQgfD0gLTI1NjtcbiAgICAgICAgaWYgKGsgPT0gMCAmJiAodGhpcy5zICYgMHg4MCkgIT0gKGQgJiAweDgwKSkrK2s7XG4gICAgICAgIGlmIChrID4gMCB8fCBkICE9IHRoaXMucykgcltrKytdID0gZDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHI7XG4gIH1cblxuICBmdW5jdGlvbiBibkVxdWFscyhhKVxuICB7XG4gICAgcmV0dXJuICh0aGlzLmNvbXBhcmVUbyhhKSA9PSAwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJuTWluKGEpXG4gIHtcbiAgICByZXR1cm4gKHRoaXMuY29tcGFyZVRvKGEpIDwgMCkgPyB0aGlzIDogYTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJuTWF4KGEpXG4gIHtcbiAgICByZXR1cm4gKHRoaXMuY29tcGFyZVRvKGEpID4gMCkgPyB0aGlzIDogYTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSByID0gdGhpcyBvcCBhIChiaXR3aXNlKVxuICBmdW5jdGlvbiBibnBCaXR3aXNlVG8oYSwgb3AsIHIpXG4gIHtcbiAgICB2YXIgaSwgZiwgbSA9IE1hdGgubWluKGEudCwgdGhpcy50KTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbTsgKytpKSByW2ldID0gb3AodGhpc1tpXSwgYVtpXSk7XG4gICAgaWYgKGEudCA8IHRoaXMudClcbiAgICB7XG4gICAgICBmID0gYS5zICYgdGhpcy5ETTtcbiAgICAgIGZvciAoaSA9IG07IGkgPCB0aGlzLnQ7ICsraSkgcltpXSA9IG9wKHRoaXNbaV0sIGYpO1xuICAgICAgci50ID0gdGhpcy50O1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgZiA9IHRoaXMucyAmIHRoaXMuRE07XG4gICAgICBmb3IgKGkgPSBtOyBpIDwgYS50OyArK2kpIHJbaV0gPSBvcChmLCBhW2ldKTtcbiAgICAgIHIudCA9IGEudDtcbiAgICB9XG4gICAgci5zID0gb3AodGhpcy5zLCBhLnMpO1xuICAgIHIuY2xhbXAoKTtcbiAgfVxuICAvLyAocHVibGljKSB0aGlzICYgYVxuICBmdW5jdGlvbiBvcF9hbmQoeCwgeSlcbiAge1xuICAgIHJldHVybiB4ICYgeTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJuQW5kKGEpXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHRoaXMuYml0d2lzZVRvKGEsIG9wX2FuZCwgcik7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgdGhpcyB8IGFcbiAgZnVuY3Rpb24gb3Bfb3IoeCwgeSlcbiAge1xuICAgIHJldHVybiB4IHwgeTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJuT3IoYSlcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgdGhpcy5iaXR3aXNlVG8oYSwgb3Bfb3IsIHIpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIHRoaXMgXiBhXG4gIGZ1bmN0aW9uIG9wX3hvcih4LCB5KVxuICB7XG4gICAgcmV0dXJuIHggXiB5O1xuICB9XG5cbiAgZnVuY3Rpb24gYm5Yb3IoYSlcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgdGhpcy5iaXR3aXNlVG8oYSwgb3BfeG9yLCByKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSB0aGlzICYgfmFcbiAgZnVuY3Rpb24gb3BfYW5kbm90KHgsIHkpXG4gIHtcbiAgICByZXR1cm4geCAmIH55O1xuICB9XG5cbiAgZnVuY3Rpb24gYm5BbmROb3QoYSlcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgdGhpcy5iaXR3aXNlVG8oYSwgb3BfYW5kbm90LCByKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSB+dGhpc1xuICBmdW5jdGlvbiBibk5vdCgpXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy50OyArK2kpIHJbaV0gPSB0aGlzLkRNICYgfnRoaXNbaV07XG4gICAgci50ID0gdGhpcy50O1xuICAgIHIucyA9IH50aGlzLnM7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgdGhpcyA8PCBuXG4gIGZ1bmN0aW9uIGJuU2hpZnRMZWZ0KG4pXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIGlmIChuIDwgMCkgdGhpcy5yU2hpZnRUbygtbiwgcik7XG4gICAgZWxzZSB0aGlzLmxTaGlmdFRvKG4sIHIpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIHRoaXMgPj4gblxuICBmdW5jdGlvbiBiblNoaWZ0UmlnaHQobilcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgaWYgKG4gPCAwKSB0aGlzLmxTaGlmdFRvKC1uLCByKTtcbiAgICBlbHNlIHRoaXMuclNoaWZ0VG8obiwgcik7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gcmV0dXJuIGluZGV4IG9mIGxvd2VzdCAxLWJpdCBpbiB4LCB4IDwgMl4zMVxuICBmdW5jdGlvbiBsYml0KHgpXG4gIHtcbiAgICBpZiAoeCA9PSAwKSByZXR1cm4gLTE7XG4gICAgdmFyIHIgPSAwO1xuICAgIGlmICgoeCAmIDB4ZmZmZikgPT0gMClcbiAgICB7XG4gICAgICB4ID4+PSAxNjtcbiAgICAgIHIgKz0gMTY7XG4gICAgfVxuICAgIGlmICgoeCAmIDB4ZmYpID09IDApXG4gICAge1xuICAgICAgeCA+Pj0gODtcbiAgICAgIHIgKz0gODtcbiAgICB9XG4gICAgaWYgKCh4ICYgMHhmKSA9PSAwKVxuICAgIHtcbiAgICAgIHggPj49IDQ7XG4gICAgICByICs9IDQ7XG4gICAgfVxuICAgIGlmICgoeCAmIDMpID09IDApXG4gICAge1xuICAgICAgeCA+Pj0gMjtcbiAgICAgIHIgKz0gMjtcbiAgICB9XG4gICAgaWYgKCh4ICYgMSkgPT0gMCkrK3I7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgcmV0dXJucyBpbmRleCBvZiBsb3dlc3QgMS1iaXQgKG9yIC0xIGlmIG5vbmUpXG4gIGZ1bmN0aW9uIGJuR2V0TG93ZXN0U2V0Qml0KClcbiAge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy50OyArK2kpXG4gICAgICBpZiAodGhpc1tpXSAhPSAwKSByZXR1cm4gaSAqIHRoaXMuREIgKyBsYml0KHRoaXNbaV0pO1xuICAgIGlmICh0aGlzLnMgPCAwKSByZXR1cm4gdGhpcy50ICogdGhpcy5EQjtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgLy8gcmV0dXJuIG51bWJlciBvZiAxIGJpdHMgaW4geFxuICBmdW5jdGlvbiBjYml0KHgpXG4gIHtcbiAgICB2YXIgciA9IDA7XG4gICAgd2hpbGUgKHggIT0gMClcbiAgICB7XG4gICAgICB4ICY9IHggLSAxO1xuICAgICAgKytyO1xuICAgIH1cbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSByZXR1cm4gbnVtYmVyIG9mIHNldCBiaXRzXG4gIGZ1bmN0aW9uIGJuQml0Q291bnQoKVxuICB7XG4gICAgdmFyIHIgPSAwLFxuICAgICAgeCA9IHRoaXMucyAmIHRoaXMuRE07XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnQ7ICsraSkgciArPSBjYml0KHRoaXNbaV0gXiB4KTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSB0cnVlIGlmZiBudGggYml0IGlzIHNldFxuICBmdW5jdGlvbiBiblRlc3RCaXQobilcbiAge1xuICAgIHZhciBqID0gTWF0aC5mbG9vcihuIC8gdGhpcy5EQik7XG4gICAgaWYgKGogPj0gdGhpcy50KSByZXR1cm4gKHRoaXMucyAhPSAwKTtcbiAgICByZXR1cm4gKCh0aGlzW2pdICYgKDEgPDwgKG4gJSB0aGlzLkRCKSkpICE9IDApO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHRoaXMgb3AgKDE8PG4pXG4gIGZ1bmN0aW9uIGJucENoYW5nZUJpdChuLCBvcClcbiAge1xuICAgIHZhciByID0gQmlnSW50ZWdlci5PTkUuc2hpZnRMZWZ0KG4pO1xuICAgIHRoaXMuYml0d2lzZVRvKHIsIG9wLCByKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSB0aGlzIHwgKDE8PG4pXG4gIGZ1bmN0aW9uIGJuU2V0Qml0KG4pXG4gIHtcbiAgICByZXR1cm4gdGhpcy5jaGFuZ2VCaXQobiwgb3Bfb3IpO1xuICB9XG4gIC8vIChwdWJsaWMpIHRoaXMgJiB+KDE8PG4pXG4gIGZ1bmN0aW9uIGJuQ2xlYXJCaXQobilcbiAge1xuICAgIHJldHVybiB0aGlzLmNoYW5nZUJpdChuLCBvcF9hbmRub3QpO1xuICB9XG4gIC8vIChwdWJsaWMpIHRoaXMgXiAoMTw8bilcbiAgZnVuY3Rpb24gYm5GbGlwQml0KG4pXG4gIHtcbiAgICByZXR1cm4gdGhpcy5jaGFuZ2VCaXQobiwgb3BfeG9yKTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSByID0gdGhpcyArIGFcbiAgZnVuY3Rpb24gYm5wQWRkVG8oYSwgcilcbiAge1xuICAgIHZhciBpID0gMCxcbiAgICAgIGMgPSAwLFxuICAgICAgbSA9IE1hdGgubWluKGEudCwgdGhpcy50KTtcbiAgICB3aGlsZSAoaSA8IG0pXG4gICAge1xuICAgICAgYyArPSB0aGlzW2ldICsgYVtpXTtcbiAgICAgIHJbaSsrXSA9IGMgJiB0aGlzLkRNO1xuICAgICAgYyA+Pj0gdGhpcy5EQjtcbiAgICB9XG4gICAgaWYgKGEudCA8IHRoaXMudClcbiAgICB7XG4gICAgICBjICs9IGEucztcbiAgICAgIHdoaWxlIChpIDwgdGhpcy50KVxuICAgICAge1xuICAgICAgICBjICs9IHRoaXNbaV07XG4gICAgICAgIHJbaSsrXSA9IGMgJiB0aGlzLkRNO1xuICAgICAgICBjID4+PSB0aGlzLkRCO1xuICAgICAgfVxuICAgICAgYyArPSB0aGlzLnM7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBjICs9IHRoaXMucztcbiAgICAgIHdoaWxlIChpIDwgYS50KVxuICAgICAge1xuICAgICAgICBjICs9IGFbaV07XG4gICAgICAgIHJbaSsrXSA9IGMgJiB0aGlzLkRNO1xuICAgICAgICBjID4+PSB0aGlzLkRCO1xuICAgICAgfVxuICAgICAgYyArPSBhLnM7XG4gICAgfVxuICAgIHIucyA9IChjIDwgMCkgPyAtMSA6IDA7XG4gICAgaWYgKGMgPiAwKSByW2krK10gPSBjO1xuICAgIGVsc2UgaWYgKGMgPCAtMSkgcltpKytdID0gdGhpcy5EViArIGM7XG4gICAgci50ID0gaTtcbiAgICByLmNsYW1wKCk7XG4gIH1cbiAgLy8gKHB1YmxpYykgdGhpcyArIGFcbiAgZnVuY3Rpb24gYm5BZGQoYSlcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgdGhpcy5hZGRUbyhhLCByKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSB0aGlzIC0gYVxuICBmdW5jdGlvbiBiblN1YnRyYWN0KGEpXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHRoaXMuc3ViVG8oYSwgcik7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgdGhpcyAqIGFcbiAgZnVuY3Rpb24gYm5NdWx0aXBseShhKVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB0aGlzLm11bHRpcGx5VG8oYSwgcik7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgdGhpc14yXG4gIGZ1bmN0aW9uIGJuU3F1YXJlKClcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgdGhpcy5zcXVhcmVUbyhyKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSB0aGlzIC8gYVxuICBmdW5jdGlvbiBibkRpdmlkZShhKVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB0aGlzLmRpdlJlbVRvKGEsIHIsIG51bGwpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIHRoaXMgJSBhXG4gIGZ1bmN0aW9uIGJuUmVtYWluZGVyKGEpXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHRoaXMuZGl2UmVtVG8oYSwgbnVsbCwgcik7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgW3RoaXMvYSx0aGlzJWFdXG4gIGZ1bmN0aW9uIGJuRGl2aWRlQW5kUmVtYWluZGVyKGEpXG4gIHtcbiAgICB2YXIgcSA9IG5iaSgpLFxuICAgICAgciA9IG5iaSgpO1xuICAgIHRoaXMuZGl2UmVtVG8oYSwgcSwgcik7XG4gICAgcmV0dXJuIG5ldyBBcnJheShxLCByKTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSB0aGlzICo9IG4sIHRoaXMgPj0gMCwgMSA8IG4gPCBEVlxuICBmdW5jdGlvbiBibnBETXVsdGlwbHkobilcbiAge1xuICAgIHRoaXNbdGhpcy50XSA9IHRoaXMuYW0oMCwgbiAtIDEsIHRoaXMsIDAsIDAsIHRoaXMudCk7XG4gICAgKyt0aGlzLnQ7XG4gICAgdGhpcy5jbGFtcCgpO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHRoaXMgKz0gbiA8PCB3IHdvcmRzLCB0aGlzID49IDBcbiAgZnVuY3Rpb24gYm5wREFkZE9mZnNldChuLCB3KVxuICB7XG4gICAgaWYgKG4gPT0gMCkgcmV0dXJuO1xuICAgIHdoaWxlICh0aGlzLnQgPD0gdykgdGhpc1t0aGlzLnQrK10gPSAwO1xuICAgIHRoaXNbd10gKz0gbjtcbiAgICB3aGlsZSAodGhpc1t3XSA+PSB0aGlzLkRWKVxuICAgIHtcbiAgICAgIHRoaXNbd10gLT0gdGhpcy5EVjtcbiAgICAgIGlmICgrK3cgPj0gdGhpcy50KSB0aGlzW3RoaXMudCsrXSA9IDA7XG4gICAgICArK3RoaXNbd107XG4gICAgfVxuICB9XG4gIC8vIEEgXCJudWxsXCIgcmVkdWNlclxuICBmdW5jdGlvbiBOdWxsRXhwKClcbiAge31cblxuICBmdW5jdGlvbiBuTm9wKHgpXG4gIHtcbiAgICByZXR1cm4geDtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5NdWxUbyh4LCB5LCByKVxuICB7XG4gICAgeC5tdWx0aXBseVRvKHksIHIpO1xuICB9XG5cbiAgZnVuY3Rpb24gblNxclRvKHgsIHIpXG4gIHtcbiAgICB4LnNxdWFyZVRvKHIpO1xuICB9XG4gIE51bGxFeHAucHJvdG90eXBlLmNvbnZlcnQgPSBuTm9wO1xuICBOdWxsRXhwLnByb3RvdHlwZS5yZXZlcnQgPSBuTm9wO1xuICBOdWxsRXhwLnByb3RvdHlwZS5tdWxUbyA9IG5NdWxUbztcbiAgTnVsbEV4cC5wcm90b3R5cGUuc3FyVG8gPSBuU3FyVG87XG4gIC8vIChwdWJsaWMpIHRoaXNeZVxuICBmdW5jdGlvbiBiblBvdyhlKVxuICB7XG4gICAgcmV0dXJuIHRoaXMuZXhwKGUsIG5ldyBOdWxsRXhwKCkpO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHIgPSBsb3dlciBuIHdvcmRzIG9mIFwidGhpcyAqIGFcIiwgYS50IDw9IG5cbiAgLy8gXCJ0aGlzXCIgc2hvdWxkIGJlIHRoZSBsYXJnZXIgb25lIGlmIGFwcHJvcHJpYXRlLlxuICBmdW5jdGlvbiBibnBNdWx0aXBseUxvd2VyVG8oYSwgbiwgcilcbiAge1xuICAgIHZhciBpID0gTWF0aC5taW4odGhpcy50ICsgYS50LCBuKTtcbiAgICByLnMgPSAwOyAvLyBhc3N1bWVzIGEsdGhpcyA+PSAwXG4gICAgci50ID0gaTtcbiAgICB3aGlsZSAoaSA+IDApIHJbLS1pXSA9IDA7XG4gICAgdmFyIGo7XG4gICAgZm9yIChqID0gci50IC0gdGhpcy50OyBpIDwgajsgKytpKSByW2kgKyB0aGlzLnRdID0gdGhpcy5hbSgwLCBhW2ldLCByLCBpLCAwLCB0aGlzLnQpO1xuICAgIGZvciAoaiA9IE1hdGgubWluKGEudCwgbik7IGkgPCBqOyArK2kpIHRoaXMuYW0oMCwgYVtpXSwgciwgaSwgMCwgbiAtIGkpO1xuICAgIHIuY2xhbXAoKTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSByID0gXCJ0aGlzICogYVwiIHdpdGhvdXQgbG93ZXIgbiB3b3JkcywgbiA+IDBcbiAgLy8gXCJ0aGlzXCIgc2hvdWxkIGJlIHRoZSBsYXJnZXIgb25lIGlmIGFwcHJvcHJpYXRlLlxuICBmdW5jdGlvbiBibnBNdWx0aXBseVVwcGVyVG8oYSwgbiwgcilcbiAge1xuICAgIC0tbjtcbiAgICB2YXIgaSA9IHIudCA9IHRoaXMudCArIGEudCAtIG47XG4gICAgci5zID0gMDsgLy8gYXNzdW1lcyBhLHRoaXMgPj0gMFxuICAgIHdoaWxlICgtLWkgPj0gMCkgcltpXSA9IDA7XG4gICAgZm9yIChpID0gTWF0aC5tYXgobiAtIHRoaXMudCwgMCk7IGkgPCBhLnQ7ICsraSlcbiAgICAgIHJbdGhpcy50ICsgaSAtIG5dID0gdGhpcy5hbShuIC0gaSwgYVtpXSwgciwgMCwgMCwgdGhpcy50ICsgaSAtIG4pO1xuICAgIHIuY2xhbXAoKTtcbiAgICByLmRyU2hpZnRUbygxLCByKTtcbiAgfVxuICAvLyBCYXJyZXR0IG1vZHVsYXIgcmVkdWN0aW9uXG4gIGZ1bmN0aW9uIEJhcnJldHQobSlcbiAge1xuICAgIC8vIHNldHVwIEJhcnJldHRcbiAgICB0aGlzLnIyID0gbmJpKCk7XG4gICAgdGhpcy5xMyA9IG5iaSgpO1xuICAgIEJpZ0ludGVnZXIuT05FLmRsU2hpZnRUbygyICogbS50LCB0aGlzLnIyKTtcbiAgICB0aGlzLm11ID0gdGhpcy5yMi5kaXZpZGUobSk7XG4gICAgdGhpcy5tID0gbTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJhcnJldHRDb252ZXJ0KHgpXG4gIHtcbiAgICBpZiAoeC5zIDwgMCB8fCB4LnQgPiAyICogdGhpcy5tLnQpIHJldHVybiB4Lm1vZCh0aGlzLm0pO1xuICAgIGVsc2UgaWYgKHguY29tcGFyZVRvKHRoaXMubSkgPCAwKSByZXR1cm4geDtcbiAgICBlbHNlXG4gICAge1xuICAgICAgdmFyIHIgPSBuYmkoKTtcbiAgICAgIHguY29weVRvKHIpO1xuICAgICAgdGhpcy5yZWR1Y2Uocik7XG4gICAgICByZXR1cm4gcjtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBiYXJyZXR0UmV2ZXJ0KHgpXG4gIHtcbiAgICByZXR1cm4geDtcbiAgfVxuICAvLyB4ID0geCBtb2QgbSAoSEFDIDE0LjQyKVxuICBmdW5jdGlvbiBiYXJyZXR0UmVkdWNlKHgpXG4gIHtcbiAgICB4LmRyU2hpZnRUbyh0aGlzLm0udCAtIDEsIHRoaXMucjIpO1xuICAgIGlmICh4LnQgPiB0aGlzLm0udCArIDEpXG4gICAge1xuICAgICAgeC50ID0gdGhpcy5tLnQgKyAxO1xuICAgICAgeC5jbGFtcCgpO1xuICAgIH1cbiAgICB0aGlzLm11Lm11bHRpcGx5VXBwZXJUbyh0aGlzLnIyLCB0aGlzLm0udCArIDEsIHRoaXMucTMpO1xuICAgIHRoaXMubS5tdWx0aXBseUxvd2VyVG8odGhpcy5xMywgdGhpcy5tLnQgKyAxLCB0aGlzLnIyKTtcbiAgICB3aGlsZSAoeC5jb21wYXJlVG8odGhpcy5yMikgPCAwKSB4LmRBZGRPZmZzZXQoMSwgdGhpcy5tLnQgKyAxKTtcbiAgICB4LnN1YlRvKHRoaXMucjIsIHgpO1xuICAgIHdoaWxlICh4LmNvbXBhcmVUbyh0aGlzLm0pID49IDApIHguc3ViVG8odGhpcy5tLCB4KTtcbiAgfVxuICAvLyByID0geF4yIG1vZCBtOyB4ICE9IHJcbiAgZnVuY3Rpb24gYmFycmV0dFNxclRvKHgsIHIpXG4gIHtcbiAgICB4LnNxdWFyZVRvKHIpO1xuICAgIHRoaXMucmVkdWNlKHIpO1xuICB9XG4gIC8vIHIgPSB4KnkgbW9kIG07IHgseSAhPSByXG4gIGZ1bmN0aW9uIGJhcnJldHRNdWxUbyh4LCB5LCByKVxuICB7XG4gICAgeC5tdWx0aXBseVRvKHksIHIpO1xuICAgIHRoaXMucmVkdWNlKHIpO1xuICB9XG4gIEJhcnJldHQucHJvdG90eXBlLmNvbnZlcnQgPSBiYXJyZXR0Q29udmVydDtcbiAgQmFycmV0dC5wcm90b3R5cGUucmV2ZXJ0ID0gYmFycmV0dFJldmVydDtcbiAgQmFycmV0dC5wcm90b3R5cGUucmVkdWNlID0gYmFycmV0dFJlZHVjZTtcbiAgQmFycmV0dC5wcm90b3R5cGUubXVsVG8gPSBiYXJyZXR0TXVsVG87XG4gIEJhcnJldHQucHJvdG90eXBlLnNxclRvID0gYmFycmV0dFNxclRvO1xuICAvLyAocHVibGljKSB0aGlzXmUgJSBtIChIQUMgMTQuODUpXG4gIGZ1bmN0aW9uIGJuTW9kUG93KGUsIG0pXG4gIHtcbiAgICB2YXIgaSA9IGUuYml0TGVuZ3RoKCksXG4gICAgICBrLCByID0gbmJ2KDEpLFxuICAgICAgejtcbiAgICBpZiAoaSA8PSAwKSByZXR1cm4gcjtcbiAgICBlbHNlIGlmIChpIDwgMTgpIGsgPSAxO1xuICAgIGVsc2UgaWYgKGkgPCA0OCkgayA9IDM7XG4gICAgZWxzZSBpZiAoaSA8IDE0NCkgayA9IDQ7XG4gICAgZWxzZSBpZiAoaSA8IDc2OCkgayA9IDU7XG4gICAgZWxzZSBrID0gNjtcbiAgICBpZiAoaSA8IDgpXG4gICAgICB6ID0gbmV3IENsYXNzaWMobSk7XG4gICAgZWxzZSBpZiAobS5pc0V2ZW4oKSlcbiAgICAgIHogPSBuZXcgQmFycmV0dChtKTtcbiAgICBlbHNlXG4gICAgICB6ID0gbmV3IE1vbnRnb21lcnkobSk7XG4gICAgLy8gcHJlY29tcHV0YXRpb25cbiAgICB2YXIgZyA9IG5ldyBBcnJheSgpLFxuICAgICAgbiA9IDMsXG4gICAgICBrMSA9IGsgLSAxLFxuICAgICAga20gPSAoMSA8PCBrKSAtIDE7XG4gICAgZ1sxXSA9IHouY29udmVydCh0aGlzKTtcbiAgICBpZiAoayA+IDEpXG4gICAge1xuICAgICAgdmFyIGcyID0gbmJpKCk7XG4gICAgICB6LnNxclRvKGdbMV0sIGcyKTtcbiAgICAgIHdoaWxlIChuIDw9IGttKVxuICAgICAge1xuICAgICAgICBnW25dID0gbmJpKCk7XG4gICAgICAgIHoubXVsVG8oZzIsIGdbbiAtIDJdLCBnW25dKTtcbiAgICAgICAgbiArPSAyO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgaiA9IGUudCAtIDEsXG4gICAgICB3LCBpczEgPSB0cnVlLFxuICAgICAgcjIgPSBuYmkoKSxcbiAgICAgIHQ7XG4gICAgaSA9IG5iaXRzKGVbal0pIC0gMTtcbiAgICB3aGlsZSAoaiA+PSAwKVxuICAgIHtcbiAgICAgIGlmIChpID49IGsxKSB3ID0gKGVbal0gPj4gKGkgLSBrMSkpICYga207XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIHcgPSAoZVtqXSAmICgoMSA8PCAoaSArIDEpKSAtIDEpKSA8PCAoazEgLSBpKTtcbiAgICAgICAgaWYgKGogPiAwKSB3IHw9IGVbaiAtIDFdID4+ICh0aGlzLkRCICsgaSAtIGsxKTtcbiAgICAgIH1cbiAgICAgIG4gPSBrO1xuICAgICAgd2hpbGUgKCh3ICYgMSkgPT0gMClcbiAgICAgIHtcbiAgICAgICAgdyA+Pj0gMTtcbiAgICAgICAgLS1uO1xuICAgICAgfVxuICAgICAgaWYgKChpIC09IG4pIDwgMClcbiAgICAgIHtcbiAgICAgICAgaSArPSB0aGlzLkRCO1xuICAgICAgICAtLWo7XG4gICAgICB9XG4gICAgICBpZiAoaXMxKVxuICAgICAgeyAvLyByZXQgPT0gMSwgZG9uJ3QgYm90aGVyIHNxdWFyaW5nIG9yIG11bHRpcGx5aW5nIGl0XG4gICAgICAgIGdbd10uY29weVRvKHIpO1xuICAgICAgICBpczEgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgd2hpbGUgKG4gPiAxKVxuICAgICAgICB7XG4gICAgICAgICAgei5zcXJUbyhyLCByMik7XG4gICAgICAgICAgei5zcXJUbyhyMiwgcik7XG4gICAgICAgICAgbiAtPSAyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuID4gMCkgei5zcXJUbyhyLCByMik7XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgIHQgPSByO1xuICAgICAgICAgIHIgPSByMjtcbiAgICAgICAgICByMiA9IHQ7XG4gICAgICAgIH1cbiAgICAgICAgei5tdWxUbyhyMiwgZ1t3XSwgcik7XG4gICAgICB9XG4gICAgICB3aGlsZSAoaiA+PSAwICYmIChlW2pdICYgKDEgPDwgaSkpID09IDApXG4gICAgICB7XG4gICAgICAgIHouc3FyVG8ociwgcjIpO1xuICAgICAgICB0ID0gcjtcbiAgICAgICAgciA9IHIyO1xuICAgICAgICByMiA9IHQ7XG4gICAgICAgIGlmICgtLWkgPCAwKVxuICAgICAgICB7XG4gICAgICAgICAgaSA9IHRoaXMuREIgLSAxO1xuICAgICAgICAgIC0tajtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gei5yZXZlcnQocik7XG4gIH1cbiAgLy8gKHB1YmxpYykgZ2NkKHRoaXMsYSkgKEhBQyAxNC41NClcbiAgZnVuY3Rpb24gYm5HQ0QoYSlcbiAge1xuICAgIHZhciB4ID0gKHRoaXMucyA8IDApID8gdGhpcy5uZWdhdGUoKSA6IHRoaXMuY2xvbmUoKTtcbiAgICB2YXIgeSA9IChhLnMgPCAwKSA/IGEubmVnYXRlKCkgOiBhLmNsb25lKCk7XG4gICAgaWYgKHguY29tcGFyZVRvKHkpIDwgMClcbiAgICB7XG4gICAgICB2YXIgdCA9IHg7XG4gICAgICB4ID0geTtcbiAgICAgIHkgPSB0O1xuICAgIH1cbiAgICB2YXIgaSA9IHguZ2V0TG93ZXN0U2V0Qml0KCksXG4gICAgICBnID0geS5nZXRMb3dlc3RTZXRCaXQoKTtcbiAgICBpZiAoZyA8IDApIHJldHVybiB4O1xuICAgIGlmIChpIDwgZykgZyA9IGk7XG4gICAgaWYgKGcgPiAwKVxuICAgIHtcbiAgICAgIHguclNoaWZ0VG8oZywgeCk7XG4gICAgICB5LnJTaGlmdFRvKGcsIHkpO1xuICAgIH1cbiAgICB3aGlsZSAoeC5zaWdudW0oKSA+IDApXG4gICAge1xuICAgICAgaWYgKChpID0geC5nZXRMb3dlc3RTZXRCaXQoKSkgPiAwKSB4LnJTaGlmdFRvKGksIHgpO1xuICAgICAgaWYgKChpID0geS5nZXRMb3dlc3RTZXRCaXQoKSkgPiAwKSB5LnJTaGlmdFRvKGksIHkpO1xuICAgICAgaWYgKHguY29tcGFyZVRvKHkpID49IDApXG4gICAgICB7XG4gICAgICAgIHguc3ViVG8oeSwgeCk7XG4gICAgICAgIHguclNoaWZ0VG8oMSwgeCk7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIHkuc3ViVG8oeCwgeSk7XG4gICAgICAgIHkuclNoaWZ0VG8oMSwgeSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChnID4gMCkgeS5sU2hpZnRUbyhnLCB5KTtcbiAgICByZXR1cm4geTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSB0aGlzICUgbiwgbiA8IDJeMjZcbiAgZnVuY3Rpb24gYm5wTW9kSW50KG4pXG4gIHtcbiAgICBpZiAobiA8PSAwKSByZXR1cm4gMDtcbiAgICB2YXIgZCA9IHRoaXMuRFYgJSBuLFxuICAgICAgciA9ICh0aGlzLnMgPCAwKSA/IG4gLSAxIDogMDtcbiAgICBpZiAodGhpcy50ID4gMClcbiAgICAgIGlmIChkID09IDApIHIgPSB0aGlzWzBdICUgbjtcbiAgICAgIGVsc2VcbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMudCAtIDE7IGkgPj0gMDsgLS1pKSByID0gKGQgKiByICsgdGhpc1tpXSkgJSBuO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIDEvdGhpcyAlIG0gKEhBQyAxNC42MSlcbiAgZnVuY3Rpb24gYm5Nb2RJbnZlcnNlKG0pXG4gIHtcbiAgICB2YXIgYWMgPSBtLmlzRXZlbigpO1xuICAgIGlmICgodGhpcy5pc0V2ZW4oKSAmJiBhYykgfHwgbS5zaWdudW0oKSA9PSAwKSByZXR1cm4gQmlnSW50ZWdlci5aRVJPO1xuICAgIHZhciB1ID0gbS5jbG9uZSgpLFxuICAgICAgdiA9IHRoaXMuY2xvbmUoKTtcbiAgICB2YXIgYSA9IG5idigxKSxcbiAgICAgIGIgPSBuYnYoMCksXG4gICAgICBjID0gbmJ2KDApLFxuICAgICAgZCA9IG5idigxKTtcbiAgICB3aGlsZSAodS5zaWdudW0oKSAhPSAwKVxuICAgIHtcbiAgICAgIHdoaWxlICh1LmlzRXZlbigpKVxuICAgICAge1xuICAgICAgICB1LnJTaGlmdFRvKDEsIHUpO1xuICAgICAgICBpZiAoYWMpXG4gICAgICAgIHtcbiAgICAgICAgICBpZiAoIWEuaXNFdmVuKCkgfHwgIWIuaXNFdmVuKCkpXG4gICAgICAgICAge1xuICAgICAgICAgICAgYS5hZGRUbyh0aGlzLCBhKTtcbiAgICAgICAgICAgIGIuc3ViVG8obSwgYik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGEuclNoaWZ0VG8oMSwgYSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWIuaXNFdmVuKCkpIGIuc3ViVG8obSwgYik7XG4gICAgICAgIGIuclNoaWZ0VG8oMSwgYik7XG4gICAgICB9XG4gICAgICB3aGlsZSAodi5pc0V2ZW4oKSlcbiAgICAgIHtcbiAgICAgICAgdi5yU2hpZnRUbygxLCB2KTtcbiAgICAgICAgaWYgKGFjKVxuICAgICAgICB7XG4gICAgICAgICAgaWYgKCFjLmlzRXZlbigpIHx8ICFkLmlzRXZlbigpKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGMuYWRkVG8odGhpcywgYyk7XG4gICAgICAgICAgICBkLnN1YlRvKG0sIGQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjLnJTaGlmdFRvKDEsIGMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFkLmlzRXZlbigpKSBkLnN1YlRvKG0sIGQpO1xuICAgICAgICBkLnJTaGlmdFRvKDEsIGQpO1xuICAgICAgfVxuICAgICAgaWYgKHUuY29tcGFyZVRvKHYpID49IDApXG4gICAgICB7XG4gICAgICAgIHUuc3ViVG8odiwgdSk7XG4gICAgICAgIGlmIChhYykgYS5zdWJUbyhjLCBhKTtcbiAgICAgICAgYi5zdWJUbyhkLCBiKTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgdi5zdWJUbyh1LCB2KTtcbiAgICAgICAgaWYgKGFjKSBjLnN1YlRvKGEsIGMpO1xuICAgICAgICBkLnN1YlRvKGIsIGQpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodi5jb21wYXJlVG8oQmlnSW50ZWdlci5PTkUpICE9IDApIHJldHVybiBCaWdJbnRlZ2VyLlpFUk87XG4gICAgaWYgKGQuY29tcGFyZVRvKG0pID49IDApIHJldHVybiBkLnN1YnRyYWN0KG0pO1xuICAgIGlmIChkLnNpZ251bSgpIDwgMCkgZC5hZGRUbyhtLCBkKTtcbiAgICBlbHNlIHJldHVybiBkO1xuICAgIGlmIChkLnNpZ251bSgpIDwgMCkgcmV0dXJuIGQuYWRkKG0pO1xuICAgIGVsc2UgcmV0dXJuIGQ7XG4gIH1cbiAgdmFyIGxvd3ByaW1lcyA9IFsyLCAzLCA1LCA3LCAxMSwgMTMsIDE3LCAxOSwgMjMsIDI5LCAzMSwgMzcsIDQxLCA0MywgNDcsIDUzLCA1OSwgNjEsIDY3LCA3MSwgNzMsIDc5LCA4MywgODksIDk3LCAxMDEsIDEwMywgMTA3LCAxMDksIDExMywgMTI3LCAxMzEsIDEzNywgMTM5LCAxNDksIDE1MSwgMTU3LCAxNjMsIDE2NywgMTczLCAxNzksIDE4MSwgMTkxLCAxOTMsIDE5NywgMTk5LCAyMTEsIDIyMywgMjI3LCAyMjksIDIzMywgMjM5LCAyNDEsIDI1MSwgMjU3LCAyNjMsIDI2OSwgMjcxLCAyNzcsIDI4MSwgMjgzLCAyOTMsIDMwNywgMzExLCAzMTMsIDMxNywgMzMxLCAzMzcsIDM0NywgMzQ5LCAzNTMsIDM1OSwgMzY3LCAzNzMsIDM3OSwgMzgzLCAzODksIDM5NywgNDAxLCA0MDksIDQxOSwgNDIxLCA0MzEsIDQzMywgNDM5LCA0NDMsIDQ0OSwgNDU3LCA0NjEsIDQ2MywgNDY3LCA0NzksIDQ4NywgNDkxLCA0OTksIDUwMywgNTA5LCA1MjEsIDUyMywgNTQxLCA1NDcsIDU1NywgNTYzLCA1NjksIDU3MSwgNTc3LCA1ODcsIDU5MywgNTk5LCA2MDEsIDYwNywgNjEzLCA2MTcsIDYxOSwgNjMxLCA2NDEsIDY0MywgNjQ3LCA2NTMsIDY1OSwgNjYxLCA2NzMsIDY3NywgNjgzLCA2OTEsIDcwMSwgNzA5LCA3MTksIDcyNywgNzMzLCA3MzksIDc0MywgNzUxLCA3NTcsIDc2MSwgNzY5LCA3NzMsIDc4NywgNzk3LCA4MDksIDgxMSwgODIxLCA4MjMsIDgyNywgODI5LCA4MzksIDg1MywgODU3LCA4NTksIDg2MywgODc3LCA4ODEsIDg4MywgODg3LCA5MDcsIDkxMSwgOTE5LCA5MjksIDkzNywgOTQxLCA5NDcsIDk1MywgOTY3LCA5NzEsIDk3NywgOTgzLCA5OTEsIDk5N107XG4gIHZhciBscGxpbSA9ICgxIDw8IDI2KSAvIGxvd3ByaW1lc1tsb3dwcmltZXMubGVuZ3RoIC0gMV07XG4gIC8vIChwdWJsaWMpIHRlc3QgcHJpbWFsaXR5IHdpdGggY2VydGFpbnR5ID49IDEtLjVedFxuICBmdW5jdGlvbiBibklzUHJvYmFibGVQcmltZSh0KVxuICB7XG4gICAgdmFyIGksIHggPSB0aGlzLmFicygpO1xuICAgIGlmICh4LnQgPT0gMSAmJiB4WzBdIDw9IGxvd3ByaW1lc1tsb3dwcmltZXMubGVuZ3RoIC0gMV0pXG4gICAge1xuICAgICAgZm9yIChpID0gMDsgaSA8IGxvd3ByaW1lcy5sZW5ndGg7ICsraSlcbiAgICAgICAgaWYgKHhbMF0gPT0gbG93cHJpbWVzW2ldKSByZXR1cm4gdHJ1ZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHguaXNFdmVuKCkpIHJldHVybiBmYWxzZTtcbiAgICBpID0gMTtcbiAgICB3aGlsZSAoaSA8IGxvd3ByaW1lcy5sZW5ndGgpXG4gICAge1xuICAgICAgdmFyIG0gPSBsb3dwcmltZXNbaV0sXG4gICAgICAgIGogPSBpICsgMTtcbiAgICAgIHdoaWxlIChqIDwgbG93cHJpbWVzLmxlbmd0aCAmJiBtIDwgbHBsaW0pIG0gKj0gbG93cHJpbWVzW2orK107XG4gICAgICBtID0geC5tb2RJbnQobSk7XG4gICAgICB3aGlsZSAoaSA8IGopXG4gICAgICAgIGlmIChtICUgbG93cHJpbWVzW2krK10gPT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4geC5taWxsZXJSYWJpbih0KTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSB0cnVlIGlmIHByb2JhYmx5IHByaW1lIChIQUMgNC4yNCwgTWlsbGVyLVJhYmluKVxuICBmdW5jdGlvbiBibnBNaWxsZXJSYWJpbih0KVxuICB7XG4gICAgdmFyIG4xID0gdGhpcy5zdWJ0cmFjdChCaWdJbnRlZ2VyLk9ORSk7XG4gICAgdmFyIGsgPSBuMS5nZXRMb3dlc3RTZXRCaXQoKTtcbiAgICBpZiAoayA8PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgdmFyIHIgPSBuMS5zaGlmdFJpZ2h0KGspO1xuICAgIHQgPSAodCArIDEpID4+IDE7XG4gICAgaWYgKHQgPiBsb3dwcmltZXMubGVuZ3RoKSB0ID0gbG93cHJpbWVzLmxlbmd0aDtcbiAgICB2YXIgYSA9IG5iaSgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdDsgKytpKVxuICAgIHtcbiAgICAgIC8vUGljayBiYXNlcyBhdCByYW5kb20sIGluc3RlYWQgb2Ygc3RhcnRpbmcgYXQgMlxuICAgICAgYS5mcm9tSW50KGxvd3ByaW1lc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBsb3dwcmltZXMubGVuZ3RoKV0pO1xuICAgICAgdmFyIHkgPSBhLm1vZFBvdyhyLCB0aGlzKTtcbiAgICAgIGlmICh5LmNvbXBhcmVUbyhCaWdJbnRlZ2VyLk9ORSkgIT0gMCAmJiB5LmNvbXBhcmVUbyhuMSkgIT0gMClcbiAgICAgIHtcbiAgICAgICAgdmFyIGogPSAxO1xuICAgICAgICB3aGlsZSAoaisrIDwgayAmJiB5LmNvbXBhcmVUbyhuMSkgIT0gMClcbiAgICAgICAge1xuICAgICAgICAgIHkgPSB5Lm1vZFBvd0ludCgyLCB0aGlzKTtcbiAgICAgICAgICBpZiAoeS5jb21wYXJlVG8oQmlnSW50ZWdlci5PTkUpID09IDApIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeS5jb21wYXJlVG8objEpICE9IDApIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLy8gcHJvdGVjdGVkXG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmNodW5rU2l6ZSA9IGJucENodW5rU2l6ZTtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUudG9SYWRpeCA9IGJucFRvUmFkaXg7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmZyb21SYWRpeCA9IGJucEZyb21SYWRpeDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuZnJvbU51bWJlciA9IGJucEZyb21OdW1iZXI7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmJpdHdpc2VUbyA9IGJucEJpdHdpc2VUbztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuY2hhbmdlQml0ID0gYm5wQ2hhbmdlQml0O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hZGRUbyA9IGJucEFkZFRvO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5kTXVsdGlwbHkgPSBibnBETXVsdGlwbHk7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmRBZGRPZmZzZXQgPSBibnBEQWRkT2Zmc2V0O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5tdWx0aXBseUxvd2VyVG8gPSBibnBNdWx0aXBseUxvd2VyVG87XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLm11bHRpcGx5VXBwZXJUbyA9IGJucE11bHRpcGx5VXBwZXJUbztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUubW9kSW50ID0gYm5wTW9kSW50O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5taWxsZXJSYWJpbiA9IGJucE1pbGxlclJhYmluO1xuICAvLyBwdWJsaWNcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuY2xvbmUgPSBibkNsb25lO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5pbnRWYWx1ZSA9IGJuSW50VmFsdWU7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmJ5dGVWYWx1ZSA9IGJuQnl0ZVZhbHVlO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5zaG9ydFZhbHVlID0gYm5TaG9ydFZhbHVlO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5zaWdudW0gPSBiblNpZ051bTtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUudG9CeXRlQXJyYXkgPSBiblRvQnl0ZUFycmF5O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5lcXVhbHMgPSBibkVxdWFscztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUubWluID0gYm5NaW47XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLm1heCA9IGJuTWF4O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hbmQgPSBibkFuZDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUub3IgPSBibk9yO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS54b3IgPSBiblhvcjtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuYW5kTm90ID0gYm5BbmROb3Q7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLm5vdCA9IGJuTm90O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5zaGlmdExlZnQgPSBiblNoaWZ0TGVmdDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuc2hpZnRSaWdodCA9IGJuU2hpZnRSaWdodDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuZ2V0TG93ZXN0U2V0Qml0ID0gYm5HZXRMb3dlc3RTZXRCaXQ7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmJpdENvdW50ID0gYm5CaXRDb3VudDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUudGVzdEJpdCA9IGJuVGVzdEJpdDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuc2V0Qml0ID0gYm5TZXRCaXQ7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmNsZWFyQml0ID0gYm5DbGVhckJpdDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuZmxpcEJpdCA9IGJuRmxpcEJpdDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuYWRkID0gYm5BZGQ7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLnN1YnRyYWN0ID0gYm5TdWJ0cmFjdDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUubXVsdGlwbHkgPSBibk11bHRpcGx5O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5kaXZpZGUgPSBibkRpdmlkZTtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUucmVtYWluZGVyID0gYm5SZW1haW5kZXI7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmRpdmlkZUFuZFJlbWFpbmRlciA9IGJuRGl2aWRlQW5kUmVtYWluZGVyO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5tb2RQb3cgPSBibk1vZFBvdztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUubW9kSW52ZXJzZSA9IGJuTW9kSW52ZXJzZTtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUucG93ID0gYm5Qb3c7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmdjZCA9IGJuR0NEO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5pc1Byb2JhYmxlUHJpbWUgPSBibklzUHJvYmFibGVQcmltZTtcbiAgLy8gSlNCTi1zcGVjaWZpYyBleHRlbnNpb25cbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuc3F1YXJlID0gYm5TcXVhcmU7XG4gIHZhciBJbnQxMjggPSBCaWdJbnRlZ2VyO1xuICAvLyBCaWdJbnRlZ2VyIGludGVyZmFjZXMgbm90IGltcGxlbWVudGVkIGluIGpzYm46XG4gIC8vIEJpZ0ludGVnZXIoaW50IHNpZ251bSwgYnl0ZVtdIG1hZ25pdHVkZSlcbiAgLy8gZG91YmxlIGRvdWJsZVZhbHVlKClcbiAgLy8gZmxvYXQgZmxvYXRWYWx1ZSgpXG4gIC8vIGludCBoYXNoQ29kZSgpXG4gIC8vIGxvbmcgbG9uZ1ZhbHVlKClcbiAgLy8gc3RhdGljIEJpZ0ludGVnZXIgdmFsdWVPZihsb25nIHZhbClcbiAgLy8gSGVscGVyIGZ1bmN0aW9ucyB0byBtYWtlIEJpZ0ludGVnZXIgZnVuY3Rpb25zIGNhbGxhYmxlIHdpdGggdHdvIHBhcmFtZXRlcnNcbiAgLy8gYXMgaW4gb3JpZ2luYWwgQyMgQ2xpcHBlclxuICBJbnQxMjgucHJvdG90eXBlLklzTmVnYXRpdmUgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgaWYgKHRoaXMuY29tcGFyZVRvKEludDEyOC5aRVJPKSA9PSAtMSkgcmV0dXJuIHRydWU7XG4gICAgZWxzZSByZXR1cm4gZmFsc2U7XG4gIH07XG4gIEludDEyOC5vcF9FcXVhbGl0eSA9IGZ1bmN0aW9uICh2YWwxLCB2YWwyKVxuICB7XG4gICAgaWYgKHZhbDEuY29tcGFyZVRvKHZhbDIpID09IDApIHJldHVybiB0cnVlO1xuICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xuICB9O1xuICBJbnQxMjgub3BfSW5lcXVhbGl0eSA9IGZ1bmN0aW9uICh2YWwxLCB2YWwyKVxuICB7XG4gICAgaWYgKHZhbDEuY29tcGFyZVRvKHZhbDIpICE9IDApIHJldHVybiB0cnVlO1xuICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xuICB9O1xuICBJbnQxMjgub3BfR3JlYXRlclRoYW4gPSBmdW5jdGlvbiAodmFsMSwgdmFsMilcbiAge1xuICAgIGlmICh2YWwxLmNvbXBhcmVUbyh2YWwyKSA+IDApIHJldHVybiB0cnVlO1xuICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xuICB9O1xuICBJbnQxMjgub3BfTGVzc1RoYW4gPSBmdW5jdGlvbiAodmFsMSwgdmFsMilcbiAge1xuICAgIGlmICh2YWwxLmNvbXBhcmVUbyh2YWwyKSA8IDApIHJldHVybiB0cnVlO1xuICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xuICB9O1xuICBJbnQxMjgub3BfQWRkaXRpb24gPSBmdW5jdGlvbiAobGhzLCByaHMpXG4gIHtcbiAgICByZXR1cm4gbmV3IEludDEyOChsaHMpLmFkZChuZXcgSW50MTI4KHJocykpO1xuICB9O1xuICBJbnQxMjgub3BfU3VidHJhY3Rpb24gPSBmdW5jdGlvbiAobGhzLCByaHMpXG4gIHtcbiAgICByZXR1cm4gbmV3IEludDEyOChsaHMpLnN1YnRyYWN0KG5ldyBJbnQxMjgocmhzKSk7XG4gIH07XG4gIEludDEyOC5JbnQxMjhNdWwgPSBmdW5jdGlvbiAobGhzLCByaHMpXG4gIHtcbiAgICByZXR1cm4gbmV3IEludDEyOChsaHMpLm11bHRpcGx5KG5ldyBJbnQxMjgocmhzKSk7XG4gIH07XG4gIEludDEyOC5vcF9EaXZpc2lvbiA9IGZ1bmN0aW9uIChsaHMsIHJocylcbiAge1xuICAgIHJldHVybiBsaHMuZGl2aWRlKHJocyk7XG4gIH07XG4gIEludDEyOC5wcm90b3R5cGUuVG9Eb3VibGUgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgcmV0dXJuIHBhcnNlRmxvYXQodGhpcy50b1N0cmluZygpKTsgLy8gVGhpcyBjb3VsZCBiZSBzb21ldGhpbmcgZmFzdGVyXG4gIH07XG4gIC8vIGVuZCBvZiBJbnQxMjggc2VjdGlvblxuICAvKlxuICAvLyBVbmNvbW1lbnQgdGhlIGZvbGxvd2luZyB0d28gbGluZXMgaWYgeW91IHdhbnQgdG8gdXNlIEludDEyOCBvdXRzaWRlIENsaXBwZXJMaWJcbiAgaWYgKHR5cGVvZihkb2N1bWVudCkgIT09IFwidW5kZWZpbmVkXCIpIHdpbmRvdy5JbnQxMjggPSBJbnQxMjg7XG4gIGVsc2Ugc2VsZi5JbnQxMjggPSBJbnQxMjg7XG4gICovXG5cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gSGVyZSBzdGFydHMgdGhlIGFjdHVhbCBDbGlwcGVyIGxpYnJhcnk6XG4gIC8vIEhlbHBlciBmdW5jdGlvbiB0byBzdXBwb3J0IEluaGVyaXRhbmNlIGluIEphdmFzY3JpcHRcblx0dmFyIEluaGVyaXQgPSBmdW5jdGlvbiAoY2UsIGNlMilcblx0e1xuXHRcdHZhciBwO1xuXHRcdGlmICh0eXBlb2YgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKSA9PSAndW5kZWZpbmVkJylcblx0XHR7XG5cdFx0XHRmb3IgKHAgaW4gY2UyLnByb3RvdHlwZSlcblx0XHRcdFx0aWYgKHR5cGVvZiAoY2UucHJvdG90eXBlW3BdKSA9PSAndW5kZWZpbmVkJyB8fCBjZS5wcm90b3R5cGVbcF0gPT0gT2JqZWN0LnByb3RvdHlwZVtwXSkgY2UucHJvdG90eXBlW3BdID0gY2UyLnByb3RvdHlwZVtwXTtcblx0XHRcdGZvciAocCBpbiBjZTIpXG5cdFx0XHRcdGlmICh0eXBlb2YgKGNlW3BdKSA9PSAndW5kZWZpbmVkJykgY2VbcF0gPSBjZTJbcF07XG5cdFx0XHRjZS4kYmFzZUN0b3IgPSBjZTI7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHR2YXIgcHJvcHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhjZTIucHJvdG90eXBlKTtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspXG5cdFx0XHRcdGlmICh0eXBlb2YgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoY2UucHJvdG90eXBlLCBwcm9wc1tpXSkpID09ICd1bmRlZmluZWQnKSBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2UucHJvdG90eXBlLCBwcm9wc1tpXSwgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihjZTIucHJvdG90eXBlLCBwcm9wc1tpXSkpO1xuXHRcdFx0Zm9yIChwIGluIGNlMilcblx0XHRcdFx0aWYgKHR5cGVvZiAoY2VbcF0pID09ICd1bmRlZmluZWQnKSBjZVtwXSA9IGNlMltwXTtcblx0XHRcdGNlLiRiYXNlQ3RvciA9IGNlMjtcblx0XHR9XG5cdH07XG4gIENsaXBwZXJMaWIuUGF0aCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICByZXR1cm4gW107XG4gIH07XG4gIENsaXBwZXJMaWIuUGF0aHMgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgcmV0dXJuIFtdOyAvLyBXYXMgcHJldmlvdXNseSBbW11dLCBidXQgY2F1c2VkIHByb2JsZW1zIHdoZW4gcHVzaGVkXG4gIH07XG4gIC8vIFByZXNlcnZlcyB0aGUgY2FsbGluZyB3YXkgb2Ygb3JpZ2luYWwgQyMgQ2xpcHBlclxuICAvLyBJcyBlc3NlbnRpYWwgZHVlIHRvIGNvbXBhdGliaWxpdHksIGJlY2F1c2UgRG91YmxlUG9pbnQgaXMgcHVibGljIGNsYXNzIGluIG9yaWdpbmFsIEMjIHZlcnNpb25cbiAgQ2xpcHBlckxpYi5Eb3VibGVQb2ludCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB2YXIgYSA9IGFyZ3VtZW50cztcbiAgICB0aGlzLlggPSAwO1xuICAgIHRoaXMuWSA9IDA7XG4gICAgLy8gcHVibGljIERvdWJsZVBvaW50KERvdWJsZVBvaW50IGRwKVxuICAgIC8vIHB1YmxpYyBEb3VibGVQb2ludChJbnRQb2ludCBpcClcbiAgICBpZiAoYS5sZW5ndGggPT0gMSlcbiAgICB7XG4gICAgICB0aGlzLlggPSBhWzBdLlg7XG4gICAgICB0aGlzLlkgPSBhWzBdLlk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGEubGVuZ3RoID09IDIpXG4gICAge1xuICAgICAgdGhpcy5YID0gYVswXTtcbiAgICAgIHRoaXMuWSA9IGFbMV07XG4gICAgfVxuICB9OyAvLyBUaGlzIGlzIGludGVybmFsIGZhc3RlciBmdW5jdGlvbiB3aGVuIGNhbGxlZCB3aXRob3V0IGFyZ3VtZW50c1xuICBDbGlwcGVyTGliLkRvdWJsZVBvaW50MCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB0aGlzLlggPSAwO1xuICAgIHRoaXMuWSA9IDA7XG4gIH07XG4gIC8vIFRoaXMgaXMgaW50ZXJuYWwgZmFzdGVyIGZ1bmN0aW9uIHdoZW4gY2FsbGVkIHdpdGggMSBhcmd1bWVudCAoZHAgb3IgaXApXG4gIENsaXBwZXJMaWIuRG91YmxlUG9pbnQxID0gZnVuY3Rpb24gKGRwKVxuICB7XG4gICAgdGhpcy5YID0gZHAuWDtcbiAgICB0aGlzLlkgPSBkcC5ZO1xuICB9O1xuICAvLyBUaGlzIGlzIGludGVybmFsIGZhc3RlciBmdW5jdGlvbiB3aGVuIGNhbGxlZCB3aXRoIDIgYXJndW1lbnRzICh4IGFuZCB5KVxuICBDbGlwcGVyTGliLkRvdWJsZVBvaW50MiA9IGZ1bmN0aW9uICh4LCB5KVxuICB7XG4gICAgdGhpcy5YID0geDtcbiAgICB0aGlzLlkgPSB5O1xuICB9O1xuICAvLyBQb2x5VHJlZSAmIFBvbHlOb2RlIHN0YXJ0XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQ2xpcHBlckxpYi5Qb2x5Tm9kZSA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB0aGlzLm1fUGFyZW50ID0gbnVsbDtcbiAgICB0aGlzLm1fcG9seWdvbiA9IG5ldyBDbGlwcGVyTGliLlBhdGgoKTtcbiAgICB0aGlzLm1fSW5kZXggPSAwO1xuICAgIHRoaXMubV9qb2ludHlwZSA9IDA7XG4gICAgdGhpcy5tX2VuZHR5cGUgPSAwO1xuICAgIHRoaXMubV9DaGlsZHMgPSBbXTtcbiAgICB0aGlzLklzT3BlbiA9IGZhbHNlO1xuICB9O1xuICBDbGlwcGVyTGliLlBvbHlOb2RlLnByb3RvdHlwZS5Jc0hvbGVOb2RlID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHZhciByZXN1bHQgPSB0cnVlO1xuICAgIHZhciBub2RlID0gdGhpcy5tX1BhcmVudDtcbiAgICB3aGlsZSAobm9kZSAhPT0gbnVsbClcbiAgICB7XG4gICAgICByZXN1bHQgPSAhcmVzdWx0O1xuICAgICAgbm9kZSA9IG5vZGUubV9QYXJlbnQ7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG4gIENsaXBwZXJMaWIuUG9seU5vZGUucHJvdG90eXBlLkNoaWxkQ291bnQgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXMubV9DaGlsZHMubGVuZ3RoO1xuICB9O1xuICBDbGlwcGVyTGliLlBvbHlOb2RlLnByb3RvdHlwZS5Db250b3VyID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHJldHVybiB0aGlzLm1fcG9seWdvbjtcbiAgfTtcbiAgQ2xpcHBlckxpYi5Qb2x5Tm9kZS5wcm90b3R5cGUuQWRkQ2hpbGQgPSBmdW5jdGlvbiAoQ2hpbGQpXG4gIHtcbiAgICB2YXIgY250ID0gdGhpcy5tX0NoaWxkcy5sZW5ndGg7XG4gICAgdGhpcy5tX0NoaWxkcy5wdXNoKENoaWxkKTtcbiAgICBDaGlsZC5tX1BhcmVudCA9IHRoaXM7XG4gICAgQ2hpbGQubV9JbmRleCA9IGNudDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5Qb2x5Tm9kZS5wcm90b3R5cGUuR2V0TmV4dCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICBpZiAodGhpcy5tX0NoaWxkcy5sZW5ndGggPiAwKVxuICAgICAgcmV0dXJuIHRoaXMubV9DaGlsZHNbMF07XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIHRoaXMuR2V0TmV4dFNpYmxpbmdVcCgpO1xuICB9O1xuICBDbGlwcGVyTGliLlBvbHlOb2RlLnByb3RvdHlwZS5HZXROZXh0U2libGluZ1VwID0gZnVuY3Rpb24gKClcbiAge1xuICAgIGlmICh0aGlzLm1fUGFyZW50ID09PSBudWxsKVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgZWxzZSBpZiAodGhpcy5tX0luZGV4ID09IHRoaXMubV9QYXJlbnQubV9DaGlsZHMubGVuZ3RoIC0gMSlcbiAgICAgIHJldHVybiB0aGlzLm1fUGFyZW50LkdldE5leHRTaWJsaW5nVXAoKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gdGhpcy5tX1BhcmVudC5tX0NoaWxkc1t0aGlzLm1fSW5kZXggKyAxXTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5Qb2x5Tm9kZS5wcm90b3R5cGUuQ2hpbGRzID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHJldHVybiB0aGlzLm1fQ2hpbGRzO1xuICB9O1xuICBDbGlwcGVyTGliLlBvbHlOb2RlLnByb3RvdHlwZS5QYXJlbnQgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXMubV9QYXJlbnQ7XG4gIH07XG4gIENsaXBwZXJMaWIuUG9seU5vZGUucHJvdG90eXBlLklzSG9sZSA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICByZXR1cm4gdGhpcy5Jc0hvbGVOb2RlKCk7XG4gIH07XG4gIC8vIFBvbHlUcmVlIDogUG9seU5vZGVcbiAgQ2xpcHBlckxpYi5Qb2x5VHJlZSA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB0aGlzLm1fQWxsUG9seXMgPSBbXTtcbiAgICBDbGlwcGVyTGliLlBvbHlOb2RlLmNhbGwodGhpcyk7XG4gIH07XG4gIENsaXBwZXJMaWIuUG9seVRyZWUucHJvdG90eXBlLkNsZWFyID0gZnVuY3Rpb24gKClcbiAge1xuICAgIGZvciAodmFyIGkgPSAwLCBpbGVuID0gdGhpcy5tX0FsbFBvbHlzLmxlbmd0aDsgaSA8IGlsZW47IGkrKylcbiAgICAgIHRoaXMubV9BbGxQb2x5c1tpXSA9IG51bGw7XG4gICAgdGhpcy5tX0FsbFBvbHlzLmxlbmd0aCA9IDA7XG4gICAgdGhpcy5tX0NoaWxkcy5sZW5ndGggPSAwO1xuICB9O1xuICBDbGlwcGVyTGliLlBvbHlUcmVlLnByb3RvdHlwZS5HZXRGaXJzdCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICBpZiAodGhpcy5tX0NoaWxkcy5sZW5ndGggPiAwKVxuICAgICAgcmV0dXJuIHRoaXMubV9DaGlsZHNbMF07XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIG51bGw7XG4gIH07XG4gIENsaXBwZXJMaWIuUG9seVRyZWUucHJvdG90eXBlLlRvdGFsID0gZnVuY3Rpb24gKClcbiAge1xuXHRcdHZhciByZXN1bHQgPSB0aGlzLm1fQWxsUG9seXMubGVuZ3RoO1xuXHRcdC8vd2l0aCBuZWdhdGl2ZSBvZmZzZXRzLCBpZ25vcmUgdGhlIGhpZGRlbiBvdXRlciBwb2x5Z29uIC4uLlxuXHRcdGlmIChyZXN1bHQgPiAwICYmIHRoaXMubV9DaGlsZHNbMF0gIT0gdGhpcy5tX0FsbFBvbHlzWzBdKSByZXN1bHQtLTtcblx0XHRyZXR1cm4gcmVzdWx0O1xuICB9O1xuICBJbmhlcml0KENsaXBwZXJMaWIuUG9seVRyZWUsIENsaXBwZXJMaWIuUG9seU5vZGUpO1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIFBvbHlUcmVlICYgUG9seU5vZGUgZW5kXG4gIENsaXBwZXJMaWIuTWF0aF9BYnNfSW50NjQgPSBDbGlwcGVyTGliLk1hdGhfQWJzX0ludDMyID0gQ2xpcHBlckxpYi5NYXRoX0Fic19Eb3VibGUgPSBmdW5jdGlvbiAoYSlcbiAge1xuICAgIHJldHVybiBNYXRoLmFicyhhKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5NYXRoX01heF9JbnQzMl9JbnQzMiA9IGZ1bmN0aW9uIChhLCBiKVxuICB7XG4gICAgcmV0dXJuIE1hdGgubWF4KGEsIGIpO1xuICB9O1xuICAvKlxuICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjYXN0XzMyIHNwZWVkdGVzdDogaHR0cDovL2pzcGVyZi5jb20vdHJ1bmNhdGUtZmxvYXQtdG8taW50ZWdlci8yXG4gIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICovXG4gIGlmIChicm93c2VyLm1zaWUgfHwgYnJvd3Nlci5vcGVyYSB8fCBicm93c2VyLnNhZmFyaSkgQ2xpcHBlckxpYi5DYXN0X0ludDMyID0gZnVuY3Rpb24gKGEpXG4gIHtcbiAgICByZXR1cm4gYSB8IDA7XG4gIH07XG4gIGVsc2UgQ2xpcHBlckxpYi5DYXN0X0ludDMyID0gZnVuY3Rpb24gKGEpXG4gIHsgLy8gZWcuIGJyb3dzZXIuY2hyb21lIHx8IGJyb3dzZXIuY2hyb21pdW0gfHwgYnJvd3Nlci5maXJlZm94XG4gICAgcmV0dXJufn4gYTtcbiAgfTtcbiAgLypcbiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY2FzdF82NCBzcGVlZHRlc3RzOiBodHRwOi8vanNwZXJmLmNvbS90cnVuY2F0ZS1mbG9hdC10by1pbnRlZ2VyXG4gIENocm9tZTogYml0d2lzZV9ub3RfZmxvb3JcbiAgRmlyZWZveDE3OiB0b0ludGVnZXIgKHR5cGVvZiB0ZXN0KVxuICBJRTk6IGJpdHdpc2Vfb3JfZmxvb3JcbiAgSUU3IGFuZCBJRTg6IHRvX3BhcnNlaW50XG4gIENocm9taXVtOiB0b19mbG9vcl9vcl9jZWlsXG4gIEZpcmVmb3gzOiB0b19mbG9vcl9vcl9jZWlsXG4gIEZpcmVmb3gxNTogdG9fZmxvb3Jfb3JfY2VpbFxuICBPcGVyYTogdG9fZmxvb3Jfb3JfY2VpbFxuICBTYWZhcmk6IHRvX2Zsb29yX29yX2NlaWxcbiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgKi9cbiAgaWYgKGJyb3dzZXIuY2hyb21lKSBDbGlwcGVyTGliLkNhc3RfSW50NjQgPSBmdW5jdGlvbiAoYSlcbiAge1xuICAgIGlmIChhIDwgLTIxNDc0ODM2NDggfHwgYSA+IDIxNDc0ODM2NDcpXG4gICAgICByZXR1cm4gYSA8IDAgPyBNYXRoLmNlaWwoYSkgOiBNYXRoLmZsb29yKGEpO1xuICAgIGVsc2UgcmV0dXJufn4gYTtcbiAgfTtcbiAgZWxzZSBpZiAoYnJvd3Nlci5maXJlZm94ICYmIHR5cGVvZiAoTnVtYmVyLnRvSW50ZWdlcikgPT0gXCJmdW5jdGlvblwiKSBDbGlwcGVyTGliLkNhc3RfSW50NjQgPSBmdW5jdGlvbiAoYSlcbiAge1xuICAgIHJldHVybiBOdW1iZXIudG9JbnRlZ2VyKGEpO1xuICB9O1xuICBlbHNlIGlmIChicm93c2VyLm1zaWU3IHx8IGJyb3dzZXIubXNpZTgpIENsaXBwZXJMaWIuQ2FzdF9JbnQ2NCA9IGZ1bmN0aW9uIChhKVxuICB7XG4gICAgcmV0dXJuIHBhcnNlSW50KGEsIDEwKTtcbiAgfTtcbiAgZWxzZSBpZiAoYnJvd3Nlci5tc2llKSBDbGlwcGVyTGliLkNhc3RfSW50NjQgPSBmdW5jdGlvbiAoYSlcbiAge1xuICAgIGlmIChhIDwgLTIxNDc0ODM2NDggfHwgYSA+IDIxNDc0ODM2NDcpXG4gICAgICByZXR1cm4gYSA8IDAgPyBNYXRoLmNlaWwoYSkgOiBNYXRoLmZsb29yKGEpO1xuICAgIHJldHVybiBhIHwgMDtcbiAgfTtcbiAgLy8gZWcuIGJyb3dzZXIuY2hyb21pdW0gfHwgYnJvd3Nlci5maXJlZm94IHx8IGJyb3dzZXIub3BlcmEgfHwgYnJvd3Nlci5zYWZhcmlcbiAgZWxzZSBDbGlwcGVyTGliLkNhc3RfSW50NjQgPSBmdW5jdGlvbiAoYSlcbiAge1xuICAgIHJldHVybiBhIDwgMCA/IE1hdGguY2VpbChhKSA6IE1hdGguZmxvb3IoYSk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xlYXIgPSBmdW5jdGlvbiAoYSlcbiAge1xuICAgIGEubGVuZ3RoID0gMDtcbiAgfTtcbiAgLy9DbGlwcGVyTGliLk1heFN0ZXBzID0gNjQ7IC8vIEhvdyBtYW55IHN0ZXBzIGF0IG1heGltdW0gaW4gYXJjIGluIEJ1aWxkQXJjKCkgZnVuY3Rpb25cbiAgQ2xpcHBlckxpYi5QSSA9IDMuMTQxNTkyNjUzNTg5NzkzO1xuICBDbGlwcGVyTGliLlBJMiA9IDIgKiAzLjE0MTU5MjY1MzU4OTc5MztcbiAgQ2xpcHBlckxpYi5JbnRQb2ludCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB2YXIgYSA9IGFyZ3VtZW50cyxcbiAgICAgIGFsZW4gPSBhLmxlbmd0aDtcbiAgICB0aGlzLlggPSAwO1xuICAgIHRoaXMuWSA9IDA7XG4gICAgaWYgKHVzZV94eXopXG4gICAge1xuICAgICAgdGhpcy5aID0gMDtcbiAgICAgIGlmIChhbGVuID09IDMpIC8vIHB1YmxpYyBJbnRQb2ludChjSW50IHgsIGNJbnQgeSwgY0ludCB6ID0gMClcbiAgICAgIHtcbiAgICAgICAgdGhpcy5YID0gYVswXTtcbiAgICAgICAgdGhpcy5ZID0gYVsxXTtcbiAgICAgICAgdGhpcy5aID0gYVsyXTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGFsZW4gPT0gMikgLy8gcHVibGljIEludFBvaW50KGNJbnQgeCwgY0ludCB5KVxuICAgICAge1xuICAgICAgICB0aGlzLlggPSBhWzBdO1xuICAgICAgICB0aGlzLlkgPSBhWzFdO1xuICAgICAgICB0aGlzLlogPSAwO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoYWxlbiA9PSAxKVxuICAgICAge1xuICAgICAgICBpZiAoYVswXSBpbnN0YW5jZW9mIENsaXBwZXJMaWIuRG91YmxlUG9pbnQpIC8vIHB1YmxpYyBJbnRQb2ludChEb3VibGVQb2ludCBkcClcbiAgICAgICAge1xuICAgICAgICAgIHZhciBkcCA9IGFbMF07XG4gICAgICAgICAgdGhpcy5YID0gQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kKGRwLlgpO1xuICAgICAgICAgIHRoaXMuWSA9IENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZChkcC5ZKTtcbiAgICAgICAgICB0aGlzLlogPSAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgLy8gcHVibGljIEludFBvaW50KEludFBvaW50IHB0KVxuICAgICAgICB7XG4gICAgICAgICAgdmFyIHB0ID0gYVswXTtcbiAgICAgICAgICBpZiAodHlwZW9mIChwdC5aKSA9PSBcInVuZGVmaW5lZFwiKSBwdC5aID0gMDtcbiAgICAgICAgICB0aGlzLlggPSBwdC5YO1xuICAgICAgICAgIHRoaXMuWSA9IHB0Llk7XG4gICAgICAgICAgdGhpcy5aID0gcHQuWjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSAvLyBwdWJsaWMgSW50UG9pbnQoKVxuICAgICAge1xuICAgICAgICB0aGlzLlggPSAwO1xuICAgICAgICB0aGlzLlkgPSAwO1xuICAgICAgICB0aGlzLlogPSAwO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIC8vIGlmICghdXNlX3h5eilcbiAgICB7XG4gICAgICBpZiAoYWxlbiA9PSAyKSAvLyBwdWJsaWMgSW50UG9pbnQoY0ludCBYLCBjSW50IFkpXG4gICAgICB7XG4gICAgICAgIHRoaXMuWCA9IGFbMF07XG4gICAgICAgIHRoaXMuWSA9IGFbMV07XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChhbGVuID09IDEpXG4gICAgICB7XG4gICAgICAgIGlmIChhWzBdIGluc3RhbmNlb2YgQ2xpcHBlckxpYi5Eb3VibGVQb2ludCkgLy8gcHVibGljIEludFBvaW50KERvdWJsZVBvaW50IGRwKVxuICAgICAgICB7XG4gICAgICAgICAgdmFyIGRwID0gYVswXTtcbiAgICAgICAgICB0aGlzLlggPSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQoZHAuWCk7XG4gICAgICAgICAgdGhpcy5ZID0gQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kKGRwLlkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgLy8gcHVibGljIEludFBvaW50KEludFBvaW50IHB0KVxuICAgICAgICB7XG4gICAgICAgICAgdmFyIHB0ID0gYVswXTtcbiAgICAgICAgICB0aGlzLlggPSBwdC5YO1xuICAgICAgICAgIHRoaXMuWSA9IHB0Llk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgLy8gcHVibGljIEludFBvaW50KEludFBvaW50IHB0KVxuICAgICAge1xuICAgICAgICB0aGlzLlggPSAwO1xuICAgICAgICB0aGlzLlkgPSAwO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eSA9IGZ1bmN0aW9uIChhLCBiKVxuICB7XG4gICAgLy9yZXR1cm4gYSA9PSBiO1xuICAgIHJldHVybiBhLlggPT0gYi5YICYmIGEuWSA9PSBiLlk7XG4gIH07XG4gIENsaXBwZXJMaWIuSW50UG9pbnQub3BfSW5lcXVhbGl0eSA9IGZ1bmN0aW9uIChhLCBiKVxuICB7XG4gICAgLy9yZXR1cm4gYSAhPSBiO1xuICAgIHJldHVybiBhLlggIT0gYi5YIHx8IGEuWSAhPSBiLlk7XG4gIH07XG4gIC8qXG4gIENsaXBwZXJMaWIuSW50UG9pbnQucHJvdG90eXBlLkVxdWFscyA9IGZ1bmN0aW9uIChvYmopXG4gIHtcbiAgICBpZiAob2JqID09PSBudWxsKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIENsaXBwZXJMaWIuSW50UG9pbnQpXG4gICAge1xuICAgICAgICB2YXIgYSA9IENhc3Qob2JqLCBDbGlwcGVyTGliLkludFBvaW50KTtcbiAgICAgICAgcmV0dXJuICh0aGlzLlggPT0gYS5YKSAmJiAodGhpcy5ZID09IGEuWSk7XG4gICAgfVxuICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuKi9cbiAgaWYgKHVzZV94eXopXG4gIHtcbiAgICBDbGlwcGVyTGliLkludFBvaW50MCA9IGZ1bmN0aW9uICgpXG4gICAge1xuICAgICAgdGhpcy5YID0gMDtcbiAgICAgIHRoaXMuWSA9IDA7XG4gICAgICB0aGlzLlogPSAwO1xuICAgIH07XG4gICAgQ2xpcHBlckxpYi5JbnRQb2ludDEgPSBmdW5jdGlvbiAocHQpXG4gICAge1xuICAgICAgdGhpcy5YID0gcHQuWDtcbiAgICAgIHRoaXMuWSA9IHB0Llk7XG4gICAgICB0aGlzLlogPSBwdC5aO1xuICAgIH07XG4gICAgQ2xpcHBlckxpYi5JbnRQb2ludDFkcCA9IGZ1bmN0aW9uIChkcClcbiAgICB7XG4gICAgICB0aGlzLlggPSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQoZHAuWCk7XG4gICAgICB0aGlzLlkgPSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQoZHAuWSk7XG4gICAgICB0aGlzLlogPSAwO1xuICAgIH07XG4gICAgQ2xpcHBlckxpYi5JbnRQb2ludDIgPSBmdW5jdGlvbiAoeCwgeSlcbiAgICB7XG4gICAgICB0aGlzLlggPSB4O1xuICAgICAgdGhpcy5ZID0geTtcbiAgICAgIHRoaXMuWiA9IDA7XG4gICAgfTtcbiAgICBDbGlwcGVyTGliLkludFBvaW50MyA9IGZ1bmN0aW9uICh4LCB5LCB6KVxuICAgIHtcbiAgICAgIHRoaXMuWCA9IHg7XG4gICAgICB0aGlzLlkgPSB5O1xuICAgICAgdGhpcy5aID0gejtcbiAgICB9O1xuICB9XG4gIGVsc2UgLy8gaWYgKCF1c2VfeHl6KVxuICB7XG4gICAgQ2xpcHBlckxpYi5JbnRQb2ludDAgPSBmdW5jdGlvbiAoKVxuICAgIHtcbiAgICAgIHRoaXMuWCA9IDA7XG4gICAgICB0aGlzLlkgPSAwO1xuICAgIH07XG4gICAgQ2xpcHBlckxpYi5JbnRQb2ludDEgPSBmdW5jdGlvbiAocHQpXG4gICAge1xuICAgICAgdGhpcy5YID0gcHQuWDtcbiAgICAgIHRoaXMuWSA9IHB0Llk7XG4gICAgfTtcbiAgICBDbGlwcGVyTGliLkludFBvaW50MWRwID0gZnVuY3Rpb24gKGRwKVxuICAgIHtcbiAgICAgIHRoaXMuWCA9IENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZChkcC5YKTtcbiAgICAgIHRoaXMuWSA9IENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZChkcC5ZKTtcbiAgICB9O1xuICAgIENsaXBwZXJMaWIuSW50UG9pbnQyID0gZnVuY3Rpb24gKHgsIHkpXG4gICAge1xuICAgICAgdGhpcy5YID0geDtcbiAgICAgIHRoaXMuWSA9IHk7XG4gICAgfTtcbiAgfVxuICBDbGlwcGVyTGliLkludFJlY3QgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdmFyIGEgPSBhcmd1bWVudHMsXG4gICAgICBhbGVuID0gYS5sZW5ndGg7XG4gICAgaWYgKGFsZW4gPT0gNCkgLy8gZnVuY3Rpb24gKGwsIHQsIHIsIGIpXG4gICAge1xuICAgICAgdGhpcy5sZWZ0ID0gYVswXTtcbiAgICAgIHRoaXMudG9wID0gYVsxXTtcbiAgICAgIHRoaXMucmlnaHQgPSBhWzJdO1xuICAgICAgdGhpcy5ib3R0b20gPSBhWzNdO1xuICAgIH1cbiAgICBlbHNlIGlmIChhbGVuID09IDEpIC8vIGZ1bmN0aW9uIChpcilcbiAgICB7XG4gICAgICB0aGlzLmxlZnQgPSBpci5sZWZ0O1xuICAgICAgdGhpcy50b3AgPSBpci50b3A7XG4gICAgICB0aGlzLnJpZ2h0ID0gaXIucmlnaHQ7XG4gICAgICB0aGlzLmJvdHRvbSA9IGlyLmJvdHRvbTtcbiAgICB9XG4gICAgZWxzZSAvLyBmdW5jdGlvbiAoKVxuICAgIHtcbiAgICAgIHRoaXMubGVmdCA9IDA7XG4gICAgICB0aGlzLnRvcCA9IDA7XG4gICAgICB0aGlzLnJpZ2h0ID0gMDtcbiAgICAgIHRoaXMuYm90dG9tID0gMDtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuSW50UmVjdDAgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdGhpcy5sZWZ0ID0gMDtcbiAgICB0aGlzLnRvcCA9IDA7XG4gICAgdGhpcy5yaWdodCA9IDA7XG4gICAgdGhpcy5ib3R0b20gPSAwO1xuICB9O1xuICBDbGlwcGVyTGliLkludFJlY3QxID0gZnVuY3Rpb24gKGlyKVxuICB7XG4gICAgdGhpcy5sZWZ0ID0gaXIubGVmdDtcbiAgICB0aGlzLnRvcCA9IGlyLnRvcDtcbiAgICB0aGlzLnJpZ2h0ID0gaXIucmlnaHQ7XG4gICAgdGhpcy5ib3R0b20gPSBpci5ib3R0b207XG4gIH07XG4gIENsaXBwZXJMaWIuSW50UmVjdDQgPSBmdW5jdGlvbiAobCwgdCwgciwgYilcbiAge1xuICAgIHRoaXMubGVmdCA9IGw7XG4gICAgdGhpcy50b3AgPSB0O1xuICAgIHRoaXMucmlnaHQgPSByO1xuICAgIHRoaXMuYm90dG9tID0gYjtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwVHlwZSA9IHtcbiAgICBjdEludGVyc2VjdGlvbjogMCxcbiAgICBjdFVuaW9uOiAxLFxuICAgIGN0RGlmZmVyZW5jZTogMixcbiAgICBjdFhvcjogM1xuICB9O1xuICBDbGlwcGVyTGliLlBvbHlUeXBlID0ge1xuICAgIHB0U3ViamVjdDogMCxcbiAgICBwdENsaXA6IDFcbiAgfTtcbiAgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUgPSB7XG4gICAgcGZ0RXZlbk9kZDogMCxcbiAgICBwZnROb25aZXJvOiAxLFxuICAgIHBmdFBvc2l0aXZlOiAyLFxuICAgIHBmdE5lZ2F0aXZlOiAzXG4gIH07XG4gIENsaXBwZXJMaWIuSm9pblR5cGUgPSB7XG4gICAganRTcXVhcmU6IDAsXG4gICAganRSb3VuZDogMSxcbiAgICBqdE1pdGVyOiAyXG4gIH07XG4gIENsaXBwZXJMaWIuRW5kVHlwZSA9IHtcbiAgICBldE9wZW5TcXVhcmU6IDAsXG4gICAgZXRPcGVuUm91bmQ6IDEsXG4gICAgZXRPcGVuQnV0dDogMixcbiAgICBldENsb3NlZExpbmU6IDMsXG4gICAgZXRDbG9zZWRQb2x5Z29uOiA0XG4gIH07XG4gIENsaXBwZXJMaWIuRWRnZVNpZGUgPSB7XG4gICAgZXNMZWZ0OiAwLFxuICAgIGVzUmlnaHQ6IDFcbiAgfTtcbiAgQ2xpcHBlckxpYi5EaXJlY3Rpb24gPSB7XG4gICAgZFJpZ2h0VG9MZWZ0OiAwLFxuICAgIGRMZWZ0VG9SaWdodDogMVxuICB9O1xuICBDbGlwcGVyTGliLlRFZGdlID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHRoaXMuQm90ID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQoKTtcbiAgICB0aGlzLkN1cnIgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludCgpO1xuICAgIHRoaXMuVG9wID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQoKTtcbiAgICB0aGlzLkRlbHRhID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQoKTtcbiAgICB0aGlzLkR4ID0gMDtcbiAgICB0aGlzLlBvbHlUeXAgPSBDbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdDtcbiAgICB0aGlzLlNpZGUgPSBDbGlwcGVyTGliLkVkZ2VTaWRlLmVzTGVmdDtcbiAgICB0aGlzLldpbmREZWx0YSA9IDA7XG4gICAgdGhpcy5XaW5kQ250ID0gMDtcbiAgICB0aGlzLldpbmRDbnQyID0gMDtcbiAgICB0aGlzLk91dElkeCA9IDA7XG4gICAgdGhpcy5OZXh0ID0gbnVsbDtcbiAgICB0aGlzLlByZXYgPSBudWxsO1xuICAgIHRoaXMuTmV4dEluTE1MID0gbnVsbDtcbiAgICB0aGlzLk5leHRJbkFFTCA9IG51bGw7XG4gICAgdGhpcy5QcmV2SW5BRUwgPSBudWxsO1xuICAgIHRoaXMuTmV4dEluU0VMID0gbnVsbDtcbiAgICB0aGlzLlByZXZJblNFTCA9IG51bGw7XG4gIH07XG4gIENsaXBwZXJMaWIuSW50ZXJzZWN0Tm9kZSA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB0aGlzLkVkZ2UxID0gbnVsbDtcbiAgICB0aGlzLkVkZ2UyID0gbnVsbDtcbiAgICB0aGlzLlB0ID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQoKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5NeUludGVyc2VjdE5vZGVTb3J0ID0gZnVuY3Rpb24gKCkge307XG4gIENsaXBwZXJMaWIuTXlJbnRlcnNlY3ROb2RlU29ydC5Db21wYXJlID0gZnVuY3Rpb24gKG5vZGUxLCBub2RlMilcbiAge1xuICAgIHZhciBpID0gbm9kZTIuUHQuWSAtIG5vZGUxLlB0Llk7XG4gICAgaWYgKGkgPiAwKSByZXR1cm4gMTtcbiAgICBlbHNlIGlmIChpIDwgMCkgcmV0dXJuIC0xO1xuICAgIGVsc2UgcmV0dXJuIDA7XG4gIH07XG5cbiAgQ2xpcHBlckxpYi5Mb2NhbE1pbmltYSA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB0aGlzLlkgPSAwO1xuICAgIHRoaXMuTGVmdEJvdW5kID0gbnVsbDtcbiAgICB0aGlzLlJpZ2h0Qm91bmQgPSBudWxsO1xuICAgIHRoaXMuTmV4dCA9IG51bGw7XG4gIH07XG4gIENsaXBwZXJMaWIuU2NhbmJlYW0gPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdGhpcy5ZID0gMDtcbiAgICB0aGlzLk5leHQgPSBudWxsO1xuICB9O1xuICBDbGlwcGVyTGliLk91dFJlYyA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB0aGlzLklkeCA9IDA7XG4gICAgdGhpcy5Jc0hvbGUgPSBmYWxzZTtcbiAgICB0aGlzLklzT3BlbiA9IGZhbHNlO1xuICAgIHRoaXMuRmlyc3RMZWZ0ID0gbnVsbDtcbiAgICB0aGlzLlB0cyA9IG51bGw7XG4gICAgdGhpcy5Cb3R0b21QdCA9IG51bGw7XG4gICAgdGhpcy5Qb2x5Tm9kZSA9IG51bGw7XG4gIH07XG4gIENsaXBwZXJMaWIuT3V0UHQgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdGhpcy5JZHggPSAwO1xuICAgIHRoaXMuUHQgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludCgpO1xuICAgIHRoaXMuTmV4dCA9IG51bGw7XG4gICAgdGhpcy5QcmV2ID0gbnVsbDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5Kb2luID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHRoaXMuT3V0UHQxID0gbnVsbDtcbiAgICB0aGlzLk91dFB0MiA9IG51bGw7XG4gICAgdGhpcy5PZmZQdCA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KCk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdGhpcy5tX01pbmltYUxpc3QgPSBudWxsO1xuICAgIHRoaXMubV9DdXJyZW50TE0gPSBudWxsO1xuICAgIHRoaXMubV9lZGdlcyA9IG5ldyBBcnJheSgpO1xuICAgIHRoaXMubV9Vc2VGdWxsUmFuZ2UgPSBmYWxzZTtcbiAgICB0aGlzLm1fSGFzT3BlblBhdGhzID0gZmFsc2U7XG4gICAgdGhpcy5QcmVzZXJ2ZUNvbGxpbmVhciA9IGZhbHNlO1xuICAgIHRoaXMubV9NaW5pbWFMaXN0ID0gbnVsbDtcbiAgICB0aGlzLm1fQ3VycmVudExNID0gbnVsbDtcbiAgICB0aGlzLm1fVXNlRnVsbFJhbmdlID0gZmFsc2U7XG4gICAgdGhpcy5tX0hhc09wZW5QYXRocyA9IGZhbHNlO1xuICB9O1xuICAvLyBSYW5nZXMgYXJlIGluIG9yaWdpbmFsIEMjIHRvbyBoaWdoIGZvciBKYXZhc2NyaXB0IChpbiBjdXJyZW50IHN0YXRlIDIwMTMgc2VwdGVtYmVyKTpcbiAgLy8gcHJvdGVjdGVkIGNvbnN0IGRvdWJsZSBob3Jpem9udGFsID0gLTMuNEUrMzg7XG4gIC8vIGludGVybmFsIGNvbnN0IGNJbnQgbG9SYW5nZSA9IDB4M0ZGRkZGRkY7IC8vID0gMTA3Mzc0MTgyMyA9IHNxcnQoMl42MyAtMSkvMlxuICAvLyBpbnRlcm5hbCBjb25zdCBjSW50IGhpUmFuZ2UgPSAweDNGRkZGRkZGRkZGRkZGRkZMOyAvLyA9IDQ2MTE2ODYwMTg0MjczODc5MDMgPSBzcXJ0KDJeMTI3IC0xKS8yXG4gIC8vIFNvIGhhZCB0byBhZGp1c3QgdGhlbSB0byBtb3JlIHN1aXRhYmxlIGZvciBKYXZhc2NyaXB0LlxuICAvLyBJZiBKUyBzb21lIGRheSBzdXBwb3J0cyB0cnVseSA2NC1iaXQgaW50ZWdlcnMsIHRoZW4gdGhlc2UgcmFuZ2VzIGNhbiBiZSBhcyBpbiBDI1xuICAvLyBhbmQgYmlnaW50ZWdlciBsaWJyYXJ5IGNhbiBiZSBtb3JlIHNpbXBsZXIgKGFzIHRoZW4gMTI4Yml0IGNhbiBiZSByZXByZXNlbnRlZCBhcyB0d28gNjRiaXQgbnVtYmVycylcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsID0gLTkwMDcxOTkyNTQ3NDA5OTI7IC8vLTJeNTNcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Ta2lwID0gLTI7XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuVW5hc3NpZ25lZCA9IC0xO1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnRvbGVyYW5jZSA9IDFFLTIwO1xuICBpZiAodXNlX2ludDMyKVxuICB7XG4gICAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5sb1JhbmdlID0gMHg3RkZGO1xuICAgIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaGlSYW5nZSA9IDB4N0ZGRjtcbiAgfVxuICBlbHNlXG4gIHtcbiAgICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmxvUmFuZ2UgPSA0NzQ1MzEzMjsgLy8gc3FydCgyXjUzIC0xKS8yXG4gICAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5oaVJhbmdlID0gNDUwMzU5OTYyNzM3MDQ5NTsgLy8gc3FydCgyXjEwNiAtMSkvMlxuICB9XG5cbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5uZWFyX3plcm8gPSBmdW5jdGlvbiAodmFsKVxuICB7XG4gICAgcmV0dXJuICh2YWwgPiAtQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS50b2xlcmFuY2UpICYmICh2YWwgPCBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnRvbGVyYW5jZSk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuSXNIb3Jpem9udGFsID0gZnVuY3Rpb24gKGUpXG4gIHtcbiAgICByZXR1cm4gZS5EZWx0YS5ZID09PSAwO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5Qb2ludElzVmVydGV4ID0gZnVuY3Rpb24gKHB0LCBwcClcbiAge1xuICAgIHZhciBwcDIgPSBwcDtcbiAgICBkbyB7XG4gICAgICBpZiAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwcDIuUHQsIHB0KSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBwcDIgPSBwcDIuTmV4dDtcbiAgICB9XG4gICAgd2hpbGUgKHBwMiAhPSBwcClcbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLlBvaW50T25MaW5lU2VnbWVudCA9IGZ1bmN0aW9uIChwdCwgbGluZVB0MSwgbGluZVB0MiwgVXNlRnVsbFJhbmdlKVxuICB7XG4gICAgaWYgKFVzZUZ1bGxSYW5nZSlcbiAgICAgIHJldHVybiAoKHB0LlggPT0gbGluZVB0MS5YKSAmJiAocHQuWSA9PSBsaW5lUHQxLlkpKSB8fFxuICAgICAgICAoKHB0LlggPT0gbGluZVB0Mi5YKSAmJiAocHQuWSA9PSBsaW5lUHQyLlkpKSB8fFxuICAgICAgICAoKChwdC5YID4gbGluZVB0MS5YKSA9PSAocHQuWCA8IGxpbmVQdDIuWCkpICYmXG4gICAgICAgICgocHQuWSA+IGxpbmVQdDEuWSkgPT0gKHB0LlkgPCBsaW5lUHQyLlkpKSAmJlxuICAgICAgICAoSW50MTI4Lm9wX0VxdWFsaXR5KEludDEyOC5JbnQxMjhNdWwoKHB0LlggLSBsaW5lUHQxLlgpLCAobGluZVB0Mi5ZIC0gbGluZVB0MS5ZKSksXG4gICAgICAgICAgSW50MTI4LkludDEyOE11bCgobGluZVB0Mi5YIC0gbGluZVB0MS5YKSwgKHB0LlkgLSBsaW5lUHQxLlkpKSkpKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gKChwdC5YID09IGxpbmVQdDEuWCkgJiYgKHB0LlkgPT0gbGluZVB0MS5ZKSkgfHwgKChwdC5YID09IGxpbmVQdDIuWCkgJiYgKHB0LlkgPT0gbGluZVB0Mi5ZKSkgfHwgKCgocHQuWCA+IGxpbmVQdDEuWCkgPT0gKHB0LlggPCBsaW5lUHQyLlgpKSAmJiAoKHB0LlkgPiBsaW5lUHQxLlkpID09IChwdC5ZIDwgbGluZVB0Mi5ZKSkgJiYgKChwdC5YIC0gbGluZVB0MS5YKSAqIChsaW5lUHQyLlkgLSBsaW5lUHQxLlkpID09IChsaW5lUHQyLlggLSBsaW5lUHQxLlgpICogKHB0LlkgLSBsaW5lUHQxLlkpKSk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLlBvaW50T25Qb2x5Z29uID0gZnVuY3Rpb24gKHB0LCBwcCwgVXNlRnVsbFJhbmdlKVxuICB7XG4gICAgdmFyIHBwMiA9IHBwO1xuICAgIHdoaWxlICh0cnVlKVxuICAgIHtcbiAgICAgIGlmICh0aGlzLlBvaW50T25MaW5lU2VnbWVudChwdCwgcHAyLlB0LCBwcDIuTmV4dC5QdCwgVXNlRnVsbFJhbmdlKSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBwcDIgPSBwcDIuTmV4dDtcbiAgICAgIGlmIChwcDIgPT0gcHApXG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLlNsb3Blc0VxdWFsID0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5TbG9wZXNFcXVhbCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB2YXIgYSA9IGFyZ3VtZW50cyxcbiAgICAgIGFsZW4gPSBhLmxlbmd0aDtcbiAgICB2YXIgZTEsIGUyLCBwdDEsIHB0MiwgcHQzLCBwdDQsIFVzZUZ1bGxSYW5nZTtcbiAgICBpZiAoYWxlbiA9PSAzKSAvLyBmdW5jdGlvbiAoZTEsIGUyLCBVc2VGdWxsUmFuZ2UpXG4gICAge1xuICAgICAgZTEgPSBhWzBdO1xuICAgICAgZTIgPSBhWzFdO1xuICAgICAgVXNlRnVsbFJhbmdlID0gYVsyXTtcbiAgICAgIGlmIChVc2VGdWxsUmFuZ2UpXG4gICAgICAgIHJldHVybiBJbnQxMjgub3BfRXF1YWxpdHkoSW50MTI4LkludDEyOE11bChlMS5EZWx0YS5ZLCBlMi5EZWx0YS5YKSwgSW50MTI4LkludDEyOE11bChlMS5EZWx0YS5YLCBlMi5EZWx0YS5ZKSk7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBDbGlwcGVyTGliLkNhc3RfSW50NjQoKGUxLkRlbHRhLlkpICogKGUyLkRlbHRhLlgpKSA9PSBDbGlwcGVyTGliLkNhc3RfSW50NjQoKGUxLkRlbHRhLlgpICogKGUyLkRlbHRhLlkpKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoYWxlbiA9PSA0KSAvLyBmdW5jdGlvbiAocHQxLCBwdDIsIHB0MywgVXNlRnVsbFJhbmdlKVxuICAgIHtcbiAgICAgIHB0MSA9IGFbMF07XG4gICAgICBwdDIgPSBhWzFdO1xuICAgICAgcHQzID0gYVsyXTtcbiAgICAgIFVzZUZ1bGxSYW5nZSA9IGFbM107XG4gICAgICBpZiAoVXNlRnVsbFJhbmdlKVxuICAgICAgICByZXR1cm4gSW50MTI4Lm9wX0VxdWFsaXR5KEludDEyOC5JbnQxMjhNdWwocHQxLlkgLSBwdDIuWSwgcHQyLlggLSBwdDMuWCksIEludDEyOC5JbnQxMjhNdWwocHQxLlggLSBwdDIuWCwgcHQyLlkgLSBwdDMuWSkpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gQ2xpcHBlckxpYi5DYXN0X0ludDY0KChwdDEuWSAtIHB0Mi5ZKSAqIChwdDIuWCAtIHB0My5YKSkgLSBDbGlwcGVyTGliLkNhc3RfSW50NjQoKHB0MS5YIC0gcHQyLlgpICogKHB0Mi5ZIC0gcHQzLlkpKSA9PT0gMDtcbiAgICB9XG4gICAgZWxzZSAvLyBmdW5jdGlvbiAocHQxLCBwdDIsIHB0MywgcHQ0LCBVc2VGdWxsUmFuZ2UpXG4gICAge1xuICAgICAgcHQxID0gYVswXTtcbiAgICAgIHB0MiA9IGFbMV07XG4gICAgICBwdDMgPSBhWzJdO1xuICAgICAgcHQ0ID0gYVszXTtcbiAgICAgIFVzZUZ1bGxSYW5nZSA9IGFbNF07XG4gICAgICBpZiAoVXNlRnVsbFJhbmdlKVxuICAgICAgICByZXR1cm4gSW50MTI4Lm9wX0VxdWFsaXR5KEludDEyOC5JbnQxMjhNdWwocHQxLlkgLSBwdDIuWSwgcHQzLlggLSBwdDQuWCksIEludDEyOC5JbnQxMjhNdWwocHQxLlggLSBwdDIuWCwgcHQzLlkgLSBwdDQuWSkpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gQ2xpcHBlckxpYi5DYXN0X0ludDY0KChwdDEuWSAtIHB0Mi5ZKSAqIChwdDMuWCAtIHB0NC5YKSkgLSBDbGlwcGVyTGliLkNhc3RfSW50NjQoKHB0MS5YIC0gcHQyLlgpICogKHB0My5ZIC0gcHQ0LlkpKSA9PT0gMDtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2xvcGVzRXF1YWwzID0gZnVuY3Rpb24gKGUxLCBlMiwgVXNlRnVsbFJhbmdlKVxuICB7XG4gICAgaWYgKFVzZUZ1bGxSYW5nZSlcbiAgICAgIHJldHVybiBJbnQxMjgub3BfRXF1YWxpdHkoSW50MTI4LkludDEyOE11bChlMS5EZWx0YS5ZLCBlMi5EZWx0YS5YKSwgSW50MTI4LkludDEyOE11bChlMS5EZWx0YS5YLCBlMi5EZWx0YS5ZKSk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIENsaXBwZXJMaWIuQ2FzdF9JbnQ2NCgoZTEuRGVsdGEuWSkgKiAoZTIuRGVsdGEuWCkpID09IENsaXBwZXJMaWIuQ2FzdF9JbnQ2NCgoZTEuRGVsdGEuWCkgKiAoZTIuRGVsdGEuWSkpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNsb3Blc0VxdWFsNCA9IGZ1bmN0aW9uIChwdDEsIHB0MiwgcHQzLCBVc2VGdWxsUmFuZ2UpXG4gIHtcbiAgICBpZiAoVXNlRnVsbFJhbmdlKVxuICAgICAgcmV0dXJuIEludDEyOC5vcF9FcXVhbGl0eShJbnQxMjguSW50MTI4TXVsKHB0MS5ZIC0gcHQyLlksIHB0Mi5YIC0gcHQzLlgpLCBJbnQxMjguSW50MTI4TXVsKHB0MS5YIC0gcHQyLlgsIHB0Mi5ZIC0gcHQzLlkpKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gQ2xpcHBlckxpYi5DYXN0X0ludDY0KChwdDEuWSAtIHB0Mi5ZKSAqIChwdDIuWCAtIHB0My5YKSkgLSBDbGlwcGVyTGliLkNhc3RfSW50NjQoKHB0MS5YIC0gcHQyLlgpICogKHB0Mi5ZIC0gcHQzLlkpKSA9PT0gMDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5TbG9wZXNFcXVhbDUgPSBmdW5jdGlvbiAocHQxLCBwdDIsIHB0MywgcHQ0LCBVc2VGdWxsUmFuZ2UpXG4gIHtcbiAgICBpZiAoVXNlRnVsbFJhbmdlKVxuICAgICAgcmV0dXJuIEludDEyOC5vcF9FcXVhbGl0eShJbnQxMjguSW50MTI4TXVsKHB0MS5ZIC0gcHQyLlksIHB0My5YIC0gcHQ0LlgpLCBJbnQxMjguSW50MTI4TXVsKHB0MS5YIC0gcHQyLlgsIHB0My5ZIC0gcHQ0LlkpKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gQ2xpcHBlckxpYi5DYXN0X0ludDY0KChwdDEuWSAtIHB0Mi5ZKSAqIChwdDMuWCAtIHB0NC5YKSkgLSBDbGlwcGVyTGliLkNhc3RfSW50NjQoKHB0MS5YIC0gcHQyLlgpICogKHB0My5ZIC0gcHQ0LlkpKSA9PT0gMDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuQ2xlYXIgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdGhpcy5EaXNwb3NlTG9jYWxNaW5pbWFMaXN0KCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlsZW4gPSB0aGlzLm1fZWRnZXMubGVuZ3RoOyBpIDwgaWxlbjsgKytpKVxuICAgIHtcbiAgICAgIGZvciAodmFyIGogPSAwLCBqbGVuID0gdGhpcy5tX2VkZ2VzW2ldLmxlbmd0aDsgaiA8IGpsZW47ICsrailcbiAgICAgICAgdGhpcy5tX2VkZ2VzW2ldW2pdID0gbnVsbDtcbiAgICAgIENsaXBwZXJMaWIuQ2xlYXIodGhpcy5tX2VkZ2VzW2ldKTtcbiAgICB9XG4gICAgQ2xpcHBlckxpYi5DbGVhcih0aGlzLm1fZWRnZXMpO1xuICAgIHRoaXMubV9Vc2VGdWxsUmFuZ2UgPSBmYWxzZTtcbiAgICB0aGlzLm1fSGFzT3BlblBhdGhzID0gZmFsc2U7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLkRpc3Bvc2VMb2NhbE1pbmltYUxpc3QgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgd2hpbGUgKHRoaXMubV9NaW5pbWFMaXN0ICE9PSBudWxsKVxuICAgIHtcbiAgICAgIHZhciB0bXBMbSA9IHRoaXMubV9NaW5pbWFMaXN0Lk5leHQ7XG4gICAgICB0aGlzLm1fTWluaW1hTGlzdCA9IG51bGw7XG4gICAgICB0aGlzLm1fTWluaW1hTGlzdCA9IHRtcExtO1xuICAgIH1cbiAgICB0aGlzLm1fQ3VycmVudExNID0gbnVsbDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuUmFuZ2VUZXN0ID0gZnVuY3Rpb24gKFB0LCB1c2VGdWxsUmFuZ2UpXG4gIHtcbiAgICBpZiAodXNlRnVsbFJhbmdlLlZhbHVlKVxuICAgIHtcbiAgICAgIGlmIChQdC5YID4gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5oaVJhbmdlIHx8IFB0LlkgPiBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhpUmFuZ2UgfHwgLVB0LlggPiBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhpUmFuZ2UgfHwgLVB0LlkgPiBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhpUmFuZ2UpXG4gICAgICAgIENsaXBwZXJMaWIuRXJyb3IoXCJDb29yZGluYXRlIG91dHNpZGUgYWxsb3dlZCByYW5nZSBpbiBSYW5nZVRlc3QoKS5cIik7XG4gICAgfVxuICAgIGVsc2UgaWYgKFB0LlggPiBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmxvUmFuZ2UgfHwgUHQuWSA+IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UubG9SYW5nZSB8fCAtUHQuWCA+IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UubG9SYW5nZSB8fCAtUHQuWSA+IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UubG9SYW5nZSlcbiAgICB7XG4gICAgICB1c2VGdWxsUmFuZ2UuVmFsdWUgPSB0cnVlO1xuICAgICAgdGhpcy5SYW5nZVRlc3QoUHQsIHVzZUZ1bGxSYW5nZSk7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5Jbml0RWRnZSA9IGZ1bmN0aW9uIChlLCBlTmV4dCwgZVByZXYsIHB0KVxuICB7XG4gICAgZS5OZXh0ID0gZU5leHQ7XG4gICAgZS5QcmV2ID0gZVByZXY7XG4gICAgLy9lLkN1cnIgPSBwdDtcbiAgICBlLkN1cnIuWCA9IHB0Llg7XG4gICAgZS5DdXJyLlkgPSBwdC5ZO1xuICAgIGUuT3V0SWR4ID0gLTE7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLkluaXRFZGdlMiA9IGZ1bmN0aW9uIChlLCBwb2x5VHlwZSlcbiAge1xuICAgIGlmIChlLkN1cnIuWSA+PSBlLk5leHQuQ3Vyci5ZKVxuICAgIHtcbiAgICAgIC8vZS5Cb3QgPSBlLkN1cnI7XG4gICAgICBlLkJvdC5YID0gZS5DdXJyLlg7XG4gICAgICBlLkJvdC5ZID0gZS5DdXJyLlk7XG4gICAgICAvL2UuVG9wID0gZS5OZXh0LkN1cnI7XG4gICAgICBlLlRvcC5YID0gZS5OZXh0LkN1cnIuWDtcbiAgICAgIGUuVG9wLlkgPSBlLk5leHQuQ3Vyci5ZO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgLy9lLlRvcCA9IGUuQ3VycjtcbiAgICAgIGUuVG9wLlggPSBlLkN1cnIuWDtcbiAgICAgIGUuVG9wLlkgPSBlLkN1cnIuWTtcbiAgICAgIC8vZS5Cb3QgPSBlLk5leHQuQ3VycjtcbiAgICAgIGUuQm90LlggPSBlLk5leHQuQ3Vyci5YO1xuICAgICAgZS5Cb3QuWSA9IGUuTmV4dC5DdXJyLlk7XG4gICAgfVxuICAgIHRoaXMuU2V0RHgoZSk7XG4gICAgZS5Qb2x5VHlwID0gcG9seVR5cGU7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLkZpbmROZXh0TG9jTWluID0gZnVuY3Rpb24gKEUpXG4gIHtcbiAgICB2YXIgRTI7XG4gICAgZm9yICg7OylcbiAgICB7XG4gICAgICB3aGlsZSAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9JbmVxdWFsaXR5KEUuQm90LCBFLlByZXYuQm90KSB8fCBDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KEUuQ3VyciwgRS5Ub3ApKVxuICAgICAgICBFID0gRS5OZXh0O1xuICAgICAgaWYgKEUuRHggIT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsICYmIEUuUHJldi5EeCAhPSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWwpXG4gICAgICAgIGJyZWFrO1xuICAgICAgd2hpbGUgKEUuUHJldi5EeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWwpXG4gICAgICAgIEUgPSBFLlByZXY7XG4gICAgICBFMiA9IEU7XG4gICAgICB3aGlsZSAoRS5EeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWwpXG4gICAgICAgIEUgPSBFLk5leHQ7XG4gICAgICBpZiAoRS5Ub3AuWSA9PSBFLlByZXYuQm90LlkpXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgLy9pZSBqdXN0IGFuIGludGVybWVkaWF0ZSBob3J6LlxuICAgICAgaWYgKEUyLlByZXYuQm90LlggPCBFLkJvdC5YKVxuICAgICAgICBFID0gRTI7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIEU7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLlByb2Nlc3NCb3VuZCA9IGZ1bmN0aW9uIChFLCBMZWZ0Qm91bmRJc0ZvcndhcmQpXG4gIHtcbiAgICB2YXIgRVN0YXJ0O1xuICAgIHZhciBSZXN1bHQgPSBFO1xuICAgIHZhciBIb3J6O1xuXG4gICAgICBpZiAoUmVzdWx0Lk91dElkeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNraXApXG4gICAgICB7XG4gICAgICAgIC8vY2hlY2sgaWYgdGhlcmUgYXJlIGVkZ2VzIGJleW9uZCB0aGUgc2tpcCBlZGdlIGluIHRoZSBib3VuZCBhbmQgaWYgc29cbiAgICAgICAgLy9jcmVhdGUgYW5vdGhlciBMb2NNaW4gYW5kIGNhbGxpbmcgUHJvY2Vzc0JvdW5kIG9uY2UgbW9yZSAuLi5cbiAgICAgICAgRSA9IFJlc3VsdDtcbiAgICAgICAgaWYgKExlZnRCb3VuZElzRm9yd2FyZClcbiAgICAgICAge1xuICAgICAgICAgIHdoaWxlIChFLlRvcC5ZID09IEUuTmV4dC5Cb3QuWSkgRSA9IEUuTmV4dDtcbiAgICAgICAgICB3aGlsZSAoRSAhPSBSZXN1bHQgJiYgRS5EeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWwpIEUgPSBFLlByZXY7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgd2hpbGUgKEUuVG9wLlkgPT0gRS5QcmV2LkJvdC5ZKSBFID0gRS5QcmV2O1xuICAgICAgICAgIHdoaWxlIChFICE9IFJlc3VsdCAmJiBFLkR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbCkgRSA9IEUuTmV4dDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoRSA9PSBSZXN1bHQpXG4gICAgICAgIHtcbiAgICAgICAgICBpZiAoTGVmdEJvdW5kSXNGb3J3YXJkKSBSZXN1bHQgPSBFLk5leHQ7XG4gICAgICAgICAgZWxzZSBSZXN1bHQgPSBFLlByZXY7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgLy90aGVyZSBhcmUgbW9yZSBlZGdlcyBpbiB0aGUgYm91bmQgYmV5b25kIHJlc3VsdCBzdGFydGluZyB3aXRoIEVcbiAgICAgICAgICBpZiAoTGVmdEJvdW5kSXNGb3J3YXJkKVxuICAgICAgICAgICAgRSA9IFJlc3VsdC5OZXh0O1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIEUgPSBSZXN1bHQuUHJldjtcbiAgICAgICAgICB2YXIgbG9jTWluID0gbmV3IENsaXBwZXJMaWIuTG9jYWxNaW5pbWEoKTtcbiAgICAgICAgICBsb2NNaW4uTmV4dCA9IG51bGw7XG4gICAgICAgICAgbG9jTWluLlkgPSBFLkJvdC5ZO1xuICAgICAgICAgIGxvY01pbi5MZWZ0Qm91bmQgPSBudWxsO1xuICAgICAgICAgIGxvY01pbi5SaWdodEJvdW5kID0gRTtcbiAgICAgICAgICBFLldpbmREZWx0YSA9IDA7XG4gICAgICAgICAgUmVzdWx0ID0gdGhpcy5Qcm9jZXNzQm91bmQoRSwgTGVmdEJvdW5kSXNGb3J3YXJkKTtcbiAgICAgICAgICB0aGlzLkluc2VydExvY2FsTWluaW1hKGxvY01pbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgaWYgKEUuRHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsKVxuICAgICAge1xuICAgICAgICAvL1dlIG5lZWQgdG8gYmUgY2FyZWZ1bCB3aXRoIG9wZW4gcGF0aHMgYmVjYXVzZSB0aGlzIG1heSBub3QgYmUgYVxuICAgICAgICAvL3RydWUgbG9jYWwgbWluaW1hIChpZSBFIG1heSBiZSBmb2xsb3dpbmcgYSBza2lwIGVkZ2UpLlxuICAgICAgICAvL0Fsc28sIGNvbnNlY3V0aXZlIGhvcnouIGVkZ2VzIG1heSBzdGFydCBoZWFkaW5nIGxlZnQgYmVmb3JlIGdvaW5nIHJpZ2h0LlxuICAgICAgICBpZiAoTGVmdEJvdW5kSXNGb3J3YXJkKSBFU3RhcnQgPSBFLlByZXY7XG4gICAgICAgIGVsc2UgRVN0YXJ0ID0gRS5OZXh0O1xuICAgICAgICBpZiAoRVN0YXJ0Lk91dElkeCAhPSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNraXApXG4gICAgICAgIHtcbiAgICAgICAgICBpZiAoRVN0YXJ0LkR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbCkgLy9pZSBhbiBhZGpvaW5pbmcgaG9yaXpvbnRhbCBza2lwIGVkZ2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpZiAoRVN0YXJ0LkJvdC5YICE9IEUuQm90LlggJiYgRVN0YXJ0LlRvcC5YICE9IEUuQm90LlgpXG4gICAgICAgICAgICAgIHRoaXMuUmV2ZXJzZUhvcml6b250YWwoRSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKEVTdGFydC5Cb3QuWCAhPSBFLkJvdC5YKVxuICAgICAgICAgICAgdGhpcy5SZXZlcnNlSG9yaXpvbnRhbChFKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBFU3RhcnQgPSBFO1xuICAgICAgaWYgKExlZnRCb3VuZElzRm9yd2FyZClcbiAgICAgIHtcbiAgICAgICAgd2hpbGUgKFJlc3VsdC5Ub3AuWSA9PSBSZXN1bHQuTmV4dC5Cb3QuWSAmJiBSZXN1bHQuTmV4dC5PdXRJZHggIT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Ta2lwKVxuICAgICAgICAgIFJlc3VsdCA9IFJlc3VsdC5OZXh0O1xuICAgICAgICBpZiAoUmVzdWx0LkR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbCAmJiBSZXN1bHQuTmV4dC5PdXRJZHggIT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Ta2lwKVxuICAgICAgICB7XG4gICAgICAgICAgLy9uYjogYXQgdGhlIHRvcCBvZiBhIGJvdW5kLCBob3Jpem9udGFscyBhcmUgYWRkZWQgdG8gdGhlIGJvdW5kXG4gICAgICAgICAgLy9vbmx5IHdoZW4gdGhlIHByZWNlZGluZyBlZGdlIGF0dGFjaGVzIHRvIHRoZSBob3Jpem9udGFsJ3MgbGVmdCB2ZXJ0ZXhcbiAgICAgICAgICAvL3VubGVzcyBhIFNraXAgZWRnZSBpcyBlbmNvdW50ZXJlZCB3aGVuIHRoYXQgYmVjb21lcyB0aGUgdG9wIGRpdmlkZVxuICAgICAgICAgIEhvcnogPSBSZXN1bHQ7XG4gICAgICAgICAgd2hpbGUgKEhvcnouUHJldi5EeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWwpXG4gICAgICAgICAgICBIb3J6ID0gSG9yei5QcmV2O1xuICAgICAgICAgIGlmIChIb3J6LlByZXYuVG9wLlggPT0gUmVzdWx0Lk5leHQuVG9wLlgpXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWYgKCFMZWZ0Qm91bmRJc0ZvcndhcmQpXG4gICAgICAgICAgICAgIFJlc3VsdCA9IEhvcnouUHJldjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoSG9yei5QcmV2LlRvcC5YID4gUmVzdWx0Lk5leHQuVG9wLlgpXG4gICAgICAgICAgICBSZXN1bHQgPSBIb3J6LlByZXY7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKEUgIT0gUmVzdWx0KVxuICAgICAgICB7XG4gICAgICAgICAgRS5OZXh0SW5MTUwgPSBFLk5leHQ7XG4gICAgICAgICAgaWYgKEUuRHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsICYmIEUgIT0gRVN0YXJ0ICYmIEUuQm90LlggIT0gRS5QcmV2LlRvcC5YKVxuICAgICAgICAgICAgdGhpcy5SZXZlcnNlSG9yaXpvbnRhbChFKTtcbiAgICAgICAgICBFID0gRS5OZXh0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChFLkR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbCAmJiBFICE9IEVTdGFydCAmJiBFLkJvdC5YICE9IEUuUHJldi5Ub3AuWClcbiAgICAgICAgICB0aGlzLlJldmVyc2VIb3Jpem9udGFsKEUpO1xuICAgICAgICBSZXN1bHQgPSBSZXN1bHQuTmV4dDtcbiAgICAgICAgLy9tb3ZlIHRvIHRoZSBlZGdlIGp1c3QgYmV5b25kIGN1cnJlbnQgYm91bmRcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgd2hpbGUgKFJlc3VsdC5Ub3AuWSA9PSBSZXN1bHQuUHJldi5Cb3QuWSAmJiBSZXN1bHQuUHJldi5PdXRJZHggIT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Ta2lwKVxuICAgICAgICAgIFJlc3VsdCA9IFJlc3VsdC5QcmV2O1xuICAgICAgICBpZiAoUmVzdWx0LkR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbCAmJiBSZXN1bHQuUHJldi5PdXRJZHggIT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Ta2lwKVxuICAgICAgICB7XG4gICAgICAgICAgSG9yeiA9IFJlc3VsdDtcbiAgICAgICAgICB3aGlsZSAoSG9yei5OZXh0LkR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbClcbiAgICAgICAgICAgIEhvcnogPSBIb3J6Lk5leHQ7XG4gICAgICAgICAgaWYgKEhvcnouTmV4dC5Ub3AuWCA9PSBSZXN1bHQuUHJldi5Ub3AuWClcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpZiAoIUxlZnRCb3VuZElzRm9yd2FyZClcbiAgICAgICAgICAgICAgUmVzdWx0ID0gSG9yei5OZXh0O1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChIb3J6Lk5leHQuVG9wLlggPiBSZXN1bHQuUHJldi5Ub3AuWClcbiAgICAgICAgICAgIFJlc3VsdCA9IEhvcnouTmV4dDtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoRSAhPSBSZXN1bHQpXG4gICAgICAgIHtcbiAgICAgICAgICBFLk5leHRJbkxNTCA9IEUuUHJldjtcbiAgICAgICAgICBpZiAoRS5EeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWwgJiYgRSAhPSBFU3RhcnQgJiYgRS5Cb3QuWCAhPSBFLk5leHQuVG9wLlgpXG4gICAgICAgICAgICB0aGlzLlJldmVyc2VIb3Jpem9udGFsKEUpO1xuICAgICAgICAgIEUgPSBFLlByZXY7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEUuRHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsICYmIEUgIT0gRVN0YXJ0ICYmIEUuQm90LlggIT0gRS5OZXh0LlRvcC5YKVxuICAgICAgICAgIHRoaXMuUmV2ZXJzZUhvcml6b250YWwoRSk7XG4gICAgICAgIFJlc3VsdCA9IFJlc3VsdC5QcmV2O1xuICAgICAgICAvL21vdmUgdG8gdGhlIGVkZ2UganVzdCBiZXlvbmQgY3VycmVudCBib3VuZFxuICAgICAgfVxuXG4gICAgcmV0dXJuIFJlc3VsdDtcbiAgfTtcblxuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5BZGRQYXRoID0gZnVuY3Rpb24gKHBnLCBwb2x5VHlwZSwgQ2xvc2VkKVxuICB7XG4gICAgaWYgKHVzZV9saW5lcylcbiAgICB7XG4gICAgICBpZiAoIUNsb3NlZCAmJiBwb2x5VHlwZSA9PSBDbGlwcGVyTGliLlBvbHlUeXBlLnB0Q2xpcClcbiAgICAgICAgQ2xpcHBlckxpYi5FcnJvcihcIkFkZFBhdGg6IE9wZW4gcGF0aHMgbXVzdCBiZSBzdWJqZWN0LlwiKTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIGlmICghQ2xvc2VkKVxuICAgICAgICBDbGlwcGVyTGliLkVycm9yKFwiQWRkUGF0aDogT3BlbiBwYXRocyBoYXZlIGJlZW4gZGlzYWJsZWQuXCIpO1xuICAgIH1cbiAgICB2YXIgaGlnaEkgPSBwZy5sZW5ndGggLSAxO1xuICAgIGlmIChDbG9zZWQpXG4gICAgICB3aGlsZSAoaGlnaEkgPiAwICYmIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHBnW2hpZ2hJXSwgcGdbMF0pKSlcbiAgICAtLWhpZ2hJO1xuICAgIHdoaWxlIChoaWdoSSA+IDAgJiYgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocGdbaGlnaEldLCBwZ1toaWdoSSAtIDFdKSkpXG4gICAgLS1oaWdoSTtcbiAgICBpZiAoKENsb3NlZCAmJiBoaWdoSSA8IDIpIHx8ICghQ2xvc2VkICYmIGhpZ2hJIDwgMSkpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgLy9jcmVhdGUgYSBuZXcgZWRnZSBhcnJheSAuLi5cbiAgICB2YXIgZWRnZXMgPSBuZXcgQXJyYXkoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBoaWdoSTsgaSsrKVxuICAgICAgZWRnZXMucHVzaChuZXcgQ2xpcHBlckxpYi5URWRnZSgpKTtcbiAgICB2YXIgSXNGbGF0ID0gdHJ1ZTtcbiAgICAvLzEuIEJhc2ljIChmaXJzdCkgZWRnZSBpbml0aWFsaXphdGlvbiAuLi5cblxuICAgIC8vZWRnZXNbMV0uQ3VyciA9IHBnWzFdO1xuICAgIGVkZ2VzWzFdLkN1cnIuWCA9IHBnWzFdLlg7XG4gICAgZWRnZXNbMV0uQ3Vyci5ZID0gcGdbMV0uWTtcblxuICAgIHZhciAkMSA9IHtWYWx1ZTogdGhpcy5tX1VzZUZ1bGxSYW5nZX07XG4gICAgdGhpcy5SYW5nZVRlc3QocGdbMF0sICQxKTtcbiAgICB0aGlzLm1fVXNlRnVsbFJhbmdlID0gJDEuVmFsdWU7XG5cbiAgICAkMS5WYWx1ZSA9IHRoaXMubV9Vc2VGdWxsUmFuZ2U7XG4gICAgdGhpcy5SYW5nZVRlc3QocGdbaGlnaEldLCAkMSk7XG4gICAgdGhpcy5tX1VzZUZ1bGxSYW5nZSA9ICQxLlZhbHVlO1xuXG4gICAgdGhpcy5Jbml0RWRnZShlZGdlc1swXSwgZWRnZXNbMV0sIGVkZ2VzW2hpZ2hJXSwgcGdbMF0pO1xuICAgIHRoaXMuSW5pdEVkZ2UoZWRnZXNbaGlnaEldLCBlZGdlc1swXSwgZWRnZXNbaGlnaEkgLSAxXSwgcGdbaGlnaEldKTtcbiAgICBmb3IgKHZhciBpID0gaGlnaEkgLSAxOyBpID49IDE7IC0taSlcbiAgICB7XG4gICAgICAkMS5WYWx1ZSA9IHRoaXMubV9Vc2VGdWxsUmFuZ2U7XG4gICAgICB0aGlzLlJhbmdlVGVzdChwZ1tpXSwgJDEpO1xuICAgICAgdGhpcy5tX1VzZUZ1bGxSYW5nZSA9ICQxLlZhbHVlO1xuXG4gICAgICB0aGlzLkluaXRFZGdlKGVkZ2VzW2ldLCBlZGdlc1tpICsgMV0sIGVkZ2VzW2kgLSAxXSwgcGdbaV0pO1xuICAgIH1cblxuICAgIHZhciBlU3RhcnQgPSBlZGdlc1swXTtcbiAgICAvLzIuIFJlbW92ZSBkdXBsaWNhdGUgdmVydGljZXMsIGFuZCAod2hlbiBjbG9zZWQpIGNvbGxpbmVhciBlZGdlcyAuLi5cbiAgICB2YXIgRSA9IGVTdGFydCxcbiAgICAgIGVMb29wU3RvcCA9IGVTdGFydDtcbiAgICBmb3IgKDs7KVxuICAgIHtcbiAgICAvL2NvbnNvbGUubG9nKEUuTmV4dCwgZVN0YXJ0KTtcbiAgICBcdC8vbmI6IGFsbG93cyBtYXRjaGluZyBzdGFydCBhbmQgZW5kIHBvaW50cyB3aGVuIG5vdCBDbG9zZWQgLi4uXG4gICAgICBpZiAoRS5DdXJyID09IEUuTmV4dC5DdXJyICYmIChDbG9zZWQgfHwgRS5OZXh0ICE9IGVTdGFydCkpXG4gICAgICB7XG4gICAgICAgIGlmIChFID09IEUuTmV4dClcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgaWYgKEUgPT0gZVN0YXJ0KVxuICAgICAgICAgIGVTdGFydCA9IEUuTmV4dDtcbiAgICAgICAgRSA9IHRoaXMuUmVtb3ZlRWRnZShFKTtcbiAgICAgICAgZUxvb3BTdG9wID0gRTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoRS5QcmV2ID09IEUuTmV4dClcbiAgICAgICAgYnJlYWs7XG4gICAgICBlbHNlIGlmIChDbG9zZWQgJiYgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5TbG9wZXNFcXVhbChFLlByZXYuQ3VyciwgRS5DdXJyLCBFLk5leHQuQ3VyciwgdGhpcy5tX1VzZUZ1bGxSYW5nZSkgJiYgKCF0aGlzLlByZXNlcnZlQ29sbGluZWFyIHx8ICF0aGlzLlB0MklzQmV0d2VlblB0MUFuZFB0MyhFLlByZXYuQ3VyciwgRS5DdXJyLCBFLk5leHQuQ3VycikpKVxuICAgICAge1xuICAgICAgICAvL0NvbGxpbmVhciBlZGdlcyBhcmUgYWxsb3dlZCBmb3Igb3BlbiBwYXRocyBidXQgaW4gY2xvc2VkIHBhdGhzXG4gICAgICAgIC8vdGhlIGRlZmF1bHQgaXMgdG8gbWVyZ2UgYWRqYWNlbnQgY29sbGluZWFyIGVkZ2VzIGludG8gYSBzaW5nbGUgZWRnZS5cbiAgICAgICAgLy9Ib3dldmVyLCBpZiB0aGUgUHJlc2VydmVDb2xsaW5lYXIgcHJvcGVydHkgaXMgZW5hYmxlZCwgb25seSBvdmVybGFwcGluZ1xuICAgICAgICAvL2NvbGxpbmVhciBlZGdlcyAoaWUgc3Bpa2VzKSB3aWxsIGJlIHJlbW92ZWQgZnJvbSBjbG9zZWQgcGF0aHMuXG4gICAgICAgIGlmIChFID09IGVTdGFydClcbiAgICAgICAgICBlU3RhcnQgPSBFLk5leHQ7XG4gICAgICAgIEUgPSB0aGlzLlJlbW92ZUVkZ2UoRSk7XG4gICAgICAgIEUgPSBFLlByZXY7XG4gICAgICAgIGVMb29wU3RvcCA9IEU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgRSA9IEUuTmV4dDtcbiAgICAgIGlmICgoRSA9PSBlTG9vcFN0b3ApIHx8ICghQ2xvc2VkICYmIEUuTmV4dCA9PSBlU3RhcnQpKSBicmVhaztcbiAgICB9XG4gICAgaWYgKCghQ2xvc2VkICYmIChFID09IEUuTmV4dCkpIHx8IChDbG9zZWQgJiYgKEUuUHJldiA9PSBFLk5leHQpKSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBpZiAoIUNsb3NlZClcbiAgICB7XG4gICAgICB0aGlzLm1fSGFzT3BlblBhdGhzID0gdHJ1ZTtcbiAgICAgIGVTdGFydC5QcmV2Lk91dElkeCA9IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2tpcDtcbiAgICB9XG4gICAgLy8zLiBEbyBzZWNvbmQgc3RhZ2Ugb2YgZWRnZSBpbml0aWFsaXphdGlvbiAuLi5cbiAgICBFID0gZVN0YXJ0O1xuICAgIGRvIHtcbiAgICAgIHRoaXMuSW5pdEVkZ2UyKEUsIHBvbHlUeXBlKTtcbiAgICAgIEUgPSBFLk5leHQ7XG4gICAgICBpZiAoSXNGbGF0ICYmIEUuQ3Vyci5ZICE9IGVTdGFydC5DdXJyLlkpXG4gICAgICAgIElzRmxhdCA9IGZhbHNlO1xuICAgIH1cbiAgICB3aGlsZSAoRSAhPSBlU3RhcnQpXG4gICAgLy80LiBGaW5hbGx5LCBhZGQgZWRnZSBib3VuZHMgdG8gTG9jYWxNaW5pbWEgbGlzdCAuLi5cbiAgICAvL1RvdGFsbHkgZmxhdCBwYXRocyBtdXN0IGJlIGhhbmRsZWQgZGlmZmVyZW50bHkgd2hlbiBhZGRpbmcgdGhlbVxuICAgIC8vdG8gTG9jYWxNaW5pbWEgbGlzdCB0byBhdm9pZCBlbmRsZXNzIGxvb3BzIGV0YyAuLi5cbiAgICBpZiAoSXNGbGF0KVxuICAgIHtcbiAgICAgIGlmIChDbG9zZWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIEUuUHJldi5PdXRJZHggPSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNraXA7XG4gICAgICBpZiAoRS5QcmV2LkJvdC5YIDwgRS5QcmV2LlRvcC5YKVxuICAgICAgICB0aGlzLlJldmVyc2VIb3Jpem9udGFsKEUuUHJldik7XG4gICAgICB2YXIgbG9jTWluID0gbmV3IENsaXBwZXJMaWIuTG9jYWxNaW5pbWEoKTtcbiAgICAgIGxvY01pbi5OZXh0ID0gbnVsbDtcbiAgICAgIGxvY01pbi5ZID0gRS5Cb3QuWTtcbiAgICAgIGxvY01pbi5MZWZ0Qm91bmQgPSBudWxsO1xuICAgICAgbG9jTWluLlJpZ2h0Qm91bmQgPSBFO1xuICAgICAgbG9jTWluLlJpZ2h0Qm91bmQuU2lkZSA9IENsaXBwZXJMaWIuRWRnZVNpZGUuZXNSaWdodDtcbiAgICAgIGxvY01pbi5SaWdodEJvdW5kLldpbmREZWx0YSA9IDA7XG4gICAgICB3aGlsZSAoRS5OZXh0Lk91dElkeCAhPSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNraXApXG4gICAgICB7XG4gICAgICAgIEUuTmV4dEluTE1MID0gRS5OZXh0O1xuICAgICAgICBpZiAoRS5Cb3QuWCAhPSBFLlByZXYuVG9wLlgpXG4gICAgICAgICAgdGhpcy5SZXZlcnNlSG9yaXpvbnRhbChFKTtcbiAgICAgICAgRSA9IEUuTmV4dDtcbiAgICAgIH1cbiAgICAgIHRoaXMuSW5zZXJ0TG9jYWxNaW5pbWEobG9jTWluKTtcbiAgICAgIHRoaXMubV9lZGdlcy5wdXNoKGVkZ2VzKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICB0aGlzLm1fZWRnZXMucHVzaChlZGdlcyk7XG4gICAgdmFyIGxlZnRCb3VuZElzRm9yd2FyZDtcbiAgICB2YXIgRU1pbiA9IG51bGw7XG5cblx0XHQvL3dvcmthcm91bmQgdG8gYXZvaWQgYW4gZW5kbGVzcyBsb29wIGluIHRoZSB3aGlsZSBsb29wIGJlbG93IHdoZW5cbiAgICAvL29wZW4gcGF0aHMgaGF2ZSBtYXRjaGluZyBzdGFydCBhbmQgZW5kIHBvaW50cyAuLi5cbiAgICBpZihDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KEUuUHJldi5Cb3QsIEUuUHJldi5Ub3ApKVxuICAgIFx0RSA9IEUuTmV4dDtcblxuICAgIGZvciAoOzspXG4gICAge1xuICAgICAgRSA9IHRoaXMuRmluZE5leHRMb2NNaW4oRSk7XG4gICAgICBpZiAoRSA9PSBFTWluKVxuICAgICAgICBicmVhaztcbiAgICAgIGVsc2UgaWYgKEVNaW4gPT0gbnVsbClcbiAgICAgICAgRU1pbiA9IEU7XG4gICAgICAvL0UgYW5kIEUuUHJldiBub3cgc2hhcmUgYSBsb2NhbCBtaW5pbWEgKGxlZnQgYWxpZ25lZCBpZiBob3Jpem9udGFsKS5cbiAgICAgIC8vQ29tcGFyZSB0aGVpciBzbG9wZXMgdG8gZmluZCB3aGljaCBzdGFydHMgd2hpY2ggYm91bmQgLi4uXG4gICAgICB2YXIgbG9jTWluID0gbmV3IENsaXBwZXJMaWIuTG9jYWxNaW5pbWEoKTtcbiAgICAgIGxvY01pbi5OZXh0ID0gbnVsbDtcbiAgICAgIGxvY01pbi5ZID0gRS5Cb3QuWTtcbiAgICAgIGlmIChFLkR4IDwgRS5QcmV2LkR4KVxuICAgICAge1xuICAgICAgICBsb2NNaW4uTGVmdEJvdW5kID0gRS5QcmV2O1xuICAgICAgICBsb2NNaW4uUmlnaHRCb3VuZCA9IEU7XG4gICAgICAgIGxlZnRCb3VuZElzRm9yd2FyZCA9IGZhbHNlO1xuICAgICAgICAvL1EubmV4dEluTE1MID0gUS5wcmV2XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIGxvY01pbi5MZWZ0Qm91bmQgPSBFO1xuICAgICAgICBsb2NNaW4uUmlnaHRCb3VuZCA9IEUuUHJldjtcbiAgICAgICAgbGVmdEJvdW5kSXNGb3J3YXJkID0gdHJ1ZTtcbiAgICAgICAgLy9RLm5leHRJbkxNTCA9IFEubmV4dFxuICAgICAgfVxuICAgICAgbG9jTWluLkxlZnRCb3VuZC5TaWRlID0gQ2xpcHBlckxpYi5FZGdlU2lkZS5lc0xlZnQ7XG4gICAgICBsb2NNaW4uUmlnaHRCb3VuZC5TaWRlID0gQ2xpcHBlckxpYi5FZGdlU2lkZS5lc1JpZ2h0O1xuICAgICAgaWYgKCFDbG9zZWQpXG4gICAgICAgIGxvY01pbi5MZWZ0Qm91bmQuV2luZERlbHRhID0gMDtcbiAgICAgIGVsc2UgaWYgKGxvY01pbi5MZWZ0Qm91bmQuTmV4dCA9PSBsb2NNaW4uUmlnaHRCb3VuZClcbiAgICAgICAgbG9jTWluLkxlZnRCb3VuZC5XaW5kRGVsdGEgPSAtMTtcbiAgICAgIGVsc2VcbiAgICAgICAgbG9jTWluLkxlZnRCb3VuZC5XaW5kRGVsdGEgPSAxO1xuICAgICAgbG9jTWluLlJpZ2h0Qm91bmQuV2luZERlbHRhID0gLWxvY01pbi5MZWZ0Qm91bmQuV2luZERlbHRhO1xuICAgICAgRSA9IHRoaXMuUHJvY2Vzc0JvdW5kKGxvY01pbi5MZWZ0Qm91bmQsIGxlZnRCb3VuZElzRm9yd2FyZCk7XG4gICAgICBpZiAoRS5PdXRJZHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Ta2lwKVxuICAgICAgXHRFID0gdGhpcy5Qcm9jZXNzQm91bmQoRSwgbGVmdEJvdW5kSXNGb3J3YXJkKTtcbiAgICAgIHZhciBFMiA9IHRoaXMuUHJvY2Vzc0JvdW5kKGxvY01pbi5SaWdodEJvdW5kLCAhbGVmdEJvdW5kSXNGb3J3YXJkKTtcbiAgICAgIGlmIChFMi5PdXRJZHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Ta2lwKSBFMiA9IHRoaXMuUHJvY2Vzc0JvdW5kKEUyLCAhbGVmdEJvdW5kSXNGb3J3YXJkKTtcbiAgICAgIGlmIChsb2NNaW4uTGVmdEJvdW5kLk91dElkeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNraXApXG4gICAgICAgIGxvY01pbi5MZWZ0Qm91bmQgPSBudWxsO1xuICAgICAgZWxzZSBpZiAobG9jTWluLlJpZ2h0Qm91bmQuT3V0SWR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2tpcClcbiAgICAgICAgbG9jTWluLlJpZ2h0Qm91bmQgPSBudWxsO1xuICAgICAgdGhpcy5JbnNlcnRMb2NhbE1pbmltYShsb2NNaW4pO1xuICAgICAgaWYgKCFsZWZ0Qm91bmRJc0ZvcndhcmQpXG4gICAgICAgIEUgPSBFMjtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLkFkZFBhdGhzID0gZnVuY3Rpb24gKHBwZywgcG9seVR5cGUsIGNsb3NlZClcbiAge1xuICAgIC8vICBjb25zb2xlLmxvZyhcIi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cIik7XG4gICAgLy8gIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHBwZykpO1xuICAgIHZhciByZXN1bHQgPSBmYWxzZTtcbiAgICBmb3IgKHZhciBpID0gMCwgaWxlbiA9IHBwZy5sZW5ndGg7IGkgPCBpbGVuOyArK2kpXG4gICAgICBpZiAodGhpcy5BZGRQYXRoKHBwZ1tpXSwgcG9seVR5cGUsIGNsb3NlZCkpXG4gICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuUHQySXNCZXR3ZWVuUHQxQW5kUHQzID0gZnVuY3Rpb24gKHB0MSwgcHQyLCBwdDMpXG4gIHtcbiAgICBpZiAoKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocHQxLCBwdDMpKSB8fCAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwdDEsIHB0MikpIHx8ICAgICAgIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHB0MywgcHQyKSkpXG5cbiAgIC8vaWYgKChwdDEgPT0gcHQzKSB8fCAocHQxID09IHB0MikgfHwgKHB0MyA9PSBwdDIpKVxuICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgZWxzZSBpZiAocHQxLlggIT0gcHQzLlgpXG4gICAgICByZXR1cm4gKHB0Mi5YID4gcHQxLlgpID09IChwdDIuWCA8IHB0My5YKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gKHB0Mi5ZID4gcHQxLlkpID09IChwdDIuWSA8IHB0My5ZKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuUmVtb3ZlRWRnZSA9IGZ1bmN0aW9uIChlKVxuICB7XG4gICAgLy9yZW1vdmVzIGUgZnJvbSBkb3VibGVfbGlua2VkX2xpc3QgKGJ1dCB3aXRob3V0IHJlbW92aW5nIGZyb20gbWVtb3J5KVxuICAgIGUuUHJldi5OZXh0ID0gZS5OZXh0O1xuICAgIGUuTmV4dC5QcmV2ID0gZS5QcmV2O1xuICAgIHZhciByZXN1bHQgPSBlLk5leHQ7XG4gICAgZS5QcmV2ID0gbnVsbDsgLy9mbGFnIGFzIHJlbW92ZWQgKHNlZSBDbGlwcGVyQmFzZS5DbGVhcilcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5TZXREeCA9IGZ1bmN0aW9uIChlKVxuICB7XG4gICAgZS5EZWx0YS5YID0gKGUuVG9wLlggLSBlLkJvdC5YKTtcbiAgICBlLkRlbHRhLlkgPSAoZS5Ub3AuWSAtIGUuQm90LlkpO1xuICAgIGlmIChlLkRlbHRhLlkgPT09IDApIGUuRHggPSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWw7XG4gICAgZWxzZSBlLkR4ID0gKGUuRGVsdGEuWCkgLyAoZS5EZWx0YS5ZKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuSW5zZXJ0TG9jYWxNaW5pbWEgPSBmdW5jdGlvbiAobmV3TG0pXG4gIHtcbiAgICBpZiAodGhpcy5tX01pbmltYUxpc3QgPT09IG51bGwpXG4gICAge1xuICAgICAgdGhpcy5tX01pbmltYUxpc3QgPSBuZXdMbTtcbiAgICB9XG4gICAgZWxzZSBpZiAobmV3TG0uWSA+PSB0aGlzLm1fTWluaW1hTGlzdC5ZKVxuICAgIHtcbiAgICAgIG5ld0xtLk5leHQgPSB0aGlzLm1fTWluaW1hTGlzdDtcbiAgICAgIHRoaXMubV9NaW5pbWFMaXN0ID0gbmV3TG07XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICB2YXIgdG1wTG0gPSB0aGlzLm1fTWluaW1hTGlzdDtcbiAgICAgIHdoaWxlICh0bXBMbS5OZXh0ICE9PSBudWxsICYmIChuZXdMbS5ZIDwgdG1wTG0uTmV4dC5ZKSlcbiAgICAgICAgdG1wTG0gPSB0bXBMbS5OZXh0O1xuICAgICAgbmV3TG0uTmV4dCA9IHRtcExtLk5leHQ7XG4gICAgICB0bXBMbS5OZXh0ID0gbmV3TG07XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5Qb3BMb2NhbE1pbmltYSA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICBpZiAodGhpcy5tX0N1cnJlbnRMTSA9PT0gbnVsbClcbiAgICAgIHJldHVybjtcbiAgICB0aGlzLm1fQ3VycmVudExNID0gdGhpcy5tX0N1cnJlbnRMTS5OZXh0O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5SZXZlcnNlSG9yaXpvbnRhbCA9IGZ1bmN0aW9uIChlKVxuICB7XG4gICAgLy9zd2FwIGhvcml6b250YWwgZWRnZXMnIHRvcCBhbmQgYm90dG9tIHgncyBzbyB0aGV5IGZvbGxvdyB0aGUgbmF0dXJhbFxuICAgIC8vcHJvZ3Jlc3Npb24gb2YgdGhlIGJvdW5kcyAtIGllIHNvIHRoZWlyIHhib3RzIHdpbGwgYWxpZ24gd2l0aCB0aGVcbiAgICAvL2Fkam9pbmluZyBsb3dlciBlZGdlLiBbSGVscGZ1bCBpbiB0aGUgUHJvY2Vzc0hvcml6b250YWwoKSBtZXRob2QuXVxuICAgIHZhciB0bXAgPSBlLlRvcC5YO1xuICAgIGUuVG9wLlggPSBlLkJvdC5YO1xuICAgIGUuQm90LlggPSB0bXA7XG4gICAgaWYgKHVzZV94eXopXG4gICAge1xuICAgICAgdG1wID0gZS5Ub3AuWjtcbiAgICAgIGUuVG9wLlogPSBlLkJvdC5aO1xuICAgICAgZS5Cb3QuWiA9IHRtcDtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLlJlc2V0ID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHRoaXMubV9DdXJyZW50TE0gPSB0aGlzLm1fTWluaW1hTGlzdDtcbiAgICBpZiAodGhpcy5tX0N1cnJlbnRMTSA9PSBudWxsKVxuICAgICAgcmV0dXJuO1xuICAgIC8vaWUgbm90aGluZyB0byBwcm9jZXNzXG4gICAgLy9yZXNldCBhbGwgZWRnZXMgLi4uXG4gICAgdmFyIGxtID0gdGhpcy5tX01pbmltYUxpc3Q7XG4gICAgd2hpbGUgKGxtICE9IG51bGwpXG4gICAge1xuICAgICAgdmFyIGUgPSBsbS5MZWZ0Qm91bmQ7XG4gICAgICBpZiAoZSAhPSBudWxsKVxuICAgICAge1xuICAgICAgICAvL2UuQ3VyciA9IGUuQm90O1xuICAgICAgICBlLkN1cnIuWCA9IGUuQm90Llg7XG4gICAgICAgIGUuQ3Vyci5ZID0gZS5Cb3QuWTtcbiAgICAgICAgZS5TaWRlID0gQ2xpcHBlckxpYi5FZGdlU2lkZS5lc0xlZnQ7XG4gICAgICAgIGUuT3V0SWR4ID0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5VbmFzc2lnbmVkO1xuICAgICAgfVxuICAgICAgZSA9IGxtLlJpZ2h0Qm91bmQ7XG4gICAgICBpZiAoZSAhPSBudWxsKVxuICAgICAge1xuICAgICAgICAvL2UuQ3VyciA9IGUuQm90O1xuICAgICAgICBlLkN1cnIuWCA9IGUuQm90Llg7XG4gICAgICAgIGUuQ3Vyci5ZID0gZS5Cb3QuWTtcbiAgICAgICAgZS5TaWRlID0gQ2xpcHBlckxpYi5FZGdlU2lkZS5lc1JpZ2h0O1xuICAgICAgICBlLk91dElkeCA9IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuVW5hc3NpZ25lZDtcbiAgICAgIH1cbiAgICAgIGxtID0gbG0uTmV4dDtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlciA9IGZ1bmN0aW9uIChJbml0T3B0aW9ucykgLy8gcHVibGljIENsaXBwZXIoaW50IEluaXRPcHRpb25zID0gMClcbiAge1xuICAgIGlmICh0eXBlb2YgKEluaXRPcHRpb25zKSA9PSBcInVuZGVmaW5lZFwiKSBJbml0T3B0aW9ucyA9IDA7XG4gICAgdGhpcy5tX1BvbHlPdXRzID0gbnVsbDtcbiAgICB0aGlzLm1fQ2xpcFR5cGUgPSBDbGlwcGVyTGliLkNsaXBUeXBlLmN0SW50ZXJzZWN0aW9uO1xuICAgIHRoaXMubV9TY2FuYmVhbSA9IG51bGw7XG4gICAgdGhpcy5tX0FjdGl2ZUVkZ2VzID0gbnVsbDtcbiAgICB0aGlzLm1fU29ydGVkRWRnZXMgPSBudWxsO1xuICAgIHRoaXMubV9JbnRlcnNlY3RMaXN0ID0gbnVsbDtcbiAgICB0aGlzLm1fSW50ZXJzZWN0Tm9kZUNvbXBhcmVyID0gbnVsbDtcbiAgICB0aGlzLm1fRXhlY3V0ZUxvY2tlZCA9IGZhbHNlO1xuICAgIHRoaXMubV9DbGlwRmlsbFR5cGUgPSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRFdmVuT2RkO1xuICAgIHRoaXMubV9TdWJqRmlsbFR5cGUgPSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRFdmVuT2RkO1xuICAgIHRoaXMubV9Kb2lucyA9IG51bGw7XG4gICAgdGhpcy5tX0dob3N0Sm9pbnMgPSBudWxsO1xuICAgIHRoaXMubV9Vc2luZ1BvbHlUcmVlID0gZmFsc2U7XG4gICAgdGhpcy5SZXZlcnNlU29sdXRpb24gPSBmYWxzZTtcbiAgICB0aGlzLlN0cmljdGx5U2ltcGxlID0gZmFsc2U7XG4gICAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5jYWxsKHRoaXMpO1xuICAgIHRoaXMubV9TY2FuYmVhbSA9IG51bGw7XG4gICAgdGhpcy5tX0FjdGl2ZUVkZ2VzID0gbnVsbDtcbiAgICB0aGlzLm1fU29ydGVkRWRnZXMgPSBudWxsO1xuICAgIHRoaXMubV9JbnRlcnNlY3RMaXN0ID0gbmV3IEFycmF5KCk7XG4gICAgdGhpcy5tX0ludGVyc2VjdE5vZGVDb21wYXJlciA9IENsaXBwZXJMaWIuTXlJbnRlcnNlY3ROb2RlU29ydC5Db21wYXJlO1xuICAgIHRoaXMubV9FeGVjdXRlTG9ja2VkID0gZmFsc2U7XG4gICAgdGhpcy5tX1VzaW5nUG9seVRyZWUgPSBmYWxzZTtcbiAgICB0aGlzLm1fUG9seU91dHMgPSBuZXcgQXJyYXkoKTtcbiAgICB0aGlzLm1fSm9pbnMgPSBuZXcgQXJyYXkoKTtcbiAgICB0aGlzLm1fR2hvc3RKb2lucyA9IG5ldyBBcnJheSgpO1xuICAgIHRoaXMuUmV2ZXJzZVNvbHV0aW9uID0gKDEgJiBJbml0T3B0aW9ucykgIT09IDA7XG4gICAgdGhpcy5TdHJpY3RseVNpbXBsZSA9ICgyICYgSW5pdE9wdGlvbnMpICE9PSAwO1xuICAgIHRoaXMuUHJlc2VydmVDb2xsaW5lYXIgPSAoNCAmIEluaXRPcHRpb25zKSAhPT0gMDtcbiAgICBpZiAodXNlX3h5eilcbiAgICB7XG4gICAgICB0aGlzLlpGaWxsRnVuY3Rpb24gPSBudWxsOyAvLyBmdW5jdGlvbiAoSW50UG9pbnQgdmVydDEsIEludFBvaW50IHZlcnQyLCByZWYgSW50UG9pbnQgaW50ZXJzZWN0UHQpO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLmlvUmV2ZXJzZVNvbHV0aW9uID0gMTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLmlvU3RyaWN0bHlTaW1wbGUgPSAyO1xuICBDbGlwcGVyTGliLkNsaXBwZXIuaW9QcmVzZXJ2ZUNvbGxpbmVhciA9IDQ7XG5cbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5DbGVhciA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICBpZiAodGhpcy5tX2VkZ2VzLmxlbmd0aCA9PT0gMClcbiAgICAgIHJldHVybjtcbiAgICAvL2F2b2lkcyBwcm9ibGVtcyB3aXRoIENsaXBwZXJCYXNlIGRlc3RydWN0b3JcbiAgICB0aGlzLkRpc3Bvc2VBbGxQb2x5UHRzKCk7XG4gICAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuQ2xlYXIuY2FsbCh0aGlzKTtcbiAgfTtcblxuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkRpc3Bvc2VTY2FuYmVhbUxpc3QgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgd2hpbGUgKHRoaXMubV9TY2FuYmVhbSAhPT0gbnVsbClcbiAgICB7XG4gICAgICB2YXIgc2IyID0gdGhpcy5tX1NjYW5iZWFtLk5leHQ7XG4gICAgICB0aGlzLm1fU2NhbmJlYW0gPSBudWxsO1xuICAgICAgdGhpcy5tX1NjYW5iZWFtID0gc2IyO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5SZXNldCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5SZXNldC5jYWxsKHRoaXMpO1xuICAgIHRoaXMubV9TY2FuYmVhbSA9IG51bGw7XG4gICAgdGhpcy5tX0FjdGl2ZUVkZ2VzID0gbnVsbDtcbiAgICB0aGlzLm1fU29ydGVkRWRnZXMgPSBudWxsO1xuXG4gICAgdmFyIGxtID0gdGhpcy5tX01pbmltYUxpc3Q7XG4gICAgd2hpbGUgKGxtICE9PSBudWxsKVxuICAgIHtcbiAgICAgIHRoaXMuSW5zZXJ0U2NhbmJlYW0obG0uWSk7XG4gICAgICBsbSA9IGxtLk5leHQ7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkluc2VydFNjYW5iZWFtID0gZnVuY3Rpb24gKFkpXG4gIHtcbiAgICBpZiAodGhpcy5tX1NjYW5iZWFtID09PSBudWxsKVxuICAgIHtcbiAgICAgIHRoaXMubV9TY2FuYmVhbSA9IG5ldyBDbGlwcGVyTGliLlNjYW5iZWFtKCk7XG4gICAgICB0aGlzLm1fU2NhbmJlYW0uTmV4dCA9IG51bGw7XG4gICAgICB0aGlzLm1fU2NhbmJlYW0uWSA9IFk7XG4gICAgfVxuICAgIGVsc2UgaWYgKFkgPiB0aGlzLm1fU2NhbmJlYW0uWSlcbiAgICB7XG4gICAgICB2YXIgbmV3U2IgPSBuZXcgQ2xpcHBlckxpYi5TY2FuYmVhbSgpO1xuICAgICAgbmV3U2IuWSA9IFk7XG4gICAgICBuZXdTYi5OZXh0ID0gdGhpcy5tX1NjYW5iZWFtO1xuICAgICAgdGhpcy5tX1NjYW5iZWFtID0gbmV3U2I7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICB2YXIgc2IyID0gdGhpcy5tX1NjYW5iZWFtO1xuICAgICAgd2hpbGUgKHNiMi5OZXh0ICE9PSBudWxsICYmIChZIDw9IHNiMi5OZXh0LlkpKVxuICAgICAgICBzYjIgPSBzYjIuTmV4dDtcbiAgICAgIGlmIChZID09IHNiMi5ZKVxuICAgICAgICByZXR1cm47XG4gICAgICAvL2llIGlnbm9yZXMgZHVwbGljYXRlc1xuICAgICAgdmFyIG5ld1NiID0gbmV3IENsaXBwZXJMaWIuU2NhbmJlYW0oKTtcbiAgICAgIG5ld1NiLlkgPSBZO1xuICAgICAgbmV3U2IuTmV4dCA9IHNiMi5OZXh0O1xuICAgICAgc2IyLk5leHQgPSBuZXdTYjtcbiAgICB9XG4gIH07XG4gIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkV4ZWN1dGUgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdmFyIGEgPSBhcmd1bWVudHMsXG4gICAgICBhbGVuID0gYS5sZW5ndGgsXG4gICAgICBpc3BvbHl0cmVlID0gYVsxXSBpbnN0YW5jZW9mIENsaXBwZXJMaWIuUG9seVRyZWU7XG4gICAgaWYgKGFsZW4gPT0gNCAmJiAhaXNwb2x5dHJlZSkgLy8gZnVuY3Rpb24gKGNsaXBUeXBlLCBzb2x1dGlvbiwgc3ViakZpbGxUeXBlLCBjbGlwRmlsbFR5cGUpXG4gICAge1xuICAgICAgdmFyIGNsaXBUeXBlID0gYVswXSxcbiAgICAgICAgc29sdXRpb24gPSBhWzFdLFxuICAgICAgICBzdWJqRmlsbFR5cGUgPSBhWzJdLFxuICAgICAgICBjbGlwRmlsbFR5cGUgPSBhWzNdO1xuICAgICAgaWYgKHRoaXMubV9FeGVjdXRlTG9ja2VkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAodGhpcy5tX0hhc09wZW5QYXRocylcbiAgICAgICAgQ2xpcHBlckxpYi5FcnJvcihcIkVycm9yOiBQb2x5VHJlZSBzdHJ1Y3QgaXMgbmVlZCBmb3Igb3BlbiBwYXRoIGNsaXBwaW5nLlwiKTtcbiAgICAgIHRoaXMubV9FeGVjdXRlTG9ja2VkID0gdHJ1ZTtcbiAgICAgIENsaXBwZXJMaWIuQ2xlYXIoc29sdXRpb24pO1xuICAgICAgdGhpcy5tX1N1YmpGaWxsVHlwZSA9IHN1YmpGaWxsVHlwZTtcbiAgICAgIHRoaXMubV9DbGlwRmlsbFR5cGUgPSBjbGlwRmlsbFR5cGU7XG4gICAgICB0aGlzLm1fQ2xpcFR5cGUgPSBjbGlwVHlwZTtcbiAgICAgIHRoaXMubV9Vc2luZ1BvbHlUcmVlID0gZmFsc2U7XG4gICAgICB0cnlcbiAgICAgIHtcbiAgICAgICAgdmFyIHN1Y2NlZWRlZCA9IHRoaXMuRXhlY3V0ZUludGVybmFsKCk7XG4gICAgICAgIC8vYnVpbGQgdGhlIHJldHVybiBwb2x5Z29ucyAuLi5cbiAgICAgICAgaWYgKHN1Y2NlZWRlZCkgdGhpcy5CdWlsZFJlc3VsdChzb2x1dGlvbik7XG4gICAgICB9XG4gICAgICBmaW5hbGx5XG4gICAgICB7XG4gICAgICAgIHRoaXMuRGlzcG9zZUFsbFBvbHlQdHMoKTtcbiAgICAgICAgdGhpcy5tX0V4ZWN1dGVMb2NrZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzdWNjZWVkZWQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKGFsZW4gPT0gNCAmJiBpc3BvbHl0cmVlKSAvLyBmdW5jdGlvbiAoY2xpcFR5cGUsIHBvbHl0cmVlLCBzdWJqRmlsbFR5cGUsIGNsaXBGaWxsVHlwZSlcbiAgICB7XG4gICAgICB2YXIgY2xpcFR5cGUgPSBhWzBdLFxuICAgICAgICBwb2x5dHJlZSA9IGFbMV0sXG4gICAgICAgIHN1YmpGaWxsVHlwZSA9IGFbMl0sXG4gICAgICAgIGNsaXBGaWxsVHlwZSA9IGFbM107XG4gICAgICBpZiAodGhpcy5tX0V4ZWN1dGVMb2NrZWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHRoaXMubV9FeGVjdXRlTG9ja2VkID0gdHJ1ZTtcbiAgICAgIHRoaXMubV9TdWJqRmlsbFR5cGUgPSBzdWJqRmlsbFR5cGU7XG4gICAgICB0aGlzLm1fQ2xpcEZpbGxUeXBlID0gY2xpcEZpbGxUeXBlO1xuICAgICAgdGhpcy5tX0NsaXBUeXBlID0gY2xpcFR5cGU7XG4gICAgICB0aGlzLm1fVXNpbmdQb2x5VHJlZSA9IHRydWU7XG4gICAgICB0cnlcbiAgICAgIHtcbiAgICAgICAgdmFyIHN1Y2NlZWRlZCA9IHRoaXMuRXhlY3V0ZUludGVybmFsKCk7XG4gICAgICAgIC8vYnVpbGQgdGhlIHJldHVybiBwb2x5Z29ucyAuLi5cbiAgICAgICAgaWYgKHN1Y2NlZWRlZCkgdGhpcy5CdWlsZFJlc3VsdDIocG9seXRyZWUpO1xuICAgICAgfVxuICAgICAgZmluYWxseVxuICAgICAge1xuICAgICAgICB0aGlzLkRpc3Bvc2VBbGxQb2x5UHRzKCk7XG4gICAgICAgIHRoaXMubV9FeGVjdXRlTG9ja2VkID0gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3VjY2VlZGVkO1xuICAgIH1cbiAgICBlbHNlIGlmIChhbGVuID09IDIgJiYgIWlzcG9seXRyZWUpIC8vIGZ1bmN0aW9uIChjbGlwVHlwZSwgc29sdXRpb24pXG4gICAge1xuICAgICAgdmFyIGNsaXBUeXBlID0gYVswXSxcbiAgICAgICAgc29sdXRpb24gPSBhWzFdO1xuICAgICAgcmV0dXJuIHRoaXMuRXhlY3V0ZShjbGlwVHlwZSwgc29sdXRpb24sIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdEV2ZW5PZGQsIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdEV2ZW5PZGQpO1xuICAgIH1cbiAgICBlbHNlIGlmIChhbGVuID09IDIgJiYgaXNwb2x5dHJlZSkgLy8gZnVuY3Rpb24gKGNsaXBUeXBlLCBwb2x5dHJlZSlcbiAgICB7XG4gICAgICB2YXIgY2xpcFR5cGUgPSBhWzBdLFxuICAgICAgICBwb2x5dHJlZSA9IGFbMV07XG4gICAgICByZXR1cm4gdGhpcy5FeGVjdXRlKGNsaXBUeXBlLCBwb2x5dHJlZSwgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0RXZlbk9kZCwgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0RXZlbk9kZCk7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkZpeEhvbGVMaW5rYWdlID0gZnVuY3Rpb24gKG91dFJlYylcbiAge1xuICAgIC8vc2tpcCBpZiBhbiBvdXRlcm1vc3QgcG9seWdvbiBvclxuICAgIC8vYWxyZWFkeSBhbHJlYWR5IHBvaW50cyB0byB0aGUgY29ycmVjdCBGaXJzdExlZnQgLi4uXG4gICAgaWYgKG91dFJlYy5GaXJzdExlZnQgPT09IG51bGwgfHwgKG91dFJlYy5Jc0hvbGUgIT0gb3V0UmVjLkZpcnN0TGVmdC5Jc0hvbGUgJiYgb3V0UmVjLkZpcnN0TGVmdC5QdHMgIT09IG51bGwpKVxuICAgICAgcmV0dXJuO1xuICAgIHZhciBvcmZsID0gb3V0UmVjLkZpcnN0TGVmdDtcbiAgICB3aGlsZSAob3JmbCAhPT0gbnVsbCAmJiAoKG9yZmwuSXNIb2xlID09IG91dFJlYy5Jc0hvbGUpIHx8IG9yZmwuUHRzID09PSBudWxsKSlcbiAgICAgIG9yZmwgPSBvcmZsLkZpcnN0TGVmdDtcbiAgICBvdXRSZWMuRmlyc3RMZWZ0ID0gb3JmbDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5FeGVjdXRlSW50ZXJuYWwgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdHJ5XG4gICAge1xuICAgICAgdGhpcy5SZXNldCgpO1xuICAgICAgaWYgKHRoaXMubV9DdXJyZW50TE0gPT09IG51bGwpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHZhciBib3RZID0gdGhpcy5Qb3BTY2FuYmVhbSgpO1xuICAgICAgZG8ge1xuICAgICAgICB0aGlzLkluc2VydExvY2FsTWluaW1hSW50b0FFTChib3RZKTtcbiAgICAgICAgQ2xpcHBlckxpYi5DbGVhcih0aGlzLm1fR2hvc3RKb2lucyk7XG4gICAgICAgIHRoaXMuUHJvY2Vzc0hvcml6b250YWxzKGZhbHNlKTtcbiAgICAgICAgaWYgKHRoaXMubV9TY2FuYmVhbSA9PT0gbnVsbClcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgdmFyIHRvcFkgPSB0aGlzLlBvcFNjYW5iZWFtKCk7XG4gICAgICAgIGlmICghdGhpcy5Qcm9jZXNzSW50ZXJzZWN0aW9ucyh0b3BZKSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIHRoaXMuUHJvY2Vzc0VkZ2VzQXRUb3BPZlNjYW5iZWFtKHRvcFkpO1xuICAgICAgICBib3RZID0gdG9wWTtcbiAgICAgIH1cbiAgICAgIHdoaWxlICh0aGlzLm1fU2NhbmJlYW0gIT09IG51bGwgfHwgdGhpcy5tX0N1cnJlbnRMTSAhPT0gbnVsbClcbiAgICAgIC8vZml4IG9yaWVudGF0aW9ucyAuLi5cbiAgICAgIGZvciAodmFyIGkgPSAwLCBpbGVuID0gdGhpcy5tX1BvbHlPdXRzLmxlbmd0aDsgaSA8IGlsZW47IGkrKylcbiAgICAgIHtcbiAgICAgICAgdmFyIG91dFJlYyA9IHRoaXMubV9Qb2x5T3V0c1tpXTtcbiAgICAgICAgaWYgKG91dFJlYy5QdHMgPT09IG51bGwgfHwgb3V0UmVjLklzT3BlbilcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKChvdXRSZWMuSXNIb2xlIF4gdGhpcy5SZXZlcnNlU29sdXRpb24pID09ICh0aGlzLkFyZWEob3V0UmVjKSA+IDApKVxuICAgICAgICAgIHRoaXMuUmV2ZXJzZVBvbHlQdExpbmtzKG91dFJlYy5QdHMpO1xuICAgICAgfVxuICAgICAgdGhpcy5Kb2luQ29tbW9uRWRnZXMoKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBpbGVuID0gdGhpcy5tX1BvbHlPdXRzLmxlbmd0aDsgaSA8IGlsZW47IGkrKylcbiAgICAgIHtcbiAgICAgICAgdmFyIG91dFJlYyA9IHRoaXMubV9Qb2x5T3V0c1tpXTtcbiAgICAgICAgaWYgKG91dFJlYy5QdHMgIT09IG51bGwgJiYgIW91dFJlYy5Jc09wZW4pXG4gICAgICAgICAgdGhpcy5GaXh1cE91dFBvbHlnb24ob3V0UmVjKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLlN0cmljdGx5U2ltcGxlKVxuICAgICAgICB0aGlzLkRvU2ltcGxlUG9seWdvbnMoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBmaW5hbGx5XG4gICAge1xuICAgICAgQ2xpcHBlckxpYi5DbGVhcih0aGlzLm1fSm9pbnMpO1xuICAgICAgQ2xpcHBlckxpYi5DbGVhcih0aGlzLm1fR2hvc3RKb2lucyk7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlBvcFNjYW5iZWFtID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHZhciBZID0gdGhpcy5tX1NjYW5iZWFtLlk7XG4gICAgdGhpcy5tX1NjYW5iZWFtID0gdGhpcy5tX1NjYW5iZWFtLk5leHQ7XG4gICAgcmV0dXJuIFk7XG4gIH07XG5cbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5EaXNwb3NlQWxsUG9seVB0cyA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICBmb3IgKHZhciBpID0gMCwgaWxlbiA9IHRoaXMubV9Qb2x5T3V0cy5sZW5ndGg7IGkgPCBpbGVuOyArK2kpXG4gICAgICB0aGlzLkRpc3Bvc2VPdXRSZWMoaSk7XG4gICAgQ2xpcHBlckxpYi5DbGVhcih0aGlzLm1fUG9seU91dHMpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkRpc3Bvc2VPdXRSZWMgPSBmdW5jdGlvbiAoaW5kZXgpXG4gIHtcbiAgICB2YXIgb3V0UmVjID0gdGhpcy5tX1BvbHlPdXRzW2luZGV4XTtcbiAgICBvdXRSZWMuUHRzID0gbnVsbDtcbiAgICBvdXRSZWMgPSBudWxsO1xuICAgIHRoaXMubV9Qb2x5T3V0c1tpbmRleF0gPSBudWxsO1xuICB9O1xuXG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuQWRkSm9pbiA9IGZ1bmN0aW9uIChPcDEsIE9wMiwgT2ZmUHQpXG4gIHtcbiAgICB2YXIgaiA9IG5ldyBDbGlwcGVyTGliLkpvaW4oKTtcbiAgICBqLk91dFB0MSA9IE9wMTtcbiAgICBqLk91dFB0MiA9IE9wMjtcbiAgICAvL2ouT2ZmUHQgPSBPZmZQdDtcbiAgICBqLk9mZlB0LlggPSBPZmZQdC5YO1xuICAgIGouT2ZmUHQuWSA9IE9mZlB0Llk7XG4gICAgdGhpcy5tX0pvaW5zLnB1c2goaik7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuQWRkR2hvc3RKb2luID0gZnVuY3Rpb24gKE9wLCBPZmZQdClcbiAge1xuICAgIHZhciBqID0gbmV3IENsaXBwZXJMaWIuSm9pbigpO1xuICAgIGouT3V0UHQxID0gT3A7XG4gICAgLy9qLk9mZlB0ID0gT2ZmUHQ7XG4gICAgai5PZmZQdC5YID0gT2ZmUHQuWDtcbiAgICBqLk9mZlB0LlkgPSBPZmZQdC5ZO1xuICAgIHRoaXMubV9HaG9zdEpvaW5zLnB1c2goaik7XG4gIH07XG4gIGlmICh1c2VfeHl6KVxuICB7XG4gICAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5TZXRaID0gZnVuY3Rpb24gKHB0LCBlMSwgZTIpXG4gICAge1xuICAgICAgaWYgKHRoaXMuWkZpbGxGdW5jdGlvbiAhPT0gbnVsbClcbiAgICAgIHtcbiAgICAgICAgaWYgKHB0LlogIT0gMCB8fCB0aGlzLlpGaWxsRnVuY3Rpb24gPT09IG51bGwpIHJldHVybjtcbiAgICAgICAgZWxzZSBpZiAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwdCwgZTEuQm90KSkgcHQuWiA9IGUxLkJvdC5aO1xuICAgICAgICBlbHNlIGlmIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHB0LCBlMS5Ub3ApKSBwdC5aID0gZTEuVG9wLlo7XG4gICAgICAgIGVsc2UgaWYgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocHQsIGUyLkJvdCkpIHB0LlogPSBlMi5Cb3QuWjtcbiAgICAgICAgZWxzZSBpZiAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwdCwgZTIuVG9wKSkgcHQuWiA9IGUyLlRvcC5aO1xuICAgICAgICBlbHNlIFpGaWxsRnVuY3Rpb24oZTEuQm90LCBlMS5Ub3AsIGUyLkJvdCwgZTIuVG9wLCBwdCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIH1cblxuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkluc2VydExvY2FsTWluaW1hSW50b0FFTCA9IGZ1bmN0aW9uIChib3RZKVxuICB7XG4gICAgd2hpbGUgKHRoaXMubV9DdXJyZW50TE0gIT09IG51bGwgJiYgKHRoaXMubV9DdXJyZW50TE0uWSA9PSBib3RZKSlcbiAgICB7XG4gICAgICB2YXIgbGIgPSB0aGlzLm1fQ3VycmVudExNLkxlZnRCb3VuZDtcbiAgICAgIHZhciByYiA9IHRoaXMubV9DdXJyZW50TE0uUmlnaHRCb3VuZDtcbiAgICAgIHRoaXMuUG9wTG9jYWxNaW5pbWEoKTtcbiAgICAgIHZhciBPcDEgPSBudWxsO1xuICAgICAgaWYgKGxiID09PSBudWxsKVxuICAgICAge1xuICAgICAgICB0aGlzLkluc2VydEVkZ2VJbnRvQUVMKHJiLCBudWxsKTtcbiAgICAgICAgdGhpcy5TZXRXaW5kaW5nQ291bnQocmIpO1xuICAgICAgICBpZiAodGhpcy5Jc0NvbnRyaWJ1dGluZyhyYikpXG4gICAgICAgICAgT3AxID0gdGhpcy5BZGRPdXRQdChyYiwgcmIuQm90KTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHJiID09IG51bGwpXG4gICAgICB7XG4gICAgICAgIHRoaXMuSW5zZXJ0RWRnZUludG9BRUwobGIsIG51bGwpO1xuICAgICAgICB0aGlzLlNldFdpbmRpbmdDb3VudChsYik7XG4gICAgICAgIGlmICh0aGlzLklzQ29udHJpYnV0aW5nKGxiKSlcbiAgICAgICAgICBPcDEgPSB0aGlzLkFkZE91dFB0KGxiLCBsYi5Cb3QpO1xuICAgICAgICB0aGlzLkluc2VydFNjYW5iZWFtKGxiLlRvcC5ZKTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgdGhpcy5JbnNlcnRFZGdlSW50b0FFTChsYiwgbnVsbCk7XG4gICAgICAgIHRoaXMuSW5zZXJ0RWRnZUludG9BRUwocmIsIGxiKTtcbiAgICAgICAgdGhpcy5TZXRXaW5kaW5nQ291bnQobGIpO1xuICAgICAgICByYi5XaW5kQ250ID0gbGIuV2luZENudDtcbiAgICAgICAgcmIuV2luZENudDIgPSBsYi5XaW5kQ250MjtcbiAgICAgICAgaWYgKHRoaXMuSXNDb250cmlidXRpbmcobGIpKVxuICAgICAgICAgIE9wMSA9IHRoaXMuQWRkTG9jYWxNaW5Qb2x5KGxiLCByYiwgbGIuQm90KTtcbiAgICAgICAgdGhpcy5JbnNlcnRTY2FuYmVhbShsYi5Ub3AuWSk7XG4gICAgICB9XG4gICAgICBpZiAocmIgIT0gbnVsbClcbiAgICAgIHtcbiAgICAgICAgaWYgKENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuSXNIb3Jpem9udGFsKHJiKSlcbiAgICAgICAgICB0aGlzLkFkZEVkZ2VUb1NFTChyYik7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0aGlzLkluc2VydFNjYW5iZWFtKHJiLlRvcC5ZKTtcbiAgICAgIH1cbiAgICAgIGlmIChsYiA9PSBudWxsIHx8IHJiID09IG51bGwpIGNvbnRpbnVlO1xuICAgICAgLy9pZiBvdXRwdXQgcG9seWdvbnMgc2hhcmUgYW4gRWRnZSB3aXRoIGEgaG9yaXpvbnRhbCByYiwgdGhleSdsbCBuZWVkIGpvaW5pbmcgbGF0ZXIgLi4uXG4gICAgICBpZiAoT3AxICE9PSBudWxsICYmIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuSXNIb3Jpem9udGFsKHJiKSAmJiB0aGlzLm1fR2hvc3RKb2lucy5sZW5ndGggPiAwICYmIHJiLldpbmREZWx0YSAhPT0gMClcbiAgICAgIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlsZW4gPSB0aGlzLm1fR2hvc3RKb2lucy5sZW5ndGg7IGkgPCBpbGVuOyBpKyspXG4gICAgICAgIHtcbiAgICAgICAgICAvL2lmIHRoZSBob3Jpem9udGFsIFJiIGFuZCBhICdnaG9zdCcgaG9yaXpvbnRhbCBvdmVybGFwLCB0aGVuIGNvbnZlcnRcbiAgICAgICAgICAvL3RoZSAnZ2hvc3QnIGpvaW4gdG8gYSByZWFsIGpvaW4gcmVhZHkgZm9yIGxhdGVyIC4uLlxuICAgICAgICAgIHZhciBqID0gdGhpcy5tX0dob3N0Sm9pbnNbaV07XG5cblx0XHRcdFx0XHRpZiAodGhpcy5Ib3J6U2VnbWVudHNPdmVybGFwKGouT3V0UHQxLlB0LlgsIGouT2ZmUHQuWCwgcmIuQm90LlgsIHJiLlRvcC5YKSlcbiAgICAgICAgICAgIHRoaXMuQWRkSm9pbihqLk91dFB0MSwgT3AxLCBqLk9mZlB0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGxiLk91dElkeCA+PSAwICYmIGxiLlByZXZJbkFFTCAhPT0gbnVsbCAmJlxuICAgICAgICBsYi5QcmV2SW5BRUwuQ3Vyci5YID09IGxiLkJvdC5YICYmXG4gICAgICAgIGxiLlByZXZJbkFFTC5PdXRJZHggPj0gMCAmJlxuICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNsb3Blc0VxdWFsKGxiLlByZXZJbkFFTCwgbGIsIHRoaXMubV9Vc2VGdWxsUmFuZ2UpICYmXG4gICAgICAgIGxiLldpbmREZWx0YSAhPT0gMCAmJiBsYi5QcmV2SW5BRUwuV2luZERlbHRhICE9PSAwKVxuICAgICAge1xuICAgICAgICB2YXIgT3AyID0gdGhpcy5BZGRPdXRQdChsYi5QcmV2SW5BRUwsIGxiLkJvdCk7XG4gICAgICAgIHRoaXMuQWRkSm9pbihPcDEsIE9wMiwgbGIuVG9wKTtcbiAgICAgIH1cbiAgICAgIGlmIChsYi5OZXh0SW5BRUwgIT0gcmIpXG4gICAgICB7XG4gICAgICAgIGlmIChyYi5PdXRJZHggPj0gMCAmJiByYi5QcmV2SW5BRUwuT3V0SWR4ID49IDAgJiZcbiAgICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNsb3Blc0VxdWFsKHJiLlByZXZJbkFFTCwgcmIsIHRoaXMubV9Vc2VGdWxsUmFuZ2UpICYmXG4gICAgICAgICAgcmIuV2luZERlbHRhICE9PSAwICYmIHJiLlByZXZJbkFFTC5XaW5kRGVsdGEgIT09IDApXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgT3AyID0gdGhpcy5BZGRPdXRQdChyYi5QcmV2SW5BRUwsIHJiLkJvdCk7XG4gICAgICAgICAgdGhpcy5BZGRKb2luKE9wMSwgT3AyLCByYi5Ub3ApO1xuICAgICAgICB9XG4gICAgICAgIHZhciBlID0gbGIuTmV4dEluQUVMO1xuICAgICAgICBpZiAoZSAhPT0gbnVsbClcbiAgICAgICAgICB3aGlsZSAoZSAhPSByYilcbiAgICAgICAgICB7XG4gICAgICAgICAgICAvL25iOiBGb3IgY2FsY3VsYXRpbmcgd2luZGluZyBjb3VudHMgZXRjLCBJbnRlcnNlY3RFZGdlcygpIGFzc3VtZXNcbiAgICAgICAgICAgIC8vdGhhdCBwYXJhbTEgd2lsbCBiZSB0byB0aGUgcmlnaHQgb2YgcGFyYW0yIEFCT1ZFIHRoZSBpbnRlcnNlY3Rpb24gLi4uXG4gICAgICAgICAgICB0aGlzLkludGVyc2VjdEVkZ2VzKHJiLCBlLCBsYi5DdXJyLCBmYWxzZSk7XG4gICAgICAgICAgICAvL29yZGVyIGltcG9ydGFudCBoZXJlXG4gICAgICAgICAgICBlID0gZS5OZXh0SW5BRUw7XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5JbnNlcnRFZGdlSW50b0FFTCA9IGZ1bmN0aW9uIChlZGdlLCBzdGFydEVkZ2UpXG4gIHtcbiAgICBpZiAodGhpcy5tX0FjdGl2ZUVkZ2VzID09PSBudWxsKVxuICAgIHtcbiAgICAgIGVkZ2UuUHJldkluQUVMID0gbnVsbDtcbiAgICAgIGVkZ2UuTmV4dEluQUVMID0gbnVsbDtcbiAgICAgIHRoaXMubV9BY3RpdmVFZGdlcyA9IGVkZ2U7XG4gICAgfVxuICAgIGVsc2UgaWYgKHN0YXJ0RWRnZSA9PT0gbnVsbCAmJiB0aGlzLkUySW5zZXJ0c0JlZm9yZUUxKHRoaXMubV9BY3RpdmVFZGdlcywgZWRnZSkpXG4gICAge1xuICAgICAgZWRnZS5QcmV2SW5BRUwgPSBudWxsO1xuICAgICAgZWRnZS5OZXh0SW5BRUwgPSB0aGlzLm1fQWN0aXZlRWRnZXM7XG4gICAgICB0aGlzLm1fQWN0aXZlRWRnZXMuUHJldkluQUVMID0gZWRnZTtcbiAgICAgIHRoaXMubV9BY3RpdmVFZGdlcyA9IGVkZ2U7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBpZiAoc3RhcnRFZGdlID09PSBudWxsKVxuICAgICAgICBzdGFydEVkZ2UgPSB0aGlzLm1fQWN0aXZlRWRnZXM7XG4gICAgICB3aGlsZSAoc3RhcnRFZGdlLk5leHRJbkFFTCAhPT0gbnVsbCAmJiAhdGhpcy5FMkluc2VydHNCZWZvcmVFMShzdGFydEVkZ2UuTmV4dEluQUVMLCBlZGdlKSlcbiAgICAgICAgc3RhcnRFZGdlID0gc3RhcnRFZGdlLk5leHRJbkFFTDtcbiAgICAgIGVkZ2UuTmV4dEluQUVMID0gc3RhcnRFZGdlLk5leHRJbkFFTDtcbiAgICAgIGlmIChzdGFydEVkZ2UuTmV4dEluQUVMICE9PSBudWxsKVxuICAgICAgICBzdGFydEVkZ2UuTmV4dEluQUVMLlByZXZJbkFFTCA9IGVkZ2U7XG4gICAgICBlZGdlLlByZXZJbkFFTCA9IHN0YXJ0RWRnZTtcbiAgICAgIHN0YXJ0RWRnZS5OZXh0SW5BRUwgPSBlZGdlO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5FMkluc2VydHNCZWZvcmVFMSA9IGZ1bmN0aW9uIChlMSwgZTIpXG4gIHtcbiAgICBpZiAoZTIuQ3Vyci5YID09IGUxLkN1cnIuWClcbiAgICB7XG4gICAgICBpZiAoZTIuVG9wLlkgPiBlMS5Ub3AuWSlcbiAgICAgICAgcmV0dXJuIGUyLlRvcC5YIDwgQ2xpcHBlckxpYi5DbGlwcGVyLlRvcFgoZTEsIGUyLlRvcC5ZKTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIGUxLlRvcC5YID4gQ2xpcHBlckxpYi5DbGlwcGVyLlRvcFgoZTIsIGUxLlRvcC5ZKTtcbiAgICB9XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGUyLkN1cnIuWCA8IGUxLkN1cnIuWDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Jc0V2ZW5PZGRGaWxsVHlwZSA9IGZ1bmN0aW9uIChlZGdlKVxuICB7XG4gICAgaWYgKGVkZ2UuUG9seVR5cCA9PSBDbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdClcbiAgICAgIHJldHVybiB0aGlzLm1fU3ViakZpbGxUeXBlID09IENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdEV2ZW5PZGQ7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIHRoaXMubV9DbGlwRmlsbFR5cGUgPT0gQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0RXZlbk9kZDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Jc0V2ZW5PZGRBbHRGaWxsVHlwZSA9IGZ1bmN0aW9uIChlZGdlKVxuICB7XG4gICAgaWYgKGVkZ2UuUG9seVR5cCA9PSBDbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdClcbiAgICAgIHJldHVybiB0aGlzLm1fQ2xpcEZpbGxUeXBlID09IENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdEV2ZW5PZGQ7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIHRoaXMubV9TdWJqRmlsbFR5cGUgPT0gQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0RXZlbk9kZDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Jc0NvbnRyaWJ1dGluZyA9IGZ1bmN0aW9uIChlZGdlKVxuICB7XG4gICAgdmFyIHBmdCwgcGZ0MjtcbiAgICBpZiAoZWRnZS5Qb2x5VHlwID09IENsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0KVxuICAgIHtcbiAgICAgIHBmdCA9IHRoaXMubV9TdWJqRmlsbFR5cGU7XG4gICAgICBwZnQyID0gdGhpcy5tX0NsaXBGaWxsVHlwZTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIHBmdCA9IHRoaXMubV9DbGlwRmlsbFR5cGU7XG4gICAgICBwZnQyID0gdGhpcy5tX1N1YmpGaWxsVHlwZTtcbiAgICB9XG4gICAgc3dpdGNoIChwZnQpXG4gICAge1xuICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0RXZlbk9kZDpcbiAgICAgIGlmIChlZGdlLldpbmREZWx0YSA9PT0gMCAmJiBlZGdlLldpbmRDbnQgIT0gMSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvOlxuICAgICAgaWYgKE1hdGguYWJzKGVkZ2UuV2luZENudCkgIT0gMSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRQb3NpdGl2ZTpcbiAgICAgIGlmIChlZGdlLldpbmRDbnQgIT0gMSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGlmIChlZGdlLldpbmRDbnQgIT0gLTEpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBzd2l0Y2ggKHRoaXMubV9DbGlwVHlwZSlcbiAgICB7XG4gICAgY2FzZSBDbGlwcGVyTGliLkNsaXBUeXBlLmN0SW50ZXJzZWN0aW9uOlxuICAgICAgc3dpdGNoIChwZnQyKVxuICAgICAge1xuICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRFdmVuT2RkOlxuICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvOlxuICAgICAgICByZXR1cm4gKGVkZ2UuV2luZENudDIgIT09IDApO1xuICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRQb3NpdGl2ZTpcbiAgICAgICAgcmV0dXJuIChlZGdlLldpbmRDbnQyID4gMCk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gKGVkZ2UuV2luZENudDIgPCAwKTtcbiAgICAgIH1cbiAgICBjYXNlIENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RVbmlvbjpcbiAgICAgIHN3aXRjaCAocGZ0MilcbiAgICAgIHtcbiAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0RXZlbk9kZDpcbiAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybzpcbiAgICAgICAgcmV0dXJuIChlZGdlLldpbmRDbnQyID09PSAwKTtcbiAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0UG9zaXRpdmU6XG4gICAgICAgIHJldHVybiAoZWRnZS5XaW5kQ250MiA8PSAwKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiAoZWRnZS5XaW5kQ250MiA+PSAwKTtcbiAgICAgIH1cbiAgICBjYXNlIENsaXBwZXJMaWIuQ2xpcFR5cGUuY3REaWZmZXJlbmNlOlxuICAgICAgaWYgKGVkZ2UuUG9seVR5cCA9PSBDbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdClcbiAgICAgICAgc3dpdGNoIChwZnQyKVxuICAgICAgICB7XG4gICAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0RXZlbk9kZDpcbiAgICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvOlxuICAgICAgICAgIHJldHVybiAoZWRnZS5XaW5kQ250MiA9PT0gMCk7XG4gICAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0UG9zaXRpdmU6XG4gICAgICAgICAgcmV0dXJuIChlZGdlLldpbmRDbnQyIDw9IDApO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiAoZWRnZS5XaW5kQ250MiA+PSAwKTtcbiAgICAgICAgfVxuICAgICAgZWxzZVxuICAgICAgICBzd2l0Y2ggKHBmdDIpXG4gICAgICAgIHtcbiAgICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRFdmVuT2RkOlxuICAgICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm86XG4gICAgICAgICAgcmV0dXJuIChlZGdlLldpbmRDbnQyICE9PSAwKTtcbiAgICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRQb3NpdGl2ZTpcbiAgICAgICAgICByZXR1cm4gKGVkZ2UuV2luZENudDIgPiAwKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gKGVkZ2UuV2luZENudDIgPCAwKTtcbiAgICAgICAgfVxuICAgIGNhc2UgQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFhvcjpcbiAgICAgIGlmIChlZGdlLldpbmREZWx0YSA9PT0gMClcbiAgICAgICAgc3dpdGNoIChwZnQyKVxuICAgICAgICB7XG4gICAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0RXZlbk9kZDpcbiAgICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvOlxuICAgICAgICAgIHJldHVybiAoZWRnZS5XaW5kQ250MiA9PT0gMCk7XG4gICAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0UG9zaXRpdmU6XG4gICAgICAgICAgcmV0dXJuIChlZGdlLldpbmRDbnQyIDw9IDApO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiAoZWRnZS5XaW5kQ250MiA+PSAwKTtcbiAgICAgICAgfVxuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuU2V0V2luZGluZ0NvdW50ID0gZnVuY3Rpb24gKGVkZ2UpXG4gIHtcbiAgICB2YXIgZSA9IGVkZ2UuUHJldkluQUVMO1xuICAgIC8vZmluZCB0aGUgZWRnZSBvZiB0aGUgc2FtZSBwb2x5dHlwZSB0aGF0IGltbWVkaWF0ZWx5IHByZWNlZWRzICdlZGdlJyBpbiBBRUxcbiAgICB3aGlsZSAoZSAhPT0gbnVsbCAmJiAoKGUuUG9seVR5cCAhPSBlZGdlLlBvbHlUeXApIHx8IChlLldpbmREZWx0YSA9PT0gMCkpKVxuICAgICAgZSA9IGUuUHJldkluQUVMO1xuICAgIGlmIChlID09PSBudWxsKVxuICAgIHtcbiAgICAgIGVkZ2UuV2luZENudCA9IChlZGdlLldpbmREZWx0YSA9PT0gMCA/IDEgOiBlZGdlLldpbmREZWx0YSk7XG4gICAgICBlZGdlLldpbmRDbnQyID0gMDtcbiAgICAgIGUgPSB0aGlzLm1fQWN0aXZlRWRnZXM7XG4gICAgICAvL2llIGdldCByZWFkeSB0byBjYWxjIFdpbmRDbnQyXG4gICAgfVxuICAgIGVsc2UgaWYgKGVkZ2UuV2luZERlbHRhID09PSAwICYmIHRoaXMubV9DbGlwVHlwZSAhPSBDbGlwcGVyTGliLkNsaXBUeXBlLmN0VW5pb24pXG4gICAge1xuICAgICAgZWRnZS5XaW5kQ250ID0gMTtcbiAgICAgIGVkZ2UuV2luZENudDIgPSBlLldpbmRDbnQyO1xuICAgICAgZSA9IGUuTmV4dEluQUVMO1xuICAgICAgLy9pZSBnZXQgcmVhZHkgdG8gY2FsYyBXaW5kQ250MlxuICAgIH1cbiAgICBlbHNlIGlmICh0aGlzLklzRXZlbk9kZEZpbGxUeXBlKGVkZ2UpKVxuICAgIHtcbiAgICAgIC8vRXZlbk9kZCBmaWxsaW5nIC4uLlxuICAgICAgaWYgKGVkZ2UuV2luZERlbHRhID09PSAwKVxuICAgICAge1xuICAgICAgICAvL2FyZSB3ZSBpbnNpZGUgYSBzdWJqIHBvbHlnb24gLi4uXG4gICAgICAgIHZhciBJbnNpZGUgPSB0cnVlO1xuICAgICAgICB2YXIgZTIgPSBlLlByZXZJbkFFTDtcbiAgICAgICAgd2hpbGUgKGUyICE9PSBudWxsKVxuICAgICAgICB7XG4gICAgICAgICAgaWYgKGUyLlBvbHlUeXAgPT0gZS5Qb2x5VHlwICYmIGUyLldpbmREZWx0YSAhPT0gMClcbiAgICAgICAgICAgIEluc2lkZSA9ICFJbnNpZGU7XG4gICAgICAgICAgZTIgPSBlMi5QcmV2SW5BRUw7XG4gICAgICAgIH1cbiAgICAgICAgZWRnZS5XaW5kQ250ID0gKEluc2lkZSA/IDAgOiAxKTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgZWRnZS5XaW5kQ250ID0gZWRnZS5XaW5kRGVsdGE7XG4gICAgICB9XG4gICAgICBlZGdlLldpbmRDbnQyID0gZS5XaW5kQ250MjtcbiAgICAgIGUgPSBlLk5leHRJbkFFTDtcbiAgICAgIC8vaWUgZ2V0IHJlYWR5IHRvIGNhbGMgV2luZENudDJcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIC8vbm9uWmVybywgUG9zaXRpdmUgb3IgTmVnYXRpdmUgZmlsbGluZyAuLi5cbiAgICAgIGlmIChlLldpbmRDbnQgKiBlLldpbmREZWx0YSA8IDApXG4gICAgICB7XG4gICAgICAgIC8vcHJldiBlZGdlIGlzICdkZWNyZWFzaW5nJyBXaW5kQ291bnQgKFdDKSB0b3dhcmQgemVyb1xuICAgICAgICAvL3NvIHdlJ3JlIG91dHNpZGUgdGhlIHByZXZpb3VzIHBvbHlnb24gLi4uXG4gICAgICAgIGlmIChNYXRoLmFicyhlLldpbmRDbnQpID4gMSlcbiAgICAgICAge1xuICAgICAgICAgIC8vb3V0c2lkZSBwcmV2IHBvbHkgYnV0IHN0aWxsIGluc2lkZSBhbm90aGVyLlxuICAgICAgICAgIC8vd2hlbiByZXZlcnNpbmcgZGlyZWN0aW9uIG9mIHByZXYgcG9seSB1c2UgdGhlIHNhbWUgV0NcbiAgICAgICAgICBpZiAoZS5XaW5kRGVsdGEgKiBlZGdlLldpbmREZWx0YSA8IDApXG4gICAgICAgICAgICBlZGdlLldpbmRDbnQgPSBlLldpbmRDbnQ7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgZWRnZS5XaW5kQ250ID0gZS5XaW5kQ250ICsgZWRnZS5XaW5kRGVsdGE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIGVkZ2UuV2luZENudCA9IChlZGdlLldpbmREZWx0YSA9PT0gMCA/IDEgOiBlZGdlLldpbmREZWx0YSk7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIC8vcHJldiBlZGdlIGlzICdpbmNyZWFzaW5nJyBXaW5kQ291bnQgKFdDKSBhd2F5IGZyb20gemVyb1xuICAgICAgICAvL3NvIHdlJ3JlIGluc2lkZSB0aGUgcHJldmlvdXMgcG9seWdvbiAuLi5cbiAgICAgICAgaWYgKGVkZ2UuV2luZERlbHRhID09PSAwKVxuICAgICAgICAgIGVkZ2UuV2luZENudCA9IChlLldpbmRDbnQgPCAwID8gZS5XaW5kQ250IC0gMSA6IGUuV2luZENudCArIDEpO1xuICAgICAgICBlbHNlIGlmIChlLldpbmREZWx0YSAqIGVkZ2UuV2luZERlbHRhIDwgMClcbiAgICAgICAgICBlZGdlLldpbmRDbnQgPSBlLldpbmRDbnQ7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBlZGdlLldpbmRDbnQgPSBlLldpbmRDbnQgKyBlZGdlLldpbmREZWx0YTtcbiAgICAgIH1cbiAgICAgIGVkZ2UuV2luZENudDIgPSBlLldpbmRDbnQyO1xuICAgICAgZSA9IGUuTmV4dEluQUVMO1xuICAgICAgLy9pZSBnZXQgcmVhZHkgdG8gY2FsYyBXaW5kQ250MlxuICAgIH1cbiAgICAvL3VwZGF0ZSBXaW5kQ250MiAuLi5cbiAgICBpZiAodGhpcy5Jc0V2ZW5PZGRBbHRGaWxsVHlwZShlZGdlKSlcbiAgICB7XG4gICAgICAvL0V2ZW5PZGQgZmlsbGluZyAuLi5cbiAgICAgIHdoaWxlIChlICE9IGVkZ2UpXG4gICAgICB7XG4gICAgICAgIGlmIChlLldpbmREZWx0YSAhPT0gMClcbiAgICAgICAgICBlZGdlLldpbmRDbnQyID0gKGVkZ2UuV2luZENudDIgPT09IDAgPyAxIDogMCk7XG4gICAgICAgIGUgPSBlLk5leHRJbkFFTDtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIC8vbm9uWmVybywgUG9zaXRpdmUgb3IgTmVnYXRpdmUgZmlsbGluZyAuLi5cbiAgICAgIHdoaWxlIChlICE9IGVkZ2UpXG4gICAgICB7XG4gICAgICAgIGVkZ2UuV2luZENudDIgKz0gZS5XaW5kRGVsdGE7XG4gICAgICAgIGUgPSBlLk5leHRJbkFFTDtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuQWRkRWRnZVRvU0VMID0gZnVuY3Rpb24gKGVkZ2UpXG4gIHtcbiAgICAvL1NFTCBwb2ludGVycyBpbiBQRWRnZSBhcmUgcmV1c2VkIHRvIGJ1aWxkIGEgbGlzdCBvZiBob3Jpem9udGFsIGVkZ2VzLlxuICAgIC8vSG93ZXZlciwgd2UgZG9uJ3QgbmVlZCB0byB3b3JyeSBhYm91dCBvcmRlciB3aXRoIGhvcml6b250YWwgZWRnZSBwcm9jZXNzaW5nLlxuICAgIGlmICh0aGlzLm1fU29ydGVkRWRnZXMgPT09IG51bGwpXG4gICAge1xuICAgICAgdGhpcy5tX1NvcnRlZEVkZ2VzID0gZWRnZTtcbiAgICAgIGVkZ2UuUHJldkluU0VMID0gbnVsbDtcbiAgICAgIGVkZ2UuTmV4dEluU0VMID0gbnVsbDtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIGVkZ2UuTmV4dEluU0VMID0gdGhpcy5tX1NvcnRlZEVkZ2VzO1xuICAgICAgZWRnZS5QcmV2SW5TRUwgPSBudWxsO1xuICAgICAgdGhpcy5tX1NvcnRlZEVkZ2VzLlByZXZJblNFTCA9IGVkZ2U7XG4gICAgICB0aGlzLm1fU29ydGVkRWRnZXMgPSBlZGdlO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Db3B5QUVMVG9TRUwgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdmFyIGUgPSB0aGlzLm1fQWN0aXZlRWRnZXM7XG4gICAgdGhpcy5tX1NvcnRlZEVkZ2VzID0gZTtcbiAgICB3aGlsZSAoZSAhPT0gbnVsbClcbiAgICB7XG4gICAgICBlLlByZXZJblNFTCA9IGUuUHJldkluQUVMO1xuICAgICAgZS5OZXh0SW5TRUwgPSBlLk5leHRJbkFFTDtcbiAgICAgIGUgPSBlLk5leHRJbkFFTDtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuU3dhcFBvc2l0aW9uc0luQUVMID0gZnVuY3Rpb24gKGVkZ2UxLCBlZGdlMilcbiAge1xuICAgIC8vY2hlY2sgdGhhdCBvbmUgb3Igb3RoZXIgZWRnZSBoYXNuJ3QgYWxyZWFkeSBiZWVuIHJlbW92ZWQgZnJvbSBBRUwgLi4uXG4gICAgaWYgKGVkZ2UxLk5leHRJbkFFTCA9PSBlZGdlMS5QcmV2SW5BRUwgfHwgZWRnZTIuTmV4dEluQUVMID09IGVkZ2UyLlByZXZJbkFFTClcbiAgICAgIHJldHVybjtcbiAgICBpZiAoZWRnZTEuTmV4dEluQUVMID09IGVkZ2UyKVxuICAgIHtcbiAgICAgIHZhciBuZXh0ID0gZWRnZTIuTmV4dEluQUVMO1xuICAgICAgaWYgKG5leHQgIT09IG51bGwpXG4gICAgICAgIG5leHQuUHJldkluQUVMID0gZWRnZTE7XG4gICAgICB2YXIgcHJldiA9IGVkZ2UxLlByZXZJbkFFTDtcbiAgICAgIGlmIChwcmV2ICE9PSBudWxsKVxuICAgICAgICBwcmV2Lk5leHRJbkFFTCA9IGVkZ2UyO1xuICAgICAgZWRnZTIuUHJldkluQUVMID0gcHJldjtcbiAgICAgIGVkZ2UyLk5leHRJbkFFTCA9IGVkZ2UxO1xuICAgICAgZWRnZTEuUHJldkluQUVMID0gZWRnZTI7XG4gICAgICBlZGdlMS5OZXh0SW5BRUwgPSBuZXh0O1xuICAgIH1cbiAgICBlbHNlIGlmIChlZGdlMi5OZXh0SW5BRUwgPT0gZWRnZTEpXG4gICAge1xuICAgICAgdmFyIG5leHQgPSBlZGdlMS5OZXh0SW5BRUw7XG4gICAgICBpZiAobmV4dCAhPT0gbnVsbClcbiAgICAgICAgbmV4dC5QcmV2SW5BRUwgPSBlZGdlMjtcbiAgICAgIHZhciBwcmV2ID0gZWRnZTIuUHJldkluQUVMO1xuICAgICAgaWYgKHByZXYgIT09IG51bGwpXG4gICAgICAgIHByZXYuTmV4dEluQUVMID0gZWRnZTE7XG4gICAgICBlZGdlMS5QcmV2SW5BRUwgPSBwcmV2O1xuICAgICAgZWRnZTEuTmV4dEluQUVMID0gZWRnZTI7XG4gICAgICBlZGdlMi5QcmV2SW5BRUwgPSBlZGdlMTtcbiAgICAgIGVkZ2UyLk5leHRJbkFFTCA9IG5leHQ7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICB2YXIgbmV4dCA9IGVkZ2UxLk5leHRJbkFFTDtcbiAgICAgIHZhciBwcmV2ID0gZWRnZTEuUHJldkluQUVMO1xuICAgICAgZWRnZTEuTmV4dEluQUVMID0gZWRnZTIuTmV4dEluQUVMO1xuICAgICAgaWYgKGVkZ2UxLk5leHRJbkFFTCAhPT0gbnVsbClcbiAgICAgICAgZWRnZTEuTmV4dEluQUVMLlByZXZJbkFFTCA9IGVkZ2UxO1xuICAgICAgZWRnZTEuUHJldkluQUVMID0gZWRnZTIuUHJldkluQUVMO1xuICAgICAgaWYgKGVkZ2UxLlByZXZJbkFFTCAhPT0gbnVsbClcbiAgICAgICAgZWRnZTEuUHJldkluQUVMLk5leHRJbkFFTCA9IGVkZ2UxO1xuICAgICAgZWRnZTIuTmV4dEluQUVMID0gbmV4dDtcbiAgICAgIGlmIChlZGdlMi5OZXh0SW5BRUwgIT09IG51bGwpXG4gICAgICAgIGVkZ2UyLk5leHRJbkFFTC5QcmV2SW5BRUwgPSBlZGdlMjtcbiAgICAgIGVkZ2UyLlByZXZJbkFFTCA9IHByZXY7XG4gICAgICBpZiAoZWRnZTIuUHJldkluQUVMICE9PSBudWxsKVxuICAgICAgICBlZGdlMi5QcmV2SW5BRUwuTmV4dEluQUVMID0gZWRnZTI7XG4gICAgfVxuICAgIGlmIChlZGdlMS5QcmV2SW5BRUwgPT09IG51bGwpXG4gICAgICB0aGlzLm1fQWN0aXZlRWRnZXMgPSBlZGdlMTtcbiAgICBlbHNlIGlmIChlZGdlMi5QcmV2SW5BRUwgPT09IG51bGwpXG4gICAgICB0aGlzLm1fQWN0aXZlRWRnZXMgPSBlZGdlMjtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Td2FwUG9zaXRpb25zSW5TRUwgPSBmdW5jdGlvbiAoZWRnZTEsIGVkZ2UyKVxuICB7XG4gICAgaWYgKGVkZ2UxLk5leHRJblNFTCA9PT0gbnVsbCAmJiBlZGdlMS5QcmV2SW5TRUwgPT09IG51bGwpXG4gICAgICByZXR1cm47XG4gICAgaWYgKGVkZ2UyLk5leHRJblNFTCA9PT0gbnVsbCAmJiBlZGdlMi5QcmV2SW5TRUwgPT09IG51bGwpXG4gICAgICByZXR1cm47XG4gICAgaWYgKGVkZ2UxLk5leHRJblNFTCA9PSBlZGdlMilcbiAgICB7XG4gICAgICB2YXIgbmV4dCA9IGVkZ2UyLk5leHRJblNFTDtcbiAgICAgIGlmIChuZXh0ICE9PSBudWxsKVxuICAgICAgICBuZXh0LlByZXZJblNFTCA9IGVkZ2UxO1xuICAgICAgdmFyIHByZXYgPSBlZGdlMS5QcmV2SW5TRUw7XG4gICAgICBpZiAocHJldiAhPT0gbnVsbClcbiAgICAgICAgcHJldi5OZXh0SW5TRUwgPSBlZGdlMjtcbiAgICAgIGVkZ2UyLlByZXZJblNFTCA9IHByZXY7XG4gICAgICBlZGdlMi5OZXh0SW5TRUwgPSBlZGdlMTtcbiAgICAgIGVkZ2UxLlByZXZJblNFTCA9IGVkZ2UyO1xuICAgICAgZWRnZTEuTmV4dEluU0VMID0gbmV4dDtcbiAgICB9XG4gICAgZWxzZSBpZiAoZWRnZTIuTmV4dEluU0VMID09IGVkZ2UxKVxuICAgIHtcbiAgICAgIHZhciBuZXh0ID0gZWRnZTEuTmV4dEluU0VMO1xuICAgICAgaWYgKG5leHQgIT09IG51bGwpXG4gICAgICAgIG5leHQuUHJldkluU0VMID0gZWRnZTI7XG4gICAgICB2YXIgcHJldiA9IGVkZ2UyLlByZXZJblNFTDtcbiAgICAgIGlmIChwcmV2ICE9PSBudWxsKVxuICAgICAgICBwcmV2Lk5leHRJblNFTCA9IGVkZ2UxO1xuICAgICAgZWRnZTEuUHJldkluU0VMID0gcHJldjtcbiAgICAgIGVkZ2UxLk5leHRJblNFTCA9IGVkZ2UyO1xuICAgICAgZWRnZTIuUHJldkluU0VMID0gZWRnZTE7XG4gICAgICBlZGdlMi5OZXh0SW5TRUwgPSBuZXh0O1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgdmFyIG5leHQgPSBlZGdlMS5OZXh0SW5TRUw7XG4gICAgICB2YXIgcHJldiA9IGVkZ2UxLlByZXZJblNFTDtcbiAgICAgIGVkZ2UxLk5leHRJblNFTCA9IGVkZ2UyLk5leHRJblNFTDtcbiAgICAgIGlmIChlZGdlMS5OZXh0SW5TRUwgIT09IG51bGwpXG4gICAgICAgIGVkZ2UxLk5leHRJblNFTC5QcmV2SW5TRUwgPSBlZGdlMTtcbiAgICAgIGVkZ2UxLlByZXZJblNFTCA9IGVkZ2UyLlByZXZJblNFTDtcbiAgICAgIGlmIChlZGdlMS5QcmV2SW5TRUwgIT09IG51bGwpXG4gICAgICAgIGVkZ2UxLlByZXZJblNFTC5OZXh0SW5TRUwgPSBlZGdlMTtcbiAgICAgIGVkZ2UyLk5leHRJblNFTCA9IG5leHQ7XG4gICAgICBpZiAoZWRnZTIuTmV4dEluU0VMICE9PSBudWxsKVxuICAgICAgICBlZGdlMi5OZXh0SW5TRUwuUHJldkluU0VMID0gZWRnZTI7XG4gICAgICBlZGdlMi5QcmV2SW5TRUwgPSBwcmV2O1xuICAgICAgaWYgKGVkZ2UyLlByZXZJblNFTCAhPT0gbnVsbClcbiAgICAgICAgZWRnZTIuUHJldkluU0VMLk5leHRJblNFTCA9IGVkZ2UyO1xuICAgIH1cbiAgICBpZiAoZWRnZTEuUHJldkluU0VMID09PSBudWxsKVxuICAgICAgdGhpcy5tX1NvcnRlZEVkZ2VzID0gZWRnZTE7XG4gICAgZWxzZSBpZiAoZWRnZTIuUHJldkluU0VMID09PSBudWxsKVxuICAgICAgdGhpcy5tX1NvcnRlZEVkZ2VzID0gZWRnZTI7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuQWRkTG9jYWxNYXhQb2x5ID0gZnVuY3Rpb24gKGUxLCBlMiwgcHQpXG4gIHtcbiAgICB0aGlzLkFkZE91dFB0KGUxLCBwdCk7XG4gICAgaWYgKGUyLldpbmREZWx0YSA9PSAwKSB0aGlzLkFkZE91dFB0KGUyLCBwdCk7XG4gICAgaWYgKGUxLk91dElkeCA9PSBlMi5PdXRJZHgpXG4gICAge1xuICAgICAgZTEuT3V0SWR4ID0gLTE7XG4gICAgICBlMi5PdXRJZHggPSAtMTtcbiAgICB9XG4gICAgZWxzZSBpZiAoZTEuT3V0SWR4IDwgZTIuT3V0SWR4KVxuICAgICAgdGhpcy5BcHBlbmRQb2x5Z29uKGUxLCBlMik7XG4gICAgZWxzZVxuICAgICAgdGhpcy5BcHBlbmRQb2x5Z29uKGUyLCBlMSk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuQWRkTG9jYWxNaW5Qb2x5ID0gZnVuY3Rpb24gKGUxLCBlMiwgcHQpXG4gIHtcbiAgICB2YXIgcmVzdWx0O1xuICAgIHZhciBlLCBwcmV2RTtcbiAgICBpZiAoQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Jc0hvcml6b250YWwoZTIpIHx8IChlMS5EeCA+IGUyLkR4KSlcbiAgICB7XG4gICAgICByZXN1bHQgPSB0aGlzLkFkZE91dFB0KGUxLCBwdCk7XG4gICAgICBlMi5PdXRJZHggPSBlMS5PdXRJZHg7XG4gICAgICBlMS5TaWRlID0gQ2xpcHBlckxpYi5FZGdlU2lkZS5lc0xlZnQ7XG4gICAgICBlMi5TaWRlID0gQ2xpcHBlckxpYi5FZGdlU2lkZS5lc1JpZ2h0O1xuICAgICAgZSA9IGUxO1xuICAgICAgaWYgKGUuUHJldkluQUVMID09IGUyKVxuICAgICAgICBwcmV2RSA9IGUyLlByZXZJbkFFTDtcbiAgICAgIGVsc2VcbiAgICAgICAgcHJldkUgPSBlLlByZXZJbkFFTDtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIHJlc3VsdCA9IHRoaXMuQWRkT3V0UHQoZTIsIHB0KTtcbiAgICAgIGUxLk91dElkeCA9IGUyLk91dElkeDtcbiAgICAgIGUxLlNpZGUgPSBDbGlwcGVyTGliLkVkZ2VTaWRlLmVzUmlnaHQ7XG4gICAgICBlMi5TaWRlID0gQ2xpcHBlckxpYi5FZGdlU2lkZS5lc0xlZnQ7XG4gICAgICBlID0gZTI7XG4gICAgICBpZiAoZS5QcmV2SW5BRUwgPT0gZTEpXG4gICAgICAgIHByZXZFID0gZTEuUHJldkluQUVMO1xuICAgICAgZWxzZVxuICAgICAgICBwcmV2RSA9IGUuUHJldkluQUVMO1xuICAgIH1cbiAgICBpZiAocHJldkUgIT09IG51bGwgJiYgcHJldkUuT3V0SWR4ID49IDAgJiYgKENsaXBwZXJMaWIuQ2xpcHBlci5Ub3BYKHByZXZFLCBwdC5ZKSA9PSBDbGlwcGVyTGliLkNsaXBwZXIuVG9wWChlLCBwdC5ZKSkgJiYgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5TbG9wZXNFcXVhbChlLCBwcmV2RSwgdGhpcy5tX1VzZUZ1bGxSYW5nZSkgJiYgKGUuV2luZERlbHRhICE9PSAwKSAmJiAocHJldkUuV2luZERlbHRhICE9PSAwKSlcbiAgICB7XG4gICAgICB2YXIgb3V0UHQgPSB0aGlzLkFkZE91dFB0KHByZXZFLCBwdCk7XG4gICAgICB0aGlzLkFkZEpvaW4ocmVzdWx0LCBvdXRQdCwgZS5Ub3ApO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkNyZWF0ZU91dFJlYyA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB2YXIgcmVzdWx0ID0gbmV3IENsaXBwZXJMaWIuT3V0UmVjKCk7XG4gICAgcmVzdWx0LklkeCA9IC0xO1xuICAgIHJlc3VsdC5Jc0hvbGUgPSBmYWxzZTtcbiAgICByZXN1bHQuSXNPcGVuID0gZmFsc2U7XG4gICAgcmVzdWx0LkZpcnN0TGVmdCA9IG51bGw7XG4gICAgcmVzdWx0LlB0cyA9IG51bGw7XG4gICAgcmVzdWx0LkJvdHRvbVB0ID0gbnVsbDtcbiAgICByZXN1bHQuUG9seU5vZGUgPSBudWxsO1xuICAgIHRoaXMubV9Qb2x5T3V0cy5wdXNoKHJlc3VsdCk7XG4gICAgcmVzdWx0LklkeCA9IHRoaXMubV9Qb2x5T3V0cy5sZW5ndGggLSAxO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuQWRkT3V0UHQgPSBmdW5jdGlvbiAoZSwgcHQpXG4gIHtcbiAgICB2YXIgVG9Gcm9udCA9IChlLlNpZGUgPT0gQ2xpcHBlckxpYi5FZGdlU2lkZS5lc0xlZnQpO1xuICAgIGlmIChlLk91dElkeCA8IDApXG4gICAge1xuICAgICAgdmFyIG91dFJlYyA9IHRoaXMuQ3JlYXRlT3V0UmVjKCk7XG4gICAgICBvdXRSZWMuSXNPcGVuID0gKGUuV2luZERlbHRhID09PSAwKTtcbiAgICAgIHZhciBuZXdPcCA9IG5ldyBDbGlwcGVyTGliLk91dFB0KCk7XG4gICAgICBvdXRSZWMuUHRzID0gbmV3T3A7XG4gICAgICBuZXdPcC5JZHggPSBvdXRSZWMuSWR4O1xuICAgICAgLy9uZXdPcC5QdCA9IHB0O1xuICAgICAgbmV3T3AuUHQuWCA9IHB0Llg7XG4gICAgICBuZXdPcC5QdC5ZID0gcHQuWTtcbiAgICAgIG5ld09wLk5leHQgPSBuZXdPcDtcbiAgICAgIG5ld09wLlByZXYgPSBuZXdPcDtcbiAgICAgIGlmICghb3V0UmVjLklzT3BlbilcbiAgICAgICAgdGhpcy5TZXRIb2xlU3RhdGUoZSwgb3V0UmVjKTtcbiAgICAgIGUuT3V0SWR4ID0gb3V0UmVjLklkeDtcbiAgICAgIC8vbmI6IGRvIHRoaXMgYWZ0ZXIgU2V0WiAhXG4gICAgICByZXR1cm4gbmV3T3A7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICB2YXIgb3V0UmVjID0gdGhpcy5tX1BvbHlPdXRzW2UuT3V0SWR4XTtcbiAgICAgIC8vT3V0UmVjLlB0cyBpcyB0aGUgJ0xlZnQtbW9zdCcgcG9pbnQgJiBPdXRSZWMuUHRzLlByZXYgaXMgdGhlICdSaWdodC1tb3N0J1xuICAgICAgdmFyIG9wID0gb3V0UmVjLlB0cztcbiAgICAgIGlmIChUb0Zyb250ICYmIENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocHQsIG9wLlB0KSlcbiAgICAgICAgcmV0dXJuIG9wO1xuICAgICAgZWxzZSBpZiAoIVRvRnJvbnQgJiYgQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwdCwgb3AuUHJldi5QdCkpXG4gICAgICAgIHJldHVybiBvcC5QcmV2O1xuICAgICAgdmFyIG5ld09wID0gbmV3IENsaXBwZXJMaWIuT3V0UHQoKTtcbiAgICAgIG5ld09wLklkeCA9IG91dFJlYy5JZHg7XG4gICAgICAvL25ld09wLlB0ID0gcHQ7XG4gICAgICBuZXdPcC5QdC5YID0gcHQuWDtcbiAgICAgIG5ld09wLlB0LlkgPSBwdC5ZO1xuICAgICAgbmV3T3AuTmV4dCA9IG9wO1xuICAgICAgbmV3T3AuUHJldiA9IG9wLlByZXY7XG4gICAgICBuZXdPcC5QcmV2Lk5leHQgPSBuZXdPcDtcbiAgICAgIG9wLlByZXYgPSBuZXdPcDtcbiAgICAgIGlmIChUb0Zyb250KVxuICAgICAgICBvdXRSZWMuUHRzID0gbmV3T3A7XG4gICAgICByZXR1cm4gbmV3T3A7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlN3YXBQb2ludHMgPSBmdW5jdGlvbiAocHQxLCBwdDIpXG4gIHtcbiAgICB2YXIgdG1wID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQocHQxLlZhbHVlKTtcbiAgICAvL3B0MS5WYWx1ZSA9IHB0Mi5WYWx1ZTtcbiAgICBwdDEuVmFsdWUuWCA9IHB0Mi5WYWx1ZS5YO1xuICAgIHB0MS5WYWx1ZS5ZID0gcHQyLlZhbHVlLlk7XG4gICAgLy9wdDIuVmFsdWUgPSB0bXA7XG4gICAgcHQyLlZhbHVlLlggPSB0bXAuWDtcbiAgICBwdDIuVmFsdWUuWSA9IHRtcC5ZO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkhvcnpTZWdtZW50c092ZXJsYXAgPSBmdW5jdGlvbiAoc2VnMWEsIHNlZzFiLCBzZWcyYSwgc2VnMmIpXG5cdHtcblx0XHR2YXIgdG1wO1xuXHRcdGlmIChzZWcxYSA+IHNlZzFiKVxuXHRcdHtcblx0XHRcdHRtcCA9IHNlZzFhO1xuXHRcdFx0c2VnMWEgPSBzZWcxYjtcblx0XHRcdHNlZzFiID0gdG1wO1xuXHRcdH1cblx0XHRpZiAoc2VnMmEgPiBzZWcyYilcblx0XHR7XG5cdFx0XHR0bXAgPSBzZWcyYTtcblx0XHRcdHNlZzJhID0gc2VnMmI7XG5cdFx0XHRzZWcyYiA9IHRtcDtcblx0XHR9XG5cdFx0cmV0dXJuIChzZWcxYSA8IHNlZzJiKSAmJiAoc2VnMmEgPCBzZWcxYik7XG5cdH1cblxuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlNldEhvbGVTdGF0ZSA9IGZ1bmN0aW9uIChlLCBvdXRSZWMpXG4gIHtcbiAgICB2YXIgaXNIb2xlID0gZmFsc2U7XG4gICAgdmFyIGUyID0gZS5QcmV2SW5BRUw7XG4gICAgd2hpbGUgKGUyICE9PSBudWxsKVxuICAgIHtcbiAgICAgIGlmIChlMi5PdXRJZHggPj0gMCAmJiBlMi5XaW5kRGVsdGEgIT0gMClcbiAgICAgIHtcbiAgICAgICAgaXNIb2xlID0gIWlzSG9sZTtcbiAgICAgICAgaWYgKG91dFJlYy5GaXJzdExlZnQgPT09IG51bGwpXG4gICAgICAgICAgb3V0UmVjLkZpcnN0TGVmdCA9IHRoaXMubV9Qb2x5T3V0c1tlMi5PdXRJZHhdO1xuICAgICAgfVxuICAgICAgZTIgPSBlMi5QcmV2SW5BRUw7XG4gICAgfVxuICAgIGlmIChpc0hvbGUpXG4gICAgICBvdXRSZWMuSXNIb2xlID0gdHJ1ZTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5HZXREeCA9IGZ1bmN0aW9uIChwdDEsIHB0MilcbiAge1xuICAgIGlmIChwdDEuWSA9PSBwdDIuWSlcbiAgICAgIHJldHVybiBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWw7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIChwdDIuWCAtIHB0MS5YKSAvIChwdDIuWSAtIHB0MS5ZKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5GaXJzdElzQm90dG9tUHQgPSBmdW5jdGlvbiAoYnRtUHQxLCBidG1QdDIpXG4gIHtcbiAgICB2YXIgcCA9IGJ0bVB0MS5QcmV2O1xuICAgIHdoaWxlICgoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwLlB0LCBidG1QdDEuUHQpKSAmJiAocCAhPSBidG1QdDEpKVxuICAgICAgcCA9IHAuUHJldjtcbiAgICB2YXIgZHgxcCA9IE1hdGguYWJzKHRoaXMuR2V0RHgoYnRtUHQxLlB0LCBwLlB0KSk7XG4gICAgcCA9IGJ0bVB0MS5OZXh0O1xuICAgIHdoaWxlICgoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwLlB0LCBidG1QdDEuUHQpKSAmJiAocCAhPSBidG1QdDEpKVxuICAgICAgcCA9IHAuTmV4dDtcbiAgICB2YXIgZHgxbiA9IE1hdGguYWJzKHRoaXMuR2V0RHgoYnRtUHQxLlB0LCBwLlB0KSk7XG4gICAgcCA9IGJ0bVB0Mi5QcmV2O1xuICAgIHdoaWxlICgoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwLlB0LCBidG1QdDIuUHQpKSAmJiAocCAhPSBidG1QdDIpKVxuICAgICAgcCA9IHAuUHJldjtcbiAgICB2YXIgZHgycCA9IE1hdGguYWJzKHRoaXMuR2V0RHgoYnRtUHQyLlB0LCBwLlB0KSk7XG4gICAgcCA9IGJ0bVB0Mi5OZXh0O1xuICAgIHdoaWxlICgoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwLlB0LCBidG1QdDIuUHQpKSAmJiAocCAhPSBidG1QdDIpKVxuICAgICAgcCA9IHAuTmV4dDtcbiAgICB2YXIgZHgybiA9IE1hdGguYWJzKHRoaXMuR2V0RHgoYnRtUHQyLlB0LCBwLlB0KSk7XG4gICAgcmV0dXJuIChkeDFwID49IGR4MnAgJiYgZHgxcCA+PSBkeDJuKSB8fCAoZHgxbiA+PSBkeDJwICYmIGR4MW4gPj0gZHgybik7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuR2V0Qm90dG9tUHQgPSBmdW5jdGlvbiAocHApXG4gIHtcbiAgICB2YXIgZHVwcyA9IG51bGw7XG4gICAgdmFyIHAgPSBwcC5OZXh0O1xuICAgIHdoaWxlIChwICE9IHBwKVxuICAgIHtcbiAgICAgIGlmIChwLlB0LlkgPiBwcC5QdC5ZKVxuICAgICAge1xuICAgICAgICBwcCA9IHA7XG4gICAgICAgIGR1cHMgPSBudWxsO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAocC5QdC5ZID09IHBwLlB0LlkgJiYgcC5QdC5YIDw9IHBwLlB0LlgpXG4gICAgICB7XG4gICAgICAgIGlmIChwLlB0LlggPCBwcC5QdC5YKVxuICAgICAgICB7XG4gICAgICAgICAgZHVwcyA9IG51bGw7XG4gICAgICAgICAgcHAgPSBwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgIGlmIChwLk5leHQgIT0gcHAgJiYgcC5QcmV2ICE9IHBwKVxuICAgICAgICAgICAgZHVwcyA9IHA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHAgPSBwLk5leHQ7XG4gICAgfVxuICAgIGlmIChkdXBzICE9PSBudWxsKVxuICAgIHtcbiAgICAgIC8vdGhlcmUgYXBwZWFycyB0byBiZSBhdCBsZWFzdCAyIHZlcnRpY2VzIGF0IGJvdHRvbVB0IHNvIC4uLlxuICAgICAgd2hpbGUgKGR1cHMgIT0gcClcbiAgICAgIHtcbiAgICAgICAgaWYgKCF0aGlzLkZpcnN0SXNCb3R0b21QdChwLCBkdXBzKSlcbiAgICAgICAgICBwcCA9IGR1cHM7XG4gICAgICAgIGR1cHMgPSBkdXBzLk5leHQ7XG4gICAgICAgIHdoaWxlIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0luZXF1YWxpdHkoZHVwcy5QdCwgcHAuUHQpKVxuICAgICAgICAgIGR1cHMgPSBkdXBzLk5leHQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwcDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5HZXRMb3dlcm1vc3RSZWMgPSBmdW5jdGlvbiAob3V0UmVjMSwgb3V0UmVjMilcbiAge1xuICAgIC8vd29yayBvdXQgd2hpY2ggcG9seWdvbiBmcmFnbWVudCBoYXMgdGhlIGNvcnJlY3QgaG9sZSBzdGF0ZSAuLi5cbiAgICBpZiAob3V0UmVjMS5Cb3R0b21QdCA9PT0gbnVsbClcbiAgICAgIG91dFJlYzEuQm90dG9tUHQgPSB0aGlzLkdldEJvdHRvbVB0KG91dFJlYzEuUHRzKTtcbiAgICBpZiAob3V0UmVjMi5Cb3R0b21QdCA9PT0gbnVsbClcbiAgICAgIG91dFJlYzIuQm90dG9tUHQgPSB0aGlzLkdldEJvdHRvbVB0KG91dFJlYzIuUHRzKTtcbiAgICB2YXIgYlB0MSA9IG91dFJlYzEuQm90dG9tUHQ7XG4gICAgdmFyIGJQdDIgPSBvdXRSZWMyLkJvdHRvbVB0O1xuICAgIGlmIChiUHQxLlB0LlkgPiBiUHQyLlB0LlkpXG4gICAgICByZXR1cm4gb3V0UmVjMTtcbiAgICBlbHNlIGlmIChiUHQxLlB0LlkgPCBiUHQyLlB0LlkpXG4gICAgICByZXR1cm4gb3V0UmVjMjtcbiAgICBlbHNlIGlmIChiUHQxLlB0LlggPCBiUHQyLlB0LlgpXG4gICAgICByZXR1cm4gb3V0UmVjMTtcbiAgICBlbHNlIGlmIChiUHQxLlB0LlggPiBiUHQyLlB0LlgpXG4gICAgICByZXR1cm4gb3V0UmVjMjtcbiAgICBlbHNlIGlmIChiUHQxLk5leHQgPT0gYlB0MSlcbiAgICAgIHJldHVybiBvdXRSZWMyO1xuICAgIGVsc2UgaWYgKGJQdDIuTmV4dCA9PSBiUHQyKVxuICAgICAgcmV0dXJuIG91dFJlYzE7XG4gICAgZWxzZSBpZiAodGhpcy5GaXJzdElzQm90dG9tUHQoYlB0MSwgYlB0MikpXG4gICAgICByZXR1cm4gb3V0UmVjMTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gb3V0UmVjMjtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5QYXJhbTFSaWdodE9mUGFyYW0yID0gZnVuY3Rpb24gKG91dFJlYzEsIG91dFJlYzIpXG4gIHtcbiAgICBkbyB7XG4gICAgICBvdXRSZWMxID0gb3V0UmVjMS5GaXJzdExlZnQ7XG4gICAgICBpZiAob3V0UmVjMSA9PSBvdXRSZWMyKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgd2hpbGUgKG91dFJlYzEgIT09IG51bGwpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkdldE91dFJlYyA9IGZ1bmN0aW9uIChpZHgpXG4gIHtcbiAgICB2YXIgb3V0cmVjID0gdGhpcy5tX1BvbHlPdXRzW2lkeF07XG4gICAgd2hpbGUgKG91dHJlYyAhPSB0aGlzLm1fUG9seU91dHNbb3V0cmVjLklkeF0pXG4gICAgICBvdXRyZWMgPSB0aGlzLm1fUG9seU91dHNbb3V0cmVjLklkeF07XG4gICAgcmV0dXJuIG91dHJlYztcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5BcHBlbmRQb2x5Z29uID0gZnVuY3Rpb24gKGUxLCBlMilcbiAge1xuICAgIC8vZ2V0IHRoZSBzdGFydCBhbmQgZW5kcyBvZiBib3RoIG91dHB1dCBwb2x5Z29ucyAuLi5cbiAgICB2YXIgb3V0UmVjMSA9IHRoaXMubV9Qb2x5T3V0c1tlMS5PdXRJZHhdO1xuICAgIHZhciBvdXRSZWMyID0gdGhpcy5tX1BvbHlPdXRzW2UyLk91dElkeF07XG4gICAgdmFyIGhvbGVTdGF0ZVJlYztcbiAgICBpZiAodGhpcy5QYXJhbTFSaWdodE9mUGFyYW0yKG91dFJlYzEsIG91dFJlYzIpKVxuICAgICAgaG9sZVN0YXRlUmVjID0gb3V0UmVjMjtcbiAgICBlbHNlIGlmICh0aGlzLlBhcmFtMVJpZ2h0T2ZQYXJhbTIob3V0UmVjMiwgb3V0UmVjMSkpXG4gICAgICBob2xlU3RhdGVSZWMgPSBvdXRSZWMxO1xuICAgIGVsc2VcbiAgICAgIGhvbGVTdGF0ZVJlYyA9IHRoaXMuR2V0TG93ZXJtb3N0UmVjKG91dFJlYzEsIG91dFJlYzIpO1xuICAgIHZhciBwMV9sZnQgPSBvdXRSZWMxLlB0cztcbiAgICB2YXIgcDFfcnQgPSBwMV9sZnQuUHJldjtcbiAgICB2YXIgcDJfbGZ0ID0gb3V0UmVjMi5QdHM7XG4gICAgdmFyIHAyX3J0ID0gcDJfbGZ0LlByZXY7XG4gICAgdmFyIHNpZGU7XG4gICAgLy9qb2luIGUyIHBvbHkgb250byBlMSBwb2x5IGFuZCBkZWxldGUgcG9pbnRlcnMgdG8gZTIgLi4uXG4gICAgaWYgKGUxLlNpZGUgPT0gQ2xpcHBlckxpYi5FZGdlU2lkZS5lc0xlZnQpXG4gICAge1xuICAgICAgaWYgKGUyLlNpZGUgPT0gQ2xpcHBlckxpYi5FZGdlU2lkZS5lc0xlZnQpXG4gICAgICB7XG4gICAgICAgIC8veiB5IHggYSBiIGNcbiAgICAgICAgdGhpcy5SZXZlcnNlUG9seVB0TGlua3MocDJfbGZ0KTtcbiAgICAgICAgcDJfbGZ0Lk5leHQgPSBwMV9sZnQ7XG4gICAgICAgIHAxX2xmdC5QcmV2ID0gcDJfbGZ0O1xuICAgICAgICBwMV9ydC5OZXh0ID0gcDJfcnQ7XG4gICAgICAgIHAyX3J0LlByZXYgPSBwMV9ydDtcbiAgICAgICAgb3V0UmVjMS5QdHMgPSBwMl9ydDtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgLy94IHkgeiBhIGIgY1xuICAgICAgICBwMl9ydC5OZXh0ID0gcDFfbGZ0O1xuICAgICAgICBwMV9sZnQuUHJldiA9IHAyX3J0O1xuICAgICAgICBwMl9sZnQuUHJldiA9IHAxX3J0O1xuICAgICAgICBwMV9ydC5OZXh0ID0gcDJfbGZ0O1xuICAgICAgICBvdXRSZWMxLlB0cyA9IHAyX2xmdDtcbiAgICAgIH1cbiAgICAgIHNpZGUgPSBDbGlwcGVyTGliLkVkZ2VTaWRlLmVzTGVmdDtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIGlmIChlMi5TaWRlID09IENsaXBwZXJMaWIuRWRnZVNpZGUuZXNSaWdodClcbiAgICAgIHtcbiAgICAgICAgLy9hIGIgYyB6IHkgeFxuICAgICAgICB0aGlzLlJldmVyc2VQb2x5UHRMaW5rcyhwMl9sZnQpO1xuICAgICAgICBwMV9ydC5OZXh0ID0gcDJfcnQ7XG4gICAgICAgIHAyX3J0LlByZXYgPSBwMV9ydDtcbiAgICAgICAgcDJfbGZ0Lk5leHQgPSBwMV9sZnQ7XG4gICAgICAgIHAxX2xmdC5QcmV2ID0gcDJfbGZ0O1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICAvL2EgYiBjIHggeSB6XG4gICAgICAgIHAxX3J0Lk5leHQgPSBwMl9sZnQ7XG4gICAgICAgIHAyX2xmdC5QcmV2ID0gcDFfcnQ7XG4gICAgICAgIHAxX2xmdC5QcmV2ID0gcDJfcnQ7XG4gICAgICAgIHAyX3J0Lk5leHQgPSBwMV9sZnQ7XG4gICAgICB9XG4gICAgICBzaWRlID0gQ2xpcHBlckxpYi5FZGdlU2lkZS5lc1JpZ2h0O1xuICAgIH1cbiAgICBvdXRSZWMxLkJvdHRvbVB0ID0gbnVsbDtcbiAgICBpZiAoaG9sZVN0YXRlUmVjID09IG91dFJlYzIpXG4gICAge1xuICAgICAgaWYgKG91dFJlYzIuRmlyc3RMZWZ0ICE9IG91dFJlYzEpXG4gICAgICAgIG91dFJlYzEuRmlyc3RMZWZ0ID0gb3V0UmVjMi5GaXJzdExlZnQ7XG4gICAgICBvdXRSZWMxLklzSG9sZSA9IG91dFJlYzIuSXNIb2xlO1xuICAgIH1cbiAgICBvdXRSZWMyLlB0cyA9IG51bGw7XG4gICAgb3V0UmVjMi5Cb3R0b21QdCA9IG51bGw7XG4gICAgb3V0UmVjMi5GaXJzdExlZnQgPSBvdXRSZWMxO1xuICAgIHZhciBPS0lkeCA9IGUxLk91dElkeDtcbiAgICB2YXIgT2Jzb2xldGVJZHggPSBlMi5PdXRJZHg7XG4gICAgZTEuT3V0SWR4ID0gLTE7XG4gICAgLy9uYjogc2FmZSBiZWNhdXNlIHdlIG9ubHkgZ2V0IGhlcmUgdmlhIEFkZExvY2FsTWF4UG9seVxuICAgIGUyLk91dElkeCA9IC0xO1xuICAgIHZhciBlID0gdGhpcy5tX0FjdGl2ZUVkZ2VzO1xuICAgIHdoaWxlIChlICE9PSBudWxsKVxuICAgIHtcbiAgICAgIGlmIChlLk91dElkeCA9PSBPYnNvbGV0ZUlkeClcbiAgICAgIHtcbiAgICAgICAgZS5PdXRJZHggPSBPS0lkeDtcbiAgICAgICAgZS5TaWRlID0gc2lkZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBlID0gZS5OZXh0SW5BRUw7XG4gICAgfVxuICAgIG91dFJlYzIuSWR4ID0gb3V0UmVjMS5JZHg7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuUmV2ZXJzZVBvbHlQdExpbmtzID0gZnVuY3Rpb24gKHBwKVxuICB7XG4gICAgaWYgKHBwID09PSBudWxsKVxuICAgICAgcmV0dXJuO1xuICAgIHZhciBwcDE7XG4gICAgdmFyIHBwMjtcbiAgICBwcDEgPSBwcDtcbiAgICBkbyB7XG4gICAgICBwcDIgPSBwcDEuTmV4dDtcbiAgICAgIHBwMS5OZXh0ID0gcHAxLlByZXY7XG4gICAgICBwcDEuUHJldiA9IHBwMjtcbiAgICAgIHBwMSA9IHBwMjtcbiAgICB9XG4gICAgd2hpbGUgKHBwMSAhPSBwcClcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLlN3YXBTaWRlcyA9IGZ1bmN0aW9uIChlZGdlMSwgZWRnZTIpXG4gIHtcbiAgICB2YXIgc2lkZSA9IGVkZ2UxLlNpZGU7XG4gICAgZWRnZTEuU2lkZSA9IGVkZ2UyLlNpZGU7XG4gICAgZWRnZTIuU2lkZSA9IHNpZGU7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5Td2FwUG9seUluZGV4ZXMgPSBmdW5jdGlvbiAoZWRnZTEsIGVkZ2UyKVxuICB7XG4gICAgdmFyIG91dElkeCA9IGVkZ2UxLk91dElkeDtcbiAgICBlZGdlMS5PdXRJZHggPSBlZGdlMi5PdXRJZHg7XG4gICAgZWRnZTIuT3V0SWR4ID0gb3V0SWR4O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkludGVyc2VjdEVkZ2VzID0gZnVuY3Rpb24gKGUxLCBlMiwgcHQpXG4gIHtcbiAgICAvL2UxIHdpbGwgYmUgdG8gdGhlIGxlZnQgb2YgZTIgQkVMT1cgdGhlIGludGVyc2VjdGlvbi4gVGhlcmVmb3JlIGUxIGlzIGJlZm9yZVxuICAgIC8vZTIgaW4gQUVMIGV4Y2VwdCB3aGVuIGUxIGlzIGJlaW5nIGluc2VydGVkIGF0IHRoZSBpbnRlcnNlY3Rpb24gcG9pbnQgLi4uXG4gICAgdmFyIGUxQ29udHJpYnV0aW5nID0gKGUxLk91dElkeCA+PSAwKTtcbiAgICB2YXIgZTJDb250cmlidXRpbmcgPSAoZTIuT3V0SWR4ID49IDApO1xuXG4gICAgaWYgKHVzZV94eXopXG4gICAgXHR0aGlzLlNldFoocHQsIGUxLCBlMik7XG5cbiAgICBpZiAodXNlX2xpbmVzKVxuICAgIHtcbiAgICAgIC8vaWYgZWl0aGVyIGVkZ2UgaXMgb24gYW4gT1BFTiBwYXRoIC4uLlxuICAgICAgaWYgKGUxLldpbmREZWx0YSA9PT0gMCB8fCBlMi5XaW5kRGVsdGEgPT09IDApXG4gICAgICB7XG4gICAgICAgIC8vaWdub3JlIHN1YmplY3Qtc3ViamVjdCBvcGVuIHBhdGggaW50ZXJzZWN0aW9ucyBVTkxFU1MgdGhleVxuICAgICAgICAvL2FyZSBib3RoIG9wZW4gcGF0aHMsIEFORCB0aGV5IGFyZSBib3RoICdjb250cmlidXRpbmcgbWF4aW1hcycgLi4uXG5cdFx0XHRcdGlmIChlMS5XaW5kRGVsdGEgPT0gMCAmJiBlMi5XaW5kRGVsdGEgPT0gMCkgcmV0dXJuO1xuICAgICAgICAvL2lmIGludGVyc2VjdGluZyBhIHN1YmogbGluZSB3aXRoIGEgc3ViaiBwb2x5IC4uLlxuICAgICAgICBlbHNlIGlmIChlMS5Qb2x5VHlwID09IGUyLlBvbHlUeXAgJiZcbiAgICAgICAgICBlMS5XaW5kRGVsdGEgIT0gZTIuV2luZERlbHRhICYmIHRoaXMubV9DbGlwVHlwZSA9PSBDbGlwcGVyTGliLkNsaXBUeXBlLmN0VW5pb24pXG4gICAgICAgIHtcbiAgICAgICAgICBpZiAoZTEuV2luZERlbHRhID09PSAwKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGlmIChlMkNvbnRyaWJ1dGluZylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdGhpcy5BZGRPdXRQdChlMSwgcHQpO1xuICAgICAgICAgICAgICBpZiAoZTFDb250cmlidXRpbmcpXG4gICAgICAgICAgICAgICAgZTEuT3V0SWR4ID0gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpZiAoZTFDb250cmlidXRpbmcpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHRoaXMuQWRkT3V0UHQoZTIsIHB0KTtcbiAgICAgICAgICAgICAgaWYgKGUyQ29udHJpYnV0aW5nKVxuICAgICAgICAgICAgICAgIGUyLk91dElkeCA9IC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChlMS5Qb2x5VHlwICE9IGUyLlBvbHlUeXApXG4gICAgICAgIHtcbiAgICAgICAgICBpZiAoKGUxLldpbmREZWx0YSA9PT0gMCkgJiYgTWF0aC5hYnMoZTIuV2luZENudCkgPT0gMSAmJlxuICAgICAgICAgICAgKHRoaXMubV9DbGlwVHlwZSAhPSBDbGlwcGVyTGliLkNsaXBUeXBlLmN0VW5pb24gfHwgZTIuV2luZENudDIgPT09IDApKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuQWRkT3V0UHQoZTEsIHB0KTtcbiAgICAgICAgICAgIGlmIChlMUNvbnRyaWJ1dGluZylcbiAgICAgICAgICAgICAgZTEuT3V0SWR4ID0gLTE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKChlMi5XaW5kRGVsdGEgPT09IDApICYmIChNYXRoLmFicyhlMS5XaW5kQ250KSA9PSAxKSAmJlxuICAgICAgICAgICAgKHRoaXMubV9DbGlwVHlwZSAhPSBDbGlwcGVyTGliLkNsaXBUeXBlLmN0VW5pb24gfHwgZTEuV2luZENudDIgPT09IDApKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuQWRkT3V0UHQoZTIsIHB0KTtcbiAgICAgICAgICAgIGlmIChlMkNvbnRyaWJ1dGluZylcbiAgICAgICAgICAgICAgZTIuT3V0SWR4ID0gLTE7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgLy91cGRhdGUgd2luZGluZyBjb3VudHMuLi5cbiAgICAvL2Fzc3VtZXMgdGhhdCBlMSB3aWxsIGJlIHRvIHRoZSBSaWdodCBvZiBlMiBBQk9WRSB0aGUgaW50ZXJzZWN0aW9uXG4gICAgaWYgKGUxLlBvbHlUeXAgPT0gZTIuUG9seVR5cClcbiAgICB7XG4gICAgICBpZiAodGhpcy5Jc0V2ZW5PZGRGaWxsVHlwZShlMSkpXG4gICAgICB7XG4gICAgICAgIHZhciBvbGRFMVdpbmRDbnQgPSBlMS5XaW5kQ250O1xuICAgICAgICBlMS5XaW5kQ250ID0gZTIuV2luZENudDtcbiAgICAgICAgZTIuV2luZENudCA9IG9sZEUxV2luZENudDtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgaWYgKGUxLldpbmRDbnQgKyBlMi5XaW5kRGVsdGEgPT09IDApXG4gICAgICAgICAgZTEuV2luZENudCA9IC1lMS5XaW5kQ250O1xuICAgICAgICBlbHNlXG4gICAgICAgICAgZTEuV2luZENudCArPSBlMi5XaW5kRGVsdGE7XG4gICAgICAgIGlmIChlMi5XaW5kQ250IC0gZTEuV2luZERlbHRhID09PSAwKVxuICAgICAgICAgIGUyLldpbmRDbnQgPSAtZTIuV2luZENudDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGUyLldpbmRDbnQgLT0gZTEuV2luZERlbHRhO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgaWYgKCF0aGlzLklzRXZlbk9kZEZpbGxUeXBlKGUyKSlcbiAgICAgICAgZTEuV2luZENudDIgKz0gZTIuV2luZERlbHRhO1xuICAgICAgZWxzZVxuICAgICAgICBlMS5XaW5kQ250MiA9IChlMS5XaW5kQ250MiA9PT0gMCkgPyAxIDogMDtcbiAgICAgIGlmICghdGhpcy5Jc0V2ZW5PZGRGaWxsVHlwZShlMSkpXG4gICAgICAgIGUyLldpbmRDbnQyIC09IGUxLldpbmREZWx0YTtcbiAgICAgIGVsc2VcbiAgICAgICAgZTIuV2luZENudDIgPSAoZTIuV2luZENudDIgPT09IDApID8gMSA6IDA7XG4gICAgfVxuICAgIHZhciBlMUZpbGxUeXBlLCBlMkZpbGxUeXBlLCBlMUZpbGxUeXBlMiwgZTJGaWxsVHlwZTI7XG4gICAgaWYgKGUxLlBvbHlUeXAgPT0gQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdFN1YmplY3QpXG4gICAge1xuICAgICAgZTFGaWxsVHlwZSA9IHRoaXMubV9TdWJqRmlsbFR5cGU7XG4gICAgICBlMUZpbGxUeXBlMiA9IHRoaXMubV9DbGlwRmlsbFR5cGU7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBlMUZpbGxUeXBlID0gdGhpcy5tX0NsaXBGaWxsVHlwZTtcbiAgICAgIGUxRmlsbFR5cGUyID0gdGhpcy5tX1N1YmpGaWxsVHlwZTtcbiAgICB9XG4gICAgaWYgKGUyLlBvbHlUeXAgPT0gQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdFN1YmplY3QpXG4gICAge1xuICAgICAgZTJGaWxsVHlwZSA9IHRoaXMubV9TdWJqRmlsbFR5cGU7XG4gICAgICBlMkZpbGxUeXBlMiA9IHRoaXMubV9DbGlwRmlsbFR5cGU7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBlMkZpbGxUeXBlID0gdGhpcy5tX0NsaXBGaWxsVHlwZTtcbiAgICAgIGUyRmlsbFR5cGUyID0gdGhpcy5tX1N1YmpGaWxsVHlwZTtcbiAgICB9XG4gICAgdmFyIGUxV2MsIGUyV2M7XG4gICAgc3dpdGNoIChlMUZpbGxUeXBlKVxuICAgIHtcbiAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdFBvc2l0aXZlOlxuICAgICAgZTFXYyA9IGUxLldpbmRDbnQ7XG4gICAgICBicmVhaztcbiAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5lZ2F0aXZlOlxuICAgICAgZTFXYyA9IC1lMS5XaW5kQ250O1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGUxV2MgPSBNYXRoLmFicyhlMS5XaW5kQ250KTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBzd2l0Y2ggKGUyRmlsbFR5cGUpXG4gICAge1xuICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0UG9zaXRpdmU6XG4gICAgICBlMldjID0gZTIuV2luZENudDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0TmVnYXRpdmU6XG4gICAgICBlMldjID0gLWUyLldpbmRDbnQ7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgZTJXYyA9IE1hdGguYWJzKGUyLldpbmRDbnQpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChlMUNvbnRyaWJ1dGluZyAmJiBlMkNvbnRyaWJ1dGluZylcbiAgICB7XG5cdFx0XHRpZiAoKGUxV2MgIT0gMCAmJiBlMVdjICE9IDEpIHx8IChlMldjICE9IDAgJiYgZTJXYyAhPSAxKSB8fFxuXHRcdFx0KGUxLlBvbHlUeXAgIT0gZTIuUG9seVR5cCAmJiB0aGlzLm1fQ2xpcFR5cGUgIT0gQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFhvcikpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuQWRkTG9jYWxNYXhQb2x5KGUxLCBlMiwgcHQpO1xuXHRcdFx0fVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICB0aGlzLkFkZE91dFB0KGUxLCBwdCk7XG4gICAgICAgIHRoaXMuQWRkT3V0UHQoZTIsIHB0KTtcbiAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyLlN3YXBTaWRlcyhlMSwgZTIpO1xuICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXIuU3dhcFBvbHlJbmRleGVzKGUxLCBlMik7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKGUxQ29udHJpYnV0aW5nKVxuICAgIHtcbiAgICAgIGlmIChlMldjID09PSAwIHx8IGUyV2MgPT0gMSlcbiAgICAgIHtcbiAgICAgICAgdGhpcy5BZGRPdXRQdChlMSwgcHQpO1xuICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXIuU3dhcFNpZGVzKGUxLCBlMik7XG4gICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlci5Td2FwUG9seUluZGV4ZXMoZTEsIGUyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoZTJDb250cmlidXRpbmcpXG4gICAge1xuICAgICAgaWYgKGUxV2MgPT09IDAgfHwgZTFXYyA9PSAxKVxuICAgICAge1xuICAgICAgICB0aGlzLkFkZE91dFB0KGUyLCBwdCk7XG4gICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlci5Td2FwU2lkZXMoZTEsIGUyKTtcbiAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyLlN3YXBQb2x5SW5kZXhlcyhlMSwgZTIpO1xuICAgICAgfVxuICAgIH1cblx0XHRlbHNlIGlmICggKGUxV2MgPT0gMCB8fCBlMVdjID09IDEpICYmIChlMldjID09IDAgfHwgZTJXYyA9PSAxKSlcbiAgICB7XG4gICAgICAvL25laXRoZXIgZWRnZSBpcyBjdXJyZW50bHkgY29udHJpYnV0aW5nIC4uLlxuICAgICAgdmFyIGUxV2MyLCBlMldjMjtcbiAgICAgIHN3aXRjaCAoZTFGaWxsVHlwZTIpXG4gICAgICB7XG4gICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdFBvc2l0aXZlOlxuICAgICAgICBlMVdjMiA9IGUxLldpbmRDbnQyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0TmVnYXRpdmU6XG4gICAgICAgIGUxV2MyID0gLWUxLldpbmRDbnQyO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGUxV2MyID0gTWF0aC5hYnMoZTEuV2luZENudDIpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHN3aXRjaCAoZTJGaWxsVHlwZTIpXG4gICAgICB7XG4gICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdFBvc2l0aXZlOlxuICAgICAgICBlMldjMiA9IGUyLldpbmRDbnQyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0TmVnYXRpdmU6XG4gICAgICAgIGUyV2MyID0gLWUyLldpbmRDbnQyO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGUyV2MyID0gTWF0aC5hYnMoZTIuV2luZENudDIpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChlMS5Qb2x5VHlwICE9IGUyLlBvbHlUeXApXG4gICAgICB7XG4gICAgICAgIHRoaXMuQWRkTG9jYWxNaW5Qb2x5KGUxLCBlMiwgcHQpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoZTFXYyA9PSAxICYmIGUyV2MgPT0gMSlcbiAgICAgICAgc3dpdGNoICh0aGlzLm1fQ2xpcFR5cGUpXG4gICAgICAgIHtcbiAgICAgICAgY2FzZSBDbGlwcGVyTGliLkNsaXBUeXBlLmN0SW50ZXJzZWN0aW9uOlxuICAgICAgICAgIGlmIChlMVdjMiA+IDAgJiYgZTJXYzIgPiAwKVxuICAgICAgICAgICAgdGhpcy5BZGRMb2NhbE1pblBvbHkoZTEsIGUyLCBwdCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFVuaW9uOlxuICAgICAgICAgIGlmIChlMVdjMiA8PSAwICYmIGUyV2MyIDw9IDApXG4gICAgICAgICAgICB0aGlzLkFkZExvY2FsTWluUG9seShlMSwgZTIsIHB0KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDbGlwcGVyTGliLkNsaXBUeXBlLmN0RGlmZmVyZW5jZTpcbiAgICAgICAgICBpZiAoKChlMS5Qb2x5VHlwID09IENsaXBwZXJMaWIuUG9seVR5cGUucHRDbGlwKSAmJiAoZTFXYzIgPiAwKSAmJiAoZTJXYzIgPiAwKSkgfHxcbiAgICAgICAgICAgICgoZTEuUG9seVR5cCA9PSBDbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdCkgJiYgKGUxV2MyIDw9IDApICYmIChlMldjMiA8PSAwKSkpXG4gICAgICAgICAgICB0aGlzLkFkZExvY2FsTWluUG9seShlMSwgZTIsIHB0KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDbGlwcGVyTGliLkNsaXBUeXBlLmN0WG9yOlxuICAgICAgICAgIHRoaXMuQWRkTG9jYWxNaW5Qb2x5KGUxLCBlMiwgcHQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBlbHNlXG4gICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlci5Td2FwU2lkZXMoZTEsIGUyKTtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRGVsZXRlRnJvbUFFTCA9IGZ1bmN0aW9uIChlKVxuICB7XG4gICAgdmFyIEFlbFByZXYgPSBlLlByZXZJbkFFTDtcbiAgICB2YXIgQWVsTmV4dCA9IGUuTmV4dEluQUVMO1xuICAgIGlmIChBZWxQcmV2ID09PSBudWxsICYmIEFlbE5leHQgPT09IG51bGwgJiYgKGUgIT0gdGhpcy5tX0FjdGl2ZUVkZ2VzKSlcbiAgICAgIHJldHVybjtcbiAgICAvL2FscmVhZHkgZGVsZXRlZFxuICAgIGlmIChBZWxQcmV2ICE9PSBudWxsKVxuICAgICAgQWVsUHJldi5OZXh0SW5BRUwgPSBBZWxOZXh0O1xuICAgIGVsc2VcbiAgICAgIHRoaXMubV9BY3RpdmVFZGdlcyA9IEFlbE5leHQ7XG4gICAgaWYgKEFlbE5leHQgIT09IG51bGwpXG4gICAgICBBZWxOZXh0LlByZXZJbkFFTCA9IEFlbFByZXY7XG4gICAgZS5OZXh0SW5BRUwgPSBudWxsO1xuICAgIGUuUHJldkluQUVMID0gbnVsbDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5EZWxldGVGcm9tU0VMID0gZnVuY3Rpb24gKGUpXG4gIHtcbiAgICB2YXIgU2VsUHJldiA9IGUuUHJldkluU0VMO1xuICAgIHZhciBTZWxOZXh0ID0gZS5OZXh0SW5TRUw7XG4gICAgaWYgKFNlbFByZXYgPT09IG51bGwgJiYgU2VsTmV4dCA9PT0gbnVsbCAmJiAoZSAhPSB0aGlzLm1fU29ydGVkRWRnZXMpKVxuICAgICAgcmV0dXJuO1xuICAgIC8vYWxyZWFkeSBkZWxldGVkXG4gICAgaWYgKFNlbFByZXYgIT09IG51bGwpXG4gICAgICBTZWxQcmV2Lk5leHRJblNFTCA9IFNlbE5leHQ7XG4gICAgZWxzZVxuICAgICAgdGhpcy5tX1NvcnRlZEVkZ2VzID0gU2VsTmV4dDtcbiAgICBpZiAoU2VsTmV4dCAhPT0gbnVsbClcbiAgICAgIFNlbE5leHQuUHJldkluU0VMID0gU2VsUHJldjtcbiAgICBlLk5leHRJblNFTCA9IG51bGw7XG4gICAgZS5QcmV2SW5TRUwgPSBudWxsO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlVwZGF0ZUVkZ2VJbnRvQUVMID0gZnVuY3Rpb24gKGUpXG4gIHtcbiAgICBpZiAoZS5OZXh0SW5MTUwgPT09IG51bGwpXG4gICAgICBDbGlwcGVyTGliLkVycm9yKFwiVXBkYXRlRWRnZUludG9BRUw6IGludmFsaWQgY2FsbFwiKTtcbiAgICB2YXIgQWVsUHJldiA9IGUuUHJldkluQUVMO1xuICAgIHZhciBBZWxOZXh0ID0gZS5OZXh0SW5BRUw7XG4gICAgZS5OZXh0SW5MTUwuT3V0SWR4ID0gZS5PdXRJZHg7XG4gICAgaWYgKEFlbFByZXYgIT09IG51bGwpXG4gICAgICBBZWxQcmV2Lk5leHRJbkFFTCA9IGUuTmV4dEluTE1MO1xuICAgIGVsc2VcbiAgICAgIHRoaXMubV9BY3RpdmVFZGdlcyA9IGUuTmV4dEluTE1MO1xuICAgIGlmIChBZWxOZXh0ICE9PSBudWxsKVxuICAgICAgQWVsTmV4dC5QcmV2SW5BRUwgPSBlLk5leHRJbkxNTDtcbiAgICBlLk5leHRJbkxNTC5TaWRlID0gZS5TaWRlO1xuICAgIGUuTmV4dEluTE1MLldpbmREZWx0YSA9IGUuV2luZERlbHRhO1xuICAgIGUuTmV4dEluTE1MLldpbmRDbnQgPSBlLldpbmRDbnQ7XG4gICAgZS5OZXh0SW5MTUwuV2luZENudDIgPSBlLldpbmRDbnQyO1xuICAgIGUgPSBlLk5leHRJbkxNTDtcbiAgICAvLyAgICBlLkN1cnIgPSBlLkJvdDtcbiAgICBlLkN1cnIuWCA9IGUuQm90Llg7XG4gICAgZS5DdXJyLlkgPSBlLkJvdC5ZO1xuICAgIGUuUHJldkluQUVMID0gQWVsUHJldjtcbiAgICBlLk5leHRJbkFFTCA9IEFlbE5leHQ7XG4gICAgaWYgKCFDbGlwcGVyTGliLkNsaXBwZXJCYXNlLklzSG9yaXpvbnRhbChlKSlcbiAgICAgIHRoaXMuSW5zZXJ0U2NhbmJlYW0oZS5Ub3AuWSk7XG4gICAgcmV0dXJuIGU7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuUHJvY2Vzc0hvcml6b250YWxzID0gZnVuY3Rpb24gKGlzVG9wT2ZTY2FuYmVhbSlcbiAge1xuICAgIHZhciBob3J6RWRnZSA9IHRoaXMubV9Tb3J0ZWRFZGdlcztcbiAgICB3aGlsZSAoaG9yekVkZ2UgIT09IG51bGwpXG4gICAge1xuICAgICAgdGhpcy5EZWxldGVGcm9tU0VMKGhvcnpFZGdlKTtcbiAgICAgIHRoaXMuUHJvY2Vzc0hvcml6b250YWwoaG9yekVkZ2UsIGlzVG9wT2ZTY2FuYmVhbSk7XG4gICAgICBob3J6RWRnZSA9IHRoaXMubV9Tb3J0ZWRFZGdlcztcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuR2V0SG9yekRpcmVjdGlvbiA9IGZ1bmN0aW9uIChIb3J6RWRnZSwgJHZhcilcbiAge1xuICAgIGlmIChIb3J6RWRnZS5Cb3QuWCA8IEhvcnpFZGdlLlRvcC5YKVxuICAgIHtcbiAgICAgICAgJHZhci5MZWZ0ID0gSG9yekVkZ2UuQm90Llg7XG4gICAgICAgICR2YXIuUmlnaHQgPSBIb3J6RWRnZS5Ub3AuWDtcbiAgICAgICAgJHZhci5EaXIgPSBDbGlwcGVyTGliLkRpcmVjdGlvbi5kTGVmdFRvUmlnaHQ7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAgICR2YXIuTGVmdCA9IEhvcnpFZGdlLlRvcC5YO1xuICAgICAgICAkdmFyLlJpZ2h0ID0gSG9yekVkZ2UuQm90Llg7XG4gICAgICAgICR2YXIuRGlyID0gQ2xpcHBlckxpYi5EaXJlY3Rpb24uZFJpZ2h0VG9MZWZ0O1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Qcm9jZXNzSG9yaXpvbnRhbCA9IGZ1bmN0aW9uIChob3J6RWRnZSwgaXNUb3BPZlNjYW5iZWFtKVxuICB7XG4gICAgdmFyICR2YXIgPSB7RGlyOiBudWxsLCBMZWZ0OiBudWxsLCBSaWdodDogbnVsbH07XG4gICAgdGhpcy5HZXRIb3J6RGlyZWN0aW9uKGhvcnpFZGdlLCAkdmFyKTtcbiAgICB2YXIgZGlyID0gJHZhci5EaXI7XG4gICAgdmFyIGhvcnpMZWZ0ID0gJHZhci5MZWZ0O1xuICAgIHZhciBob3J6UmlnaHQgPSAkdmFyLlJpZ2h0O1xuXG4gICAgdmFyIGVMYXN0SG9yeiA9IGhvcnpFZGdlLFxuICAgICAgZU1heFBhaXIgPSBudWxsO1xuICAgIHdoaWxlIChlTGFzdEhvcnouTmV4dEluTE1MICE9PSBudWxsICYmIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuSXNIb3Jpem9udGFsKGVMYXN0SG9yei5OZXh0SW5MTUwpKVxuICAgICAgZUxhc3RIb3J6ID0gZUxhc3RIb3J6Lk5leHRJbkxNTDtcbiAgICBpZiAoZUxhc3RIb3J6Lk5leHRJbkxNTCA9PT0gbnVsbClcbiAgICAgIGVNYXhQYWlyID0gdGhpcy5HZXRNYXhpbWFQYWlyKGVMYXN0SG9yeik7XG4gICAgZm9yICg7OylcbiAgICB7XG4gICAgICB2YXIgSXNMYXN0SG9yeiA9IChob3J6RWRnZSA9PSBlTGFzdEhvcnopO1xuICAgICAgdmFyIGUgPSB0aGlzLkdldE5leHRJbkFFTChob3J6RWRnZSwgZGlyKTtcbiAgICAgIHdoaWxlIChlICE9PSBudWxsKVxuICAgICAge1xuICAgICAgICAvL0JyZWFrIGlmIHdlJ3ZlIGdvdCB0byB0aGUgZW5kIG9mIGFuIGludGVybWVkaWF0ZSBob3Jpem9udGFsIGVkZ2UgLi4uXG4gICAgICAgIC8vbmI6IFNtYWxsZXIgRHgncyBhcmUgdG8gdGhlIHJpZ2h0IG9mIGxhcmdlciBEeCdzIEFCT1ZFIHRoZSBob3Jpem9udGFsLlxuICAgICAgICBpZiAoZS5DdXJyLlggPT0gaG9yekVkZ2UuVG9wLlggJiYgaG9yekVkZ2UuTmV4dEluTE1MICE9PSBudWxsICYmIGUuRHggPCBob3J6RWRnZS5OZXh0SW5MTUwuRHgpXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIHZhciBlTmV4dCA9IHRoaXMuR2V0TmV4dEluQUVMKGUsIGRpcik7XG4gICAgICAgIC8vc2F2ZXMgZU5leHQgZm9yIGxhdGVyXG4gICAgICAgIGlmICgoZGlyID09IENsaXBwZXJMaWIuRGlyZWN0aW9uLmRMZWZ0VG9SaWdodCAmJiBlLkN1cnIuWCA8PSBob3J6UmlnaHQpIHx8IChkaXIgPT0gQ2xpcHBlckxpYi5EaXJlY3Rpb24uZFJpZ2h0VG9MZWZ0ICYmIGUuQ3Vyci5YID49IGhvcnpMZWZ0KSlcbiAgICAgICAge1xuICAgICAgICAgIC8vc28gZmFyIHdlJ3JlIHN0aWxsIGluIHJhbmdlIG9mIHRoZSBob3Jpem9udGFsIEVkZ2UgIGJ1dCBtYWtlIHN1cmVcbiAgICAgICAgICAvL3dlJ3JlIGF0IHRoZSBsYXN0IG9mIGNvbnNlYy4gaG9yaXpvbnRhbHMgd2hlbiBtYXRjaGluZyB3aXRoIGVNYXhQYWlyXG4gICAgICAgICAgaWYgKGUgPT0gZU1heFBhaXIgJiYgSXNMYXN0SG9yeilcbiAgICAgICAgICB7XG5cdFx0XHRcdFx0XHRpZiAoaG9yekVkZ2UuT3V0SWR4ID49IDApXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHZhciBvcDEgPSB0aGlzLkFkZE91dFB0KGhvcnpFZGdlLCBob3J6RWRnZS5Ub3ApO1xuXHRcdFx0XHRcdFx0XHR2YXIgZU5leHRIb3J6ID0gdGhpcy5tX1NvcnRlZEVkZ2VzO1xuXHRcdFx0XHRcdFx0XHR3aGlsZSAoZU5leHRIb3J6ICE9PSBudWxsKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGVOZXh0SG9yei5PdXRJZHggPj0gMCAmJlxuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5Ib3J6U2VnbWVudHNPdmVybGFwKGhvcnpFZGdlLkJvdC5YLFxuXHRcdFx0XHRcdFx0XHRcdFx0aG9yekVkZ2UuVG9wLlgsIGVOZXh0SG9yei5Cb3QuWCwgZU5leHRIb3J6LlRvcC5YKSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHR2YXIgb3AyID0gdGhpcy5BZGRPdXRQdChlTmV4dEhvcnosIGVOZXh0SG9yei5Cb3QpO1xuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5BZGRKb2luKG9wMiwgb3AxLCBlTmV4dEhvcnouVG9wKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0ZU5leHRIb3J6ID0gZU5leHRIb3J6Lk5leHRJblNFTDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR0aGlzLkFkZEdob3N0Sm9pbihvcDEsIGhvcnpFZGdlLkJvdCk7XG5cdFx0XHRcdFx0XHRcdHRoaXMuQWRkTG9jYWxNYXhQb2x5KGhvcnpFZGdlLCBlTWF4UGFpciwgaG9yekVkZ2UuVG9wKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHRoaXMuRGVsZXRlRnJvbUFFTChob3J6RWRnZSk7XG5cdFx0XHRcdFx0XHR0aGlzLkRlbGV0ZUZyb21BRUwoZU1heFBhaXIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChkaXIgPT0gQ2xpcHBlckxpYi5EaXJlY3Rpb24uZExlZnRUb1JpZ2h0KVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZhciBQdCA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KGUuQ3Vyci5YLCBob3J6RWRnZS5DdXJyLlkpO1xuICAgICAgICAgICAgdGhpcy5JbnRlcnNlY3RFZGdlcyhob3J6RWRnZSwgZSwgUHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgdmFyIFB0ID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQoZS5DdXJyLlgsIGhvcnpFZGdlLkN1cnIuWSk7XG4gICAgICAgICAgICB0aGlzLkludGVyc2VjdEVkZ2VzKGUsIGhvcnpFZGdlLCBQdCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuU3dhcFBvc2l0aW9uc0luQUVMKGhvcnpFZGdlLCBlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICgoZGlyID09IENsaXBwZXJMaWIuRGlyZWN0aW9uLmRMZWZ0VG9SaWdodCAmJiBlLkN1cnIuWCA+PSBob3J6UmlnaHQpIHx8IChkaXIgPT0gQ2xpcHBlckxpYi5EaXJlY3Rpb24uZFJpZ2h0VG9MZWZ0ICYmIGUuQ3Vyci5YIDw9IGhvcnpMZWZ0KSlcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZSA9IGVOZXh0O1xuICAgICAgfVxuICAgICAgLy9lbmQgd2hpbGVcbiAgICAgIGlmIChob3J6RWRnZS5OZXh0SW5MTUwgIT09IG51bGwgJiYgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Jc0hvcml6b250YWwoaG9yekVkZ2UuTmV4dEluTE1MKSlcbiAgICAgIHtcbiAgICAgICAgaG9yekVkZ2UgPSB0aGlzLlVwZGF0ZUVkZ2VJbnRvQUVMKGhvcnpFZGdlKTtcbiAgICAgICAgaWYgKGhvcnpFZGdlLk91dElkeCA+PSAwKVxuICAgICAgICAgIHRoaXMuQWRkT3V0UHQoaG9yekVkZ2UsIGhvcnpFZGdlLkJvdCk7XG5cbiAgICAgICAgICB2YXIgJHZhciA9IHtEaXI6IGRpciwgTGVmdDogaG9yekxlZnQsIFJpZ2h0OiBob3J6UmlnaHR9O1xuICAgICAgICAgIHRoaXMuR2V0SG9yekRpcmVjdGlvbihob3J6RWRnZSwgJHZhcik7XG4gICAgICAgICAgZGlyID0gJHZhci5EaXI7XG4gICAgICAgICAgaG9yekxlZnQgPSAkdmFyLkxlZnQ7XG4gICAgICAgICAgaG9yelJpZ2h0ID0gJHZhci5SaWdodDtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIC8vZW5kIGZvciAoOzspXG4gICAgaWYgKGhvcnpFZGdlLk5leHRJbkxNTCAhPT0gbnVsbClcbiAgICB7XG4gICAgICBpZiAoaG9yekVkZ2UuT3V0SWR4ID49IDApXG4gICAgICB7XG4gICAgICAgIHZhciBvcDEgPSB0aGlzLkFkZE91dFB0KGhvcnpFZGdlLCBob3J6RWRnZS5Ub3ApO1xuXHRcdFx0XHRpZiAoaXNUb3BPZlNjYW5iZWFtKSB0aGlzLkFkZEdob3N0Sm9pbihvcDEsIGhvcnpFZGdlLkJvdCk7XG4gICAgICAgIGhvcnpFZGdlID0gdGhpcy5VcGRhdGVFZGdlSW50b0FFTChob3J6RWRnZSk7XG4gICAgICAgIGlmIChob3J6RWRnZS5XaW5kRGVsdGEgPT09IDApXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICAvL25iOiBIb3J6RWRnZSBpcyBubyBsb25nZXIgaG9yaXpvbnRhbCBoZXJlXG4gICAgICAgIHZhciBlUHJldiA9IGhvcnpFZGdlLlByZXZJbkFFTDtcbiAgICAgICAgdmFyIGVOZXh0ID0gaG9yekVkZ2UuTmV4dEluQUVMO1xuICAgICAgICBpZiAoZVByZXYgIT09IG51bGwgJiYgZVByZXYuQ3Vyci5YID09IGhvcnpFZGdlLkJvdC5YICYmXG4gICAgICAgICAgZVByZXYuQ3Vyci5ZID09IGhvcnpFZGdlLkJvdC5ZICYmIGVQcmV2LldpbmREZWx0YSAhPT0gMCAmJlxuICAgICAgICAgIChlUHJldi5PdXRJZHggPj0gMCAmJiBlUHJldi5DdXJyLlkgPiBlUHJldi5Ub3AuWSAmJlxuICAgICAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5TbG9wZXNFcXVhbChob3J6RWRnZSwgZVByZXYsIHRoaXMubV9Vc2VGdWxsUmFuZ2UpKSlcbiAgICAgICAge1xuICAgICAgICAgIHZhciBvcDIgPSB0aGlzLkFkZE91dFB0KGVQcmV2LCBob3J6RWRnZS5Cb3QpO1xuICAgICAgICAgIHRoaXMuQWRkSm9pbihvcDEsIG9wMiwgaG9yekVkZ2UuVG9wKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChlTmV4dCAhPT0gbnVsbCAmJiBlTmV4dC5DdXJyLlggPT0gaG9yekVkZ2UuQm90LlggJiZcbiAgICAgICAgICBlTmV4dC5DdXJyLlkgPT0gaG9yekVkZ2UuQm90LlkgJiYgZU5leHQuV2luZERlbHRhICE9PSAwICYmXG4gICAgICAgICAgZU5leHQuT3V0SWR4ID49IDAgJiYgZU5leHQuQ3Vyci5ZID4gZU5leHQuVG9wLlkgJiZcbiAgICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNsb3Blc0VxdWFsKGhvcnpFZGdlLCBlTmV4dCwgdGhpcy5tX1VzZUZ1bGxSYW5nZSkpXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgb3AyID0gdGhpcy5BZGRPdXRQdChlTmV4dCwgaG9yekVkZ2UuQm90KTtcbiAgICAgICAgICB0aGlzLkFkZEpvaW4ob3AxLCBvcDIsIGhvcnpFZGdlLlRvcCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaG9yekVkZ2UgPSB0aGlzLlVwZGF0ZUVkZ2VJbnRvQUVMKGhvcnpFZGdlKTtcbiAgICB9XG4gIFx0ZWxzZVxuICAgIHtcbiAgICAgIGlmIChob3J6RWRnZS5PdXRJZHggPj0gMClcbiAgICAgICAgdGhpcy5BZGRPdXRQdChob3J6RWRnZSwgaG9yekVkZ2UuVG9wKTtcbiAgICAgIHRoaXMuRGVsZXRlRnJvbUFFTChob3J6RWRnZSk7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkdldE5leHRJbkFFTCA9IGZ1bmN0aW9uIChlLCBEaXJlY3Rpb24pXG4gIHtcbiAgICByZXR1cm4gRGlyZWN0aW9uID09IENsaXBwZXJMaWIuRGlyZWN0aW9uLmRMZWZ0VG9SaWdodCA/IGUuTmV4dEluQUVMIDogZS5QcmV2SW5BRUw7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuSXNNaW5pbWEgPSBmdW5jdGlvbiAoZSlcbiAge1xuICAgIHJldHVybiBlICE9PSBudWxsICYmIChlLlByZXYuTmV4dEluTE1MICE9IGUpICYmIChlLk5leHQuTmV4dEluTE1MICE9IGUpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLklzTWF4aW1hID0gZnVuY3Rpb24gKGUsIFkpXG4gIHtcbiAgICByZXR1cm4gKGUgIT09IG51bGwgJiYgZS5Ub3AuWSA9PSBZICYmIGUuTmV4dEluTE1MID09PSBudWxsKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Jc0ludGVybWVkaWF0ZSA9IGZ1bmN0aW9uIChlLCBZKVxuICB7XG4gICAgcmV0dXJuIChlLlRvcC5ZID09IFkgJiYgZS5OZXh0SW5MTUwgIT09IG51bGwpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkdldE1heGltYVBhaXIgPSBmdW5jdGlvbiAoZSlcbiAge1xuICAgIHZhciByZXN1bHQgPSBudWxsO1xuICAgIGlmICgoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShlLk5leHQuVG9wLCBlLlRvcCkpICYmIGUuTmV4dC5OZXh0SW5MTUwgPT09IG51bGwpXG4gICAgICByZXN1bHQgPSBlLk5leHQ7XG4gICAgZWxzZSBpZiAoKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkoZS5QcmV2LlRvcCwgZS5Ub3ApKSAmJiBlLlByZXYuTmV4dEluTE1MID09PSBudWxsKVxuICAgICAgcmVzdWx0ID0gZS5QcmV2O1xuICAgIGlmIChyZXN1bHQgIT09IG51bGwgJiYgKHJlc3VsdC5PdXRJZHggPT0gLTIgfHwgKHJlc3VsdC5OZXh0SW5BRUwgPT0gcmVzdWx0LlByZXZJbkFFTCAmJiAhQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Jc0hvcml6b250YWwocmVzdWx0KSkpKVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlByb2Nlc3NJbnRlcnNlY3Rpb25zID0gZnVuY3Rpb24gKHRvcFkpXG4gIHtcbiAgICBpZiAodGhpcy5tX0FjdGl2ZUVkZ2VzID09IG51bGwpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB0cnlcbiAgICB7XG4gICAgICB0aGlzLkJ1aWxkSW50ZXJzZWN0TGlzdCh0b3BZKTtcbiAgICAgIGlmICh0aGlzLm1fSW50ZXJzZWN0TGlzdC5sZW5ndGggPT0gMClcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBpZiAodGhpcy5tX0ludGVyc2VjdExpc3QubGVuZ3RoID09IDEgfHwgdGhpcy5GaXh1cEludGVyc2VjdGlvbk9yZGVyKCkpXG4gICAgICAgIHRoaXMuUHJvY2Vzc0ludGVyc2VjdExpc3QoKTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjYXRjaCAoJCRlMilcbiAgICB7XG4gICAgICB0aGlzLm1fU29ydGVkRWRnZXMgPSBudWxsO1xuICAgICAgdGhpcy5tX0ludGVyc2VjdExpc3QubGVuZ3RoID0gMDtcbiAgICAgIENsaXBwZXJMaWIuRXJyb3IoXCJQcm9jZXNzSW50ZXJzZWN0aW9ucyBlcnJvclwiKTtcbiAgICB9XG4gICAgdGhpcy5tX1NvcnRlZEVkZ2VzID0gbnVsbDtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5CdWlsZEludGVyc2VjdExpc3QgPSBmdW5jdGlvbiAodG9wWSlcbiAge1xuICAgIGlmICh0aGlzLm1fQWN0aXZlRWRnZXMgPT09IG51bGwpXG4gICAgICByZXR1cm47XG4gICAgLy9wcmVwYXJlIGZvciBzb3J0aW5nIC4uLlxuICAgIHZhciBlID0gdGhpcy5tX0FjdGl2ZUVkZ2VzO1xuICAgIC8vY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoSlNPTi5kZWN5Y2xlKCBlICkpKTtcbiAgICB0aGlzLm1fU29ydGVkRWRnZXMgPSBlO1xuICAgIHdoaWxlIChlICE9PSBudWxsKVxuICAgIHtcbiAgICAgIGUuUHJldkluU0VMID0gZS5QcmV2SW5BRUw7XG4gICAgICBlLk5leHRJblNFTCA9IGUuTmV4dEluQUVMO1xuICAgICAgZS5DdXJyLlggPSBDbGlwcGVyTGliLkNsaXBwZXIuVG9wWChlLCB0b3BZKTtcbiAgICAgIGUgPSBlLk5leHRJbkFFTDtcbiAgICB9XG4gICAgLy9idWJibGVzb3J0IC4uLlxuICAgIHZhciBpc01vZGlmaWVkID0gdHJ1ZTtcbiAgICB3aGlsZSAoaXNNb2RpZmllZCAmJiB0aGlzLm1fU29ydGVkRWRnZXMgIT09IG51bGwpXG4gICAge1xuICAgICAgaXNNb2RpZmllZCA9IGZhbHNlO1xuICAgICAgZSA9IHRoaXMubV9Tb3J0ZWRFZGdlcztcbiAgICAgIHdoaWxlIChlLk5leHRJblNFTCAhPT0gbnVsbClcbiAgICAgIHtcbiAgICAgICAgdmFyIGVOZXh0ID0gZS5OZXh0SW5TRUw7XG4gICAgICAgIHZhciBwdCA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KCk7XG4gICAgICAgIC8vY29uc29sZS5sb2coXCJlLkN1cnIuWDogXCIgKyBlLkN1cnIuWCArIFwiIGVOZXh0LkN1cnIuWFwiICsgZU5leHQuQ3Vyci5YKTtcbiAgICAgICAgaWYgKGUuQ3Vyci5YID4gZU5leHQuQ3Vyci5YKVxuICAgICAgICB7XG5cdFx0XHRcdFx0dGhpcy5JbnRlcnNlY3RQb2ludChlLCBlTmV4dCwgcHQpO1xuICAgICAgICAgIHZhciBuZXdOb2RlID0gbmV3IENsaXBwZXJMaWIuSW50ZXJzZWN0Tm9kZSgpO1xuICAgICAgICAgIG5ld05vZGUuRWRnZTEgPSBlO1xuICAgICAgICAgIG5ld05vZGUuRWRnZTIgPSBlTmV4dDtcbiAgICAgICAgICAvL25ld05vZGUuUHQgPSBwdDtcbiAgICAgICAgICBuZXdOb2RlLlB0LlggPSBwdC5YO1xuICAgICAgICAgIG5ld05vZGUuUHQuWSA9IHB0Llk7XG4gICAgICAgICAgdGhpcy5tX0ludGVyc2VjdExpc3QucHVzaChuZXdOb2RlKTtcbiAgICAgICAgICB0aGlzLlN3YXBQb3NpdGlvbnNJblNFTChlLCBlTmV4dCk7XG4gICAgICAgICAgaXNNb2RpZmllZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIGUgPSBlTmV4dDtcbiAgICAgIH1cbiAgICAgIGlmIChlLlByZXZJblNFTCAhPT0gbnVsbClcbiAgICAgICAgZS5QcmV2SW5TRUwuTmV4dEluU0VMID0gbnVsbDtcbiAgICAgIGVsc2VcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHRoaXMubV9Tb3J0ZWRFZGdlcyA9IG51bGw7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRWRnZXNBZGphY2VudCA9IGZ1bmN0aW9uIChpbm9kZSlcbiAge1xuICAgIHJldHVybiAoaW5vZGUuRWRnZTEuTmV4dEluU0VMID09IGlub2RlLkVkZ2UyKSB8fCAoaW5vZGUuRWRnZTEuUHJldkluU0VMID09IGlub2RlLkVkZ2UyKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLkludGVyc2VjdE5vZGVTb3J0ID0gZnVuY3Rpb24gKG5vZGUxLCBub2RlMilcbiAge1xuICAgIC8vdGhlIGZvbGxvd2luZyB0eXBlY2FzdCBpcyBzYWZlIGJlY2F1c2UgdGhlIGRpZmZlcmVuY2VzIGluIFB0Llkgd2lsbFxuICAgIC8vYmUgbGltaXRlZCB0byB0aGUgaGVpZ2h0IG9mIHRoZSBzY2FuYmVhbS5cbiAgICByZXR1cm4gKG5vZGUyLlB0LlkgLSBub2RlMS5QdC5ZKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5GaXh1cEludGVyc2VjdGlvbk9yZGVyID0gZnVuY3Rpb24gKClcbiAge1xuICAgIC8vcHJlLWNvbmRpdGlvbjogaW50ZXJzZWN0aW9ucyBhcmUgc29ydGVkIGJvdHRvbS1tb3N0IGZpcnN0LlxuICAgIC8vTm93IGl0J3MgY3J1Y2lhbCB0aGF0IGludGVyc2VjdGlvbnMgYXJlIG1hZGUgb25seSBiZXR3ZWVuIGFkamFjZW50IGVkZ2VzLFxuICAgIC8vc28gdG8gZW5zdXJlIHRoaXMgdGhlIG9yZGVyIG9mIGludGVyc2VjdGlvbnMgbWF5IG5lZWQgYWRqdXN0aW5nIC4uLlxuICAgIHRoaXMubV9JbnRlcnNlY3RMaXN0LnNvcnQodGhpcy5tX0ludGVyc2VjdE5vZGVDb21wYXJlcik7XG4gICAgdGhpcy5Db3B5QUVMVG9TRUwoKTtcbiAgICB2YXIgY250ID0gdGhpcy5tX0ludGVyc2VjdExpc3QubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY250OyBpKyspXG4gICAge1xuICAgICAgaWYgKCF0aGlzLkVkZ2VzQWRqYWNlbnQodGhpcy5tX0ludGVyc2VjdExpc3RbaV0pKVxuICAgICAge1xuICAgICAgICB2YXIgaiA9IGkgKyAxO1xuICAgICAgICB3aGlsZSAoaiA8IGNudCAmJiAhdGhpcy5FZGdlc0FkamFjZW50KHRoaXMubV9JbnRlcnNlY3RMaXN0W2pdKSlcbiAgICAgICAgICBqKys7XG4gICAgICAgIGlmIChqID09IGNudClcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIHZhciB0bXAgPSB0aGlzLm1fSW50ZXJzZWN0TGlzdFtpXTtcbiAgICAgICAgdGhpcy5tX0ludGVyc2VjdExpc3RbaV0gPSB0aGlzLm1fSW50ZXJzZWN0TGlzdFtqXTtcbiAgICAgICAgdGhpcy5tX0ludGVyc2VjdExpc3Rbal0gPSB0bXA7XG4gICAgICB9XG4gICAgICB0aGlzLlN3YXBQb3NpdGlvbnNJblNFTCh0aGlzLm1fSW50ZXJzZWN0TGlzdFtpXS5FZGdlMSwgdGhpcy5tX0ludGVyc2VjdExpc3RbaV0uRWRnZTIpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Qcm9jZXNzSW50ZXJzZWN0TGlzdCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICBmb3IgKHZhciBpID0gMCwgaWxlbiA9IHRoaXMubV9JbnRlcnNlY3RMaXN0Lmxlbmd0aDsgaSA8IGlsZW47IGkrKylcbiAgICB7XG4gICAgICB2YXIgaU5vZGUgPSB0aGlzLm1fSW50ZXJzZWN0TGlzdFtpXTtcbiAgICAgIHRoaXMuSW50ZXJzZWN0RWRnZXMoaU5vZGUuRWRnZTEsIGlOb2RlLkVkZ2UyLCBpTm9kZS5QdCk7XG4gICAgICB0aGlzLlN3YXBQb3NpdGlvbnNJbkFFTChpTm9kZS5FZGdlMSwgaU5vZGUuRWRnZTIpO1xuICAgIH1cbiAgICB0aGlzLm1fSW50ZXJzZWN0TGlzdC5sZW5ndGggPSAwO1xuICB9O1xuICAvKlxuICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBSb3VuZCBzcGVlZHRlc3Q6IGh0dHA6Ly9qc3BlcmYuY29tL2Zhc3Rlc3Qtcm91bmRcbiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgKi9cbiAgdmFyIFIxID0gZnVuY3Rpb24gKGEpXG4gIHtcbiAgICByZXR1cm4gYSA8IDAgPyBNYXRoLmNlaWwoYSAtIDAuNSkgOiBNYXRoLnJvdW5kKGEpXG4gIH07XG4gIHZhciBSMiA9IGZ1bmN0aW9uIChhKVxuICB7XG4gICAgcmV0dXJuIGEgPCAwID8gTWF0aC5jZWlsKGEgLSAwLjUpIDogTWF0aC5mbG9vcihhICsgMC41KVxuICB9O1xuICB2YXIgUjMgPSBmdW5jdGlvbiAoYSlcbiAge1xuICAgIHJldHVybiBhIDwgMCA/IC1NYXRoLnJvdW5kKE1hdGguYWJzKGEpKSA6IE1hdGgucm91bmQoYSlcbiAgfTtcbiAgdmFyIFI0ID0gZnVuY3Rpb24gKGEpXG4gIHtcbiAgICBpZiAoYSA8IDApXG4gICAge1xuICAgICAgYSAtPSAwLjU7XG4gICAgICByZXR1cm4gYSA8IC0yMTQ3NDgzNjQ4ID8gTWF0aC5jZWlsKGEpIDogYSB8IDA7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBhICs9IDAuNTtcbiAgICAgIHJldHVybiBhID4gMjE0NzQ4MzY0NyA/IE1hdGguZmxvb3IoYSkgOiBhIHwgMDtcbiAgICB9XG4gIH07XG4gIGlmIChicm93c2VyLm1zaWUpIENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZCA9IFIxO1xuICBlbHNlIGlmIChicm93c2VyLmNocm9taXVtKSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQgPSBSMztcbiAgZWxzZSBpZiAoYnJvd3Nlci5zYWZhcmkpIENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZCA9IFI0O1xuICBlbHNlIENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZCA9IFIyOyAvLyBlZy4gYnJvd3Nlci5jaHJvbWUgfHwgYnJvd3Nlci5maXJlZm94IHx8IGJyb3dzZXIub3BlcmFcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLlRvcFggPSBmdW5jdGlvbiAoZWRnZSwgY3VycmVudFkpXG4gIHtcbiAgICAvL2lmIChlZGdlLkJvdCA9PSBlZGdlLkN1cnIpIGFsZXJ0IChcImVkZ2UuQm90ID0gZWRnZS5DdXJyXCIpO1xuICAgIC8vaWYgKGVkZ2UuQm90ID09IGVkZ2UuVG9wKSBhbGVydCAoXCJlZGdlLkJvdCA9IGVkZ2UuVG9wXCIpO1xuICAgIGlmIChjdXJyZW50WSA9PSBlZGdlLlRvcC5ZKVxuICAgICAgcmV0dXJuIGVkZ2UuVG9wLlg7XG4gICAgcmV0dXJuIGVkZ2UuQm90LlggKyBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQoZWRnZS5EeCAqIChjdXJyZW50WSAtIGVkZ2UuQm90LlkpKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5JbnRlcnNlY3RQb2ludCA9IGZ1bmN0aW9uIChlZGdlMSwgZWRnZTIsIGlwKVxuICB7XG4gICAgaXAuWCA9IDA7XG4gICAgaXAuWSA9IDA7XG4gICAgdmFyIGIxLCBiMjtcbiAgICAvL25iOiB3aXRoIHZlcnkgbGFyZ2UgY29vcmRpbmF0ZSB2YWx1ZXMsIGl0J3MgcG9zc2libGUgZm9yIFNsb3Blc0VxdWFsKCkgdG9cbiAgICAvL3JldHVybiBmYWxzZSBidXQgZm9yIHRoZSBlZGdlLkR4IHZhbHVlIGJlIGVxdWFsIGR1ZSB0byBkb3VibGUgcHJlY2lzaW9uIHJvdW5kaW5nLlxuICAgIGlmIChlZGdlMS5EeCA9PSBlZGdlMi5EeClcblx0XHR7XG5cdFx0XHRpcC5ZID0gZWRnZTEuQ3Vyci5ZO1xuXHRcdFx0aXAuWCA9IENsaXBwZXJMaWIuQ2xpcHBlci5Ub3BYKGVkZ2UxLCBpcC5ZKTtcblx0XHRcdHJldHVybjtcbiAgICB9XG4gICAgaWYgKGVkZ2UxLkRlbHRhLlggPT09IDApXG4gICAge1xuICAgICAgaXAuWCA9IGVkZ2UxLkJvdC5YO1xuICAgICAgaWYgKENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuSXNIb3Jpem9udGFsKGVkZ2UyKSlcbiAgICAgIHtcbiAgICAgICAgaXAuWSA9IGVkZ2UyLkJvdC5ZO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICBiMiA9IGVkZ2UyLkJvdC5ZIC0gKGVkZ2UyLkJvdC5YIC8gZWRnZTIuRHgpO1xuICAgICAgICBpcC5ZID0gQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kKGlwLlggLyBlZGdlMi5EeCArIGIyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoZWRnZTIuRGVsdGEuWCA9PT0gMClcbiAgICB7XG4gICAgICBpcC5YID0gZWRnZTIuQm90Llg7XG4gICAgICBpZiAoQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Jc0hvcml6b250YWwoZWRnZTEpKVxuICAgICAge1xuICAgICAgICBpcC5ZID0gZWRnZTEuQm90Llk7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIGIxID0gZWRnZTEuQm90LlkgLSAoZWRnZTEuQm90LlggLyBlZGdlMS5EeCk7XG4gICAgICAgIGlwLlkgPSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQoaXAuWCAvIGVkZ2UxLkR4ICsgYjEpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgYjEgPSBlZGdlMS5Cb3QuWCAtIGVkZ2UxLkJvdC5ZICogZWRnZTEuRHg7XG4gICAgICBiMiA9IGVkZ2UyLkJvdC5YIC0gZWRnZTIuQm90LlkgKiBlZGdlMi5EeDtcbiAgICAgIHZhciBxID0gKGIyIC0gYjEpIC8gKGVkZ2UxLkR4IC0gZWRnZTIuRHgpO1xuICAgICAgaXAuWSA9IENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZChxKTtcbiAgICAgIGlmIChNYXRoLmFicyhlZGdlMS5EeCkgPCBNYXRoLmFicyhlZGdlMi5EeCkpXG4gICAgICAgIGlwLlggPSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQoZWRnZTEuRHggKiBxICsgYjEpO1xuICAgICAgZWxzZVxuICAgICAgICBpcC5YID0gQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kKGVkZ2UyLkR4ICogcSArIGIyKTtcbiAgICB9XG4gICAgaWYgKGlwLlkgPCBlZGdlMS5Ub3AuWSB8fCBpcC5ZIDwgZWRnZTIuVG9wLlkpXG4gICAge1xuICAgICAgaWYgKGVkZ2UxLlRvcC5ZID4gZWRnZTIuVG9wLlkpXG4gICAgICB7XG4gICAgICAgIGlwLlkgPSBlZGdlMS5Ub3AuWTtcbiAgICAgICAgaXAuWCA9IENsaXBwZXJMaWIuQ2xpcHBlci5Ub3BYKGVkZ2UyLCBlZGdlMS5Ub3AuWSk7XG4gICAgICAgIHJldHVybiBpcC5YIDwgZWRnZTEuVG9wLlg7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICAgIGlwLlkgPSBlZGdlMi5Ub3AuWTtcbiAgICAgIGlmIChNYXRoLmFicyhlZGdlMS5EeCkgPCBNYXRoLmFicyhlZGdlMi5EeCkpXG4gICAgICAgIGlwLlggPSBDbGlwcGVyTGliLkNsaXBwZXIuVG9wWChlZGdlMSwgaXAuWSk7XG4gICAgICBlbHNlXG4gICAgICAgIGlwLlggPSBDbGlwcGVyTGliLkNsaXBwZXIuVG9wWChlZGdlMiwgaXAuWSk7XG4gICAgfVxuXHRcdC8vZmluYWxseSwgZG9uJ3QgYWxsb3cgJ2lwJyB0byBiZSBCRUxPVyBjdXJyLlkgKGllIGJvdHRvbSBvZiBzY2FuYmVhbSkgLi4uXG5cdFx0aWYgKGlwLlkgPiBlZGdlMS5DdXJyLlkpXG5cdFx0e1xuXHRcdFx0aXAuWSA9IGVkZ2UxLkN1cnIuWTtcblx0XHRcdC8vYmV0dGVyIHRvIHVzZSB0aGUgbW9yZSB2ZXJ0aWNhbCBlZGdlIHRvIGRlcml2ZSBYIC4uLlxuXHRcdFx0aWYgKE1hdGguYWJzKGVkZ2UxLkR4KSA+IE1hdGguYWJzKGVkZ2UyLkR4KSlcblx0XHRcdFx0aXAuWCA9IENsaXBwZXJMaWIuQ2xpcHBlci5Ub3BYKGVkZ2UyLCBpcC5ZKTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0aXAuWCA9IENsaXBwZXJMaWIuQ2xpcHBlci5Ub3BYKGVkZ2UxLCBpcC5ZKTtcblx0XHR9XG4gIH07XG5cbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Qcm9jZXNzRWRnZXNBdFRvcE9mU2NhbmJlYW0gPSBmdW5jdGlvbiAodG9wWSlcbiAge1xuICAgIHZhciBlID0gdGhpcy5tX0FjdGl2ZUVkZ2VzO1xuICAgIHdoaWxlIChlICE9PSBudWxsKVxuICAgIHtcbiAgICAgIC8vMS4gcHJvY2VzcyBtYXhpbWEsIHRyZWF0aW5nIHRoZW0gYXMgaWYgdGhleSdyZSAnYmVudCcgaG9yaXpvbnRhbCBlZGdlcyxcbiAgICAgIC8vICAgYnV0IGV4Y2x1ZGUgbWF4aW1hIHdpdGggaG9yaXpvbnRhbCBlZGdlcy4gbmI6IGUgY2FuJ3QgYmUgYSBob3Jpem9udGFsLlxuICAgICAgdmFyIElzTWF4aW1hRWRnZSA9IHRoaXMuSXNNYXhpbWEoZSwgdG9wWSk7XG4gICAgICBpZiAoSXNNYXhpbWFFZGdlKVxuICAgICAge1xuICAgICAgICB2YXIgZU1heFBhaXIgPSB0aGlzLkdldE1heGltYVBhaXIoZSk7XG4gICAgICAgIElzTWF4aW1hRWRnZSA9IChlTWF4UGFpciA9PT0gbnVsbCB8fCAhQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Jc0hvcml6b250YWwoZU1heFBhaXIpKTtcbiAgICAgIH1cbiAgICAgIGlmIChJc01heGltYUVkZ2UpXG4gICAgICB7XG4gICAgICAgIHZhciBlUHJldiA9IGUuUHJldkluQUVMO1xuICAgICAgICB0aGlzLkRvTWF4aW1hKGUpO1xuICAgICAgICBpZiAoZVByZXYgPT09IG51bGwpXG4gICAgICAgICAgZSA9IHRoaXMubV9BY3RpdmVFZGdlcztcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGUgPSBlUHJldi5OZXh0SW5BRUw7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIC8vMi4gcHJvbW90ZSBob3Jpem9udGFsIGVkZ2VzLCBvdGhlcndpc2UgdXBkYXRlIEN1cnIuWCBhbmQgQ3Vyci5ZIC4uLlxuICAgICAgICBpZiAodGhpcy5Jc0ludGVybWVkaWF0ZShlLCB0b3BZKSAmJiBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLklzSG9yaXpvbnRhbChlLk5leHRJbkxNTCkpXG4gICAgICAgIHtcbiAgICAgICAgICBlID0gdGhpcy5VcGRhdGVFZGdlSW50b0FFTChlKTtcbiAgICAgICAgICBpZiAoZS5PdXRJZHggPj0gMClcbiAgICAgICAgICAgIHRoaXMuQWRkT3V0UHQoZSwgZS5Cb3QpO1xuICAgICAgICAgIHRoaXMuQWRkRWRnZVRvU0VMKGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgIGUuQ3Vyci5YID0gQ2xpcHBlckxpYi5DbGlwcGVyLlRvcFgoZSwgdG9wWSk7XG4gICAgICAgICAgZS5DdXJyLlkgPSB0b3BZO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLlN0cmljdGx5U2ltcGxlKVxuICAgICAgICB7XG4gICAgICAgICAgdmFyIGVQcmV2ID0gZS5QcmV2SW5BRUw7XG4gICAgICAgICAgaWYgKChlLk91dElkeCA+PSAwKSAmJiAoZS5XaW5kRGVsdGEgIT09IDApICYmIGVQcmV2ICE9PSBudWxsICYmXG4gICAgICAgICAgICAoZVByZXYuT3V0SWR4ID49IDApICYmIChlUHJldi5DdXJyLlggPT0gZS5DdXJyLlgpICYmXG4gICAgICAgICAgICAoZVByZXYuV2luZERlbHRhICE9PSAwKSlcbiAgICAgICAgICB7XG4gICAgICAgICAgIFx0dmFyIGlwID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQoZS5DdXJyKTtcblxuXHRcdFx0XHRcdFx0aWYodXNlX3h5eilcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0dGhpcy5TZXRaKGlwLCBlUHJldiwgZSk7XG5cdFx0XHRcdFx0XHR9XG5cbiAgICAgICAgICAgIHZhciBvcCA9IHRoaXMuQWRkT3V0UHQoZVByZXYsIGlwKTtcbiAgICAgICAgICAgIHZhciBvcDIgPSB0aGlzLkFkZE91dFB0KGUsIGlwKTtcbiAgICAgICAgICAgIHRoaXMuQWRkSm9pbihvcCwgb3AyLCBpcCk7XG4gICAgICAgICAgICAvL1N0cmljdGx5U2ltcGxlICh0eXBlLTMpIGpvaW5cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZSA9IGUuTmV4dEluQUVMO1xuICAgICAgfVxuICAgIH1cbiAgICAvLzMuIFByb2Nlc3MgaG9yaXpvbnRhbHMgYXQgdGhlIFRvcCBvZiB0aGUgc2NhbmJlYW0gLi4uXG4gICAgdGhpcy5Qcm9jZXNzSG9yaXpvbnRhbHModHJ1ZSk7XG4gICAgLy80LiBQcm9tb3RlIGludGVybWVkaWF0ZSB2ZXJ0aWNlcyAuLi5cbiAgICBlID0gdGhpcy5tX0FjdGl2ZUVkZ2VzO1xuICAgIHdoaWxlIChlICE9PSBudWxsKVxuICAgIHtcbiAgICAgIGlmICh0aGlzLklzSW50ZXJtZWRpYXRlKGUsIHRvcFkpKVxuICAgICAge1xuICAgICAgICB2YXIgb3AgPSBudWxsO1xuICAgICAgICBpZiAoZS5PdXRJZHggPj0gMClcbiAgICAgICAgICBvcCA9IHRoaXMuQWRkT3V0UHQoZSwgZS5Ub3ApO1xuICAgICAgICBlID0gdGhpcy5VcGRhdGVFZGdlSW50b0FFTChlKTtcbiAgICAgICAgLy9pZiBvdXRwdXQgcG9seWdvbnMgc2hhcmUgYW4gZWRnZSwgdGhleSdsbCBuZWVkIGpvaW5pbmcgbGF0ZXIgLi4uXG4gICAgICAgIHZhciBlUHJldiA9IGUuUHJldkluQUVMO1xuICAgICAgICB2YXIgZU5leHQgPSBlLk5leHRJbkFFTDtcbiAgICAgICAgaWYgKGVQcmV2ICE9PSBudWxsICYmIGVQcmV2LkN1cnIuWCA9PSBlLkJvdC5YICYmXG4gICAgICAgICAgZVByZXYuQ3Vyci5ZID09IGUuQm90LlkgJiYgb3AgIT09IG51bGwgJiZcbiAgICAgICAgICBlUHJldi5PdXRJZHggPj0gMCAmJiBlUHJldi5DdXJyLlkgPiBlUHJldi5Ub3AuWSAmJlxuICAgICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2xvcGVzRXF1YWwoZSwgZVByZXYsIHRoaXMubV9Vc2VGdWxsUmFuZ2UpICYmXG4gICAgICAgICAgKGUuV2luZERlbHRhICE9PSAwKSAmJiAoZVByZXYuV2luZERlbHRhICE9PSAwKSlcbiAgICAgICAge1xuICAgICAgICAgIHZhciBvcDIgPSB0aGlzLkFkZE91dFB0KGVQcmV2LCBlLkJvdCk7XG4gICAgICAgICAgdGhpcy5BZGRKb2luKG9wLCBvcDIsIGUuVG9wKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChlTmV4dCAhPT0gbnVsbCAmJiBlTmV4dC5DdXJyLlggPT0gZS5Cb3QuWCAmJlxuICAgICAgICAgIGVOZXh0LkN1cnIuWSA9PSBlLkJvdC5ZICYmIG9wICE9PSBudWxsICYmXG4gICAgICAgICAgZU5leHQuT3V0SWR4ID49IDAgJiYgZU5leHQuQ3Vyci5ZID4gZU5leHQuVG9wLlkgJiZcbiAgICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNsb3Blc0VxdWFsKGUsIGVOZXh0LCB0aGlzLm1fVXNlRnVsbFJhbmdlKSAmJlxuICAgICAgICAgIChlLldpbmREZWx0YSAhPT0gMCkgJiYgKGVOZXh0LldpbmREZWx0YSAhPT0gMCkpXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgb3AyID0gdGhpcy5BZGRPdXRQdChlTmV4dCwgZS5Cb3QpO1xuICAgICAgICAgIHRoaXMuQWRkSm9pbihvcCwgb3AyLCBlLlRvcCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGUgPSBlLk5leHRJbkFFTDtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRG9NYXhpbWEgPSBmdW5jdGlvbiAoZSlcbiAge1xuICAgIHZhciBlTWF4UGFpciA9IHRoaXMuR2V0TWF4aW1hUGFpcihlKTtcbiAgICBpZiAoZU1heFBhaXIgPT09IG51bGwpXG4gICAge1xuICAgICAgaWYgKGUuT3V0SWR4ID49IDApXG4gICAgICAgIHRoaXMuQWRkT3V0UHQoZSwgZS5Ub3ApO1xuICAgICAgdGhpcy5EZWxldGVGcm9tQUVMKGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgZU5leHQgPSBlLk5leHRJbkFFTDtcbiAgICB2YXIgdXNlX2xpbmVzID0gdHJ1ZTtcbiAgICB3aGlsZSAoZU5leHQgIT09IG51bGwgJiYgZU5leHQgIT0gZU1heFBhaXIpXG4gICAge1xuICAgICAgdGhpcy5JbnRlcnNlY3RFZGdlcyhlLCBlTmV4dCwgZS5Ub3ApO1xuICAgICAgdGhpcy5Td2FwUG9zaXRpb25zSW5BRUwoZSwgZU5leHQpO1xuICAgICAgZU5leHQgPSBlLk5leHRJbkFFTDtcbiAgICB9XG4gICAgaWYgKGUuT3V0SWR4ID09IC0xICYmIGVNYXhQYWlyLk91dElkeCA9PSAtMSlcbiAgICB7XG4gICAgICB0aGlzLkRlbGV0ZUZyb21BRUwoZSk7XG4gICAgICB0aGlzLkRlbGV0ZUZyb21BRUwoZU1heFBhaXIpO1xuICAgIH1cbiAgICBlbHNlIGlmIChlLk91dElkeCA+PSAwICYmIGVNYXhQYWlyLk91dElkeCA+PSAwKVxuICAgIHtcbiAgICBcdGlmIChlLk91dElkeCA+PSAwKSB0aGlzLkFkZExvY2FsTWF4UG9seShlLCBlTWF4UGFpciwgZS5Ub3ApO1xuICAgICAgdGhpcy5EZWxldGVGcm9tQUVMKGUpO1xuICAgICAgdGhpcy5EZWxldGVGcm9tQUVMKGVNYXhQYWlyKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodXNlX2xpbmVzICYmIGUuV2luZERlbHRhID09PSAwKVxuICAgIHtcbiAgICAgIGlmIChlLk91dElkeCA+PSAwKVxuICAgICAge1xuICAgICAgICB0aGlzLkFkZE91dFB0KGUsIGUuVG9wKTtcbiAgICAgICAgZS5PdXRJZHggPSAtMTtcbiAgICAgIH1cbiAgICAgIHRoaXMuRGVsZXRlRnJvbUFFTChlKTtcbiAgICAgIGlmIChlTWF4UGFpci5PdXRJZHggPj0gMClcbiAgICAgIHtcbiAgICAgICAgdGhpcy5BZGRPdXRQdChlTWF4UGFpciwgZS5Ub3ApO1xuICAgICAgICBlTWF4UGFpci5PdXRJZHggPSAtMTtcbiAgICAgIH1cbiAgICAgIHRoaXMuRGVsZXRlRnJvbUFFTChlTWF4UGFpcik7XG4gICAgfVxuICAgIGVsc2VcbiAgICAgIENsaXBwZXJMaWIuRXJyb3IoXCJEb01heGltYSBlcnJvclwiKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLlJldmVyc2VQYXRocyA9IGZ1bmN0aW9uIChwb2x5cylcbiAge1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBwb2x5cy5sZW5ndGg7IGkgPCBsZW47IGkrKylcbiAgICAgIHBvbHlzW2ldLnJldmVyc2UoKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLk9yaWVudGF0aW9uID0gZnVuY3Rpb24gKHBvbHkpXG4gIHtcbiAgICByZXR1cm4gQ2xpcHBlckxpYi5DbGlwcGVyLkFyZWEocG9seSkgPj0gMDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Qb2ludENvdW50ID0gZnVuY3Rpb24gKHB0cylcbiAge1xuICAgIGlmIChwdHMgPT09IG51bGwpXG4gICAgICByZXR1cm4gMDtcbiAgICB2YXIgcmVzdWx0ID0gMDtcbiAgICB2YXIgcCA9IHB0cztcbiAgICBkbyB7XG4gICAgICByZXN1bHQrKztcbiAgICAgIHAgPSBwLk5leHQ7XG4gICAgfVxuICAgIHdoaWxlIChwICE9IHB0cylcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkJ1aWxkUmVzdWx0ID0gZnVuY3Rpb24gKHBvbHlnKVxuICB7XG4gICAgQ2xpcHBlckxpYi5DbGVhcihwb2x5Zyk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlsZW4gPSB0aGlzLm1fUG9seU91dHMubGVuZ3RoOyBpIDwgaWxlbjsgaSsrKVxuICAgIHtcbiAgICAgIHZhciBvdXRSZWMgPSB0aGlzLm1fUG9seU91dHNbaV07XG4gICAgICBpZiAob3V0UmVjLlB0cyA9PT0gbnVsbClcbiAgICAgICAgY29udGludWU7XG4gICAgICB2YXIgcCA9IG91dFJlYy5QdHMuUHJldjtcbiAgICAgIHZhciBjbnQgPSB0aGlzLlBvaW50Q291bnQocCk7XG4gICAgICBpZiAoY250IDwgMilcbiAgICAgICAgY29udGludWU7XG4gICAgICB2YXIgcGcgPSBuZXcgQXJyYXkoY250KTtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY250OyBqKyspXG4gICAgICB7XG4gICAgICAgIHBnW2pdID0gcC5QdDtcbiAgICAgICAgcCA9IHAuUHJldjtcbiAgICAgIH1cbiAgICAgIHBvbHlnLnB1c2gocGcpO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5CdWlsZFJlc3VsdDIgPSBmdW5jdGlvbiAocG9seXRyZWUpXG4gIHtcbiAgICBwb2x5dHJlZS5DbGVhcigpO1xuICAgIC8vYWRkIGVhY2ggb3V0cHV0IHBvbHlnb24vY29udG91ciB0byBwb2x5dHJlZSAuLi5cbiAgICAvL3BvbHl0cmVlLm1fQWxsUG9seXMuc2V0X0NhcGFjaXR5KHRoaXMubV9Qb2x5T3V0cy5sZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBpbGVuID0gdGhpcy5tX1BvbHlPdXRzLmxlbmd0aDsgaSA8IGlsZW47IGkrKylcbiAgICB7XG4gICAgICB2YXIgb3V0UmVjID0gdGhpcy5tX1BvbHlPdXRzW2ldO1xuICAgICAgdmFyIGNudCA9IHRoaXMuUG9pbnRDb3VudChvdXRSZWMuUHRzKTtcbiAgICAgIGlmICgob3V0UmVjLklzT3BlbiAmJiBjbnQgPCAyKSB8fCAoIW91dFJlYy5Jc09wZW4gJiYgY250IDwgMykpXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgdGhpcy5GaXhIb2xlTGlua2FnZShvdXRSZWMpO1xuICAgICAgdmFyIHBuID0gbmV3IENsaXBwZXJMaWIuUG9seU5vZGUoKTtcbiAgICAgIHBvbHl0cmVlLm1fQWxsUG9seXMucHVzaChwbik7XG4gICAgICBvdXRSZWMuUG9seU5vZGUgPSBwbjtcbiAgICAgIHBuLm1fcG9seWdvbi5sZW5ndGggPSBjbnQ7XG4gICAgICB2YXIgb3AgPSBvdXRSZWMuUHRzLlByZXY7XG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNudDsgaisrKVxuICAgICAge1xuICAgICAgICBwbi5tX3BvbHlnb25bal0gPSBvcC5QdDtcbiAgICAgICAgb3AgPSBvcC5QcmV2O1xuICAgICAgfVxuICAgIH1cbiAgICAvL2ZpeHVwIFBvbHlOb2RlIGxpbmtzIGV0YyAuLi5cbiAgICAvL3BvbHl0cmVlLm1fQ2hpbGRzLnNldF9DYXBhY2l0eSh0aGlzLm1fUG9seU91dHMubGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgaWxlbiA9IHRoaXMubV9Qb2x5T3V0cy5sZW5ndGg7IGkgPCBpbGVuOyBpKyspXG4gICAge1xuICAgICAgdmFyIG91dFJlYyA9IHRoaXMubV9Qb2x5T3V0c1tpXTtcbiAgICAgIGlmIChvdXRSZWMuUG9seU5vZGUgPT09IG51bGwpXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgZWxzZSBpZiAob3V0UmVjLklzT3BlbilcbiAgICAgIHtcbiAgICAgICAgb3V0UmVjLlBvbHlOb2RlLklzT3BlbiA9IHRydWU7XG4gICAgICAgIHBvbHl0cmVlLkFkZENoaWxkKG91dFJlYy5Qb2x5Tm9kZSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChvdXRSZWMuRmlyc3RMZWZ0ICE9PSBudWxsICYmIG91dFJlYy5GaXJzdExlZnQuUG9seU5vZGUgIT0gbnVsbClcbiAgICAgICAgb3V0UmVjLkZpcnN0TGVmdC5Qb2x5Tm9kZS5BZGRDaGlsZChvdXRSZWMuUG9seU5vZGUpO1xuICAgICAgZWxzZVxuICAgICAgICBwb2x5dHJlZS5BZGRDaGlsZChvdXRSZWMuUG9seU5vZGUpO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5GaXh1cE91dFBvbHlnb24gPSBmdW5jdGlvbiAob3V0UmVjKVxuICB7XG4gICAgLy9GaXh1cE91dFBvbHlnb24oKSAtIHJlbW92ZXMgZHVwbGljYXRlIHBvaW50cyBhbmQgc2ltcGxpZmllcyBjb25zZWN1dGl2ZVxuICAgIC8vcGFyYWxsZWwgZWRnZXMgYnkgcmVtb3ZpbmcgdGhlIG1pZGRsZSB2ZXJ0ZXguXG4gICAgdmFyIGxhc3RPSyA9IG51bGw7XG4gICAgb3V0UmVjLkJvdHRvbVB0ID0gbnVsbDtcbiAgICB2YXIgcHAgPSBvdXRSZWMuUHRzO1xuICAgIGZvciAoOzspXG4gICAge1xuICAgICAgaWYgKHBwLlByZXYgPT0gcHAgfHwgcHAuUHJldiA9PSBwcC5OZXh0KVxuICAgICAge1xuICAgICAgICBvdXRSZWMuUHRzID0gbnVsbDtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgLy90ZXN0IGZvciBkdXBsaWNhdGUgcG9pbnRzIGFuZCBjb2xsaW5lYXIgZWRnZXMgLi4uXG4gICAgICBpZiAoKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocHAuUHQsIHBwLk5leHQuUHQpKSB8fCAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwcC5QdCwgcHAuUHJldi5QdCkpIHx8XG4gICAgICAgIChDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNsb3Blc0VxdWFsKHBwLlByZXYuUHQsIHBwLlB0LCBwcC5OZXh0LlB0LCB0aGlzLm1fVXNlRnVsbFJhbmdlKSAmJlxuICAgICAgICAgICghdGhpcy5QcmVzZXJ2ZUNvbGxpbmVhciB8fCAhdGhpcy5QdDJJc0JldHdlZW5QdDFBbmRQdDMocHAuUHJldi5QdCwgcHAuUHQsIHBwLk5leHQuUHQpKSkpXG4gICAgICB7XG4gICAgICAgIGxhc3RPSyA9IG51bGw7XG4gICAgICAgIHBwLlByZXYuTmV4dCA9IHBwLk5leHQ7XG4gICAgICAgIHBwLk5leHQuUHJldiA9IHBwLlByZXY7XG4gICAgICAgIHBwID0gcHAuUHJldjtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHBwID09IGxhc3RPSylcbiAgICAgICAgYnJlYWs7XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIGlmIChsYXN0T0sgPT09IG51bGwpXG4gICAgICAgICAgbGFzdE9LID0gcHA7XG4gICAgICAgIHBwID0gcHAuTmV4dDtcbiAgICAgIH1cbiAgICB9XG4gICAgb3V0UmVjLlB0cyA9IHBwO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkR1cE91dFB0ID0gZnVuY3Rpb24gKG91dFB0LCBJbnNlcnRBZnRlcilcbiAge1xuICAgIHZhciByZXN1bHQgPSBuZXcgQ2xpcHBlckxpYi5PdXRQdCgpO1xuICAgIC8vcmVzdWx0LlB0ID0gb3V0UHQuUHQ7XG4gICAgcmVzdWx0LlB0LlggPSBvdXRQdC5QdC5YO1xuICAgIHJlc3VsdC5QdC5ZID0gb3V0UHQuUHQuWTtcbiAgICByZXN1bHQuSWR4ID0gb3V0UHQuSWR4O1xuICAgIGlmIChJbnNlcnRBZnRlcilcbiAgICB7XG4gICAgICByZXN1bHQuTmV4dCA9IG91dFB0Lk5leHQ7XG4gICAgICByZXN1bHQuUHJldiA9IG91dFB0O1xuICAgICAgb3V0UHQuTmV4dC5QcmV2ID0gcmVzdWx0O1xuICAgICAgb3V0UHQuTmV4dCA9IHJlc3VsdDtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIHJlc3VsdC5QcmV2ID0gb3V0UHQuUHJldjtcbiAgICAgIHJlc3VsdC5OZXh0ID0gb3V0UHQ7XG4gICAgICBvdXRQdC5QcmV2Lk5leHQgPSByZXN1bHQ7XG4gICAgICBvdXRQdC5QcmV2ID0gcmVzdWx0O1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkdldE92ZXJsYXAgPSBmdW5jdGlvbiAoYTEsIGEyLCBiMSwgYjIsICR2YWwpXG4gIHtcbiAgICBpZiAoYTEgPCBhMilcbiAgICB7XG4gICAgICBpZiAoYjEgPCBiMilcbiAgICAgIHtcbiAgICAgICAgJHZhbC5MZWZ0ID0gTWF0aC5tYXgoYTEsIGIxKTtcbiAgICAgICAgJHZhbC5SaWdodCA9IE1hdGgubWluKGEyLCBiMik7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgICR2YWwuTGVmdCA9IE1hdGgubWF4KGExLCBiMik7XG4gICAgICAgICR2YWwuUmlnaHQgPSBNYXRoLm1pbihhMiwgYjEpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgaWYgKGIxIDwgYjIpXG4gICAgICB7XG4gICAgICAgICR2YWwuTGVmdCA9IE1hdGgubWF4KGEyLCBiMSk7XG4gICAgICAgICR2YWwuUmlnaHQgPSBNYXRoLm1pbihhMSwgYjIpO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICAkdmFsLkxlZnQgPSBNYXRoLm1heChhMiwgYjIpO1xuICAgICAgICAkdmFsLlJpZ2h0ID0gTWF0aC5taW4oYTEsIGIxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICR2YWwuTGVmdCA8ICR2YWwuUmlnaHQ7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuSm9pbkhvcnogPSBmdW5jdGlvbiAob3AxLCBvcDFiLCBvcDIsIG9wMmIsIFB0LCBEaXNjYXJkTGVmdClcbiAge1xuICAgIHZhciBEaXIxID0gKG9wMS5QdC5YID4gb3AxYi5QdC5YID8gQ2xpcHBlckxpYi5EaXJlY3Rpb24uZFJpZ2h0VG9MZWZ0IDogQ2xpcHBlckxpYi5EaXJlY3Rpb24uZExlZnRUb1JpZ2h0KTtcbiAgICB2YXIgRGlyMiA9IChvcDIuUHQuWCA+IG9wMmIuUHQuWCA/IENsaXBwZXJMaWIuRGlyZWN0aW9uLmRSaWdodFRvTGVmdCA6IENsaXBwZXJMaWIuRGlyZWN0aW9uLmRMZWZ0VG9SaWdodCk7XG4gICAgaWYgKERpcjEgPT0gRGlyMilcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICAvL1doZW4gRGlzY2FyZExlZnQsIHdlIHdhbnQgT3AxYiB0byBiZSBvbiB0aGUgTGVmdCBvZiBPcDEsIG90aGVyd2lzZSB3ZVxuICAgIC8vd2FudCBPcDFiIHRvIGJlIG9uIHRoZSBSaWdodC4gKEFuZCBsaWtld2lzZSB3aXRoIE9wMiBhbmQgT3AyYi4pXG4gICAgLy9TbywgdG8gZmFjaWxpdGF0ZSB0aGlzIHdoaWxlIGluc2VydGluZyBPcDFiIGFuZCBPcDJiIC4uLlxuICAgIC8vd2hlbiBEaXNjYXJkTGVmdCwgbWFrZSBzdXJlIHdlJ3JlIEFUIG9yIFJJR0hUIG9mIFB0IGJlZm9yZSBhZGRpbmcgT3AxYixcbiAgICAvL290aGVyd2lzZSBtYWtlIHN1cmUgd2UncmUgQVQgb3IgTEVGVCBvZiBQdC4gKExpa2V3aXNlIHdpdGggT3AyYi4pXG4gICAgaWYgKERpcjEgPT0gQ2xpcHBlckxpYi5EaXJlY3Rpb24uZExlZnRUb1JpZ2h0KVxuICAgIHtcbiAgICAgIHdoaWxlIChvcDEuTmV4dC5QdC5YIDw9IFB0LlggJiZcbiAgICAgICAgb3AxLk5leHQuUHQuWCA+PSBvcDEuUHQuWCAmJiBvcDEuTmV4dC5QdC5ZID09IFB0LlkpXG4gICAgICAgIG9wMSA9IG9wMS5OZXh0O1xuICAgICAgaWYgKERpc2NhcmRMZWZ0ICYmIChvcDEuUHQuWCAhPSBQdC5YKSlcbiAgICAgICAgb3AxID0gb3AxLk5leHQ7XG4gICAgICBvcDFiID0gdGhpcy5EdXBPdXRQdChvcDEsICFEaXNjYXJkTGVmdCk7XG4gICAgICBpZiAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9JbmVxdWFsaXR5KG9wMWIuUHQsIFB0KSlcbiAgICAgIHtcbiAgICAgICAgb3AxID0gb3AxYjtcbiAgICAgICAgLy9vcDEuUHQgPSBQdDtcbiAgICAgICAgb3AxLlB0LlggPSBQdC5YO1xuICAgICAgICBvcDEuUHQuWSA9IFB0Llk7XG4gICAgICAgIG9wMWIgPSB0aGlzLkR1cE91dFB0KG9wMSwgIURpc2NhcmRMZWZ0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIHdoaWxlIChvcDEuTmV4dC5QdC5YID49IFB0LlggJiZcbiAgICAgICAgb3AxLk5leHQuUHQuWCA8PSBvcDEuUHQuWCAmJiBvcDEuTmV4dC5QdC5ZID09IFB0LlkpXG4gICAgICAgIG9wMSA9IG9wMS5OZXh0O1xuICAgICAgaWYgKCFEaXNjYXJkTGVmdCAmJiAob3AxLlB0LlggIT0gUHQuWCkpXG4gICAgICAgIG9wMSA9IG9wMS5OZXh0O1xuICAgICAgb3AxYiA9IHRoaXMuRHVwT3V0UHQob3AxLCBEaXNjYXJkTGVmdCk7XG4gICAgICBpZiAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9JbmVxdWFsaXR5KG9wMWIuUHQsIFB0KSlcbiAgICAgIHtcbiAgICAgICAgb3AxID0gb3AxYjtcbiAgICAgICAgLy9vcDEuUHQgPSBQdDtcbiAgICAgICAgb3AxLlB0LlggPSBQdC5YO1xuICAgICAgICBvcDEuUHQuWSA9IFB0Llk7XG4gICAgICAgIG9wMWIgPSB0aGlzLkR1cE91dFB0KG9wMSwgRGlzY2FyZExlZnQpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoRGlyMiA9PSBDbGlwcGVyTGliLkRpcmVjdGlvbi5kTGVmdFRvUmlnaHQpXG4gICAge1xuICAgICAgd2hpbGUgKG9wMi5OZXh0LlB0LlggPD0gUHQuWCAmJlxuICAgICAgICBvcDIuTmV4dC5QdC5YID49IG9wMi5QdC5YICYmIG9wMi5OZXh0LlB0LlkgPT0gUHQuWSlcbiAgICAgICAgb3AyID0gb3AyLk5leHQ7XG4gICAgICBpZiAoRGlzY2FyZExlZnQgJiYgKG9wMi5QdC5YICE9IFB0LlgpKVxuICAgICAgICBvcDIgPSBvcDIuTmV4dDtcbiAgICAgIG9wMmIgPSB0aGlzLkR1cE91dFB0KG9wMiwgIURpc2NhcmRMZWZ0KTtcbiAgICAgIGlmIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0luZXF1YWxpdHkob3AyYi5QdCwgUHQpKVxuICAgICAge1xuICAgICAgICBvcDIgPSBvcDJiO1xuICAgICAgICAvL29wMi5QdCA9IFB0O1xuICAgICAgICBvcDIuUHQuWCA9IFB0Llg7XG4gICAgICAgIG9wMi5QdC5ZID0gUHQuWTtcbiAgICAgICAgb3AyYiA9IHRoaXMuRHVwT3V0UHQob3AyLCAhRGlzY2FyZExlZnQpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgd2hpbGUgKG9wMi5OZXh0LlB0LlggPj0gUHQuWCAmJlxuICAgICAgICBvcDIuTmV4dC5QdC5YIDw9IG9wMi5QdC5YICYmIG9wMi5OZXh0LlB0LlkgPT0gUHQuWSlcbiAgICAgICAgb3AyID0gb3AyLk5leHQ7XG4gICAgICBpZiAoIURpc2NhcmRMZWZ0ICYmIChvcDIuUHQuWCAhPSBQdC5YKSlcbiAgICAgICAgb3AyID0gb3AyLk5leHQ7XG4gICAgICBvcDJiID0gdGhpcy5EdXBPdXRQdChvcDIsIERpc2NhcmRMZWZ0KTtcbiAgICAgIGlmIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0luZXF1YWxpdHkob3AyYi5QdCwgUHQpKVxuICAgICAge1xuICAgICAgICBvcDIgPSBvcDJiO1xuICAgICAgICAvL29wMi5QdCA9IFB0O1xuICAgICAgICBvcDIuUHQuWCA9IFB0Llg7XG4gICAgICAgIG9wMi5QdC5ZID0gUHQuWTtcbiAgICAgICAgb3AyYiA9IHRoaXMuRHVwT3V0UHQob3AyLCBEaXNjYXJkTGVmdCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgoRGlyMSA9PSBDbGlwcGVyTGliLkRpcmVjdGlvbi5kTGVmdFRvUmlnaHQpID09IERpc2NhcmRMZWZ0KVxuICAgIHtcbiAgICAgIG9wMS5QcmV2ID0gb3AyO1xuICAgICAgb3AyLk5leHQgPSBvcDE7XG4gICAgICBvcDFiLk5leHQgPSBvcDJiO1xuICAgICAgb3AyYi5QcmV2ID0gb3AxYjtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIG9wMS5OZXh0ID0gb3AyO1xuICAgICAgb3AyLlByZXYgPSBvcDE7XG4gICAgICBvcDFiLlByZXYgPSBvcDJiO1xuICAgICAgb3AyYi5OZXh0ID0gb3AxYjtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuSm9pblBvaW50cyA9IGZ1bmN0aW9uIChqLCBvdXRSZWMxLCBvdXRSZWMyKVxuICB7XG4gICAgdmFyIG9wMSA9IGouT3V0UHQxLFxuICAgICAgb3AxYiA9IG5ldyBDbGlwcGVyTGliLk91dFB0KCk7XG4gICAgdmFyIG9wMiA9IGouT3V0UHQyLFxuICAgICAgb3AyYiA9IG5ldyBDbGlwcGVyTGliLk91dFB0KCk7XG4gICAgLy9UaGVyZSBhcmUgMyBraW5kcyBvZiBqb2lucyBmb3Igb3V0cHV0IHBvbHlnb25zIC4uLlxuICAgIC8vMS4gSG9yaXpvbnRhbCBqb2lucyB3aGVyZSBKb2luLk91dFB0MSAmIEpvaW4uT3V0UHQyIGFyZSBhIHZlcnRpY2VzIGFueXdoZXJlXG4gICAgLy9hbG9uZyAoaG9yaXpvbnRhbCkgY29sbGluZWFyIGVkZ2VzICgmIEpvaW4uT2ZmUHQgaXMgb24gdGhlIHNhbWUgaG9yaXpvbnRhbCkuXG4gICAgLy8yLiBOb24taG9yaXpvbnRhbCBqb2lucyB3aGVyZSBKb2luLk91dFB0MSAmIEpvaW4uT3V0UHQyIGFyZSBhdCB0aGUgc2FtZVxuICAgIC8vbG9jYXRpb24gYXQgdGhlIEJvdHRvbSBvZiB0aGUgb3ZlcmxhcHBpbmcgc2VnbWVudCAoJiBKb2luLk9mZlB0IGlzIGFib3ZlKS5cbiAgICAvLzMuIFN0cmljdGx5U2ltcGxlIGpvaW5zIHdoZXJlIGVkZ2VzIHRvdWNoIGJ1dCBhcmUgbm90IGNvbGxpbmVhciBhbmQgd2hlcmVcbiAgICAvL0pvaW4uT3V0UHQxLCBKb2luLk91dFB0MiAmIEpvaW4uT2ZmUHQgYWxsIHNoYXJlIHRoZSBzYW1lIHBvaW50LlxuICAgIHZhciBpc0hvcml6b250YWwgPSAoai5PdXRQdDEuUHQuWSA9PSBqLk9mZlB0LlkpO1xuICAgIGlmIChpc0hvcml6b250YWwgJiYgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkoai5PZmZQdCwgai5PdXRQdDEuUHQpKSAmJiAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShqLk9mZlB0LCBqLk91dFB0Mi5QdCkpKVxuICAgIHtcbiAgICAgIC8vU3RyaWN0bHkgU2ltcGxlIGpvaW4gLi4uXG5cdFx0XHRpZiAob3V0UmVjMSAhPSBvdXRSZWMyKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgIG9wMWIgPSBqLk91dFB0MS5OZXh0O1xuICAgICAgd2hpbGUgKG9wMWIgIT0gb3AxICYmIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KG9wMWIuUHQsIGouT2ZmUHQpKSlcbiAgICAgICAgb3AxYiA9IG9wMWIuTmV4dDtcbiAgICAgIHZhciByZXZlcnNlMSA9IChvcDFiLlB0LlkgPiBqLk9mZlB0LlkpO1xuICAgICAgb3AyYiA9IGouT3V0UHQyLk5leHQ7XG4gICAgICB3aGlsZSAob3AyYiAhPSBvcDIgJiYgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkob3AyYi5QdCwgai5PZmZQdCkpKVxuICAgICAgICBvcDJiID0gb3AyYi5OZXh0O1xuICAgICAgdmFyIHJldmVyc2UyID0gKG9wMmIuUHQuWSA+IGouT2ZmUHQuWSk7XG4gICAgICBpZiAocmV2ZXJzZTEgPT0gcmV2ZXJzZTIpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIGlmIChyZXZlcnNlMSlcbiAgICAgIHtcbiAgICAgICAgb3AxYiA9IHRoaXMuRHVwT3V0UHQob3AxLCBmYWxzZSk7XG4gICAgICAgIG9wMmIgPSB0aGlzLkR1cE91dFB0KG9wMiwgdHJ1ZSk7XG4gICAgICAgIG9wMS5QcmV2ID0gb3AyO1xuICAgICAgICBvcDIuTmV4dCA9IG9wMTtcbiAgICAgICAgb3AxYi5OZXh0ID0gb3AyYjtcbiAgICAgICAgb3AyYi5QcmV2ID0gb3AxYjtcbiAgICAgICAgai5PdXRQdDEgPSBvcDE7XG4gICAgICAgIGouT3V0UHQyID0gb3AxYjtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIG9wMWIgPSB0aGlzLkR1cE91dFB0KG9wMSwgdHJ1ZSk7XG4gICAgICAgIG9wMmIgPSB0aGlzLkR1cE91dFB0KG9wMiwgZmFsc2UpO1xuICAgICAgICBvcDEuTmV4dCA9IG9wMjtcbiAgICAgICAgb3AyLlByZXYgPSBvcDE7XG4gICAgICAgIG9wMWIuUHJldiA9IG9wMmI7XG4gICAgICAgIG9wMmIuTmV4dCA9IG9wMWI7XG4gICAgICAgIGouT3V0UHQxID0gb3AxO1xuICAgICAgICBqLk91dFB0MiA9IG9wMWI7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChpc0hvcml6b250YWwpXG4gICAge1xuICAgICAgLy90cmVhdCBob3Jpem9udGFsIGpvaW5zIGRpZmZlcmVudGx5IHRvIG5vbi1ob3Jpem9udGFsIGpvaW5zIHNpbmNlIHdpdGhcbiAgICAgIC8vdGhlbSB3ZSdyZSBub3QgeWV0IHN1cmUgd2hlcmUgdGhlIG92ZXJsYXBwaW5nIGlzLiBPdXRQdDEuUHQgJiBPdXRQdDIuUHRcbiAgICAgIC8vbWF5IGJlIGFueXdoZXJlIGFsb25nIHRoZSBob3Jpem9udGFsIGVkZ2UuXG4gICAgICBvcDFiID0gb3AxO1xuICAgICAgd2hpbGUgKG9wMS5QcmV2LlB0LlkgPT0gb3AxLlB0LlkgJiYgb3AxLlByZXYgIT0gb3AxYiAmJiBvcDEuUHJldiAhPSBvcDIpXG4gICAgICAgIG9wMSA9IG9wMS5QcmV2O1xuICAgICAgd2hpbGUgKG9wMWIuTmV4dC5QdC5ZID09IG9wMWIuUHQuWSAmJiBvcDFiLk5leHQgIT0gb3AxICYmIG9wMWIuTmV4dCAhPSBvcDIpXG4gICAgICAgIG9wMWIgPSBvcDFiLk5leHQ7XG4gICAgICBpZiAob3AxYi5OZXh0ID09IG9wMSB8fCBvcDFiLk5leHQgPT0gb3AyKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAvL2EgZmxhdCAncG9seWdvbidcbiAgICAgIG9wMmIgPSBvcDI7XG4gICAgICB3aGlsZSAob3AyLlByZXYuUHQuWSA9PSBvcDIuUHQuWSAmJiBvcDIuUHJldiAhPSBvcDJiICYmIG9wMi5QcmV2ICE9IG9wMWIpXG4gICAgICAgIG9wMiA9IG9wMi5QcmV2O1xuICAgICAgd2hpbGUgKG9wMmIuTmV4dC5QdC5ZID09IG9wMmIuUHQuWSAmJiBvcDJiLk5leHQgIT0gb3AyICYmIG9wMmIuTmV4dCAhPSBvcDEpXG4gICAgICAgIG9wMmIgPSBvcDJiLk5leHQ7XG4gICAgICBpZiAob3AyYi5OZXh0ID09IG9wMiB8fCBvcDJiLk5leHQgPT0gb3AxKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAvL2EgZmxhdCAncG9seWdvbidcbiAgICAgIC8vT3AxIC0uIE9wMWIgJiBPcDIgLS4gT3AyYiBhcmUgdGhlIGV4dHJlbWl0ZXMgb2YgdGhlIGhvcml6b250YWwgZWRnZXNcblxuICAgICAgdmFyICR2YWwgPSB7TGVmdDogbnVsbCwgUmlnaHQ6IG51bGx9O1xuICAgICAgaWYgKCF0aGlzLkdldE92ZXJsYXAob3AxLlB0LlgsIG9wMWIuUHQuWCwgb3AyLlB0LlgsIG9wMmIuUHQuWCwgJHZhbCkpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHZhciBMZWZ0ID0gJHZhbC5MZWZ0O1xuICAgICAgdmFyIFJpZ2h0ID0gJHZhbC5SaWdodDtcblxuICAgICAgLy9EaXNjYXJkTGVmdFNpZGU6IHdoZW4gb3ZlcmxhcHBpbmcgZWRnZXMgYXJlIGpvaW5lZCwgYSBzcGlrZSB3aWxsIGNyZWF0ZWRcbiAgICAgIC8vd2hpY2ggbmVlZHMgdG8gYmUgY2xlYW5lZCB1cC4gSG93ZXZlciwgd2UgZG9uJ3Qgd2FudCBPcDEgb3IgT3AyIGNhdWdodCB1cFxuICAgICAgLy9vbiB0aGUgZGlzY2FyZCBTaWRlIGFzIGVpdGhlciBtYXkgc3RpbGwgYmUgbmVlZGVkIGZvciBvdGhlciBqb2lucyAuLi5cbiAgICAgIHZhciBQdCA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KCk7XG4gICAgICB2YXIgRGlzY2FyZExlZnRTaWRlO1xuICAgICAgaWYgKG9wMS5QdC5YID49IExlZnQgJiYgb3AxLlB0LlggPD0gUmlnaHQpXG4gICAgICB7XG4gICAgICAgIC8vUHQgPSBvcDEuUHQ7XG4gICAgICAgIFB0LlggPSBvcDEuUHQuWDtcbiAgICAgICAgUHQuWSA9IG9wMS5QdC5ZO1xuICAgICAgICBEaXNjYXJkTGVmdFNpZGUgPSAob3AxLlB0LlggPiBvcDFiLlB0LlgpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAob3AyLlB0LlggPj0gTGVmdCAmJiBvcDIuUHQuWCA8PSBSaWdodClcbiAgICAgIHtcbiAgICAgICAgLy9QdCA9IG9wMi5QdDtcbiAgICAgICAgUHQuWCA9IG9wMi5QdC5YO1xuICAgICAgICBQdC5ZID0gb3AyLlB0Llk7XG4gICAgICAgIERpc2NhcmRMZWZ0U2lkZSA9IChvcDIuUHQuWCA+IG9wMmIuUHQuWCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChvcDFiLlB0LlggPj0gTGVmdCAmJiBvcDFiLlB0LlggPD0gUmlnaHQpXG4gICAgICB7XG4gICAgICAgIC8vUHQgPSBvcDFiLlB0O1xuICAgICAgICBQdC5YID0gb3AxYi5QdC5YO1xuICAgICAgICBQdC5ZID0gb3AxYi5QdC5ZO1xuICAgICAgICBEaXNjYXJkTGVmdFNpZGUgPSBvcDFiLlB0LlggPiBvcDEuUHQuWDtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgLy9QdCA9IG9wMmIuUHQ7XG4gICAgICAgIFB0LlggPSBvcDJiLlB0Llg7XG4gICAgICAgIFB0LlkgPSBvcDJiLlB0Llk7XG4gICAgICAgIERpc2NhcmRMZWZ0U2lkZSA9IChvcDJiLlB0LlggPiBvcDIuUHQuWCk7XG4gICAgICB9XG4gICAgICBqLk91dFB0MSA9IG9wMTtcbiAgICAgIGouT3V0UHQyID0gb3AyO1xuICAgICAgcmV0dXJuIHRoaXMuSm9pbkhvcnoob3AxLCBvcDFiLCBvcDIsIG9wMmIsIFB0LCBEaXNjYXJkTGVmdFNpZGUpO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgLy9uYjogRm9yIG5vbi1ob3Jpem9udGFsIGpvaW5zIC4uLlxuICAgICAgLy8gICAgMS4gSnIuT3V0UHQxLlB0LlkgPT0gSnIuT3V0UHQyLlB0LllcbiAgICAgIC8vICAgIDIuIEpyLk91dFB0MS5QdCA+IEpyLk9mZlB0LllcbiAgICAgIC8vbWFrZSBzdXJlIHRoZSBwb2x5Z29ucyBhcmUgY29ycmVjdGx5IG9yaWVudGVkIC4uLlxuICAgICAgb3AxYiA9IG9wMS5OZXh0O1xuICAgICAgd2hpbGUgKChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KG9wMWIuUHQsIG9wMS5QdCkpICYmIChvcDFiICE9IG9wMSkpXG4gICAgICAgIG9wMWIgPSBvcDFiLk5leHQ7XG4gICAgICB2YXIgUmV2ZXJzZTEgPSAoKG9wMWIuUHQuWSA+IG9wMS5QdC5ZKSB8fCAhQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5TbG9wZXNFcXVhbChvcDEuUHQsIG9wMWIuUHQsIGouT2ZmUHQsIHRoaXMubV9Vc2VGdWxsUmFuZ2UpKTtcbiAgICAgIGlmIChSZXZlcnNlMSlcbiAgICAgIHtcbiAgICAgICAgb3AxYiA9IG9wMS5QcmV2O1xuICAgICAgICB3aGlsZSAoKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkob3AxYi5QdCwgb3AxLlB0KSkgJiYgKG9wMWIgIT0gb3AxKSlcbiAgICAgICAgICBvcDFiID0gb3AxYi5QcmV2O1xuICAgICAgICBpZiAoKG9wMWIuUHQuWSA+IG9wMS5QdC5ZKSB8fCAhQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5TbG9wZXNFcXVhbChvcDEuUHQsIG9wMWIuUHQsIGouT2ZmUHQsIHRoaXMubV9Vc2VGdWxsUmFuZ2UpKVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIG9wMmIgPSBvcDIuTmV4dDtcbiAgICAgIHdoaWxlICgoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShvcDJiLlB0LCBvcDIuUHQpKSAmJiAob3AyYiAhPSBvcDIpKVxuICAgICAgICBvcDJiID0gb3AyYi5OZXh0O1xuICAgICAgdmFyIFJldmVyc2UyID0gKChvcDJiLlB0LlkgPiBvcDIuUHQuWSkgfHwgIUNsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2xvcGVzRXF1YWwob3AyLlB0LCBvcDJiLlB0LCBqLk9mZlB0LCB0aGlzLm1fVXNlRnVsbFJhbmdlKSk7XG4gICAgICBpZiAoUmV2ZXJzZTIpXG4gICAgICB7XG4gICAgICAgIG9wMmIgPSBvcDIuUHJldjtcbiAgICAgICAgd2hpbGUgKChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KG9wMmIuUHQsIG9wMi5QdCkpICYmIChvcDJiICE9IG9wMikpXG4gICAgICAgICAgb3AyYiA9IG9wMmIuUHJldjtcbiAgICAgICAgaWYgKChvcDJiLlB0LlkgPiBvcDIuUHQuWSkgfHwgIUNsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2xvcGVzRXF1YWwob3AyLlB0LCBvcDJiLlB0LCBqLk9mZlB0LCB0aGlzLm1fVXNlRnVsbFJhbmdlKSlcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoKG9wMWIgPT0gb3AxKSB8fCAob3AyYiA9PSBvcDIpIHx8IChvcDFiID09IG9wMmIpIHx8XG4gICAgICAgICgob3V0UmVjMSA9PSBvdXRSZWMyKSAmJiAoUmV2ZXJzZTEgPT0gUmV2ZXJzZTIpKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKFJldmVyc2UxKVxuICAgICAge1xuICAgICAgICBvcDFiID0gdGhpcy5EdXBPdXRQdChvcDEsIGZhbHNlKTtcbiAgICAgICAgb3AyYiA9IHRoaXMuRHVwT3V0UHQob3AyLCB0cnVlKTtcbiAgICAgICAgb3AxLlByZXYgPSBvcDI7XG4gICAgICAgIG9wMi5OZXh0ID0gb3AxO1xuICAgICAgICBvcDFiLk5leHQgPSBvcDJiO1xuICAgICAgICBvcDJiLlByZXYgPSBvcDFiO1xuICAgICAgICBqLk91dFB0MSA9IG9wMTtcbiAgICAgICAgai5PdXRQdDIgPSBvcDFiO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgb3AxYiA9IHRoaXMuRHVwT3V0UHQob3AxLCB0cnVlKTtcbiAgICAgICAgb3AyYiA9IHRoaXMuRHVwT3V0UHQob3AyLCBmYWxzZSk7XG4gICAgICAgIG9wMS5OZXh0ID0gb3AyO1xuICAgICAgICBvcDIuUHJldiA9IG9wMTtcbiAgICAgICAgb3AxYi5QcmV2ID0gb3AyYjtcbiAgICAgICAgb3AyYi5OZXh0ID0gb3AxYjtcbiAgICAgICAgai5PdXRQdDEgPSBvcDE7XG4gICAgICAgIGouT3V0UHQyID0gb3AxYjtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuR2V0Qm91bmRzID0gZnVuY3Rpb24gKHBhdGhzKVxuICB7XG4gICAgdmFyIGkgPSAwLFxuICAgICAgY250ID0gcGF0aHMubGVuZ3RoO1xuICAgIHdoaWxlIChpIDwgY250ICYmIHBhdGhzW2ldLmxlbmd0aCA9PSAwKSBpKys7XG4gICAgaWYgKGkgPT0gY250KSByZXR1cm4gbmV3IENsaXBwZXJMaWIuSW50UmVjdCgwLCAwLCAwLCAwKTtcbiAgICB2YXIgcmVzdWx0ID0gbmV3IENsaXBwZXJMaWIuSW50UmVjdCgpO1xuICAgIHJlc3VsdC5sZWZ0ID0gcGF0aHNbaV1bMF0uWDtcbiAgICByZXN1bHQucmlnaHQgPSByZXN1bHQubGVmdDtcbiAgICByZXN1bHQudG9wID0gcGF0aHNbaV1bMF0uWTtcbiAgICByZXN1bHQuYm90dG9tID0gcmVzdWx0LnRvcDtcbiAgICBmb3IgKDsgaSA8IGNudDsgaSsrKVxuICAgICAgZm9yICh2YXIgaiA9IDAsIGpsZW4gPSBwYXRoc1tpXS5sZW5ndGg7IGogPCBqbGVuOyBqKyspXG4gICAgICB7XG4gICAgICAgIGlmIChwYXRoc1tpXVtqXS5YIDwgcmVzdWx0LmxlZnQpIHJlc3VsdC5sZWZ0ID0gcGF0aHNbaV1bal0uWDtcbiAgICAgICAgZWxzZSBpZiAocGF0aHNbaV1bal0uWCA+IHJlc3VsdC5yaWdodCkgcmVzdWx0LnJpZ2h0ID0gcGF0aHNbaV1bal0uWDtcbiAgICAgICAgaWYgKHBhdGhzW2ldW2pdLlkgPCByZXN1bHQudG9wKSByZXN1bHQudG9wID0gcGF0aHNbaV1bal0uWTtcbiAgICAgICAgZWxzZSBpZiAocGF0aHNbaV1bal0uWSA+IHJlc3VsdC5ib3R0b20pIHJlc3VsdC5ib3R0b20gPSBwYXRoc1tpXVtqXS5ZO1xuICAgICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5HZXRCb3VuZHMyID0gZnVuY3Rpb24gKG9wcylcbiAge1xuICAgIHZhciBvcFN0YXJ0ID0gb3BzO1xuICAgIHZhciByZXN1bHQgPSBuZXcgQ2xpcHBlckxpYi5JbnRSZWN0KCk7XG4gICAgcmVzdWx0LmxlZnQgPSBvcHMuUHQuWDtcbiAgICByZXN1bHQucmlnaHQgPSBvcHMuUHQuWDtcbiAgICByZXN1bHQudG9wID0gb3BzLlB0Llk7XG4gICAgcmVzdWx0LmJvdHRvbSA9IG9wcy5QdC5ZO1xuICAgIG9wcyA9IG9wcy5OZXh0O1xuICAgIHdoaWxlIChvcHMgIT0gb3BTdGFydClcbiAgICB7XG4gICAgICBpZiAob3BzLlB0LlggPCByZXN1bHQubGVmdClcbiAgICAgICAgcmVzdWx0LmxlZnQgPSBvcHMuUHQuWDtcbiAgICAgIGlmIChvcHMuUHQuWCA+IHJlc3VsdC5yaWdodClcbiAgICAgICAgcmVzdWx0LnJpZ2h0ID0gb3BzLlB0Llg7XG4gICAgICBpZiAob3BzLlB0LlkgPCByZXN1bHQudG9wKVxuICAgICAgICByZXN1bHQudG9wID0gb3BzLlB0Llk7XG4gICAgICBpZiAob3BzLlB0LlkgPiByZXN1bHQuYm90dG9tKVxuICAgICAgICByZXN1bHQuYm90dG9tID0gb3BzLlB0Llk7XG4gICAgICBvcHMgPSBvcHMuTmV4dDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICBDbGlwcGVyTGliLkNsaXBwZXIuUG9pbnRJblBvbHlnb24gPSBmdW5jdGlvbiAocHQsIHBhdGgpXG4gIHtcbiAgICAvL3JldHVybnMgMCBpZiBmYWxzZSwgKzEgaWYgdHJ1ZSwgLTEgaWYgcHQgT04gcG9seWdvbiBib3VuZGFyeVxuXHRcdC8vU2VlIFwiVGhlIFBvaW50IGluIFBvbHlnb24gUHJvYmxlbSBmb3IgQXJiaXRyYXJ5IFBvbHlnb25zXCIgYnkgSG9ybWFubiAmIEFnYXRob3NcbiAgICAvL2h0dHA6Ly9jaXRlc2VlcnguaXN0LnBzdS5lZHUvdmlld2RvYy9kb3dubG9hZD9kb2k9MTAuMS4xLjg4LjU0OTgmcmVwPXJlcDEmdHlwZT1wZGZcbiAgICB2YXIgcmVzdWx0ID0gMCxcbiAgICAgIGNudCA9IHBhdGgubGVuZ3RoO1xuICAgIGlmIChjbnQgPCAzKVxuICAgICAgcmV0dXJuIDA7XG4gICAgdmFyIGlwID0gcGF0aFswXTtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8PSBjbnQ7ICsraSlcbiAgICB7XG4gICAgICB2YXIgaXBOZXh0ID0gKGkgPT0gY250ID8gcGF0aFswXSA6IHBhdGhbaV0pO1xuICAgICAgaWYgKGlwTmV4dC5ZID09IHB0LlkpXG4gICAgICB7XG4gICAgICAgIGlmICgoaXBOZXh0LlggPT0gcHQuWCkgfHwgKGlwLlkgPT0gcHQuWSAmJiAoKGlwTmV4dC5YID4gcHQuWCkgPT0gKGlwLlggPCBwdC5YKSkpKVxuICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIGlmICgoaXAuWSA8IHB0LlkpICE9IChpcE5leHQuWSA8IHB0LlkpKVxuICAgICAge1xuICAgICAgICBpZiAoaXAuWCA+PSBwdC5YKVxuICAgICAgICB7XG4gICAgICAgICAgaWYgKGlwTmV4dC5YID4gcHQuWClcbiAgICAgICAgICAgIHJlc3VsdCA9IDEgLSByZXN1bHQ7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZhciBkID0gKGlwLlggLSBwdC5YKSAqIChpcE5leHQuWSAtIHB0LlkpIC0gKGlwTmV4dC5YIC0gcHQuWCkgKiAoaXAuWSAtIHB0LlkpO1xuICAgICAgICAgICAgaWYgKGQgPT0gMClcbiAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgZWxzZSBpZiAoKGQgPiAwKSA9PSAoaXBOZXh0LlkgPiBpcC5ZKSlcbiAgICAgICAgICAgICAgcmVzdWx0ID0gMSAtIHJlc3VsdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgaWYgKGlwTmV4dC5YID4gcHQuWClcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2YXIgZCA9IChpcC5YIC0gcHQuWCkgKiAoaXBOZXh0LlkgLSBwdC5ZKSAtIChpcE5leHQuWCAtIHB0LlgpICogKGlwLlkgLSBwdC5ZKTtcbiAgICAgICAgICAgIGlmIChkID09IDApXG4gICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIGVsc2UgaWYgKChkID4gMCkgPT0gKGlwTmV4dC5ZID4gaXAuWSkpXG4gICAgICAgICAgICAgIHJlc3VsdCA9IDEgLSByZXN1bHQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpcCA9IGlwTmV4dDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlBvaW50SW5Qb2x5Z29uID0gZnVuY3Rpb24gKHB0LCBvcClcbiAge1xuICAgIC8vcmV0dXJucyAwIGlmIGZhbHNlLCArMSBpZiB0cnVlLCAtMSBpZiBwdCBPTiBwb2x5Z29uIGJvdW5kYXJ5XG5cdFx0Ly9TZWUgXCJUaGUgUG9pbnQgaW4gUG9seWdvbiBQcm9ibGVtIGZvciBBcmJpdHJhcnkgUG9seWdvbnNcIiBieSBIb3JtYW5uICYgQWdhdGhvc1xuICAgIC8vaHR0cDovL2NpdGVzZWVyeC5pc3QucHN1LmVkdS92aWV3ZG9jL2Rvd25sb2FkP2RvaT0xMC4xLjEuODguNTQ5OCZyZXA9cmVwMSZ0eXBlPXBkZlxuICAgIHZhciByZXN1bHQgPSAwO1xuICAgIHZhciBzdGFydE9wID0gb3A7XG5cdFx0dmFyIHB0eCA9IHB0LlgsIHB0eSA9IHB0Llk7XG4gICAgdmFyIHBvbHkweCA9IG9wLlB0LlgsIHBvbHkweSA9IG9wLlB0Llk7XG4gICAgZG9cbiAgICB7XG5cdFx0XHRvcCA9IG9wLk5leHQ7XG5cdFx0XHR2YXIgcG9seTF4ID0gb3AuUHQuWCwgcG9seTF5ID0gb3AuUHQuWTtcbiAgICAgIGlmIChwb2x5MXkgPT0gcHR5KVxuICAgICAge1xuICAgICAgICBpZiAoKHBvbHkxeCA9PSBwdHgpIHx8IChwb2x5MHkgPT0gcHR5ICYmICgocG9seTF4ID4gcHR4KSA9PSAocG9seTB4IDwgcHR4KSkpKVxuICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIGlmICgocG9seTB5IDwgcHR5KSAhPSAocG9seTF5IDwgcHR5KSlcbiAgICAgIHtcbiAgICAgICAgaWYgKHBvbHkweCA+PSBwdHgpXG4gICAgICAgIHtcbiAgICAgICAgICBpZiAocG9seTF4ID4gcHR4KVxuICAgICAgICAgICAgcmVzdWx0ID0gMSAtIHJlc3VsdDtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgdmFyIGQgPSAocG9seTB4IC0gcHR4KSAqIChwb2x5MXkgLSBwdHkpIC0gKHBvbHkxeCAtIHB0eCkgKiAocG9seTB5IC0gcHR5KTtcbiAgICAgICAgICAgIGlmIChkID09IDApXG4gICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIGlmICgoZCA+IDApID09IChwb2x5MXkgPiBwb2x5MHkpKVxuICAgICAgICAgICAgICByZXN1bHQgPSAxIC0gcmVzdWx0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICBpZiAocG9seTF4ID4gcHR4KVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZhciBkID0gKHBvbHkweCAtIHB0eCkgKiAocG9seTF5IC0gcHR5KSAtIChwb2x5MXggLSBwdHgpICogKHBvbHkweSAtIHB0eSk7XG4gICAgICAgICAgICBpZiAoZCA9PSAwKVxuICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICBpZiAoKGQgPiAwKSA9PSAocG9seTF5ID4gcG9seTB5KSlcbiAgICAgICAgICAgICAgcmVzdWx0ID0gMSAtIHJlc3VsdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHBvbHkweCA9IHBvbHkxeDtcbiAgICAgIHBvbHkweSA9IHBvbHkxeTtcbiAgICB9IHdoaWxlIChzdGFydE9wICE9IG9wKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Qb2x5MkNvbnRhaW5zUG9seTEgPSBmdW5jdGlvbiAob3V0UHQxLCBvdXRQdDIpXG4gIHtcbiAgICB2YXIgb3AgPSBvdXRQdDE7XG4gICAgZG9cbiAgICB7XG5cdFx0XHQvL25iOiBQb2ludEluUG9seWdvbiByZXR1cm5zIDAgaWYgZmFsc2UsICsxIGlmIHRydWUsIC0xIGlmIHB0IG9uIHBvbHlnb25cbiAgICAgIHZhciByZXMgPSB0aGlzLlBvaW50SW5Qb2x5Z29uKG9wLlB0LCBvdXRQdDIpO1xuICAgICAgaWYgKHJlcyA+PSAwKVxuICAgICAgICByZXR1cm4gcmVzID4gMDtcbiAgICAgIG9wID0gb3AuTmV4dDtcbiAgICB9XG4gICAgd2hpbGUgKG9wICE9IG91dFB0MSlcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5GaXh1cEZpcnN0TGVmdHMxID0gZnVuY3Rpb24gKE9sZE91dFJlYywgTmV3T3V0UmVjKVxuICB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlsZW4gPSB0aGlzLm1fUG9seU91dHMubGVuZ3RoOyBpIDwgaWxlbjsgaSsrKVxuICAgIHtcblx0XHRcdHZhciBvdXRSZWMgPSB0aGlzLm1fUG9seU91dHNbaV07XG5cdFx0XHRpZiAob3V0UmVjLlB0cyA9PSBudWxsIHx8IG91dFJlYy5GaXJzdExlZnQgPT0gbnVsbClcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR2YXIgZmlyc3RMZWZ0ID0gQ2xpcHBlckxpYi5DbGlwcGVyLlBhcnNlRmlyc3RMZWZ0KG91dFJlYy5GaXJzdExlZnQpO1xuXHRcdFx0aWYgKGZpcnN0TGVmdCA9PSBPbGRPdXRSZWMpXG5cdFx0XHR7XG4gICAgICAgIGlmICh0aGlzLlBvbHkyQ29udGFpbnNQb2x5MShvdXRSZWMuUHRzLCBOZXdPdXRSZWMuUHRzKSlcbiAgICAgICAgICBvdXRSZWMuRmlyc3RMZWZ0ID0gTmV3T3V0UmVjO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5GaXh1cEZpcnN0TGVmdHMyID0gZnVuY3Rpb24gKE9sZE91dFJlYywgTmV3T3V0UmVjKVxuICB7XG4gICAgZm9yICh2YXIgJGkyID0gMCwgJHQyID0gdGhpcy5tX1BvbHlPdXRzLCAkbDIgPSAkdDIubGVuZ3RoLCBvdXRSZWMgPSAkdDJbJGkyXTsgJGkyIDwgJGwyOyAkaTIrKywgb3V0UmVjID0gJHQyWyRpMl0pXG4gICAgICBpZiAob3V0UmVjLkZpcnN0TGVmdCA9PSBPbGRPdXRSZWMpXG4gICAgICAgIG91dFJlYy5GaXJzdExlZnQgPSBOZXdPdXRSZWM7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5QYXJzZUZpcnN0TGVmdCA9IGZ1bmN0aW9uIChGaXJzdExlZnQpXG4gIHtcbiAgICB3aGlsZSAoRmlyc3RMZWZ0ICE9IG51bGwgJiYgRmlyc3RMZWZ0LlB0cyA9PSBudWxsKVxuICAgICAgRmlyc3RMZWZ0ID0gRmlyc3RMZWZ0LkZpcnN0TGVmdDtcbiAgICByZXR1cm4gRmlyc3RMZWZ0O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkpvaW5Db21tb25FZGdlcyA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICBmb3IgKHZhciBpID0gMCwgaWxlbiA9IHRoaXMubV9Kb2lucy5sZW5ndGg7IGkgPCBpbGVuOyBpKyspXG4gICAge1xuICAgICAgdmFyIGpvaW4gPSB0aGlzLm1fSm9pbnNbaV07XG4gICAgICB2YXIgb3V0UmVjMSA9IHRoaXMuR2V0T3V0UmVjKGpvaW4uT3V0UHQxLklkeCk7XG4gICAgICB2YXIgb3V0UmVjMiA9IHRoaXMuR2V0T3V0UmVjKGpvaW4uT3V0UHQyLklkeCk7XG4gICAgICBpZiAob3V0UmVjMS5QdHMgPT0gbnVsbCB8fCBvdXRSZWMyLlB0cyA9PSBudWxsKVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIC8vZ2V0IHRoZSBwb2x5Z29uIGZyYWdtZW50IHdpdGggdGhlIGNvcnJlY3QgaG9sZSBzdGF0ZSAoRmlyc3RMZWZ0KVxuICAgICAgLy9iZWZvcmUgY2FsbGluZyBKb2luUG9pbnRzKCkgLi4uXG4gICAgICB2YXIgaG9sZVN0YXRlUmVjO1xuICAgICAgaWYgKG91dFJlYzEgPT0gb3V0UmVjMilcbiAgICAgICAgaG9sZVN0YXRlUmVjID0gb3V0UmVjMTtcbiAgICAgIGVsc2UgaWYgKHRoaXMuUGFyYW0xUmlnaHRPZlBhcmFtMihvdXRSZWMxLCBvdXRSZWMyKSlcbiAgICAgICAgaG9sZVN0YXRlUmVjID0gb3V0UmVjMjtcbiAgICAgIGVsc2UgaWYgKHRoaXMuUGFyYW0xUmlnaHRPZlBhcmFtMihvdXRSZWMyLCBvdXRSZWMxKSlcbiAgICAgICAgaG9sZVN0YXRlUmVjID0gb3V0UmVjMTtcbiAgICAgIGVsc2VcbiAgICAgICAgaG9sZVN0YXRlUmVjID0gdGhpcy5HZXRMb3dlcm1vc3RSZWMob3V0UmVjMSwgb3V0UmVjMik7XG5cbiAgICAgIGlmICghdGhpcy5Kb2luUG9pbnRzKGpvaW4sIG91dFJlYzEsIG91dFJlYzIpKSBjb250aW51ZTtcblxuICAgICAgaWYgKG91dFJlYzEgPT0gb3V0UmVjMilcbiAgICAgIHtcbiAgICAgICAgLy9pbnN0ZWFkIG9mIGpvaW5pbmcgdHdvIHBvbHlnb25zLCB3ZSd2ZSBqdXN0IGNyZWF0ZWQgYSBuZXcgb25lIGJ5XG4gICAgICAgIC8vc3BsaXR0aW5nIG9uZSBwb2x5Z29uIGludG8gdHdvLlxuICAgICAgICBvdXRSZWMxLlB0cyA9IGpvaW4uT3V0UHQxO1xuICAgICAgICBvdXRSZWMxLkJvdHRvbVB0ID0gbnVsbDtcbiAgICAgICAgb3V0UmVjMiA9IHRoaXMuQ3JlYXRlT3V0UmVjKCk7XG4gICAgICAgIG91dFJlYzIuUHRzID0gam9pbi5PdXRQdDI7XG4gICAgICAgIC8vdXBkYXRlIGFsbCBPdXRSZWMyLlB0cyBJZHgncyAuLi5cbiAgICAgICAgdGhpcy5VcGRhdGVPdXRQdElkeHMob3V0UmVjMik7XG4gICAgICAgIC8vV2Ugbm93IG5lZWQgdG8gY2hlY2sgZXZlcnkgT3V0UmVjLkZpcnN0TGVmdCBwb2ludGVyLiBJZiBpdCBwb2ludHNcbiAgICAgICAgLy90byBPdXRSZWMxIGl0IG1heSBuZWVkIHRvIHBvaW50IHRvIE91dFJlYzIgaW5zdGVhZCAuLi5cbiAgICAgICAgaWYgKHRoaXMubV9Vc2luZ1BvbHlUcmVlKVxuICAgICAgICAgIGZvciAodmFyIGogPSAwLCBqbGVuID0gdGhpcy5tX1BvbHlPdXRzLmxlbmd0aDsgaiA8IGpsZW4gLSAxOyBqKyspXG4gICAgICAgICAge1xuICAgICAgICAgICAgdmFyIG9SZWMgPSB0aGlzLm1fUG9seU91dHNbal07XG4gICAgICAgICAgICBpZiAob1JlYy5QdHMgPT0gbnVsbCB8fCBDbGlwcGVyTGliLkNsaXBwZXIuUGFyc2VGaXJzdExlZnQob1JlYy5GaXJzdExlZnQpICE9IG91dFJlYzEgfHwgb1JlYy5Jc0hvbGUgPT0gb3V0UmVjMS5Jc0hvbGUpXG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgaWYgKHRoaXMuUG9seTJDb250YWluc1BvbHkxKG9SZWMuUHRzLCBqb2luLk91dFB0MikpXG4gICAgICAgICAgICAgIG9SZWMuRmlyc3RMZWZ0ID0gb3V0UmVjMjtcbiAgICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLlBvbHkyQ29udGFpbnNQb2x5MShvdXRSZWMyLlB0cywgb3V0UmVjMS5QdHMpKVxuICAgICAgICB7XG4gICAgICAgICAgLy9vdXRSZWMyIGlzIGNvbnRhaW5lZCBieSBvdXRSZWMxIC4uLlxuICAgICAgICAgIG91dFJlYzIuSXNIb2xlID0gIW91dFJlYzEuSXNIb2xlO1xuICAgICAgICAgIG91dFJlYzIuRmlyc3RMZWZ0ID0gb3V0UmVjMTtcbiAgICAgICAgICAvL2ZpeHVwIEZpcnN0TGVmdCBwb2ludGVycyB0aGF0IG1heSBuZWVkIHJlYXNzaWduaW5nIHRvIE91dFJlYzFcbiAgICAgICAgICBpZiAodGhpcy5tX1VzaW5nUG9seVRyZWUpXG4gICAgICAgICAgICB0aGlzLkZpeHVwRmlyc3RMZWZ0czIob3V0UmVjMiwgb3V0UmVjMSk7XG4gICAgICAgICAgaWYgKChvdXRSZWMyLklzSG9sZSBeIHRoaXMuUmV2ZXJzZVNvbHV0aW9uKSA9PSAodGhpcy5BcmVhKG91dFJlYzIpID4gMCkpXG4gICAgICAgICAgICB0aGlzLlJldmVyc2VQb2x5UHRMaW5rcyhvdXRSZWMyLlB0cyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5Qb2x5MkNvbnRhaW5zUG9seTEob3V0UmVjMS5QdHMsIG91dFJlYzIuUHRzKSlcbiAgICAgICAge1xuICAgICAgICAgIC8vb3V0UmVjMSBpcyBjb250YWluZWQgYnkgb3V0UmVjMiAuLi5cbiAgICAgICAgICBvdXRSZWMyLklzSG9sZSA9IG91dFJlYzEuSXNIb2xlO1xuICAgICAgICAgIG91dFJlYzEuSXNIb2xlID0gIW91dFJlYzIuSXNIb2xlO1xuICAgICAgICAgIG91dFJlYzIuRmlyc3RMZWZ0ID0gb3V0UmVjMS5GaXJzdExlZnQ7XG4gICAgICAgICAgb3V0UmVjMS5GaXJzdExlZnQgPSBvdXRSZWMyO1xuICAgICAgICAgIC8vZml4dXAgRmlyc3RMZWZ0IHBvaW50ZXJzIHRoYXQgbWF5IG5lZWQgcmVhc3NpZ25pbmcgdG8gT3V0UmVjMVxuICAgICAgICAgIGlmICh0aGlzLm1fVXNpbmdQb2x5VHJlZSlcbiAgICAgICAgICAgIHRoaXMuRml4dXBGaXJzdExlZnRzMihvdXRSZWMxLCBvdXRSZWMyKTtcbiAgICAgICAgICBpZiAoKG91dFJlYzEuSXNIb2xlIF4gdGhpcy5SZXZlcnNlU29sdXRpb24pID09ICh0aGlzLkFyZWEob3V0UmVjMSkgPiAwKSlcbiAgICAgICAgICAgIHRoaXMuUmV2ZXJzZVBvbHlQdExpbmtzKG91dFJlYzEuUHRzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAvL3RoZSAyIHBvbHlnb25zIGFyZSBjb21wbGV0ZWx5IHNlcGFyYXRlIC4uLlxuICAgICAgICAgIG91dFJlYzIuSXNIb2xlID0gb3V0UmVjMS5Jc0hvbGU7XG4gICAgICAgICAgb3V0UmVjMi5GaXJzdExlZnQgPSBvdXRSZWMxLkZpcnN0TGVmdDtcbiAgICAgICAgICAvL2ZpeHVwIEZpcnN0TGVmdCBwb2ludGVycyB0aGF0IG1heSBuZWVkIHJlYXNzaWduaW5nIHRvIE91dFJlYzJcbiAgICAgICAgICBpZiAodGhpcy5tX1VzaW5nUG9seVRyZWUpXG4gICAgICAgICAgICB0aGlzLkZpeHVwRmlyc3RMZWZ0czEob3V0UmVjMSwgb3V0UmVjMik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgLy9qb2luZWQgMiBwb2x5Z29ucyB0b2dldGhlciAuLi5cbiAgICAgICAgb3V0UmVjMi5QdHMgPSBudWxsO1xuICAgICAgICBvdXRSZWMyLkJvdHRvbVB0ID0gbnVsbDtcbiAgICAgICAgb3V0UmVjMi5JZHggPSBvdXRSZWMxLklkeDtcbiAgICAgICAgb3V0UmVjMS5Jc0hvbGUgPSBob2xlU3RhdGVSZWMuSXNIb2xlO1xuICAgICAgICBpZiAoaG9sZVN0YXRlUmVjID09IG91dFJlYzIpXG4gICAgICAgICAgb3V0UmVjMS5GaXJzdExlZnQgPSBvdXRSZWMyLkZpcnN0TGVmdDtcbiAgICAgICAgb3V0UmVjMi5GaXJzdExlZnQgPSBvdXRSZWMxO1xuICAgICAgICAvL2ZpeHVwIEZpcnN0TGVmdCBwb2ludGVycyB0aGF0IG1heSBuZWVkIHJlYXNzaWduaW5nIHRvIE91dFJlYzFcbiAgICAgICAgaWYgKHRoaXMubV9Vc2luZ1BvbHlUcmVlKVxuICAgICAgICAgIHRoaXMuRml4dXBGaXJzdExlZnRzMihvdXRSZWMyLCBvdXRSZWMxKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuVXBkYXRlT3V0UHRJZHhzID0gZnVuY3Rpb24gKG91dHJlYylcbiAge1xuICAgIHZhciBvcCA9IG91dHJlYy5QdHM7XG4gICAgZG8ge1xuICAgICAgb3AuSWR4ID0gb3V0cmVjLklkeDtcbiAgICAgIG9wID0gb3AuUHJldjtcbiAgICB9XG4gICAgd2hpbGUgKG9wICE9IG91dHJlYy5QdHMpXG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRG9TaW1wbGVQb2x5Z29ucyA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB2YXIgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCB0aGlzLm1fUG9seU91dHMubGVuZ3RoKVxuICAgIHtcbiAgICAgIHZhciBvdXRyZWMgPSB0aGlzLm1fUG9seU91dHNbaSsrXTtcbiAgICAgIHZhciBvcCA9IG91dHJlYy5QdHM7XG5cdFx0XHRpZiAob3AgPT0gbnVsbCB8fCBvdXRyZWMuSXNPcGVuKVxuXHRcdFx0XHRjb250aW51ZTtcbiAgICAgIGRvIC8vZm9yIGVhY2ggUHQgaW4gUG9seWdvbiB1bnRpbCBkdXBsaWNhdGUgZm91bmQgZG8gLi4uXG4gICAgICB7XG4gICAgICAgIHZhciBvcDIgPSBvcC5OZXh0O1xuICAgICAgICB3aGlsZSAob3AyICE9IG91dHJlYy5QdHMpXG4gICAgICAgIHtcbiAgICAgICAgICBpZiAoKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkob3AuUHQsIG9wMi5QdCkpICYmIG9wMi5OZXh0ICE9IG9wICYmIG9wMi5QcmV2ICE9IG9wKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIC8vc3BsaXQgdGhlIHBvbHlnb24gaW50byB0d28gLi4uXG4gICAgICAgICAgICB2YXIgb3AzID0gb3AuUHJldjtcbiAgICAgICAgICAgIHZhciBvcDQgPSBvcDIuUHJldjtcbiAgICAgICAgICAgIG9wLlByZXYgPSBvcDQ7XG4gICAgICAgICAgICBvcDQuTmV4dCA9IG9wO1xuICAgICAgICAgICAgb3AyLlByZXYgPSBvcDM7XG4gICAgICAgICAgICBvcDMuTmV4dCA9IG9wMjtcbiAgICAgICAgICAgIG91dHJlYy5QdHMgPSBvcDtcbiAgICAgICAgICAgIHZhciBvdXRyZWMyID0gdGhpcy5DcmVhdGVPdXRSZWMoKTtcbiAgICAgICAgICAgIG91dHJlYzIuUHRzID0gb3AyO1xuICAgICAgICAgICAgdGhpcy5VcGRhdGVPdXRQdElkeHMob3V0cmVjMik7XG4gICAgICAgICAgICBpZiAodGhpcy5Qb2x5MkNvbnRhaW5zUG9seTEob3V0cmVjMi5QdHMsIG91dHJlYy5QdHMpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAvL091dFJlYzIgaXMgY29udGFpbmVkIGJ5IE91dFJlYzEgLi4uXG4gICAgICAgICAgICAgIG91dHJlYzIuSXNIb2xlID0gIW91dHJlYy5Jc0hvbGU7XG4gICAgICAgICAgICAgIG91dHJlYzIuRmlyc3RMZWZ0ID0gb3V0cmVjO1xuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5tX1VzaW5nUG9seVRyZWUpIHRoaXMuRml4dXBGaXJzdExlZnRzMihvdXRyZWMyLCBvdXRyZWMpO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0aGlzLlBvbHkyQ29udGFpbnNQb2x5MShvdXRyZWMuUHRzLCBvdXRyZWMyLlB0cykpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIC8vT3V0UmVjMSBpcyBjb250YWluZWQgYnkgT3V0UmVjMiAuLi5cbiAgICAgICAgICAgICAgb3V0cmVjMi5Jc0hvbGUgPSBvdXRyZWMuSXNIb2xlO1xuICAgICAgICAgICAgICBvdXRyZWMuSXNIb2xlID0gIW91dHJlYzIuSXNIb2xlO1xuICAgICAgICAgICAgICBvdXRyZWMyLkZpcnN0TGVmdCA9IG91dHJlYy5GaXJzdExlZnQ7XG4gICAgICAgICAgICAgIG91dHJlYy5GaXJzdExlZnQgPSBvdXRyZWMyO1xuICAgICAgICAgICAgICBpZiAodGhpcy5tX1VzaW5nUG9seVRyZWUpIHRoaXMuRml4dXBGaXJzdExlZnRzMihvdXRyZWMsIG91dHJlYzIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAvL3RoZSAyIHBvbHlnb25zIGFyZSBzZXBhcmF0ZSAuLi5cbiAgICAgICAgICAgICAgb3V0cmVjMi5Jc0hvbGUgPSBvdXRyZWMuSXNIb2xlO1xuICAgICAgICAgICAgICBvdXRyZWMyLkZpcnN0TGVmdCA9IG91dHJlYy5GaXJzdExlZnQ7XG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLm1fVXNpbmdQb2x5VHJlZSkgdGhpcy5GaXh1cEZpcnN0TGVmdHMxKG91dHJlYywgb3V0cmVjMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvcDIgPSBvcDtcbiAgICAgICAgICAgIC8vaWUgZ2V0IHJlYWR5IGZvciB0aGUgbmV4dCBpdGVyYXRpb25cbiAgICAgICAgICB9XG4gICAgICAgICAgb3AyID0gb3AyLk5leHQ7XG4gICAgICAgIH1cbiAgICAgICAgb3AgPSBvcC5OZXh0O1xuICAgICAgfVxuICAgICAgd2hpbGUgKG9wICE9IG91dHJlYy5QdHMpXG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuQXJlYSA9IGZ1bmN0aW9uIChwb2x5KVxuICB7XG4gICAgdmFyIGNudCA9IHBvbHkubGVuZ3RoO1xuICAgIGlmIChjbnQgPCAzKVxuICAgICAgcmV0dXJuIDA7XG4gICAgdmFyIGEgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwLCBqID0gY250IC0gMTsgaSA8IGNudDsgKytpKVxuICAgIHtcbiAgICAgIGEgKz0gKHBvbHlbal0uWCArIHBvbHlbaV0uWCkgKiAocG9seVtqXS5ZIC0gcG9seVtpXS5ZKTtcbiAgICAgIGogPSBpO1xuICAgIH1cbiAgICByZXR1cm4gLWEgKiAwLjU7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuQXJlYSA9IGZ1bmN0aW9uIChvdXRSZWMpXG4gIHtcbiAgICB2YXIgb3AgPSBvdXRSZWMuUHRzO1xuICAgIGlmIChvcCA9PSBudWxsKVxuICAgICAgcmV0dXJuIDA7XG4gICAgdmFyIGEgPSAwO1xuICAgIGRvIHtcbiAgICAgIGEgPSBhICsgKG9wLlByZXYuUHQuWCArIG9wLlB0LlgpICogKG9wLlByZXYuUHQuWSAtIG9wLlB0LlkpO1xuICAgICAgb3AgPSBvcC5OZXh0O1xuICAgIH1cbiAgICB3aGlsZSAob3AgIT0gb3V0UmVjLlB0cylcbiAgICByZXR1cm4gYSAqIDAuNTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLlNpbXBsaWZ5UG9seWdvbiA9IGZ1bmN0aW9uIChwb2x5LCBmaWxsVHlwZSlcbiAge1xuICAgIHZhciByZXN1bHQgPSBuZXcgQXJyYXkoKTtcbiAgICB2YXIgYyA9IG5ldyBDbGlwcGVyTGliLkNsaXBwZXIoMCk7XG4gICAgYy5TdHJpY3RseVNpbXBsZSA9IHRydWU7XG4gICAgYy5BZGRQYXRoKHBvbHksIENsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0LCB0cnVlKTtcbiAgICBjLkV4ZWN1dGUoQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFVuaW9uLCByZXN1bHQsIGZpbGxUeXBlLCBmaWxsVHlwZSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLlNpbXBsaWZ5UG9seWdvbnMgPSBmdW5jdGlvbiAocG9seXMsIGZpbGxUeXBlKVxuICB7XG4gICAgaWYgKHR5cGVvZiAoZmlsbFR5cGUpID09IFwidW5kZWZpbmVkXCIpIGZpbGxUeXBlID0gQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0RXZlbk9kZDtcbiAgICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KCk7XG4gICAgdmFyIGMgPSBuZXcgQ2xpcHBlckxpYi5DbGlwcGVyKDApO1xuICAgIGMuU3RyaWN0bHlTaW1wbGUgPSB0cnVlO1xuICAgIGMuQWRkUGF0aHMocG9seXMsIENsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0LCB0cnVlKTtcbiAgICBjLkV4ZWN1dGUoQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFVuaW9uLCByZXN1bHQsIGZpbGxUeXBlLCBmaWxsVHlwZSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLkRpc3RhbmNlU3FyZCA9IGZ1bmN0aW9uIChwdDEsIHB0MilcbiAge1xuICAgIHZhciBkeCA9IChwdDEuWCAtIHB0Mi5YKTtcbiAgICB2YXIgZHkgPSAocHQxLlkgLSBwdDIuWSk7XG4gICAgcmV0dXJuIChkeCAqIGR4ICsgZHkgKiBkeSk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5EaXN0YW5jZUZyb21MaW5lU3FyZCA9IGZ1bmN0aW9uIChwdCwgbG4xLCBsbjIpXG4gIHtcbiAgICAvL1RoZSBlcXVhdGlvbiBvZiBhIGxpbmUgaW4gZ2VuZXJhbCBmb3JtIChBeCArIEJ5ICsgQyA9IDApXG4gICAgLy9naXZlbiAyIHBvaW50cyAoeMK5LHnCuSkgJiAoeMKyLHnCsikgaXMgLi4uXG4gICAgLy8oecK5IC0gecKyKXggKyAoeMKyIC0geMK5KXkgKyAoecKyIC0gecK5KXjCuSAtICh4wrIgLSB4wrkpecK5ID0gMFxuICAgIC8vQSA9ICh5wrkgLSB5wrIpOyBCID0gKHjCsiAtIHjCuSk7IEMgPSAoecKyIC0gecK5KXjCuSAtICh4wrIgLSB4wrkpecK5XG4gICAgLy9wZXJwZW5kaWN1bGFyIGRpc3RhbmNlIG9mIHBvaW50ICh4wrMsecKzKSA9IChBeMKzICsgQnnCsyArIEMpL1NxcnQoQcKyICsgQsKyKVxuICAgIC8vc2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvUGVycGVuZGljdWxhcl9kaXN0YW5jZVxuICAgIHZhciBBID0gbG4xLlkgLSBsbjIuWTtcbiAgICB2YXIgQiA9IGxuMi5YIC0gbG4xLlg7XG4gICAgdmFyIEMgPSBBICogbG4xLlggKyBCICogbG4xLlk7XG4gICAgQyA9IEEgKiBwdC5YICsgQiAqIHB0LlkgLSBDO1xuICAgIHJldHVybiAoQyAqIEMpIC8gKEEgKiBBICsgQiAqIEIpO1xuICB9O1xuXG5cdENsaXBwZXJMaWIuQ2xpcHBlci5TbG9wZXNOZWFyQ29sbGluZWFyID0gZnVuY3Rpb24ocHQxLCBwdDIsIHB0MywgZGlzdFNxcmQpXG5cdHtcblx0XHQvL3RoaXMgZnVuY3Rpb24gaXMgbW9yZSBhY2N1cmF0ZSB3aGVuIHRoZSBwb2ludCB0aGF0J3MgR0VPTUVUUklDQUxMWVxuXHRcdC8vYmV0d2VlbiB0aGUgb3RoZXIgMiBwb2ludHMgaXMgdGhlIG9uZSB0aGF0J3MgdGVzdGVkIGZvciBkaXN0YW5jZS5cblx0XHQvL25iOiB3aXRoICdzcGlrZXMnLCBlaXRoZXIgcHQxIG9yIHB0MyBpcyBnZW9tZXRyaWNhbGx5IGJldHdlZW4gdGhlIG90aGVyIHB0c1xuXHRcdGlmIChNYXRoLmFicyhwdDEuWCAtIHB0Mi5YKSA+IE1hdGguYWJzKHB0MS5ZIC0gcHQyLlkpKVxuXHRcdHtcblx0XHRpZiAoKHB0MS5YID4gcHQyLlgpID09IChwdDEuWCA8IHB0My5YKSlcblx0XHRcdHJldHVybiBDbGlwcGVyTGliLkNsaXBwZXIuRGlzdGFuY2VGcm9tTGluZVNxcmQocHQxLCBwdDIsIHB0MykgPCBkaXN0U3FyZDtcblx0XHRlbHNlIGlmICgocHQyLlggPiBwdDEuWCkgPT0gKHB0Mi5YIDwgcHQzLlgpKVxuXHRcdFx0cmV0dXJuIENsaXBwZXJMaWIuQ2xpcHBlci5EaXN0YW5jZUZyb21MaW5lU3FyZChwdDIsIHB0MSwgcHQzKSA8IGRpc3RTcXJkO1xuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHJldHVybiBDbGlwcGVyTGliLkNsaXBwZXIuRGlzdGFuY2VGcm9tTGluZVNxcmQocHQzLCBwdDEsIHB0MikgPCBkaXN0U3FyZDtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRpZiAoKHB0MS5ZID4gcHQyLlkpID09IChwdDEuWSA8IHB0My5ZKSlcblx0XHRcdHJldHVybiBDbGlwcGVyTGliLkNsaXBwZXIuRGlzdGFuY2VGcm9tTGluZVNxcmQocHQxLCBwdDIsIHB0MykgPCBkaXN0U3FyZDtcblx0XHRlbHNlIGlmICgocHQyLlkgPiBwdDEuWSkgPT0gKHB0Mi5ZIDwgcHQzLlkpKVxuXHRcdFx0cmV0dXJuIENsaXBwZXJMaWIuQ2xpcHBlci5EaXN0YW5jZUZyb21MaW5lU3FyZChwdDIsIHB0MSwgcHQzKSA8IGRpc3RTcXJkO1xuXHRcdFx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gQ2xpcHBlckxpYi5DbGlwcGVyLkRpc3RhbmNlRnJvbUxpbmVTcXJkKHB0MywgcHQxLCBwdDIpIDwgZGlzdFNxcmQ7XG5cdFx0fVxuXHR9XG5cbiAgQ2xpcHBlckxpYi5DbGlwcGVyLlBvaW50c0FyZUNsb3NlID0gZnVuY3Rpb24gKHB0MSwgcHQyLCBkaXN0U3FyZClcbiAge1xuICAgIHZhciBkeCA9IHB0MS5YIC0gcHQyLlg7XG4gICAgdmFyIGR5ID0gcHQxLlkgLSBwdDIuWTtcbiAgICByZXR1cm4gKChkeCAqIGR4KSArIChkeSAqIGR5KSA8PSBkaXN0U3FyZCk7XG4gIH07XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIENsaXBwZXJMaWIuQ2xpcHBlci5FeGNsdWRlT3AgPSBmdW5jdGlvbiAob3ApXG4gIHtcbiAgICB2YXIgcmVzdWx0ID0gb3AuUHJldjtcbiAgICByZXN1bHQuTmV4dCA9IG9wLk5leHQ7XG4gICAgb3AuTmV4dC5QcmV2ID0gcmVzdWx0O1xuICAgIHJlc3VsdC5JZHggPSAwO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5DbGVhblBvbHlnb24gPSBmdW5jdGlvbiAocGF0aCwgZGlzdGFuY2UpXG4gIHtcbiAgICBpZiAodHlwZW9mIChkaXN0YW5jZSkgPT0gXCJ1bmRlZmluZWRcIikgZGlzdGFuY2UgPSAxLjQxNTtcbiAgICAvL2Rpc3RhbmNlID0gcHJveGltaXR5IGluIHVuaXRzL3BpeGVscyBiZWxvdyB3aGljaCB2ZXJ0aWNlcyB3aWxsIGJlIHN0cmlwcGVkLlxuICAgIC8vRGVmYXVsdCB+PSBzcXJ0KDIpIHNvIHdoZW4gYWRqYWNlbnQgdmVydGljZXMgb3Igc2VtaS1hZGphY2VudCB2ZXJ0aWNlcyBoYXZlXG4gICAgLy9ib3RoIHggJiB5IGNvb3JkcyB3aXRoaW4gMSB1bml0LCB0aGVuIHRoZSBzZWNvbmQgdmVydGV4IHdpbGwgYmUgc3RyaXBwZWQuXG4gICAgdmFyIGNudCA9IHBhdGgubGVuZ3RoO1xuICAgIGlmIChjbnQgPT0gMClcbiAgICAgIHJldHVybiBuZXcgQXJyYXkoKTtcbiAgICB2YXIgb3V0UHRzID0gbmV3IEFycmF5KGNudCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbnQ7ICsraSlcbiAgICAgIG91dFB0c1tpXSA9IG5ldyBDbGlwcGVyTGliLk91dFB0KCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbnQ7ICsraSlcbiAgICB7XG4gICAgICBvdXRQdHNbaV0uUHQgPSBwYXRoW2ldO1xuICAgICAgb3V0UHRzW2ldLk5leHQgPSBvdXRQdHNbKGkgKyAxKSAlIGNudF07XG4gICAgICBvdXRQdHNbaV0uTmV4dC5QcmV2ID0gb3V0UHRzW2ldO1xuICAgICAgb3V0UHRzW2ldLklkeCA9IDA7XG4gICAgfVxuICAgIHZhciBkaXN0U3FyZCA9IGRpc3RhbmNlICogZGlzdGFuY2U7XG4gICAgdmFyIG9wID0gb3V0UHRzWzBdO1xuICAgIHdoaWxlIChvcC5JZHggPT0gMCAmJiBvcC5OZXh0ICE9IG9wLlByZXYpXG4gICAge1xuICAgICAgaWYgKENsaXBwZXJMaWIuQ2xpcHBlci5Qb2ludHNBcmVDbG9zZShvcC5QdCwgb3AuUHJldi5QdCwgZGlzdFNxcmQpKVxuICAgICAge1xuICAgICAgICBvcCA9IENsaXBwZXJMaWIuQ2xpcHBlci5FeGNsdWRlT3Aob3ApO1xuICAgICAgICBjbnQtLTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKENsaXBwZXJMaWIuQ2xpcHBlci5Qb2ludHNBcmVDbG9zZShvcC5QcmV2LlB0LCBvcC5OZXh0LlB0LCBkaXN0U3FyZCkpXG4gICAgICB7XG4gICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlci5FeGNsdWRlT3Aob3AuTmV4dCk7XG4gICAgICAgIG9wID0gQ2xpcHBlckxpYi5DbGlwcGVyLkV4Y2x1ZGVPcChvcCk7XG4gICAgICAgIGNudCAtPSAyO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoQ2xpcHBlckxpYi5DbGlwcGVyLlNsb3Blc05lYXJDb2xsaW5lYXIob3AuUHJldi5QdCwgb3AuUHQsIG9wLk5leHQuUHQsIGRpc3RTcXJkKSlcbiAgICAgIHtcbiAgICAgICAgb3AgPSBDbGlwcGVyTGliLkNsaXBwZXIuRXhjbHVkZU9wKG9wKTtcbiAgICAgICAgY250LS07XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIG9wLklkeCA9IDE7XG4gICAgICAgIG9wID0gb3AuTmV4dDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNudCA8IDMpXG4gICAgICBjbnQgPSAwO1xuICAgIHZhciByZXN1bHQgPSBuZXcgQXJyYXkoY250KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNudDsgKytpKVxuICAgIHtcbiAgICAgIHJlc3VsdFtpXSA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KG9wLlB0KTtcbiAgICAgIG9wID0gb3AuTmV4dDtcbiAgICB9XG4gICAgb3V0UHRzID0gbnVsbDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuQ2xlYW5Qb2x5Z29ucyA9IGZ1bmN0aW9uIChwb2x5cywgZGlzdGFuY2UpXG4gIHtcbiAgICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KHBvbHlzLmxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlsZW4gPSBwb2x5cy5sZW5ndGg7IGkgPCBpbGVuOyBpKyspXG4gICAgICByZXN1bHRbaV0gPSBDbGlwcGVyTGliLkNsaXBwZXIuQ2xlYW5Qb2x5Z29uKHBvbHlzW2ldLCBkaXN0YW5jZSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLk1pbmtvd3NraSA9IGZ1bmN0aW9uIChwYXR0ZXJuLCBwYXRoLCBJc1N1bSwgSXNDbG9zZWQpXG4gIHtcbiAgICB2YXIgZGVsdGEgPSAoSXNDbG9zZWQgPyAxIDogMCk7XG4gICAgdmFyIHBvbHlDbnQgPSBwYXR0ZXJuLmxlbmd0aDtcbiAgICB2YXIgcGF0aENudCA9IHBhdGgubGVuZ3RoO1xuICAgIHZhciByZXN1bHQgPSBuZXcgQXJyYXkoKTtcbiAgICBpZiAoSXNTdW0pXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGhDbnQ7IGkrKylcbiAgICAgIHtcbiAgICAgICAgdmFyIHAgPSBuZXcgQXJyYXkocG9seUNudCk7XG4gICAgICAgIGZvciAodmFyIGogPSAwLCBqbGVuID0gcGF0dGVybi5sZW5ndGgsIGlwID0gcGF0dGVybltqXTsgaiA8IGpsZW47IGorKywgaXAgPSBwYXR0ZXJuW2pdKVxuICAgICAgICAgIHBbal0gPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChwYXRoW2ldLlggKyBpcC5YLCBwYXRoW2ldLlkgKyBpcC5ZKTtcbiAgICAgICAgcmVzdWx0LnB1c2gocCk7XG4gICAgICB9XG4gICAgZWxzZVxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoQ250OyBpKyspXG4gICAgICB7XG4gICAgICAgIHZhciBwID0gbmV3IEFycmF5KHBvbHlDbnQpO1xuICAgICAgICBmb3IgKHZhciBqID0gMCwgamxlbiA9IHBhdHRlcm4ubGVuZ3RoLCBpcCA9IHBhdHRlcm5bal07IGogPCBqbGVuOyBqKyssIGlwID0gcGF0dGVybltqXSlcbiAgICAgICAgICBwW2pdID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQocGF0aFtpXS5YIC0gaXAuWCwgcGF0aFtpXS5ZIC0gaXAuWSk7XG4gICAgICAgIHJlc3VsdC5wdXNoKHApO1xuICAgICAgfVxuICAgIHZhciBxdWFkcyA9IG5ldyBBcnJheSgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aENudCAtIDEgKyBkZWx0YTsgaSsrKVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBwb2x5Q250OyBqKyspXG4gICAgICB7XG4gICAgICAgIHZhciBxdWFkID0gbmV3IEFycmF5KCk7XG4gICAgICAgIHF1YWQucHVzaChyZXN1bHRbaSAlIHBhdGhDbnRdW2ogJSBwb2x5Q250XSk7XG4gICAgICAgIHF1YWQucHVzaChyZXN1bHRbKGkgKyAxKSAlIHBhdGhDbnRdW2ogJSBwb2x5Q250XSk7XG4gICAgICAgIHF1YWQucHVzaChyZXN1bHRbKGkgKyAxKSAlIHBhdGhDbnRdWyhqICsgMSkgJSBwb2x5Q250XSk7XG4gICAgICAgIHF1YWQucHVzaChyZXN1bHRbaSAlIHBhdGhDbnRdWyhqICsgMSkgJSBwb2x5Q250XSk7XG4gICAgICAgIGlmICghQ2xpcHBlckxpYi5DbGlwcGVyLk9yaWVudGF0aW9uKHF1YWQpKVxuICAgICAgICAgIHF1YWQucmV2ZXJzZSgpO1xuICAgICAgICBxdWFkcy5wdXNoKHF1YWQpO1xuICAgICAgfVxuXHRcdFx0cmV0dXJuIHF1YWRzO1xuICB9O1xuXG5cdENsaXBwZXJMaWIuQ2xpcHBlci5NaW5rb3dza2lTdW0gPSBmdW5jdGlvbihwYXR0ZXJuLCBwYXRoX29yX3BhdGhzLCBwYXRoSXNDbG9zZWQpXG5cdHtcblx0XHRpZighKHBhdGhfb3JfcGF0aHNbMF0gaW5zdGFuY2VvZiBBcnJheSkpXG5cdFx0e1xuXHRcdFx0dmFyIHBhdGggPSBwYXRoX29yX3BhdGhzO1xuXHRcdFx0dmFyIHBhdGhzID0gQ2xpcHBlckxpYi5DbGlwcGVyLk1pbmtvd3NraShwYXR0ZXJuLCBwYXRoLCB0cnVlLCBwYXRoSXNDbG9zZWQpO1xuXHRcdFx0dmFyIGMgPSBuZXcgQ2xpcHBlckxpYi5DbGlwcGVyKCk7XG5cdFx0XHRjLkFkZFBhdGhzKHBhdGhzLCBDbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdCwgdHJ1ZSk7XG5cdFx0XHRjLkV4ZWN1dGUoQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFVuaW9uLCBwYXRocywgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybywgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybyk7XG5cdFx0XHRyZXR1cm4gcGF0aHM7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG4gXHRcdFx0dmFyIHBhdGhzID0gcGF0aF9vcl9wYXRocztcblx0XHRcdHZhciBzb2x1dGlvbiA9IG5ldyBDbGlwcGVyTGliLlBhdGhzKCk7XG5cdFx0XHR2YXIgYyA9IG5ldyBDbGlwcGVyTGliLkNsaXBwZXIoKTtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aHMubGVuZ3RoOyArK2kpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciB0bXAgPSBDbGlwcGVyTGliLkNsaXBwZXIuTWlua293c2tpKHBhdHRlcm4sIHBhdGhzW2ldLCB0cnVlLCBwYXRoSXNDbG9zZWQpO1xuXHRcdFx0XHRjLkFkZFBhdGhzKHRtcCwgQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdFN1YmplY3QsIHRydWUpO1xuXHRcdFx0XHRpZiAocGF0aElzQ2xvc2VkKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dmFyIHBhdGggPSBDbGlwcGVyTGliLkNsaXBwZXIuVHJhbnNsYXRlUGF0aChwYXRoc1tpXSwgcGF0dGVyblswXSk7XG5cdFx0XHRcdFx0Yy5BZGRQYXRoKHBhdGgsIENsaXBwZXJMaWIuUG9seVR5cGUucHRDbGlwLCB0cnVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0Yy5FeGVjdXRlKENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RVbmlvbiwgc29sdXRpb24sXG5cdFx0XHRcdENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm8sIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm8pO1xuXHRcdFx0cmV0dXJuIHNvbHV0aW9uO1xuXHRcdH1cblx0fVxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdENsaXBwZXJMaWIuQ2xpcHBlci5UcmFuc2xhdGVQYXRoID0gZnVuY3Rpb24gKHBhdGgsIGRlbHRhKVxuXHR7XG5cdFx0dmFyIG91dFBhdGggPSBuZXcgQ2xpcHBlckxpYi5QYXRoKCk7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKVxuXHRcdFx0b3V0UGF0aC5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KHBhdGhbaV0uWCArIGRlbHRhLlgsIHBhdGhbaV0uWSArIGRlbHRhLlkpKTtcblx0XHRyZXR1cm4gb3V0UGF0aDtcblx0fVxuXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdENsaXBwZXJMaWIuQ2xpcHBlci5NaW5rb3dza2lEaWZmID0gZnVuY3Rpb24gKHBvbHkxLCBwb2x5Milcblx0e1xuXHRcdHZhciBwYXRocyA9IENsaXBwZXJMaWIuQ2xpcHBlci5NaW5rb3dza2kocG9seTEsIHBvbHkyLCBmYWxzZSwgdHJ1ZSk7XG5cdFx0dmFyIGMgPSBuZXcgQ2xpcHBlckxpYi5DbGlwcGVyKCk7XG5cdFx0Yy5BZGRQYXRocyhwYXRocywgQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdFN1YmplY3QsIHRydWUpO1xuXHRcdGMuRXhlY3V0ZShDbGlwcGVyTGliLkNsaXBUeXBlLmN0VW5pb24sIHBhdGhzLCBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvLCBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvKTtcblx0XHRyZXR1cm4gcGF0aHM7XG5cdH1cblxuICBDbGlwcGVyTGliLkNsaXBwZXIuUG9seVRyZWVUb1BhdGhzID0gZnVuY3Rpb24gKHBvbHl0cmVlKVxuICB7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBBcnJheSgpO1xuICAgIC8vcmVzdWx0LnNldF9DYXBhY2l0eShwb2x5dHJlZS5nZXRfVG90YWwoKSk7XG4gICAgQ2xpcHBlckxpYi5DbGlwcGVyLkFkZFBvbHlOb2RlVG9QYXRocyhwb2x5dHJlZSwgQ2xpcHBlckxpYi5DbGlwcGVyLk5vZGVUeXBlLm50QW55LCByZXN1bHQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5BZGRQb2x5Tm9kZVRvUGF0aHMgPSBmdW5jdGlvbiAocG9seW5vZGUsIG50LCBwYXRocylcbiAge1xuICAgIHZhciBtYXRjaCA9IHRydWU7XG4gICAgc3dpdGNoIChudClcbiAgICB7XG4gICAgY2FzZSBDbGlwcGVyTGliLkNsaXBwZXIuTm9kZVR5cGUubnRPcGVuOlxuICAgICAgcmV0dXJuO1xuICAgIGNhc2UgQ2xpcHBlckxpYi5DbGlwcGVyLk5vZGVUeXBlLm50Q2xvc2VkOlxuICAgICAgbWF0Y2ggPSAhcG9seW5vZGUuSXNPcGVuO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAocG9seW5vZGUubV9wb2x5Z29uLmxlbmd0aCA+IDAgJiYgbWF0Y2gpXG4gICAgICBwYXRocy5wdXNoKHBvbHlub2RlLm1fcG9seWdvbik7XG4gICAgZm9yICh2YXIgJGkzID0gMCwgJHQzID0gcG9seW5vZGUuQ2hpbGRzKCksICRsMyA9ICR0My5sZW5ndGgsIHBuID0gJHQzWyRpM107ICRpMyA8ICRsMzsgJGkzKyssIHBuID0gJHQzWyRpM10pXG4gICAgICBDbGlwcGVyTGliLkNsaXBwZXIuQWRkUG9seU5vZGVUb1BhdGhzKHBuLCBudCwgcGF0aHMpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuT3BlblBhdGhzRnJvbVBvbHlUcmVlID0gZnVuY3Rpb24gKHBvbHl0cmVlKVxuICB7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBDbGlwcGVyTGliLlBhdGhzKCk7XG4gICAgLy9yZXN1bHQuc2V0X0NhcGFjaXR5KHBvbHl0cmVlLkNoaWxkQ291bnQoKSk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlsZW4gPSBwb2x5dHJlZS5DaGlsZENvdW50KCk7IGkgPCBpbGVuOyBpKyspXG4gICAgICBpZiAocG9seXRyZWUuQ2hpbGRzKClbaV0uSXNPcGVuKVxuICAgICAgICByZXN1bHQucHVzaChwb2x5dHJlZS5DaGlsZHMoKVtpXS5tX3BvbHlnb24pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5DbG9zZWRQYXRoc0Zyb21Qb2x5VHJlZSA9IGZ1bmN0aW9uIChwb2x5dHJlZSlcbiAge1xuICAgIHZhciByZXN1bHQgPSBuZXcgQ2xpcHBlckxpYi5QYXRocygpO1xuICAgIC8vcmVzdWx0LnNldF9DYXBhY2l0eShwb2x5dHJlZS5Ub3RhbCgpKTtcbiAgICBDbGlwcGVyTGliLkNsaXBwZXIuQWRkUG9seU5vZGVUb1BhdGhzKHBvbHl0cmVlLCBDbGlwcGVyTGliLkNsaXBwZXIuTm9kZVR5cGUubnRDbG9zZWQsIHJlc3VsdCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgSW5oZXJpdChDbGlwcGVyTGliLkNsaXBwZXIsIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UpO1xuICBDbGlwcGVyTGliLkNsaXBwZXIuTm9kZVR5cGUgPSB7XG4gICAgbnRBbnk6IDAsXG4gICAgbnRPcGVuOiAxLFxuICAgIG50Q2xvc2VkOiAyXG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldCA9IGZ1bmN0aW9uIChtaXRlckxpbWl0LCBhcmNUb2xlcmFuY2UpXG4gIHtcbiAgICBpZiAodHlwZW9mIChtaXRlckxpbWl0KSA9PSBcInVuZGVmaW5lZFwiKSBtaXRlckxpbWl0ID0gMjtcbiAgICBpZiAodHlwZW9mIChhcmNUb2xlcmFuY2UpID09IFwidW5kZWZpbmVkXCIpIGFyY1RvbGVyYW5jZSA9IENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5kZWZfYXJjX3RvbGVyYW5jZTtcbiAgICB0aGlzLm1fZGVzdFBvbHlzID0gbmV3IENsaXBwZXJMaWIuUGF0aHMoKTtcbiAgICB0aGlzLm1fc3JjUG9seSA9IG5ldyBDbGlwcGVyTGliLlBhdGgoKTtcbiAgICB0aGlzLm1fZGVzdFBvbHkgPSBuZXcgQ2xpcHBlckxpYi5QYXRoKCk7XG4gICAgdGhpcy5tX25vcm1hbHMgPSBuZXcgQXJyYXkoKTtcbiAgICB0aGlzLm1fZGVsdGEgPSAwO1xuICAgIHRoaXMubV9zaW5BID0gMDtcbiAgICB0aGlzLm1fc2luID0gMDtcbiAgICB0aGlzLm1fY29zID0gMDtcbiAgICB0aGlzLm1fbWl0ZXJMaW0gPSAwO1xuICAgIHRoaXMubV9TdGVwc1BlclJhZCA9IDA7XG4gICAgdGhpcy5tX2xvd2VzdCA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KCk7XG4gICAgdGhpcy5tX3BvbHlOb2RlcyA9IG5ldyBDbGlwcGVyTGliLlBvbHlOb2RlKCk7XG4gICAgdGhpcy5NaXRlckxpbWl0ID0gbWl0ZXJMaW1pdDtcbiAgICB0aGlzLkFyY1RvbGVyYW5jZSA9IGFyY1RvbGVyYW5jZTtcbiAgICB0aGlzLm1fbG93ZXN0LlggPSAtMTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LnR3b19waSA9IDYuMjgzMTg1MzA3MTc5NTk7XG4gIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5kZWZfYXJjX3RvbGVyYW5jZSA9IDAuMjU7XG4gIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5wcm90b3R5cGUuQ2xlYXIgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgQ2xpcHBlckxpYi5DbGVhcih0aGlzLm1fcG9seU5vZGVzLkNoaWxkcygpKTtcbiAgICB0aGlzLm1fbG93ZXN0LlggPSAtMTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kID0gQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kO1xuICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQucHJvdG90eXBlLkFkZFBhdGggPSBmdW5jdGlvbiAocGF0aCwgam9pblR5cGUsIGVuZFR5cGUpXG4gIHtcbiAgICB2YXIgaGlnaEkgPSBwYXRoLmxlbmd0aCAtIDE7XG4gICAgaWYgKGhpZ2hJIDwgMClcbiAgICAgIHJldHVybjtcbiAgICB2YXIgbmV3Tm9kZSA9IG5ldyBDbGlwcGVyTGliLlBvbHlOb2RlKCk7XG4gICAgbmV3Tm9kZS5tX2pvaW50eXBlID0gam9pblR5cGU7XG4gICAgbmV3Tm9kZS5tX2VuZHR5cGUgPSBlbmRUeXBlO1xuICAgIC8vc3RyaXAgZHVwbGljYXRlIHBvaW50cyBmcm9tIHBhdGggYW5kIGFsc28gZ2V0IGluZGV4IHRvIHRoZSBsb3dlc3QgcG9pbnQgLi4uXG4gICAgaWYgKGVuZFR5cGUgPT0gQ2xpcHBlckxpYi5FbmRUeXBlLmV0Q2xvc2VkTGluZSB8fCBlbmRUeXBlID09IENsaXBwZXJMaWIuRW5kVHlwZS5ldENsb3NlZFBvbHlnb24pXG4gICAgICB3aGlsZSAoaGlnaEkgPiAwICYmIENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocGF0aFswXSwgcGF0aFtoaWdoSV0pKVxuICAgICAgICBoaWdoSS0tO1xuICAgIC8vbmV3Tm9kZS5tX3BvbHlnb24uc2V0X0NhcGFjaXR5KGhpZ2hJICsgMSk7XG4gICAgbmV3Tm9kZS5tX3BvbHlnb24ucHVzaChwYXRoWzBdKTtcbiAgICB2YXIgaiA9IDAsXG4gICAgICBrID0gMDtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8PSBoaWdoSTsgaSsrKVxuICAgICAgaWYgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfSW5lcXVhbGl0eShuZXdOb2RlLm1fcG9seWdvbltqXSwgcGF0aFtpXSkpXG4gICAgICB7XG4gICAgICAgIGorKztcbiAgICAgICAgbmV3Tm9kZS5tX3BvbHlnb24ucHVzaChwYXRoW2ldKTtcbiAgICAgICAgaWYgKHBhdGhbaV0uWSA+IG5ld05vZGUubV9wb2x5Z29uW2tdLlkgfHwgKHBhdGhbaV0uWSA9PSBuZXdOb2RlLm1fcG9seWdvbltrXS5ZICYmIHBhdGhbaV0uWCA8IG5ld05vZGUubV9wb2x5Z29uW2tdLlgpKVxuICAgICAgICAgIGsgPSBqO1xuICAgICAgfVxuICAgIGlmIChlbmRUeXBlID09IENsaXBwZXJMaWIuRW5kVHlwZS5ldENsb3NlZFBvbHlnb24gJiYgaiA8IDIpIHJldHVybjtcblxuICAgIHRoaXMubV9wb2x5Tm9kZXMuQWRkQ2hpbGQobmV3Tm9kZSk7XG4gICAgLy9pZiB0aGlzIHBhdGgncyBsb3dlc3QgcHQgaXMgbG93ZXIgdGhhbiBhbGwgdGhlIG90aGVycyB0aGVuIHVwZGF0ZSBtX2xvd2VzdFxuICAgIGlmIChlbmRUeXBlICE9IENsaXBwZXJMaWIuRW5kVHlwZS5ldENsb3NlZFBvbHlnb24pXG4gICAgICByZXR1cm47XG4gICAgaWYgKHRoaXMubV9sb3dlc3QuWCA8IDApXG4gICAgICB0aGlzLm1fbG93ZXN0ID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQodGhpcy5tX3BvbHlOb2Rlcy5DaGlsZENvdW50KCkgLSAxLCBrKTtcbiAgICBlbHNlXG4gICAge1xuICAgICAgdmFyIGlwID0gdGhpcy5tX3BvbHlOb2Rlcy5DaGlsZHMoKVt0aGlzLm1fbG93ZXN0LlhdLm1fcG9seWdvblt0aGlzLm1fbG93ZXN0LlldO1xuICAgICAgaWYgKG5ld05vZGUubV9wb2x5Z29uW2tdLlkgPiBpcC5ZIHx8IChuZXdOb2RlLm1fcG9seWdvbltrXS5ZID09IGlwLlkgJiYgbmV3Tm9kZS5tX3BvbHlnb25ba10uWCA8IGlwLlgpKVxuICAgICAgICB0aGlzLm1fbG93ZXN0ID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQodGhpcy5tX3BvbHlOb2Rlcy5DaGlsZENvdW50KCkgLSAxLCBrKTtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5wcm90b3R5cGUuQWRkUGF0aHMgPSBmdW5jdGlvbiAocGF0aHMsIGpvaW5UeXBlLCBlbmRUeXBlKVxuICB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlsZW4gPSBwYXRocy5sZW5ndGg7IGkgPCBpbGVuOyBpKyspXG4gICAgICB0aGlzLkFkZFBhdGgocGF0aHNbaV0sIGpvaW5UeXBlLCBlbmRUeXBlKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LnByb3RvdHlwZS5GaXhPcmllbnRhdGlvbnMgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgLy9maXh1cCBvcmllbnRhdGlvbnMgb2YgYWxsIGNsb3NlZCBwYXRocyBpZiB0aGUgb3JpZW50YXRpb24gb2YgdGhlXG4gICAgLy9jbG9zZWQgcGF0aCB3aXRoIHRoZSBsb3dlcm1vc3QgdmVydGV4IGlzIHdyb25nIC4uLlxuICAgIGlmICh0aGlzLm1fbG93ZXN0LlggPj0gMCAmJiAhQ2xpcHBlckxpYi5DbGlwcGVyLk9yaWVudGF0aW9uKHRoaXMubV9wb2x5Tm9kZXMuQ2hpbGRzKClbdGhpcy5tX2xvd2VzdC5YXS5tX3BvbHlnb24pKVxuICAgIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tX3BvbHlOb2Rlcy5DaGlsZENvdW50KCk7IGkrKylcbiAgICAgIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1fcG9seU5vZGVzLkNoaWxkcygpW2ldO1xuICAgICAgICBpZiAobm9kZS5tX2VuZHR5cGUgPT0gQ2xpcHBlckxpYi5FbmRUeXBlLmV0Q2xvc2VkUG9seWdvbiB8fCAobm9kZS5tX2VuZHR5cGUgPT0gQ2xpcHBlckxpYi5FbmRUeXBlLmV0Q2xvc2VkTGluZSAmJiBDbGlwcGVyTGliLkNsaXBwZXIuT3JpZW50YXRpb24obm9kZS5tX3BvbHlnb24pKSlcbiAgICAgICAgICBub2RlLm1fcG9seWdvbi5yZXZlcnNlKCk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubV9wb2x5Tm9kZXMuQ2hpbGRDb3VudCgpOyBpKyspXG4gICAgICB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tX3BvbHlOb2Rlcy5DaGlsZHMoKVtpXTtcbiAgICAgICAgaWYgKG5vZGUubV9lbmR0eXBlID09IENsaXBwZXJMaWIuRW5kVHlwZS5ldENsb3NlZExpbmUgJiYgIUNsaXBwZXJMaWIuQ2xpcHBlci5PcmllbnRhdGlvbihub2RlLm1fcG9seWdvbikpXG4gICAgICAgICAgbm9kZS5tX3BvbHlnb24ucmV2ZXJzZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LkdldFVuaXROb3JtYWwgPSBmdW5jdGlvbiAocHQxLCBwdDIpXG4gIHtcbiAgICB2YXIgZHggPSAocHQyLlggLSBwdDEuWCk7XG4gICAgdmFyIGR5ID0gKHB0Mi5ZIC0gcHQxLlkpO1xuICAgIGlmICgoZHggPT0gMCkgJiYgKGR5ID09IDApKVxuICAgICAgcmV0dXJuIG5ldyBDbGlwcGVyTGliLkRvdWJsZVBvaW50KDAsIDApO1xuICAgIHZhciBmID0gMSAvIE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG4gICAgZHggKj0gZjtcbiAgICBkeSAqPSBmO1xuICAgIHJldHVybiBuZXcgQ2xpcHBlckxpYi5Eb3VibGVQb2ludChkeSwgLWR4KTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LnByb3RvdHlwZS5Eb09mZnNldCA9IGZ1bmN0aW9uIChkZWx0YSlcbiAge1xuICAgIHRoaXMubV9kZXN0UG9seXMgPSBuZXcgQXJyYXkoKTtcbiAgICB0aGlzLm1fZGVsdGEgPSBkZWx0YTtcbiAgICAvL2lmIFplcm8gb2Zmc2V0LCBqdXN0IGNvcHkgYW55IENMT1NFRCBwb2x5Z29ucyB0byBtX3AgYW5kIHJldHVybiAuLi5cbiAgICBpZiAoQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5uZWFyX3plcm8oZGVsdGEpKVxuICAgIHtcbiAgICAgIC8vdGhpcy5tX2Rlc3RQb2x5cy5zZXRfQ2FwYWNpdHkodGhpcy5tX3BvbHlOb2Rlcy5DaGlsZENvdW50KTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tX3BvbHlOb2Rlcy5DaGlsZENvdW50KCk7IGkrKylcbiAgICAgIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1fcG9seU5vZGVzLkNoaWxkcygpW2ldO1xuICAgICAgICBpZiAobm9kZS5tX2VuZHR5cGUgPT0gQ2xpcHBlckxpYi5FbmRUeXBlLmV0Q2xvc2VkUG9seWdvbilcbiAgICAgICAgICB0aGlzLm1fZGVzdFBvbHlzLnB1c2gobm9kZS5tX3BvbHlnb24pO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvL3NlZSBvZmZzZXRfdHJpZ2lub21ldHJ5My5zdmcgaW4gdGhlIGRvY3VtZW50YXRpb24gZm9sZGVyIC4uLlxuICAgIGlmICh0aGlzLk1pdGVyTGltaXQgPiAyKVxuICAgICAgdGhpcy5tX21pdGVyTGltID0gMiAvICh0aGlzLk1pdGVyTGltaXQgKiB0aGlzLk1pdGVyTGltaXQpO1xuICAgIGVsc2VcbiAgICAgIHRoaXMubV9taXRlckxpbSA9IDAuNTtcbiAgICB2YXIgeTtcbiAgICBpZiAodGhpcy5BcmNUb2xlcmFuY2UgPD0gMClcbiAgICAgIHkgPSBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuZGVmX2FyY190b2xlcmFuY2U7XG4gICAgZWxzZSBpZiAodGhpcy5BcmNUb2xlcmFuY2UgPiBNYXRoLmFicyhkZWx0YSkgKiBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuZGVmX2FyY190b2xlcmFuY2UpXG4gICAgICB5ID0gTWF0aC5hYnMoZGVsdGEpICogQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LmRlZl9hcmNfdG9sZXJhbmNlO1xuICAgIGVsc2VcbiAgICAgIHkgPSB0aGlzLkFyY1RvbGVyYW5jZTtcbiAgICAvL3NlZSBvZmZzZXRfdHJpZ2lub21ldHJ5Mi5zdmcgaW4gdGhlIGRvY3VtZW50YXRpb24gZm9sZGVyIC4uLlxuICAgIHZhciBzdGVwcyA9IDMuMTQxNTkyNjUzNTg5NzkgLyBNYXRoLmFjb3MoMSAtIHkgLyBNYXRoLmFicyhkZWx0YSkpO1xuICAgIHRoaXMubV9zaW4gPSBNYXRoLnNpbihDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQudHdvX3BpIC8gc3RlcHMpO1xuICAgIHRoaXMubV9jb3MgPSBNYXRoLmNvcyhDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQudHdvX3BpIC8gc3RlcHMpO1xuICAgIHRoaXMubV9TdGVwc1BlclJhZCA9IHN0ZXBzIC8gQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LnR3b19waTtcbiAgICBpZiAoZGVsdGEgPCAwKVxuICAgICAgdGhpcy5tX3NpbiA9IC10aGlzLm1fc2luO1xuICAgIC8vdGhpcy5tX2Rlc3RQb2x5cy5zZXRfQ2FwYWNpdHkodGhpcy5tX3BvbHlOb2Rlcy5DaGlsZENvdW50ICogMik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1fcG9seU5vZGVzLkNoaWxkQ291bnQoKTsgaSsrKVxuICAgIHtcbiAgICAgIHZhciBub2RlID0gdGhpcy5tX3BvbHlOb2Rlcy5DaGlsZHMoKVtpXTtcbiAgICAgIHRoaXMubV9zcmNQb2x5ID0gbm9kZS5tX3BvbHlnb247XG4gICAgICB2YXIgbGVuID0gdGhpcy5tX3NyY1BvbHkubGVuZ3RoO1xuICAgICAgaWYgKGxlbiA9PSAwIHx8IChkZWx0YSA8PSAwICYmIChsZW4gPCAzIHx8IG5vZGUubV9lbmR0eXBlICE9IENsaXBwZXJMaWIuRW5kVHlwZS5ldENsb3NlZFBvbHlnb24pKSlcbiAgICAgICAgY29udGludWU7XG4gICAgICB0aGlzLm1fZGVzdFBvbHkgPSBuZXcgQXJyYXkoKTtcbiAgICAgIGlmIChsZW4gPT0gMSlcbiAgICAgIHtcbiAgICAgICAgaWYgKG5vZGUubV9qb2ludHlwZSA9PSBDbGlwcGVyTGliLkpvaW5UeXBlLmp0Um91bmQpXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgWCA9IDEsXG4gICAgICAgICAgICBZID0gMDtcbiAgICAgICAgICBmb3IgKHZhciBqID0gMTsgaiA8PSBzdGVwczsgaisrKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMubV9kZXN0UG9seS5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVswXS5YICsgWCAqIGRlbHRhKSwgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5WzBdLlkgKyBZICogZGVsdGEpKSk7XG4gICAgICAgICAgICB2YXIgWDIgPSBYO1xuICAgICAgICAgICAgWCA9IFggKiB0aGlzLm1fY29zIC0gdGhpcy5tX3NpbiAqIFk7XG4gICAgICAgICAgICBZID0gWDIgKiB0aGlzLm1fc2luICsgWSAqIHRoaXMubV9jb3M7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgIHZhciBYID0gLTEsXG4gICAgICAgICAgICBZID0gLTE7XG4gICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCA0OyArK2opXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5tX2Rlc3RQb2x5LnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5WzBdLlggKyBYICogZGVsdGEpLCBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbMF0uWSArIFkgKiBkZWx0YSkpKTtcbiAgICAgICAgICAgIGlmIChYIDwgMClcbiAgICAgICAgICAgICAgWCA9IDE7XG4gICAgICAgICAgICBlbHNlIGlmIChZIDwgMClcbiAgICAgICAgICAgICAgWSA9IDE7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIFggPSAtMTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tX2Rlc3RQb2x5cy5wdXNoKHRoaXMubV9kZXN0UG9seSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLy9idWlsZCBtX25vcm1hbHMgLi4uXG4gICAgICB0aGlzLm1fbm9ybWFscy5sZW5ndGggPSAwO1xuICAgICAgLy90aGlzLm1fbm9ybWFscy5zZXRfQ2FwYWNpdHkobGVuKTtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGVuIC0gMTsgaisrKVxuICAgICAgICB0aGlzLm1fbm9ybWFscy5wdXNoKENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5HZXRVbml0Tm9ybWFsKHRoaXMubV9zcmNQb2x5W2pdLCB0aGlzLm1fc3JjUG9seVtqICsgMV0pKTtcbiAgICAgIGlmIChub2RlLm1fZW5kdHlwZSA9PSBDbGlwcGVyTGliLkVuZFR5cGUuZXRDbG9zZWRMaW5lIHx8IG5vZGUubV9lbmR0eXBlID09IENsaXBwZXJMaWIuRW5kVHlwZS5ldENsb3NlZFBvbHlnb24pXG4gICAgICAgIHRoaXMubV9ub3JtYWxzLnB1c2goQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LkdldFVuaXROb3JtYWwodGhpcy5tX3NyY1BvbHlbbGVuIC0gMV0sIHRoaXMubV9zcmNQb2x5WzBdKSk7XG4gICAgICBlbHNlXG4gICAgICAgIHRoaXMubV9ub3JtYWxzLnB1c2gobmV3IENsaXBwZXJMaWIuRG91YmxlUG9pbnQodGhpcy5tX25vcm1hbHNbbGVuIC0gMl0pKTtcbiAgICAgIGlmIChub2RlLm1fZW5kdHlwZSA9PSBDbGlwcGVyTGliLkVuZFR5cGUuZXRDbG9zZWRQb2x5Z29uKVxuICAgICAge1xuICAgICAgICB2YXIgayA9IGxlbiAtIDE7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGVuOyBqKyspXG4gICAgICAgICAgayA9IHRoaXMuT2Zmc2V0UG9pbnQoaiwgaywgbm9kZS5tX2pvaW50eXBlKTtcbiAgICAgICAgdGhpcy5tX2Rlc3RQb2x5cy5wdXNoKHRoaXMubV9kZXN0UG9seSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChub2RlLm1fZW5kdHlwZSA9PSBDbGlwcGVyTGliLkVuZFR5cGUuZXRDbG9zZWRMaW5lKVxuICAgICAge1xuICAgICAgICB2YXIgayA9IGxlbiAtIDE7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGVuOyBqKyspXG4gICAgICAgICAgayA9IHRoaXMuT2Zmc2V0UG9pbnQoaiwgaywgbm9kZS5tX2pvaW50eXBlKTtcbiAgICAgICAgdGhpcy5tX2Rlc3RQb2x5cy5wdXNoKHRoaXMubV9kZXN0UG9seSk7XG4gICAgICAgIHRoaXMubV9kZXN0UG9seSA9IG5ldyBBcnJheSgpO1xuICAgICAgICAvL3JlLWJ1aWxkIG1fbm9ybWFscyAuLi5cbiAgICAgICAgdmFyIG4gPSB0aGlzLm1fbm9ybWFsc1tsZW4gLSAxXTtcbiAgICAgICAgZm9yICh2YXIgaiA9IGxlbiAtIDE7IGogPiAwOyBqLS0pXG4gICAgICAgICAgdGhpcy5tX25vcm1hbHNbal0gPSBuZXcgQ2xpcHBlckxpYi5Eb3VibGVQb2ludCgtdGhpcy5tX25vcm1hbHNbaiAtIDFdLlgsIC10aGlzLm1fbm9ybWFsc1tqIC0gMV0uWSk7XG4gICAgICAgIHRoaXMubV9ub3JtYWxzWzBdID0gbmV3IENsaXBwZXJMaWIuRG91YmxlUG9pbnQoLW4uWCwgLW4uWSk7XG4gICAgICAgIGsgPSAwO1xuICAgICAgICBmb3IgKHZhciBqID0gbGVuIC0gMTsgaiA+PSAwOyBqLS0pXG4gICAgICAgICAgayA9IHRoaXMuT2Zmc2V0UG9pbnQoaiwgaywgbm9kZS5tX2pvaW50eXBlKTtcbiAgICAgICAgdGhpcy5tX2Rlc3RQb2x5cy5wdXNoKHRoaXMubV9kZXN0UG9seSk7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIHZhciBrID0gMDtcbiAgICAgICAgZm9yICh2YXIgaiA9IDE7IGogPCBsZW4gLSAxOyArK2opXG4gICAgICAgICAgayA9IHRoaXMuT2Zmc2V0UG9pbnQoaiwgaywgbm9kZS5tX2pvaW50eXBlKTtcbiAgICAgICAgdmFyIHB0MTtcbiAgICAgICAgaWYgKG5vZGUubV9lbmR0eXBlID09IENsaXBwZXJMaWIuRW5kVHlwZS5ldE9wZW5CdXR0KVxuICAgICAgICB7XG4gICAgICAgICAgdmFyIGogPSBsZW4gLSAxO1xuICAgICAgICAgIHB0MSA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5YICsgdGhpcy5tX25vcm1hbHNbal0uWCAqIGRlbHRhKSwgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlkgKyB0aGlzLm1fbm9ybWFsc1tqXS5ZICogZGVsdGEpKTtcbiAgICAgICAgICB0aGlzLm1fZGVzdFBvbHkucHVzaChwdDEpO1xuICAgICAgICAgIHB0MSA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5YIC0gdGhpcy5tX25vcm1hbHNbal0uWCAqIGRlbHRhKSwgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlkgLSB0aGlzLm1fbm9ybWFsc1tqXS5ZICogZGVsdGEpKTtcbiAgICAgICAgICB0aGlzLm1fZGVzdFBvbHkucHVzaChwdDEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgIHZhciBqID0gbGVuIC0gMTtcbiAgICAgICAgICBrID0gbGVuIC0gMjtcbiAgICAgICAgICB0aGlzLm1fc2luQSA9IDA7XG4gICAgICAgICAgdGhpcy5tX25vcm1hbHNbal0gPSBuZXcgQ2xpcHBlckxpYi5Eb3VibGVQb2ludCgtdGhpcy5tX25vcm1hbHNbal0uWCwgLXRoaXMubV9ub3JtYWxzW2pdLlkpO1xuICAgICAgICAgIGlmIChub2RlLm1fZW5kdHlwZSA9PSBDbGlwcGVyTGliLkVuZFR5cGUuZXRPcGVuU3F1YXJlKVxuICAgICAgICAgICAgdGhpcy5Eb1NxdWFyZShqLCBrKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLkRvUm91bmQoaiwgayk7XG4gICAgICAgIH1cbiAgICAgICAgLy9yZS1idWlsZCBtX25vcm1hbHMgLi4uXG4gICAgICAgIGZvciAodmFyIGogPSBsZW4gLSAxOyBqID4gMDsgai0tKVxuICAgICAgICAgIHRoaXMubV9ub3JtYWxzW2pdID0gbmV3IENsaXBwZXJMaWIuRG91YmxlUG9pbnQoLXRoaXMubV9ub3JtYWxzW2ogLSAxXS5YLCAtdGhpcy5tX25vcm1hbHNbaiAtIDFdLlkpO1xuICAgICAgICB0aGlzLm1fbm9ybWFsc1swXSA9IG5ldyBDbGlwcGVyTGliLkRvdWJsZVBvaW50KC10aGlzLm1fbm9ybWFsc1sxXS5YLCAtdGhpcy5tX25vcm1hbHNbMV0uWSk7XG4gICAgICAgIGsgPSBsZW4gLSAxO1xuICAgICAgICBmb3IgKHZhciBqID0gayAtIDE7IGogPiAwOyAtLWopXG4gICAgICAgICAgayA9IHRoaXMuT2Zmc2V0UG9pbnQoaiwgaywgbm9kZS5tX2pvaW50eXBlKTtcbiAgICAgICAgaWYgKG5vZGUubV9lbmR0eXBlID09IENsaXBwZXJMaWIuRW5kVHlwZS5ldE9wZW5CdXR0KVxuICAgICAgICB7XG4gICAgICAgICAgcHQxID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQoQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5WzBdLlggLSB0aGlzLm1fbm9ybWFsc1swXS5YICogZGVsdGEpLCBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbMF0uWSAtIHRoaXMubV9ub3JtYWxzWzBdLlkgKiBkZWx0YSkpO1xuICAgICAgICAgIHRoaXMubV9kZXN0UG9seS5wdXNoKHB0MSk7XG4gICAgICAgICAgcHQxID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQoQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5WzBdLlggKyB0aGlzLm1fbm9ybWFsc1swXS5YICogZGVsdGEpLCBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbMF0uWSArIHRoaXMubV9ub3JtYWxzWzBdLlkgKiBkZWx0YSkpO1xuICAgICAgICAgIHRoaXMubV9kZXN0UG9seS5wdXNoKHB0MSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgayA9IDE7XG4gICAgICAgICAgdGhpcy5tX3NpbkEgPSAwO1xuICAgICAgICAgIGlmIChub2RlLm1fZW5kdHlwZSA9PSBDbGlwcGVyTGliLkVuZFR5cGUuZXRPcGVuU3F1YXJlKVxuICAgICAgICAgICAgdGhpcy5Eb1NxdWFyZSgwLCAxKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLkRvUm91bmQoMCwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tX2Rlc3RQb2x5cy5wdXNoKHRoaXMubV9kZXN0UG9seSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQucHJvdG90eXBlLkV4ZWN1dGUgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdmFyIGEgPSBhcmd1bWVudHMsXG4gICAgICBpc3BvbHl0cmVlID0gYVswXSBpbnN0YW5jZW9mIENsaXBwZXJMaWIuUG9seVRyZWU7XG4gICAgaWYgKCFpc3BvbHl0cmVlKSAvLyBmdW5jdGlvbiAoc29sdXRpb24sIGRlbHRhKVxuICAgIHtcbiAgICAgIHZhciBzb2x1dGlvbiA9IGFbMF0sXG4gICAgICAgIGRlbHRhID0gYVsxXTtcbiAgICAgIENsaXBwZXJMaWIuQ2xlYXIoc29sdXRpb24pO1xuICAgICAgdGhpcy5GaXhPcmllbnRhdGlvbnMoKTtcbiAgICAgIHRoaXMuRG9PZmZzZXQoZGVsdGEpO1xuICAgICAgLy9ub3cgY2xlYW4gdXAgJ2Nvcm5lcnMnIC4uLlxuICAgICAgdmFyIGNscHIgPSBuZXcgQ2xpcHBlckxpYi5DbGlwcGVyKDApO1xuICAgICAgY2xwci5BZGRQYXRocyh0aGlzLm1fZGVzdFBvbHlzLCBDbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdCwgdHJ1ZSk7XG4gICAgICBpZiAoZGVsdGEgPiAwKVxuICAgICAge1xuICAgICAgICBjbHByLkV4ZWN1dGUoQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFVuaW9uLCBzb2x1dGlvbiwgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0UG9zaXRpdmUsIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdFBvc2l0aXZlKTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgdmFyIHIgPSBDbGlwcGVyTGliLkNsaXBwZXIuR2V0Qm91bmRzKHRoaXMubV9kZXN0UG9seXMpO1xuICAgICAgICB2YXIgb3V0ZXIgPSBuZXcgQ2xpcHBlckxpYi5QYXRoKCk7XG4gICAgICAgIG91dGVyLnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoci5sZWZ0IC0gMTAsIHIuYm90dG9tICsgMTApKTtcbiAgICAgICAgb3V0ZXIucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChyLnJpZ2h0ICsgMTAsIHIuYm90dG9tICsgMTApKTtcbiAgICAgICAgb3V0ZXIucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChyLnJpZ2h0ICsgMTAsIHIudG9wIC0gMTApKTtcbiAgICAgICAgb3V0ZXIucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChyLmxlZnQgLSAxMCwgci50b3AgLSAxMCkpO1xuICAgICAgICBjbHByLkFkZFBhdGgob3V0ZXIsIENsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0LCB0cnVlKTtcbiAgICAgICAgY2xwci5SZXZlcnNlU29sdXRpb24gPSB0cnVlO1xuICAgICAgICBjbHByLkV4ZWN1dGUoQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFVuaW9uLCBzb2x1dGlvbiwgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0TmVnYXRpdmUsIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5lZ2F0aXZlKTtcbiAgICAgICAgaWYgKHNvbHV0aW9uLmxlbmd0aCA+IDApXG4gICAgICAgICAgc29sdXRpb24uc3BsaWNlKDAsIDEpO1xuICAgICAgfVxuICAgICAgLy9jb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShzb2x1dGlvbikpO1xuICAgIH1cbiAgICBlbHNlIC8vIGZ1bmN0aW9uIChwb2x5dHJlZSwgZGVsdGEpXG4gICAge1xuICAgICAgdmFyIHNvbHV0aW9uID0gYVswXSxcbiAgICAgICAgZGVsdGEgPSBhWzFdO1xuICAgICAgc29sdXRpb24uQ2xlYXIoKTtcbiAgICAgIHRoaXMuRml4T3JpZW50YXRpb25zKCk7XG4gICAgICB0aGlzLkRvT2Zmc2V0KGRlbHRhKTtcbiAgICAgIC8vbm93IGNsZWFuIHVwICdjb3JuZXJzJyAuLi5cbiAgICAgIHZhciBjbHByID0gbmV3IENsaXBwZXJMaWIuQ2xpcHBlcigwKTtcbiAgICAgIGNscHIuQWRkUGF0aHModGhpcy5tX2Rlc3RQb2x5cywgQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdFN1YmplY3QsIHRydWUpO1xuICAgICAgaWYgKGRlbHRhID4gMClcbiAgICAgIHtcbiAgICAgICAgY2xwci5FeGVjdXRlKENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RVbmlvbiwgc29sdXRpb24sIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdFBvc2l0aXZlLCBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRQb3NpdGl2ZSk7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIHZhciByID0gQ2xpcHBlckxpYi5DbGlwcGVyLkdldEJvdW5kcyh0aGlzLm1fZGVzdFBvbHlzKTtcbiAgICAgICAgdmFyIG91dGVyID0gbmV3IENsaXBwZXJMaWIuUGF0aCgpO1xuICAgICAgICBvdXRlci5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KHIubGVmdCAtIDEwLCByLmJvdHRvbSArIDEwKSk7XG4gICAgICAgIG91dGVyLnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoci5yaWdodCArIDEwLCByLmJvdHRvbSArIDEwKSk7XG4gICAgICAgIG91dGVyLnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoci5yaWdodCArIDEwLCByLnRvcCAtIDEwKSk7XG4gICAgICAgIG91dGVyLnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoci5sZWZ0IC0gMTAsIHIudG9wIC0gMTApKTtcbiAgICAgICAgY2xwci5BZGRQYXRoKG91dGVyLCBDbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdCwgdHJ1ZSk7XG4gICAgICAgIGNscHIuUmV2ZXJzZVNvbHV0aW9uID0gdHJ1ZTtcbiAgICAgICAgY2xwci5FeGVjdXRlKENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RVbmlvbiwgc29sdXRpb24sIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5lZ2F0aXZlLCBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROZWdhdGl2ZSk7XG4gICAgICAgIC8vcmVtb3ZlIHRoZSBvdXRlciBQb2x5Tm9kZSByZWN0YW5nbGUgLi4uXG4gICAgICAgIGlmIChzb2x1dGlvbi5DaGlsZENvdW50KCkgPT0gMSAmJiBzb2x1dGlvbi5DaGlsZHMoKVswXS5DaGlsZENvdW50KCkgPiAwKVxuICAgICAgICB7XG4gICAgICAgICAgdmFyIG91dGVyTm9kZSA9IHNvbHV0aW9uLkNoaWxkcygpWzBdO1xuICAgICAgICAgIC8vc29sdXRpb24uQ2hpbGRzLnNldF9DYXBhY2l0eShvdXRlck5vZGUuQ2hpbGRDb3VudCk7XG4gICAgICAgICAgc29sdXRpb24uQ2hpbGRzKClbMF0gPSBvdXRlck5vZGUuQ2hpbGRzKClbMF07XG4gICAgICAgICAgc29sdXRpb24uQ2hpbGRzKClbMF0ubV9QYXJlbnQgPSBzb2x1dGlvbjtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IG91dGVyTm9kZS5DaGlsZENvdW50KCk7IGkrKylcbiAgICAgICAgICAgIHNvbHV0aW9uLkFkZENoaWxkKG91dGVyTm9kZS5DaGlsZHMoKVtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIHNvbHV0aW9uLkNsZWFyKCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQucHJvdG90eXBlLk9mZnNldFBvaW50ID0gZnVuY3Rpb24gKGosIGssIGpvaW50eXBlKVxuICB7XG5cdFx0Ly9jcm9zcyBwcm9kdWN0IC4uLlxuXHRcdHRoaXMubV9zaW5BID0gKHRoaXMubV9ub3JtYWxzW2tdLlggKiB0aGlzLm1fbm9ybWFsc1tqXS5ZIC0gdGhpcy5tX25vcm1hbHNbal0uWCAqIHRoaXMubV9ub3JtYWxzW2tdLlkpO1xuXG5cdFx0aWYgKE1hdGguYWJzKHRoaXMubV9zaW5BICogdGhpcy5tX2RlbHRhKSA8IDEuMClcblx0XHR7XG5cdFx0XHQvL2RvdCBwcm9kdWN0IC4uLlxuXHRcdFx0dmFyIGNvc0EgPSAodGhpcy5tX25vcm1hbHNba10uWCAqIHRoaXMubV9ub3JtYWxzW2pdLlggKyB0aGlzLm1fbm9ybWFsc1tqXS5ZICogdGhpcy5tX25vcm1hbHNba10uWSk7XG5cdFx0XHRpZiAoY29zQSA+IDApIC8vIGFuZ2xlID09PiAwIGRlZ3JlZXNcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5tX2Rlc3RQb2x5LnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlggKyB0aGlzLm1fbm9ybWFsc1trXS5YICogdGhpcy5tX2RlbHRhKSxcblx0XHRcdFx0XHRDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWSArIHRoaXMubV9ub3JtYWxzW2tdLlkgKiB0aGlzLm1fZGVsdGEpKSk7XG5cdFx0XHRcdHJldHVybiBrO1xuXHRcdFx0fVxuXHRcdFx0Ly9lbHNlIGFuZ2xlID09PiAxODAgZGVncmVlc1xuXHRcdH1cbiAgICBlbHNlIGlmICh0aGlzLm1fc2luQSA+IDEpXG4gICAgICB0aGlzLm1fc2luQSA9IDEuMDtcbiAgICBlbHNlIGlmICh0aGlzLm1fc2luQSA8IC0xKVxuICAgICAgdGhpcy5tX3NpbkEgPSAtMS4wO1xuICAgIGlmICh0aGlzLm1fc2luQSAqIHRoaXMubV9kZWx0YSA8IDApXG4gICAge1xuICAgICAgdGhpcy5tX2Rlc3RQb2x5LnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlggKyB0aGlzLm1fbm9ybWFsc1trXS5YICogdGhpcy5tX2RlbHRhKSxcbiAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlkgKyB0aGlzLm1fbm9ybWFsc1trXS5ZICogdGhpcy5tX2RlbHRhKSkpO1xuICAgICAgdGhpcy5tX2Rlc3RQb2x5LnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQodGhpcy5tX3NyY1BvbHlbal0pKTtcbiAgICAgIHRoaXMubV9kZXN0UG9seS5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5YICsgdGhpcy5tX25vcm1hbHNbal0uWCAqIHRoaXMubV9kZWx0YSksXG4gICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5ZICsgdGhpcy5tX25vcm1hbHNbal0uWSAqIHRoaXMubV9kZWx0YSkpKTtcbiAgICB9XG4gICAgZWxzZVxuICAgICAgc3dpdGNoIChqb2ludHlwZSlcbiAgICAgIHtcbiAgICAgIGNhc2UgQ2xpcHBlckxpYi5Kb2luVHlwZS5qdE1pdGVyOlxuICAgICAgICB7XG4gICAgICAgICAgdmFyIHIgPSAxICsgKHRoaXMubV9ub3JtYWxzW2pdLlggKiB0aGlzLm1fbm9ybWFsc1trXS5YICsgdGhpcy5tX25vcm1hbHNbal0uWSAqIHRoaXMubV9ub3JtYWxzW2tdLlkpO1xuICAgICAgICAgIGlmIChyID49IHRoaXMubV9taXRlckxpbSlcbiAgICAgICAgICAgIHRoaXMuRG9NaXRlcihqLCBrLCByKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLkRvU3F1YXJlKGosIGspO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBjYXNlIENsaXBwZXJMaWIuSm9pblR5cGUuanRTcXVhcmU6XG4gICAgICAgIHRoaXMuRG9TcXVhcmUoaiwgayk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDbGlwcGVyTGliLkpvaW5UeXBlLmp0Um91bmQ6XG4gICAgICAgIHRoaXMuRG9Sb3VuZChqLCBrKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgayA9IGo7XG4gICAgcmV0dXJuIGs7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5wcm90b3R5cGUuRG9TcXVhcmUgPSBmdW5jdGlvbiAoaiwgaylcbiAge1xuICAgIHZhciBkeCA9IE1hdGgudGFuKE1hdGguYXRhbjIodGhpcy5tX3NpbkEsXG4gICAgICB0aGlzLm1fbm9ybWFsc1trXS5YICogdGhpcy5tX25vcm1hbHNbal0uWCArIHRoaXMubV9ub3JtYWxzW2tdLlkgKiB0aGlzLm1fbm9ybWFsc1tqXS5ZKSAvIDQpO1xuICAgIHRoaXMubV9kZXN0UG9seS5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KFxuICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlggKyB0aGlzLm1fZGVsdGEgKiAodGhpcy5tX25vcm1hbHNba10uWCAtIHRoaXMubV9ub3JtYWxzW2tdLlkgKiBkeCkpLFxuICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlkgKyB0aGlzLm1fZGVsdGEgKiAodGhpcy5tX25vcm1hbHNba10uWSArIHRoaXMubV9ub3JtYWxzW2tdLlggKiBkeCkpKSk7XG4gICAgdGhpcy5tX2Rlc3RQb2x5LnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoXG4gICAgICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWCArIHRoaXMubV9kZWx0YSAqICh0aGlzLm1fbm9ybWFsc1tqXS5YICsgdGhpcy5tX25vcm1hbHNbal0uWSAqIGR4KSksXG4gICAgICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWSArIHRoaXMubV9kZWx0YSAqICh0aGlzLm1fbm9ybWFsc1tqXS5ZIC0gdGhpcy5tX25vcm1hbHNbal0uWCAqIGR4KSkpKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LnByb3RvdHlwZS5Eb01pdGVyID0gZnVuY3Rpb24gKGosIGssIHIpXG4gIHtcbiAgICB2YXIgcSA9IHRoaXMubV9kZWx0YSAvIHI7XG4gICAgdGhpcy5tX2Rlc3RQb2x5LnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoXG4gICAgICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWCArICh0aGlzLm1fbm9ybWFsc1trXS5YICsgdGhpcy5tX25vcm1hbHNbal0uWCkgKiBxKSxcbiAgICAgIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5ZICsgKHRoaXMubV9ub3JtYWxzW2tdLlkgKyB0aGlzLm1fbm9ybWFsc1tqXS5ZKSAqIHEpKSk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5wcm90b3R5cGUuRG9Sb3VuZCA9IGZ1bmN0aW9uIChqLCBrKVxuICB7XG4gICAgdmFyIGEgPSBNYXRoLmF0YW4yKHRoaXMubV9zaW5BLFxuICAgICAgdGhpcy5tX25vcm1hbHNba10uWCAqIHRoaXMubV9ub3JtYWxzW2pdLlggKyB0aGlzLm1fbm9ybWFsc1trXS5ZICogdGhpcy5tX25vcm1hbHNbal0uWSk7XG5cbiAgICBcdHZhciBzdGVwcyA9IE1hdGgubWF4KENsaXBwZXJMaWIuQ2FzdF9JbnQzMihDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX1N0ZXBzUGVyUmFkICogTWF0aC5hYnMoYSkpKSwgMSk7XG5cbiAgICB2YXIgWCA9IHRoaXMubV9ub3JtYWxzW2tdLlgsXG4gICAgICBZID0gdGhpcy5tX25vcm1hbHNba10uWSxcbiAgICAgIFgyO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RlcHM7ICsraSlcbiAgICB7XG4gICAgICB0aGlzLm1fZGVzdFBvbHkucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChcbiAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlggKyBYICogdGhpcy5tX2RlbHRhKSxcbiAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlkgKyBZICogdGhpcy5tX2RlbHRhKSkpO1xuICAgICAgWDIgPSBYO1xuICAgICAgWCA9IFggKiB0aGlzLm1fY29zIC0gdGhpcy5tX3NpbiAqIFk7XG4gICAgICBZID0gWDIgKiB0aGlzLm1fc2luICsgWSAqIHRoaXMubV9jb3M7XG4gICAgfVxuICAgIHRoaXMubV9kZXN0UG9seS5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KFxuICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlggKyB0aGlzLm1fbm9ybWFsc1tqXS5YICogdGhpcy5tX2RlbHRhKSxcbiAgICAgIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5ZICsgdGhpcy5tX25vcm1hbHNbal0uWSAqIHRoaXMubV9kZWx0YSkpKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5FcnJvciA9IGZ1bmN0aW9uIChtZXNzYWdlKVxuICB7XG4gICAgdHJ5XG4gICAge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyKVxuICAgIHtcbiAgICAgIGFsZXJ0KGVyci5tZXNzYWdlKTtcbiAgICB9XG4gIH07XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBKUyBleHRlbnNpb24gYnkgVGltbyAyMDEzXG4gIENsaXBwZXJMaWIuSlMgPSB7fTtcbiAgQ2xpcHBlckxpYi5KUy5BcmVhT2ZQb2x5Z29uID0gZnVuY3Rpb24gKHBvbHksIHNjYWxlKVxuICB7XG4gICAgaWYgKCFzY2FsZSkgc2NhbGUgPSAxO1xuICAgIHJldHVybiBDbGlwcGVyTGliLkNsaXBwZXIuQXJlYShwb2x5KSAvIChzY2FsZSAqIHNjYWxlKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5KUy5BcmVhT2ZQb2x5Z29ucyA9IGZ1bmN0aW9uIChwb2x5LCBzY2FsZSlcbiAge1xuICAgIGlmICghc2NhbGUpIHNjYWxlID0gMTtcbiAgICB2YXIgYXJlYSA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb2x5Lmxlbmd0aDsgaSsrKVxuICAgIHtcbiAgICAgIGFyZWEgKz0gQ2xpcHBlckxpYi5DbGlwcGVyLkFyZWEocG9seVtpXSk7XG4gICAgfVxuICAgIHJldHVybiBhcmVhIC8gKHNjYWxlICogc2NhbGUpO1xuICB9O1xuICBDbGlwcGVyTGliLkpTLkJvdW5kc09mUGF0aCA9IGZ1bmN0aW9uIChwYXRoLCBzY2FsZSlcbiAge1xuICAgIHJldHVybiBDbGlwcGVyTGliLkpTLkJvdW5kc09mUGF0aHMoW3BhdGhdLCBzY2FsZSk7XG4gIH07XG4gIENsaXBwZXJMaWIuSlMuQm91bmRzT2ZQYXRocyA9IGZ1bmN0aW9uIChwYXRocywgc2NhbGUpXG4gIHtcbiAgICBpZiAoIXNjYWxlKSBzY2FsZSA9IDE7XG4gICAgdmFyIGJvdW5kcyA9IENsaXBwZXJMaWIuQ2xpcHBlci5HZXRCb3VuZHMocGF0aHMpO1xuICAgIGJvdW5kcy5sZWZ0IC89IHNjYWxlO1xuICAgIGJvdW5kcy5ib3R0b20gLz0gc2NhbGU7XG4gICAgYm91bmRzLnJpZ2h0IC89IHNjYWxlO1xuICAgIGJvdW5kcy50b3AgLz0gc2NhbGU7XG4gICAgcmV0dXJuIGJvdW5kcztcbiAgfTtcbiAgLy8gQ2xlYW4oKSBqb2lucyB2ZXJ0aWNlcyB0aGF0IGFyZSB0b28gbmVhciBlYWNoIG90aGVyXG4gIC8vIGFuZCBjYXVzZXMgZGlzdG9ydGlvbiB0byBvZmZzZXR0ZWQgcG9seWdvbnMgd2l0aG91dCBjbGVhbmluZ1xuICBDbGlwcGVyTGliLkpTLkNsZWFuID0gZnVuY3Rpb24gKHBvbHlnb24sIGRlbHRhKVxuICB7XG4gICAgaWYgKCEocG9seWdvbiBpbnN0YW5jZW9mIEFycmF5KSkgcmV0dXJuIFtdO1xuICAgIHZhciBpc1BvbHlnb25zID0gcG9seWdvblswXSBpbnN0YW5jZW9mIEFycmF5O1xuICAgIHZhciBwb2x5Z29uID0gQ2xpcHBlckxpYi5KUy5DbG9uZShwb2x5Z29uKTtcbiAgICBpZiAodHlwZW9mIGRlbHRhICE9IFwibnVtYmVyXCIgfHwgZGVsdGEgPT09IG51bGwpXG4gICAge1xuICAgICAgQ2xpcHBlckxpYi5FcnJvcihcIkRlbHRhIGlzIG5vdCBhIG51bWJlciBpbiBDbGVhbigpLlwiKTtcbiAgICAgIHJldHVybiBwb2x5Z29uO1xuICAgIH1cbiAgICBpZiAocG9seWdvbi5sZW5ndGggPT09IDAgfHwgKHBvbHlnb24ubGVuZ3RoID09IDEgJiYgcG9seWdvblswXS5sZW5ndGggPT09IDApIHx8IGRlbHRhIDwgMCkgcmV0dXJuIHBvbHlnb247XG4gICAgaWYgKCFpc1BvbHlnb25zKSBwb2x5Z29uID0gW3BvbHlnb25dO1xuICAgIHZhciBrX2xlbmd0aCA9IHBvbHlnb24ubGVuZ3RoO1xuICAgIHZhciBsZW4sIHBvbHksIHJlc3VsdCwgZCwgcCwgaiwgaTtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIGZvciAodmFyIGsgPSAwOyBrIDwga19sZW5ndGg7IGsrKylcbiAgICB7XG4gICAgICBwb2x5ID0gcG9seWdvbltrXTtcbiAgICAgIGxlbiA9IHBvbHkubGVuZ3RoO1xuICAgICAgaWYgKGxlbiA9PT0gMCkgY29udGludWU7XG4gICAgICBlbHNlIGlmIChsZW4gPCAzKVxuICAgICAge1xuICAgICAgICByZXN1bHQgPSBwb2x5O1xuICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICByZXN1bHQgPSBwb2x5O1xuICAgICAgZCA9IGRlbHRhICogZGVsdGE7XG4gICAgICAvL2QgPSBNYXRoLmZsb29yKGNfZGVsdGEgKiBjX2RlbHRhKTtcbiAgICAgIHAgPSBwb2x5WzBdO1xuICAgICAgaiA9IDE7XG4gICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICB7XG4gICAgICAgIGlmICgocG9seVtpXS5YIC0gcC5YKSAqIChwb2x5W2ldLlggLSBwLlgpICtcbiAgICAgICAgICAocG9seVtpXS5ZIC0gcC5ZKSAqIChwb2x5W2ldLlkgLSBwLlkpIDw9IGQpXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIHJlc3VsdFtqXSA9IHBvbHlbaV07XG4gICAgICAgIHAgPSBwb2x5W2ldO1xuICAgICAgICBqKys7XG4gICAgICB9XG4gICAgICBwID0gcG9seVtqIC0gMV07XG4gICAgICBpZiAoKHBvbHlbMF0uWCAtIHAuWCkgKiAocG9seVswXS5YIC0gcC5YKSArXG4gICAgICAgIChwb2x5WzBdLlkgLSBwLlkpICogKHBvbHlbMF0uWSAtIHAuWSkgPD0gZClcbiAgICAgICAgai0tO1xuICAgICAgaWYgKGogPCBsZW4pXG4gICAgICAgIHJlc3VsdC5zcGxpY2UoaiwgbGVuIC0gaik7XG4gICAgICBpZiAocmVzdWx0Lmxlbmd0aCkgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgfVxuICAgIGlmICghaXNQb2x5Z29ucyAmJiByZXN1bHRzLmxlbmd0aCkgcmVzdWx0cyA9IHJlc3VsdHNbMF07XG4gICAgZWxzZSBpZiAoIWlzUG9seWdvbnMgJiYgcmVzdWx0cy5sZW5ndGggPT09IDApIHJlc3VsdHMgPSBbXTtcbiAgICBlbHNlIGlmIChpc1BvbHlnb25zICYmIHJlc3VsdHMubGVuZ3RoID09PSAwKSByZXN1bHRzID0gW1xuICAgICAgW11cbiAgICBdO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG4gIC8vIE1ha2UgZGVlcCBjb3B5IG9mIFBvbHlnb25zIG9yIFBvbHlnb25cbiAgLy8gc28gdGhhdCBhbHNvIEludFBvaW50IG9iamVjdHMgYXJlIGNsb25lZCBhbmQgbm90IG9ubHkgcmVmZXJlbmNlZFxuICAvLyBUaGlzIHNob3VsZCBiZSB0aGUgZmFzdGVzdCB3YXlcbiAgQ2xpcHBlckxpYi5KUy5DbG9uZSA9IGZ1bmN0aW9uIChwb2x5Z29uKVxuICB7XG4gICAgaWYgKCEocG9seWdvbiBpbnN0YW5jZW9mIEFycmF5KSkgcmV0dXJuIFtdO1xuICAgIGlmIChwb2x5Z29uLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFtdO1xuICAgIGVsc2UgaWYgKHBvbHlnb24ubGVuZ3RoID09IDEgJiYgcG9seWdvblswXS5sZW5ndGggPT09IDApIHJldHVybiBbW11dO1xuICAgIHZhciBpc1BvbHlnb25zID0gcG9seWdvblswXSBpbnN0YW5jZW9mIEFycmF5O1xuICAgIGlmICghaXNQb2x5Z29ucykgcG9seWdvbiA9IFtwb2x5Z29uXTtcbiAgICB2YXIgbGVuID0gcG9seWdvbi5sZW5ndGgsXG4gICAgICBwbGVuLCBpLCBqLCByZXN1bHQ7XG4gICAgdmFyIHJlc3VsdHMgPSBuZXcgQXJyYXkobGVuKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAge1xuICAgICAgcGxlbiA9IHBvbHlnb25baV0ubGVuZ3RoO1xuICAgICAgcmVzdWx0ID0gbmV3IEFycmF5KHBsZW4pO1xuICAgICAgZm9yIChqID0gMDsgaiA8IHBsZW47IGorKylcbiAgICAgIHtcbiAgICAgICAgcmVzdWx0W2pdID0ge1xuICAgICAgICAgIFg6IHBvbHlnb25baV1bal0uWCxcbiAgICAgICAgICBZOiBwb2x5Z29uW2ldW2pdLllcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdHNbaV0gPSByZXN1bHQ7XG4gICAgfVxuICAgIGlmICghaXNQb2x5Z29ucykgcmVzdWx0cyA9IHJlc3VsdHNbMF07XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG4gIC8vIFJlbW92ZXMgcG9pbnRzIHRoYXQgZG9lc24ndCBhZmZlY3QgbXVjaCB0byB0aGUgdmlzdWFsIGFwcGVhcmFuY2UuXG4gIC8vIElmIG1pZGRsZSBwb2ludCBpcyBhdCBvciB1bmRlciBjZXJ0YWluIGRpc3RhbmNlICh0b2xlcmFuY2UpIG9mIHRoZSBsaW5lIHNlZ21lbnQgYmV0d2VlblxuICAvLyBzdGFydCBhbmQgZW5kIHBvaW50LCB0aGUgbWlkZGxlIHBvaW50IGlzIHJlbW92ZWQuXG4gIENsaXBwZXJMaWIuSlMuTGlnaHRlbiA9IGZ1bmN0aW9uIChwb2x5Z29uLCB0b2xlcmFuY2UpXG4gIHtcbiAgICBpZiAoIShwb2x5Z29uIGluc3RhbmNlb2YgQXJyYXkpKSByZXR1cm4gW107XG4gICAgaWYgKHR5cGVvZiB0b2xlcmFuY2UgIT0gXCJudW1iZXJcIiB8fCB0b2xlcmFuY2UgPT09IG51bGwpXG4gICAge1xuICAgICAgQ2xpcHBlckxpYi5FcnJvcihcIlRvbGVyYW5jZSBpcyBub3QgYSBudW1iZXIgaW4gTGlnaHRlbigpLlwiKVxuICAgICAgcmV0dXJuIENsaXBwZXJMaWIuSlMuQ2xvbmUocG9seWdvbik7XG4gICAgfVxuICAgIGlmIChwb2x5Z29uLmxlbmd0aCA9PT0gMCB8fCAocG9seWdvbi5sZW5ndGggPT0gMSAmJiBwb2x5Z29uWzBdLmxlbmd0aCA9PT0gMCkgfHwgdG9sZXJhbmNlIDwgMClcbiAgICB7XG4gICAgICByZXR1cm4gQ2xpcHBlckxpYi5KUy5DbG9uZShwb2x5Z29uKTtcbiAgICB9XG4gICAgaWYgKCEocG9seWdvblswXSBpbnN0YW5jZW9mIEFycmF5KSkgcG9seWdvbiA9IFtwb2x5Z29uXTtcbiAgICB2YXIgaSwgaiwgcG9seSwgaywgcG9seTIsIHBsZW4sIEEsIEIsIFAsIGQsIHJlbSwgYWRkbGFzdDtcbiAgICB2YXIgYnhheCwgYnlheSwgbCwgYXgsIGF5O1xuICAgIHZhciBsZW4gPSBwb2x5Z29uLmxlbmd0aDtcbiAgICB2YXIgdG9sZXJhbmNlU3EgPSB0b2xlcmFuY2UgKiB0b2xlcmFuY2U7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAge1xuICAgICAgcG9seSA9IHBvbHlnb25baV07XG4gICAgICBwbGVuID0gcG9seS5sZW5ndGg7XG4gICAgICBpZiAocGxlbiA9PSAwKSBjb250aW51ZTtcbiAgICAgIGZvciAoayA9IDA7IGsgPCAxMDAwMDAwOyBrKyspIC8vIGNvdWxkIGJlIGZvcmV2ZXIgbG9vcCwgYnV0IHdpc2VyIHRvIHJlc3RyaWN0IG1heCByZXBlYXQgY291bnRcbiAgICAgIHtcbiAgICAgICAgcG9seTIgPSBbXTtcbiAgICAgICAgcGxlbiA9IHBvbHkubGVuZ3RoO1xuICAgICAgICAvLyB0aGUgZmlyc3QgaGF2ZSB0byBhZGRlZCB0byB0aGUgZW5kLCBpZiBmaXJzdCBhbmQgbGFzdCBhcmUgbm90IHRoZSBzYW1lXG4gICAgICAgIC8vIHRoaXMgd2F5IHdlIGVuc3VyZSB0aGF0IGFsc28gdGhlIGFjdHVhbCBsYXN0IHBvaW50IGNhbiBiZSByZW1vdmVkIGlmIG5lZWRlZFxuICAgICAgICBpZiAocG9seVtwbGVuIC0gMV0uWCAhPSBwb2x5WzBdLlggfHwgcG9seVtwbGVuIC0gMV0uWSAhPSBwb2x5WzBdLlkpXG4gICAgICAgIHtcbiAgICAgICAgICBhZGRsYXN0ID0gMTtcbiAgICAgICAgICBwb2x5LnB1c2goXG4gICAgICAgICAge1xuICAgICAgICAgICAgWDogcG9seVswXS5YLFxuICAgICAgICAgICAgWTogcG9seVswXS5ZXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcGxlbiA9IHBvbHkubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgYWRkbGFzdCA9IDA7XG4gICAgICAgIHJlbSA9IFtdOyAvLyBJbmRleGVzIG9mIHJlbW92ZWQgcG9pbnRzXG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBwbGVuIC0gMjsgaisrKVxuICAgICAgICB7XG4gICAgICAgICAgQSA9IHBvbHlbal07IC8vIFN0YXJ0IHBvaW50IG9mIGxpbmUgc2VnbWVudFxuICAgICAgICAgIFAgPSBwb2x5W2ogKyAxXTsgLy8gTWlkZGxlIHBvaW50LiBUaGlzIGlzIHRoZSBvbmUgdG8gYmUgcmVtb3ZlZC5cbiAgICAgICAgICBCID0gcG9seVtqICsgMl07IC8vIEVuZCBwb2ludCBvZiBsaW5lIHNlZ21lbnRcbiAgICAgICAgICBheCA9IEEuWDtcbiAgICAgICAgICBheSA9IEEuWTtcbiAgICAgICAgICBieGF4ID0gQi5YIC0gYXg7XG4gICAgICAgICAgYnlheSA9IEIuWSAtIGF5O1xuICAgICAgICAgIGlmIChieGF4ICE9PSAwIHx8IGJ5YXkgIT09IDApIC8vIFRvIGF2b2lkIE5hbiwgd2hlbiBBPT1QICYmIFA9PUIuIEFuZCB0byBhdm9pZCBwZWFrcyAoQT09QiAmJiBBIT1QKSwgd2hpY2ggaGF2ZSBsZW5naHQsIGJ1dCBub3QgYXJlYS5cbiAgICAgICAgICB7XG4gICAgICAgICAgICBsID0gKChQLlggLSBheCkgKiBieGF4ICsgKFAuWSAtIGF5KSAqIGJ5YXkpIC8gKGJ4YXggKiBieGF4ICsgYnlheSAqIGJ5YXkpO1xuICAgICAgICAgICAgaWYgKGwgPiAxKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBheCA9IEIuWDtcbiAgICAgICAgICAgICAgYXkgPSBCLlk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChsID4gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgYXggKz0gYnhheCAqIGw7XG4gICAgICAgICAgICAgIGF5ICs9IGJ5YXkgKiBsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBieGF4ID0gUC5YIC0gYXg7XG4gICAgICAgICAgYnlheSA9IFAuWSAtIGF5O1xuICAgICAgICAgIGQgPSBieGF4ICogYnhheCArIGJ5YXkgKiBieWF5O1xuICAgICAgICAgIGlmIChkIDw9IHRvbGVyYW5jZVNxKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlbVtqICsgMV0gPSAxO1xuICAgICAgICAgICAgaisrOyAvLyB3aGVuIHJlbW92ZWQsIHRyYW5zZmVyIHRoZSBwb2ludGVyIHRvIHRoZSBuZXh0IG9uZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBhZGQgYWxsIHVucmVtb3ZlZCBwb2ludHMgdG8gcG9seTJcbiAgICAgICAgcG9seTIucHVzaChcbiAgICAgICAge1xuICAgICAgICAgIFg6IHBvbHlbMF0uWCxcbiAgICAgICAgICBZOiBwb2x5WzBdLllcbiAgICAgICAgfSk7XG4gICAgICAgIGZvciAoaiA9IDE7IGogPCBwbGVuIC0gMTsgaisrKVxuICAgICAgICAgIGlmICghcmVtW2pdKSBwb2x5Mi5wdXNoKFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFg6IHBvbHlbal0uWCxcbiAgICAgICAgICAgIFk6IHBvbHlbal0uWVxuICAgICAgICAgIH0pO1xuICAgICAgICBwb2x5Mi5wdXNoKFxuICAgICAgICB7XG4gICAgICAgICAgWDogcG9seVtwbGVuIC0gMV0uWCxcbiAgICAgICAgICBZOiBwb2x5W3BsZW4gLSAxXS5ZXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBpZiB0aGUgZmlyc3QgcG9pbnQgd2FzIGFkZGVkIHRvIHRoZSBlbmQsIHJlbW92ZSBpdFxuICAgICAgICBpZiAoYWRkbGFzdCkgcG9seS5wb3AoKTtcbiAgICAgICAgLy8gYnJlYWssIGlmIHRoZXJlIHdhcyBub3QgYW55bW9yZSByZW1vdmVkIHBvaW50c1xuICAgICAgICBpZiAoIXJlbS5sZW5ndGgpIGJyZWFrO1xuICAgICAgICAvLyBlbHNlIGNvbnRpbnVlIGxvb3BpbmcgdXNpbmcgcG9seTIsIHRvIGNoZWNrIGlmIHRoZXJlIGFyZSBwb2ludHMgdG8gcmVtb3ZlXG4gICAgICAgIGVsc2UgcG9seSA9IHBvbHkyO1xuICAgICAgfVxuICAgICAgcGxlbiA9IHBvbHkyLmxlbmd0aDtcbiAgICAgIC8vIHJlbW92ZSBkdXBsaWNhdGUgZnJvbSBlbmQsIGlmIG5lZWRlZFxuICAgICAgaWYgKHBvbHkyW3BsZW4gLSAxXS5YID09IHBvbHkyWzBdLlggJiYgcG9seTJbcGxlbiAtIDFdLlkgPT0gcG9seTJbMF0uWSlcbiAgICAgIHtcbiAgICAgICAgcG9seTIucG9wKCk7XG4gICAgICB9XG4gICAgICBpZiAocG9seTIubGVuZ3RoID4gMikgLy8gdG8gYXZvaWQgdHdvLXBvaW50LXBvbHlnb25zXG4gICAgICAgIHJlc3VsdHMucHVzaChwb2x5Mik7XG4gICAgfVxuICAgIGlmICghKHBvbHlnb25bMF0gaW5zdGFuY2VvZiBBcnJheSkpIHJlc3VsdHMgPSByZXN1bHRzWzBdO1xuICAgIGlmICh0eXBlb2YgKHJlc3VsdHMpID09IFwidW5kZWZpbmVkXCIpIHJlc3VsdHMgPSBbXG4gICAgICBbXVxuICAgIF07XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cbiAgQ2xpcHBlckxpYi5KUy5QZXJpbWV0ZXJPZlBhdGggPSBmdW5jdGlvbiAocGF0aCwgY2xvc2VkLCBzY2FsZSlcbiAge1xuICAgIGlmICh0eXBlb2YgKHBhdGgpID09IFwidW5kZWZpbmVkXCIpIHJldHVybiAwO1xuICAgIHZhciBzcXJ0ID0gTWF0aC5zcXJ0O1xuICAgIHZhciBwZXJpbWV0ZXIgPSAwLjA7XG4gICAgdmFyIHAxLCBwMiwgcDF4ID0gMC4wLFxuICAgICAgcDF5ID0gMC4wLFxuICAgICAgcDJ4ID0gMC4wLFxuICAgICAgcDJ5ID0gMC4wO1xuICAgIHZhciBqID0gcGF0aC5sZW5ndGg7XG4gICAgaWYgKGogPCAyKSByZXR1cm4gMDtcbiAgICBpZiAoY2xvc2VkKVxuICAgIHtcbiAgICAgIHBhdGhbal0gPSBwYXRoWzBdO1xuICAgICAgaisrO1xuICAgIH1cbiAgICB3aGlsZSAoLS1qKVxuICAgIHtcbiAgICAgIHAxID0gcGF0aFtqXTtcbiAgICAgIHAxeCA9IHAxLlg7XG4gICAgICBwMXkgPSBwMS5ZO1xuICAgICAgcDIgPSBwYXRoW2ogLSAxXTtcbiAgICAgIHAyeCA9IHAyLlg7XG4gICAgICBwMnkgPSBwMi5ZO1xuICAgICAgcGVyaW1ldGVyICs9IHNxcnQoKHAxeCAtIHAyeCkgKiAocDF4IC0gcDJ4KSArIChwMXkgLSBwMnkpICogKHAxeSAtIHAyeSkpO1xuICAgIH1cbiAgICBpZiAoY2xvc2VkKSBwYXRoLnBvcCgpO1xuICAgIHJldHVybiBwZXJpbWV0ZXIgLyBzY2FsZTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5KUy5QZXJpbWV0ZXJPZlBhdGhzID0gZnVuY3Rpb24gKHBhdGhzLCBjbG9zZWQsIHNjYWxlKVxuICB7XG4gICAgaWYgKCFzY2FsZSkgc2NhbGUgPSAxO1xuICAgIHZhciBwZXJpbWV0ZXIgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aHMubGVuZ3RoOyBpKyspXG4gICAge1xuICAgICAgcGVyaW1ldGVyICs9IENsaXBwZXJMaWIuSlMuUGVyaW1ldGVyT2ZQYXRoKHBhdGhzW2ldLCBjbG9zZWQsIHNjYWxlKTtcbiAgICB9XG4gICAgcmV0dXJuIHBlcmltZXRlcjtcbiAgfTtcbiAgQ2xpcHBlckxpYi5KUy5TY2FsZURvd25QYXRoID0gZnVuY3Rpb24gKHBhdGgsIHNjYWxlKVxuICB7XG4gICAgdmFyIGksIHA7XG4gICAgaWYgKCFzY2FsZSkgc2NhbGUgPSAxO1xuICAgIGkgPSBwYXRoLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKVxuICAgIHtcbiAgICAgIHAgPSBwYXRoW2ldO1xuICAgICAgcC5YID0gcC5YIC8gc2NhbGU7XG4gICAgICBwLlkgPSBwLlkgLyBzY2FsZTtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuSlMuU2NhbGVEb3duUGF0aHMgPSBmdW5jdGlvbiAocGF0aHMsIHNjYWxlKVxuICB7XG4gICAgdmFyIGksIGosIHA7XG4gICAgaWYgKCFzY2FsZSkgc2NhbGUgPSAxO1xuICAgIGkgPSBwYXRocy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSlcbiAgICB7XG4gICAgICBqID0gcGF0aHNbaV0ubGVuZ3RoO1xuICAgICAgd2hpbGUgKGotLSlcbiAgICAgIHtcbiAgICAgICAgcCA9IHBhdGhzW2ldW2pdO1xuICAgICAgICBwLlggPSBwLlggLyBzY2FsZTtcbiAgICAgICAgcC5ZID0gcC5ZIC8gc2NhbGU7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkpTLlNjYWxlVXBQYXRoID0gZnVuY3Rpb24gKHBhdGgsIHNjYWxlKVxuICB7XG4gICAgdmFyIGksIHAsIHJvdW5kID0gTWF0aC5yb3VuZDtcbiAgICBpZiAoIXNjYWxlKSBzY2FsZSA9IDE7XG4gICAgaSA9IHBhdGgubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pXG4gICAge1xuICAgICAgcCA9IHBhdGhbaV07XG4gICAgICBwLlggPSByb3VuZChwLlggKiBzY2FsZSk7XG4gICAgICBwLlkgPSByb3VuZChwLlkgKiBzY2FsZSk7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkpTLlNjYWxlVXBQYXRocyA9IGZ1bmN0aW9uIChwYXRocywgc2NhbGUpXG4gIHtcbiAgICB2YXIgaSwgaiwgcCwgcm91bmQgPSBNYXRoLnJvdW5kO1xuICAgIGlmICghc2NhbGUpIHNjYWxlID0gMTtcbiAgICBpID0gcGF0aHMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pXG4gICAge1xuICAgICAgaiA9IHBhdGhzW2ldLmxlbmd0aDtcbiAgICAgIHdoaWxlIChqLS0pXG4gICAgICB7XG4gICAgICAgIHAgPSBwYXRoc1tpXVtqXTtcbiAgICAgICAgcC5YID0gcm91bmQocC5YICogc2NhbGUpO1xuICAgICAgICBwLlkgPSByb3VuZChwLlkgKiBzY2FsZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkV4UG9seWdvbnMgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIENsaXBwZXJMaWIuRXhQb2x5Z29uID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHRoaXMub3V0ZXIgPSBudWxsO1xuICAgIHRoaXMuaG9sZXMgPSBudWxsO1xuICB9O1xuICBDbGlwcGVyTGliLkpTLkFkZE91dGVyUG9seU5vZGVUb0V4UG9seWdvbnMgPSBmdW5jdGlvbiAocG9seW5vZGUsIGV4cG9seWdvbnMpXG4gIHtcbiAgICB2YXIgZXAgPSBuZXcgQ2xpcHBlckxpYi5FeFBvbHlnb24oKTtcbiAgICBlcC5vdXRlciA9IHBvbHlub2RlLkNvbnRvdXIoKTtcbiAgICB2YXIgY2hpbGRzID0gcG9seW5vZGUuQ2hpbGRzKCk7XG4gICAgdmFyIGlsZW4gPSBjaGlsZHMubGVuZ3RoO1xuICAgIGVwLmhvbGVzID0gbmV3IEFycmF5KGlsZW4pO1xuICAgIHZhciBub2RlLCBuLCBpLCBqLCBjaGlsZHMyLCBqbGVuO1xuICAgIGZvciAoaSA9IDA7IGkgPCBpbGVuOyBpKyspXG4gICAge1xuICAgICAgbm9kZSA9IGNoaWxkc1tpXTtcbiAgICAgIGVwLmhvbGVzW2ldID0gbm9kZS5Db250b3VyKCk7XG4gICAgICAvL0FkZCBvdXRlciBwb2x5Z29ucyBjb250YWluZWQgYnkgKG5lc3RlZCB3aXRoaW4pIGhvbGVzIC4uLlxuICAgICAgZm9yIChqID0gMCwgY2hpbGRzMiA9IG5vZGUuQ2hpbGRzKCksIGpsZW4gPSBjaGlsZHMyLmxlbmd0aDsgaiA8IGpsZW47IGorKylcbiAgICAgIHtcbiAgICAgICAgbiA9IGNoaWxkczJbal07XG4gICAgICAgIENsaXBwZXJMaWIuSlMuQWRkT3V0ZXJQb2x5Tm9kZVRvRXhQb2x5Z29ucyhuLCBleHBvbHlnb25zKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZXhwb2x5Z29ucy5wdXNoKGVwKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5KUy5FeFBvbHlnb25zVG9QYXRocyA9IGZ1bmN0aW9uIChleHBvbHlnb25zKVxuICB7XG4gICAgdmFyIGEsIGksIGFsZW4sIGlsZW47XG4gICAgdmFyIHBhdGhzID0gbmV3IENsaXBwZXJMaWIuUGF0aHMoKTtcbiAgICBmb3IgKGEgPSAwLCBhbGVuID0gZXhwb2x5Z29ucy5sZW5ndGg7IGEgPCBhbGVuOyBhKyspXG4gICAge1xuICAgICAgcGF0aHMucHVzaChleHBvbHlnb25zW2FdLm91dGVyKTtcbiAgICAgIGZvciAoaSA9IDAsIGlsZW4gPSBleHBvbHlnb25zW2FdLmhvbGVzLmxlbmd0aDsgaSA8IGlsZW47IGkrKylcbiAgICAgIHtcbiAgICAgICAgcGF0aHMucHVzaChleHBvbHlnb25zW2FdLmhvbGVzW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHBhdGhzO1xuICB9XG4gIENsaXBwZXJMaWIuSlMuUG9seVRyZWVUb0V4UG9seWdvbnMgPSBmdW5jdGlvbiAocG9seXRyZWUpXG4gIHtcbiAgICB2YXIgZXhwb2x5Z29ucyA9IG5ldyBDbGlwcGVyTGliLkV4UG9seWdvbnMoKTtcbiAgICB2YXIgbm9kZSwgaSwgY2hpbGRzLCBpbGVuO1xuICAgIGZvciAoaSA9IDAsIGNoaWxkcyA9IHBvbHl0cmVlLkNoaWxkcygpLCBpbGVuID0gY2hpbGRzLmxlbmd0aDsgaSA8IGlsZW47IGkrKylcbiAgICB7XG4gICAgICBub2RlID0gY2hpbGRzW2ldO1xuICAgICAgQ2xpcHBlckxpYi5KUy5BZGRPdXRlclBvbHlOb2RlVG9FeFBvbHlnb25zKG5vZGUsIGV4cG9seWdvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gZXhwb2x5Z29ucztcbiAgfTtcbn0pKCk7XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgdHdvUHJvZHVjdCA9IHJlcXVpcmUoXCJ0d28tcHJvZHVjdFwiKVxudmFyIHJvYnVzdFN1bSA9IHJlcXVpcmUoXCJyb2J1c3Qtc3VtXCIpXG52YXIgcm9idXN0RGlmZiA9IHJlcXVpcmUoXCJyb2J1c3Qtc3VidHJhY3RcIilcbnZhciByb2J1c3RTY2FsZSA9IHJlcXVpcmUoXCJyb2J1c3Qtc2NhbGVcIilcblxudmFyIE5VTV9FWFBBTkQgPSA2XG5cbmZ1bmN0aW9uIGNvZmFjdG9yKG0sIGMpIHtcbiAgdmFyIHJlc3VsdCA9IG5ldyBBcnJheShtLmxlbmd0aC0xKVxuICBmb3IodmFyIGk9MTsgaTxtLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIHIgPSByZXN1bHRbaS0xXSA9IG5ldyBBcnJheShtLmxlbmd0aC0xKVxuICAgIGZvcih2YXIgaj0wLGs9MDsgajxtLmxlbmd0aDsgKytqKSB7XG4gICAgICBpZihqID09PSBjKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICByW2srK10gPSBtW2ldW2pdXG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gbWF0cml4KG4pIHtcbiAgdmFyIHJlc3VsdCA9IG5ldyBBcnJheShuKVxuICBmb3IodmFyIGk9MDsgaTxuOyArK2kpIHtcbiAgICByZXN1bHRbaV0gPSBuZXcgQXJyYXkobilcbiAgICBmb3IodmFyIGo9MDsgajxuOyArK2opIHtcbiAgICAgIHJlc3VsdFtpXVtqXSA9IFtcIm1cIiwgaiwgXCJbXCIsIChuLWktMiksIFwiXVwiXS5qb2luKFwiXCIpXG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVTdW0oZXhwcikge1xuICBpZihleHByLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBleHByWzBdXG4gIH0gZWxzZSBpZihleHByLmxlbmd0aCA9PT0gMikge1xuICAgIHJldHVybiBbXCJzdW0oXCIsIGV4cHJbMF0sIFwiLFwiLCBleHByWzFdLCBcIilcIl0uam9pbihcIlwiKVxuICB9IGVsc2Uge1xuICAgIHZhciBtID0gZXhwci5sZW5ndGg+PjFcbiAgICByZXR1cm4gW1wic3VtKFwiLCBnZW5lcmF0ZVN1bShleHByLnNsaWNlKDAsIG0pKSwgXCIsXCIsIGdlbmVyYXRlU3VtKGV4cHIuc2xpY2UobSkpLCBcIilcIl0uam9pbihcIlwiKVxuICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VQcm9kdWN0KGEsIGIpIHtcbiAgaWYoYS5jaGFyQXQoMCkgPT09IFwibVwiKSB7XG4gICAgaWYoYi5jaGFyQXQoMCkgPT09IFwid1wiKSB7XG4gICAgICB2YXIgdG9rcyA9IGEuc3BsaXQoXCJbXCIpXG4gICAgICByZXR1cm4gW1wid1wiLCBiLnN1YnN0cigxKSwgXCJtXCIsIHRva3NbMF0uc3Vic3RyKDEpXS5qb2luKFwiXCIpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBbXCJwcm9kKFwiLCBhLCBcIixcIiwgYiwgXCIpXCJdLmpvaW4oXCJcIilcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG1ha2VQcm9kdWN0KGIsIGEpXG4gIH1cbn1cblxuZnVuY3Rpb24gc2lnbihzKSB7XG4gIGlmKHMgJiAxICE9PSAwKSB7XG4gICAgcmV0dXJuIFwiLVwiXG4gIH1cbiAgcmV0dXJuIFwiXCJcbn1cblxuZnVuY3Rpb24gZGV0ZXJtaW5hbnQobSkge1xuICBpZihtLmxlbmd0aCA9PT0gMikge1xuICAgIHJldHVybiBbW1wiZGlmZihcIiwgbWFrZVByb2R1Y3QobVswXVswXSwgbVsxXVsxXSksIFwiLFwiLCBtYWtlUHJvZHVjdChtWzFdWzBdLCBtWzBdWzFdKSwgXCIpXCJdLmpvaW4oXCJcIildXG4gIH0gZWxzZSB7XG4gICAgdmFyIGV4cHIgPSBbXVxuICAgIGZvcih2YXIgaT0wOyBpPG0ubGVuZ3RoOyArK2kpIHtcbiAgICAgIGV4cHIucHVzaChbXCJzY2FsZShcIiwgZ2VuZXJhdGVTdW0oZGV0ZXJtaW5hbnQoY29mYWN0b3IobSwgaSkpKSwgXCIsXCIsIHNpZ24oaSksIG1bMF1baV0sIFwiKVwiXS5qb2luKFwiXCIpKVxuICAgIH1cbiAgICByZXR1cm4gZXhwclxuICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VTcXVhcmUoZCwgbikge1xuICB2YXIgdGVybXMgPSBbXVxuICBmb3IodmFyIGk9MDsgaTxuLTI7ICsraSkge1xuICAgIHRlcm1zLnB1c2goW1wicHJvZChtXCIsIGQsIFwiW1wiLCBpLCBcIl0sbVwiLCBkLCBcIltcIiwgaSwgXCJdKVwiXS5qb2luKFwiXCIpKVxuICB9XG4gIHJldHVybiBnZW5lcmF0ZVN1bSh0ZXJtcylcbn1cblxuZnVuY3Rpb24gb3JpZW50YXRpb24obikge1xuICB2YXIgcG9zID0gW11cbiAgdmFyIG5lZyA9IFtdXG4gIHZhciBtID0gbWF0cml4KG4pXG4gIGZvcih2YXIgaT0wOyBpPG47ICsraSkge1xuICAgIG1bMF1baV0gPSBcIjFcIlxuICAgIG1bbi0xXVtpXSA9IFwid1wiK2lcbiAgfSBcbiAgZm9yKHZhciBpPTA7IGk8bjsgKytpKSB7XG4gICAgaWYoKGkmMSk9PT0wKSB7XG4gICAgICBwb3MucHVzaC5hcHBseShwb3MsZGV0ZXJtaW5hbnQoY29mYWN0b3IobSwgaSkpKVxuICAgIH0gZWxzZSB7XG4gICAgICBuZWcucHVzaC5hcHBseShuZWcsZGV0ZXJtaW5hbnQoY29mYWN0b3IobSwgaSkpKVxuICAgIH1cbiAgfVxuICB2YXIgcG9zRXhwciA9IGdlbmVyYXRlU3VtKHBvcylcbiAgdmFyIG5lZ0V4cHIgPSBnZW5lcmF0ZVN1bShuZWcpXG4gIHZhciBmdW5jTmFtZSA9IFwiZXhhY3RJblNwaGVyZVwiICsgblxuICB2YXIgZnVuY0FyZ3MgPSBbXVxuICBmb3IodmFyIGk9MDsgaTxuOyArK2kpIHtcbiAgICBmdW5jQXJncy5wdXNoKFwibVwiICsgaSlcbiAgfVxuICB2YXIgY29kZSA9IFtcImZ1bmN0aW9uIFwiLCBmdW5jTmFtZSwgXCIoXCIsIGZ1bmNBcmdzLmpvaW4oKSwgXCIpe1wiXVxuICBmb3IodmFyIGk9MDsgaTxuOyArK2kpIHtcbiAgICBjb2RlLnB1c2goXCJ2YXIgd1wiLGksXCI9XCIsbWFrZVNxdWFyZShpLG4pLFwiO1wiKVxuICAgIGZvcih2YXIgaj0wOyBqPG47ICsraikge1xuICAgICAgaWYoaiAhPT0gaSkge1xuICAgICAgICBjb2RlLnB1c2goXCJ2YXIgd1wiLGksXCJtXCIsaixcIj1zY2FsZSh3XCIsaSxcIixtXCIsaixcIlswXSk7XCIpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGNvZGUucHVzaChcInZhciBwPVwiLCBwb3NFeHByLCBcIixuPVwiLCBuZWdFeHByLCBcIixkPWRpZmYocCxuKTtyZXR1cm4gZFtkLmxlbmd0aC0xXTt9cmV0dXJuIFwiLCBmdW5jTmFtZSlcbiAgdmFyIHByb2MgPSBuZXcgRnVuY3Rpb24oXCJzdW1cIiwgXCJkaWZmXCIsIFwicHJvZFwiLCBcInNjYWxlXCIsIGNvZGUuam9pbihcIlwiKSlcbiAgcmV0dXJuIHByb2Mocm9idXN0U3VtLCByb2J1c3REaWZmLCB0d29Qcm9kdWN0LCByb2J1c3RTY2FsZSlcbn1cblxuZnVuY3Rpb24gaW5TcGhlcmUwKCkgeyByZXR1cm4gMCB9XG5mdW5jdGlvbiBpblNwaGVyZTEoKSB7IHJldHVybiAwIH1cbmZ1bmN0aW9uIGluU3BoZXJlMigpIHsgcmV0dXJuIDAgfVxuXG52YXIgQ0FDSEVEID0gW1xuICBpblNwaGVyZTAsXG4gIGluU3BoZXJlMSxcbiAgaW5TcGhlcmUyXG5dXG5cbmZ1bmN0aW9uIHNsb3dJblNwaGVyZShhcmdzKSB7XG4gIHZhciBwcm9jID0gQ0FDSEVEW2FyZ3MubGVuZ3RoXVxuICBpZighcHJvYykge1xuICAgIHByb2MgPSBDQUNIRURbYXJncy5sZW5ndGhdID0gb3JpZW50YXRpb24oYXJncy5sZW5ndGgpXG4gIH1cbiAgcmV0dXJuIHByb2MuYXBwbHkodW5kZWZpbmVkLCBhcmdzKVxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUluU3BoZXJlVGVzdCgpIHtcbiAgd2hpbGUoQ0FDSEVELmxlbmd0aCA8PSBOVU1fRVhQQU5EKSB7XG4gICAgQ0FDSEVELnB1c2gob3JpZW50YXRpb24oQ0FDSEVELmxlbmd0aCkpXG4gIH1cbiAgdmFyIGFyZ3MgPSBbXVxuICB2YXIgcHJvY0FyZ3MgPSBbXCJzbG93XCJdXG4gIGZvcih2YXIgaT0wOyBpPD1OVU1fRVhQQU5EOyArK2kpIHtcbiAgICBhcmdzLnB1c2goXCJhXCIgKyBpKVxuICAgIHByb2NBcmdzLnB1c2goXCJvXCIgKyBpKVxuICB9XG4gIHZhciBjb2RlID0gW1xuICAgIFwiZnVuY3Rpb24gdGVzdEluU3BoZXJlKFwiLCBhcmdzLmpvaW4oKSwgXCIpe3N3aXRjaChhcmd1bWVudHMubGVuZ3RoKXtjYXNlIDA6Y2FzZSAxOnJldHVybiAwO1wiXG4gIF1cbiAgZm9yKHZhciBpPTI7IGk8PU5VTV9FWFBBTkQ7ICsraSkge1xuICAgIGNvZGUucHVzaChcImNhc2UgXCIsIGksIFwiOnJldHVybiBvXCIsIGksIFwiKFwiLCBhcmdzLnNsaWNlKDAsIGkpLmpvaW4oKSwgXCIpO1wiKVxuICB9XG4gIGNvZGUucHVzaChcIn12YXIgcz1uZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCk7Zm9yKHZhciBpPTA7aTxhcmd1bWVudHMubGVuZ3RoOysraSl7c1tpXT1hcmd1bWVudHNbaV19O3JldHVybiBzbG93KHMpO31yZXR1cm4gdGVzdEluU3BoZXJlXCIpXG4gIHByb2NBcmdzLnB1c2goY29kZS5qb2luKFwiXCIpKVxuXG4gIHZhciBwcm9jID0gRnVuY3Rpb24uYXBwbHkodW5kZWZpbmVkLCBwcm9jQXJncylcblxuICBtb2R1bGUuZXhwb3J0cyA9IHByb2MuYXBwbHkodW5kZWZpbmVkLCBbc2xvd0luU3BoZXJlXS5jb25jYXQoQ0FDSEVEKSlcbiAgZm9yKHZhciBpPTA7IGk8PU5VTV9FWFBBTkQ7ICsraSkge1xuICAgIG1vZHVsZS5leHBvcnRzW2ldID0gQ0FDSEVEW2ldXG4gIH1cbn1cblxuZ2VuZXJhdGVJblNwaGVyZVRlc3QoKSIsIlwidXNlIHN0cmljdFwiXG5cbnZhciB0d29Qcm9kdWN0ID0gcmVxdWlyZShcInR3by1wcm9kdWN0XCIpXG52YXIgcm9idXN0U3VtID0gcmVxdWlyZShcInJvYnVzdC1zdW1cIilcbnZhciByb2J1c3RTY2FsZSA9IHJlcXVpcmUoXCJyb2J1c3Qtc2NhbGVcIilcbnZhciByb2J1c3RTdWJ0cmFjdCA9IHJlcXVpcmUoXCJyb2J1c3Qtc3VidHJhY3RcIilcblxudmFyIE5VTV9FWFBBTkQgPSA1XG5cbnZhciBFUFNJTE9OICAgICA9IDEuMTEwMjIzMDI0NjI1MTU2NWUtMTZcbnZhciBFUlJCT1VORDMgICA9ICgzLjAgKyAxNi4wICogRVBTSUxPTikgKiBFUFNJTE9OXG52YXIgRVJSQk9VTkQ0ICAgPSAoNy4wICsgNTYuMCAqIEVQU0lMT04pICogRVBTSUxPTlxuXG5mdW5jdGlvbiBjb2ZhY3RvcihtLCBjKSB7XG4gIHZhciByZXN1bHQgPSBuZXcgQXJyYXkobS5sZW5ndGgtMSlcbiAgZm9yKHZhciBpPTE7IGk8bS5sZW5ndGg7ICsraSkge1xuICAgIHZhciByID0gcmVzdWx0W2ktMV0gPSBuZXcgQXJyYXkobS5sZW5ndGgtMSlcbiAgICBmb3IodmFyIGo9MCxrPTA7IGo8bS5sZW5ndGg7ICsraikge1xuICAgICAgaWYoaiA9PT0gYykge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgcltrKytdID0gbVtpXVtqXVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIG1hdHJpeChuKSB7XG4gIHZhciByZXN1bHQgPSBuZXcgQXJyYXkobilcbiAgZm9yKHZhciBpPTA7IGk8bjsgKytpKSB7XG4gICAgcmVzdWx0W2ldID0gbmV3IEFycmF5KG4pXG4gICAgZm9yKHZhciBqPTA7IGo8bjsgKytqKSB7XG4gICAgICByZXN1bHRbaV1bal0gPSBbXCJtXCIsIGosIFwiW1wiLCAobi1pLTEpLCBcIl1cIl0uam9pbihcIlwiKVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIHNpZ24obikge1xuICBpZihuICYgMSkge1xuICAgIHJldHVybiBcIi1cIlxuICB9XG4gIHJldHVybiBcIlwiXG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlU3VtKGV4cHIpIHtcbiAgaWYoZXhwci5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gZXhwclswXVxuICB9IGVsc2UgaWYoZXhwci5sZW5ndGggPT09IDIpIHtcbiAgICByZXR1cm4gW1wic3VtKFwiLCBleHByWzBdLCBcIixcIiwgZXhwclsxXSwgXCIpXCJdLmpvaW4oXCJcIilcbiAgfSBlbHNlIHtcbiAgICB2YXIgbSA9IGV4cHIubGVuZ3RoPj4xXG4gICAgcmV0dXJuIFtcInN1bShcIiwgZ2VuZXJhdGVTdW0oZXhwci5zbGljZSgwLCBtKSksIFwiLFwiLCBnZW5lcmF0ZVN1bShleHByLnNsaWNlKG0pKSwgXCIpXCJdLmpvaW4oXCJcIilcbiAgfVxufVxuXG5mdW5jdGlvbiBkZXRlcm1pbmFudChtKSB7XG4gIGlmKG0ubGVuZ3RoID09PSAyKSB7XG4gICAgcmV0dXJuIFtbXCJzdW0ocHJvZChcIiwgbVswXVswXSwgXCIsXCIsIG1bMV1bMV0sIFwiKSxwcm9kKC1cIiwgbVswXVsxXSwgXCIsXCIsIG1bMV1bMF0sIFwiKSlcIl0uam9pbihcIlwiKV1cbiAgfSBlbHNlIHtcbiAgICB2YXIgZXhwciA9IFtdXG4gICAgZm9yKHZhciBpPTA7IGk8bS5sZW5ndGg7ICsraSkge1xuICAgICAgZXhwci5wdXNoKFtcInNjYWxlKFwiLCBnZW5lcmF0ZVN1bShkZXRlcm1pbmFudChjb2ZhY3RvcihtLCBpKSkpLCBcIixcIiwgc2lnbihpKSwgbVswXVtpXSwgXCIpXCJdLmpvaW4oXCJcIikpXG4gICAgfVxuICAgIHJldHVybiBleHByXG4gIH1cbn1cblxuZnVuY3Rpb24gb3JpZW50YXRpb24obikge1xuICB2YXIgcG9zID0gW11cbiAgdmFyIG5lZyA9IFtdXG4gIHZhciBtID0gbWF0cml4KG4pXG4gIHZhciBhcmdzID0gW11cbiAgZm9yKHZhciBpPTA7IGk8bjsgKytpKSB7XG4gICAgaWYoKGkmMSk9PT0wKSB7XG4gICAgICBwb3MucHVzaC5hcHBseShwb3MsIGRldGVybWluYW50KGNvZmFjdG9yKG0sIGkpKSlcbiAgICB9IGVsc2Uge1xuICAgICAgbmVnLnB1c2guYXBwbHkobmVnLCBkZXRlcm1pbmFudChjb2ZhY3RvcihtLCBpKSkpXG4gICAgfVxuICAgIGFyZ3MucHVzaChcIm1cIiArIGkpXG4gIH1cbiAgdmFyIHBvc0V4cHIgPSBnZW5lcmF0ZVN1bShwb3MpXG4gIHZhciBuZWdFeHByID0gZ2VuZXJhdGVTdW0obmVnKVxuICB2YXIgZnVuY05hbWUgPSBcIm9yaWVudGF0aW9uXCIgKyBuICsgXCJFeGFjdFwiXG4gIHZhciBjb2RlID0gW1wiZnVuY3Rpb24gXCIsIGZ1bmNOYW1lLCBcIihcIiwgYXJncy5qb2luKCksIFwiKXt2YXIgcD1cIiwgcG9zRXhwciwgXCIsbj1cIiwgbmVnRXhwciwgXCIsZD1zdWIocCxuKTtcXFxucmV0dXJuIGRbZC5sZW5ndGgtMV07fTtyZXR1cm4gXCIsIGZ1bmNOYW1lXS5qb2luKFwiXCIpXG4gIHZhciBwcm9jID0gbmV3IEZ1bmN0aW9uKFwic3VtXCIsIFwicHJvZFwiLCBcInNjYWxlXCIsIFwic3ViXCIsIGNvZGUpXG4gIHJldHVybiBwcm9jKHJvYnVzdFN1bSwgdHdvUHJvZHVjdCwgcm9idXN0U2NhbGUsIHJvYnVzdFN1YnRyYWN0KVxufVxuXG52YXIgb3JpZW50YXRpb24zRXhhY3QgPSBvcmllbnRhdGlvbigzKVxudmFyIG9yaWVudGF0aW9uNEV4YWN0ID0gb3JpZW50YXRpb24oNClcblxudmFyIENBQ0hFRCA9IFtcbiAgZnVuY3Rpb24gb3JpZW50YXRpb24wKCkgeyByZXR1cm4gMCB9LFxuICBmdW5jdGlvbiBvcmllbnRhdGlvbjEoKSB7IHJldHVybiAwIH0sXG4gIGZ1bmN0aW9uIG9yaWVudGF0aW9uMihhLCBiKSB7IFxuICAgIHJldHVybiBiWzBdIC0gYVswXVxuICB9LFxuICBmdW5jdGlvbiBvcmllbnRhdGlvbjMoYSwgYiwgYykge1xuICAgIHZhciBsID0gKGFbMV0gLSBjWzFdKSAqIChiWzBdIC0gY1swXSlcbiAgICB2YXIgciA9IChhWzBdIC0gY1swXSkgKiAoYlsxXSAtIGNbMV0pXG4gICAgdmFyIGRldCA9IGwgLSByXG4gICAgdmFyIHNcbiAgICBpZihsID4gMCkge1xuICAgICAgaWYociA8PSAwKSB7XG4gICAgICAgIHJldHVybiBkZXRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMgPSBsICsgclxuICAgICAgfVxuICAgIH0gZWxzZSBpZihsIDwgMCkge1xuICAgICAgaWYociA+PSAwKSB7XG4gICAgICAgIHJldHVybiBkZXRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMgPSAtKGwgKyByKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZGV0XG4gICAgfVxuICAgIHZhciB0b2wgPSBFUlJCT1VORDMgKiBzXG4gICAgaWYoZGV0ID49IHRvbCB8fCBkZXQgPD0gLXRvbCkge1xuICAgICAgcmV0dXJuIGRldFxuICAgIH1cbiAgICByZXR1cm4gb3JpZW50YXRpb24zRXhhY3QoYSwgYiwgYylcbiAgfSxcbiAgZnVuY3Rpb24gb3JpZW50YXRpb240KGEsYixjLGQpIHtcbiAgICB2YXIgYWR4ID0gYVswXSAtIGRbMF1cbiAgICB2YXIgYmR4ID0gYlswXSAtIGRbMF1cbiAgICB2YXIgY2R4ID0gY1swXSAtIGRbMF1cbiAgICB2YXIgYWR5ID0gYVsxXSAtIGRbMV1cbiAgICB2YXIgYmR5ID0gYlsxXSAtIGRbMV1cbiAgICB2YXIgY2R5ID0gY1sxXSAtIGRbMV1cbiAgICB2YXIgYWR6ID0gYVsyXSAtIGRbMl1cbiAgICB2YXIgYmR6ID0gYlsyXSAtIGRbMl1cbiAgICB2YXIgY2R6ID0gY1syXSAtIGRbMl1cbiAgICB2YXIgYmR4Y2R5ID0gYmR4ICogY2R5XG4gICAgdmFyIGNkeGJkeSA9IGNkeCAqIGJkeVxuICAgIHZhciBjZHhhZHkgPSBjZHggKiBhZHlcbiAgICB2YXIgYWR4Y2R5ID0gYWR4ICogY2R5XG4gICAgdmFyIGFkeGJkeSA9IGFkeCAqIGJkeVxuICAgIHZhciBiZHhhZHkgPSBiZHggKiBhZHlcbiAgICB2YXIgZGV0ID0gYWR6ICogKGJkeGNkeSAtIGNkeGJkeSkgXG4gICAgICAgICAgICArIGJkeiAqIChjZHhhZHkgLSBhZHhjZHkpXG4gICAgICAgICAgICArIGNkeiAqIChhZHhiZHkgLSBiZHhhZHkpXG4gICAgdmFyIHBlcm1hbmVudCA9IChNYXRoLmFicyhiZHhjZHkpICsgTWF0aC5hYnMoY2R4YmR5KSkgKiBNYXRoLmFicyhhZHopXG4gICAgICAgICAgICAgICAgICArIChNYXRoLmFicyhjZHhhZHkpICsgTWF0aC5hYnMoYWR4Y2R5KSkgKiBNYXRoLmFicyhiZHopXG4gICAgICAgICAgICAgICAgICArIChNYXRoLmFicyhhZHhiZHkpICsgTWF0aC5hYnMoYmR4YWR5KSkgKiBNYXRoLmFicyhjZHopXG4gICAgdmFyIHRvbCA9IEVSUkJPVU5ENCAqIHBlcm1hbmVudFxuICAgIGlmICgoZGV0ID4gdG9sKSB8fCAoLWRldCA+IHRvbCkpIHtcbiAgICAgIHJldHVybiBkZXRcbiAgICB9XG4gICAgcmV0dXJuIG9yaWVudGF0aW9uNEV4YWN0KGEsYixjLGQpXG4gIH1cbl1cblxuZnVuY3Rpb24gc2xvd09yaWVudChhcmdzKSB7XG4gIHZhciBwcm9jID0gQ0FDSEVEW2FyZ3MubGVuZ3RoXVxuICBpZighcHJvYykge1xuICAgIHByb2MgPSBDQUNIRURbYXJncy5sZW5ndGhdID0gb3JpZW50YXRpb24oYXJncy5sZW5ndGgpXG4gIH1cbiAgcmV0dXJuIHByb2MuYXBwbHkodW5kZWZpbmVkLCBhcmdzKVxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZU9yaWVudGF0aW9uUHJvYygpIHtcbiAgd2hpbGUoQ0FDSEVELmxlbmd0aCA8PSBOVU1fRVhQQU5EKSB7XG4gICAgQ0FDSEVELnB1c2gob3JpZW50YXRpb24oQ0FDSEVELmxlbmd0aCkpXG4gIH1cbiAgdmFyIGFyZ3MgPSBbXVxuICB2YXIgcHJvY0FyZ3MgPSBbXCJzbG93XCJdXG4gIGZvcih2YXIgaT0wOyBpPD1OVU1fRVhQQU5EOyArK2kpIHtcbiAgICBhcmdzLnB1c2goXCJhXCIgKyBpKVxuICAgIHByb2NBcmdzLnB1c2goXCJvXCIgKyBpKVxuICB9XG4gIHZhciBjb2RlID0gW1xuICAgIFwiZnVuY3Rpb24gZ2V0T3JpZW50YXRpb24oXCIsIGFyZ3Muam9pbigpLCBcIil7c3dpdGNoKGFyZ3VtZW50cy5sZW5ndGgpe2Nhc2UgMDpjYXNlIDE6cmV0dXJuIDA7XCJcbiAgXVxuICBmb3IodmFyIGk9MjsgaTw9TlVNX0VYUEFORDsgKytpKSB7XG4gICAgY29kZS5wdXNoKFwiY2FzZSBcIiwgaSwgXCI6cmV0dXJuIG9cIiwgaSwgXCIoXCIsIGFyZ3Muc2xpY2UoMCwgaSkuam9pbigpLCBcIik7XCIpXG4gIH1cbiAgY29kZS5wdXNoKFwifXZhciBzPW5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKTtmb3IodmFyIGk9MDtpPGFyZ3VtZW50cy5sZW5ndGg7KytpKXtzW2ldPWFyZ3VtZW50c1tpXX07cmV0dXJuIHNsb3cocyk7fXJldHVybiBnZXRPcmllbnRhdGlvblwiKVxuICBwcm9jQXJncy5wdXNoKGNvZGUuam9pbihcIlwiKSlcblxuICB2YXIgcHJvYyA9IEZ1bmN0aW9uLmFwcGx5KHVuZGVmaW5lZCwgcHJvY0FyZ3MpXG4gIG1vZHVsZS5leHBvcnRzID0gcHJvYy5hcHBseSh1bmRlZmluZWQsIFtzbG93T3JpZW50XS5jb25jYXQoQ0FDSEVEKSlcbiAgZm9yKHZhciBpPTA7IGk8PU5VTV9FWFBBTkQ7ICsraSkge1xuICAgIG1vZHVsZS5leHBvcnRzW2ldID0gQ0FDSEVEW2ldXG4gIH1cbn1cblxuZ2VuZXJhdGVPcmllbnRhdGlvblByb2MoKSIsIlwidXNlIHN0cmljdFwiXG5cbnZhciB0d29Qcm9kdWN0ID0gcmVxdWlyZShcInR3by1wcm9kdWN0XCIpXG52YXIgdHdvU3VtID0gcmVxdWlyZShcInR3by1zdW1cIilcblxubW9kdWxlLmV4cG9ydHMgPSBzY2FsZUxpbmVhckV4cGFuc2lvblxuXG5mdW5jdGlvbiBzY2FsZUxpbmVhckV4cGFuc2lvbihlLCBzY2FsZSkge1xuICB2YXIgbiA9IGUubGVuZ3RoXG4gIGlmKG4gPT09IDEpIHtcbiAgICB2YXIgdHMgPSB0d29Qcm9kdWN0KGVbMF0sIHNjYWxlKVxuICAgIGlmKHRzWzBdKSB7XG4gICAgICByZXR1cm4gdHNcbiAgICB9XG4gICAgcmV0dXJuIFsgdHNbMV0gXVxuICB9XG4gIHZhciBnID0gbmV3IEFycmF5KDIgKiBuKVxuICB2YXIgcSA9IFswLjEsIDAuMV1cbiAgdmFyIHQgPSBbMC4xLCAwLjFdXG4gIHZhciBjb3VudCA9IDBcbiAgdHdvUHJvZHVjdChlWzBdLCBzY2FsZSwgcSlcbiAgaWYocVswXSkge1xuICAgIGdbY291bnQrK10gPSBxWzBdXG4gIH1cbiAgZm9yKHZhciBpPTE7IGk8bjsgKytpKSB7XG4gICAgdHdvUHJvZHVjdChlW2ldLCBzY2FsZSwgdClcbiAgICB2YXIgcHEgPSBxWzFdXG4gICAgdHdvU3VtKHBxLCB0WzBdLCBxKVxuICAgIGlmKHFbMF0pIHtcbiAgICAgIGdbY291bnQrK10gPSBxWzBdXG4gICAgfVxuICAgIHZhciBhID0gdFsxXVxuICAgIHZhciBiID0gcVsxXVxuICAgIHZhciB4ID0gYSArIGJcbiAgICB2YXIgYnYgPSB4IC0gYVxuICAgIHZhciB5ID0gYiAtIGJ2XG4gICAgcVsxXSA9IHhcbiAgICBpZih5KSB7XG4gICAgICBnW2NvdW50KytdID0geVxuICAgIH1cbiAgfVxuICBpZihxWzFdKSB7XG4gICAgZ1tjb3VudCsrXSA9IHFbMV1cbiAgfVxuICBpZihjb3VudCA9PT0gMCkge1xuICAgIGdbY291bnQrK10gPSAwLjBcbiAgfVxuICBnLmxlbmd0aCA9IGNvdW50XG4gIHJldHVybiBnXG59IiwiXCJ1c2Ugc3RyaWN0XCJcblxubW9kdWxlLmV4cG9ydHMgPSByb2J1c3RTdWJ0cmFjdFxuXG4vL0Vhc3kgY2FzZTogQWRkIHR3byBzY2FsYXJzXG5mdW5jdGlvbiBzY2FsYXJTY2FsYXIoYSwgYikge1xuICB2YXIgeCA9IGEgKyBiXG4gIHZhciBidiA9IHggLSBhXG4gIHZhciBhdiA9IHggLSBidlxuICB2YXIgYnIgPSBiIC0gYnZcbiAgdmFyIGFyID0gYSAtIGF2XG4gIHZhciB5ID0gYXIgKyBiclxuICBpZih5KSB7XG4gICAgcmV0dXJuIFt5LCB4XVxuICB9XG4gIHJldHVybiBbeF1cbn1cblxuZnVuY3Rpb24gcm9idXN0U3VidHJhY3QoZSwgZikge1xuICB2YXIgbmUgPSBlLmxlbmd0aHwwXG4gIHZhciBuZiA9IGYubGVuZ3RofDBcbiAgaWYobmUgPT09IDEgJiYgbmYgPT09IDEpIHtcbiAgICByZXR1cm4gc2NhbGFyU2NhbGFyKGVbMF0sIC1mWzBdKVxuICB9XG4gIHZhciBuID0gbmUgKyBuZlxuICB2YXIgZyA9IG5ldyBBcnJheShuKVxuICB2YXIgY291bnQgPSAwXG4gIHZhciBlcHRyID0gMFxuICB2YXIgZnB0ciA9IDBcbiAgdmFyIGFicyA9IE1hdGguYWJzXG4gIHZhciBlaSA9IGVbZXB0cl1cbiAgdmFyIGVhID0gYWJzKGVpKVxuICB2YXIgZmkgPSAtZltmcHRyXVxuICB2YXIgZmEgPSBhYnMoZmkpXG4gIHZhciBhLCBiXG4gIGlmKGVhIDwgZmEpIHtcbiAgICBiID0gZWlcbiAgICBlcHRyICs9IDFcbiAgICBpZihlcHRyIDwgbmUpIHtcbiAgICAgIGVpID0gZVtlcHRyXVxuICAgICAgZWEgPSBhYnMoZWkpXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGIgPSBmaVxuICAgIGZwdHIgKz0gMVxuICAgIGlmKGZwdHIgPCBuZikge1xuICAgICAgZmkgPSAtZltmcHRyXVxuICAgICAgZmEgPSBhYnMoZmkpXG4gICAgfVxuICB9XG4gIGlmKChlcHRyIDwgbmUgJiYgZWEgPCBmYSkgfHwgKGZwdHIgPj0gbmYpKSB7XG4gICAgYSA9IGVpXG4gICAgZXB0ciArPSAxXG4gICAgaWYoZXB0ciA8IG5lKSB7XG4gICAgICBlaSA9IGVbZXB0cl1cbiAgICAgIGVhID0gYWJzKGVpKVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBhID0gZmlcbiAgICBmcHRyICs9IDFcbiAgICBpZihmcHRyIDwgbmYpIHtcbiAgICAgIGZpID0gLWZbZnB0cl1cbiAgICAgIGZhID0gYWJzKGZpKVxuICAgIH1cbiAgfVxuICB2YXIgeCA9IGEgKyBiXG4gIHZhciBidiA9IHggLSBhXG4gIHZhciB5ID0gYiAtIGJ2XG4gIHZhciBxMCA9IHlcbiAgdmFyIHExID0geFxuICB2YXIgX3gsIF9idiwgX2F2LCBfYnIsIF9hclxuICB3aGlsZShlcHRyIDwgbmUgJiYgZnB0ciA8IG5mKSB7XG4gICAgaWYoZWEgPCBmYSkge1xuICAgICAgYSA9IGVpXG4gICAgICBlcHRyICs9IDFcbiAgICAgIGlmKGVwdHIgPCBuZSkge1xuICAgICAgICBlaSA9IGVbZXB0cl1cbiAgICAgICAgZWEgPSBhYnMoZWkpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGEgPSBmaVxuICAgICAgZnB0ciArPSAxXG4gICAgICBpZihmcHRyIDwgbmYpIHtcbiAgICAgICAgZmkgPSAtZltmcHRyXVxuICAgICAgICBmYSA9IGFicyhmaSlcbiAgICAgIH1cbiAgICB9XG4gICAgYiA9IHEwXG4gICAgeCA9IGEgKyBiXG4gICAgYnYgPSB4IC0gYVxuICAgIHkgPSBiIC0gYnZcbiAgICBpZih5KSB7XG4gICAgICBnW2NvdW50KytdID0geVxuICAgIH1cbiAgICBfeCA9IHExICsgeFxuICAgIF9idiA9IF94IC0gcTFcbiAgICBfYXYgPSBfeCAtIF9idlxuICAgIF9iciA9IHggLSBfYnZcbiAgICBfYXIgPSBxMSAtIF9hdlxuICAgIHEwID0gX2FyICsgX2JyXG4gICAgcTEgPSBfeFxuICB9XG4gIHdoaWxlKGVwdHIgPCBuZSkge1xuICAgIGEgPSBlaVxuICAgIGIgPSBxMFxuICAgIHggPSBhICsgYlxuICAgIGJ2ID0geCAtIGFcbiAgICB5ID0gYiAtIGJ2XG4gICAgaWYoeSkge1xuICAgICAgZ1tjb3VudCsrXSA9IHlcbiAgICB9XG4gICAgX3ggPSBxMSArIHhcbiAgICBfYnYgPSBfeCAtIHExXG4gICAgX2F2ID0gX3ggLSBfYnZcbiAgICBfYnIgPSB4IC0gX2J2XG4gICAgX2FyID0gcTEgLSBfYXZcbiAgICBxMCA9IF9hciArIF9iclxuICAgIHExID0gX3hcbiAgICBlcHRyICs9IDFcbiAgICBpZihlcHRyIDwgbmUpIHtcbiAgICAgIGVpID0gZVtlcHRyXVxuICAgIH1cbiAgfVxuICB3aGlsZShmcHRyIDwgbmYpIHtcbiAgICBhID0gZmlcbiAgICBiID0gcTBcbiAgICB4ID0gYSArIGJcbiAgICBidiA9IHggLSBhXG4gICAgeSA9IGIgLSBidlxuICAgIGlmKHkpIHtcbiAgICAgIGdbY291bnQrK10gPSB5XG4gICAgfSBcbiAgICBfeCA9IHExICsgeFxuICAgIF9idiA9IF94IC0gcTFcbiAgICBfYXYgPSBfeCAtIF9idlxuICAgIF9iciA9IHggLSBfYnZcbiAgICBfYXIgPSBxMSAtIF9hdlxuICAgIHEwID0gX2FyICsgX2JyXG4gICAgcTEgPSBfeFxuICAgIGZwdHIgKz0gMVxuICAgIGlmKGZwdHIgPCBuZikge1xuICAgICAgZmkgPSAtZltmcHRyXVxuICAgIH1cbiAgfVxuICBpZihxMCkge1xuICAgIGdbY291bnQrK10gPSBxMFxuICB9XG4gIGlmKHExKSB7XG4gICAgZ1tjb3VudCsrXSA9IHExXG4gIH1cbiAgaWYoIWNvdW50KSB7XG4gICAgZ1tjb3VudCsrXSA9IDAuMCAgXG4gIH1cbiAgZy5sZW5ndGggPSBjb3VudFxuICByZXR1cm4gZ1xufSIsIlwidXNlIHN0cmljdFwiXG5cbm1vZHVsZS5leHBvcnRzID0gbGluZWFyRXhwYW5zaW9uU3VtXG5cbi8vRWFzeSBjYXNlOiBBZGQgdHdvIHNjYWxhcnNcbmZ1bmN0aW9uIHNjYWxhclNjYWxhcihhLCBiKSB7XG4gIHZhciB4ID0gYSArIGJcbiAgdmFyIGJ2ID0geCAtIGFcbiAgdmFyIGF2ID0geCAtIGJ2XG4gIHZhciBiciA9IGIgLSBidlxuICB2YXIgYXIgPSBhIC0gYXZcbiAgdmFyIHkgPSBhciArIGJyXG4gIGlmKHkpIHtcbiAgICByZXR1cm4gW3ksIHhdXG4gIH1cbiAgcmV0dXJuIFt4XVxufVxuXG5mdW5jdGlvbiBsaW5lYXJFeHBhbnNpb25TdW0oZSwgZikge1xuICB2YXIgbmUgPSBlLmxlbmd0aHwwXG4gIHZhciBuZiA9IGYubGVuZ3RofDBcbiAgaWYobmUgPT09IDEgJiYgbmYgPT09IDEpIHtcbiAgICByZXR1cm4gc2NhbGFyU2NhbGFyKGVbMF0sIGZbMF0pXG4gIH1cbiAgdmFyIG4gPSBuZSArIG5mXG4gIHZhciBnID0gbmV3IEFycmF5KG4pXG4gIHZhciBjb3VudCA9IDBcbiAgdmFyIGVwdHIgPSAwXG4gIHZhciBmcHRyID0gMFxuICB2YXIgYWJzID0gTWF0aC5hYnNcbiAgdmFyIGVpID0gZVtlcHRyXVxuICB2YXIgZWEgPSBhYnMoZWkpXG4gIHZhciBmaSA9IGZbZnB0cl1cbiAgdmFyIGZhID0gYWJzKGZpKVxuICB2YXIgYSwgYlxuICBpZihlYSA8IGZhKSB7XG4gICAgYiA9IGVpXG4gICAgZXB0ciArPSAxXG4gICAgaWYoZXB0ciA8IG5lKSB7XG4gICAgICBlaSA9IGVbZXB0cl1cbiAgICAgIGVhID0gYWJzKGVpKVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBiID0gZmlcbiAgICBmcHRyICs9IDFcbiAgICBpZihmcHRyIDwgbmYpIHtcbiAgICAgIGZpID0gZltmcHRyXVxuICAgICAgZmEgPSBhYnMoZmkpXG4gICAgfVxuICB9XG4gIGlmKChlcHRyIDwgbmUgJiYgZWEgPCBmYSkgfHwgKGZwdHIgPj0gbmYpKSB7XG4gICAgYSA9IGVpXG4gICAgZXB0ciArPSAxXG4gICAgaWYoZXB0ciA8IG5lKSB7XG4gICAgICBlaSA9IGVbZXB0cl1cbiAgICAgIGVhID0gYWJzKGVpKVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBhID0gZmlcbiAgICBmcHRyICs9IDFcbiAgICBpZihmcHRyIDwgbmYpIHtcbiAgICAgIGZpID0gZltmcHRyXVxuICAgICAgZmEgPSBhYnMoZmkpXG4gICAgfVxuICB9XG4gIHZhciB4ID0gYSArIGJcbiAgdmFyIGJ2ID0geCAtIGFcbiAgdmFyIHkgPSBiIC0gYnZcbiAgdmFyIHEwID0geVxuICB2YXIgcTEgPSB4XG4gIHZhciBfeCwgX2J2LCBfYXYsIF9iciwgX2FyXG4gIHdoaWxlKGVwdHIgPCBuZSAmJiBmcHRyIDwgbmYpIHtcbiAgICBpZihlYSA8IGZhKSB7XG4gICAgICBhID0gZWlcbiAgICAgIGVwdHIgKz0gMVxuICAgICAgaWYoZXB0ciA8IG5lKSB7XG4gICAgICAgIGVpID0gZVtlcHRyXVxuICAgICAgICBlYSA9IGFicyhlaSlcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYSA9IGZpXG4gICAgICBmcHRyICs9IDFcbiAgICAgIGlmKGZwdHIgPCBuZikge1xuICAgICAgICBmaSA9IGZbZnB0cl1cbiAgICAgICAgZmEgPSBhYnMoZmkpXG4gICAgICB9XG4gICAgfVxuICAgIGIgPSBxMFxuICAgIHggPSBhICsgYlxuICAgIGJ2ID0geCAtIGFcbiAgICB5ID0gYiAtIGJ2XG4gICAgaWYoeSkge1xuICAgICAgZ1tjb3VudCsrXSA9IHlcbiAgICB9XG4gICAgX3ggPSBxMSArIHhcbiAgICBfYnYgPSBfeCAtIHExXG4gICAgX2F2ID0gX3ggLSBfYnZcbiAgICBfYnIgPSB4IC0gX2J2XG4gICAgX2FyID0gcTEgLSBfYXZcbiAgICBxMCA9IF9hciArIF9iclxuICAgIHExID0gX3hcbiAgfVxuICB3aGlsZShlcHRyIDwgbmUpIHtcbiAgICBhID0gZWlcbiAgICBiID0gcTBcbiAgICB4ID0gYSArIGJcbiAgICBidiA9IHggLSBhXG4gICAgeSA9IGIgLSBidlxuICAgIGlmKHkpIHtcbiAgICAgIGdbY291bnQrK10gPSB5XG4gICAgfVxuICAgIF94ID0gcTEgKyB4XG4gICAgX2J2ID0gX3ggLSBxMVxuICAgIF9hdiA9IF94IC0gX2J2XG4gICAgX2JyID0geCAtIF9idlxuICAgIF9hciA9IHExIC0gX2F2XG4gICAgcTAgPSBfYXIgKyBfYnJcbiAgICBxMSA9IF94XG4gICAgZXB0ciArPSAxXG4gICAgaWYoZXB0ciA8IG5lKSB7XG4gICAgICBlaSA9IGVbZXB0cl1cbiAgICB9XG4gIH1cbiAgd2hpbGUoZnB0ciA8IG5mKSB7XG4gICAgYSA9IGZpXG4gICAgYiA9IHEwXG4gICAgeCA9IGEgKyBiXG4gICAgYnYgPSB4IC0gYVxuICAgIHkgPSBiIC0gYnZcbiAgICBpZih5KSB7XG4gICAgICBnW2NvdW50KytdID0geVxuICAgIH0gXG4gICAgX3ggPSBxMSArIHhcbiAgICBfYnYgPSBfeCAtIHExXG4gICAgX2F2ID0gX3ggLSBfYnZcbiAgICBfYnIgPSB4IC0gX2J2XG4gICAgX2FyID0gcTEgLSBfYXZcbiAgICBxMCA9IF9hciArIF9iclxuICAgIHExID0gX3hcbiAgICBmcHRyICs9IDFcbiAgICBpZihmcHRyIDwgbmYpIHtcbiAgICAgIGZpID0gZltmcHRyXVxuICAgIH1cbiAgfVxuICBpZihxMCkge1xuICAgIGdbY291bnQrK10gPSBxMFxuICB9XG4gIGlmKHExKSB7XG4gICAgZ1tjb3VudCsrXSA9IHExXG4gIH1cbiAgaWYoIWNvdW50KSB7XG4gICAgZ1tjb3VudCsrXSA9IDAuMCAgXG4gIH1cbiAgZy5sZW5ndGggPSBjb3VudFxuICByZXR1cm4gZ1xufSIsIlwidXNlIHN0cmljdFwiXG5cbm1vZHVsZS5leHBvcnRzID0gdHdvUHJvZHVjdFxuXG52YXIgU1BMSVRURVIgPSArKE1hdGgucG93KDIsIDI3KSArIDEuMClcblxuZnVuY3Rpb24gdHdvUHJvZHVjdChhLCBiLCByZXN1bHQpIHtcbiAgdmFyIHggPSBhICogYlxuXG4gIHZhciBjID0gU1BMSVRURVIgKiBhXG4gIHZhciBhYmlnID0gYyAtIGFcbiAgdmFyIGFoaSA9IGMgLSBhYmlnXG4gIHZhciBhbG8gPSBhIC0gYWhpXG5cbiAgdmFyIGQgPSBTUExJVFRFUiAqIGJcbiAgdmFyIGJiaWcgPSBkIC0gYlxuICB2YXIgYmhpID0gZCAtIGJiaWdcbiAgdmFyIGJsbyA9IGIgLSBiaGlcblxuICB2YXIgZXJyMSA9IHggLSAoYWhpICogYmhpKVxuICB2YXIgZXJyMiA9IGVycjEgLSAoYWxvICogYmhpKVxuICB2YXIgZXJyMyA9IGVycjIgLSAoYWhpICogYmxvKVxuXG4gIHZhciB5ID0gYWxvICogYmxvIC0gZXJyM1xuXG4gIGlmKHJlc3VsdCkge1xuICAgIHJlc3VsdFswXSA9IHlcbiAgICByZXN1bHRbMV0gPSB4XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgcmV0dXJuIFsgeSwgeCBdXG59IiwiXCJ1c2Ugc3RyaWN0XCJcblxubW9kdWxlLmV4cG9ydHMgPSBmYXN0VHdvU3VtXG5cbmZ1bmN0aW9uIGZhc3RUd29TdW0oYSwgYiwgcmVzdWx0KSB7XG5cdHZhciB4ID0gYSArIGJcblx0dmFyIGJ2ID0geCAtIGFcblx0dmFyIGF2ID0geCAtIGJ2XG5cdHZhciBiciA9IGIgLSBidlxuXHR2YXIgYXIgPSBhIC0gYXZcblx0aWYocmVzdWx0KSB7XG5cdFx0cmVzdWx0WzBdID0gYXIgKyBiclxuXHRcdHJlc3VsdFsxXSA9IHhcblx0XHRyZXR1cm4gcmVzdWx0XG5cdH1cblx0cmV0dXJuIFthciticiwgeF1cbn0iXX0=
