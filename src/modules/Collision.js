// Collision detection system for game objects
// Supports AABB (Axis-Aligned Bounding Box) and sphere collision detection

const Collision = {
  // Collection of all collidable game objects
  gameObjects: [],
  
  // Player reference
  player: null,
  
  // Debug mode
  debug: false,
  
  // Initialize the collision system
  init: function() {
    this.gameObjects = [];
    this.player = null;
  },
  
  // Register a game object for collision detection
  register: function(gameObject) {
    if (!gameObject || this.gameObjects.includes(gameObject)) {
      return;
    }
    this.gameObjects.push(gameObject);
    
    if (gameObject.type === 'player') {
      this.player = gameObject;
    }
  },
  
  // Unregister a game object
  unregister: function(gameObject) {
    const index = this.gameObjects.indexOf(gameObject);
    if (index !== -1) {
      this.gameObjects.splice(index, 1);
    }
    
    if (gameObject === this.player) {
      this.player = null;
    }
  },
  
  // Clear all registered objects
  clear: function() {
    this.gameObjects = [];
    this.player = null;
  },
  
  // Get all game objects
  getGameObjects: function() {
    return this.gameObjects;
  },
  
  // Get game objects by type
  getGameObjectsByType: function(type) {
    return this.gameObjects.filter(obj => obj.type === type);
  },
  
  // Get active game objects
  getActiveGameObjects: function() {
    return this.gameObjects.filter(obj => obj.active);
  },
  
  aabbIntersects: function(boxA, boxB) {
    return (
      boxA.min[0] <= boxB.max[0] && boxA.max[0] >= boxB.min[0] &&
      boxA.min[1] <= boxB.max[1] && boxA.max[1] >= boxB.min[1] &&
      boxA.min[2] <= boxB.max[2] && boxA.max[2] >= boxB.min[2]
    );
  },
  
  // Check collision between two game objects
  checkCollision: function(objA, objB) {
    // Skip if either object is not active or not collidable
    if (!objA.active || !objB.active) return null;
    if (!objA.collidable || !objB.collidable) return null;
    
    // Check AABB intersection
    if (this.aabbIntersects(objA.boundingBox, objB.boundingBox)) {
      // Calculate collision info
      const collisionInfo = this.calculateCollisionInfo(objA, objB);
      return collisionInfo;
    }
    
    return null;
  },
  
  // Calculate detailed collision information
  calculateCollisionInfo: function(objA, objB) {
    // Calculate overlap on each axis
    const overlapX = Math.min(objA.boundingBox.max[0], objB.boundingBox.max[0]) - 
                     Math.max(objA.boundingBox.min[0], objB.boundingBox.min[0]);
    const overlapY = Math.min(objA.boundingBox.max[1], objB.boundingBox.max[1]) - 
                     Math.max(objA.boundingBox.min[1], objB.boundingBox.min[1]);
    const overlapZ = Math.min(objA.boundingBox.max[2], objB.boundingBox.max[2]) - 
                     Math.max(objA.boundingBox.min[2], objB.boundingBox.min[2]);
    
    // Find the axis with minimum overlap (separation axis)
    let minOverlap = overlapX;
    let normal = [1, 0, 0];
    
    if (overlapY < minOverlap) {
      minOverlap = overlapY;
      normal = [0, 1, 0];
    }
    
    if (overlapZ < minOverlap) {
      minOverlap = overlapZ;
      normal = [0, 0, 1];
    }
    
    // Determine direction of normal (from A to B)
    const centerA = objA.getBoundingBoxCenter ? objA.getBoundingBoxCenter() : [
      (objA.boundingBox.min[0] + objA.boundingBox.max[0]) / 2,
      (objA.boundingBox.min[1] + objA.boundingBox.max[1]) / 2,
      (objA.boundingBox.min[2] + objA.boundingBox.max[2]) / 2
    ];
    
    const centerB = objB.getBoundingBoxCenter ? objB.getBoundingBoxCenter() : [
      (objB.boundingBox.min[0] + objB.boundingBox.max[0]) / 2,
      (objB.boundingBox.min[1] + objB.boundingBox.max[1]) / 2,
      (objB.boundingBox.min[2] + objB.boundingBox.max[2]) / 2
    ];
    
    // Flip normal if needed
    if (normal[0] !== 0) {
      if (centerB[0] < centerA[0]) normal[0] = -1;
    } else if (normal[1] !== 0) {
      if (centerB[1] < centerA[1]) normal[1] = -1;
    } else if (normal[2] !== 0) {
      if (centerB[2] < centerA[2]) normal[2] = -1;
    }
    
    // Calculate contact point (center of overlap region)
    const contactPoint = [
      (Math.max(objA.boundingBox.min[0], objB.boundingBox.min[0]) + 
       Math.min(objA.boundingBox.max[0], objB.boundingBox.max[0])) / 2,
      (Math.max(objA.boundingBox.min[1], objB.boundingBox.min[1]) + 
       Math.min(objA.boundingBox.max[1], objB.boundingBox.max[1])) / 2,
      (Math.max(objA.boundingBox.min[2], objB.boundingBox.min[2]) + 
       Math.min(objA.boundingBox.max[2], objB.boundingBox.max[2])) / 2
    ];
    
    return {
      objectA: objA,
      objectB: objB,
      normal: normal,
      penetrationDepth: minOverlap,
      contactPoint: contactPoint,
      overlapX: overlapX,
      overlapY: overlapY,
      overlapZ: overlapZ
    };
  },
  
  // ============================================
  // Sphere Collision Detection
  // ============================================
  
  // Check if two spheres intersect
  sphereIntersects: function(centerA, radiusA, centerB, radiusB) {
    const dx = centerB[0] - centerA[0];
    const dy = centerB[1] - centerA[1];
    const dz = centerB[2] - centerA[2];
    const distSq = dx * dx + dy * dy + dz * dz;
    const radiusSum = radiusA + radiusB;
    return distSq <= radiusSum * radiusSum;
  },
  
  // Get sphere from AABB (bounding sphere)
  getBoundingSphere: function(boundingBox) {
    const center = [
      (boundingBox.min[0] + boundingBox.max[0]) / 2,
      (boundingBox.min[1] + boundingBox.max[1]) / 2,
      (boundingBox.min[2] + boundingBox.max[2]) / 2
    ];
    
    const dx = boundingBox.max[0] - boundingBox.min[0];
    const dy = boundingBox.max[1] - boundingBox.min[1];
    const dz = boundingBox.max[2] - boundingBox.min[2];
    const radius = Math.sqrt(dx * dx + dy * dy + dz * dz) / 2;
    
    return { center, radius };
  },
  
  // ============================================
  // Collision Detection Update
  // ============================================
  
  // Check all collisions and trigger callbacks
  update: function() {
    const activeObjects = this.getActiveGameObjects();
    const collisions = [];
    
    // Check all pairs of objects
    for (let i = 0; i < activeObjects.length; i++) {
      for (let j = i + 1; j < activeObjects.length; j++) {
        const objA = activeObjects[i];
        const objB = activeObjects[j];
        
        // Skip certain collision pairs
        if (this.shouldSkipCollision(objA, objB)) {
          continue;
        }
        
        const collisionInfo = this.checkCollision(objA, objB);
        
        if (collisionInfo) {
          collisions.push(collisionInfo);
          
          // Trigger collision handlers
          if (typeof objA.handleCollision === 'function') {
            objA.handleCollision(objB, collisionInfo);
          }
          if (typeof objB.handleCollision === 'function') {
            objB.handleCollision(objA, collisionInfo);
          }
          
          if (this.debug) {
            console.log(`Collision: ${objA.type}(${objA.id}) <-> ${objB.type}(${objB.id})`);
          }
        }
      }
    }
    
    return collisions;
  },
  
  // Determine if a collision pair should be skipped
  shouldSkipCollision: function(objA, objB) {
    // Skip mountain-mountain collisions (static objects don't need to collide with each other)
    if (objA.type === 'mountain' && objB.type === 'mountain') {
      return true;
    }
    
    // Skip house-house collisions
    if (objA.type === 'house' && objB.type === 'house') {
      return true;
    }
    
    // Skip mountain-house collisions
    if ((objA.type === 'mountain' && objB.type === 'house') ||
        (objA.type === 'house' && objB.type === 'mountain')) {
      return true;
    }
    
    return false;
  },
  
  // ============================================
  // Utility Functions
  // ============================================
  
  // Point inside AABB check
  pointInAABB: function(point, box) {
    return (
      point[0] >= box.min[0] && point[0] <= box.max[0] &&
      point[1] >= box.min[1] && point[1] <= box.max[1] &&
      point[2] >= box.min[2] && point[2] <= box.max[2]
    );
  },
  
  // Ray-AABB intersection test
  rayAABBIntersection: function(rayOrigin, rayDir, box) {
    let tmin = -Infinity;
    let tmax = Infinity;
    
    for (let i = 0; i < 3; i++) {
      if (Math.abs(rayDir[i]) < 1e-8) {
        // Ray is parallel to slab
        if (rayOrigin[i] < box.min[i] || rayOrigin[i] > box.max[i]) {
          return null;
        }
      } else {
        const invD = 1.0 / rayDir[i];
        let t1 = (box.min[i] - rayOrigin[i]) * invD;
        let t2 = (box.max[i] - rayOrigin[i]) * invD;
        
        if (t1 > t2) {
          const temp = t1;
          t1 = t2;
          t2 = temp;
        }
        
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        
        if (tmin > tmax) {
          return null;
        }
      }
    }
    
    if (tmax < 0) {
      return null;
    }
    
    const t = tmin >= 0 ? tmin : tmax;
    const hitPoint = [
      rayOrigin[0] + rayDir[0] * t,
      rayOrigin[1] + rayDir[1] * t,
      rayOrigin[2] + rayDir[2] * t
    ];
    
    return {
      t: t,
      point: hitPoint
    };
  },
  
  // Cast a ray and find all intersecting objects
  raycast: function(origin, direction, maxDistance = Infinity) {
    const results = [];
    const activeObjects = this.getActiveGameObjects();
    
    // Normalize direction
    const len = Math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2);
    const dir = [direction[0] / len, direction[1] / len, direction[2] / len];
    
    for (const obj of activeObjects) {
      if (!obj.collidable) continue;
      
      const hit = this.rayAABBIntersection(origin, dir, obj.boundingBox);
      if (hit && hit.t <= maxDistance) {
        results.push({
          object: obj,
          distance: hit.t,
          point: hit.point
        });
      }
    }
    
    // Sort by distance
    results.sort((a, b) => a.distance - b.distance);
    
    return results;
  },
  
  // Get the closest object hit by a ray
  raycastClosest: function(origin, direction, maxDistance = Infinity) {
    const results = this.raycast(origin, direction, maxDistance);
    return results.length > 0 ? results[0] : null;
  },
  
  // Resolve collision by pushing objects apart
  resolveCollision: function(collisionInfo) {
    const { objectA, objectB, normal, penetrationDepth } = collisionInfo;
    
    // Skip if both are static
    if (objectA.isStatic && objectB.isStatic) {
      return;
    }
    
    // Calculate push amount
    const pushAmount = penetrationDepth + 0.01; // Small buffer
    
    if (objectA.isStatic) {
      // Only push B
      objectB.translate(
        normal[0] * pushAmount,
        normal[1] * pushAmount,
        normal[2] * pushAmount
      );
    } else if (objectB.isStatic) {
      // Only push A
      objectA.translate(
        -normal[0] * pushAmount,
        -normal[1] * pushAmount,
        -normal[2] * pushAmount
      );
    } else {
      // Push both equally
      const halfPush = pushAmount / 2;
      objectA.translate(
        -normal[0] * halfPush,
        -normal[1] * halfPush,
        -normal[2] * halfPush
      );
      objectB.translate(
        normal[0] * halfPush,
        normal[1] * halfPush,
        normal[2] * halfPush
      );
    }
  }
};

// Export for use in browser
if (typeof window !== 'undefined') {
  window.Collision = Collision;
}

