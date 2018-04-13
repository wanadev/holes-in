"use strict";

const holesIn = require("../../lib/index");
const pathHelper = require("../../lib/path-helper")
const BABYLON = require("babylonjs");

const debugger3d = {

    cssclass: "canvas3d",
    options: {inMesh:true, outMesh:true, frontMesh:true, backMesh:true, horizontalMesh:true,
                wireframe:false, backFaceCulling:false,normals:false,swapToBabylon:true, displayNormals:false, lengthU: 100, lengthV: 100, enableTexture: "./assets/cat.png" },

    engine: null,
    scene: null,
    vertexData: null,
    camera: null,
    holes: null,
    outerShape: null,
    doNotBuild: null,
    meshDirty: false,

    updateMesh(){
        const outerShape = debugger3d.outerShape;
        const holes = debugger3d.holes;
        if(!debugger3d.meshDirty){return;}
        if(!holes || !outerShape || !outerShape.path){return;}

        const cpyOptions = JSON.parse(JSON.stringify(debugger3d.options));
        const cpyOut= JSON.parse(JSON.stringify(outerShape));
        const cpyHoles= JSON.parse(JSON.stringify(holes));


        if(debugger3d.options.doNotBuild) {
            const val = debugger3d.toClipperString(document.getElementById("doNotBuild").value);
            debugger3d.pathToEdge(JSON.parse(val));
            cpyOptions.doNotBuild = JSON.parse(JSON.stringify(debugger3d.doNotBuild));
            pathHelper.scaleUpPath(cpyOptions.doNotBuild);
        }
        cpyOptions.mergeVerticalGeometries = false;
        const geom= holesIn.getGeometry(cpyOut,cpyHoles,cpyOptions);

        let geomMerged= holesIn.mergeMeshes([geom.frontMesh, geom.backMesh, geom.inMesh, geom.outMesh,geom.horizontalMesh]);

         let nullMesh= false;
         if(!geomMerged){
             geomMerged={};
             geomMerged.points=[];
             geomMerged.faces=[];
             geomMerged.normals=[];
             geomMerged.uvs=[];
             nullMesh=true;
         }
         debugger3d.meshDirty=false;
         const vertexData = debugger3d.vertexData;
         vertexData.positions = geomMerged.points;
         vertexData.indices = geomMerged.faces;
         vertexData.normals = geomMerged.normals;
         vertexData.uvs = geomMerged.uvs;
         vertexData.applyToMesh(debugger3d.mesh, 1);

         if(nullMesh){return;}
         const material = debugger3d.mesh.material;
         material.wireframe=debugger3d.options.wireframe;
         material.backFaceCulling=debugger3d.options.backFaceCulling;
         if(debugger3d.options.enableTexture) {
           material.ambientTexture = new BABYLON.Texture(debugger3d.options.enableTexture, debugger3d.scene);

         } else {
           material.ambientTexture = null;
         }


         debugger3d.scene.meshes.filter( mesh => mesh.name === "lines"  ).forEach( mesh => mesh.dispose());
         if(debugger3d.options.displayNormals){
             debugger3d.displayNormals(geomMerged);
         }

         debugger3d.updateCamera();
  },

  updateCamera(){
      //updates the camera postion
      debugger3d.mesh.refreshBoundingInfo();
      const boundingSphere = debugger3d.mesh.getBoundingInfo().boundingSphere;
      const center = boundingSphere.maximum.add(boundingSphere.minimum).scale(0.5);
      debugger3d.camera.target = center;
  },

  displayNormals(geom){
       for(let i=0;i<geom.points.length;i+=3){
           const origin = new BABYLON.Vector3(geom.points[i],geom.points[i+1],geom.points[i+2]);
           const norm = new BABYLON.Vector3(geom.normals[i],geom.normals[i+1],geom.normals[i+2]).scale(5);
           const dst= origin.add(norm);
           const lineMesh =new BABYLON.Mesh.CreateLines("lines"+i, [origin ,dst],debugger3d.scene);
       }
   },


  createScene(engine,canvas) {
      const camera = new BABYLON.ArcRotateCamera("camera1",0, 0, 200,new BABYLON.Vector3(0,0,0), debugger3d.scene);
      camera.radius = 200;
      camera.setTarget(new BABYLON.Vector3(0,0,0));
      camera.attachControl(canvas, false);
      debugger3d.camera= camera;

      const light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1,1,1), debugger3d.scene);
      const light2 = new BABYLON.HemisphericLight('light2', new BABYLON.Vector3(-1,-1,0), debugger3d.scene);

      light1.diffuse = new BABYLON.Color3(1, 1, 1);
      light1.specular = new BABYLON.Color3(1, 1, 1);

      light2.diffuse = new BABYLON.Color3(1, 1, 1);
      light2.specular = new BABYLON.Color3(1, 1, 1);

      debugger3d.scene.clearColor = new BABYLON.Color3(0.3,0.3,0.3);

      debugger3d.scene.onPointerDown = function (evt, pickResult) {
        // if the click hits the ground object, we change the impact position
        const  textureCoordinates = pickResult.getTextureCoordinates();
        // console.log("tex ", textureCoordinates, " point ", pickResult.pickedPoint);
    };

  },

  createMesh(){
      const mesh= new BABYLON.Mesh("Mesh", debugger3d.scene);
      mesh.position = BABYLON.Vector3.Zero();
      debugger3d.vertexData = new BABYLON.VertexData();

     const material = new BABYLON.StandardMaterial("mat1",debugger3d.scene);

     material.wireframe= debugger3d.options.wireframe;
     material.backFaceCulling = debugger3d.options.backFaceCulling;
     material.ambientColor= new BABYLON.Color3(0.2,0.7,0.3);
     material.diffuseColor= new BABYLON.Color3(0.2,0.7,0.3);

     mesh.material= material;
     debugger3d.mesh = mesh;
 },

 init() {
        debugger3d.initBabylon();
        debugger3d.initEvents();
 },

  initBabylon(){

      document.querySelectorAll('input').forEach(el =>
          el.checked =debugger3d.options[el.getAttribute("data-target")]);
      const canvas3d= document.getElementById("babylon");
      canvas3d.classList.add("canvas3d");

      setTimeout(() => {
          canvas3d.height = canvas3d.offsetHeight;
          canvas3d.width = canvas3d.offsetWidth;
      }, 200);

        debugger3d.engine = new BABYLON.Engine(canvas3d, true);
        debugger3d.scene = new BABYLON.Scene(debugger3d.engine);
        debugger3d.createScene(debugger3d.engine,canvas3d);
        debugger3d.createMesh();
        debugger3d.engine.runRenderLoop(function() {
          debugger3d.scene.render();
          debugger3d.updateMesh();
        });
  },

  initEvents(){
      ["option", "option3d"].forEach(elementId => {
        [...document.getElementById(elementId).getElementsByTagName('input')].forEach(el => {
            el.addEventListener("change", e => {
                let value = (e.target.checked);
                if (el.getAttribute("data-target") == "enableTexture") {
                    value = "../assets/" + document.getElementById("textureSelect").value;
                }
                debugger3d.options[el.getAttribute("data-target")] = value;
                debugger3d.meshDirty = true;
            });
            el.checked = debugger3d.options[el.getAttribute("data-target")];
        });
      });

      document.getElementById("textureSelect").addEventListener("change", e => {
          const  value = "../assets/" + document.getElementById("textureSelect").value;
          debugger3d.options["enableTexture"] = value;
          debugger3d.meshDirty = true;
      });
      document.addEventListener('resize', function(){
	         debugger3d.engine.resize();
      });
      document.getElementById("babylon").addEventListener('resize', function(){
	         debugger3d.engine.resize();
      });
      document.addEventListener('DOMContentLoaded', function(){
	         setTimeout(() =>debugger3d.engine.resize(), 1000);
      });
  },

  pathToEdge (paths) {
      if (!paths || !paths.length ) return;
      if(!paths[0].length) paths = [paths];
      const doNotBuild = paths;
      const edges = [];

      for (let i = 0; i < doNotBuild.length; i++) {
          const path = doNotBuild[i];
          for (let j = 0; j < path.length; j++) {
              const ptA = path[j];
              const ptB = path[(j + 1) % path.length];
              edges.push([{X:ptA.X,Y:ptA.Y},{X:ptB.X,Y:ptB.Y}]);
          }
      }
      debugger3d.doNotBuild = edges;
  },

  rebuild(outerShape, holes){
      debugger3d.outerShape = JSON.parse(JSON.stringify(outerShape));
      debugger3d.holes = JSON.parse(JSON.stringify(holes));
      debugger3d.meshDirty = true;
  },

  toClipperString(string) {
      return string.replace(/x/g,"X").replace(/y/g, "Y");
  }


};

module.exports = debugger3d;
