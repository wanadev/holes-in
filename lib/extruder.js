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
    getGeometry(outerShape, holes, options = { inMesh: true, outMesh: true, frontMesh: true, backMesh: true, horrizontalMesh: true, doNotBuild: [] }) {

        // get the topology 2D paths by depth
        const data = extruder.getDataByDepth(outerShape, holes);
        const outerPathsByDepth = data.outerPathsByDepth;
        const innerPathsByDepth = data.innerPathsByDepth;
        const horrizontalPathsByDepth = data.horrizontalPathsByDepth;

        if (options.doNotBuild) {
            pathHelper.scaleUpPaths(options.doNotBuild);
            extruder.markAsForbidden(outerPathsByDepth, options.doNotBuild);
            extruder.markAsForbidden(innerPathsByDepth, options.doNotBuild);
        }

        uvHelper.mapVertical(outerPathsByDepth, outerShape, options);

        const res = {};

        if (options.frontMesh) {
            res.frontMesh = extruder.getHorrizontalGeom(horrizontalPathsByDepth, [0], 0);
            uvHelper.mapHorrizontal(innerPathsByDepth, outerShape, res.frontMesh, options);
        }
        if (options.backMesh) {
            res.backMesh = extruder.getHorrizontalGeom(horrizontalPathsByDepth, [horrizontalPathsByDepth.length - 1], 0, false);
            uvHelper.mapHorrizontal(innerPathsByDepth, outerShape, res.backMesh, options);
        }
        if (options.inMesh) {
            uvHelper.mapVertical(innerPathsByDepth, outerShape, options);
            res.inMesh = extruder.getVerticalGeom(innerPathsByDepth, outerPathsByDepth, 0, true);
        }
        if (options.horrizontalMesh) {
            const indexes = [];
            for (let i = 1; i < horrizontalPathsByDepth.length - 1; i++) {
                indexes.push(i);
            }
            const meshHor = extruder.getHorrizontalGeom(horrizontalPathsByDepth, indexes, 0);
            if (meshHor) {
                uvHelper.mapHorrizontal(innerPathsByDepth, outerShape, meshHor, options);
            }
            res.horrizontalMesh = meshHor;
        }
        if (options.outMesh) {
            const outMesh = extruder.getVerticalGeom(outerPathsByDepth, null, 0, false);
            res.outMesh = outMesh;
        }

        if (options.swapToBabylon) {
            babylonHelper.swapAllToBabylon(res);
        }
        return res;
    },

    getVerticalGeom(innerPathsByDepth, toMarkPaths, offset = 0, invertNormal = false) {
        const geom = [];

        for (let indexDepth = innerPathsByDepth.length - 1; indexDepth > 0; indexDepth--) {
            const pathsAtDepth = innerPathsByDepth[indexDepth].paths;
            // for each point at each path at each depth we look for the corresponding point into the upper paths:
            for (let i = 0; i < pathsAtDepth.length; i++) {
                const path = pathsAtDepth[i];
                for (let idxPtDwn = 0; idxPtDwn < path.length; idxPtDwn++) {
                    const idxNPtDwn = (idxPtDwn + 1) % path.length;
                    const currgeom = geomHelper.getOneVerticalGeom(idxPtDwn, idxNPtDwn, +indexDepth, path,
                         innerPathsByDepth, toMarkPaths, +offset, invertNormal);
                    if (!currgeom) {
                        continue;
                    }
                    geom.push(currgeom);
                    offset = currgeom.offset;
                }
            }
        }
        return geomHelper.mergeMeshes(geom, false);
    },

    /**
     * Returns the geometry of the inner horrizontal facess
     */
    getHorrizontalGeom(horrizontalPathsByDepth, indexes, offset = 0, invertNormal = true) {
        const horrGeom = [];
        for (let i = 0; i < indexes.length; i++) {
            const totaltopo = horrizontalPathsByDepth[indexes[i]].paths;
            const triangles = cdt2dHelper.computeTriangulation(totaltopo);
            triangles.depth = horrizontalPathsByDepth[indexes[i]].depth;

            const horrGeomAtDepth = geomHelper.getHorrizontalGeom(triangles, 0, invertNormal);
            horrGeom.push(horrGeomAtDepth);
        }
         // get points, normal and faces from it:
        return geomHelper.mergeMeshes(horrGeom, true);
    },


    getDataByDepth(outerShape, holes) {
        let outerPaths = [];
        let innerPaths = [];
        let horrizontalPaths = [];

        pathHelper.scaleUpPath(outerShape.path);
        for (let i = 0; i < holes.length; i++) {
            pathHelper.scaleUpPath(holes[i].path);
        }
        const holesByDepth = extruder.getHolesByDepth(holes, outerShape);
        let outer = [outerShape.path];
        let stack = 0;
        for (let i = holesByDepth.length - 1; i >= 0; i--) {
            // compute the outer path:
            const removeFromOuter = pathHelper.getUnionOfPaths(holesByDepth[i].keep.concat(holesByDepth[i].stop));

            outer = pathHelper.getDiffOfPaths(outer, removeFromOuter);
            outer = pathHelper.simplifyPaths(pathHelper.getUnionOfPaths(outer));
            outerPaths.push(outer);

            // fit the inner paths into the outer:
            let innerPath = pathHelper.getInterOfPaths(holesByDepth[Math.max(i - 1, 0)].keep, outer);
            innerPath = pathHelper.simplifyPaths(pathHelper.getUnionOfPaths(innerPath));
            innerPaths.push(innerPath);
            // computes the horrizontal Geom:
            let horrizontalPath;
            if (i === 0 || i === holesByDepth.length - 1) {
                horrizontalPath = JSON.parse(JSON.stringify(outer.concat(innerPath)));
            } else {
                // fit holes that stops at this depth into the outer:
                horrizontalPath = pathHelper.getInterOfPaths(holesByDepth[i].stop, outerPaths[Math.max(stack - 1, 0)]);
                horrizontalPath = pathHelper.simplifyPaths(horrizontalPath);
            }
            horrizontalPaths.push(horrizontalPath);
            stack++;
        }
        for (let i = 0; i < outerPaths.length; i++) {
            outerPaths[i] = pathHelper.cleanPaths(outerPaths[i]);
            innerPaths[i] = pathHelper.cleanPaths(innerPaths[i]);
            horrizontalPaths[i] = pathHelper.cleanPaths(horrizontalPaths[i]);


            pathHelper.setDirectionPaths(outerPaths[i], -1);
            pathHelper.setDirectionPaths(innerPaths[i], -1);
            pathHelper.setDirectionPaths(horrizontalPaths[i], -1);
        }

        outerPaths = outerPaths.reverse();
        innerPaths = innerPaths.reverse();
        horrizontalPaths = horrizontalPaths.reverse();

        for (let i = 0; i < holesByDepth.length; i++) {
            outerPaths[i] = { paths: outerPaths[i], depth: holesByDepth[i].depth };
            innerPaths[i] = { paths: innerPaths[i], depth: holesByDepth[i].depth };
            horrizontalPaths[i] = { paths: horrizontalPaths[i], depth: holesByDepth[i].depth };
        }

        return { outerPathsByDepth: outerPaths,
            innerPathsByDepth: innerPaths,
            horrizontalPathsByDepth: horrizontalPaths,
            holesByDepth };
    },

    /**
     *  Takes an array of paths representing holes at different depths.
     *  One depth value/ path.
     *  returns an array of paths at each depth: simplify the geometry for each stage.
     */
    getHolesByDepth(holes, outerShape) {

        // sets all depths deeper than outerDepth  or equals to 0 to outerDepth:
        holes.map(elt => { // eslint-disable-line
             (elt.depth >= outerShape.depth || elt.depth === 0) ? elt.depth = outerShape.depth + 1 : elt.depth = elt.depth; // eslint-disable-line
        });

        holes.map(elt => { // eslint-disable-line
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
        for (let i = 0; i < holes.length; i++) {
            pathHelper.displaceColinearEdges(outerShape.path, holes[i].path);
        }

        // get paths by depth:
        const res = [];
        for (let i = 0; i < depths.length; i++) {
            const deeperHoles = holes.filter(s => s.depth > depths[i]);
            const keep = [];
            deeperHoles.map(s => keep.push(s.path));

            const stopHoles = holes.filter(s => s.depth === depths[i]);
            const stop = [];
            stopHoles.map(s => stop.push(s.path));

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

};

module.exports = extruder;
