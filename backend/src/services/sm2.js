export function calculateSM2({ easeFactor = 2.5, interval = 1, repetitions = 0, quality, now = new Date() }) {
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5.');
  }

  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (quality < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }

    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEaseFactor = Math.max(1.3, newEaseFactor);
    newRepetitions = repetitions + 1;
  }

  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    newEaseFactor,
    newInterval,
    newRepetitions,
    nextReview
  };
}
