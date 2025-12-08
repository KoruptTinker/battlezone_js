// Input handling for keyboard events

const Input = {
  // Initialize input handlers
  setupInput: function() {
    document.addEventListener('keydown', function (e) {
      var key = e.key;
      var keyLower = key.toLowerCase();
      
      if (keyLower === "d") {
        Camera.yaw(-0.03);
      } else if (keyLower === "a") {
        Camera.yaw(0.03);
      }
      else if (key === "ArrowLeft") {
        Camera.yaw(0.03);
      } else if (key === "ArrowRight") {
        Camera.yaw(-0.03);
      }
      // Forward/backward movement - W/S (case insensitive) and Up/Down arrows
      else if (key === "ArrowUp" || keyLower === "w") {
        // Move forward
        Camera.moveForward(0.015);
      } else if (key === "ArrowDown" || keyLower === "s") {
        // Move backward
        Camera.moveForward(-0.015);
      }
      // Up/down movement - Q/E (case insensitive)
      else if (keyLower === "q") {
        // Move down
        Camera.moveUp(-0.015);
      } else if (keyLower === "e") {
        // Move up
        Camera.moveUp(0.015);
      }
      // ESC key to reset
      else if (key === "Escape") {
        Camera.resetViewingCoordinates();
        Models.resetModels();
      }
    });
  }
};

