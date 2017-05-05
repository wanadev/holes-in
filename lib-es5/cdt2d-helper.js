"use strict";

var cdt2d = require("cdt2d");

var cdt2dHelper = {
    computeTriangulation: function computeTriangulation(points, options) {
        // let points= xor.concat(intersection).concat(pathOuter);
        var cdtPoints = cdt2dHelper.clipperTocdt2d(points);
        var cdtEdges = cdt2dHelper.pathsToEdges(points);
        if (!options) {
            options = {
                exterior: false,
                interior: true
            };
        }
        var triangles = cdt2d(cdtPoints, cdtEdges, options);
        return {
            points: cdtPoints,
            triangles: triangles
        };
    },
    pathsToEdges: function pathsToEdges(paths) {
        var res = [];
        var offset = 0;
        for (var i = 0; i < paths.length; i++) {
            res = res.concat(cdt2dHelper.pathToEdges(paths[i], offset));
            offset += paths[i].length;
        }
        return res;
    },
    pathToEdges: function pathToEdges(path, offset) {
        var res = [];
        for (var i = 0; i < path.length - 1; i++) {
            res.push([offset + i, offset + i + 1]);
        }
        res.push([offset + path.length - 1, offset]);
        return res;
    },
    clipperTocdt2d: function clipperTocdt2d(points) {
        var res = [];
        for (var i = 0; i < points.length; i++) {
            for (var j = 0; j < points[i].length; j++) {
                res.push(cdt2dHelper.clipperPointTocdt2dPoint(points[i][j]));
            }
        }
        return res;
    },
    clipperPointTocdt2dPoint: function clipperPointTocdt2dPoint(point) {
        return [point.X, point.Y];
    }
};
module.exports = cdt2dHelper;