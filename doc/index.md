---
title: Basics
---


> A javascript library to generate 3D mesh from a 2D outer path and 2D inner paths.


## Demo:
<a href="https://wanadev.github.io/holes-in/debug/index.html">Please visit the demo here</a>


## Usage:

First you need to include holesIn library into your html code:

```html
 <script src="./holes-in.min.js"></script>
```

### 1 Define your shape and holes


Holes and depth are represented by the same structure: a path and a depth. The depth of the out path represents the height of the final mesh.


A hole with a 0 depth will be dug throughout the mesh.
```javascript
const out= { path: [ { X: 10, Y: 10 }, { X: 110, Y: 10 }, { X: 110, Y: 110 }, { X: 10, Y: 110 } ], depth: 100 };
const holes= [ { path: [{ X: 50, Y: 50 }, { X: 50, Y: 100 }, { X: 100, Y: 100 }, { X: 100, Y: 50 } ], depth: 0 } ];
 ```

### 2 Choose your options
You can choose to build all the mesh or only a part of it. Please check-out the DEMO for more details.
 ```javascript
const options= { inMesh: true, outMesh: true, frontMesh: true, backMesh: true, horizontalMesh: true };
```

### 3 Generate your mesh
```javascript
const geom= holesIn.getGeometry(outerShape, holes, options);
```

### 4 Merge it
If you want to merge the meshes into a single one, nothing is simpler:
```javascript
const mergedMesh= holesIn.mergeMeshes([geom.frontMesh, geom.backMesh, geom.inMesh, geom.outMesh]);
```

### 5 Display it in BABYLON js

 ```javascript
const mesh= new BABYLON.Mesh("DemoMesh", scene);
const vertexData = new BABYLON.VertexData();
const geom= holesIn.getGeometry(outerShape, holes, options);
const mergedGeometry= holesIn.mergeMeshes([geom.frontMesh, geom.backMesh, geom.inMesh, geom.outMesh, geom.horizontalMesh]);
vertexData.positions = mergedGeometry.points;
vertexData.indices = mergedGeometry.faces;
vertexData.normals = mergedGeometry.normals;
vertexData.applyToMesh(mesh, 1);
```

### Debug

You can generate a link to the DEMO page by passing the **debug = true** option to getGeometry.


## API

Holes-in provides two functions

- **getGeometry**
- **mergeMeshes**

You can test all options on the DEMO page.

### getGeometry API

The avaliable options are:

- **frontMesh** *Boolean* generates the front mesh or not
- **backMesh** *Boolean* generates the back mesh or not
- **inMesh** *Boolean* generates the inner mesh or not
- **outMesh** *Boolean* generates the outer mesh or not
- **horizontalMesh** *Boolean* generates the horizontal mesh or not
- **doNotBuild** *Array* an array of segments that will not be build onto vertical geometries
- **mergeVerticalGeometries** *Boolean* If false, inMesh and outMesh will contain an array of meshes, containing one element per path semgent.
- **debug** *Boolean* If true, holes-in will console.log a link to the demo page with your parametters.
- **lengthU** *Number* If set, uvs will be mapped in such a way that [0;1] texture will fit into [0; lengthU] (path coordinate system)
- **lengthV** *Number* Same as lengthU, belong v axis
