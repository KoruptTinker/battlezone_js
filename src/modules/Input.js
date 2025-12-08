const Input = (function() {
    'use strict';

    var currentModel = null;
    var currentModelType = null;
    var currentModelIndex = -1;

    function init(config) {
        config = config || {};
        document.onkeydown = config.onKeyDown || handleKeyDown;
    }

    function highlightModel(modelType, whichModel, triangles, ellipsoids) {
        if (currentModel != null) {
            currentModel.on = false;
        }

        currentModelIndex = whichModel;
        if (modelType === "triangles") {
            if (whichModel >= 0 && whichModel < triangles.length) {
                currentModel = triangles[whichModel];
                currentModelType = "triangles";
            }
        } else if (modelType === "ellipsoid") {
            if (whichModel >= 0 && whichModel < ellipsoids.length) {
                currentModel = ellipsoids[whichModel];
                currentModelType = "ellipsoid";
            }
        }

        if (currentModel != null) {
            currentModel.on = true;
        }

        return currentModel;
    }

    function clearSelection() {
        if (currentModel != null) {
            currentModel.on = false;
        }
        currentModel = null;
        currentModelType = null;
        currentModelIndex = -1;
    }

    function translateModel(offset) {
        if (currentModel != null) {
            vec3.add(currentModel.translation, currentModel.translation, offset);
        }
    }

    function rotateModel(axis, direction, rotateTheta) {
        if (currentModel != null) {
            var newRotation = mat4.create();
            mat4.fromRotation(newRotation, direction * rotateTheta, axis);
            vec3.transformMat4(currentModel.xAxis, currentModel.xAxis, newRotation);
            vec3.transformMat4(currentModel.yAxis, currentModel.yAxis, newRotation);
        }
    }

    function getCurrentModel() {
        return currentModel;
    }

    function getCurrentModelType() {
        return currentModelType;
    }

    function getCurrentModelIndex() {
        return currentModelIndex;
    }

    function handleKeyDown(event) {
        // Default implementation - can be overridden
        console.log("Key pressed:", event.code);
    }

    return {
        init: init,
        highlightModel: highlightModel,
        clearSelection: clearSelection,
        translateModel: translateModel,
        rotateModel: rotateModel,
        getCurrentModel: getCurrentModel,
        getCurrentModelType: getCurrentModelType,
        getCurrentModelIndex: getCurrentModelIndex
    };
})();

