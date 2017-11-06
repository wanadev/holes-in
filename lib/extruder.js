"use strict";

const pathHelper = require("./path-helper.js");
const geomHelper = require("./geom-helper.js");
const cdt2dHelper = require("./cdt2d-helper.js");
const uvHelper = require("./uv-helper.js");
const babylonHelper = require("./babylon-helper.js");


const extruder = {

    /**
     * returns a mesh from an outer shape and holes
     */
    getGeometry(outerShape, holes, options = {}) {

        options = Object.assign(extruder.getDefaultOptions(), options);

        // get the topology 2D paths by depth
        const data = extruder.getDataByDepth(outerShape, holes);
        const outerPathsByDepth = data.outerPathsByDepth;
        const innerPathsByDepth = data.innerPathsByDepth;
        const horizontalPathsByDepth = data.horizontalPathsByDepth;

        if (options.doNotBuild) {
            pathHelper.scaleUpPaths(options.doNotBuild);
            extruder.markAsForbidden(outerPathsByDepth, options.doNotBuild);
            extruder.markAsForbidden(innerPathsByDepth, options.doNotBuild);
        }

        uvHelper.mapVertical(outerPathsByDepth, outerShape, options);

        const res = {};

        if (options.frontMesh) {
            res.frontMesh = extruder.getHorizontalGeom(horizontalPathsByDepth,innerPathsByDepth, [0], 0,true);
            uvHelper.mapHorizontal(innerPathsByDepth, outerShape, res.frontMesh, options);
        }
        if (options.backMesh) {
            res.backMesh = extruder.getHorizontalGeom(horizontalPathsByDepth, innerPathsByDepth, [horizontalPathsByDepth.length - 1], 0, false);
            uvHelper.mapHorizontal(innerPathsByDepth, outerShape, res.backMesh, options);
        }
        if (options.inMesh) {
            uvHelper.mapVertical(innerPathsByDepth, outerShape, options);
            res.inMesh = extruder.getVerticalGeom(innerPathsByDepth, 0, true, options.mergeVerticalGeometries);
        }
        if (options.horizontalMesh) {
            const indexes = [];
            for (let i = 1; i < horizontalPathsByDepth.length - 1; i++) {
                indexes.push(i);
            }
            const meshHor = extruder.getHorizontalGeom(horizontalPathsByDepth, innerPathsByDepth, indexes, 0);
            if (meshHor) {
                uvHelper.mapHorizontal(innerPathsByDepth, outerShape, meshHor, options);
            }
            res.horizontalMesh = meshHor;
        }
        if (options.outMesh) {
            const outMesh = extruder.getVerticalGeom(outerPathsByDepth, 0, false, options.mergeVerticalGeometries);
            res.outMesh = outMesh;
        }

        if (options.swapToBabylon) {
            babylonHelper.swapAllToBabylon(res);
        }
        return res;
    },

    getVerticalGeom(innerPathsByDepth, offset = 0, invertNormal = false, mergeMeshes = true) {
        const geom = [];

        for (let indexDepth = innerPathsByDepth.length - 1; indexDepth > 0; indexDepth--) {
            const pathsAtDepth = innerPathsByDepth[indexDepth].paths;
            // for each point at each path at each depth we look for the corresponding point into the upper paths:
            for (let i = 0; i < pathsAtDepth.length; i++) {
                const path = pathsAtDepth[i];
                for (let idxPtDwn = 0; idxPtDwn < path.length; idxPtDwn++) {
                    const idxNPtDwn = (idxPtDwn + 1) % path.length;
                    if(path[idxPtDwn]._holesInForbidden) continue;

                    const currgeom = geomHelper.getOneVerticalGeom(idxPtDwn, idxNPtDwn, +indexDepth, path,
                         innerPathsByDepth,0, invertNormal);
                    if (!currgeom) {
                        continue;
                    }
                    geom.push(currgeom);
                }
            }
        }
        if(mergeMeshes) {
            return geomHelper.mergeMeshes(geom);
        }
        return geom;
    },

    /**
     * Returns the geometry of the inner horizontal facess
     */
    getHorizontalGeom(horizontalPathsByDepth, innerPathsByDepth, indexes, offset = 0, invertNormal = true) {
        const horrGeom = [];
        for (let i = 0; i < indexes.length; i++) {
            const innerPaths = innerPathsByDepth[indexes[i]].paths;
            const paths = horizontalPathsByDepth[indexes[i]].paths;//.concat(innerPaths);
            const triangles = cdt2dHelper.computeTriangulation(paths);
            triangles.depth = horizontalPathsByDepth[indexes[i]].depth;
            horrGeom.push(geomHelper.getHorizontalGeom(triangles, 0, invertNormal));
        }
         // get points, normal and faces from it:
        return geomHelper.mergeMeshes(horrGeom);
    },

    getDataByDepth(outerShape, holes) {
        let outerPaths = [];
        let innerPaths = [];
        let horizontalPaths = [];

        pathHelper.scaleUpPath(outerShape.path);
        for (let i = 0; i < holes.length; i++) {
            pathHelper.scaleUpPath(holes[i].path);
        }
        holes = holes.map(hole => ({path: pathHelper.offsetPath(hole.path), depth: hole.depth }) );

        const holesByDepth = extruder.getHolesByDepth(holes, outerShape);

        let stackOuter = [];
        for (let i = 0; i < holesByDepth.length; i++) {

            let outer = JSON.parse(JSON.stringify([outerShape.path]));

            const removeFromOuter = pathHelper.getUnionOfPaths(holesByDepth[i].keep.concat(holesByDepth[i].stop));
            outer = pathHelper.getDiffOfPaths(outer, removeFromOuter);
            outer = pathHelper.getUnionOfPaths(outer);
            outer.push(...holesByDepth[i].outer);
            outer = pathHelper.cleanPaths(outer,20);
            outerPaths.push(outer);

            // fit the inner paths into the outer:
            let innerPath = pathHelper.getInterOfPaths(holesByDepth[Math.max(i-1, 0)].keep, outer);
            innerPath = pathHelper.getUnionOfPaths(innerPath);
            innerPaths.push(innerPath);

            //finds the horizontatl path:
            let horr = JSON.parse(JSON.stringify([outerShape.path]));
            if(holesByDepth[i].stop.length > 0) {
                horr = pathHelper.getInterOfPaths(horr, holesByDepth[i].stop);
            }

            // Adding non-holes in holes
            const nonHolesHorr = (i === 0) ? holesByDepth[i].outer :
                (i === holesByDepth.length - 1) ?  holesByDepth[i].outer :
                pathHelper.getDiffOfPaths(holesByDepth[i+1].outer,holesByDepth[i].outer);

            horr = pathHelper.getDiffOfPaths(horr,holesByDepth[i].keep);
            horr.push(...nonHolesHorr);

            horr = pathHelper.cleanPaths(horr, 20);

            horizontalPaths.push(horr)
        }

        for (let i = 0; i < outerPaths.length; i++) {
            outerPaths[i] = pathHelper.cleanPaths(outerPaths[i],3);
            innerPaths[i] = pathHelper.cleanPaths(innerPaths[i],3);
            horizontalPaths[i] = pathHelper.cleanPaths(horizontalPaths[i],3);

            pathHelper.setDirectionPaths(outerPaths[i], -1);
            pathHelper.setDirectionPaths(innerPaths[i], -1);
            pathHelper.setDirectionPaths(horizontalPaths[i], -1);
        }

        for (let i = 0; i < holesByDepth.length; i++) {
            outerPaths[i] = { paths: outerPaths[i], depth: holesByDepth[i].depth };
            innerPaths[i] = { paths: innerPaths[i], depth: holesByDepth[i].depth };
            horizontalPaths[i] = { paths: horizontalPaths[i], depth: holesByDepth[i].depth };
        }

        return { outerPathsByDepth: outerPaths,
            innerPathsByDepth: innerPaths,
            horizontalPathsByDepth: horizontalPaths,
            holesByDepth };
    },

    /**
     *  Takes an array of paths representing holes at different depths.
     *  One depth value/ path.
     *  returns an array of paths at each depth: simplify the geometry for each stage.
     */
    getHolesByDepth(holes, outerShape) {

        // sets all depths deeper than outerDepth  or equals to 0 to outerDepth:
        holes.forEach(elt => {
             (elt.depth >= outerShape.depth || elt.depth === 0) ? elt.depth = outerShape.depth + 1 : elt.depth = elt.depth; // eslint-disable-line
        });

        holes.forEach(elt => {
            if(!elt.path) return;
            // TODO: remove to use holes in holes
            pathHelper.setDirectionPath(elt.path, 1);
        });

        // get all depths:
        let depths = new Set();
        for (let i = 0; i < holes.length; i++) {
            if (holes[i].depth < outerShape.depth) { depths.add(holes[i].depth); }
        }
        depths.add(0);
        depths.add(outerShape.depth);
        depths = Array.from(depths);
        depths.sort(
            function (a, b) {
                return a - b;
            });


        // filter:
        holes = holes.filter(hole => hole.path !== undefined);

        // get paths by depth:
        const res = [];
        for (let i = 0; i < depths.length; i++) {
            const deeperHoles = holes.filter(s => s.depth > depths[i]);
            const keep = [];
            deeperHoles.forEach(s => keep.push(s.path));

            const stopHoles = holes.filter(s => s.depth === depths[i]);
            const stop = [];
            stopHoles.forEach(s => stop.push(s.path));

            // take only the paths of the holes which reach this depth
            res.push({
                keep,
                stop,
                depth: depths[i],
            });
        }

        // gets the difference between keep and stop:
        for (let i = 0; i < depths.length; i++) {
            res[i].stop = pathHelper.getDiffOfPaths(res[i].stop, res[i].keep);
        }

        for (let i = 0; i < depths.length; i++) {
            const keepAndStop = pathHelper.getUnionOfPaths(res[i].keep.concat(res[i].stop));
            res[i].outer = keepAndStop.filter(path => pathHelper.getDirectionPath(path) < 0);

            res[i].stop = pathHelper.getUnionOfPaths(res[i].stop);
            res[i].keep = pathHelper.getUnionOfPaths(res[i].keep);
        }

        return res;
    },

    // mark all points that bbelong to one of the edges as forbidden
    markAsForbidden(pathsByDepth, edges) {
        for (let j = 0; j < edges.length; j++) {
            const edge = edges[j];
            for (let i = pathsByDepth.length - 1; i >= 0; i--) {
                const paths = pathsByDepth[i].paths;
                for (let k = 0; k < paths.length; k++) {
                    const path = paths[k];
                    const toMark = pathHelper.getPointsOnEdge(path, edge);
                    toMark.map(pt => pt._holesInForbidden = true);
                }
            }
        }
    },

    getDefaultOptions() {
        return {
            inMesh: true,
            outMesh: true,
            frontMesh: true,
            backMesh: true,
            horizontalMesh: true,
            mergeVerticalGeometries: true,
            doNotBuild: [],
        };
    },

};

module.exports = extruder;
