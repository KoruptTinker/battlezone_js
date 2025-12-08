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
  
  // Log triangle set info
  console.log(Models.TriangleSetInfo);
  
  // Start rendering loop
  Renderer.renderTriangles();
}

