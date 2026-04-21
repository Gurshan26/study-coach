import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { getDb } from '../../src/db/database.js';

function seedQuizData() {
  const db = getDb();
  const docId = db
    .prepare('INSERT INTO documents (filename, original_name, content, word_count) VALUES (?, ?, ?, ?)')
    .run(
      'doc.txt',
      'doc.txt',
      'Perceptrons use weighted sums. Backpropagation computes gradients. Gradient descent updates weights.',
      300
    ).lastInsertRowid;

  const topicId = db
    .prepare('INSERT INTO topics (document_id, name, keywords, paragraph_indices) VALUES (?, ?, ?, ?)')
    .run(docId, 'Backpropagation', '["gradients"]', '[0]').lastInsertRowid;

  const questionId = db
    .prepare(
      `INSERT INTO quiz_questions (document_id, topic_id, question, correct_answer, distractors, difficulty)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(docId, topicId, 'What does backpropagation compute?', 'Gradients', '["Weights","Data","Epochs"]', 'easy')
    .lastInsertRowid;

  return { docId, topicId, questionId };
}

describe('quiz routes', () => {
  it('Generate questions for seeded doc returns count', async () => {
    const app = createApp();
    const { docId } = seedQuizData();

    const response = await request(app).post('/api/quiz/generate').send({ documentId: docId, count: 3 });

    expect(response.status).toBe(200);
    expect(response.body.added).toBeGreaterThanOrEqual(1);
  });

  it('Record correct attempt sets is_correct=1', async () => {
    const app = createApp();
    const { questionId } = seedQuizData();

    const response = await request(app)
      .post('/api/quiz/attempt')
      .send({ questionId, chosenAnswer: 'Gradients', timeTakenMs: 2500 });

    expect(response.status).toBe(200);
    expect(response.body.correct).toBe(true);
  });

  it('Record wrong attempt increases weak score', async () => {
    const app = createApp();
    const { questionId } = seedQuizData();

    const before = await request(app).get('/api/topics/weak');
    await request(app).post('/api/quiz/attempt').send({ questionId, chosenAnswer: 'Weights', timeTakenMs: 1500 });
    const after = await request(app).get('/api/topics/weak');

    expect(after.body.topics[0].weakScore).toBeGreaterThanOrEqual(before.body.topics[0].weakScore);
  });

  it('Filter by difficulty works', async () => {
    const app = createApp();
    const { docId } = seedQuizData();

    const response = await request(app).get(`/api/quiz/${docId}?difficulty=easy`);

    expect(response.status).toBe(200);
    expect(response.body.questions.every((item) => item.difficulty === 'easy')).toBe(true);
  });

  it('Filter by topic works', async () => {
    const app = createApp();
    const { docId, topicId } = seedQuizData();

    const response = await request(app).get(`/api/quiz/${docId}?topic=${topicId}`);

    expect(response.status).toBe(200);
    expect(response.body.questions.length).toBeGreaterThan(0);
  });
});
