"use strict";

const cdt2d = require("cdt2d");
const constants = require("./constants");

const cdt2dHelper = {


    computeTriangulation(points, options) {
        const cdtPoints = cdt2dHelper.clipperTocdt2d(points);
        const cdtEdges = cdt2dHelper.pathsToEdges(points);
        if (!options) {
            options = {
                exterior: false,
                interior: true,
            };
        }
        let triangles = cdt2d(cdtPoints, cdtEdges, options);
        // removes degenerated triangles:
        triangles  = triangles.filter( triangle => {
           const ba = {x: cdtPoints[triangle[1]][0] - cdtPoints[triangle[0]][0],
                       y: cdtPoints[triangle[1]][1] - cdtPoints[triangle[0]][1]};
           const bc = {x: cdtPoints[triangle[1]][0] - cdtPoints[triangle[2]][0],
                       y: cdtPoints[triangle[1]][1] - cdtPoints[triangle[2]][1]};
           const area = 0.5 * (ba.y * bc.x) - (ba.x * bc.y);
           return Math.abs(area)/ (constants.scaleFactor * constants.scaleFactor) > 0.1;
       });

        return {
            points: cdtPoints,
            triangles,
        };
    },

    pathsToEdges(paths) {
        let res = [];
        let offset = 0;
        for (let i = 0; i < paths.length; i++) {
            res = res.concat(cdt2dHelper.pathToEdges(paths[i], offset));
            offset += paths[i].length;
        }
        return res;
    },

    pathToEdges(path, offset) {
        if (path.length === 0) return [];
        const res = [];
        for (let i = 0; i < path.length - 1; i++) {
            res.push([offset + i, offset + i + 1]);
        }
        res.push([offset + path.length - 1, offset]);
        return res;
    },

    clipperTocdt2d(points) {
        const res = [];
        for (let i = 0; i < points.length; i++) {
            for (let j = 0; j < points[i].length; j++) {
                res.push(cdt2dHelper.clipperPointTocdt2dPoint(points[i][j]));
            }
        }
        return res;
    },

    clipperPointTocdt2dPoint(point) {
        return [point.X, point.Y];
    },

};
module.exports = cdt2dHelper;
