
const BABYLON  = require("./babylon.js")
let getholes = require("../holes.js");

let options= {inMesh:false, outMesh:true, frontMesh:false, backMesh:false, horizontalMesh:false,
            wireframe:false, backFaceCulling:false,normals:false,
            animate: false,isoRatioUV:true,swapToBabylon:true,displayNormals:true
            };

let baseholes, holes, outerShape;
getData("getTestPaths", 0);
// options.doNotBuild = JSON.parse(JSON.stringify([outerShape.path]));
// getholes.doNotBuild(options);


let colors= ["#c02525","#84c025","#8d4ead"];
let camera;
let point0= {X:0,Y:0};
let angle=0;
let dirty=true;

let scene;
let vertexData;
let mesh;
let material;
let texture;
let meshDirty=true;
let normalDisplay;


function getData(func, index) {
    const test = getholes[func]()[index];
    baseholes = JSON.parse(JSON.stringify(test.holes));
    outerShape = JSON.parse(JSON.stringify(test.outerShape));
}


function displayPaths(canvas){
    // if(!dirty) return;
    let ctx= canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

   holesIn.drawPath(ctx, outerShape.path,point0 ,"#00494f");
   for(let i in holes){
       holesIn.drawPath(ctx ,holes[i].path,point0 ,colors[i]);
   }

   dirty=false;

}

function animatePaths(){

    if(options.animate)
    {
        for(let i in holes)
        {
            if(i%3==0){
                movePath(baseholes[i].path,holes[i].path,-10,100, "X");
                //  animateScale(baseholes[i].path,holes[i].path, "X",1.0,1.5);
            }
            else if (i%3==1){
                movePath(baseholes[i].path,holes[i].path,-10,100, "Y");
                // animateScale(baseholes[i].path,holes[i].path, "Y",1.0,1.5);

            }
            else{
                movePath(baseholes[i].path,holes[i].path,20,100, "Y");
            }

        }
        angle+=0.01;
        if(angle>2*Math.PI){
            angle=0;
        }
        meshDirty=true;
    }
}

function updateMesh(){

if(!meshDirty){return;}
    if(!holes){ holes  = JSON.parse(JSON.stringify(baseholes));}

 let cpyOut= JSON.parse(JSON.stringify(outerShape));
 let cpyIn= JSON.parse(JSON.stringify(holes));
 console.log("options",options);
  let geom= holesIn.getGeometry(cpyOut,cpyIn,options,options);
  const geomCpy = JSON.parse(JSON.stringify(geom));
  console.log("geom: ",geomCpy);
  if(geomCpy.frontMesh) console.log("front: ",geomCpy.frontMesh.faces.length);
  if(geomCpy.backMesh) console.log("back: ",geomCpy.backMesh.faces.length);
  if(geomCpy.outMesh) console.log("out: ",geomCpy.outMesh.faces.length);
  if(geomCpy.inMesh) console.log("in: ",geomCpy.inMesh.faces.length);
  if(geomCpy.horizontalMesh) console.log("horr: ",geomCpy.horizontalMesh.faces.length);


  let geomMerged= holesIn.mergeMeshes([geom.frontMesh, geom.backMesh, geom.inMesh, geom.outMesh,geom.horizontalMesh]);
  console.log("geomMerged", geomMerged);
  let nullMesh= false;
  if(!geomMerged){
      geomMerged={};
      geomMerged.points=[];
      geomMerged.faces=[];
      geomMerged.normals=[];
      geomMerged.uvs=[];
      nullMesh=true;
  }
  meshDirty=false;
  vertexData.positions = geomMerged.points;
  vertexData.indices = geomMerged.faces;
  vertexData.normals = geomMerged.normals;
  vertexData.uvs = geomMerged.uvs;
  vertexData.applyToMesh(mesh, 1);

  if(nullMesh){return;}
  material.wireframe=options.wireframe;
  material.backFaceCulling=options.backFaceCulling;
  if(!material.diffuseTexture){
      material.diffuseTexture =texture;
  }
  mesh.material= material;

/*
  scene.meshes.filter( mesh => mesh.name === "lines"  ).forEach( mesh => mesh.dispose());
  if(options.displayNormals)
   displayNormals(geomMerged);*/
}

function displayNormals(geom){
    for(let i=0;i<geom.points.length;i+=3){
        let origin = new BABYLON.Vector3(geom.points[i],geom.points[i+1],geom.points[i+2]);
        let norm = new BABYLON.Vector3(geom.normals[i],geom.normals[i+1],geom.normals[i+2]).scale(100);
        let dst= origin.add(norm);
        var lineMesh =new BABYLON.Mesh.CreateLines("lines"+i, [origin ,dst],scene);
    }

}

function movePath(basePath, path,min,max, direction){
    let realOffset= (max+min)/4;

    let offset= Math.cos(angle)* (realOffset )+realOffset;
    if(direction==="X"){
        for(let i in path){
                path[i].X=basePath[i].X +offset;
        }
    }
    else if(direction==="Y")
    {
        for(let i in path){
                path[i].Y=basePath[i].Y +offset;
        }
    }
    else
    {
        for(let i in path){
                path[i].X=basePath[i].X +offset;
                path[i].Y=basePath[i].Y +offset;
        }
    }
}

function animateDepth(baseDepth,hole, min,max ){
        hole.depth=  baseDepth+ Math.cos(angle)*(max-min)+min;
}

function animateScale(basePath, path, direction,min,max){
    let scale= Math.cos(angle)* (max-min)+min;
    for(let i in path){
        path[i][direction]= basePath[i][direction]*scale;
    }
}


function createScene(engine,canvas) {
  camera= new BABYLON.ArcRotateCamera("camera1",0, 0, 200,new BABYLON.Vector3(0,0,0), scene);
  camera.radius = 200;
  camera.setTarget(new BABYLON.Vector3(100,-50,-100));
  camera.attachControl(canvas, false);

  var light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1,1,1), scene);
  var light2 = new BABYLON.HemisphericLight('light2', new BABYLON.Vector3(-1,-1,0), scene);

  light1.diffuse = new BABYLON.Color3(1, 1, 1);
  light1.specular = new BABYLON.Color3(1, 1, 1);

  light2.diffuse = new BABYLON.Color3(1, 1, 1);
  light2.specular = new BABYLON.Color3(1, 1, 1);

  scene.clearColor = new BABYLON.Color3(0/255,73/255,79/255);

  scene.onPointerDown = function (evt, pickResult) {
    // if the click hits the ground object, we change the impact position
    var textureCoordinates = pickResult.getTextureCoordinates();
    console.log("tex ", textureCoordinates, " point ", pickResult.pickedPoint);
};

  return scene;
}
function createMesh(){
    mesh= new BABYLON.Mesh("DemoMesh", scene);
    mesh.position = BABYLON.Vector3.Zero();
     vertexData = new BABYLON.VertexData();

   material = new BABYLON.StandardMaterial("mat1",scene);

   material.wireframe=options.wireframe;
   material.backFaceCulling = options.backFaceCulling;

   texture= new BABYLON.Texture("./images/damier.jpg", scene);
   material.diffuseTexture= texture;
   mesh.material= material;
}

function initBabylon(){

    document.querySelectorAll('input').forEach(el =>
        el.checked =options[el.getAttribute("data-target")]);

    let canvas2d= document.getElementById("paths");
    canvas2d.getContext("2d").translate(50,50);

    let canvas3d= document.getElementById("babylon");
    center= {X: canvas2d.width/2, Y:canvas2d.height/2};

      var engine = new BABYLON.Engine(canvas3d, true);
      scene = new BABYLON.Scene(engine);
      createScene(engine,canvas3d);
      createMesh(scene);
       initEvents();
      engine.runRenderLoop(function() {
        scene.render();

        animatePaths();
        displayPaths(canvas2d);
        updateMesh();
      });
}

function initEvents(){

    [...document.querySelectorAll('input')].forEach(el =>
        el.addEventListener("change", e => {options[el.getAttribute("data-target")] = (e.target.checked);
        meshDirty=true;
        })
    );
}

window.addEventListener('load', init, false );

function init() {
  initBabylon();
}