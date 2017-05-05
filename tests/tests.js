"use strict";

const holesIn = require("./holes-in.js");

var expect = require("expect.js");


function dataFromKaza(string){

    string= string.replace(/x/g, "X");
    return JSON.parse(string.replace(/y/g, "Y"));

}


function doNotBuild(paths) {
    const edges = [];

    for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        for (let j = 0; j < path.length; j++) {
            const ptA = path[j];
            const ptB = path[(j + 1) % path.length];
            edges.push([ptA, ptB]);
        }
    }
    return edges;
}

function getDefaultOptions(){
    return { inMesh: true, outMesh: true, frontMesh: true, backMesh: true, horrizontalMesh: true, doNotBuild: [] };
}


describe('Holes in', function() {

    describe('getGeometry', function() {

        var outerShape, inHole1,inHole2,outHole1,outerShape_colinear,
        holes_colinear,holes_colinear_door,outerShape_colinear_door;

        beforeEach(function(){

            outerShape= { path: [ {X:50,Y:50}, {X:150,Y:50}, {X:150,Y:150}, {X:50,Y:150} ], depth:100};

            inHole1= { path: [{X:70,Y:70},{X:70,Y:90},{X:90,Y:90},{X:90,Y:70}], depth: 0 };

            inHole2= { path: [{X:75,Y:75},{X:75,Y:90},{X:105,Y:90},{X:105,Y:75}], depth: 0 };

            outHole1= { path: [{X:75,Y:60},{X:75,Y:180},{X:100,Y:180},{X:100,Y:60}], depth: 0 };

            outerShape_colinear= JSON.parse('{"path":[{"X":-1612.59,"Y":-155.8},{"X":-1585.46,"Y":1065.19},{"X":62.96,"Y":1028.56},{"X":-2.14,"Y":-191.58}],"depth":100}');
            holes_colinear= JSON.parse('[{"path":[{"X":-1049.2808396720457,"Y":729.698597085507},{"X":-388.808787212524,"Y":714.9656378557928},{"X":-836.7275857877936,"Y":1156.6292266055166},{"X":-1036.7275857877933,"Y":1156.6292266055166}],"depth":100},{"path":[{"X":-512.8365366371643,"Y":786.1703991813754},{"X":-312.8365366371643,"Y":810.2260189268427},{"X":-312.8365366371643,"Y":1010.2260189268427},{"X":-512.8365366371643,"Y":1010.2260189268427}],"depth":100}]');

            holes_colinear_door= JSON.parse('[{"path":[{"X":-50,"Y":0},{"X":50,"Y":0},{"X":50,"Y":200},{"X":-50,"Y":200}],"depth":0}]');
            outerShape_colinear_door= JSON.parse('{"path":[{"X":-101.1,"Y":0},{"X":-101.1,"Y":250},{"X":101.1,"Y":250},{"X":101.1,"Y":0}],"depth":15}');


             outerShape_MAXBUG= JSON.parse('{"path":[{"X":-118.94,"Y":-557.29},{"X":-146.85,"Y":-521.16},{"X":-96.05,"Y":335.21},{"X":-63.98,"Y":369.21}],"depth":250}');
             holes_MAXBUG = JSON.parse('[{"path":[{"X":-66.59,"Y":-93.2},{"X":-112.66,"Y":212.18},{"X":-879.51,"Y":180.83},{"X":-839.18,"Y":-119.42}],"depth":30},{"path":[{"X":-71.09,"Y":-63.34},{"X":-101.27,"Y":-64.36},{"X":-813.06,"Y":-88.53},{"X":-843.19,"Y":-89.54},{"X":-811.8,"Y":-323.25},{"X":-31.88,"Y":-323.25}],"depth":40}]')


             const testsDoNotBuild = [
             {
             outerShape: JSON.parse('{"path":[{"X":-429.7812903652827,"Y":-415.32309063262903},{"X":-459.4919031423315,"Y":-419.479951035898},{"X":-587.0123427512073,"Y":491.9556120633298},{"X":-557.3017299741585,"Y":496.1124724665988}],"depth":278}');
             holes : JSON.parse('"[{"path":[{"X":-212.94,"Y":-297},{"X":180.54,"Y":-261.96},{"X":127.89,"Y":329.4},{"X":-358.83,"Y":298.65},{"X":-352.94,"Y":267.99},{"X":-249.76,"Y":-269.1},{"X":-243.98,"Y":-299.24}],"depth":0.1},{"path":[{"X":-517.75,"Y":-324.12},{"X":-251.56,"Y":-300.43},{"X":-212.85,"Y":-296.98},{"X":-327.63,"Y":300.62},{"X":-572.69,"Y":285.15}],"depth":28},{"path":[{"X":-528.17876,"Y":287.959879},{"X":-557.301729,"Y":496.112472},{"X":-587.012342,"Y":491.955612},{"X":-558.205759,"Y":286.064352}],"depth":28},{"path":[{"X":-429.78129,"Y":-415.32309},{"X":-443.466615,"Y":-317.509033},{"X":-473.386272,"Y":-320.17178},{"X":-459.491903,"Y":-419.479951}],"depth":28}]');
             },{
             outerShape = JSON.parse('{"path":[{"X":-509.2,"Y":-309.11},{"X":-537.8,"Y":-338.24},{"X":-567.09,"Y":256.44},{"X":-535.65,"Y":227.95}],"depth":250}')
             holes = JSON.parse('[{"path":[{"x":-37.24,"y":-555.61},{"x":256.13,"y":-550.46},{"x":215.16,"y":468.52},{"x":-82.96,"y":468.52}],"depth":39.1,"height":289},{"path":[{"x":-51.59,"y":438.52},{"x":-52.93,"y":468.52},{"x":-313.79,"y":468.52},{"x":-295.72,"y":-560.15},{"x":-295.71,"y":-560.15},{"x":-7.23,"y":-555.08},{"x":-8.57,"y":-525.11},{"x":-51.6,"y":438.52}],"depth":0.1,"height":250}]');
             },{
             outerShape = JSON.parse('{"path":[{"X":468.07558050009874,"Y":-238.67208281704953},{"X":467.14155619153684,"Y":-268.6575392683196},{"X":-518.2795300680407,"Y":-237.96241711029145},{"X":-517.3455057594788,"Y":-207.97696065902133}],"depth":250}');
             holes = JSON.parse('[{"path":[{"X":-246.01,"Y":430.07},{"X":-246.01,"Y":-574.39},{"X":259.45,"Y":-630.5},{"X":87.66,"Y":481.62}],"depth":27.1}]');
             },{
             outerShape= JSON.parse('{"path":[{"X":-621.9520154437295,"Y":-285.5218940728047},{"X":-623.4280581185113,"Y":-255.5582277747326},{"X":459.4452720848853,"Y":-202.21471397161332},{"X":460.92131475966704,"Y":-232.17838026968542}],"depth":250}');
             holes= JSON.parse('[{"path":[{"X":220.18,"Y":-595.96},{"X":255.8,"Y":-630.09},{"X":95.69,"Y":406.36},{"X":40.29,"Y":397.8},{"X":-168.46,"Y":365.55},{"X":-94.98,"Y":-591.15},{"X":209.44,"Y":-624.95},{"X":255.8,"Y":-630.1},{"X":255.8,"Y":-630.09},{"X":220.18,"Y":-595.96},{"X":-66.99,"Y":-564.08},{"X":-136.43,"Y":340.14},{"X":-66.98,"Y":-564.08}],"depth":33},{"path":[{"X":-64.64,"Y":-594.52},{"X":-66.98,"Y":-564.08},{"X":-66.99,"Y":-564.08},{"X":-136.43,"Y":340.14},{"X":-138.73,"Y":370.14},{"X":-386.99,"Y":331.8},{"X":-386.99,"Y":-558.74},{"X":-368.43,"Y":-560.8}],"depth":18}]');
             },{
             outerShape= JSON.parse('{"path":[{"X":-6952600,"Y":3323600},{"X":-6662700,"Y":3008500},{"X":-6929500,"Y":-5174600},{"X":-7242100,"Y":-5558100}],"depth":250}');
             holes= JSON.parse('[{"path":[{"X":-8391800,"Y":-1194200},{"X":-8803100,"Y":1867200},{"X":-1135500,"Y":2180700},{"X":-665899.0008347994,"Y":-931999.959147805}],"depth":30},{"path":[{"X":-318800,"Y":-3232500},{"X":-8118000,"Y":-3232500},{"X":-8431900,"Y":-895400},{"X":-8130600,"Y":-885300},{"X":-1012600,"Y":-643600},{"X":-710899.0005760125,"Y":-633399.9660633918}],"depth":40}]');
             },{
             outerShape= JSON.parse('{"path":[{"X":-118.94,"Y":-557.29},{"X":-146.85,"Y":-521.16},{"X":-96.05,"Y":335.21},{"X":-63.98,"Y":369.21}],"depth":250}');
             holes= JSON.parse('[{"path":[{"X":-66.59,"Y":-93.2},{"X":-112.66,"Y":212.18},{"X":-879.51,"Y":180.83},{"X":-839.18,"Y":-119.42}],"depth":30},{"path":[{"X":-71.09,"Y":-63.34},{"X":-101.27,"Y":-64.36},{"X":-813.06,"Y":-88.53},{"X":-843.19,"Y":-89.54},{"X":-811.8,"Y":-323.25},{"X":-31.88,"Y":-323.25}],"depth":40}]');
             },{
              outerShape= JSON.parse('{"path":[{"X":-26.567624835248797,"Y":253.2052054297236},{"X":-30.343067259008887,"Y":282.96669118740834},{"X":505.6811500131579,"Y":350.9649284571853},{"X":509.45659243691796,"Y":321.2034426995005}],"depth":250}');
              holes= JSON.parse('[{"path":[{"X":490.86,"Y":177.13},{"X":250.14,"Y":506.36},{"X":-248.87,"Y":-9.1},{"X":10.16,"Y":-207.34}],"depth":50},{"path":[{"X":473.14,"Y":201.36},{"X":-14.37,"Y":-188.56},{"X":235.2,"Y":-379.55},{"X":667.04,"Y":-63.81}],"depth":100}]');
             }
       ];
            //   outerShape_doNotBuild4= JSON.parse('');
            //   holes_doNotBuild4= JSON.parse('');

        });

        it('returns the right number of triangles -- (NoHoles )', function() {

            let geom = holesIn.getGeometry(outerShape, []);
            expect(geom.frontMesh.faces).to.have.length( 6 );
            expect(geom.backMesh.faces).to.have.length( 6 );
            expect(geom.outMesh.faces).to.have.length( 24 );

        });

        it('returns the right number of triangles -- (inHole1 0)', function() {
            let geom = holesIn.getGeometry(outerShape, [inHole1]);
            expect(geom.frontMesh.faces).to.have.length(24);
            expect(geom.backMesh.faces).to.have.length(24);
            expect(geom.outMesh.faces).to.have.length(24);
            expect(geom.inMesh.faces).to.have.length(24);
        });

        it('returns the right number of triangles -- (inHole1 50)', function() {
            inHole1.depth=50;
            let geom = holesIn.getGeometry(outerShape, [inHole1]);
            expect(geom.frontMesh.faces).to.have.length(24);
            expect(geom.backMesh.faces).to.have.length(6);
            expect(geom.outMesh.faces).to.have.length(24);
            expect(geom.inMesh.faces).to.have.length(24);
            expect(geom.horrizontalMesh.faces).to.have.length(6);

        });

        it('returns the right number of triangles -- (outHole1 0)', function() {
            let geom = holesIn.getGeometry(outerShape, [outHole1]);
            expect(geom.frontMesh.faces).to.have.length(18);
            expect(geom.backMesh.faces).to.have.length(18);
            expect(geom.outMesh.faces).to.have.length(48);

        });
        it('returns the right number of triangles -- (outHole1 50)', function() {
            outHole1.depth=50;
            let geom = holesIn.getGeometry(outerShape, [outHole1]);
            expect(geom.frontMesh.faces).to.have.length(18);
            expect(geom.backMesh.faces).to.have.length(6);
            expect(geom.outMesh.faces).to.have.length(54);
            expect(geom.horrizontalMesh.faces).to.have.length(6);

        });

        it('returns the right number of triangles -- (inHole1 0) (outHole1 0)', function() {
            let geom = holesIn.getGeometry(outerShape, [inHole1, outHole1]);
            expect(geom.frontMesh.faces).to.have.length(30);
            expect(geom.backMesh.faces).to.have.length(30);
            expect(geom.outMesh.faces).to.have.length(72);
        });

        it('returns the right number of triangles -- (inHole1 50) (outHole1 0)', function() {
            inHole1.depth=50;
            let geom = holesIn.getGeometry(outerShape, [inHole1, outHole1]);
            expect(geom.frontMesh.faces).to.have.length(30);
            expect(geom.backMesh.faces).to.have.length(18);
            expect(geom.outMesh.faces).to.have.length(78);
            expect(geom.horrizontalMesh.faces).to.have.length(6);
        });

        it('returns the right number of triangles -- (inHole1 0) (outHole1 50)', function() {
            outHole1.depth=50;
            inHole1.depth=0;
            let geom = holesIn.getGeometry(outerShape, [inHole1, outHole1]);
            expect(geom.frontMesh.faces).to.have.length(30);
            expect(geom.backMesh.faces).to.have.length(24);
            expect(geom.outMesh.faces).to.have.length(78);
            expect(geom.inMesh.faces).to.have.length(24);
            expect(geom.horrizontalMesh.faces).to.have.length(18);


        });

        it('returns the right number of triangles -- (outerShape_colinear) (holes_Colinear)', function() {
            let geom = holesIn.getGeometry(outerShape_colinear, holes_colinear);
            expect(geom.frontMesh.faces).to.have.length(33);
            expect(geom.backMesh.faces).to.have.length(33);
            expect(geom.outMesh.faces).to.have.length(78);
        });

        it('returns the right number of triangles -- (outerShape_colinear) (holes_Colinear)', function() {
            const options = getDefaultOptions();
            options.doNotBuild = doNotBuild(outerShape_colinear1.path);
            let geom = holesIn.getGeometry(outerShape_colinear1, holes_colinear1,options);
            // expect(geom.frontMesh.faces).to.have.length(33);
            // expect(geom.backMesh.faces).to.have.length(33);
            // expect(geom.outMesh.faces).to.have.length(78);
        });

        testsDoNotBuild.forEach((test) => {
        it('returns the right number of triangles, test index= '+ test.index, function() {
            const options = getDefaultOptions();
            options.doNotBuild = doNotBuild(test.outerShape.path);
            let geom = holesIn.getGeometry(outerShape_colinear1, holes_colinear1,options);
            if(test.frontMesh)
                expect(geom.frontMesh.faces).to.have.length(33);
            if(test.backMesh)
                expect(geom.backMesh.faces).to.have.length(33);
            if(test.outMesh)
                expect(geom.outMesh.faces).to.have.length(78);
            if(test.inMesh)
                expect(geom.inMesh.faces).to.have.length(78);
            if(test.horrizontalMesh)
                expect(geom.horrizontalMesh.faces).to.have.length(78);

        });
      });


        it('returns coherent points normals faces uvs -- (outerShape) (inHole1)', function() {
            let geom = holesIn.getGeometry(outerShape, [inHole1]);
            let geomMerged = holesIn.mergeMeshes([geom.inMesh,geom.outMesh,geom.frontMesh,geom.backMesh]);
            let numPoints = new Set(geomMerged.faces).size;
            expect(geomMerged.points).to.have.length(numPoints*3);
            expect(geomMerged.normals).to.have.length(numPoints*3);
            expect(geomMerged.uvs).to.have.length(numPoints*2);
        });
        it('returns coherent points normals faces uvs -- (outerShape_colinear) (holes_Colinear)', function() {
            let geom = holesIn.getGeometry(outerShape, [inHole1]);
            let geomMerged = holesIn.mergeMeshes([geom.inMesh,geom.outMesh,geom.frontMesh,geom.backMesh]);
            let numPoints = new Set(geomMerged.faces).size;
            expect(geomMerged.points).to.have.length(numPoints*3);
            expect(geomMerged.normals).to.have.length(numPoints*3);
            expect(geomMerged.uvs).to.have.length(numPoints*2);
        });
        it('returns coherent points normals faces uvs -- (outerShape_colinear) (holes_Colinear)', function() {
            let geom = holesIn.getGeometry(outerShape, [inHole1]);
            let geomMerged = holesIn.mergeMeshes([geom.inMesh,geom.outMesh,geom.frontMesh,geom.backMesh]);
            let numPoints = new Set(geomMerged.faces).size;
            expect(geomMerged.points).to.have.length(numPoints*3);
            expect(geomMerged.normals).to.have.length(numPoints*3);
            expect(geomMerged.uvs).to.have.length(numPoints*2);
        });
        it('returns coherent points normals faces uvs -- (outerShape_colinear) (holes_Colinear)', function() {
            let geom = holesIn.getGeometry(outerShape, [inHole1, outHole1]);
            let geomMerged = holesIn.mergeMeshes([geom.inMesh,geom.outMesh,geom.frontMesh,geom.backMesh]);
            let numPoints = new Set(geomMerged.faces).size;
            expect(geomMerged.points).to.have.length(numPoints*3);
            expect(geomMerged.normals).to.have.length(numPoints*3);
            expect(geomMerged.uvs).to.have.length(numPoints*2);
        });
        it('returns coherent points normals faces uvs -- (outerShape_colinear) (holes_Colinear)', function() {
            outHole1.depth=50;
            let geom = holesIn.getGeometry(outerShape, [outHole1]);
            let geomMerged = holesIn.mergeMeshes([geom.inMesh,geom.outMesh,geom.frontMesh,geom.backMesh]);
            let numPoints = new Set(geomMerged.faces).size;
            expect(geomMerged.points).to.have.length(numPoints*3);
            expect(geomMerged.normals).to.have.length(numPoints*3);
            expect(geomMerged.uvs).to.have.length(numPoints*2);
        });
        it('returns coherent points normals faces uvs -- (outerShape_colinear) (holes_Colinear)', function() {
            inHole1.depth=50;
            let geom = holesIn.getGeometry(outerShape, [inHole1, outHole1]);
            let geomMerged = holesIn.mergeMeshes([geom.inMesh,geom.outMesh,geom.frontMesh,geom.backMesh]);
            let numPoints = new Set(geomMerged.faces).size;
            expect(geomMerged.points).to.have.length(numPoints*3);
            expect(geomMerged.normals).to.have.length(numPoints*3);
            expect(geomMerged.uvs).to.have.length(numPoints*2);
        });

        // it('returns the right number of triangles FRONT-- (outerShape_colinear_door) (holes_colinear_door)', function() {
        //     let geom = holesIn.getGeometry(outerShape_colinear_door, holes_colinear_door);
        //     expect(geom.frontMesh.faces).to.have.length(18);
        //     // expect(geomMerged.faces).to.have.length(48);
        // });

    });

});
