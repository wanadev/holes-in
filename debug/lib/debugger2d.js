"use strict";

const pathTracer = require("./pathTracer");
const holesIn = require("../../lib/index");
const extruder = require("../../lib/extruder");
const pathHelper = require('../../lib/path-helper');
const cdt2dHelper = require('../../lib/cdt2d-helper');


const debugger2d = {

    cssclass: "canvas2d",
    canvasWidth: 1200,
    canvasHeight: 300,

    createCanvas(id, parent, cssclass) {
        const canvas = document.createElement("canvas");
        parent.appendChild(canvas);
        canvas.setAttribute("id", id);
        canvas.classList.add(cssclass);
        canvas.width = debugger2d.canvasWidth;
        canvas.height = debugger2d.canvasHeight;

        return canvas;
    },

    createLegend(id, parent, text, cssclass = "" ) {
        const paragraph = document.createElement("p");
        paragraph.setAttribute("id", id);
        if(cssclass.length > 0)
            paragraph.classList.add(cssclass);

        paragraph.innerHTML = text;


        parent.appendChild(paragraph);
        return paragraph;
    },

    traceAllData(outerShape, holes, doNotBuild) {
        let cpyHoles = debugger2d._objectClone(holes);
        let cpyOuterShape = debugger2d._objectClone(outerShape);

        pathHelper.scaleUpPath(cpyOuterShape.path);
        cpyHoles.forEach(elt => pathHelper.scaleUpPath(elt.path))

        let dataByDepth = extruder.getDataByDepth(cpyOuterShape, cpyHoles);
        const transform = debugger2d.getTransform(cpyOuterShape, cpyHoles, dataByDepth.depthsCount);

        const parent = document.getElementById("container");
        debugger2d.traceInputHoles(cpyHoles, cpyOuterShape, parent, transform);

        if (doNotBuild && doNotBuild.length) {
            // cpyHoles = debugger2d._objectClone(holes);
            // cpyOuterShape = debugger2d._objectClone(outerShape);
            let cpyDoNotBuild = debugger2d._objectClone(doNotBuild);
            cpyDoNotBuild.forEach(path => pathHelper.scaleUpPath(path));
            debugger2d.traceDoNotBuild(cpyOuterShape, cpyHoles, cpyDoNotBuild, parent, transform);
        }
        // debugger2d.traceHolesByDepth(holesByDepth, parent, transform, cpyOuterShape);
        debugger2d.traceDataByDepth(dataByDepth, parent, transform);
        debugger2d.traceTriangulationByDepth(dataByDepth, parent, transform);


    },
    traceDoNotBuild(outerShape, holes, doNotBuild, parent, transform) {
        transform = debugger2d._objectClone(transform);
        debugger2d.createLegend("inputLegend", parent,"Input and Do Not Build");
        const canvas = debugger2d.createCanvas("inputData", parent, debugger2d.cssclass);
        const inputPaths = holes.map(hole => hole.path).concat([outerShape.path]);
        pathTracer.tracePathsInRow(canvas, inputPaths, transform, "black","");

        const num = holes.length+1;
        debugger2d.translateRight(transform, 0, num);
        debugger2d.traceDelimiter(canvas, 0, num);
        pathTracer.tracePathsInRow(canvas, doNotBuild, transform, "red","");
        debugger2d.translateRight(transform, 1, num);
        debugger2d.traceDelimiter(canvas, 1, num);
        pathTracer.tracePathsInRow(canvas, inputPaths, transform, "black","");
        pathTracer.tracePathsInRow(canvas, doNotBuild, transform, "red","");
    },

    traceInputHoles(holes,outerShape, parent, transform) {
        transform = debugger2d._objectClone(transform);
        debugger2d.createLegend("inputLegend", parent,"Input outerShape and holes");
        const canvas = debugger2d.createCanvas("inputData", parent, debugger2d.cssclass);
        pathTracer.tracePathsInRow(canvas, [outerShape.path], transform, "black","white");

        const num = holes.length +1 ;
        holes.forEach((hole,index) => {
          pathTracer.tracePathsInRow(canvas, [holes[index].path], transform, "red", "");
          pathTracer.tracePathsInRow(canvas, [outerShape.path], transform, "black", "");
          debugger2d.translateRight(transform, index, num);
          debugger2d.traceDelimiter(canvas, index, num);
        });

        const allHolesPaths = holes.map( hole => hole.path);
        debugger2d.traceDelimiter(canvas, holes.length, holes.length +1);
        pathTracer.tracePathsInRow(canvas, allHolesPaths, transform, "red","");
        pathTracer.tracePathsInRow(canvas, [outerShape.path], transform, "black", "");
    },

    traceDataByDepth(dataByDepth, parent, transform, title) {
        transform = debugger2d._objectClone(transform);

        debugger2d.createLegend("legend", parent,"data by depth");
        const canvas = debugger2d.createCanvas("dataByDepth", parent, debugger2d.cssclass);
        const num = dataByDepth.depthsCount;

        for(let index = 0; index< dataByDepth.depthsCount; index++) {
            pathTracer.tracePathsInRow(canvas, dataByDepth.horizontalPathsByDepth[index].paths, transform,"red", "hatch");
            pathTracer.tracePathsInRow(canvas, dataByDepth.innerPathsByDepth[index].paths, transform, "green", "rgba(255, 255, 255, 0.7)");
            pathTracer.tracePathsInRow(canvas, dataByDepth.outerPathsByDepth[index].paths,transform,  "black","");
            debugger2d.translateRight(transform, index, num);
            debugger2d.traceDelimiter(canvas, index, num);
        }
    },

    traceTriangulationByDepth(dataByDepth, parent, transform) {
        transform = debugger2d._objectClone(transform);
        debugger2d.createLegend("legend", parent,"triangles by depth");
        const canvas = debugger2d.createCanvas("triangulationByDepth", parent, debugger2d.cssclass);
        const ctx = canvas.getContext("2d");

        const num = dataByDepth.depthsCount;
        for (let i = 0; i < num; i++) {
            const innerPaths = dataByDepth.innerPathsByDepth[i].paths;
            const horizontalPathsByDepth = dataByDepth.horizontalPathsByDepth;
            const outerPathsByDepth = dataByDepth.outerPathsByDepth;


            const triangles = cdt2dHelper.computeTriangulation(horizontalPathsByDepth[i].paths);
            triangles.depth = horizontalPathsByDepth[i].depth;
            pathTracer.traceTriangulation(ctx, triangles,transform, "black", "");
            debugger2d.translateRight(transform, i, num);
            debugger2d.traceDelimiter(canvas, i, num);
        }

    },

    traceDelimiter(canvas, x, num) {
            x = (x+1) * debugger2d.canvasWidth / num;
            const ctx = canvas.getContext("2d");
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "black";
            ctx.moveTo(x, 0);
            ctx.lineTo(x, debugger2d.canvasHeight);
            ctx.stroke();

    },

    translateRight(transform, index, num){
        transform.translation.X = transform.baseTranslation.X + (index + 1)* debugger2d.canvasWidth / num;
    },

    _objectClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    getTransform(outerShape, holes, numDepths) {
        const width = debugger2d.canvasWidth / numDepths;
        const allPaths = holes.concat([outerShape]).map(elem => elem.path);
        const transform = pathTracer.getMaxFitTransform(allPaths, width, debugger2d.canvasHeight);
        return transform;
    }

};

module.exports = debugger2d;
