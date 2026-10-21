import { Injectable } from '@nestjs/common';
import { GameEngine, PlayerProgress } from './game-engine.interface';
import { calculateWpm, calculateAccuracy } from './wpm.util';
import { evaluateRunAntiCheat, validateProgressJump } from './anti-cheat.util';

@Injectable()
export class ClassicRaceEngine implements GameEngine {
  calculateProgress(
    player: PlayerProgress,
    newIndex: number,
    textLength: number,
    elapsedMs: number,
  ): PlayerProgress {
    const clampedIndex = Math.min(Math.max(0, newIndex), textLength);
    const progressPercent = Math.min(100, Math.round((clampedIndex / textLength) * 100));

    // Calculate current running WPM based on characters typed so far
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
    maxWpm?: number,
    maxJump?: number,
  ) {
    const { accuracy, errors } = calculateAccuracy(originalText, typedText);
    const wpm = calculateWpm(typedText.length, durationMs);
    const antiCheat = evaluateRunAntiCheat(wpm, accuracy, [], maxWpm, maxJump);

    return {
      wpm,
      accuracy,
      errors,
      isFlagged: antiCheat.isFlagged,
    };
  }
}

