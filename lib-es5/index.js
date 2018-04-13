"use strict";

var extruder = require("./extruder.js");
var geomHelper = require("./geom-helper.js");

var holesIn = {

    getGeometry: extruder.getGeometry,
    mergeMeshes: geomHelper.mergeMeshes

};

module.exports = holesIn;