/**
 * Pseudo-3D Road Engine
 * Builds segmented track geometry with seeded curves, hills, rumble strips,
 * multi-lane dashed markings, and projects segments from camera to horizon.
 */

import { CAMERA_CONFIG, project3D } from './projection.js';

export const ENABLE_CURVES = true;
export const LANE_COUNT = 4;

// Default visual colors for road & environment
export const ROAD_COLORS = {
  DARK: {
    road: '#1e222d',
    rumble: '#e63946',
    edge: '#ffffff',
    grass: '#151b18',
    lane: '#ffffff',
  },
  LIGHT: {
    road: '#252a38',
    rumble: '#f1faee',
    edge: '#ffffff',
    grass: '#1a221e',
    lane: '#ffffff',
  },
  FINISH_DARK: {
    road: '#111111',
    rumble: '#000000',
    edge: '#ffffff',
    grass: '#151b18',
    lane: '#ffffff',
  },
  FINISH_LIGHT: {
    road: '#ffffff',
    rumble: '#ffffff',
    edge: '#000000',
    grass: '#1a221e',
    lane: '#000000',
  },
};

/**
 * Deterministic 32-bit hash for text-based procedural seed
 */
export function hashString(str = '') {
  let hash = 2166136261;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Simple seeded pseudo-random generator (Mulberry32)
 */
export function createRng(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build a track segment array seeded by textId or text
 * @param {number} totalSegments - Number of segments (e.g. 500 - 1500)
 * @param {string} seedText - textId or race text for deterministic curves
 * @returns {Array<Object>} Segment objects
 */
export function buildRoad(totalSegments = 800, seedText = 'default-seed') {
  const seed = hashString(seedText);
  const rng = createRng(seed);

  const segments = [];
  let currentY = 0;
  let currentCurve = 0;

  // Generate curve & hill keypoints
  const curveSections = [];
  let sectionStart = 20; // Keep start straight
  while (sectionStart < totalSegments - 40) {
    const length = Math.floor(40 + rng() * 60);
    const curve = ENABLE_CURVES ? (rng() * 1.4 - 0.7) : 0; // Gentle, natural curve
    const hill = rng() * 300 - 150; // Gentle rolling hill
    curveSections.push({ start: sectionStart, length, curve, hill });
    sectionStart += length + Math.floor(20 + rng() * 30); // straight gap
  }

  for (let i = 0; i < totalSegments; i++) {
    // Check if in an active curve/hill section
    const activeSection = curveSections.find(
      (sec) => i >= sec.start && i < sec.start + sec.length
    );

    if (activeSection) {
      const progress = (i - activeSection.start) / activeSection.length;
      // Smooth sinusoidal transition
      const ease = Math.sin(progress * Math.PI);
      currentCurve = activeSection.curve * ease;
      currentY = activeSection.hill * ease;
    } else {
      currentCurve = 0;
      currentY = 0;
    }

    const isRumbleLight = Math.floor(i / 3) % 2 === 0;
    const isFinishLine = i >= totalSegments - 25 && i <= totalSegments - 5;

    let colors;
    if (isFinishLine) {
      colors = (i % 2 === 0) ? ROAD_COLORS.FINISH_DARK : ROAD_COLORS.FINISH_LIGHT;
    } else {
      colors = isRumbleLight ? ROAD_COLORS.LIGHT : ROAD_COLORS.DARK;
    }

    segments.push({
      index: i,
      p1: {
        world: {
          x: 0,
          y: currentY,
          z: i * CAMERA_CONFIG.SEGMENT_LENGTH,
          w: CAMERA_CONFIG.ROAD_WIDTH,
        },
        screen: { x: 0, y: 0, w: 0, scale: 0, visible: false },
      },
      p2: {
        world: {
          x: 0,
          y: currentY,
          z: (i + 1) * CAMERA_CONFIG.SEGMENT_LENGTH,
          w: CAMERA_CONFIG.ROAD_WIDTH,
        },
        screen: { x: 0, y: 0, w: 0, scale: 0, visible: false },
      },
      curve: currentCurve,
      colors,
      isFinishLine,
      sprites: [],
    });
  }

  return segments;
}

/**
 * Draw a polygon (quadrilateral) on 2D canvas context
 */
export function drawPolygon(ctx, x1, y1, x2, y2, x3, y3, x4, y4, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.lineTo(x4, y4);
  ctx.closePath();
  ctx.fill();
}

/**
 * Render a single projected segment: grass, rumble strips, road surface, and dashed lanes
 */
export function renderSegment(ctx, p1, p2, colors, isDashedLane = true) {
  const w1 = p1.w;
  const w2 = p2.w;
  const rumbleW1 = w1 * 1.15;
  const rumbleW2 = w2 * 1.15;

  // 1. Off-road grass strips (left & right)
  ctx.fillStyle = colors.grass;
  ctx.fillRect(0, p2.y, ctx.canvas.width / (window.devicePixelRatio || 1), p1.y - p2.y);

  // 2. Rumble strips (red & white curbs)
  drawPolygon(
    ctx,
    p1.x - rumbleW1, p1.y,
    p1.x - w1, p1.y,
    p2.x - w2, p2.y,
    p2.x - rumbleW2, p2.y,
    colors.rumble
  );
  drawPolygon(
    ctx,
    p1.x + w1, p1.y,
    p1.x + rumbleW1, p1.y,
    p2.x + rumbleW2, p2.y,
    p2.x + w2, p2.y,
    colors.rumble
  );

  // 3. Main asphalt road surface
  drawPolygon(
    ctx,
    p1.x - w1, p1.y,
    p1.x + w1, p1.y,
    p2.x + w2, p2.y,
    p2.x - w2, p2.y,
    colors.road
  );

  // 4. White outer boundary lines
  const edgeW1 = w1 * 0.03;
  const edgeW2 = w2 * 0.03;
  drawPolygon(
    ctx,
    p1.x - w1, p1.y,
    p1.x - w1 + edgeW1, p1.y,
    p2.x - w2 + edgeW2, p2.y,
    p2.x - w2, p2.y,
    colors.edge
  );
  drawPolygon(
    ctx,
    p1.x + w1 - edgeW1, p1.y,
    p1.x + w1, p1.y,
    p2.x + w2, p2.y,
    p2.x + w2 - edgeW2, p2.y,
    colors.edge
  );

  // 5. 4-Lane Divider Dashed Markings
  if (isDashedLane && colors.lane) {
    const laneMarkerW1 = w1 * 0.015;
    const laneMarkerW2 = w2 * 0.015;

    // 3 lane dividers for 4 lanes: at -0.5, 0, +0.5 of half road width
    const dividerOffsets = [-0.5, 0, 0.5];
    for (let d = 0; d < dividerOffsets.length; d++) {
      const offset = dividerOffsets[d];
      const lx1 = p1.x + w1 * offset;
      const lx2 = p2.x + w2 * offset;

      drawPolygon(
        ctx,
        lx1 - laneMarkerW1, p1.y,
        lx1 + laneMarkerW1, p1.y,
        lx2 + laneMarkerW2, p2.y,
        lx2 - laneMarkerW2, p2.y,
        colors.lane
      );
    }
  }
}

/**
 * Get screen coordinate for a specific lane (0 to 3) at a given segment
 * Lane 0: leftmost (-0.75)
 * Lane 1: center-left (-0.25)
 * Lane 2: center-right (+0.25)
 * Lane 3: rightmost (+0.75)
 */
export function getLanePosition(segmentScreen, laneIndex = 1) {
  const laneOffsets = [-0.75, -0.25, 0.25, 0.75];
  const offset = laneOffsets[Math.max(0, Math.min(3, laneIndex))];
  return {
    x: segmentScreen.x + segmentScreen.w * offset,
    y: segmentScreen.y,
    scale: segmentScreen.scale,
  };
}
