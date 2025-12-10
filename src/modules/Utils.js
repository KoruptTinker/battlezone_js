// Utility functions for file loading and texture management

const Utils = {
  // Remote asset base URL (textures are hosted alongside the JSON files)
  INPUT_TEXTURES_URL: "https://korupttinker.github.io/battlezone_js/",
  
  // Get the JSON file from the passed URL (async using fetch)
  getJSONFile: function(url, descr) {
    console.log("getJSONFile called with url:", url, "descr:", descr);
    return new Promise(function(resolve, reject) {
      try {
        if ((typeof (url) !== "string") || (typeof (descr) !== "string")) {
          console.error("getJSONFile: Invalid parameters");
          reject(new Error("getJSONFile: parameter not a string"));
          return;
        }
        
        console.log("About to call fetch() for " + descr + " from: " + url);
        var fetchPromise = fetch(url);
        console.log("fetch() called, promise created");
        
        fetchPromise
          .then(function(response) {
            console.log("Fetch response received for " + descr + ", status:", response.status);
            if (!response.ok) {
              throw new Error("HTTP error! status: " + response.status);
            }
            return response.json();
          })
          .then(function(data) {
            console.log("Successfully loaded and parsed " + descr);
            resolve(data);
          })
          .catch(function(error) {
            console.error("Failed to load " + descr + " from " + url + ":", error);
            reject(error);
          });
      } catch (e) {
        console.error("Error in getJSONFile:", e);
        reject(e);
      }
    });
  },

  // Load a texture image and return a Promise
  getTextureImage: function(gl, textureName) {
    return new Promise(function(resolve, reject) {
      var image = new Image();
      image.crossOrigin = "anonymous"; 
      image.onload = function() {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        resolve(texture);
      };
      image.onerror = function() {
        console.error("Failed to load texture: " + Utils.INPUT_TEXTURES_URL + textureName);
        reject(new Error("Failed to load texture: " + textureName));
      };
      image.src = Utils.INPUT_TEXTURES_URL + textureName;
    });
  }
};

