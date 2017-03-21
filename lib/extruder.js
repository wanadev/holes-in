"use strict";

const clipperLib = require("clipper-lib");
const pathHelper = require("./path-helper.js");
const geomHelper = require("./geom-helper.js");
const cdt2dHelper = require("./cdt2d-helper.js");
const uvHelper = require("./uv-helper.js");
const exportHelper = require("./export-helper.js");
const babylonHelper = require("./babylon-helper.js");

var extruder = {

    /**
     * returns a mesh from an outer shape and holes
     */
    getGeometry: function(outerShape, holes, options) {
        //get the topology 2D paths by depth
        let colinearPathByDepth= [];
        let pathsByDepth=[];
        let outerShapesByDepth=[];
        let topoPathsByDepth=[];
        // console.log(JSON.stringify(holes));

        extruder.getDataByDepth(outerShape, holes, pathsByDepth, outerShapesByDepth,colinearPathByDepth,topoPathsByDepth);


        //maps vertical paths ( colinear mapping needs vertical mapping)
        uvHelper.mapVertical(outerShapesByDepth, outerShape, options);
        uvHelper.mapColinearPaths(pathsByDepth,outerShape, colinearPathByDepth,options);

        let res = {};
        if (options.frontMesh) {
            res.frontMesh = extruder.getInnerHorizontalGeom(topoPathsByDepth, {
                frontMesh: true
            });
            uvHelper.mapHorizontal(pathsByDepth, outerShape, res.frontMesh, options);
        }
        if (options.backMesh) {
            res.backMesh = extruder.getInnerHorizontalGeom(topoPathsByDepth, {
                backMesh: true
            });
            uvHelper.mapHorizontal(pathsByDepth, outerShape, res.backMesh, options);
        }
        if (options.inMesh) {
            uvHelper.mapVertical(pathsByDepth, outerShape, options);
            // let inMeshHor;
            let inMeshHor = extruder.getInnerHorizontalGeom(topoPathsByDepth, {
                inMesh: true
            });

            let offset = 0;
            if (inMeshHor) {
                uvHelper.mapHorizontal(pathsByDepth, outerShape, inMeshHor, options);
                offset = inMeshHor.offset;
            }

            let inMeshVert = extruder.getInnerVerticalGeom(pathsByDepth, +offset);
            if (inMeshVert) {
                offset=inMeshVert.offset;
            }
            let inMeshVertColinear=extruder.getVerticalColinearOuterGeom(outerShapesByDepth, colinearPathByDepth,offset );

            res.inMesh = geomHelper.mergeMeshes([inMeshHor,inMeshVert], false);
        }

        if (options.outMesh) {
            let outMesh = extruder.getInnerVerticalGeom(outerShapesByDepth, 0,-1,0);
            res.outMesh = outMesh;
        }

        if (options.swapToBabylon) {
            babylonHelper.swapAllToBabylon(res);
        }
        return res;
    },

    getDataByDepth:function(outerShape, holes, pathsByDepth, outerShapesByDepth,colinearPathByDepth,topoPathsByDepth)
    {
         pathsByDepth.push(...extruder.getPathsByDepth(holes, outerShape));
        //gets the outerShape by depth

        let tempOuterShapeByDepth=extruder.getOuterPathsByDepth(pathsByDepth, outerShape);
         topoPathsByDepth.push(...extruder.getTopoPathByDepth(pathsByDepth, tempOuterShapeByDepth,colinearPathByDepth));

        //simplify the outer shape ( as topo path by depth for vertical generation)
        outerShapesByDepth .push(...extruder.simplifyOuterPathsByDepth(tempOuterShapeByDepth));

        extruder.scaleDownHoles(holes);
        extruder.scaleDownTopoByDepth(topoPathsByDepth, outerShape);
        extruder.scaleDownPathsByDepth(pathsByDepth);
        extruder.scaleDownOuterPathsByDepth(outerShapesByDepth);
        //set all paths to positive:
        extruder.setDirectionPaths(pathsByDepth, outerShapesByDepth, topoPathsByDepth);
    },


    getInnerVerticalGeom: function(pathsByDepth, offset = 0,sens=-1,min= 1) {
        let geom = [];
        let boundary={start:pathsByDepth.length - 1, end: 1,inc:-1  };
        // if(sens >0)
        // {
        //     boundary= {start:0,end: pathsByDepth.length-1,inc:1};
        // }
        if(min!=1){boundary.end=min;}

            let indexDepth= boundary.start;
            while(indexDepth!=boundary.end){
        // for (let indexDepth = pathsByDepth.length - 1; indexDepth > 0; indexDepth--) {
            let pathsAtDepth = pathsByDepth[indexDepth].paths;
            //for each point at each path at each depth we look for the corresponding point into the upper paths:
            for (let path of pathsAtDepth) {
                for (let indexPtDwn in path) {
                    let idxPtDwn = indexPtDwn;
                    let idxNPtDwn = ((+indexPtDwn) + 1) % path.length;
                    let currgeom = geomHelper.getOneInnerVerticalGeom(idxPtDwn, idxNPtDwn, +indexDepth, path, pathsByDepth, +offset,sens);
                    if (!currgeom) {
                        continue;
                    }
                    geom.push(currgeom);
                    offset = currgeom.offset;
                }
            }
            indexDepth+=boundary.inc;
        }
        return geomHelper.mergeMeshes(geom, false);
    },

    getVerticalColinearOuterGeom: function(outerShapesByDepth, colinearPathByDepth, offset = 0) {
        let geom=[];
        for (let i in colinearPathByDepth) {
            let paths = colinearPathByDepth[i].paths;
            for (let path of paths) {
                for (let j in path) {
                    if (path[j].colinear) {continue;}
                        let idxPtDwn = +j;
                        let idxNPtDwn = (+j + 1) % path.length;
                        let indexDepth= colinearPathByDepth[i].indexDepth;
                        let currgeom = geomHelper.getOneInnerVerticalGeom(idxPtDwn, idxNPtDwn,indexDepth, path, outerShapesByDepth, +offset);
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
        let innerHorGeom = [];
        for (let i in topoPathsByDepth) {
            let totaltopo = topoPathsByDepth[i].pos.concat(topoPathsByDepth[i].neg);
            trianglesByDepth.push(cdt2dHelper.computeTriangulation(totaltopo));
            trianglesByDepth[i].depth = topoPathsByDepth[i].depth;

        }
        // get points, normal and faces from it:
        let horizontalGeomByDepth = geomHelper.getInnerHorizontalGeom(trianglesByDepth, options, +offset);
        return geomHelper.mergeMeshes(horizontalGeomByDepth, false);
    },


    /**
     * Returns the paths sorted by sens. Negativess paths are holes.
     * Positives paths are the end of holes( solids)
     * For convinience, all paths are set to positive
     */
    getTopoPathByDepth: function(pathsByDepth, outerShapesByDepth,colinearPathByDepth) {
        let topoByDepth = [];
        topoByDepth.push({
            pos: outerShapesByDepth[0].paths,
            neg: pathsByDepth[0].paths,
            depth: 0
        });


        for (let i = 1; i < pathsByDepth.length - 1; i++) {

            //compute xor for inner paths
            let xor = pathHelper.getXorOfPaths(pathsByDepth[i].paths, pathsByDepth[i + 1].paths);
            let posxor = xor.filter(pathHelper.isPositivePath);
            let negxor = xor.filter(pathHelper.isNegativePath);
            //compute xor for outer paths
            xor = pathHelper.getXorOfPaths(outerShapesByDepth[i].paths, outerShapesByDepth[i - 1].paths);
            let posOuter = xor.filter(pathHelper.isPositivePath);
            posxor.push(...posOuter);
            //marks the points which are colinear to the outer shape
            for (let j in posOuter) {
                pathHelper.markAsColinear(posOuter[j], outerShapesByDepth[i].paths);
            }
            colinearPathByDepth.push( {paths: posOuter, depth: pathsByDepth[i].depth, indexDepth: i});
            pathHelper.setDirectionPaths(negxor, 1);
            topoByDepth.push({
                pos: posxor,
                neg: negxor,
                depth: pathsByDepth[i].depth
            });
        }

        pathHelper.setDirectionPaths(pathsByDepth[pathsByDepth.length - 1], 1);
        topoByDepth.push({
            pos: outerShapesByDepth[outerShapesByDepth.length - 1].paths,
            neg: pathsByDepth[pathsByDepth.length - 1].paths,
            depth: pathsByDepth[pathsByDepth.length - 1].depth
        });
        return topoByDepth;
    },

    scaleUpHoles: function(holes) {
        for (let i in holes) {
            pathHelper.scaleUpPath(holes[i].path);
        }
    },

    scaleDownHoles: function(holes) {
        for (let i in holes) {
            pathHelper.scaleDownPath(holes[i].path);
        }
    },
    scaleDownPathsByDepth: function(pathsByDepth) {
        for (let i in pathsByDepth) {
            pathHelper.scaleDownPaths(pathsByDepth[i].paths);
        }
    },
    scaleDownOuterPathsByDepth: function(outerShapesByDepth) {
        for (let i= 0; i<  outerShapesByDepth.length; i++) {
                pathHelper.scaleDownPaths(outerShapesByDepth[i].paths);
        }
    },
    scaleDownTopoByDepth: function(topoByDepth, outerShape) {
        pathHelper.scaleDownPath(outerShape.path)
        for (let i = 1; i < topoByDepth.length - 1; i++) {
            pathHelper.scaleDownPaths(topoByDepth[i].pos);
            pathHelper.scaleDownPaths(topoByDepth[i].neg);
        }
    },
    setDirectionPaths: function(pathsByDepth, outerShapesByDepth, topoPathsByDepth) {
        for (let i in pathsByDepth) {
            pathHelper.setDirectionPaths(pathsByDepth[i].paths, 1);
        }
        for (let i in topoPathsByDepth) {
            pathHelper.setDirectionPaths(topoPathsByDepth[i].pos, 1);
            pathHelper.setDirectionPaths(topoPathsByDepth[i].neg, 1);

        }
        for (let i in outerShapesByDepth) {
            pathHelper.setDirectionPaths(outerShapesByDepth[i].paths, -1);
        }
    },

    getOuterPathsByDepth: function(pathsByDepth, outerShape) {
        let outer = [];
        for (let i in pathsByDepth) {
            outer.push(extruder.getOuterPathsAtDepth(pathsByDepth[i], outerShape));
        }
        return outer;
    },

    simplifyOuterPathsByDepth: function(outerPathsByDepth){
        //gets the differences between outerPaths
        let res= [ outerPathsByDepth[0]];
        for (let i =1; i< outerPathsByDepth.length; i++) {
            res.push({paths: pathHelper.getInterOfPaths(outerPathsByDepth[+i-1].paths, outerPathsByDepth[i].paths),depth:outerPathsByDepth[i].depth});
        }
        return res;
    },

    getOuterPathsAtDepth: function(pathsAtDepth, outerShape) {
        let res = {
            depth: pathsAtDepth.depth,
            paths: [outerShape.path]
        };
        //defines what we eat from the outer shape
        for (let i = 0; i < pathsAtDepth.paths.length; i++) {
            let p = pathsAtDepth.paths[i];
            if (pathHelper.getDiffOfPaths([p], res.paths).length > 0) {
                res.paths = pathHelper.getDiffOfPaths(res.paths, [p]);
                pathHelper.setDirectionPaths(res.paths, 1);

                pathsAtDepth.paths.splice(i);
                i--;
            }
        }
        return res;
    },

    /**
     *  Takes an array of paths representing holes at different depths.
     *  One depth value/ path.
     *  returns an array of paths at each depth: simplify the geometry for each stage.
     */
    getPathsByDepth: function(holes, outerShape) {
        //scales up all holes to prevent from int imprecision

        pathHelper.scaleUpPath(outerShape.path);
        extruder.scaleUpHoles(holes);
        //sets all depths deeper than outerDepth  or equals to 0 to outerDepth:
        holes.map(function(elt) {
            (elt.depth >= outerShape.depth || elt.depth === 0) ? elt.depth = outerShape.depth + 1: elt.depth = elt.depth
        });

        holes.map(function(elt) {
            pathHelper.setDirectionPath(elt.path, 1);
        });

        //get all depths:
        let depths = new Set();
        for (let i in holes) {
            if (holes[i].depth < outerShape.depth)
                depths.add(holes[i].depth);
        }
        depths.add(0);
        depths.add(outerShape.depth);
        depths = Array.from(depths);
        depths.sort(
            function(a, b) {
                return a - b;
            });

        //get paths by depth:
        let res = [];
        for (let i in depths) {
            let pathAtDepth = holes.filter((s) => s.depth > depths[i]);
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
