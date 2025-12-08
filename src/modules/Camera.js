const Camera = (function() {
    'use strict';

    var Eye, Center, Up;
    var defaultEye, defaultCenter, defaultUp;
    var viewDelta;

    function init(config) {
        defaultEye = config.eye || vec3.fromValues(0.5, 0.5, -0.5);
        defaultCenter = config.center || vec3.fromValues(0.5, 0.5, 0.5);
        defaultUp = config.up || vec3.fromValues(0, 1, 0);
        viewDelta = config.viewDelta || 0.01;

        Eye = vec3.clone(defaultEye);
        Center = vec3.clone(defaultCenter);
        Up = vec3.clone(defaultUp);
    }

    function reset() {
        Eye = vec3.copy(Eye, defaultEye);
        Center = vec3.copy(Center, defaultCenter);
        Up = vec3.copy(Up, defaultUp);
    }

    function moveLeft(rotateOnly) {
        var lookAt = vec3.create(), viewRight = vec3.create(), temp = vec3.create();
        lookAt = vec3.normalize(lookAt, vec3.subtract(temp, Center, Eye));
        viewRight = vec3.normalize(viewRight, vec3.cross(temp, lookAt, Up));
        
        Center = vec3.add(Center, Center, vec3.scale(temp, viewRight, viewDelta));
        if (!rotateOnly) {
            Eye = vec3.add(Eye, Eye, vec3.scale(temp, viewRight, viewDelta));
        }
    }

    function moveRight(rotateOnly) {
        var lookAt = vec3.create(), viewRight = vec3.create(), temp = vec3.create();
        lookAt = vec3.normalize(lookAt, vec3.subtract(temp, Center, Eye));
        viewRight = vec3.normalize(viewRight, vec3.cross(temp, lookAt, Up));
        
        Center = vec3.add(Center, Center, vec3.scale(temp, viewRight, -viewDelta));
        if (!rotateOnly) {
            Eye = vec3.add(Eye, Eye, vec3.scale(temp, viewRight, -viewDelta));
        }
    }

    function moveBackward(rotateOnly) {
        var lookAt = vec3.create(), viewRight = vec3.create(), temp = vec3.create();
        lookAt = vec3.normalize(lookAt, vec3.subtract(temp, Center, Eye));
        viewRight = vec3.normalize(viewRight, vec3.cross(temp, lookAt, Up));
        
        if (rotateOnly) {
            Center = vec3.add(Center, Center, vec3.scale(temp, Up, viewDelta));
            Up = vec3.cross(Up, viewRight, vec3.subtract(lookAt, Center, Eye));
        } else {
            Eye = vec3.add(Eye, Eye, vec3.scale(temp, lookAt, -viewDelta));
            Center = vec3.add(Center, Center, vec3.scale(temp, lookAt, -viewDelta));
        }
    }

    function moveForward(rotateOnly) {
        var lookAt = vec3.create(), viewRight = vec3.create(), temp = vec3.create();
        lookAt = vec3.normalize(lookAt, vec3.subtract(temp, Center, Eye));
        viewRight = vec3.normalize(viewRight, vec3.cross(temp, lookAt, Up));
        
        if (rotateOnly) {
            Center = vec3.add(Center, Center, vec3.scale(temp, Up, -viewDelta));
            Up = vec3.cross(Up, viewRight, vec3.subtract(lookAt, Center, Eye));
        } else {
            Eye = vec3.add(Eye, Eye, vec3.scale(temp, lookAt, viewDelta));
            Center = vec3.add(Center, Center, vec3.scale(temp, lookAt, viewDelta));
        }
    }

    function moveUp(rotateOnly) {
        var lookAt = vec3.create(), viewRight = vec3.create(), temp = vec3.create();
        lookAt = vec3.normalize(lookAt, vec3.subtract(temp, Center, Eye));
        viewRight = vec3.normalize(viewRight, vec3.cross(temp, lookAt, Up));
        
        if (rotateOnly) {
            Up = vec3.normalize(Up, vec3.add(Up, Up, vec3.scale(temp, viewRight, -viewDelta)));
        } else {
            Eye = vec3.add(Eye, Eye, vec3.scale(temp, Up, viewDelta));
            Center = vec3.add(Center, Center, vec3.scale(temp, Up, viewDelta));
        }
    }

    function moveDown(rotateOnly) {
        var lookAt = vec3.create(), viewRight = vec3.create(), temp = vec3.create();
        lookAt = vec3.normalize(lookAt, vec3.subtract(temp, Center, Eye));
        viewRight = vec3.normalize(viewRight, vec3.cross(temp, lookAt, Up));
        
        if (rotateOnly) {
            Up = vec3.normalize(Up, vec3.add(Up, Up, vec3.scale(temp, viewRight, viewDelta)));
        } else {
            Eye = vec3.add(Eye, Eye, vec3.scale(temp, Up, -viewDelta));
            Center = vec3.add(Center, Center, vec3.scale(temp, Up, -viewDelta));
        }
    }

    function setViewDelta(delta) {
        viewDelta = delta;
    }

    function getViewMatrix() {
        var vMatrix = mat4.create();
        mat4.lookAt(vMatrix, Eye, Center, Up);
        return vMatrix;
    }

    function getEye() {
        return Eye;
    }

    function getCenter() {
        return Center;
    }

    function getUp() {
        return Up;
    }

    function getViewDelta() {
        return viewDelta;
    }

    return {
        init: init,
        reset: reset,
        moveLeft: moveLeft,
        moveRight: moveRight,
        moveBackward: moveBackward,
        moveForward: moveForward,
        moveUp: moveUp,
        moveDown: moveDown,
        setViewDelta: setViewDelta,
        getViewDelta: getViewDelta,
        getViewMatrix: getViewMatrix,
        getEye: getEye,
        getCenter: getCenter,
        getUp: getUp
    };
})();

