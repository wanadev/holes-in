"use strict";

const cdt2d = require("cdt2d");
const pathHelper = require("./path-helper")
const constants = require("./constants");

const cdt2dHelper = {


    computeTriangulation(paths, options, callStack = 0) {
        if(callStack > 3){
            console.warn("holes-in: warning a set points does not result in any triangulation.", JSON.stringify(paths));
            return {triangles: [], faces: []};
        }
        const cdtPoints = cdt2dHelper.clipperTocdt2d(paths);
        const cdtEdges = cdt2dHelper.pathsToEdges(paths);
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
       if(paths.length && !triangles.length) {
           let foundProblem = 0;
           // checks if a point from a path if at the same position than a point from annother path.
           for(let i = 0; i< paths.length-1; i++){
               const path0 = paths[i];
               for(let j = i+1; j< paths.length; j++) {
                   const path1 = paths[j];
                   for(let k = 0 ; k< path0.length; k++){
                       const point0 = path0[k];
                       for(let l = 0 ; l < path1.length; l++) {
                           const point1 = path1[l];

                            if(pathHelper.getDistance(point0,point1) > 1) continue;

                            const repulsion = {X: Math.max(10, (point1.X - point0.X)/2), Y: Math.max(10, (point1.Y - point0.Y)/2,10) };
                            path0[k] = {X: point0.X + repulsion.X , Y: point0.Y + repulsion.Y }
                            path1[l] = {X: point1.X - repulsion.X , Y: point1.Y - repulsion.Y }
                            foundProblem++;
                       }
                   }
               }
           }
           if(foundProblem){
               return cdt2dHelper.computeTriangulation(paths, options, callStack+1);
           }

           // checks if a point if upon a segment
           for(let i = 0; i< paths.length; i++){
               const path = paths[i];
               for(let j = 0 ; j< path.length-1; j++){
                   const segmentA = path[j];
                   const segmentB = path[j+1];
                  for(let k = 0; k < path.length; k++){
                      if(k == j || k == j+1) continue;
                      const point = path[k];
                      if(!cdt2dHelper.isPointOnSegment(point, segmentA, segmentB)) continue;
                      // displace the point:
                      const norm =  pathHelper.getDistance(segmentA,segmentB);
                      const repulsion = {X: -(segmentB.Y - segmentA.Y)/norm, Y: -(segmentB.X - segmentA.X)/norm };
                      const vecPath = {X: path[(k+1)%path.length].X - point.X,  Y: path[(k+1)%path.length].Y - point.Y}
                      if( vecPath.X * repulsion.X + vecPath.Y * repulsion.Y  < 0) {
                          repulsion.X = - repulsion.X;
                          repulsion.Y = - repulsion.Y;
                      }
                      path[k] = {X: point.X + repulsion.X, Y: point.Y+repulsion.Y}
                      foundProblem++;
                  }
               }
           }
           if(foundProblem){
               return cdt2dHelper.computeTriangulation(paths, options, callStack+1);
           }
       }
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

    /**
     * Check if the point belongs to the segment.
     * More presicely, if it's contained by the rectangle
     * which contains the segment along its main axis
     * and is small along the secondary axis
     *
     * @param {BABYLON.Vector2} p The point
     * @param {BABYLON.Vector2} ss One extremum of the segment
     * @param {BABYLON.Vector2} se The other extremum of the segment
     * @param {Number} [threshold=helpers.math2d.DEFAULT_THRESHOLD]
     * @return {Boolean}
     */
    isPointOnSegment(p, ss, se, threshold = 10) {
        // save the length and normalize v
        // const v = se.subtract(ss);
        const v = {X: se.X - ss.X, Y: se.Y - ss.Y};

        const l = Math.sqrt(v.X* v.X + v.Y* v.Y);
        v.X = v.X/ l;
        v.Y = v.Y/ l;

        // the minimal distance from the segment to the point
        // and the projection of the point on the segment
        // const w = p.subtract(ss);
        const w = {X: p.X - ss.X, Y: p.Y - ss.Y};

        const h = v.X * w.Y - v.Y * w.X;
        const dot = v.X + w.X + v.Y + w.Y;
        return (Math.abs(h) < threshold && dot >= -threshold && dot <= l + threshold);
    },


};
module.exports = cdt2dHelper;
