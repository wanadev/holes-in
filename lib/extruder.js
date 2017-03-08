"use strict";

const clipperLib = require("clipper-lib");
const pathHelper = require("./path-helper.js");
const geomHelper = require("./geom-helper.js");
const cdt2dHelper = require("./cdt2d-helper.js");

var extruder = {

    /**
     * getGeometry([{ X: 0, Y: 3 }, ...], [{
     *    path: [{ X, Y }, { X, Y }, ...],
     *    depth: 50
     * }, {
     *    ...
     * }], {
     *    bottom: true,
     *    sides: false,
     *    ...
     * });
     */
    getGeometry: function(outerShape, holes, depthsHoles, depthOuterShape) {
        //get the topology 2D paths by depth
        let options = {
            frontMesh: true,
            backMesh: true,
            outMesh: true,
            inMesh: true
        };
        let pathsByDepth = extruder.getPathsByDepth(holes, depthsHoles, depthOuterShape);
        let topoPathsByDepth = extruder.getTopoPathByDepth(pathsByDepth, outerShape, depthOuterShape, options);

        let res = {};
        if (options.frontMesh) {
            res.frontMesh = extruder.getInnerHorizontalGeom(topoPathsByDepth, {
                frontMesh: true
            });
        }
        if (options.backMesh) {
            res.backMesh = extruder.getInnerHorizontalGeom(topoPathsByDepth, {
                backMesh: true
            });
        }
        if (options.inMesh) {
            let inMeshHor = extruder.getInnerHorizontalGeom(topoPathsByDepth, {
                inMesh: true
            });
            let offset = 0;
            if (inMeshHor) {
                offset = inMeshHor.offset;
            }
            let inMeshVert = extruder.getInnerVerticalGeom(pathsByDepth, offset);
            res.inMesh = geomHelper.mergeMeshes([inMeshHor, inMeshVert], false);
        }
        if (options.outMesh) {
            res.outMesh = geomHelper.getOuterVerticalGeom(outerShape, depthOuterShape);
        }

        return res;
    },



    getInnerVerticalGeom: function(pathsByDepth, offset = 0) {
        //ensure the paths are all in the same direction
        Object.keys(pathsByDepth.paths).forEach(i => {
            pathHelper.setDirectionPaths(pathsByDepth.paths[i], 1);
        });

        let geom = [];
        for (let indexDepth = pathsByDepth.depths.length - 1; indexDepth >= 0; indexDepth--) {
            let pathsAtDepth = pathsByDepth.paths[indexDepth];
            //for each point at each path at each depth we look for the corresponding point into the upper paths:
            for (let path of pathsAtDepth) {
                for (let indexPtDwn in path) {
                    let ptDwn = path[indexPtDwn];
                    let nPtDwn = path[((+indexPtDwn) + 1) % path.length];
                    let currgeom = geomHelper.getOneInnerVerticalGeom(ptDwn, nPtDwn, +indexDepth, pathsByDepth, +offset);
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
     * Returns the geometry of the inner horizontal facess
     */
    getInnerHorizontalGeom: function(topoPathsByDepth, options, offset = 0) {
        //gets all the triangles by depth:
        let trianglesByDepth = [];
        for (let i in topoPathsByDepth) {
            let totaltopo = topoPathsByDepth[i].pos.concat(topoPathsByDepth[i].neg);
            trianglesByDepth.push(cdt2dHelper.computeTriangulation(totaltopo));
            trianglesByDepth[i].depth = topoPathsByDepth[i].depth;
        }
        // get points, normal and faces from it:
        return geomHelper.getInnerHorizontalGeom(trianglesByDepth, options, +offset);
    },


    /**
     * Returns the paths sorted by sens. Negativess paths are holes.
     * Positives paths are the end of holes( solids)
     * For convinience, all paths are set to positive
     */
    getTopoPathByDepth: function(pathsByDepth, outerShape, depthOuterShape, options) {
        let paths = pathsByDepth.paths;
        let topoByDepth = [];
        pathHelper.setDirectionPath(outerShape, 1);

        let pos1 = [];
        if (options.frontMesh) {
            pos1 = [outerShape];
        }
        topoByDepth.push({
            pos: [outerShape],
            neg: paths[0],
            depth: 0
        });

        for (let i = 1; i < pathsByDepth.depths.length - 1; i++) {
            let xor = pathHelper.getXorOfPaths(paths[i], paths[i + 1]);
            let posxor = xor.filter(pathHelper.isPositivePath);
            let negxor = xor.filter(pathHelper.isNegativePath);

            pathHelper.setDirectionPaths(negxor, 1);
            topoByDepth.push({
                pos: posxor,
                neg: negxor,
                depth: pathsByDepth.depths[i]
            });
        }

        pathHelper.setDirectionPaths(paths[paths.length - 1], 1);
        topoByDepth.push({
            pos: [outerShape],
            neg: paths[paths.length - 1],
            depth: pathsByDepth.depths[pathsByDepth.depths.length - 1]
        });

        return topoByDepth;
    },


    /**
     *  Takes an array of paths representing holes at different depths.
     *  One depth value/ path.
     *  returns an array of paths at each depth: simplify the geometry for each stage.
     */
    getPathsByDepth: function(initialPaths, depths, outerDepth) {
        //sets all depths deeper than outerDepth  or equals to 0 to outerDepth:
        depths = depths.map(elt =>
            (elt > outerDepth || elt === 0 ? outerDepth : elt)
        );

        //sort paths  by depth
        let sorted = extruder.sortPathByDepth(initialPaths, depths);
        //remove duplicate depths values:
        depths = new Set(depths);
        depths = Array.from(depths);
        depths.sort(function(a, b) {
            return a - b;
        });
        //if there is no depth equals to outerDepth: add it
        if (depths[depths.length - 1] !== outerDepth) {
            depths.push(outerDepth)
        }
        //compute the paths for each depth:
        let res = [];
        //add zero depth
        if (depths[0] !== 0) {
            depths = [0].concat(depths);
        }

        for (let i in depths) {
            //take only the paths of the holes which reach this depth
            let pathsAtThisDepth = extruder.getPathAtDepth(sorted, depths[i]);
            //simplify the geometry of this path:
            res.push(pathsAtThisDepth);
        }
        return {
            paths: res,
            depths: depths
        };
    },

    /**
     * Returns a simplified [path] representing all the paths that reachs depth
     */
    getPathAtDepth: function(pathAndDepth, depth) {
        let res = [];
        let pathAtDepth = pathAndDepth.filter((s) => s.depth >= depth);
        for (let i in pathAtDepth) {
            res.push(pathAtDepth[i].path);
        }
        return pathHelper.simplifyPaths(res);
    },

    /**
     * Sort initial path by depth.
     */
    sortPathByDepth: function(initialPaths, depths) {
        //sort paths by depth
        let pathAndDepth = [];
        for (let i in initialPaths) {
            pathAndDepth.push({
                path: initialPaths[i],
                depth: depths[i]
            });
        }
        pathAndDepth.sort(function(a, b) {
            return a.depth - b.depth;
        });
        return pathAndDepth;
    }

};

module.exports = extruder;
