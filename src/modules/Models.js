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
  tankInitialForwardDirections: [], // Store INITIAL forward direction for each tank (for rotation calc)
  tankPositions: [], // Store current position for each tank
  tankMovementTimers: [], // Track movement time for each tank
  tankRotatedToPlayer: [], // Track if tank has rotated towards player
  tankRotationAngles: [], // Store current rotation angle for each tank
  tankTargetRotationAngles: [], // Store target rotation angle for gradual rotation
  tankRotationSpeed: 0.3, // Rotation speed in radians per second (same as player)
  tankHasFiredThisRotation: [], // Track if tank has fired during current rotation cycle
  initialCameraEye: null,
  initialCameraTarget: null,
  
  // Game Objects storage
  gameObjects: [],
  
  // Enemy bullets (references to EnemyBullet game objects, one per tank)
  enemyBullets: [],
  
  // Tank death/respawn state
  tankDeadFlags: [], // Track which tanks are dead
  tankRespawnTimers: [], // Timer for each tank's respawn
  tankRespawnDelay: 3.0, // Seconds before a tank respawns
  
  // Store initial tank positions for respawn
  tankInitialPositions: [],
  
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
    this.tankInitialForwardDirections = [];
    this.tankPositions = [];
    this.tankMovementTimers = [];
    this.tankRotatedToPlayer = [];
    this.tankRotationAngles = [];
    this.tankTargetRotationAngles = [];
    this.tankHasFiredThisRotation = [];
    this.tankDeadFlags = [];
    this.tankRespawnTimers = [];
    this.tankInitialPositions = [];
    this.gameObjects = [];
    this.enemyBullets = [];

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
        if (inputTriangles[whichSet].material.texture === "mountain.png" || inputTriangles[whichSet].material.texture === "mountain_texture.png") {
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
          // Store initial forward direction (for rotation calculations)
          this.tankInitialForwardDirections.push([forwardDir[0], forwardDir[1], forwardDir[2]]);
          // Initialize position from scene (using avgPos, will be updated from model matrix later)
          // Store initial position from scene data
          this.tankPositions.push([avgPos[0], avgPos[1], avgPos[2]]);
          // Initialize movement timer to 0
          this.tankMovementTimers.push(0);
          // Initialize rotation tracking
          this.tankRotatedToPlayer.push(false);
          this.tankRotationAngles.push(0);
          this.tankTargetRotationAngles.push(0);
          this.tankHasFiredThisRotation.push(false);
          // Initialize death/respawn tracking
          this.tankDeadFlags.push(false);
          this.tankRespawnTimers.push(0);
          // Store initial position for respawn
          this.tankInitialPositions.push([avgPos[0], avgPos[1], avgPos[2]]);
        }
        
        // Create Game Objects based on type or texture
        var objType = 'generic';
        if (inputTriangles[whichSet].type) {
            objType = inputTriangles[whichSet].type;
        } else if (inputTriangles[whichSet].material.texture === "enemy_tank.png") {
            objType = 'tank';
        } else if (inputTriangles[whichSet].material.texture === "mountain.png" || inputTriangles[whichSet].material.texture === "mountain_texture.png") {
            objType = 'mountain';
        } else if (inputTriangles[whichSet].material.texture === "bullet.png" || inputTriangles[whichSet].material.texture === "player_bullet.png") {
            objType = 'player_bullet';
        } else if (inputTriangles[whichSet].material.texture === "enemy_bullet.png") {
            objType = 'enemy_bullet';
        }

        var newObj;
        if (objType === 'bullet' || objType === 'player_bullet') {
            newObj = new Bullet({
                type: 'player_bullet',
                setIndex: whichSet,
                avgPos: avgPos,
                textureName: inputTriangles[whichSet].material.texture,
                vertices: inputTriangles[whichSet].vertices
            });
        } else if (objType === 'enemy_bullet') {
            // Create enemy bullet - will be assigned to a tank later
            newObj = new EnemyBullet({
                type: 'enemy_bullet',
                setIndex: whichSet,
                avgPos: avgPos,
                textureName: inputTriangles[whichSet].material.texture,
                vertices: inputTriangles[whichSet].vertices
            });
            this.enemyBullets.push(newObj);
        } else {
            newObj = new GameObject({
                type: objType,
                setIndex: whichSet,
                avgPos: avgPos,
                position: [...avgPos], // Initialize position to avgPos for correct bounding box
                textureName: inputTriangles[whichSet].material.texture,
                vertices: inputTriangles[whichSet].vertices,
                isStatic: objType !== 'tank' && objType !== 'bullet',
                collidable: objType !== 'mountain' // Mountains are background only, no collision
            });
        }
        
        this.gameObjects.push(newObj);
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
      
      // Initialize tank positions from scene (extract from model matrices)
      this.initializeTankPositionsFromScene();
      
      // Assign enemy bullets to tanks (one bullet per tank)
      this.assignEnemyBulletsToTanks();
    } 
  },
  
  // Assign enemy bullets to tanks (one per tank)
  assignEnemyBulletsToTanks: function() {
    var numTanks = this.tanksSetIndices.length;
    var numBullets = this.enemyBullets.length;
    
    for (var i = 0; i < Math.min(numTanks, numBullets); i++) {
      this.enemyBullets[i].ownerTankIndex = i;
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
    
    return forward;
  },
  
  // Initialize tank positions from scene (extract world position from model matrices)
  initializeTankPositionsFromScene: function() {
    for (var i = 0; i < this.tanksSetIndices.length; i++) {
      var setIdx = this.tanksSetIndices[i];
      var modelMat = this.modelMat[setIdx];
      
      // Extract translation from model matrix (last column contains translation)
      // Model matrix is 4x4, translation is in indices 12, 13, 14
      var worldPos = [
        modelMat[12],
        modelMat[13],
        modelMat[14]
      ];
      
      // If model matrix is identity (no transformation), use avgPos
      if (modelMat[12] === 0 && modelMat[13] === 0 && modelMat[14] === 0) {
        worldPos = [
          this.TriangleSetInfo[setIdx].avgPos[0],
          this.TriangleSetInfo[setIdx].avgPos[1],
          this.TriangleSetInfo[setIdx].avgPos[2]
        ];
      }
      
      // Update tank position from scene
      if (i < this.tankPositions.length) {
        this.tankPositions[i][0] = worldPos[0];
        this.tankPositions[i][1] = worldPos[1];
        this.tankPositions[i][2] = worldPos[2];
      }
    }
  },
  
  // Check if a tank at position would collide with buildings or player
  checkTankCollision: function(tankIndex, newPosX, newPosZ) {
    var setIdx = this.tanksSetIndices[tankIndex];
    var tankObj = this.getGameObjectBySetIndex(setIdx);
    if (!tankObj || !tankObj.localBoundingBox) return false;
    
    // Calculate potential new bounding box for the tank
    var offset = [
      newPosX - tankObj.avgPos[0],
      tankObj.position[1] - tankObj.avgPos[1],
      newPosZ - tankObj.avgPos[2]
    ];
    
    var tankBox = {
      min: [
        tankObj.localBoundingBox.min[0] + offset[0],
        tankObj.localBoundingBox.min[1] + offset[1],
        tankObj.localBoundingBox.min[2] + offset[2]
      ],
      max: [
        tankObj.localBoundingBox.max[0] + offset[0],
        tankObj.localBoundingBox.max[1] + offset[1],
        tankObj.localBoundingBox.max[2] + offset[2]
      ]
    };
    
    // Check collision with houses and other tanks
    for (var i = 0; i < this.gameObjects.length; i++) {
      var obj = this.gameObjects[i];
      
      // Skip self, inactive objects, non-collidable objects
      if (!obj.active || !obj.collidable || obj.setIndex === setIdx) continue;
      
      // Check against houses (buildings)
      if (obj.type === 'house') {
        if (this.checkAABBOverlap(tankBox, obj.boundingBox)) {
          return true; // Collision detected with building
        }
      }
      
      // Check against other tanks
      if ((obj.type === 'tank' || obj.type === 'enemy_tank') && obj.setIndex !== setIdx) {
        if (this.checkAABBOverlap(tankBox, obj.boundingBox)) {
          return true; // Collision detected with another tank
        }
      }
    }
    
    // Check collision with player (Camera.Eye)
    // Create a simple bounding box around the player
    var playerRadius = 0.1; // Player collision radius
    var playerBox = {
      min: [
        Camera.Eye[0] - playerRadius,
        Camera.Eye[1] - 0.2, // Some height for player
        Camera.Eye[2] - playerRadius
      ],
      max: [
        Camera.Eye[0] + playerRadius,
        Camera.Eye[1] + 0.2,
        Camera.Eye[2] + playerRadius
      ]
    };
    
    if (this.checkAABBOverlap(tankBox, playerBox)) {
      return true; // Collision detected with player
    }
    
    return false; // No collision
  },
  
  // Helper: Check if two AABBs overlap
  checkAABBOverlap: function(boxA, boxB) {
    return (
      boxA.min[0] <= boxB.max[0] && boxA.max[0] >= boxB.min[0] &&
      boxA.min[1] <= boxB.max[1] && boxA.max[1] >= boxB.min[1] &&
      boxA.min[2] <= boxB.max[2] && boxA.max[2] >= boxB.min[2]
    );
  },

  // Update tank positions to move forward
  updateTankMovement: function(deltaTime) {
    // Check if tanks are loaded
    if (this.tanksSetIndices.length === 0 || this.tankPositions.length === 0) {
      return;
    }
    
    // Default deltaTime if not provided
    if (deltaTime === undefined) {
      deltaTime = 0.016; // ~60fps fallback
    }
    
    // Update respawn timers
    this.updateTankRespawns(deltaTime);
    
    // Movement speed (adjusted for small scale)
    var moveSpeed = 0.00075; // Small movement per frame
    
    // Time threshold for rotation (5 seconds)
    var rotationThreshold = 5.0;
    
    for (var i = 0; i < this.tanksSetIndices.length; i++) {
      // Skip dead tanks
      if (this.tankDeadFlags[i]) {
        continue;
      }
      
      var setIdx = this.tanksSetIndices[i];
      var forwardDir = this.tankForwardDirections[i];
      
      // Update movement timer
      this.tankMovementTimers[i] += deltaTime;
      
      // Check if it's time to set a new rotation target (every 5 seconds)
      if (this.tankMovementTimers[i] >= rotationThreshold) {
        // Calculate direction to player (Camera.Eye)
        var toPlayer = [
          Camera.Eye[0] - this.tankPositions[i][0],
          0, // Ignore Y for horizontal rotation
          Camera.Eye[2] - this.tankPositions[i][2]
        ];
        
        // Normalize direction to player
        var toPlayerLen = Math.sqrt(toPlayer[0] * toPlayer[0] + toPlayer[2] * toPlayer[2]);
        if (toPlayerLen > 0) {
          toPlayer[0] /= toPlayerLen;
          toPlayer[2] /= toPlayerLen;
        }
        
        // Calculate angles using atan2
        // Initial forward angle (model's original facing direction)
        var initialAngle = Math.atan2(this.tankInitialForwardDirections[i][0], this.tankInitialForwardDirections[i][2]);
        // Current forward angle (current movement direction)
        var currentAngle = Math.atan2(forwardDir[0], forwardDir[2]);
        // Target angle (direction to player)
        var targetAngle = Math.atan2(toPlayer[0], toPlayer[2]);
        
        // Target rotation needed: from initial model orientation to target direction
        var targetRotationAngle = targetAngle - initialAngle;
        
        // Normalize angle to [-PI, PI]
        while (targetRotationAngle > Math.PI) targetRotationAngle -= 2 * Math.PI;
        while (targetRotationAngle < -Math.PI) targetRotationAngle += 2 * Math.PI;
        
        // Store the TARGET rotation angle (will gradually interpolate towards this)
        this.tankTargetRotationAngles[i] = targetRotationAngle;
        
        // Mark as has rotated at least once (for model matrix logic)
        this.tankRotatedToPlayer[i] = true;
        
        // Reset "has fired" flag so tank can fire again after completing this rotation
        this.tankHasFiredThisRotation[i] = false;
        
        // Reset timer for next rotation
        this.tankMovementTimers[i] = 0;
      }
      
      // Gradually rotate towards target (every frame)
      if (this.tankRotatedToPlayer[i]) {
        var currentRotation = this.tankRotationAngles[i];
        var targetRotation = this.tankTargetRotationAngles[i];
        
        // Calculate angle difference
        var angleDiff = targetRotation - currentRotation;
        
        // Normalize to [-PI, PI] for shortest path
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // Calculate rotation step for this frame
        var maxRotationStep = this.tankRotationSpeed * deltaTime;
        
        // Apply rotation (clamped to not overshoot)
        if (Math.abs(angleDiff) <= maxRotationStep) {
          // Close enough, snap to target
          this.tankRotationAngles[i] = targetRotation;
          
          // Fire enemy bullet when tank finishes rotating to face player
          // Only fire if game is playing and tank is alive
          if (!this.tankHasFiredThisRotation[i] && i < this.enemyBullets.length) {
            var canFire = typeof GameState === 'undefined' || GameState.isPlaying();
            if (canFire && !this.tankDeadFlags[i]) {
              var bullet = this.enemyBullets[i];
              if (bullet && bullet.fireFromTank(this.tankPositions[i], this.tankForwardDirections[i])) {
                this.tankHasFiredThisRotation[i] = true;
              }
            }
          }
        } else if (angleDiff > 0) {
          // Rotate counterclockwise (positive)
          this.tankRotationAngles[i] += maxRotationStep;
        } else {
          // Rotate clockwise (negative)
          this.tankRotationAngles[i] -= maxRotationStep;
        }
        
        // Normalize current rotation to [-PI, PI]
        while (this.tankRotationAngles[i] > Math.PI) this.tankRotationAngles[i] -= 2 * Math.PI;
        while (this.tankRotationAngles[i] < -Math.PI) this.tankRotationAngles[i] += 2 * Math.PI;
        
        // Update forward direction based on current rotation angle
        // Forward = initial forward rotated by current rotation angle
        var initialAngle = Math.atan2(this.tankInitialForwardDirections[i][0], this.tankInitialForwardDirections[i][2]);
        var newAngle = initialAngle + this.tankRotationAngles[i];
        this.tankForwardDirections[i] = [Math.sin(newAngle), 0, Math.cos(newAngle)];
      }
      
      // Calculate potential new position
      var newPosX = this.tankPositions[i][0] + forwardDir[0] * moveSpeed;
      var newPosZ = this.tankPositions[i][2] + forwardDir[2] * moveSpeed;
      
      // Check for collisions before moving
      if (!this.checkTankCollision(i, newPosX, newPosZ)) {
        // No collision - update position (only in XZ plane, keep Y constant)
        this.tankPositions[i][0] = newPosX;
        this.tankPositions[i][2] = newPosZ;
      }
      // If collision detected, tank simply doesn't move this frame
      
      // Update model matrix
      this.modelMat[setIdx] = mat4.create();
      
      // Only apply rotation if tank has rotated towards player
      if (this.tankRotatedToPlayer[i]) {
        // Build matrix: translate to position, rotate, then offset by avgPos
        // Order in gl-matrix (post-multiply): operations are applied right-to-left to vertex
        
        // Step 1: Translate to world position
        mat4.translate(this.modelMat[setIdx], this.modelMat[setIdx], [
          this.tankPositions[i][0],
          this.tankPositions[i][1],
          this.tankPositions[i][2]
        ]);
        
        // Step 2: Apply rotation around Y axis
        mat4.rotateY(this.modelMat[setIdx], this.modelMat[setIdx], this.tankRotationAngles[i]);
        
        // Step 3: Center the model (move avgPos to origin)
        mat4.translate(this.modelMat[setIdx], this.modelMat[setIdx], [
          -this.TriangleSetInfo[setIdx].avgPos[0],
          -this.TriangleSetInfo[setIdx].avgPos[1],
          -this.TriangleSetInfo[setIdx].avgPos[2]
        ]);
      } else {
        // No rotation - just translate (original behavior)
        // Translate to move avgPos to origin, then to current position
        this.translate(
          -this.TriangleSetInfo[setIdx].avgPos[0],
          -this.TriangleSetInfo[setIdx].avgPos[1],
          -this.TriangleSetInfo[setIdx].avgPos[2],
          setIdx
        );
        this.translate(
          this.tankPositions[i][0],
          this.tankPositions[i][1],
          this.tankPositions[i][2],
          setIdx
        );
      }
      
      // Update tank game object's position and bounding box for collision detection
      var tankObj = this.getGameObjectBySetIndex(setIdx);
      if (tankObj) {
        tankObj.position[0] = this.tankPositions[i][0];
        tankObj.position[1] = this.tankPositions[i][1];
        tankObj.position[2] = this.tankPositions[i][2];
        tankObj.updateWorldBoundingBox();
      }
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
    
  },

  // Update all game objects
  updateGameObjects: function(deltaTime) {
    for (var i = 0; i < this.gameObjects.length; i++) {
      if (this.gameObjects[i].active) {
        this.gameObjects[i].update(deltaTime);
      }
    }
  },

  // Get game object by set index
  getGameObjectBySetIndex: function(setIndex) {
    for (var i = 0; i < this.gameObjects.length; i++) {
      if (this.gameObjects[i].setIndex === setIndex) {
        return this.gameObjects[i];
      }
    }
    return null;
  },
  
  // Get tank index by set index
  getTankIndexBySetIndex: function(setIndex) {
    for (var i = 0; i < this.tanksSetIndices.length; i++) {
      if (this.tanksSetIndices[i] === setIndex) {
        return i;
      }
    }
    return -1;
  },
  
  // Schedule a tank to respawn after delay
  scheduleTankRespawn: function(tankIndex) {
    if (tankIndex < 0 || tankIndex >= this.tanksSetIndices.length) return;
    
    // Mark tank as dead
    this.tankDeadFlags[tankIndex] = true;
    this.tankRespawnTimers[tankIndex] = this.tankRespawnDelay;
    
    // Deactivate tank game object
    var setIdx = this.tanksSetIndices[tankIndex];
    var tankObj = this.getGameObjectBySetIndex(setIdx);
    if (tankObj) {
      tankObj.active = false;
      tankObj.collidable = false;
    }
    
  },
  
  // Update tank respawn timers (called each frame)
  updateTankRespawns: function(deltaTime) {
    for (var i = 0; i < this.tankDeadFlags.length; i++) {
      if (this.tankDeadFlags[i]) {
        this.tankRespawnTimers[i] -= deltaTime;
        if (this.tankRespawnTimers[i] <= 0) {
          this.respawnTank(i);
        }
      }
    }
  },
  
  // Respawn a single tank
  respawnTank: function(tankIndex) {
    if (tankIndex < 0 || tankIndex >= this.tanksSetIndices.length) return;
    
    var setIdx = this.tanksSetIndices[tankIndex];
    
    // Reset dead flag
    this.tankDeadFlags[tankIndex] = false;
    this.tankRespawnTimers[tankIndex] = 0;
    
    // Reset tank position to initial position
    this.tankPositions[tankIndex][0] = this.tankInitialPositions[tankIndex][0];
    this.tankPositions[tankIndex][1] = this.tankInitialPositions[tankIndex][1];
    this.tankPositions[tankIndex][2] = this.tankInitialPositions[tankIndex][2];
    
    // Reset rotation
    this.tankRotationAngles[tankIndex] = 0;
    this.tankTargetRotationAngles[tankIndex] = 0;
    this.tankRotatedToPlayer[tankIndex] = false;
    this.tankHasFiredThisRotation[tankIndex] = false;
    this.tankMovementTimers[tankIndex] = 0;
    
    // Reset forward direction to initial
    this.tankForwardDirections[tankIndex][0] = this.tankInitialForwardDirections[tankIndex][0];
    this.tankForwardDirections[tankIndex][1] = this.tankInitialForwardDirections[tankIndex][1];
    this.tankForwardDirections[tankIndex][2] = this.tankInitialForwardDirections[tankIndex][2];
    
    // Reactivate tank game object
    var tankObj = this.getGameObjectBySetIndex(setIdx);
    if (tankObj) {
      tankObj.active = true;
      tankObj.collidable = true;
      tankObj.position[0] = this.tankInitialPositions[tankIndex][0];
      tankObj.position[1] = this.tankInitialPositions[tankIndex][1];
      tankObj.position[2] = this.tankInitialPositions[tankIndex][2];
      tankObj.updateWorldBoundingBox();
    }
    
    // Reset model matrix
    this.modelMat[setIdx] = mat4.create();
    this.translate(
      -this.TriangleSetInfo[setIdx].avgPos[0],
      -this.TriangleSetInfo[setIdx].avgPos[1],
      -this.TriangleSetInfo[setIdx].avgPos[2],
      setIdx
    );
    this.translate(
      this.tankPositions[tankIndex][0],
      this.tankPositions[tankIndex][1],
      this.tankPositions[tankIndex][2],
      setIdx
    );
  },
  
  // Reset all tanks (called on game reset)
  resetAllTanks: function() {
    for (var i = 0; i < this.tanksSetIndices.length; i++) {
      // Force respawn even if not dead
      this.tankDeadFlags[i] = false;
      this.tankRespawnTimers[i] = 0;
      this.respawnTank(i);
    }
    
    // Reset enemy bullets associated with tanks
    for (var i = 0; i < this.enemyBullets.length; i++) {
      if (this.enemyBullets[i] && this.enemyBullets[i].completeReset) {
        this.enemyBullets[i].completeReset();
      }
    }
  },
  
  // Check if a specific tank is dead
  isTankDead: function(tankIndex) {
    if (tankIndex < 0 || tankIndex >= this.tankDeadFlags.length) return true;
    return this.tankDeadFlags[tankIndex];
  }
};

