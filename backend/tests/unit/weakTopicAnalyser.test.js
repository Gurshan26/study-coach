import { describe, expect, it } from 'vitest';
import { getDb } from '../../src/db/database.js';
import { analyzeWeakTopics } from '../../src/services/weakTopicAnalyser.js';

function seedBase(db) {
  const doc = db
    .prepare('INSERT INTO documents (filename, original_name, content, word_count) VALUES (?, ?, ?, ?)')
    .run('doc.txt', 'doc.txt', 'content', 200).lastInsertRowid;
  const topic = db
    .prepare('INSERT INTO topics (document_id, name, keywords, paragraph_indices) VALUES (?, ?, ?, ?)')
    .run(doc, 'Backpropagation', '[]', '[]').lastInsertRowid;
  const question = db
    .prepare('INSERT INTO quiz_questions (document_id, topic_id, question, correct_answer, distractors) VALUES (?, ?, ?, ?, ?)')
    .run(doc, topic, 'Q', 'A', '[]').lastInsertRowid;
  const card = db
    .prepare('INSERT INTO flashcards (document_id, topic_id, front, back) VALUES (?, ?, ?, ?)')
    .run(doc, topic, 'F', 'B').lastInsertRowid;
  return { doc, topic, question, card };
}

describe('weakTopicAnalyser', () => {
  it('Topic with 0 attempts scores 0.6', () => {
    const db = getDb();
    seedBase(db);

    const result = analyzeWeakTopics(db);
    expect(result[0].weakScore).toBeCloseTo(0.6, 3);
  });

  it('Topic with 100% accuracy scores near 0', () => {
    const db = getDb();
    const { question } = seedBase(db);
    db.prepare('INSERT INTO quiz_attempts (question_id, chosen_answer, is_correct) VALUES (?, ?, 1)').run(
      question,
      'A'
    );

    const result = analyzeWeakTopics(db);
    expect(result[0].weakScore).toBeCloseTo(0, 2);
  });

  it('Trend is improving when recent attempts are better', () => {
    const db = getDb();
    const { question } = seedBase(db);

    const insert = db.prepare(
      'INSERT INTO quiz_attempts (question_id, chosen_answer, is_correct, attempted_at) VALUES (?, ?, ?, ?)' 
    );

    const baseDate = new Date('2026-01-01T00:00:00.000Z');
    [0, 0, 0, 1, 1, 1].forEach((isCorrect, index) => {
      const dt = new Date(baseDate);
      dt.setDate(baseDate.getDate() + index);
      insert.run(question, isCorrect ? 'A' : 'B', isCorrect, dt.toISOString());
    });

    const result = analyzeWeakTopics(db);
    expect(result[0].trend).toBe('improving');
  });

  it('Mixed quiz and flashcard weighting is correct', () => {
    const db = getDb();
    const { question, card } = seedBase(db);

    db.prepare('INSERT INTO quiz_attempts (question_id, chosen_answer, is_correct) VALUES (?, ?, 0)').run(
      question,
      'B'
    );
    db.prepare('INSERT INTO flashcard_reviews (flashcard_id, quality) VALUES (?, ?)').run(card, 5);

    const result = analyzeWeakTopics(db)[0];
    expect(result.weakScore).toBeCloseTo(0.6, 2);
  });
});
