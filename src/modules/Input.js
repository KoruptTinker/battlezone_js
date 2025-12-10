// Input handling for keyboard events

const Input = {
  // Track which keys are currently pressed
  keys: {},
  
  // Movement speeds (per second)
  yawSpeed: 0.3,        // radians per second
  moveSpeed: 0.1,       // units per second
  verticalSpeed: 0.4,   // units per second
  
  // Initialize input handlers
  setupInput: function() {
    var self = this;
    
    document.addEventListener('keydown', function (e) {
      var key = e.key;
      var keyLower = key.toLowerCase();
      
      // Prevent default behavior for game keys
      if (keyLower === "w" || keyLower === "a" || keyLower === "s" || keyLower === "d" || 
          keyLower === "q" || keyLower === "e" || 
          key === "ArrowUp" || key === "ArrowDown" || 
          key === "ArrowLeft" || key === "ArrowRight") {
        e.preventDefault();
      }
      
      // Track key presses
      if (keyLower === "d" || key === "ArrowRight") {
        self.keys.yawRight = true;
      } else if (keyLower === "a" || key === "ArrowLeft") {
        self.keys.yawLeft = true;
      } else if (key === "ArrowUp" || keyLower === "w") {
        self.keys.moveForward = true;
      } else if (key === "ArrowDown" || keyLower === "s") {
        self.keys.moveBackward = true;
      } else if (keyLower === "q") {
        self.keys.moveDown = true;
      } else if (keyLower === "e") {
        self.keys.moveUp = true;
      } else if (key === " ") {
        self.keys.fire = true;
      } else if (key === "Escape") {
        // ESC key still handled immediately for reset
        Camera.resetViewingCoordinates();
        Models.resetModels();
      } else if (key === "!") {
        // Switch to scene_2 when pressing "!" (Shift+1)
        Models.switchScene("scene2");
      }
    });
    
    document.addEventListener('keyup', function (e) {
      var key = e.key;
      var keyLower = key.toLowerCase();
      
      // Release key presses
      if (keyLower === "d" || key === "ArrowRight") {
        self.keys.yawRight = false;
      } else if (keyLower === "a" || key === "ArrowLeft") {
        self.keys.yawLeft = false;
      } else if (key === "ArrowUp" || keyLower === "w") {
        self.keys.moveForward = false;
      } else if (key === "ArrowDown" || keyLower === "s") {
        self.keys.moveBackward = false;
      } else if (keyLower === "q") {
        self.keys.moveDown = false;
      } else if (keyLower === "e") {
        self.keys.moveUp = false;
      } else if (key === " ") {
        self.keys.fire = false;
      }
    });
    
    // Handle window blur to prevent stuck keys
    window.addEventListener('blur', function() {
      self.keys = {};
    });
  },
  
  // Update movement based on delta time
  update: function(deltaTime) {
    // Yaw rotation
    if (this.keys.yawRight) {
      Camera.yaw(-this.yawSpeed * deltaTime);
    }
    if (this.keys.yawLeft) {
      Camera.yaw(this.yawSpeed * deltaTime);
    }
    
    // Forward/backward movement
    if (this.keys.moveForward) {
      Camera.moveForward(this.moveSpeed * deltaTime);
    }
    if (this.keys.moveBackward) {
      Camera.moveForward(-this.moveSpeed * deltaTime);
    }
    
    // Vertical movement
    if (this.keys.moveUp) {
      Camera.moveUp(this.verticalSpeed * deltaTime);
    }
    if (this.keys.moveDown) {
      Camera.moveUp(-this.verticalSpeed * deltaTime);
    }
  }
};

