
let geom1= [{X:50,Y:50},{X:150,Y:50},{X:150,Y:150},{X:50,Y:150}];

let hole1= [{X:0,Y:70},{X:0,Y:90},{X:110,Y:90},{X:110,Y:70}];
let hole2= [{X:70,Y:0},{X:90,Y:0},{X:90,Y:110},{X:70,Y:110}];

let hole3= [{X:80,Y:20},{X:120,Y:20},{X:120,Y:60},{X:80,Y:60}];


let h1 = {path: hole1, depth: 0};
let h2 = {path: hole2, depth: 0};
let h3 = {path: hole3, depth: 50};


let outerShape= {path: geom1, depth: 100};
let baseholes=[h1,h2,h3];
let holes = JSON.parse(JSON.stringify(baseholes));

let holesStr= kzplanToStr('[{"path":[{"x":385.6915861427306,"y":129.76692123037517},{"x":535.5646081097426,"y":129.76692123037517},{"x":535.5646081097426,"y":329.76692123037503},{"x":377.69158614273067,"y":409.76692123037515}],"depth":50},{"path":[{"x":260.7195529429974,"y":-28.138723316616954},{"x":460.71955294299727,"y":-28.138723316616954},{"x":460.71955294299727,"y":171.86127668338307},{"x":260.7195529429974,"y":171.86127668338307}],"depth":200}]')
let outStr=  kzplanToStr('{"path":[{"x":-143,"y":-584.34},{"x":-177.72,"y":-584.34},{"x":-231.32,"y":-584.34},{"x":-213.18,"y":201.65},{"x":573.15,"y":201.65},{"x":573.15,"y":-584.34}],"depth":99}');

// outerShape= JSON.parse(outStr);
// holes= JSON.parse(holesStr);
// scalePaths(holes,outerShape)

let colors= ["#c02525","#84c025","#8d4ead"];
let camera;
let point0= {X:0,Y:0};
let angle=0;
let dirty=true;

let vertexData;
let mesh;
let material;
let texture;
let options= {inMesh:true, outMesh:true, frontMesh:false, backMesh:false,
            wireframe:false, backFaceCulling:false,normals:false,
            animate: false,isoRatioUV:true,swapToBabylon:true,
            };

let meshDirty=true;

/*
function scalePaths(holes,outerShape){
    let scale=1;
    for(let i in holes)
    {
        for(let j in holes[i].path)
        {
            holes[i].path[j].X/=scale;
            holes[i].path[j].Y/=scale;
        }
    }
    for(let j in outerShape)
    {
        outerShape[j].X/=scale;
        outerShape[j].Y/=scale;
    }
}*/

function kzplanToStr(str1){
    let upX= str1.replace(/x/g,"X");
    let upY= upX.replace(/y/g,"Y");
    return upY
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

  let geom= holesIn.getGeometry(outerShape,holes,options,options);
  let geomMerged= holesIn.mergeMeshes([geom.frontMesh, geom.backMesh, geom.inMesh, geom.outMesh]);
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

function animateDepth(baseDepth,hole, min,max ){
        hole.depth=  baseDepth+ Math.cos(angle)*(max-min)+min;
}

function animateScale(basePath, path, direction,min,max){
    let scale= Math.cos(angle)* (max-min)+min;
    for(let i in path){
        path[i][direction]= basePath[i][direction]*scale;
    }
}


function createScene(engine,scene,canvas) {
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
function createMesh(scene){
    mesh= new BABYLON.Mesh("DemoMesh", scene);
    mesh.position = BABYLON.Vector3.Zero();
     vertexData = new BABYLON.VertexData();

   material = new BABYLON.StandardMaterial("mat1",scene);
   // material.diffuseColor= new BABYLON.Color3(0/255,73/255,79/255);
   // material.ambientColor= new BABYLON.Color3(0/255,73/255,79/255);
   // material.specularColor= new BABYLON.Color3(0/255,73/255,79/255);


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
