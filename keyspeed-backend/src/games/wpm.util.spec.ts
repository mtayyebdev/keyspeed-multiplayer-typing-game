import { calculateWpm, calculateAccuracy } from './wpm.util';

describe('WPM Utility', () => {
  describe('calculateWpm', () => {
    it('returns 0 for zero or negative characters', () => {
      expect(calculateWpm(0, 10000)).toBe(0);
      expect(calculateWpm(-5, 10000)).toBe(0);
    });

    it('returns 0 for too short duration (< 500ms)', () => {
      expect(calculateWpm(50, 200)).toBe(0);
    });

    it('calculates correct WPM for standard typing pace', () => {
      // 300 characters in 60 seconds (60000ms) = 60 words in 1 minute = 60 WPM
      expect(calculateWpm(300, 60000)).toBe(60);
      // 150 characters in 30 seconds (30000ms) = 30 words in 0.5 minute = 60 WPM
      expect(calculateWpm(150, 30000)).toBe(60);
      // 500 characters in 60 seconds = 100 WPM
      expect(calculateWpm(500, 60000)).toBe(100);
    });
  });

  describe('calculateAccuracy', () => {
    it('returns 100% for empty typed text', () => {
      expect(calculateAccuracy('Hello world', '')).toEqual({ accuracy: 100, errors: 0 });
    });

    it('returns 100% for perfect match', () => {
      const original = 'The quick brown fox';
      expect(calculateAccuracy(original, original)).toEqual({ accuracy: 100, errors: 0 });
    });

    it('correctly calculates errors and accuracy for mismatched text', () => {
      const original = 'Hello world';
      const typed = 'Hella world'; // 1 mistake at index 4 ('a' instead of 'o')
      const result = calculateAccuracy(original, typed);
      expect(result.errors).toBe(1);
      // 10 correct out of 11 = 90.9%
      expect(result.accuracy).toBeCloseTo(90.9, 1);
    });
  });
});

