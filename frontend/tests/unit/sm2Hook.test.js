import { describe, expect, it } from 'vitest';
import { applySm2Preview } from '../../src/hooks/useFlashcards.js';

describe('applySm2Preview', () => {
  const baseCard = { interval: 6, repetitions: 2, ease_factor: 2.5 };

  it('resets interval and repetitions on blackout', () => {
    const updated = applySm2Preview(baseCard, 0);
    expect(updated.interval).toBe(1);
    expect(updated.repetitions).toBe(0);
  });

  it('moves first repetition to interval 1', () => {
    const updated = applySm2Preview({ ...baseCard, repetitions: 0 }, 3);
    expect(updated.interval).toBe(1);
    expect(updated.repetitions).toBe(1);
  });
});
