"use strict";

const extruder = require("./extruder.js");
const geomHelper = require("./geom-helper.js");
const exportHelper = require("./export-helper.js");
const drawHelper = require("./draw-helper.js");
const pathHelper = require("./path-helper.js");
const constants = require("./constants.js");

const holesIn = {

    meshesToObj: exportHelper.meshesToObj,
    meshToObj: exportHelper.meshToObj,
    getGeometry: extruder.getGeometry,
    mergeMeshes: geomHelper.mergeMeshes,


    scaleDownPath: pathHelper.scaleDownPath,
    scaleDownPaths: pathHelper.scaleDownPaths,
    getDataByDepth: extruder.getDataByDepth,

    drawInitialPaths: drawHelper.drawInitialPaths,
    drawPaths: drawHelper.drawPaths,
    drawPath: drawHelper.drawPath,
    drawText: drawHelper.drawText,

    simplifyPaths: pathHelper.simplifyPaths,

    getInterOfPaths: pathHelper.getInterOfPaths,
    getMatchingEdgeIndex: pathHelper.getMatchingEdgeIndex,
    setDirectionPath: pathHelper.setDirectionPath,
    hasAnIncludedSegment: pathHelper.hasAnIncludedSegment,

    scaleFactor: constants.scaleFactor,

};

module.exports = holesIn;
