/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var BABYLON = require("babylonjs");
(function (BABYLON) {
    var GLTFFileLoader = (function () {
        function GLTFFileLoader() {
            this.extensions = {
                ".gltf": { isBinary: false },
                ".glb": { isBinary: true }
            };
        }
        GLTFFileLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onSuccess, onError) {
            var loaderData = GLTFFileLoader._parse(data);
            var loader = this._getLoader(loaderData);
            if (!loader) {
                onError();
                return;
            }
            loader.importMeshAsync(meshesNames, scene, loaderData, rootUrl, onSuccess, onError);
        };
        GLTFFileLoader.prototype.loadAsync = function (scene, data, rootUrl, onSuccess, onError) {
            var loaderData = GLTFFileLoader._parse(data);
            var loader = this._getLoader(loaderData);
            if (!loader) {
                onError();
                return;
            }
            return loader.loadAsync(scene, loaderData, rootUrl, onSuccess, onError);
        };
        GLTFFileLoader._parse = function (data) {
            if (data instanceof ArrayBuffer) {
                return GLTFFileLoader._parseBinary(data);
            }
            return {
                json: JSON.parse(data),
                bin: null
            };
        };
        GLTFFileLoader.prototype._getLoader = function (loaderData) {
            var loaderVersion = { major: 2, minor: 0 };
            var asset = loaderData.json.asset || {};
            var version = GLTFFileLoader._parseVersion(asset.version);
            if (!version) {
                BABYLON.Tools.Error("Invalid version");
                return null;
            }
            var minVersion = GLTFFileLoader._parseVersion(asset.minVersion);
            if (minVersion) {
                if (GLTFFileLoader._compareVersion(minVersion, loaderVersion) > 0) {
                    BABYLON.Tools.Error("Incompatible version");
                    return null;
                }
            }
            var loaders = {
                1: GLTFFileLoader.GLTFLoaderV1,
                2: GLTFFileLoader.GLTFLoaderV2
            };
            var loader = loaders[version.major];
            if (loader === undefined) {
                BABYLON.Tools.Error("Unsupported version");
                return null;
            }
            if (loader === null) {
                BABYLON.Tools.Error("v" + version.major + " loader is not available");
                return null;
            }
            return loader;
        };
        GLTFFileLoader._parseBinary = function (data) {
            var Binary = {
                Magic: 0x46546C67
            };
            var binaryReader = new BinaryReader(data);
            var magic = binaryReader.readUint32();
            if (magic !== Binary.Magic) {
                BABYLON.Tools.Error("Unexpected magic: " + magic);
                return null;
            }
            var version = binaryReader.readUint32();
            switch (version) {
                case 1: return GLTFFileLoader._parseV1(binaryReader);
                case 2: return GLTFFileLoader._parseV2(binaryReader);
            }
            BABYLON.Tools.Error("Unsupported version: " + version);
            return null;
        };
        GLTFFileLoader._parseV1 = function (binaryReader) {
            var ContentFormat = {
                JSON: 0
            };
            var length = binaryReader.readUint32();
            if (length != binaryReader.getLength()) {
                BABYLON.Tools.Error("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
                return null;
            }
            var contentLength = binaryReader.readUint32();
            var contentFormat = binaryReader.readUint32();
            var content;
            switch (contentFormat) {
                case ContentFormat.JSON:
                    content = JSON.parse(GLTFFileLoader._decodeBufferToText(binaryReader.readUint8Array(contentLength)));
                    break;
                default:
                    BABYLON.Tools.Error("Unexpected content format: " + contentFormat);
                    return null;
            }
            var bytesRemaining = binaryReader.getLength() - binaryReader.getPosition();
            var body = binaryReader.readUint8Array(bytesRemaining);
            return {
                json: content,
                bin: body
            };
        };
        GLTFFileLoader._parseV2 = function (binaryReader) {
            var ChunkFormat = {
                JSON: 0x4E4F534A,
                BIN: 0x004E4942
            };
            var length = binaryReader.readUint32();
            if (length !== binaryReader.getLength()) {
                BABYLON.Tools.Error("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
                return null;
            }
            // JSON chunk
            var chunkLength = binaryReader.readUint32();
            var chunkFormat = binaryReader.readUint32();
            if (chunkFormat !== ChunkFormat.JSON) {
                BABYLON.Tools.Error("First chunk format is not JSON");
                return null;
            }
            var json = JSON.parse(GLTFFileLoader._decodeBufferToText(binaryReader.readUint8Array(chunkLength)));
            // Look for BIN chunk
            var bin = null;
            while (binaryReader.getPosition() < binaryReader.getLength()) {
                chunkLength = binaryReader.readUint32();
                chunkFormat = binaryReader.readUint32();
                switch (chunkFormat) {
                    case ChunkFormat.JSON:
                        BABYLON.Tools.Error("Unexpected JSON chunk");
                        return null;
                    case ChunkFormat.BIN:
                        bin = binaryReader.readUint8Array(chunkLength);
                        break;
                    default:
                        // ignore unrecognized chunkFormat
                        binaryReader.skipBytes(chunkLength);
                        break;
                }
            }
            return {
                json: json,
                bin: bin
            };
        };
        GLTFFileLoader._parseVersion = function (version) {
            if (!version) {
                return null;
            }
            var parts = version.split(".");
            if (parts.length === 0) {
                return null;
            }
            var major = parseInt(parts[0]);
            if (major > 1 && parts.length != 2) {
                return null;
            }
            var minor = parseInt(parts[1]);
            return {
                major: major,
                minor: parseInt(parts[0])
            };
        };
        GLTFFileLoader._compareVersion = function (a, b) {
            if (a.major > b.major)
                return 1;
            if (a.major < b.major)
                return -1;
            if (a.minor > b.minor)
                return 1;
            if (a.minor < b.minor)
                return -1;
            return 0;
        };
        GLTFFileLoader._decodeBufferToText = function (view) {
            var result = "";
            var length = view.byteLength;
            for (var i = 0; i < length; ++i) {
                result += String.fromCharCode(view[i]);
            }
            return result;
        };
        return GLTFFileLoader;
    }());
    GLTFFileLoader.GLTFLoaderV1 = null;
    GLTFFileLoader.GLTFLoaderV2 = null;
    GLTFFileLoader.HomogeneousCoordinates = false;
    GLTFFileLoader.IncrementalLoading = true;
    BABYLON.GLTFFileLoader = GLTFFileLoader;
    var BinaryReader = (function () {
        function BinaryReader(arrayBuffer) {
            this._arrayBuffer = arrayBuffer;
            this._dataView = new DataView(arrayBuffer);
            this._byteOffset = 0;
        }
        BinaryReader.prototype.getPosition = function () {
            return this._byteOffset;
        };
        BinaryReader.prototype.getLength = function () {
            return this._arrayBuffer.byteLength;
        };
        BinaryReader.prototype.readUint32 = function () {
            var value = this._dataView.getUint32(this._byteOffset, true);
            this._byteOffset += 4;
            return value;
        };
        BinaryReader.prototype.readUint8Array = function (length) {
            var value = new Uint8Array(this._arrayBuffer, this._byteOffset, length);
            this._byteOffset += length;
            return value;
        };
        BinaryReader.prototype.skipBytes = function (length) {
            this._byteOffset += length;
        };
        return BinaryReader;
    }());
    BABYLON.SceneLoader.RegisterPlugin(new GLTFFileLoader());
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFFileLoader.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        /**
        * Enums
        */
        var EComponentType;
        (function (EComponentType) {
            EComponentType[EComponentType["BYTE"] = 5120] = "BYTE";
            EComponentType[EComponentType["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
            EComponentType[EComponentType["SHORT"] = 5122] = "SHORT";
            EComponentType[EComponentType["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
            EComponentType[EComponentType["FLOAT"] = 5126] = "FLOAT";
        })(EComponentType = GLTF1.EComponentType || (GLTF1.EComponentType = {}));
        var EShaderType;
        (function (EShaderType) {
            EShaderType[EShaderType["FRAGMENT"] = 35632] = "FRAGMENT";
            EShaderType[EShaderType["VERTEX"] = 35633] = "VERTEX";
        })(EShaderType = GLTF1.EShaderType || (GLTF1.EShaderType = {}));
        var EParameterType;
        (function (EParameterType) {
            EParameterType[EParameterType["BYTE"] = 5120] = "BYTE";
            EParameterType[EParameterType["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
            EParameterType[EParameterType["SHORT"] = 5122] = "SHORT";
            EParameterType[EParameterType["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
            EParameterType[EParameterType["INT"] = 5124] = "INT";
            EParameterType[EParameterType["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
            EParameterType[EParameterType["FLOAT"] = 5126] = "FLOAT";
            EParameterType[EParameterType["FLOAT_VEC2"] = 35664] = "FLOAT_VEC2";
            EParameterType[EParameterType["FLOAT_VEC3"] = 35665] = "FLOAT_VEC3";
            EParameterType[EParameterType["FLOAT_VEC4"] = 35666] = "FLOAT_VEC4";
            EParameterType[EParameterType["INT_VEC2"] = 35667] = "INT_VEC2";
            EParameterType[EParameterType["INT_VEC3"] = 35668] = "INT_VEC3";
            EParameterType[EParameterType["INT_VEC4"] = 35669] = "INT_VEC4";
            EParameterType[EParameterType["BOOL"] = 35670] = "BOOL";
            EParameterType[EParameterType["BOOL_VEC2"] = 35671] = "BOOL_VEC2";
            EParameterType[EParameterType["BOOL_VEC3"] = 35672] = "BOOL_VEC3";
            EParameterType[EParameterType["BOOL_VEC4"] = 35673] = "BOOL_VEC4";
            EParameterType[EParameterType["FLOAT_MAT2"] = 35674] = "FLOAT_MAT2";
            EParameterType[EParameterType["FLOAT_MAT3"] = 35675] = "FLOAT_MAT3";
            EParameterType[EParameterType["FLOAT_MAT4"] = 35676] = "FLOAT_MAT4";
            EParameterType[EParameterType["SAMPLER_2D"] = 35678] = "SAMPLER_2D";
        })(EParameterType = GLTF1.EParameterType || (GLTF1.EParameterType = {}));
        var ETextureWrapMode;
        (function (ETextureWrapMode) {
            ETextureWrapMode[ETextureWrapMode["CLAMP_TO_EDGE"] = 33071] = "CLAMP_TO_EDGE";
            ETextureWrapMode[ETextureWrapMode["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
            ETextureWrapMode[ETextureWrapMode["REPEAT"] = 10497] = "REPEAT";
        })(ETextureWrapMode = GLTF1.ETextureWrapMode || (GLTF1.ETextureWrapMode = {}));
        var ETextureFilterType;
        (function (ETextureFilterType) {
            ETextureFilterType[ETextureFilterType["NEAREST"] = 9728] = "NEAREST";
            ETextureFilterType[ETextureFilterType["LINEAR"] = 9728] = "LINEAR";
            ETextureFilterType[ETextureFilterType["NEAREST_MIPMAP_NEAREST"] = 9984] = "NEAREST_MIPMAP_NEAREST";
            ETextureFilterType[ETextureFilterType["LINEAR_MIPMAP_NEAREST"] = 9985] = "LINEAR_MIPMAP_NEAREST";
            ETextureFilterType[ETextureFilterType["NEAREST_MIPMAP_LINEAR"] = 9986] = "NEAREST_MIPMAP_LINEAR";
            ETextureFilterType[ETextureFilterType["LINEAR_MIPMAP_LINEAR"] = 9987] = "LINEAR_MIPMAP_LINEAR";
        })(ETextureFilterType = GLTF1.ETextureFilterType || (GLTF1.ETextureFilterType = {}));
        var ETextureFormat;
        (function (ETextureFormat) {
            ETextureFormat[ETextureFormat["ALPHA"] = 6406] = "ALPHA";
            ETextureFormat[ETextureFormat["RGB"] = 6407] = "RGB";
            ETextureFormat[ETextureFormat["RGBA"] = 6408] = "RGBA";
            ETextureFormat[ETextureFormat["LUMINANCE"] = 6409] = "LUMINANCE";
            ETextureFormat[ETextureFormat["LUMINANCE_ALPHA"] = 6410] = "LUMINANCE_ALPHA";
        })(ETextureFormat = GLTF1.ETextureFormat || (GLTF1.ETextureFormat = {}));
        var ECullingType;
        (function (ECullingType) {
            ECullingType[ECullingType["FRONT"] = 1028] = "FRONT";
            ECullingType[ECullingType["BACK"] = 1029] = "BACK";
            ECullingType[ECullingType["FRONT_AND_BACK"] = 1032] = "FRONT_AND_BACK";
        })(ECullingType = GLTF1.ECullingType || (GLTF1.ECullingType = {}));
        var EBlendingFunction;
        (function (EBlendingFunction) {
            EBlendingFunction[EBlendingFunction["ZERO"] = 0] = "ZERO";
            EBlendingFunction[EBlendingFunction["ONE"] = 1] = "ONE";
            EBlendingFunction[EBlendingFunction["SRC_COLOR"] = 768] = "SRC_COLOR";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_SRC_COLOR"] = 769] = "ONE_MINUS_SRC_COLOR";
            EBlendingFunction[EBlendingFunction["DST_COLOR"] = 774] = "DST_COLOR";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_DST_COLOR"] = 775] = "ONE_MINUS_DST_COLOR";
            EBlendingFunction[EBlendingFunction["SRC_ALPHA"] = 770] = "SRC_ALPHA";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_SRC_ALPHA"] = 771] = "ONE_MINUS_SRC_ALPHA";
            EBlendingFunction[EBlendingFunction["DST_ALPHA"] = 772] = "DST_ALPHA";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_DST_ALPHA"] = 773] = "ONE_MINUS_DST_ALPHA";
            EBlendingFunction[EBlendingFunction["CONSTANT_COLOR"] = 32769] = "CONSTANT_COLOR";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_CONSTANT_COLOR"] = 32770] = "ONE_MINUS_CONSTANT_COLOR";
            EBlendingFunction[EBlendingFunction["CONSTANT_ALPHA"] = 32771] = "CONSTANT_ALPHA";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_CONSTANT_ALPHA"] = 32772] = "ONE_MINUS_CONSTANT_ALPHA";
            EBlendingFunction[EBlendingFunction["SRC_ALPHA_SATURATE"] = 776] = "SRC_ALPHA_SATURATE";
        })(EBlendingFunction = GLTF1.EBlendingFunction || (GLTF1.EBlendingFunction = {}));
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderInterfaces.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        /**
        * Tokenizer. Used for shaders compatibility
        * Automatically map world, view, projection, worldViewProjection, attributes and so on
        */
        var ETokenType;
        (function (ETokenType) {
            ETokenType[ETokenType["IDENTIFIER"] = 1] = "IDENTIFIER";
            ETokenType[ETokenType["UNKNOWN"] = 2] = "UNKNOWN";
            ETokenType[ETokenType["END_OF_INPUT"] = 3] = "END_OF_INPUT";
        })(ETokenType || (ETokenType = {}));
        var Tokenizer = (function () {
            function Tokenizer(toParse) {
                this._pos = 0;
                this.isLetterOrDigitPattern = /^[a-zA-Z0-9]+$/;
                this._toParse = toParse;
                this._maxPos = toParse.length;
            }
            Tokenizer.prototype.getNextToken = function () {
                if (this.isEnd())
                    return ETokenType.END_OF_INPUT;
                this.currentString = this.read();
                this.currentToken = ETokenType.UNKNOWN;
                if (this.currentString === "_" || this.isLetterOrDigitPattern.test(this.currentString)) {
                    this.currentToken = ETokenType.IDENTIFIER;
                    this.currentIdentifier = this.currentString;
                    while (!this.isEnd() && (this.isLetterOrDigitPattern.test(this.currentString = this.peek()) || this.currentString === "_")) {
                        this.currentIdentifier += this.currentString;
                        this.forward();
                    }
                }
                return this.currentToken;
            };
            Tokenizer.prototype.peek = function () {
                return this._toParse[this._pos];
            };
            Tokenizer.prototype.read = function () {
                return this._toParse[this._pos++];
            };
            Tokenizer.prototype.forward = function () {
                this._pos++;
            };
            Tokenizer.prototype.isEnd = function () {
                return this._pos >= this._maxPos;
            };
            return Tokenizer;
        }());
        /**
        * Values
        */
        var glTFTransforms = ["MODEL", "VIEW", "PROJECTION", "MODELVIEW", "MODELVIEWPROJECTION", "JOINTMATRIX"];
        var babylonTransforms = ["world", "view", "projection", "worldView", "worldViewProjection", "mBones"];
        var glTFAnimationPaths = ["translation", "rotation", "scale"];
        var babylonAnimationPaths = ["position", "rotationQuaternion", "scaling"];
        /**
        * Parse
        */
        var parseBuffers = function (parsedBuffers, gltfRuntime) {
            for (var buf in parsedBuffers) {
                var parsedBuffer = parsedBuffers[buf];
                gltfRuntime.buffers[buf] = parsedBuffer;
                gltfRuntime.buffersCount++;
            }
        };
        var parseShaders = function (parsedShaders, gltfRuntime) {
            for (var sha in parsedShaders) {
                var parsedShader = parsedShaders[sha];
                gltfRuntime.shaders[sha] = parsedShader;
                gltfRuntime.shaderscount++;
            }
        };
        var parseObject = function (parsedObjects, runtimeProperty, gltfRuntime) {
            for (var object in parsedObjects) {
                var parsedObject = parsedObjects[object];
                gltfRuntime[runtimeProperty][object] = parsedObject;
            }
        };
        /**
        * Utils
        */
        var normalizeUVs = function (buffer) {
            if (!buffer) {
                return;
            }
            for (var i = 0; i < buffer.length / 2; i++) {
                buffer[i * 2 + 1] = 1.0 - buffer[i * 2 + 1];
            }
        };
        var replaceInString = function (str, searchValue, replaceValue) {
            while (str.indexOf(searchValue) !== -1) {
                str = str.replace(searchValue, replaceValue);
            }
            return str;
        };
        var getAttribute = function (attributeParameter) {
            if (attributeParameter.semantic === "NORMAL") {
                return "normal";
            }
            else if (attributeParameter.semantic === "POSITION") {
                return "position";
            }
            else if (attributeParameter.semantic === "JOINT") {
                return "matricesIndices";
            }
            else if (attributeParameter.semantic === "WEIGHT") {
                return "matricesWeights";
            }
            else if (attributeParameter.semantic === "COLOR") {
                return "color";
            }
            else if (attributeParameter.semantic.indexOf("TEXCOORD_") !== -1) {
                var channel = Number(attributeParameter.semantic.split("_")[1]);
                return "uv" + (channel === 0 ? "" : channel + 1);
            }
        };
        /**
        * Returns the animation path (glTF -> Babylon)
        */
        var getAnimationPath = function (path) {
            var index = glTFAnimationPaths.indexOf(path);
            if (index !== -1) {
                return babylonAnimationPaths[index];
            }
            return path;
        };
        /**
        * Loads and creates animations
        */
        var loadAnimations = function (gltfRuntime) {
            for (var anim in gltfRuntime.animations) {
                var animation = gltfRuntime.animations[anim];
                var lastAnimation = null;
                for (var i = 0; i < animation.channels.length; i++) {
                    // Get parameters and load buffers
                    var channel = animation.channels[i];
                    var sampler = animation.samplers[channel.sampler];
                    if (!sampler) {
                        continue;
                    }
                    var inputData = null;
                    var outputData = null;
                    if (animation.parameters) {
                        inputData = animation.parameters[sampler.input];
                        outputData = animation.parameters[sampler.output];
                    }
                    else {
                        inputData = sampler.input;
                        outputData = sampler.output;
                    }
                    var bufferInput = GLTF1.GLTFUtils.GetBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[inputData]);
                    var bufferOutput = GLTF1.GLTFUtils.GetBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[outputData]);
                    var targetID = channel.target.id;
                    var targetNode = gltfRuntime.scene.getNodeByID(targetID);
                    if (targetNode === null) {
                        targetNode = gltfRuntime.scene.getNodeByName(targetID);
                    }
                    if (targetNode === null) {
                        BABYLON.Tools.Warn("Creating animation named " + anim + ". But cannot find node named " + targetID + " to attach to");
                        continue;
                    }
                    var isBone = targetNode instanceof BABYLON.Bone;
                    // Get target path (position, rotation or scaling)
                    var targetPath = channel.target.path;
                    var targetPathIndex = glTFAnimationPaths.indexOf(targetPath);
                    if (targetPathIndex !== -1) {
                        targetPath = babylonAnimationPaths[targetPathIndex];
                    }
                    // Determine animation type
                    var animationType = BABYLON.Animation.ANIMATIONTYPE_MATRIX;
                    if (!isBone) {
                        if (targetPath === "rotationQuaternion") {
                            animationType = BABYLON.Animation.ANIMATIONTYPE_QUATERNION;
                            targetNode.rotationQuaternion = new BABYLON.Quaternion();
                        }
                        else {
                            animationType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
                        }
                    }
                    // Create animation and key frames
                    var babylonAnimation = null;
                    var keys = [];
                    var arrayOffset = 0;
                    var modifyKey = false;
                    if (isBone && lastAnimation && lastAnimation.getKeys().length === bufferInput.length) {
                        babylonAnimation = lastAnimation;
                        modifyKey = true;
                    }
                    if (!modifyKey) {
                        babylonAnimation = new BABYLON.Animation(anim, isBone ? "_matrix" : targetPath, 1, animationType, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
                    }
                    // For each frame
                    for (var j = 0; j < bufferInput.length; j++) {
                        var value = null;
                        if (targetPath === "rotationQuaternion") {
                            value = BABYLON.Quaternion.FromArray([bufferOutput[arrayOffset], bufferOutput[arrayOffset + 1], bufferOutput[arrayOffset + 2], bufferOutput[arrayOffset + 3]]);
                            arrayOffset += 4;
                        }
                        else {
                            value = BABYLON.Vector3.FromArray([bufferOutput[arrayOffset], bufferOutput[arrayOffset + 1], bufferOutput[arrayOffset + 2]]);
                            arrayOffset += 3;
                        }
                        if (isBone) {
                            var bone = targetNode;
                            var translation = BABYLON.Vector3.Zero();
                            var rotationQuaternion = new BABYLON.Quaternion();
                            var scaling = BABYLON.Vector3.Zero();
                            // Warning on decompose
                            var mat = bone.getBaseMatrix();
                            if (modifyKey) {
                                mat = lastAnimation.getKeys()[j].value;
                            }
                            mat.decompose(scaling, rotationQuaternion, translation);
                            if (targetPath === "position") {
                                translation = value;
                            }
                            else if (targetPath === "rotationQuaternion") {
                                rotationQuaternion = value;
                            }
                            else {
                                scaling = value;
                            }
                            value = BABYLON.Matrix.Compose(scaling, rotationQuaternion, translation);
                        }
                        if (!modifyKey) {
                            keys.push({
                                frame: bufferInput[j],
                                value: value
                            });
                        }
                        else {
                            lastAnimation.getKeys()[j].value = value;
                        }
                    }
                    // Finish
                    if (!modifyKey) {
                        babylonAnimation.setKeys(keys);
                        targetNode.animations.push(babylonAnimation);
                    }
                    lastAnimation = babylonAnimation;
                    gltfRuntime.scene.stopAnimation(targetNode);
                    gltfRuntime.scene.beginAnimation(targetNode, 0, bufferInput[bufferInput.length - 1], true, 1.0);
                }
            }
        };
        /**
        * Returns the bones transformation matrix
        */
        var configureBoneTransformation = function (node) {
            var mat = null;
            if (node.translation || node.rotation || node.scale) {
                var scale = BABYLON.Vector3.FromArray(node.scale || [1, 1, 1]);
                var rotation = BABYLON.Quaternion.FromArray(node.rotation || [0, 0, 0, 1]);
                var position = BABYLON.Vector3.FromArray(node.translation || [0, 0, 0]);
                mat = BABYLON.Matrix.Compose(scale, rotation, position);
            }
            else {
                mat = BABYLON.Matrix.FromArray(node.matrix);
            }
            return mat;
        };
        /**
        * Returns the parent bone
        */
        var getParentBone = function (gltfRuntime, skins, jointName, newSkeleton) {
            // Try to find
            for (var i = 0; i < newSkeleton.bones.length; i++) {
                if (newSkeleton.bones[i].name === jointName) {
                    return newSkeleton.bones[i];
                }
            }
            // Not found, search in gltf nodes
            var nodes = gltfRuntime.nodes;
            for (var nde in nodes) {
                var node = nodes[nde];
                if (!node.jointName) {
                    continue;
                }
                var children = node.children;
                for (var i = 0; i < children.length; i++) {
                    var child = gltfRuntime.nodes[children[i]];
                    if (!child.jointName) {
                        continue;
                    }
                    if (child.jointName === jointName) {
                        var mat = configureBoneTransformation(node);
                        var bone = new BABYLON.Bone(node.name, newSkeleton, getParentBone(gltfRuntime, skins, node.jointName, newSkeleton), mat);
                        bone.id = nde;
                        return bone;
                    }
                }
            }
            return null;
        };
        /**
        * Returns the appropriate root node
        */
        var getNodeToRoot = function (nodesToRoot, id) {
            for (var i = 0; i < nodesToRoot.length; i++) {
                var nodeToRoot = nodesToRoot[i];
                for (var j = 0; j < nodeToRoot.node.children.length; j++) {
                    var child = nodeToRoot.node.children[j];
                    if (child === id) {
                        return nodeToRoot.bone;
                    }
                }
            }
            return null;
        };
        /**
        * Returns the node with the joint name
        */
        var getJointNode = function (gltfRuntime, jointName) {
            var nodes = gltfRuntime.nodes;
            var node = nodes[jointName];
            if (node) {
                return {
                    node: node,
                    id: jointName
                };
            }
            for (var nde in nodes) {
                node = nodes[nde];
                if (node.jointName === jointName) {
                    return {
                        node: node,
                        id: nde
                    };
                }
            }
            return null;
        };
        /**
        * Checks if a nodes is in joints
        */
        var nodeIsInJoints = function (skins, id) {
            for (var i = 0; i < skins.jointNames.length; i++) {
                if (skins.jointNames[i] === id) {
                    return true;
                }
            }
            return false;
        };
        /**
        * Fills the nodes to root for bones and builds hierarchy
        */
        var getNodesToRoot = function (gltfRuntime, newSkeleton, skins, nodesToRoot) {
            // Creates nodes for root
            for (var nde in gltfRuntime.nodes) {
                var node = gltfRuntime.nodes[nde];
                var id = nde;
                if (!node.jointName || nodeIsInJoints(skins, node.jointName)) {
                    continue;
                }
                // Create node to root bone
                var mat = configureBoneTransformation(node);
                var bone = new BABYLON.Bone(node.name, newSkeleton, null, mat);
                bone.id = id;
                nodesToRoot.push({ bone: bone, node: node, id: id });
            }
            // Parenting
            for (var i = 0; i < nodesToRoot.length; i++) {
                var nodeToRoot = nodesToRoot[i];
                var children = nodeToRoot.node.children;
                for (var j = 0; j < children.length; j++) {
                    var child = null;
                    for (var k = 0; k < nodesToRoot.length; k++) {
                        if (nodesToRoot[k].id === children[j]) {
                            child = nodesToRoot[k];
                            break;
                        }
                    }
                    if (child) {
                        child.bone._parent = nodeToRoot.bone;
                        nodeToRoot.bone.children.push(child.bone);
                    }
                }
            }
        };
        var printMat = function (m) {
            console.log(m[0] + "\t" + m[1] + "\t" + m[2] + "\t" + m[3] + "\n" +
                m[4] + "\t" + m[5] + "\t" + m[6] + "\t" + m[7] + "\n" +
                m[8] + "\t" + m[9] + "\t" + m[10] + "\t" + m[11] + "\n" +
                m[12] + "\t" + m[13] + "\t" + m[14] + "\t" + m[15] + "\n");
        };
        /**
        * Imports a skeleton
        */
        var importSkeleton = function (gltfRuntime, skins, mesh, newSkeleton, id) {
            if (!newSkeleton) {
                newSkeleton = new BABYLON.Skeleton(skins.name, "", gltfRuntime.scene);
            }
            if (!skins.babylonSkeleton) {
                return newSkeleton;
            }
            // Matrices
            var accessor = gltfRuntime.accessors[skins.inverseBindMatrices];
            var buffer = GLTF1.GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);
            var bindShapeMatrix = BABYLON.Matrix.FromArray(skins.bindShapeMatrix);
            // Find the root bones
            var nodesToRoot = [];
            var nodesToRootToAdd = [];
            getNodesToRoot(gltfRuntime, newSkeleton, skins, nodesToRoot);
            newSkeleton.bones = [];
            // Joints
            for (var i = 0; i < skins.jointNames.length; i++) {
                var jointNode = getJointNode(gltfRuntime, skins.jointNames[i]);
                var node = jointNode.node;
                if (!node) {
                    BABYLON.Tools.Warn("Joint named " + skins.jointNames[i] + " does not exist");
                    continue;
                }
                var id = jointNode.id;
                // Optimize, if the bone already exists...
                var existingBone = gltfRuntime.scene.getBoneByID(id);
                if (existingBone) {
                    newSkeleton.bones.push(existingBone);
                    continue;
                }
                // Search for parent bone
                var foundBone = false;
                var parentBone = null;
                for (var j = 0; j < i; j++) {
                    var joint = getJointNode(gltfRuntime, skins.jointNames[j]).node;
                    if (!joint) {
                        BABYLON.Tools.Warn("Joint named " + skins.jointNames[j] + " does not exist when looking for parent");
                        continue;
                    }
                    var children = joint.children;
                    foundBone = false;
                    for (var k = 0; k < children.length; k++) {
                        if (children[k] === id) {
                            parentBone = getParentBone(gltfRuntime, skins, skins.jointNames[j], newSkeleton);
                            foundBone = true;
                            break;
                        }
                    }
                    if (foundBone) {
                        break;
                    }
                }
                // Create bone
                var mat = configureBoneTransformation(node);
                if (!parentBone && nodesToRoot.length > 0) {
                    parentBone = getNodeToRoot(nodesToRoot, id);
                    if (parentBone) {
                        if (nodesToRootToAdd.indexOf(parentBone) === -1) {
                            nodesToRootToAdd.push(parentBone);
                        }
                    }
                }
                var bone = new BABYLON.Bone(node.jointName, newSkeleton, parentBone, mat);
                bone.id = id;
            }
            // Polish
            var bones = newSkeleton.bones;
            newSkeleton.bones = [];
            for (var i = 0; i < skins.jointNames.length; i++) {
                var jointNode = getJointNode(gltfRuntime, skins.jointNames[i]);
                if (!jointNode) {
                    continue;
                }
                for (var j = 0; j < bones.length; j++) {
                    if (bones[j].id === jointNode.id) {
                        newSkeleton.bones.push(bones[j]);
                        break;
                    }
                }
            }
            newSkeleton.prepare();
            // Finish
            for (var i = 0; i < nodesToRootToAdd.length; i++) {
                newSkeleton.bones.push(nodesToRootToAdd[i]);
            }
            return newSkeleton;
        };
        /**
        * Imports a mesh and its geometries
        */
        var importMesh = function (gltfRuntime, node, meshes, id, newMesh) {
            if (!newMesh) {
                newMesh = new BABYLON.Mesh(node.name, gltfRuntime.scene);
                newMesh.id = id;
            }
            if (!node.babylonNode) {
                return newMesh;
            }
            var multiMat = new BABYLON.MultiMaterial("multimat" + id, gltfRuntime.scene);
            if (!newMesh.material) {
                newMesh.material = multiMat;
            }
            var vertexData = new BABYLON.VertexData();
            var geometry = new BABYLON.Geometry(id, gltfRuntime.scene, vertexData, false, newMesh);
            var verticesStarts = [];
            var verticesCounts = [];
            var indexStarts = [];
            var indexCounts = [];
            for (var meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
                var meshID = meshes[meshIndex];
                var mesh = gltfRuntime.meshes[meshID];
                if (!mesh) {
                    continue;
                }
                // Positions, normals and UVs
                for (var i = 0; i < mesh.primitives.length; i++) {
                    // Temporary vertex data
                    var tempVertexData = new BABYLON.VertexData();
                    var primitive = mesh.primitives[i];
                    if (primitive.mode !== 4) {
                        // continue;
                    }
                    var attributes = primitive.attributes;
                    var accessor = null;
                    var buffer = null;
                    // Set positions, normal and uvs
                    for (var semantic in attributes) {
                        // Link accessor and buffer view
                        accessor = gltfRuntime.accessors[attributes[semantic]];
                        buffer = GLTF1.GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);
                        if (semantic === "NORMAL") {
                            tempVertexData.normals = new Float32Array(buffer.length);
                            tempVertexData.normals.set(buffer);
                        }
                        else if (semantic === "POSITION") {
                            if (BABYLON.GLTFFileLoader.HomogeneousCoordinates) {
                                tempVertexData.positions = new Float32Array(buffer.length - buffer.length / 4);
                                for (var j = 0; j < buffer.length; j += 4) {
                                    tempVertexData.positions[j] = buffer[j];
                                    tempVertexData.positions[j + 1] = buffer[j + 1];
                                    tempVertexData.positions[j + 2] = buffer[j + 2];
                                }
                            }
                            else {
                                tempVertexData.positions = new Float32Array(buffer.length);
                                tempVertexData.positions.set(buffer);
                            }
                            verticesCounts.push(tempVertexData.positions.length);
                        }
                        else if (semantic.indexOf("TEXCOORD_") !== -1) {
                            var channel = Number(semantic.split("_")[1]);
                            var uvKind = BABYLON.VertexBuffer.UVKind + (channel === 0 ? "" : (channel + 1));
                            var uvs = new Float32Array(buffer.length);
                            uvs.set(buffer);
                            normalizeUVs(uvs);
                            tempVertexData.set(uvs, uvKind);
                        }
                        else if (semantic === "JOINT") {
                            tempVertexData.matricesIndices = new Float32Array(buffer.length);
                            tempVertexData.matricesIndices.set(buffer);
                        }
                        else if (semantic === "WEIGHT") {
                            tempVertexData.matricesWeights = new Float32Array(buffer.length);
                            tempVertexData.matricesWeights.set(buffer);
                        }
                        else if (semantic === "COLOR") {
                            tempVertexData.colors = new Float32Array(buffer.length);
                            tempVertexData.colors.set(buffer);
                        }
                    }
                    // Indices
                    accessor = gltfRuntime.accessors[primitive.indices];
                    if (accessor) {
                        buffer = GLTF1.GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);
                        tempVertexData.indices = new Int32Array(buffer.length);
                        tempVertexData.indices.set(buffer);
                        indexCounts.push(tempVertexData.indices.length);
                    }
                    else {
                        // Set indices on the fly
                        var indices = [];
                        for (var j = 0; j < tempVertexData.positions.length / 3; j++) {
                            indices.push(j);
                        }
                        tempVertexData.indices = new Int32Array(indices);
                        indexCounts.push(tempVertexData.indices.length);
                    }
                    vertexData.merge(tempVertexData);
                    tempVertexData = undefined;
                    // Sub material
                    var material = gltfRuntime.scene.getMaterialByID(primitive.material);
                    multiMat.subMaterials.push(material === null ? GLTF1.GLTFUtils.GetDefaultMaterial(gltfRuntime.scene) : material);
                    // Update vertices start and index start
                    verticesStarts.push(verticesStarts.length === 0 ? 0 : verticesStarts[verticesStarts.length - 1] + verticesCounts[verticesCounts.length - 2]);
                    indexStarts.push(indexStarts.length === 0 ? 0 : indexStarts[indexStarts.length - 1] + indexCounts[indexCounts.length - 2]);
                }
            }
            // Apply geometry
            geometry.setAllVerticesData(vertexData, false);
            newMesh.computeWorldMatrix(true);
            // Apply submeshes
            newMesh.subMeshes = [];
            var index = 0;
            for (var meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
                var meshID = meshes[meshIndex];
                var mesh = gltfRuntime.meshes[meshID];
                if (!mesh) {
                    continue;
                }
                for (var i = 0; i < mesh.primitives.length; i++) {
                    if (mesh.primitives[i].mode !== 4) {
                        //continue;
                    }
                    var subMesh = new BABYLON.SubMesh(index, verticesStarts[index], verticesCounts[index], indexStarts[index], indexCounts[index], newMesh, newMesh, true);
                    index++;
                }
            }
            // Finish
            return newMesh;
        };
        /**
        * Configure node transformation from position, rotation and scaling
        */
        var configureNode = function (newNode, position, rotation, scaling) {
            if (newNode.position) {
                newNode.position = position;
            }
            if (newNode.rotationQuaternion || newNode.rotation) {
                newNode.rotationQuaternion = rotation;
            }
            if (newNode.scaling) {
                newNode.scaling = scaling;
            }
        };
        /**
        * Configures node from transformation matrix
        */
        var configureNodeFromMatrix = function (newNode, node, parent) {
            if (node.matrix) {
                var position = new BABYLON.Vector3(0, 0, 0);
                var rotation = new BABYLON.Quaternion();
                var scaling = new BABYLON.Vector3(0, 0, 0);
                var mat = BABYLON.Matrix.FromArray(node.matrix);
                mat.decompose(scaling, rotation, position);
                configureNode(newNode, position, rotation, scaling);
            }
            else {
                configureNode(newNode, BABYLON.Vector3.FromArray(node.translation), BABYLON.Quaternion.FromArray(node.rotation), BABYLON.Vector3.FromArray(node.scale));
            }
            newNode.computeWorldMatrix(true);
        };
        /**
        * Imports a node
        */
        var importNode = function (gltfRuntime, node, id, parent) {
            var lastNode = null;
            if (gltfRuntime.importOnlyMeshes && (node.skin || node.meshes)) {
                if (gltfRuntime.importMeshesNames.length > 0 && gltfRuntime.importMeshesNames.indexOf(node.name) === -1) {
                    return null;
                }
            }
            // Meshes
            if (node.skin) {
                if (node.meshes) {
                    var skin = gltfRuntime.skins[node.skin];
                    var newMesh = importMesh(gltfRuntime, node, node.meshes, id, node.babylonNode);
                    newMesh.skeleton = gltfRuntime.scene.getLastSkeletonByID(node.skin);
                    if (newMesh.skeleton === null) {
                        newMesh.skeleton = importSkeleton(gltfRuntime, skin, newMesh, skin.babylonSkeleton, node.skin);
                        if (!skin.babylonSkeleton) {
                            skin.babylonSkeleton = newMesh.skeleton;
                        }
                    }
                    lastNode = newMesh;
                }
            }
            else if (node.meshes) {
                /**
                * Improve meshes property
                */
                var newMesh = importMesh(gltfRuntime, node, node.mesh ? [node.mesh] : node.meshes, id, node.babylonNode);
                lastNode = newMesh;
            }
            else if (node.light && !node.babylonNode && !gltfRuntime.importOnlyMeshes) {
                var light = gltfRuntime.lights[node.light];
                if (light) {
                    if (light.type === "ambient") {
                        var ambienLight = light[light.type];
                        var hemiLight = new BABYLON.HemisphericLight(node.light, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                        hemiLight.name = node.name;
                        if (ambienLight.color) {
                            hemiLight.diffuse = BABYLON.Color3.FromArray(ambienLight.color);
                        }
                        lastNode = hemiLight;
                    }
                    else if (light.type === "directional") {
                        var directionalLight = light[light.type];
                        var dirLight = new BABYLON.DirectionalLight(node.light, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                        dirLight.name = node.name;
                        if (directionalLight.color) {
                            dirLight.diffuse = BABYLON.Color3.FromArray(directionalLight.color);
                        }
                        lastNode = dirLight;
                    }
                    else if (light.type === "point") {
                        var pointLight = light[light.type];
                        var ptLight = new BABYLON.PointLight(node.light, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                        ptLight.name = node.name;
                        if (pointLight.color) {
                            ptLight.diffuse = BABYLON.Color3.FromArray(pointLight.color);
                        }
                        lastNode = ptLight;
                    }
                    else if (light.type === "spot") {
                        var spotLight = light[light.type];
                        var spLight = new BABYLON.SpotLight(node.light, BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), 0, 0, gltfRuntime.scene);
                        spLight.name = node.name;
                        if (spotLight.color) {
                            spLight.diffuse = BABYLON.Color3.FromArray(spotLight.color);
                        }
                        if (spotLight.fallOfAngle) {
                            spLight.angle = spotLight.fallOfAngle;
                        }
                        if (spotLight.fallOffExponent) {
                            spLight.exponent = spotLight.fallOffExponent;
                        }
                        lastNode = spLight;
                    }
                }
            }
            else if (node.camera && !node.babylonNode && !gltfRuntime.importOnlyMeshes) {
                var camera = gltfRuntime.cameras[node.camera];
                if (camera) {
                    if (camera.type === "orthographic") {
                        var orthographicCamera = camera[camera.type];
                        var orthoCamera = new BABYLON.FreeCamera(node.camera, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                        orthoCamera.name = node.name;
                        orthoCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
                        orthoCamera.attachControl(gltfRuntime.scene.getEngine().getRenderingCanvas());
                        lastNode = orthoCamera;
                    }
                    else if (camera.type === "perspective") {
                        var perspectiveCamera = camera[camera.type];
                        var persCamera = new BABYLON.FreeCamera(node.camera, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                        persCamera.name = node.name;
                        persCamera.attachControl(gltfRuntime.scene.getEngine().getRenderingCanvas());
                        if (!perspectiveCamera.aspectRatio) {
                            perspectiveCamera.aspectRatio = gltfRuntime.scene.getEngine().getRenderWidth() / gltfRuntime.scene.getEngine().getRenderHeight();
                        }
                        if (perspectiveCamera.znear && perspectiveCamera.zfar) {
                            persCamera.maxZ = perspectiveCamera.zfar;
                            persCamera.minZ = perspectiveCamera.znear;
                        }
                        lastNode = persCamera;
                    }
                }
            }
            // Empty node
            if (!node.jointName) {
                if (node.babylonNode) {
                    return node.babylonNode;
                }
                else if (lastNode === null) {
                    var dummy = new BABYLON.Mesh(node.name, gltfRuntime.scene);
                    node.babylonNode = dummy;
                    lastNode = dummy;
                }
            }
            if (lastNode !== null) {
                if (node.matrix && lastNode instanceof BABYLON.Mesh) {
                    configureNodeFromMatrix(lastNode, node, parent);
                }
                else {
                    var translation = node.translation || [0, 0, 0];
                    var rotation = node.rotation || [0, 0, 0, 1];
                    var scale = node.scale || [1, 1, 1];
                    configureNode(lastNode, BABYLON.Vector3.FromArray(translation), BABYLON.Quaternion.FromArray(rotation), BABYLON.Vector3.FromArray(scale));
                }
                lastNode.updateCache(true);
                node.babylonNode = lastNode;
            }
            return lastNode;
        };
        /**
        * Traverses nodes and creates them
        */
        var traverseNodes = function (gltfRuntime, id, parent, meshIncluded) {
            var node = gltfRuntime.nodes[id];
            var newNode = null;
            if (gltfRuntime.importOnlyMeshes && !meshIncluded) {
                if (gltfRuntime.importMeshesNames.indexOf(node.name) !== -1 || gltfRuntime.importMeshesNames.length === 0) {
                    meshIncluded = true;
                }
                else {
                    meshIncluded = false;
                }
            }
            else {
                meshIncluded = true;
            }
            if (!node.jointName && meshIncluded) {
                newNode = importNode(gltfRuntime, node, id, parent);
                if (newNode !== null) {
                    newNode.id = id;
                    newNode.parent = parent;
                }
            }
            if (node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    traverseNodes(gltfRuntime, node.children[i], newNode, meshIncluded);
                }
            }
        };
        /**
        * do stuff after buffers, shaders are loaded (e.g. hook up materials, load animations, etc.)
        */
        var postLoad = function (gltfRuntime) {
            // Nodes
            var currentScene = gltfRuntime.currentScene;
            if (currentScene) {
                for (var i = 0; i < currentScene.nodes.length; i++) {
                    traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                }
            }
            else {
                for (var thing in gltfRuntime.scenes) {
                    currentScene = gltfRuntime.scenes[thing];
                    for (var i = 0; i < currentScene.nodes.length; i++) {
                        traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                    }
                }
            }
            // Set animations
            loadAnimations(gltfRuntime);
            for (var i = 0; i < gltfRuntime.scene.skeletons.length; i++) {
                var skeleton = gltfRuntime.scene.skeletons[i];
                gltfRuntime.scene.beginAnimation(skeleton, 0, Number.MAX_VALUE, true, 1.0);
            }
        };
        /**
        * onBind shaderrs callback to set uniforms and matrices
        */
        var onBindShaderMaterial = function (mesh, gltfRuntime, unTreatedUniforms, shaderMaterial, technique, material, onSuccess) {
            var materialValues = material.values || technique.parameters;
            for (var unif in unTreatedUniforms) {
                var uniform = unTreatedUniforms[unif];
                var type = uniform.type;
                if (type === GLTF1.EParameterType.FLOAT_MAT2 || type === GLTF1.EParameterType.FLOAT_MAT3 || type === GLTF1.EParameterType.FLOAT_MAT4) {
                    if (uniform.semantic && !uniform.source && !uniform.node) {
                        GLTF1.GLTFUtils.SetMatrix(gltfRuntime.scene, mesh, uniform, unif, shaderMaterial.getEffect());
                    }
                    else if (uniform.semantic && (uniform.source || uniform.node)) {
                        var source = gltfRuntime.scene.getNodeByName(uniform.source || uniform.node);
                        if (source === null) {
                            source = gltfRuntime.scene.getNodeByID(uniform.source || uniform.node);
                        }
                        if (source === null) {
                            continue;
                        }
                        GLTF1.GLTFUtils.SetMatrix(gltfRuntime.scene, source, uniform, unif, shaderMaterial.getEffect());
                    }
                }
                else {
                    var value = materialValues[technique.uniforms[unif]];
                    if (!value) {
                        continue;
                    }
                    if (type === GLTF1.EParameterType.SAMPLER_2D) {
                        var texture = gltfRuntime.textures[material.values ? value : uniform.value].babylonTexture;
                        if (texture === null || texture === undefined) {
                            continue;
                        }
                        shaderMaterial.getEffect().setTexture(unif, texture);
                    }
                    else {
                        GLTF1.GLTFUtils.SetUniform(shaderMaterial.getEffect(), unif, value, type);
                    }
                }
            }
            onSuccess(shaderMaterial);
        };
        /**
        * Prepare uniforms to send the only one time
        * Loads the appropriate textures
        */
        var prepareShaderMaterialUniforms = function (gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms) {
            var materialValues = material.values || technique.parameters;
            var techniqueUniforms = technique.uniforms;
            /**
            * Prepare values here (not matrices)
            */
            for (var unif in unTreatedUniforms) {
                var uniform = unTreatedUniforms[unif];
                var type = uniform.type;
                var value = materialValues[techniqueUniforms[unif]];
                if (value === undefined) {
                    // In case the value is the same for all materials
                    value = uniform.value;
                }
                if (!value) {
                    continue;
                }
                var onLoadTexture = function (uniformName) {
                    return function (texture) {
                        if (uniform.value) {
                            // Static uniform
                            shaderMaterial.setTexture(uniformName, texture);
                            delete unTreatedUniforms[uniformName];
                        }
                    };
                };
                // Texture (sampler2D)
                if (type === GLTF1.EParameterType.SAMPLER_2D) {
                    GLTF1.GLTFLoaderExtension.LoadTextureAsync(gltfRuntime, material.values ? value : uniform.value, onLoadTexture(unif), function () { return onLoadTexture(null); });
                }
                else {
                    if (uniform.value && GLTF1.GLTFUtils.SetUniform(shaderMaterial, unif, material.values ? value : uniform.value, type)) {
                        // Static uniform
                        delete unTreatedUniforms[unif];
                    }
                }
            }
        };
        /**
        * Shader compilation failed
        */
        var onShaderCompileError = function (program, shaderMaterial, onError) {
            return function (effect, error) {
                BABYLON.Tools.Error("Cannot compile program named " + program.name + ". Error: " + error + ". Default material will be applied");
                shaderMaterial.dispose(true);
                onError();
            };
        };
        /**
        * Shader compilation success
        */
        var onShaderCompileSuccess = function (gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms, onSuccess) {
            return function (_) {
                prepareShaderMaterialUniforms(gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms);
                shaderMaterial.onBind = function (mesh) {
                    onBindShaderMaterial(mesh, gltfRuntime, unTreatedUniforms, shaderMaterial, technique, material, onSuccess);
                };
            };
        };
        /**
        * Returns the appropriate uniform if already handled by babylon
        */
        var parseShaderUniforms = function (tokenizer, technique, unTreatedUniforms) {
            for (var unif in technique.uniforms) {
                var uniform = technique.uniforms[unif];
                var uniformParameter = technique.parameters[uniform];
                if (tokenizer.currentIdentifier === unif) {
                    if (uniformParameter.semantic && !uniformParameter.source && !uniformParameter.node) {
                        var transformIndex = glTFTransforms.indexOf(uniformParameter.semantic);
                        if (transformIndex !== -1) {
                            delete unTreatedUniforms[unif];
                            return babylonTransforms[transformIndex];
                        }
                    }
                }
            }
            return tokenizer.currentIdentifier;
        };
        /**
        * All shaders loaded. Create materials one by one
        */
        var importMaterials = function (gltfRuntime, onSuccess) {
            // Create materials
            let materialsLeft = Object.keys(gltfRuntime.materials).length;
            for (var mat in gltfRuntime.materials) {
                GLTF1.GLTFLoaderExtension.LoadMaterialAsync(gltfRuntime, mat, function (material) {
                    if (!BABYLON.GLTFFileLoader.IncrementalLoading && onSuccess) {
                        materialsLeft--;
                        if (materialsLeft === 0) {
                            onSuccess();
                        }
                    }
                }, function () {
                    materialsLeft--;
                });
            }

            if ((!materialsLeft || BABYLON.GLTFFileLoader.IncrementalLoading) && onSuccess) {
                onSuccess();
            }
        };
        /**
        * Implementation of the base glTF spec
        */
        var GLTFLoaderBase = (function () {
            function GLTFLoaderBase() {
            }
            GLTFLoaderBase.CreateRuntime = function (parsedData, scene, rootUrl) {
                var gltfRuntime = {
                    extensions: {},
                    accessors: {},
                    buffers: {},
                    bufferViews: {},
                    meshes: {},
                    lights: {},
                    cameras: {},
                    nodes: {},
                    images: {},
                    textures: {},
                    shaders: {},
                    programs: {},
                    samplers: {},
                    techniques: {},
                    materials: {},
                    animations: {},
                    skins: {},
                    extensionsUsed: [],
                    scenes: {},
                    buffersCount: 0,
                    shaderscount: 0,
                    scene: scene,
                    rootUrl: rootUrl,
                    loadedBufferCount: 0,
                    loadedBufferViews: {},
                    loadedShaderCount: 0,
                    importOnlyMeshes: false,
                    dummyNodes: []
                };
                // Parse
                if (parsedData.extensions) {
                    parseObject(parsedData.extensions, "extensions", gltfRuntime);
                }
                if (parsedData.extensionsUsed) {
                    parseObject(parsedData.extensionsUsed, "extensionsUsed", gltfRuntime);
                }
                if (parsedData.buffers) {
                    parseBuffers(parsedData.buffers, gltfRuntime);
                }
                if (parsedData.bufferViews) {
                    parseObject(parsedData.bufferViews, "bufferViews", gltfRuntime);
                }
                if (parsedData.accessors) {
                    parseObject(parsedData.accessors, "accessors", gltfRuntime);
                }
                if (parsedData.meshes) {
                    parseObject(parsedData.meshes, "meshes", gltfRuntime);
                }
                if (parsedData.lights) {
                    parseObject(parsedData.lights, "lights", gltfRuntime);
                }
                if (parsedData.cameras) {
                    parseObject(parsedData.cameras, "cameras", gltfRuntime);
                }
                if (parsedData.nodes) {
                    parseObject(parsedData.nodes, "nodes", gltfRuntime);
                }
                if (parsedData.images) {
                    parseObject(parsedData.images, "images", gltfRuntime);
                }
                if (parsedData.textures) {
                    parseObject(parsedData.textures, "textures", gltfRuntime);
                }
                if (parsedData.shaders) {
                    parseShaders(parsedData.shaders, gltfRuntime);
                }
                if (parsedData.programs) {
                    parseObject(parsedData.programs, "programs", gltfRuntime);
                }
                if (parsedData.samplers) {
                    parseObject(parsedData.samplers, "samplers", gltfRuntime);
                }
                if (parsedData.techniques) {
                    parseObject(parsedData.techniques, "techniques", gltfRuntime);
                }
                if (parsedData.materials) {
                    parseObject(parsedData.materials, "materials", gltfRuntime);
                }
                if (parsedData.animations) {
                    parseObject(parsedData.animations, "animations", gltfRuntime);
                }
                if (parsedData.skins) {
                    parseObject(parsedData.skins, "skins", gltfRuntime);
                }
                if (parsedData.scenes) {
                    gltfRuntime.scenes = parsedData.scenes;
                }
                if (parsedData.scene && parsedData.scenes) {
                    gltfRuntime.currentScene = parsedData.scenes[parsedData.scene];
                }
                return gltfRuntime;
            };
            GLTFLoaderBase.LoadBufferAsync = function (gltfRuntime, id, onSuccess, onError, onProgress) {
                var buffer = gltfRuntime.buffers[id];
                if (GLTF1.GLTFUtils.IsBase64(buffer.uri)) {
                    setTimeout(function () { return onSuccess(new Uint8Array(GLTF1.GLTFUtils.DecodeBase64(buffer.uri))); });
                }
                else {
                    BABYLON.Tools.LoadFile(gltfRuntime.rootUrl + buffer.uri, function (data) { return onSuccess(new Uint8Array(data)); }, onProgress, null, true, onError);
                }
            };
            GLTFLoaderBase.LoadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                var texture = gltfRuntime.textures[id];
                if (!texture || !texture.source) {
                    onError();
                    return;
                }
                if (texture.babylonTexture) {
                    onSuccess(null);
                    return;
                }
                var source = gltfRuntime.images[texture.source];
                if (GLTF1.GLTFUtils.IsBase64(source.uri)) {
                    setTimeout(function () { return onSuccess(new Uint8Array(GLTF1.GLTFUtils.DecodeBase64(source.uri))); });
                }
                else {
                    BABYLON.Tools.LoadFile(gltfRuntime.rootUrl + source.uri, function (data) { return onSuccess(new Uint8Array(data)); }, null, null, true, onError);
                }
            };
            GLTFLoaderBase.CreateTextureAsync = function (gltfRuntime, id, buffer, onSuccess, onError) {
                var texture = gltfRuntime.textures[id];
                if (texture.babylonTexture) {
                    onSuccess(texture.babylonTexture);
                    return;
                }
                var sampler = gltfRuntime.samplers[texture.sampler];
                var createMipMaps = (sampler.minFilter === GLTF1.ETextureFilterType.NEAREST_MIPMAP_NEAREST) ||
                    (sampler.minFilter === GLTF1.ETextureFilterType.NEAREST_MIPMAP_LINEAR) ||
                    (sampler.minFilter === GLTF1.ETextureFilterType.LINEAR_MIPMAP_NEAREST) ||
                    (sampler.minFilter === GLTF1.ETextureFilterType.LINEAR_MIPMAP_LINEAR);
                var samplingMode = BABYLON.Texture.BILINEAR_SAMPLINGMODE;
                var blob = new Blob([buffer]);
                var blobURL = URL.createObjectURL(blob);
                var revokeBlobURL = function () { return URL.revokeObjectURL(blobURL); };
                var newTexture = new BABYLON.Texture(blobURL, gltfRuntime.scene, !createMipMaps, true, samplingMode, revokeBlobURL, revokeBlobURL);
                newTexture.wrapU = GLTF1.GLTFUtils.GetWrapMode(sampler.wrapS);
                newTexture.wrapV = GLTF1.GLTFUtils.GetWrapMode(sampler.wrapT);
                newTexture.name = id;
                newTexture.hasAlpha = (buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71);
                texture.babylonTexture = newTexture;
                onSuccess(newTexture);
            };
            GLTFLoaderBase.LoadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
                var shader = gltfRuntime.shaders[id];
                if (GLTF1.GLTFUtils.IsBase64(shader.uri)) {
                    var shaderString = atob(shader.uri.split(",")[1]);
                    onSuccess(shaderString);
                }
                else {
                    BABYLON.Tools.LoadFile(gltfRuntime.rootUrl + shader.uri, onSuccess, null, null, false, onError);
                }
            };
            GLTFLoaderBase.LoadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
                var material = gltfRuntime.materials[id];
                var technique = gltfRuntime.techniques[material.technique];
                if (!technique) {
                    var defaultMaterial = new BABYLON.StandardMaterial(id, gltfRuntime.scene);
                    defaultMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                    defaultMaterial.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                    onSuccess(defaultMaterial);
                    return;
                }
                var program = gltfRuntime.programs[technique.program];
                var states = technique.states;
                var vertexShader = BABYLON.Effect.ShadersStore[program.vertexShader + "VertexShader"];
                var pixelShader = BABYLON.Effect.ShadersStore[program.fragmentShader + "PixelShader"];
                var newVertexShader = "";
                var newPixelShader = "";
                var vertexTokenizer = new Tokenizer(vertexShader);
                var pixelTokenizer = new Tokenizer(pixelShader);
                var unTreatedUniforms = {};
                var uniforms = [];
                var attributes = [];
                var samplers = [];
                // Fill uniform, sampler2D and attributes
                for (var unif in technique.uniforms) {
                    var uniform = technique.uniforms[unif];
                    var uniformParameter = technique.parameters[uniform];
                    unTreatedUniforms[unif] = uniformParameter;
                    if (uniformParameter.semantic && !uniformParameter.node && !uniformParameter.source) {
                        var transformIndex = glTFTransforms.indexOf(uniformParameter.semantic);
                        if (transformIndex !== -1) {
                            uniforms.push(babylonTransforms[transformIndex]);
                            delete unTreatedUniforms[unif];
                        }
                        else {
                            uniforms.push(unif);
                        }
                    }
                    else if (uniformParameter.type === GLTF1.EParameterType.SAMPLER_2D) {
                        samplers.push(unif);
                    }
                    else {
                        uniforms.push(unif);
                    }
                }
                for (var attr in technique.attributes) {
                    var attribute = technique.attributes[attr];
                    var attributeParameter = technique.parameters[attribute];
                    if (attributeParameter.semantic) {
                        attributes.push(getAttribute(attributeParameter));
                    }
                }
                // Configure vertex shader
                while (!vertexTokenizer.isEnd() && vertexTokenizer.getNextToken()) {
                    var tokenType = vertexTokenizer.currentToken;
                    if (tokenType !== ETokenType.IDENTIFIER) {
                        newVertexShader += vertexTokenizer.currentString;
                        continue;
                    }
                    var foundAttribute = false;
                    for (var attr in technique.attributes) {
                        var attribute = technique.attributes[attr];
                        var attributeParameter = technique.parameters[attribute];
                        if (vertexTokenizer.currentIdentifier === attr && attributeParameter.semantic) {
                            newVertexShader += getAttribute(attributeParameter);
                            foundAttribute = true;
                            break;
                        }
                    }
                    if (foundAttribute) {
                        continue;
                    }
                    newVertexShader += parseShaderUniforms(vertexTokenizer, technique, unTreatedUniforms);
                }
                // Configure pixel shader
                while (!pixelTokenizer.isEnd() && pixelTokenizer.getNextToken()) {
                    var tokenType = pixelTokenizer.currentToken;
                    if (tokenType !== ETokenType.IDENTIFIER) {
                        newPixelShader += pixelTokenizer.currentString;
                        continue;
                    }
                    newPixelShader += parseShaderUniforms(pixelTokenizer, technique, unTreatedUniforms);
                }
                // Create shader material
                var shaderPath = {
                    vertex: program.vertexShader + id,
                    fragment: program.fragmentShader + id
                };
                var options = {
                    attributes: attributes,
                    uniforms: uniforms,
                    samplers: samplers,
                    needAlphaBlending: states && states.enable && states.enable.indexOf(3042) !== -1
                };
                BABYLON.Effect.ShadersStore[program.vertexShader + id + "VertexShader"] = newVertexShader;
                BABYLON.Effect.ShadersStore[program.fragmentShader + id + "PixelShader"] = newPixelShader;
                var shaderMaterial = new BABYLON.ShaderMaterial(id, gltfRuntime.scene, shaderPath, options);
                shaderMaterial.onError = onShaderCompileError(program, shaderMaterial, onError);
                shaderMaterial.onCompiled = onShaderCompileSuccess(gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms, onSuccess);
                shaderMaterial.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                if (states && states.functions) {
                    var functions = states.functions;
                    if (functions.cullFace && functions.cullFace[0] !== GLTF1.ECullingType.BACK) {
                        shaderMaterial.backFaceCulling = false;
                    }
                    var blendFunc = functions.blendFuncSeparate;
                    if (blendFunc) {
                        if (blendFunc[0] === GLTF1.EBlendingFunction.SRC_ALPHA && blendFunc[1] === GLTF1.EBlendingFunction.ONE_MINUS_SRC_ALPHA && blendFunc[2] === GLTF1.EBlendingFunction.ONE && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.ONE && blendFunc[1] === GLTF1.EBlendingFunction.ONE && blendFunc[2] === GLTF1.EBlendingFunction.ZERO && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_ONEONE;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.SRC_ALPHA && blendFunc[1] === GLTF1.EBlendingFunction.ONE && blendFunc[2] === GLTF1.EBlendingFunction.ZERO && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_ADD;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.ZERO && blendFunc[1] === GLTF1.EBlendingFunction.ONE_MINUS_SRC_COLOR && blendFunc[2] === GLTF1.EBlendingFunction.ONE && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_SUBTRACT;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.DST_COLOR && blendFunc[1] === GLTF1.EBlendingFunction.ZERO && blendFunc[2] === GLTF1.EBlendingFunction.ONE && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_MULTIPLY;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.SRC_ALPHA && blendFunc[1] === GLTF1.EBlendingFunction.ONE_MINUS_SRC_COLOR && blendFunc[2] === GLTF1.EBlendingFunction.ONE && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_MAXIMIZED;
                        }
                    }
                }
            };
            return GLTFLoaderBase;
        }());
        GLTF1.GLTFLoaderBase = GLTFLoaderBase;
        /**
        * glTF V1 Loader
        */
        var GLTFLoader = (function () {
            function GLTFLoader() {
            }
            GLTFLoader.RegisterExtension = function (extension) {
                if (GLTFLoader.Extensions[extension.name]) {
                    BABYLON.Tools.Error("Tool with the same name \"" + extension.name + "\" already exists");
                    return;
                }
                GLTFLoader.Extensions[extension.name] = extension;
            };
            GLTFLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onSuccess, onError, onProgress) {
                var _this = this;
                // scene.useRightHandedSystem = true;
                var gltfRuntime = GLTF1.GLTFLoaderExtension.LoadRuntimeAsync(scene, data, rootUrl, function (gltfRuntime) {
                    gltfRuntime.importOnlyMeshes = true;
                    if (meshesNames === "") {
                        gltfRuntime.importMeshesNames = [];
                    }
                    else if (typeof meshesNames === "string") {
                        gltfRuntime.importMeshesNames = [meshesNames];
                    }
                    else if (meshesNames && !(meshesNames instanceof Array)) {
                        gltfRuntime.importMeshesNames = [meshesNames];
                    }
                    else {
                        gltfRuntime.importMeshesNames = [];
                        BABYLON.Tools.Warn("Argument meshesNames must be of type string or string[]");
                    }
                    // Create nodes
                    _this._createNodes(gltfRuntime);
                    var meshes = [];
                    var skeletons = [];
                    // Fill arrays of meshes and skeletons
                    for (var nde in gltfRuntime.nodes) {
                        var node = gltfRuntime.nodes[nde];
                        if (node.babylonNode instanceof BABYLON.AbstractMesh) {
                            meshes.push(node.babylonNode);
                        }
                    }
                    for (var skl in gltfRuntime.skins) {
                        var skin = gltfRuntime.skins[skl];
                        if (skin.babylonSkeleton instanceof BABYLON.Skeleton) {
                            skeletons.push(skin.babylonSkeleton);
                        }
                    }
                    // Load buffers, shaders, materials, etc.
                    _this._loadBuffersAsync(gltfRuntime, function () {
                        _this._loadShadersAsync(gltfRuntime, function () {
                            importMaterials(gltfRuntime, function() {
                                postLoad(gltfRuntime);
                                if (!BABYLON.GLTFFileLoader.IncrementalLoading && onSuccess) {
                                    onSuccess(meshes, null, skeletons);
                                }
                            });
                        });
                    }, onProgress);
                    if (BABYLON.GLTFFileLoader.IncrementalLoading && onSuccess) {
                        onSuccess(meshes, null, skeletons);
                    }
                }, onError);
                return true;
            };
            GLTFLoader.prototype.loadAsync = function (scene, data, rootUrl, onSuccess, onError) {
                var _this = this;
                // scene.useRightHandedSystem = true;
                GLTF1.GLTFLoaderExtension.LoadRuntimeAsync(scene, data, rootUrl, function (gltfRuntime) {
                    // Load runtime extensios
                    GLTF1.GLTFLoaderExtension.LoadRuntimeExtensionsAsync(gltfRuntime, function () {
                        // Create nodes
                        _this._createNodes(gltfRuntime);
                        // Load buffers, shaders, materials, etc.
                        _this._loadBuffersAsync(gltfRuntime, function () {
                            _this._loadShadersAsync(gltfRuntime, function () {
                                importMaterials(gltfRuntime);
                                postLoad(gltfRuntime);
                                if (!BABYLON.GLTFFileLoader.IncrementalLoading) {
                                    onSuccess();
                                }
                            });
                        });
                        if (BABYLON.GLTFFileLoader.IncrementalLoading) {
                            onSuccess();
                        }
                    }, onError);
                }, onError);
            };
            GLTFLoader.prototype._loadShadersAsync = function (gltfRuntime, onload) {
                var hasShaders = false;
                var processShader = function (sha, shader) {
                    GLTF1.GLTFLoaderExtension.LoadShaderStringAsync(gltfRuntime, sha, function (shaderString) {
                        gltfRuntime.loadedShaderCount++;
                        if (shaderString) {
                            BABYLON.Effect.ShadersStore[sha + (shader.type === GLTF1.EShaderType.VERTEX ? "VertexShader" : "PixelShader")] = shaderString;
                        }
                        if (gltfRuntime.loadedShaderCount === gltfRuntime.shaderscount) {
                            onload();
                        }
                    }, function () {
                        BABYLON.Tools.Error("Error when loading shader program named " + sha + " located at " + shader.uri);
                    });
                };
                for (var sha in gltfRuntime.shaders) {
                    hasShaders = true;
                    var shader = gltfRuntime.shaders[sha];
                    if (shader) {
                        processShader.bind(this, sha, shader)();
                    }
                    else {
                        BABYLON.Tools.Error("No shader named: " + sha);
                    }
                }
                if (!hasShaders) {
                    onload();
                }
            };
            ;
            GLTFLoader.prototype._loadBuffersAsync = function (gltfRuntime, onload, onProgress) {
                var hasBuffers = false;
                var processBuffer = function (buf, buffer) {
                    GLTF1.GLTFLoaderExtension.LoadBufferAsync(gltfRuntime, buf, function (bufferView) {
                        gltfRuntime.loadedBufferCount++;
                        if (bufferView) {
                            if (bufferView.byteLength != gltfRuntime.buffers[buf].byteLength) {
                                BABYLON.Tools.Error("Buffer named " + buf + " is length " + bufferView.byteLength + ". Expected: " + buffer.byteLength); // Improve error message
                            }
                            gltfRuntime.loadedBufferViews[buf] = bufferView;
                        }
                        if (gltfRuntime.loadedBufferCount === gltfRuntime.buffersCount) {
                            onload();
                        }
                    }, function () {
                        BABYLON.Tools.Error("Error when loading buffer named " + buf + " located at " + buffer.uri);
                    });
                };
                for (var buf in gltfRuntime.buffers) {
                    hasBuffers = true;
                    var buffer = gltfRuntime.buffers[buf];
                    if (buffer) {
                        processBuffer.bind(this, buf, buffer)();
                    }
                    else {
                        BABYLON.Tools.Error("No buffer named: " + buf);
                    }
                }
                if (!hasBuffers) {
                    onload();
                }
            };
            GLTFLoader.prototype._createNodes = function (gltfRuntime) {
                var currentScene = gltfRuntime.currentScene;
                if (currentScene) {
                    // Only one scene even if multiple scenes are defined
                    for (var i = 0; i < currentScene.nodes.length; i++) {
                        traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                    }
                }
                else {
                    // Load all scenes
                    for (var thing in gltfRuntime.scenes) {
                        currentScene = gltfRuntime.scenes[thing];
                        for (var i = 0; i < currentScene.nodes.length; i++) {
                            traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                        }
                    }
                }
            };
            return GLTFLoader;
        }());
        GLTFLoader.Extensions = {};
        GLTF1.GLTFLoader = GLTFLoader;
        ;
        BABYLON.GLTFFileLoader.GLTFLoaderV1 = new GLTFLoader();
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoader.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        /**
        * Utils functions for GLTF
        */
        var GLTFUtils = (function () {
            function GLTFUtils() {
            }
            /**
             * Sets the given "parameter" matrix
             * @param scene: the {BABYLON.Scene} object
             * @param source: the source node where to pick the matrix
             * @param parameter: the GLTF technique parameter
             * @param uniformName: the name of the shader's uniform
             * @param shaderMaterial: the shader material
             */
            GLTFUtils.SetMatrix = function (scene, source, parameter, uniformName, shaderMaterial) {
                var mat = null;
                if (parameter.semantic === "MODEL") {
                    mat = source.getWorldMatrix();
                }
                else if (parameter.semantic === "PROJECTION") {
                    mat = scene.getProjectionMatrix();
                }
                else if (parameter.semantic === "VIEW") {
                    mat = scene.getViewMatrix();
                }
                else if (parameter.semantic === "MODELVIEWINVERSETRANSPOSE") {
                    mat = BABYLON.Matrix.Transpose(source.getWorldMatrix().multiply(scene.getViewMatrix()).invert());
                }
                else if (parameter.semantic === "MODELVIEW") {
                    mat = source.getWorldMatrix().multiply(scene.getViewMatrix());
                }
                else if (parameter.semantic === "MODELVIEWPROJECTION") {
                    mat = source.getWorldMatrix().multiply(scene.getTransformMatrix());
                }
                else if (parameter.semantic === "MODELINVERSE") {
                    mat = source.getWorldMatrix().invert();
                }
                else if (parameter.semantic === "VIEWINVERSE") {
                    mat = scene.getViewMatrix().invert();
                }
                else if (parameter.semantic === "PROJECTIONINVERSE") {
                    mat = scene.getProjectionMatrix().invert();
                }
                else if (parameter.semantic === "MODELVIEWINVERSE") {
                    mat = source.getWorldMatrix().multiply(scene.getViewMatrix()).invert();
                }
                else if (parameter.semantic === "MODELVIEWPROJECTIONINVERSE") {
                    mat = source.getWorldMatrix().multiply(scene.getTransformMatrix()).invert();
                }
                else if (parameter.semantic === "MODELINVERSETRANSPOSE") {
                    mat = BABYLON.Matrix.Transpose(source.getWorldMatrix().invert());
                }
                else {
                    debugger;
                }
                switch (parameter.type) {
                    case GLTF1.EParameterType.FLOAT_MAT2:
                        shaderMaterial.setMatrix2x2(uniformName, BABYLON.Matrix.GetAsMatrix2x2(mat));
                        break;
                    case GLTF1.EParameterType.FLOAT_MAT3:
                        shaderMaterial.setMatrix3x3(uniformName, BABYLON.Matrix.GetAsMatrix3x3(mat));
                        break;
                    case GLTF1.EParameterType.FLOAT_MAT4:
                        shaderMaterial.setMatrix(uniformName, mat);
                        break;
                    default: break;
                }
            };
            /**
             * Sets the given "parameter" matrix
             * @param shaderMaterial: the shader material
             * @param uniform: the name of the shader's uniform
             * @param value: the value of the uniform
             * @param type: the uniform's type (EParameterType FLOAT, VEC2, VEC3 or VEC4)
             */
            GLTFUtils.SetUniform = function (shaderMaterial, uniform, value, type) {
                switch (type) {
                    case GLTF1.EParameterType.FLOAT:
                        shaderMaterial.setFloat(uniform, value);
                        return true;
                    case GLTF1.EParameterType.FLOAT_VEC2:
                        shaderMaterial.setVector2(uniform, BABYLON.Vector2.FromArray(value));
                        return true;
                    case GLTF1.EParameterType.FLOAT_VEC3:
                        shaderMaterial.setVector3(uniform, BABYLON.Vector3.FromArray(value));
                        return true;
                    case GLTF1.EParameterType.FLOAT_VEC4:
                        shaderMaterial.setVector4(uniform, BABYLON.Vector4.FromArray(value));
                        return true;
                    default: return false;
                }
            };
            /**
            * If the uri is a base64 string
            * @param uri: the uri to test
            */
            GLTFUtils.IsBase64 = function (uri) {
                return uri.length < 5 ? false : uri.substr(0, 5) === "data:";
            };
            /**
            * Decode the base64 uri
            * @param uri: the uri to decode
            */
            GLTFUtils.DecodeBase64 = function (uri) {
                var decodedString = atob(uri.split(",")[1]);
                var bufferLength = decodedString.length;
                var bufferView = new Uint8Array(new ArrayBuffer(bufferLength));
                for (var i = 0; i < bufferLength; i++) {
                    bufferView[i] = decodedString.charCodeAt(i);
                }
                return bufferView.buffer;
            };
            /**
            * Returns the wrap mode of the texture
            * @param mode: the mode value
            */
            GLTFUtils.GetWrapMode = function (mode) {
                switch (mode) {
                    case GLTF1.ETextureWrapMode.CLAMP_TO_EDGE: return BABYLON.Texture.CLAMP_ADDRESSMODE;
                    case GLTF1.ETextureWrapMode.MIRRORED_REPEAT: return BABYLON.Texture.MIRROR_ADDRESSMODE;
                    case GLTF1.ETextureWrapMode.REPEAT: return BABYLON.Texture.WRAP_ADDRESSMODE;
                    default: return BABYLON.Texture.WRAP_ADDRESSMODE;
                }
            };
            /**
             * Returns the byte stride giving an accessor
             * @param accessor: the GLTF accessor objet
             */
            GLTFUtils.GetByteStrideFromType = function (accessor) {
                // Needs this function since "byteStride" isn't requiered in glTF format
                var type = accessor.type;
                switch (type) {
                    case "VEC2": return 2;
                    case "VEC3": return 3;
                    case "VEC4": return 4;
                    case "MAT2": return 4;
                    case "MAT3": return 9;
                    case "MAT4": return 16;
                    default: return 1;
                }
            };
            /**
             * Returns the texture filter mode giving a mode value
             * @param mode: the filter mode value
             */
            GLTFUtils.GetTextureFilterMode = function (mode) {
                switch (mode) {
                    case GLTF1.ETextureFilterType.LINEAR:
                    case GLTF1.ETextureFilterType.LINEAR_MIPMAP_NEAREST:
                    case GLTF1.ETextureFilterType.LINEAR_MIPMAP_LINEAR: return BABYLON.Texture.TRILINEAR_SAMPLINGMODE;
                    case GLTF1.ETextureFilterType.NEAREST:
                    case GLTF1.ETextureFilterType.NEAREST_MIPMAP_NEAREST: return BABYLON.Texture.NEAREST_SAMPLINGMODE;
                    default: return BABYLON.Texture.BILINEAR_SAMPLINGMODE;
                }
            };
            GLTFUtils.GetBufferFromBufferView = function (gltfRuntime, bufferView, byteOffset, byteLength, componentType) {
                var byteOffset = bufferView.byteOffset + byteOffset;
                var loadedBufferView = gltfRuntime.loadedBufferViews[bufferView.buffer];
                if (byteOffset + byteLength > loadedBufferView.byteLength) {
                    throw new Error("Buffer access is out of range");
                }
                var buffer = loadedBufferView.buffer;
                byteOffset += loadedBufferView.byteOffset;
                switch (componentType) {
                    case GLTF1.EComponentType.BYTE: return new Int8Array(buffer, byteOffset, byteLength);
                    case GLTF1.EComponentType.UNSIGNED_BYTE: return new Uint8Array(buffer, byteOffset, byteLength);
                    case GLTF1.EComponentType.SHORT: return new Int16Array(buffer, byteOffset, byteLength);
                    case GLTF1.EComponentType.UNSIGNED_SHORT: return new Uint16Array(buffer, byteOffset, byteLength);
                    default: return new Float32Array(buffer, byteOffset, byteLength);
                }
            };
            /**
             * Returns a buffer from its accessor
             * @param gltfRuntime: the GLTF runtime
             * @param accessor: the GLTF accessor
             */
            GLTFUtils.GetBufferFromAccessor = function (gltfRuntime, accessor) {
                var bufferView = gltfRuntime.bufferViews[accessor.bufferView];
                var byteLength = accessor.count * GLTFUtils.GetByteStrideFromType(accessor);
                return GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, accessor.byteOffset, byteLength, accessor.componentType);
            };
            /**
             * Decodes a buffer view into a string
             * @param view: the buffer view
             */
            GLTFUtils.DecodeBufferToText = function (view) {
                var result = "";
                var length = view.byteLength;
                for (var i = 0; i < length; ++i) {
                    result += String.fromCharCode(view[i]);
                }
                return result;
            };
            /**
             * Returns the default material of gltf. Related to
             * https://github.com/KhronosGroup/glTF/tree/master/specification/1.0#appendix-a-default-material
             * @param scene: the Babylon.js scene
             */
            GLTFUtils.GetDefaultMaterial = function (scene) {
                if (!GLTFUtils._DefaultMaterial) {
                    BABYLON.Effect.ShadersStore["GLTFDefaultMaterialVertexShader"] = [
                        "precision highp float;",
                        "",
                        "uniform mat4 worldView;",
                        "uniform mat4 projection;",
                        "",
                        "attribute vec3 position;",
                        "",
                        "void main(void)",
                        "{",
                        "    gl_Position = projection * worldView * vec4(position, 1.0);",
                        "}"
                    ].join("\n");
                    BABYLON.Effect.ShadersStore["GLTFDefaultMaterialPixelShader"] = [
                        "precision highp float;",
                        "",
                        "uniform vec4 u_emission;",
                        "",
                        "void main(void)",
                        "{",
                        "    gl_FragColor = u_emission;",
                        "}"
                    ].join("\n");
                    var shaderPath = {
                        vertex: "GLTFDefaultMaterial",
                        fragment: "GLTFDefaultMaterial"
                    };
                    var options = {
                        attributes: ["position"],
                        uniforms: ["worldView", "projection", "u_emission"],
                        samplers: [],
                        needAlphaBlending: false
                    };
                    GLTFUtils._DefaultMaterial = new BABYLON.ShaderMaterial("GLTFDefaultMaterial", scene, shaderPath, options);
                    GLTFUtils._DefaultMaterial.setColor4("u_emission", new BABYLON.Color4(0.5, 0.5, 0.5, 1.0));
                }
                return GLTFUtils._DefaultMaterial;
            };
            return GLTFUtils;
        }());
        // The GLTF default material
        GLTFUtils._DefaultMaterial = null;
        GLTF1.GLTFUtils = GLTFUtils;
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderUtils.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        var GLTFLoaderExtension = (function () {
            function GLTFLoaderExtension(name) {
                this._name = name;
            }
            Object.defineProperty(GLTFLoaderExtension.prototype, "name", {
                get: function () {
                    return this._name;
                },
                enumerable: true,
                configurable: true
            });
            /**
            * Defines an override for loading the runtime
            * Return true to stop further extensions from loading the runtime
            */
            GLTFLoaderExtension.prototype.loadRuntimeAsync = function (scene, data, rootUrl, onSuccess, onError) {
                return false;
            };
            /**
             * Defines an onverride for creating gltf runtime
             * Return true to stop further extensions from creating the runtime
             */
            GLTFLoaderExtension.prototype.loadRuntimeExtensionsAsync = function (gltfRuntime, onSuccess, onError) {
                return false;
            };
            /**
            * Defines an override for loading buffers
            * Return true to stop further extensions from loading this buffer
            */
            GLTFLoaderExtension.prototype.loadBufferAsync = function (gltfRuntime, id, onSuccess, onError, onProgress) {
                return false;
            };
            /**
            * Defines an override for loading texture buffers
            * Return true to stop further extensions from loading this texture data
            */
            GLTFLoaderExtension.prototype.loadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                return false;
            };
            /**
            * Defines an override for creating textures
            * Return true to stop further extensions from loading this texture
            */
            GLTFLoaderExtension.prototype.createTextureAsync = function (gltfRuntime, id, buffer, onSuccess, onError) {
                return false;
            };
            /**
            * Defines an override for loading shader strings
            * Return true to stop further extensions from loading this shader data
            */
            GLTFLoaderExtension.prototype.loadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
                return false;
            };
            /**
            * Defines an override for loading materials
            * Return true to stop further extensions from loading this material
            */
            GLTFLoaderExtension.prototype.loadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
                return false;
            };
            // ---------
            // Utilities
            // ---------
            GLTFLoaderExtension.LoadRuntimeAsync = function (scene, data, rootUrl, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadRuntimeAsync(scene, data, rootUrl, onSuccess, onError);
                }, function () {
                    setTimeout(function () {
                        onSuccess(GLTF1.GLTFLoaderBase.CreateRuntime(data.json, scene, rootUrl));
                    });
                });
            };
            GLTFLoaderExtension.LoadRuntimeExtensionsAsync = function (gltfRuntime, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadRuntimeExtensionsAsync(gltfRuntime, onSuccess, onError);
                }, function () {
                    setTimeout(function () {
                        onSuccess();
                    });
                });
            };
            GLTFLoaderExtension.LoadBufferAsync = function (gltfRuntime, id, onSuccess, onError, onProgress) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadBufferAsync(gltfRuntime, id, onSuccess, onError, onProgress);
                }, function () {
                    GLTF1.GLTFLoaderBase.LoadBufferAsync(gltfRuntime, id, onSuccess, onError, onProgress);
                });
            };
            GLTFLoaderExtension.LoadTextureAsync = function (gltfRuntime, id, onSuccess, onError) {
                GLTFLoaderExtension.LoadTextureBufferAsync(gltfRuntime, id, function (buffer) { return GLTFLoaderExtension.CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError); }, onError);
            };
            GLTFLoaderExtension.LoadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
                }, function () {
                    GLTF1.GLTFLoaderBase.LoadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
                });
            };
            GLTFLoaderExtension.LoadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadMaterialAsync(gltfRuntime, id, onSuccess, onError);
                }, function () {
                    GLTF1.GLTFLoaderBase.LoadMaterialAsync(gltfRuntime, id, onSuccess, onError);
                });
            };
            GLTFLoaderExtension.LoadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
                }, function () {
                    GLTF1.GLTFLoaderBase.LoadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
                });
            };
            GLTFLoaderExtension.CreateTextureAsync = function (gltfRuntime, id, buffer, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.createTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
                }, function () {
                    GLTF1.GLTFLoaderBase.CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
                });
            };
            GLTFLoaderExtension.ApplyExtensions = function (func, defaultFunc) {
                for (var extensionName in GLTF1.GLTFLoader.Extensions) {
                    var loaderExtension = GLTF1.GLTFLoader.Extensions[extensionName];
                    if (func(loaderExtension)) {
                        return;
                    }
                }
                defaultFunc();
            };
            return GLTFLoaderExtension;
        }());
        GLTF1.GLTFLoaderExtension = GLTFLoaderExtension;
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderExtension.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        var BinaryExtensionBufferName = "binary_glTF";
        var EContentFormat;
        (function (EContentFormat) {
            EContentFormat[EContentFormat["JSON"] = 0] = "JSON";
        })(EContentFormat || (EContentFormat = {}));
        ;
        ;
        ;
        var GLTFBinaryExtension = (function (_super) {
            __extends(GLTFBinaryExtension, _super);
            function GLTFBinaryExtension() {
                return _super.call(this, "KHR_binary_glTF") || this;
            }
            GLTFBinaryExtension.prototype.loadRuntimeAsync = function (scene, data, rootUrl, onSuccess, onError) {
                var extensionsUsed = data.json.extensionsUsed;
                if (!extensionsUsed || extensionsUsed.indexOf(this.name) === -1) {
                    return false;
                }
                this._bin = data.bin;
                onSuccess(GLTF1.GLTFLoaderBase.CreateRuntime(data.json, scene, rootUrl));
                return true;
            };
            GLTFBinaryExtension.prototype.loadBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                if (gltfRuntime.extensionsUsed.indexOf(this.name) === -1) {
                    return false;
                }
                if (id !== BinaryExtensionBufferName) {
                    return false;
                }
                onSuccess(this._bin);
                return true;
            };
            GLTFBinaryExtension.prototype.loadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                var texture = gltfRuntime.textures[id];
                var source = gltfRuntime.images[texture.source];
                if (!source.extensions || !(this.name in source.extensions)) {
                    return false;
                }
                var sourceExt = source.extensions[this.name];
                var bufferView = gltfRuntime.bufferViews[sourceExt.bufferView];
                var buffer = GLTF1.GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, 0, bufferView.byteLength, GLTF1.EComponentType.UNSIGNED_BYTE);
                onSuccess(buffer);
                return true;
            };
            GLTFBinaryExtension.prototype.loadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
                var shader = gltfRuntime.shaders[id];
                if (!shader.extensions || !(this.name in shader.extensions)) {
                    return false;
                }
                var binaryExtensionShader = shader.extensions[this.name];
                var bufferView = gltfRuntime.bufferViews[binaryExtensionShader.bufferView];
                var shaderBytes = GLTF1.GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, 0, bufferView.byteLength, GLTF1.EComponentType.UNSIGNED_BYTE);
                setTimeout(function () {
                    var shaderString = GLTF1.GLTFUtils.DecodeBufferToText(shaderBytes);
                    onSuccess(shaderString);
                });
                return true;
            };
            return GLTFBinaryExtension;
        }(GLTF1.GLTFLoaderExtension));
        GLTF1.GLTFBinaryExtension = GLTFBinaryExtension;
        var BinaryReader = (function () {
            function BinaryReader(arrayBuffer) {
                this._arrayBuffer = arrayBuffer;
                this._dataView = new DataView(arrayBuffer);
                this._byteOffset = 0;
            }
            BinaryReader.prototype.getUint32 = function () {
                var value = this._dataView.getUint32(this._byteOffset, true);
                this._byteOffset += 4;
                return value;
            };
            BinaryReader.prototype.getUint8Array = function (length) {
                if (!length) {
                    length = this._arrayBuffer.byteLength - this._byteOffset;
                }
                var value = new Uint8Array(this._arrayBuffer, this._byteOffset, length);
                this._byteOffset += length;
                return value;
            };
            return BinaryReader;
        }());
        GLTF1.GLTFLoader.RegisterExtension(new GLTFBinaryExtension());
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFBinaryExtension.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        ;
        ;
        ;
        var GLTFMaterialsCommonExtension = (function (_super) {
            __extends(GLTFMaterialsCommonExtension, _super);
            function GLTFMaterialsCommonExtension() {
                return _super.call(this, "KHR_materials_common") || this;
            }
            GLTFMaterialsCommonExtension.prototype.loadRuntimeExtensionsAsync = function (gltfRuntime, onSuccess, onError) {
                if (!gltfRuntime.extensions)
                    return false;
                var extension = gltfRuntime.extensions[this.name];
                if (!extension)
                    return false;
                // Create lights
                var lights = extension.lights;
                if (lights) {
                    for (var thing in lights) {
                        var light = lights[thing];
                        switch (light.type) {
                            case "ambient":
                                var ambientLight = new BABYLON.HemisphericLight(light.name, new BABYLON.Vector3(0, 1, 0), gltfRuntime.scene);
                                var ambient = light.ambient;
                                ambientLight.diffuse = BABYLON.Color3.FromArray(ambient.color || [1, 1, 1]);
                                break;
                            case "point":
                                var pointLight = new BABYLON.PointLight(light.name, new BABYLON.Vector3(10, 10, 10), gltfRuntime.scene);
                                var point = light.point;
                                pointLight.diffuse = BABYLON.Color3.FromArray(point.color || [1, 1, 1]);
                                break;
                            case "directional":
                                var dirLight = new BABYLON.DirectionalLight(light.name, new BABYLON.Vector3(0, -1, 0), gltfRuntime.scene);
                                var directional = light.directional;
                                dirLight.diffuse = BABYLON.Color3.FromArray(directional.color || [1, 1, 1]);
                                break;
                            case "spot":
                                var spot = light.spot;
                                var spotLight = new BABYLON.SpotLight(light.name, new BABYLON.Vector3(0, 10, 0), new BABYLON.Vector3(0, -1, 0), light.spot.fallOffAngle || Math.PI, light.spot.fallOffExponent || 0.0, gltfRuntime.scene);
                                spotLight.diffuse = BABYLON.Color3.FromArray(spot.color || [1, 1, 1]);
                                break;
                            default:
                                BABYLON.Tools.Warn("GLTF Material Common extension: light type \"" + light.type + "\” not supported");
                                break;
                        }
                    }
                }
                return false;
            };
            GLTFMaterialsCommonExtension.prototype.loadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
                var material = gltfRuntime.materials[id];
                if (!material || !material.extensions)
                    return false;
                var extension = material.extensions[this.name];
                if (!extension)
                    return false;
                var standardMaterial = new BABYLON.StandardMaterial(id, gltfRuntime.scene);
                standardMaterial.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                if (extension.technique === "CONSTANT") {
                    standardMaterial.disableLighting = true;
                }
                standardMaterial.backFaceCulling = extension.doubleSided === undefined ? false : !extension.doubleSided;
                standardMaterial.alpha = extension.values.transparency === undefined ? 1.0 : extension.values.transparency;
                standardMaterial.specularPower = extension.values.shininess === undefined ? 0.0 : extension.values.shininess;

                let texturesLeft = 0;

                function onEachSuccess() {
                    texturesLeft--;
                    if (texturesLeft === 0) {
                        onSuccess();
                    }
                }

                // Ambient
                if (typeof extension.values.ambient === "string") {
                    texturesLeft++;
                    this._loadTexture(gltfRuntime, extension.values.ambient, standardMaterial, "ambientTexture", onEachSuccess, onError);
                }
                else {
                    standardMaterial.ambientColor = BABYLON.Color3.FromArray(extension.values.ambient || [0, 0, 0]);
                }
                // Diffuse
                if (typeof extension.values.diffuse === "string") {
                    texturesLeft++;
                    this._loadTexture(gltfRuntime, extension.values.diffuse, standardMaterial, "diffuseTexture", onEachSuccess, onError);
                }
                else {
                    standardMaterial.diffuseColor = BABYLON.Color3.FromArray(extension.values.diffuse || [0, 0, 0]);
                }
                // Emission
                if (typeof extension.values.emission === "string") {
                    texturesLeft++;
                    this._loadTexture(gltfRuntime, extension.values.emission, standardMaterial, "emissiveTexture", onEachSuccess, onError);
                }
                else {
                    standardMaterial.emissiveColor = BABYLON.Color3.FromArray(extension.values.emission || [0, 0, 0]);
                }
                // Specular
                if (typeof extension.values.specular === "string") {
                    texturesLeft++;
                    this._loadTexture(gltfRuntime, extension.values.specular, standardMaterial, "specularTexture", onEachSuccess, onError);
                }
                else {
                    standardMaterial.specularColor = BABYLON.Color3.FromArray(extension.values.specular || [0, 0, 0]);
                }

                if (texturesLeft === 0) {
                    onSuccess();
                }

                return true;
            };
            GLTFMaterialsCommonExtension.prototype._loadTexture = function (gltfRuntime, id, material, propertyPath, onSuccess, onError) {
                // Create buffer from texture url
                GLTF1.GLTFLoaderBase.LoadTextureBufferAsync(gltfRuntime, id, function (buffer) {
                    // Create texture from buffer
                    GLTF1.GLTFLoaderBase.CreateTextureAsync(gltfRuntime, id, buffer, function (texture) {
                        material[propertyPath] = texture;
                        onSuccess();
                    }, onError);
                }, onError);
            };
            return GLTFMaterialsCommonExtension;
        }(GLTF1.GLTFLoaderExtension));
        GLTF1.GLTFMaterialsCommonExtension = GLTFMaterialsCommonExtension;
        GLTF1.GLTFLoader.RegisterExtension(new GLTFMaterialsCommonExtension());
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFMaterialsCommonExtension.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
        * Enums
        */
        var EComponentType;
        (function (EComponentType) {
            EComponentType[EComponentType["BYTE"] = 5120] = "BYTE";
            EComponentType[EComponentType["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
            EComponentType[EComponentType["SHORT"] = 5122] = "SHORT";
            EComponentType[EComponentType["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
            EComponentType[EComponentType["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
            EComponentType[EComponentType["FLOAT"] = 5126] = "FLOAT";
        })(EComponentType = GLTF2.EComponentType || (GLTF2.EComponentType = {}));
        var EMeshPrimitiveMode;
        (function (EMeshPrimitiveMode) {
            EMeshPrimitiveMode[EMeshPrimitiveMode["POINTS"] = 0] = "POINTS";
            EMeshPrimitiveMode[EMeshPrimitiveMode["LINES"] = 1] = "LINES";
            EMeshPrimitiveMode[EMeshPrimitiveMode["LINE_LOOP"] = 2] = "LINE_LOOP";
            EMeshPrimitiveMode[EMeshPrimitiveMode["LINE_STRIP"] = 3] = "LINE_STRIP";
            EMeshPrimitiveMode[EMeshPrimitiveMode["TRIANGLES"] = 4] = "TRIANGLES";
            EMeshPrimitiveMode[EMeshPrimitiveMode["TRIANGLE_STRIP"] = 5] = "TRIANGLE_STRIP";
            EMeshPrimitiveMode[EMeshPrimitiveMode["TRIANGLE_FAN"] = 6] = "TRIANGLE_FAN";
        })(EMeshPrimitiveMode = GLTF2.EMeshPrimitiveMode || (GLTF2.EMeshPrimitiveMode = {}));
        var ETextureMagFilter;
        (function (ETextureMagFilter) {
            ETextureMagFilter[ETextureMagFilter["NEAREST"] = 9728] = "NEAREST";
            ETextureMagFilter[ETextureMagFilter["LINEAR"] = 9729] = "LINEAR";
        })(ETextureMagFilter = GLTF2.ETextureMagFilter || (GLTF2.ETextureMagFilter = {}));
        var ETextureMinFilter;
        (function (ETextureMinFilter) {
            ETextureMinFilter[ETextureMinFilter["NEAREST"] = 9728] = "NEAREST";
            ETextureMinFilter[ETextureMinFilter["LINEAR"] = 9729] = "LINEAR";
            ETextureMinFilter[ETextureMinFilter["NEAREST_MIPMAP_NEAREST"] = 9984] = "NEAREST_MIPMAP_NEAREST";
            ETextureMinFilter[ETextureMinFilter["LINEAR_MIPMAP_NEAREST"] = 9985] = "LINEAR_MIPMAP_NEAREST";
            ETextureMinFilter[ETextureMinFilter["NEAREST_MIPMAP_LINEAR"] = 9986] = "NEAREST_MIPMAP_LINEAR";
            ETextureMinFilter[ETextureMinFilter["LINEAR_MIPMAP_LINEAR"] = 9987] = "LINEAR_MIPMAP_LINEAR";
        })(ETextureMinFilter = GLTF2.ETextureMinFilter || (GLTF2.ETextureMinFilter = {}));
        var ETextureWrapMode;
        (function (ETextureWrapMode) {
            ETextureWrapMode[ETextureWrapMode["CLAMP_TO_EDGE"] = 33071] = "CLAMP_TO_EDGE";
            ETextureWrapMode[ETextureWrapMode["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
            ETextureWrapMode[ETextureWrapMode["REPEAT"] = 10497] = "REPEAT";
        })(ETextureWrapMode = GLTF2.ETextureWrapMode || (GLTF2.ETextureWrapMode = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderInterfaces.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
        * Values
        */
        var glTFAnimationPaths = ["translation", "rotation", "scale", "weights"];
        var babylonAnimationPaths = ["position", "rotationQuaternion", "scaling", "influence"];
        /**
        * Utils
        */
        var normalizeUVs = function (buffer) {
            if (!buffer) {
                return;
            }
            for (var i = 0; i < buffer.length / 2; i++) {
                buffer[i * 2 + 1] = 1.0 - buffer[i * 2 + 1];
            }
        };
        var createStringId = function (index) {
            return "node" + index;
        };
        /**
        * Returns the animation path (glTF -> Babylon)
        */
        var getAnimationPath = function (path) {
            var index = glTFAnimationPaths.indexOf(path);
            if (index !== -1) {
                return babylonAnimationPaths[index];
            }
            return path;
        };
        /**
        * Loads and creates animations
        */
        var loadAnimations = function (runtime) {
            var animations = runtime.gltf.animations;
            if (!animations) {
                return;
            }
            for (var animationIndex = 0; animationIndex < animations.length; animationIndex++) {
                var animation = animations[animationIndex];
                if (!animation || !animation.channels || !animation.samplers) {
                    continue;
                }
                var lastAnimation = null;
                for (var channelIndex = 0; channelIndex < animation.channels.length; channelIndex++) {
                    var channel = animation.channels[channelIndex];
                    if (!channel) {
                        continue;
                    }
                    var sampler = animation.samplers[channel.sampler];
                    if (!sampler) {
                        continue;
                    }
                    var inputData = sampler.input;
                    var outputData = sampler.output;
                    var bufferInput = GLTF2.GLTFUtils.GetBufferFromAccessor(runtime, runtime.gltf.accessors[inputData]);
                    var bufferOutput = GLTF2.GLTFUtils.GetBufferFromAccessor(runtime, runtime.gltf.accessors[outputData]);
                    var targetID = channel.target.node;
                    var targetNode = runtime.babylonScene.getNodeByID(createStringId(targetID));
                    if (targetNode === null) {
                        BABYLON.Tools.Warn("Creating animation index " + animationIndex + " but cannot find node index " + targetID + " to attach to");
                        continue;
                    }
                    var isBone = targetNode instanceof BABYLON.Bone;
                    var numTargets = 0;
                    // Get target path (position, rotation, scaling, or weights)
                    var targetPath = channel.target.path;
                    var targetPathIndex = glTFAnimationPaths.indexOf(targetPath);
                    if (targetPathIndex !== -1) {
                        targetPath = babylonAnimationPaths[targetPathIndex];
                    }
                    var isMorph = targetPath === "influence";
                    // Determine animation type
                    var animationType = BABYLON.Animation.ANIMATIONTYPE_MATRIX;
                    if (!isBone) {
                        if (targetPath === "rotationQuaternion") {
                            animationType = BABYLON.Animation.ANIMATIONTYPE_QUATERNION;
                            targetNode.rotationQuaternion = new BABYLON.Quaternion();
                        }
                        else if (isMorph) {
                            animationType = BABYLON.Animation.ANIMATIONTYPE_FLOAT;
                            numTargets = targetNode.morphTargetManager.numTargets;
                        }
                        else {
                            animationType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
                        }
                    }
                    // Create animation and key frames
                    var babylonAnimation = null;
                    var keys = [];
                    var arrayOffset = 0;
                    var modifyKey = false;
                    if (isBone && lastAnimation && lastAnimation.getKeys().length === bufferInput.length) {
                        babylonAnimation = lastAnimation;
                        modifyKey = true;
                    }
                    // Each morph animation may have more than one more, so we need a
                    // multi dimensional array.
                    if (isMorph) {
                        for (var influence = 0; influence < numTargets; influence++) {
                            keys[influence] = [];
                        }
                    }
                    // For each frame
                    for (var frameIndex = 0; frameIndex < bufferInput.length; frameIndex++) {
                        var value = null;
                        if (targetPath === "rotationQuaternion") {
                            value = BABYLON.Quaternion.FromArray([bufferOutput[arrayOffset], bufferOutput[arrayOffset + 1], bufferOutput[arrayOffset + 2], bufferOutput[arrayOffset + 3]]);
                            arrayOffset += 4;
                        }
                        else if (isMorph) {
                            value = [];
                            // There is 1 value for each morph target for each frame
                            for (var influence = 0; influence < numTargets; influence++) {
                                value.push(bufferOutput[arrayOffset + influence]);
                            }
                            arrayOffset += numTargets;
                        }
                        else {
                            value = BABYLON.Vector3.FromArray([bufferOutput[arrayOffset], bufferOutput[arrayOffset + 1], bufferOutput[arrayOffset + 2]]);
                            arrayOffset += 3;
                        }
                        if (isBone) {
                            var bone = targetNode;
                            var translation = BABYLON.Vector3.Zero();
                            var rotationQuaternion = new BABYLON.Quaternion();
                            var scaling = BABYLON.Vector3.Zero();
                            // Warning on decompose
                            var mat = bone.getBaseMatrix();
                            if (modifyKey) {
                                mat = lastAnimation.getKeys()[frameIndex].value;
                            }
                            mat.decompose(scaling, rotationQuaternion, translation);
                            if (targetPath === "position") {
                                translation = value;
                            }
                            else if (targetPath === "rotationQuaternion") {
                                rotationQuaternion = value;
                            }
                            else {
                                scaling = value;
                            }
                            value = BABYLON.Matrix.Compose(scaling, rotationQuaternion, translation);
                        }
                        if (!modifyKey) {
                            if (isMorph) {
                                for (var influence = 0; influence < numTargets; influence++) {
                                    keys[influence].push({
                                        frame: bufferInput[frameIndex],
                                        value: value[influence]
                                    });
                                }
                            }
                            else {
                                keys.push({
                                    frame: bufferInput[frameIndex],
                                    value: value
                                });
                            }
                        }
                        else {
                            lastAnimation.getKeys()[frameIndex].value = value;
                        }
                    }
                    // Finish
                    if (!modifyKey) {
                        if (isMorph) {
                            for (var influence = 0; influence < numTargets; influence++) {
                                var morphTarget = targetNode.morphTargetManager.getTarget(influence);
                                if (morphTarget.animations === undefined) {
                                    morphTarget.animations = [];
                                }
                                var animationName = (animation.name || "anim" + animationIndex) + "_" + influence;
                                babylonAnimation = new BABYLON.Animation(animationName, targetPath, 1, animationType, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
                                babylonAnimation.setKeys(keys[influence]);
                                morphTarget.animations.push(babylonAnimation);
                            }
                        }
                        else {
                            var animationName = animation.name || "anim" + animationIndex;
                            babylonAnimation = new BABYLON.Animation(animationName, isBone ? "_matrix" : targetPath, 1, animationType, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
                            babylonAnimation.setKeys(keys);
                            targetNode.animations.push(babylonAnimation);
                        }
                    }
                    lastAnimation = babylonAnimation;
                    if (isMorph) {
                        for (var influence = 0; influence < numTargets; influence++) {
                            var morph = targetNode.morphTargetManager.getTarget(influence);
                            runtime.babylonScene.stopAnimation(morph);
                            runtime.babylonScene.beginAnimation(morph, 0, bufferInput[bufferInput.length - 1], true, 1.0);
                        }
                    }
                    else {
                        runtime.babylonScene.stopAnimation(targetNode);
                        runtime.babylonScene.beginAnimation(targetNode, 0, bufferInput[bufferInput.length - 1], true, 1.0);
                    }
                }
            }
        };
        /**
        * Returns the bones transformation matrix
        */
        var configureBoneTransformation = function (node) {
            var mat = null;
            if (node.translation || node.rotation || node.scale) {
                var scale = BABYLON.Vector3.FromArray(node.scale || [1, 1, 1]);
                var rotation = BABYLON.Quaternion.FromArray(node.rotation || [0, 0, 0, 1]);
                var position = BABYLON.Vector3.FromArray(node.translation || [0, 0, 0]);
                mat = BABYLON.Matrix.Compose(scale, rotation, position);
            }
            else {
                mat = node.matrix ? BABYLON.Matrix.FromArray(node.matrix) : BABYLON.Matrix.Identity();
            }
            return mat;
        };
        /**
        * Returns the parent bone
        */
        var getParentBone = function (runtime, skin, index, newSkeleton) {
            // Try to find
            var nodeStringID = createStringId(index);
            for (var i = 0; i < newSkeleton.bones.length; i++) {
                if (newSkeleton.bones[i].id === nodeStringID) {
                    return newSkeleton.bones[i].getParent();
                }
            }
            // Not found, search in gltf nodes
            var joints = skin.joints;
            for (var j = 0; j < joints.length; j++) {
                var parentID = joints[j];
                var parent = runtime.gltf.nodes[parentID];
                var children = parent.children;
                for (var i = 0; i < children.length; i++) {
                    var childID = children[i];
                    var child = runtime.gltf.nodes[childID];
                    if (!nodeIsInJoints(skin, childID)) {
                        continue;
                    }
                    if (childID === index) {
                        var mat = configureBoneTransformation(parent);
                        var bone = new BABYLON.Bone(parent.name || createStringId(parentID), newSkeleton, getParentBone(runtime, skin, parentID, newSkeleton), mat);
                        bone.id = createStringId(parentID);
                        return bone;
                    }
                }
            }
            return null;
        };
        /**
        * Returns the appropriate root node
        */
        var getNodeToRoot = function (nodesToRoot, index) {
            for (var i = 0; i < nodesToRoot.length; i++) {
                var nodeToRoot = nodesToRoot[i];
                if (nodeToRoot.node.children) {
                    for (var j = 0; j < nodeToRoot.node.children.length; j++) {
                        var child = nodeToRoot.node.children[j];
                        if (child === index) {
                            return nodeToRoot.bone;
                        }
                    }
                }
            }
            return null;
        };
        /**
        * Returns the node with the node index
        */
        var getJointNode = function (runtime, index) {
            var node = runtime.gltf.nodes[index];
            if (node) {
                return {
                    node: node,
                    index: index
                };
            }
            return null;
        };
        /**
        * Checks if a nodes is in joints
        */
        var nodeIsInJoints = function (skin, index) {
            for (var i = 0; i < skin.joints.length; i++) {
                if (skin.joints[i] === index) {
                    return true;
                }
            }
            return false;
        };
        /**
        * Fills the nodes to root for bones and builds hierarchy
        */
        var getNodesToRoot = function (runtime, newSkeleton, skin, nodesToRoot) {
            // Creates nodes for root
            for (var i = 0; i < runtime.gltf.nodes.length; i++) {
                var node = runtime.gltf.nodes[i];
                if (nodeIsInJoints(skin, i)) {
                    continue;
                }
                // Create node to root bone
                var mat = configureBoneTransformation(node);
                var bone = new BABYLON.Bone(node.name || createStringId(i), newSkeleton, null, mat);
                bone.id = createStringId(i);
                nodesToRoot.push({ bone: bone, node: node, index: i });
            }
            // Parenting
            for (var i = 0; i < nodesToRoot.length; i++) {
                var nodeToRoot = nodesToRoot[i];
                var children = nodeToRoot.node.children;
                if (children) {
                    for (var j = 0; j < children.length; j++) {
                        var child = null;
                        for (var k = 0; k < nodesToRoot.length; k++) {
                            if (nodesToRoot[k].index === children[j]) {
                                child = nodesToRoot[k];
                                break;
                            }
                        }
                        if (child) {
                            child.bone._parent = nodeToRoot.bone;
                            nodeToRoot.bone.children.push(child.bone);
                        }
                    }
                }
            }
        };
        /**
        * Imports a skeleton
        */
        var importSkeleton = function (runtime, skinNode, skin) {
            var name = skin.name || "skin" + skinNode.skin;
            var babylonSkeleton = skin.babylonSkeleton;
            if (!babylonSkeleton) {
                babylonSkeleton = new BABYLON.Skeleton(name, "skin" + skinNode.skin, runtime.babylonScene);
            }
            if (!skin.babylonSkeleton) {
                return babylonSkeleton;
            }
            // Matrices
            var accessor = runtime.gltf.accessors[skin.inverseBindMatrices];
            var buffer = GLTF2.GLTFUtils.GetBufferFromAccessor(runtime, accessor);
            // Find the root bones
            var nodesToRoot = [];
            var nodesToRootToAdd = [];
            getNodesToRoot(runtime, babylonSkeleton, skin, nodesToRoot);
            babylonSkeleton.bones = [];
            // Joints
            for (var i = 0; i < skin.joints.length; i++) {
                var jointNode = getJointNode(runtime, skin.joints[i]);
                var node = jointNode.node;
                if (!node) {
                    BABYLON.Tools.Warn("Joint index " + skin.joints[i] + " does not exist");
                    continue;
                }
                var index = jointNode.index;
                var stringID = createStringId(index);
                // Optimize, if the bone already exists...
                var existingBone = runtime.babylonScene.getBoneByID(stringID);
                if (existingBone) {
                    babylonSkeleton.bones.push(existingBone);
                    continue;
                }
                // Search for parent bone
                var foundBone = false;
                var parentBone = null;
                for (var j = 0; j < i; j++) {
                    var joint = getJointNode(runtime, skin.joints[j]).node;
                    if (!joint) {
                        BABYLON.Tools.Warn("Joint index " + skin.joints[j] + " does not exist when looking for parent");
                        continue;
                    }
                    var children = joint.children;
                    foundBone = false;
                    for (var k = 0; k < children.length; k++) {
                        if (children[k] === index) {
                            parentBone = getParentBone(runtime, skin, skin.joints[j], babylonSkeleton);
                            foundBone = true;
                            break;
                        }
                    }
                    if (foundBone) {
                        break;
                    }
                }
                // Create bone
                var mat = configureBoneTransformation(node);
                if (!parentBone && nodesToRoot.length > 0) {
                    parentBone = getNodeToRoot(nodesToRoot, index);
                    if (parentBone) {
                        if (nodesToRootToAdd.indexOf(parentBone) === -1) {
                            nodesToRootToAdd.push(parentBone);
                        }
                    }
                }
                var bone = new BABYLON.Bone(node.name || stringID, babylonSkeleton, parentBone, mat);
                bone.id = stringID;
            }
            // Polish
            var bones = babylonSkeleton.bones;
            babylonSkeleton.bones = [];
            for (var i = 0; i < skin.joints.length; i++) {
                var jointNode = getJointNode(runtime, skin.joints[i]);
                if (!jointNode) {
                    continue;
                }
                var jointNodeStringId = createStringId(jointNode.index);
                for (var j = 0; j < bones.length; j++) {
                    if (bones[j].id === jointNodeStringId) {
                        babylonSkeleton.bones.push(bones[j]);
                        break;
                    }
                }
            }
            babylonSkeleton.prepare();
            // Finish
            for (var i = 0; i < nodesToRootToAdd.length; i++) {
                babylonSkeleton.bones.push(nodesToRootToAdd[i]);
            }
            return babylonSkeleton;
        };
        /**
         * Gets a material
         */
        var getMaterial = function (runtime, index) {
            if (index === undefined) {
                return GLTF2.GLTFUtils.GetDefaultMaterial(runtime);
            }
            var materials = runtime.gltf.materials;
            if (!materials || index < 0 || index >= materials.length) {
                BABYLON.Tools.Error("Invalid material index");
                return GLTF2.GLTFUtils.GetDefaultMaterial(runtime);
            }
            var material = runtime.gltf.materials[index].babylonMaterial;
            if (!material) {
                return GLTF2.GLTFUtils.GetDefaultMaterial(runtime);
            }
            return material;
        };
        /**
        * Imports a mesh and its geometries
        */
        var importMesh = function (runtime, node, mesh) {
            var name = mesh.name || node.name || "mesh" + node.mesh;
            var babylonMesh = node.babylonNode;
            if (!babylonMesh) {
                babylonMesh = new BABYLON.Mesh(name, runtime.babylonScene);
            }
            if (!node.babylonNode) {
                return babylonMesh;
            }
            var multiMat = new BABYLON.MultiMaterial(name, runtime.babylonScene);
            if (!babylonMesh.material) {
                babylonMesh.material = multiMat;
            }
            var vertexData = new BABYLON.VertexData();
            var geometry = new BABYLON.Geometry(name, runtime.babylonScene, vertexData, false, babylonMesh);
            var verticesStarts = [];
            var verticesCounts = [];
            var indexStarts = [];
            var indexCounts = [];
            var morphTargetManager = new BABYLON.MorphTargetManager();
            // Positions, normals and UVs
            for (var primitiveIndex = 0; primitiveIndex < mesh.primitives.length; primitiveIndex++) {
                // Temporary vertex data
                var tempVertexData = new BABYLON.VertexData();
                var primitive = mesh.primitives[primitiveIndex];
                if (primitive.mode !== GLTF2.EMeshPrimitiveMode.TRIANGLES) {
                    // continue;
                }
                var attributes = primitive.attributes;
                var accessor = null;
                var buffer = null;
                // Set positions, normal and uvs
                for (var semantic in attributes) {
                    // Link accessor and buffer view
                    accessor = runtime.gltf.accessors[attributes[semantic]];
                    buffer = GLTF2.GLTFUtils.GetBufferFromAccessor(runtime, accessor);
                    if (semantic === "NORMAL") {
                        tempVertexData.normals = new Float32Array(buffer.length);
                        tempVertexData.normals.set(buffer);
                    }
                    else if (semantic === "POSITION") {
                        tempVertexData.positions = new Float32Array(buffer.length);
                        tempVertexData.positions.set(buffer);
                        verticesCounts.push(tempVertexData.positions.length);
                    }
                    else if (semantic === "TANGENT") {
                        tempVertexData.tangents = new Float32Array(buffer.length);
                        tempVertexData.tangents.set(buffer);
                    }
                    else if (semantic.indexOf("TEXCOORD_") !== -1) {
                        var channel = Number(semantic.split("_")[1]);
                        var uvKind = BABYLON.VertexBuffer.UVKind + (channel === 0 ? "" : (channel + 1));
                        var uvs = new Float32Array(buffer.length);
                        uvs.set(buffer);
                        normalizeUVs(uvs);
                        tempVertexData.set(uvs, uvKind);
                    }
                    else if (semantic === "JOINT") {
                        tempVertexData.matricesIndices = new Float32Array(buffer.length);
                        tempVertexData.matricesIndices.set(buffer);
                    }
                    else if (semantic === "WEIGHT") {
                        tempVertexData.matricesWeights = new Float32Array(buffer.length);
                        tempVertexData.matricesWeights.set(buffer);
                    }
                    else if (semantic === "COLOR_0") {
                        tempVertexData.colors = new Float32Array(buffer.length);
                        tempVertexData.colors.set(buffer);
                    }
                    else {
                        BABYLON.Tools.Warn("Ignoring unrecognized semantic '" + semantic + "'");
                    }
                }
                // Indices
                accessor = runtime.gltf.accessors[primitive.indices];
                if (accessor) {
                    buffer = GLTF2.GLTFUtils.GetBufferFromAccessor(runtime, accessor);
                    tempVertexData.indices = new Int32Array(buffer.length);
                    tempVertexData.indices.set(buffer);
                    indexCounts.push(tempVertexData.indices.length);
                }
                else {
                    // Set indices on the fly
                    var indices = [];
                    for (var index = 0; index < tempVertexData.positions.length / 3; index++) {
                        indices.push(index);
                    }
                    tempVertexData.indices = new Int32Array(indices);
                    indexCounts.push(tempVertexData.indices.length);
                }
                vertexData.merge(tempVertexData);
                tempVertexData = undefined;
                // Sub material
                var material = getMaterial(runtime, primitive.material);
                multiMat.subMaterials.push(material);
                // Morph Targets
                if (primitive.targets !== undefined) {
                    for (var targetsIndex = 0; targetsIndex < primitive.targets.length; targetsIndex++) {
                        var target = primitive.targets[targetsIndex];
                        var weight = 0.0;
                        if (node.weights !== undefined) {
                            weight = node.weights[targetsIndex];
                        }
                        else if (mesh.weights !== undefined) {
                            weight = mesh.weights[targetsIndex];
                        }
                        var morph = new BABYLON.MorphTarget("morph" + targetsIndex, weight);
                        for (var semantic in target) {
                            // Link accessor and buffer view
                            accessor = runtime.gltf.accessors[target[semantic]];
                            buffer = GLTF2.GLTFUtils.GetBufferFromAccessor(runtime, accessor);
                            if (accessor.name !== undefined) {
                                morph.name = accessor.name;
                            }
                            // glTF stores morph target information as deltas
                            // while babylon.js expects the final data.
                            // As a result we have to add the original data to the delta to calculate
                            // the final data.
                            if (semantic === "NORMAL") {
                                for (var bufferIndex = 0; bufferIndex < buffer.length; bufferIndex++) {
                                    buffer[bufferIndex] += vertexData.normals[bufferIndex];
                                }
                                morph.setNormals(buffer);
                            }
                            else if (semantic === "POSITION") {
                                for (var bufferIndex = 0; bufferIndex < buffer.length; bufferIndex++) {
                                    buffer[bufferIndex] += vertexData.positions[bufferIndex];
                                }
                                morph.setPositions(buffer);
                            }
                            else if (semantic === "TANGENT") {
                                // Tangent data for morph targets is stored as xyz delta.
                                // The vertexData.tangent is stored as xyzw.
                                // So we need to skip every fourth vertexData.tangent.
                                for (var bufferIndex = 0, tangentsIndex = 0; bufferIndex < buffer.length; bufferIndex++, tangentsIndex++) {
                                    buffer[bufferIndex] += vertexData.tangents[tangentsIndex];
                                    if ((bufferIndex + 1) % 3 == 0) {
                                        tangentsIndex++;
                                    }
                                }
                                morph.setTangents(buffer);
                            }
                            else {
                                BABYLON.Tools.Warn("Ignoring unrecognized semantic '" + semantic + "'");
                            }
                        }
                        if (morph.getPositions() !== undefined) {
                            morphTargetManager.addTarget(morph);
                        }
                        else {
                            BABYLON.Tools.Warn("Not adding morph target '" + morph.name + "' because it has no position data");
                        }
                    }
                }
                // Update vertices start and index start
                verticesStarts.push(verticesStarts.length === 0 ? 0 : verticesStarts[verticesStarts.length - 1] + verticesCounts[verticesCounts.length - 2]);
                indexStarts.push(indexStarts.length === 0 ? 0 : indexStarts[indexStarts.length - 1] + indexCounts[indexCounts.length - 2]);
            }
            // Apply geometry
            geometry.setAllVerticesData(vertexData, false);
            babylonMesh.computeWorldMatrix(true);
            // Set morph target manager after all vertices data has been processed
            if (morphTargetManager !== undefined && morphTargetManager.numTargets > 0) {
                babylonMesh.morphTargetManager = morphTargetManager;
            }
            // Apply submeshes
            babylonMesh.subMeshes = [];
            for (var primitiveIndex = 0; primitiveIndex < mesh.primitives.length; primitiveIndex++) {
                if (mesh.primitives[primitiveIndex].mode !== GLTF2.EMeshPrimitiveMode.TRIANGLES) {
                    //continue;
                }
                var subMesh = new BABYLON.SubMesh(primitiveIndex, verticesStarts[primitiveIndex], verticesCounts[primitiveIndex], indexStarts[primitiveIndex], indexCounts[primitiveIndex], babylonMesh, babylonMesh, true);
            }
            // Finish
            return babylonMesh;
        };
        /**
        * Configures node transformation
        */
        var configureNode = function (babylonNode, node) {
            var position = BABYLON.Vector3.Zero();
            var rotation = BABYLON.Quaternion.Identity();
            var scaling = new BABYLON.Vector3(1, 1, 1);
            if (node.matrix) {
                var mat = BABYLON.Matrix.FromArray(node.matrix);
                mat.decompose(scaling, rotation, position);
            }
            else {
                if (node.translation) {
                    position = BABYLON.Vector3.FromArray(node.translation);
                }
                if (node.rotation) {
                    rotation = BABYLON.Quaternion.FromArray(node.rotation);
                }
                if (node.scale) {
                    scaling = BABYLON.Vector3.FromArray(node.scale);
                }
            }
            babylonNode.position = position;
            babylonNode.rotationQuaternion = rotation;
            if (babylonNode instanceof BABYLON.Mesh) {
                var mesh = babylonNode;
                mesh.scaling = scaling;
            }
        };
        /**
        * Imports a node
        */
        var importNode = function (runtime, node) {
            var babylonNode = null;
            if (runtime.importOnlyMeshes && (node.skin !== undefined || node.mesh !== undefined)) {
                if (runtime.importMeshesNames.length > 0 && runtime.importMeshesNames.indexOf(node.name) === -1) {
                    return null;
                }
            }
            // Meshes
            if (node.skin !== undefined) {
                if (node.mesh !== undefined) {
                    var skin = runtime.gltf.skins[node.skin];
                    var newMesh = importMesh(runtime, node, runtime.gltf.meshes[node.mesh]);
                    var newSkeleton = importSkeleton(runtime, node, skin);
                    if (newSkeleton) {
                        newMesh.skeleton = newSkeleton;
                        skin.babylonSkeleton = newSkeleton;
                    }
                    babylonNode = newMesh;
                }
            }
            else if (node.mesh !== undefined) {
                babylonNode = importMesh(runtime, node, runtime.gltf.meshes[node.mesh]);
            }
            else if (node.camera !== undefined && !node.babylonNode && !runtime.importOnlyMeshes) {
                var camera = runtime.gltf.cameras[node.camera];
                if (camera !== undefined) {
                    if (camera.type === "orthographic") {
                        var orthographicCamera = camera.orthographic;
                        var orthoCamera = new BABYLON.FreeCamera(node.name || "camera" + node.camera, BABYLON.Vector3.Zero(), runtime.babylonScene);
                        orthoCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
                        orthoCamera.attachControl(runtime.babylonScene.getEngine().getRenderingCanvas());
                        babylonNode = orthoCamera;
                    }
                    else if (camera.type === "perspective") {
                        var perspectiveCamera = camera.perspective;
                        var persCamera = new BABYLON.FreeCamera(node.name || "camera" + node.camera, BABYLON.Vector3.Zero(), runtime.babylonScene);
                        persCamera.attachControl(runtime.babylonScene.getEngine().getRenderingCanvas());
                        if (!perspectiveCamera.aspectRatio) {
                            perspectiveCamera.aspectRatio = runtime.babylonScene.getEngine().getRenderWidth() / runtime.babylonScene.getEngine().getRenderHeight();
                        }
                        if (perspectiveCamera.znear && perspectiveCamera.zfar) {
                            persCamera.maxZ = perspectiveCamera.zfar;
                            persCamera.minZ = perspectiveCamera.znear;
                        }
                        babylonNode = persCamera;
                    }
                }
            }
            // Empty node
            if (node.babylonNode) {
                return node.babylonNode;
            }
            else if (babylonNode === null) {
                var dummy = new BABYLON.Mesh(node.name || "mesh" + node.mesh, runtime.babylonScene);
                node.babylonNode = dummy;
                babylonNode = dummy;
            }
            if (babylonNode !== null) {
                configureNode(babylonNode, node);
                babylonNode.updateCache(true);
                node.babylonNode = babylonNode;
            }
            return babylonNode;
        };
        /**
        * Traverses nodes and creates them
        */
        var traverseNodes = function (runtime, index, parent, meshIncluded) {
            var node = runtime.gltf.nodes[index];
            var newNode = null;
            if (runtime.importOnlyMeshes && !meshIncluded) {
                if (runtime.importMeshesNames.indexOf(node.name) !== -1 || runtime.importMeshesNames.length === 0) {
                    meshIncluded = true;
                }
                else {
                    meshIncluded = false;
                }
            }
            else {
                meshIncluded = true;
            }
            if (meshIncluded) {
                newNode = importNode(runtime, node);
                if (newNode !== null) {
                    newNode.id = createStringId(index);
                    newNode.parent = parent;
                }
            }
            if (node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    traverseNodes(runtime, node.children[i], newNode, meshIncluded);
                }
            }
        };
        var importScene = function (runtime) {
            var scene = runtime.gltf.scene || 0;
            var scenes = runtime.gltf.scenes;
            if (scenes) {
                var nodes = scenes[scene].nodes;
                for (var i = 0; i < nodes.length; i++) {
                    traverseNodes(runtime, nodes[i], null);
                }
            }
            else {
                for (var i = 0; i < runtime.gltf.nodes.length; i++) {
                    traverseNodes(runtime, i, null);
                }
            }
        };
        /**
        * do stuff after buffers are loaded (e.g. hook up materials, load animations, etc.)
        */
        var postLoad = function (runtime) {
            importScene(runtime);
            // Set animations
            loadAnimations(runtime);
            for (var i = 0; i < runtime.babylonScene.skeletons.length; i++) {
                var skeleton = runtime.babylonScene.skeletons[i];
                runtime.babylonScene.beginAnimation(skeleton, 0, Number.MAX_VALUE, true, 1.0);
            }
            // Revoke object urls created during load
            if (runtime.gltf.textures) {
                for (var i = 0; i < runtime.gltf.textures.length; i++) {
                    var texture = runtime.gltf.textures[i];
                    if (texture.blobURL) {
                        URL.revokeObjectURL(texture.blobURL);
                    }
                }
            }
        };
        var BinaryReader = (function () {
            function BinaryReader(arrayBuffer) {
                this._arrayBuffer = arrayBuffer;
                this._dataView = new DataView(arrayBuffer);
                this._byteOffset = 0;
            }
            BinaryReader.prototype.getPosition = function () {
                return this._byteOffset;
            };
            BinaryReader.prototype.getLength = function () {
                return this._arrayBuffer.byteLength;
            };
            BinaryReader.prototype.readUint32 = function () {
                var value = this._dataView.getUint32(this._byteOffset, true);
                this._byteOffset += 4;
                return value;
            };
            BinaryReader.prototype.readUint8Array = function (length) {
                var value = new Uint8Array(this._arrayBuffer, this._byteOffset, length);
                this._byteOffset += length;
                return value;
            };
            BinaryReader.prototype.skipBytes = function (length) {
                this._byteOffset += length;
            };
            return BinaryReader;
        }());
        /**
        * glTF File Loader Plugin
        */
        var GLTFLoader = (function () {
            function GLTFLoader() {
            }
            GLTFLoader.RegisterExtension = function (extension) {
                if (GLTFLoader.Extensions[extension.name]) {
                    BABYLON.Tools.Error("Tool with the same name \"" + extension.name + "\" already exists");
                    return;
                }
                GLTFLoader.Extensions[extension.name] = extension;
            };
            GLTFLoader.LoadMaterial = function (runtime, index) {
                var material = runtime.gltf.materials[index];
                if (!material)
                    return null;
                material.babylonMaterial = new BABYLON.PBRMaterial(material.name || "mat" + index, runtime.babylonScene);
                material.babylonMaterial.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                material.babylonMaterial.useScalarInLinearSpace = true;
                return material;
            };
            GLTFLoader.LoadMetallicRoughnessMaterialPropertiesAsync = function (runtime, material, onSuccess, onError) {
                // Ensure metallic workflow
                material.babylonMaterial.metallic = 1;
                material.babylonMaterial.roughness = 1;
                var properties = material.pbrMetallicRoughness;
                if (!properties) {
                    onSuccess();
                    return;
                }
                //
                // Load Factors
                //
                material.babylonMaterial.albedoColor = properties.baseColorFactor ? BABYLON.Color3.FromArray(properties.baseColorFactor) : new BABYLON.Color3(1, 1, 1);
                material.babylonMaterial.metallic = properties.metallicFactor || 1;
                material.babylonMaterial.roughness = properties.roughnessFactor || 1;
                //
                // Load Textures
                //
                if (!properties.baseColorTexture && !properties.metallicRoughnessTexture) {
                    onSuccess();
                    return;
                }
                var checkSuccess = function () {
                    if ((!properties.baseColorTexture || material.babylonMaterial.albedoTexture) &&
                        (!properties.metallicRoughnessTexture || material.babylonMaterial.metallicTexture)) {
                        onSuccess();
                    }
                };
                if (properties.baseColorTexture) {
                    GLTFLoader.LoadTextureAsync(runtime, properties.baseColorTexture, function (texture) {
                        material.babylonMaterial.albedoTexture = texture;
                        GLTFLoader.LoadAlphaProperties(runtime, material);
                        checkSuccess();
                    }, function () {
                        BABYLON.Tools.Error("Failed to load base color texture");
                        onError();
                    });
                }
                if (properties.metallicRoughnessTexture) {
                    GLTFLoader.LoadTextureAsync(runtime, properties.metallicRoughnessTexture, function (texture) {
                        material.babylonMaterial.metallicTexture = texture;
                        material.babylonMaterial.useMetallnessFromMetallicTextureBlue = true;
                        material.babylonMaterial.useRoughnessFromMetallicTextureGreen = true;
                        material.babylonMaterial.useRoughnessFromMetallicTextureAlpha = false;
                        checkSuccess();
                    }, function () {
                        BABYLON.Tools.Error("Failed to load metallic roughness texture");
                        onError();
                    });
                }
            };
            GLTFLoader.LoadCommonMaterialPropertiesAsync = function (runtime, material, onSuccess, onError) {
                //
                // Load Factors
                //
                material.babylonMaterial.useEmissiveAsIllumination = (material.emissiveFactor || material.emissiveTexture) ? true : false;
                material.babylonMaterial.emissiveColor = material.emissiveFactor ? BABYLON.Color3.FromArray(material.emissiveFactor) : new BABYLON.Color3(0, 0, 0);
                if (material.doubleSided) {
                    material.babylonMaterial.backFaceCulling = false;
                    material.babylonMaterial.twoSidedLighting = true;
                }
                //
                // Load Textures
                //
                if (!material.normalTexture && !material.occlusionTexture && !material.emissiveTexture) {
                    onSuccess();
                    return;
                }
                var checkSuccess = function () {
                    if ((!material.normalTexture || material.babylonMaterial.bumpTexture) &&
                        (!material.occlusionTexture || material.babylonMaterial.ambientTexture) &&
                        (!material.emissiveTexture || material.babylonMaterial.emissiveTexture)) {
                        onSuccess();
                    }
                };
                if (material.normalTexture) {
                    GLTFLoader.LoadTextureAsync(runtime, material.normalTexture, function (babylonTexture) {
                        material.babylonMaterial.bumpTexture = babylonTexture;
                        if (material.normalTexture.scale !== undefined) {
                            material.babylonMaterial.bumpTexture.level = material.normalTexture.scale;
                        }
                        checkSuccess();
                    }, function () {
                        BABYLON.Tools.Error("Failed to load normal texture");
                        onError();
                    });
                }
                if (material.occlusionTexture) {
                    GLTFLoader.LoadTextureAsync(runtime, material.occlusionTexture, function (babylonTexture) {
                        material.babylonMaterial.ambientTexture = babylonTexture;
                        material.babylonMaterial.useAmbientInGrayScale = true;
                        if (material.occlusionTexture.strength !== undefined) {
                            material.babylonMaterial.ambientTextureStrength = material.occlusionTexture.strength;
                        }
                        checkSuccess();
                    }, function () {
                        BABYLON.Tools.Error("Failed to load occlusion texture");
                        onError();
                    });
                }
                if (material.emissiveTexture) {
                    GLTFLoader.LoadTextureAsync(runtime, material.emissiveTexture, function (babylonTexture) {
                        material.babylonMaterial.emissiveTexture = babylonTexture;
                        checkSuccess();
                    }, function () {
                        BABYLON.Tools.Error("Failed to load emissive texture");
                        onError();
                    });
                }
            };
            GLTFLoader.LoadAlphaProperties = function (runtime, material) {
                var alphaMode = material.alphaMode || "OPAQUE";
                switch (alphaMode) {
                    case "OPAQUE":
                        // default is opaque
                        break;
                    case "MASK":
                        material.babylonMaterial.albedoTexture.hasAlpha = true;
                        material.babylonMaterial.useAlphaFromAlbedoTexture = false;
                        material.babylonMaterial.alphaMode = BABYLON.Engine.ALPHA_DISABLE;
                        break;
                    case "BLEND":
                        material.babylonMaterial.albedoTexture.hasAlpha = true;
                        material.babylonMaterial.useAlphaFromAlbedoTexture = true;
                        material.babylonMaterial.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
                        break;
                    default:
                        BABYLON.Tools.Error("Invalid alpha mode '" + material.alphaMode + "'");
                }
            };
            GLTFLoader.LoadTextureAsync = function (runtime, textureInfo, onSuccess, onError) {
                var texture = runtime.gltf.textures[textureInfo.index];
                var texCoord = textureInfo.texCoord || 0;
                if (!texture || texture.source === undefined) {
                    onError();
                    return;
                }
                if (texture.babylonTextures) {
                    var babylonTexture = texture.babylonTextures[texCoord];
                    if (!babylonTexture) {
                        for (var i = 0; i < texture.babylonTextures.length; i++) {
                            babylonTexture = texture.babylonTextures[i];
                            if (babylonTexture) {
                                babylonTexture = babylonTexture.clone();
                                babylonTexture.coordinatesIndex = texCoord;
                                break;
                            }
                        }
                    }
                    onSuccess(babylonTexture);
                    return;
                }
                var source = runtime.gltf.images[texture.source];
                var sourceURL = runtime.rootUrl + source.uri;
                if (texture.blobURL) {
                    sourceURL = texture.blobURL;
                }
                else {
                    if (source.uri === undefined) {
                        var bufferView = runtime.gltf.bufferViews[source.bufferView];
                        var buffer = GLTF2.GLTFUtils.GetBufferFromBufferView(runtime, bufferView, 0, bufferView.byteLength, GLTF2.EComponentType.UNSIGNED_BYTE);
                        texture.blobURL = URL.createObjectURL(new Blob([buffer], { type: source.mimeType }));
                        sourceURL = texture.blobURL;
                    }
                    else if (GLTF2.GLTFUtils.IsBase64(source.uri)) {
                        var decodedBuffer = new Uint8Array(GLTF2.GLTFUtils.DecodeBase64(source.uri));
                        texture.blobURL = URL.createObjectURL(new Blob([decodedBuffer], { type: source.mimeType }));
                        sourceURL = texture.blobURL;
                    }
                }
                GLTFLoader._createTextureAsync(runtime, texture, texCoord, sourceURL, onSuccess, onError);
            };
            GLTFLoader._createTextureAsync = function (runtime, texture, texCoord, url, onSuccess, onError) {
                var sampler = (texture.sampler === undefined ? {} : runtime.gltf.samplers[texture.sampler]);
                var noMipMaps = (sampler.minFilter === GLTF2.ETextureMinFilter.NEAREST || sampler.minFilter === GLTF2.ETextureMinFilter.LINEAR);
                var samplingMode = GLTF2.GLTFUtils.GetTextureFilterMode(sampler.minFilter);
                var babylonTexture = new BABYLON.Texture(url, runtime.babylonScene, noMipMaps, true, samplingMode, function () {
                    onSuccess(babylonTexture);
                }, onError);
                babylonTexture.coordinatesIndex = texCoord;
                babylonTexture.wrapU = GLTF2.GLTFUtils.GetWrapMode(sampler.wrapS);
                babylonTexture.wrapV = GLTF2.GLTFUtils.GetWrapMode(sampler.wrapT);
                babylonTexture.name = texture.name;
                // Cache the texture
                texture.babylonTextures = texture.babylonTextures || [];
                texture.babylonTextures[texCoord] = babylonTexture;
            };
            /**
            * Import meshes
            */
            GLTFLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onSuccess, onError) {
                // scene.useRightHandedSystem = true;
                var runtime = GLTFLoader._createRuntime(scene, data, rootUrl, true);
                if (!runtime) {
                    onError();
                    return;
                }
                if (meshesNames === "") {
                    runtime.importMeshesNames = [];
                }
                else if (typeof meshesNames === "string") {
                    runtime.importMeshesNames = [meshesNames];
                }
                else if (meshesNames && !(meshesNames instanceof Array)) {
                    runtime.importMeshesNames = [meshesNames];
                }
                else {
                    runtime.importMeshesNames = [];
                    BABYLON.Tools.Warn("Argument meshesNames must be of type string or string[]");
                }
                // Load scene
                importScene(runtime);
                var meshes = [];
                var skeletons = [];
                // Fill arrays of meshes and skeletons
                for (var i = 0; i < runtime.gltf.nodes.length; i++) {
                    var node = runtime.gltf.nodes[i];
                    if (node.babylonNode instanceof BABYLON.AbstractMesh) {
                        meshes.push(node.babylonNode);
                    }
                }
                for (var i = 0; i < runtime.gltf.skins.length; i++) {
                    var skin = runtime.gltf.skins[i];
                    if (skin.babylonSkeleton instanceof BABYLON.Skeleton) {
                        skeletons.push(skin.babylonSkeleton);
                    }
                }
                // Load buffers, materials, etc.
                GLTFLoader._loadBuffersAsync(runtime, function () {
                    GLTFLoader._loadMaterialsAsync(runtime, function () {
                        postLoad(runtime);
                        onSuccess(meshes, null, skeletons);
                    }, onError);
                }, onError);
                if (BABYLON.GLTFFileLoader.IncrementalLoading && onSuccess) {
                    onSuccess(meshes, null, skeletons);
                }
            };
            /**
            * Load scene
            */
            GLTFLoader.prototype.loadAsync = function (scene, data, rootUrl, onSuccess, onError) {
                // scene.useRightHandedSystem = true;
                var runtime = GLTFLoader._createRuntime(scene, data, rootUrl, false);
                if (!runtime) {
                    onError();
                    return;
                }
                importScene(runtime);
                GLTFLoader._loadBuffersAsync(runtime, function () {
                    GLTFLoader._loadMaterialsAsync(runtime, function () {
                        postLoad(runtime);
                        onSuccess();
                    }, onError);
                }, onError);
            };
            GLTFLoader._loadBuffersAsync = function (runtime, onSuccess, onError) {
                var _this = this;
                if (runtime.gltf.buffers.length == 0) {
                    onSuccess();
                    return;
                }
                var successCount = 0;
                runtime.gltf.buffers.forEach(function (buffer, index) {
                    _this._loadBufferAsync(runtime, index, function () {
                        if (++successCount === runtime.gltf.buffers.length) {
                            onSuccess();
                        }
                    }, onError);
                });
            };
            GLTFLoader._loadBufferAsync = function (runtime, index, onSuccess, onError) {
                var buffer = runtime.gltf.buffers[index];
                if (buffer.uri === undefined) {
                    // buffer.loadedBufferView should already be set
                    onSuccess();
                }
                else if (GLTF2.GLTFUtils.IsBase64(buffer.uri)) {
                    var data = GLTF2.GLTFUtils.DecodeBase64(buffer.uri);
                    setTimeout(function () {
                        buffer.loadedBufferView = new Uint8Array(data);
                        onSuccess();
                    });
                }
                else {
                    BABYLON.Tools.LoadFile(runtime.rootUrl + buffer.uri, function (data) {
                        buffer.loadedBufferView = new Uint8Array(data);
                        onSuccess();
                    }, null, null, true, onError);
                }
            };
            GLTFLoader._loadMaterialsAsync = function (runtime, onSuccess, onError) {
                var materials = runtime.gltf.materials;
                if (!materials) {
                    onSuccess();
                    return;
                }
                var successCount = 0;
                for (var i = 0; i < materials.length; i++) {
                    GLTF2.GLTFLoaderExtension.LoadMaterialAsync(runtime, i, function () {
                        if (++successCount === materials.length) {
                            onSuccess();
                        }
                    }, onError);
                }
            };
            GLTFLoader._createRuntime = function (scene, data, rootUrl, importOnlyMeshes) {
                var runtime = {
                    gltf: data.json,
                    babylonScene: scene,
                    rootUrl: rootUrl,
                    importOnlyMeshes: importOnlyMeshes,
                };
                var binaryBuffer;
                var buffers = runtime.gltf.buffers;
                if (buffers.length > 0 && buffers[0].uri === undefined) {
                    binaryBuffer = buffers[0];
                }
                if (data.bin) {
                    if (!binaryBuffer) {
                        BABYLON.Tools.Error("Unexpected BIN chunk");
                        return null;
                    }
                    if (binaryBuffer.byteLength != data.bin.byteLength) {
                        BABYLON.Tools.Error("Binary buffer length from JSON does not match chunk length");
                        return null;
                    }
                    binaryBuffer.loadedBufferView = data.bin;
                }
                GLTF2.GLTFLoaderExtension.PostCreateRuntime(runtime);
                return runtime;
            };
            return GLTFLoader;
        }());
        GLTFLoader.Extensions = {};
        GLTF2.GLTFLoader = GLTFLoader;
        BABYLON.GLTFFileLoader.GLTFLoaderV2 = new GLTFLoader();
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoader.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
        * Utils functions for GLTF
        */
        var GLTFUtils = (function () {
            function GLTFUtils() {
            }
            /**
            * If the uri is a base64 string
            * @param uri: the uri to test
            */
            GLTFUtils.IsBase64 = function (uri) {
                return uri.length < 5 ? false : uri.substr(0, 5) === "data:";
            };
            /**
            * Decode the base64 uri
            * @param uri: the uri to decode
            */
            GLTFUtils.DecodeBase64 = function (uri) {
                var decodedString = atob(uri.split(",")[1]);
                var bufferLength = decodedString.length;
                var bufferView = new Uint8Array(new ArrayBuffer(bufferLength));
                for (var i = 0; i < bufferLength; i++) {
                    bufferView[i] = decodedString.charCodeAt(i);
                }
                return bufferView.buffer;
            };
            /**
            * Returns the wrap mode of the texture
            * @param mode: the mode value
            */
            GLTFUtils.GetWrapMode = function (mode) {
                switch (mode) {
                    case GLTF2.ETextureWrapMode.CLAMP_TO_EDGE: return BABYLON.Texture.CLAMP_ADDRESSMODE;
                    case GLTF2.ETextureWrapMode.MIRRORED_REPEAT: return BABYLON.Texture.MIRROR_ADDRESSMODE;
                    case GLTF2.ETextureWrapMode.REPEAT: return BABYLON.Texture.WRAP_ADDRESSMODE;
                    default: return BABYLON.Texture.WRAP_ADDRESSMODE;
                }
            };
            /**
             * Returns the byte stride giving an accessor
             * @param accessor: the GLTF accessor objet
             */
            GLTFUtils.GetByteStrideFromType = function (accessor) {
                // Needs this function since "byteStride" isn't requiered in glTF format
                var type = accessor.type;
                switch (type) {
                    case "VEC2": return 2;
                    case "VEC3": return 3;
                    case "VEC4": return 4;
                    case "MAT2": return 4;
                    case "MAT3": return 9;
                    case "MAT4": return 16;
                    default: return 1;
                }
            };
            /**
             * Returns the texture filter mode giving a mode value
             * @param mode: the filter mode value
             */
            GLTFUtils.GetTextureFilterMode = function (mode) {
                switch (mode) {
                    case GLTF2.ETextureMinFilter.LINEAR:
                    case GLTF2.ETextureMinFilter.LINEAR_MIPMAP_NEAREST:
                    case GLTF2.ETextureMinFilter.LINEAR_MIPMAP_LINEAR: return BABYLON.Texture.TRILINEAR_SAMPLINGMODE;
                    case GLTF2.ETextureMinFilter.NEAREST:
                    case GLTF2.ETextureMinFilter.NEAREST_MIPMAP_NEAREST: return BABYLON.Texture.NEAREST_SAMPLINGMODE;
                    default: return BABYLON.Texture.BILINEAR_SAMPLINGMODE;
                }
            };
            GLTFUtils.GetBufferFromBufferView = function (runtime, bufferView, byteOffset, byteLength, componentType) {
                byteOffset += (bufferView.byteOffset || 0);
                var loadedBufferView = runtime.gltf.buffers[bufferView.buffer].loadedBufferView;
                if (byteOffset + byteLength > loadedBufferView.byteLength) {
                    throw new Error("Buffer access is out of range");
                }
                var buffer = loadedBufferView.buffer;
                byteOffset += loadedBufferView.byteOffset;
                switch (componentType) {
                    case GLTF2.EComponentType.BYTE: return new Int8Array(buffer, byteOffset, byteLength);
                    case GLTF2.EComponentType.UNSIGNED_BYTE: return new Uint8Array(buffer, byteOffset, byteLength);
                    case GLTF2.EComponentType.SHORT: return new Int16Array(buffer, byteOffset, byteLength);
                    case GLTF2.EComponentType.UNSIGNED_SHORT: return new Uint16Array(buffer, byteOffset, byteLength);
                    case GLTF2.EComponentType.UNSIGNED_INT: return new Uint32Array(buffer, byteOffset, byteLength);
                    default: return new Float32Array(buffer, byteOffset, byteLength);
                }
            };
            /**
             * Returns a buffer from its accessor
             * @param runtime: the GLTF runtime
             * @param accessor: the GLTF accessor
             */
            GLTFUtils.GetBufferFromAccessor = function (runtime, accessor) {
                var bufferView = runtime.gltf.bufferViews[accessor.bufferView];
                var byteOffset = accessor.byteOffset || 0;
                var byteLength = accessor.count * GLTFUtils.GetByteStrideFromType(accessor);
                return GLTFUtils.GetBufferFromBufferView(runtime, bufferView, byteOffset, byteLength, accessor.componentType);
            };
            /**
             * Decodes a buffer view into a string
             * @param view: the buffer view
             */
            GLTFUtils.DecodeBufferToText = function (view) {
                var result = "";
                var length = view.byteLength;
                for (var i = 0; i < length; ++i) {
                    result += String.fromCharCode(view[i]);
                }
                return result;
            };
            /**
             * Returns the default material of gltf.
             * @param scene: the Babylon.js scene
             */
            GLTFUtils.GetDefaultMaterial = function (runtime) {
                if (!runtime.defaultMaterial) {
                    var material = new BABYLON.PBRMaterial("gltf_default", runtime.babylonScene);
                    material.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                    material.metallic = 1;
                    material.roughness = 1;
                    runtime.defaultMaterial = material;
                }
                return runtime.defaultMaterial;
            };
            return GLTFUtils;
        }());
        GLTF2.GLTFUtils = GLTFUtils;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderUtils.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var GLTFLoaderExtension = (function () {
            function GLTFLoaderExtension(name) {
                this._name = name;
            }
            Object.defineProperty(GLTFLoaderExtension.prototype, "name", {
                get: function () {
                    return this._name;
                },
                enumerable: true,
                configurable: true
            });
            GLTFLoaderExtension.prototype.postCreateRuntime = function (runtime) { };
            // Return true to stop other extensions from loading materials.
            GLTFLoaderExtension.prototype.loadMaterialAsync = function (runtime, index, onSuccess, onError) { return false; };
            // ---------
            // Utilities
            // ---------
            GLTFLoaderExtension.PostCreateRuntime = function (runtime) {
                for (var extensionName in GLTF2.GLTFLoader.Extensions) {
                    var extension = GLTF2.GLTFLoader.Extensions[extensionName];
                    extension.postCreateRuntime(runtime);
                }
            };
            GLTFLoaderExtension.LoadMaterialAsync = function (runtime, index, onSuccess, onError) {
                for (var extensionName in GLTF2.GLTFLoader.Extensions) {
                    var extension = GLTF2.GLTFLoader.Extensions[extensionName];
                    if (extension.loadMaterialAsync(runtime, index, onSuccess, onError)) {
                        return;
                    }
                }
                var material = GLTF2.GLTFLoader.LoadMaterial(runtime, index);
                if (!material) {
                    onSuccess();
                    return;
                }
                var metallicRoughnessPropertiesSuccess = false;
                var commonPropertiesSuccess = false;
                var checkSuccess = function () {
                    if (metallicRoughnessPropertiesSuccess && commonPropertiesSuccess) {
                        onSuccess();
                    }
                };
                GLTF2.GLTFLoader.LoadMetallicRoughnessMaterialPropertiesAsync(runtime, material, function () {
                    metallicRoughnessPropertiesSuccess = true;
                    checkSuccess();
                }, onError);
                GLTF2.GLTFLoader.LoadCommonMaterialPropertiesAsync(runtime, material, function () {
                    commonPropertiesSuccess = true;
                    checkSuccess();
                }, onError);
            };
            return GLTFLoaderExtension;
        }());
        GLTF2.GLTFLoaderExtension = GLTFLoaderExtension;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderExtension.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var GLTFMaterialsPbrSpecularGlossinessExtension = (function (_super) {
            __extends(GLTFMaterialsPbrSpecularGlossinessExtension, _super);
            function GLTFMaterialsPbrSpecularGlossinessExtension() {
                return _super.call(this, "KHR_materials_pbrSpecularGlossiness") || this;
            }
            GLTFMaterialsPbrSpecularGlossinessExtension.prototype.loadMaterialAsync = function (runtime, index, onSuccess, onError) {
                var material = GLTF2.GLTFLoader.LoadMaterial(runtime, index);
                if (!material || !material.extensions)
                    return false;
                var properties = material.extensions[this.name];
                if (!properties)
                    return false;
                //
                // Load Factors
                //
                material.babylonMaterial.albedoColor = properties.diffuseFactor ? BABYLON.Color3.FromArray(properties.diffuseFactor) : new BABYLON.Color3(1, 1, 1);
                material.babylonMaterial.reflectivityColor = properties.specularFactor ? BABYLON.Color3.FromArray(properties.specularFactor) : new BABYLON.Color3(1, 1, 1);
                material.babylonMaterial.microSurface = properties.glossinessFactor === undefined ? 1 : properties.glossinessFactor;
                //
                // Load Textures
                //
                var commonMaterialPropertiesSuccess = false;
                var checkSuccess = function () {
                    if ((!properties.diffuseTexture || material.babylonMaterial.albedoTexture) &&
                        (!properties.specularGlossinessTexture || material.babylonMaterial.reflectivityTexture) &&
                        commonMaterialPropertiesSuccess) {
                        onSuccess();
                    }
                };
                if (properties.diffuseTexture) {
                    GLTF2.GLTFLoader.LoadTextureAsync(runtime, properties.diffuseTexture, function (texture) {
                        material.babylonMaterial.albedoTexture = texture;
                        GLTF2.GLTFLoader.LoadAlphaProperties(runtime, material);
                        checkSuccess();
                    }, function () {
                        BABYLON.Tools.Warn("Failed to load diffuse texture");
                        onError();
                    });
                }
                if (properties.specularGlossinessTexture) {
                    GLTF2.GLTFLoader.LoadTextureAsync(runtime, properties.specularGlossinessTexture, function (texture) {
                        material.babylonMaterial.reflectivityTexture = texture;
                        material.babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
                        checkSuccess();
                    }, function () {
                        BABYLON.Tools.Warn("Failed to load metallic roughness texture");
                        onError();
                    });
                }
                GLTF2.GLTFLoader.LoadCommonMaterialPropertiesAsync(runtime, material, function () {
                    commonMaterialPropertiesSuccess = true;
                    checkSuccess();
                }, onError);
                return true;
            };
            return GLTFMaterialsPbrSpecularGlossinessExtension;
        }(GLTF2.GLTFLoaderExtension));
        GLTF2.GLTFMaterialsPbrSpecularGlossinessExtension = GLTFMaterialsPbrSpecularGlossinessExtension;
        GLTF2.GLTFLoader.RegisterExtension(new GLTFMaterialsPbrSpecularGlossinessExtension());
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFMaterialsPbrSpecularGlossinessExtension.js.map

module.exports = BABYLON;
