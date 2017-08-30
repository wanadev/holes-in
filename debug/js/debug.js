"use-strict";

const pathTracer = require("./pathTracer");
const debugger2d = require("./debugger2d");
const debugger3d = require("./debugger3d");
const store = require("store");
const holesIn = require("../../lib/index.js");
const cdt2d = require("cdt2d");
const shapeEditor = require("./shape-editor.js");
const getHoles = require("../../tests/holes.js");


const debug = {
    elems: null,

    init() {
        debug.elems =  {
                      outerShape: document.getElementById("outerShape"),
                      holes: document.getElementById("holes"),
                      doNotBuild: document.getElementById("doNotBuild"),
                      submit: document.getElementById("submit"),
                      customDraw: document.getElementById("customDraw"),
                      container: document.getElementById("container"),
                      generated: document.getElementById("generated-data"),
                      interactiveCanvas: document.getElementById("interactive-canvas"),
                      shapeEditorOutButton: document.getElementById("shapeEditorOut"),
                      shapeEditorHoleButton: document.getElementById("shapeEditorHole"),
                      shapeEditorDefaultButton: document.getElementById("shapeEditorDefault"),
                      shapeEditorSubmitButton: document.getElementById("shapeEditorSubmit"),
                      testSelect: document.getElementById("testSelect"),
                      debugCheckboxes:  [...document.getElementById('logs').getElementsByTagName('input')]
                  };

        if(store.get("outerShape")){
            debug.elems.outerShape.value = store.get("outerShape");
        }
        if(store.get("holes")){
            debug.elems.holes.value = store.get("holes");
        }
        if(store.get("doNotBuild")){
            debug.elems.doNotBuild.value = store.get("doNotBuild");
        }

        debugger2d.elems = debug.elems;
        debugger3d.elems = debug.elems;
        debugger3d.init();

        debug.elems.submit.addEventListener("click", () => {
            store.set('outerShape', debug.elems.outerShape.value);
            store.set('holes', debug.elems.holes.value);
            store.set('doNotBuild', debug.elems.doNotBuild.value);
            debug.refresh();
        });

        debug.elems.customDraw.addEventListener("click", () => {
            debug.startNewDraw();
        });

        debug.elems.debugCheckboxes.forEach(el =>
              {
                  el.addEventListener("change", e => {
                     debug.rebuildGeometry();
                  });
              }
          );

        debug.elems.submit.dispatchEvent(new Event('click'));

        document.debugLib = this;
        document.holesIn = holesIn;
        document.cdt2d = cdt2d;

        shapeEditor.initIntoCanvas(debug.elems.interactiveCanvas, debug.elems.shapeEditorOutButton,
                            debug.elems.shapeEditorHoleButton, debug.elems.shapeEditorDefaultButton);


        // init unitary tests select :
        getHoles.getTestPaths().forEach((test, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.innerHTML = index;
            debug.elems.testSelect.appendChild(option);
        });

        debug.elems.testSelect.addEventListener('change', function() {
            console.log('Selection changed!', debug.elems.testSelect.selectedIndex);
            const unitaryTest = getHoles.getTestPaths()[debug.elems.testSelect.selectedIndex];
            const options = getHoles.getDefaultOptions();
            const jsonOuterSape = JSON.stringify(unitaryTest.outerShape);
            const jsonHoles = JSON.stringify(unitaryTest.holes);

            debug.elems.holes.value = jsonHoles;
            debug.elems.outerShape.value = jsonOuterSape;

            debug.refresh();

         }, false);


    },

    createCheckboxesPaths() {
        debug.elems.generated.innerHTML = "";
        const holesValue = JSON.parse(debug.elems.holes.value);

        holesValue.forEach( (hole, index)=> {
            const checkbox = document.createElement('input');
            checkbox.type = "checkbox";

            let label = document.createElement('label')

            checkbox.setAttribute("data-hole", JSON.stringify(hole));
            checkbox.setAttribute("checked", true);
            checkbox.addEventListener("change", e => {
                debug.rebuildGeometry();
            });
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode('enable hole ' + index));
            debug.elems.generated.appendChild(label);


            // creates number:
            const number = document.createElement('input');
            number.type = "number";
            number.setAttribute("value", hole.depth);
            number.addEventListener("change", e => {
                debug.rebuildGeometry();
            });

            const div = document.createElement('div');
            div.classList.add("depthcontainer");
            label = document.createElement('label')
            label.appendChild(document.createTextNode('Depth: '));
            label.appendChild(number);
            div.appendChild(label);
            debug.elems.generated.appendChild(div);

            const br = document.createElement('br');
            debug.elems.generated.appendChild(br);

        });

    },

    getData() {
        holesCheckboxes = document.getElementById('generated-data').querySelectorAll("input[type='checkbox']");
        holesDepths = document.getElementById('generated-data').querySelectorAll("input[type='number']");

        const holes =  [...holesCheckboxes].map( (checkbox, index ) => {
             if(checkbox.checked){
                 const val = debugger3d.toClipperString(checkbox.getAttribute("data-hole"));
                 const hole = JSON.parse(val);
                 hole.depth = +holesDepths[index].value;
                 return hole;
             }
         }).filter (elt => elt);
         const val = debugger3d.toClipperString(debug.elems.outerShape.value);
         const outerShape = JSON.parse(val);
         const options = {};
         return {outerShape, holes, options};
    },

    getDataFromTests(funcName, index) {
        const test = getholes[funcName]()[index];
        baseholes = JSON.parse(JSON.stringify(test.holes));
        outerShape = JSON.parse(JSON.stringify(test.outerShape));
    },

    rebuildGeometry() {
        debug.elems.container.innerHTML = "";
        const {holes,outerShape} = debug.getData();
        debugger2d.traceAllData(outerShape, holes);
        debugger3d.rebuild(outerShape, holes);
        debug.logData(outerShape, holes);
    },

    refresh() {
        debug.elems.generated.innerHTML = "";
        debug.createCheckboxesPaths(JSON.parse(debug.elems.holes.value));
        debug.rebuildGeometry();
    },

    getCheckboxValue(targetName) {

        const checkbox = debug.elems.debugCheckboxes.find(elt => elt.getAttribute("data-target") === targetName);
        return checkbox.checked;
    },

    logData(outerShape, holes) {

        console.log("---begin---");

        let cpyHoles = debugger2d._objectClone(holes);
        let cpyOuterShape = debugger2d._objectClone(outerShape);
        holesIn.scaleUpPath(cpyOuterShape.path);
        for (let i = 0; i < cpyHoles.length; i++) {
            holesIn.scaleUpPath(cpyHoles[i].path);
        }
        if(debug.getCheckboxValue("debugHolesByDepth")) {
            debugger;
        }
        let holesByDepth = holesIn.getHolesByDepth(cpyHoles, cpyOuterShape);

        if(debug.getCheckboxValue("logHolesByDepth")) {
            console.log("holesByDepth", holesByDepth);
        }
        cpyHoles = debugger2d._objectClone(holes);
        cpyOuterShape = debugger2d._objectClone(outerShape);
        if(debug.getCheckboxValue("debugDataByDepth")) {
            debugger;
        }
        let dataByDepth = holesIn.getDataByDepth(cpyOuterShape, cpyHoles);
        if(debug.getCheckboxValue("logDataByDepth")) {
            console.log("dataByDepth", dataByDepth);
        }

        if(debug.getCheckboxValue("debugTriangulation")) {
            debugger;
        }
        dataByDepth.horizontalPathsByDepth.forEach((dataAtDepth, index) => {
            const triangles = holesIn.computeTriangulation(dataAtDepth.paths);
            if(debug.getCheckboxValue("logTriangulation")) {
                console.log("triangles at depth ", index," : ", triangles);
            }
        });



        if(debug.getCheckboxValue("debugGeometry")) {
            debugger;
        }

        let cpyOptions = JSON.parse(JSON.stringify(debugger3d.options));
        let cpyOut= JSON.parse(JSON.stringify(outerShape));
        cpyHoles= JSON.parse(JSON.stringify(holes));
        let cpyDoNotBuild= JSON.parse(JSON.stringify(holes));


        if(debugger3d.doNotBuild) {
            cpyOptions.doNotBuild = JSON.parse(JSON.stringify(debugger3d.doNotBuild));
        }
        if(debug.getCheckboxValue("debugGeometry")) {
            debugger;
        }
        let geom= holesIn.getGeometry(cpyOut,cpyHoles,cpyOptions);

        if(debug.getCheckboxValue("logGeometry")) {
            if(geom.frontMesh) console.log("front: ",geom.frontMesh.faces.length);
            if(geom.backMesh) console.log("back: ",geom.backMesh.faces.length);
            if(geom.outMesh) console.log("out: ",geom.outMesh.faces.length);
            if(geom.inMesh) console.log("in: ",geom.inMesh.faces.length);
            if(geom.horizontalMesh) console.log("horr: ",geom.horizontalMesh.faces.length);
            console.log("geom: ",geom);
        }

        console.log("---end---");
    },


    startNewDraw(){
        const data = debug.getData();

        let cpyHoles = debugger2d._objectClone(data.holes);
        let cpyOuterShape = debugger2d._objectClone(data.outerShape);
        holesIn.scaleUpPath(cpyOuterShape.path);
        for (let i = 0; i < cpyHoles.length; i++) {
            holesIn.scaleUpPath(cpyHoles[i].path);
        }
        let holesByDepth = holesIn.getHolesByDepth(cpyHoles, cpyOuterShape);
        const transform = debugger2d.getTransform(cpyOuterShape, cpyHoles, holesByDepth.length);

        cpyHoles = debugger2d._objectClone(data.holes);
        cpyOuterShape = debugger2d._objectClone(data.outerShape);
        let dataByDepth = holesIn.getDataByDepth(cpyOuterShape, cpyHoles);

        const parent = document.getElementById("container");
        const canvas = debugger2d.createCanvas("newCanvas", parent, debugger2d.cssclass);
        const ctx = canvas.getContext("2d");
        debug.scrollDown();
        debugger;

        pathTracer.tracePath(ctx, [], transform);
        /* drawinbg functions :
            pathTracer.tracePath(ctx, path,  transform)
            pathTracer.traceTriangulation(ctx, triangulation, transform)
            pathTracer.tracePathsInRow(canvas, paths,transform)
            debugger2d.translateRight(transform)
            debugger2d.traceDelimiter(canvas, x)
        */

    },

    scrollDown(){
        window.scrollTo(0,Math.max( document.body.scrollHeight, document.body.offsetHeight,
                       document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight ))
    },




};

module.exports = debug;
