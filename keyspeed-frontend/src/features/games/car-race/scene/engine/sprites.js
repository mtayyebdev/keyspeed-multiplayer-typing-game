/**
 * Sprites & Scenery Engine
 * Manages sprite loading, procedural rear-view car rendering (fallback),
 * roadside scenery (trees, lamp posts, barriers), start gantry, and finish arch.
 */

// Distinct high-contrast motorsport racing liveries
export const CAR_COLORS = [
  { body: '#10b981', trim: '#047857', spoiler: '#064e3b', light: '#34d399', name: 'Emerald' }, // Player 1 (Accent)
  { body: '#0284c7', trim: '#0369a1', spoiler: '#0c4a6e', light: '#38bdf8', name: 'Sapphire' }, // Player 2
  { body: '#ea580c', trim: '#c2410c', spoiler: '#7c2d12', light: '#fb923c', name: 'Amber' },    // Player 3
  { body: '#9333ea', trim: '#7e22ce', spoiler: '#581c87', light: '#c084fc', name: 'Amethyst' }, // Player 4
];

export class SpriteManager {
  constructor() {
    this.images = new Map();
    this.loadFailed = new Set();
    this.preloadSprites();
  }

  preloadSprites() {
    // Attempt to preload cars 1 to 4
    for (let i = 1; i <= 4; i++) {
      const src = `/assets/cars/car-${i}.png`;
      const img = new Image();
      img.onload = () => {
        this.images.set(`car-${i}`, img);
      };
      img.onerror = () => {
        this.loadFailed.add(`car-${i}`);
      };
      img.src = src;
    }
  }

  getCarImage(index = 1) {
    const key = `car-${index}`;
    if (this.images.has(key)) {
      return this.images.get(key);
    }
    return null;
  }

  /**
   * Render rear-view car at screen position (cx, cy) scaled by given scale factor
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cx - Center X
   * @param {number} cy - Bottom/Center Y
   * @param {number} scale - Perspective scale factor
   * @param {Object} options - { carIndex, isBraking, isStalled, speed, isPlayer, themeAccent }
   */
  renderCar(ctx, cx, cy, scale, options = {}) {
    const {
      carIndex = 1,
      isBraking = false,
      isStalled = false,
      speed = 0,
      isPlayer = false,
      themeAccent = null,
    } = options;

    const img = this.getCarImage(carIndex);
    const carWidth = Math.round(300 * scale);
    const carHeight = Math.round(170 * scale);

    if (img && img.complete && img.naturalWidth > 0) {
      // Draw image sprite
      const x = cx - carWidth / 2;
      const y = cy - carHeight;
      ctx.drawImage(img, x, y, carWidth, carHeight);

      // Draw brake lights overlay if braking or stalled
      if (isBraking || isStalled) {
        this.drawBrakeLightsOverlay(ctx, cx, cy, scale);
      }
      return;
    }

    // Procedural Fallback Car Renderer (Pure Canvas 2D)
    this.renderProceduralCar(ctx, cx, cy, scale, {
      carIndex,
      isBraking,
      isStalled,
      speed,
      isPlayer,
      themeAccent,
    });
  }

  /**
   * High-detail Procedural Sports Car (Rear View)
   */
  renderProceduralCar(ctx, cx, cy, scale, options) {
    const {
      carIndex = 1,
      isBraking = false,
      isStalled = false,
      isPlayer = false,
      themeAccent = null,
    } = options;

    const palette = CAR_COLORS[(carIndex - 1) % CAR_COLORS.length];
    const bodyColor = (isPlayer && themeAccent) ? themeAccent : palette.body;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // 1. Contact Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, -6, 120, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Wide Racing Tires (Left & Right)
    ctx.fillStyle = '#111215';
    // Left tire
    ctx.beginPath();
    ctx.roundRect(-108, -50, 32, 48, 6);
    ctx.fill();
    // Right tire
    ctx.beginPath();
    ctx.roundRect(76, -50, 32, 48, 6);
    ctx.fill();

    // Tire tread lines
    ctx.fillStyle = '#1c1e24';
    ctx.fillRect(-104, -46, 24, 6);
    ctx.fillRect(-104, -30, 24, 6);
    ctx.fillRect(80, -46, 24, 6);
    ctx.fillRect(80, -30, 24, 6);

    // 3. Lower Rear Diffuser & Twin Exhausts
    ctx.fillStyle = '#15171c';
    ctx.beginPath();
    ctx.roundRect(-80, -38, 160, 28, [0, 0, 8, 8]);
    ctx.fill();

    // Diffuser fins
    ctx.fillStyle = '#0a0b0d';
    ctx.fillRect(-35, -34, 4, 20);
    ctx.fillRect(-12, -34, 4, 20);
    ctx.fillRect(12, -34, 4, 20);
    ctx.fillRect(35, -34, 4, 20);

    // Twin Polished Exhaust Tips
    ctx.fillStyle = '#9ca3af';
    ctx.beginPath();
    ctx.arc(-56, -22, 9, 0, Math.PI * 2);
    ctx.arc(56, -22, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(-56, -22, 6, 0, Math.PI * 2);
    ctx.arc(56, -22, 6, 0, Math.PI * 2);
    ctx.fill();

    // 4. Aerodynamic Rear Bumper & Main Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-96, -72, 192, 48, [12, 12, 6, 6]);
    ctx.fill();

    // Subtle metallic highlight across bumper
    const bodyHighlight = ctx.createLinearGradient(0, -72, 0, -24);
    bodyHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    bodyHighlight.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    bodyHighlight.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = bodyHighlight;
    ctx.beginPath();
    ctx.roundRect(-96, -72, 192, 48, [12, 12, 6, 6]);
    ctx.fill();

    // 5. Cockpit Cabin & Tinted Rear Window
    ctx.fillStyle = palette.trim;
    ctx.beginPath();
    ctx.moveTo(-66, -72);
    ctx.lineTo(-48, -120);
    ctx.lineTo(48, -120);
    ctx.lineTo(66, -72);
    ctx.closePath();
    ctx.fill();

    // Dark Tinted Rear Window Glass
    const windowGrad = ctx.createLinearGradient(0, -116, 0, -74);
    windowGrad.addColorStop(0, '#111827');
    windowGrad.addColorStop(1, '#1f2937');
    ctx.fillStyle = windowGrad;
    ctx.beginPath();
    ctx.moveTo(-58, -74);
    ctx.lineTo(-42, -114);
    ctx.lineTo(42, -114);
    ctx.lineTo(58, -74);
    ctx.closePath();
    ctx.fill();

    // Glass Reflection streak
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(-20, -114);
    ctx.lineTo(10, -114);
    ctx.lineTo(-5, -74);
    ctx.lineTo(-35, -74);
    ctx.closePath();
    ctx.fill();

    // 6. GT Racing Spoiler on Dual Struts
    ctx.fillStyle = '#0f172a';
    // Struts
    ctx.fillRect(-52, -132, 6, 20);
    ctx.fillRect(46, -132, 6, 20);

    // Spoiler Wing
    ctx.fillStyle = palette.spoiler;
    ctx.beginPath();
    ctx.roundRect(-92, -142, 184, 14, 4);
    ctx.fill();

    // Spoiler Endplates
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-96, -148, 6, 24);
    ctx.fillRect(90, -148, 6, 24);

    // 7. Dual LED Taillights (Running vs Braking/Stalled)
    const isLit = isBraking || isStalled;
    const lightGlow = isLit ? 'rgba(255, 20, 20, 0.85)' : 'rgba(180, 20, 20, 0.4)';
    const lightCore = isLit ? '#ff3b3b' : '#991b1b';

    // Left Taillight
    ctx.fillStyle = lightGlow;
    ctx.beginPath();
    ctx.roundRect(-86, -64, 40, 14, 3);
    ctx.fill();
    ctx.fillStyle = lightCore;
    ctx.beginPath();
    ctx.roundRect(-84, -62, 36, 10, 2);
    ctx.fill();

    // Right Taillight
    ctx.fillStyle = lightGlow;
    ctx.beginPath();
    ctx.roundRect(46, -64, 40, 14, 3);
    ctx.fill();
    ctx.fillStyle = lightCore;
    ctx.beginPath();
    ctx.roundRect(48, -62, 36, 10, 2);
    ctx.fill();

    // License Plate / Racer Tag
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-28, -50, 56, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`P${carIndex}`, 0, -42);

    ctx.restore();
  }

  drawBrakeLightsOverlay(ctx, cx, cy, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(255, 30, 30, 0.9)';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 15;
    ctx.fillRect(-85, -64, 38, 12);
    ctx.fillRect(47, -64, 38, 12);
    ctx.restore();
  }

  /**
   * Render roadside scenery object (Tree, Lamp post, Billboard)
   */
  renderSceneryObject(ctx, x, y, scale, type = 'tree', side = -1) {
    if (scale <= 0.005) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    if (type === 'tree') {
      // Trunk
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(-8, -40, 16, 40);

      // Foliage layers (Dusk pine tree)
      ctx.fillStyle = '#143622';
      ctx.beginPath();
      ctx.moveTo(-50, -35);
      ctx.lineTo(0, -110);
      ctx.lineTo(50, -35);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#1b4d31';
      ctx.beginPath();
      ctx.moveTo(-40, -75);
      ctx.lineTo(0, -145);
      ctx.lineTo(40, -75);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#236340';
      ctx.beginPath();
      ctx.moveTo(-30, -115);
      ctx.lineTo(0, -170);
      ctx.lineTo(30, -115);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'lamp') {
      // Highway Street Lamp
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -160);
      ctx.lineTo(side < 0 ? 35 : -35, -180);
      ctx.stroke();

      // Lamp Head
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(side < 0 ? 35 : -35, -180, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'billboard') {
      // Racing Sponsor Billboard
      ctx.fillStyle = '#374151';
      ctx.fillRect(-6, -70, 12, 70);

      ctx.fillStyle = '#111827';
      ctx.fillRect(-60, -140, 120, 70);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(-60, -140, 120, 70);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('KEYSPEED', 0, -100);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px sans-serif';
      ctx.fillText('GRAND PRIX', 0, -82);
    }

    ctx.restore();
  }

  /**
   * Render Start Gantry across the road with 5 lights
   */
  renderStartGantry(ctx, p1, p2, countdownSeconds = 0, isRacing = false) {
    const cx = (p1.x + p2.x) / 2;
    const cy = Math.min(p1.y, p2.y);
    const scale = p1.scale;
    const roadW = p1.w;

    if (scale <= 0.005) return;

    ctx.save();
    const gantryW = roadW * 2.3;
    const gantryH = 140 * scale;

    // Dual Support Pillars
    ctx.fillStyle = '#374151';
    ctx.fillRect(cx - gantryW / 2, cy - gantryH, 18 * scale, gantryH);
    ctx.fillRect(cx + gantryW / 2 - 18 * scale, cy - gantryH, 18 * scale, gantryH);

    // Overhead Bridge Beam
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(cx - gantryW / 2, cy - gantryH, gantryW, 36 * scale);

    // 5 Formula 1 Style Countdown Lights
    const lightSpacing = 28 * scale;
    const startX = cx - 2 * lightSpacing;
    const lightRadius = 9 * scale;

    // In a 5-second countdown: 5: 1 red, 4: 2 reds, 3: 3 reds, 2: 4 reds, 1: 5 reds, 0: GO (off/green)
    let litCount = 0;
    if (!isRacing && countdownSeconds > 0) {
      litCount = Math.min(5, Math.max(0, 6 - countdownSeconds));
    }

    for (let i = 0; i < 5; i++) {
      const lx = startX + i * lightSpacing;
      const ly = cy - gantryH + 18 * scale;

      // Dark housing
      ctx.fillStyle = '#0a0a0c';
      ctx.beginPath();
      ctx.arc(lx, ly, lightRadius + 2 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Lamp bulb
      if (isRacing) {
        // Green GO
        ctx.fillStyle = '#10b981';
      } else if (i < litCount) {
        // Lit Red
        ctx.fillStyle = '#ef4444';
      } else {
        // Unlit Dark
        ctx.fillStyle = '#450a0a';
      }
      ctx.beginPath();
      ctx.arc(lx, ly, lightRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Render Grand Finish Line Arch with Checkered Flag
   */
  renderFinishArch(ctx, p1, p2) {
    const cx = (p1.x + p2.x) / 2;
    const cy = Math.min(p1.y, p2.y);
    const scale = p1.scale;
    const roadW = p1.w;

    if (scale <= 0.005) return;

    ctx.save();
    const gantryW = roadW * 2.3;
    const gantryH = 150 * scale;

    // Pillars
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - gantryW / 2, cy - gantryH, 20 * scale, gantryH);
    ctx.fillRect(cx + gantryW / 2 - 20 * scale, cy - gantryH, 20 * scale, gantryH);

    // Top Banner
    const bannerH = 46 * scale;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - gantryW / 2, cy - gantryH, gantryW, bannerH);

    // Checkered strip across bottom of banner
    const checkerSize = 10 * scale;
    const cols = Math.floor(gantryW / checkerSize);
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = c % 2 === 0 ? '#ffffff' : '#000000';
      ctx.fillRect(cx - gantryW / 2 + c * checkerSize, cy - gantryH + bannerH - checkerSize, checkerSize, checkerSize);
    }

    // Text: FINISH
    ctx.fillStyle = '#f8fafc';
    ctx.font = `bold ${Math.max(10, Math.round(22 * scale))}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏁 FINISH 🏁', cx, cy - gantryH + bannerH / 2 - 3 * scale);

    ctx.restore();
  }
}
