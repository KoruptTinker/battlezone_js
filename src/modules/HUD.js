// 2D HUD overlay for crosshair and radar
const HUD = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  radarSize: 220,
  radarRange: 3.0, // world units shown from center to edge (smaller range => more spread)
  padding: 24,
  color: '#00aaff',
  enemyColor: '#ff3030',
  obstacleColor: '#ffd000',
  
  // Radar sweep properties
  sweepAngle: 0,
  prevSweepAngle: 0,
  sweepSpeed: 2.0, // radians per second
  sweepTrailLength: Math.PI * 1.5, // how far behind sweep blips stay visible (3/4 of circle)
  
  // Stored scanned positions (updated only when sweep passes over)
  scannedTanks: {},      // tankIndex -> {px, pz, scannedAngle}
  scannedObstacles: {},  // objectIndex -> {px, pz, scannedAngle}

  init() {
    this.canvas = document.getElementById('hudCanvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  },

  draw(deltaTime) {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Store previous sweep angle for detecting when sweep passes over objects
    this.prevSweepAngle = this.sweepAngle;
    
    // Update sweep angle
    this.sweepAngle += this.sweepSpeed * deltaTime;
    if (this.sweepAngle > Math.PI * 2) {
      this.sweepAngle -= Math.PI * 2;
      this.prevSweepAngle -= Math.PI * 2; // Keep relative for sweep-pass detection
    }
    
    this.drawCrosshair();
    this.drawRadar();
  },

  drawCrosshair() {
    const ctx = this.ctx;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const thick = 2;

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = thick;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;

    // Classic Battlezone arcade crosshair
    const boxWidth = 40;
    const boxHeight = 30;
    const lineExtend = 120;

    // Center targeting box
    ctx.strokeRect(cx - boxWidth / 2, cy - boxHeight / 2, boxWidth, boxHeight);

    // Horizontal lines extending from box
    ctx.beginPath();
    // Left line
    ctx.moveTo(cx - boxWidth / 2 - lineExtend, cy);
    ctx.lineTo(cx - boxWidth / 2, cy);
    // Right line
    ctx.moveTo(cx + boxWidth / 2, cy);
    ctx.lineTo(cx + boxWidth / 2 + lineExtend, cy);
    ctx.stroke();

    ctx.restore();
  },

  drawRadar() {
    if (!Models || !Camera) return;

    const ctx = this.ctx;
    const size = this.radarSize;
    const radius = (size / 2) - 10;
    const originX = this.width - size - this.padding;
    const originY = this.height - size - this.padding;
    const centerX = originX + size / 2;
    const centerY = originY + size / 2;

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 4;

    // Outer square and cross grid
    ctx.strokeRect(originX, originY, size, size);
    ctx.beginPath();
    ctx.moveTo(centerX, originY);
    ctx.lineTo(centerX, originY + size);
    ctx.moveTo(originX, centerY);
    ctx.lineTo(originX + size, centerY);
    ctx.stroke();

    // Radar circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw sweep trail (fading gradient behind sweep line)
    const sweepGradient = ctx.createConicGradient(this.sweepAngle - Math.PI / 2, centerX, centerY);
    sweepGradient.addColorStop(0, 'rgba(0, 170, 255, 0.35)');
    sweepGradient.addColorStop(0.25, 'rgba(0, 170, 255, 0.15)');
    sweepGradient.addColorStop(0.5, 'rgba(0, 170, 255, 0.05)');
    sweepGradient.addColorStop(0.75, 'rgba(0, 170, 255, 0)');
    sweepGradient.addColorStop(1, 'rgba(0, 170, 255, 0)');
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 1, 0, Math.PI * 2);
    ctx.fillStyle = sweepGradient;
    ctx.fill();
    ctx.restore();

    // Draw sweep line
    const sweepEndX = centerX + Math.cos(this.sweepAngle - Math.PI / 2) * radius;
    const sweepEndY = centerY + Math.sin(this.sweepAngle - Math.PI / 2) * radius;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(sweepEndX, sweepEndY);
    ctx.stroke();
    ctx.restore();

    // Player indicator (triangle pointing up/forward)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 8);
    ctx.lineTo(centerX - 6, centerY + 6);
    ctx.lineTo(centerX + 6, centerY + 6);
    ctx.closePath();
    ctx.fill();

    // Enemies (tanks) blips
    const forward = [
      Camera.Target[0] - Camera.Eye[0],
      0,
      Camera.Target[2] - Camera.Eye[2]
    ];
    let fLen = Math.sqrt(forward[0] * forward[0] + forward[2] * forward[2]);
    if (fLen < 1e-5) fLen = 1; // avoid div by zero
    forward[0] /= fLen;
    forward[2] /= fLen;

    // Right vector in XZ (forward x up); negate to match screen orientation
    const right = [-forward[2], 0, forward[0]];

    const scale = radius / this.radarRange;

    // Get angle of a point from radar center
    const getAngle = (px, pz) => {
      let angle = Math.atan2(pz, px) + Math.PI / 2;
      if (angle < 0) angle += Math.PI * 2;
      return angle;
    };

    // Check if sweep just passed over a given angle
    const sweepPassedOver = (targetAngle) => {
      let prev = this.prevSweepAngle % (Math.PI * 2);
      let curr = this.sweepAngle % (Math.PI * 2);
      if (prev < 0) prev += Math.PI * 2;
      if (curr < 0) curr += Math.PI * 2;
      
      // Handle wrap-around
      if (prev > curr) {
        // Sweep wrapped around
        return targetAngle >= prev || targetAngle <= curr;
      }
      return targetAngle >= prev && targetAngle <= curr;
    };

    // Calculate blip opacity based on its scanned angle
    const getBlipOpacity = (scannedAngle) => {
      let normalizedSweep = this.sweepAngle % (Math.PI * 2);
      if (normalizedSweep < 0) normalizedSweep += Math.PI * 2;
      
      // Calculate angular distance behind sweep (how long ago sweep passed)
      let angleBehind = normalizedSweep - scannedAngle;
      if (angleBehind < 0) angleBehind += Math.PI * 2;
      
      // If within trail length, calculate fade
      if (angleBehind <= this.sweepTrailLength) {
        // Strong at sweep, fading as angle increases
        return 1.0 - (angleBehind / this.sweepTrailLength) * 0.65;
      }
      // Minimum visibility for objects far from sweep
      return 0.35;
    };

    // Draw blip at stored position with sweep-based opacity
    const drawBlip = (px, pz, scannedAngle, color, blipSize = 4) => {
      const dist = Math.sqrt(px * px + pz * pz);
      let clampedX = px;
      let clampedZ = pz;
      if (dist > radius) {
        const clamp = radius / dist;
        clampedX *= clamp;
        clampedZ *= clamp;
      }
      const blipX = centerX + clampedX;
      const blipY = centerY + clampedZ;
      
      const opacity = getBlipOpacity(scannedAngle);
      
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = opacity > 0.7 ? 12 : 4;
      ctx.beginPath();
      ctx.arc(blipX, blipY, blipSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // Process obstacles - update stored positions only when sweep passes
    if (Array.isArray(Models.gameObjects)) {
      for (let i = 0; i < Models.gameObjects.length; i++) {
        const obj = Models.gameObjects[i];
        if (!obj || !obj.active || obj.type === 'tank' || obj.type === 'enemy_tank' || obj.type === 'player_bullet' || obj.type === 'enemy_bullet' || obj.type === 'mountain') continue;

        // Consider collidable obstacles only
        if (!obj.collidable) continue;

        // Calculate current real position
        const center = obj.getBoundingBoxCenter ? obj.getBoundingBoxCenter() : obj.position;
        const dx = center[0] - Camera.Eye[0];
        const dz = center[2] - Camera.Eye[2];
        const forwardDist = dx * forward[0] + dz * forward[2];
        const rightDist = dx * right[0] + dz * right[2];
        const px = rightDist * scale;
        const pz = -forwardDist * scale;
        
        const currentAngle = getAngle(px, pz);
        
        // Update stored position if sweep passed over this angle
        if (sweepPassedOver(currentAngle) || !this.scannedObstacles[i]) {
          this.scannedObstacles[i] = { px, pz, scannedAngle: currentAngle };
        }
        
        // Draw at stored position
        const stored = this.scannedObstacles[i];
        if (stored) {
          drawBlip(stored.px, stored.pz, stored.scannedAngle, this.obstacleColor, 3.5);
        }
      }
    }

    // Process tanks - update stored positions only when sweep passes
    for (let i = 0; i < Models.tankPositions.length; i++) {
      if (Models.isTankDead && Models.isTankDead(i)) {
        delete this.scannedTanks[i];
        continue;
      }
      
      const pos = Models.tankPositions[i];
      const dx = pos[0] - Camera.Eye[0];
      const dz = pos[2] - Camera.Eye[2];
      const forwardDist = dx * forward[0] + dz * forward[2];
      const rightDist = dx * right[0] + dz * right[2];
      const px = rightDist * scale;
      const pz = -forwardDist * scale;
      
      const currentAngle = getAngle(px, pz);
      
      // Update stored position if sweep passed over this angle
      if (sweepPassedOver(currentAngle) || !this.scannedTanks[i]) {
        this.scannedTanks[i] = { px, pz, scannedAngle: currentAngle };
      }
      
      // Draw at stored position
      const stored = this.scannedTanks[i];
      if (stored) {
        drawBlip(stored.px, stored.pz, stored.scannedAngle, this.enemyColor, 4);
      }
    }

    ctx.restore();
  }
};

if (typeof window !== 'undefined') {
  window.HUD = HUD;
}

