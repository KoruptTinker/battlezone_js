// Base class for all game objects (meshes) in the scene
// Provides common functionality like position, collision bounds, transformations

class GameObject {
  constructor(options = {}) {
    // Unique identifier
    this.id = options.id || GameObject.generateId();
    this.type = options.type || 'generic';
    this.textureName = options.textureName || '';
    
    // Triangle set index (reference to Models arrays)
    this.setIndex = options.setIndex !== undefined ? options.setIndex : -1;
    
    // Position (world space)
    this.position = options.position ? [...options.position] : [0, 0, 0];
    
    // Rotation (Euler angles in radians)
    this.rotation = options.rotation ? [...options.rotation] : [0, 0, 0];
    
    // Scale
    this.scale = options.scale ? [...options.scale] : [1, 1, 1];
    
    // Velocity for moving objects
    this.velocity = options.velocity ? [...options.velocity] : [0, 0, 0];
    
    // Forward direction (for tanks and other directional objects)
    this.forwardDirection = options.forwardDirection ? [...options.forwardDirection] : [0, 0, 1];
    
    // Original vertices (local space)
    this.vertices = options.vertices || [];
    
    // Average position (center of mesh in local space)
    this.avgPos = options.avgPos ? [...options.avgPos] : [0, 0, 0];
    
    // Model matrix
    this.modelMatrix = mat4.create();
    
    // Bounding box (Axis-Aligned Bounding Box - AABB)
    this.boundingBox = {
      min: [0, 0, 0],
      max: [0, 0, 0]
    };
    
    // Calculate initial bounding box if vertices provided
    if (this.vertices.length > 0) {
      this.calculateBoundingBox();
    }
    
    // Collision settings
    this.collidable = options.collidable !== undefined ? options.collidable : true;
    this.isStatic = options.isStatic !== undefined ? options.isStatic : true;
    
    // Active state
    this.active = true;
    
    // Collision callbacks (only set if explicitly provided, so subclass methods aren't shadowed)
    if (options.onCollision) {
      this.onCollision = options.onCollision;
    }
  }
  
  // Generate unique ID
  static generateId() {
    if (!GameObject._idCounter) {
      GameObject._idCounter = 0;
    }
    return 'obj_' + (GameObject._idCounter++);
  }
  
  // Calculate the axis-aligned bounding box from vertices
  calculateBoundingBox() {
    if (this.vertices.length === 0) return;
    
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    for (let i = 0; i < this.vertices.length; i++) {
      const v = this.vertices[i];
      if (v[0] < minX) minX = v[0];
      if (v[0] > maxX) maxX = v[0];
      if (v[1] < minY) minY = v[1];
      if (v[1] > maxY) maxY = v[1];
      if (v[2] < minZ) minZ = v[2];
      if (v[2] > maxZ) maxZ = v[2];
    }
    
    // Store local space bounding box
    this.localBoundingBox = {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ]
    };
    
    // Update world space bounding box
    this.updateWorldBoundingBox();
  }
  
  // Update world space bounding box based on position and scale
  updateWorldBoundingBox() {
    if (!this.localBoundingBox) return;
    
    // Transform local bounding box to world space
    // For simplicity, we offset by position and scale
    const offset = [
      this.position[0] - this.avgPos[0],
      this.position[1] - this.avgPos[1],
      this.position[2] - this.avgPos[2]
    ];
    
    this.boundingBox.min = [
      this.localBoundingBox.min[0] + offset[0],
      this.localBoundingBox.min[1] + offset[1],
      this.localBoundingBox.min[2] + offset[2]
    ];
    
    this.boundingBox.max = [
      this.localBoundingBox.max[0] + offset[0],
      this.localBoundingBox.max[1] + offset[1],
      this.localBoundingBox.max[2] + offset[2]
    ];
  }
  
  // Get the center of the bounding box
  getBoundingBoxCenter() {
    return [
      (this.boundingBox.min[0] + this.boundingBox.max[0]) / 2,
      (this.boundingBox.min[1] + this.boundingBox.max[1]) / 2,
      (this.boundingBox.min[2] + this.boundingBox.max[2]) / 2
    ];
  }
  
  // Get bounding box dimensions
  getBoundingBoxSize() {
    return [
      this.boundingBox.max[0] - this.boundingBox.min[0],
      this.boundingBox.max[1] - this.boundingBox.min[1],
      this.boundingBox.max[2] - this.boundingBox.min[2]
    ];
  }
  
  // Update model matrix based on position, rotation, scale
  // Matrix operations are post-multiplied in gl-matrix, so we need to apply
  // transformations in reverse order to get: T(position) * R * S * T(-avgPos)
  updateModelMatrix() {
    this.modelMatrix = mat4.create();
    
    // 1. First: translate to world position
    mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
    
    // 2. Apply rotation (YXZ order for typical FPS-style rotation)
    mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotation[1]);
    mat4.rotateX(this.modelMatrix, this.modelMatrix, this.rotation[0]);
    mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.rotation[2]);
    
    // 3. Apply scale
    mat4.scale(this.modelMatrix, this.modelMatrix, this.scale);
    
    // 4. Last: translate to move center to origin (applied first to vertex)
    mat4.translate(this.modelMatrix, this.modelMatrix, [
      -this.avgPos[0],
      -this.avgPos[1],
      -this.avgPos[2]
    ]);
    
    // Update world bounding box
    this.updateWorldBoundingBox();
    
    // Sync with Models array
    if (this.setIndex >= 0 && Models.modelMat[this.setIndex]) {
      Models.modelMat[this.setIndex] = this.modelMatrix;
    }
  }
  
  // Set position
  setPosition(x, y, z) {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
    this.updateModelMatrix();
  }
  
  // Translate by offset
  translate(dx, dy, dz) {
    this.position[0] += dx;
    this.position[1] += dy;
    this.position[2] += dz;
    this.updateModelMatrix();
  }
  
  // Set rotation
  setRotation(rx, ry, rz) {
    this.rotation[0] = rx;
    this.rotation[1] = ry;
    this.rotation[2] = rz;
    this.updateModelMatrix();
  }
  
  // Rotate by delta angles
  rotate(drx, dry, drz) {
    this.rotation[0] += drx;
    this.rotation[1] += dry;
    this.rotation[2] += drz;
    this.updateModelMatrix();
  }
  
  // Set scale
  setScale(sx, sy, sz) {
    if (sy === undefined) {
      // Uniform scale
      this.scale = [sx, sx, sx];
    } else {
      this.scale = [sx, sy, sz];
    }
    this.updateModelMatrix();
  }
  
  // Update method called each frame
  update(deltaTime) {
    // Apply velocity
    if (this.velocity[0] !== 0 || this.velocity[1] !== 0 || this.velocity[2] !== 0) {
      this.translate(
        this.velocity[0] * deltaTime,
        this.velocity[1] * deltaTime,
        this.velocity[2] * deltaTime
      );
    }
  }
  
  // Called when collision occurs with another object
  handleCollision(other, collisionInfo) {
    if (this.onCollision) {
      this.onCollision(other, collisionInfo);
    }
  }
  
  // Destroy this object
  destroy() {
    this.active = false;
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.GameObject = GameObject;
}

