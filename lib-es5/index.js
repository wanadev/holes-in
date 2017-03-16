"use strict";

var extruder = require("./extruder.js");
var geomHelper = require("./geom-helper.js");
var exportHelper = require("./export-helper.js");

var holesIn = {

    meshesToObj: exportHelper.meshesToObj,
    meshToObj: exportHelper.meshToObj,

    getGeometry: extruder.getGeometry,
    mergeMeshes: geomHelper.mergeMeshes

};

module.exports = holesIn;