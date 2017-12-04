"use strict";

const holesIn = require("../../lib/index.js");
const getHoles = require("../../tests/holes.js");

const unitarytestHandler = {

    tests: null,

    setup(select) {

    

        const options = getholes.getDefaultOptions();
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
    }

};

module.exports = debugger2d;
