// Camera and viewing system

const Camera = {
  Eye: vec4.fromValues(0.5, 0.5, -0.5, 1.0),
  ViewUp: vec4.fromValues(0.0, 1.0, 0.0, 1.0),
  Target: [0.5, 0.5, 0],
  distanceFromScreen: 0.5,
  yawAngle: 0,
  pitchAngle: 0,
  
  // Calculate angles based on Eye and Target positions
  updateAngles: function() {
    var dx = this.Target[0] - this.Eye[0];
    var dy = this.Target[1] - this.Eye[1];
    var dz = this.Target[2] - this.Eye[2];
    this.yawAngle = Math.atan2(dx, dz);
    this.pitchAngle = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
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
    this.Eye[0] = 0.5;
    this.Eye[1] = 0.5;
    this.Eye[2] = -0.5;
    
    this.Target[0] = 0.5;
    this.Target[1] = 0.5;
    this.Target[2] = 0;
    
    this.ViewUp[0] = 0.0;
    this.ViewUp[1] = 1.0;
    this.ViewUp[2] = 0.0;
    
    this.updateAngles();
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

