"use strict";

const expect = require("expect.js");
const holesIn = require("../dist/holes-in.js");
const getholes = require("./holes");

describe('Holes in', function() {

    describe('getGeometry', function() {

        beforeEach(function() {

        });

        let i = 0;
        getholes.getTestPaths().forEach((test) => {
            it('returns the right number of triangles, test index= ' + i, function() {
                const options = getholes.getDefaultOptions();
                let geom = holesIn.getGeometry(test.outerShape, test.holes, options);
                if (test.frontMesh)
                    expect(geom.frontMesh.faces).to.have.length(test.frontMesh);
                if (test.backMesh)
                    expect(geom.backMesh.faces).to.have.length(test.backMesh);
                if (test.outMesh)
                    expect(geom.outMesh.faces).to.have.length(test.outMesh);
                if (test.inMesh)
                    expect(geom.inMesh.faces).to.have.length(test.inMesh);
                if (test.horizontalMesh)
                    expect(geom.horizontalMesh.faces).to.have.length(test.horizontalMesh);
            });
            i++;
        });

        i = 0;
        getholes.getTestDoNotBuild().forEach((test) => {
            it('DO NOT BUILD returns the right number of triangles, test index= ' + i, function() {
                const options = getholes.getDefaultOptions();
                getholes.doNotBuild(options, [test.outerShape.path]);
                options.backMesh = false;
                let geom = holesIn.getGeometry(test.outerShape, test.holes, options);
                if (test.frontMesh)
                    expect(geom.frontMesh.faces).to.have.length(test.frontMesh);
                if (test.backMesh)
                    expect(geom.backMesh.faces).to.have.length(test.backMesh);
                if (test.outMesh)
                    expect(geom.outMesh.faces).to.have.length(test.outMesh);
                if (test.inMesh)
                    expect(geom.inMesh.faces).to.have.length(test.inMesh);
                if (test.horizontalMesh)
                    expect(geom.horizontalMesh.faces).to.have.length(test.horizontalMesh);

            });
            i++;
        });

        i = 0;
        getholes.getTestPaths().forEach((test) => {
            it('returns coherent points normals faces uvs, test index= ' + i, function() {
                const options = getholes.getDefaultOptions();
                let geom = holesIn.getGeometry(test.outerShape, test.holes, options);
                let geomMerged = holesIn.mergeMeshes([geom.inMesh, geom.outMesh, geom.frontMesh, geom.backMesh, geom.horizontalMesh]);
                let numPoints = new Set(geomMerged.faces).size;
                expect(geomMerged.points).to.have.length(numPoints * 3);
                expect(geomMerged.normals).to.have.length(numPoints * 3);
                expect(geomMerged.uvs).to.have.length(numPoints * 2);

            });
            i++;
        });

        i = 0;
        getholes.getTestDoNotBuild().forEach((test) => {
            it('DO NOT BUILD returns coherent points normals faces uvs, test index= ' + i, function() {
                const options = getholes.getDefaultOptions();
                getholes.doNotBuild(options, [test.outerShape.path]);
                options.backMesh = false;
                let geom = holesIn.getGeometry(test.outerShape, test.holes, options);
                let geomMerged = holesIn.mergeMeshes([geom.inMesh, geom.outMesh, geom.frontMesh, geom.backMesh, geom.horizontalMesh]);
                let numPoints = new Set(geomMerged.faces).size;
                expect(geomMerged.points).to.have.length(numPoints * 3);
                expect(geomMerged.normals).to.have.length(numPoints * 3);
                expect(geomMerged.uvs).to.have.length(numPoints * 2);

            });
            i++;
        });
    });
});
