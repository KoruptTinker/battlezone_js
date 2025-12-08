// Input handling for keyboard events

const Input = {
  // Initialize input handlers
  setupInput: function() {
    document.addEventListener('keydown', function (e) {
      switch (e.key) {
        case "a":
          Camera.Eye[0] -= 0.015;
          Camera.Target[0] -= 0.015;
          break;
        case "d":
          Camera.Eye[0] += 0.015;
          Camera.Target[0] += 0.015;
          break;
        case "w":
          Camera.Eye[2] += 0.015;
          Camera.Target[2] += 0.015;
          break;
        case "s":
          Camera.Eye[2] -= 0.015;
          Camera.Target[2] -= 0.015;
          break;
        case "q":
          Camera.Eye[1] += 0.015;
          Camera.Target[1] += 0.015;
          break;
        case "e":
          Camera.Eye[1] -= 0.015;
          Camera.Target[1] -= 0.015;
          break;
        case "A":
          Camera.yawAngle += 0.015;
          Camera.Target[0] = Camera.Eye[0] + Math.sin(Camera.yawAngle) * Math.cos(Camera.pitchAngle);
          Camera.Target[1] = Camera.Eye[1] + Math.sin(Camera.pitchAngle);
          Camera.Target[2] = Camera.Eye[2] + Math.cos(Camera.yawAngle) * Math.cos(Camera.pitchAngle);
          Camera.alignViewUpWithRoll();
          break;
        case "D":
          Camera.yawAngle -= 0.015;
          Camera.Target[0] = Camera.Eye[0] + Math.sin(Camera.yawAngle) * Math.cos(Camera.pitchAngle);
          Camera.Target[1] = Camera.Eye[1] + Math.sin(Camera.pitchAngle);
          Camera.Target[2] = Camera.Eye[2] + Math.cos(Camera.yawAngle) * Math.cos(Camera.pitchAngle);
          Camera.alignViewUpWithRoll();
          break;
        case "W":
          Camera.pitchAngle += 0.03;
          Camera.Target[0] = Camera.Eye[0] + Math.sin(Camera.yawAngle) * Math.cos(Camera.pitchAngle);
          Camera.Target[1] = Camera.Eye[1] + Math.sin(Camera.pitchAngle);
          Camera.Target[2] = Camera.Eye[2] + Math.cos(Camera.yawAngle) * Math.cos(Camera.pitchAngle);
          Camera.alignViewUpWithRoll();
          break;
        case "S":
          Camera.pitchAngle -= 0.03;
          Camera.Target[0] = Camera.Eye[0] + Math.sin(Camera.yawAngle) * Math.cos(Camera.pitchAngle);
          Camera.Target[1] = Camera.Eye[1] + Math.sin(Camera.pitchAngle);
          Camera.Target[2] = Camera.Eye[2] + Math.cos(Camera.yawAngle) * Math.cos(Camera.pitchAngle);
          Camera.alignViewUpWithRoll();
          break;
        case "Q":
          Camera.roll(0.03);
          break;
        case "E":
          Camera.roll(-0.03);
          break;
        case "ArrowRight":
          if(Models.selectedSet >= 0) {
            Models.scale(1/1.2, Models.selectedSet);
          }
          Models.selectedSet++;
          Models.selectedSet %= Models.TriangleSetInfo.length;
          Models.scale(1.2, Models.selectedSet);
          break;
        case "ArrowLeft":
          if(Models.selectedSet >= 0) {
            Models.scale(1/1.2, Models.selectedSet);
          }
          Models.selectedSet--;
          if (Models.selectedSet < 0) {
            Models.selectedSet = Models.TriangleSetInfo.length - 1;
          }
          Models.scale(1.2, Models.selectedSet);
          break;
        case " ":
          if(Models.selectedSet >= 0) {
            Models.scale(1/1.2, Models.selectedSet);
          }
          Models.selectedSet = -1;
          break;
        case "k":
          if(Models.selectedSet >= 0) {
            mat4.translate(Models.modelMat[Models.selectedSet], Models.modelMat[Models.selectedSet], [0.015, 0, 0]);
          }
          break;
        case ";":
          if(Models.selectedSet >= 0) {
            mat4.translate(Models.modelMat[Models.selectedSet], Models.modelMat[Models.selectedSet], [-0.015, 0, 0]);
          }
          break;
        case "o":
          if(Models.selectedSet >= 0) {
            mat4.translate(Models.modelMat[Models.selectedSet], Models.modelMat[Models.selectedSet], [0, 0, 0.015]);
          }
          break;
        case "l":
          if(Models.selectedSet >= 0) {
            mat4.translate(Models.modelMat[Models.selectedSet], Models.modelMat[Models.selectedSet], [0, 0, -0.015]);
          }
          break;
        case "i":
          if(Models.selectedSet >= 0) {
            mat4.translate(Models.modelMat[Models.selectedSet], Models.modelMat[Models.selectedSet], [0, 0.015, 0]);
          }
          break;
        case "p":
          if(Models.selectedSet >= 0) {
            mat4.translate(Models.modelMat[Models.selectedSet], Models.modelMat[Models.selectedSet], [0, -0.015, 0]);
          }
          break;
        case "K":
          if(Models.selectedSet >= 0) {
            Models.rotate(0.02, [0, 1, 0], Models.selectedSet);
          }
          break;
        case ":":
          if(Models.selectedSet >= 0) {
            Models.rotate(-0.02, [0, 1, 0], Models.selectedSet);
          }
          break;
        case "O":
          if(Models.selectedSet >= 0) {
            Models.rotate(0.02, [1, 0, 0], Models.selectedSet);
          }
          break;
        case "L":
          if(Models.selectedSet >= 0) {
            Models.rotate(-0.02, [1, 0, 0], Models.selectedSet);
          }
          break;
        case "I":
          if(Models.selectedSet >= 0) {
            Models.rotate(0.02, [0, 0, 1], Models.selectedSet);
          }
          break;
        case "P":
          if(Models.selectedSet >= 0) {
            Models.rotate(-0.02, [0, 0, 1], Models.selectedSet);
          }
          break;
        case "Escape":
          Camera.resetViewingCoordinates();
          Models.resetModels();
          break;
      }
    });
  }
};

