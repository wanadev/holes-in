"use strict";

const pathTracer = {


    tracePath(ctx, path,  transform, strokeStyle = "black", fillStyle = "",arrow = false) {
        if(path.length === 0) return;
        const scale = transform.scale;
        const translation = transform.translation;

        const transformed = path.map(pt => ({X: (pt.X * scale) + translation.X,
             Y: (pt.Y * scale) + translation.Y }) );

        let lineWidth = 1;
        if(strokeStyle === "") {
            lineWidth = 0;
        }

        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = lineWidth;

        if(arrow) {
            for(let i = 0 ; i < transformed.length; i++) {
                    pathTracer.traceArrow(ctx, transformed[i], transformed[(i+1)%transformed.length]);
            }
        }  else {
            ctx.beginPath();
            ctx.moveTo(transformed[0].X -1, transformed[0].Y );
            transformed.forEach(pt => {
                ctx.lineTo(pt.X, pt.Y);
            });
            ctx.lineTo(transformed[0].X, transformed[0].Y);
            if(fillStyle !== ""){
                ctx.fill();
            }
            ctx.stroke();
        }


    },

    traceTriangulation(ctx, triangulation, transform, strokeStyle = "black", fillStyle = "") {
        if(triangulation.points.length === 0) return;
        const scale = transform.scale;
        const translation = transform.translation;
        const transformed = triangulation.points.map(arr => ({X: (arr[0] * scale) + translation.X,
             Y: (arr[1] * scale)+ translation.Y }) );

        let lineWidth = 1;
        if(strokeStyle === "") {
            lineWidth = 0;
        }

        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = lineWidth;

        triangulation.triangles.forEach(triangle => {
            ctx.beginPath();
            let pt = transformed[triangle[0]];
            ctx.moveTo(pt.X -1, pt.Y);
            pt = transformed[triangle[1]];
            ctx.lineTo(pt.X, pt.Y);
            pt = transformed[triangle[2]];
            ctx.lineTo(pt.X, pt.Y);
            pt = transformed[triangle[0]];
            ctx.lineTo(pt.X, pt.Y);
            ctx.stroke();
            if(fillStyle !== ""){
                ctx.fill();
            }
        });
    },




    getFitTransformation(path, width, height) {
        const minMax = path.reduce( (res, pt) => {
            pt.X > res.max.X ? res.max.X = pt.X : res.max.X = res.max.X;
            pt.Y > res.max.Y ? res.max.Y = pt.Y : res.max.Y = res.max.Y;
            pt.X < res.min.X ? res.min.X = pt.X : res.min.X = res.min.X;
            pt.Y < res.min.Y ? res.min.Y = pt.Y : res.min.Y = res.min.Y;
            return res;
        }, {min:{X:Infinity,Y:Infinity}, max:{X:-Infinity,Y:-Infinity}});

        const widthPath = minMax.max.X - minMax.min.X;
        const heightPath = minMax.max.Y - minMax.min.Y;

        const scale = Math.min(width / widthPath, height / heightPath);
        const translation = {X: -minMax.min.X * scale, Y : -minMax.min.Y * scale};

        return {scale, translation, width, height};
    },

    getMaxFitTransform(paths, width, height) {
        const minScale = Infinity;
        let res = null;
        const allPaths = paths.reduce( (acc, path ) => { return acc.concat(path) }, []);
        return pathTracer.getFitTransformation(allPaths, width, height);;
    },

    tracePathsInRow(canvas, paths, transform, strokeStyle = "black", fillStyle = "white") {
        if(paths.length === 0) return;
        if(!transform){
            const width = 0.90 * canvas.width / paths.length;
            const height = 0.90 * canvas.height;
            transform = pathTracer.getMaxFitTransform([paths[0]], width, height);
        }

        const ctx = canvas.getContext("2d");
        paths.forEach( (path,index) => {
            let color = strokeStyle;
            if(strokeStyle == "shades"){
                color = 'rgb(' + Math.floor(50 + 100* index / paths.length) +','+
                                 Math.floor(50 + 100* index / paths.length)  +','+
                                 Math.floor(50 + 100* index / paths.length) +')';
            }
            pathTracer.tracePath(ctx, path,  transform, color, fillStyle);
        });
    },


    traceArrow(ctx, begin, end) {

        ctx.save();
        ctx.moveTo(begin.X, begin.Y);
        ctx.lineTo(end.X, end.Y);
        ctx.stroke();

        let vect = {
            X: end.X - begin.X,
            Y: end.Y - begin.Y,
        };
        const norm = Math.sqrt(vect.X * vect.X + vect.Y * vect.Y);
        vect = {
            X: vect.X / norm,
            Y: vect.Y / norm,
        };

        const angle = Math.PI / 2 + Math.atan2(vect.Y, vect.X);

        ctx.translate(begin.X + vect.X * norm * 0.75, begin.Y + vect.Y * norm * 0.75);
        ctx.rotate(angle);

        const sizeA = 5;
        const branch1 = {
            X: sizeA,
            Y: sizeA,
        };
        const branch2 = {
            X: -sizeA,
            Y: sizeA,
        };

        ctx.beginPath();
        ctx.moveTo(branch1.X, branch1.Y);
        ctx.lineTo(0, 0);
        ctx.lineTo(branch2.X, branch2.Y);
        ctx.stroke();

        ctx.restore();
    }

};

module.exports = pathTracer;
