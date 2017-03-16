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

    scaleUpPath: function scaleUpPath(path) {
        clipperLib.JS.ScaleUpPath(path, 10000);
    },

    scaleDownPath: function scaleDownPath(path) {
        clipperLib.JS.ScaleDownPath(path, 10000);
    },
    scaleDownPaths: function scaleDownPaths(paths) {
        clipperLib.JS.ScaleDownPaths(paths, 10000);
    },


    getPathBoundary: function getPathBoundary(path) {
        var minX = path[0].X;
        var minY = path[0].Y;
        var maxX = path[0].X;
        var maxY = path[0].Y;
        for (var i = 1; i < path.length; i++) {
            minX = Math.min(minX, path[i].X);
            maxX = Math.max(maxX, path[i].X);
            minY = Math.min(minY, path[i].Y);
            maxY = Math.max(maxY, path[i].Y);
        }
        return {
            X: {
                min: minX,
                max: maxX
            },
            Y: {
                min: minY,
                max: maxY
            }
        };
    },

    getPathsIncluded: function getPathsIncluded(pathsOut, pathsIn) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {

            for (var _iterator = pathsIn[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var pathIn = _step.value;

                for (var i in pathOut) {
                    if (!pathHelper.isIncluded(pathsOut[i], pathIn)) {
                        continue;
                    }
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    },

    getMatchingEdgeIndex: function getMatchingEdgeIndex(path, pathToMatch) {
        var prevAligned = false;
        var res = {};
        for (var i = path.length - 1; i >= 0; i--) {
            for (var j = pathToMatch.length - 1; j >= 0; j--) {

                var p1 = pathToMatch[j];
                var p2 = pathToMatch[(j + 1) % pathToMatch.length];
                var currAlgigned = pathHelper.isAligned(path[i], path[(i + 1) % path.length], p1, p2);
                if (!currAlgigned && prevAligned) {
                    return res;
                }
                if (currAlgigned) {
                    res = { index: i, pointmatch: p1 };
                    prevAligned = currAlgigned;
                    break;
                }
            }
        }
    },

    isAligned: function isAligned(e11, e12, e21, e22) {
        var edge1 = pathHelper.getEdge(e11, e12);
        var edge2 = pathHelper.getEdge(e11, e21);
        var edge3 = pathHelper.getEdge(e11, e22);
        return pathHelper.isColinear(edge1, edge2) && pathHelper.isColinear(edge1, edge3);
    },

    isColinear: function isColinear(edge1, edge2) {
        return edge1.X * edge2.Y === edge1.Y * edge2.X;
    },

    getEdge: function getEdge(point1, point2) {
        return {
            X: point2.X - point1.X,
            Y: point2.Y - point1.Y
        };
    },

    isIncluded: function isIncluded(pathOut, pathsIn) {
        var union = pathHelper.getUnionOfPaths([pathOut], pathsIn);
        if (union.length > 1) return false;
        return pathHelper.isPathEqual(union[0], pathOut);
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

    fitPathsIntoPath: function fitPathsIntoPath(outerPath, toFitPaths) {

        var paths = toFitPaths.push(outerPath);
        var union = pathHelper.getUnionOfPaths(paths);
        var inter = pathHelper.getInterOfPaths(paths);
        var xor = pathHelper.getXorOfPaths(union, inter);

        return pathHelper.getDiffOfPaths(paths, xor);
    },

    getTopLeftIndex: function getTopLeftIndex(path) {
        var minIndex = 0;
        var min = pathHelper.getNormPoint(path[0]);
        for (var i = 1; i < path.length; i++) {
            var norm = pathHelper.getNormPoint(path[i]);
            if (norm < min) {
                minIndex = i;
                min = norm;
            }
        }
        return +minIndex;
    },

    getNormPoint: function getNormPoint(point) {
        return Math.sqrt(point.X * point.X + point.Y * point.Y);
    },
    getDistance: function getDistance(point1, point2) {
        var edge = pathHelper.getEdge(point1, point2);
        return pathHelper.getNormPoint(edge);
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

    isPathEqual: function isPathEqual(path1, path2) {
        if (path1.length !== path2.length) {
            return false;
        }
        for (var i = 0; i < path1.length; i++) {
            if (!isEqual(path1[i], path2[i])) {
                return false;
            }
        }
        return true;
    }

};
module.exports = pathHelper;