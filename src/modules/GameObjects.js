
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
      // Check if we hit an enemy tank (type can be 'tank' or 'enemy_tank' depending on scene.json)
      if (other.type === 'tank' || other.type === 'enemy_tank') {
        // Play explosion sound
        if (typeof SoundManager !== 'undefined') {
          SoundManager.playExplosion();
        }
        // Find the tank index and destroy it
        var tankIndex = Models.getTankIndexBySetIndex(other.setIndex);
        if (tankIndex >= 0 && GameState.isPlaying()) {
          GameState.onTankDestroyed(tankIndex);
        }
        this.reset();
      }
      // Reset on hitting any other collidable object (houses/buildings)
      else if (other.type === 'house') {
        // Play explosion miss sound
        if (typeof SoundManager !== 'undefined') {
          SoundManager.playExplosionMiss();
        }
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
      // Reset on hitting objects (but not other enemy bullets or the owning tank)
      if (other.type === 'house' || other.type === 'player_bullet') {
        this.reset();
      }
    }
  }
  
  // Check if this bullet hits the player (called separately from object collision)
  checkPlayerHit() {
    if (!this.fired || this.isResetting) return false;
    
    // Player collision box around Camera.Eye
    var playerRadius = 0.15;
    var playerBox = {
      min: [
        Camera.Eye[0] - playerRadius,
        Camera.Eye[1] - 0.2,
        Camera.Eye[2] - playerRadius
      ],
      max: [
        Camera.Eye[0] + playerRadius,
        Camera.Eye[1] + 0.2,
        Camera.Eye[2] + playerRadius
      ]
    };
    
    // Check if bullet bounding box overlaps with player
    var bulletBox = this.boundingBox;
    var hit = (
      bulletBox.min[0] <= playerBox.max[0] && bulletBox.max[0] >= playerBox.min[0] &&
      bulletBox.min[1] <= playerBox.max[1] && bulletBox.max[1] >= playerBox.min[1] &&
      bulletBox.min[2] <= playerBox.max[2] && bulletBox.max[2] >= playerBox.min[2]
    );
    
    if (hit) {
      this.reset();
      return true;
    }
    
    return false;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.Bullet = Bullet;
  window.EnemyBullet = EnemyBullet;
}
