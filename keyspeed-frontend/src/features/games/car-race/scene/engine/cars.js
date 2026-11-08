/**
 * Car Positioning & Rear-View Mirror Engine
 * Uses calibrated OutRun perspective projection to position all 4 cars
 * directly inside their assigned lanes on the track with dynamic depth scaling.
 */

import { CAMERA_CONFIG, project3D, lerp } from './projection.js';
import { CAR_COLORS } from './sprites.js';

export class CarManager {
  constructor() {
    this.carStates = new Map();
  }

  /**
   * Smoothly interpolate all players towards latest server updates
   */
  update(players = [], myPlayerId = '', totalTrackLength = 60000, dt = 0.016) {
    players.forEach((p, index) => {
      const pid = p.id || `p-${index}`;
      const targetProgress = Math.max(0, Math.min(100, p.progress || 0));
      const targetSpeed = p.speed || 0;
      const targetState = p.state || 'idle';

      // Staggered F1 starting grid formation
      const gridZ = (3 - (index % 4)) * 60;

      if (!this.carStates.has(pid)) {
        this.carStates.set(pid, {
          id: pid,
          userId: p.userId,
          username: p.username || `Racer ${index + 1}`,
          index,
          lane: index % 4, // 0: left, 1: center-left, 2: center-right, 3: right
          gridZ,
          progress: targetProgress,
          visualZ: (targetProgress / 100) * totalTrackLength,
          speed: targetSpeed,
          state: targetState,
          isPlayer: pid === myPlayerId || p.userId === myPlayerId,
        });
      } else {
        const state = this.carStates.get(pid);
        const targetZ = (targetProgress / 100) * totalTrackLength;
        state.visualZ = lerp(state.visualZ, targetZ, 0.18);
        state.progress = lerp(state.progress, targetProgress, 0.18);
        state.speed = lerp(state.speed, targetSpeed, 0.2);
        state.state = targetState;
        state.username = p.username || state.username;
        state.isPlayer = pid === myPlayerId || p.userId === myPlayerId;
      }
    });

    // Remove obsolete players
    const currentIds = new Set(players.map((p, idx) => p.id || `p-${idx}`));
    for (const [id] of this.carStates) {
      if (!currentIds.has(id)) {
        this.carStates.delete(id);
      }
    }
  }

  /**
   * Sort and partition cars into on-track (ahead/alongside camera) vs behind camera
   */
  getCarPlacements(myPlayerId, cameraZ, totalTrackLength) {
    let myCar = null;
    const carsAhead = [];
    const carsBehind = [];

    const myState = Array.from(this.carStates.values()).find(
      (c) => c.isPlayer || c.id === myPlayerId
    );
    myCar = myState || null;

    for (const car of this.carStates.values()) {
      const carActualZ = car.visualZ + (car.gridZ || 0);
      const relZ = carActualZ - cameraZ;

      if (car.isPlayer || car.id === myPlayerId) {
        myCar = { ...car, actualZ: carActualZ, relZ };
        continue;
      }

      // If car is in front of camera plane (relZ >= 400), it's visible on the road
      if (relZ >= 400) {
        carsAhead.push({
          ...car,
          actualZ: carActualZ,
          relZ,
        });
      } else {
        // Behind camera: show in top rear-view mirror
        carsBehind.push({
          ...car,
          actualZ: carActualZ,
          relZ,
        });
      }
    }

    // Sort cars on track by distance descending (farthest first so nearer cars occlude)
    carsAhead.sort((a, b) => b.actualZ - a.actualZ);

    return { myCar, carsAhead, carsBehind };
  }

  /**
   * Render all rival cars ahead or alongside on their respective road lanes
   */
  renderCarsAhead(ctx, carsAhead, roadSegments, screenWidth, screenHeight, spriteManager, themeAccent, cameraZ) {
    if (!carsAhead.length) return;
    const segmentCount = roadSegments?.length || 1;

    carsAhead.forEach((car) => {
      const relZ = car.actualZ - cameraZ;
      if (relZ < 400) return;

      const scale = CAMERA_CONFIG.DEPTH / relZ;
      const screenY = Math.round(screenHeight / 2 + scale * CAMERA_CONFIG.HEIGHT * (screenHeight / 2));
      const screenW = Math.round(scale * CAMERA_CONFIG.ROAD_WIDTH * (screenWidth / 2));
      const clampedW = Math.min(screenWidth * 0.44, Math.max(10, screenW));

      // Retrieve screen center X of road segment at car's distance
      const segIdx = Math.floor(car.actualZ / CAMERA_CONFIG.SEGMENT_LENGTH) % segmentCount;
      const segScreenX = roadSegments[segIdx]?.p1?.screen?.x ?? (screenWidth / 2);

      const laneOffsets = [-0.75, -0.25, 0.25, 0.75];
      const laneOffset = laneOffsets[car.lane % 4];
      const screenX = Math.round(segScreenX + clampedW * laneOffset);

      // Clamp Y to canvas bounds
      const clampedY = Math.min(screenHeight - 12, screenY);
      const carVisualScale = Math.min(0.62, Math.max(0.12, (clampedW * 0.32) / 192));

      if (clampedY < screenHeight * 0.48) return;

      ctx.save();
      const opacity = Math.min(1, Math.max(0.3, (carVisualScale - 0.1) / 0.15));
      ctx.globalAlpha = opacity;

      // Draw opponent car
      spriteManager.renderCar(ctx, screenX, clampedY, carVisualScale, {
        carIndex: car.index + 1,
        isBraking: car.state === 'stalled',
        isStalled: car.state === 'stalled',
        speed: car.speed,
        isPlayer: false,
        themeAccent,
      });

      // Name & Number Tag
      if (carVisualScale > 0.16) {
        this.renderNameTag(ctx, screenX, clampedY - 140 * carVisualScale, car.username, car.index + 1, carVisualScale);
      }

      ctx.restore();
    });
  }

  renderNameTag(ctx, x, y, username, racerNumber, scale) {
    ctx.save();
    const tagScale = Math.min(1.0, Math.max(0.65, scale * 2.5));
    ctx.translate(x, y);
    ctx.scale(tagScale, tagScale);

    const text = `${username} #${racerNumber}`;
    ctx.font = 'bold 10px monospace';
    const textWidth = ctx.measureText(text).width;
    const boxW = textWidth + 14;
    const boxH = 18;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-boxW / 2, -boxH, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, -boxH / 2);

    ctx.restore();
  }

  /**
   * Render Top Rear-View Mirror for competitors trailing behind the camera
   */
  renderRearViewMirror(ctx, width, carsBehind, myPlayer, themeAccent) {
    const mirrorW = Math.min(280, width * 0.55);
    const mirrorH = 38;
    const mirrorX = (width - mirrorW) / 2;
    const mirrorY = 6;

    ctx.save();

    // Mirror Bezel
    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(mirrorX, mirrorY, mirrorW, mirrorH, 9);
    ctx.fill();
    ctx.stroke();

    // Inner Glass
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(mirrorX + 2, mirrorY + 2, mirrorW - 4, mirrorH - 4, 7);
    ctx.clip();

    const mirrorGrad = ctx.createLinearGradient(0, mirrorY, 0, mirrorY + mirrorH);
    mirrorGrad.addColorStop(0, '#1e1435');
    mirrorGrad.addColorStop(0.5, '#2e1938');
    mirrorGrad.addColorStop(0.51, '#1b1f2b');
    mirrorGrad.addColorStop(1, '#0f121a');
    ctx.fillStyle = mirrorGrad;
    ctx.fillRect(mirrorX + 2, mirrorY + 2, mirrorW - 4, mirrorH - 4);

    const mCenter = mirrorX + mirrorW / 2;
    const mHorizon = mirrorY + mirrorH * 0.48;

    // Road lines in mirror
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mCenter - 6, mHorizon);
    ctx.lineTo(mCenter - mirrorW * 0.35, mirrorY + mirrorH);
    ctx.moveTo(mCenter + 6, mHorizon);
    ctx.lineTo(mCenter + mirrorW * 0.35, mirrorY + mirrorH);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('REAR VIEW', mirrorX + 8, mirrorY + 10);

    if (carsBehind.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TRACK CLEAR BEHIND', mCenter, mHorizon + 10);
    } else {
      carsBehind.forEach((car) => {
        const distBehind = Math.abs(car.relZ);
        const t = Math.min(1, distBehind / 6000);
        const mScale = 1.0 - t * 0.7;
        const carY = mHorizon + 2 + (1 - t) * (mirrorH * 0.4);

        const laneOffsets = [0.55, 0.18, -0.18, -0.55];
        const laneOffset = laneOffsets[car.lane % 4];
        const carX = mCenter + laneOffset * (mirrorW * 0.34) * (1 - t * 0.5);

        const palette = CAR_COLORS[car.index % CAR_COLORS.length];
        ctx.fillStyle = palette.body;
        const cw = 18 * mScale;
        const ch = 9 * mScale;
        ctx.beginPath();
        ctx.roundRect(carX - cw / 2, carY - ch, cw, ch, 2);
        ctx.fill();

        // Front Headlights
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(carX - cw * 0.35, carY - ch * 0.3, 1.8 * mScale, 0, Math.PI * 2);
        ctx.arc(carX + cw * 0.35, carY - ch * 0.3, 1.8 * mScale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        const distMeters = Math.max(1, Math.round(distBehind / 70));
        ctx.fillText(`-${distMeters}m`, carX, carY + 8);
      });
    }

    ctx.restore();
    ctx.restore();
  }
}
