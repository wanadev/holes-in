"use strict";

var clipperLib = require("clipper-lib");
var constants = require("./constants.js");

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
     * Compute the xor of two arrays of path
     *
     */
    getUnionOfPaths: function getUnionOfPaths(pathsSubj, pathsClip, op) {
        var options = {
            subjectFillType: clipperLib.PolyFillType.pftNonZero,
            clipFillType: clipperLib.PolyFillType.pftNonZero,
            clipType: clipperLib.ClipType.ctUnion
        };
        return pathHelper.executeClipper(pathsSubj, pathsClip, options);
    },


    /**
     * Compute the xor of two arrays of path
     *
     */
    getDiffOfPaths: function getDiffOfPaths(pathsSubj, pathsClip, op) {
        var options = {
            subjectFillType: clipperLib.PolyFillType.pftNonZero,
            clipFillType: clipperLib.PolyFillType.pftNonZero,
            clipType: clipperLib.ClipType.ctDifference
        };
        return pathHelper.executeClipper(pathsSubj, pathsClip, options);
    },


    /**
     * Compute the xor of two arrays of path
     *
     */
    getInterOfPaths: function getInterOfPaths(pathsSubj, pathsClip, op) {
        var options = {
            subjectFillType: clipperLib.PolyFillType.pftNonZero,
            clipFillType: clipperLib.PolyFillType.pftNonZero,
            clipType: clipperLib.ClipType.ctIntersection
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
    simplifyPath: function simplifyPath(path) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
            fillType: clipperLib.PolyFillType.pftNonZero
        };

        return clipperLib.Clipper.SimplifyPolygon(path, options.fillType);
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
        // turn paths so they are negatives:
        pathHelper.setDirectionPaths(pathsSubj, -1);
        if (pathsClip) {
            pathHelper.setDirectionPaths(pathsClip, -1);
        }
        // settup and execute clipper
        var cpr = new clipperLib.Clipper();
        cpr.AddPaths(pathsSubj, clipperLib.PolyType.ptSubject, true);
        // pathsSubj.forEach(path => cpr.AddPath(path, clipperLib.PolyType.ptSubject, true));

        if (pathsClip) {
            // pathsClip.forEach(path => cpr.AddPath(path, clipperLib.PolyType.ptClip, true));
            cpr.AddPaths(pathsClip, clipperLib.PolyType.ptClip, true);
        }
        var res = new clipperLib.Paths();
        cpr.Execute(options.clipType, res, options.subjectFill, options.clipFill);
        return res;
    },
    offsetPaths: function offsetPaths(paths) {
        var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;

        var co = new clipperLib.ClipperOffset();
        var res = new clipperLib.Paths();

        co.AddPaths(paths, clipperLib.JoinType.jtMiter, clipperLib.EndType.etClosedPolygon);
        co.MiterLimit = 2;
        co.ArcTolerance = 0.25;
        co.Execute(res, offset);
        return res;
    },
    offsetPath: function offsetPath(path) {
        var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;

        return pathHelper.offsetPaths([path], offset)[0];
    },


    /**
     *  sets the direction of an array of path
     */
    setDirectionPaths: function setDirectionPaths(paths, direction) {
        for (var i = 0; i < paths.length; i++) {
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
    scaleUpPaths: function scaleUpPaths(paths) {
        var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : constants.scaleFactor;

        clipperLib.JS.ScaleUpPaths(paths, scale);
    },
    scaleUpPath: function scaleUpPath(path) {
        var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : constants.scaleFactor;

        clipperLib.JS.ScaleUpPath(path, scale);
    },
    scaleDownPath: function scaleDownPath(path) {
        var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : constants.scaleFactor;

        clipperLib.JS.ScaleDownPath(path, scale);
    },
    scaleDownPaths: function scaleDownPaths(paths) {
        var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : constants.scaleFactor;

        clipperLib.JS.ScaleDownPaths(paths, scale);
    },
    getMatchingEdgeIndex: function getMatchingEdgeIndex(path, pathToMatch) {
        var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

        var prevAligned = false;
        var res = {};
        for (var i = path.length - 1 - offset; i >= 0; i--) {
            for (var j = pathToMatch.length - 1; j >= 0; j--) {

                var p1 = pathToMatch[j];
                var p2 = pathToMatch[(j + 1) % pathToMatch.length];
                var currAlgigned = pathHelper.isApproxAligned(path[i], path[(i + 1) % path.length], p1, p2);
                if (!currAlgigned && prevAligned) {
                    return res;
                }
                if (!currAlgigned && !prevAligned) {
                    continue;
                }
                if (currAlgigned) {
                    res = {
                        index: i,
                        pointmatch: p1
                    };
                    prevAligned = currAlgigned;
                    break;
                }
            }
        }
    },
    displaceColinearEdges: function displaceColinearEdges(path, pathToDisplace) {
        var indexColinear = pathHelper.getColinearEdge(path, pathToDisplace);
        if (indexColinear === false) {
            return;
        }

        pathHelper.displaceEdge(pathToDisplace, indexColinear);

        return true;
    },
    displaceEdge: function displaceEdge(path, index) {
        var indexPrev = (index + path.length - 1) % path.length;
        var indexNext = (index + 1) % path.length;

        var previousEdge = pathHelper.getEdge(path[indexPrev], path[index]); // eslint-disable-line
        var nextEdge = pathHelper.getEdge(path[(index + 2) % path.length], path[indexNext]);

        previousEdge = pathHelper.normalizeVec(previousEdge);
        nextEdge = pathHelper.normalizeVec(nextEdge);

        path[index].X += nextEdge.X * 1;
        path[index].Y += nextEdge.Y * 1;
    },
    normalizeVec: function normalizeVec(edge) {
        var norm = Math.sqrt(edge.X * edge.X + edge.Y * edge.Y);
        return { X: edge.X / norm, Y: edge.Y / norm };
    },
    getColinearEdge: function getColinearEdge(path, pathToMatch) {
        for (var i = 0; i < path.length; i++) {
            var pt1 = path[i];
            var pt2 = path[(i + 1) % path.length];
            for (var j = 0; j < pathToMatch.length; j++) {
                if (pathHelper.isApproxAligned(pt1, pt2, pathToMatch[j], pathToMatch[(j + 1) % pathToMatch.length])) {
                    return j;
                }
            }
        }
        return false;
    },
    isApproxAligned: function isApproxAligned(e11, e12, e21, e22) {
        var epsilon = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0.1;

        var edge1 = pathHelper.getEdge(e11, e12);
        var edge2 = pathHelper.getEdge(e11, e21);
        var edge3 = pathHelper.getEdge(e12, e22);
        return pathHelper.isApproxColinear(edge1, edge2, epsilon) && pathHelper.isApproxColinear(edge1, edge3, epsilon);
    },
    isApproxColinear: function isApproxColinear(edge1, edge2) {
        var epsilon = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0.1;


        var a = edge1.X * edge2.Y;
        var b = edge1.Y * edge2.X;
        if (a === b) {
            return true;
        }
        if (a === 0 || b === 0) {
            return false;
        }
        // a - b === 0 ? a / b === 1 => true même si a / b = -1
        var ratio = a / b;
        return ratio > 1 - epsilon && ratio < 1 + epsilon;
    },
    getEdge: function getEdge(point1, point2) {
        return {
            X: point2.X - point1.X,
            Y: point2.Y - point1.Y
        };
    },


    /**
     * returns the index of the point in path matching with point
     *
     */
    getPointMatch: function getPointMatch(path, point) {
        for (var i = 0; i < path.length; i++) {
            if (pathHelper.isEqual(path[i], point)) {
                return {
                    index: i
                };
            }
        }
    },
    getPointsOnEdge: function getPointsOnEdge(path, edge) {
        var res = [];
        for (var i = 0; i < path.length; i++) {
            var ptA = path[i];
            var ptB = path[(i + 1) % path.length];
            if (!pathHelper.isApproxAligned(ptA, ptB, edge[0], edge[1])) {
                continue;
            }
            res.push(ptA);
        }
        return res;
    },
    getNorm: function getNorm(point) {
        return Math.sqrt(point.X * point.X + point.Y * point.Y);
    },
    getDistance: function getDistance(point1, point2) {
        var edge = pathHelper.getEdge(point1, point2);
        return pathHelper.getNorm(edge);
    },
    getTotalLength: function getTotalLength(path) {
        var res = 0;
        if (!path) {
            return 0;
        }
        for (var i = 0; i < path.length; i++) {
            var curr = path[i];
            var next = path[(i + 1) % path.length];
            res += pathHelper.getDistance(curr, next);
        }
        return res;
    },


    /**
     *  checks if two points have the same coordinates
     *
     */
    isEqual: function isEqual(point1, point2) {
        return point1.X === point2.X && point1.Y === point2.Y;
    },
    inOnSegment: function inOnSegment(ptOrigin, ptDest, pt) {
        return pathHelper.isInRange(ptOrigin, ptDest, pt) || pathHelper.isInRange(ptDest, ptOrigin, pt);
    },
    isInRange: function isInRange(ptOrigin, ptDest, pt) {
        return pt.X >= ptOrigin.X && pt.X <= ptDest.X && pt.Y >= ptOrigin.Y && pt.Y <= ptDest.Y;
    },
    cleanPaths: function cleanPaths(paths) {
        var threshold = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1.5;

        return clipperLib.Clipper.CleanPolygons(paths, threshold);
    }
};
module.exports = pathHelper;