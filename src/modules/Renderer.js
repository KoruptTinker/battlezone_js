const Renderer = (function() {
    'use strict';

    var gl = null;
    var pMatrix = mat4.create();
    var mMatrix = mat4.create();
    var rotateTheta = Math.PI / 50;

    function init(glContext, config) {
        gl = glContext;
        config = config || {};
        
        var fov = config.fov || 0.5 * Math.PI;
        var aspect = config.aspect || 1;
        var near = config.near || 0.1;
        var far = config.far || 10;
        rotateTheta = config.rotateTheta || Math.PI / 50;

        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);

        mat4.perspective(pMatrix, fov, aspect, near, far);
    }

    function makeModelTransform(currModel) {
        var zAxis = vec3.create(), sumRotation = mat4.create(), temp = mat4.create(), negCtr = vec3.create();

        mat4.identity(mMatrix);

        mat4.fromTranslation(mMatrix, vec3.negate(negCtr, currModel.center));

        if (currModel.on) {
            mat4.multiply(mMatrix, mat4.fromScaling(temp, vec3.fromValues(1.2, 1.2, 1.2)), mMatrix);
        }

        vec3.normalize(zAxis, vec3.cross(zAxis, currModel.xAxis, currModel.yAxis));
        mat4.set(sumRotation,
            currModel.xAxis[0], currModel.yAxis[0], zAxis[0], 0,
            currModel.xAxis[1], currModel.yAxis[1], zAxis[1], 0,
            currModel.xAxis[2], currModel.yAxis[2], zAxis[2], 0,
            0, 0, 0, 1);
        mat4.multiply(mMatrix, sumRotation, mMatrix);

        mat4.multiply(mMatrix, mat4.fromTranslation(temp, currModel.center), mMatrix);

        mat4.multiply(mMatrix, mat4.fromTranslation(temp, currModel.translation), mMatrix);

        return mMatrix;
    }

    function render(config) {
        config = config || {};
        var onRender = config.onRender || function() {};

        window.requestAnimationFrame(function() { render(config); });

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        onRender(gl, pMatrix);
    }

    function renderTriangleSet(gl, triangleSet, whichSet, pvMatrix, attribLocs, uniformLocs, 
                               vertexBuffers, normalBuffers, triangleBuffers, triSetSizes) {
        var pvmMatrix = mat4.create();
        var mMatrix = makeModelTransform(triangleSet);
        mat4.multiply(pvmMatrix, pvMatrix, mMatrix);

        gl.uniformMatrix4fv(uniformLocs.modelMatrix, false, mMatrix);
        gl.uniformMatrix4fv(uniformLocs.pvmMatrix, false, pvmMatrix);

        gl.uniform3fv(uniformLocs.ambient, triangleSet.material.ambient);
        gl.uniform3fv(uniformLocs.diffuse, triangleSet.material.diffuse);
        gl.uniform3fv(uniformLocs.specular, triangleSet.material.specular);
        gl.uniform1f(uniformLocs.shininess, triangleSet.material.n);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[whichSet]);
        gl.vertexAttribPointer(attribLocs.position, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffers[whichSet]);
        gl.vertexAttribPointer(attribLocs.normal, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffers[whichSet]);
        gl.drawElements(gl.TRIANGLES, 3 * triSetSizes[whichSet], gl.UNSIGNED_SHORT, 0);
    }

    function renderEllipsoid(gl, ellipsoid, whichEllipsoid, numTriangleSets, pvMatrix, attribLocs, uniformLocs,
                             vertexBuffers, normalBuffers, triangleBuffers, triSetSizes) {
        var pvmMatrix = mat4.create();
        var mMatrix = makeModelTransform(ellipsoid);
        mat4.multiply(pvmMatrix, pvMatrix, mMatrix);

        gl.uniformMatrix4fv(uniformLocs.modelMatrix, false, mMatrix);
        gl.uniformMatrix4fv(uniformLocs.pvmMatrix, false, pvmMatrix);

        gl.uniform3fv(uniformLocs.ambient, ellipsoid.ambient);
        gl.uniform3fv(uniformLocs.diffuse, ellipsoid.diffuse);
        gl.uniform3fv(uniformLocs.specular, ellipsoid.specular);
        gl.uniform1f(uniformLocs.shininess, ellipsoid.n);

        var bufferIndex = numTriangleSets + whichEllipsoid;
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[bufferIndex]);
        gl.vertexAttribPointer(attribLocs.position, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffers[bufferIndex]);
        gl.vertexAttribPointer(attribLocs.normal, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffers[bufferIndex]);
        gl.drawElements(gl.TRIANGLES, triSetSizes[bufferIndex], gl.UNSIGNED_SHORT, 0);
    }


    function getRotateTheta() {
        return rotateTheta;
    }


    function getGL() {
        return gl;
    }

    return {
        init: init,
        render: render,
        renderTriangleSet: renderTriangleSet,
        renderEllipsoid: renderEllipsoid,
        makeModelTransform: makeModelTransform,
        getRotateTheta: getRotateTheta,
        getGL: getGL
    };
})();

