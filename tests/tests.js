"use strict";

const expect = require("expect.js");
const holesIn = require("../dist/holes-in.js");
const getholes = require("./holes");

describe('Holes in', function() {

    describe('getGeometry', function() {

        beforeEach(function() {

        });


        getholes.getTestPaths().forEach((test, i) => {
            it('returns the right number of triangles, test index= ' + i, function() {
                const options = getholes.getDefaultOptions();
                if(test.doNotBuild) {
                    options.doNotBuild = getholes.doNotBuild(test.doNotBuild);
                }
                let geom = holesIn.getGeometry(test.outerShape, test.holes, options);
                const result = test.result;

                if (result.frontMesh)
                    expect(geom.frontMesh.faces).to.have.length(result.frontMesh);
                if (result.backMesh)
                    expect(geom.backMesh.faces).to.have.length(result.backMesh);
                if (result.outMesh)
                    expect(geom.outMesh.faces).to.have.length(result.outMesh);
                if (result.inMesh)
                    expect(geom.inMesh.faces).to.have.length(result.inMesh);
                if (result.horizontalMesh)
                    expect(geom.horizontalMesh.faces).to.have.length(result.horizontalMesh);
            });
        });

        // getholes.getTestDoNotBuild().forEach((test, i) => {
        //     it('DO NOT BUILD returns the right number of triangles, test index= ' + i, function() {
        //         const options = getholes.getDefaultOptions();
        //         options.doNotBuild = getholes.doNotBuild([test.outerShape.path]);
        //         options.backMesh = false;
        //         const result = test.result;
        //         let geom = holesIn.getGeometry(test.outerShape, test.holes, options);
        //         if (result.frontMesh)
        //             expect(geom.frontMesh.faces).to.have.length(result.frontMesh);
        //         if (result.backMesh)
        //             expect(geom.backMesh.faces).to.have.length(result.backMesh);
        //         if (result.outMesh)
        //             expect(geom.outMesh.faces).to.have.length(result.outMesh);
        //         if (result.inMesh)
        //             expect(geom.inMesh.faces).to.have.length(result.inMesh);
        //         if (result.horizontalMesh)
        //             expect(geom.horizontalMesh.faces).to.have.length(result.horizontalMesh);
        //
        //     });
        // });

        // getholes.getTestPaths().forEach((test, i) => {
        //     it('returns coherent points normals faces uvs, test index= ' + i, function() {
        //         const options = getholes.getDefaultOptions();
        //         let geom = holesIn.getGeometry(test.outerShape, test.holes, options);
        //         let geomMerged = holesIn.mergeMeshes([geom.inMesh, geom.outMesh, geom.frontMesh, geom.backMesh, geom.horizontalMesh]);
        //         let numPoints = new Set(geomMerged.faces).size;
        //         expect(geomMerged.points).to.have.length(numPoints * 3);
        //         expect(geomMerged.normals).to.have.length(numPoints * 3);
        //         expect(geomMerged.uvs).to.have.length(numPoints * 2);
        //
        //     });
        // });
        //
        // getholes.getTestDoNotBuild().forEach((test, i) => {
        //     it('DO NOT BUILD returns coherent points normals faces uvs, test index= ' + i, function() {
        //         const options = getholes.getDefaultOptions();
        //         options.doNotBuild = getholes.doNotBuild([test.outerShape.path]);
        //         options.backMesh = false;
        //         let geom = holesIn.getGeometry(test.outerShape, test.holes, options);
        //         let geomMerged = holesIn.mergeMeshes([geom.inMesh, geom.outMesh, geom.frontMesh, geom.backMesh, geom.horizontalMesh]);
        //         let numPoints = new Set(geomMerged.faces).size;
        //         expect(geomMerged.points).to.have.length(numPoints * 3);
        //         expect(geomMerged.normals).to.have.length(numPoints * 3);
        //         expect(geomMerged.uvs).to.have.length(numPoints * 2);
        //
        //     });
        // });
    });
});
