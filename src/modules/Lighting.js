
const Lighting = (function() {
    'use strict';

    var lightAmbient, lightDiffuse, lightSpecular, lightPosition;
    var lightAmbientULoc, lightDiffuseULoc, lightSpecularULoc, lightPositionULoc;

    function init(config) {
        lightAmbient = config.ambient || vec3.fromValues(1, 1, 1);
        lightDiffuse = config.diffuse || vec3.fromValues(1, 1, 1);
        lightSpecular = config.specular || vec3.fromValues(1, 1, 1);
        lightPosition = config.position || vec3.fromValues(-0.5, 1.5, -0.5);
    }

    function setupUniforms(shaderProgram, gl) {
        lightAmbientULoc = gl.getUniformLocation(shaderProgram, "uLightAmbient");
        lightDiffuseULoc = gl.getUniformLocation(shaderProgram, "uLightDiffuse");
        lightSpecularULoc = gl.getUniformLocation(shaderProgram, "uLightSpecular");
        lightPositionULoc = gl.getUniformLocation(shaderProgram, "uLightPosition");

        gl.uniform3fv(lightAmbientULoc, lightAmbient);
        gl.uniform3fv(lightDiffuseULoc, lightDiffuse);
        gl.uniform3fv(lightSpecularULoc, lightSpecular);
        gl.uniform3fv(lightPositionULoc, lightPosition);
    }


    function updateUniforms(gl) {
        if (lightAmbientULoc) gl.uniform3fv(lightAmbientULoc, lightAmbient);
        if (lightDiffuseULoc) gl.uniform3fv(lightDiffuseULoc, lightDiffuse);
        if (lightSpecularULoc) gl.uniform3fv(lightSpecularULoc, lightSpecular);
        if (lightPositionULoc) gl.uniform3fv(lightPositionULoc, lightPosition);
    }


    function setAmbient(color) {
        lightAmbient = color;
    }


    function setDiffuse(color) {
        lightDiffuse = color;
    }


    function setSpecular(color) {
        lightSpecular = color;
    }

    function setPosition(position) {
        lightPosition = position;
    }


    function getAmbient() {
        return lightAmbient;
    }

    function getDiffuse() {
        return lightDiffuse;
    }

    function getSpecular() {
        return lightSpecular;
    }

    function getPosition() {
        return lightPosition;
    }

    return {
        init: init,
        setupUniforms: setupUniforms,
        updateUniforms: updateUniforms,
        setAmbient: setAmbient,
        setDiffuse: setDiffuse,
        setSpecular: setSpecular,
        setPosition: setPosition,
        getAmbient: getAmbient,
        getDiffuse: getDiffuse,
        getSpecular: getSpecular,
        getPosition: getPosition
    };
})();

