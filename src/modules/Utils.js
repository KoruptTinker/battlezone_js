// Utility functions for file loading and texture management

const Utils = {
  INPUT_TEXTURES_URL: "https://korupttinker.github.io/battlezone_js/",
  
  // Get the JSON file from the passed URL
  getJSONFile: function(url, descr) {
    try {
      if ((typeof (url) !== "string") || (typeof (descr) !== "string"))
        throw "getJSONFile: parameter not a string";
      else {
        var httpReq = new XMLHttpRequest(); // a new http request
        httpReq.open("GET", url, false); // init the request
        httpReq.send(null); // send the request
        var startTime = Date.now();
        while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
          if ((Date.now() - startTime) > 3000)
            break;
        } // until its loaded or we time out after three seconds
        if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
          throw "Unable to open " + descr + " file!";
        else
          return JSON.parse(httpReq.response);
      } // end if good params
    } // end try    

    catch (e) {
      console.log(e);
      return (String.null);
    }
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

