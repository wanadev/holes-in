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

};
module.exports = cdt2dHelper;
