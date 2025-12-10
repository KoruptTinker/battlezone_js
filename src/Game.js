// Main game initialization and coordination

function main() {
  console.log("main() function called - starting game initialization");
  
  // Test if fetch is available
  if (typeof fetch === 'undefined') {
    console.error("ERROR: fetch() is not available in this browser!");
    alert("Your browser does not support fetch(). Please use a modern browser.");
    return;
  }
  console.log("fetch() is available");
  
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
  
  // Load triangles (async)
  console.log("Starting to load triangles...");
  Models.loadTriangles(Renderer.gl).then(function(success) {
    if (success) {
      console.log("Successfully loaded all game resources");
    } else {
      console.error("Failed to load game resources");
    }
    
    // Setup shaders
    Shaders.setupShaders(Renderer.gl);
    
    // Start rendering loop
    Renderer.renderTriangles();
  }).catch(function(error) {
    console.error("Error during game initialization:", error);
    // Still try to start rendering loop even if loading failed
    Shaders.setupShaders(Renderer.gl);
    Renderer.renderTriangles();
  });
}

