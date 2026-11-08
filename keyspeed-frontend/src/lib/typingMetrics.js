export function calculateWpm(charactersTyped, durationMs) {
  if (!charactersTyped || charactersTyped <= 0 || !durationMs || durationMs < 500) {
    return 0;
  }
  const minutes = durationMs / 60000;
  const words = charactersTyped / 5;
  return Math.max(0, Math.round(words / minutes));
}

export function calculateNetWpm(charactersTyped, errors = 0, durationMs) {
  if (!charactersTyped || charactersTyped <= 0 || !durationMs || durationMs < 500) {
    return 0;
  }
  const minutes = durationMs / 60000;
  const grossWords = charactersTyped / 5;
  const netWords = Math.max(0, grossWords - errors);
  return Math.max(0, Math.round(netWords / minutes));
}

export function calculateAccuracy(originalText, typedText) {
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

