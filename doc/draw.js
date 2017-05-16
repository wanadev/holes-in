

var drawHelper = {
    colors= ["#c02525","#84c025","#8d4ead"],
    strokeColors= ["black","black","black"],
    pointA= {X:0,Y:100},
    pointB= {X:150,Y:100},
    pointC= {X:300,Y:100},
    pointD= {X:450,Y:100},
    pointE= {X:600,Y:100},
    pointF= {X:750,Y:100},
    points=[pointA,pointB,pointC,pointD,pointE,pointF],


     drawText: function(ctx, text, point= drawHelper.pointA){
        ctx.fillStyle= "black";
        ctx.font="20px Georgia";
        ctx.fillText(text,point.X,300 - 30);
    },


    drawInitialPaths:function(ctx,outerShape, holes){
         holesIn.drawPath(ctx, outerShape.path, drawHelper.pointA, ["yellow"],[]);
         for(let i in holes)
         {
            holesIn.drawPath(ctx, holes[i].path, drawHelper.pointA, colors[i],[]);
         }
         drawText(ctx, "Initial paths",pointB);
    },

    drawPathsByDepth:function(ctx,pathsByDepth){
         for(let i in pathsByDepth)
         {
            holesIn.drawPath(ctx, pathsByDepth[i].path, pointA, colors[i],[]);
        }
    },

};
module.exports = drawHelper;
