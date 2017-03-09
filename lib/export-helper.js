"use-strict";


var exportHelper = {


    meshesToObj(meshes){
        let res="";

        for(let i in meshes){
            res+=exportHelper.meshToObj(meshes.inMesh, "mesh"+i);
            res += "\n";
        }

        /*if(meshes.inMesh)
        {
            res+=exportHelper.meshToObj(meshes.inMesh, "inMesh");
            res += "\n";
        }
        if(meshes.outMesh)
        {
            res+=exportHelper.meshToObj(meshes.outMesh, "outMesh");
            res += "\n";
        }
        if(meshes.frontMesh)
        {
            res+=exportHelper.meshToObj(meshes.frontMesh, "frontMesh");
            res += "\n";
        }
        if(meshes.backMesh)
        {
            res+=exportHelper.meshToObj(meshes.backMesh, "backMesh");
            res += "\n";
        }*/
        return res;
    },

    meshToObj: function(mesh, meshName) {
        let res = "o " + meshName + "\n\n";
        res += exportHelper.verticesToObj(mesh.points);
        res += "\n";
        res += exportHelper.normalsToObj(mesh.normals);
        //    res+="\n";
        //    res+= exportHelper.texturesToObj(mesh.uvs);

        res += "\n";
        res += exportHelper.facesToObj(mesh.faces);
        return res;

    },
    verticesToObj: function(vertices) {

        return exportHelper.stepThreeArrayToObj(vertices, "v");
    },

    texturesToObj: function(textures) {
        return exportHelper.stepThreeArrayToObj(textures, "vt");
    },

    normalsToObj: function(normals) {
        return exportHelper.stepThreeArrayToObj(normals, "vt");
    },

    facesToObj: function(faces) {
        let res = "";
        for (let i = 0; i < faces.length; i += 3) {
            res += "f " + exportHelper.faceElement(faces[i]) + " " +
                exportHelper.faceElement(faces[i + 1]) + " " +
                exportHelper.faceElement(faces[i + 2]) + "\n";
        }
        return res;
    },
    faceElement: function(index) {
        return "v" + index + "/vt" + index + "/vn" + index;
    },


    stepThreeArrayToObj: function(array, prefix) {
        let res = "";
        for (let i = 0; i < array.length; i += 3) {
            res += prefix + " " + array[i] + " " + array[i + 1] + " " + array[i + 2] + "\n";
        }
        return res;
    }


};

module.exports = exportHelper;
