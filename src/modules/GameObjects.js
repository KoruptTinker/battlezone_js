
class Bullet extends GameObject {
  constructor(options = {}) {
    super(options);
    this.speed = options.speed || 1.0; // Units per second
    this.fired = false;
    this.direction = [0, 0, 1];
    
    // Set initial position to the object's average position (original scene location)
    // so it starts "with the mountains" (assuming scene placement is correct)
    this.position = [...this.avgPos];
    
    // Store initial scene position for "move with mountains" logic
    this.initialScenePos = [...this.avgPos];
    
    // Disable collision when not fired
    this.collidable = false;

    // Reset delay logic
    this.isResetting = false;
    this.resetTimer = 0;
    this.resetDuration = 1.0; // 1 second delay before full reset
    
    // Flight time logic
    this.timeSinceFired = 0;
  }

  update(deltaTime) {
    // Handle reset timer state (waiting period after collision/boundary)
    if (this.isResetting) {
      this.resetTimer -= deltaTime;
      if (this.resetTimer <= 0) {
        this.completeReset();
      }
      // Don't move or process other logic while resetting
      // But update bounding box just in case (though position is static)
      this.updateWorldBoundingBox();
      return;
    }

    if (!this.fired) {
      // Hidden state: Move with mountains (relative to camera initial position)
      if (Models.initialCameraEye) {
        // Calculate translation delta from initial camera position
        const deltaX = Camera.Eye[0] - Models.initialCameraEye[0];
        const deltaY = Camera.Eye[1] - Models.initialCameraEye[1];
        const deltaZ = Camera.Eye[2] - Models.initialCameraEye[2];
        
        // Update position to maintain relative offset from initial scene position
        this.position[0] = this.initialScenePos[0] + deltaX;
        this.position[1] = this.initialScenePos[1] + deltaY;
        this.position[2] = this.initialScenePos[2] + deltaZ;
        
        this.updateModelMatrix();
      }
      
      // Check for fire input
      if (Input.keys.fire) {
        this.fire();
      }
    } else {
      // Fired state: Move along direction
      this.timeSinceFired += deltaTime;
      
      this.translate(
        this.direction[0] * this.speed * deltaTime,
        this.direction[1] * this.speed * deltaTime,
        this.direction[2] * this.speed * deltaTime
      );
      
      // Check limits (time)
      this.checkLimits();
    }
    
    // Update bounding box for collision detection
    this.updateWorldBoundingBox();
  }

  fire() {
    this.fired = true;
    this.collidable = true;
    this.active = true;
    this.isResetting = false;
    this.timeSinceFired = 0;
    
    // Move to center of screen (Camera Eye)
    // We place it slightly in front of the camera to avoid clipping
    const eye = Camera.Eye;
    const target = Camera.Target;
    
    // Calculate forward vector
    const forward = [
      target[0] - eye[0],
      target[1] - eye[1],
      target[2] - eye[2]
    ];
    vec3.normalize(forward, forward);
    
    // Set direction
    this.direction = [...forward];
    
    // Set position to camera eye + slight forward offset
    const offsetDist = 0.5;
    this.position[0] = eye[0] + forward[0] * offsetDist;
    this.position[1] = eye[1] + forward[1] * offsetDist;
    this.position[2] = eye[2] + forward[2] * offsetDist;
    
    this.updateModelMatrix();
    console.log("Bullet fired!");
  }

  // Helper to start the reset timer
  startReset() {
    if (this.isResetting) return;
    this.isResetting = true;
    this.resetTimer = this.resetDuration;
    this.collidable = false; // Disable collision immediately so it doesn't hit multiple things
  }

  // Actual reset logic after timer expires
  completeReset() {
    this.fired = false;
    this.isResetting = false;
    this.collidable = false;
    // Position will be reset to "mountain relative" in next update() call via the !fired block
  }

  reset() {
    this.startReset();
  }

  checkLimits() {
    // Reset after 1 second of flight
    if (this.timeSinceFired >= 1.0) {
        this.reset();
    }
  }

  onCollision(other, info) {
    if (this.fired && !this.isResetting) {
      console.log("Bullet hit " + other.type);
      // Reset on hitting any collidable object (including mountains)
      if (other.type === 'house' || other.type === 'tank' || other.type === 'mountain') {
         this.reset();
      }
    }
  }
}

// Enemy bullet class - fired by enemy tanks
class EnemyBullet extends GameObject {
  constructor(options = {}) {
    super(options);
    this.speed = options.speed || 0.8; // Slightly slower than player bullet
    this.fired = false;
    this.direction = [0, 0, 1];
    
    // Set initial position to the object's average position
    this.position = [...this.avgPos];
    
    // Store initial scene position for hiding when not fired
    this.initialScenePos = [...this.avgPos];
    
    // Disable collision when not fired
    this.collidable = false;

    // Reset delay logic
    this.isResetting = false;
    this.resetTimer = 0;
    this.resetDuration = 1.0; // 1 second delay before can fire again
    
    // Flight time logic
    this.timeSinceFired = 0;
    
    // Reference to owning tank (tank index)
    this.ownerTankIndex = options.ownerTankIndex !== undefined ? options.ownerTankIndex : -1;
  }

  update(deltaTime) {
    // Handle reset timer state (waiting period after collision/boundary)
    if (this.isResetting) {
      this.resetTimer -= deltaTime;
      if (this.resetTimer <= 0) {
        this.completeReset();
      }
      this.updateWorldBoundingBox();
      return;
    }

    if (!this.fired) {
      // Hidden state: Move with mountains (relative to camera initial position)
      if (Models.initialCameraEye) {
        const deltaX = Camera.Eye[0] - Models.initialCameraEye[0];
        const deltaY = Camera.Eye[1] - Models.initialCameraEye[1];
        const deltaZ = Camera.Eye[2] - Models.initialCameraEye[2];
        
        this.position[0] = this.initialScenePos[0] + deltaX;
        this.position[1] = this.initialScenePos[1] + deltaY;
        this.position[2] = this.initialScenePos[2] + deltaZ;
        
        this.updateModelMatrix();
      }
    } else {
      // Fired state: Move along direction
      this.timeSinceFired += deltaTime;
      
      this.translate(
        this.direction[0] * this.speed * deltaTime,
        this.direction[1] * this.speed * deltaTime,
        this.direction[2] * this.speed * deltaTime
      );
      
      // Check limits (time)
      this.checkLimits();
    }
    
    this.updateWorldBoundingBox();
  }

  // Fire from a specific tank position towards the player
  fireFromTank(tankPosition, tankForwardDirection) {
    if (this.fired || this.isResetting) return false; // Can't fire if already fired or resetting
    
    this.fired = true;
    this.collidable = true;
    this.active = true;
    this.isResetting = false;
    this.timeSinceFired = 0;
    
    // Set direction towards player (Camera.Eye)
    const toPlayer = [
      Camera.Eye[0] - tankPosition[0],
      0, // Keep bullet level (no vertical component)
      Camera.Eye[2] - tankPosition[2]
    ];
    
    // Normalize direction
    const len = Math.sqrt(toPlayer[0] * toPlayer[0] + toPlayer[2] * toPlayer[2]);
    if (len > 0) {
      toPlayer[0] /= len;
      toPlayer[2] /= len;
    } else {
      // Fallback to tank forward direction
      toPlayer[0] = tankForwardDirection[0];
      toPlayer[2] = tankForwardDirection[2];
    }
    
    this.direction = [toPlayer[0], 0, toPlayer[2]];
    
    // Set position slightly in front of tank
    const offsetDist = 0.1;
    this.position[0] = tankPosition[0] + this.direction[0] * offsetDist;
    this.position[1] = tankPosition[1]; // Same height as tank
    this.position[2] = tankPosition[2] + this.direction[2] * offsetDist;
    
    this.updateModelMatrix();
    console.log("Enemy bullet fired from tank " + this.ownerTankIndex + "!");
    return true;
  }

  startReset() {
    if (this.isResetting) return;
    this.isResetting = true;
    this.resetTimer = this.resetDuration;
    this.collidable = false;
  }

  completeReset() {
    this.fired = false;
    this.isResetting = false;
    this.collidable = false;
  }

  reset() {
    this.startReset();
  }

  checkLimits() {
    // Reset after 1.5 seconds of flight (slightly longer than player bullet)
    if (this.timeSinceFired >= 1.5) {
      this.reset();
    }
  }

  onCollision(other, info) {
    if (this.fired && !this.isResetting) {
      console.log("Enemy bullet hit " + other.type);
      // Reset on hitting objects (but not other enemy bullets or the owning tank)
      if (other.type === 'house' || other.type === 'mountain' || other.type === 'player_bullet') {
        this.reset();
      }
    }
  }
}

// Export
if (typeof window !== 'undefined') {
  window.Bullet = Bullet;
  window.EnemyBullet = EnemyBullet;
}
