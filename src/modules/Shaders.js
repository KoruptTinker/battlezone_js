const Shaders = (function() {
    'use strict';

    var shaderProgram = null;
    var vPosAttribLoc, vNormAttribLoc;
    var mMatrixULoc, pvmMatrixULoc, eyePositionULoc;
    var ambientULoc, diffuseULoc, specularULoc, shininessULoc;

    var defaultVertexShader = `
        attribute vec3 aVertexPosition; // vertex position
        attribute vec3 aVertexNormal; // vertex normal
        
        uniform mat4 umMatrix; // the model matrix
        uniform mat4 upvmMatrix; // the project view model matrix
        
        varying vec3 vWorldPos; // interpolated world position of vertex
        varying vec3 vVertexNormal; // interpolated normal for frag shader

        void main(void) {
            // vertex position
            vec4 vWorldPos4 = umMatrix * vec4(aVertexPosition, 1.0);
            vWorldPos = vec3(vWorldPos4.x,vWorldPos4.y,vWorldPos4.z);
            gl_Position = upvmMatrix * vec4(aVertexPosition, 1.0);

            // vertex normal (assume no non-uniform scale)
            vec4 vWorldNormal4 = umMatrix * vec4(aVertexNormal, 0.0);
            vVertexNormal = normalize(vec3(vWorldNormal4.x,vWorldNormal4.y,vWorldNormal4.z)); 
        }
    `;

    var defaultFragmentShader = `
        precision mediump float; // set float to medium precision

        // eye location
        uniform vec3 uEyePosition; // the eye's position in world
        
        // light properties
        uniform vec3 uLightAmbient; // the light's ambient color
        uniform vec3 uLightDiffuse; // the light's diffuse color
        uniform vec3 uLightSpecular; // the light's specular color
        uniform vec3 uLightPosition; // the light's position
        
        // material properties
        uniform vec3 uAmbient; // the ambient reflectivity
        uniform vec3 uDiffuse; // the diffuse reflectivity
        uniform vec3 uSpecular; // the specular reflectivity
        uniform float uShininess; // the specular exponent
        
        // geometry properties
        varying vec3 vWorldPos; // world xyz of fragment
        varying vec3 vVertexNormal; // normal of fragment
            
        void main(void) {
            // ambient term
            vec3 ambient = uAmbient*uLightAmbient; 
            
            // diffuse term
            vec3 normal = normalize(vVertexNormal); 
            vec3 light = normalize(uLightPosition - vWorldPos);
            float lambert = max(0.0,dot(normal,light));
            vec3 diffuse = uDiffuse*uLightDiffuse*lambert; // diffuse term
            
            // specular term
            vec3 eye = normalize(uEyePosition - vWorldPos);
            vec3 halfVec = normalize(light+eye);
            float highlight = pow(max(0.0,dot(normal,halfVec)),uShininess);
            vec3 specular = uSpecular*uLightSpecular*highlight; // specular term
            
            // combine to output color
            vec3 colorOut = ambient + diffuse + specular;
            gl_FragColor = vec4(colorOut, 1.0); 
        }
    `;

    function compileShader(gl, type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Error compiling shader:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    function createProgram(gl, vertexSource, fragmentSource) {
        var vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
        var fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

        if (!vertexShader || !fragmentShader) {
            return null;
        }

        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Error linking program:", gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    function init(gl, config) {
        config = config || {};
        var vertexSource = config.vertexShader || defaultVertexShader;
        var fragmentSource = config.fragmentShader || defaultFragmentShader;

        shaderProgram = createProgram(gl, vertexSource, fragmentSource);
        if (!shaderProgram) {
            throw "Failed to create shader program";
        }

        gl.useProgram(shaderProgram);

        vPosAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(vPosAttribLoc);
        vNormAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexNormal");
        gl.enableVertexAttribArray(vNormAttribLoc);

        mMatrixULoc = gl.getUniformLocation(shaderProgram, "umMatrix");
        pvmMatrixULoc = gl.getUniformLocation(shaderProgram, "upvmMatrix");
        eyePositionULoc = gl.getUniformLocation(shaderProgram, "uEyePosition");
        ambientULoc = gl.getUniformLocation(shaderProgram, "uAmbient");
        diffuseULoc = gl.getUniformLocation(shaderProgram, "uDiffuse");
        specularULoc = gl.getUniformLocation(shaderProgram, "uSpecular");
        shininessULoc = gl.getUniformLocation(shaderProgram, "uShininess");

        return shaderProgram;
    }

    function getProgram() {
        return shaderProgram;
    }

    function getAttributeLocations() {
        return {
            position: vPosAttribLoc,
            normal: vNormAttribLoc
        };
    }

    function getUniformLocations() {
        return {
            modelMatrix: mMatrixULoc,
            pvmMatrix: pvmMatrixULoc,
            eyePosition: eyePositionULoc,
            ambient: ambientULoc,
            diffuse: diffuseULoc,
            specular: specularULoc,
            shininess: shininessULoc
        };
    }

    return {
        init: init,
        getProgram: getProgram,
        getAttributeLocations: getAttributeLocations,
        getUniformLocations: getUniformLocations,
        compileShader: compileShader,
        createProgram: createProgram
    };
})();

