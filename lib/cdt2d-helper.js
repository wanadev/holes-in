"use strict";

const cdt2d = require("cdt2d");

const cdt2dHelper = {


    computeTriangulation(points, options) {
        // let points= xor.concat(intersection).concat(pathOuter);
        const cdtPoints = cdt2dHelper.clipperTocdt2d(points);
        const cdtEdges = cdt2dHelper.pathsToEdges(points);
        if (!options) {
            options = {
                exterior: false,
                interior: true,
            };
        }
        const triangles = cdt2d(cdtPoints, cdtEdges, options);
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
        const res = [];
        for (let i = 0; i < path.length - 1; i++) {
            res.push([offset + i, offset + i + 1]);
        }
        res.push([offset + path.length - 1, offset]);
        return res;
    },

    clipperTocdt2d(points) {
        const res = [];
        for (const i in points) {
            for (const j in points[i]) {
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
