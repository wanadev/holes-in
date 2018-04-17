"use strict";

const extruder = require("./extruder.js");
const geomHelper = require("./geom-helper.js");

const holesIn = {

    getGeometry: extruder.getGeometry,
    mergeMeshes: geomHelper.mergeMeshes,

};

module.exports = holesIn;
