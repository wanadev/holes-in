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
            const outMesh = extruder.getVerticalGeom(outerPathsByDepth, 0, true, options.mergeVerticalGeometries);
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
            const paths = horizontalPathsByDepth[indexes[i]].paths;
            const triangles = cdt2dHelper.computeTriangulation(paths);
            triangles.depth = horizontalPathsByDepth[indexes[i]].depth;
            horrGeom.push(geomHelper.getHorizontalGeom(triangles, 0, invertNormal));
        }
         // get points, normal and faces from it:
        return geomHelper.mergeMeshes(horrGeom);
    },

    getDataByDepth(outerShape,holes) {
        // sets all depths deeper than outerDepth  or equals to 0 to outerDepth:
        holes.forEach(elt => {
             (elt.depth >= outerShape.depth || elt.depth === 0) ? elt.depth = outerShape.depth + 1 : elt.depth = elt.depth; // eslint-disable-line
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
        holes.forEach(hole => pathHelper.scaleUpPath(hole.path));

        pathHelper.scaleUpPath(outerShape.path);

        const outerPaths = [];
        const innerPaths = [];
        const horriPaths = [];

         depths.forEach((depth,i )=> {
            let keep = holes.filter(hole => hole.depth >= depth).map(hole => hole.path);
            const diff = pathHelper.getDiffOfPaths([outerShape.path], keep, {polyTree: false});

            const outerPathAtDepth = diff.filter(path => pathHelper.getDirectionPath(path) > 0);
            const innerPathAtDepth = diff.filter(path => pathHelper.getDirectionPath(path) < 0);

            outerPaths.push({paths: pathHelper.cleanPaths(outerPathAtDepth, 20), depth});
            innerPaths.push({paths: pathHelper.cleanPaths(innerPathAtDepth, 20), depth});

            let horr;
            if(i===0){
                horr = outerPathAtDepth.concat(innerPathAtDepth);
            }else{
                keep = holes.filter(hole => hole.depth > depth).map(hole => hole.path);
                const stop = pathHelper.getUnionOfPaths(holes.filter(hole => hole.depth === depth).map(hole => hole.path));
                horr = [JSON.parse(JSON.stringify(outerShape.path))];
                if(stop.length > 0) {
                    horr = pathHelper.getInterOfPaths(horr, stop,{ pathPreProcess: false});
                }
                horr = pathHelper.getDiffOfPaths(horr, keep, {pathPreProcess: false});
                horr = pathHelper.cleanPaths(horr, 20);
            }
                horriPaths.push({paths:horr, depth });
        });
        const allHorrizontals = horriPaths.map(elt => elt.paths);
        horriPaths[horriPaths.length-1].paths = outerPaths[outerPaths.length-1].paths.concat(innerPaths[innerPaths.length-1].paths);
        return { outerPathsByDepth: outerPaths,
            innerPathsByDepth: innerPaths,
            horizontalPathsByDepth: horriPaths,
            depthsCount: outerPaths.length,
        };
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
