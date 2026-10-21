import {
  validateProgressJump,
  validateWpmThreshold,
  evaluateRunAntiCheat,
} from './anti-cheat.util';

describe('Anti-Cheat Utility', () => {
  describe('validateWpmThreshold', () => {
    it('allows WPM within human limits', () => {
      expect(validateWpmThreshold(80).isFlagged).toBe(false);
      expect(validateWpmThreshold(180).isFlagged).toBe(false);
      expect(validateWpmThreshold(250).isFlagged).toBe(false);
    });

    it('flags runs with WPM over 250', () => {
      const evaluation = validateWpmThreshold(251);
      expect(evaluation.isFlagged).toBe(true);
      expect(evaluation.reason).toContain('exceeds maximum threshold');
    });
  });

  describe('validateProgressJump', () => {
    it('allows normal typing increments (<= 15 characters)', () => {
      expect(validateProgressJump(0, 5).isFlagged).toBe(false);
      expect(validateProgressJump(10, 25).isFlagged).toBe(false); // jump of 15
    });

    it('flags sudden large character jumps (> 15 characters)', () => {
      const evaluation = validateProgressJump(10, 27); // jump of 17
      expect(evaluation.isFlagged).toBe(true);
      expect(evaluation.reason).toContain('Progress jump of 17 characters');
    });

    it('allows backtracking without flagging', () => {
      expect(validateProgressJump(30, 28).isFlagged).toBe(false);
    });
  });

  describe('evaluateRunAntiCheat', () => {
    it('flags if any progress event jumped excessively', () => {
      const history = [
        { progress: 0, timestamp: 1000 },
        { progress: 10, timestamp: 1200 },
        { progress: 35, timestamp: 1350 }, // jump of 25!
      ];
      const evaluation = evaluateRunAntiCheat(120, 98, history);
      expect(evaluation.isFlagged).toBe(true);
    });

    it('approves a legitimate typing run', () => {
      const history = [
        { progress: 0, timestamp: 1000 },
        { progress: 6, timestamp: 1200 },
        { progress: 14, timestamp: 1400 },
        { progress: 24, timestamp: 1600 },
      ];
      const evaluation = evaluateRunAntiCheat(95, 99, history);
      expect(evaluation.isFlagged).toBe(false);
    });
  });
});

