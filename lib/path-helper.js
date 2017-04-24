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

    simplifyPath: function(path, options = {
        fillType: clipperLib.PolyFillType.pftNonZero
    }) {
        return clipperLib.Clipper.SimplifyPolygon(path, options.fillType);
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

    scaleUpPath: function(path,scale=10000) {
        clipperLib.JS.ScaleUpPath(path, scale);
    },

    scaleDownPath(path,scale=10000) {
        clipperLib.JS.ScaleDownPath(path, scale);
    },
    scaleDownPaths(paths,scale=10000) {
        clipperLib.JS.ScaleDownPaths(paths, scale);
    },


    addColinearPointsPaths: function(paths, toAdd){

        for(let i in paths){
            for(let j in toAdd){
                paths[i]= pathHelper.addColinearPointsPath(paths[i], toAdd[j]);
            }
        }

    },

    addColinearPointsPath: function(path,toAdd ){

        let resPath=[];
        let addedIndexes=[];
        for(let i =0;i< path.length; i++){
            let pt1= path[i];
            let pt2= path[(i+1)%path.length];

            resPath.push(pt1)
            for(let j =0;j<= toAdd.length; j++){
                let idx1= j%toAdd.length;
                let idx2= (j+1)%toAdd.length;
                let add1= toAdd[idx1];
                let add2= toAdd[idx2];
                if(!pathHelper.isAligned(pt1, pt2, add1, add2)){continue;}

                if(!pathHelper.isEqual(pt1, add2)&& !pathHelper.isEqual(pt2, add2)&&
                   !addedIndexes.includes(idx2)  && pathHelper.inOnSegment(pt1,pt2,add2) ){
                    resPath.push(add2);
                    addedIndexes.push(idx2);
                }

                if(!pathHelper.isEqual(pt1, add1)&& !pathHelper.isEqual(pt2, add1)&&
                   !addedIndexes.includes(idx1)  && pathHelper.inOnSegment(pt1,pt2,add1)){
                    resPath.push(add1);
                    addedIndexes.push(idx1);
                }

            }
        }
        return resPath;
    },

    getMatchingEdgeIndex: function(path, pathToMatch,offset= 0) {
        let prevAligned = false;
        let res = {};
        for (let i = path.length - 1-offset; i >= 0; i--) {
            for (let j = pathToMatch.length - 1; j >= 0; j--) {

                let p1 = pathToMatch[j];
                let p2 = pathToMatch[(j + 1) % pathToMatch.length];
                let currAlgigned = pathHelper.isAligned(path[i], path[(i + 1) % path.length], p1, p2);
                if (!currAlgigned && prevAligned) {
                    return res;
                }
                if (!currAlgigned && !prevAligned) {continue;}
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

    displaceColinearEdges: function(path,pathToDisplace){
        let indexColinear = pathHelper.getColinearEdge(path, pathToDisplace);
        if(indexColinear === false){return}

        pathHelper.displaceEdge(pathToDisplace, indexColinear);

        return true;
    },
    displaceEdge(path, index){
        let indexPrev = (index+path.length-1)%path.length;
        let indexNext = (index+1)%path.length;

        let previousEdge= pathHelper.getEdge( path[indexPrev],path[index]);
        let nextEdge= pathHelper.getEdge(path[(index+2)%path.length],
        path[indexNext]);

        previousEdge = pathHelper.normalizeVec(previousEdge);
        nextEdge = pathHelper.normalizeVec(nextEdge);

        path[index].X+=nextEdge.X*1;
        path[index].Y+=nextEdge.Y*1;

    },

    normalizeVec:function(edge){
            let norm = Math.sqrt(edge.X*edge.X + edge.Y*edge.Y);
            return {X:edge.X/norm ,Y:edge.Y/norm};
    },

    getColinearEdge: function(path, pathToMatch) {
        for (let i =0; i <  path.length ; i++) {
             let pt1= path[i];
             let pt2= path[(i+1)%path.length];
             let edge = pathHelper.getEdge(pt1,pt2);
             for (let j =0; j <  pathToMatch.length ; j++) {
                 let edge2 = pathHelper.getEdge(pathToMatch[j],  pathToMatch[(j+1)%pathToMatch.length]);

                 if(pathHelper.isApproxAligned(pt1,pt2, pathToMatch[j],pathToMatch[(j+1)%pathToMatch.length])){
                     return j;
                 }
             }
        }
        return false;

},

isApproxAligned: function(e11, e12, e21, e22,epsilon = 0.1) {
    let edge1 = pathHelper.getEdge(e11, e12);
    let edge2 = pathHelper.getEdge(e11, e21);
    let edge3 = pathHelper.getEdge(e11, e22);
    return pathHelper.isApproxColinear(edge1, edge2,epsilon) && pathHelper.isApproxColinear(edge1, edge3,epsilon);
},

isApproxColinear:function(edge1,edge2,epsilon=0.1){
    let dot = edge1.X *edge2.X + edge1.Y*edge2.Y;
    if(dot === 0){return false;}
    let ratio =Math.sqrt( edge1.X*edge1.X + edge1.Y*edge1.Y) *Math.sqrt( edge2.X*edge2.X + edge2.Y*edge2.Y) /dot;
    ratio = Math.abs(ratio);

    if(ratio >1-epsilon && ratio <1+epsilon){
        return true;
    }
    return false;
},


    isAligned: function(e11, e12, e21, e22) {
        let edge1 = pathHelper.getEdge(e11, e12);
        let edge2 = pathHelper.getEdge(e11, e21);
        let edge3 = pathHelper.getEdge(e11, e22);
        return pathHelper.isColinear(edge1, edge2) && pathHelper.isColinear(edge1, edge3);
    },

    isColinear: function(edge1, edge2) {
        return edge1.X * edge2.Y === (edge1.Y * edge2.X)
    },

    getEdge: function(point1, point2) {
        return {
            X: (point2.X - point1.X),
            Y: (point2.Y - point1.Y)
        };
    },

    /**
     * returns the index of the point in path matching with point
     *
     */
    getPointMatch: function(path, point) {
        for (let i = 0; i < path.length; i++) {
            if(pathHelper.isEqual(path[i], point)) {
                return {
                    index: i
                };
            }
        }
    },

    getNorm: function(point) {
        return Math.sqrt(point.X * point.X + point.Y * point.Y);
    },
    getDistance: function(point1, point2) {
        let edge = pathHelper.getEdge(point1, point2);
        return pathHelper.getNorm(edge);
    },

    getTotalLength: function(path) {
        let res = 0;
        if (!path) {
            return 0;
        }
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

    inOnSegment:function( ptOrigin, ptDest, pt){
            return pathHelper.isInRange(ptOrigin, ptDest, pt)||
                   pathHelper.isInRange(ptDest, ptOrigin, pt);
    },

    isInRange: function( ptOrigin, ptDest,pt ){
        return pt.X>=ptOrigin.X && pt.X<= ptDest.X &&
               pt.Y>=ptOrigin.Y && pt.Y<= ptDest.Y;
    },

};
module.exports = pathHelper;
