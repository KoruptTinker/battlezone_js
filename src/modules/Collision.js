
const Collision = {
  debug: false,
  
  // Player collision radius
  playerRadius: 0.08,
  playerHeight: 0.2,
  
  // Update collisions for this frame
  update: function() {
    var collisions = [];
    var objects = Models.gameObjects;
    
    // Check every pair of objects
    for (var i = 0; i < objects.length; i++) {
      var objA = objects[i];
      
      // Skip inactive or non-collidable objects
      if (!objA.active || !objA.collidable) continue;
      
      for (var j = i + 1; j < objects.length; j++) {
        var objB = objects[j];
        
        // Skip inactive or non-collidable objects
        if (!objB.active || !objB.collidable) continue;
        
        // Check AABB collision
        if (this.checkAABB(objA, objB)) {
          var collisionInfo = {
            objA: objA,
            objB: objB,
            timestamp: performance.now()
          };
          
          collisions.push(collisionInfo);
          
          // Notify objects
          if (objA.handleCollision) objA.handleCollision(objB, collisionInfo);
          if (objB.handleCollision) objB.handleCollision(objA, collisionInfo);
        }
      }
    }
    
    return collisions;
  },
  
  // Check if the player can move to a new position without collision
  // Returns true if the move is allowed (no collision), false if blocked
  checkPlayerMove: function(newEyeX, newEyeY, newEyeZ) {
    // Create player bounding box at new position
    var playerBox = {
      min: [
        newEyeX - this.playerRadius,
        newEyeY - this.playerHeight,
        newEyeZ - this.playerRadius
      ],
      max: [
        newEyeX + this.playerRadius,
        newEyeY + this.playerHeight,
        newEyeZ + this.playerRadius
      ]
    };
    
    // Check against all collidable objects
    var objects = Models.gameObjects;
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      
      // Skip inactive or non-collidable objects
      if (!obj.active || !obj.collidable) continue;
      
      // Only check against buildings (houses) and tanks
      if (obj.type !== 'house' && obj.type !== 'tank') continue;
      
      // Check AABB overlap
      if (this.checkAABBBoxes(playerBox, obj.boundingBox)) {
        return false; // Collision detected - move blocked
      }
    }
    
    return true; // No collision - move allowed
  },
  
  // Check AABB collision between two bounding box objects
  checkAABBBoxes: function(boxA, boxB) {
    return (
      boxA.min[0] <= boxB.max[0] && boxA.max[0] >= boxB.min[0] &&
      boxA.min[1] <= boxB.max[1] && boxA.max[1] >= boxB.min[1] &&
      boxA.min[2] <= boxB.max[2] && boxA.max[2] >= boxB.min[2]
    );
  },
  
  // Check Axis-Aligned Bounding Box collision
  checkAABB: function(objA, objB) {
    // Get world bounding boxes
    var boxA = objA.boundingBox;
    var boxB = objB.boundingBox;
    
    // Check for overlap on all 3 axes
    return (
      boxA.min[0] <= boxB.max[0] && boxA.max[0] >= boxB.min[0] &&
      boxA.min[1] <= boxB.max[1] && boxA.max[1] >= boxB.min[1] &&
      boxA.min[2] <= boxB.max[2] && boxA.max[2] >= boxB.min[2]
    );
  },
  
  // Resolve collision (optional, for physics)
  resolveCollision: function(collision) {
    // Simple resolution logic could go here if needed
    // For now, we handle logic in the objects themselves (e.g. Bullet.onCollision)
  }
};
