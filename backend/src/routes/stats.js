import { Router } from 'express';
import { getDb } from '../db/database.js';
import { analyzeWeakTopics } from '../services/weakTopicAnalyser.js';

const router = Router();

function calculateStreak(activityDates) {
  const set = new Set(activityDates);
  const now = new Date();
  let streak = 0;

  while (true) {
    const day = new Date(now);
    day.setDate(now.getDate() - streak);
    const key = day.toISOString().slice(0, 10);
    if (set.has(key)) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

router.get('/', (_req, res) => {
  const db = getDb();

  const totalCards = db.prepare('SELECT COUNT(*) AS count FROM flashcards').get().count;
  const dueToday = db
    .prepare('SELECT COUNT(*) AS count FROM flashcards WHERE next_review <= CURRENT_TIMESTAMP')
    .get().count;

  const attempts = db.prepare('SELECT COUNT(*) AS total, SUM(is_correct) AS correct FROM quiz_attempts').get();
  const overallAccuracy = attempts.total
    ? Number(((attempts.correct || 0) / attempts.total).toFixed(3))
    : 0;

  const dates = db
    .prepare(
      `SELECT DATE(attempted_at) AS activity_date FROM quiz_attempts
       UNION
       SELECT DATE(reviewed_at) AS activity_date FROM flashcard_reviews`
    )
    .all()
    .map((row) => row.activity_date);

  const topicBreakdown = analyzeWeakTopics(db).slice(0, 10);

  res.json({
    totalCards,
    dueToday,
    streakDays: calculateStreak(dates),
    overallAccuracy,
    topicBreakdown
  });
});

export default router;
