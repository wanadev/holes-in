---
title: Home
menuOrder: 0
autotoc: false
---

> A javascript library to generate 3D mesh from a 2D outer path and 2D inner paths.

## Getting started:
First you need to include holesIn library into your html code:

```html
 <script src="./holes-in.min.js"></script>
```

Then you will need to define the outer shape of your mesh and the holes you want to dig into:
```javascript
 let out= {path: [{X:10,Y:10},{X:110,Y:10},{X:110,Y:110},{X:10,Y:110}],depth:100};
 let hole1= {path: [{X:40,Y:40},{X:40,Y:90},{X:100,Y:90},{X:100,Y:40}],depth:0};
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
TODO: Support holes that modifies the outer geometry
