class BattlezoneGame {
    constructor(config) {
        this.config = config || {};
        this.gl = null;
        this.canvas = null;
        
        this.shaders = null;
        this.camera = null;
        this.lighting = null;
        this.models = null;
        this.renderer = null;
        this.input = null;
        
        this.isInitialized = false;
    }

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw "Canvas element not found: " + canvasId;
        }

        this.gl = this.canvas.getContext("webgl");
        if (!this.gl) {
            throw "Unable to create WebGL context";
        }

        this.camera = Camera;
        this.lighting = Lighting;
        this.models = Models;
        this.renderer = Renderer;
        this.input = Input;

        this.setupWebGL();

        this.shaders = Shaders;
        this.shaders.init(this.gl, this.config.shaders);

        this.lighting.init(this.config.lighting);
        this.lighting.setupUniforms(this.shaders.getProgram(), this.gl);

        this.renderer.init(this.gl, this.config.renderer);

        this.camera.init({
            eye: this.config.camera?.eye || vec3.fromValues(0.5, 0.5, -0.5),
            center: this.config.camera?.center || vec3.fromValues(0.5, 0.5, 0.5),
            up: this.config.camera?.up || vec3.fromValues(0, 1, 0),
            viewDelta: this.config.camera?.viewDelta || 0.01
        });

        this.input.init({
            onKeyDown: (event) => this.handleKeyDown(event)
        });

        this.isInitialized = true;
    }

    setupWebGL(imageCanvasId, backgroundImageUrl) {
        if (imageCanvasId && backgroundImageUrl) {
            var imageCanvas = document.getElementById(imageCanvasId);
            if (imageCanvas) {
                var cw = imageCanvas.width, ch = imageCanvas.height;
                var imageContext = imageCanvas.getContext("2d");
                var bkgdImage = new Image();
                bkgdImage.crossOrigin = "Anonymous";
                bkgdImage.src = backgroundImageUrl;
                bkgdImage.onload = function() {
                    var iw = bkgdImage.width, ih = bkgdImage.height;
                    imageContext.drawImage(bkgdImage, 0, 0, iw, ih, 0, 0, cw, ch);
                };
            }
        }
    }

    loadModels(trianglesUrl, ellipsoidsUrl, ellipsoidLongSteps) {
        if (!this.isInitialized) {
            throw "Game must be initialized before loading models";
        }

        if (trianglesUrl) {
            var trianglesData = Utils.getJSONFile(trianglesUrl, "triangles");
            if (trianglesData) {
                var viewDelta = this.models.loadTriangles(this.gl, trianglesData);
                this.camera.setViewDelta(viewDelta);
            }
        }

        if (ellipsoidsUrl) {
            var ellipsoidsData = Utils.getJSONFile(ellipsoidsUrl, "ellipsoids");
            if (ellipsoidsData) {
                this.models.loadEllipsoids(this.gl, ellipsoidsData, ellipsoidLongSteps || 32);
            }
        }
    }

    start() {
        if (!this.isInitialized) {
            throw "Game must be initialized before starting";
        }

        var attribLocs = this.shaders.getAttributeLocations();
        var uniformLocs = this.shaders.getUniformLocations();

        this.renderer.render({
            onRender: (gl, pMatrix) => {
                gl.uniform3fv(uniformLocs.eyePosition, this.camera.getEye());

                var vMatrix = this.camera.getViewMatrix();
                var pvMatrix = mat4.create();
                mat4.multiply(pvMatrix, pMatrix, vMatrix);

                var triangles = this.models.getTriangles();
                var ellipsoids = this.models.getEllipsoids();
                var numTriangleSets = this.models.getNumTriangleSets();
                var numEllipsoids = this.models.getNumEllipsoids();
                var vertexBuffers = this.models.getVertexBuffers();
                var normalBuffers = this.models.getNormalBuffers();
                var triangleBuffers = this.models.getTriangleBuffers();
                var triSetSizes = this.models.getTriSetSizes();

                for (var whichTriSet = 0; whichTriSet < numTriangleSets; whichTriSet++) {
                    this.renderer.renderTriangleSet(
                        gl, triangles[whichTriSet], whichTriSet, pvMatrix,
                        attribLocs, uniformLocs,
                        vertexBuffers, normalBuffers, triangleBuffers, triSetSizes
                    );
                }

                for (var whichEllipsoid = 0; whichEllipsoid < numEllipsoids; whichEllipsoid++) {
                    this.renderer.renderEllipsoid(
                        gl, ellipsoids[whichEllipsoid], whichEllipsoid, numTriangleSets, pvMatrix,
                        attribLocs, uniformLocs,
                        vertexBuffers, normalBuffers, triangleBuffers, triSetSizes
                    );
                }
            }
        });
    }

    handleKeyDown(event) {
        const modelEnum = { TRIANGLES: "triangles", ELLIPSOID: "ellipsoid" };
        const dirEnum = { NEGATIVE: -1, POSITIVE: 1 };

        var triangles = this.models.getTriangles();
        var ellipsoids = this.models.getEllipsoids();
        var numTriangleSets = this.models.getNumTriangleSets();
        var numEllipsoids = this.models.getNumEllipsoids();

        var lookAt = vec3.create(), viewRight = vec3.create(), temp = vec3.create();
        lookAt = vec3.normalize(lookAt, vec3.subtract(temp, this.camera.getCenter(), this.camera.getEye()));
        viewRight = vec3.normalize(viewRight, vec3.cross(temp, lookAt, this.camera.getUp()));

        switch (event.code) {
            case "Space":
                this.input.clearSelection();
                break;
            case "ArrowRight": 
                if (numTriangleSets > 0) {
                    var nextIndex = (this.input.getCurrentModelIndex() + 1) % numTriangleSets;
                    this.input.highlightModel(modelEnum.TRIANGLES, nextIndex, triangles, ellipsoids);
                }
                break;
            case "ArrowLeft": 
                if (numTriangleSets > 0) {
                    var prevIndex = (this.input.getCurrentModelIndex() > 0) ? 
                        this.input.getCurrentModelIndex() - 1 : numTriangleSets - 1;
                    this.input.highlightModel(modelEnum.TRIANGLES, prevIndex, triangles, ellipsoids);
                }
                break;
            case "ArrowUp": 
                if (numEllipsoids > 0) {
                    var nextIndex = (this.input.getCurrentModelIndex() + 1) % numEllipsoids;
                    this.input.highlightModel(modelEnum.ELLIPSOID, nextIndex, triangles, ellipsoids);
                }
                break;
            case "ArrowDown": 
                if (numEllipsoids > 0) {
                    var prevIndex = (this.input.getCurrentModelIndex() > 0) ? 
                        this.input.getCurrentModelIndex() - 1 : numEllipsoids - 1;
                    this.input.highlightModel(modelEnum.ELLIPSOID, prevIndex, triangles, ellipsoids);
                }
                break;

            
            case "KeyA": 
                this.camera.moveLeft(!event.getModifierState("Shift"));
                break;
            case "KeyD": 
                this.camera.moveRight(!event.getModifierState("Shift"));
                break;
            case "KeyS": 
                this.camera.moveBackward(event.getModifierState("Shift"));
                break;
            case "KeyW": 
                this.camera.moveForward(event.getModifierState("Shift"));
                break;
            case "KeyQ": 
                this.camera.moveUp(event.getModifierState("Shift"));
                break;
            case "KeyE": 
                this.camera.moveDown(event.getModifierState("Shift"));
                break;
            case "Escape": 
                this.camera.reset();
                break;

            
            case "KeyK": 
                if (event.getModifierState("Shift"))
                    this.input.rotateModel(this.camera.getUp(), dirEnum.NEGATIVE, this.renderer.getRotateTheta());
                else
                    this.input.translateModel(vec3.scale(temp, viewRight, this.camera.getViewDelta()));
                break;
            case "Semicolon": 
                if (event.getModifierState("Shift"))
                    this.input.rotateModel(this.camera.getUp(), dirEnum.POSITIVE, this.renderer.getRotateTheta());
                else
                    this.input.translateModel(vec3.scale(temp, viewRight, -this.camera.getViewDelta()));
                break;
            case "KeyL": 
                if (event.getModifierState("Shift"))
                    this.input.rotateModel(viewRight, dirEnum.POSITIVE, this.renderer.getRotateTheta());
                else
                    this.input.translateModel(vec3.scale(temp, lookAt, -this.camera.getViewDelta()));
                break;
            case "KeyO":
                if (event.getModifierState("Shift"))
                    this.input.rotateModel(viewRight, dirEnum.NEGATIVE, this.renderer.getRotateTheta());
                else
                    this.input.translateModel(vec3.scale(temp, lookAt, this.camera.getViewDelta()));
                break;
            case "KeyI": 
                if (event.getModifierState("Shift"))
                    this.input.rotateModel(lookAt, dirEnum.POSITIVE, this.renderer.getRotateTheta());
                else
                    this.input.translateModel(vec3.scale(temp, this.camera.getUp(), this.camera.getViewDelta()));
                break;
            case "KeyP": 
                if (event.getModifierState("Shift"))
                    this.input.rotateModel(lookAt, dirEnum.NEGATIVE, this.renderer.getRotateTheta());
                else
                    this.input.translateModel(vec3.scale(temp, this.camera.getUp(), -this.camera.getViewDelta()));
                break;
            case "Backspace": 
                this.models.resetTransforms();
                break;
        }
    }

    /**
     * Get a module by name
     * @param {string} moduleName - Name of module ('camera', 'lighting', 'models', 'renderer', 'input', 'shaders')
     * @returns {Object} The module
     */
    getModule(moduleName) {
        switch(moduleName.toLowerCase()) {
            case 'camera': return this.camera;
            case 'lighting': return this.lighting;
            case 'models': return this.models;
            case 'renderer': return this.renderer;
            case 'input': return this.input;
            case 'shaders': return this.shaders;
            default: return null;
        }
    }
}

