import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { getDb } from '../../src/db/database.js';

function seedFlashcards() {
  const db = getDb();
  const docId = db
    .prepare('INSERT INTO documents (filename, original_name, content, word_count) VALUES (?, ?, ?, ?)')
    .run('doc.txt', 'doc.txt', 'content', 200).lastInsertRowid;
  const topicId = db
    .prepare('INSERT INTO topics (document_id, name, keywords, paragraph_indices) VALUES (?, ?, ?, ?)')
    .run(docId, 'Neural Networks', '[]', '[]').lastInsertRowid;

  const dueCardId = db
    .prepare(
      `INSERT INTO flashcards (document_id, topic_id, front, back, interval, repetitions, ease_factor, next_review)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(docId, topicId, 'Front due', 'Back due', 1, 0, 2.5, '2020-01-01T00:00:00.000Z').lastInsertRowid;

  db.prepare(
    `INSERT INTO flashcards (document_id, topic_id, front, back, interval, repetitions, ease_factor, next_review)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(docId, topicId, 'Front future', 'Back future', 6, 1, 2.5, '2099-01-01T00:00:00.000Z');

  return { docId, dueCardId };
}

describe('flashcards routes', () => {
  it('GET /due returns only cards due now', async () => {
    const app = createApp();
    const { docId } = seedFlashcards();

    const response = await request(app).get(`/api/flashcards/due?docId=${docId}`);

    expect(response.status).toBe(200);
    expect(response.body.cards).toHaveLength(1);
    expect(response.body.cards[0].front).toContain('due');
  });

  it('POST review quality=5 increases interval', async () => {
    const app = createApp();
    const { dueCardId } = seedFlashcards();

    const response = await request(app).post(`/api/flashcards/${dueCardId}/review`).send({ quality: 5 });

    expect(response.status).toBe(200);
    expect(response.body.flashcard.interval).toBeGreaterThanOrEqual(1);
  });

  it('POST review quality=0 resets interval to 1', async () => {
    const app = createApp();
    const { dueCardId } = seedFlashcards();

    const response = await request(app).post(`/api/flashcards/${dueCardId}/review`).send({ quality: 0 });

    expect(response.status).toBe(200);
    expect(response.body.flashcard.interval).toBe(1);
  });

  it('Full SM-2 session over 5 cards keeps valid state', async () => {
    const app = createApp();
    const db = getDb();

    const docId = db
      .prepare('INSERT INTO documents (filename, original_name, content, word_count) VALUES (?, ?, ?, ?)')
      .run('doc.txt', 'doc.txt', 'content', 200).lastInsertRowid;
    const topicId = db
      .prepare('INSERT INTO topics (document_id, name, keywords, paragraph_indices) VALUES (?, ?, ?, ?)')
      .run(docId, 'Optimization', '[]', '[]').lastInsertRowid;

    const ids = [];
    const insert = db.prepare(
      `INSERT INTO flashcards (document_id, topic_id, front, back, interval, repetitions, ease_factor, next_review)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (let i = 0; i < 5; i += 1) {
      ids.push(
        insert.run(docId, topicId, `Front ${i}`, `Back ${i}`, 1, 0, 2.5, '2020-01-01T00:00:00.000Z').lastInsertRowid
      );
    }

    for (const id of ids) {
      const response = await request(app).post(`/api/flashcards/${id}/review`).send({ quality: 5 });
      expect(response.status).toBe(200);
      expect(response.body.flashcard.ease_factor).toBeGreaterThanOrEqual(1.3);
    }
  });
});
