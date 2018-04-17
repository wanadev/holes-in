"use strict";

// const pathHelper = require("./path-helper.js");

var drawHelper = {

    colors: ["green", "red", "blue", "purple"],
    strokeColors: ["black", "black", "black", "black"],

    drawPaths: function drawPaths(ctx, paths, position, fillColors, strokeColors, fillModes) {
        if (!fillModes) fillModes = [];
        if (!fillColors) fillColors = drawHelper.colors;
        if (!strokeColors) strokeColors = drawHelper.strokeColors;

        for (var i = 0; i < paths.length; i++) {
            drawHelper.drawPath(ctx, paths[i], position, fillColors[i], strokeColors[i], fillModes[i]);
        }
    },
    drawPath: function drawPath(ctx, pathToDraw, position, fillColor, strokeColor, fillMode) {
        if (!position) {
            position = {
                X: 0,
                Y: 0
            };
        }
        var path = [];
        if (pathToDraw.length === 0) return;
        for (var i = 0; i < pathToDraw.length; i++) {
            path.push({
                X: pathToDraw[i].X + position.X,
                Y: pathToDraw[i].Y + position.Y
            });
        }

        ctx.lineWidth = 2;
        if (!fillColor) {
            fillColor = "black";
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

        // Draws the inner of the path
        var pathFill = new Path2D();
        pathFill.moveTo(path[0].X, path[0].Y);
        for (var _i = 0; _i < path.length; _i++) {

            pathFill.lineTo(path[_i].X, path[_i].Y);
        }
        pathFill.lineTo(path[0].X, path[0].Y);
        ctx.fill(pathFill, fillMode);
        ctx.closePath();
        // Draws the arrows
        /*    var pathArrow = new Path2D();
            for (let i = 0; i < path.length - 1; i++) {
                drawHelper.drawArrow(ctx, path[i], path[i + 1]);
            }
            drawHelper.drawArrow(ctx, path[path.length - 1], path[0]);
        
            //Draws the dots:
            for (let i = 0; i < path.length; i++) {
                drawHelper.drawDot(ctx, path[i]);
            }
        */
    },
    drawArrow: function drawArrow(ctx, begin, end) {

        ctx.save();
        ctx.moveTo(begin.X, begin.Y);
        ctx.lineTo(end.X, end.Y);
        ctx.stroke();

        var vect = {
            X: end.X - begin.X,
            Y: end.Y - begin.Y
        };
        var norm = Math.sqrt(vect.X * vect.X + vect.Y * vect.Y);
        vect = {
            X: vect.X / norm,
            Y: vect.Y / norm
        };

        var angle = Math.PI / 2 + Math.atan2(vect.Y, vect.X);

        ctx.translate(begin.X + vect.X * norm * 0.75, begin.Y + vect.Y * norm * 0.75);
        ctx.rotate(angle);

        var sizeA = 5;
        var branch1 = {
            X: sizeA,
            Y: sizeA
        };
        var branch2 = {
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
    drawDot: function drawDot(ctx, dot) {

        ctx.fillStyle = "red";
        ctx.fillRect(dot.X, dot.Y, 4, 4);
    },
    drawTriangles: function drawTriangles(ctx, pointsAndTriangles, translation) {
        for (var i = 0; i < pointsAndTriangles.triangles.length; i++) {
            drawHelper.drawTriangle(ctx, pointsAndTriangles.points, pointsAndTriangles.triangles[i], translation);
        }
    },
    drawTriangle: function drawTriangle(ctx, points, triangle, translation) {
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
module.exports = drawHelper;