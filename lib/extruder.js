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
    getGeometry: function(outerShape, holes, options= {inMesh:true, outMesh:true, frontMesh:true, backMesh:true}) {
        //get the topology 2D paths by depth
        let data = extruder.getDataByDepth(outerShape, holes);
        let outerPathsByDepth= data.outerPathsByDepth;
        let innerPathsByDepth= data.innerPathsByDepth;
        let horrizontalPathsByDepth= data.horrizontalPathsByDepth;


        uvHelper.mapVertical(outerPathsByDepth, outerShape, options);

        let res = {};

        if (options.frontMesh) {
            res.frontMesh = extruder.getHorrizontalGeom(horrizontalPathsByDepth,[0],0);
            uvHelper.mapHorrizontal(innerPathsByDepth, outerShape, res.frontMesh, options);
        }
        if (options.backMesh) {
            res.backMesh = extruder.getHorrizontalGeom(horrizontalPathsByDepth,[horrizontalPathsByDepth.length-1],0,false );
            uvHelper.mapHorrizontal(innerPathsByDepth, outerShape, res.backMesh, options);
        }
        if (options.inMesh) {
            uvHelper.mapVertical(innerPathsByDepth, outerShape, options);
            let indexes= [];
            for(let i =1; i< horrizontalPathsByDepth.length-1;i++){
                indexes.push(i);
            }
            let inMeshHor = extruder.getHorrizontalGeom(horrizontalPathsByDepth,indexes,0);

            let offset = 0;
            if (inMeshHor) {
                uvHelper.mapHorrizontal(innerPathsByDepth, outerShape, inMeshHor, options);
                offset = inMeshHor.offset;
            }

            let inMeshVert = extruder.getVerticalGeom(innerPathsByDepth, +offset,true);
            if (inMeshVert) {
                offset=inMeshVert.offset;
            }

            res.inMesh = geomHelper.mergeMeshes([inMeshHor,inMeshVert], false);
        }
        if (options.outMesh) {
            let outMesh = extruder.getVerticalGeom(outerPathsByDepth, 0,false);
            res.outMesh = outMesh;
        }



        if (options.swapToBabylon) {
            babylonHelper.swapAllToBabylon(res);
        }
        return res;
    },

    getVerticalGeom: function(innerPathsByDepth, offset = 0,invertNormal = false) {
        let geom = [];

        for (let indexDepth = innerPathsByDepth.length - 1; indexDepth > 0; indexDepth--) {
            let pathsAtDepth = innerPathsByDepth[indexDepth].paths;
            //for each point at each path at each depth we look for the corresponding point into the upper paths:
            for (let i  in pathsAtDepth) {
                const path = pathsAtDepth[i];
                for (let indexPtDwn in path) {
                    let idxPtDwn = indexPtDwn;
                    let idxNPtDwn = ((+indexPtDwn) + 1) % path.length;
                    let currgeom = geomHelper.getOneVerticalGeom(idxPtDwn, idxNPtDwn, +indexDepth, path, innerPathsByDepth, +offset,invertNormal);
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
     getHorrizontalGeom: function(horrizontalPathsByDepth,indexes, offset = 0,invertNormal=true) {
         let horrGeom = [];
         for (let i in indexes) {
             let totaltopo = horrizontalPathsByDepth[indexes[i]].paths;
             let triangles= cdt2dHelper.computeTriangulation(totaltopo);
              triangles.depth = horrizontalPathsByDepth[indexes[i]].depth;
             let horrGeomAtDepth = geomHelper.getHorrizontalGeom(triangles, offset = 0,invertNormal);
             horrGeom.push(horrGeomAtDepth)
         }
         // get points, normal and faces from it:
         return geomHelper.mergeMeshes(horrGeom, false);
     },


    getDataByDepth: function(outerShape,holes){
        let outerPaths=[];
        let innerPaths=[];
        let horrizontalPaths=[];

        pathHelper.scaleUpPath(outerShape.path);
        for(let i in holes){
            pathHelper.scaleUpPath(holes[i].path);
        }
        let holesByDepth= extruder.getHolesByDepth(holes,outerShape);
        let outer= [outerShape.path];
        let stack=0;
        for(let i= holesByDepth.length-1;i>=0;i-- ){
            //compute the outer path:
            let removeFromOuter= pathHelper.getUnionOfPaths(holesByDepth[i].keep.concat(holesByDepth[i].stop));

            outer= pathHelper.getDiffOfPaths(outer, removeFromOuter);
            outer=pathHelper.simplifyPaths(pathHelper.getUnionOfPaths(outer))
            outerPaths.push(outer);

            //fit the inner paths into the outer:
            let innerPath= pathHelper.getInterOfPaths(holesByDepth[Math.max(i-1, 0)].keep, outer );
            innerPath= pathHelper.simplifyPaths(pathHelper.getUnionOfPaths(innerPath));
            innerPaths.push(innerPath);
            //computes the horrizontal Geom:
            let horrizontalPath;
             if(i===0 || i===holesByDepth.length-1){
                 horrizontalPath = JSON.parse(JSON.stringify(outer.concat(innerPath)));
             }else{

                let horrizontalPathOut = pathHelper.getDiffOfPaths(outerPaths[Math.max(stack-1,0)],outerPaths[stack]);
                let horrizontalPathIn = pathHelper.getUnionOfPaths(holesByDepth[i].stop);
                horrizontalPath = pathHelper.getUnionOfPaths(horrizontalPathOut, horrizontalPathIn);
                horrizontalPath = pathHelper.getDiffOfPaths(horrizontalPath, holesByDepth[i].keep);
             }
            horrizontalPaths.push(horrizontalPath);
            stack++;
        }

        for(let i in outerPaths){

            pathHelper.setDirectionPaths(outerPaths[i],-1);
            pathHelper.setDirectionPaths(innerPaths[i],-1);
            pathHelper.setDirectionPaths(horrizontalPaths[i],1);
            pathHelper.scaleDownPaths(outerPaths[i]);
            pathHelper.scaleDownPaths(innerPaths[i]);

            outerPaths[i] = pathHelper.simplifyPaths(outerPaths[i]);
            innerPaths[i] = pathHelper.simplifyPaths(innerPaths[i]);
            horrizontalPaths[i] = pathHelper.simplifyPaths(horrizontalPaths[i]);
        }
        pathHelper.scaleDownPath(outerShape.path);

        for(let i in holes){
            if(!holes[i].path){continue;}
            pathHelper.scaleDownPath(holes[i].path);
        }

        outerPaths= outerPaths.reverse();
        innerPaths= innerPaths.reverse();
        horrizontalPaths= horrizontalPaths.reverse();


        for(let i in holesByDepth){
            outerPaths[i]= {paths: outerPaths[i], depth:holesByDepth[i].depth};
            innerPaths[i]= {paths: innerPaths[i], depth:holesByDepth[i].depth};
            horrizontalPaths[i]= {paths: horrizontalPaths[i], depth:holesByDepth[i].depth};

        }
        return {  outerPathsByDepth : outerPaths,
                  innerPathsByDepth: innerPaths,
                  horrizontalPathsByDepth: horrizontalPaths};



    },

    /**
     *  Takes an array of paths representing holes at different depths.
     *  One depth value/ path.
     *  returns an array of paths at each depth: simplify the geometry for each stage.
     */
    getHolesByDepth: function(holes, outerShape) {

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

        //fit paths into outer:
        for(let i in holes){
            holes[i].path = pathHelper.getInterOfPaths([holes[i].path],[outerShape.path] )[0];
        }
        //filter:
        holes = holes.filter( hole => hole.path !== undefined);
        for(let i in holes){
                pathHelper.displaceColinearEdges(outerShape.path, holes[i].path);
        }

        //get paths by depth:
        let res = [];
        for (let i in depths) {
            let deeperHoles = holes.filter((s) => s.depth > depths[i]);
            let keep=[];
            deeperHoles.map((s) => keep.push(s.path));

            let stopHoles = holes.filter((s) => s.depth === depths[i]);
            let stop=[];
            stopHoles.map((s) => stop.push(s.path));

            //take only the paths of the holes which reach this depth
            res.push({
                keep: keep,
                stop: stop,
                depth: depths[i],
            });
        }
        return res;
    },


};

module.exports = extruder;
