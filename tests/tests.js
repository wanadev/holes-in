"use strict";

const holesIn = require("./holes-in.js");

var expect = require("expect.js");

console.log("holes in ", holesIn.scaleFactor);

describe('Holes in', function() {

    describe('getGeometry', function() {

        var outerShape, inHole1,inHole2,outHole1,outerShape_colinear,
        holes_colinear,holes_colinear_door,outerShape_colinear_door;

        beforeEach(function(){
            console.log("holes in ", holesIn.scaleFactor);

            outerShape= { path: [ {X:50,Y:50}, {X:150,Y:50}, {X:150,Y:150}, {X:50,Y:150} ], depth:100};

            inHole1= { path: [{X:70,Y:70},{X:70,Y:90},{X:90,Y:90},{X:90,Y:70}], depth: 0 };

            inHole2= { path: [{X:75,Y:75},{X:75,Y:90},{X:105,Y:90},{X:105,Y:75}], depth: 0 };

            outHole1= { path: [{X:75,Y:60},{X:75,Y:180},{X:100,Y:180},{X:100,Y:60}], depth: 0 };

            outerShape_colinear= JSON.parse('{"path":[{"X":-1612.59,"Y":-155.8},{"X":-1585.46,"Y":1065.19},{"X":62.96,"Y":1028.56},{"X":-2.14,"Y":-191.58}],"depth":100}');
            holes_colinear= JSON.parse('[{"path":[{"X":-1049.2808396720457,"Y":729.698597085507},{"X":-388.808787212524,"Y":714.9656378557928},{"X":-836.7275857877936,"Y":1156.6292266055166},{"X":-1036.7275857877933,"Y":1156.6292266055166}],"depth":100},{"path":[{"X":-512.8365366371643,"Y":786.1703991813754},{"X":-312.8365366371643,"Y":810.2260189268427},{"X":-312.8365366371643,"Y":1010.2260189268427},{"X":-512.8365366371643,"Y":1010.2260189268427}],"depth":100}]');

            holes_colinear_door= JSON.parse('[{"path":[{"X":-50,"Y":0},{"X":50,"Y":0},{"X":50,"Y":200},{"X":-50,"Y":200}],"depth":0}]');
            outerShape_colinear_door= JSON.parse('{"path":[{"X":-101.1,"Y":0},{"X":-101.1,"Y":250},{"X":101.1,"Y":250},{"X":101.1,"Y":0}],"depth":15}');



        });

        it('returns the right number of triangles -- (NoHoles )', function() {
            console.log("holes in HJIODMSHIO", holesIn.scaleFactor);

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
            expect(geom.inMesh.faces).to.have.length(30);
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
            expect(geom.inMesh.faces).to.have.length(6);
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
            expect(geom.inMesh.faces).to.have.length(6);
        });

        it('returns the right number of triangles -- (inHole1 0) (outHole1 50)', function() {
            outHole1.depth=50;
            inHole1.depth=0;
            let geom = holesIn.getGeometry(outerShape, [inHole1, outHole1]);
            expect(geom.frontMesh.faces).to.have.length(30);
            expect(geom.backMesh.faces).to.have.length(24);
            expect(geom.outMesh.faces).to.have.length(78);
            expect(geom.inMesh.faces).to.have.length(42);
        });

        it('returns the right number of triangles -- (outerShape_colinear) (holes_Colinear)', function() {
            let geom = holesIn.getGeometry(outerShape_colinear, holes_colinear);
            expect(geom.frontMesh.faces).to.have.length(33);
            expect(geom.backMesh.faces).to.have.length(33);
            expect(geom.outMesh.faces).to.have.length(78);
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
