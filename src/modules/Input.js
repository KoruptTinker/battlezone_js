// Input handling for keyboard events

const Input = {
  // Initialize input handlers
  setupInput: function() {
    document.addEventListener('keydown', function (e) {
      var key = e.key;
      var keyLower = key.toLowerCase();
      
      // Z-axis rotation (roll) - Left/Right arrows and A/D (case insensitive)
      if (key === "ArrowLeft" || keyLower === "a") {
        // Roll: Rotate around world Z axis (negative)
        Camera.roll(-0.03);
      } else if (key === "ArrowRight" || keyLower === "d") {
        // Roll: Rotate around world Z axis (positive)
        Camera.roll(0.03);
      }
      // Forward/backward movement - W/S (case insensitive) and Up/Down arrows
      else if (key === "ArrowUp" || keyLower === "w") {
        // Move forward
        Camera.moveForward(0.015);
      } else if (key === "ArrowDown" || keyLower === "s") {
        // Move backward
        Camera.moveForward(-0.015);
      }
      // ESC key to reset
      else if (key === "Escape") {
        Camera.resetViewingCoordinates();
        Models.resetModels();
      }
    });
  }
};

