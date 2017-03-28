

// outerShape= JSON.parse(outStr);
// holes= JSON.parse(holesStr);
// holes.push(h4);
// scalePaths(holes,outerShape);

// holes= JSON.parse('[{"path":[{"X":536.8632264172003,"Y":-461.2129629284003},{"X":736.8632264172003,"Y":-461.2129629284003},{"X":736.8632264172003,"Y":-261.2129629284003},{"X":535.2527164172003,"Y":-232.2237829284003}],"depth":100},{"path":[{"X":422.7385581727999,"Y":-164.13585162677055},{"X":671.0538581727997,"Y":-165.74636162677055},{"X":748.3583381727997,"Y":22.980068373229468},{"X":422.7385581727999,"Y":35.864148373229455}],"depth":100}]');
outerShape= JSON.parse('{"path":[{"X":-1612.59,"Y":-155.8},{"X":-1585.46,"Y":1065.19},{"X":62.96,"Y":1028.56},{"X":-2.14,"Y":-191.58}],"depth":100}');

holes= JSON.parse('[{"path":[{"X":-1049.2808396720457,"Y":729.698597085507},{"X":-388.808787212524,"Y":714.9656378557928},{"X":-836.7275857877936,"Y":1156.6292266055166},{"X":-1036.7275857877933,"Y":1156.6292266055166}],"depth":100},{"path":[{"X":-512.8365366371643,"Y":786.1703991813754},{"X":-312.8365366371643,"Y":810.2260189268427},{"X":-312.8365366371643,"Y":1010.2260189268427},{"X":-512.8365366371643,"Y":1010.2260189268427}],"depth":100}]');
// outerShape= { path: [ {X:50,Y:50}, {X:150,Y:50}, {X:150,Y:150}, {X:50,Y:150} ], depth:100};
//
// var inHole1= { path: [{X:70,Y:70},{X:70,Y:90},{X:90,Y:90},{X:90,Y:70}], depth: 50 };
//
// var inHole2= { path: [{X:75,Y:75},{X:75,Y:90},{X:105,Y:90},{X:105,Y:75}], depth: 0 };
//
// var outHole1= { path: [{X:75,Y:60},{X:75,Y:180},{X:100,Y:180},{X:100,Y:60}], depth: 50 };
// holes= [inHole1];



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
let options= {inMesh:true, outMesh:true, frontMesh:true, backMesh:true,
            wireframe:false, backFaceCulling:false,normals:false,
            animate: false,isoRatioUV:true,swapToBabylon:true,
            };

let meshDirty=true;
let normalDisplay;


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


    let cpyOut= JSON.parse(JSON.stringify(outerShape));
    let cpyIn= JSON.parse(JSON.stringify(holes));
  let geom= holesIn.getGeometry(cpyOut,cpyIn,options,options);
  let geomMerged= holesIn.mergeMeshes([geom.frontMesh, geom.backMesh, geom.inMesh, geom.outMesh]);
  console.log(geom, geomMerged);
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

  // displayNormals(geomMerged);

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
