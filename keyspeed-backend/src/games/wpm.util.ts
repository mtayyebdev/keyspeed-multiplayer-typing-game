/**
 * Pure functions for WPM, accuracy, and error calculations.
 */

export interface AccuracyResult {
  accuracy: number;
  errors: number;
}

/**
 * Standard WPM calculation: (characters / 5) / (duration in minutes)
 * 1 standard word = 5 characters.
 */
export function calculateWpm(charactersTyped: number, durationMs: number): number {
  if (!charactersTyped || charactersTyped <= 0 || !durationMs || durationMs < 500) {
    return 0;
  }
  const minutes = durationMs / 60000;
  const words = charactersTyped / 5;
  const wpm = Math.round(words / minutes);
  return Math.max(0, wpm);
}

/**
 * Calculates accuracy percentage and character errors compared to original text.
 */
export function calculateAccuracy(originalText: string, typedText: string): AccuracyResult {
  if (!typedText || typedText.length === 0) {
    return { accuracy: 100, errors: 0 };
  }

  let errors = 0;
  const compareLength = typedText.length;

  for (let i = 0; i < compareLength; i++) {
    if (i >= originalText.length || typedText[i] !== originalText[i]) {
      errors++;
    }
  }

  const correct = compareLength - errors;
  const accuracy = Math.max(0, Math.round((correct / compareLength) * 1000) / 10);

  return {
    accuracy,
    errors,
  };
}

