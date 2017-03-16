
let geom1= [{X:0,Y:0},{X:200,Y:0},{X:200,Y:200},{X:0,Y:200}];

let hole1= [{X:40,Y:40},{X:40,Y:90},{X:120,Y:90},{X:120,Y:40}];
let hole2= [{X:20,Y:20},{X:20,Y:100},{X:100,Y:100},{X:100,Y:20}];
let hole3= [{X:15,Y:20},{X:80,Y:20},{X:80,Y:50},{X:15,Y:50}];

let h1 = {path: hole1, depth: 150};
let h2 = {path: hole2, depth: 0};
let h3 = {path: hole3, depth: 75};


let outerShape= {path: geom1, depth: 180};
let baseholes=[];

let holes = JSON.parse(JSON.stringify(baseholes));
let colors= ["#c02525","#84c025","#8d4ead"];
let camera;
let point0= {X:0,Y:0};
let angle=0;
let dirty=true;

let vertexData;
let mesh;
let material;
let texture;
let options= {inMesh:true, outMesh:true, frontMesh:true, backMesh:true,
            wireframe:false, backFaceCulling:false,normals:false,
            animate: true,isoRatioUV:true
            };

let meshDirty=true;

function displayPaths(canvas){
    // if(!dirty) return;
    let ctx= canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

   holesIn.drawPath(ctx, outerShape.path,point0 ,"#00494f");
   for(let i in holes){
       holesIn.drawPath(ctx ,holes[i].path,point0 ,colors[i]);
   }
   // dirty=false;

}

function animatePaths(){

    if(options.animate)
    {
        for(let i in holes)
        {
            if(i%3==0){
                movePath(baseholes[i].path,holes[i].path,10,100, "X");
            }
            else if (i%3==1){
                movePath(baseholes[i].path,holes[i].path,50,120, "Y");
            }
            else{
                    movePath(baseholes[i].path,holes[i].path,20,150, "XY");
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

  let geom= holesIn.getGeometry(outerShape,holes,options,options);
  let geomMerged= holesIn.mergeMeshes([geom.frontMesh, geom.backMesh, geom.inMesh, geom.outMesh]);
  let nullMesh= false;
  if(!geomMerged){
      geomMerged={};
      geomMerged.points=[];
      geomMerged.faces=[];
      geomMerged.normals=[];
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


}

function movePath(basePath, path,min,max, direction){
    let realOffset= (max+min)/4;

    let offset= Math.cos(angle)* (realOffset )+realOffset;
    if(direction==="X"){
        for(let i in path){
                path[i].X=basePath[i].X +offset;
                // console.log(path[i].X);
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


function createScene(engine,scene,canvas) {
  camera= new BABYLON.ArcRotateCamera("camera1",-1.32483, 1.2899, 500,new BABYLON.Vector3(0,0,0), scene);
  camera.radius = 200;
  camera.setTarget(new BABYLON.Vector3(100,100,100));
  camera.attachControl(canvas, false);

  var light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), scene);
  var light2 = new BABYLON.HemisphericLight('light2', new BABYLON.Vector3(1,0,0), scene);

  light1.diffuse = new BABYLON.Color3(1, 1, 1);
  light1.specular = new BABYLON.Color3(1, 1, 1);

  light2.diffuse = new BABYLON.Color3(1, 1, 1);
  light2.specular = new BABYLON.Color3(1, 1, 1);

  scene.onPointerDown = function (evt, pickResult) {
    // if the click hits the ground object, we change the impact position
    var textureCoordinates = pickResult.getTextureCoordinates();
    console.log("tex ", textureCoordinates, " point ", pickResult.pickedPoint);
};

  return scene;
}
function createMesh(scene){
    mesh= new BABYLON.Mesh("DemoMesh", scene);
    mesh.position = BABYLON.Vector3.Zero();
     vertexData = new BABYLON.VertexData();

   material = new BABYLON.StandardMaterial("mat1",scene);
   material.diffuseColor= new BABYLON.Color3(0/255,73/255,79/255);
   material.ambientColor= new BABYLON.Color3(0/255,73/255,79/255);
   material.specularColor= new BABYLON.Color3(0/255,73/255,79/255);


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
    let canvas3d= document.getElementById("babylon");
    center= {X: canvas2d.width/2, Y:canvas2d.height/2};

      var engine = new BABYLON.Engine(canvas3d, true);
      var scene = new BABYLON.Scene(engine);
      createScene(engine,scene,canvas3d);
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
