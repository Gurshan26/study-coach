import { describe, expect, it } from 'vitest';
import { calculateSM2 } from '../../src/services/sm2.js';

describe('SM-2 algorithm', () => {
  it('Quality 0 resets interval and repetitions', () => {
    const result = calculateSM2({ easeFactor: 2.5, interval: 6, repetitions: 3, quality: 0 });
    expect(result.newInterval).toBe(1);
    expect(result.newRepetitions).toBe(0);
  });

  it('Quality 5 increases ease factor', () => {
    const result = calculateSM2({ easeFactor: 2.5, interval: 6, repetitions: 2, quality: 5 });
    expect(result.newEaseFactor).toBeGreaterThan(2.5);
  });

  it('Ease factor never drops below 1.3', () => {
    const result = calculateSM2({ easeFactor: 1.31, interval: 6, repetitions: 2, quality: 0 });
    expect(result.newEaseFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('nextReview date is correctly computed', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const result = calculateSM2({ easeFactor: 2.5, interval: 1, repetitions: 1, quality: 5, now });
    expect(result.nextReview.toISOString()).toBe('2026-01-07T00:00:00.000Z');
  });

  it('Full sequence: intervals grow over 5 successful reviews', () => {
    let state = {
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0
    };

    const intervals = [];

    for (let i = 0; i < 5; i += 1) {
      const result = calculateSM2({ ...state, quality: 5 });
      intervals.push(result.newInterval);
      state = {
        easeFactor: result.newEaseFactor,
        interval: result.newInterval,
        repetitions: result.newRepetitions
      };
    }

    expect(intervals[0]).toBe(1);
    expect(intervals[1]).toBe(6);
    expect(intervals[2]).toBeGreaterThanOrEqual(15);
    expect(intervals[4]).toBeGreaterThan(intervals[3]);
  });
});
