// Model loading, triangle sets, buffers, and transformations

const Models = {
  INPUT_TRIANGLES_URL: "https://korupttinker.github.io/battlezone_js/mountain.json",
  
  vertexBuffer: null,
  triangleBuffer: null,
  triBufferSize: 0,
  colorDiffuseBuffer: null,
  colorAmbientBuffer: null,
  colorSpecBuffer: null,
  colorNBuffer: null,
  colorAlphaBuffer: null,
  vertexNormalBuffer: null,
  uvBuffer: null,
  indexBuffer: null,
  indexArray: [],
  textureArray: [],
  modelMat: [],
  TriangleSetInfo: [],
  selectedSet: -1,
  
  // Load triangles from JSON file
  loadTriangles: function(gl) {
    var inputTriangles = Utils.getJSONFile(this.INPUT_TRIANGLES_URL, "triangles");
    if (inputTriangles != String.null) {
      var whichSetVert;
      var whichSetTri; 
      var coordArray = []; 
      var indexOffset = 0;
      var colorDiffuseArray = [];
      var colorAmbientArray = [];
      var colorSpecArray = [];
      var colorNArray = [];
      var colorAlphaArray = [];
      var vertexNormalArray = [];
      var totalTriangles = 0;
      var uvArray = [];
      var textureNameArray = [];
      
      for (var whichSet = 0; whichSet < inputTriangles.length; whichSet++) {
        var setData = {
          startIdx: totalTriangles * 3,
        };
        var avgPos = [0, 0, 0];
        textureNameArray.push(inputTriangles[whichSet].material.texture);
        
        for (whichSetVert = 0; whichSetVert < inputTriangles[whichSet].vertices.length; whichSetVert++) {
          coordArray = coordArray.concat(inputTriangles[whichSet].vertices[whichSetVert]);
          colorDiffuseArray.push(inputTriangles[whichSet].material.diffuse[0], inputTriangles[whichSet].material.diffuse[1], inputTriangles[whichSet].material.diffuse[2]);
          colorAmbientArray.push(inputTriangles[whichSet].material.ambient[0], inputTriangles[whichSet].material.ambient[1], inputTriangles[whichSet].material.ambient[2]);
          colorSpecArray.push(inputTriangles[whichSet].material.specular[0], inputTriangles[whichSet].material.specular[1], inputTriangles[whichSet].material.specular[2]);
          colorNArray.push(inputTriangles[whichSet].material.n);
          colorAlphaArray.push(inputTriangles[whichSet].material.alpha);
          vertexNormalArray = vertexNormalArray.concat(inputTriangles[whichSet].normals[whichSetVert]);
          avgPos[0] += inputTriangles[whichSet].vertices[whichSetVert][0];
          avgPos[1] += inputTriangles[whichSet].vertices[whichSetVert][1];
          avgPos[2] += inputTriangles[whichSet].vertices[whichSetVert][2];
          uvArray = uvArray.concat(inputTriangles[whichSet].uvs[whichSetVert]);
        }
        
        avgPos[0] /= inputTriangles[whichSet].vertices.length;
        avgPos[1] /= inputTriangles[whichSet].vertices.length;
        avgPos[2] /= inputTriangles[whichSet].vertices.length;
        
        for (whichSetTri = 0; whichSetTri < inputTriangles[whichSet].triangles.length; whichSetTri++) {
          totalTriangles++;
          this.indexArray.push(inputTriangles[whichSet].triangles[whichSetTri][0] + indexOffset, inputTriangles[whichSet].triangles[whichSetTri][1] + indexOffset, inputTriangles[whichSet].triangles[whichSetTri][2] + indexOffset);
        }
        indexOffset += inputTriangles[whichSet].vertices.length;
        setData.endIdx = totalTriangles * 3;
        setData.avgPos = avgPos;
        this.modelMat.push(mat4.create());
        this.TriangleSetInfo.push(setData);
      } 
      
      this.vertexBuffer = gl.createBuffer(); 
      this.indexBuffer = gl.createBuffer();
      this.colorDiffuseBuffer = gl.createBuffer();
      this.colorAmbientBuffer = gl.createBuffer();
      this.colorSpecBuffer = gl.createBuffer();
      this.colorNBuffer = gl.createBuffer();
      this.colorAlphaBuffer = gl.createBuffer();
      this.vertexNormalBuffer = gl.createBuffer();
      this.uvBuffer = gl.createBuffer();
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer); 
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordArray), gl.STATIC_DRAW); 
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexArray), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorDiffuseBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorDiffuseArray), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorAmbientBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorAmbientArray), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorSpecBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorSpecArray), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorNBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorNArray), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorAlphaBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorAlphaArray), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormalArray), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvArray), gl.STATIC_DRAW);
      
      var texturePromises = [];
      for(var textureId = 0; textureId < textureNameArray.length; textureId++) {
        texturePromises.push(Utils.getTextureImage(gl, textureNameArray[textureId]));
      }
      Promise.all(texturePromises).then(function(loadedTextures) {
        for(var i = 0; i < loadedTextures.length; i++) {
          Models.textureArray.push(loadedTextures[i]);
        }
      }).catch(function(error) {
        console.error("Error loading textures:", error);
      });
    } 
  },
  
  // Transformation functions
  scale: function(scale, setIdx) {
    this.translate(this.TriangleSetInfo[setIdx].avgPos[0], this.TriangleSetInfo[setIdx].avgPos[1], this.TriangleSetInfo[setIdx].avgPos[2], setIdx);
    mat4.scale(this.modelMat[setIdx], this.modelMat[setIdx], [scale, scale, scale]);
    this.translate(-this.TriangleSetInfo[setIdx].avgPos[0], -this.TriangleSetInfo[setIdx].avgPos[1], -this.TriangleSetInfo[setIdx].avgPos[2], setIdx);
  },
  
  translate: function(tx, ty, tz, setIdx) {
    mat4.translate(this.modelMat[setIdx], this.modelMat[setIdx], [tx, ty, tz]);
  },
  
  rotate: function(angle, axis, setIdx) {
    this.translate(this.TriangleSetInfo[setIdx].avgPos[0], this.TriangleSetInfo[setIdx].avgPos[1], this.TriangleSetInfo[setIdx].avgPos[2], setIdx);
    mat4.rotate(this.modelMat[setIdx], this.modelMat[setIdx], angle, axis);
    this.translate(-this.TriangleSetInfo[setIdx].avgPos[0], -this.TriangleSetInfo[setIdx].avgPos[1], -this.TriangleSetInfo[setIdx].avgPos[2], setIdx);
  },
  
  // Reset all model matrices
  resetModels: function() {
    for(var i = 0; i < this.TriangleSetInfo.length; i++) {
      this.modelMat[i] = mat4.create();
    }
    this.selectedSet = -1;
  }
};

