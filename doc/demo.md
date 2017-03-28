---
title: Demo
menuOrder: 1
autotoc: false
---

# Demo
<style>
#paths {
    -ms-transform: rotate(180deg); /* IE 9 */
    -webkit-transform: rotate(180deg); /* Safari */
    transform: rotate(180deg); /* Standard syntax */
    margin: auto;
}
</style>

<script src="./holes-in.js"></script>
<script src="./babylonjs/babylon.js"></script>
<script src="./holes.js"></script>
<script src="./ui.js"></script>


<canvas id="babylon" width="512" height="256" ></canvas>
<canvas id="paths" width="256" height="256"  align=center ></canvas>

<div id ="form">

<div><label>Inner Mesh Generation<input type="checkbox" data-target="inMesh" checked="true"></label></div>
<div><label>Outer Mesh Generation<input type="checkbox" data-target="outMesh" checked="true"></label></div>
<div><label>Front Mesh Generation<input type="checkbox" data-target="frontMesh" checked="true"></label></div>
<div><label>Back Mesh Generation<input type="checkbox" data-target="backMesh" checked="true"></label></div>
<div><label>Wire Frame<input type="checkbox" data-target="wireframe"></label></div>
<div><label>Back Face Culling<input type="checkbox" data-target="backFaceCulling"></label></div>
<div><label>Move Paths <input type="checkbox" data-target="animate" checked="true"></label></div>






</div>

<script>window.onload=initBabylon</script>
