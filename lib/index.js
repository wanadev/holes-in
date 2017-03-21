"use strict";



const extruder = require("./extruder.js");
const geomHelper = require("./geom-helper.js");
const exportHelper= require("./export-helper.js");
const drawHelper= require("./draw-helper.js");

var holesIn = {

    meshesToObj: exportHelper.meshesToObj,
    meshToObj: exportHelper.meshToObj,
    getGeometry: extruder.getGeometry,
    mergeMeshes: geomHelper.mergeMeshes,

    drawPath: drawHelper.drawPath,
    drawPaths: drawHelper.drawPaths,
    getPathsByDepth: extruder.getPathsByDepth,
    getOuterPathsByDepth: extruder.getOuterPathsByDepth,
    getTopoPathByDepth: extruder.getTopoPathByDepth,
    scaleDownHoles: extruder.scaleDownHoles,
    scaleDownTopoByDepth: extruder.scaleDownTopoByDepth,
    scaleDownPathsByDepth : extruder.scaleDownPathsByDepth,
    scaleDownOuterPathsByDepth : extruder.scaleDownOuterPathsByDepth,
    getDataByDepth:extruder.getDataByDepth,
};

module.exports = holesIn;
