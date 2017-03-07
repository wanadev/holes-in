"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var cdt2d = require('cdt2d');

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

    /**
      */
    concatTriangulations: function concatTriangulations(triangulations) {

        //merge the points arrays and add offset to faces:
        var points = [];
        var triangles = [];
        var offset = 0;
        if (triangulations.length == 1) {
            return triangulations;
        }
        for (var i in triangulations) {
            if (!triangulations[i].points || !triangulations[i].triangles) {
                continue;
            }
            points.push.apply(points, _toConsumableArray(triangulations[i].points));
            cdt2dHelper.pushTriangles(triangulations[i].triangles, triangles, offset);
            offset += triangulations[i].points.length;
        }
        return {
            points: points,
            triangles: triangles
        };
    },

    pushTriangles: function pushTriangles(src, dst, offset) {
        dst.push.apply(dst, _toConsumableArray(src.map(function (val) {
            return val + offset;
        })));
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
        for (var i in points) {
            for (var j in points[i]) {
                res.push(cdt2dHelper.clipperPointTocdt2dPoint(points[i][j]));
            }
        }
        return res;
    },

    clipperPointTocdt2dPoint: function clipperPointTocdt2dPoint(point) {
        return [point.X, point.Y];
    },

    drawTriangles: function drawTriangles(ctx, pointsAndTriangles, translation) {
        for (var i in pointsAndTriangles.triangles) {
            cdt2dHelper.drawTriangle(ctx, pointsAndTriangles.points, pointsAndTriangles.triangles[i], translation);
        }
    },

    drawTriangle: function drawTriangle(ctx, points, triangle, translation) {
        if (!translation) {
            translation = {
                X: 0,
                Y: 0
            };
        }
        ctx.beginPath();
        ctx.moveTo(points[triangle[0]][0] + translation.X, points[triangle[0]][1] + translation.Y);
        ctx.lineTo(points[triangle[1]][0] + translation.X, points[triangle[1]][1] + translation.Y);
        ctx.lineTo(points[triangle[2]][0] + translation.X, points[triangle[2]][1] + translation.Y);
        ctx.lineTo(points[triangle[0]][0] + translation.X, points[triangle[0]][1] + translation.Y);
        ctx.stroke();
    }

};
module.exports = cdt2dHelper;