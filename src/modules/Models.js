// Model loading, triangle sets, buffers, and transformations

const Models = {
  // Remote sources for both the mountain and tank JSON triangle sets
  INPUT_TRIANGLES_URLS: [
    "https://korupttinker.github.io/battlezone_js/scene.json"
  ],
  
  vertexBuffer: null,
  triangleBuffer: null,
  triBufferSize: 0,
  colorDiffuseBuffer: null,
  colorAmbientBuffer: null,
  colorSpecBuffer: null,
  colorNBuffer: null,
  colorAlphaBuffer: null,
  vertexNormalBuffer: null,
  uvBuffer: null,
  indexBuffer: null,
  indexArray: [],
  textureArray: [],
  modelMat: [],
  TriangleSetInfo: [],
  selectedSet: -1,
  mountainsSetIndices: [],
  tanksSetIndices: [],
  tankForwardDirections: [], // Store forward direction for each tank
  tankPositions: [], // Store current position for each tank
  initialCameraEye: null,
  initialCameraTarget: null,
  
  // Load triangles from JSON file
  loadTriangles: function(gl) {
    // Reset any stale buffers/state in case we reload
    this.indexArray = [];
    this.textureArray = [];
    this.modelMat = [];
    this.TriangleSetInfo = [];
    this.selectedSet = -1;
    this.mountainsSetIndices = [];
    this.tanksSetIndices = [];
    this.tankForwardDirections = [];
    this.tankPositions = [];

    // Support loading multiple JSON triangle sets so we can show mountains + tank together
    var triangleSources = Array.isArray(this.INPUT_TRIANGLES_URLS) ? this.INPUT_TRIANGLES_URLS : [this.INPUT_TRIANGLES_URLS];
    var inputTriangles = [];
    triangleSources.forEach(function(url) {
      var data = Utils.getJSONFile(url, "triangles");
      if (data != String.null) {
        // Each file returns an array of triangle sets; append them
        inputTriangles = inputTriangles.concat(data);
      }
    });

    if (inputTriangles.length > 0) {
      var whichSetVert;
      var whichSetTri; 
      var coordArray = []; 
      var indexOffset = 0;
      var colorDiffuseArray = [];
      var colorAmbientArray = [];
      var colorSpecArray = [];
      var colorNArray = [];
      var colorAlphaArray = [];
      var vertexNormalArray = [];
      var totalTriangles = 0;
      var uvArray = [];
      var textureNameArray = [];
      
      for (var whichSet = 0; whichSet < inputTriangles.length; whichSet++) {
        var setData = {
          startIdx: totalTriangles * 3,
          textureName: inputTriangles[whichSet].material.texture
        };
        var avgPos = [0, 0, 0];
        textureNameArray.push(inputTriangles[whichSet].material.texture);
        
        for (whichSetVert = 0; whichSetVert < inputTriangles[whichSet].vertices.length; whichSetVert++) {
          coordArray = coordArray.concat(inputTriangles[whichSet].vertices[whichSetVert]);
          colorDiffuseArray.push(inputTriangles[whichSet].material.diffuse[0], inputTriangles[whichSet].material.diffuse[1], inputTriangles[whichSet].material.diffuse[2]);
          colorAmbientArray.push(inputTriangles[whichSet].material.ambient[0], inputTriangles[whichSet].material.ambient[1], inputTriangles[whichSet].material.ambient[2]);
          colorSpecArray.push(inputTriangles[whichSet].material.specular[0], inputTriangles[whichSet].material.specular[1], inputTriangles[whichSet].material.specular[2]);
          colorNArray.push(inputTriangles[whichSet].material.n);
          colorAlphaArray.push(inputTriangles[whichSet].material.alpha);
          vertexNormalArray = vertexNormalArray.concat(inputTriangles[whichSet].normals[whichSetVert]);
          avgPos[0] += inputTriangles[whichSet].vertices[whichSetVert][0];
          avgPos[1] += inputTriangles[whichSet].vertices[whichSetVert][1];
          avgPos[2] += inputTriangles[whichSet].vertices[whichSetVert][2];
          uvArray = uvArray.concat(inputTriangles[whichSet].uvs[whichSetVert]);
        }
        
        avgPos[0] /= inputTriangles[whichSet].vertices.length;
        avgPos[1] /= inputTriangles[whichSet].vertices.length;
        avgPos[2] /= inputTriangles[whichSet].vertices.length;
        
        for (whichSetTri = 0; whichSetTri < inputTriangles[whichSet].triangles.length; whichSetTri++) {
          totalTriangles++;
          this.indexArray.push(inputTriangles[whichSet].triangles[whichSetTri][0] + indexOffset, inputTriangles[whichSet].triangles[whichSetTri][1] + indexOffset, inputTriangles[whichSet].triangles[whichSetTri][2] + indexOffset);
        }
        indexOffset += inputTriangles[whichSet].vertices.length;
        setData.endIdx = totalTriangles * 3;
        setData.avgPos = avgPos;
        this.modelMat.push(mat4.create());
        this.TriangleSetInfo.push(setData);
        
        // Identify mountains triangle sets by texture name
        if (inputTriangles[whichSet].material.texture === "mountain_texture.png") {
          this.mountainsSetIndices.push(whichSet);
        }
        
        // Identify tank triangle sets by texture name
        if (inputTriangles[whichSet].material.texture === "enemy_tank.png") {
          this.tanksSetIndices.push(whichSet);
          // Calculate forward direction from tank vertices
          var forwardDir = this.calculateTankForwardDirection(inputTriangles[whichSet].vertices);
          // Project onto XZ plane (set Y to 0 and renormalize)
          forwardDir[1] = 0;
          var len = Math.sqrt(forwardDir[0] * forwardDir[0] + forwardDir[2] * forwardDir[2]);
          if (len > 0) {
            forwardDir[0] /= len;
            forwardDir[2] /= len;
          } else {
            forwardDir = [0, 0, 1]; // Default forward direction along Z
          }
          this.tankForwardDirections.push(forwardDir);
        }
      } 
      
      this.vertexBuffer = gl.createBuffer(); 
      this.indexBuffer = gl.createBuffer();
      this.colorDiffuseBuffer = gl.createBuffer();
      this.colorAmbientBuffer = gl.createBuffer();
      this.colorSpecBuffer = gl.createBuffer();
      this.colorNBuffer = gl.createBuffer();
      this.colorAlphaBuffer = gl.createBuffer();
      this.vertexNormalBuffer = gl.createBuffer();
      this.uvBuffer = gl.createBuffer();
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer); 
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordArray), gl.STATIC_DRAW); 
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexArray), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorDiffuseBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorDiffuseArray), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorAmbientBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorAmbientArray), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorSpecBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorSpecArray), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorNBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorNArray), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorAlphaBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorAlphaArray), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormalArray), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvArray), gl.STATIC_DRAW);
      
      var texturePromises = [];
      for(var textureId = 0; textureId < textureNameArray.length; textureId++) {
        texturePromises.push(Utils.getTextureImage(gl, textureNameArray[textureId]));
      }
      Promise.all(texturePromises).then(function(loadedTextures) {
        for(var i = 0; i < loadedTextures.length; i++) {
          Models.textureArray.push(loadedTextures[i]);
        }
      }).catch(function(error) {
        console.error("Error loading textures:", error);
      });
      
      // Initialize tank positions
      this.initializeTankPositions();
    } 
  },
  
  // Calculate the forward direction of a tank from its vertex set
  calculateTankForwardDirection: function(vertices) {
    if (vertices.length === 0) {
      return [0, 0, 1]; // Default forward direction
    }
    
    // Calculate centroid
    var centroid = [0, 0, 0];
    for (var i = 0; i < vertices.length; i++) {
      centroid[0] += vertices[i][0];
      centroid[1] += vertices[i][1];
      centroid[2] += vertices[i][2];
    }
    centroid[0] /= vertices.length;
    centroid[1] /= vertices.length;
    centroid[2] /= vertices.length;
    
    // Find min and max values for each axis to determine principal axis
    var minX = vertices[0][0], maxX = vertices[0][0];
    var minY = vertices[0][1], maxY = vertices[0][1];
    var minZ = vertices[0][2], maxZ = vertices[0][2];
    
    for (var i = 1; i < vertices.length; i++) {
      var v = vertices[i];
      if (v[0] < minX) minX = v[0];
      if (v[0] > maxX) maxX = v[0];
      if (v[1] < minY) minY = v[1];
      if (v[1] > maxY) maxY = v[1];
      if (v[2] < minZ) minZ = v[2];
      if (v[2] > maxZ) maxZ = v[2];
    }
    
    // Calculate extents along each axis
    var extentX = maxX - minX;
    var extentY = maxY - minY;
    var extentZ = maxZ - minZ;
    
    // Find the axis with the largest extent (principal axis)
    var principalAxis;
    var forward;
    
    if (extentX >= extentY && extentX >= extentZ) {
      // X axis is the principal axis
      principalAxis = 0;
      // Find average position of vertices on each side of centroid along X
      var frontSum = [0, 0, 0], backSum = [0, 0, 0];
      var frontCount = 0, backCount = 0;
      for (var i = 0; i < vertices.length; i++) {
        if (vertices[i][0] > centroid[0]) {
          frontSum[0] += vertices[i][0];
          frontSum[1] += vertices[i][1];
          frontSum[2] += vertices[i][2];
          frontCount++;
        } else {
          backSum[0] += vertices[i][0];
          backSum[1] += vertices[i][1];
          backSum[2] += vertices[i][2];
          backCount++;
        }
      }
      if (frontCount > 0 && backCount > 0) {
        frontSum[0] /= frontCount;
        frontSum[1] /= frontCount;
        frontSum[2] /= frontCount;
        backSum[0] /= backCount;
        backSum[1] /= backCount;
        backSum[2] /= backCount;
        forward = [
          frontSum[0] - backSum[0],
          frontSum[1] - backSum[1],
          frontSum[2] - backSum[2]
        ];
      } else {
        forward = [1, 0, 0]; // Default along X
      }
    } else if (extentY >= extentX && extentY >= extentZ) {
      // Y axis is the principal axis
      principalAxis = 1;
      // Find average position of vertices on each side of centroid along Y
      var frontSum = [0, 0, 0], backSum = [0, 0, 0];
      var frontCount = 0, backCount = 0;
      for (var i = 0; i < vertices.length; i++) {
        if (vertices[i][1] > centroid[1]) {
          frontSum[0] += vertices[i][0];
          frontSum[1] += vertices[i][1];
          frontSum[2] += vertices[i][2];
          frontCount++;
        } else {
          backSum[0] += vertices[i][0];
          backSum[1] += vertices[i][1];
          backSum[2] += vertices[i][2];
          backCount++;
        }
      }
      if (frontCount > 0 && backCount > 0) {
        frontSum[0] /= frontCount;
        frontSum[1] /= frontCount;
        frontSum[2] /= frontCount;
        backSum[0] /= backCount;
        backSum[1] /= backCount;
        backSum[2] /= backCount;
        forward = [
          frontSum[0] - backSum[0],
          frontSum[1] - backSum[1],
          frontSum[2] - backSum[2]
        ];
      } else {
        forward = [0, 1, 0]; // Default along Y
      }
    } else {
      // Z axis is the principal axis (most common for tanks)
      principalAxis = 2;
      // Find average position of vertices on each side of centroid along Z
      var frontSum = [0, 0, 0], backSum = [0, 0, 0];
      var frontCount = 0, backCount = 0;
      for (var i = 0; i < vertices.length; i++) {
        if (vertices[i][2] > centroid[2]) {
          frontSum[0] += vertices[i][0];
          frontSum[1] += vertices[i][1];
          frontSum[2] += vertices[i][2];
          frontCount++;
        } else {
          backSum[0] += vertices[i][0];
          backSum[1] += vertices[i][1];
          backSum[2] += vertices[i][2];
          backCount++;
        }
      }
      if (frontCount > 0 && backCount > 0) {
        frontSum[0] /= frontCount;
        frontSum[1] /= frontCount;
        frontSum[2] /= frontCount;
        backSum[0] /= backCount;
        backSum[1] /= backCount;
        backSum[2] /= backCount;
        forward = [
          frontSum[0] - backSum[0],
          frontSum[1] - backSum[1],
          frontSum[2] - backSum[2]
        ];
      } else {
        forward = [0, 0, 1]; // Default along Z
      }
    }
    
    // Normalize the forward vector
    var len = Math.sqrt(forward[0] * forward[0] + forward[1] * forward[1] + forward[2] * forward[2]);
    if (len > 0) {
      forward[0] /= len;
      forward[1] /= len;
      forward[2] /= len;
    } else {
      forward = [0, 0, 1]; // Default forward direction
    }
    
    // Reverse the direction (tank was moving backward, now it will move forward)
    forward[0] = -forward[0];
    forward[1] = -forward[1];
    forward[2] = -forward[2];
    
    return forward;
  },
  
  // Initialize tank positions to (0.5, 0, 0.3)
  initializeTankPositions: function() {
    for (var i = 0; i < this.tanksSetIndices.length; i++) {
      var setIdx = this.tanksSetIndices[i];
      var initialPos = [0.5, 0, 0.3];
      this.tankPositions.push([initialPos[0], initialPos[1], initialPos[2]]);
      
      // Reset model matrix and position tank
      this.modelMat[setIdx] = mat4.create();
      // Translate to move avgPos to origin
      this.translate(
        -this.TriangleSetInfo[setIdx].avgPos[0],
        -this.TriangleSetInfo[setIdx].avgPos[1],
        -this.TriangleSetInfo[setIdx].avgPos[2],
        setIdx
      );
      // Then translate to desired world position
      this.translate(
        initialPos[0],
        initialPos[1],
        initialPos[2],
        setIdx
      );
    }
  },
  
  // Update tank positions to move forward
  updateTankMovement: function() {
    // Check if tanks are loaded
    if (this.tanksSetIndices.length === 0 || this.tankPositions.length === 0) {
      return;
    }
    
    // Movement speed (adjusted for small scale)
    var moveSpeed = 0.0001; // Small movement per frame
    
    for (var i = 0; i < this.tanksSetIndices.length; i++) {
      var setIdx = this.tanksSetIndices[i];
      var forwardDir = this.tankForwardDirections[i];
      
      // Update position (only in XZ plane, keep Y constant)
      this.tankPositions[i][0] += forwardDir[0] * moveSpeed;
      // Y remains constant (don't update this.tankPositions[i][1])
      this.tankPositions[i][2] += forwardDir[2] * moveSpeed;
      
      // Update model matrix
      this.modelMat[setIdx] = mat4.create();
      // Translate to move avgPos to origin
      this.translate(
        -this.TriangleSetInfo[setIdx].avgPos[0],
        -this.TriangleSetInfo[setIdx].avgPos[1],
        -this.TriangleSetInfo[setIdx].avgPos[2],
        setIdx
      );
      // Then translate to current position
      this.translate(
        this.tankPositions[i][0],
        this.tankPositions[i][1],
        this.tankPositions[i][2],
        setIdx
      );
    }
  },
  
  // Transformation functions
  scale: function(scale, setIdx) {
    this.translate(this.TriangleSetInfo[setIdx].avgPos[0], this.TriangleSetInfo[setIdx].avgPos[1], this.TriangleSetInfo[setIdx].avgPos[2], setIdx);
    mat4.scale(this.modelMat[setIdx], this.modelMat[setIdx], [scale, scale, scale]);
    this.translate(-this.TriangleSetInfo[setIdx].avgPos[0], -this.TriangleSetInfo[setIdx].avgPos[1], -this.TriangleSetInfo[setIdx].avgPos[2], setIdx);
  },
  
  translate: function(tx, ty, tz, setIdx) {
    mat4.translate(this.modelMat[setIdx], this.modelMat[setIdx], [tx, ty, tz]);
  },
  
  rotate: function(angle, axis, setIdx) {
    this.translate(this.TriangleSetInfo[setIdx].avgPos[0], this.TriangleSetInfo[setIdx].avgPos[1], this.TriangleSetInfo[setIdx].avgPos[2], setIdx);
    mat4.rotate(this.modelMat[setIdx], this.modelMat[setIdx], angle, axis);
    this.translate(-this.TriangleSetInfo[setIdx].avgPos[0], -this.TriangleSetInfo[setIdx].avgPos[1], -this.TriangleSetInfo[setIdx].avgPos[2], setIdx);
  },
  
  // Reset all model matrices
  resetModels: function() {
    for(var i = 0; i < this.TriangleSetInfo.length; i++) {
      this.modelMat[i] = mat4.create();
    }
    this.selectedSet = -1;
  },
  
  // Update mountains translation to follow camera
  updateMountainsTranslation: function() {
    if (this.mountainsSetIndices.length > 0 && this.initialCameraEye !== null) {
      // Calculate translation delta from initial camera position
      var deltaX = Camera.Eye[0] - this.initialCameraEye[0];
      var deltaY = Camera.Eye[1] - this.initialCameraEye[1];
      var deltaZ = Camera.Eye[2] - this.initialCameraEye[2];
      
      // Update all mountains triangle sets
      for (var i = 0; i < this.mountainsSetIndices.length; i++) {
        var setIdx = this.mountainsSetIndices[i];
        // Reset mountains model matrix and apply translation
        this.modelMat[setIdx] = mat4.create();
        this.translate(deltaX, deltaY, deltaZ, setIdx);
      }
    }
  },
  
  // Position tanks horizontally in front of the camera
  positionTanksInFrontOfCamera: function() {
    if (this.tanksSetIndices.length < 2) {
      console.warn("Need at least 2 tank sets to position them horizontally");
      return;
    }
    
    // Use initial camera position and target for fixed world positioning
    var eyePos = this.initialCameraEye ? [this.initialCameraEye[0], this.initialCameraEye[1], this.initialCameraEye[2]] : [Camera.Eye[0], Camera.Eye[1], Camera.Eye[2]];
    var targetPos = this.initialCameraTarget ? this.initialCameraTarget : Camera.Target;
    
    // Calculate forward direction vector (from Eye to Target)
    var forward = [
      targetPos[0] - eyePos[0],
      targetPos[1] - eyePos[1],
      targetPos[2] - eyePos[2]
    ];
    
    // Normalize forward vector
    var forwardLen = Math.sqrt(forward[0] * forward[0] + forward[1] * forward[1] + forward[2] * forward[2]);
    if (forwardLen > 0) {
      forward[0] /= forwardLen;
      forward[1] /= forwardLen;
      forward[2] /= forwardLen;
    }
    
    // Calculate right vector using ViewUp and forward
    // Right = forward × ViewUp (normalized)
    var viewUp = [Camera.ViewUp[0], Camera.ViewUp[1], Camera.ViewUp[2]];
    var right = [
      forward[1] * viewUp[2] - forward[2] * viewUp[1],
      forward[2] * viewUp[0] - forward[0] * viewUp[2],
      forward[0] * viewUp[1] - forward[1] * viewUp[0]
    ];
    
    // Normalize right vector
    var rightLen = Math.sqrt(right[0] * right[0] + right[1] * right[1] + right[2] * right[2]);
    if (rightLen > 0) {
      right[0] /= rightLen;
      right[1] /= rightLen;
      right[2] /= rightLen;
    } else {
      // Fallback: use world right if cross product is zero
      right = [1, 0, 0];
    }
    
    // Distance in front of camera along forward direction
    var distanceInFront = 1.5;
    
    // Horizontal offset (spacing between tanks, perpendicular to forward)
    var horizontalOffset = 0.8;
    
    // Calculate position along forward direction (somewhere between eye and target)
    var basePos = [
      eyePos[0] + forward[0] * distanceInFront,
      eyePos[1] + forward[1] * distanceInFront,
      eyePos[2] + forward[2] * distanceInFront
    ];
    
    // Position first tank to the left (negative right direction)
    var tank1SetIdx = this.tanksSetIndices[0];
    var tank1Pos = [
      basePos[0] - right[0] * horizontalOffset,
      basePos[1] - right[1] * horizontalOffset,
      basePos[2] - right[2] * horizontalOffset
    ];
    
    // Position second tank to the right (positive right direction)
    var tank2SetIdx = this.tanksSetIndices[1];
    var tank2Pos = [
      basePos[0] + right[0] * horizontalOffset,
      basePos[1] + right[1] * horizontalOffset,
      basePos[2] + right[2] * horizontalOffset
    ];
    
    // Reset model matrices and apply translations
    // Translate from the tank's center (avgPos) to the desired world position
    // First translate to origin, then to desired position
    this.modelMat[tank1SetIdx] = mat4.create();
    // Translate to move avgPos to origin
    this.translate(
      -this.TriangleSetInfo[tank1SetIdx].avgPos[0],
      -this.TriangleSetInfo[tank1SetIdx].avgPos[1],
      -this.TriangleSetInfo[tank1SetIdx].avgPos[2],
      tank1SetIdx
    );
    // Then translate to desired world position
    this.translate(
      tank1Pos[0],
      tank1Pos[1],
      tank1Pos[2],
      tank1SetIdx
    );
    
    this.modelMat[tank2SetIdx] = mat4.create();
    // Translate to move avgPos to origin
    this.translate(
      -this.TriangleSetInfo[tank2SetIdx].avgPos[0],
      -this.TriangleSetInfo[tank2SetIdx].avgPos[1],
      -this.TriangleSetInfo[tank2SetIdx].avgPos[2],
      tank2SetIdx
    );
    // Then translate to desired world position
    this.translate(
      tank2Pos[0],
      tank2Pos[1],
      tank2Pos[2],
      tank2SetIdx
    );
    
    console.log("Positioned 2 tanks horizontally in front of camera");
    console.log("Initial Camera Eye:", eyePos);
    console.log("Initial Camera Target:", targetPos);
    console.log("Forward direction:", forward);
    console.log("Base position:", basePos);
    console.log("Tank 1 position:", tank1Pos);
    console.log("Tank 2 position:", tank2Pos);
  }
};

