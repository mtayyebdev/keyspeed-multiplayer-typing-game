import { Injectable } from '@nestjs/common';
import { GameEngine, PlayerProgress } from '../game-engine.interface';
import { calculateWpm, calculateAccuracy, calculateNetWpm } from '../wpm.util';
import { evaluateRunAntiCheat } from '../anti-cheat.util';

export interface CarPlayerRuntime extends PlayerProgress {
  correctChars: number;
  targetSpeed: number;
  hasActiveError: boolean;
  lastErrorClearedAt: number;
  lastTypedAt: number;
  recentKeyStamps: number[];
  speedSamples: number[];
  flagged?: boolean;
  // Bot fields
  targetWpm?: number;
  stallUntil?: number;
  idleUntil?: number;
}

export const CAR_RACE_CONSTANTS = {
  DEFAULT_STALL_PENALTY_MS: 400,
  DEFAULT_IDLE_TIMEOUT_MS: 1000,
  ROLLING_WINDOW_MS: 2000,
  WPM_TO_KMH_RATIO: 320 / 120, // ~2.6667
  ACCEL_STEP: 15, // km/h per 50ms tick
  DECEL_STEP: 25, // km/h per 50ms tick
  TICK_MS: 50,
};

@Injectable()
export class CarRaceEngine implements GameEngine {
  readonly id = 'car-race';
  readonly name = 'Car Race';

  createRuntimePlayer(
    player: PlayerProgress,
    targetWpm?: number,
  ): CarPlayerRuntime {
    return {
      ...player,
      progress: 0,
      wpm: 0,
      speed: 0,
      targetSpeed: 0,
      state: 'idle',
      correctChars: 0,
      hasActiveError: false,
      lastErrorClearedAt: 0,
      lastTypedAt: 0,
      recentKeyStamps: [],
      topSpeed: 0,
      avgSpeed: 0,
      speedSamples: [],
      stalls: 0,
      errors: 0,
      finished: false,
      targetWpm: targetWpm || 40,
    };
  }

  /**
   * Handle incoming keystroke updates for a player
   */
  handleKeystroke(
    player: CarPlayerRuntime,
    newIndex: number,
    hasError: boolean,
    now: number = Date.now(),
  ) {
    if (player.finished) return;

    if (hasError) {
      if (!player.hasActiveError) {
        player.hasActiveError = true;
        player.errors = (player.errors || 0) + 1;
        player.stalls = (player.stalls || 0) + 1;
        player.speed = 0;
        player.targetSpeed = 0;
        player.state = 'stalled';
        player.recentKeyStamps = [];
      }
      return;
    }

    // hasError === false
    if (player.hasActiveError) {
      // Error cleared with Backspace!
      player.hasActiveError = false;
      player.lastErrorClearedAt = now;
      player.speed = 0;
      player.targetSpeed = 0;
      player.state = 'stalled'; // Enforce stall penalty
      return;
    }

    // Normal typing progression
    if (newIndex > player.correctChars) {
      player.correctChars = newIndex;
      player.lastTypedAt = now;
      player.recentKeyStamps.push(now);
    }
  }

  /**
   * Update physics tick for a player (called every ~50ms)
   */
  updateTick(
    player: CarPlayerRuntime,
    now: number,
    textLength: number,
    stallPenaltyMs: number = CAR_RACE_CONSTANTS.DEFAULT_STALL_PENALTY_MS,
    idleTimeoutMs: number = CAR_RACE_CONSTANTS.DEFAULT_IDLE_TIMEOUT_MS,
  ): void {
    if (player.finished) {
      player.speed = 0;
      player.state = 'finished';
      return;
    }

    // 1. Check active stall from error
    if (player.hasActiveError) {
      player.speed = 0;
      player.targetSpeed = 0;
      player.state = 'stalled';
      return;
    }

    // 2. Check post-clear stall penalty
    if (player.lastErrorClearedAt > 0 && now - player.lastErrorClearedAt < stallPenaltyMs) {
      player.speed = 0;
      player.targetSpeed = 0;
      player.state = 'stalled';
      return;
    }

    // 3. Check idle timeout
    const timeSinceTyped = player.lastTypedAt > 0 ? now - player.lastTypedAt : 999999;
    if (timeSinceTyped > idleTimeoutMs) {
      player.targetSpeed = 0;
      player.speed = Math.max(0, player.speed - CAR_RACE_CONSTANTS.DECEL_STEP);
      player.state = player.speed > 5 ? 'running' : 'idle';
      player.recentKeyStamps = player.recentKeyStamps.filter(
        (t) => now - t <= CAR_RACE_CONSTANTS.ROLLING_WINDOW_MS,
      );
      this.updateProgressAndFinish(player, textLength, now);
      return;
    }

    // 4. Player is actively typing - prune stamps outside rolling window
    player.recentKeyStamps = player.recentKeyStamps.filter(
      (t) => now - t <= CAR_RACE_CONSTANTS.ROLLING_WINDOW_MS,
    );

    const countInWindow = player.recentKeyStamps.length;
    let windowWpm = 0;
    if (countInWindow > 0) {
      const windowSec = CAR_RACE_CONSTANTS.ROLLING_WINDOW_MS / 1000;
      const charsPerSec = countInWindow / windowSec;
      windowWpm = Math.round((charsPerSec * 60) / 5);
    }

    player.targetSpeed = Math.round(windowWpm * CAR_RACE_CONSTANTS.WPM_TO_KMH_RATIO);

    // Smooth acceleration or deceleration towards target speed
    if (player.speed < player.targetSpeed) {
      player.speed = Math.min(
        player.targetSpeed,
        player.speed + CAR_RACE_CONSTANTS.ACCEL_STEP,
      );
    } else if (player.speed > player.targetSpeed) {
      player.speed = Math.max(
        player.targetSpeed,
        player.speed - CAR_RACE_CONSTANTS.DECEL_STEP,
      );
    }

    if (player.speed > (player.topSpeed || 0)) {
      player.topSpeed = player.speed;
    }
    if (player.speed > 0) {
      player.speedSamples.push(player.speed);
    }

    player.state = player.speed > 0 ? 'running' : 'idle';
    this.updateProgressAndFinish(player, textLength, now);
  }

  /**
   * Update bot tick for a Car Race bot
   */
  updateBotTick(
    bot: CarPlayerRuntime,
    now: number,
    textLength: number,
    tickMs: number = CAR_RACE_CONSTANTS.TICK_MS,
    allowRandomPauses: boolean = true,
  ): void {
    if (bot.finished) {
      bot.speed = 0;
      bot.state = 'finished';
      return;
    }

    // 1. In stall?
    if (bot.stallUntil && now < bot.stallUntil) {
      bot.speed = 0;
      bot.targetSpeed = 0;
      bot.state = 'stalled';
      return;
    }
    if (bot.stallUntil && now >= bot.stallUntil) {
      bot.stallUntil = undefined;
    }

    // 2. In idle pause?
    if (bot.idleUntil && now < bot.idleUntil) {
      bot.targetSpeed = 0;
      bot.speed = Math.max(0, bot.speed - CAR_RACE_CONSTANTS.DECEL_STEP);
      bot.state = bot.speed > 5 ? 'running' : 'idle';
      return;
    }
    if (bot.idleUntil && now >= bot.idleUntil) {
      bot.idleUntil = undefined;
    }

    // 3. Random human-like mistake (0.6% chance per 50ms tick ~ once every 8s)
    if (allowRandomPauses && Math.random() < 0.006) {
      bot.stallUntil = now + 700;
      bot.stalls = (bot.stalls || 0) + 1;
      bot.errors = (bot.errors || 0) + 1;
      bot.speed = 0;
      bot.targetSpeed = 0;
      bot.state = 'stalled';
      return;
    }

    // 4. Random human-like pause (0.8% chance per 50ms tick)
    if (allowRandomPauses && Math.random() < 0.008) {
      bot.idleUntil = now + 600;
      bot.targetSpeed = 0;
      bot.state = 'idle';
      return;
    }

    // 5. Normal driving / typing progress
    const targetWpm = bot.targetWpm || 40;
    const targetKmh = Math.round(targetWpm * CAR_RACE_CONSTANTS.WPM_TO_KMH_RATIO);
    bot.targetSpeed = targetKmh;

    if (bot.speed < bot.targetSpeed) {
      bot.speed = Math.min(bot.targetSpeed, bot.speed + CAR_RACE_CONSTANTS.ACCEL_STEP);
    } else if (bot.speed > bot.targetSpeed) {
      bot.speed = Math.max(bot.targetSpeed, bot.speed - CAR_RACE_CONSTANTS.DECEL_STEP);
    }

    if (bot.speed > (bot.topSpeed || 0)) {
      bot.topSpeed = bot.speed;
    }
    if (bot.speed > 0) {
      bot.speedSamples.push(bot.speed);
    }

    // Advance characters typed
    const charsPerSec = (targetWpm * 5) / 60;
    const variance = 0.9 + Math.random() * 0.2;
    const increment = charsPerSec * (tickMs / 1000) * variance;
    bot.correctChars = Math.min(textLength, bot.correctChars + increment);

    bot.state = bot.speed > 0 ? 'running' : 'idle';
    this.updateProgressAndFinish(bot, textLength, now);
  }

  private updateProgressAndFinish(
    player: CarPlayerRuntime,
    textLength: number,
    now: number,
  ) {
    const clamped = Math.min(Math.max(0, player.correctChars), textLength);
    player.progress = textLength > 0 ? Math.min(100, Math.round((clamped / textLength) * 100)) : 0;

    if (clamped >= textLength) {
      player.progress = 100;
      player.finished = true;
      player.speed = 0;
      player.targetSpeed = 0;
      player.state = 'finished';
    }
  }

  /**
   * GameEngine interface implementation
   */
  calculateProgress(
    player: PlayerProgress,
    newIndex: number,
    textLength: number,
    elapsedMs: number,
  ): PlayerProgress {
    const clampedIndex = Math.min(Math.max(0, newIndex), textLength);
    const progressPercent = Math.min(100, Math.round((clampedIndex / textLength) * 100));
    const currentWpm = calculateWpm(clampedIndex, elapsedMs);

    return {
      ...player,
      progress: progressPercent,
      wpm: currentWpm,
    };
  }

  calculateFinalScore(
    player: PlayerProgress,
    originalText: string,
    typedText: string,
    durationMs: number,
    maxWpm: number = 250,
    maxJump: number = 15,
  ) {
    const { accuracy, errors: textErrors } = calculateAccuracy(originalText, typedText);
    const wpm = calculateWpm(typedText.length, durationMs);
    const errors = Math.max(player.errors || 0, textErrors);
    const netWpm = calculateNetWpm(typedText.length, errors, durationMs);
    const antiCheat = evaluateRunAntiCheat(wpm, accuracy, [], maxWpm, maxJump);

    const runtime = player as CarPlayerRuntime;
    const topSpeed = runtime.topSpeed || Math.round(wpm * CAR_RACE_CONSTANTS.WPM_TO_KMH_RATIO);
    const avgSpeed =
      runtime.speedSamples && runtime.speedSamples.length > 0
        ? Math.round(
            runtime.speedSamples.reduce((a, b) => a + b, 0) / runtime.speedSamples.length,
          )
        : Math.round(topSpeed * 0.7);

    return {
      wpm,
      netWpm,
      accuracy,
      errors,
      stalls: player.stalls || 0,
      topSpeed,
      avgSpeed,
      isFlagged: antiCheat.isFlagged,
    };
  }
}
