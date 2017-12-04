"use-strict";

const pathTracer = require("./pathTracer");
const debugger2d = require("./debugger2d");
const debugger3d = require("./debugger3d");
const store = require("store");
const holesIn = require("../../lib/index");
const extruder = require("../../lib/extruder");
const cdt2dHelper = require("../../lib/cdt2d-helper");
const cdt2d = require("cdt2d");
const getHoles = require("../../tests/holes");
const stringify = require("json-stringify-pretty-compact")


const debug = {
    elems: null,

    init() {
        window.getHoles = getHoles;
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
                      textureSelect: document.getElementById("textureSelect"),
                      debugCheckboxes:  [...document.getElementById('logs').getElementsByTagName('input')]
                  };

        if(store.get("outerShape")) {
            debug.elems.outerShape.value = store.get("outerShape");
        }
        if(store.get("holes")) {
            debug.elems.holes.value = store.get("holes");
        }
        if(store.get("doNotBuild")) {
            debug.elems.doNotBuild.value = store.get("doNotBuild").trim();
        }
        const urlOuterShape = getParameterByName("outerShape")
        if(urlOuterShape){
            debug.elems.outerShape.value = urlOuterShape;
        }
        const urlHoles = getParameterByName("holes")
        if(urlHoles){
            debug.elems.holes.value = urlHoles;
        }

        const urlDoNotBuild = getParameterByName("doNotBuild")
        if(urlDoNotBuild){
            debug.elems.holes.value = urlDoNotBuild;
        }

        debugger2d.elems = debug.elems;
        debugger3d.elems = debug.elems;
        debugger3d.init();

        debug.elems.submit.addEventListener("click", () => {
            store.set('outerShape', debug.elems.outerShape.value);
            store.set('holes', debug.elems.holes.value);
            store.set('doNotBuild', debug.elems.doNotBuild.value);
            debug.refresh();
            window.location.href = "#page";
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

        // shapeEditor.initIntoCanvas(debug.elems.interactiveCanvas, debug.elems.shapeEditorOutButton,
        //                     debug.elems.shapeEditorHoleButton, debug.elems.shapeEditorDefaultButton);

        // init unitary tests select :
        getHoles.getTestPaths().concat(getHoles.getTestDoNotBuild()).forEach((test, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.innerHTML = index +"--" + test.name;
            debug.elems.testSelect.appendChild(option);
        });

        debug.elems.testSelect.addEventListener('change', function() {
            const unitaryTest = getHoles.getTestPaths().concat(getHoles.getTestDoNotBuild())[debug.elems.testSelect.selectedIndex];
            const options = getHoles.getDefaultOptions();
            const jsonOuterSape = JSON.stringify(unitaryTest.outerShape);
            const jsonHoles = JSON.stringify(unitaryTest.holes);
            debug.elems.holes.value = jsonHoles;
            debug.elems.outerShape.value = jsonOuterSape;

            if(unitaryTest.doNotBuild) {
                const jsonDoNotBuild = JSON.stringify( getHoles.doNotBuild(unitaryTest.doNotBuild));
                debug.elems.doNotBuild.value = jsonDoNotBuild;
            }

            debug.refresh();

         }, false);


    },

    createCheckboxesPaths() {
        debug.elems.generated.innerHTML = "<h3>Input holes</h3>";
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
                 const hole = JSON.parse(val.replace(/x/g, "X").replace(/y/g, "Y"));
                 hole.depth = +holesDepths[index].value;
                 return hole;
             }
         }).filter (elt => elt);
         const outerShape = JSON.parse(debug.elems.outerShape.value.replace(/x/g, "X").replace(/y/g, "Y"));
         return {outerShape, holes, doNotBuild: debugger3d.doNotBuild};
    },

    getDataFromTests(funcName, index) {
        const test = getholes[funcName]()[index];
        baseholes = JSON.parse(JSON.stringify(test.holes));
        outerShape = JSON.parse(JSON.stringify(test.outerShape));
    },

    rebuildGeometry() {
        debug.elems.container.innerHTML = "";
        const {holes,outerShape, doNotBuild} = debug.getData();
        debugger2d.traceAllData(outerShape, holes, doNotBuild);
        debugger3d.rebuild(outerShape, holes);
        debug.logData(outerShape, holes);
    },

    refresh() {
        debug.elems.generated.innerHTML = "";
        debug.createCheckboxesPaths(JSON.parse(debug.elems.holes.value));
        debug.rebuildGeometry();

        if (debug.elems.outerShape.value) {
            debug.elems.outerShape.value = stringify(JSON.parse(debug.elems.outerShape.value), null, 2);
        }
        if (debug.elems.holes.value) {
            debug.elems.holes.value = stringify(JSON.parse(debug.elems.holes.value), null, 2);
        }
        if (debug.elems.doNotBuild.value) {
            debug.elems.doNotBuild.value = stringify(JSON.parse(debug.elems.doNotBuild.value), null, 2);
        }
    },

    getCheckboxValue(targetName) {

        const checkbox = debug.elems.debugCheckboxes.find(elt => elt.getAttribute("data-target") === targetName);
        return checkbox.checked;
    },

    logData(outerShape, holes) {

        console.log("---begin---");

        let cpyHoles = debugger2d._objectClone(holes);
        let cpyOuterShape = debugger2d._objectClone(outerShape);

        if(debug.getCheckboxValue("debugDataByDepth")) {
            debugger;
        }
        let dataByDepth = extruder.getDataByDepth(cpyOuterShape, cpyHoles);
        if(debug.getCheckboxValue("logDataByDepth")) {
            console.log("dataByDepth", dataByDepth);
        }

        if(debug.getCheckboxValue("debugTriangulation")) {
            debugger;
        }
        dataByDepth.horizontalPathsByDepth.forEach((dataAtDepth, index) => {
            const triangles = cdt2dHelper.computeTriangulation(dataAtDepth.paths);
            if(debug.getCheckboxValue("logTriangulation")) {
                console.log("triangles at depth ", index," : ", triangles);
            }
        });

        let cpyOptions = JSON.parse(JSON.stringify(debugger3d.options));
        let cpyOut= JSON.parse(JSON.stringify(outerShape));
        cpyHoles= JSON.parse(JSON.stringify(holes));

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


    },

    scrollDown(){
        window.scrollTo(0,Math.max( document.body.scrollHeight, document.body.offsetHeight,
                       document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight ))
    },

    getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }



};

module.exports = debug;
