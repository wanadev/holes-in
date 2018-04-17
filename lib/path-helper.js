"use strict";

const clipperLib = require("clipper-lib");
const constants = require("./constants.js");

const pathHelper = {


    /**
     * Compute the xor of two arrays of path
     *
     */
    getXorOfPaths(pathsSubj, pathsClip) {
        const options = {
            subjectFillType: clipperLib.PolyFillType.pftNonZero,
            clipFillType: clipperLib.PolyFillType.pftNonZero,
            clipType: clipperLib.ClipType.ctXor,
        };
        return pathHelper.executeClipper(pathsSubj, pathsClip, options);
    },

    /**
     * Compute the xor of two arrays of path
     *
     */
    getUnionOfPaths(pathsSubj, pathsClip, options) {
        options = Object.assign({}, options);
        options.clipType = clipperLib.ClipType.ctUnion;
        return pathHelper.executeClipper(pathsSubj, pathsClip, options);
    },

    /**
     * Compute the xor of two arrays of path
     *
     */
    getDiffOfPaths(pathsSubj, pathsClip, options) {
        options = Object.assign({}, options);
        options.clipType = clipperLib.ClipType.ctDifference;
        return pathHelper.executeClipper(pathsSubj, pathsClip, options);
    },

    /**
     * Compute the xor of two arrays of path
     *
     */
    getInterOfPaths(pathsSubj, pathsClip, op) {
        const options = {
            subjectFillType: clipperLib.PolyFillType.pftNonZero,
            clipFillType: clipperLib.PolyFillType.pftNonZero,
            clipType: clipperLib.ClipType.ctIntersection,
        };
        return pathHelper.executeClipper(pathsSubj, pathsClip, options);
    },

    /**
     * Simplify an array of paths
     *
     */
    simplifyPaths(paths, options = {
        fillType: clipperLib.PolyFillType.pftNonZero,
    }) {
        return clipperLib.Clipper.SimplifyPolygons(paths, options.fillType);
    },

    simplifyPath(path, options = {
        fillType: clipperLib.PolyFillType.pftNonZero,
    }) {
        return clipperLib.Clipper.SimplifyPolygon(path, options.fillType);
    },

    /**
     * Apply Clipper operation to pathsSubj and pathClip
     * clipType: {ctIntersection,ctUnion,ctDifference,ctXor}
     * subjectFill: {pftEvenOdd,pftNonZero,pftPositive,pftNegative}
     * clipFill: same as upon
     */
    executeClipper(pathsSubj, pathsClip, options) {
        options = Object.assign({
            clipType: clipperLib.ClipType.ctUnion,
            subjectFill: clipperLib.PolyFillType.pftNonZero,
            clipFill: clipperLib.PolyFillType.pftNonZero,
            polyTree: false,
            pathPreProcess: true,
        }, options);

        if (!pathsSubj && !pathsClip) {
            return;
        }
        if(options.pathPreProcess){
            pathHelper.setDirectionPaths(pathsSubj, -1);
            if (pathsClip) {
                pathHelper.setDirectionPaths(pathsClip, -1);
            }
        }
        const cpr = new clipperLib.Clipper();
        cpr.StrictlySimple = true;
        cpr.AddPaths(pathsSubj, clipperLib.PolyType.ptSubject, true);

        if (pathsClip) {
            cpr.AddPaths(pathsClip, clipperLib.PolyType.ptClip, true);
        }
        let res;
        if(options.polyTree){
            res = new clipperLib.PolyTree();
        } else {
            res = new clipperLib.Paths();
        }

        cpr.Execute(options.clipType, res, options.subjectFill, options.clipFill);
        return res;
    },

    offsetPaths(paths, offset = 100) {
        let co = new clipperLib.ClipperOffset();
        let res = new clipperLib.Paths();

        co.AddPaths(paths, clipperLib.JoinType.jtMiter, clipperLib.EndType.etClosedPolygon);
        co.MiterLimit = 2;
        co.ArcTolerance = 0.25;
        co.Execute(res, offset);
        return res;
    },

    offsetPath(path, offset = 100) {
        return pathHelper.offsetPaths([path], offset)[0];
    },

    /**
     *  sets the direction of an array of path
     */
    setDirectionPaths(paths, direction) {
        for (let i = 0; i < paths.length; i++) {
            pathHelper.setDirectionPath(paths[i], direction);
        }
    },

    /**
     *  sets the direction of a path
     */
    setDirectionPath(path, direction) {
        if (clipperLib.JS.AreaOfPolygon(path) * direction < 0) {
            path.reverse();
        }
    },

    /**
     *  checks if the signed area of the path is positive
     */
    isPositivePath(path) {
        return pathHelper.getDirectionPath(path) > 0;
    },

    /**
     *  checks if the signed area of the path is negative
     */
    isNegativePath(path) {
        return pathHelper.getDirectionPath(path) < 0;
    },

    /**
     *  get the direction of an arary of path
     */
    getDirectionPaths(paths) {
        return paths.map(pathHelper.getDirectionPath);
    },

    /**
     *  get the direction of a path
     */
    getDirectionPath(path) {
        return (clipperLib.JS.AreaOfPolygon(path) > 0) ? 1 : -1;
    },

    scaleUpPaths(paths, scale = constants.scaleFactor) {
        clipperLib.JS.ScaleUpPaths(paths, scale);
    },

    scaleUpPath(path, scale = constants.scaleFactor) {
        clipperLib.JS.ScaleUpPath(path, scale);
    },

    scaleDownPath(path, scale = constants.scaleFactor) {
        clipperLib.JS.ScaleDownPath(path, scale);
    },
    scaleDownPaths(paths, scale = constants.scaleFactor) {
        clipperLib.JS.ScaleDownPaths(paths, scale);
    },

    getMatchingEdgeIndex(path, pathToMatch, offset = 0) {
        let prevAligned = false;
        let res = {};
        for (let i = path.length - 1 - offset; i >= 0; i--) {
            for (let j = pathToMatch.length - 1; j >= 0; j--) {

                const p1 = pathToMatch[j];
                const p2 = pathToMatch[(j + 1) % pathToMatch.length];
                const currAlgigned = pathHelper.isApproxAligned(path[i], path[(i + 1) % path.length], p1, p2);
                if (!currAlgigned && prevAligned) {
                    return res;
                }
                if (!currAlgigned && !prevAligned) { continue; }
                if (currAlgigned) {
                    res = {
                        index: i,
                        pointmatch: p1,
                    };
                    prevAligned = currAlgigned;
                    break;
                }

            }
        }

    },

    normalizeVec(edge) {
        const norm = Math.sqrt(edge.X * edge.X + edge.Y * edge.Y);
        return { X: edge.X / norm, Y: edge.Y / norm };
    },

    isApproxAligned(e11, e12, e21, e22, epsilon = 0.0001) {
        // checks the area of the triangles:
        //           [ Ax   * (By    -  Cy)   +  Bx   * (Cy    -  Ay)   + Cx    * (Ay    -  By) ] / 2
        const area1 = e11.X * (e12.Y - e21.Y) + e12.X * (e21.Y - e11.Y) + e21.X * (e11.Y - e12.Y);
        //           [ Ax   * (By    -  Cy)   +  Bx   * (Cy    -  Ay)   + Cx    * (Ay    -  By) ] / 2
        const area2 = e11.X * (e12.Y - e22.Y) + e12.X * (e22.Y - e11.Y) + e22.X * (e11.Y - e12.Y);


        const lengthAB = (e11.X - e12.X) * (e11.X - e12.X) + (e11.Y - e12.Y) * (e11.Y - e12.Y);
        const lengthAC1 = (e11.X - e21.X) * (e11.X - e21.X) + (e11.Y - e21.Y) * (e11.Y - e21.Y);
        const lengthAC2 = (e11.X - e22.X) * (e11.X - e22.X) + (e11.Y - e22.Y) * (e11.Y - e22.Y);

        return (Math.abs(area1) / (lengthAB + lengthAC1) + Math.abs(area2) / (lengthAB + lengthAC2))< epsilon;
    },

    getEdge(point1, point2) {
        return {
            X: (point2.X - point1.X),
            Y: (point2.Y - point1.Y),
        };
    },

    /**
     * returns the index of the point in path matching with point
     *
     */
    getPointMatch(path, point) {
        for (let i = 0; i < path.length; i++) {
            if (pathHelper.isEqual(path[i], point)) {
                return {
                    index: i,
                };
            }
        }
    },

    getPointsOnEdge(path, edge) {
        const res = [];
        for (let i = 0; i < path.length; i++) {
            const ptA = path[i];
            const ptB = path[(i + 1) % path.length];
            if (!pathHelper.isApproxAligned(ptA, ptB, edge[0], edge[1])) {
                 continue;
            }
            res.push(ptA);
        }
        return res;
    },

    getNorm(point) {
        return Math.sqrt(point.X * point.X + point.Y * point.Y);
    },
    getDistance(point1, point2) {
        const edge = pathHelper.getEdge(point1, point2);
        return pathHelper.getNorm(edge);
    },

    getTotalLength(path) {
        let res = 0;
        if (!path) {
            return 0;
        }
        for (let i = 0; i < path.length; i++) {
            const curr = path[i];
            const next = path[(i + 1) % path.length];
            res += pathHelper.getDistance(curr, next);
        }
        return res;
    },

    /**
     *  checks if two points have the same coordinates
     *
     */
    isEqual(point1, point2) {
        return (point1.X === point2.X) && (point1.Y === point2.Y);
    },


    cleanPaths(paths, threshold = 10) {
        return clipperLib.Clipper.CleanPolygons(paths, threshold);
    },

};
module.exports = pathHelper;
