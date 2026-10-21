/**
 * Anti-cheat verification utilities according to KeySpeed specifications:
 * - Reject a run if sustained WPM exceeds 250
 * - Progress jumps by more than 15 characters between two events
 * - Mark result flagged: true and exclude it from leaderboards
 */

export interface AntiCheatEvent {
  progress: number;
  timestamp: number;
}

export interface AntiCheatEvaluation {
  isFlagged: boolean;
  reason?: string;
}

const MAX_WPM_THRESHOLD = 250;
const MAX_PROGRESS_JUMP_THRESHOLD = 15;

/**
 * Checks whether an incremental progress update violates anti-cheat rules.
 */
export function validateProgressJump(
  previousProgress: number,
  currentProgress: number,
  maxJumpThreshold: number = MAX_PROGRESS_JUMP_THRESHOLD,
): AntiCheatEvaluation {
  if (currentProgress < previousProgress) {
    // Backtracking is fine, but not negative
    return { isFlagged: false };
  }

  const delta = currentProgress - previousProgress;
  if (delta > maxJumpThreshold) {
    return {
      isFlagged: true,
      reason: `Progress jump of ${delta} characters exceeds maximum allowed (${maxJumpThreshold})`,
    };
  }

  return { isFlagged: false };
}

/**
 * Checks whether calculated WPM exceeds the human threshold.
 */
export function validateWpmThreshold(
  wpm: number,
  maxWpmThreshold: number = MAX_WPM_THRESHOLD,
): AntiCheatEvaluation {
  if (wpm > maxWpmThreshold) {
    return {
      isFlagged: true,
      reason: `Sustained WPM ${wpm} exceeds maximum threshold of ${maxWpmThreshold}`,
    };
  }
  return { isFlagged: false };
}

/**
 * Validates the full typing submission against anti-cheat rules.
 */
export function evaluateRunAntiCheat(
  wpm: number,
  accuracy: number,
  history: AntiCheatEvent[] = [],
  maxWpmThreshold: number = MAX_WPM_THRESHOLD,
  maxJumpThreshold: number = MAX_PROGRESS_JUMP_THRESHOLD,
): AntiCheatEvaluation {
  const wpmCheck = validateWpmThreshold(wpm, maxWpmThreshold);
  if (wpmCheck.isFlagged) {
    return wpmCheck;
  }

  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const curr = history[i];
    const jumpCheck = validateProgressJump(prev.progress, curr.progress, maxJumpThreshold);
    if (jumpCheck.isFlagged) {
      return jumpCheck;
    }
  }

  return { isFlagged: false };
}

