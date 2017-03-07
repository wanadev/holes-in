"use strict";

const cdt2d = require('cdt2d');

var cdt2dHelper = {


    computeTriangulation: function(points, options) {
        // let points= xor.concat(intersection).concat(pathOuter);
        let cdtPoints = cdt2dHelper.clipperTocdt2d(points);
        let cdtEdges = cdt2dHelper.pathsToEdges(points);
        if (!options) {
            options = {
                exterior: false,
                interior: true
            };
        }
        let triangles = cdt2d(cdtPoints, cdtEdges, options);
        return {
            points: cdtPoints,
            triangles: triangles
        };
    },

    /**


    */
    concatTriangulations: function(triangulations) {

        //merge the points arrays and add offset to faces:
        let points = [];
        let triangles = [];
        let offset = 0;
        if (triangulations.length == 1) {
            return triangulations;
        }
        for (let i in triangulations) {
            if (!triangulations[i].points || !triangulations[i].triangles) {
                continue;
            }
            points.push(...triangulations[i].points);
            cdt2dHelper.pushTriangles(triangulations[i].triangles, triangles, offset);
            offset += triangulations[i].points.length;
        }
        return {
            points: points,
            triangles: triangles
        };

    },

    pushTriangles: function(src, dst, offset) {
        dst.push(...src.map(val => val + offset));
    },

    pathsToEdges: function(paths) {
        let res = [];
        let offset = 0;
        for (let i = 0; i < paths.length; i++) {
            res = res.concat(cdt2dHelper.pathToEdges(paths[i], offset));
            offset += paths[i].length;
        }
        return res;
    },

    pathToEdges: function(path, offset) {
        let res = [];
        for (let i = 0; i < path.length - 1; i++) {
            res.push([offset + i, offset + i + 1]);
        }
        res.push([offset + path.length - 1, offset]);
        return res;
    },

    clipperTocdt2d: function(points) {
        let res = [];
        for (let i in points) {
            for (let j in points[i]) {
                res.push(cdt2dHelper.clipperPointTocdt2dPoint(points[i][j]));
            }
        }
        return res;
    },

    clipperPointTocdt2dPoint: function(point) {
        return [point.X, point.Y];
    },

    drawTriangles: function(ctx, pointsAndTriangles, translation) {
        for (let i in pointsAndTriangles.triangles) {
            cdt2dHelper.drawTriangle(ctx, pointsAndTriangles.points, pointsAndTriangles.triangles[i], translation);
        }
    },

    drawTriangle: function(ctx, points, triangle, translation) {
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
