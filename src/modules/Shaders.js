// Shader compilation and setup

const Shaders = {
  shaderProgram: null,
  vertexPositionAttrib: null,
  vertexDiffuseAttrib: null,
  vertexAmbientAttrib: null,
  vertexSpecAttrib: null,
  vertexNAttrib: null,
  vertexAlphaAttrib: null,
  vertexNormalAttrib: null,
  vertexUVAttrib: null,
  viewMatUniform: null,
  projectionMatUniform: null,
  modelMatUniform: null,
  lightPosUniform: null,
  lightDiffuseUniform: null,
  lightAmbientUniform: null,
  lightSpecUniform: null,
  eyePositionUniform: null,
  textureUniform: null,
  altPosition: false,
  
  // Setup the webGL shaders
  setupShaders: function(gl) {
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
      precision mediump float;
      
      uniform vec3 lightPos; 
      uniform vec3 lightDiffuse; 
      uniform vec3 lightAmbient; 
      uniform vec3 lightSpec;
      uniform vec3 eyePosition;
      
      uniform sampler2D uTexture;
      
      varying vec3 vNormal;
      varying vec3 vColorDiffuse;
      varying vec3 vColorAmbient;
      varying vec3 vColorSpec;
      varying float vColorN;
      varying float vColorAlpha;
      varying vec3 vPosition;

      varying vec2 vUV;

      void main(void) {
        // Calculate half vector
        vec3 N = normalize(vNormal);
        vec3 lightVector = normalize(lightPos - vPosition);
        vec3 viewVector = normalize(eyePosition - vPosition);
        vec3 halfVector = normalize(lightVector + viewVector);
        float NL = max(dot(N, lightVector), 0.0);
        float NH = max(dot(N, halfVector), 0.0);
        vec3 ambient = lightAmbient * vColorAmbient;
        vec3 diffuse = lightDiffuse * vColorDiffuse * NL;
        float specIntensity = pow(NH, vColorN);
        vec3 spec = lightSpec * vColorSpec * specIntensity;
        vec3 finalColor = ambient + diffuse + spec;
        vec4 textureColor = texture2D(uTexture, vUV);
        gl_FragColor = textureColor; 
      }
    `;

    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
      attribute vec3 vertexPosition;
      attribute vec3 vertexDiffuse;
      attribute vec3 vertexAmbient;
      attribute vec3 vertexSpec;
      attribute float vertexN;
      attribute float vertexAlpha;
      attribute vec3 vertexNormal;

      uniform mat4 modelMat;
      uniform mat4 viewMat;
      uniform mat4 projectionMat;

      uniform sampler2D uTexture;
      
      varying vec3 vNormal;
      varying vec3 vColorDiffuse;
      varying vec3 vColorAmbient;
      varying vec3 vColorSpec;
      varying float vColorN;
      varying float vColorAlpha;
      varying vec3 vPosition;

      varying vec2 vUV;

      attribute vec2 vertexUV;

      void main(void) {
        vColorDiffuse = vertexDiffuse;
        vColorAmbient = vertexAmbient;
        vColorSpec = vertexSpec;
        vColorN = vertexN;
        vNormal = normalize(mat3(modelMat) * vertexNormal);
        vColorAlpha = vertexAlpha;
        vUV = vec2(1.0 - vertexUV.x, 1.0 - vertexUV.y); // Flip V coordinate to fix texture inversion
        vPosition = (modelMat * vec4(vertexPosition, 1.0)).xyz;
        gl_Position = projectionMat * viewMat * modelMat * vec4(vertexPosition, 1.0); // use the untransformed position
      }
    `;

    try {
      var fShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fShader, fShaderCode);
      gl.compileShader(fShader);

      var vShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vShader, vShaderCode);
      gl.compileShader(vShader);

      if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
        throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);
        gl.deleteShader(fShader);
      } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
        throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);
        gl.deleteShader(vShader);
      } else {
        this.shaderProgram = gl.createProgram();
        gl.attachShader(this.shaderProgram, fShader);
        gl.attachShader(this.shaderProgram, vShader);
        gl.linkProgram(this.shaderProgram);

        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
          throw "error during shader program linking: " + gl.getProgramInfoLog(this.shaderProgram);
        } else {
          gl.useProgram(this.shaderProgram);
          this.vertexPositionAttrib = gl.getAttribLocation(this.shaderProgram, "vertexPosition");
          gl.enableVertexAttribArray(this.vertexPositionAttrib);
          this.viewMatUniform = gl.getUniformLocation(this.shaderProgram, "viewMat");
          this.projectionMatUniform = gl.getUniformLocation(this.shaderProgram, "projectionMat");
          this.modelMatUniform = gl.getUniformLocation(this.shaderProgram, "modelMat");
          this.vertexDiffuseAttrib = gl.getAttribLocation(this.shaderProgram, "vertexDiffuse");
          this.vertexAmbientAttrib = gl.getAttribLocation(this.shaderProgram, "vertexAmbient");
          this.vertexSpecAttrib = gl.getAttribLocation(this.shaderProgram, "vertexSpec");
          this.vertexNAttrib = gl.getAttribLocation(this.shaderProgram, "vertexN");
          this.vertexAlphaAttrib = gl.getAttribLocation(this.shaderProgram, "vertexAlpha");
          this.vertexNormalAttrib = gl.getAttribLocation(this.shaderProgram, "vertexNormal");
          gl.enableVertexAttribArray(this.vertexDiffuseAttrib);
          gl.enableVertexAttribArray(this.vertexAmbientAttrib);
          gl.enableVertexAttribArray(this.vertexSpecAttrib);
          gl.enableVertexAttribArray(this.vertexNAttrib);
          gl.enableVertexAttribArray(this.vertexAlphaAttrib);
          gl.enableVertexAttribArray(this.vertexNormalAttrib);
          this.vertexUVAttrib = gl.getAttribLocation(this.shaderProgram, "vertexUV");
          gl.enableVertexAttribArray(this.vertexUVAttrib);

          this.lightPosUniform = gl.getUniformLocation(this.shaderProgram, "lightPos");
          this.lightDiffuseUniform = gl.getUniformLocation(this.shaderProgram, "lightDiffuse");
          this.lightAmbientUniform = gl.getUniformLocation(this.shaderProgram, "lightAmbient");
          this.lightSpecUniform = gl.getUniformLocation(this.shaderProgram, "lightSpec");
          this.eyePositionUniform = gl.getUniformLocation(this.shaderProgram, "eyePosition");
          this.textureUniform = gl.getUniformLocation(this.shaderProgram, "uTexture");
        }
      }
    } catch (e) {
      console.log(e);
    }
    
    this.altPosition = false;
    setTimeout(function alterPosition() {
      Shaders.altPosition = !Shaders.altPosition;
      setTimeout(alterPosition, 2000);
    }, 2000);
  }
};

