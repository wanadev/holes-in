
const pathHelper = require("./path-helper.js");
const cdt2dHelper = require("./cdt2d-helper.js");


var pathsByDepth = {

    data:[],


    /**
     * Returns the depths at which they are two edges with the same 2D coords.
     * If it does not exists such a edge, returns the current depth and the depth above
     */
    getMatchDepths: function(position) {
        //for each depth deeper than pathUp,we look for a corresponding point:

        iterateThroughPoints:

        let depthUp = pathsByDepth[indexDepth - 1].depth;
        let depthDwn = pathsByDepth[indexDepth].depth;
        let indexPtUp=0;
        let indexPathUp=0;
        let indexDepthUp= 0;
        for (let i = indexDepth - 1; i >= 0; i--) {
            let pathsAtDepth = pathsByDepth[i].paths;
            for (let j = 0; j < pathsAtDepth.length; j++) {
                //for each path at each depth:
                let pathUp = pathsAtDepth[j];
                let match1 = pathHelper.getPointMatch(pathUp, ptDwn);
                let match2 = pathHelper.getPointMatch(pathUp, nPtDwn);
                if (!match1 || !match2) {
                    continue;
                }
                if (pathUp[match1.index].visited) {
                    return;
                }
                indexPtUp= match1.index;
                indexPathUp=j;
                indexDepthUp=i;
                depthUp = pathsByDepth[i].depth;
                depthDwn = pathsByDepth[indexDepth].depth;
                pathsByDepth[i].paths[j][match1.index].visited = true;
            }
        }
        return {
            depthUp: depthUp,
            depthDwn: depthDwn,
            indexPathUp:indexPathUp,
            indexPtUp: indexPtUp,
            indexDepthUp:indexDepthUp
        };
    },


    iterateThroughPoints:function( position,func,args ){

        for(let d in position.depth)
        {
            for(let i in position.path)
            {
                for(let j in position.index){
                    let pos= {depth:d, path:i, index:j};
                    func( pathsByDepth.data[d].paths[i][j],position,...args);
                }
            }
        }
    },

    iterateThroughPointsDepthInv:function( position,func,args ){

            for(let d= position.depth-1; d>=0;d--){
                let paths= pathsByDepthHelper.data[d].paths
                for(let i in paths)
                {
                    for(let j in paths[i])
                    {
                        let pos= {depth:d, path:i, index:j};
                        func(paths[i][j],position,pos,...args);
                    }
                }
            }
    }




};
module.exports = pathsByDepth;
