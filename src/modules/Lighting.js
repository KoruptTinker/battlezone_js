// Lighting system

const Lighting = {
  lightPos: null,
  lightDiffuse: null,
  lightAmbient: null,
  lightSpec: null,
  
  // Initialize lighting values
  loadLights: function() {
    this.lightPos = [-0.5, 1.5, -0.5];
    this.lightDiffuse = [1.0, 1.0, 1.0];
    this.lightAmbient = [1.0, 1.0, 1.0];
    this.lightSpec = [1.0, 1.0, 1.0];
  }
};

