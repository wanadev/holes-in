"use strict";

const clipperLib = require("clipper-lib");

var pathHelper = {


    /**
     * Compute the xor of two arrays of path
     *
     */
    getXorOfPaths: function(pathsSubj, pathsClip) {
        let options = {
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
    getUnionOfPaths: function(pathsSubj, pathsClip, op) {
        let options = {
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
    getDiffOfPaths: function(pathsSubj, pathsClip, op) {
        let options = {
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
    getInterOfPaths: function(pathsSubj, pathsClip, op) {
        let options = {
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
    simplifyPaths: function(paths, options = {
        fillType: clipperLib.PolyFillType.pftNonZero
    }) {
        return clipperLib.Clipper.SimplifyPolygons(paths, options.fillType);
    },

    /**
     * Apply Clipper operation to pathsSubj and pathClip
     * clipType: {ctIntersection,ctUnion,ctDifference,ctXor}
     * subjectFill: {pftEvenOdd,pftNonZero,pftPositive,pftNegative}
     * clipFill: same as upon
     */
    executeClipper: function(pathsSubj, pathsClip, options = {
        clipType: clipperLib.ClipType
            .ctUnion,
        subjectFill: clipperLib.PolyFillType.pftNonZero,
        clipFill: clipperLib
            .PolyFillType.pftNonZero
    }) {
        if (!pathsSubj && !pathsClip) {
            return;
        }
        //turn paths so they are negatives:
        pathHelper.setDirectionPaths(pathsSubj, -1);
        if (pathsClip) {
            pathHelper.setDirectionPaths(pathsClip, -1);
        }
        //settup and execute clipper
        let cpr = new clipperLib.Clipper();
        cpr.AddPaths(pathsSubj, clipperLib.PolyType.ptSubject, true);
        if (pathsClip) {
            cpr.AddPaths(pathsClip, clipperLib.PolyType.ptClip, true);
        }
        let res = new clipperLib.Paths();
        cpr.Execute(options.clipType, res, options.subjectFill, options.clipFill);
        return res;
    },

    /**
     *  sets the direction of an array of path
     */
    setDirectionPaths: function(paths, direction) {
        for (let i in paths) {
            pathHelper.setDirectionPath(paths[i], direction);
        }
    },

    /**
     *  sets the direction of a path
     */
    setDirectionPath: function(path, direction) {
        if (clipperLib.JS.AreaOfPolygon(path) * direction < 0) {
            path.reverse();
        }
    },

    /**
     *  checks if the signed area of the path is positive
     */
    isPositivePath: function(path) {
        return pathHelper.getDirectionPath(path) > 0;
    },

    /**
     *  checks if the signed area of the path is negative
     */
    isNegativePath: function(path) {
        return pathHelper.getDirectionPath(path) < 0;
    },

    /**
     *  get the direction of an arary of path
     */
    getDirectionPaths: function(paths) {
        return paths.map(pathHelper.getDirectionPath);
    },

    /**
     *  get the direction of a path
     */
    getDirectionPath: function(path) {
        return (clipperLib.JS.AreaOfPolygon(path) > 0) ? 1 : -1;
    },

    scaleUpPath: function(path) {
        clipperLib.JS.ScaleUpPath(path, 10000);
    },

    scaleDownPath(path) {
        clipperLib.JS.ScaleDownPath(path, 10000);
    },
    scaleDownPaths(paths) {
        clipperLib.JS.ScaleDownPaths(paths, 10000);
    },

    getPathBoundary: function(path) {
        let minX = path[0].X;
        let minY = path[0].Y;
        let maxX = path[0].X;
        let maxY = path[0].Y;
        for (let i = 1; i < path.length; i++) {
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

    getPathsIncluded: function(pathsOut, pathsIn) {

        for (let pathIn of pathsIn) {
            for (let i in pathOut) {
                if (!pathHelper.isIncluded(pathsOut[i], pathIn)) {
                    continue;
                }

            }
        }

    },

    getMatchingEdgeIndex: function(path, pathToMatch) {
        let prevAligned=false;
        let res={};
        for (let i = path.length-1; i >=0 ; i--) {
            for (let j = pathToMatch.length-1; j >=0 ; j--) {

                let p1 = pathToMatch[j];
                let p2 = pathToMatch[(j + 1) % pathToMatch.length];
                let currAlgigned= pathHelper.isAligned(path[i],path[(i+1)%path.length],p1,p2);
                if(!currAlgigned&&prevAligned)
                {
                    return res;
                }
                if(currAlgigned)
                {
                    res= {index: i, pointmatch:p1 };
                    prevAligned=currAlgigned;
                    break;
                }

            }
        }

    },

    isAligned:function(e11,e12,e21,e22){
        let edge1= pathHelper.getEdge(e11,e12);
        let edge2= pathHelper.getEdge(e11,e21);
        let edge3= pathHelper.getEdge(e11,e22);
        return pathHelper.isColinear(edge1,edge2)&& pathHelper.isColinear(edge1,edge3);
    },

    isColinear: function(edge1, edge2) {
        return edge1.X * edge2.Y === edge1.Y * edge2.X;
    },

    getEdge: function(point1, point2) {
        return {
            X: (point2.X - point1.X),
            Y: (point2.Y - point1.Y)
        };
    },

    isIncluded: function(pathOut, pathsIn) {
        let union = pathHelper.getUnionOfPaths([pathOut], pathsIn);
        if (union.length > 1) return false;
        return pathHelper.isPathEqual(union[0], pathOut);
    },

    /**
     * returns the index of the point in path matching with point
     *
     */
    getPointMatch: function(path, point, offsetPath = 0) {
        for (let i = offsetPath; i < path.length; i++) {
            if (pathHelper.isEqual(path[i], point)) {
                return {
                    index: i
                };
            }
        }
    },

    fitPathsIntoPath: function(outerPath, toFitPaths) {

        let paths = toFitPaths.push(outerPath);
        let union = pathHelper.getUnionOfPaths(paths);
        let inter = pathHelper.getInterOfPaths(paths);
        let xor = pathHelper.getXorOfPaths(union, inter);

        return pathHelper.getDiffOfPaths(paths, xor);

    },

    getTopLeftIndex: function(path) {
        let minIndex = 0;
        let min = pathHelper.getNormPoint(path[0]);
        for (let i = 1; i < path.length; i++) {
            let norm = pathHelper.getNormPoint(path[i]);
            if (norm < min) {
                minIndex = i;
                min = norm;
            }
        }
        return +minIndex;
    },

    getNormPoint: function(point) {
        return Math.sqrt(point.X * point.X + point.Y * point.Y);
    },
    getDistance: function(point1, point2) {
        let edge = pathHelper.getEdge(point1, point2);
        return pathHelper.getNormPoint(edge);
    },

    getTotalLength: function(path) {
        let res = 0;
        if(!path){return 0;}
        for (let i = 0; i < path.length; i++) {
            let curr = path[i];
            let next = path[(i + 1) % path.length];
            res += pathHelper.getDistance(curr, next);
        }
        return res;
    },

    /**
     *  checks if two points have the same coordinates
     *
     */
    isEqual: function(point1, point2) {
        return (point1.X === point2.X) && (point1.Y === point2.Y);
    },

    isPathEqual: function(path1, path2) {
        if (path1.length !== path2.length) {
            return false;
        }
        for (let i = 0; i < path1.length; i++) {
            if (!isEqual(path1[i], path2[i])) {
                return false;
            }
        }
        return true;
    }


};
module.exports = pathHelper;
