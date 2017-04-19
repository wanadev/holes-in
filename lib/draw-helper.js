"use strict";

var pathHelper= require("./path-helper.js");

var drawHelper={



drawPaths: function(ctx, paths, position, fillColors, strokeColors, fillModes) {
    if (!fillModes) fillModes = [];
    if(!fillColors) fillColors = drawHelper.colors;
    if(!strokeColors) strokeColors = drawHelper.strokeColors;

    for (let i in paths) {
        drawHelper.drawPath(ctx, paths[i], position, fillColors[i], strokeColors[i], fillModes[i]);
    }
},

drawPath: function(ctx, pathToDraw, position, fillColor, strokeColor, fillMode) {
    if (!position) position = {
        X: 0,
        Y: 0
    };
    let path = [];
    if (pathToDraw.length === 0) return;
    for (let i in pathToDraw) {
        path.push({
            X: pathToDraw[i].X + position.X,
            Y: pathToDraw[i].Y + position.Y
        });
    }


    ctx.lineWidth = 2;
    if (!fillColor) {
        fillColor = 'black';
    }
    ctx.fillStyle = fillColor;
    if (!strokeColor) {
        strokeColor = "black";
    }
    ctx.strokeStyle = strokeColor;
    if (!fillMode) {
        fillMode = "nonzero";
    }
    ctx.mozFillRule = fillMode;

    //Draws the inner of the path
    var pathFill = new Path2D();
    pathFill.moveTo(path[0].X, path[0].Y);
    for (let i = 0; i < path.length; i++) {
        pathFill.lineTo(path[i].X, path[i].Y);
    }
    pathFill.lineTo(path[0].X, path[0].Y);
    ctx.fill(pathFill, fillMode);
    ctx.closePath();
    //Draws the arrows
    var pathArrow = new Path2D();
    for (let i = 0; i < path.length - 1; i++) {
        drawHelper.drawArrow(ctx, path[i], path[i + 1]);
    }
    drawHelper.drawArrow(ctx, path[path.length - 1], path[0]);

    //Draws the dots:
    for (let i = 0; i < path.length; i++) {
        drawHelper.drawDot(ctx, path[i]);
    }
},
drawArrow(ctx, begin, end) {

    ctx.save();
    ctx.moveTo(begin.X, begin.Y);
    ctx.lineTo(end.X, end.Y);
    ctx.stroke();

    let vect = {
        X: end.X - begin.X,
        Y: end.Y - begin.Y
    };
    let norm = Math.sqrt(vect.X * vect.X + vect.Y * vect.Y);
    vect = {
        X: vect.X / norm,
        Y: vect.Y / norm
    };

    let angle = Math.PI / 2 + Math.atan2(vect.Y, vect.X);

    ctx.translate(begin.X + vect.X * norm * 0.75, begin.Y + vect.Y * norm * 0.75);
    ctx.rotate(angle);

    let sizeA = 5;
    let branch1 = {
        X: sizeA,
        Y: sizeA
    };
    let branch2 = {
        X: -sizeA,
        Y: sizeA
    };

    ctx.beginPath();
    ctx.moveTo(branch1.X, branch1.Y);
    ctx.lineTo(0, 0);
    ctx.lineTo(branch2.X, branch2.Y);
    ctx.stroke();

    ctx.restore();
},

drawDot: function(ctx, dot) {

    ctx.fillStyle = "red";
    ctx.fillRect(dot.X, dot.Y, 4, 4);
},

drawTriangles: function(ctx, pointsAndTriangles, translation) {
    for (let i in pointsAndTriangles.triangles) {
        cdt2dHelper.drawTriangle(ctx, pointsAndTriangles.points, pointsAndTriangles.triangles[i], translation);
    }
},

drawTriangle: function(ctx, points, triangle, translation) {
    if (!translation) {
        translation = {
            X: 0,
            Y: 0
        };
    }
    ctx.beginPath();
    ctx.moveTo(points[triangle[0]][0] + translation.X, points[triangle[0]][1] + translation.Y);
    ctx.lineTo(points[triangle[1]][0] + translation.X, points[triangle[1]][1] + translation.Y);
    ctx.lineTo(points[triangle[2]][0] + translation.X, points[triangle[2]][1] + translation.Y);
    ctx.lineTo(points[triangle[0]][0] + translation.X, points[triangle[0]][1] + translation.Y);
    ctx.stroke();

}

};
module.exports= drawHelper;
