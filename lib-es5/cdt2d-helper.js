"use strict";

var cdt2d = require("cdt2d");
var constants = require("./constants");

var cdt2dHelper = {
    computeTriangulation: function computeTriangulation(points, options) {
        var cdtPoints = cdt2dHelper.clipperTocdt2d(points);
        var cdtEdges = cdt2dHelper.pathsToEdges(points);
        if (!options) {
            options = {
                exterior: false,
                interior: true
            };
        }
        var triangles = cdt2d(cdtPoints, cdtEdges, options);
        // removes degenerated triangles:
        triangles = triangles.filter(function (triangle) {
            var ba = { x: cdtPoints[triangle[1]][0] - cdtPoints[triangle[0]][0],
                y: cdtPoints[triangle[1]][1] - cdtPoints[triangle[0]][1] };
            var bc = { x: cdtPoints[triangle[1]][0] - cdtPoints[triangle[2]][0],
                y: cdtPoints[triangle[1]][1] - cdtPoints[triangle[2]][1] };
            var area = 0.5 * (ba.y * bc.x) - ba.x * bc.y;
            return Math.abs(area) / (constants.scaleFactor * constants.scaleFactor) > 0.1;
        });

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
        if (path.length === 0) return [];
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