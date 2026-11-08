import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useRaceVisualState } from './useRaceVisualState.js';
import { BackgroundRenderer } from './engine/background.js';
import { SpriteManager } from './engine/sprites.js';
import { CarManager } from './engine/cars.js';
import { EffectsManager } from './engine/effects.js';
import { CAMERA_CONFIG, project3D, lerp } from './engine/projection.js';
import { renderSegment } from './engine/road.js';
import CarTrackView from '../CarTrackView';
import { AlertTriangle, Flag, Eye, Sparkles } from 'lucide-react';

/**
 * RaceCanvas - High-Performance Pseudo-3D "Behind-The-Car" OutRun Racing View.
 * - Perfectly aligned 4-lane track (cars never go off-road).
 * - All racers visible on the starting grid and dynamically positioned during race.
 * - Fullscreen-responsive (no vertical scrollbar).
 * - Automatic pause on tab blur, zero per-frame React state updates.
 */
export default function RaceCanvas({
  players = [],
  currentUserId,
  currentSocketId,
  currentUsername,
  status = 'idle',
  countdownSeconds = 0,
  text = '',
  textId = '',
  ownSpeed = 0,
  ownState = 'idle',
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('keyspeed_car_view') || '3d';
    } catch {
      return '3d';
    }
  });

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const next = prev === '3d' ? '2d' : '3d';
      try {
        localStorage.setItem('keyspeed_car_view', next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const visualStateRef = useRaceVisualState({
    players,
    currentUserId,
    currentSocketId,
    currentUsername,
    status,
    countdownSeconds,
    text,
    textId,
  });

  const enginesRef = useRef(null);
  if (!enginesRef.current) {
    enginesRef.current = {
      background: new BackgroundRenderer(),
      sprites: new SpriteManager(),
      cars: new CarManager(),
      effects: new EffectsManager(),
    };
  }

  const myPlayer = useMemo(() => {
    return (
      players.find(
        (p) =>
          (currentSocketId && p.id === currentSocketId) ||
          (currentUserId && p.userId === currentUserId) ||
          (currentUsername && p.username === currentUsername)
      ) || players[0]
    );
  }, [players, currentSocketId, currentUserId, currentUsername]);

  const isStalled = ownState === 'stalled';

  // Animation Loop (requestAnimationFrame)
  useEffect(() => {
    if (viewMode !== '3d') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId = null;
    let lastTime = performance.now();
    let isTabVisible = !document.hidden;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastTime = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const resizeCanvas = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      const displayW = Math.max(300, Math.floor(rect.width));
      // Adaptive height: fill container height completely without overflowing
      const displayH = Math.max(180, Math.min(380, Math.floor(rect.height || displayW * 0.45)));

      if (canvas.width !== displayW * dpr || canvas.height !== displayH * dpr) {
        canvas.width = displayW * dpr;
        canvas.height = displayH * dpr;
        canvas.style.width = `${displayW}px`;
        canvas.style.height = `${displayH}px`;
      }
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    resizeCanvas();

    const render = (currentTime) => {
      animationFrameId = requestAnimationFrame(render);
      if (!isTabVisible) return;

      const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      const { background, sprites, cars, effects } = enginesRef.current;
      const state = visualStateRef.current;

      // 1. Smoothly interpolate Player Speed and Progress
      const targetSpeed = myPlayer?.speed || 0;
      state.currentSpeed = lerp(state.currentSpeed, targetSpeed, 0.2);

      const targetProgress = Math.max(0, Math.min(100, myPlayer?.progress || 0));
      state.currentProgress = lerp(state.currentProgress, targetProgress, 0.16);

      // Player's actual world Z (including grid offset)
      const myGridZ = (3 - (state.myPlayerIndex % 4)) * 60;
      const playerActualZ = (state.currentProgress / 100) * state.totalTrackLength + myGridZ;

      // Camera smoothly trails behind player
      const targetCameraZ = Math.max(0, playerActualZ - CAMERA_CONFIG.CAMERA_BEHIND_CAR);
      state.cameraZ = lerp(state.cameraZ, targetCameraZ, 0.2);

      // Stall Effect
      if (state.shouldTriggerStall) {
        state.shouldTriggerStall = false;
        effects.triggerStall(width / 2, height - 30);
      }

      // Finish Trigger
      if (state.status === 'finished' || targetProgress >= 100) {
        effects.triggerFinish(width, height);
      }

      // Update cars subsystem
      cars.update(state.players, state.myPlayerId, state.totalTrackLength, dt);

      // Find current track segment
      const segmentCount = state.roadSegments.length;
      const baseIdx = Math.floor(state.cameraZ / CAMERA_CONFIG.SEGMENT_LENGTH);
      const currentSegment = state.roadSegments[baseIdx % segmentCount] || state.roadSegments[0];
      const curveOffset = currentSegment ? currentSegment.curve : 0;

      background.update(curveOffset, state.currentSpeed, dt);
      effects.update(state.currentSpeed, state.currentState, width / 2, height - 30, dt);

      ctx.save();
      ctx.scale(dpr, dpr);

      // Shake translation
      if (effects.shakeIntensity > 0) {
        ctx.translate(effects.shakeOffsetX, effects.shakeOffsetY);
      }

      // 2. Parallax Sky, Mountains, Hills
      const horizonY = height * 0.5;
      background.render(ctx, width, height, horizonY, state.themeAccent);

      // 3. Project Road Segments from Camera to Horizon
      const drawDistance = CAMERA_CONFIG.DRAW_DISTANCE;
      const finishSegmentIdx = segmentCount - 15;

      let x = 0;
      let dx = 0;

      const camHeight = CAMERA_CONFIG.HEIGHT;
      const camY = currentSegment ? currentSegment.p1.world.y : 0;

      for (let n = 0; n < drawDistance; n++) {
        const segIdx = (baseIdx + n) % segmentCount;
        const segment = state.roadSegments[segIdx];

        const looped = (baseIdx + n) >= segmentCount;
        const segZ = segment.p1.world.z + (looped ? state.totalTrackLength : 0);

        const camera = {
          x: 0,
          y: camHeight + camY,
          z: state.cameraZ,
          depth: CAMERA_CONFIG.DEPTH,
        };

        const p1World = {
          x: x,
          y: segment.p1.world.y,
          z: segZ,
          w: CAMERA_CONFIG.ROAD_WIDTH,
        };

        const p2World = {
          x: x + dx,
          y: segment.p2.world.y,
          z: segZ + CAMERA_CONFIG.SEGMENT_LENGTH,
          w: CAMERA_CONFIG.ROAD_WIDTH,
        };

        segment.p1.screen = project3D(p1World, camera, width, height);
        segment.p2.screen = project3D(p2World, camera, width, height);

        x += dx;
        dx += segment.curve;
      }

      // 4. Render Segments Back-to-Front (Far to Near)
      const bottomRoadW = width * 0.42;

      for (let n = drawDistance - 1; n >= 0; n--) {
        const segIdx = (baseIdx + n) % segmentCount;
        const segment = state.roadSegments[segIdx];
        const p1 = segment.p1.screen;
        const p2 = segment.p2.screen;

        if (!p1.visible || !p2.visible || p1.y <= horizonY) continue;

        const isDashed = segIdx % 3 === 0;
        renderSegment(ctx, p1, p2, segment.colors, isDashed);

        // Scenery: trees, lamps, billboards
        if (segIdx % 12 === 0) {
          const side = segIdx % 24 === 0 ? -1 : 1;
          const roadsideX = p1.x + (side < 0 ? -p1.w * 1.45 : p1.w * 1.45);
          sprites.renderSceneryObject(ctx, roadsideX, p1.y, p1.scale, 'tree', side);
        } else if (segIdx % 16 === 0) {
          const side = 1;
          const roadsideX = p1.x + p1.w * 1.35;
          sprites.renderSceneryObject(ctx, roadsideX, p1.y, p1.scale, 'lamp', side);
        } else if (segIdx % 45 === 0) {
          const side = -1;
          const roadsideX = p1.x - p1.w * 1.5;
          sprites.renderSceneryObject(ctx, roadsideX, p1.y, p1.scale, 'billboard', side);
        }

        // Start Gantry at track origin
        if (segIdx === 0 && (baseIdx + n) < segmentCount) {
          sprites.renderStartGantry(ctx, p1, p2, state.countdownSeconds, state.status === 'racing');
        }

        // Finish Line Arch
        if (segIdx === finishSegmentIdx) {
          sprites.renderFinishArch(ctx, p1, p2);
        }
      }

      // 5. Render All Competitor Cars Ahead or Alongside
      const { carsAhead, carsBehind } = cars.getCarPlacements(
        state.myPlayerId,
        state.cameraZ,
        state.totalTrackLength
      );

      cars.renderCarsAhead(
        ctx,
        carsAhead,
        state.roadSegments,
        width,
        height,
        sprites,
        state.themeAccent,
        state.cameraZ
      );

      // 6. Player's Own Car - Perfectly centered in its assigned lane
      const playerLaneOffsets = [-0.75, -0.25, 0.25, 0.75];
      const playerLane = playerLaneOffsets[state.myPlayerIndex % 4];
      const playerCarX = Math.round(width / 2 + bottomRoadW * playerLane);
      const playerCarY = height - 12;
      const playerCarScale = Math.min(0.62, Math.max(0.35, (bottomRoadW * 0.32) / 192));

      // Render twin dynamic exhaust flames
      effects.renderExhaustFlames(ctx, playerCarX, playerCarY, playerCarScale, state.currentSpeed, isStalled);

      // Render player car
      sprites.renderCar(ctx, playerCarX, playerCarY, playerCarScale, {
        carIndex: state.myPlayerIndex + 1,
        isBraking: isStalled,
        isStalled,
        speed: state.currentSpeed,
        isPlayer: true,
        themeAccent: state.themeAccent,
      });

      // 7. Visual Effects Overlay (Particles, Edge Lines, Stall Flash)
      effects.renderParticles(ctx);
      effects.renderSpeedLines(ctx, width, height, state.currentSpeed);
      effects.renderStallFlash(ctx, width, height);

      // 8. Top Rear-View Mirror
      cars.renderRearViewMirror(ctx, width, carsBehind, myPlayer, state.themeAccent);

      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resizeObserver.disconnect();
    };
  }, [viewMode, myPlayer, isStalled]);

  // 2D Lite fallback mode
  if (viewMode === '2d') {
    return (
      <div className="w-full flex flex-col gap-1.5 h-full justify-center">
        <div className="flex items-center justify-end">
          <button
            onClick={toggleViewMode}
            className="flex items-center gap-1 text-[11px] text-fg/70 hover:text-fg px-2.5 py-0.5 rounded-lg bg-surface border border-border hover:border-accent transition-all cursor-pointer font-mono"
          >
            <Sparkles className="w-3 h-3 text-accent" />
            <span>Switch to 3D View</span>
          </button>
        </div>
        <CarTrackView
          players={players}
          currentUserId={currentUserId}
          currentSocketId={currentSocketId}
          currentUsername={currentUsername}
          ownSpeed={ownSpeed}
          ownState={ownState}
        />
      </div>
    );
  }

  // 3D OutRun-style View
  return (
    <div className="w-full h-full flex flex-col gap-1 select-none overflow-hidden justify-center">
      {/* Slim Progress Bar */}
      <div className="w-full bg-surface/90 border border-border rounded-lg px-2.5 py-1 shadow-sm shrink-0 flex items-center justify-between gap-2 text-[10px] font-mono text-fg/70">
        <div className="flex items-center gap-1 font-bold">
          <Flag className="w-3 h-3 text-accent" />
          <span>START</span>
        </div>

        {/* Mini progress line with racers */}
        <div className="relative flex-1 h-2 bg-bg rounded-full overflow-visible border border-border mx-2">
          {players.map((p, idx) => {
            const isMe =
              (currentSocketId && p.id === currentSocketId) ||
              (currentUserId && p.userId === currentUserId) ||
              (currentUsername && p.username === currentUsername);
            const progress = Math.min(100, Math.max(0, p.progress || 0));

            return (
              <div
                key={p.id || idx}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-150 z-10"
                style={{ left: `${Math.min(98, Math.max(2, progress))}%` }}
                title={`${p.username}: ${progress}%`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-mono font-black border shadow-sm ${
                    isMe
                      ? 'bg-accent text-bg border-accent scale-110 ring-1 ring-accent/40'
                      : 'bg-surface text-fg border-border-strong'
                  }`}
                >
                  {idx + 1}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleViewMode}
            title="Toggle 2D Lite Mode"
            className="text-[9px] font-mono text-fg/60 hover:text-fg px-1.5 py-0.5 rounded bg-bg border border-border hover:border-strong transition-all cursor-pointer flex items-center gap-1"
          >
            <Eye className="w-2.5 h-2.5 text-accent" />
            <span>2D Lite</span>
          </button>
          <div className="flex items-center gap-1 font-bold text-accent">
            <span>FINISH 🏁</span>
          </div>
        </div>
      </div>

      {/* Main 3D Canvas Stage */}
      <div
        ref={containerRef}
        className={`relative w-full flex-1 min-h-[160px] max-h-[380px] border border-border-strong rounded-xl overflow-hidden bg-bg shadow-sm flex items-center justify-center ${
          isStalled ? 'ring-2 ring-danger' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-default select-none pointer-events-none"
        />

        {/* Engine Stalled Warning Overlay */}
        {isStalled && (
          <div className="absolute inset-0 bg-danger/15 z-30 pointer-events-none flex items-center justify-center backdrop-blur-[1px]">
            <div className="px-3 py-1.5 rounded-lg bg-surface border-2 border-danger text-danger flex items-center gap-2 font-mono font-extrabold text-xs uppercase tracking-wider shadow-card animate-bounce">
              <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
              <span>ENGINE STALLED • PRESS BACKSPACE TO RECOVER</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
