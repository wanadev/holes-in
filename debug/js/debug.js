"use-strict";

const debugger2d = require("./debugger2d");
const debugger3d = require("./debugger3d");
const store = require("store");

const debug = {
    elems: null,

    init() {
        debug.elems =  { outerShape: document.getElementById("outerShape"),
                      holes: document.getElementById("holes"),
                      submit: document.getElementById("submit"),
                      container: document.getElementById("container"),
                      generated: document.getElementById("generated-data")
                  };

        if(store.get("outerShape")){
            debug.elems.outerShape.value = store.get("outerShape");
        }
        if(store.get("holes")){
            debug.elems.holes.value = store.get("holes");
        }

        debugger2d.elems = debug.elems;
        debugger3d.elems = debug.elems;
        debugger3d.init();

        debug.elems.submit.addEventListener("click", () => {
            store.set('outerShape', debug.elems.outerShape.value);
            store.set('holes', debug.elems.holes.value);
            debug.refresh();
        });

        debug.elems.submit.dispatchEvent(new Event('click'));

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
        const checkboxes = document.getElementById('generated-data').querySelectorAll("input[type='checkbox']");
        const numbers = document.getElementById('generated-data').querySelectorAll("input[type='number']");

        const holes =  [...checkboxes].map( (checkbox, index ) => {
             if(checkbox.checked){
                 const hole = JSON.parse(checkbox.getAttribute("data-hole"));
                 hole.depth = numbers[index].value;
                 return hole;
             }
         }).filter (elt => elt);
         return holes;
    },

    rebuildGeometry() {
        debug.elems.container.innerHTML = "";
        const holes = debug.getData();
        const outerShape = JSON.parse(debug.elems.outerShape.value);
        debugger2d.traceAllData(outerShape, holes);
        debugger3d.rebuild(outerShape, holes);
    },

    refresh() {
        debug.elems.generated.innerHTML = "";
        debug.createCheckboxesPaths(JSON.parse(debug.elems.holes.value));
        debug.rebuildGeometry();
    }


};

module.exports = debug;
