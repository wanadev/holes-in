(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.holesIn = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

    /**


    */
    concatTriangulations: function(triangulations) {

        //merge the points arrays and add offset to faces:
        let points = [];
        let triangles = [];
        let offset = 0;
        if (triangulations.length == 1) {
            return triangulations;
        }
        for (let i in triangulations) {
            if (!triangulations[i].points || !triangulations[i].triangles) {
                continue;
            }
            points.push(...triangulations[i].points);
            cdt2dHelper.pushTriangles(triangulations[i].triangles, triangles, offset);
            offset += triangulations[i].points.length;
        }
        return {
            points: points,
            triangles: triangles
        };

    },

    pushTriangles: function(src, dst, offset) {
        dst.push(...src.map(val => val + offset));
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
module.exports = cdt2dHelper;

},{"cdt2d":10}],2:[function(require,module,exports){
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
    /*var pathArrow = new Path2D();
    for (let i = 0; i < path.length - 1; i++) {
        drawHelper.drawArrow(ctx, path[i], path[i + 1]);
    }*
    // drawHelper.drawArrow(ctx, path[path.length - 1], path[0]);

    //Draws the dots:
    for (let i = 0; i < path.length; i++) {
        drawHelper.drawDot(ctx, path[i]);
    }*/
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
}

};
module.exports= drawHelper;

},{"./path-helper.js":7}],3:[function(require,module,exports){
"use-strict";


var exportHelper = {


    meshesToObj(meshes){
        let res="";

        for(let i in meshes){
            res+=exportHelper.meshToObj(meshes.inMesh, "mesh"+i);
            res += "\n";
        }

        /*if(meshes.inMesh)
        {
            res+=exportHelper.meshToObj(meshes.inMesh, "inMesh");
            res += "\n";
        }
        if(meshes.outMesh)
        {
            res+=exportHelper.meshToObj(meshes.outMesh, "outMesh");
            res += "\n";
        }
        if(meshes.frontMesh)
        {
            res+=exportHelper.meshToObj(meshes.frontMesh, "frontMesh");
            res += "\n";
        }
        if(meshes.backMesh)
        {
            res+=exportHelper.meshToObj(meshes.backMesh, "backMesh");
            res += "\n";
        }*/
        return res;
    },

    meshToObj: function(mesh, meshName) {
        let res = "o " + meshName + "\n\n";
        res += exportHelper.verticesToObj(mesh.points);
        res += "\n";
        res += exportHelper.normalsToObj(mesh.normals);
        //    res+="\n";
        //    res+= exportHelper.texturesToObj(mesh.uvs);

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

},{}],4:[function(require,module,exports){
"use strict";

const clipperLib = require("clipper-lib");
const pathHelper = require("./path-helper.js");
const geomHelper = require("./geom-helper.js");
const cdt2dHelper = require("./cdt2d-helper.js");
const uvHelper = require("./uv-helper.js");
const exportHelper = require("./export-helper.js");


var extruder = {

    /**
    * returns a mesh from an outer shape and holes
     */
    getGeometry: function(outerShape, holes,options,optionsUV) {
        //get the topology 2D paths by depth

        let pathsByDepth = extruder.getPathsByDepth(holes, outerShape);
        let topoPathsByDepth = extruder.getTopoPathByDepth(pathsByDepth, outerShape, options);

        extruder.scaleDownHoles(holes);
        extruder.scaleDownTopoByDepth(topoPathsByDepth,outerShape);
        extruder.scaleDownPathsByDepth(pathsByDepth);
        extruder.setDirectionPaths(pathsByDepth,topoPathsByDepth);
        //set all paths to positive:


        let res = {};
        if (options.frontMesh) {
            res.frontMesh = extruder.getInnerHorizontalGeom(topoPathsByDepth, {
                frontMesh: true
            });
            uvHelper.getUVHorFaces(pathsByDepth,outerShape,res.frontMesh);
        }
        if (options.backMesh) {
            res.backMesh = extruder.getInnerHorizontalGeom(topoPathsByDepth, {
                backMesh: true
            });
            uvHelper.getUVHorFaces(pathsByDepth,outerShape,res.backMesh);
        }
        if (options.inMesh) {
            // let inMeshHor;
            let inMeshHor = extruder.getInnerHorizontalGeom(topoPathsByDepth, {
            inMesh: true
            });
            uvHelper.getUVHorFaces(pathsByDepth,outerShape,inMeshHor);

            let offset = 0;
            if (inMeshHor) {
                offset = inMeshHor.offset;
            }

            let inMeshVert = extruder.getInnerVerticalGeom(pathsByDepth,outerShape,optionsUV, +offset);
            res.inMesh = geomHelper.mergeMeshes([inMeshHor, inMeshVert], false);
        }

        if (options.outMesh) {
            uvHelper.getUVOuterShape(pathsByDepth, outerShape);
            res.outMesh = geomHelper.getOuterVerticalGeom(outerShape, outerShape.depth);
        }
        Object.values(res).forEach( elt =>  uvHelper.addUvToGeom({},elt) );
        return res;
    },



    getInnerVerticalGeom: function(pathsByDepth,outerShape,optionsUV,offset = 0) {
        //ensure the paths are all in the same direction
        Object.keys(pathsByDepth).forEach(i => {
            pathHelper.setDirectionPaths(pathsByDepth[i].paths, 1);
        });
        uvHelper.mapVertical(pathsByDepth,outerShape,optionsUV);
        let geom = [];
        for (let indexDepth = pathsByDepth.length - 1; indexDepth > 0; indexDepth--) {
            let pathsAtDepth = pathsByDepth[indexDepth].paths;
            //for each point at each path at each depth we look for the corresponding point into the upper paths:
            for (let path of pathsAtDepth) {
                for (let indexPtDwn in path) {
                    let idxPtDwn = indexPtDwn;
                    let idxNPtDwn =((+indexPtDwn) + 1) % path.length;
                    let currgeom = geomHelper.getOneInnerVerticalGeom(idxPtDwn, idxNPtDwn, +indexDepth,path, pathsByDepth, +offset);
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
     * Returns the geometry of the inner horizontal facess
     */
    getInnerHorizontalGeom: function(topoPathsByDepth, options, offset = 0) {
        //gets all the triangles by depth:
        let trianglesByDepth = [];
        let innerHorGeom= [];
        for (let i in topoPathsByDepth) {
            let totaltopo = topoPathsByDepth[i].pos.concat(topoPathsByDepth[i].neg);
            trianglesByDepth.push(cdt2dHelper.computeTriangulation(totaltopo));
            trianglesByDepth[i].depth = topoPathsByDepth[i].depth;

        }
        // get points, normal and faces from it:
        let horizontalGeomByDepth= geomHelper.getInnerHorizontalGeom(trianglesByDepth, options, +offset);
        return  geomHelper.mergeMeshes(horizontalGeomByDepth, false);
    },


    /**
     * Returns the paths sorted by sens. Negativess paths are holes.
     * Positives paths are the end of holes( solids)
     * For convinience, all paths are set to positive
     */
    getTopoPathByDepth: function(pathsByDepth, outerShape, options) {
        // let paths = pathsByDepth.paths;
        let topoByDepth = [];
        pathHelper.setDirectionPath(outerShape.path, 1);

        topoByDepth.push({
            pos: [outerShape.path],
            neg: pathsByDepth[0].paths,
            depth: 0
        });

        for (let i = 1; i < pathsByDepth.length - 1; i++) {
            let xor = pathHelper.getXorOfPaths(pathsByDepth[i].paths, pathsByDepth[i + 1].paths);
            let posxor = xor.filter(pathHelper.isPositivePath);
            let negxor = xor.filter(pathHelper.isNegativePath);
            pathHelper.setDirectionPaths(negxor, 1);
            topoByDepth.push({
                pos: posxor,
                neg: negxor,
                depth: pathsByDepth[i].depth
            });
        }

        pathHelper.setDirectionPaths(pathsByDepth[pathsByDepth.length - 1], 1);
        topoByDepth.push({
            pos: [outerShape.path],
            neg: pathsByDepth[pathsByDepth.length - 1].paths,
            depth: pathsByDepth[pathsByDepth.length - 1].depth
        });
        return topoByDepth;
    },

    scaleUpHoles: function(holes){
      for(let i in holes){
            pathHelper.scaleUpPath(holes[i].path);
      }
   },

   scaleDownHoles:function(holes){
       for(let i in holes){
             pathHelper.scaleDownPath(holes[i].path);
       }
   },
   scaleDownPathsByDepth:function(pathsByDepth){
       for(let i in pathsByDepth){
             pathHelper.scaleDownPaths(pathsByDepth[i].paths);
       }
   },

   scaleDownTopoByDepth:function(topoByDepth,outerShape){
       pathHelper.scaleDownPath(outerShape.path)
       for(let i=1 ;i<  topoByDepth.length-1;i++){
             pathHelper.scaleDownPaths(topoByDepth[i].pos);
             pathHelper.scaleDownPaths(topoByDepth[i].neg);
       }
   },
   setDirectionPaths: function(pathsByDepth,topoPathsByDepth){
       for(let i in pathsByDepth)
       {
           pathHelper.setDirectionPaths(pathsByDepth[i].paths,1);
       }
        for(let i in topoPathsByDepth){
            pathHelper.setDirectionPaths(topoPathsByDepth[i].pos,1);
            pathHelper.setDirectionPaths(topoPathsByDepth[i].neg,1);

        }
   },

    /**
     *  Takes an array of paths representing holes at different depths.
     *  One depth value/ path.
     *  returns an array of paths at each depth: simplify the geometry for each stage.
     */
    getPathsByDepth: function(holes, outerPath) {
        //gets all paths into the bounds of outerPath:
        // pathHelper.fitPathsIntoPath(outerPath.path, holes.map( h=>return h.path));
        /*for(let i in holes){
            if(pathHelper.getXorOfPaths([holes[i].path],[outerPath.path])[0])
            {
            holes[i].path=pathHelper.getInterOfPaths([holes[i].path],[outerPath.path])[0];
            }
        }*/

        //scales up all holes to prevent from int imprecision
        pathHelper.scaleUpPath(outerPath.path);

        //sets all depths deeper than outerDepth  or equals to 0 to outerDepth:
        holes.map(function(elt) {
            (elt.depth > outerPath.depth || elt.depth === 0) ? elt.depth = outerPath.depth: elt.depth = elt.depth
        });

        extruder.scaleUpHoles(holes);
        holes.map(function(elt){ pathHelper.setDirectionPath(elt.path,1);});

        //get all depths:
        let depths = new Set();
        for (let i in holes) {
            depths.add(holes[i].depth);
        }
        depths.add(0);
        depths.add(outerPath.depth);
        depths = Array.from(depths);
        depths.sort(
            function(a, b) {
                return a - b;
            });

        //get paths by depth:
        let res=[];
        for (let i in depths) {
            let pathAtDepth = holes.filter((s) => s.depth >= depths[i]);
            pathAtDepth = pathHelper.simplifyPaths(pathAtDepth.map((s) => s.path));
            //take only the paths of the holes which reach this depth
            res.push({
                paths: pathAtDepth,
                depth: depths[i]
            });
        }
        return res;
    },
};

module.exports = extruder;

},{"./cdt2d-helper.js":1,"./export-helper.js":3,"./geom-helper.js":5,"./path-helper.js":7,"./uv-helper.js":8,"clipper-lib":15}],5:[function(require,module,exports){
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
        let indexPtUp=0;
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
                indexPtUp= match1.index;
                depthUp = pathsByDepth[i].depth;
                depthDwn = pathsByDepth[indexDepth].depth;
                pathUp[match1.index].visited = true;
                pathUpRes=pathUp;
            }
        }
        return {
            depthUp: depthUp,
            pathUp:pathUpRes,
            depthDwn: depthDwn,
            indexPtUp: indexPtUp,
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

},{"./cdt2d-helper.js":1,"./path-helper.js":7}],6:[function(require,module,exports){
"use strict";



const extruder = require("./extruder.js");
const geomHelper = require("./geom-helper.js");
const exportHelper= require("./export-helper.js");
const drawHelper= require("./draw-helper.js");
const pathHelper= require("./path-helper.js");



var zepathlib = {

    getPathsByDepth: extruder.getPathsByDepth,
    getTopoPathByDepth: extruder.getTopoPathByDepth,
    drawPaths: drawHelper.drawPaths,
    drawPath: drawHelper.drawPath,
    drawTriangles: drawHelper.drawTriangles,
    getXorOfPaths: pathHelper.getXorOfPaths,
    getInterOfPaths: pathHelper.getInterOfPaths,
    getDiffOfPaths: pathHelper.getDiffOfPaths,
    getUnionOfPaths: pathHelper.getUnionOfPaths,
    getInterOfPaths: pathHelper.getInterOfPaths,

    meshesToObj: exportHelper.meshesToObj,
    meshToObj: exportHelper.meshToObj,

    getGeometry: extruder.getGeometry,
    mergeMeshes: geomHelper.mergeMeshes

};

module.exports = zepathlib;

},{"./draw-helper.js":2,"./export-helper.js":3,"./extruder.js":4,"./geom-helper.js":5,"./path-helper.js":7}],7:[function(require,module,exports){
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

    getPathBoundary: function(path) {
        let minX = path[0].X;
        let minY = path[0].Y;
        let maxX = path[0].X;
        let maxY = path[0].Y;
        for (let i = 1; i < path.length; i++) {
            minX = Math.min(minX, path[i].X);
            maxX = Math.max(maxX, path[i].X);
            minY = Math.min(minY, path[i].Y);
            maxY = Math.max(maxY, path[i].Y);
        }
        return {
            X: {
                min: minX,
                max: maxX
            },
            Y: {
                min: minY,
                max: maxY
            }
        };
    },

    getPathsIncluded: function(pathsOut, pathsIn) {

        for (let pathIn of pathsIn) {
            for (let i in pathOut) {
                if (!pathHelper.isIncluded(pathsOut[i], pathIn)) {
                    continue;
                }

            }
        }

    },

    getMatchingEdgeIndex: function(path, pathToMatch) {
        let prevAligned=false;
        let res={};
        for (let i = path.length-1; i >=0 ; i--) {
            for (let j = pathToMatch.length-1; j >=0 ; j--) {

                let p1 = pathToMatch[j];
                let p2 = pathToMatch[(j + 1) % pathToMatch.length];
                let currAlgigned= pathHelper.isAligned(path[i],path[(i+1)%path.length],p1,p2);
                if(!currAlgigned&&prevAligned)
                {
                    return res;
                }
                if(currAlgigned)
                {
                    res= {index: i, pointmatch:p1 };
                    prevAligned=currAlgigned;
                    break;
                }

            }
        }

    },

    isAligned:function(e11,e12,e21,e22){
        let edge1= pathHelper.getEdge(e11,e12);
        let edge2= pathHelper.getEdge(e11,e21);
        let edge3= pathHelper.getEdge(e11,e22);
        return pathHelper.isColinear(edge1,edge2)&& pathHelper.isColinear(edge1,edge3);
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

    isIncluded: function(pathOut, pathsIn) {
        let union = pathHelper.getUnionOfPaths([pathOut], pathsIn);
        if (union.length > 1) return false;
        return pathHelper.isPathEqual(union[0], pathOut);
    },

    /**
     * returns the index of the point in path matching with point
     *
     */
    getPointMatch: function(path, point, offsetPath = 0) {
        for (let i = offsetPath; i < path.length; i++) {
            if (pathHelper.isEqual(path[i], point)) {
                return {
                    index: i
                };
            }
        }
    },

    fitPathsIntoPath: function(outerPath, toFitPaths) {

        let paths = toFitPaths.push(outerPath);
        let union = pathHelper.getUnionOfPaths(paths);
        let inter = pathHelper.getInterOfPaths(paths);
        let xor = pathHelper.getXorOfPaths(union, inter);

        return pathHelper.getDiffOfPaths(paths, xor);

    },

    getTopLeftIndex: function(path) {
        let minIndex = 0;
        let min = pathHelper.getNormPoint(path[0]);
        for (let i = 1; i < path.length; i++) {
            let norm = pathHelper.getNormPoint(path[i]);
            if (norm < min) {
                minIndex = i;
                min = norm;
            }
        }
        return +minIndex;
    },

    getNormPoint: function(point) {
        return Math.sqrt(point.X * point.X + point.Y * point.Y);
    },
    getDistance: function(point1, point2) {
        let edge = pathHelper.getEdge(point1, point2);
        return pathHelper.getNormPoint(edge);
    },

    getTotalLength: function(path) {
        let res = 0;
        if(!path){return 0;}
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

    isPathEqual: function(path1, path2) {
        if (path1.length !== path2.length) {
            return false;
        }
        for (let i = 0; i < path1.length; i++) {
            if (!isEqual(path1[i], path2[i])) {
                return false;
            }
        }
        return true;
    }


};
module.exports = pathHelper;

},{"clipper-lib":15}],8:[function(require,module,exports){
"use strict";

const pathHelper = require("./path-helper.js");


var uvHelper = {

    /*************************************
        First paradygm: map on vertival and horizontal independantly.
        Don't care about discontinuities between vertical and horizontal.
    ***************************************/

    getUVHorFaces: function(pathsByDepth,outerShape, horizontalGeom) {
        let points = horizontalGeom.points;
        let boundaries= uvHelper.getBoundaries(pathsByDepth,outerShape);

        let uv = uvHelper.mapHorizontal(pathsByDepth,outerShape,boundaries, points);
        uvHelper.addUvToGeom(uv, horizontalGeom);
    },



    mapHorizontal: function(pathsByDepth,outerShape,boundaries, points) {
        let res = [];
        for (let i = 0; i < points.length; i += 3) {
            let point = points.slice(i, i + 3);
            res.push(...uvHelper.getUVFromHorrPoint(boundaries, point));
        }
        return res;
    },

    mapVertical: function(pathsByDepth,outerShape,options) {

        //determine the interpolation function:
        let boundaries= uvHelper.getBoundaries(pathsByDepth, outerShape,options)
        //for each depth: constructs the uvs:

        for (let depth in pathsByDepth) {
            let pathsAtDepth = pathsByDepth[depth];
            for (let i in pathsAtDepth.paths) {
                uvHelper.getUvsVertPath(i, pathsByDepth, +depth, boundaries);
            }
        }

    },

    getBoundaries: function(pathsByDepth,outerShape)
    {
        let boundary;
        let boundaryTex;
        if(!options.ratio)
        {
            let maxLength = uvHelper.getMaxPathLength(pathsByDepth);
            maxLength= Math.max(pathHelper.getTotalLength(outerShape.path));
            let maxDepth= outerShape.depth;
            let max= Math.max(maxLength,maxDepth);
            boundary= {XY:{min:0, max:max} ,Z:{min:0,max:max}};
            boundaryTex= {U:{min:0, max:1} ,V:{min:0,max:1}};
        }
        else {

        }
        return {boundary:boundary,boundaryTex:boundaryTex};
    },


    getUVOuterShape:function(pathsByDepth,outerShape,options)
    {
        let boundaries= uvHelper.getBoundaries(pathsByDepth, outerShape,options);
        let path = outerShape.path;
        let pathCopy=JSON.parse(JSON.stringify(path));
        let offset = {index:0,distance:0,u:0};

        uvHelper.interpolatePath(path, boundaries,offset,0);
        uvHelper.interpolatePath(pathCopy, boundaries,offset,outerShape.depth);
        for(let i in path)
        {
            path[i].VDown= pathCopy[i].UV[1];
        }
    },

    getUvsVertPath: function(indPath, pathsByDepth, indexDepth,boundaries) {
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
        uvHelper.interpolatePath(path,boundaries,offset,pathsAtDepth.depth);
    },

    interpolatePath:function(path, boundaries,offset,depth )
    {
        let dist=0;
        let startIndex= offset.index;
        for (let i = startIndex; i < path.length+startIndex; i++) {
            let valueU= (dist+offset.distance);
            let valueV=depth ;
            // uvHelper.addUVToPt(path[i%path.length], valueU,valueV, boundary,boundaryTex);
            let u= uvHelper.interpolate(boundaries.boundary.XY, boundaries.boundaryTex.U,valueU);
            let v= uvHelper.interpolate(boundaries.boundary.Z, boundaries.boundaryTex.V,valueV);
            path[i%path.length].UV=[u,v];
            dist = dist + pathHelper.getDistance(path[i%path.length], path[(i + 1) % path.length]);
        }
        let valueU= (dist+offset.distance);
        let valueV=depth;
        let u= uvHelper.interpolate(boundaries.boundary.XY, boundaries.boundaryTex.U,valueU);
        let v= uvHelper.interpolate(boundaries.boundary.Z, boundaries.boundaryTex.V,valueV);
        path[startIndex].UV2=[u,v];
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
        if (!uvs || uvs.length ===0) {uvs = new Array(2 * geom.points.length / 3).fill(0);}
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

},{"./path-helper.js":7}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{"./lib/delaunay":11,"./lib/filter":12,"./lib/monotone":13,"./lib/triangulation":14}],11:[function(require,module,exports){
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

},{"binary-search-bounds":9,"robust-in-sphere":16}],12:[function(require,module,exports){
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

},{"binary-search-bounds":9}],13:[function(require,module,exports){
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

},{"binary-search-bounds":9,"robust-orientation":17}],14:[function(require,module,exports){
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

},{"binary-search-bounds":9}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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
},{"robust-scale":18,"robust-subtract":19,"robust-sum":20,"two-product":21}],17:[function(require,module,exports){
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
},{"robust-scale":18,"robust-subtract":19,"robust-sum":20,"two-product":21}],18:[function(require,module,exports){
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
},{"two-product":21,"two-sum":22}],19:[function(require,module,exports){
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
},{}],20:[function(require,module,exports){
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
},{}],21:[function(require,module,exports){
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
},{}],22:[function(require,module,exports){
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
},{}]},{},[6])(6)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvY2R0MmQtaGVscGVyLmpzIiwibGliL2RyYXctaGVscGVyLmpzIiwibGliL2V4cG9ydC1oZWxwZXIuanMiLCJsaWIvZXh0cnVkZXIuanMiLCJsaWIvZ2VvbS1oZWxwZXIuanMiLCJsaWIvaW5kZXguanMiLCJsaWIvcGF0aC1oZWxwZXIuanMiLCJsaWIvdXYtaGVscGVyLmpzIiwibm9kZV9tb2R1bGVzL2JpbmFyeS1zZWFyY2gtYm91bmRzL3NlYXJjaC1ib3VuZHMuanMiLCJub2RlX21vZHVsZXMvY2R0MmQvY2R0MmQuanMiLCJub2RlX21vZHVsZXMvY2R0MmQvbGliL2RlbGF1bmF5LmpzIiwibm9kZV9tb2R1bGVzL2NkdDJkL2xpYi9maWx0ZXIuanMiLCJub2RlX21vZHVsZXMvY2R0MmQvbGliL21vbm90b25lLmpzIiwibm9kZV9tb2R1bGVzL2NkdDJkL2xpYi90cmlhbmd1bGF0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2NsaXBwZXItbGliL2NsaXBwZXIuanMiLCJub2RlX21vZHVsZXMvcm9idXN0LWluLXNwaGVyZS9pbi1zcGhlcmUuanMiLCJub2RlX21vZHVsZXMvcm9idXN0LW9yaWVudGF0aW9uL29yaWVudGF0aW9uLmpzIiwibm9kZV9tb2R1bGVzL3JvYnVzdC1zY2FsZS9yb2J1c3Qtc2NhbGUuanMiLCJub2RlX21vZHVsZXMvcm9idXN0LXN1YnRyYWN0L3JvYnVzdC1kaWZmLmpzIiwibm9kZV9tb2R1bGVzL3JvYnVzdC1zdW0vcm9idXN0LXN1bS5qcyIsIm5vZGVfbW9kdWxlcy90d28tcHJvZHVjdC90d28tcHJvZHVjdC5qcyIsIm5vZGVfbW9kdWxlcy90d28tc3VtL3R3by1zdW0uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdHdOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgY2R0MmQgPSByZXF1aXJlKCdjZHQyZCcpO1xuXG52YXIgY2R0MmRIZWxwZXIgPSB7XG5cblxuICAgIGNvbXB1dGVUcmlhbmd1bGF0aW9uOiBmdW5jdGlvbihwb2ludHMsIG9wdGlvbnMpIHtcbiAgICAgICAgLy8gbGV0IHBvaW50cz0geG9yLmNvbmNhdChpbnRlcnNlY3Rpb24pLmNvbmNhdChwYXRoT3V0ZXIpO1xuICAgICAgICBsZXQgY2R0UG9pbnRzID0gY2R0MmRIZWxwZXIuY2xpcHBlclRvY2R0MmQocG9pbnRzKTtcbiAgICAgICAgbGV0IGNkdEVkZ2VzID0gY2R0MmRIZWxwZXIucGF0aHNUb0VkZ2VzKHBvaW50cyk7XG4gICAgICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBleHRlcmlvcjogZmFsc2UsXG4gICAgICAgICAgICAgICAgaW50ZXJpb3I6IHRydWVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRyaWFuZ2xlcyA9IGNkdDJkKGNkdFBvaW50cywgY2R0RWRnZXMsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcG9pbnRzOiBjZHRQb2ludHMsXG4gICAgICAgICAgICB0cmlhbmdsZXM6IHRyaWFuZ2xlc1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvKipcblxuXG4gICAgKi9cbiAgICBjb25jYXRUcmlhbmd1bGF0aW9uczogZnVuY3Rpb24odHJpYW5ndWxhdGlvbnMpIHtcblxuICAgICAgICAvL21lcmdlIHRoZSBwb2ludHMgYXJyYXlzIGFuZCBhZGQgb2Zmc2V0IHRvIGZhY2VzOlxuICAgICAgICBsZXQgcG9pbnRzID0gW107XG4gICAgICAgIGxldCB0cmlhbmdsZXMgPSBbXTtcbiAgICAgICAgbGV0IG9mZnNldCA9IDA7XG4gICAgICAgIGlmICh0cmlhbmd1bGF0aW9ucy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRyaWFuZ3VsYXRpb25zO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgaW4gdHJpYW5ndWxhdGlvbnMpIHtcbiAgICAgICAgICAgIGlmICghdHJpYW5ndWxhdGlvbnNbaV0ucG9pbnRzIHx8ICF0cmlhbmd1bGF0aW9uc1tpXS50cmlhbmdsZXMpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvaW50cy5wdXNoKC4uLnRyaWFuZ3VsYXRpb25zW2ldLnBvaW50cyk7XG4gICAgICAgICAgICBjZHQyZEhlbHBlci5wdXNoVHJpYW5nbGVzKHRyaWFuZ3VsYXRpb25zW2ldLnRyaWFuZ2xlcywgdHJpYW5nbGVzLCBvZmZzZXQpO1xuICAgICAgICAgICAgb2Zmc2V0ICs9IHRyaWFuZ3VsYXRpb25zW2ldLnBvaW50cy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBvaW50czogcG9pbnRzLFxuICAgICAgICAgICAgdHJpYW5nbGVzOiB0cmlhbmdsZXNcbiAgICAgICAgfTtcblxuICAgIH0sXG5cbiAgICBwdXNoVHJpYW5nbGVzOiBmdW5jdGlvbihzcmMsIGRzdCwgb2Zmc2V0KSB7XG4gICAgICAgIGRzdC5wdXNoKC4uLnNyYy5tYXAodmFsID0+IHZhbCArIG9mZnNldCkpO1xuICAgIH0sXG5cbiAgICBwYXRoc1RvRWRnZXM6IGZ1bmN0aW9uKHBhdGhzKSB7XG4gICAgICAgIGxldCByZXMgPSBbXTtcbiAgICAgICAgbGV0IG9mZnNldCA9IDA7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHJlcyA9IHJlcy5jb25jYXQoY2R0MmRIZWxwZXIucGF0aFRvRWRnZXMocGF0aHNbaV0sIG9mZnNldCkpO1xuICAgICAgICAgICAgb2Zmc2V0ICs9IHBhdGhzW2ldLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cbiAgICBwYXRoVG9FZGdlczogZnVuY3Rpb24ocGF0aCwgb2Zmc2V0KSB7XG4gICAgICAgIGxldCByZXMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgcmVzLnB1c2goW29mZnNldCArIGksIG9mZnNldCArIGkgKyAxXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzLnB1c2goW29mZnNldCArIHBhdGgubGVuZ3RoIC0gMSwgb2Zmc2V0XSk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSxcblxuICAgIGNsaXBwZXJUb2NkdDJkOiBmdW5jdGlvbihwb2ludHMpIHtcbiAgICAgICAgbGV0IHJlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpIGluIHBvaW50cykge1xuICAgICAgICAgICAgZm9yIChsZXQgaiBpbiBwb2ludHNbaV0pIHtcbiAgICAgICAgICAgICAgICByZXMucHVzaChjZHQyZEhlbHBlci5jbGlwcGVyUG9pbnRUb2NkdDJkUG9pbnQocG9pbnRzW2ldW2pdKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgY2xpcHBlclBvaW50VG9jZHQyZFBvaW50OiBmdW5jdGlvbihwb2ludCkge1xuICAgICAgICByZXR1cm4gW3BvaW50LlgsIHBvaW50LlldO1xuICAgIH0sXG5cbiAgICBkcmF3VHJpYW5nbGVzOiBmdW5jdGlvbihjdHgsIHBvaW50c0FuZFRyaWFuZ2xlcywgdHJhbnNsYXRpb24pIHtcbiAgICAgICAgZm9yIChsZXQgaSBpbiBwb2ludHNBbmRUcmlhbmdsZXMudHJpYW5nbGVzKSB7XG4gICAgICAgICAgICBjZHQyZEhlbHBlci5kcmF3VHJpYW5nbGUoY3R4LCBwb2ludHNBbmRUcmlhbmdsZXMucG9pbnRzLCBwb2ludHNBbmRUcmlhbmdsZXMudHJpYW5nbGVzW2ldLCB0cmFuc2xhdGlvbik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZHJhd1RyaWFuZ2xlOiBmdW5jdGlvbihjdHgsIHBvaW50cywgdHJpYW5nbGUsIHRyYW5zbGF0aW9uKSB7XG4gICAgICAgIGlmICghdHJhbnNsYXRpb24pIHtcbiAgICAgICAgICAgIHRyYW5zbGF0aW9uID0ge1xuICAgICAgICAgICAgICAgIFg6IDAsXG4gICAgICAgICAgICAgICAgWTogMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIGN0eC5tb3ZlVG8ocG9pbnRzW3RyaWFuZ2xlWzBdXVswXSArIHRyYW5zbGF0aW9uLlgsIHBvaW50c1t0cmlhbmdsZVswXV1bMV0gKyB0cmFuc2xhdGlvbi5ZKTtcbiAgICAgICAgY3R4LmxpbmVUbyhwb2ludHNbdHJpYW5nbGVbMV1dWzBdICsgdHJhbnNsYXRpb24uWCwgcG9pbnRzW3RyaWFuZ2xlWzFdXVsxXSArIHRyYW5zbGF0aW9uLlkpO1xuICAgICAgICBjdHgubGluZVRvKHBvaW50c1t0cmlhbmdsZVsyXV1bMF0gKyB0cmFuc2xhdGlvbi5YLCBwb2ludHNbdHJpYW5nbGVbMl1dWzFdICsgdHJhbnNsYXRpb24uWSk7XG4gICAgICAgIGN0eC5saW5lVG8ocG9pbnRzW3RyaWFuZ2xlWzBdXVswXSArIHRyYW5zbGF0aW9uLlgsIHBvaW50c1t0cmlhbmdsZVswXV1bMV0gKyB0cmFuc2xhdGlvbi5ZKTtcbiAgICAgICAgY3R4LnN0cm9rZSgpO1xuXG4gICAgfVxuXG59O1xubW9kdWxlLmV4cG9ydHMgPSBjZHQyZEhlbHBlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgcGF0aEhlbHBlcj0gcmVxdWlyZShcIi4vcGF0aC1oZWxwZXIuanNcIik7XG5cbnZhciBkcmF3SGVscGVyPXtcblxuZ2V0VG9wVHJpYW5nbGVzQnlEZXB0aDogZnVuY3Rpb24odG9wb1BhdGhzQnlEZXB0aCwgb2Zmc2V0ID0gMCkge1xuICAgIGxldCBnZW9tQnlEZXB0aCA9IFtdO1xuICAgIGZvciAobGV0IGkgaW4gdG9wb1BhdGhzQnlEZXB0aCkge1xuICAgICAgICBsZXQgdG90YWx0b3BvID0gdG9wb1BhdGhzQnlEZXB0aFtpXS5wb3MuY29uY2F0KHRvcG9QYXRoc0J5RGVwdGhbaV0ubmVnKTtcbiAgICAgICAgZ2VvbUJ5RGVwdGgucHVzaChjZHQyZEhlbHBlci5jb21wdXRlVHJpYW5ndWxhdGlvbih0b3RhbHRvcG8pKTtcbiAgICAgICAgZ2VvbUJ5RGVwdGhbaV0uZGVwdGggPSB0b3BvUGF0aHNCeURlcHRoW2ldLmRlcHRoO1xuICAgIH1cbiAgICByZXR1cm4gZ2VvbUJ5RGVwdGg7XG59LFxuXG5kcmF3UGF0aHM6IGZ1bmN0aW9uKGN0eCwgcGF0aHMsIHBvc2l0aW9uLCBmaWxsQ29sb3JzLCBzdHJva2VDb2xvcnMsIGZpbGxNb2Rlcykge1xuICAgIGlmICghZmlsbE1vZGVzKSBmaWxsTW9kZXMgPSBbXTtcbiAgICBmb3IgKGxldCBpIGluIHBhdGhzKSB7XG4gICAgICAgIGRyYXdIZWxwZXIuZHJhd1BhdGgoY3R4LCBwYXRoc1tpXSwgcG9zaXRpb24sIGZpbGxDb2xvcnNbaV0sIHN0cm9rZUNvbG9yc1tpXSwgZmlsbE1vZGVzW2ldKTtcbiAgICB9XG59LFxuXG5kcmF3UGF0aDogZnVuY3Rpb24oY3R4LCBwYXRoVG9EcmF3LCBwb3NpdGlvbiwgZmlsbENvbG9yLCBzdHJva2VDb2xvciwgZmlsbE1vZGUpIHtcbiAgICBpZiAoIXBvc2l0aW9uKSBwb3NpdGlvbiA9IHtcbiAgICAgICAgWDogMCxcbiAgICAgICAgWTogMFxuICAgIH07XG4gICAgbGV0IHBhdGggPSBbXTtcbiAgICBpZiAocGF0aFRvRHJhdy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICBmb3IgKGxldCBpIGluIHBhdGhUb0RyYXcpIHtcbiAgICAgICAgcGF0aC5wdXNoKHtcbiAgICAgICAgICAgIFg6IHBhdGhUb0RyYXdbaV0uWCArIHBvc2l0aW9uLlgsXG4gICAgICAgICAgICBZOiBwYXRoVG9EcmF3W2ldLlkgKyBwb3NpdGlvbi5ZXG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgY3R4LmxpbmVXaWR0aCA9IDI7XG4gICAgaWYgKCFmaWxsQ29sb3IpIHtcbiAgICAgICAgZmlsbENvbG9yID0gJ2JsYWNrJztcbiAgICB9XG4gICAgY3R4LmZpbGxTdHlsZSA9IGZpbGxDb2xvcjtcbiAgICBpZiAoIXN0cm9rZUNvbG9yKSB7XG4gICAgICAgIHN0cm9rZUNvbG9yID0gXCJibGFja1wiO1xuICAgIH1cbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBzdHJva2VDb2xvcjtcbiAgICBpZiAoIWZpbGxNb2RlKSB7XG4gICAgICAgIGZpbGxNb2RlID0gXCJub256ZXJvXCI7XG4gICAgfVxuICAgIGN0eC5tb3pGaWxsUnVsZSA9IGZpbGxNb2RlO1xuXG4gICAgLy9EcmF3cyB0aGUgaW5uZXIgb2YgdGhlIHBhdGhcbiAgICB2YXIgcGF0aEZpbGwgPSBuZXcgUGF0aDJEKCk7XG4gICAgcGF0aEZpbGwubW92ZVRvKHBhdGhbMF0uWCwgcGF0aFswXS5ZKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcGF0aEZpbGwubGluZVRvKHBhdGhbaV0uWCwgcGF0aFtpXS5ZKTtcbiAgICB9XG4gICAgcGF0aEZpbGwubGluZVRvKHBhdGhbMF0uWCwgcGF0aFswXS5ZKTtcbiAgICBjdHguZmlsbChwYXRoRmlsbCwgZmlsbE1vZGUpO1xuICAgIGN0eC5jbG9zZVBhdGgoKTtcbiAgICAvL0RyYXdzIHRoZSBhcnJvd3NcbiAgICAvKnZhciBwYXRoQXJyb3cgPSBuZXcgUGF0aDJEKCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICBkcmF3SGVscGVyLmRyYXdBcnJvdyhjdHgsIHBhdGhbaV0sIHBhdGhbaSArIDFdKTtcbiAgICB9KlxuICAgIC8vIGRyYXdIZWxwZXIuZHJhd0Fycm93KGN0eCwgcGF0aFtwYXRoLmxlbmd0aCAtIDFdLCBwYXRoWzBdKTtcblxuICAgIC8vRHJhd3MgdGhlIGRvdHM6XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGRyYXdIZWxwZXIuZHJhd0RvdChjdHgsIHBhdGhbaV0pO1xuICAgIH0qL1xufSxcbmRyYXdBcnJvdyhjdHgsIGJlZ2luLCBlbmQpIHtcblxuICAgIGN0eC5zYXZlKCk7XG4gICAgY3R4Lm1vdmVUbyhiZWdpbi5YLCBiZWdpbi5ZKTtcbiAgICBjdHgubGluZVRvKGVuZC5YLCBlbmQuWSk7XG4gICAgY3R4LnN0cm9rZSgpO1xuXG4gICAgbGV0IHZlY3QgPSB7XG4gICAgICAgIFg6IGVuZC5YIC0gYmVnaW4uWCxcbiAgICAgICAgWTogZW5kLlkgLSBiZWdpbi5ZXG4gICAgfTtcbiAgICBsZXQgbm9ybSA9IE1hdGguc3FydCh2ZWN0LlggKiB2ZWN0LlggKyB2ZWN0LlkgKiB2ZWN0LlkpO1xuICAgIHZlY3QgPSB7XG4gICAgICAgIFg6IHZlY3QuWCAvIG5vcm0sXG4gICAgICAgIFk6IHZlY3QuWSAvIG5vcm1cbiAgICB9O1xuXG4gICAgbGV0IGFuZ2xlID0gTWF0aC5QSSAvIDIgKyBNYXRoLmF0YW4yKHZlY3QuWSwgdmVjdC5YKTtcblxuICAgIGN0eC50cmFuc2xhdGUoYmVnaW4uWCArIHZlY3QuWCAqIG5vcm0gKiAwLjc1LCBiZWdpbi5ZICsgdmVjdC5ZICogbm9ybSAqIDAuNzUpO1xuICAgIGN0eC5yb3RhdGUoYW5nbGUpO1xuXG4gICAgbGV0IHNpemVBID0gNTtcbiAgICBsZXQgYnJhbmNoMSA9IHtcbiAgICAgICAgWDogc2l6ZUEsXG4gICAgICAgIFk6IHNpemVBXG4gICAgfTtcbiAgICBsZXQgYnJhbmNoMiA9IHtcbiAgICAgICAgWDogLXNpemVBLFxuICAgICAgICBZOiBzaXplQVxuICAgIH07XG5cbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4Lm1vdmVUbyhicmFuY2gxLlgsIGJyYW5jaDEuWSk7XG4gICAgY3R4LmxpbmVUbygwLCAwKTtcbiAgICBjdHgubGluZVRvKGJyYW5jaDIuWCwgYnJhbmNoMi5ZKTtcbiAgICBjdHguc3Ryb2tlKCk7XG5cbiAgICBjdHgucmVzdG9yZSgpO1xufSxcblxuZHJhd0RvdDogZnVuY3Rpb24oY3R4LCBkb3QpIHtcblxuICAgIGN0eC5maWxsU3R5bGUgPSBcInJlZFwiO1xuICAgIGN0eC5maWxsUmVjdChkb3QuWCwgZG90LlksIDQsIDQpO1xufVxuXG59O1xubW9kdWxlLmV4cG9ydHM9IGRyYXdIZWxwZXI7XG4iLCJcInVzZS1zdHJpY3RcIjtcblxuXG52YXIgZXhwb3J0SGVscGVyID0ge1xuXG5cbiAgICBtZXNoZXNUb09iaihtZXNoZXMpe1xuICAgICAgICBsZXQgcmVzPVwiXCI7XG5cbiAgICAgICAgZm9yKGxldCBpIGluIG1lc2hlcyl7XG4gICAgICAgICAgICByZXMrPWV4cG9ydEhlbHBlci5tZXNoVG9PYmoobWVzaGVzLmluTWVzaCwgXCJtZXNoXCIraSk7XG4gICAgICAgICAgICByZXMgKz0gXCJcXG5cIjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qaWYobWVzaGVzLmluTWVzaClcbiAgICAgICAge1xuICAgICAgICAgICAgcmVzKz1leHBvcnRIZWxwZXIubWVzaFRvT2JqKG1lc2hlcy5pbk1lc2gsIFwiaW5NZXNoXCIpO1xuICAgICAgICAgICAgcmVzICs9IFwiXFxuXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYobWVzaGVzLm91dE1lc2gpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJlcys9ZXhwb3J0SGVscGVyLm1lc2hUb09iaihtZXNoZXMub3V0TWVzaCwgXCJvdXRNZXNoXCIpO1xuICAgICAgICAgICAgcmVzICs9IFwiXFxuXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYobWVzaGVzLmZyb250TWVzaClcbiAgICAgICAge1xuICAgICAgICAgICAgcmVzKz1leHBvcnRIZWxwZXIubWVzaFRvT2JqKG1lc2hlcy5mcm9udE1lc2gsIFwiZnJvbnRNZXNoXCIpO1xuICAgICAgICAgICAgcmVzICs9IFwiXFxuXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYobWVzaGVzLmJhY2tNZXNoKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXMrPWV4cG9ydEhlbHBlci5tZXNoVG9PYmoobWVzaGVzLmJhY2tNZXNoLCBcImJhY2tNZXNoXCIpO1xuICAgICAgICAgICAgcmVzICs9IFwiXFxuXCI7XG4gICAgICAgIH0qL1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cbiAgICBtZXNoVG9PYmo6IGZ1bmN0aW9uKG1lc2gsIG1lc2hOYW1lKSB7XG4gICAgICAgIGxldCByZXMgPSBcIm8gXCIgKyBtZXNoTmFtZSArIFwiXFxuXFxuXCI7XG4gICAgICAgIHJlcyArPSBleHBvcnRIZWxwZXIudmVydGljZXNUb09iaihtZXNoLnBvaW50cyk7XG4gICAgICAgIHJlcyArPSBcIlxcblwiO1xuICAgICAgICByZXMgKz0gZXhwb3J0SGVscGVyLm5vcm1hbHNUb09iaihtZXNoLm5vcm1hbHMpO1xuICAgICAgICAvLyAgICByZXMrPVwiXFxuXCI7XG4gICAgICAgIC8vICAgIHJlcys9IGV4cG9ydEhlbHBlci50ZXh0dXJlc1RvT2JqKG1lc2gudXZzKTtcblxuICAgICAgICByZXMgKz0gXCJcXG5cIjtcbiAgICAgICAgcmVzICs9IGV4cG9ydEhlbHBlci5mYWNlc1RvT2JqKG1lc2guZmFjZXMpO1xuICAgICAgICByZXR1cm4gcmVzO1xuXG4gICAgfSxcbiAgICB2ZXJ0aWNlc1RvT2JqOiBmdW5jdGlvbih2ZXJ0aWNlcykge1xuXG4gICAgICAgIHJldHVybiBleHBvcnRIZWxwZXIuc3RlcFRocmVlQXJyYXlUb09iaih2ZXJ0aWNlcywgXCJ2XCIpO1xuICAgIH0sXG5cbiAgICB0ZXh0dXJlc1RvT2JqOiBmdW5jdGlvbih0ZXh0dXJlcykge1xuICAgICAgICByZXR1cm4gZXhwb3J0SGVscGVyLnN0ZXBUaHJlZUFycmF5VG9PYmoodGV4dHVyZXMsIFwidnRcIik7XG4gICAgfSxcblxuICAgIG5vcm1hbHNUb09iajogZnVuY3Rpb24obm9ybWFscykge1xuICAgICAgICByZXR1cm4gZXhwb3J0SGVscGVyLnN0ZXBUaHJlZUFycmF5VG9PYmoobm9ybWFscywgXCJ2dFwiKTtcbiAgICB9LFxuXG4gICAgZmFjZXNUb09iajogZnVuY3Rpb24oZmFjZXMpIHtcbiAgICAgICAgbGV0IHJlcyA9IFwiXCI7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmFjZXMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgICAgIHJlcyArPSBcImYgXCIgKyBleHBvcnRIZWxwZXIuZmFjZUVsZW1lbnQoZmFjZXNbaV0pICsgXCIgXCIgK1xuICAgICAgICAgICAgICAgIGV4cG9ydEhlbHBlci5mYWNlRWxlbWVudChmYWNlc1tpICsgMV0pICsgXCIgXCIgK1xuICAgICAgICAgICAgICAgIGV4cG9ydEhlbHBlci5mYWNlRWxlbWVudChmYWNlc1tpICsgMl0pICsgXCJcXG5cIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG4gICAgZmFjZUVsZW1lbnQ6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHJldHVybiBcInZcIiArIGluZGV4ICsgXCIvdnRcIiArIGluZGV4ICsgXCIvdm5cIiArIGluZGV4O1xuICAgIH0sXG5cblxuICAgIHN0ZXBUaHJlZUFycmF5VG9PYmo6IGZ1bmN0aW9uKGFycmF5LCBwcmVmaXgpIHtcbiAgICAgICAgbGV0IHJlcyA9IFwiXCI7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgICAgIHJlcyArPSBwcmVmaXggKyBcIiBcIiArIGFycmF5W2ldICsgXCIgXCIgKyBhcnJheVtpICsgMV0gKyBcIiBcIiArIGFycmF5W2kgKyAyXSArIFwiXFxuXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRIZWxwZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgY2xpcHBlckxpYiA9IHJlcXVpcmUoXCJjbGlwcGVyLWxpYlwiKTtcbmNvbnN0IHBhdGhIZWxwZXIgPSByZXF1aXJlKFwiLi9wYXRoLWhlbHBlci5qc1wiKTtcbmNvbnN0IGdlb21IZWxwZXIgPSByZXF1aXJlKFwiLi9nZW9tLWhlbHBlci5qc1wiKTtcbmNvbnN0IGNkdDJkSGVscGVyID0gcmVxdWlyZShcIi4vY2R0MmQtaGVscGVyLmpzXCIpO1xuY29uc3QgdXZIZWxwZXIgPSByZXF1aXJlKFwiLi91di1oZWxwZXIuanNcIik7XG5jb25zdCBleHBvcnRIZWxwZXIgPSByZXF1aXJlKFwiLi9leHBvcnQtaGVscGVyLmpzXCIpO1xuXG5cbnZhciBleHRydWRlciA9IHtcblxuICAgIC8qKlxuICAgICogcmV0dXJucyBhIG1lc2ggZnJvbSBhbiBvdXRlciBzaGFwZSBhbmQgaG9sZXNcbiAgICAgKi9cbiAgICBnZXRHZW9tZXRyeTogZnVuY3Rpb24ob3V0ZXJTaGFwZSwgaG9sZXMsb3B0aW9ucyxvcHRpb25zVVYpIHtcbiAgICAgICAgLy9nZXQgdGhlIHRvcG9sb2d5IDJEIHBhdGhzIGJ5IGRlcHRoXG5cbiAgICAgICAgbGV0IHBhdGhzQnlEZXB0aCA9IGV4dHJ1ZGVyLmdldFBhdGhzQnlEZXB0aChob2xlcywgb3V0ZXJTaGFwZSk7XG4gICAgICAgIGxldCB0b3BvUGF0aHNCeURlcHRoID0gZXh0cnVkZXIuZ2V0VG9wb1BhdGhCeURlcHRoKHBhdGhzQnlEZXB0aCwgb3V0ZXJTaGFwZSwgb3B0aW9ucyk7XG5cbiAgICAgICAgZXh0cnVkZXIuc2NhbGVEb3duSG9sZXMoaG9sZXMpO1xuICAgICAgICBleHRydWRlci5zY2FsZURvd25Ub3BvQnlEZXB0aCh0b3BvUGF0aHNCeURlcHRoLG91dGVyU2hhcGUpO1xuICAgICAgICBleHRydWRlci5zY2FsZURvd25QYXRoc0J5RGVwdGgocGF0aHNCeURlcHRoKTtcbiAgICAgICAgZXh0cnVkZXIuc2V0RGlyZWN0aW9uUGF0aHMocGF0aHNCeURlcHRoLHRvcG9QYXRoc0J5RGVwdGgpO1xuICAgICAgICAvL3NldCBhbGwgcGF0aHMgdG8gcG9zaXRpdmU6XG5cblxuICAgICAgICBsZXQgcmVzID0ge307XG4gICAgICAgIGlmIChvcHRpb25zLmZyb250TWVzaCkge1xuICAgICAgICAgICAgcmVzLmZyb250TWVzaCA9IGV4dHJ1ZGVyLmdldElubmVySG9yaXpvbnRhbEdlb20odG9wb1BhdGhzQnlEZXB0aCwge1xuICAgICAgICAgICAgICAgIGZyb250TWVzaDogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB1dkhlbHBlci5nZXRVVkhvckZhY2VzKHBhdGhzQnlEZXB0aCxvdXRlclNoYXBlLHJlcy5mcm9udE1lc2gpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmJhY2tNZXNoKSB7XG4gICAgICAgICAgICByZXMuYmFja01lc2ggPSBleHRydWRlci5nZXRJbm5lckhvcml6b250YWxHZW9tKHRvcG9QYXRoc0J5RGVwdGgsIHtcbiAgICAgICAgICAgICAgICBiYWNrTWVzaDogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB1dkhlbHBlci5nZXRVVkhvckZhY2VzKHBhdGhzQnlEZXB0aCxvdXRlclNoYXBlLHJlcy5iYWNrTWVzaCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuaW5NZXNoKSB7XG4gICAgICAgICAgICAvLyBsZXQgaW5NZXNoSG9yO1xuICAgICAgICAgICAgbGV0IGluTWVzaEhvciA9IGV4dHJ1ZGVyLmdldElubmVySG9yaXpvbnRhbEdlb20odG9wb1BhdGhzQnlEZXB0aCwge1xuICAgICAgICAgICAgaW5NZXNoOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHV2SGVscGVyLmdldFVWSG9yRmFjZXMocGF0aHNCeURlcHRoLG91dGVyU2hhcGUsaW5NZXNoSG9yKTtcblxuICAgICAgICAgICAgbGV0IG9mZnNldCA9IDA7XG4gICAgICAgICAgICBpZiAoaW5NZXNoSG9yKSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gaW5NZXNoSG9yLm9mZnNldDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGluTWVzaFZlcnQgPSBleHRydWRlci5nZXRJbm5lclZlcnRpY2FsR2VvbShwYXRoc0J5RGVwdGgsb3V0ZXJTaGFwZSxvcHRpb25zVVYsICtvZmZzZXQpO1xuICAgICAgICAgICAgcmVzLmluTWVzaCA9IGdlb21IZWxwZXIubWVyZ2VNZXNoZXMoW2luTWVzaEhvciwgaW5NZXNoVmVydF0sIGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zLm91dE1lc2gpIHtcbiAgICAgICAgICAgIHV2SGVscGVyLmdldFVWT3V0ZXJTaGFwZShwYXRoc0J5RGVwdGgsIG91dGVyU2hhcGUpO1xuICAgICAgICAgICAgcmVzLm91dE1lc2ggPSBnZW9tSGVscGVyLmdldE91dGVyVmVydGljYWxHZW9tKG91dGVyU2hhcGUsIG91dGVyU2hhcGUuZGVwdGgpO1xuICAgICAgICB9XG4gICAgICAgIE9iamVjdC52YWx1ZXMocmVzKS5mb3JFYWNoKCBlbHQgPT4gIHV2SGVscGVyLmFkZFV2VG9HZW9tKHt9LGVsdCkgKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG5cblxuICAgIGdldElubmVyVmVydGljYWxHZW9tOiBmdW5jdGlvbihwYXRoc0J5RGVwdGgsb3V0ZXJTaGFwZSxvcHRpb25zVVYsb2Zmc2V0ID0gMCkge1xuICAgICAgICAvL2Vuc3VyZSB0aGUgcGF0aHMgYXJlIGFsbCBpbiB0aGUgc2FtZSBkaXJlY3Rpb25cbiAgICAgICAgT2JqZWN0LmtleXMocGF0aHNCeURlcHRoKS5mb3JFYWNoKGkgPT4ge1xuICAgICAgICAgICAgcGF0aEhlbHBlci5zZXREaXJlY3Rpb25QYXRocyhwYXRoc0J5RGVwdGhbaV0ucGF0aHMsIDEpO1xuICAgICAgICB9KTtcbiAgICAgICAgdXZIZWxwZXIubWFwVmVydGljYWwocGF0aHNCeURlcHRoLG91dGVyU2hhcGUsb3B0aW9uc1VWKTtcbiAgICAgICAgbGV0IGdlb20gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaW5kZXhEZXB0aCA9IHBhdGhzQnlEZXB0aC5sZW5ndGggLSAxOyBpbmRleERlcHRoID4gMDsgaW5kZXhEZXB0aC0tKSB7XG4gICAgICAgICAgICBsZXQgcGF0aHNBdERlcHRoID0gcGF0aHNCeURlcHRoW2luZGV4RGVwdGhdLnBhdGhzO1xuICAgICAgICAgICAgLy9mb3IgZWFjaCBwb2ludCBhdCBlYWNoIHBhdGggYXQgZWFjaCBkZXB0aCB3ZSBsb29rIGZvciB0aGUgY29ycmVzcG9uZGluZyBwb2ludCBpbnRvIHRoZSB1cHBlciBwYXRoczpcbiAgICAgICAgICAgIGZvciAobGV0IHBhdGggb2YgcGF0aHNBdERlcHRoKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaW5kZXhQdER3biBpbiBwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBpZHhQdER3biA9IGluZGV4UHREd247XG4gICAgICAgICAgICAgICAgICAgIGxldCBpZHhOUHREd24gPSgoK2luZGV4UHREd24pICsgMSkgJSBwYXRoLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGN1cnJnZW9tID0gZ2VvbUhlbHBlci5nZXRPbmVJbm5lclZlcnRpY2FsR2VvbShpZHhQdER3biwgaWR4TlB0RHduLCAraW5kZXhEZXB0aCxwYXRoLCBwYXRoc0J5RGVwdGgsICtvZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWN1cnJnZW9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBnZW9tLnB1c2goY3Vycmdlb20pO1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSBjdXJyZ2VvbS5vZmZzZXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdlb21IZWxwZXIubWVyZ2VNZXNoZXMoZ2VvbSwgZmFsc2UpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBnZW9tZXRyeSBvZiB0aGUgaW5uZXIgaG9yaXpvbnRhbCBmYWNlc3NcbiAgICAgKi9cbiAgICBnZXRJbm5lckhvcml6b250YWxHZW9tOiBmdW5jdGlvbih0b3BvUGF0aHNCeURlcHRoLCBvcHRpb25zLCBvZmZzZXQgPSAwKSB7XG4gICAgICAgIC8vZ2V0cyBhbGwgdGhlIHRyaWFuZ2xlcyBieSBkZXB0aDpcbiAgICAgICAgbGV0IHRyaWFuZ2xlc0J5RGVwdGggPSBbXTtcbiAgICAgICAgbGV0IGlubmVySG9yR2VvbT0gW107XG4gICAgICAgIGZvciAobGV0IGkgaW4gdG9wb1BhdGhzQnlEZXB0aCkge1xuICAgICAgICAgICAgbGV0IHRvdGFsdG9wbyA9IHRvcG9QYXRoc0J5RGVwdGhbaV0ucG9zLmNvbmNhdCh0b3BvUGF0aHNCeURlcHRoW2ldLm5lZyk7XG4gICAgICAgICAgICB0cmlhbmdsZXNCeURlcHRoLnB1c2goY2R0MmRIZWxwZXIuY29tcHV0ZVRyaWFuZ3VsYXRpb24odG90YWx0b3BvKSk7XG4gICAgICAgICAgICB0cmlhbmdsZXNCeURlcHRoW2ldLmRlcHRoID0gdG9wb1BhdGhzQnlEZXB0aFtpXS5kZXB0aDtcblxuICAgICAgICB9XG4gICAgICAgIC8vIGdldCBwb2ludHMsIG5vcm1hbCBhbmQgZmFjZXMgZnJvbSBpdDpcbiAgICAgICAgbGV0IGhvcml6b250YWxHZW9tQnlEZXB0aD0gZ2VvbUhlbHBlci5nZXRJbm5lckhvcml6b250YWxHZW9tKHRyaWFuZ2xlc0J5RGVwdGgsIG9wdGlvbnMsICtvZmZzZXQpO1xuICAgICAgICByZXR1cm4gIGdlb21IZWxwZXIubWVyZ2VNZXNoZXMoaG9yaXpvbnRhbEdlb21CeURlcHRoLCBmYWxzZSk7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcGF0aHMgc29ydGVkIGJ5IHNlbnMuIE5lZ2F0aXZlc3MgcGF0aHMgYXJlIGhvbGVzLlxuICAgICAqIFBvc2l0aXZlcyBwYXRocyBhcmUgdGhlIGVuZCBvZiBob2xlcyggc29saWRzKVxuICAgICAqIEZvciBjb252aW5pZW5jZSwgYWxsIHBhdGhzIGFyZSBzZXQgdG8gcG9zaXRpdmVcbiAgICAgKi9cbiAgICBnZXRUb3BvUGF0aEJ5RGVwdGg6IGZ1bmN0aW9uKHBhdGhzQnlEZXB0aCwgb3V0ZXJTaGFwZSwgb3B0aW9ucykge1xuICAgICAgICAvLyBsZXQgcGF0aHMgPSBwYXRoc0J5RGVwdGgucGF0aHM7XG4gICAgICAgIGxldCB0b3BvQnlEZXB0aCA9IFtdO1xuICAgICAgICBwYXRoSGVscGVyLnNldERpcmVjdGlvblBhdGgob3V0ZXJTaGFwZS5wYXRoLCAxKTtcblxuICAgICAgICB0b3BvQnlEZXB0aC5wdXNoKHtcbiAgICAgICAgICAgIHBvczogW291dGVyU2hhcGUucGF0aF0sXG4gICAgICAgICAgICBuZWc6IHBhdGhzQnlEZXB0aFswXS5wYXRocyxcbiAgICAgICAgICAgIGRlcHRoOiAwXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcGF0aHNCeURlcHRoLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgbGV0IHhvciA9IHBhdGhIZWxwZXIuZ2V0WG9yT2ZQYXRocyhwYXRoc0J5RGVwdGhbaV0ucGF0aHMsIHBhdGhzQnlEZXB0aFtpICsgMV0ucGF0aHMpO1xuICAgICAgICAgICAgbGV0IHBvc3hvciA9IHhvci5maWx0ZXIocGF0aEhlbHBlci5pc1Bvc2l0aXZlUGF0aCk7XG4gICAgICAgICAgICBsZXQgbmVneG9yID0geG9yLmZpbHRlcihwYXRoSGVscGVyLmlzTmVnYXRpdmVQYXRoKTtcbiAgICAgICAgICAgIHBhdGhIZWxwZXIuc2V0RGlyZWN0aW9uUGF0aHMobmVneG9yLCAxKTtcbiAgICAgICAgICAgIHRvcG9CeURlcHRoLnB1c2goe1xuICAgICAgICAgICAgICAgIHBvczogcG9zeG9yLFxuICAgICAgICAgICAgICAgIG5lZzogbmVneG9yLFxuICAgICAgICAgICAgICAgIGRlcHRoOiBwYXRoc0J5RGVwdGhbaV0uZGVwdGhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcGF0aEhlbHBlci5zZXREaXJlY3Rpb25QYXRocyhwYXRoc0J5RGVwdGhbcGF0aHNCeURlcHRoLmxlbmd0aCAtIDFdLCAxKTtcbiAgICAgICAgdG9wb0J5RGVwdGgucHVzaCh7XG4gICAgICAgICAgICBwb3M6IFtvdXRlclNoYXBlLnBhdGhdLFxuICAgICAgICAgICAgbmVnOiBwYXRoc0J5RGVwdGhbcGF0aHNCeURlcHRoLmxlbmd0aCAtIDFdLnBhdGhzLFxuICAgICAgICAgICAgZGVwdGg6IHBhdGhzQnlEZXB0aFtwYXRoc0J5RGVwdGgubGVuZ3RoIC0gMV0uZGVwdGhcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0b3BvQnlEZXB0aDtcbiAgICB9LFxuXG4gICAgc2NhbGVVcEhvbGVzOiBmdW5jdGlvbihob2xlcyl7XG4gICAgICBmb3IobGV0IGkgaW4gaG9sZXMpe1xuICAgICAgICAgICAgcGF0aEhlbHBlci5zY2FsZVVwUGF0aChob2xlc1tpXS5wYXRoKTtcbiAgICAgIH1cbiAgIH0sXG5cbiAgIHNjYWxlRG93bkhvbGVzOmZ1bmN0aW9uKGhvbGVzKXtcbiAgICAgICBmb3IobGV0IGkgaW4gaG9sZXMpe1xuICAgICAgICAgICAgIHBhdGhIZWxwZXIuc2NhbGVEb3duUGF0aChob2xlc1tpXS5wYXRoKTtcbiAgICAgICB9XG4gICB9LFxuICAgc2NhbGVEb3duUGF0aHNCeURlcHRoOmZ1bmN0aW9uKHBhdGhzQnlEZXB0aCl7XG4gICAgICAgZm9yKGxldCBpIGluIHBhdGhzQnlEZXB0aCl7XG4gICAgICAgICAgICAgcGF0aEhlbHBlci5zY2FsZURvd25QYXRocyhwYXRoc0J5RGVwdGhbaV0ucGF0aHMpO1xuICAgICAgIH1cbiAgIH0sXG5cbiAgIHNjYWxlRG93blRvcG9CeURlcHRoOmZ1bmN0aW9uKHRvcG9CeURlcHRoLG91dGVyU2hhcGUpe1xuICAgICAgIHBhdGhIZWxwZXIuc2NhbGVEb3duUGF0aChvdXRlclNoYXBlLnBhdGgpXG4gICAgICAgZm9yKGxldCBpPTEgO2k8ICB0b3BvQnlEZXB0aC5sZW5ndGgtMTtpKyspe1xuICAgICAgICAgICAgIHBhdGhIZWxwZXIuc2NhbGVEb3duUGF0aHModG9wb0J5RGVwdGhbaV0ucG9zKTtcbiAgICAgICAgICAgICBwYXRoSGVscGVyLnNjYWxlRG93blBhdGhzKHRvcG9CeURlcHRoW2ldLm5lZyk7XG4gICAgICAgfVxuICAgfSxcbiAgIHNldERpcmVjdGlvblBhdGhzOiBmdW5jdGlvbihwYXRoc0J5RGVwdGgsdG9wb1BhdGhzQnlEZXB0aCl7XG4gICAgICAgZm9yKGxldCBpIGluIHBhdGhzQnlEZXB0aClcbiAgICAgICB7XG4gICAgICAgICAgIHBhdGhIZWxwZXIuc2V0RGlyZWN0aW9uUGF0aHMocGF0aHNCeURlcHRoW2ldLnBhdGhzLDEpO1xuICAgICAgIH1cbiAgICAgICAgZm9yKGxldCBpIGluIHRvcG9QYXRoc0J5RGVwdGgpe1xuICAgICAgICAgICAgcGF0aEhlbHBlci5zZXREaXJlY3Rpb25QYXRocyh0b3BvUGF0aHNCeURlcHRoW2ldLnBvcywxKTtcbiAgICAgICAgICAgIHBhdGhIZWxwZXIuc2V0RGlyZWN0aW9uUGF0aHModG9wb1BhdGhzQnlEZXB0aFtpXS5uZWcsMSk7XG5cbiAgICAgICAgfVxuICAgfSxcblxuICAgIC8qKlxuICAgICAqICBUYWtlcyBhbiBhcnJheSBvZiBwYXRocyByZXByZXNlbnRpbmcgaG9sZXMgYXQgZGlmZmVyZW50IGRlcHRocy5cbiAgICAgKiAgT25lIGRlcHRoIHZhbHVlLyBwYXRoLlxuICAgICAqICByZXR1cm5zIGFuIGFycmF5IG9mIHBhdGhzIGF0IGVhY2ggZGVwdGg6IHNpbXBsaWZ5IHRoZSBnZW9tZXRyeSBmb3IgZWFjaCBzdGFnZS5cbiAgICAgKi9cbiAgICBnZXRQYXRoc0J5RGVwdGg6IGZ1bmN0aW9uKGhvbGVzLCBvdXRlclBhdGgpIHtcbiAgICAgICAgLy9nZXRzIGFsbCBwYXRocyBpbnRvIHRoZSBib3VuZHMgb2Ygb3V0ZXJQYXRoOlxuICAgICAgICAvLyBwYXRoSGVscGVyLmZpdFBhdGhzSW50b1BhdGgob3V0ZXJQYXRoLnBhdGgsIGhvbGVzLm1hcCggaD0+cmV0dXJuIGgucGF0aCkpO1xuICAgICAgICAvKmZvcihsZXQgaSBpbiBob2xlcyl7XG4gICAgICAgICAgICBpZihwYXRoSGVscGVyLmdldFhvck9mUGF0aHMoW2hvbGVzW2ldLnBhdGhdLFtvdXRlclBhdGgucGF0aF0pWzBdKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgaG9sZXNbaV0ucGF0aD1wYXRoSGVscGVyLmdldEludGVyT2ZQYXRocyhbaG9sZXNbaV0ucGF0aF0sW291dGVyUGF0aC5wYXRoXSlbMF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0qL1xuXG4gICAgICAgIC8vc2NhbGVzIHVwIGFsbCBob2xlcyB0byBwcmV2ZW50IGZyb20gaW50IGltcHJlY2lzaW9uXG4gICAgICAgIHBhdGhIZWxwZXIuc2NhbGVVcFBhdGgob3V0ZXJQYXRoLnBhdGgpO1xuXG4gICAgICAgIC8vc2V0cyBhbGwgZGVwdGhzIGRlZXBlciB0aGFuIG91dGVyRGVwdGggIG9yIGVxdWFscyB0byAwIHRvIG91dGVyRGVwdGg6XG4gICAgICAgIGhvbGVzLm1hcChmdW5jdGlvbihlbHQpIHtcbiAgICAgICAgICAgIChlbHQuZGVwdGggPiBvdXRlclBhdGguZGVwdGggfHwgZWx0LmRlcHRoID09PSAwKSA/IGVsdC5kZXB0aCA9IG91dGVyUGF0aC5kZXB0aDogZWx0LmRlcHRoID0gZWx0LmRlcHRoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGV4dHJ1ZGVyLnNjYWxlVXBIb2xlcyhob2xlcyk7XG4gICAgICAgIGhvbGVzLm1hcChmdW5jdGlvbihlbHQpeyBwYXRoSGVscGVyLnNldERpcmVjdGlvblBhdGgoZWx0LnBhdGgsMSk7fSk7XG5cbiAgICAgICAgLy9nZXQgYWxsIGRlcHRoczpcbiAgICAgICAgbGV0IGRlcHRocyA9IG5ldyBTZXQoKTtcbiAgICAgICAgZm9yIChsZXQgaSBpbiBob2xlcykge1xuICAgICAgICAgICAgZGVwdGhzLmFkZChob2xlc1tpXS5kZXB0aCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVwdGhzLmFkZCgwKTtcbiAgICAgICAgZGVwdGhzLmFkZChvdXRlclBhdGguZGVwdGgpO1xuICAgICAgICBkZXB0aHMgPSBBcnJheS5mcm9tKGRlcHRocyk7XG4gICAgICAgIGRlcHRocy5zb3J0KFxuICAgICAgICAgICAgZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhIC0gYjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIC8vZ2V0IHBhdGhzIGJ5IGRlcHRoOlxuICAgICAgICBsZXQgcmVzPVtdO1xuICAgICAgICBmb3IgKGxldCBpIGluIGRlcHRocykge1xuICAgICAgICAgICAgbGV0IHBhdGhBdERlcHRoID0gaG9sZXMuZmlsdGVyKChzKSA9PiBzLmRlcHRoID49IGRlcHRoc1tpXSk7XG4gICAgICAgICAgICBwYXRoQXREZXB0aCA9IHBhdGhIZWxwZXIuc2ltcGxpZnlQYXRocyhwYXRoQXREZXB0aC5tYXAoKHMpID0+IHMucGF0aCkpO1xuICAgICAgICAgICAgLy90YWtlIG9ubHkgdGhlIHBhdGhzIG9mIHRoZSBob2xlcyB3aGljaCByZWFjaCB0aGlzIGRlcHRoXG4gICAgICAgICAgICByZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgcGF0aHM6IHBhdGhBdERlcHRoLFxuICAgICAgICAgICAgICAgIGRlcHRoOiBkZXB0aHNbaV1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXh0cnVkZXI7XG4iLCJjb25zdCBwYXRoSGVscGVyID0gcmVxdWlyZShcIi4vcGF0aC1oZWxwZXIuanNcIik7XG5jb25zdCBjZHQyZEhlbHBlciA9IHJlcXVpcmUoXCIuL2NkdDJkLWhlbHBlci5qc1wiKTtcblxuXG52YXIgZ2VvbUhlbHBlciA9IHtcblxuXG4gICAgbWVyZ2VNZXNoZXM6IGZ1bmN0aW9uKGdlb21zLCBjb25zaWRlck9mZnNldCA9IHRydWUpIHtcbiAgICAgICAgbGV0IHJlcyA9IGdlb21zWzBdO1xuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGdlb21zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICByZXMgPSBnZW9tSGVscGVyLm1lcmdlTWVzaChyZXMsIGdlb21zW2ldLCBjb25zaWRlck9mZnNldCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgbWVyZ2VNZXNoOiBmdW5jdGlvbihnZW9tMSwgZ2VvbTIsIGNvbnNpZGVyT2Zmc2V0KSB7XG4gICAgICAgIGlmICghZ2VvbTIpIHJldHVybiBnZW9tMTtcbiAgICAgICAgaWYgKCFnZW9tMSkgcmV0dXJuIGdlb20yO1xuXG4gICAgICAgIGlmIChjb25zaWRlck9mZnNldCkge1xuICAgICAgICAgICAgZ2VvbTEuZmFjZXMucHVzaCguLi5nZW9tMi5mYWNlcy5tYXAoZiA9PiBmICsgKCtnZW9tMS5vZmZzZXQpKSk7XG4gICAgICAgICAgICBnZW9tMS5vZmZzZXQgPSAoK2dlb20xLm9mZnNldCkgKyAoK2dlb20yLm9mZnNldCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnZW9tMS5mYWNlcy5wdXNoKC4uLmdlb20yLmZhY2VzKTtcbiAgICAgICAgICAgIGdlb20xLm9mZnNldCA9IE1hdGgubWF4KGdlb20xLm9mZnNldCwgZ2VvbTIub2Zmc2V0KTtcbiAgICAgICAgfVxuICAgICAgICBnZW9tMS5wb2ludHMucHVzaCguLi5nZW9tMi5wb2ludHMpO1xuICAgICAgICBnZW9tMS5ub3JtYWxzLnB1c2goLi4uZ2VvbTIubm9ybWFscyk7XG4gICAgICAgIGlmKGdlb20xLnV2cyAmJiBnZW9tMi51dnMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGdlb20xLnV2cy5wdXNoKC4uLmdlb20yLnV2cyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGdlb20xO1xuICAgIH0sXG5cbiAgICBnZXRPdXRlclZlcnRpY2FsR2VvbTogZnVuY3Rpb24ob3V0ZXJTaGFwZSwgZGVwdGgsIG9mZnNldCA9IDApIHtcblxuICAgICAgICBsZXQgcmVzID0gW11cblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG91dGVyU2hhcGUucGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IHB0MSA9IG91dGVyU2hhcGUucGF0aFtpXTtcbiAgICAgICAgICAgIGxldCBwdDIgPSBvdXRlclNoYXBlLnBhdGhbKGkgKyAxKSAlIG91dGVyU2hhcGUucGF0aC5sZW5ndGhdO1xuICAgICAgICAgICAgbGV0IGdlb20gPSBnZW9tSGVscGVyLmdldFB0c05vcm1zSW5keDJkKHB0MSwgcHQyLCAwLCBkZXB0aCwgK29mZnNldCwgdHJ1ZSk7XG4gICAgICAgICAgICBvZmZzZXQgPSBnZW9tLm9mZnNldDtcbiAgICAgICAgICAgIGdlb20udXZzPVtdO1xuICAgICAgICAgICAgZ2VvbUhlbHBlci5hZGRVdnNUb091dGVyVmVydEdlb20oZ2VvbSwgcHQxLHB0Mik7XG4gICAgICAgICAgICByZXMucHVzaChnZW9tKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ2VvbUhlbHBlci5tZXJnZU1lc2hlcyhyZXMsIGZhbHNlKTtcbiAgICB9LFxuXG4gICAgLypcbiAgICAgKiBSZXR1cm5zIHR3byB0cmlhbmdsZXMgcmVwcmVzZW50aW5nIHRoZSBsYXJnZXIgZmFjZSB3ZSBjYW4gYnVpbGQgZnJvbSB0aGUgZWRnZSBwdER3bi0+blB0RHduXG4gICAgICovXG4gICAgZ2V0T25lSW5uZXJWZXJ0aWNhbEdlb206IGZ1bmN0aW9uKGlkeFB0RHduLCBuSWR4UHREd24sIGluZGV4RGVwdGhEd24scGF0aER3biwgcGF0aHNCeURlcHRoLCBvZmZzZXQgPSAwKSB7XG4gICAgICAgIGxldCBwdER3bj0gcGF0aER3bltpZHhQdER3bl07XG4gICAgICAgIGxldCBuUHREd249IHBhdGhEd25bbklkeFB0RHduXTtcbiAgICAgICAgbGV0IG1hdGNoID0gZ2VvbUhlbHBlci5nZXRNYXRjaERlcHRocyhwdER3biwgblB0RHduLCAraW5kZXhEZXB0aER3biwgcGF0aHNCeURlcHRoKTtcbiAgICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCByZXMgPSBnZW9tSGVscGVyLmdldFB0c05vcm1zSW5keDJkKHB0RHduLCBuUHREd24sICttYXRjaC5kZXB0aFVwLCArbWF0Y2guZGVwdGhEd24sICtvZmZzZXQpO1xuXG4gICAgICAgIHJlcy51dnM9W107XG4gICAgICAgIC8vYWRkIHV2czpcbiAgICAgICAgZ2VvbUhlbHBlci5hZGRVdnNUb0lubmVyVmVydEdlb20ocmVzLCAraWR4UHREd24sbWF0Y2gucGF0aFVwICxwYXRoRHduLHBhdGhzQnlEZXB0aCwgaW5kZXhEZXB0aER3bik7XG5cblxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBkZXB0aHMgYXQgd2hpY2ggdGhleSBhcmUgdHdvIGVkZ2VzIHdpdGggdGhlIHNhbWUgMkQgY29vcmRzLlxuICAgICAqIElmIGl0IGRvZXMgbm90IGV4aXN0cyBzdWNoIGEgZWRnZSwgcmV0dXJucyB0aGUgY3VycmVudCBkZXB0aCBhbmQgdGhlIGRlcHRoIGFib3ZlXG4gICAgICovXG4gICAgZ2V0TWF0Y2hEZXB0aHM6IGZ1bmN0aW9uKHB0RHduLCBuUHREd24sIGluZGV4RGVwdGgsIHBhdGhzQnlEZXB0aCkge1xuICAgICAgICAvL2ZvciBlYWNoIGRlcHRoIGRlZXBlciB0aGFuIHBhdGhVcCx3ZSBsb29rIGZvciBhIGNvcnJlc3BvbmRpbmcgcG9pbnQ6XG4gICAgICAgIGxldCBkZXB0aFVwID0gcGF0aHNCeURlcHRoW2luZGV4RGVwdGggLSAxXS5kZXB0aDtcbiAgICAgICAgbGV0IGRlcHRoRHduID0gcGF0aHNCeURlcHRoW2luZGV4RGVwdGhdLmRlcHRoO1xuICAgICAgICBsZXQgaW5kZXhQdFVwPTA7XG4gICAgICAgIGxldCBwYXRoVXBSZXM7XG4gICAgICAgIGZvciAobGV0IGkgPSBpbmRleERlcHRoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGxldCBwYXRoc0F0RGVwdGggPSBwYXRoc0J5RGVwdGhbaV0ucGF0aHM7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhdGhzQXREZXB0aC5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIC8vZm9yIGVhY2ggcGF0aCBhdCBlYWNoIGRlcHRoOlxuICAgICAgICAgICAgICAgIGxldCBwYXRoVXAgPSBwYXRoc0F0RGVwdGhbal07XG4gICAgICAgICAgICAgICAgbGV0IG1hdGNoMSA9IHBhdGhIZWxwZXIuZ2V0UG9pbnRNYXRjaChwYXRoVXAsIHB0RHduKTtcbiAgICAgICAgICAgICAgICBsZXQgbWF0Y2gyID0gcGF0aEhlbHBlci5nZXRQb2ludE1hdGNoKHBhdGhVcCwgblB0RHduKTtcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoMSB8fCAhbWF0Y2gyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocGF0aFVwW21hdGNoMS5pbmRleF0udmlzaXRlZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGluZGV4UHRVcD0gbWF0Y2gxLmluZGV4O1xuICAgICAgICAgICAgICAgIGRlcHRoVXAgPSBwYXRoc0J5RGVwdGhbaV0uZGVwdGg7XG4gICAgICAgICAgICAgICAgZGVwdGhEd24gPSBwYXRoc0J5RGVwdGhbaW5kZXhEZXB0aF0uZGVwdGg7XG4gICAgICAgICAgICAgICAgcGF0aFVwW21hdGNoMS5pbmRleF0udmlzaXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcGF0aFVwUmVzPXBhdGhVcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZGVwdGhVcDogZGVwdGhVcCxcbiAgICAgICAgICAgIHBhdGhVcDpwYXRoVXBSZXMsXG4gICAgICAgICAgICBkZXB0aER3bjogZGVwdGhEd24sXG4gICAgICAgICAgICBpbmRleFB0VXA6IGluZGV4UHRVcCxcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0UHRzTm9ybXNJbmR4MmQ6IGZ1bmN0aW9uKHBvaW50MmQxLCBwb2ludDJkMiwgZGVwdGhVcCwgZGVwdGhEd24sIG9mZnNldCxpbnZlcnROb3JtYWw9ZmFsc2UpIHtcblxuICAgICAgICBsZXQgcG9pbnQxID0gZ2VvbUhlbHBlci5nZXRQb2ludDMocG9pbnQyZDEsIGRlcHRoVXApO1xuICAgICAgICBsZXQgcG9pbnQyID0gZ2VvbUhlbHBlci5nZXRQb2ludDMocG9pbnQyZDEsIGRlcHRoRHduKTtcbiAgICAgICAgbGV0IHBvaW50MyA9IGdlb21IZWxwZXIuZ2V0UG9pbnQzKHBvaW50MmQyLCBkZXB0aER3bik7XG4gICAgICAgIGxldCBwb2ludDQgPSBnZW9tSGVscGVyLmdldFBvaW50Myhwb2ludDJkMiwgZGVwdGhVcCk7XG5cbiAgICAgICAgcmV0dXJuIGdlb21IZWxwZXIuZ2V0UHRzTm9ybXNJbmR4M2QoW3BvaW50MSwgcG9pbnQyLCBwb2ludDMsIHBvaW50NF0sICtvZmZzZXQsaW52ZXJ0Tm9ybWFsKTtcbiAgICB9LFxuXG4gICAgZ2V0UHRzTm9ybXNJbmR4M2Q6IGZ1bmN0aW9uKHBvaW50czNkLCBvZmZzZXQsaW52ZXJ0Tm9ybWFsKSB7XG4gICAgICAgIGxldCBub3JtYWwgPSBnZW9tSGVscGVyLmdldE5vcm1hbFRvUGxhbihwb2ludHMzZFswXSwgcG9pbnRzM2RbMV0sIHBvaW50czNkWzJdLGludmVydE5vcm1hbCk7XG4gICAgICAgIGxldCByZXNOb3JtID0gW107XG4gICAgICAgIHJlc05vcm0ucHVzaCguLi5ub3JtYWwpO1xuICAgICAgICByZXNOb3JtLnB1c2goLi4ubm9ybWFsKTtcbiAgICAgICAgcmVzTm9ybS5wdXNoKC4uLm5vcm1hbCk7XG4gICAgICAgIHJlc05vcm0ucHVzaCguLi5ub3JtYWwpO1xuICAgICAgICBsZXQgcmVzUG9pbnRzID0gW107XG4gICAgICAgIHJlc1BvaW50cy5wdXNoKC4uLnBvaW50czNkWzBdKTtcbiAgICAgICAgcmVzUG9pbnRzLnB1c2goLi4ucG9pbnRzM2RbMV0pO1xuICAgICAgICByZXNQb2ludHMucHVzaCguLi5wb2ludHMzZFsyXSk7XG4gICAgICAgIHJlc1BvaW50cy5wdXNoKC4uLnBvaW50czNkWzNdKTtcbiAgICAgICAgbGV0IHJlc0ZhY2VzO1xuICAgICAgICBpZihpbnZlcnROb3JtYWwpe1xuICAgICAgICAgICAgcmVzRmFjZXM9IChbMCwgMSwgMiwgMCwgMiwgM10pLm1hcChlbHQgPT4gZWx0ICsgb2Zmc2V0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgICAgcmVzRmFjZXM9IChbMCwgMiwgMSwgMCwgMywgMl0pLm1hcChlbHQgPT4gZWx0ICsgb2Zmc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwb2ludHM6IHJlc1BvaW50cyxcbiAgICAgICAgICAgIG5vcm1hbHM6IHJlc05vcm0sXG4gICAgICAgICAgICBmYWNlczogcmVzRmFjZXMsXG4gICAgICAgICAgICBvZmZzZXQ6IG9mZnNldCArIDRcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgYWRkVXZzVG9Jbm5lclZlcnRHZW9tOiBmdW5jdGlvbihnZW9tLGluZGV4UHREd24scGF0aFVwLHBhdGhEd24scGF0aHNCeURlcHRoLGluZGV4RGVwdGgpe1xuXG4gICAgICAgIGxldCB2VXA7XG4gICAgICAgIGlmKHBhdGhVcClcbiAgICAgICAge1xuICAgICAgICAgICAgdlVwPSBwYXRoVXBbMF0uVVZbMV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2VXA9IHBhdGhzQnlEZXB0aFtpbmRleERlcHRoLTFdLnBhdGhzWzBdWzBdLlVWWzFdO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5JbmRleFB0RHduPSAoaW5kZXhQdER3bisxKSVwYXRoRHduLmxlbmd0aDtcbiAgICAgICAgbGV0IHU9cGF0aER3bltpbmRleFB0RHduXS5VVlswXTtcbiAgICAgICAgbGV0IHY9cGF0aER3bltpbmRleFB0RHduXS5VVlsxXTtcbiAgICAgICAgbGV0IG51PXBhdGhEd25bbkluZGV4UHREd25dLlVWWzBdO1xuXG4gICAgICAgIGlmKHBhdGhEd25bbkluZGV4UHREd25dLlVWMilcbiAgICAgICAge1xuICAgICAgICAgICAgbnU9cGF0aER3bltuSW5kZXhQdER3bl0uVVYyWzBdO1xuICAgICAgICB9XG4gICAgICAgIGxldCB1dnM9IFt1LHZVcCxcbiAgICAgICAgICAgICAgICAgIHUsdixcbiAgICAgICAgICAgICAgICAgIG51LHYsXG4gICAgICAgICAgICAgICAgICBudSx2VXBdO1xuICAgICAgICBnZW9tLnV2cy5wdXNoKC4uLnV2cyk7XG5cbiAgICB9LFxuXG4gICAgYWRkVXZzVG9PdXRlclZlcnRHZW9tOmZ1bmN0aW9uKGdlb20scHQxLCBwdDIpXG4gICAge1xuICAgICAgICBsZXQgdTE9IHB0MS5VVlswXTtcbiAgICAgICAgbGV0IHUyPSBwdDIuVVZbMF07XG4gICAgICAgIGlmKHB0Mi5VVjIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHUyPXB0Mi5VVjJbMF07XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHZVcD0gcHQxLlVWWzFdO1xuICAgICAgICBsZXQgdkR3bj0gcHQyLlZEb3duO1xuICAgICAgICBsZXQgdXZzPSBbdTEsdlVwLCB1MSx2RHduLHUyLHZEd24sIHUyLHZVcF07XG4gICAgICAgIGdlb20udXZzLnB1c2goLi4udXZzKTtcbiAgICB9LFxuXG4gICAgZ2V0SW5uZXJIb3Jpem9udGFsR2VvbTogZnVuY3Rpb24odHJpYW5nbGVzQnlEZXB0aCwgb3B0aW9ucywgb2Zmc2V0ID0gMCkge1xuICAgICAgICBsZXQgcmVzID0gW107XG4gICAgICAgIGxldCBpbmRleGVzID0gW107XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuZnJvbnRNZXNoKSB7XG4gICAgICAgICAgICBpbmRleGVzLnB1c2goMCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuaW5NZXNoKSB7XG4gICAgICAgICAgICBpbmRleGVzLnB1c2goLi4uQXJyYXkuZnJvbShuZXcgQXJyYXkodHJpYW5nbGVzQnlEZXB0aC5sZW5ndGggLSAyKSwgKHZhbCwgaW5kZXgpID0+IGluZGV4ICsgMSkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmJhY2tNZXNoKSB7XG4gICAgICAgICAgICBpbmRleGVzLnB1c2godHJpYW5nbGVzQnlEZXB0aC5sZW5ndGggLSAxKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgZm9yIChsZXQgaSBvZiBpbmRleGVzKSB7XG4gICAgICAgICAgICBsZXQgdHJpYW5nbGVzID0gdHJpYW5nbGVzQnlEZXB0aFtpXTtcbiAgICAgICAgICAgIGxldCBpbnZlcnROb3JtYWwgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYmFja01lc2gpIHtcbiAgICAgICAgICAgICAgaW52ZXJ0Tm9ybWFsID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgY3Vyckdlb20gPSBnZW9tSGVscGVyLmdldEdlb21Gcm9tVHJpYW5ndWxhdGlvbih0cmlhbmdsZXMsICt0cmlhbmdsZXMuZGVwdGgsIGludmVydE5vcm1hbCwgb2Zmc2V0KTtcbiAgICAgICAgICAgIG9mZnNldCA9IGN1cnJHZW9tLm9mZnNldDtcbiAgICAgICAgICAgIHJlcy5wdXNoKGN1cnJHZW9tKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cblxuICAgIGdldEdlb21Gcm9tVHJpYW5ndWxhdGlvbjogZnVuY3Rpb24odHJpYW5nbGVzLCBkZXB0aCwgaW52ZXJ0Tm9ybWFsPWZhbHNlLCBvZmZzZXQgPSAwKSB7XG4gICAgICAgIGxldCBwb2ludHMgPSBbXTtcbiAgICAgICAgT2JqZWN0LnZhbHVlcyh0cmlhbmdsZXMucG9pbnRzKS5mb3JFYWNoKHBvaW50ID0+IHtcbiAgICAgICAgICAgIHBvaW50cy5wdXNoKHBvaW50WzBdKTtcbiAgICAgICAgICAgIHBvaW50cy5wdXNoKHBvaW50WzFdKTtcbiAgICAgICAgICAgIHBvaW50cy5wdXNoKGRlcHRoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmKCFpbnZlcnROb3JtYWwpe1xuICAgICAgICAgICAgZm9yKCBsZXQgdCBvZiB0cmlhbmdsZXMudHJpYW5nbGVzKXtcbiAgICAgICAgICAgICAgICB0LnJldmVyc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvL29mZnNldHMgZmFjZXNcbiAgICAgICAgbGV0IGZhY2VzID0gW107XG4gICAgICAgIE9iamVjdC52YWx1ZXModHJpYW5nbGVzLnRyaWFuZ2xlcykuZm9yRWFjaCh0cmlhbmdsZSA9PiB7XG4gICAgICAgICAgICBmYWNlcy5wdXNoKC4uLnRyaWFuZ2xlLm1hcChpbmRleCA9PiBpbmRleCArIG9mZnNldCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgb2Zmc2V0ICs9IHRyaWFuZ2xlcy5wb2ludHMubGVuZ3RoO1xuXG4gICAgICAgIC8vZ2V0IG5vcm1hbHM6XG4gICAgICAgIGxldCBub3JtYWxzID0gW107XG4gICAgICAgIGxldCBub3JtYWwgPSBnZW9tSGVscGVyLmdldE5vcm1hbFRvUGxhbihwb2ludHMuc2xpY2UoMCwgMyksXG4gICAgICAgICAgICAgICAgcG9pbnRzLnNsaWNlKDMsIDYpLFxuICAgICAgICAgICAgICAgIHBvaW50cy5zbGljZSg2LCA5KSxpbnZlcnROb3JtYWwpO1xuXG4gICAgICAgIE9iamVjdC52YWx1ZXModHJpYW5nbGVzLnBvaW50cykuZm9yRWFjaChwb2ludCA9PiB7XG4gICAgICAgICAgICBub3JtYWxzLnB1c2goLi4ubm9ybWFsKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwb2ludHM6IHBvaW50cyxcbiAgICAgICAgICAgIGZhY2VzOiBmYWNlcyxcbiAgICAgICAgICAgIG5vcm1hbHM6IG5vcm1hbHMsXG4gICAgICAgICAgICBvZmZzZXQ6IG9mZnNldFxuICAgICAgICB9O1xuICAgIH0sXG5cblxuICAgIGdldE5vcm1hbFRvUGxhbjogZnVuY3Rpb24ocG9pbnQxLCBwb2ludDIsIHBvaW50NCwgaW52ZXJ0Tm9ybWFsPWZhbHNlKSB7XG4gICAgICAgIGxldCB2ZWMxO1xuICAgICAgICBpZiAoaW52ZXJ0Tm9ybWFsKSB7XG4gICAgICAgICAgICB2ZWMxID0gZ2VvbUhlbHBlci5wb2ludHNUb1ZlYyhwb2ludDIsIHBvaW50MSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2ZWMxID0gZ2VvbUhlbHBlci5wb2ludHNUb1ZlYyhwb2ludDEsIHBvaW50Mik7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHZlYzIgPSBnZW9tSGVscGVyLnBvaW50c1RvVmVjKHBvaW50MSwgcG9pbnQ0KTtcbiAgICAgICAgcmV0dXJuIGdlb21IZWxwZXIubm9ybWFsaXplVmVjKGdlb21IZWxwZXIuY3Jvc3ModmVjMSwgdmVjMikpO1xuICAgIH0sXG5cbiAgICBwb2ludHNUb1ZlYzogZnVuY3Rpb24ocG9pbnQxLCBwb2ludDIpIHtcbiAgICAgICAgcmV0dXJuIFtwb2ludDJbMF0gLSBwb2ludDFbMF0sIHBvaW50MlsxXSAtIHBvaW50MVsxXSwgcG9pbnQyWzJdIC0gcG9pbnQxWzJdXTtcbiAgICB9LFxuXG4gICAgZ2V0UG9pbnQzOiBmdW5jdGlvbihwb2ludDIsIGRlcHRoKSB7XG4gICAgICAgIHJldHVybiBbcG9pbnQyLlgsIHBvaW50Mi5ZLCBkZXB0aF07XG4gICAgfSxcblxuICAgIGNyb3NzOiBmdW5jdGlvbih2ZWMxLCB2ZWMyKSB7XG4gICAgICAgIHJldHVybiBbdmVjMVsxXSAqIHZlYzJbMl0gLSB2ZWMxWzJdICogdmVjMlsxXSxcbiAgICAgICAgICAgIHZlYzFbMl0gKiB2ZWMyWzBdIC0gdmVjMVswXSAqIHZlYzJbMl0sXG4gICAgICAgICAgICB2ZWMxWzBdICogdmVjMlsxXSAtIHZlYzFbMV0gKiB2ZWMyWzBdXG4gICAgICAgIF07XG4gICAgfSxcblxuICAgIG5vcm1hbGl6ZVZlYzogZnVuY3Rpb24odmVjKSB7XG4gICAgICAgIGxldCBub3JtID0gTWF0aC5zcXJ0KHZlY1swXSAqIHZlY1swXSArIHZlY1sxXSAqIHZlY1sxXSArIHZlY1syXSAqIHZlY1syXSk7XG4gICAgICAgIHJldHVybiBbdmVjWzBdIC8gbm9ybSwgdmVjWzFdIC8gbm9ybSwgdmVjWzJdIC8gbm9ybV07XG4gICAgfSxcblxuXG59O1xubW9kdWxlLmV4cG9ydHMgPSBnZW9tSGVscGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cblxuXG5jb25zdCBleHRydWRlciA9IHJlcXVpcmUoXCIuL2V4dHJ1ZGVyLmpzXCIpO1xuY29uc3QgZ2VvbUhlbHBlciA9IHJlcXVpcmUoXCIuL2dlb20taGVscGVyLmpzXCIpO1xuY29uc3QgZXhwb3J0SGVscGVyPSByZXF1aXJlKFwiLi9leHBvcnQtaGVscGVyLmpzXCIpO1xuY29uc3QgZHJhd0hlbHBlcj0gcmVxdWlyZShcIi4vZHJhdy1oZWxwZXIuanNcIik7XG5jb25zdCBwYXRoSGVscGVyPSByZXF1aXJlKFwiLi9wYXRoLWhlbHBlci5qc1wiKTtcblxuXG5cbnZhciB6ZXBhdGhsaWIgPSB7XG5cbiAgICBnZXRQYXRoc0J5RGVwdGg6IGV4dHJ1ZGVyLmdldFBhdGhzQnlEZXB0aCxcbiAgICBnZXRUb3BvUGF0aEJ5RGVwdGg6IGV4dHJ1ZGVyLmdldFRvcG9QYXRoQnlEZXB0aCxcbiAgICBkcmF3UGF0aHM6IGRyYXdIZWxwZXIuZHJhd1BhdGhzLFxuICAgIGRyYXdQYXRoOiBkcmF3SGVscGVyLmRyYXdQYXRoLFxuICAgIGRyYXdUcmlhbmdsZXM6IGRyYXdIZWxwZXIuZHJhd1RyaWFuZ2xlcyxcbiAgICBnZXRYb3JPZlBhdGhzOiBwYXRoSGVscGVyLmdldFhvck9mUGF0aHMsXG4gICAgZ2V0SW50ZXJPZlBhdGhzOiBwYXRoSGVscGVyLmdldEludGVyT2ZQYXRocyxcbiAgICBnZXREaWZmT2ZQYXRoczogcGF0aEhlbHBlci5nZXREaWZmT2ZQYXRocyxcbiAgICBnZXRVbmlvbk9mUGF0aHM6IHBhdGhIZWxwZXIuZ2V0VW5pb25PZlBhdGhzLFxuICAgIGdldEludGVyT2ZQYXRoczogcGF0aEhlbHBlci5nZXRJbnRlck9mUGF0aHMsXG5cbiAgICBtZXNoZXNUb09iajogZXhwb3J0SGVscGVyLm1lc2hlc1RvT2JqLFxuICAgIG1lc2hUb09iajogZXhwb3J0SGVscGVyLm1lc2hUb09iaixcblxuICAgIGdldEdlb21ldHJ5OiBleHRydWRlci5nZXRHZW9tZXRyeSxcbiAgICBtZXJnZU1lc2hlczogZ2VvbUhlbHBlci5tZXJnZU1lc2hlc1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHplcGF0aGxpYjtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBjbGlwcGVyTGliID0gcmVxdWlyZShcImNsaXBwZXItbGliXCIpO1xuXG52YXIgcGF0aEhlbHBlciA9IHtcblxuXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZSB0aGUgeG9yIG9mIHR3byBhcnJheXMgb2YgcGF0aFxuICAgICAqXG4gICAgICovXG4gICAgZ2V0WG9yT2ZQYXRoczogZnVuY3Rpb24ocGF0aHNTdWJqLCBwYXRoc0NsaXApIHtcbiAgICAgICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBzdWJqZWN0RmlsbFR5cGU6IGNsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm8sXG4gICAgICAgICAgICBjbGlwRmlsbFR5cGU6IGNsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm8sXG4gICAgICAgICAgICBjbGlwVHlwZTogY2xpcHBlckxpYi5DbGlwVHlwZS5jdFhvclxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcGF0aEhlbHBlci5leGVjdXRlQ2xpcHBlcihwYXRoc1N1YmosIHBhdGhzQ2xpcCwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENvbXB1dGUgdGhlIHhvciBvZiB0d28gYXJyYXlzIG9mIHBhdGhcbiAgICAgKlxuICAgICAqL1xuICAgIGdldFVuaW9uT2ZQYXRoczogZnVuY3Rpb24ocGF0aHNTdWJqLCBwYXRoc0NsaXAsIG9wKSB7XG4gICAgICAgIGxldCBvcHRpb25zID0ge1xuICAgICAgICAgICAgc3ViamVjdEZpbGxUeXBlOiBjbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvLFxuICAgICAgICAgICAgY2xpcEZpbGxUeXBlOiBjbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvLFxuICAgICAgICAgICAgY2xpcFR5cGU6IGNsaXBwZXJMaWIuQ2xpcFR5cGUuY3RVbmlvblxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcGF0aEhlbHBlci5leGVjdXRlQ2xpcHBlcihwYXRoc1N1YmosIHBhdGhzQ2xpcCwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENvbXB1dGUgdGhlIHhvciBvZiB0d28gYXJyYXlzIG9mIHBhdGhcbiAgICAgKlxuICAgICAqL1xuICAgIGdldERpZmZPZlBhdGhzOiBmdW5jdGlvbihwYXRoc1N1YmosIHBhdGhzQ2xpcCwgb3ApIHtcbiAgICAgICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBzdWJqZWN0RmlsbFR5cGU6IGNsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm8sXG4gICAgICAgICAgICBjbGlwRmlsbFR5cGU6IGNsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm8sXG4gICAgICAgICAgICBjbGlwVHlwZTogY2xpcHBlckxpYi5DbGlwVHlwZS5jdERpZmZlcmVuY2VcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHBhdGhIZWxwZXIuZXhlY3V0ZUNsaXBwZXIocGF0aHNTdWJqLCBwYXRoc0NsaXAsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDb21wdXRlIHRoZSB4b3Igb2YgdHdvIGFycmF5cyBvZiBwYXRoXG4gICAgICpcbiAgICAgKi9cbiAgICBnZXRJbnRlck9mUGF0aHM6IGZ1bmN0aW9uKHBhdGhzU3ViaiwgcGF0aHNDbGlwLCBvcCkge1xuICAgICAgICBsZXQgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHN1YmplY3RGaWxsVHlwZTogY2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybyxcbiAgICAgICAgICAgIGNsaXBGaWxsVHlwZTogY2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybyxcbiAgICAgICAgICAgIGNsaXBUeXBlOiBjbGlwcGVyTGliLkNsaXBUeXBlLmN0SW50ZXJzZWN0aW9uXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBwYXRoSGVscGVyLmV4ZWN1dGVDbGlwcGVyKHBhdGhzU3ViaiwgcGF0aHNDbGlwLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2ltcGxpZnkgYW4gYXJyYXkgb2YgcGF0aHNcbiAgICAgKlxuICAgICAqL1xuICAgIHNpbXBsaWZ5UGF0aHM6IGZ1bmN0aW9uKHBhdGhzLCBvcHRpb25zID0ge1xuICAgICAgICBmaWxsVHlwZTogY2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVyb1xuICAgIH0pIHtcbiAgICAgICAgcmV0dXJuIGNsaXBwZXJMaWIuQ2xpcHBlci5TaW1wbGlmeVBvbHlnb25zKHBhdGhzLCBvcHRpb25zLmZpbGxUeXBlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQXBwbHkgQ2xpcHBlciBvcGVyYXRpb24gdG8gcGF0aHNTdWJqIGFuZCBwYXRoQ2xpcFxuICAgICAqIGNsaXBUeXBlOiB7Y3RJbnRlcnNlY3Rpb24sY3RVbmlvbixjdERpZmZlcmVuY2UsY3RYb3J9XG4gICAgICogc3ViamVjdEZpbGw6IHtwZnRFdmVuT2RkLHBmdE5vblplcm8scGZ0UG9zaXRpdmUscGZ0TmVnYXRpdmV9XG4gICAgICogY2xpcEZpbGw6IHNhbWUgYXMgdXBvblxuICAgICAqL1xuICAgIGV4ZWN1dGVDbGlwcGVyOiBmdW5jdGlvbihwYXRoc1N1YmosIHBhdGhzQ2xpcCwgb3B0aW9ucyA9IHtcbiAgICAgICAgY2xpcFR5cGU6IGNsaXBwZXJMaWIuQ2xpcFR5cGVcbiAgICAgICAgICAgIC5jdFVuaW9uLFxuICAgICAgICBzdWJqZWN0RmlsbDogY2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybyxcbiAgICAgICAgY2xpcEZpbGw6IGNsaXBwZXJMaWJcbiAgICAgICAgICAgIC5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVyb1xuICAgIH0pIHtcbiAgICAgICAgaWYgKCFwYXRoc1N1YmogJiYgIXBhdGhzQ2xpcCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vdHVybiBwYXRocyBzbyB0aGV5IGFyZSBuZWdhdGl2ZXM6XG4gICAgICAgIHBhdGhIZWxwZXIuc2V0RGlyZWN0aW9uUGF0aHMocGF0aHNTdWJqLCAtMSk7XG4gICAgICAgIGlmIChwYXRoc0NsaXApIHtcbiAgICAgICAgICAgIHBhdGhIZWxwZXIuc2V0RGlyZWN0aW9uUGF0aHMocGF0aHNDbGlwLCAtMSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9zZXR0dXAgYW5kIGV4ZWN1dGUgY2xpcHBlclxuICAgICAgICBsZXQgY3ByID0gbmV3IGNsaXBwZXJMaWIuQ2xpcHBlcigpO1xuICAgICAgICBjcHIuQWRkUGF0aHMocGF0aHNTdWJqLCBjbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdCwgdHJ1ZSk7XG4gICAgICAgIGlmIChwYXRoc0NsaXApIHtcbiAgICAgICAgICAgIGNwci5BZGRQYXRocyhwYXRoc0NsaXAsIGNsaXBwZXJMaWIuUG9seVR5cGUucHRDbGlwLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzID0gbmV3IGNsaXBwZXJMaWIuUGF0aHMoKTtcbiAgICAgICAgY3ByLkV4ZWN1dGUob3B0aW9ucy5jbGlwVHlwZSwgcmVzLCBvcHRpb25zLnN1YmplY3RGaWxsLCBvcHRpb25zLmNsaXBGaWxsKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogIHNldHMgdGhlIGRpcmVjdGlvbiBvZiBhbiBhcnJheSBvZiBwYXRoXG4gICAgICovXG4gICAgc2V0RGlyZWN0aW9uUGF0aHM6IGZ1bmN0aW9uKHBhdGhzLCBkaXJlY3Rpb24pIHtcbiAgICAgICAgZm9yIChsZXQgaSBpbiBwYXRocykge1xuICAgICAgICAgICAgcGF0aEhlbHBlci5zZXREaXJlY3Rpb25QYXRoKHBhdGhzW2ldLCBkaXJlY3Rpb24pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqICBzZXRzIHRoZSBkaXJlY3Rpb24gb2YgYSBwYXRoXG4gICAgICovXG4gICAgc2V0RGlyZWN0aW9uUGF0aDogZnVuY3Rpb24ocGF0aCwgZGlyZWN0aW9uKSB7XG4gICAgICAgIGlmIChjbGlwcGVyTGliLkpTLkFyZWFPZlBvbHlnb24ocGF0aCkgKiBkaXJlY3Rpb24gPCAwKSB7XG4gICAgICAgICAgICBwYXRoLnJldmVyc2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAgY2hlY2tzIGlmIHRoZSBzaWduZWQgYXJlYSBvZiB0aGUgcGF0aCBpcyBwb3NpdGl2ZVxuICAgICAqL1xuICAgIGlzUG9zaXRpdmVQYXRoOiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgIHJldHVybiBwYXRoSGVscGVyLmdldERpcmVjdGlvblBhdGgocGF0aCkgPiAwO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAgY2hlY2tzIGlmIHRoZSBzaWduZWQgYXJlYSBvZiB0aGUgcGF0aCBpcyBuZWdhdGl2ZVxuICAgICAqL1xuICAgIGlzTmVnYXRpdmVQYXRoOiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgIHJldHVybiBwYXRoSGVscGVyLmdldERpcmVjdGlvblBhdGgocGF0aCkgPCAwO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAgZ2V0IHRoZSBkaXJlY3Rpb24gb2YgYW4gYXJhcnkgb2YgcGF0aFxuICAgICAqL1xuICAgIGdldERpcmVjdGlvblBhdGhzOiBmdW5jdGlvbihwYXRocykge1xuICAgICAgICByZXR1cm4gcGF0aHMubWFwKHBhdGhIZWxwZXIuZ2V0RGlyZWN0aW9uUGF0aCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqICBnZXQgdGhlIGRpcmVjdGlvbiBvZiBhIHBhdGhcbiAgICAgKi9cbiAgICBnZXREaXJlY3Rpb25QYXRoOiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgIHJldHVybiAoY2xpcHBlckxpYi5KUy5BcmVhT2ZQb2x5Z29uKHBhdGgpID4gMCkgPyAxIDogLTE7XG4gICAgfSxcblxuICAgIHNjYWxlVXBQYXRoOiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgIGNsaXBwZXJMaWIuSlMuU2NhbGVVcFBhdGgocGF0aCwgMTAwMDApO1xuICAgIH0sXG5cbiAgICBzY2FsZURvd25QYXRoKHBhdGgpIHtcbiAgICAgICAgY2xpcHBlckxpYi5KUy5TY2FsZURvd25QYXRoKHBhdGgsIDEwMDAwKTtcbiAgICB9LFxuICAgIHNjYWxlRG93blBhdGhzKHBhdGhzKSB7XG4gICAgICAgIGNsaXBwZXJMaWIuSlMuU2NhbGVEb3duUGF0aHMocGF0aHMsIDEwMDAwKTtcbiAgICB9LFxuXG4gICAgZ2V0UGF0aEJvdW5kYXJ5OiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgIGxldCBtaW5YID0gcGF0aFswXS5YO1xuICAgICAgICBsZXQgbWluWSA9IHBhdGhbMF0uWTtcbiAgICAgICAgbGV0IG1heFggPSBwYXRoWzBdLlg7XG4gICAgICAgIGxldCBtYXhZID0gcGF0aFswXS5ZO1xuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG1pblggPSBNYXRoLm1pbihtaW5YLCBwYXRoW2ldLlgpO1xuICAgICAgICAgICAgbWF4WCA9IE1hdGgubWF4KG1heFgsIHBhdGhbaV0uWCk7XG4gICAgICAgICAgICBtaW5ZID0gTWF0aC5taW4obWluWSwgcGF0aFtpXS5ZKTtcbiAgICAgICAgICAgIG1heFkgPSBNYXRoLm1heChtYXhZLCBwYXRoW2ldLlkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBYOiB7XG4gICAgICAgICAgICAgICAgbWluOiBtaW5YLFxuICAgICAgICAgICAgICAgIG1heDogbWF4WFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFk6IHtcbiAgICAgICAgICAgICAgICBtaW46IG1pblksXG4gICAgICAgICAgICAgICAgbWF4OiBtYXhZXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldFBhdGhzSW5jbHVkZWQ6IGZ1bmN0aW9uKHBhdGhzT3V0LCBwYXRoc0luKSB7XG5cbiAgICAgICAgZm9yIChsZXQgcGF0aEluIG9mIHBhdGhzSW4pIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgaW4gcGF0aE91dCkge1xuICAgICAgICAgICAgICAgIGlmICghcGF0aEhlbHBlci5pc0luY2x1ZGVkKHBhdGhzT3V0W2ldLCBwYXRoSW4pKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9LFxuXG4gICAgZ2V0TWF0Y2hpbmdFZGdlSW5kZXg6IGZ1bmN0aW9uKHBhdGgsIHBhdGhUb01hdGNoKSB7XG4gICAgICAgIGxldCBwcmV2QWxpZ25lZD1mYWxzZTtcbiAgICAgICAgbGV0IHJlcz17fTtcbiAgICAgICAgZm9yIChsZXQgaSA9IHBhdGgubGVuZ3RoLTE7IGkgPj0wIDsgaS0tKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gcGF0aFRvTWF0Y2gubGVuZ3RoLTE7IGogPj0wIDsgai0tKSB7XG5cbiAgICAgICAgICAgICAgICBsZXQgcDEgPSBwYXRoVG9NYXRjaFtqXTtcbiAgICAgICAgICAgICAgICBsZXQgcDIgPSBwYXRoVG9NYXRjaFsoaiArIDEpICUgcGF0aFRvTWF0Y2gubGVuZ3RoXTtcbiAgICAgICAgICAgICAgICBsZXQgY3VyckFsZ2lnbmVkPSBwYXRoSGVscGVyLmlzQWxpZ25lZChwYXRoW2ldLHBhdGhbKGkrMSklcGF0aC5sZW5ndGhdLHAxLHAyKTtcbiAgICAgICAgICAgICAgICBpZighY3VyckFsZ2lnbmVkJiZwcmV2QWxpZ25lZClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmKGN1cnJBbGdpZ25lZClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJlcz0ge2luZGV4OiBpLCBwb2ludG1hdGNoOnAxIH07XG4gICAgICAgICAgICAgICAgICAgIHByZXZBbGlnbmVkPWN1cnJBbGdpZ25lZDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH0sXG5cbiAgICBpc0FsaWduZWQ6ZnVuY3Rpb24oZTExLGUxMixlMjEsZTIyKXtcbiAgICAgICAgbGV0IGVkZ2UxPSBwYXRoSGVscGVyLmdldEVkZ2UoZTExLGUxMik7XG4gICAgICAgIGxldCBlZGdlMj0gcGF0aEhlbHBlci5nZXRFZGdlKGUxMSxlMjEpO1xuICAgICAgICBsZXQgZWRnZTM9IHBhdGhIZWxwZXIuZ2V0RWRnZShlMTEsZTIyKTtcbiAgICAgICAgcmV0dXJuIHBhdGhIZWxwZXIuaXNDb2xpbmVhcihlZGdlMSxlZGdlMikmJiBwYXRoSGVscGVyLmlzQ29saW5lYXIoZWRnZTEsZWRnZTMpO1xuICAgIH0sXG5cbiAgICBpc0NvbGluZWFyOiBmdW5jdGlvbihlZGdlMSwgZWRnZTIpIHtcbiAgICAgICAgcmV0dXJuIGVkZ2UxLlggKiBlZGdlMi5ZID09PSBlZGdlMS5ZICogZWRnZTIuWDtcbiAgICB9LFxuXG4gICAgZ2V0RWRnZTogZnVuY3Rpb24ocG9pbnQxLCBwb2ludDIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFg6IChwb2ludDIuWCAtIHBvaW50MS5YKSxcbiAgICAgICAgICAgIFk6IChwb2ludDIuWSAtIHBvaW50MS5ZKVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICBpc0luY2x1ZGVkOiBmdW5jdGlvbihwYXRoT3V0LCBwYXRoc0luKSB7XG4gICAgICAgIGxldCB1bmlvbiA9IHBhdGhIZWxwZXIuZ2V0VW5pb25PZlBhdGhzKFtwYXRoT3V0XSwgcGF0aHNJbik7XG4gICAgICAgIGlmICh1bmlvbi5sZW5ndGggPiAxKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiBwYXRoSGVscGVyLmlzUGF0aEVxdWFsKHVuaW9uWzBdLCBwYXRoT3V0KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogcmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIHBvaW50IGluIHBhdGggbWF0Y2hpbmcgd2l0aCBwb2ludFxuICAgICAqXG4gICAgICovXG4gICAgZ2V0UG9pbnRNYXRjaDogZnVuY3Rpb24ocGF0aCwgcG9pbnQsIG9mZnNldFBhdGggPSAwKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSBvZmZzZXRQYXRoOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHBhdGhIZWxwZXIuaXNFcXVhbChwYXRoW2ldLCBwb2ludCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBpbmRleDogaVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZml0UGF0aHNJbnRvUGF0aDogZnVuY3Rpb24ob3V0ZXJQYXRoLCB0b0ZpdFBhdGhzKSB7XG5cbiAgICAgICAgbGV0IHBhdGhzID0gdG9GaXRQYXRocy5wdXNoKG91dGVyUGF0aCk7XG4gICAgICAgIGxldCB1bmlvbiA9IHBhdGhIZWxwZXIuZ2V0VW5pb25PZlBhdGhzKHBhdGhzKTtcbiAgICAgICAgbGV0IGludGVyID0gcGF0aEhlbHBlci5nZXRJbnRlck9mUGF0aHMocGF0aHMpO1xuICAgICAgICBsZXQgeG9yID0gcGF0aEhlbHBlci5nZXRYb3JPZlBhdGhzKHVuaW9uLCBpbnRlcik7XG5cbiAgICAgICAgcmV0dXJuIHBhdGhIZWxwZXIuZ2V0RGlmZk9mUGF0aHMocGF0aHMsIHhvcik7XG5cbiAgICB9LFxuXG4gICAgZ2V0VG9wTGVmdEluZGV4OiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgIGxldCBtaW5JbmRleCA9IDA7XG4gICAgICAgIGxldCBtaW4gPSBwYXRoSGVscGVyLmdldE5vcm1Qb2ludChwYXRoWzBdKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgbm9ybSA9IHBhdGhIZWxwZXIuZ2V0Tm9ybVBvaW50KHBhdGhbaV0pO1xuICAgICAgICAgICAgaWYgKG5vcm0gPCBtaW4pIHtcbiAgICAgICAgICAgICAgICBtaW5JbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgbWluID0gbm9ybTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gK21pbkluZGV4O1xuICAgIH0sXG5cbiAgICBnZXROb3JtUG9pbnQ6IGZ1bmN0aW9uKHBvaW50KSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQocG9pbnQuWCAqIHBvaW50LlggKyBwb2ludC5ZICogcG9pbnQuWSk7XG4gICAgfSxcbiAgICBnZXREaXN0YW5jZTogZnVuY3Rpb24ocG9pbnQxLCBwb2ludDIpIHtcbiAgICAgICAgbGV0IGVkZ2UgPSBwYXRoSGVscGVyLmdldEVkZ2UocG9pbnQxLCBwb2ludDIpO1xuICAgICAgICByZXR1cm4gcGF0aEhlbHBlci5nZXROb3JtUG9pbnQoZWRnZSk7XG4gICAgfSxcblxuICAgIGdldFRvdGFsTGVuZ3RoOiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgIGxldCByZXMgPSAwO1xuICAgICAgICBpZighcGF0aCl7cmV0dXJuIDA7fVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBjdXJyID0gcGF0aFtpXTtcbiAgICAgICAgICAgIGxldCBuZXh0ID0gcGF0aFsoaSArIDEpICUgcGF0aC5sZW5ndGhdO1xuICAgICAgICAgICAgcmVzICs9IHBhdGhIZWxwZXIuZ2V0RGlzdGFuY2UoY3VyciwgbmV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogIGNoZWNrcyBpZiB0d28gcG9pbnRzIGhhdmUgdGhlIHNhbWUgY29vcmRpbmF0ZXNcbiAgICAgKlxuICAgICAqL1xuICAgIGlzRXF1YWw6IGZ1bmN0aW9uKHBvaW50MSwgcG9pbnQyKSB7XG4gICAgICAgIHJldHVybiAocG9pbnQxLlggPT09IHBvaW50Mi5YKSAmJiAocG9pbnQxLlkgPT09IHBvaW50Mi5ZKTtcbiAgICB9LFxuXG4gICAgaXNQYXRoRXF1YWw6IGZ1bmN0aW9uKHBhdGgxLCBwYXRoMikge1xuICAgICAgICBpZiAocGF0aDEubGVuZ3RoICE9PSBwYXRoMi5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgxLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIWlzRXF1YWwocGF0aDFbaV0sIHBhdGgyW2ldKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cblxufTtcbm1vZHVsZS5leHBvcnRzID0gcGF0aEhlbHBlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBwYXRoSGVscGVyID0gcmVxdWlyZShcIi4vcGF0aC1oZWxwZXIuanNcIik7XG5cblxudmFyIHV2SGVscGVyID0ge1xuXG4gICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRmlyc3QgcGFyYWR5Z206IG1hcCBvbiB2ZXJ0aXZhbCBhbmQgaG9yaXpvbnRhbCBpbmRlcGVuZGFudGx5LlxuICAgICAgICBEb24ndCBjYXJlIGFib3V0IGRpc2NvbnRpbnVpdGllcyBiZXR3ZWVuIHZlcnRpY2FsIGFuZCBob3Jpem9udGFsLlxuICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAgIGdldFVWSG9yRmFjZXM6IGZ1bmN0aW9uKHBhdGhzQnlEZXB0aCxvdXRlclNoYXBlLCBob3Jpem9udGFsR2VvbSkge1xuICAgICAgICBsZXQgcG9pbnRzID0gaG9yaXpvbnRhbEdlb20ucG9pbnRzO1xuICAgICAgICBsZXQgYm91bmRhcmllcz0gdXZIZWxwZXIuZ2V0Qm91bmRhcmllcyhwYXRoc0J5RGVwdGgsb3V0ZXJTaGFwZSk7XG5cbiAgICAgICAgbGV0IHV2ID0gdXZIZWxwZXIubWFwSG9yaXpvbnRhbChwYXRoc0J5RGVwdGgsb3V0ZXJTaGFwZSxib3VuZGFyaWVzLCBwb2ludHMpO1xuICAgICAgICB1dkhlbHBlci5hZGRVdlRvR2VvbSh1diwgaG9yaXpvbnRhbEdlb20pO1xuICAgIH0sXG5cblxuXG4gICAgbWFwSG9yaXpvbnRhbDogZnVuY3Rpb24ocGF0aHNCeURlcHRoLG91dGVyU2hhcGUsYm91bmRhcmllcywgcG9pbnRzKSB7XG4gICAgICAgIGxldCByZXMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgICAgIGxldCBwb2ludCA9IHBvaW50cy5zbGljZShpLCBpICsgMyk7XG4gICAgICAgICAgICByZXMucHVzaCguLi51dkhlbHBlci5nZXRVVkZyb21Ib3JyUG9pbnQoYm91bmRhcmllcywgcG9pbnQpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cbiAgICBtYXBWZXJ0aWNhbDogZnVuY3Rpb24ocGF0aHNCeURlcHRoLG91dGVyU2hhcGUsb3B0aW9ucykge1xuXG4gICAgICAgIC8vZGV0ZXJtaW5lIHRoZSBpbnRlcnBvbGF0aW9uIGZ1bmN0aW9uOlxuICAgICAgICBsZXQgYm91bmRhcmllcz0gdXZIZWxwZXIuZ2V0Qm91bmRhcmllcyhwYXRoc0J5RGVwdGgsIG91dGVyU2hhcGUsb3B0aW9ucylcbiAgICAgICAgLy9mb3IgZWFjaCBkZXB0aDogY29uc3RydWN0cyB0aGUgdXZzOlxuXG4gICAgICAgIGZvciAobGV0IGRlcHRoIGluIHBhdGhzQnlEZXB0aCkge1xuICAgICAgICAgICAgbGV0IHBhdGhzQXREZXB0aCA9IHBhdGhzQnlEZXB0aFtkZXB0aF07XG4gICAgICAgICAgICBmb3IgKGxldCBpIGluIHBhdGhzQXREZXB0aC5wYXRocykge1xuICAgICAgICAgICAgICAgIHV2SGVscGVyLmdldFV2c1ZlcnRQYXRoKGksIHBhdGhzQnlEZXB0aCwgK2RlcHRoLCBib3VuZGFyaWVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgfSxcblxuICAgIGdldEJvdW5kYXJpZXM6IGZ1bmN0aW9uKHBhdGhzQnlEZXB0aCxvdXRlclNoYXBlKVxuICAgIHtcbiAgICAgICAgbGV0IGJvdW5kYXJ5O1xuICAgICAgICBsZXQgYm91bmRhcnlUZXg7XG4gICAgICAgIGlmKCFvcHRpb25zLnJhdGlvKVxuICAgICAgICB7XG4gICAgICAgICAgICBsZXQgbWF4TGVuZ3RoID0gdXZIZWxwZXIuZ2V0TWF4UGF0aExlbmd0aChwYXRoc0J5RGVwdGgpO1xuICAgICAgICAgICAgbWF4TGVuZ3RoPSBNYXRoLm1heChwYXRoSGVscGVyLmdldFRvdGFsTGVuZ3RoKG91dGVyU2hhcGUucGF0aCkpO1xuICAgICAgICAgICAgbGV0IG1heERlcHRoPSBvdXRlclNoYXBlLmRlcHRoO1xuICAgICAgICAgICAgbGV0IG1heD0gTWF0aC5tYXgobWF4TGVuZ3RoLG1heERlcHRoKTtcbiAgICAgICAgICAgIGJvdW5kYXJ5PSB7WFk6e21pbjowLCBtYXg6bWF4fSAsWjp7bWluOjAsbWF4Om1heH19O1xuICAgICAgICAgICAgYm91bmRhcnlUZXg9IHtVOnttaW46MCwgbWF4OjF9ICxWOnttaW46MCxtYXg6MX19O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtib3VuZGFyeTpib3VuZGFyeSxib3VuZGFyeVRleDpib3VuZGFyeVRleH07XG4gICAgfSxcblxuXG4gICAgZ2V0VVZPdXRlclNoYXBlOmZ1bmN0aW9uKHBhdGhzQnlEZXB0aCxvdXRlclNoYXBlLG9wdGlvbnMpXG4gICAge1xuICAgICAgICBsZXQgYm91bmRhcmllcz0gdXZIZWxwZXIuZ2V0Qm91bmRhcmllcyhwYXRoc0J5RGVwdGgsIG91dGVyU2hhcGUsb3B0aW9ucyk7XG4gICAgICAgIGxldCBwYXRoID0gb3V0ZXJTaGFwZS5wYXRoO1xuICAgICAgICBsZXQgcGF0aENvcHk9SlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShwYXRoKSk7XG4gICAgICAgIGxldCBvZmZzZXQgPSB7aW5kZXg6MCxkaXN0YW5jZTowLHU6MH07XG5cbiAgICAgICAgdXZIZWxwZXIuaW50ZXJwb2xhdGVQYXRoKHBhdGgsIGJvdW5kYXJpZXMsb2Zmc2V0LDApO1xuICAgICAgICB1dkhlbHBlci5pbnRlcnBvbGF0ZVBhdGgocGF0aENvcHksIGJvdW5kYXJpZXMsb2Zmc2V0LG91dGVyU2hhcGUuZGVwdGgpO1xuICAgICAgICBmb3IobGV0IGkgaW4gcGF0aClcbiAgICAgICAge1xuICAgICAgICAgICAgcGF0aFtpXS5WRG93bj0gcGF0aENvcHlbaV0uVVZbMV07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0VXZzVmVydFBhdGg6IGZ1bmN0aW9uKGluZFBhdGgsIHBhdGhzQnlEZXB0aCwgaW5kZXhEZXB0aCxib3VuZGFyaWVzKSB7XG4gICAgICAgIGxldCBwYXRoc0F0RGVwdGggPSBwYXRoc0J5RGVwdGhbaW5kZXhEZXB0aF07XG4gICAgICAgIGxldCBwYXRoID0gcGF0aHNBdERlcHRoLnBhdGhzW2luZFBhdGhdO1xuXG4gICAgICAgIC8vZmluZHMgaW50byB0aGUgdXBwZXIgcGF0aHMgaWYgdGhlcmUgaXMgYSBtYXRjaGluZyBlZGdlXG4gICAgICAgIGxldCBtYXRjaDtcbiAgICAgICAgZm9yIChsZXQgaSA9IGluZGV4RGVwdGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgZm9yIChsZXQgaiBpbiBwYXRoc0J5RGVwdGhbaV0ucGF0aHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgcGF0aFRvTWF0Y2ggPSBwYXRoc0J5RGVwdGhbaV0ucGF0aHNbal07XG4gICAgICAgICAgICAgICAgbWF0Y2ggPSBwYXRoSGVscGVyLmdldE1hdGNoaW5nRWRnZUluZGV4KHBhdGgsIHBhdGhUb01hdGNoKTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgaSA9IC0xO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG9mZnNldCA9IHtpbmRleDowLGRpc3RhbmNlOjAsdTowfTtcbiAgICAgICAgLy9pZiBzbywgb2Zmc2V0cyBpdCB0byBrZWVwIGEgbWF4IG9mIGNvbnRpbnVpdHkgYmVsb25nIFpcbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICBvZmZzZXQuZGlzdGFuY2U9IHBhdGhIZWxwZXIuZ2V0RGlzdGFuY2UocGF0aFttYXRjaC5pbmRleF0sbWF0Y2gucG9pbnRtYXRjaCk7XG4gICAgICAgICAgICBvZmZzZXQuaW5kZXg9IG1hdGNoLmluZGV4O1xuICAgICAgICAgICAgb2Zmc2V0LnU9IG1hdGNoLnBvaW50bWF0Y2guVVZbMF07XG4gICAgICAgIH1cblxuICAgICAgICAvL2ludGVycG9sYXRlc1xuICAgICAgICB1dkhlbHBlci5pbnRlcnBvbGF0ZVBhdGgocGF0aCxib3VuZGFyaWVzLG9mZnNldCxwYXRoc0F0RGVwdGguZGVwdGgpO1xuICAgIH0sXG5cbiAgICBpbnRlcnBvbGF0ZVBhdGg6ZnVuY3Rpb24ocGF0aCwgYm91bmRhcmllcyxvZmZzZXQsZGVwdGggKVxuICAgIHtcbiAgICAgICAgbGV0IGRpc3Q9MDtcbiAgICAgICAgbGV0IHN0YXJ0SW5kZXg9IG9mZnNldC5pbmRleDtcbiAgICAgICAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPCBwYXRoLmxlbmd0aCtzdGFydEluZGV4OyBpKyspIHtcbiAgICAgICAgICAgIGxldCB2YWx1ZVU9IChkaXN0K29mZnNldC5kaXN0YW5jZSk7XG4gICAgICAgICAgICBsZXQgdmFsdWVWPWRlcHRoIDtcbiAgICAgICAgICAgIC8vIHV2SGVscGVyLmFkZFVWVG9QdChwYXRoW2klcGF0aC5sZW5ndGhdLCB2YWx1ZVUsdmFsdWVWLCBib3VuZGFyeSxib3VuZGFyeVRleCk7XG4gICAgICAgICAgICBsZXQgdT0gdXZIZWxwZXIuaW50ZXJwb2xhdGUoYm91bmRhcmllcy5ib3VuZGFyeS5YWSwgYm91bmRhcmllcy5ib3VuZGFyeVRleC5VLHZhbHVlVSk7XG4gICAgICAgICAgICBsZXQgdj0gdXZIZWxwZXIuaW50ZXJwb2xhdGUoYm91bmRhcmllcy5ib3VuZGFyeS5aLCBib3VuZGFyaWVzLmJvdW5kYXJ5VGV4LlYsdmFsdWVWKTtcbiAgICAgICAgICAgIHBhdGhbaSVwYXRoLmxlbmd0aF0uVVY9W3Usdl07XG4gICAgICAgICAgICBkaXN0ID0gZGlzdCArIHBhdGhIZWxwZXIuZ2V0RGlzdGFuY2UocGF0aFtpJXBhdGgubGVuZ3RoXSwgcGF0aFsoaSArIDEpICUgcGF0aC5sZW5ndGhdKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdmFsdWVVPSAoZGlzdCtvZmZzZXQuZGlzdGFuY2UpO1xuICAgICAgICBsZXQgdmFsdWVWPWRlcHRoO1xuICAgICAgICBsZXQgdT0gdXZIZWxwZXIuaW50ZXJwb2xhdGUoYm91bmRhcmllcy5ib3VuZGFyeS5YWSwgYm91bmRhcmllcy5ib3VuZGFyeVRleC5VLHZhbHVlVSk7XG4gICAgICAgIGxldCB2PSB1dkhlbHBlci5pbnRlcnBvbGF0ZShib3VuZGFyaWVzLmJvdW5kYXJ5LlosIGJvdW5kYXJpZXMuYm91bmRhcnlUZXguVix2YWx1ZVYpO1xuICAgICAgICBwYXRoW3N0YXJ0SW5kZXhdLlVWMj1bdSx2XTtcbiAgICB9LFxuXG4gICAgZ2V0TWF4UGF0aExlbmd0aDpmdW5jdGlvbihwYXRoc0J5RGVwdGgpe1xuICAgICAgICBsZXQgbWF4PTA7XG4gICAgICAgIGZvcihsZXQgaSBpbiBwYXRoc0J5RGVwdGgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIG1heD0gTWF0aC5tYXgobWF4LCAgTWF0aC5tYXgocGF0aEhlbHBlci5nZXRUb3RhbExlbmd0aCguLi5wYXRoc0J5RGVwdGhbaV0ucGF0aHMpKSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWF4O1xuICAgIH0sXG5cbiAgICBnZXRVVkZyb21Ib3JyUG9pbnQ6IGZ1bmN0aW9uKGJvdW5kYXJpZXMsIHBvaW50KSB7XG4gICAgICAgIGxldCBVID0gdXZIZWxwZXIuaW50ZXJwb2xhdGUoYm91bmRhcmllcy5ib3VuZGFyeS5YWSwgYm91bmRhcmllcy5ib3VuZGFyeVRleC5VLCBwb2ludFswXSk7XG4gICAgICAgIGxldCBWID0gdXZIZWxwZXIuaW50ZXJwb2xhdGUoYm91bmRhcmllcy5ib3VuZGFyeS5aLCBib3VuZGFyaWVzLmJvdW5kYXJ5VGV4LlYsIHBvaW50WzFdKTtcblxuICAgICAgICByZXR1cm4gW1UsIFZdO1xuXG4gICAgfSxcblxuICAgIGludGVycG9sYXRlOiBmdW5jdGlvbihib3VuZGFyeVNyYywgYm91bmRhcnlEc3QsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiAodmFsdWUgLSBib3VuZGFyeVNyYy5taW4pIC8gKGJvdW5kYXJ5U3JjLm1heCAtIGJvdW5kYXJ5U3JjLm1pbikgKiAoYm91bmRhcnlEc3QubWF4IC0gYm91bmRhcnlEc3QubWluKSArIGJvdW5kYXJ5RHN0Lm1pbjtcbiAgICB9LFxuXG4gICAgYWRkVXZzVG9HZW9tczogZnVuY3Rpb24odXZzLCBnZW9tcykge1xuICAgICAgICBmb3IgKGxldCBpIGluIGdlb21zKSB7XG4gICAgICAgICAgICBsZXQgdXYgPSBbXVxuICAgICAgICAgICAgaWYgKGdlb21zW2ldLnV2KSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXV2c1tpXSkge1xuICAgICAgICAgICAgICAgIHV2ID0gQXJyYXkoMiAqIGdlb21zW2ldLnBvaW50cy5sZW5ndGggLyAzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBnZW9tc1tpXS51dnMgPSB1djtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhZGRVdlRvR2VvbTogZnVuY3Rpb24odXZzLCBnZW9tKSB7XG4gICAgICAgIGlmIChnZW9tLnV2cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdXZzIHx8IHV2cy5sZW5ndGggPT09MCkge3V2cyA9IG5ldyBBcnJheSgyICogZ2VvbS5wb2ludHMubGVuZ3RoIC8gMykuZmlsbCgwKTt9XG4gICAgICAgIGdlb20udXZzID0gdXZzO1xuICAgIH0sXG5cblxuICAgIGdldE8xQm91ZG5hcnlUZXg6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgWDoge1xuICAgICAgICAgICAgICAgIG1pbjogMCxcbiAgICAgICAgICAgICAgICBtYXg6IDFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBZOiB7XG4gICAgICAgICAgICAgICAgbWluOiAwLFxuICAgICAgICAgICAgICAgIG1heDogMVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgfVxuXG59O1xubW9kdWxlLmV4cG9ydHMgPSB1dkhlbHBlcjtcbiIsIlwidXNlIHN0cmljdFwiXG5cbmZ1bmN0aW9uIGNvbXBpbGVTZWFyY2goZnVuY05hbWUsIHByZWRpY2F0ZSwgcmV2ZXJzZWQsIGV4dHJhQXJncywgZWFybHlPdXQpIHtcbiAgdmFyIGNvZGUgPSBbXG4gICAgXCJmdW5jdGlvbiBcIiwgZnVuY05hbWUsIFwiKGEsbCxoLFwiLCBleHRyYUFyZ3Muam9pbihcIixcIiksICBcIil7XCIsXG5lYXJseU91dCA/IFwiXCIgOiBcInZhciBpPVwiLCAocmV2ZXJzZWQgPyBcImwtMVwiIDogXCJoKzFcIiksXG5cIjt3aGlsZShsPD1oKXtcXFxudmFyIG09KGwraCk+Pj4xLHg9YVttXVwiXVxuICBpZihlYXJseU91dCkge1xuICAgIGlmKHByZWRpY2F0ZS5pbmRleE9mKFwiY1wiKSA8IDApIHtcbiAgICAgIGNvZGUucHVzaChcIjtpZih4PT09eSl7cmV0dXJuIG19ZWxzZSBpZih4PD15KXtcIilcbiAgICB9IGVsc2Uge1xuICAgICAgY29kZS5wdXNoKFwiO3ZhciBwPWMoeCx5KTtpZihwPT09MCl7cmV0dXJuIG19ZWxzZSBpZihwPD0wKXtcIilcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29kZS5wdXNoKFwiO2lmKFwiLCBwcmVkaWNhdGUsIFwiKXtpPW07XCIpXG4gIH1cbiAgaWYocmV2ZXJzZWQpIHtcbiAgICBjb2RlLnB1c2goXCJsPW0rMX1lbHNle2g9bS0xfVwiKVxuICB9IGVsc2Uge1xuICAgIGNvZGUucHVzaChcImg9bS0xfWVsc2V7bD1tKzF9XCIpXG4gIH1cbiAgY29kZS5wdXNoKFwifVwiKVxuICBpZihlYXJseU91dCkge1xuICAgIGNvZGUucHVzaChcInJldHVybiAtMX07XCIpXG4gIH0gZWxzZSB7XG4gICAgY29kZS5wdXNoKFwicmV0dXJuIGl9O1wiKVxuICB9XG4gIHJldHVybiBjb2RlLmpvaW4oXCJcIilcbn1cblxuZnVuY3Rpb24gY29tcGlsZUJvdW5kc1NlYXJjaChwcmVkaWNhdGUsIHJldmVyc2VkLCBzdWZmaXgsIGVhcmx5T3V0KSB7XG4gIHZhciByZXN1bHQgPSBuZXcgRnVuY3Rpb24oW1xuICBjb21waWxlU2VhcmNoKFwiQVwiLCBcInhcIiArIHByZWRpY2F0ZSArIFwieVwiLCByZXZlcnNlZCwgW1wieVwiXSwgZWFybHlPdXQpLFxuICBjb21waWxlU2VhcmNoKFwiUFwiLCBcImMoeCx5KVwiICsgcHJlZGljYXRlICsgXCIwXCIsIHJldmVyc2VkLCBbXCJ5XCIsIFwiY1wiXSwgZWFybHlPdXQpLFxuXCJmdW5jdGlvbiBkaXNwYXRjaEJzZWFyY2hcIiwgc3VmZml4LCBcIihhLHksYyxsLGgpe1xcXG5pZih0eXBlb2YoYyk9PT0nZnVuY3Rpb24nKXtcXFxucmV0dXJuIFAoYSwobD09PXZvaWQgMCk/MDpsfDAsKGg9PT12b2lkIDApP2EubGVuZ3RoLTE6aHwwLHksYylcXFxufWVsc2V7XFxcbnJldHVybiBBKGEsKGM9PT12b2lkIDApPzA6Y3wwLChsPT09dm9pZCAwKT9hLmxlbmd0aC0xOmx8MCx5KVxcXG59fVxcXG5yZXR1cm4gZGlzcGF0Y2hCc2VhcmNoXCIsIHN1ZmZpeF0uam9pbihcIlwiKSlcbiAgcmV0dXJuIHJlc3VsdCgpXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZTogY29tcGlsZUJvdW5kc1NlYXJjaChcIj49XCIsIGZhbHNlLCBcIkdFXCIpLFxuICBndDogY29tcGlsZUJvdW5kc1NlYXJjaChcIj5cIiwgZmFsc2UsIFwiR1RcIiksXG4gIGx0OiBjb21waWxlQm91bmRzU2VhcmNoKFwiPFwiLCB0cnVlLCBcIkxUXCIpLFxuICBsZTogY29tcGlsZUJvdW5kc1NlYXJjaChcIjw9XCIsIHRydWUsIFwiTEVcIiksXG4gIGVxOiBjb21waWxlQm91bmRzU2VhcmNoKFwiLVwiLCB0cnVlLCBcIkVRXCIsIHRydWUpXG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIG1vbm90b25lVHJpYW5ndWxhdGUgPSByZXF1aXJlKCcuL2xpYi9tb25vdG9uZScpXG52YXIgbWFrZUluZGV4ID0gcmVxdWlyZSgnLi9saWIvdHJpYW5ndWxhdGlvbicpXG52YXIgZGVsYXVuYXlGbGlwID0gcmVxdWlyZSgnLi9saWIvZGVsYXVuYXknKVxudmFyIGZpbHRlclRyaWFuZ3VsYXRpb24gPSByZXF1aXJlKCcuL2xpYi9maWx0ZXInKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNkdDJkXG5cbmZ1bmN0aW9uIGNhbm9uaWNhbGl6ZUVkZ2UoZSkge1xuICByZXR1cm4gW01hdGgubWluKGVbMF0sIGVbMV0pLCBNYXRoLm1heChlWzBdLCBlWzFdKV1cbn1cblxuZnVuY3Rpb24gY29tcGFyZUVkZ2UoYSwgYikge1xuICByZXR1cm4gYVswXS1iWzBdIHx8IGFbMV0tYlsxXVxufVxuXG5mdW5jdGlvbiBjYW5vbmljYWxpemVFZGdlcyhlZGdlcykge1xuICByZXR1cm4gZWRnZXMubWFwKGNhbm9uaWNhbGl6ZUVkZ2UpLnNvcnQoY29tcGFyZUVkZ2UpXG59XG5cbmZ1bmN0aW9uIGdldERlZmF1bHQob3B0aW9ucywgcHJvcGVydHksIGRmbHQpIHtcbiAgaWYocHJvcGVydHkgaW4gb3B0aW9ucykge1xuICAgIHJldHVybiBvcHRpb25zW3Byb3BlcnR5XVxuICB9XG4gIHJldHVybiBkZmx0XG59XG5cbmZ1bmN0aW9uIGNkdDJkKHBvaW50cywgZWRnZXMsIG9wdGlvbnMpIHtcblxuICBpZighQXJyYXkuaXNBcnJheShlZGdlcykpIHtcbiAgICBvcHRpb25zID0gZWRnZXMgfHwge31cbiAgICBlZGdlcyA9IFtdXG4gIH0gZWxzZSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgICBlZGdlcyA9IGVkZ2VzIHx8IFtdXG4gIH1cblxuICAvL1BhcnNlIG91dCBvcHRpb25zXG4gIHZhciBkZWxhdW5heSA9ICEhZ2V0RGVmYXVsdChvcHRpb25zLCAnZGVsYXVuYXknLCB0cnVlKVxuICB2YXIgaW50ZXJpb3IgPSAhIWdldERlZmF1bHQob3B0aW9ucywgJ2ludGVyaW9yJywgdHJ1ZSlcbiAgdmFyIGV4dGVyaW9yID0gISFnZXREZWZhdWx0KG9wdGlvbnMsICdleHRlcmlvcicsIHRydWUpXG4gIHZhciBpbmZpbml0eSA9ICEhZ2V0RGVmYXVsdChvcHRpb25zLCAnaW5maW5pdHknLCBmYWxzZSlcblxuICAvL0hhbmRsZSB0cml2aWFsIGNhc2VcbiAgaWYoKCFpbnRlcmlvciAmJiAhZXh0ZXJpb3IpIHx8IHBvaW50cy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gW11cbiAgfVxuXG4gIC8vQ29uc3RydWN0IGluaXRpYWwgdHJpYW5ndWxhdGlvblxuICB2YXIgY2VsbHMgPSBtb25vdG9uZVRyaWFuZ3VsYXRlKHBvaW50cywgZWRnZXMpXG5cbiAgLy9JZiBkZWxhdW5heSByZWZpbmVtZW50IG5lZWRlZCwgdGhlbiBpbXByb3ZlIHF1YWxpdHkgYnkgZWRnZSBmbGlwcGluZ1xuICBpZihkZWxhdW5heSB8fCBpbnRlcmlvciAhPT0gZXh0ZXJpb3IgfHwgaW5maW5pdHkpIHtcblxuICAgIC8vSW5kZXggYWxsIG9mIHRoZSBjZWxscyB0byBzdXBwb3J0IGZhc3QgbmVpZ2hib3Job29kIHF1ZXJpZXNcbiAgICB2YXIgdHJpYW5ndWxhdGlvbiA9IG1ha2VJbmRleChwb2ludHMubGVuZ3RoLCBjYW5vbmljYWxpemVFZGdlcyhlZGdlcykpXG4gICAgZm9yKHZhciBpPTA7IGk8Y2VsbHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBmID0gY2VsbHNbaV1cbiAgICAgIHRyaWFuZ3VsYXRpb24uYWRkVHJpYW5nbGUoZlswXSwgZlsxXSwgZlsyXSlcbiAgICB9XG5cbiAgICAvL1J1biBlZGdlIGZsaXBwaW5nXG4gICAgaWYoZGVsYXVuYXkpIHtcbiAgICAgIGRlbGF1bmF5RmxpcChwb2ludHMsIHRyaWFuZ3VsYXRpb24pXG4gICAgfVxuXG4gICAgLy9GaWx0ZXIgcG9pbnRzXG4gICAgaWYoIWV4dGVyaW9yKSB7XG4gICAgICByZXR1cm4gZmlsdGVyVHJpYW5ndWxhdGlvbih0cmlhbmd1bGF0aW9uLCAtMSlcbiAgICB9IGVsc2UgaWYoIWludGVyaW9yKSB7XG4gICAgICByZXR1cm4gZmlsdGVyVHJpYW5ndWxhdGlvbih0cmlhbmd1bGF0aW9uLCAgMSwgaW5maW5pdHkpXG4gICAgfSBlbHNlIGlmKGluZmluaXR5KSB7XG4gICAgICByZXR1cm4gZmlsdGVyVHJpYW5ndWxhdGlvbih0cmlhbmd1bGF0aW9uLCAwLCBpbmZpbml0eSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRyaWFuZ3VsYXRpb24uY2VsbHMoKVxuICAgIH1cbiAgICBcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY2VsbHNcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBpbkNpcmNsZSA9IHJlcXVpcmUoJ3JvYnVzdC1pbi1zcGhlcmUnKVs0XVxudmFyIGJzZWFyY2ggPSByZXF1aXJlKCdiaW5hcnktc2VhcmNoLWJvdW5kcycpXG5cbm1vZHVsZS5leHBvcnRzID0gZGVsYXVuYXlSZWZpbmVcblxuZnVuY3Rpb24gdGVzdEZsaXAocG9pbnRzLCB0cmlhbmd1bGF0aW9uLCBzdGFjaywgYSwgYiwgeCkge1xuICB2YXIgeSA9IHRyaWFuZ3VsYXRpb24ub3Bwb3NpdGUoYSwgYilcblxuICAvL1Rlc3QgYm91bmRhcnkgZWRnZVxuICBpZih5IDwgMCkge1xuICAgIHJldHVyblxuICB9XG5cbiAgLy9Td2FwIGVkZ2UgaWYgb3JkZXIgZmxpcHBlZFxuICBpZihiIDwgYSkge1xuICAgIHZhciB0bXAgPSBhXG4gICAgYSA9IGJcbiAgICBiID0gdG1wXG4gICAgdG1wID0geFxuICAgIHggPSB5XG4gICAgeSA9IHRtcFxuICB9XG5cbiAgLy9UZXN0IGlmIGVkZ2UgaXMgY29uc3RyYWluZWRcbiAgaWYodHJpYW5ndWxhdGlvbi5pc0NvbnN0cmFpbnQoYSwgYikpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIC8vVGVzdCBpZiBlZGdlIGlzIGRlbGF1bmF5XG4gIGlmKGluQ2lyY2xlKHBvaW50c1thXSwgcG9pbnRzW2JdLCBwb2ludHNbeF0sIHBvaW50c1t5XSkgPCAwKSB7XG4gICAgc3RhY2sucHVzaChhLCBiKVxuICB9XG59XG5cbi8vQXNzdW1lIGVkZ2VzIGFyZSBzb3J0ZWQgbGV4aWNvZ3JhcGhpY2FsbHlcbmZ1bmN0aW9uIGRlbGF1bmF5UmVmaW5lKHBvaW50cywgdHJpYW5ndWxhdGlvbikge1xuICB2YXIgc3RhY2sgPSBbXVxuXG4gIHZhciBudW1Qb2ludHMgPSBwb2ludHMubGVuZ3RoXG4gIHZhciBzdGFycyA9IHRyaWFuZ3VsYXRpb24uc3RhcnNcbiAgZm9yKHZhciBhPTA7IGE8bnVtUG9pbnRzOyArK2EpIHtcbiAgICB2YXIgc3RhciA9IHN0YXJzW2FdXG4gICAgZm9yKHZhciBqPTE7IGo8c3Rhci5sZW5ndGg7IGorPTIpIHtcbiAgICAgIHZhciBiID0gc3RhcltqXVxuXG4gICAgICAvL0lmIG9yZGVyIGlzIG5vdCBjb25zaXN0ZW50LCB0aGVuIHNraXAgZWRnZVxuICAgICAgaWYoYiA8IGEpIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy9DaGVjayBpZiBlZGdlIGlzIGNvbnN0cmFpbmVkXG4gICAgICBpZih0cmlhbmd1bGF0aW9uLmlzQ29uc3RyYWludChhLCBiKSkge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvL0ZpbmQgb3Bwb3NpdGUgZWRnZVxuICAgICAgdmFyIHggPSBzdGFyW2otMV0sIHkgPSAtMVxuICAgICAgZm9yKHZhciBrPTE7IGs8c3Rhci5sZW5ndGg7IGsrPTIpIHtcbiAgICAgICAgaWYoc3RhcltrLTFdID09PSBiKSB7XG4gICAgICAgICAgeSA9IHN0YXJba11cbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vSWYgdGhpcyBpcyBhIGJvdW5kYXJ5IGVkZ2UsIGRvbid0IGZsaXAgaXRcbiAgICAgIGlmKHkgPCAwKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vSWYgZWRnZSBpcyBpbiBjaXJjbGUsIGZsaXAgaXRcbiAgICAgIGlmKGluQ2lyY2xlKHBvaW50c1thXSwgcG9pbnRzW2JdLCBwb2ludHNbeF0sIHBvaW50c1t5XSkgPCAwKSB7XG4gICAgICAgIHN0YWNrLnB1c2goYSwgYilcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB3aGlsZShzdGFjay5sZW5ndGggPiAwKSB7XG4gICAgdmFyIGIgPSBzdGFjay5wb3AoKVxuICAgIHZhciBhID0gc3RhY2sucG9wKClcblxuICAgIC8vRmluZCBvcHBvc2l0ZSBwYWlyc1xuICAgIHZhciB4ID0gLTEsIHkgPSAtMVxuICAgIHZhciBzdGFyID0gc3RhcnNbYV1cbiAgICBmb3IodmFyIGk9MTsgaTxzdGFyLmxlbmd0aDsgaSs9Mikge1xuICAgICAgdmFyIHMgPSBzdGFyW2ktMV1cbiAgICAgIHZhciB0ID0gc3RhcltpXVxuICAgICAgaWYocyA9PT0gYikge1xuICAgICAgICB5ID0gdFxuICAgICAgfSBlbHNlIGlmKHQgPT09IGIpIHtcbiAgICAgICAgeCA9IHNcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL0lmIHgveSBhcmUgYm90aCB2YWxpZCB0aGVuIHNraXAgZWRnZVxuICAgIGlmKHggPCAwIHx8IHkgPCAwKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIC8vSWYgZWRnZSBpcyBub3cgZGVsYXVuYXksIHRoZW4gZG9uJ3QgZmxpcCBpdFxuICAgIGlmKGluQ2lyY2xlKHBvaW50c1thXSwgcG9pbnRzW2JdLCBwb2ludHNbeF0sIHBvaW50c1t5XSkgPj0gMCkge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICAvL0ZsaXAgdGhlIGVkZ2VcbiAgICB0cmlhbmd1bGF0aW9uLmZsaXAoYSwgYilcblxuICAgIC8vVGVzdCBmbGlwcGluZyBuZWlnaGJvcmluZyBlZGdlc1xuICAgIHRlc3RGbGlwKHBvaW50cywgdHJpYW5ndWxhdGlvbiwgc3RhY2ssIHgsIGEsIHkpXG4gICAgdGVzdEZsaXAocG9pbnRzLCB0cmlhbmd1bGF0aW9uLCBzdGFjaywgYSwgeSwgeClcbiAgICB0ZXN0RmxpcChwb2ludHMsIHRyaWFuZ3VsYXRpb24sIHN0YWNrLCB5LCBiLCB4KVxuICAgIHRlc3RGbGlwKHBvaW50cywgdHJpYW5ndWxhdGlvbiwgc3RhY2ssIGIsIHgsIHkpXG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgYnNlYXJjaCA9IHJlcXVpcmUoJ2JpbmFyeS1zZWFyY2gtYm91bmRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzc2lmeUZhY2VzXG5cbmZ1bmN0aW9uIEZhY2VJbmRleChjZWxscywgbmVpZ2hib3IsIGNvbnN0cmFpbnQsIGZsYWdzLCBhY3RpdmUsIG5leHQsIGJvdW5kYXJ5KSB7XG4gIHRoaXMuY2VsbHMgICAgICAgPSBjZWxsc1xuICB0aGlzLm5laWdoYm9yICAgID0gbmVpZ2hib3JcbiAgdGhpcy5mbGFncyAgICAgICA9IGZsYWdzXG4gIHRoaXMuY29uc3RyYWludCAgPSBjb25zdHJhaW50XG4gIHRoaXMuYWN0aXZlICAgICAgPSBhY3RpdmVcbiAgdGhpcy5uZXh0ICAgICAgICA9IG5leHRcbiAgdGhpcy5ib3VuZGFyeSAgICA9IGJvdW5kYXJ5XG59XG5cbnZhciBwcm90byA9IEZhY2VJbmRleC5wcm90b3R5cGVcblxuZnVuY3Rpb24gY29tcGFyZUNlbGwoYSwgYikge1xuICByZXR1cm4gYVswXSAtIGJbMF0gfHxcbiAgICAgICAgIGFbMV0gLSBiWzFdIHx8XG4gICAgICAgICBhWzJdIC0gYlsyXVxufVxuXG5wcm90by5sb2NhdGUgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBrZXkgPSBbMCwwLDBdXG4gIHJldHVybiBmdW5jdGlvbihhLCBiLCBjKSB7XG4gICAgdmFyIHggPSBhLCB5ID0gYiwgeiA9IGNcbiAgICBpZihiIDwgYykge1xuICAgICAgaWYoYiA8IGEpIHtcbiAgICAgICAgeCA9IGJcbiAgICAgICAgeSA9IGNcbiAgICAgICAgeiA9IGFcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYoYyA8IGEpIHtcbiAgICAgIHggPSBjXG4gICAgICB5ID0gYVxuICAgICAgeiA9IGJcbiAgICB9XG4gICAgaWYoeCA8IDApIHtcbiAgICAgIHJldHVybiAtMVxuICAgIH1cbiAgICBrZXlbMF0gPSB4XG4gICAga2V5WzFdID0geVxuICAgIGtleVsyXSA9IHpcbiAgICByZXR1cm4gYnNlYXJjaC5lcSh0aGlzLmNlbGxzLCBrZXksIGNvbXBhcmVDZWxsKVxuICB9XG59KSgpXG5cbmZ1bmN0aW9uIGluZGV4Q2VsbHModHJpYW5ndWxhdGlvbiwgaW5maW5pdHkpIHtcbiAgLy9GaXJzdCBnZXQgY2VsbHMgYW5kIGNhbm9uaWNhbGl6ZVxuICB2YXIgY2VsbHMgPSB0cmlhbmd1bGF0aW9uLmNlbGxzKClcbiAgdmFyIG5jID0gY2VsbHMubGVuZ3RoXG4gIGZvcih2YXIgaT0wOyBpPG5jOyArK2kpIHtcbiAgICB2YXIgYyA9IGNlbGxzW2ldXG4gICAgdmFyIHggPSBjWzBdLCB5ID0gY1sxXSwgeiA9IGNbMl1cbiAgICBpZih5IDwgeikge1xuICAgICAgaWYoeSA8IHgpIHtcbiAgICAgICAgY1swXSA9IHlcbiAgICAgICAgY1sxXSA9IHpcbiAgICAgICAgY1syXSA9IHhcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYoeiA8IHgpIHtcbiAgICAgIGNbMF0gPSB6XG4gICAgICBjWzFdID0geFxuICAgICAgY1syXSA9IHlcbiAgICB9XG4gIH1cbiAgY2VsbHMuc29ydChjb21wYXJlQ2VsbClcblxuICAvL0luaXRpYWxpemUgZmxhZyBhcnJheVxuICB2YXIgZmxhZ3MgPSBuZXcgQXJyYXkobmMpXG4gIGZvcih2YXIgaT0wOyBpPGZsYWdzLmxlbmd0aDsgKytpKSB7XG4gICAgZmxhZ3NbaV0gPSAwXG4gIH1cblxuICAvL0J1aWxkIG5laWdoYm9yIGluZGV4LCBpbml0aWFsaXplIHF1ZXVlc1xuICB2YXIgYWN0aXZlID0gW11cbiAgdmFyIG5leHQgICA9IFtdXG4gIHZhciBuZWlnaGJvciA9IG5ldyBBcnJheSgzKm5jKVxuICB2YXIgY29uc3RyYWludCA9IG5ldyBBcnJheSgzKm5jKVxuICB2YXIgYm91bmRhcnkgPSBudWxsXG4gIGlmKGluZmluaXR5KSB7XG4gICAgYm91bmRhcnkgPSBbXVxuICB9XG4gIHZhciBpbmRleCA9IG5ldyBGYWNlSW5kZXgoXG4gICAgY2VsbHMsXG4gICAgbmVpZ2hib3IsXG4gICAgY29uc3RyYWludCxcbiAgICBmbGFncyxcbiAgICBhY3RpdmUsXG4gICAgbmV4dCxcbiAgICBib3VuZGFyeSlcbiAgZm9yKHZhciBpPTA7IGk8bmM7ICsraSkge1xuICAgIHZhciBjID0gY2VsbHNbaV1cbiAgICBmb3IodmFyIGo9MDsgajwzOyArK2opIHtcbiAgICAgIHZhciB4ID0gY1tqXSwgeSA9IGNbKGorMSklM11cbiAgICAgIHZhciBhID0gbmVpZ2hib3JbMyppK2pdID0gaW5kZXgubG9jYXRlKHksIHgsIHRyaWFuZ3VsYXRpb24ub3Bwb3NpdGUoeSwgeCkpXG4gICAgICB2YXIgYiA9IGNvbnN0cmFpbnRbMyppK2pdID0gdHJpYW5ndWxhdGlvbi5pc0NvbnN0cmFpbnQoeCwgeSlcbiAgICAgIGlmKGEgPCAwKSB7XG4gICAgICAgIGlmKGIpIHtcbiAgICAgICAgICBuZXh0LnB1c2goaSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhY3RpdmUucHVzaChpKVxuICAgICAgICAgIGZsYWdzW2ldID0gMVxuICAgICAgICB9XG4gICAgICAgIGlmKGluZmluaXR5KSB7XG4gICAgICAgICAgYm91bmRhcnkucHVzaChbeSwgeCwgLTFdKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBpbmRleFxufVxuXG5mdW5jdGlvbiBmaWx0ZXJDZWxscyhjZWxscywgZmxhZ3MsIHRhcmdldCkge1xuICB2YXIgcHRyID0gMFxuICBmb3IodmFyIGk9MDsgaTxjZWxscy5sZW5ndGg7ICsraSkge1xuICAgIGlmKGZsYWdzW2ldID09PSB0YXJnZXQpIHtcbiAgICAgIGNlbGxzW3B0cisrXSA9IGNlbGxzW2ldXG4gICAgfVxuICB9XG4gIGNlbGxzLmxlbmd0aCA9IHB0clxuICByZXR1cm4gY2VsbHNcbn1cblxuZnVuY3Rpb24gY2xhc3NpZnlGYWNlcyh0cmlhbmd1bGF0aW9uLCB0YXJnZXQsIGluZmluaXR5KSB7XG4gIHZhciBpbmRleCA9IGluZGV4Q2VsbHModHJpYW5ndWxhdGlvbiwgaW5maW5pdHkpXG5cbiAgaWYodGFyZ2V0ID09PSAwKSB7XG4gICAgaWYoaW5maW5pdHkpIHtcbiAgICAgIHJldHVybiBpbmRleC5jZWxscy5jb25jYXQoaW5kZXguYm91bmRhcnkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBpbmRleC5jZWxsc1xuICAgIH1cbiAgfVxuXG4gIHZhciBzaWRlID0gMVxuICB2YXIgYWN0aXZlID0gaW5kZXguYWN0aXZlXG4gIHZhciBuZXh0ID0gaW5kZXgubmV4dFxuICB2YXIgZmxhZ3MgPSBpbmRleC5mbGFnc1xuICB2YXIgY2VsbHMgPSBpbmRleC5jZWxsc1xuICB2YXIgY29uc3RyYWludCA9IGluZGV4LmNvbnN0cmFpbnRcbiAgdmFyIG5laWdoYm9yID0gaW5kZXgubmVpZ2hib3JcblxuICB3aGlsZShhY3RpdmUubGVuZ3RoID4gMCB8fCBuZXh0Lmxlbmd0aCA+IDApIHtcbiAgICB3aGlsZShhY3RpdmUubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIHQgPSBhY3RpdmUucG9wKClcbiAgICAgIGlmKGZsYWdzW3RdID09PSAtc2lkZSkge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgZmxhZ3NbdF0gPSBzaWRlXG4gICAgICB2YXIgYyA9IGNlbGxzW3RdXG4gICAgICBmb3IodmFyIGo9MDsgajwzOyArK2opIHtcbiAgICAgICAgdmFyIGYgPSBuZWlnaGJvclszKnQral1cbiAgICAgICAgaWYoZiA+PSAwICYmIGZsYWdzW2ZdID09PSAwKSB7XG4gICAgICAgICAgaWYoY29uc3RyYWludFszKnQral0pIHtcbiAgICAgICAgICAgIG5leHQucHVzaChmKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhY3RpdmUucHVzaChmKVxuICAgICAgICAgICAgZmxhZ3NbZl0gPSBzaWRlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9Td2FwIGFycmF5cyBhbmQgbG9vcFxuICAgIHZhciB0bXAgPSBuZXh0XG4gICAgbmV4dCA9IGFjdGl2ZVxuICAgIGFjdGl2ZSA9IHRtcFxuICAgIG5leHQubGVuZ3RoID0gMFxuICAgIHNpZGUgPSAtc2lkZVxuICB9XG5cbiAgdmFyIHJlc3VsdCA9IGZpbHRlckNlbGxzKGNlbGxzLCBmbGFncywgdGFyZ2V0KVxuICBpZihpbmZpbml0eSkge1xuICAgIHJldHVybiByZXN1bHQuY29uY2F0KGluZGV4LmJvdW5kYXJ5KVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgYnNlYXJjaCA9IHJlcXVpcmUoJ2JpbmFyeS1zZWFyY2gtYm91bmRzJylcbnZhciBvcmllbnQgPSByZXF1aXJlKCdyb2J1c3Qtb3JpZW50YXRpb24nKVszXVxuXG52YXIgRVZFTlRfUE9JTlQgPSAwXG52YXIgRVZFTlRfRU5EICAgPSAxXG52YXIgRVZFTlRfU1RBUlQgPSAyXG5cbm1vZHVsZS5leHBvcnRzID0gbW9ub3RvbmVUcmlhbmd1bGF0ZVxuXG4vL0EgcGFydGlhbCBjb252ZXggaHVsbCBmcmFnbWVudCwgbWFkZSBvZiB0d28gdW5pbW9ub3RvbmUgcG9seWdvbnNcbmZ1bmN0aW9uIFBhcnRpYWxIdWxsKGEsIGIsIGlkeCwgbG93ZXJJZHMsIHVwcGVySWRzKSB7XG4gIHRoaXMuYSA9IGFcbiAgdGhpcy5iID0gYlxuICB0aGlzLmlkeCA9IGlkeFxuICB0aGlzLmxvd2VySWRzID0gbG93ZXJJZHNcbiAgdGhpcy51cHBlcklkcyA9IHVwcGVySWRzXG59XG5cbi8vQW4gZXZlbnQgaW4gdGhlIHN3ZWVwIGxpbmUgcHJvY2VkdXJlXG5mdW5jdGlvbiBFdmVudChhLCBiLCB0eXBlLCBpZHgpIHtcbiAgdGhpcy5hICAgID0gYVxuICB0aGlzLmIgICAgPSBiXG4gIHRoaXMudHlwZSA9IHR5cGVcbiAgdGhpcy5pZHggID0gaWR4XG59XG5cbi8vVGhpcyBpcyB1c2VkIHRvIGNvbXBhcmUgZXZlbnRzIGZvciB0aGUgc3dlZXAgbGluZSBwcm9jZWR1cmVcbi8vIFBvaW50cyBhcmU6XG4vLyAgMS4gc29ydGVkIGxleGljb2dyYXBoaWNhbGx5XG4vLyAgMi4gc29ydGVkIGJ5IHR5cGUgIChwb2ludCA8IGVuZCA8IHN0YXJ0KVxuLy8gIDMuIHNlZ21lbnRzIHNvcnRlZCBieSB3aW5kaW5nIG9yZGVyXG4vLyAgNC4gc29ydGVkIGJ5IGluZGV4XG5mdW5jdGlvbiBjb21wYXJlRXZlbnQoYSwgYikge1xuICB2YXIgZCA9XG4gICAgKGEuYVswXSAtIGIuYVswXSkgfHxcbiAgICAoYS5hWzFdIC0gYi5hWzFdKSB8fFxuICAgIChhLnR5cGUgLSBiLnR5cGUpXG4gIGlmKGQpIHsgcmV0dXJuIGQgfVxuICBpZihhLnR5cGUgIT09IEVWRU5UX1BPSU5UKSB7XG4gICAgZCA9IG9yaWVudChhLmEsIGEuYiwgYi5iKVxuICAgIGlmKGQpIHsgcmV0dXJuIGQgfVxuICB9XG4gIHJldHVybiBhLmlkeCAtIGIuaWR4XG59XG5cbmZ1bmN0aW9uIHRlc3RQb2ludChodWxsLCBwKSB7XG4gIHJldHVybiBvcmllbnQoaHVsbC5hLCBodWxsLmIsIHApXG59XG5cbmZ1bmN0aW9uIGFkZFBvaW50KGNlbGxzLCBodWxscywgcG9pbnRzLCBwLCBpZHgpIHtcbiAgdmFyIGxvID0gYnNlYXJjaC5sdChodWxscywgcCwgdGVzdFBvaW50KVxuICB2YXIgaGkgPSBic2VhcmNoLmd0KGh1bGxzLCBwLCB0ZXN0UG9pbnQpXG4gIGZvcih2YXIgaT1sbzsgaTxoaTsgKytpKSB7XG4gICAgdmFyIGh1bGwgPSBodWxsc1tpXVxuXG4gICAgLy9JbnNlcnQgcCBpbnRvIGxvd2VyIGh1bGxcbiAgICB2YXIgbG93ZXJJZHMgPSBodWxsLmxvd2VySWRzXG4gICAgdmFyIG0gPSBsb3dlcklkcy5sZW5ndGhcbiAgICB3aGlsZShtID4gMSAmJiBvcmllbnQoXG4gICAgICAgIHBvaW50c1tsb3dlcklkc1ttLTJdXSxcbiAgICAgICAgcG9pbnRzW2xvd2VySWRzW20tMV1dLFxuICAgICAgICBwKSA+IDApIHtcbiAgICAgIGNlbGxzLnB1c2goXG4gICAgICAgIFtsb3dlcklkc1ttLTFdLFxuICAgICAgICAgbG93ZXJJZHNbbS0yXSxcbiAgICAgICAgIGlkeF0pXG4gICAgICBtIC09IDFcbiAgICB9XG4gICAgbG93ZXJJZHMubGVuZ3RoID0gbVxuICAgIGxvd2VySWRzLnB1c2goaWR4KVxuXG4gICAgLy9JbnNlcnQgcCBpbnRvIHVwcGVyIGh1bGxcbiAgICB2YXIgdXBwZXJJZHMgPSBodWxsLnVwcGVySWRzXG4gICAgdmFyIG0gPSB1cHBlcklkcy5sZW5ndGhcbiAgICB3aGlsZShtID4gMSAmJiBvcmllbnQoXG4gICAgICAgIHBvaW50c1t1cHBlcklkc1ttLTJdXSxcbiAgICAgICAgcG9pbnRzW3VwcGVySWRzW20tMV1dLFxuICAgICAgICBwKSA8IDApIHtcbiAgICAgIGNlbGxzLnB1c2goXG4gICAgICAgIFt1cHBlcklkc1ttLTJdLFxuICAgICAgICAgdXBwZXJJZHNbbS0xXSxcbiAgICAgICAgIGlkeF0pXG4gICAgICBtIC09IDFcbiAgICB9XG4gICAgdXBwZXJJZHMubGVuZ3RoID0gbVxuICAgIHVwcGVySWRzLnB1c2goaWR4KVxuICB9XG59XG5cbmZ1bmN0aW9uIGZpbmRTcGxpdChodWxsLCBlZGdlKSB7XG4gIHZhciBkXG4gIGlmKGh1bGwuYVswXSA8IGVkZ2UuYVswXSkge1xuICAgIGQgPSBvcmllbnQoaHVsbC5hLCBodWxsLmIsIGVkZ2UuYSlcbiAgfSBlbHNlIHtcbiAgICBkID0gb3JpZW50KGVkZ2UuYiwgZWRnZS5hLCBodWxsLmEpXG4gIH1cbiAgaWYoZCkgeyByZXR1cm4gZCB9XG4gIGlmKGVkZ2UuYlswXSA8IGh1bGwuYlswXSkge1xuICAgIGQgPSBvcmllbnQoaHVsbC5hLCBodWxsLmIsIGVkZ2UuYilcbiAgfSBlbHNlIHtcbiAgICBkID0gb3JpZW50KGVkZ2UuYiwgZWRnZS5hLCBodWxsLmIpXG4gIH1cbiAgcmV0dXJuIGQgfHwgaHVsbC5pZHggLSBlZGdlLmlkeFxufVxuXG5mdW5jdGlvbiBzcGxpdEh1bGxzKGh1bGxzLCBwb2ludHMsIGV2ZW50KSB7XG4gIHZhciBzcGxpdElkeCA9IGJzZWFyY2gubGUoaHVsbHMsIGV2ZW50LCBmaW5kU3BsaXQpXG4gIHZhciBodWxsID0gaHVsbHNbc3BsaXRJZHhdXG4gIHZhciB1cHBlcklkcyA9IGh1bGwudXBwZXJJZHNcbiAgdmFyIHggPSB1cHBlcklkc1t1cHBlcklkcy5sZW5ndGgtMV1cbiAgaHVsbC51cHBlcklkcyA9IFt4XVxuICBodWxscy5zcGxpY2Uoc3BsaXRJZHgrMSwgMCxcbiAgICBuZXcgUGFydGlhbEh1bGwoZXZlbnQuYSwgZXZlbnQuYiwgZXZlbnQuaWR4LCBbeF0sIHVwcGVySWRzKSlcbn1cblxuXG5mdW5jdGlvbiBtZXJnZUh1bGxzKGh1bGxzLCBwb2ludHMsIGV2ZW50KSB7XG4gIC8vU3dhcCBwb2ludGVycyBmb3IgbWVyZ2Ugc2VhcmNoXG4gIHZhciB0bXAgPSBldmVudC5hXG4gIGV2ZW50LmEgPSBldmVudC5iXG4gIGV2ZW50LmIgPSB0bXBcbiAgdmFyIG1lcmdlSWR4ID0gYnNlYXJjaC5lcShodWxscywgZXZlbnQsIGZpbmRTcGxpdClcbiAgdmFyIHVwcGVyID0gaHVsbHNbbWVyZ2VJZHhdXG4gIHZhciBsb3dlciA9IGh1bGxzW21lcmdlSWR4LTFdXG4gIGxvd2VyLnVwcGVySWRzID0gdXBwZXIudXBwZXJJZHNcbiAgaHVsbHMuc3BsaWNlKG1lcmdlSWR4LCAxKVxufVxuXG5cbmZ1bmN0aW9uIG1vbm90b25lVHJpYW5ndWxhdGUocG9pbnRzLCBlZGdlcykge1xuXG4gIHZhciBudW1Qb2ludHMgPSBwb2ludHMubGVuZ3RoXG4gIHZhciBudW1FZGdlcyA9IGVkZ2VzLmxlbmd0aFxuXG4gIHZhciBldmVudHMgPSBbXVxuXG4gIC8vQ3JlYXRlIHBvaW50IGV2ZW50c1xuICBmb3IodmFyIGk9MDsgaTxudW1Qb2ludHM7ICsraSkge1xuICAgIGV2ZW50cy5wdXNoKG5ldyBFdmVudChcbiAgICAgIHBvaW50c1tpXSxcbiAgICAgIG51bGwsXG4gICAgICBFVkVOVF9QT0lOVCxcbiAgICAgIGkpKVxuICB9XG5cbiAgLy9DcmVhdGUgZWRnZSBldmVudHNcbiAgZm9yKHZhciBpPTA7IGk8bnVtRWRnZXM7ICsraSkge1xuICAgIHZhciBlID0gZWRnZXNbaV1cbiAgICB2YXIgYSA9IHBvaW50c1tlWzBdXVxuICAgIHZhciBiID0gcG9pbnRzW2VbMV1dXG4gICAgaWYoYVswXSA8IGJbMF0pIHtcbiAgICAgIGV2ZW50cy5wdXNoKFxuICAgICAgICBuZXcgRXZlbnQoYSwgYiwgRVZFTlRfU1RBUlQsIGkpLFxuICAgICAgICBuZXcgRXZlbnQoYiwgYSwgRVZFTlRfRU5ELCBpKSlcbiAgICB9IGVsc2UgaWYoYVswXSA+IGJbMF0pIHtcbiAgICAgIGV2ZW50cy5wdXNoKFxuICAgICAgICBuZXcgRXZlbnQoYiwgYSwgRVZFTlRfU1RBUlQsIGkpLFxuICAgICAgICBuZXcgRXZlbnQoYSwgYiwgRVZFTlRfRU5ELCBpKSlcbiAgICB9XG4gIH1cblxuICAvL1NvcnQgZXZlbnRzXG4gIGV2ZW50cy5zb3J0KGNvbXBhcmVFdmVudClcblxuICAvL0luaXRpYWxpemUgaHVsbFxuICB2YXIgbWluWCA9IGV2ZW50c1swXS5hWzBdIC0gKDEgKyBNYXRoLmFicyhldmVudHNbMF0uYVswXSkpICogTWF0aC5wb3coMiwgLTUyKVxuICB2YXIgaHVsbCA9IFsgbmV3IFBhcnRpYWxIdWxsKFttaW5YLCAxXSwgW21pblgsIDBdLCAtMSwgW10sIFtdLCBbXSwgW10pIF1cblxuICAvL1Byb2Nlc3MgZXZlbnRzIGluIG9yZGVyXG4gIHZhciBjZWxscyA9IFtdXG4gIGZvcih2YXIgaT0wLCBudW1FdmVudHM9ZXZlbnRzLmxlbmd0aDsgaTxudW1FdmVudHM7ICsraSkge1xuICAgIHZhciBldmVudCA9IGV2ZW50c1tpXVxuICAgIHZhciB0eXBlID0gZXZlbnQudHlwZVxuICAgIGlmKHR5cGUgPT09IEVWRU5UX1BPSU5UKSB7XG4gICAgICBhZGRQb2ludChjZWxscywgaHVsbCwgcG9pbnRzLCBldmVudC5hLCBldmVudC5pZHgpXG4gICAgfSBlbHNlIGlmKHR5cGUgPT09IEVWRU5UX1NUQVJUKSB7XG4gICAgICBzcGxpdEh1bGxzKGh1bGwsIHBvaW50cywgZXZlbnQpXG4gICAgfSBlbHNlIHtcbiAgICAgIG1lcmdlSHVsbHMoaHVsbCwgcG9pbnRzLCBldmVudClcbiAgICB9XG4gIH1cblxuICAvL1JldHVybiB0cmlhbmd1bGF0aW9uXG4gIHJldHVybiBjZWxsc1xufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBic2VhcmNoID0gcmVxdWlyZSgnYmluYXJ5LXNlYXJjaC1ib3VuZHMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVRyaWFuZ3VsYXRpb25cblxuZnVuY3Rpb24gVHJpYW5ndWxhdGlvbihzdGFycywgZWRnZXMpIHtcbiAgdGhpcy5zdGFycyA9IHN0YXJzXG4gIHRoaXMuZWRnZXMgPSBlZGdlc1xufVxuXG52YXIgcHJvdG8gPSBUcmlhbmd1bGF0aW9uLnByb3RvdHlwZVxuXG5mdW5jdGlvbiByZW1vdmVQYWlyKGxpc3QsIGosIGspIHtcbiAgZm9yKHZhciBpPTEsIG49bGlzdC5sZW5ndGg7IGk8bjsgaSs9Mikge1xuICAgIGlmKGxpc3RbaS0xXSA9PT0gaiAmJiBsaXN0W2ldID09PSBrKSB7XG4gICAgICBsaXN0W2ktMV0gPSBsaXN0W24tMl1cbiAgICAgIGxpc3RbaV0gPSBsaXN0W24tMV1cbiAgICAgIGxpc3QubGVuZ3RoID0gbiAtIDJcbiAgICAgIHJldHVyblxuICAgIH1cbiAgfVxufVxuXG5wcm90by5pc0NvbnN0cmFpbnQgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBlID0gWzAsMF1cbiAgZnVuY3Rpb24gY29tcGFyZUxleChhLCBiKSB7XG4gICAgcmV0dXJuIGFbMF0gLSBiWzBdIHx8IGFbMV0gLSBiWzFdXG4gIH1cbiAgcmV0dXJuIGZ1bmN0aW9uKGksIGopIHtcbiAgICBlWzBdID0gTWF0aC5taW4oaSxqKVxuICAgIGVbMV0gPSBNYXRoLm1heChpLGopXG4gICAgcmV0dXJuIGJzZWFyY2guZXEodGhpcy5lZGdlcywgZSwgY29tcGFyZUxleCkgPj0gMFxuICB9XG59KSgpXG5cbnByb3RvLnJlbW92ZVRyaWFuZ2xlID0gZnVuY3Rpb24oaSwgaiwgaykge1xuICB2YXIgc3RhcnMgPSB0aGlzLnN0YXJzXG4gIHJlbW92ZVBhaXIoc3RhcnNbaV0sIGosIGspXG4gIHJlbW92ZVBhaXIoc3RhcnNbal0sIGssIGkpXG4gIHJlbW92ZVBhaXIoc3RhcnNba10sIGksIGopXG59XG5cbnByb3RvLmFkZFRyaWFuZ2xlID0gZnVuY3Rpb24oaSwgaiwgaykge1xuICB2YXIgc3RhcnMgPSB0aGlzLnN0YXJzXG4gIHN0YXJzW2ldLnB1c2goaiwgaylcbiAgc3RhcnNbal0ucHVzaChrLCBpKVxuICBzdGFyc1trXS5wdXNoKGksIGopXG59XG5cbnByb3RvLm9wcG9zaXRlID0gZnVuY3Rpb24oaiwgaSkge1xuICB2YXIgbGlzdCA9IHRoaXMuc3RhcnNbaV1cbiAgZm9yKHZhciBrPTEsIG49bGlzdC5sZW5ndGg7IGs8bjsgays9Mikge1xuICAgIGlmKGxpc3Rba10gPT09IGopIHtcbiAgICAgIHJldHVybiBsaXN0W2stMV1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xXG59XG5cbnByb3RvLmZsaXAgPSBmdW5jdGlvbihpLCBqKSB7XG4gIHZhciBhID0gdGhpcy5vcHBvc2l0ZShpLCBqKVxuICB2YXIgYiA9IHRoaXMub3Bwb3NpdGUoaiwgaSlcbiAgdGhpcy5yZW1vdmVUcmlhbmdsZShpLCBqLCBhKVxuICB0aGlzLnJlbW92ZVRyaWFuZ2xlKGosIGksIGIpXG4gIHRoaXMuYWRkVHJpYW5nbGUoaSwgYiwgYSlcbiAgdGhpcy5hZGRUcmlhbmdsZShqLCBhLCBiKVxufVxuXG5wcm90by5lZGdlcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc3RhcnMgPSB0aGlzLnN0YXJzXG4gIHZhciByZXN1bHQgPSBbXVxuICBmb3IodmFyIGk9MCwgbj1zdGFycy5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgdmFyIGxpc3QgPSBzdGFyc1tpXVxuICAgIGZvcih2YXIgaj0wLCBtPWxpc3QubGVuZ3RoOyBqPG07IGorPTIpIHtcbiAgICAgIHJlc3VsdC5wdXNoKFtsaXN0W2pdLCBsaXN0W2orMV1dKVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbnByb3RvLmNlbGxzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzdGFycyA9IHRoaXMuc3RhcnNcbiAgdmFyIHJlc3VsdCA9IFtdXG4gIGZvcih2YXIgaT0wLCBuPXN0YXJzLmxlbmd0aDsgaTxuOyArK2kpIHtcbiAgICB2YXIgbGlzdCA9IHN0YXJzW2ldXG4gICAgZm9yKHZhciBqPTAsIG09bGlzdC5sZW5ndGg7IGo8bTsgais9Mikge1xuICAgICAgdmFyIHMgPSBsaXN0W2pdXG4gICAgICB2YXIgdCA9IGxpc3RbaisxXVxuICAgICAgaWYoaSA8IE1hdGgubWluKHMsIHQpKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKFtpLCBzLCB0XSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5mdW5jdGlvbiBjcmVhdGVUcmlhbmd1bGF0aW9uKG51bVZlcnRzLCBlZGdlcykge1xuICB2YXIgc3RhcnMgPSBuZXcgQXJyYXkobnVtVmVydHMpXG4gIGZvcih2YXIgaT0wOyBpPG51bVZlcnRzOyArK2kpIHtcbiAgICBzdGFyc1tpXSA9IFtdXG4gIH1cbiAgcmV0dXJuIG5ldyBUcmlhbmd1bGF0aW9uKHN0YXJzLCBlZGdlcylcbn1cbiIsIi8vIHJldiA0ODJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBBdXRob3IgICAgOiAgQW5ndXMgSm9obnNvbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIFZlcnNpb24gICA6ICA2LjIuMSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBEYXRlICAgICAgOiAgMzEgT2N0b2JlciAyMDE0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIFdlYnNpdGUgICA6ICBodHRwOi8vd3d3LmFuZ3Vzai5jb20gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogQ29weXJpZ2h0IDogIEFuZ3VzIEpvaG5zb24gMjAxMC0yMDE0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIExpY2Vuc2U6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogVXNlLCBtb2RpZmljYXRpb24gJiBkaXN0cmlidXRpb24gaXMgc3ViamVjdCB0byBCb29zdCBTb2Z0d2FyZSBMaWNlbnNlIFZlciAxLiAqXG4gKiBodHRwOi8vd3d3LmJvb3N0Lm9yZy9MSUNFTlNFXzFfMC50eHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogQXR0cmlidXRpb25zOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBUaGUgY29kZSBpbiB0aGlzIGxpYnJhcnkgaXMgYW4gZXh0ZW5zaW9uIG9mIEJhbGEgVmF0dGkncyBjbGlwcGluZyBhbGdvcml0aG06ICpcbiAqIFwiQSBnZW5lcmljIHNvbHV0aW9uIHRvIHBvbHlnb24gY2xpcHBpbmdcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBDb21tdW5pY2F0aW9ucyBvZiB0aGUgQUNNLCBWb2wgMzUsIElzc3VlIDcgKEp1bHkgMTk5MikgcHAgNTYtNjMuICAgICAgICAgICAgICpcbiAqIGh0dHA6Ly9wb3J0YWwuYWNtLm9yZy9jaXRhdGlvbi5jZm0/aWQ9MTI5OTA2ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBDb21wdXRlciBncmFwaGljcyBhbmQgZ2VvbWV0cmljIG1vZGVsaW5nOiBpbXBsZW1lbnRhdGlvbiBhbmQgYWxnb3JpdGhtcyAgICAgICpcbiAqIEJ5IE1heCBLLiBBZ29zdG9uICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogU3ByaW5nZXI7IDEgZWRpdGlvbiAoSmFudWFyeSA0LCAyMDA1KSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBodHRwOi8vYm9va3MuZ29vZ2xlLmNvbS9ib29rcz9xPXZhdHRpK2NsaXBwaW5nK2Fnb3N0b24gICAgICAgICAgICAgICAgICAgICAgICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogU2VlIGFsc286ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBcIlBvbHlnb24gT2Zmc2V0dGluZyBieSBDb21wdXRpbmcgV2luZGluZyBOdW1iZXJzXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogUGFwZXIgbm8uIERFVEMyMDA1LTg1NTEzIHBwLiA1NjUtNTc1ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBBU01FIDIwMDUgSW50ZXJuYXRpb25hbCBEZXNpZ24gRW5naW5lZXJpbmcgVGVjaG5pY2FsIENvbmZlcmVuY2VzICAgICAgICAgICAgICpcbiAqIGFuZCBDb21wdXRlcnMgYW5kIEluZm9ybWF0aW9uIGluIEVuZ2luZWVyaW5nIENvbmZlcmVuY2UgKElERVRDL0NJRTIwMDUpICAgICAgKlxuICogU2VwdGVtYmVyIDI0LTI4LCAyMDA1ICwgTG9uZyBCZWFjaCwgQ2FsaWZvcm5pYSwgVVNBICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBodHRwOi8vd3d3Lm1lLmJlcmtlbGV5LmVkdS9+bWNtYWlucy9wdWJzL0RBQzA1T2Zmc2V0UG9seWdvbi5wZGYgICAgICAgICAgICAgICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBBdXRob3IgICAgOiAgVGltbyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIFZlcnNpb24gICA6ICA2LjIuMS4wICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogRGF0ZSAgICAgIDogIDE3IEp1bmUgMjAxNiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIFRoaXMgaXMgYSB0cmFuc2xhdGlvbiBvZiB0aGUgQyMgQ2xpcHBlciBsaWJyYXJ5IHRvIEphdmFzY3JpcHQuICAgICAgICAgICAgICAgKlxuICogSW50MTI4IHN0cnVjdCBvZiBDIyBpcyBpbXBsZW1lbnRlZCB1c2luZyBKU0JOIG9mIFRvbSBXdS4gICAgICAgICAgICAgICAgICAgICAqXG4gKiBCZWNhdXNlIEphdmFzY3JpcHQgbGFja3Mgc3VwcG9ydCBmb3IgNjQtYml0IGludGVnZXJzLCB0aGUgc3BhY2UgICAgICAgICAgICAgICpcbiAqIGlzIGEgbGl0dGxlIG1vcmUgcmVzdHJpY3RlZCB0aGFuIGluIEMjIHZlcnNpb24uICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBDIyB2ZXJzaW9uIGhhcyBzdXBwb3J0IGZvciBjb29yZGluYXRlIHNwYWNlOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICstNDYxMTY4NjAxODQyNzM4NzkwMyAoIHNxcnQoMl4xMjcgLTEpLzIgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogd2hpbGUgSmF2YXNjcmlwdCB2ZXJzaW9uIGhhcyBzdXBwb3J0IGZvciBzcGFjZTogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiArLTQ1MDM1OTk2MjczNzA0OTUgKCBzcXJ0KDJeMTA2IC0xKS8yICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogVG9tIFd1J3MgSlNCTiBwcm92ZWQgdG8gYmUgdGhlIGZhc3Rlc3QgYmlnIGludGVnZXIgbGlicmFyeTogICAgICAgICAgICAgICAgICAqXG4gKiBodHRwOi8vanNwZXJmLmNvbS9iaWctaW50ZWdlci1saWJyYXJ5LXRlc3QgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogVGhpcyBjbGFzcyBjYW4gYmUgbWFkZSBzaW1wbGVyIHdoZW4gKGlmIGV2ZXIpIDY0LWJpdCBpbnRlZ2VyIHN1cHBvcnQgY29tZXMuICAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogQmFzaWMgSmF2YVNjcmlwdCBCTiBsaWJyYXJ5IC0gc3Vic2V0IHVzZWZ1bCBmb3IgUlNBIGVuY3J5cHRpb24uICAgICAgICAgICAgICAqXG4gKiBodHRwOi8vd3d3LWNzLXN0dWRlbnRzLnN0YW5mb3JkLmVkdS9+dGp3L2pzYm4vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIENvcHlyaWdodCAoYykgMjAwNSAgVG9tIFd1ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogQWxsIFJpZ2h0cyBSZXNlcnZlZC4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBTZWUgXCJMSUNFTlNFXCIgZm9yIGRldGFpbHM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogaHR0cDovL3d3dy1jcy1zdHVkZW50cy5zdGFuZm9yZC5lZHUvfnRqdy9qc2JuL0xJQ0VOU0UgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuKGZ1bmN0aW9uICgpXG57XG4gIFwidXNlIHN0cmljdFwiO1xuICAvL3VzZV9pbnQzMjogV2hlbiBlbmFibGVkIDMyYml0IGludHMgYXJlIHVzZWQgaW5zdGVhZCBvZiA2NGJpdCBpbnRzLiBUaGlzXG4gIC8vaW1wcm92ZSBwZXJmb3JtYW5jZSBidXQgY29vcmRpbmF0ZSB2YWx1ZXMgYXJlIGxpbWl0ZWQgdG8gdGhlIHJhbmdlICsvLSA0NjM0MFxuICB2YXIgdXNlX2ludDMyID0gZmFsc2U7XG4gIC8vdXNlX3h5ejogYWRkcyBhIFogbWVtYmVyIHRvIEludFBvaW50LiBBZGRzIGEgbWlub3IgY29zdCB0byBwZXJmb3JtYW5jZS5cbiAgdmFyIHVzZV94eXogPSBmYWxzZTtcbiAgLy9Vc2VMaW5lczogRW5hYmxlcyBvcGVuIHBhdGggY2xpcHBpbmcuIEFkZHMgYSB2ZXJ5IG1pbm9yIGNvc3QgdG8gcGVyZm9ybWFuY2UuXG4gIHZhciB1c2VfbGluZXMgPSB0cnVlO1xuXG4gIHZhciBDbGlwcGVyTGliID0ge307XG4gIHZhciBpc05vZGUgPSBmYWxzZTtcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxuICB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBDbGlwcGVyTGliO1xuICAgIGlzTm9kZSA9IHRydWU7XG4gIH1cbiAgZWxzZVxuICB7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgZGVmaW5lKENsaXBwZXJMaWIpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIChkb2N1bWVudCkgIT09IFwidW5kZWZpbmVkXCIpIHdpbmRvdy5DbGlwcGVyTGliID0gQ2xpcHBlckxpYjtcbiAgICBlbHNlIHNlbGZbJ0NsaXBwZXJMaWInXSA9IENsaXBwZXJMaWI7XG4gIH1cbiAgdmFyIG5hdmlnYXRvcl9hcHBOYW1lO1xuICBpZiAoIWlzTm9kZSlcbiAge1xuICAgIHZhciBuYXYgPSBuYXZpZ2F0b3IudXNlckFnZW50LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKTtcbiAgICBuYXZpZ2F0b3JfYXBwTmFtZSA9IG5hdmlnYXRvci5hcHBOYW1lO1xuICB9XG4gIGVsc2VcbiAge1xuICAgIHZhciBuYXYgPSBcImNocm9tZVwiOyAvLyBOb2RlLmpzIHVzZXMgQ2hyb21lJ3MgVjggZW5naW5lXG4gICAgbmF2aWdhdG9yX2FwcE5hbWUgPSBcIk5ldHNjYXBlXCI7IC8vIEZpcmVmb3gsIENocm9tZSBhbmQgU2FmYXJpIHJldHVybnMgXCJOZXRzY2FwZVwiLCBzbyBOb2RlLmpzIHNob3VsZCBhbHNvXG4gIH1cbiAgLy8gQnJvd3NlciB0ZXN0IHRvIHNwZWVkdXAgcGVyZm9ybWFuY2UgY3JpdGljYWwgZnVuY3Rpb25zXG4gIHZhciBicm93c2VyID0ge307XG4gIGlmIChuYXYuaW5kZXhPZihcImNocm9tZVwiKSAhPSAtMSAmJiBuYXYuaW5kZXhPZihcImNocm9taXVtXCIpID09IC0xKSBicm93c2VyLmNocm9tZSA9IDE7XG4gIGVsc2UgYnJvd3Nlci5jaHJvbWUgPSAwO1xuICBpZiAobmF2LmluZGV4T2YoXCJjaHJvbWl1bVwiKSAhPSAtMSkgYnJvd3Nlci5jaHJvbWl1bSA9IDE7XG4gIGVsc2UgYnJvd3Nlci5jaHJvbWl1bSA9IDA7XG4gIGlmIChuYXYuaW5kZXhPZihcInNhZmFyaVwiKSAhPSAtMSAmJiBuYXYuaW5kZXhPZihcImNocm9tZVwiKSA9PSAtMSAmJiBuYXYuaW5kZXhPZihcImNocm9taXVtXCIpID09IC0xKSBicm93c2VyLnNhZmFyaSA9IDE7XG4gIGVsc2UgYnJvd3Nlci5zYWZhcmkgPSAwO1xuICBpZiAobmF2LmluZGV4T2YoXCJmaXJlZm94XCIpICE9IC0xKSBicm93c2VyLmZpcmVmb3ggPSAxO1xuICBlbHNlIGJyb3dzZXIuZmlyZWZveCA9IDA7XG4gIGlmIChuYXYuaW5kZXhPZihcImZpcmVmb3gvMTdcIikgIT0gLTEpIGJyb3dzZXIuZmlyZWZveDE3ID0gMTtcbiAgZWxzZSBicm93c2VyLmZpcmVmb3gxNyA9IDA7XG4gIGlmIChuYXYuaW5kZXhPZihcImZpcmVmb3gvMTVcIikgIT0gLTEpIGJyb3dzZXIuZmlyZWZveDE1ID0gMTtcbiAgZWxzZSBicm93c2VyLmZpcmVmb3gxNSA9IDA7XG4gIGlmIChuYXYuaW5kZXhPZihcImZpcmVmb3gvM1wiKSAhPSAtMSkgYnJvd3Nlci5maXJlZm94MyA9IDE7XG4gIGVsc2UgYnJvd3Nlci5maXJlZm94MyA9IDA7XG4gIGlmIChuYXYuaW5kZXhPZihcIm9wZXJhXCIpICE9IC0xKSBicm93c2VyLm9wZXJhID0gMTtcbiAgZWxzZSBicm93c2VyLm9wZXJhID0gMDtcbiAgaWYgKG5hdi5pbmRleE9mKFwibXNpZSAxMFwiKSAhPSAtMSkgYnJvd3Nlci5tc2llMTAgPSAxO1xuICBlbHNlIGJyb3dzZXIubXNpZTEwID0gMDtcbiAgaWYgKG5hdi5pbmRleE9mKFwibXNpZSA5XCIpICE9IC0xKSBicm93c2VyLm1zaWU5ID0gMTtcbiAgZWxzZSBicm93c2VyLm1zaWU5ID0gMDtcbiAgaWYgKG5hdi5pbmRleE9mKFwibXNpZSA4XCIpICE9IC0xKSBicm93c2VyLm1zaWU4ID0gMTtcbiAgZWxzZSBicm93c2VyLm1zaWU4ID0gMDtcbiAgaWYgKG5hdi5pbmRleE9mKFwibXNpZSA3XCIpICE9IC0xKSBicm93c2VyLm1zaWU3ID0gMTtcbiAgZWxzZSBicm93c2VyLm1zaWU3ID0gMDtcbiAgaWYgKG5hdi5pbmRleE9mKFwibXNpZSBcIikgIT0gLTEpIGJyb3dzZXIubXNpZSA9IDE7XG4gIGVsc2UgYnJvd3Nlci5tc2llID0gMDtcbiAgQ2xpcHBlckxpYi5iaWdpbnRlZ2VyX3VzZWQgPSBudWxsO1xuXG4gIC8vIENvcHlyaWdodCAoYykgMjAwNSAgVG9tIFd1XG4gIC8vIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gIC8vIFNlZSBcIkxJQ0VOU0VcIiBmb3IgZGV0YWlscy5cbiAgLy8gQmFzaWMgSmF2YVNjcmlwdCBCTiBsaWJyYXJ5IC0gc3Vic2V0IHVzZWZ1bCBmb3IgUlNBIGVuY3J5cHRpb24uXG4gIC8vIEJpdHMgcGVyIGRpZ2l0XG4gIHZhciBkYml0cztcbiAgLy8gSmF2YVNjcmlwdCBlbmdpbmUgYW5hbHlzaXNcbiAgdmFyIGNhbmFyeSA9IDB4ZGVhZGJlZWZjYWZlO1xuICB2YXIgal9sbSA9ICgoY2FuYXJ5ICYgMHhmZmZmZmYpID09IDB4ZWZjYWZlKTtcbiAgLy8gKHB1YmxpYykgQ29uc3RydWN0b3JcbiAgZnVuY3Rpb24gQmlnSW50ZWdlcihhLCBiLCBjKVxuICB7XG4gICAgLy8gVGhpcyB0ZXN0IHZhcmlhYmxlIGNhbiBiZSByZW1vdmVkLFxuICAgIC8vIGJ1dCBhdCBsZWFzdCBmb3IgcGVyZm9ybWFuY2UgdGVzdHMgaXQgaXMgdXNlZnVsIHBpZWNlIG9mIGtub3dsZWRnZVxuICAgIC8vIFRoaXMgaXMgdGhlIG9ubHkgQ2xpcHBlckxpYiByZWxhdGVkIHZhcmlhYmxlIGluIEJpZ0ludGVnZXIgbGlicmFyeVxuICAgIENsaXBwZXJMaWIuYmlnaW50ZWdlcl91c2VkID0gMTtcbiAgICBpZiAoYSAhPSBudWxsKVxuICAgICAgaWYgKFwibnVtYmVyXCIgPT0gdHlwZW9mIGEgJiYgXCJ1bmRlZmluZWRcIiA9PSB0eXBlb2YgKGIpKSB0aGlzLmZyb21JbnQoYSk7IC8vIGZhc3RlciBjb252ZXJzaW9uXG4gICAgICBlbHNlIGlmIChcIm51bWJlclwiID09IHR5cGVvZiBhKSB0aGlzLmZyb21OdW1iZXIoYSwgYiwgYyk7XG4gICAgZWxzZSBpZiAoYiA9PSBudWxsICYmIFwic3RyaW5nXCIgIT0gdHlwZW9mIGEpIHRoaXMuZnJvbVN0cmluZyhhLCAyNTYpO1xuICAgIGVsc2UgdGhpcy5mcm9tU3RyaW5nKGEsIGIpO1xuICB9XG4gIC8vIHJldHVybiBuZXcsIHVuc2V0IEJpZ0ludGVnZXJcbiAgZnVuY3Rpb24gbmJpKClcbiAge1xuICAgIHJldHVybiBuZXcgQmlnSW50ZWdlcihudWxsLHVuZGVmaW5lZCx1bmRlZmluZWQpO1xuICB9XG4gIC8vIGFtOiBDb21wdXRlIHdfaiArPSAoeCp0aGlzX2kpLCBwcm9wYWdhdGUgY2FycmllcyxcbiAgLy8gYyBpcyBpbml0aWFsIGNhcnJ5LCByZXR1cm5zIGZpbmFsIGNhcnJ5LlxuICAvLyBjIDwgMypkdmFsdWUsIHggPCAyKmR2YWx1ZSwgdGhpc19pIDwgZHZhbHVlXG4gIC8vIFdlIG5lZWQgdG8gc2VsZWN0IHRoZSBmYXN0ZXN0IG9uZSB0aGF0IHdvcmtzIGluIHRoaXMgZW52aXJvbm1lbnQuXG4gIC8vIGFtMTogdXNlIGEgc2luZ2xlIG11bHQgYW5kIGRpdmlkZSB0byBnZXQgdGhlIGhpZ2ggYml0cyxcbiAgLy8gbWF4IGRpZ2l0IGJpdHMgc2hvdWxkIGJlIDI2IGJlY2F1c2VcbiAgLy8gbWF4IGludGVybmFsIHZhbHVlID0gMipkdmFsdWVeMi0yKmR2YWx1ZSAoPCAyXjUzKVxuICBmdW5jdGlvbiBhbTEoaSwgeCwgdywgaiwgYywgbilcbiAge1xuICAgIHdoaWxlICgtLW4gPj0gMClcbiAgICB7XG4gICAgICB2YXIgdiA9IHggKiB0aGlzW2krK10gKyB3W2pdICsgYztcbiAgICAgIGMgPSBNYXRoLmZsb29yKHYgLyAweDQwMDAwMDApO1xuICAgICAgd1tqKytdID0gdiAmIDB4M2ZmZmZmZjtcbiAgICB9XG4gICAgcmV0dXJuIGM7XG4gIH1cbiAgLy8gYW0yIGF2b2lkcyBhIGJpZyBtdWx0LWFuZC1leHRyYWN0IGNvbXBsZXRlbHkuXG4gIC8vIE1heCBkaWdpdCBiaXRzIHNob3VsZCBiZSA8PSAzMCBiZWNhdXNlIHdlIGRvIGJpdHdpc2Ugb3BzXG4gIC8vIG9uIHZhbHVlcyB1cCB0byAyKmhkdmFsdWVeMi1oZHZhbHVlLTEgKDwgMl4zMSlcbiAgZnVuY3Rpb24gYW0yKGksIHgsIHcsIGosIGMsIG4pXG4gIHtcbiAgICB2YXIgeGwgPSB4ICYgMHg3ZmZmLFxuICAgICAgeGggPSB4ID4+IDE1O1xuICAgIHdoaWxlICgtLW4gPj0gMClcbiAgICB7XG4gICAgICB2YXIgbCA9IHRoaXNbaV0gJiAweDdmZmY7XG4gICAgICB2YXIgaCA9IHRoaXNbaSsrXSA+PiAxNTtcbiAgICAgIHZhciBtID0geGggKiBsICsgaCAqIHhsO1xuICAgICAgbCA9IHhsICogbCArICgobSAmIDB4N2ZmZikgPDwgMTUpICsgd1tqXSArIChjICYgMHgzZmZmZmZmZik7XG4gICAgICBjID0gKGwgPj4+IDMwKSArIChtID4+PiAxNSkgKyB4aCAqIGggKyAoYyA+Pj4gMzApO1xuICAgICAgd1tqKytdID0gbCAmIDB4M2ZmZmZmZmY7XG4gICAgfVxuICAgIHJldHVybiBjO1xuICB9XG4gIC8vIEFsdGVybmF0ZWx5LCBzZXQgbWF4IGRpZ2l0IGJpdHMgdG8gMjggc2luY2Ugc29tZVxuICAvLyBicm93c2VycyBzbG93IGRvd24gd2hlbiBkZWFsaW5nIHdpdGggMzItYml0IG51bWJlcnMuXG4gIGZ1bmN0aW9uIGFtMyhpLCB4LCB3LCBqLCBjLCBuKVxuICB7XG4gICAgdmFyIHhsID0geCAmIDB4M2ZmZixcbiAgICAgIHhoID0geCA+PiAxNDtcbiAgICB3aGlsZSAoLS1uID49IDApXG4gICAge1xuICAgICAgdmFyIGwgPSB0aGlzW2ldICYgMHgzZmZmO1xuICAgICAgdmFyIGggPSB0aGlzW2krK10gPj4gMTQ7XG4gICAgICB2YXIgbSA9IHhoICogbCArIGggKiB4bDtcbiAgICAgIGwgPSB4bCAqIGwgKyAoKG0gJiAweDNmZmYpIDw8IDE0KSArIHdbal0gKyBjO1xuICAgICAgYyA9IChsID4+IDI4KSArIChtID4+IDE0KSArIHhoICogaDtcbiAgICAgIHdbaisrXSA9IGwgJiAweGZmZmZmZmY7XG4gICAgfVxuICAgIHJldHVybiBjO1xuICB9XG4gIGlmIChqX2xtICYmIChuYXZpZ2F0b3JfYXBwTmFtZSA9PSBcIk1pY3Jvc29mdCBJbnRlcm5ldCBFeHBsb3JlclwiKSlcbiAge1xuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLmFtID0gYW0yO1xuICAgIGRiaXRzID0gMzA7XG4gIH1cbiAgZWxzZSBpZiAoal9sbSAmJiAobmF2aWdhdG9yX2FwcE5hbWUgIT0gXCJOZXRzY2FwZVwiKSlcbiAge1xuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLmFtID0gYW0xO1xuICAgIGRiaXRzID0gMjY7XG4gIH1cbiAgZWxzZVxuICB7IC8vIE1vemlsbGEvTmV0c2NhcGUgc2VlbXMgdG8gcHJlZmVyIGFtM1xuICAgIEJpZ0ludGVnZXIucHJvdG90eXBlLmFtID0gYW0zO1xuICAgIGRiaXRzID0gMjg7XG4gIH1cbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuREIgPSBkYml0cztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuRE0gPSAoKDEgPDwgZGJpdHMpIC0gMSk7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLkRWID0gKDEgPDwgZGJpdHMpO1xuICB2YXIgQklfRlAgPSA1MjtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuRlYgPSBNYXRoLnBvdygyLCBCSV9GUCk7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLkYxID0gQklfRlAgLSBkYml0cztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuRjIgPSAyICogZGJpdHMgLSBCSV9GUDtcbiAgLy8gRGlnaXQgY29udmVyc2lvbnNcbiAgdmFyIEJJX1JNID0gXCIwMTIzNDU2Nzg5YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpcIjtcbiAgdmFyIEJJX1JDID0gbmV3IEFycmF5KCk7XG4gIHZhciByciwgdnY7XG4gIHJyID0gXCIwXCIuY2hhckNvZGVBdCgwKTtcbiAgZm9yICh2diA9IDA7IHZ2IDw9IDk7ICsrdnYpIEJJX1JDW3JyKytdID0gdnY7XG4gIHJyID0gXCJhXCIuY2hhckNvZGVBdCgwKTtcbiAgZm9yICh2diA9IDEwOyB2diA8IDM2OyArK3Z2KSBCSV9SQ1tycisrXSA9IHZ2O1xuICByciA9IFwiQVwiLmNoYXJDb2RlQXQoMCk7XG4gIGZvciAodnYgPSAxMDsgdnYgPCAzNjsgKyt2dikgQklfUkNbcnIrK10gPSB2djtcblxuICBmdW5jdGlvbiBpbnQyY2hhcihuKVxuICB7XG4gICAgcmV0dXJuIEJJX1JNLmNoYXJBdChuKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGludEF0KHMsIGkpXG4gIHtcbiAgICB2YXIgYyA9IEJJX1JDW3MuY2hhckNvZGVBdChpKV07XG4gICAgcmV0dXJuIChjID09IG51bGwpID8gLTEgOiBjO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIGNvcHkgdGhpcyB0byByXG4gIGZ1bmN0aW9uIGJucENvcHlUbyhyKVxuICB7XG4gICAgZm9yICh2YXIgaSA9IHRoaXMudCAtIDE7IGkgPj0gMDsgLS1pKSByW2ldID0gdGhpc1tpXTtcbiAgICByLnQgPSB0aGlzLnQ7XG4gICAgci5zID0gdGhpcy5zO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHNldCBmcm9tIGludGVnZXIgdmFsdWUgeCwgLURWIDw9IHggPCBEVlxuICBmdW5jdGlvbiBibnBGcm9tSW50KHgpXG4gIHtcbiAgICB0aGlzLnQgPSAxO1xuICAgIHRoaXMucyA9ICh4IDwgMCkgPyAtMSA6IDA7XG4gICAgaWYgKHggPiAwKSB0aGlzWzBdID0geDtcbiAgICBlbHNlIGlmICh4IDwgLTEpIHRoaXNbMF0gPSB4ICsgdGhpcy5EVjtcbiAgICBlbHNlIHRoaXMudCA9IDA7XG4gIH1cbiAgLy8gcmV0dXJuIGJpZ2ludCBpbml0aWFsaXplZCB0byB2YWx1ZVxuICBmdW5jdGlvbiBuYnYoaSlcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgci5mcm9tSW50KGkpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHNldCBmcm9tIHN0cmluZyBhbmQgcmFkaXhcbiAgZnVuY3Rpb24gYm5wRnJvbVN0cmluZyhzLCBiKVxuICB7XG4gICAgdmFyIGs7XG4gICAgaWYgKGIgPT0gMTYpIGsgPSA0O1xuICAgIGVsc2UgaWYgKGIgPT0gOCkgayA9IDM7XG4gICAgZWxzZSBpZiAoYiA9PSAyNTYpIGsgPSA4OyAvLyBieXRlIGFycmF5XG4gICAgZWxzZSBpZiAoYiA9PSAyKSBrID0gMTtcbiAgICBlbHNlIGlmIChiID09IDMyKSBrID0gNTtcbiAgICBlbHNlIGlmIChiID09IDQpIGsgPSAyO1xuICAgIGVsc2VcbiAgICB7XG4gICAgICB0aGlzLmZyb21SYWRpeChzLCBiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy50ID0gMDtcbiAgICB0aGlzLnMgPSAwO1xuICAgIHZhciBpID0gcy5sZW5ndGgsXG4gICAgICBtaSA9IGZhbHNlLFxuICAgICAgc2ggPSAwO1xuICAgIHdoaWxlICgtLWkgPj0gMClcbiAgICB7XG4gICAgICB2YXIgeCA9IChrID09IDgpID8gc1tpXSAmIDB4ZmYgOiBpbnRBdChzLCBpKTtcbiAgICAgIGlmICh4IDwgMClcbiAgICAgIHtcbiAgICAgICAgaWYgKHMuY2hhckF0KGkpID09IFwiLVwiKSBtaSA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgbWkgPSBmYWxzZTtcbiAgICAgIGlmIChzaCA9PSAwKVxuICAgICAgICB0aGlzW3RoaXMudCsrXSA9IHg7XG4gICAgICBlbHNlIGlmIChzaCArIGsgPiB0aGlzLkRCKVxuICAgICAge1xuICAgICAgICB0aGlzW3RoaXMudCAtIDFdIHw9ICh4ICYgKCgxIDw8ICh0aGlzLkRCIC0gc2gpKSAtIDEpKSA8PCBzaDtcbiAgICAgICAgdGhpc1t0aGlzLnQrK10gPSAoeCA+PiAodGhpcy5EQiAtIHNoKSk7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICAgIHRoaXNbdGhpcy50IC0gMV0gfD0geCA8PCBzaDtcbiAgICAgIHNoICs9IGs7XG4gICAgICBpZiAoc2ggPj0gdGhpcy5EQikgc2ggLT0gdGhpcy5EQjtcbiAgICB9XG4gICAgaWYgKGsgPT0gOCAmJiAoc1swXSAmIDB4ODApICE9IDApXG4gICAge1xuICAgICAgdGhpcy5zID0gLTE7XG4gICAgICBpZiAoc2ggPiAwKSB0aGlzW3RoaXMudCAtIDFdIHw9ICgoMSA8PCAodGhpcy5EQiAtIHNoKSkgLSAxKSA8PCBzaDtcbiAgICB9XG4gICAgdGhpcy5jbGFtcCgpO1xuICAgIGlmIChtaSkgQmlnSW50ZWdlci5aRVJPLnN1YlRvKHRoaXMsIHRoaXMpO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIGNsYW1wIG9mZiBleGNlc3MgaGlnaCB3b3Jkc1xuICBmdW5jdGlvbiBibnBDbGFtcCgpXG4gIHtcbiAgICB2YXIgYyA9IHRoaXMucyAmIHRoaXMuRE07XG4gICAgd2hpbGUgKHRoaXMudCA+IDAgJiYgdGhpc1t0aGlzLnQgLSAxXSA9PSBjKS0tdGhpcy50O1xuICB9XG4gIC8vIChwdWJsaWMpIHJldHVybiBzdHJpbmcgcmVwcmVzZW50YXRpb24gaW4gZ2l2ZW4gcmFkaXhcbiAgZnVuY3Rpb24gYm5Ub1N0cmluZyhiKVxuICB7XG4gICAgaWYgKHRoaXMucyA8IDApIHJldHVybiBcIi1cIiArIHRoaXMubmVnYXRlKCkudG9TdHJpbmcoYik7XG4gICAgdmFyIGs7XG4gICAgaWYgKGIgPT0gMTYpIGsgPSA0O1xuICAgIGVsc2UgaWYgKGIgPT0gOCkgayA9IDM7XG4gICAgZWxzZSBpZiAoYiA9PSAyKSBrID0gMTtcbiAgICBlbHNlIGlmIChiID09IDMyKSBrID0gNTtcbiAgICBlbHNlIGlmIChiID09IDQpIGsgPSAyO1xuICAgIGVsc2UgcmV0dXJuIHRoaXMudG9SYWRpeChiKTtcbiAgICB2YXIga20gPSAoMSA8PCBrKSAtIDEsXG4gICAgICBkLCBtID0gZmFsc2UsXG4gICAgICByID0gXCJcIixcbiAgICAgIGkgPSB0aGlzLnQ7XG4gICAgdmFyIHAgPSB0aGlzLkRCIC0gKGkgKiB0aGlzLkRCKSAlIGs7XG4gICAgaWYgKGktLSA+IDApXG4gICAge1xuICAgICAgaWYgKHAgPCB0aGlzLkRCICYmIChkID0gdGhpc1tpXSA+PiBwKSA+IDApXG4gICAgICB7XG4gICAgICAgIG0gPSB0cnVlO1xuICAgICAgICByID0gaW50MmNoYXIoZCk7XG4gICAgICB9XG4gICAgICB3aGlsZSAoaSA+PSAwKVxuICAgICAge1xuICAgICAgICBpZiAocCA8IGspXG4gICAgICAgIHtcbiAgICAgICAgICBkID0gKHRoaXNbaV0gJiAoKDEgPDwgcCkgLSAxKSkgPDwgKGsgLSBwKTtcbiAgICAgICAgICBkIHw9IHRoaXNbLS1pXSA+PiAocCArPSB0aGlzLkRCIC0gayk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgZCA9ICh0aGlzW2ldID4+IChwIC09IGspKSAmIGttO1xuICAgICAgICAgIGlmIChwIDw9IDApXG4gICAgICAgICAge1xuICAgICAgICAgICAgcCArPSB0aGlzLkRCO1xuICAgICAgICAgICAgLS1pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZCA+IDApIG0gPSB0cnVlO1xuICAgICAgICBpZiAobSkgciArPSBpbnQyY2hhcihkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG0gPyByIDogXCIwXCI7XG4gIH1cbiAgLy8gKHB1YmxpYykgLXRoaXNcbiAgZnVuY3Rpb24gYm5OZWdhdGUoKVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICBCaWdJbnRlZ2VyLlpFUk8uc3ViVG8odGhpcywgcik7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgfHRoaXN8XG4gIGZ1bmN0aW9uIGJuQWJzKClcbiAge1xuICAgIHJldHVybiAodGhpcy5zIDwgMCkgPyB0aGlzLm5lZ2F0ZSgpIDogdGhpcztcbiAgfVxuICAvLyAocHVibGljKSByZXR1cm4gKyBpZiB0aGlzID4gYSwgLSBpZiB0aGlzIDwgYSwgMCBpZiBlcXVhbFxuICBmdW5jdGlvbiBibkNvbXBhcmVUbyhhKVxuICB7XG4gICAgdmFyIHIgPSB0aGlzLnMgLSBhLnM7XG4gICAgaWYgKHIgIT0gMCkgcmV0dXJuIHI7XG4gICAgdmFyIGkgPSB0aGlzLnQ7XG4gICAgciA9IGkgLSBhLnQ7XG4gICAgaWYgKHIgIT0gMCkgcmV0dXJuICh0aGlzLnMgPCAwKSA/IC1yIDogcjtcbiAgICB3aGlsZSAoLS1pID49IDApXG4gICAgICBpZiAoKHIgPSB0aGlzW2ldIC0gYVtpXSkgIT0gMCkgcmV0dXJuIHI7XG4gICAgcmV0dXJuIDA7XG4gIH1cbiAgLy8gcmV0dXJucyBiaXQgbGVuZ3RoIG9mIHRoZSBpbnRlZ2VyIHhcbiAgZnVuY3Rpb24gbmJpdHMoeClcbiAge1xuICAgIHZhciByID0gMSxcbiAgICAgIHQ7XG4gICAgaWYgKCh0ID0geCA+Pj4gMTYpICE9IDApXG4gICAge1xuICAgICAgeCA9IHQ7XG4gICAgICByICs9IDE2O1xuICAgIH1cbiAgICBpZiAoKHQgPSB4ID4+IDgpICE9IDApXG4gICAge1xuICAgICAgeCA9IHQ7XG4gICAgICByICs9IDg7XG4gICAgfVxuICAgIGlmICgodCA9IHggPj4gNCkgIT0gMClcbiAgICB7XG4gICAgICB4ID0gdDtcbiAgICAgIHIgKz0gNDtcbiAgICB9XG4gICAgaWYgKCh0ID0geCA+PiAyKSAhPSAwKVxuICAgIHtcbiAgICAgIHggPSB0O1xuICAgICAgciArPSAyO1xuICAgIH1cbiAgICBpZiAoKHQgPSB4ID4+IDEpICE9IDApXG4gICAge1xuICAgICAgeCA9IHQ7XG4gICAgICByICs9IDE7XG4gICAgfVxuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIHJldHVybiB0aGUgbnVtYmVyIG9mIGJpdHMgaW4gXCJ0aGlzXCJcbiAgZnVuY3Rpb24gYm5CaXRMZW5ndGgoKVxuICB7XG4gICAgaWYgKHRoaXMudCA8PSAwKSByZXR1cm4gMDtcbiAgICByZXR1cm4gdGhpcy5EQiAqICh0aGlzLnQgLSAxKSArIG5iaXRzKHRoaXNbdGhpcy50IC0gMV0gXiAodGhpcy5zICYgdGhpcy5ETSkpO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzIDw8IG4qREJcbiAgZnVuY3Rpb24gYm5wRExTaGlmdFRvKG4sIHIpXG4gIHtcbiAgICB2YXIgaTtcbiAgICBmb3IgKGkgPSB0aGlzLnQgLSAxOyBpID49IDA7IC0taSkgcltpICsgbl0gPSB0aGlzW2ldO1xuICAgIGZvciAoaSA9IG4gLSAxOyBpID49IDA7IC0taSkgcltpXSA9IDA7XG4gICAgci50ID0gdGhpcy50ICsgbjtcbiAgICByLnMgPSB0aGlzLnM7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgPj4gbipEQlxuICBmdW5jdGlvbiBibnBEUlNoaWZ0VG8obiwgcilcbiAge1xuICAgIGZvciAodmFyIGkgPSBuOyBpIDwgdGhpcy50OyArK2kpIHJbaSAtIG5dID0gdGhpc1tpXTtcbiAgICByLnQgPSBNYXRoLm1heCh0aGlzLnQgLSBuLCAwKTtcbiAgICByLnMgPSB0aGlzLnM7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgPDwgblxuICBmdW5jdGlvbiBibnBMU2hpZnRUbyhuLCByKVxuICB7XG4gICAgdmFyIGJzID0gbiAlIHRoaXMuREI7XG4gICAgdmFyIGNicyA9IHRoaXMuREIgLSBicztcbiAgICB2YXIgYm0gPSAoMSA8PCBjYnMpIC0gMTtcbiAgICB2YXIgZHMgPSBNYXRoLmZsb29yKG4gLyB0aGlzLkRCKSxcbiAgICAgIGMgPSAodGhpcy5zIDw8IGJzKSAmIHRoaXMuRE0sXG4gICAgICBpO1xuICAgIGZvciAoaSA9IHRoaXMudCAtIDE7IGkgPj0gMDsgLS1pKVxuICAgIHtcbiAgICAgIHJbaSArIGRzICsgMV0gPSAodGhpc1tpXSA+PiBjYnMpIHwgYztcbiAgICAgIGMgPSAodGhpc1tpXSAmIGJtKSA8PCBicztcbiAgICB9XG4gICAgZm9yIChpID0gZHMgLSAxOyBpID49IDA7IC0taSkgcltpXSA9IDA7XG4gICAgcltkc10gPSBjO1xuICAgIHIudCA9IHRoaXMudCArIGRzICsgMTtcbiAgICByLnMgPSB0aGlzLnM7XG4gICAgci5jbGFtcCgpO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzID4+IG5cbiAgZnVuY3Rpb24gYm5wUlNoaWZ0VG8obiwgcilcbiAge1xuICAgIHIucyA9IHRoaXMucztcbiAgICB2YXIgZHMgPSBNYXRoLmZsb29yKG4gLyB0aGlzLkRCKTtcbiAgICBpZiAoZHMgPj0gdGhpcy50KVxuICAgIHtcbiAgICAgIHIudCA9IDA7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBicyA9IG4gJSB0aGlzLkRCO1xuICAgIHZhciBjYnMgPSB0aGlzLkRCIC0gYnM7XG4gICAgdmFyIGJtID0gKDEgPDwgYnMpIC0gMTtcbiAgICByWzBdID0gdGhpc1tkc10gPj4gYnM7XG4gICAgZm9yICh2YXIgaSA9IGRzICsgMTsgaSA8IHRoaXMudDsgKytpKVxuICAgIHtcbiAgICAgIHJbaSAtIGRzIC0gMV0gfD0gKHRoaXNbaV0gJiBibSkgPDwgY2JzO1xuICAgICAgcltpIC0gZHNdID0gdGhpc1tpXSA+PiBicztcbiAgICB9XG4gICAgaWYgKGJzID4gMCkgclt0aGlzLnQgLSBkcyAtIDFdIHw9ICh0aGlzLnMgJiBibSkgPDwgY2JzO1xuICAgIHIudCA9IHRoaXMudCAtIGRzO1xuICAgIHIuY2xhbXAoKTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSByID0gdGhpcyAtIGFcbiAgZnVuY3Rpb24gYm5wU3ViVG8oYSwgcilcbiAge1xuICAgIHZhciBpID0gMCxcbiAgICAgIGMgPSAwLFxuICAgICAgbSA9IE1hdGgubWluKGEudCwgdGhpcy50KTtcbiAgICB3aGlsZSAoaSA8IG0pXG4gICAge1xuICAgICAgYyArPSB0aGlzW2ldIC0gYVtpXTtcbiAgICAgIHJbaSsrXSA9IGMgJiB0aGlzLkRNO1xuICAgICAgYyA+Pj0gdGhpcy5EQjtcbiAgICB9XG4gICAgaWYgKGEudCA8IHRoaXMudClcbiAgICB7XG4gICAgICBjIC09IGEucztcbiAgICAgIHdoaWxlIChpIDwgdGhpcy50KVxuICAgICAge1xuICAgICAgICBjICs9IHRoaXNbaV07XG4gICAgICAgIHJbaSsrXSA9IGMgJiB0aGlzLkRNO1xuICAgICAgICBjID4+PSB0aGlzLkRCO1xuICAgICAgfVxuICAgICAgYyArPSB0aGlzLnM7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBjICs9IHRoaXMucztcbiAgICAgIHdoaWxlIChpIDwgYS50KVxuICAgICAge1xuICAgICAgICBjIC09IGFbaV07XG4gICAgICAgIHJbaSsrXSA9IGMgJiB0aGlzLkRNO1xuICAgICAgICBjID4+PSB0aGlzLkRCO1xuICAgICAgfVxuICAgICAgYyAtPSBhLnM7XG4gICAgfVxuICAgIHIucyA9IChjIDwgMCkgPyAtMSA6IDA7XG4gICAgaWYgKGMgPCAtMSkgcltpKytdID0gdGhpcy5EViArIGM7XG4gICAgZWxzZSBpZiAoYyA+IDApIHJbaSsrXSA9IGM7XG4gICAgci50ID0gaTtcbiAgICByLmNsYW1wKCk7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgKiBhLCByICE9IHRoaXMsYSAoSEFDIDE0LjEyKVxuICAvLyBcInRoaXNcIiBzaG91bGQgYmUgdGhlIGxhcmdlciBvbmUgaWYgYXBwcm9wcmlhdGUuXG4gIGZ1bmN0aW9uIGJucE11bHRpcGx5VG8oYSwgcilcbiAge1xuICAgIHZhciB4ID0gdGhpcy5hYnMoKSxcbiAgICAgIHkgPSBhLmFicygpO1xuICAgIHZhciBpID0geC50O1xuICAgIHIudCA9IGkgKyB5LnQ7XG4gICAgd2hpbGUgKC0taSA+PSAwKSByW2ldID0gMDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgeS50OyArK2kpIHJbaSArIHgudF0gPSB4LmFtKDAsIHlbaV0sIHIsIGksIDAsIHgudCk7XG4gICAgci5zID0gMDtcbiAgICByLmNsYW1wKCk7XG4gICAgaWYgKHRoaXMucyAhPSBhLnMpIEJpZ0ludGVnZXIuWkVSTy5zdWJUbyhyLCByKTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSByID0gdGhpc14yLCByICE9IHRoaXMgKEhBQyAxNC4xNilcbiAgZnVuY3Rpb24gYm5wU3F1YXJlVG8ocilcbiAge1xuICAgIHZhciB4ID0gdGhpcy5hYnMoKTtcbiAgICB2YXIgaSA9IHIudCA9IDIgKiB4LnQ7XG4gICAgd2hpbGUgKC0taSA+PSAwKSByW2ldID0gMDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgeC50IC0gMTsgKytpKVxuICAgIHtcbiAgICAgIHZhciBjID0geC5hbShpLCB4W2ldLCByLCAyICogaSwgMCwgMSk7XG4gICAgICBpZiAoKHJbaSArIHgudF0gKz0geC5hbShpICsgMSwgMiAqIHhbaV0sIHIsIDIgKiBpICsgMSwgYywgeC50IC0gaSAtIDEpKSA+PSB4LkRWKVxuICAgICAge1xuICAgICAgICByW2kgKyB4LnRdIC09IHguRFY7XG4gICAgICAgIHJbaSArIHgudCArIDFdID0gMTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHIudCA+IDApIHJbci50IC0gMV0gKz0geC5hbShpLCB4W2ldLCByLCAyICogaSwgMCwgMSk7XG4gICAgci5zID0gMDtcbiAgICByLmNsYW1wKCk7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgZGl2aWRlIHRoaXMgYnkgbSwgcXVvdGllbnQgYW5kIHJlbWFpbmRlciB0byBxLCByIChIQUMgMTQuMjApXG4gIC8vIHIgIT0gcSwgdGhpcyAhPSBtLiAgcSBvciByIG1heSBiZSBudWxsLlxuICBmdW5jdGlvbiBibnBEaXZSZW1UbyhtLCBxLCByKVxuICB7XG4gICAgdmFyIHBtID0gbS5hYnMoKTtcbiAgICBpZiAocG0udCA8PSAwKSByZXR1cm47XG4gICAgdmFyIHB0ID0gdGhpcy5hYnMoKTtcbiAgICBpZiAocHQudCA8IHBtLnQpXG4gICAge1xuICAgICAgaWYgKHEgIT0gbnVsbCkgcS5mcm9tSW50KDApO1xuICAgICAgaWYgKHIgIT0gbnVsbCkgdGhpcy5jb3B5VG8ocik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChyID09IG51bGwpIHIgPSBuYmkoKTtcbiAgICB2YXIgeSA9IG5iaSgpLFxuICAgICAgdHMgPSB0aGlzLnMsXG4gICAgICBtcyA9IG0ucztcbiAgICB2YXIgbnNoID0gdGhpcy5EQiAtIG5iaXRzKHBtW3BtLnQgLSAxXSk7IC8vIG5vcm1hbGl6ZSBtb2R1bHVzXG4gICAgaWYgKG5zaCA+IDApXG4gICAge1xuICAgICAgcG0ubFNoaWZ0VG8obnNoLCB5KTtcbiAgICAgIHB0LmxTaGlmdFRvKG5zaCwgcik7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBwbS5jb3B5VG8oeSk7XG4gICAgICBwdC5jb3B5VG8ocik7XG4gICAgfVxuICAgIHZhciB5cyA9IHkudDtcbiAgICB2YXIgeTAgPSB5W3lzIC0gMV07XG4gICAgaWYgKHkwID09IDApIHJldHVybjtcbiAgICB2YXIgeXQgPSB5MCAqICgxIDw8IHRoaXMuRjEpICsgKCh5cyA+IDEpID8geVt5cyAtIDJdID4+IHRoaXMuRjIgOiAwKTtcbiAgICB2YXIgZDEgPSB0aGlzLkZWIC8geXQsXG4gICAgICBkMiA9ICgxIDw8IHRoaXMuRjEpIC8geXQsXG4gICAgICBlID0gMSA8PCB0aGlzLkYyO1xuICAgIHZhciBpID0gci50LFxuICAgICAgaiA9IGkgLSB5cyxcbiAgICAgIHQgPSAocSA9PSBudWxsKSA/IG5iaSgpIDogcTtcbiAgICB5LmRsU2hpZnRUbyhqLCB0KTtcbiAgICBpZiAoci5jb21wYXJlVG8odCkgPj0gMClcbiAgICB7XG4gICAgICByW3IudCsrXSA9IDE7XG4gICAgICByLnN1YlRvKHQsIHIpO1xuICAgIH1cbiAgICBCaWdJbnRlZ2VyLk9ORS5kbFNoaWZ0VG8oeXMsIHQpO1xuICAgIHQuc3ViVG8oeSwgeSk7IC8vIFwibmVnYXRpdmVcIiB5IHNvIHdlIGNhbiByZXBsYWNlIHN1YiB3aXRoIGFtIGxhdGVyXG4gICAgd2hpbGUgKHkudCA8IHlzKSB5W3kudCsrXSA9IDA7XG4gICAgd2hpbGUgKC0taiA+PSAwKVxuICAgIHtcbiAgICAgIC8vIEVzdGltYXRlIHF1b3RpZW50IGRpZ2l0XG4gICAgICB2YXIgcWQgPSAoclstLWldID09IHkwKSA/IHRoaXMuRE0gOiBNYXRoLmZsb29yKHJbaV0gKiBkMSArIChyW2kgLSAxXSArIGUpICogZDIpO1xuICAgICAgaWYgKChyW2ldICs9IHkuYW0oMCwgcWQsIHIsIGosIDAsIHlzKSkgPCBxZClcbiAgICAgIHsgLy8gVHJ5IGl0IG91dFxuICAgICAgICB5LmRsU2hpZnRUbyhqLCB0KTtcbiAgICAgICAgci5zdWJUbyh0LCByKTtcbiAgICAgICAgd2hpbGUgKHJbaV0gPCAtLXFkKSByLnN1YlRvKHQsIHIpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocSAhPSBudWxsKVxuICAgIHtcbiAgICAgIHIuZHJTaGlmdFRvKHlzLCBxKTtcbiAgICAgIGlmICh0cyAhPSBtcykgQmlnSW50ZWdlci5aRVJPLnN1YlRvKHEsIHEpO1xuICAgIH1cbiAgICByLnQgPSB5cztcbiAgICByLmNsYW1wKCk7XG4gICAgaWYgKG5zaCA+IDApIHIuclNoaWZ0VG8obnNoLCByKTsgLy8gRGVub3JtYWxpemUgcmVtYWluZGVyXG4gICAgaWYgKHRzIDwgMCkgQmlnSW50ZWdlci5aRVJPLnN1YlRvKHIsIHIpO1xuICB9XG4gIC8vIChwdWJsaWMpIHRoaXMgbW9kIGFcbiAgZnVuY3Rpb24gYm5Nb2QoYSlcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgdGhpcy5hYnMoKS5kaXZSZW1UbyhhLCBudWxsLCByKTtcbiAgICBpZiAodGhpcy5zIDwgMCAmJiByLmNvbXBhcmVUbyhCaWdJbnRlZ2VyLlpFUk8pID4gMCkgYS5zdWJUbyhyLCByKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyBNb2R1bGFyIHJlZHVjdGlvbiB1c2luZyBcImNsYXNzaWNcIiBhbGdvcml0aG1cbiAgZnVuY3Rpb24gQ2xhc3NpYyhtKVxuICB7XG4gICAgdGhpcy5tID0gbTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNDb252ZXJ0KHgpXG4gIHtcbiAgICBpZiAoeC5zIDwgMCB8fCB4LmNvbXBhcmVUbyh0aGlzLm0pID49IDApIHJldHVybiB4Lm1vZCh0aGlzLm0pO1xuICAgIGVsc2UgcmV0dXJuIHg7XG4gIH1cblxuICBmdW5jdGlvbiBjUmV2ZXJ0KHgpXG4gIHtcbiAgICByZXR1cm4geDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNSZWR1Y2UoeClcbiAge1xuICAgIHguZGl2UmVtVG8odGhpcy5tLCBudWxsLCB4KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNNdWxUbyh4LCB5LCByKVxuICB7XG4gICAgeC5tdWx0aXBseVRvKHksIHIpO1xuICAgIHRoaXMucmVkdWNlKHIpO1xuICB9XG5cbiAgZnVuY3Rpb24gY1NxclRvKHgsIHIpXG4gIHtcbiAgICB4LnNxdWFyZVRvKHIpO1xuICAgIHRoaXMucmVkdWNlKHIpO1xuICB9XG4gIENsYXNzaWMucHJvdG90eXBlLmNvbnZlcnQgPSBjQ29udmVydDtcbiAgQ2xhc3NpYy5wcm90b3R5cGUucmV2ZXJ0ID0gY1JldmVydDtcbiAgQ2xhc3NpYy5wcm90b3R5cGUucmVkdWNlID0gY1JlZHVjZTtcbiAgQ2xhc3NpYy5wcm90b3R5cGUubXVsVG8gPSBjTXVsVG87XG4gIENsYXNzaWMucHJvdG90eXBlLnNxclRvID0gY1NxclRvO1xuICAvLyAocHJvdGVjdGVkKSByZXR1cm4gXCItMS90aGlzICUgMl5EQlwiOyB1c2VmdWwgZm9yIE1vbnQuIHJlZHVjdGlvblxuICAvLyBqdXN0aWZpY2F0aW9uOlxuICAvLyAgICAgICAgIHh5ID09IDEgKG1vZCBtKVxuICAvLyAgICAgICAgIHh5ID0gIDEra21cbiAgLy8gICB4eSgyLXh5KSA9ICgxK2ttKSgxLWttKVxuICAvLyB4W3koMi14eSldID0gMS1rXjJtXjJcbiAgLy8geFt5KDIteHkpXSA9PSAxIChtb2QgbV4yKVxuICAvLyBpZiB5IGlzIDEveCBtb2QgbSwgdGhlbiB5KDIteHkpIGlzIDEveCBtb2QgbV4yXG4gIC8vIHNob3VsZCByZWR1Y2UgeCBhbmQgeSgyLXh5KSBieSBtXjIgYXQgZWFjaCBzdGVwIHRvIGtlZXAgc2l6ZSBib3VuZGVkLlxuICAvLyBKUyBtdWx0aXBseSBcIm92ZXJmbG93c1wiIGRpZmZlcmVudGx5IGZyb20gQy9DKyssIHNvIGNhcmUgaXMgbmVlZGVkIGhlcmUuXG4gIGZ1bmN0aW9uIGJucEludkRpZ2l0KClcbiAge1xuICAgIGlmICh0aGlzLnQgPCAxKSByZXR1cm4gMDtcbiAgICB2YXIgeCA9IHRoaXNbMF07XG4gICAgaWYgKCh4ICYgMSkgPT0gMCkgcmV0dXJuIDA7XG4gICAgdmFyIHkgPSB4ICYgMzsgLy8geSA9PSAxL3ggbW9kIDJeMlxuICAgIHkgPSAoeSAqICgyIC0gKHggJiAweGYpICogeSkpICYgMHhmOyAvLyB5ID09IDEveCBtb2QgMl40XG4gICAgeSA9ICh5ICogKDIgLSAoeCAmIDB4ZmYpICogeSkpICYgMHhmZjsgLy8geSA9PSAxL3ggbW9kIDJeOFxuICAgIHkgPSAoeSAqICgyIC0gKCgoeCAmIDB4ZmZmZikgKiB5KSAmIDB4ZmZmZikpKSAmIDB4ZmZmZjsgLy8geSA9PSAxL3ggbW9kIDJeMTZcbiAgICAvLyBsYXN0IHN0ZXAgLSBjYWxjdWxhdGUgaW52ZXJzZSBtb2QgRFYgZGlyZWN0bHk7XG4gICAgLy8gYXNzdW1lcyAxNiA8IERCIDw9IDMyIGFuZCBhc3N1bWVzIGFiaWxpdHkgdG8gaGFuZGxlIDQ4LWJpdCBpbnRzXG4gICAgeSA9ICh5ICogKDIgLSB4ICogeSAlIHRoaXMuRFYpKSAlIHRoaXMuRFY7IC8vIHkgPT0gMS94IG1vZCAyXmRiaXRzXG4gICAgLy8gd2UgcmVhbGx5IHdhbnQgdGhlIG5lZ2F0aXZlIGludmVyc2UsIGFuZCAtRFYgPCB5IDwgRFZcbiAgICByZXR1cm4gKHkgPiAwKSA/IHRoaXMuRFYgLSB5IDogLXk7XG4gIH1cbiAgLy8gTW9udGdvbWVyeSByZWR1Y3Rpb25cbiAgZnVuY3Rpb24gTW9udGdvbWVyeShtKVxuICB7XG4gICAgdGhpcy5tID0gbTtcbiAgICB0aGlzLm1wID0gbS5pbnZEaWdpdCgpO1xuICAgIHRoaXMubXBsID0gdGhpcy5tcCAmIDB4N2ZmZjtcbiAgICB0aGlzLm1waCA9IHRoaXMubXAgPj4gMTU7XG4gICAgdGhpcy51bSA9ICgxIDw8IChtLkRCIC0gMTUpKSAtIDE7XG4gICAgdGhpcy5tdDIgPSAyICogbS50O1xuICB9XG4gIC8vIHhSIG1vZCBtXG4gIGZ1bmN0aW9uIG1vbnRDb252ZXJ0KHgpXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHguYWJzKCkuZGxTaGlmdFRvKHRoaXMubS50LCByKTtcbiAgICByLmRpdlJlbVRvKHRoaXMubSwgbnVsbCwgcik7XG4gICAgaWYgKHgucyA8IDAgJiYgci5jb21wYXJlVG8oQmlnSW50ZWdlci5aRVJPKSA+IDApIHRoaXMubS5zdWJUbyhyLCByKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyB4L1IgbW9kIG1cbiAgZnVuY3Rpb24gbW9udFJldmVydCh4KVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB4LmNvcHlUbyhyKTtcbiAgICB0aGlzLnJlZHVjZShyKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyB4ID0geC9SIG1vZCBtIChIQUMgMTQuMzIpXG4gIGZ1bmN0aW9uIG1vbnRSZWR1Y2UoeClcbiAge1xuICAgIHdoaWxlICh4LnQgPD0gdGhpcy5tdDIpIC8vIHBhZCB4IHNvIGFtIGhhcyBlbm91Z2ggcm9vbSBsYXRlclxuICAgICAgeFt4LnQrK10gPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tLnQ7ICsraSlcbiAgICB7XG4gICAgICAvLyBmYXN0ZXIgd2F5IG9mIGNhbGN1bGF0aW5nIHUwID0geFtpXSptcCBtb2QgRFZcbiAgICAgIHZhciBqID0geFtpXSAmIDB4N2ZmZjtcbiAgICAgIHZhciB1MCA9IChqICogdGhpcy5tcGwgKyAoKChqICogdGhpcy5tcGggKyAoeFtpXSA+PiAxNSkgKiB0aGlzLm1wbCkgJiB0aGlzLnVtKSA8PCAxNSkpICYgeC5ETTtcbiAgICAgIC8vIHVzZSBhbSB0byBjb21iaW5lIHRoZSBtdWx0aXBseS1zaGlmdC1hZGQgaW50byBvbmUgY2FsbFxuICAgICAgaiA9IGkgKyB0aGlzLm0udDtcbiAgICAgIHhbal0gKz0gdGhpcy5tLmFtKDAsIHUwLCB4LCBpLCAwLCB0aGlzLm0udCk7XG4gICAgICAvLyBwcm9wYWdhdGUgY2FycnlcbiAgICAgIHdoaWxlICh4W2pdID49IHguRFYpXG4gICAgICB7XG4gICAgICAgIHhbal0gLT0geC5EVjtcbiAgICAgICAgeFsrK2pdKys7XG4gICAgICB9XG4gICAgfVxuICAgIHguY2xhbXAoKTtcbiAgICB4LmRyU2hpZnRUbyh0aGlzLm0udCwgeCk7XG4gICAgaWYgKHguY29tcGFyZVRvKHRoaXMubSkgPj0gMCkgeC5zdWJUbyh0aGlzLm0sIHgpO1xuICB9XG4gIC8vIHIgPSBcInheMi9SIG1vZCBtXCI7IHggIT0gclxuICBmdW5jdGlvbiBtb250U3FyVG8oeCwgcilcbiAge1xuICAgIHguc3F1YXJlVG8ocik7XG4gICAgdGhpcy5yZWR1Y2Uocik7XG4gIH1cbiAgLy8gciA9IFwieHkvUiBtb2QgbVwiOyB4LHkgIT0gclxuICBmdW5jdGlvbiBtb250TXVsVG8oeCwgeSwgcilcbiAge1xuICAgIHgubXVsdGlwbHlUbyh5LCByKTtcbiAgICB0aGlzLnJlZHVjZShyKTtcbiAgfVxuICBNb250Z29tZXJ5LnByb3RvdHlwZS5jb252ZXJ0ID0gbW9udENvbnZlcnQ7XG4gIE1vbnRnb21lcnkucHJvdG90eXBlLnJldmVydCA9IG1vbnRSZXZlcnQ7XG4gIE1vbnRnb21lcnkucHJvdG90eXBlLnJlZHVjZSA9IG1vbnRSZWR1Y2U7XG4gIE1vbnRnb21lcnkucHJvdG90eXBlLm11bFRvID0gbW9udE11bFRvO1xuICBNb250Z29tZXJ5LnByb3RvdHlwZS5zcXJUbyA9IG1vbnRTcXJUbztcbiAgLy8gKHByb3RlY3RlZCkgdHJ1ZSBpZmYgdGhpcyBpcyBldmVuXG4gIGZ1bmN0aW9uIGJucElzRXZlbigpXG4gIHtcbiAgICByZXR1cm4gKCh0aGlzLnQgPiAwKSA/ICh0aGlzWzBdICYgMSkgOiB0aGlzLnMpID09IDA7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgdGhpc15lLCBlIDwgMl4zMiwgZG9pbmcgc3FyIGFuZCBtdWwgd2l0aCBcInJcIiAoSEFDIDE0Ljc5KVxuICBmdW5jdGlvbiBibnBFeHAoZSwgeilcbiAge1xuICAgIGlmIChlID4gMHhmZmZmZmZmZiB8fCBlIDwgMSkgcmV0dXJuIEJpZ0ludGVnZXIuT05FO1xuICAgIHZhciByID0gbmJpKCksXG4gICAgICByMiA9IG5iaSgpLFxuICAgICAgZyA9IHouY29udmVydCh0aGlzKSxcbiAgICAgIGkgPSBuYml0cyhlKSAtIDE7XG4gICAgZy5jb3B5VG8ocik7XG4gICAgd2hpbGUgKC0taSA+PSAwKVxuICAgIHtcbiAgICAgIHouc3FyVG8ociwgcjIpO1xuICAgICAgaWYgKChlICYgKDEgPDwgaSkpID4gMCkgei5tdWxUbyhyMiwgZywgcik7XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIHZhciB0ID0gcjtcbiAgICAgICAgciA9IHIyO1xuICAgICAgICByMiA9IHQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB6LnJldmVydChyKTtcbiAgfVxuICAvLyAocHVibGljKSB0aGlzXmUgJSBtLCAwIDw9IGUgPCAyXjMyXG4gIGZ1bmN0aW9uIGJuTW9kUG93SW50KGUsIG0pXG4gIHtcbiAgICB2YXIgejtcbiAgICBpZiAoZSA8IDI1NiB8fCBtLmlzRXZlbigpKSB6ID0gbmV3IENsYXNzaWMobSk7XG4gICAgZWxzZSB6ID0gbmV3IE1vbnRnb21lcnkobSk7XG4gICAgcmV0dXJuIHRoaXMuZXhwKGUsIHopO1xuICB9XG4gIC8vIHByb3RlY3RlZFxuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5jb3B5VG8gPSBibnBDb3B5VG87XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmZyb21JbnQgPSBibnBGcm9tSW50O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5mcm9tU3RyaW5nID0gYm5wRnJvbVN0cmluZztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuY2xhbXAgPSBibnBDbGFtcDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuZGxTaGlmdFRvID0gYm5wRExTaGlmdFRvO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5kclNoaWZ0VG8gPSBibnBEUlNoaWZ0VG87XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmxTaGlmdFRvID0gYm5wTFNoaWZ0VG87XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLnJTaGlmdFRvID0gYm5wUlNoaWZ0VG87XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLnN1YlRvID0gYm5wU3ViVG87XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLm11bHRpcGx5VG8gPSBibnBNdWx0aXBseVRvO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5zcXVhcmVUbyA9IGJucFNxdWFyZVRvO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5kaXZSZW1UbyA9IGJucERpdlJlbVRvO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5pbnZEaWdpdCA9IGJucEludkRpZ2l0O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5pc0V2ZW4gPSBibnBJc0V2ZW47XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmV4cCA9IGJucEV4cDtcbiAgLy8gcHVibGljXG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLnRvU3RyaW5nID0gYm5Ub1N0cmluZztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUubmVnYXRlID0gYm5OZWdhdGU7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmFicyA9IGJuQWJzO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5jb21wYXJlVG8gPSBibkNvbXBhcmVUbztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuYml0TGVuZ3RoID0gYm5CaXRMZW5ndGg7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLm1vZCA9IGJuTW9kO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5tb2RQb3dJbnQgPSBibk1vZFBvd0ludDtcbiAgLy8gXCJjb25zdGFudHNcIlxuICBCaWdJbnRlZ2VyLlpFUk8gPSBuYnYoMCk7XG4gIEJpZ0ludGVnZXIuT05FID0gbmJ2KDEpO1xuICAvLyBDb3B5cmlnaHQgKGMpIDIwMDUtMjAwOSAgVG9tIFd1XG4gIC8vIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gIC8vIFNlZSBcIkxJQ0VOU0VcIiBmb3IgZGV0YWlscy5cbiAgLy8gRXh0ZW5kZWQgSmF2YVNjcmlwdCBCTiBmdW5jdGlvbnMsIHJlcXVpcmVkIGZvciBSU0EgcHJpdmF0ZSBvcHMuXG4gIC8vIFZlcnNpb24gMS4xOiBuZXcgQmlnSW50ZWdlcihcIjBcIiwgMTApIHJldHVybnMgXCJwcm9wZXJcIiB6ZXJvXG4gIC8vIFZlcnNpb24gMS4yOiBzcXVhcmUoKSBBUEksIGlzUHJvYmFibGVQcmltZSBmaXhcbiAgLy8gKHB1YmxpYylcbiAgZnVuY3Rpb24gYm5DbG9uZSgpXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHRoaXMuY29weVRvKHIpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIHJldHVybiB2YWx1ZSBhcyBpbnRlZ2VyXG4gIGZ1bmN0aW9uIGJuSW50VmFsdWUoKVxuICB7XG4gICAgaWYgKHRoaXMucyA8IDApXG4gICAge1xuICAgICAgaWYgKHRoaXMudCA9PSAxKSByZXR1cm4gdGhpc1swXSAtIHRoaXMuRFY7XG4gICAgICBlbHNlIGlmICh0aGlzLnQgPT0gMCkgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBlbHNlIGlmICh0aGlzLnQgPT0gMSkgcmV0dXJuIHRoaXNbMF07XG4gICAgZWxzZSBpZiAodGhpcy50ID09IDApIHJldHVybiAwO1xuICAgIC8vIGFzc3VtZXMgMTYgPCBEQiA8IDMyXG4gICAgcmV0dXJuICgodGhpc1sxXSAmICgoMSA8PCAoMzIgLSB0aGlzLkRCKSkgLSAxKSkgPDwgdGhpcy5EQikgfCB0aGlzWzBdO1xuICB9XG4gIC8vIChwdWJsaWMpIHJldHVybiB2YWx1ZSBhcyBieXRlXG4gIGZ1bmN0aW9uIGJuQnl0ZVZhbHVlKClcbiAge1xuICAgIHJldHVybiAodGhpcy50ID09IDApID8gdGhpcy5zIDogKHRoaXNbMF0gPDwgMjQpID4+IDI0O1xuICB9XG4gIC8vIChwdWJsaWMpIHJldHVybiB2YWx1ZSBhcyBzaG9ydCAoYXNzdW1lcyBEQj49MTYpXG4gIGZ1bmN0aW9uIGJuU2hvcnRWYWx1ZSgpXG4gIHtcbiAgICByZXR1cm4gKHRoaXMudCA9PSAwKSA/IHRoaXMucyA6ICh0aGlzWzBdIDw8IDE2KSA+PiAxNjtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSByZXR1cm4geCBzLnQuIHJeeCA8IERWXG4gIGZ1bmN0aW9uIGJucENodW5rU2l6ZShyKVxuICB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5MTjIgKiB0aGlzLkRCIC8gTWF0aC5sb2cocikpO1xuICB9XG4gIC8vIChwdWJsaWMpIDAgaWYgdGhpcyA9PSAwLCAxIGlmIHRoaXMgPiAwXG4gIGZ1bmN0aW9uIGJuU2lnTnVtKClcbiAge1xuICAgIGlmICh0aGlzLnMgPCAwKSByZXR1cm4gLTE7XG4gICAgZWxzZSBpZiAodGhpcy50IDw9IDAgfHwgKHRoaXMudCA9PSAxICYmIHRoaXNbMF0gPD0gMCkpIHJldHVybiAwO1xuICAgIGVsc2UgcmV0dXJuIDE7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgY29udmVydCB0byByYWRpeCBzdHJpbmdcbiAgZnVuY3Rpb24gYm5wVG9SYWRpeChiKVxuICB7XG4gICAgaWYgKGIgPT0gbnVsbCkgYiA9IDEwO1xuICAgIGlmICh0aGlzLnNpZ251bSgpID09IDAgfHwgYiA8IDIgfHwgYiA+IDM2KSByZXR1cm4gXCIwXCI7XG4gICAgdmFyIGNzID0gdGhpcy5jaHVua1NpemUoYik7XG4gICAgdmFyIGEgPSBNYXRoLnBvdyhiLCBjcyk7XG4gICAgdmFyIGQgPSBuYnYoYSksXG4gICAgICB5ID0gbmJpKCksXG4gICAgICB6ID0gbmJpKCksXG4gICAgICByID0gXCJcIjtcbiAgICB0aGlzLmRpdlJlbVRvKGQsIHksIHopO1xuICAgIHdoaWxlICh5LnNpZ251bSgpID4gMClcbiAgICB7XG4gICAgICByID0gKGEgKyB6LmludFZhbHVlKCkpLnRvU3RyaW5nKGIpLnN1YnN0cigxKSArIHI7XG4gICAgICB5LmRpdlJlbVRvKGQsIHksIHopO1xuICAgIH1cbiAgICByZXR1cm4gei5pbnRWYWx1ZSgpLnRvU3RyaW5nKGIpICsgcjtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSBjb252ZXJ0IGZyb20gcmFkaXggc3RyaW5nXG4gIGZ1bmN0aW9uIGJucEZyb21SYWRpeChzLCBiKVxuICB7XG4gICAgdGhpcy5mcm9tSW50KDApO1xuICAgIGlmIChiID09IG51bGwpIGIgPSAxMDtcbiAgICB2YXIgY3MgPSB0aGlzLmNodW5rU2l6ZShiKTtcbiAgICB2YXIgZCA9IE1hdGgucG93KGIsIGNzKSxcbiAgICAgIG1pID0gZmFsc2UsXG4gICAgICBqID0gMCxcbiAgICAgIHcgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcy5sZW5ndGg7ICsraSlcbiAgICB7XG4gICAgICB2YXIgeCA9IGludEF0KHMsIGkpO1xuICAgICAgaWYgKHggPCAwKVxuICAgICAge1xuICAgICAgICBpZiAocy5jaGFyQXQoaSkgPT0gXCItXCIgJiYgdGhpcy5zaWdudW0oKSA9PSAwKSBtaSA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdyA9IGIgKiB3ICsgeDtcbiAgICAgIGlmICgrK2ogPj0gY3MpXG4gICAgICB7XG4gICAgICAgIHRoaXMuZE11bHRpcGx5KGQpO1xuICAgICAgICB0aGlzLmRBZGRPZmZzZXQodywgMCk7XG4gICAgICAgIGogPSAwO1xuICAgICAgICB3ID0gMDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGogPiAwKVxuICAgIHtcbiAgICAgIHRoaXMuZE11bHRpcGx5KE1hdGgucG93KGIsIGopKTtcbiAgICAgIHRoaXMuZEFkZE9mZnNldCh3LCAwKTtcbiAgICB9XG4gICAgaWYgKG1pKSBCaWdJbnRlZ2VyLlpFUk8uc3ViVG8odGhpcywgdGhpcyk7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgYWx0ZXJuYXRlIGNvbnN0cnVjdG9yXG4gIGZ1bmN0aW9uIGJucEZyb21OdW1iZXIoYSwgYiwgYylcbiAge1xuICAgIGlmIChcIm51bWJlclwiID09IHR5cGVvZiBiKVxuICAgIHtcbiAgICAgIC8vIG5ldyBCaWdJbnRlZ2VyKGludCxpbnQsUk5HKVxuICAgICAgaWYgKGEgPCAyKSB0aGlzLmZyb21JbnQoMSk7XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIHRoaXMuZnJvbU51bWJlcihhLCBjKTtcbiAgICAgICAgaWYgKCF0aGlzLnRlc3RCaXQoYSAtIDEpKSAvLyBmb3JjZSBNU0Igc2V0XG4gICAgICAgICAgdGhpcy5iaXR3aXNlVG8oQmlnSW50ZWdlci5PTkUuc2hpZnRMZWZ0KGEgLSAxKSwgb3Bfb3IsIHRoaXMpO1xuICAgICAgICBpZiAodGhpcy5pc0V2ZW4oKSkgdGhpcy5kQWRkT2Zmc2V0KDEsIDApOyAvLyBmb3JjZSBvZGRcbiAgICAgICAgd2hpbGUgKCF0aGlzLmlzUHJvYmFibGVQcmltZShiKSlcbiAgICAgICAge1xuICAgICAgICAgIHRoaXMuZEFkZE9mZnNldCgyLCAwKTtcbiAgICAgICAgICBpZiAodGhpcy5iaXRMZW5ndGgoKSA+IGEpIHRoaXMuc3ViVG8oQmlnSW50ZWdlci5PTkUuc2hpZnRMZWZ0KGEgLSAxKSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIC8vIG5ldyBCaWdJbnRlZ2VyKGludCxSTkcpXG4gICAgICB2YXIgeCA9IG5ldyBBcnJheSgpLFxuICAgICAgICB0ID0gYSAmIDc7XG4gICAgICB4Lmxlbmd0aCA9IChhID4+IDMpICsgMTtcbiAgICAgIGIubmV4dEJ5dGVzKHgpO1xuICAgICAgaWYgKHQgPiAwKSB4WzBdICY9ICgoMSA8PCB0KSAtIDEpO1xuICAgICAgZWxzZSB4WzBdID0gMDtcbiAgICAgIHRoaXMuZnJvbVN0cmluZyh4LCAyNTYpO1xuICAgIH1cbiAgfVxuICAvLyAocHVibGljKSBjb252ZXJ0IHRvIGJpZ2VuZGlhbiBieXRlIGFycmF5XG4gIGZ1bmN0aW9uIGJuVG9CeXRlQXJyYXkoKVxuICB7XG4gICAgdmFyIGkgPSB0aGlzLnQsXG4gICAgICByID0gbmV3IEFycmF5KCk7XG4gICAgclswXSA9IHRoaXMucztcbiAgICB2YXIgcCA9IHRoaXMuREIgLSAoaSAqIHRoaXMuREIpICUgOCxcbiAgICAgIGQsIGsgPSAwO1xuICAgIGlmIChpLS0gPiAwKVxuICAgIHtcbiAgICAgIGlmIChwIDwgdGhpcy5EQiAmJiAoZCA9IHRoaXNbaV0gPj4gcCkgIT0gKHRoaXMucyAmIHRoaXMuRE0pID4+IHApXG4gICAgICAgIHJbaysrXSA9IGQgfCAodGhpcy5zIDw8ICh0aGlzLkRCIC0gcCkpO1xuICAgICAgd2hpbGUgKGkgPj0gMClcbiAgICAgIHtcbiAgICAgICAgaWYgKHAgPCA4KVxuICAgICAgICB7XG4gICAgICAgICAgZCA9ICh0aGlzW2ldICYgKCgxIDw8IHApIC0gMSkpIDw8ICg4IC0gcCk7XG4gICAgICAgICAgZCB8PSB0aGlzWy0taV0gPj4gKHAgKz0gdGhpcy5EQiAtIDgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgIGQgPSAodGhpc1tpXSA+PiAocCAtPSA4KSkgJiAweGZmO1xuICAgICAgICAgIGlmIChwIDw9IDApXG4gICAgICAgICAge1xuICAgICAgICAgICAgcCArPSB0aGlzLkRCO1xuICAgICAgICAgICAgLS1pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoKGQgJiAweDgwKSAhPSAwKSBkIHw9IC0yNTY7XG4gICAgICAgIGlmIChrID09IDAgJiYgKHRoaXMucyAmIDB4ODApICE9IChkICYgMHg4MCkpKytrO1xuICAgICAgICBpZiAoayA+IDAgfHwgZCAhPSB0aGlzLnMpIHJbaysrXSA9IGQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByO1xuICB9XG5cbiAgZnVuY3Rpb24gYm5FcXVhbHMoYSlcbiAge1xuICAgIHJldHVybiAodGhpcy5jb21wYXJlVG8oYSkgPT0gMCk7XG4gIH1cblxuICBmdW5jdGlvbiBibk1pbihhKVxuICB7XG4gICAgcmV0dXJuICh0aGlzLmNvbXBhcmVUbyhhKSA8IDApID8gdGhpcyA6IGE7XG4gIH1cblxuICBmdW5jdGlvbiBibk1heChhKVxuICB7XG4gICAgcmV0dXJuICh0aGlzLmNvbXBhcmVUbyhhKSA+IDApID8gdGhpcyA6IGE7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgb3AgYSAoYml0d2lzZSlcbiAgZnVuY3Rpb24gYm5wQml0d2lzZVRvKGEsIG9wLCByKVxuICB7XG4gICAgdmFyIGksIGYsIG0gPSBNYXRoLm1pbihhLnQsIHRoaXMudCk7XG4gICAgZm9yIChpID0gMDsgaSA8IG07ICsraSkgcltpXSA9IG9wKHRoaXNbaV0sIGFbaV0pO1xuICAgIGlmIChhLnQgPCB0aGlzLnQpXG4gICAge1xuICAgICAgZiA9IGEucyAmIHRoaXMuRE07XG4gICAgICBmb3IgKGkgPSBtOyBpIDwgdGhpcy50OyArK2kpIHJbaV0gPSBvcCh0aGlzW2ldLCBmKTtcbiAgICAgIHIudCA9IHRoaXMudDtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIGYgPSB0aGlzLnMgJiB0aGlzLkRNO1xuICAgICAgZm9yIChpID0gbTsgaSA8IGEudDsgKytpKSByW2ldID0gb3AoZiwgYVtpXSk7XG4gICAgICByLnQgPSBhLnQ7XG4gICAgfVxuICAgIHIucyA9IG9wKHRoaXMucywgYS5zKTtcbiAgICByLmNsYW1wKCk7XG4gIH1cbiAgLy8gKHB1YmxpYykgdGhpcyAmIGFcbiAgZnVuY3Rpb24gb3BfYW5kKHgsIHkpXG4gIHtcbiAgICByZXR1cm4geCAmIHk7XG4gIH1cblxuICBmdW5jdGlvbiBibkFuZChhKVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB0aGlzLmJpdHdpc2VUbyhhLCBvcF9hbmQsIHIpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIHRoaXMgfCBhXG4gIGZ1bmN0aW9uIG9wX29yKHgsIHkpXG4gIHtcbiAgICByZXR1cm4geCB8IHk7XG4gIH1cblxuICBmdW5jdGlvbiBibk9yKGEpXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHRoaXMuYml0d2lzZVRvKGEsIG9wX29yLCByKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSB0aGlzIF4gYVxuICBmdW5jdGlvbiBvcF94b3IoeCwgeSlcbiAge1xuICAgIHJldHVybiB4IF4geTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJuWG9yKGEpXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHRoaXMuYml0d2lzZVRvKGEsIG9wX3hvciwgcik7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgdGhpcyAmIH5hXG4gIGZ1bmN0aW9uIG9wX2FuZG5vdCh4LCB5KVxuICB7XG4gICAgcmV0dXJuIHggJiB+eTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJuQW5kTm90KGEpXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHRoaXMuYml0d2lzZVRvKGEsIG9wX2FuZG5vdCwgcik7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgfnRoaXNcbiAgZnVuY3Rpb24gYm5Ob3QoKVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudDsgKytpKSByW2ldID0gdGhpcy5ETSAmIH50aGlzW2ldO1xuICAgIHIudCA9IHRoaXMudDtcbiAgICByLnMgPSB+dGhpcy5zO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIHRoaXMgPDwgblxuICBmdW5jdGlvbiBiblNoaWZ0TGVmdChuKVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICBpZiAobiA8IDApIHRoaXMuclNoaWZ0VG8oLW4sIHIpO1xuICAgIGVsc2UgdGhpcy5sU2hpZnRUbyhuLCByKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSB0aGlzID4+IG5cbiAgZnVuY3Rpb24gYm5TaGlmdFJpZ2h0KG4pXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIGlmIChuIDwgMCkgdGhpcy5sU2hpZnRUbygtbiwgcik7XG4gICAgZWxzZSB0aGlzLnJTaGlmdFRvKG4sIHIpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIHJldHVybiBpbmRleCBvZiBsb3dlc3QgMS1iaXQgaW4geCwgeCA8IDJeMzFcbiAgZnVuY3Rpb24gbGJpdCh4KVxuICB7XG4gICAgaWYgKHggPT0gMCkgcmV0dXJuIC0xO1xuICAgIHZhciByID0gMDtcbiAgICBpZiAoKHggJiAweGZmZmYpID09IDApXG4gICAge1xuICAgICAgeCA+Pj0gMTY7XG4gICAgICByICs9IDE2O1xuICAgIH1cbiAgICBpZiAoKHggJiAweGZmKSA9PSAwKVxuICAgIHtcbiAgICAgIHggPj49IDg7XG4gICAgICByICs9IDg7XG4gICAgfVxuICAgIGlmICgoeCAmIDB4ZikgPT0gMClcbiAgICB7XG4gICAgICB4ID4+PSA0O1xuICAgICAgciArPSA0O1xuICAgIH1cbiAgICBpZiAoKHggJiAzKSA9PSAwKVxuICAgIHtcbiAgICAgIHggPj49IDI7XG4gICAgICByICs9IDI7XG4gICAgfVxuICAgIGlmICgoeCAmIDEpID09IDApKytyO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIHJldHVybnMgaW5kZXggb2YgbG93ZXN0IDEtYml0IChvciAtMSBpZiBub25lKVxuICBmdW5jdGlvbiBibkdldExvd2VzdFNldEJpdCgpXG4gIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudDsgKytpKVxuICAgICAgaWYgKHRoaXNbaV0gIT0gMCkgcmV0dXJuIGkgKiB0aGlzLkRCICsgbGJpdCh0aGlzW2ldKTtcbiAgICBpZiAodGhpcy5zIDwgMCkgcmV0dXJuIHRoaXMudCAqIHRoaXMuREI7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIC8vIHJldHVybiBudW1iZXIgb2YgMSBiaXRzIGluIHhcbiAgZnVuY3Rpb24gY2JpdCh4KVxuICB7XG4gICAgdmFyIHIgPSAwO1xuICAgIHdoaWxlICh4ICE9IDApXG4gICAge1xuICAgICAgeCAmPSB4IC0gMTtcbiAgICAgICsrcjtcbiAgICB9XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgcmV0dXJuIG51bWJlciBvZiBzZXQgYml0c1xuICBmdW5jdGlvbiBibkJpdENvdW50KClcbiAge1xuICAgIHZhciByID0gMCxcbiAgICAgIHggPSB0aGlzLnMgJiB0aGlzLkRNO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy50OyArK2kpIHIgKz0gY2JpdCh0aGlzW2ldIF4geCk7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgdHJ1ZSBpZmYgbnRoIGJpdCBpcyBzZXRcbiAgZnVuY3Rpb24gYm5UZXN0Qml0KG4pXG4gIHtcbiAgICB2YXIgaiA9IE1hdGguZmxvb3IobiAvIHRoaXMuREIpO1xuICAgIGlmIChqID49IHRoaXMudCkgcmV0dXJuICh0aGlzLnMgIT0gMCk7XG4gICAgcmV0dXJuICgodGhpc1tqXSAmICgxIDw8IChuICUgdGhpcy5EQikpKSAhPSAwKTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSB0aGlzIG9wICgxPDxuKVxuICBmdW5jdGlvbiBibnBDaGFuZ2VCaXQobiwgb3ApXG4gIHtcbiAgICB2YXIgciA9IEJpZ0ludGVnZXIuT05FLnNoaWZ0TGVmdChuKTtcbiAgICB0aGlzLmJpdHdpc2VUbyhyLCBvcCwgcik7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgdGhpcyB8ICgxPDxuKVxuICBmdW5jdGlvbiBiblNldEJpdChuKVxuICB7XG4gICAgcmV0dXJuIHRoaXMuY2hhbmdlQml0KG4sIG9wX29yKTtcbiAgfVxuICAvLyAocHVibGljKSB0aGlzICYgfigxPDxuKVxuICBmdW5jdGlvbiBibkNsZWFyQml0KG4pXG4gIHtcbiAgICByZXR1cm4gdGhpcy5jaGFuZ2VCaXQobiwgb3BfYW5kbm90KTtcbiAgfVxuICAvLyAocHVibGljKSB0aGlzIF4gKDE8PG4pXG4gIGZ1bmN0aW9uIGJuRmxpcEJpdChuKVxuICB7XG4gICAgcmV0dXJuIHRoaXMuY2hhbmdlQml0KG4sIG9wX3hvcik7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgKyBhXG4gIGZ1bmN0aW9uIGJucEFkZFRvKGEsIHIpXG4gIHtcbiAgICB2YXIgaSA9IDAsXG4gICAgICBjID0gMCxcbiAgICAgIG0gPSBNYXRoLm1pbihhLnQsIHRoaXMudCk7XG4gICAgd2hpbGUgKGkgPCBtKVxuICAgIHtcbiAgICAgIGMgKz0gdGhpc1tpXSArIGFbaV07XG4gICAgICByW2krK10gPSBjICYgdGhpcy5ETTtcbiAgICAgIGMgPj49IHRoaXMuREI7XG4gICAgfVxuICAgIGlmIChhLnQgPCB0aGlzLnQpXG4gICAge1xuICAgICAgYyArPSBhLnM7XG4gICAgICB3aGlsZSAoaSA8IHRoaXMudClcbiAgICAgIHtcbiAgICAgICAgYyArPSB0aGlzW2ldO1xuICAgICAgICByW2krK10gPSBjICYgdGhpcy5ETTtcbiAgICAgICAgYyA+Pj0gdGhpcy5EQjtcbiAgICAgIH1cbiAgICAgIGMgKz0gdGhpcy5zO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgYyArPSB0aGlzLnM7XG4gICAgICB3aGlsZSAoaSA8IGEudClcbiAgICAgIHtcbiAgICAgICAgYyArPSBhW2ldO1xuICAgICAgICByW2krK10gPSBjICYgdGhpcy5ETTtcbiAgICAgICAgYyA+Pj0gdGhpcy5EQjtcbiAgICAgIH1cbiAgICAgIGMgKz0gYS5zO1xuICAgIH1cbiAgICByLnMgPSAoYyA8IDApID8gLTEgOiAwO1xuICAgIGlmIChjID4gMCkgcltpKytdID0gYztcbiAgICBlbHNlIGlmIChjIDwgLTEpIHJbaSsrXSA9IHRoaXMuRFYgKyBjO1xuICAgIHIudCA9IGk7XG4gICAgci5jbGFtcCgpO1xuICB9XG4gIC8vIChwdWJsaWMpIHRoaXMgKyBhXG4gIGZ1bmN0aW9uIGJuQWRkKGEpXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHRoaXMuYWRkVG8oYSwgcik7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgdGhpcyAtIGFcbiAgZnVuY3Rpb24gYm5TdWJ0cmFjdChhKVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB0aGlzLnN1YlRvKGEsIHIpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIHRoaXMgKiBhXG4gIGZ1bmN0aW9uIGJuTXVsdGlwbHkoYSlcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgdGhpcy5tdWx0aXBseVRvKGEsIHIpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIHRoaXNeMlxuICBmdW5jdGlvbiBiblNxdWFyZSgpXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHRoaXMuc3F1YXJlVG8ocik7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgdGhpcyAvIGFcbiAgZnVuY3Rpb24gYm5EaXZpZGUoYSlcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgdGhpcy5kaXZSZW1UbyhhLCByLCBudWxsKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSB0aGlzICUgYVxuICBmdW5jdGlvbiBiblJlbWFpbmRlcihhKVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB0aGlzLmRpdlJlbVRvKGEsIG51bGwsIHIpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIFt0aGlzL2EsdGhpcyVhXVxuICBmdW5jdGlvbiBibkRpdmlkZUFuZFJlbWFpbmRlcihhKVxuICB7XG4gICAgdmFyIHEgPSBuYmkoKSxcbiAgICAgIHIgPSBuYmkoKTtcbiAgICB0aGlzLmRpdlJlbVRvKGEsIHEsIHIpO1xuICAgIHJldHVybiBuZXcgQXJyYXkocSwgcik7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgdGhpcyAqPSBuLCB0aGlzID49IDAsIDEgPCBuIDwgRFZcbiAgZnVuY3Rpb24gYm5wRE11bHRpcGx5KG4pXG4gIHtcbiAgICB0aGlzW3RoaXMudF0gPSB0aGlzLmFtKDAsIG4gLSAxLCB0aGlzLCAwLCAwLCB0aGlzLnQpO1xuICAgICsrdGhpcy50O1xuICAgIHRoaXMuY2xhbXAoKTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSB0aGlzICs9IG4gPDwgdyB3b3JkcywgdGhpcyA+PSAwXG4gIGZ1bmN0aW9uIGJucERBZGRPZmZzZXQobiwgdylcbiAge1xuICAgIGlmIChuID09IDApIHJldHVybjtcbiAgICB3aGlsZSAodGhpcy50IDw9IHcpIHRoaXNbdGhpcy50KytdID0gMDtcbiAgICB0aGlzW3ddICs9IG47XG4gICAgd2hpbGUgKHRoaXNbd10gPj0gdGhpcy5EVilcbiAgICB7XG4gICAgICB0aGlzW3ddIC09IHRoaXMuRFY7XG4gICAgICBpZiAoKyt3ID49IHRoaXMudCkgdGhpc1t0aGlzLnQrK10gPSAwO1xuICAgICAgKyt0aGlzW3ddO1xuICAgIH1cbiAgfVxuICAvLyBBIFwibnVsbFwiIHJlZHVjZXJcbiAgZnVuY3Rpb24gTnVsbEV4cCgpXG4gIHt9XG5cbiAgZnVuY3Rpb24gbk5vcCh4KVxuICB7XG4gICAgcmV0dXJuIHg7XG4gIH1cblxuICBmdW5jdGlvbiBuTXVsVG8oeCwgeSwgcilcbiAge1xuICAgIHgubXVsdGlwbHlUbyh5LCByKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5TcXJUbyh4LCByKVxuICB7XG4gICAgeC5zcXVhcmVUbyhyKTtcbiAgfVxuICBOdWxsRXhwLnByb3RvdHlwZS5jb252ZXJ0ID0gbk5vcDtcbiAgTnVsbEV4cC5wcm90b3R5cGUucmV2ZXJ0ID0gbk5vcDtcbiAgTnVsbEV4cC5wcm90b3R5cGUubXVsVG8gPSBuTXVsVG87XG4gIE51bGxFeHAucHJvdG90eXBlLnNxclRvID0gblNxclRvO1xuICAvLyAocHVibGljKSB0aGlzXmVcbiAgZnVuY3Rpb24gYm5Qb3coZSlcbiAge1xuICAgIHJldHVybiB0aGlzLmV4cChlLCBuZXcgTnVsbEV4cCgpKTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSByID0gbG93ZXIgbiB3b3JkcyBvZiBcInRoaXMgKiBhXCIsIGEudCA8PSBuXG4gIC8vIFwidGhpc1wiIHNob3VsZCBiZSB0aGUgbGFyZ2VyIG9uZSBpZiBhcHByb3ByaWF0ZS5cbiAgZnVuY3Rpb24gYm5wTXVsdGlwbHlMb3dlclRvKGEsIG4sIHIpXG4gIHtcbiAgICB2YXIgaSA9IE1hdGgubWluKHRoaXMudCArIGEudCwgbik7XG4gICAgci5zID0gMDsgLy8gYXNzdW1lcyBhLHRoaXMgPj0gMFxuICAgIHIudCA9IGk7XG4gICAgd2hpbGUgKGkgPiAwKSByWy0taV0gPSAwO1xuICAgIHZhciBqO1xuICAgIGZvciAoaiA9IHIudCAtIHRoaXMudDsgaSA8IGo7ICsraSkgcltpICsgdGhpcy50XSA9IHRoaXMuYW0oMCwgYVtpXSwgciwgaSwgMCwgdGhpcy50KTtcbiAgICBmb3IgKGogPSBNYXRoLm1pbihhLnQsIG4pOyBpIDwgajsgKytpKSB0aGlzLmFtKDAsIGFbaV0sIHIsIGksIDAsIG4gLSBpKTtcbiAgICByLmNsYW1wKCk7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgciA9IFwidGhpcyAqIGFcIiB3aXRob3V0IGxvd2VyIG4gd29yZHMsIG4gPiAwXG4gIC8vIFwidGhpc1wiIHNob3VsZCBiZSB0aGUgbGFyZ2VyIG9uZSBpZiBhcHByb3ByaWF0ZS5cbiAgZnVuY3Rpb24gYm5wTXVsdGlwbHlVcHBlclRvKGEsIG4sIHIpXG4gIHtcbiAgICAtLW47XG4gICAgdmFyIGkgPSByLnQgPSB0aGlzLnQgKyBhLnQgLSBuO1xuICAgIHIucyA9IDA7IC8vIGFzc3VtZXMgYSx0aGlzID49IDBcbiAgICB3aGlsZSAoLS1pID49IDApIHJbaV0gPSAwO1xuICAgIGZvciAoaSA9IE1hdGgubWF4KG4gLSB0aGlzLnQsIDApOyBpIDwgYS50OyArK2kpXG4gICAgICByW3RoaXMudCArIGkgLSBuXSA9IHRoaXMuYW0obiAtIGksIGFbaV0sIHIsIDAsIDAsIHRoaXMudCArIGkgLSBuKTtcbiAgICByLmNsYW1wKCk7XG4gICAgci5kclNoaWZ0VG8oMSwgcik7XG4gIH1cbiAgLy8gQmFycmV0dCBtb2R1bGFyIHJlZHVjdGlvblxuICBmdW5jdGlvbiBCYXJyZXR0KG0pXG4gIHtcbiAgICAvLyBzZXR1cCBCYXJyZXR0XG4gICAgdGhpcy5yMiA9IG5iaSgpO1xuICAgIHRoaXMucTMgPSBuYmkoKTtcbiAgICBCaWdJbnRlZ2VyLk9ORS5kbFNoaWZ0VG8oMiAqIG0udCwgdGhpcy5yMik7XG4gICAgdGhpcy5tdSA9IHRoaXMucjIuZGl2aWRlKG0pO1xuICAgIHRoaXMubSA9IG07XG4gIH1cblxuICBmdW5jdGlvbiBiYXJyZXR0Q29udmVydCh4KVxuICB7XG4gICAgaWYgKHgucyA8IDAgfHwgeC50ID4gMiAqIHRoaXMubS50KSByZXR1cm4geC5tb2QodGhpcy5tKTtcbiAgICBlbHNlIGlmICh4LmNvbXBhcmVUbyh0aGlzLm0pIDwgMCkgcmV0dXJuIHg7XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIHZhciByID0gbmJpKCk7XG4gICAgICB4LmNvcHlUbyhyKTtcbiAgICAgIHRoaXMucmVkdWNlKHIpO1xuICAgICAgcmV0dXJuIHI7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYmFycmV0dFJldmVydCh4KVxuICB7XG4gICAgcmV0dXJuIHg7XG4gIH1cbiAgLy8geCA9IHggbW9kIG0gKEhBQyAxNC40MilcbiAgZnVuY3Rpb24gYmFycmV0dFJlZHVjZSh4KVxuICB7XG4gICAgeC5kclNoaWZ0VG8odGhpcy5tLnQgLSAxLCB0aGlzLnIyKTtcbiAgICBpZiAoeC50ID4gdGhpcy5tLnQgKyAxKVxuICAgIHtcbiAgICAgIHgudCA9IHRoaXMubS50ICsgMTtcbiAgICAgIHguY2xhbXAoKTtcbiAgICB9XG4gICAgdGhpcy5tdS5tdWx0aXBseVVwcGVyVG8odGhpcy5yMiwgdGhpcy5tLnQgKyAxLCB0aGlzLnEzKTtcbiAgICB0aGlzLm0ubXVsdGlwbHlMb3dlclRvKHRoaXMucTMsIHRoaXMubS50ICsgMSwgdGhpcy5yMik7XG4gICAgd2hpbGUgKHguY29tcGFyZVRvKHRoaXMucjIpIDwgMCkgeC5kQWRkT2Zmc2V0KDEsIHRoaXMubS50ICsgMSk7XG4gICAgeC5zdWJUbyh0aGlzLnIyLCB4KTtcbiAgICB3aGlsZSAoeC5jb21wYXJlVG8odGhpcy5tKSA+PSAwKSB4LnN1YlRvKHRoaXMubSwgeCk7XG4gIH1cbiAgLy8gciA9IHheMiBtb2QgbTsgeCAhPSByXG4gIGZ1bmN0aW9uIGJhcnJldHRTcXJUbyh4LCByKVxuICB7XG4gICAgeC5zcXVhcmVUbyhyKTtcbiAgICB0aGlzLnJlZHVjZShyKTtcbiAgfVxuICAvLyByID0geCp5IG1vZCBtOyB4LHkgIT0gclxuICBmdW5jdGlvbiBiYXJyZXR0TXVsVG8oeCwgeSwgcilcbiAge1xuICAgIHgubXVsdGlwbHlUbyh5LCByKTtcbiAgICB0aGlzLnJlZHVjZShyKTtcbiAgfVxuICBCYXJyZXR0LnByb3RvdHlwZS5jb252ZXJ0ID0gYmFycmV0dENvbnZlcnQ7XG4gIEJhcnJldHQucHJvdG90eXBlLnJldmVydCA9IGJhcnJldHRSZXZlcnQ7XG4gIEJhcnJldHQucHJvdG90eXBlLnJlZHVjZSA9IGJhcnJldHRSZWR1Y2U7XG4gIEJhcnJldHQucHJvdG90eXBlLm11bFRvID0gYmFycmV0dE11bFRvO1xuICBCYXJyZXR0LnByb3RvdHlwZS5zcXJUbyA9IGJhcnJldHRTcXJUbztcbiAgLy8gKHB1YmxpYykgdGhpc15lICUgbSAoSEFDIDE0Ljg1KVxuICBmdW5jdGlvbiBibk1vZFBvdyhlLCBtKVxuICB7XG4gICAgdmFyIGkgPSBlLmJpdExlbmd0aCgpLFxuICAgICAgaywgciA9IG5idigxKSxcbiAgICAgIHo7XG4gICAgaWYgKGkgPD0gMCkgcmV0dXJuIHI7XG4gICAgZWxzZSBpZiAoaSA8IDE4KSBrID0gMTtcbiAgICBlbHNlIGlmIChpIDwgNDgpIGsgPSAzO1xuICAgIGVsc2UgaWYgKGkgPCAxNDQpIGsgPSA0O1xuICAgIGVsc2UgaWYgKGkgPCA3NjgpIGsgPSA1O1xuICAgIGVsc2UgayA9IDY7XG4gICAgaWYgKGkgPCA4KVxuICAgICAgeiA9IG5ldyBDbGFzc2ljKG0pO1xuICAgIGVsc2UgaWYgKG0uaXNFdmVuKCkpXG4gICAgICB6ID0gbmV3IEJhcnJldHQobSk7XG4gICAgZWxzZVxuICAgICAgeiA9IG5ldyBNb250Z29tZXJ5KG0pO1xuICAgIC8vIHByZWNvbXB1dGF0aW9uXG4gICAgdmFyIGcgPSBuZXcgQXJyYXkoKSxcbiAgICAgIG4gPSAzLFxuICAgICAgazEgPSBrIC0gMSxcbiAgICAgIGttID0gKDEgPDwgaykgLSAxO1xuICAgIGdbMV0gPSB6LmNvbnZlcnQodGhpcyk7XG4gICAgaWYgKGsgPiAxKVxuICAgIHtcbiAgICAgIHZhciBnMiA9IG5iaSgpO1xuICAgICAgei5zcXJUbyhnWzFdLCBnMik7XG4gICAgICB3aGlsZSAobiA8PSBrbSlcbiAgICAgIHtcbiAgICAgICAgZ1tuXSA9IG5iaSgpO1xuICAgICAgICB6Lm11bFRvKGcyLCBnW24gLSAyXSwgZ1tuXSk7XG4gICAgICAgIG4gKz0gMjtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGogPSBlLnQgLSAxLFxuICAgICAgdywgaXMxID0gdHJ1ZSxcbiAgICAgIHIyID0gbmJpKCksXG4gICAgICB0O1xuICAgIGkgPSBuYml0cyhlW2pdKSAtIDE7XG4gICAgd2hpbGUgKGogPj0gMClcbiAgICB7XG4gICAgICBpZiAoaSA+PSBrMSkgdyA9IChlW2pdID4+IChpIC0gazEpKSAmIGttO1xuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICB3ID0gKGVbal0gJiAoKDEgPDwgKGkgKyAxKSkgLSAxKSkgPDwgKGsxIC0gaSk7XG4gICAgICAgIGlmIChqID4gMCkgdyB8PSBlW2ogLSAxXSA+PiAodGhpcy5EQiArIGkgLSBrMSk7XG4gICAgICB9XG4gICAgICBuID0gaztcbiAgICAgIHdoaWxlICgodyAmIDEpID09IDApXG4gICAgICB7XG4gICAgICAgIHcgPj49IDE7XG4gICAgICAgIC0tbjtcbiAgICAgIH1cbiAgICAgIGlmICgoaSAtPSBuKSA8IDApXG4gICAgICB7XG4gICAgICAgIGkgKz0gdGhpcy5EQjtcbiAgICAgICAgLS1qO1xuICAgICAgfVxuICAgICAgaWYgKGlzMSlcbiAgICAgIHsgLy8gcmV0ID09IDEsIGRvbid0IGJvdGhlciBzcXVhcmluZyBvciBtdWx0aXBseWluZyBpdFxuICAgICAgICBnW3ddLmNvcHlUbyhyKTtcbiAgICAgICAgaXMxID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIHdoaWxlIChuID4gMSlcbiAgICAgICAge1xuICAgICAgICAgIHouc3FyVG8ociwgcjIpO1xuICAgICAgICAgIHouc3FyVG8ocjIsIHIpO1xuICAgICAgICAgIG4gLT0gMjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobiA+IDApIHouc3FyVG8ociwgcjIpO1xuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICB0ID0gcjtcbiAgICAgICAgICByID0gcjI7XG4gICAgICAgICAgcjIgPSB0O1xuICAgICAgICB9XG4gICAgICAgIHoubXVsVG8ocjIsIGdbd10sIHIpO1xuICAgICAgfVxuICAgICAgd2hpbGUgKGogPj0gMCAmJiAoZVtqXSAmICgxIDw8IGkpKSA9PSAwKVxuICAgICAge1xuICAgICAgICB6LnNxclRvKHIsIHIyKTtcbiAgICAgICAgdCA9IHI7XG4gICAgICAgIHIgPSByMjtcbiAgICAgICAgcjIgPSB0O1xuICAgICAgICBpZiAoLS1pIDwgMClcbiAgICAgICAge1xuICAgICAgICAgIGkgPSB0aGlzLkRCIC0gMTtcbiAgICAgICAgICAtLWo7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHoucmV2ZXJ0KHIpO1xuICB9XG4gIC8vIChwdWJsaWMpIGdjZCh0aGlzLGEpIChIQUMgMTQuNTQpXG4gIGZ1bmN0aW9uIGJuR0NEKGEpXG4gIHtcbiAgICB2YXIgeCA9ICh0aGlzLnMgPCAwKSA/IHRoaXMubmVnYXRlKCkgOiB0aGlzLmNsb25lKCk7XG4gICAgdmFyIHkgPSAoYS5zIDwgMCkgPyBhLm5lZ2F0ZSgpIDogYS5jbG9uZSgpO1xuICAgIGlmICh4LmNvbXBhcmVUbyh5KSA8IDApXG4gICAge1xuICAgICAgdmFyIHQgPSB4O1xuICAgICAgeCA9IHk7XG4gICAgICB5ID0gdDtcbiAgICB9XG4gICAgdmFyIGkgPSB4LmdldExvd2VzdFNldEJpdCgpLFxuICAgICAgZyA9IHkuZ2V0TG93ZXN0U2V0Qml0KCk7XG4gICAgaWYgKGcgPCAwKSByZXR1cm4geDtcbiAgICBpZiAoaSA8IGcpIGcgPSBpO1xuICAgIGlmIChnID4gMClcbiAgICB7XG4gICAgICB4LnJTaGlmdFRvKGcsIHgpO1xuICAgICAgeS5yU2hpZnRUbyhnLCB5KTtcbiAgICB9XG4gICAgd2hpbGUgKHguc2lnbnVtKCkgPiAwKVxuICAgIHtcbiAgICAgIGlmICgoaSA9IHguZ2V0TG93ZXN0U2V0Qml0KCkpID4gMCkgeC5yU2hpZnRUbyhpLCB4KTtcbiAgICAgIGlmICgoaSA9IHkuZ2V0TG93ZXN0U2V0Qml0KCkpID4gMCkgeS5yU2hpZnRUbyhpLCB5KTtcbiAgICAgIGlmICh4LmNvbXBhcmVUbyh5KSA+PSAwKVxuICAgICAge1xuICAgICAgICB4LnN1YlRvKHksIHgpO1xuICAgICAgICB4LnJTaGlmdFRvKDEsIHgpO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICB5LnN1YlRvKHgsIHkpO1xuICAgICAgICB5LnJTaGlmdFRvKDEsIHkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZyA+IDApIHkubFNoaWZ0VG8oZywgeSk7XG4gICAgcmV0dXJuIHk7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgdGhpcyAlIG4sIG4gPCAyXjI2XG4gIGZ1bmN0aW9uIGJucE1vZEludChuKVxuICB7XG4gICAgaWYgKG4gPD0gMCkgcmV0dXJuIDA7XG4gICAgdmFyIGQgPSB0aGlzLkRWICUgbixcbiAgICAgIHIgPSAodGhpcy5zIDwgMCkgPyBuIC0gMSA6IDA7XG4gICAgaWYgKHRoaXMudCA+IDApXG4gICAgICBpZiAoZCA9PSAwKSByID0gdGhpc1swXSAlIG47XG4gICAgICBlbHNlXG4gICAgICAgIGZvciAodmFyIGkgPSB0aGlzLnQgLSAxOyBpID49IDA7IC0taSkgciA9IChkICogciArIHRoaXNbaV0pICUgbjtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSAxL3RoaXMgJSBtIChIQUMgMTQuNjEpXG4gIGZ1bmN0aW9uIGJuTW9kSW52ZXJzZShtKVxuICB7XG4gICAgdmFyIGFjID0gbS5pc0V2ZW4oKTtcbiAgICBpZiAoKHRoaXMuaXNFdmVuKCkgJiYgYWMpIHx8IG0uc2lnbnVtKCkgPT0gMCkgcmV0dXJuIEJpZ0ludGVnZXIuWkVSTztcbiAgICB2YXIgdSA9IG0uY2xvbmUoKSxcbiAgICAgIHYgPSB0aGlzLmNsb25lKCk7XG4gICAgdmFyIGEgPSBuYnYoMSksXG4gICAgICBiID0gbmJ2KDApLFxuICAgICAgYyA9IG5idigwKSxcbiAgICAgIGQgPSBuYnYoMSk7XG4gICAgd2hpbGUgKHUuc2lnbnVtKCkgIT0gMClcbiAgICB7XG4gICAgICB3aGlsZSAodS5pc0V2ZW4oKSlcbiAgICAgIHtcbiAgICAgICAgdS5yU2hpZnRUbygxLCB1KTtcbiAgICAgICAgaWYgKGFjKVxuICAgICAgICB7XG4gICAgICAgICAgaWYgKCFhLmlzRXZlbigpIHx8ICFiLmlzRXZlbigpKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGEuYWRkVG8odGhpcywgYSk7XG4gICAgICAgICAgICBiLnN1YlRvKG0sIGIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhLnJTaGlmdFRvKDEsIGEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFiLmlzRXZlbigpKSBiLnN1YlRvKG0sIGIpO1xuICAgICAgICBiLnJTaGlmdFRvKDEsIGIpO1xuICAgICAgfVxuICAgICAgd2hpbGUgKHYuaXNFdmVuKCkpXG4gICAgICB7XG4gICAgICAgIHYuclNoaWZ0VG8oMSwgdik7XG4gICAgICAgIGlmIChhYylcbiAgICAgICAge1xuICAgICAgICAgIGlmICghYy5pc0V2ZW4oKSB8fCAhZC5pc0V2ZW4oKSlcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjLmFkZFRvKHRoaXMsIGMpO1xuICAgICAgICAgICAgZC5zdWJUbyhtLCBkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYy5yU2hpZnRUbygxLCBjKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghZC5pc0V2ZW4oKSkgZC5zdWJUbyhtLCBkKTtcbiAgICAgICAgZC5yU2hpZnRUbygxLCBkKTtcbiAgICAgIH1cbiAgICAgIGlmICh1LmNvbXBhcmVUbyh2KSA+PSAwKVxuICAgICAge1xuICAgICAgICB1LnN1YlRvKHYsIHUpO1xuICAgICAgICBpZiAoYWMpIGEuc3ViVG8oYywgYSk7XG4gICAgICAgIGIuc3ViVG8oZCwgYik7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIHYuc3ViVG8odSwgdik7XG4gICAgICAgIGlmIChhYykgYy5zdWJUbyhhLCBjKTtcbiAgICAgICAgZC5zdWJUbyhiLCBkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHYuY29tcGFyZVRvKEJpZ0ludGVnZXIuT05FKSAhPSAwKSByZXR1cm4gQmlnSW50ZWdlci5aRVJPO1xuICAgIGlmIChkLmNvbXBhcmVUbyhtKSA+PSAwKSByZXR1cm4gZC5zdWJ0cmFjdChtKTtcbiAgICBpZiAoZC5zaWdudW0oKSA8IDApIGQuYWRkVG8obSwgZCk7XG4gICAgZWxzZSByZXR1cm4gZDtcbiAgICBpZiAoZC5zaWdudW0oKSA8IDApIHJldHVybiBkLmFkZChtKTtcbiAgICBlbHNlIHJldHVybiBkO1xuICB9XG4gIHZhciBsb3dwcmltZXMgPSBbMiwgMywgNSwgNywgMTEsIDEzLCAxNywgMTksIDIzLCAyOSwgMzEsIDM3LCA0MSwgNDMsIDQ3LCA1MywgNTksIDYxLCA2NywgNzEsIDczLCA3OSwgODMsIDg5LCA5NywgMTAxLCAxMDMsIDEwNywgMTA5LCAxMTMsIDEyNywgMTMxLCAxMzcsIDEzOSwgMTQ5LCAxNTEsIDE1NywgMTYzLCAxNjcsIDE3MywgMTc5LCAxODEsIDE5MSwgMTkzLCAxOTcsIDE5OSwgMjExLCAyMjMsIDIyNywgMjI5LCAyMzMsIDIzOSwgMjQxLCAyNTEsIDI1NywgMjYzLCAyNjksIDI3MSwgMjc3LCAyODEsIDI4MywgMjkzLCAzMDcsIDMxMSwgMzEzLCAzMTcsIDMzMSwgMzM3LCAzNDcsIDM0OSwgMzUzLCAzNTksIDM2NywgMzczLCAzNzksIDM4MywgMzg5LCAzOTcsIDQwMSwgNDA5LCA0MTksIDQyMSwgNDMxLCA0MzMsIDQzOSwgNDQzLCA0NDksIDQ1NywgNDYxLCA0NjMsIDQ2NywgNDc5LCA0ODcsIDQ5MSwgNDk5LCA1MDMsIDUwOSwgNTIxLCA1MjMsIDU0MSwgNTQ3LCA1NTcsIDU2MywgNTY5LCA1NzEsIDU3NywgNTg3LCA1OTMsIDU5OSwgNjAxLCA2MDcsIDYxMywgNjE3LCA2MTksIDYzMSwgNjQxLCA2NDMsIDY0NywgNjUzLCA2NTksIDY2MSwgNjczLCA2NzcsIDY4MywgNjkxLCA3MDEsIDcwOSwgNzE5LCA3MjcsIDczMywgNzM5LCA3NDMsIDc1MSwgNzU3LCA3NjEsIDc2OSwgNzczLCA3ODcsIDc5NywgODA5LCA4MTEsIDgyMSwgODIzLCA4MjcsIDgyOSwgODM5LCA4NTMsIDg1NywgODU5LCA4NjMsIDg3NywgODgxLCA4ODMsIDg4NywgOTA3LCA5MTEsIDkxOSwgOTI5LCA5MzcsIDk0MSwgOTQ3LCA5NTMsIDk2NywgOTcxLCA5NzcsIDk4MywgOTkxLCA5OTddO1xuICB2YXIgbHBsaW0gPSAoMSA8PCAyNikgLyBsb3dwcmltZXNbbG93cHJpbWVzLmxlbmd0aCAtIDFdO1xuICAvLyAocHVibGljKSB0ZXN0IHByaW1hbGl0eSB3aXRoIGNlcnRhaW50eSA+PSAxLS41XnRcbiAgZnVuY3Rpb24gYm5Jc1Byb2JhYmxlUHJpbWUodClcbiAge1xuICAgIHZhciBpLCB4ID0gdGhpcy5hYnMoKTtcbiAgICBpZiAoeC50ID09IDEgJiYgeFswXSA8PSBsb3dwcmltZXNbbG93cHJpbWVzLmxlbmd0aCAtIDFdKVxuICAgIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsb3dwcmltZXMubGVuZ3RoOyArK2kpXG4gICAgICAgIGlmICh4WzBdID09IGxvd3ByaW1lc1tpXSkgcmV0dXJuIHRydWU7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICh4LmlzRXZlbigpKSByZXR1cm4gZmFsc2U7XG4gICAgaSA9IDE7XG4gICAgd2hpbGUgKGkgPCBsb3dwcmltZXMubGVuZ3RoKVxuICAgIHtcbiAgICAgIHZhciBtID0gbG93cHJpbWVzW2ldLFxuICAgICAgICBqID0gaSArIDE7XG4gICAgICB3aGlsZSAoaiA8IGxvd3ByaW1lcy5sZW5ndGggJiYgbSA8IGxwbGltKSBtICo9IGxvd3ByaW1lc1tqKytdO1xuICAgICAgbSA9IHgubW9kSW50KG0pO1xuICAgICAgd2hpbGUgKGkgPCBqKVxuICAgICAgICBpZiAobSAlIGxvd3ByaW1lc1tpKytdID09IDApIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHgubWlsbGVyUmFiaW4odCk7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgdHJ1ZSBpZiBwcm9iYWJseSBwcmltZSAoSEFDIDQuMjQsIE1pbGxlci1SYWJpbilcbiAgZnVuY3Rpb24gYm5wTWlsbGVyUmFiaW4odClcbiAge1xuICAgIHZhciBuMSA9IHRoaXMuc3VidHJhY3QoQmlnSW50ZWdlci5PTkUpO1xuICAgIHZhciBrID0gbjEuZ2V0TG93ZXN0U2V0Qml0KCk7XG4gICAgaWYgKGsgPD0gMCkgcmV0dXJuIGZhbHNlO1xuICAgIHZhciByID0gbjEuc2hpZnRSaWdodChrKTtcbiAgICB0ID0gKHQgKyAxKSA+PiAxO1xuICAgIGlmICh0ID4gbG93cHJpbWVzLmxlbmd0aCkgdCA9IGxvd3ByaW1lcy5sZW5ndGg7XG4gICAgdmFyIGEgPSBuYmkoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHQ7ICsraSlcbiAgICB7XG4gICAgICAvL1BpY2sgYmFzZXMgYXQgcmFuZG9tLCBpbnN0ZWFkIG9mIHN0YXJ0aW5nIGF0IDJcbiAgICAgIGEuZnJvbUludChsb3dwcmltZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbG93cHJpbWVzLmxlbmd0aCldKTtcbiAgICAgIHZhciB5ID0gYS5tb2RQb3cociwgdGhpcyk7XG4gICAgICBpZiAoeS5jb21wYXJlVG8oQmlnSW50ZWdlci5PTkUpICE9IDAgJiYgeS5jb21wYXJlVG8objEpICE9IDApXG4gICAgICB7XG4gICAgICAgIHZhciBqID0gMTtcbiAgICAgICAgd2hpbGUgKGorKyA8IGsgJiYgeS5jb21wYXJlVG8objEpICE9IDApXG4gICAgICAgIHtcbiAgICAgICAgICB5ID0geS5tb2RQb3dJbnQoMiwgdGhpcyk7XG4gICAgICAgICAgaWYgKHkuY29tcGFyZVRvKEJpZ0ludGVnZXIuT05FKSA9PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHkuY29tcGFyZVRvKG4xKSAhPSAwKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIC8vIHByb3RlY3RlZFxuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5jaHVua1NpemUgPSBibnBDaHVua1NpemU7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLnRvUmFkaXggPSBibnBUb1JhZGl4O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5mcm9tUmFkaXggPSBibnBGcm9tUmFkaXg7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmZyb21OdW1iZXIgPSBibnBGcm9tTnVtYmVyO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5iaXR3aXNlVG8gPSBibnBCaXR3aXNlVG87XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmNoYW5nZUJpdCA9IGJucENoYW5nZUJpdDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuYWRkVG8gPSBibnBBZGRUbztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuZE11bHRpcGx5ID0gYm5wRE11bHRpcGx5O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5kQWRkT2Zmc2V0ID0gYm5wREFkZE9mZnNldDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUubXVsdGlwbHlMb3dlclRvID0gYm5wTXVsdGlwbHlMb3dlclRvO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5tdWx0aXBseVVwcGVyVG8gPSBibnBNdWx0aXBseVVwcGVyVG87XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLm1vZEludCA9IGJucE1vZEludDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUubWlsbGVyUmFiaW4gPSBibnBNaWxsZXJSYWJpbjtcbiAgLy8gcHVibGljXG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmNsb25lID0gYm5DbG9uZTtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuaW50VmFsdWUgPSBibkludFZhbHVlO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5ieXRlVmFsdWUgPSBibkJ5dGVWYWx1ZTtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuc2hvcnRWYWx1ZSA9IGJuU2hvcnRWYWx1ZTtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuc2lnbnVtID0gYm5TaWdOdW07XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLnRvQnl0ZUFycmF5ID0gYm5Ub0J5dGVBcnJheTtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuZXF1YWxzID0gYm5FcXVhbHM7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLm1pbiA9IGJuTWluO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5tYXggPSBibk1heDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuYW5kID0gYm5BbmQ7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLm9yID0gYm5PcjtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUueG9yID0gYm5Yb3I7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmFuZE5vdCA9IGJuQW5kTm90O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5ub3QgPSBibk5vdDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuc2hpZnRMZWZ0ID0gYm5TaGlmdExlZnQ7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLnNoaWZ0UmlnaHQgPSBiblNoaWZ0UmlnaHQ7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmdldExvd2VzdFNldEJpdCA9IGJuR2V0TG93ZXN0U2V0Qml0O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5iaXRDb3VudCA9IGJuQml0Q291bnQ7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLnRlc3RCaXQgPSBiblRlc3RCaXQ7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLnNldEJpdCA9IGJuU2V0Qml0O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5jbGVhckJpdCA9IGJuQ2xlYXJCaXQ7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmZsaXBCaXQgPSBibkZsaXBCaXQ7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmFkZCA9IGJuQWRkO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5zdWJ0cmFjdCA9IGJuU3VidHJhY3Q7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLm11bHRpcGx5ID0gYm5NdWx0aXBseTtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuZGl2aWRlID0gYm5EaXZpZGU7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLnJlbWFpbmRlciA9IGJuUmVtYWluZGVyO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5kaXZpZGVBbmRSZW1haW5kZXIgPSBibkRpdmlkZUFuZFJlbWFpbmRlcjtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUubW9kUG93ID0gYm5Nb2RQb3c7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLm1vZEludmVyc2UgPSBibk1vZEludmVyc2U7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLnBvdyA9IGJuUG93O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5nY2QgPSBibkdDRDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuaXNQcm9iYWJsZVByaW1lID0gYm5Jc1Byb2JhYmxlUHJpbWU7XG4gIC8vIEpTQk4tc3BlY2lmaWMgZXh0ZW5zaW9uXG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLnNxdWFyZSA9IGJuU3F1YXJlO1xuICB2YXIgSW50MTI4ID0gQmlnSW50ZWdlcjtcbiAgLy8gQmlnSW50ZWdlciBpbnRlcmZhY2VzIG5vdCBpbXBsZW1lbnRlZCBpbiBqc2JuOlxuICAvLyBCaWdJbnRlZ2VyKGludCBzaWdudW0sIGJ5dGVbXSBtYWduaXR1ZGUpXG4gIC8vIGRvdWJsZSBkb3VibGVWYWx1ZSgpXG4gIC8vIGZsb2F0IGZsb2F0VmFsdWUoKVxuICAvLyBpbnQgaGFzaENvZGUoKVxuICAvLyBsb25nIGxvbmdWYWx1ZSgpXG4gIC8vIHN0YXRpYyBCaWdJbnRlZ2VyIHZhbHVlT2YobG9uZyB2YWwpXG4gIC8vIEhlbHBlciBmdW5jdGlvbnMgdG8gbWFrZSBCaWdJbnRlZ2VyIGZ1bmN0aW9ucyBjYWxsYWJsZSB3aXRoIHR3byBwYXJhbWV0ZXJzXG4gIC8vIGFzIGluIG9yaWdpbmFsIEMjIENsaXBwZXJcbiAgSW50MTI4LnByb3RvdHlwZS5Jc05lZ2F0aXZlID0gZnVuY3Rpb24gKClcbiAge1xuICAgIGlmICh0aGlzLmNvbXBhcmVUbyhJbnQxMjguWkVSTykgPT0gLTEpIHJldHVybiB0cnVlO1xuICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xuICB9O1xuICBJbnQxMjgub3BfRXF1YWxpdHkgPSBmdW5jdGlvbiAodmFsMSwgdmFsMilcbiAge1xuICAgIGlmICh2YWwxLmNvbXBhcmVUbyh2YWwyKSA9PSAwKSByZXR1cm4gdHJ1ZTtcbiAgICBlbHNlIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgSW50MTI4Lm9wX0luZXF1YWxpdHkgPSBmdW5jdGlvbiAodmFsMSwgdmFsMilcbiAge1xuICAgIGlmICh2YWwxLmNvbXBhcmVUbyh2YWwyKSAhPSAwKSByZXR1cm4gdHJ1ZTtcbiAgICBlbHNlIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgSW50MTI4Lm9wX0dyZWF0ZXJUaGFuID0gZnVuY3Rpb24gKHZhbDEsIHZhbDIpXG4gIHtcbiAgICBpZiAodmFsMS5jb21wYXJlVG8odmFsMikgPiAwKSByZXR1cm4gdHJ1ZTtcbiAgICBlbHNlIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgSW50MTI4Lm9wX0xlc3NUaGFuID0gZnVuY3Rpb24gKHZhbDEsIHZhbDIpXG4gIHtcbiAgICBpZiAodmFsMS5jb21wYXJlVG8odmFsMikgPCAwKSByZXR1cm4gdHJ1ZTtcbiAgICBlbHNlIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgSW50MTI4Lm9wX0FkZGl0aW9uID0gZnVuY3Rpb24gKGxocywgcmhzKVxuICB7XG4gICAgcmV0dXJuIG5ldyBJbnQxMjgobGhzKS5hZGQobmV3IEludDEyOChyaHMpKTtcbiAgfTtcbiAgSW50MTI4Lm9wX1N1YnRyYWN0aW9uID0gZnVuY3Rpb24gKGxocywgcmhzKVxuICB7XG4gICAgcmV0dXJuIG5ldyBJbnQxMjgobGhzKS5zdWJ0cmFjdChuZXcgSW50MTI4KHJocykpO1xuICB9O1xuICBJbnQxMjguSW50MTI4TXVsID0gZnVuY3Rpb24gKGxocywgcmhzKVxuICB7XG4gICAgcmV0dXJuIG5ldyBJbnQxMjgobGhzKS5tdWx0aXBseShuZXcgSW50MTI4KHJocykpO1xuICB9O1xuICBJbnQxMjgub3BfRGl2aXNpb24gPSBmdW5jdGlvbiAobGhzLCByaHMpXG4gIHtcbiAgICByZXR1cm4gbGhzLmRpdmlkZShyaHMpO1xuICB9O1xuICBJbnQxMjgucHJvdG90eXBlLlRvRG91YmxlID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHJldHVybiBwYXJzZUZsb2F0KHRoaXMudG9TdHJpbmcoKSk7IC8vIFRoaXMgY291bGQgYmUgc29tZXRoaW5nIGZhc3RlclxuICB9O1xuICAvLyBlbmQgb2YgSW50MTI4IHNlY3Rpb25cbiAgLypcbiAgLy8gVW5jb21tZW50IHRoZSBmb2xsb3dpbmcgdHdvIGxpbmVzIGlmIHlvdSB3YW50IHRvIHVzZSBJbnQxMjggb3V0c2lkZSBDbGlwcGVyTGliXG4gIGlmICh0eXBlb2YoZG9jdW1lbnQpICE9PSBcInVuZGVmaW5lZFwiKSB3aW5kb3cuSW50MTI4ID0gSW50MTI4O1xuICBlbHNlIHNlbGYuSW50MTI4ID0gSW50MTI4O1xuICAqL1xuXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIEhlcmUgc3RhcnRzIHRoZSBhY3R1YWwgQ2xpcHBlciBsaWJyYXJ5OlxuICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gc3VwcG9ydCBJbmhlcml0YW5jZSBpbiBKYXZhc2NyaXB0XG5cdHZhciBJbmhlcml0ID0gZnVuY3Rpb24gKGNlLCBjZTIpXG5cdHtcblx0XHR2YXIgcDtcblx0XHRpZiAodHlwZW9mIChPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcykgPT0gJ3VuZGVmaW5lZCcpXG5cdFx0e1xuXHRcdFx0Zm9yIChwIGluIGNlMi5wcm90b3R5cGUpXG5cdFx0XHRcdGlmICh0eXBlb2YgKGNlLnByb3RvdHlwZVtwXSkgPT0gJ3VuZGVmaW5lZCcgfHwgY2UucHJvdG90eXBlW3BdID09IE9iamVjdC5wcm90b3R5cGVbcF0pIGNlLnByb3RvdHlwZVtwXSA9IGNlMi5wcm90b3R5cGVbcF07XG5cdFx0XHRmb3IgKHAgaW4gY2UyKVxuXHRcdFx0XHRpZiAodHlwZW9mIChjZVtwXSkgPT0gJ3VuZGVmaW5lZCcpIGNlW3BdID0gY2UyW3BdO1xuXHRcdFx0Y2UuJGJhc2VDdG9yID0gY2UyO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0dmFyIHByb3BzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoY2UyLnByb3RvdHlwZSk7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHRpZiAodHlwZW9mIChPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGNlLnByb3RvdHlwZSwgcHJvcHNbaV0pKSA9PSAndW5kZWZpbmVkJykgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNlLnByb3RvdHlwZSwgcHJvcHNbaV0sIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoY2UyLnByb3RvdHlwZSwgcHJvcHNbaV0pKTtcblx0XHRcdGZvciAocCBpbiBjZTIpXG5cdFx0XHRcdGlmICh0eXBlb2YgKGNlW3BdKSA9PSAndW5kZWZpbmVkJykgY2VbcF0gPSBjZTJbcF07XG5cdFx0XHRjZS4kYmFzZUN0b3IgPSBjZTI7XG5cdFx0fVxuXHR9O1xuICBDbGlwcGVyTGliLlBhdGggPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgcmV0dXJuIFtdO1xuICB9O1xuICBDbGlwcGVyTGliLlBhdGhzID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHJldHVybiBbXTsgLy8gV2FzIHByZXZpb3VzbHkgW1tdXSwgYnV0IGNhdXNlZCBwcm9ibGVtcyB3aGVuIHB1c2hlZFxuICB9O1xuICAvLyBQcmVzZXJ2ZXMgdGhlIGNhbGxpbmcgd2F5IG9mIG9yaWdpbmFsIEMjIENsaXBwZXJcbiAgLy8gSXMgZXNzZW50aWFsIGR1ZSB0byBjb21wYXRpYmlsaXR5LCBiZWNhdXNlIERvdWJsZVBvaW50IGlzIHB1YmxpYyBjbGFzcyBpbiBvcmlnaW5hbCBDIyB2ZXJzaW9uXG4gIENsaXBwZXJMaWIuRG91YmxlUG9pbnQgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdmFyIGEgPSBhcmd1bWVudHM7XG4gICAgdGhpcy5YID0gMDtcbiAgICB0aGlzLlkgPSAwO1xuICAgIC8vIHB1YmxpYyBEb3VibGVQb2ludChEb3VibGVQb2ludCBkcClcbiAgICAvLyBwdWJsaWMgRG91YmxlUG9pbnQoSW50UG9pbnQgaXApXG4gICAgaWYgKGEubGVuZ3RoID09IDEpXG4gICAge1xuICAgICAgdGhpcy5YID0gYVswXS5YO1xuICAgICAgdGhpcy5ZID0gYVswXS5ZO1xuICAgIH1cbiAgICBlbHNlIGlmIChhLmxlbmd0aCA9PSAyKVxuICAgIHtcbiAgICAgIHRoaXMuWCA9IGFbMF07XG4gICAgICB0aGlzLlkgPSBhWzFdO1xuICAgIH1cbiAgfTsgLy8gVGhpcyBpcyBpbnRlcm5hbCBmYXN0ZXIgZnVuY3Rpb24gd2hlbiBjYWxsZWQgd2l0aG91dCBhcmd1bWVudHNcbiAgQ2xpcHBlckxpYi5Eb3VibGVQb2ludDAgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdGhpcy5YID0gMDtcbiAgICB0aGlzLlkgPSAwO1xuICB9O1xuICAvLyBUaGlzIGlzIGludGVybmFsIGZhc3RlciBmdW5jdGlvbiB3aGVuIGNhbGxlZCB3aXRoIDEgYXJndW1lbnQgKGRwIG9yIGlwKVxuICBDbGlwcGVyTGliLkRvdWJsZVBvaW50MSA9IGZ1bmN0aW9uIChkcClcbiAge1xuICAgIHRoaXMuWCA9IGRwLlg7XG4gICAgdGhpcy5ZID0gZHAuWTtcbiAgfTtcbiAgLy8gVGhpcyBpcyBpbnRlcm5hbCBmYXN0ZXIgZnVuY3Rpb24gd2hlbiBjYWxsZWQgd2l0aCAyIGFyZ3VtZW50cyAoeCBhbmQgeSlcbiAgQ2xpcHBlckxpYi5Eb3VibGVQb2ludDIgPSBmdW5jdGlvbiAoeCwgeSlcbiAge1xuICAgIHRoaXMuWCA9IHg7XG4gICAgdGhpcy5ZID0geTtcbiAgfTtcbiAgLy8gUG9seVRyZWUgJiBQb2x5Tm9kZSBzdGFydFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIENsaXBwZXJMaWIuUG9seU5vZGUgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdGhpcy5tX1BhcmVudCA9IG51bGw7XG4gICAgdGhpcy5tX3BvbHlnb24gPSBuZXcgQ2xpcHBlckxpYi5QYXRoKCk7XG4gICAgdGhpcy5tX0luZGV4ID0gMDtcbiAgICB0aGlzLm1fam9pbnR5cGUgPSAwO1xuICAgIHRoaXMubV9lbmR0eXBlID0gMDtcbiAgICB0aGlzLm1fQ2hpbGRzID0gW107XG4gICAgdGhpcy5Jc09wZW4gPSBmYWxzZTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5Qb2x5Tm9kZS5wcm90b3R5cGUuSXNIb2xlTm9kZSA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcbiAgICB2YXIgbm9kZSA9IHRoaXMubV9QYXJlbnQ7XG4gICAgd2hpbGUgKG5vZGUgIT09IG51bGwpXG4gICAge1xuICAgICAgcmVzdWx0ID0gIXJlc3VsdDtcbiAgICAgIG5vZGUgPSBub2RlLm1fUGFyZW50O1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBDbGlwcGVyTGliLlBvbHlOb2RlLnByb3RvdHlwZS5DaGlsZENvdW50ID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHJldHVybiB0aGlzLm1fQ2hpbGRzLmxlbmd0aDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5Qb2x5Tm9kZS5wcm90b3R5cGUuQ29udG91ciA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICByZXR1cm4gdGhpcy5tX3BvbHlnb247XG4gIH07XG4gIENsaXBwZXJMaWIuUG9seU5vZGUucHJvdG90eXBlLkFkZENoaWxkID0gZnVuY3Rpb24gKENoaWxkKVxuICB7XG4gICAgdmFyIGNudCA9IHRoaXMubV9DaGlsZHMubGVuZ3RoO1xuICAgIHRoaXMubV9DaGlsZHMucHVzaChDaGlsZCk7XG4gICAgQ2hpbGQubV9QYXJlbnQgPSB0aGlzO1xuICAgIENoaWxkLm1fSW5kZXggPSBjbnQ7XG4gIH07XG4gIENsaXBwZXJMaWIuUG9seU5vZGUucHJvdG90eXBlLkdldE5leHQgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgaWYgKHRoaXMubV9DaGlsZHMubGVuZ3RoID4gMClcbiAgICAgIHJldHVybiB0aGlzLm1fQ2hpbGRzWzBdO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiB0aGlzLkdldE5leHRTaWJsaW5nVXAoKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5Qb2x5Tm9kZS5wcm90b3R5cGUuR2V0TmV4dFNpYmxpbmdVcCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICBpZiAodGhpcy5tX1BhcmVudCA9PT0gbnVsbClcbiAgICAgIHJldHVybiBudWxsO1xuICAgIGVsc2UgaWYgKHRoaXMubV9JbmRleCA9PSB0aGlzLm1fUGFyZW50Lm1fQ2hpbGRzLmxlbmd0aCAtIDEpXG4gICAgICByZXR1cm4gdGhpcy5tX1BhcmVudC5HZXROZXh0U2libGluZ1VwKCk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIHRoaXMubV9QYXJlbnQubV9DaGlsZHNbdGhpcy5tX0luZGV4ICsgMV07XG4gIH07XG4gIENsaXBwZXJMaWIuUG9seU5vZGUucHJvdG90eXBlLkNoaWxkcyA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICByZXR1cm4gdGhpcy5tX0NoaWxkcztcbiAgfTtcbiAgQ2xpcHBlckxpYi5Qb2x5Tm9kZS5wcm90b3R5cGUuUGFyZW50ID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHJldHVybiB0aGlzLm1fUGFyZW50O1xuICB9O1xuICBDbGlwcGVyTGliLlBvbHlOb2RlLnByb3RvdHlwZS5Jc0hvbGUgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXMuSXNIb2xlTm9kZSgpO1xuICB9O1xuICAvLyBQb2x5VHJlZSA6IFBvbHlOb2RlXG4gIENsaXBwZXJMaWIuUG9seVRyZWUgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdGhpcy5tX0FsbFBvbHlzID0gW107XG4gICAgQ2xpcHBlckxpYi5Qb2x5Tm9kZS5jYWxsKHRoaXMpO1xuICB9O1xuICBDbGlwcGVyTGliLlBvbHlUcmVlLnByb3RvdHlwZS5DbGVhciA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICBmb3IgKHZhciBpID0gMCwgaWxlbiA9IHRoaXMubV9BbGxQb2x5cy5sZW5ndGg7IGkgPCBpbGVuOyBpKyspXG4gICAgICB0aGlzLm1fQWxsUG9seXNbaV0gPSBudWxsO1xuICAgIHRoaXMubV9BbGxQb2x5cy5sZW5ndGggPSAwO1xuICAgIHRoaXMubV9DaGlsZHMubGVuZ3RoID0gMDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5Qb2x5VHJlZS5wcm90b3R5cGUuR2V0Rmlyc3QgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgaWYgKHRoaXMubV9DaGlsZHMubGVuZ3RoID4gMClcbiAgICAgIHJldHVybiB0aGlzLm1fQ2hpbGRzWzBdO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBudWxsO1xuICB9O1xuICBDbGlwcGVyTGliLlBvbHlUcmVlLnByb3RvdHlwZS5Ub3RhbCA9IGZ1bmN0aW9uICgpXG4gIHtcblx0XHR2YXIgcmVzdWx0ID0gdGhpcy5tX0FsbFBvbHlzLmxlbmd0aDtcblx0XHQvL3dpdGggbmVnYXRpdmUgb2Zmc2V0cywgaWdub3JlIHRoZSBoaWRkZW4gb3V0ZXIgcG9seWdvbiAuLi5cblx0XHRpZiAocmVzdWx0ID4gMCAmJiB0aGlzLm1fQ2hpbGRzWzBdICE9IHRoaXMubV9BbGxQb2x5c1swXSkgcmVzdWx0LS07XG5cdFx0cmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgSW5oZXJpdChDbGlwcGVyTGliLlBvbHlUcmVlLCBDbGlwcGVyTGliLlBvbHlOb2RlKTtcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBQb2x5VHJlZSAmIFBvbHlOb2RlIGVuZFxuICBDbGlwcGVyTGliLk1hdGhfQWJzX0ludDY0ID0gQ2xpcHBlckxpYi5NYXRoX0Fic19JbnQzMiA9IENsaXBwZXJMaWIuTWF0aF9BYnNfRG91YmxlID0gZnVuY3Rpb24gKGEpXG4gIHtcbiAgICByZXR1cm4gTWF0aC5hYnMoYSk7XG4gIH07XG4gIENsaXBwZXJMaWIuTWF0aF9NYXhfSW50MzJfSW50MzIgPSBmdW5jdGlvbiAoYSwgYilcbiAge1xuICAgIHJldHVybiBNYXRoLm1heChhLCBiKTtcbiAgfTtcbiAgLypcbiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY2FzdF8zMiBzcGVlZHRlc3Q6IGh0dHA6Ly9qc3BlcmYuY29tL3RydW5jYXRlLWZsb2F0LXRvLWludGVnZXIvMlxuICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAqL1xuICBpZiAoYnJvd3Nlci5tc2llIHx8IGJyb3dzZXIub3BlcmEgfHwgYnJvd3Nlci5zYWZhcmkpIENsaXBwZXJMaWIuQ2FzdF9JbnQzMiA9IGZ1bmN0aW9uIChhKVxuICB7XG4gICAgcmV0dXJuIGEgfCAwO1xuICB9O1xuICBlbHNlIENsaXBwZXJMaWIuQ2FzdF9JbnQzMiA9IGZ1bmN0aW9uIChhKVxuICB7IC8vIGVnLiBicm93c2VyLmNocm9tZSB8fCBicm93c2VyLmNocm9taXVtIHx8IGJyb3dzZXIuZmlyZWZveFxuICAgIHJldHVybn5+IGE7XG4gIH07XG4gIC8qXG4gIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNhc3RfNjQgc3BlZWR0ZXN0czogaHR0cDovL2pzcGVyZi5jb20vdHJ1bmNhdGUtZmxvYXQtdG8taW50ZWdlclxuICBDaHJvbWU6IGJpdHdpc2Vfbm90X2Zsb29yXG4gIEZpcmVmb3gxNzogdG9JbnRlZ2VyICh0eXBlb2YgdGVzdClcbiAgSUU5OiBiaXR3aXNlX29yX2Zsb29yXG4gIElFNyBhbmQgSUU4OiB0b19wYXJzZWludFxuICBDaHJvbWl1bTogdG9fZmxvb3Jfb3JfY2VpbFxuICBGaXJlZm94MzogdG9fZmxvb3Jfb3JfY2VpbFxuICBGaXJlZm94MTU6IHRvX2Zsb29yX29yX2NlaWxcbiAgT3BlcmE6IHRvX2Zsb29yX29yX2NlaWxcbiAgU2FmYXJpOiB0b19mbG9vcl9vcl9jZWlsXG4gIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICovXG4gIGlmIChicm93c2VyLmNocm9tZSkgQ2xpcHBlckxpYi5DYXN0X0ludDY0ID0gZnVuY3Rpb24gKGEpXG4gIHtcbiAgICBpZiAoYSA8IC0yMTQ3NDgzNjQ4IHx8IGEgPiAyMTQ3NDgzNjQ3KVxuICAgICAgcmV0dXJuIGEgPCAwID8gTWF0aC5jZWlsKGEpIDogTWF0aC5mbG9vcihhKTtcbiAgICBlbHNlIHJldHVybn5+IGE7XG4gIH07XG4gIGVsc2UgaWYgKGJyb3dzZXIuZmlyZWZveCAmJiB0eXBlb2YgKE51bWJlci50b0ludGVnZXIpID09IFwiZnVuY3Rpb25cIikgQ2xpcHBlckxpYi5DYXN0X0ludDY0ID0gZnVuY3Rpb24gKGEpXG4gIHtcbiAgICByZXR1cm4gTnVtYmVyLnRvSW50ZWdlcihhKTtcbiAgfTtcbiAgZWxzZSBpZiAoYnJvd3Nlci5tc2llNyB8fCBicm93c2VyLm1zaWU4KSBDbGlwcGVyTGliLkNhc3RfSW50NjQgPSBmdW5jdGlvbiAoYSlcbiAge1xuICAgIHJldHVybiBwYXJzZUludChhLCAxMCk7XG4gIH07XG4gIGVsc2UgaWYgKGJyb3dzZXIubXNpZSkgQ2xpcHBlckxpYi5DYXN0X0ludDY0ID0gZnVuY3Rpb24gKGEpXG4gIHtcbiAgICBpZiAoYSA8IC0yMTQ3NDgzNjQ4IHx8IGEgPiAyMTQ3NDgzNjQ3KVxuICAgICAgcmV0dXJuIGEgPCAwID8gTWF0aC5jZWlsKGEpIDogTWF0aC5mbG9vcihhKTtcbiAgICByZXR1cm4gYSB8IDA7XG4gIH07XG4gIC8vIGVnLiBicm93c2VyLmNocm9taXVtIHx8IGJyb3dzZXIuZmlyZWZveCB8fCBicm93c2VyLm9wZXJhIHx8IGJyb3dzZXIuc2FmYXJpXG4gIGVsc2UgQ2xpcHBlckxpYi5DYXN0X0ludDY0ID0gZnVuY3Rpb24gKGEpXG4gIHtcbiAgICByZXR1cm4gYSA8IDAgPyBNYXRoLmNlaWwoYSkgOiBNYXRoLmZsb29yKGEpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsZWFyID0gZnVuY3Rpb24gKGEpXG4gIHtcbiAgICBhLmxlbmd0aCA9IDA7XG4gIH07XG4gIC8vQ2xpcHBlckxpYi5NYXhTdGVwcyA9IDY0OyAvLyBIb3cgbWFueSBzdGVwcyBhdCBtYXhpbXVtIGluIGFyYyBpbiBCdWlsZEFyYygpIGZ1bmN0aW9uXG4gIENsaXBwZXJMaWIuUEkgPSAzLjE0MTU5MjY1MzU4OTc5MztcbiAgQ2xpcHBlckxpYi5QSTIgPSAyICogMy4xNDE1OTI2NTM1ODk3OTM7XG4gIENsaXBwZXJMaWIuSW50UG9pbnQgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdmFyIGEgPSBhcmd1bWVudHMsXG4gICAgICBhbGVuID0gYS5sZW5ndGg7XG4gICAgdGhpcy5YID0gMDtcbiAgICB0aGlzLlkgPSAwO1xuICAgIGlmICh1c2VfeHl6KVxuICAgIHtcbiAgICAgIHRoaXMuWiA9IDA7XG4gICAgICBpZiAoYWxlbiA9PSAzKSAvLyBwdWJsaWMgSW50UG9pbnQoY0ludCB4LCBjSW50IHksIGNJbnQgeiA9IDApXG4gICAgICB7XG4gICAgICAgIHRoaXMuWCA9IGFbMF07XG4gICAgICAgIHRoaXMuWSA9IGFbMV07XG4gICAgICAgIHRoaXMuWiA9IGFbMl07XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChhbGVuID09IDIpIC8vIHB1YmxpYyBJbnRQb2ludChjSW50IHgsIGNJbnQgeSlcbiAgICAgIHtcbiAgICAgICAgdGhpcy5YID0gYVswXTtcbiAgICAgICAgdGhpcy5ZID0gYVsxXTtcbiAgICAgICAgdGhpcy5aID0gMDtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGFsZW4gPT0gMSlcbiAgICAgIHtcbiAgICAgICAgaWYgKGFbMF0gaW5zdGFuY2VvZiBDbGlwcGVyTGliLkRvdWJsZVBvaW50KSAvLyBwdWJsaWMgSW50UG9pbnQoRG91YmxlUG9pbnQgZHApXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgZHAgPSBhWzBdO1xuICAgICAgICAgIHRoaXMuWCA9IENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZChkcC5YKTtcbiAgICAgICAgICB0aGlzLlkgPSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQoZHAuWSk7XG4gICAgICAgICAgdGhpcy5aID0gMDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIC8vIHB1YmxpYyBJbnRQb2ludChJbnRQb2ludCBwdClcbiAgICAgICAge1xuICAgICAgICAgIHZhciBwdCA9IGFbMF07XG4gICAgICAgICAgaWYgKHR5cGVvZiAocHQuWikgPT0gXCJ1bmRlZmluZWRcIikgcHQuWiA9IDA7XG4gICAgICAgICAgdGhpcy5YID0gcHQuWDtcbiAgICAgICAgICB0aGlzLlkgPSBwdC5ZO1xuICAgICAgICAgIHRoaXMuWiA9IHB0Llo7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgLy8gcHVibGljIEludFBvaW50KClcbiAgICAgIHtcbiAgICAgICAgdGhpcy5YID0gMDtcbiAgICAgICAgdGhpcy5ZID0gMDtcbiAgICAgICAgdGhpcy5aID0gMDtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSAvLyBpZiAoIXVzZV94eXopXG4gICAge1xuICAgICAgaWYgKGFsZW4gPT0gMikgLy8gcHVibGljIEludFBvaW50KGNJbnQgWCwgY0ludCBZKVxuICAgICAge1xuICAgICAgICB0aGlzLlggPSBhWzBdO1xuICAgICAgICB0aGlzLlkgPSBhWzFdO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoYWxlbiA9PSAxKVxuICAgICAge1xuICAgICAgICBpZiAoYVswXSBpbnN0YW5jZW9mIENsaXBwZXJMaWIuRG91YmxlUG9pbnQpIC8vIHB1YmxpYyBJbnRQb2ludChEb3VibGVQb2ludCBkcClcbiAgICAgICAge1xuICAgICAgICAgIHZhciBkcCA9IGFbMF07XG4gICAgICAgICAgdGhpcy5YID0gQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kKGRwLlgpO1xuICAgICAgICAgIHRoaXMuWSA9IENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZChkcC5ZKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIC8vIHB1YmxpYyBJbnRQb2ludChJbnRQb2ludCBwdClcbiAgICAgICAge1xuICAgICAgICAgIHZhciBwdCA9IGFbMF07XG4gICAgICAgICAgdGhpcy5YID0gcHQuWDtcbiAgICAgICAgICB0aGlzLlkgPSBwdC5ZO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIC8vIHB1YmxpYyBJbnRQb2ludChJbnRQb2ludCBwdClcbiAgICAgIHtcbiAgICAgICAgdGhpcy5YID0gMDtcbiAgICAgICAgdGhpcy5ZID0gMDtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkgPSBmdW5jdGlvbiAoYSwgYilcbiAge1xuICAgIC8vcmV0dXJuIGEgPT0gYjtcbiAgICByZXR1cm4gYS5YID09IGIuWCAmJiBhLlkgPT0gYi5ZO1xuICB9O1xuICBDbGlwcGVyTGliLkludFBvaW50Lm9wX0luZXF1YWxpdHkgPSBmdW5jdGlvbiAoYSwgYilcbiAge1xuICAgIC8vcmV0dXJuIGEgIT0gYjtcbiAgICByZXR1cm4gYS5YICE9IGIuWCB8fCBhLlkgIT0gYi5ZO1xuICB9O1xuICAvKlxuICBDbGlwcGVyTGliLkludFBvaW50LnByb3RvdHlwZS5FcXVhbHMgPSBmdW5jdGlvbiAob2JqKVxuICB7XG4gICAgaWYgKG9iaiA9PT0gbnVsbClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChvYmogaW5zdGFuY2VvZiBDbGlwcGVyTGliLkludFBvaW50KVxuICAgIHtcbiAgICAgICAgdmFyIGEgPSBDYXN0KG9iaiwgQ2xpcHBlckxpYi5JbnRQb2ludCk7XG4gICAgICAgIHJldHVybiAodGhpcy5YID09IGEuWCkgJiYgKHRoaXMuWSA9PSBhLlkpO1xuICAgIH1cbiAgICBlbHNlXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbiovXG4gIGlmICh1c2VfeHl6KVxuICB7XG4gICAgQ2xpcHBlckxpYi5JbnRQb2ludDAgPSBmdW5jdGlvbiAoKVxuICAgIHtcbiAgICAgIHRoaXMuWCA9IDA7XG4gICAgICB0aGlzLlkgPSAwO1xuICAgICAgdGhpcy5aID0gMDtcbiAgICB9O1xuICAgIENsaXBwZXJMaWIuSW50UG9pbnQxID0gZnVuY3Rpb24gKHB0KVxuICAgIHtcbiAgICAgIHRoaXMuWCA9IHB0Llg7XG4gICAgICB0aGlzLlkgPSBwdC5ZO1xuICAgICAgdGhpcy5aID0gcHQuWjtcbiAgICB9O1xuICAgIENsaXBwZXJMaWIuSW50UG9pbnQxZHAgPSBmdW5jdGlvbiAoZHApXG4gICAge1xuICAgICAgdGhpcy5YID0gQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kKGRwLlgpO1xuICAgICAgdGhpcy5ZID0gQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kKGRwLlkpO1xuICAgICAgdGhpcy5aID0gMDtcbiAgICB9O1xuICAgIENsaXBwZXJMaWIuSW50UG9pbnQyID0gZnVuY3Rpb24gKHgsIHkpXG4gICAge1xuICAgICAgdGhpcy5YID0geDtcbiAgICAgIHRoaXMuWSA9IHk7XG4gICAgICB0aGlzLlogPSAwO1xuICAgIH07XG4gICAgQ2xpcHBlckxpYi5JbnRQb2ludDMgPSBmdW5jdGlvbiAoeCwgeSwgeilcbiAgICB7XG4gICAgICB0aGlzLlggPSB4O1xuICAgICAgdGhpcy5ZID0geTtcbiAgICAgIHRoaXMuWiA9IHo7XG4gICAgfTtcbiAgfVxuICBlbHNlIC8vIGlmICghdXNlX3h5eilcbiAge1xuICAgIENsaXBwZXJMaWIuSW50UG9pbnQwID0gZnVuY3Rpb24gKClcbiAgICB7XG4gICAgICB0aGlzLlggPSAwO1xuICAgICAgdGhpcy5ZID0gMDtcbiAgICB9O1xuICAgIENsaXBwZXJMaWIuSW50UG9pbnQxID0gZnVuY3Rpb24gKHB0KVxuICAgIHtcbiAgICAgIHRoaXMuWCA9IHB0Llg7XG4gICAgICB0aGlzLlkgPSBwdC5ZO1xuICAgIH07XG4gICAgQ2xpcHBlckxpYi5JbnRQb2ludDFkcCA9IGZ1bmN0aW9uIChkcClcbiAgICB7XG4gICAgICB0aGlzLlggPSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQoZHAuWCk7XG4gICAgICB0aGlzLlkgPSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQoZHAuWSk7XG4gICAgfTtcbiAgICBDbGlwcGVyTGliLkludFBvaW50MiA9IGZ1bmN0aW9uICh4LCB5KVxuICAgIHtcbiAgICAgIHRoaXMuWCA9IHg7XG4gICAgICB0aGlzLlkgPSB5O1xuICAgIH07XG4gIH1cbiAgQ2xpcHBlckxpYi5JbnRSZWN0ID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHZhciBhID0gYXJndW1lbnRzLFxuICAgICAgYWxlbiA9IGEubGVuZ3RoO1xuICAgIGlmIChhbGVuID09IDQpIC8vIGZ1bmN0aW9uIChsLCB0LCByLCBiKVxuICAgIHtcbiAgICAgIHRoaXMubGVmdCA9IGFbMF07XG4gICAgICB0aGlzLnRvcCA9IGFbMV07XG4gICAgICB0aGlzLnJpZ2h0ID0gYVsyXTtcbiAgICAgIHRoaXMuYm90dG9tID0gYVszXTtcbiAgICB9XG4gICAgZWxzZSBpZiAoYWxlbiA9PSAxKSAvLyBmdW5jdGlvbiAoaXIpXG4gICAge1xuICAgICAgdGhpcy5sZWZ0ID0gaXIubGVmdDtcbiAgICAgIHRoaXMudG9wID0gaXIudG9wO1xuICAgICAgdGhpcy5yaWdodCA9IGlyLnJpZ2h0O1xuICAgICAgdGhpcy5ib3R0b20gPSBpci5ib3R0b207XG4gICAgfVxuICAgIGVsc2UgLy8gZnVuY3Rpb24gKClcbiAgICB7XG4gICAgICB0aGlzLmxlZnQgPSAwO1xuICAgICAgdGhpcy50b3AgPSAwO1xuICAgICAgdGhpcy5yaWdodCA9IDA7XG4gICAgICB0aGlzLmJvdHRvbSA9IDA7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkludFJlY3QwID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHRoaXMubGVmdCA9IDA7XG4gICAgdGhpcy50b3AgPSAwO1xuICAgIHRoaXMucmlnaHQgPSAwO1xuICAgIHRoaXMuYm90dG9tID0gMDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5JbnRSZWN0MSA9IGZ1bmN0aW9uIChpcilcbiAge1xuICAgIHRoaXMubGVmdCA9IGlyLmxlZnQ7XG4gICAgdGhpcy50b3AgPSBpci50b3A7XG4gICAgdGhpcy5yaWdodCA9IGlyLnJpZ2h0O1xuICAgIHRoaXMuYm90dG9tID0gaXIuYm90dG9tO1xuICB9O1xuICBDbGlwcGVyTGliLkludFJlY3Q0ID0gZnVuY3Rpb24gKGwsIHQsIHIsIGIpXG4gIHtcbiAgICB0aGlzLmxlZnQgPSBsO1xuICAgIHRoaXMudG9wID0gdDtcbiAgICB0aGlzLnJpZ2h0ID0gcjtcbiAgICB0aGlzLmJvdHRvbSA9IGI7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcFR5cGUgPSB7XG4gICAgY3RJbnRlcnNlY3Rpb246IDAsXG4gICAgY3RVbmlvbjogMSxcbiAgICBjdERpZmZlcmVuY2U6IDIsXG4gICAgY3RYb3I6IDNcbiAgfTtcbiAgQ2xpcHBlckxpYi5Qb2x5VHlwZSA9IHtcbiAgICBwdFN1YmplY3Q6IDAsXG4gICAgcHRDbGlwOiAxXG4gIH07XG4gIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlID0ge1xuICAgIHBmdEV2ZW5PZGQ6IDAsXG4gICAgcGZ0Tm9uWmVybzogMSxcbiAgICBwZnRQb3NpdGl2ZTogMixcbiAgICBwZnROZWdhdGl2ZTogM1xuICB9O1xuICBDbGlwcGVyTGliLkpvaW5UeXBlID0ge1xuICAgIGp0U3F1YXJlOiAwLFxuICAgIGp0Um91bmQ6IDEsXG4gICAganRNaXRlcjogMlxuICB9O1xuICBDbGlwcGVyTGliLkVuZFR5cGUgPSB7XG4gICAgZXRPcGVuU3F1YXJlOiAwLFxuICAgIGV0T3BlblJvdW5kOiAxLFxuICAgIGV0T3BlbkJ1dHQ6IDIsXG4gICAgZXRDbG9zZWRMaW5lOiAzLFxuICAgIGV0Q2xvc2VkUG9seWdvbjogNFxuICB9O1xuICBDbGlwcGVyTGliLkVkZ2VTaWRlID0ge1xuICAgIGVzTGVmdDogMCxcbiAgICBlc1JpZ2h0OiAxXG4gIH07XG4gIENsaXBwZXJMaWIuRGlyZWN0aW9uID0ge1xuICAgIGRSaWdodFRvTGVmdDogMCxcbiAgICBkTGVmdFRvUmlnaHQ6IDFcbiAgfTtcbiAgQ2xpcHBlckxpYi5URWRnZSA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB0aGlzLkJvdCA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KCk7XG4gICAgdGhpcy5DdXJyID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQoKTtcbiAgICB0aGlzLlRvcCA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KCk7XG4gICAgdGhpcy5EZWx0YSA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KCk7XG4gICAgdGhpcy5EeCA9IDA7XG4gICAgdGhpcy5Qb2x5VHlwID0gQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdFN1YmplY3Q7XG4gICAgdGhpcy5TaWRlID0gQ2xpcHBlckxpYi5FZGdlU2lkZS5lc0xlZnQ7XG4gICAgdGhpcy5XaW5kRGVsdGEgPSAwO1xuICAgIHRoaXMuV2luZENudCA9IDA7XG4gICAgdGhpcy5XaW5kQ250MiA9IDA7XG4gICAgdGhpcy5PdXRJZHggPSAwO1xuICAgIHRoaXMuTmV4dCA9IG51bGw7XG4gICAgdGhpcy5QcmV2ID0gbnVsbDtcbiAgICB0aGlzLk5leHRJbkxNTCA9IG51bGw7XG4gICAgdGhpcy5OZXh0SW5BRUwgPSBudWxsO1xuICAgIHRoaXMuUHJldkluQUVMID0gbnVsbDtcbiAgICB0aGlzLk5leHRJblNFTCA9IG51bGw7XG4gICAgdGhpcy5QcmV2SW5TRUwgPSBudWxsO1xuICB9O1xuICBDbGlwcGVyTGliLkludGVyc2VjdE5vZGUgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdGhpcy5FZGdlMSA9IG51bGw7XG4gICAgdGhpcy5FZGdlMiA9IG51bGw7XG4gICAgdGhpcy5QdCA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KCk7XG4gIH07XG4gIENsaXBwZXJMaWIuTXlJbnRlcnNlY3ROb2RlU29ydCA9IGZ1bmN0aW9uICgpIHt9O1xuICBDbGlwcGVyTGliLk15SW50ZXJzZWN0Tm9kZVNvcnQuQ29tcGFyZSA9IGZ1bmN0aW9uIChub2RlMSwgbm9kZTIpXG4gIHtcbiAgICB2YXIgaSA9IG5vZGUyLlB0LlkgLSBub2RlMS5QdC5ZO1xuICAgIGlmIChpID4gMCkgcmV0dXJuIDE7XG4gICAgZWxzZSBpZiAoaSA8IDApIHJldHVybiAtMTtcbiAgICBlbHNlIHJldHVybiAwO1xuICB9O1xuXG4gIENsaXBwZXJMaWIuTG9jYWxNaW5pbWEgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdGhpcy5ZID0gMDtcbiAgICB0aGlzLkxlZnRCb3VuZCA9IG51bGw7XG4gICAgdGhpcy5SaWdodEJvdW5kID0gbnVsbDtcbiAgICB0aGlzLk5leHQgPSBudWxsO1xuICB9O1xuICBDbGlwcGVyTGliLlNjYW5iZWFtID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHRoaXMuWSA9IDA7XG4gICAgdGhpcy5OZXh0ID0gbnVsbDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5PdXRSZWMgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdGhpcy5JZHggPSAwO1xuICAgIHRoaXMuSXNIb2xlID0gZmFsc2U7XG4gICAgdGhpcy5Jc09wZW4gPSBmYWxzZTtcbiAgICB0aGlzLkZpcnN0TGVmdCA9IG51bGw7XG4gICAgdGhpcy5QdHMgPSBudWxsO1xuICAgIHRoaXMuQm90dG9tUHQgPSBudWxsO1xuICAgIHRoaXMuUG9seU5vZGUgPSBudWxsO1xuICB9O1xuICBDbGlwcGVyTGliLk91dFB0ID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHRoaXMuSWR4ID0gMDtcbiAgICB0aGlzLlB0ID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQoKTtcbiAgICB0aGlzLk5leHQgPSBudWxsO1xuICAgIHRoaXMuUHJldiA9IG51bGw7XG4gIH07XG4gIENsaXBwZXJMaWIuSm9pbiA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB0aGlzLk91dFB0MSA9IG51bGw7XG4gICAgdGhpcy5PdXRQdDIgPSBudWxsO1xuICAgIHRoaXMuT2ZmUHQgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludCgpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHRoaXMubV9NaW5pbWFMaXN0ID0gbnVsbDtcbiAgICB0aGlzLm1fQ3VycmVudExNID0gbnVsbDtcbiAgICB0aGlzLm1fZWRnZXMgPSBuZXcgQXJyYXkoKTtcbiAgICB0aGlzLm1fVXNlRnVsbFJhbmdlID0gZmFsc2U7XG4gICAgdGhpcy5tX0hhc09wZW5QYXRocyA9IGZhbHNlO1xuICAgIHRoaXMuUHJlc2VydmVDb2xsaW5lYXIgPSBmYWxzZTtcbiAgICB0aGlzLm1fTWluaW1hTGlzdCA9IG51bGw7XG4gICAgdGhpcy5tX0N1cnJlbnRMTSA9IG51bGw7XG4gICAgdGhpcy5tX1VzZUZ1bGxSYW5nZSA9IGZhbHNlO1xuICAgIHRoaXMubV9IYXNPcGVuUGF0aHMgPSBmYWxzZTtcbiAgfTtcbiAgLy8gUmFuZ2VzIGFyZSBpbiBvcmlnaW5hbCBDIyB0b28gaGlnaCBmb3IgSmF2YXNjcmlwdCAoaW4gY3VycmVudCBzdGF0ZSAyMDEzIHNlcHRlbWJlcik6XG4gIC8vIHByb3RlY3RlZCBjb25zdCBkb3VibGUgaG9yaXpvbnRhbCA9IC0zLjRFKzM4O1xuICAvLyBpbnRlcm5hbCBjb25zdCBjSW50IGxvUmFuZ2UgPSAweDNGRkZGRkZGOyAvLyA9IDEwNzM3NDE4MjMgPSBzcXJ0KDJeNjMgLTEpLzJcbiAgLy8gaW50ZXJuYWwgY29uc3QgY0ludCBoaVJhbmdlID0gMHgzRkZGRkZGRkZGRkZGRkZGTDsgLy8gPSA0NjExNjg2MDE4NDI3Mzg3OTAzID0gc3FydCgyXjEyNyAtMSkvMlxuICAvLyBTbyBoYWQgdG8gYWRqdXN0IHRoZW0gdG8gbW9yZSBzdWl0YWJsZSBmb3IgSmF2YXNjcmlwdC5cbiAgLy8gSWYgSlMgc29tZSBkYXkgc3VwcG9ydHMgdHJ1bHkgNjQtYml0IGludGVnZXJzLCB0aGVuIHRoZXNlIHJhbmdlcyBjYW4gYmUgYXMgaW4gQyNcbiAgLy8gYW5kIGJpZ2ludGVnZXIgbGlicmFyeSBjYW4gYmUgbW9yZSBzaW1wbGVyIChhcyB0aGVuIDEyOGJpdCBjYW4gYmUgcmVwcmVzZW50ZWQgYXMgdHdvIDY0Yml0IG51bWJlcnMpXG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbCA9IC05MDA3MTk5MjU0NzQwOTkyOyAvLy0yXjUzXG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2tpcCA9IC0yO1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlVuYXNzaWduZWQgPSAtMTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS50b2xlcmFuY2UgPSAxRS0yMDtcbiAgaWYgKHVzZV9pbnQzMilcbiAge1xuICAgIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UubG9SYW5nZSA9IDB4N0ZGRjtcbiAgICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhpUmFuZ2UgPSAweDdGRkY7XG4gIH1cbiAgZWxzZVxuICB7XG4gICAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5sb1JhbmdlID0gNDc0NTMxMzI7IC8vIHNxcnQoMl41MyAtMSkvMlxuICAgIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaGlSYW5nZSA9IDQ1MDM1OTk2MjczNzA0OTU7IC8vIHNxcnQoMl4xMDYgLTEpLzJcbiAgfVxuXG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UubmVhcl96ZXJvID0gZnVuY3Rpb24gKHZhbClcbiAge1xuICAgIHJldHVybiAodmFsID4gLUNsaXBwZXJMaWIuQ2xpcHBlckJhc2UudG9sZXJhbmNlKSAmJiAodmFsIDwgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS50b2xlcmFuY2UpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLklzSG9yaXpvbnRhbCA9IGZ1bmN0aW9uIChlKVxuICB7XG4gICAgcmV0dXJuIGUuRGVsdGEuWSA9PT0gMDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuUG9pbnRJc1ZlcnRleCA9IGZ1bmN0aW9uIChwdCwgcHApXG4gIHtcbiAgICB2YXIgcHAyID0gcHA7XG4gICAgZG8ge1xuICAgICAgaWYgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocHAyLlB0LCBwdCkpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgcHAyID0gcHAyLk5leHQ7XG4gICAgfVxuICAgIHdoaWxlIChwcDIgIT0gcHApXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5Qb2ludE9uTGluZVNlZ21lbnQgPSBmdW5jdGlvbiAocHQsIGxpbmVQdDEsIGxpbmVQdDIsIFVzZUZ1bGxSYW5nZSlcbiAge1xuICAgIGlmIChVc2VGdWxsUmFuZ2UpXG4gICAgICByZXR1cm4gKChwdC5YID09IGxpbmVQdDEuWCkgJiYgKHB0LlkgPT0gbGluZVB0MS5ZKSkgfHxcbiAgICAgICAgKChwdC5YID09IGxpbmVQdDIuWCkgJiYgKHB0LlkgPT0gbGluZVB0Mi5ZKSkgfHxcbiAgICAgICAgKCgocHQuWCA+IGxpbmVQdDEuWCkgPT0gKHB0LlggPCBsaW5lUHQyLlgpKSAmJlxuICAgICAgICAoKHB0LlkgPiBsaW5lUHQxLlkpID09IChwdC5ZIDwgbGluZVB0Mi5ZKSkgJiZcbiAgICAgICAgKEludDEyOC5vcF9FcXVhbGl0eShJbnQxMjguSW50MTI4TXVsKChwdC5YIC0gbGluZVB0MS5YKSwgKGxpbmVQdDIuWSAtIGxpbmVQdDEuWSkpLFxuICAgICAgICAgIEludDEyOC5JbnQxMjhNdWwoKGxpbmVQdDIuWCAtIGxpbmVQdDEuWCksIChwdC5ZIC0gbGluZVB0MS5ZKSkpKSk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuICgocHQuWCA9PSBsaW5lUHQxLlgpICYmIChwdC5ZID09IGxpbmVQdDEuWSkpIHx8ICgocHQuWCA9PSBsaW5lUHQyLlgpICYmIChwdC5ZID09IGxpbmVQdDIuWSkpIHx8ICgoKHB0LlggPiBsaW5lUHQxLlgpID09IChwdC5YIDwgbGluZVB0Mi5YKSkgJiYgKChwdC5ZID4gbGluZVB0MS5ZKSA9PSAocHQuWSA8IGxpbmVQdDIuWSkpICYmICgocHQuWCAtIGxpbmVQdDEuWCkgKiAobGluZVB0Mi5ZIC0gbGluZVB0MS5ZKSA9PSAobGluZVB0Mi5YIC0gbGluZVB0MS5YKSAqIChwdC5ZIC0gbGluZVB0MS5ZKSkpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5Qb2ludE9uUG9seWdvbiA9IGZ1bmN0aW9uIChwdCwgcHAsIFVzZUZ1bGxSYW5nZSlcbiAge1xuICAgIHZhciBwcDIgPSBwcDtcbiAgICB3aGlsZSAodHJ1ZSlcbiAgICB7XG4gICAgICBpZiAodGhpcy5Qb2ludE9uTGluZVNlZ21lbnQocHQsIHBwMi5QdCwgcHAyLk5leHQuUHQsIFVzZUZ1bGxSYW5nZSkpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgcHAyID0gcHAyLk5leHQ7XG4gICAgICBpZiAocHAyID09IHBwKVxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5TbG9wZXNFcXVhbCA9IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2xvcGVzRXF1YWwgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdmFyIGEgPSBhcmd1bWVudHMsXG4gICAgICBhbGVuID0gYS5sZW5ndGg7XG4gICAgdmFyIGUxLCBlMiwgcHQxLCBwdDIsIHB0MywgcHQ0LCBVc2VGdWxsUmFuZ2U7XG4gICAgaWYgKGFsZW4gPT0gMykgLy8gZnVuY3Rpb24gKGUxLCBlMiwgVXNlRnVsbFJhbmdlKVxuICAgIHtcbiAgICAgIGUxID0gYVswXTtcbiAgICAgIGUyID0gYVsxXTtcbiAgICAgIFVzZUZ1bGxSYW5nZSA9IGFbMl07XG4gICAgICBpZiAoVXNlRnVsbFJhbmdlKVxuICAgICAgICByZXR1cm4gSW50MTI4Lm9wX0VxdWFsaXR5KEludDEyOC5JbnQxMjhNdWwoZTEuRGVsdGEuWSwgZTIuRGVsdGEuWCksIEludDEyOC5JbnQxMjhNdWwoZTEuRGVsdGEuWCwgZTIuRGVsdGEuWSkpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gQ2xpcHBlckxpYi5DYXN0X0ludDY0KChlMS5EZWx0YS5ZKSAqIChlMi5EZWx0YS5YKSkgPT0gQ2xpcHBlckxpYi5DYXN0X0ludDY0KChlMS5EZWx0YS5YKSAqIChlMi5EZWx0YS5ZKSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGFsZW4gPT0gNCkgLy8gZnVuY3Rpb24gKHB0MSwgcHQyLCBwdDMsIFVzZUZ1bGxSYW5nZSlcbiAgICB7XG4gICAgICBwdDEgPSBhWzBdO1xuICAgICAgcHQyID0gYVsxXTtcbiAgICAgIHB0MyA9IGFbMl07XG4gICAgICBVc2VGdWxsUmFuZ2UgPSBhWzNdO1xuICAgICAgaWYgKFVzZUZ1bGxSYW5nZSlcbiAgICAgICAgcmV0dXJuIEludDEyOC5vcF9FcXVhbGl0eShJbnQxMjguSW50MTI4TXVsKHB0MS5ZIC0gcHQyLlksIHB0Mi5YIC0gcHQzLlgpLCBJbnQxMjguSW50MTI4TXVsKHB0MS5YIC0gcHQyLlgsIHB0Mi5ZIC0gcHQzLlkpKTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIENsaXBwZXJMaWIuQ2FzdF9JbnQ2NCgocHQxLlkgLSBwdDIuWSkgKiAocHQyLlggLSBwdDMuWCkpIC0gQ2xpcHBlckxpYi5DYXN0X0ludDY0KChwdDEuWCAtIHB0Mi5YKSAqIChwdDIuWSAtIHB0My5ZKSkgPT09IDA7XG4gICAgfVxuICAgIGVsc2UgLy8gZnVuY3Rpb24gKHB0MSwgcHQyLCBwdDMsIHB0NCwgVXNlRnVsbFJhbmdlKVxuICAgIHtcbiAgICAgIHB0MSA9IGFbMF07XG4gICAgICBwdDIgPSBhWzFdO1xuICAgICAgcHQzID0gYVsyXTtcbiAgICAgIHB0NCA9IGFbM107XG4gICAgICBVc2VGdWxsUmFuZ2UgPSBhWzRdO1xuICAgICAgaWYgKFVzZUZ1bGxSYW5nZSlcbiAgICAgICAgcmV0dXJuIEludDEyOC5vcF9FcXVhbGl0eShJbnQxMjguSW50MTI4TXVsKHB0MS5ZIC0gcHQyLlksIHB0My5YIC0gcHQ0LlgpLCBJbnQxMjguSW50MTI4TXVsKHB0MS5YIC0gcHQyLlgsIHB0My5ZIC0gcHQ0LlkpKTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIENsaXBwZXJMaWIuQ2FzdF9JbnQ2NCgocHQxLlkgLSBwdDIuWSkgKiAocHQzLlggLSBwdDQuWCkpIC0gQ2xpcHBlckxpYi5DYXN0X0ludDY0KChwdDEuWCAtIHB0Mi5YKSAqIChwdDMuWSAtIHB0NC5ZKSkgPT09IDA7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNsb3Blc0VxdWFsMyA9IGZ1bmN0aW9uIChlMSwgZTIsIFVzZUZ1bGxSYW5nZSlcbiAge1xuICAgIGlmIChVc2VGdWxsUmFuZ2UpXG4gICAgICByZXR1cm4gSW50MTI4Lm9wX0VxdWFsaXR5KEludDEyOC5JbnQxMjhNdWwoZTEuRGVsdGEuWSwgZTIuRGVsdGEuWCksIEludDEyOC5JbnQxMjhNdWwoZTEuRGVsdGEuWCwgZTIuRGVsdGEuWSkpO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBDbGlwcGVyTGliLkNhc3RfSW50NjQoKGUxLkRlbHRhLlkpICogKGUyLkRlbHRhLlgpKSA9PSBDbGlwcGVyTGliLkNhc3RfSW50NjQoKGUxLkRlbHRhLlgpICogKGUyLkRlbHRhLlkpKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5TbG9wZXNFcXVhbDQgPSBmdW5jdGlvbiAocHQxLCBwdDIsIHB0MywgVXNlRnVsbFJhbmdlKVxuICB7XG4gICAgaWYgKFVzZUZ1bGxSYW5nZSlcbiAgICAgIHJldHVybiBJbnQxMjgub3BfRXF1YWxpdHkoSW50MTI4LkludDEyOE11bChwdDEuWSAtIHB0Mi5ZLCBwdDIuWCAtIHB0My5YKSwgSW50MTI4LkludDEyOE11bChwdDEuWCAtIHB0Mi5YLCBwdDIuWSAtIHB0My5ZKSk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIENsaXBwZXJMaWIuQ2FzdF9JbnQ2NCgocHQxLlkgLSBwdDIuWSkgKiAocHQyLlggLSBwdDMuWCkpIC0gQ2xpcHBlckxpYi5DYXN0X0ludDY0KChwdDEuWCAtIHB0Mi5YKSAqIChwdDIuWSAtIHB0My5ZKSkgPT09IDA7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2xvcGVzRXF1YWw1ID0gZnVuY3Rpb24gKHB0MSwgcHQyLCBwdDMsIHB0NCwgVXNlRnVsbFJhbmdlKVxuICB7XG4gICAgaWYgKFVzZUZ1bGxSYW5nZSlcbiAgICAgIHJldHVybiBJbnQxMjgub3BfRXF1YWxpdHkoSW50MTI4LkludDEyOE11bChwdDEuWSAtIHB0Mi5ZLCBwdDMuWCAtIHB0NC5YKSwgSW50MTI4LkludDEyOE11bChwdDEuWCAtIHB0Mi5YLCBwdDMuWSAtIHB0NC5ZKSk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIENsaXBwZXJMaWIuQ2FzdF9JbnQ2NCgocHQxLlkgLSBwdDIuWSkgKiAocHQzLlggLSBwdDQuWCkpIC0gQ2xpcHBlckxpYi5DYXN0X0ludDY0KChwdDEuWCAtIHB0Mi5YKSAqIChwdDMuWSAtIHB0NC5ZKSkgPT09IDA7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLkNsZWFyID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHRoaXMuRGlzcG9zZUxvY2FsTWluaW1hTGlzdCgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBpbGVuID0gdGhpcy5tX2VkZ2VzLmxlbmd0aDsgaSA8IGlsZW47ICsraSlcbiAgICB7XG4gICAgICBmb3IgKHZhciBqID0gMCwgamxlbiA9IHRoaXMubV9lZGdlc1tpXS5sZW5ndGg7IGogPCBqbGVuOyArK2opXG4gICAgICAgIHRoaXMubV9lZGdlc1tpXVtqXSA9IG51bGw7XG4gICAgICBDbGlwcGVyTGliLkNsZWFyKHRoaXMubV9lZGdlc1tpXSk7XG4gICAgfVxuICAgIENsaXBwZXJMaWIuQ2xlYXIodGhpcy5tX2VkZ2VzKTtcbiAgICB0aGlzLm1fVXNlRnVsbFJhbmdlID0gZmFsc2U7XG4gICAgdGhpcy5tX0hhc09wZW5QYXRocyA9IGZhbHNlO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5EaXNwb3NlTG9jYWxNaW5pbWFMaXN0ID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHdoaWxlICh0aGlzLm1fTWluaW1hTGlzdCAhPT0gbnVsbClcbiAgICB7XG4gICAgICB2YXIgdG1wTG0gPSB0aGlzLm1fTWluaW1hTGlzdC5OZXh0O1xuICAgICAgdGhpcy5tX01pbmltYUxpc3QgPSBudWxsO1xuICAgICAgdGhpcy5tX01pbmltYUxpc3QgPSB0bXBMbTtcbiAgICB9XG4gICAgdGhpcy5tX0N1cnJlbnRMTSA9IG51bGw7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLlJhbmdlVGVzdCA9IGZ1bmN0aW9uIChQdCwgdXNlRnVsbFJhbmdlKVxuICB7XG4gICAgaWYgKHVzZUZ1bGxSYW5nZS5WYWx1ZSlcbiAgICB7XG4gICAgICBpZiAoUHQuWCA+IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaGlSYW5nZSB8fCBQdC5ZID4gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5oaVJhbmdlIHx8IC1QdC5YID4gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5oaVJhbmdlIHx8IC1QdC5ZID4gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5oaVJhbmdlKVxuICAgICAgICBDbGlwcGVyTGliLkVycm9yKFwiQ29vcmRpbmF0ZSBvdXRzaWRlIGFsbG93ZWQgcmFuZ2UgaW4gUmFuZ2VUZXN0KCkuXCIpO1xuICAgIH1cbiAgICBlbHNlIGlmIChQdC5YID4gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5sb1JhbmdlIHx8IFB0LlkgPiBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmxvUmFuZ2UgfHwgLVB0LlggPiBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmxvUmFuZ2UgfHwgLVB0LlkgPiBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmxvUmFuZ2UpXG4gICAge1xuICAgICAgdXNlRnVsbFJhbmdlLlZhbHVlID0gdHJ1ZTtcbiAgICAgIHRoaXMuUmFuZ2VUZXN0KFB0LCB1c2VGdWxsUmFuZ2UpO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuSW5pdEVkZ2UgPSBmdW5jdGlvbiAoZSwgZU5leHQsIGVQcmV2LCBwdClcbiAge1xuICAgIGUuTmV4dCA9IGVOZXh0O1xuICAgIGUuUHJldiA9IGVQcmV2O1xuICAgIC8vZS5DdXJyID0gcHQ7XG4gICAgZS5DdXJyLlggPSBwdC5YO1xuICAgIGUuQ3Vyci5ZID0gcHQuWTtcbiAgICBlLk91dElkeCA9IC0xO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5Jbml0RWRnZTIgPSBmdW5jdGlvbiAoZSwgcG9seVR5cGUpXG4gIHtcbiAgICBpZiAoZS5DdXJyLlkgPj0gZS5OZXh0LkN1cnIuWSlcbiAgICB7XG4gICAgICAvL2UuQm90ID0gZS5DdXJyO1xuICAgICAgZS5Cb3QuWCA9IGUuQ3Vyci5YO1xuICAgICAgZS5Cb3QuWSA9IGUuQ3Vyci5ZO1xuICAgICAgLy9lLlRvcCA9IGUuTmV4dC5DdXJyO1xuICAgICAgZS5Ub3AuWCA9IGUuTmV4dC5DdXJyLlg7XG4gICAgICBlLlRvcC5ZID0gZS5OZXh0LkN1cnIuWTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIC8vZS5Ub3AgPSBlLkN1cnI7XG4gICAgICBlLlRvcC5YID0gZS5DdXJyLlg7XG4gICAgICBlLlRvcC5ZID0gZS5DdXJyLlk7XG4gICAgICAvL2UuQm90ID0gZS5OZXh0LkN1cnI7XG4gICAgICBlLkJvdC5YID0gZS5OZXh0LkN1cnIuWDtcbiAgICAgIGUuQm90LlkgPSBlLk5leHQuQ3Vyci5ZO1xuICAgIH1cbiAgICB0aGlzLlNldER4KGUpO1xuICAgIGUuUG9seVR5cCA9IHBvbHlUeXBlO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5GaW5kTmV4dExvY01pbiA9IGZ1bmN0aW9uIChFKVxuICB7XG4gICAgdmFyIEUyO1xuICAgIGZvciAoOzspXG4gICAge1xuICAgICAgd2hpbGUgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfSW5lcXVhbGl0eShFLkJvdCwgRS5QcmV2LkJvdCkgfHwgQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShFLkN1cnIsIEUuVG9wKSlcbiAgICAgICAgRSA9IEUuTmV4dDtcbiAgICAgIGlmIChFLkR4ICE9IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbCAmJiBFLlByZXYuRHggIT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsKVxuICAgICAgICBicmVhaztcbiAgICAgIHdoaWxlIChFLlByZXYuRHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsKVxuICAgICAgICBFID0gRS5QcmV2O1xuICAgICAgRTIgPSBFO1xuICAgICAgd2hpbGUgKEUuRHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsKVxuICAgICAgICBFID0gRS5OZXh0O1xuICAgICAgaWYgKEUuVG9wLlkgPT0gRS5QcmV2LkJvdC5ZKVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIC8vaWUganVzdCBhbiBpbnRlcm1lZGlhdGUgaG9yei5cbiAgICAgIGlmIChFMi5QcmV2LkJvdC5YIDwgRS5Cb3QuWClcbiAgICAgICAgRSA9IEUyO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBFO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5Qcm9jZXNzQm91bmQgPSBmdW5jdGlvbiAoRSwgTGVmdEJvdW5kSXNGb3J3YXJkKVxuICB7XG4gICAgdmFyIEVTdGFydDtcbiAgICB2YXIgUmVzdWx0ID0gRTtcbiAgICB2YXIgSG9yejtcblxuICAgICAgaWYgKFJlc3VsdC5PdXRJZHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Ta2lwKVxuICAgICAge1xuICAgICAgICAvL2NoZWNrIGlmIHRoZXJlIGFyZSBlZGdlcyBiZXlvbmQgdGhlIHNraXAgZWRnZSBpbiB0aGUgYm91bmQgYW5kIGlmIHNvXG4gICAgICAgIC8vY3JlYXRlIGFub3RoZXIgTG9jTWluIGFuZCBjYWxsaW5nIFByb2Nlc3NCb3VuZCBvbmNlIG1vcmUgLi4uXG4gICAgICAgIEUgPSBSZXN1bHQ7XG4gICAgICAgIGlmIChMZWZ0Qm91bmRJc0ZvcndhcmQpXG4gICAgICAgIHtcbiAgICAgICAgICB3aGlsZSAoRS5Ub3AuWSA9PSBFLk5leHQuQm90LlkpIEUgPSBFLk5leHQ7XG4gICAgICAgICAgd2hpbGUgKEUgIT0gUmVzdWx0ICYmIEUuRHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsKSBFID0gRS5QcmV2O1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgIHdoaWxlIChFLlRvcC5ZID09IEUuUHJldi5Cb3QuWSkgRSA9IEUuUHJldjtcbiAgICAgICAgICB3aGlsZSAoRSAhPSBSZXN1bHQgJiYgRS5EeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWwpIEUgPSBFLk5leHQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEUgPT0gUmVzdWx0KVxuICAgICAgICB7XG4gICAgICAgICAgaWYgKExlZnRCb3VuZElzRm9yd2FyZCkgUmVzdWx0ID0gRS5OZXh0O1xuICAgICAgICAgIGVsc2UgUmVzdWx0ID0gRS5QcmV2O1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgIC8vdGhlcmUgYXJlIG1vcmUgZWRnZXMgaW4gdGhlIGJvdW5kIGJleW9uZCByZXN1bHQgc3RhcnRpbmcgd2l0aCBFXG4gICAgICAgICAgaWYgKExlZnRCb3VuZElzRm9yd2FyZClcbiAgICAgICAgICAgIEUgPSBSZXN1bHQuTmV4dDtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBFID0gUmVzdWx0LlByZXY7XG4gICAgICAgICAgdmFyIGxvY01pbiA9IG5ldyBDbGlwcGVyTGliLkxvY2FsTWluaW1hKCk7XG4gICAgICAgICAgbG9jTWluLk5leHQgPSBudWxsO1xuICAgICAgICAgIGxvY01pbi5ZID0gRS5Cb3QuWTtcbiAgICAgICAgICBsb2NNaW4uTGVmdEJvdW5kID0gbnVsbDtcbiAgICAgICAgICBsb2NNaW4uUmlnaHRCb3VuZCA9IEU7XG4gICAgICAgICAgRS5XaW5kRGVsdGEgPSAwO1xuICAgICAgICAgIFJlc3VsdCA9IHRoaXMuUHJvY2Vzc0JvdW5kKEUsIExlZnRCb3VuZElzRm9yd2FyZCk7XG4gICAgICAgICAgdGhpcy5JbnNlcnRMb2NhbE1pbmltYShsb2NNaW4pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBSZXN1bHQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChFLkR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbClcbiAgICAgIHtcbiAgICAgICAgLy9XZSBuZWVkIHRvIGJlIGNhcmVmdWwgd2l0aCBvcGVuIHBhdGhzIGJlY2F1c2UgdGhpcyBtYXkgbm90IGJlIGFcbiAgICAgICAgLy90cnVlIGxvY2FsIG1pbmltYSAoaWUgRSBtYXkgYmUgZm9sbG93aW5nIGEgc2tpcCBlZGdlKS5cbiAgICAgICAgLy9BbHNvLCBjb25zZWN1dGl2ZSBob3J6LiBlZGdlcyBtYXkgc3RhcnQgaGVhZGluZyBsZWZ0IGJlZm9yZSBnb2luZyByaWdodC5cbiAgICAgICAgaWYgKExlZnRCb3VuZElzRm9yd2FyZCkgRVN0YXJ0ID0gRS5QcmV2O1xuICAgICAgICBlbHNlIEVTdGFydCA9IEUuTmV4dDtcbiAgICAgICAgaWYgKEVTdGFydC5PdXRJZHggIT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Ta2lwKVxuICAgICAgICB7XG4gICAgICAgICAgaWYgKEVTdGFydC5EeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWwpIC8vaWUgYW4gYWRqb2luaW5nIGhvcml6b250YWwgc2tpcCBlZGdlXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWYgKEVTdGFydC5Cb3QuWCAhPSBFLkJvdC5YICYmIEVTdGFydC5Ub3AuWCAhPSBFLkJvdC5YKVxuICAgICAgICAgICAgICB0aGlzLlJldmVyc2VIb3Jpem9udGFsKEUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChFU3RhcnQuQm90LlggIT0gRS5Cb3QuWClcbiAgICAgICAgICAgIHRoaXMuUmV2ZXJzZUhvcml6b250YWwoRSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgRVN0YXJ0ID0gRTtcbiAgICAgIGlmIChMZWZ0Qm91bmRJc0ZvcndhcmQpXG4gICAgICB7XG4gICAgICAgIHdoaWxlIChSZXN1bHQuVG9wLlkgPT0gUmVzdWx0Lk5leHQuQm90LlkgJiYgUmVzdWx0Lk5leHQuT3V0SWR4ICE9IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2tpcClcbiAgICAgICAgICBSZXN1bHQgPSBSZXN1bHQuTmV4dDtcbiAgICAgICAgaWYgKFJlc3VsdC5EeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWwgJiYgUmVzdWx0Lk5leHQuT3V0SWR4ICE9IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2tpcClcbiAgICAgICAge1xuICAgICAgICAgIC8vbmI6IGF0IHRoZSB0b3Agb2YgYSBib3VuZCwgaG9yaXpvbnRhbHMgYXJlIGFkZGVkIHRvIHRoZSBib3VuZFxuICAgICAgICAgIC8vb25seSB3aGVuIHRoZSBwcmVjZWRpbmcgZWRnZSBhdHRhY2hlcyB0byB0aGUgaG9yaXpvbnRhbCdzIGxlZnQgdmVydGV4XG4gICAgICAgICAgLy91bmxlc3MgYSBTa2lwIGVkZ2UgaXMgZW5jb3VudGVyZWQgd2hlbiB0aGF0IGJlY29tZXMgdGhlIHRvcCBkaXZpZGVcbiAgICAgICAgICBIb3J6ID0gUmVzdWx0O1xuICAgICAgICAgIHdoaWxlIChIb3J6LlByZXYuRHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsKVxuICAgICAgICAgICAgSG9yeiA9IEhvcnouUHJldjtcbiAgICAgICAgICBpZiAoSG9yei5QcmV2LlRvcC5YID09IFJlc3VsdC5OZXh0LlRvcC5YKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGlmICghTGVmdEJvdW5kSXNGb3J3YXJkKVxuICAgICAgICAgICAgICBSZXN1bHQgPSBIb3J6LlByZXY7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKEhvcnouUHJldi5Ub3AuWCA+IFJlc3VsdC5OZXh0LlRvcC5YKVxuICAgICAgICAgICAgUmVzdWx0ID0gSG9yei5QcmV2O1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChFICE9IFJlc3VsdClcbiAgICAgICAge1xuICAgICAgICAgIEUuTmV4dEluTE1MID0gRS5OZXh0O1xuICAgICAgICAgIGlmIChFLkR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbCAmJiBFICE9IEVTdGFydCAmJiBFLkJvdC5YICE9IEUuUHJldi5Ub3AuWClcbiAgICAgICAgICAgIHRoaXMuUmV2ZXJzZUhvcml6b250YWwoRSk7XG4gICAgICAgICAgRSA9IEUuTmV4dDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoRS5EeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWwgJiYgRSAhPSBFU3RhcnQgJiYgRS5Cb3QuWCAhPSBFLlByZXYuVG9wLlgpXG4gICAgICAgICAgdGhpcy5SZXZlcnNlSG9yaXpvbnRhbChFKTtcbiAgICAgICAgUmVzdWx0ID0gUmVzdWx0Lk5leHQ7XG4gICAgICAgIC8vbW92ZSB0byB0aGUgZWRnZSBqdXN0IGJleW9uZCBjdXJyZW50IGJvdW5kXG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIHdoaWxlIChSZXN1bHQuVG9wLlkgPT0gUmVzdWx0LlByZXYuQm90LlkgJiYgUmVzdWx0LlByZXYuT3V0SWR4ICE9IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2tpcClcbiAgICAgICAgICBSZXN1bHQgPSBSZXN1bHQuUHJldjtcbiAgICAgICAgaWYgKFJlc3VsdC5EeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWwgJiYgUmVzdWx0LlByZXYuT3V0SWR4ICE9IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2tpcClcbiAgICAgICAge1xuICAgICAgICAgIEhvcnogPSBSZXN1bHQ7XG4gICAgICAgICAgd2hpbGUgKEhvcnouTmV4dC5EeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWwpXG4gICAgICAgICAgICBIb3J6ID0gSG9yei5OZXh0O1xuICAgICAgICAgIGlmIChIb3J6Lk5leHQuVG9wLlggPT0gUmVzdWx0LlByZXYuVG9wLlgpXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWYgKCFMZWZ0Qm91bmRJc0ZvcndhcmQpXG4gICAgICAgICAgICAgIFJlc3VsdCA9IEhvcnouTmV4dDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoSG9yei5OZXh0LlRvcC5YID4gUmVzdWx0LlByZXYuVG9wLlgpXG4gICAgICAgICAgICBSZXN1bHQgPSBIb3J6Lk5leHQ7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKEUgIT0gUmVzdWx0KVxuICAgICAgICB7XG4gICAgICAgICAgRS5OZXh0SW5MTUwgPSBFLlByZXY7XG4gICAgICAgICAgaWYgKEUuRHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsICYmIEUgIT0gRVN0YXJ0ICYmIEUuQm90LlggIT0gRS5OZXh0LlRvcC5YKVxuICAgICAgICAgICAgdGhpcy5SZXZlcnNlSG9yaXpvbnRhbChFKTtcbiAgICAgICAgICBFID0gRS5QcmV2O1xuICAgICAgICB9XG4gICAgICAgIGlmIChFLkR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbCAmJiBFICE9IEVTdGFydCAmJiBFLkJvdC5YICE9IEUuTmV4dC5Ub3AuWClcbiAgICAgICAgICB0aGlzLlJldmVyc2VIb3Jpem9udGFsKEUpO1xuICAgICAgICBSZXN1bHQgPSBSZXN1bHQuUHJldjtcbiAgICAgICAgLy9tb3ZlIHRvIHRoZSBlZGdlIGp1c3QgYmV5b25kIGN1cnJlbnQgYm91bmRcbiAgICAgIH1cblxuICAgIHJldHVybiBSZXN1bHQ7XG4gIH07XG5cbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuQWRkUGF0aCA9IGZ1bmN0aW9uIChwZywgcG9seVR5cGUsIENsb3NlZClcbiAge1xuICAgIGlmICh1c2VfbGluZXMpXG4gICAge1xuICAgICAgaWYgKCFDbG9zZWQgJiYgcG9seVR5cGUgPT0gQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdENsaXApXG4gICAgICAgIENsaXBwZXJMaWIuRXJyb3IoXCJBZGRQYXRoOiBPcGVuIHBhdGhzIG11c3QgYmUgc3ViamVjdC5cIik7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBpZiAoIUNsb3NlZClcbiAgICAgICAgQ2xpcHBlckxpYi5FcnJvcihcIkFkZFBhdGg6IE9wZW4gcGF0aHMgaGF2ZSBiZWVuIGRpc2FibGVkLlwiKTtcbiAgICB9XG4gICAgdmFyIGhpZ2hJID0gcGcubGVuZ3RoIC0gMTtcbiAgICBpZiAoQ2xvc2VkKVxuICAgICAgd2hpbGUgKGhpZ2hJID4gMCAmJiAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwZ1toaWdoSV0sIHBnWzBdKSkpXG4gICAgLS1oaWdoSTtcbiAgICB3aGlsZSAoaGlnaEkgPiAwICYmIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHBnW2hpZ2hJXSwgcGdbaGlnaEkgLSAxXSkpKVxuICAgIC0taGlnaEk7XG4gICAgaWYgKChDbG9zZWQgJiYgaGlnaEkgPCAyKSB8fCAoIUNsb3NlZCAmJiBoaWdoSSA8IDEpKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIC8vY3JlYXRlIGEgbmV3IGVkZ2UgYXJyYXkgLi4uXG4gICAgdmFyIGVkZ2VzID0gbmV3IEFycmF5KCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gaGlnaEk7IGkrKylcbiAgICAgIGVkZ2VzLnB1c2gobmV3IENsaXBwZXJMaWIuVEVkZ2UoKSk7XG4gICAgdmFyIElzRmxhdCA9IHRydWU7XG4gICAgLy8xLiBCYXNpYyAoZmlyc3QpIGVkZ2UgaW5pdGlhbGl6YXRpb24gLi4uXG5cbiAgICAvL2VkZ2VzWzFdLkN1cnIgPSBwZ1sxXTtcbiAgICBlZGdlc1sxXS5DdXJyLlggPSBwZ1sxXS5YO1xuICAgIGVkZ2VzWzFdLkN1cnIuWSA9IHBnWzFdLlk7XG5cbiAgICB2YXIgJDEgPSB7VmFsdWU6IHRoaXMubV9Vc2VGdWxsUmFuZ2V9O1xuICAgIHRoaXMuUmFuZ2VUZXN0KHBnWzBdLCAkMSk7XG4gICAgdGhpcy5tX1VzZUZ1bGxSYW5nZSA9ICQxLlZhbHVlO1xuXG4gICAgJDEuVmFsdWUgPSB0aGlzLm1fVXNlRnVsbFJhbmdlO1xuICAgIHRoaXMuUmFuZ2VUZXN0KHBnW2hpZ2hJXSwgJDEpO1xuICAgIHRoaXMubV9Vc2VGdWxsUmFuZ2UgPSAkMS5WYWx1ZTtcblxuICAgIHRoaXMuSW5pdEVkZ2UoZWRnZXNbMF0sIGVkZ2VzWzFdLCBlZGdlc1toaWdoSV0sIHBnWzBdKTtcbiAgICB0aGlzLkluaXRFZGdlKGVkZ2VzW2hpZ2hJXSwgZWRnZXNbMF0sIGVkZ2VzW2hpZ2hJIC0gMV0sIHBnW2hpZ2hJXSk7XG4gICAgZm9yICh2YXIgaSA9IGhpZ2hJIC0gMTsgaSA+PSAxOyAtLWkpXG4gICAge1xuICAgICAgJDEuVmFsdWUgPSB0aGlzLm1fVXNlRnVsbFJhbmdlO1xuICAgICAgdGhpcy5SYW5nZVRlc3QocGdbaV0sICQxKTtcbiAgICAgIHRoaXMubV9Vc2VGdWxsUmFuZ2UgPSAkMS5WYWx1ZTtcblxuICAgICAgdGhpcy5Jbml0RWRnZShlZGdlc1tpXSwgZWRnZXNbaSArIDFdLCBlZGdlc1tpIC0gMV0sIHBnW2ldKTtcbiAgICB9XG5cbiAgICB2YXIgZVN0YXJ0ID0gZWRnZXNbMF07XG4gICAgLy8yLiBSZW1vdmUgZHVwbGljYXRlIHZlcnRpY2VzLCBhbmQgKHdoZW4gY2xvc2VkKSBjb2xsaW5lYXIgZWRnZXMgLi4uXG4gICAgdmFyIEUgPSBlU3RhcnQsXG4gICAgICBlTG9vcFN0b3AgPSBlU3RhcnQ7XG4gICAgZm9yICg7OylcbiAgICB7XG4gICAgLy9jb25zb2xlLmxvZyhFLk5leHQsIGVTdGFydCk7XG4gICAgXHQvL25iOiBhbGxvd3MgbWF0Y2hpbmcgc3RhcnQgYW5kIGVuZCBwb2ludHMgd2hlbiBub3QgQ2xvc2VkIC4uLlxuICAgICAgaWYgKEUuQ3VyciA9PSBFLk5leHQuQ3VyciAmJiAoQ2xvc2VkIHx8IEUuTmV4dCAhPSBlU3RhcnQpKVxuICAgICAge1xuICAgICAgICBpZiAoRSA9PSBFLk5leHQpXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGlmIChFID09IGVTdGFydClcbiAgICAgICAgICBlU3RhcnQgPSBFLk5leHQ7XG4gICAgICAgIEUgPSB0aGlzLlJlbW92ZUVkZ2UoRSk7XG4gICAgICAgIGVMb29wU3RvcCA9IEU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKEUuUHJldiA9PSBFLk5leHQpXG4gICAgICAgIGJyZWFrO1xuICAgICAgZWxzZSBpZiAoQ2xvc2VkICYmIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2xvcGVzRXF1YWwoRS5QcmV2LkN1cnIsIEUuQ3VyciwgRS5OZXh0LkN1cnIsIHRoaXMubV9Vc2VGdWxsUmFuZ2UpICYmICghdGhpcy5QcmVzZXJ2ZUNvbGxpbmVhciB8fCAhdGhpcy5QdDJJc0JldHdlZW5QdDFBbmRQdDMoRS5QcmV2LkN1cnIsIEUuQ3VyciwgRS5OZXh0LkN1cnIpKSlcbiAgICAgIHtcbiAgICAgICAgLy9Db2xsaW5lYXIgZWRnZXMgYXJlIGFsbG93ZWQgZm9yIG9wZW4gcGF0aHMgYnV0IGluIGNsb3NlZCBwYXRoc1xuICAgICAgICAvL3RoZSBkZWZhdWx0IGlzIHRvIG1lcmdlIGFkamFjZW50IGNvbGxpbmVhciBlZGdlcyBpbnRvIGEgc2luZ2xlIGVkZ2UuXG4gICAgICAgIC8vSG93ZXZlciwgaWYgdGhlIFByZXNlcnZlQ29sbGluZWFyIHByb3BlcnR5IGlzIGVuYWJsZWQsIG9ubHkgb3ZlcmxhcHBpbmdcbiAgICAgICAgLy9jb2xsaW5lYXIgZWRnZXMgKGllIHNwaWtlcykgd2lsbCBiZSByZW1vdmVkIGZyb20gY2xvc2VkIHBhdGhzLlxuICAgICAgICBpZiAoRSA9PSBlU3RhcnQpXG4gICAgICAgICAgZVN0YXJ0ID0gRS5OZXh0O1xuICAgICAgICBFID0gdGhpcy5SZW1vdmVFZGdlKEUpO1xuICAgICAgICBFID0gRS5QcmV2O1xuICAgICAgICBlTG9vcFN0b3AgPSBFO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIEUgPSBFLk5leHQ7XG4gICAgICBpZiAoKEUgPT0gZUxvb3BTdG9wKSB8fCAoIUNsb3NlZCAmJiBFLk5leHQgPT0gZVN0YXJ0KSkgYnJlYWs7XG4gICAgfVxuICAgIGlmICgoIUNsb3NlZCAmJiAoRSA9PSBFLk5leHQpKSB8fCAoQ2xvc2VkICYmIChFLlByZXYgPT0gRS5OZXh0KSkpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgaWYgKCFDbG9zZWQpXG4gICAge1xuICAgICAgdGhpcy5tX0hhc09wZW5QYXRocyA9IHRydWU7XG4gICAgICBlU3RhcnQuUHJldi5PdXRJZHggPSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNraXA7XG4gICAgfVxuICAgIC8vMy4gRG8gc2Vjb25kIHN0YWdlIG9mIGVkZ2UgaW5pdGlhbGl6YXRpb24gLi4uXG4gICAgRSA9IGVTdGFydDtcbiAgICBkbyB7XG4gICAgICB0aGlzLkluaXRFZGdlMihFLCBwb2x5VHlwZSk7XG4gICAgICBFID0gRS5OZXh0O1xuICAgICAgaWYgKElzRmxhdCAmJiBFLkN1cnIuWSAhPSBlU3RhcnQuQ3Vyci5ZKVxuICAgICAgICBJc0ZsYXQgPSBmYWxzZTtcbiAgICB9XG4gICAgd2hpbGUgKEUgIT0gZVN0YXJ0KVxuICAgIC8vNC4gRmluYWxseSwgYWRkIGVkZ2UgYm91bmRzIHRvIExvY2FsTWluaW1hIGxpc3QgLi4uXG4gICAgLy9Ub3RhbGx5IGZsYXQgcGF0aHMgbXVzdCBiZSBoYW5kbGVkIGRpZmZlcmVudGx5IHdoZW4gYWRkaW5nIHRoZW1cbiAgICAvL3RvIExvY2FsTWluaW1hIGxpc3QgdG8gYXZvaWQgZW5kbGVzcyBsb29wcyBldGMgLi4uXG4gICAgaWYgKElzRmxhdClcbiAgICB7XG4gICAgICBpZiAoQ2xvc2VkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBFLlByZXYuT3V0SWR4ID0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Ta2lwO1xuICAgICAgaWYgKEUuUHJldi5Cb3QuWCA8IEUuUHJldi5Ub3AuWClcbiAgICAgICAgdGhpcy5SZXZlcnNlSG9yaXpvbnRhbChFLlByZXYpO1xuICAgICAgdmFyIGxvY01pbiA9IG5ldyBDbGlwcGVyTGliLkxvY2FsTWluaW1hKCk7XG4gICAgICBsb2NNaW4uTmV4dCA9IG51bGw7XG4gICAgICBsb2NNaW4uWSA9IEUuQm90Llk7XG4gICAgICBsb2NNaW4uTGVmdEJvdW5kID0gbnVsbDtcbiAgICAgIGxvY01pbi5SaWdodEJvdW5kID0gRTtcbiAgICAgIGxvY01pbi5SaWdodEJvdW5kLlNpZGUgPSBDbGlwcGVyTGliLkVkZ2VTaWRlLmVzUmlnaHQ7XG4gICAgICBsb2NNaW4uUmlnaHRCb3VuZC5XaW5kRGVsdGEgPSAwO1xuICAgICAgd2hpbGUgKEUuTmV4dC5PdXRJZHggIT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Ta2lwKVxuICAgICAge1xuICAgICAgICBFLk5leHRJbkxNTCA9IEUuTmV4dDtcbiAgICAgICAgaWYgKEUuQm90LlggIT0gRS5QcmV2LlRvcC5YKVxuICAgICAgICAgIHRoaXMuUmV2ZXJzZUhvcml6b250YWwoRSk7XG4gICAgICAgIEUgPSBFLk5leHQ7XG4gICAgICB9XG4gICAgICB0aGlzLkluc2VydExvY2FsTWluaW1hKGxvY01pbik7XG4gICAgICB0aGlzLm1fZWRnZXMucHVzaChlZGdlcyk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5tX2VkZ2VzLnB1c2goZWRnZXMpO1xuICAgIHZhciBsZWZ0Qm91bmRJc0ZvcndhcmQ7XG4gICAgdmFyIEVNaW4gPSBudWxsO1xuXG5cdFx0Ly93b3JrYXJvdW5kIHRvIGF2b2lkIGFuIGVuZGxlc3MgbG9vcCBpbiB0aGUgd2hpbGUgbG9vcCBiZWxvdyB3aGVuXG4gICAgLy9vcGVuIHBhdGhzIGhhdmUgbWF0Y2hpbmcgc3RhcnQgYW5kIGVuZCBwb2ludHMgLi4uXG4gICAgaWYoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShFLlByZXYuQm90LCBFLlByZXYuVG9wKSlcbiAgICBcdEUgPSBFLk5leHQ7XG5cbiAgICBmb3IgKDs7KVxuICAgIHtcbiAgICAgIEUgPSB0aGlzLkZpbmROZXh0TG9jTWluKEUpO1xuICAgICAgaWYgKEUgPT0gRU1pbilcbiAgICAgICAgYnJlYWs7XG4gICAgICBlbHNlIGlmIChFTWluID09IG51bGwpXG4gICAgICAgIEVNaW4gPSBFO1xuICAgICAgLy9FIGFuZCBFLlByZXYgbm93IHNoYXJlIGEgbG9jYWwgbWluaW1hIChsZWZ0IGFsaWduZWQgaWYgaG9yaXpvbnRhbCkuXG4gICAgICAvL0NvbXBhcmUgdGhlaXIgc2xvcGVzIHRvIGZpbmQgd2hpY2ggc3RhcnRzIHdoaWNoIGJvdW5kIC4uLlxuICAgICAgdmFyIGxvY01pbiA9IG5ldyBDbGlwcGVyTGliLkxvY2FsTWluaW1hKCk7XG4gICAgICBsb2NNaW4uTmV4dCA9IG51bGw7XG4gICAgICBsb2NNaW4uWSA9IEUuQm90Llk7XG4gICAgICBpZiAoRS5EeCA8IEUuUHJldi5EeClcbiAgICAgIHtcbiAgICAgICAgbG9jTWluLkxlZnRCb3VuZCA9IEUuUHJldjtcbiAgICAgICAgbG9jTWluLlJpZ2h0Qm91bmQgPSBFO1xuICAgICAgICBsZWZ0Qm91bmRJc0ZvcndhcmQgPSBmYWxzZTtcbiAgICAgICAgLy9RLm5leHRJbkxNTCA9IFEucHJldlxuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICBsb2NNaW4uTGVmdEJvdW5kID0gRTtcbiAgICAgICAgbG9jTWluLlJpZ2h0Qm91bmQgPSBFLlByZXY7XG4gICAgICAgIGxlZnRCb3VuZElzRm9yd2FyZCA9IHRydWU7XG4gICAgICAgIC8vUS5uZXh0SW5MTUwgPSBRLm5leHRcbiAgICAgIH1cbiAgICAgIGxvY01pbi5MZWZ0Qm91bmQuU2lkZSA9IENsaXBwZXJMaWIuRWRnZVNpZGUuZXNMZWZ0O1xuICAgICAgbG9jTWluLlJpZ2h0Qm91bmQuU2lkZSA9IENsaXBwZXJMaWIuRWRnZVNpZGUuZXNSaWdodDtcbiAgICAgIGlmICghQ2xvc2VkKVxuICAgICAgICBsb2NNaW4uTGVmdEJvdW5kLldpbmREZWx0YSA9IDA7XG4gICAgICBlbHNlIGlmIChsb2NNaW4uTGVmdEJvdW5kLk5leHQgPT0gbG9jTWluLlJpZ2h0Qm91bmQpXG4gICAgICAgIGxvY01pbi5MZWZ0Qm91bmQuV2luZERlbHRhID0gLTE7XG4gICAgICBlbHNlXG4gICAgICAgIGxvY01pbi5MZWZ0Qm91bmQuV2luZERlbHRhID0gMTtcbiAgICAgIGxvY01pbi5SaWdodEJvdW5kLldpbmREZWx0YSA9IC1sb2NNaW4uTGVmdEJvdW5kLldpbmREZWx0YTtcbiAgICAgIEUgPSB0aGlzLlByb2Nlc3NCb3VuZChsb2NNaW4uTGVmdEJvdW5kLCBsZWZ0Qm91bmRJc0ZvcndhcmQpO1xuICAgICAgaWYgKEUuT3V0SWR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2tpcClcbiAgICAgIFx0RSA9IHRoaXMuUHJvY2Vzc0JvdW5kKEUsIGxlZnRCb3VuZElzRm9yd2FyZCk7XG4gICAgICB2YXIgRTIgPSB0aGlzLlByb2Nlc3NCb3VuZChsb2NNaW4uUmlnaHRCb3VuZCwgIWxlZnRCb3VuZElzRm9yd2FyZCk7XG4gICAgICBpZiAoRTIuT3V0SWR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2tpcCkgRTIgPSB0aGlzLlByb2Nlc3NCb3VuZChFMiwgIWxlZnRCb3VuZElzRm9yd2FyZCk7XG4gICAgICBpZiAobG9jTWluLkxlZnRCb3VuZC5PdXRJZHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Ta2lwKVxuICAgICAgICBsb2NNaW4uTGVmdEJvdW5kID0gbnVsbDtcbiAgICAgIGVsc2UgaWYgKGxvY01pbi5SaWdodEJvdW5kLk91dElkeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNraXApXG4gICAgICAgIGxvY01pbi5SaWdodEJvdW5kID0gbnVsbDtcbiAgICAgIHRoaXMuSW5zZXJ0TG9jYWxNaW5pbWEobG9jTWluKTtcbiAgICAgIGlmICghbGVmdEJvdW5kSXNGb3J3YXJkKVxuICAgICAgICBFID0gRTI7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5BZGRQYXRocyA9IGZ1bmN0aW9uIChwcGcsIHBvbHlUeXBlLCBjbG9zZWQpXG4gIHtcbiAgICAvLyAgY29uc29sZS5sb2coXCItLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXCIpO1xuICAgIC8vICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShwcGcpKTtcbiAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlsZW4gPSBwcGcubGVuZ3RoOyBpIDwgaWxlbjsgKytpKVxuICAgICAgaWYgKHRoaXMuQWRkUGF0aChwcGdbaV0sIHBvbHlUeXBlLCBjbG9zZWQpKVxuICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLlB0MklzQmV0d2VlblB0MUFuZFB0MyA9IGZ1bmN0aW9uIChwdDEsIHB0MiwgcHQzKVxuICB7XG4gICAgaWYgKChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHB0MSwgcHQzKSkgfHwgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocHQxLCBwdDIpKSB8fCAgICAgICAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwdDMsIHB0MikpKVxuXG4gICAvL2lmICgocHQxID09IHB0MykgfHwgKHB0MSA9PSBwdDIpIHx8IChwdDMgPT0gcHQyKSlcbiAgIHJldHVybiBmYWxzZTtcblxuICAgIGVsc2UgaWYgKHB0MS5YICE9IHB0My5YKVxuICAgICAgcmV0dXJuIChwdDIuWCA+IHB0MS5YKSA9PSAocHQyLlggPCBwdDMuWCk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIChwdDIuWSA+IHB0MS5ZKSA9PSAocHQyLlkgPCBwdDMuWSk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLlJlbW92ZUVkZ2UgPSBmdW5jdGlvbiAoZSlcbiAge1xuICAgIC8vcmVtb3ZlcyBlIGZyb20gZG91YmxlX2xpbmtlZF9saXN0IChidXQgd2l0aG91dCByZW1vdmluZyBmcm9tIG1lbW9yeSlcbiAgICBlLlByZXYuTmV4dCA9IGUuTmV4dDtcbiAgICBlLk5leHQuUHJldiA9IGUuUHJldjtcbiAgICB2YXIgcmVzdWx0ID0gZS5OZXh0O1xuICAgIGUuUHJldiA9IG51bGw7IC8vZmxhZyBhcyByZW1vdmVkIChzZWUgQ2xpcHBlckJhc2UuQ2xlYXIpXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuU2V0RHggPSBmdW5jdGlvbiAoZSlcbiAge1xuICAgIGUuRGVsdGEuWCA9IChlLlRvcC5YIC0gZS5Cb3QuWCk7XG4gICAgZS5EZWx0YS5ZID0gKGUuVG9wLlkgLSBlLkJvdC5ZKTtcbiAgICBpZiAoZS5EZWx0YS5ZID09PSAwKSBlLkR4ID0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsO1xuICAgIGVsc2UgZS5EeCA9IChlLkRlbHRhLlgpIC8gKGUuRGVsdGEuWSk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLkluc2VydExvY2FsTWluaW1hID0gZnVuY3Rpb24gKG5ld0xtKVxuICB7XG4gICAgaWYgKHRoaXMubV9NaW5pbWFMaXN0ID09PSBudWxsKVxuICAgIHtcbiAgICAgIHRoaXMubV9NaW5pbWFMaXN0ID0gbmV3TG07XG4gICAgfVxuICAgIGVsc2UgaWYgKG5ld0xtLlkgPj0gdGhpcy5tX01pbmltYUxpc3QuWSlcbiAgICB7XG4gICAgICBuZXdMbS5OZXh0ID0gdGhpcy5tX01pbmltYUxpc3Q7XG4gICAgICB0aGlzLm1fTWluaW1hTGlzdCA9IG5ld0xtO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgdmFyIHRtcExtID0gdGhpcy5tX01pbmltYUxpc3Q7XG4gICAgICB3aGlsZSAodG1wTG0uTmV4dCAhPT0gbnVsbCAmJiAobmV3TG0uWSA8IHRtcExtLk5leHQuWSkpXG4gICAgICAgIHRtcExtID0gdG1wTG0uTmV4dDtcbiAgICAgIG5ld0xtLk5leHQgPSB0bXBMbS5OZXh0O1xuICAgICAgdG1wTG0uTmV4dCA9IG5ld0xtO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuUG9wTG9jYWxNaW5pbWEgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgaWYgKHRoaXMubV9DdXJyZW50TE0gPT09IG51bGwpXG4gICAgICByZXR1cm47XG4gICAgdGhpcy5tX0N1cnJlbnRMTSA9IHRoaXMubV9DdXJyZW50TE0uTmV4dDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuUmV2ZXJzZUhvcml6b250YWwgPSBmdW5jdGlvbiAoZSlcbiAge1xuICAgIC8vc3dhcCBob3Jpem9udGFsIGVkZ2VzJyB0b3AgYW5kIGJvdHRvbSB4J3Mgc28gdGhleSBmb2xsb3cgdGhlIG5hdHVyYWxcbiAgICAvL3Byb2dyZXNzaW9uIG9mIHRoZSBib3VuZHMgLSBpZSBzbyB0aGVpciB4Ym90cyB3aWxsIGFsaWduIHdpdGggdGhlXG4gICAgLy9hZGpvaW5pbmcgbG93ZXIgZWRnZS4gW0hlbHBmdWwgaW4gdGhlIFByb2Nlc3NIb3Jpem9udGFsKCkgbWV0aG9kLl1cbiAgICB2YXIgdG1wID0gZS5Ub3AuWDtcbiAgICBlLlRvcC5YID0gZS5Cb3QuWDtcbiAgICBlLkJvdC5YID0gdG1wO1xuICAgIGlmICh1c2VfeHl6KVxuICAgIHtcbiAgICAgIHRtcCA9IGUuVG9wLlo7XG4gICAgICBlLlRvcC5aID0gZS5Cb3QuWjtcbiAgICAgIGUuQm90LlogPSB0bXA7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5SZXNldCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB0aGlzLm1fQ3VycmVudExNID0gdGhpcy5tX01pbmltYUxpc3Q7XG4gICAgaWYgKHRoaXMubV9DdXJyZW50TE0gPT0gbnVsbClcbiAgICAgIHJldHVybjtcbiAgICAvL2llIG5vdGhpbmcgdG8gcHJvY2Vzc1xuICAgIC8vcmVzZXQgYWxsIGVkZ2VzIC4uLlxuICAgIHZhciBsbSA9IHRoaXMubV9NaW5pbWFMaXN0O1xuICAgIHdoaWxlIChsbSAhPSBudWxsKVxuICAgIHtcbiAgICAgIHZhciBlID0gbG0uTGVmdEJvdW5kO1xuICAgICAgaWYgKGUgIT0gbnVsbClcbiAgICAgIHtcbiAgICAgICAgLy9lLkN1cnIgPSBlLkJvdDtcbiAgICAgICAgZS5DdXJyLlggPSBlLkJvdC5YO1xuICAgICAgICBlLkN1cnIuWSA9IGUuQm90Llk7XG4gICAgICAgIGUuU2lkZSA9IENsaXBwZXJMaWIuRWRnZVNpZGUuZXNMZWZ0O1xuICAgICAgICBlLk91dElkeCA9IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuVW5hc3NpZ25lZDtcbiAgICAgIH1cbiAgICAgIGUgPSBsbS5SaWdodEJvdW5kO1xuICAgICAgaWYgKGUgIT0gbnVsbClcbiAgICAgIHtcbiAgICAgICAgLy9lLkN1cnIgPSBlLkJvdDtcbiAgICAgICAgZS5DdXJyLlggPSBlLkJvdC5YO1xuICAgICAgICBlLkN1cnIuWSA9IGUuQm90Llk7XG4gICAgICAgIGUuU2lkZSA9IENsaXBwZXJMaWIuRWRnZVNpZGUuZXNSaWdodDtcbiAgICAgICAgZS5PdXRJZHggPSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlVuYXNzaWduZWQ7XG4gICAgICB9XG4gICAgICBsbSA9IGxtLk5leHQ7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIgPSBmdW5jdGlvbiAoSW5pdE9wdGlvbnMpIC8vIHB1YmxpYyBDbGlwcGVyKGludCBJbml0T3B0aW9ucyA9IDApXG4gIHtcbiAgICBpZiAodHlwZW9mIChJbml0T3B0aW9ucykgPT0gXCJ1bmRlZmluZWRcIikgSW5pdE9wdGlvbnMgPSAwO1xuICAgIHRoaXMubV9Qb2x5T3V0cyA9IG51bGw7XG4gICAgdGhpcy5tX0NsaXBUeXBlID0gQ2xpcHBlckxpYi5DbGlwVHlwZS5jdEludGVyc2VjdGlvbjtcbiAgICB0aGlzLm1fU2NhbmJlYW0gPSBudWxsO1xuICAgIHRoaXMubV9BY3RpdmVFZGdlcyA9IG51bGw7XG4gICAgdGhpcy5tX1NvcnRlZEVkZ2VzID0gbnVsbDtcbiAgICB0aGlzLm1fSW50ZXJzZWN0TGlzdCA9IG51bGw7XG4gICAgdGhpcy5tX0ludGVyc2VjdE5vZGVDb21wYXJlciA9IG51bGw7XG4gICAgdGhpcy5tX0V4ZWN1dGVMb2NrZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1fQ2xpcEZpbGxUeXBlID0gQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0RXZlbk9kZDtcbiAgICB0aGlzLm1fU3ViakZpbGxUeXBlID0gQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0RXZlbk9kZDtcbiAgICB0aGlzLm1fSm9pbnMgPSBudWxsO1xuICAgIHRoaXMubV9HaG9zdEpvaW5zID0gbnVsbDtcbiAgICB0aGlzLm1fVXNpbmdQb2x5VHJlZSA9IGZhbHNlO1xuICAgIHRoaXMuUmV2ZXJzZVNvbHV0aW9uID0gZmFsc2U7XG4gICAgdGhpcy5TdHJpY3RseVNpbXBsZSA9IGZhbHNlO1xuICAgIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuY2FsbCh0aGlzKTtcbiAgICB0aGlzLm1fU2NhbmJlYW0gPSBudWxsO1xuICAgIHRoaXMubV9BY3RpdmVFZGdlcyA9IG51bGw7XG4gICAgdGhpcy5tX1NvcnRlZEVkZ2VzID0gbnVsbDtcbiAgICB0aGlzLm1fSW50ZXJzZWN0TGlzdCA9IG5ldyBBcnJheSgpO1xuICAgIHRoaXMubV9JbnRlcnNlY3ROb2RlQ29tcGFyZXIgPSBDbGlwcGVyTGliLk15SW50ZXJzZWN0Tm9kZVNvcnQuQ29tcGFyZTtcbiAgICB0aGlzLm1fRXhlY3V0ZUxvY2tlZCA9IGZhbHNlO1xuICAgIHRoaXMubV9Vc2luZ1BvbHlUcmVlID0gZmFsc2U7XG4gICAgdGhpcy5tX1BvbHlPdXRzID0gbmV3IEFycmF5KCk7XG4gICAgdGhpcy5tX0pvaW5zID0gbmV3IEFycmF5KCk7XG4gICAgdGhpcy5tX0dob3N0Sm9pbnMgPSBuZXcgQXJyYXkoKTtcbiAgICB0aGlzLlJldmVyc2VTb2x1dGlvbiA9ICgxICYgSW5pdE9wdGlvbnMpICE9PSAwO1xuICAgIHRoaXMuU3RyaWN0bHlTaW1wbGUgPSAoMiAmIEluaXRPcHRpb25zKSAhPT0gMDtcbiAgICB0aGlzLlByZXNlcnZlQ29sbGluZWFyID0gKDQgJiBJbml0T3B0aW9ucykgIT09IDA7XG4gICAgaWYgKHVzZV94eXopXG4gICAge1xuICAgICAgdGhpcy5aRmlsbEZ1bmN0aW9uID0gbnVsbDsgLy8gZnVuY3Rpb24gKEludFBvaW50IHZlcnQxLCBJbnRQb2ludCB2ZXJ0MiwgcmVmIEludFBvaW50IGludGVyc2VjdFB0KTtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5pb1JldmVyc2VTb2x1dGlvbiA9IDE7XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5pb1N0cmljdGx5U2ltcGxlID0gMjtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLmlvUHJlc2VydmVDb2xsaW5lYXIgPSA0O1xuXG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuQ2xlYXIgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgaWYgKHRoaXMubV9lZGdlcy5sZW5ndGggPT09IDApXG4gICAgICByZXR1cm47XG4gICAgLy9hdm9pZHMgcHJvYmxlbXMgd2l0aCBDbGlwcGVyQmFzZSBkZXN0cnVjdG9yXG4gICAgdGhpcy5EaXNwb3NlQWxsUG9seVB0cygpO1xuICAgIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLkNsZWFyLmNhbGwodGhpcyk7XG4gIH07XG5cbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5EaXNwb3NlU2NhbmJlYW1MaXN0ID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHdoaWxlICh0aGlzLm1fU2NhbmJlYW0gIT09IG51bGwpXG4gICAge1xuICAgICAgdmFyIHNiMiA9IHRoaXMubV9TY2FuYmVhbS5OZXh0O1xuICAgICAgdGhpcy5tX1NjYW5iZWFtID0gbnVsbDtcbiAgICAgIHRoaXMubV9TY2FuYmVhbSA9IHNiMjtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuUmVzZXQgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuUmVzZXQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLm1fU2NhbmJlYW0gPSBudWxsO1xuICAgIHRoaXMubV9BY3RpdmVFZGdlcyA9IG51bGw7XG4gICAgdGhpcy5tX1NvcnRlZEVkZ2VzID0gbnVsbDtcblxuICAgIHZhciBsbSA9IHRoaXMubV9NaW5pbWFMaXN0O1xuICAgIHdoaWxlIChsbSAhPT0gbnVsbClcbiAgICB7XG4gICAgICB0aGlzLkluc2VydFNjYW5iZWFtKGxtLlkpO1xuICAgICAgbG0gPSBsbS5OZXh0O1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5JbnNlcnRTY2FuYmVhbSA9IGZ1bmN0aW9uIChZKVxuICB7XG4gICAgaWYgKHRoaXMubV9TY2FuYmVhbSA9PT0gbnVsbClcbiAgICB7XG4gICAgICB0aGlzLm1fU2NhbmJlYW0gPSBuZXcgQ2xpcHBlckxpYi5TY2FuYmVhbSgpO1xuICAgICAgdGhpcy5tX1NjYW5iZWFtLk5leHQgPSBudWxsO1xuICAgICAgdGhpcy5tX1NjYW5iZWFtLlkgPSBZO1xuICAgIH1cbiAgICBlbHNlIGlmIChZID4gdGhpcy5tX1NjYW5iZWFtLlkpXG4gICAge1xuICAgICAgdmFyIG5ld1NiID0gbmV3IENsaXBwZXJMaWIuU2NhbmJlYW0oKTtcbiAgICAgIG5ld1NiLlkgPSBZO1xuICAgICAgbmV3U2IuTmV4dCA9IHRoaXMubV9TY2FuYmVhbTtcbiAgICAgIHRoaXMubV9TY2FuYmVhbSA9IG5ld1NiO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgdmFyIHNiMiA9IHRoaXMubV9TY2FuYmVhbTtcbiAgICAgIHdoaWxlIChzYjIuTmV4dCAhPT0gbnVsbCAmJiAoWSA8PSBzYjIuTmV4dC5ZKSlcbiAgICAgICAgc2IyID0gc2IyLk5leHQ7XG4gICAgICBpZiAoWSA9PSBzYjIuWSlcbiAgICAgICAgcmV0dXJuO1xuICAgICAgLy9pZSBpZ25vcmVzIGR1cGxpY2F0ZXNcbiAgICAgIHZhciBuZXdTYiA9IG5ldyBDbGlwcGVyTGliLlNjYW5iZWFtKCk7XG4gICAgICBuZXdTYi5ZID0gWTtcbiAgICAgIG5ld1NiLk5leHQgPSBzYjIuTmV4dDtcbiAgICAgIHNiMi5OZXh0ID0gbmV3U2I7XG4gICAgfVxuICB9O1xuICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5FeGVjdXRlID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHZhciBhID0gYXJndW1lbnRzLFxuICAgICAgYWxlbiA9IGEubGVuZ3RoLFxuICAgICAgaXNwb2x5dHJlZSA9IGFbMV0gaW5zdGFuY2VvZiBDbGlwcGVyTGliLlBvbHlUcmVlO1xuICAgIGlmIChhbGVuID09IDQgJiYgIWlzcG9seXRyZWUpIC8vIGZ1bmN0aW9uIChjbGlwVHlwZSwgc29sdXRpb24sIHN1YmpGaWxsVHlwZSwgY2xpcEZpbGxUeXBlKVxuICAgIHtcbiAgICAgIHZhciBjbGlwVHlwZSA9IGFbMF0sXG4gICAgICAgIHNvbHV0aW9uID0gYVsxXSxcbiAgICAgICAgc3ViakZpbGxUeXBlID0gYVsyXSxcbiAgICAgICAgY2xpcEZpbGxUeXBlID0gYVszXTtcbiAgICAgIGlmICh0aGlzLm1fRXhlY3V0ZUxvY2tlZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKHRoaXMubV9IYXNPcGVuUGF0aHMpXG4gICAgICAgIENsaXBwZXJMaWIuRXJyb3IoXCJFcnJvcjogUG9seVRyZWUgc3RydWN0IGlzIG5lZWQgZm9yIG9wZW4gcGF0aCBjbGlwcGluZy5cIik7XG4gICAgICB0aGlzLm1fRXhlY3V0ZUxvY2tlZCA9IHRydWU7XG4gICAgICBDbGlwcGVyTGliLkNsZWFyKHNvbHV0aW9uKTtcbiAgICAgIHRoaXMubV9TdWJqRmlsbFR5cGUgPSBzdWJqRmlsbFR5cGU7XG4gICAgICB0aGlzLm1fQ2xpcEZpbGxUeXBlID0gY2xpcEZpbGxUeXBlO1xuICAgICAgdGhpcy5tX0NsaXBUeXBlID0gY2xpcFR5cGU7XG4gICAgICB0aGlzLm1fVXNpbmdQb2x5VHJlZSA9IGZhbHNlO1xuICAgICAgdHJ5XG4gICAgICB7XG4gICAgICAgIHZhciBzdWNjZWVkZWQgPSB0aGlzLkV4ZWN1dGVJbnRlcm5hbCgpO1xuICAgICAgICAvL2J1aWxkIHRoZSByZXR1cm4gcG9seWdvbnMgLi4uXG4gICAgICAgIGlmIChzdWNjZWVkZWQpIHRoaXMuQnVpbGRSZXN1bHQoc29sdXRpb24pO1xuICAgICAgfVxuICAgICAgZmluYWxseVxuICAgICAge1xuICAgICAgICB0aGlzLkRpc3Bvc2VBbGxQb2x5UHRzKCk7XG4gICAgICAgIHRoaXMubV9FeGVjdXRlTG9ja2VkID0gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3VjY2VlZGVkO1xuICAgIH1cbiAgICBlbHNlIGlmIChhbGVuID09IDQgJiYgaXNwb2x5dHJlZSkgLy8gZnVuY3Rpb24gKGNsaXBUeXBlLCBwb2x5dHJlZSwgc3ViakZpbGxUeXBlLCBjbGlwRmlsbFR5cGUpXG4gICAge1xuICAgICAgdmFyIGNsaXBUeXBlID0gYVswXSxcbiAgICAgICAgcG9seXRyZWUgPSBhWzFdLFxuICAgICAgICBzdWJqRmlsbFR5cGUgPSBhWzJdLFxuICAgICAgICBjbGlwRmlsbFR5cGUgPSBhWzNdO1xuICAgICAgaWYgKHRoaXMubV9FeGVjdXRlTG9ja2VkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB0aGlzLm1fRXhlY3V0ZUxvY2tlZCA9IHRydWU7XG4gICAgICB0aGlzLm1fU3ViakZpbGxUeXBlID0gc3ViakZpbGxUeXBlO1xuICAgICAgdGhpcy5tX0NsaXBGaWxsVHlwZSA9IGNsaXBGaWxsVHlwZTtcbiAgICAgIHRoaXMubV9DbGlwVHlwZSA9IGNsaXBUeXBlO1xuICAgICAgdGhpcy5tX1VzaW5nUG9seVRyZWUgPSB0cnVlO1xuICAgICAgdHJ5XG4gICAgICB7XG4gICAgICAgIHZhciBzdWNjZWVkZWQgPSB0aGlzLkV4ZWN1dGVJbnRlcm5hbCgpO1xuICAgICAgICAvL2J1aWxkIHRoZSByZXR1cm4gcG9seWdvbnMgLi4uXG4gICAgICAgIGlmIChzdWNjZWVkZWQpIHRoaXMuQnVpbGRSZXN1bHQyKHBvbHl0cmVlKTtcbiAgICAgIH1cbiAgICAgIGZpbmFsbHlcbiAgICAgIHtcbiAgICAgICAgdGhpcy5EaXNwb3NlQWxsUG9seVB0cygpO1xuICAgICAgICB0aGlzLm1fRXhlY3V0ZUxvY2tlZCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN1Y2NlZWRlZDtcbiAgICB9XG4gICAgZWxzZSBpZiAoYWxlbiA9PSAyICYmICFpc3BvbHl0cmVlKSAvLyBmdW5jdGlvbiAoY2xpcFR5cGUsIHNvbHV0aW9uKVxuICAgIHtcbiAgICAgIHZhciBjbGlwVHlwZSA9IGFbMF0sXG4gICAgICAgIHNvbHV0aW9uID0gYVsxXTtcbiAgICAgIHJldHVybiB0aGlzLkV4ZWN1dGUoY2xpcFR5cGUsIHNvbHV0aW9uLCBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRFdmVuT2RkLCBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRFdmVuT2RkKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoYWxlbiA9PSAyICYmIGlzcG9seXRyZWUpIC8vIGZ1bmN0aW9uIChjbGlwVHlwZSwgcG9seXRyZWUpXG4gICAge1xuICAgICAgdmFyIGNsaXBUeXBlID0gYVswXSxcbiAgICAgICAgcG9seXRyZWUgPSBhWzFdO1xuICAgICAgcmV0dXJuIHRoaXMuRXhlY3V0ZShjbGlwVHlwZSwgcG9seXRyZWUsIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdEV2ZW5PZGQsIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdEV2ZW5PZGQpO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5GaXhIb2xlTGlua2FnZSA9IGZ1bmN0aW9uIChvdXRSZWMpXG4gIHtcbiAgICAvL3NraXAgaWYgYW4gb3V0ZXJtb3N0IHBvbHlnb24gb3JcbiAgICAvL2FscmVhZHkgYWxyZWFkeSBwb2ludHMgdG8gdGhlIGNvcnJlY3QgRmlyc3RMZWZ0IC4uLlxuICAgIGlmIChvdXRSZWMuRmlyc3RMZWZ0ID09PSBudWxsIHx8IChvdXRSZWMuSXNIb2xlICE9IG91dFJlYy5GaXJzdExlZnQuSXNIb2xlICYmIG91dFJlYy5GaXJzdExlZnQuUHRzICE9PSBudWxsKSlcbiAgICAgIHJldHVybjtcbiAgICB2YXIgb3JmbCA9IG91dFJlYy5GaXJzdExlZnQ7XG4gICAgd2hpbGUgKG9yZmwgIT09IG51bGwgJiYgKChvcmZsLklzSG9sZSA9PSBvdXRSZWMuSXNIb2xlKSB8fCBvcmZsLlB0cyA9PT0gbnVsbCkpXG4gICAgICBvcmZsID0gb3JmbC5GaXJzdExlZnQ7XG4gICAgb3V0UmVjLkZpcnN0TGVmdCA9IG9yZmw7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRXhlY3V0ZUludGVybmFsID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHRyeVxuICAgIHtcbiAgICAgIHRoaXMuUmVzZXQoKTtcbiAgICAgIGlmICh0aGlzLm1fQ3VycmVudExNID09PSBudWxsKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB2YXIgYm90WSA9IHRoaXMuUG9wU2NhbmJlYW0oKTtcbiAgICAgIGRvIHtcbiAgICAgICAgdGhpcy5JbnNlcnRMb2NhbE1pbmltYUludG9BRUwoYm90WSk7XG4gICAgICAgIENsaXBwZXJMaWIuQ2xlYXIodGhpcy5tX0dob3N0Sm9pbnMpO1xuICAgICAgICB0aGlzLlByb2Nlc3NIb3Jpem9udGFscyhmYWxzZSk7XG4gICAgICAgIGlmICh0aGlzLm1fU2NhbmJlYW0gPT09IG51bGwpXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIHZhciB0b3BZID0gdGhpcy5Qb3BTY2FuYmVhbSgpO1xuICAgICAgICBpZiAoIXRoaXMuUHJvY2Vzc0ludGVyc2VjdGlvbnModG9wWSkpIHJldHVybiBmYWxzZTtcblxuICAgICAgICB0aGlzLlByb2Nlc3NFZGdlc0F0VG9wT2ZTY2FuYmVhbSh0b3BZKTtcbiAgICAgICAgYm90WSA9IHRvcFk7XG4gICAgICB9XG4gICAgICB3aGlsZSAodGhpcy5tX1NjYW5iZWFtICE9PSBudWxsIHx8IHRoaXMubV9DdXJyZW50TE0gIT09IG51bGwpXG4gICAgICAvL2ZpeCBvcmllbnRhdGlvbnMgLi4uXG4gICAgICBmb3IgKHZhciBpID0gMCwgaWxlbiA9IHRoaXMubV9Qb2x5T3V0cy5sZW5ndGg7IGkgPCBpbGVuOyBpKyspXG4gICAgICB7XG4gICAgICAgIHZhciBvdXRSZWMgPSB0aGlzLm1fUG9seU91dHNbaV07XG4gICAgICAgIGlmIChvdXRSZWMuUHRzID09PSBudWxsIHx8IG91dFJlYy5Jc09wZW4pXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIGlmICgob3V0UmVjLklzSG9sZSBeIHRoaXMuUmV2ZXJzZVNvbHV0aW9uKSA9PSAodGhpcy5BcmVhKG91dFJlYykgPiAwKSlcbiAgICAgICAgICB0aGlzLlJldmVyc2VQb2x5UHRMaW5rcyhvdXRSZWMuUHRzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuSm9pbkNvbW1vbkVkZ2VzKCk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgaWxlbiA9IHRoaXMubV9Qb2x5T3V0cy5sZW5ndGg7IGkgPCBpbGVuOyBpKyspXG4gICAgICB7XG4gICAgICAgIHZhciBvdXRSZWMgPSB0aGlzLm1fUG9seU91dHNbaV07XG4gICAgICAgIGlmIChvdXRSZWMuUHRzICE9PSBudWxsICYmICFvdXRSZWMuSXNPcGVuKVxuICAgICAgICAgIHRoaXMuRml4dXBPdXRQb2x5Z29uKG91dFJlYyk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5TdHJpY3RseVNpbXBsZSlcbiAgICAgICAgdGhpcy5Eb1NpbXBsZVBvbHlnb25zKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZmluYWxseVxuICAgIHtcbiAgICAgIENsaXBwZXJMaWIuQ2xlYXIodGhpcy5tX0pvaW5zKTtcbiAgICAgIENsaXBwZXJMaWIuQ2xlYXIodGhpcy5tX0dob3N0Sm9pbnMpO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Qb3BTY2FuYmVhbSA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB2YXIgWSA9IHRoaXMubV9TY2FuYmVhbS5ZO1xuICAgIHRoaXMubV9TY2FuYmVhbSA9IHRoaXMubV9TY2FuYmVhbS5OZXh0O1xuICAgIHJldHVybiBZO1xuICB9O1xuXG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRGlzcG9zZUFsbFBvbHlQdHMgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlsZW4gPSB0aGlzLm1fUG9seU91dHMubGVuZ3RoOyBpIDwgaWxlbjsgKytpKVxuICAgICAgdGhpcy5EaXNwb3NlT3V0UmVjKGkpO1xuICAgIENsaXBwZXJMaWIuQ2xlYXIodGhpcy5tX1BvbHlPdXRzKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5EaXNwb3NlT3V0UmVjID0gZnVuY3Rpb24gKGluZGV4KVxuICB7XG4gICAgdmFyIG91dFJlYyA9IHRoaXMubV9Qb2x5T3V0c1tpbmRleF07XG4gICAgb3V0UmVjLlB0cyA9IG51bGw7XG4gICAgb3V0UmVjID0gbnVsbDtcbiAgICB0aGlzLm1fUG9seU91dHNbaW5kZXhdID0gbnVsbDtcbiAgfTtcblxuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkFkZEpvaW4gPSBmdW5jdGlvbiAoT3AxLCBPcDIsIE9mZlB0KVxuICB7XG4gICAgdmFyIGogPSBuZXcgQ2xpcHBlckxpYi5Kb2luKCk7XG4gICAgai5PdXRQdDEgPSBPcDE7XG4gICAgai5PdXRQdDIgPSBPcDI7XG4gICAgLy9qLk9mZlB0ID0gT2ZmUHQ7XG4gICAgai5PZmZQdC5YID0gT2ZmUHQuWDtcbiAgICBqLk9mZlB0LlkgPSBPZmZQdC5ZO1xuICAgIHRoaXMubV9Kb2lucy5wdXNoKGopO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkFkZEdob3N0Sm9pbiA9IGZ1bmN0aW9uIChPcCwgT2ZmUHQpXG4gIHtcbiAgICB2YXIgaiA9IG5ldyBDbGlwcGVyTGliLkpvaW4oKTtcbiAgICBqLk91dFB0MSA9IE9wO1xuICAgIC8vai5PZmZQdCA9IE9mZlB0O1xuICAgIGouT2ZmUHQuWCA9IE9mZlB0Llg7XG4gICAgai5PZmZQdC5ZID0gT2ZmUHQuWTtcbiAgICB0aGlzLm1fR2hvc3RKb2lucy5wdXNoKGopO1xuICB9O1xuICBpZiAodXNlX3h5eilcbiAge1xuICAgIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuU2V0WiA9IGZ1bmN0aW9uIChwdCwgZTEsIGUyKVxuICAgIHtcbiAgICAgIGlmICh0aGlzLlpGaWxsRnVuY3Rpb24gIT09IG51bGwpXG4gICAgICB7XG4gICAgICAgIGlmIChwdC5aICE9IDAgfHwgdGhpcy5aRmlsbEZ1bmN0aW9uID09PSBudWxsKSByZXR1cm47XG4gICAgICAgIGVsc2UgaWYgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocHQsIGUxLkJvdCkpIHB0LlogPSBlMS5Cb3QuWjtcbiAgICAgICAgZWxzZSBpZiAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwdCwgZTEuVG9wKSkgcHQuWiA9IGUxLlRvcC5aO1xuICAgICAgICBlbHNlIGlmIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHB0LCBlMi5Cb3QpKSBwdC5aID0gZTIuQm90Llo7XG4gICAgICAgIGVsc2UgaWYgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocHQsIGUyLlRvcCkpIHB0LlogPSBlMi5Ub3AuWjtcbiAgICAgICAgZWxzZSBaRmlsbEZ1bmN0aW9uKGUxLkJvdCwgZTEuVG9wLCBlMi5Cb3QsIGUyLlRvcCwgcHQpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB9XG5cbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5JbnNlcnRMb2NhbE1pbmltYUludG9BRUwgPSBmdW5jdGlvbiAoYm90WSlcbiAge1xuICAgIHdoaWxlICh0aGlzLm1fQ3VycmVudExNICE9PSBudWxsICYmICh0aGlzLm1fQ3VycmVudExNLlkgPT0gYm90WSkpXG4gICAge1xuICAgICAgdmFyIGxiID0gdGhpcy5tX0N1cnJlbnRMTS5MZWZ0Qm91bmQ7XG4gICAgICB2YXIgcmIgPSB0aGlzLm1fQ3VycmVudExNLlJpZ2h0Qm91bmQ7XG4gICAgICB0aGlzLlBvcExvY2FsTWluaW1hKCk7XG4gICAgICB2YXIgT3AxID0gbnVsbDtcbiAgICAgIGlmIChsYiA9PT0gbnVsbClcbiAgICAgIHtcbiAgICAgICAgdGhpcy5JbnNlcnRFZGdlSW50b0FFTChyYiwgbnVsbCk7XG4gICAgICAgIHRoaXMuU2V0V2luZGluZ0NvdW50KHJiKTtcbiAgICAgICAgaWYgKHRoaXMuSXNDb250cmlidXRpbmcocmIpKVxuICAgICAgICAgIE9wMSA9IHRoaXMuQWRkT3V0UHQocmIsIHJiLkJvdCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChyYiA9PSBudWxsKVxuICAgICAge1xuICAgICAgICB0aGlzLkluc2VydEVkZ2VJbnRvQUVMKGxiLCBudWxsKTtcbiAgICAgICAgdGhpcy5TZXRXaW5kaW5nQ291bnQobGIpO1xuICAgICAgICBpZiAodGhpcy5Jc0NvbnRyaWJ1dGluZyhsYikpXG4gICAgICAgICAgT3AxID0gdGhpcy5BZGRPdXRQdChsYiwgbGIuQm90KTtcbiAgICAgICAgdGhpcy5JbnNlcnRTY2FuYmVhbShsYi5Ub3AuWSk7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIHRoaXMuSW5zZXJ0RWRnZUludG9BRUwobGIsIG51bGwpO1xuICAgICAgICB0aGlzLkluc2VydEVkZ2VJbnRvQUVMKHJiLCBsYik7XG4gICAgICAgIHRoaXMuU2V0V2luZGluZ0NvdW50KGxiKTtcbiAgICAgICAgcmIuV2luZENudCA9IGxiLldpbmRDbnQ7XG4gICAgICAgIHJiLldpbmRDbnQyID0gbGIuV2luZENudDI7XG4gICAgICAgIGlmICh0aGlzLklzQ29udHJpYnV0aW5nKGxiKSlcbiAgICAgICAgICBPcDEgPSB0aGlzLkFkZExvY2FsTWluUG9seShsYiwgcmIsIGxiLkJvdCk7XG4gICAgICAgIHRoaXMuSW5zZXJ0U2NhbmJlYW0obGIuVG9wLlkpO1xuICAgICAgfVxuICAgICAgaWYgKHJiICE9IG51bGwpXG4gICAgICB7XG4gICAgICAgIGlmIChDbGlwcGVyTGliLkNsaXBwZXJCYXNlLklzSG9yaXpvbnRhbChyYikpXG4gICAgICAgICAgdGhpcy5BZGRFZGdlVG9TRUwocmIpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgdGhpcy5JbnNlcnRTY2FuYmVhbShyYi5Ub3AuWSk7XG4gICAgICB9XG4gICAgICBpZiAobGIgPT0gbnVsbCB8fCByYiA9PSBudWxsKSBjb250aW51ZTtcbiAgICAgIC8vaWYgb3V0cHV0IHBvbHlnb25zIHNoYXJlIGFuIEVkZ2Ugd2l0aCBhIGhvcml6b250YWwgcmIsIHRoZXknbGwgbmVlZCBqb2luaW5nIGxhdGVyIC4uLlxuICAgICAgaWYgKE9wMSAhPT0gbnVsbCAmJiBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLklzSG9yaXpvbnRhbChyYikgJiYgdGhpcy5tX0dob3N0Sm9pbnMubGVuZ3RoID4gMCAmJiByYi5XaW5kRGVsdGEgIT09IDApXG4gICAgICB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpbGVuID0gdGhpcy5tX0dob3N0Sm9pbnMubGVuZ3RoOyBpIDwgaWxlbjsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgLy9pZiB0aGUgaG9yaXpvbnRhbCBSYiBhbmQgYSAnZ2hvc3QnIGhvcml6b250YWwgb3ZlcmxhcCwgdGhlbiBjb252ZXJ0XG4gICAgICAgICAgLy90aGUgJ2dob3N0JyBqb2luIHRvIGEgcmVhbCBqb2luIHJlYWR5IGZvciBsYXRlciAuLi5cbiAgICAgICAgICB2YXIgaiA9IHRoaXMubV9HaG9zdEpvaW5zW2ldO1xuXG5cdFx0XHRcdFx0aWYgKHRoaXMuSG9yelNlZ21lbnRzT3ZlcmxhcChqLk91dFB0MS5QdC5YLCBqLk9mZlB0LlgsIHJiLkJvdC5YLCByYi5Ub3AuWCkpXG4gICAgICAgICAgICB0aGlzLkFkZEpvaW4oai5PdXRQdDEsIE9wMSwgai5PZmZQdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChsYi5PdXRJZHggPj0gMCAmJiBsYi5QcmV2SW5BRUwgIT09IG51bGwgJiZcbiAgICAgICAgbGIuUHJldkluQUVMLkN1cnIuWCA9PSBsYi5Cb3QuWCAmJlxuICAgICAgICBsYi5QcmV2SW5BRUwuT3V0SWR4ID49IDAgJiZcbiAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5TbG9wZXNFcXVhbChsYi5QcmV2SW5BRUwsIGxiLCB0aGlzLm1fVXNlRnVsbFJhbmdlKSAmJlxuICAgICAgICBsYi5XaW5kRGVsdGEgIT09IDAgJiYgbGIuUHJldkluQUVMLldpbmREZWx0YSAhPT0gMClcbiAgICAgIHtcbiAgICAgICAgdmFyIE9wMiA9IHRoaXMuQWRkT3V0UHQobGIuUHJldkluQUVMLCBsYi5Cb3QpO1xuICAgICAgICB0aGlzLkFkZEpvaW4oT3AxLCBPcDIsIGxiLlRvcCk7XG4gICAgICB9XG4gICAgICBpZiAobGIuTmV4dEluQUVMICE9IHJiKVxuICAgICAge1xuICAgICAgICBpZiAocmIuT3V0SWR4ID49IDAgJiYgcmIuUHJldkluQUVMLk91dElkeCA+PSAwICYmXG4gICAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5TbG9wZXNFcXVhbChyYi5QcmV2SW5BRUwsIHJiLCB0aGlzLm1fVXNlRnVsbFJhbmdlKSAmJlxuICAgICAgICAgIHJiLldpbmREZWx0YSAhPT0gMCAmJiByYi5QcmV2SW5BRUwuV2luZERlbHRhICE9PSAwKVxuICAgICAgICB7XG4gICAgICAgICAgdmFyIE9wMiA9IHRoaXMuQWRkT3V0UHQocmIuUHJldkluQUVMLCByYi5Cb3QpO1xuICAgICAgICAgIHRoaXMuQWRkSm9pbihPcDEsIE9wMiwgcmIuVG9wKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZSA9IGxiLk5leHRJbkFFTDtcbiAgICAgICAgaWYgKGUgIT09IG51bGwpXG4gICAgICAgICAgd2hpbGUgKGUgIT0gcmIpXG4gICAgICAgICAge1xuICAgICAgICAgICAgLy9uYjogRm9yIGNhbGN1bGF0aW5nIHdpbmRpbmcgY291bnRzIGV0YywgSW50ZXJzZWN0RWRnZXMoKSBhc3N1bWVzXG4gICAgICAgICAgICAvL3RoYXQgcGFyYW0xIHdpbGwgYmUgdG8gdGhlIHJpZ2h0IG9mIHBhcmFtMiBBQk9WRSB0aGUgaW50ZXJzZWN0aW9uIC4uLlxuICAgICAgICAgICAgdGhpcy5JbnRlcnNlY3RFZGdlcyhyYiwgZSwgbGIuQ3VyciwgZmFsc2UpO1xuICAgICAgICAgICAgLy9vcmRlciBpbXBvcnRhbnQgaGVyZVxuICAgICAgICAgICAgZSA9IGUuTmV4dEluQUVMO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuSW5zZXJ0RWRnZUludG9BRUwgPSBmdW5jdGlvbiAoZWRnZSwgc3RhcnRFZGdlKVxuICB7XG4gICAgaWYgKHRoaXMubV9BY3RpdmVFZGdlcyA9PT0gbnVsbClcbiAgICB7XG4gICAgICBlZGdlLlByZXZJbkFFTCA9IG51bGw7XG4gICAgICBlZGdlLk5leHRJbkFFTCA9IG51bGw7XG4gICAgICB0aGlzLm1fQWN0aXZlRWRnZXMgPSBlZGdlO1xuICAgIH1cbiAgICBlbHNlIGlmIChzdGFydEVkZ2UgPT09IG51bGwgJiYgdGhpcy5FMkluc2VydHNCZWZvcmVFMSh0aGlzLm1fQWN0aXZlRWRnZXMsIGVkZ2UpKVxuICAgIHtcbiAgICAgIGVkZ2UuUHJldkluQUVMID0gbnVsbDtcbiAgICAgIGVkZ2UuTmV4dEluQUVMID0gdGhpcy5tX0FjdGl2ZUVkZ2VzO1xuICAgICAgdGhpcy5tX0FjdGl2ZUVkZ2VzLlByZXZJbkFFTCA9IGVkZ2U7XG4gICAgICB0aGlzLm1fQWN0aXZlRWRnZXMgPSBlZGdlO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgaWYgKHN0YXJ0RWRnZSA9PT0gbnVsbClcbiAgICAgICAgc3RhcnRFZGdlID0gdGhpcy5tX0FjdGl2ZUVkZ2VzO1xuICAgICAgd2hpbGUgKHN0YXJ0RWRnZS5OZXh0SW5BRUwgIT09IG51bGwgJiYgIXRoaXMuRTJJbnNlcnRzQmVmb3JlRTEoc3RhcnRFZGdlLk5leHRJbkFFTCwgZWRnZSkpXG4gICAgICAgIHN0YXJ0RWRnZSA9IHN0YXJ0RWRnZS5OZXh0SW5BRUw7XG4gICAgICBlZGdlLk5leHRJbkFFTCA9IHN0YXJ0RWRnZS5OZXh0SW5BRUw7XG4gICAgICBpZiAoc3RhcnRFZGdlLk5leHRJbkFFTCAhPT0gbnVsbClcbiAgICAgICAgc3RhcnRFZGdlLk5leHRJbkFFTC5QcmV2SW5BRUwgPSBlZGdlO1xuICAgICAgZWRnZS5QcmV2SW5BRUwgPSBzdGFydEVkZ2U7XG4gICAgICBzdGFydEVkZ2UuTmV4dEluQUVMID0gZWRnZTtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRTJJbnNlcnRzQmVmb3JlRTEgPSBmdW5jdGlvbiAoZTEsIGUyKVxuICB7XG4gICAgaWYgKGUyLkN1cnIuWCA9PSBlMS5DdXJyLlgpXG4gICAge1xuICAgICAgaWYgKGUyLlRvcC5ZID4gZTEuVG9wLlkpXG4gICAgICAgIHJldHVybiBlMi5Ub3AuWCA8IENsaXBwZXJMaWIuQ2xpcHBlci5Ub3BYKGUxLCBlMi5Ub3AuWSk7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBlMS5Ub3AuWCA+IENsaXBwZXJMaWIuQ2xpcHBlci5Ub3BYKGUyLCBlMS5Ub3AuWSk7XG4gICAgfVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBlMi5DdXJyLlggPCBlMS5DdXJyLlg7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuSXNFdmVuT2RkRmlsbFR5cGUgPSBmdW5jdGlvbiAoZWRnZSlcbiAge1xuICAgIGlmIChlZGdlLlBvbHlUeXAgPT0gQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdFN1YmplY3QpXG4gICAgICByZXR1cm4gdGhpcy5tX1N1YmpGaWxsVHlwZSA9PSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRFdmVuT2RkO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiB0aGlzLm1fQ2xpcEZpbGxUeXBlID09IENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdEV2ZW5PZGQ7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuSXNFdmVuT2RkQWx0RmlsbFR5cGUgPSBmdW5jdGlvbiAoZWRnZSlcbiAge1xuICAgIGlmIChlZGdlLlBvbHlUeXAgPT0gQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdFN1YmplY3QpXG4gICAgICByZXR1cm4gdGhpcy5tX0NsaXBGaWxsVHlwZSA9PSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRFdmVuT2RkO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiB0aGlzLm1fU3ViakZpbGxUeXBlID09IENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdEV2ZW5PZGQ7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuSXNDb250cmlidXRpbmcgPSBmdW5jdGlvbiAoZWRnZSlcbiAge1xuICAgIHZhciBwZnQsIHBmdDI7XG4gICAgaWYgKGVkZ2UuUG9seVR5cCA9PSBDbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdClcbiAgICB7XG4gICAgICBwZnQgPSB0aGlzLm1fU3ViakZpbGxUeXBlO1xuICAgICAgcGZ0MiA9IHRoaXMubV9DbGlwRmlsbFR5cGU7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBwZnQgPSB0aGlzLm1fQ2xpcEZpbGxUeXBlO1xuICAgICAgcGZ0MiA9IHRoaXMubV9TdWJqRmlsbFR5cGU7XG4gICAgfVxuICAgIHN3aXRjaCAocGZ0KVxuICAgIHtcbiAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdEV2ZW5PZGQ6XG4gICAgICBpZiAoZWRnZS5XaW5kRGVsdGEgPT09IDAgJiYgZWRnZS5XaW5kQ250ICE9IDEpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybzpcbiAgICAgIGlmIChNYXRoLmFicyhlZGdlLldpbmRDbnQpICE9IDEpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0UG9zaXRpdmU6XG4gICAgICBpZiAoZWRnZS5XaW5kQ250ICE9IDEpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBpZiAoZWRnZS5XaW5kQ250ICE9IC0xKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgc3dpdGNoICh0aGlzLm1fQ2xpcFR5cGUpXG4gICAge1xuICAgIGNhc2UgQ2xpcHBlckxpYi5DbGlwVHlwZS5jdEludGVyc2VjdGlvbjpcbiAgICAgIHN3aXRjaCAocGZ0MilcbiAgICAgIHtcbiAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0RXZlbk9kZDpcbiAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybzpcbiAgICAgICAgcmV0dXJuIChlZGdlLldpbmRDbnQyICE9PSAwKTtcbiAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0UG9zaXRpdmU6XG4gICAgICAgIHJldHVybiAoZWRnZS5XaW5kQ250MiA+IDApO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIChlZGdlLldpbmRDbnQyIDwgMCk7XG4gICAgICB9XG4gICAgY2FzZSBDbGlwcGVyTGliLkNsaXBUeXBlLmN0VW5pb246XG4gICAgICBzd2l0Y2ggKHBmdDIpXG4gICAgICB7XG4gICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdEV2ZW5PZGQ6XG4gICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm86XG4gICAgICAgIHJldHVybiAoZWRnZS5XaW5kQ250MiA9PT0gMCk7XG4gICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdFBvc2l0aXZlOlxuICAgICAgICByZXR1cm4gKGVkZ2UuV2luZENudDIgPD0gMCk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gKGVkZ2UuV2luZENudDIgPj0gMCk7XG4gICAgICB9XG4gICAgY2FzZSBDbGlwcGVyTGliLkNsaXBUeXBlLmN0RGlmZmVyZW5jZTpcbiAgICAgIGlmIChlZGdlLlBvbHlUeXAgPT0gQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdFN1YmplY3QpXG4gICAgICAgIHN3aXRjaCAocGZ0MilcbiAgICAgICAge1xuICAgICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdEV2ZW5PZGQ6XG4gICAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybzpcbiAgICAgICAgICByZXR1cm4gKGVkZ2UuV2luZENudDIgPT09IDApO1xuICAgICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdFBvc2l0aXZlOlxuICAgICAgICAgIHJldHVybiAoZWRnZS5XaW5kQ250MiA8PSAwKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gKGVkZ2UuV2luZENudDIgPj0gMCk7XG4gICAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgICAgc3dpdGNoIChwZnQyKVxuICAgICAgICB7XG4gICAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0RXZlbk9kZDpcbiAgICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvOlxuICAgICAgICAgIHJldHVybiAoZWRnZS5XaW5kQ250MiAhPT0gMCk7XG4gICAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0UG9zaXRpdmU6XG4gICAgICAgICAgcmV0dXJuIChlZGdlLldpbmRDbnQyID4gMCk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIChlZGdlLldpbmRDbnQyIDwgMCk7XG4gICAgICAgIH1cbiAgICBjYXNlIENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RYb3I6XG4gICAgICBpZiAoZWRnZS5XaW5kRGVsdGEgPT09IDApXG4gICAgICAgIHN3aXRjaCAocGZ0MilcbiAgICAgICAge1xuICAgICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdEV2ZW5PZGQ6XG4gICAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybzpcbiAgICAgICAgICByZXR1cm4gKGVkZ2UuV2luZENudDIgPT09IDApO1xuICAgICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdFBvc2l0aXZlOlxuICAgICAgICAgIHJldHVybiAoZWRnZS5XaW5kQ250MiA8PSAwKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gKGVkZ2UuV2luZENudDIgPj0gMCk7XG4gICAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlNldFdpbmRpbmdDb3VudCA9IGZ1bmN0aW9uIChlZGdlKVxuICB7XG4gICAgdmFyIGUgPSBlZGdlLlByZXZJbkFFTDtcbiAgICAvL2ZpbmQgdGhlIGVkZ2Ugb2YgdGhlIHNhbWUgcG9seXR5cGUgdGhhdCBpbW1lZGlhdGVseSBwcmVjZWVkcyAnZWRnZScgaW4gQUVMXG4gICAgd2hpbGUgKGUgIT09IG51bGwgJiYgKChlLlBvbHlUeXAgIT0gZWRnZS5Qb2x5VHlwKSB8fCAoZS5XaW5kRGVsdGEgPT09IDApKSlcbiAgICAgIGUgPSBlLlByZXZJbkFFTDtcbiAgICBpZiAoZSA9PT0gbnVsbClcbiAgICB7XG4gICAgICBlZGdlLldpbmRDbnQgPSAoZWRnZS5XaW5kRGVsdGEgPT09IDAgPyAxIDogZWRnZS5XaW5kRGVsdGEpO1xuICAgICAgZWRnZS5XaW5kQ250MiA9IDA7XG4gICAgICBlID0gdGhpcy5tX0FjdGl2ZUVkZ2VzO1xuICAgICAgLy9pZSBnZXQgcmVhZHkgdG8gY2FsYyBXaW5kQ250MlxuICAgIH1cbiAgICBlbHNlIGlmIChlZGdlLldpbmREZWx0YSA9PT0gMCAmJiB0aGlzLm1fQ2xpcFR5cGUgIT0gQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFVuaW9uKVxuICAgIHtcbiAgICAgIGVkZ2UuV2luZENudCA9IDE7XG4gICAgICBlZGdlLldpbmRDbnQyID0gZS5XaW5kQ250MjtcbiAgICAgIGUgPSBlLk5leHRJbkFFTDtcbiAgICAgIC8vaWUgZ2V0IHJlYWR5IHRvIGNhbGMgV2luZENudDJcbiAgICB9XG4gICAgZWxzZSBpZiAodGhpcy5Jc0V2ZW5PZGRGaWxsVHlwZShlZGdlKSlcbiAgICB7XG4gICAgICAvL0V2ZW5PZGQgZmlsbGluZyAuLi5cbiAgICAgIGlmIChlZGdlLldpbmREZWx0YSA9PT0gMClcbiAgICAgIHtcbiAgICAgICAgLy9hcmUgd2UgaW5zaWRlIGEgc3ViaiBwb2x5Z29uIC4uLlxuICAgICAgICB2YXIgSW5zaWRlID0gdHJ1ZTtcbiAgICAgICAgdmFyIGUyID0gZS5QcmV2SW5BRUw7XG4gICAgICAgIHdoaWxlIChlMiAhPT0gbnVsbClcbiAgICAgICAge1xuICAgICAgICAgIGlmIChlMi5Qb2x5VHlwID09IGUuUG9seVR5cCAmJiBlMi5XaW5kRGVsdGEgIT09IDApXG4gICAgICAgICAgICBJbnNpZGUgPSAhSW5zaWRlO1xuICAgICAgICAgIGUyID0gZTIuUHJldkluQUVMO1xuICAgICAgICB9XG4gICAgICAgIGVkZ2UuV2luZENudCA9IChJbnNpZGUgPyAwIDogMSk7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIGVkZ2UuV2luZENudCA9IGVkZ2UuV2luZERlbHRhO1xuICAgICAgfVxuICAgICAgZWRnZS5XaW5kQ250MiA9IGUuV2luZENudDI7XG4gICAgICBlID0gZS5OZXh0SW5BRUw7XG4gICAgICAvL2llIGdldCByZWFkeSB0byBjYWxjIFdpbmRDbnQyXG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAvL25vblplcm8sIFBvc2l0aXZlIG9yIE5lZ2F0aXZlIGZpbGxpbmcgLi4uXG4gICAgICBpZiAoZS5XaW5kQ250ICogZS5XaW5kRGVsdGEgPCAwKVxuICAgICAge1xuICAgICAgICAvL3ByZXYgZWRnZSBpcyAnZGVjcmVhc2luZycgV2luZENvdW50IChXQykgdG93YXJkIHplcm9cbiAgICAgICAgLy9zbyB3ZSdyZSBvdXRzaWRlIHRoZSBwcmV2aW91cyBwb2x5Z29uIC4uLlxuICAgICAgICBpZiAoTWF0aC5hYnMoZS5XaW5kQ250KSA+IDEpXG4gICAgICAgIHtcbiAgICAgICAgICAvL291dHNpZGUgcHJldiBwb2x5IGJ1dCBzdGlsbCBpbnNpZGUgYW5vdGhlci5cbiAgICAgICAgICAvL3doZW4gcmV2ZXJzaW5nIGRpcmVjdGlvbiBvZiBwcmV2IHBvbHkgdXNlIHRoZSBzYW1lIFdDXG4gICAgICAgICAgaWYgKGUuV2luZERlbHRhICogZWRnZS5XaW5kRGVsdGEgPCAwKVxuICAgICAgICAgICAgZWRnZS5XaW5kQ250ID0gZS5XaW5kQ250O1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGVkZ2UuV2luZENudCA9IGUuV2luZENudCArIGVkZ2UuV2luZERlbHRhO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBlZGdlLldpbmRDbnQgPSAoZWRnZS5XaW5kRGVsdGEgPT09IDAgPyAxIDogZWRnZS5XaW5kRGVsdGEpO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICAvL3ByZXYgZWRnZSBpcyAnaW5jcmVhc2luZycgV2luZENvdW50IChXQykgYXdheSBmcm9tIHplcm9cbiAgICAgICAgLy9zbyB3ZSdyZSBpbnNpZGUgdGhlIHByZXZpb3VzIHBvbHlnb24gLi4uXG4gICAgICAgIGlmIChlZGdlLldpbmREZWx0YSA9PT0gMClcbiAgICAgICAgICBlZGdlLldpbmRDbnQgPSAoZS5XaW5kQ250IDwgMCA/IGUuV2luZENudCAtIDEgOiBlLldpbmRDbnQgKyAxKTtcbiAgICAgICAgZWxzZSBpZiAoZS5XaW5kRGVsdGEgKiBlZGdlLldpbmREZWx0YSA8IDApXG4gICAgICAgICAgZWRnZS5XaW5kQ250ID0gZS5XaW5kQ250O1xuICAgICAgICBlbHNlXG4gICAgICAgICAgZWRnZS5XaW5kQ250ID0gZS5XaW5kQ250ICsgZWRnZS5XaW5kRGVsdGE7XG4gICAgICB9XG4gICAgICBlZGdlLldpbmRDbnQyID0gZS5XaW5kQ250MjtcbiAgICAgIGUgPSBlLk5leHRJbkFFTDtcbiAgICAgIC8vaWUgZ2V0IHJlYWR5IHRvIGNhbGMgV2luZENudDJcbiAgICB9XG4gICAgLy91cGRhdGUgV2luZENudDIgLi4uXG4gICAgaWYgKHRoaXMuSXNFdmVuT2RkQWx0RmlsbFR5cGUoZWRnZSkpXG4gICAge1xuICAgICAgLy9FdmVuT2RkIGZpbGxpbmcgLi4uXG4gICAgICB3aGlsZSAoZSAhPSBlZGdlKVxuICAgICAge1xuICAgICAgICBpZiAoZS5XaW5kRGVsdGEgIT09IDApXG4gICAgICAgICAgZWRnZS5XaW5kQ250MiA9IChlZGdlLldpbmRDbnQyID09PSAwID8gMSA6IDApO1xuICAgICAgICBlID0gZS5OZXh0SW5BRUw7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAvL25vblplcm8sIFBvc2l0aXZlIG9yIE5lZ2F0aXZlIGZpbGxpbmcgLi4uXG4gICAgICB3aGlsZSAoZSAhPSBlZGdlKVxuICAgICAge1xuICAgICAgICBlZGdlLldpbmRDbnQyICs9IGUuV2luZERlbHRhO1xuICAgICAgICBlID0gZS5OZXh0SW5BRUw7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkFkZEVkZ2VUb1NFTCA9IGZ1bmN0aW9uIChlZGdlKVxuICB7XG4gICAgLy9TRUwgcG9pbnRlcnMgaW4gUEVkZ2UgYXJlIHJldXNlZCB0byBidWlsZCBhIGxpc3Qgb2YgaG9yaXpvbnRhbCBlZGdlcy5cbiAgICAvL0hvd2V2ZXIsIHdlIGRvbid0IG5lZWQgdG8gd29ycnkgYWJvdXQgb3JkZXIgd2l0aCBob3Jpem9udGFsIGVkZ2UgcHJvY2Vzc2luZy5cbiAgICBpZiAodGhpcy5tX1NvcnRlZEVkZ2VzID09PSBudWxsKVxuICAgIHtcbiAgICAgIHRoaXMubV9Tb3J0ZWRFZGdlcyA9IGVkZ2U7XG4gICAgICBlZGdlLlByZXZJblNFTCA9IG51bGw7XG4gICAgICBlZGdlLk5leHRJblNFTCA9IG51bGw7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBlZGdlLk5leHRJblNFTCA9IHRoaXMubV9Tb3J0ZWRFZGdlcztcbiAgICAgIGVkZ2UuUHJldkluU0VMID0gbnVsbDtcbiAgICAgIHRoaXMubV9Tb3J0ZWRFZGdlcy5QcmV2SW5TRUwgPSBlZGdlO1xuICAgICAgdGhpcy5tX1NvcnRlZEVkZ2VzID0gZWRnZTtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuQ29weUFFTFRvU0VMID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHZhciBlID0gdGhpcy5tX0FjdGl2ZUVkZ2VzO1xuICAgIHRoaXMubV9Tb3J0ZWRFZGdlcyA9IGU7XG4gICAgd2hpbGUgKGUgIT09IG51bGwpXG4gICAge1xuICAgICAgZS5QcmV2SW5TRUwgPSBlLlByZXZJbkFFTDtcbiAgICAgIGUuTmV4dEluU0VMID0gZS5OZXh0SW5BRUw7XG4gICAgICBlID0gZS5OZXh0SW5BRUw7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlN3YXBQb3NpdGlvbnNJbkFFTCA9IGZ1bmN0aW9uIChlZGdlMSwgZWRnZTIpXG4gIHtcbiAgICAvL2NoZWNrIHRoYXQgb25lIG9yIG90aGVyIGVkZ2UgaGFzbid0IGFscmVhZHkgYmVlbiByZW1vdmVkIGZyb20gQUVMIC4uLlxuICAgIGlmIChlZGdlMS5OZXh0SW5BRUwgPT0gZWRnZTEuUHJldkluQUVMIHx8IGVkZ2UyLk5leHRJbkFFTCA9PSBlZGdlMi5QcmV2SW5BRUwpXG4gICAgICByZXR1cm47XG4gICAgaWYgKGVkZ2UxLk5leHRJbkFFTCA9PSBlZGdlMilcbiAgICB7XG4gICAgICB2YXIgbmV4dCA9IGVkZ2UyLk5leHRJbkFFTDtcbiAgICAgIGlmIChuZXh0ICE9PSBudWxsKVxuICAgICAgICBuZXh0LlByZXZJbkFFTCA9IGVkZ2UxO1xuICAgICAgdmFyIHByZXYgPSBlZGdlMS5QcmV2SW5BRUw7XG4gICAgICBpZiAocHJldiAhPT0gbnVsbClcbiAgICAgICAgcHJldi5OZXh0SW5BRUwgPSBlZGdlMjtcbiAgICAgIGVkZ2UyLlByZXZJbkFFTCA9IHByZXY7XG4gICAgICBlZGdlMi5OZXh0SW5BRUwgPSBlZGdlMTtcbiAgICAgIGVkZ2UxLlByZXZJbkFFTCA9IGVkZ2UyO1xuICAgICAgZWRnZTEuTmV4dEluQUVMID0gbmV4dDtcbiAgICB9XG4gICAgZWxzZSBpZiAoZWRnZTIuTmV4dEluQUVMID09IGVkZ2UxKVxuICAgIHtcbiAgICAgIHZhciBuZXh0ID0gZWRnZTEuTmV4dEluQUVMO1xuICAgICAgaWYgKG5leHQgIT09IG51bGwpXG4gICAgICAgIG5leHQuUHJldkluQUVMID0gZWRnZTI7XG4gICAgICB2YXIgcHJldiA9IGVkZ2UyLlByZXZJbkFFTDtcbiAgICAgIGlmIChwcmV2ICE9PSBudWxsKVxuICAgICAgICBwcmV2Lk5leHRJbkFFTCA9IGVkZ2UxO1xuICAgICAgZWRnZTEuUHJldkluQUVMID0gcHJldjtcbiAgICAgIGVkZ2UxLk5leHRJbkFFTCA9IGVkZ2UyO1xuICAgICAgZWRnZTIuUHJldkluQUVMID0gZWRnZTE7XG4gICAgICBlZGdlMi5OZXh0SW5BRUwgPSBuZXh0O1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgdmFyIG5leHQgPSBlZGdlMS5OZXh0SW5BRUw7XG4gICAgICB2YXIgcHJldiA9IGVkZ2UxLlByZXZJbkFFTDtcbiAgICAgIGVkZ2UxLk5leHRJbkFFTCA9IGVkZ2UyLk5leHRJbkFFTDtcbiAgICAgIGlmIChlZGdlMS5OZXh0SW5BRUwgIT09IG51bGwpXG4gICAgICAgIGVkZ2UxLk5leHRJbkFFTC5QcmV2SW5BRUwgPSBlZGdlMTtcbiAgICAgIGVkZ2UxLlByZXZJbkFFTCA9IGVkZ2UyLlByZXZJbkFFTDtcbiAgICAgIGlmIChlZGdlMS5QcmV2SW5BRUwgIT09IG51bGwpXG4gICAgICAgIGVkZ2UxLlByZXZJbkFFTC5OZXh0SW5BRUwgPSBlZGdlMTtcbiAgICAgIGVkZ2UyLk5leHRJbkFFTCA9IG5leHQ7XG4gICAgICBpZiAoZWRnZTIuTmV4dEluQUVMICE9PSBudWxsKVxuICAgICAgICBlZGdlMi5OZXh0SW5BRUwuUHJldkluQUVMID0gZWRnZTI7XG4gICAgICBlZGdlMi5QcmV2SW5BRUwgPSBwcmV2O1xuICAgICAgaWYgKGVkZ2UyLlByZXZJbkFFTCAhPT0gbnVsbClcbiAgICAgICAgZWRnZTIuUHJldkluQUVMLk5leHRJbkFFTCA9IGVkZ2UyO1xuICAgIH1cbiAgICBpZiAoZWRnZTEuUHJldkluQUVMID09PSBudWxsKVxuICAgICAgdGhpcy5tX0FjdGl2ZUVkZ2VzID0gZWRnZTE7XG4gICAgZWxzZSBpZiAoZWRnZTIuUHJldkluQUVMID09PSBudWxsKVxuICAgICAgdGhpcy5tX0FjdGl2ZUVkZ2VzID0gZWRnZTI7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuU3dhcFBvc2l0aW9uc0luU0VMID0gZnVuY3Rpb24gKGVkZ2UxLCBlZGdlMilcbiAge1xuICAgIGlmIChlZGdlMS5OZXh0SW5TRUwgPT09IG51bGwgJiYgZWRnZTEuUHJldkluU0VMID09PSBudWxsKVxuICAgICAgcmV0dXJuO1xuICAgIGlmIChlZGdlMi5OZXh0SW5TRUwgPT09IG51bGwgJiYgZWRnZTIuUHJldkluU0VMID09PSBudWxsKVxuICAgICAgcmV0dXJuO1xuICAgIGlmIChlZGdlMS5OZXh0SW5TRUwgPT0gZWRnZTIpXG4gICAge1xuICAgICAgdmFyIG5leHQgPSBlZGdlMi5OZXh0SW5TRUw7XG4gICAgICBpZiAobmV4dCAhPT0gbnVsbClcbiAgICAgICAgbmV4dC5QcmV2SW5TRUwgPSBlZGdlMTtcbiAgICAgIHZhciBwcmV2ID0gZWRnZTEuUHJldkluU0VMO1xuICAgICAgaWYgKHByZXYgIT09IG51bGwpXG4gICAgICAgIHByZXYuTmV4dEluU0VMID0gZWRnZTI7XG4gICAgICBlZGdlMi5QcmV2SW5TRUwgPSBwcmV2O1xuICAgICAgZWRnZTIuTmV4dEluU0VMID0gZWRnZTE7XG4gICAgICBlZGdlMS5QcmV2SW5TRUwgPSBlZGdlMjtcbiAgICAgIGVkZ2UxLk5leHRJblNFTCA9IG5leHQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKGVkZ2UyLk5leHRJblNFTCA9PSBlZGdlMSlcbiAgICB7XG4gICAgICB2YXIgbmV4dCA9IGVkZ2UxLk5leHRJblNFTDtcbiAgICAgIGlmIChuZXh0ICE9PSBudWxsKVxuICAgICAgICBuZXh0LlByZXZJblNFTCA9IGVkZ2UyO1xuICAgICAgdmFyIHByZXYgPSBlZGdlMi5QcmV2SW5TRUw7XG4gICAgICBpZiAocHJldiAhPT0gbnVsbClcbiAgICAgICAgcHJldi5OZXh0SW5TRUwgPSBlZGdlMTtcbiAgICAgIGVkZ2UxLlByZXZJblNFTCA9IHByZXY7XG4gICAgICBlZGdlMS5OZXh0SW5TRUwgPSBlZGdlMjtcbiAgICAgIGVkZ2UyLlByZXZJblNFTCA9IGVkZ2UxO1xuICAgICAgZWRnZTIuTmV4dEluU0VMID0gbmV4dDtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIHZhciBuZXh0ID0gZWRnZTEuTmV4dEluU0VMO1xuICAgICAgdmFyIHByZXYgPSBlZGdlMS5QcmV2SW5TRUw7XG4gICAgICBlZGdlMS5OZXh0SW5TRUwgPSBlZGdlMi5OZXh0SW5TRUw7XG4gICAgICBpZiAoZWRnZTEuTmV4dEluU0VMICE9PSBudWxsKVxuICAgICAgICBlZGdlMS5OZXh0SW5TRUwuUHJldkluU0VMID0gZWRnZTE7XG4gICAgICBlZGdlMS5QcmV2SW5TRUwgPSBlZGdlMi5QcmV2SW5TRUw7XG4gICAgICBpZiAoZWRnZTEuUHJldkluU0VMICE9PSBudWxsKVxuICAgICAgICBlZGdlMS5QcmV2SW5TRUwuTmV4dEluU0VMID0gZWRnZTE7XG4gICAgICBlZGdlMi5OZXh0SW5TRUwgPSBuZXh0O1xuICAgICAgaWYgKGVkZ2UyLk5leHRJblNFTCAhPT0gbnVsbClcbiAgICAgICAgZWRnZTIuTmV4dEluU0VMLlByZXZJblNFTCA9IGVkZ2UyO1xuICAgICAgZWRnZTIuUHJldkluU0VMID0gcHJldjtcbiAgICAgIGlmIChlZGdlMi5QcmV2SW5TRUwgIT09IG51bGwpXG4gICAgICAgIGVkZ2UyLlByZXZJblNFTC5OZXh0SW5TRUwgPSBlZGdlMjtcbiAgICB9XG4gICAgaWYgKGVkZ2UxLlByZXZJblNFTCA9PT0gbnVsbClcbiAgICAgIHRoaXMubV9Tb3J0ZWRFZGdlcyA9IGVkZ2UxO1xuICAgIGVsc2UgaWYgKGVkZ2UyLlByZXZJblNFTCA9PT0gbnVsbClcbiAgICAgIHRoaXMubV9Tb3J0ZWRFZGdlcyA9IGVkZ2UyO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkFkZExvY2FsTWF4UG9seSA9IGZ1bmN0aW9uIChlMSwgZTIsIHB0KVxuICB7XG4gICAgdGhpcy5BZGRPdXRQdChlMSwgcHQpO1xuICAgIGlmIChlMi5XaW5kRGVsdGEgPT0gMCkgdGhpcy5BZGRPdXRQdChlMiwgcHQpO1xuICAgIGlmIChlMS5PdXRJZHggPT0gZTIuT3V0SWR4KVxuICAgIHtcbiAgICAgIGUxLk91dElkeCA9IC0xO1xuICAgICAgZTIuT3V0SWR4ID0gLTE7XG4gICAgfVxuICAgIGVsc2UgaWYgKGUxLk91dElkeCA8IGUyLk91dElkeClcbiAgICAgIHRoaXMuQXBwZW5kUG9seWdvbihlMSwgZTIpO1xuICAgIGVsc2VcbiAgICAgIHRoaXMuQXBwZW5kUG9seWdvbihlMiwgZTEpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkFkZExvY2FsTWluUG9seSA9IGZ1bmN0aW9uIChlMSwgZTIsIHB0KVxuICB7XG4gICAgdmFyIHJlc3VsdDtcbiAgICB2YXIgZSwgcHJldkU7XG4gICAgaWYgKENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuSXNIb3Jpem9udGFsKGUyKSB8fCAoZTEuRHggPiBlMi5EeCkpXG4gICAge1xuICAgICAgcmVzdWx0ID0gdGhpcy5BZGRPdXRQdChlMSwgcHQpO1xuICAgICAgZTIuT3V0SWR4ID0gZTEuT3V0SWR4O1xuICAgICAgZTEuU2lkZSA9IENsaXBwZXJMaWIuRWRnZVNpZGUuZXNMZWZ0O1xuICAgICAgZTIuU2lkZSA9IENsaXBwZXJMaWIuRWRnZVNpZGUuZXNSaWdodDtcbiAgICAgIGUgPSBlMTtcbiAgICAgIGlmIChlLlByZXZJbkFFTCA9PSBlMilcbiAgICAgICAgcHJldkUgPSBlMi5QcmV2SW5BRUw7XG4gICAgICBlbHNlXG4gICAgICAgIHByZXZFID0gZS5QcmV2SW5BRUw7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICByZXN1bHQgPSB0aGlzLkFkZE91dFB0KGUyLCBwdCk7XG4gICAgICBlMS5PdXRJZHggPSBlMi5PdXRJZHg7XG4gICAgICBlMS5TaWRlID0gQ2xpcHBlckxpYi5FZGdlU2lkZS5lc1JpZ2h0O1xuICAgICAgZTIuU2lkZSA9IENsaXBwZXJMaWIuRWRnZVNpZGUuZXNMZWZ0O1xuICAgICAgZSA9IGUyO1xuICAgICAgaWYgKGUuUHJldkluQUVMID09IGUxKVxuICAgICAgICBwcmV2RSA9IGUxLlByZXZJbkFFTDtcbiAgICAgIGVsc2VcbiAgICAgICAgcHJldkUgPSBlLlByZXZJbkFFTDtcbiAgICB9XG4gICAgaWYgKHByZXZFICE9PSBudWxsICYmIHByZXZFLk91dElkeCA+PSAwICYmIChDbGlwcGVyTGliLkNsaXBwZXIuVG9wWChwcmV2RSwgcHQuWSkgPT0gQ2xpcHBlckxpYi5DbGlwcGVyLlRvcFgoZSwgcHQuWSkpICYmIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2xvcGVzRXF1YWwoZSwgcHJldkUsIHRoaXMubV9Vc2VGdWxsUmFuZ2UpICYmIChlLldpbmREZWx0YSAhPT0gMCkgJiYgKHByZXZFLldpbmREZWx0YSAhPT0gMCkpXG4gICAge1xuICAgICAgdmFyIG91dFB0ID0gdGhpcy5BZGRPdXRQdChwcmV2RSwgcHQpO1xuICAgICAgdGhpcy5BZGRKb2luKHJlc3VsdCwgb3V0UHQsIGUuVG9wKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5DcmVhdGVPdXRSZWMgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBDbGlwcGVyTGliLk91dFJlYygpO1xuICAgIHJlc3VsdC5JZHggPSAtMTtcbiAgICByZXN1bHQuSXNIb2xlID0gZmFsc2U7XG4gICAgcmVzdWx0LklzT3BlbiA9IGZhbHNlO1xuICAgIHJlc3VsdC5GaXJzdExlZnQgPSBudWxsO1xuICAgIHJlc3VsdC5QdHMgPSBudWxsO1xuICAgIHJlc3VsdC5Cb3R0b21QdCA9IG51bGw7XG4gICAgcmVzdWx0LlBvbHlOb2RlID0gbnVsbDtcbiAgICB0aGlzLm1fUG9seU91dHMucHVzaChyZXN1bHQpO1xuICAgIHJlc3VsdC5JZHggPSB0aGlzLm1fUG9seU91dHMubGVuZ3RoIC0gMTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkFkZE91dFB0ID0gZnVuY3Rpb24gKGUsIHB0KVxuICB7XG4gICAgdmFyIFRvRnJvbnQgPSAoZS5TaWRlID09IENsaXBwZXJMaWIuRWRnZVNpZGUuZXNMZWZ0KTtcbiAgICBpZiAoZS5PdXRJZHggPCAwKVxuICAgIHtcbiAgICAgIHZhciBvdXRSZWMgPSB0aGlzLkNyZWF0ZU91dFJlYygpO1xuICAgICAgb3V0UmVjLklzT3BlbiA9IChlLldpbmREZWx0YSA9PT0gMCk7XG4gICAgICB2YXIgbmV3T3AgPSBuZXcgQ2xpcHBlckxpYi5PdXRQdCgpO1xuICAgICAgb3V0UmVjLlB0cyA9IG5ld09wO1xuICAgICAgbmV3T3AuSWR4ID0gb3V0UmVjLklkeDtcbiAgICAgIC8vbmV3T3AuUHQgPSBwdDtcbiAgICAgIG5ld09wLlB0LlggPSBwdC5YO1xuICAgICAgbmV3T3AuUHQuWSA9IHB0Llk7XG4gICAgICBuZXdPcC5OZXh0ID0gbmV3T3A7XG4gICAgICBuZXdPcC5QcmV2ID0gbmV3T3A7XG4gICAgICBpZiAoIW91dFJlYy5Jc09wZW4pXG4gICAgICAgIHRoaXMuU2V0SG9sZVN0YXRlKGUsIG91dFJlYyk7XG4gICAgICBlLk91dElkeCA9IG91dFJlYy5JZHg7XG4gICAgICAvL25iOiBkbyB0aGlzIGFmdGVyIFNldFogIVxuICAgICAgcmV0dXJuIG5ld09wO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgdmFyIG91dFJlYyA9IHRoaXMubV9Qb2x5T3V0c1tlLk91dElkeF07XG4gICAgICAvL091dFJlYy5QdHMgaXMgdGhlICdMZWZ0LW1vc3QnIHBvaW50ICYgT3V0UmVjLlB0cy5QcmV2IGlzIHRoZSAnUmlnaHQtbW9zdCdcbiAgICAgIHZhciBvcCA9IG91dFJlYy5QdHM7XG4gICAgICBpZiAoVG9Gcm9udCAmJiBDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHB0LCBvcC5QdCkpXG4gICAgICAgIHJldHVybiBvcDtcbiAgICAgIGVsc2UgaWYgKCFUb0Zyb250ICYmIENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocHQsIG9wLlByZXYuUHQpKVxuICAgICAgICByZXR1cm4gb3AuUHJldjtcbiAgICAgIHZhciBuZXdPcCA9IG5ldyBDbGlwcGVyTGliLk91dFB0KCk7XG4gICAgICBuZXdPcC5JZHggPSBvdXRSZWMuSWR4O1xuICAgICAgLy9uZXdPcC5QdCA9IHB0O1xuICAgICAgbmV3T3AuUHQuWCA9IHB0Llg7XG4gICAgICBuZXdPcC5QdC5ZID0gcHQuWTtcbiAgICAgIG5ld09wLk5leHQgPSBvcDtcbiAgICAgIG5ld09wLlByZXYgPSBvcC5QcmV2O1xuICAgICAgbmV3T3AuUHJldi5OZXh0ID0gbmV3T3A7XG4gICAgICBvcC5QcmV2ID0gbmV3T3A7XG4gICAgICBpZiAoVG9Gcm9udClcbiAgICAgICAgb3V0UmVjLlB0cyA9IG5ld09wO1xuICAgICAgcmV0dXJuIG5ld09wO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Td2FwUG9pbnRzID0gZnVuY3Rpb24gKHB0MSwgcHQyKVxuICB7XG4gICAgdmFyIHRtcCA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KHB0MS5WYWx1ZSk7XG4gICAgLy9wdDEuVmFsdWUgPSBwdDIuVmFsdWU7XG4gICAgcHQxLlZhbHVlLlggPSBwdDIuVmFsdWUuWDtcbiAgICBwdDEuVmFsdWUuWSA9IHB0Mi5WYWx1ZS5ZO1xuICAgIC8vcHQyLlZhbHVlID0gdG1wO1xuICAgIHB0Mi5WYWx1ZS5YID0gdG1wLlg7XG4gICAgcHQyLlZhbHVlLlkgPSB0bXAuWTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Ib3J6U2VnbWVudHNPdmVybGFwID0gZnVuY3Rpb24gKHNlZzFhLCBzZWcxYiwgc2VnMmEsIHNlZzJiKVxuXHR7XG5cdFx0dmFyIHRtcDtcblx0XHRpZiAoc2VnMWEgPiBzZWcxYilcblx0XHR7XG5cdFx0XHR0bXAgPSBzZWcxYTtcblx0XHRcdHNlZzFhID0gc2VnMWI7XG5cdFx0XHRzZWcxYiA9IHRtcDtcblx0XHR9XG5cdFx0aWYgKHNlZzJhID4gc2VnMmIpXG5cdFx0e1xuXHRcdFx0dG1wID0gc2VnMmE7XG5cdFx0XHRzZWcyYSA9IHNlZzJiO1xuXHRcdFx0c2VnMmIgPSB0bXA7XG5cdFx0fVxuXHRcdHJldHVybiAoc2VnMWEgPCBzZWcyYikgJiYgKHNlZzJhIDwgc2VnMWIpO1xuXHR9XG5cbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5TZXRIb2xlU3RhdGUgPSBmdW5jdGlvbiAoZSwgb3V0UmVjKVxuICB7XG4gICAgdmFyIGlzSG9sZSA9IGZhbHNlO1xuICAgIHZhciBlMiA9IGUuUHJldkluQUVMO1xuICAgIHdoaWxlIChlMiAhPT0gbnVsbClcbiAgICB7XG4gICAgICBpZiAoZTIuT3V0SWR4ID49IDAgJiYgZTIuV2luZERlbHRhICE9IDApXG4gICAgICB7XG4gICAgICAgIGlzSG9sZSA9ICFpc0hvbGU7XG4gICAgICAgIGlmIChvdXRSZWMuRmlyc3RMZWZ0ID09PSBudWxsKVxuICAgICAgICAgIG91dFJlYy5GaXJzdExlZnQgPSB0aGlzLm1fUG9seU91dHNbZTIuT3V0SWR4XTtcbiAgICAgIH1cbiAgICAgIGUyID0gZTIuUHJldkluQUVMO1xuICAgIH1cbiAgICBpZiAoaXNIb2xlKVxuICAgICAgb3V0UmVjLklzSG9sZSA9IHRydWU7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuR2V0RHggPSBmdW5jdGlvbiAocHQxLCBwdDIpXG4gIHtcbiAgICBpZiAocHQxLlkgPT0gcHQyLlkpXG4gICAgICByZXR1cm4gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiAocHQyLlggLSBwdDEuWCkgLyAocHQyLlkgLSBwdDEuWSk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRmlyc3RJc0JvdHRvbVB0ID0gZnVuY3Rpb24gKGJ0bVB0MSwgYnRtUHQyKVxuICB7XG4gICAgdmFyIHAgPSBidG1QdDEuUHJldjtcbiAgICB3aGlsZSAoKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocC5QdCwgYnRtUHQxLlB0KSkgJiYgKHAgIT0gYnRtUHQxKSlcbiAgICAgIHAgPSBwLlByZXY7XG4gICAgdmFyIGR4MXAgPSBNYXRoLmFicyh0aGlzLkdldER4KGJ0bVB0MS5QdCwgcC5QdCkpO1xuICAgIHAgPSBidG1QdDEuTmV4dDtcbiAgICB3aGlsZSAoKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocC5QdCwgYnRtUHQxLlB0KSkgJiYgKHAgIT0gYnRtUHQxKSlcbiAgICAgIHAgPSBwLk5leHQ7XG4gICAgdmFyIGR4MW4gPSBNYXRoLmFicyh0aGlzLkdldER4KGJ0bVB0MS5QdCwgcC5QdCkpO1xuICAgIHAgPSBidG1QdDIuUHJldjtcbiAgICB3aGlsZSAoKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocC5QdCwgYnRtUHQyLlB0KSkgJiYgKHAgIT0gYnRtUHQyKSlcbiAgICAgIHAgPSBwLlByZXY7XG4gICAgdmFyIGR4MnAgPSBNYXRoLmFicyh0aGlzLkdldER4KGJ0bVB0Mi5QdCwgcC5QdCkpO1xuICAgIHAgPSBidG1QdDIuTmV4dDtcbiAgICB3aGlsZSAoKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocC5QdCwgYnRtUHQyLlB0KSkgJiYgKHAgIT0gYnRtUHQyKSlcbiAgICAgIHAgPSBwLk5leHQ7XG4gICAgdmFyIGR4Mm4gPSBNYXRoLmFicyh0aGlzLkdldER4KGJ0bVB0Mi5QdCwgcC5QdCkpO1xuICAgIHJldHVybiAoZHgxcCA+PSBkeDJwICYmIGR4MXAgPj0gZHgybikgfHwgKGR4MW4gPj0gZHgycCAmJiBkeDFuID49IGR4Mm4pO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkdldEJvdHRvbVB0ID0gZnVuY3Rpb24gKHBwKVxuICB7XG4gICAgdmFyIGR1cHMgPSBudWxsO1xuICAgIHZhciBwID0gcHAuTmV4dDtcbiAgICB3aGlsZSAocCAhPSBwcClcbiAgICB7XG4gICAgICBpZiAocC5QdC5ZID4gcHAuUHQuWSlcbiAgICAgIHtcbiAgICAgICAgcHAgPSBwO1xuICAgICAgICBkdXBzID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHAuUHQuWSA9PSBwcC5QdC5ZICYmIHAuUHQuWCA8PSBwcC5QdC5YKVxuICAgICAge1xuICAgICAgICBpZiAocC5QdC5YIDwgcHAuUHQuWClcbiAgICAgICAge1xuICAgICAgICAgIGR1cHMgPSBudWxsO1xuICAgICAgICAgIHBwID0gcDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICBpZiAocC5OZXh0ICE9IHBwICYmIHAuUHJldiAhPSBwcClcbiAgICAgICAgICAgIGR1cHMgPSBwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwID0gcC5OZXh0O1xuICAgIH1cbiAgICBpZiAoZHVwcyAhPT0gbnVsbClcbiAgICB7XG4gICAgICAvL3RoZXJlIGFwcGVhcnMgdG8gYmUgYXQgbGVhc3QgMiB2ZXJ0aWNlcyBhdCBib3R0b21QdCBzbyAuLi5cbiAgICAgIHdoaWxlIChkdXBzICE9IHApXG4gICAgICB7XG4gICAgICAgIGlmICghdGhpcy5GaXJzdElzQm90dG9tUHQocCwgZHVwcykpXG4gICAgICAgICAgcHAgPSBkdXBzO1xuICAgICAgICBkdXBzID0gZHVwcy5OZXh0O1xuICAgICAgICB3aGlsZSAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9JbmVxdWFsaXR5KGR1cHMuUHQsIHBwLlB0KSlcbiAgICAgICAgICBkdXBzID0gZHVwcy5OZXh0O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcHA7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuR2V0TG93ZXJtb3N0UmVjID0gZnVuY3Rpb24gKG91dFJlYzEsIG91dFJlYzIpXG4gIHtcbiAgICAvL3dvcmsgb3V0IHdoaWNoIHBvbHlnb24gZnJhZ21lbnQgaGFzIHRoZSBjb3JyZWN0IGhvbGUgc3RhdGUgLi4uXG4gICAgaWYgKG91dFJlYzEuQm90dG9tUHQgPT09IG51bGwpXG4gICAgICBvdXRSZWMxLkJvdHRvbVB0ID0gdGhpcy5HZXRCb3R0b21QdChvdXRSZWMxLlB0cyk7XG4gICAgaWYgKG91dFJlYzIuQm90dG9tUHQgPT09IG51bGwpXG4gICAgICBvdXRSZWMyLkJvdHRvbVB0ID0gdGhpcy5HZXRCb3R0b21QdChvdXRSZWMyLlB0cyk7XG4gICAgdmFyIGJQdDEgPSBvdXRSZWMxLkJvdHRvbVB0O1xuICAgIHZhciBiUHQyID0gb3V0UmVjMi5Cb3R0b21QdDtcbiAgICBpZiAoYlB0MS5QdC5ZID4gYlB0Mi5QdC5ZKVxuICAgICAgcmV0dXJuIG91dFJlYzE7XG4gICAgZWxzZSBpZiAoYlB0MS5QdC5ZIDwgYlB0Mi5QdC5ZKVxuICAgICAgcmV0dXJuIG91dFJlYzI7XG4gICAgZWxzZSBpZiAoYlB0MS5QdC5YIDwgYlB0Mi5QdC5YKVxuICAgICAgcmV0dXJuIG91dFJlYzE7XG4gICAgZWxzZSBpZiAoYlB0MS5QdC5YID4gYlB0Mi5QdC5YKVxuICAgICAgcmV0dXJuIG91dFJlYzI7XG4gICAgZWxzZSBpZiAoYlB0MS5OZXh0ID09IGJQdDEpXG4gICAgICByZXR1cm4gb3V0UmVjMjtcbiAgICBlbHNlIGlmIChiUHQyLk5leHQgPT0gYlB0MilcbiAgICAgIHJldHVybiBvdXRSZWMxO1xuICAgIGVsc2UgaWYgKHRoaXMuRmlyc3RJc0JvdHRvbVB0KGJQdDEsIGJQdDIpKVxuICAgICAgcmV0dXJuIG91dFJlYzE7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIG91dFJlYzI7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuUGFyYW0xUmlnaHRPZlBhcmFtMiA9IGZ1bmN0aW9uIChvdXRSZWMxLCBvdXRSZWMyKVxuICB7XG4gICAgZG8ge1xuICAgICAgb3V0UmVjMSA9IG91dFJlYzEuRmlyc3RMZWZ0O1xuICAgICAgaWYgKG91dFJlYzEgPT0gb3V0UmVjMilcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHdoaWxlIChvdXRSZWMxICE9PSBudWxsKVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5HZXRPdXRSZWMgPSBmdW5jdGlvbiAoaWR4KVxuICB7XG4gICAgdmFyIG91dHJlYyA9IHRoaXMubV9Qb2x5T3V0c1tpZHhdO1xuICAgIHdoaWxlIChvdXRyZWMgIT0gdGhpcy5tX1BvbHlPdXRzW291dHJlYy5JZHhdKVxuICAgICAgb3V0cmVjID0gdGhpcy5tX1BvbHlPdXRzW291dHJlYy5JZHhdO1xuICAgIHJldHVybiBvdXRyZWM7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuQXBwZW5kUG9seWdvbiA9IGZ1bmN0aW9uIChlMSwgZTIpXG4gIHtcbiAgICAvL2dldCB0aGUgc3RhcnQgYW5kIGVuZHMgb2YgYm90aCBvdXRwdXQgcG9seWdvbnMgLi4uXG4gICAgdmFyIG91dFJlYzEgPSB0aGlzLm1fUG9seU91dHNbZTEuT3V0SWR4XTtcbiAgICB2YXIgb3V0UmVjMiA9IHRoaXMubV9Qb2x5T3V0c1tlMi5PdXRJZHhdO1xuICAgIHZhciBob2xlU3RhdGVSZWM7XG4gICAgaWYgKHRoaXMuUGFyYW0xUmlnaHRPZlBhcmFtMihvdXRSZWMxLCBvdXRSZWMyKSlcbiAgICAgIGhvbGVTdGF0ZVJlYyA9IG91dFJlYzI7XG4gICAgZWxzZSBpZiAodGhpcy5QYXJhbTFSaWdodE9mUGFyYW0yKG91dFJlYzIsIG91dFJlYzEpKVxuICAgICAgaG9sZVN0YXRlUmVjID0gb3V0UmVjMTtcbiAgICBlbHNlXG4gICAgICBob2xlU3RhdGVSZWMgPSB0aGlzLkdldExvd2VybW9zdFJlYyhvdXRSZWMxLCBvdXRSZWMyKTtcbiAgICB2YXIgcDFfbGZ0ID0gb3V0UmVjMS5QdHM7XG4gICAgdmFyIHAxX3J0ID0gcDFfbGZ0LlByZXY7XG4gICAgdmFyIHAyX2xmdCA9IG91dFJlYzIuUHRzO1xuICAgIHZhciBwMl9ydCA9IHAyX2xmdC5QcmV2O1xuICAgIHZhciBzaWRlO1xuICAgIC8vam9pbiBlMiBwb2x5IG9udG8gZTEgcG9seSBhbmQgZGVsZXRlIHBvaW50ZXJzIHRvIGUyIC4uLlxuICAgIGlmIChlMS5TaWRlID09IENsaXBwZXJMaWIuRWRnZVNpZGUuZXNMZWZ0KVxuICAgIHtcbiAgICAgIGlmIChlMi5TaWRlID09IENsaXBwZXJMaWIuRWRnZVNpZGUuZXNMZWZ0KVxuICAgICAge1xuICAgICAgICAvL3ogeSB4IGEgYiBjXG4gICAgICAgIHRoaXMuUmV2ZXJzZVBvbHlQdExpbmtzKHAyX2xmdCk7XG4gICAgICAgIHAyX2xmdC5OZXh0ID0gcDFfbGZ0O1xuICAgICAgICBwMV9sZnQuUHJldiA9IHAyX2xmdDtcbiAgICAgICAgcDFfcnQuTmV4dCA9IHAyX3J0O1xuICAgICAgICBwMl9ydC5QcmV2ID0gcDFfcnQ7XG4gICAgICAgIG91dFJlYzEuUHRzID0gcDJfcnQ7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIC8veCB5IHogYSBiIGNcbiAgICAgICAgcDJfcnQuTmV4dCA9IHAxX2xmdDtcbiAgICAgICAgcDFfbGZ0LlByZXYgPSBwMl9ydDtcbiAgICAgICAgcDJfbGZ0LlByZXYgPSBwMV9ydDtcbiAgICAgICAgcDFfcnQuTmV4dCA9IHAyX2xmdDtcbiAgICAgICAgb3V0UmVjMS5QdHMgPSBwMl9sZnQ7XG4gICAgICB9XG4gICAgICBzaWRlID0gQ2xpcHBlckxpYi5FZGdlU2lkZS5lc0xlZnQ7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBpZiAoZTIuU2lkZSA9PSBDbGlwcGVyTGliLkVkZ2VTaWRlLmVzUmlnaHQpXG4gICAgICB7XG4gICAgICAgIC8vYSBiIGMgeiB5IHhcbiAgICAgICAgdGhpcy5SZXZlcnNlUG9seVB0TGlua3MocDJfbGZ0KTtcbiAgICAgICAgcDFfcnQuTmV4dCA9IHAyX3J0O1xuICAgICAgICBwMl9ydC5QcmV2ID0gcDFfcnQ7XG4gICAgICAgIHAyX2xmdC5OZXh0ID0gcDFfbGZ0O1xuICAgICAgICBwMV9sZnQuUHJldiA9IHAyX2xmdDtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgLy9hIGIgYyB4IHkgelxuICAgICAgICBwMV9ydC5OZXh0ID0gcDJfbGZ0O1xuICAgICAgICBwMl9sZnQuUHJldiA9IHAxX3J0O1xuICAgICAgICBwMV9sZnQuUHJldiA9IHAyX3J0O1xuICAgICAgICBwMl9ydC5OZXh0ID0gcDFfbGZ0O1xuICAgICAgfVxuICAgICAgc2lkZSA9IENsaXBwZXJMaWIuRWRnZVNpZGUuZXNSaWdodDtcbiAgICB9XG4gICAgb3V0UmVjMS5Cb3R0b21QdCA9IG51bGw7XG4gICAgaWYgKGhvbGVTdGF0ZVJlYyA9PSBvdXRSZWMyKVxuICAgIHtcbiAgICAgIGlmIChvdXRSZWMyLkZpcnN0TGVmdCAhPSBvdXRSZWMxKVxuICAgICAgICBvdXRSZWMxLkZpcnN0TGVmdCA9IG91dFJlYzIuRmlyc3RMZWZ0O1xuICAgICAgb3V0UmVjMS5Jc0hvbGUgPSBvdXRSZWMyLklzSG9sZTtcbiAgICB9XG4gICAgb3V0UmVjMi5QdHMgPSBudWxsO1xuICAgIG91dFJlYzIuQm90dG9tUHQgPSBudWxsO1xuICAgIG91dFJlYzIuRmlyc3RMZWZ0ID0gb3V0UmVjMTtcbiAgICB2YXIgT0tJZHggPSBlMS5PdXRJZHg7XG4gICAgdmFyIE9ic29sZXRlSWR4ID0gZTIuT3V0SWR4O1xuICAgIGUxLk91dElkeCA9IC0xO1xuICAgIC8vbmI6IHNhZmUgYmVjYXVzZSB3ZSBvbmx5IGdldCBoZXJlIHZpYSBBZGRMb2NhbE1heFBvbHlcbiAgICBlMi5PdXRJZHggPSAtMTtcbiAgICB2YXIgZSA9IHRoaXMubV9BY3RpdmVFZGdlcztcbiAgICB3aGlsZSAoZSAhPT0gbnVsbClcbiAgICB7XG4gICAgICBpZiAoZS5PdXRJZHggPT0gT2Jzb2xldGVJZHgpXG4gICAgICB7XG4gICAgICAgIGUuT3V0SWR4ID0gT0tJZHg7XG4gICAgICAgIGUuU2lkZSA9IHNpZGU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgZSA9IGUuTmV4dEluQUVMO1xuICAgIH1cbiAgICBvdXRSZWMyLklkeCA9IG91dFJlYzEuSWR4O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlJldmVyc2VQb2x5UHRMaW5rcyA9IGZ1bmN0aW9uIChwcClcbiAge1xuICAgIGlmIChwcCA9PT0gbnVsbClcbiAgICAgIHJldHVybjtcbiAgICB2YXIgcHAxO1xuICAgIHZhciBwcDI7XG4gICAgcHAxID0gcHA7XG4gICAgZG8ge1xuICAgICAgcHAyID0gcHAxLk5leHQ7XG4gICAgICBwcDEuTmV4dCA9IHBwMS5QcmV2O1xuICAgICAgcHAxLlByZXYgPSBwcDI7XG4gICAgICBwcDEgPSBwcDI7XG4gICAgfVxuICAgIHdoaWxlIChwcDEgIT0gcHApXG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5Td2FwU2lkZXMgPSBmdW5jdGlvbiAoZWRnZTEsIGVkZ2UyKVxuICB7XG4gICAgdmFyIHNpZGUgPSBlZGdlMS5TaWRlO1xuICAgIGVkZ2UxLlNpZGUgPSBlZGdlMi5TaWRlO1xuICAgIGVkZ2UyLlNpZGUgPSBzaWRlO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuU3dhcFBvbHlJbmRleGVzID0gZnVuY3Rpb24gKGVkZ2UxLCBlZGdlMilcbiAge1xuICAgIHZhciBvdXRJZHggPSBlZGdlMS5PdXRJZHg7XG4gICAgZWRnZTEuT3V0SWR4ID0gZWRnZTIuT3V0SWR4O1xuICAgIGVkZ2UyLk91dElkeCA9IG91dElkeDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5JbnRlcnNlY3RFZGdlcyA9IGZ1bmN0aW9uIChlMSwgZTIsIHB0KVxuICB7XG4gICAgLy9lMSB3aWxsIGJlIHRvIHRoZSBsZWZ0IG9mIGUyIEJFTE9XIHRoZSBpbnRlcnNlY3Rpb24uIFRoZXJlZm9yZSBlMSBpcyBiZWZvcmVcbiAgICAvL2UyIGluIEFFTCBleGNlcHQgd2hlbiBlMSBpcyBiZWluZyBpbnNlcnRlZCBhdCB0aGUgaW50ZXJzZWN0aW9uIHBvaW50IC4uLlxuICAgIHZhciBlMUNvbnRyaWJ1dGluZyA9IChlMS5PdXRJZHggPj0gMCk7XG4gICAgdmFyIGUyQ29udHJpYnV0aW5nID0gKGUyLk91dElkeCA+PSAwKTtcblxuICAgIGlmICh1c2VfeHl6KVxuICAgIFx0dGhpcy5TZXRaKHB0LCBlMSwgZTIpO1xuXG4gICAgaWYgKHVzZV9saW5lcylcbiAgICB7XG4gICAgICAvL2lmIGVpdGhlciBlZGdlIGlzIG9uIGFuIE9QRU4gcGF0aCAuLi5cbiAgICAgIGlmIChlMS5XaW5kRGVsdGEgPT09IDAgfHwgZTIuV2luZERlbHRhID09PSAwKVxuICAgICAge1xuICAgICAgICAvL2lnbm9yZSBzdWJqZWN0LXN1YmplY3Qgb3BlbiBwYXRoIGludGVyc2VjdGlvbnMgVU5MRVNTIHRoZXlcbiAgICAgICAgLy9hcmUgYm90aCBvcGVuIHBhdGhzLCBBTkQgdGhleSBhcmUgYm90aCAnY29udHJpYnV0aW5nIG1heGltYXMnIC4uLlxuXHRcdFx0XHRpZiAoZTEuV2luZERlbHRhID09IDAgJiYgZTIuV2luZERlbHRhID09IDApIHJldHVybjtcbiAgICAgICAgLy9pZiBpbnRlcnNlY3RpbmcgYSBzdWJqIGxpbmUgd2l0aCBhIHN1YmogcG9seSAuLi5cbiAgICAgICAgZWxzZSBpZiAoZTEuUG9seVR5cCA9PSBlMi5Qb2x5VHlwICYmXG4gICAgICAgICAgZTEuV2luZERlbHRhICE9IGUyLldpbmREZWx0YSAmJiB0aGlzLm1fQ2xpcFR5cGUgPT0gQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFVuaW9uKVxuICAgICAgICB7XG4gICAgICAgICAgaWYgKGUxLldpbmREZWx0YSA9PT0gMClcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpZiAoZTJDb250cmlidXRpbmcpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHRoaXMuQWRkT3V0UHQoZTEsIHB0KTtcbiAgICAgICAgICAgICAgaWYgKGUxQ29udHJpYnV0aW5nKVxuICAgICAgICAgICAgICAgIGUxLk91dElkeCA9IC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWYgKGUxQ29udHJpYnV0aW5nKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB0aGlzLkFkZE91dFB0KGUyLCBwdCk7XG4gICAgICAgICAgICAgIGlmIChlMkNvbnRyaWJ1dGluZylcbiAgICAgICAgICAgICAgICBlMi5PdXRJZHggPSAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZTEuUG9seVR5cCAhPSBlMi5Qb2x5VHlwKVxuICAgICAgICB7XG4gICAgICAgICAgaWYgKChlMS5XaW5kRGVsdGEgPT09IDApICYmIE1hdGguYWJzKGUyLldpbmRDbnQpID09IDEgJiZcbiAgICAgICAgICAgICh0aGlzLm1fQ2xpcFR5cGUgIT0gQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFVuaW9uIHx8IGUyLldpbmRDbnQyID09PSAwKSlcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLkFkZE91dFB0KGUxLCBwdCk7XG4gICAgICAgICAgICBpZiAoZTFDb250cmlidXRpbmcpXG4gICAgICAgICAgICAgIGUxLk91dElkeCA9IC0xO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmICgoZTIuV2luZERlbHRhID09PSAwKSAmJiAoTWF0aC5hYnMoZTEuV2luZENudCkgPT0gMSkgJiZcbiAgICAgICAgICAgICh0aGlzLm1fQ2xpcFR5cGUgIT0gQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFVuaW9uIHx8IGUxLldpbmRDbnQyID09PSAwKSlcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLkFkZE91dFB0KGUyLCBwdCk7XG4gICAgICAgICAgICBpZiAoZTJDb250cmlidXRpbmcpXG4gICAgICAgICAgICAgIGUyLk91dElkeCA9IC0xO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIC8vdXBkYXRlIHdpbmRpbmcgY291bnRzLi4uXG4gICAgLy9hc3N1bWVzIHRoYXQgZTEgd2lsbCBiZSB0byB0aGUgUmlnaHQgb2YgZTIgQUJPVkUgdGhlIGludGVyc2VjdGlvblxuICAgIGlmIChlMS5Qb2x5VHlwID09IGUyLlBvbHlUeXApXG4gICAge1xuICAgICAgaWYgKHRoaXMuSXNFdmVuT2RkRmlsbFR5cGUoZTEpKVxuICAgICAge1xuICAgICAgICB2YXIgb2xkRTFXaW5kQ250ID0gZTEuV2luZENudDtcbiAgICAgICAgZTEuV2luZENudCA9IGUyLldpbmRDbnQ7XG4gICAgICAgIGUyLldpbmRDbnQgPSBvbGRFMVdpbmRDbnQ7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIGlmIChlMS5XaW5kQ250ICsgZTIuV2luZERlbHRhID09PSAwKVxuICAgICAgICAgIGUxLldpbmRDbnQgPSAtZTEuV2luZENudDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGUxLldpbmRDbnQgKz0gZTIuV2luZERlbHRhO1xuICAgICAgICBpZiAoZTIuV2luZENudCAtIGUxLldpbmREZWx0YSA9PT0gMClcbiAgICAgICAgICBlMi5XaW5kQ250ID0gLWUyLldpbmRDbnQ7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBlMi5XaW5kQ250IC09IGUxLldpbmREZWx0YTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIGlmICghdGhpcy5Jc0V2ZW5PZGRGaWxsVHlwZShlMikpXG4gICAgICAgIGUxLldpbmRDbnQyICs9IGUyLldpbmREZWx0YTtcbiAgICAgIGVsc2VcbiAgICAgICAgZTEuV2luZENudDIgPSAoZTEuV2luZENudDIgPT09IDApID8gMSA6IDA7XG4gICAgICBpZiAoIXRoaXMuSXNFdmVuT2RkRmlsbFR5cGUoZTEpKVxuICAgICAgICBlMi5XaW5kQ250MiAtPSBlMS5XaW5kRGVsdGE7XG4gICAgICBlbHNlXG4gICAgICAgIGUyLldpbmRDbnQyID0gKGUyLldpbmRDbnQyID09PSAwKSA/IDEgOiAwO1xuICAgIH1cbiAgICB2YXIgZTFGaWxsVHlwZSwgZTJGaWxsVHlwZSwgZTFGaWxsVHlwZTIsIGUyRmlsbFR5cGUyO1xuICAgIGlmIChlMS5Qb2x5VHlwID09IENsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0KVxuICAgIHtcbiAgICAgIGUxRmlsbFR5cGUgPSB0aGlzLm1fU3ViakZpbGxUeXBlO1xuICAgICAgZTFGaWxsVHlwZTIgPSB0aGlzLm1fQ2xpcEZpbGxUeXBlO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgZTFGaWxsVHlwZSA9IHRoaXMubV9DbGlwRmlsbFR5cGU7XG4gICAgICBlMUZpbGxUeXBlMiA9IHRoaXMubV9TdWJqRmlsbFR5cGU7XG4gICAgfVxuICAgIGlmIChlMi5Qb2x5VHlwID09IENsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0KVxuICAgIHtcbiAgICAgIGUyRmlsbFR5cGUgPSB0aGlzLm1fU3ViakZpbGxUeXBlO1xuICAgICAgZTJGaWxsVHlwZTIgPSB0aGlzLm1fQ2xpcEZpbGxUeXBlO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgZTJGaWxsVHlwZSA9IHRoaXMubV9DbGlwRmlsbFR5cGU7XG4gICAgICBlMkZpbGxUeXBlMiA9IHRoaXMubV9TdWJqRmlsbFR5cGU7XG4gICAgfVxuICAgIHZhciBlMVdjLCBlMldjO1xuICAgIHN3aXRjaCAoZTFGaWxsVHlwZSlcbiAgICB7XG4gICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRQb3NpdGl2ZTpcbiAgICAgIGUxV2MgPSBlMS5XaW5kQ250O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROZWdhdGl2ZTpcbiAgICAgIGUxV2MgPSAtZTEuV2luZENudDtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBlMVdjID0gTWF0aC5hYnMoZTEuV2luZENudCk7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgc3dpdGNoIChlMkZpbGxUeXBlKVxuICAgIHtcbiAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdFBvc2l0aXZlOlxuICAgICAgZTJXYyA9IGUyLldpbmRDbnQ7XG4gICAgICBicmVhaztcbiAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5lZ2F0aXZlOlxuICAgICAgZTJXYyA9IC1lMi5XaW5kQ250O1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGUyV2MgPSBNYXRoLmFicyhlMi5XaW5kQ250KTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoZTFDb250cmlidXRpbmcgJiYgZTJDb250cmlidXRpbmcpXG4gICAge1xuXHRcdFx0aWYgKChlMVdjICE9IDAgJiYgZTFXYyAhPSAxKSB8fCAoZTJXYyAhPSAwICYmIGUyV2MgIT0gMSkgfHxcblx0XHRcdChlMS5Qb2x5VHlwICE9IGUyLlBvbHlUeXAgJiYgdGhpcy5tX0NsaXBUeXBlICE9IENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RYb3IpKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLkFkZExvY2FsTWF4UG9seShlMSwgZTIsIHB0KTtcblx0XHRcdH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgdGhpcy5BZGRPdXRQdChlMSwgcHQpO1xuICAgICAgICB0aGlzLkFkZE91dFB0KGUyLCBwdCk7XG4gICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlci5Td2FwU2lkZXMoZTEsIGUyKTtcbiAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyLlN3YXBQb2x5SW5kZXhlcyhlMSwgZTIpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChlMUNvbnRyaWJ1dGluZylcbiAgICB7XG4gICAgICBpZiAoZTJXYyA9PT0gMCB8fCBlMldjID09IDEpXG4gICAgICB7XG4gICAgICAgIHRoaXMuQWRkT3V0UHQoZTEsIHB0KTtcbiAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyLlN3YXBTaWRlcyhlMSwgZTIpO1xuICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXIuU3dhcFBvbHlJbmRleGVzKGUxLCBlMik7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKGUyQ29udHJpYnV0aW5nKVxuICAgIHtcbiAgICAgIGlmIChlMVdjID09PSAwIHx8IGUxV2MgPT0gMSlcbiAgICAgIHtcbiAgICAgICAgdGhpcy5BZGRPdXRQdChlMiwgcHQpO1xuICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXIuU3dhcFNpZGVzKGUxLCBlMik7XG4gICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlci5Td2FwUG9seUluZGV4ZXMoZTEsIGUyKTtcbiAgICAgIH1cbiAgICB9XG5cdFx0ZWxzZSBpZiAoIChlMVdjID09IDAgfHwgZTFXYyA9PSAxKSAmJiAoZTJXYyA9PSAwIHx8IGUyV2MgPT0gMSkpXG4gICAge1xuICAgICAgLy9uZWl0aGVyIGVkZ2UgaXMgY3VycmVudGx5IGNvbnRyaWJ1dGluZyAuLi5cbiAgICAgIHZhciBlMVdjMiwgZTJXYzI7XG4gICAgICBzd2l0Y2ggKGUxRmlsbFR5cGUyKVxuICAgICAge1xuICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRQb3NpdGl2ZTpcbiAgICAgICAgZTFXYzIgPSBlMS5XaW5kQ250MjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5lZ2F0aXZlOlxuICAgICAgICBlMVdjMiA9IC1lMS5XaW5kQ250MjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBlMVdjMiA9IE1hdGguYWJzKGUxLldpbmRDbnQyKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKGUyRmlsbFR5cGUyKVxuICAgICAge1xuICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRQb3NpdGl2ZTpcbiAgICAgICAgZTJXYzIgPSBlMi5XaW5kQ250MjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5lZ2F0aXZlOlxuICAgICAgICBlMldjMiA9IC1lMi5XaW5kQ250MjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBlMldjMiA9IE1hdGguYWJzKGUyLldpbmRDbnQyKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAoZTEuUG9seVR5cCAhPSBlMi5Qb2x5VHlwKVxuICAgICAge1xuICAgICAgICB0aGlzLkFkZExvY2FsTWluUG9seShlMSwgZTIsIHB0KTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGUxV2MgPT0gMSAmJiBlMldjID09IDEpXG4gICAgICAgIHN3aXRjaCAodGhpcy5tX0NsaXBUeXBlKVxuICAgICAgICB7XG4gICAgICAgIGNhc2UgQ2xpcHBlckxpYi5DbGlwVHlwZS5jdEludGVyc2VjdGlvbjpcbiAgICAgICAgICBpZiAoZTFXYzIgPiAwICYmIGUyV2MyID4gMClcbiAgICAgICAgICAgIHRoaXMuQWRkTG9jYWxNaW5Qb2x5KGUxLCBlMiwgcHQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RVbmlvbjpcbiAgICAgICAgICBpZiAoZTFXYzIgPD0gMCAmJiBlMldjMiA8PSAwKVxuICAgICAgICAgICAgdGhpcy5BZGRMb2NhbE1pblBvbHkoZTEsIGUyLCBwdCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ2xpcHBlckxpYi5DbGlwVHlwZS5jdERpZmZlcmVuY2U6XG4gICAgICAgICAgaWYgKCgoZTEuUG9seVR5cCA9PSBDbGlwcGVyTGliLlBvbHlUeXBlLnB0Q2xpcCkgJiYgKGUxV2MyID4gMCkgJiYgKGUyV2MyID4gMCkpIHx8XG4gICAgICAgICAgICAoKGUxLlBvbHlUeXAgPT0gQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdFN1YmplY3QpICYmIChlMVdjMiA8PSAwKSAmJiAoZTJXYzIgPD0gMCkpKVxuICAgICAgICAgICAgdGhpcy5BZGRMb2NhbE1pblBvbHkoZTEsIGUyLCBwdCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFhvcjpcbiAgICAgICAgICB0aGlzLkFkZExvY2FsTWluUG9seShlMSwgZTIsIHB0KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgZWxzZVxuICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXIuU3dhcFNpZGVzKGUxLCBlMik7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkRlbGV0ZUZyb21BRUwgPSBmdW5jdGlvbiAoZSlcbiAge1xuICAgIHZhciBBZWxQcmV2ID0gZS5QcmV2SW5BRUw7XG4gICAgdmFyIEFlbE5leHQgPSBlLk5leHRJbkFFTDtcbiAgICBpZiAoQWVsUHJldiA9PT0gbnVsbCAmJiBBZWxOZXh0ID09PSBudWxsICYmIChlICE9IHRoaXMubV9BY3RpdmVFZGdlcykpXG4gICAgICByZXR1cm47XG4gICAgLy9hbHJlYWR5IGRlbGV0ZWRcbiAgICBpZiAoQWVsUHJldiAhPT0gbnVsbClcbiAgICAgIEFlbFByZXYuTmV4dEluQUVMID0gQWVsTmV4dDtcbiAgICBlbHNlXG4gICAgICB0aGlzLm1fQWN0aXZlRWRnZXMgPSBBZWxOZXh0O1xuICAgIGlmIChBZWxOZXh0ICE9PSBudWxsKVxuICAgICAgQWVsTmV4dC5QcmV2SW5BRUwgPSBBZWxQcmV2O1xuICAgIGUuTmV4dEluQUVMID0gbnVsbDtcbiAgICBlLlByZXZJbkFFTCA9IG51bGw7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRGVsZXRlRnJvbVNFTCA9IGZ1bmN0aW9uIChlKVxuICB7XG4gICAgdmFyIFNlbFByZXYgPSBlLlByZXZJblNFTDtcbiAgICB2YXIgU2VsTmV4dCA9IGUuTmV4dEluU0VMO1xuICAgIGlmIChTZWxQcmV2ID09PSBudWxsICYmIFNlbE5leHQgPT09IG51bGwgJiYgKGUgIT0gdGhpcy5tX1NvcnRlZEVkZ2VzKSlcbiAgICAgIHJldHVybjtcbiAgICAvL2FscmVhZHkgZGVsZXRlZFxuICAgIGlmIChTZWxQcmV2ICE9PSBudWxsKVxuICAgICAgU2VsUHJldi5OZXh0SW5TRUwgPSBTZWxOZXh0O1xuICAgIGVsc2VcbiAgICAgIHRoaXMubV9Tb3J0ZWRFZGdlcyA9IFNlbE5leHQ7XG4gICAgaWYgKFNlbE5leHQgIT09IG51bGwpXG4gICAgICBTZWxOZXh0LlByZXZJblNFTCA9IFNlbFByZXY7XG4gICAgZS5OZXh0SW5TRUwgPSBudWxsO1xuICAgIGUuUHJldkluU0VMID0gbnVsbDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5VcGRhdGVFZGdlSW50b0FFTCA9IGZ1bmN0aW9uIChlKVxuICB7XG4gICAgaWYgKGUuTmV4dEluTE1MID09PSBudWxsKVxuICAgICAgQ2xpcHBlckxpYi5FcnJvcihcIlVwZGF0ZUVkZ2VJbnRvQUVMOiBpbnZhbGlkIGNhbGxcIik7XG4gICAgdmFyIEFlbFByZXYgPSBlLlByZXZJbkFFTDtcbiAgICB2YXIgQWVsTmV4dCA9IGUuTmV4dEluQUVMO1xuICAgIGUuTmV4dEluTE1MLk91dElkeCA9IGUuT3V0SWR4O1xuICAgIGlmIChBZWxQcmV2ICE9PSBudWxsKVxuICAgICAgQWVsUHJldi5OZXh0SW5BRUwgPSBlLk5leHRJbkxNTDtcbiAgICBlbHNlXG4gICAgICB0aGlzLm1fQWN0aXZlRWRnZXMgPSBlLk5leHRJbkxNTDtcbiAgICBpZiAoQWVsTmV4dCAhPT0gbnVsbClcbiAgICAgIEFlbE5leHQuUHJldkluQUVMID0gZS5OZXh0SW5MTUw7XG4gICAgZS5OZXh0SW5MTUwuU2lkZSA9IGUuU2lkZTtcbiAgICBlLk5leHRJbkxNTC5XaW5kRGVsdGEgPSBlLldpbmREZWx0YTtcbiAgICBlLk5leHRJbkxNTC5XaW5kQ250ID0gZS5XaW5kQ250O1xuICAgIGUuTmV4dEluTE1MLldpbmRDbnQyID0gZS5XaW5kQ250MjtcbiAgICBlID0gZS5OZXh0SW5MTUw7XG4gICAgLy8gICAgZS5DdXJyID0gZS5Cb3Q7XG4gICAgZS5DdXJyLlggPSBlLkJvdC5YO1xuICAgIGUuQ3Vyci5ZID0gZS5Cb3QuWTtcbiAgICBlLlByZXZJbkFFTCA9IEFlbFByZXY7XG4gICAgZS5OZXh0SW5BRUwgPSBBZWxOZXh0O1xuICAgIGlmICghQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Jc0hvcml6b250YWwoZSkpXG4gICAgICB0aGlzLkluc2VydFNjYW5iZWFtKGUuVG9wLlkpO1xuICAgIHJldHVybiBlO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlByb2Nlc3NIb3Jpem9udGFscyA9IGZ1bmN0aW9uIChpc1RvcE9mU2NhbmJlYW0pXG4gIHtcbiAgICB2YXIgaG9yekVkZ2UgPSB0aGlzLm1fU29ydGVkRWRnZXM7XG4gICAgd2hpbGUgKGhvcnpFZGdlICE9PSBudWxsKVxuICAgIHtcbiAgICAgIHRoaXMuRGVsZXRlRnJvbVNFTChob3J6RWRnZSk7XG4gICAgICB0aGlzLlByb2Nlc3NIb3Jpem9udGFsKGhvcnpFZGdlLCBpc1RvcE9mU2NhbmJlYW0pO1xuICAgICAgaG9yekVkZ2UgPSB0aGlzLm1fU29ydGVkRWRnZXM7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkdldEhvcnpEaXJlY3Rpb24gPSBmdW5jdGlvbiAoSG9yekVkZ2UsICR2YXIpXG4gIHtcbiAgICBpZiAoSG9yekVkZ2UuQm90LlggPCBIb3J6RWRnZS5Ub3AuWClcbiAgICB7XG4gICAgICAgICR2YXIuTGVmdCA9IEhvcnpFZGdlLkJvdC5YO1xuICAgICAgICAkdmFyLlJpZ2h0ID0gSG9yekVkZ2UuVG9wLlg7XG4gICAgICAgICR2YXIuRGlyID0gQ2xpcHBlckxpYi5EaXJlY3Rpb24uZExlZnRUb1JpZ2h0O1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICAkdmFyLkxlZnQgPSBIb3J6RWRnZS5Ub3AuWDtcbiAgICAgICAgJHZhci5SaWdodCA9IEhvcnpFZGdlLkJvdC5YO1xuICAgICAgICAkdmFyLkRpciA9IENsaXBwZXJMaWIuRGlyZWN0aW9uLmRSaWdodFRvTGVmdDtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuUHJvY2Vzc0hvcml6b250YWwgPSBmdW5jdGlvbiAoaG9yekVkZ2UsIGlzVG9wT2ZTY2FuYmVhbSlcbiAge1xuICAgIHZhciAkdmFyID0ge0RpcjogbnVsbCwgTGVmdDogbnVsbCwgUmlnaHQ6IG51bGx9O1xuICAgIHRoaXMuR2V0SG9yekRpcmVjdGlvbihob3J6RWRnZSwgJHZhcik7XG4gICAgdmFyIGRpciA9ICR2YXIuRGlyO1xuICAgIHZhciBob3J6TGVmdCA9ICR2YXIuTGVmdDtcbiAgICB2YXIgaG9yelJpZ2h0ID0gJHZhci5SaWdodDtcblxuICAgIHZhciBlTGFzdEhvcnogPSBob3J6RWRnZSxcbiAgICAgIGVNYXhQYWlyID0gbnVsbDtcbiAgICB3aGlsZSAoZUxhc3RIb3J6Lk5leHRJbkxNTCAhPT0gbnVsbCAmJiBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLklzSG9yaXpvbnRhbChlTGFzdEhvcnouTmV4dEluTE1MKSlcbiAgICAgIGVMYXN0SG9yeiA9IGVMYXN0SG9yei5OZXh0SW5MTUw7XG4gICAgaWYgKGVMYXN0SG9yei5OZXh0SW5MTUwgPT09IG51bGwpXG4gICAgICBlTWF4UGFpciA9IHRoaXMuR2V0TWF4aW1hUGFpcihlTGFzdEhvcnopO1xuICAgIGZvciAoOzspXG4gICAge1xuICAgICAgdmFyIElzTGFzdEhvcnogPSAoaG9yekVkZ2UgPT0gZUxhc3RIb3J6KTtcbiAgICAgIHZhciBlID0gdGhpcy5HZXROZXh0SW5BRUwoaG9yekVkZ2UsIGRpcik7XG4gICAgICB3aGlsZSAoZSAhPT0gbnVsbClcbiAgICAgIHtcbiAgICAgICAgLy9CcmVhayBpZiB3ZSd2ZSBnb3QgdG8gdGhlIGVuZCBvZiBhbiBpbnRlcm1lZGlhdGUgaG9yaXpvbnRhbCBlZGdlIC4uLlxuICAgICAgICAvL25iOiBTbWFsbGVyIER4J3MgYXJlIHRvIHRoZSByaWdodCBvZiBsYXJnZXIgRHgncyBBQk9WRSB0aGUgaG9yaXpvbnRhbC5cbiAgICAgICAgaWYgKGUuQ3Vyci5YID09IGhvcnpFZGdlLlRvcC5YICYmIGhvcnpFZGdlLk5leHRJbkxNTCAhPT0gbnVsbCAmJiBlLkR4IDwgaG9yekVkZ2UuTmV4dEluTE1MLkR4KVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB2YXIgZU5leHQgPSB0aGlzLkdldE5leHRJbkFFTChlLCBkaXIpO1xuICAgICAgICAvL3NhdmVzIGVOZXh0IGZvciBsYXRlclxuICAgICAgICBpZiAoKGRpciA9PSBDbGlwcGVyTGliLkRpcmVjdGlvbi5kTGVmdFRvUmlnaHQgJiYgZS5DdXJyLlggPD0gaG9yelJpZ2h0KSB8fCAoZGlyID09IENsaXBwZXJMaWIuRGlyZWN0aW9uLmRSaWdodFRvTGVmdCAmJiBlLkN1cnIuWCA+PSBob3J6TGVmdCkpXG4gICAgICAgIHtcbiAgICAgICAgICAvL3NvIGZhciB3ZSdyZSBzdGlsbCBpbiByYW5nZSBvZiB0aGUgaG9yaXpvbnRhbCBFZGdlICBidXQgbWFrZSBzdXJlXG4gICAgICAgICAgLy93ZSdyZSBhdCB0aGUgbGFzdCBvZiBjb25zZWMuIGhvcml6b250YWxzIHdoZW4gbWF0Y2hpbmcgd2l0aCBlTWF4UGFpclxuICAgICAgICAgIGlmIChlID09IGVNYXhQYWlyICYmIElzTGFzdEhvcnopXG4gICAgICAgICAge1xuXHRcdFx0XHRcdFx0aWYgKGhvcnpFZGdlLk91dElkeCA+PSAwKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHR2YXIgb3AxID0gdGhpcy5BZGRPdXRQdChob3J6RWRnZSwgaG9yekVkZ2UuVG9wKTtcblx0XHRcdFx0XHRcdFx0dmFyIGVOZXh0SG9yeiA9IHRoaXMubV9Tb3J0ZWRFZGdlcztcblx0XHRcdFx0XHRcdFx0d2hpbGUgKGVOZXh0SG9yeiAhPT0gbnVsbClcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGlmIChlTmV4dEhvcnouT3V0SWR4ID49IDAgJiZcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuSG9yelNlZ21lbnRzT3ZlcmxhcChob3J6RWRnZS5Cb3QuWCxcblx0XHRcdFx0XHRcdFx0XHRcdGhvcnpFZGdlLlRvcC5YLCBlTmV4dEhvcnouQm90LlgsIGVOZXh0SG9yei5Ub3AuWCkpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0dmFyIG9wMiA9IHRoaXMuQWRkT3V0UHQoZU5leHRIb3J6LCBlTmV4dEhvcnouQm90KTtcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuQWRkSm9pbihvcDIsIG9wMSwgZU5leHRIb3J6LlRvcCk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdGVOZXh0SG9yeiA9IGVOZXh0SG9yei5OZXh0SW5TRUw7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0dGhpcy5BZGRHaG9zdEpvaW4ob3AxLCBob3J6RWRnZS5Cb3QpO1xuXHRcdFx0XHRcdFx0XHR0aGlzLkFkZExvY2FsTWF4UG9seShob3J6RWRnZSwgZU1heFBhaXIsIGhvcnpFZGdlLlRvcCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR0aGlzLkRlbGV0ZUZyb21BRUwoaG9yekVkZ2UpO1xuXHRcdFx0XHRcdFx0dGhpcy5EZWxldGVGcm9tQUVMKGVNYXhQYWlyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoZGlyID09IENsaXBwZXJMaWIuRGlyZWN0aW9uLmRMZWZ0VG9SaWdodClcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2YXIgUHQgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChlLkN1cnIuWCwgaG9yekVkZ2UuQ3Vyci5ZKTtcbiAgICAgICAgICAgIHRoaXMuSW50ZXJzZWN0RWRnZXMoaG9yekVkZ2UsIGUsIFB0KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZhciBQdCA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KGUuQ3Vyci5YLCBob3J6RWRnZS5DdXJyLlkpO1xuICAgICAgICAgICAgdGhpcy5JbnRlcnNlY3RFZGdlcyhlLCBob3J6RWRnZSwgUHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLlN3YXBQb3NpdGlvbnNJbkFFTChob3J6RWRnZSwgZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoKGRpciA9PSBDbGlwcGVyTGliLkRpcmVjdGlvbi5kTGVmdFRvUmlnaHQgJiYgZS5DdXJyLlggPj0gaG9yelJpZ2h0KSB8fCAoZGlyID09IENsaXBwZXJMaWIuRGlyZWN0aW9uLmRSaWdodFRvTGVmdCAmJiBlLkN1cnIuWCA8PSBob3J6TGVmdCkpXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGUgPSBlTmV4dDtcbiAgICAgIH1cbiAgICAgIC8vZW5kIHdoaWxlXG4gICAgICBpZiAoaG9yekVkZ2UuTmV4dEluTE1MICE9PSBudWxsICYmIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuSXNIb3Jpem9udGFsKGhvcnpFZGdlLk5leHRJbkxNTCkpXG4gICAgICB7XG4gICAgICAgIGhvcnpFZGdlID0gdGhpcy5VcGRhdGVFZGdlSW50b0FFTChob3J6RWRnZSk7XG4gICAgICAgIGlmIChob3J6RWRnZS5PdXRJZHggPj0gMClcbiAgICAgICAgICB0aGlzLkFkZE91dFB0KGhvcnpFZGdlLCBob3J6RWRnZS5Cb3QpO1xuXG4gICAgICAgICAgdmFyICR2YXIgPSB7RGlyOiBkaXIsIExlZnQ6IGhvcnpMZWZ0LCBSaWdodDogaG9yelJpZ2h0fTtcbiAgICAgICAgICB0aGlzLkdldEhvcnpEaXJlY3Rpb24oaG9yekVkZ2UsICR2YXIpO1xuICAgICAgICAgIGRpciA9ICR2YXIuRGlyO1xuICAgICAgICAgIGhvcnpMZWZ0ID0gJHZhci5MZWZ0O1xuICAgICAgICAgIGhvcnpSaWdodCA9ICR2YXIuUmlnaHQ7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICAvL2VuZCBmb3IgKDs7KVxuICAgIGlmIChob3J6RWRnZS5OZXh0SW5MTUwgIT09IG51bGwpXG4gICAge1xuICAgICAgaWYgKGhvcnpFZGdlLk91dElkeCA+PSAwKVxuICAgICAge1xuICAgICAgICB2YXIgb3AxID0gdGhpcy5BZGRPdXRQdChob3J6RWRnZSwgaG9yekVkZ2UuVG9wKTtcblx0XHRcdFx0aWYgKGlzVG9wT2ZTY2FuYmVhbSkgdGhpcy5BZGRHaG9zdEpvaW4ob3AxLCBob3J6RWRnZS5Cb3QpO1xuICAgICAgICBob3J6RWRnZSA9IHRoaXMuVXBkYXRlRWRnZUludG9BRUwoaG9yekVkZ2UpO1xuICAgICAgICBpZiAoaG9yekVkZ2UuV2luZERlbHRhID09PSAwKVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgLy9uYjogSG9yekVkZ2UgaXMgbm8gbG9uZ2VyIGhvcml6b250YWwgaGVyZVxuICAgICAgICB2YXIgZVByZXYgPSBob3J6RWRnZS5QcmV2SW5BRUw7XG4gICAgICAgIHZhciBlTmV4dCA9IGhvcnpFZGdlLk5leHRJbkFFTDtcbiAgICAgICAgaWYgKGVQcmV2ICE9PSBudWxsICYmIGVQcmV2LkN1cnIuWCA9PSBob3J6RWRnZS5Cb3QuWCAmJlxuICAgICAgICAgIGVQcmV2LkN1cnIuWSA9PSBob3J6RWRnZS5Cb3QuWSAmJiBlUHJldi5XaW5kRGVsdGEgIT09IDAgJiZcbiAgICAgICAgICAoZVByZXYuT3V0SWR4ID49IDAgJiYgZVByZXYuQ3Vyci5ZID4gZVByZXYuVG9wLlkgJiZcbiAgICAgICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2xvcGVzRXF1YWwoaG9yekVkZ2UsIGVQcmV2LCB0aGlzLm1fVXNlRnVsbFJhbmdlKSkpXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgb3AyID0gdGhpcy5BZGRPdXRQdChlUHJldiwgaG9yekVkZ2UuQm90KTtcbiAgICAgICAgICB0aGlzLkFkZEpvaW4ob3AxLCBvcDIsIGhvcnpFZGdlLlRvcCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZU5leHQgIT09IG51bGwgJiYgZU5leHQuQ3Vyci5YID09IGhvcnpFZGdlLkJvdC5YICYmXG4gICAgICAgICAgZU5leHQuQ3Vyci5ZID09IGhvcnpFZGdlLkJvdC5ZICYmIGVOZXh0LldpbmREZWx0YSAhPT0gMCAmJlxuICAgICAgICAgIGVOZXh0Lk91dElkeCA+PSAwICYmIGVOZXh0LkN1cnIuWSA+IGVOZXh0LlRvcC5ZICYmXG4gICAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5TbG9wZXNFcXVhbChob3J6RWRnZSwgZU5leHQsIHRoaXMubV9Vc2VGdWxsUmFuZ2UpKVxuICAgICAgICB7XG4gICAgICAgICAgdmFyIG9wMiA9IHRoaXMuQWRkT3V0UHQoZU5leHQsIGhvcnpFZGdlLkJvdCk7XG4gICAgICAgICAgdGhpcy5BZGRKb2luKG9wMSwgb3AyLCBob3J6RWRnZS5Ub3ApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGhvcnpFZGdlID0gdGhpcy5VcGRhdGVFZGdlSW50b0FFTChob3J6RWRnZSk7XG4gICAgfVxuICBcdGVsc2VcbiAgICB7XG4gICAgICBpZiAoaG9yekVkZ2UuT3V0SWR4ID49IDApXG4gICAgICAgIHRoaXMuQWRkT3V0UHQoaG9yekVkZ2UsIGhvcnpFZGdlLlRvcCk7XG4gICAgICB0aGlzLkRlbGV0ZUZyb21BRUwoaG9yekVkZ2UpO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5HZXROZXh0SW5BRUwgPSBmdW5jdGlvbiAoZSwgRGlyZWN0aW9uKVxuICB7XG4gICAgcmV0dXJuIERpcmVjdGlvbiA9PSBDbGlwcGVyTGliLkRpcmVjdGlvbi5kTGVmdFRvUmlnaHQgPyBlLk5leHRJbkFFTCA6IGUuUHJldkluQUVMO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLklzTWluaW1hID0gZnVuY3Rpb24gKGUpXG4gIHtcbiAgICByZXR1cm4gZSAhPT0gbnVsbCAmJiAoZS5QcmV2Lk5leHRJbkxNTCAhPSBlKSAmJiAoZS5OZXh0Lk5leHRJbkxNTCAhPSBlKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Jc01heGltYSA9IGZ1bmN0aW9uIChlLCBZKVxuICB7XG4gICAgcmV0dXJuIChlICE9PSBudWxsICYmIGUuVG9wLlkgPT0gWSAmJiBlLk5leHRJbkxNTCA9PT0gbnVsbCk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuSXNJbnRlcm1lZGlhdGUgPSBmdW5jdGlvbiAoZSwgWSlcbiAge1xuICAgIHJldHVybiAoZS5Ub3AuWSA9PSBZICYmIGUuTmV4dEluTE1MICE9PSBudWxsKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5HZXRNYXhpbWFQYWlyID0gZnVuY3Rpb24gKGUpXG4gIHtcbiAgICB2YXIgcmVzdWx0ID0gbnVsbDtcbiAgICBpZiAoKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkoZS5OZXh0LlRvcCwgZS5Ub3ApKSAmJiBlLk5leHQuTmV4dEluTE1MID09PSBudWxsKVxuICAgICAgcmVzdWx0ID0gZS5OZXh0O1xuICAgIGVsc2UgaWYgKChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KGUuUHJldi5Ub3AsIGUuVG9wKSkgJiYgZS5QcmV2Lk5leHRJbkxNTCA9PT0gbnVsbClcbiAgICAgIHJlc3VsdCA9IGUuUHJldjtcbiAgICBpZiAocmVzdWx0ICE9PSBudWxsICYmIChyZXN1bHQuT3V0SWR4ID09IC0yIHx8IChyZXN1bHQuTmV4dEluQUVMID09IHJlc3VsdC5QcmV2SW5BRUwgJiYgIUNsaXBwZXJMaWIuQ2xpcHBlckJhc2UuSXNIb3Jpem9udGFsKHJlc3VsdCkpKSlcbiAgICAgIHJldHVybiBudWxsO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Qcm9jZXNzSW50ZXJzZWN0aW9ucyA9IGZ1bmN0aW9uICh0b3BZKVxuICB7XG4gICAgaWYgKHRoaXMubV9BY3RpdmVFZGdlcyA9PSBudWxsKVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgdHJ5XG4gICAge1xuICAgICAgdGhpcy5CdWlsZEludGVyc2VjdExpc3QodG9wWSk7XG4gICAgICBpZiAodGhpcy5tX0ludGVyc2VjdExpc3QubGVuZ3RoID09IDApXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgaWYgKHRoaXMubV9JbnRlcnNlY3RMaXN0Lmxlbmd0aCA9PSAxIHx8IHRoaXMuRml4dXBJbnRlcnNlY3Rpb25PcmRlcigpKVxuICAgICAgICB0aGlzLlByb2Nlc3NJbnRlcnNlY3RMaXN0KCk7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY2F0Y2ggKCQkZTIpXG4gICAge1xuICAgICAgdGhpcy5tX1NvcnRlZEVkZ2VzID0gbnVsbDtcbiAgICAgIHRoaXMubV9JbnRlcnNlY3RMaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBDbGlwcGVyTGliLkVycm9yKFwiUHJvY2Vzc0ludGVyc2VjdGlvbnMgZXJyb3JcIik7XG4gICAgfVxuICAgIHRoaXMubV9Tb3J0ZWRFZGdlcyA9IG51bGw7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuQnVpbGRJbnRlcnNlY3RMaXN0ID0gZnVuY3Rpb24gKHRvcFkpXG4gIHtcbiAgICBpZiAodGhpcy5tX0FjdGl2ZUVkZ2VzID09PSBudWxsKVxuICAgICAgcmV0dXJuO1xuICAgIC8vcHJlcGFyZSBmb3Igc29ydGluZyAuLi5cbiAgICB2YXIgZSA9IHRoaXMubV9BY3RpdmVFZGdlcztcbiAgICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KEpTT04uZGVjeWNsZSggZSApKSk7XG4gICAgdGhpcy5tX1NvcnRlZEVkZ2VzID0gZTtcbiAgICB3aGlsZSAoZSAhPT0gbnVsbClcbiAgICB7XG4gICAgICBlLlByZXZJblNFTCA9IGUuUHJldkluQUVMO1xuICAgICAgZS5OZXh0SW5TRUwgPSBlLk5leHRJbkFFTDtcbiAgICAgIGUuQ3Vyci5YID0gQ2xpcHBlckxpYi5DbGlwcGVyLlRvcFgoZSwgdG9wWSk7XG4gICAgICBlID0gZS5OZXh0SW5BRUw7XG4gICAgfVxuICAgIC8vYnViYmxlc29ydCAuLi5cbiAgICB2YXIgaXNNb2RpZmllZCA9IHRydWU7XG4gICAgd2hpbGUgKGlzTW9kaWZpZWQgJiYgdGhpcy5tX1NvcnRlZEVkZ2VzICE9PSBudWxsKVxuICAgIHtcbiAgICAgIGlzTW9kaWZpZWQgPSBmYWxzZTtcbiAgICAgIGUgPSB0aGlzLm1fU29ydGVkRWRnZXM7XG4gICAgICB3aGlsZSAoZS5OZXh0SW5TRUwgIT09IG51bGwpXG4gICAgICB7XG4gICAgICAgIHZhciBlTmV4dCA9IGUuTmV4dEluU0VMO1xuICAgICAgICB2YXIgcHQgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludCgpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwiZS5DdXJyLlg6IFwiICsgZS5DdXJyLlggKyBcIiBlTmV4dC5DdXJyLlhcIiArIGVOZXh0LkN1cnIuWCk7XG4gICAgICAgIGlmIChlLkN1cnIuWCA+IGVOZXh0LkN1cnIuWClcbiAgICAgICAge1xuXHRcdFx0XHRcdHRoaXMuSW50ZXJzZWN0UG9pbnQoZSwgZU5leHQsIHB0KTtcbiAgICAgICAgICB2YXIgbmV3Tm9kZSA9IG5ldyBDbGlwcGVyTGliLkludGVyc2VjdE5vZGUoKTtcbiAgICAgICAgICBuZXdOb2RlLkVkZ2UxID0gZTtcbiAgICAgICAgICBuZXdOb2RlLkVkZ2UyID0gZU5leHQ7XG4gICAgICAgICAgLy9uZXdOb2RlLlB0ID0gcHQ7XG4gICAgICAgICAgbmV3Tm9kZS5QdC5YID0gcHQuWDtcbiAgICAgICAgICBuZXdOb2RlLlB0LlkgPSBwdC5ZO1xuICAgICAgICAgIHRoaXMubV9JbnRlcnNlY3RMaXN0LnB1c2gobmV3Tm9kZSk7XG4gICAgICAgICAgdGhpcy5Td2FwUG9zaXRpb25zSW5TRUwoZSwgZU5leHQpO1xuICAgICAgICAgIGlzTW9kaWZpZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBlID0gZU5leHQ7XG4gICAgICB9XG4gICAgICBpZiAoZS5QcmV2SW5TRUwgIT09IG51bGwpXG4gICAgICAgIGUuUHJldkluU0VMLk5leHRJblNFTCA9IG51bGw7XG4gICAgICBlbHNlXG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICB0aGlzLm1fU29ydGVkRWRnZXMgPSBudWxsO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkVkZ2VzQWRqYWNlbnQgPSBmdW5jdGlvbiAoaW5vZGUpXG4gIHtcbiAgICByZXR1cm4gKGlub2RlLkVkZ2UxLk5leHRJblNFTCA9PSBpbm9kZS5FZGdlMikgfHwgKGlub2RlLkVkZ2UxLlByZXZJblNFTCA9PSBpbm9kZS5FZGdlMik7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5JbnRlcnNlY3ROb2RlU29ydCA9IGZ1bmN0aW9uIChub2RlMSwgbm9kZTIpXG4gIHtcbiAgICAvL3RoZSBmb2xsb3dpbmcgdHlwZWNhc3QgaXMgc2FmZSBiZWNhdXNlIHRoZSBkaWZmZXJlbmNlcyBpbiBQdC5ZIHdpbGxcbiAgICAvL2JlIGxpbWl0ZWQgdG8gdGhlIGhlaWdodCBvZiB0aGUgc2NhbmJlYW0uXG4gICAgcmV0dXJuIChub2RlMi5QdC5ZIC0gbm9kZTEuUHQuWSk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRml4dXBJbnRlcnNlY3Rpb25PcmRlciA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICAvL3ByZS1jb25kaXRpb246IGludGVyc2VjdGlvbnMgYXJlIHNvcnRlZCBib3R0b20tbW9zdCBmaXJzdC5cbiAgICAvL05vdyBpdCdzIGNydWNpYWwgdGhhdCBpbnRlcnNlY3Rpb25zIGFyZSBtYWRlIG9ubHkgYmV0d2VlbiBhZGphY2VudCBlZGdlcyxcbiAgICAvL3NvIHRvIGVuc3VyZSB0aGlzIHRoZSBvcmRlciBvZiBpbnRlcnNlY3Rpb25zIG1heSBuZWVkIGFkanVzdGluZyAuLi5cbiAgICB0aGlzLm1fSW50ZXJzZWN0TGlzdC5zb3J0KHRoaXMubV9JbnRlcnNlY3ROb2RlQ29tcGFyZXIpO1xuICAgIHRoaXMuQ29weUFFTFRvU0VMKCk7XG4gICAgdmFyIGNudCA9IHRoaXMubV9JbnRlcnNlY3RMaXN0Lmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNudDsgaSsrKVxuICAgIHtcbiAgICAgIGlmICghdGhpcy5FZGdlc0FkamFjZW50KHRoaXMubV9JbnRlcnNlY3RMaXN0W2ldKSlcbiAgICAgIHtcbiAgICAgICAgdmFyIGogPSBpICsgMTtcbiAgICAgICAgd2hpbGUgKGogPCBjbnQgJiYgIXRoaXMuRWRnZXNBZGphY2VudCh0aGlzLm1fSW50ZXJzZWN0TGlzdFtqXSkpXG4gICAgICAgICAgaisrO1xuICAgICAgICBpZiAoaiA9PSBjbnQpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB2YXIgdG1wID0gdGhpcy5tX0ludGVyc2VjdExpc3RbaV07XG4gICAgICAgIHRoaXMubV9JbnRlcnNlY3RMaXN0W2ldID0gdGhpcy5tX0ludGVyc2VjdExpc3Rbal07XG4gICAgICAgIHRoaXMubV9JbnRlcnNlY3RMaXN0W2pdID0gdG1wO1xuICAgICAgfVxuICAgICAgdGhpcy5Td2FwUG9zaXRpb25zSW5TRUwodGhpcy5tX0ludGVyc2VjdExpc3RbaV0uRWRnZTEsIHRoaXMubV9JbnRlcnNlY3RMaXN0W2ldLkVkZ2UyKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuUHJvY2Vzc0ludGVyc2VjdExpc3QgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlsZW4gPSB0aGlzLm1fSW50ZXJzZWN0TGlzdC5sZW5ndGg7IGkgPCBpbGVuOyBpKyspXG4gICAge1xuICAgICAgdmFyIGlOb2RlID0gdGhpcy5tX0ludGVyc2VjdExpc3RbaV07XG4gICAgICB0aGlzLkludGVyc2VjdEVkZ2VzKGlOb2RlLkVkZ2UxLCBpTm9kZS5FZGdlMiwgaU5vZGUuUHQpO1xuICAgICAgdGhpcy5Td2FwUG9zaXRpb25zSW5BRUwoaU5vZGUuRWRnZTEsIGlOb2RlLkVkZ2UyKTtcbiAgICB9XG4gICAgdGhpcy5tX0ludGVyc2VjdExpc3QubGVuZ3RoID0gMDtcbiAgfTtcbiAgLypcbiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgUm91bmQgc3BlZWR0ZXN0OiBodHRwOi8vanNwZXJmLmNvbS9mYXN0ZXN0LXJvdW5kXG4gIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICovXG4gIHZhciBSMSA9IGZ1bmN0aW9uIChhKVxuICB7XG4gICAgcmV0dXJuIGEgPCAwID8gTWF0aC5jZWlsKGEgLSAwLjUpIDogTWF0aC5yb3VuZChhKVxuICB9O1xuICB2YXIgUjIgPSBmdW5jdGlvbiAoYSlcbiAge1xuICAgIHJldHVybiBhIDwgMCA/IE1hdGguY2VpbChhIC0gMC41KSA6IE1hdGguZmxvb3IoYSArIDAuNSlcbiAgfTtcbiAgdmFyIFIzID0gZnVuY3Rpb24gKGEpXG4gIHtcbiAgICByZXR1cm4gYSA8IDAgPyAtTWF0aC5yb3VuZChNYXRoLmFicyhhKSkgOiBNYXRoLnJvdW5kKGEpXG4gIH07XG4gIHZhciBSNCA9IGZ1bmN0aW9uIChhKVxuICB7XG4gICAgaWYgKGEgPCAwKVxuICAgIHtcbiAgICAgIGEgLT0gMC41O1xuICAgICAgcmV0dXJuIGEgPCAtMjE0NzQ4MzY0OCA/IE1hdGguY2VpbChhKSA6IGEgfCAwO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgYSArPSAwLjU7XG4gICAgICByZXR1cm4gYSA+IDIxNDc0ODM2NDcgPyBNYXRoLmZsb29yKGEpIDogYSB8IDA7XG4gICAgfVxuICB9O1xuICBpZiAoYnJvd3Nlci5tc2llKSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQgPSBSMTtcbiAgZWxzZSBpZiAoYnJvd3Nlci5jaHJvbWl1bSkgQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kID0gUjM7XG4gIGVsc2UgaWYgKGJyb3dzZXIuc2FmYXJpKSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQgPSBSNDtcbiAgZWxzZSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQgPSBSMjsgLy8gZWcuIGJyb3dzZXIuY2hyb21lIHx8IGJyb3dzZXIuZmlyZWZveCB8fCBicm93c2VyLm9wZXJhXG4gIENsaXBwZXJMaWIuQ2xpcHBlci5Ub3BYID0gZnVuY3Rpb24gKGVkZ2UsIGN1cnJlbnRZKVxuICB7XG4gICAgLy9pZiAoZWRnZS5Cb3QgPT0gZWRnZS5DdXJyKSBhbGVydCAoXCJlZGdlLkJvdCA9IGVkZ2UuQ3VyclwiKTtcbiAgICAvL2lmIChlZGdlLkJvdCA9PSBlZGdlLlRvcCkgYWxlcnQgKFwiZWRnZS5Cb3QgPSBlZGdlLlRvcFwiKTtcbiAgICBpZiAoY3VycmVudFkgPT0gZWRnZS5Ub3AuWSlcbiAgICAgIHJldHVybiBlZGdlLlRvcC5YO1xuICAgIHJldHVybiBlZGdlLkJvdC5YICsgQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kKGVkZ2UuRHggKiAoY3VycmVudFkgLSBlZGdlLkJvdC5ZKSk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuSW50ZXJzZWN0UG9pbnQgPSBmdW5jdGlvbiAoZWRnZTEsIGVkZ2UyLCBpcClcbiAge1xuICAgIGlwLlggPSAwO1xuICAgIGlwLlkgPSAwO1xuICAgIHZhciBiMSwgYjI7XG4gICAgLy9uYjogd2l0aCB2ZXJ5IGxhcmdlIGNvb3JkaW5hdGUgdmFsdWVzLCBpdCdzIHBvc3NpYmxlIGZvciBTbG9wZXNFcXVhbCgpIHRvXG4gICAgLy9yZXR1cm4gZmFsc2UgYnV0IGZvciB0aGUgZWRnZS5EeCB2YWx1ZSBiZSBlcXVhbCBkdWUgdG8gZG91YmxlIHByZWNpc2lvbiByb3VuZGluZy5cbiAgICBpZiAoZWRnZTEuRHggPT0gZWRnZTIuRHgpXG5cdFx0e1xuXHRcdFx0aXAuWSA9IGVkZ2UxLkN1cnIuWTtcblx0XHRcdGlwLlggPSBDbGlwcGVyTGliLkNsaXBwZXIuVG9wWChlZGdlMSwgaXAuWSk7XG5cdFx0XHRyZXR1cm47XG4gICAgfVxuICAgIGlmIChlZGdlMS5EZWx0YS5YID09PSAwKVxuICAgIHtcbiAgICAgIGlwLlggPSBlZGdlMS5Cb3QuWDtcbiAgICAgIGlmIChDbGlwcGVyTGliLkNsaXBwZXJCYXNlLklzSG9yaXpvbnRhbChlZGdlMikpXG4gICAgICB7XG4gICAgICAgIGlwLlkgPSBlZGdlMi5Cb3QuWTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgYjIgPSBlZGdlMi5Cb3QuWSAtIChlZGdlMi5Cb3QuWCAvIGVkZ2UyLkR4KTtcbiAgICAgICAgaXAuWSA9IENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZChpcC5YIC8gZWRnZTIuRHggKyBiMik7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKGVkZ2UyLkRlbHRhLlggPT09IDApXG4gICAge1xuICAgICAgaXAuWCA9IGVkZ2UyLkJvdC5YO1xuICAgICAgaWYgKENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuSXNIb3Jpem9udGFsKGVkZ2UxKSlcbiAgICAgIHtcbiAgICAgICAgaXAuWSA9IGVkZ2UxLkJvdC5ZO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICBiMSA9IGVkZ2UxLkJvdC5ZIC0gKGVkZ2UxLkJvdC5YIC8gZWRnZTEuRHgpO1xuICAgICAgICBpcC5ZID0gQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kKGlwLlggLyBlZGdlMS5EeCArIGIxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIGIxID0gZWRnZTEuQm90LlggLSBlZGdlMS5Cb3QuWSAqIGVkZ2UxLkR4O1xuICAgICAgYjIgPSBlZGdlMi5Cb3QuWCAtIGVkZ2UyLkJvdC5ZICogZWRnZTIuRHg7XG4gICAgICB2YXIgcSA9IChiMiAtIGIxKSAvIChlZGdlMS5EeCAtIGVkZ2UyLkR4KTtcbiAgICAgIGlwLlkgPSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQocSk7XG4gICAgICBpZiAoTWF0aC5hYnMoZWRnZTEuRHgpIDwgTWF0aC5hYnMoZWRnZTIuRHgpKVxuICAgICAgICBpcC5YID0gQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kKGVkZ2UxLkR4ICogcSArIGIxKTtcbiAgICAgIGVsc2VcbiAgICAgICAgaXAuWCA9IENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZChlZGdlMi5EeCAqIHEgKyBiMik7XG4gICAgfVxuICAgIGlmIChpcC5ZIDwgZWRnZTEuVG9wLlkgfHwgaXAuWSA8IGVkZ2UyLlRvcC5ZKVxuICAgIHtcbiAgICAgIGlmIChlZGdlMS5Ub3AuWSA+IGVkZ2UyLlRvcC5ZKVxuICAgICAge1xuICAgICAgICBpcC5ZID0gZWRnZTEuVG9wLlk7XG4gICAgICAgIGlwLlggPSBDbGlwcGVyTGliLkNsaXBwZXIuVG9wWChlZGdlMiwgZWRnZTEuVG9wLlkpO1xuICAgICAgICByZXR1cm4gaXAuWCA8IGVkZ2UxLlRvcC5YO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAgICBpcC5ZID0gZWRnZTIuVG9wLlk7XG4gICAgICBpZiAoTWF0aC5hYnMoZWRnZTEuRHgpIDwgTWF0aC5hYnMoZWRnZTIuRHgpKVxuICAgICAgICBpcC5YID0gQ2xpcHBlckxpYi5DbGlwcGVyLlRvcFgoZWRnZTEsIGlwLlkpO1xuICAgICAgZWxzZVxuICAgICAgICBpcC5YID0gQ2xpcHBlckxpYi5DbGlwcGVyLlRvcFgoZWRnZTIsIGlwLlkpO1xuICAgIH1cblx0XHQvL2ZpbmFsbHksIGRvbid0IGFsbG93ICdpcCcgdG8gYmUgQkVMT1cgY3Vyci5ZIChpZSBib3R0b20gb2Ygc2NhbmJlYW0pIC4uLlxuXHRcdGlmIChpcC5ZID4gZWRnZTEuQ3Vyci5ZKVxuXHRcdHtcblx0XHRcdGlwLlkgPSBlZGdlMS5DdXJyLlk7XG5cdFx0XHQvL2JldHRlciB0byB1c2UgdGhlIG1vcmUgdmVydGljYWwgZWRnZSB0byBkZXJpdmUgWCAuLi5cblx0XHRcdGlmIChNYXRoLmFicyhlZGdlMS5EeCkgPiBNYXRoLmFicyhlZGdlMi5EeCkpXG5cdFx0XHRcdGlwLlggPSBDbGlwcGVyTGliLkNsaXBwZXIuVG9wWChlZGdlMiwgaXAuWSk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdGlwLlggPSBDbGlwcGVyTGliLkNsaXBwZXIuVG9wWChlZGdlMSwgaXAuWSk7XG5cdFx0fVxuICB9O1xuXG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuUHJvY2Vzc0VkZ2VzQXRUb3BPZlNjYW5iZWFtID0gZnVuY3Rpb24gKHRvcFkpXG4gIHtcbiAgICB2YXIgZSA9IHRoaXMubV9BY3RpdmVFZGdlcztcbiAgICB3aGlsZSAoZSAhPT0gbnVsbClcbiAgICB7XG4gICAgICAvLzEuIHByb2Nlc3MgbWF4aW1hLCB0cmVhdGluZyB0aGVtIGFzIGlmIHRoZXkncmUgJ2JlbnQnIGhvcml6b250YWwgZWRnZXMsXG4gICAgICAvLyAgIGJ1dCBleGNsdWRlIG1heGltYSB3aXRoIGhvcml6b250YWwgZWRnZXMuIG5iOiBlIGNhbid0IGJlIGEgaG9yaXpvbnRhbC5cbiAgICAgIHZhciBJc01heGltYUVkZ2UgPSB0aGlzLklzTWF4aW1hKGUsIHRvcFkpO1xuICAgICAgaWYgKElzTWF4aW1hRWRnZSlcbiAgICAgIHtcbiAgICAgICAgdmFyIGVNYXhQYWlyID0gdGhpcy5HZXRNYXhpbWFQYWlyKGUpO1xuICAgICAgICBJc01heGltYUVkZ2UgPSAoZU1heFBhaXIgPT09IG51bGwgfHwgIUNsaXBwZXJMaWIuQ2xpcHBlckJhc2UuSXNIb3Jpem9udGFsKGVNYXhQYWlyKSk7XG4gICAgICB9XG4gICAgICBpZiAoSXNNYXhpbWFFZGdlKVxuICAgICAge1xuICAgICAgICB2YXIgZVByZXYgPSBlLlByZXZJbkFFTDtcbiAgICAgICAgdGhpcy5Eb01heGltYShlKTtcbiAgICAgICAgaWYgKGVQcmV2ID09PSBudWxsKVxuICAgICAgICAgIGUgPSB0aGlzLm1fQWN0aXZlRWRnZXM7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBlID0gZVByZXYuTmV4dEluQUVMO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICAvLzIuIHByb21vdGUgaG9yaXpvbnRhbCBlZGdlcywgb3RoZXJ3aXNlIHVwZGF0ZSBDdXJyLlggYW5kIEN1cnIuWSAuLi5cbiAgICAgICAgaWYgKHRoaXMuSXNJbnRlcm1lZGlhdGUoZSwgdG9wWSkgJiYgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Jc0hvcml6b250YWwoZS5OZXh0SW5MTUwpKVxuICAgICAgICB7XG4gICAgICAgICAgZSA9IHRoaXMuVXBkYXRlRWRnZUludG9BRUwoZSk7XG4gICAgICAgICAgaWYgKGUuT3V0SWR4ID49IDApXG4gICAgICAgICAgICB0aGlzLkFkZE91dFB0KGUsIGUuQm90KTtcbiAgICAgICAgICB0aGlzLkFkZEVkZ2VUb1NFTChlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICBlLkN1cnIuWCA9IENsaXBwZXJMaWIuQ2xpcHBlci5Ub3BYKGUsIHRvcFkpO1xuICAgICAgICAgIGUuQ3Vyci5ZID0gdG9wWTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5TdHJpY3RseVNpbXBsZSlcbiAgICAgICAge1xuICAgICAgICAgIHZhciBlUHJldiA9IGUuUHJldkluQUVMO1xuICAgICAgICAgIGlmICgoZS5PdXRJZHggPj0gMCkgJiYgKGUuV2luZERlbHRhICE9PSAwKSAmJiBlUHJldiAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgKGVQcmV2Lk91dElkeCA+PSAwKSAmJiAoZVByZXYuQ3Vyci5YID09IGUuQ3Vyci5YKSAmJlxuICAgICAgICAgICAgKGVQcmV2LldpbmREZWx0YSAhPT0gMCkpXG4gICAgICAgICAge1xuICAgICAgICAgICBcdHZhciBpcCA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KGUuQ3Vycik7XG5cblx0XHRcdFx0XHRcdGlmKHVzZV94eXopXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHRoaXMuU2V0WihpcCwgZVByZXYsIGUpO1xuXHRcdFx0XHRcdFx0fVxuXG4gICAgICAgICAgICB2YXIgb3AgPSB0aGlzLkFkZE91dFB0KGVQcmV2LCBpcCk7XG4gICAgICAgICAgICB2YXIgb3AyID0gdGhpcy5BZGRPdXRQdChlLCBpcCk7XG4gICAgICAgICAgICB0aGlzLkFkZEpvaW4ob3AsIG9wMiwgaXApO1xuICAgICAgICAgICAgLy9TdHJpY3RseVNpbXBsZSAodHlwZS0zKSBqb2luXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGUgPSBlLk5leHRJbkFFTDtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8zLiBQcm9jZXNzIGhvcml6b250YWxzIGF0IHRoZSBUb3Agb2YgdGhlIHNjYW5iZWFtIC4uLlxuICAgIHRoaXMuUHJvY2Vzc0hvcml6b250YWxzKHRydWUpO1xuICAgIC8vNC4gUHJvbW90ZSBpbnRlcm1lZGlhdGUgdmVydGljZXMgLi4uXG4gICAgZSA9IHRoaXMubV9BY3RpdmVFZGdlcztcbiAgICB3aGlsZSAoZSAhPT0gbnVsbClcbiAgICB7XG4gICAgICBpZiAodGhpcy5Jc0ludGVybWVkaWF0ZShlLCB0b3BZKSlcbiAgICAgIHtcbiAgICAgICAgdmFyIG9wID0gbnVsbDtcbiAgICAgICAgaWYgKGUuT3V0SWR4ID49IDApXG4gICAgICAgICAgb3AgPSB0aGlzLkFkZE91dFB0KGUsIGUuVG9wKTtcbiAgICAgICAgZSA9IHRoaXMuVXBkYXRlRWRnZUludG9BRUwoZSk7XG4gICAgICAgIC8vaWYgb3V0cHV0IHBvbHlnb25zIHNoYXJlIGFuIGVkZ2UsIHRoZXknbGwgbmVlZCBqb2luaW5nIGxhdGVyIC4uLlxuICAgICAgICB2YXIgZVByZXYgPSBlLlByZXZJbkFFTDtcbiAgICAgICAgdmFyIGVOZXh0ID0gZS5OZXh0SW5BRUw7XG4gICAgICAgIGlmIChlUHJldiAhPT0gbnVsbCAmJiBlUHJldi5DdXJyLlggPT0gZS5Cb3QuWCAmJlxuICAgICAgICAgIGVQcmV2LkN1cnIuWSA9PSBlLkJvdC5ZICYmIG9wICE9PSBudWxsICYmXG4gICAgICAgICAgZVByZXYuT3V0SWR4ID49IDAgJiYgZVByZXYuQ3Vyci5ZID4gZVByZXYuVG9wLlkgJiZcbiAgICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNsb3Blc0VxdWFsKGUsIGVQcmV2LCB0aGlzLm1fVXNlRnVsbFJhbmdlKSAmJlxuICAgICAgICAgIChlLldpbmREZWx0YSAhPT0gMCkgJiYgKGVQcmV2LldpbmREZWx0YSAhPT0gMCkpXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgb3AyID0gdGhpcy5BZGRPdXRQdChlUHJldiwgZS5Cb3QpO1xuICAgICAgICAgIHRoaXMuQWRkSm9pbihvcCwgb3AyLCBlLlRvcCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZU5leHQgIT09IG51bGwgJiYgZU5leHQuQ3Vyci5YID09IGUuQm90LlggJiZcbiAgICAgICAgICBlTmV4dC5DdXJyLlkgPT0gZS5Cb3QuWSAmJiBvcCAhPT0gbnVsbCAmJlxuICAgICAgICAgIGVOZXh0Lk91dElkeCA+PSAwICYmIGVOZXh0LkN1cnIuWSA+IGVOZXh0LlRvcC5ZICYmXG4gICAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5TbG9wZXNFcXVhbChlLCBlTmV4dCwgdGhpcy5tX1VzZUZ1bGxSYW5nZSkgJiZcbiAgICAgICAgICAoZS5XaW5kRGVsdGEgIT09IDApICYmIChlTmV4dC5XaW5kRGVsdGEgIT09IDApKVxuICAgICAgICB7XG4gICAgICAgICAgdmFyIG9wMiA9IHRoaXMuQWRkT3V0UHQoZU5leHQsIGUuQm90KTtcbiAgICAgICAgICB0aGlzLkFkZEpvaW4ob3AsIG9wMiwgZS5Ub3ApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlID0gZS5OZXh0SW5BRUw7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkRvTWF4aW1hID0gZnVuY3Rpb24gKGUpXG4gIHtcbiAgICB2YXIgZU1heFBhaXIgPSB0aGlzLkdldE1heGltYVBhaXIoZSk7XG4gICAgaWYgKGVNYXhQYWlyID09PSBudWxsKVxuICAgIHtcbiAgICAgIGlmIChlLk91dElkeCA+PSAwKVxuICAgICAgICB0aGlzLkFkZE91dFB0KGUsIGUuVG9wKTtcbiAgICAgIHRoaXMuRGVsZXRlRnJvbUFFTChlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGVOZXh0ID0gZS5OZXh0SW5BRUw7XG4gICAgdmFyIHVzZV9saW5lcyA9IHRydWU7XG4gICAgd2hpbGUgKGVOZXh0ICE9PSBudWxsICYmIGVOZXh0ICE9IGVNYXhQYWlyKVxuICAgIHtcbiAgICAgIHRoaXMuSW50ZXJzZWN0RWRnZXMoZSwgZU5leHQsIGUuVG9wKTtcbiAgICAgIHRoaXMuU3dhcFBvc2l0aW9uc0luQUVMKGUsIGVOZXh0KTtcbiAgICAgIGVOZXh0ID0gZS5OZXh0SW5BRUw7XG4gICAgfVxuICAgIGlmIChlLk91dElkeCA9PSAtMSAmJiBlTWF4UGFpci5PdXRJZHggPT0gLTEpXG4gICAge1xuICAgICAgdGhpcy5EZWxldGVGcm9tQUVMKGUpO1xuICAgICAgdGhpcy5EZWxldGVGcm9tQUVMKGVNYXhQYWlyKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoZS5PdXRJZHggPj0gMCAmJiBlTWF4UGFpci5PdXRJZHggPj0gMClcbiAgICB7XG4gICAgXHRpZiAoZS5PdXRJZHggPj0gMCkgdGhpcy5BZGRMb2NhbE1heFBvbHkoZSwgZU1heFBhaXIsIGUuVG9wKTtcbiAgICAgIHRoaXMuRGVsZXRlRnJvbUFFTChlKTtcbiAgICAgIHRoaXMuRGVsZXRlRnJvbUFFTChlTWF4UGFpcik7XG4gICAgfVxuICAgIGVsc2UgaWYgKHVzZV9saW5lcyAmJiBlLldpbmREZWx0YSA9PT0gMClcbiAgICB7XG4gICAgICBpZiAoZS5PdXRJZHggPj0gMClcbiAgICAgIHtcbiAgICAgICAgdGhpcy5BZGRPdXRQdChlLCBlLlRvcCk7XG4gICAgICAgIGUuT3V0SWR4ID0gLTE7XG4gICAgICB9XG4gICAgICB0aGlzLkRlbGV0ZUZyb21BRUwoZSk7XG4gICAgICBpZiAoZU1heFBhaXIuT3V0SWR4ID49IDApXG4gICAgICB7XG4gICAgICAgIHRoaXMuQWRkT3V0UHQoZU1heFBhaXIsIGUuVG9wKTtcbiAgICAgICAgZU1heFBhaXIuT3V0SWR4ID0gLTE7XG4gICAgICB9XG4gICAgICB0aGlzLkRlbGV0ZUZyb21BRUwoZU1heFBhaXIpO1xuICAgIH1cbiAgICBlbHNlXG4gICAgICBDbGlwcGVyTGliLkVycm9yKFwiRG9NYXhpbWEgZXJyb3JcIik7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5SZXZlcnNlUGF0aHMgPSBmdW5jdGlvbiAocG9seXMpXG4gIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gcG9seXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspXG4gICAgICBwb2x5c1tpXS5yZXZlcnNlKCk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5PcmllbnRhdGlvbiA9IGZ1bmN0aW9uIChwb2x5KVxuICB7XG4gICAgcmV0dXJuIENsaXBwZXJMaWIuQ2xpcHBlci5BcmVhKHBvbHkpID49IDA7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuUG9pbnRDb3VudCA9IGZ1bmN0aW9uIChwdHMpXG4gIHtcbiAgICBpZiAocHRzID09PSBudWxsKVxuICAgICAgcmV0dXJuIDA7XG4gICAgdmFyIHJlc3VsdCA9IDA7XG4gICAgdmFyIHAgPSBwdHM7XG4gICAgZG8ge1xuICAgICAgcmVzdWx0Kys7XG4gICAgICBwID0gcC5OZXh0O1xuICAgIH1cbiAgICB3aGlsZSAocCAhPSBwdHMpXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5CdWlsZFJlc3VsdCA9IGZ1bmN0aW9uIChwb2x5ZylcbiAge1xuICAgIENsaXBwZXJMaWIuQ2xlYXIocG9seWcpO1xuICAgIGZvciAodmFyIGkgPSAwLCBpbGVuID0gdGhpcy5tX1BvbHlPdXRzLmxlbmd0aDsgaSA8IGlsZW47IGkrKylcbiAgICB7XG4gICAgICB2YXIgb3V0UmVjID0gdGhpcy5tX1BvbHlPdXRzW2ldO1xuICAgICAgaWYgKG91dFJlYy5QdHMgPT09IG51bGwpXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgdmFyIHAgPSBvdXRSZWMuUHRzLlByZXY7XG4gICAgICB2YXIgY250ID0gdGhpcy5Qb2ludENvdW50KHApO1xuICAgICAgaWYgKGNudCA8IDIpXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgdmFyIHBnID0gbmV3IEFycmF5KGNudCk7XG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNudDsgaisrKVxuICAgICAge1xuICAgICAgICBwZ1tqXSA9IHAuUHQ7XG4gICAgICAgIHAgPSBwLlByZXY7XG4gICAgICB9XG4gICAgICBwb2x5Zy5wdXNoKHBnKTtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuQnVpbGRSZXN1bHQyID0gZnVuY3Rpb24gKHBvbHl0cmVlKVxuICB7XG4gICAgcG9seXRyZWUuQ2xlYXIoKTtcbiAgICAvL2FkZCBlYWNoIG91dHB1dCBwb2x5Z29uL2NvbnRvdXIgdG8gcG9seXRyZWUgLi4uXG4gICAgLy9wb2x5dHJlZS5tX0FsbFBvbHlzLnNldF9DYXBhY2l0eSh0aGlzLm1fUG9seU91dHMubGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgaWxlbiA9IHRoaXMubV9Qb2x5T3V0cy5sZW5ndGg7IGkgPCBpbGVuOyBpKyspXG4gICAge1xuICAgICAgdmFyIG91dFJlYyA9IHRoaXMubV9Qb2x5T3V0c1tpXTtcbiAgICAgIHZhciBjbnQgPSB0aGlzLlBvaW50Q291bnQob3V0UmVjLlB0cyk7XG4gICAgICBpZiAoKG91dFJlYy5Jc09wZW4gJiYgY250IDwgMikgfHwgKCFvdXRSZWMuSXNPcGVuICYmIGNudCA8IDMpKVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIHRoaXMuRml4SG9sZUxpbmthZ2Uob3V0UmVjKTtcbiAgICAgIHZhciBwbiA9IG5ldyBDbGlwcGVyTGliLlBvbHlOb2RlKCk7XG4gICAgICBwb2x5dHJlZS5tX0FsbFBvbHlzLnB1c2gocG4pO1xuICAgICAgb3V0UmVjLlBvbHlOb2RlID0gcG47XG4gICAgICBwbi5tX3BvbHlnb24ubGVuZ3RoID0gY250O1xuICAgICAgdmFyIG9wID0gb3V0UmVjLlB0cy5QcmV2O1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjbnQ7IGorKylcbiAgICAgIHtcbiAgICAgICAgcG4ubV9wb2x5Z29uW2pdID0gb3AuUHQ7XG4gICAgICAgIG9wID0gb3AuUHJldjtcbiAgICAgIH1cbiAgICB9XG4gICAgLy9maXh1cCBQb2x5Tm9kZSBsaW5rcyBldGMgLi4uXG4gICAgLy9wb2x5dHJlZS5tX0NoaWxkcy5zZXRfQ2FwYWNpdHkodGhpcy5tX1BvbHlPdXRzLmxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlsZW4gPSB0aGlzLm1fUG9seU91dHMubGVuZ3RoOyBpIDwgaWxlbjsgaSsrKVxuICAgIHtcbiAgICAgIHZhciBvdXRSZWMgPSB0aGlzLm1fUG9seU91dHNbaV07XG4gICAgICBpZiAob3V0UmVjLlBvbHlOb2RlID09PSBudWxsKVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIGVsc2UgaWYgKG91dFJlYy5Jc09wZW4pXG4gICAgICB7XG4gICAgICAgIG91dFJlYy5Qb2x5Tm9kZS5Jc09wZW4gPSB0cnVlO1xuICAgICAgICBwb2x5dHJlZS5BZGRDaGlsZChvdXRSZWMuUG9seU5vZGUpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAob3V0UmVjLkZpcnN0TGVmdCAhPT0gbnVsbCAmJiBvdXRSZWMuRmlyc3RMZWZ0LlBvbHlOb2RlICE9IG51bGwpXG4gICAgICAgIG91dFJlYy5GaXJzdExlZnQuUG9seU5vZGUuQWRkQ2hpbGQob3V0UmVjLlBvbHlOb2RlKTtcbiAgICAgIGVsc2VcbiAgICAgICAgcG9seXRyZWUuQWRkQ2hpbGQob3V0UmVjLlBvbHlOb2RlKTtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRml4dXBPdXRQb2x5Z29uID0gZnVuY3Rpb24gKG91dFJlYylcbiAge1xuICAgIC8vRml4dXBPdXRQb2x5Z29uKCkgLSByZW1vdmVzIGR1cGxpY2F0ZSBwb2ludHMgYW5kIHNpbXBsaWZpZXMgY29uc2VjdXRpdmVcbiAgICAvL3BhcmFsbGVsIGVkZ2VzIGJ5IHJlbW92aW5nIHRoZSBtaWRkbGUgdmVydGV4LlxuICAgIHZhciBsYXN0T0sgPSBudWxsO1xuICAgIG91dFJlYy5Cb3R0b21QdCA9IG51bGw7XG4gICAgdmFyIHBwID0gb3V0UmVjLlB0cztcbiAgICBmb3IgKDs7KVxuICAgIHtcbiAgICAgIGlmIChwcC5QcmV2ID09IHBwIHx8IHBwLlByZXYgPT0gcHAuTmV4dClcbiAgICAgIHtcbiAgICAgICAgb3V0UmVjLlB0cyA9IG51bGw7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vdGVzdCBmb3IgZHVwbGljYXRlIHBvaW50cyBhbmQgY29sbGluZWFyIGVkZ2VzIC4uLlxuICAgICAgaWYgKChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHBwLlB0LCBwcC5OZXh0LlB0KSkgfHwgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocHAuUHQsIHBwLlByZXYuUHQpKSB8fFxuICAgICAgICAoQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5TbG9wZXNFcXVhbChwcC5QcmV2LlB0LCBwcC5QdCwgcHAuTmV4dC5QdCwgdGhpcy5tX1VzZUZ1bGxSYW5nZSkgJiZcbiAgICAgICAgICAoIXRoaXMuUHJlc2VydmVDb2xsaW5lYXIgfHwgIXRoaXMuUHQySXNCZXR3ZWVuUHQxQW5kUHQzKHBwLlByZXYuUHQsIHBwLlB0LCBwcC5OZXh0LlB0KSkpKVxuICAgICAge1xuICAgICAgICBsYXN0T0sgPSBudWxsO1xuICAgICAgICBwcC5QcmV2Lk5leHQgPSBwcC5OZXh0O1xuICAgICAgICBwcC5OZXh0LlByZXYgPSBwcC5QcmV2O1xuICAgICAgICBwcCA9IHBwLlByZXY7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChwcCA9PSBsYXN0T0spXG4gICAgICAgIGJyZWFrO1xuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICBpZiAobGFzdE9LID09PSBudWxsKVxuICAgICAgICAgIGxhc3RPSyA9IHBwO1xuICAgICAgICBwcCA9IHBwLk5leHQ7XG4gICAgICB9XG4gICAgfVxuICAgIG91dFJlYy5QdHMgPSBwcDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5EdXBPdXRQdCA9IGZ1bmN0aW9uIChvdXRQdCwgSW5zZXJ0QWZ0ZXIpXG4gIHtcbiAgICB2YXIgcmVzdWx0ID0gbmV3IENsaXBwZXJMaWIuT3V0UHQoKTtcbiAgICAvL3Jlc3VsdC5QdCA9IG91dFB0LlB0O1xuICAgIHJlc3VsdC5QdC5YID0gb3V0UHQuUHQuWDtcbiAgICByZXN1bHQuUHQuWSA9IG91dFB0LlB0Llk7XG4gICAgcmVzdWx0LklkeCA9IG91dFB0LklkeDtcbiAgICBpZiAoSW5zZXJ0QWZ0ZXIpXG4gICAge1xuICAgICAgcmVzdWx0Lk5leHQgPSBvdXRQdC5OZXh0O1xuICAgICAgcmVzdWx0LlByZXYgPSBvdXRQdDtcbiAgICAgIG91dFB0Lk5leHQuUHJldiA9IHJlc3VsdDtcbiAgICAgIG91dFB0Lk5leHQgPSByZXN1bHQ7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICByZXN1bHQuUHJldiA9IG91dFB0LlByZXY7XG4gICAgICByZXN1bHQuTmV4dCA9IG91dFB0O1xuICAgICAgb3V0UHQuUHJldi5OZXh0ID0gcmVzdWx0O1xuICAgICAgb3V0UHQuUHJldiA9IHJlc3VsdDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5HZXRPdmVybGFwID0gZnVuY3Rpb24gKGExLCBhMiwgYjEsIGIyLCAkdmFsKVxuICB7XG4gICAgaWYgKGExIDwgYTIpXG4gICAge1xuICAgICAgaWYgKGIxIDwgYjIpXG4gICAgICB7XG4gICAgICAgICR2YWwuTGVmdCA9IE1hdGgubWF4KGExLCBiMSk7XG4gICAgICAgICR2YWwuUmlnaHQgPSBNYXRoLm1pbihhMiwgYjIpO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICAkdmFsLkxlZnQgPSBNYXRoLm1heChhMSwgYjIpO1xuICAgICAgICAkdmFsLlJpZ2h0ID0gTWF0aC5taW4oYTIsIGIxKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIGlmIChiMSA8IGIyKVxuICAgICAge1xuICAgICAgICAkdmFsLkxlZnQgPSBNYXRoLm1heChhMiwgYjEpO1xuICAgICAgICAkdmFsLlJpZ2h0ID0gTWF0aC5taW4oYTEsIGIyKTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgJHZhbC5MZWZ0ID0gTWF0aC5tYXgoYTIsIGIyKTtcbiAgICAgICAgJHZhbC5SaWdodCA9IE1hdGgubWluKGExLCBiMSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAkdmFsLkxlZnQgPCAkdmFsLlJpZ2h0O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkpvaW5Ib3J6ID0gZnVuY3Rpb24gKG9wMSwgb3AxYiwgb3AyLCBvcDJiLCBQdCwgRGlzY2FyZExlZnQpXG4gIHtcbiAgICB2YXIgRGlyMSA9IChvcDEuUHQuWCA+IG9wMWIuUHQuWCA/IENsaXBwZXJMaWIuRGlyZWN0aW9uLmRSaWdodFRvTGVmdCA6IENsaXBwZXJMaWIuRGlyZWN0aW9uLmRMZWZ0VG9SaWdodCk7XG4gICAgdmFyIERpcjIgPSAob3AyLlB0LlggPiBvcDJiLlB0LlggPyBDbGlwcGVyTGliLkRpcmVjdGlvbi5kUmlnaHRUb0xlZnQgOiBDbGlwcGVyTGliLkRpcmVjdGlvbi5kTGVmdFRvUmlnaHQpO1xuICAgIGlmIChEaXIxID09IERpcjIpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgLy9XaGVuIERpc2NhcmRMZWZ0LCB3ZSB3YW50IE9wMWIgdG8gYmUgb24gdGhlIExlZnQgb2YgT3AxLCBvdGhlcndpc2Ugd2VcbiAgICAvL3dhbnQgT3AxYiB0byBiZSBvbiB0aGUgUmlnaHQuIChBbmQgbGlrZXdpc2Ugd2l0aCBPcDIgYW5kIE9wMmIuKVxuICAgIC8vU28sIHRvIGZhY2lsaXRhdGUgdGhpcyB3aGlsZSBpbnNlcnRpbmcgT3AxYiBhbmQgT3AyYiAuLi5cbiAgICAvL3doZW4gRGlzY2FyZExlZnQsIG1ha2Ugc3VyZSB3ZSdyZSBBVCBvciBSSUdIVCBvZiBQdCBiZWZvcmUgYWRkaW5nIE9wMWIsXG4gICAgLy9vdGhlcndpc2UgbWFrZSBzdXJlIHdlJ3JlIEFUIG9yIExFRlQgb2YgUHQuIChMaWtld2lzZSB3aXRoIE9wMmIuKVxuICAgIGlmIChEaXIxID09IENsaXBwZXJMaWIuRGlyZWN0aW9uLmRMZWZ0VG9SaWdodClcbiAgICB7XG4gICAgICB3aGlsZSAob3AxLk5leHQuUHQuWCA8PSBQdC5YICYmXG4gICAgICAgIG9wMS5OZXh0LlB0LlggPj0gb3AxLlB0LlggJiYgb3AxLk5leHQuUHQuWSA9PSBQdC5ZKVxuICAgICAgICBvcDEgPSBvcDEuTmV4dDtcbiAgICAgIGlmIChEaXNjYXJkTGVmdCAmJiAob3AxLlB0LlggIT0gUHQuWCkpXG4gICAgICAgIG9wMSA9IG9wMS5OZXh0O1xuICAgICAgb3AxYiA9IHRoaXMuRHVwT3V0UHQob3AxLCAhRGlzY2FyZExlZnQpO1xuICAgICAgaWYgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfSW5lcXVhbGl0eShvcDFiLlB0LCBQdCkpXG4gICAgICB7XG4gICAgICAgIG9wMSA9IG9wMWI7XG4gICAgICAgIC8vb3AxLlB0ID0gUHQ7XG4gICAgICAgIG9wMS5QdC5YID0gUHQuWDtcbiAgICAgICAgb3AxLlB0LlkgPSBQdC5ZO1xuICAgICAgICBvcDFiID0gdGhpcy5EdXBPdXRQdChvcDEsICFEaXNjYXJkTGVmdCk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICB3aGlsZSAob3AxLk5leHQuUHQuWCA+PSBQdC5YICYmXG4gICAgICAgIG9wMS5OZXh0LlB0LlggPD0gb3AxLlB0LlggJiYgb3AxLk5leHQuUHQuWSA9PSBQdC5ZKVxuICAgICAgICBvcDEgPSBvcDEuTmV4dDtcbiAgICAgIGlmICghRGlzY2FyZExlZnQgJiYgKG9wMS5QdC5YICE9IFB0LlgpKVxuICAgICAgICBvcDEgPSBvcDEuTmV4dDtcbiAgICAgIG9wMWIgPSB0aGlzLkR1cE91dFB0KG9wMSwgRGlzY2FyZExlZnQpO1xuICAgICAgaWYgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfSW5lcXVhbGl0eShvcDFiLlB0LCBQdCkpXG4gICAgICB7XG4gICAgICAgIG9wMSA9IG9wMWI7XG4gICAgICAgIC8vb3AxLlB0ID0gUHQ7XG4gICAgICAgIG9wMS5QdC5YID0gUHQuWDtcbiAgICAgICAgb3AxLlB0LlkgPSBQdC5ZO1xuICAgICAgICBvcDFiID0gdGhpcy5EdXBPdXRQdChvcDEsIERpc2NhcmRMZWZ0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKERpcjIgPT0gQ2xpcHBlckxpYi5EaXJlY3Rpb24uZExlZnRUb1JpZ2h0KVxuICAgIHtcbiAgICAgIHdoaWxlIChvcDIuTmV4dC5QdC5YIDw9IFB0LlggJiZcbiAgICAgICAgb3AyLk5leHQuUHQuWCA+PSBvcDIuUHQuWCAmJiBvcDIuTmV4dC5QdC5ZID09IFB0LlkpXG4gICAgICAgIG9wMiA9IG9wMi5OZXh0O1xuICAgICAgaWYgKERpc2NhcmRMZWZ0ICYmIChvcDIuUHQuWCAhPSBQdC5YKSlcbiAgICAgICAgb3AyID0gb3AyLk5leHQ7XG4gICAgICBvcDJiID0gdGhpcy5EdXBPdXRQdChvcDIsICFEaXNjYXJkTGVmdCk7XG4gICAgICBpZiAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9JbmVxdWFsaXR5KG9wMmIuUHQsIFB0KSlcbiAgICAgIHtcbiAgICAgICAgb3AyID0gb3AyYjtcbiAgICAgICAgLy9vcDIuUHQgPSBQdDtcbiAgICAgICAgb3AyLlB0LlggPSBQdC5YO1xuICAgICAgICBvcDIuUHQuWSA9IFB0Llk7XG4gICAgICAgIG9wMmIgPSB0aGlzLkR1cE91dFB0KG9wMiwgIURpc2NhcmRMZWZ0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIHdoaWxlIChvcDIuTmV4dC5QdC5YID49IFB0LlggJiZcbiAgICAgICAgb3AyLk5leHQuUHQuWCA8PSBvcDIuUHQuWCAmJiBvcDIuTmV4dC5QdC5ZID09IFB0LlkpXG4gICAgICAgIG9wMiA9IG9wMi5OZXh0O1xuICAgICAgaWYgKCFEaXNjYXJkTGVmdCAmJiAob3AyLlB0LlggIT0gUHQuWCkpXG4gICAgICAgIG9wMiA9IG9wMi5OZXh0O1xuICAgICAgb3AyYiA9IHRoaXMuRHVwT3V0UHQob3AyLCBEaXNjYXJkTGVmdCk7XG4gICAgICBpZiAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9JbmVxdWFsaXR5KG9wMmIuUHQsIFB0KSlcbiAgICAgIHtcbiAgICAgICAgb3AyID0gb3AyYjtcbiAgICAgICAgLy9vcDIuUHQgPSBQdDtcbiAgICAgICAgb3AyLlB0LlggPSBQdC5YO1xuICAgICAgICBvcDIuUHQuWSA9IFB0Llk7XG4gICAgICAgIG9wMmIgPSB0aGlzLkR1cE91dFB0KG9wMiwgRGlzY2FyZExlZnQpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoKERpcjEgPT0gQ2xpcHBlckxpYi5EaXJlY3Rpb24uZExlZnRUb1JpZ2h0KSA9PSBEaXNjYXJkTGVmdClcbiAgICB7XG4gICAgICBvcDEuUHJldiA9IG9wMjtcbiAgICAgIG9wMi5OZXh0ID0gb3AxO1xuICAgICAgb3AxYi5OZXh0ID0gb3AyYjtcbiAgICAgIG9wMmIuUHJldiA9IG9wMWI7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBvcDEuTmV4dCA9IG9wMjtcbiAgICAgIG9wMi5QcmV2ID0gb3AxO1xuICAgICAgb3AxYi5QcmV2ID0gb3AyYjtcbiAgICAgIG9wMmIuTmV4dCA9IG9wMWI7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkpvaW5Qb2ludHMgPSBmdW5jdGlvbiAoaiwgb3V0UmVjMSwgb3V0UmVjMilcbiAge1xuICAgIHZhciBvcDEgPSBqLk91dFB0MSxcbiAgICAgIG9wMWIgPSBuZXcgQ2xpcHBlckxpYi5PdXRQdCgpO1xuICAgIHZhciBvcDIgPSBqLk91dFB0MixcbiAgICAgIG9wMmIgPSBuZXcgQ2xpcHBlckxpYi5PdXRQdCgpO1xuICAgIC8vVGhlcmUgYXJlIDMga2luZHMgb2Ygam9pbnMgZm9yIG91dHB1dCBwb2x5Z29ucyAuLi5cbiAgICAvLzEuIEhvcml6b250YWwgam9pbnMgd2hlcmUgSm9pbi5PdXRQdDEgJiBKb2luLk91dFB0MiBhcmUgYSB2ZXJ0aWNlcyBhbnl3aGVyZVxuICAgIC8vYWxvbmcgKGhvcml6b250YWwpIGNvbGxpbmVhciBlZGdlcyAoJiBKb2luLk9mZlB0IGlzIG9uIHRoZSBzYW1lIGhvcml6b250YWwpLlxuICAgIC8vMi4gTm9uLWhvcml6b250YWwgam9pbnMgd2hlcmUgSm9pbi5PdXRQdDEgJiBKb2luLk91dFB0MiBhcmUgYXQgdGhlIHNhbWVcbiAgICAvL2xvY2F0aW9uIGF0IHRoZSBCb3R0b20gb2YgdGhlIG92ZXJsYXBwaW5nIHNlZ21lbnQgKCYgSm9pbi5PZmZQdCBpcyBhYm92ZSkuXG4gICAgLy8zLiBTdHJpY3RseVNpbXBsZSBqb2lucyB3aGVyZSBlZGdlcyB0b3VjaCBidXQgYXJlIG5vdCBjb2xsaW5lYXIgYW5kIHdoZXJlXG4gICAgLy9Kb2luLk91dFB0MSwgSm9pbi5PdXRQdDIgJiBKb2luLk9mZlB0IGFsbCBzaGFyZSB0aGUgc2FtZSBwb2ludC5cbiAgICB2YXIgaXNIb3Jpem9udGFsID0gKGouT3V0UHQxLlB0LlkgPT0gai5PZmZQdC5ZKTtcbiAgICBpZiAoaXNIb3Jpem9udGFsICYmIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KGouT2ZmUHQsIGouT3V0UHQxLlB0KSkgJiYgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkoai5PZmZQdCwgai5PdXRQdDIuUHQpKSlcbiAgICB7XG4gICAgICAvL1N0cmljdGx5IFNpbXBsZSBqb2luIC4uLlxuXHRcdFx0aWYgKG91dFJlYzEgIT0gb3V0UmVjMikgcmV0dXJuIGZhbHNlO1xuXG4gICAgICBvcDFiID0gai5PdXRQdDEuTmV4dDtcbiAgICAgIHdoaWxlIChvcDFiICE9IG9wMSAmJiAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShvcDFiLlB0LCBqLk9mZlB0KSkpXG4gICAgICAgIG9wMWIgPSBvcDFiLk5leHQ7XG4gICAgICB2YXIgcmV2ZXJzZTEgPSAob3AxYi5QdC5ZID4gai5PZmZQdC5ZKTtcbiAgICAgIG9wMmIgPSBqLk91dFB0Mi5OZXh0O1xuICAgICAgd2hpbGUgKG9wMmIgIT0gb3AyICYmIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KG9wMmIuUHQsIGouT2ZmUHQpKSlcbiAgICAgICAgb3AyYiA9IG9wMmIuTmV4dDtcbiAgICAgIHZhciByZXZlcnNlMiA9IChvcDJiLlB0LlkgPiBqLk9mZlB0LlkpO1xuICAgICAgaWYgKHJldmVyc2UxID09IHJldmVyc2UyKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAocmV2ZXJzZTEpXG4gICAgICB7XG4gICAgICAgIG9wMWIgPSB0aGlzLkR1cE91dFB0KG9wMSwgZmFsc2UpO1xuICAgICAgICBvcDJiID0gdGhpcy5EdXBPdXRQdChvcDIsIHRydWUpO1xuICAgICAgICBvcDEuUHJldiA9IG9wMjtcbiAgICAgICAgb3AyLk5leHQgPSBvcDE7XG4gICAgICAgIG9wMWIuTmV4dCA9IG9wMmI7XG4gICAgICAgIG9wMmIuUHJldiA9IG9wMWI7XG4gICAgICAgIGouT3V0UHQxID0gb3AxO1xuICAgICAgICBqLk91dFB0MiA9IG9wMWI7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICBvcDFiID0gdGhpcy5EdXBPdXRQdChvcDEsIHRydWUpO1xuICAgICAgICBvcDJiID0gdGhpcy5EdXBPdXRQdChvcDIsIGZhbHNlKTtcbiAgICAgICAgb3AxLk5leHQgPSBvcDI7XG4gICAgICAgIG9wMi5QcmV2ID0gb3AxO1xuICAgICAgICBvcDFiLlByZXYgPSBvcDJiO1xuICAgICAgICBvcDJiLk5leHQgPSBvcDFiO1xuICAgICAgICBqLk91dFB0MSA9IG9wMTtcbiAgICAgICAgai5PdXRQdDIgPSBvcDFiO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoaXNIb3Jpem9udGFsKVxuICAgIHtcbiAgICAgIC8vdHJlYXQgaG9yaXpvbnRhbCBqb2lucyBkaWZmZXJlbnRseSB0byBub24taG9yaXpvbnRhbCBqb2lucyBzaW5jZSB3aXRoXG4gICAgICAvL3RoZW0gd2UncmUgbm90IHlldCBzdXJlIHdoZXJlIHRoZSBvdmVybGFwcGluZyBpcy4gT3V0UHQxLlB0ICYgT3V0UHQyLlB0XG4gICAgICAvL21heSBiZSBhbnl3aGVyZSBhbG9uZyB0aGUgaG9yaXpvbnRhbCBlZGdlLlxuICAgICAgb3AxYiA9IG9wMTtcbiAgICAgIHdoaWxlIChvcDEuUHJldi5QdC5ZID09IG9wMS5QdC5ZICYmIG9wMS5QcmV2ICE9IG9wMWIgJiYgb3AxLlByZXYgIT0gb3AyKVxuICAgICAgICBvcDEgPSBvcDEuUHJldjtcbiAgICAgIHdoaWxlIChvcDFiLk5leHQuUHQuWSA9PSBvcDFiLlB0LlkgJiYgb3AxYi5OZXh0ICE9IG9wMSAmJiBvcDFiLk5leHQgIT0gb3AyKVxuICAgICAgICBvcDFiID0gb3AxYi5OZXh0O1xuICAgICAgaWYgKG9wMWIuTmV4dCA9PSBvcDEgfHwgb3AxYi5OZXh0ID09IG9wMilcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgLy9hIGZsYXQgJ3BvbHlnb24nXG4gICAgICBvcDJiID0gb3AyO1xuICAgICAgd2hpbGUgKG9wMi5QcmV2LlB0LlkgPT0gb3AyLlB0LlkgJiYgb3AyLlByZXYgIT0gb3AyYiAmJiBvcDIuUHJldiAhPSBvcDFiKVxuICAgICAgICBvcDIgPSBvcDIuUHJldjtcbiAgICAgIHdoaWxlIChvcDJiLk5leHQuUHQuWSA9PSBvcDJiLlB0LlkgJiYgb3AyYi5OZXh0ICE9IG9wMiAmJiBvcDJiLk5leHQgIT0gb3AxKVxuICAgICAgICBvcDJiID0gb3AyYi5OZXh0O1xuICAgICAgaWYgKG9wMmIuTmV4dCA9PSBvcDIgfHwgb3AyYi5OZXh0ID09IG9wMSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgLy9hIGZsYXQgJ3BvbHlnb24nXG4gICAgICAvL09wMSAtLiBPcDFiICYgT3AyIC0uIE9wMmIgYXJlIHRoZSBleHRyZW1pdGVzIG9mIHRoZSBob3Jpem9udGFsIGVkZ2VzXG5cbiAgICAgIHZhciAkdmFsID0ge0xlZnQ6IG51bGwsIFJpZ2h0OiBudWxsfTtcbiAgICAgIGlmICghdGhpcy5HZXRPdmVybGFwKG9wMS5QdC5YLCBvcDFiLlB0LlgsIG9wMi5QdC5YLCBvcDJiLlB0LlgsICR2YWwpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB2YXIgTGVmdCA9ICR2YWwuTGVmdDtcbiAgICAgIHZhciBSaWdodCA9ICR2YWwuUmlnaHQ7XG5cbiAgICAgIC8vRGlzY2FyZExlZnRTaWRlOiB3aGVuIG92ZXJsYXBwaW5nIGVkZ2VzIGFyZSBqb2luZWQsIGEgc3Bpa2Ugd2lsbCBjcmVhdGVkXG4gICAgICAvL3doaWNoIG5lZWRzIHRvIGJlIGNsZWFuZWQgdXAuIEhvd2V2ZXIsIHdlIGRvbid0IHdhbnQgT3AxIG9yIE9wMiBjYXVnaHQgdXBcbiAgICAgIC8vb24gdGhlIGRpc2NhcmQgU2lkZSBhcyBlaXRoZXIgbWF5IHN0aWxsIGJlIG5lZWRlZCBmb3Igb3RoZXIgam9pbnMgLi4uXG4gICAgICB2YXIgUHQgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludCgpO1xuICAgICAgdmFyIERpc2NhcmRMZWZ0U2lkZTtcbiAgICAgIGlmIChvcDEuUHQuWCA+PSBMZWZ0ICYmIG9wMS5QdC5YIDw9IFJpZ2h0KVxuICAgICAge1xuICAgICAgICAvL1B0ID0gb3AxLlB0O1xuICAgICAgICBQdC5YID0gb3AxLlB0Llg7XG4gICAgICAgIFB0LlkgPSBvcDEuUHQuWTtcbiAgICAgICAgRGlzY2FyZExlZnRTaWRlID0gKG9wMS5QdC5YID4gb3AxYi5QdC5YKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9wMi5QdC5YID49IExlZnQgJiYgb3AyLlB0LlggPD0gUmlnaHQpXG4gICAgICB7XG4gICAgICAgIC8vUHQgPSBvcDIuUHQ7XG4gICAgICAgIFB0LlggPSBvcDIuUHQuWDtcbiAgICAgICAgUHQuWSA9IG9wMi5QdC5ZO1xuICAgICAgICBEaXNjYXJkTGVmdFNpZGUgPSAob3AyLlB0LlggPiBvcDJiLlB0LlgpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAob3AxYi5QdC5YID49IExlZnQgJiYgb3AxYi5QdC5YIDw9IFJpZ2h0KVxuICAgICAge1xuICAgICAgICAvL1B0ID0gb3AxYi5QdDtcbiAgICAgICAgUHQuWCA9IG9wMWIuUHQuWDtcbiAgICAgICAgUHQuWSA9IG9wMWIuUHQuWTtcbiAgICAgICAgRGlzY2FyZExlZnRTaWRlID0gb3AxYi5QdC5YID4gb3AxLlB0Llg7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIC8vUHQgPSBvcDJiLlB0O1xuICAgICAgICBQdC5YID0gb3AyYi5QdC5YO1xuICAgICAgICBQdC5ZID0gb3AyYi5QdC5ZO1xuICAgICAgICBEaXNjYXJkTGVmdFNpZGUgPSAob3AyYi5QdC5YID4gb3AyLlB0LlgpO1xuICAgICAgfVxuICAgICAgai5PdXRQdDEgPSBvcDE7XG4gICAgICBqLk91dFB0MiA9IG9wMjtcbiAgICAgIHJldHVybiB0aGlzLkpvaW5Ib3J6KG9wMSwgb3AxYiwgb3AyLCBvcDJiLCBQdCwgRGlzY2FyZExlZnRTaWRlKTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIC8vbmI6IEZvciBub24taG9yaXpvbnRhbCBqb2lucyAuLi5cbiAgICAgIC8vICAgIDEuIEpyLk91dFB0MS5QdC5ZID09IEpyLk91dFB0Mi5QdC5ZXG4gICAgICAvLyAgICAyLiBKci5PdXRQdDEuUHQgPiBKci5PZmZQdC5ZXG4gICAgICAvL21ha2Ugc3VyZSB0aGUgcG9seWdvbnMgYXJlIGNvcnJlY3RseSBvcmllbnRlZCAuLi5cbiAgICAgIG9wMWIgPSBvcDEuTmV4dDtcbiAgICAgIHdoaWxlICgoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShvcDFiLlB0LCBvcDEuUHQpKSAmJiAob3AxYiAhPSBvcDEpKVxuICAgICAgICBvcDFiID0gb3AxYi5OZXh0O1xuICAgICAgdmFyIFJldmVyc2UxID0gKChvcDFiLlB0LlkgPiBvcDEuUHQuWSkgfHwgIUNsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2xvcGVzRXF1YWwob3AxLlB0LCBvcDFiLlB0LCBqLk9mZlB0LCB0aGlzLm1fVXNlRnVsbFJhbmdlKSk7XG4gICAgICBpZiAoUmV2ZXJzZTEpXG4gICAgICB7XG4gICAgICAgIG9wMWIgPSBvcDEuUHJldjtcbiAgICAgICAgd2hpbGUgKChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KG9wMWIuUHQsIG9wMS5QdCkpICYmIChvcDFiICE9IG9wMSkpXG4gICAgICAgICAgb3AxYiA9IG9wMWIuUHJldjtcbiAgICAgICAgaWYgKChvcDFiLlB0LlkgPiBvcDEuUHQuWSkgfHwgIUNsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2xvcGVzRXF1YWwob3AxLlB0LCBvcDFiLlB0LCBqLk9mZlB0LCB0aGlzLm1fVXNlRnVsbFJhbmdlKSlcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBvcDJiID0gb3AyLk5leHQ7XG4gICAgICB3aGlsZSAoKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkob3AyYi5QdCwgb3AyLlB0KSkgJiYgKG9wMmIgIT0gb3AyKSlcbiAgICAgICAgb3AyYiA9IG9wMmIuTmV4dDtcbiAgICAgIHZhciBSZXZlcnNlMiA9ICgob3AyYi5QdC5ZID4gb3AyLlB0LlkpIHx8ICFDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNsb3Blc0VxdWFsKG9wMi5QdCwgb3AyYi5QdCwgai5PZmZQdCwgdGhpcy5tX1VzZUZ1bGxSYW5nZSkpO1xuICAgICAgaWYgKFJldmVyc2UyKVxuICAgICAge1xuICAgICAgICBvcDJiID0gb3AyLlByZXY7XG4gICAgICAgIHdoaWxlICgoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShvcDJiLlB0LCBvcDIuUHQpKSAmJiAob3AyYiAhPSBvcDIpKVxuICAgICAgICAgIG9wMmIgPSBvcDJiLlByZXY7XG4gICAgICAgIGlmICgob3AyYi5QdC5ZID4gb3AyLlB0LlkpIHx8ICFDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNsb3Blc0VxdWFsKG9wMi5QdCwgb3AyYi5QdCwgai5PZmZQdCwgdGhpcy5tX1VzZUZ1bGxSYW5nZSkpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKChvcDFiID09IG9wMSkgfHwgKG9wMmIgPT0gb3AyKSB8fCAob3AxYiA9PSBvcDJiKSB8fFxuICAgICAgICAoKG91dFJlYzEgPT0gb3V0UmVjMikgJiYgKFJldmVyc2UxID09IFJldmVyc2UyKSkpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIGlmIChSZXZlcnNlMSlcbiAgICAgIHtcbiAgICAgICAgb3AxYiA9IHRoaXMuRHVwT3V0UHQob3AxLCBmYWxzZSk7XG4gICAgICAgIG9wMmIgPSB0aGlzLkR1cE91dFB0KG9wMiwgdHJ1ZSk7XG4gICAgICAgIG9wMS5QcmV2ID0gb3AyO1xuICAgICAgICBvcDIuTmV4dCA9IG9wMTtcbiAgICAgICAgb3AxYi5OZXh0ID0gb3AyYjtcbiAgICAgICAgb3AyYi5QcmV2ID0gb3AxYjtcbiAgICAgICAgai5PdXRQdDEgPSBvcDE7XG4gICAgICAgIGouT3V0UHQyID0gb3AxYjtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIG9wMWIgPSB0aGlzLkR1cE91dFB0KG9wMSwgdHJ1ZSk7XG4gICAgICAgIG9wMmIgPSB0aGlzLkR1cE91dFB0KG9wMiwgZmFsc2UpO1xuICAgICAgICBvcDEuTmV4dCA9IG9wMjtcbiAgICAgICAgb3AyLlByZXYgPSBvcDE7XG4gICAgICAgIG9wMWIuUHJldiA9IG9wMmI7XG4gICAgICAgIG9wMmIuTmV4dCA9IG9wMWI7XG4gICAgICAgIGouT3V0UHQxID0gb3AxO1xuICAgICAgICBqLk91dFB0MiA9IG9wMWI7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLkdldEJvdW5kcyA9IGZ1bmN0aW9uIChwYXRocylcbiAge1xuICAgIHZhciBpID0gMCxcbiAgICAgIGNudCA9IHBhdGhzLmxlbmd0aDtcbiAgICB3aGlsZSAoaSA8IGNudCAmJiBwYXRoc1tpXS5sZW5ndGggPT0gMCkgaSsrO1xuICAgIGlmIChpID09IGNudCkgcmV0dXJuIG5ldyBDbGlwcGVyTGliLkludFJlY3QoMCwgMCwgMCwgMCk7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBDbGlwcGVyTGliLkludFJlY3QoKTtcbiAgICByZXN1bHQubGVmdCA9IHBhdGhzW2ldWzBdLlg7XG4gICAgcmVzdWx0LnJpZ2h0ID0gcmVzdWx0LmxlZnQ7XG4gICAgcmVzdWx0LnRvcCA9IHBhdGhzW2ldWzBdLlk7XG4gICAgcmVzdWx0LmJvdHRvbSA9IHJlc3VsdC50b3A7XG4gICAgZm9yICg7IGkgPCBjbnQ7IGkrKylcbiAgICAgIGZvciAodmFyIGogPSAwLCBqbGVuID0gcGF0aHNbaV0ubGVuZ3RoOyBqIDwgamxlbjsgaisrKVxuICAgICAge1xuICAgICAgICBpZiAocGF0aHNbaV1bal0uWCA8IHJlc3VsdC5sZWZ0KSByZXN1bHQubGVmdCA9IHBhdGhzW2ldW2pdLlg7XG4gICAgICAgIGVsc2UgaWYgKHBhdGhzW2ldW2pdLlggPiByZXN1bHQucmlnaHQpIHJlc3VsdC5yaWdodCA9IHBhdGhzW2ldW2pdLlg7XG4gICAgICAgIGlmIChwYXRoc1tpXVtqXS5ZIDwgcmVzdWx0LnRvcCkgcmVzdWx0LnRvcCA9IHBhdGhzW2ldW2pdLlk7XG4gICAgICAgIGVsc2UgaWYgKHBhdGhzW2ldW2pdLlkgPiByZXN1bHQuYm90dG9tKSByZXN1bHQuYm90dG9tID0gcGF0aHNbaV1bal0uWTtcbiAgICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuR2V0Qm91bmRzMiA9IGZ1bmN0aW9uIChvcHMpXG4gIHtcbiAgICB2YXIgb3BTdGFydCA9IG9wcztcbiAgICB2YXIgcmVzdWx0ID0gbmV3IENsaXBwZXJMaWIuSW50UmVjdCgpO1xuICAgIHJlc3VsdC5sZWZ0ID0gb3BzLlB0Llg7XG4gICAgcmVzdWx0LnJpZ2h0ID0gb3BzLlB0Llg7XG4gICAgcmVzdWx0LnRvcCA9IG9wcy5QdC5ZO1xuICAgIHJlc3VsdC5ib3R0b20gPSBvcHMuUHQuWTtcbiAgICBvcHMgPSBvcHMuTmV4dDtcbiAgICB3aGlsZSAob3BzICE9IG9wU3RhcnQpXG4gICAge1xuICAgICAgaWYgKG9wcy5QdC5YIDwgcmVzdWx0LmxlZnQpXG4gICAgICAgIHJlc3VsdC5sZWZ0ID0gb3BzLlB0Llg7XG4gICAgICBpZiAob3BzLlB0LlggPiByZXN1bHQucmlnaHQpXG4gICAgICAgIHJlc3VsdC5yaWdodCA9IG9wcy5QdC5YO1xuICAgICAgaWYgKG9wcy5QdC5ZIDwgcmVzdWx0LnRvcClcbiAgICAgICAgcmVzdWx0LnRvcCA9IG9wcy5QdC5ZO1xuICAgICAgaWYgKG9wcy5QdC5ZID4gcmVzdWx0LmJvdHRvbSlcbiAgICAgICAgcmVzdWx0LmJvdHRvbSA9IG9wcy5QdC5ZO1xuICAgICAgb3BzID0gb3BzLk5leHQ7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgQ2xpcHBlckxpYi5DbGlwcGVyLlBvaW50SW5Qb2x5Z29uID0gZnVuY3Rpb24gKHB0LCBwYXRoKVxuICB7XG4gICAgLy9yZXR1cm5zIDAgaWYgZmFsc2UsICsxIGlmIHRydWUsIC0xIGlmIHB0IE9OIHBvbHlnb24gYm91bmRhcnlcblx0XHQvL1NlZSBcIlRoZSBQb2ludCBpbiBQb2x5Z29uIFByb2JsZW0gZm9yIEFyYml0cmFyeSBQb2x5Z29uc1wiIGJ5IEhvcm1hbm4gJiBBZ2F0aG9zXG4gICAgLy9odHRwOi8vY2l0ZXNlZXJ4LmlzdC5wc3UuZWR1L3ZpZXdkb2MvZG93bmxvYWQ/ZG9pPTEwLjEuMS44OC41NDk4JnJlcD1yZXAxJnR5cGU9cGRmXG4gICAgdmFyIHJlc3VsdCA9IDAsXG4gICAgICBjbnQgPSBwYXRoLmxlbmd0aDtcbiAgICBpZiAoY250IDwgMylcbiAgICAgIHJldHVybiAwO1xuICAgIHZhciBpcCA9IHBhdGhbMF07XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPD0gY250OyArK2kpXG4gICAge1xuICAgICAgdmFyIGlwTmV4dCA9IChpID09IGNudCA/IHBhdGhbMF0gOiBwYXRoW2ldKTtcbiAgICAgIGlmIChpcE5leHQuWSA9PSBwdC5ZKVxuICAgICAge1xuICAgICAgICBpZiAoKGlwTmV4dC5YID09IHB0LlgpIHx8IChpcC5ZID09IHB0LlkgJiYgKChpcE5leHQuWCA+IHB0LlgpID09IChpcC5YIDwgcHQuWCkpKSlcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICBpZiAoKGlwLlkgPCBwdC5ZKSAhPSAoaXBOZXh0LlkgPCBwdC5ZKSlcbiAgICAgIHtcbiAgICAgICAgaWYgKGlwLlggPj0gcHQuWClcbiAgICAgICAge1xuICAgICAgICAgIGlmIChpcE5leHQuWCA+IHB0LlgpXG4gICAgICAgICAgICByZXN1bHQgPSAxIC0gcmVzdWx0O1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2YXIgZCA9IChpcC5YIC0gcHQuWCkgKiAoaXBOZXh0LlkgLSBwdC5ZKSAtIChpcE5leHQuWCAtIHB0LlgpICogKGlwLlkgLSBwdC5ZKTtcbiAgICAgICAgICAgIGlmIChkID09IDApXG4gICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIGVsc2UgaWYgKChkID4gMCkgPT0gKGlwTmV4dC5ZID4gaXAuWSkpXG4gICAgICAgICAgICAgIHJlc3VsdCA9IDEgLSByZXN1bHQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgIGlmIChpcE5leHQuWCA+IHB0LlgpXG4gICAgICAgICAge1xuICAgICAgICAgICAgdmFyIGQgPSAoaXAuWCAtIHB0LlgpICogKGlwTmV4dC5ZIC0gcHQuWSkgLSAoaXBOZXh0LlggLSBwdC5YKSAqIChpcC5ZIC0gcHQuWSk7XG4gICAgICAgICAgICBpZiAoZCA9PSAwKVxuICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICBlbHNlIGlmICgoZCA+IDApID09IChpcE5leHQuWSA+IGlwLlkpKVxuICAgICAgICAgICAgICByZXN1bHQgPSAxIC0gcmVzdWx0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaXAgPSBpcE5leHQ7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Qb2ludEluUG9seWdvbiA9IGZ1bmN0aW9uIChwdCwgb3ApXG4gIHtcbiAgICAvL3JldHVybnMgMCBpZiBmYWxzZSwgKzEgaWYgdHJ1ZSwgLTEgaWYgcHQgT04gcG9seWdvbiBib3VuZGFyeVxuXHRcdC8vU2VlIFwiVGhlIFBvaW50IGluIFBvbHlnb24gUHJvYmxlbSBmb3IgQXJiaXRyYXJ5IFBvbHlnb25zXCIgYnkgSG9ybWFubiAmIEFnYXRob3NcbiAgICAvL2h0dHA6Ly9jaXRlc2VlcnguaXN0LnBzdS5lZHUvdmlld2RvYy9kb3dubG9hZD9kb2k9MTAuMS4xLjg4LjU0OTgmcmVwPXJlcDEmdHlwZT1wZGZcbiAgICB2YXIgcmVzdWx0ID0gMDtcbiAgICB2YXIgc3RhcnRPcCA9IG9wO1xuXHRcdHZhciBwdHggPSBwdC5YLCBwdHkgPSBwdC5ZO1xuICAgIHZhciBwb2x5MHggPSBvcC5QdC5YLCBwb2x5MHkgPSBvcC5QdC5ZO1xuICAgIGRvXG4gICAge1xuXHRcdFx0b3AgPSBvcC5OZXh0O1xuXHRcdFx0dmFyIHBvbHkxeCA9IG9wLlB0LlgsIHBvbHkxeSA9IG9wLlB0Llk7XG4gICAgICBpZiAocG9seTF5ID09IHB0eSlcbiAgICAgIHtcbiAgICAgICAgaWYgKChwb2x5MXggPT0gcHR4KSB8fCAocG9seTB5ID09IHB0eSAmJiAoKHBvbHkxeCA+IHB0eCkgPT0gKHBvbHkweCA8IHB0eCkpKSlcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICBpZiAoKHBvbHkweSA8IHB0eSkgIT0gKHBvbHkxeSA8IHB0eSkpXG4gICAgICB7XG4gICAgICAgIGlmIChwb2x5MHggPj0gcHR4KVxuICAgICAgICB7XG4gICAgICAgICAgaWYgKHBvbHkxeCA+IHB0eClcbiAgICAgICAgICAgIHJlc3VsdCA9IDEgLSByZXN1bHQ7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZhciBkID0gKHBvbHkweCAtIHB0eCkgKiAocG9seTF5IC0gcHR5KSAtIChwb2x5MXggLSBwdHgpICogKHBvbHkweSAtIHB0eSk7XG4gICAgICAgICAgICBpZiAoZCA9PSAwKVxuICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICBpZiAoKGQgPiAwKSA9PSAocG9seTF5ID4gcG9seTB5KSlcbiAgICAgICAgICAgICAgcmVzdWx0ID0gMSAtIHJlc3VsdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgaWYgKHBvbHkxeCA+IHB0eClcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2YXIgZCA9IChwb2x5MHggLSBwdHgpICogKHBvbHkxeSAtIHB0eSkgLSAocG9seTF4IC0gcHR4KSAqIChwb2x5MHkgLSBwdHkpO1xuICAgICAgICAgICAgaWYgKGQgPT0gMClcbiAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgaWYgKChkID4gMCkgPT0gKHBvbHkxeSA+IHBvbHkweSkpXG4gICAgICAgICAgICAgIHJlc3VsdCA9IDEgLSByZXN1bHQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwb2x5MHggPSBwb2x5MXg7XG4gICAgICBwb2x5MHkgPSBwb2x5MXk7XG4gICAgfSB3aGlsZSAoc3RhcnRPcCAhPSBvcCk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuUG9seTJDb250YWluc1BvbHkxID0gZnVuY3Rpb24gKG91dFB0MSwgb3V0UHQyKVxuICB7XG4gICAgdmFyIG9wID0gb3V0UHQxO1xuICAgIGRvXG4gICAge1xuXHRcdFx0Ly9uYjogUG9pbnRJblBvbHlnb24gcmV0dXJucyAwIGlmIGZhbHNlLCArMSBpZiB0cnVlLCAtMSBpZiBwdCBvbiBwb2x5Z29uXG4gICAgICB2YXIgcmVzID0gdGhpcy5Qb2ludEluUG9seWdvbihvcC5QdCwgb3V0UHQyKTtcbiAgICAgIGlmIChyZXMgPj0gMClcbiAgICAgICAgcmV0dXJuIHJlcyA+IDA7XG4gICAgICBvcCA9IG9wLk5leHQ7XG4gICAgfVxuICAgIHdoaWxlIChvcCAhPSBvdXRQdDEpXG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRml4dXBGaXJzdExlZnRzMSA9IGZ1bmN0aW9uIChPbGRPdXRSZWMsIE5ld091dFJlYylcbiAge1xuICAgIGZvciAodmFyIGkgPSAwLCBpbGVuID0gdGhpcy5tX1BvbHlPdXRzLmxlbmd0aDsgaSA8IGlsZW47IGkrKylcbiAgICB7XG5cdFx0XHR2YXIgb3V0UmVjID0gdGhpcy5tX1BvbHlPdXRzW2ldO1xuXHRcdFx0aWYgKG91dFJlYy5QdHMgPT0gbnVsbCB8fCBvdXRSZWMuRmlyc3RMZWZ0ID09IG51bGwpXG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0dmFyIGZpcnN0TGVmdCA9IENsaXBwZXJMaWIuQ2xpcHBlci5QYXJzZUZpcnN0TGVmdChvdXRSZWMuRmlyc3RMZWZ0KTtcblx0XHRcdGlmIChmaXJzdExlZnQgPT0gT2xkT3V0UmVjKVxuXHRcdFx0e1xuICAgICAgICBpZiAodGhpcy5Qb2x5MkNvbnRhaW5zUG9seTEob3V0UmVjLlB0cywgTmV3T3V0UmVjLlB0cykpXG4gICAgICAgICAgb3V0UmVjLkZpcnN0TGVmdCA9IE5ld091dFJlYztcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRml4dXBGaXJzdExlZnRzMiA9IGZ1bmN0aW9uIChPbGRPdXRSZWMsIE5ld091dFJlYylcbiAge1xuICAgIGZvciAodmFyICRpMiA9IDAsICR0MiA9IHRoaXMubV9Qb2x5T3V0cywgJGwyID0gJHQyLmxlbmd0aCwgb3V0UmVjID0gJHQyWyRpMl07ICRpMiA8ICRsMjsgJGkyKyssIG91dFJlYyA9ICR0MlskaTJdKVxuICAgICAgaWYgKG91dFJlYy5GaXJzdExlZnQgPT0gT2xkT3V0UmVjKVxuICAgICAgICBvdXRSZWMuRmlyc3RMZWZ0ID0gTmV3T3V0UmVjO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuUGFyc2VGaXJzdExlZnQgPSBmdW5jdGlvbiAoRmlyc3RMZWZ0KVxuICB7XG4gICAgd2hpbGUgKEZpcnN0TGVmdCAhPSBudWxsICYmIEZpcnN0TGVmdC5QdHMgPT0gbnVsbClcbiAgICAgIEZpcnN0TGVmdCA9IEZpcnN0TGVmdC5GaXJzdExlZnQ7XG4gICAgcmV0dXJuIEZpcnN0TGVmdDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Kb2luQ29tbW9uRWRnZXMgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlsZW4gPSB0aGlzLm1fSm9pbnMubGVuZ3RoOyBpIDwgaWxlbjsgaSsrKVxuICAgIHtcbiAgICAgIHZhciBqb2luID0gdGhpcy5tX0pvaW5zW2ldO1xuICAgICAgdmFyIG91dFJlYzEgPSB0aGlzLkdldE91dFJlYyhqb2luLk91dFB0MS5JZHgpO1xuICAgICAgdmFyIG91dFJlYzIgPSB0aGlzLkdldE91dFJlYyhqb2luLk91dFB0Mi5JZHgpO1xuICAgICAgaWYgKG91dFJlYzEuUHRzID09IG51bGwgfHwgb3V0UmVjMi5QdHMgPT0gbnVsbClcbiAgICAgICAgY29udGludWU7XG4gICAgICAvL2dldCB0aGUgcG9seWdvbiBmcmFnbWVudCB3aXRoIHRoZSBjb3JyZWN0IGhvbGUgc3RhdGUgKEZpcnN0TGVmdClcbiAgICAgIC8vYmVmb3JlIGNhbGxpbmcgSm9pblBvaW50cygpIC4uLlxuICAgICAgdmFyIGhvbGVTdGF0ZVJlYztcbiAgICAgIGlmIChvdXRSZWMxID09IG91dFJlYzIpXG4gICAgICAgIGhvbGVTdGF0ZVJlYyA9IG91dFJlYzE7XG4gICAgICBlbHNlIGlmICh0aGlzLlBhcmFtMVJpZ2h0T2ZQYXJhbTIob3V0UmVjMSwgb3V0UmVjMikpXG4gICAgICAgIGhvbGVTdGF0ZVJlYyA9IG91dFJlYzI7XG4gICAgICBlbHNlIGlmICh0aGlzLlBhcmFtMVJpZ2h0T2ZQYXJhbTIob3V0UmVjMiwgb3V0UmVjMSkpXG4gICAgICAgIGhvbGVTdGF0ZVJlYyA9IG91dFJlYzE7XG4gICAgICBlbHNlXG4gICAgICAgIGhvbGVTdGF0ZVJlYyA9IHRoaXMuR2V0TG93ZXJtb3N0UmVjKG91dFJlYzEsIG91dFJlYzIpO1xuXG4gICAgICBpZiAoIXRoaXMuSm9pblBvaW50cyhqb2luLCBvdXRSZWMxLCBvdXRSZWMyKSkgY29udGludWU7XG5cbiAgICAgIGlmIChvdXRSZWMxID09IG91dFJlYzIpXG4gICAgICB7XG4gICAgICAgIC8vaW5zdGVhZCBvZiBqb2luaW5nIHR3byBwb2x5Z29ucywgd2UndmUganVzdCBjcmVhdGVkIGEgbmV3IG9uZSBieVxuICAgICAgICAvL3NwbGl0dGluZyBvbmUgcG9seWdvbiBpbnRvIHR3by5cbiAgICAgICAgb3V0UmVjMS5QdHMgPSBqb2luLk91dFB0MTtcbiAgICAgICAgb3V0UmVjMS5Cb3R0b21QdCA9IG51bGw7XG4gICAgICAgIG91dFJlYzIgPSB0aGlzLkNyZWF0ZU91dFJlYygpO1xuICAgICAgICBvdXRSZWMyLlB0cyA9IGpvaW4uT3V0UHQyO1xuICAgICAgICAvL3VwZGF0ZSBhbGwgT3V0UmVjMi5QdHMgSWR4J3MgLi4uXG4gICAgICAgIHRoaXMuVXBkYXRlT3V0UHRJZHhzKG91dFJlYzIpO1xuICAgICAgICAvL1dlIG5vdyBuZWVkIHRvIGNoZWNrIGV2ZXJ5IE91dFJlYy5GaXJzdExlZnQgcG9pbnRlci4gSWYgaXQgcG9pbnRzXG4gICAgICAgIC8vdG8gT3V0UmVjMSBpdCBtYXkgbmVlZCB0byBwb2ludCB0byBPdXRSZWMyIGluc3RlYWQgLi4uXG4gICAgICAgIGlmICh0aGlzLm1fVXNpbmdQb2x5VHJlZSlcbiAgICAgICAgICBmb3IgKHZhciBqID0gMCwgamxlbiA9IHRoaXMubV9Qb2x5T3V0cy5sZW5ndGg7IGogPCBqbGVuIC0gMTsgaisrKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZhciBvUmVjID0gdGhpcy5tX1BvbHlPdXRzW2pdO1xuICAgICAgICAgICAgaWYgKG9SZWMuUHRzID09IG51bGwgfHwgQ2xpcHBlckxpYi5DbGlwcGVyLlBhcnNlRmlyc3RMZWZ0KG9SZWMuRmlyc3RMZWZ0KSAhPSBvdXRSZWMxIHx8IG9SZWMuSXNIb2xlID09IG91dFJlYzEuSXNIb2xlKVxuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIGlmICh0aGlzLlBvbHkyQ29udGFpbnNQb2x5MShvUmVjLlB0cywgam9pbi5PdXRQdDIpKVxuICAgICAgICAgICAgICBvUmVjLkZpcnN0TGVmdCA9IG91dFJlYzI7XG4gICAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5Qb2x5MkNvbnRhaW5zUG9seTEob3V0UmVjMi5QdHMsIG91dFJlYzEuUHRzKSlcbiAgICAgICAge1xuICAgICAgICAgIC8vb3V0UmVjMiBpcyBjb250YWluZWQgYnkgb3V0UmVjMSAuLi5cbiAgICAgICAgICBvdXRSZWMyLklzSG9sZSA9ICFvdXRSZWMxLklzSG9sZTtcbiAgICAgICAgICBvdXRSZWMyLkZpcnN0TGVmdCA9IG91dFJlYzE7XG4gICAgICAgICAgLy9maXh1cCBGaXJzdExlZnQgcG9pbnRlcnMgdGhhdCBtYXkgbmVlZCByZWFzc2lnbmluZyB0byBPdXRSZWMxXG4gICAgICAgICAgaWYgKHRoaXMubV9Vc2luZ1BvbHlUcmVlKVxuICAgICAgICAgICAgdGhpcy5GaXh1cEZpcnN0TGVmdHMyKG91dFJlYzIsIG91dFJlYzEpO1xuICAgICAgICAgIGlmICgob3V0UmVjMi5Jc0hvbGUgXiB0aGlzLlJldmVyc2VTb2x1dGlvbikgPT0gKHRoaXMuQXJlYShvdXRSZWMyKSA+IDApKVxuICAgICAgICAgICAgdGhpcy5SZXZlcnNlUG9seVB0TGlua3Mob3V0UmVjMi5QdHMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuUG9seTJDb250YWluc1BvbHkxKG91dFJlYzEuUHRzLCBvdXRSZWMyLlB0cykpXG4gICAgICAgIHtcbiAgICAgICAgICAvL291dFJlYzEgaXMgY29udGFpbmVkIGJ5IG91dFJlYzIgLi4uXG4gICAgICAgICAgb3V0UmVjMi5Jc0hvbGUgPSBvdXRSZWMxLklzSG9sZTtcbiAgICAgICAgICBvdXRSZWMxLklzSG9sZSA9ICFvdXRSZWMyLklzSG9sZTtcbiAgICAgICAgICBvdXRSZWMyLkZpcnN0TGVmdCA9IG91dFJlYzEuRmlyc3RMZWZ0O1xuICAgICAgICAgIG91dFJlYzEuRmlyc3RMZWZ0ID0gb3V0UmVjMjtcbiAgICAgICAgICAvL2ZpeHVwIEZpcnN0TGVmdCBwb2ludGVycyB0aGF0IG1heSBuZWVkIHJlYXNzaWduaW5nIHRvIE91dFJlYzFcbiAgICAgICAgICBpZiAodGhpcy5tX1VzaW5nUG9seVRyZWUpXG4gICAgICAgICAgICB0aGlzLkZpeHVwRmlyc3RMZWZ0czIob3V0UmVjMSwgb3V0UmVjMik7XG4gICAgICAgICAgaWYgKChvdXRSZWMxLklzSG9sZSBeIHRoaXMuUmV2ZXJzZVNvbHV0aW9uKSA9PSAodGhpcy5BcmVhKG91dFJlYzEpID4gMCkpXG4gICAgICAgICAgICB0aGlzLlJldmVyc2VQb2x5UHRMaW5rcyhvdXRSZWMxLlB0cyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgLy90aGUgMiBwb2x5Z29ucyBhcmUgY29tcGxldGVseSBzZXBhcmF0ZSAuLi5cbiAgICAgICAgICBvdXRSZWMyLklzSG9sZSA9IG91dFJlYzEuSXNIb2xlO1xuICAgICAgICAgIG91dFJlYzIuRmlyc3RMZWZ0ID0gb3V0UmVjMS5GaXJzdExlZnQ7XG4gICAgICAgICAgLy9maXh1cCBGaXJzdExlZnQgcG9pbnRlcnMgdGhhdCBtYXkgbmVlZCByZWFzc2lnbmluZyB0byBPdXRSZWMyXG4gICAgICAgICAgaWYgKHRoaXMubV9Vc2luZ1BvbHlUcmVlKVxuICAgICAgICAgICAgdGhpcy5GaXh1cEZpcnN0TGVmdHMxKG91dFJlYzEsIG91dFJlYzIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIC8vam9pbmVkIDIgcG9seWdvbnMgdG9nZXRoZXIgLi4uXG4gICAgICAgIG91dFJlYzIuUHRzID0gbnVsbDtcbiAgICAgICAgb3V0UmVjMi5Cb3R0b21QdCA9IG51bGw7XG4gICAgICAgIG91dFJlYzIuSWR4ID0gb3V0UmVjMS5JZHg7XG4gICAgICAgIG91dFJlYzEuSXNIb2xlID0gaG9sZVN0YXRlUmVjLklzSG9sZTtcbiAgICAgICAgaWYgKGhvbGVTdGF0ZVJlYyA9PSBvdXRSZWMyKVxuICAgICAgICAgIG91dFJlYzEuRmlyc3RMZWZ0ID0gb3V0UmVjMi5GaXJzdExlZnQ7XG4gICAgICAgIG91dFJlYzIuRmlyc3RMZWZ0ID0gb3V0UmVjMTtcbiAgICAgICAgLy9maXh1cCBGaXJzdExlZnQgcG9pbnRlcnMgdGhhdCBtYXkgbmVlZCByZWFzc2lnbmluZyB0byBPdXRSZWMxXG4gICAgICAgIGlmICh0aGlzLm1fVXNpbmdQb2x5VHJlZSlcbiAgICAgICAgICB0aGlzLkZpeHVwRmlyc3RMZWZ0czIob3V0UmVjMiwgb3V0UmVjMSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlVwZGF0ZU91dFB0SWR4cyA9IGZ1bmN0aW9uIChvdXRyZWMpXG4gIHtcbiAgICB2YXIgb3AgPSBvdXRyZWMuUHRzO1xuICAgIGRvIHtcbiAgICAgIG9wLklkeCA9IG91dHJlYy5JZHg7XG4gICAgICBvcCA9IG9wLlByZXY7XG4gICAgfVxuICAgIHdoaWxlIChvcCAhPSBvdXRyZWMuUHRzKVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkRvU2ltcGxlUG9seWdvbnMgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgdGhpcy5tX1BvbHlPdXRzLmxlbmd0aClcbiAgICB7XG4gICAgICB2YXIgb3V0cmVjID0gdGhpcy5tX1BvbHlPdXRzW2krK107XG4gICAgICB2YXIgb3AgPSBvdXRyZWMuUHRzO1xuXHRcdFx0aWYgKG9wID09IG51bGwgfHwgb3V0cmVjLklzT3Blbilcblx0XHRcdFx0Y29udGludWU7XG4gICAgICBkbyAvL2ZvciBlYWNoIFB0IGluIFBvbHlnb24gdW50aWwgZHVwbGljYXRlIGZvdW5kIGRvIC4uLlxuICAgICAge1xuICAgICAgICB2YXIgb3AyID0gb3AuTmV4dDtcbiAgICAgICAgd2hpbGUgKG9wMiAhPSBvdXRyZWMuUHRzKVxuICAgICAgICB7XG4gICAgICAgICAgaWYgKChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KG9wLlB0LCBvcDIuUHQpKSAmJiBvcDIuTmV4dCAhPSBvcCAmJiBvcDIuUHJldiAhPSBvcClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAvL3NwbGl0IHRoZSBwb2x5Z29uIGludG8gdHdvIC4uLlxuICAgICAgICAgICAgdmFyIG9wMyA9IG9wLlByZXY7XG4gICAgICAgICAgICB2YXIgb3A0ID0gb3AyLlByZXY7XG4gICAgICAgICAgICBvcC5QcmV2ID0gb3A0O1xuICAgICAgICAgICAgb3A0Lk5leHQgPSBvcDtcbiAgICAgICAgICAgIG9wMi5QcmV2ID0gb3AzO1xuICAgICAgICAgICAgb3AzLk5leHQgPSBvcDI7XG4gICAgICAgICAgICBvdXRyZWMuUHRzID0gb3A7XG4gICAgICAgICAgICB2YXIgb3V0cmVjMiA9IHRoaXMuQ3JlYXRlT3V0UmVjKCk7XG4gICAgICAgICAgICBvdXRyZWMyLlB0cyA9IG9wMjtcbiAgICAgICAgICAgIHRoaXMuVXBkYXRlT3V0UHRJZHhzKG91dHJlYzIpO1xuICAgICAgICAgICAgaWYgKHRoaXMuUG9seTJDb250YWluc1BvbHkxKG91dHJlYzIuUHRzLCBvdXRyZWMuUHRzKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgLy9PdXRSZWMyIGlzIGNvbnRhaW5lZCBieSBPdXRSZWMxIC4uLlxuICAgICAgICAgICAgICBvdXRyZWMyLklzSG9sZSA9ICFvdXRyZWMuSXNIb2xlO1xuICAgICAgICAgICAgICBvdXRyZWMyLkZpcnN0TGVmdCA9IG91dHJlYztcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMubV9Vc2luZ1BvbHlUcmVlKSB0aGlzLkZpeHVwRmlyc3RMZWZ0czIob3V0cmVjMiwgb3V0cmVjKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5Qb2x5MkNvbnRhaW5zUG9seTEob3V0cmVjLlB0cywgb3V0cmVjMi5QdHMpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAvL091dFJlYzEgaXMgY29udGFpbmVkIGJ5IE91dFJlYzIgLi4uXG4gICAgICAgICAgICAgIG91dHJlYzIuSXNIb2xlID0gb3V0cmVjLklzSG9sZTtcbiAgICAgICAgICAgICAgb3V0cmVjLklzSG9sZSA9ICFvdXRyZWMyLklzSG9sZTtcbiAgICAgICAgICAgICAgb3V0cmVjMi5GaXJzdExlZnQgPSBvdXRyZWMuRmlyc3RMZWZ0O1xuICAgICAgICAgICAgICBvdXRyZWMuRmlyc3RMZWZ0ID0gb3V0cmVjMjtcbiAgICAgICAgICAgICAgaWYgKHRoaXMubV9Vc2luZ1BvbHlUcmVlKSB0aGlzLkZpeHVwRmlyc3RMZWZ0czIob3V0cmVjLCBvdXRyZWMyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgLy90aGUgMiBwb2x5Z29ucyBhcmUgc2VwYXJhdGUgLi4uXG4gICAgICAgICAgICAgIG91dHJlYzIuSXNIb2xlID0gb3V0cmVjLklzSG9sZTtcbiAgICAgICAgICAgICAgb3V0cmVjMi5GaXJzdExlZnQgPSBvdXRyZWMuRmlyc3RMZWZ0O1xuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5tX1VzaW5nUG9seVRyZWUpIHRoaXMuRml4dXBGaXJzdExlZnRzMShvdXRyZWMsIG91dHJlYzIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3AyID0gb3A7XG4gICAgICAgICAgICAvL2llIGdldCByZWFkeSBmb3IgdGhlIG5leHQgaXRlcmF0aW9uXG4gICAgICAgICAgfVxuICAgICAgICAgIG9wMiA9IG9wMi5OZXh0O1xuICAgICAgICB9XG4gICAgICAgIG9wID0gb3AuTmV4dDtcbiAgICAgIH1cbiAgICAgIHdoaWxlIChvcCAhPSBvdXRyZWMuUHRzKVxuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLkFyZWEgPSBmdW5jdGlvbiAocG9seSlcbiAge1xuICAgIHZhciBjbnQgPSBwb2x5Lmxlbmd0aDtcbiAgICBpZiAoY250IDwgMylcbiAgICAgIHJldHVybiAwO1xuICAgIHZhciBhID0gMDtcbiAgICBmb3IgKHZhciBpID0gMCwgaiA9IGNudCAtIDE7IGkgPCBjbnQ7ICsraSlcbiAgICB7XG4gICAgICBhICs9IChwb2x5W2pdLlggKyBwb2x5W2ldLlgpICogKHBvbHlbal0uWSAtIHBvbHlbaV0uWSk7XG4gICAgICBqID0gaTtcbiAgICB9XG4gICAgcmV0dXJuIC1hICogMC41O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkFyZWEgPSBmdW5jdGlvbiAob3V0UmVjKVxuICB7XG4gICAgdmFyIG9wID0gb3V0UmVjLlB0cztcbiAgICBpZiAob3AgPT0gbnVsbClcbiAgICAgIHJldHVybiAwO1xuICAgIHZhciBhID0gMDtcbiAgICBkbyB7XG4gICAgICBhID0gYSArIChvcC5QcmV2LlB0LlggKyBvcC5QdC5YKSAqIChvcC5QcmV2LlB0LlkgLSBvcC5QdC5ZKTtcbiAgICAgIG9wID0gb3AuTmV4dDtcbiAgICB9XG4gICAgd2hpbGUgKG9wICE9IG91dFJlYy5QdHMpXG4gICAgcmV0dXJuIGEgKiAwLjU7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5TaW1wbGlmeVBvbHlnb24gPSBmdW5jdGlvbiAocG9seSwgZmlsbFR5cGUpXG4gIHtcbiAgICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KCk7XG4gICAgdmFyIGMgPSBuZXcgQ2xpcHBlckxpYi5DbGlwcGVyKDApO1xuICAgIGMuU3RyaWN0bHlTaW1wbGUgPSB0cnVlO1xuICAgIGMuQWRkUGF0aChwb2x5LCBDbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdCwgdHJ1ZSk7XG4gICAgYy5FeGVjdXRlKENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RVbmlvbiwgcmVzdWx0LCBmaWxsVHlwZSwgZmlsbFR5cGUpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5TaW1wbGlmeVBvbHlnb25zID0gZnVuY3Rpb24gKHBvbHlzLCBmaWxsVHlwZSlcbiAge1xuICAgIGlmICh0eXBlb2YgKGZpbGxUeXBlKSA9PSBcInVuZGVmaW5lZFwiKSBmaWxsVHlwZSA9IENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdEV2ZW5PZGQ7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBBcnJheSgpO1xuICAgIHZhciBjID0gbmV3IENsaXBwZXJMaWIuQ2xpcHBlcigwKTtcbiAgICBjLlN0cmljdGx5U2ltcGxlID0gdHJ1ZTtcbiAgICBjLkFkZFBhdGhzKHBvbHlzLCBDbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdCwgdHJ1ZSk7XG4gICAgYy5FeGVjdXRlKENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RVbmlvbiwgcmVzdWx0LCBmaWxsVHlwZSwgZmlsbFR5cGUpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5EaXN0YW5jZVNxcmQgPSBmdW5jdGlvbiAocHQxLCBwdDIpXG4gIHtcbiAgICB2YXIgZHggPSAocHQxLlggLSBwdDIuWCk7XG4gICAgdmFyIGR5ID0gKHB0MS5ZIC0gcHQyLlkpO1xuICAgIHJldHVybiAoZHggKiBkeCArIGR5ICogZHkpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuRGlzdGFuY2VGcm9tTGluZVNxcmQgPSBmdW5jdGlvbiAocHQsIGxuMSwgbG4yKVxuICB7XG4gICAgLy9UaGUgZXF1YXRpb24gb2YgYSBsaW5lIGluIGdlbmVyYWwgZm9ybSAoQXggKyBCeSArIEMgPSAwKVxuICAgIC8vZ2l2ZW4gMiBwb2ludHMgKHjCuSx5wrkpICYgKHjCsix5wrIpIGlzIC4uLlxuICAgIC8vKHnCuSAtIHnCsil4ICsgKHjCsiAtIHjCuSl5ICsgKHnCsiAtIHnCuSl4wrkgLSAoeMKyIC0geMK5KXnCuSA9IDBcbiAgICAvL0EgPSAoecK5IC0gecKyKTsgQiA9ICh4wrIgLSB4wrkpOyBDID0gKHnCsiAtIHnCuSl4wrkgLSAoeMKyIC0geMK5KXnCuVxuICAgIC8vcGVycGVuZGljdWxhciBkaXN0YW5jZSBvZiBwb2ludCAoeMKzLHnCsykgPSAoQXjCsyArIEJ5wrMgKyBDKS9TcXJ0KEHCsiArIELCsilcbiAgICAvL3NlZSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1BlcnBlbmRpY3VsYXJfZGlzdGFuY2VcbiAgICB2YXIgQSA9IGxuMS5ZIC0gbG4yLlk7XG4gICAgdmFyIEIgPSBsbjIuWCAtIGxuMS5YO1xuICAgIHZhciBDID0gQSAqIGxuMS5YICsgQiAqIGxuMS5ZO1xuICAgIEMgPSBBICogcHQuWCArIEIgKiBwdC5ZIC0gQztcbiAgICByZXR1cm4gKEMgKiBDKSAvIChBICogQSArIEIgKiBCKTtcbiAgfTtcblxuXHRDbGlwcGVyTGliLkNsaXBwZXIuU2xvcGVzTmVhckNvbGxpbmVhciA9IGZ1bmN0aW9uKHB0MSwgcHQyLCBwdDMsIGRpc3RTcXJkKVxuXHR7XG5cdFx0Ly90aGlzIGZ1bmN0aW9uIGlzIG1vcmUgYWNjdXJhdGUgd2hlbiB0aGUgcG9pbnQgdGhhdCdzIEdFT01FVFJJQ0FMTFlcblx0XHQvL2JldHdlZW4gdGhlIG90aGVyIDIgcG9pbnRzIGlzIHRoZSBvbmUgdGhhdCdzIHRlc3RlZCBmb3IgZGlzdGFuY2UuXG5cdFx0Ly9uYjogd2l0aCAnc3Bpa2VzJywgZWl0aGVyIHB0MSBvciBwdDMgaXMgZ2VvbWV0cmljYWxseSBiZXR3ZWVuIHRoZSBvdGhlciBwdHNcblx0XHRpZiAoTWF0aC5hYnMocHQxLlggLSBwdDIuWCkgPiBNYXRoLmFicyhwdDEuWSAtIHB0Mi5ZKSlcblx0XHR7XG5cdFx0aWYgKChwdDEuWCA+IHB0Mi5YKSA9PSAocHQxLlggPCBwdDMuWCkpXG5cdFx0XHRyZXR1cm4gQ2xpcHBlckxpYi5DbGlwcGVyLkRpc3RhbmNlRnJvbUxpbmVTcXJkKHB0MSwgcHQyLCBwdDMpIDwgZGlzdFNxcmQ7XG5cdFx0ZWxzZSBpZiAoKHB0Mi5YID4gcHQxLlgpID09IChwdDIuWCA8IHB0My5YKSlcblx0XHRcdHJldHVybiBDbGlwcGVyTGliLkNsaXBwZXIuRGlzdGFuY2VGcm9tTGluZVNxcmQocHQyLCBwdDEsIHB0MykgPCBkaXN0U3FyZDtcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRyZXR1cm4gQ2xpcHBlckxpYi5DbGlwcGVyLkRpc3RhbmNlRnJvbUxpbmVTcXJkKHB0MywgcHQxLCBwdDIpIDwgZGlzdFNxcmQ7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0aWYgKChwdDEuWSA+IHB0Mi5ZKSA9PSAocHQxLlkgPCBwdDMuWSkpXG5cdFx0XHRyZXR1cm4gQ2xpcHBlckxpYi5DbGlwcGVyLkRpc3RhbmNlRnJvbUxpbmVTcXJkKHB0MSwgcHQyLCBwdDMpIDwgZGlzdFNxcmQ7XG5cdFx0ZWxzZSBpZiAoKHB0Mi5ZID4gcHQxLlkpID09IChwdDIuWSA8IHB0My5ZKSlcblx0XHRcdHJldHVybiBDbGlwcGVyTGliLkNsaXBwZXIuRGlzdGFuY2VGcm9tTGluZVNxcmQocHQyLCBwdDEsIHB0MykgPCBkaXN0U3FyZDtcblx0XHRcdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIENsaXBwZXJMaWIuQ2xpcHBlci5EaXN0YW5jZUZyb21MaW5lU3FyZChwdDMsIHB0MSwgcHQyKSA8IGRpc3RTcXJkO1xuXHRcdH1cblx0fVxuXG4gIENsaXBwZXJMaWIuQ2xpcHBlci5Qb2ludHNBcmVDbG9zZSA9IGZ1bmN0aW9uIChwdDEsIHB0MiwgZGlzdFNxcmQpXG4gIHtcbiAgICB2YXIgZHggPSBwdDEuWCAtIHB0Mi5YO1xuICAgIHZhciBkeSA9IHB0MS5ZIC0gcHQyLlk7XG4gICAgcmV0dXJuICgoZHggKiBkeCkgKyAoZHkgKiBkeSkgPD0gZGlzdFNxcmQpO1xuICB9O1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBDbGlwcGVyTGliLkNsaXBwZXIuRXhjbHVkZU9wID0gZnVuY3Rpb24gKG9wKVxuICB7XG4gICAgdmFyIHJlc3VsdCA9IG9wLlByZXY7XG4gICAgcmVzdWx0Lk5leHQgPSBvcC5OZXh0O1xuICAgIG9wLk5leHQuUHJldiA9IHJlc3VsdDtcbiAgICByZXN1bHQuSWR4ID0gMDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuQ2xlYW5Qb2x5Z29uID0gZnVuY3Rpb24gKHBhdGgsIGRpc3RhbmNlKVxuICB7XG4gICAgaWYgKHR5cGVvZiAoZGlzdGFuY2UpID09IFwidW5kZWZpbmVkXCIpIGRpc3RhbmNlID0gMS40MTU7XG4gICAgLy9kaXN0YW5jZSA9IHByb3hpbWl0eSBpbiB1bml0cy9waXhlbHMgYmVsb3cgd2hpY2ggdmVydGljZXMgd2lsbCBiZSBzdHJpcHBlZC5cbiAgICAvL0RlZmF1bHQgfj0gc3FydCgyKSBzbyB3aGVuIGFkamFjZW50IHZlcnRpY2VzIG9yIHNlbWktYWRqYWNlbnQgdmVydGljZXMgaGF2ZVxuICAgIC8vYm90aCB4ICYgeSBjb29yZHMgd2l0aGluIDEgdW5pdCwgdGhlbiB0aGUgc2Vjb25kIHZlcnRleCB3aWxsIGJlIHN0cmlwcGVkLlxuICAgIHZhciBjbnQgPSBwYXRoLmxlbmd0aDtcbiAgICBpZiAoY250ID09IDApXG4gICAgICByZXR1cm4gbmV3IEFycmF5KCk7XG4gICAgdmFyIG91dFB0cyA9IG5ldyBBcnJheShjbnQpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY250OyArK2kpXG4gICAgICBvdXRQdHNbaV0gPSBuZXcgQ2xpcHBlckxpYi5PdXRQdCgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY250OyArK2kpXG4gICAge1xuICAgICAgb3V0UHRzW2ldLlB0ID0gcGF0aFtpXTtcbiAgICAgIG91dFB0c1tpXS5OZXh0ID0gb3V0UHRzWyhpICsgMSkgJSBjbnRdO1xuICAgICAgb3V0UHRzW2ldLk5leHQuUHJldiA9IG91dFB0c1tpXTtcbiAgICAgIG91dFB0c1tpXS5JZHggPSAwO1xuICAgIH1cbiAgICB2YXIgZGlzdFNxcmQgPSBkaXN0YW5jZSAqIGRpc3RhbmNlO1xuICAgIHZhciBvcCA9IG91dFB0c1swXTtcbiAgICB3aGlsZSAob3AuSWR4ID09IDAgJiYgb3AuTmV4dCAhPSBvcC5QcmV2KVxuICAgIHtcbiAgICAgIGlmIChDbGlwcGVyTGliLkNsaXBwZXIuUG9pbnRzQXJlQ2xvc2Uob3AuUHQsIG9wLlByZXYuUHQsIGRpc3RTcXJkKSlcbiAgICAgIHtcbiAgICAgICAgb3AgPSBDbGlwcGVyTGliLkNsaXBwZXIuRXhjbHVkZU9wKG9wKTtcbiAgICAgICAgY250LS07XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChDbGlwcGVyTGliLkNsaXBwZXIuUG9pbnRzQXJlQ2xvc2Uob3AuUHJldi5QdCwgb3AuTmV4dC5QdCwgZGlzdFNxcmQpKVxuICAgICAge1xuICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXIuRXhjbHVkZU9wKG9wLk5leHQpO1xuICAgICAgICBvcCA9IENsaXBwZXJMaWIuQ2xpcHBlci5FeGNsdWRlT3Aob3ApO1xuICAgICAgICBjbnQgLT0gMjtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKENsaXBwZXJMaWIuQ2xpcHBlci5TbG9wZXNOZWFyQ29sbGluZWFyKG9wLlByZXYuUHQsIG9wLlB0LCBvcC5OZXh0LlB0LCBkaXN0U3FyZCkpXG4gICAgICB7XG4gICAgICAgIG9wID0gQ2xpcHBlckxpYi5DbGlwcGVyLkV4Y2x1ZGVPcChvcCk7XG4gICAgICAgIGNudC0tO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICBvcC5JZHggPSAxO1xuICAgICAgICBvcCA9IG9wLk5leHQ7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjbnQgPCAzKVxuICAgICAgY250ID0gMDtcbiAgICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KGNudCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbnQ7ICsraSlcbiAgICB7XG4gICAgICByZXN1bHRbaV0gPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChvcC5QdCk7XG4gICAgICBvcCA9IG9wLk5leHQ7XG4gICAgfVxuICAgIG91dFB0cyA9IG51bGw7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLkNsZWFuUG9seWdvbnMgPSBmdW5jdGlvbiAocG9seXMsIGRpc3RhbmNlKVxuICB7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBBcnJheShwb2x5cy5sZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBpbGVuID0gcG9seXMubGVuZ3RoOyBpIDwgaWxlbjsgaSsrKVxuICAgICAgcmVzdWx0W2ldID0gQ2xpcHBlckxpYi5DbGlwcGVyLkNsZWFuUG9seWdvbihwb2x5c1tpXSwgZGlzdGFuY2UpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5NaW5rb3dza2kgPSBmdW5jdGlvbiAocGF0dGVybiwgcGF0aCwgSXNTdW0sIElzQ2xvc2VkKVxuICB7XG4gICAgdmFyIGRlbHRhID0gKElzQ2xvc2VkID8gMSA6IDApO1xuICAgIHZhciBwb2x5Q250ID0gcGF0dGVybi5sZW5ndGg7XG4gICAgdmFyIHBhdGhDbnQgPSBwYXRoLmxlbmd0aDtcbiAgICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KCk7XG4gICAgaWYgKElzU3VtKVxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoQ250OyBpKyspXG4gICAgICB7XG4gICAgICAgIHZhciBwID0gbmV3IEFycmF5KHBvbHlDbnQpO1xuICAgICAgICBmb3IgKHZhciBqID0gMCwgamxlbiA9IHBhdHRlcm4ubGVuZ3RoLCBpcCA9IHBhdHRlcm5bal07IGogPCBqbGVuOyBqKyssIGlwID0gcGF0dGVybltqXSlcbiAgICAgICAgICBwW2pdID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQocGF0aFtpXS5YICsgaXAuWCwgcGF0aFtpXS5ZICsgaXAuWSk7XG4gICAgICAgIHJlc3VsdC5wdXNoKHApO1xuICAgICAgfVxuICAgIGVsc2VcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aENudDsgaSsrKVxuICAgICAge1xuICAgICAgICB2YXIgcCA9IG5ldyBBcnJheShwb2x5Q250KTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDAsIGpsZW4gPSBwYXR0ZXJuLmxlbmd0aCwgaXAgPSBwYXR0ZXJuW2pdOyBqIDwgamxlbjsgaisrLCBpcCA9IHBhdHRlcm5bal0pXG4gICAgICAgICAgcFtqXSA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KHBhdGhbaV0uWCAtIGlwLlgsIHBhdGhbaV0uWSAtIGlwLlkpO1xuICAgICAgICByZXN1bHQucHVzaChwKTtcbiAgICAgIH1cbiAgICB2YXIgcXVhZHMgPSBuZXcgQXJyYXkoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGhDbnQgLSAxICsgZGVsdGE7IGkrKylcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcG9seUNudDsgaisrKVxuICAgICAge1xuICAgICAgICB2YXIgcXVhZCA9IG5ldyBBcnJheSgpO1xuICAgICAgICBxdWFkLnB1c2gocmVzdWx0W2kgJSBwYXRoQ250XVtqICUgcG9seUNudF0pO1xuICAgICAgICBxdWFkLnB1c2gocmVzdWx0WyhpICsgMSkgJSBwYXRoQ250XVtqICUgcG9seUNudF0pO1xuICAgICAgICBxdWFkLnB1c2gocmVzdWx0WyhpICsgMSkgJSBwYXRoQ250XVsoaiArIDEpICUgcG9seUNudF0pO1xuICAgICAgICBxdWFkLnB1c2gocmVzdWx0W2kgJSBwYXRoQ250XVsoaiArIDEpICUgcG9seUNudF0pO1xuICAgICAgICBpZiAoIUNsaXBwZXJMaWIuQ2xpcHBlci5PcmllbnRhdGlvbihxdWFkKSlcbiAgICAgICAgICBxdWFkLnJldmVyc2UoKTtcbiAgICAgICAgcXVhZHMucHVzaChxdWFkKTtcbiAgICAgIH1cblx0XHRcdHJldHVybiBxdWFkcztcbiAgfTtcblxuXHRDbGlwcGVyTGliLkNsaXBwZXIuTWlua293c2tpU3VtID0gZnVuY3Rpb24ocGF0dGVybiwgcGF0aF9vcl9wYXRocywgcGF0aElzQ2xvc2VkKVxuXHR7XG5cdFx0aWYoIShwYXRoX29yX3BhdGhzWzBdIGluc3RhbmNlb2YgQXJyYXkpKVxuXHRcdHtcblx0XHRcdHZhciBwYXRoID0gcGF0aF9vcl9wYXRocztcblx0XHRcdHZhciBwYXRocyA9IENsaXBwZXJMaWIuQ2xpcHBlci5NaW5rb3dza2kocGF0dGVybiwgcGF0aCwgdHJ1ZSwgcGF0aElzQ2xvc2VkKTtcblx0XHRcdHZhciBjID0gbmV3IENsaXBwZXJMaWIuQ2xpcHBlcigpO1xuXHRcdFx0Yy5BZGRQYXRocyhwYXRocywgQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdFN1YmplY3QsIHRydWUpO1xuXHRcdFx0Yy5FeGVjdXRlKENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RVbmlvbiwgcGF0aHMsIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm8sIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm8pO1xuXHRcdFx0cmV0dXJuIHBhdGhzO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuIFx0XHRcdHZhciBwYXRocyA9IHBhdGhfb3JfcGF0aHM7XG5cdFx0XHR2YXIgc29sdXRpb24gPSBuZXcgQ2xpcHBlckxpYi5QYXRocygpO1xuXHRcdFx0dmFyIGMgPSBuZXcgQ2xpcHBlckxpYi5DbGlwcGVyKCk7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHBhdGhzLmxlbmd0aDsgKytpKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgdG1wID0gQ2xpcHBlckxpYi5DbGlwcGVyLk1pbmtvd3NraShwYXR0ZXJuLCBwYXRoc1tpXSwgdHJ1ZSwgcGF0aElzQ2xvc2VkKTtcblx0XHRcdFx0Yy5BZGRQYXRocyh0bXAsIENsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0LCB0cnVlKTtcblx0XHRcdFx0aWYgKHBhdGhJc0Nsb3NlZClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHZhciBwYXRoID0gQ2xpcHBlckxpYi5DbGlwcGVyLlRyYW5zbGF0ZVBhdGgocGF0aHNbaV0sIHBhdHRlcm5bMF0pO1xuXHRcdFx0XHRcdGMuQWRkUGF0aChwYXRoLCBDbGlwcGVyTGliLlBvbHlUeXBlLnB0Q2xpcCwgdHJ1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGMuRXhlY3V0ZShDbGlwcGVyTGliLkNsaXBUeXBlLmN0VW5pb24sIHNvbHV0aW9uLFxuXHRcdFx0XHRDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvLCBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvKTtcblx0XHRcdHJldHVybiBzb2x1dGlvbjtcblx0XHR9XG5cdH1cblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRDbGlwcGVyTGliLkNsaXBwZXIuVHJhbnNsYXRlUGF0aCA9IGZ1bmN0aW9uIChwYXRoLCBkZWx0YSlcblx0e1xuXHRcdHZhciBvdXRQYXRoID0gbmV3IENsaXBwZXJMaWIuUGF0aCgpO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKylcblx0XHRcdG91dFBhdGgucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChwYXRoW2ldLlggKyBkZWx0YS5YLCBwYXRoW2ldLlkgKyBkZWx0YS5ZKSk7XG5cdFx0cmV0dXJuIG91dFBhdGg7XG5cdH1cblx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRDbGlwcGVyTGliLkNsaXBwZXIuTWlua293c2tpRGlmZiA9IGZ1bmN0aW9uIChwb2x5MSwgcG9seTIpXG5cdHtcblx0XHR2YXIgcGF0aHMgPSBDbGlwcGVyTGliLkNsaXBwZXIuTWlua293c2tpKHBvbHkxLCBwb2x5MiwgZmFsc2UsIHRydWUpO1xuXHRcdHZhciBjID0gbmV3IENsaXBwZXJMaWIuQ2xpcHBlcigpO1xuXHRcdGMuQWRkUGF0aHMocGF0aHMsIENsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0LCB0cnVlKTtcblx0XHRjLkV4ZWN1dGUoQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFVuaW9uLCBwYXRocywgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybywgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybyk7XG5cdFx0cmV0dXJuIHBhdGhzO1xuXHR9XG5cbiAgQ2xpcHBlckxpYi5DbGlwcGVyLlBvbHlUcmVlVG9QYXRocyA9IGZ1bmN0aW9uIChwb2x5dHJlZSlcbiAge1xuICAgIHZhciByZXN1bHQgPSBuZXcgQXJyYXkoKTtcbiAgICAvL3Jlc3VsdC5zZXRfQ2FwYWNpdHkocG9seXRyZWUuZ2V0X1RvdGFsKCkpO1xuICAgIENsaXBwZXJMaWIuQ2xpcHBlci5BZGRQb2x5Tm9kZVRvUGF0aHMocG9seXRyZWUsIENsaXBwZXJMaWIuQ2xpcHBlci5Ob2RlVHlwZS5udEFueSwgcmVzdWx0KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuQWRkUG9seU5vZGVUb1BhdGhzID0gZnVuY3Rpb24gKHBvbHlub2RlLCBudCwgcGF0aHMpXG4gIHtcbiAgICB2YXIgbWF0Y2ggPSB0cnVlO1xuICAgIHN3aXRjaCAobnQpXG4gICAge1xuICAgIGNhc2UgQ2xpcHBlckxpYi5DbGlwcGVyLk5vZGVUeXBlLm50T3BlbjpcbiAgICAgIHJldHVybjtcbiAgICBjYXNlIENsaXBwZXJMaWIuQ2xpcHBlci5Ob2RlVHlwZS5udENsb3NlZDpcbiAgICAgIG1hdGNoID0gIXBvbHlub2RlLklzT3BlbjtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKHBvbHlub2RlLm1fcG9seWdvbi5sZW5ndGggPiAwICYmIG1hdGNoKVxuICAgICAgcGF0aHMucHVzaChwb2x5bm9kZS5tX3BvbHlnb24pO1xuICAgIGZvciAodmFyICRpMyA9IDAsICR0MyA9IHBvbHlub2RlLkNoaWxkcygpLCAkbDMgPSAkdDMubGVuZ3RoLCBwbiA9ICR0M1skaTNdOyAkaTMgPCAkbDM7ICRpMysrLCBwbiA9ICR0M1skaTNdKVxuICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyLkFkZFBvbHlOb2RlVG9QYXRocyhwbiwgbnQsIHBhdGhzKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLk9wZW5QYXRoc0Zyb21Qb2x5VHJlZSA9IGZ1bmN0aW9uIChwb2x5dHJlZSlcbiAge1xuICAgIHZhciByZXN1bHQgPSBuZXcgQ2xpcHBlckxpYi5QYXRocygpO1xuICAgIC8vcmVzdWx0LnNldF9DYXBhY2l0eShwb2x5dHJlZS5DaGlsZENvdW50KCkpO1xuICAgIGZvciAodmFyIGkgPSAwLCBpbGVuID0gcG9seXRyZWUuQ2hpbGRDb3VudCgpOyBpIDwgaWxlbjsgaSsrKVxuICAgICAgaWYgKHBvbHl0cmVlLkNoaWxkcygpW2ldLklzT3BlbilcbiAgICAgICAgcmVzdWx0LnB1c2gocG9seXRyZWUuQ2hpbGRzKClbaV0ubV9wb2x5Z29uKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuQ2xvc2VkUGF0aHNGcm9tUG9seVRyZWUgPSBmdW5jdGlvbiAocG9seXRyZWUpXG4gIHtcbiAgICB2YXIgcmVzdWx0ID0gbmV3IENsaXBwZXJMaWIuUGF0aHMoKTtcbiAgICAvL3Jlc3VsdC5zZXRfQ2FwYWNpdHkocG9seXRyZWUuVG90YWwoKSk7XG4gICAgQ2xpcHBlckxpYi5DbGlwcGVyLkFkZFBvbHlOb2RlVG9QYXRocyhwb2x5dHJlZSwgQ2xpcHBlckxpYi5DbGlwcGVyLk5vZGVUeXBlLm50Q2xvc2VkLCByZXN1bHQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG4gIEluaGVyaXQoQ2xpcHBlckxpYi5DbGlwcGVyLCBDbGlwcGVyTGliLkNsaXBwZXJCYXNlKTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLk5vZGVUeXBlID0ge1xuICAgIG50QW55OiAwLFxuICAgIG50T3BlbjogMSxcbiAgICBudENsb3NlZDogMlxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQgPSBmdW5jdGlvbiAobWl0ZXJMaW1pdCwgYXJjVG9sZXJhbmNlKVxuICB7XG4gICAgaWYgKHR5cGVvZiAobWl0ZXJMaW1pdCkgPT0gXCJ1bmRlZmluZWRcIikgbWl0ZXJMaW1pdCA9IDI7XG4gICAgaWYgKHR5cGVvZiAoYXJjVG9sZXJhbmNlKSA9PSBcInVuZGVmaW5lZFwiKSBhcmNUb2xlcmFuY2UgPSBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuZGVmX2FyY190b2xlcmFuY2U7XG4gICAgdGhpcy5tX2Rlc3RQb2x5cyA9IG5ldyBDbGlwcGVyTGliLlBhdGhzKCk7XG4gICAgdGhpcy5tX3NyY1BvbHkgPSBuZXcgQ2xpcHBlckxpYi5QYXRoKCk7XG4gICAgdGhpcy5tX2Rlc3RQb2x5ID0gbmV3IENsaXBwZXJMaWIuUGF0aCgpO1xuICAgIHRoaXMubV9ub3JtYWxzID0gbmV3IEFycmF5KCk7XG4gICAgdGhpcy5tX2RlbHRhID0gMDtcbiAgICB0aGlzLm1fc2luQSA9IDA7XG4gICAgdGhpcy5tX3NpbiA9IDA7XG4gICAgdGhpcy5tX2NvcyA9IDA7XG4gICAgdGhpcy5tX21pdGVyTGltID0gMDtcbiAgICB0aGlzLm1fU3RlcHNQZXJSYWQgPSAwO1xuICAgIHRoaXMubV9sb3dlc3QgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludCgpO1xuICAgIHRoaXMubV9wb2x5Tm9kZXMgPSBuZXcgQ2xpcHBlckxpYi5Qb2x5Tm9kZSgpO1xuICAgIHRoaXMuTWl0ZXJMaW1pdCA9IG1pdGVyTGltaXQ7XG4gICAgdGhpcy5BcmNUb2xlcmFuY2UgPSBhcmNUb2xlcmFuY2U7XG4gICAgdGhpcy5tX2xvd2VzdC5YID0gLTE7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC50d29fcGkgPSA2LjI4MzE4NTMwNzE3OTU5O1xuICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuZGVmX2FyY190b2xlcmFuY2UgPSAwLjI1O1xuICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQucHJvdG90eXBlLkNsZWFyID0gZnVuY3Rpb24gKClcbiAge1xuICAgIENsaXBwZXJMaWIuQ2xlYXIodGhpcy5tX3BvbHlOb2Rlcy5DaGlsZHMoKSk7XG4gICAgdGhpcy5tX2xvd2VzdC5YID0gLTE7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCA9IENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZDtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LnByb3RvdHlwZS5BZGRQYXRoID0gZnVuY3Rpb24gKHBhdGgsIGpvaW5UeXBlLCBlbmRUeXBlKVxuICB7XG4gICAgdmFyIGhpZ2hJID0gcGF0aC5sZW5ndGggLSAxO1xuICAgIGlmIChoaWdoSSA8IDApXG4gICAgICByZXR1cm47XG4gICAgdmFyIG5ld05vZGUgPSBuZXcgQ2xpcHBlckxpYi5Qb2x5Tm9kZSgpO1xuICAgIG5ld05vZGUubV9qb2ludHlwZSA9IGpvaW5UeXBlO1xuICAgIG5ld05vZGUubV9lbmR0eXBlID0gZW5kVHlwZTtcbiAgICAvL3N0cmlwIGR1cGxpY2F0ZSBwb2ludHMgZnJvbSBwYXRoIGFuZCBhbHNvIGdldCBpbmRleCB0byB0aGUgbG93ZXN0IHBvaW50IC4uLlxuICAgIGlmIChlbmRUeXBlID09IENsaXBwZXJMaWIuRW5kVHlwZS5ldENsb3NlZExpbmUgfHwgZW5kVHlwZSA9PSBDbGlwcGVyTGliLkVuZFR5cGUuZXRDbG9zZWRQb2x5Z29uKVxuICAgICAgd2hpbGUgKGhpZ2hJID4gMCAmJiBDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHBhdGhbMF0sIHBhdGhbaGlnaEldKSlcbiAgICAgICAgaGlnaEktLTtcbiAgICAvL25ld05vZGUubV9wb2x5Z29uLnNldF9DYXBhY2l0eShoaWdoSSArIDEpO1xuICAgIG5ld05vZGUubV9wb2x5Z29uLnB1c2gocGF0aFswXSk7XG4gICAgdmFyIGogPSAwLFxuICAgICAgayA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPD0gaGlnaEk7IGkrKylcbiAgICAgIGlmIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0luZXF1YWxpdHkobmV3Tm9kZS5tX3BvbHlnb25bal0sIHBhdGhbaV0pKVxuICAgICAge1xuICAgICAgICBqKys7XG4gICAgICAgIG5ld05vZGUubV9wb2x5Z29uLnB1c2gocGF0aFtpXSk7XG4gICAgICAgIGlmIChwYXRoW2ldLlkgPiBuZXdOb2RlLm1fcG9seWdvbltrXS5ZIHx8IChwYXRoW2ldLlkgPT0gbmV3Tm9kZS5tX3BvbHlnb25ba10uWSAmJiBwYXRoW2ldLlggPCBuZXdOb2RlLm1fcG9seWdvbltrXS5YKSlcbiAgICAgICAgICBrID0gajtcbiAgICAgIH1cbiAgICBpZiAoZW5kVHlwZSA9PSBDbGlwcGVyTGliLkVuZFR5cGUuZXRDbG9zZWRQb2x5Z29uICYmIGogPCAyKSByZXR1cm47XG5cbiAgICB0aGlzLm1fcG9seU5vZGVzLkFkZENoaWxkKG5ld05vZGUpO1xuICAgIC8vaWYgdGhpcyBwYXRoJ3MgbG93ZXN0IHB0IGlzIGxvd2VyIHRoYW4gYWxsIHRoZSBvdGhlcnMgdGhlbiB1cGRhdGUgbV9sb3dlc3RcbiAgICBpZiAoZW5kVHlwZSAhPSBDbGlwcGVyTGliLkVuZFR5cGUuZXRDbG9zZWRQb2x5Z29uKVxuICAgICAgcmV0dXJuO1xuICAgIGlmICh0aGlzLm1fbG93ZXN0LlggPCAwKVxuICAgICAgdGhpcy5tX2xvd2VzdCA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KHRoaXMubV9wb2x5Tm9kZXMuQ2hpbGRDb3VudCgpIC0gMSwgayk7XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIHZhciBpcCA9IHRoaXMubV9wb2x5Tm9kZXMuQ2hpbGRzKClbdGhpcy5tX2xvd2VzdC5YXS5tX3BvbHlnb25bdGhpcy5tX2xvd2VzdC5ZXTtcbiAgICAgIGlmIChuZXdOb2RlLm1fcG9seWdvbltrXS5ZID4gaXAuWSB8fCAobmV3Tm9kZS5tX3BvbHlnb25ba10uWSA9PSBpcC5ZICYmIG5ld05vZGUubV9wb2x5Z29uW2tdLlggPCBpcC5YKSlcbiAgICAgICAgdGhpcy5tX2xvd2VzdCA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KHRoaXMubV9wb2x5Tm9kZXMuQ2hpbGRDb3VudCgpIC0gMSwgayk7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQucHJvdG90eXBlLkFkZFBhdGhzID0gZnVuY3Rpb24gKHBhdGhzLCBqb2luVHlwZSwgZW5kVHlwZSlcbiAge1xuICAgIGZvciAodmFyIGkgPSAwLCBpbGVuID0gcGF0aHMubGVuZ3RoOyBpIDwgaWxlbjsgaSsrKVxuICAgICAgdGhpcy5BZGRQYXRoKHBhdGhzW2ldLCBqb2luVHlwZSwgZW5kVHlwZSk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5wcm90b3R5cGUuRml4T3JpZW50YXRpb25zID0gZnVuY3Rpb24gKClcbiAge1xuICAgIC8vZml4dXAgb3JpZW50YXRpb25zIG9mIGFsbCBjbG9zZWQgcGF0aHMgaWYgdGhlIG9yaWVudGF0aW9uIG9mIHRoZVxuICAgIC8vY2xvc2VkIHBhdGggd2l0aCB0aGUgbG93ZXJtb3N0IHZlcnRleCBpcyB3cm9uZyAuLi5cbiAgICBpZiAodGhpcy5tX2xvd2VzdC5YID49IDAgJiYgIUNsaXBwZXJMaWIuQ2xpcHBlci5PcmllbnRhdGlvbih0aGlzLm1fcG9seU5vZGVzLkNoaWxkcygpW3RoaXMubV9sb3dlc3QuWF0ubV9wb2x5Z29uKSlcbiAgICB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubV9wb2x5Tm9kZXMuQ2hpbGRDb3VudCgpOyBpKyspXG4gICAgICB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tX3BvbHlOb2Rlcy5DaGlsZHMoKVtpXTtcbiAgICAgICAgaWYgKG5vZGUubV9lbmR0eXBlID09IENsaXBwZXJMaWIuRW5kVHlwZS5ldENsb3NlZFBvbHlnb24gfHwgKG5vZGUubV9lbmR0eXBlID09IENsaXBwZXJMaWIuRW5kVHlwZS5ldENsb3NlZExpbmUgJiYgQ2xpcHBlckxpYi5DbGlwcGVyLk9yaWVudGF0aW9uKG5vZGUubV9wb2x5Z29uKSkpXG4gICAgICAgICAgbm9kZS5tX3BvbHlnb24ucmV2ZXJzZSgpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1fcG9seU5vZGVzLkNoaWxkQ291bnQoKTsgaSsrKVxuICAgICAge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubV9wb2x5Tm9kZXMuQ2hpbGRzKClbaV07XG4gICAgICAgIGlmIChub2RlLm1fZW5kdHlwZSA9PSBDbGlwcGVyTGliLkVuZFR5cGUuZXRDbG9zZWRMaW5lICYmICFDbGlwcGVyTGliLkNsaXBwZXIuT3JpZW50YXRpb24obm9kZS5tX3BvbHlnb24pKVxuICAgICAgICAgIG5vZGUubV9wb2x5Z29uLnJldmVyc2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5HZXRVbml0Tm9ybWFsID0gZnVuY3Rpb24gKHB0MSwgcHQyKVxuICB7XG4gICAgdmFyIGR4ID0gKHB0Mi5YIC0gcHQxLlgpO1xuICAgIHZhciBkeSA9IChwdDIuWSAtIHB0MS5ZKTtcbiAgICBpZiAoKGR4ID09IDApICYmIChkeSA9PSAwKSlcbiAgICAgIHJldHVybiBuZXcgQ2xpcHBlckxpYi5Eb3VibGVQb2ludCgwLCAwKTtcbiAgICB2YXIgZiA9IDEgLyBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuICAgIGR4ICo9IGY7XG4gICAgZHkgKj0gZjtcbiAgICByZXR1cm4gbmV3IENsaXBwZXJMaWIuRG91YmxlUG9pbnQoZHksIC1keCk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5wcm90b3R5cGUuRG9PZmZzZXQgPSBmdW5jdGlvbiAoZGVsdGEpXG4gIHtcbiAgICB0aGlzLm1fZGVzdFBvbHlzID0gbmV3IEFycmF5KCk7XG4gICAgdGhpcy5tX2RlbHRhID0gZGVsdGE7XG4gICAgLy9pZiBaZXJvIG9mZnNldCwganVzdCBjb3B5IGFueSBDTE9TRUQgcG9seWdvbnMgdG8gbV9wIGFuZCByZXR1cm4gLi4uXG4gICAgaWYgKENsaXBwZXJMaWIuQ2xpcHBlckJhc2UubmVhcl96ZXJvKGRlbHRhKSlcbiAgICB7XG4gICAgICAvL3RoaXMubV9kZXN0UG9seXMuc2V0X0NhcGFjaXR5KHRoaXMubV9wb2x5Tm9kZXMuQ2hpbGRDb3VudCk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubV9wb2x5Tm9kZXMuQ2hpbGRDb3VudCgpOyBpKyspXG4gICAgICB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5tX3BvbHlOb2Rlcy5DaGlsZHMoKVtpXTtcbiAgICAgICAgaWYgKG5vZGUubV9lbmR0eXBlID09IENsaXBwZXJMaWIuRW5kVHlwZS5ldENsb3NlZFBvbHlnb24pXG4gICAgICAgICAgdGhpcy5tX2Rlc3RQb2x5cy5wdXNoKG5vZGUubV9wb2x5Z29uKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy9zZWUgb2Zmc2V0X3RyaWdpbm9tZXRyeTMuc3ZnIGluIHRoZSBkb2N1bWVudGF0aW9uIGZvbGRlciAuLi5cbiAgICBpZiAodGhpcy5NaXRlckxpbWl0ID4gMilcbiAgICAgIHRoaXMubV9taXRlckxpbSA9IDIgLyAodGhpcy5NaXRlckxpbWl0ICogdGhpcy5NaXRlckxpbWl0KTtcbiAgICBlbHNlXG4gICAgICB0aGlzLm1fbWl0ZXJMaW0gPSAwLjU7XG4gICAgdmFyIHk7XG4gICAgaWYgKHRoaXMuQXJjVG9sZXJhbmNlIDw9IDApXG4gICAgICB5ID0gQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LmRlZl9hcmNfdG9sZXJhbmNlO1xuICAgIGVsc2UgaWYgKHRoaXMuQXJjVG9sZXJhbmNlID4gTWF0aC5hYnMoZGVsdGEpICogQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LmRlZl9hcmNfdG9sZXJhbmNlKVxuICAgICAgeSA9IE1hdGguYWJzKGRlbHRhKSAqIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5kZWZfYXJjX3RvbGVyYW5jZTtcbiAgICBlbHNlXG4gICAgICB5ID0gdGhpcy5BcmNUb2xlcmFuY2U7XG4gICAgLy9zZWUgb2Zmc2V0X3RyaWdpbm9tZXRyeTIuc3ZnIGluIHRoZSBkb2N1bWVudGF0aW9uIGZvbGRlciAuLi5cbiAgICB2YXIgc3RlcHMgPSAzLjE0MTU5MjY1MzU4OTc5IC8gTWF0aC5hY29zKDEgLSB5IC8gTWF0aC5hYnMoZGVsdGEpKTtcbiAgICB0aGlzLm1fc2luID0gTWF0aC5zaW4oQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LnR3b19waSAvIHN0ZXBzKTtcbiAgICB0aGlzLm1fY29zID0gTWF0aC5jb3MoQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LnR3b19waSAvIHN0ZXBzKTtcbiAgICB0aGlzLm1fU3RlcHNQZXJSYWQgPSBzdGVwcyAvIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC50d29fcGk7XG4gICAgaWYgKGRlbHRhIDwgMClcbiAgICAgIHRoaXMubV9zaW4gPSAtdGhpcy5tX3NpbjtcbiAgICAvL3RoaXMubV9kZXN0UG9seXMuc2V0X0NhcGFjaXR5KHRoaXMubV9wb2x5Tm9kZXMuQ2hpbGRDb3VudCAqIDIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tX3BvbHlOb2Rlcy5DaGlsZENvdW50KCk7IGkrKylcbiAgICB7XG4gICAgICB2YXIgbm9kZSA9IHRoaXMubV9wb2x5Tm9kZXMuQ2hpbGRzKClbaV07XG4gICAgICB0aGlzLm1fc3JjUG9seSA9IG5vZGUubV9wb2x5Z29uO1xuICAgICAgdmFyIGxlbiA9IHRoaXMubV9zcmNQb2x5Lmxlbmd0aDtcbiAgICAgIGlmIChsZW4gPT0gMCB8fCAoZGVsdGEgPD0gMCAmJiAobGVuIDwgMyB8fCBub2RlLm1fZW5kdHlwZSAhPSBDbGlwcGVyTGliLkVuZFR5cGUuZXRDbG9zZWRQb2x5Z29uKSkpXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgdGhpcy5tX2Rlc3RQb2x5ID0gbmV3IEFycmF5KCk7XG4gICAgICBpZiAobGVuID09IDEpXG4gICAgICB7XG4gICAgICAgIGlmIChub2RlLm1fam9pbnR5cGUgPT0gQ2xpcHBlckxpYi5Kb2luVHlwZS5qdFJvdW5kKVxuICAgICAgICB7XG4gICAgICAgICAgdmFyIFggPSAxLFxuICAgICAgICAgICAgWSA9IDA7XG4gICAgICAgICAgZm9yICh2YXIgaiA9IDE7IGogPD0gc3RlcHM7IGorKylcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLm1fZGVzdFBvbHkucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbMF0uWCArIFggKiBkZWx0YSksIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVswXS5ZICsgWSAqIGRlbHRhKSkpO1xuICAgICAgICAgICAgdmFyIFgyID0gWDtcbiAgICAgICAgICAgIFggPSBYICogdGhpcy5tX2NvcyAtIHRoaXMubV9zaW4gKiBZO1xuICAgICAgICAgICAgWSA9IFgyICogdGhpcy5tX3NpbiArIFkgKiB0aGlzLm1fY29zO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgWCA9IC0xLFxuICAgICAgICAgICAgWSA9IC0xO1xuICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgNDsgKytqKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMubV9kZXN0UG9seS5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVswXS5YICsgWCAqIGRlbHRhKSwgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5WzBdLlkgKyBZICogZGVsdGEpKSk7XG4gICAgICAgICAgICBpZiAoWCA8IDApXG4gICAgICAgICAgICAgIFggPSAxO1xuICAgICAgICAgICAgZWxzZSBpZiAoWSA8IDApXG4gICAgICAgICAgICAgIFkgPSAxO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICBYID0gLTE7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubV9kZXN0UG9seXMucHVzaCh0aGlzLm1fZGVzdFBvbHkpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8vYnVpbGQgbV9ub3JtYWxzIC4uLlxuICAgICAgdGhpcy5tX25vcm1hbHMubGVuZ3RoID0gMDtcbiAgICAgIC8vdGhpcy5tX25vcm1hbHMuc2V0X0NhcGFjaXR5KGxlbik7XG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxlbiAtIDE7IGorKylcbiAgICAgICAgdGhpcy5tX25vcm1hbHMucHVzaChDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuR2V0VW5pdE5vcm1hbCh0aGlzLm1fc3JjUG9seVtqXSwgdGhpcy5tX3NyY1BvbHlbaiArIDFdKSk7XG4gICAgICBpZiAobm9kZS5tX2VuZHR5cGUgPT0gQ2xpcHBlckxpYi5FbmRUeXBlLmV0Q2xvc2VkTGluZSB8fCBub2RlLm1fZW5kdHlwZSA9PSBDbGlwcGVyTGliLkVuZFR5cGUuZXRDbG9zZWRQb2x5Z29uKVxuICAgICAgICB0aGlzLm1fbm9ybWFscy5wdXNoKENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5HZXRVbml0Tm9ybWFsKHRoaXMubV9zcmNQb2x5W2xlbiAtIDFdLCB0aGlzLm1fc3JjUG9seVswXSkpO1xuICAgICAgZWxzZVxuICAgICAgICB0aGlzLm1fbm9ybWFscy5wdXNoKG5ldyBDbGlwcGVyTGliLkRvdWJsZVBvaW50KHRoaXMubV9ub3JtYWxzW2xlbiAtIDJdKSk7XG4gICAgICBpZiAobm9kZS5tX2VuZHR5cGUgPT0gQ2xpcHBlckxpYi5FbmRUeXBlLmV0Q2xvc2VkUG9seWdvbilcbiAgICAgIHtcbiAgICAgICAgdmFyIGsgPSBsZW4gLSAxO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxlbjsgaisrKVxuICAgICAgICAgIGsgPSB0aGlzLk9mZnNldFBvaW50KGosIGssIG5vZGUubV9qb2ludHlwZSk7XG4gICAgICAgIHRoaXMubV9kZXN0UG9seXMucHVzaCh0aGlzLm1fZGVzdFBvbHkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAobm9kZS5tX2VuZHR5cGUgPT0gQ2xpcHBlckxpYi5FbmRUeXBlLmV0Q2xvc2VkTGluZSlcbiAgICAgIHtcbiAgICAgICAgdmFyIGsgPSBsZW4gLSAxO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxlbjsgaisrKVxuICAgICAgICAgIGsgPSB0aGlzLk9mZnNldFBvaW50KGosIGssIG5vZGUubV9qb2ludHlwZSk7XG4gICAgICAgIHRoaXMubV9kZXN0UG9seXMucHVzaCh0aGlzLm1fZGVzdFBvbHkpO1xuICAgICAgICB0aGlzLm1fZGVzdFBvbHkgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgLy9yZS1idWlsZCBtX25vcm1hbHMgLi4uXG4gICAgICAgIHZhciBuID0gdGhpcy5tX25vcm1hbHNbbGVuIC0gMV07XG4gICAgICAgIGZvciAodmFyIGogPSBsZW4gLSAxOyBqID4gMDsgai0tKVxuICAgICAgICAgIHRoaXMubV9ub3JtYWxzW2pdID0gbmV3IENsaXBwZXJMaWIuRG91YmxlUG9pbnQoLXRoaXMubV9ub3JtYWxzW2ogLSAxXS5YLCAtdGhpcy5tX25vcm1hbHNbaiAtIDFdLlkpO1xuICAgICAgICB0aGlzLm1fbm9ybWFsc1swXSA9IG5ldyBDbGlwcGVyTGliLkRvdWJsZVBvaW50KC1uLlgsIC1uLlkpO1xuICAgICAgICBrID0gMDtcbiAgICAgICAgZm9yICh2YXIgaiA9IGxlbiAtIDE7IGogPj0gMDsgai0tKVxuICAgICAgICAgIGsgPSB0aGlzLk9mZnNldFBvaW50KGosIGssIG5vZGUubV9qb2ludHlwZSk7XG4gICAgICAgIHRoaXMubV9kZXN0UG9seXMucHVzaCh0aGlzLm1fZGVzdFBvbHkpO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICB2YXIgayA9IDA7XG4gICAgICAgIGZvciAodmFyIGogPSAxOyBqIDwgbGVuIC0gMTsgKytqKVxuICAgICAgICAgIGsgPSB0aGlzLk9mZnNldFBvaW50KGosIGssIG5vZGUubV9qb2ludHlwZSk7XG4gICAgICAgIHZhciBwdDE7XG4gICAgICAgIGlmIChub2RlLm1fZW5kdHlwZSA9PSBDbGlwcGVyTGliLkVuZFR5cGUuZXRPcGVuQnV0dClcbiAgICAgICAge1xuICAgICAgICAgIHZhciBqID0gbGVuIC0gMTtcbiAgICAgICAgICBwdDEgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWCArIHRoaXMubV9ub3JtYWxzW2pdLlggKiBkZWx0YSksIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5ZICsgdGhpcy5tX25vcm1hbHNbal0uWSAqIGRlbHRhKSk7XG4gICAgICAgICAgdGhpcy5tX2Rlc3RQb2x5LnB1c2gocHQxKTtcbiAgICAgICAgICBwdDEgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWCAtIHRoaXMubV9ub3JtYWxzW2pdLlggKiBkZWx0YSksIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5ZIC0gdGhpcy5tX25vcm1hbHNbal0uWSAqIGRlbHRhKSk7XG4gICAgICAgICAgdGhpcy5tX2Rlc3RQb2x5LnB1c2gocHQxKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgaiA9IGxlbiAtIDE7XG4gICAgICAgICAgayA9IGxlbiAtIDI7XG4gICAgICAgICAgdGhpcy5tX3NpbkEgPSAwO1xuICAgICAgICAgIHRoaXMubV9ub3JtYWxzW2pdID0gbmV3IENsaXBwZXJMaWIuRG91YmxlUG9pbnQoLXRoaXMubV9ub3JtYWxzW2pdLlgsIC10aGlzLm1fbm9ybWFsc1tqXS5ZKTtcbiAgICAgICAgICBpZiAobm9kZS5tX2VuZHR5cGUgPT0gQ2xpcHBlckxpYi5FbmRUeXBlLmV0T3BlblNxdWFyZSlcbiAgICAgICAgICAgIHRoaXMuRG9TcXVhcmUoaiwgayk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpcy5Eb1JvdW5kKGosIGspO1xuICAgICAgICB9XG4gICAgICAgIC8vcmUtYnVpbGQgbV9ub3JtYWxzIC4uLlxuICAgICAgICBmb3IgKHZhciBqID0gbGVuIC0gMTsgaiA+IDA7IGotLSlcbiAgICAgICAgICB0aGlzLm1fbm9ybWFsc1tqXSA9IG5ldyBDbGlwcGVyTGliLkRvdWJsZVBvaW50KC10aGlzLm1fbm9ybWFsc1tqIC0gMV0uWCwgLXRoaXMubV9ub3JtYWxzW2ogLSAxXS5ZKTtcbiAgICAgICAgdGhpcy5tX25vcm1hbHNbMF0gPSBuZXcgQ2xpcHBlckxpYi5Eb3VibGVQb2ludCgtdGhpcy5tX25vcm1hbHNbMV0uWCwgLXRoaXMubV9ub3JtYWxzWzFdLlkpO1xuICAgICAgICBrID0gbGVuIC0gMTtcbiAgICAgICAgZm9yICh2YXIgaiA9IGsgLSAxOyBqID4gMDsgLS1qKVxuICAgICAgICAgIGsgPSB0aGlzLk9mZnNldFBvaW50KGosIGssIG5vZGUubV9qb2ludHlwZSk7XG4gICAgICAgIGlmIChub2RlLm1fZW5kdHlwZSA9PSBDbGlwcGVyTGliLkVuZFR5cGUuZXRPcGVuQnV0dClcbiAgICAgICAge1xuICAgICAgICAgIHB0MSA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVswXS5YIC0gdGhpcy5tX25vcm1hbHNbMF0uWCAqIGRlbHRhKSwgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5WzBdLlkgLSB0aGlzLm1fbm9ybWFsc1swXS5ZICogZGVsdGEpKTtcbiAgICAgICAgICB0aGlzLm1fZGVzdFBvbHkucHVzaChwdDEpO1xuICAgICAgICAgIHB0MSA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVswXS5YICsgdGhpcy5tX25vcm1hbHNbMF0uWCAqIGRlbHRhKSwgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5WzBdLlkgKyB0aGlzLm1fbm9ybWFsc1swXS5ZICogZGVsdGEpKTtcbiAgICAgICAgICB0aGlzLm1fZGVzdFBvbHkucHVzaChwdDEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgIGsgPSAxO1xuICAgICAgICAgIHRoaXMubV9zaW5BID0gMDtcbiAgICAgICAgICBpZiAobm9kZS5tX2VuZHR5cGUgPT0gQ2xpcHBlckxpYi5FbmRUeXBlLmV0T3BlblNxdWFyZSlcbiAgICAgICAgICAgIHRoaXMuRG9TcXVhcmUoMCwgMSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpcy5Eb1JvdW5kKDAsIDEpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubV9kZXN0UG9seXMucHVzaCh0aGlzLm1fZGVzdFBvbHkpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LnByb3RvdHlwZS5FeGVjdXRlID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHZhciBhID0gYXJndW1lbnRzLFxuICAgICAgaXNwb2x5dHJlZSA9IGFbMF0gaW5zdGFuY2VvZiBDbGlwcGVyTGliLlBvbHlUcmVlO1xuICAgIGlmICghaXNwb2x5dHJlZSkgLy8gZnVuY3Rpb24gKHNvbHV0aW9uLCBkZWx0YSlcbiAgICB7XG4gICAgICB2YXIgc29sdXRpb24gPSBhWzBdLFxuICAgICAgICBkZWx0YSA9IGFbMV07XG4gICAgICBDbGlwcGVyTGliLkNsZWFyKHNvbHV0aW9uKTtcbiAgICAgIHRoaXMuRml4T3JpZW50YXRpb25zKCk7XG4gICAgICB0aGlzLkRvT2Zmc2V0KGRlbHRhKTtcbiAgICAgIC8vbm93IGNsZWFuIHVwICdjb3JuZXJzJyAuLi5cbiAgICAgIHZhciBjbHByID0gbmV3IENsaXBwZXJMaWIuQ2xpcHBlcigwKTtcbiAgICAgIGNscHIuQWRkUGF0aHModGhpcy5tX2Rlc3RQb2x5cywgQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdFN1YmplY3QsIHRydWUpO1xuICAgICAgaWYgKGRlbHRhID4gMClcbiAgICAgIHtcbiAgICAgICAgY2xwci5FeGVjdXRlKENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RVbmlvbiwgc29sdXRpb24sIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdFBvc2l0aXZlLCBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRQb3NpdGl2ZSk7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIHZhciByID0gQ2xpcHBlckxpYi5DbGlwcGVyLkdldEJvdW5kcyh0aGlzLm1fZGVzdFBvbHlzKTtcbiAgICAgICAgdmFyIG91dGVyID0gbmV3IENsaXBwZXJMaWIuUGF0aCgpO1xuICAgICAgICBvdXRlci5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KHIubGVmdCAtIDEwLCByLmJvdHRvbSArIDEwKSk7XG4gICAgICAgIG91dGVyLnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoci5yaWdodCArIDEwLCByLmJvdHRvbSArIDEwKSk7XG4gICAgICAgIG91dGVyLnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoci5yaWdodCArIDEwLCByLnRvcCAtIDEwKSk7XG4gICAgICAgIG91dGVyLnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoci5sZWZ0IC0gMTAsIHIudG9wIC0gMTApKTtcbiAgICAgICAgY2xwci5BZGRQYXRoKG91dGVyLCBDbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdCwgdHJ1ZSk7XG4gICAgICAgIGNscHIuUmV2ZXJzZVNvbHV0aW9uID0gdHJ1ZTtcbiAgICAgICAgY2xwci5FeGVjdXRlKENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RVbmlvbiwgc29sdXRpb24sIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5lZ2F0aXZlLCBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROZWdhdGl2ZSk7XG4gICAgICAgIGlmIChzb2x1dGlvbi5sZW5ndGggPiAwKVxuICAgICAgICAgIHNvbHV0aW9uLnNwbGljZSgwLCAxKTtcbiAgICAgIH1cbiAgICAgIC8vY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoc29sdXRpb24pKTtcbiAgICB9XG4gICAgZWxzZSAvLyBmdW5jdGlvbiAocG9seXRyZWUsIGRlbHRhKVxuICAgIHtcbiAgICAgIHZhciBzb2x1dGlvbiA9IGFbMF0sXG4gICAgICAgIGRlbHRhID0gYVsxXTtcbiAgICAgIHNvbHV0aW9uLkNsZWFyKCk7XG4gICAgICB0aGlzLkZpeE9yaWVudGF0aW9ucygpO1xuICAgICAgdGhpcy5Eb09mZnNldChkZWx0YSk7XG4gICAgICAvL25vdyBjbGVhbiB1cCAnY29ybmVycycgLi4uXG4gICAgICB2YXIgY2xwciA9IG5ldyBDbGlwcGVyTGliLkNsaXBwZXIoMCk7XG4gICAgICBjbHByLkFkZFBhdGhzKHRoaXMubV9kZXN0UG9seXMsIENsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0LCB0cnVlKTtcbiAgICAgIGlmIChkZWx0YSA+IDApXG4gICAgICB7XG4gICAgICAgIGNscHIuRXhlY3V0ZShDbGlwcGVyTGliLkNsaXBUeXBlLmN0VW5pb24sIHNvbHV0aW9uLCBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRQb3NpdGl2ZSwgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0UG9zaXRpdmUpO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICB2YXIgciA9IENsaXBwZXJMaWIuQ2xpcHBlci5HZXRCb3VuZHModGhpcy5tX2Rlc3RQb2x5cyk7XG4gICAgICAgIHZhciBvdXRlciA9IG5ldyBDbGlwcGVyTGliLlBhdGgoKTtcbiAgICAgICAgb3V0ZXIucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChyLmxlZnQgLSAxMCwgci5ib3R0b20gKyAxMCkpO1xuICAgICAgICBvdXRlci5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KHIucmlnaHQgKyAxMCwgci5ib3R0b20gKyAxMCkpO1xuICAgICAgICBvdXRlci5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KHIucmlnaHQgKyAxMCwgci50b3AgLSAxMCkpO1xuICAgICAgICBvdXRlci5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KHIubGVmdCAtIDEwLCByLnRvcCAtIDEwKSk7XG4gICAgICAgIGNscHIuQWRkUGF0aChvdXRlciwgQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdFN1YmplY3QsIHRydWUpO1xuICAgICAgICBjbHByLlJldmVyc2VTb2x1dGlvbiA9IHRydWU7XG4gICAgICAgIGNscHIuRXhlY3V0ZShDbGlwcGVyTGliLkNsaXBUeXBlLmN0VW5pb24sIHNvbHV0aW9uLCBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROZWdhdGl2ZSwgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0TmVnYXRpdmUpO1xuICAgICAgICAvL3JlbW92ZSB0aGUgb3V0ZXIgUG9seU5vZGUgcmVjdGFuZ2xlIC4uLlxuICAgICAgICBpZiAoc29sdXRpb24uQ2hpbGRDb3VudCgpID09IDEgJiYgc29sdXRpb24uQ2hpbGRzKClbMF0uQ2hpbGRDb3VudCgpID4gMClcbiAgICAgICAge1xuICAgICAgICAgIHZhciBvdXRlck5vZGUgPSBzb2x1dGlvbi5DaGlsZHMoKVswXTtcbiAgICAgICAgICAvL3NvbHV0aW9uLkNoaWxkcy5zZXRfQ2FwYWNpdHkob3V0ZXJOb2RlLkNoaWxkQ291bnQpO1xuICAgICAgICAgIHNvbHV0aW9uLkNoaWxkcygpWzBdID0gb3V0ZXJOb2RlLkNoaWxkcygpWzBdO1xuICAgICAgICAgIHNvbHV0aW9uLkNoaWxkcygpWzBdLm1fUGFyZW50ID0gc29sdXRpb247XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBvdXRlck5vZGUuQ2hpbGRDb3VudCgpOyBpKyspXG4gICAgICAgICAgICBzb2x1dGlvbi5BZGRDaGlsZChvdXRlck5vZGUuQ2hpbGRzKClbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBzb2x1dGlvbi5DbGVhcigpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LnByb3RvdHlwZS5PZmZzZXRQb2ludCA9IGZ1bmN0aW9uIChqLCBrLCBqb2ludHlwZSlcbiAge1xuXHRcdC8vY3Jvc3MgcHJvZHVjdCAuLi5cblx0XHR0aGlzLm1fc2luQSA9ICh0aGlzLm1fbm9ybWFsc1trXS5YICogdGhpcy5tX25vcm1hbHNbal0uWSAtIHRoaXMubV9ub3JtYWxzW2pdLlggKiB0aGlzLm1fbm9ybWFsc1trXS5ZKTtcblxuXHRcdGlmIChNYXRoLmFicyh0aGlzLm1fc2luQSAqIHRoaXMubV9kZWx0YSkgPCAxLjApXG5cdFx0e1xuXHRcdFx0Ly9kb3QgcHJvZHVjdCAuLi5cblx0XHRcdHZhciBjb3NBID0gKHRoaXMubV9ub3JtYWxzW2tdLlggKiB0aGlzLm1fbm9ybWFsc1tqXS5YICsgdGhpcy5tX25vcm1hbHNbal0uWSAqIHRoaXMubV9ub3JtYWxzW2tdLlkpO1xuXHRcdFx0aWYgKGNvc0EgPiAwKSAvLyBhbmdsZSA9PT4gMCBkZWdyZWVzXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMubV9kZXN0UG9seS5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5YICsgdGhpcy5tX25vcm1hbHNba10uWCAqIHRoaXMubV9kZWx0YSksXG5cdFx0XHRcdFx0Q2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlkgKyB0aGlzLm1fbm9ybWFsc1trXS5ZICogdGhpcy5tX2RlbHRhKSkpO1xuXHRcdFx0XHRyZXR1cm4gaztcblx0XHRcdH1cblx0XHRcdC8vZWxzZSBhbmdsZSA9PT4gMTgwIGRlZ3JlZXNcblx0XHR9XG4gICAgZWxzZSBpZiAodGhpcy5tX3NpbkEgPiAxKVxuICAgICAgdGhpcy5tX3NpbkEgPSAxLjA7XG4gICAgZWxzZSBpZiAodGhpcy5tX3NpbkEgPCAtMSlcbiAgICAgIHRoaXMubV9zaW5BID0gLTEuMDtcbiAgICBpZiAodGhpcy5tX3NpbkEgKiB0aGlzLm1fZGVsdGEgPCAwKVxuICAgIHtcbiAgICAgIHRoaXMubV9kZXN0UG9seS5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5YICsgdGhpcy5tX25vcm1hbHNba10uWCAqIHRoaXMubV9kZWx0YSksXG4gICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5ZICsgdGhpcy5tX25vcm1hbHNba10uWSAqIHRoaXMubV9kZWx0YSkpKTtcbiAgICAgIHRoaXMubV9kZXN0UG9seS5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KHRoaXMubV9zcmNQb2x5W2pdKSk7XG4gICAgICB0aGlzLm1fZGVzdFBvbHkucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWCArIHRoaXMubV9ub3JtYWxzW2pdLlggKiB0aGlzLm1fZGVsdGEpLFxuICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWSArIHRoaXMubV9ub3JtYWxzW2pdLlkgKiB0aGlzLm1fZGVsdGEpKSk7XG4gICAgfVxuICAgIGVsc2VcbiAgICAgIHN3aXRjaCAoam9pbnR5cGUpXG4gICAgICB7XG4gICAgICBjYXNlIENsaXBwZXJMaWIuSm9pblR5cGUuanRNaXRlcjpcbiAgICAgICAge1xuICAgICAgICAgIHZhciByID0gMSArICh0aGlzLm1fbm9ybWFsc1tqXS5YICogdGhpcy5tX25vcm1hbHNba10uWCArIHRoaXMubV9ub3JtYWxzW2pdLlkgKiB0aGlzLm1fbm9ybWFsc1trXS5ZKTtcbiAgICAgICAgICBpZiAociA+PSB0aGlzLm1fbWl0ZXJMaW0pXG4gICAgICAgICAgICB0aGlzLkRvTWl0ZXIoaiwgaywgcik7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpcy5Eb1NxdWFyZShqLCBrKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgY2FzZSBDbGlwcGVyTGliLkpvaW5UeXBlLmp0U3F1YXJlOlxuICAgICAgICB0aGlzLkRvU3F1YXJlKGosIGspO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ2xpcHBlckxpYi5Kb2luVHlwZS5qdFJvdW5kOlxuICAgICAgICB0aGlzLkRvUm91bmQoaiwgayk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIGsgPSBqO1xuICAgIHJldHVybiBrO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQucHJvdG90eXBlLkRvU3F1YXJlID0gZnVuY3Rpb24gKGosIGspXG4gIHtcbiAgICB2YXIgZHggPSBNYXRoLnRhbihNYXRoLmF0YW4yKHRoaXMubV9zaW5BLFxuICAgICAgdGhpcy5tX25vcm1hbHNba10uWCAqIHRoaXMubV9ub3JtYWxzW2pdLlggKyB0aGlzLm1fbm9ybWFsc1trXS5ZICogdGhpcy5tX25vcm1hbHNbal0uWSkgLyA0KTtcbiAgICB0aGlzLm1fZGVzdFBvbHkucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChcbiAgICAgIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5YICsgdGhpcy5tX2RlbHRhICogKHRoaXMubV9ub3JtYWxzW2tdLlggLSB0aGlzLm1fbm9ybWFsc1trXS5ZICogZHgpKSxcbiAgICAgIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5ZICsgdGhpcy5tX2RlbHRhICogKHRoaXMubV9ub3JtYWxzW2tdLlkgKyB0aGlzLm1fbm9ybWFsc1trXS5YICogZHgpKSkpO1xuICAgIHRoaXMubV9kZXN0UG9seS5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KFxuICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlggKyB0aGlzLm1fZGVsdGEgKiAodGhpcy5tX25vcm1hbHNbal0uWCArIHRoaXMubV9ub3JtYWxzW2pdLlkgKiBkeCkpLFxuICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlkgKyB0aGlzLm1fZGVsdGEgKiAodGhpcy5tX25vcm1hbHNbal0uWSAtIHRoaXMubV9ub3JtYWxzW2pdLlggKiBkeCkpKSk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5wcm90b3R5cGUuRG9NaXRlciA9IGZ1bmN0aW9uIChqLCBrLCByKVxuICB7XG4gICAgdmFyIHEgPSB0aGlzLm1fZGVsdGEgLyByO1xuICAgIHRoaXMubV9kZXN0UG9seS5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KFxuICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlggKyAodGhpcy5tX25vcm1hbHNba10uWCArIHRoaXMubV9ub3JtYWxzW2pdLlgpICogcSksXG4gICAgICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWSArICh0aGlzLm1fbm9ybWFsc1trXS5ZICsgdGhpcy5tX25vcm1hbHNbal0uWSkgKiBxKSkpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQucHJvdG90eXBlLkRvUm91bmQgPSBmdW5jdGlvbiAoaiwgaylcbiAge1xuICAgIHZhciBhID0gTWF0aC5hdGFuMih0aGlzLm1fc2luQSxcbiAgICAgIHRoaXMubV9ub3JtYWxzW2tdLlggKiB0aGlzLm1fbm9ybWFsc1tqXS5YICsgdGhpcy5tX25vcm1hbHNba10uWSAqIHRoaXMubV9ub3JtYWxzW2pdLlkpO1xuXG4gICAgXHR2YXIgc3RlcHMgPSBNYXRoLm1heChDbGlwcGVyTGliLkNhc3RfSW50MzIoQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9TdGVwc1BlclJhZCAqIE1hdGguYWJzKGEpKSksIDEpO1xuXG4gICAgdmFyIFggPSB0aGlzLm1fbm9ybWFsc1trXS5YLFxuICAgICAgWSA9IHRoaXMubV9ub3JtYWxzW2tdLlksXG4gICAgICBYMjtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ZXBzOyArK2kpXG4gICAge1xuICAgICAgdGhpcy5tX2Rlc3RQb2x5LnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoXG4gICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5YICsgWCAqIHRoaXMubV9kZWx0YSksXG4gICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5ZICsgWSAqIHRoaXMubV9kZWx0YSkpKTtcbiAgICAgIFgyID0gWDtcbiAgICAgIFggPSBYICogdGhpcy5tX2NvcyAtIHRoaXMubV9zaW4gKiBZO1xuICAgICAgWSA9IFgyICogdGhpcy5tX3NpbiArIFkgKiB0aGlzLm1fY29zO1xuICAgIH1cbiAgICB0aGlzLm1fZGVzdFBvbHkucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChcbiAgICAgIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5YICsgdGhpcy5tX25vcm1hbHNbal0uWCAqIHRoaXMubV9kZWx0YSksXG4gICAgICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWSArIHRoaXMubV9ub3JtYWxzW2pdLlkgKiB0aGlzLm1fZGVsdGEpKSk7XG4gIH07XG4gIENsaXBwZXJMaWIuRXJyb3IgPSBmdW5jdGlvbiAobWVzc2FnZSlcbiAge1xuICAgIHRyeVxuICAgIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycilcbiAgICB7XG4gICAgICBhbGVydChlcnIubWVzc2FnZSk7XG4gICAgfVxuICB9O1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gSlMgZXh0ZW5zaW9uIGJ5IFRpbW8gMjAxM1xuICBDbGlwcGVyTGliLkpTID0ge307XG4gIENsaXBwZXJMaWIuSlMuQXJlYU9mUG9seWdvbiA9IGZ1bmN0aW9uIChwb2x5LCBzY2FsZSlcbiAge1xuICAgIGlmICghc2NhbGUpIHNjYWxlID0gMTtcbiAgICByZXR1cm4gQ2xpcHBlckxpYi5DbGlwcGVyLkFyZWEocG9seSkgLyAoc2NhbGUgKiBzY2FsZSk7XG4gIH07XG4gIENsaXBwZXJMaWIuSlMuQXJlYU9mUG9seWdvbnMgPSBmdW5jdGlvbiAocG9seSwgc2NhbGUpXG4gIHtcbiAgICBpZiAoIXNjYWxlKSBzY2FsZSA9IDE7XG4gICAgdmFyIGFyZWEgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcG9seS5sZW5ndGg7IGkrKylcbiAgICB7XG4gICAgICBhcmVhICs9IENsaXBwZXJMaWIuQ2xpcHBlci5BcmVhKHBvbHlbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gYXJlYSAvIChzY2FsZSAqIHNjYWxlKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5KUy5Cb3VuZHNPZlBhdGggPSBmdW5jdGlvbiAocGF0aCwgc2NhbGUpXG4gIHtcbiAgICByZXR1cm4gQ2xpcHBlckxpYi5KUy5Cb3VuZHNPZlBhdGhzKFtwYXRoXSwgc2NhbGUpO1xuICB9O1xuICBDbGlwcGVyTGliLkpTLkJvdW5kc09mUGF0aHMgPSBmdW5jdGlvbiAocGF0aHMsIHNjYWxlKVxuICB7XG4gICAgaWYgKCFzY2FsZSkgc2NhbGUgPSAxO1xuICAgIHZhciBib3VuZHMgPSBDbGlwcGVyTGliLkNsaXBwZXIuR2V0Qm91bmRzKHBhdGhzKTtcbiAgICBib3VuZHMubGVmdCAvPSBzY2FsZTtcbiAgICBib3VuZHMuYm90dG9tIC89IHNjYWxlO1xuICAgIGJvdW5kcy5yaWdodCAvPSBzY2FsZTtcbiAgICBib3VuZHMudG9wIC89IHNjYWxlO1xuICAgIHJldHVybiBib3VuZHM7XG4gIH07XG4gIC8vIENsZWFuKCkgam9pbnMgdmVydGljZXMgdGhhdCBhcmUgdG9vIG5lYXIgZWFjaCBvdGhlclxuICAvLyBhbmQgY2F1c2VzIGRpc3RvcnRpb24gdG8gb2Zmc2V0dGVkIHBvbHlnb25zIHdpdGhvdXQgY2xlYW5pbmdcbiAgQ2xpcHBlckxpYi5KUy5DbGVhbiA9IGZ1bmN0aW9uIChwb2x5Z29uLCBkZWx0YSlcbiAge1xuICAgIGlmICghKHBvbHlnb24gaW5zdGFuY2VvZiBBcnJheSkpIHJldHVybiBbXTtcbiAgICB2YXIgaXNQb2x5Z29ucyA9IHBvbHlnb25bMF0gaW5zdGFuY2VvZiBBcnJheTtcbiAgICB2YXIgcG9seWdvbiA9IENsaXBwZXJMaWIuSlMuQ2xvbmUocG9seWdvbik7XG4gICAgaWYgKHR5cGVvZiBkZWx0YSAhPSBcIm51bWJlclwiIHx8IGRlbHRhID09PSBudWxsKVxuICAgIHtcbiAgICAgIENsaXBwZXJMaWIuRXJyb3IoXCJEZWx0YSBpcyBub3QgYSBudW1iZXIgaW4gQ2xlYW4oKS5cIik7XG4gICAgICByZXR1cm4gcG9seWdvbjtcbiAgICB9XG4gICAgaWYgKHBvbHlnb24ubGVuZ3RoID09PSAwIHx8IChwb2x5Z29uLmxlbmd0aCA9PSAxICYmIHBvbHlnb25bMF0ubGVuZ3RoID09PSAwKSB8fCBkZWx0YSA8IDApIHJldHVybiBwb2x5Z29uO1xuICAgIGlmICghaXNQb2x5Z29ucykgcG9seWdvbiA9IFtwb2x5Z29uXTtcbiAgICB2YXIga19sZW5ndGggPSBwb2x5Z29uLmxlbmd0aDtcbiAgICB2YXIgbGVuLCBwb2x5LCByZXN1bHQsIGQsIHAsIGosIGk7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBmb3IgKHZhciBrID0gMDsgayA8IGtfbGVuZ3RoOyBrKyspXG4gICAge1xuICAgICAgcG9seSA9IHBvbHlnb25ba107XG4gICAgICBsZW4gPSBwb2x5Lmxlbmd0aDtcbiAgICAgIGlmIChsZW4gPT09IDApIGNvbnRpbnVlO1xuICAgICAgZWxzZSBpZiAobGVuIDwgMylcbiAgICAgIHtcbiAgICAgICAgcmVzdWx0ID0gcG9seTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgcmVzdWx0ID0gcG9seTtcbiAgICAgIGQgPSBkZWx0YSAqIGRlbHRhO1xuICAgICAgLy9kID0gTWF0aC5mbG9vcihjX2RlbHRhICogY19kZWx0YSk7XG4gICAgICBwID0gcG9seVswXTtcbiAgICAgIGogPSAxO1xuICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAge1xuICAgICAgICBpZiAoKHBvbHlbaV0uWCAtIHAuWCkgKiAocG9seVtpXS5YIC0gcC5YKSArXG4gICAgICAgICAgKHBvbHlbaV0uWSAtIHAuWSkgKiAocG9seVtpXS5ZIC0gcC5ZKSA8PSBkKVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICByZXN1bHRbal0gPSBwb2x5W2ldO1xuICAgICAgICBwID0gcG9seVtpXTtcbiAgICAgICAgaisrO1xuICAgICAgfVxuICAgICAgcCA9IHBvbHlbaiAtIDFdO1xuICAgICAgaWYgKChwb2x5WzBdLlggLSBwLlgpICogKHBvbHlbMF0uWCAtIHAuWCkgK1xuICAgICAgICAocG9seVswXS5ZIC0gcC5ZKSAqIChwb2x5WzBdLlkgLSBwLlkpIDw9IGQpXG4gICAgICAgIGotLTtcbiAgICAgIGlmIChqIDwgbGVuKVxuICAgICAgICByZXN1bHQuc3BsaWNlKGosIGxlbiAtIGopO1xuICAgICAgaWYgKHJlc3VsdC5sZW5ndGgpIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgIH1cbiAgICBpZiAoIWlzUG9seWdvbnMgJiYgcmVzdWx0cy5sZW5ndGgpIHJlc3VsdHMgPSByZXN1bHRzWzBdO1xuICAgIGVsc2UgaWYgKCFpc1BvbHlnb25zICYmIHJlc3VsdHMubGVuZ3RoID09PSAwKSByZXN1bHRzID0gW107XG4gICAgZWxzZSBpZiAoaXNQb2x5Z29ucyAmJiByZXN1bHRzLmxlbmd0aCA9PT0gMCkgcmVzdWx0cyA9IFtcbiAgICAgIFtdXG4gICAgXTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuICAvLyBNYWtlIGRlZXAgY29weSBvZiBQb2x5Z29ucyBvciBQb2x5Z29uXG4gIC8vIHNvIHRoYXQgYWxzbyBJbnRQb2ludCBvYmplY3RzIGFyZSBjbG9uZWQgYW5kIG5vdCBvbmx5IHJlZmVyZW5jZWRcbiAgLy8gVGhpcyBzaG91bGQgYmUgdGhlIGZhc3Rlc3Qgd2F5XG4gIENsaXBwZXJMaWIuSlMuQ2xvbmUgPSBmdW5jdGlvbiAocG9seWdvbilcbiAge1xuICAgIGlmICghKHBvbHlnb24gaW5zdGFuY2VvZiBBcnJheSkpIHJldHVybiBbXTtcbiAgICBpZiAocG9seWdvbi5sZW5ndGggPT09IDApIHJldHVybiBbXTtcbiAgICBlbHNlIGlmIChwb2x5Z29uLmxlbmd0aCA9PSAxICYmIHBvbHlnb25bMF0ubGVuZ3RoID09PSAwKSByZXR1cm4gW1tdXTtcbiAgICB2YXIgaXNQb2x5Z29ucyA9IHBvbHlnb25bMF0gaW5zdGFuY2VvZiBBcnJheTtcbiAgICBpZiAoIWlzUG9seWdvbnMpIHBvbHlnb24gPSBbcG9seWdvbl07XG4gICAgdmFyIGxlbiA9IHBvbHlnb24ubGVuZ3RoLFxuICAgICAgcGxlbiwgaSwgaiwgcmVzdWx0O1xuICAgIHZhciByZXN1bHRzID0gbmV3IEFycmF5KGxlbik7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgIHtcbiAgICAgIHBsZW4gPSBwb2x5Z29uW2ldLmxlbmd0aDtcbiAgICAgIHJlc3VsdCA9IG5ldyBBcnJheShwbGVuKTtcbiAgICAgIGZvciAoaiA9IDA7IGogPCBwbGVuOyBqKyspXG4gICAgICB7XG4gICAgICAgIHJlc3VsdFtqXSA9IHtcbiAgICAgICAgICBYOiBwb2x5Z29uW2ldW2pdLlgsXG4gICAgICAgICAgWTogcG9seWdvbltpXVtqXS5ZXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXN1bHRzW2ldID0gcmVzdWx0O1xuICAgIH1cbiAgICBpZiAoIWlzUG9seWdvbnMpIHJlc3VsdHMgPSByZXN1bHRzWzBdO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuICAvLyBSZW1vdmVzIHBvaW50cyB0aGF0IGRvZXNuJ3QgYWZmZWN0IG11Y2ggdG8gdGhlIHZpc3VhbCBhcHBlYXJhbmNlLlxuICAvLyBJZiBtaWRkbGUgcG9pbnQgaXMgYXQgb3IgdW5kZXIgY2VydGFpbiBkaXN0YW5jZSAodG9sZXJhbmNlKSBvZiB0aGUgbGluZSBzZWdtZW50IGJldHdlZW5cbiAgLy8gc3RhcnQgYW5kIGVuZCBwb2ludCwgdGhlIG1pZGRsZSBwb2ludCBpcyByZW1vdmVkLlxuICBDbGlwcGVyTGliLkpTLkxpZ2h0ZW4gPSBmdW5jdGlvbiAocG9seWdvbiwgdG9sZXJhbmNlKVxuICB7XG4gICAgaWYgKCEocG9seWdvbiBpbnN0YW5jZW9mIEFycmF5KSkgcmV0dXJuIFtdO1xuICAgIGlmICh0eXBlb2YgdG9sZXJhbmNlICE9IFwibnVtYmVyXCIgfHwgdG9sZXJhbmNlID09PSBudWxsKVxuICAgIHtcbiAgICAgIENsaXBwZXJMaWIuRXJyb3IoXCJUb2xlcmFuY2UgaXMgbm90IGEgbnVtYmVyIGluIExpZ2h0ZW4oKS5cIilcbiAgICAgIHJldHVybiBDbGlwcGVyTGliLkpTLkNsb25lKHBvbHlnb24pO1xuICAgIH1cbiAgICBpZiAocG9seWdvbi5sZW5ndGggPT09IDAgfHwgKHBvbHlnb24ubGVuZ3RoID09IDEgJiYgcG9seWdvblswXS5sZW5ndGggPT09IDApIHx8IHRvbGVyYW5jZSA8IDApXG4gICAge1xuICAgICAgcmV0dXJuIENsaXBwZXJMaWIuSlMuQ2xvbmUocG9seWdvbik7XG4gICAgfVxuICAgIGlmICghKHBvbHlnb25bMF0gaW5zdGFuY2VvZiBBcnJheSkpIHBvbHlnb24gPSBbcG9seWdvbl07XG4gICAgdmFyIGksIGosIHBvbHksIGssIHBvbHkyLCBwbGVuLCBBLCBCLCBQLCBkLCByZW0sIGFkZGxhc3Q7XG4gICAgdmFyIGJ4YXgsIGJ5YXksIGwsIGF4LCBheTtcbiAgICB2YXIgbGVuID0gcG9seWdvbi5sZW5ndGg7XG4gICAgdmFyIHRvbGVyYW5jZVNxID0gdG9sZXJhbmNlICogdG9sZXJhbmNlO1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgIHtcbiAgICAgIHBvbHkgPSBwb2x5Z29uW2ldO1xuICAgICAgcGxlbiA9IHBvbHkubGVuZ3RoO1xuICAgICAgaWYgKHBsZW4gPT0gMCkgY29udGludWU7XG4gICAgICBmb3IgKGsgPSAwOyBrIDwgMTAwMDAwMDsgaysrKSAvLyBjb3VsZCBiZSBmb3JldmVyIGxvb3AsIGJ1dCB3aXNlciB0byByZXN0cmljdCBtYXggcmVwZWF0IGNvdW50XG4gICAgICB7XG4gICAgICAgIHBvbHkyID0gW107XG4gICAgICAgIHBsZW4gPSBwb2x5Lmxlbmd0aDtcbiAgICAgICAgLy8gdGhlIGZpcnN0IGhhdmUgdG8gYWRkZWQgdG8gdGhlIGVuZCwgaWYgZmlyc3QgYW5kIGxhc3QgYXJlIG5vdCB0aGUgc2FtZVxuICAgICAgICAvLyB0aGlzIHdheSB3ZSBlbnN1cmUgdGhhdCBhbHNvIHRoZSBhY3R1YWwgbGFzdCBwb2ludCBjYW4gYmUgcmVtb3ZlZCBpZiBuZWVkZWRcbiAgICAgICAgaWYgKHBvbHlbcGxlbiAtIDFdLlggIT0gcG9seVswXS5YIHx8IHBvbHlbcGxlbiAtIDFdLlkgIT0gcG9seVswXS5ZKVxuICAgICAgICB7XG4gICAgICAgICAgYWRkbGFzdCA9IDE7XG4gICAgICAgICAgcG9seS5wdXNoKFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIFg6IHBvbHlbMF0uWCxcbiAgICAgICAgICAgIFk6IHBvbHlbMF0uWVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHBsZW4gPSBwb2x5Lmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGFkZGxhc3QgPSAwO1xuICAgICAgICByZW0gPSBbXTsgLy8gSW5kZXhlcyBvZiByZW1vdmVkIHBvaW50c1xuICAgICAgICBmb3IgKGogPSAwOyBqIDwgcGxlbiAtIDI7IGorKylcbiAgICAgICAge1xuICAgICAgICAgIEEgPSBwb2x5W2pdOyAvLyBTdGFydCBwb2ludCBvZiBsaW5lIHNlZ21lbnRcbiAgICAgICAgICBQID0gcG9seVtqICsgMV07IC8vIE1pZGRsZSBwb2ludC4gVGhpcyBpcyB0aGUgb25lIHRvIGJlIHJlbW92ZWQuXG4gICAgICAgICAgQiA9IHBvbHlbaiArIDJdOyAvLyBFbmQgcG9pbnQgb2YgbGluZSBzZWdtZW50XG4gICAgICAgICAgYXggPSBBLlg7XG4gICAgICAgICAgYXkgPSBBLlk7XG4gICAgICAgICAgYnhheCA9IEIuWCAtIGF4O1xuICAgICAgICAgIGJ5YXkgPSBCLlkgLSBheTtcbiAgICAgICAgICBpZiAoYnhheCAhPT0gMCB8fCBieWF5ICE9PSAwKSAvLyBUbyBhdm9pZCBOYW4sIHdoZW4gQT09UCAmJiBQPT1CLiBBbmQgdG8gYXZvaWQgcGVha3MgKEE9PUIgJiYgQSE9UCksIHdoaWNoIGhhdmUgbGVuZ2h0LCBidXQgbm90IGFyZWEuXG4gICAgICAgICAge1xuICAgICAgICAgICAgbCA9ICgoUC5YIC0gYXgpICogYnhheCArIChQLlkgLSBheSkgKiBieWF5KSAvIChieGF4ICogYnhheCArIGJ5YXkgKiBieWF5KTtcbiAgICAgICAgICAgIGlmIChsID4gMSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgYXggPSBCLlg7XG4gICAgICAgICAgICAgIGF5ID0gQi5ZO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobCA+IDApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGF4ICs9IGJ4YXggKiBsO1xuICAgICAgICAgICAgICBheSArPSBieWF5ICogbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnhheCA9IFAuWCAtIGF4O1xuICAgICAgICAgIGJ5YXkgPSBQLlkgLSBheTtcbiAgICAgICAgICBkID0gYnhheCAqIGJ4YXggKyBieWF5ICogYnlheTtcbiAgICAgICAgICBpZiAoZCA8PSB0b2xlcmFuY2VTcSlcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZW1baiArIDFdID0gMTtcbiAgICAgICAgICAgIGorKzsgLy8gd2hlbiByZW1vdmVkLCB0cmFuc2ZlciB0aGUgcG9pbnRlciB0byB0aGUgbmV4dCBvbmVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gYWRkIGFsbCB1bnJlbW92ZWQgcG9pbnRzIHRvIHBvbHkyXG4gICAgICAgIHBvbHkyLnB1c2goXG4gICAgICAgIHtcbiAgICAgICAgICBYOiBwb2x5WzBdLlgsXG4gICAgICAgICAgWTogcG9seVswXS5ZXG4gICAgICAgIH0pO1xuICAgICAgICBmb3IgKGogPSAxOyBqIDwgcGxlbiAtIDE7IGorKylcbiAgICAgICAgICBpZiAoIXJlbVtqXSkgcG9seTIucHVzaChcbiAgICAgICAgICB7XG4gICAgICAgICAgICBYOiBwb2x5W2pdLlgsXG4gICAgICAgICAgICBZOiBwb2x5W2pdLllcbiAgICAgICAgICB9KTtcbiAgICAgICAgcG9seTIucHVzaChcbiAgICAgICAge1xuICAgICAgICAgIFg6IHBvbHlbcGxlbiAtIDFdLlgsXG4gICAgICAgICAgWTogcG9seVtwbGVuIC0gMV0uWVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gaWYgdGhlIGZpcnN0IHBvaW50IHdhcyBhZGRlZCB0byB0aGUgZW5kLCByZW1vdmUgaXRcbiAgICAgICAgaWYgKGFkZGxhc3QpIHBvbHkucG9wKCk7XG4gICAgICAgIC8vIGJyZWFrLCBpZiB0aGVyZSB3YXMgbm90IGFueW1vcmUgcmVtb3ZlZCBwb2ludHNcbiAgICAgICAgaWYgKCFyZW0ubGVuZ3RoKSBicmVhaztcbiAgICAgICAgLy8gZWxzZSBjb250aW51ZSBsb29waW5nIHVzaW5nIHBvbHkyLCB0byBjaGVjayBpZiB0aGVyZSBhcmUgcG9pbnRzIHRvIHJlbW92ZVxuICAgICAgICBlbHNlIHBvbHkgPSBwb2x5MjtcbiAgICAgIH1cbiAgICAgIHBsZW4gPSBwb2x5Mi5sZW5ndGg7XG4gICAgICAvLyByZW1vdmUgZHVwbGljYXRlIGZyb20gZW5kLCBpZiBuZWVkZWRcbiAgICAgIGlmIChwb2x5MltwbGVuIC0gMV0uWCA9PSBwb2x5MlswXS5YICYmIHBvbHkyW3BsZW4gLSAxXS5ZID09IHBvbHkyWzBdLlkpXG4gICAgICB7XG4gICAgICAgIHBvbHkyLnBvcCgpO1xuICAgICAgfVxuICAgICAgaWYgKHBvbHkyLmxlbmd0aCA+IDIpIC8vIHRvIGF2b2lkIHR3by1wb2ludC1wb2x5Z29uc1xuICAgICAgICByZXN1bHRzLnB1c2gocG9seTIpO1xuICAgIH1cbiAgICBpZiAoIShwb2x5Z29uWzBdIGluc3RhbmNlb2YgQXJyYXkpKSByZXN1bHRzID0gcmVzdWx0c1swXTtcbiAgICBpZiAodHlwZW9mIChyZXN1bHRzKSA9PSBcInVuZGVmaW5lZFwiKSByZXN1bHRzID0gW1xuICAgICAgW11cbiAgICBdO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG4gIENsaXBwZXJMaWIuSlMuUGVyaW1ldGVyT2ZQYXRoID0gZnVuY3Rpb24gKHBhdGgsIGNsb3NlZCwgc2NhbGUpXG4gIHtcbiAgICBpZiAodHlwZW9mIChwYXRoKSA9PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gMDtcbiAgICB2YXIgc3FydCA9IE1hdGguc3FydDtcbiAgICB2YXIgcGVyaW1ldGVyID0gMC4wO1xuICAgIHZhciBwMSwgcDIsIHAxeCA9IDAuMCxcbiAgICAgIHAxeSA9IDAuMCxcbiAgICAgIHAyeCA9IDAuMCxcbiAgICAgIHAyeSA9IDAuMDtcbiAgICB2YXIgaiA9IHBhdGgubGVuZ3RoO1xuICAgIGlmIChqIDwgMikgcmV0dXJuIDA7XG4gICAgaWYgKGNsb3NlZClcbiAgICB7XG4gICAgICBwYXRoW2pdID0gcGF0aFswXTtcbiAgICAgIGorKztcbiAgICB9XG4gICAgd2hpbGUgKC0tailcbiAgICB7XG4gICAgICBwMSA9IHBhdGhbal07XG4gICAgICBwMXggPSBwMS5YO1xuICAgICAgcDF5ID0gcDEuWTtcbiAgICAgIHAyID0gcGF0aFtqIC0gMV07XG4gICAgICBwMnggPSBwMi5YO1xuICAgICAgcDJ5ID0gcDIuWTtcbiAgICAgIHBlcmltZXRlciArPSBzcXJ0KChwMXggLSBwMngpICogKHAxeCAtIHAyeCkgKyAocDF5IC0gcDJ5KSAqIChwMXkgLSBwMnkpKTtcbiAgICB9XG4gICAgaWYgKGNsb3NlZCkgcGF0aC5wb3AoKTtcbiAgICByZXR1cm4gcGVyaW1ldGVyIC8gc2NhbGU7XG4gIH07XG4gIENsaXBwZXJMaWIuSlMuUGVyaW1ldGVyT2ZQYXRocyA9IGZ1bmN0aW9uIChwYXRocywgY2xvc2VkLCBzY2FsZSlcbiAge1xuICAgIGlmICghc2NhbGUpIHNjYWxlID0gMTtcbiAgICB2YXIgcGVyaW1ldGVyID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGhzLmxlbmd0aDsgaSsrKVxuICAgIHtcbiAgICAgIHBlcmltZXRlciArPSBDbGlwcGVyTGliLkpTLlBlcmltZXRlck9mUGF0aChwYXRoc1tpXSwgY2xvc2VkLCBzY2FsZSk7XG4gICAgfVxuICAgIHJldHVybiBwZXJpbWV0ZXI7XG4gIH07XG4gIENsaXBwZXJMaWIuSlMuU2NhbGVEb3duUGF0aCA9IGZ1bmN0aW9uIChwYXRoLCBzY2FsZSlcbiAge1xuICAgIHZhciBpLCBwO1xuICAgIGlmICghc2NhbGUpIHNjYWxlID0gMTtcbiAgICBpID0gcGF0aC5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSlcbiAgICB7XG4gICAgICBwID0gcGF0aFtpXTtcbiAgICAgIHAuWCA9IHAuWCAvIHNjYWxlO1xuICAgICAgcC5ZID0gcC5ZIC8gc2NhbGU7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkpTLlNjYWxlRG93blBhdGhzID0gZnVuY3Rpb24gKHBhdGhzLCBzY2FsZSlcbiAge1xuICAgIHZhciBpLCBqLCBwO1xuICAgIGlmICghc2NhbGUpIHNjYWxlID0gMTtcbiAgICBpID0gcGF0aHMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pXG4gICAge1xuICAgICAgaiA9IHBhdGhzW2ldLmxlbmd0aDtcbiAgICAgIHdoaWxlIChqLS0pXG4gICAgICB7XG4gICAgICAgIHAgPSBwYXRoc1tpXVtqXTtcbiAgICAgICAgcC5YID0gcC5YIC8gc2NhbGU7XG4gICAgICAgIHAuWSA9IHAuWSAvIHNjYWxlO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5KUy5TY2FsZVVwUGF0aCA9IGZ1bmN0aW9uIChwYXRoLCBzY2FsZSlcbiAge1xuICAgIHZhciBpLCBwLCByb3VuZCA9IE1hdGgucm91bmQ7XG4gICAgaWYgKCFzY2FsZSkgc2NhbGUgPSAxO1xuICAgIGkgPSBwYXRoLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKVxuICAgIHtcbiAgICAgIHAgPSBwYXRoW2ldO1xuICAgICAgcC5YID0gcm91bmQocC5YICogc2NhbGUpO1xuICAgICAgcC5ZID0gcm91bmQocC5ZICogc2NhbGUpO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5KUy5TY2FsZVVwUGF0aHMgPSBmdW5jdGlvbiAocGF0aHMsIHNjYWxlKVxuICB7XG4gICAgdmFyIGksIGosIHAsIHJvdW5kID0gTWF0aC5yb3VuZDtcbiAgICBpZiAoIXNjYWxlKSBzY2FsZSA9IDE7XG4gICAgaSA9IHBhdGhzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKVxuICAgIHtcbiAgICAgIGogPSBwYXRoc1tpXS5sZW5ndGg7XG4gICAgICB3aGlsZSAoai0tKVxuICAgICAge1xuICAgICAgICBwID0gcGF0aHNbaV1bal07XG4gICAgICAgIHAuWCA9IHJvdW5kKHAuWCAqIHNjYWxlKTtcbiAgICAgICAgcC5ZID0gcm91bmQocC5ZICogc2NhbGUpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5FeFBvbHlnb25zID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBDbGlwcGVyTGliLkV4UG9seWdvbiA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB0aGlzLm91dGVyID0gbnVsbDtcbiAgICB0aGlzLmhvbGVzID0gbnVsbDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5KUy5BZGRPdXRlclBvbHlOb2RlVG9FeFBvbHlnb25zID0gZnVuY3Rpb24gKHBvbHlub2RlLCBleHBvbHlnb25zKVxuICB7XG4gICAgdmFyIGVwID0gbmV3IENsaXBwZXJMaWIuRXhQb2x5Z29uKCk7XG4gICAgZXAub3V0ZXIgPSBwb2x5bm9kZS5Db250b3VyKCk7XG4gICAgdmFyIGNoaWxkcyA9IHBvbHlub2RlLkNoaWxkcygpO1xuICAgIHZhciBpbGVuID0gY2hpbGRzLmxlbmd0aDtcbiAgICBlcC5ob2xlcyA9IG5ldyBBcnJheShpbGVuKTtcbiAgICB2YXIgbm9kZSwgbiwgaSwgaiwgY2hpbGRzMiwgamxlbjtcbiAgICBmb3IgKGkgPSAwOyBpIDwgaWxlbjsgaSsrKVxuICAgIHtcbiAgICAgIG5vZGUgPSBjaGlsZHNbaV07XG4gICAgICBlcC5ob2xlc1tpXSA9IG5vZGUuQ29udG91cigpO1xuICAgICAgLy9BZGQgb3V0ZXIgcG9seWdvbnMgY29udGFpbmVkIGJ5IChuZXN0ZWQgd2l0aGluKSBob2xlcyAuLi5cbiAgICAgIGZvciAoaiA9IDAsIGNoaWxkczIgPSBub2RlLkNoaWxkcygpLCBqbGVuID0gY2hpbGRzMi5sZW5ndGg7IGogPCBqbGVuOyBqKyspXG4gICAgICB7XG4gICAgICAgIG4gPSBjaGlsZHMyW2pdO1xuICAgICAgICBDbGlwcGVyTGliLkpTLkFkZE91dGVyUG9seU5vZGVUb0V4UG9seWdvbnMobiwgZXhwb2x5Z29ucyk7XG4gICAgICB9XG4gICAgfVxuICAgIGV4cG9seWdvbnMucHVzaChlcCk7XG4gIH07XG4gIENsaXBwZXJMaWIuSlMuRXhQb2x5Z29uc1RvUGF0aHMgPSBmdW5jdGlvbiAoZXhwb2x5Z29ucylcbiAge1xuICAgIHZhciBhLCBpLCBhbGVuLCBpbGVuO1xuICAgIHZhciBwYXRocyA9IG5ldyBDbGlwcGVyTGliLlBhdGhzKCk7XG4gICAgZm9yIChhID0gMCwgYWxlbiA9IGV4cG9seWdvbnMubGVuZ3RoOyBhIDwgYWxlbjsgYSsrKVxuICAgIHtcbiAgICAgIHBhdGhzLnB1c2goZXhwb2x5Z29uc1thXS5vdXRlcik7XG4gICAgICBmb3IgKGkgPSAwLCBpbGVuID0gZXhwb2x5Z29uc1thXS5ob2xlcy5sZW5ndGg7IGkgPCBpbGVuOyBpKyspXG4gICAgICB7XG4gICAgICAgIHBhdGhzLnB1c2goZXhwb2x5Z29uc1thXS5ob2xlc1tpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwYXRocztcbiAgfVxuICBDbGlwcGVyTGliLkpTLlBvbHlUcmVlVG9FeFBvbHlnb25zID0gZnVuY3Rpb24gKHBvbHl0cmVlKVxuICB7XG4gICAgdmFyIGV4cG9seWdvbnMgPSBuZXcgQ2xpcHBlckxpYi5FeFBvbHlnb25zKCk7XG4gICAgdmFyIG5vZGUsIGksIGNoaWxkcywgaWxlbjtcbiAgICBmb3IgKGkgPSAwLCBjaGlsZHMgPSBwb2x5dHJlZS5DaGlsZHMoKSwgaWxlbiA9IGNoaWxkcy5sZW5ndGg7IGkgPCBpbGVuOyBpKyspXG4gICAge1xuICAgICAgbm9kZSA9IGNoaWxkc1tpXTtcbiAgICAgIENsaXBwZXJMaWIuSlMuQWRkT3V0ZXJQb2x5Tm9kZVRvRXhQb2x5Z29ucyhub2RlLCBleHBvbHlnb25zKTtcbiAgICB9XG4gICAgcmV0dXJuIGV4cG9seWdvbnM7XG4gIH07XG59KSgpO1xuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIHR3b1Byb2R1Y3QgPSByZXF1aXJlKFwidHdvLXByb2R1Y3RcIilcbnZhciByb2J1c3RTdW0gPSByZXF1aXJlKFwicm9idXN0LXN1bVwiKVxudmFyIHJvYnVzdERpZmYgPSByZXF1aXJlKFwicm9idXN0LXN1YnRyYWN0XCIpXG52YXIgcm9idXN0U2NhbGUgPSByZXF1aXJlKFwicm9idXN0LXNjYWxlXCIpXG5cbnZhciBOVU1fRVhQQU5EID0gNlxuXG5mdW5jdGlvbiBjb2ZhY3RvcihtLCBjKSB7XG4gIHZhciByZXN1bHQgPSBuZXcgQXJyYXkobS5sZW5ndGgtMSlcbiAgZm9yKHZhciBpPTE7IGk8bS5sZW5ndGg7ICsraSkge1xuICAgIHZhciByID0gcmVzdWx0W2ktMV0gPSBuZXcgQXJyYXkobS5sZW5ndGgtMSlcbiAgICBmb3IodmFyIGo9MCxrPTA7IGo8bS5sZW5ndGg7ICsraikge1xuICAgICAgaWYoaiA9PT0gYykge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgcltrKytdID0gbVtpXVtqXVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIG1hdHJpeChuKSB7XG4gIHZhciByZXN1bHQgPSBuZXcgQXJyYXkobilcbiAgZm9yKHZhciBpPTA7IGk8bjsgKytpKSB7XG4gICAgcmVzdWx0W2ldID0gbmV3IEFycmF5KG4pXG4gICAgZm9yKHZhciBqPTA7IGo8bjsgKytqKSB7XG4gICAgICByZXN1bHRbaV1bal0gPSBbXCJtXCIsIGosIFwiW1wiLCAobi1pLTIpLCBcIl1cIl0uam9pbihcIlwiKVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlU3VtKGV4cHIpIHtcbiAgaWYoZXhwci5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gZXhwclswXVxuICB9IGVsc2UgaWYoZXhwci5sZW5ndGggPT09IDIpIHtcbiAgICByZXR1cm4gW1wic3VtKFwiLCBleHByWzBdLCBcIixcIiwgZXhwclsxXSwgXCIpXCJdLmpvaW4oXCJcIilcbiAgfSBlbHNlIHtcbiAgICB2YXIgbSA9IGV4cHIubGVuZ3RoPj4xXG4gICAgcmV0dXJuIFtcInN1bShcIiwgZ2VuZXJhdGVTdW0oZXhwci5zbGljZSgwLCBtKSksIFwiLFwiLCBnZW5lcmF0ZVN1bShleHByLnNsaWNlKG0pKSwgXCIpXCJdLmpvaW4oXCJcIilcbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlUHJvZHVjdChhLCBiKSB7XG4gIGlmKGEuY2hhckF0KDApID09PSBcIm1cIikge1xuICAgIGlmKGIuY2hhckF0KDApID09PSBcIndcIikge1xuICAgICAgdmFyIHRva3MgPSBhLnNwbGl0KFwiW1wiKVxuICAgICAgcmV0dXJuIFtcIndcIiwgYi5zdWJzdHIoMSksIFwibVwiLCB0b2tzWzBdLnN1YnN0cigxKV0uam9pbihcIlwiKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gW1wicHJvZChcIiwgYSwgXCIsXCIsIGIsIFwiKVwiXS5qb2luKFwiXCIpXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBtYWtlUHJvZHVjdChiLCBhKVxuICB9XG59XG5cbmZ1bmN0aW9uIHNpZ24ocykge1xuICBpZihzICYgMSAhPT0gMCkge1xuICAgIHJldHVybiBcIi1cIlxuICB9XG4gIHJldHVybiBcIlwiXG59XG5cbmZ1bmN0aW9uIGRldGVybWluYW50KG0pIHtcbiAgaWYobS5sZW5ndGggPT09IDIpIHtcbiAgICByZXR1cm4gW1tcImRpZmYoXCIsIG1ha2VQcm9kdWN0KG1bMF1bMF0sIG1bMV1bMV0pLCBcIixcIiwgbWFrZVByb2R1Y3QobVsxXVswXSwgbVswXVsxXSksIFwiKVwiXS5qb2luKFwiXCIpXVxuICB9IGVsc2Uge1xuICAgIHZhciBleHByID0gW11cbiAgICBmb3IodmFyIGk9MDsgaTxtLmxlbmd0aDsgKytpKSB7XG4gICAgICBleHByLnB1c2goW1wic2NhbGUoXCIsIGdlbmVyYXRlU3VtKGRldGVybWluYW50KGNvZmFjdG9yKG0sIGkpKSksIFwiLFwiLCBzaWduKGkpLCBtWzBdW2ldLCBcIilcIl0uam9pbihcIlwiKSlcbiAgICB9XG4gICAgcmV0dXJuIGV4cHJcbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlU3F1YXJlKGQsIG4pIHtcbiAgdmFyIHRlcm1zID0gW11cbiAgZm9yKHZhciBpPTA7IGk8bi0yOyArK2kpIHtcbiAgICB0ZXJtcy5wdXNoKFtcInByb2QobVwiLCBkLCBcIltcIiwgaSwgXCJdLG1cIiwgZCwgXCJbXCIsIGksIFwiXSlcIl0uam9pbihcIlwiKSlcbiAgfVxuICByZXR1cm4gZ2VuZXJhdGVTdW0odGVybXMpXG59XG5cbmZ1bmN0aW9uIG9yaWVudGF0aW9uKG4pIHtcbiAgdmFyIHBvcyA9IFtdXG4gIHZhciBuZWcgPSBbXVxuICB2YXIgbSA9IG1hdHJpeChuKVxuICBmb3IodmFyIGk9MDsgaTxuOyArK2kpIHtcbiAgICBtWzBdW2ldID0gXCIxXCJcbiAgICBtW24tMV1baV0gPSBcIndcIitpXG4gIH0gXG4gIGZvcih2YXIgaT0wOyBpPG47ICsraSkge1xuICAgIGlmKChpJjEpPT09MCkge1xuICAgICAgcG9zLnB1c2guYXBwbHkocG9zLGRldGVybWluYW50KGNvZmFjdG9yKG0sIGkpKSlcbiAgICB9IGVsc2Uge1xuICAgICAgbmVnLnB1c2guYXBwbHkobmVnLGRldGVybWluYW50KGNvZmFjdG9yKG0sIGkpKSlcbiAgICB9XG4gIH1cbiAgdmFyIHBvc0V4cHIgPSBnZW5lcmF0ZVN1bShwb3MpXG4gIHZhciBuZWdFeHByID0gZ2VuZXJhdGVTdW0obmVnKVxuICB2YXIgZnVuY05hbWUgPSBcImV4YWN0SW5TcGhlcmVcIiArIG5cbiAgdmFyIGZ1bmNBcmdzID0gW11cbiAgZm9yKHZhciBpPTA7IGk8bjsgKytpKSB7XG4gICAgZnVuY0FyZ3MucHVzaChcIm1cIiArIGkpXG4gIH1cbiAgdmFyIGNvZGUgPSBbXCJmdW5jdGlvbiBcIiwgZnVuY05hbWUsIFwiKFwiLCBmdW5jQXJncy5qb2luKCksIFwiKXtcIl1cbiAgZm9yKHZhciBpPTA7IGk8bjsgKytpKSB7XG4gICAgY29kZS5wdXNoKFwidmFyIHdcIixpLFwiPVwiLG1ha2VTcXVhcmUoaSxuKSxcIjtcIilcbiAgICBmb3IodmFyIGo9MDsgajxuOyArK2opIHtcbiAgICAgIGlmKGogIT09IGkpIHtcbiAgICAgICAgY29kZS5wdXNoKFwidmFyIHdcIixpLFwibVwiLGosXCI9c2NhbGUod1wiLGksXCIsbVwiLGosXCJbMF0pO1wiKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBjb2RlLnB1c2goXCJ2YXIgcD1cIiwgcG9zRXhwciwgXCIsbj1cIiwgbmVnRXhwciwgXCIsZD1kaWZmKHAsbik7cmV0dXJuIGRbZC5sZW5ndGgtMV07fXJldHVybiBcIiwgZnVuY05hbWUpXG4gIHZhciBwcm9jID0gbmV3IEZ1bmN0aW9uKFwic3VtXCIsIFwiZGlmZlwiLCBcInByb2RcIiwgXCJzY2FsZVwiLCBjb2RlLmpvaW4oXCJcIikpXG4gIHJldHVybiBwcm9jKHJvYnVzdFN1bSwgcm9idXN0RGlmZiwgdHdvUHJvZHVjdCwgcm9idXN0U2NhbGUpXG59XG5cbmZ1bmN0aW9uIGluU3BoZXJlMCgpIHsgcmV0dXJuIDAgfVxuZnVuY3Rpb24gaW5TcGhlcmUxKCkgeyByZXR1cm4gMCB9XG5mdW5jdGlvbiBpblNwaGVyZTIoKSB7IHJldHVybiAwIH1cblxudmFyIENBQ0hFRCA9IFtcbiAgaW5TcGhlcmUwLFxuICBpblNwaGVyZTEsXG4gIGluU3BoZXJlMlxuXVxuXG5mdW5jdGlvbiBzbG93SW5TcGhlcmUoYXJncykge1xuICB2YXIgcHJvYyA9IENBQ0hFRFthcmdzLmxlbmd0aF1cbiAgaWYoIXByb2MpIHtcbiAgICBwcm9jID0gQ0FDSEVEW2FyZ3MubGVuZ3RoXSA9IG9yaWVudGF0aW9uKGFyZ3MubGVuZ3RoKVxuICB9XG4gIHJldHVybiBwcm9jLmFwcGx5KHVuZGVmaW5lZCwgYXJncylcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVJblNwaGVyZVRlc3QoKSB7XG4gIHdoaWxlKENBQ0hFRC5sZW5ndGggPD0gTlVNX0VYUEFORCkge1xuICAgIENBQ0hFRC5wdXNoKG9yaWVudGF0aW9uKENBQ0hFRC5sZW5ndGgpKVxuICB9XG4gIHZhciBhcmdzID0gW11cbiAgdmFyIHByb2NBcmdzID0gW1wic2xvd1wiXVxuICBmb3IodmFyIGk9MDsgaTw9TlVNX0VYUEFORDsgKytpKSB7XG4gICAgYXJncy5wdXNoKFwiYVwiICsgaSlcbiAgICBwcm9jQXJncy5wdXNoKFwib1wiICsgaSlcbiAgfVxuICB2YXIgY29kZSA9IFtcbiAgICBcImZ1bmN0aW9uIHRlc3RJblNwaGVyZShcIiwgYXJncy5qb2luKCksIFwiKXtzd2l0Y2goYXJndW1lbnRzLmxlbmd0aCl7Y2FzZSAwOmNhc2UgMTpyZXR1cm4gMDtcIlxuICBdXG4gIGZvcih2YXIgaT0yOyBpPD1OVU1fRVhQQU5EOyArK2kpIHtcbiAgICBjb2RlLnB1c2goXCJjYXNlIFwiLCBpLCBcIjpyZXR1cm4gb1wiLCBpLCBcIihcIiwgYXJncy5zbGljZSgwLCBpKS5qb2luKCksIFwiKTtcIilcbiAgfVxuICBjb2RlLnB1c2goXCJ9dmFyIHM9bmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGgpO2Zvcih2YXIgaT0wO2k8YXJndW1lbnRzLmxlbmd0aDsrK2kpe3NbaV09YXJndW1lbnRzW2ldfTtyZXR1cm4gc2xvdyhzKTt9cmV0dXJuIHRlc3RJblNwaGVyZVwiKVxuICBwcm9jQXJncy5wdXNoKGNvZGUuam9pbihcIlwiKSlcblxuICB2YXIgcHJvYyA9IEZ1bmN0aW9uLmFwcGx5KHVuZGVmaW5lZCwgcHJvY0FyZ3MpXG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBwcm9jLmFwcGx5KHVuZGVmaW5lZCwgW3Nsb3dJblNwaGVyZV0uY29uY2F0KENBQ0hFRCkpXG4gIGZvcih2YXIgaT0wOyBpPD1OVU1fRVhQQU5EOyArK2kpIHtcbiAgICBtb2R1bGUuZXhwb3J0c1tpXSA9IENBQ0hFRFtpXVxuICB9XG59XG5cbmdlbmVyYXRlSW5TcGhlcmVUZXN0KCkiLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgdHdvUHJvZHVjdCA9IHJlcXVpcmUoXCJ0d28tcHJvZHVjdFwiKVxudmFyIHJvYnVzdFN1bSA9IHJlcXVpcmUoXCJyb2J1c3Qtc3VtXCIpXG52YXIgcm9idXN0U2NhbGUgPSByZXF1aXJlKFwicm9idXN0LXNjYWxlXCIpXG52YXIgcm9idXN0U3VidHJhY3QgPSByZXF1aXJlKFwicm9idXN0LXN1YnRyYWN0XCIpXG5cbnZhciBOVU1fRVhQQU5EID0gNVxuXG52YXIgRVBTSUxPTiAgICAgPSAxLjExMDIyMzAyNDYyNTE1NjVlLTE2XG52YXIgRVJSQk9VTkQzICAgPSAoMy4wICsgMTYuMCAqIEVQU0lMT04pICogRVBTSUxPTlxudmFyIEVSUkJPVU5ENCAgID0gKDcuMCArIDU2LjAgKiBFUFNJTE9OKSAqIEVQU0lMT05cblxuZnVuY3Rpb24gY29mYWN0b3IobSwgYykge1xuICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KG0ubGVuZ3RoLTEpXG4gIGZvcih2YXIgaT0xOyBpPG0ubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgciA9IHJlc3VsdFtpLTFdID0gbmV3IEFycmF5KG0ubGVuZ3RoLTEpXG4gICAgZm9yKHZhciBqPTAsaz0wOyBqPG0ubGVuZ3RoOyArK2opIHtcbiAgICAgIGlmKGogPT09IGMpIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIHJbaysrXSA9IG1baV1bal1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5mdW5jdGlvbiBtYXRyaXgobikge1xuICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KG4pXG4gIGZvcih2YXIgaT0wOyBpPG47ICsraSkge1xuICAgIHJlc3VsdFtpXSA9IG5ldyBBcnJheShuKVxuICAgIGZvcih2YXIgaj0wOyBqPG47ICsraikge1xuICAgICAgcmVzdWx0W2ldW2pdID0gW1wibVwiLCBqLCBcIltcIiwgKG4taS0xKSwgXCJdXCJdLmpvaW4oXCJcIilcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5mdW5jdGlvbiBzaWduKG4pIHtcbiAgaWYobiAmIDEpIHtcbiAgICByZXR1cm4gXCItXCJcbiAgfVxuICByZXR1cm4gXCJcIlxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVN1bShleHByKSB7XG4gIGlmKGV4cHIubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGV4cHJbMF1cbiAgfSBlbHNlIGlmKGV4cHIubGVuZ3RoID09PSAyKSB7XG4gICAgcmV0dXJuIFtcInN1bShcIiwgZXhwclswXSwgXCIsXCIsIGV4cHJbMV0sIFwiKVwiXS5qb2luKFwiXCIpXG4gIH0gZWxzZSB7XG4gICAgdmFyIG0gPSBleHByLmxlbmd0aD4+MVxuICAgIHJldHVybiBbXCJzdW0oXCIsIGdlbmVyYXRlU3VtKGV4cHIuc2xpY2UoMCwgbSkpLCBcIixcIiwgZ2VuZXJhdGVTdW0oZXhwci5zbGljZShtKSksIFwiKVwiXS5qb2luKFwiXCIpXG4gIH1cbn1cblxuZnVuY3Rpb24gZGV0ZXJtaW5hbnQobSkge1xuICBpZihtLmxlbmd0aCA9PT0gMikge1xuICAgIHJldHVybiBbW1wic3VtKHByb2QoXCIsIG1bMF1bMF0sIFwiLFwiLCBtWzFdWzFdLCBcIikscHJvZCgtXCIsIG1bMF1bMV0sIFwiLFwiLCBtWzFdWzBdLCBcIikpXCJdLmpvaW4oXCJcIildXG4gIH0gZWxzZSB7XG4gICAgdmFyIGV4cHIgPSBbXVxuICAgIGZvcih2YXIgaT0wOyBpPG0ubGVuZ3RoOyArK2kpIHtcbiAgICAgIGV4cHIucHVzaChbXCJzY2FsZShcIiwgZ2VuZXJhdGVTdW0oZGV0ZXJtaW5hbnQoY29mYWN0b3IobSwgaSkpKSwgXCIsXCIsIHNpZ24oaSksIG1bMF1baV0sIFwiKVwiXS5qb2luKFwiXCIpKVxuICAgIH1cbiAgICByZXR1cm4gZXhwclxuICB9XG59XG5cbmZ1bmN0aW9uIG9yaWVudGF0aW9uKG4pIHtcbiAgdmFyIHBvcyA9IFtdXG4gIHZhciBuZWcgPSBbXVxuICB2YXIgbSA9IG1hdHJpeChuKVxuICB2YXIgYXJncyA9IFtdXG4gIGZvcih2YXIgaT0wOyBpPG47ICsraSkge1xuICAgIGlmKChpJjEpPT09MCkge1xuICAgICAgcG9zLnB1c2guYXBwbHkocG9zLCBkZXRlcm1pbmFudChjb2ZhY3RvcihtLCBpKSkpXG4gICAgfSBlbHNlIHtcbiAgICAgIG5lZy5wdXNoLmFwcGx5KG5lZywgZGV0ZXJtaW5hbnQoY29mYWN0b3IobSwgaSkpKVxuICAgIH1cbiAgICBhcmdzLnB1c2goXCJtXCIgKyBpKVxuICB9XG4gIHZhciBwb3NFeHByID0gZ2VuZXJhdGVTdW0ocG9zKVxuICB2YXIgbmVnRXhwciA9IGdlbmVyYXRlU3VtKG5lZylcbiAgdmFyIGZ1bmNOYW1lID0gXCJvcmllbnRhdGlvblwiICsgbiArIFwiRXhhY3RcIlxuICB2YXIgY29kZSA9IFtcImZ1bmN0aW9uIFwiLCBmdW5jTmFtZSwgXCIoXCIsIGFyZ3Muam9pbigpLCBcIil7dmFyIHA9XCIsIHBvc0V4cHIsIFwiLG49XCIsIG5lZ0V4cHIsIFwiLGQ9c3ViKHAsbik7XFxcbnJldHVybiBkW2QubGVuZ3RoLTFdO307cmV0dXJuIFwiLCBmdW5jTmFtZV0uam9pbihcIlwiKVxuICB2YXIgcHJvYyA9IG5ldyBGdW5jdGlvbihcInN1bVwiLCBcInByb2RcIiwgXCJzY2FsZVwiLCBcInN1YlwiLCBjb2RlKVxuICByZXR1cm4gcHJvYyhyb2J1c3RTdW0sIHR3b1Byb2R1Y3QsIHJvYnVzdFNjYWxlLCByb2J1c3RTdWJ0cmFjdClcbn1cblxudmFyIG9yaWVudGF0aW9uM0V4YWN0ID0gb3JpZW50YXRpb24oMylcbnZhciBvcmllbnRhdGlvbjRFeGFjdCA9IG9yaWVudGF0aW9uKDQpXG5cbnZhciBDQUNIRUQgPSBbXG4gIGZ1bmN0aW9uIG9yaWVudGF0aW9uMCgpIHsgcmV0dXJuIDAgfSxcbiAgZnVuY3Rpb24gb3JpZW50YXRpb24xKCkgeyByZXR1cm4gMCB9LFxuICBmdW5jdGlvbiBvcmllbnRhdGlvbjIoYSwgYikgeyBcbiAgICByZXR1cm4gYlswXSAtIGFbMF1cbiAgfSxcbiAgZnVuY3Rpb24gb3JpZW50YXRpb24zKGEsIGIsIGMpIHtcbiAgICB2YXIgbCA9IChhWzFdIC0gY1sxXSkgKiAoYlswXSAtIGNbMF0pXG4gICAgdmFyIHIgPSAoYVswXSAtIGNbMF0pICogKGJbMV0gLSBjWzFdKVxuICAgIHZhciBkZXQgPSBsIC0gclxuICAgIHZhciBzXG4gICAgaWYobCA+IDApIHtcbiAgICAgIGlmKHIgPD0gMCkge1xuICAgICAgICByZXR1cm4gZGV0XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzID0gbCArIHJcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYobCA8IDApIHtcbiAgICAgIGlmKHIgPj0gMCkge1xuICAgICAgICByZXR1cm4gZGV0XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzID0gLShsICsgcilcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGRldFxuICAgIH1cbiAgICB2YXIgdG9sID0gRVJSQk9VTkQzICogc1xuICAgIGlmKGRldCA+PSB0b2wgfHwgZGV0IDw9IC10b2wpIHtcbiAgICAgIHJldHVybiBkZXRcbiAgICB9XG4gICAgcmV0dXJuIG9yaWVudGF0aW9uM0V4YWN0KGEsIGIsIGMpXG4gIH0sXG4gIGZ1bmN0aW9uIG9yaWVudGF0aW9uNChhLGIsYyxkKSB7XG4gICAgdmFyIGFkeCA9IGFbMF0gLSBkWzBdXG4gICAgdmFyIGJkeCA9IGJbMF0gLSBkWzBdXG4gICAgdmFyIGNkeCA9IGNbMF0gLSBkWzBdXG4gICAgdmFyIGFkeSA9IGFbMV0gLSBkWzFdXG4gICAgdmFyIGJkeSA9IGJbMV0gLSBkWzFdXG4gICAgdmFyIGNkeSA9IGNbMV0gLSBkWzFdXG4gICAgdmFyIGFkeiA9IGFbMl0gLSBkWzJdXG4gICAgdmFyIGJkeiA9IGJbMl0gLSBkWzJdXG4gICAgdmFyIGNkeiA9IGNbMl0gLSBkWzJdXG4gICAgdmFyIGJkeGNkeSA9IGJkeCAqIGNkeVxuICAgIHZhciBjZHhiZHkgPSBjZHggKiBiZHlcbiAgICB2YXIgY2R4YWR5ID0gY2R4ICogYWR5XG4gICAgdmFyIGFkeGNkeSA9IGFkeCAqIGNkeVxuICAgIHZhciBhZHhiZHkgPSBhZHggKiBiZHlcbiAgICB2YXIgYmR4YWR5ID0gYmR4ICogYWR5XG4gICAgdmFyIGRldCA9IGFkeiAqIChiZHhjZHkgLSBjZHhiZHkpIFxuICAgICAgICAgICAgKyBiZHogKiAoY2R4YWR5IC0gYWR4Y2R5KVxuICAgICAgICAgICAgKyBjZHogKiAoYWR4YmR5IC0gYmR4YWR5KVxuICAgIHZhciBwZXJtYW5lbnQgPSAoTWF0aC5hYnMoYmR4Y2R5KSArIE1hdGguYWJzKGNkeGJkeSkpICogTWF0aC5hYnMoYWR6KVxuICAgICAgICAgICAgICAgICAgKyAoTWF0aC5hYnMoY2R4YWR5KSArIE1hdGguYWJzKGFkeGNkeSkpICogTWF0aC5hYnMoYmR6KVxuICAgICAgICAgICAgICAgICAgKyAoTWF0aC5hYnMoYWR4YmR5KSArIE1hdGguYWJzKGJkeGFkeSkpICogTWF0aC5hYnMoY2R6KVxuICAgIHZhciB0b2wgPSBFUlJCT1VORDQgKiBwZXJtYW5lbnRcbiAgICBpZiAoKGRldCA+IHRvbCkgfHwgKC1kZXQgPiB0b2wpKSB7XG4gICAgICByZXR1cm4gZGV0XG4gICAgfVxuICAgIHJldHVybiBvcmllbnRhdGlvbjRFeGFjdChhLGIsYyxkKVxuICB9XG5dXG5cbmZ1bmN0aW9uIHNsb3dPcmllbnQoYXJncykge1xuICB2YXIgcHJvYyA9IENBQ0hFRFthcmdzLmxlbmd0aF1cbiAgaWYoIXByb2MpIHtcbiAgICBwcm9jID0gQ0FDSEVEW2FyZ3MubGVuZ3RoXSA9IG9yaWVudGF0aW9uKGFyZ3MubGVuZ3RoKVxuICB9XG4gIHJldHVybiBwcm9jLmFwcGx5KHVuZGVmaW5lZCwgYXJncylcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVPcmllbnRhdGlvblByb2MoKSB7XG4gIHdoaWxlKENBQ0hFRC5sZW5ndGggPD0gTlVNX0VYUEFORCkge1xuICAgIENBQ0hFRC5wdXNoKG9yaWVudGF0aW9uKENBQ0hFRC5sZW5ndGgpKVxuICB9XG4gIHZhciBhcmdzID0gW11cbiAgdmFyIHByb2NBcmdzID0gW1wic2xvd1wiXVxuICBmb3IodmFyIGk9MDsgaTw9TlVNX0VYUEFORDsgKytpKSB7XG4gICAgYXJncy5wdXNoKFwiYVwiICsgaSlcbiAgICBwcm9jQXJncy5wdXNoKFwib1wiICsgaSlcbiAgfVxuICB2YXIgY29kZSA9IFtcbiAgICBcImZ1bmN0aW9uIGdldE9yaWVudGF0aW9uKFwiLCBhcmdzLmpvaW4oKSwgXCIpe3N3aXRjaChhcmd1bWVudHMubGVuZ3RoKXtjYXNlIDA6Y2FzZSAxOnJldHVybiAwO1wiXG4gIF1cbiAgZm9yKHZhciBpPTI7IGk8PU5VTV9FWFBBTkQ7ICsraSkge1xuICAgIGNvZGUucHVzaChcImNhc2UgXCIsIGksIFwiOnJldHVybiBvXCIsIGksIFwiKFwiLCBhcmdzLnNsaWNlKDAsIGkpLmpvaW4oKSwgXCIpO1wiKVxuICB9XG4gIGNvZGUucHVzaChcIn12YXIgcz1uZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCk7Zm9yKHZhciBpPTA7aTxhcmd1bWVudHMubGVuZ3RoOysraSl7c1tpXT1hcmd1bWVudHNbaV19O3JldHVybiBzbG93KHMpO31yZXR1cm4gZ2V0T3JpZW50YXRpb25cIilcbiAgcHJvY0FyZ3MucHVzaChjb2RlLmpvaW4oXCJcIikpXG5cbiAgdmFyIHByb2MgPSBGdW5jdGlvbi5hcHBseSh1bmRlZmluZWQsIHByb2NBcmdzKVxuICBtb2R1bGUuZXhwb3J0cyA9IHByb2MuYXBwbHkodW5kZWZpbmVkLCBbc2xvd09yaWVudF0uY29uY2F0KENBQ0hFRCkpXG4gIGZvcih2YXIgaT0wOyBpPD1OVU1fRVhQQU5EOyArK2kpIHtcbiAgICBtb2R1bGUuZXhwb3J0c1tpXSA9IENBQ0hFRFtpXVxuICB9XG59XG5cbmdlbmVyYXRlT3JpZW50YXRpb25Qcm9jKCkiLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgdHdvUHJvZHVjdCA9IHJlcXVpcmUoXCJ0d28tcHJvZHVjdFwiKVxudmFyIHR3b1N1bSA9IHJlcXVpcmUoXCJ0d28tc3VtXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gc2NhbGVMaW5lYXJFeHBhbnNpb25cblxuZnVuY3Rpb24gc2NhbGVMaW5lYXJFeHBhbnNpb24oZSwgc2NhbGUpIHtcbiAgdmFyIG4gPSBlLmxlbmd0aFxuICBpZihuID09PSAxKSB7XG4gICAgdmFyIHRzID0gdHdvUHJvZHVjdChlWzBdLCBzY2FsZSlcbiAgICBpZih0c1swXSkge1xuICAgICAgcmV0dXJuIHRzXG4gICAgfVxuICAgIHJldHVybiBbIHRzWzFdIF1cbiAgfVxuICB2YXIgZyA9IG5ldyBBcnJheSgyICogbilcbiAgdmFyIHEgPSBbMC4xLCAwLjFdXG4gIHZhciB0ID0gWzAuMSwgMC4xXVxuICB2YXIgY291bnQgPSAwXG4gIHR3b1Byb2R1Y3QoZVswXSwgc2NhbGUsIHEpXG4gIGlmKHFbMF0pIHtcbiAgICBnW2NvdW50KytdID0gcVswXVxuICB9XG4gIGZvcih2YXIgaT0xOyBpPG47ICsraSkge1xuICAgIHR3b1Byb2R1Y3QoZVtpXSwgc2NhbGUsIHQpXG4gICAgdmFyIHBxID0gcVsxXVxuICAgIHR3b1N1bShwcSwgdFswXSwgcSlcbiAgICBpZihxWzBdKSB7XG4gICAgICBnW2NvdW50KytdID0gcVswXVxuICAgIH1cbiAgICB2YXIgYSA9IHRbMV1cbiAgICB2YXIgYiA9IHFbMV1cbiAgICB2YXIgeCA9IGEgKyBiXG4gICAgdmFyIGJ2ID0geCAtIGFcbiAgICB2YXIgeSA9IGIgLSBidlxuICAgIHFbMV0gPSB4XG4gICAgaWYoeSkge1xuICAgICAgZ1tjb3VudCsrXSA9IHlcbiAgICB9XG4gIH1cbiAgaWYocVsxXSkge1xuICAgIGdbY291bnQrK10gPSBxWzFdXG4gIH1cbiAgaWYoY291bnQgPT09IDApIHtcbiAgICBnW2NvdW50KytdID0gMC4wXG4gIH1cbiAgZy5sZW5ndGggPSBjb3VudFxuICByZXR1cm4gZ1xufSIsIlwidXNlIHN0cmljdFwiXG5cbm1vZHVsZS5leHBvcnRzID0gcm9idXN0U3VidHJhY3RcblxuLy9FYXN5IGNhc2U6IEFkZCB0d28gc2NhbGFyc1xuZnVuY3Rpb24gc2NhbGFyU2NhbGFyKGEsIGIpIHtcbiAgdmFyIHggPSBhICsgYlxuICB2YXIgYnYgPSB4IC0gYVxuICB2YXIgYXYgPSB4IC0gYnZcbiAgdmFyIGJyID0gYiAtIGJ2XG4gIHZhciBhciA9IGEgLSBhdlxuICB2YXIgeSA9IGFyICsgYnJcbiAgaWYoeSkge1xuICAgIHJldHVybiBbeSwgeF1cbiAgfVxuICByZXR1cm4gW3hdXG59XG5cbmZ1bmN0aW9uIHJvYnVzdFN1YnRyYWN0KGUsIGYpIHtcbiAgdmFyIG5lID0gZS5sZW5ndGh8MFxuICB2YXIgbmYgPSBmLmxlbmd0aHwwXG4gIGlmKG5lID09PSAxICYmIG5mID09PSAxKSB7XG4gICAgcmV0dXJuIHNjYWxhclNjYWxhcihlWzBdLCAtZlswXSlcbiAgfVxuICB2YXIgbiA9IG5lICsgbmZcbiAgdmFyIGcgPSBuZXcgQXJyYXkobilcbiAgdmFyIGNvdW50ID0gMFxuICB2YXIgZXB0ciA9IDBcbiAgdmFyIGZwdHIgPSAwXG4gIHZhciBhYnMgPSBNYXRoLmFic1xuICB2YXIgZWkgPSBlW2VwdHJdXG4gIHZhciBlYSA9IGFicyhlaSlcbiAgdmFyIGZpID0gLWZbZnB0cl1cbiAgdmFyIGZhID0gYWJzKGZpKVxuICB2YXIgYSwgYlxuICBpZihlYSA8IGZhKSB7XG4gICAgYiA9IGVpXG4gICAgZXB0ciArPSAxXG4gICAgaWYoZXB0ciA8IG5lKSB7XG4gICAgICBlaSA9IGVbZXB0cl1cbiAgICAgIGVhID0gYWJzKGVpKVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBiID0gZmlcbiAgICBmcHRyICs9IDFcbiAgICBpZihmcHRyIDwgbmYpIHtcbiAgICAgIGZpID0gLWZbZnB0cl1cbiAgICAgIGZhID0gYWJzKGZpKVxuICAgIH1cbiAgfVxuICBpZigoZXB0ciA8IG5lICYmIGVhIDwgZmEpIHx8IChmcHRyID49IG5mKSkge1xuICAgIGEgPSBlaVxuICAgIGVwdHIgKz0gMVxuICAgIGlmKGVwdHIgPCBuZSkge1xuICAgICAgZWkgPSBlW2VwdHJdXG4gICAgICBlYSA9IGFicyhlaSlcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgYSA9IGZpXG4gICAgZnB0ciArPSAxXG4gICAgaWYoZnB0ciA8IG5mKSB7XG4gICAgICBmaSA9IC1mW2ZwdHJdXG4gICAgICBmYSA9IGFicyhmaSlcbiAgICB9XG4gIH1cbiAgdmFyIHggPSBhICsgYlxuICB2YXIgYnYgPSB4IC0gYVxuICB2YXIgeSA9IGIgLSBidlxuICB2YXIgcTAgPSB5XG4gIHZhciBxMSA9IHhcbiAgdmFyIF94LCBfYnYsIF9hdiwgX2JyLCBfYXJcbiAgd2hpbGUoZXB0ciA8IG5lICYmIGZwdHIgPCBuZikge1xuICAgIGlmKGVhIDwgZmEpIHtcbiAgICAgIGEgPSBlaVxuICAgICAgZXB0ciArPSAxXG4gICAgICBpZihlcHRyIDwgbmUpIHtcbiAgICAgICAgZWkgPSBlW2VwdHJdXG4gICAgICAgIGVhID0gYWJzKGVpKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBhID0gZmlcbiAgICAgIGZwdHIgKz0gMVxuICAgICAgaWYoZnB0ciA8IG5mKSB7XG4gICAgICAgIGZpID0gLWZbZnB0cl1cbiAgICAgICAgZmEgPSBhYnMoZmkpXG4gICAgICB9XG4gICAgfVxuICAgIGIgPSBxMFxuICAgIHggPSBhICsgYlxuICAgIGJ2ID0geCAtIGFcbiAgICB5ID0gYiAtIGJ2XG4gICAgaWYoeSkge1xuICAgICAgZ1tjb3VudCsrXSA9IHlcbiAgICB9XG4gICAgX3ggPSBxMSArIHhcbiAgICBfYnYgPSBfeCAtIHExXG4gICAgX2F2ID0gX3ggLSBfYnZcbiAgICBfYnIgPSB4IC0gX2J2XG4gICAgX2FyID0gcTEgLSBfYXZcbiAgICBxMCA9IF9hciArIF9iclxuICAgIHExID0gX3hcbiAgfVxuICB3aGlsZShlcHRyIDwgbmUpIHtcbiAgICBhID0gZWlcbiAgICBiID0gcTBcbiAgICB4ID0gYSArIGJcbiAgICBidiA9IHggLSBhXG4gICAgeSA9IGIgLSBidlxuICAgIGlmKHkpIHtcbiAgICAgIGdbY291bnQrK10gPSB5XG4gICAgfVxuICAgIF94ID0gcTEgKyB4XG4gICAgX2J2ID0gX3ggLSBxMVxuICAgIF9hdiA9IF94IC0gX2J2XG4gICAgX2JyID0geCAtIF9idlxuICAgIF9hciA9IHExIC0gX2F2XG4gICAgcTAgPSBfYXIgKyBfYnJcbiAgICBxMSA9IF94XG4gICAgZXB0ciArPSAxXG4gICAgaWYoZXB0ciA8IG5lKSB7XG4gICAgICBlaSA9IGVbZXB0cl1cbiAgICB9XG4gIH1cbiAgd2hpbGUoZnB0ciA8IG5mKSB7XG4gICAgYSA9IGZpXG4gICAgYiA9IHEwXG4gICAgeCA9IGEgKyBiXG4gICAgYnYgPSB4IC0gYVxuICAgIHkgPSBiIC0gYnZcbiAgICBpZih5KSB7XG4gICAgICBnW2NvdW50KytdID0geVxuICAgIH0gXG4gICAgX3ggPSBxMSArIHhcbiAgICBfYnYgPSBfeCAtIHExXG4gICAgX2F2ID0gX3ggLSBfYnZcbiAgICBfYnIgPSB4IC0gX2J2XG4gICAgX2FyID0gcTEgLSBfYXZcbiAgICBxMCA9IF9hciArIF9iclxuICAgIHExID0gX3hcbiAgICBmcHRyICs9IDFcbiAgICBpZihmcHRyIDwgbmYpIHtcbiAgICAgIGZpID0gLWZbZnB0cl1cbiAgICB9XG4gIH1cbiAgaWYocTApIHtcbiAgICBnW2NvdW50KytdID0gcTBcbiAgfVxuICBpZihxMSkge1xuICAgIGdbY291bnQrK10gPSBxMVxuICB9XG4gIGlmKCFjb3VudCkge1xuICAgIGdbY291bnQrK10gPSAwLjAgIFxuICB9XG4gIGcubGVuZ3RoID0gY291bnRcbiAgcmV0dXJuIGdcbn0iLCJcInVzZSBzdHJpY3RcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IGxpbmVhckV4cGFuc2lvblN1bVxuXG4vL0Vhc3kgY2FzZTogQWRkIHR3byBzY2FsYXJzXG5mdW5jdGlvbiBzY2FsYXJTY2FsYXIoYSwgYikge1xuICB2YXIgeCA9IGEgKyBiXG4gIHZhciBidiA9IHggLSBhXG4gIHZhciBhdiA9IHggLSBidlxuICB2YXIgYnIgPSBiIC0gYnZcbiAgdmFyIGFyID0gYSAtIGF2XG4gIHZhciB5ID0gYXIgKyBiclxuICBpZih5KSB7XG4gICAgcmV0dXJuIFt5LCB4XVxuICB9XG4gIHJldHVybiBbeF1cbn1cblxuZnVuY3Rpb24gbGluZWFyRXhwYW5zaW9uU3VtKGUsIGYpIHtcbiAgdmFyIG5lID0gZS5sZW5ndGh8MFxuICB2YXIgbmYgPSBmLmxlbmd0aHwwXG4gIGlmKG5lID09PSAxICYmIG5mID09PSAxKSB7XG4gICAgcmV0dXJuIHNjYWxhclNjYWxhcihlWzBdLCBmWzBdKVxuICB9XG4gIHZhciBuID0gbmUgKyBuZlxuICB2YXIgZyA9IG5ldyBBcnJheShuKVxuICB2YXIgY291bnQgPSAwXG4gIHZhciBlcHRyID0gMFxuICB2YXIgZnB0ciA9IDBcbiAgdmFyIGFicyA9IE1hdGguYWJzXG4gIHZhciBlaSA9IGVbZXB0cl1cbiAgdmFyIGVhID0gYWJzKGVpKVxuICB2YXIgZmkgPSBmW2ZwdHJdXG4gIHZhciBmYSA9IGFicyhmaSlcbiAgdmFyIGEsIGJcbiAgaWYoZWEgPCBmYSkge1xuICAgIGIgPSBlaVxuICAgIGVwdHIgKz0gMVxuICAgIGlmKGVwdHIgPCBuZSkge1xuICAgICAgZWkgPSBlW2VwdHJdXG4gICAgICBlYSA9IGFicyhlaSlcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgYiA9IGZpXG4gICAgZnB0ciArPSAxXG4gICAgaWYoZnB0ciA8IG5mKSB7XG4gICAgICBmaSA9IGZbZnB0cl1cbiAgICAgIGZhID0gYWJzKGZpKVxuICAgIH1cbiAgfVxuICBpZigoZXB0ciA8IG5lICYmIGVhIDwgZmEpIHx8IChmcHRyID49IG5mKSkge1xuICAgIGEgPSBlaVxuICAgIGVwdHIgKz0gMVxuICAgIGlmKGVwdHIgPCBuZSkge1xuICAgICAgZWkgPSBlW2VwdHJdXG4gICAgICBlYSA9IGFicyhlaSlcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgYSA9IGZpXG4gICAgZnB0ciArPSAxXG4gICAgaWYoZnB0ciA8IG5mKSB7XG4gICAgICBmaSA9IGZbZnB0cl1cbiAgICAgIGZhID0gYWJzKGZpKVxuICAgIH1cbiAgfVxuICB2YXIgeCA9IGEgKyBiXG4gIHZhciBidiA9IHggLSBhXG4gIHZhciB5ID0gYiAtIGJ2XG4gIHZhciBxMCA9IHlcbiAgdmFyIHExID0geFxuICB2YXIgX3gsIF9idiwgX2F2LCBfYnIsIF9hclxuICB3aGlsZShlcHRyIDwgbmUgJiYgZnB0ciA8IG5mKSB7XG4gICAgaWYoZWEgPCBmYSkge1xuICAgICAgYSA9IGVpXG4gICAgICBlcHRyICs9IDFcbiAgICAgIGlmKGVwdHIgPCBuZSkge1xuICAgICAgICBlaSA9IGVbZXB0cl1cbiAgICAgICAgZWEgPSBhYnMoZWkpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGEgPSBmaVxuICAgICAgZnB0ciArPSAxXG4gICAgICBpZihmcHRyIDwgbmYpIHtcbiAgICAgICAgZmkgPSBmW2ZwdHJdXG4gICAgICAgIGZhID0gYWJzKGZpKVxuICAgICAgfVxuICAgIH1cbiAgICBiID0gcTBcbiAgICB4ID0gYSArIGJcbiAgICBidiA9IHggLSBhXG4gICAgeSA9IGIgLSBidlxuICAgIGlmKHkpIHtcbiAgICAgIGdbY291bnQrK10gPSB5XG4gICAgfVxuICAgIF94ID0gcTEgKyB4XG4gICAgX2J2ID0gX3ggLSBxMVxuICAgIF9hdiA9IF94IC0gX2J2XG4gICAgX2JyID0geCAtIF9idlxuICAgIF9hciA9IHExIC0gX2F2XG4gICAgcTAgPSBfYXIgKyBfYnJcbiAgICBxMSA9IF94XG4gIH1cbiAgd2hpbGUoZXB0ciA8IG5lKSB7XG4gICAgYSA9IGVpXG4gICAgYiA9IHEwXG4gICAgeCA9IGEgKyBiXG4gICAgYnYgPSB4IC0gYVxuICAgIHkgPSBiIC0gYnZcbiAgICBpZih5KSB7XG4gICAgICBnW2NvdW50KytdID0geVxuICAgIH1cbiAgICBfeCA9IHExICsgeFxuICAgIF9idiA9IF94IC0gcTFcbiAgICBfYXYgPSBfeCAtIF9idlxuICAgIF9iciA9IHggLSBfYnZcbiAgICBfYXIgPSBxMSAtIF9hdlxuICAgIHEwID0gX2FyICsgX2JyXG4gICAgcTEgPSBfeFxuICAgIGVwdHIgKz0gMVxuICAgIGlmKGVwdHIgPCBuZSkge1xuICAgICAgZWkgPSBlW2VwdHJdXG4gICAgfVxuICB9XG4gIHdoaWxlKGZwdHIgPCBuZikge1xuICAgIGEgPSBmaVxuICAgIGIgPSBxMFxuICAgIHggPSBhICsgYlxuICAgIGJ2ID0geCAtIGFcbiAgICB5ID0gYiAtIGJ2XG4gICAgaWYoeSkge1xuICAgICAgZ1tjb3VudCsrXSA9IHlcbiAgICB9IFxuICAgIF94ID0gcTEgKyB4XG4gICAgX2J2ID0gX3ggLSBxMVxuICAgIF9hdiA9IF94IC0gX2J2XG4gICAgX2JyID0geCAtIF9idlxuICAgIF9hciA9IHExIC0gX2F2XG4gICAgcTAgPSBfYXIgKyBfYnJcbiAgICBxMSA9IF94XG4gICAgZnB0ciArPSAxXG4gICAgaWYoZnB0ciA8IG5mKSB7XG4gICAgICBmaSA9IGZbZnB0cl1cbiAgICB9XG4gIH1cbiAgaWYocTApIHtcbiAgICBnW2NvdW50KytdID0gcTBcbiAgfVxuICBpZihxMSkge1xuICAgIGdbY291bnQrK10gPSBxMVxuICB9XG4gIGlmKCFjb3VudCkge1xuICAgIGdbY291bnQrK10gPSAwLjAgIFxuICB9XG4gIGcubGVuZ3RoID0gY291bnRcbiAgcmV0dXJuIGdcbn0iLCJcInVzZSBzdHJpY3RcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IHR3b1Byb2R1Y3RcblxudmFyIFNQTElUVEVSID0gKyhNYXRoLnBvdygyLCAyNykgKyAxLjApXG5cbmZ1bmN0aW9uIHR3b1Byb2R1Y3QoYSwgYiwgcmVzdWx0KSB7XG4gIHZhciB4ID0gYSAqIGJcblxuICB2YXIgYyA9IFNQTElUVEVSICogYVxuICB2YXIgYWJpZyA9IGMgLSBhXG4gIHZhciBhaGkgPSBjIC0gYWJpZ1xuICB2YXIgYWxvID0gYSAtIGFoaVxuXG4gIHZhciBkID0gU1BMSVRURVIgKiBiXG4gIHZhciBiYmlnID0gZCAtIGJcbiAgdmFyIGJoaSA9IGQgLSBiYmlnXG4gIHZhciBibG8gPSBiIC0gYmhpXG5cbiAgdmFyIGVycjEgPSB4IC0gKGFoaSAqIGJoaSlcbiAgdmFyIGVycjIgPSBlcnIxIC0gKGFsbyAqIGJoaSlcbiAgdmFyIGVycjMgPSBlcnIyIC0gKGFoaSAqIGJsbylcblxuICB2YXIgeSA9IGFsbyAqIGJsbyAtIGVycjNcblxuICBpZihyZXN1bHQpIHtcbiAgICByZXN1bHRbMF0gPSB5XG4gICAgcmVzdWx0WzFdID0geFxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIHJldHVybiBbIHksIHggXVxufSIsIlwidXNlIHN0cmljdFwiXG5cbm1vZHVsZS5leHBvcnRzID0gZmFzdFR3b1N1bVxuXG5mdW5jdGlvbiBmYXN0VHdvU3VtKGEsIGIsIHJlc3VsdCkge1xuXHR2YXIgeCA9IGEgKyBiXG5cdHZhciBidiA9IHggLSBhXG5cdHZhciBhdiA9IHggLSBidlxuXHR2YXIgYnIgPSBiIC0gYnZcblx0dmFyIGFyID0gYSAtIGF2XG5cdGlmKHJlc3VsdCkge1xuXHRcdHJlc3VsdFswXSA9IGFyICsgYnJcblx0XHRyZXN1bHRbMV0gPSB4XG5cdFx0cmV0dXJuIHJlc3VsdFxuXHR9XG5cdHJldHVybiBbYXIrYnIsIHhdXG59Il19
