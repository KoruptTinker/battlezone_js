// 2D HUD overlay for crosshair and radar
const HUD = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  radarSize: 220,
  radarRange: 3.0, // world units shown from center to edge (smaller range => more spread)
  padding: 24,
  color: '#00ff00',
  enemyColor: '#ff3030',
  obstacleColor: '#ffd000',

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
    this.drawCrosshair();
    this.drawRadar();
  },

  drawCrosshair() {
    const ctx = this.ctx;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const gap = 10;
    const arm = 22;
    const thick = 2;

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = thick;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;

    // Horizontal arms
    ctx.beginPath();
    ctx.moveTo(cx - arm, cy);
    ctx.lineTo(cx - gap, cy);
    ctx.moveTo(cx + gap, cy);
    ctx.lineTo(cx + arm, cy);
    ctx.stroke();

    // Vertical arms
    ctx.beginPath();
    ctx.moveTo(cx, cy - arm);
    ctx.lineTo(cx, cy - gap);
    ctx.moveTo(cx, cy + gap);
    ctx.lineTo(cx, cy + arm);
    ctx.stroke();

    // Center box
    const box = 6;
    ctx.strokeRect(cx - box / 2, cy - box / 2, box, box);

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

    // Obstacles (houses/buildings) in yellow
    const drawBlip = (px, pz, color, size = 4) => {
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
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(blipX, blipY, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    if (Array.isArray(Models.gameObjects)) {
      for (let i = 0; i < Models.gameObjects.length; i++) {
        const obj = Models.gameObjects[i];
        if (!obj || !obj.active || obj.type === 'tank' || obj.type === 'enemy_tank' || obj.type === 'player_bullet' || obj.type === 'enemy_bullet' || obj.type === 'mountain') continue;

        // Consider collidable obstacles only
        if (!obj.collidable) continue;

        // Use bounding box center for more stable positioning
        const center = obj.getBoundingBoxCenter ? obj.getBoundingBoxCenter() : obj.position;
        const dx = center[0] - Camera.Eye[0];
        const dz = center[2] - Camera.Eye[2];

        const forwardDist = dx * forward[0] + dz * forward[2];
        const rightDist = dx * right[0] + dz * right[2];

        const px = rightDist * scale;
        const pz = -forwardDist * scale;

        drawBlip(px, pz, this.obstacleColor, 3.5);
      }
    }

    for (let i = 0; i < Models.tankPositions.length; i++) {
      if (Models.isTankDead && Models.isTankDead(i)) continue;
      const pos = Models.tankPositions[i];
      const dx = pos[0] - Camera.Eye[0];
      const dz = pos[2] - Camera.Eye[2];

      // Project into camera-aligned XZ plane
      const forwardDist = dx * forward[0] + dz * forward[2];
      const rightDist = dx * right[0] + dz * right[2];

      const px = rightDist * scale;
      const pz = -forwardDist * scale; // forward should move upward on radar

      drawBlip(px, pz, this.enemyColor, 4);
    }

    ctx.restore();
  }
};

if (typeof window !== 'undefined') {
  window.HUD = HUD;
}

