var babylonHelper = {


swapAllToBabylon(geoms){
    Object.values(geoms).forEach( g => babylonHelper.swapToBabylon(g));
},

swapToBabylon(geom){
    if(!geom){return;}
    babylonHelper.swapValuesYZ(geom.normals);
    babylonHelper.swapValuesYZ(geom.points);
    babylonHelper.swapValuesTriangle(geom.faces);

},

swapValuesYZ(array) {
    let oldY;
    const step = 3;
    const Y = 1;
    const Z = 2;
    for (let i = 0; i < array.length; i += step) {
        oldY = array[i + Y];
        array[i + Y] = -array[i + Z];
        array[i + Z] = -oldY;
    }
},

swapValuesTriangle(array) {
    let oldIdx;
    const step = 3;
    const Y = 1;
    const Z = 2;
    for (let i = 0; i < array.length; i += step) {
        oldIdx = array[i + Y];
        array[i + Y] = array[i + Z];
        array[i + Z] = oldIdx;
    }
},

};
module.exports= babylonHelper;
