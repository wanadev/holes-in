"use strict";

var extruder = require("./extruder.js");
var geomHelper = require("./geom-helper.js");
var exportHelper = require("./export-helper.js");
var drawHelper = require("./draw-helper.js");
var pathHelper = require("./path-helper.js");

var holesIn = {

    meshesToObj: exportHelper.meshesToObj,
    meshToObj: exportHelper.meshToObj,
    getGeometry: extruder.getGeometry,
    mergeMeshes: geomHelper.mergeMeshes,

    drawPath: drawHelper.drawPath,
    drawPaths: drawHelper.drawPaths,

    scaleDownPath: pathHelper.scaleDownPath,
    scaleDownPaths: pathHelper.scaleDownPaths,
    getDataByDepth: extruder.getDataByDepth
};

module.exports = holesIn;