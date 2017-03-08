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
