function average(numbers) {
  if (!numbers.length) {
    return 0;
  }
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function computeTrend(attempts) {
  if (attempts.length < 6) {
    return 'stable';
  }
  const sorted = [...attempts].sort((a, b) => new Date(a.attempted_at) - new Date(b.attempted_at));
  const recent = sorted.slice(-3).map((attempt) => attempt.is_correct);
  const previous = sorted.slice(-6, -3).map((attempt) => attempt.is_correct);

  const recentScore = average(recent);
  const previousScore = average(previous);
  const delta = recentScore - previousScore;

  if (delta > 0.15) {
    return 'improving';
  }
  if (delta < -0.15) {
    return 'declining';
  }
  return 'stable';
}

function scoreTag(weakScore, trend) {
  if (weakScore > 0.6) {
    return 'needs work';
  }
  if (weakScore < 0.3) {
    return 'strong';
  }
  if (trend === 'improving') {
    return 'improving';
  }
  return 'needs work';
}

export function analyzeWeakTopics(db, { documentId } = {}) {
  const topics = documentId
    ? db.prepare('SELECT * FROM topics WHERE document_id = ?').all(documentId)
    : db.prepare('SELECT * FROM topics').all();

  const attemptQuery = db.prepare(
    `SELECT qa.is_correct, qa.attempted_at
     FROM quiz_attempts qa
     JOIN quiz_questions qq ON qq.id = qa.question_id
     WHERE qq.topic_id = ?
     ORDER BY qa.attempted_at ASC`
  );

  const flashReviewQuery = db.prepare(
    `SELECT fr.quality, fr.reviewed_at
     FROM flashcard_reviews fr
     JOIN flashcards f ON f.id = fr.flashcard_id
     WHERE f.topic_id = ?
     ORDER BY fr.reviewed_at ASC`
  );

  return topics
    .map((topic) => {
      const attempts = attemptQuery.all(topic.id);
      const flashReviews = flashReviewQuery.all(topic.id);

      const quizAccuracy = attempts.length ? average(attempts.map((attempt) => attempt.is_correct)) : 0;
      const flashcardAvgQuality = flashReviews.length
        ? average(flashReviews.map((review) => review.quality))
        : 5;

      const weakScore = (1 - quizAccuracy) * 0.6 + (1 - flashcardAvgQuality / 5) * 0.4;
      const trend = computeTrend(attempts);
      const lastAttempted = [
        attempts[attempts.length - 1]?.attempted_at,
        flashReviews[flashReviews.length - 1]?.reviewed_at
      ]
        .filter(Boolean)
        .sort()
        .pop();

      return {
        topicId: topic.id,
        topic: topic.name,
        weakScore: Number(weakScore.toFixed(3)),
        trend,
        tag: scoreTag(weakScore, trend),
        quizAccuracy: Number(quizAccuracy.toFixed(3)),
        flashcardAvgQuality: Number(flashcardAvgQuality.toFixed(3)),
        lastAttempted: lastAttempted || null,
        quizHistory: attempts.slice(-10),
        flashcardHistory: flashReviews.slice(-10)
      };
    })
    .sort((a, b) => b.weakScore - a.weakScore);
}
