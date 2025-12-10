// WebGL setup and rendering

const Renderer = {
  gl: null,
  lastFrameTime: null,
  
  // Collision debug mode
  debugCollisions: false,
  
  // Set up WebGL environment
  setupWebGL: function() {
    // Set up solid background canvas (black)
    var imageCanvas = document.getElementById("myImageCanvas");
    var cw = imageCanvas.width, ch = imageCanvas.height;
    var imageContext = imageCanvas.getContext("2d");
    imageContext.fillStyle = "black";
    imageContext.fillRect(0, 0, cw, ch);

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas");
    this.gl = canvas.getContext("webgl", { alpha: true });

    try {
      if (this.gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        this.gl.viewport(0, 0, canvas.width, canvas.height);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      }
    } catch (e) {
      console.log(e);
    }
  },
  
  // Render the loaded model
  renderTriangles: function() {
    var gl = this.gl;
    
    // Calculate delta time
    var currentTime = performance.now();
    var deltaTime = 0;
    if (this.lastFrameTime !== null) {
      deltaTime = (currentTime - this.lastFrameTime) / 1000.0; // Convert to seconds
    }
    this.lastFrameTime = currentTime;
    
    // Cap delta time to prevent large jumps
    if (deltaTime > 0.1) {
      deltaTime = 0.1;
    }
    
    // Update input-based movement
    if (deltaTime > 0) {
      Input.update(deltaTime);
    }
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    requestAnimationFrame(() => this.renderTriangles());
    
    // Update mountains translation to follow camera
    Models.updateMountainsTranslation();
    
    // Update enemy tank movement (pass deltaTime for timer)
    Models.updateTankMovement(deltaTime);
    
    // Update all game objects (new object-oriented approach)
    if (deltaTime > 0) {
      Models.updateGameObjects(deltaTime);
    }
    
    // Update game state
    if (deltaTime > 0 && typeof GameState !== 'undefined') {
      GameState.update(deltaTime);
    }
    
    // Check collisions between all game objects
    var collisions = Collision.update();
    
    // Optionally resolve collisions (push objects apart)
    for (var i = 0; i < collisions.length; i++) {
      Collision.resolveCollision(collisions[i]);
    }
    
    // Check enemy bullets hitting player (separate from object collision)
    if (typeof GameState !== 'undefined' && GameState.isPlaying()) {
      for (var i = 0; i < Models.enemyBullets.length; i++) {
        var bullet = Models.enemyBullets[i];
        if (bullet && bullet.checkPlayerHit && bullet.checkPlayerHit()) {
          GameState.onPlayerDeath();
          break; // Only need to detect one hit
        }
      }
    }
    
    // Debug: log collisions
    if (this.debugCollisions && collisions.length > 0) {
      console.log("Frame collisions:", collisions.length);
    }
    
    // vertex buffer: activate and feed into vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER, Models.vertexBuffer);
    gl.vertexAttribPointer(Shaders.vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, Models.colorDiffuseBuffer);
    gl.vertexAttribPointer(Shaders.vertexDiffuseAttrib, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, Models.colorAmbientBuffer);
    gl.vertexAttribPointer(Shaders.vertexAmbientAttrib, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, Models.colorSpecBuffer);
    gl.vertexAttribPointer(Shaders.vertexSpecAttrib, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, Models.colorNBuffer);
    gl.vertexAttribPointer(Shaders.vertexNAttrib, 1, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, Models.colorAlphaBuffer);
    gl.vertexAttribPointer(Shaders.vertexAlphaAttrib, 1, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, Models.vertexNormalBuffer);
    gl.vertexAttribPointer(Shaders.vertexNormalAttrib, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, Models.uvBuffer);
    gl.vertexAttribPointer(Shaders.vertexUVAttrib, 2, gl.FLOAT, false, 0, 0);
    
    var viewMat = mat4.create();
    mat4.lookAt(viewMat, Camera.Eye, Camera.Target, Camera.ViewUp);
    
    var canvas = document.getElementById("myWebGLCanvas");
    var aspectRatio = canvas.width / canvas.height;
    var projectionMat = mat4.create();
    mat4.perspective(projectionMat, Math.PI / 2, aspectRatio, 0.01, 100);
    
    gl.uniformMatrix4fv(Shaders.viewMatUniform, false, viewMat);
    gl.uniformMatrix4fv(Shaders.projectionMatUniform, false, projectionMat);
    gl.uniform3fv(Shaders.lightPosUniform, Lighting.lightPos);
    gl.uniform3fv(Shaders.lightDiffuseUniform, Lighting.lightDiffuse);
    gl.uniform3fv(Shaders.lightAmbientUniform, Lighting.lightAmbient);
    gl.uniform3fv(Shaders.lightSpecUniform, Lighting.lightSpec);
    gl.uniform3fv(Shaders.eyePositionUniform, [Camera.Eye[0], Camera.Eye[1], Camera.Eye[2]]);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Models.indexBuffer);
    gl.uniform1i(Shaders.textureUniform, 0);
    
    // Render all triangle sets (only active game objects)
    for (var itr = 0; itr < Models.TriangleSetInfo.length; itr++) {
      // Check if corresponding game object is active
      var gameObject = Models.getGameObjectBySetIndex(itr);
      if (gameObject && !gameObject.active) {
        continue; // Skip inactive objects
      }
      
      gl.uniformMatrix4fv(Shaders.modelMatUniform, false, Models.modelMat[itr]);
      if (Models.textureArray[itr]) {
        gl.bindTexture(gl.TEXTURE_2D, Models.textureArray[itr]);
      }
      // Use appropriate index type based on scene size
      var indexType = Models.useUint32Indices ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
      var bytesPerIndex = Models.useUint32Indices ? 4 : 2;
      gl.drawElements(gl.TRIANGLES, Models.TriangleSetInfo[itr].endIdx - Models.TriangleSetInfo[itr].startIdx, indexType, Models.TriangleSetInfo[itr].startIdx * bytesPerIndex);
    }

    // Draw 2D HUD overlay
    if (typeof HUD !== 'undefined') {
      HUD.draw(deltaTime);
    }
  },
  
  // Toggle collision debug mode
  toggleCollisionDebug: function() {
    this.debugCollisions = !this.debugCollisions;
    Collision.debug = this.debugCollisions;
    console.log("Collision debug:", this.debugCollisions ? "ON" : "OFF");
  }
};
