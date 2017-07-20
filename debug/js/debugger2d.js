"use strict";

const pathTracer = require("./pathTracer.js");
const holesIn = require("../../lib/index.js");

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

    traceAllData(outerShape, holes) {
        let cpyHoles = debugger2d._objectClone(holes);
        let cpyOuterShape = debugger2d._objectClone(outerShape);

        holesIn.scaleUpPath(cpyOuterShape.path);
        for (let i = 0; i < cpyHoles.length; i++) {
            holesIn.scaleUpPath(cpyHoles[i].path);
        }
        let holesByDepth = holesIn.getHolesByDepth(cpyHoles, cpyOuterShape);
        const transform = debugger2d.getTransform(cpyOuterShape, cpyHoles, holesByDepth.length);

        cpyHoles = debugger2d._objectClone(holes);
        cpyOuterShape = debugger2d._objectClone(outerShape);
        let dataByDepth = holesIn.getDataByDepth(cpyOuterShape, cpyHoles);

        const parent = document.getElementById("container");
        debugger2d.traceInputHoles(cpyHoles, cpyOuterShape, parent, transform);
        debugger2d.traceHolesByDepth(holesByDepth, parent, transform, cpyOuterShape);
        debugger2d.traceDataByDepth(dataByDepth, parent, transform);
        debugger2d.traceTriangulationByDepth(dataByDepth, parent, transform);


    },

    traceInputHoles(holes,outerShape, parent, transform) {
        transform = debugger2d._objectClone(transform);
        debugger2d.createLegend("inputLegend", parent,"Input outerShape and holes");
        const canvas = debugger2d.createCanvas("inputData", parent, debugger2d.cssclass);
        pathTracer.tracePathsInRow(canvas, [outerShape.path], transform, "black","white");

        const num = holes.length;
        holes.forEach((hole,index) => {
          pathTracer.tracePathsInRow(canvas, [holes[index].path], transform, "red", "");
          pathTracer.tracePathsInRow(canvas, [outerShape.path], transform, "black", "");
          debugger2d.translateRight(transform, index, num +1);
          debugger2d.traceDelimiter(canvas, index, num+1 );
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
        const num = dataByDepth.outerPathsByDepth.length;

        // const path1 =

        for(let index = 0; index< dataByDepth.holesByDepth.length; index++) {
            pathTracer.tracePathsInRow(canvas, dataByDepth.horizontalPathsByDepth[index].paths, transform,"red", "");
            pathTracer.tracePathsInRow(canvas, dataByDepth.innerPathsByDepth[index].paths, transform, "green", "white");
            pathTracer.tracePathsInRow(canvas, dataByDepth.outerPathsByDepth[index].paths,transform,  "black","");
            debugger2d.translateRight(transform, index, num);
            debugger2d.traceDelimiter(canvas, index, num);
        }
    },

    traceHolesByDepth(holesByDepth, parent, transform, outerShape) {
        transform = debugger2d._objectClone(transform);
        debugger2d.createLegend("legend", parent,"holes by depth");
        const canvas = debugger2d.createCanvas("holesByDepth", parent, debugger2d.cssclass);

        const num = holesByDepth.length;
        holesByDepth.forEach((holesAtDepth, index) => {
            pathTracer.tracePathsInRow(canvas, holesAtDepth.keep, transform, "green","");
            pathTracer.tracePathsInRow(canvas, holesAtDepth.stop, transform, "red","");
            if(outerShape) {
              pathTracer.tracePathsInRow(canvas, [outerShape.path], transform, "black","");
            }
            debugger2d.translateRight(transform, index,num);
            debugger2d.traceDelimiter(canvas, index, num);
        });

    },

    traceTriangulationByDepth(dataByDepth, parent, transform) {
        transform = debugger2d._objectClone(transform);
        debugger2d.createLegend("legend", parent,"triangles by depth");
        const canvas = debugger2d.createCanvas("triangulationByDepth", parent, debugger2d.cssclass);
        const ctx = canvas.getContext("2d");

        const num = dataByDepth.horizontalPathsByDepth.length;
        for (let i = 0; i < dataByDepth.horizontalPathsByDepth.length; i++) {
            const innerPaths = dataByDepth.innerPathsByDepth[i].paths;
            const horizontalPathsByDepth = dataByDepth.horizontalPathsByDepth;
            const outerPathsByDepth = dataByDepth.outerPathsByDepth;


            const triangles = holesIn.computeTriangulation(horizontalPathsByDepth[i].paths);
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
        const allPaths = holes.concat(outerShape).map(elem => elem.path);
        const transform = pathTracer.getMaxFitTransform(allPaths, width, debugger2d.canvasHeight);
        return transform
    }

};

module.exports = debugger2d;
