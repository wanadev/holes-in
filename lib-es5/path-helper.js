"use strict";

var clipperLib = require("clipper-lib");

var pathHelper = {

    /**
     * Compute the xor of two arrays of path
     *
     */
    getXorOfPaths: function getXorOfPaths(pathsSubj, pathsClip) {
        var options = {
            subjectFillType: clipperLib.PolyFillType.pftNonZero,
            clipFillType: clipperLib.PolyFillType.pftNonZero,
            clipType: clipperLib.ClipType.ctXor
        };
        return pathHelper.executeClipper(pathsSubj, pathsClip, options);
    },

    /**
     * Simplify an array of paths
     *
     */
    simplifyPaths: function simplifyPaths(paths) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
            fillType: clipperLib.PolyFillType.pftNonZero
        };

        return clipperLib.Clipper.SimplifyPolygons(paths, options.fillType);
    },

    /**
     * Apply Clipper operation to pathsSubj and pathClip
     * clipType: {ctIntersection,ctUnion,ctDifference,ctXor}
     * subjectFill: {pftEvenOdd,pftNonZero,pftPositive,pftNegative}
     * clipFill: same as upon
     */
    executeClipper: function executeClipper(pathsSubj, pathsClip) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
            clipType: clipperLib.ClipType.ctUnion,
            subjectFill: clipperLib.PolyFillType.pftNonZero,
            clipFill: clipperLib.PolyFillType.pftNonZero
        };

        if (!pathsSubj && !pathsClip) {
            return;
        }
        //turn paths so they are negatives:
        pathHelper.setDirectionPaths(pathsSubj, -1);
        if (pathsClip) {
            pathHelper.setDirectionPaths(pathsClip, -1);
        }
        //settup and execute clipper
        var cpr = new clipperLib.Clipper();
        cpr.AddPaths(pathsSubj, clipperLib.PolyType.ptSubject, true);
        if (pathsClip) {
            cpr.AddPaths(pathsClip, clipperLib.PolyType.ptClip, true);
        }
        var res = new clipperLib.Paths();
        cpr.Execute(options.clipType, res, options.subjectFill, options.clipFill);
        return res;
    },

    /**
     *  sets the direction of an array of path
     */
    setDirectionPaths: function setDirectionPaths(paths, direction) {
        for (var i in paths) {
            pathHelper.setDirectionPath(paths[i], direction);
        }
    },

    /**
     *  sets the direction of a path
     */
    setDirectionPath: function setDirectionPath(path, direction) {
        if (clipperLib.JS.AreaOfPolygon(path) * direction < 0) {
            path.reverse();
        }
    },

    /**
     *  checks if the signed area of the path is positive
     */
    isPositivePath: function isPositivePath(path) {
        return pathHelper.getDirectionPath(path) > 0;
    },

    /**
     *  checks if the signed area of the path is negative
     */
    isNegativePath: function isNegativePath(path) {
        return pathHelper.getDirectionPath(path) < 0;
    },

    /**
     *  get the direction of an arary of path
     */
    getDirectionPaths: function getDirectionPaths(paths) {
        return paths.map(pathHelper.getDirectionPath);
    },

    /**
     *  get the direction of a path
     */
    getDirectionPath: function getDirectionPath(path) {
        return clipperLib.JS.AreaOfPolygon(path) > 0 ? 1 : -1;
    },

    /**
     * returns the index of the point in path matching with point
     *
     */
    getPointMatch: function getPointMatch(path, point) {
        var offsetPath = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

        for (var i = offsetPath; i < path.length; i++) {
            if (pathHelper.isEqual(path[i], point)) {
                return {
                    index: i
                };
            }
        }
    },

    /**
     *  checks if two points have the same coordinates
     *
     */
    isEqual: function isEqual(point1, point2) {
        return point1.X === point2.X && point1.Y === point2.Y;
    }

};
module.exports = pathHelper;