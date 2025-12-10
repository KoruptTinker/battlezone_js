// Main game initialization and coordination

function main() {
  // Initialize game state
  GameState.init();
  
  // Initialize audio system
  SoundManager.init();
  
  // Initialize camera angles
  Camera.updateAngles();
  
  // Set up input handlers
  Input.setupInput();

  // Initialize HUD overlay
  HUD.init();
  
  // Set up WebGL
  Renderer.setupWebGL();
  
  // Load lights
  Lighting.loadLights();
  
  Models.initialCameraEye = vec4.fromValues(Camera.Eye[0], Camera.Eye[1], Camera.Eye[2]);
  
  // Load triangles
  Models.loadTriangles(Renderer.gl);
  
  // Setup shaders
  Shaders.setupShaders(Renderer.gl);
  
  // Start rendering loop
  Renderer.renderTriangles();
}

