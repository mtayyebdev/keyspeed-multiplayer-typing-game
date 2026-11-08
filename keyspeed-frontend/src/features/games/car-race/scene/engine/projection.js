/**
 * Pseudo-3D Perspective Projection Engine (OutRun / Classic Arcade Style)
 * Converts 3D world space (X: horizontal, Y: elevation, Z: distance)
 * to 2D screen coordinates (x, y, w, scale) based on camera position and depth.
 */

export const CAMERA_CONFIG = {
  HEIGHT: 800, // Camera height above road
  DEPTH: 0.84, // Perspective depth factor
  DRAW_DISTANCE: 250, // Number of segments rendered ahead
  ROAD_WIDTH: 700, // World road width calibrated to screen aspect
  SEGMENT_LENGTH: 200, // Length of one road segment
  CAMERA_BEHIND_CAR: 750, // World units camera trails behind player car
};

/**
 * Project a 3D world coordinate to 2D screen space.
 * @param {Object} worldPoint - { x, y, z, w }
 * @param {Object} camera - { x, y, z, depth }
 * @param {number} screenWidth - Canvas width in CSS/display pixels
 * @param {number} screenHeight - Canvas height in CSS/display pixels
 * @returns {Object} { visible: boolean, x: number, y: number, w: number, scale: number }
 */
export function project3D(worldPoint, camera, screenWidth, screenHeight) {
  const relX = worldPoint.x - (camera.x || 0);
  const relY = worldPoint.y - (camera.y || CAMERA_CONFIG.HEIGHT);
  const relZ = worldPoint.z - camera.z;

  // Behind camera or at camera plane
  if (relZ <= 0) {
    return {
      visible: false,
      x: screenWidth / 2,
      y: screenHeight,
      w: 0,
      scale: 0,
    };
  }

  const cameraDepth = camera.depth || CAMERA_CONFIG.DEPTH;
  const scale = cameraDepth / relZ;

  const screenX = Math.round((screenWidth / 2) + (scale * relX * (screenWidth / 2)));
  const screenY = Math.round((screenHeight / 2) - (scale * relY * (screenHeight / 2)));
  const screenW = Math.round(scale * (worldPoint.w || CAMERA_CONFIG.ROAD_WIDTH) * (screenWidth / 2));

  return {
    visible: true,
    x: screenX,
    y: screenY,
    w: screenW,
    scale,
  };
}

/**
 * Linear interpolation helper with optional clamping
 */
export function lerp(start, end, t, clamp = true) {
  const val = start + (end - start) * t;
  if (!clamp) return val;
  const min = Math.min(start, end);
  const max = Math.max(start, end);
  return Math.min(max, Math.max(min, val));
}

/**
 * Exponential ease-out interpolation for smooth camera & car tracking
 */
export function expDecay(current, target, decayRate, dt) {
  return target + (current - target) * Math.exp(-decayRate * dt);
}

/**
 * Convert progress difference to world Z relative distance.
 * @param {number} targetProgress - Progress percent (0 - 100)
 * @param {number} baseProgress - Reference progress percent (0 - 100)
 * @param {number} totalTrackDistance - World track length (e.g. 50000)
 * @returns {number} deltaZ in world units (positive = ahead, negative = behind)
 */
export function progressToWorldZ(targetProgress, baseProgress, totalTrackDistance = 60000) {
  const progressDelta = (targetProgress - baseProgress) / 100;
  return progressDelta * totalTrackDistance;
}
