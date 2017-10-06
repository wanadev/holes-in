

let getholes = {

getPaths: function(){
    return {
        outerShape: { path: [ {X:50,Y:50}, {X:150,Y:50}, {X:150,Y:150}, {X:50,Y:150} ], depth:100},
        inHole1: { path: [{X:70,Y:70},{X:70,Y:90},{X:90,Y:90},{X:90,Y:70}], depth: 0 },
        inHole2: { path: [{X:75,Y:75},{X:75,Y:90},{X:105,Y:90},{X:105,Y:75}], depth: 0 },
        outHole1: { path: [{X:75,Y:60},{X:75,Y:180},{X:100,Y:180},{X:100,Y:60}], depth: 0 },
        outHole2: { path: [{X:10,Y:130},{X:200,Y:130},{X:200,Y:200},{X:10,Y:200}], depth: 0 },
        outerShape_colinear: JSON.parse('{"path":[{"X":-1612.59,"Y":-155.8},{"X":-1585.46,"Y":1065.19},{"X":62.96,"Y":1028.56},{"X":-2.14,"Y":-191.58}],"depth":100}'),
        holes_colinear: JSON.parse('[{"path":[{"X":-1049.2808396720457,"Y":729.698597085507},{"X":-388.808787212524,"Y":714.9656378557928},{"X":-836.7275857877936,"Y":1156.6292266055166},{"X":-1036.7275857877933,"Y":1156.6292266055166}],"depth":100},{"path":[{"X":-512.8365366371643,"Y":786.1703991813754},{"X":-312.8365366371643,"Y":810.2260189268427},{"X":-312.8365366371643,"Y":1010.2260189268427},{"X":-512.8365366371643,"Y":1010.2260189268427}],"depth":100}]'),
        outerShape1: JSON.parse('{"path":[{"X":-665.5954564165801,"Y":-96.69725238943857},{"X":-674.1839483073007,"Y":-67.95289977813377},{"X":-349.39021,"Y":29.09185},{"X":-205.31347,"Y":40.82987}],"depth":250}'),
        paths1: JSON.parse('[{"path":[{"X":-366.56312,"Y":337.86501},{"X":-607.5471,"Y":345.39576},{"X":-625.51538,"Y":-229.58911},{"X":-362.9509,"Y":-237.79425}],"depth":0.1},{"path":[{"X":-205.31347,"Y":40.82987},{"X":-349.39021,"Y":29.09185},{"X":-364.59708,"Y":24.54821},{"X":-364.40098,"Y":-6.7037}],"depth":0.1},{"path":[{"X":-620.94561,"Y":-83.35637},{"X":-619.95793,"Y":-51.75076},{"X":-674.18394,"Y":-67.95289},{"X":-665.59545,"Y":-96.69725}],"depth":0.1}]'),
        outerShape2: JSON.parse('{"path":[{"X":-205.31347,"Y":40.82987},{"X":-349.39021,"Y":29.09185},{"X":-690.76716,"Y":72.94609},{"X":-543.93586,"Y":84.33026}],"depth":250}'),
        paths2: JSON.parse(' [{"path":[{"X":-366.56312,"Y":337.86501},{"X":-607.5471,"Y":345.39576},{"X":-625.51538,"Y":-229.58911},{"X":-362.9509,"Y":-237.79425}],"depth":0.1},{"path":[{"X":-615.87971,"Y":78.75229},{"X":-690.76716,"Y":72.94609},{"X":-616.35986,"Y":63.38752}],"depth":0.1},{"path":[{"X":-205.31347,"Y":40.82987},{"X":-364.82783,"Y":61.32154},{"X":-364.63788,"Y":31.05061},{"X":-349.39021,"Y":29.09185}],"depth":0.1}]'),
        outerShape3: JSON.parse('{"path":[{"X":-543.93586,"Y":84.33026},{"X":-690.76716,"Y":72.94609},{"X":-249.49753218746076,"Y":201.0389630123621},{"X":-241.13428994873618,"Y":172.2282674418554}],"depth":250}'),
        paths3: JSON.parse(' [{"path":[{"X":-366.56312,"Y":337.86501},{"X":-607.5471,"Y":345.39576},{"X":-625.51538,"Y":-229.58911},{"X":-362.9509,"Y":-237.79425}],"depth":0.1},{"path":[{"X":-241.13428,"Y":172.22826},{"X":-249.49753,"Y":201.03896},{"X":-365.49326,"Y":167.36742},{"X":-365.2976,"Y":136.18582}],"depth":0.1},{"path":[{"X":-615.87971,"Y":78.75229},{"X":-615.37727,"Y":94.83046},{"X":-690.76716,"Y":72.94609}],"depth":0.1}]'),
    };
},

changeDepth: function (hole, depth){
    const res = JSON.parse(JSON.stringify(hole));
    res.depth = depth;
    return res;
},

getTestPaths: function () {
    const input = getholes.getPaths();
    const res =  [{
        outerShape:input.outerShape,
        holes: [],
        result:{
            frontMesh:6,
            backMesh:6,
            outMesh:24}
      },{
          outerShape:input.outerShape,
          holes: [input.inHole1],
          result:{
              frontMesh:24,
              backMesh:24,
              outMesh:24,
              inMesh:24}
      },{
          outerShape:input.outerShape,
          holes: [getholes.changeDepth(input.inHole1, 50)],
          result:{
              frontMesh:24,
              backMesh:6,
              outMesh:24,
              inMesh:24,
              horizontalMesh:6}
      },{
          outerShape:input.outerShape,
          holes: [input.outHole1],
          result:{
          frontMesh:18,
          backMesh:18,
          outMesh:48}
      },{
          outerShape:input.outerShape,
          holes: [getholes.changeDepth(input.outHole1, 50)],
          result:{
          frontMesh:18,
          backMesh:6,
          outMesh:54,
          horizontalMesh:6}
      },{
          outerShape:input.outerShape,
          holes: [input.inHole1,input.outHole1],
          result:{
          frontMesh:30,
          backMesh:30,
          outMesh:72}
      },{
          outerShape:input.outerShape,
          holes: [getholes.changeDepth(input.inHole1, 50),input.outHole1],
          result:{
              frontMesh:30,
              backMesh:18,
              outMesh:78,
              horizontalMesh:6}
      },{
          outerShape:input.outerShape,
          holes: [input.inHole1, getholes.changeDepth(input.outHole1, 50)],
          result:{
              frontMesh:30,
              backMesh:24,
              outMesh:78,
              inMesh:24,
              horizontalMesh:18
          }
      },{
          outerShape:input.outerShape,
          holes: [input.outHole1, getholes.changeDepth(input.inHole1, 50), getholes.changeDepth(input.inHole2, 50)],
          result:{
              frontMesh:42,
              backMesh:18,
              outMesh:108,
              horizontalMesh:12}
      },{
          outerShape:input.outerShape_colinear,
          holes: input.holes_colinear,
          result:{
              frontMesh:36,
              backMesh:36,
              outMesh:84}
      }
      ,{
          outerShape:input.outerShape1,
          holes: input.paths1,
          result:{
            backMesh:6,
            outMesh:24,
            horizontalMesh:6}
      }
      ,{
          outerShape:input.outerShape2,
          holes: input.paths2,
          result:{backMesh:6,
            outMesh:24,
            horizontalMesh:6}
      }
      ,{
          outerShape:input.outerShape3,
          holes: input.paths3,
          result:{
           backMesh:6,
           outMesh:24,
           horizontalMesh:6}
      },
      {
          outerShape:input.outerShape,
          holes: [input.outHole1, input.outHole2],
          doNotBuild: [input.outHole1.path],
          result:{
           backMesh:18,
           frontMesh:18,
           outMesh: 30,
          }
      },
      {
          outerShape:input.outerShape,
          holes: [input.outHole1, input.outHole2],
          doNotBuild: [input.outerShape.path, input.outHole2.path, input.outHole1.path],
          result:{
           frontMesh:18,
           backMesh:18,
          }
      }
  ];
      return JSON.parse(JSON.stringify(res));
},

getTestDoNotBuild: function () {
    return [{
       outerShape:JSON.parse('{"path":[{"X":468.07558050009874,"Y":-238.67208281704953},{"X":467.14155619153684,"Y":-268.6575392683196},{"X":-518.2795300680407,"Y":-237.96241711029145},{"X":-517.3455057594788,"Y":-207.97696065902133}],"depth":250}'),
       holes:JSON.parse('[{"path":[{"X":-246.01,"Y":430.07},{"X":-246.01,"Y":-574.39},{"X":259.45,"Y":-630.5},{"X":87.66,"Y":481.62}],"depth":27.1}]'),
       result:{frontMesh:12, outMesh:12, horizontalMesh:6}
       },{
       outerShape:JSON.parse('{"path":[{"X":-509.2,"Y":-309.11},{"X":-537.8,"Y":-338.24},{"X":-567.09,"Y":256.44},{"X":-535.65,"Y":227.95}],"depth":250}'),
       holes:JSON.parse('[{"path":[{"x":-37.24,"y":-555.61},{"x":256.13,"y":-550.46},{"x":215.16,"y":468.52},{"x":-82.96,"y":468.52}],"depth":39.1,"height":289},{"path":[{"x":-51.59,"y":438.52},{"x":-52.93,"y":468.52},{"x":-313.79,"y":468.52},{"x":-295.72,"y":-560.15},{"x":-295.71,"y":-560.15},{"x":-7.23,"y":-555.08},{"x":-8.57,"y":-525.11},{"x":-51.6,"y":438.52}],"depth":0.1,"height":250}]'),
       result: { frontMesh: 6}
       },{
       outerShape:JSON.parse('{"path":[{"X":-6.9526,"Y":3.3236},{"X":-6.6627,"Y":3.0085},{"X":-6.9295,"Y":-5.1746},{"X":-7.2421,"Y":-5.5581}],"depth":250}'),
       holes:JSON.parse('[{"path":[{"X":-8.3918,"Y":-1.1942},{"X":-8.8031,"Y":1.8672},{"X":-1.1355,"Y":2.1807},{"X":-0.6658990008347994,"Y":-0.931999959147805}],"depth":30},{"path":[{"X":-0.3188,"Y":-3.2325},{"X":-8.118,"Y":-3.2325},{"X":-8.4319,"Y":-0.8954},{"X":-8.1306,"Y":-0.8853},{"X":-1.0126,"Y":-0.6436},{"X":-0.7108990005760125,"Y":-0.6333999660633918}],"depth":40}]'),
       result:{frontMesh:12, outMesh: 18, horizontalMesh: 12}
       },{
       outerShape:JSON.parse('{"path":[{"X":-118.94,"Y":-557.29},{"X":-146.85,"Y":-521.16},{"X":-96.05,"Y":335.21},{"X":-63.98,"Y":369.21}],"depth":250}'),
       holes:JSON.parse('[{"path":[{"X":-66.59,"Y":-93.2},{"X":-112.66,"Y":212.18},{"X":-879.51,"Y":180.83},{"X":-839.18,"Y":-119.42}],"depth":30},{"path":[{"X":-71.09,"Y":-63.34},{"X":-101.27,"Y":-64.36},{"X":-813.06,"Y":-88.53},{"X":-843.19,"Y":-89.54},{"X":-811.8,"Y":-323.25},{"X":-31.88,"Y":-323.25}],"depth":40}]'),
       result:{frontMesh:12, outMesh: 24, horizontalMesh: 18 }
       },{
       outerShape:JSON.parse('{"path":[{"X":-26.567624835248797,"Y":253.2052054297236},{"X":-30.343067259008887,"Y":282.96669118740834},{"X":505.6811500131579,"Y":350.9649284571853},{"X":509.45659243691796,"Y":321.2034426995005}],"depth":250}'),
       holes:JSON.parse('[{"path":[{"X":490.86,"Y":177.13},{"X":250.14,"Y":506.36},{"X":-248.87,"Y":-9.1},{"X":10.16,"Y":-207.34}],"depth":50},{"path":[{"X":473.14,"Y":201.36},{"X":-14.37,"Y":-188.56},{"X":235.2,"Y":-379.55},{"X":667.04,"Y":-63.81}],"depth":100}]'),
       result:{frontMesh:12, outMesh:12, horizontalMesh:6}
       },{
       outerShape:JSON.parse('{"path":[{"X":-429.7812903652827,"Y":-415.32309063262903},{"X":-459.4919031423315,"Y":-419.479951035898},{"X":-587.0123427512073,"Y":491.9556120633298},{"X":-557.3017299741585,"Y":496.1124724665988}],"depth":278}'),
       holes:JSON.parse('[{"path":[{"X":-212.94,"Y":-297},{"X":180.54,"Y":-261.96},{"X":127.89,"Y":329.4},{"X":-358.83,"Y":298.65},{"X":-352.94,"Y":267.99},{"X":-249.76,"Y":-269.1},{"X":-243.98,"Y":-299.24}],"depth":0.1},{"path":[{"X":-517.75,"Y":-324.12},{"X":-251.56,"Y":-300.43},{"X":-212.85,"Y":-296.98},{"X":-327.63,"Y":300.62},{"X":-572.69,"Y":285.15}],"depth":28},{"path":[{"X":-528.17876,"Y":287.959879},{"X":-557.301729,"Y":496.112472},{"X":-587.012342,"Y":491.955612},{"X":-558.205759,"Y":286.064352}],"depth":28},{"path":[{"X":-429.78129,"Y":-415.32309},{"X":-443.466615,"Y":-317.509033},{"X":-473.386272,"Y":-320.17178},{"X":-459.491903,"Y":-419.479951}],"depth":28}]'),
       result:{horizontalMesh:6},
      }];
},

getTestsKaza: function() {
    return [{
       outerShape:JSON.parse('{"path":[{"X":746330000,"Y":-336520000},{"X":776330000,"Y":-364550000},{"X":-364430000,"Y":-442040000},{"X":-334430000,"Y":-409930000}],"depth":250}'),
       holes:JSON.parse('[{"path":[{"X":-364930000,"Y":-442580001},{"X":-364930000,"Y":156690000},{"X":461960000,"Y":156690000},{"X":461960000,"Y":-386410000}],"depth":0.1},{"path":[{"X":461960000,"Y":-385904650},{"X":461960000,"Y":-355835670},{"X":746330000,"Y":-336520000},{"X":776330000.997701,"Y":-364549999.9322317}],"depth":0.1}]'),
       result:{}
   }];
},

clip: function (path){
    const minX = -200;
    for(let i in path ){
        path[i].X +=5;

    }
},

dataFromKaza: function (string){
    string= string.replace(/x/g, "X");
    return JSON.parse(string.replace(/y/g, "Y"));
},

scaleDown: function (scale=1, scaleout =false){
    if(scaleout) {scaleout = 100;}
    else scaleout = scale;
    holesIn.scaleDownPath(outerShape.path,scaleout)
    for(let i in holes){
        holesIn.scaleDownPath(holes[i].path,scale);
    }
},

doNotBuild: function (paths) {
    if (!paths) return;
    const doNotBuild = paths;
    const edges = [];

    for (let i = 0; i < doNotBuild.length; i++) {
        const path = doNotBuild[i];
        for (let j = 0; j < path.length; j++) {
            const ptA = path[j];
            const ptB = path[(j + 1) % path.length];
            edges.push([{X:ptA.X,Y:ptA.Y},{X:ptB.X,Y:ptB.Y}]);
        }
    }
    return edges;
},

getDefaultOptions: function(){
    return { inMesh: true, outMesh: true, frontMesh: true, backMesh: true, horizontalMesh: true, doNotBuild: [] };
},

};

module.exports = getholes;
