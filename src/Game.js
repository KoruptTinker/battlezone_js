// Main game initialization and coordination

function main() {
  // Initialize camera angles
  Camera.updateAngles();
  
  // Set up input handlers
  Input.setupInput();
  
  // Set up WebGL
  Renderer.setupWebGL();
  
  // Load lights
  Lighting.loadLights();
  
  // Load triangles
  Models.loadTriangles(Renderer.gl);
  
  // Setup shaders
  Shaders.setupShaders(Renderer.gl);
  
  // Initialize initial camera position for mountains translation
  Models.initialCameraEye = vec4.fromValues(Camera.Eye[0], Camera.Eye[1], Camera.Eye[2]);
  
  // Log triangle set info
  console.log(Models.TriangleSetInfo);
  
  // Start rendering loop
  Renderer.renderTriangles();
}

