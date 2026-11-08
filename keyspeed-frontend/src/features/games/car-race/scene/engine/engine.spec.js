import assert from 'node:assert';
import { project3D, lerp, expDecay, progressToWorldZ, CAMERA_CONFIG } from './projection.js';
import { hashString, createRng, buildRoad, getLanePosition } from './road.js';

console.log('--- Testing Pseudo-3D Engine Pure Math & Road Functions ---');

// 1. Projection tests
{
  const camera = { x: 0, y: 1000, z: 0, depth: 0.84 };
  const pointAhead = { x: 0, y: 0, z: 1000, w: 2000 };
  const projAhead = project3D(pointAhead, camera, 800, 600);

  assert.strictEqual(projAhead.visible, true, 'Point ahead should be visible');
  assert.strictEqual(projAhead.scale, 0.84 / 1000, 'Scale should match cameraDepth / relZ');
  assert.strictEqual(projAhead.x, 400, 'Screen X should be centered at 400');
  assert.ok(projAhead.w > 0, 'Road width should be projected');

  const pointBehind = { x: 0, y: 0, z: -50, w: 2000 };
  const projBehind = project3D(pointBehind, camera, 800, 600);
  assert.strictEqual(projBehind.visible, false, 'Point behind camera must not be visible');
  assert.strictEqual(projBehind.scale, 0, 'Scale behind camera should be 0');
  console.log('✓ project3D tests passed');
}

// 2. Interpolation tests
{
  assert.strictEqual(lerp(0, 100, 0.5), 50, 'Lerp midpoint');
  assert.strictEqual(lerp(0, 100, 1.5, true), 100, 'Lerp clamp max');
  assert.strictEqual(lerp(0, 100, -0.5, true), 0, 'Lerp clamp min');
  assert.strictEqual(lerp(0, 100, 1.5, false), 150, 'Lerp un-clamped');

  const decayed = expDecay(100, 0, 5, 0.016);
  assert.ok(decayed < 100 && decayed > 0, 'Decay should progress towards target');
  console.log('✓ lerp and expDecay tests passed');
}

// 3. Progress to World Z tests
{
  const deltaAhead = progressToWorldZ(50, 40, 60000);
  assert.strictEqual(deltaAhead, 6000, 'Ahead progress maps to positive world units');

  const deltaBehind = progressToWorldZ(30, 40, 60000);
  assert.strictEqual(deltaBehind, -6000, 'Behind progress maps to negative world units');
  console.log('✓ progressToWorldZ tests passed');
}

// 4. Deterministic Seed & Hash tests
{
  const hash1 = hashString('race-text-sample-1');
  const hash2 = hashString('race-text-sample-1');
  const hash3 = hashString('race-text-sample-2');

  assert.strictEqual(hash1, hash2, 'Hash must be strictly deterministic');
  assert.notStrictEqual(hash1, hash3, 'Different seed strings produce different hashes');

  const rng1 = createRng(hash1);
  const rng2 = createRng(hash2);
  for (let i = 0; i < 10; i++) {
    assert.strictEqual(rng1(), rng2(), `RNG step ${i} matches for identical seeds`);
  }
  console.log('✓ hashString and createRng tests passed');
}

// 5. Build Road tests
{
  const road1 = buildRoad(600, 'room-text-id-123');
  const road2 = buildRoad(600, 'room-text-id-123');

  assert.strictEqual(road1.length, 600, 'Road segments count matches');
  assert.strictEqual(road1[50].curve, road2[50].curve, 'Road curves are deterministic across players');
  assert.strictEqual(road1[50].p1.world.y, road2[50].p1.world.y, 'Road elevation is deterministic across players');

  // Verify finish line segments
  const finishSegment = road1[590];
  assert.strictEqual(finishSegment.isFinishLine, true, 'End segments flagged as finish line');

  // Verify lane positions
  const screenSample = { x: 400, y: 500, w: 300, scale: 0.5 };
  const lane0 = getLanePosition(screenSample, 0);
  const lane3 = getLanePosition(screenSample, 3);
  assert.ok(lane0.x < lane3.x, 'Lane 0 is to the left of Lane 3');
  console.log('✓ buildRoad and getLanePosition tests passed');
}

console.log('--- ALL ENGINE MATH & ROAD TESTS PASSED (5/5) ---');
