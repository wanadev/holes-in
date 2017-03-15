---
title: Home
menuOrder: 0
autotoc: false
---

> A javascript library to generate 3D mesh from a 2D outer path and 2D inner paths.

## Getting started:
<<<<<<< HEAD
First you need to include holesIn library into your html code:

```html
 <script src="./holes-in.min.js"></script>
```

Then you will need to define the outer shape of your mesh and the holes you want to dig into:
```javascript
 let out= {path: [{X:10,Y:10},{X:110,Y:10},{X:110,Y:110},{X:10,Y:110}],depth:100};
 let hole1= {path: [{X:50,Y:50},{X:50,Y:90},{X:100,Y:90},{X:100,Y:50}],depth:0};
```
Holes and depth are represented by the same structure: a path and a depth. The depth of the out path represents the height of the final mesh. For a hoel, a 0 depth means the hole will be dug throughout the mesh.


Let's define some holes to dig into our mesh:
```javascript

```



Let's define the options
```javascript
let options= {inMesh:true, outMesh:true, frontMesh:true, backMesh:true};
```



## Usage:

## Not supported yet:

TODO: Bevel
TODO: UV generation
=======

First you need to include holesIn library into your html code:

```javascript
<script src="./holes-in.min.js"></script>
```

### 1 Define your shape and holes


Holes and depth are represented by the same structure: a path and a depth. The depth of the out path represents the height of the final mesh.


A hole with a 0 depth will be dug throughout the mesh.
```javascript
let out= {path: [{X:10,Y:10},{X:110,Y:10},{X:110,Y:110},{X:10,Y:110}],depth:100};
let hole1= {path: [{X:50,Y:50},{X:50,Y:100},{X:100,Y:100},{X:100,Y:50}],depth:0};
 ```

### 2 Choose your options
You can choose to build all the mesh or only a part of it. Please check-out the DEMO for more details.
 ```javascript
let options= {inMesh:true, outMesh:true, frontMesh:true, backMesh:true};
```

### 3 Generate your mesh
```javascript
let geom= holesIn.getGeometry(outerShape,holes,options);
```

### 4 Merge it
If you want to merge the meshes into a single one, nothing is simpler:
```javascript
let mergedMesh= holesIn.mergeMeshes([geom.frontMesh, geom.backMesh, geom.inMesh, geom.outMesh]);
 ```

### 4 Export it
 You can also export your mesh to obj format:
 ```javascript
let obj = holesIn.meshesToObj(geom);
  ```

### 4 Display it in BABYLON js

 ```javascript
let mesh= new BABYLON.Mesh("DemoMesh", scene);
let vertexData = new BABYLON.VertexData();
let geom= holesIn.getGeometry(outerShape,holes,options);
let mergedGeometry= holesIn.mergeMeshes([geom.frontMesh, geom.backMesh, geom.inMesh, geom.outMesh]);
vertexData.positions = mergedGeometry.points;
vertexData.indices = mergedGeometry.faces;
vertexData.normals = mergedGeometry.normals;
vertexData.applyToMesh(mesh, 1);
```


## Not supported yet:
TODO: Bevel

TODO: UV generation

TODO: Support holes that modifies the outer geometry
