"use strict";

const clipperLib = require("clipper-lib");
const pathHelper = require("./path-helper.js");
const geomHelper = require("./geom-helper.js");
const cdt2dHelper = require("./cdt2d-helper.js");

const exportHelper = require("./export-helper.js");


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
    getGeometry: function(outerShape, holes,options) {
        //get the topology 2D paths by depth

        let pathsByDepth = extruder.getPathsByDepth(holes, outerShape);
        let topoPathsByDepth = extruder.getTopoPathByDepth(pathsByDepth, outerShape, options);

        extruder.scaleDownPathsByDepth(pathsByDepth);
        extruder.scaleDownTopoByDepth(topoPathsByDepth,outerShape);

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
            res.outMesh = geomHelper.getOuterVerticalGeom(outerShape, outerShape.depth);
        }

        return res;
    },



    getInnerVerticalGeom: function(pathsByDepth, offset = 0) {
        //ensure the paths are all in the same direction
        Object.keys(pathsByDepth).forEach(i => {
            pathHelper.setDirectionPaths(pathsByDepth[i].paths, 1);
        });

        let geom = [];
        for (let indexDepth = pathsByDepth.length - 1; indexDepth > 0; indexDepth--) {
            let pathsAtDepth = pathsByDepth[indexDepth].paths;
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
    getTopoPathByDepth: function(pathsByDepth, outerShape, options) {
        // let paths = pathsByDepth.paths;
        let topoByDepth = [];
        pathHelper.setDirectionPath(outerShape.path, 1);

        topoByDepth.push({
            pos: [outerShape.path],
            neg: pathsByDepth[0].paths,
            depth: 0
        });

        for (let i = 1; i < pathsByDepth.length - 1; i++) {
            let xor = pathHelper.getXorOfPaths(pathsByDepth[i].paths, pathsByDepth[i + 1].paths);
            let posxor = xor.filter(pathHelper.isPositivePath);
            let negxor = xor.filter(pathHelper.isNegativePath);
            pathHelper.setDirectionPaths(negxor, 1);
            topoByDepth.push({
                pos: posxor,
                neg: negxor,
                depth: pathsByDepth[i].depth
            });
        }

        pathHelper.setDirectionPaths(pathsByDepth[pathsByDepth.length - 1], 1);
        topoByDepth.push({
            pos: [outerShape.path],
            neg: pathsByDepth[pathsByDepth.length - 1].paths,
            depth: pathsByDepth[pathsByDepth.length - 1].depth
        });
        return topoByDepth;
    },

    scaleUpHoles: function(holes){
      for(let i in holes){
            pathHelper.scaleUpPath(holes[i].path);
      }
   },

   scaleDownPathsByDepth:function(pathsByDepth){
       for(let i in pathsByDepth){
             pathHelper.scaleDownPaths(pathsByDepth[i].paths);
       }
   },

   scaleDownTopoByDepth:function(topoByDepth,outerShape){
       pathHelper.scaleDownPath(outerShape.path)
       for(let i=1 ;i<  topoByDepth.length-1;i++){
             pathHelper.scaleDownPaths(topoByDepth[i].pos);
             pathHelper.scaleDownPaths(topoByDepth[i].neg);
       }
   },

    /**
     *  Takes an array of paths representing holes at different depths.
     *  One depth value/ path.
     *  returns an array of paths at each depth: simplify the geometry for each stage.
     */
    getPathsByDepth: function(holes, outerPath) {
        //gets all paths into the bounds of outerPath:
        // pathHelper.fitPathsIntoPath(outerPath.path, holes.map( h=>return h.path));
        /*for(let i in holes){
            if(pathHelper.getXorOfPaths([holes[i].path],[outerPath.path])[0])
            {
            holes[i].path=pathHelper.getInterOfPaths([holes[i].path],[outerPath.path])[0];
            }
        }*/

        //scales up all holes to prevent from int imprecision
        extruder.scaleUpHoles(holes);
        pathHelper.scaleUpPath(outerPath.path);

        //sets all depths deeper than outerDepth  or equals to 0 to outerDepth:
        holes.map(function(elt) {
            (elt.depth > outerPath.depth || elt.depth === 0) ? elt.depth = outerPath.depth: elt.depth = elt.depth
        });

        holes.map(function(elt){ pathHelper.setDirectionPath(elt.path,1);});

        //get all depths:
        let depths = new Set();
        for (let i in holes) {
            depths.add(holes[i].depth);
        }
        depths.add(0);
        depths.add(outerPath.depth);
        depths = Array.from(depths);
        depths.sort(
            function(a, b) {
                return a - b;
            });

        //get paths by depth:
        let res=[];
        for (let i in depths) {
            let pathAtDepth = holes.filter((s) => s.depth >= depths[i]);
            pathAtDepth = pathHelper.simplifyPaths(pathAtDepth.map((s) => s.path));
            //take only the paths of the holes which reach this depth
            res.push({
                paths: pathAtDepth,
                depth: depths[i]
            });
        }
        return res;
    },
};

module.exports = extruder;
