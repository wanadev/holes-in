"use-strict";


const exportHelper = {


    meshesToObj(meshes) {
        let res = "";

        for (const i in meshes) {
            res += exportHelper.meshToObj(meshes.inMesh, "mesh" + i);
            res += "\n";
        }

        return res;
    },

    meshToObj(mesh, meshName) {
        let res = "o " + meshName + "\n\n";
        res += exportHelper.verticesToObj(mesh.points);
        res += "\n";
        res += exportHelper.normalsToObj(mesh.normals);
        res += "\n";
        res += exportHelper.texturesToObj(mesh.uvs);
        res += "\n";
        res += exportHelper.facesToObj(mesh.faces);
        return res;

    },
    verticesToObj(vertices) {

        return exportHelper.stepThreeArrayToObj(vertices, "v");
    },

    texturesToObj(textures) {
        return exportHelper.stepThreeArrayToObj(textures, "vt");
    },

    normalsToObj(normals) {
        return exportHelper.stepThreeArrayToObj(normals, "vt");
    },

    facesToObj(faces) {
        let res = "";
        for (let i = 0; i < faces.length; i += 3) {
            res += "f " + exportHelper.faceElement(faces[i]) + " " +
                exportHelper.faceElement(faces[i + 1]) + " " +
                exportHelper.faceElement(faces[i + 2]) + "\n";
        }
        return res;
    },
    faceElement(index) {
        return "v" + index + "/vt" + index + "/vn" + index;
    },


    stepThreeArrayToObj(array, prefix) {
        let res = "";
        for (let i = 0; i < array.length; i += 3) {
            res += prefix + " " + array[i] + " " + array[i + 1] + " " + array[i + 2] + "\n";
        }
        return res;
    },


};

module.exports = exportHelper;
