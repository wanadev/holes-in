---
title: Demo
menuOrder: 1
autotoc: false
---

<style>
#paths {
    -ms-transform: rotate(180deg); /* IE 9 */
    -webkit-transform: rotate(180deg); /* Safari */
    transform: rotate(180deg); /* Standard syntax */
    margin: auto;
}
</style>

<script src="./holes-in.js"></script>
<script src="./babylon.js"></script>
<script src="./holes.js"></script>
<script src="./ui.js"></script>
<script src="./draw.js"></script>


# How does holes-in works

This page aims to describe holes-in's work-flow.

## From holes to inner and outer paths

The first thing to do is to find out the shape of our mesh at each depth. This is done into the extruder.js via the function getDataByDepth. This function returns three arrays: innerPathsByDepth, outerPathsByDepth and horrizontalPathsByDepth.

<canvas id="canvas1"> </canvas><br/>
<script>
     var canvas1 = document.getElementById('canvas1');
     var ctx1= canvas1.getContext('2d');
     let data = holesIn.getDataByDepth(outerShape, holes);
     drawHelper.drawText(ctx1, "text");
    //  holesIn.drawPaths(ctx1,data.innerPathsByDepth);
    //  holesIn.drawText(ctx1, "Paths by depth");
</script>
