const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog4/triangles.json";
const INPUT_ELLIPSOIDS_URL = "https://ncsucgclass.github.io/prog4/ellipsoids.json";
const BACKGROUND_IMAGE_URL = "https://ncsucgclass.github.io/prog4/sky.jpg";

var game = null;


function main() {
    game = new BattlezoneGame({
        camera: {
            eye: vec3.fromValues(0.5, 0.5, -0.5),
            center: vec3.fromValues(0.5, 0.5, 0.5),
            up: vec3.fromValues(0, 1, 0)
        },
        lighting: {
            ambient: vec3.fromValues(1, 1, 1),
            diffuse: vec3.fromValues(1, 1, 1),
            specular: vec3.fromValues(1, 1, 1),
            position: vec3.fromValues(-0.5, 1.5, -0.5)
        },
        renderer: {
            fov: 0.5 * Math.PI,
            aspect: 1,
            near: 0.1,
            far: 10,
            rotateTheta: Math.PI / 50
        }
    });

    // Initialize the game with canvas ID
    game.init("myWebGLCanvas");

    // Set up background image
    game.setupWebGL("myImageCanvas", BACKGROUND_IMAGE_URL);

    // Load models
    game.loadModels(INPUT_TRIANGLES_URL, INPUT_ELLIPSOIDS_URL, 32);

    // Start the rendering loop
    game.start();
}
