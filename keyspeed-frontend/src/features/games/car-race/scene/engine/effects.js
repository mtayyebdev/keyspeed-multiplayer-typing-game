/**
 * Visual Effects & Particle Engine
 * Pre-allocated particle pools (zero GC), exhaust flames, smoke puffs on stall,
 * high-speed edge lines, screen shake, and stall red flashes.
 * Automatically respects prefers-reduced-motion.
 */

class ParticlePool {
  constructor(size = 120) {
    this.pool = new Array(size);
    for (let i = 0; i < size; i++) {
      this.pool[i] = {
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 0,
        alpha: 0,
        color: '#ffffff',
        life: 0,
        maxLife: 1,
      };
    }
  }

  emit(x, y, vx, vy, size, color, maxLife = 0.6) {
    const p = this.pool.find((item) => !item.active);
    if (!p) return;

    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.size = size;
    p.color = color;
    p.life = 0;
    p.maxLife = maxLife;
    p.alpha = 1;
  }

  update(dt = 0.016) {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // Fade out
      p.alpha = Math.max(0, 1 - (p.life / p.maxLife));
      // Expand slightly
      p.size += 15 * dt;
    }
  }

  render(ctx) {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active || p.alpha <= 0.01) continue;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  reset() {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].active = false;
    }
  }
}

export class EffectsManager {
  constructor() {
    this.smokePool = new ParticlePool(80);
    this.confettiPool = new ParticlePool(100);

    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    this.stallFlashAlpha = 0;
    this.flameFlicker = 0;
    this.hasFinished = false;

    // Check media query for reduced motion
    this.prefersReducedMotion = false;
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;
      mediaQuery.addEventListener?.('change', (e) => {
        this.prefersReducedMotion = e.matches;
      });
    }

    // Pre-allocated speed line points
    this.speedLines = [];
    for (let i = 0; i < 20; i++) {
      this.speedLines.push({
        x: 0,
        y: 0,
        len: 0,
        side: i % 2 === 0 ? -1 : 1,
        speed: 1 + (i % 5) * 0.2,
      });
    }
  }

  triggerStall(carX, carY) {
    this.stallFlashAlpha = 0.5;
    if (!this.prefersReducedMotion) {
      this.shakeIntensity = 8;
    }

    // Emit smoke puffs
    for (let i = 0; i < 18; i++) {
      const vx = (Math.random() - 0.5) * 70;
      const vy = -30 - Math.random() * 60;
      const size = 6 + Math.random() * 8;
      const smokeColor = Math.random() > 0.5 ? 'rgba(200, 200, 200, 0.7)' : 'rgba(120, 120, 130, 0.6)';
      this.smokePool.emit(carX + (Math.random() - 0.5) * 40, carY - 10, vx, vy, size, smokeColor, 0.7);
    }
  }

  triggerFinish(width, height) {
    if (this.hasFinished) return;
    this.hasFinished = true;

    // Emit celebratory confetti particles
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff'];
    for (let i = 0; i < 80; i++) {
      const x = width * 0.2 + Math.random() * (width * 0.6);
      const y = height * 0.3;
      const vx = (Math.random() - 0.5) * 160;
      const vy = -100 - Math.random() * 150;
      const color = colors[i % colors.length];
      this.confettiPool.emit(x, y, vx, vy, 4 + Math.random() * 3, color, 1.8);
    }
  }

  update(speed, state, carX, carY, dt = 0.016) {
    // 1. Shake decay
    if (this.shakeIntensity > 0) {
      if (this.prefersReducedMotion) {
        this.shakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      } else {
        this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
        this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
        this.shakeIntensity = Math.max(0, this.shakeIntensity - 18 * dt);
      }
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    // 2. High speed camera vibration
    if (speed > 190 && !this.prefersReducedMotion) {
      const speedVibe = ((speed - 190) / 130) * 2.5;
      this.shakeOffsetX += (Math.random() - 0.5) * speedVibe;
      this.shakeOffsetY += (Math.random() - 0.5) * speedVibe;
    }

    // 3. Stall flash decay
    if (this.stallFlashAlpha > 0) {
      this.stallFlashAlpha = Math.max(0, this.stallFlashAlpha - 1.5 * dt);
    }

    // 4. Flame flicker
    this.flameFlicker = (this.flameFlicker + dt * 25) % (Math.PI * 2);

    // 5. Smoke continuous puffs when stalled
    if (state === 'stalled') {
      if (Math.random() > 0.4) {
        const vx = (Math.random() - 0.5) * 30;
        const vy = -20 - Math.random() * 30;
        this.smokePool.emit(carX + (Math.random() - 0.5) * 30, carY - 15, vx, vy, 8, 'rgba(180, 180, 190, 0.5)', 0.6);
      }
    }

    this.smokePool.update(dt);
    this.confettiPool.update(dt);
  }

  /**
   * Render glowing twin exhaust flame jets from car exhaust tips
   */
  renderExhaustFlames(ctx, cx, cy, scale, speed, isStalled) {
    if (speed < 100 || isStalled || this.prefersReducedMotion) return;

    // Intensity scales with speed from 100 km/h to 320 km/h
    const factor = Math.min(1.5, Math.max(0.2, (speed - 100) / 160));
    const flicker = Math.sin(this.flameFlicker) * 0.2 + 0.8;
    const flameLen = 42 * factor * flicker * scale;
    const flameW = 10 * factor * flicker * scale;

    ctx.save();
    // Left & right exhaust positions matching procedural car tips (-56, +56 at scale)
    const exhaustOffsets = [-56 * scale, 56 * scale];
    const exhaustY = cy - 22 * scale;

    exhaustOffsets.forEach((ox) => {
      const ex = cx + ox;

      // Outer orange flame cone
      ctx.fillStyle = 'rgba(249, 115, 22, 0.85)';
      ctx.beginPath();
      ctx.moveTo(ex - flameW, exhaustY);
      ctx.lineTo(ex + flameW, exhaustY);
      ctx.lineTo(ex, exhaustY + flameLen);
      ctx.closePath();
      ctx.fill();

      // Inner cyan/white hot core
      ctx.fillStyle = 'rgba(56, 189, 248, 0.95)';
      ctx.beginPath();
      ctx.moveTo(ex - flameW * 0.4, exhaustY);
      ctx.lineTo(ex + flameW * 0.4, exhaustY);
      ctx.lineTo(ex, exhaustY + flameLen * 0.55);
      ctx.closePath();
      ctx.fill();
    });

    ctx.restore();
  }

  /**
   * Render high-speed peripheral blur lines at canvas edges (>170 km/h)
   */
  renderSpeedLines(ctx, width, height, speed) {
    if (speed < 170 || this.prefersReducedMotion) return;

    const alpha = Math.min(0.4, (speed - 170) / 150);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 1.5;

    const horizonY = height * 0.52;
    const cx = width / 2;

    for (let i = 0; i < this.speedLines.length; i++) {
      const line = this.speedLines[i];
      const isLeft = line.side < 0;

      const startX = isLeft ? Math.random() * (width * 0.2) : width - Math.random() * (width * 0.2);
      const startY = horizonY + Math.random() * (height - horizonY);

      // Radiate away from horizon center
      const angle = Math.atan2(startY - horizonY, startX - cx);
      const len = 40 + Math.random() * 50;
      const endX = startX + Math.cos(angle) * len;
      const endY = startY + Math.sin(angle) * len;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Render edge red vignette flash on engine stall
   */
  renderStallFlash(ctx, width, height) {
    if (this.stallFlashAlpha <= 0.01) return;

    ctx.save();
    const grad = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.35,
      width / 2, height / 2, Math.max(width, height) * 0.75
    );
    grad.addColorStop(0, 'rgba(239, 68, 68, 0)');
    grad.addColorStop(1, `rgba(239, 68, 68, ${this.stallFlashAlpha})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  renderParticles(ctx) {
    this.smokePool.render(ctx);
    this.confettiPool.render(ctx);
  }
}
