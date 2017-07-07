"use strict";

const pathTracer = {


    tracePath(ctx, path, strokeStyle = "black", fillStyle = "", translation = {X:0 , Y: 0}, scale = 1) {
        if(path.length === 0) return;
        const scaled = path.map(pt => ({X: (pt.X * scale), Y: (pt.Y * scale) }) );

        let lineWidth = 4;
        if(strokeStyle === "") {
            lineWidth = 0;
        }

        ctx.strokeStyle = strokeStyle;
        ctx.fillStyle = fillStyle;
        ctx.lineWidth = lineWidth;

        ctx.beginPath();

        ctx.moveTo(scaled[0].X + translation.X-1, scaled[0].Y + translation.Y);
        scaled.forEach(pt => {
            ctx.lineTo(pt.X + translation.X, pt.Y + translation.Y);
        });
        ctx.lineTo(scaled[0].X + translation.X, scaled[0].Y + translation.Y);
        if(fillStyle !== ""){
            ctx.fill();
        }
        ctx.stroke();
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

        // paths.forEach(path => {
        //     const  transform = pathTracer.getFitTransformation(path, width, height);
        //     if(transform.scale < minScale) {
        //         res = transform;
        //     }
        // });
        return pathTracer.getFitTransformation(allPaths, width, height);;
    },

    tracePathsInRow(canvas, paths, strokeStyle = "black", fillStyle = "white", transform) {
        if(paths.length === 0) return;
        if(!transform){
            const width = 0.90 * canvas.width / paths.length;
            const height = 0.90 * canvas.height;
            transform = pathTracer.getMaxFitTransform([paths[0]], width, height);
        }

        const ctx = canvas.getContext("2d");
        pathTracer.tracePath(ctx, paths[0], strokeStyle, fillStyle, transform.translation, transform.scale);
        return transform;
    },

};

module.exports = pathTracer;
