"use strict";

var babylonHelper = {
    swapAllToBabylon: function swapAllToBabylon(geoms) {
        Object.values(geoms).forEach(function (g) {
            if (Array.isArray(g)) {
                babylonHelper.swapAllToBabylon(g);
                return;
            }
            babylonHelper.swapToBabylon(g);
        });
    },
    swapToBabylon: function swapToBabylon(geom) {
        if (!geom) {
            return;
        }
        babylonHelper.swapValuesYZ(geom.normals);
        babylonHelper.swapValuesYZ(geom.points);
        babylonHelper.swapValuesTriangle(geom.faces);
    },
    swapValuesYZ: function swapValuesYZ(array) {
        var oldY = void 0;
        var step = 3;
        var Y = 1;
        var Z = 2;
        for (var i = 0; i < array.length; i += step) {
            oldY = array[i + Y];
            array[i + Y] = -array[i + Z];
            array[i + Z] = -oldY;
        }
    },
    swapValuesTriangle: function swapValuesTriangle(array) {
        var oldIdx = void 0;
        var step = 3;
        var Y = 1;
        var Z = 2;
        for (var i = 0; i < array.length; i += step) {
            oldIdx = array[i + Y];
            array[i + Y] = array[i + Z];
            array[i + Z] = oldIdx;
        }
    }
};
module.exports = babylonHelper;