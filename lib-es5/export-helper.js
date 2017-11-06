"use strict";
"use-strict";

var exportHelper = {
    meshesToObj: function meshesToObj(meshes) {
        var res = "";

        for (var i = 0; i < meshes.length; i++) {
            res += exportHelper.meshToObj(meshes.inMesh, "mesh" + i);
            res += "\n";
        }

        return res;
    },
    meshToObj: function meshToObj(mesh, meshName) {
        var res = "o " + meshName + "\n\n";
        res += exportHelper.verticesToObj(mesh.points);
        res += "\n";
        res += exportHelper.normalsToObj(mesh.normals);
        res += "\n";
        res += exportHelper.texturesToObj(mesh.uvs);
        res += "\n";
        res += exportHelper.facesToObj(mesh.faces);
        return res;
    },
    verticesToObj: function verticesToObj(vertices) {

        return exportHelper.stepThreeArrayToObj(vertices, "v");
    },
    texturesToObj: function texturesToObj(textures) {
        return exportHelper.stepThreeArrayToObj(textures, "vt");
    },
    normalsToObj: function normalsToObj(normals) {
        return exportHelper.stepThreeArrayToObj(normals, "vt");
    },
    facesToObj: function facesToObj(faces) {
        var res = "";
        for (var i = 0; i < faces.length; i += 3) {
            res += "f " + exportHelper.faceElement(faces[i]) + " " + exportHelper.faceElement(faces[i + 1]) + " " + exportHelper.faceElement(faces[i + 2]) + "\n";
        }
        return res;
    },
    faceElement: function faceElement(index) {
        return "v" + index + "/vt" + index + "/vn" + index;
    },
    stepThreeArrayToObj: function stepThreeArrayToObj(array, prefix) {
        var res = "";
        for (var i = 0; i < array.length; i += 3) {
            res += prefix + " " + array[i] + " " + array[i + 1] + " " + array[i + 2] + "\n";
        }
        return res;
    }
};

module.exports = exportHelper;