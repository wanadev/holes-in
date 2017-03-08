"use strict";



const extruder = require("./extruder.js");
const geomHelper = require("./geom-helper.js");


var zepathlib = {


    getGeometry: extruder.getGeometry,
    mergeMeshes: geomHelper.mergeMeshes

};

module.exports = zepathlib;
