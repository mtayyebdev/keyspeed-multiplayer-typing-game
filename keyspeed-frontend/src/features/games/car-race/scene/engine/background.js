/**
 * Parallax Background Engine
 * Renders sunset sky with clouds, distant mountain ranges, and rolling hills
 * with multi-layered horizontal parallax responsive to road curvature and speed.
 */

export class BackgroundRenderer {
  constructor() {
    this.skyOffset = 0;
    this.mountainsOffset = 0;
    this.hillsOffset = 0;
    this.cloudOffset = 0;

    // Pre-calculated mountain peaks to prevent per-frame random jitter
    this.mountainPeaks = this.generatePeaks(30, 60, 140);
    this.hillPeaks = this.generatePeaks(40, 30, 80);
  }

  generatePeaks(count, minHeight, maxHeight) {
    const peaks = [];
    for (let i = 0; i <= count; i++) {
      // Deterministic smooth elevation
      const height = minHeight + ((Math.sin(i * 0.7) + Math.cos(i * 1.3) + 2) / 4) * (maxHeight - minHeight);
      peaks.push(height);
    }
    return peaks;
  }

  /**
   * Update parallax offsets based on current road curve and travel speed
   */
  update(curveOffset = 0, speed = 0, dt = 0.016) {
    const speedFactor = (speed / 300) * 80 * dt;
    this.cloudOffset = (this.cloudOffset + 6 * dt + speedFactor * 0.1) % 2000;
    this.skyOffset = (this.skyOffset - curveOffset * 0.2 + speedFactor * 0.05) % 2000;
    this.mountainsOffset = (this.mountainsOffset - curveOffset * 0.6 + speedFactor * 0.2) % 2000;
    this.hillsOffset = (this.hillsOffset - curveOffset * 1.2 + speedFactor * 0.5) % 2000;
  }

  /**
   * Draw complete background layers
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width - Display width
   * @param {number} height - Display height
   * @param {number} horizonY - Horizon screen Y coordinate
   * @param {string} themeAccent - Optional hex/rgba accent from theme
   */
  render(ctx, width, height, horizonY, themeAccent = null) {
    const horizon = Math.round(horizonY || height * 0.52);

    // 1. Sunset Sky Gradient (Dusk Purple -> Vivid Orange -> Warm Horizon)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
    skyGrad.addColorStop(0, '#120b24'); // Deep twilight indigo
    skyGrad.addColorStop(0.35, '#2f1542'); // Dusk magenta
    skyGrad.addColorStop(0.7, '#8b263e'); // Crimson sunset
    skyGrad.addColorStop(0.9, '#d9532f'); // Radiant amber
    skyGrad.addColorStop(1, '#f39c12'); // Golden horizon glow

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, horizon);

    // 2. Soft Fluffy Clouds drifting
    this.renderClouds(ctx, width, horizon);

    // 3. Distant Mountains Silhouette
    this.renderMountains(ctx, width, horizon);

    // 4. Mid-distance Rolling Hills
    this.renderHills(ctx, width, horizon);

    // 5. Subtle Horizon Haze / Ambient Bloom
    const hazeGrad = ctx.createLinearGradient(0, horizon - 25, 0, horizon + 10);
    hazeGrad.addColorStop(0, 'rgba(243, 156, 18, 0)');
    hazeGrad.addColorStop(0.7, 'rgba(243, 156, 18, 0.25)');
    hazeGrad.addColorStop(1, 'rgba(243, 156, 18, 0)');
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, horizon - 25, width, 35);
  }

  renderClouds(ctx, width, horizon) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 230, 210, 0.12)';

    const cloudSpacing = 260;
    const startX = -((this.cloudOffset) % cloudSpacing) - cloudSpacing;

    for (let x = startX; x < width + cloudSpacing; x += cloudSpacing) {
      const y = horizon * 0.28 + Math.sin(x * 0.01) * 15;
      ctx.beginPath();
      ctx.arc(x, y, 45, 0, Math.PI * 2);
      ctx.arc(x + 35, y - 10, 55, 0, Math.PI * 2);
      ctx.arc(x + 80, y - 5, 45, 0, Math.PI * 2);
      ctx.arc(x + 115, y, 35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderMountains(ctx, width, horizon) {
    ctx.save();
    ctx.fillStyle = '#21122e'; // Dark mountain silhouette

    const step = 80;
    const totalPoints = Math.ceil(width / step) + 4;
    const offset = Math.floor(this.mountainsOffset);

    ctx.beginPath();
    ctx.moveTo(0, horizon);

    for (let i = -2; i < totalPoints; i++) {
      const x = i * step + (offset % step);
      const peakIdx = Math.abs((i + Math.floor(offset / step) * 2) % this.mountainPeaks.length);
      const h = this.mountainPeaks[peakIdx];
      const y = horizon - h;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width + 20, horizon);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  renderHills(ctx, width, horizon) {
    ctx.save();
    // Warm dusk pine green/navy
    ctx.fillStyle = '#1c2420';

    const step = 60;
    const totalPoints = Math.ceil(width / step) + 4;
    const offset = Math.floor(this.hillsOffset);

    ctx.beginPath();
    ctx.moveTo(0, horizon);

    for (let i = -2; i < totalPoints; i++) {
      const x = i * step + (offset % step);
      const peakIdx = Math.abs((i + Math.floor(offset / step)) % this.hillPeaks.length);
      const h = this.hillPeaks[peakIdx];
      const y = horizon - h * 0.6;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width + 20, horizon);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
