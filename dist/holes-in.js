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

},{"cdt2d":9}],2:[function(require,module,exports){
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
}

};
module.exports= drawHelper;

},{"./path-helper.js":7}],3:[function(require,module,exports){
"use-strict";


var exportHelper = {


    meshesToObj(meshes){
        let res="";
        if(meshes.inMesh)
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
        }
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

const exportHelper = require("./export-helper.js");


var extruder = {

    /**
     * getGeometry([{ X: 0, Y: 3 }, ...], [{
     *    path: [{ X, Y }, { X, Y }, ...],
     *    depth: 50
     * }, {
     *    ...
     * }], {
     *    bottom: true,
     *    sides: false,
     *    ...
     * });
     */
    getGeometry: function(outerShape, holes) {
        //get the topology 2D paths by depth
        let options = {
            frontMesh: true,
            backMesh: true,
            outMesh: true,
            inMesh: true
        };

        let pathsByDepth = extruder.getPathsByDepth(holes, outerShape);
        let topoPathsByDepth = extruder.getTopoPathByDepth(pathsByDepth, outerShape, options);

        let res = {};
        if (options.frontMesh) {
            res.frontMesh = extruder.getInnerHorizontalGeom(topoPathsByDepth, {
                frontMesh: true
            });
        }
        if (options.backMesh) {
            res.backMesh = extruder.getInnerHorizontalGeom(topoPathsByDepth, {
                backMesh: true
            });
        }
        if (options.inMesh) {
            let inMeshHor = extruder.getInnerHorizontalGeom(topoPathsByDepth, {
                inMesh: true
            });
            let offset = 0;
            if (inMeshHor) {
                offset = inMeshHor.offset;
            }
            let inMeshVert = extruder.getInnerVerticalGeom(pathsByDepth, offset);
            res.inMesh = geomHelper.mergeMeshes([inMeshHor, inMeshVert], false);
        }
        if (options.outMesh) {
            res.outMesh = geomHelper.getOuterVerticalGeom(outerShape, outerShape.depth);
        }
        let a = exportHelper.meshesToObj(res);

        return res;
    },



    getInnerVerticalGeom: function(pathsByDepth, offset = 0) {
        //ensure the paths are all in the same direction
        Object.keys(pathsByDepth).forEach(i => {
            pathHelper.setDirectionPaths(pathsByDepth[i].paths, 1);
        });

        let geom = [];
        for (let indexDepth = pathsByDepth.length - 1; indexDepth > 0; indexDepth--) {
            let pathsAtDepth = pathsByDepth[indexDepth].paths;
            //for each point at each path at each depth we look for the corresponding point into the upper paths:
            for (let path of pathsAtDepth) {
                for (let indexPtDwn in path) {
                    let ptDwn = path[indexPtDwn];
                    let nPtDwn = path[((+indexPtDwn) + 1) % path.length];
                    let currgeom = geomHelper.getOneInnerVerticalGeom(ptDwn, nPtDwn, +indexDepth, pathsByDepth, +offset);
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
        for (let i in topoPathsByDepth) {
            let totaltopo = topoPathsByDepth[i].pos.concat(topoPathsByDepth[i].neg);
            trianglesByDepth.push(cdt2dHelper.computeTriangulation(totaltopo));
            trianglesByDepth[i].depth = topoPathsByDepth[i].depth;
        }
        // get points, normal and faces from it:
        return geomHelper.getInnerHorizontalGeom(trianglesByDepth, options, +offset);
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

        let pos1 = [];
        if (options.frontMesh) {
            pos1 = [outerShape.path];
        }
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

        //sets all depths deeper than outerDepth  or equals to 0 to outerDepth:
        holes.map(function(elt) {
            (elt.depth > outerPath.depth || elt.depth === 0) ? elt.depth = outerPath.depth: elt.depth = elt.depth
        });

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

},{"./cdt2d-helper.js":1,"./export-helper.js":3,"./geom-helper.js":5,"./path-helper.js":7,"clipper-lib":14}],5:[function(require,module,exports){
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
        return geom1;
    },

    getOuterVerticalGeom: function(pathOuter, depth, offset = 0) {

        let res = []

        for (let i = 0; i < pathOuter.length; i++) {
            let pt1 = pathOuter[i];
            let pt2 = pathOuter[(i + 1) % pathOuter.length];
            let geom = geomHelper.getPtsNormsIndx2d(pt1, pt2, 0, depth, +offset, true);
            offset = geom.offset;
            res.push(geom);
        }
        return geomHelper.mergeMeshes(res, false);
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
     * Returns the depths at which they are two edges with the same 2D coords.
     * If it does not exists such a edge, returns the current depth and the depth above
     */
    getMatchDepths: function(ptDwn, nPtDwn, indexDepth, pathsByDepth) {
        //for each depth deeper than pathUp,we look for a corresponding point:
        let depthUp = pathsByDepth[indexDepth - 1].depth;
        let depthDwn = pathsByDepth[indexDepth].depth;
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
            }
        }
        return {
            depthUp: depthUp,
            depthDwn: depthDwn
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
        return geomHelper.mergeMeshes(res, false);
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
        if (pathsClip)
            {cpr.AddPaths(pathsClip, clipperLib.PolyType.ptClip, true);}
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

    fitPathsIntoPath:function(outerPath, toFitPaths ){

        let paths= toFitPaths.push(outerPath);
        let union= pathHelper.getUnionOfPaths(paths);
        let inter= pathHelper.getInterOfPaths(paths);
        let xor= pathHelper.getXorOfPaths(union,inter);

        return pathHelper.getDiffOfPaths(paths, xor);


    },

    /**
     *  checks if two points have the same coordinates
     *
     */
    isEqual: function(point1, point2) {
        return (point1.X === point2.X) && (point1.Y === point2.Y);
    },

};
module.exports = pathHelper;

},{"clipper-lib":14}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{"./lib/delaunay":10,"./lib/filter":11,"./lib/monotone":12,"./lib/triangulation":13}],10:[function(require,module,exports){
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

},{"binary-search-bounds":8,"robust-in-sphere":15}],11:[function(require,module,exports){
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

},{"binary-search-bounds":8}],12:[function(require,module,exports){
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

},{"binary-search-bounds":8,"robust-orientation":16}],13:[function(require,module,exports){
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

},{"binary-search-bounds":8}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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
},{"robust-scale":17,"robust-subtract":18,"robust-sum":19,"two-product":20}],16:[function(require,module,exports){
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
},{"robust-scale":17,"robust-subtract":18,"robust-sum":19,"two-product":20}],17:[function(require,module,exports){
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
},{"two-product":20,"two-sum":21}],18:[function(require,module,exports){
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
},{}],19:[function(require,module,exports){
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
},{}],20:[function(require,module,exports){
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
},{}],21:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvY2R0MmQtaGVscGVyLmpzIiwibGliL2RyYXctaGVscGVyLmpzIiwibGliL2V4cG9ydC1oZWxwZXIuanMiLCJsaWIvZXh0cnVkZXIuanMiLCJsaWIvZ2VvbS1oZWxwZXIuanMiLCJsaWIvaW5kZXguanMiLCJsaWIvcGF0aC1oZWxwZXIuanMiLCJub2RlX21vZHVsZXMvYmluYXJ5LXNlYXJjaC1ib3VuZHMvc2VhcmNoLWJvdW5kcy5qcyIsIm5vZGVfbW9kdWxlcy9jZHQyZC9jZHQyZC5qcyIsIm5vZGVfbW9kdWxlcy9jZHQyZC9saWIvZGVsYXVuYXkuanMiLCJub2RlX21vZHVsZXMvY2R0MmQvbGliL2ZpbHRlci5qcyIsIm5vZGVfbW9kdWxlcy9jZHQyZC9saWIvbW9ub3RvbmUuanMiLCJub2RlX21vZHVsZXMvY2R0MmQvbGliL3RyaWFuZ3VsYXRpb24uanMiLCJub2RlX21vZHVsZXMvY2xpcHBlci1saWIvY2xpcHBlci5qcyIsIm5vZGVfbW9kdWxlcy9yb2J1c3QtaW4tc3BoZXJlL2luLXNwaGVyZS5qcyIsIm5vZGVfbW9kdWxlcy9yb2J1c3Qtb3JpZW50YXRpb24vb3JpZW50YXRpb24uanMiLCJub2RlX21vZHVsZXMvcm9idXN0LXNjYWxlL3JvYnVzdC1zY2FsZS5qcyIsIm5vZGVfbW9kdWxlcy9yb2J1c3Qtc3VidHJhY3Qvcm9idXN0LWRpZmYuanMiLCJub2RlX21vZHVsZXMvcm9idXN0LXN1bS9yb2J1c3Qtc3VtLmpzIiwibm9kZV9tb2R1bGVzL3R3by1wcm9kdWN0L3R3by1wcm9kdWN0LmpzIiwibm9kZV9tb2R1bGVzL3R3by1zdW0vdHdvLXN1bS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdHdOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgY2R0MmQgPSByZXF1aXJlKCdjZHQyZCcpO1xuXG52YXIgY2R0MmRIZWxwZXIgPSB7XG5cblxuICAgIGNvbXB1dGVUcmlhbmd1bGF0aW9uOiBmdW5jdGlvbihwb2ludHMsIG9wdGlvbnMpIHtcbiAgICAgICAgLy8gbGV0IHBvaW50cz0geG9yLmNvbmNhdChpbnRlcnNlY3Rpb24pLmNvbmNhdChwYXRoT3V0ZXIpO1xuICAgICAgICBsZXQgY2R0UG9pbnRzID0gY2R0MmRIZWxwZXIuY2xpcHBlclRvY2R0MmQocG9pbnRzKTtcbiAgICAgICAgbGV0IGNkdEVkZ2VzID0gY2R0MmRIZWxwZXIucGF0aHNUb0VkZ2VzKHBvaW50cyk7XG4gICAgICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBleHRlcmlvcjogZmFsc2UsXG4gICAgICAgICAgICAgICAgaW50ZXJpb3I6IHRydWVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRyaWFuZ2xlcyA9IGNkdDJkKGNkdFBvaW50cywgY2R0RWRnZXMsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcG9pbnRzOiBjZHRQb2ludHMsXG4gICAgICAgICAgICB0cmlhbmdsZXM6IHRyaWFuZ2xlc1xuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvKipcblxuXG4gICAgKi9cbiAgICBjb25jYXRUcmlhbmd1bGF0aW9uczogZnVuY3Rpb24odHJpYW5ndWxhdGlvbnMpIHtcblxuICAgICAgICAvL21lcmdlIHRoZSBwb2ludHMgYXJyYXlzIGFuZCBhZGQgb2Zmc2V0IHRvIGZhY2VzOlxuICAgICAgICBsZXQgcG9pbnRzID0gW107XG4gICAgICAgIGxldCB0cmlhbmdsZXMgPSBbXTtcbiAgICAgICAgbGV0IG9mZnNldCA9IDA7XG4gICAgICAgIGlmICh0cmlhbmd1bGF0aW9ucy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRyaWFuZ3VsYXRpb25zO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgaW4gdHJpYW5ndWxhdGlvbnMpIHtcbiAgICAgICAgICAgIGlmICghdHJpYW5ndWxhdGlvbnNbaV0ucG9pbnRzIHx8ICF0cmlhbmd1bGF0aW9uc1tpXS50cmlhbmdsZXMpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvaW50cy5wdXNoKC4uLnRyaWFuZ3VsYXRpb25zW2ldLnBvaW50cyk7XG4gICAgICAgICAgICBjZHQyZEhlbHBlci5wdXNoVHJpYW5nbGVzKHRyaWFuZ3VsYXRpb25zW2ldLnRyaWFuZ2xlcywgdHJpYW5nbGVzLCBvZmZzZXQpO1xuICAgICAgICAgICAgb2Zmc2V0ICs9IHRyaWFuZ3VsYXRpb25zW2ldLnBvaW50cy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBvaW50czogcG9pbnRzLFxuICAgICAgICAgICAgdHJpYW5nbGVzOiB0cmlhbmdsZXNcbiAgICAgICAgfTtcblxuICAgIH0sXG5cbiAgICBwdXNoVHJpYW5nbGVzOiBmdW5jdGlvbihzcmMsIGRzdCwgb2Zmc2V0KSB7XG4gICAgICAgIGRzdC5wdXNoKC4uLnNyYy5tYXAodmFsID0+IHZhbCArIG9mZnNldCkpO1xuICAgIH0sXG5cbiAgICBwYXRoc1RvRWRnZXM6IGZ1bmN0aW9uKHBhdGhzKSB7XG4gICAgICAgIGxldCByZXMgPSBbXTtcbiAgICAgICAgbGV0IG9mZnNldCA9IDA7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHJlcyA9IHJlcy5jb25jYXQoY2R0MmRIZWxwZXIucGF0aFRvRWRnZXMocGF0aHNbaV0sIG9mZnNldCkpO1xuICAgICAgICAgICAgb2Zmc2V0ICs9IHBhdGhzW2ldLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cbiAgICBwYXRoVG9FZGdlczogZnVuY3Rpb24ocGF0aCwgb2Zmc2V0KSB7XG4gICAgICAgIGxldCByZXMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgcmVzLnB1c2goW29mZnNldCArIGksIG9mZnNldCArIGkgKyAxXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzLnB1c2goW29mZnNldCArIHBhdGgubGVuZ3RoIC0gMSwgb2Zmc2V0XSk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSxcblxuICAgIGNsaXBwZXJUb2NkdDJkOiBmdW5jdGlvbihwb2ludHMpIHtcbiAgICAgICAgbGV0IHJlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpIGluIHBvaW50cykge1xuICAgICAgICAgICAgZm9yIChsZXQgaiBpbiBwb2ludHNbaV0pIHtcbiAgICAgICAgICAgICAgICByZXMucHVzaChjZHQyZEhlbHBlci5jbGlwcGVyUG9pbnRUb2NkdDJkUG9pbnQocG9pbnRzW2ldW2pdKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgY2xpcHBlclBvaW50VG9jZHQyZFBvaW50OiBmdW5jdGlvbihwb2ludCkge1xuICAgICAgICByZXR1cm4gW3BvaW50LlgsIHBvaW50LlldO1xuICAgIH0sXG5cbiAgICBkcmF3VHJpYW5nbGVzOiBmdW5jdGlvbihjdHgsIHBvaW50c0FuZFRyaWFuZ2xlcywgdHJhbnNsYXRpb24pIHtcbiAgICAgICAgZm9yIChsZXQgaSBpbiBwb2ludHNBbmRUcmlhbmdsZXMudHJpYW5nbGVzKSB7XG4gICAgICAgICAgICBjZHQyZEhlbHBlci5kcmF3VHJpYW5nbGUoY3R4LCBwb2ludHNBbmRUcmlhbmdsZXMucG9pbnRzLCBwb2ludHNBbmRUcmlhbmdsZXMudHJpYW5nbGVzW2ldLCB0cmFuc2xhdGlvbik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZHJhd1RyaWFuZ2xlOiBmdW5jdGlvbihjdHgsIHBvaW50cywgdHJpYW5nbGUsIHRyYW5zbGF0aW9uKSB7XG4gICAgICAgIGlmICghdHJhbnNsYXRpb24pIHtcbiAgICAgICAgICAgIHRyYW5zbGF0aW9uID0ge1xuICAgICAgICAgICAgICAgIFg6IDAsXG4gICAgICAgICAgICAgICAgWTogMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIGN0eC5tb3ZlVG8ocG9pbnRzW3RyaWFuZ2xlWzBdXVswXSArIHRyYW5zbGF0aW9uLlgsIHBvaW50c1t0cmlhbmdsZVswXV1bMV0gKyB0cmFuc2xhdGlvbi5ZKTtcbiAgICAgICAgY3R4LmxpbmVUbyhwb2ludHNbdHJpYW5nbGVbMV1dWzBdICsgdHJhbnNsYXRpb24uWCwgcG9pbnRzW3RyaWFuZ2xlWzFdXVsxXSArIHRyYW5zbGF0aW9uLlkpO1xuICAgICAgICBjdHgubGluZVRvKHBvaW50c1t0cmlhbmdsZVsyXV1bMF0gKyB0cmFuc2xhdGlvbi5YLCBwb2ludHNbdHJpYW5nbGVbMl1dWzFdICsgdHJhbnNsYXRpb24uWSk7XG4gICAgICAgIGN0eC5saW5lVG8ocG9pbnRzW3RyaWFuZ2xlWzBdXVswXSArIHRyYW5zbGF0aW9uLlgsIHBvaW50c1t0cmlhbmdsZVswXV1bMV0gKyB0cmFuc2xhdGlvbi5ZKTtcbiAgICAgICAgY3R4LnN0cm9rZSgpO1xuXG4gICAgfVxuXG59O1xubW9kdWxlLmV4cG9ydHMgPSBjZHQyZEhlbHBlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgcGF0aEhlbHBlcj0gcmVxdWlyZShcIi4vcGF0aC1oZWxwZXIuanNcIik7XG5cbnZhciBkcmF3SGVscGVyPXtcblxuZ2V0VG9wVHJpYW5nbGVzQnlEZXB0aDogZnVuY3Rpb24odG9wb1BhdGhzQnlEZXB0aCwgb2Zmc2V0ID0gMCkge1xuICAgIGxldCBnZW9tQnlEZXB0aCA9IFtdO1xuICAgIGZvciAobGV0IGkgaW4gdG9wb1BhdGhzQnlEZXB0aCkge1xuICAgICAgICBsZXQgdG90YWx0b3BvID0gdG9wb1BhdGhzQnlEZXB0aFtpXS5wb3MuY29uY2F0KHRvcG9QYXRoc0J5RGVwdGhbaV0ubmVnKTtcbiAgICAgICAgZ2VvbUJ5RGVwdGgucHVzaChjZHQyZEhlbHBlci5jb21wdXRlVHJpYW5ndWxhdGlvbih0b3RhbHRvcG8pKTtcbiAgICAgICAgZ2VvbUJ5RGVwdGhbaV0uZGVwdGggPSB0b3BvUGF0aHNCeURlcHRoW2ldLmRlcHRoO1xuICAgIH1cbiAgICByZXR1cm4gZ2VvbUJ5RGVwdGg7XG59LFxuXG5kcmF3UGF0aHM6IGZ1bmN0aW9uKGN0eCwgcGF0aHMsIHBvc2l0aW9uLCBmaWxsQ29sb3JzLCBzdHJva2VDb2xvcnMsIGZpbGxNb2Rlcykge1xuICAgIGlmICghZmlsbE1vZGVzKSBmaWxsTW9kZXMgPSBbXTtcbiAgICBmb3IgKGxldCBpIGluIHBhdGhzKSB7XG4gICAgICAgIGRyYXdIZWxwZXIuZHJhd1BhdGgoY3R4LCBwYXRoc1tpXSwgcG9zaXRpb24sIGZpbGxDb2xvcnNbaV0sIHN0cm9rZUNvbG9yc1tpXSwgZmlsbE1vZGVzW2ldKTtcbiAgICB9XG59LFxuXG5kcmF3UGF0aDogZnVuY3Rpb24oY3R4LCBwYXRoVG9EcmF3LCBwb3NpdGlvbiwgZmlsbENvbG9yLCBzdHJva2VDb2xvciwgZmlsbE1vZGUpIHtcbiAgICBpZiAoIXBvc2l0aW9uKSBwb3NpdGlvbiA9IHtcbiAgICAgICAgWDogMCxcbiAgICAgICAgWTogMFxuICAgIH07XG4gICAgbGV0IHBhdGggPSBbXTtcbiAgICBpZiAocGF0aFRvRHJhdy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICBmb3IgKGxldCBpIGluIHBhdGhUb0RyYXcpIHtcbiAgICAgICAgcGF0aC5wdXNoKHtcbiAgICAgICAgICAgIFg6IHBhdGhUb0RyYXdbaV0uWCArIHBvc2l0aW9uLlgsXG4gICAgICAgICAgICBZOiBwYXRoVG9EcmF3W2ldLlkgKyBwb3NpdGlvbi5ZXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGN0eC5saW5lV2lkdGggPSAyO1xuICAgIGlmICghZmlsbENvbG9yKSB7XG4gICAgICAgIGZpbGxDb2xvciA9ICdibGFjayc7XG4gICAgfVxuICAgIGN0eC5maWxsU3R5bGUgPSBmaWxsQ29sb3I7XG4gICAgaWYgKCFzdHJva2VDb2xvcikge1xuICAgICAgICBzdHJva2VDb2xvciA9IFwiYmxhY2tcIjtcbiAgICB9XG4gICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlQ29sb3I7XG4gICAgaWYgKCFmaWxsTW9kZSkge1xuICAgICAgICBmaWxsTW9kZSA9IFwibm9uemVyb1wiO1xuICAgIH1cbiAgICBjdHgubW96RmlsbFJ1bGUgPSBmaWxsTW9kZTtcblxuICAgIC8vRHJhd3MgdGhlIGlubmVyIG9mIHRoZSBwYXRoXG4gICAgdmFyIHBhdGhGaWxsID0gbmV3IFBhdGgyRCgpO1xuICAgIHBhdGhGaWxsLm1vdmVUbyhwYXRoWzBdLlgsIHBhdGhbMF0uWSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHBhdGhGaWxsLmxpbmVUbyhwYXRoW2ldLlgsIHBhdGhbaV0uWSk7XG4gICAgfVxuICAgIHBhdGhGaWxsLmxpbmVUbyhwYXRoWzBdLlgsIHBhdGhbMF0uWSk7XG4gICAgY3R4LmZpbGwocGF0aEZpbGwsIGZpbGxNb2RlKTtcbiAgICBjdHguY2xvc2VQYXRoKCk7XG4gICAgLy9EcmF3cyB0aGUgYXJyb3dzXG4gICAgdmFyIHBhdGhBcnJvdyA9IG5ldyBQYXRoMkQoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGgubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgIGRyYXdIZWxwZXIuZHJhd0Fycm93KGN0eCwgcGF0aFtpXSwgcGF0aFtpICsgMV0pO1xuICAgIH1cbiAgICBkcmF3SGVscGVyLmRyYXdBcnJvdyhjdHgsIHBhdGhbcGF0aC5sZW5ndGggLSAxXSwgcGF0aFswXSk7XG5cbiAgICAvL0RyYXdzIHRoZSBkb3RzOlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICBkcmF3SGVscGVyLmRyYXdEb3QoY3R4LCBwYXRoW2ldKTtcbiAgICB9XG59LFxuZHJhd0Fycm93KGN0eCwgYmVnaW4sIGVuZCkge1xuXG4gICAgY3R4LnNhdmUoKTtcbiAgICBjdHgubW92ZVRvKGJlZ2luLlgsIGJlZ2luLlkpO1xuICAgIGN0eC5saW5lVG8oZW5kLlgsIGVuZC5ZKTtcbiAgICBjdHguc3Ryb2tlKCk7XG5cbiAgICBsZXQgdmVjdCA9IHtcbiAgICAgICAgWDogZW5kLlggLSBiZWdpbi5YLFxuICAgICAgICBZOiBlbmQuWSAtIGJlZ2luLllcbiAgICB9O1xuICAgIGxldCBub3JtID0gTWF0aC5zcXJ0KHZlY3QuWCAqIHZlY3QuWCArIHZlY3QuWSAqIHZlY3QuWSk7XG4gICAgdmVjdCA9IHtcbiAgICAgICAgWDogdmVjdC5YIC8gbm9ybSxcbiAgICAgICAgWTogdmVjdC5ZIC8gbm9ybVxuICAgIH07XG5cbiAgICBsZXQgYW5nbGUgPSBNYXRoLlBJIC8gMiArIE1hdGguYXRhbjIodmVjdC5ZLCB2ZWN0LlgpO1xuXG4gICAgY3R4LnRyYW5zbGF0ZShiZWdpbi5YICsgdmVjdC5YICogbm9ybSAqIDAuNzUsIGJlZ2luLlkgKyB2ZWN0LlkgKiBub3JtICogMC43NSk7XG4gICAgY3R4LnJvdGF0ZShhbmdsZSk7XG5cbiAgICBsZXQgc2l6ZUEgPSA1O1xuICAgIGxldCBicmFuY2gxID0ge1xuICAgICAgICBYOiBzaXplQSxcbiAgICAgICAgWTogc2l6ZUFcbiAgICB9O1xuICAgIGxldCBicmFuY2gyID0ge1xuICAgICAgICBYOiAtc2l6ZUEsXG4gICAgICAgIFk6IHNpemVBXG4gICAgfTtcblxuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHgubW92ZVRvKGJyYW5jaDEuWCwgYnJhbmNoMS5ZKTtcbiAgICBjdHgubGluZVRvKDAsIDApO1xuICAgIGN0eC5saW5lVG8oYnJhbmNoMi5YLCBicmFuY2gyLlkpO1xuICAgIGN0eC5zdHJva2UoKTtcblxuICAgIGN0eC5yZXN0b3JlKCk7XG59LFxuXG5kcmF3RG90OiBmdW5jdGlvbihjdHgsIGRvdCkge1xuXG4gICAgY3R4LmZpbGxTdHlsZSA9IFwicmVkXCI7XG4gICAgY3R4LmZpbGxSZWN0KGRvdC5YLCBkb3QuWSwgNCwgNCk7XG59XG5cbn07XG5tb2R1bGUuZXhwb3J0cz0gZHJhd0hlbHBlcjtcbiIsIlwidXNlLXN0cmljdFwiO1xuXG5cbnZhciBleHBvcnRIZWxwZXIgPSB7XG5cblxuICAgIG1lc2hlc1RvT2JqKG1lc2hlcyl7XG4gICAgICAgIGxldCByZXM9XCJcIjtcbiAgICAgICAgaWYobWVzaGVzLmluTWVzaClcbiAgICAgICAge1xuICAgICAgICAgICAgcmVzKz1leHBvcnRIZWxwZXIubWVzaFRvT2JqKG1lc2hlcy5pbk1lc2gsIFwiaW5NZXNoXCIpO1xuICAgICAgICAgICAgcmVzICs9IFwiXFxuXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYobWVzaGVzLm91dE1lc2gpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJlcys9ZXhwb3J0SGVscGVyLm1lc2hUb09iaihtZXNoZXMub3V0TWVzaCwgXCJvdXRNZXNoXCIpO1xuICAgICAgICAgICAgcmVzICs9IFwiXFxuXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYobWVzaGVzLmZyb250TWVzaClcbiAgICAgICAge1xuICAgICAgICAgICAgcmVzKz1leHBvcnRIZWxwZXIubWVzaFRvT2JqKG1lc2hlcy5mcm9udE1lc2gsIFwiZnJvbnRNZXNoXCIpO1xuICAgICAgICAgICAgcmVzICs9IFwiXFxuXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYobWVzaGVzLmJhY2tNZXNoKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXMrPWV4cG9ydEhlbHBlci5tZXNoVG9PYmoobWVzaGVzLmJhY2tNZXNoLCBcImJhY2tNZXNoXCIpO1xuICAgICAgICAgICAgcmVzICs9IFwiXFxuXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgbWVzaFRvT2JqOiBmdW5jdGlvbihtZXNoLCBtZXNoTmFtZSkge1xuICAgICAgICBsZXQgcmVzID0gXCJvIFwiICsgbWVzaE5hbWUgKyBcIlxcblxcblwiO1xuICAgICAgICByZXMgKz0gZXhwb3J0SGVscGVyLnZlcnRpY2VzVG9PYmoobWVzaC5wb2ludHMpO1xuICAgICAgICByZXMgKz0gXCJcXG5cIjtcbiAgICAgICAgcmVzICs9IGV4cG9ydEhlbHBlci5ub3JtYWxzVG9PYmoobWVzaC5ub3JtYWxzKTtcbiAgICAgICAgLy8gICAgcmVzKz1cIlxcblwiO1xuICAgICAgICAvLyAgICByZXMrPSBleHBvcnRIZWxwZXIudGV4dHVyZXNUb09iaihtZXNoLnV2cyk7XG5cbiAgICAgICAgcmVzICs9IFwiXFxuXCI7XG4gICAgICAgIHJlcyArPSBleHBvcnRIZWxwZXIuZmFjZXNUb09iaihtZXNoLmZhY2VzKTtcbiAgICAgICAgcmV0dXJuIHJlcztcblxuICAgIH0sXG4gICAgdmVydGljZXNUb09iajogZnVuY3Rpb24odmVydGljZXMpIHtcblxuICAgICAgICByZXR1cm4gZXhwb3J0SGVscGVyLnN0ZXBUaHJlZUFycmF5VG9PYmoodmVydGljZXMsIFwidlwiKTtcbiAgICB9LFxuXG4gICAgdGV4dHVyZXNUb09iajogZnVuY3Rpb24odGV4dHVyZXMpIHtcbiAgICAgICAgcmV0dXJuIGV4cG9ydEhlbHBlci5zdGVwVGhyZWVBcnJheVRvT2JqKHRleHR1cmVzLCBcInZ0XCIpO1xuICAgIH0sXG5cbiAgICBub3JtYWxzVG9PYmo6IGZ1bmN0aW9uKG5vcm1hbHMpIHtcbiAgICAgICAgcmV0dXJuIGV4cG9ydEhlbHBlci5zdGVwVGhyZWVBcnJheVRvT2JqKG5vcm1hbHMsIFwidnRcIik7XG4gICAgfSxcblxuICAgIGZhY2VzVG9PYmo6IGZ1bmN0aW9uKGZhY2VzKSB7XG4gICAgICAgIGxldCByZXMgPSBcIlwiO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZhY2VzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgICAgICByZXMgKz0gXCJmIFwiICsgZXhwb3J0SGVscGVyLmZhY2VFbGVtZW50KGZhY2VzW2ldKSArIFwiIFwiICtcbiAgICAgICAgICAgICAgICBleHBvcnRIZWxwZXIuZmFjZUVsZW1lbnQoZmFjZXNbaSArIDFdKSArIFwiIFwiICtcbiAgICAgICAgICAgICAgICBleHBvcnRIZWxwZXIuZmFjZUVsZW1lbnQoZmFjZXNbaSArIDJdKSArIFwiXFxuXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuICAgIGZhY2VFbGVtZW50OiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICByZXR1cm4gXCJ2XCIgKyBpbmRleCArIFwiL3Z0XCIgKyBpbmRleCArIFwiL3ZuXCIgKyBpbmRleDtcbiAgICB9LFxuXG5cbiAgICBzdGVwVGhyZWVBcnJheVRvT2JqOiBmdW5jdGlvbihhcnJheSwgcHJlZml4KSB7XG4gICAgICAgIGxldCByZXMgPSBcIlwiO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgICAgICByZXMgKz0gcHJlZml4ICsgXCIgXCIgKyBhcnJheVtpXSArIFwiIFwiICsgYXJyYXlbaSArIDFdICsgXCIgXCIgKyBhcnJheVtpICsgMl0gKyBcIlxcblwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0SGVscGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmNvbnN0IGNsaXBwZXJMaWIgPSByZXF1aXJlKFwiY2xpcHBlci1saWJcIik7XG5jb25zdCBwYXRoSGVscGVyID0gcmVxdWlyZShcIi4vcGF0aC1oZWxwZXIuanNcIik7XG5jb25zdCBnZW9tSGVscGVyID0gcmVxdWlyZShcIi4vZ2VvbS1oZWxwZXIuanNcIik7XG5jb25zdCBjZHQyZEhlbHBlciA9IHJlcXVpcmUoXCIuL2NkdDJkLWhlbHBlci5qc1wiKTtcblxuY29uc3QgZXhwb3J0SGVscGVyID0gcmVxdWlyZShcIi4vZXhwb3J0LWhlbHBlci5qc1wiKTtcblxuXG52YXIgZXh0cnVkZXIgPSB7XG5cbiAgICAvKipcbiAgICAgKiBnZXRHZW9tZXRyeShbeyBYOiAwLCBZOiAzIH0sIC4uLl0sIFt7XG4gICAgICogICAgcGF0aDogW3sgWCwgWSB9LCB7IFgsIFkgfSwgLi4uXSxcbiAgICAgKiAgICBkZXB0aDogNTBcbiAgICAgKiB9LCB7XG4gICAgICogICAgLi4uXG4gICAgICogfV0sIHtcbiAgICAgKiAgICBib3R0b206IHRydWUsXG4gICAgICogICAgc2lkZXM6IGZhbHNlLFxuICAgICAqICAgIC4uLlxuICAgICAqIH0pO1xuICAgICAqL1xuICAgIGdldEdlb21ldHJ5OiBmdW5jdGlvbihvdXRlclNoYXBlLCBob2xlcykge1xuICAgICAgICAvL2dldCB0aGUgdG9wb2xvZ3kgMkQgcGF0aHMgYnkgZGVwdGhcbiAgICAgICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBmcm9udE1lc2g6IHRydWUsXG4gICAgICAgICAgICBiYWNrTWVzaDogdHJ1ZSxcbiAgICAgICAgICAgIG91dE1lc2g6IHRydWUsXG4gICAgICAgICAgICBpbk1lc2g6IHRydWVcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgcGF0aHNCeURlcHRoID0gZXh0cnVkZXIuZ2V0UGF0aHNCeURlcHRoKGhvbGVzLCBvdXRlclNoYXBlKTtcbiAgICAgICAgbGV0IHRvcG9QYXRoc0J5RGVwdGggPSBleHRydWRlci5nZXRUb3BvUGF0aEJ5RGVwdGgocGF0aHNCeURlcHRoLCBvdXRlclNoYXBlLCBvcHRpb25zKTtcblxuICAgICAgICBsZXQgcmVzID0ge307XG4gICAgICAgIGlmIChvcHRpb25zLmZyb250TWVzaCkge1xuICAgICAgICAgICAgcmVzLmZyb250TWVzaCA9IGV4dHJ1ZGVyLmdldElubmVySG9yaXpvbnRhbEdlb20odG9wb1BhdGhzQnlEZXB0aCwge1xuICAgICAgICAgICAgICAgIGZyb250TWVzaDogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuYmFja01lc2gpIHtcbiAgICAgICAgICAgIHJlcy5iYWNrTWVzaCA9IGV4dHJ1ZGVyLmdldElubmVySG9yaXpvbnRhbEdlb20odG9wb1BhdGhzQnlEZXB0aCwge1xuICAgICAgICAgICAgICAgIGJhY2tNZXNoOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5pbk1lc2gpIHtcbiAgICAgICAgICAgIGxldCBpbk1lc2hIb3IgPSBleHRydWRlci5nZXRJbm5lckhvcml6b250YWxHZW9tKHRvcG9QYXRoc0J5RGVwdGgsIHtcbiAgICAgICAgICAgICAgICBpbk1lc2g6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbGV0IG9mZnNldCA9IDA7XG4gICAgICAgICAgICBpZiAoaW5NZXNoSG9yKSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gaW5NZXNoSG9yLm9mZnNldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBpbk1lc2hWZXJ0ID0gZXh0cnVkZXIuZ2V0SW5uZXJWZXJ0aWNhbEdlb20ocGF0aHNCeURlcHRoLCBvZmZzZXQpO1xuICAgICAgICAgICAgcmVzLmluTWVzaCA9IGdlb21IZWxwZXIubWVyZ2VNZXNoZXMoW2luTWVzaEhvciwgaW5NZXNoVmVydF0sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5vdXRNZXNoKSB7XG4gICAgICAgICAgICByZXMub3V0TWVzaCA9IGdlb21IZWxwZXIuZ2V0T3V0ZXJWZXJ0aWNhbEdlb20ob3V0ZXJTaGFwZSwgb3V0ZXJTaGFwZS5kZXB0aCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGEgPSBleHBvcnRIZWxwZXIubWVzaGVzVG9PYmoocmVzKTtcblxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cblxuXG4gICAgZ2V0SW5uZXJWZXJ0aWNhbEdlb206IGZ1bmN0aW9uKHBhdGhzQnlEZXB0aCwgb2Zmc2V0ID0gMCkge1xuICAgICAgICAvL2Vuc3VyZSB0aGUgcGF0aHMgYXJlIGFsbCBpbiB0aGUgc2FtZSBkaXJlY3Rpb25cbiAgICAgICAgT2JqZWN0LmtleXMocGF0aHNCeURlcHRoKS5mb3JFYWNoKGkgPT4ge1xuICAgICAgICAgICAgcGF0aEhlbHBlci5zZXREaXJlY3Rpb25QYXRocyhwYXRoc0J5RGVwdGhbaV0ucGF0aHMsIDEpO1xuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgZ2VvbSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpbmRleERlcHRoID0gcGF0aHNCeURlcHRoLmxlbmd0aCAtIDE7IGluZGV4RGVwdGggPiAwOyBpbmRleERlcHRoLS0pIHtcbiAgICAgICAgICAgIGxldCBwYXRoc0F0RGVwdGggPSBwYXRoc0J5RGVwdGhbaW5kZXhEZXB0aF0ucGF0aHM7XG4gICAgICAgICAgICAvL2ZvciBlYWNoIHBvaW50IGF0IGVhY2ggcGF0aCBhdCBlYWNoIGRlcHRoIHdlIGxvb2sgZm9yIHRoZSBjb3JyZXNwb25kaW5nIHBvaW50IGludG8gdGhlIHVwcGVyIHBhdGhzOlxuICAgICAgICAgICAgZm9yIChsZXQgcGF0aCBvZiBwYXRoc0F0RGVwdGgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpbmRleFB0RHduIGluIHBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHB0RHduID0gcGF0aFtpbmRleFB0RHduXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5QdER3biA9IHBhdGhbKCgraW5kZXhQdER3bikgKyAxKSAlIHBhdGgubGVuZ3RoXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGN1cnJnZW9tID0gZ2VvbUhlbHBlci5nZXRPbmVJbm5lclZlcnRpY2FsR2VvbShwdER3biwgblB0RHduLCAraW5kZXhEZXB0aCwgcGF0aHNCeURlcHRoLCArb2Zmc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdXJyZ2VvbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZ2VvbS5wdXNoKGN1cnJnZW9tKTtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gY3Vycmdlb20ub2Zmc2V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ2VvbUhlbHBlci5tZXJnZU1lc2hlcyhnZW9tLCBmYWxzZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGdlb21ldHJ5IG9mIHRoZSBpbm5lciBob3Jpem9udGFsIGZhY2Vzc1xuICAgICAqL1xuICAgIGdldElubmVySG9yaXpvbnRhbEdlb206IGZ1bmN0aW9uKHRvcG9QYXRoc0J5RGVwdGgsIG9wdGlvbnMsIG9mZnNldCA9IDApIHtcbiAgICAgICAgLy9nZXRzIGFsbCB0aGUgdHJpYW5nbGVzIGJ5IGRlcHRoOlxuICAgICAgICBsZXQgdHJpYW5nbGVzQnlEZXB0aCA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpIGluIHRvcG9QYXRoc0J5RGVwdGgpIHtcbiAgICAgICAgICAgIGxldCB0b3RhbHRvcG8gPSB0b3BvUGF0aHNCeURlcHRoW2ldLnBvcy5jb25jYXQodG9wb1BhdGhzQnlEZXB0aFtpXS5uZWcpO1xuICAgICAgICAgICAgdHJpYW5nbGVzQnlEZXB0aC5wdXNoKGNkdDJkSGVscGVyLmNvbXB1dGVUcmlhbmd1bGF0aW9uKHRvdGFsdG9wbykpO1xuICAgICAgICAgICAgdHJpYW5nbGVzQnlEZXB0aFtpXS5kZXB0aCA9IHRvcG9QYXRoc0J5RGVwdGhbaV0uZGVwdGg7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZ2V0IHBvaW50cywgbm9ybWFsIGFuZCBmYWNlcyBmcm9tIGl0OlxuICAgICAgICByZXR1cm4gZ2VvbUhlbHBlci5nZXRJbm5lckhvcml6b250YWxHZW9tKHRyaWFuZ2xlc0J5RGVwdGgsIG9wdGlvbnMsICtvZmZzZXQpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHBhdGhzIHNvcnRlZCBieSBzZW5zLiBOZWdhdGl2ZXNzIHBhdGhzIGFyZSBob2xlcy5cbiAgICAgKiBQb3NpdGl2ZXMgcGF0aHMgYXJlIHRoZSBlbmQgb2YgaG9sZXMoIHNvbGlkcylcbiAgICAgKiBGb3IgY29udmluaWVuY2UsIGFsbCBwYXRocyBhcmUgc2V0IHRvIHBvc2l0aXZlXG4gICAgICovXG4gICAgZ2V0VG9wb1BhdGhCeURlcHRoOiBmdW5jdGlvbihwYXRoc0J5RGVwdGgsIG91dGVyU2hhcGUsIG9wdGlvbnMpIHtcbiAgICAgICAgLy8gbGV0IHBhdGhzID0gcGF0aHNCeURlcHRoLnBhdGhzO1xuICAgICAgICBsZXQgdG9wb0J5RGVwdGggPSBbXTtcbiAgICAgICAgcGF0aEhlbHBlci5zZXREaXJlY3Rpb25QYXRoKG91dGVyU2hhcGUucGF0aCwgMSk7XG5cbiAgICAgICAgbGV0IHBvczEgPSBbXTtcbiAgICAgICAgaWYgKG9wdGlvbnMuZnJvbnRNZXNoKSB7XG4gICAgICAgICAgICBwb3MxID0gW291dGVyU2hhcGUucGF0aF07XG4gICAgICAgIH1cbiAgICAgICAgdG9wb0J5RGVwdGgucHVzaCh7XG4gICAgICAgICAgICBwb3M6IFtvdXRlclNoYXBlLnBhdGhdLFxuICAgICAgICAgICAgbmVnOiBwYXRoc0J5RGVwdGhbMF0ucGF0aHMsXG4gICAgICAgICAgICBkZXB0aDogMFxuICAgICAgICB9KTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBhdGhzQnlEZXB0aC5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgIGxldCB4b3IgPSBwYXRoSGVscGVyLmdldFhvck9mUGF0aHMocGF0aHNCeURlcHRoW2ldLnBhdGhzLCBwYXRoc0J5RGVwdGhbaSArIDFdLnBhdGhzKTtcbiAgICAgICAgICAgIGxldCBwb3N4b3IgPSB4b3IuZmlsdGVyKHBhdGhIZWxwZXIuaXNQb3NpdGl2ZVBhdGgpO1xuICAgICAgICAgICAgbGV0IG5lZ3hvciA9IHhvci5maWx0ZXIocGF0aEhlbHBlci5pc05lZ2F0aXZlUGF0aCk7XG4gICAgICAgICAgICBwYXRoSGVscGVyLnNldERpcmVjdGlvblBhdGhzKG5lZ3hvciwgMSk7XG4gICAgICAgICAgICB0b3BvQnlEZXB0aC5wdXNoKHtcbiAgICAgICAgICAgICAgICBwb3M6IHBvc3hvcixcbiAgICAgICAgICAgICAgICBuZWc6IG5lZ3hvcixcbiAgICAgICAgICAgICAgICBkZXB0aDogcGF0aHNCeURlcHRoW2ldLmRlcHRoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhdGhIZWxwZXIuc2V0RGlyZWN0aW9uUGF0aHMocGF0aHNCeURlcHRoW3BhdGhzQnlEZXB0aC5sZW5ndGggLSAxXSwgMSk7XG4gICAgICAgIHRvcG9CeURlcHRoLnB1c2goe1xuICAgICAgICAgICAgcG9zOiBbb3V0ZXJTaGFwZS5wYXRoXSxcbiAgICAgICAgICAgIG5lZzogcGF0aHNCeURlcHRoW3BhdGhzQnlEZXB0aC5sZW5ndGggLSAxXS5wYXRocyxcbiAgICAgICAgICAgIGRlcHRoOiBwYXRoc0J5RGVwdGhbcGF0aHNCeURlcHRoLmxlbmd0aCAtIDFdLmRlcHRoXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdG9wb0J5RGVwdGg7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogIFRha2VzIGFuIGFycmF5IG9mIHBhdGhzIHJlcHJlc2VudGluZyBob2xlcyBhdCBkaWZmZXJlbnQgZGVwdGhzLlxuICAgICAqICBPbmUgZGVwdGggdmFsdWUvIHBhdGguXG4gICAgICogIHJldHVybnMgYW4gYXJyYXkgb2YgcGF0aHMgYXQgZWFjaCBkZXB0aDogc2ltcGxpZnkgdGhlIGdlb21ldHJ5IGZvciBlYWNoIHN0YWdlLlxuICAgICAqL1xuICAgIGdldFBhdGhzQnlEZXB0aDogZnVuY3Rpb24oaG9sZXMsIG91dGVyUGF0aCkge1xuICAgICAgICAvL2dldHMgYWxsIHBhdGhzIGludG8gdGhlIGJvdW5kcyBvZiBvdXRlclBhdGg6XG4gICAgICAgIC8vIHBhdGhIZWxwZXIuZml0UGF0aHNJbnRvUGF0aChvdXRlclBhdGgucGF0aCwgaG9sZXMubWFwKCBoPT5yZXR1cm4gaC5wYXRoKSk7XG4gICAgICAgIC8qZm9yKGxldCBpIGluIGhvbGVzKXtcbiAgICAgICAgICAgIGlmKHBhdGhIZWxwZXIuZ2V0WG9yT2ZQYXRocyhbaG9sZXNbaV0ucGF0aF0sW291dGVyUGF0aC5wYXRoXSlbMF0pXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICBob2xlc1tpXS5wYXRoPXBhdGhIZWxwZXIuZ2V0SW50ZXJPZlBhdGhzKFtob2xlc1tpXS5wYXRoXSxbb3V0ZXJQYXRoLnBhdGhdKVswXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSovXG5cbiAgICAgICAgLy9zZXRzIGFsbCBkZXB0aHMgZGVlcGVyIHRoYW4gb3V0ZXJEZXB0aCAgb3IgZXF1YWxzIHRvIDAgdG8gb3V0ZXJEZXB0aDpcbiAgICAgICAgaG9sZXMubWFwKGZ1bmN0aW9uKGVsdCkge1xuICAgICAgICAgICAgKGVsdC5kZXB0aCA+IG91dGVyUGF0aC5kZXB0aCB8fCBlbHQuZGVwdGggPT09IDApID8gZWx0LmRlcHRoID0gb3V0ZXJQYXRoLmRlcHRoOiBlbHQuZGVwdGggPSBlbHQuZGVwdGhcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaG9sZXMubWFwKGZ1bmN0aW9uKGVsdCl7IHBhdGhIZWxwZXIuc2V0RGlyZWN0aW9uUGF0aChlbHQucGF0aCwxKTt9KTtcblxuICAgICAgICAvL2dldCBhbGwgZGVwdGhzOlxuICAgICAgICBsZXQgZGVwdGhzID0gbmV3IFNldCgpO1xuICAgICAgICBmb3IgKGxldCBpIGluIGhvbGVzKSB7XG4gICAgICAgICAgICBkZXB0aHMuYWRkKGhvbGVzW2ldLmRlcHRoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXB0aHMuYWRkKDApO1xuICAgICAgICBkZXB0aHMuYWRkKG91dGVyUGF0aC5kZXB0aCk7XG4gICAgICAgIGRlcHRocyA9IEFycmF5LmZyb20oZGVwdGhzKTtcbiAgICAgICAgZGVwdGhzLnNvcnQoXG4gICAgICAgICAgICBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGEgLSBiO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgLy9nZXQgcGF0aHMgYnkgZGVwdGg6XG4gICAgICAgIGxldCByZXM9W107XG4gICAgICAgIGZvciAobGV0IGkgaW4gZGVwdGhzKSB7XG4gICAgICAgICAgICBsZXQgcGF0aEF0RGVwdGggPSBob2xlcy5maWx0ZXIoKHMpID0+IHMuZGVwdGggPj0gZGVwdGhzW2ldKTtcbiAgICAgICAgICAgIHBhdGhBdERlcHRoID0gcGF0aEhlbHBlci5zaW1wbGlmeVBhdGhzKHBhdGhBdERlcHRoLm1hcCgocykgPT4gcy5wYXRoKSk7XG4gICAgICAgICAgICAvL3Rha2Ugb25seSB0aGUgcGF0aHMgb2YgdGhlIGhvbGVzIHdoaWNoIHJlYWNoIHRoaXMgZGVwdGhcbiAgICAgICAgICAgIHJlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBwYXRoczogcGF0aEF0RGVwdGgsXG4gICAgICAgICAgICAgICAgZGVwdGg6IGRlcHRoc1tpXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHRydWRlcjtcbiIsImNvbnN0IHBhdGhIZWxwZXIgPSByZXF1aXJlKFwiLi9wYXRoLWhlbHBlci5qc1wiKTtcbmNvbnN0IGNkdDJkSGVscGVyID0gcmVxdWlyZShcIi4vY2R0MmQtaGVscGVyLmpzXCIpO1xuXG52YXIgZ2VvbUhlbHBlciA9IHtcblxuXG4gICAgbWVyZ2VNZXNoZXM6IGZ1bmN0aW9uKGdlb21zLCBjb25zaWRlck9mZnNldCA9IHRydWUpIHtcbiAgICAgICAgbGV0IHJlcyA9IGdlb21zWzBdO1xuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGdlb21zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICByZXMgPSBnZW9tSGVscGVyLm1lcmdlTWVzaChyZXMsIGdlb21zW2ldLCBjb25zaWRlck9mZnNldCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgbWVyZ2VNZXNoOiBmdW5jdGlvbihnZW9tMSwgZ2VvbTIsIGNvbnNpZGVyT2Zmc2V0KSB7XG4gICAgICAgIGlmICghZ2VvbTIpIHJldHVybiBnZW9tMTtcbiAgICAgICAgaWYgKCFnZW9tMSkgcmV0dXJuIGdlb20yO1xuXG4gICAgICAgIGlmIChjb25zaWRlck9mZnNldCkge1xuICAgICAgICAgICAgZ2VvbTEuZmFjZXMucHVzaCguLi5nZW9tMi5mYWNlcy5tYXAoZiA9PiBmICsgKCtnZW9tMS5vZmZzZXQpKSk7XG4gICAgICAgICAgICBnZW9tMS5vZmZzZXQgPSAoK2dlb20xLm9mZnNldCkgKyAoK2dlb20yLm9mZnNldCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnZW9tMS5mYWNlcy5wdXNoKC4uLmdlb20yLmZhY2VzKTtcbiAgICAgICAgICAgIGdlb20xLm9mZnNldCA9IE1hdGgubWF4KGdlb20xLm9mZnNldCwgZ2VvbTIub2Zmc2V0KTtcbiAgICAgICAgfVxuICAgICAgICBnZW9tMS5wb2ludHMucHVzaCguLi5nZW9tMi5wb2ludHMpO1xuICAgICAgICBnZW9tMS5ub3JtYWxzLnB1c2goLi4uZ2VvbTIubm9ybWFscyk7XG4gICAgICAgIHJldHVybiBnZW9tMTtcbiAgICB9LFxuXG4gICAgZ2V0T3V0ZXJWZXJ0aWNhbEdlb206IGZ1bmN0aW9uKHBhdGhPdXRlciwgZGVwdGgsIG9mZnNldCA9IDApIHtcblxuICAgICAgICBsZXQgcmVzID0gW11cblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGhPdXRlci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IHB0MSA9IHBhdGhPdXRlcltpXTtcbiAgICAgICAgICAgIGxldCBwdDIgPSBwYXRoT3V0ZXJbKGkgKyAxKSAlIHBhdGhPdXRlci5sZW5ndGhdO1xuICAgICAgICAgICAgbGV0IGdlb20gPSBnZW9tSGVscGVyLmdldFB0c05vcm1zSW5keDJkKHB0MSwgcHQyLCAwLCBkZXB0aCwgK29mZnNldCwgdHJ1ZSk7XG4gICAgICAgICAgICBvZmZzZXQgPSBnZW9tLm9mZnNldDtcbiAgICAgICAgICAgIHJlcy5wdXNoKGdlb20pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBnZW9tSGVscGVyLm1lcmdlTWVzaGVzKHJlcywgZmFsc2UpO1xuICAgIH0sXG5cbiAgICAvKlxuICAgICAqIFJldHVybnMgdHdvIHRyaWFuZ2xlcyByZXByZXNlbnRpbmcgdGhlIGxhcmdlciBmYWNlIHdlIGNhbiBidWlsZCBmcm9tIHRoZSBlZGdlIHB0RHduLT5uUHREd25cbiAgICAgKi9cbiAgICBnZXRPbmVJbm5lclZlcnRpY2FsR2VvbTogZnVuY3Rpb24ocHREd24sIG5QdER3biwgaW5kZXhEZXB0aER3biwgcGF0aHNCeURlcHRoLCBvZmZzZXQgPSAwKSB7XG5cbiAgICAgICAgbGV0IG1hdGNoID0gZ2VvbUhlbHBlci5nZXRNYXRjaERlcHRocyhwdER3biwgblB0RHduLCAraW5kZXhEZXB0aER3biwgcGF0aHNCeURlcHRoKTtcbiAgICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCByZXMgPSBnZW9tSGVscGVyLmdldFB0c05vcm1zSW5keDJkKHB0RHduLCBuUHREd24sICttYXRjaC5kZXB0aFVwLCArbWF0Y2guZGVwdGhEd24sICtvZmZzZXQpO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBkZXB0aHMgYXQgd2hpY2ggdGhleSBhcmUgdHdvIGVkZ2VzIHdpdGggdGhlIHNhbWUgMkQgY29vcmRzLlxuICAgICAqIElmIGl0IGRvZXMgbm90IGV4aXN0cyBzdWNoIGEgZWRnZSwgcmV0dXJucyB0aGUgY3VycmVudCBkZXB0aCBhbmQgdGhlIGRlcHRoIGFib3ZlXG4gICAgICovXG4gICAgZ2V0TWF0Y2hEZXB0aHM6IGZ1bmN0aW9uKHB0RHduLCBuUHREd24sIGluZGV4RGVwdGgsIHBhdGhzQnlEZXB0aCkge1xuICAgICAgICAvL2ZvciBlYWNoIGRlcHRoIGRlZXBlciB0aGFuIHBhdGhVcCx3ZSBsb29rIGZvciBhIGNvcnJlc3BvbmRpbmcgcG9pbnQ6XG4gICAgICAgIGxldCBkZXB0aFVwID0gcGF0aHNCeURlcHRoW2luZGV4RGVwdGggLSAxXS5kZXB0aDtcbiAgICAgICAgbGV0IGRlcHRoRHduID0gcGF0aHNCeURlcHRoW2luZGV4RGVwdGhdLmRlcHRoO1xuICAgICAgICBmb3IgKGxldCBpID0gaW5kZXhEZXB0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBsZXQgcGF0aHNBdERlcHRoID0gcGF0aHNCeURlcHRoW2ldLnBhdGhzO1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBwYXRoc0F0RGVwdGgubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAvL2ZvciBlYWNoIHBhdGggYXQgZWFjaCBkZXB0aDpcbiAgICAgICAgICAgICAgICBsZXQgcGF0aFVwID0gcGF0aHNBdERlcHRoW2pdO1xuICAgICAgICAgICAgICAgIGxldCBtYXRjaDEgPSBwYXRoSGVscGVyLmdldFBvaW50TWF0Y2gocGF0aFVwLCBwdER3bik7XG4gICAgICAgICAgICAgICAgbGV0IG1hdGNoMiA9IHBhdGhIZWxwZXIuZ2V0UG9pbnRNYXRjaChwYXRoVXAsIG5QdER3bik7XG4gICAgICAgICAgICAgICAgaWYgKCFtYXRjaDEgfHwgIW1hdGNoMikge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHBhdGhVcFttYXRjaDEuaW5kZXhdLnZpc2l0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZXB0aFVwID0gcGF0aHNCeURlcHRoW2ldLmRlcHRoO1xuICAgICAgICAgICAgICAgIGRlcHRoRHduID0gcGF0aHNCeURlcHRoW2luZGV4RGVwdGhdLmRlcHRoO1xuICAgICAgICAgICAgICAgIHBhdGhzQnlEZXB0aFtpXS5wYXRoc1tqXVttYXRjaDEuaW5kZXhdLnZpc2l0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkZXB0aFVwOiBkZXB0aFVwLFxuICAgICAgICAgICAgZGVwdGhEd246IGRlcHRoRHduXG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldFB0c05vcm1zSW5keDJkOiBmdW5jdGlvbihwb2ludDJkMSwgcG9pbnQyZDIsIGRlcHRoVXAsIGRlcHRoRHduLCBvZmZzZXQsaW52ZXJ0Tm9ybWFsPWZhbHNlKSB7XG5cbiAgICAgICAgbGV0IHBvaW50MSA9IGdlb21IZWxwZXIuZ2V0UG9pbnQzKHBvaW50MmQxLCBkZXB0aFVwKTtcbiAgICAgICAgbGV0IHBvaW50MiA9IGdlb21IZWxwZXIuZ2V0UG9pbnQzKHBvaW50MmQxLCBkZXB0aER3bik7XG4gICAgICAgIGxldCBwb2ludDMgPSBnZW9tSGVscGVyLmdldFBvaW50Myhwb2ludDJkMiwgZGVwdGhEd24pO1xuICAgICAgICBsZXQgcG9pbnQ0ID0gZ2VvbUhlbHBlci5nZXRQb2ludDMocG9pbnQyZDIsIGRlcHRoVXApO1xuXG4gICAgICAgIHJldHVybiBnZW9tSGVscGVyLmdldFB0c05vcm1zSW5keDNkKFtwb2ludDEsIHBvaW50MiwgcG9pbnQzLCBwb2ludDRdLCArb2Zmc2V0LGludmVydE5vcm1hbCk7XG4gICAgfSxcblxuICAgIGdldFB0c05vcm1zSW5keDNkOiBmdW5jdGlvbihwb2ludHMzZCwgb2Zmc2V0LGludmVydE5vcm1hbCkge1xuICAgICAgICBsZXQgbm9ybWFsID0gZ2VvbUhlbHBlci5nZXROb3JtYWxUb1BsYW4ocG9pbnRzM2RbMF0sIHBvaW50czNkWzFdLCBwb2ludHMzZFsyXSxpbnZlcnROb3JtYWwpO1xuICAgICAgICBsZXQgcmVzTm9ybSA9IFtdO1xuICAgICAgICByZXNOb3JtLnB1c2goLi4ubm9ybWFsKTtcbiAgICAgICAgcmVzTm9ybS5wdXNoKC4uLm5vcm1hbCk7XG4gICAgICAgIHJlc05vcm0ucHVzaCguLi5ub3JtYWwpO1xuICAgICAgICByZXNOb3JtLnB1c2goLi4ubm9ybWFsKTtcbiAgICAgICAgbGV0IHJlc1BvaW50cyA9IFtdO1xuICAgICAgICByZXNQb2ludHMucHVzaCguLi5wb2ludHMzZFswXSk7XG4gICAgICAgIHJlc1BvaW50cy5wdXNoKC4uLnBvaW50czNkWzFdKTtcbiAgICAgICAgcmVzUG9pbnRzLnB1c2goLi4ucG9pbnRzM2RbMl0pO1xuICAgICAgICByZXNQb2ludHMucHVzaCguLi5wb2ludHMzZFszXSk7XG4gICAgICAgIGxldCByZXNGYWNlcztcbiAgICAgICAgaWYoaW52ZXJ0Tm9ybWFsKXtcbiAgICAgICAgICAgIHJlc0ZhY2VzPSAoWzAsIDEsIDIsIDAsIDIsIDNdKS5tYXAoZWx0ID0+IGVsdCArIG9mZnNldCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZXtcbiAgICAgICAgICAgIHJlc0ZhY2VzPSAoWzAsIDIsIDEsIDAsIDMsIDJdKS5tYXAoZWx0ID0+IGVsdCArIG9mZnNldCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcG9pbnRzOiByZXNQb2ludHMsXG4gICAgICAgICAgICBub3JtYWxzOiByZXNOb3JtLFxuICAgICAgICAgICAgZmFjZXM6IHJlc0ZhY2VzLFxuICAgICAgICAgICAgb2Zmc2V0OiBvZmZzZXQgKyA0XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIGdldElubmVySG9yaXpvbnRhbEdlb206IGZ1bmN0aW9uKHRyaWFuZ2xlc0J5RGVwdGgsIG9wdGlvbnMsIG9mZnNldCA9IDApIHtcbiAgICAgICAgbGV0IHJlcyA9IFtdO1xuICAgICAgICBsZXQgaW5kZXhlcyA9IFtdO1xuXG4gICAgICAgIGlmIChvcHRpb25zLmZyb250TWVzaCkge1xuICAgICAgICAgICAgaW5kZXhlcy5wdXNoKDApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmluTWVzaCkge1xuICAgICAgICAgICAgaW5kZXhlcy5wdXNoKC4uLkFycmF5LmZyb20obmV3IEFycmF5KHRyaWFuZ2xlc0J5RGVwdGgubGVuZ3RoIC0gMiksICh2YWwsIGluZGV4KSA9PiBpbmRleCArIDEpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5iYWNrTWVzaCkge1xuICAgICAgICAgICAgaW5kZXhlcy5wdXNoKHRyaWFuZ2xlc0J5RGVwdGgubGVuZ3RoIC0gMSk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZvciAobGV0IGkgb2YgaW5kZXhlcykge1xuICAgICAgICAgICAgbGV0IHRyaWFuZ2xlcyA9IHRyaWFuZ2xlc0J5RGVwdGhbaV07XG4gICAgICAgICAgICBsZXQgaW52ZXJ0Tm9ybWFsID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmJhY2tNZXNoKSB7XG4gICAgICAgICAgICAgIGludmVydE5vcm1hbCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGN1cnJHZW9tID0gZ2VvbUhlbHBlci5nZXRHZW9tRnJvbVRyaWFuZ3VsYXRpb24odHJpYW5nbGVzLCArdHJpYW5nbGVzLmRlcHRoLCBpbnZlcnROb3JtYWwsIG9mZnNldCk7XG4gICAgICAgICAgICBvZmZzZXQgPSBjdXJyR2VvbS5vZmZzZXQ7XG4gICAgICAgICAgICByZXMucHVzaChjdXJyR2VvbSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGdlb21IZWxwZXIubWVyZ2VNZXNoZXMocmVzLCBmYWxzZSk7XG4gICAgfSxcblxuXG4gICAgZ2V0R2VvbUZyb21Ucmlhbmd1bGF0aW9uOiBmdW5jdGlvbih0cmlhbmdsZXMsIGRlcHRoLCBpbnZlcnROb3JtYWw9ZmFsc2UsIG9mZnNldCA9IDApIHtcbiAgICAgICAgbGV0IHBvaW50cyA9IFtdO1xuICAgICAgICBPYmplY3QudmFsdWVzKHRyaWFuZ2xlcy5wb2ludHMpLmZvckVhY2gocG9pbnQgPT4ge1xuICAgICAgICAgICAgcG9pbnRzLnB1c2gocG9pbnRbMF0pO1xuICAgICAgICAgICAgcG9pbnRzLnB1c2gocG9pbnRbMV0pO1xuICAgICAgICAgICAgcG9pbnRzLnB1c2goZGVwdGgpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYoIWludmVydE5vcm1hbCl7XG4gICAgICAgICAgICBmb3IoIGxldCB0IG9mIHRyaWFuZ2xlcy50cmlhbmdsZXMpe1xuICAgICAgICAgICAgICAgIHQucmV2ZXJzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vb2Zmc2V0cyBmYWNlc1xuICAgICAgICBsZXQgZmFjZXMgPSBbXTtcbiAgICAgICAgT2JqZWN0LnZhbHVlcyh0cmlhbmdsZXMudHJpYW5nbGVzKS5mb3JFYWNoKHRyaWFuZ2xlID0+IHtcbiAgICAgICAgICAgIGZhY2VzLnB1c2goLi4udHJpYW5nbGUubWFwKGluZGV4ID0+IGluZGV4ICsgb2Zmc2V0KSk7XG4gICAgICAgIH0pO1xuICAgICAgICBvZmZzZXQgKz0gdHJpYW5nbGVzLnBvaW50cy5sZW5ndGg7XG5cbiAgICAgICAgLy9nZXQgbm9ybWFsczpcbiAgICAgICAgbGV0IG5vcm1hbHMgPSBbXTtcbiAgICAgICAgbGV0IG5vcm1hbCA9IGdlb21IZWxwZXIuZ2V0Tm9ybWFsVG9QbGFuKHBvaW50cy5zbGljZSgwLCAzKSxcbiAgICAgICAgICAgICAgICBwb2ludHMuc2xpY2UoMywgNiksXG4gICAgICAgICAgICAgICAgcG9pbnRzLnNsaWNlKDYsIDkpLGludmVydE5vcm1hbCk7XG5cbiAgICAgICAgT2JqZWN0LnZhbHVlcyh0cmlhbmdsZXMucG9pbnRzKS5mb3JFYWNoKHBvaW50ID0+IHtcbiAgICAgICAgICAgIG5vcm1hbHMucHVzaCguLi5ub3JtYWwpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBvaW50czogcG9pbnRzLFxuICAgICAgICAgICAgZmFjZXM6IGZhY2VzLFxuICAgICAgICAgICAgbm9ybWFsczogbm9ybWFscyxcbiAgICAgICAgICAgIG9mZnNldDogb2Zmc2V0XG4gICAgICAgIH07XG4gICAgfSxcblxuXG4gICAgZ2V0Tm9ybWFsVG9QbGFuOiBmdW5jdGlvbihwb2ludDEsIHBvaW50MiwgcG9pbnQ0LCBpbnZlcnROb3JtYWw9ZmFsc2UpIHtcbiAgICAgICAgbGV0IHZlYzE7XG4gICAgICAgIGlmIChpbnZlcnROb3JtYWwpIHtcbiAgICAgICAgICAgIHZlYzEgPSBnZW9tSGVscGVyLnBvaW50c1RvVmVjKHBvaW50MiwgcG9pbnQxKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZlYzEgPSBnZW9tSGVscGVyLnBvaW50c1RvVmVjKHBvaW50MSwgcG9pbnQyKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdmVjMiA9IGdlb21IZWxwZXIucG9pbnRzVG9WZWMocG9pbnQxLCBwb2ludDQpO1xuICAgICAgICByZXR1cm4gZ2VvbUhlbHBlci5ub3JtYWxpemVWZWMoZ2VvbUhlbHBlci5jcm9zcyh2ZWMxLCB2ZWMyKSk7XG4gICAgfSxcblxuICAgIHBvaW50c1RvVmVjOiBmdW5jdGlvbihwb2ludDEsIHBvaW50Mikge1xuICAgICAgICByZXR1cm4gW3BvaW50MlswXSAtIHBvaW50MVswXSwgcG9pbnQyWzFdIC0gcG9pbnQxWzFdLCBwb2ludDJbMl0gLSBwb2ludDFbMl1dO1xuICAgIH0sXG5cbiAgICBnZXRQb2ludDM6IGZ1bmN0aW9uKHBvaW50MiwgZGVwdGgpIHtcbiAgICAgICAgcmV0dXJuIFtwb2ludDIuWCwgcG9pbnQyLlksIGRlcHRoXTtcbiAgICB9LFxuXG4gICAgY3Jvc3M6IGZ1bmN0aW9uKHZlYzEsIHZlYzIpIHtcbiAgICAgICAgcmV0dXJuIFt2ZWMxWzFdICogdmVjMlsyXSAtIHZlYzFbMl0gKiB2ZWMyWzFdLFxuICAgICAgICAgICAgdmVjMVsyXSAqIHZlYzJbMF0gLSB2ZWMxWzBdICogdmVjMlsyXSxcbiAgICAgICAgICAgIHZlYzFbMF0gKiB2ZWMyWzFdIC0gdmVjMVsxXSAqIHZlYzJbMF1cbiAgICAgICAgXTtcbiAgICB9LFxuXG4gICAgbm9ybWFsaXplVmVjOiBmdW5jdGlvbih2ZWMpIHtcbiAgICAgICAgbGV0IG5vcm0gPSBNYXRoLnNxcnQodmVjWzBdICogdmVjWzBdICsgdmVjWzFdICogdmVjWzFdICsgdmVjWzJdICogdmVjWzJdKTtcbiAgICAgICAgcmV0dXJuIFt2ZWNbMF0gLyBub3JtLCB2ZWNbMV0gLyBub3JtLCB2ZWNbMl0gLyBub3JtXTtcbiAgICB9LFxuXG5cbn07XG5tb2R1bGUuZXhwb3J0cyA9IGdlb21IZWxwZXI7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuXG5cbmNvbnN0IGV4dHJ1ZGVyID0gcmVxdWlyZShcIi4vZXh0cnVkZXIuanNcIik7XG5jb25zdCBnZW9tSGVscGVyID0gcmVxdWlyZShcIi4vZ2VvbS1oZWxwZXIuanNcIik7XG5jb25zdCBleHBvcnRIZWxwZXI9IHJlcXVpcmUoXCIuL2V4cG9ydC1oZWxwZXIuanNcIik7XG5jb25zdCBkcmF3SGVscGVyPSByZXF1aXJlKFwiLi9kcmF3LWhlbHBlci5qc1wiKTtcbmNvbnN0IHBhdGhIZWxwZXI9IHJlcXVpcmUoXCIuL3BhdGgtaGVscGVyLmpzXCIpO1xuXG5cblxudmFyIHplcGF0aGxpYiA9IHtcblxuICAgIGdldFBhdGhzQnlEZXB0aDogZXh0cnVkZXIuZ2V0UGF0aHNCeURlcHRoLFxuICAgIGdldFRvcG9QYXRoQnlEZXB0aDogZXh0cnVkZXIuZ2V0VG9wb1BhdGhCeURlcHRoLFxuICAgIGRyYXdQYXRoczogZHJhd0hlbHBlci5kcmF3UGF0aHMsXG4gICAgZHJhd1BhdGg6IGRyYXdIZWxwZXIuZHJhd1BhdGgsXG4gICAgZHJhd1RyaWFuZ2xlczogZHJhd0hlbHBlci5kcmF3VHJpYW5nbGVzLFxuICAgIGdldFhvck9mUGF0aHM6IHBhdGhIZWxwZXIuZ2V0WG9yT2ZQYXRocyxcbiAgICBnZXRJbnRlck9mUGF0aHM6IHBhdGhIZWxwZXIuZ2V0SW50ZXJPZlBhdGhzLFxuICAgIGdldERpZmZPZlBhdGhzOiBwYXRoSGVscGVyLmdldERpZmZPZlBhdGhzLFxuICAgIGdldFVuaW9uT2ZQYXRoczogcGF0aEhlbHBlci5nZXRVbmlvbk9mUGF0aHMsXG4gICAgZ2V0SW50ZXJPZlBhdGhzOiBwYXRoSGVscGVyLmdldEludGVyT2ZQYXRocyxcblxuXG4gICAgZ2V0R2VvbWV0cnk6IGV4dHJ1ZGVyLmdldEdlb21ldHJ5LFxuICAgIG1lcmdlTWVzaGVzOiBnZW9tSGVscGVyLm1lcmdlTWVzaGVzXG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gemVwYXRobGliO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmNvbnN0IGNsaXBwZXJMaWIgPSByZXF1aXJlKFwiY2xpcHBlci1saWJcIik7XG5cbnZhciBwYXRoSGVscGVyID0ge1xuXG5cbiAgICAvKipcbiAgICAgKiBDb21wdXRlIHRoZSB4b3Igb2YgdHdvIGFycmF5cyBvZiBwYXRoXG4gICAgICpcbiAgICAgKi9cbiAgICBnZXRYb3JPZlBhdGhzOiBmdW5jdGlvbihwYXRoc1N1YmosIHBhdGhzQ2xpcCkge1xuICAgICAgICBsZXQgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHN1YmplY3RGaWxsVHlwZTogY2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybyxcbiAgICAgICAgICAgIGNsaXBGaWxsVHlwZTogY2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybyxcbiAgICAgICAgICAgIGNsaXBUeXBlOiBjbGlwcGVyTGliLkNsaXBUeXBlLmN0WG9yXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBwYXRoSGVscGVyLmV4ZWN1dGVDbGlwcGVyKHBhdGhzU3ViaiwgcGF0aHNDbGlwLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZSB0aGUgeG9yIG9mIHR3byBhcnJheXMgb2YgcGF0aFxuICAgICAqXG4gICAgICovXG4gICAgZ2V0VW5pb25PZlBhdGhzOiBmdW5jdGlvbihwYXRoc1N1YmosIHBhdGhzQ2xpcCwgb3ApIHtcbiAgICAgICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBzdWJqZWN0RmlsbFR5cGU6IGNsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm8sXG4gICAgICAgICAgICBjbGlwRmlsbFR5cGU6IGNsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm8sXG4gICAgICAgICAgICBjbGlwVHlwZTogY2xpcHBlckxpYi5DbGlwVHlwZS5jdFVuaW9uXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBwYXRoSGVscGVyLmV4ZWN1dGVDbGlwcGVyKHBhdGhzU3ViaiwgcGF0aHNDbGlwLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZSB0aGUgeG9yIG9mIHR3byBhcnJheXMgb2YgcGF0aFxuICAgICAqXG4gICAgICovXG4gICAgZ2V0RGlmZk9mUGF0aHM6IGZ1bmN0aW9uKHBhdGhzU3ViaiwgcGF0aHNDbGlwLCBvcCkge1xuICAgICAgICBsZXQgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHN1YmplY3RGaWxsVHlwZTogY2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybyxcbiAgICAgICAgICAgIGNsaXBGaWxsVHlwZTogY2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybyxcbiAgICAgICAgICAgIGNsaXBUeXBlOiBjbGlwcGVyTGliLkNsaXBUeXBlLmN0RGlmZmVyZW5jZVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcGF0aEhlbHBlci5leGVjdXRlQ2xpcHBlcihwYXRoc1N1YmosIHBhdGhzQ2xpcCwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENvbXB1dGUgdGhlIHhvciBvZiB0d28gYXJyYXlzIG9mIHBhdGhcbiAgICAgKlxuICAgICAqL1xuICAgIGdldEludGVyT2ZQYXRoczogZnVuY3Rpb24ocGF0aHNTdWJqLCBwYXRoc0NsaXAsIG9wKSB7XG4gICAgICAgIGxldCBvcHRpb25zID0ge1xuICAgICAgICAgICAgc3ViamVjdEZpbGxUeXBlOiBjbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvLFxuICAgICAgICAgICAgY2xpcEZpbGxUeXBlOiBjbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvLFxuICAgICAgICAgICAgY2xpcFR5cGU6IGNsaXBwZXJMaWIuQ2xpcFR5cGUuY3RJbnRlcnNlY3Rpb25cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHBhdGhIZWxwZXIuZXhlY3V0ZUNsaXBwZXIocGF0aHNTdWJqLCBwYXRoc0NsaXAsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTaW1wbGlmeSBhbiBhcnJheSBvZiBwYXRoc1xuICAgICAqXG4gICAgICovXG4gICAgc2ltcGxpZnlQYXRoczogZnVuY3Rpb24ocGF0aHMsIG9wdGlvbnMgPSB7XG4gICAgICAgIGZpbGxUeXBlOiBjbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvXG4gICAgfSkge1xuICAgICAgICByZXR1cm4gY2xpcHBlckxpYi5DbGlwcGVyLlNpbXBsaWZ5UG9seWdvbnMocGF0aHMsIG9wdGlvbnMuZmlsbFR5cGUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBcHBseSBDbGlwcGVyIG9wZXJhdGlvbiB0byBwYXRoc1N1YmogYW5kIHBhdGhDbGlwXG4gICAgICogY2xpcFR5cGU6IHtjdEludGVyc2VjdGlvbixjdFVuaW9uLGN0RGlmZmVyZW5jZSxjdFhvcn1cbiAgICAgKiBzdWJqZWN0RmlsbDoge3BmdEV2ZW5PZGQscGZ0Tm9uWmVybyxwZnRQb3NpdGl2ZSxwZnROZWdhdGl2ZX1cbiAgICAgKiBjbGlwRmlsbDogc2FtZSBhcyB1cG9uXG4gICAgICovXG4gICAgZXhlY3V0ZUNsaXBwZXI6IGZ1bmN0aW9uKHBhdGhzU3ViaiwgcGF0aHNDbGlwLCBvcHRpb25zID0ge1xuICAgICAgICBjbGlwVHlwZTogY2xpcHBlckxpYi5DbGlwVHlwZVxuICAgICAgICAgICAgLmN0VW5pb24sXG4gICAgICAgIHN1YmplY3RGaWxsOiBjbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvLFxuICAgICAgICBjbGlwRmlsbDogY2xpcHBlckxpYlxuICAgICAgICAgICAgLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvXG4gICAgfSkge1xuICAgICAgICBpZiAoIXBhdGhzU3ViaiAmJiAhcGF0aHNDbGlwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy90dXJuIHBhdGhzIHNvIHRoZXkgYXJlIG5lZ2F0aXZlczpcbiAgICAgICAgcGF0aEhlbHBlci5zZXREaXJlY3Rpb25QYXRocyhwYXRoc1N1YmosIC0xKTtcbiAgICAgICAgaWYgKHBhdGhzQ2xpcCkge1xuICAgICAgICAgICAgcGF0aEhlbHBlci5zZXREaXJlY3Rpb25QYXRocyhwYXRoc0NsaXAsIC0xKTtcbiAgICAgICAgfVxuICAgICAgICAvL3NldHR1cCBhbmQgZXhlY3V0ZSBjbGlwcGVyXG4gICAgICAgIGxldCBjcHIgPSBuZXcgY2xpcHBlckxpYi5DbGlwcGVyKCk7XG4gICAgICAgIGNwci5BZGRQYXRocyhwYXRoc1N1YmosIGNsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0LCB0cnVlKTtcbiAgICAgICAgaWYgKHBhdGhzQ2xpcClcbiAgICAgICAgICAgIHtjcHIuQWRkUGF0aHMocGF0aHNDbGlwLCBjbGlwcGVyTGliLlBvbHlUeXBlLnB0Q2xpcCwgdHJ1ZSk7fVxuICAgICAgICBsZXQgcmVzID0gbmV3IGNsaXBwZXJMaWIuUGF0aHMoKTtcbiAgICAgICAgY3ByLkV4ZWN1dGUob3B0aW9ucy5jbGlwVHlwZSwgcmVzLCBvcHRpb25zLnN1YmplY3RGaWxsLCBvcHRpb25zLmNsaXBGaWxsKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogIHNldHMgdGhlIGRpcmVjdGlvbiBvZiBhbiBhcnJheSBvZiBwYXRoXG4gICAgICovXG4gICAgc2V0RGlyZWN0aW9uUGF0aHM6IGZ1bmN0aW9uKHBhdGhzLCBkaXJlY3Rpb24pIHtcbiAgICAgICAgZm9yIChsZXQgaSBpbiBwYXRocykge1xuICAgICAgICAgICAgcGF0aEhlbHBlci5zZXREaXJlY3Rpb25QYXRoKHBhdGhzW2ldLCBkaXJlY3Rpb24pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqICBzZXRzIHRoZSBkaXJlY3Rpb24gb2YgYSBwYXRoXG4gICAgICovXG4gICAgc2V0RGlyZWN0aW9uUGF0aDogZnVuY3Rpb24ocGF0aCwgZGlyZWN0aW9uKSB7XG4gICAgICAgIGlmIChjbGlwcGVyTGliLkpTLkFyZWFPZlBvbHlnb24ocGF0aCkgKiBkaXJlY3Rpb24gPCAwKSB7XG4gICAgICAgICAgICBwYXRoLnJldmVyc2UoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAgY2hlY2tzIGlmIHRoZSBzaWduZWQgYXJlYSBvZiB0aGUgcGF0aCBpcyBwb3NpdGl2ZVxuICAgICAqL1xuICAgIGlzUG9zaXRpdmVQYXRoOiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgIHJldHVybiBwYXRoSGVscGVyLmdldERpcmVjdGlvblBhdGgocGF0aCkgPiAwO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAgY2hlY2tzIGlmIHRoZSBzaWduZWQgYXJlYSBvZiB0aGUgcGF0aCBpcyBuZWdhdGl2ZVxuICAgICAqL1xuICAgIGlzTmVnYXRpdmVQYXRoOiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgIHJldHVybiBwYXRoSGVscGVyLmdldERpcmVjdGlvblBhdGgocGF0aCkgPCAwO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAgZ2V0IHRoZSBkaXJlY3Rpb24gb2YgYW4gYXJhcnkgb2YgcGF0aFxuICAgICAqL1xuICAgIGdldERpcmVjdGlvblBhdGhzOiBmdW5jdGlvbihwYXRocykge1xuICAgICAgICByZXR1cm4gcGF0aHMubWFwKHBhdGhIZWxwZXIuZ2V0RGlyZWN0aW9uUGF0aCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqICBnZXQgdGhlIGRpcmVjdGlvbiBvZiBhIHBhdGhcbiAgICAgKi9cbiAgICBnZXREaXJlY3Rpb25QYXRoOiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgIHJldHVybiAoY2xpcHBlckxpYi5KUy5BcmVhT2ZQb2x5Z29uKHBhdGgpID4gMCkgPyAxIDogLTE7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogcmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIHBvaW50IGluIHBhdGggbWF0Y2hpbmcgd2l0aCBwb2ludFxuICAgICAqXG4gICAgICovXG4gICAgZ2V0UG9pbnRNYXRjaDogZnVuY3Rpb24ocGF0aCwgcG9pbnQsIG9mZnNldFBhdGggPSAwKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSBvZmZzZXRQYXRoOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHBhdGhIZWxwZXIuaXNFcXVhbChwYXRoW2ldLCBwb2ludCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBpbmRleDogaVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZml0UGF0aHNJbnRvUGF0aDpmdW5jdGlvbihvdXRlclBhdGgsIHRvRml0UGF0aHMgKXtcblxuICAgICAgICBsZXQgcGF0aHM9IHRvRml0UGF0aHMucHVzaChvdXRlclBhdGgpO1xuICAgICAgICBsZXQgdW5pb249IHBhdGhIZWxwZXIuZ2V0VW5pb25PZlBhdGhzKHBhdGhzKTtcbiAgICAgICAgbGV0IGludGVyPSBwYXRoSGVscGVyLmdldEludGVyT2ZQYXRocyhwYXRocyk7XG4gICAgICAgIGxldCB4b3I9IHBhdGhIZWxwZXIuZ2V0WG9yT2ZQYXRocyh1bmlvbixpbnRlcik7XG5cbiAgICAgICAgcmV0dXJuIHBhdGhIZWxwZXIuZ2V0RGlmZk9mUGF0aHMocGF0aHMsIHhvcik7XG5cblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAgY2hlY2tzIGlmIHR3byBwb2ludHMgaGF2ZSB0aGUgc2FtZSBjb29yZGluYXRlc1xuICAgICAqXG4gICAgICovXG4gICAgaXNFcXVhbDogZnVuY3Rpb24ocG9pbnQxLCBwb2ludDIpIHtcbiAgICAgICAgcmV0dXJuIChwb2ludDEuWCA9PT0gcG9pbnQyLlgpICYmIChwb2ludDEuWSA9PT0gcG9pbnQyLlkpO1xuICAgIH0sXG5cbn07XG5tb2R1bGUuZXhwb3J0cyA9IHBhdGhIZWxwZXI7XG4iLCJcInVzZSBzdHJpY3RcIlxuXG5mdW5jdGlvbiBjb21waWxlU2VhcmNoKGZ1bmNOYW1lLCBwcmVkaWNhdGUsIHJldmVyc2VkLCBleHRyYUFyZ3MsIGVhcmx5T3V0KSB7XG4gIHZhciBjb2RlID0gW1xuICAgIFwiZnVuY3Rpb24gXCIsIGZ1bmNOYW1lLCBcIihhLGwsaCxcIiwgZXh0cmFBcmdzLmpvaW4oXCIsXCIpLCAgXCIpe1wiLFxuZWFybHlPdXQgPyBcIlwiIDogXCJ2YXIgaT1cIiwgKHJldmVyc2VkID8gXCJsLTFcIiA6IFwiaCsxXCIpLFxuXCI7d2hpbGUobDw9aCl7XFxcbnZhciBtPShsK2gpPj4+MSx4PWFbbV1cIl1cbiAgaWYoZWFybHlPdXQpIHtcbiAgICBpZihwcmVkaWNhdGUuaW5kZXhPZihcImNcIikgPCAwKSB7XG4gICAgICBjb2RlLnB1c2goXCI7aWYoeD09PXkpe3JldHVybiBtfWVsc2UgaWYoeDw9eSl7XCIpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUucHVzaChcIjt2YXIgcD1jKHgseSk7aWYocD09PTApe3JldHVybiBtfWVsc2UgaWYocDw9MCl7XCIpXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvZGUucHVzaChcIjtpZihcIiwgcHJlZGljYXRlLCBcIil7aT1tO1wiKVxuICB9XG4gIGlmKHJldmVyc2VkKSB7XG4gICAgY29kZS5wdXNoKFwibD1tKzF9ZWxzZXtoPW0tMX1cIilcbiAgfSBlbHNlIHtcbiAgICBjb2RlLnB1c2goXCJoPW0tMX1lbHNle2w9bSsxfVwiKVxuICB9XG4gIGNvZGUucHVzaChcIn1cIilcbiAgaWYoZWFybHlPdXQpIHtcbiAgICBjb2RlLnB1c2goXCJyZXR1cm4gLTF9O1wiKVxuICB9IGVsc2Uge1xuICAgIGNvZGUucHVzaChcInJldHVybiBpfTtcIilcbiAgfVxuICByZXR1cm4gY29kZS5qb2luKFwiXCIpXG59XG5cbmZ1bmN0aW9uIGNvbXBpbGVCb3VuZHNTZWFyY2gocHJlZGljYXRlLCByZXZlcnNlZCwgc3VmZml4LCBlYXJseU91dCkge1xuICB2YXIgcmVzdWx0ID0gbmV3IEZ1bmN0aW9uKFtcbiAgY29tcGlsZVNlYXJjaChcIkFcIiwgXCJ4XCIgKyBwcmVkaWNhdGUgKyBcInlcIiwgcmV2ZXJzZWQsIFtcInlcIl0sIGVhcmx5T3V0KSxcbiAgY29tcGlsZVNlYXJjaChcIlBcIiwgXCJjKHgseSlcIiArIHByZWRpY2F0ZSArIFwiMFwiLCByZXZlcnNlZCwgW1wieVwiLCBcImNcIl0sIGVhcmx5T3V0KSxcblwiZnVuY3Rpb24gZGlzcGF0Y2hCc2VhcmNoXCIsIHN1ZmZpeCwgXCIoYSx5LGMsbCxoKXtcXFxuaWYodHlwZW9mKGMpPT09J2Z1bmN0aW9uJyl7XFxcbnJldHVybiBQKGEsKGw9PT12b2lkIDApPzA6bHwwLChoPT09dm9pZCAwKT9hLmxlbmd0aC0xOmh8MCx5LGMpXFxcbn1lbHNle1xcXG5yZXR1cm4gQShhLChjPT09dm9pZCAwKT8wOmN8MCwobD09PXZvaWQgMCk/YS5sZW5ndGgtMTpsfDAseSlcXFxufX1cXFxucmV0dXJuIGRpc3BhdGNoQnNlYXJjaFwiLCBzdWZmaXhdLmpvaW4oXCJcIikpXG4gIHJldHVybiByZXN1bHQoKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2U6IGNvbXBpbGVCb3VuZHNTZWFyY2goXCI+PVwiLCBmYWxzZSwgXCJHRVwiKSxcbiAgZ3Q6IGNvbXBpbGVCb3VuZHNTZWFyY2goXCI+XCIsIGZhbHNlLCBcIkdUXCIpLFxuICBsdDogY29tcGlsZUJvdW5kc1NlYXJjaChcIjxcIiwgdHJ1ZSwgXCJMVFwiKSxcbiAgbGU6IGNvbXBpbGVCb3VuZHNTZWFyY2goXCI8PVwiLCB0cnVlLCBcIkxFXCIpLFxuICBlcTogY29tcGlsZUJvdW5kc1NlYXJjaChcIi1cIiwgdHJ1ZSwgXCJFUVwiLCB0cnVlKVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBtb25vdG9uZVRyaWFuZ3VsYXRlID0gcmVxdWlyZSgnLi9saWIvbW9ub3RvbmUnKVxudmFyIG1ha2VJbmRleCA9IHJlcXVpcmUoJy4vbGliL3RyaWFuZ3VsYXRpb24nKVxudmFyIGRlbGF1bmF5RmxpcCA9IHJlcXVpcmUoJy4vbGliL2RlbGF1bmF5JylcbnZhciBmaWx0ZXJUcmlhbmd1bGF0aW9uID0gcmVxdWlyZSgnLi9saWIvZmlsdGVyJylcblxubW9kdWxlLmV4cG9ydHMgPSBjZHQyZFxuXG5mdW5jdGlvbiBjYW5vbmljYWxpemVFZGdlKGUpIHtcbiAgcmV0dXJuIFtNYXRoLm1pbihlWzBdLCBlWzFdKSwgTWF0aC5tYXgoZVswXSwgZVsxXSldXG59XG5cbmZ1bmN0aW9uIGNvbXBhcmVFZGdlKGEsIGIpIHtcbiAgcmV0dXJuIGFbMF0tYlswXSB8fCBhWzFdLWJbMV1cbn1cblxuZnVuY3Rpb24gY2Fub25pY2FsaXplRWRnZXMoZWRnZXMpIHtcbiAgcmV0dXJuIGVkZ2VzLm1hcChjYW5vbmljYWxpemVFZGdlKS5zb3J0KGNvbXBhcmVFZGdlKVxufVxuXG5mdW5jdGlvbiBnZXREZWZhdWx0KG9wdGlvbnMsIHByb3BlcnR5LCBkZmx0KSB7XG4gIGlmKHByb3BlcnR5IGluIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gb3B0aW9uc1twcm9wZXJ0eV1cbiAgfVxuICByZXR1cm4gZGZsdFxufVxuXG5mdW5jdGlvbiBjZHQyZChwb2ludHMsIGVkZ2VzLCBvcHRpb25zKSB7XG5cbiAgaWYoIUFycmF5LmlzQXJyYXkoZWRnZXMpKSB7XG4gICAgb3B0aW9ucyA9IGVkZ2VzIHx8IHt9XG4gICAgZWRnZXMgPSBbXVxuICB9IGVsc2Uge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gICAgZWRnZXMgPSBlZGdlcyB8fCBbXVxuICB9XG5cbiAgLy9QYXJzZSBvdXQgb3B0aW9uc1xuICB2YXIgZGVsYXVuYXkgPSAhIWdldERlZmF1bHQob3B0aW9ucywgJ2RlbGF1bmF5JywgdHJ1ZSlcbiAgdmFyIGludGVyaW9yID0gISFnZXREZWZhdWx0KG9wdGlvbnMsICdpbnRlcmlvcicsIHRydWUpXG4gIHZhciBleHRlcmlvciA9ICEhZ2V0RGVmYXVsdChvcHRpb25zLCAnZXh0ZXJpb3InLCB0cnVlKVxuICB2YXIgaW5maW5pdHkgPSAhIWdldERlZmF1bHQob3B0aW9ucywgJ2luZmluaXR5JywgZmFsc2UpXG5cbiAgLy9IYW5kbGUgdHJpdmlhbCBjYXNlXG4gIGlmKCghaW50ZXJpb3IgJiYgIWV4dGVyaW9yKSB8fCBwb2ludHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIFtdXG4gIH1cblxuICAvL0NvbnN0cnVjdCBpbml0aWFsIHRyaWFuZ3VsYXRpb25cbiAgdmFyIGNlbGxzID0gbW9ub3RvbmVUcmlhbmd1bGF0ZShwb2ludHMsIGVkZ2VzKVxuXG4gIC8vSWYgZGVsYXVuYXkgcmVmaW5lbWVudCBuZWVkZWQsIHRoZW4gaW1wcm92ZSBxdWFsaXR5IGJ5IGVkZ2UgZmxpcHBpbmdcbiAgaWYoZGVsYXVuYXkgfHwgaW50ZXJpb3IgIT09IGV4dGVyaW9yIHx8IGluZmluaXR5KSB7XG5cbiAgICAvL0luZGV4IGFsbCBvZiB0aGUgY2VsbHMgdG8gc3VwcG9ydCBmYXN0IG5laWdoYm9yaG9vZCBxdWVyaWVzXG4gICAgdmFyIHRyaWFuZ3VsYXRpb24gPSBtYWtlSW5kZXgocG9pbnRzLmxlbmd0aCwgY2Fub25pY2FsaXplRWRnZXMoZWRnZXMpKVxuICAgIGZvcih2YXIgaT0wOyBpPGNlbGxzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgZiA9IGNlbGxzW2ldXG4gICAgICB0cmlhbmd1bGF0aW9uLmFkZFRyaWFuZ2xlKGZbMF0sIGZbMV0sIGZbMl0pXG4gICAgfVxuXG4gICAgLy9SdW4gZWRnZSBmbGlwcGluZ1xuICAgIGlmKGRlbGF1bmF5KSB7XG4gICAgICBkZWxhdW5heUZsaXAocG9pbnRzLCB0cmlhbmd1bGF0aW9uKVxuICAgIH1cblxuICAgIC8vRmlsdGVyIHBvaW50c1xuICAgIGlmKCFleHRlcmlvcikge1xuICAgICAgcmV0dXJuIGZpbHRlclRyaWFuZ3VsYXRpb24odHJpYW5ndWxhdGlvbiwgLTEpXG4gICAgfSBlbHNlIGlmKCFpbnRlcmlvcikge1xuICAgICAgcmV0dXJuIGZpbHRlclRyaWFuZ3VsYXRpb24odHJpYW5ndWxhdGlvbiwgIDEsIGluZmluaXR5KVxuICAgIH0gZWxzZSBpZihpbmZpbml0eSkge1xuICAgICAgcmV0dXJuIGZpbHRlclRyaWFuZ3VsYXRpb24odHJpYW5ndWxhdGlvbiwgMCwgaW5maW5pdHkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0cmlhbmd1bGF0aW9uLmNlbGxzKClcbiAgICB9XG4gICAgXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGNlbGxzXG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgaW5DaXJjbGUgPSByZXF1aXJlKCdyb2J1c3QtaW4tc3BoZXJlJylbNF1cbnZhciBic2VhcmNoID0gcmVxdWlyZSgnYmluYXJ5LXNlYXJjaC1ib3VuZHMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlbGF1bmF5UmVmaW5lXG5cbmZ1bmN0aW9uIHRlc3RGbGlwKHBvaW50cywgdHJpYW5ndWxhdGlvbiwgc3RhY2ssIGEsIGIsIHgpIHtcbiAgdmFyIHkgPSB0cmlhbmd1bGF0aW9uLm9wcG9zaXRlKGEsIGIpXG5cbiAgLy9UZXN0IGJvdW5kYXJ5IGVkZ2VcbiAgaWYoeSA8IDApIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIC8vU3dhcCBlZGdlIGlmIG9yZGVyIGZsaXBwZWRcbiAgaWYoYiA8IGEpIHtcbiAgICB2YXIgdG1wID0gYVxuICAgIGEgPSBiXG4gICAgYiA9IHRtcFxuICAgIHRtcCA9IHhcbiAgICB4ID0geVxuICAgIHkgPSB0bXBcbiAgfVxuXG4gIC8vVGVzdCBpZiBlZGdlIGlzIGNvbnN0cmFpbmVkXG4gIGlmKHRyaWFuZ3VsYXRpb24uaXNDb25zdHJhaW50KGEsIGIpKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICAvL1Rlc3QgaWYgZWRnZSBpcyBkZWxhdW5heVxuICBpZihpbkNpcmNsZShwb2ludHNbYV0sIHBvaW50c1tiXSwgcG9pbnRzW3hdLCBwb2ludHNbeV0pIDwgMCkge1xuICAgIHN0YWNrLnB1c2goYSwgYilcbiAgfVxufVxuXG4vL0Fzc3VtZSBlZGdlcyBhcmUgc29ydGVkIGxleGljb2dyYXBoaWNhbGx5XG5mdW5jdGlvbiBkZWxhdW5heVJlZmluZShwb2ludHMsIHRyaWFuZ3VsYXRpb24pIHtcbiAgdmFyIHN0YWNrID0gW11cblxuICB2YXIgbnVtUG9pbnRzID0gcG9pbnRzLmxlbmd0aFxuICB2YXIgc3RhcnMgPSB0cmlhbmd1bGF0aW9uLnN0YXJzXG4gIGZvcih2YXIgYT0wOyBhPG51bVBvaW50czsgKythKSB7XG4gICAgdmFyIHN0YXIgPSBzdGFyc1thXVxuICAgIGZvcih2YXIgaj0xOyBqPHN0YXIubGVuZ3RoOyBqKz0yKSB7XG4gICAgICB2YXIgYiA9IHN0YXJbal1cblxuICAgICAgLy9JZiBvcmRlciBpcyBub3QgY29uc2lzdGVudCwgdGhlbiBza2lwIGVkZ2VcbiAgICAgIGlmKGIgPCBhKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vQ2hlY2sgaWYgZWRnZSBpcyBjb25zdHJhaW5lZFxuICAgICAgaWYodHJpYW5ndWxhdGlvbi5pc0NvbnN0cmFpbnQoYSwgYikpIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy9GaW5kIG9wcG9zaXRlIGVkZ2VcbiAgICAgIHZhciB4ID0gc3RhcltqLTFdLCB5ID0gLTFcbiAgICAgIGZvcih2YXIgaz0xOyBrPHN0YXIubGVuZ3RoOyBrKz0yKSB7XG4gICAgICAgIGlmKHN0YXJbay0xXSA9PT0gYikge1xuICAgICAgICAgIHkgPSBzdGFyW2tdXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvL0lmIHRoaXMgaXMgYSBib3VuZGFyeSBlZGdlLCBkb24ndCBmbGlwIGl0XG4gICAgICBpZih5IDwgMCkge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvL0lmIGVkZ2UgaXMgaW4gY2lyY2xlLCBmbGlwIGl0XG4gICAgICBpZihpbkNpcmNsZShwb2ludHNbYV0sIHBvaW50c1tiXSwgcG9pbnRzW3hdLCBwb2ludHNbeV0pIDwgMCkge1xuICAgICAgICBzdGFjay5wdXNoKGEsIGIpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgd2hpbGUoc3RhY2subGVuZ3RoID4gMCkge1xuICAgIHZhciBiID0gc3RhY2sucG9wKClcbiAgICB2YXIgYSA9IHN0YWNrLnBvcCgpXG5cbiAgICAvL0ZpbmQgb3Bwb3NpdGUgcGFpcnNcbiAgICB2YXIgeCA9IC0xLCB5ID0gLTFcbiAgICB2YXIgc3RhciA9IHN0YXJzW2FdXG4gICAgZm9yKHZhciBpPTE7IGk8c3Rhci5sZW5ndGg7IGkrPTIpIHtcbiAgICAgIHZhciBzID0gc3RhcltpLTFdXG4gICAgICB2YXIgdCA9IHN0YXJbaV1cbiAgICAgIGlmKHMgPT09IGIpIHtcbiAgICAgICAgeSA9IHRcbiAgICAgIH0gZWxzZSBpZih0ID09PSBiKSB7XG4gICAgICAgIHggPSBzXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9JZiB4L3kgYXJlIGJvdGggdmFsaWQgdGhlbiBza2lwIGVkZ2VcbiAgICBpZih4IDwgMCB8fCB5IDwgMCkge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICAvL0lmIGVkZ2UgaXMgbm93IGRlbGF1bmF5LCB0aGVuIGRvbid0IGZsaXAgaXRcbiAgICBpZihpbkNpcmNsZShwb2ludHNbYV0sIHBvaW50c1tiXSwgcG9pbnRzW3hdLCBwb2ludHNbeV0pID49IDApIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgLy9GbGlwIHRoZSBlZGdlXG4gICAgdHJpYW5ndWxhdGlvbi5mbGlwKGEsIGIpXG5cbiAgICAvL1Rlc3QgZmxpcHBpbmcgbmVpZ2hib3JpbmcgZWRnZXNcbiAgICB0ZXN0RmxpcChwb2ludHMsIHRyaWFuZ3VsYXRpb24sIHN0YWNrLCB4LCBhLCB5KVxuICAgIHRlc3RGbGlwKHBvaW50cywgdHJpYW5ndWxhdGlvbiwgc3RhY2ssIGEsIHksIHgpXG4gICAgdGVzdEZsaXAocG9pbnRzLCB0cmlhbmd1bGF0aW9uLCBzdGFjaywgeSwgYiwgeClcbiAgICB0ZXN0RmxpcChwb2ludHMsIHRyaWFuZ3VsYXRpb24sIHN0YWNrLCBiLCB4LCB5KVxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIGJzZWFyY2ggPSByZXF1aXJlKCdiaW5hcnktc2VhcmNoLWJvdW5kcycpXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3NpZnlGYWNlc1xuXG5mdW5jdGlvbiBGYWNlSW5kZXgoY2VsbHMsIG5laWdoYm9yLCBjb25zdHJhaW50LCBmbGFncywgYWN0aXZlLCBuZXh0LCBib3VuZGFyeSkge1xuICB0aGlzLmNlbGxzICAgICAgID0gY2VsbHNcbiAgdGhpcy5uZWlnaGJvciAgICA9IG5laWdoYm9yXG4gIHRoaXMuZmxhZ3MgICAgICAgPSBmbGFnc1xuICB0aGlzLmNvbnN0cmFpbnQgID0gY29uc3RyYWludFxuICB0aGlzLmFjdGl2ZSAgICAgID0gYWN0aXZlXG4gIHRoaXMubmV4dCAgICAgICAgPSBuZXh0XG4gIHRoaXMuYm91bmRhcnkgICAgPSBib3VuZGFyeVxufVxuXG52YXIgcHJvdG8gPSBGYWNlSW5kZXgucHJvdG90eXBlXG5cbmZ1bmN0aW9uIGNvbXBhcmVDZWxsKGEsIGIpIHtcbiAgcmV0dXJuIGFbMF0gLSBiWzBdIHx8XG4gICAgICAgICBhWzFdIC0gYlsxXSB8fFxuICAgICAgICAgYVsyXSAtIGJbMl1cbn1cblxucHJvdG8ubG9jYXRlID0gKGZ1bmN0aW9uKCkge1xuICB2YXIga2V5ID0gWzAsMCwwXVxuICByZXR1cm4gZnVuY3Rpb24oYSwgYiwgYykge1xuICAgIHZhciB4ID0gYSwgeSA9IGIsIHogPSBjXG4gICAgaWYoYiA8IGMpIHtcbiAgICAgIGlmKGIgPCBhKSB7XG4gICAgICAgIHggPSBiXG4gICAgICAgIHkgPSBjXG4gICAgICAgIHogPSBhXG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGMgPCBhKSB7XG4gICAgICB4ID0gY1xuICAgICAgeSA9IGFcbiAgICAgIHogPSBiXG4gICAgfVxuICAgIGlmKHggPCAwKSB7XG4gICAgICByZXR1cm4gLTFcbiAgICB9XG4gICAga2V5WzBdID0geFxuICAgIGtleVsxXSA9IHlcbiAgICBrZXlbMl0gPSB6XG4gICAgcmV0dXJuIGJzZWFyY2guZXEodGhpcy5jZWxscywga2V5LCBjb21wYXJlQ2VsbClcbiAgfVxufSkoKVxuXG5mdW5jdGlvbiBpbmRleENlbGxzKHRyaWFuZ3VsYXRpb24sIGluZmluaXR5KSB7XG4gIC8vRmlyc3QgZ2V0IGNlbGxzIGFuZCBjYW5vbmljYWxpemVcbiAgdmFyIGNlbGxzID0gdHJpYW5ndWxhdGlvbi5jZWxscygpXG4gIHZhciBuYyA9IGNlbGxzLmxlbmd0aFxuICBmb3IodmFyIGk9MDsgaTxuYzsgKytpKSB7XG4gICAgdmFyIGMgPSBjZWxsc1tpXVxuICAgIHZhciB4ID0gY1swXSwgeSA9IGNbMV0sIHogPSBjWzJdXG4gICAgaWYoeSA8IHopIHtcbiAgICAgIGlmKHkgPCB4KSB7XG4gICAgICAgIGNbMF0gPSB5XG4gICAgICAgIGNbMV0gPSB6XG4gICAgICAgIGNbMl0gPSB4XG4gICAgICB9XG4gICAgfSBlbHNlIGlmKHogPCB4KSB7XG4gICAgICBjWzBdID0gelxuICAgICAgY1sxXSA9IHhcbiAgICAgIGNbMl0gPSB5XG4gICAgfVxuICB9XG4gIGNlbGxzLnNvcnQoY29tcGFyZUNlbGwpXG5cbiAgLy9Jbml0aWFsaXplIGZsYWcgYXJyYXlcbiAgdmFyIGZsYWdzID0gbmV3IEFycmF5KG5jKVxuICBmb3IodmFyIGk9MDsgaTxmbGFncy5sZW5ndGg7ICsraSkge1xuICAgIGZsYWdzW2ldID0gMFxuICB9XG5cbiAgLy9CdWlsZCBuZWlnaGJvciBpbmRleCwgaW5pdGlhbGl6ZSBxdWV1ZXNcbiAgdmFyIGFjdGl2ZSA9IFtdXG4gIHZhciBuZXh0ICAgPSBbXVxuICB2YXIgbmVpZ2hib3IgPSBuZXcgQXJyYXkoMypuYylcbiAgdmFyIGNvbnN0cmFpbnQgPSBuZXcgQXJyYXkoMypuYylcbiAgdmFyIGJvdW5kYXJ5ID0gbnVsbFxuICBpZihpbmZpbml0eSkge1xuICAgIGJvdW5kYXJ5ID0gW11cbiAgfVxuICB2YXIgaW5kZXggPSBuZXcgRmFjZUluZGV4KFxuICAgIGNlbGxzLFxuICAgIG5laWdoYm9yLFxuICAgIGNvbnN0cmFpbnQsXG4gICAgZmxhZ3MsXG4gICAgYWN0aXZlLFxuICAgIG5leHQsXG4gICAgYm91bmRhcnkpXG4gIGZvcih2YXIgaT0wOyBpPG5jOyArK2kpIHtcbiAgICB2YXIgYyA9IGNlbGxzW2ldXG4gICAgZm9yKHZhciBqPTA7IGo8MzsgKytqKSB7XG4gICAgICB2YXIgeCA9IGNbal0sIHkgPSBjWyhqKzEpJTNdXG4gICAgICB2YXIgYSA9IG5laWdoYm9yWzMqaStqXSA9IGluZGV4LmxvY2F0ZSh5LCB4LCB0cmlhbmd1bGF0aW9uLm9wcG9zaXRlKHksIHgpKVxuICAgICAgdmFyIGIgPSBjb25zdHJhaW50WzMqaStqXSA9IHRyaWFuZ3VsYXRpb24uaXNDb25zdHJhaW50KHgsIHkpXG4gICAgICBpZihhIDwgMCkge1xuICAgICAgICBpZihiKSB7XG4gICAgICAgICAgbmV4dC5wdXNoKGkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWN0aXZlLnB1c2goaSlcbiAgICAgICAgICBmbGFnc1tpXSA9IDFcbiAgICAgICAgfVxuICAgICAgICBpZihpbmZpbml0eSkge1xuICAgICAgICAgIGJvdW5kYXJ5LnB1c2goW3ksIHgsIC0xXSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gaW5kZXhcbn1cblxuZnVuY3Rpb24gZmlsdGVyQ2VsbHMoY2VsbHMsIGZsYWdzLCB0YXJnZXQpIHtcbiAgdmFyIHB0ciA9IDBcbiAgZm9yKHZhciBpPTA7IGk8Y2VsbHMubGVuZ3RoOyArK2kpIHtcbiAgICBpZihmbGFnc1tpXSA9PT0gdGFyZ2V0KSB7XG4gICAgICBjZWxsc1twdHIrK10gPSBjZWxsc1tpXVxuICAgIH1cbiAgfVxuICBjZWxscy5sZW5ndGggPSBwdHJcbiAgcmV0dXJuIGNlbGxzXG59XG5cbmZ1bmN0aW9uIGNsYXNzaWZ5RmFjZXModHJpYW5ndWxhdGlvbiwgdGFyZ2V0LCBpbmZpbml0eSkge1xuICB2YXIgaW5kZXggPSBpbmRleENlbGxzKHRyaWFuZ3VsYXRpb24sIGluZmluaXR5KVxuXG4gIGlmKHRhcmdldCA9PT0gMCkge1xuICAgIGlmKGluZmluaXR5KSB7XG4gICAgICByZXR1cm4gaW5kZXguY2VsbHMuY29uY2F0KGluZGV4LmJvdW5kYXJ5KVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gaW5kZXguY2VsbHNcbiAgICB9XG4gIH1cblxuICB2YXIgc2lkZSA9IDFcbiAgdmFyIGFjdGl2ZSA9IGluZGV4LmFjdGl2ZVxuICB2YXIgbmV4dCA9IGluZGV4Lm5leHRcbiAgdmFyIGZsYWdzID0gaW5kZXguZmxhZ3NcbiAgdmFyIGNlbGxzID0gaW5kZXguY2VsbHNcbiAgdmFyIGNvbnN0cmFpbnQgPSBpbmRleC5jb25zdHJhaW50XG4gIHZhciBuZWlnaGJvciA9IGluZGV4Lm5laWdoYm9yXG5cbiAgd2hpbGUoYWN0aXZlLmxlbmd0aCA+IDAgfHwgbmV4dC5sZW5ndGggPiAwKSB7XG4gICAgd2hpbGUoYWN0aXZlLmxlbmd0aCA+IDApIHtcbiAgICAgIHZhciB0ID0gYWN0aXZlLnBvcCgpXG4gICAgICBpZihmbGFnc1t0XSA9PT0gLXNpZGUpIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIGZsYWdzW3RdID0gc2lkZVxuICAgICAgdmFyIGMgPSBjZWxsc1t0XVxuICAgICAgZm9yKHZhciBqPTA7IGo8MzsgKytqKSB7XG4gICAgICAgIHZhciBmID0gbmVpZ2hib3JbMyp0K2pdXG4gICAgICAgIGlmKGYgPj0gMCAmJiBmbGFnc1tmXSA9PT0gMCkge1xuICAgICAgICAgIGlmKGNvbnN0cmFpbnRbMyp0K2pdKSB7XG4gICAgICAgICAgICBuZXh0LnB1c2goZilcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWN0aXZlLnB1c2goZilcbiAgICAgICAgICAgIGZsYWdzW2ZdID0gc2lkZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vU3dhcCBhcnJheXMgYW5kIGxvb3BcbiAgICB2YXIgdG1wID0gbmV4dFxuICAgIG5leHQgPSBhY3RpdmVcbiAgICBhY3RpdmUgPSB0bXBcbiAgICBuZXh0Lmxlbmd0aCA9IDBcbiAgICBzaWRlID0gLXNpZGVcbiAgfVxuXG4gIHZhciByZXN1bHQgPSBmaWx0ZXJDZWxscyhjZWxscywgZmxhZ3MsIHRhcmdldClcbiAgaWYoaW5maW5pdHkpIHtcbiAgICByZXR1cm4gcmVzdWx0LmNvbmNhdChpbmRleC5ib3VuZGFyeSlcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIGJzZWFyY2ggPSByZXF1aXJlKCdiaW5hcnktc2VhcmNoLWJvdW5kcycpXG52YXIgb3JpZW50ID0gcmVxdWlyZSgncm9idXN0LW9yaWVudGF0aW9uJylbM11cblxudmFyIEVWRU5UX1BPSU5UID0gMFxudmFyIEVWRU5UX0VORCAgID0gMVxudmFyIEVWRU5UX1NUQVJUID0gMlxuXG5tb2R1bGUuZXhwb3J0cyA9IG1vbm90b25lVHJpYW5ndWxhdGVcblxuLy9BIHBhcnRpYWwgY29udmV4IGh1bGwgZnJhZ21lbnQsIG1hZGUgb2YgdHdvIHVuaW1vbm90b25lIHBvbHlnb25zXG5mdW5jdGlvbiBQYXJ0aWFsSHVsbChhLCBiLCBpZHgsIGxvd2VySWRzLCB1cHBlcklkcykge1xuICB0aGlzLmEgPSBhXG4gIHRoaXMuYiA9IGJcbiAgdGhpcy5pZHggPSBpZHhcbiAgdGhpcy5sb3dlcklkcyA9IGxvd2VySWRzXG4gIHRoaXMudXBwZXJJZHMgPSB1cHBlcklkc1xufVxuXG4vL0FuIGV2ZW50IGluIHRoZSBzd2VlcCBsaW5lIHByb2NlZHVyZVxuZnVuY3Rpb24gRXZlbnQoYSwgYiwgdHlwZSwgaWR4KSB7XG4gIHRoaXMuYSAgICA9IGFcbiAgdGhpcy5iICAgID0gYlxuICB0aGlzLnR5cGUgPSB0eXBlXG4gIHRoaXMuaWR4ICA9IGlkeFxufVxuXG4vL1RoaXMgaXMgdXNlZCB0byBjb21wYXJlIGV2ZW50cyBmb3IgdGhlIHN3ZWVwIGxpbmUgcHJvY2VkdXJlXG4vLyBQb2ludHMgYXJlOlxuLy8gIDEuIHNvcnRlZCBsZXhpY29ncmFwaGljYWxseVxuLy8gIDIuIHNvcnRlZCBieSB0eXBlICAocG9pbnQgPCBlbmQgPCBzdGFydClcbi8vICAzLiBzZWdtZW50cyBzb3J0ZWQgYnkgd2luZGluZyBvcmRlclxuLy8gIDQuIHNvcnRlZCBieSBpbmRleFxuZnVuY3Rpb24gY29tcGFyZUV2ZW50KGEsIGIpIHtcbiAgdmFyIGQgPVxuICAgIChhLmFbMF0gLSBiLmFbMF0pIHx8XG4gICAgKGEuYVsxXSAtIGIuYVsxXSkgfHxcbiAgICAoYS50eXBlIC0gYi50eXBlKVxuICBpZihkKSB7IHJldHVybiBkIH1cbiAgaWYoYS50eXBlICE9PSBFVkVOVF9QT0lOVCkge1xuICAgIGQgPSBvcmllbnQoYS5hLCBhLmIsIGIuYilcbiAgICBpZihkKSB7IHJldHVybiBkIH1cbiAgfVxuICByZXR1cm4gYS5pZHggLSBiLmlkeFxufVxuXG5mdW5jdGlvbiB0ZXN0UG9pbnQoaHVsbCwgcCkge1xuICByZXR1cm4gb3JpZW50KGh1bGwuYSwgaHVsbC5iLCBwKVxufVxuXG5mdW5jdGlvbiBhZGRQb2ludChjZWxscywgaHVsbHMsIHBvaW50cywgcCwgaWR4KSB7XG4gIHZhciBsbyA9IGJzZWFyY2gubHQoaHVsbHMsIHAsIHRlc3RQb2ludClcbiAgdmFyIGhpID0gYnNlYXJjaC5ndChodWxscywgcCwgdGVzdFBvaW50KVxuICBmb3IodmFyIGk9bG87IGk8aGk7ICsraSkge1xuICAgIHZhciBodWxsID0gaHVsbHNbaV1cblxuICAgIC8vSW5zZXJ0IHAgaW50byBsb3dlciBodWxsXG4gICAgdmFyIGxvd2VySWRzID0gaHVsbC5sb3dlcklkc1xuICAgIHZhciBtID0gbG93ZXJJZHMubGVuZ3RoXG4gICAgd2hpbGUobSA+IDEgJiYgb3JpZW50KFxuICAgICAgICBwb2ludHNbbG93ZXJJZHNbbS0yXV0sXG4gICAgICAgIHBvaW50c1tsb3dlcklkc1ttLTFdXSxcbiAgICAgICAgcCkgPiAwKSB7XG4gICAgICBjZWxscy5wdXNoKFxuICAgICAgICBbbG93ZXJJZHNbbS0xXSxcbiAgICAgICAgIGxvd2VySWRzW20tMl0sXG4gICAgICAgICBpZHhdKVxuICAgICAgbSAtPSAxXG4gICAgfVxuICAgIGxvd2VySWRzLmxlbmd0aCA9IG1cbiAgICBsb3dlcklkcy5wdXNoKGlkeClcblxuICAgIC8vSW5zZXJ0IHAgaW50byB1cHBlciBodWxsXG4gICAgdmFyIHVwcGVySWRzID0gaHVsbC51cHBlcklkc1xuICAgIHZhciBtID0gdXBwZXJJZHMubGVuZ3RoXG4gICAgd2hpbGUobSA+IDEgJiYgb3JpZW50KFxuICAgICAgICBwb2ludHNbdXBwZXJJZHNbbS0yXV0sXG4gICAgICAgIHBvaW50c1t1cHBlcklkc1ttLTFdXSxcbiAgICAgICAgcCkgPCAwKSB7XG4gICAgICBjZWxscy5wdXNoKFxuICAgICAgICBbdXBwZXJJZHNbbS0yXSxcbiAgICAgICAgIHVwcGVySWRzW20tMV0sXG4gICAgICAgICBpZHhdKVxuICAgICAgbSAtPSAxXG4gICAgfVxuICAgIHVwcGVySWRzLmxlbmd0aCA9IG1cbiAgICB1cHBlcklkcy5wdXNoKGlkeClcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kU3BsaXQoaHVsbCwgZWRnZSkge1xuICB2YXIgZFxuICBpZihodWxsLmFbMF0gPCBlZGdlLmFbMF0pIHtcbiAgICBkID0gb3JpZW50KGh1bGwuYSwgaHVsbC5iLCBlZGdlLmEpXG4gIH0gZWxzZSB7XG4gICAgZCA9IG9yaWVudChlZGdlLmIsIGVkZ2UuYSwgaHVsbC5hKVxuICB9XG4gIGlmKGQpIHsgcmV0dXJuIGQgfVxuICBpZihlZGdlLmJbMF0gPCBodWxsLmJbMF0pIHtcbiAgICBkID0gb3JpZW50KGh1bGwuYSwgaHVsbC5iLCBlZGdlLmIpXG4gIH0gZWxzZSB7XG4gICAgZCA9IG9yaWVudChlZGdlLmIsIGVkZ2UuYSwgaHVsbC5iKVxuICB9XG4gIHJldHVybiBkIHx8IGh1bGwuaWR4IC0gZWRnZS5pZHhcbn1cblxuZnVuY3Rpb24gc3BsaXRIdWxscyhodWxscywgcG9pbnRzLCBldmVudCkge1xuICB2YXIgc3BsaXRJZHggPSBic2VhcmNoLmxlKGh1bGxzLCBldmVudCwgZmluZFNwbGl0KVxuICB2YXIgaHVsbCA9IGh1bGxzW3NwbGl0SWR4XVxuICB2YXIgdXBwZXJJZHMgPSBodWxsLnVwcGVySWRzXG4gIHZhciB4ID0gdXBwZXJJZHNbdXBwZXJJZHMubGVuZ3RoLTFdXG4gIGh1bGwudXBwZXJJZHMgPSBbeF1cbiAgaHVsbHMuc3BsaWNlKHNwbGl0SWR4KzEsIDAsXG4gICAgbmV3IFBhcnRpYWxIdWxsKGV2ZW50LmEsIGV2ZW50LmIsIGV2ZW50LmlkeCwgW3hdLCB1cHBlcklkcykpXG59XG5cblxuZnVuY3Rpb24gbWVyZ2VIdWxscyhodWxscywgcG9pbnRzLCBldmVudCkge1xuICAvL1N3YXAgcG9pbnRlcnMgZm9yIG1lcmdlIHNlYXJjaFxuICB2YXIgdG1wID0gZXZlbnQuYVxuICBldmVudC5hID0gZXZlbnQuYlxuICBldmVudC5iID0gdG1wXG4gIHZhciBtZXJnZUlkeCA9IGJzZWFyY2guZXEoaHVsbHMsIGV2ZW50LCBmaW5kU3BsaXQpXG4gIHZhciB1cHBlciA9IGh1bGxzW21lcmdlSWR4XVxuICB2YXIgbG93ZXIgPSBodWxsc1ttZXJnZUlkeC0xXVxuICBsb3dlci51cHBlcklkcyA9IHVwcGVyLnVwcGVySWRzXG4gIGh1bGxzLnNwbGljZShtZXJnZUlkeCwgMSlcbn1cblxuXG5mdW5jdGlvbiBtb25vdG9uZVRyaWFuZ3VsYXRlKHBvaW50cywgZWRnZXMpIHtcblxuICB2YXIgbnVtUG9pbnRzID0gcG9pbnRzLmxlbmd0aFxuICB2YXIgbnVtRWRnZXMgPSBlZGdlcy5sZW5ndGhcblxuICB2YXIgZXZlbnRzID0gW11cblxuICAvL0NyZWF0ZSBwb2ludCBldmVudHNcbiAgZm9yKHZhciBpPTA7IGk8bnVtUG9pbnRzOyArK2kpIHtcbiAgICBldmVudHMucHVzaChuZXcgRXZlbnQoXG4gICAgICBwb2ludHNbaV0sXG4gICAgICBudWxsLFxuICAgICAgRVZFTlRfUE9JTlQsXG4gICAgICBpKSlcbiAgfVxuXG4gIC8vQ3JlYXRlIGVkZ2UgZXZlbnRzXG4gIGZvcih2YXIgaT0wOyBpPG51bUVkZ2VzOyArK2kpIHtcbiAgICB2YXIgZSA9IGVkZ2VzW2ldXG4gICAgdmFyIGEgPSBwb2ludHNbZVswXV1cbiAgICB2YXIgYiA9IHBvaW50c1tlWzFdXVxuICAgIGlmKGFbMF0gPCBiWzBdKSB7XG4gICAgICBldmVudHMucHVzaChcbiAgICAgICAgbmV3IEV2ZW50KGEsIGIsIEVWRU5UX1NUQVJULCBpKSxcbiAgICAgICAgbmV3IEV2ZW50KGIsIGEsIEVWRU5UX0VORCwgaSkpXG4gICAgfSBlbHNlIGlmKGFbMF0gPiBiWzBdKSB7XG4gICAgICBldmVudHMucHVzaChcbiAgICAgICAgbmV3IEV2ZW50KGIsIGEsIEVWRU5UX1NUQVJULCBpKSxcbiAgICAgICAgbmV3IEV2ZW50KGEsIGIsIEVWRU5UX0VORCwgaSkpXG4gICAgfVxuICB9XG5cbiAgLy9Tb3J0IGV2ZW50c1xuICBldmVudHMuc29ydChjb21wYXJlRXZlbnQpXG5cbiAgLy9Jbml0aWFsaXplIGh1bGxcbiAgdmFyIG1pblggPSBldmVudHNbMF0uYVswXSAtICgxICsgTWF0aC5hYnMoZXZlbnRzWzBdLmFbMF0pKSAqIE1hdGgucG93KDIsIC01MilcbiAgdmFyIGh1bGwgPSBbIG5ldyBQYXJ0aWFsSHVsbChbbWluWCwgMV0sIFttaW5YLCAwXSwgLTEsIFtdLCBbXSwgW10sIFtdKSBdXG5cbiAgLy9Qcm9jZXNzIGV2ZW50cyBpbiBvcmRlclxuICB2YXIgY2VsbHMgPSBbXVxuICBmb3IodmFyIGk9MCwgbnVtRXZlbnRzPWV2ZW50cy5sZW5ndGg7IGk8bnVtRXZlbnRzOyArK2kpIHtcbiAgICB2YXIgZXZlbnQgPSBldmVudHNbaV1cbiAgICB2YXIgdHlwZSA9IGV2ZW50LnR5cGVcbiAgICBpZih0eXBlID09PSBFVkVOVF9QT0lOVCkge1xuICAgICAgYWRkUG9pbnQoY2VsbHMsIGh1bGwsIHBvaW50cywgZXZlbnQuYSwgZXZlbnQuaWR4KVxuICAgIH0gZWxzZSBpZih0eXBlID09PSBFVkVOVF9TVEFSVCkge1xuICAgICAgc3BsaXRIdWxscyhodWxsLCBwb2ludHMsIGV2ZW50KVxuICAgIH0gZWxzZSB7XG4gICAgICBtZXJnZUh1bGxzKGh1bGwsIHBvaW50cywgZXZlbnQpXG4gICAgfVxuICB9XG5cbiAgLy9SZXR1cm4gdHJpYW5ndWxhdGlvblxuICByZXR1cm4gY2VsbHNcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgYnNlYXJjaCA9IHJlcXVpcmUoJ2JpbmFyeS1zZWFyY2gtYm91bmRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVUcmlhbmd1bGF0aW9uXG5cbmZ1bmN0aW9uIFRyaWFuZ3VsYXRpb24oc3RhcnMsIGVkZ2VzKSB7XG4gIHRoaXMuc3RhcnMgPSBzdGFyc1xuICB0aGlzLmVkZ2VzID0gZWRnZXNcbn1cblxudmFyIHByb3RvID0gVHJpYW5ndWxhdGlvbi5wcm90b3R5cGVcblxuZnVuY3Rpb24gcmVtb3ZlUGFpcihsaXN0LCBqLCBrKSB7XG4gIGZvcih2YXIgaT0xLCBuPWxpc3QubGVuZ3RoOyBpPG47IGkrPTIpIHtcbiAgICBpZihsaXN0W2ktMV0gPT09IGogJiYgbGlzdFtpXSA9PT0gaykge1xuICAgICAgbGlzdFtpLTFdID0gbGlzdFtuLTJdXG4gICAgICBsaXN0W2ldID0gbGlzdFtuLTFdXG4gICAgICBsaXN0Lmxlbmd0aCA9IG4gLSAyXG4gICAgICByZXR1cm5cbiAgICB9XG4gIH1cbn1cblxucHJvdG8uaXNDb25zdHJhaW50ID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgZSA9IFswLDBdXG4gIGZ1bmN0aW9uIGNvbXBhcmVMZXgoYSwgYikge1xuICAgIHJldHVybiBhWzBdIC0gYlswXSB8fCBhWzFdIC0gYlsxXVxuICB9XG4gIHJldHVybiBmdW5jdGlvbihpLCBqKSB7XG4gICAgZVswXSA9IE1hdGgubWluKGksailcbiAgICBlWzFdID0gTWF0aC5tYXgoaSxqKVxuICAgIHJldHVybiBic2VhcmNoLmVxKHRoaXMuZWRnZXMsIGUsIGNvbXBhcmVMZXgpID49IDBcbiAgfVxufSkoKVxuXG5wcm90by5yZW1vdmVUcmlhbmdsZSA9IGZ1bmN0aW9uKGksIGosIGspIHtcbiAgdmFyIHN0YXJzID0gdGhpcy5zdGFyc1xuICByZW1vdmVQYWlyKHN0YXJzW2ldLCBqLCBrKVxuICByZW1vdmVQYWlyKHN0YXJzW2pdLCBrLCBpKVxuICByZW1vdmVQYWlyKHN0YXJzW2tdLCBpLCBqKVxufVxuXG5wcm90by5hZGRUcmlhbmdsZSA9IGZ1bmN0aW9uKGksIGosIGspIHtcbiAgdmFyIHN0YXJzID0gdGhpcy5zdGFyc1xuICBzdGFyc1tpXS5wdXNoKGosIGspXG4gIHN0YXJzW2pdLnB1c2goaywgaSlcbiAgc3RhcnNba10ucHVzaChpLCBqKVxufVxuXG5wcm90by5vcHBvc2l0ZSA9IGZ1bmN0aW9uKGosIGkpIHtcbiAgdmFyIGxpc3QgPSB0aGlzLnN0YXJzW2ldXG4gIGZvcih2YXIgaz0xLCBuPWxpc3QubGVuZ3RoOyBrPG47IGsrPTIpIHtcbiAgICBpZihsaXN0W2tdID09PSBqKSB7XG4gICAgICByZXR1cm4gbGlzdFtrLTFdXG4gICAgfVxuICB9XG4gIHJldHVybiAtMVxufVxuXG5wcm90by5mbGlwID0gZnVuY3Rpb24oaSwgaikge1xuICB2YXIgYSA9IHRoaXMub3Bwb3NpdGUoaSwgailcbiAgdmFyIGIgPSB0aGlzLm9wcG9zaXRlKGosIGkpXG4gIHRoaXMucmVtb3ZlVHJpYW5nbGUoaSwgaiwgYSlcbiAgdGhpcy5yZW1vdmVUcmlhbmdsZShqLCBpLCBiKVxuICB0aGlzLmFkZFRyaWFuZ2xlKGksIGIsIGEpXG4gIHRoaXMuYWRkVHJpYW5nbGUoaiwgYSwgYilcbn1cblxucHJvdG8uZWRnZXMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHN0YXJzID0gdGhpcy5zdGFyc1xuICB2YXIgcmVzdWx0ID0gW11cbiAgZm9yKHZhciBpPTAsIG49c3RhcnMubGVuZ3RoOyBpPG47ICsraSkge1xuICAgIHZhciBsaXN0ID0gc3RhcnNbaV1cbiAgICBmb3IodmFyIGo9MCwgbT1saXN0Lmxlbmd0aDsgajxtOyBqKz0yKSB7XG4gICAgICByZXN1bHQucHVzaChbbGlzdFtqXSwgbGlzdFtqKzFdXSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5wcm90by5jZWxscyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc3RhcnMgPSB0aGlzLnN0YXJzXG4gIHZhciByZXN1bHQgPSBbXVxuICBmb3IodmFyIGk9MCwgbj1zdGFycy5sZW5ndGg7IGk8bjsgKytpKSB7XG4gICAgdmFyIGxpc3QgPSBzdGFyc1tpXVxuICAgIGZvcih2YXIgaj0wLCBtPWxpc3QubGVuZ3RoOyBqPG07IGorPTIpIHtcbiAgICAgIHZhciBzID0gbGlzdFtqXVxuICAgICAgdmFyIHQgPSBsaXN0W2orMV1cbiAgICAgIGlmKGkgPCBNYXRoLm1pbihzLCB0KSkge1xuICAgICAgICByZXN1bHQucHVzaChbaSwgcywgdF0pXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gY3JlYXRlVHJpYW5ndWxhdGlvbihudW1WZXJ0cywgZWRnZXMpIHtcbiAgdmFyIHN0YXJzID0gbmV3IEFycmF5KG51bVZlcnRzKVxuICBmb3IodmFyIGk9MDsgaTxudW1WZXJ0czsgKytpKSB7XG4gICAgc3RhcnNbaV0gPSBbXVxuICB9XG4gIHJldHVybiBuZXcgVHJpYW5ndWxhdGlvbihzdGFycywgZWRnZXMpXG59XG4iLCIvLyByZXYgNDgyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogQXV0aG9yICAgIDogIEFuZ3VzIEpvaG5zb24gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBWZXJzaW9uICAgOiAgNi4yLjEgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogRGF0ZSAgICAgIDogIDMxIE9jdG9iZXIgMjAxNCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBXZWJzaXRlICAgOiAgaHR0cDovL3d3dy5hbmd1c2ouY29tICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIENvcHlyaWdodCA6ICBBbmd1cyBKb2huc29uIDIwMTAtMjAxNCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBMaWNlbnNlOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIFVzZSwgbW9kaWZpY2F0aW9uICYgZGlzdHJpYnV0aW9uIGlzIHN1YmplY3QgdG8gQm9vc3QgU29mdHdhcmUgTGljZW5zZSBWZXIgMS4gKlxuICogaHR0cDovL3d3dy5ib29zdC5vcmcvTElDRU5TRV8xXzAudHh0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIEF0dHJpYnV0aW9uczogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogVGhlIGNvZGUgaW4gdGhpcyBsaWJyYXJ5IGlzIGFuIGV4dGVuc2lvbiBvZiBCYWxhIFZhdHRpJ3MgY2xpcHBpbmcgYWxnb3JpdGhtOiAqXG4gKiBcIkEgZ2VuZXJpYyBzb2x1dGlvbiB0byBwb2x5Z29uIGNsaXBwaW5nXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogQ29tbXVuaWNhdGlvbnMgb2YgdGhlIEFDTSwgVm9sIDM1LCBJc3N1ZSA3IChKdWx5IDE5OTIpIHBwIDU2LTYzLiAgICAgICAgICAgICAqXG4gKiBodHRwOi8vcG9ydGFsLmFjbS5vcmcvY2l0YXRpb24uY2ZtP2lkPTEyOTkwNiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogQ29tcHV0ZXIgZ3JhcGhpY3MgYW5kIGdlb21ldHJpYyBtb2RlbGluZzogaW1wbGVtZW50YXRpb24gYW5kIGFsZ29yaXRobXMgICAgICAqXG4gKiBCeSBNYXggSy4gQWdvc3RvbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIFNwcmluZ2VyOyAxIGVkaXRpb24gKEphbnVhcnkgNCwgMjAwNSkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogaHR0cDovL2Jvb2tzLmdvb2dsZS5jb20vYm9va3M/cT12YXR0aStjbGlwcGluZythZ29zdG9uICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIFNlZSBhbHNvOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogXCJQb2x5Z29uIE9mZnNldHRpbmcgYnkgQ29tcHV0aW5nIFdpbmRpbmcgTnVtYmVyc1wiICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIFBhcGVyIG5vLiBERVRDMjAwNS04NTUxMyBwcC4gNTY1LTU3NSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogQVNNRSAyMDA1IEludGVybmF0aW9uYWwgRGVzaWduIEVuZ2luZWVyaW5nIFRlY2huaWNhbCBDb25mZXJlbmNlcyAgICAgICAgICAgICAqXG4gKiBhbmQgQ29tcHV0ZXJzIGFuZCBJbmZvcm1hdGlvbiBpbiBFbmdpbmVlcmluZyBDb25mZXJlbmNlIChJREVUQy9DSUUyMDA1KSAgICAgICpcbiAqIFNlcHRlbWJlciAyNC0yOCwgMjAwNSAsIExvbmcgQmVhY2gsIENhbGlmb3JuaWEsIFVTQSAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogaHR0cDovL3d3dy5tZS5iZXJrZWxleS5lZHUvfm1jbWFpbnMvcHVicy9EQUMwNU9mZnNldFBvbHlnb24ucGRmICAgICAgICAgICAgICAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogQXV0aG9yICAgIDogIFRpbW8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBWZXJzaW9uICAgOiAgNi4yLjEuMCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIERhdGUgICAgICA6ICAxNyBKdW5lIDIwMTYgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBUaGlzIGlzIGEgdHJhbnNsYXRpb24gb2YgdGhlIEMjIENsaXBwZXIgbGlicmFyeSB0byBKYXZhc2NyaXB0LiAgICAgICAgICAgICAgICpcbiAqIEludDEyOCBzdHJ1Y3Qgb2YgQyMgaXMgaW1wbGVtZW50ZWQgdXNpbmcgSlNCTiBvZiBUb20gV3UuICAgICAgICAgICAgICAgICAgICAgKlxuICogQmVjYXVzZSBKYXZhc2NyaXB0IGxhY2tzIHN1cHBvcnQgZm9yIDY0LWJpdCBpbnRlZ2VycywgdGhlIHNwYWNlICAgICAgICAgICAgICAqXG4gKiBpcyBhIGxpdHRsZSBtb3JlIHJlc3RyaWN0ZWQgdGhhbiBpbiBDIyB2ZXJzaW9uLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogQyMgdmVyc2lvbiBoYXMgc3VwcG9ydCBmb3IgY29vcmRpbmF0ZSBzcGFjZTogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiArLTQ2MTE2ODYwMTg0MjczODc5MDMgKCBzcXJ0KDJeMTI3IC0xKS8yICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIHdoaWxlIEphdmFzY3JpcHQgdmVyc2lvbiBoYXMgc3VwcG9ydCBmb3Igc3BhY2U6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogKy00NTAzNTk5NjI3MzcwNDk1ICggc3FydCgyXjEwNiAtMSkvMiApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIFRvbSBXdSdzIEpTQk4gcHJvdmVkIHRvIGJlIHRoZSBmYXN0ZXN0IGJpZyBpbnRlZ2VyIGxpYnJhcnk6ICAgICAgICAgICAgICAgICAgKlxuICogaHR0cDovL2pzcGVyZi5jb20vYmlnLWludGVnZXItbGlicmFyeS10ZXN0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIFRoaXMgY2xhc3MgY2FuIGJlIG1hZGUgc2ltcGxlciB3aGVuIChpZiBldmVyKSA2NC1iaXQgaW50ZWdlciBzdXBwb3J0IGNvbWVzLiAgKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIEJhc2ljIEphdmFTY3JpcHQgQk4gbGlicmFyeSAtIHN1YnNldCB1c2VmdWwgZm9yIFJTQSBlbmNyeXB0aW9uLiAgICAgICAgICAgICAgKlxuICogaHR0cDovL3d3dy1jcy1zdHVkZW50cy5zdGFuZm9yZC5lZHUvfnRqdy9qc2JuLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMDUgIFRvbSBXdSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIEFsbCBSaWdodHMgUmVzZXJ2ZWQuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogU2VlIFwiTElDRU5TRVwiIGZvciBkZXRhaWxzOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIGh0dHA6Ly93d3ctY3Mtc3R1ZGVudHMuc3RhbmZvcmQuZWR1L350ancvanNibi9MSUNFTlNFICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbihmdW5jdGlvbiAoKVxue1xuICBcInVzZSBzdHJpY3RcIjtcbiAgLy91c2VfaW50MzI6IFdoZW4gZW5hYmxlZCAzMmJpdCBpbnRzIGFyZSB1c2VkIGluc3RlYWQgb2YgNjRiaXQgaW50cy4gVGhpc1xuICAvL2ltcHJvdmUgcGVyZm9ybWFuY2UgYnV0IGNvb3JkaW5hdGUgdmFsdWVzIGFyZSBsaW1pdGVkIHRvIHRoZSByYW5nZSArLy0gNDYzNDBcbiAgdmFyIHVzZV9pbnQzMiA9IGZhbHNlO1xuICAvL3VzZV94eXo6IGFkZHMgYSBaIG1lbWJlciB0byBJbnRQb2ludC4gQWRkcyBhIG1pbm9yIGNvc3QgdG8gcGVyZm9ybWFuY2UuXG4gIHZhciB1c2VfeHl6ID0gZmFsc2U7XG4gIC8vVXNlTGluZXM6IEVuYWJsZXMgb3BlbiBwYXRoIGNsaXBwaW5nLiBBZGRzIGEgdmVyeSBtaW5vciBjb3N0IHRvIHBlcmZvcm1hbmNlLlxuICB2YXIgdXNlX2xpbmVzID0gdHJ1ZTtcblxuICB2YXIgQ2xpcHBlckxpYiA9IHt9O1xuICB2YXIgaXNOb2RlID0gZmFsc2U7XG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcbiAge1xuICAgIG1vZHVsZS5leHBvcnRzID0gQ2xpcHBlckxpYjtcbiAgICBpc05vZGUgPSB0cnVlO1xuICB9XG4gIGVsc2VcbiAge1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgIGRlZmluZShDbGlwcGVyTGliKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiAoZG9jdW1lbnQpICE9PSBcInVuZGVmaW5lZFwiKSB3aW5kb3cuQ2xpcHBlckxpYiA9IENsaXBwZXJMaWI7XG4gICAgZWxzZSBzZWxmWydDbGlwcGVyTGliJ10gPSBDbGlwcGVyTGliO1xuICB9XG4gIHZhciBuYXZpZ2F0b3JfYXBwTmFtZTtcbiAgaWYgKCFpc05vZGUpXG4gIHtcbiAgICB2YXIgbmF2ID0gbmF2aWdhdG9yLnVzZXJBZ2VudC50b1N0cmluZygpLnRvTG93ZXJDYXNlKCk7XG4gICAgbmF2aWdhdG9yX2FwcE5hbWUgPSBuYXZpZ2F0b3IuYXBwTmFtZTtcbiAgfVxuICBlbHNlXG4gIHtcbiAgICB2YXIgbmF2ID0gXCJjaHJvbWVcIjsgLy8gTm9kZS5qcyB1c2VzIENocm9tZSdzIFY4IGVuZ2luZVxuICAgIG5hdmlnYXRvcl9hcHBOYW1lID0gXCJOZXRzY2FwZVwiOyAvLyBGaXJlZm94LCBDaHJvbWUgYW5kIFNhZmFyaSByZXR1cm5zIFwiTmV0c2NhcGVcIiwgc28gTm9kZS5qcyBzaG91bGQgYWxzb1xuICB9XG4gIC8vIEJyb3dzZXIgdGVzdCB0byBzcGVlZHVwIHBlcmZvcm1hbmNlIGNyaXRpY2FsIGZ1bmN0aW9uc1xuICB2YXIgYnJvd3NlciA9IHt9O1xuICBpZiAobmF2LmluZGV4T2YoXCJjaHJvbWVcIikgIT0gLTEgJiYgbmF2LmluZGV4T2YoXCJjaHJvbWl1bVwiKSA9PSAtMSkgYnJvd3Nlci5jaHJvbWUgPSAxO1xuICBlbHNlIGJyb3dzZXIuY2hyb21lID0gMDtcbiAgaWYgKG5hdi5pbmRleE9mKFwiY2hyb21pdW1cIikgIT0gLTEpIGJyb3dzZXIuY2hyb21pdW0gPSAxO1xuICBlbHNlIGJyb3dzZXIuY2hyb21pdW0gPSAwO1xuICBpZiAobmF2LmluZGV4T2YoXCJzYWZhcmlcIikgIT0gLTEgJiYgbmF2LmluZGV4T2YoXCJjaHJvbWVcIikgPT0gLTEgJiYgbmF2LmluZGV4T2YoXCJjaHJvbWl1bVwiKSA9PSAtMSkgYnJvd3Nlci5zYWZhcmkgPSAxO1xuICBlbHNlIGJyb3dzZXIuc2FmYXJpID0gMDtcbiAgaWYgKG5hdi5pbmRleE9mKFwiZmlyZWZveFwiKSAhPSAtMSkgYnJvd3Nlci5maXJlZm94ID0gMTtcbiAgZWxzZSBicm93c2VyLmZpcmVmb3ggPSAwO1xuICBpZiAobmF2LmluZGV4T2YoXCJmaXJlZm94LzE3XCIpICE9IC0xKSBicm93c2VyLmZpcmVmb3gxNyA9IDE7XG4gIGVsc2UgYnJvd3Nlci5maXJlZm94MTcgPSAwO1xuICBpZiAobmF2LmluZGV4T2YoXCJmaXJlZm94LzE1XCIpICE9IC0xKSBicm93c2VyLmZpcmVmb3gxNSA9IDE7XG4gIGVsc2UgYnJvd3Nlci5maXJlZm94MTUgPSAwO1xuICBpZiAobmF2LmluZGV4T2YoXCJmaXJlZm94LzNcIikgIT0gLTEpIGJyb3dzZXIuZmlyZWZveDMgPSAxO1xuICBlbHNlIGJyb3dzZXIuZmlyZWZveDMgPSAwO1xuICBpZiAobmF2LmluZGV4T2YoXCJvcGVyYVwiKSAhPSAtMSkgYnJvd3Nlci5vcGVyYSA9IDE7XG4gIGVsc2UgYnJvd3Nlci5vcGVyYSA9IDA7XG4gIGlmIChuYXYuaW5kZXhPZihcIm1zaWUgMTBcIikgIT0gLTEpIGJyb3dzZXIubXNpZTEwID0gMTtcbiAgZWxzZSBicm93c2VyLm1zaWUxMCA9IDA7XG4gIGlmIChuYXYuaW5kZXhPZihcIm1zaWUgOVwiKSAhPSAtMSkgYnJvd3Nlci5tc2llOSA9IDE7XG4gIGVsc2UgYnJvd3Nlci5tc2llOSA9IDA7XG4gIGlmIChuYXYuaW5kZXhPZihcIm1zaWUgOFwiKSAhPSAtMSkgYnJvd3Nlci5tc2llOCA9IDE7XG4gIGVsc2UgYnJvd3Nlci5tc2llOCA9IDA7XG4gIGlmIChuYXYuaW5kZXhPZihcIm1zaWUgN1wiKSAhPSAtMSkgYnJvd3Nlci5tc2llNyA9IDE7XG4gIGVsc2UgYnJvd3Nlci5tc2llNyA9IDA7XG4gIGlmIChuYXYuaW5kZXhPZihcIm1zaWUgXCIpICE9IC0xKSBicm93c2VyLm1zaWUgPSAxO1xuICBlbHNlIGJyb3dzZXIubXNpZSA9IDA7XG4gIENsaXBwZXJMaWIuYmlnaW50ZWdlcl91c2VkID0gbnVsbDtcblxuICAvLyBDb3B5cmlnaHQgKGMpIDIwMDUgIFRvbSBXdVxuICAvLyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICAvLyBTZWUgXCJMSUNFTlNFXCIgZm9yIGRldGFpbHMuXG4gIC8vIEJhc2ljIEphdmFTY3JpcHQgQk4gbGlicmFyeSAtIHN1YnNldCB1c2VmdWwgZm9yIFJTQSBlbmNyeXB0aW9uLlxuICAvLyBCaXRzIHBlciBkaWdpdFxuICB2YXIgZGJpdHM7XG4gIC8vIEphdmFTY3JpcHQgZW5naW5lIGFuYWx5c2lzXG4gIHZhciBjYW5hcnkgPSAweGRlYWRiZWVmY2FmZTtcbiAgdmFyIGpfbG0gPSAoKGNhbmFyeSAmIDB4ZmZmZmZmKSA9PSAweGVmY2FmZSk7XG4gIC8vIChwdWJsaWMpIENvbnN0cnVjdG9yXG4gIGZ1bmN0aW9uIEJpZ0ludGVnZXIoYSwgYiwgYylcbiAge1xuICAgIC8vIFRoaXMgdGVzdCB2YXJpYWJsZSBjYW4gYmUgcmVtb3ZlZCxcbiAgICAvLyBidXQgYXQgbGVhc3QgZm9yIHBlcmZvcm1hbmNlIHRlc3RzIGl0IGlzIHVzZWZ1bCBwaWVjZSBvZiBrbm93bGVkZ2VcbiAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IENsaXBwZXJMaWIgcmVsYXRlZCB2YXJpYWJsZSBpbiBCaWdJbnRlZ2VyIGxpYnJhcnlcbiAgICBDbGlwcGVyTGliLmJpZ2ludGVnZXJfdXNlZCA9IDE7XG4gICAgaWYgKGEgIT0gbnVsbClcbiAgICAgIGlmIChcIm51bWJlclwiID09IHR5cGVvZiBhICYmIFwidW5kZWZpbmVkXCIgPT0gdHlwZW9mIChiKSkgdGhpcy5mcm9tSW50KGEpOyAvLyBmYXN0ZXIgY29udmVyc2lvblxuICAgICAgZWxzZSBpZiAoXCJudW1iZXJcIiA9PSB0eXBlb2YgYSkgdGhpcy5mcm9tTnVtYmVyKGEsIGIsIGMpO1xuICAgIGVsc2UgaWYgKGIgPT0gbnVsbCAmJiBcInN0cmluZ1wiICE9IHR5cGVvZiBhKSB0aGlzLmZyb21TdHJpbmcoYSwgMjU2KTtcbiAgICBlbHNlIHRoaXMuZnJvbVN0cmluZyhhLCBiKTtcbiAgfVxuICAvLyByZXR1cm4gbmV3LCB1bnNldCBCaWdJbnRlZ2VyXG4gIGZ1bmN0aW9uIG5iaSgpXG4gIHtcbiAgICByZXR1cm4gbmV3IEJpZ0ludGVnZXIobnVsbCx1bmRlZmluZWQsdW5kZWZpbmVkKTtcbiAgfVxuICAvLyBhbTogQ29tcHV0ZSB3X2ogKz0gKHgqdGhpc19pKSwgcHJvcGFnYXRlIGNhcnJpZXMsXG4gIC8vIGMgaXMgaW5pdGlhbCBjYXJyeSwgcmV0dXJucyBmaW5hbCBjYXJyeS5cbiAgLy8gYyA8IDMqZHZhbHVlLCB4IDwgMipkdmFsdWUsIHRoaXNfaSA8IGR2YWx1ZVxuICAvLyBXZSBuZWVkIHRvIHNlbGVjdCB0aGUgZmFzdGVzdCBvbmUgdGhhdCB3b3JrcyBpbiB0aGlzIGVudmlyb25tZW50LlxuICAvLyBhbTE6IHVzZSBhIHNpbmdsZSBtdWx0IGFuZCBkaXZpZGUgdG8gZ2V0IHRoZSBoaWdoIGJpdHMsXG4gIC8vIG1heCBkaWdpdCBiaXRzIHNob3VsZCBiZSAyNiBiZWNhdXNlXG4gIC8vIG1heCBpbnRlcm5hbCB2YWx1ZSA9IDIqZHZhbHVlXjItMipkdmFsdWUgKDwgMl41MylcbiAgZnVuY3Rpb24gYW0xKGksIHgsIHcsIGosIGMsIG4pXG4gIHtcbiAgICB3aGlsZSAoLS1uID49IDApXG4gICAge1xuICAgICAgdmFyIHYgPSB4ICogdGhpc1tpKytdICsgd1tqXSArIGM7XG4gICAgICBjID0gTWF0aC5mbG9vcih2IC8gMHg0MDAwMDAwKTtcbiAgICAgIHdbaisrXSA9IHYgJiAweDNmZmZmZmY7XG4gICAgfVxuICAgIHJldHVybiBjO1xuICB9XG4gIC8vIGFtMiBhdm9pZHMgYSBiaWcgbXVsdC1hbmQtZXh0cmFjdCBjb21wbGV0ZWx5LlxuICAvLyBNYXggZGlnaXQgYml0cyBzaG91bGQgYmUgPD0gMzAgYmVjYXVzZSB3ZSBkbyBiaXR3aXNlIG9wc1xuICAvLyBvbiB2YWx1ZXMgdXAgdG8gMipoZHZhbHVlXjItaGR2YWx1ZS0xICg8IDJeMzEpXG4gIGZ1bmN0aW9uIGFtMihpLCB4LCB3LCBqLCBjLCBuKVxuICB7XG4gICAgdmFyIHhsID0geCAmIDB4N2ZmZixcbiAgICAgIHhoID0geCA+PiAxNTtcbiAgICB3aGlsZSAoLS1uID49IDApXG4gICAge1xuICAgICAgdmFyIGwgPSB0aGlzW2ldICYgMHg3ZmZmO1xuICAgICAgdmFyIGggPSB0aGlzW2krK10gPj4gMTU7XG4gICAgICB2YXIgbSA9IHhoICogbCArIGggKiB4bDtcbiAgICAgIGwgPSB4bCAqIGwgKyAoKG0gJiAweDdmZmYpIDw8IDE1KSArIHdbal0gKyAoYyAmIDB4M2ZmZmZmZmYpO1xuICAgICAgYyA9IChsID4+PiAzMCkgKyAobSA+Pj4gMTUpICsgeGggKiBoICsgKGMgPj4+IDMwKTtcbiAgICAgIHdbaisrXSA9IGwgJiAweDNmZmZmZmZmO1xuICAgIH1cbiAgICByZXR1cm4gYztcbiAgfVxuICAvLyBBbHRlcm5hdGVseSwgc2V0IG1heCBkaWdpdCBiaXRzIHRvIDI4IHNpbmNlIHNvbWVcbiAgLy8gYnJvd3NlcnMgc2xvdyBkb3duIHdoZW4gZGVhbGluZyB3aXRoIDMyLWJpdCBudW1iZXJzLlxuICBmdW5jdGlvbiBhbTMoaSwgeCwgdywgaiwgYywgbilcbiAge1xuICAgIHZhciB4bCA9IHggJiAweDNmZmYsXG4gICAgICB4aCA9IHggPj4gMTQ7XG4gICAgd2hpbGUgKC0tbiA+PSAwKVxuICAgIHtcbiAgICAgIHZhciBsID0gdGhpc1tpXSAmIDB4M2ZmZjtcbiAgICAgIHZhciBoID0gdGhpc1tpKytdID4+IDE0O1xuICAgICAgdmFyIG0gPSB4aCAqIGwgKyBoICogeGw7XG4gICAgICBsID0geGwgKiBsICsgKChtICYgMHgzZmZmKSA8PCAxNCkgKyB3W2pdICsgYztcbiAgICAgIGMgPSAobCA+PiAyOCkgKyAobSA+PiAxNCkgKyB4aCAqIGg7XG4gICAgICB3W2orK10gPSBsICYgMHhmZmZmZmZmO1xuICAgIH1cbiAgICByZXR1cm4gYztcbiAgfVxuICBpZiAoal9sbSAmJiAobmF2aWdhdG9yX2FwcE5hbWUgPT0gXCJNaWNyb3NvZnQgSW50ZXJuZXQgRXhwbG9yZXJcIikpXG4gIHtcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hbSA9IGFtMjtcbiAgICBkYml0cyA9IDMwO1xuICB9XG4gIGVsc2UgaWYgKGpfbG0gJiYgKG5hdmlnYXRvcl9hcHBOYW1lICE9IFwiTmV0c2NhcGVcIikpXG4gIHtcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hbSA9IGFtMTtcbiAgICBkYml0cyA9IDI2O1xuICB9XG4gIGVsc2VcbiAgeyAvLyBNb3ppbGxhL05ldHNjYXBlIHNlZW1zIHRvIHByZWZlciBhbTNcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hbSA9IGFtMztcbiAgICBkYml0cyA9IDI4O1xuICB9XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLkRCID0gZGJpdHM7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLkRNID0gKCgxIDw8IGRiaXRzKSAtIDEpO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5EViA9ICgxIDw8IGRiaXRzKTtcbiAgdmFyIEJJX0ZQID0gNTI7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLkZWID0gTWF0aC5wb3coMiwgQklfRlApO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5GMSA9IEJJX0ZQIC0gZGJpdHM7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLkYyID0gMiAqIGRiaXRzIC0gQklfRlA7XG4gIC8vIERpZ2l0IGNvbnZlcnNpb25zXG4gIHZhciBCSV9STSA9IFwiMDEyMzQ1Njc4OWFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6XCI7XG4gIHZhciBCSV9SQyA9IG5ldyBBcnJheSgpO1xuICB2YXIgcnIsIHZ2O1xuICByciA9IFwiMFwiLmNoYXJDb2RlQXQoMCk7XG4gIGZvciAodnYgPSAwOyB2diA8PSA5OyArK3Z2KSBCSV9SQ1tycisrXSA9IHZ2O1xuICByciA9IFwiYVwiLmNoYXJDb2RlQXQoMCk7XG4gIGZvciAodnYgPSAxMDsgdnYgPCAzNjsgKyt2dikgQklfUkNbcnIrK10gPSB2djtcbiAgcnIgPSBcIkFcIi5jaGFyQ29kZUF0KDApO1xuICBmb3IgKHZ2ID0gMTA7IHZ2IDwgMzY7ICsrdnYpIEJJX1JDW3JyKytdID0gdnY7XG5cbiAgZnVuY3Rpb24gaW50MmNoYXIobilcbiAge1xuICAgIHJldHVybiBCSV9STS5jaGFyQXQobik7XG4gIH1cblxuICBmdW5jdGlvbiBpbnRBdChzLCBpKVxuICB7XG4gICAgdmFyIGMgPSBCSV9SQ1tzLmNoYXJDb2RlQXQoaSldO1xuICAgIHJldHVybiAoYyA9PSBudWxsKSA/IC0xIDogYztcbiAgfVxuICAvLyAocHJvdGVjdGVkKSBjb3B5IHRoaXMgdG8gclxuICBmdW5jdGlvbiBibnBDb3B5VG8ocilcbiAge1xuICAgIGZvciAodmFyIGkgPSB0aGlzLnQgLSAxOyBpID49IDA7IC0taSkgcltpXSA9IHRoaXNbaV07XG4gICAgci50ID0gdGhpcy50O1xuICAgIHIucyA9IHRoaXMucztcbiAgfVxuICAvLyAocHJvdGVjdGVkKSBzZXQgZnJvbSBpbnRlZ2VyIHZhbHVlIHgsIC1EViA8PSB4IDwgRFZcbiAgZnVuY3Rpb24gYm5wRnJvbUludCh4KVxuICB7XG4gICAgdGhpcy50ID0gMTtcbiAgICB0aGlzLnMgPSAoeCA8IDApID8gLTEgOiAwO1xuICAgIGlmICh4ID4gMCkgdGhpc1swXSA9IHg7XG4gICAgZWxzZSBpZiAoeCA8IC0xKSB0aGlzWzBdID0geCArIHRoaXMuRFY7XG4gICAgZWxzZSB0aGlzLnQgPSAwO1xuICB9XG4gIC8vIHJldHVybiBiaWdpbnQgaW5pdGlhbGl6ZWQgdG8gdmFsdWVcbiAgZnVuY3Rpb24gbmJ2KGkpXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHIuZnJvbUludChpKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSBzZXQgZnJvbSBzdHJpbmcgYW5kIHJhZGl4XG4gIGZ1bmN0aW9uIGJucEZyb21TdHJpbmcocywgYilcbiAge1xuICAgIHZhciBrO1xuICAgIGlmIChiID09IDE2KSBrID0gNDtcbiAgICBlbHNlIGlmIChiID09IDgpIGsgPSAzO1xuICAgIGVsc2UgaWYgKGIgPT0gMjU2KSBrID0gODsgLy8gYnl0ZSBhcnJheVxuICAgIGVsc2UgaWYgKGIgPT0gMikgayA9IDE7XG4gICAgZWxzZSBpZiAoYiA9PSAzMikgayA9IDU7XG4gICAgZWxzZSBpZiAoYiA9PSA0KSBrID0gMjtcbiAgICBlbHNlXG4gICAge1xuICAgICAgdGhpcy5mcm9tUmFkaXgocywgYik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMudCA9IDA7XG4gICAgdGhpcy5zID0gMDtcbiAgICB2YXIgaSA9IHMubGVuZ3RoLFxuICAgICAgbWkgPSBmYWxzZSxcbiAgICAgIHNoID0gMDtcbiAgICB3aGlsZSAoLS1pID49IDApXG4gICAge1xuICAgICAgdmFyIHggPSAoayA9PSA4KSA/IHNbaV0gJiAweGZmIDogaW50QXQocywgaSk7XG4gICAgICBpZiAoeCA8IDApXG4gICAgICB7XG4gICAgICAgIGlmIChzLmNoYXJBdChpKSA9PSBcIi1cIikgbWkgPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIG1pID0gZmFsc2U7XG4gICAgICBpZiAoc2ggPT0gMClcbiAgICAgICAgdGhpc1t0aGlzLnQrK10gPSB4O1xuICAgICAgZWxzZSBpZiAoc2ggKyBrID4gdGhpcy5EQilcbiAgICAgIHtcbiAgICAgICAgdGhpc1t0aGlzLnQgLSAxXSB8PSAoeCAmICgoMSA8PCAodGhpcy5EQiAtIHNoKSkgLSAxKSkgPDwgc2g7XG4gICAgICAgIHRoaXNbdGhpcy50KytdID0gKHggPj4gKHRoaXMuREIgLSBzaCkpO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAgICB0aGlzW3RoaXMudCAtIDFdIHw9IHggPDwgc2g7XG4gICAgICBzaCArPSBrO1xuICAgICAgaWYgKHNoID49IHRoaXMuREIpIHNoIC09IHRoaXMuREI7XG4gICAgfVxuICAgIGlmIChrID09IDggJiYgKHNbMF0gJiAweDgwKSAhPSAwKVxuICAgIHtcbiAgICAgIHRoaXMucyA9IC0xO1xuICAgICAgaWYgKHNoID4gMCkgdGhpc1t0aGlzLnQgLSAxXSB8PSAoKDEgPDwgKHRoaXMuREIgLSBzaCkpIC0gMSkgPDwgc2g7XG4gICAgfVxuICAgIHRoaXMuY2xhbXAoKTtcbiAgICBpZiAobWkpIEJpZ0ludGVnZXIuWkVSTy5zdWJUbyh0aGlzLCB0aGlzKTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSBjbGFtcCBvZmYgZXhjZXNzIGhpZ2ggd29yZHNcbiAgZnVuY3Rpb24gYm5wQ2xhbXAoKVxuICB7XG4gICAgdmFyIGMgPSB0aGlzLnMgJiB0aGlzLkRNO1xuICAgIHdoaWxlICh0aGlzLnQgPiAwICYmIHRoaXNbdGhpcy50IC0gMV0gPT0gYyktLXRoaXMudDtcbiAgfVxuICAvLyAocHVibGljKSByZXR1cm4gc3RyaW5nIHJlcHJlc2VudGF0aW9uIGluIGdpdmVuIHJhZGl4XG4gIGZ1bmN0aW9uIGJuVG9TdHJpbmcoYilcbiAge1xuICAgIGlmICh0aGlzLnMgPCAwKSByZXR1cm4gXCItXCIgKyB0aGlzLm5lZ2F0ZSgpLnRvU3RyaW5nKGIpO1xuICAgIHZhciBrO1xuICAgIGlmIChiID09IDE2KSBrID0gNDtcbiAgICBlbHNlIGlmIChiID09IDgpIGsgPSAzO1xuICAgIGVsc2UgaWYgKGIgPT0gMikgayA9IDE7XG4gICAgZWxzZSBpZiAoYiA9PSAzMikgayA9IDU7XG4gICAgZWxzZSBpZiAoYiA9PSA0KSBrID0gMjtcbiAgICBlbHNlIHJldHVybiB0aGlzLnRvUmFkaXgoYik7XG4gICAgdmFyIGttID0gKDEgPDwgaykgLSAxLFxuICAgICAgZCwgbSA9IGZhbHNlLFxuICAgICAgciA9IFwiXCIsXG4gICAgICBpID0gdGhpcy50O1xuICAgIHZhciBwID0gdGhpcy5EQiAtIChpICogdGhpcy5EQikgJSBrO1xuICAgIGlmIChpLS0gPiAwKVxuICAgIHtcbiAgICAgIGlmIChwIDwgdGhpcy5EQiAmJiAoZCA9IHRoaXNbaV0gPj4gcCkgPiAwKVxuICAgICAge1xuICAgICAgICBtID0gdHJ1ZTtcbiAgICAgICAgciA9IGludDJjaGFyKGQpO1xuICAgICAgfVxuICAgICAgd2hpbGUgKGkgPj0gMClcbiAgICAgIHtcbiAgICAgICAgaWYgKHAgPCBrKVxuICAgICAgICB7XG4gICAgICAgICAgZCA9ICh0aGlzW2ldICYgKCgxIDw8IHApIC0gMSkpIDw8IChrIC0gcCk7XG4gICAgICAgICAgZCB8PSB0aGlzWy0taV0gPj4gKHAgKz0gdGhpcy5EQiAtIGspO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgIGQgPSAodGhpc1tpXSA+PiAocCAtPSBrKSkgJiBrbTtcbiAgICAgICAgICBpZiAocCA8PSAwKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHAgKz0gdGhpcy5EQjtcbiAgICAgICAgICAgIC0taTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGQgPiAwKSBtID0gdHJ1ZTtcbiAgICAgICAgaWYgKG0pIHIgKz0gaW50MmNoYXIoZCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtID8gciA6IFwiMFwiO1xuICB9XG4gIC8vIChwdWJsaWMpIC10aGlzXG4gIGZ1bmN0aW9uIGJuTmVnYXRlKClcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgQmlnSW50ZWdlci5aRVJPLnN1YlRvKHRoaXMsIHIpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIHx0aGlzfFxuICBmdW5jdGlvbiBibkFicygpXG4gIHtcbiAgICByZXR1cm4gKHRoaXMucyA8IDApID8gdGhpcy5uZWdhdGUoKSA6IHRoaXM7XG4gIH1cbiAgLy8gKHB1YmxpYykgcmV0dXJuICsgaWYgdGhpcyA+IGEsIC0gaWYgdGhpcyA8IGEsIDAgaWYgZXF1YWxcbiAgZnVuY3Rpb24gYm5Db21wYXJlVG8oYSlcbiAge1xuICAgIHZhciByID0gdGhpcy5zIC0gYS5zO1xuICAgIGlmIChyICE9IDApIHJldHVybiByO1xuICAgIHZhciBpID0gdGhpcy50O1xuICAgIHIgPSBpIC0gYS50O1xuICAgIGlmIChyICE9IDApIHJldHVybiAodGhpcy5zIDwgMCkgPyAtciA6IHI7XG4gICAgd2hpbGUgKC0taSA+PSAwKVxuICAgICAgaWYgKChyID0gdGhpc1tpXSAtIGFbaV0pICE9IDApIHJldHVybiByO1xuICAgIHJldHVybiAwO1xuICB9XG4gIC8vIHJldHVybnMgYml0IGxlbmd0aCBvZiB0aGUgaW50ZWdlciB4XG4gIGZ1bmN0aW9uIG5iaXRzKHgpXG4gIHtcbiAgICB2YXIgciA9IDEsXG4gICAgICB0O1xuICAgIGlmICgodCA9IHggPj4+IDE2KSAhPSAwKVxuICAgIHtcbiAgICAgIHggPSB0O1xuICAgICAgciArPSAxNjtcbiAgICB9XG4gICAgaWYgKCh0ID0geCA+PiA4KSAhPSAwKVxuICAgIHtcbiAgICAgIHggPSB0O1xuICAgICAgciArPSA4O1xuICAgIH1cbiAgICBpZiAoKHQgPSB4ID4+IDQpICE9IDApXG4gICAge1xuICAgICAgeCA9IHQ7XG4gICAgICByICs9IDQ7XG4gICAgfVxuICAgIGlmICgodCA9IHggPj4gMikgIT0gMClcbiAgICB7XG4gICAgICB4ID0gdDtcbiAgICAgIHIgKz0gMjtcbiAgICB9XG4gICAgaWYgKCh0ID0geCA+PiAxKSAhPSAwKVxuICAgIHtcbiAgICAgIHggPSB0O1xuICAgICAgciArPSAxO1xuICAgIH1cbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSByZXR1cm4gdGhlIG51bWJlciBvZiBiaXRzIGluIFwidGhpc1wiXG4gIGZ1bmN0aW9uIGJuQml0TGVuZ3RoKClcbiAge1xuICAgIGlmICh0aGlzLnQgPD0gMCkgcmV0dXJuIDA7XG4gICAgcmV0dXJuIHRoaXMuREIgKiAodGhpcy50IC0gMSkgKyBuYml0cyh0aGlzW3RoaXMudCAtIDFdIF4gKHRoaXMucyAmIHRoaXMuRE0pKTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSByID0gdGhpcyA8PCBuKkRCXG4gIGZ1bmN0aW9uIGJucERMU2hpZnRUbyhuLCByKVxuICB7XG4gICAgdmFyIGk7XG4gICAgZm9yIChpID0gdGhpcy50IC0gMTsgaSA+PSAwOyAtLWkpIHJbaSArIG5dID0gdGhpc1tpXTtcbiAgICBmb3IgKGkgPSBuIC0gMTsgaSA+PSAwOyAtLWkpIHJbaV0gPSAwO1xuICAgIHIudCA9IHRoaXMudCArIG47XG4gICAgci5zID0gdGhpcy5zO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzID4+IG4qREJcbiAgZnVuY3Rpb24gYm5wRFJTaGlmdFRvKG4sIHIpXG4gIHtcbiAgICBmb3IgKHZhciBpID0gbjsgaSA8IHRoaXMudDsgKytpKSByW2kgLSBuXSA9IHRoaXNbaV07XG4gICAgci50ID0gTWF0aC5tYXgodGhpcy50IC0gbiwgMCk7XG4gICAgci5zID0gdGhpcy5zO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzIDw8IG5cbiAgZnVuY3Rpb24gYm5wTFNoaWZ0VG8obiwgcilcbiAge1xuICAgIHZhciBicyA9IG4gJSB0aGlzLkRCO1xuICAgIHZhciBjYnMgPSB0aGlzLkRCIC0gYnM7XG4gICAgdmFyIGJtID0gKDEgPDwgY2JzKSAtIDE7XG4gICAgdmFyIGRzID0gTWF0aC5mbG9vcihuIC8gdGhpcy5EQiksXG4gICAgICBjID0gKHRoaXMucyA8PCBicykgJiB0aGlzLkRNLFxuICAgICAgaTtcbiAgICBmb3IgKGkgPSB0aGlzLnQgLSAxOyBpID49IDA7IC0taSlcbiAgICB7XG4gICAgICByW2kgKyBkcyArIDFdID0gKHRoaXNbaV0gPj4gY2JzKSB8IGM7XG4gICAgICBjID0gKHRoaXNbaV0gJiBibSkgPDwgYnM7XG4gICAgfVxuICAgIGZvciAoaSA9IGRzIC0gMTsgaSA+PSAwOyAtLWkpIHJbaV0gPSAwO1xuICAgIHJbZHNdID0gYztcbiAgICByLnQgPSB0aGlzLnQgKyBkcyArIDE7XG4gICAgci5zID0gdGhpcy5zO1xuICAgIHIuY2xhbXAoKTtcbiAgfVxuICAvLyAocHJvdGVjdGVkKSByID0gdGhpcyA+PiBuXG4gIGZ1bmN0aW9uIGJucFJTaGlmdFRvKG4sIHIpXG4gIHtcbiAgICByLnMgPSB0aGlzLnM7XG4gICAgdmFyIGRzID0gTWF0aC5mbG9vcihuIC8gdGhpcy5EQik7XG4gICAgaWYgKGRzID49IHRoaXMudClcbiAgICB7XG4gICAgICByLnQgPSAwO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgYnMgPSBuICUgdGhpcy5EQjtcbiAgICB2YXIgY2JzID0gdGhpcy5EQiAtIGJzO1xuICAgIHZhciBibSA9ICgxIDw8IGJzKSAtIDE7XG4gICAgclswXSA9IHRoaXNbZHNdID4+IGJzO1xuICAgIGZvciAodmFyIGkgPSBkcyArIDE7IGkgPCB0aGlzLnQ7ICsraSlcbiAgICB7XG4gICAgICByW2kgLSBkcyAtIDFdIHw9ICh0aGlzW2ldICYgYm0pIDw8IGNicztcbiAgICAgIHJbaSAtIGRzXSA9IHRoaXNbaV0gPj4gYnM7XG4gICAgfVxuICAgIGlmIChicyA+IDApIHJbdGhpcy50IC0gZHMgLSAxXSB8PSAodGhpcy5zICYgYm0pIDw8IGNicztcbiAgICByLnQgPSB0aGlzLnQgLSBkcztcbiAgICByLmNsYW1wKCk7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgLSBhXG4gIGZ1bmN0aW9uIGJucFN1YlRvKGEsIHIpXG4gIHtcbiAgICB2YXIgaSA9IDAsXG4gICAgICBjID0gMCxcbiAgICAgIG0gPSBNYXRoLm1pbihhLnQsIHRoaXMudCk7XG4gICAgd2hpbGUgKGkgPCBtKVxuICAgIHtcbiAgICAgIGMgKz0gdGhpc1tpXSAtIGFbaV07XG4gICAgICByW2krK10gPSBjICYgdGhpcy5ETTtcbiAgICAgIGMgPj49IHRoaXMuREI7XG4gICAgfVxuICAgIGlmIChhLnQgPCB0aGlzLnQpXG4gICAge1xuICAgICAgYyAtPSBhLnM7XG4gICAgICB3aGlsZSAoaSA8IHRoaXMudClcbiAgICAgIHtcbiAgICAgICAgYyArPSB0aGlzW2ldO1xuICAgICAgICByW2krK10gPSBjICYgdGhpcy5ETTtcbiAgICAgICAgYyA+Pj0gdGhpcy5EQjtcbiAgICAgIH1cbiAgICAgIGMgKz0gdGhpcy5zO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgYyArPSB0aGlzLnM7XG4gICAgICB3aGlsZSAoaSA8IGEudClcbiAgICAgIHtcbiAgICAgICAgYyAtPSBhW2ldO1xuICAgICAgICByW2krK10gPSBjICYgdGhpcy5ETTtcbiAgICAgICAgYyA+Pj0gdGhpcy5EQjtcbiAgICAgIH1cbiAgICAgIGMgLT0gYS5zO1xuICAgIH1cbiAgICByLnMgPSAoYyA8IDApID8gLTEgOiAwO1xuICAgIGlmIChjIDwgLTEpIHJbaSsrXSA9IHRoaXMuRFYgKyBjO1xuICAgIGVsc2UgaWYgKGMgPiAwKSByW2krK10gPSBjO1xuICAgIHIudCA9IGk7XG4gICAgci5jbGFtcCgpO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzICogYSwgciAhPSB0aGlzLGEgKEhBQyAxNC4xMilcbiAgLy8gXCJ0aGlzXCIgc2hvdWxkIGJlIHRoZSBsYXJnZXIgb25lIGlmIGFwcHJvcHJpYXRlLlxuICBmdW5jdGlvbiBibnBNdWx0aXBseVRvKGEsIHIpXG4gIHtcbiAgICB2YXIgeCA9IHRoaXMuYWJzKCksXG4gICAgICB5ID0gYS5hYnMoKTtcbiAgICB2YXIgaSA9IHgudDtcbiAgICByLnQgPSBpICsgeS50O1xuICAgIHdoaWxlICgtLWkgPj0gMCkgcltpXSA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IHkudDsgKytpKSByW2kgKyB4LnRdID0geC5hbSgwLCB5W2ldLCByLCBpLCAwLCB4LnQpO1xuICAgIHIucyA9IDA7XG4gICAgci5jbGFtcCgpO1xuICAgIGlmICh0aGlzLnMgIT0gYS5zKSBCaWdJbnRlZ2VyLlpFUk8uc3ViVG8ociwgcik7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgciA9IHRoaXNeMiwgciAhPSB0aGlzIChIQUMgMTQuMTYpXG4gIGZ1bmN0aW9uIGJucFNxdWFyZVRvKHIpXG4gIHtcbiAgICB2YXIgeCA9IHRoaXMuYWJzKCk7XG4gICAgdmFyIGkgPSByLnQgPSAyICogeC50O1xuICAgIHdoaWxlICgtLWkgPj0gMCkgcltpXSA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IHgudCAtIDE7ICsraSlcbiAgICB7XG4gICAgICB2YXIgYyA9IHguYW0oaSwgeFtpXSwgciwgMiAqIGksIDAsIDEpO1xuICAgICAgaWYgKChyW2kgKyB4LnRdICs9IHguYW0oaSArIDEsIDIgKiB4W2ldLCByLCAyICogaSArIDEsIGMsIHgudCAtIGkgLSAxKSkgPj0geC5EVilcbiAgICAgIHtcbiAgICAgICAgcltpICsgeC50XSAtPSB4LkRWO1xuICAgICAgICByW2kgKyB4LnQgKyAxXSA9IDE7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChyLnQgPiAwKSByW3IudCAtIDFdICs9IHguYW0oaSwgeFtpXSwgciwgMiAqIGksIDAsIDEpO1xuICAgIHIucyA9IDA7XG4gICAgci5jbGFtcCgpO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIGRpdmlkZSB0aGlzIGJ5IG0sIHF1b3RpZW50IGFuZCByZW1haW5kZXIgdG8gcSwgciAoSEFDIDE0LjIwKVxuICAvLyByICE9IHEsIHRoaXMgIT0gbS4gIHEgb3IgciBtYXkgYmUgbnVsbC5cbiAgZnVuY3Rpb24gYm5wRGl2UmVtVG8obSwgcSwgcilcbiAge1xuICAgIHZhciBwbSA9IG0uYWJzKCk7XG4gICAgaWYgKHBtLnQgPD0gMCkgcmV0dXJuO1xuICAgIHZhciBwdCA9IHRoaXMuYWJzKCk7XG4gICAgaWYgKHB0LnQgPCBwbS50KVxuICAgIHtcbiAgICAgIGlmIChxICE9IG51bGwpIHEuZnJvbUludCgwKTtcbiAgICAgIGlmIChyICE9IG51bGwpIHRoaXMuY29weVRvKHIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAociA9PSBudWxsKSByID0gbmJpKCk7XG4gICAgdmFyIHkgPSBuYmkoKSxcbiAgICAgIHRzID0gdGhpcy5zLFxuICAgICAgbXMgPSBtLnM7XG4gICAgdmFyIG5zaCA9IHRoaXMuREIgLSBuYml0cyhwbVtwbS50IC0gMV0pOyAvLyBub3JtYWxpemUgbW9kdWx1c1xuICAgIGlmIChuc2ggPiAwKVxuICAgIHtcbiAgICAgIHBtLmxTaGlmdFRvKG5zaCwgeSk7XG4gICAgICBwdC5sU2hpZnRUbyhuc2gsIHIpO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgcG0uY29weVRvKHkpO1xuICAgICAgcHQuY29weVRvKHIpO1xuICAgIH1cbiAgICB2YXIgeXMgPSB5LnQ7XG4gICAgdmFyIHkwID0geVt5cyAtIDFdO1xuICAgIGlmICh5MCA9PSAwKSByZXR1cm47XG4gICAgdmFyIHl0ID0geTAgKiAoMSA8PCB0aGlzLkYxKSArICgoeXMgPiAxKSA/IHlbeXMgLSAyXSA+PiB0aGlzLkYyIDogMCk7XG4gICAgdmFyIGQxID0gdGhpcy5GViAvIHl0LFxuICAgICAgZDIgPSAoMSA8PCB0aGlzLkYxKSAvIHl0LFxuICAgICAgZSA9IDEgPDwgdGhpcy5GMjtcbiAgICB2YXIgaSA9IHIudCxcbiAgICAgIGogPSBpIC0geXMsXG4gICAgICB0ID0gKHEgPT0gbnVsbCkgPyBuYmkoKSA6IHE7XG4gICAgeS5kbFNoaWZ0VG8oaiwgdCk7XG4gICAgaWYgKHIuY29tcGFyZVRvKHQpID49IDApXG4gICAge1xuICAgICAgcltyLnQrK10gPSAxO1xuICAgICAgci5zdWJUbyh0LCByKTtcbiAgICB9XG4gICAgQmlnSW50ZWdlci5PTkUuZGxTaGlmdFRvKHlzLCB0KTtcbiAgICB0LnN1YlRvKHksIHkpOyAvLyBcIm5lZ2F0aXZlXCIgeSBzbyB3ZSBjYW4gcmVwbGFjZSBzdWIgd2l0aCBhbSBsYXRlclxuICAgIHdoaWxlICh5LnQgPCB5cykgeVt5LnQrK10gPSAwO1xuICAgIHdoaWxlICgtLWogPj0gMClcbiAgICB7XG4gICAgICAvLyBFc3RpbWF0ZSBxdW90aWVudCBkaWdpdFxuICAgICAgdmFyIHFkID0gKHJbLS1pXSA9PSB5MCkgPyB0aGlzLkRNIDogTWF0aC5mbG9vcihyW2ldICogZDEgKyAocltpIC0gMV0gKyBlKSAqIGQyKTtcbiAgICAgIGlmICgocltpXSArPSB5LmFtKDAsIHFkLCByLCBqLCAwLCB5cykpIDwgcWQpXG4gICAgICB7IC8vIFRyeSBpdCBvdXRcbiAgICAgICAgeS5kbFNoaWZ0VG8oaiwgdCk7XG4gICAgICAgIHIuc3ViVG8odCwgcik7XG4gICAgICAgIHdoaWxlIChyW2ldIDwgLS1xZCkgci5zdWJUbyh0LCByKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHEgIT0gbnVsbClcbiAgICB7XG4gICAgICByLmRyU2hpZnRUbyh5cywgcSk7XG4gICAgICBpZiAodHMgIT0gbXMpIEJpZ0ludGVnZXIuWkVSTy5zdWJUbyhxLCBxKTtcbiAgICB9XG4gICAgci50ID0geXM7XG4gICAgci5jbGFtcCgpO1xuICAgIGlmIChuc2ggPiAwKSByLnJTaGlmdFRvKG5zaCwgcik7IC8vIERlbm9ybWFsaXplIHJlbWFpbmRlclxuICAgIGlmICh0cyA8IDApIEJpZ0ludGVnZXIuWkVSTy5zdWJUbyhyLCByKTtcbiAgfVxuICAvLyAocHVibGljKSB0aGlzIG1vZCBhXG4gIGZ1bmN0aW9uIGJuTW9kKGEpXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHRoaXMuYWJzKCkuZGl2UmVtVG8oYSwgbnVsbCwgcik7XG4gICAgaWYgKHRoaXMucyA8IDAgJiYgci5jb21wYXJlVG8oQmlnSW50ZWdlci5aRVJPKSA+IDApIGEuc3ViVG8ociwgcik7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gTW9kdWxhciByZWR1Y3Rpb24gdXNpbmcgXCJjbGFzc2ljXCIgYWxnb3JpdGhtXG4gIGZ1bmN0aW9uIENsYXNzaWMobSlcbiAge1xuICAgIHRoaXMubSA9IG07XG4gIH1cblxuICBmdW5jdGlvbiBjQ29udmVydCh4KVxuICB7XG4gICAgaWYgKHgucyA8IDAgfHwgeC5jb21wYXJlVG8odGhpcy5tKSA+PSAwKSByZXR1cm4geC5tb2QodGhpcy5tKTtcbiAgICBlbHNlIHJldHVybiB4O1xuICB9XG5cbiAgZnVuY3Rpb24gY1JldmVydCh4KVxuICB7XG4gICAgcmV0dXJuIHg7XG4gIH1cblxuICBmdW5jdGlvbiBjUmVkdWNlKHgpXG4gIHtcbiAgICB4LmRpdlJlbVRvKHRoaXMubSwgbnVsbCwgeCk7XG4gIH1cblxuICBmdW5jdGlvbiBjTXVsVG8oeCwgeSwgcilcbiAge1xuICAgIHgubXVsdGlwbHlUbyh5LCByKTtcbiAgICB0aGlzLnJlZHVjZShyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNTcXJUbyh4LCByKVxuICB7XG4gICAgeC5zcXVhcmVUbyhyKTtcbiAgICB0aGlzLnJlZHVjZShyKTtcbiAgfVxuICBDbGFzc2ljLnByb3RvdHlwZS5jb252ZXJ0ID0gY0NvbnZlcnQ7XG4gIENsYXNzaWMucHJvdG90eXBlLnJldmVydCA9IGNSZXZlcnQ7XG4gIENsYXNzaWMucHJvdG90eXBlLnJlZHVjZSA9IGNSZWR1Y2U7XG4gIENsYXNzaWMucHJvdG90eXBlLm11bFRvID0gY011bFRvO1xuICBDbGFzc2ljLnByb3RvdHlwZS5zcXJUbyA9IGNTcXJUbztcbiAgLy8gKHByb3RlY3RlZCkgcmV0dXJuIFwiLTEvdGhpcyAlIDJeREJcIjsgdXNlZnVsIGZvciBNb250LiByZWR1Y3Rpb25cbiAgLy8ganVzdGlmaWNhdGlvbjpcbiAgLy8gICAgICAgICB4eSA9PSAxIChtb2QgbSlcbiAgLy8gICAgICAgICB4eSA9ICAxK2ttXG4gIC8vICAgeHkoMi14eSkgPSAoMStrbSkoMS1rbSlcbiAgLy8geFt5KDIteHkpXSA9IDEta14ybV4yXG4gIC8vIHhbeSgyLXh5KV0gPT0gMSAobW9kIG1eMilcbiAgLy8gaWYgeSBpcyAxL3ggbW9kIG0sIHRoZW4geSgyLXh5KSBpcyAxL3ggbW9kIG1eMlxuICAvLyBzaG91bGQgcmVkdWNlIHggYW5kIHkoMi14eSkgYnkgbV4yIGF0IGVhY2ggc3RlcCB0byBrZWVwIHNpemUgYm91bmRlZC5cbiAgLy8gSlMgbXVsdGlwbHkgXCJvdmVyZmxvd3NcIiBkaWZmZXJlbnRseSBmcm9tIEMvQysrLCBzbyBjYXJlIGlzIG5lZWRlZCBoZXJlLlxuICBmdW5jdGlvbiBibnBJbnZEaWdpdCgpXG4gIHtcbiAgICBpZiAodGhpcy50IDwgMSkgcmV0dXJuIDA7XG4gICAgdmFyIHggPSB0aGlzWzBdO1xuICAgIGlmICgoeCAmIDEpID09IDApIHJldHVybiAwO1xuICAgIHZhciB5ID0geCAmIDM7IC8vIHkgPT0gMS94IG1vZCAyXjJcbiAgICB5ID0gKHkgKiAoMiAtICh4ICYgMHhmKSAqIHkpKSAmIDB4ZjsgLy8geSA9PSAxL3ggbW9kIDJeNFxuICAgIHkgPSAoeSAqICgyIC0gKHggJiAweGZmKSAqIHkpKSAmIDB4ZmY7IC8vIHkgPT0gMS94IG1vZCAyXjhcbiAgICB5ID0gKHkgKiAoMiAtICgoKHggJiAweGZmZmYpICogeSkgJiAweGZmZmYpKSkgJiAweGZmZmY7IC8vIHkgPT0gMS94IG1vZCAyXjE2XG4gICAgLy8gbGFzdCBzdGVwIC0gY2FsY3VsYXRlIGludmVyc2UgbW9kIERWIGRpcmVjdGx5O1xuICAgIC8vIGFzc3VtZXMgMTYgPCBEQiA8PSAzMiBhbmQgYXNzdW1lcyBhYmlsaXR5IHRvIGhhbmRsZSA0OC1iaXQgaW50c1xuICAgIHkgPSAoeSAqICgyIC0geCAqIHkgJSB0aGlzLkRWKSkgJSB0aGlzLkRWOyAvLyB5ID09IDEveCBtb2QgMl5kYml0c1xuICAgIC8vIHdlIHJlYWxseSB3YW50IHRoZSBuZWdhdGl2ZSBpbnZlcnNlLCBhbmQgLURWIDwgeSA8IERWXG4gICAgcmV0dXJuICh5ID4gMCkgPyB0aGlzLkRWIC0geSA6IC15O1xuICB9XG4gIC8vIE1vbnRnb21lcnkgcmVkdWN0aW9uXG4gIGZ1bmN0aW9uIE1vbnRnb21lcnkobSlcbiAge1xuICAgIHRoaXMubSA9IG07XG4gICAgdGhpcy5tcCA9IG0uaW52RGlnaXQoKTtcbiAgICB0aGlzLm1wbCA9IHRoaXMubXAgJiAweDdmZmY7XG4gICAgdGhpcy5tcGggPSB0aGlzLm1wID4+IDE1O1xuICAgIHRoaXMudW0gPSAoMSA8PCAobS5EQiAtIDE1KSkgLSAxO1xuICAgIHRoaXMubXQyID0gMiAqIG0udDtcbiAgfVxuICAvLyB4UiBtb2QgbVxuICBmdW5jdGlvbiBtb250Q29udmVydCh4KVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB4LmFicygpLmRsU2hpZnRUbyh0aGlzLm0udCwgcik7XG4gICAgci5kaXZSZW1Ubyh0aGlzLm0sIG51bGwsIHIpO1xuICAgIGlmICh4LnMgPCAwICYmIHIuY29tcGFyZVRvKEJpZ0ludGVnZXIuWkVSTykgPiAwKSB0aGlzLm0uc3ViVG8ociwgcik7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8geC9SIG1vZCBtXG4gIGZ1bmN0aW9uIG1vbnRSZXZlcnQoeClcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgeC5jb3B5VG8ocik7XG4gICAgdGhpcy5yZWR1Y2Uocik7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8geCA9IHgvUiBtb2QgbSAoSEFDIDE0LjMyKVxuICBmdW5jdGlvbiBtb250UmVkdWNlKHgpXG4gIHtcbiAgICB3aGlsZSAoeC50IDw9IHRoaXMubXQyKSAvLyBwYWQgeCBzbyBhbSBoYXMgZW5vdWdoIHJvb20gbGF0ZXJcbiAgICAgIHhbeC50KytdID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubS50OyArK2kpXG4gICAge1xuICAgICAgLy8gZmFzdGVyIHdheSBvZiBjYWxjdWxhdGluZyB1MCA9IHhbaV0qbXAgbW9kIERWXG4gICAgICB2YXIgaiA9IHhbaV0gJiAweDdmZmY7XG4gICAgICB2YXIgdTAgPSAoaiAqIHRoaXMubXBsICsgKCgoaiAqIHRoaXMubXBoICsgKHhbaV0gPj4gMTUpICogdGhpcy5tcGwpICYgdGhpcy51bSkgPDwgMTUpKSAmIHguRE07XG4gICAgICAvLyB1c2UgYW0gdG8gY29tYmluZSB0aGUgbXVsdGlwbHktc2hpZnQtYWRkIGludG8gb25lIGNhbGxcbiAgICAgIGogPSBpICsgdGhpcy5tLnQ7XG4gICAgICB4W2pdICs9IHRoaXMubS5hbSgwLCB1MCwgeCwgaSwgMCwgdGhpcy5tLnQpO1xuICAgICAgLy8gcHJvcGFnYXRlIGNhcnJ5XG4gICAgICB3aGlsZSAoeFtqXSA+PSB4LkRWKVxuICAgICAge1xuICAgICAgICB4W2pdIC09IHguRFY7XG4gICAgICAgIHhbKytqXSsrO1xuICAgICAgfVxuICAgIH1cbiAgICB4LmNsYW1wKCk7XG4gICAgeC5kclNoaWZ0VG8odGhpcy5tLnQsIHgpO1xuICAgIGlmICh4LmNvbXBhcmVUbyh0aGlzLm0pID49IDApIHguc3ViVG8odGhpcy5tLCB4KTtcbiAgfVxuICAvLyByID0gXCJ4XjIvUiBtb2QgbVwiOyB4ICE9IHJcbiAgZnVuY3Rpb24gbW9udFNxclRvKHgsIHIpXG4gIHtcbiAgICB4LnNxdWFyZVRvKHIpO1xuICAgIHRoaXMucmVkdWNlKHIpO1xuICB9XG4gIC8vIHIgPSBcInh5L1IgbW9kIG1cIjsgeCx5ICE9IHJcbiAgZnVuY3Rpb24gbW9udE11bFRvKHgsIHksIHIpXG4gIHtcbiAgICB4Lm11bHRpcGx5VG8oeSwgcik7XG4gICAgdGhpcy5yZWR1Y2Uocik7XG4gIH1cbiAgTW9udGdvbWVyeS5wcm90b3R5cGUuY29udmVydCA9IG1vbnRDb252ZXJ0O1xuICBNb250Z29tZXJ5LnByb3RvdHlwZS5yZXZlcnQgPSBtb250UmV2ZXJ0O1xuICBNb250Z29tZXJ5LnByb3RvdHlwZS5yZWR1Y2UgPSBtb250UmVkdWNlO1xuICBNb250Z29tZXJ5LnByb3RvdHlwZS5tdWxUbyA9IG1vbnRNdWxUbztcbiAgTW9udGdvbWVyeS5wcm90b3R5cGUuc3FyVG8gPSBtb250U3FyVG87XG4gIC8vIChwcm90ZWN0ZWQpIHRydWUgaWZmIHRoaXMgaXMgZXZlblxuICBmdW5jdGlvbiBibnBJc0V2ZW4oKVxuICB7XG4gICAgcmV0dXJuICgodGhpcy50ID4gMCkgPyAodGhpc1swXSAmIDEpIDogdGhpcy5zKSA9PSAwO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHRoaXNeZSwgZSA8IDJeMzIsIGRvaW5nIHNxciBhbmQgbXVsIHdpdGggXCJyXCIgKEhBQyAxNC43OSlcbiAgZnVuY3Rpb24gYm5wRXhwKGUsIHopXG4gIHtcbiAgICBpZiAoZSA+IDB4ZmZmZmZmZmYgfHwgZSA8IDEpIHJldHVybiBCaWdJbnRlZ2VyLk9ORTtcbiAgICB2YXIgciA9IG5iaSgpLFxuICAgICAgcjIgPSBuYmkoKSxcbiAgICAgIGcgPSB6LmNvbnZlcnQodGhpcyksXG4gICAgICBpID0gbmJpdHMoZSkgLSAxO1xuICAgIGcuY29weVRvKHIpO1xuICAgIHdoaWxlICgtLWkgPj0gMClcbiAgICB7XG4gICAgICB6LnNxclRvKHIsIHIyKTtcbiAgICAgIGlmICgoZSAmICgxIDw8IGkpKSA+IDApIHoubXVsVG8ocjIsIGcsIHIpO1xuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICB2YXIgdCA9IHI7XG4gICAgICAgIHIgPSByMjtcbiAgICAgICAgcjIgPSB0O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gei5yZXZlcnQocik7XG4gIH1cbiAgLy8gKHB1YmxpYykgdGhpc15lICUgbSwgMCA8PSBlIDwgMl4zMlxuICBmdW5jdGlvbiBibk1vZFBvd0ludChlLCBtKVxuICB7XG4gICAgdmFyIHo7XG4gICAgaWYgKGUgPCAyNTYgfHwgbS5pc0V2ZW4oKSkgeiA9IG5ldyBDbGFzc2ljKG0pO1xuICAgIGVsc2UgeiA9IG5ldyBNb250Z29tZXJ5KG0pO1xuICAgIHJldHVybiB0aGlzLmV4cChlLCB6KTtcbiAgfVxuICAvLyBwcm90ZWN0ZWRcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuY29weVRvID0gYm5wQ29weVRvO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5mcm9tSW50ID0gYm5wRnJvbUludDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuZnJvbVN0cmluZyA9IGJucEZyb21TdHJpbmc7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmNsYW1wID0gYm5wQ2xhbXA7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmRsU2hpZnRUbyA9IGJucERMU2hpZnRUbztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuZHJTaGlmdFRvID0gYm5wRFJTaGlmdFRvO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5sU2hpZnRUbyA9IGJucExTaGlmdFRvO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5yU2hpZnRUbyA9IGJucFJTaGlmdFRvO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5zdWJUbyA9IGJucFN1YlRvO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5tdWx0aXBseVRvID0gYm5wTXVsdGlwbHlUbztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuc3F1YXJlVG8gPSBibnBTcXVhcmVUbztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuZGl2UmVtVG8gPSBibnBEaXZSZW1UbztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuaW52RGlnaXQgPSBibnBJbnZEaWdpdDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuaXNFdmVuID0gYm5wSXNFdmVuO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5leHAgPSBibnBFeHA7XG4gIC8vIHB1YmxpY1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS50b1N0cmluZyA9IGJuVG9TdHJpbmc7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLm5lZ2F0ZSA9IGJuTmVnYXRlO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hYnMgPSBibkFicztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuY29tcGFyZVRvID0gYm5Db21wYXJlVG87XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmJpdExlbmd0aCA9IGJuQml0TGVuZ3RoO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5tb2QgPSBibk1vZDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUubW9kUG93SW50ID0gYm5Nb2RQb3dJbnQ7XG4gIC8vIFwiY29uc3RhbnRzXCJcbiAgQmlnSW50ZWdlci5aRVJPID0gbmJ2KDApO1xuICBCaWdJbnRlZ2VyLk9ORSA9IG5idigxKTtcbiAgLy8gQ29weXJpZ2h0IChjKSAyMDA1LTIwMDkgIFRvbSBXdVxuICAvLyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICAvLyBTZWUgXCJMSUNFTlNFXCIgZm9yIGRldGFpbHMuXG4gIC8vIEV4dGVuZGVkIEphdmFTY3JpcHQgQk4gZnVuY3Rpb25zLCByZXF1aXJlZCBmb3IgUlNBIHByaXZhdGUgb3BzLlxuICAvLyBWZXJzaW9uIDEuMTogbmV3IEJpZ0ludGVnZXIoXCIwXCIsIDEwKSByZXR1cm5zIFwicHJvcGVyXCIgemVyb1xuICAvLyBWZXJzaW9uIDEuMjogc3F1YXJlKCkgQVBJLCBpc1Byb2JhYmxlUHJpbWUgZml4XG4gIC8vIChwdWJsaWMpXG4gIGZ1bmN0aW9uIGJuQ2xvbmUoKVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB0aGlzLmNvcHlUbyhyKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSByZXR1cm4gdmFsdWUgYXMgaW50ZWdlclxuICBmdW5jdGlvbiBibkludFZhbHVlKClcbiAge1xuICAgIGlmICh0aGlzLnMgPCAwKVxuICAgIHtcbiAgICAgIGlmICh0aGlzLnQgPT0gMSkgcmV0dXJuIHRoaXNbMF0gLSB0aGlzLkRWO1xuICAgICAgZWxzZSBpZiAodGhpcy50ID09IDApIHJldHVybiAtMTtcbiAgICB9XG4gICAgZWxzZSBpZiAodGhpcy50ID09IDEpIHJldHVybiB0aGlzWzBdO1xuICAgIGVsc2UgaWYgKHRoaXMudCA9PSAwKSByZXR1cm4gMDtcbiAgICAvLyBhc3N1bWVzIDE2IDwgREIgPCAzMlxuICAgIHJldHVybiAoKHRoaXNbMV0gJiAoKDEgPDwgKDMyIC0gdGhpcy5EQikpIC0gMSkpIDw8IHRoaXMuREIpIHwgdGhpc1swXTtcbiAgfVxuICAvLyAocHVibGljKSByZXR1cm4gdmFsdWUgYXMgYnl0ZVxuICBmdW5jdGlvbiBibkJ5dGVWYWx1ZSgpXG4gIHtcbiAgICByZXR1cm4gKHRoaXMudCA9PSAwKSA/IHRoaXMucyA6ICh0aGlzWzBdIDw8IDI0KSA+PiAyNDtcbiAgfVxuICAvLyAocHVibGljKSByZXR1cm4gdmFsdWUgYXMgc2hvcnQgKGFzc3VtZXMgREI+PTE2KVxuICBmdW5jdGlvbiBiblNob3J0VmFsdWUoKVxuICB7XG4gICAgcmV0dXJuICh0aGlzLnQgPT0gMCkgPyB0aGlzLnMgOiAodGhpc1swXSA8PCAxNikgPj4gMTY7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgcmV0dXJuIHggcy50LiByXnggPCBEVlxuICBmdW5jdGlvbiBibnBDaHVua1NpemUocilcbiAge1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGguTE4yICogdGhpcy5EQiAvIE1hdGgubG9nKHIpKTtcbiAgfVxuICAvLyAocHVibGljKSAwIGlmIHRoaXMgPT0gMCwgMSBpZiB0aGlzID4gMFxuICBmdW5jdGlvbiBiblNpZ051bSgpXG4gIHtcbiAgICBpZiAodGhpcy5zIDwgMCkgcmV0dXJuIC0xO1xuICAgIGVsc2UgaWYgKHRoaXMudCA8PSAwIHx8ICh0aGlzLnQgPT0gMSAmJiB0aGlzWzBdIDw9IDApKSByZXR1cm4gMDtcbiAgICBlbHNlIHJldHVybiAxO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIGNvbnZlcnQgdG8gcmFkaXggc3RyaW5nXG4gIGZ1bmN0aW9uIGJucFRvUmFkaXgoYilcbiAge1xuICAgIGlmIChiID09IG51bGwpIGIgPSAxMDtcbiAgICBpZiAodGhpcy5zaWdudW0oKSA9PSAwIHx8IGIgPCAyIHx8IGIgPiAzNikgcmV0dXJuIFwiMFwiO1xuICAgIHZhciBjcyA9IHRoaXMuY2h1bmtTaXplKGIpO1xuICAgIHZhciBhID0gTWF0aC5wb3coYiwgY3MpO1xuICAgIHZhciBkID0gbmJ2KGEpLFxuICAgICAgeSA9IG5iaSgpLFxuICAgICAgeiA9IG5iaSgpLFxuICAgICAgciA9IFwiXCI7XG4gICAgdGhpcy5kaXZSZW1UbyhkLCB5LCB6KTtcbiAgICB3aGlsZSAoeS5zaWdudW0oKSA+IDApXG4gICAge1xuICAgICAgciA9IChhICsgei5pbnRWYWx1ZSgpKS50b1N0cmluZyhiKS5zdWJzdHIoMSkgKyByO1xuICAgICAgeS5kaXZSZW1UbyhkLCB5LCB6KTtcbiAgICB9XG4gICAgcmV0dXJuIHouaW50VmFsdWUoKS50b1N0cmluZyhiKSArIHI7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgY29udmVydCBmcm9tIHJhZGl4IHN0cmluZ1xuICBmdW5jdGlvbiBibnBGcm9tUmFkaXgocywgYilcbiAge1xuICAgIHRoaXMuZnJvbUludCgwKTtcbiAgICBpZiAoYiA9PSBudWxsKSBiID0gMTA7XG4gICAgdmFyIGNzID0gdGhpcy5jaHVua1NpemUoYik7XG4gICAgdmFyIGQgPSBNYXRoLnBvdyhiLCBjcyksXG4gICAgICBtaSA9IGZhbHNlLFxuICAgICAgaiA9IDAsXG4gICAgICB3ID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHMubGVuZ3RoOyArK2kpXG4gICAge1xuICAgICAgdmFyIHggPSBpbnRBdChzLCBpKTtcbiAgICAgIGlmICh4IDwgMClcbiAgICAgIHtcbiAgICAgICAgaWYgKHMuY2hhckF0KGkpID09IFwiLVwiICYmIHRoaXMuc2lnbnVtKCkgPT0gMCkgbWkgPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHcgPSBiICogdyArIHg7XG4gICAgICBpZiAoKytqID49IGNzKVxuICAgICAge1xuICAgICAgICB0aGlzLmRNdWx0aXBseShkKTtcbiAgICAgICAgdGhpcy5kQWRkT2Zmc2V0KHcsIDApO1xuICAgICAgICBqID0gMDtcbiAgICAgICAgdyA9IDA7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChqID4gMClcbiAgICB7XG4gICAgICB0aGlzLmRNdWx0aXBseShNYXRoLnBvdyhiLCBqKSk7XG4gICAgICB0aGlzLmRBZGRPZmZzZXQodywgMCk7XG4gICAgfVxuICAgIGlmIChtaSkgQmlnSW50ZWdlci5aRVJPLnN1YlRvKHRoaXMsIHRoaXMpO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIGFsdGVybmF0ZSBjb25zdHJ1Y3RvclxuICBmdW5jdGlvbiBibnBGcm9tTnVtYmVyKGEsIGIsIGMpXG4gIHtcbiAgICBpZiAoXCJudW1iZXJcIiA9PSB0eXBlb2YgYilcbiAgICB7XG4gICAgICAvLyBuZXcgQmlnSW50ZWdlcihpbnQsaW50LFJORylcbiAgICAgIGlmIChhIDwgMikgdGhpcy5mcm9tSW50KDEpO1xuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICB0aGlzLmZyb21OdW1iZXIoYSwgYyk7XG4gICAgICAgIGlmICghdGhpcy50ZXN0Qml0KGEgLSAxKSkgLy8gZm9yY2UgTVNCIHNldFxuICAgICAgICAgIHRoaXMuYml0d2lzZVRvKEJpZ0ludGVnZXIuT05FLnNoaWZ0TGVmdChhIC0gMSksIG9wX29yLCB0aGlzKTtcbiAgICAgICAgaWYgKHRoaXMuaXNFdmVuKCkpIHRoaXMuZEFkZE9mZnNldCgxLCAwKTsgLy8gZm9yY2Ugb2RkXG4gICAgICAgIHdoaWxlICghdGhpcy5pc1Byb2JhYmxlUHJpbWUoYikpXG4gICAgICAgIHtcbiAgICAgICAgICB0aGlzLmRBZGRPZmZzZXQoMiwgMCk7XG4gICAgICAgICAgaWYgKHRoaXMuYml0TGVuZ3RoKCkgPiBhKSB0aGlzLnN1YlRvKEJpZ0ludGVnZXIuT05FLnNoaWZ0TGVmdChhIC0gMSksIHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAvLyBuZXcgQmlnSW50ZWdlcihpbnQsUk5HKVxuICAgICAgdmFyIHggPSBuZXcgQXJyYXkoKSxcbiAgICAgICAgdCA9IGEgJiA3O1xuICAgICAgeC5sZW5ndGggPSAoYSA+PiAzKSArIDE7XG4gICAgICBiLm5leHRCeXRlcyh4KTtcbiAgICAgIGlmICh0ID4gMCkgeFswXSAmPSAoKDEgPDwgdCkgLSAxKTtcbiAgICAgIGVsc2UgeFswXSA9IDA7XG4gICAgICB0aGlzLmZyb21TdHJpbmcoeCwgMjU2KTtcbiAgICB9XG4gIH1cbiAgLy8gKHB1YmxpYykgY29udmVydCB0byBiaWdlbmRpYW4gYnl0ZSBhcnJheVxuICBmdW5jdGlvbiBiblRvQnl0ZUFycmF5KClcbiAge1xuICAgIHZhciBpID0gdGhpcy50LFxuICAgICAgciA9IG5ldyBBcnJheSgpO1xuICAgIHJbMF0gPSB0aGlzLnM7XG4gICAgdmFyIHAgPSB0aGlzLkRCIC0gKGkgKiB0aGlzLkRCKSAlIDgsXG4gICAgICBkLCBrID0gMDtcbiAgICBpZiAoaS0tID4gMClcbiAgICB7XG4gICAgICBpZiAocCA8IHRoaXMuREIgJiYgKGQgPSB0aGlzW2ldID4+IHApICE9ICh0aGlzLnMgJiB0aGlzLkRNKSA+PiBwKVxuICAgICAgICByW2srK10gPSBkIHwgKHRoaXMucyA8PCAodGhpcy5EQiAtIHApKTtcbiAgICAgIHdoaWxlIChpID49IDApXG4gICAgICB7XG4gICAgICAgIGlmIChwIDwgOClcbiAgICAgICAge1xuICAgICAgICAgIGQgPSAodGhpc1tpXSAmICgoMSA8PCBwKSAtIDEpKSA8PCAoOCAtIHApO1xuICAgICAgICAgIGQgfD0gdGhpc1stLWldID4+IChwICs9IHRoaXMuREIgLSA4KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICBkID0gKHRoaXNbaV0gPj4gKHAgLT0gOCkpICYgMHhmZjtcbiAgICAgICAgICBpZiAocCA8PSAwKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHAgKz0gdGhpcy5EQjtcbiAgICAgICAgICAgIC0taTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKChkICYgMHg4MCkgIT0gMCkgZCB8PSAtMjU2O1xuICAgICAgICBpZiAoayA9PSAwICYmICh0aGlzLnMgJiAweDgwKSAhPSAoZCAmIDB4ODApKSsraztcbiAgICAgICAgaWYgKGsgPiAwIHx8IGQgIT0gdGhpcy5zKSByW2srK10gPSBkO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJuRXF1YWxzKGEpXG4gIHtcbiAgICByZXR1cm4gKHRoaXMuY29tcGFyZVRvKGEpID09IDApO1xuICB9XG5cbiAgZnVuY3Rpb24gYm5NaW4oYSlcbiAge1xuICAgIHJldHVybiAodGhpcy5jb21wYXJlVG8oYSkgPCAwKSA/IHRoaXMgOiBhO1xuICB9XG5cbiAgZnVuY3Rpb24gYm5NYXgoYSlcbiAge1xuICAgIHJldHVybiAodGhpcy5jb21wYXJlVG8oYSkgPiAwKSA/IHRoaXMgOiBhO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzIG9wIGEgKGJpdHdpc2UpXG4gIGZ1bmN0aW9uIGJucEJpdHdpc2VUbyhhLCBvcCwgcilcbiAge1xuICAgIHZhciBpLCBmLCBtID0gTWF0aC5taW4oYS50LCB0aGlzLnQpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBtOyArK2kpIHJbaV0gPSBvcCh0aGlzW2ldLCBhW2ldKTtcbiAgICBpZiAoYS50IDwgdGhpcy50KVxuICAgIHtcbiAgICAgIGYgPSBhLnMgJiB0aGlzLkRNO1xuICAgICAgZm9yIChpID0gbTsgaSA8IHRoaXMudDsgKytpKSByW2ldID0gb3AodGhpc1tpXSwgZik7XG4gICAgICByLnQgPSB0aGlzLnQ7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBmID0gdGhpcy5zICYgdGhpcy5ETTtcbiAgICAgIGZvciAoaSA9IG07IGkgPCBhLnQ7ICsraSkgcltpXSA9IG9wKGYsIGFbaV0pO1xuICAgICAgci50ID0gYS50O1xuICAgIH1cbiAgICByLnMgPSBvcCh0aGlzLnMsIGEucyk7XG4gICAgci5jbGFtcCgpO1xuICB9XG4gIC8vIChwdWJsaWMpIHRoaXMgJiBhXG4gIGZ1bmN0aW9uIG9wX2FuZCh4LCB5KVxuICB7XG4gICAgcmV0dXJuIHggJiB5O1xuICB9XG5cbiAgZnVuY3Rpb24gYm5BbmQoYSlcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgdGhpcy5iaXR3aXNlVG8oYSwgb3BfYW5kLCByKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSB0aGlzIHwgYVxuICBmdW5jdGlvbiBvcF9vcih4LCB5KVxuICB7XG4gICAgcmV0dXJuIHggfCB5O1xuICB9XG5cbiAgZnVuY3Rpb24gYm5PcihhKVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB0aGlzLmJpdHdpc2VUbyhhLCBvcF9vciwgcik7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgdGhpcyBeIGFcbiAgZnVuY3Rpb24gb3BfeG9yKHgsIHkpXG4gIHtcbiAgICByZXR1cm4geCBeIHk7XG4gIH1cblxuICBmdW5jdGlvbiBiblhvcihhKVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB0aGlzLmJpdHdpc2VUbyhhLCBvcF94b3IsIHIpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIHRoaXMgJiB+YVxuICBmdW5jdGlvbiBvcF9hbmRub3QoeCwgeSlcbiAge1xuICAgIHJldHVybiB4ICYgfnk7XG4gIH1cblxuICBmdW5jdGlvbiBibkFuZE5vdChhKVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB0aGlzLmJpdHdpc2VUbyhhLCBvcF9hbmRub3QsIHIpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIH50aGlzXG4gIGZ1bmN0aW9uIGJuTm90KClcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnQ7ICsraSkgcltpXSA9IHRoaXMuRE0gJiB+dGhpc1tpXTtcbiAgICByLnQgPSB0aGlzLnQ7XG4gICAgci5zID0gfnRoaXMucztcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSB0aGlzIDw8IG5cbiAgZnVuY3Rpb24gYm5TaGlmdExlZnQobilcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgaWYgKG4gPCAwKSB0aGlzLnJTaGlmdFRvKC1uLCByKTtcbiAgICBlbHNlIHRoaXMubFNoaWZ0VG8obiwgcik7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgdGhpcyA+PiBuXG4gIGZ1bmN0aW9uIGJuU2hpZnRSaWdodChuKVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICBpZiAobiA8IDApIHRoaXMubFNoaWZ0VG8oLW4sIHIpO1xuICAgIGVsc2UgdGhpcy5yU2hpZnRUbyhuLCByKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyByZXR1cm4gaW5kZXggb2YgbG93ZXN0IDEtYml0IGluIHgsIHggPCAyXjMxXG4gIGZ1bmN0aW9uIGxiaXQoeClcbiAge1xuICAgIGlmICh4ID09IDApIHJldHVybiAtMTtcbiAgICB2YXIgciA9IDA7XG4gICAgaWYgKCh4ICYgMHhmZmZmKSA9PSAwKVxuICAgIHtcbiAgICAgIHggPj49IDE2O1xuICAgICAgciArPSAxNjtcbiAgICB9XG4gICAgaWYgKCh4ICYgMHhmZikgPT0gMClcbiAgICB7XG4gICAgICB4ID4+PSA4O1xuICAgICAgciArPSA4O1xuICAgIH1cbiAgICBpZiAoKHggJiAweGYpID09IDApXG4gICAge1xuICAgICAgeCA+Pj0gNDtcbiAgICAgIHIgKz0gNDtcbiAgICB9XG4gICAgaWYgKCh4ICYgMykgPT0gMClcbiAgICB7XG4gICAgICB4ID4+PSAyO1xuICAgICAgciArPSAyO1xuICAgIH1cbiAgICBpZiAoKHggJiAxKSA9PSAwKSsrcjtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSByZXR1cm5zIGluZGV4IG9mIGxvd2VzdCAxLWJpdCAob3IgLTEgaWYgbm9uZSlcbiAgZnVuY3Rpb24gYm5HZXRMb3dlc3RTZXRCaXQoKVxuICB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnQ7ICsraSlcbiAgICAgIGlmICh0aGlzW2ldICE9IDApIHJldHVybiBpICogdGhpcy5EQiArIGxiaXQodGhpc1tpXSk7XG4gICAgaWYgKHRoaXMucyA8IDApIHJldHVybiB0aGlzLnQgKiB0aGlzLkRCO1xuICAgIHJldHVybiAtMTtcbiAgfVxuICAvLyByZXR1cm4gbnVtYmVyIG9mIDEgYml0cyBpbiB4XG4gIGZ1bmN0aW9uIGNiaXQoeClcbiAge1xuICAgIHZhciByID0gMDtcbiAgICB3aGlsZSAoeCAhPSAwKVxuICAgIHtcbiAgICAgIHggJj0geCAtIDE7XG4gICAgICArK3I7XG4gICAgfVxuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIHJldHVybiBudW1iZXIgb2Ygc2V0IGJpdHNcbiAgZnVuY3Rpb24gYm5CaXRDb3VudCgpXG4gIHtcbiAgICB2YXIgciA9IDAsXG4gICAgICB4ID0gdGhpcy5zICYgdGhpcy5ETTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudDsgKytpKSByICs9IGNiaXQodGhpc1tpXSBeIHgpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIHRydWUgaWZmIG50aCBiaXQgaXMgc2V0XG4gIGZ1bmN0aW9uIGJuVGVzdEJpdChuKVxuICB7XG4gICAgdmFyIGogPSBNYXRoLmZsb29yKG4gLyB0aGlzLkRCKTtcbiAgICBpZiAoaiA+PSB0aGlzLnQpIHJldHVybiAodGhpcy5zICE9IDApO1xuICAgIHJldHVybiAoKHRoaXNbal0gJiAoMSA8PCAobiAlIHRoaXMuREIpKSkgIT0gMCk7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgdGhpcyBvcCAoMTw8bilcbiAgZnVuY3Rpb24gYm5wQ2hhbmdlQml0KG4sIG9wKVxuICB7XG4gICAgdmFyIHIgPSBCaWdJbnRlZ2VyLk9ORS5zaGlmdExlZnQobik7XG4gICAgdGhpcy5iaXR3aXNlVG8ociwgb3AsIHIpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIHRoaXMgfCAoMTw8bilcbiAgZnVuY3Rpb24gYm5TZXRCaXQobilcbiAge1xuICAgIHJldHVybiB0aGlzLmNoYW5nZUJpdChuLCBvcF9vcik7XG4gIH1cbiAgLy8gKHB1YmxpYykgdGhpcyAmIH4oMTw8bilcbiAgZnVuY3Rpb24gYm5DbGVhckJpdChuKVxuICB7XG4gICAgcmV0dXJuIHRoaXMuY2hhbmdlQml0KG4sIG9wX2FuZG5vdCk7XG4gIH1cbiAgLy8gKHB1YmxpYykgdGhpcyBeICgxPDxuKVxuICBmdW5jdGlvbiBibkZsaXBCaXQobilcbiAge1xuICAgIHJldHVybiB0aGlzLmNoYW5nZUJpdChuLCBvcF94b3IpO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzICsgYVxuICBmdW5jdGlvbiBibnBBZGRUbyhhLCByKVxuICB7XG4gICAgdmFyIGkgPSAwLFxuICAgICAgYyA9IDAsXG4gICAgICBtID0gTWF0aC5taW4oYS50LCB0aGlzLnQpO1xuICAgIHdoaWxlIChpIDwgbSlcbiAgICB7XG4gICAgICBjICs9IHRoaXNbaV0gKyBhW2ldO1xuICAgICAgcltpKytdID0gYyAmIHRoaXMuRE07XG4gICAgICBjID4+PSB0aGlzLkRCO1xuICAgIH1cbiAgICBpZiAoYS50IDwgdGhpcy50KVxuICAgIHtcbiAgICAgIGMgKz0gYS5zO1xuICAgICAgd2hpbGUgKGkgPCB0aGlzLnQpXG4gICAgICB7XG4gICAgICAgIGMgKz0gdGhpc1tpXTtcbiAgICAgICAgcltpKytdID0gYyAmIHRoaXMuRE07XG4gICAgICAgIGMgPj49IHRoaXMuREI7XG4gICAgICB9XG4gICAgICBjICs9IHRoaXMucztcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIGMgKz0gdGhpcy5zO1xuICAgICAgd2hpbGUgKGkgPCBhLnQpXG4gICAgICB7XG4gICAgICAgIGMgKz0gYVtpXTtcbiAgICAgICAgcltpKytdID0gYyAmIHRoaXMuRE07XG4gICAgICAgIGMgPj49IHRoaXMuREI7XG4gICAgICB9XG4gICAgICBjICs9IGEucztcbiAgICB9XG4gICAgci5zID0gKGMgPCAwKSA/IC0xIDogMDtcbiAgICBpZiAoYyA+IDApIHJbaSsrXSA9IGM7XG4gICAgZWxzZSBpZiAoYyA8IC0xKSByW2krK10gPSB0aGlzLkRWICsgYztcbiAgICByLnQgPSBpO1xuICAgIHIuY2xhbXAoKTtcbiAgfVxuICAvLyAocHVibGljKSB0aGlzICsgYVxuICBmdW5jdGlvbiBibkFkZChhKVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB0aGlzLmFkZFRvKGEsIHIpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIHRoaXMgLSBhXG4gIGZ1bmN0aW9uIGJuU3VidHJhY3QoYSlcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgdGhpcy5zdWJUbyhhLCByKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSB0aGlzICogYVxuICBmdW5jdGlvbiBibk11bHRpcGx5KGEpXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHRoaXMubXVsdGlwbHlUbyhhLCByKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSB0aGlzXjJcbiAgZnVuY3Rpb24gYm5TcXVhcmUoKVxuICB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB0aGlzLnNxdWFyZVRvKHIpO1xuICAgIHJldHVybiByO1xuICB9XG4gIC8vIChwdWJsaWMpIHRoaXMgLyBhXG4gIGZ1bmN0aW9uIGJuRGl2aWRlKGEpXG4gIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHRoaXMuZGl2UmVtVG8oYSwgciwgbnVsbCk7XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgdGhpcyAlIGFcbiAgZnVuY3Rpb24gYm5SZW1haW5kZXIoYSlcbiAge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgdGhpcy5kaXZSZW1UbyhhLCBudWxsLCByKTtcbiAgICByZXR1cm4gcjtcbiAgfVxuICAvLyAocHVibGljKSBbdGhpcy9hLHRoaXMlYV1cbiAgZnVuY3Rpb24gYm5EaXZpZGVBbmRSZW1haW5kZXIoYSlcbiAge1xuICAgIHZhciBxID0gbmJpKCksXG4gICAgICByID0gbmJpKCk7XG4gICAgdGhpcy5kaXZSZW1UbyhhLCBxLCByKTtcbiAgICByZXR1cm4gbmV3IEFycmF5KHEsIHIpO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHRoaXMgKj0gbiwgdGhpcyA+PSAwLCAxIDwgbiA8IERWXG4gIGZ1bmN0aW9uIGJucERNdWx0aXBseShuKVxuICB7XG4gICAgdGhpc1t0aGlzLnRdID0gdGhpcy5hbSgwLCBuIC0gMSwgdGhpcywgMCwgMCwgdGhpcy50KTtcbiAgICArK3RoaXMudDtcbiAgICB0aGlzLmNsYW1wKCk7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgdGhpcyArPSBuIDw8IHcgd29yZHMsIHRoaXMgPj0gMFxuICBmdW5jdGlvbiBibnBEQWRkT2Zmc2V0KG4sIHcpXG4gIHtcbiAgICBpZiAobiA9PSAwKSByZXR1cm47XG4gICAgd2hpbGUgKHRoaXMudCA8PSB3KSB0aGlzW3RoaXMudCsrXSA9IDA7XG4gICAgdGhpc1t3XSArPSBuO1xuICAgIHdoaWxlICh0aGlzW3ddID49IHRoaXMuRFYpXG4gICAge1xuICAgICAgdGhpc1t3XSAtPSB0aGlzLkRWO1xuICAgICAgaWYgKCsrdyA+PSB0aGlzLnQpIHRoaXNbdGhpcy50KytdID0gMDtcbiAgICAgICsrdGhpc1t3XTtcbiAgICB9XG4gIH1cbiAgLy8gQSBcIm51bGxcIiByZWR1Y2VyXG4gIGZ1bmN0aW9uIE51bGxFeHAoKVxuICB7fVxuXG4gIGZ1bmN0aW9uIG5Ob3AoeClcbiAge1xuICAgIHJldHVybiB4O1xuICB9XG5cbiAgZnVuY3Rpb24gbk11bFRvKHgsIHksIHIpXG4gIHtcbiAgICB4Lm11bHRpcGx5VG8oeSwgcik7XG4gIH1cblxuICBmdW5jdGlvbiBuU3FyVG8oeCwgcilcbiAge1xuICAgIHguc3F1YXJlVG8ocik7XG4gIH1cbiAgTnVsbEV4cC5wcm90b3R5cGUuY29udmVydCA9IG5Ob3A7XG4gIE51bGxFeHAucHJvdG90eXBlLnJldmVydCA9IG5Ob3A7XG4gIE51bGxFeHAucHJvdG90eXBlLm11bFRvID0gbk11bFRvO1xuICBOdWxsRXhwLnByb3RvdHlwZS5zcXJUbyA9IG5TcXJUbztcbiAgLy8gKHB1YmxpYykgdGhpc15lXG4gIGZ1bmN0aW9uIGJuUG93KGUpXG4gIHtcbiAgICByZXR1cm4gdGhpcy5leHAoZSwgbmV3IE51bGxFeHAoKSk7XG4gIH1cbiAgLy8gKHByb3RlY3RlZCkgciA9IGxvd2VyIG4gd29yZHMgb2YgXCJ0aGlzICogYVwiLCBhLnQgPD0gblxuICAvLyBcInRoaXNcIiBzaG91bGQgYmUgdGhlIGxhcmdlciBvbmUgaWYgYXBwcm9wcmlhdGUuXG4gIGZ1bmN0aW9uIGJucE11bHRpcGx5TG93ZXJUbyhhLCBuLCByKVxuICB7XG4gICAgdmFyIGkgPSBNYXRoLm1pbih0aGlzLnQgKyBhLnQsIG4pO1xuICAgIHIucyA9IDA7IC8vIGFzc3VtZXMgYSx0aGlzID49IDBcbiAgICByLnQgPSBpO1xuICAgIHdoaWxlIChpID4gMCkgclstLWldID0gMDtcbiAgICB2YXIgajtcbiAgICBmb3IgKGogPSByLnQgLSB0aGlzLnQ7IGkgPCBqOyArK2kpIHJbaSArIHRoaXMudF0gPSB0aGlzLmFtKDAsIGFbaV0sIHIsIGksIDAsIHRoaXMudCk7XG4gICAgZm9yIChqID0gTWF0aC5taW4oYS50LCBuKTsgaSA8IGo7ICsraSkgdGhpcy5hbSgwLCBhW2ldLCByLCBpLCAwLCBuIC0gaSk7XG4gICAgci5jbGFtcCgpO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHIgPSBcInRoaXMgKiBhXCIgd2l0aG91dCBsb3dlciBuIHdvcmRzLCBuID4gMFxuICAvLyBcInRoaXNcIiBzaG91bGQgYmUgdGhlIGxhcmdlciBvbmUgaWYgYXBwcm9wcmlhdGUuXG4gIGZ1bmN0aW9uIGJucE11bHRpcGx5VXBwZXJUbyhhLCBuLCByKVxuICB7XG4gICAgLS1uO1xuICAgIHZhciBpID0gci50ID0gdGhpcy50ICsgYS50IC0gbjtcbiAgICByLnMgPSAwOyAvLyBhc3N1bWVzIGEsdGhpcyA+PSAwXG4gICAgd2hpbGUgKC0taSA+PSAwKSByW2ldID0gMDtcbiAgICBmb3IgKGkgPSBNYXRoLm1heChuIC0gdGhpcy50LCAwKTsgaSA8IGEudDsgKytpKVxuICAgICAgclt0aGlzLnQgKyBpIC0gbl0gPSB0aGlzLmFtKG4gLSBpLCBhW2ldLCByLCAwLCAwLCB0aGlzLnQgKyBpIC0gbik7XG4gICAgci5jbGFtcCgpO1xuICAgIHIuZHJTaGlmdFRvKDEsIHIpO1xuICB9XG4gIC8vIEJhcnJldHQgbW9kdWxhciByZWR1Y3Rpb25cbiAgZnVuY3Rpb24gQmFycmV0dChtKVxuICB7XG4gICAgLy8gc2V0dXAgQmFycmV0dFxuICAgIHRoaXMucjIgPSBuYmkoKTtcbiAgICB0aGlzLnEzID0gbmJpKCk7XG4gICAgQmlnSW50ZWdlci5PTkUuZGxTaGlmdFRvKDIgKiBtLnQsIHRoaXMucjIpO1xuICAgIHRoaXMubXUgPSB0aGlzLnIyLmRpdmlkZShtKTtcbiAgICB0aGlzLm0gPSBtO1xuICB9XG5cbiAgZnVuY3Rpb24gYmFycmV0dENvbnZlcnQoeClcbiAge1xuICAgIGlmICh4LnMgPCAwIHx8IHgudCA+IDIgKiB0aGlzLm0udCkgcmV0dXJuIHgubW9kKHRoaXMubSk7XG4gICAgZWxzZSBpZiAoeC5jb21wYXJlVG8odGhpcy5tKSA8IDApIHJldHVybiB4O1xuICAgIGVsc2VcbiAgICB7XG4gICAgICB2YXIgciA9IG5iaSgpO1xuICAgICAgeC5jb3B5VG8ocik7XG4gICAgICB0aGlzLnJlZHVjZShyKTtcbiAgICAgIHJldHVybiByO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGJhcnJldHRSZXZlcnQoeClcbiAge1xuICAgIHJldHVybiB4O1xuICB9XG4gIC8vIHggPSB4IG1vZCBtIChIQUMgMTQuNDIpXG4gIGZ1bmN0aW9uIGJhcnJldHRSZWR1Y2UoeClcbiAge1xuICAgIHguZHJTaGlmdFRvKHRoaXMubS50IC0gMSwgdGhpcy5yMik7XG4gICAgaWYgKHgudCA+IHRoaXMubS50ICsgMSlcbiAgICB7XG4gICAgICB4LnQgPSB0aGlzLm0udCArIDE7XG4gICAgICB4LmNsYW1wKCk7XG4gICAgfVxuICAgIHRoaXMubXUubXVsdGlwbHlVcHBlclRvKHRoaXMucjIsIHRoaXMubS50ICsgMSwgdGhpcy5xMyk7XG4gICAgdGhpcy5tLm11bHRpcGx5TG93ZXJUbyh0aGlzLnEzLCB0aGlzLm0udCArIDEsIHRoaXMucjIpO1xuICAgIHdoaWxlICh4LmNvbXBhcmVUbyh0aGlzLnIyKSA8IDApIHguZEFkZE9mZnNldCgxLCB0aGlzLm0udCArIDEpO1xuICAgIHguc3ViVG8odGhpcy5yMiwgeCk7XG4gICAgd2hpbGUgKHguY29tcGFyZVRvKHRoaXMubSkgPj0gMCkgeC5zdWJUbyh0aGlzLm0sIHgpO1xuICB9XG4gIC8vIHIgPSB4XjIgbW9kIG07IHggIT0gclxuICBmdW5jdGlvbiBiYXJyZXR0U3FyVG8oeCwgcilcbiAge1xuICAgIHguc3F1YXJlVG8ocik7XG4gICAgdGhpcy5yZWR1Y2Uocik7XG4gIH1cbiAgLy8gciA9IHgqeSBtb2QgbTsgeCx5ICE9IHJcbiAgZnVuY3Rpb24gYmFycmV0dE11bFRvKHgsIHksIHIpXG4gIHtcbiAgICB4Lm11bHRpcGx5VG8oeSwgcik7XG4gICAgdGhpcy5yZWR1Y2Uocik7XG4gIH1cbiAgQmFycmV0dC5wcm90b3R5cGUuY29udmVydCA9IGJhcnJldHRDb252ZXJ0O1xuICBCYXJyZXR0LnByb3RvdHlwZS5yZXZlcnQgPSBiYXJyZXR0UmV2ZXJ0O1xuICBCYXJyZXR0LnByb3RvdHlwZS5yZWR1Y2UgPSBiYXJyZXR0UmVkdWNlO1xuICBCYXJyZXR0LnByb3RvdHlwZS5tdWxUbyA9IGJhcnJldHRNdWxUbztcbiAgQmFycmV0dC5wcm90b3R5cGUuc3FyVG8gPSBiYXJyZXR0U3FyVG87XG4gIC8vIChwdWJsaWMpIHRoaXNeZSAlIG0gKEhBQyAxNC44NSlcbiAgZnVuY3Rpb24gYm5Nb2RQb3coZSwgbSlcbiAge1xuICAgIHZhciBpID0gZS5iaXRMZW5ndGgoKSxcbiAgICAgIGssIHIgPSBuYnYoMSksXG4gICAgICB6O1xuICAgIGlmIChpIDw9IDApIHJldHVybiByO1xuICAgIGVsc2UgaWYgKGkgPCAxOCkgayA9IDE7XG4gICAgZWxzZSBpZiAoaSA8IDQ4KSBrID0gMztcbiAgICBlbHNlIGlmIChpIDwgMTQ0KSBrID0gNDtcbiAgICBlbHNlIGlmIChpIDwgNzY4KSBrID0gNTtcbiAgICBlbHNlIGsgPSA2O1xuICAgIGlmIChpIDwgOClcbiAgICAgIHogPSBuZXcgQ2xhc3NpYyhtKTtcbiAgICBlbHNlIGlmIChtLmlzRXZlbigpKVxuICAgICAgeiA9IG5ldyBCYXJyZXR0KG0pO1xuICAgIGVsc2VcbiAgICAgIHogPSBuZXcgTW9udGdvbWVyeShtKTtcbiAgICAvLyBwcmVjb21wdXRhdGlvblxuICAgIHZhciBnID0gbmV3IEFycmF5KCksXG4gICAgICBuID0gMyxcbiAgICAgIGsxID0gayAtIDEsXG4gICAgICBrbSA9ICgxIDw8IGspIC0gMTtcbiAgICBnWzFdID0gei5jb252ZXJ0KHRoaXMpO1xuICAgIGlmIChrID4gMSlcbiAgICB7XG4gICAgICB2YXIgZzIgPSBuYmkoKTtcbiAgICAgIHouc3FyVG8oZ1sxXSwgZzIpO1xuICAgICAgd2hpbGUgKG4gPD0ga20pXG4gICAgICB7XG4gICAgICAgIGdbbl0gPSBuYmkoKTtcbiAgICAgICAgei5tdWxUbyhnMiwgZ1tuIC0gMl0sIGdbbl0pO1xuICAgICAgICBuICs9IDI7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBqID0gZS50IC0gMSxcbiAgICAgIHcsIGlzMSA9IHRydWUsXG4gICAgICByMiA9IG5iaSgpLFxuICAgICAgdDtcbiAgICBpID0gbmJpdHMoZVtqXSkgLSAxO1xuICAgIHdoaWxlIChqID49IDApXG4gICAge1xuICAgICAgaWYgKGkgPj0gazEpIHcgPSAoZVtqXSA+PiAoaSAtIGsxKSkgJiBrbTtcbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgdyA9IChlW2pdICYgKCgxIDw8IChpICsgMSkpIC0gMSkpIDw8IChrMSAtIGkpO1xuICAgICAgICBpZiAoaiA+IDApIHcgfD0gZVtqIC0gMV0gPj4gKHRoaXMuREIgKyBpIC0gazEpO1xuICAgICAgfVxuICAgICAgbiA9IGs7XG4gICAgICB3aGlsZSAoKHcgJiAxKSA9PSAwKVxuICAgICAge1xuICAgICAgICB3ID4+PSAxO1xuICAgICAgICAtLW47XG4gICAgICB9XG4gICAgICBpZiAoKGkgLT0gbikgPCAwKVxuICAgICAge1xuICAgICAgICBpICs9IHRoaXMuREI7XG4gICAgICAgIC0tajtcbiAgICAgIH1cbiAgICAgIGlmIChpczEpXG4gICAgICB7IC8vIHJldCA9PSAxLCBkb24ndCBib3RoZXIgc3F1YXJpbmcgb3IgbXVsdGlwbHlpbmcgaXRcbiAgICAgICAgZ1t3XS5jb3B5VG8ocik7XG4gICAgICAgIGlzMSA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICB3aGlsZSAobiA+IDEpXG4gICAgICAgIHtcbiAgICAgICAgICB6LnNxclRvKHIsIHIyKTtcbiAgICAgICAgICB6LnNxclRvKHIyLCByKTtcbiAgICAgICAgICBuIC09IDI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG4gPiAwKSB6LnNxclRvKHIsIHIyKTtcbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgdCA9IHI7XG4gICAgICAgICAgciA9IHIyO1xuICAgICAgICAgIHIyID0gdDtcbiAgICAgICAgfVxuICAgICAgICB6Lm11bFRvKHIyLCBnW3ddLCByKTtcbiAgICAgIH1cbiAgICAgIHdoaWxlIChqID49IDAgJiYgKGVbal0gJiAoMSA8PCBpKSkgPT0gMClcbiAgICAgIHtcbiAgICAgICAgei5zcXJUbyhyLCByMik7XG4gICAgICAgIHQgPSByO1xuICAgICAgICByID0gcjI7XG4gICAgICAgIHIyID0gdDtcbiAgICAgICAgaWYgKC0taSA8IDApXG4gICAgICAgIHtcbiAgICAgICAgICBpID0gdGhpcy5EQiAtIDE7XG4gICAgICAgICAgLS1qO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB6LnJldmVydChyKTtcbiAgfVxuICAvLyAocHVibGljKSBnY2QodGhpcyxhKSAoSEFDIDE0LjU0KVxuICBmdW5jdGlvbiBibkdDRChhKVxuICB7XG4gICAgdmFyIHggPSAodGhpcy5zIDwgMCkgPyB0aGlzLm5lZ2F0ZSgpIDogdGhpcy5jbG9uZSgpO1xuICAgIHZhciB5ID0gKGEucyA8IDApID8gYS5uZWdhdGUoKSA6IGEuY2xvbmUoKTtcbiAgICBpZiAoeC5jb21wYXJlVG8oeSkgPCAwKVxuICAgIHtcbiAgICAgIHZhciB0ID0geDtcbiAgICAgIHggPSB5O1xuICAgICAgeSA9IHQ7XG4gICAgfVxuICAgIHZhciBpID0geC5nZXRMb3dlc3RTZXRCaXQoKSxcbiAgICAgIGcgPSB5LmdldExvd2VzdFNldEJpdCgpO1xuICAgIGlmIChnIDwgMCkgcmV0dXJuIHg7XG4gICAgaWYgKGkgPCBnKSBnID0gaTtcbiAgICBpZiAoZyA+IDApXG4gICAge1xuICAgICAgeC5yU2hpZnRUbyhnLCB4KTtcbiAgICAgIHkuclNoaWZ0VG8oZywgeSk7XG4gICAgfVxuICAgIHdoaWxlICh4LnNpZ251bSgpID4gMClcbiAgICB7XG4gICAgICBpZiAoKGkgPSB4LmdldExvd2VzdFNldEJpdCgpKSA+IDApIHguclNoaWZ0VG8oaSwgeCk7XG4gICAgICBpZiAoKGkgPSB5LmdldExvd2VzdFNldEJpdCgpKSA+IDApIHkuclNoaWZ0VG8oaSwgeSk7XG4gICAgICBpZiAoeC5jb21wYXJlVG8oeSkgPj0gMClcbiAgICAgIHtcbiAgICAgICAgeC5zdWJUbyh5LCB4KTtcbiAgICAgICAgeC5yU2hpZnRUbygxLCB4KTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgeS5zdWJUbyh4LCB5KTtcbiAgICAgICAgeS5yU2hpZnRUbygxLCB5KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGcgPiAwKSB5LmxTaGlmdFRvKGcsIHkpO1xuICAgIHJldHVybiB5O1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHRoaXMgJSBuLCBuIDwgMl4yNlxuICBmdW5jdGlvbiBibnBNb2RJbnQobilcbiAge1xuICAgIGlmIChuIDw9IDApIHJldHVybiAwO1xuICAgIHZhciBkID0gdGhpcy5EViAlIG4sXG4gICAgICByID0gKHRoaXMucyA8IDApID8gbiAtIDEgOiAwO1xuICAgIGlmICh0aGlzLnQgPiAwKVxuICAgICAgaWYgKGQgPT0gMCkgciA9IHRoaXNbMF0gJSBuO1xuICAgICAgZWxzZVxuICAgICAgICBmb3IgKHZhciBpID0gdGhpcy50IC0gMTsgaSA+PSAwOyAtLWkpIHIgPSAoZCAqIHIgKyB0aGlzW2ldKSAlIG47XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgLy8gKHB1YmxpYykgMS90aGlzICUgbSAoSEFDIDE0LjYxKVxuICBmdW5jdGlvbiBibk1vZEludmVyc2UobSlcbiAge1xuICAgIHZhciBhYyA9IG0uaXNFdmVuKCk7XG4gICAgaWYgKCh0aGlzLmlzRXZlbigpICYmIGFjKSB8fCBtLnNpZ251bSgpID09IDApIHJldHVybiBCaWdJbnRlZ2VyLlpFUk87XG4gICAgdmFyIHUgPSBtLmNsb25lKCksXG4gICAgICB2ID0gdGhpcy5jbG9uZSgpO1xuICAgIHZhciBhID0gbmJ2KDEpLFxuICAgICAgYiA9IG5idigwKSxcbiAgICAgIGMgPSBuYnYoMCksXG4gICAgICBkID0gbmJ2KDEpO1xuICAgIHdoaWxlICh1LnNpZ251bSgpICE9IDApXG4gICAge1xuICAgICAgd2hpbGUgKHUuaXNFdmVuKCkpXG4gICAgICB7XG4gICAgICAgIHUuclNoaWZ0VG8oMSwgdSk7XG4gICAgICAgIGlmIChhYylcbiAgICAgICAge1xuICAgICAgICAgIGlmICghYS5pc0V2ZW4oKSB8fCAhYi5pc0V2ZW4oKSlcbiAgICAgICAgICB7XG4gICAgICAgICAgICBhLmFkZFRvKHRoaXMsIGEpO1xuICAgICAgICAgICAgYi5zdWJUbyhtLCBiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYS5yU2hpZnRUbygxLCBhKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghYi5pc0V2ZW4oKSkgYi5zdWJUbyhtLCBiKTtcbiAgICAgICAgYi5yU2hpZnRUbygxLCBiKTtcbiAgICAgIH1cbiAgICAgIHdoaWxlICh2LmlzRXZlbigpKVxuICAgICAge1xuICAgICAgICB2LnJTaGlmdFRvKDEsIHYpO1xuICAgICAgICBpZiAoYWMpXG4gICAgICAgIHtcbiAgICAgICAgICBpZiAoIWMuaXNFdmVuKCkgfHwgIWQuaXNFdmVuKCkpXG4gICAgICAgICAge1xuICAgICAgICAgICAgYy5hZGRUbyh0aGlzLCBjKTtcbiAgICAgICAgICAgIGQuc3ViVG8obSwgZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGMuclNoaWZ0VG8oMSwgYyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWQuaXNFdmVuKCkpIGQuc3ViVG8obSwgZCk7XG4gICAgICAgIGQuclNoaWZ0VG8oMSwgZCk7XG4gICAgICB9XG4gICAgICBpZiAodS5jb21wYXJlVG8odikgPj0gMClcbiAgICAgIHtcbiAgICAgICAgdS5zdWJUbyh2LCB1KTtcbiAgICAgICAgaWYgKGFjKSBhLnN1YlRvKGMsIGEpO1xuICAgICAgICBiLnN1YlRvKGQsIGIpO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICB2LnN1YlRvKHUsIHYpO1xuICAgICAgICBpZiAoYWMpIGMuc3ViVG8oYSwgYyk7XG4gICAgICAgIGQuc3ViVG8oYiwgZCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh2LmNvbXBhcmVUbyhCaWdJbnRlZ2VyLk9ORSkgIT0gMCkgcmV0dXJuIEJpZ0ludGVnZXIuWkVSTztcbiAgICBpZiAoZC5jb21wYXJlVG8obSkgPj0gMCkgcmV0dXJuIGQuc3VidHJhY3QobSk7XG4gICAgaWYgKGQuc2lnbnVtKCkgPCAwKSBkLmFkZFRvKG0sIGQpO1xuICAgIGVsc2UgcmV0dXJuIGQ7XG4gICAgaWYgKGQuc2lnbnVtKCkgPCAwKSByZXR1cm4gZC5hZGQobSk7XG4gICAgZWxzZSByZXR1cm4gZDtcbiAgfVxuICB2YXIgbG93cHJpbWVzID0gWzIsIDMsIDUsIDcsIDExLCAxMywgMTcsIDE5LCAyMywgMjksIDMxLCAzNywgNDEsIDQzLCA0NywgNTMsIDU5LCA2MSwgNjcsIDcxLCA3MywgNzksIDgzLCA4OSwgOTcsIDEwMSwgMTAzLCAxMDcsIDEwOSwgMTEzLCAxMjcsIDEzMSwgMTM3LCAxMzksIDE0OSwgMTUxLCAxNTcsIDE2MywgMTY3LCAxNzMsIDE3OSwgMTgxLCAxOTEsIDE5MywgMTk3LCAxOTksIDIxMSwgMjIzLCAyMjcsIDIyOSwgMjMzLCAyMzksIDI0MSwgMjUxLCAyNTcsIDI2MywgMjY5LCAyNzEsIDI3NywgMjgxLCAyODMsIDI5MywgMzA3LCAzMTEsIDMxMywgMzE3LCAzMzEsIDMzNywgMzQ3LCAzNDksIDM1MywgMzU5LCAzNjcsIDM3MywgMzc5LCAzODMsIDM4OSwgMzk3LCA0MDEsIDQwOSwgNDE5LCA0MjEsIDQzMSwgNDMzLCA0MzksIDQ0MywgNDQ5LCA0NTcsIDQ2MSwgNDYzLCA0NjcsIDQ3OSwgNDg3LCA0OTEsIDQ5OSwgNTAzLCA1MDksIDUyMSwgNTIzLCA1NDEsIDU0NywgNTU3LCA1NjMsIDU2OSwgNTcxLCA1NzcsIDU4NywgNTkzLCA1OTksIDYwMSwgNjA3LCA2MTMsIDYxNywgNjE5LCA2MzEsIDY0MSwgNjQzLCA2NDcsIDY1MywgNjU5LCA2NjEsIDY3MywgNjc3LCA2ODMsIDY5MSwgNzAxLCA3MDksIDcxOSwgNzI3LCA3MzMsIDczOSwgNzQzLCA3NTEsIDc1NywgNzYxLCA3NjksIDc3MywgNzg3LCA3OTcsIDgwOSwgODExLCA4MjEsIDgyMywgODI3LCA4MjksIDgzOSwgODUzLCA4NTcsIDg1OSwgODYzLCA4NzcsIDg4MSwgODgzLCA4ODcsIDkwNywgOTExLCA5MTksIDkyOSwgOTM3LCA5NDEsIDk0NywgOTUzLCA5NjcsIDk3MSwgOTc3LCA5ODMsIDk5MSwgOTk3XTtcbiAgdmFyIGxwbGltID0gKDEgPDwgMjYpIC8gbG93cHJpbWVzW2xvd3ByaW1lcy5sZW5ndGggLSAxXTtcbiAgLy8gKHB1YmxpYykgdGVzdCBwcmltYWxpdHkgd2l0aCBjZXJ0YWludHkgPj0gMS0uNV50XG4gIGZ1bmN0aW9uIGJuSXNQcm9iYWJsZVByaW1lKHQpXG4gIHtcbiAgICB2YXIgaSwgeCA9IHRoaXMuYWJzKCk7XG4gICAgaWYgKHgudCA9PSAxICYmIHhbMF0gPD0gbG93cHJpbWVzW2xvd3ByaW1lcy5sZW5ndGggLSAxXSlcbiAgICB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbG93cHJpbWVzLmxlbmd0aDsgKytpKVxuICAgICAgICBpZiAoeFswXSA9PSBsb3dwcmltZXNbaV0pIHJldHVybiB0cnVlO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoeC5pc0V2ZW4oKSkgcmV0dXJuIGZhbHNlO1xuICAgIGkgPSAxO1xuICAgIHdoaWxlIChpIDwgbG93cHJpbWVzLmxlbmd0aClcbiAgICB7XG4gICAgICB2YXIgbSA9IGxvd3ByaW1lc1tpXSxcbiAgICAgICAgaiA9IGkgKyAxO1xuICAgICAgd2hpbGUgKGogPCBsb3dwcmltZXMubGVuZ3RoICYmIG0gPCBscGxpbSkgbSAqPSBsb3dwcmltZXNbaisrXTtcbiAgICAgIG0gPSB4Lm1vZEludChtKTtcbiAgICAgIHdoaWxlIChpIDwgailcbiAgICAgICAgaWYgKG0gJSBsb3dwcmltZXNbaSsrXSA9PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB4Lm1pbGxlclJhYmluKHQpO1xuICB9XG4gIC8vIChwcm90ZWN0ZWQpIHRydWUgaWYgcHJvYmFibHkgcHJpbWUgKEhBQyA0LjI0LCBNaWxsZXItUmFiaW4pXG4gIGZ1bmN0aW9uIGJucE1pbGxlclJhYmluKHQpXG4gIHtcbiAgICB2YXIgbjEgPSB0aGlzLnN1YnRyYWN0KEJpZ0ludGVnZXIuT05FKTtcbiAgICB2YXIgayA9IG4xLmdldExvd2VzdFNldEJpdCgpO1xuICAgIGlmIChrIDw9IDApIHJldHVybiBmYWxzZTtcbiAgICB2YXIgciA9IG4xLnNoaWZ0UmlnaHQoayk7XG4gICAgdCA9ICh0ICsgMSkgPj4gMTtcbiAgICBpZiAodCA+IGxvd3ByaW1lcy5sZW5ndGgpIHQgPSBsb3dwcmltZXMubGVuZ3RoO1xuICAgIHZhciBhID0gbmJpKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0OyArK2kpXG4gICAge1xuICAgICAgLy9QaWNrIGJhc2VzIGF0IHJhbmRvbSwgaW5zdGVhZCBvZiBzdGFydGluZyBhdCAyXG4gICAgICBhLmZyb21JbnQobG93cHJpbWVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGxvd3ByaW1lcy5sZW5ndGgpXSk7XG4gICAgICB2YXIgeSA9IGEubW9kUG93KHIsIHRoaXMpO1xuICAgICAgaWYgKHkuY29tcGFyZVRvKEJpZ0ludGVnZXIuT05FKSAhPSAwICYmIHkuY29tcGFyZVRvKG4xKSAhPSAwKVxuICAgICAge1xuICAgICAgICB2YXIgaiA9IDE7XG4gICAgICAgIHdoaWxlIChqKysgPCBrICYmIHkuY29tcGFyZVRvKG4xKSAhPSAwKVxuICAgICAgICB7XG4gICAgICAgICAgeSA9IHkubW9kUG93SW50KDIsIHRoaXMpO1xuICAgICAgICAgIGlmICh5LmNvbXBhcmVUbyhCaWdJbnRlZ2VyLk9ORSkgPT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh5LmNvbXBhcmVUbyhuMSkgIT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICAvLyBwcm90ZWN0ZWRcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuY2h1bmtTaXplID0gYm5wQ2h1bmtTaXplO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS50b1JhZGl4ID0gYm5wVG9SYWRpeDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuZnJvbVJhZGl4ID0gYm5wRnJvbVJhZGl4O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5mcm9tTnVtYmVyID0gYm5wRnJvbU51bWJlcjtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuYml0d2lzZVRvID0gYm5wQml0d2lzZVRvO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5jaGFuZ2VCaXQgPSBibnBDaGFuZ2VCaXQ7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmFkZFRvID0gYm5wQWRkVG87XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmRNdWx0aXBseSA9IGJucERNdWx0aXBseTtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuZEFkZE9mZnNldCA9IGJucERBZGRPZmZzZXQ7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLm11bHRpcGx5TG93ZXJUbyA9IGJucE11bHRpcGx5TG93ZXJUbztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUubXVsdGlwbHlVcHBlclRvID0gYm5wTXVsdGlwbHlVcHBlclRvO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5tb2RJbnQgPSBibnBNb2RJbnQ7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLm1pbGxlclJhYmluID0gYm5wTWlsbGVyUmFiaW47XG4gIC8vIHB1YmxpY1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5jbG9uZSA9IGJuQ2xvbmU7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmludFZhbHVlID0gYm5JbnRWYWx1ZTtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuYnl0ZVZhbHVlID0gYm5CeXRlVmFsdWU7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLnNob3J0VmFsdWUgPSBiblNob3J0VmFsdWU7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLnNpZ251bSA9IGJuU2lnTnVtO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS50b0J5dGVBcnJheSA9IGJuVG9CeXRlQXJyYXk7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmVxdWFscyA9IGJuRXF1YWxzO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5taW4gPSBibk1pbjtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUubWF4ID0gYm5NYXg7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmFuZCA9IGJuQW5kO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5vciA9IGJuT3I7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLnhvciA9IGJuWG9yO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hbmROb3QgPSBibkFuZE5vdDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUubm90ID0gYm5Ob3Q7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLnNoaWZ0TGVmdCA9IGJuU2hpZnRMZWZ0O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5zaGlmdFJpZ2h0ID0gYm5TaGlmdFJpZ2h0O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5nZXRMb3dlc3RTZXRCaXQgPSBibkdldExvd2VzdFNldEJpdDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuYml0Q291bnQgPSBibkJpdENvdW50O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS50ZXN0Qml0ID0gYm5UZXN0Qml0O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5zZXRCaXQgPSBiblNldEJpdDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuY2xlYXJCaXQgPSBibkNsZWFyQml0O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5mbGlwQml0ID0gYm5GbGlwQml0O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hZGQgPSBibkFkZDtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuc3VidHJhY3QgPSBiblN1YnRyYWN0O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5tdWx0aXBseSA9IGJuTXVsdGlwbHk7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmRpdmlkZSA9IGJuRGl2aWRlO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5yZW1haW5kZXIgPSBiblJlbWFpbmRlcjtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuZGl2aWRlQW5kUmVtYWluZGVyID0gYm5EaXZpZGVBbmRSZW1haW5kZXI7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLm1vZFBvdyA9IGJuTW9kUG93O1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5tb2RJbnZlcnNlID0gYm5Nb2RJbnZlcnNlO1xuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5wb3cgPSBiblBvdztcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuZ2NkID0gYm5HQ0Q7XG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmlzUHJvYmFibGVQcmltZSA9IGJuSXNQcm9iYWJsZVByaW1lO1xuICAvLyBKU0JOLXNwZWNpZmljIGV4dGVuc2lvblxuICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5zcXVhcmUgPSBiblNxdWFyZTtcbiAgdmFyIEludDEyOCA9IEJpZ0ludGVnZXI7XG4gIC8vIEJpZ0ludGVnZXIgaW50ZXJmYWNlcyBub3QgaW1wbGVtZW50ZWQgaW4ganNibjpcbiAgLy8gQmlnSW50ZWdlcihpbnQgc2lnbnVtLCBieXRlW10gbWFnbml0dWRlKVxuICAvLyBkb3VibGUgZG91YmxlVmFsdWUoKVxuICAvLyBmbG9hdCBmbG9hdFZhbHVlKClcbiAgLy8gaW50IGhhc2hDb2RlKClcbiAgLy8gbG9uZyBsb25nVmFsdWUoKVxuICAvLyBzdGF0aWMgQmlnSW50ZWdlciB2YWx1ZU9mKGxvbmcgdmFsKVxuICAvLyBIZWxwZXIgZnVuY3Rpb25zIHRvIG1ha2UgQmlnSW50ZWdlciBmdW5jdGlvbnMgY2FsbGFibGUgd2l0aCB0d28gcGFyYW1ldGVyc1xuICAvLyBhcyBpbiBvcmlnaW5hbCBDIyBDbGlwcGVyXG4gIEludDEyOC5wcm90b3R5cGUuSXNOZWdhdGl2ZSA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICBpZiAodGhpcy5jb21wYXJlVG8oSW50MTI4LlpFUk8pID09IC0xKSByZXR1cm4gdHJ1ZTtcbiAgICBlbHNlIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgSW50MTI4Lm9wX0VxdWFsaXR5ID0gZnVuY3Rpb24gKHZhbDEsIHZhbDIpXG4gIHtcbiAgICBpZiAodmFsMS5jb21wYXJlVG8odmFsMikgPT0gMCkgcmV0dXJuIHRydWU7XG4gICAgZWxzZSByZXR1cm4gZmFsc2U7XG4gIH07XG4gIEludDEyOC5vcF9JbmVxdWFsaXR5ID0gZnVuY3Rpb24gKHZhbDEsIHZhbDIpXG4gIHtcbiAgICBpZiAodmFsMS5jb21wYXJlVG8odmFsMikgIT0gMCkgcmV0dXJuIHRydWU7XG4gICAgZWxzZSByZXR1cm4gZmFsc2U7XG4gIH07XG4gIEludDEyOC5vcF9HcmVhdGVyVGhhbiA9IGZ1bmN0aW9uICh2YWwxLCB2YWwyKVxuICB7XG4gICAgaWYgKHZhbDEuY29tcGFyZVRvKHZhbDIpID4gMCkgcmV0dXJuIHRydWU7XG4gICAgZWxzZSByZXR1cm4gZmFsc2U7XG4gIH07XG4gIEludDEyOC5vcF9MZXNzVGhhbiA9IGZ1bmN0aW9uICh2YWwxLCB2YWwyKVxuICB7XG4gICAgaWYgKHZhbDEuY29tcGFyZVRvKHZhbDIpIDwgMCkgcmV0dXJuIHRydWU7XG4gICAgZWxzZSByZXR1cm4gZmFsc2U7XG4gIH07XG4gIEludDEyOC5vcF9BZGRpdGlvbiA9IGZ1bmN0aW9uIChsaHMsIHJocylcbiAge1xuICAgIHJldHVybiBuZXcgSW50MTI4KGxocykuYWRkKG5ldyBJbnQxMjgocmhzKSk7XG4gIH07XG4gIEludDEyOC5vcF9TdWJ0cmFjdGlvbiA9IGZ1bmN0aW9uIChsaHMsIHJocylcbiAge1xuICAgIHJldHVybiBuZXcgSW50MTI4KGxocykuc3VidHJhY3QobmV3IEludDEyOChyaHMpKTtcbiAgfTtcbiAgSW50MTI4LkludDEyOE11bCA9IGZ1bmN0aW9uIChsaHMsIHJocylcbiAge1xuICAgIHJldHVybiBuZXcgSW50MTI4KGxocykubXVsdGlwbHkobmV3IEludDEyOChyaHMpKTtcbiAgfTtcbiAgSW50MTI4Lm9wX0RpdmlzaW9uID0gZnVuY3Rpb24gKGxocywgcmhzKVxuICB7XG4gICAgcmV0dXJuIGxocy5kaXZpZGUocmhzKTtcbiAgfTtcbiAgSW50MTI4LnByb3RvdHlwZS5Ub0RvdWJsZSA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICByZXR1cm4gcGFyc2VGbG9hdCh0aGlzLnRvU3RyaW5nKCkpOyAvLyBUaGlzIGNvdWxkIGJlIHNvbWV0aGluZyBmYXN0ZXJcbiAgfTtcbiAgLy8gZW5kIG9mIEludDEyOCBzZWN0aW9uXG4gIC8qXG4gIC8vIFVuY29tbWVudCB0aGUgZm9sbG93aW5nIHR3byBsaW5lcyBpZiB5b3Ugd2FudCB0byB1c2UgSW50MTI4IG91dHNpZGUgQ2xpcHBlckxpYlxuICBpZiAodHlwZW9mKGRvY3VtZW50KSAhPT0gXCJ1bmRlZmluZWRcIikgd2luZG93LkludDEyOCA9IEludDEyODtcbiAgZWxzZSBzZWxmLkludDEyOCA9IEludDEyODtcbiAgKi9cblxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBIZXJlIHN0YXJ0cyB0aGUgYWN0dWFsIENsaXBwZXIgbGlicmFyeTpcbiAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIHN1cHBvcnQgSW5oZXJpdGFuY2UgaW4gSmF2YXNjcmlwdFxuXHR2YXIgSW5oZXJpdCA9IGZ1bmN0aW9uIChjZSwgY2UyKVxuXHR7XG5cdFx0dmFyIHA7XG5cdFx0aWYgKHR5cGVvZiAoT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMpID09ICd1bmRlZmluZWQnKVxuXHRcdHtcblx0XHRcdGZvciAocCBpbiBjZTIucHJvdG90eXBlKVxuXHRcdFx0XHRpZiAodHlwZW9mIChjZS5wcm90b3R5cGVbcF0pID09ICd1bmRlZmluZWQnIHx8IGNlLnByb3RvdHlwZVtwXSA9PSBPYmplY3QucHJvdG90eXBlW3BdKSBjZS5wcm90b3R5cGVbcF0gPSBjZTIucHJvdG90eXBlW3BdO1xuXHRcdFx0Zm9yIChwIGluIGNlMilcblx0XHRcdFx0aWYgKHR5cGVvZiAoY2VbcF0pID09ICd1bmRlZmluZWQnKSBjZVtwXSA9IGNlMltwXTtcblx0XHRcdGNlLiRiYXNlQ3RvciA9IGNlMjtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdHZhciBwcm9wcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGNlMi5wcm90b3R5cGUpO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKylcblx0XHRcdFx0aWYgKHR5cGVvZiAoT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihjZS5wcm90b3R5cGUsIHByb3BzW2ldKSkgPT0gJ3VuZGVmaW5lZCcpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjZS5wcm90b3R5cGUsIHByb3BzW2ldLCBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGNlMi5wcm90b3R5cGUsIHByb3BzW2ldKSk7XG5cdFx0XHRmb3IgKHAgaW4gY2UyKVxuXHRcdFx0XHRpZiAodHlwZW9mIChjZVtwXSkgPT0gJ3VuZGVmaW5lZCcpIGNlW3BdID0gY2UyW3BdO1xuXHRcdFx0Y2UuJGJhc2VDdG9yID0gY2UyO1xuXHRcdH1cblx0fTtcbiAgQ2xpcHBlckxpYi5QYXRoID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHJldHVybiBbXTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5QYXRocyA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICByZXR1cm4gW107IC8vIFdhcyBwcmV2aW91c2x5IFtbXV0sIGJ1dCBjYXVzZWQgcHJvYmxlbXMgd2hlbiBwdXNoZWRcbiAgfTtcbiAgLy8gUHJlc2VydmVzIHRoZSBjYWxsaW5nIHdheSBvZiBvcmlnaW5hbCBDIyBDbGlwcGVyXG4gIC8vIElzIGVzc2VudGlhbCBkdWUgdG8gY29tcGF0aWJpbGl0eSwgYmVjYXVzZSBEb3VibGVQb2ludCBpcyBwdWJsaWMgY2xhc3MgaW4gb3JpZ2luYWwgQyMgdmVyc2lvblxuICBDbGlwcGVyTGliLkRvdWJsZVBvaW50ID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHZhciBhID0gYXJndW1lbnRzO1xuICAgIHRoaXMuWCA9IDA7XG4gICAgdGhpcy5ZID0gMDtcbiAgICAvLyBwdWJsaWMgRG91YmxlUG9pbnQoRG91YmxlUG9pbnQgZHApXG4gICAgLy8gcHVibGljIERvdWJsZVBvaW50KEludFBvaW50IGlwKVxuICAgIGlmIChhLmxlbmd0aCA9PSAxKVxuICAgIHtcbiAgICAgIHRoaXMuWCA9IGFbMF0uWDtcbiAgICAgIHRoaXMuWSA9IGFbMF0uWTtcbiAgICB9XG4gICAgZWxzZSBpZiAoYS5sZW5ndGggPT0gMilcbiAgICB7XG4gICAgICB0aGlzLlggPSBhWzBdO1xuICAgICAgdGhpcy5ZID0gYVsxXTtcbiAgICB9XG4gIH07IC8vIFRoaXMgaXMgaW50ZXJuYWwgZmFzdGVyIGZ1bmN0aW9uIHdoZW4gY2FsbGVkIHdpdGhvdXQgYXJndW1lbnRzXG4gIENsaXBwZXJMaWIuRG91YmxlUG9pbnQwID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHRoaXMuWCA9IDA7XG4gICAgdGhpcy5ZID0gMDtcbiAgfTtcbiAgLy8gVGhpcyBpcyBpbnRlcm5hbCBmYXN0ZXIgZnVuY3Rpb24gd2hlbiBjYWxsZWQgd2l0aCAxIGFyZ3VtZW50IChkcCBvciBpcClcbiAgQ2xpcHBlckxpYi5Eb3VibGVQb2ludDEgPSBmdW5jdGlvbiAoZHApXG4gIHtcbiAgICB0aGlzLlggPSBkcC5YO1xuICAgIHRoaXMuWSA9IGRwLlk7XG4gIH07XG4gIC8vIFRoaXMgaXMgaW50ZXJuYWwgZmFzdGVyIGZ1bmN0aW9uIHdoZW4gY2FsbGVkIHdpdGggMiBhcmd1bWVudHMgKHggYW5kIHkpXG4gIENsaXBwZXJMaWIuRG91YmxlUG9pbnQyID0gZnVuY3Rpb24gKHgsIHkpXG4gIHtcbiAgICB0aGlzLlggPSB4O1xuICAgIHRoaXMuWSA9IHk7XG4gIH07XG4gIC8vIFBvbHlUcmVlICYgUG9seU5vZGUgc3RhcnRcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBDbGlwcGVyTGliLlBvbHlOb2RlID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHRoaXMubV9QYXJlbnQgPSBudWxsO1xuICAgIHRoaXMubV9wb2x5Z29uID0gbmV3IENsaXBwZXJMaWIuUGF0aCgpO1xuICAgIHRoaXMubV9JbmRleCA9IDA7XG4gICAgdGhpcy5tX2pvaW50eXBlID0gMDtcbiAgICB0aGlzLm1fZW5kdHlwZSA9IDA7XG4gICAgdGhpcy5tX0NoaWxkcyA9IFtdO1xuICAgIHRoaXMuSXNPcGVuID0gZmFsc2U7XG4gIH07XG4gIENsaXBwZXJMaWIuUG9seU5vZGUucHJvdG90eXBlLklzSG9sZU5vZGUgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdmFyIHJlc3VsdCA9IHRydWU7XG4gICAgdmFyIG5vZGUgPSB0aGlzLm1fUGFyZW50O1xuICAgIHdoaWxlIChub2RlICE9PSBudWxsKVxuICAgIHtcbiAgICAgIHJlc3VsdCA9ICFyZXN1bHQ7XG4gICAgICBub2RlID0gbm9kZS5tX1BhcmVudDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5Qb2x5Tm9kZS5wcm90b3R5cGUuQ2hpbGRDb3VudCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICByZXR1cm4gdGhpcy5tX0NoaWxkcy5sZW5ndGg7XG4gIH07XG4gIENsaXBwZXJMaWIuUG9seU5vZGUucHJvdG90eXBlLkNvbnRvdXIgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXMubV9wb2x5Z29uO1xuICB9O1xuICBDbGlwcGVyTGliLlBvbHlOb2RlLnByb3RvdHlwZS5BZGRDaGlsZCA9IGZ1bmN0aW9uIChDaGlsZClcbiAge1xuICAgIHZhciBjbnQgPSB0aGlzLm1fQ2hpbGRzLmxlbmd0aDtcbiAgICB0aGlzLm1fQ2hpbGRzLnB1c2goQ2hpbGQpO1xuICAgIENoaWxkLm1fUGFyZW50ID0gdGhpcztcbiAgICBDaGlsZC5tX0luZGV4ID0gY250O1xuICB9O1xuICBDbGlwcGVyTGliLlBvbHlOb2RlLnByb3RvdHlwZS5HZXROZXh0ID0gZnVuY3Rpb24gKClcbiAge1xuICAgIGlmICh0aGlzLm1fQ2hpbGRzLmxlbmd0aCA+IDApXG4gICAgICByZXR1cm4gdGhpcy5tX0NoaWxkc1swXTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gdGhpcy5HZXROZXh0U2libGluZ1VwKCk7XG4gIH07XG4gIENsaXBwZXJMaWIuUG9seU5vZGUucHJvdG90eXBlLkdldE5leHRTaWJsaW5nVXAgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgaWYgKHRoaXMubV9QYXJlbnQgPT09IG51bGwpXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICBlbHNlIGlmICh0aGlzLm1fSW5kZXggPT0gdGhpcy5tX1BhcmVudC5tX0NoaWxkcy5sZW5ndGggLSAxKVxuICAgICAgcmV0dXJuIHRoaXMubV9QYXJlbnQuR2V0TmV4dFNpYmxpbmdVcCgpO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiB0aGlzLm1fUGFyZW50Lm1fQ2hpbGRzW3RoaXMubV9JbmRleCArIDFdO1xuICB9O1xuICBDbGlwcGVyTGliLlBvbHlOb2RlLnByb3RvdHlwZS5DaGlsZHMgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgcmV0dXJuIHRoaXMubV9DaGlsZHM7XG4gIH07XG4gIENsaXBwZXJMaWIuUG9seU5vZGUucHJvdG90eXBlLlBhcmVudCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICByZXR1cm4gdGhpcy5tX1BhcmVudDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5Qb2x5Tm9kZS5wcm90b3R5cGUuSXNIb2xlID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHJldHVybiB0aGlzLklzSG9sZU5vZGUoKTtcbiAgfTtcbiAgLy8gUG9seVRyZWUgOiBQb2x5Tm9kZVxuICBDbGlwcGVyTGliLlBvbHlUcmVlID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHRoaXMubV9BbGxQb2x5cyA9IFtdO1xuICAgIENsaXBwZXJMaWIuUG9seU5vZGUuY2FsbCh0aGlzKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5Qb2x5VHJlZS5wcm90b3R5cGUuQ2xlYXIgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlsZW4gPSB0aGlzLm1fQWxsUG9seXMubGVuZ3RoOyBpIDwgaWxlbjsgaSsrKVxuICAgICAgdGhpcy5tX0FsbFBvbHlzW2ldID0gbnVsbDtcbiAgICB0aGlzLm1fQWxsUG9seXMubGVuZ3RoID0gMDtcbiAgICB0aGlzLm1fQ2hpbGRzLmxlbmd0aCA9IDA7XG4gIH07XG4gIENsaXBwZXJMaWIuUG9seVRyZWUucHJvdG90eXBlLkdldEZpcnN0ID0gZnVuY3Rpb24gKClcbiAge1xuICAgIGlmICh0aGlzLm1fQ2hpbGRzLmxlbmd0aCA+IDApXG4gICAgICByZXR1cm4gdGhpcy5tX0NoaWxkc1swXTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gbnVsbDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5Qb2x5VHJlZS5wcm90b3R5cGUuVG90YWwgPSBmdW5jdGlvbiAoKVxuICB7XG5cdFx0dmFyIHJlc3VsdCA9IHRoaXMubV9BbGxQb2x5cy5sZW5ndGg7XG5cdFx0Ly93aXRoIG5lZ2F0aXZlIG9mZnNldHMsIGlnbm9yZSB0aGUgaGlkZGVuIG91dGVyIHBvbHlnb24gLi4uXG5cdFx0aWYgKHJlc3VsdCA+IDAgJiYgdGhpcy5tX0NoaWxkc1swXSAhPSB0aGlzLm1fQWxsUG9seXNbMF0pIHJlc3VsdC0tO1xuXHRcdHJldHVybiByZXN1bHQ7XG4gIH07XG4gIEluaGVyaXQoQ2xpcHBlckxpYi5Qb2x5VHJlZSwgQ2xpcHBlckxpYi5Qb2x5Tm9kZSk7XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gUG9seVRyZWUgJiBQb2x5Tm9kZSBlbmRcbiAgQ2xpcHBlckxpYi5NYXRoX0Fic19JbnQ2NCA9IENsaXBwZXJMaWIuTWF0aF9BYnNfSW50MzIgPSBDbGlwcGVyTGliLk1hdGhfQWJzX0RvdWJsZSA9IGZ1bmN0aW9uIChhKVxuICB7XG4gICAgcmV0dXJuIE1hdGguYWJzKGEpO1xuICB9O1xuICBDbGlwcGVyTGliLk1hdGhfTWF4X0ludDMyX0ludDMyID0gZnVuY3Rpb24gKGEsIGIpXG4gIHtcbiAgICByZXR1cm4gTWF0aC5tYXgoYSwgYik7XG4gIH07XG4gIC8qXG4gIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNhc3RfMzIgc3BlZWR0ZXN0OiBodHRwOi8vanNwZXJmLmNvbS90cnVuY2F0ZS1mbG9hdC10by1pbnRlZ2VyLzJcbiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgKi9cbiAgaWYgKGJyb3dzZXIubXNpZSB8fCBicm93c2VyLm9wZXJhIHx8IGJyb3dzZXIuc2FmYXJpKSBDbGlwcGVyTGliLkNhc3RfSW50MzIgPSBmdW5jdGlvbiAoYSlcbiAge1xuICAgIHJldHVybiBhIHwgMDtcbiAgfTtcbiAgZWxzZSBDbGlwcGVyTGliLkNhc3RfSW50MzIgPSBmdW5jdGlvbiAoYSlcbiAgeyAvLyBlZy4gYnJvd3Nlci5jaHJvbWUgfHwgYnJvd3Nlci5jaHJvbWl1bSB8fCBicm93c2VyLmZpcmVmb3hcbiAgICByZXR1cm5+fiBhO1xuICB9O1xuICAvKlxuICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjYXN0XzY0IHNwZWVkdGVzdHM6IGh0dHA6Ly9qc3BlcmYuY29tL3RydW5jYXRlLWZsb2F0LXRvLWludGVnZXJcbiAgQ2hyb21lOiBiaXR3aXNlX25vdF9mbG9vclxuICBGaXJlZm94MTc6IHRvSW50ZWdlciAodHlwZW9mIHRlc3QpXG4gIElFOTogYml0d2lzZV9vcl9mbG9vclxuICBJRTcgYW5kIElFODogdG9fcGFyc2VpbnRcbiAgQ2hyb21pdW06IHRvX2Zsb29yX29yX2NlaWxcbiAgRmlyZWZveDM6IHRvX2Zsb29yX29yX2NlaWxcbiAgRmlyZWZveDE1OiB0b19mbG9vcl9vcl9jZWlsXG4gIE9wZXJhOiB0b19mbG9vcl9vcl9jZWlsXG4gIFNhZmFyaTogdG9fZmxvb3Jfb3JfY2VpbFxuICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAqL1xuICBpZiAoYnJvd3Nlci5jaHJvbWUpIENsaXBwZXJMaWIuQ2FzdF9JbnQ2NCA9IGZ1bmN0aW9uIChhKVxuICB7XG4gICAgaWYgKGEgPCAtMjE0NzQ4MzY0OCB8fCBhID4gMjE0NzQ4MzY0NylcbiAgICAgIHJldHVybiBhIDwgMCA/IE1hdGguY2VpbChhKSA6IE1hdGguZmxvb3IoYSk7XG4gICAgZWxzZSByZXR1cm5+fiBhO1xuICB9O1xuICBlbHNlIGlmIChicm93c2VyLmZpcmVmb3ggJiYgdHlwZW9mIChOdW1iZXIudG9JbnRlZ2VyKSA9PSBcImZ1bmN0aW9uXCIpIENsaXBwZXJMaWIuQ2FzdF9JbnQ2NCA9IGZ1bmN0aW9uIChhKVxuICB7XG4gICAgcmV0dXJuIE51bWJlci50b0ludGVnZXIoYSk7XG4gIH07XG4gIGVsc2UgaWYgKGJyb3dzZXIubXNpZTcgfHwgYnJvd3Nlci5tc2llOCkgQ2xpcHBlckxpYi5DYXN0X0ludDY0ID0gZnVuY3Rpb24gKGEpXG4gIHtcbiAgICByZXR1cm4gcGFyc2VJbnQoYSwgMTApO1xuICB9O1xuICBlbHNlIGlmIChicm93c2VyLm1zaWUpIENsaXBwZXJMaWIuQ2FzdF9JbnQ2NCA9IGZ1bmN0aW9uIChhKVxuICB7XG4gICAgaWYgKGEgPCAtMjE0NzQ4MzY0OCB8fCBhID4gMjE0NzQ4MzY0NylcbiAgICAgIHJldHVybiBhIDwgMCA/IE1hdGguY2VpbChhKSA6IE1hdGguZmxvb3IoYSk7XG4gICAgcmV0dXJuIGEgfCAwO1xuICB9O1xuICAvLyBlZy4gYnJvd3Nlci5jaHJvbWl1bSB8fCBicm93c2VyLmZpcmVmb3ggfHwgYnJvd3Nlci5vcGVyYSB8fCBicm93c2VyLnNhZmFyaVxuICBlbHNlIENsaXBwZXJMaWIuQ2FzdF9JbnQ2NCA9IGZ1bmN0aW9uIChhKVxuICB7XG4gICAgcmV0dXJuIGEgPCAwID8gTWF0aC5jZWlsKGEpIDogTWF0aC5mbG9vcihhKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGVhciA9IGZ1bmN0aW9uIChhKVxuICB7XG4gICAgYS5sZW5ndGggPSAwO1xuICB9O1xuICAvL0NsaXBwZXJMaWIuTWF4U3RlcHMgPSA2NDsgLy8gSG93IG1hbnkgc3RlcHMgYXQgbWF4aW11bSBpbiBhcmMgaW4gQnVpbGRBcmMoKSBmdW5jdGlvblxuICBDbGlwcGVyTGliLlBJID0gMy4xNDE1OTI2NTM1ODk3OTM7XG4gIENsaXBwZXJMaWIuUEkyID0gMiAqIDMuMTQxNTkyNjUzNTg5NzkzO1xuICBDbGlwcGVyTGliLkludFBvaW50ID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHZhciBhID0gYXJndW1lbnRzLFxuICAgICAgYWxlbiA9IGEubGVuZ3RoO1xuICAgIHRoaXMuWCA9IDA7XG4gICAgdGhpcy5ZID0gMDtcbiAgICBpZiAodXNlX3h5eilcbiAgICB7XG4gICAgICB0aGlzLlogPSAwO1xuICAgICAgaWYgKGFsZW4gPT0gMykgLy8gcHVibGljIEludFBvaW50KGNJbnQgeCwgY0ludCB5LCBjSW50IHogPSAwKVxuICAgICAge1xuICAgICAgICB0aGlzLlggPSBhWzBdO1xuICAgICAgICB0aGlzLlkgPSBhWzFdO1xuICAgICAgICB0aGlzLlogPSBhWzJdO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoYWxlbiA9PSAyKSAvLyBwdWJsaWMgSW50UG9pbnQoY0ludCB4LCBjSW50IHkpXG4gICAgICB7XG4gICAgICAgIHRoaXMuWCA9IGFbMF07XG4gICAgICAgIHRoaXMuWSA9IGFbMV07XG4gICAgICAgIHRoaXMuWiA9IDA7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChhbGVuID09IDEpXG4gICAgICB7XG4gICAgICAgIGlmIChhWzBdIGluc3RhbmNlb2YgQ2xpcHBlckxpYi5Eb3VibGVQb2ludCkgLy8gcHVibGljIEludFBvaW50KERvdWJsZVBvaW50IGRwKVxuICAgICAgICB7XG4gICAgICAgICAgdmFyIGRwID0gYVswXTtcbiAgICAgICAgICB0aGlzLlggPSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQoZHAuWCk7XG4gICAgICAgICAgdGhpcy5ZID0gQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kKGRwLlkpO1xuICAgICAgICAgIHRoaXMuWiA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSAvLyBwdWJsaWMgSW50UG9pbnQoSW50UG9pbnQgcHQpXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgcHQgPSBhWzBdO1xuICAgICAgICAgIGlmICh0eXBlb2YgKHB0LlopID09IFwidW5kZWZpbmVkXCIpIHB0LlogPSAwO1xuICAgICAgICAgIHRoaXMuWCA9IHB0Llg7XG4gICAgICAgICAgdGhpcy5ZID0gcHQuWTtcbiAgICAgICAgICB0aGlzLlogPSBwdC5aO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIC8vIHB1YmxpYyBJbnRQb2ludCgpXG4gICAgICB7XG4gICAgICAgIHRoaXMuWCA9IDA7XG4gICAgICAgIHRoaXMuWSA9IDA7XG4gICAgICAgIHRoaXMuWiA9IDA7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgLy8gaWYgKCF1c2VfeHl6KVxuICAgIHtcbiAgICAgIGlmIChhbGVuID09IDIpIC8vIHB1YmxpYyBJbnRQb2ludChjSW50IFgsIGNJbnQgWSlcbiAgICAgIHtcbiAgICAgICAgdGhpcy5YID0gYVswXTtcbiAgICAgICAgdGhpcy5ZID0gYVsxXTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGFsZW4gPT0gMSlcbiAgICAgIHtcbiAgICAgICAgaWYgKGFbMF0gaW5zdGFuY2VvZiBDbGlwcGVyTGliLkRvdWJsZVBvaW50KSAvLyBwdWJsaWMgSW50UG9pbnQoRG91YmxlUG9pbnQgZHApXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgZHAgPSBhWzBdO1xuICAgICAgICAgIHRoaXMuWCA9IENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZChkcC5YKTtcbiAgICAgICAgICB0aGlzLlkgPSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQoZHAuWSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSAvLyBwdWJsaWMgSW50UG9pbnQoSW50UG9pbnQgcHQpXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgcHQgPSBhWzBdO1xuICAgICAgICAgIHRoaXMuWCA9IHB0Llg7XG4gICAgICAgICAgdGhpcy5ZID0gcHQuWTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSAvLyBwdWJsaWMgSW50UG9pbnQoSW50UG9pbnQgcHQpXG4gICAgICB7XG4gICAgICAgIHRoaXMuWCA9IDA7XG4gICAgICAgIHRoaXMuWSA9IDA7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5ID0gZnVuY3Rpb24gKGEsIGIpXG4gIHtcbiAgICAvL3JldHVybiBhID09IGI7XG4gICAgcmV0dXJuIGEuWCA9PSBiLlggJiYgYS5ZID09IGIuWTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9JbmVxdWFsaXR5ID0gZnVuY3Rpb24gKGEsIGIpXG4gIHtcbiAgICAvL3JldHVybiBhICE9IGI7XG4gICAgcmV0dXJuIGEuWCAhPSBiLlggfHwgYS5ZICE9IGIuWTtcbiAgfTtcbiAgLypcbiAgQ2xpcHBlckxpYi5JbnRQb2ludC5wcm90b3R5cGUuRXF1YWxzID0gZnVuY3Rpb24gKG9iailcbiAge1xuICAgIGlmIChvYmogPT09IG51bGwpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgQ2xpcHBlckxpYi5JbnRQb2ludClcbiAgICB7XG4gICAgICAgIHZhciBhID0gQ2FzdChvYmosIENsaXBwZXJMaWIuSW50UG9pbnQpO1xuICAgICAgICByZXR1cm4gKHRoaXMuWCA9PSBhLlgpICYmICh0aGlzLlkgPT0gYS5ZKTtcbiAgICB9XG4gICAgZWxzZVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gIH07XG4qL1xuICBpZiAodXNlX3h5eilcbiAge1xuICAgIENsaXBwZXJMaWIuSW50UG9pbnQwID0gZnVuY3Rpb24gKClcbiAgICB7XG4gICAgICB0aGlzLlggPSAwO1xuICAgICAgdGhpcy5ZID0gMDtcbiAgICAgIHRoaXMuWiA9IDA7XG4gICAgfTtcbiAgICBDbGlwcGVyTGliLkludFBvaW50MSA9IGZ1bmN0aW9uIChwdClcbiAgICB7XG4gICAgICB0aGlzLlggPSBwdC5YO1xuICAgICAgdGhpcy5ZID0gcHQuWTtcbiAgICAgIHRoaXMuWiA9IHB0Llo7XG4gICAgfTtcbiAgICBDbGlwcGVyTGliLkludFBvaW50MWRwID0gZnVuY3Rpb24gKGRwKVxuICAgIHtcbiAgICAgIHRoaXMuWCA9IENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZChkcC5YKTtcbiAgICAgIHRoaXMuWSA9IENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZChkcC5ZKTtcbiAgICAgIHRoaXMuWiA9IDA7XG4gICAgfTtcbiAgICBDbGlwcGVyTGliLkludFBvaW50MiA9IGZ1bmN0aW9uICh4LCB5KVxuICAgIHtcbiAgICAgIHRoaXMuWCA9IHg7XG4gICAgICB0aGlzLlkgPSB5O1xuICAgICAgdGhpcy5aID0gMDtcbiAgICB9O1xuICAgIENsaXBwZXJMaWIuSW50UG9pbnQzID0gZnVuY3Rpb24gKHgsIHksIHopXG4gICAge1xuICAgICAgdGhpcy5YID0geDtcbiAgICAgIHRoaXMuWSA9IHk7XG4gICAgICB0aGlzLlogPSB6O1xuICAgIH07XG4gIH1cbiAgZWxzZSAvLyBpZiAoIXVzZV94eXopXG4gIHtcbiAgICBDbGlwcGVyTGliLkludFBvaW50MCA9IGZ1bmN0aW9uICgpXG4gICAge1xuICAgICAgdGhpcy5YID0gMDtcbiAgICAgIHRoaXMuWSA9IDA7XG4gICAgfTtcbiAgICBDbGlwcGVyTGliLkludFBvaW50MSA9IGZ1bmN0aW9uIChwdClcbiAgICB7XG4gICAgICB0aGlzLlggPSBwdC5YO1xuICAgICAgdGhpcy5ZID0gcHQuWTtcbiAgICB9O1xuICAgIENsaXBwZXJMaWIuSW50UG9pbnQxZHAgPSBmdW5jdGlvbiAoZHApXG4gICAge1xuICAgICAgdGhpcy5YID0gQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kKGRwLlgpO1xuICAgICAgdGhpcy5ZID0gQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kKGRwLlkpO1xuICAgIH07XG4gICAgQ2xpcHBlckxpYi5JbnRQb2ludDIgPSBmdW5jdGlvbiAoeCwgeSlcbiAgICB7XG4gICAgICB0aGlzLlggPSB4O1xuICAgICAgdGhpcy5ZID0geTtcbiAgICB9O1xuICB9XG4gIENsaXBwZXJMaWIuSW50UmVjdCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB2YXIgYSA9IGFyZ3VtZW50cyxcbiAgICAgIGFsZW4gPSBhLmxlbmd0aDtcbiAgICBpZiAoYWxlbiA9PSA0KSAvLyBmdW5jdGlvbiAobCwgdCwgciwgYilcbiAgICB7XG4gICAgICB0aGlzLmxlZnQgPSBhWzBdO1xuICAgICAgdGhpcy50b3AgPSBhWzFdO1xuICAgICAgdGhpcy5yaWdodCA9IGFbMl07XG4gICAgICB0aGlzLmJvdHRvbSA9IGFbM107XG4gICAgfVxuICAgIGVsc2UgaWYgKGFsZW4gPT0gMSkgLy8gZnVuY3Rpb24gKGlyKVxuICAgIHtcbiAgICAgIHRoaXMubGVmdCA9IGlyLmxlZnQ7XG4gICAgICB0aGlzLnRvcCA9IGlyLnRvcDtcbiAgICAgIHRoaXMucmlnaHQgPSBpci5yaWdodDtcbiAgICAgIHRoaXMuYm90dG9tID0gaXIuYm90dG9tO1xuICAgIH1cbiAgICBlbHNlIC8vIGZ1bmN0aW9uICgpXG4gICAge1xuICAgICAgdGhpcy5sZWZ0ID0gMDtcbiAgICAgIHRoaXMudG9wID0gMDtcbiAgICAgIHRoaXMucmlnaHQgPSAwO1xuICAgICAgdGhpcy5ib3R0b20gPSAwO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5JbnRSZWN0MCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB0aGlzLmxlZnQgPSAwO1xuICAgIHRoaXMudG9wID0gMDtcbiAgICB0aGlzLnJpZ2h0ID0gMDtcbiAgICB0aGlzLmJvdHRvbSA9IDA7XG4gIH07XG4gIENsaXBwZXJMaWIuSW50UmVjdDEgPSBmdW5jdGlvbiAoaXIpXG4gIHtcbiAgICB0aGlzLmxlZnQgPSBpci5sZWZ0O1xuICAgIHRoaXMudG9wID0gaXIudG9wO1xuICAgIHRoaXMucmlnaHQgPSBpci5yaWdodDtcbiAgICB0aGlzLmJvdHRvbSA9IGlyLmJvdHRvbTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5JbnRSZWN0NCA9IGZ1bmN0aW9uIChsLCB0LCByLCBiKVxuICB7XG4gICAgdGhpcy5sZWZ0ID0gbDtcbiAgICB0aGlzLnRvcCA9IHQ7XG4gICAgdGhpcy5yaWdodCA9IHI7XG4gICAgdGhpcy5ib3R0b20gPSBiO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBUeXBlID0ge1xuICAgIGN0SW50ZXJzZWN0aW9uOiAwLFxuICAgIGN0VW5pb246IDEsXG4gICAgY3REaWZmZXJlbmNlOiAyLFxuICAgIGN0WG9yOiAzXG4gIH07XG4gIENsaXBwZXJMaWIuUG9seVR5cGUgPSB7XG4gICAgcHRTdWJqZWN0OiAwLFxuICAgIHB0Q2xpcDogMVxuICB9O1xuICBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZSA9IHtcbiAgICBwZnRFdmVuT2RkOiAwLFxuICAgIHBmdE5vblplcm86IDEsXG4gICAgcGZ0UG9zaXRpdmU6IDIsXG4gICAgcGZ0TmVnYXRpdmU6IDNcbiAgfTtcbiAgQ2xpcHBlckxpYi5Kb2luVHlwZSA9IHtcbiAgICBqdFNxdWFyZTogMCxcbiAgICBqdFJvdW5kOiAxLFxuICAgIGp0TWl0ZXI6IDJcbiAgfTtcbiAgQ2xpcHBlckxpYi5FbmRUeXBlID0ge1xuICAgIGV0T3BlblNxdWFyZTogMCxcbiAgICBldE9wZW5Sb3VuZDogMSxcbiAgICBldE9wZW5CdXR0OiAyLFxuICAgIGV0Q2xvc2VkTGluZTogMyxcbiAgICBldENsb3NlZFBvbHlnb246IDRcbiAgfTtcbiAgQ2xpcHBlckxpYi5FZGdlU2lkZSA9IHtcbiAgICBlc0xlZnQ6IDAsXG4gICAgZXNSaWdodDogMVxuICB9O1xuICBDbGlwcGVyTGliLkRpcmVjdGlvbiA9IHtcbiAgICBkUmlnaHRUb0xlZnQ6IDAsXG4gICAgZExlZnRUb1JpZ2h0OiAxXG4gIH07XG4gIENsaXBwZXJMaWIuVEVkZ2UgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdGhpcy5Cb3QgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludCgpO1xuICAgIHRoaXMuQ3VyciA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KCk7XG4gICAgdGhpcy5Ub3AgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludCgpO1xuICAgIHRoaXMuRGVsdGEgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludCgpO1xuICAgIHRoaXMuRHggPSAwO1xuICAgIHRoaXMuUG9seVR5cCA9IENsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0O1xuICAgIHRoaXMuU2lkZSA9IENsaXBwZXJMaWIuRWRnZVNpZGUuZXNMZWZ0O1xuICAgIHRoaXMuV2luZERlbHRhID0gMDtcbiAgICB0aGlzLldpbmRDbnQgPSAwO1xuICAgIHRoaXMuV2luZENudDIgPSAwO1xuICAgIHRoaXMuT3V0SWR4ID0gMDtcbiAgICB0aGlzLk5leHQgPSBudWxsO1xuICAgIHRoaXMuUHJldiA9IG51bGw7XG4gICAgdGhpcy5OZXh0SW5MTUwgPSBudWxsO1xuICAgIHRoaXMuTmV4dEluQUVMID0gbnVsbDtcbiAgICB0aGlzLlByZXZJbkFFTCA9IG51bGw7XG4gICAgdGhpcy5OZXh0SW5TRUwgPSBudWxsO1xuICAgIHRoaXMuUHJldkluU0VMID0gbnVsbDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5JbnRlcnNlY3ROb2RlID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHRoaXMuRWRnZTEgPSBudWxsO1xuICAgIHRoaXMuRWRnZTIgPSBudWxsO1xuICAgIHRoaXMuUHQgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludCgpO1xuICB9O1xuICBDbGlwcGVyTGliLk15SW50ZXJzZWN0Tm9kZVNvcnQgPSBmdW5jdGlvbiAoKSB7fTtcbiAgQ2xpcHBlckxpYi5NeUludGVyc2VjdE5vZGVTb3J0LkNvbXBhcmUgPSBmdW5jdGlvbiAobm9kZTEsIG5vZGUyKVxuICB7XG4gICAgdmFyIGkgPSBub2RlMi5QdC5ZIC0gbm9kZTEuUHQuWTtcbiAgICBpZiAoaSA+IDApIHJldHVybiAxO1xuICAgIGVsc2UgaWYgKGkgPCAwKSByZXR1cm4gLTE7XG4gICAgZWxzZSByZXR1cm4gMDtcbiAgfTtcblxuICBDbGlwcGVyTGliLkxvY2FsTWluaW1hID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHRoaXMuWSA9IDA7XG4gICAgdGhpcy5MZWZ0Qm91bmQgPSBudWxsO1xuICAgIHRoaXMuUmlnaHRCb3VuZCA9IG51bGw7XG4gICAgdGhpcy5OZXh0ID0gbnVsbDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5TY2FuYmVhbSA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB0aGlzLlkgPSAwO1xuICAgIHRoaXMuTmV4dCA9IG51bGw7XG4gIH07XG4gIENsaXBwZXJMaWIuT3V0UmVjID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHRoaXMuSWR4ID0gMDtcbiAgICB0aGlzLklzSG9sZSA9IGZhbHNlO1xuICAgIHRoaXMuSXNPcGVuID0gZmFsc2U7XG4gICAgdGhpcy5GaXJzdExlZnQgPSBudWxsO1xuICAgIHRoaXMuUHRzID0gbnVsbDtcbiAgICB0aGlzLkJvdHRvbVB0ID0gbnVsbDtcbiAgICB0aGlzLlBvbHlOb2RlID0gbnVsbDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5PdXRQdCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB0aGlzLklkeCA9IDA7XG4gICAgdGhpcy5QdCA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KCk7XG4gICAgdGhpcy5OZXh0ID0gbnVsbDtcbiAgICB0aGlzLlByZXYgPSBudWxsO1xuICB9O1xuICBDbGlwcGVyTGliLkpvaW4gPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdGhpcy5PdXRQdDEgPSBudWxsO1xuICAgIHRoaXMuT3V0UHQyID0gbnVsbDtcbiAgICB0aGlzLk9mZlB0ID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQoKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZSA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB0aGlzLm1fTWluaW1hTGlzdCA9IG51bGw7XG4gICAgdGhpcy5tX0N1cnJlbnRMTSA9IG51bGw7XG4gICAgdGhpcy5tX2VkZ2VzID0gbmV3IEFycmF5KCk7XG4gICAgdGhpcy5tX1VzZUZ1bGxSYW5nZSA9IGZhbHNlO1xuICAgIHRoaXMubV9IYXNPcGVuUGF0aHMgPSBmYWxzZTtcbiAgICB0aGlzLlByZXNlcnZlQ29sbGluZWFyID0gZmFsc2U7XG4gICAgdGhpcy5tX01pbmltYUxpc3QgPSBudWxsO1xuICAgIHRoaXMubV9DdXJyZW50TE0gPSBudWxsO1xuICAgIHRoaXMubV9Vc2VGdWxsUmFuZ2UgPSBmYWxzZTtcbiAgICB0aGlzLm1fSGFzT3BlblBhdGhzID0gZmFsc2U7XG4gIH07XG4gIC8vIFJhbmdlcyBhcmUgaW4gb3JpZ2luYWwgQyMgdG9vIGhpZ2ggZm9yIEphdmFzY3JpcHQgKGluIGN1cnJlbnQgc3RhdGUgMjAxMyBzZXB0ZW1iZXIpOlxuICAvLyBwcm90ZWN0ZWQgY29uc3QgZG91YmxlIGhvcml6b250YWwgPSAtMy40RSszODtcbiAgLy8gaW50ZXJuYWwgY29uc3QgY0ludCBsb1JhbmdlID0gMHgzRkZGRkZGRjsgLy8gPSAxMDczNzQxODIzID0gc3FydCgyXjYzIC0xKS8yXG4gIC8vIGludGVybmFsIGNvbnN0IGNJbnQgaGlSYW5nZSA9IDB4M0ZGRkZGRkZGRkZGRkZGRkw7IC8vID0gNDYxMTY4NjAxODQyNzM4NzkwMyA9IHNxcnQoMl4xMjcgLTEpLzJcbiAgLy8gU28gaGFkIHRvIGFkanVzdCB0aGVtIHRvIG1vcmUgc3VpdGFibGUgZm9yIEphdmFzY3JpcHQuXG4gIC8vIElmIEpTIHNvbWUgZGF5IHN1cHBvcnRzIHRydWx5IDY0LWJpdCBpbnRlZ2VycywgdGhlbiB0aGVzZSByYW5nZXMgY2FuIGJlIGFzIGluIEMjXG4gIC8vIGFuZCBiaWdpbnRlZ2VyIGxpYnJhcnkgY2FuIGJlIG1vcmUgc2ltcGxlciAoYXMgdGhlbiAxMjhiaXQgY2FuIGJlIHJlcHJlc2VudGVkIGFzIHR3byA2NGJpdCBudW1iZXJzKVxuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWwgPSAtOTAwNzE5OTI1NDc0MDk5MjsgLy8tMl41M1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNraXAgPSAtMjtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5VbmFzc2lnbmVkID0gLTE7XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UudG9sZXJhbmNlID0gMUUtMjA7XG4gIGlmICh1c2VfaW50MzIpXG4gIHtcbiAgICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmxvUmFuZ2UgPSAweDdGRkY7XG4gICAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5oaVJhbmdlID0gMHg3RkZGO1xuICB9XG4gIGVsc2VcbiAge1xuICAgIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UubG9SYW5nZSA9IDQ3NDUzMTMyOyAvLyBzcXJ0KDJeNTMgLTEpLzJcbiAgICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhpUmFuZ2UgPSA0NTAzNTk5NjI3MzcwNDk1OyAvLyBzcXJ0KDJeMTA2IC0xKS8yXG4gIH1cblxuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLm5lYXJfemVybyA9IGZ1bmN0aW9uICh2YWwpXG4gIHtcbiAgICByZXR1cm4gKHZhbCA+IC1DbGlwcGVyTGliLkNsaXBwZXJCYXNlLnRvbGVyYW5jZSkgJiYgKHZhbCA8IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UudG9sZXJhbmNlKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Jc0hvcml6b250YWwgPSBmdW5jdGlvbiAoZSlcbiAge1xuICAgIHJldHVybiBlLkRlbHRhLlkgPT09IDA7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLlBvaW50SXNWZXJ0ZXggPSBmdW5jdGlvbiAocHQsIHBwKVxuICB7XG4gICAgdmFyIHBwMiA9IHBwO1xuICAgIGRvIHtcbiAgICAgIGlmIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHBwMi5QdCwgcHQpKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIHBwMiA9IHBwMi5OZXh0O1xuICAgIH1cbiAgICB3aGlsZSAocHAyICE9IHBwKVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuUG9pbnRPbkxpbmVTZWdtZW50ID0gZnVuY3Rpb24gKHB0LCBsaW5lUHQxLCBsaW5lUHQyLCBVc2VGdWxsUmFuZ2UpXG4gIHtcbiAgICBpZiAoVXNlRnVsbFJhbmdlKVxuICAgICAgcmV0dXJuICgocHQuWCA9PSBsaW5lUHQxLlgpICYmIChwdC5ZID09IGxpbmVQdDEuWSkpIHx8XG4gICAgICAgICgocHQuWCA9PSBsaW5lUHQyLlgpICYmIChwdC5ZID09IGxpbmVQdDIuWSkpIHx8XG4gICAgICAgICgoKHB0LlggPiBsaW5lUHQxLlgpID09IChwdC5YIDwgbGluZVB0Mi5YKSkgJiZcbiAgICAgICAgKChwdC5ZID4gbGluZVB0MS5ZKSA9PSAocHQuWSA8IGxpbmVQdDIuWSkpICYmXG4gICAgICAgIChJbnQxMjgub3BfRXF1YWxpdHkoSW50MTI4LkludDEyOE11bCgocHQuWCAtIGxpbmVQdDEuWCksIChsaW5lUHQyLlkgLSBsaW5lUHQxLlkpKSxcbiAgICAgICAgICBJbnQxMjguSW50MTI4TXVsKChsaW5lUHQyLlggLSBsaW5lUHQxLlgpLCAocHQuWSAtIGxpbmVQdDEuWSkpKSkpO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiAoKHB0LlggPT0gbGluZVB0MS5YKSAmJiAocHQuWSA9PSBsaW5lUHQxLlkpKSB8fCAoKHB0LlggPT0gbGluZVB0Mi5YKSAmJiAocHQuWSA9PSBsaW5lUHQyLlkpKSB8fCAoKChwdC5YID4gbGluZVB0MS5YKSA9PSAocHQuWCA8IGxpbmVQdDIuWCkpICYmICgocHQuWSA+IGxpbmVQdDEuWSkgPT0gKHB0LlkgPCBsaW5lUHQyLlkpKSAmJiAoKHB0LlggLSBsaW5lUHQxLlgpICogKGxpbmVQdDIuWSAtIGxpbmVQdDEuWSkgPT0gKGxpbmVQdDIuWCAtIGxpbmVQdDEuWCkgKiAocHQuWSAtIGxpbmVQdDEuWSkpKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuUG9pbnRPblBvbHlnb24gPSBmdW5jdGlvbiAocHQsIHBwLCBVc2VGdWxsUmFuZ2UpXG4gIHtcbiAgICB2YXIgcHAyID0gcHA7XG4gICAgd2hpbGUgKHRydWUpXG4gICAge1xuICAgICAgaWYgKHRoaXMuUG9pbnRPbkxpbmVTZWdtZW50KHB0LCBwcDIuUHQsIHBwMi5OZXh0LlB0LCBVc2VGdWxsUmFuZ2UpKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIHBwMiA9IHBwMi5OZXh0O1xuICAgICAgaWYgKHBwMiA9PSBwcClcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuU2xvcGVzRXF1YWwgPSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNsb3Blc0VxdWFsID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHZhciBhID0gYXJndW1lbnRzLFxuICAgICAgYWxlbiA9IGEubGVuZ3RoO1xuICAgIHZhciBlMSwgZTIsIHB0MSwgcHQyLCBwdDMsIHB0NCwgVXNlRnVsbFJhbmdlO1xuICAgIGlmIChhbGVuID09IDMpIC8vIGZ1bmN0aW9uIChlMSwgZTIsIFVzZUZ1bGxSYW5nZSlcbiAgICB7XG4gICAgICBlMSA9IGFbMF07XG4gICAgICBlMiA9IGFbMV07XG4gICAgICBVc2VGdWxsUmFuZ2UgPSBhWzJdO1xuICAgICAgaWYgKFVzZUZ1bGxSYW5nZSlcbiAgICAgICAgcmV0dXJuIEludDEyOC5vcF9FcXVhbGl0eShJbnQxMjguSW50MTI4TXVsKGUxLkRlbHRhLlksIGUyLkRlbHRhLlgpLCBJbnQxMjguSW50MTI4TXVsKGUxLkRlbHRhLlgsIGUyLkRlbHRhLlkpKTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIENsaXBwZXJMaWIuQ2FzdF9JbnQ2NCgoZTEuRGVsdGEuWSkgKiAoZTIuRGVsdGEuWCkpID09IENsaXBwZXJMaWIuQ2FzdF9JbnQ2NCgoZTEuRGVsdGEuWCkgKiAoZTIuRGVsdGEuWSkpO1xuICAgIH1cbiAgICBlbHNlIGlmIChhbGVuID09IDQpIC8vIGZ1bmN0aW9uIChwdDEsIHB0MiwgcHQzLCBVc2VGdWxsUmFuZ2UpXG4gICAge1xuICAgICAgcHQxID0gYVswXTtcbiAgICAgIHB0MiA9IGFbMV07XG4gICAgICBwdDMgPSBhWzJdO1xuICAgICAgVXNlRnVsbFJhbmdlID0gYVszXTtcbiAgICAgIGlmIChVc2VGdWxsUmFuZ2UpXG4gICAgICAgIHJldHVybiBJbnQxMjgub3BfRXF1YWxpdHkoSW50MTI4LkludDEyOE11bChwdDEuWSAtIHB0Mi5ZLCBwdDIuWCAtIHB0My5YKSwgSW50MTI4LkludDEyOE11bChwdDEuWCAtIHB0Mi5YLCBwdDIuWSAtIHB0My5ZKSk7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBDbGlwcGVyTGliLkNhc3RfSW50NjQoKHB0MS5ZIC0gcHQyLlkpICogKHB0Mi5YIC0gcHQzLlgpKSAtIENsaXBwZXJMaWIuQ2FzdF9JbnQ2NCgocHQxLlggLSBwdDIuWCkgKiAocHQyLlkgLSBwdDMuWSkpID09PSAwO1xuICAgIH1cbiAgICBlbHNlIC8vIGZ1bmN0aW9uIChwdDEsIHB0MiwgcHQzLCBwdDQsIFVzZUZ1bGxSYW5nZSlcbiAgICB7XG4gICAgICBwdDEgPSBhWzBdO1xuICAgICAgcHQyID0gYVsxXTtcbiAgICAgIHB0MyA9IGFbMl07XG4gICAgICBwdDQgPSBhWzNdO1xuICAgICAgVXNlRnVsbFJhbmdlID0gYVs0XTtcbiAgICAgIGlmIChVc2VGdWxsUmFuZ2UpXG4gICAgICAgIHJldHVybiBJbnQxMjgub3BfRXF1YWxpdHkoSW50MTI4LkludDEyOE11bChwdDEuWSAtIHB0Mi5ZLCBwdDMuWCAtIHB0NC5YKSwgSW50MTI4LkludDEyOE11bChwdDEuWCAtIHB0Mi5YLCBwdDMuWSAtIHB0NC5ZKSk7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBDbGlwcGVyTGliLkNhc3RfSW50NjQoKHB0MS5ZIC0gcHQyLlkpICogKHB0My5YIC0gcHQ0LlgpKSAtIENsaXBwZXJMaWIuQ2FzdF9JbnQ2NCgocHQxLlggLSBwdDIuWCkgKiAocHQzLlkgLSBwdDQuWSkpID09PSAwO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5TbG9wZXNFcXVhbDMgPSBmdW5jdGlvbiAoZTEsIGUyLCBVc2VGdWxsUmFuZ2UpXG4gIHtcbiAgICBpZiAoVXNlRnVsbFJhbmdlKVxuICAgICAgcmV0dXJuIEludDEyOC5vcF9FcXVhbGl0eShJbnQxMjguSW50MTI4TXVsKGUxLkRlbHRhLlksIGUyLkRlbHRhLlgpLCBJbnQxMjguSW50MTI4TXVsKGUxLkRlbHRhLlgsIGUyLkRlbHRhLlkpKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gQ2xpcHBlckxpYi5DYXN0X0ludDY0KChlMS5EZWx0YS5ZKSAqIChlMi5EZWx0YS5YKSkgPT0gQ2xpcHBlckxpYi5DYXN0X0ludDY0KChlMS5EZWx0YS5YKSAqIChlMi5EZWx0YS5ZKSk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2xvcGVzRXF1YWw0ID0gZnVuY3Rpb24gKHB0MSwgcHQyLCBwdDMsIFVzZUZ1bGxSYW5nZSlcbiAge1xuICAgIGlmIChVc2VGdWxsUmFuZ2UpXG4gICAgICByZXR1cm4gSW50MTI4Lm9wX0VxdWFsaXR5KEludDEyOC5JbnQxMjhNdWwocHQxLlkgLSBwdDIuWSwgcHQyLlggLSBwdDMuWCksIEludDEyOC5JbnQxMjhNdWwocHQxLlggLSBwdDIuWCwgcHQyLlkgLSBwdDMuWSkpO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBDbGlwcGVyTGliLkNhc3RfSW50NjQoKHB0MS5ZIC0gcHQyLlkpICogKHB0Mi5YIC0gcHQzLlgpKSAtIENsaXBwZXJMaWIuQ2FzdF9JbnQ2NCgocHQxLlggLSBwdDIuWCkgKiAocHQyLlkgLSBwdDMuWSkpID09PSAwO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNsb3Blc0VxdWFsNSA9IGZ1bmN0aW9uIChwdDEsIHB0MiwgcHQzLCBwdDQsIFVzZUZ1bGxSYW5nZSlcbiAge1xuICAgIGlmIChVc2VGdWxsUmFuZ2UpXG4gICAgICByZXR1cm4gSW50MTI4Lm9wX0VxdWFsaXR5KEludDEyOC5JbnQxMjhNdWwocHQxLlkgLSBwdDIuWSwgcHQzLlggLSBwdDQuWCksIEludDEyOC5JbnQxMjhNdWwocHQxLlggLSBwdDIuWCwgcHQzLlkgLSBwdDQuWSkpO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBDbGlwcGVyTGliLkNhc3RfSW50NjQoKHB0MS5ZIC0gcHQyLlkpICogKHB0My5YIC0gcHQ0LlgpKSAtIENsaXBwZXJMaWIuQ2FzdF9JbnQ2NCgocHQxLlggLSBwdDIuWCkgKiAocHQzLlkgLSBwdDQuWSkpID09PSAwO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5DbGVhciA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB0aGlzLkRpc3Bvc2VMb2NhbE1pbmltYUxpc3QoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgaWxlbiA9IHRoaXMubV9lZGdlcy5sZW5ndGg7IGkgPCBpbGVuOyArK2kpXG4gICAge1xuICAgICAgZm9yICh2YXIgaiA9IDAsIGpsZW4gPSB0aGlzLm1fZWRnZXNbaV0ubGVuZ3RoOyBqIDwgamxlbjsgKytqKVxuICAgICAgICB0aGlzLm1fZWRnZXNbaV1bal0gPSBudWxsO1xuICAgICAgQ2xpcHBlckxpYi5DbGVhcih0aGlzLm1fZWRnZXNbaV0pO1xuICAgIH1cbiAgICBDbGlwcGVyTGliLkNsZWFyKHRoaXMubV9lZGdlcyk7XG4gICAgdGhpcy5tX1VzZUZ1bGxSYW5nZSA9IGZhbHNlO1xuICAgIHRoaXMubV9IYXNPcGVuUGF0aHMgPSBmYWxzZTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuRGlzcG9zZUxvY2FsTWluaW1hTGlzdCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB3aGlsZSAodGhpcy5tX01pbmltYUxpc3QgIT09IG51bGwpXG4gICAge1xuICAgICAgdmFyIHRtcExtID0gdGhpcy5tX01pbmltYUxpc3QuTmV4dDtcbiAgICAgIHRoaXMubV9NaW5pbWFMaXN0ID0gbnVsbDtcbiAgICAgIHRoaXMubV9NaW5pbWFMaXN0ID0gdG1wTG07XG4gICAgfVxuICAgIHRoaXMubV9DdXJyZW50TE0gPSBudWxsO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5SYW5nZVRlc3QgPSBmdW5jdGlvbiAoUHQsIHVzZUZ1bGxSYW5nZSlcbiAge1xuICAgIGlmICh1c2VGdWxsUmFuZ2UuVmFsdWUpXG4gICAge1xuICAgICAgaWYgKFB0LlggPiBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhpUmFuZ2UgfHwgUHQuWSA+IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaGlSYW5nZSB8fCAtUHQuWCA+IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaGlSYW5nZSB8fCAtUHQuWSA+IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaGlSYW5nZSlcbiAgICAgICAgQ2xpcHBlckxpYi5FcnJvcihcIkNvb3JkaW5hdGUgb3V0c2lkZSBhbGxvd2VkIHJhbmdlIGluIFJhbmdlVGVzdCgpLlwiKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoUHQuWCA+IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UubG9SYW5nZSB8fCBQdC5ZID4gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5sb1JhbmdlIHx8IC1QdC5YID4gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5sb1JhbmdlIHx8IC1QdC5ZID4gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5sb1JhbmdlKVxuICAgIHtcbiAgICAgIHVzZUZ1bGxSYW5nZS5WYWx1ZSA9IHRydWU7XG4gICAgICB0aGlzLlJhbmdlVGVzdChQdCwgdXNlRnVsbFJhbmdlKTtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLkluaXRFZGdlID0gZnVuY3Rpb24gKGUsIGVOZXh0LCBlUHJldiwgcHQpXG4gIHtcbiAgICBlLk5leHQgPSBlTmV4dDtcbiAgICBlLlByZXYgPSBlUHJldjtcbiAgICAvL2UuQ3VyciA9IHB0O1xuICAgIGUuQ3Vyci5YID0gcHQuWDtcbiAgICBlLkN1cnIuWSA9IHB0Llk7XG4gICAgZS5PdXRJZHggPSAtMTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuSW5pdEVkZ2UyID0gZnVuY3Rpb24gKGUsIHBvbHlUeXBlKVxuICB7XG4gICAgaWYgKGUuQ3Vyci5ZID49IGUuTmV4dC5DdXJyLlkpXG4gICAge1xuICAgICAgLy9lLkJvdCA9IGUuQ3VycjtcbiAgICAgIGUuQm90LlggPSBlLkN1cnIuWDtcbiAgICAgIGUuQm90LlkgPSBlLkN1cnIuWTtcbiAgICAgIC8vZS5Ub3AgPSBlLk5leHQuQ3VycjtcbiAgICAgIGUuVG9wLlggPSBlLk5leHQuQ3Vyci5YO1xuICAgICAgZS5Ub3AuWSA9IGUuTmV4dC5DdXJyLlk7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAvL2UuVG9wID0gZS5DdXJyO1xuICAgICAgZS5Ub3AuWCA9IGUuQ3Vyci5YO1xuICAgICAgZS5Ub3AuWSA9IGUuQ3Vyci5ZO1xuICAgICAgLy9lLkJvdCA9IGUuTmV4dC5DdXJyO1xuICAgICAgZS5Cb3QuWCA9IGUuTmV4dC5DdXJyLlg7XG4gICAgICBlLkJvdC5ZID0gZS5OZXh0LkN1cnIuWTtcbiAgICB9XG4gICAgdGhpcy5TZXREeChlKTtcbiAgICBlLlBvbHlUeXAgPSBwb2x5VHlwZTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuRmluZE5leHRMb2NNaW4gPSBmdW5jdGlvbiAoRSlcbiAge1xuICAgIHZhciBFMjtcbiAgICBmb3IgKDs7KVxuICAgIHtcbiAgICAgIHdoaWxlIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0luZXF1YWxpdHkoRS5Cb3QsIEUuUHJldi5Cb3QpIHx8IENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkoRS5DdXJyLCBFLlRvcCkpXG4gICAgICAgIEUgPSBFLk5leHQ7XG4gICAgICBpZiAoRS5EeCAhPSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWwgJiYgRS5QcmV2LkR4ICE9IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbClcbiAgICAgICAgYnJlYWs7XG4gICAgICB3aGlsZSAoRS5QcmV2LkR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbClcbiAgICAgICAgRSA9IEUuUHJldjtcbiAgICAgIEUyID0gRTtcbiAgICAgIHdoaWxlIChFLkR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbClcbiAgICAgICAgRSA9IEUuTmV4dDtcbiAgICAgIGlmIChFLlRvcC5ZID09IEUuUHJldi5Cb3QuWSlcbiAgICAgICAgY29udGludWU7XG4gICAgICAvL2llIGp1c3QgYW4gaW50ZXJtZWRpYXRlIGhvcnouXG4gICAgICBpZiAoRTIuUHJldi5Cb3QuWCA8IEUuQm90LlgpXG4gICAgICAgIEUgPSBFMjtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gRTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuUHJvY2Vzc0JvdW5kID0gZnVuY3Rpb24gKEUsIExlZnRCb3VuZElzRm9yd2FyZClcbiAge1xuICAgIHZhciBFU3RhcnQ7XG4gICAgdmFyIFJlc3VsdCA9IEU7XG4gICAgdmFyIEhvcno7XG5cbiAgICAgIGlmIChSZXN1bHQuT3V0SWR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2tpcClcbiAgICAgIHtcbiAgICAgICAgLy9jaGVjayBpZiB0aGVyZSBhcmUgZWRnZXMgYmV5b25kIHRoZSBza2lwIGVkZ2UgaW4gdGhlIGJvdW5kIGFuZCBpZiBzb1xuICAgICAgICAvL2NyZWF0ZSBhbm90aGVyIExvY01pbiBhbmQgY2FsbGluZyBQcm9jZXNzQm91bmQgb25jZSBtb3JlIC4uLlxuICAgICAgICBFID0gUmVzdWx0O1xuICAgICAgICBpZiAoTGVmdEJvdW5kSXNGb3J3YXJkKVxuICAgICAgICB7XG4gICAgICAgICAgd2hpbGUgKEUuVG9wLlkgPT0gRS5OZXh0LkJvdC5ZKSBFID0gRS5OZXh0O1xuICAgICAgICAgIHdoaWxlIChFICE9IFJlc3VsdCAmJiBFLkR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbCkgRSA9IEUuUHJldjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICB3aGlsZSAoRS5Ub3AuWSA9PSBFLlByZXYuQm90LlkpIEUgPSBFLlByZXY7XG4gICAgICAgICAgd2hpbGUgKEUgIT0gUmVzdWx0ICYmIEUuRHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsKSBFID0gRS5OZXh0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChFID09IFJlc3VsdClcbiAgICAgICAge1xuICAgICAgICAgIGlmIChMZWZ0Qm91bmRJc0ZvcndhcmQpIFJlc3VsdCA9IEUuTmV4dDtcbiAgICAgICAgICBlbHNlIFJlc3VsdCA9IEUuUHJldjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAvL3RoZXJlIGFyZSBtb3JlIGVkZ2VzIGluIHRoZSBib3VuZCBiZXlvbmQgcmVzdWx0IHN0YXJ0aW5nIHdpdGggRVxuICAgICAgICAgIGlmIChMZWZ0Qm91bmRJc0ZvcndhcmQpXG4gICAgICAgICAgICBFID0gUmVzdWx0Lk5leHQ7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgRSA9IFJlc3VsdC5QcmV2O1xuICAgICAgICAgIHZhciBsb2NNaW4gPSBuZXcgQ2xpcHBlckxpYi5Mb2NhbE1pbmltYSgpO1xuICAgICAgICAgIGxvY01pbi5OZXh0ID0gbnVsbDtcbiAgICAgICAgICBsb2NNaW4uWSA9IEUuQm90Llk7XG4gICAgICAgICAgbG9jTWluLkxlZnRCb3VuZCA9IG51bGw7XG4gICAgICAgICAgbG9jTWluLlJpZ2h0Qm91bmQgPSBFO1xuICAgICAgICAgIEUuV2luZERlbHRhID0gMDtcbiAgICAgICAgICBSZXN1bHQgPSB0aGlzLlByb2Nlc3NCb3VuZChFLCBMZWZ0Qm91bmRJc0ZvcndhcmQpO1xuICAgICAgICAgIHRoaXMuSW5zZXJ0TG9jYWxNaW5pbWEobG9jTWluKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUmVzdWx0O1xuICAgICAgfVxuXG4gICAgICBpZiAoRS5EeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWwpXG4gICAgICB7XG4gICAgICAgIC8vV2UgbmVlZCB0byBiZSBjYXJlZnVsIHdpdGggb3BlbiBwYXRocyBiZWNhdXNlIHRoaXMgbWF5IG5vdCBiZSBhXG4gICAgICAgIC8vdHJ1ZSBsb2NhbCBtaW5pbWEgKGllIEUgbWF5IGJlIGZvbGxvd2luZyBhIHNraXAgZWRnZSkuXG4gICAgICAgIC8vQWxzbywgY29uc2VjdXRpdmUgaG9yei4gZWRnZXMgbWF5IHN0YXJ0IGhlYWRpbmcgbGVmdCBiZWZvcmUgZ29pbmcgcmlnaHQuXG4gICAgICAgIGlmIChMZWZ0Qm91bmRJc0ZvcndhcmQpIEVTdGFydCA9IEUuUHJldjtcbiAgICAgICAgZWxzZSBFU3RhcnQgPSBFLk5leHQ7XG4gICAgICAgIGlmIChFU3RhcnQuT3V0SWR4ICE9IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2tpcClcbiAgICAgICAge1xuICAgICAgICAgIGlmIChFU3RhcnQuRHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsKSAvL2llIGFuIGFkam9pbmluZyBob3Jpem9udGFsIHNraXAgZWRnZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGlmIChFU3RhcnQuQm90LlggIT0gRS5Cb3QuWCAmJiBFU3RhcnQuVG9wLlggIT0gRS5Cb3QuWClcbiAgICAgICAgICAgICAgdGhpcy5SZXZlcnNlSG9yaXpvbnRhbChFKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoRVN0YXJ0LkJvdC5YICE9IEUuQm90LlgpXG4gICAgICAgICAgICB0aGlzLlJldmVyc2VIb3Jpem9udGFsKEUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIEVTdGFydCA9IEU7XG4gICAgICBpZiAoTGVmdEJvdW5kSXNGb3J3YXJkKVxuICAgICAge1xuICAgICAgICB3aGlsZSAoUmVzdWx0LlRvcC5ZID09IFJlc3VsdC5OZXh0LkJvdC5ZICYmIFJlc3VsdC5OZXh0Lk91dElkeCAhPSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNraXApXG4gICAgICAgICAgUmVzdWx0ID0gUmVzdWx0Lk5leHQ7XG4gICAgICAgIGlmIChSZXN1bHQuRHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsICYmIFJlc3VsdC5OZXh0Lk91dElkeCAhPSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNraXApXG4gICAgICAgIHtcbiAgICAgICAgICAvL25iOiBhdCB0aGUgdG9wIG9mIGEgYm91bmQsIGhvcml6b250YWxzIGFyZSBhZGRlZCB0byB0aGUgYm91bmRcbiAgICAgICAgICAvL29ubHkgd2hlbiB0aGUgcHJlY2VkaW5nIGVkZ2UgYXR0YWNoZXMgdG8gdGhlIGhvcml6b250YWwncyBsZWZ0IHZlcnRleFxuICAgICAgICAgIC8vdW5sZXNzIGEgU2tpcCBlZGdlIGlzIGVuY291bnRlcmVkIHdoZW4gdGhhdCBiZWNvbWVzIHRoZSB0b3AgZGl2aWRlXG4gICAgICAgICAgSG9yeiA9IFJlc3VsdDtcbiAgICAgICAgICB3aGlsZSAoSG9yei5QcmV2LkR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbClcbiAgICAgICAgICAgIEhvcnogPSBIb3J6LlByZXY7XG4gICAgICAgICAgaWYgKEhvcnouUHJldi5Ub3AuWCA9PSBSZXN1bHQuTmV4dC5Ub3AuWClcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpZiAoIUxlZnRCb3VuZElzRm9yd2FyZClcbiAgICAgICAgICAgICAgUmVzdWx0ID0gSG9yei5QcmV2O1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChIb3J6LlByZXYuVG9wLlggPiBSZXN1bHQuTmV4dC5Ub3AuWClcbiAgICAgICAgICAgIFJlc3VsdCA9IEhvcnouUHJldjtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoRSAhPSBSZXN1bHQpXG4gICAgICAgIHtcbiAgICAgICAgICBFLk5leHRJbkxNTCA9IEUuTmV4dDtcbiAgICAgICAgICBpZiAoRS5EeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWwgJiYgRSAhPSBFU3RhcnQgJiYgRS5Cb3QuWCAhPSBFLlByZXYuVG9wLlgpXG4gICAgICAgICAgICB0aGlzLlJldmVyc2VIb3Jpem9udGFsKEUpO1xuICAgICAgICAgIEUgPSBFLk5leHQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKEUuRHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsICYmIEUgIT0gRVN0YXJ0ICYmIEUuQm90LlggIT0gRS5QcmV2LlRvcC5YKVxuICAgICAgICAgIHRoaXMuUmV2ZXJzZUhvcml6b250YWwoRSk7XG4gICAgICAgIFJlc3VsdCA9IFJlc3VsdC5OZXh0O1xuICAgICAgICAvL21vdmUgdG8gdGhlIGVkZ2UganVzdCBiZXlvbmQgY3VycmVudCBib3VuZFxuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICB3aGlsZSAoUmVzdWx0LlRvcC5ZID09IFJlc3VsdC5QcmV2LkJvdC5ZICYmIFJlc3VsdC5QcmV2Lk91dElkeCAhPSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNraXApXG4gICAgICAgICAgUmVzdWx0ID0gUmVzdWx0LlByZXY7XG4gICAgICAgIGlmIChSZXN1bHQuRHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsICYmIFJlc3VsdC5QcmV2Lk91dElkeCAhPSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNraXApXG4gICAgICAgIHtcbiAgICAgICAgICBIb3J6ID0gUmVzdWx0O1xuICAgICAgICAgIHdoaWxlIChIb3J6Lk5leHQuRHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5ob3Jpem9udGFsKVxuICAgICAgICAgICAgSG9yeiA9IEhvcnouTmV4dDtcbiAgICAgICAgICBpZiAoSG9yei5OZXh0LlRvcC5YID09IFJlc3VsdC5QcmV2LlRvcC5YKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGlmICghTGVmdEJvdW5kSXNGb3J3YXJkKVxuICAgICAgICAgICAgICBSZXN1bHQgPSBIb3J6Lk5leHQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKEhvcnouTmV4dC5Ub3AuWCA+IFJlc3VsdC5QcmV2LlRvcC5YKVxuICAgICAgICAgICAgUmVzdWx0ID0gSG9yei5OZXh0O1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChFICE9IFJlc3VsdClcbiAgICAgICAge1xuICAgICAgICAgIEUuTmV4dEluTE1MID0gRS5QcmV2O1xuICAgICAgICAgIGlmIChFLkR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbCAmJiBFICE9IEVTdGFydCAmJiBFLkJvdC5YICE9IEUuTmV4dC5Ub3AuWClcbiAgICAgICAgICAgIHRoaXMuUmV2ZXJzZUhvcml6b250YWwoRSk7XG4gICAgICAgICAgRSA9IEUuUHJldjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoRS5EeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmhvcml6b250YWwgJiYgRSAhPSBFU3RhcnQgJiYgRS5Cb3QuWCAhPSBFLk5leHQuVG9wLlgpXG4gICAgICAgICAgdGhpcy5SZXZlcnNlSG9yaXpvbnRhbChFKTtcbiAgICAgICAgUmVzdWx0ID0gUmVzdWx0LlByZXY7XG4gICAgICAgIC8vbW92ZSB0byB0aGUgZWRnZSBqdXN0IGJleW9uZCBjdXJyZW50IGJvdW5kXG4gICAgICB9XG5cbiAgICByZXR1cm4gUmVzdWx0O1xuICB9O1xuXG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLkFkZFBhdGggPSBmdW5jdGlvbiAocGcsIHBvbHlUeXBlLCBDbG9zZWQpXG4gIHtcbiAgICBpZiAodXNlX2xpbmVzKVxuICAgIHtcbiAgICAgIGlmICghQ2xvc2VkICYmIHBvbHlUeXBlID09IENsaXBwZXJMaWIuUG9seVR5cGUucHRDbGlwKVxuICAgICAgICBDbGlwcGVyTGliLkVycm9yKFwiQWRkUGF0aDogT3BlbiBwYXRocyBtdXN0IGJlIHN1YmplY3QuXCIpO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgaWYgKCFDbG9zZWQpXG4gICAgICAgIENsaXBwZXJMaWIuRXJyb3IoXCJBZGRQYXRoOiBPcGVuIHBhdGhzIGhhdmUgYmVlbiBkaXNhYmxlZC5cIik7XG4gICAgfVxuICAgIHZhciBoaWdoSSA9IHBnLmxlbmd0aCAtIDE7XG4gICAgaWYgKENsb3NlZClcbiAgICAgIHdoaWxlIChoaWdoSSA+IDAgJiYgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocGdbaGlnaEldLCBwZ1swXSkpKVxuICAgIC0taGlnaEk7XG4gICAgd2hpbGUgKGhpZ2hJID4gMCAmJiAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwZ1toaWdoSV0sIHBnW2hpZ2hJIC0gMV0pKSlcbiAgICAtLWhpZ2hJO1xuICAgIGlmICgoQ2xvc2VkICYmIGhpZ2hJIDwgMikgfHwgKCFDbG9zZWQgJiYgaGlnaEkgPCAxKSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICAvL2NyZWF0ZSBhIG5ldyBlZGdlIGFycmF5IC4uLlxuICAgIHZhciBlZGdlcyA9IG5ldyBBcnJheSgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IGhpZ2hJOyBpKyspXG4gICAgICBlZGdlcy5wdXNoKG5ldyBDbGlwcGVyTGliLlRFZGdlKCkpO1xuICAgIHZhciBJc0ZsYXQgPSB0cnVlO1xuICAgIC8vMS4gQmFzaWMgKGZpcnN0KSBlZGdlIGluaXRpYWxpemF0aW9uIC4uLlxuXG4gICAgLy9lZGdlc1sxXS5DdXJyID0gcGdbMV07XG4gICAgZWRnZXNbMV0uQ3Vyci5YID0gcGdbMV0uWDtcbiAgICBlZGdlc1sxXS5DdXJyLlkgPSBwZ1sxXS5ZO1xuXG4gICAgdmFyICQxID0ge1ZhbHVlOiB0aGlzLm1fVXNlRnVsbFJhbmdlfTtcbiAgICB0aGlzLlJhbmdlVGVzdChwZ1swXSwgJDEpO1xuICAgIHRoaXMubV9Vc2VGdWxsUmFuZ2UgPSAkMS5WYWx1ZTtcblxuICAgICQxLlZhbHVlID0gdGhpcy5tX1VzZUZ1bGxSYW5nZTtcbiAgICB0aGlzLlJhbmdlVGVzdChwZ1toaWdoSV0sICQxKTtcbiAgICB0aGlzLm1fVXNlRnVsbFJhbmdlID0gJDEuVmFsdWU7XG5cbiAgICB0aGlzLkluaXRFZGdlKGVkZ2VzWzBdLCBlZGdlc1sxXSwgZWRnZXNbaGlnaEldLCBwZ1swXSk7XG4gICAgdGhpcy5Jbml0RWRnZShlZGdlc1toaWdoSV0sIGVkZ2VzWzBdLCBlZGdlc1toaWdoSSAtIDFdLCBwZ1toaWdoSV0pO1xuICAgIGZvciAodmFyIGkgPSBoaWdoSSAtIDE7IGkgPj0gMTsgLS1pKVxuICAgIHtcbiAgICAgICQxLlZhbHVlID0gdGhpcy5tX1VzZUZ1bGxSYW5nZTtcbiAgICAgIHRoaXMuUmFuZ2VUZXN0KHBnW2ldLCAkMSk7XG4gICAgICB0aGlzLm1fVXNlRnVsbFJhbmdlID0gJDEuVmFsdWU7XG5cbiAgICAgIHRoaXMuSW5pdEVkZ2UoZWRnZXNbaV0sIGVkZ2VzW2kgKyAxXSwgZWRnZXNbaSAtIDFdLCBwZ1tpXSk7XG4gICAgfVxuXG4gICAgdmFyIGVTdGFydCA9IGVkZ2VzWzBdO1xuICAgIC8vMi4gUmVtb3ZlIGR1cGxpY2F0ZSB2ZXJ0aWNlcywgYW5kICh3aGVuIGNsb3NlZCkgY29sbGluZWFyIGVkZ2VzIC4uLlxuICAgIHZhciBFID0gZVN0YXJ0LFxuICAgICAgZUxvb3BTdG9wID0gZVN0YXJ0O1xuICAgIGZvciAoOzspXG4gICAge1xuICAgIC8vY29uc29sZS5sb2coRS5OZXh0LCBlU3RhcnQpO1xuICAgIFx0Ly9uYjogYWxsb3dzIG1hdGNoaW5nIHN0YXJ0IGFuZCBlbmQgcG9pbnRzIHdoZW4gbm90IENsb3NlZCAuLi5cbiAgICAgIGlmIChFLkN1cnIgPT0gRS5OZXh0LkN1cnIgJiYgKENsb3NlZCB8fCBFLk5leHQgIT0gZVN0YXJ0KSlcbiAgICAgIHtcbiAgICAgICAgaWYgKEUgPT0gRS5OZXh0KVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBpZiAoRSA9PSBlU3RhcnQpXG4gICAgICAgICAgZVN0YXJ0ID0gRS5OZXh0O1xuICAgICAgICBFID0gdGhpcy5SZW1vdmVFZGdlKEUpO1xuICAgICAgICBlTG9vcFN0b3AgPSBFO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChFLlByZXYgPT0gRS5OZXh0KVxuICAgICAgICBicmVhaztcbiAgICAgIGVsc2UgaWYgKENsb3NlZCAmJiBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNsb3Blc0VxdWFsKEUuUHJldi5DdXJyLCBFLkN1cnIsIEUuTmV4dC5DdXJyLCB0aGlzLm1fVXNlRnVsbFJhbmdlKSAmJiAoIXRoaXMuUHJlc2VydmVDb2xsaW5lYXIgfHwgIXRoaXMuUHQySXNCZXR3ZWVuUHQxQW5kUHQzKEUuUHJldi5DdXJyLCBFLkN1cnIsIEUuTmV4dC5DdXJyKSkpXG4gICAgICB7XG4gICAgICAgIC8vQ29sbGluZWFyIGVkZ2VzIGFyZSBhbGxvd2VkIGZvciBvcGVuIHBhdGhzIGJ1dCBpbiBjbG9zZWQgcGF0aHNcbiAgICAgICAgLy90aGUgZGVmYXVsdCBpcyB0byBtZXJnZSBhZGphY2VudCBjb2xsaW5lYXIgZWRnZXMgaW50byBhIHNpbmdsZSBlZGdlLlxuICAgICAgICAvL0hvd2V2ZXIsIGlmIHRoZSBQcmVzZXJ2ZUNvbGxpbmVhciBwcm9wZXJ0eSBpcyBlbmFibGVkLCBvbmx5IG92ZXJsYXBwaW5nXG4gICAgICAgIC8vY29sbGluZWFyIGVkZ2VzIChpZSBzcGlrZXMpIHdpbGwgYmUgcmVtb3ZlZCBmcm9tIGNsb3NlZCBwYXRocy5cbiAgICAgICAgaWYgKEUgPT0gZVN0YXJ0KVxuICAgICAgICAgIGVTdGFydCA9IEUuTmV4dDtcbiAgICAgICAgRSA9IHRoaXMuUmVtb3ZlRWRnZShFKTtcbiAgICAgICAgRSA9IEUuUHJldjtcbiAgICAgICAgZUxvb3BTdG9wID0gRTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBFID0gRS5OZXh0O1xuICAgICAgaWYgKChFID09IGVMb29wU3RvcCkgfHwgKCFDbG9zZWQgJiYgRS5OZXh0ID09IGVTdGFydCkpIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoKCFDbG9zZWQgJiYgKEUgPT0gRS5OZXh0KSkgfHwgKENsb3NlZCAmJiAoRS5QcmV2ID09IEUuTmV4dCkpKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghQ2xvc2VkKVxuICAgIHtcbiAgICAgIHRoaXMubV9IYXNPcGVuUGF0aHMgPSB0cnVlO1xuICAgICAgZVN0YXJ0LlByZXYuT3V0SWR4ID0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Ta2lwO1xuICAgIH1cbiAgICAvLzMuIERvIHNlY29uZCBzdGFnZSBvZiBlZGdlIGluaXRpYWxpemF0aW9uIC4uLlxuICAgIEUgPSBlU3RhcnQ7XG4gICAgZG8ge1xuICAgICAgdGhpcy5Jbml0RWRnZTIoRSwgcG9seVR5cGUpO1xuICAgICAgRSA9IEUuTmV4dDtcbiAgICAgIGlmIChJc0ZsYXQgJiYgRS5DdXJyLlkgIT0gZVN0YXJ0LkN1cnIuWSlcbiAgICAgICAgSXNGbGF0ID0gZmFsc2U7XG4gICAgfVxuICAgIHdoaWxlIChFICE9IGVTdGFydClcbiAgICAvLzQuIEZpbmFsbHksIGFkZCBlZGdlIGJvdW5kcyB0byBMb2NhbE1pbmltYSBsaXN0IC4uLlxuICAgIC8vVG90YWxseSBmbGF0IHBhdGhzIG11c3QgYmUgaGFuZGxlZCBkaWZmZXJlbnRseSB3aGVuIGFkZGluZyB0aGVtXG4gICAgLy90byBMb2NhbE1pbmltYSBsaXN0IHRvIGF2b2lkIGVuZGxlc3MgbG9vcHMgZXRjIC4uLlxuICAgIGlmIChJc0ZsYXQpXG4gICAge1xuICAgICAgaWYgKENsb3NlZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgRS5QcmV2Lk91dElkeCA9IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2tpcDtcbiAgICAgIGlmIChFLlByZXYuQm90LlggPCBFLlByZXYuVG9wLlgpXG4gICAgICAgIHRoaXMuUmV2ZXJzZUhvcml6b250YWwoRS5QcmV2KTtcbiAgICAgIHZhciBsb2NNaW4gPSBuZXcgQ2xpcHBlckxpYi5Mb2NhbE1pbmltYSgpO1xuICAgICAgbG9jTWluLk5leHQgPSBudWxsO1xuICAgICAgbG9jTWluLlkgPSBFLkJvdC5ZO1xuICAgICAgbG9jTWluLkxlZnRCb3VuZCA9IG51bGw7XG4gICAgICBsb2NNaW4uUmlnaHRCb3VuZCA9IEU7XG4gICAgICBsb2NNaW4uUmlnaHRCb3VuZC5TaWRlID0gQ2xpcHBlckxpYi5FZGdlU2lkZS5lc1JpZ2h0O1xuICAgICAgbG9jTWluLlJpZ2h0Qm91bmQuV2luZERlbHRhID0gMDtcbiAgICAgIHdoaWxlIChFLk5leHQuT3V0SWR4ICE9IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2tpcClcbiAgICAgIHtcbiAgICAgICAgRS5OZXh0SW5MTUwgPSBFLk5leHQ7XG4gICAgICAgIGlmIChFLkJvdC5YICE9IEUuUHJldi5Ub3AuWClcbiAgICAgICAgICB0aGlzLlJldmVyc2VIb3Jpem9udGFsKEUpO1xuICAgICAgICBFID0gRS5OZXh0O1xuICAgICAgfVxuICAgICAgdGhpcy5JbnNlcnRMb2NhbE1pbmltYShsb2NNaW4pO1xuICAgICAgdGhpcy5tX2VkZ2VzLnB1c2goZWRnZXMpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHRoaXMubV9lZGdlcy5wdXNoKGVkZ2VzKTtcbiAgICB2YXIgbGVmdEJvdW5kSXNGb3J3YXJkO1xuICAgIHZhciBFTWluID0gbnVsbDtcblxuXHRcdC8vd29ya2Fyb3VuZCB0byBhdm9pZCBhbiBlbmRsZXNzIGxvb3AgaW4gdGhlIHdoaWxlIGxvb3AgYmVsb3cgd2hlblxuICAgIC8vb3BlbiBwYXRocyBoYXZlIG1hdGNoaW5nIHN0YXJ0IGFuZCBlbmQgcG9pbnRzIC4uLlxuICAgIGlmKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkoRS5QcmV2LkJvdCwgRS5QcmV2LlRvcCkpXG4gICAgXHRFID0gRS5OZXh0O1xuXG4gICAgZm9yICg7OylcbiAgICB7XG4gICAgICBFID0gdGhpcy5GaW5kTmV4dExvY01pbihFKTtcbiAgICAgIGlmIChFID09IEVNaW4pXG4gICAgICAgIGJyZWFrO1xuICAgICAgZWxzZSBpZiAoRU1pbiA9PSBudWxsKVxuICAgICAgICBFTWluID0gRTtcbiAgICAgIC8vRSBhbmQgRS5QcmV2IG5vdyBzaGFyZSBhIGxvY2FsIG1pbmltYSAobGVmdCBhbGlnbmVkIGlmIGhvcml6b250YWwpLlxuICAgICAgLy9Db21wYXJlIHRoZWlyIHNsb3BlcyB0byBmaW5kIHdoaWNoIHN0YXJ0cyB3aGljaCBib3VuZCAuLi5cbiAgICAgIHZhciBsb2NNaW4gPSBuZXcgQ2xpcHBlckxpYi5Mb2NhbE1pbmltYSgpO1xuICAgICAgbG9jTWluLk5leHQgPSBudWxsO1xuICAgICAgbG9jTWluLlkgPSBFLkJvdC5ZO1xuICAgICAgaWYgKEUuRHggPCBFLlByZXYuRHgpXG4gICAgICB7XG4gICAgICAgIGxvY01pbi5MZWZ0Qm91bmQgPSBFLlByZXY7XG4gICAgICAgIGxvY01pbi5SaWdodEJvdW5kID0gRTtcbiAgICAgICAgbGVmdEJvdW5kSXNGb3J3YXJkID0gZmFsc2U7XG4gICAgICAgIC8vUS5uZXh0SW5MTUwgPSBRLnByZXZcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgbG9jTWluLkxlZnRCb3VuZCA9IEU7XG4gICAgICAgIGxvY01pbi5SaWdodEJvdW5kID0gRS5QcmV2O1xuICAgICAgICBsZWZ0Qm91bmRJc0ZvcndhcmQgPSB0cnVlO1xuICAgICAgICAvL1EubmV4dEluTE1MID0gUS5uZXh0XG4gICAgICB9XG4gICAgICBsb2NNaW4uTGVmdEJvdW5kLlNpZGUgPSBDbGlwcGVyTGliLkVkZ2VTaWRlLmVzTGVmdDtcbiAgICAgIGxvY01pbi5SaWdodEJvdW5kLlNpZGUgPSBDbGlwcGVyTGliLkVkZ2VTaWRlLmVzUmlnaHQ7XG4gICAgICBpZiAoIUNsb3NlZClcbiAgICAgICAgbG9jTWluLkxlZnRCb3VuZC5XaW5kRGVsdGEgPSAwO1xuICAgICAgZWxzZSBpZiAobG9jTWluLkxlZnRCb3VuZC5OZXh0ID09IGxvY01pbi5SaWdodEJvdW5kKVxuICAgICAgICBsb2NNaW4uTGVmdEJvdW5kLldpbmREZWx0YSA9IC0xO1xuICAgICAgZWxzZVxuICAgICAgICBsb2NNaW4uTGVmdEJvdW5kLldpbmREZWx0YSA9IDE7XG4gICAgICBsb2NNaW4uUmlnaHRCb3VuZC5XaW5kRGVsdGEgPSAtbG9jTWluLkxlZnRCb3VuZC5XaW5kRGVsdGE7XG4gICAgICBFID0gdGhpcy5Qcm9jZXNzQm91bmQobG9jTWluLkxlZnRCb3VuZCwgbGVmdEJvdW5kSXNGb3J3YXJkKTtcbiAgICAgIGlmIChFLk91dElkeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNraXApXG4gICAgICBcdEUgPSB0aGlzLlByb2Nlc3NCb3VuZChFLCBsZWZ0Qm91bmRJc0ZvcndhcmQpO1xuICAgICAgdmFyIEUyID0gdGhpcy5Qcm9jZXNzQm91bmQobG9jTWluLlJpZ2h0Qm91bmQsICFsZWZ0Qm91bmRJc0ZvcndhcmQpO1xuICAgICAgaWYgKEUyLk91dElkeCA9PSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNraXApIEUyID0gdGhpcy5Qcm9jZXNzQm91bmQoRTIsICFsZWZ0Qm91bmRJc0ZvcndhcmQpO1xuICAgICAgaWYgKGxvY01pbi5MZWZ0Qm91bmQuT3V0SWR4ID09IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2tpcClcbiAgICAgICAgbG9jTWluLkxlZnRCb3VuZCA9IG51bGw7XG4gICAgICBlbHNlIGlmIChsb2NNaW4uUmlnaHRCb3VuZC5PdXRJZHggPT0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Ta2lwKVxuICAgICAgICBsb2NNaW4uUmlnaHRCb3VuZCA9IG51bGw7XG4gICAgICB0aGlzLkluc2VydExvY2FsTWluaW1hKGxvY01pbik7XG4gICAgICBpZiAoIWxlZnRCb3VuZElzRm9yd2FyZClcbiAgICAgICAgRSA9IEUyO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuQWRkUGF0aHMgPSBmdW5jdGlvbiAocHBnLCBwb2x5VHlwZSwgY2xvc2VkKVxuICB7XG4gICAgLy8gIGNvbnNvbGUubG9nKFwiLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVwiKTtcbiAgICAvLyAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocHBnKSk7XG4gICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xuICAgIGZvciAodmFyIGkgPSAwLCBpbGVuID0gcHBnLmxlbmd0aDsgaSA8IGlsZW47ICsraSlcbiAgICAgIGlmICh0aGlzLkFkZFBhdGgocHBnW2ldLCBwb2x5VHlwZSwgY2xvc2VkKSlcbiAgICAgICAgcmVzdWx0ID0gdHJ1ZTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5QdDJJc0JldHdlZW5QdDFBbmRQdDMgPSBmdW5jdGlvbiAocHQxLCBwdDIsIHB0MylcbiAge1xuICAgIGlmICgoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwdDEsIHB0MykpIHx8IChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHB0MSwgcHQyKSkgfHwgICAgICAgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocHQzLCBwdDIpKSlcblxuICAgLy9pZiAoKHB0MSA9PSBwdDMpIHx8IChwdDEgPT0gcHQyKSB8fCAocHQzID09IHB0MikpXG4gICByZXR1cm4gZmFsc2U7XG5cbiAgICBlbHNlIGlmIChwdDEuWCAhPSBwdDMuWClcbiAgICAgIHJldHVybiAocHQyLlggPiBwdDEuWCkgPT0gKHB0Mi5YIDwgcHQzLlgpO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiAocHQyLlkgPiBwdDEuWSkgPT0gKHB0Mi5ZIDwgcHQzLlkpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5SZW1vdmVFZGdlID0gZnVuY3Rpb24gKGUpXG4gIHtcbiAgICAvL3JlbW92ZXMgZSBmcm9tIGRvdWJsZV9saW5rZWRfbGlzdCAoYnV0IHdpdGhvdXQgcmVtb3ZpbmcgZnJvbSBtZW1vcnkpXG4gICAgZS5QcmV2Lk5leHQgPSBlLk5leHQ7XG4gICAgZS5OZXh0LlByZXYgPSBlLlByZXY7XG4gICAgdmFyIHJlc3VsdCA9IGUuTmV4dDtcbiAgICBlLlByZXYgPSBudWxsOyAvL2ZsYWcgYXMgcmVtb3ZlZCAoc2VlIENsaXBwZXJCYXNlLkNsZWFyKVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLlNldER4ID0gZnVuY3Rpb24gKGUpXG4gIHtcbiAgICBlLkRlbHRhLlggPSAoZS5Ub3AuWCAtIGUuQm90LlgpO1xuICAgIGUuRGVsdGEuWSA9IChlLlRvcC5ZIC0gZS5Cb3QuWSk7XG4gICAgaWYgKGUuRGVsdGEuWSA9PT0gMCkgZS5EeCA9IENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbDtcbiAgICBlbHNlIGUuRHggPSAoZS5EZWx0YS5YKSAvIChlLkRlbHRhLlkpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5JbnNlcnRMb2NhbE1pbmltYSA9IGZ1bmN0aW9uIChuZXdMbSlcbiAge1xuICAgIGlmICh0aGlzLm1fTWluaW1hTGlzdCA9PT0gbnVsbClcbiAgICB7XG4gICAgICB0aGlzLm1fTWluaW1hTGlzdCA9IG5ld0xtO1xuICAgIH1cbiAgICBlbHNlIGlmIChuZXdMbS5ZID49IHRoaXMubV9NaW5pbWFMaXN0LlkpXG4gICAge1xuICAgICAgbmV3TG0uTmV4dCA9IHRoaXMubV9NaW5pbWFMaXN0O1xuICAgICAgdGhpcy5tX01pbmltYUxpc3QgPSBuZXdMbTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIHZhciB0bXBMbSA9IHRoaXMubV9NaW5pbWFMaXN0O1xuICAgICAgd2hpbGUgKHRtcExtLk5leHQgIT09IG51bGwgJiYgKG5ld0xtLlkgPCB0bXBMbS5OZXh0LlkpKVxuICAgICAgICB0bXBMbSA9IHRtcExtLk5leHQ7XG4gICAgICBuZXdMbS5OZXh0ID0gdG1wTG0uTmV4dDtcbiAgICAgIHRtcExtLk5leHQgPSBuZXdMbTtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLlBvcExvY2FsTWluaW1hID0gZnVuY3Rpb24gKClcbiAge1xuICAgIGlmICh0aGlzLm1fQ3VycmVudExNID09PSBudWxsKVxuICAgICAgcmV0dXJuO1xuICAgIHRoaXMubV9DdXJyZW50TE0gPSB0aGlzLm1fQ3VycmVudExNLk5leHQ7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLlJldmVyc2VIb3Jpem9udGFsID0gZnVuY3Rpb24gKGUpXG4gIHtcbiAgICAvL3N3YXAgaG9yaXpvbnRhbCBlZGdlcycgdG9wIGFuZCBib3R0b20geCdzIHNvIHRoZXkgZm9sbG93IHRoZSBuYXR1cmFsXG4gICAgLy9wcm9ncmVzc2lvbiBvZiB0aGUgYm91bmRzIC0gaWUgc28gdGhlaXIgeGJvdHMgd2lsbCBhbGlnbiB3aXRoIHRoZVxuICAgIC8vYWRqb2luaW5nIGxvd2VyIGVkZ2UuIFtIZWxwZnVsIGluIHRoZSBQcm9jZXNzSG9yaXpvbnRhbCgpIG1ldGhvZC5dXG4gICAgdmFyIHRtcCA9IGUuVG9wLlg7XG4gICAgZS5Ub3AuWCA9IGUuQm90Llg7XG4gICAgZS5Cb3QuWCA9IHRtcDtcbiAgICBpZiAodXNlX3h5eilcbiAgICB7XG4gICAgICB0bXAgPSBlLlRvcC5aO1xuICAgICAgZS5Ub3AuWiA9IGUuQm90Llo7XG4gICAgICBlLkJvdC5aID0gdG1wO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5wcm90b3R5cGUuUmVzZXQgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdGhpcy5tX0N1cnJlbnRMTSA9IHRoaXMubV9NaW5pbWFMaXN0O1xuICAgIGlmICh0aGlzLm1fQ3VycmVudExNID09IG51bGwpXG4gICAgICByZXR1cm47XG4gICAgLy9pZSBub3RoaW5nIHRvIHByb2Nlc3NcbiAgICAvL3Jlc2V0IGFsbCBlZGdlcyAuLi5cbiAgICB2YXIgbG0gPSB0aGlzLm1fTWluaW1hTGlzdDtcbiAgICB3aGlsZSAobG0gIT0gbnVsbClcbiAgICB7XG4gICAgICB2YXIgZSA9IGxtLkxlZnRCb3VuZDtcbiAgICAgIGlmIChlICE9IG51bGwpXG4gICAgICB7XG4gICAgICAgIC8vZS5DdXJyID0gZS5Cb3Q7XG4gICAgICAgIGUuQ3Vyci5YID0gZS5Cb3QuWDtcbiAgICAgICAgZS5DdXJyLlkgPSBlLkJvdC5ZO1xuICAgICAgICBlLlNpZGUgPSBDbGlwcGVyTGliLkVkZ2VTaWRlLmVzTGVmdDtcbiAgICAgICAgZS5PdXRJZHggPSBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlVuYXNzaWduZWQ7XG4gICAgICB9XG4gICAgICBlID0gbG0uUmlnaHRCb3VuZDtcbiAgICAgIGlmIChlICE9IG51bGwpXG4gICAgICB7XG4gICAgICAgIC8vZS5DdXJyID0gZS5Cb3Q7XG4gICAgICAgIGUuQ3Vyci5YID0gZS5Cb3QuWDtcbiAgICAgICAgZS5DdXJyLlkgPSBlLkJvdC5ZO1xuICAgICAgICBlLlNpZGUgPSBDbGlwcGVyTGliLkVkZ2VTaWRlLmVzUmlnaHQ7XG4gICAgICAgIGUuT3V0SWR4ID0gQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5VbmFzc2lnbmVkO1xuICAgICAgfVxuICAgICAgbG0gPSBsbS5OZXh0O1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyID0gZnVuY3Rpb24gKEluaXRPcHRpb25zKSAvLyBwdWJsaWMgQ2xpcHBlcihpbnQgSW5pdE9wdGlvbnMgPSAwKVxuICB7XG4gICAgaWYgKHR5cGVvZiAoSW5pdE9wdGlvbnMpID09IFwidW5kZWZpbmVkXCIpIEluaXRPcHRpb25zID0gMDtcbiAgICB0aGlzLm1fUG9seU91dHMgPSBudWxsO1xuICAgIHRoaXMubV9DbGlwVHlwZSA9IENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RJbnRlcnNlY3Rpb247XG4gICAgdGhpcy5tX1NjYW5iZWFtID0gbnVsbDtcbiAgICB0aGlzLm1fQWN0aXZlRWRnZXMgPSBudWxsO1xuICAgIHRoaXMubV9Tb3J0ZWRFZGdlcyA9IG51bGw7XG4gICAgdGhpcy5tX0ludGVyc2VjdExpc3QgPSBudWxsO1xuICAgIHRoaXMubV9JbnRlcnNlY3ROb2RlQ29tcGFyZXIgPSBudWxsO1xuICAgIHRoaXMubV9FeGVjdXRlTG9ja2VkID0gZmFsc2U7XG4gICAgdGhpcy5tX0NsaXBGaWxsVHlwZSA9IENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdEV2ZW5PZGQ7XG4gICAgdGhpcy5tX1N1YmpGaWxsVHlwZSA9IENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdEV2ZW5PZGQ7XG4gICAgdGhpcy5tX0pvaW5zID0gbnVsbDtcbiAgICB0aGlzLm1fR2hvc3RKb2lucyA9IG51bGw7XG4gICAgdGhpcy5tX1VzaW5nUG9seVRyZWUgPSBmYWxzZTtcbiAgICB0aGlzLlJldmVyc2VTb2x1dGlvbiA9IGZhbHNlO1xuICAgIHRoaXMuU3RyaWN0bHlTaW1wbGUgPSBmYWxzZTtcbiAgICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLmNhbGwodGhpcyk7XG4gICAgdGhpcy5tX1NjYW5iZWFtID0gbnVsbDtcbiAgICB0aGlzLm1fQWN0aXZlRWRnZXMgPSBudWxsO1xuICAgIHRoaXMubV9Tb3J0ZWRFZGdlcyA9IG51bGw7XG4gICAgdGhpcy5tX0ludGVyc2VjdExpc3QgPSBuZXcgQXJyYXkoKTtcbiAgICB0aGlzLm1fSW50ZXJzZWN0Tm9kZUNvbXBhcmVyID0gQ2xpcHBlckxpYi5NeUludGVyc2VjdE5vZGVTb3J0LkNvbXBhcmU7XG4gICAgdGhpcy5tX0V4ZWN1dGVMb2NrZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1fVXNpbmdQb2x5VHJlZSA9IGZhbHNlO1xuICAgIHRoaXMubV9Qb2x5T3V0cyA9IG5ldyBBcnJheSgpO1xuICAgIHRoaXMubV9Kb2lucyA9IG5ldyBBcnJheSgpO1xuICAgIHRoaXMubV9HaG9zdEpvaW5zID0gbmV3IEFycmF5KCk7XG4gICAgdGhpcy5SZXZlcnNlU29sdXRpb24gPSAoMSAmIEluaXRPcHRpb25zKSAhPT0gMDtcbiAgICB0aGlzLlN0cmljdGx5U2ltcGxlID0gKDIgJiBJbml0T3B0aW9ucykgIT09IDA7XG4gICAgdGhpcy5QcmVzZXJ2ZUNvbGxpbmVhciA9ICg0ICYgSW5pdE9wdGlvbnMpICE9PSAwO1xuICAgIGlmICh1c2VfeHl6KVxuICAgIHtcbiAgICAgIHRoaXMuWkZpbGxGdW5jdGlvbiA9IG51bGw7IC8vIGZ1bmN0aW9uIChJbnRQb2ludCB2ZXJ0MSwgSW50UG9pbnQgdmVydDIsIHJlZiBJbnRQb2ludCBpbnRlcnNlY3RQdCk7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuaW9SZXZlcnNlU29sdXRpb24gPSAxO1xuICBDbGlwcGVyTGliLkNsaXBwZXIuaW9TdHJpY3RseVNpbXBsZSA9IDI7XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5pb1ByZXNlcnZlQ29sbGluZWFyID0gNDtcblxuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkNsZWFyID0gZnVuY3Rpb24gKClcbiAge1xuICAgIGlmICh0aGlzLm1fZWRnZXMubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuO1xuICAgIC8vYXZvaWRzIHByb2JsZW1zIHdpdGggQ2xpcHBlckJhc2UgZGVzdHJ1Y3RvclxuICAgIHRoaXMuRGlzcG9zZUFsbFBvbHlQdHMoKTtcbiAgICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLnByb3RvdHlwZS5DbGVhci5jYWxsKHRoaXMpO1xuICB9O1xuXG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRGlzcG9zZVNjYW5iZWFtTGlzdCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB3aGlsZSAodGhpcy5tX1NjYW5iZWFtICE9PSBudWxsKVxuICAgIHtcbiAgICAgIHZhciBzYjIgPSB0aGlzLm1fU2NhbmJlYW0uTmV4dDtcbiAgICAgIHRoaXMubV9TY2FuYmVhbSA9IG51bGw7XG4gICAgICB0aGlzLm1fU2NhbmJlYW0gPSBzYjI7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlJlc2V0ID0gZnVuY3Rpb24gKClcbiAge1xuICAgIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UucHJvdG90eXBlLlJlc2V0LmNhbGwodGhpcyk7XG4gICAgdGhpcy5tX1NjYW5iZWFtID0gbnVsbDtcbiAgICB0aGlzLm1fQWN0aXZlRWRnZXMgPSBudWxsO1xuICAgIHRoaXMubV9Tb3J0ZWRFZGdlcyA9IG51bGw7XG5cbiAgICB2YXIgbG0gPSB0aGlzLm1fTWluaW1hTGlzdDtcbiAgICB3aGlsZSAobG0gIT09IG51bGwpXG4gICAge1xuICAgICAgdGhpcy5JbnNlcnRTY2FuYmVhbShsbS5ZKTtcbiAgICAgIGxtID0gbG0uTmV4dDtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuSW5zZXJ0U2NhbmJlYW0gPSBmdW5jdGlvbiAoWSlcbiAge1xuICAgIGlmICh0aGlzLm1fU2NhbmJlYW0gPT09IG51bGwpXG4gICAge1xuICAgICAgdGhpcy5tX1NjYW5iZWFtID0gbmV3IENsaXBwZXJMaWIuU2NhbmJlYW0oKTtcbiAgICAgIHRoaXMubV9TY2FuYmVhbS5OZXh0ID0gbnVsbDtcbiAgICAgIHRoaXMubV9TY2FuYmVhbS5ZID0gWTtcbiAgICB9XG4gICAgZWxzZSBpZiAoWSA+IHRoaXMubV9TY2FuYmVhbS5ZKVxuICAgIHtcbiAgICAgIHZhciBuZXdTYiA9IG5ldyBDbGlwcGVyTGliLlNjYW5iZWFtKCk7XG4gICAgICBuZXdTYi5ZID0gWTtcbiAgICAgIG5ld1NiLk5leHQgPSB0aGlzLm1fU2NhbmJlYW07XG4gICAgICB0aGlzLm1fU2NhbmJlYW0gPSBuZXdTYjtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIHZhciBzYjIgPSB0aGlzLm1fU2NhbmJlYW07XG4gICAgICB3aGlsZSAoc2IyLk5leHQgIT09IG51bGwgJiYgKFkgPD0gc2IyLk5leHQuWSkpXG4gICAgICAgIHNiMiA9IHNiMi5OZXh0O1xuICAgICAgaWYgKFkgPT0gc2IyLlkpXG4gICAgICAgIHJldHVybjtcbiAgICAgIC8vaWUgaWdub3JlcyBkdXBsaWNhdGVzXG4gICAgICB2YXIgbmV3U2IgPSBuZXcgQ2xpcHBlckxpYi5TY2FuYmVhbSgpO1xuICAgICAgbmV3U2IuWSA9IFk7XG4gICAgICBuZXdTYi5OZXh0ID0gc2IyLk5leHQ7XG4gICAgICBzYjIuTmV4dCA9IG5ld1NiO1xuICAgIH1cbiAgfTtcbiAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRXhlY3V0ZSA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB2YXIgYSA9IGFyZ3VtZW50cyxcbiAgICAgIGFsZW4gPSBhLmxlbmd0aCxcbiAgICAgIGlzcG9seXRyZWUgPSBhWzFdIGluc3RhbmNlb2YgQ2xpcHBlckxpYi5Qb2x5VHJlZTtcbiAgICBpZiAoYWxlbiA9PSA0ICYmICFpc3BvbHl0cmVlKSAvLyBmdW5jdGlvbiAoY2xpcFR5cGUsIHNvbHV0aW9uLCBzdWJqRmlsbFR5cGUsIGNsaXBGaWxsVHlwZSlcbiAgICB7XG4gICAgICB2YXIgY2xpcFR5cGUgPSBhWzBdLFxuICAgICAgICBzb2x1dGlvbiA9IGFbMV0sXG4gICAgICAgIHN1YmpGaWxsVHlwZSA9IGFbMl0sXG4gICAgICAgIGNsaXBGaWxsVHlwZSA9IGFbM107XG4gICAgICBpZiAodGhpcy5tX0V4ZWN1dGVMb2NrZWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIGlmICh0aGlzLm1fSGFzT3BlblBhdGhzKVxuICAgICAgICBDbGlwcGVyTGliLkVycm9yKFwiRXJyb3I6IFBvbHlUcmVlIHN0cnVjdCBpcyBuZWVkIGZvciBvcGVuIHBhdGggY2xpcHBpbmcuXCIpO1xuICAgICAgdGhpcy5tX0V4ZWN1dGVMb2NrZWQgPSB0cnVlO1xuICAgICAgQ2xpcHBlckxpYi5DbGVhcihzb2x1dGlvbik7XG4gICAgICB0aGlzLm1fU3ViakZpbGxUeXBlID0gc3ViakZpbGxUeXBlO1xuICAgICAgdGhpcy5tX0NsaXBGaWxsVHlwZSA9IGNsaXBGaWxsVHlwZTtcbiAgICAgIHRoaXMubV9DbGlwVHlwZSA9IGNsaXBUeXBlO1xuICAgICAgdGhpcy5tX1VzaW5nUG9seVRyZWUgPSBmYWxzZTtcbiAgICAgIHRyeVxuICAgICAge1xuICAgICAgICB2YXIgc3VjY2VlZGVkID0gdGhpcy5FeGVjdXRlSW50ZXJuYWwoKTtcbiAgICAgICAgLy9idWlsZCB0aGUgcmV0dXJuIHBvbHlnb25zIC4uLlxuICAgICAgICBpZiAoc3VjY2VlZGVkKSB0aGlzLkJ1aWxkUmVzdWx0KHNvbHV0aW9uKTtcbiAgICAgIH1cbiAgICAgIGZpbmFsbHlcbiAgICAgIHtcbiAgICAgICAgdGhpcy5EaXNwb3NlQWxsUG9seVB0cygpO1xuICAgICAgICB0aGlzLm1fRXhlY3V0ZUxvY2tlZCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN1Y2NlZWRlZDtcbiAgICB9XG4gICAgZWxzZSBpZiAoYWxlbiA9PSA0ICYmIGlzcG9seXRyZWUpIC8vIGZ1bmN0aW9uIChjbGlwVHlwZSwgcG9seXRyZWUsIHN1YmpGaWxsVHlwZSwgY2xpcEZpbGxUeXBlKVxuICAgIHtcbiAgICAgIHZhciBjbGlwVHlwZSA9IGFbMF0sXG4gICAgICAgIHBvbHl0cmVlID0gYVsxXSxcbiAgICAgICAgc3ViakZpbGxUeXBlID0gYVsyXSxcbiAgICAgICAgY2xpcEZpbGxUeXBlID0gYVszXTtcbiAgICAgIGlmICh0aGlzLm1fRXhlY3V0ZUxvY2tlZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgdGhpcy5tX0V4ZWN1dGVMb2NrZWQgPSB0cnVlO1xuICAgICAgdGhpcy5tX1N1YmpGaWxsVHlwZSA9IHN1YmpGaWxsVHlwZTtcbiAgICAgIHRoaXMubV9DbGlwRmlsbFR5cGUgPSBjbGlwRmlsbFR5cGU7XG4gICAgICB0aGlzLm1fQ2xpcFR5cGUgPSBjbGlwVHlwZTtcbiAgICAgIHRoaXMubV9Vc2luZ1BvbHlUcmVlID0gdHJ1ZTtcbiAgICAgIHRyeVxuICAgICAge1xuICAgICAgICB2YXIgc3VjY2VlZGVkID0gdGhpcy5FeGVjdXRlSW50ZXJuYWwoKTtcbiAgICAgICAgLy9idWlsZCB0aGUgcmV0dXJuIHBvbHlnb25zIC4uLlxuICAgICAgICBpZiAoc3VjY2VlZGVkKSB0aGlzLkJ1aWxkUmVzdWx0Mihwb2x5dHJlZSk7XG4gICAgICB9XG4gICAgICBmaW5hbGx5XG4gICAgICB7XG4gICAgICAgIHRoaXMuRGlzcG9zZUFsbFBvbHlQdHMoKTtcbiAgICAgICAgdGhpcy5tX0V4ZWN1dGVMb2NrZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzdWNjZWVkZWQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKGFsZW4gPT0gMiAmJiAhaXNwb2x5dHJlZSkgLy8gZnVuY3Rpb24gKGNsaXBUeXBlLCBzb2x1dGlvbilcbiAgICB7XG4gICAgICB2YXIgY2xpcFR5cGUgPSBhWzBdLFxuICAgICAgICBzb2x1dGlvbiA9IGFbMV07XG4gICAgICByZXR1cm4gdGhpcy5FeGVjdXRlKGNsaXBUeXBlLCBzb2x1dGlvbiwgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0RXZlbk9kZCwgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0RXZlbk9kZCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGFsZW4gPT0gMiAmJiBpc3BvbHl0cmVlKSAvLyBmdW5jdGlvbiAoY2xpcFR5cGUsIHBvbHl0cmVlKVxuICAgIHtcbiAgICAgIHZhciBjbGlwVHlwZSA9IGFbMF0sXG4gICAgICAgIHBvbHl0cmVlID0gYVsxXTtcbiAgICAgIHJldHVybiB0aGlzLkV4ZWN1dGUoY2xpcFR5cGUsIHBvbHl0cmVlLCBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRFdmVuT2RkLCBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRFdmVuT2RkKTtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRml4SG9sZUxpbmthZ2UgPSBmdW5jdGlvbiAob3V0UmVjKVxuICB7XG4gICAgLy9za2lwIGlmIGFuIG91dGVybW9zdCBwb2x5Z29uIG9yXG4gICAgLy9hbHJlYWR5IGFscmVhZHkgcG9pbnRzIHRvIHRoZSBjb3JyZWN0IEZpcnN0TGVmdCAuLi5cbiAgICBpZiAob3V0UmVjLkZpcnN0TGVmdCA9PT0gbnVsbCB8fCAob3V0UmVjLklzSG9sZSAhPSBvdXRSZWMuRmlyc3RMZWZ0LklzSG9sZSAmJiBvdXRSZWMuRmlyc3RMZWZ0LlB0cyAhPT0gbnVsbCkpXG4gICAgICByZXR1cm47XG4gICAgdmFyIG9yZmwgPSBvdXRSZWMuRmlyc3RMZWZ0O1xuICAgIHdoaWxlIChvcmZsICE9PSBudWxsICYmICgob3JmbC5Jc0hvbGUgPT0gb3V0UmVjLklzSG9sZSkgfHwgb3JmbC5QdHMgPT09IG51bGwpKVxuICAgICAgb3JmbCA9IG9yZmwuRmlyc3RMZWZ0O1xuICAgIG91dFJlYy5GaXJzdExlZnQgPSBvcmZsO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkV4ZWN1dGVJbnRlcm5hbCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB0cnlcbiAgICB7XG4gICAgICB0aGlzLlJlc2V0KCk7XG4gICAgICBpZiAodGhpcy5tX0N1cnJlbnRMTSA9PT0gbnVsbClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgdmFyIGJvdFkgPSB0aGlzLlBvcFNjYW5iZWFtKCk7XG4gICAgICBkbyB7XG4gICAgICAgIHRoaXMuSW5zZXJ0TG9jYWxNaW5pbWFJbnRvQUVMKGJvdFkpO1xuICAgICAgICBDbGlwcGVyTGliLkNsZWFyKHRoaXMubV9HaG9zdEpvaW5zKTtcbiAgICAgICAgdGhpcy5Qcm9jZXNzSG9yaXpvbnRhbHMoZmFsc2UpO1xuICAgICAgICBpZiAodGhpcy5tX1NjYW5iZWFtID09PSBudWxsKVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB2YXIgdG9wWSA9IHRoaXMuUG9wU2NhbmJlYW0oKTtcbiAgICAgICAgaWYgKCF0aGlzLlByb2Nlc3NJbnRlcnNlY3Rpb25zKHRvcFkpKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5Qcm9jZXNzRWRnZXNBdFRvcE9mU2NhbmJlYW0odG9wWSk7XG4gICAgICAgIGJvdFkgPSB0b3BZO1xuICAgICAgfVxuICAgICAgd2hpbGUgKHRoaXMubV9TY2FuYmVhbSAhPT0gbnVsbCB8fCB0aGlzLm1fQ3VycmVudExNICE9PSBudWxsKVxuICAgICAgLy9maXggb3JpZW50YXRpb25zIC4uLlxuICAgICAgZm9yICh2YXIgaSA9IDAsIGlsZW4gPSB0aGlzLm1fUG9seU91dHMubGVuZ3RoOyBpIDwgaWxlbjsgaSsrKVxuICAgICAge1xuICAgICAgICB2YXIgb3V0UmVjID0gdGhpcy5tX1BvbHlPdXRzW2ldO1xuICAgICAgICBpZiAob3V0UmVjLlB0cyA9PT0gbnVsbCB8fCBvdXRSZWMuSXNPcGVuKVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBpZiAoKG91dFJlYy5Jc0hvbGUgXiB0aGlzLlJldmVyc2VTb2x1dGlvbikgPT0gKHRoaXMuQXJlYShvdXRSZWMpID4gMCkpXG4gICAgICAgICAgdGhpcy5SZXZlcnNlUG9seVB0TGlua3Mob3V0UmVjLlB0cyk7XG4gICAgICB9XG4gICAgICB0aGlzLkpvaW5Db21tb25FZGdlcygpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGlsZW4gPSB0aGlzLm1fUG9seU91dHMubGVuZ3RoOyBpIDwgaWxlbjsgaSsrKVxuICAgICAge1xuICAgICAgICB2YXIgb3V0UmVjID0gdGhpcy5tX1BvbHlPdXRzW2ldO1xuICAgICAgICBpZiAob3V0UmVjLlB0cyAhPT0gbnVsbCAmJiAhb3V0UmVjLklzT3BlbilcbiAgICAgICAgICB0aGlzLkZpeHVwT3V0UG9seWdvbihvdXRSZWMpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuU3RyaWN0bHlTaW1wbGUpXG4gICAgICAgIHRoaXMuRG9TaW1wbGVQb2x5Z29ucygpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGZpbmFsbHlcbiAgICB7XG4gICAgICBDbGlwcGVyTGliLkNsZWFyKHRoaXMubV9Kb2lucyk7XG4gICAgICBDbGlwcGVyTGliLkNsZWFyKHRoaXMubV9HaG9zdEpvaW5zKTtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuUG9wU2NhbmJlYW0gPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdmFyIFkgPSB0aGlzLm1fU2NhbmJlYW0uWTtcbiAgICB0aGlzLm1fU2NhbmJlYW0gPSB0aGlzLm1fU2NhbmJlYW0uTmV4dDtcbiAgICByZXR1cm4gWTtcbiAgfTtcblxuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkRpc3Bvc2VBbGxQb2x5UHRzID0gZnVuY3Rpb24gKClcbiAge1xuICAgIGZvciAodmFyIGkgPSAwLCBpbGVuID0gdGhpcy5tX1BvbHlPdXRzLmxlbmd0aDsgaSA8IGlsZW47ICsraSlcbiAgICAgIHRoaXMuRGlzcG9zZU91dFJlYyhpKTtcbiAgICBDbGlwcGVyTGliLkNsZWFyKHRoaXMubV9Qb2x5T3V0cyk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRGlzcG9zZU91dFJlYyA9IGZ1bmN0aW9uIChpbmRleClcbiAge1xuICAgIHZhciBvdXRSZWMgPSB0aGlzLm1fUG9seU91dHNbaW5kZXhdO1xuICAgIG91dFJlYy5QdHMgPSBudWxsO1xuICAgIG91dFJlYyA9IG51bGw7XG4gICAgdGhpcy5tX1BvbHlPdXRzW2luZGV4XSA9IG51bGw7XG4gIH07XG5cbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5BZGRKb2luID0gZnVuY3Rpb24gKE9wMSwgT3AyLCBPZmZQdClcbiAge1xuICAgIHZhciBqID0gbmV3IENsaXBwZXJMaWIuSm9pbigpO1xuICAgIGouT3V0UHQxID0gT3AxO1xuICAgIGouT3V0UHQyID0gT3AyO1xuICAgIC8vai5PZmZQdCA9IE9mZlB0O1xuICAgIGouT2ZmUHQuWCA9IE9mZlB0Llg7XG4gICAgai5PZmZQdC5ZID0gT2ZmUHQuWTtcbiAgICB0aGlzLm1fSm9pbnMucHVzaChqKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5BZGRHaG9zdEpvaW4gPSBmdW5jdGlvbiAoT3AsIE9mZlB0KVxuICB7XG4gICAgdmFyIGogPSBuZXcgQ2xpcHBlckxpYi5Kb2luKCk7XG4gICAgai5PdXRQdDEgPSBPcDtcbiAgICAvL2ouT2ZmUHQgPSBPZmZQdDtcbiAgICBqLk9mZlB0LlggPSBPZmZQdC5YO1xuICAgIGouT2ZmUHQuWSA9IE9mZlB0Llk7XG4gICAgdGhpcy5tX0dob3N0Sm9pbnMucHVzaChqKTtcbiAgfTtcbiAgaWYgKHVzZV94eXopXG4gIHtcbiAgICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlNldFogPSBmdW5jdGlvbiAocHQsIGUxLCBlMilcbiAgICB7XG4gICAgICBpZiAodGhpcy5aRmlsbEZ1bmN0aW9uICE9PSBudWxsKVxuICAgICAge1xuICAgICAgICBpZiAocHQuWiAhPSAwIHx8IHRoaXMuWkZpbGxGdW5jdGlvbiA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICBlbHNlIGlmIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHB0LCBlMS5Cb3QpKSBwdC5aID0gZTEuQm90Llo7XG4gICAgICAgIGVsc2UgaWYgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkocHQsIGUxLlRvcCkpIHB0LlogPSBlMS5Ub3AuWjtcbiAgICAgICAgZWxzZSBpZiAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwdCwgZTIuQm90KSkgcHQuWiA9IGUyLkJvdC5aO1xuICAgICAgICBlbHNlIGlmIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHB0LCBlMi5Ub3ApKSBwdC5aID0gZTIuVG9wLlo7XG4gICAgICAgIGVsc2UgWkZpbGxGdW5jdGlvbihlMS5Cb3QsIGUxLlRvcCwgZTIuQm90LCBlMi5Ub3AsIHB0KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgfVxuXG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuSW5zZXJ0TG9jYWxNaW5pbWFJbnRvQUVMID0gZnVuY3Rpb24gKGJvdFkpXG4gIHtcbiAgICB3aGlsZSAodGhpcy5tX0N1cnJlbnRMTSAhPT0gbnVsbCAmJiAodGhpcy5tX0N1cnJlbnRMTS5ZID09IGJvdFkpKVxuICAgIHtcbiAgICAgIHZhciBsYiA9IHRoaXMubV9DdXJyZW50TE0uTGVmdEJvdW5kO1xuICAgICAgdmFyIHJiID0gdGhpcy5tX0N1cnJlbnRMTS5SaWdodEJvdW5kO1xuICAgICAgdGhpcy5Qb3BMb2NhbE1pbmltYSgpO1xuICAgICAgdmFyIE9wMSA9IG51bGw7XG4gICAgICBpZiAobGIgPT09IG51bGwpXG4gICAgICB7XG4gICAgICAgIHRoaXMuSW5zZXJ0RWRnZUludG9BRUwocmIsIG51bGwpO1xuICAgICAgICB0aGlzLlNldFdpbmRpbmdDb3VudChyYik7XG4gICAgICAgIGlmICh0aGlzLklzQ29udHJpYnV0aW5nKHJiKSlcbiAgICAgICAgICBPcDEgPSB0aGlzLkFkZE91dFB0KHJiLCByYi5Cb3QpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAocmIgPT0gbnVsbClcbiAgICAgIHtcbiAgICAgICAgdGhpcy5JbnNlcnRFZGdlSW50b0FFTChsYiwgbnVsbCk7XG4gICAgICAgIHRoaXMuU2V0V2luZGluZ0NvdW50KGxiKTtcbiAgICAgICAgaWYgKHRoaXMuSXNDb250cmlidXRpbmcobGIpKVxuICAgICAgICAgIE9wMSA9IHRoaXMuQWRkT3V0UHQobGIsIGxiLkJvdCk7XG4gICAgICAgIHRoaXMuSW5zZXJ0U2NhbmJlYW0obGIuVG9wLlkpO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICB0aGlzLkluc2VydEVkZ2VJbnRvQUVMKGxiLCBudWxsKTtcbiAgICAgICAgdGhpcy5JbnNlcnRFZGdlSW50b0FFTChyYiwgbGIpO1xuICAgICAgICB0aGlzLlNldFdpbmRpbmdDb3VudChsYik7XG4gICAgICAgIHJiLldpbmRDbnQgPSBsYi5XaW5kQ250O1xuICAgICAgICByYi5XaW5kQ250MiA9IGxiLldpbmRDbnQyO1xuICAgICAgICBpZiAodGhpcy5Jc0NvbnRyaWJ1dGluZyhsYikpXG4gICAgICAgICAgT3AxID0gdGhpcy5BZGRMb2NhbE1pblBvbHkobGIsIHJiLCBsYi5Cb3QpO1xuICAgICAgICB0aGlzLkluc2VydFNjYW5iZWFtKGxiLlRvcC5ZKTtcbiAgICAgIH1cbiAgICAgIGlmIChyYiAhPSBudWxsKVxuICAgICAge1xuICAgICAgICBpZiAoQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Jc0hvcml6b250YWwocmIpKVxuICAgICAgICAgIHRoaXMuQWRkRWRnZVRvU0VMKHJiKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHRoaXMuSW5zZXJ0U2NhbmJlYW0ocmIuVG9wLlkpO1xuICAgICAgfVxuICAgICAgaWYgKGxiID09IG51bGwgfHwgcmIgPT0gbnVsbCkgY29udGludWU7XG4gICAgICAvL2lmIG91dHB1dCBwb2x5Z29ucyBzaGFyZSBhbiBFZGdlIHdpdGggYSBob3Jpem9udGFsIHJiLCB0aGV5J2xsIG5lZWQgam9pbmluZyBsYXRlciAuLi5cbiAgICAgIGlmIChPcDEgIT09IG51bGwgJiYgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Jc0hvcml6b250YWwocmIpICYmIHRoaXMubV9HaG9zdEpvaW5zLmxlbmd0aCA+IDAgJiYgcmIuV2luZERlbHRhICE9PSAwKVxuICAgICAge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWxlbiA9IHRoaXMubV9HaG9zdEpvaW5zLmxlbmd0aDsgaSA8IGlsZW47IGkrKylcbiAgICAgICAge1xuICAgICAgICAgIC8vaWYgdGhlIGhvcml6b250YWwgUmIgYW5kIGEgJ2dob3N0JyBob3Jpem9udGFsIG92ZXJsYXAsIHRoZW4gY29udmVydFxuICAgICAgICAgIC8vdGhlICdnaG9zdCcgam9pbiB0byBhIHJlYWwgam9pbiByZWFkeSBmb3IgbGF0ZXIgLi4uXG4gICAgICAgICAgdmFyIGogPSB0aGlzLm1fR2hvc3RKb2luc1tpXTtcblxuXHRcdFx0XHRcdGlmICh0aGlzLkhvcnpTZWdtZW50c092ZXJsYXAoai5PdXRQdDEuUHQuWCwgai5PZmZQdC5YLCByYi5Cb3QuWCwgcmIuVG9wLlgpKVxuICAgICAgICAgICAgdGhpcy5BZGRKb2luKGouT3V0UHQxLCBPcDEsIGouT2ZmUHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAobGIuT3V0SWR4ID49IDAgJiYgbGIuUHJldkluQUVMICE9PSBudWxsICYmXG4gICAgICAgIGxiLlByZXZJbkFFTC5DdXJyLlggPT0gbGIuQm90LlggJiZcbiAgICAgICAgbGIuUHJldkluQUVMLk91dElkeCA+PSAwICYmXG4gICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2xvcGVzRXF1YWwobGIuUHJldkluQUVMLCBsYiwgdGhpcy5tX1VzZUZ1bGxSYW5nZSkgJiZcbiAgICAgICAgbGIuV2luZERlbHRhICE9PSAwICYmIGxiLlByZXZJbkFFTC5XaW5kRGVsdGEgIT09IDApXG4gICAgICB7XG4gICAgICAgIHZhciBPcDIgPSB0aGlzLkFkZE91dFB0KGxiLlByZXZJbkFFTCwgbGIuQm90KTtcbiAgICAgICAgdGhpcy5BZGRKb2luKE9wMSwgT3AyLCBsYi5Ub3ApO1xuICAgICAgfVxuICAgICAgaWYgKGxiLk5leHRJbkFFTCAhPSByYilcbiAgICAgIHtcbiAgICAgICAgaWYgKHJiLk91dElkeCA+PSAwICYmIHJiLlByZXZJbkFFTC5PdXRJZHggPj0gMCAmJlxuICAgICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2xvcGVzRXF1YWwocmIuUHJldkluQUVMLCByYiwgdGhpcy5tX1VzZUZ1bGxSYW5nZSkgJiZcbiAgICAgICAgICByYi5XaW5kRGVsdGEgIT09IDAgJiYgcmIuUHJldkluQUVMLldpbmREZWx0YSAhPT0gMClcbiAgICAgICAge1xuICAgICAgICAgIHZhciBPcDIgPSB0aGlzLkFkZE91dFB0KHJiLlByZXZJbkFFTCwgcmIuQm90KTtcbiAgICAgICAgICB0aGlzLkFkZEpvaW4oT3AxLCBPcDIsIHJiLlRvcCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGUgPSBsYi5OZXh0SW5BRUw7XG4gICAgICAgIGlmIChlICE9PSBudWxsKVxuICAgICAgICAgIHdoaWxlIChlICE9IHJiKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIC8vbmI6IEZvciBjYWxjdWxhdGluZyB3aW5kaW5nIGNvdW50cyBldGMsIEludGVyc2VjdEVkZ2VzKCkgYXNzdW1lc1xuICAgICAgICAgICAgLy90aGF0IHBhcmFtMSB3aWxsIGJlIHRvIHRoZSByaWdodCBvZiBwYXJhbTIgQUJPVkUgdGhlIGludGVyc2VjdGlvbiAuLi5cbiAgICAgICAgICAgIHRoaXMuSW50ZXJzZWN0RWRnZXMocmIsIGUsIGxiLkN1cnIsIGZhbHNlKTtcbiAgICAgICAgICAgIC8vb3JkZXIgaW1wb3J0YW50IGhlcmVcbiAgICAgICAgICAgIGUgPSBlLk5leHRJbkFFTDtcbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkluc2VydEVkZ2VJbnRvQUVMID0gZnVuY3Rpb24gKGVkZ2UsIHN0YXJ0RWRnZSlcbiAge1xuICAgIGlmICh0aGlzLm1fQWN0aXZlRWRnZXMgPT09IG51bGwpXG4gICAge1xuICAgICAgZWRnZS5QcmV2SW5BRUwgPSBudWxsO1xuICAgICAgZWRnZS5OZXh0SW5BRUwgPSBudWxsO1xuICAgICAgdGhpcy5tX0FjdGl2ZUVkZ2VzID0gZWRnZTtcbiAgICB9XG4gICAgZWxzZSBpZiAoc3RhcnRFZGdlID09PSBudWxsICYmIHRoaXMuRTJJbnNlcnRzQmVmb3JlRTEodGhpcy5tX0FjdGl2ZUVkZ2VzLCBlZGdlKSlcbiAgICB7XG4gICAgICBlZGdlLlByZXZJbkFFTCA9IG51bGw7XG4gICAgICBlZGdlLk5leHRJbkFFTCA9IHRoaXMubV9BY3RpdmVFZGdlcztcbiAgICAgIHRoaXMubV9BY3RpdmVFZGdlcy5QcmV2SW5BRUwgPSBlZGdlO1xuICAgICAgdGhpcy5tX0FjdGl2ZUVkZ2VzID0gZWRnZTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIGlmIChzdGFydEVkZ2UgPT09IG51bGwpXG4gICAgICAgIHN0YXJ0RWRnZSA9IHRoaXMubV9BY3RpdmVFZGdlcztcbiAgICAgIHdoaWxlIChzdGFydEVkZ2UuTmV4dEluQUVMICE9PSBudWxsICYmICF0aGlzLkUySW5zZXJ0c0JlZm9yZUUxKHN0YXJ0RWRnZS5OZXh0SW5BRUwsIGVkZ2UpKVxuICAgICAgICBzdGFydEVkZ2UgPSBzdGFydEVkZ2UuTmV4dEluQUVMO1xuICAgICAgZWRnZS5OZXh0SW5BRUwgPSBzdGFydEVkZ2UuTmV4dEluQUVMO1xuICAgICAgaWYgKHN0YXJ0RWRnZS5OZXh0SW5BRUwgIT09IG51bGwpXG4gICAgICAgIHN0YXJ0RWRnZS5OZXh0SW5BRUwuUHJldkluQUVMID0gZWRnZTtcbiAgICAgIGVkZ2UuUHJldkluQUVMID0gc3RhcnRFZGdlO1xuICAgICAgc3RhcnRFZGdlLk5leHRJbkFFTCA9IGVkZ2U7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkUySW5zZXJ0c0JlZm9yZUUxID0gZnVuY3Rpb24gKGUxLCBlMilcbiAge1xuICAgIGlmIChlMi5DdXJyLlggPT0gZTEuQ3Vyci5YKVxuICAgIHtcbiAgICAgIGlmIChlMi5Ub3AuWSA+IGUxLlRvcC5ZKVxuICAgICAgICByZXR1cm4gZTIuVG9wLlggPCBDbGlwcGVyTGliLkNsaXBwZXIuVG9wWChlMSwgZTIuVG9wLlkpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gZTEuVG9wLlggPiBDbGlwcGVyTGliLkNsaXBwZXIuVG9wWChlMiwgZTEuVG9wLlkpO1xuICAgIH1cbiAgICBlbHNlXG4gICAgICByZXR1cm4gZTIuQ3Vyci5YIDwgZTEuQ3Vyci5YO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLklzRXZlbk9kZEZpbGxUeXBlID0gZnVuY3Rpb24gKGVkZ2UpXG4gIHtcbiAgICBpZiAoZWRnZS5Qb2x5VHlwID09IENsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0KVxuICAgICAgcmV0dXJuIHRoaXMubV9TdWJqRmlsbFR5cGUgPT0gQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0RXZlbk9kZDtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gdGhpcy5tX0NsaXBGaWxsVHlwZSA9PSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRFdmVuT2RkO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLklzRXZlbk9kZEFsdEZpbGxUeXBlID0gZnVuY3Rpb24gKGVkZ2UpXG4gIHtcbiAgICBpZiAoZWRnZS5Qb2x5VHlwID09IENsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0KVxuICAgICAgcmV0dXJuIHRoaXMubV9DbGlwRmlsbFR5cGUgPT0gQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0RXZlbk9kZDtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gdGhpcy5tX1N1YmpGaWxsVHlwZSA9PSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRFdmVuT2RkO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLklzQ29udHJpYnV0aW5nID0gZnVuY3Rpb24gKGVkZ2UpXG4gIHtcbiAgICB2YXIgcGZ0LCBwZnQyO1xuICAgIGlmIChlZGdlLlBvbHlUeXAgPT0gQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdFN1YmplY3QpXG4gICAge1xuICAgICAgcGZ0ID0gdGhpcy5tX1N1YmpGaWxsVHlwZTtcbiAgICAgIHBmdDIgPSB0aGlzLm1fQ2xpcEZpbGxUeXBlO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgcGZ0ID0gdGhpcy5tX0NsaXBGaWxsVHlwZTtcbiAgICAgIHBmdDIgPSB0aGlzLm1fU3ViakZpbGxUeXBlO1xuICAgIH1cbiAgICBzd2l0Y2ggKHBmdClcbiAgICB7XG4gICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRFdmVuT2RkOlxuICAgICAgaWYgKGVkZ2UuV2luZERlbHRhID09PSAwICYmIGVkZ2UuV2luZENudCAhPSAxKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBicmVhaztcbiAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm86XG4gICAgICBpZiAoTWF0aC5hYnMoZWRnZS5XaW5kQ250KSAhPSAxKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBicmVhaztcbiAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdFBvc2l0aXZlOlxuICAgICAgaWYgKGVkZ2UuV2luZENudCAhPSAxKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgaWYgKGVkZ2UuV2luZENudCAhPSAtMSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHN3aXRjaCAodGhpcy5tX0NsaXBUeXBlKVxuICAgIHtcbiAgICBjYXNlIENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RJbnRlcnNlY3Rpb246XG4gICAgICBzd2l0Y2ggKHBmdDIpXG4gICAgICB7XG4gICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdEV2ZW5PZGQ6XG4gICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm86XG4gICAgICAgIHJldHVybiAoZWRnZS5XaW5kQ250MiAhPT0gMCk7XG4gICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdFBvc2l0aXZlOlxuICAgICAgICByZXR1cm4gKGVkZ2UuV2luZENudDIgPiAwKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiAoZWRnZS5XaW5kQ250MiA8IDApO1xuICAgICAgfVxuICAgIGNhc2UgQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFVuaW9uOlxuICAgICAgc3dpdGNoIChwZnQyKVxuICAgICAge1xuICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRFdmVuT2RkOlxuICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvOlxuICAgICAgICByZXR1cm4gKGVkZ2UuV2luZENudDIgPT09IDApO1xuICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRQb3NpdGl2ZTpcbiAgICAgICAgcmV0dXJuIChlZGdlLldpbmRDbnQyIDw9IDApO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIChlZGdlLldpbmRDbnQyID49IDApO1xuICAgICAgfVxuICAgIGNhc2UgQ2xpcHBlckxpYi5DbGlwVHlwZS5jdERpZmZlcmVuY2U6XG4gICAgICBpZiAoZWRnZS5Qb2x5VHlwID09IENsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0KVxuICAgICAgICBzd2l0Y2ggKHBmdDIpXG4gICAgICAgIHtcbiAgICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRFdmVuT2RkOlxuICAgICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm86XG4gICAgICAgICAgcmV0dXJuIChlZGdlLldpbmRDbnQyID09PSAwKTtcbiAgICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRQb3NpdGl2ZTpcbiAgICAgICAgICByZXR1cm4gKGVkZ2UuV2luZENudDIgPD0gMCk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIChlZGdlLldpbmRDbnQyID49IDApO1xuICAgICAgICB9XG4gICAgICBlbHNlXG4gICAgICAgIHN3aXRjaCAocGZ0MilcbiAgICAgICAge1xuICAgICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdEV2ZW5PZGQ6XG4gICAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybzpcbiAgICAgICAgICByZXR1cm4gKGVkZ2UuV2luZENudDIgIT09IDApO1xuICAgICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdFBvc2l0aXZlOlxuICAgICAgICAgIHJldHVybiAoZWRnZS5XaW5kQ250MiA+IDApO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiAoZWRnZS5XaW5kQ250MiA8IDApO1xuICAgICAgICB9XG4gICAgY2FzZSBDbGlwcGVyTGliLkNsaXBUeXBlLmN0WG9yOlxuICAgICAgaWYgKGVkZ2UuV2luZERlbHRhID09PSAwKVxuICAgICAgICBzd2l0Y2ggKHBmdDIpXG4gICAgICAgIHtcbiAgICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRFdmVuT2RkOlxuICAgICAgICBjYXNlIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm86XG4gICAgICAgICAgcmV0dXJuIChlZGdlLldpbmRDbnQyID09PSAwKTtcbiAgICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRQb3NpdGl2ZTpcbiAgICAgICAgICByZXR1cm4gKGVkZ2UuV2luZENudDIgPD0gMCk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIChlZGdlLldpbmRDbnQyID49IDApO1xuICAgICAgICB9XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5TZXRXaW5kaW5nQ291bnQgPSBmdW5jdGlvbiAoZWRnZSlcbiAge1xuICAgIHZhciBlID0gZWRnZS5QcmV2SW5BRUw7XG4gICAgLy9maW5kIHRoZSBlZGdlIG9mIHRoZSBzYW1lIHBvbHl0eXBlIHRoYXQgaW1tZWRpYXRlbHkgcHJlY2VlZHMgJ2VkZ2UnIGluIEFFTFxuICAgIHdoaWxlIChlICE9PSBudWxsICYmICgoZS5Qb2x5VHlwICE9IGVkZ2UuUG9seVR5cCkgfHwgKGUuV2luZERlbHRhID09PSAwKSkpXG4gICAgICBlID0gZS5QcmV2SW5BRUw7XG4gICAgaWYgKGUgPT09IG51bGwpXG4gICAge1xuICAgICAgZWRnZS5XaW5kQ250ID0gKGVkZ2UuV2luZERlbHRhID09PSAwID8gMSA6IGVkZ2UuV2luZERlbHRhKTtcbiAgICAgIGVkZ2UuV2luZENudDIgPSAwO1xuICAgICAgZSA9IHRoaXMubV9BY3RpdmVFZGdlcztcbiAgICAgIC8vaWUgZ2V0IHJlYWR5IHRvIGNhbGMgV2luZENudDJcbiAgICB9XG4gICAgZWxzZSBpZiAoZWRnZS5XaW5kRGVsdGEgPT09IDAgJiYgdGhpcy5tX0NsaXBUeXBlICE9IENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RVbmlvbilcbiAgICB7XG4gICAgICBlZGdlLldpbmRDbnQgPSAxO1xuICAgICAgZWRnZS5XaW5kQ250MiA9IGUuV2luZENudDI7XG4gICAgICBlID0gZS5OZXh0SW5BRUw7XG4gICAgICAvL2llIGdldCByZWFkeSB0byBjYWxjIFdpbmRDbnQyXG4gICAgfVxuICAgIGVsc2UgaWYgKHRoaXMuSXNFdmVuT2RkRmlsbFR5cGUoZWRnZSkpXG4gICAge1xuICAgICAgLy9FdmVuT2RkIGZpbGxpbmcgLi4uXG4gICAgICBpZiAoZWRnZS5XaW5kRGVsdGEgPT09IDApXG4gICAgICB7XG4gICAgICAgIC8vYXJlIHdlIGluc2lkZSBhIHN1YmogcG9seWdvbiAuLi5cbiAgICAgICAgdmFyIEluc2lkZSA9IHRydWU7XG4gICAgICAgIHZhciBlMiA9IGUuUHJldkluQUVMO1xuICAgICAgICB3aGlsZSAoZTIgIT09IG51bGwpXG4gICAgICAgIHtcbiAgICAgICAgICBpZiAoZTIuUG9seVR5cCA9PSBlLlBvbHlUeXAgJiYgZTIuV2luZERlbHRhICE9PSAwKVxuICAgICAgICAgICAgSW5zaWRlID0gIUluc2lkZTtcbiAgICAgICAgICBlMiA9IGUyLlByZXZJbkFFTDtcbiAgICAgICAgfVxuICAgICAgICBlZGdlLldpbmRDbnQgPSAoSW5zaWRlID8gMCA6IDEpO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICBlZGdlLldpbmRDbnQgPSBlZGdlLldpbmREZWx0YTtcbiAgICAgIH1cbiAgICAgIGVkZ2UuV2luZENudDIgPSBlLldpbmRDbnQyO1xuICAgICAgZSA9IGUuTmV4dEluQUVMO1xuICAgICAgLy9pZSBnZXQgcmVhZHkgdG8gY2FsYyBXaW5kQ250MlxuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgLy9ub25aZXJvLCBQb3NpdGl2ZSBvciBOZWdhdGl2ZSBmaWxsaW5nIC4uLlxuICAgICAgaWYgKGUuV2luZENudCAqIGUuV2luZERlbHRhIDwgMClcbiAgICAgIHtcbiAgICAgICAgLy9wcmV2IGVkZ2UgaXMgJ2RlY3JlYXNpbmcnIFdpbmRDb3VudCAoV0MpIHRvd2FyZCB6ZXJvXG4gICAgICAgIC8vc28gd2UncmUgb3V0c2lkZSB0aGUgcHJldmlvdXMgcG9seWdvbiAuLi5cbiAgICAgICAgaWYgKE1hdGguYWJzKGUuV2luZENudCkgPiAxKVxuICAgICAgICB7XG4gICAgICAgICAgLy9vdXRzaWRlIHByZXYgcG9seSBidXQgc3RpbGwgaW5zaWRlIGFub3RoZXIuXG4gICAgICAgICAgLy93aGVuIHJldmVyc2luZyBkaXJlY3Rpb24gb2YgcHJldiBwb2x5IHVzZSB0aGUgc2FtZSBXQ1xuICAgICAgICAgIGlmIChlLldpbmREZWx0YSAqIGVkZ2UuV2luZERlbHRhIDwgMClcbiAgICAgICAgICAgIGVkZ2UuV2luZENudCA9IGUuV2luZENudDtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBlZGdlLldpbmRDbnQgPSBlLldpbmRDbnQgKyBlZGdlLldpbmREZWx0YTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgZWRnZS5XaW5kQ250ID0gKGVkZ2UuV2luZERlbHRhID09PSAwID8gMSA6IGVkZ2UuV2luZERlbHRhKTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgLy9wcmV2IGVkZ2UgaXMgJ2luY3JlYXNpbmcnIFdpbmRDb3VudCAoV0MpIGF3YXkgZnJvbSB6ZXJvXG4gICAgICAgIC8vc28gd2UncmUgaW5zaWRlIHRoZSBwcmV2aW91cyBwb2x5Z29uIC4uLlxuICAgICAgICBpZiAoZWRnZS5XaW5kRGVsdGEgPT09IDApXG4gICAgICAgICAgZWRnZS5XaW5kQ250ID0gKGUuV2luZENudCA8IDAgPyBlLldpbmRDbnQgLSAxIDogZS5XaW5kQ250ICsgMSk7XG4gICAgICAgIGVsc2UgaWYgKGUuV2luZERlbHRhICogZWRnZS5XaW5kRGVsdGEgPCAwKVxuICAgICAgICAgIGVkZ2UuV2luZENudCA9IGUuV2luZENudDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGVkZ2UuV2luZENudCA9IGUuV2luZENudCArIGVkZ2UuV2luZERlbHRhO1xuICAgICAgfVxuICAgICAgZWRnZS5XaW5kQ250MiA9IGUuV2luZENudDI7XG4gICAgICBlID0gZS5OZXh0SW5BRUw7XG4gICAgICAvL2llIGdldCByZWFkeSB0byBjYWxjIFdpbmRDbnQyXG4gICAgfVxuICAgIC8vdXBkYXRlIFdpbmRDbnQyIC4uLlxuICAgIGlmICh0aGlzLklzRXZlbk9kZEFsdEZpbGxUeXBlKGVkZ2UpKVxuICAgIHtcbiAgICAgIC8vRXZlbk9kZCBmaWxsaW5nIC4uLlxuICAgICAgd2hpbGUgKGUgIT0gZWRnZSlcbiAgICAgIHtcbiAgICAgICAgaWYgKGUuV2luZERlbHRhICE9PSAwKVxuICAgICAgICAgIGVkZ2UuV2luZENudDIgPSAoZWRnZS5XaW5kQ250MiA9PT0gMCA/IDEgOiAwKTtcbiAgICAgICAgZSA9IGUuTmV4dEluQUVMO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgLy9ub25aZXJvLCBQb3NpdGl2ZSBvciBOZWdhdGl2ZSBmaWxsaW5nIC4uLlxuICAgICAgd2hpbGUgKGUgIT0gZWRnZSlcbiAgICAgIHtcbiAgICAgICAgZWRnZS5XaW5kQ250MiArPSBlLldpbmREZWx0YTtcbiAgICAgICAgZSA9IGUuTmV4dEluQUVMO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5BZGRFZGdlVG9TRUwgPSBmdW5jdGlvbiAoZWRnZSlcbiAge1xuICAgIC8vU0VMIHBvaW50ZXJzIGluIFBFZGdlIGFyZSByZXVzZWQgdG8gYnVpbGQgYSBsaXN0IG9mIGhvcml6b250YWwgZWRnZXMuXG4gICAgLy9Ib3dldmVyLCB3ZSBkb24ndCBuZWVkIHRvIHdvcnJ5IGFib3V0IG9yZGVyIHdpdGggaG9yaXpvbnRhbCBlZGdlIHByb2Nlc3NpbmcuXG4gICAgaWYgKHRoaXMubV9Tb3J0ZWRFZGdlcyA9PT0gbnVsbClcbiAgICB7XG4gICAgICB0aGlzLm1fU29ydGVkRWRnZXMgPSBlZGdlO1xuICAgICAgZWRnZS5QcmV2SW5TRUwgPSBudWxsO1xuICAgICAgZWRnZS5OZXh0SW5TRUwgPSBudWxsO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgZWRnZS5OZXh0SW5TRUwgPSB0aGlzLm1fU29ydGVkRWRnZXM7XG4gICAgICBlZGdlLlByZXZJblNFTCA9IG51bGw7XG4gICAgICB0aGlzLm1fU29ydGVkRWRnZXMuUHJldkluU0VMID0gZWRnZTtcbiAgICAgIHRoaXMubV9Tb3J0ZWRFZGdlcyA9IGVkZ2U7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkNvcHlBRUxUb1NFTCA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB2YXIgZSA9IHRoaXMubV9BY3RpdmVFZGdlcztcbiAgICB0aGlzLm1fU29ydGVkRWRnZXMgPSBlO1xuICAgIHdoaWxlIChlICE9PSBudWxsKVxuICAgIHtcbiAgICAgIGUuUHJldkluU0VMID0gZS5QcmV2SW5BRUw7XG4gICAgICBlLk5leHRJblNFTCA9IGUuTmV4dEluQUVMO1xuICAgICAgZSA9IGUuTmV4dEluQUVMO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Td2FwUG9zaXRpb25zSW5BRUwgPSBmdW5jdGlvbiAoZWRnZTEsIGVkZ2UyKVxuICB7XG4gICAgLy9jaGVjayB0aGF0IG9uZSBvciBvdGhlciBlZGdlIGhhc24ndCBhbHJlYWR5IGJlZW4gcmVtb3ZlZCBmcm9tIEFFTCAuLi5cbiAgICBpZiAoZWRnZTEuTmV4dEluQUVMID09IGVkZ2UxLlByZXZJbkFFTCB8fCBlZGdlMi5OZXh0SW5BRUwgPT0gZWRnZTIuUHJldkluQUVMKVxuICAgICAgcmV0dXJuO1xuICAgIGlmIChlZGdlMS5OZXh0SW5BRUwgPT0gZWRnZTIpXG4gICAge1xuICAgICAgdmFyIG5leHQgPSBlZGdlMi5OZXh0SW5BRUw7XG4gICAgICBpZiAobmV4dCAhPT0gbnVsbClcbiAgICAgICAgbmV4dC5QcmV2SW5BRUwgPSBlZGdlMTtcbiAgICAgIHZhciBwcmV2ID0gZWRnZTEuUHJldkluQUVMO1xuICAgICAgaWYgKHByZXYgIT09IG51bGwpXG4gICAgICAgIHByZXYuTmV4dEluQUVMID0gZWRnZTI7XG4gICAgICBlZGdlMi5QcmV2SW5BRUwgPSBwcmV2O1xuICAgICAgZWRnZTIuTmV4dEluQUVMID0gZWRnZTE7XG4gICAgICBlZGdlMS5QcmV2SW5BRUwgPSBlZGdlMjtcbiAgICAgIGVkZ2UxLk5leHRJbkFFTCA9IG5leHQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKGVkZ2UyLk5leHRJbkFFTCA9PSBlZGdlMSlcbiAgICB7XG4gICAgICB2YXIgbmV4dCA9IGVkZ2UxLk5leHRJbkFFTDtcbiAgICAgIGlmIChuZXh0ICE9PSBudWxsKVxuICAgICAgICBuZXh0LlByZXZJbkFFTCA9IGVkZ2UyO1xuICAgICAgdmFyIHByZXYgPSBlZGdlMi5QcmV2SW5BRUw7XG4gICAgICBpZiAocHJldiAhPT0gbnVsbClcbiAgICAgICAgcHJldi5OZXh0SW5BRUwgPSBlZGdlMTtcbiAgICAgIGVkZ2UxLlByZXZJbkFFTCA9IHByZXY7XG4gICAgICBlZGdlMS5OZXh0SW5BRUwgPSBlZGdlMjtcbiAgICAgIGVkZ2UyLlByZXZJbkFFTCA9IGVkZ2UxO1xuICAgICAgZWRnZTIuTmV4dEluQUVMID0gbmV4dDtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIHZhciBuZXh0ID0gZWRnZTEuTmV4dEluQUVMO1xuICAgICAgdmFyIHByZXYgPSBlZGdlMS5QcmV2SW5BRUw7XG4gICAgICBlZGdlMS5OZXh0SW5BRUwgPSBlZGdlMi5OZXh0SW5BRUw7XG4gICAgICBpZiAoZWRnZTEuTmV4dEluQUVMICE9PSBudWxsKVxuICAgICAgICBlZGdlMS5OZXh0SW5BRUwuUHJldkluQUVMID0gZWRnZTE7XG4gICAgICBlZGdlMS5QcmV2SW5BRUwgPSBlZGdlMi5QcmV2SW5BRUw7XG4gICAgICBpZiAoZWRnZTEuUHJldkluQUVMICE9PSBudWxsKVxuICAgICAgICBlZGdlMS5QcmV2SW5BRUwuTmV4dEluQUVMID0gZWRnZTE7XG4gICAgICBlZGdlMi5OZXh0SW5BRUwgPSBuZXh0O1xuICAgICAgaWYgKGVkZ2UyLk5leHRJbkFFTCAhPT0gbnVsbClcbiAgICAgICAgZWRnZTIuTmV4dEluQUVMLlByZXZJbkFFTCA9IGVkZ2UyO1xuICAgICAgZWRnZTIuUHJldkluQUVMID0gcHJldjtcbiAgICAgIGlmIChlZGdlMi5QcmV2SW5BRUwgIT09IG51bGwpXG4gICAgICAgIGVkZ2UyLlByZXZJbkFFTC5OZXh0SW5BRUwgPSBlZGdlMjtcbiAgICB9XG4gICAgaWYgKGVkZ2UxLlByZXZJbkFFTCA9PT0gbnVsbClcbiAgICAgIHRoaXMubV9BY3RpdmVFZGdlcyA9IGVkZ2UxO1xuICAgIGVsc2UgaWYgKGVkZ2UyLlByZXZJbkFFTCA9PT0gbnVsbClcbiAgICAgIHRoaXMubV9BY3RpdmVFZGdlcyA9IGVkZ2UyO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlN3YXBQb3NpdGlvbnNJblNFTCA9IGZ1bmN0aW9uIChlZGdlMSwgZWRnZTIpXG4gIHtcbiAgICBpZiAoZWRnZTEuTmV4dEluU0VMID09PSBudWxsICYmIGVkZ2UxLlByZXZJblNFTCA9PT0gbnVsbClcbiAgICAgIHJldHVybjtcbiAgICBpZiAoZWRnZTIuTmV4dEluU0VMID09PSBudWxsICYmIGVkZ2UyLlByZXZJblNFTCA9PT0gbnVsbClcbiAgICAgIHJldHVybjtcbiAgICBpZiAoZWRnZTEuTmV4dEluU0VMID09IGVkZ2UyKVxuICAgIHtcbiAgICAgIHZhciBuZXh0ID0gZWRnZTIuTmV4dEluU0VMO1xuICAgICAgaWYgKG5leHQgIT09IG51bGwpXG4gICAgICAgIG5leHQuUHJldkluU0VMID0gZWRnZTE7XG4gICAgICB2YXIgcHJldiA9IGVkZ2UxLlByZXZJblNFTDtcbiAgICAgIGlmIChwcmV2ICE9PSBudWxsKVxuICAgICAgICBwcmV2Lk5leHRJblNFTCA9IGVkZ2UyO1xuICAgICAgZWRnZTIuUHJldkluU0VMID0gcHJldjtcbiAgICAgIGVkZ2UyLk5leHRJblNFTCA9IGVkZ2UxO1xuICAgICAgZWRnZTEuUHJldkluU0VMID0gZWRnZTI7XG4gICAgICBlZGdlMS5OZXh0SW5TRUwgPSBuZXh0O1xuICAgIH1cbiAgICBlbHNlIGlmIChlZGdlMi5OZXh0SW5TRUwgPT0gZWRnZTEpXG4gICAge1xuICAgICAgdmFyIG5leHQgPSBlZGdlMS5OZXh0SW5TRUw7XG4gICAgICBpZiAobmV4dCAhPT0gbnVsbClcbiAgICAgICAgbmV4dC5QcmV2SW5TRUwgPSBlZGdlMjtcbiAgICAgIHZhciBwcmV2ID0gZWRnZTIuUHJldkluU0VMO1xuICAgICAgaWYgKHByZXYgIT09IG51bGwpXG4gICAgICAgIHByZXYuTmV4dEluU0VMID0gZWRnZTE7XG4gICAgICBlZGdlMS5QcmV2SW5TRUwgPSBwcmV2O1xuICAgICAgZWRnZTEuTmV4dEluU0VMID0gZWRnZTI7XG4gICAgICBlZGdlMi5QcmV2SW5TRUwgPSBlZGdlMTtcbiAgICAgIGVkZ2UyLk5leHRJblNFTCA9IG5leHQ7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICB2YXIgbmV4dCA9IGVkZ2UxLk5leHRJblNFTDtcbiAgICAgIHZhciBwcmV2ID0gZWRnZTEuUHJldkluU0VMO1xuICAgICAgZWRnZTEuTmV4dEluU0VMID0gZWRnZTIuTmV4dEluU0VMO1xuICAgICAgaWYgKGVkZ2UxLk5leHRJblNFTCAhPT0gbnVsbClcbiAgICAgICAgZWRnZTEuTmV4dEluU0VMLlByZXZJblNFTCA9IGVkZ2UxO1xuICAgICAgZWRnZTEuUHJldkluU0VMID0gZWRnZTIuUHJldkluU0VMO1xuICAgICAgaWYgKGVkZ2UxLlByZXZJblNFTCAhPT0gbnVsbClcbiAgICAgICAgZWRnZTEuUHJldkluU0VMLk5leHRJblNFTCA9IGVkZ2UxO1xuICAgICAgZWRnZTIuTmV4dEluU0VMID0gbmV4dDtcbiAgICAgIGlmIChlZGdlMi5OZXh0SW5TRUwgIT09IG51bGwpXG4gICAgICAgIGVkZ2UyLk5leHRJblNFTC5QcmV2SW5TRUwgPSBlZGdlMjtcbiAgICAgIGVkZ2UyLlByZXZJblNFTCA9IHByZXY7XG4gICAgICBpZiAoZWRnZTIuUHJldkluU0VMICE9PSBudWxsKVxuICAgICAgICBlZGdlMi5QcmV2SW5TRUwuTmV4dEluU0VMID0gZWRnZTI7XG4gICAgfVxuICAgIGlmIChlZGdlMS5QcmV2SW5TRUwgPT09IG51bGwpXG4gICAgICB0aGlzLm1fU29ydGVkRWRnZXMgPSBlZGdlMTtcbiAgICBlbHNlIGlmIChlZGdlMi5QcmV2SW5TRUwgPT09IG51bGwpXG4gICAgICB0aGlzLm1fU29ydGVkRWRnZXMgPSBlZGdlMjtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5BZGRMb2NhbE1heFBvbHkgPSBmdW5jdGlvbiAoZTEsIGUyLCBwdClcbiAge1xuICAgIHRoaXMuQWRkT3V0UHQoZTEsIHB0KTtcbiAgICBpZiAoZTIuV2luZERlbHRhID09IDApIHRoaXMuQWRkT3V0UHQoZTIsIHB0KTtcbiAgICBpZiAoZTEuT3V0SWR4ID09IGUyLk91dElkeClcbiAgICB7XG4gICAgICBlMS5PdXRJZHggPSAtMTtcbiAgICAgIGUyLk91dElkeCA9IC0xO1xuICAgIH1cbiAgICBlbHNlIGlmIChlMS5PdXRJZHggPCBlMi5PdXRJZHgpXG4gICAgICB0aGlzLkFwcGVuZFBvbHlnb24oZTEsIGUyKTtcbiAgICBlbHNlXG4gICAgICB0aGlzLkFwcGVuZFBvbHlnb24oZTIsIGUxKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5BZGRMb2NhbE1pblBvbHkgPSBmdW5jdGlvbiAoZTEsIGUyLCBwdClcbiAge1xuICAgIHZhciByZXN1bHQ7XG4gICAgdmFyIGUsIHByZXZFO1xuICAgIGlmIChDbGlwcGVyTGliLkNsaXBwZXJCYXNlLklzSG9yaXpvbnRhbChlMikgfHwgKGUxLkR4ID4gZTIuRHgpKVxuICAgIHtcbiAgICAgIHJlc3VsdCA9IHRoaXMuQWRkT3V0UHQoZTEsIHB0KTtcbiAgICAgIGUyLk91dElkeCA9IGUxLk91dElkeDtcbiAgICAgIGUxLlNpZGUgPSBDbGlwcGVyTGliLkVkZ2VTaWRlLmVzTGVmdDtcbiAgICAgIGUyLlNpZGUgPSBDbGlwcGVyTGliLkVkZ2VTaWRlLmVzUmlnaHQ7XG4gICAgICBlID0gZTE7XG4gICAgICBpZiAoZS5QcmV2SW5BRUwgPT0gZTIpXG4gICAgICAgIHByZXZFID0gZTIuUHJldkluQUVMO1xuICAgICAgZWxzZVxuICAgICAgICBwcmV2RSA9IGUuUHJldkluQUVMO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgcmVzdWx0ID0gdGhpcy5BZGRPdXRQdChlMiwgcHQpO1xuICAgICAgZTEuT3V0SWR4ID0gZTIuT3V0SWR4O1xuICAgICAgZTEuU2lkZSA9IENsaXBwZXJMaWIuRWRnZVNpZGUuZXNSaWdodDtcbiAgICAgIGUyLlNpZGUgPSBDbGlwcGVyTGliLkVkZ2VTaWRlLmVzTGVmdDtcbiAgICAgIGUgPSBlMjtcbiAgICAgIGlmIChlLlByZXZJbkFFTCA9PSBlMSlcbiAgICAgICAgcHJldkUgPSBlMS5QcmV2SW5BRUw7XG4gICAgICBlbHNlXG4gICAgICAgIHByZXZFID0gZS5QcmV2SW5BRUw7XG4gICAgfVxuICAgIGlmIChwcmV2RSAhPT0gbnVsbCAmJiBwcmV2RS5PdXRJZHggPj0gMCAmJiAoQ2xpcHBlckxpYi5DbGlwcGVyLlRvcFgocHJldkUsIHB0LlkpID09IENsaXBwZXJMaWIuQ2xpcHBlci5Ub3BYKGUsIHB0LlkpKSAmJiBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNsb3Blc0VxdWFsKGUsIHByZXZFLCB0aGlzLm1fVXNlRnVsbFJhbmdlKSAmJiAoZS5XaW5kRGVsdGEgIT09IDApICYmIChwcmV2RS5XaW5kRGVsdGEgIT09IDApKVxuICAgIHtcbiAgICAgIHZhciBvdXRQdCA9IHRoaXMuQWRkT3V0UHQocHJldkUsIHB0KTtcbiAgICAgIHRoaXMuQWRkSm9pbihyZXN1bHQsIG91dFB0LCBlLlRvcCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuQ3JlYXRlT3V0UmVjID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHZhciByZXN1bHQgPSBuZXcgQ2xpcHBlckxpYi5PdXRSZWMoKTtcbiAgICByZXN1bHQuSWR4ID0gLTE7XG4gICAgcmVzdWx0LklzSG9sZSA9IGZhbHNlO1xuICAgIHJlc3VsdC5Jc09wZW4gPSBmYWxzZTtcbiAgICByZXN1bHQuRmlyc3RMZWZ0ID0gbnVsbDtcbiAgICByZXN1bHQuUHRzID0gbnVsbDtcbiAgICByZXN1bHQuQm90dG9tUHQgPSBudWxsO1xuICAgIHJlc3VsdC5Qb2x5Tm9kZSA9IG51bGw7XG4gICAgdGhpcy5tX1BvbHlPdXRzLnB1c2gocmVzdWx0KTtcbiAgICByZXN1bHQuSWR4ID0gdGhpcy5tX1BvbHlPdXRzLmxlbmd0aCAtIDE7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5BZGRPdXRQdCA9IGZ1bmN0aW9uIChlLCBwdClcbiAge1xuICAgIHZhciBUb0Zyb250ID0gKGUuU2lkZSA9PSBDbGlwcGVyTGliLkVkZ2VTaWRlLmVzTGVmdCk7XG4gICAgaWYgKGUuT3V0SWR4IDwgMClcbiAgICB7XG4gICAgICB2YXIgb3V0UmVjID0gdGhpcy5DcmVhdGVPdXRSZWMoKTtcbiAgICAgIG91dFJlYy5Jc09wZW4gPSAoZS5XaW5kRGVsdGEgPT09IDApO1xuICAgICAgdmFyIG5ld09wID0gbmV3IENsaXBwZXJMaWIuT3V0UHQoKTtcbiAgICAgIG91dFJlYy5QdHMgPSBuZXdPcDtcbiAgICAgIG5ld09wLklkeCA9IG91dFJlYy5JZHg7XG4gICAgICAvL25ld09wLlB0ID0gcHQ7XG4gICAgICBuZXdPcC5QdC5YID0gcHQuWDtcbiAgICAgIG5ld09wLlB0LlkgPSBwdC5ZO1xuICAgICAgbmV3T3AuTmV4dCA9IG5ld09wO1xuICAgICAgbmV3T3AuUHJldiA9IG5ld09wO1xuICAgICAgaWYgKCFvdXRSZWMuSXNPcGVuKVxuICAgICAgICB0aGlzLlNldEhvbGVTdGF0ZShlLCBvdXRSZWMpO1xuICAgICAgZS5PdXRJZHggPSBvdXRSZWMuSWR4O1xuICAgICAgLy9uYjogZG8gdGhpcyBhZnRlciBTZXRaICFcbiAgICAgIHJldHVybiBuZXdPcDtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIHZhciBvdXRSZWMgPSB0aGlzLm1fUG9seU91dHNbZS5PdXRJZHhdO1xuICAgICAgLy9PdXRSZWMuUHRzIGlzIHRoZSAnTGVmdC1tb3N0JyBwb2ludCAmIE91dFJlYy5QdHMuUHJldiBpcyB0aGUgJ1JpZ2h0LW1vc3QnXG4gICAgICB2YXIgb3AgPSBvdXRSZWMuUHRzO1xuICAgICAgaWYgKFRvRnJvbnQgJiYgQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwdCwgb3AuUHQpKVxuICAgICAgICByZXR1cm4gb3A7XG4gICAgICBlbHNlIGlmICghVG9Gcm9udCAmJiBDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHB0LCBvcC5QcmV2LlB0KSlcbiAgICAgICAgcmV0dXJuIG9wLlByZXY7XG4gICAgICB2YXIgbmV3T3AgPSBuZXcgQ2xpcHBlckxpYi5PdXRQdCgpO1xuICAgICAgbmV3T3AuSWR4ID0gb3V0UmVjLklkeDtcbiAgICAgIC8vbmV3T3AuUHQgPSBwdDtcbiAgICAgIG5ld09wLlB0LlggPSBwdC5YO1xuICAgICAgbmV3T3AuUHQuWSA9IHB0Llk7XG4gICAgICBuZXdPcC5OZXh0ID0gb3A7XG4gICAgICBuZXdPcC5QcmV2ID0gb3AuUHJldjtcbiAgICAgIG5ld09wLlByZXYuTmV4dCA9IG5ld09wO1xuICAgICAgb3AuUHJldiA9IG5ld09wO1xuICAgICAgaWYgKFRvRnJvbnQpXG4gICAgICAgIG91dFJlYy5QdHMgPSBuZXdPcDtcbiAgICAgIHJldHVybiBuZXdPcDtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuU3dhcFBvaW50cyA9IGZ1bmN0aW9uIChwdDEsIHB0MilcbiAge1xuICAgIHZhciB0bXAgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChwdDEuVmFsdWUpO1xuICAgIC8vcHQxLlZhbHVlID0gcHQyLlZhbHVlO1xuICAgIHB0MS5WYWx1ZS5YID0gcHQyLlZhbHVlLlg7XG4gICAgcHQxLlZhbHVlLlkgPSBwdDIuVmFsdWUuWTtcbiAgICAvL3B0Mi5WYWx1ZSA9IHRtcDtcbiAgICBwdDIuVmFsdWUuWCA9IHRtcC5YO1xuICAgIHB0Mi5WYWx1ZS5ZID0gdG1wLlk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuSG9yelNlZ21lbnRzT3ZlcmxhcCA9IGZ1bmN0aW9uIChzZWcxYSwgc2VnMWIsIHNlZzJhLCBzZWcyYilcblx0e1xuXHRcdHZhciB0bXA7XG5cdFx0aWYgKHNlZzFhID4gc2VnMWIpXG5cdFx0e1xuXHRcdFx0dG1wID0gc2VnMWE7XG5cdFx0XHRzZWcxYSA9IHNlZzFiO1xuXHRcdFx0c2VnMWIgPSB0bXA7XG5cdFx0fVxuXHRcdGlmIChzZWcyYSA+IHNlZzJiKVxuXHRcdHtcblx0XHRcdHRtcCA9IHNlZzJhO1xuXHRcdFx0c2VnMmEgPSBzZWcyYjtcblx0XHRcdHNlZzJiID0gdG1wO1xuXHRcdH1cblx0XHRyZXR1cm4gKHNlZzFhIDwgc2VnMmIpICYmIChzZWcyYSA8IHNlZzFiKTtcblx0fVxuXG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuU2V0SG9sZVN0YXRlID0gZnVuY3Rpb24gKGUsIG91dFJlYylcbiAge1xuICAgIHZhciBpc0hvbGUgPSBmYWxzZTtcbiAgICB2YXIgZTIgPSBlLlByZXZJbkFFTDtcbiAgICB3aGlsZSAoZTIgIT09IG51bGwpXG4gICAge1xuICAgICAgaWYgKGUyLk91dElkeCA+PSAwICYmIGUyLldpbmREZWx0YSAhPSAwKVxuICAgICAge1xuICAgICAgICBpc0hvbGUgPSAhaXNIb2xlO1xuICAgICAgICBpZiAob3V0UmVjLkZpcnN0TGVmdCA9PT0gbnVsbClcbiAgICAgICAgICBvdXRSZWMuRmlyc3RMZWZ0ID0gdGhpcy5tX1BvbHlPdXRzW2UyLk91dElkeF07XG4gICAgICB9XG4gICAgICBlMiA9IGUyLlByZXZJbkFFTDtcbiAgICB9XG4gICAgaWYgKGlzSG9sZSlcbiAgICAgIG91dFJlYy5Jc0hvbGUgPSB0cnVlO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkdldER4ID0gZnVuY3Rpb24gKHB0MSwgcHQyKVxuICB7XG4gICAgaWYgKHB0MS5ZID09IHB0Mi5ZKVxuICAgICAgcmV0dXJuIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuaG9yaXpvbnRhbDtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gKHB0Mi5YIC0gcHQxLlgpIC8gKHB0Mi5ZIC0gcHQxLlkpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkZpcnN0SXNCb3R0b21QdCA9IGZ1bmN0aW9uIChidG1QdDEsIGJ0bVB0MilcbiAge1xuICAgIHZhciBwID0gYnRtUHQxLlByZXY7XG4gICAgd2hpbGUgKChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHAuUHQsIGJ0bVB0MS5QdCkpICYmIChwICE9IGJ0bVB0MSkpXG4gICAgICBwID0gcC5QcmV2O1xuICAgIHZhciBkeDFwID0gTWF0aC5hYnModGhpcy5HZXREeChidG1QdDEuUHQsIHAuUHQpKTtcbiAgICBwID0gYnRtUHQxLk5leHQ7XG4gICAgd2hpbGUgKChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHAuUHQsIGJ0bVB0MS5QdCkpICYmIChwICE9IGJ0bVB0MSkpXG4gICAgICBwID0gcC5OZXh0O1xuICAgIHZhciBkeDFuID0gTWF0aC5hYnModGhpcy5HZXREeChidG1QdDEuUHQsIHAuUHQpKTtcbiAgICBwID0gYnRtUHQyLlByZXY7XG4gICAgd2hpbGUgKChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHAuUHQsIGJ0bVB0Mi5QdCkpICYmIChwICE9IGJ0bVB0MikpXG4gICAgICBwID0gcC5QcmV2O1xuICAgIHZhciBkeDJwID0gTWF0aC5hYnModGhpcy5HZXREeChidG1QdDIuUHQsIHAuUHQpKTtcbiAgICBwID0gYnRtUHQyLk5leHQ7XG4gICAgd2hpbGUgKChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHAuUHQsIGJ0bVB0Mi5QdCkpICYmIChwICE9IGJ0bVB0MikpXG4gICAgICBwID0gcC5OZXh0O1xuICAgIHZhciBkeDJuID0gTWF0aC5hYnModGhpcy5HZXREeChidG1QdDIuUHQsIHAuUHQpKTtcbiAgICByZXR1cm4gKGR4MXAgPj0gZHgycCAmJiBkeDFwID49IGR4Mm4pIHx8IChkeDFuID49IGR4MnAgJiYgZHgxbiA+PSBkeDJuKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5HZXRCb3R0b21QdCA9IGZ1bmN0aW9uIChwcClcbiAge1xuICAgIHZhciBkdXBzID0gbnVsbDtcbiAgICB2YXIgcCA9IHBwLk5leHQ7XG4gICAgd2hpbGUgKHAgIT0gcHApXG4gICAge1xuICAgICAgaWYgKHAuUHQuWSA+IHBwLlB0LlkpXG4gICAgICB7XG4gICAgICAgIHBwID0gcDtcbiAgICAgICAgZHVwcyA9IG51bGw7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChwLlB0LlkgPT0gcHAuUHQuWSAmJiBwLlB0LlggPD0gcHAuUHQuWClcbiAgICAgIHtcbiAgICAgICAgaWYgKHAuUHQuWCA8IHBwLlB0LlgpXG4gICAgICAgIHtcbiAgICAgICAgICBkdXBzID0gbnVsbDtcbiAgICAgICAgICBwcCA9IHA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgaWYgKHAuTmV4dCAhPSBwcCAmJiBwLlByZXYgIT0gcHApXG4gICAgICAgICAgICBkdXBzID0gcDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcCA9IHAuTmV4dDtcbiAgICB9XG4gICAgaWYgKGR1cHMgIT09IG51bGwpXG4gICAge1xuICAgICAgLy90aGVyZSBhcHBlYXJzIHRvIGJlIGF0IGxlYXN0IDIgdmVydGljZXMgYXQgYm90dG9tUHQgc28gLi4uXG4gICAgICB3aGlsZSAoZHVwcyAhPSBwKVxuICAgICAge1xuICAgICAgICBpZiAoIXRoaXMuRmlyc3RJc0JvdHRvbVB0KHAsIGR1cHMpKVxuICAgICAgICAgIHBwID0gZHVwcztcbiAgICAgICAgZHVwcyA9IGR1cHMuTmV4dDtcbiAgICAgICAgd2hpbGUgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfSW5lcXVhbGl0eShkdXBzLlB0LCBwcC5QdCkpXG4gICAgICAgICAgZHVwcyA9IGR1cHMuTmV4dDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHBwO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkdldExvd2VybW9zdFJlYyA9IGZ1bmN0aW9uIChvdXRSZWMxLCBvdXRSZWMyKVxuICB7XG4gICAgLy93b3JrIG91dCB3aGljaCBwb2x5Z29uIGZyYWdtZW50IGhhcyB0aGUgY29ycmVjdCBob2xlIHN0YXRlIC4uLlxuICAgIGlmIChvdXRSZWMxLkJvdHRvbVB0ID09PSBudWxsKVxuICAgICAgb3V0UmVjMS5Cb3R0b21QdCA9IHRoaXMuR2V0Qm90dG9tUHQob3V0UmVjMS5QdHMpO1xuICAgIGlmIChvdXRSZWMyLkJvdHRvbVB0ID09PSBudWxsKVxuICAgICAgb3V0UmVjMi5Cb3R0b21QdCA9IHRoaXMuR2V0Qm90dG9tUHQob3V0UmVjMi5QdHMpO1xuICAgIHZhciBiUHQxID0gb3V0UmVjMS5Cb3R0b21QdDtcbiAgICB2YXIgYlB0MiA9IG91dFJlYzIuQm90dG9tUHQ7XG4gICAgaWYgKGJQdDEuUHQuWSA+IGJQdDIuUHQuWSlcbiAgICAgIHJldHVybiBvdXRSZWMxO1xuICAgIGVsc2UgaWYgKGJQdDEuUHQuWSA8IGJQdDIuUHQuWSlcbiAgICAgIHJldHVybiBvdXRSZWMyO1xuICAgIGVsc2UgaWYgKGJQdDEuUHQuWCA8IGJQdDIuUHQuWClcbiAgICAgIHJldHVybiBvdXRSZWMxO1xuICAgIGVsc2UgaWYgKGJQdDEuUHQuWCA+IGJQdDIuUHQuWClcbiAgICAgIHJldHVybiBvdXRSZWMyO1xuICAgIGVsc2UgaWYgKGJQdDEuTmV4dCA9PSBiUHQxKVxuICAgICAgcmV0dXJuIG91dFJlYzI7XG4gICAgZWxzZSBpZiAoYlB0Mi5OZXh0ID09IGJQdDIpXG4gICAgICByZXR1cm4gb3V0UmVjMTtcbiAgICBlbHNlIGlmICh0aGlzLkZpcnN0SXNCb3R0b21QdChiUHQxLCBiUHQyKSlcbiAgICAgIHJldHVybiBvdXRSZWMxO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBvdXRSZWMyO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlBhcmFtMVJpZ2h0T2ZQYXJhbTIgPSBmdW5jdGlvbiAob3V0UmVjMSwgb3V0UmVjMilcbiAge1xuICAgIGRvIHtcbiAgICAgIG91dFJlYzEgPSBvdXRSZWMxLkZpcnN0TGVmdDtcbiAgICAgIGlmIChvdXRSZWMxID09IG91dFJlYzIpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICB3aGlsZSAob3V0UmVjMSAhPT0gbnVsbClcbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuR2V0T3V0UmVjID0gZnVuY3Rpb24gKGlkeClcbiAge1xuICAgIHZhciBvdXRyZWMgPSB0aGlzLm1fUG9seU91dHNbaWR4XTtcbiAgICB3aGlsZSAob3V0cmVjICE9IHRoaXMubV9Qb2x5T3V0c1tvdXRyZWMuSWR4XSlcbiAgICAgIG91dHJlYyA9IHRoaXMubV9Qb2x5T3V0c1tvdXRyZWMuSWR4XTtcbiAgICByZXR1cm4gb3V0cmVjO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkFwcGVuZFBvbHlnb24gPSBmdW5jdGlvbiAoZTEsIGUyKVxuICB7XG4gICAgLy9nZXQgdGhlIHN0YXJ0IGFuZCBlbmRzIG9mIGJvdGggb3V0cHV0IHBvbHlnb25zIC4uLlxuICAgIHZhciBvdXRSZWMxID0gdGhpcy5tX1BvbHlPdXRzW2UxLk91dElkeF07XG4gICAgdmFyIG91dFJlYzIgPSB0aGlzLm1fUG9seU91dHNbZTIuT3V0SWR4XTtcbiAgICB2YXIgaG9sZVN0YXRlUmVjO1xuICAgIGlmICh0aGlzLlBhcmFtMVJpZ2h0T2ZQYXJhbTIob3V0UmVjMSwgb3V0UmVjMikpXG4gICAgICBob2xlU3RhdGVSZWMgPSBvdXRSZWMyO1xuICAgIGVsc2UgaWYgKHRoaXMuUGFyYW0xUmlnaHRPZlBhcmFtMihvdXRSZWMyLCBvdXRSZWMxKSlcbiAgICAgIGhvbGVTdGF0ZVJlYyA9IG91dFJlYzE7XG4gICAgZWxzZVxuICAgICAgaG9sZVN0YXRlUmVjID0gdGhpcy5HZXRMb3dlcm1vc3RSZWMob3V0UmVjMSwgb3V0UmVjMik7XG4gICAgdmFyIHAxX2xmdCA9IG91dFJlYzEuUHRzO1xuICAgIHZhciBwMV9ydCA9IHAxX2xmdC5QcmV2O1xuICAgIHZhciBwMl9sZnQgPSBvdXRSZWMyLlB0cztcbiAgICB2YXIgcDJfcnQgPSBwMl9sZnQuUHJldjtcbiAgICB2YXIgc2lkZTtcbiAgICAvL2pvaW4gZTIgcG9seSBvbnRvIGUxIHBvbHkgYW5kIGRlbGV0ZSBwb2ludGVycyB0byBlMiAuLi5cbiAgICBpZiAoZTEuU2lkZSA9PSBDbGlwcGVyTGliLkVkZ2VTaWRlLmVzTGVmdClcbiAgICB7XG4gICAgICBpZiAoZTIuU2lkZSA9PSBDbGlwcGVyTGliLkVkZ2VTaWRlLmVzTGVmdClcbiAgICAgIHtcbiAgICAgICAgLy96IHkgeCBhIGIgY1xuICAgICAgICB0aGlzLlJldmVyc2VQb2x5UHRMaW5rcyhwMl9sZnQpO1xuICAgICAgICBwMl9sZnQuTmV4dCA9IHAxX2xmdDtcbiAgICAgICAgcDFfbGZ0LlByZXYgPSBwMl9sZnQ7XG4gICAgICAgIHAxX3J0Lk5leHQgPSBwMl9ydDtcbiAgICAgICAgcDJfcnQuUHJldiA9IHAxX3J0O1xuICAgICAgICBvdXRSZWMxLlB0cyA9IHAyX3J0O1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICAvL3ggeSB6IGEgYiBjXG4gICAgICAgIHAyX3J0Lk5leHQgPSBwMV9sZnQ7XG4gICAgICAgIHAxX2xmdC5QcmV2ID0gcDJfcnQ7XG4gICAgICAgIHAyX2xmdC5QcmV2ID0gcDFfcnQ7XG4gICAgICAgIHAxX3J0Lk5leHQgPSBwMl9sZnQ7XG4gICAgICAgIG91dFJlYzEuUHRzID0gcDJfbGZ0O1xuICAgICAgfVxuICAgICAgc2lkZSA9IENsaXBwZXJMaWIuRWRnZVNpZGUuZXNMZWZ0O1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgaWYgKGUyLlNpZGUgPT0gQ2xpcHBlckxpYi5FZGdlU2lkZS5lc1JpZ2h0KVxuICAgICAge1xuICAgICAgICAvL2EgYiBjIHogeSB4XG4gICAgICAgIHRoaXMuUmV2ZXJzZVBvbHlQdExpbmtzKHAyX2xmdCk7XG4gICAgICAgIHAxX3J0Lk5leHQgPSBwMl9ydDtcbiAgICAgICAgcDJfcnQuUHJldiA9IHAxX3J0O1xuICAgICAgICBwMl9sZnQuTmV4dCA9IHAxX2xmdDtcbiAgICAgICAgcDFfbGZ0LlByZXYgPSBwMl9sZnQ7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIC8vYSBiIGMgeCB5IHpcbiAgICAgICAgcDFfcnQuTmV4dCA9IHAyX2xmdDtcbiAgICAgICAgcDJfbGZ0LlByZXYgPSBwMV9ydDtcbiAgICAgICAgcDFfbGZ0LlByZXYgPSBwMl9ydDtcbiAgICAgICAgcDJfcnQuTmV4dCA9IHAxX2xmdDtcbiAgICAgIH1cbiAgICAgIHNpZGUgPSBDbGlwcGVyTGliLkVkZ2VTaWRlLmVzUmlnaHQ7XG4gICAgfVxuICAgIG91dFJlYzEuQm90dG9tUHQgPSBudWxsO1xuICAgIGlmIChob2xlU3RhdGVSZWMgPT0gb3V0UmVjMilcbiAgICB7XG4gICAgICBpZiAob3V0UmVjMi5GaXJzdExlZnQgIT0gb3V0UmVjMSlcbiAgICAgICAgb3V0UmVjMS5GaXJzdExlZnQgPSBvdXRSZWMyLkZpcnN0TGVmdDtcbiAgICAgIG91dFJlYzEuSXNIb2xlID0gb3V0UmVjMi5Jc0hvbGU7XG4gICAgfVxuICAgIG91dFJlYzIuUHRzID0gbnVsbDtcbiAgICBvdXRSZWMyLkJvdHRvbVB0ID0gbnVsbDtcbiAgICBvdXRSZWMyLkZpcnN0TGVmdCA9IG91dFJlYzE7XG4gICAgdmFyIE9LSWR4ID0gZTEuT3V0SWR4O1xuICAgIHZhciBPYnNvbGV0ZUlkeCA9IGUyLk91dElkeDtcbiAgICBlMS5PdXRJZHggPSAtMTtcbiAgICAvL25iOiBzYWZlIGJlY2F1c2Ugd2Ugb25seSBnZXQgaGVyZSB2aWEgQWRkTG9jYWxNYXhQb2x5XG4gICAgZTIuT3V0SWR4ID0gLTE7XG4gICAgdmFyIGUgPSB0aGlzLm1fQWN0aXZlRWRnZXM7XG4gICAgd2hpbGUgKGUgIT09IG51bGwpXG4gICAge1xuICAgICAgaWYgKGUuT3V0SWR4ID09IE9ic29sZXRlSWR4KVxuICAgICAge1xuICAgICAgICBlLk91dElkeCA9IE9LSWR4O1xuICAgICAgICBlLlNpZGUgPSBzaWRlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGUgPSBlLk5leHRJbkFFTDtcbiAgICB9XG4gICAgb3V0UmVjMi5JZHggPSBvdXRSZWMxLklkeDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5SZXZlcnNlUG9seVB0TGlua3MgPSBmdW5jdGlvbiAocHApXG4gIHtcbiAgICBpZiAocHAgPT09IG51bGwpXG4gICAgICByZXR1cm47XG4gICAgdmFyIHBwMTtcbiAgICB2YXIgcHAyO1xuICAgIHBwMSA9IHBwO1xuICAgIGRvIHtcbiAgICAgIHBwMiA9IHBwMS5OZXh0O1xuICAgICAgcHAxLk5leHQgPSBwcDEuUHJldjtcbiAgICAgIHBwMS5QcmV2ID0gcHAyO1xuICAgICAgcHAxID0gcHAyO1xuICAgIH1cbiAgICB3aGlsZSAocHAxICE9IHBwKVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuU3dhcFNpZGVzID0gZnVuY3Rpb24gKGVkZ2UxLCBlZGdlMilcbiAge1xuICAgIHZhciBzaWRlID0gZWRnZTEuU2lkZTtcbiAgICBlZGdlMS5TaWRlID0gZWRnZTIuU2lkZTtcbiAgICBlZGdlMi5TaWRlID0gc2lkZTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLlN3YXBQb2x5SW5kZXhlcyA9IGZ1bmN0aW9uIChlZGdlMSwgZWRnZTIpXG4gIHtcbiAgICB2YXIgb3V0SWR4ID0gZWRnZTEuT3V0SWR4O1xuICAgIGVkZ2UxLk91dElkeCA9IGVkZ2UyLk91dElkeDtcbiAgICBlZGdlMi5PdXRJZHggPSBvdXRJZHg7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuSW50ZXJzZWN0RWRnZXMgPSBmdW5jdGlvbiAoZTEsIGUyLCBwdClcbiAge1xuICAgIC8vZTEgd2lsbCBiZSB0byB0aGUgbGVmdCBvZiBlMiBCRUxPVyB0aGUgaW50ZXJzZWN0aW9uLiBUaGVyZWZvcmUgZTEgaXMgYmVmb3JlXG4gICAgLy9lMiBpbiBBRUwgZXhjZXB0IHdoZW4gZTEgaXMgYmVpbmcgaW5zZXJ0ZWQgYXQgdGhlIGludGVyc2VjdGlvbiBwb2ludCAuLi5cbiAgICB2YXIgZTFDb250cmlidXRpbmcgPSAoZTEuT3V0SWR4ID49IDApO1xuICAgIHZhciBlMkNvbnRyaWJ1dGluZyA9IChlMi5PdXRJZHggPj0gMCk7XG5cbiAgICBpZiAodXNlX3h5eilcbiAgICBcdHRoaXMuU2V0WihwdCwgZTEsIGUyKTtcblxuICAgIGlmICh1c2VfbGluZXMpXG4gICAge1xuICAgICAgLy9pZiBlaXRoZXIgZWRnZSBpcyBvbiBhbiBPUEVOIHBhdGggLi4uXG4gICAgICBpZiAoZTEuV2luZERlbHRhID09PSAwIHx8IGUyLldpbmREZWx0YSA9PT0gMClcbiAgICAgIHtcbiAgICAgICAgLy9pZ25vcmUgc3ViamVjdC1zdWJqZWN0IG9wZW4gcGF0aCBpbnRlcnNlY3Rpb25zIFVOTEVTUyB0aGV5XG4gICAgICAgIC8vYXJlIGJvdGggb3BlbiBwYXRocywgQU5EIHRoZXkgYXJlIGJvdGggJ2NvbnRyaWJ1dGluZyBtYXhpbWFzJyAuLi5cblx0XHRcdFx0aWYgKGUxLldpbmREZWx0YSA9PSAwICYmIGUyLldpbmREZWx0YSA9PSAwKSByZXR1cm47XG4gICAgICAgIC8vaWYgaW50ZXJzZWN0aW5nIGEgc3ViaiBsaW5lIHdpdGggYSBzdWJqIHBvbHkgLi4uXG4gICAgICAgIGVsc2UgaWYgKGUxLlBvbHlUeXAgPT0gZTIuUG9seVR5cCAmJlxuICAgICAgICAgIGUxLldpbmREZWx0YSAhPSBlMi5XaW5kRGVsdGEgJiYgdGhpcy5tX0NsaXBUeXBlID09IENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RVbmlvbilcbiAgICAgICAge1xuICAgICAgICAgIGlmIChlMS5XaW5kRGVsdGEgPT09IDApXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWYgKGUyQ29udHJpYnV0aW5nKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB0aGlzLkFkZE91dFB0KGUxLCBwdCk7XG4gICAgICAgICAgICAgIGlmIChlMUNvbnRyaWJ1dGluZylcbiAgICAgICAgICAgICAgICBlMS5PdXRJZHggPSAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGlmIChlMUNvbnRyaWJ1dGluZylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdGhpcy5BZGRPdXRQdChlMiwgcHQpO1xuICAgICAgICAgICAgICBpZiAoZTJDb250cmlidXRpbmcpXG4gICAgICAgICAgICAgICAgZTIuT3V0SWR4ID0gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGUxLlBvbHlUeXAgIT0gZTIuUG9seVR5cClcbiAgICAgICAge1xuICAgICAgICAgIGlmICgoZTEuV2luZERlbHRhID09PSAwKSAmJiBNYXRoLmFicyhlMi5XaW5kQ250KSA9PSAxICYmXG4gICAgICAgICAgICAodGhpcy5tX0NsaXBUeXBlICE9IENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RVbmlvbiB8fCBlMi5XaW5kQ250MiA9PT0gMCkpXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5BZGRPdXRQdChlMSwgcHQpO1xuICAgICAgICAgICAgaWYgKGUxQ29udHJpYnV0aW5nKVxuICAgICAgICAgICAgICBlMS5PdXRJZHggPSAtMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoKGUyLldpbmREZWx0YSA9PT0gMCkgJiYgKE1hdGguYWJzKGUxLldpbmRDbnQpID09IDEpICYmXG4gICAgICAgICAgICAodGhpcy5tX0NsaXBUeXBlICE9IENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RVbmlvbiB8fCBlMS5XaW5kQ250MiA9PT0gMCkpXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5BZGRPdXRQdChlMiwgcHQpO1xuICAgICAgICAgICAgaWYgKGUyQ29udHJpYnV0aW5nKVxuICAgICAgICAgICAgICBlMi5PdXRJZHggPSAtMTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICAvL3VwZGF0ZSB3aW5kaW5nIGNvdW50cy4uLlxuICAgIC8vYXNzdW1lcyB0aGF0IGUxIHdpbGwgYmUgdG8gdGhlIFJpZ2h0IG9mIGUyIEFCT1ZFIHRoZSBpbnRlcnNlY3Rpb25cbiAgICBpZiAoZTEuUG9seVR5cCA9PSBlMi5Qb2x5VHlwKVxuICAgIHtcbiAgICAgIGlmICh0aGlzLklzRXZlbk9kZEZpbGxUeXBlKGUxKSlcbiAgICAgIHtcbiAgICAgICAgdmFyIG9sZEUxV2luZENudCA9IGUxLldpbmRDbnQ7XG4gICAgICAgIGUxLldpbmRDbnQgPSBlMi5XaW5kQ250O1xuICAgICAgICBlMi5XaW5kQ250ID0gb2xkRTFXaW5kQ250O1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICBpZiAoZTEuV2luZENudCArIGUyLldpbmREZWx0YSA9PT0gMClcbiAgICAgICAgICBlMS5XaW5kQ250ID0gLWUxLldpbmRDbnQ7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBlMS5XaW5kQ250ICs9IGUyLldpbmREZWx0YTtcbiAgICAgICAgaWYgKGUyLldpbmRDbnQgLSBlMS5XaW5kRGVsdGEgPT09IDApXG4gICAgICAgICAgZTIuV2luZENudCA9IC1lMi5XaW5kQ250O1xuICAgICAgICBlbHNlXG4gICAgICAgICAgZTIuV2luZENudCAtPSBlMS5XaW5kRGVsdGE7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBpZiAoIXRoaXMuSXNFdmVuT2RkRmlsbFR5cGUoZTIpKVxuICAgICAgICBlMS5XaW5kQ250MiArPSBlMi5XaW5kRGVsdGE7XG4gICAgICBlbHNlXG4gICAgICAgIGUxLldpbmRDbnQyID0gKGUxLldpbmRDbnQyID09PSAwKSA/IDEgOiAwO1xuICAgICAgaWYgKCF0aGlzLklzRXZlbk9kZEZpbGxUeXBlKGUxKSlcbiAgICAgICAgZTIuV2luZENudDIgLT0gZTEuV2luZERlbHRhO1xuICAgICAgZWxzZVxuICAgICAgICBlMi5XaW5kQ250MiA9IChlMi5XaW5kQ250MiA9PT0gMCkgPyAxIDogMDtcbiAgICB9XG4gICAgdmFyIGUxRmlsbFR5cGUsIGUyRmlsbFR5cGUsIGUxRmlsbFR5cGUyLCBlMkZpbGxUeXBlMjtcbiAgICBpZiAoZTEuUG9seVR5cCA9PSBDbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdClcbiAgICB7XG4gICAgICBlMUZpbGxUeXBlID0gdGhpcy5tX1N1YmpGaWxsVHlwZTtcbiAgICAgIGUxRmlsbFR5cGUyID0gdGhpcy5tX0NsaXBGaWxsVHlwZTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIGUxRmlsbFR5cGUgPSB0aGlzLm1fQ2xpcEZpbGxUeXBlO1xuICAgICAgZTFGaWxsVHlwZTIgPSB0aGlzLm1fU3ViakZpbGxUeXBlO1xuICAgIH1cbiAgICBpZiAoZTIuUG9seVR5cCA9PSBDbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdClcbiAgICB7XG4gICAgICBlMkZpbGxUeXBlID0gdGhpcy5tX1N1YmpGaWxsVHlwZTtcbiAgICAgIGUyRmlsbFR5cGUyID0gdGhpcy5tX0NsaXBGaWxsVHlwZTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIGUyRmlsbFR5cGUgPSB0aGlzLm1fQ2xpcEZpbGxUeXBlO1xuICAgICAgZTJGaWxsVHlwZTIgPSB0aGlzLm1fU3ViakZpbGxUeXBlO1xuICAgIH1cbiAgICB2YXIgZTFXYywgZTJXYztcbiAgICBzd2l0Y2ggKGUxRmlsbFR5cGUpXG4gICAge1xuICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0UG9zaXRpdmU6XG4gICAgICBlMVdjID0gZTEuV2luZENudDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0TmVnYXRpdmU6XG4gICAgICBlMVdjID0gLWUxLldpbmRDbnQ7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgZTFXYyA9IE1hdGguYWJzKGUxLldpbmRDbnQpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHN3aXRjaCAoZTJGaWxsVHlwZSlcbiAgICB7XG4gICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRQb3NpdGl2ZTpcbiAgICAgIGUyV2MgPSBlMi5XaW5kQ250O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROZWdhdGl2ZTpcbiAgICAgIGUyV2MgPSAtZTIuV2luZENudDtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBlMldjID0gTWF0aC5hYnMoZTIuV2luZENudCk7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKGUxQ29udHJpYnV0aW5nICYmIGUyQ29udHJpYnV0aW5nKVxuICAgIHtcblx0XHRcdGlmICgoZTFXYyAhPSAwICYmIGUxV2MgIT0gMSkgfHwgKGUyV2MgIT0gMCAmJiBlMldjICE9IDEpIHx8XG5cdFx0XHQoZTEuUG9seVR5cCAhPSBlMi5Qb2x5VHlwICYmIHRoaXMubV9DbGlwVHlwZSAhPSBDbGlwcGVyTGliLkNsaXBUeXBlLmN0WG9yKSlcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5BZGRMb2NhbE1heFBvbHkoZTEsIGUyLCBwdCk7XG5cdFx0XHR9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIHRoaXMuQWRkT3V0UHQoZTEsIHB0KTtcbiAgICAgICAgdGhpcy5BZGRPdXRQdChlMiwgcHQpO1xuICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXIuU3dhcFNpZGVzKGUxLCBlMik7XG4gICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlci5Td2FwUG9seUluZGV4ZXMoZTEsIGUyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoZTFDb250cmlidXRpbmcpXG4gICAge1xuICAgICAgaWYgKGUyV2MgPT09IDAgfHwgZTJXYyA9PSAxKVxuICAgICAge1xuICAgICAgICB0aGlzLkFkZE91dFB0KGUxLCBwdCk7XG4gICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlci5Td2FwU2lkZXMoZTEsIGUyKTtcbiAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyLlN3YXBQb2x5SW5kZXhlcyhlMSwgZTIpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChlMkNvbnRyaWJ1dGluZylcbiAgICB7XG4gICAgICBpZiAoZTFXYyA9PT0gMCB8fCBlMVdjID09IDEpXG4gICAgICB7XG4gICAgICAgIHRoaXMuQWRkT3V0UHQoZTIsIHB0KTtcbiAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyLlN3YXBTaWRlcyhlMSwgZTIpO1xuICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXIuU3dhcFBvbHlJbmRleGVzKGUxLCBlMik7XG4gICAgICB9XG4gICAgfVxuXHRcdGVsc2UgaWYgKCAoZTFXYyA9PSAwIHx8IGUxV2MgPT0gMSkgJiYgKGUyV2MgPT0gMCB8fCBlMldjID09IDEpKVxuICAgIHtcbiAgICAgIC8vbmVpdGhlciBlZGdlIGlzIGN1cnJlbnRseSBjb250cmlidXRpbmcgLi4uXG4gICAgICB2YXIgZTFXYzIsIGUyV2MyO1xuICAgICAgc3dpdGNoIChlMUZpbGxUeXBlMilcbiAgICAgIHtcbiAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0UG9zaXRpdmU6XG4gICAgICAgIGUxV2MyID0gZTEuV2luZENudDI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROZWdhdGl2ZTpcbiAgICAgICAgZTFXYzIgPSAtZTEuV2luZENudDI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgZTFXYzIgPSBNYXRoLmFicyhlMS5XaW5kQ250Mik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChlMkZpbGxUeXBlMilcbiAgICAgIHtcbiAgICAgIGNhc2UgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0UG9zaXRpdmU6XG4gICAgICAgIGUyV2MyID0gZTIuV2luZENudDI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROZWdhdGl2ZTpcbiAgICAgICAgZTJXYzIgPSAtZTIuV2luZENudDI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgZTJXYzIgPSBNYXRoLmFicyhlMi5XaW5kQ250Mik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKGUxLlBvbHlUeXAgIT0gZTIuUG9seVR5cClcbiAgICAgIHtcbiAgICAgICAgdGhpcy5BZGRMb2NhbE1pblBvbHkoZTEsIGUyLCBwdCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChlMVdjID09IDEgJiYgZTJXYyA9PSAxKVxuICAgICAgICBzd2l0Y2ggKHRoaXMubV9DbGlwVHlwZSlcbiAgICAgICAge1xuICAgICAgICBjYXNlIENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RJbnRlcnNlY3Rpb246XG4gICAgICAgICAgaWYgKGUxV2MyID4gMCAmJiBlMldjMiA+IDApXG4gICAgICAgICAgICB0aGlzLkFkZExvY2FsTWluUG9seShlMSwgZTIsIHB0KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDbGlwcGVyTGliLkNsaXBUeXBlLmN0VW5pb246XG4gICAgICAgICAgaWYgKGUxV2MyIDw9IDAgJiYgZTJXYzIgPD0gMClcbiAgICAgICAgICAgIHRoaXMuQWRkTG9jYWxNaW5Qb2x5KGUxLCBlMiwgcHQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENsaXBwZXJMaWIuQ2xpcFR5cGUuY3REaWZmZXJlbmNlOlxuICAgICAgICAgIGlmICgoKGUxLlBvbHlUeXAgPT0gQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdENsaXApICYmIChlMVdjMiA+IDApICYmIChlMldjMiA+IDApKSB8fFxuICAgICAgICAgICAgKChlMS5Qb2x5VHlwID09IENsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0KSAmJiAoZTFXYzIgPD0gMCkgJiYgKGUyV2MyIDw9IDApKSlcbiAgICAgICAgICAgIHRoaXMuQWRkTG9jYWxNaW5Qb2x5KGUxLCBlMiwgcHQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RYb3I6XG4gICAgICAgICAgdGhpcy5BZGRMb2NhbE1pblBvbHkoZTEsIGUyLCBwdCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyLlN3YXBTaWRlcyhlMSwgZTIpO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5EZWxldGVGcm9tQUVMID0gZnVuY3Rpb24gKGUpXG4gIHtcbiAgICB2YXIgQWVsUHJldiA9IGUuUHJldkluQUVMO1xuICAgIHZhciBBZWxOZXh0ID0gZS5OZXh0SW5BRUw7XG4gICAgaWYgKEFlbFByZXYgPT09IG51bGwgJiYgQWVsTmV4dCA9PT0gbnVsbCAmJiAoZSAhPSB0aGlzLm1fQWN0aXZlRWRnZXMpKVxuICAgICAgcmV0dXJuO1xuICAgIC8vYWxyZWFkeSBkZWxldGVkXG4gICAgaWYgKEFlbFByZXYgIT09IG51bGwpXG4gICAgICBBZWxQcmV2Lk5leHRJbkFFTCA9IEFlbE5leHQ7XG4gICAgZWxzZVxuICAgICAgdGhpcy5tX0FjdGl2ZUVkZ2VzID0gQWVsTmV4dDtcbiAgICBpZiAoQWVsTmV4dCAhPT0gbnVsbClcbiAgICAgIEFlbE5leHQuUHJldkluQUVMID0gQWVsUHJldjtcbiAgICBlLk5leHRJbkFFTCA9IG51bGw7XG4gICAgZS5QcmV2SW5BRUwgPSBudWxsO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkRlbGV0ZUZyb21TRUwgPSBmdW5jdGlvbiAoZSlcbiAge1xuICAgIHZhciBTZWxQcmV2ID0gZS5QcmV2SW5TRUw7XG4gICAgdmFyIFNlbE5leHQgPSBlLk5leHRJblNFTDtcbiAgICBpZiAoU2VsUHJldiA9PT0gbnVsbCAmJiBTZWxOZXh0ID09PSBudWxsICYmIChlICE9IHRoaXMubV9Tb3J0ZWRFZGdlcykpXG4gICAgICByZXR1cm47XG4gICAgLy9hbHJlYWR5IGRlbGV0ZWRcbiAgICBpZiAoU2VsUHJldiAhPT0gbnVsbClcbiAgICAgIFNlbFByZXYuTmV4dEluU0VMID0gU2VsTmV4dDtcbiAgICBlbHNlXG4gICAgICB0aGlzLm1fU29ydGVkRWRnZXMgPSBTZWxOZXh0O1xuICAgIGlmIChTZWxOZXh0ICE9PSBudWxsKVxuICAgICAgU2VsTmV4dC5QcmV2SW5TRUwgPSBTZWxQcmV2O1xuICAgIGUuTmV4dEluU0VMID0gbnVsbDtcbiAgICBlLlByZXZJblNFTCA9IG51bGw7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuVXBkYXRlRWRnZUludG9BRUwgPSBmdW5jdGlvbiAoZSlcbiAge1xuICAgIGlmIChlLk5leHRJbkxNTCA9PT0gbnVsbClcbiAgICAgIENsaXBwZXJMaWIuRXJyb3IoXCJVcGRhdGVFZGdlSW50b0FFTDogaW52YWxpZCBjYWxsXCIpO1xuICAgIHZhciBBZWxQcmV2ID0gZS5QcmV2SW5BRUw7XG4gICAgdmFyIEFlbE5leHQgPSBlLk5leHRJbkFFTDtcbiAgICBlLk5leHRJbkxNTC5PdXRJZHggPSBlLk91dElkeDtcbiAgICBpZiAoQWVsUHJldiAhPT0gbnVsbClcbiAgICAgIEFlbFByZXYuTmV4dEluQUVMID0gZS5OZXh0SW5MTUw7XG4gICAgZWxzZVxuICAgICAgdGhpcy5tX0FjdGl2ZUVkZ2VzID0gZS5OZXh0SW5MTUw7XG4gICAgaWYgKEFlbE5leHQgIT09IG51bGwpXG4gICAgICBBZWxOZXh0LlByZXZJbkFFTCA9IGUuTmV4dEluTE1MO1xuICAgIGUuTmV4dEluTE1MLlNpZGUgPSBlLlNpZGU7XG4gICAgZS5OZXh0SW5MTUwuV2luZERlbHRhID0gZS5XaW5kRGVsdGE7XG4gICAgZS5OZXh0SW5MTUwuV2luZENudCA9IGUuV2luZENudDtcbiAgICBlLk5leHRJbkxNTC5XaW5kQ250MiA9IGUuV2luZENudDI7XG4gICAgZSA9IGUuTmV4dEluTE1MO1xuICAgIC8vICAgIGUuQ3VyciA9IGUuQm90O1xuICAgIGUuQ3Vyci5YID0gZS5Cb3QuWDtcbiAgICBlLkN1cnIuWSA9IGUuQm90Llk7XG4gICAgZS5QcmV2SW5BRUwgPSBBZWxQcmV2O1xuICAgIGUuTmV4dEluQUVMID0gQWVsTmV4dDtcbiAgICBpZiAoIUNsaXBwZXJMaWIuQ2xpcHBlckJhc2UuSXNIb3Jpem9udGFsKGUpKVxuICAgICAgdGhpcy5JbnNlcnRTY2FuYmVhbShlLlRvcC5ZKTtcbiAgICByZXR1cm4gZTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Qcm9jZXNzSG9yaXpvbnRhbHMgPSBmdW5jdGlvbiAoaXNUb3BPZlNjYW5iZWFtKVxuICB7XG4gICAgdmFyIGhvcnpFZGdlID0gdGhpcy5tX1NvcnRlZEVkZ2VzO1xuICAgIHdoaWxlIChob3J6RWRnZSAhPT0gbnVsbClcbiAgICB7XG4gICAgICB0aGlzLkRlbGV0ZUZyb21TRUwoaG9yekVkZ2UpO1xuICAgICAgdGhpcy5Qcm9jZXNzSG9yaXpvbnRhbChob3J6RWRnZSwgaXNUb3BPZlNjYW5iZWFtKTtcbiAgICAgIGhvcnpFZGdlID0gdGhpcy5tX1NvcnRlZEVkZ2VzO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5HZXRIb3J6RGlyZWN0aW9uID0gZnVuY3Rpb24gKEhvcnpFZGdlLCAkdmFyKVxuICB7XG4gICAgaWYgKEhvcnpFZGdlLkJvdC5YIDwgSG9yekVkZ2UuVG9wLlgpXG4gICAge1xuICAgICAgICAkdmFyLkxlZnQgPSBIb3J6RWRnZS5Cb3QuWDtcbiAgICAgICAgJHZhci5SaWdodCA9IEhvcnpFZGdlLlRvcC5YO1xuICAgICAgICAkdmFyLkRpciA9IENsaXBwZXJMaWIuRGlyZWN0aW9uLmRMZWZ0VG9SaWdodDtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgJHZhci5MZWZ0ID0gSG9yekVkZ2UuVG9wLlg7XG4gICAgICAgICR2YXIuUmlnaHQgPSBIb3J6RWRnZS5Cb3QuWDtcbiAgICAgICAgJHZhci5EaXIgPSBDbGlwcGVyTGliLkRpcmVjdGlvbi5kUmlnaHRUb0xlZnQ7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlByb2Nlc3NIb3Jpem9udGFsID0gZnVuY3Rpb24gKGhvcnpFZGdlLCBpc1RvcE9mU2NhbmJlYW0pXG4gIHtcbiAgICB2YXIgJHZhciA9IHtEaXI6IG51bGwsIExlZnQ6IG51bGwsIFJpZ2h0OiBudWxsfTtcbiAgICB0aGlzLkdldEhvcnpEaXJlY3Rpb24oaG9yekVkZ2UsICR2YXIpO1xuICAgIHZhciBkaXIgPSAkdmFyLkRpcjtcbiAgICB2YXIgaG9yekxlZnQgPSAkdmFyLkxlZnQ7XG4gICAgdmFyIGhvcnpSaWdodCA9ICR2YXIuUmlnaHQ7XG5cbiAgICB2YXIgZUxhc3RIb3J6ID0gaG9yekVkZ2UsXG4gICAgICBlTWF4UGFpciA9IG51bGw7XG4gICAgd2hpbGUgKGVMYXN0SG9yei5OZXh0SW5MTUwgIT09IG51bGwgJiYgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Jc0hvcml6b250YWwoZUxhc3RIb3J6Lk5leHRJbkxNTCkpXG4gICAgICBlTGFzdEhvcnogPSBlTGFzdEhvcnouTmV4dEluTE1MO1xuICAgIGlmIChlTGFzdEhvcnouTmV4dEluTE1MID09PSBudWxsKVxuICAgICAgZU1heFBhaXIgPSB0aGlzLkdldE1heGltYVBhaXIoZUxhc3RIb3J6KTtcbiAgICBmb3IgKDs7KVxuICAgIHtcbiAgICAgIHZhciBJc0xhc3RIb3J6ID0gKGhvcnpFZGdlID09IGVMYXN0SG9yeik7XG4gICAgICB2YXIgZSA9IHRoaXMuR2V0TmV4dEluQUVMKGhvcnpFZGdlLCBkaXIpO1xuICAgICAgd2hpbGUgKGUgIT09IG51bGwpXG4gICAgICB7XG4gICAgICAgIC8vQnJlYWsgaWYgd2UndmUgZ290IHRvIHRoZSBlbmQgb2YgYW4gaW50ZXJtZWRpYXRlIGhvcml6b250YWwgZWRnZSAuLi5cbiAgICAgICAgLy9uYjogU21hbGxlciBEeCdzIGFyZSB0byB0aGUgcmlnaHQgb2YgbGFyZ2VyIER4J3MgQUJPVkUgdGhlIGhvcml6b250YWwuXG4gICAgICAgIGlmIChlLkN1cnIuWCA9PSBob3J6RWRnZS5Ub3AuWCAmJiBob3J6RWRnZS5OZXh0SW5MTUwgIT09IG51bGwgJiYgZS5EeCA8IGhvcnpFZGdlLk5leHRJbkxNTC5EeClcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgdmFyIGVOZXh0ID0gdGhpcy5HZXROZXh0SW5BRUwoZSwgZGlyKTtcbiAgICAgICAgLy9zYXZlcyBlTmV4dCBmb3IgbGF0ZXJcbiAgICAgICAgaWYgKChkaXIgPT0gQ2xpcHBlckxpYi5EaXJlY3Rpb24uZExlZnRUb1JpZ2h0ICYmIGUuQ3Vyci5YIDw9IGhvcnpSaWdodCkgfHwgKGRpciA9PSBDbGlwcGVyTGliLkRpcmVjdGlvbi5kUmlnaHRUb0xlZnQgJiYgZS5DdXJyLlggPj0gaG9yekxlZnQpKVxuICAgICAgICB7XG4gICAgICAgICAgLy9zbyBmYXIgd2UncmUgc3RpbGwgaW4gcmFuZ2Ugb2YgdGhlIGhvcml6b250YWwgRWRnZSAgYnV0IG1ha2Ugc3VyZVxuICAgICAgICAgIC8vd2UncmUgYXQgdGhlIGxhc3Qgb2YgY29uc2VjLiBob3Jpem9udGFscyB3aGVuIG1hdGNoaW5nIHdpdGggZU1heFBhaXJcbiAgICAgICAgICBpZiAoZSA9PSBlTWF4UGFpciAmJiBJc0xhc3RIb3J6KVxuICAgICAgICAgIHtcblx0XHRcdFx0XHRcdGlmIChob3J6RWRnZS5PdXRJZHggPj0gMClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0dmFyIG9wMSA9IHRoaXMuQWRkT3V0UHQoaG9yekVkZ2UsIGhvcnpFZGdlLlRvcCk7XG5cdFx0XHRcdFx0XHRcdHZhciBlTmV4dEhvcnogPSB0aGlzLm1fU29ydGVkRWRnZXM7XG5cdFx0XHRcdFx0XHRcdHdoaWxlIChlTmV4dEhvcnogIT09IG51bGwpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRpZiAoZU5leHRIb3J6Lk91dElkeCA+PSAwICYmXG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLkhvcnpTZWdtZW50c092ZXJsYXAoaG9yekVkZ2UuQm90LlgsXG5cdFx0XHRcdFx0XHRcdFx0XHRob3J6RWRnZS5Ub3AuWCwgZU5leHRIb3J6LkJvdC5YLCBlTmV4dEhvcnouVG9wLlgpKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdHZhciBvcDIgPSB0aGlzLkFkZE91dFB0KGVOZXh0SG9yeiwgZU5leHRIb3J6LkJvdCk7XG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLkFkZEpvaW4ob3AyLCBvcDEsIGVOZXh0SG9yei5Ub3ApO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRlTmV4dEhvcnogPSBlTmV4dEhvcnouTmV4dEluU0VMO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHRoaXMuQWRkR2hvc3RKb2luKG9wMSwgaG9yekVkZ2UuQm90KTtcblx0XHRcdFx0XHRcdFx0dGhpcy5BZGRMb2NhbE1heFBvbHkoaG9yekVkZ2UsIGVNYXhQYWlyLCBob3J6RWRnZS5Ub3ApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0dGhpcy5EZWxldGVGcm9tQUVMKGhvcnpFZGdlKTtcblx0XHRcdFx0XHRcdHRoaXMuRGVsZXRlRnJvbUFFTChlTWF4UGFpcik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKGRpciA9PSBDbGlwcGVyTGliLkRpcmVjdGlvbi5kTGVmdFRvUmlnaHQpXG4gICAgICAgICAge1xuICAgICAgICAgICAgdmFyIFB0ID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQoZS5DdXJyLlgsIGhvcnpFZGdlLkN1cnIuWSk7XG4gICAgICAgICAgICB0aGlzLkludGVyc2VjdEVkZ2VzKGhvcnpFZGdlLCBlLCBQdCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2YXIgUHQgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChlLkN1cnIuWCwgaG9yekVkZ2UuQ3Vyci5ZKTtcbiAgICAgICAgICAgIHRoaXMuSW50ZXJzZWN0RWRnZXMoZSwgaG9yekVkZ2UsIFB0KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5Td2FwUG9zaXRpb25zSW5BRUwoaG9yekVkZ2UsIGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKChkaXIgPT0gQ2xpcHBlckxpYi5EaXJlY3Rpb24uZExlZnRUb1JpZ2h0ICYmIGUuQ3Vyci5YID49IGhvcnpSaWdodCkgfHwgKGRpciA9PSBDbGlwcGVyTGliLkRpcmVjdGlvbi5kUmlnaHRUb0xlZnQgJiYgZS5DdXJyLlggPD0gaG9yekxlZnQpKVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBlID0gZU5leHQ7XG4gICAgICB9XG4gICAgICAvL2VuZCB3aGlsZVxuICAgICAgaWYgKGhvcnpFZGdlLk5leHRJbkxNTCAhPT0gbnVsbCAmJiBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLklzSG9yaXpvbnRhbChob3J6RWRnZS5OZXh0SW5MTUwpKVxuICAgICAge1xuICAgICAgICBob3J6RWRnZSA9IHRoaXMuVXBkYXRlRWRnZUludG9BRUwoaG9yekVkZ2UpO1xuICAgICAgICBpZiAoaG9yekVkZ2UuT3V0SWR4ID49IDApXG4gICAgICAgICAgdGhpcy5BZGRPdXRQdChob3J6RWRnZSwgaG9yekVkZ2UuQm90KTtcblxuICAgICAgICAgIHZhciAkdmFyID0ge0RpcjogZGlyLCBMZWZ0OiBob3J6TGVmdCwgUmlnaHQ6IGhvcnpSaWdodH07XG4gICAgICAgICAgdGhpcy5HZXRIb3J6RGlyZWN0aW9uKGhvcnpFZGdlLCAkdmFyKTtcbiAgICAgICAgICBkaXIgPSAkdmFyLkRpcjtcbiAgICAgICAgICBob3J6TGVmdCA9ICR2YXIuTGVmdDtcbiAgICAgICAgICBob3J6UmlnaHQgPSAkdmFyLlJpZ2h0O1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgLy9lbmQgZm9yICg7OylcbiAgICBpZiAoaG9yekVkZ2UuTmV4dEluTE1MICE9PSBudWxsKVxuICAgIHtcbiAgICAgIGlmIChob3J6RWRnZS5PdXRJZHggPj0gMClcbiAgICAgIHtcbiAgICAgICAgdmFyIG9wMSA9IHRoaXMuQWRkT3V0UHQoaG9yekVkZ2UsIGhvcnpFZGdlLlRvcCk7XG5cdFx0XHRcdGlmIChpc1RvcE9mU2NhbmJlYW0pIHRoaXMuQWRkR2hvc3RKb2luKG9wMSwgaG9yekVkZ2UuQm90KTtcbiAgICAgICAgaG9yekVkZ2UgPSB0aGlzLlVwZGF0ZUVkZ2VJbnRvQUVMKGhvcnpFZGdlKTtcbiAgICAgICAgaWYgKGhvcnpFZGdlLldpbmREZWx0YSA9PT0gMClcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIC8vbmI6IEhvcnpFZGdlIGlzIG5vIGxvbmdlciBob3Jpem9udGFsIGhlcmVcbiAgICAgICAgdmFyIGVQcmV2ID0gaG9yekVkZ2UuUHJldkluQUVMO1xuICAgICAgICB2YXIgZU5leHQgPSBob3J6RWRnZS5OZXh0SW5BRUw7XG4gICAgICAgIGlmIChlUHJldiAhPT0gbnVsbCAmJiBlUHJldi5DdXJyLlggPT0gaG9yekVkZ2UuQm90LlggJiZcbiAgICAgICAgICBlUHJldi5DdXJyLlkgPT0gaG9yekVkZ2UuQm90LlkgJiYgZVByZXYuV2luZERlbHRhICE9PSAwICYmXG4gICAgICAgICAgKGVQcmV2Lk91dElkeCA+PSAwICYmIGVQcmV2LkN1cnIuWSA+IGVQcmV2LlRvcC5ZICYmXG4gICAgICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNsb3Blc0VxdWFsKGhvcnpFZGdlLCBlUHJldiwgdGhpcy5tX1VzZUZ1bGxSYW5nZSkpKVxuICAgICAgICB7XG4gICAgICAgICAgdmFyIG9wMiA9IHRoaXMuQWRkT3V0UHQoZVByZXYsIGhvcnpFZGdlLkJvdCk7XG4gICAgICAgICAgdGhpcy5BZGRKb2luKG9wMSwgb3AyLCBob3J6RWRnZS5Ub3ApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGVOZXh0ICE9PSBudWxsICYmIGVOZXh0LkN1cnIuWCA9PSBob3J6RWRnZS5Cb3QuWCAmJlxuICAgICAgICAgIGVOZXh0LkN1cnIuWSA9PSBob3J6RWRnZS5Cb3QuWSAmJiBlTmV4dC5XaW5kRGVsdGEgIT09IDAgJiZcbiAgICAgICAgICBlTmV4dC5PdXRJZHggPj0gMCAmJiBlTmV4dC5DdXJyLlkgPiBlTmV4dC5Ub3AuWSAmJlxuICAgICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2xvcGVzRXF1YWwoaG9yekVkZ2UsIGVOZXh0LCB0aGlzLm1fVXNlRnVsbFJhbmdlKSlcbiAgICAgICAge1xuICAgICAgICAgIHZhciBvcDIgPSB0aGlzLkFkZE91dFB0KGVOZXh0LCBob3J6RWRnZS5Cb3QpO1xuICAgICAgICAgIHRoaXMuQWRkSm9pbihvcDEsIG9wMiwgaG9yekVkZ2UuVG9wKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBob3J6RWRnZSA9IHRoaXMuVXBkYXRlRWRnZUludG9BRUwoaG9yekVkZ2UpO1xuICAgIH1cbiAgXHRlbHNlXG4gICAge1xuICAgICAgaWYgKGhvcnpFZGdlLk91dElkeCA+PSAwKVxuICAgICAgICB0aGlzLkFkZE91dFB0KGhvcnpFZGdlLCBob3J6RWRnZS5Ub3ApO1xuICAgICAgdGhpcy5EZWxldGVGcm9tQUVMKGhvcnpFZGdlKTtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuR2V0TmV4dEluQUVMID0gZnVuY3Rpb24gKGUsIERpcmVjdGlvbilcbiAge1xuICAgIHJldHVybiBEaXJlY3Rpb24gPT0gQ2xpcHBlckxpYi5EaXJlY3Rpb24uZExlZnRUb1JpZ2h0ID8gZS5OZXh0SW5BRUwgOiBlLlByZXZJbkFFTDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Jc01pbmltYSA9IGZ1bmN0aW9uIChlKVxuICB7XG4gICAgcmV0dXJuIGUgIT09IG51bGwgJiYgKGUuUHJldi5OZXh0SW5MTUwgIT0gZSkgJiYgKGUuTmV4dC5OZXh0SW5MTUwgIT0gZSk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuSXNNYXhpbWEgPSBmdW5jdGlvbiAoZSwgWSlcbiAge1xuICAgIHJldHVybiAoZSAhPT0gbnVsbCAmJiBlLlRvcC5ZID09IFkgJiYgZS5OZXh0SW5MTUwgPT09IG51bGwpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLklzSW50ZXJtZWRpYXRlID0gZnVuY3Rpb24gKGUsIFkpXG4gIHtcbiAgICByZXR1cm4gKGUuVG9wLlkgPT0gWSAmJiBlLk5leHRJbkxNTCAhPT0gbnVsbCk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuR2V0TWF4aW1hUGFpciA9IGZ1bmN0aW9uIChlKVxuICB7XG4gICAgdmFyIHJlc3VsdCA9IG51bGw7XG4gICAgaWYgKChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KGUuTmV4dC5Ub3AsIGUuVG9wKSkgJiYgZS5OZXh0Lk5leHRJbkxNTCA9PT0gbnVsbClcbiAgICAgIHJlc3VsdCA9IGUuTmV4dDtcbiAgICBlbHNlIGlmICgoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShlLlByZXYuVG9wLCBlLlRvcCkpICYmIGUuUHJldi5OZXh0SW5MTUwgPT09IG51bGwpXG4gICAgICByZXN1bHQgPSBlLlByZXY7XG4gICAgaWYgKHJlc3VsdCAhPT0gbnVsbCAmJiAocmVzdWx0Lk91dElkeCA9PSAtMiB8fCAocmVzdWx0Lk5leHRJbkFFTCA9PSByZXN1bHQuUHJldkluQUVMICYmICFDbGlwcGVyTGliLkNsaXBwZXJCYXNlLklzSG9yaXpvbnRhbChyZXN1bHQpKSkpXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuUHJvY2Vzc0ludGVyc2VjdGlvbnMgPSBmdW5jdGlvbiAodG9wWSlcbiAge1xuICAgIGlmICh0aGlzLm1fQWN0aXZlRWRnZXMgPT0gbnVsbClcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIHRyeVxuICAgIHtcbiAgICAgIHRoaXMuQnVpbGRJbnRlcnNlY3RMaXN0KHRvcFkpO1xuICAgICAgaWYgKHRoaXMubV9JbnRlcnNlY3RMaXN0Lmxlbmd0aCA9PSAwKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGlmICh0aGlzLm1fSW50ZXJzZWN0TGlzdC5sZW5ndGggPT0gMSB8fCB0aGlzLkZpeHVwSW50ZXJzZWN0aW9uT3JkZXIoKSlcbiAgICAgICAgdGhpcy5Qcm9jZXNzSW50ZXJzZWN0TGlzdCgpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNhdGNoICgkJGUyKVxuICAgIHtcbiAgICAgIHRoaXMubV9Tb3J0ZWRFZGdlcyA9IG51bGw7XG4gICAgICB0aGlzLm1fSW50ZXJzZWN0TGlzdC5sZW5ndGggPSAwO1xuICAgICAgQ2xpcHBlckxpYi5FcnJvcihcIlByb2Nlc3NJbnRlcnNlY3Rpb25zIGVycm9yXCIpO1xuICAgIH1cbiAgICB0aGlzLm1fU29ydGVkRWRnZXMgPSBudWxsO1xuICAgIHJldHVybiB0cnVlO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkJ1aWxkSW50ZXJzZWN0TGlzdCA9IGZ1bmN0aW9uICh0b3BZKVxuICB7XG4gICAgaWYgKHRoaXMubV9BY3RpdmVFZGdlcyA9PT0gbnVsbClcbiAgICAgIHJldHVybjtcbiAgICAvL3ByZXBhcmUgZm9yIHNvcnRpbmcgLi4uXG4gICAgdmFyIGUgPSB0aGlzLm1fQWN0aXZlRWRnZXM7XG4gICAgLy9jb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShKU09OLmRlY3ljbGUoIGUgKSkpO1xuICAgIHRoaXMubV9Tb3J0ZWRFZGdlcyA9IGU7XG4gICAgd2hpbGUgKGUgIT09IG51bGwpXG4gICAge1xuICAgICAgZS5QcmV2SW5TRUwgPSBlLlByZXZJbkFFTDtcbiAgICAgIGUuTmV4dEluU0VMID0gZS5OZXh0SW5BRUw7XG4gICAgICBlLkN1cnIuWCA9IENsaXBwZXJMaWIuQ2xpcHBlci5Ub3BYKGUsIHRvcFkpO1xuICAgICAgZSA9IGUuTmV4dEluQUVMO1xuICAgIH1cbiAgICAvL2J1YmJsZXNvcnQgLi4uXG4gICAgdmFyIGlzTW9kaWZpZWQgPSB0cnVlO1xuICAgIHdoaWxlIChpc01vZGlmaWVkICYmIHRoaXMubV9Tb3J0ZWRFZGdlcyAhPT0gbnVsbClcbiAgICB7XG4gICAgICBpc01vZGlmaWVkID0gZmFsc2U7XG4gICAgICBlID0gdGhpcy5tX1NvcnRlZEVkZ2VzO1xuICAgICAgd2hpbGUgKGUuTmV4dEluU0VMICE9PSBudWxsKVxuICAgICAge1xuICAgICAgICB2YXIgZU5leHQgPSBlLk5leHRJblNFTDtcbiAgICAgICAgdmFyIHB0ID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQoKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcImUuQ3Vyci5YOiBcIiArIGUuQ3Vyci5YICsgXCIgZU5leHQuQ3Vyci5YXCIgKyBlTmV4dC5DdXJyLlgpO1xuICAgICAgICBpZiAoZS5DdXJyLlggPiBlTmV4dC5DdXJyLlgpXG4gICAgICAgIHtcblx0XHRcdFx0XHR0aGlzLkludGVyc2VjdFBvaW50KGUsIGVOZXh0LCBwdCk7XG4gICAgICAgICAgdmFyIG5ld05vZGUgPSBuZXcgQ2xpcHBlckxpYi5JbnRlcnNlY3ROb2RlKCk7XG4gICAgICAgICAgbmV3Tm9kZS5FZGdlMSA9IGU7XG4gICAgICAgICAgbmV3Tm9kZS5FZGdlMiA9IGVOZXh0O1xuICAgICAgICAgIC8vbmV3Tm9kZS5QdCA9IHB0O1xuICAgICAgICAgIG5ld05vZGUuUHQuWCA9IHB0Llg7XG4gICAgICAgICAgbmV3Tm9kZS5QdC5ZID0gcHQuWTtcbiAgICAgICAgICB0aGlzLm1fSW50ZXJzZWN0TGlzdC5wdXNoKG5ld05vZGUpO1xuICAgICAgICAgIHRoaXMuU3dhcFBvc2l0aW9uc0luU0VMKGUsIGVOZXh0KTtcbiAgICAgICAgICBpc01vZGlmaWVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgZSA9IGVOZXh0O1xuICAgICAgfVxuICAgICAgaWYgKGUuUHJldkluU0VMICE9PSBudWxsKVxuICAgICAgICBlLlByZXZJblNFTC5OZXh0SW5TRUwgPSBudWxsO1xuICAgICAgZWxzZVxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgdGhpcy5tX1NvcnRlZEVkZ2VzID0gbnVsbDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5FZGdlc0FkamFjZW50ID0gZnVuY3Rpb24gKGlub2RlKVxuICB7XG4gICAgcmV0dXJuIChpbm9kZS5FZGdlMS5OZXh0SW5TRUwgPT0gaW5vZGUuRWRnZTIpIHx8IChpbm9kZS5FZGdlMS5QcmV2SW5TRUwgPT0gaW5vZGUuRWRnZTIpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuSW50ZXJzZWN0Tm9kZVNvcnQgPSBmdW5jdGlvbiAobm9kZTEsIG5vZGUyKVxuICB7XG4gICAgLy90aGUgZm9sbG93aW5nIHR5cGVjYXN0IGlzIHNhZmUgYmVjYXVzZSB0aGUgZGlmZmVyZW5jZXMgaW4gUHQuWSB3aWxsXG4gICAgLy9iZSBsaW1pdGVkIHRvIHRoZSBoZWlnaHQgb2YgdGhlIHNjYW5iZWFtLlxuICAgIHJldHVybiAobm9kZTIuUHQuWSAtIG5vZGUxLlB0LlkpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkZpeHVwSW50ZXJzZWN0aW9uT3JkZXIgPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgLy9wcmUtY29uZGl0aW9uOiBpbnRlcnNlY3Rpb25zIGFyZSBzb3J0ZWQgYm90dG9tLW1vc3QgZmlyc3QuXG4gICAgLy9Ob3cgaXQncyBjcnVjaWFsIHRoYXQgaW50ZXJzZWN0aW9ucyBhcmUgbWFkZSBvbmx5IGJldHdlZW4gYWRqYWNlbnQgZWRnZXMsXG4gICAgLy9zbyB0byBlbnN1cmUgdGhpcyB0aGUgb3JkZXIgb2YgaW50ZXJzZWN0aW9ucyBtYXkgbmVlZCBhZGp1c3RpbmcgLi4uXG4gICAgdGhpcy5tX0ludGVyc2VjdExpc3Quc29ydCh0aGlzLm1fSW50ZXJzZWN0Tm9kZUNvbXBhcmVyKTtcbiAgICB0aGlzLkNvcHlBRUxUb1NFTCgpO1xuICAgIHZhciBjbnQgPSB0aGlzLm1fSW50ZXJzZWN0TGlzdC5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbnQ7IGkrKylcbiAgICB7XG4gICAgICBpZiAoIXRoaXMuRWRnZXNBZGphY2VudCh0aGlzLm1fSW50ZXJzZWN0TGlzdFtpXSkpXG4gICAgICB7XG4gICAgICAgIHZhciBqID0gaSArIDE7XG4gICAgICAgIHdoaWxlIChqIDwgY250ICYmICF0aGlzLkVkZ2VzQWRqYWNlbnQodGhpcy5tX0ludGVyc2VjdExpc3Rbal0pKVxuICAgICAgICAgIGorKztcbiAgICAgICAgaWYgKGogPT0gY250KVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgdmFyIHRtcCA9IHRoaXMubV9JbnRlcnNlY3RMaXN0W2ldO1xuICAgICAgICB0aGlzLm1fSW50ZXJzZWN0TGlzdFtpXSA9IHRoaXMubV9JbnRlcnNlY3RMaXN0W2pdO1xuICAgICAgICB0aGlzLm1fSW50ZXJzZWN0TGlzdFtqXSA9IHRtcDtcbiAgICAgIH1cbiAgICAgIHRoaXMuU3dhcFBvc2l0aW9uc0luU0VMKHRoaXMubV9JbnRlcnNlY3RMaXN0W2ldLkVkZ2UxLCB0aGlzLm1fSW50ZXJzZWN0TGlzdFtpXS5FZGdlMik7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlByb2Nlc3NJbnRlcnNlY3RMaXN0ID0gZnVuY3Rpb24gKClcbiAge1xuICAgIGZvciAodmFyIGkgPSAwLCBpbGVuID0gdGhpcy5tX0ludGVyc2VjdExpc3QubGVuZ3RoOyBpIDwgaWxlbjsgaSsrKVxuICAgIHtcbiAgICAgIHZhciBpTm9kZSA9IHRoaXMubV9JbnRlcnNlY3RMaXN0W2ldO1xuICAgICAgdGhpcy5JbnRlcnNlY3RFZGdlcyhpTm9kZS5FZGdlMSwgaU5vZGUuRWRnZTIsIGlOb2RlLlB0KTtcbiAgICAgIHRoaXMuU3dhcFBvc2l0aW9uc0luQUVMKGlOb2RlLkVkZ2UxLCBpTm9kZS5FZGdlMik7XG4gICAgfVxuICAgIHRoaXMubV9JbnRlcnNlY3RMaXN0Lmxlbmd0aCA9IDA7XG4gIH07XG4gIC8qXG4gIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFJvdW5kIHNwZWVkdGVzdDogaHR0cDovL2pzcGVyZi5jb20vZmFzdGVzdC1yb3VuZFxuICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAqL1xuICB2YXIgUjEgPSBmdW5jdGlvbiAoYSlcbiAge1xuICAgIHJldHVybiBhIDwgMCA/IE1hdGguY2VpbChhIC0gMC41KSA6IE1hdGgucm91bmQoYSlcbiAgfTtcbiAgdmFyIFIyID0gZnVuY3Rpb24gKGEpXG4gIHtcbiAgICByZXR1cm4gYSA8IDAgPyBNYXRoLmNlaWwoYSAtIDAuNSkgOiBNYXRoLmZsb29yKGEgKyAwLjUpXG4gIH07XG4gIHZhciBSMyA9IGZ1bmN0aW9uIChhKVxuICB7XG4gICAgcmV0dXJuIGEgPCAwID8gLU1hdGgucm91bmQoTWF0aC5hYnMoYSkpIDogTWF0aC5yb3VuZChhKVxuICB9O1xuICB2YXIgUjQgPSBmdW5jdGlvbiAoYSlcbiAge1xuICAgIGlmIChhIDwgMClcbiAgICB7XG4gICAgICBhIC09IDAuNTtcbiAgICAgIHJldHVybiBhIDwgLTIxNDc0ODM2NDggPyBNYXRoLmNlaWwoYSkgOiBhIHwgMDtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIGEgKz0gMC41O1xuICAgICAgcmV0dXJuIGEgPiAyMTQ3NDgzNjQ3ID8gTWF0aC5mbG9vcihhKSA6IGEgfCAwO1xuICAgIH1cbiAgfTtcbiAgaWYgKGJyb3dzZXIubXNpZSkgQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kID0gUjE7XG4gIGVsc2UgaWYgKGJyb3dzZXIuY2hyb21pdW0pIENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZCA9IFIzO1xuICBlbHNlIGlmIChicm93c2VyLnNhZmFyaSkgQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kID0gUjQ7XG4gIGVsc2UgQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kID0gUjI7IC8vIGVnLiBicm93c2VyLmNocm9tZSB8fCBicm93c2VyLmZpcmVmb3ggfHwgYnJvd3Nlci5vcGVyYVxuICBDbGlwcGVyTGliLkNsaXBwZXIuVG9wWCA9IGZ1bmN0aW9uIChlZGdlLCBjdXJyZW50WSlcbiAge1xuICAgIC8vaWYgKGVkZ2UuQm90ID09IGVkZ2UuQ3VycikgYWxlcnQgKFwiZWRnZS5Cb3QgPSBlZGdlLkN1cnJcIik7XG4gICAgLy9pZiAoZWRnZS5Cb3QgPT0gZWRnZS5Ub3ApIGFsZXJ0IChcImVkZ2UuQm90ID0gZWRnZS5Ub3BcIik7XG4gICAgaWYgKGN1cnJlbnRZID09IGVkZ2UuVG9wLlkpXG4gICAgICByZXR1cm4gZWRnZS5Ub3AuWDtcbiAgICByZXR1cm4gZWRnZS5Cb3QuWCArIENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZChlZGdlLkR4ICogKGN1cnJlbnRZIC0gZWRnZS5Cb3QuWSkpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkludGVyc2VjdFBvaW50ID0gZnVuY3Rpb24gKGVkZ2UxLCBlZGdlMiwgaXApXG4gIHtcbiAgICBpcC5YID0gMDtcbiAgICBpcC5ZID0gMDtcbiAgICB2YXIgYjEsIGIyO1xuICAgIC8vbmI6IHdpdGggdmVyeSBsYXJnZSBjb29yZGluYXRlIHZhbHVlcywgaXQncyBwb3NzaWJsZSBmb3IgU2xvcGVzRXF1YWwoKSB0b1xuICAgIC8vcmV0dXJuIGZhbHNlIGJ1dCBmb3IgdGhlIGVkZ2UuRHggdmFsdWUgYmUgZXF1YWwgZHVlIHRvIGRvdWJsZSBwcmVjaXNpb24gcm91bmRpbmcuXG4gICAgaWYgKGVkZ2UxLkR4ID09IGVkZ2UyLkR4KVxuXHRcdHtcblx0XHRcdGlwLlkgPSBlZGdlMS5DdXJyLlk7XG5cdFx0XHRpcC5YID0gQ2xpcHBlckxpYi5DbGlwcGVyLlRvcFgoZWRnZTEsIGlwLlkpO1xuXHRcdFx0cmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZWRnZTEuRGVsdGEuWCA9PT0gMClcbiAgICB7XG4gICAgICBpcC5YID0gZWRnZTEuQm90Llg7XG4gICAgICBpZiAoQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5Jc0hvcml6b250YWwoZWRnZTIpKVxuICAgICAge1xuICAgICAgICBpcC5ZID0gZWRnZTIuQm90Llk7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgIGIyID0gZWRnZTIuQm90LlkgLSAoZWRnZTIuQm90LlggLyBlZGdlMi5EeCk7XG4gICAgICAgIGlwLlkgPSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQoaXAuWCAvIGVkZ2UyLkR4ICsgYjIpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChlZGdlMi5EZWx0YS5YID09PSAwKVxuICAgIHtcbiAgICAgIGlwLlggPSBlZGdlMi5Cb3QuWDtcbiAgICAgIGlmIChDbGlwcGVyTGliLkNsaXBwZXJCYXNlLklzSG9yaXpvbnRhbChlZGdlMSkpXG4gICAgICB7XG4gICAgICAgIGlwLlkgPSBlZGdlMS5Cb3QuWTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgYjEgPSBlZGdlMS5Cb3QuWSAtIChlZGdlMS5Cb3QuWCAvIGVkZ2UxLkR4KTtcbiAgICAgICAgaXAuWSA9IENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZChpcC5YIC8gZWRnZTEuRHggKyBiMSk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBiMSA9IGVkZ2UxLkJvdC5YIC0gZWRnZTEuQm90LlkgKiBlZGdlMS5EeDtcbiAgICAgIGIyID0gZWRnZTIuQm90LlggLSBlZGdlMi5Cb3QuWSAqIGVkZ2UyLkR4O1xuICAgICAgdmFyIHEgPSAoYjIgLSBiMSkgLyAoZWRnZTEuRHggLSBlZGdlMi5EeCk7XG4gICAgICBpcC5ZID0gQ2xpcHBlckxpYi5DbGlwcGVyLlJvdW5kKHEpO1xuICAgICAgaWYgKE1hdGguYWJzKGVkZ2UxLkR4KSA8IE1hdGguYWJzKGVkZ2UyLkR4KSlcbiAgICAgICAgaXAuWCA9IENsaXBwZXJMaWIuQ2xpcHBlci5Sb3VuZChlZGdlMS5EeCAqIHEgKyBiMSk7XG4gICAgICBlbHNlXG4gICAgICAgIGlwLlggPSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQoZWRnZTIuRHggKiBxICsgYjIpO1xuICAgIH1cbiAgICBpZiAoaXAuWSA8IGVkZ2UxLlRvcC5ZIHx8IGlwLlkgPCBlZGdlMi5Ub3AuWSlcbiAgICB7XG4gICAgICBpZiAoZWRnZTEuVG9wLlkgPiBlZGdlMi5Ub3AuWSlcbiAgICAgIHtcbiAgICAgICAgaXAuWSA9IGVkZ2UxLlRvcC5ZO1xuICAgICAgICBpcC5YID0gQ2xpcHBlckxpYi5DbGlwcGVyLlRvcFgoZWRnZTIsIGVkZ2UxLlRvcC5ZKTtcbiAgICAgICAgcmV0dXJuIGlwLlggPCBlZGdlMS5Ub3AuWDtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgICAgaXAuWSA9IGVkZ2UyLlRvcC5ZO1xuICAgICAgaWYgKE1hdGguYWJzKGVkZ2UxLkR4KSA8IE1hdGguYWJzKGVkZ2UyLkR4KSlcbiAgICAgICAgaXAuWCA9IENsaXBwZXJMaWIuQ2xpcHBlci5Ub3BYKGVkZ2UxLCBpcC5ZKTtcbiAgICAgIGVsc2VcbiAgICAgICAgaXAuWCA9IENsaXBwZXJMaWIuQ2xpcHBlci5Ub3BYKGVkZ2UyLCBpcC5ZKTtcbiAgICB9XG5cdFx0Ly9maW5hbGx5LCBkb24ndCBhbGxvdyAnaXAnIHRvIGJlIEJFTE9XIGN1cnIuWSAoaWUgYm90dG9tIG9mIHNjYW5iZWFtKSAuLi5cblx0XHRpZiAoaXAuWSA+IGVkZ2UxLkN1cnIuWSlcblx0XHR7XG5cdFx0XHRpcC5ZID0gZWRnZTEuQ3Vyci5ZO1xuXHRcdFx0Ly9iZXR0ZXIgdG8gdXNlIHRoZSBtb3JlIHZlcnRpY2FsIGVkZ2UgdG8gZGVyaXZlIFggLi4uXG5cdFx0XHRpZiAoTWF0aC5hYnMoZWRnZTEuRHgpID4gTWF0aC5hYnMoZWRnZTIuRHgpKVxuXHRcdFx0XHRpcC5YID0gQ2xpcHBlckxpYi5DbGlwcGVyLlRvcFgoZWRnZTIsIGlwLlkpO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRpcC5YID0gQ2xpcHBlckxpYi5DbGlwcGVyLlRvcFgoZWRnZTEsIGlwLlkpO1xuXHRcdH1cbiAgfTtcblxuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlByb2Nlc3NFZGdlc0F0VG9wT2ZTY2FuYmVhbSA9IGZ1bmN0aW9uICh0b3BZKVxuICB7XG4gICAgdmFyIGUgPSB0aGlzLm1fQWN0aXZlRWRnZXM7XG4gICAgd2hpbGUgKGUgIT09IG51bGwpXG4gICAge1xuICAgICAgLy8xLiBwcm9jZXNzIG1heGltYSwgdHJlYXRpbmcgdGhlbSBhcyBpZiB0aGV5J3JlICdiZW50JyBob3Jpem9udGFsIGVkZ2VzLFxuICAgICAgLy8gICBidXQgZXhjbHVkZSBtYXhpbWEgd2l0aCBob3Jpem9udGFsIGVkZ2VzLiBuYjogZSBjYW4ndCBiZSBhIGhvcml6b250YWwuXG4gICAgICB2YXIgSXNNYXhpbWFFZGdlID0gdGhpcy5Jc01heGltYShlLCB0b3BZKTtcbiAgICAgIGlmIChJc01heGltYUVkZ2UpXG4gICAgICB7XG4gICAgICAgIHZhciBlTWF4UGFpciA9IHRoaXMuR2V0TWF4aW1hUGFpcihlKTtcbiAgICAgICAgSXNNYXhpbWFFZGdlID0gKGVNYXhQYWlyID09PSBudWxsIHx8ICFDbGlwcGVyTGliLkNsaXBwZXJCYXNlLklzSG9yaXpvbnRhbChlTWF4UGFpcikpO1xuICAgICAgfVxuICAgICAgaWYgKElzTWF4aW1hRWRnZSlcbiAgICAgIHtcbiAgICAgICAgdmFyIGVQcmV2ID0gZS5QcmV2SW5BRUw7XG4gICAgICAgIHRoaXMuRG9NYXhpbWEoZSk7XG4gICAgICAgIGlmIChlUHJldiA9PT0gbnVsbClcbiAgICAgICAgICBlID0gdGhpcy5tX0FjdGl2ZUVkZ2VzO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgZSA9IGVQcmV2Lk5leHRJbkFFTDtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgLy8yLiBwcm9tb3RlIGhvcml6b250YWwgZWRnZXMsIG90aGVyd2lzZSB1cGRhdGUgQ3Vyci5YIGFuZCBDdXJyLlkgLi4uXG4gICAgICAgIGlmICh0aGlzLklzSW50ZXJtZWRpYXRlKGUsIHRvcFkpICYmIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuSXNIb3Jpem9udGFsKGUuTmV4dEluTE1MKSlcbiAgICAgICAge1xuICAgICAgICAgIGUgPSB0aGlzLlVwZGF0ZUVkZ2VJbnRvQUVMKGUpO1xuICAgICAgICAgIGlmIChlLk91dElkeCA+PSAwKVxuICAgICAgICAgICAgdGhpcy5BZGRPdXRQdChlLCBlLkJvdCk7XG4gICAgICAgICAgdGhpcy5BZGRFZGdlVG9TRUwoZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgZS5DdXJyLlggPSBDbGlwcGVyTGliLkNsaXBwZXIuVG9wWChlLCB0b3BZKTtcbiAgICAgICAgICBlLkN1cnIuWSA9IHRvcFk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuU3RyaWN0bHlTaW1wbGUpXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgZVByZXYgPSBlLlByZXZJbkFFTDtcbiAgICAgICAgICBpZiAoKGUuT3V0SWR4ID49IDApICYmIChlLldpbmREZWx0YSAhPT0gMCkgJiYgZVByZXYgIT09IG51bGwgJiZcbiAgICAgICAgICAgIChlUHJldi5PdXRJZHggPj0gMCkgJiYgKGVQcmV2LkN1cnIuWCA9PSBlLkN1cnIuWCkgJiZcbiAgICAgICAgICAgIChlUHJldi5XaW5kRGVsdGEgIT09IDApKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgXHR2YXIgaXAgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChlLkN1cnIpO1xuXG5cdFx0XHRcdFx0XHRpZih1c2VfeHl6KVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHR0aGlzLlNldFooaXAsIGVQcmV2LCBlKTtcblx0XHRcdFx0XHRcdH1cblxuICAgICAgICAgICAgdmFyIG9wID0gdGhpcy5BZGRPdXRQdChlUHJldiwgaXApO1xuICAgICAgICAgICAgdmFyIG9wMiA9IHRoaXMuQWRkT3V0UHQoZSwgaXApO1xuICAgICAgICAgICAgdGhpcy5BZGRKb2luKG9wLCBvcDIsIGlwKTtcbiAgICAgICAgICAgIC8vU3RyaWN0bHlTaW1wbGUgKHR5cGUtMykgam9pblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlID0gZS5OZXh0SW5BRUw7XG4gICAgICB9XG4gICAgfVxuICAgIC8vMy4gUHJvY2VzcyBob3Jpem9udGFscyBhdCB0aGUgVG9wIG9mIHRoZSBzY2FuYmVhbSAuLi5cbiAgICB0aGlzLlByb2Nlc3NIb3Jpem9udGFscyh0cnVlKTtcbiAgICAvLzQuIFByb21vdGUgaW50ZXJtZWRpYXRlIHZlcnRpY2VzIC4uLlxuICAgIGUgPSB0aGlzLm1fQWN0aXZlRWRnZXM7XG4gICAgd2hpbGUgKGUgIT09IG51bGwpXG4gICAge1xuICAgICAgaWYgKHRoaXMuSXNJbnRlcm1lZGlhdGUoZSwgdG9wWSkpXG4gICAgICB7XG4gICAgICAgIHZhciBvcCA9IG51bGw7XG4gICAgICAgIGlmIChlLk91dElkeCA+PSAwKVxuICAgICAgICAgIG9wID0gdGhpcy5BZGRPdXRQdChlLCBlLlRvcCk7XG4gICAgICAgIGUgPSB0aGlzLlVwZGF0ZUVkZ2VJbnRvQUVMKGUpO1xuICAgICAgICAvL2lmIG91dHB1dCBwb2x5Z29ucyBzaGFyZSBhbiBlZGdlLCB0aGV5J2xsIG5lZWQgam9pbmluZyBsYXRlciAuLi5cbiAgICAgICAgdmFyIGVQcmV2ID0gZS5QcmV2SW5BRUw7XG4gICAgICAgIHZhciBlTmV4dCA9IGUuTmV4dEluQUVMO1xuICAgICAgICBpZiAoZVByZXYgIT09IG51bGwgJiYgZVByZXYuQ3Vyci5YID09IGUuQm90LlggJiZcbiAgICAgICAgICBlUHJldi5DdXJyLlkgPT0gZS5Cb3QuWSAmJiBvcCAhPT0gbnVsbCAmJlxuICAgICAgICAgIGVQcmV2Lk91dElkeCA+PSAwICYmIGVQcmV2LkN1cnIuWSA+IGVQcmV2LlRvcC5ZICYmXG4gICAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5TbG9wZXNFcXVhbChlLCBlUHJldiwgdGhpcy5tX1VzZUZ1bGxSYW5nZSkgJiZcbiAgICAgICAgICAoZS5XaW5kRGVsdGEgIT09IDApICYmIChlUHJldi5XaW5kRGVsdGEgIT09IDApKVxuICAgICAgICB7XG4gICAgICAgICAgdmFyIG9wMiA9IHRoaXMuQWRkT3V0UHQoZVByZXYsIGUuQm90KTtcbiAgICAgICAgICB0aGlzLkFkZEpvaW4ob3AsIG9wMiwgZS5Ub3ApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGVOZXh0ICE9PSBudWxsICYmIGVOZXh0LkN1cnIuWCA9PSBlLkJvdC5YICYmXG4gICAgICAgICAgZU5leHQuQ3Vyci5ZID09IGUuQm90LlkgJiYgb3AgIT09IG51bGwgJiZcbiAgICAgICAgICBlTmV4dC5PdXRJZHggPj0gMCAmJiBlTmV4dC5DdXJyLlkgPiBlTmV4dC5Ub3AuWSAmJlxuICAgICAgICAgIENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2xvcGVzRXF1YWwoZSwgZU5leHQsIHRoaXMubV9Vc2VGdWxsUmFuZ2UpICYmXG4gICAgICAgICAgKGUuV2luZERlbHRhICE9PSAwKSAmJiAoZU5leHQuV2luZERlbHRhICE9PSAwKSlcbiAgICAgICAge1xuICAgICAgICAgIHZhciBvcDIgPSB0aGlzLkFkZE91dFB0KGVOZXh0LCBlLkJvdCk7XG4gICAgICAgICAgdGhpcy5BZGRKb2luKG9wLCBvcDIsIGUuVG9wKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZSA9IGUuTmV4dEluQUVMO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Eb01heGltYSA9IGZ1bmN0aW9uIChlKVxuICB7XG4gICAgdmFyIGVNYXhQYWlyID0gdGhpcy5HZXRNYXhpbWFQYWlyKGUpO1xuICAgIGlmIChlTWF4UGFpciA9PT0gbnVsbClcbiAgICB7XG4gICAgICBpZiAoZS5PdXRJZHggPj0gMClcbiAgICAgICAgdGhpcy5BZGRPdXRQdChlLCBlLlRvcCk7XG4gICAgICB0aGlzLkRlbGV0ZUZyb21BRUwoZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBlTmV4dCA9IGUuTmV4dEluQUVMO1xuICAgIHZhciB1c2VfbGluZXMgPSB0cnVlO1xuICAgIHdoaWxlIChlTmV4dCAhPT0gbnVsbCAmJiBlTmV4dCAhPSBlTWF4UGFpcilcbiAgICB7XG4gICAgICB0aGlzLkludGVyc2VjdEVkZ2VzKGUsIGVOZXh0LCBlLlRvcCk7XG4gICAgICB0aGlzLlN3YXBQb3NpdGlvbnNJbkFFTChlLCBlTmV4dCk7XG4gICAgICBlTmV4dCA9IGUuTmV4dEluQUVMO1xuICAgIH1cbiAgICBpZiAoZS5PdXRJZHggPT0gLTEgJiYgZU1heFBhaXIuT3V0SWR4ID09IC0xKVxuICAgIHtcbiAgICAgIHRoaXMuRGVsZXRlRnJvbUFFTChlKTtcbiAgICAgIHRoaXMuRGVsZXRlRnJvbUFFTChlTWF4UGFpcik7XG4gICAgfVxuICAgIGVsc2UgaWYgKGUuT3V0SWR4ID49IDAgJiYgZU1heFBhaXIuT3V0SWR4ID49IDApXG4gICAge1xuICAgIFx0aWYgKGUuT3V0SWR4ID49IDApIHRoaXMuQWRkTG9jYWxNYXhQb2x5KGUsIGVNYXhQYWlyLCBlLlRvcCk7XG4gICAgICB0aGlzLkRlbGV0ZUZyb21BRUwoZSk7XG4gICAgICB0aGlzLkRlbGV0ZUZyb21BRUwoZU1heFBhaXIpO1xuICAgIH1cbiAgICBlbHNlIGlmICh1c2VfbGluZXMgJiYgZS5XaW5kRGVsdGEgPT09IDApXG4gICAge1xuICAgICAgaWYgKGUuT3V0SWR4ID49IDApXG4gICAgICB7XG4gICAgICAgIHRoaXMuQWRkT3V0UHQoZSwgZS5Ub3ApO1xuICAgICAgICBlLk91dElkeCA9IC0xO1xuICAgICAgfVxuICAgICAgdGhpcy5EZWxldGVGcm9tQUVMKGUpO1xuICAgICAgaWYgKGVNYXhQYWlyLk91dElkeCA+PSAwKVxuICAgICAge1xuICAgICAgICB0aGlzLkFkZE91dFB0KGVNYXhQYWlyLCBlLlRvcCk7XG4gICAgICAgIGVNYXhQYWlyLk91dElkeCA9IC0xO1xuICAgICAgfVxuICAgICAgdGhpcy5EZWxldGVGcm9tQUVMKGVNYXhQYWlyKTtcbiAgICB9XG4gICAgZWxzZVxuICAgICAgQ2xpcHBlckxpYi5FcnJvcihcIkRvTWF4aW1hIGVycm9yXCIpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuUmV2ZXJzZVBhdGhzID0gZnVuY3Rpb24gKHBvbHlzKVxuICB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHBvbHlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKVxuICAgICAgcG9seXNbaV0ucmV2ZXJzZSgpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuT3JpZW50YXRpb24gPSBmdW5jdGlvbiAocG9seSlcbiAge1xuICAgIHJldHVybiBDbGlwcGVyTGliLkNsaXBwZXIuQXJlYShwb2x5KSA+PSAwO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlBvaW50Q291bnQgPSBmdW5jdGlvbiAocHRzKVxuICB7XG4gICAgaWYgKHB0cyA9PT0gbnVsbClcbiAgICAgIHJldHVybiAwO1xuICAgIHZhciByZXN1bHQgPSAwO1xuICAgIHZhciBwID0gcHRzO1xuICAgIGRvIHtcbiAgICAgIHJlc3VsdCsrO1xuICAgICAgcCA9IHAuTmV4dDtcbiAgICB9XG4gICAgd2hpbGUgKHAgIT0gcHRzKVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuQnVpbGRSZXN1bHQgPSBmdW5jdGlvbiAocG9seWcpXG4gIHtcbiAgICBDbGlwcGVyTGliLkNsZWFyKHBvbHlnKTtcbiAgICBmb3IgKHZhciBpID0gMCwgaWxlbiA9IHRoaXMubV9Qb2x5T3V0cy5sZW5ndGg7IGkgPCBpbGVuOyBpKyspXG4gICAge1xuICAgICAgdmFyIG91dFJlYyA9IHRoaXMubV9Qb2x5T3V0c1tpXTtcbiAgICAgIGlmIChvdXRSZWMuUHRzID09PSBudWxsKVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIHZhciBwID0gb3V0UmVjLlB0cy5QcmV2O1xuICAgICAgdmFyIGNudCA9IHRoaXMuUG9pbnRDb3VudChwKTtcbiAgICAgIGlmIChjbnQgPCAyKVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIHZhciBwZyA9IG5ldyBBcnJheShjbnQpO1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjbnQ7IGorKylcbiAgICAgIHtcbiAgICAgICAgcGdbal0gPSBwLlB0O1xuICAgICAgICBwID0gcC5QcmV2O1xuICAgICAgfVxuICAgICAgcG9seWcucHVzaChwZyk7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkJ1aWxkUmVzdWx0MiA9IGZ1bmN0aW9uIChwb2x5dHJlZSlcbiAge1xuICAgIHBvbHl0cmVlLkNsZWFyKCk7XG4gICAgLy9hZGQgZWFjaCBvdXRwdXQgcG9seWdvbi9jb250b3VyIHRvIHBvbHl0cmVlIC4uLlxuICAgIC8vcG9seXRyZWUubV9BbGxQb2x5cy5zZXRfQ2FwYWNpdHkodGhpcy5tX1BvbHlPdXRzLmxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlsZW4gPSB0aGlzLm1fUG9seU91dHMubGVuZ3RoOyBpIDwgaWxlbjsgaSsrKVxuICAgIHtcbiAgICAgIHZhciBvdXRSZWMgPSB0aGlzLm1fUG9seU91dHNbaV07XG4gICAgICB2YXIgY250ID0gdGhpcy5Qb2ludENvdW50KG91dFJlYy5QdHMpO1xuICAgICAgaWYgKChvdXRSZWMuSXNPcGVuICYmIGNudCA8IDIpIHx8ICghb3V0UmVjLklzT3BlbiAmJiBjbnQgPCAzKSlcbiAgICAgICAgY29udGludWU7XG4gICAgICB0aGlzLkZpeEhvbGVMaW5rYWdlKG91dFJlYyk7XG4gICAgICB2YXIgcG4gPSBuZXcgQ2xpcHBlckxpYi5Qb2x5Tm9kZSgpO1xuICAgICAgcG9seXRyZWUubV9BbGxQb2x5cy5wdXNoKHBuKTtcbiAgICAgIG91dFJlYy5Qb2x5Tm9kZSA9IHBuO1xuICAgICAgcG4ubV9wb2x5Z29uLmxlbmd0aCA9IGNudDtcbiAgICAgIHZhciBvcCA9IG91dFJlYy5QdHMuUHJldjtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY250OyBqKyspXG4gICAgICB7XG4gICAgICAgIHBuLm1fcG9seWdvbltqXSA9IG9wLlB0O1xuICAgICAgICBvcCA9IG9wLlByZXY7XG4gICAgICB9XG4gICAgfVxuICAgIC8vZml4dXAgUG9seU5vZGUgbGlua3MgZXRjIC4uLlxuICAgIC8vcG9seXRyZWUubV9DaGlsZHMuc2V0X0NhcGFjaXR5KHRoaXMubV9Qb2x5T3V0cy5sZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBpbGVuID0gdGhpcy5tX1BvbHlPdXRzLmxlbmd0aDsgaSA8IGlsZW47IGkrKylcbiAgICB7XG4gICAgICB2YXIgb3V0UmVjID0gdGhpcy5tX1BvbHlPdXRzW2ldO1xuICAgICAgaWYgKG91dFJlYy5Qb2x5Tm9kZSA9PT0gbnVsbClcbiAgICAgICAgY29udGludWU7XG4gICAgICBlbHNlIGlmIChvdXRSZWMuSXNPcGVuKVxuICAgICAge1xuICAgICAgICBvdXRSZWMuUG9seU5vZGUuSXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgcG9seXRyZWUuQWRkQ2hpbGQob3V0UmVjLlBvbHlOb2RlKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG91dFJlYy5GaXJzdExlZnQgIT09IG51bGwgJiYgb3V0UmVjLkZpcnN0TGVmdC5Qb2x5Tm9kZSAhPSBudWxsKVxuICAgICAgICBvdXRSZWMuRmlyc3RMZWZ0LlBvbHlOb2RlLkFkZENoaWxkKG91dFJlYy5Qb2x5Tm9kZSk7XG4gICAgICBlbHNlXG4gICAgICAgIHBvbHl0cmVlLkFkZENoaWxkKG91dFJlYy5Qb2x5Tm9kZSk7XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkZpeHVwT3V0UG9seWdvbiA9IGZ1bmN0aW9uIChvdXRSZWMpXG4gIHtcbiAgICAvL0ZpeHVwT3V0UG9seWdvbigpIC0gcmVtb3ZlcyBkdXBsaWNhdGUgcG9pbnRzIGFuZCBzaW1wbGlmaWVzIGNvbnNlY3V0aXZlXG4gICAgLy9wYXJhbGxlbCBlZGdlcyBieSByZW1vdmluZyB0aGUgbWlkZGxlIHZlcnRleC5cbiAgICB2YXIgbGFzdE9LID0gbnVsbDtcbiAgICBvdXRSZWMuQm90dG9tUHQgPSBudWxsO1xuICAgIHZhciBwcCA9IG91dFJlYy5QdHM7XG4gICAgZm9yICg7OylcbiAgICB7XG4gICAgICBpZiAocHAuUHJldiA9PSBwcCB8fCBwcC5QcmV2ID09IHBwLk5leHQpXG4gICAgICB7XG4gICAgICAgIG91dFJlYy5QdHMgPSBudWxsO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvL3Rlc3QgZm9yIGR1cGxpY2F0ZSBwb2ludHMgYW5kIGNvbGxpbmVhciBlZGdlcyAuLi5cbiAgICAgIGlmICgoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwcC5QdCwgcHAuTmV4dC5QdCkpIHx8IChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KHBwLlB0LCBwcC5QcmV2LlB0KSkgfHxcbiAgICAgICAgKENsaXBwZXJMaWIuQ2xpcHBlckJhc2UuU2xvcGVzRXF1YWwocHAuUHJldi5QdCwgcHAuUHQsIHBwLk5leHQuUHQsIHRoaXMubV9Vc2VGdWxsUmFuZ2UpICYmXG4gICAgICAgICAgKCF0aGlzLlByZXNlcnZlQ29sbGluZWFyIHx8ICF0aGlzLlB0MklzQmV0d2VlblB0MUFuZFB0MyhwcC5QcmV2LlB0LCBwcC5QdCwgcHAuTmV4dC5QdCkpKSlcbiAgICAgIHtcbiAgICAgICAgbGFzdE9LID0gbnVsbDtcbiAgICAgICAgcHAuUHJldi5OZXh0ID0gcHAuTmV4dDtcbiAgICAgICAgcHAuTmV4dC5QcmV2ID0gcHAuUHJldjtcbiAgICAgICAgcHAgPSBwcC5QcmV2O1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAocHAgPT0gbGFzdE9LKVxuICAgICAgICBicmVhaztcbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgaWYgKGxhc3RPSyA9PT0gbnVsbClcbiAgICAgICAgICBsYXN0T0sgPSBwcDtcbiAgICAgICAgcHAgPSBwcC5OZXh0O1xuICAgICAgfVxuICAgIH1cbiAgICBvdXRSZWMuUHRzID0gcHA7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuRHVwT3V0UHQgPSBmdW5jdGlvbiAob3V0UHQsIEluc2VydEFmdGVyKVxuICB7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBDbGlwcGVyTGliLk91dFB0KCk7XG4gICAgLy9yZXN1bHQuUHQgPSBvdXRQdC5QdDtcbiAgICByZXN1bHQuUHQuWCA9IG91dFB0LlB0Llg7XG4gICAgcmVzdWx0LlB0LlkgPSBvdXRQdC5QdC5ZO1xuICAgIHJlc3VsdC5JZHggPSBvdXRQdC5JZHg7XG4gICAgaWYgKEluc2VydEFmdGVyKVxuICAgIHtcbiAgICAgIHJlc3VsdC5OZXh0ID0gb3V0UHQuTmV4dDtcbiAgICAgIHJlc3VsdC5QcmV2ID0gb3V0UHQ7XG4gICAgICBvdXRQdC5OZXh0LlByZXYgPSByZXN1bHQ7XG4gICAgICBvdXRQdC5OZXh0ID0gcmVzdWx0O1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgcmVzdWx0LlByZXYgPSBvdXRQdC5QcmV2O1xuICAgICAgcmVzdWx0Lk5leHQgPSBvdXRQdDtcbiAgICAgIG91dFB0LlByZXYuTmV4dCA9IHJlc3VsdDtcbiAgICAgIG91dFB0LlByZXYgPSByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuR2V0T3ZlcmxhcCA9IGZ1bmN0aW9uIChhMSwgYTIsIGIxLCBiMiwgJHZhbClcbiAge1xuICAgIGlmIChhMSA8IGEyKVxuICAgIHtcbiAgICAgIGlmIChiMSA8IGIyKVxuICAgICAge1xuICAgICAgICAkdmFsLkxlZnQgPSBNYXRoLm1heChhMSwgYjEpO1xuICAgICAgICAkdmFsLlJpZ2h0ID0gTWF0aC5taW4oYTIsIGIyKTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgJHZhbC5MZWZ0ID0gTWF0aC5tYXgoYTEsIGIyKTtcbiAgICAgICAgJHZhbC5SaWdodCA9IE1hdGgubWluKGEyLCBiMSk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICBpZiAoYjEgPCBiMilcbiAgICAgIHtcbiAgICAgICAgJHZhbC5MZWZ0ID0gTWF0aC5tYXgoYTIsIGIxKTtcbiAgICAgICAgJHZhbC5SaWdodCA9IE1hdGgubWluKGExLCBiMik7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICB7XG4gICAgICAgICR2YWwuTGVmdCA9IE1hdGgubWF4KGEyLCBiMik7XG4gICAgICAgICR2YWwuUmlnaHQgPSBNYXRoLm1pbihhMSwgYjEpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gJHZhbC5MZWZ0IDwgJHZhbC5SaWdodDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Kb2luSG9yeiA9IGZ1bmN0aW9uIChvcDEsIG9wMWIsIG9wMiwgb3AyYiwgUHQsIERpc2NhcmRMZWZ0KVxuICB7XG4gICAgdmFyIERpcjEgPSAob3AxLlB0LlggPiBvcDFiLlB0LlggPyBDbGlwcGVyTGliLkRpcmVjdGlvbi5kUmlnaHRUb0xlZnQgOiBDbGlwcGVyTGliLkRpcmVjdGlvbi5kTGVmdFRvUmlnaHQpO1xuICAgIHZhciBEaXIyID0gKG9wMi5QdC5YID4gb3AyYi5QdC5YID8gQ2xpcHBlckxpYi5EaXJlY3Rpb24uZFJpZ2h0VG9MZWZ0IDogQ2xpcHBlckxpYi5EaXJlY3Rpb24uZExlZnRUb1JpZ2h0KTtcbiAgICBpZiAoRGlyMSA9PSBEaXIyKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIC8vV2hlbiBEaXNjYXJkTGVmdCwgd2Ugd2FudCBPcDFiIHRvIGJlIG9uIHRoZSBMZWZ0IG9mIE9wMSwgb3RoZXJ3aXNlIHdlXG4gICAgLy93YW50IE9wMWIgdG8gYmUgb24gdGhlIFJpZ2h0LiAoQW5kIGxpa2V3aXNlIHdpdGggT3AyIGFuZCBPcDJiLilcbiAgICAvL1NvLCB0byBmYWNpbGl0YXRlIHRoaXMgd2hpbGUgaW5zZXJ0aW5nIE9wMWIgYW5kIE9wMmIgLi4uXG4gICAgLy93aGVuIERpc2NhcmRMZWZ0LCBtYWtlIHN1cmUgd2UncmUgQVQgb3IgUklHSFQgb2YgUHQgYmVmb3JlIGFkZGluZyBPcDFiLFxuICAgIC8vb3RoZXJ3aXNlIG1ha2Ugc3VyZSB3ZSdyZSBBVCBvciBMRUZUIG9mIFB0LiAoTGlrZXdpc2Ugd2l0aCBPcDJiLilcbiAgICBpZiAoRGlyMSA9PSBDbGlwcGVyTGliLkRpcmVjdGlvbi5kTGVmdFRvUmlnaHQpXG4gICAge1xuICAgICAgd2hpbGUgKG9wMS5OZXh0LlB0LlggPD0gUHQuWCAmJlxuICAgICAgICBvcDEuTmV4dC5QdC5YID49IG9wMS5QdC5YICYmIG9wMS5OZXh0LlB0LlkgPT0gUHQuWSlcbiAgICAgICAgb3AxID0gb3AxLk5leHQ7XG4gICAgICBpZiAoRGlzY2FyZExlZnQgJiYgKG9wMS5QdC5YICE9IFB0LlgpKVxuICAgICAgICBvcDEgPSBvcDEuTmV4dDtcbiAgICAgIG9wMWIgPSB0aGlzLkR1cE91dFB0KG9wMSwgIURpc2NhcmRMZWZ0KTtcbiAgICAgIGlmIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0luZXF1YWxpdHkob3AxYi5QdCwgUHQpKVxuICAgICAge1xuICAgICAgICBvcDEgPSBvcDFiO1xuICAgICAgICAvL29wMS5QdCA9IFB0O1xuICAgICAgICBvcDEuUHQuWCA9IFB0Llg7XG4gICAgICAgIG9wMS5QdC5ZID0gUHQuWTtcbiAgICAgICAgb3AxYiA9IHRoaXMuRHVwT3V0UHQob3AxLCAhRGlzY2FyZExlZnQpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgd2hpbGUgKG9wMS5OZXh0LlB0LlggPj0gUHQuWCAmJlxuICAgICAgICBvcDEuTmV4dC5QdC5YIDw9IG9wMS5QdC5YICYmIG9wMS5OZXh0LlB0LlkgPT0gUHQuWSlcbiAgICAgICAgb3AxID0gb3AxLk5leHQ7XG4gICAgICBpZiAoIURpc2NhcmRMZWZ0ICYmIChvcDEuUHQuWCAhPSBQdC5YKSlcbiAgICAgICAgb3AxID0gb3AxLk5leHQ7XG4gICAgICBvcDFiID0gdGhpcy5EdXBPdXRQdChvcDEsIERpc2NhcmRMZWZ0KTtcbiAgICAgIGlmIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0luZXF1YWxpdHkob3AxYi5QdCwgUHQpKVxuICAgICAge1xuICAgICAgICBvcDEgPSBvcDFiO1xuICAgICAgICAvL29wMS5QdCA9IFB0O1xuICAgICAgICBvcDEuUHQuWCA9IFB0Llg7XG4gICAgICAgIG9wMS5QdC5ZID0gUHQuWTtcbiAgICAgICAgb3AxYiA9IHRoaXMuRHVwT3V0UHQob3AxLCBEaXNjYXJkTGVmdCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChEaXIyID09IENsaXBwZXJMaWIuRGlyZWN0aW9uLmRMZWZ0VG9SaWdodClcbiAgICB7XG4gICAgICB3aGlsZSAob3AyLk5leHQuUHQuWCA8PSBQdC5YICYmXG4gICAgICAgIG9wMi5OZXh0LlB0LlggPj0gb3AyLlB0LlggJiYgb3AyLk5leHQuUHQuWSA9PSBQdC5ZKVxuICAgICAgICBvcDIgPSBvcDIuTmV4dDtcbiAgICAgIGlmIChEaXNjYXJkTGVmdCAmJiAob3AyLlB0LlggIT0gUHQuWCkpXG4gICAgICAgIG9wMiA9IG9wMi5OZXh0O1xuICAgICAgb3AyYiA9IHRoaXMuRHVwT3V0UHQob3AyLCAhRGlzY2FyZExlZnQpO1xuICAgICAgaWYgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfSW5lcXVhbGl0eShvcDJiLlB0LCBQdCkpXG4gICAgICB7XG4gICAgICAgIG9wMiA9IG9wMmI7XG4gICAgICAgIC8vb3AyLlB0ID0gUHQ7XG4gICAgICAgIG9wMi5QdC5YID0gUHQuWDtcbiAgICAgICAgb3AyLlB0LlkgPSBQdC5ZO1xuICAgICAgICBvcDJiID0gdGhpcy5EdXBPdXRQdChvcDIsICFEaXNjYXJkTGVmdCk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICB3aGlsZSAob3AyLk5leHQuUHQuWCA+PSBQdC5YICYmXG4gICAgICAgIG9wMi5OZXh0LlB0LlggPD0gb3AyLlB0LlggJiYgb3AyLk5leHQuUHQuWSA9PSBQdC5ZKVxuICAgICAgICBvcDIgPSBvcDIuTmV4dDtcbiAgICAgIGlmICghRGlzY2FyZExlZnQgJiYgKG9wMi5QdC5YICE9IFB0LlgpKVxuICAgICAgICBvcDIgPSBvcDIuTmV4dDtcbiAgICAgIG9wMmIgPSB0aGlzLkR1cE91dFB0KG9wMiwgRGlzY2FyZExlZnQpO1xuICAgICAgaWYgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfSW5lcXVhbGl0eShvcDJiLlB0LCBQdCkpXG4gICAgICB7XG4gICAgICAgIG9wMiA9IG9wMmI7XG4gICAgICAgIC8vb3AyLlB0ID0gUHQ7XG4gICAgICAgIG9wMi5QdC5YID0gUHQuWDtcbiAgICAgICAgb3AyLlB0LlkgPSBQdC5ZO1xuICAgICAgICBvcDJiID0gdGhpcy5EdXBPdXRQdChvcDIsIERpc2NhcmRMZWZ0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKChEaXIxID09IENsaXBwZXJMaWIuRGlyZWN0aW9uLmRMZWZ0VG9SaWdodCkgPT0gRGlzY2FyZExlZnQpXG4gICAge1xuICAgICAgb3AxLlByZXYgPSBvcDI7XG4gICAgICBvcDIuTmV4dCA9IG9wMTtcbiAgICAgIG9wMWIuTmV4dCA9IG9wMmI7XG4gICAgICBvcDJiLlByZXYgPSBvcDFiO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgb3AxLk5leHQgPSBvcDI7XG4gICAgICBvcDIuUHJldiA9IG9wMTtcbiAgICAgIG9wMWIuUHJldiA9IG9wMmI7XG4gICAgICBvcDJiLk5leHQgPSBvcDFiO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Kb2luUG9pbnRzID0gZnVuY3Rpb24gKGosIG91dFJlYzEsIG91dFJlYzIpXG4gIHtcbiAgICB2YXIgb3AxID0gai5PdXRQdDEsXG4gICAgICBvcDFiID0gbmV3IENsaXBwZXJMaWIuT3V0UHQoKTtcbiAgICB2YXIgb3AyID0gai5PdXRQdDIsXG4gICAgICBvcDJiID0gbmV3IENsaXBwZXJMaWIuT3V0UHQoKTtcbiAgICAvL1RoZXJlIGFyZSAzIGtpbmRzIG9mIGpvaW5zIGZvciBvdXRwdXQgcG9seWdvbnMgLi4uXG4gICAgLy8xLiBIb3Jpem9udGFsIGpvaW5zIHdoZXJlIEpvaW4uT3V0UHQxICYgSm9pbi5PdXRQdDIgYXJlIGEgdmVydGljZXMgYW55d2hlcmVcbiAgICAvL2Fsb25nIChob3Jpem9udGFsKSBjb2xsaW5lYXIgZWRnZXMgKCYgSm9pbi5PZmZQdCBpcyBvbiB0aGUgc2FtZSBob3Jpem9udGFsKS5cbiAgICAvLzIuIE5vbi1ob3Jpem9udGFsIGpvaW5zIHdoZXJlIEpvaW4uT3V0UHQxICYgSm9pbi5PdXRQdDIgYXJlIGF0IHRoZSBzYW1lXG4gICAgLy9sb2NhdGlvbiBhdCB0aGUgQm90dG9tIG9mIHRoZSBvdmVybGFwcGluZyBzZWdtZW50ICgmIEpvaW4uT2ZmUHQgaXMgYWJvdmUpLlxuICAgIC8vMy4gU3RyaWN0bHlTaW1wbGUgam9pbnMgd2hlcmUgZWRnZXMgdG91Y2ggYnV0IGFyZSBub3QgY29sbGluZWFyIGFuZCB3aGVyZVxuICAgIC8vSm9pbi5PdXRQdDEsIEpvaW4uT3V0UHQyICYgSm9pbi5PZmZQdCBhbGwgc2hhcmUgdGhlIHNhbWUgcG9pbnQuXG4gICAgdmFyIGlzSG9yaXpvbnRhbCA9IChqLk91dFB0MS5QdC5ZID09IGouT2ZmUHQuWSk7XG4gICAgaWYgKGlzSG9yaXpvbnRhbCAmJiAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShqLk9mZlB0LCBqLk91dFB0MS5QdCkpICYmIChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KGouT2ZmUHQsIGouT3V0UHQyLlB0KSkpXG4gICAge1xuICAgICAgLy9TdHJpY3RseSBTaW1wbGUgam9pbiAuLi5cblx0XHRcdGlmIChvdXRSZWMxICE9IG91dFJlYzIpIHJldHVybiBmYWxzZTtcblxuICAgICAgb3AxYiA9IGouT3V0UHQxLk5leHQ7XG4gICAgICB3aGlsZSAob3AxYiAhPSBvcDEgJiYgKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkob3AxYi5QdCwgai5PZmZQdCkpKVxuICAgICAgICBvcDFiID0gb3AxYi5OZXh0O1xuICAgICAgdmFyIHJldmVyc2UxID0gKG9wMWIuUHQuWSA+IGouT2ZmUHQuWSk7XG4gICAgICBvcDJiID0gai5PdXRQdDIuTmV4dDtcbiAgICAgIHdoaWxlIChvcDJiICE9IG9wMiAmJiAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShvcDJiLlB0LCBqLk9mZlB0KSkpXG4gICAgICAgIG9wMmIgPSBvcDJiLk5leHQ7XG4gICAgICB2YXIgcmV2ZXJzZTIgPSAob3AyYi5QdC5ZID4gai5PZmZQdC5ZKTtcbiAgICAgIGlmIChyZXZlcnNlMSA9PSByZXZlcnNlMilcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKHJldmVyc2UxKVxuICAgICAge1xuICAgICAgICBvcDFiID0gdGhpcy5EdXBPdXRQdChvcDEsIGZhbHNlKTtcbiAgICAgICAgb3AyYiA9IHRoaXMuRHVwT3V0UHQob3AyLCB0cnVlKTtcbiAgICAgICAgb3AxLlByZXYgPSBvcDI7XG4gICAgICAgIG9wMi5OZXh0ID0gb3AxO1xuICAgICAgICBvcDFiLk5leHQgPSBvcDJiO1xuICAgICAgICBvcDJiLlByZXYgPSBvcDFiO1xuICAgICAgICBqLk91dFB0MSA9IG9wMTtcbiAgICAgICAgai5PdXRQdDIgPSBvcDFiO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgb3AxYiA9IHRoaXMuRHVwT3V0UHQob3AxLCB0cnVlKTtcbiAgICAgICAgb3AyYiA9IHRoaXMuRHVwT3V0UHQob3AyLCBmYWxzZSk7XG4gICAgICAgIG9wMS5OZXh0ID0gb3AyO1xuICAgICAgICBvcDIuUHJldiA9IG9wMTtcbiAgICAgICAgb3AxYi5QcmV2ID0gb3AyYjtcbiAgICAgICAgb3AyYi5OZXh0ID0gb3AxYjtcbiAgICAgICAgai5PdXRQdDEgPSBvcDE7XG4gICAgICAgIGouT3V0UHQyID0gb3AxYjtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKGlzSG9yaXpvbnRhbClcbiAgICB7XG4gICAgICAvL3RyZWF0IGhvcml6b250YWwgam9pbnMgZGlmZmVyZW50bHkgdG8gbm9uLWhvcml6b250YWwgam9pbnMgc2luY2Ugd2l0aFxuICAgICAgLy90aGVtIHdlJ3JlIG5vdCB5ZXQgc3VyZSB3aGVyZSB0aGUgb3ZlcmxhcHBpbmcgaXMuIE91dFB0MS5QdCAmIE91dFB0Mi5QdFxuICAgICAgLy9tYXkgYmUgYW55d2hlcmUgYWxvbmcgdGhlIGhvcml6b250YWwgZWRnZS5cbiAgICAgIG9wMWIgPSBvcDE7XG4gICAgICB3aGlsZSAob3AxLlByZXYuUHQuWSA9PSBvcDEuUHQuWSAmJiBvcDEuUHJldiAhPSBvcDFiICYmIG9wMS5QcmV2ICE9IG9wMilcbiAgICAgICAgb3AxID0gb3AxLlByZXY7XG4gICAgICB3aGlsZSAob3AxYi5OZXh0LlB0LlkgPT0gb3AxYi5QdC5ZICYmIG9wMWIuTmV4dCAhPSBvcDEgJiYgb3AxYi5OZXh0ICE9IG9wMilcbiAgICAgICAgb3AxYiA9IG9wMWIuTmV4dDtcbiAgICAgIGlmIChvcDFiLk5leHQgPT0gb3AxIHx8IG9wMWIuTmV4dCA9PSBvcDIpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIC8vYSBmbGF0ICdwb2x5Z29uJ1xuICAgICAgb3AyYiA9IG9wMjtcbiAgICAgIHdoaWxlIChvcDIuUHJldi5QdC5ZID09IG9wMi5QdC5ZICYmIG9wMi5QcmV2ICE9IG9wMmIgJiYgb3AyLlByZXYgIT0gb3AxYilcbiAgICAgICAgb3AyID0gb3AyLlByZXY7XG4gICAgICB3aGlsZSAob3AyYi5OZXh0LlB0LlkgPT0gb3AyYi5QdC5ZICYmIG9wMmIuTmV4dCAhPSBvcDIgJiYgb3AyYi5OZXh0ICE9IG9wMSlcbiAgICAgICAgb3AyYiA9IG9wMmIuTmV4dDtcbiAgICAgIGlmIChvcDJiLk5leHQgPT0gb3AyIHx8IG9wMmIuTmV4dCA9PSBvcDEpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIC8vYSBmbGF0ICdwb2x5Z29uJ1xuICAgICAgLy9PcDEgLS4gT3AxYiAmIE9wMiAtLiBPcDJiIGFyZSB0aGUgZXh0cmVtaXRlcyBvZiB0aGUgaG9yaXpvbnRhbCBlZGdlc1xuXG4gICAgICB2YXIgJHZhbCA9IHtMZWZ0OiBudWxsLCBSaWdodDogbnVsbH07XG4gICAgICBpZiAoIXRoaXMuR2V0T3ZlcmxhcChvcDEuUHQuWCwgb3AxYi5QdC5YLCBvcDIuUHQuWCwgb3AyYi5QdC5YLCAkdmFsKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgdmFyIExlZnQgPSAkdmFsLkxlZnQ7XG4gICAgICB2YXIgUmlnaHQgPSAkdmFsLlJpZ2h0O1xuXG4gICAgICAvL0Rpc2NhcmRMZWZ0U2lkZTogd2hlbiBvdmVybGFwcGluZyBlZGdlcyBhcmUgam9pbmVkLCBhIHNwaWtlIHdpbGwgY3JlYXRlZFxuICAgICAgLy93aGljaCBuZWVkcyB0byBiZSBjbGVhbmVkIHVwLiBIb3dldmVyLCB3ZSBkb24ndCB3YW50IE9wMSBvciBPcDIgY2F1Z2h0IHVwXG4gICAgICAvL29uIHRoZSBkaXNjYXJkIFNpZGUgYXMgZWl0aGVyIG1heSBzdGlsbCBiZSBuZWVkZWQgZm9yIG90aGVyIGpvaW5zIC4uLlxuICAgICAgdmFyIFB0ID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQoKTtcbiAgICAgIHZhciBEaXNjYXJkTGVmdFNpZGU7XG4gICAgICBpZiAob3AxLlB0LlggPj0gTGVmdCAmJiBvcDEuUHQuWCA8PSBSaWdodClcbiAgICAgIHtcbiAgICAgICAgLy9QdCA9IG9wMS5QdDtcbiAgICAgICAgUHQuWCA9IG9wMS5QdC5YO1xuICAgICAgICBQdC5ZID0gb3AxLlB0Llk7XG4gICAgICAgIERpc2NhcmRMZWZ0U2lkZSA9IChvcDEuUHQuWCA+IG9wMWIuUHQuWCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChvcDIuUHQuWCA+PSBMZWZ0ICYmIG9wMi5QdC5YIDw9IFJpZ2h0KVxuICAgICAge1xuICAgICAgICAvL1B0ID0gb3AyLlB0O1xuICAgICAgICBQdC5YID0gb3AyLlB0Llg7XG4gICAgICAgIFB0LlkgPSBvcDIuUHQuWTtcbiAgICAgICAgRGlzY2FyZExlZnRTaWRlID0gKG9wMi5QdC5YID4gb3AyYi5QdC5YKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9wMWIuUHQuWCA+PSBMZWZ0ICYmIG9wMWIuUHQuWCA8PSBSaWdodClcbiAgICAgIHtcbiAgICAgICAgLy9QdCA9IG9wMWIuUHQ7XG4gICAgICAgIFB0LlggPSBvcDFiLlB0Llg7XG4gICAgICAgIFB0LlkgPSBvcDFiLlB0Llk7XG4gICAgICAgIERpc2NhcmRMZWZ0U2lkZSA9IG9wMWIuUHQuWCA+IG9wMS5QdC5YO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICAvL1B0ID0gb3AyYi5QdDtcbiAgICAgICAgUHQuWCA9IG9wMmIuUHQuWDtcbiAgICAgICAgUHQuWSA9IG9wMmIuUHQuWTtcbiAgICAgICAgRGlzY2FyZExlZnRTaWRlID0gKG9wMmIuUHQuWCA+IG9wMi5QdC5YKTtcbiAgICAgIH1cbiAgICAgIGouT3V0UHQxID0gb3AxO1xuICAgICAgai5PdXRQdDIgPSBvcDI7XG4gICAgICByZXR1cm4gdGhpcy5Kb2luSG9yeihvcDEsIG9wMWIsIG9wMiwgb3AyYiwgUHQsIERpc2NhcmRMZWZ0U2lkZSk7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAvL25iOiBGb3Igbm9uLWhvcml6b250YWwgam9pbnMgLi4uXG4gICAgICAvLyAgICAxLiBKci5PdXRQdDEuUHQuWSA9PSBKci5PdXRQdDIuUHQuWVxuICAgICAgLy8gICAgMi4gSnIuT3V0UHQxLlB0ID4gSnIuT2ZmUHQuWVxuICAgICAgLy9tYWtlIHN1cmUgdGhlIHBvbHlnb25zIGFyZSBjb3JyZWN0bHkgb3JpZW50ZWQgLi4uXG4gICAgICBvcDFiID0gb3AxLk5leHQ7XG4gICAgICB3aGlsZSAoKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkob3AxYi5QdCwgb3AxLlB0KSkgJiYgKG9wMWIgIT0gb3AxKSlcbiAgICAgICAgb3AxYiA9IG9wMWIuTmV4dDtcbiAgICAgIHZhciBSZXZlcnNlMSA9ICgob3AxYi5QdC5ZID4gb3AxLlB0LlkpIHx8ICFDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNsb3Blc0VxdWFsKG9wMS5QdCwgb3AxYi5QdCwgai5PZmZQdCwgdGhpcy5tX1VzZUZ1bGxSYW5nZSkpO1xuICAgICAgaWYgKFJldmVyc2UxKVxuICAgICAge1xuICAgICAgICBvcDFiID0gb3AxLlByZXY7XG4gICAgICAgIHdoaWxlICgoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShvcDFiLlB0LCBvcDEuUHQpKSAmJiAob3AxYiAhPSBvcDEpKVxuICAgICAgICAgIG9wMWIgPSBvcDFiLlByZXY7XG4gICAgICAgIGlmICgob3AxYi5QdC5ZID4gb3AxLlB0LlkpIHx8ICFDbGlwcGVyTGliLkNsaXBwZXJCYXNlLlNsb3Blc0VxdWFsKG9wMS5QdCwgb3AxYi5QdCwgai5PZmZQdCwgdGhpcy5tX1VzZUZ1bGxSYW5nZSkpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgb3AyYiA9IG9wMi5OZXh0O1xuICAgICAgd2hpbGUgKChDbGlwcGVyTGliLkludFBvaW50Lm9wX0VxdWFsaXR5KG9wMmIuUHQsIG9wMi5QdCkpICYmIChvcDJiICE9IG9wMikpXG4gICAgICAgIG9wMmIgPSBvcDJiLk5leHQ7XG4gICAgICB2YXIgUmV2ZXJzZTIgPSAoKG9wMmIuUHQuWSA+IG9wMi5QdC5ZKSB8fCAhQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5TbG9wZXNFcXVhbChvcDIuUHQsIG9wMmIuUHQsIGouT2ZmUHQsIHRoaXMubV9Vc2VGdWxsUmFuZ2UpKTtcbiAgICAgIGlmIChSZXZlcnNlMilcbiAgICAgIHtcbiAgICAgICAgb3AyYiA9IG9wMi5QcmV2O1xuICAgICAgICB3aGlsZSAoKENsaXBwZXJMaWIuSW50UG9pbnQub3BfRXF1YWxpdHkob3AyYi5QdCwgb3AyLlB0KSkgJiYgKG9wMmIgIT0gb3AyKSlcbiAgICAgICAgICBvcDJiID0gb3AyYi5QcmV2O1xuICAgICAgICBpZiAoKG9wMmIuUHQuWSA+IG9wMi5QdC5ZKSB8fCAhQ2xpcHBlckxpYi5DbGlwcGVyQmFzZS5TbG9wZXNFcXVhbChvcDIuUHQsIG9wMmIuUHQsIGouT2ZmUHQsIHRoaXMubV9Vc2VGdWxsUmFuZ2UpKVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICgob3AxYiA9PSBvcDEpIHx8IChvcDJiID09IG9wMikgfHwgKG9wMWIgPT0gb3AyYikgfHxcbiAgICAgICAgKChvdXRSZWMxID09IG91dFJlYzIpICYmIChSZXZlcnNlMSA9PSBSZXZlcnNlMikpKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoUmV2ZXJzZTEpXG4gICAgICB7XG4gICAgICAgIG9wMWIgPSB0aGlzLkR1cE91dFB0KG9wMSwgZmFsc2UpO1xuICAgICAgICBvcDJiID0gdGhpcy5EdXBPdXRQdChvcDIsIHRydWUpO1xuICAgICAgICBvcDEuUHJldiA9IG9wMjtcbiAgICAgICAgb3AyLk5leHQgPSBvcDE7XG4gICAgICAgIG9wMWIuTmV4dCA9IG9wMmI7XG4gICAgICAgIG9wMmIuUHJldiA9IG9wMWI7XG4gICAgICAgIGouT3V0UHQxID0gb3AxO1xuICAgICAgICBqLk91dFB0MiA9IG9wMWI7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICBvcDFiID0gdGhpcy5EdXBPdXRQdChvcDEsIHRydWUpO1xuICAgICAgICBvcDJiID0gdGhpcy5EdXBPdXRQdChvcDIsIGZhbHNlKTtcbiAgICAgICAgb3AxLk5leHQgPSBvcDI7XG4gICAgICAgIG9wMi5QcmV2ID0gb3AxO1xuICAgICAgICBvcDFiLlByZXYgPSBvcDJiO1xuICAgICAgICBvcDJiLk5leHQgPSBvcDFiO1xuICAgICAgICBqLk91dFB0MSA9IG9wMTtcbiAgICAgICAgai5PdXRQdDIgPSBvcDFiO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5HZXRCb3VuZHMgPSBmdW5jdGlvbiAocGF0aHMpXG4gIHtcbiAgICB2YXIgaSA9IDAsXG4gICAgICBjbnQgPSBwYXRocy5sZW5ndGg7XG4gICAgd2hpbGUgKGkgPCBjbnQgJiYgcGF0aHNbaV0ubGVuZ3RoID09IDApIGkrKztcbiAgICBpZiAoaSA9PSBjbnQpIHJldHVybiBuZXcgQ2xpcHBlckxpYi5JbnRSZWN0KDAsIDAsIDAsIDApO1xuICAgIHZhciByZXN1bHQgPSBuZXcgQ2xpcHBlckxpYi5JbnRSZWN0KCk7XG4gICAgcmVzdWx0LmxlZnQgPSBwYXRoc1tpXVswXS5YO1xuICAgIHJlc3VsdC5yaWdodCA9IHJlc3VsdC5sZWZ0O1xuICAgIHJlc3VsdC50b3AgPSBwYXRoc1tpXVswXS5ZO1xuICAgIHJlc3VsdC5ib3R0b20gPSByZXN1bHQudG9wO1xuICAgIGZvciAoOyBpIDwgY250OyBpKyspXG4gICAgICBmb3IgKHZhciBqID0gMCwgamxlbiA9IHBhdGhzW2ldLmxlbmd0aDsgaiA8IGpsZW47IGorKylcbiAgICAgIHtcbiAgICAgICAgaWYgKHBhdGhzW2ldW2pdLlggPCByZXN1bHQubGVmdCkgcmVzdWx0LmxlZnQgPSBwYXRoc1tpXVtqXS5YO1xuICAgICAgICBlbHNlIGlmIChwYXRoc1tpXVtqXS5YID4gcmVzdWx0LnJpZ2h0KSByZXN1bHQucmlnaHQgPSBwYXRoc1tpXVtqXS5YO1xuICAgICAgICBpZiAocGF0aHNbaV1bal0uWSA8IHJlc3VsdC50b3ApIHJlc3VsdC50b3AgPSBwYXRoc1tpXVtqXS5ZO1xuICAgICAgICBlbHNlIGlmIChwYXRoc1tpXVtqXS5ZID4gcmVzdWx0LmJvdHRvbSkgcmVzdWx0LmJvdHRvbSA9IHBhdGhzW2ldW2pdLlk7XG4gICAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkdldEJvdW5kczIgPSBmdW5jdGlvbiAob3BzKVxuICB7XG4gICAgdmFyIG9wU3RhcnQgPSBvcHM7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBDbGlwcGVyTGliLkludFJlY3QoKTtcbiAgICByZXN1bHQubGVmdCA9IG9wcy5QdC5YO1xuICAgIHJlc3VsdC5yaWdodCA9IG9wcy5QdC5YO1xuICAgIHJlc3VsdC50b3AgPSBvcHMuUHQuWTtcbiAgICByZXN1bHQuYm90dG9tID0gb3BzLlB0Llk7XG4gICAgb3BzID0gb3BzLk5leHQ7XG4gICAgd2hpbGUgKG9wcyAhPSBvcFN0YXJ0KVxuICAgIHtcbiAgICAgIGlmIChvcHMuUHQuWCA8IHJlc3VsdC5sZWZ0KVxuICAgICAgICByZXN1bHQubGVmdCA9IG9wcy5QdC5YO1xuICAgICAgaWYgKG9wcy5QdC5YID4gcmVzdWx0LnJpZ2h0KVxuICAgICAgICByZXN1bHQucmlnaHQgPSBvcHMuUHQuWDtcbiAgICAgIGlmIChvcHMuUHQuWSA8IHJlc3VsdC50b3ApXG4gICAgICAgIHJlc3VsdC50b3AgPSBvcHMuUHQuWTtcbiAgICAgIGlmIChvcHMuUHQuWSA+IHJlc3VsdC5ib3R0b20pXG4gICAgICAgIHJlc3VsdC5ib3R0b20gPSBvcHMuUHQuWTtcbiAgICAgIG9wcyA9IG9wcy5OZXh0O1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIENsaXBwZXJMaWIuQ2xpcHBlci5Qb2ludEluUG9seWdvbiA9IGZ1bmN0aW9uIChwdCwgcGF0aClcbiAge1xuICAgIC8vcmV0dXJucyAwIGlmIGZhbHNlLCArMSBpZiB0cnVlLCAtMSBpZiBwdCBPTiBwb2x5Z29uIGJvdW5kYXJ5XG5cdFx0Ly9TZWUgXCJUaGUgUG9pbnQgaW4gUG9seWdvbiBQcm9ibGVtIGZvciBBcmJpdHJhcnkgUG9seWdvbnNcIiBieSBIb3JtYW5uICYgQWdhdGhvc1xuICAgIC8vaHR0cDovL2NpdGVzZWVyeC5pc3QucHN1LmVkdS92aWV3ZG9jL2Rvd25sb2FkP2RvaT0xMC4xLjEuODguNTQ5OCZyZXA9cmVwMSZ0eXBlPXBkZlxuICAgIHZhciByZXN1bHQgPSAwLFxuICAgICAgY250ID0gcGF0aC5sZW5ndGg7XG4gICAgaWYgKGNudCA8IDMpXG4gICAgICByZXR1cm4gMDtcbiAgICB2YXIgaXAgPSBwYXRoWzBdO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDw9IGNudDsgKytpKVxuICAgIHtcbiAgICAgIHZhciBpcE5leHQgPSAoaSA9PSBjbnQgPyBwYXRoWzBdIDogcGF0aFtpXSk7XG4gICAgICBpZiAoaXBOZXh0LlkgPT0gcHQuWSlcbiAgICAgIHtcbiAgICAgICAgaWYgKChpcE5leHQuWCA9PSBwdC5YKSB8fCAoaXAuWSA9PSBwdC5ZICYmICgoaXBOZXh0LlggPiBwdC5YKSA9PSAoaXAuWCA8IHB0LlgpKSkpXG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgaWYgKChpcC5ZIDwgcHQuWSkgIT0gKGlwTmV4dC5ZIDwgcHQuWSkpXG4gICAgICB7XG4gICAgICAgIGlmIChpcC5YID49IHB0LlgpXG4gICAgICAgIHtcbiAgICAgICAgICBpZiAoaXBOZXh0LlggPiBwdC5YKVxuICAgICAgICAgICAgcmVzdWx0ID0gMSAtIHJlc3VsdDtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgdmFyIGQgPSAoaXAuWCAtIHB0LlgpICogKGlwTmV4dC5ZIC0gcHQuWSkgLSAoaXBOZXh0LlggLSBwdC5YKSAqIChpcC5ZIC0gcHQuWSk7XG4gICAgICAgICAgICBpZiAoZCA9PSAwKVxuICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICBlbHNlIGlmICgoZCA+IDApID09IChpcE5leHQuWSA+IGlwLlkpKVxuICAgICAgICAgICAgICByZXN1bHQgPSAxIC0gcmVzdWx0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICBpZiAoaXBOZXh0LlggPiBwdC5YKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZhciBkID0gKGlwLlggLSBwdC5YKSAqIChpcE5leHQuWSAtIHB0LlkpIC0gKGlwTmV4dC5YIC0gcHQuWCkgKiAoaXAuWSAtIHB0LlkpO1xuICAgICAgICAgICAgaWYgKGQgPT0gMClcbiAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgZWxzZSBpZiAoKGQgPiAwKSA9PSAoaXBOZXh0LlkgPiBpcC5ZKSlcbiAgICAgICAgICAgICAgcmVzdWx0ID0gMSAtIHJlc3VsdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlwID0gaXBOZXh0O1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuUG9pbnRJblBvbHlnb24gPSBmdW5jdGlvbiAocHQsIG9wKVxuICB7XG4gICAgLy9yZXR1cm5zIDAgaWYgZmFsc2UsICsxIGlmIHRydWUsIC0xIGlmIHB0IE9OIHBvbHlnb24gYm91bmRhcnlcblx0XHQvL1NlZSBcIlRoZSBQb2ludCBpbiBQb2x5Z29uIFByb2JsZW0gZm9yIEFyYml0cmFyeSBQb2x5Z29uc1wiIGJ5IEhvcm1hbm4gJiBBZ2F0aG9zXG4gICAgLy9odHRwOi8vY2l0ZXNlZXJ4LmlzdC5wc3UuZWR1L3ZpZXdkb2MvZG93bmxvYWQ/ZG9pPTEwLjEuMS44OC41NDk4JnJlcD1yZXAxJnR5cGU9cGRmXG4gICAgdmFyIHJlc3VsdCA9IDA7XG4gICAgdmFyIHN0YXJ0T3AgPSBvcDtcblx0XHR2YXIgcHR4ID0gcHQuWCwgcHR5ID0gcHQuWTtcbiAgICB2YXIgcG9seTB4ID0gb3AuUHQuWCwgcG9seTB5ID0gb3AuUHQuWTtcbiAgICBkb1xuICAgIHtcblx0XHRcdG9wID0gb3AuTmV4dDtcblx0XHRcdHZhciBwb2x5MXggPSBvcC5QdC5YLCBwb2x5MXkgPSBvcC5QdC5ZO1xuICAgICAgaWYgKHBvbHkxeSA9PSBwdHkpXG4gICAgICB7XG4gICAgICAgIGlmICgocG9seTF4ID09IHB0eCkgfHwgKHBvbHkweSA9PSBwdHkgJiYgKChwb2x5MXggPiBwdHgpID09IChwb2x5MHggPCBwdHgpKSkpXG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgaWYgKChwb2x5MHkgPCBwdHkpICE9IChwb2x5MXkgPCBwdHkpKVxuICAgICAge1xuICAgICAgICBpZiAocG9seTB4ID49IHB0eClcbiAgICAgICAge1xuICAgICAgICAgIGlmIChwb2x5MXggPiBwdHgpXG4gICAgICAgICAgICByZXN1bHQgPSAxIC0gcmVzdWx0O1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2YXIgZCA9IChwb2x5MHggLSBwdHgpICogKHBvbHkxeSAtIHB0eSkgLSAocG9seTF4IC0gcHR4KSAqIChwb2x5MHkgLSBwdHkpO1xuICAgICAgICAgICAgaWYgKGQgPT0gMClcbiAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgaWYgKChkID4gMCkgPT0gKHBvbHkxeSA+IHBvbHkweSkpXG4gICAgICAgICAgICAgIHJlc3VsdCA9IDEgLSByZXN1bHQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgIGlmIChwb2x5MXggPiBwdHgpXG4gICAgICAgICAge1xuICAgICAgICAgICAgdmFyIGQgPSAocG9seTB4IC0gcHR4KSAqIChwb2x5MXkgLSBwdHkpIC0gKHBvbHkxeCAtIHB0eCkgKiAocG9seTB5IC0gcHR5KTtcbiAgICAgICAgICAgIGlmIChkID09IDApXG4gICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIGlmICgoZCA+IDApID09IChwb2x5MXkgPiBwb2x5MHkpKVxuICAgICAgICAgICAgICByZXN1bHQgPSAxIC0gcmVzdWx0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcG9seTB4ID0gcG9seTF4O1xuICAgICAgcG9seTB5ID0gcG9seTF5O1xuICAgIH0gd2hpbGUgKHN0YXJ0T3AgIT0gb3ApO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLlBvbHkyQ29udGFpbnNQb2x5MSA9IGZ1bmN0aW9uIChvdXRQdDEsIG91dFB0MilcbiAge1xuICAgIHZhciBvcCA9IG91dFB0MTtcbiAgICBkb1xuICAgIHtcblx0XHRcdC8vbmI6IFBvaW50SW5Qb2x5Z29uIHJldHVybnMgMCBpZiBmYWxzZSwgKzEgaWYgdHJ1ZSwgLTEgaWYgcHQgb24gcG9seWdvblxuICAgICAgdmFyIHJlcyA9IHRoaXMuUG9pbnRJblBvbHlnb24ob3AuUHQsIG91dFB0Mik7XG4gICAgICBpZiAocmVzID49IDApXG4gICAgICAgIHJldHVybiByZXMgPiAwO1xuICAgICAgb3AgPSBvcC5OZXh0O1xuICAgIH1cbiAgICB3aGlsZSAob3AgIT0gb3V0UHQxKVxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkZpeHVwRmlyc3RMZWZ0czEgPSBmdW5jdGlvbiAoT2xkT3V0UmVjLCBOZXdPdXRSZWMpXG4gIHtcbiAgICBmb3IgKHZhciBpID0gMCwgaWxlbiA9IHRoaXMubV9Qb2x5T3V0cy5sZW5ndGg7IGkgPCBpbGVuOyBpKyspXG4gICAge1xuXHRcdFx0dmFyIG91dFJlYyA9IHRoaXMubV9Qb2x5T3V0c1tpXTtcblx0XHRcdGlmIChvdXRSZWMuUHRzID09IG51bGwgfHwgb3V0UmVjLkZpcnN0TGVmdCA9PSBudWxsKVxuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdHZhciBmaXJzdExlZnQgPSBDbGlwcGVyTGliLkNsaXBwZXIuUGFyc2VGaXJzdExlZnQob3V0UmVjLkZpcnN0TGVmdCk7XG5cdFx0XHRpZiAoZmlyc3RMZWZ0ID09IE9sZE91dFJlYylcblx0XHRcdHtcbiAgICAgICAgaWYgKHRoaXMuUG9seTJDb250YWluc1BvbHkxKG91dFJlYy5QdHMsIE5ld091dFJlYy5QdHMpKVxuICAgICAgICAgIG91dFJlYy5GaXJzdExlZnQgPSBOZXdPdXRSZWM7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIucHJvdG90eXBlLkZpeHVwRmlyc3RMZWZ0czIgPSBmdW5jdGlvbiAoT2xkT3V0UmVjLCBOZXdPdXRSZWMpXG4gIHtcbiAgICBmb3IgKHZhciAkaTIgPSAwLCAkdDIgPSB0aGlzLm1fUG9seU91dHMsICRsMiA9ICR0Mi5sZW5ndGgsIG91dFJlYyA9ICR0MlskaTJdOyAkaTIgPCAkbDI7ICRpMisrLCBvdXRSZWMgPSAkdDJbJGkyXSlcbiAgICAgIGlmIChvdXRSZWMuRmlyc3RMZWZ0ID09IE9sZE91dFJlYylcbiAgICAgICAgb3V0UmVjLkZpcnN0TGVmdCA9IE5ld091dFJlYztcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLlBhcnNlRmlyc3RMZWZ0ID0gZnVuY3Rpb24gKEZpcnN0TGVmdClcbiAge1xuICAgIHdoaWxlIChGaXJzdExlZnQgIT0gbnVsbCAmJiBGaXJzdExlZnQuUHRzID09IG51bGwpXG4gICAgICBGaXJzdExlZnQgPSBGaXJzdExlZnQuRmlyc3RMZWZ0O1xuICAgIHJldHVybiBGaXJzdExlZnQ7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5wcm90b3R5cGUuSm9pbkNvbW1vbkVkZ2VzID0gZnVuY3Rpb24gKClcbiAge1xuICAgIGZvciAodmFyIGkgPSAwLCBpbGVuID0gdGhpcy5tX0pvaW5zLmxlbmd0aDsgaSA8IGlsZW47IGkrKylcbiAgICB7XG4gICAgICB2YXIgam9pbiA9IHRoaXMubV9Kb2luc1tpXTtcbiAgICAgIHZhciBvdXRSZWMxID0gdGhpcy5HZXRPdXRSZWMoam9pbi5PdXRQdDEuSWR4KTtcbiAgICAgIHZhciBvdXRSZWMyID0gdGhpcy5HZXRPdXRSZWMoam9pbi5PdXRQdDIuSWR4KTtcbiAgICAgIGlmIChvdXRSZWMxLlB0cyA9PSBudWxsIHx8IG91dFJlYzIuUHRzID09IG51bGwpXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgLy9nZXQgdGhlIHBvbHlnb24gZnJhZ21lbnQgd2l0aCB0aGUgY29ycmVjdCBob2xlIHN0YXRlIChGaXJzdExlZnQpXG4gICAgICAvL2JlZm9yZSBjYWxsaW5nIEpvaW5Qb2ludHMoKSAuLi5cbiAgICAgIHZhciBob2xlU3RhdGVSZWM7XG4gICAgICBpZiAob3V0UmVjMSA9PSBvdXRSZWMyKVxuICAgICAgICBob2xlU3RhdGVSZWMgPSBvdXRSZWMxO1xuICAgICAgZWxzZSBpZiAodGhpcy5QYXJhbTFSaWdodE9mUGFyYW0yKG91dFJlYzEsIG91dFJlYzIpKVxuICAgICAgICBob2xlU3RhdGVSZWMgPSBvdXRSZWMyO1xuICAgICAgZWxzZSBpZiAodGhpcy5QYXJhbTFSaWdodE9mUGFyYW0yKG91dFJlYzIsIG91dFJlYzEpKVxuICAgICAgICBob2xlU3RhdGVSZWMgPSBvdXRSZWMxO1xuICAgICAgZWxzZVxuICAgICAgICBob2xlU3RhdGVSZWMgPSB0aGlzLkdldExvd2VybW9zdFJlYyhvdXRSZWMxLCBvdXRSZWMyKTtcblxuICAgICAgaWYgKCF0aGlzLkpvaW5Qb2ludHMoam9pbiwgb3V0UmVjMSwgb3V0UmVjMikpIGNvbnRpbnVlO1xuXG4gICAgICBpZiAob3V0UmVjMSA9PSBvdXRSZWMyKVxuICAgICAge1xuICAgICAgICAvL2luc3RlYWQgb2Ygam9pbmluZyB0d28gcG9seWdvbnMsIHdlJ3ZlIGp1c3QgY3JlYXRlZCBhIG5ldyBvbmUgYnlcbiAgICAgICAgLy9zcGxpdHRpbmcgb25lIHBvbHlnb24gaW50byB0d28uXG4gICAgICAgIG91dFJlYzEuUHRzID0gam9pbi5PdXRQdDE7XG4gICAgICAgIG91dFJlYzEuQm90dG9tUHQgPSBudWxsO1xuICAgICAgICBvdXRSZWMyID0gdGhpcy5DcmVhdGVPdXRSZWMoKTtcbiAgICAgICAgb3V0UmVjMi5QdHMgPSBqb2luLk91dFB0MjtcbiAgICAgICAgLy91cGRhdGUgYWxsIE91dFJlYzIuUHRzIElkeCdzIC4uLlxuICAgICAgICB0aGlzLlVwZGF0ZU91dFB0SWR4cyhvdXRSZWMyKTtcbiAgICAgICAgLy9XZSBub3cgbmVlZCB0byBjaGVjayBldmVyeSBPdXRSZWMuRmlyc3RMZWZ0IHBvaW50ZXIuIElmIGl0IHBvaW50c1xuICAgICAgICAvL3RvIE91dFJlYzEgaXQgbWF5IG5lZWQgdG8gcG9pbnQgdG8gT3V0UmVjMiBpbnN0ZWFkIC4uLlxuICAgICAgICBpZiAodGhpcy5tX1VzaW5nUG9seVRyZWUpXG4gICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGpsZW4gPSB0aGlzLm1fUG9seU91dHMubGVuZ3RoOyBqIDwgamxlbiAtIDE7IGorKylcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2YXIgb1JlYyA9IHRoaXMubV9Qb2x5T3V0c1tqXTtcbiAgICAgICAgICAgIGlmIChvUmVjLlB0cyA9PSBudWxsIHx8IENsaXBwZXJMaWIuQ2xpcHBlci5QYXJzZUZpcnN0TGVmdChvUmVjLkZpcnN0TGVmdCkgIT0gb3V0UmVjMSB8fCBvUmVjLklzSG9sZSA9PSBvdXRSZWMxLklzSG9sZSlcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICBpZiAodGhpcy5Qb2x5MkNvbnRhaW5zUG9seTEob1JlYy5QdHMsIGpvaW4uT3V0UHQyKSlcbiAgICAgICAgICAgICAgb1JlYy5GaXJzdExlZnQgPSBvdXRSZWMyO1xuICAgICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuUG9seTJDb250YWluc1BvbHkxKG91dFJlYzIuUHRzLCBvdXRSZWMxLlB0cykpXG4gICAgICAgIHtcbiAgICAgICAgICAvL291dFJlYzIgaXMgY29udGFpbmVkIGJ5IG91dFJlYzEgLi4uXG4gICAgICAgICAgb3V0UmVjMi5Jc0hvbGUgPSAhb3V0UmVjMS5Jc0hvbGU7XG4gICAgICAgICAgb3V0UmVjMi5GaXJzdExlZnQgPSBvdXRSZWMxO1xuICAgICAgICAgIC8vZml4dXAgRmlyc3RMZWZ0IHBvaW50ZXJzIHRoYXQgbWF5IG5lZWQgcmVhc3NpZ25pbmcgdG8gT3V0UmVjMVxuICAgICAgICAgIGlmICh0aGlzLm1fVXNpbmdQb2x5VHJlZSlcbiAgICAgICAgICAgIHRoaXMuRml4dXBGaXJzdExlZnRzMihvdXRSZWMyLCBvdXRSZWMxKTtcbiAgICAgICAgICBpZiAoKG91dFJlYzIuSXNIb2xlIF4gdGhpcy5SZXZlcnNlU29sdXRpb24pID09ICh0aGlzLkFyZWEob3V0UmVjMikgPiAwKSlcbiAgICAgICAgICAgIHRoaXMuUmV2ZXJzZVBvbHlQdExpbmtzKG91dFJlYzIuUHRzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLlBvbHkyQ29udGFpbnNQb2x5MShvdXRSZWMxLlB0cywgb3V0UmVjMi5QdHMpKVxuICAgICAgICB7XG4gICAgICAgICAgLy9vdXRSZWMxIGlzIGNvbnRhaW5lZCBieSBvdXRSZWMyIC4uLlxuICAgICAgICAgIG91dFJlYzIuSXNIb2xlID0gb3V0UmVjMS5Jc0hvbGU7XG4gICAgICAgICAgb3V0UmVjMS5Jc0hvbGUgPSAhb3V0UmVjMi5Jc0hvbGU7XG4gICAgICAgICAgb3V0UmVjMi5GaXJzdExlZnQgPSBvdXRSZWMxLkZpcnN0TGVmdDtcbiAgICAgICAgICBvdXRSZWMxLkZpcnN0TGVmdCA9IG91dFJlYzI7XG4gICAgICAgICAgLy9maXh1cCBGaXJzdExlZnQgcG9pbnRlcnMgdGhhdCBtYXkgbmVlZCByZWFzc2lnbmluZyB0byBPdXRSZWMxXG4gICAgICAgICAgaWYgKHRoaXMubV9Vc2luZ1BvbHlUcmVlKVxuICAgICAgICAgICAgdGhpcy5GaXh1cEZpcnN0TGVmdHMyKG91dFJlYzEsIG91dFJlYzIpO1xuICAgICAgICAgIGlmICgob3V0UmVjMS5Jc0hvbGUgXiB0aGlzLlJldmVyc2VTb2x1dGlvbikgPT0gKHRoaXMuQXJlYShvdXRSZWMxKSA+IDApKVxuICAgICAgICAgICAgdGhpcy5SZXZlcnNlUG9seVB0TGlua3Mob3V0UmVjMS5QdHMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgIC8vdGhlIDIgcG9seWdvbnMgYXJlIGNvbXBsZXRlbHkgc2VwYXJhdGUgLi4uXG4gICAgICAgICAgb3V0UmVjMi5Jc0hvbGUgPSBvdXRSZWMxLklzSG9sZTtcbiAgICAgICAgICBvdXRSZWMyLkZpcnN0TGVmdCA9IG91dFJlYzEuRmlyc3RMZWZ0O1xuICAgICAgICAgIC8vZml4dXAgRmlyc3RMZWZ0IHBvaW50ZXJzIHRoYXQgbWF5IG5lZWQgcmVhc3NpZ25pbmcgdG8gT3V0UmVjMlxuICAgICAgICAgIGlmICh0aGlzLm1fVXNpbmdQb2x5VHJlZSlcbiAgICAgICAgICAgIHRoaXMuRml4dXBGaXJzdExlZnRzMShvdXRSZWMxLCBvdXRSZWMyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICAvL2pvaW5lZCAyIHBvbHlnb25zIHRvZ2V0aGVyIC4uLlxuICAgICAgICBvdXRSZWMyLlB0cyA9IG51bGw7XG4gICAgICAgIG91dFJlYzIuQm90dG9tUHQgPSBudWxsO1xuICAgICAgICBvdXRSZWMyLklkeCA9IG91dFJlYzEuSWR4O1xuICAgICAgICBvdXRSZWMxLklzSG9sZSA9IGhvbGVTdGF0ZVJlYy5Jc0hvbGU7XG4gICAgICAgIGlmIChob2xlU3RhdGVSZWMgPT0gb3V0UmVjMilcbiAgICAgICAgICBvdXRSZWMxLkZpcnN0TGVmdCA9IG91dFJlYzIuRmlyc3RMZWZ0O1xuICAgICAgICBvdXRSZWMyLkZpcnN0TGVmdCA9IG91dFJlYzE7XG4gICAgICAgIC8vZml4dXAgRmlyc3RMZWZ0IHBvaW50ZXJzIHRoYXQgbWF5IG5lZWQgcmVhc3NpZ25pbmcgdG8gT3V0UmVjMVxuICAgICAgICBpZiAodGhpcy5tX1VzaW5nUG9seVRyZWUpXG4gICAgICAgICAgdGhpcy5GaXh1cEZpcnN0TGVmdHMyKG91dFJlYzIsIG91dFJlYzEpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5VcGRhdGVPdXRQdElkeHMgPSBmdW5jdGlvbiAob3V0cmVjKVxuICB7XG4gICAgdmFyIG9wID0gb3V0cmVjLlB0cztcbiAgICBkbyB7XG4gICAgICBvcC5JZHggPSBvdXRyZWMuSWR4O1xuICAgICAgb3AgPSBvcC5QcmV2O1xuICAgIH1cbiAgICB3aGlsZSAob3AgIT0gb3V0cmVjLlB0cylcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5Eb1NpbXBsZVBvbHlnb25zID0gZnVuY3Rpb24gKClcbiAge1xuICAgIHZhciBpID0gMDtcbiAgICB3aGlsZSAoaSA8IHRoaXMubV9Qb2x5T3V0cy5sZW5ndGgpXG4gICAge1xuICAgICAgdmFyIG91dHJlYyA9IHRoaXMubV9Qb2x5T3V0c1tpKytdO1xuICAgICAgdmFyIG9wID0gb3V0cmVjLlB0cztcblx0XHRcdGlmIChvcCA9PSBudWxsIHx8IG91dHJlYy5Jc09wZW4pXG5cdFx0XHRcdGNvbnRpbnVlO1xuICAgICAgZG8gLy9mb3IgZWFjaCBQdCBpbiBQb2x5Z29uIHVudGlsIGR1cGxpY2F0ZSBmb3VuZCBkbyAuLi5cbiAgICAgIHtcbiAgICAgICAgdmFyIG9wMiA9IG9wLk5leHQ7XG4gICAgICAgIHdoaWxlIChvcDIgIT0gb3V0cmVjLlB0cylcbiAgICAgICAge1xuICAgICAgICAgIGlmICgoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShvcC5QdCwgb3AyLlB0KSkgJiYgb3AyLk5leHQgIT0gb3AgJiYgb3AyLlByZXYgIT0gb3ApXG4gICAgICAgICAge1xuICAgICAgICAgICAgLy9zcGxpdCB0aGUgcG9seWdvbiBpbnRvIHR3byAuLi5cbiAgICAgICAgICAgIHZhciBvcDMgPSBvcC5QcmV2O1xuICAgICAgICAgICAgdmFyIG9wNCA9IG9wMi5QcmV2O1xuICAgICAgICAgICAgb3AuUHJldiA9IG9wNDtcbiAgICAgICAgICAgIG9wNC5OZXh0ID0gb3A7XG4gICAgICAgICAgICBvcDIuUHJldiA9IG9wMztcbiAgICAgICAgICAgIG9wMy5OZXh0ID0gb3AyO1xuICAgICAgICAgICAgb3V0cmVjLlB0cyA9IG9wO1xuICAgICAgICAgICAgdmFyIG91dHJlYzIgPSB0aGlzLkNyZWF0ZU91dFJlYygpO1xuICAgICAgICAgICAgb3V0cmVjMi5QdHMgPSBvcDI7XG4gICAgICAgICAgICB0aGlzLlVwZGF0ZU91dFB0SWR4cyhvdXRyZWMyKTtcbiAgICAgICAgICAgIGlmICh0aGlzLlBvbHkyQ29udGFpbnNQb2x5MShvdXRyZWMyLlB0cywgb3V0cmVjLlB0cykpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIC8vT3V0UmVjMiBpcyBjb250YWluZWQgYnkgT3V0UmVjMSAuLi5cbiAgICAgICAgICAgICAgb3V0cmVjMi5Jc0hvbGUgPSAhb3V0cmVjLklzSG9sZTtcbiAgICAgICAgICAgICAgb3V0cmVjMi5GaXJzdExlZnQgPSBvdXRyZWM7XG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLm1fVXNpbmdQb2x5VHJlZSkgdGhpcy5GaXh1cEZpcnN0TGVmdHMyKG91dHJlYzIsIG91dHJlYyk7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuUG9seTJDb250YWluc1BvbHkxKG91dHJlYy5QdHMsIG91dHJlYzIuUHRzKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgLy9PdXRSZWMxIGlzIGNvbnRhaW5lZCBieSBPdXRSZWMyIC4uLlxuICAgICAgICAgICAgICBvdXRyZWMyLklzSG9sZSA9IG91dHJlYy5Jc0hvbGU7XG4gICAgICAgICAgICAgIG91dHJlYy5Jc0hvbGUgPSAhb3V0cmVjMi5Jc0hvbGU7XG4gICAgICAgICAgICAgIG91dHJlYzIuRmlyc3RMZWZ0ID0gb3V0cmVjLkZpcnN0TGVmdDtcbiAgICAgICAgICAgICAgb3V0cmVjLkZpcnN0TGVmdCA9IG91dHJlYzI7XG4gICAgICAgICAgICAgIGlmICh0aGlzLm1fVXNpbmdQb2x5VHJlZSkgdGhpcy5GaXh1cEZpcnN0TGVmdHMyKG91dHJlYywgb3V0cmVjMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIC8vdGhlIDIgcG9seWdvbnMgYXJlIHNlcGFyYXRlIC4uLlxuICAgICAgICAgICAgICBvdXRyZWMyLklzSG9sZSA9IG91dHJlYy5Jc0hvbGU7XG4gICAgICAgICAgICAgIG91dHJlYzIuRmlyc3RMZWZ0ID0gb3V0cmVjLkZpcnN0TGVmdDtcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMubV9Vc2luZ1BvbHlUcmVlKSB0aGlzLkZpeHVwRmlyc3RMZWZ0czEob3V0cmVjLCBvdXRyZWMyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9wMiA9IG9wO1xuICAgICAgICAgICAgLy9pZSBnZXQgcmVhZHkgZm9yIHRoZSBuZXh0IGl0ZXJhdGlvblxuICAgICAgICAgIH1cbiAgICAgICAgICBvcDIgPSBvcDIuTmV4dDtcbiAgICAgICAgfVxuICAgICAgICBvcCA9IG9wLk5leHQ7XG4gICAgICB9XG4gICAgICB3aGlsZSAob3AgIT0gb3V0cmVjLlB0cylcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5BcmVhID0gZnVuY3Rpb24gKHBvbHkpXG4gIHtcbiAgICB2YXIgY250ID0gcG9seS5sZW5ndGg7XG4gICAgaWYgKGNudCA8IDMpXG4gICAgICByZXR1cm4gMDtcbiAgICB2YXIgYSA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDAsIGogPSBjbnQgLSAxOyBpIDwgY250OyArK2kpXG4gICAge1xuICAgICAgYSArPSAocG9seVtqXS5YICsgcG9seVtpXS5YKSAqIChwb2x5W2pdLlkgLSBwb2x5W2ldLlkpO1xuICAgICAgaiA9IGk7XG4gICAgfVxuICAgIHJldHVybiAtYSAqIDAuNTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLnByb3RvdHlwZS5BcmVhID0gZnVuY3Rpb24gKG91dFJlYylcbiAge1xuICAgIHZhciBvcCA9IG91dFJlYy5QdHM7XG4gICAgaWYgKG9wID09IG51bGwpXG4gICAgICByZXR1cm4gMDtcbiAgICB2YXIgYSA9IDA7XG4gICAgZG8ge1xuICAgICAgYSA9IGEgKyAob3AuUHJldi5QdC5YICsgb3AuUHQuWCkgKiAob3AuUHJldi5QdC5ZIC0gb3AuUHQuWSk7XG4gICAgICBvcCA9IG9wLk5leHQ7XG4gICAgfVxuICAgIHdoaWxlIChvcCAhPSBvdXRSZWMuUHRzKVxuICAgIHJldHVybiBhICogMC41O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuU2ltcGxpZnlQb2x5Z29uID0gZnVuY3Rpb24gKHBvbHksIGZpbGxUeXBlKVxuICB7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBBcnJheSgpO1xuICAgIHZhciBjID0gbmV3IENsaXBwZXJMaWIuQ2xpcHBlcigwKTtcbiAgICBjLlN0cmljdGx5U2ltcGxlID0gdHJ1ZTtcbiAgICBjLkFkZFBhdGgocG9seSwgQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdFN1YmplY3QsIHRydWUpO1xuICAgIGMuRXhlY3V0ZShDbGlwcGVyTGliLkNsaXBUeXBlLmN0VW5pb24sIHJlc3VsdCwgZmlsbFR5cGUsIGZpbGxUeXBlKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuU2ltcGxpZnlQb2x5Z29ucyA9IGZ1bmN0aW9uIChwb2x5cywgZmlsbFR5cGUpXG4gIHtcbiAgICBpZiAodHlwZW9mIChmaWxsVHlwZSkgPT0gXCJ1bmRlZmluZWRcIikgZmlsbFR5cGUgPSBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRFdmVuT2RkO1xuICAgIHZhciByZXN1bHQgPSBuZXcgQXJyYXkoKTtcbiAgICB2YXIgYyA9IG5ldyBDbGlwcGVyTGliLkNsaXBwZXIoMCk7XG4gICAgYy5TdHJpY3RseVNpbXBsZSA9IHRydWU7XG4gICAgYy5BZGRQYXRocyhwb2x5cywgQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdFN1YmplY3QsIHRydWUpO1xuICAgIGMuRXhlY3V0ZShDbGlwcGVyTGliLkNsaXBUeXBlLmN0VW5pb24sIHJlc3VsdCwgZmlsbFR5cGUsIGZpbGxUeXBlKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuRGlzdGFuY2VTcXJkID0gZnVuY3Rpb24gKHB0MSwgcHQyKVxuICB7XG4gICAgdmFyIGR4ID0gKHB0MS5YIC0gcHQyLlgpO1xuICAgIHZhciBkeSA9IChwdDEuWSAtIHB0Mi5ZKTtcbiAgICByZXR1cm4gKGR4ICogZHggKyBkeSAqIGR5KTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLkRpc3RhbmNlRnJvbUxpbmVTcXJkID0gZnVuY3Rpb24gKHB0LCBsbjEsIGxuMilcbiAge1xuICAgIC8vVGhlIGVxdWF0aW9uIG9mIGEgbGluZSBpbiBnZW5lcmFsIGZvcm0gKEF4ICsgQnkgKyBDID0gMClcbiAgICAvL2dpdmVuIDIgcG9pbnRzICh4wrksecK5KSAmICh4wrIsecKyKSBpcyAuLi5cbiAgICAvLyh5wrkgLSB5wrIpeCArICh4wrIgLSB4wrkpeSArICh5wrIgLSB5wrkpeMK5IC0gKHjCsiAtIHjCuSl5wrkgPSAwXG4gICAgLy9BID0gKHnCuSAtIHnCsik7IEIgPSAoeMKyIC0geMK5KTsgQyA9ICh5wrIgLSB5wrkpeMK5IC0gKHjCsiAtIHjCuSl5wrlcbiAgICAvL3BlcnBlbmRpY3VsYXIgZGlzdGFuY2Ugb2YgcG9pbnQgKHjCsyx5wrMpID0gKEF4wrMgKyBCecKzICsgQykvU3FydChBwrIgKyBCwrIpXG4gICAgLy9zZWUgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9QZXJwZW5kaWN1bGFyX2Rpc3RhbmNlXG4gICAgdmFyIEEgPSBsbjEuWSAtIGxuMi5ZO1xuICAgIHZhciBCID0gbG4yLlggLSBsbjEuWDtcbiAgICB2YXIgQyA9IEEgKiBsbjEuWCArIEIgKiBsbjEuWTtcbiAgICBDID0gQSAqIHB0LlggKyBCICogcHQuWSAtIEM7XG4gICAgcmV0dXJuIChDICogQykgLyAoQSAqIEEgKyBCICogQik7XG4gIH07XG5cblx0Q2xpcHBlckxpYi5DbGlwcGVyLlNsb3Blc05lYXJDb2xsaW5lYXIgPSBmdW5jdGlvbihwdDEsIHB0MiwgcHQzLCBkaXN0U3FyZClcblx0e1xuXHRcdC8vdGhpcyBmdW5jdGlvbiBpcyBtb3JlIGFjY3VyYXRlIHdoZW4gdGhlIHBvaW50IHRoYXQncyBHRU9NRVRSSUNBTExZXG5cdFx0Ly9iZXR3ZWVuIHRoZSBvdGhlciAyIHBvaW50cyBpcyB0aGUgb25lIHRoYXQncyB0ZXN0ZWQgZm9yIGRpc3RhbmNlLlxuXHRcdC8vbmI6IHdpdGggJ3NwaWtlcycsIGVpdGhlciBwdDEgb3IgcHQzIGlzIGdlb21ldHJpY2FsbHkgYmV0d2VlbiB0aGUgb3RoZXIgcHRzXG5cdFx0aWYgKE1hdGguYWJzKHB0MS5YIC0gcHQyLlgpID4gTWF0aC5hYnMocHQxLlkgLSBwdDIuWSkpXG5cdFx0e1xuXHRcdGlmICgocHQxLlggPiBwdDIuWCkgPT0gKHB0MS5YIDwgcHQzLlgpKVxuXHRcdFx0cmV0dXJuIENsaXBwZXJMaWIuQ2xpcHBlci5EaXN0YW5jZUZyb21MaW5lU3FyZChwdDEsIHB0MiwgcHQzKSA8IGRpc3RTcXJkO1xuXHRcdGVsc2UgaWYgKChwdDIuWCA+IHB0MS5YKSA9PSAocHQyLlggPCBwdDMuWCkpXG5cdFx0XHRyZXR1cm4gQ2xpcHBlckxpYi5DbGlwcGVyLkRpc3RhbmNlRnJvbUxpbmVTcXJkKHB0MiwgcHQxLCBwdDMpIDwgZGlzdFNxcmQ7XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0cmV0dXJuIENsaXBwZXJMaWIuQ2xpcHBlci5EaXN0YW5jZUZyb21MaW5lU3FyZChwdDMsIHB0MSwgcHQyKSA8IGRpc3RTcXJkO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdGlmICgocHQxLlkgPiBwdDIuWSkgPT0gKHB0MS5ZIDwgcHQzLlkpKVxuXHRcdFx0cmV0dXJuIENsaXBwZXJMaWIuQ2xpcHBlci5EaXN0YW5jZUZyb21MaW5lU3FyZChwdDEsIHB0MiwgcHQzKSA8IGRpc3RTcXJkO1xuXHRcdGVsc2UgaWYgKChwdDIuWSA+IHB0MS5ZKSA9PSAocHQyLlkgPCBwdDMuWSkpXG5cdFx0XHRyZXR1cm4gQ2xpcHBlckxpYi5DbGlwcGVyLkRpc3RhbmNlRnJvbUxpbmVTcXJkKHB0MiwgcHQxLCBwdDMpIDwgZGlzdFNxcmQ7XG5cdFx0XHRcdGVsc2Vcblx0XHRcdHJldHVybiBDbGlwcGVyTGliLkNsaXBwZXIuRGlzdGFuY2VGcm9tTGluZVNxcmQocHQzLCBwdDEsIHB0MikgPCBkaXN0U3FyZDtcblx0XHR9XG5cdH1cblxuICBDbGlwcGVyTGliLkNsaXBwZXIuUG9pbnRzQXJlQ2xvc2UgPSBmdW5jdGlvbiAocHQxLCBwdDIsIGRpc3RTcXJkKVxuICB7XG4gICAgdmFyIGR4ID0gcHQxLlggLSBwdDIuWDtcbiAgICB2YXIgZHkgPSBwdDEuWSAtIHB0Mi5ZO1xuICAgIHJldHVybiAoKGR4ICogZHgpICsgKGR5ICogZHkpIDw9IGRpc3RTcXJkKTtcbiAgfTtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQ2xpcHBlckxpYi5DbGlwcGVyLkV4Y2x1ZGVPcCA9IGZ1bmN0aW9uIChvcClcbiAge1xuICAgIHZhciByZXN1bHQgPSBvcC5QcmV2O1xuICAgIHJlc3VsdC5OZXh0ID0gb3AuTmV4dDtcbiAgICBvcC5OZXh0LlByZXYgPSByZXN1bHQ7XG4gICAgcmVzdWx0LklkeCA9IDA7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLkNsZWFuUG9seWdvbiA9IGZ1bmN0aW9uIChwYXRoLCBkaXN0YW5jZSlcbiAge1xuICAgIGlmICh0eXBlb2YgKGRpc3RhbmNlKSA9PSBcInVuZGVmaW5lZFwiKSBkaXN0YW5jZSA9IDEuNDE1O1xuICAgIC8vZGlzdGFuY2UgPSBwcm94aW1pdHkgaW4gdW5pdHMvcGl4ZWxzIGJlbG93IHdoaWNoIHZlcnRpY2VzIHdpbGwgYmUgc3RyaXBwZWQuXG4gICAgLy9EZWZhdWx0IH49IHNxcnQoMikgc28gd2hlbiBhZGphY2VudCB2ZXJ0aWNlcyBvciBzZW1pLWFkamFjZW50IHZlcnRpY2VzIGhhdmVcbiAgICAvL2JvdGggeCAmIHkgY29vcmRzIHdpdGhpbiAxIHVuaXQsIHRoZW4gdGhlIHNlY29uZCB2ZXJ0ZXggd2lsbCBiZSBzdHJpcHBlZC5cbiAgICB2YXIgY250ID0gcGF0aC5sZW5ndGg7XG4gICAgaWYgKGNudCA9PSAwKVxuICAgICAgcmV0dXJuIG5ldyBBcnJheSgpO1xuICAgIHZhciBvdXRQdHMgPSBuZXcgQXJyYXkoY250KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNudDsgKytpKVxuICAgICAgb3V0UHRzW2ldID0gbmV3IENsaXBwZXJMaWIuT3V0UHQoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNudDsgKytpKVxuICAgIHtcbiAgICAgIG91dFB0c1tpXS5QdCA9IHBhdGhbaV07XG4gICAgICBvdXRQdHNbaV0uTmV4dCA9IG91dFB0c1soaSArIDEpICUgY250XTtcbiAgICAgIG91dFB0c1tpXS5OZXh0LlByZXYgPSBvdXRQdHNbaV07XG4gICAgICBvdXRQdHNbaV0uSWR4ID0gMDtcbiAgICB9XG4gICAgdmFyIGRpc3RTcXJkID0gZGlzdGFuY2UgKiBkaXN0YW5jZTtcbiAgICB2YXIgb3AgPSBvdXRQdHNbMF07XG4gICAgd2hpbGUgKG9wLklkeCA9PSAwICYmIG9wLk5leHQgIT0gb3AuUHJldilcbiAgICB7XG4gICAgICBpZiAoQ2xpcHBlckxpYi5DbGlwcGVyLlBvaW50c0FyZUNsb3NlKG9wLlB0LCBvcC5QcmV2LlB0LCBkaXN0U3FyZCkpXG4gICAgICB7XG4gICAgICAgIG9wID0gQ2xpcHBlckxpYi5DbGlwcGVyLkV4Y2x1ZGVPcChvcCk7XG4gICAgICAgIGNudC0tO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoQ2xpcHBlckxpYi5DbGlwcGVyLlBvaW50c0FyZUNsb3NlKG9wLlByZXYuUHQsIG9wLk5leHQuUHQsIGRpc3RTcXJkKSlcbiAgICAgIHtcbiAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyLkV4Y2x1ZGVPcChvcC5OZXh0KTtcbiAgICAgICAgb3AgPSBDbGlwcGVyTGliLkNsaXBwZXIuRXhjbHVkZU9wKG9wKTtcbiAgICAgICAgY250IC09IDI7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChDbGlwcGVyTGliLkNsaXBwZXIuU2xvcGVzTmVhckNvbGxpbmVhcihvcC5QcmV2LlB0LCBvcC5QdCwgb3AuTmV4dC5QdCwgZGlzdFNxcmQpKVxuICAgICAge1xuICAgICAgICBvcCA9IENsaXBwZXJMaWIuQ2xpcHBlci5FeGNsdWRlT3Aob3ApO1xuICAgICAgICBjbnQtLTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgb3AuSWR4ID0gMTtcbiAgICAgICAgb3AgPSBvcC5OZXh0O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY250IDwgMylcbiAgICAgIGNudCA9IDA7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBBcnJheShjbnQpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY250OyArK2kpXG4gICAge1xuICAgICAgcmVzdWx0W2ldID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQob3AuUHQpO1xuICAgICAgb3AgPSBvcC5OZXh0O1xuICAgIH1cbiAgICBvdXRQdHMgPSBudWxsO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5DbGVhblBvbHlnb25zID0gZnVuY3Rpb24gKHBvbHlzLCBkaXN0YW5jZSlcbiAge1xuICAgIHZhciByZXN1bHQgPSBuZXcgQXJyYXkocG9seXMubGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgaWxlbiA9IHBvbHlzLmxlbmd0aDsgaSA8IGlsZW47IGkrKylcbiAgICAgIHJlc3VsdFtpXSA9IENsaXBwZXJMaWIuQ2xpcHBlci5DbGVhblBvbHlnb24ocG9seXNbaV0sIGRpc3RhbmNlKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXIuTWlua293c2tpID0gZnVuY3Rpb24gKHBhdHRlcm4sIHBhdGgsIElzU3VtLCBJc0Nsb3NlZClcbiAge1xuICAgIHZhciBkZWx0YSA9IChJc0Nsb3NlZCA/IDEgOiAwKTtcbiAgICB2YXIgcG9seUNudCA9IHBhdHRlcm4ubGVuZ3RoO1xuICAgIHZhciBwYXRoQ250ID0gcGF0aC5sZW5ndGg7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBBcnJheSgpO1xuICAgIGlmIChJc1N1bSlcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aENudDsgaSsrKVxuICAgICAge1xuICAgICAgICB2YXIgcCA9IG5ldyBBcnJheShwb2x5Q250KTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDAsIGpsZW4gPSBwYXR0ZXJuLmxlbmd0aCwgaXAgPSBwYXR0ZXJuW2pdOyBqIDwgamxlbjsgaisrLCBpcCA9IHBhdHRlcm5bal0pXG4gICAgICAgICAgcFtqXSA9IG5ldyBDbGlwcGVyTGliLkludFBvaW50KHBhdGhbaV0uWCArIGlwLlgsIHBhdGhbaV0uWSArIGlwLlkpO1xuICAgICAgICByZXN1bHQucHVzaChwKTtcbiAgICAgIH1cbiAgICBlbHNlXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGhDbnQ7IGkrKylcbiAgICAgIHtcbiAgICAgICAgdmFyIHAgPSBuZXcgQXJyYXkocG9seUNudCk7XG4gICAgICAgIGZvciAodmFyIGogPSAwLCBqbGVuID0gcGF0dGVybi5sZW5ndGgsIGlwID0gcGF0dGVybltqXTsgaiA8IGpsZW47IGorKywgaXAgPSBwYXR0ZXJuW2pdKVxuICAgICAgICAgIHBbal0gPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChwYXRoW2ldLlggLSBpcC5YLCBwYXRoW2ldLlkgLSBpcC5ZKTtcbiAgICAgICAgcmVzdWx0LnB1c2gocCk7XG4gICAgICB9XG4gICAgdmFyIHF1YWRzID0gbmV3IEFycmF5KCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoQ250IC0gMSArIGRlbHRhOyBpKyspXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHBvbHlDbnQ7IGorKylcbiAgICAgIHtcbiAgICAgICAgdmFyIHF1YWQgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgcXVhZC5wdXNoKHJlc3VsdFtpICUgcGF0aENudF1baiAlIHBvbHlDbnRdKTtcbiAgICAgICAgcXVhZC5wdXNoKHJlc3VsdFsoaSArIDEpICUgcGF0aENudF1baiAlIHBvbHlDbnRdKTtcbiAgICAgICAgcXVhZC5wdXNoKHJlc3VsdFsoaSArIDEpICUgcGF0aENudF1bKGogKyAxKSAlIHBvbHlDbnRdKTtcbiAgICAgICAgcXVhZC5wdXNoKHJlc3VsdFtpICUgcGF0aENudF1bKGogKyAxKSAlIHBvbHlDbnRdKTtcbiAgICAgICAgaWYgKCFDbGlwcGVyTGliLkNsaXBwZXIuT3JpZW50YXRpb24ocXVhZCkpXG4gICAgICAgICAgcXVhZC5yZXZlcnNlKCk7XG4gICAgICAgIHF1YWRzLnB1c2gocXVhZCk7XG4gICAgICB9XG5cdFx0XHRyZXR1cm4gcXVhZHM7XG4gIH07XG5cblx0Q2xpcHBlckxpYi5DbGlwcGVyLk1pbmtvd3NraVN1bSA9IGZ1bmN0aW9uKHBhdHRlcm4sIHBhdGhfb3JfcGF0aHMsIHBhdGhJc0Nsb3NlZClcblx0e1xuXHRcdGlmKCEocGF0aF9vcl9wYXRoc1swXSBpbnN0YW5jZW9mIEFycmF5KSlcblx0XHR7XG5cdFx0XHR2YXIgcGF0aCA9IHBhdGhfb3JfcGF0aHM7XG5cdFx0XHR2YXIgcGF0aHMgPSBDbGlwcGVyTGliLkNsaXBwZXIuTWlua293c2tpKHBhdHRlcm4sIHBhdGgsIHRydWUsIHBhdGhJc0Nsb3NlZCk7XG5cdFx0XHR2YXIgYyA9IG5ldyBDbGlwcGVyTGliLkNsaXBwZXIoKTtcblx0XHRcdGMuQWRkUGF0aHMocGF0aHMsIENsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0LCB0cnVlKTtcblx0XHRcdGMuRXhlY3V0ZShDbGlwcGVyTGliLkNsaXBUeXBlLmN0VW5pb24sIHBhdGhzLCBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvLCBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROb25aZXJvKTtcblx0XHRcdHJldHVybiBwYXRocztcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcbiBcdFx0XHR2YXIgcGF0aHMgPSBwYXRoX29yX3BhdGhzO1xuXHRcdFx0dmFyIHNvbHV0aW9uID0gbmV3IENsaXBwZXJMaWIuUGF0aHMoKTtcblx0XHRcdHZhciBjID0gbmV3IENsaXBwZXJMaWIuQ2xpcHBlcigpO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBwYXRocy5sZW5ndGg7ICsraSlcblx0XHRcdHtcblx0XHRcdFx0dmFyIHRtcCA9IENsaXBwZXJMaWIuQ2xpcHBlci5NaW5rb3dza2kocGF0dGVybiwgcGF0aHNbaV0sIHRydWUsIHBhdGhJc0Nsb3NlZCk7XG5cdFx0XHRcdGMuQWRkUGF0aHModG1wLCBDbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdCwgdHJ1ZSk7XG5cdFx0XHRcdGlmIChwYXRoSXNDbG9zZWQpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR2YXIgcGF0aCA9IENsaXBwZXJMaWIuQ2xpcHBlci5UcmFuc2xhdGVQYXRoKHBhdGhzW2ldLCBwYXR0ZXJuWzBdKTtcblx0XHRcdFx0XHRjLkFkZFBhdGgocGF0aCwgQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdENsaXAsIHRydWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRjLkV4ZWN1dGUoQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFVuaW9uLCBzb2x1dGlvbixcblx0XHRcdFx0Q2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybywgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0Tm9uWmVybyk7XG5cdFx0XHRyZXR1cm4gc29sdXRpb247XG5cdFx0fVxuXHR9XG5cdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0Q2xpcHBlckxpYi5DbGlwcGVyLlRyYW5zbGF0ZVBhdGggPSBmdW5jdGlvbiAocGF0aCwgZGVsdGEpXG5cdHtcblx0XHR2YXIgb3V0UGF0aCA9IG5ldyBDbGlwcGVyTGliLlBhdGgoKTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHBhdGgubGVuZ3RoOyBpKyspXG5cdFx0XHRvdXRQYXRoLnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQocGF0aFtpXS5YICsgZGVsdGEuWCwgcGF0aFtpXS5ZICsgZGVsdGEuWSkpO1xuXHRcdHJldHVybiBvdXRQYXRoO1xuXHR9XG5cdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0Q2xpcHBlckxpYi5DbGlwcGVyLk1pbmtvd3NraURpZmYgPSBmdW5jdGlvbiAocG9seTEsIHBvbHkyKVxuXHR7XG5cdFx0dmFyIHBhdGhzID0gQ2xpcHBlckxpYi5DbGlwcGVyLk1pbmtvd3NraShwb2x5MSwgcG9seTIsIGZhbHNlLCB0cnVlKTtcblx0XHR2YXIgYyA9IG5ldyBDbGlwcGVyTGliLkNsaXBwZXIoKTtcblx0XHRjLkFkZFBhdGhzKHBhdGhzLCBDbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdCwgdHJ1ZSk7XG5cdFx0Yy5FeGVjdXRlKENsaXBwZXJMaWIuQ2xpcFR5cGUuY3RVbmlvbiwgcGF0aHMsIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm8sIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5vblplcm8pO1xuXHRcdHJldHVybiBwYXRocztcblx0fVxuXG4gIENsaXBwZXJMaWIuQ2xpcHBlci5Qb2x5VHJlZVRvUGF0aHMgPSBmdW5jdGlvbiAocG9seXRyZWUpXG4gIHtcbiAgICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KCk7XG4gICAgLy9yZXN1bHQuc2V0X0NhcGFjaXR5KHBvbHl0cmVlLmdldF9Ub3RhbCgpKTtcbiAgICBDbGlwcGVyTGliLkNsaXBwZXIuQWRkUG9seU5vZGVUb1BhdGhzKHBvbHl0cmVlLCBDbGlwcGVyTGliLkNsaXBwZXIuTm9kZVR5cGUubnRBbnksIHJlc3VsdCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLkFkZFBvbHlOb2RlVG9QYXRocyA9IGZ1bmN0aW9uIChwb2x5bm9kZSwgbnQsIHBhdGhzKVxuICB7XG4gICAgdmFyIG1hdGNoID0gdHJ1ZTtcbiAgICBzd2l0Y2ggKG50KVxuICAgIHtcbiAgICBjYXNlIENsaXBwZXJMaWIuQ2xpcHBlci5Ob2RlVHlwZS5udE9wZW46XG4gICAgICByZXR1cm47XG4gICAgY2FzZSBDbGlwcGVyTGliLkNsaXBwZXIuTm9kZVR5cGUubnRDbG9zZWQ6XG4gICAgICBtYXRjaCA9ICFwb2x5bm9kZS5Jc09wZW47XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChwb2x5bm9kZS5tX3BvbHlnb24ubGVuZ3RoID4gMCAmJiBtYXRjaClcbiAgICAgIHBhdGhzLnB1c2gocG9seW5vZGUubV9wb2x5Z29uKTtcbiAgICBmb3IgKHZhciAkaTMgPSAwLCAkdDMgPSBwb2x5bm9kZS5DaGlsZHMoKSwgJGwzID0gJHQzLmxlbmd0aCwgcG4gPSAkdDNbJGkzXTsgJGkzIDwgJGwzOyAkaTMrKywgcG4gPSAkdDNbJGkzXSlcbiAgICAgIENsaXBwZXJMaWIuQ2xpcHBlci5BZGRQb2x5Tm9kZVRvUGF0aHMocG4sIG50LCBwYXRocyk7XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5PcGVuUGF0aHNGcm9tUG9seVRyZWUgPSBmdW5jdGlvbiAocG9seXRyZWUpXG4gIHtcbiAgICB2YXIgcmVzdWx0ID0gbmV3IENsaXBwZXJMaWIuUGF0aHMoKTtcbiAgICAvL3Jlc3VsdC5zZXRfQ2FwYWNpdHkocG9seXRyZWUuQ2hpbGRDb3VudCgpKTtcbiAgICBmb3IgKHZhciBpID0gMCwgaWxlbiA9IHBvbHl0cmVlLkNoaWxkQ291bnQoKTsgaSA8IGlsZW47IGkrKylcbiAgICAgIGlmIChwb2x5dHJlZS5DaGlsZHMoKVtpXS5Jc09wZW4pXG4gICAgICAgIHJlc3VsdC5wdXNoKHBvbHl0cmVlLkNoaWxkcygpW2ldLm1fcG9seWdvbik7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyLkNsb3NlZFBhdGhzRnJvbVBvbHlUcmVlID0gZnVuY3Rpb24gKHBvbHl0cmVlKVxuICB7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBDbGlwcGVyTGliLlBhdGhzKCk7XG4gICAgLy9yZXN1bHQuc2V0X0NhcGFjaXR5KHBvbHl0cmVlLlRvdGFsKCkpO1xuICAgIENsaXBwZXJMaWIuQ2xpcHBlci5BZGRQb2x5Tm9kZVRvUGF0aHMocG9seXRyZWUsIENsaXBwZXJMaWIuQ2xpcHBlci5Ob2RlVHlwZS5udENsb3NlZCwgcmVzdWx0KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBJbmhlcml0KENsaXBwZXJMaWIuQ2xpcHBlciwgQ2xpcHBlckxpYi5DbGlwcGVyQmFzZSk7XG4gIENsaXBwZXJMaWIuQ2xpcHBlci5Ob2RlVHlwZSA9IHtcbiAgICBudEFueTogMCxcbiAgICBudE9wZW46IDEsXG4gICAgbnRDbG9zZWQ6IDJcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0ID0gZnVuY3Rpb24gKG1pdGVyTGltaXQsIGFyY1RvbGVyYW5jZSlcbiAge1xuICAgIGlmICh0eXBlb2YgKG1pdGVyTGltaXQpID09IFwidW5kZWZpbmVkXCIpIG1pdGVyTGltaXQgPSAyO1xuICAgIGlmICh0eXBlb2YgKGFyY1RvbGVyYW5jZSkgPT0gXCJ1bmRlZmluZWRcIikgYXJjVG9sZXJhbmNlID0gQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LmRlZl9hcmNfdG9sZXJhbmNlO1xuICAgIHRoaXMubV9kZXN0UG9seXMgPSBuZXcgQ2xpcHBlckxpYi5QYXRocygpO1xuICAgIHRoaXMubV9zcmNQb2x5ID0gbmV3IENsaXBwZXJMaWIuUGF0aCgpO1xuICAgIHRoaXMubV9kZXN0UG9seSA9IG5ldyBDbGlwcGVyTGliLlBhdGgoKTtcbiAgICB0aGlzLm1fbm9ybWFscyA9IG5ldyBBcnJheSgpO1xuICAgIHRoaXMubV9kZWx0YSA9IDA7XG4gICAgdGhpcy5tX3NpbkEgPSAwO1xuICAgIHRoaXMubV9zaW4gPSAwO1xuICAgIHRoaXMubV9jb3MgPSAwO1xuICAgIHRoaXMubV9taXRlckxpbSA9IDA7XG4gICAgdGhpcy5tX1N0ZXBzUGVyUmFkID0gMDtcbiAgICB0aGlzLm1fbG93ZXN0ID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQoKTtcbiAgICB0aGlzLm1fcG9seU5vZGVzID0gbmV3IENsaXBwZXJMaWIuUG9seU5vZGUoKTtcbiAgICB0aGlzLk1pdGVyTGltaXQgPSBtaXRlckxpbWl0O1xuICAgIHRoaXMuQXJjVG9sZXJhbmNlID0gYXJjVG9sZXJhbmNlO1xuICAgIHRoaXMubV9sb3dlc3QuWCA9IC0xO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQudHdvX3BpID0gNi4yODMxODUzMDcxNzk1OTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LmRlZl9hcmNfdG9sZXJhbmNlID0gMC4yNTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LnByb3RvdHlwZS5DbGVhciA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICBDbGlwcGVyTGliLkNsZWFyKHRoaXMubV9wb2x5Tm9kZXMuQ2hpbGRzKCkpO1xuICAgIHRoaXMubV9sb3dlc3QuWCA9IC0xO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQgPSBDbGlwcGVyTGliLkNsaXBwZXIuUm91bmQ7XG4gIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5wcm90b3R5cGUuQWRkUGF0aCA9IGZ1bmN0aW9uIChwYXRoLCBqb2luVHlwZSwgZW5kVHlwZSlcbiAge1xuICAgIHZhciBoaWdoSSA9IHBhdGgubGVuZ3RoIC0gMTtcbiAgICBpZiAoaGlnaEkgPCAwKVxuICAgICAgcmV0dXJuO1xuICAgIHZhciBuZXdOb2RlID0gbmV3IENsaXBwZXJMaWIuUG9seU5vZGUoKTtcbiAgICBuZXdOb2RlLm1fam9pbnR5cGUgPSBqb2luVHlwZTtcbiAgICBuZXdOb2RlLm1fZW5kdHlwZSA9IGVuZFR5cGU7XG4gICAgLy9zdHJpcCBkdXBsaWNhdGUgcG9pbnRzIGZyb20gcGF0aCBhbmQgYWxzbyBnZXQgaW5kZXggdG8gdGhlIGxvd2VzdCBwb2ludCAuLi5cbiAgICBpZiAoZW5kVHlwZSA9PSBDbGlwcGVyTGliLkVuZFR5cGUuZXRDbG9zZWRMaW5lIHx8IGVuZFR5cGUgPT0gQ2xpcHBlckxpYi5FbmRUeXBlLmV0Q2xvc2VkUG9seWdvbilcbiAgICAgIHdoaWxlIChoaWdoSSA+IDAgJiYgQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9FcXVhbGl0eShwYXRoWzBdLCBwYXRoW2hpZ2hJXSkpXG4gICAgICAgIGhpZ2hJLS07XG4gICAgLy9uZXdOb2RlLm1fcG9seWdvbi5zZXRfQ2FwYWNpdHkoaGlnaEkgKyAxKTtcbiAgICBuZXdOb2RlLm1fcG9seWdvbi5wdXNoKHBhdGhbMF0pO1xuICAgIHZhciBqID0gMCxcbiAgICAgIGsgPSAwO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDw9IGhpZ2hJOyBpKyspXG4gICAgICBpZiAoQ2xpcHBlckxpYi5JbnRQb2ludC5vcF9JbmVxdWFsaXR5KG5ld05vZGUubV9wb2x5Z29uW2pdLCBwYXRoW2ldKSlcbiAgICAgIHtcbiAgICAgICAgaisrO1xuICAgICAgICBuZXdOb2RlLm1fcG9seWdvbi5wdXNoKHBhdGhbaV0pO1xuICAgICAgICBpZiAocGF0aFtpXS5ZID4gbmV3Tm9kZS5tX3BvbHlnb25ba10uWSB8fCAocGF0aFtpXS5ZID09IG5ld05vZGUubV9wb2x5Z29uW2tdLlkgJiYgcGF0aFtpXS5YIDwgbmV3Tm9kZS5tX3BvbHlnb25ba10uWCkpXG4gICAgICAgICAgayA9IGo7XG4gICAgICB9XG4gICAgaWYgKGVuZFR5cGUgPT0gQ2xpcHBlckxpYi5FbmRUeXBlLmV0Q2xvc2VkUG9seWdvbiAmJiBqIDwgMikgcmV0dXJuO1xuXG4gICAgdGhpcy5tX3BvbHlOb2Rlcy5BZGRDaGlsZChuZXdOb2RlKTtcbiAgICAvL2lmIHRoaXMgcGF0aCdzIGxvd2VzdCBwdCBpcyBsb3dlciB0aGFuIGFsbCB0aGUgb3RoZXJzIHRoZW4gdXBkYXRlIG1fbG93ZXN0XG4gICAgaWYgKGVuZFR5cGUgIT0gQ2xpcHBlckxpYi5FbmRUeXBlLmV0Q2xvc2VkUG9seWdvbilcbiAgICAgIHJldHVybjtcbiAgICBpZiAodGhpcy5tX2xvd2VzdC5YIDwgMClcbiAgICAgIHRoaXMubV9sb3dlc3QgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludCh0aGlzLm1fcG9seU5vZGVzLkNoaWxkQ291bnQoKSAtIDEsIGspO1xuICAgIGVsc2VcbiAgICB7XG4gICAgICB2YXIgaXAgPSB0aGlzLm1fcG9seU5vZGVzLkNoaWxkcygpW3RoaXMubV9sb3dlc3QuWF0ubV9wb2x5Z29uW3RoaXMubV9sb3dlc3QuWV07XG4gICAgICBpZiAobmV3Tm9kZS5tX3BvbHlnb25ba10uWSA+IGlwLlkgfHwgKG5ld05vZGUubV9wb2x5Z29uW2tdLlkgPT0gaXAuWSAmJiBuZXdOb2RlLm1fcG9seWdvbltrXS5YIDwgaXAuWCkpXG4gICAgICAgIHRoaXMubV9sb3dlc3QgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludCh0aGlzLm1fcG9seU5vZGVzLkNoaWxkQ291bnQoKSAtIDEsIGspO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LnByb3RvdHlwZS5BZGRQYXRocyA9IGZ1bmN0aW9uIChwYXRocywgam9pblR5cGUsIGVuZFR5cGUpXG4gIHtcbiAgICBmb3IgKHZhciBpID0gMCwgaWxlbiA9IHBhdGhzLmxlbmd0aDsgaSA8IGlsZW47IGkrKylcbiAgICAgIHRoaXMuQWRkUGF0aChwYXRoc1tpXSwgam9pblR5cGUsIGVuZFR5cGUpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQucHJvdG90eXBlLkZpeE9yaWVudGF0aW9ucyA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICAvL2ZpeHVwIG9yaWVudGF0aW9ucyBvZiBhbGwgY2xvc2VkIHBhdGhzIGlmIHRoZSBvcmllbnRhdGlvbiBvZiB0aGVcbiAgICAvL2Nsb3NlZCBwYXRoIHdpdGggdGhlIGxvd2VybW9zdCB2ZXJ0ZXggaXMgd3JvbmcgLi4uXG4gICAgaWYgKHRoaXMubV9sb3dlc3QuWCA+PSAwICYmICFDbGlwcGVyTGliLkNsaXBwZXIuT3JpZW50YXRpb24odGhpcy5tX3BvbHlOb2Rlcy5DaGlsZHMoKVt0aGlzLm1fbG93ZXN0LlhdLm1fcG9seWdvbikpXG4gICAge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1fcG9seU5vZGVzLkNoaWxkQ291bnQoKTsgaSsrKVxuICAgICAge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubV9wb2x5Tm9kZXMuQ2hpbGRzKClbaV07XG4gICAgICAgIGlmIChub2RlLm1fZW5kdHlwZSA9PSBDbGlwcGVyTGliLkVuZFR5cGUuZXRDbG9zZWRQb2x5Z29uIHx8IChub2RlLm1fZW5kdHlwZSA9PSBDbGlwcGVyTGliLkVuZFR5cGUuZXRDbG9zZWRMaW5lICYmIENsaXBwZXJMaWIuQ2xpcHBlci5PcmllbnRhdGlvbihub2RlLm1fcG9seWdvbikpKVxuICAgICAgICAgIG5vZGUubV9wb2x5Z29uLnJldmVyc2UoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tX3BvbHlOb2Rlcy5DaGlsZENvdW50KCk7IGkrKylcbiAgICAgIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm1fcG9seU5vZGVzLkNoaWxkcygpW2ldO1xuICAgICAgICBpZiAobm9kZS5tX2VuZHR5cGUgPT0gQ2xpcHBlckxpYi5FbmRUeXBlLmV0Q2xvc2VkTGluZSAmJiAhQ2xpcHBlckxpYi5DbGlwcGVyLk9yaWVudGF0aW9uKG5vZGUubV9wb2x5Z29uKSlcbiAgICAgICAgICBub2RlLm1fcG9seWdvbi5yZXZlcnNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuR2V0VW5pdE5vcm1hbCA9IGZ1bmN0aW9uIChwdDEsIHB0MilcbiAge1xuICAgIHZhciBkeCA9IChwdDIuWCAtIHB0MS5YKTtcbiAgICB2YXIgZHkgPSAocHQyLlkgLSBwdDEuWSk7XG4gICAgaWYgKChkeCA9PSAwKSAmJiAoZHkgPT0gMCkpXG4gICAgICByZXR1cm4gbmV3IENsaXBwZXJMaWIuRG91YmxlUG9pbnQoMCwgMCk7XG4gICAgdmFyIGYgPSAxIC8gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcbiAgICBkeCAqPSBmO1xuICAgIGR5ICo9IGY7XG4gICAgcmV0dXJuIG5ldyBDbGlwcGVyTGliLkRvdWJsZVBvaW50KGR5LCAtZHgpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQucHJvdG90eXBlLkRvT2Zmc2V0ID0gZnVuY3Rpb24gKGRlbHRhKVxuICB7XG4gICAgdGhpcy5tX2Rlc3RQb2x5cyA9IG5ldyBBcnJheSgpO1xuICAgIHRoaXMubV9kZWx0YSA9IGRlbHRhO1xuICAgIC8vaWYgWmVybyBvZmZzZXQsIGp1c3QgY29weSBhbnkgQ0xPU0VEIHBvbHlnb25zIHRvIG1fcCBhbmQgcmV0dXJuIC4uLlxuICAgIGlmIChDbGlwcGVyTGliLkNsaXBwZXJCYXNlLm5lYXJfemVybyhkZWx0YSkpXG4gICAge1xuICAgICAgLy90aGlzLm1fZGVzdFBvbHlzLnNldF9DYXBhY2l0eSh0aGlzLm1fcG9seU5vZGVzLkNoaWxkQ291bnQpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1fcG9seU5vZGVzLkNoaWxkQ291bnQoKTsgaSsrKVxuICAgICAge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubV9wb2x5Tm9kZXMuQ2hpbGRzKClbaV07XG4gICAgICAgIGlmIChub2RlLm1fZW5kdHlwZSA9PSBDbGlwcGVyTGliLkVuZFR5cGUuZXRDbG9zZWRQb2x5Z29uKVxuICAgICAgICAgIHRoaXMubV9kZXN0UG9seXMucHVzaChub2RlLm1fcG9seWdvbik7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vc2VlIG9mZnNldF90cmlnaW5vbWV0cnkzLnN2ZyBpbiB0aGUgZG9jdW1lbnRhdGlvbiBmb2xkZXIgLi4uXG4gICAgaWYgKHRoaXMuTWl0ZXJMaW1pdCA+IDIpXG4gICAgICB0aGlzLm1fbWl0ZXJMaW0gPSAyIC8gKHRoaXMuTWl0ZXJMaW1pdCAqIHRoaXMuTWl0ZXJMaW1pdCk7XG4gICAgZWxzZVxuICAgICAgdGhpcy5tX21pdGVyTGltID0gMC41O1xuICAgIHZhciB5O1xuICAgIGlmICh0aGlzLkFyY1RvbGVyYW5jZSA8PSAwKVxuICAgICAgeSA9IENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5kZWZfYXJjX3RvbGVyYW5jZTtcbiAgICBlbHNlIGlmICh0aGlzLkFyY1RvbGVyYW5jZSA+IE1hdGguYWJzKGRlbHRhKSAqIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5kZWZfYXJjX3RvbGVyYW5jZSlcbiAgICAgIHkgPSBNYXRoLmFicyhkZWx0YSkgKiBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuZGVmX2FyY190b2xlcmFuY2U7XG4gICAgZWxzZVxuICAgICAgeSA9IHRoaXMuQXJjVG9sZXJhbmNlO1xuICAgIC8vc2VlIG9mZnNldF90cmlnaW5vbWV0cnkyLnN2ZyBpbiB0aGUgZG9jdW1lbnRhdGlvbiBmb2xkZXIgLi4uXG4gICAgdmFyIHN0ZXBzID0gMy4xNDE1OTI2NTM1ODk3OSAvIE1hdGguYWNvcygxIC0geSAvIE1hdGguYWJzKGRlbHRhKSk7XG4gICAgdGhpcy5tX3NpbiA9IE1hdGguc2luKENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC50d29fcGkgLyBzdGVwcyk7XG4gICAgdGhpcy5tX2NvcyA9IE1hdGguY29zKENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC50d29fcGkgLyBzdGVwcyk7XG4gICAgdGhpcy5tX1N0ZXBzUGVyUmFkID0gc3RlcHMgLyBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQudHdvX3BpO1xuICAgIGlmIChkZWx0YSA8IDApXG4gICAgICB0aGlzLm1fc2luID0gLXRoaXMubV9zaW47XG4gICAgLy90aGlzLm1fZGVzdFBvbHlzLnNldF9DYXBhY2l0eSh0aGlzLm1fcG9seU5vZGVzLkNoaWxkQ291bnQgKiAyKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubV9wb2x5Tm9kZXMuQ2hpbGRDb3VudCgpOyBpKyspXG4gICAge1xuICAgICAgdmFyIG5vZGUgPSB0aGlzLm1fcG9seU5vZGVzLkNoaWxkcygpW2ldO1xuICAgICAgdGhpcy5tX3NyY1BvbHkgPSBub2RlLm1fcG9seWdvbjtcbiAgICAgIHZhciBsZW4gPSB0aGlzLm1fc3JjUG9seS5sZW5ndGg7XG4gICAgICBpZiAobGVuID09IDAgfHwgKGRlbHRhIDw9IDAgJiYgKGxlbiA8IDMgfHwgbm9kZS5tX2VuZHR5cGUgIT0gQ2xpcHBlckxpYi5FbmRUeXBlLmV0Q2xvc2VkUG9seWdvbikpKVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIHRoaXMubV9kZXN0UG9seSA9IG5ldyBBcnJheSgpO1xuICAgICAgaWYgKGxlbiA9PSAxKVxuICAgICAge1xuICAgICAgICBpZiAobm9kZS5tX2pvaW50eXBlID09IENsaXBwZXJMaWIuSm9pblR5cGUuanRSb3VuZClcbiAgICAgICAge1xuICAgICAgICAgIHZhciBYID0gMSxcbiAgICAgICAgICAgIFkgPSAwO1xuICAgICAgICAgIGZvciAodmFyIGogPSAxOyBqIDw9IHN0ZXBzOyBqKyspXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5tX2Rlc3RQb2x5LnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5WzBdLlggKyBYICogZGVsdGEpLCBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbMF0uWSArIFkgKiBkZWx0YSkpKTtcbiAgICAgICAgICAgIHZhciBYMiA9IFg7XG4gICAgICAgICAgICBYID0gWCAqIHRoaXMubV9jb3MgLSB0aGlzLm1fc2luICogWTtcbiAgICAgICAgICAgIFkgPSBYMiAqIHRoaXMubV9zaW4gKyBZICogdGhpcy5tX2NvcztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgdmFyIFggPSAtMSxcbiAgICAgICAgICAgIFkgPSAtMTtcbiAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDQ7ICsrailcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLm1fZGVzdFBvbHkucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbMF0uWCArIFggKiBkZWx0YSksIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVswXS5ZICsgWSAqIGRlbHRhKSkpO1xuICAgICAgICAgICAgaWYgKFggPCAwKVxuICAgICAgICAgICAgICBYID0gMTtcbiAgICAgICAgICAgIGVsc2UgaWYgKFkgPCAwKVxuICAgICAgICAgICAgICBZID0gMTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgWCA9IC0xO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1fZGVzdFBvbHlzLnB1c2godGhpcy5tX2Rlc3RQb2x5KTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvL2J1aWxkIG1fbm9ybWFscyAuLi5cbiAgICAgIHRoaXMubV9ub3JtYWxzLmxlbmd0aCA9IDA7XG4gICAgICAvL3RoaXMubV9ub3JtYWxzLnNldF9DYXBhY2l0eShsZW4pO1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBsZW4gLSAxOyBqKyspXG4gICAgICAgIHRoaXMubV9ub3JtYWxzLnB1c2goQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LkdldFVuaXROb3JtYWwodGhpcy5tX3NyY1BvbHlbal0sIHRoaXMubV9zcmNQb2x5W2ogKyAxXSkpO1xuICAgICAgaWYgKG5vZGUubV9lbmR0eXBlID09IENsaXBwZXJMaWIuRW5kVHlwZS5ldENsb3NlZExpbmUgfHwgbm9kZS5tX2VuZHR5cGUgPT0gQ2xpcHBlckxpYi5FbmRUeXBlLmV0Q2xvc2VkUG9seWdvbilcbiAgICAgICAgdGhpcy5tX25vcm1hbHMucHVzaChDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuR2V0VW5pdE5vcm1hbCh0aGlzLm1fc3JjUG9seVtsZW4gLSAxXSwgdGhpcy5tX3NyY1BvbHlbMF0pKTtcbiAgICAgIGVsc2VcbiAgICAgICAgdGhpcy5tX25vcm1hbHMucHVzaChuZXcgQ2xpcHBlckxpYi5Eb3VibGVQb2ludCh0aGlzLm1fbm9ybWFsc1tsZW4gLSAyXSkpO1xuICAgICAgaWYgKG5vZGUubV9lbmR0eXBlID09IENsaXBwZXJMaWIuRW5kVHlwZS5ldENsb3NlZFBvbHlnb24pXG4gICAgICB7XG4gICAgICAgIHZhciBrID0gbGVuIC0gMTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBsZW47IGorKylcbiAgICAgICAgICBrID0gdGhpcy5PZmZzZXRQb2ludChqLCBrLCBub2RlLm1fam9pbnR5cGUpO1xuICAgICAgICB0aGlzLm1fZGVzdFBvbHlzLnB1c2godGhpcy5tX2Rlc3RQb2x5KTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG5vZGUubV9lbmR0eXBlID09IENsaXBwZXJMaWIuRW5kVHlwZS5ldENsb3NlZExpbmUpXG4gICAgICB7XG4gICAgICAgIHZhciBrID0gbGVuIC0gMTtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBsZW47IGorKylcbiAgICAgICAgICBrID0gdGhpcy5PZmZzZXRQb2ludChqLCBrLCBub2RlLm1fam9pbnR5cGUpO1xuICAgICAgICB0aGlzLm1fZGVzdFBvbHlzLnB1c2godGhpcy5tX2Rlc3RQb2x5KTtcbiAgICAgICAgdGhpcy5tX2Rlc3RQb2x5ID0gbmV3IEFycmF5KCk7XG4gICAgICAgIC8vcmUtYnVpbGQgbV9ub3JtYWxzIC4uLlxuICAgICAgICB2YXIgbiA9IHRoaXMubV9ub3JtYWxzW2xlbiAtIDFdO1xuICAgICAgICBmb3IgKHZhciBqID0gbGVuIC0gMTsgaiA+IDA7IGotLSlcbiAgICAgICAgICB0aGlzLm1fbm9ybWFsc1tqXSA9IG5ldyBDbGlwcGVyTGliLkRvdWJsZVBvaW50KC10aGlzLm1fbm9ybWFsc1tqIC0gMV0uWCwgLXRoaXMubV9ub3JtYWxzW2ogLSAxXS5ZKTtcbiAgICAgICAgdGhpcy5tX25vcm1hbHNbMF0gPSBuZXcgQ2xpcHBlckxpYi5Eb3VibGVQb2ludCgtbi5YLCAtbi5ZKTtcbiAgICAgICAgayA9IDA7XG4gICAgICAgIGZvciAodmFyIGogPSBsZW4gLSAxOyBqID49IDA7IGotLSlcbiAgICAgICAgICBrID0gdGhpcy5PZmZzZXRQb2ludChqLCBrLCBub2RlLm1fam9pbnR5cGUpO1xuICAgICAgICB0aGlzLm1fZGVzdFBvbHlzLnB1c2godGhpcy5tX2Rlc3RQb2x5KTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgdmFyIGsgPSAwO1xuICAgICAgICBmb3IgKHZhciBqID0gMTsgaiA8IGxlbiAtIDE7ICsrailcbiAgICAgICAgICBrID0gdGhpcy5PZmZzZXRQb2ludChqLCBrLCBub2RlLm1fam9pbnR5cGUpO1xuICAgICAgICB2YXIgcHQxO1xuICAgICAgICBpZiAobm9kZS5tX2VuZHR5cGUgPT0gQ2xpcHBlckxpYi5FbmRUeXBlLmV0T3BlbkJ1dHQpXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgaiA9IGxlbiAtIDE7XG4gICAgICAgICAgcHQxID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQoQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlggKyB0aGlzLm1fbm9ybWFsc1tqXS5YICogZGVsdGEpLCBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWSArIHRoaXMubV9ub3JtYWxzW2pdLlkgKiBkZWx0YSkpO1xuICAgICAgICAgIHRoaXMubV9kZXN0UG9seS5wdXNoKHB0MSk7XG4gICAgICAgICAgcHQxID0gbmV3IENsaXBwZXJMaWIuSW50UG9pbnQoQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlggLSB0aGlzLm1fbm9ybWFsc1tqXS5YICogZGVsdGEpLCBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWSAtIHRoaXMubV9ub3JtYWxzW2pdLlkgKiBkZWx0YSkpO1xuICAgICAgICAgIHRoaXMubV9kZXN0UG9seS5wdXNoKHB0MSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgdmFyIGogPSBsZW4gLSAxO1xuICAgICAgICAgIGsgPSBsZW4gLSAyO1xuICAgICAgICAgIHRoaXMubV9zaW5BID0gMDtcbiAgICAgICAgICB0aGlzLm1fbm9ybWFsc1tqXSA9IG5ldyBDbGlwcGVyTGliLkRvdWJsZVBvaW50KC10aGlzLm1fbm9ybWFsc1tqXS5YLCAtdGhpcy5tX25vcm1hbHNbal0uWSk7XG4gICAgICAgICAgaWYgKG5vZGUubV9lbmR0eXBlID09IENsaXBwZXJMaWIuRW5kVHlwZS5ldE9wZW5TcXVhcmUpXG4gICAgICAgICAgICB0aGlzLkRvU3F1YXJlKGosIGspO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRoaXMuRG9Sb3VuZChqLCBrKTtcbiAgICAgICAgfVxuICAgICAgICAvL3JlLWJ1aWxkIG1fbm9ybWFscyAuLi5cbiAgICAgICAgZm9yICh2YXIgaiA9IGxlbiAtIDE7IGogPiAwOyBqLS0pXG4gICAgICAgICAgdGhpcy5tX25vcm1hbHNbal0gPSBuZXcgQ2xpcHBlckxpYi5Eb3VibGVQb2ludCgtdGhpcy5tX25vcm1hbHNbaiAtIDFdLlgsIC10aGlzLm1fbm9ybWFsc1tqIC0gMV0uWSk7XG4gICAgICAgIHRoaXMubV9ub3JtYWxzWzBdID0gbmV3IENsaXBwZXJMaWIuRG91YmxlUG9pbnQoLXRoaXMubV9ub3JtYWxzWzFdLlgsIC10aGlzLm1fbm9ybWFsc1sxXS5ZKTtcbiAgICAgICAgayA9IGxlbiAtIDE7XG4gICAgICAgIGZvciAodmFyIGogPSBrIC0gMTsgaiA+IDA7IC0tailcbiAgICAgICAgICBrID0gdGhpcy5PZmZzZXRQb2ludChqLCBrLCBub2RlLm1fam9pbnR5cGUpO1xuICAgICAgICBpZiAobm9kZS5tX2VuZHR5cGUgPT0gQ2xpcHBlckxpYi5FbmRUeXBlLmV0T3BlbkJ1dHQpXG4gICAgICAgIHtcbiAgICAgICAgICBwdDEgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbMF0uWCAtIHRoaXMubV9ub3JtYWxzWzBdLlggKiBkZWx0YSksIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVswXS5ZIC0gdGhpcy5tX25vcm1hbHNbMF0uWSAqIGRlbHRhKSk7XG4gICAgICAgICAgdGhpcy5tX2Rlc3RQb2x5LnB1c2gocHQxKTtcbiAgICAgICAgICBwdDEgPSBuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbMF0uWCArIHRoaXMubV9ub3JtYWxzWzBdLlggKiBkZWx0YSksIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVswXS5ZICsgdGhpcy5tX25vcm1hbHNbMF0uWSAqIGRlbHRhKSk7XG4gICAgICAgICAgdGhpcy5tX2Rlc3RQb2x5LnB1c2gocHQxKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICBrID0gMTtcbiAgICAgICAgICB0aGlzLm1fc2luQSA9IDA7XG4gICAgICAgICAgaWYgKG5vZGUubV9lbmR0eXBlID09IENsaXBwZXJMaWIuRW5kVHlwZS5ldE9wZW5TcXVhcmUpXG4gICAgICAgICAgICB0aGlzLkRvU3F1YXJlKDAsIDEpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRoaXMuRG9Sb3VuZCgwLCAxKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1fZGVzdFBvbHlzLnB1c2godGhpcy5tX2Rlc3RQb2x5KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5wcm90b3R5cGUuRXhlY3V0ZSA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICB2YXIgYSA9IGFyZ3VtZW50cyxcbiAgICAgIGlzcG9seXRyZWUgPSBhWzBdIGluc3RhbmNlb2YgQ2xpcHBlckxpYi5Qb2x5VHJlZTtcbiAgICBpZiAoIWlzcG9seXRyZWUpIC8vIGZ1bmN0aW9uIChzb2x1dGlvbiwgZGVsdGEpXG4gICAge1xuICAgICAgdmFyIHNvbHV0aW9uID0gYVswXSxcbiAgICAgICAgZGVsdGEgPSBhWzFdO1xuICAgICAgQ2xpcHBlckxpYi5DbGVhcihzb2x1dGlvbik7XG4gICAgICB0aGlzLkZpeE9yaWVudGF0aW9ucygpO1xuICAgICAgdGhpcy5Eb09mZnNldChkZWx0YSk7XG4gICAgICAvL25vdyBjbGVhbiB1cCAnY29ybmVycycgLi4uXG4gICAgICB2YXIgY2xwciA9IG5ldyBDbGlwcGVyTGliLkNsaXBwZXIoMCk7XG4gICAgICBjbHByLkFkZFBhdGhzKHRoaXMubV9kZXN0UG9seXMsIENsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0LCB0cnVlKTtcbiAgICAgIGlmIChkZWx0YSA+IDApXG4gICAgICB7XG4gICAgICAgIGNscHIuRXhlY3V0ZShDbGlwcGVyTGliLkNsaXBUeXBlLmN0VW5pb24sIHNvbHV0aW9uLCBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnRQb3NpdGl2ZSwgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0UG9zaXRpdmUpO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICB2YXIgciA9IENsaXBwZXJMaWIuQ2xpcHBlci5HZXRCb3VuZHModGhpcy5tX2Rlc3RQb2x5cyk7XG4gICAgICAgIHZhciBvdXRlciA9IG5ldyBDbGlwcGVyTGliLlBhdGgoKTtcbiAgICAgICAgb3V0ZXIucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChyLmxlZnQgLSAxMCwgci5ib3R0b20gKyAxMCkpO1xuICAgICAgICBvdXRlci5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KHIucmlnaHQgKyAxMCwgci5ib3R0b20gKyAxMCkpO1xuICAgICAgICBvdXRlci5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KHIucmlnaHQgKyAxMCwgci50b3AgLSAxMCkpO1xuICAgICAgICBvdXRlci5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KHIubGVmdCAtIDEwLCByLnRvcCAtIDEwKSk7XG4gICAgICAgIGNscHIuQWRkUGF0aChvdXRlciwgQ2xpcHBlckxpYi5Qb2x5VHlwZS5wdFN1YmplY3QsIHRydWUpO1xuICAgICAgICBjbHByLlJldmVyc2VTb2x1dGlvbiA9IHRydWU7XG4gICAgICAgIGNscHIuRXhlY3V0ZShDbGlwcGVyTGliLkNsaXBUeXBlLmN0VW5pb24sIHNvbHV0aW9uLCBDbGlwcGVyTGliLlBvbHlGaWxsVHlwZS5wZnROZWdhdGl2ZSwgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0TmVnYXRpdmUpO1xuICAgICAgICBpZiAoc29sdXRpb24ubGVuZ3RoID4gMClcbiAgICAgICAgICBzb2x1dGlvbi5zcGxpY2UoMCwgMSk7XG4gICAgICB9XG4gICAgICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHNvbHV0aW9uKSk7XG4gICAgfVxuICAgIGVsc2UgLy8gZnVuY3Rpb24gKHBvbHl0cmVlLCBkZWx0YSlcbiAgICB7XG4gICAgICB2YXIgc29sdXRpb24gPSBhWzBdLFxuICAgICAgICBkZWx0YSA9IGFbMV07XG4gICAgICBzb2x1dGlvbi5DbGVhcigpO1xuICAgICAgdGhpcy5GaXhPcmllbnRhdGlvbnMoKTtcbiAgICAgIHRoaXMuRG9PZmZzZXQoZGVsdGEpO1xuICAgICAgLy9ub3cgY2xlYW4gdXAgJ2Nvcm5lcnMnIC4uLlxuICAgICAgdmFyIGNscHIgPSBuZXcgQ2xpcHBlckxpYi5DbGlwcGVyKDApO1xuICAgICAgY2xwci5BZGRQYXRocyh0aGlzLm1fZGVzdFBvbHlzLCBDbGlwcGVyTGliLlBvbHlUeXBlLnB0U3ViamVjdCwgdHJ1ZSk7XG4gICAgICBpZiAoZGVsdGEgPiAwKVxuICAgICAge1xuICAgICAgICBjbHByLkV4ZWN1dGUoQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFVuaW9uLCBzb2x1dGlvbiwgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0UG9zaXRpdmUsIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdFBvc2l0aXZlKTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgdmFyIHIgPSBDbGlwcGVyTGliLkNsaXBwZXIuR2V0Qm91bmRzKHRoaXMubV9kZXN0UG9seXMpO1xuICAgICAgICB2YXIgb3V0ZXIgPSBuZXcgQ2xpcHBlckxpYi5QYXRoKCk7XG4gICAgICAgIG91dGVyLnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoci5sZWZ0IC0gMTAsIHIuYm90dG9tICsgMTApKTtcbiAgICAgICAgb3V0ZXIucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChyLnJpZ2h0ICsgMTAsIHIuYm90dG9tICsgMTApKTtcbiAgICAgICAgb3V0ZXIucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChyLnJpZ2h0ICsgMTAsIHIudG9wIC0gMTApKTtcbiAgICAgICAgb3V0ZXIucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChyLmxlZnQgLSAxMCwgci50b3AgLSAxMCkpO1xuICAgICAgICBjbHByLkFkZFBhdGgob3V0ZXIsIENsaXBwZXJMaWIuUG9seVR5cGUucHRTdWJqZWN0LCB0cnVlKTtcbiAgICAgICAgY2xwci5SZXZlcnNlU29sdXRpb24gPSB0cnVlO1xuICAgICAgICBjbHByLkV4ZWN1dGUoQ2xpcHBlckxpYi5DbGlwVHlwZS5jdFVuaW9uLCBzb2x1dGlvbiwgQ2xpcHBlckxpYi5Qb2x5RmlsbFR5cGUucGZ0TmVnYXRpdmUsIENsaXBwZXJMaWIuUG9seUZpbGxUeXBlLnBmdE5lZ2F0aXZlKTtcbiAgICAgICAgLy9yZW1vdmUgdGhlIG91dGVyIFBvbHlOb2RlIHJlY3RhbmdsZSAuLi5cbiAgICAgICAgaWYgKHNvbHV0aW9uLkNoaWxkQ291bnQoKSA9PSAxICYmIHNvbHV0aW9uLkNoaWxkcygpWzBdLkNoaWxkQ291bnQoKSA+IDApXG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgb3V0ZXJOb2RlID0gc29sdXRpb24uQ2hpbGRzKClbMF07XG4gICAgICAgICAgLy9zb2x1dGlvbi5DaGlsZHMuc2V0X0NhcGFjaXR5KG91dGVyTm9kZS5DaGlsZENvdW50KTtcbiAgICAgICAgICBzb2x1dGlvbi5DaGlsZHMoKVswXSA9IG91dGVyTm9kZS5DaGlsZHMoKVswXTtcbiAgICAgICAgICBzb2x1dGlvbi5DaGlsZHMoKVswXS5tX1BhcmVudCA9IHNvbHV0aW9uO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgb3V0ZXJOb2RlLkNoaWxkQ291bnQoKTsgaSsrKVxuICAgICAgICAgICAgc29sdXRpb24uQWRkQ2hpbGQob3V0ZXJOb2RlLkNoaWxkcygpW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgc29sdXRpb24uQ2xlYXIoKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5wcm90b3R5cGUuT2Zmc2V0UG9pbnQgPSBmdW5jdGlvbiAoaiwgaywgam9pbnR5cGUpXG4gIHtcblx0XHQvL2Nyb3NzIHByb2R1Y3QgLi4uXG5cdFx0dGhpcy5tX3NpbkEgPSAodGhpcy5tX25vcm1hbHNba10uWCAqIHRoaXMubV9ub3JtYWxzW2pdLlkgLSB0aGlzLm1fbm9ybWFsc1tqXS5YICogdGhpcy5tX25vcm1hbHNba10uWSk7XG5cblx0XHRpZiAoTWF0aC5hYnModGhpcy5tX3NpbkEgKiB0aGlzLm1fZGVsdGEpIDwgMS4wKVxuXHRcdHtcblx0XHRcdC8vZG90IHByb2R1Y3QgLi4uXG5cdFx0XHR2YXIgY29zQSA9ICh0aGlzLm1fbm9ybWFsc1trXS5YICogdGhpcy5tX25vcm1hbHNbal0uWCArIHRoaXMubV9ub3JtYWxzW2pdLlkgKiB0aGlzLm1fbm9ybWFsc1trXS5ZKTtcblx0XHRcdGlmIChjb3NBID4gMCkgLy8gYW5nbGUgPT0+IDAgZGVncmVlc1xuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLm1fZGVzdFBvbHkucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWCArIHRoaXMubV9ub3JtYWxzW2tdLlggKiB0aGlzLm1fZGVsdGEpLFxuXHRcdFx0XHRcdENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5ZICsgdGhpcy5tX25vcm1hbHNba10uWSAqIHRoaXMubV9kZWx0YSkpKTtcblx0XHRcdFx0cmV0dXJuIGs7XG5cdFx0XHR9XG5cdFx0XHQvL2Vsc2UgYW5nbGUgPT0+IDE4MCBkZWdyZWVzXG5cdFx0fVxuICAgIGVsc2UgaWYgKHRoaXMubV9zaW5BID4gMSlcbiAgICAgIHRoaXMubV9zaW5BID0gMS4wO1xuICAgIGVsc2UgaWYgKHRoaXMubV9zaW5BIDwgLTEpXG4gICAgICB0aGlzLm1fc2luQSA9IC0xLjA7XG4gICAgaWYgKHRoaXMubV9zaW5BICogdGhpcy5tX2RlbHRhIDwgMClcbiAgICB7XG4gICAgICB0aGlzLm1fZGVzdFBvbHkucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWCArIHRoaXMubV9ub3JtYWxzW2tdLlggKiB0aGlzLm1fZGVsdGEpLFxuICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWSArIHRoaXMubV9ub3JtYWxzW2tdLlkgKiB0aGlzLm1fZGVsdGEpKSk7XG4gICAgICB0aGlzLm1fZGVzdFBvbHkucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludCh0aGlzLm1fc3JjUG9seVtqXSkpO1xuICAgICAgdGhpcy5tX2Rlc3RQb2x5LnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlggKyB0aGlzLm1fbm9ybWFsc1tqXS5YICogdGhpcy5tX2RlbHRhKSxcbiAgICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlkgKyB0aGlzLm1fbm9ybWFsc1tqXS5ZICogdGhpcy5tX2RlbHRhKSkpO1xuICAgIH1cbiAgICBlbHNlXG4gICAgICBzd2l0Y2ggKGpvaW50eXBlKVxuICAgICAge1xuICAgICAgY2FzZSBDbGlwcGVyTGliLkpvaW5UeXBlLmp0TWl0ZXI6XG4gICAgICAgIHtcbiAgICAgICAgICB2YXIgciA9IDEgKyAodGhpcy5tX25vcm1hbHNbal0uWCAqIHRoaXMubV9ub3JtYWxzW2tdLlggKyB0aGlzLm1fbm9ybWFsc1tqXS5ZICogdGhpcy5tX25vcm1hbHNba10uWSk7XG4gICAgICAgICAgaWYgKHIgPj0gdGhpcy5tX21pdGVyTGltKVxuICAgICAgICAgICAgdGhpcy5Eb01pdGVyKGosIGssIHIpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRoaXMuRG9TcXVhcmUoaiwgayk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgQ2xpcHBlckxpYi5Kb2luVHlwZS5qdFNxdWFyZTpcbiAgICAgICAgdGhpcy5Eb1NxdWFyZShqLCBrKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENsaXBwZXJMaWIuSm9pblR5cGUuanRSb3VuZDpcbiAgICAgICAgdGhpcy5Eb1JvdW5kKGosIGspO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICBrID0gajtcbiAgICByZXR1cm4gaztcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LnByb3RvdHlwZS5Eb1NxdWFyZSA9IGZ1bmN0aW9uIChqLCBrKVxuICB7XG4gICAgdmFyIGR4ID0gTWF0aC50YW4oTWF0aC5hdGFuMih0aGlzLm1fc2luQSxcbiAgICAgIHRoaXMubV9ub3JtYWxzW2tdLlggKiB0aGlzLm1fbm9ybWFsc1tqXS5YICsgdGhpcy5tX25vcm1hbHNba10uWSAqIHRoaXMubV9ub3JtYWxzW2pdLlkpIC8gNCk7XG4gICAgdGhpcy5tX2Rlc3RQb2x5LnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoXG4gICAgICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWCArIHRoaXMubV9kZWx0YSAqICh0aGlzLm1fbm9ybWFsc1trXS5YIC0gdGhpcy5tX25vcm1hbHNba10uWSAqIGR4KSksXG4gICAgICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWSArIHRoaXMubV9kZWx0YSAqICh0aGlzLm1fbm9ybWFsc1trXS5ZICsgdGhpcy5tX25vcm1hbHNba10uWCAqIGR4KSkpKTtcbiAgICB0aGlzLm1fZGVzdFBvbHkucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChcbiAgICAgIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5YICsgdGhpcy5tX2RlbHRhICogKHRoaXMubV9ub3JtYWxzW2pdLlggKyB0aGlzLm1fbm9ybWFsc1tqXS5ZICogZHgpKSxcbiAgICAgIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5ZICsgdGhpcy5tX2RlbHRhICogKHRoaXMubV9ub3JtYWxzW2pdLlkgLSB0aGlzLm1fbm9ybWFsc1tqXS5YICogZHgpKSkpO1xuICB9O1xuICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQucHJvdG90eXBlLkRvTWl0ZXIgPSBmdW5jdGlvbiAoaiwgaywgcilcbiAge1xuICAgIHZhciBxID0gdGhpcy5tX2RlbHRhIC8gcjtcbiAgICB0aGlzLm1fZGVzdFBvbHkucHVzaChuZXcgQ2xpcHBlckxpYi5JbnRQb2ludChcbiAgICAgIENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fc3JjUG9seVtqXS5YICsgKHRoaXMubV9ub3JtYWxzW2tdLlggKyB0aGlzLm1fbm9ybWFsc1tqXS5YKSAqIHEpLFxuICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlkgKyAodGhpcy5tX25vcm1hbHNba10uWSArIHRoaXMubV9ub3JtYWxzW2pdLlkpICogcSkpKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LnByb3RvdHlwZS5Eb1JvdW5kID0gZnVuY3Rpb24gKGosIGspXG4gIHtcbiAgICB2YXIgYSA9IE1hdGguYXRhbjIodGhpcy5tX3NpbkEsXG4gICAgICB0aGlzLm1fbm9ybWFsc1trXS5YICogdGhpcy5tX25vcm1hbHNbal0uWCArIHRoaXMubV9ub3JtYWxzW2tdLlkgKiB0aGlzLm1fbm9ybWFsc1tqXS5ZKTtcblxuICAgIFx0dmFyIHN0ZXBzID0gTWF0aC5tYXgoQ2xpcHBlckxpYi5DYXN0X0ludDMyKENsaXBwZXJMaWIuQ2xpcHBlck9mZnNldC5Sb3VuZCh0aGlzLm1fU3RlcHNQZXJSYWQgKiBNYXRoLmFicyhhKSkpLCAxKTtcblxuICAgIHZhciBYID0gdGhpcy5tX25vcm1hbHNba10uWCxcbiAgICAgIFkgPSB0aGlzLm1fbm9ybWFsc1trXS5ZLFxuICAgICAgWDI7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGVwczsgKytpKVxuICAgIHtcbiAgICAgIHRoaXMubV9kZXN0UG9seS5wdXNoKG5ldyBDbGlwcGVyTGliLkludFBvaW50KFxuICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWCArIFggKiB0aGlzLm1fZGVsdGEpLFxuICAgICAgICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWSArIFkgKiB0aGlzLm1fZGVsdGEpKSk7XG4gICAgICBYMiA9IFg7XG4gICAgICBYID0gWCAqIHRoaXMubV9jb3MgLSB0aGlzLm1fc2luICogWTtcbiAgICAgIFkgPSBYMiAqIHRoaXMubV9zaW4gKyBZICogdGhpcy5tX2NvcztcbiAgICB9XG4gICAgdGhpcy5tX2Rlc3RQb2x5LnB1c2gobmV3IENsaXBwZXJMaWIuSW50UG9pbnQoXG4gICAgICBDbGlwcGVyTGliLkNsaXBwZXJPZmZzZXQuUm91bmQodGhpcy5tX3NyY1BvbHlbal0uWCArIHRoaXMubV9ub3JtYWxzW2pdLlggKiB0aGlzLm1fZGVsdGEpLFxuICAgICAgQ2xpcHBlckxpYi5DbGlwcGVyT2Zmc2V0LlJvdW5kKHRoaXMubV9zcmNQb2x5W2pdLlkgKyB0aGlzLm1fbm9ybWFsc1tqXS5ZICogdGhpcy5tX2RlbHRhKSkpO1xuICB9O1xuICBDbGlwcGVyTGliLkVycm9yID0gZnVuY3Rpb24gKG1lc3NhZ2UpXG4gIHtcbiAgICB0cnlcbiAgICB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgfVxuICAgIGNhdGNoIChlcnIpXG4gICAge1xuICAgICAgYWxlcnQoZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgfTtcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIEpTIGV4dGVuc2lvbiBieSBUaW1vIDIwMTNcbiAgQ2xpcHBlckxpYi5KUyA9IHt9O1xuICBDbGlwcGVyTGliLkpTLkFyZWFPZlBvbHlnb24gPSBmdW5jdGlvbiAocG9seSwgc2NhbGUpXG4gIHtcbiAgICBpZiAoIXNjYWxlKSBzY2FsZSA9IDE7XG4gICAgcmV0dXJuIENsaXBwZXJMaWIuQ2xpcHBlci5BcmVhKHBvbHkpIC8gKHNjYWxlICogc2NhbGUpO1xuICB9O1xuICBDbGlwcGVyTGliLkpTLkFyZWFPZlBvbHlnb25zID0gZnVuY3Rpb24gKHBvbHksIHNjYWxlKVxuICB7XG4gICAgaWYgKCFzY2FsZSkgc2NhbGUgPSAxO1xuICAgIHZhciBhcmVhID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBvbHkubGVuZ3RoOyBpKyspXG4gICAge1xuICAgICAgYXJlYSArPSBDbGlwcGVyTGliLkNsaXBwZXIuQXJlYShwb2x5W2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIGFyZWEgLyAoc2NhbGUgKiBzY2FsZSk7XG4gIH07XG4gIENsaXBwZXJMaWIuSlMuQm91bmRzT2ZQYXRoID0gZnVuY3Rpb24gKHBhdGgsIHNjYWxlKVxuICB7XG4gICAgcmV0dXJuIENsaXBwZXJMaWIuSlMuQm91bmRzT2ZQYXRocyhbcGF0aF0sIHNjYWxlKTtcbiAgfTtcbiAgQ2xpcHBlckxpYi5KUy5Cb3VuZHNPZlBhdGhzID0gZnVuY3Rpb24gKHBhdGhzLCBzY2FsZSlcbiAge1xuICAgIGlmICghc2NhbGUpIHNjYWxlID0gMTtcbiAgICB2YXIgYm91bmRzID0gQ2xpcHBlckxpYi5DbGlwcGVyLkdldEJvdW5kcyhwYXRocyk7XG4gICAgYm91bmRzLmxlZnQgLz0gc2NhbGU7XG4gICAgYm91bmRzLmJvdHRvbSAvPSBzY2FsZTtcbiAgICBib3VuZHMucmlnaHQgLz0gc2NhbGU7XG4gICAgYm91bmRzLnRvcCAvPSBzY2FsZTtcbiAgICByZXR1cm4gYm91bmRzO1xuICB9O1xuICAvLyBDbGVhbigpIGpvaW5zIHZlcnRpY2VzIHRoYXQgYXJlIHRvbyBuZWFyIGVhY2ggb3RoZXJcbiAgLy8gYW5kIGNhdXNlcyBkaXN0b3J0aW9uIHRvIG9mZnNldHRlZCBwb2x5Z29ucyB3aXRob3V0IGNsZWFuaW5nXG4gIENsaXBwZXJMaWIuSlMuQ2xlYW4gPSBmdW5jdGlvbiAocG9seWdvbiwgZGVsdGEpXG4gIHtcbiAgICBpZiAoIShwb2x5Z29uIGluc3RhbmNlb2YgQXJyYXkpKSByZXR1cm4gW107XG4gICAgdmFyIGlzUG9seWdvbnMgPSBwb2x5Z29uWzBdIGluc3RhbmNlb2YgQXJyYXk7XG4gICAgdmFyIHBvbHlnb24gPSBDbGlwcGVyTGliLkpTLkNsb25lKHBvbHlnb24pO1xuICAgIGlmICh0eXBlb2YgZGVsdGEgIT0gXCJudW1iZXJcIiB8fCBkZWx0YSA9PT0gbnVsbClcbiAgICB7XG4gICAgICBDbGlwcGVyTGliLkVycm9yKFwiRGVsdGEgaXMgbm90IGEgbnVtYmVyIGluIENsZWFuKCkuXCIpO1xuICAgICAgcmV0dXJuIHBvbHlnb247XG4gICAgfVxuICAgIGlmIChwb2x5Z29uLmxlbmd0aCA9PT0gMCB8fCAocG9seWdvbi5sZW5ndGggPT0gMSAmJiBwb2x5Z29uWzBdLmxlbmd0aCA9PT0gMCkgfHwgZGVsdGEgPCAwKSByZXR1cm4gcG9seWdvbjtcbiAgICBpZiAoIWlzUG9seWdvbnMpIHBvbHlnb24gPSBbcG9seWdvbl07XG4gICAgdmFyIGtfbGVuZ3RoID0gcG9seWdvbi5sZW5ndGg7XG4gICAgdmFyIGxlbiwgcG9seSwgcmVzdWx0LCBkLCBwLCBqLCBpO1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgZm9yICh2YXIgayA9IDA7IGsgPCBrX2xlbmd0aDsgaysrKVxuICAgIHtcbiAgICAgIHBvbHkgPSBwb2x5Z29uW2tdO1xuICAgICAgbGVuID0gcG9seS5sZW5ndGg7XG4gICAgICBpZiAobGVuID09PSAwKSBjb250aW51ZTtcbiAgICAgIGVsc2UgaWYgKGxlbiA8IDMpXG4gICAgICB7XG4gICAgICAgIHJlc3VsdCA9IHBvbHk7XG4gICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdCA9IHBvbHk7XG4gICAgICBkID0gZGVsdGEgKiBkZWx0YTtcbiAgICAgIC8vZCA9IE1hdGguZmxvb3IoY19kZWx0YSAqIGNfZGVsdGEpO1xuICAgICAgcCA9IHBvbHlbMF07XG4gICAgICBqID0gMTtcbiAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIHtcbiAgICAgICAgaWYgKChwb2x5W2ldLlggLSBwLlgpICogKHBvbHlbaV0uWCAtIHAuWCkgK1xuICAgICAgICAgIChwb2x5W2ldLlkgLSBwLlkpICogKHBvbHlbaV0uWSAtIHAuWSkgPD0gZClcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgcmVzdWx0W2pdID0gcG9seVtpXTtcbiAgICAgICAgcCA9IHBvbHlbaV07XG4gICAgICAgIGorKztcbiAgICAgIH1cbiAgICAgIHAgPSBwb2x5W2ogLSAxXTtcbiAgICAgIGlmICgocG9seVswXS5YIC0gcC5YKSAqIChwb2x5WzBdLlggLSBwLlgpICtcbiAgICAgICAgKHBvbHlbMF0uWSAtIHAuWSkgKiAocG9seVswXS5ZIC0gcC5ZKSA8PSBkKVxuICAgICAgICBqLS07XG4gICAgICBpZiAoaiA8IGxlbilcbiAgICAgICAgcmVzdWx0LnNwbGljZShqLCBsZW4gLSBqKTtcbiAgICAgIGlmIChyZXN1bHQubGVuZ3RoKSByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICB9XG4gICAgaWYgKCFpc1BvbHlnb25zICYmIHJlc3VsdHMubGVuZ3RoKSByZXN1bHRzID0gcmVzdWx0c1swXTtcbiAgICBlbHNlIGlmICghaXNQb2x5Z29ucyAmJiByZXN1bHRzLmxlbmd0aCA9PT0gMCkgcmVzdWx0cyA9IFtdO1xuICAgIGVsc2UgaWYgKGlzUG9seWdvbnMgJiYgcmVzdWx0cy5sZW5ndGggPT09IDApIHJlc3VsdHMgPSBbXG4gICAgICBbXVxuICAgIF07XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cbiAgLy8gTWFrZSBkZWVwIGNvcHkgb2YgUG9seWdvbnMgb3IgUG9seWdvblxuICAvLyBzbyB0aGF0IGFsc28gSW50UG9pbnQgb2JqZWN0cyBhcmUgY2xvbmVkIGFuZCBub3Qgb25seSByZWZlcmVuY2VkXG4gIC8vIFRoaXMgc2hvdWxkIGJlIHRoZSBmYXN0ZXN0IHdheVxuICBDbGlwcGVyTGliLkpTLkNsb25lID0gZnVuY3Rpb24gKHBvbHlnb24pXG4gIHtcbiAgICBpZiAoIShwb2x5Z29uIGluc3RhbmNlb2YgQXJyYXkpKSByZXR1cm4gW107XG4gICAgaWYgKHBvbHlnb24ubGVuZ3RoID09PSAwKSByZXR1cm4gW107XG4gICAgZWxzZSBpZiAocG9seWdvbi5sZW5ndGggPT0gMSAmJiBwb2x5Z29uWzBdLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFtbXV07XG4gICAgdmFyIGlzUG9seWdvbnMgPSBwb2x5Z29uWzBdIGluc3RhbmNlb2YgQXJyYXk7XG4gICAgaWYgKCFpc1BvbHlnb25zKSBwb2x5Z29uID0gW3BvbHlnb25dO1xuICAgIHZhciBsZW4gPSBwb2x5Z29uLmxlbmd0aCxcbiAgICAgIHBsZW4sIGksIGosIHJlc3VsdDtcbiAgICB2YXIgcmVzdWx0cyA9IG5ldyBBcnJheShsZW4pO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICB7XG4gICAgICBwbGVuID0gcG9seWdvbltpXS5sZW5ndGg7XG4gICAgICByZXN1bHQgPSBuZXcgQXJyYXkocGxlbik7XG4gICAgICBmb3IgKGogPSAwOyBqIDwgcGxlbjsgaisrKVxuICAgICAge1xuICAgICAgICByZXN1bHRbal0gPSB7XG4gICAgICAgICAgWDogcG9seWdvbltpXVtqXS5YLFxuICAgICAgICAgIFk6IHBvbHlnb25baV1bal0uWVxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmVzdWx0c1tpXSA9IHJlc3VsdDtcbiAgICB9XG4gICAgaWYgKCFpc1BvbHlnb25zKSByZXN1bHRzID0gcmVzdWx0c1swXTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcbiAgLy8gUmVtb3ZlcyBwb2ludHMgdGhhdCBkb2Vzbid0IGFmZmVjdCBtdWNoIHRvIHRoZSB2aXN1YWwgYXBwZWFyYW5jZS5cbiAgLy8gSWYgbWlkZGxlIHBvaW50IGlzIGF0IG9yIHVuZGVyIGNlcnRhaW4gZGlzdGFuY2UgKHRvbGVyYW5jZSkgb2YgdGhlIGxpbmUgc2VnbWVudCBiZXR3ZWVuXG4gIC8vIHN0YXJ0IGFuZCBlbmQgcG9pbnQsIHRoZSBtaWRkbGUgcG9pbnQgaXMgcmVtb3ZlZC5cbiAgQ2xpcHBlckxpYi5KUy5MaWdodGVuID0gZnVuY3Rpb24gKHBvbHlnb24sIHRvbGVyYW5jZSlcbiAge1xuICAgIGlmICghKHBvbHlnb24gaW5zdGFuY2VvZiBBcnJheSkpIHJldHVybiBbXTtcbiAgICBpZiAodHlwZW9mIHRvbGVyYW5jZSAhPSBcIm51bWJlclwiIHx8IHRvbGVyYW5jZSA9PT0gbnVsbClcbiAgICB7XG4gICAgICBDbGlwcGVyTGliLkVycm9yKFwiVG9sZXJhbmNlIGlzIG5vdCBhIG51bWJlciBpbiBMaWdodGVuKCkuXCIpXG4gICAgICByZXR1cm4gQ2xpcHBlckxpYi5KUy5DbG9uZShwb2x5Z29uKTtcbiAgICB9XG4gICAgaWYgKHBvbHlnb24ubGVuZ3RoID09PSAwIHx8IChwb2x5Z29uLmxlbmd0aCA9PSAxICYmIHBvbHlnb25bMF0ubGVuZ3RoID09PSAwKSB8fCB0b2xlcmFuY2UgPCAwKVxuICAgIHtcbiAgICAgIHJldHVybiBDbGlwcGVyTGliLkpTLkNsb25lKHBvbHlnb24pO1xuICAgIH1cbiAgICBpZiAoIShwb2x5Z29uWzBdIGluc3RhbmNlb2YgQXJyYXkpKSBwb2x5Z29uID0gW3BvbHlnb25dO1xuICAgIHZhciBpLCBqLCBwb2x5LCBrLCBwb2x5MiwgcGxlbiwgQSwgQiwgUCwgZCwgcmVtLCBhZGRsYXN0O1xuICAgIHZhciBieGF4LCBieWF5LCBsLCBheCwgYXk7XG4gICAgdmFyIGxlbiA9IHBvbHlnb24ubGVuZ3RoO1xuICAgIHZhciB0b2xlcmFuY2VTcSA9IHRvbGVyYW5jZSAqIHRvbGVyYW5jZTtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICB7XG4gICAgICBwb2x5ID0gcG9seWdvbltpXTtcbiAgICAgIHBsZW4gPSBwb2x5Lmxlbmd0aDtcbiAgICAgIGlmIChwbGVuID09IDApIGNvbnRpbnVlO1xuICAgICAgZm9yIChrID0gMDsgayA8IDEwMDAwMDA7IGsrKykgLy8gY291bGQgYmUgZm9yZXZlciBsb29wLCBidXQgd2lzZXIgdG8gcmVzdHJpY3QgbWF4IHJlcGVhdCBjb3VudFxuICAgICAge1xuICAgICAgICBwb2x5MiA9IFtdO1xuICAgICAgICBwbGVuID0gcG9seS5sZW5ndGg7XG4gICAgICAgIC8vIHRoZSBmaXJzdCBoYXZlIHRvIGFkZGVkIHRvIHRoZSBlbmQsIGlmIGZpcnN0IGFuZCBsYXN0IGFyZSBub3QgdGhlIHNhbWVcbiAgICAgICAgLy8gdGhpcyB3YXkgd2UgZW5zdXJlIHRoYXQgYWxzbyB0aGUgYWN0dWFsIGxhc3QgcG9pbnQgY2FuIGJlIHJlbW92ZWQgaWYgbmVlZGVkXG4gICAgICAgIGlmIChwb2x5W3BsZW4gLSAxXS5YICE9IHBvbHlbMF0uWCB8fCBwb2x5W3BsZW4gLSAxXS5ZICE9IHBvbHlbMF0uWSlcbiAgICAgICAge1xuICAgICAgICAgIGFkZGxhc3QgPSAxO1xuICAgICAgICAgIHBvbHkucHVzaChcbiAgICAgICAgICB7XG4gICAgICAgICAgICBYOiBwb2x5WzBdLlgsXG4gICAgICAgICAgICBZOiBwb2x5WzBdLllcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBwbGVuID0gcG9seS5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBhZGRsYXN0ID0gMDtcbiAgICAgICAgcmVtID0gW107IC8vIEluZGV4ZXMgb2YgcmVtb3ZlZCBwb2ludHNcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IHBsZW4gLSAyOyBqKyspXG4gICAgICAgIHtcbiAgICAgICAgICBBID0gcG9seVtqXTsgLy8gU3RhcnQgcG9pbnQgb2YgbGluZSBzZWdtZW50XG4gICAgICAgICAgUCA9IHBvbHlbaiArIDFdOyAvLyBNaWRkbGUgcG9pbnQuIFRoaXMgaXMgdGhlIG9uZSB0byBiZSByZW1vdmVkLlxuICAgICAgICAgIEIgPSBwb2x5W2ogKyAyXTsgLy8gRW5kIHBvaW50IG9mIGxpbmUgc2VnbWVudFxuICAgICAgICAgIGF4ID0gQS5YO1xuICAgICAgICAgIGF5ID0gQS5ZO1xuICAgICAgICAgIGJ4YXggPSBCLlggLSBheDtcbiAgICAgICAgICBieWF5ID0gQi5ZIC0gYXk7XG4gICAgICAgICAgaWYgKGJ4YXggIT09IDAgfHwgYnlheSAhPT0gMCkgLy8gVG8gYXZvaWQgTmFuLCB3aGVuIEE9PVAgJiYgUD09Qi4gQW5kIHRvIGF2b2lkIHBlYWtzIChBPT1CICYmIEEhPVApLCB3aGljaCBoYXZlIGxlbmdodCwgYnV0IG5vdCBhcmVhLlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGwgPSAoKFAuWCAtIGF4KSAqIGJ4YXggKyAoUC5ZIC0gYXkpICogYnlheSkgLyAoYnhheCAqIGJ4YXggKyBieWF5ICogYnlheSk7XG4gICAgICAgICAgICBpZiAobCA+IDEpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGF4ID0gQi5YO1xuICAgICAgICAgICAgICBheSA9IEIuWTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGwgPiAwKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBheCArPSBieGF4ICogbDtcbiAgICAgICAgICAgICAgYXkgKz0gYnlheSAqIGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJ4YXggPSBQLlggLSBheDtcbiAgICAgICAgICBieWF5ID0gUC5ZIC0gYXk7XG4gICAgICAgICAgZCA9IGJ4YXggKiBieGF4ICsgYnlheSAqIGJ5YXk7XG4gICAgICAgICAgaWYgKGQgPD0gdG9sZXJhbmNlU3EpXG4gICAgICAgICAge1xuICAgICAgICAgICAgcmVtW2ogKyAxXSA9IDE7XG4gICAgICAgICAgICBqKys7IC8vIHdoZW4gcmVtb3ZlZCwgdHJhbnNmZXIgdGhlIHBvaW50ZXIgdG8gdGhlIG5leHQgb25lXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGFkZCBhbGwgdW5yZW1vdmVkIHBvaW50cyB0byBwb2x5MlxuICAgICAgICBwb2x5Mi5wdXNoKFxuICAgICAgICB7XG4gICAgICAgICAgWDogcG9seVswXS5YLFxuICAgICAgICAgIFk6IHBvbHlbMF0uWVxuICAgICAgICB9KTtcbiAgICAgICAgZm9yIChqID0gMTsgaiA8IHBsZW4gLSAxOyBqKyspXG4gICAgICAgICAgaWYgKCFyZW1bal0pIHBvbHkyLnB1c2goXG4gICAgICAgICAge1xuICAgICAgICAgICAgWDogcG9seVtqXS5YLFxuICAgICAgICAgICAgWTogcG9seVtqXS5ZXG4gICAgICAgICAgfSk7XG4gICAgICAgIHBvbHkyLnB1c2goXG4gICAgICAgIHtcbiAgICAgICAgICBYOiBwb2x5W3BsZW4gLSAxXS5YLFxuICAgICAgICAgIFk6IHBvbHlbcGxlbiAtIDFdLllcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGlmIHRoZSBmaXJzdCBwb2ludCB3YXMgYWRkZWQgdG8gdGhlIGVuZCwgcmVtb3ZlIGl0XG4gICAgICAgIGlmIChhZGRsYXN0KSBwb2x5LnBvcCgpO1xuICAgICAgICAvLyBicmVhaywgaWYgdGhlcmUgd2FzIG5vdCBhbnltb3JlIHJlbW92ZWQgcG9pbnRzXG4gICAgICAgIGlmICghcmVtLmxlbmd0aCkgYnJlYWs7XG4gICAgICAgIC8vIGVsc2UgY29udGludWUgbG9vcGluZyB1c2luZyBwb2x5MiwgdG8gY2hlY2sgaWYgdGhlcmUgYXJlIHBvaW50cyB0byByZW1vdmVcbiAgICAgICAgZWxzZSBwb2x5ID0gcG9seTI7XG4gICAgICB9XG4gICAgICBwbGVuID0gcG9seTIubGVuZ3RoO1xuICAgICAgLy8gcmVtb3ZlIGR1cGxpY2F0ZSBmcm9tIGVuZCwgaWYgbmVlZGVkXG4gICAgICBpZiAocG9seTJbcGxlbiAtIDFdLlggPT0gcG9seTJbMF0uWCAmJiBwb2x5MltwbGVuIC0gMV0uWSA9PSBwb2x5MlswXS5ZKVxuICAgICAge1xuICAgICAgICBwb2x5Mi5wb3AoKTtcbiAgICAgIH1cbiAgICAgIGlmIChwb2x5Mi5sZW5ndGggPiAyKSAvLyB0byBhdm9pZCB0d28tcG9pbnQtcG9seWdvbnNcbiAgICAgICAgcmVzdWx0cy5wdXNoKHBvbHkyKTtcbiAgICB9XG4gICAgaWYgKCEocG9seWdvblswXSBpbnN0YW5jZW9mIEFycmF5KSkgcmVzdWx0cyA9IHJlc3VsdHNbMF07XG4gICAgaWYgKHR5cGVvZiAocmVzdWx0cykgPT0gXCJ1bmRlZmluZWRcIikgcmVzdWx0cyA9IFtcbiAgICAgIFtdXG4gICAgXTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfVxuICBDbGlwcGVyTGliLkpTLlBlcmltZXRlck9mUGF0aCA9IGZ1bmN0aW9uIChwYXRoLCBjbG9zZWQsIHNjYWxlKVxuICB7XG4gICAgaWYgKHR5cGVvZiAocGF0aCkgPT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuIDA7XG4gICAgdmFyIHNxcnQgPSBNYXRoLnNxcnQ7XG4gICAgdmFyIHBlcmltZXRlciA9IDAuMDtcbiAgICB2YXIgcDEsIHAyLCBwMXggPSAwLjAsXG4gICAgICBwMXkgPSAwLjAsXG4gICAgICBwMnggPSAwLjAsXG4gICAgICBwMnkgPSAwLjA7XG4gICAgdmFyIGogPSBwYXRoLmxlbmd0aDtcbiAgICBpZiAoaiA8IDIpIHJldHVybiAwO1xuICAgIGlmIChjbG9zZWQpXG4gICAge1xuICAgICAgcGF0aFtqXSA9IHBhdGhbMF07XG4gICAgICBqKys7XG4gICAgfVxuICAgIHdoaWxlICgtLWopXG4gICAge1xuICAgICAgcDEgPSBwYXRoW2pdO1xuICAgICAgcDF4ID0gcDEuWDtcbiAgICAgIHAxeSA9IHAxLlk7XG4gICAgICBwMiA9IHBhdGhbaiAtIDFdO1xuICAgICAgcDJ4ID0gcDIuWDtcbiAgICAgIHAyeSA9IHAyLlk7XG4gICAgICBwZXJpbWV0ZXIgKz0gc3FydCgocDF4IC0gcDJ4KSAqIChwMXggLSBwMngpICsgKHAxeSAtIHAyeSkgKiAocDF5IC0gcDJ5KSk7XG4gICAgfVxuICAgIGlmIChjbG9zZWQpIHBhdGgucG9wKCk7XG4gICAgcmV0dXJuIHBlcmltZXRlciAvIHNjYWxlO1xuICB9O1xuICBDbGlwcGVyTGliLkpTLlBlcmltZXRlck9mUGF0aHMgPSBmdW5jdGlvbiAocGF0aHMsIGNsb3NlZCwgc2NhbGUpXG4gIHtcbiAgICBpZiAoIXNjYWxlKSBzY2FsZSA9IDE7XG4gICAgdmFyIHBlcmltZXRlciA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRocy5sZW5ndGg7IGkrKylcbiAgICB7XG4gICAgICBwZXJpbWV0ZXIgKz0gQ2xpcHBlckxpYi5KUy5QZXJpbWV0ZXJPZlBhdGgocGF0aHNbaV0sIGNsb3NlZCwgc2NhbGUpO1xuICAgIH1cbiAgICByZXR1cm4gcGVyaW1ldGVyO1xuICB9O1xuICBDbGlwcGVyTGliLkpTLlNjYWxlRG93blBhdGggPSBmdW5jdGlvbiAocGF0aCwgc2NhbGUpXG4gIHtcbiAgICB2YXIgaSwgcDtcbiAgICBpZiAoIXNjYWxlKSBzY2FsZSA9IDE7XG4gICAgaSA9IHBhdGgubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pXG4gICAge1xuICAgICAgcCA9IHBhdGhbaV07XG4gICAgICBwLlggPSBwLlggLyBzY2FsZTtcbiAgICAgIHAuWSA9IHAuWSAvIHNjYWxlO1xuICAgIH1cbiAgfTtcbiAgQ2xpcHBlckxpYi5KUy5TY2FsZURvd25QYXRocyA9IGZ1bmN0aW9uIChwYXRocywgc2NhbGUpXG4gIHtcbiAgICB2YXIgaSwgaiwgcDtcbiAgICBpZiAoIXNjYWxlKSBzY2FsZSA9IDE7XG4gICAgaSA9IHBhdGhzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKVxuICAgIHtcbiAgICAgIGogPSBwYXRoc1tpXS5sZW5ndGg7XG4gICAgICB3aGlsZSAoai0tKVxuICAgICAge1xuICAgICAgICBwID0gcGF0aHNbaV1bal07XG4gICAgICAgIHAuWCA9IHAuWCAvIHNjYWxlO1xuICAgICAgICBwLlkgPSBwLlkgLyBzY2FsZTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuSlMuU2NhbGVVcFBhdGggPSBmdW5jdGlvbiAocGF0aCwgc2NhbGUpXG4gIHtcbiAgICB2YXIgaSwgcCwgcm91bmQgPSBNYXRoLnJvdW5kO1xuICAgIGlmICghc2NhbGUpIHNjYWxlID0gMTtcbiAgICBpID0gcGF0aC5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSlcbiAgICB7XG4gICAgICBwID0gcGF0aFtpXTtcbiAgICAgIHAuWCA9IHJvdW5kKHAuWCAqIHNjYWxlKTtcbiAgICAgIHAuWSA9IHJvdW5kKHAuWSAqIHNjYWxlKTtcbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuSlMuU2NhbGVVcFBhdGhzID0gZnVuY3Rpb24gKHBhdGhzLCBzY2FsZSlcbiAge1xuICAgIHZhciBpLCBqLCBwLCByb3VuZCA9IE1hdGgucm91bmQ7XG4gICAgaWYgKCFzY2FsZSkgc2NhbGUgPSAxO1xuICAgIGkgPSBwYXRocy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSlcbiAgICB7XG4gICAgICBqID0gcGF0aHNbaV0ubGVuZ3RoO1xuICAgICAgd2hpbGUgKGotLSlcbiAgICAgIHtcbiAgICAgICAgcCA9IHBhdGhzW2ldW2pdO1xuICAgICAgICBwLlggPSByb3VuZChwLlggKiBzY2FsZSk7XG4gICAgICAgIHAuWSA9IHJvdW5kKHAuWSAqIHNjYWxlKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIENsaXBwZXJMaWIuRXhQb2x5Z29ucyA9IGZ1bmN0aW9uICgpXG4gIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgQ2xpcHBlckxpYi5FeFBvbHlnb24gPSBmdW5jdGlvbiAoKVxuICB7XG4gICAgdGhpcy5vdXRlciA9IG51bGw7XG4gICAgdGhpcy5ob2xlcyA9IG51bGw7XG4gIH07XG4gIENsaXBwZXJMaWIuSlMuQWRkT3V0ZXJQb2x5Tm9kZVRvRXhQb2x5Z29ucyA9IGZ1bmN0aW9uIChwb2x5bm9kZSwgZXhwb2x5Z29ucylcbiAge1xuICAgIHZhciBlcCA9IG5ldyBDbGlwcGVyTGliLkV4UG9seWdvbigpO1xuICAgIGVwLm91dGVyID0gcG9seW5vZGUuQ29udG91cigpO1xuICAgIHZhciBjaGlsZHMgPSBwb2x5bm9kZS5DaGlsZHMoKTtcbiAgICB2YXIgaWxlbiA9IGNoaWxkcy5sZW5ndGg7XG4gICAgZXAuaG9sZXMgPSBuZXcgQXJyYXkoaWxlbik7XG4gICAgdmFyIG5vZGUsIG4sIGksIGosIGNoaWxkczIsIGpsZW47XG4gICAgZm9yIChpID0gMDsgaSA8IGlsZW47IGkrKylcbiAgICB7XG4gICAgICBub2RlID0gY2hpbGRzW2ldO1xuICAgICAgZXAuaG9sZXNbaV0gPSBub2RlLkNvbnRvdXIoKTtcbiAgICAgIC8vQWRkIG91dGVyIHBvbHlnb25zIGNvbnRhaW5lZCBieSAobmVzdGVkIHdpdGhpbikgaG9sZXMgLi4uXG4gICAgICBmb3IgKGogPSAwLCBjaGlsZHMyID0gbm9kZS5DaGlsZHMoKSwgamxlbiA9IGNoaWxkczIubGVuZ3RoOyBqIDwgamxlbjsgaisrKVxuICAgICAge1xuICAgICAgICBuID0gY2hpbGRzMltqXTtcbiAgICAgICAgQ2xpcHBlckxpYi5KUy5BZGRPdXRlclBvbHlOb2RlVG9FeFBvbHlnb25zKG4sIGV4cG9seWdvbnMpO1xuICAgICAgfVxuICAgIH1cbiAgICBleHBvbHlnb25zLnB1c2goZXApO1xuICB9O1xuICBDbGlwcGVyTGliLkpTLkV4UG9seWdvbnNUb1BhdGhzID0gZnVuY3Rpb24gKGV4cG9seWdvbnMpXG4gIHtcbiAgICB2YXIgYSwgaSwgYWxlbiwgaWxlbjtcbiAgICB2YXIgcGF0aHMgPSBuZXcgQ2xpcHBlckxpYi5QYXRocygpO1xuICAgIGZvciAoYSA9IDAsIGFsZW4gPSBleHBvbHlnb25zLmxlbmd0aDsgYSA8IGFsZW47IGErKylcbiAgICB7XG4gICAgICBwYXRocy5wdXNoKGV4cG9seWdvbnNbYV0ub3V0ZXIpO1xuICAgICAgZm9yIChpID0gMCwgaWxlbiA9IGV4cG9seWdvbnNbYV0uaG9sZXMubGVuZ3RoOyBpIDwgaWxlbjsgaSsrKVxuICAgICAge1xuICAgICAgICBwYXRocy5wdXNoKGV4cG9seWdvbnNbYV0uaG9sZXNbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGF0aHM7XG4gIH1cbiAgQ2xpcHBlckxpYi5KUy5Qb2x5VHJlZVRvRXhQb2x5Z29ucyA9IGZ1bmN0aW9uIChwb2x5dHJlZSlcbiAge1xuICAgIHZhciBleHBvbHlnb25zID0gbmV3IENsaXBwZXJMaWIuRXhQb2x5Z29ucygpO1xuICAgIHZhciBub2RlLCBpLCBjaGlsZHMsIGlsZW47XG4gICAgZm9yIChpID0gMCwgY2hpbGRzID0gcG9seXRyZWUuQ2hpbGRzKCksIGlsZW4gPSBjaGlsZHMubGVuZ3RoOyBpIDwgaWxlbjsgaSsrKVxuICAgIHtcbiAgICAgIG5vZGUgPSBjaGlsZHNbaV07XG4gICAgICBDbGlwcGVyTGliLkpTLkFkZE91dGVyUG9seU5vZGVUb0V4UG9seWdvbnMobm9kZSwgZXhwb2x5Z29ucyk7XG4gICAgfVxuICAgIHJldHVybiBleHBvbHlnb25zO1xuICB9O1xufSkoKTtcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciB0d29Qcm9kdWN0ID0gcmVxdWlyZShcInR3by1wcm9kdWN0XCIpXG52YXIgcm9idXN0U3VtID0gcmVxdWlyZShcInJvYnVzdC1zdW1cIilcbnZhciByb2J1c3REaWZmID0gcmVxdWlyZShcInJvYnVzdC1zdWJ0cmFjdFwiKVxudmFyIHJvYnVzdFNjYWxlID0gcmVxdWlyZShcInJvYnVzdC1zY2FsZVwiKVxuXG52YXIgTlVNX0VYUEFORCA9IDZcblxuZnVuY3Rpb24gY29mYWN0b3IobSwgYykge1xuICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KG0ubGVuZ3RoLTEpXG4gIGZvcih2YXIgaT0xOyBpPG0ubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgciA9IHJlc3VsdFtpLTFdID0gbmV3IEFycmF5KG0ubGVuZ3RoLTEpXG4gICAgZm9yKHZhciBqPTAsaz0wOyBqPG0ubGVuZ3RoOyArK2opIHtcbiAgICAgIGlmKGogPT09IGMpIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIHJbaysrXSA9IG1baV1bal1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5mdW5jdGlvbiBtYXRyaXgobikge1xuICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KG4pXG4gIGZvcih2YXIgaT0wOyBpPG47ICsraSkge1xuICAgIHJlc3VsdFtpXSA9IG5ldyBBcnJheShuKVxuICAgIGZvcih2YXIgaj0wOyBqPG47ICsraikge1xuICAgICAgcmVzdWx0W2ldW2pdID0gW1wibVwiLCBqLCBcIltcIiwgKG4taS0yKSwgXCJdXCJdLmpvaW4oXCJcIilcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVN1bShleHByKSB7XG4gIGlmKGV4cHIubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGV4cHJbMF1cbiAgfSBlbHNlIGlmKGV4cHIubGVuZ3RoID09PSAyKSB7XG4gICAgcmV0dXJuIFtcInN1bShcIiwgZXhwclswXSwgXCIsXCIsIGV4cHJbMV0sIFwiKVwiXS5qb2luKFwiXCIpXG4gIH0gZWxzZSB7XG4gICAgdmFyIG0gPSBleHByLmxlbmd0aD4+MVxuICAgIHJldHVybiBbXCJzdW0oXCIsIGdlbmVyYXRlU3VtKGV4cHIuc2xpY2UoMCwgbSkpLCBcIixcIiwgZ2VuZXJhdGVTdW0oZXhwci5zbGljZShtKSksIFwiKVwiXS5qb2luKFwiXCIpXG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZVByb2R1Y3QoYSwgYikge1xuICBpZihhLmNoYXJBdCgwKSA9PT0gXCJtXCIpIHtcbiAgICBpZihiLmNoYXJBdCgwKSA9PT0gXCJ3XCIpIHtcbiAgICAgIHZhciB0b2tzID0gYS5zcGxpdChcIltcIilcbiAgICAgIHJldHVybiBbXCJ3XCIsIGIuc3Vic3RyKDEpLCBcIm1cIiwgdG9rc1swXS5zdWJzdHIoMSldLmpvaW4oXCJcIilcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFtcInByb2QoXCIsIGEsIFwiLFwiLCBiLCBcIilcIl0uam9pbihcIlwiKVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbWFrZVByb2R1Y3QoYiwgYSlcbiAgfVxufVxuXG5mdW5jdGlvbiBzaWduKHMpIHtcbiAgaWYocyAmIDEgIT09IDApIHtcbiAgICByZXR1cm4gXCItXCJcbiAgfVxuICByZXR1cm4gXCJcIlxufVxuXG5mdW5jdGlvbiBkZXRlcm1pbmFudChtKSB7XG4gIGlmKG0ubGVuZ3RoID09PSAyKSB7XG4gICAgcmV0dXJuIFtbXCJkaWZmKFwiLCBtYWtlUHJvZHVjdChtWzBdWzBdLCBtWzFdWzFdKSwgXCIsXCIsIG1ha2VQcm9kdWN0KG1bMV1bMF0sIG1bMF1bMV0pLCBcIilcIl0uam9pbihcIlwiKV1cbiAgfSBlbHNlIHtcbiAgICB2YXIgZXhwciA9IFtdXG4gICAgZm9yKHZhciBpPTA7IGk8bS5sZW5ndGg7ICsraSkge1xuICAgICAgZXhwci5wdXNoKFtcInNjYWxlKFwiLCBnZW5lcmF0ZVN1bShkZXRlcm1pbmFudChjb2ZhY3RvcihtLCBpKSkpLCBcIixcIiwgc2lnbihpKSwgbVswXVtpXSwgXCIpXCJdLmpvaW4oXCJcIikpXG4gICAgfVxuICAgIHJldHVybiBleHByXG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZVNxdWFyZShkLCBuKSB7XG4gIHZhciB0ZXJtcyA9IFtdXG4gIGZvcih2YXIgaT0wOyBpPG4tMjsgKytpKSB7XG4gICAgdGVybXMucHVzaChbXCJwcm9kKG1cIiwgZCwgXCJbXCIsIGksIFwiXSxtXCIsIGQsIFwiW1wiLCBpLCBcIl0pXCJdLmpvaW4oXCJcIikpXG4gIH1cbiAgcmV0dXJuIGdlbmVyYXRlU3VtKHRlcm1zKVxufVxuXG5mdW5jdGlvbiBvcmllbnRhdGlvbihuKSB7XG4gIHZhciBwb3MgPSBbXVxuICB2YXIgbmVnID0gW11cbiAgdmFyIG0gPSBtYXRyaXgobilcbiAgZm9yKHZhciBpPTA7IGk8bjsgKytpKSB7XG4gICAgbVswXVtpXSA9IFwiMVwiXG4gICAgbVtuLTFdW2ldID0gXCJ3XCIraVxuICB9IFxuICBmb3IodmFyIGk9MDsgaTxuOyArK2kpIHtcbiAgICBpZigoaSYxKT09PTApIHtcbiAgICAgIHBvcy5wdXNoLmFwcGx5KHBvcyxkZXRlcm1pbmFudChjb2ZhY3RvcihtLCBpKSkpXG4gICAgfSBlbHNlIHtcbiAgICAgIG5lZy5wdXNoLmFwcGx5KG5lZyxkZXRlcm1pbmFudChjb2ZhY3RvcihtLCBpKSkpXG4gICAgfVxuICB9XG4gIHZhciBwb3NFeHByID0gZ2VuZXJhdGVTdW0ocG9zKVxuICB2YXIgbmVnRXhwciA9IGdlbmVyYXRlU3VtKG5lZylcbiAgdmFyIGZ1bmNOYW1lID0gXCJleGFjdEluU3BoZXJlXCIgKyBuXG4gIHZhciBmdW5jQXJncyA9IFtdXG4gIGZvcih2YXIgaT0wOyBpPG47ICsraSkge1xuICAgIGZ1bmNBcmdzLnB1c2goXCJtXCIgKyBpKVxuICB9XG4gIHZhciBjb2RlID0gW1wiZnVuY3Rpb24gXCIsIGZ1bmNOYW1lLCBcIihcIiwgZnVuY0FyZ3Muam9pbigpLCBcIil7XCJdXG4gIGZvcih2YXIgaT0wOyBpPG47ICsraSkge1xuICAgIGNvZGUucHVzaChcInZhciB3XCIsaSxcIj1cIixtYWtlU3F1YXJlKGksbiksXCI7XCIpXG4gICAgZm9yKHZhciBqPTA7IGo8bjsgKytqKSB7XG4gICAgICBpZihqICE9PSBpKSB7XG4gICAgICAgIGNvZGUucHVzaChcInZhciB3XCIsaSxcIm1cIixqLFwiPXNjYWxlKHdcIixpLFwiLG1cIixqLFwiWzBdKTtcIilcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgY29kZS5wdXNoKFwidmFyIHA9XCIsIHBvc0V4cHIsIFwiLG49XCIsIG5lZ0V4cHIsIFwiLGQ9ZGlmZihwLG4pO3JldHVybiBkW2QubGVuZ3RoLTFdO31yZXR1cm4gXCIsIGZ1bmNOYW1lKVxuICB2YXIgcHJvYyA9IG5ldyBGdW5jdGlvbihcInN1bVwiLCBcImRpZmZcIiwgXCJwcm9kXCIsIFwic2NhbGVcIiwgY29kZS5qb2luKFwiXCIpKVxuICByZXR1cm4gcHJvYyhyb2J1c3RTdW0sIHJvYnVzdERpZmYsIHR3b1Byb2R1Y3QsIHJvYnVzdFNjYWxlKVxufVxuXG5mdW5jdGlvbiBpblNwaGVyZTAoKSB7IHJldHVybiAwIH1cbmZ1bmN0aW9uIGluU3BoZXJlMSgpIHsgcmV0dXJuIDAgfVxuZnVuY3Rpb24gaW5TcGhlcmUyKCkgeyByZXR1cm4gMCB9XG5cbnZhciBDQUNIRUQgPSBbXG4gIGluU3BoZXJlMCxcbiAgaW5TcGhlcmUxLFxuICBpblNwaGVyZTJcbl1cblxuZnVuY3Rpb24gc2xvd0luU3BoZXJlKGFyZ3MpIHtcbiAgdmFyIHByb2MgPSBDQUNIRURbYXJncy5sZW5ndGhdXG4gIGlmKCFwcm9jKSB7XG4gICAgcHJvYyA9IENBQ0hFRFthcmdzLmxlbmd0aF0gPSBvcmllbnRhdGlvbihhcmdzLmxlbmd0aClcbiAgfVxuICByZXR1cm4gcHJvYy5hcHBseSh1bmRlZmluZWQsIGFyZ3MpXG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlSW5TcGhlcmVUZXN0KCkge1xuICB3aGlsZShDQUNIRUQubGVuZ3RoIDw9IE5VTV9FWFBBTkQpIHtcbiAgICBDQUNIRUQucHVzaChvcmllbnRhdGlvbihDQUNIRUQubGVuZ3RoKSlcbiAgfVxuICB2YXIgYXJncyA9IFtdXG4gIHZhciBwcm9jQXJncyA9IFtcInNsb3dcIl1cbiAgZm9yKHZhciBpPTA7IGk8PU5VTV9FWFBBTkQ7ICsraSkge1xuICAgIGFyZ3MucHVzaChcImFcIiArIGkpXG4gICAgcHJvY0FyZ3MucHVzaChcIm9cIiArIGkpXG4gIH1cbiAgdmFyIGNvZGUgPSBbXG4gICAgXCJmdW5jdGlvbiB0ZXN0SW5TcGhlcmUoXCIsIGFyZ3Muam9pbigpLCBcIil7c3dpdGNoKGFyZ3VtZW50cy5sZW5ndGgpe2Nhc2UgMDpjYXNlIDE6cmV0dXJuIDA7XCJcbiAgXVxuICBmb3IodmFyIGk9MjsgaTw9TlVNX0VYUEFORDsgKytpKSB7XG4gICAgY29kZS5wdXNoKFwiY2FzZSBcIiwgaSwgXCI6cmV0dXJuIG9cIiwgaSwgXCIoXCIsIGFyZ3Muc2xpY2UoMCwgaSkuam9pbigpLCBcIik7XCIpXG4gIH1cbiAgY29kZS5wdXNoKFwifXZhciBzPW5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKTtmb3IodmFyIGk9MDtpPGFyZ3VtZW50cy5sZW5ndGg7KytpKXtzW2ldPWFyZ3VtZW50c1tpXX07cmV0dXJuIHNsb3cocyk7fXJldHVybiB0ZXN0SW5TcGhlcmVcIilcbiAgcHJvY0FyZ3MucHVzaChjb2RlLmpvaW4oXCJcIikpXG5cbiAgdmFyIHByb2MgPSBGdW5jdGlvbi5hcHBseSh1bmRlZmluZWQsIHByb2NBcmdzKVxuXG4gIG1vZHVsZS5leHBvcnRzID0gcHJvYy5hcHBseSh1bmRlZmluZWQsIFtzbG93SW5TcGhlcmVdLmNvbmNhdChDQUNIRUQpKVxuICBmb3IodmFyIGk9MDsgaTw9TlVNX0VYUEFORDsgKytpKSB7XG4gICAgbW9kdWxlLmV4cG9ydHNbaV0gPSBDQUNIRURbaV1cbiAgfVxufVxuXG5nZW5lcmF0ZUluU3BoZXJlVGVzdCgpIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIHR3b1Byb2R1Y3QgPSByZXF1aXJlKFwidHdvLXByb2R1Y3RcIilcbnZhciByb2J1c3RTdW0gPSByZXF1aXJlKFwicm9idXN0LXN1bVwiKVxudmFyIHJvYnVzdFNjYWxlID0gcmVxdWlyZShcInJvYnVzdC1zY2FsZVwiKVxudmFyIHJvYnVzdFN1YnRyYWN0ID0gcmVxdWlyZShcInJvYnVzdC1zdWJ0cmFjdFwiKVxuXG52YXIgTlVNX0VYUEFORCA9IDVcblxudmFyIEVQU0lMT04gICAgID0gMS4xMTAyMjMwMjQ2MjUxNTY1ZS0xNlxudmFyIEVSUkJPVU5EMyAgID0gKDMuMCArIDE2LjAgKiBFUFNJTE9OKSAqIEVQU0lMT05cbnZhciBFUlJCT1VORDQgICA9ICg3LjAgKyA1Ni4wICogRVBTSUxPTikgKiBFUFNJTE9OXG5cbmZ1bmN0aW9uIGNvZmFjdG9yKG0sIGMpIHtcbiAgdmFyIHJlc3VsdCA9IG5ldyBBcnJheShtLmxlbmd0aC0xKVxuICBmb3IodmFyIGk9MTsgaTxtLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIHIgPSByZXN1bHRbaS0xXSA9IG5ldyBBcnJheShtLmxlbmd0aC0xKVxuICAgIGZvcih2YXIgaj0wLGs9MDsgajxtLmxlbmd0aDsgKytqKSB7XG4gICAgICBpZihqID09PSBjKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICByW2srK10gPSBtW2ldW2pdXG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gbWF0cml4KG4pIHtcbiAgdmFyIHJlc3VsdCA9IG5ldyBBcnJheShuKVxuICBmb3IodmFyIGk9MDsgaTxuOyArK2kpIHtcbiAgICByZXN1bHRbaV0gPSBuZXcgQXJyYXkobilcbiAgICBmb3IodmFyIGo9MDsgajxuOyArK2opIHtcbiAgICAgIHJlc3VsdFtpXVtqXSA9IFtcIm1cIiwgaiwgXCJbXCIsIChuLWktMSksIFwiXVwiXS5qb2luKFwiXCIpXG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxuZnVuY3Rpb24gc2lnbihuKSB7XG4gIGlmKG4gJiAxKSB7XG4gICAgcmV0dXJuIFwiLVwiXG4gIH1cbiAgcmV0dXJuIFwiXCJcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVTdW0oZXhwcikge1xuICBpZihleHByLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBleHByWzBdXG4gIH0gZWxzZSBpZihleHByLmxlbmd0aCA9PT0gMikge1xuICAgIHJldHVybiBbXCJzdW0oXCIsIGV4cHJbMF0sIFwiLFwiLCBleHByWzFdLCBcIilcIl0uam9pbihcIlwiKVxuICB9IGVsc2Uge1xuICAgIHZhciBtID0gZXhwci5sZW5ndGg+PjFcbiAgICByZXR1cm4gW1wic3VtKFwiLCBnZW5lcmF0ZVN1bShleHByLnNsaWNlKDAsIG0pKSwgXCIsXCIsIGdlbmVyYXRlU3VtKGV4cHIuc2xpY2UobSkpLCBcIilcIl0uam9pbihcIlwiKVxuICB9XG59XG5cbmZ1bmN0aW9uIGRldGVybWluYW50KG0pIHtcbiAgaWYobS5sZW5ndGggPT09IDIpIHtcbiAgICByZXR1cm4gW1tcInN1bShwcm9kKFwiLCBtWzBdWzBdLCBcIixcIiwgbVsxXVsxXSwgXCIpLHByb2QoLVwiLCBtWzBdWzFdLCBcIixcIiwgbVsxXVswXSwgXCIpKVwiXS5qb2luKFwiXCIpXVxuICB9IGVsc2Uge1xuICAgIHZhciBleHByID0gW11cbiAgICBmb3IodmFyIGk9MDsgaTxtLmxlbmd0aDsgKytpKSB7XG4gICAgICBleHByLnB1c2goW1wic2NhbGUoXCIsIGdlbmVyYXRlU3VtKGRldGVybWluYW50KGNvZmFjdG9yKG0sIGkpKSksIFwiLFwiLCBzaWduKGkpLCBtWzBdW2ldLCBcIilcIl0uam9pbihcIlwiKSlcbiAgICB9XG4gICAgcmV0dXJuIGV4cHJcbiAgfVxufVxuXG5mdW5jdGlvbiBvcmllbnRhdGlvbihuKSB7XG4gIHZhciBwb3MgPSBbXVxuICB2YXIgbmVnID0gW11cbiAgdmFyIG0gPSBtYXRyaXgobilcbiAgdmFyIGFyZ3MgPSBbXVxuICBmb3IodmFyIGk9MDsgaTxuOyArK2kpIHtcbiAgICBpZigoaSYxKT09PTApIHtcbiAgICAgIHBvcy5wdXNoLmFwcGx5KHBvcywgZGV0ZXJtaW5hbnQoY29mYWN0b3IobSwgaSkpKVxuICAgIH0gZWxzZSB7XG4gICAgICBuZWcucHVzaC5hcHBseShuZWcsIGRldGVybWluYW50KGNvZmFjdG9yKG0sIGkpKSlcbiAgICB9XG4gICAgYXJncy5wdXNoKFwibVwiICsgaSlcbiAgfVxuICB2YXIgcG9zRXhwciA9IGdlbmVyYXRlU3VtKHBvcylcbiAgdmFyIG5lZ0V4cHIgPSBnZW5lcmF0ZVN1bShuZWcpXG4gIHZhciBmdW5jTmFtZSA9IFwib3JpZW50YXRpb25cIiArIG4gKyBcIkV4YWN0XCJcbiAgdmFyIGNvZGUgPSBbXCJmdW5jdGlvbiBcIiwgZnVuY05hbWUsIFwiKFwiLCBhcmdzLmpvaW4oKSwgXCIpe3ZhciBwPVwiLCBwb3NFeHByLCBcIixuPVwiLCBuZWdFeHByLCBcIixkPXN1YihwLG4pO1xcXG5yZXR1cm4gZFtkLmxlbmd0aC0xXTt9O3JldHVybiBcIiwgZnVuY05hbWVdLmpvaW4oXCJcIilcbiAgdmFyIHByb2MgPSBuZXcgRnVuY3Rpb24oXCJzdW1cIiwgXCJwcm9kXCIsIFwic2NhbGVcIiwgXCJzdWJcIiwgY29kZSlcbiAgcmV0dXJuIHByb2Mocm9idXN0U3VtLCB0d29Qcm9kdWN0LCByb2J1c3RTY2FsZSwgcm9idXN0U3VidHJhY3QpXG59XG5cbnZhciBvcmllbnRhdGlvbjNFeGFjdCA9IG9yaWVudGF0aW9uKDMpXG52YXIgb3JpZW50YXRpb240RXhhY3QgPSBvcmllbnRhdGlvbig0KVxuXG52YXIgQ0FDSEVEID0gW1xuICBmdW5jdGlvbiBvcmllbnRhdGlvbjAoKSB7IHJldHVybiAwIH0sXG4gIGZ1bmN0aW9uIG9yaWVudGF0aW9uMSgpIHsgcmV0dXJuIDAgfSxcbiAgZnVuY3Rpb24gb3JpZW50YXRpb24yKGEsIGIpIHsgXG4gICAgcmV0dXJuIGJbMF0gLSBhWzBdXG4gIH0sXG4gIGZ1bmN0aW9uIG9yaWVudGF0aW9uMyhhLCBiLCBjKSB7XG4gICAgdmFyIGwgPSAoYVsxXSAtIGNbMV0pICogKGJbMF0gLSBjWzBdKVxuICAgIHZhciByID0gKGFbMF0gLSBjWzBdKSAqIChiWzFdIC0gY1sxXSlcbiAgICB2YXIgZGV0ID0gbCAtIHJcbiAgICB2YXIgc1xuICAgIGlmKGwgPiAwKSB7XG4gICAgICBpZihyIDw9IDApIHtcbiAgICAgICAgcmV0dXJuIGRldFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcyA9IGwgKyByXG4gICAgICB9XG4gICAgfSBlbHNlIGlmKGwgPCAwKSB7XG4gICAgICBpZihyID49IDApIHtcbiAgICAgICAgcmV0dXJuIGRldFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcyA9IC0obCArIHIpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBkZXRcbiAgICB9XG4gICAgdmFyIHRvbCA9IEVSUkJPVU5EMyAqIHNcbiAgICBpZihkZXQgPj0gdG9sIHx8IGRldCA8PSAtdG9sKSB7XG4gICAgICByZXR1cm4gZGV0XG4gICAgfVxuICAgIHJldHVybiBvcmllbnRhdGlvbjNFeGFjdChhLCBiLCBjKVxuICB9LFxuICBmdW5jdGlvbiBvcmllbnRhdGlvbjQoYSxiLGMsZCkge1xuICAgIHZhciBhZHggPSBhWzBdIC0gZFswXVxuICAgIHZhciBiZHggPSBiWzBdIC0gZFswXVxuICAgIHZhciBjZHggPSBjWzBdIC0gZFswXVxuICAgIHZhciBhZHkgPSBhWzFdIC0gZFsxXVxuICAgIHZhciBiZHkgPSBiWzFdIC0gZFsxXVxuICAgIHZhciBjZHkgPSBjWzFdIC0gZFsxXVxuICAgIHZhciBhZHogPSBhWzJdIC0gZFsyXVxuICAgIHZhciBiZHogPSBiWzJdIC0gZFsyXVxuICAgIHZhciBjZHogPSBjWzJdIC0gZFsyXVxuICAgIHZhciBiZHhjZHkgPSBiZHggKiBjZHlcbiAgICB2YXIgY2R4YmR5ID0gY2R4ICogYmR5XG4gICAgdmFyIGNkeGFkeSA9IGNkeCAqIGFkeVxuICAgIHZhciBhZHhjZHkgPSBhZHggKiBjZHlcbiAgICB2YXIgYWR4YmR5ID0gYWR4ICogYmR5XG4gICAgdmFyIGJkeGFkeSA9IGJkeCAqIGFkeVxuICAgIHZhciBkZXQgPSBhZHogKiAoYmR4Y2R5IC0gY2R4YmR5KSBcbiAgICAgICAgICAgICsgYmR6ICogKGNkeGFkeSAtIGFkeGNkeSlcbiAgICAgICAgICAgICsgY2R6ICogKGFkeGJkeSAtIGJkeGFkeSlcbiAgICB2YXIgcGVybWFuZW50ID0gKE1hdGguYWJzKGJkeGNkeSkgKyBNYXRoLmFicyhjZHhiZHkpKSAqIE1hdGguYWJzKGFkeilcbiAgICAgICAgICAgICAgICAgICsgKE1hdGguYWJzKGNkeGFkeSkgKyBNYXRoLmFicyhhZHhjZHkpKSAqIE1hdGguYWJzKGJkeilcbiAgICAgICAgICAgICAgICAgICsgKE1hdGguYWJzKGFkeGJkeSkgKyBNYXRoLmFicyhiZHhhZHkpKSAqIE1hdGguYWJzKGNkeilcbiAgICB2YXIgdG9sID0gRVJSQk9VTkQ0ICogcGVybWFuZW50XG4gICAgaWYgKChkZXQgPiB0b2wpIHx8ICgtZGV0ID4gdG9sKSkge1xuICAgICAgcmV0dXJuIGRldFxuICAgIH1cbiAgICByZXR1cm4gb3JpZW50YXRpb240RXhhY3QoYSxiLGMsZClcbiAgfVxuXVxuXG5mdW5jdGlvbiBzbG93T3JpZW50KGFyZ3MpIHtcbiAgdmFyIHByb2MgPSBDQUNIRURbYXJncy5sZW5ndGhdXG4gIGlmKCFwcm9jKSB7XG4gICAgcHJvYyA9IENBQ0hFRFthcmdzLmxlbmd0aF0gPSBvcmllbnRhdGlvbihhcmdzLmxlbmd0aClcbiAgfVxuICByZXR1cm4gcHJvYy5hcHBseSh1bmRlZmluZWQsIGFyZ3MpXG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlT3JpZW50YXRpb25Qcm9jKCkge1xuICB3aGlsZShDQUNIRUQubGVuZ3RoIDw9IE5VTV9FWFBBTkQpIHtcbiAgICBDQUNIRUQucHVzaChvcmllbnRhdGlvbihDQUNIRUQubGVuZ3RoKSlcbiAgfVxuICB2YXIgYXJncyA9IFtdXG4gIHZhciBwcm9jQXJncyA9IFtcInNsb3dcIl1cbiAgZm9yKHZhciBpPTA7IGk8PU5VTV9FWFBBTkQ7ICsraSkge1xuICAgIGFyZ3MucHVzaChcImFcIiArIGkpXG4gICAgcHJvY0FyZ3MucHVzaChcIm9cIiArIGkpXG4gIH1cbiAgdmFyIGNvZGUgPSBbXG4gICAgXCJmdW5jdGlvbiBnZXRPcmllbnRhdGlvbihcIiwgYXJncy5qb2luKCksIFwiKXtzd2l0Y2goYXJndW1lbnRzLmxlbmd0aCl7Y2FzZSAwOmNhc2UgMTpyZXR1cm4gMDtcIlxuICBdXG4gIGZvcih2YXIgaT0yOyBpPD1OVU1fRVhQQU5EOyArK2kpIHtcbiAgICBjb2RlLnB1c2goXCJjYXNlIFwiLCBpLCBcIjpyZXR1cm4gb1wiLCBpLCBcIihcIiwgYXJncy5zbGljZSgwLCBpKS5qb2luKCksIFwiKTtcIilcbiAgfVxuICBjb2RlLnB1c2goXCJ9dmFyIHM9bmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGgpO2Zvcih2YXIgaT0wO2k8YXJndW1lbnRzLmxlbmd0aDsrK2kpe3NbaV09YXJndW1lbnRzW2ldfTtyZXR1cm4gc2xvdyhzKTt9cmV0dXJuIGdldE9yaWVudGF0aW9uXCIpXG4gIHByb2NBcmdzLnB1c2goY29kZS5qb2luKFwiXCIpKVxuXG4gIHZhciBwcm9jID0gRnVuY3Rpb24uYXBwbHkodW5kZWZpbmVkLCBwcm9jQXJncylcbiAgbW9kdWxlLmV4cG9ydHMgPSBwcm9jLmFwcGx5KHVuZGVmaW5lZCwgW3Nsb3dPcmllbnRdLmNvbmNhdChDQUNIRUQpKVxuICBmb3IodmFyIGk9MDsgaTw9TlVNX0VYUEFORDsgKytpKSB7XG4gICAgbW9kdWxlLmV4cG9ydHNbaV0gPSBDQUNIRURbaV1cbiAgfVxufVxuXG5nZW5lcmF0ZU9yaWVudGF0aW9uUHJvYygpIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIHR3b1Byb2R1Y3QgPSByZXF1aXJlKFwidHdvLXByb2R1Y3RcIilcbnZhciB0d29TdW0gPSByZXF1aXJlKFwidHdvLXN1bVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNjYWxlTGluZWFyRXhwYW5zaW9uXG5cbmZ1bmN0aW9uIHNjYWxlTGluZWFyRXhwYW5zaW9uKGUsIHNjYWxlKSB7XG4gIHZhciBuID0gZS5sZW5ndGhcbiAgaWYobiA9PT0gMSkge1xuICAgIHZhciB0cyA9IHR3b1Byb2R1Y3QoZVswXSwgc2NhbGUpXG4gICAgaWYodHNbMF0pIHtcbiAgICAgIHJldHVybiB0c1xuICAgIH1cbiAgICByZXR1cm4gWyB0c1sxXSBdXG4gIH1cbiAgdmFyIGcgPSBuZXcgQXJyYXkoMiAqIG4pXG4gIHZhciBxID0gWzAuMSwgMC4xXVxuICB2YXIgdCA9IFswLjEsIDAuMV1cbiAgdmFyIGNvdW50ID0gMFxuICB0d29Qcm9kdWN0KGVbMF0sIHNjYWxlLCBxKVxuICBpZihxWzBdKSB7XG4gICAgZ1tjb3VudCsrXSA9IHFbMF1cbiAgfVxuICBmb3IodmFyIGk9MTsgaTxuOyArK2kpIHtcbiAgICB0d29Qcm9kdWN0KGVbaV0sIHNjYWxlLCB0KVxuICAgIHZhciBwcSA9IHFbMV1cbiAgICB0d29TdW0ocHEsIHRbMF0sIHEpXG4gICAgaWYocVswXSkge1xuICAgICAgZ1tjb3VudCsrXSA9IHFbMF1cbiAgICB9XG4gICAgdmFyIGEgPSB0WzFdXG4gICAgdmFyIGIgPSBxWzFdXG4gICAgdmFyIHggPSBhICsgYlxuICAgIHZhciBidiA9IHggLSBhXG4gICAgdmFyIHkgPSBiIC0gYnZcbiAgICBxWzFdID0geFxuICAgIGlmKHkpIHtcbiAgICAgIGdbY291bnQrK10gPSB5XG4gICAgfVxuICB9XG4gIGlmKHFbMV0pIHtcbiAgICBnW2NvdW50KytdID0gcVsxXVxuICB9XG4gIGlmKGNvdW50ID09PSAwKSB7XG4gICAgZ1tjb3VudCsrXSA9IDAuMFxuICB9XG4gIGcubGVuZ3RoID0gY291bnRcbiAgcmV0dXJuIGdcbn0iLCJcInVzZSBzdHJpY3RcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IHJvYnVzdFN1YnRyYWN0XG5cbi8vRWFzeSBjYXNlOiBBZGQgdHdvIHNjYWxhcnNcbmZ1bmN0aW9uIHNjYWxhclNjYWxhcihhLCBiKSB7XG4gIHZhciB4ID0gYSArIGJcbiAgdmFyIGJ2ID0geCAtIGFcbiAgdmFyIGF2ID0geCAtIGJ2XG4gIHZhciBiciA9IGIgLSBidlxuICB2YXIgYXIgPSBhIC0gYXZcbiAgdmFyIHkgPSBhciArIGJyXG4gIGlmKHkpIHtcbiAgICByZXR1cm4gW3ksIHhdXG4gIH1cbiAgcmV0dXJuIFt4XVxufVxuXG5mdW5jdGlvbiByb2J1c3RTdWJ0cmFjdChlLCBmKSB7XG4gIHZhciBuZSA9IGUubGVuZ3RofDBcbiAgdmFyIG5mID0gZi5sZW5ndGh8MFxuICBpZihuZSA9PT0gMSAmJiBuZiA9PT0gMSkge1xuICAgIHJldHVybiBzY2FsYXJTY2FsYXIoZVswXSwgLWZbMF0pXG4gIH1cbiAgdmFyIG4gPSBuZSArIG5mXG4gIHZhciBnID0gbmV3IEFycmF5KG4pXG4gIHZhciBjb3VudCA9IDBcbiAgdmFyIGVwdHIgPSAwXG4gIHZhciBmcHRyID0gMFxuICB2YXIgYWJzID0gTWF0aC5hYnNcbiAgdmFyIGVpID0gZVtlcHRyXVxuICB2YXIgZWEgPSBhYnMoZWkpXG4gIHZhciBmaSA9IC1mW2ZwdHJdXG4gIHZhciBmYSA9IGFicyhmaSlcbiAgdmFyIGEsIGJcbiAgaWYoZWEgPCBmYSkge1xuICAgIGIgPSBlaVxuICAgIGVwdHIgKz0gMVxuICAgIGlmKGVwdHIgPCBuZSkge1xuICAgICAgZWkgPSBlW2VwdHJdXG4gICAgICBlYSA9IGFicyhlaSlcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgYiA9IGZpXG4gICAgZnB0ciArPSAxXG4gICAgaWYoZnB0ciA8IG5mKSB7XG4gICAgICBmaSA9IC1mW2ZwdHJdXG4gICAgICBmYSA9IGFicyhmaSlcbiAgICB9XG4gIH1cbiAgaWYoKGVwdHIgPCBuZSAmJiBlYSA8IGZhKSB8fCAoZnB0ciA+PSBuZikpIHtcbiAgICBhID0gZWlcbiAgICBlcHRyICs9IDFcbiAgICBpZihlcHRyIDwgbmUpIHtcbiAgICAgIGVpID0gZVtlcHRyXVxuICAgICAgZWEgPSBhYnMoZWkpXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGEgPSBmaVxuICAgIGZwdHIgKz0gMVxuICAgIGlmKGZwdHIgPCBuZikge1xuICAgICAgZmkgPSAtZltmcHRyXVxuICAgICAgZmEgPSBhYnMoZmkpXG4gICAgfVxuICB9XG4gIHZhciB4ID0gYSArIGJcbiAgdmFyIGJ2ID0geCAtIGFcbiAgdmFyIHkgPSBiIC0gYnZcbiAgdmFyIHEwID0geVxuICB2YXIgcTEgPSB4XG4gIHZhciBfeCwgX2J2LCBfYXYsIF9iciwgX2FyXG4gIHdoaWxlKGVwdHIgPCBuZSAmJiBmcHRyIDwgbmYpIHtcbiAgICBpZihlYSA8IGZhKSB7XG4gICAgICBhID0gZWlcbiAgICAgIGVwdHIgKz0gMVxuICAgICAgaWYoZXB0ciA8IG5lKSB7XG4gICAgICAgIGVpID0gZVtlcHRyXVxuICAgICAgICBlYSA9IGFicyhlaSlcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYSA9IGZpXG4gICAgICBmcHRyICs9IDFcbiAgICAgIGlmKGZwdHIgPCBuZikge1xuICAgICAgICBmaSA9IC1mW2ZwdHJdXG4gICAgICAgIGZhID0gYWJzKGZpKVxuICAgICAgfVxuICAgIH1cbiAgICBiID0gcTBcbiAgICB4ID0gYSArIGJcbiAgICBidiA9IHggLSBhXG4gICAgeSA9IGIgLSBidlxuICAgIGlmKHkpIHtcbiAgICAgIGdbY291bnQrK10gPSB5XG4gICAgfVxuICAgIF94ID0gcTEgKyB4XG4gICAgX2J2ID0gX3ggLSBxMVxuICAgIF9hdiA9IF94IC0gX2J2XG4gICAgX2JyID0geCAtIF9idlxuICAgIF9hciA9IHExIC0gX2F2XG4gICAgcTAgPSBfYXIgKyBfYnJcbiAgICBxMSA9IF94XG4gIH1cbiAgd2hpbGUoZXB0ciA8IG5lKSB7XG4gICAgYSA9IGVpXG4gICAgYiA9IHEwXG4gICAgeCA9IGEgKyBiXG4gICAgYnYgPSB4IC0gYVxuICAgIHkgPSBiIC0gYnZcbiAgICBpZih5KSB7XG4gICAgICBnW2NvdW50KytdID0geVxuICAgIH1cbiAgICBfeCA9IHExICsgeFxuICAgIF9idiA9IF94IC0gcTFcbiAgICBfYXYgPSBfeCAtIF9idlxuICAgIF9iciA9IHggLSBfYnZcbiAgICBfYXIgPSBxMSAtIF9hdlxuICAgIHEwID0gX2FyICsgX2JyXG4gICAgcTEgPSBfeFxuICAgIGVwdHIgKz0gMVxuICAgIGlmKGVwdHIgPCBuZSkge1xuICAgICAgZWkgPSBlW2VwdHJdXG4gICAgfVxuICB9XG4gIHdoaWxlKGZwdHIgPCBuZikge1xuICAgIGEgPSBmaVxuICAgIGIgPSBxMFxuICAgIHggPSBhICsgYlxuICAgIGJ2ID0geCAtIGFcbiAgICB5ID0gYiAtIGJ2XG4gICAgaWYoeSkge1xuICAgICAgZ1tjb3VudCsrXSA9IHlcbiAgICB9IFxuICAgIF94ID0gcTEgKyB4XG4gICAgX2J2ID0gX3ggLSBxMVxuICAgIF9hdiA9IF94IC0gX2J2XG4gICAgX2JyID0geCAtIF9idlxuICAgIF9hciA9IHExIC0gX2F2XG4gICAgcTAgPSBfYXIgKyBfYnJcbiAgICBxMSA9IF94XG4gICAgZnB0ciArPSAxXG4gICAgaWYoZnB0ciA8IG5mKSB7XG4gICAgICBmaSA9IC1mW2ZwdHJdXG4gICAgfVxuICB9XG4gIGlmKHEwKSB7XG4gICAgZ1tjb3VudCsrXSA9IHEwXG4gIH1cbiAgaWYocTEpIHtcbiAgICBnW2NvdW50KytdID0gcTFcbiAgfVxuICBpZighY291bnQpIHtcbiAgICBnW2NvdW50KytdID0gMC4wICBcbiAgfVxuICBnLmxlbmd0aCA9IGNvdW50XG4gIHJldHVybiBnXG59IiwiXCJ1c2Ugc3RyaWN0XCJcblxubW9kdWxlLmV4cG9ydHMgPSBsaW5lYXJFeHBhbnNpb25TdW1cblxuLy9FYXN5IGNhc2U6IEFkZCB0d28gc2NhbGFyc1xuZnVuY3Rpb24gc2NhbGFyU2NhbGFyKGEsIGIpIHtcbiAgdmFyIHggPSBhICsgYlxuICB2YXIgYnYgPSB4IC0gYVxuICB2YXIgYXYgPSB4IC0gYnZcbiAgdmFyIGJyID0gYiAtIGJ2XG4gIHZhciBhciA9IGEgLSBhdlxuICB2YXIgeSA9IGFyICsgYnJcbiAgaWYoeSkge1xuICAgIHJldHVybiBbeSwgeF1cbiAgfVxuICByZXR1cm4gW3hdXG59XG5cbmZ1bmN0aW9uIGxpbmVhckV4cGFuc2lvblN1bShlLCBmKSB7XG4gIHZhciBuZSA9IGUubGVuZ3RofDBcbiAgdmFyIG5mID0gZi5sZW5ndGh8MFxuICBpZihuZSA9PT0gMSAmJiBuZiA9PT0gMSkge1xuICAgIHJldHVybiBzY2FsYXJTY2FsYXIoZVswXSwgZlswXSlcbiAgfVxuICB2YXIgbiA9IG5lICsgbmZcbiAgdmFyIGcgPSBuZXcgQXJyYXkobilcbiAgdmFyIGNvdW50ID0gMFxuICB2YXIgZXB0ciA9IDBcbiAgdmFyIGZwdHIgPSAwXG4gIHZhciBhYnMgPSBNYXRoLmFic1xuICB2YXIgZWkgPSBlW2VwdHJdXG4gIHZhciBlYSA9IGFicyhlaSlcbiAgdmFyIGZpID0gZltmcHRyXVxuICB2YXIgZmEgPSBhYnMoZmkpXG4gIHZhciBhLCBiXG4gIGlmKGVhIDwgZmEpIHtcbiAgICBiID0gZWlcbiAgICBlcHRyICs9IDFcbiAgICBpZihlcHRyIDwgbmUpIHtcbiAgICAgIGVpID0gZVtlcHRyXVxuICAgICAgZWEgPSBhYnMoZWkpXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGIgPSBmaVxuICAgIGZwdHIgKz0gMVxuICAgIGlmKGZwdHIgPCBuZikge1xuICAgICAgZmkgPSBmW2ZwdHJdXG4gICAgICBmYSA9IGFicyhmaSlcbiAgICB9XG4gIH1cbiAgaWYoKGVwdHIgPCBuZSAmJiBlYSA8IGZhKSB8fCAoZnB0ciA+PSBuZikpIHtcbiAgICBhID0gZWlcbiAgICBlcHRyICs9IDFcbiAgICBpZihlcHRyIDwgbmUpIHtcbiAgICAgIGVpID0gZVtlcHRyXVxuICAgICAgZWEgPSBhYnMoZWkpXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGEgPSBmaVxuICAgIGZwdHIgKz0gMVxuICAgIGlmKGZwdHIgPCBuZikge1xuICAgICAgZmkgPSBmW2ZwdHJdXG4gICAgICBmYSA9IGFicyhmaSlcbiAgICB9XG4gIH1cbiAgdmFyIHggPSBhICsgYlxuICB2YXIgYnYgPSB4IC0gYVxuICB2YXIgeSA9IGIgLSBidlxuICB2YXIgcTAgPSB5XG4gIHZhciBxMSA9IHhcbiAgdmFyIF94LCBfYnYsIF9hdiwgX2JyLCBfYXJcbiAgd2hpbGUoZXB0ciA8IG5lICYmIGZwdHIgPCBuZikge1xuICAgIGlmKGVhIDwgZmEpIHtcbiAgICAgIGEgPSBlaVxuICAgICAgZXB0ciArPSAxXG4gICAgICBpZihlcHRyIDwgbmUpIHtcbiAgICAgICAgZWkgPSBlW2VwdHJdXG4gICAgICAgIGVhID0gYWJzKGVpKVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBhID0gZmlcbiAgICAgIGZwdHIgKz0gMVxuICAgICAgaWYoZnB0ciA8IG5mKSB7XG4gICAgICAgIGZpID0gZltmcHRyXVxuICAgICAgICBmYSA9IGFicyhmaSlcbiAgICAgIH1cbiAgICB9XG4gICAgYiA9IHEwXG4gICAgeCA9IGEgKyBiXG4gICAgYnYgPSB4IC0gYVxuICAgIHkgPSBiIC0gYnZcbiAgICBpZih5KSB7XG4gICAgICBnW2NvdW50KytdID0geVxuICAgIH1cbiAgICBfeCA9IHExICsgeFxuICAgIF9idiA9IF94IC0gcTFcbiAgICBfYXYgPSBfeCAtIF9idlxuICAgIF9iciA9IHggLSBfYnZcbiAgICBfYXIgPSBxMSAtIF9hdlxuICAgIHEwID0gX2FyICsgX2JyXG4gICAgcTEgPSBfeFxuICB9XG4gIHdoaWxlKGVwdHIgPCBuZSkge1xuICAgIGEgPSBlaVxuICAgIGIgPSBxMFxuICAgIHggPSBhICsgYlxuICAgIGJ2ID0geCAtIGFcbiAgICB5ID0gYiAtIGJ2XG4gICAgaWYoeSkge1xuICAgICAgZ1tjb3VudCsrXSA9IHlcbiAgICB9XG4gICAgX3ggPSBxMSArIHhcbiAgICBfYnYgPSBfeCAtIHExXG4gICAgX2F2ID0gX3ggLSBfYnZcbiAgICBfYnIgPSB4IC0gX2J2XG4gICAgX2FyID0gcTEgLSBfYXZcbiAgICBxMCA9IF9hciArIF9iclxuICAgIHExID0gX3hcbiAgICBlcHRyICs9IDFcbiAgICBpZihlcHRyIDwgbmUpIHtcbiAgICAgIGVpID0gZVtlcHRyXVxuICAgIH1cbiAgfVxuICB3aGlsZShmcHRyIDwgbmYpIHtcbiAgICBhID0gZmlcbiAgICBiID0gcTBcbiAgICB4ID0gYSArIGJcbiAgICBidiA9IHggLSBhXG4gICAgeSA9IGIgLSBidlxuICAgIGlmKHkpIHtcbiAgICAgIGdbY291bnQrK10gPSB5XG4gICAgfSBcbiAgICBfeCA9IHExICsgeFxuICAgIF9idiA9IF94IC0gcTFcbiAgICBfYXYgPSBfeCAtIF9idlxuICAgIF9iciA9IHggLSBfYnZcbiAgICBfYXIgPSBxMSAtIF9hdlxuICAgIHEwID0gX2FyICsgX2JyXG4gICAgcTEgPSBfeFxuICAgIGZwdHIgKz0gMVxuICAgIGlmKGZwdHIgPCBuZikge1xuICAgICAgZmkgPSBmW2ZwdHJdXG4gICAgfVxuICB9XG4gIGlmKHEwKSB7XG4gICAgZ1tjb3VudCsrXSA9IHEwXG4gIH1cbiAgaWYocTEpIHtcbiAgICBnW2NvdW50KytdID0gcTFcbiAgfVxuICBpZighY291bnQpIHtcbiAgICBnW2NvdW50KytdID0gMC4wICBcbiAgfVxuICBnLmxlbmd0aCA9IGNvdW50XG4gIHJldHVybiBnXG59IiwiXCJ1c2Ugc3RyaWN0XCJcblxubW9kdWxlLmV4cG9ydHMgPSB0d29Qcm9kdWN0XG5cbnZhciBTUExJVFRFUiA9ICsoTWF0aC5wb3coMiwgMjcpICsgMS4wKVxuXG5mdW5jdGlvbiB0d29Qcm9kdWN0KGEsIGIsIHJlc3VsdCkge1xuICB2YXIgeCA9IGEgKiBiXG5cbiAgdmFyIGMgPSBTUExJVFRFUiAqIGFcbiAgdmFyIGFiaWcgPSBjIC0gYVxuICB2YXIgYWhpID0gYyAtIGFiaWdcbiAgdmFyIGFsbyA9IGEgLSBhaGlcblxuICB2YXIgZCA9IFNQTElUVEVSICogYlxuICB2YXIgYmJpZyA9IGQgLSBiXG4gIHZhciBiaGkgPSBkIC0gYmJpZ1xuICB2YXIgYmxvID0gYiAtIGJoaVxuXG4gIHZhciBlcnIxID0geCAtIChhaGkgKiBiaGkpXG4gIHZhciBlcnIyID0gZXJyMSAtIChhbG8gKiBiaGkpXG4gIHZhciBlcnIzID0gZXJyMiAtIChhaGkgKiBibG8pXG5cbiAgdmFyIHkgPSBhbG8gKiBibG8gLSBlcnIzXG5cbiAgaWYocmVzdWx0KSB7XG4gICAgcmVzdWx0WzBdID0geVxuICAgIHJlc3VsdFsxXSA9IHhcbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICByZXR1cm4gWyB5LCB4IF1cbn0iLCJcInVzZSBzdHJpY3RcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZhc3RUd29TdW1cblxuZnVuY3Rpb24gZmFzdFR3b1N1bShhLCBiLCByZXN1bHQpIHtcblx0dmFyIHggPSBhICsgYlxuXHR2YXIgYnYgPSB4IC0gYVxuXHR2YXIgYXYgPSB4IC0gYnZcblx0dmFyIGJyID0gYiAtIGJ2XG5cdHZhciBhciA9IGEgLSBhdlxuXHRpZihyZXN1bHQpIHtcblx0XHRyZXN1bHRbMF0gPSBhciArIGJyXG5cdFx0cmVzdWx0WzFdID0geFxuXHRcdHJldHVybiByZXN1bHRcblx0fVxuXHRyZXR1cm4gW2FyK2JyLCB4XVxufSJdfQ==
