
let holes;
let outerShape;

let geom1= [{X:50,Y:50},{X:150,Y:50},{X:150,Y:150},{X:50,Y:150}];
let hole1= [{X:0,Y:70},{X:0,Y:90},{X:110,Y:90},{X:110,Y:70}];
let hole2= [{X:70,Y:0},{X:90,Y:0},{X:90,Y:110},{X:70,Y:110}];
let hole3= [{X:80,Y:20},{X:120,Y:20},{X:120,Y:60},{X:80,Y:60}];
let hole4= [{X:75,Y:75},{X:90,Y:75},{X:90,Y:90},{X:75,Y:90}];
//
let h1 = {path: hole1, depth: 20};
let h2 = {path: hole2, depth: 0};
let h3 = {path: hole3, depth: 50};
let h4 = {path: hole4, depth: 0};
outerShape= {path: geom1, depth: 100};
let baseholes=[];



// outerShape= JSON.parse('{"path":[{"X":-1612.59,"Y":-155.8},{"X":-1585.46,"Y":1065.19},{"X":62.96,"Y":1028.56},{"X":-2.14,"Y":-191.58}],"depth":100}');
// holes= JSON.parse('[{"path":[{"X":-1049.2808396720457,"Y":729.698597085507},{"X":-388.808787212524,"Y":714.9656378557928},{"X":-836.7275857877936,"Y":1156.6292266055166},{"X":-1036.7275857877933,"Y":1156.6292266055166}],"depth":100},{"path":[{"X":-512.8365366371643,"Y":786.1703991813754},{"X":-312.8365366371643,"Y":810.2260189268427},{"X":-312.8365366371643,"Y":1010.2260189268427},{"X":-512.8365366371643,"Y":1010.2260189268427}],"depth":100}]');
outerShape= { path: [ {X:50,Y:50}, {X:150,Y:50}, {X:150,Y:150}, {X:50,Y:150} ], depth:100};
inHole1= { path: [{X:70,Y:70},{X:70,Y:90},{X:90,Y:90},{X:90,Y:70}], depth: 0 };
inHole2= { path: [{X:75,Y:75},{X:75,Y:90},{X:105,Y:90},{X:105,Y:75}], depth: 0 };
outHole1= { path: [{X:75,Y:60},{X:75,Y:180},{X:100,Y:180},{X:100,Y:60}], depth: 50 };

holes_colinear_door= JSON.parse('[{"path":[{"X":-50,"Y":0},{"X":50,"Y":0},{"X":50,"Y":200},{"X":-50,"Y":200}],"depth":0}]');
outerShape_colinear_door= JSON.parse('{"path":[{"X":-101.1,"Y":0},{"X":-101.1,"Y":250},{"X":101.1,"Y":250},{"X":101.1,"Y":0}],"depth":15}');

outerShape_colinear= JSON.parse('{"path":[{"X":-1612.59,"Y":-155.8},{"X":-1585.46,"Y":1065.19},{"X":62.96,"Y":1028.56},{"X":-2.14,"Y":-191.58}],"depth":100}');
holes_colinear= JSON.parse('[{"path":[{"X":-1049.2808396720457,"Y":729.698597085507},{"X":-388.808787212524,"Y":714.9656378557928},{"X":-836.7275857877936,"Y":1156.6292266055166},{"X":-1036.7275857877933,"Y":1156.6292266055166}],"depth":100},{"path":[{"X":-512.8365366371643,"Y":786.1703991813754},{"X":-312.8365366371643,"Y":810.2260189268427},{"X":-312.8365366371643,"Y":1010.2260189268427},{"X":-512.8365366371643,"Y":1010.2260189268427}],"depth":100}]');


holes = holes_colinear;
outerShape = outerShape_colinear;
console.log("ICI HOLES");

scaleDown(1);


function dataFromKaza(string){

    string= string.replace(/x/g, "X");
    return JSON.parse(string.replace(/y/g, "Y"));

}

function scaleDown(scale=1){
    holesIn.scaleDownPath(outerShape.path,scale)
    for(let i in holes){
        holesIn.scaleDownPath(holes[i].path,scale);
    }
}