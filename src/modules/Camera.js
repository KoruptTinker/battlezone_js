// Camera and viewing system

const Camera = {
  Eye: vec4.fromValues(-0.1899997740983963, 0.14000022411346436, 0.009999780915677547, 1.0),
  ViewUp: vec4.fromValues(0.0, 1.0, 0.0, 1.0),
  Target: [-0.19000000000000034, 1.1087153218475436, 0.2581752325680496],
  distanceFromScreen: 0.5,
  yawAngle: 0,
  pitchAngle: 1.320000000000001,
  rollAngle: 0,
  
  // Calculate angles based on Eye and Target positions
  updateAngles: function() {
    var dx = this.Target[0] - this.Eye[0];
    var dy = this.Target[1] - this.Eye[1];
    var dz = this.Target[2] - this.Eye[2];
    this.yawAngle = Math.atan2(dx, dz);
    this.pitchAngle = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));

    // Derive roll from current ViewUp relative to forward/world up
    var forward = vec3.fromValues(dx, dy, dz);
    vec3.normalize(forward, forward);

    var worldUp = vec3.fromValues(0, 1, 0);
    var right = vec3.create();
    vec3.cross(right, forward, worldUp);

    // Handle near-singular when looking straight up/down
    if (vec3.length(right) < 1e-6) {
      worldUp = vec3.fromValues(1, 0, 0);
      vec3.cross(right, forward, worldUp);
    }
    vec3.normalize(right, right);

    var upRef = vec3.create();
    vec3.cross(upRef, right, forward);
    vec3.normalize(upRef, upRef);

    var viewUp = vec3.fromValues(this.ViewUp[0], this.ViewUp[1], this.ViewUp[2]);
    vec3.normalize(viewUp, viewUp);
    var dotUp = vec3.dot(viewUp, upRef);
    var dotRight = vec3.dot(viewUp, right);
    this.rollAngle = Math.atan2(dotRight, dotUp);
  },

  // Align ViewUp with current roll, keeping it orthonormal to forward
  alignViewUpWithRoll: function() {
    var forward = vec3.fromValues(
      this.Target[0] - this.Eye[0],
      this.Target[1] - this.Eye[1],
      this.Target[2] - this.Eye[2]
    );
    vec3.normalize(forward, forward);

    var worldUp = vec3.fromValues(0, 1, 0);
    var right = vec3.create();
    vec3.cross(right, forward, worldUp);

    if (vec3.length(right) < 1e-6) {
      worldUp = vec3.fromValues(1, 0, 0);
      vec3.cross(right, forward, worldUp);
    }
    vec3.normalize(right, right);

    var upRef = vec3.create();
    vec3.cross(upRef, right, forward);
    vec3.normalize(upRef, upRef);

    var cosR = Math.cos(this.rollAngle);
    var sinR = Math.sin(this.rollAngle);
    var rolledUp = vec3.create();
    vec3.scale(rolledUp, upRef, cosR);
    vec3.scaleAndAdd(rolledUp, rolledUp, right, sinR);
    vec3.normalize(rolledUp, rolledUp);

    this.ViewUp[0] = rolledUp[0];
    this.ViewUp[1] = rolledUp[1];
    this.ViewUp[2] = rolledUp[2];
  },

  // Apply a roll delta (rotation about forward/Z axis)
  roll: function(delta) {
    this.rollAngle += delta;
    this.alignViewUpWithRoll();
    this.updateViewingCoordinatesDisplay();
  },
  
  // Update viewing coordinates from webpage inputs
  updateViewingCoordinates: function() {
    var eyeX = document.getElementById("eyeX");
    var eyeY = document.getElementById("eyeY");
    var eyeZ = document.getElementById("eyeZ");
    var targetX = document.getElementById("targetX");
    var targetY = document.getElementById("targetY");
    var targetZ = document.getElementById("targetZ");
    var viewUpX = document.getElementById("viewUpX");
    var viewUpY = document.getElementById("viewUpY");
    var viewUpZ = document.getElementById("viewUpZ");
    
    if (!eyeX || !eyeY || !eyeZ) return;
    
    this.Eye[0] = parseFloat(eyeX.value);
    this.Eye[1] = parseFloat(eyeY.value);
    this.Eye[2] = parseFloat(eyeZ.value);
    
    this.Target[0] = parseFloat(targetX.value);
    this.Target[1] = parseFloat(targetY.value);
    this.Target[2] = parseFloat(targetZ.value);
    
    this.ViewUp[0] = parseFloat(viewUpX.value);
    this.ViewUp[1] = parseFloat(viewUpY.value);
    this.ViewUp[2] = parseFloat(viewUpZ.value);
    
    this.updateAngles();
    this.updateViewingCoordinatesDisplay();
    
    console.log("View updated - Eye:", this.Eye, "Target:", this.Target, "ViewUp:", this.ViewUp);
  },
  
  // Update the display of current viewing coordinates
  updateViewingCoordinatesDisplay: function() {
    var currentEye = document.getElementById("currentEye");
    var currentTarget = document.getElementById("currentTarget");
    var currentViewUp = document.getElementById("currentViewUp");
    
    if (currentEye) {
      currentEye.textContent = 
        `X: ${this.Eye[0].toFixed(3)}, Y: ${this.Eye[1].toFixed(3)}, Z: ${this.Eye[2].toFixed(3)}`;
    }
    
    if (currentTarget) {
      currentTarget.textContent = 
        `X: ${this.Target[0].toFixed(3)}, Y: ${this.Target[1].toFixed(3)}, Z: ${this.Target[2].toFixed(3)}`;
    }
    
    if (currentViewUp) {
      currentViewUp.textContent = 
        `X: ${this.ViewUp[0].toFixed(3)}, Y: ${this.ViewUp[1].toFixed(3)}, Z: ${this.ViewUp[2].toFixed(3)}`;
    }
  },
  
  // Reset viewing coordinates to default values
  resetViewingCoordinates: function() {
    this.Eye[0] = -0.1899997740983963;
    this.Eye[1] = 0.14000022411346436;
    this.Eye[2] = 0.009999780915677547;
    
    this.Target[0] = -0.19000000000000034;
    this.Target[1] = 1.1087153218475436;
    this.Target[2] = 0.2581752325680496;
    
    this.ViewUp[0] = 0.0;
    this.ViewUp[1] = 1.0;
    this.ViewUp[2] = 0.0;
    this.rollAngle = 0;
    
    this.updateAngles();
    this.alignViewUpWithRoll();
    this.updateViewingCoordinatesDisplay();
    
    var eyeX = document.getElementById("eyeX");
    var eyeY = document.getElementById("eyeY");
    var eyeZ = document.getElementById("eyeZ");
    var targetX = document.getElementById("targetX");
    var targetY = document.getElementById("targetY");
    var targetZ = document.getElementById("targetZ");
    var viewUpX = document.getElementById("viewUpX");
    var viewUpY = document.getElementById("viewUpY");
    var viewUpZ = document.getElementById("viewUpZ");
    
    if (eyeX) eyeX.value = this.Eye[0];
    if (eyeY) eyeY.value = this.Eye[1];
    if (eyeZ) eyeZ.value = this.Eye[2];
    if (targetX) targetX.value = this.Target[0];
    if (targetY) targetY.value = this.Target[1];
    if (targetZ) targetZ.value = this.Target[2];
    if (viewUpX) viewUpX.value = this.ViewUp[0];
    if (viewUpY) viewUpY.value = this.ViewUp[1];
    if (viewUpZ) viewUpZ.value = this.ViewUp[2];
    
    console.log("View reset to default values");
  }
};

