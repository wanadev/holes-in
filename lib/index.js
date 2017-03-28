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
