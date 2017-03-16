"use strict";



const extruder = require("./extruder.js");
const geomHelper = require("./geom-helper.js");
const exportHelper= require("./export-helper.js");
const drawHelper= require("./draw-helper.js");
const pathHelper= require("./path-helper.js");



var holesIn = {

    getGeometry: extruder.getGeometry,
    mergeMeshes: geomHelper.mergeMeshes

};

module.exports = holesIn;
