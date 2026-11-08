import { CarRaceEngine, CarPlayerRuntime, CAR_RACE_CONSTANTS } from './car-race.engine';

describe('CarRaceEngine', () => {
  let engine: CarRaceEngine;

  beforeEach(() => {
    engine = new CarRaceEngine();
  });

  it('creates runtime player with initial idle state', () => {
    const player = engine.createRuntimePlayer({
      id: 'p1',
      username: 'Racer1',
      progress: 0,
      wpm: 0,
    });

    expect(player.speed).toBe(0);
    expect(player.state).toBe('idle');
    expect(player.stalls).toBe(0);
    expect(player.errors).toBe(0);
    expect(player.hasActiveError).toBe(false);
  });

  it('smoothly accelerates car when correct characters are typed', () => {
    const player = engine.createRuntimePlayer({
      id: 'p1',
      username: 'Racer1',
      progress: 0,
      wpm: 0,
    });

    const now = 10000;
    // Simulate typing 10 characters in 1 second (10 cps = 120 WPM -> ~320 km/h target)
    for (let i = 1; i <= 10; i++) {
      engine.handleKeystroke(player, i, false, now - (10 - i) * 100);
    }

    // First tick at now: targetSpeed should be high (~320 km/h), speed should have accelerated by ACCEL_STEP
    engine.updateTick(player, now, 100, 400, 1000);
    expect(player.speed).toBe(CAR_RACE_CONSTANTS.ACCEL_STEP);
    expect(player.state).toBe('running');
    expect(player.targetSpeed).toBeGreaterThan(150);

    // Second tick: should accelerate further
    engine.updateTick(player, now + 50, 100, 400, 1000);
    expect(player.speed).toBe(CAR_RACE_CONSTANTS.ACCEL_STEP * 2);
    expect(player.topSpeed).toBe(player.speed);
  });

  it('immediately stalls and zeroes speed on error', () => {
    const player = engine.createRuntimePlayer({
      id: 'p1',
      username: 'Racer1',
      progress: 0,
      wpm: 0,
    });

    const now = 10000;
    // Get car up to speed
    player.speed = 180;
    player.state = 'running';
    player.correctChars = 20;

    // Trigger wrong character
    engine.handleKeystroke(player, 20, true, now);

    expect(player.speed).toBe(0);
    expect(player.state).toBe('stalled');
    expect(player.hasActiveError).toBe(true);
    expect(player.errors).toBe(1);
    expect(player.stalls).toBe(1);

    // Next tick should stay stalled with speed 0
    engine.updateTick(player, now + 50, 100, 400, 1000);
    expect(player.speed).toBe(0);
    expect(player.state).toBe('stalled');
  });

  it('enforces 400ms stall penalty after fixing error with Backspace', () => {
    const player = engine.createRuntimePlayer({
      id: 'p1',
      username: 'Racer1',
      progress: 0,
      wpm: 0,
    });

    const now = 10000;
    // 1. Error occurs
    engine.handleKeystroke(player, 10, true, now);
    expect(player.hasActiveError).toBe(true);

    // 2. Fixed with Backspace 200ms later
    const clearedAt = now + 200;
    engine.handleKeystroke(player, 10, false, clearedAt);
    expect(player.hasActiveError).toBe(false);
    expect(player.lastErrorClearedAt).toBe(clearedAt);
    expect(player.state).toBe('stalled');

    // 3. 200ms after clear (< 400ms penalty): player tries to type correct char
    engine.handleKeystroke(player, 11, false, clearedAt + 200);
    engine.updateTick(player, clearedAt + 200, 100, 400, 1000);
    // Still in stall penalty!
    expect(player.speed).toBe(0);
    expect(player.state).toBe('stalled');

    // 4. 450ms after clear (> 400ms penalty): player types and accelerates
    engine.handleKeystroke(player, 12, false, clearedAt + 450);
    engine.updateTick(player, clearedAt + 450, 100, 400, 1000);
    expect(player.speed).toBeGreaterThan(0);
    expect(player.state).toBe('running');
  });

  it('decelerates quickly to idle when typing stops for > 1000ms', () => {
    const player = engine.createRuntimePlayer({
      id: 'p1',
      username: 'Racer1',
      progress: 0,
      wpm: 0,
    });

    const start = 10000;
    player.speed = 100;
    player.lastTypedAt = start;
    player.recentKeyStamps = [start];

    // At start + 1050ms (> 1000ms idle timeout), idle timeout triggers
    engine.updateTick(player, start + 1050, 100, 400, 1000);
    // Should decelerate by DECEL_STEP (100 - 25 = 75)
    expect(player.speed).toBe(75);
    expect(player.targetSpeed).toBe(0);

    // After several more ticks, speed reaches 0 and state is idle
    engine.updateTick(player, start + 1100, 100, 400, 1000);
    engine.updateTick(player, start + 1150, 100, 400, 1000);
    engine.updateTick(player, start + 1200, 100, 400, 1000);
    expect(player.speed).toBe(0);
    expect(player.state).toBe('idle');
  });

  it('updates bot simulation with progress, target speed, and completion', () => {
    const bot = engine.createRuntimePlayer({
      id: 'bot1',
      username: 'FastBot',
      isBot: true,
      progress: 0,
      wpm: 60,
    }, 60);

    const textLength = 50;
    const now = 10000;

    // Simulate 20 ticks (1 second) of bot driving with predictable progress
    for (let i = 1; i <= 20; i++) {
      engine.updateBotTick(bot, now + i * 50, textLength, 50, false);
    }

    expect(bot.speed).toBeGreaterThan(0);
    expect(bot.correctChars).toBeGreaterThan(0);
    expect(bot.progress).toBeGreaterThan(0);
  });

  it('handles bot simulated stall when stallUntil is set', () => {
    const bot = engine.createRuntimePlayer({
      id: 'bot1',
      username: 'FastBot',
      isBot: true,
      progress: 0,
      wpm: 60,
    }, 60);

    const now = 10000;
    bot.stallUntil = now + 500;
    engine.updateBotTick(bot, now + 100, 50, 50, false);

    expect(bot.speed).toBe(0);
    expect(bot.state).toBe('stalled');
  });

  it('calculates comprehensive final score with topSpeed and avgSpeed', () => {
    const player = engine.createRuntimePlayer({
      id: 'p1',
      username: 'Racer1',
      progress: 100,
      wpm: 80,
    });
    player.topSpeed = 240;
    player.speedSamples = [100, 150, 200, 240, 210];
    player.stalls = 2;
    player.errors = 3;

    const originalText = 'the quick brown fox jumps over the lazy dog';
    const typedText = 'the quick brown fox jumps over the lazy dog';
    const score = engine.calculateFinalScore(player, originalText, typedText, 10000);

    expect(score.accuracy).toBe(100);
    expect(score.stalls).toBe(2);
    expect(score.errors).toBe(3);
    expect(score.topSpeed).toBe(240);
    expect(score.avgSpeed).toBe(180);
    expect(score.isFlagged).toBe(false);
  });
});
