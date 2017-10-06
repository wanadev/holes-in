"use strict";

const extruder = require("./extruder.js");
const geomHelper = require("./geom-helper.js");
const exportHelper = require("./export-helper.js");
const drawHelper = require("./draw-helper.js");
const pathHelper = require("./path-helper.js");
const cdt2dHelper = require("./cdt2d-helper.js");
const constants = require("./constants.js");


const holesIn = {

    meshesToObj: exportHelper.meshesToObj,
    meshToObj: exportHelper.meshToObj,
    getGeometry: extruder.getGeometry,
    getHolesByDepth: extruder.getHolesByDepth,

    mergeMeshes: geomHelper.mergeMeshes,

    scaleUpPath: pathHelper.scaleUpPath,
    scaleDownPath: pathHelper.scaleDownPath,
    scaleDownPaths: pathHelper.scaleDownPaths,
    getDataByDepth: extruder.getDataByDepth,
    computeTriangulation: cdt2dHelper.computeTriangulation,

    drawInitialPaths: drawHelper.drawInitialPaths,
    drawPaths: drawHelper.drawPaths,
    drawPath: drawHelper.drawPath,
    drawText: drawHelper.drawText,

    simplifyPaths: pathHelper.simplifyPaths,

    getInterOfPaths: pathHelper.getInterOfPaths,
    setDirectionPath: pathHelper.setDirectionPath,
    hasAnIncludedSegment: pathHelper.hasAnIncludedSegment,

    scaleFactor: constants.scaleFactor,

    pathHelper: pathHelper,
    extruder: extruder,

};

module.exports = holesIn;
