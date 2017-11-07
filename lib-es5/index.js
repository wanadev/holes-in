"use strict";

var extruder = require("./extruder.js");
var geomHelper = require("./geom-helper.js");
var exportHelper = require("./export-helper.js");
var drawHelper = require("./draw-helper.js");
var pathHelper = require("./path-helper.js");
var cdt2dHelper = require("./cdt2d-helper.js");
var constants = require("./constants.js");

var holesIn = {

    meshesToObj: exportHelper.meshesToObj,
    meshToObj: exportHelper.meshToObj,
    getGeometry: extruder.getGeometry,
    getHolesByDepth: extruder.getHolesByDepth,

    mergeMeshes: geomHelper.mergeMeshes,

    scaleUpPath: pathHelper.scaleUpPath,
    scaleDownPath: pathHelper.scaleDownPath,
    scaleDownPaths: pathHelper.scaleDownPaths,
    getDataByDepth: extruder.getDataByDepth,
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
    extruder: extruder

};

module.exports = holesIn;