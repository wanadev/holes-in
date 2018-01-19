// const paper = require("paper");


const shapeEditor= {
/*
    outPath: null,
    holesPaths: [],
    mode: "default",


    initIntoCanvas(canvas, outButton, holeButton, defaultButton) {
        shapeEditor.canvas = canvas;
        canvas.style.width = "512px";
        canvas.style.height = "512px";
        canvas.width = 512;
        canvas.height = 512;
		// Create an empty paper.project and a view for the canvas:
        paper.setup(canvas);
        window.paper = paper;

        shapeEditor.tool = new paper.Tool();
        shapeEditor.tool.on("mousedown", this.onMouseDown);
        shapeEditor.tool.on("mousemove", this.onMouseMove);
        shapeEditor.tool.on("mousedrag", this.onMouseDrag);

        outButton.addEventListener("click", () => { shapeEditor.onModeChange("out"); });
        holeButton.addEventListener("click", () => { shapeEditor.onModeChange("hole"); });
        defaultButton.addEventListener("click", () => { shapeEditor.onModeChange("default"); });


        const rect = new paper.Rectangle(
          new paper.Point(
            10,
            10
          ),
          100,
          100
        );

        const path = paper.Path.Rectangle(rect);
        path.fillColor = new paper.Color(255,255,255,127);
		path.strokeColor = 'black';
		paper.view.draw();
    },

    onModeChange(mode) {

        // settup the path:
        if(mode == "out" &&  shapeEditor.buildingPath && shapeEditor.buildingPath.segments.length > 2) {
            outPath = JSON.parse(JSON.stringify(shapeEditor.buildingPath));
        }

        if(mode == "hole" &&  shapeEditor.buildingPath && shapeEditor.buildingPath.segments.length > 2) {
            holesPaths.push(JSON.parse(JSON.stringify(shapeEditor.buildingPath)));
        }

        shapeEditor.buildingPath = new paper.Path();
        if(mode == "out") {
            shapeEditor.buildingPath.strokeColor = 'black';
            shapeEditor.buildingPath.fillColor = new paper.Color(255,255,255,127);
            shapeEditor.buildingPath.opacity =  0.5;
        }
        else {
             shapeEditor.buildingPath.strokeColor = 'black';
             shapeEditor.buildingPath.fillColor = new paper.Color(255,0,0,127);
             shapeEditor.buildingPath.opacity =  0.5;

        }
        shapeEditor.previousPoint = null;
        shapeEditor.mode = mode;
    },

    onClickAddPoint(event) {
        console.log("event", event);

        const pt = event.downPoint;
        shapeEditor.buildingPath.add(pt);
        shapeEditor.buildingPath.closed = true;
        shapeEditor.previousPoint = pt;
    },

     onMouseDown(event) {
         if(shapeEditor.mode !== "default") {
             if(event.event.button !== 0 ) {
                 shapeEditor.onModeChange("default");
                 return;
             }
             shapeEditor.onClickAddPoint(event);
             return;
         }

         const hitOptions = {
        	segments: true,
        	stroke: true,
        	fill: true,
        	tolerance: 5
        };

        this.selectedPath = this.selectedSegment = null;
    	var hitResult = paper.project.hitTest(event.point, hitOptions);
    	if (!hitResult)
    		return;

    	if (event.modifiers.shift) {
    		if (hitResult.type == 'segment') {
    			hitResult.segment.remove();
    		};
    		return;
    	}
    	if (hitResult) {
    		this.selectedPath = hitResult.item;
    		if (hitResult.type == 'segment') {
    			this.selectedSegment = hitResult.segment;
    		} else if (hitResult.type == 'stroke') {
    			var location = hitResult.location;
    			this.selectedSegment = this.selectedPath.insert(location.index + 1, event.point);
    		}
    	}

    	if (hitResult.type == 'fill')
    		paper.project.activeLayer.addChild(hitResult.item);
  },

     onMouseMove(event) {
         if(shapeEditor.tempSegment) {
             shapeEditor.tempSegment.removeSegments();
         }

         if(shapeEditor.mode !=="default" && shapeEditor.previousPoint) {
             shapeEditor.tempSegment = new paper.Path();
             shapeEditor.tempSegment.strokeColor = 'black';
             shapeEditor.tempSegment.add(shapeEditor.previousPoint);
             shapeEditor.tempSegment.add(event.point);
             return;
         }

        paper.project.activeLayer.selected = false;
        if (event.item) {
            event.item.selected = true;
        }

        hitResult = paper.project.hitTest(event.point, {
        	segments: true,
        	stroke: true,
        	fill: true,
        	tolerance: 5
        });

        if (!hitResult) {
            shapeEditor.canvas.style.cursor = "default";
        } else if (hitResult.type == 'segment') {
			shapeEditor.canvas.style.cursor = "move";
		} else if (hitResult.type == 'stroke') {
            shapeEditor.canvas.style.cursor = "crosshair";
		} else if (hitResult.type == 'fill'){
            shapeEditor.canvas.style.cursor = "pointer";
        }
    },

     onMouseDrag(event) {
         if (this.selectedSegment) {
     		this.selectedSegment.point = this.selectedSegment.point.add(event.delta);
     	} else if (this.selectedPath) {
            this.selectedPath.position = this.selectedPath.position.add(event.delta);
     	}
    },

*/


};

module.exports = shapeEditor;
