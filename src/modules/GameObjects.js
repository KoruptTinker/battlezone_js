// Specific game object subclasses with custom behaviors

// ============================================
// TANK - Enemy tank that moves and can be destroyed
// ============================================
class Tank extends GameObject {
  constructor(options = {}) {
    super(options);
    this.type = 'tank';
    this.isStatic = false;
    
    // Tank-specific properties
    this.health = options.health || 100;
    this.maxHealth = this.health;
    this.moveSpeed = options.moveSpeed || 0.05;
    this.rotationSpeed = options.rotationSpeed || 0.5;
    this.isDestroyed = false;
    
    // AI state
    this.aiState = 'patrol'; // 'patrol', 'chase', 'attack', 'idle'
    this.targetPosition = null;
    this.patrolPoints = options.patrolPoints || [];
    this.currentPatrolIndex = 0;
    
    // Calculate and store forward direction from vertices
    if (this.vertices.length > 0) {
      this.calculateForwardDirection();
    }
  }
  
  // Calculate forward direction based on mesh geometry
  calculateForwardDirection() {
    if (this.vertices.length === 0) {
      this.forwardDirection = [0, 0, 1];
      return;
    }
    
    // Calculate centroid
    const centroid = [0, 0, 0];
    for (let i = 0; i < this.vertices.length; i++) {
      centroid[0] += this.vertices[i][0];
      centroid[1] += this.vertices[i][1];
      centroid[2] += this.vertices[i][2];
    }
    centroid[0] /= this.vertices.length;
    centroid[1] /= this.vertices.length;
    centroid[2] /= this.vertices.length;
    
    // Find min/max for each axis
    let minX = this.vertices[0][0], maxX = this.vertices[0][0];
    let minY = this.vertices[0][1], maxY = this.vertices[0][1];
    let minZ = this.vertices[0][2], maxZ = this.vertices[0][2];
    
    for (let i = 1; i < this.vertices.length; i++) {
      const v = this.vertices[i];
      if (v[0] < minX) minX = v[0];
      if (v[0] > maxX) maxX = v[0];
      if (v[1] < minY) minY = v[1];
      if (v[1] > maxY) maxY = v[1];
      if (v[2] < minZ) minZ = v[2];
      if (v[2] > maxZ) maxZ = v[2];
    }
    
    // Determine longest axis
    const extentX = maxX - minX;
    const extentY = maxY - minY;
    const extentZ = maxZ - minZ;
    
    let forward;
    if (extentX >= extentY && extentX >= extentZ) {
      forward = [1, 0, 0];
    } else if (extentZ >= extentX && extentZ >= extentY) {
      forward = [0, 0, 1];
    } else {
      forward = [0, 0, 1];
    }
    
    // Project onto XZ plane
    forward[1] = 0;
    const len = Math.sqrt(forward[0] * forward[0] + forward[2] * forward[2]);
    if (len > 0) {
      forward[0] /= len;
      forward[2] /= len;
    }
    
    this.forwardDirection = forward;
  }
  
  // Move forward in the tank's facing direction
  moveForward(deltaTime) {
    const moveAmount = this.moveSpeed * deltaTime;
    this.translate(
      this.forwardDirection[0] * moveAmount,
      0, // Keep Y constant
      this.forwardDirection[2] * moveAmount
    );
  }
  
  // Turn the tank
  turn(angle) {
    // Rotate forward direction
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const newX = this.forwardDirection[0] * cos - this.forwardDirection[2] * sin;
    const newZ = this.forwardDirection[0] * sin + this.forwardDirection[2] * cos;
    this.forwardDirection[0] = newX;
    this.forwardDirection[2] = newZ;
    
    // Update rotation
    this.rotation[1] += angle;
    this.updateModelMatrix();
  }
  
  // Take damage
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.onDestroyed();
    }
  }
  
  // Called when tank is destroyed
  onDestroyed() {
    this.isDestroyed = true;
    this.aiState = 'idle';
    console.log(`Tank ${this.id} destroyed!`);
    // Could trigger explosion effect, etc.
  }
  
  // Update tank AI and movement
  update(deltaTime) {
    if (this.isDestroyed) return;
    
    switch (this.aiState) {
      case 'patrol':
        this.updatePatrol(deltaTime);
        break;
      case 'chase':
        this.updateChase(deltaTime);
        break;
      case 'attack':
        this.updateAttack(deltaTime);
        break;
      case 'idle':
      default:
        // Do nothing
        break;
    }
    
    // Call parent update
    super.update(deltaTime);
  }
  
  updatePatrol(deltaTime) {
    // Simple forward movement for now
    this.moveForward(deltaTime);
  }
  
  updateChase(deltaTime) {
    // TODO: Implement chase behavior
    if (this.targetPosition) {
      // Turn towards target
      // Move towards target
    }
  }
  
  updateAttack(deltaTime) {
    // TODO: Implement attack behavior
  }
  
  // Handle collision with other objects
  handleCollision(other, collisionInfo) {
    super.handleCollision(other, collisionInfo);
    
    if (other.type === 'tank') {
      // Tank-tank collision: stop or reverse
      console.log(`Tank ${this.id} collided with Tank ${other.id}`);
      // Reverse a bit
      this.translate(
        -this.forwardDirection[0] * 0.1,
        0,
        -this.forwardDirection[2] * 0.1
      );
    } else if (other.type === 'mountain' || other.type === 'house') {
      // Obstacle collision: stop and maybe turn
      console.log(`Tank ${this.id} collided with ${other.type}`);
      // Reverse and turn
      this.translate(
        -this.forwardDirection[0] * 0.05,
        0,
        -this.forwardDirection[2] * 0.05
      );
      this.turn(Math.PI / 4); // Turn 45 degrees
    } else if (other.type === 'player') {
      // Hit player
      console.log(`Tank ${this.id} collided with player!`);
    }
  }
}

// ============================================
// MOUNTAIN - Static background scenery (ghost entity - no collisions)
// ============================================
class Mountain extends GameObject {
  constructor(options = {}) {
    super(options);
    this.type = 'mountain';
    this.isStatic = true;
    // Mountains are ghost entities - no collisions (purely background)
    this.collidable = false;
    
    // Mountains follow camera for infinite background effect
    this.followsCamera = options.followsCamera !== undefined ? options.followsCamera : true;
    this.initialCameraOffset = null;
  }
  
  // Set initial camera position for following
  setInitialCameraPosition(cameraPos) {
    this.initialCameraOffset = [
      this.position[0] - cameraPos[0],
      this.position[1] - cameraPos[1],
      this.position[2] - cameraPos[2]
    ];
  }
  
  // Update mountain to follow camera
  update(deltaTime) {
    if (this.followsCamera && this.initialCameraOffset) {
      // Move with camera
      this.setPosition(
        Camera.Eye[0] + this.initialCameraOffset[0],
        Camera.Eye[1] + this.initialCameraOffset[1],
        Camera.Eye[2] + this.initialCameraOffset[2]
      );
    }
    
    super.update(deltaTime);
  }
  
  // Handle collision
  handleCollision(other, collisionInfo) {
    super.handleCollision(other, collisionInfo);
    //
  }
}

// ============================================
// HOUSE - Static obstacle/structure
// ============================================
class House extends GameObject {
  constructor(options = {}) {
    super(options);
    this.type = 'house';
    this.isStatic = true;
    this.collidable = true;
    
    // House properties
    this.isDestructible = options.isDestructible || false;
    this.health = options.health || 200;
  }
  
  // Take damage (if destructible)
  takeDamage(amount) {
    if (!this.isDestructible) return;
    
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.onDestroyed();
    }
  }
  
  onDestroyed() {
    console.log(`House ${this.id} destroyed!`);
    this.active = false;
  }
  
  // Handle collision
  handleCollision(other, collisionInfo) {
    super.handleCollision(other, collisionInfo);
    
    // Houses are solid obstacles
    if (other.type === 'tank') {
      console.log(`House blocking tank ${other.id}`);
    } else if (other.type === 'player') {
      console.log('Player hit house');
    }
  }
}

// ============================================
// PLAYER - Represents the player (camera)
// ============================================
class Player extends GameObject {
  constructor(options = {}) {
    super(options);
    this.type = 'player';
    this.isStatic = false;
    this.collidable = true;
    
    // Player properties
    this.health = options.health || 100;
    this.maxHealth = this.health;
    this.score = 0;
    
    // Player bounding box size (since player is camera, we define a box around it)
    this.playerSize = options.playerSize || [0.2, 0.3, 0.2]; // Width, height, depth
  }
  
  // Update player position from camera
  updateFromCamera() {
    this.position = [Camera.Eye[0], Camera.Eye[1], Camera.Eye[2]];
    
    // Update bounding box based on camera position
    const halfSize = [
      this.playerSize[0] / 2,
      this.playerSize[1] / 2,
      this.playerSize[2] / 2
    ];
    
    this.boundingBox.min = [
      this.position[0] - halfSize[0],
      this.position[1] - halfSize[1],
      this.position[2] - halfSize[2]
    ];
    
    this.boundingBox.max = [
      this.position[0] + halfSize[0],
      this.position[1] + halfSize[1],
      this.position[2] + halfSize[2]
    ];
  }
  
  // Take damage
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.onDeath();
    }
    console.log(`Player took ${amount} damage. Health: ${this.health}`);
  }
  
  onDeath() {
    console.log('Player died!');
    // Could trigger game over, respawn, etc.
  }
  
  // Add score
  addScore(points) {
    this.score += points;
    console.log(`Score: ${this.score}`);
  }
  
  // Handle collision
  handleCollision(other, collisionInfo) {
    super.handleCollision(other, collisionInfo);
  }
  
  update(deltaTime) {
    this.updateFromCamera();
    super.update(deltaTime);
  }
}

// ============================================
// PROJECTILE - Bullets/missiles
// ============================================
class Projectile extends GameObject {
  constructor(options = {}) {
    super(options);
    this.type = 'projectile';
    this.isStatic = false;
    this.collidable = true;
    
    // Projectile properties
    this.damage = options.damage || 50;
    this.speed = options.speed || 2.0;
    this.lifetime = options.lifetime || 5.0; // Seconds before auto-destroy
    this.owner = options.owner || null; // Who fired this projectile
    
    // Set velocity based on direction and speed
    if (this.forwardDirection) {
      this.velocity = [
        this.forwardDirection[0] * this.speed,
        this.forwardDirection[1] * this.speed,
        this.forwardDirection[2] * this.speed
      ];
    }
  }
  
  update(deltaTime) {
    // Decrease lifetime
    this.lifetime -= deltaTime;
    if (this.lifetime <= 0) {
      this.destroy();
      return;
    }
    
    super.update(deltaTime);
  }
  
  // Handle collision
  handleCollision(other, collisionInfo) {
    super.handleCollision(other, collisionInfo);
    
    // Don't hit the owner
    if (other === this.owner) return;
    
    // Deal damage to damageable objects
    if (other.type === 'tank' || other.type === 'player' || other.type === 'house') {
      if (typeof other.takeDamage === 'function') {
        other.takeDamage(this.damage);
      }
      console.log(`Projectile hit ${other.type} for ${this.damage} damage`);
    }
    
    // Destroy projectile on impact
    this.destroy();
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.Tank = Tank;
  window.Mountain = Mountain;
  window.House = House;
  window.Player = Player;
  window.Projectile = Projectile;
}

