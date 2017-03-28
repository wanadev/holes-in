let geom1= [{X:50,Y:50},{X:150,Y:50},{X:150,Y:150},{X:50,Y:150}];

let hole1= [{X:0,Y:70},{X:0,Y:90},{X:110,Y:90},{X:110,Y:70}];
let hole2= [{X:70,Y:0},{X:90,Y:0},{X:90,Y:110},{X:70,Y:110}];

let hole3= [{X:80,Y:20},{X:120,Y:20},{X:120,Y:60},{X:80,Y:60}];
let hole4= [{X:40,Y:-20},{X:60,Y:-20},{X:60,Y:0},{X:40,Y:0}];


let h1 = {path: hole1, depth: 20};
let h2 = {path: hole2, depth: 0};
let h3 = {path: hole3, depth: 50};
let h4 = {path: hole4, depth: 20};


let outerShape= {path: geom1, depth: 100};
let baseholes=[h1,h2,h3];
let holes = JSON.parse(JSON.stringify(baseholes));

let holesStr= kzplanToStr('[{"path":[{"x":385.6915861427306,"y":129.76692123037517},{"x":535.5646081097426,"y":129.76692123037517},{"x":535.5646081097426,"y":329.76692123037503},{"x":377.69158614273067,"y":409.76692123037515}],"depth":50},{"path":[{"x":260.7195529429974,"y":-28.138723316616954},{"x":460.71955294299727,"y":-28.138723316616954},{"x":460.71955294299727,"y":171.86127668338307},{"x":260.7195529429974,"y":171.86127668338307}],"depth":200}]')
let outStr=  kzplanToStr('{"path":[{"x":-143,"y":-584.34},{"x":-177.72,"y":-584.34},{"x":-231.32,"y":-584.34},{"x":-213.18,"y":201.65},{"x":573.15,"y":201.65},{"x":573.15,"y":-584.34}],"depth":99}');

function kzplanToStr(str1){
    let upX= str1.replace(/x/g,"X");
    let upY= upX.replace(/y/g,"Y");
    return upY
}
