"use strict";

const holesIn = require("../../lib/index.js");
const BABYLON = require("babylonjs");

const debugger3d = {

    cssclass: "canvas3d",
    options: {inMesh:true, outMesh:true, frontMesh:true, backMesh:true, horizontalMesh:true,
                wireframe:false, backFaceCulling:false,normals:false,swapToBabylon:true, displayNormals:false},

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
        if(!holes || !outerShape || !outerShape.path || !holes[0] || !holes[0].path){return;}

        let cpyOptions = JSON.parse(JSON.stringify(debugger3d.options));
        let cpyOut= JSON.parse(JSON.stringify(outerShape));
        let cpyHoles= JSON.parse(JSON.stringify(holes));
        let cpyDoNotBuild= JSON.parse(JSON.stringify(holes));


        if(debugger3d.options.doNotBuild) {
            const val = debugger3d.toClipperString(document.getElementById("doNotBuild").value);
            debugger3d.pathToEdge(JSON.parse(val));
            cpyOptions.doNotBuild = JSON.parse(JSON.stringify(debugger3d.doNotBuild));
            holesIn.scaleUpPath(cpyOptions.doNotBuild);
        }

        let geom= holesIn.getGeometry(cpyOut,cpyHoles,cpyOptions);

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
           let origin = new BABYLON.Vector3(geom.points[i],geom.points[i+1],geom.points[i+2]);
           let norm = new BABYLON.Vector3(geom.normals[i],geom.normals[i+1],geom.normals[i+2]).scale(100);
           let dst= origin.add(norm);
           var lineMesh =new BABYLON.Mesh.CreateLines("lines"+i, [origin ,dst],debugger3d.scene);
       }
   },


  createScene(engine,canvas) {
      const camera = new BABYLON.ArcRotateCamera("camera1",0, 0, 200,new BABYLON.Vector3(0,0,0), debugger3d.scene);
      camera.radius = 200;
      camera.setTarget(new BABYLON.Vector3(0,0,0));
      camera.attachControl(canvas, false);
      debugger3d.camera= camera;

      var light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1,1,1), debugger3d.scene);
      var light2 = new BABYLON.HemisphericLight('light2', new BABYLON.Vector3(-1,-1,0), debugger3d.scene);

      light1.diffuse = new BABYLON.Color3(1, 1, 1);
      light1.specular = new BABYLON.Color3(1, 1, 1);

      light2.diffuse = new BABYLON.Color3(1, 1, 1);
      light2.specular = new BABYLON.Color3(1, 1, 1);

      debugger3d.scene.clearColor = new BABYLON.Color3(0.3,0.3,0.3);

      debugger3d.scene.onPointerDown = function (evt, pickResult) {
        // if the click hits the ground object, we change the impact position
        var textureCoordinates = pickResult.getTextureCoordinates();
        console.log("tex ", textureCoordinates, " point ", pickResult.pickedPoint);
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

      let canvas3d= document.getElementById("babylon");
      canvas3d.classList.add(debugger3d.cssclass);
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
      [...document.getElementById('option').getElementsByTagName('input')].forEach(el =>
          {
              el.addEventListener("change", e => {
                  debugger3d.options[el.getAttribute("data-target")] = (e.target.checked);
                  debugger3d.meshDirty=true;
              });
              el.checked = debugger3d.options[el.getAttribute("data-target")];
          }
      );
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
