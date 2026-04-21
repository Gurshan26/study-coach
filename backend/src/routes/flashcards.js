import { Router } from 'express';
import { getDb } from '../db/database.js';
import { generateInitialFlashcards, getDueFlashcards, reviewFlashcard } from '../services/flashcardService.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const docId = req.query.docId ? Number(req.query.docId) : null;
  const cards = getDueFlashcards(db, docId);
  res.json({ cards });
});

router.get('/due', (req, res) => {
  const db = getDb();
  const docId = req.query.docId ? Number(req.query.docId) : null;
  const cards = getDueFlashcards(db, docId);
  res.json({ cards });
});

router.post('/', (req, res, next) => {
  try {
    const db = getDb();
    const { documentId } = req.body || {};
    if (!documentId) {
      const err = new Error('documentId is required.');
      err.status = 400;
      throw err;
    }

    const doc = db.prepare('SELECT id, content FROM documents WHERE id = ?').get(Number(documentId));
    if (!doc) {
      const err = new Error('Document not found.');
      err.status = 404;
      throw err;
    }

    const topics = db
      .prepare('SELECT id, name, keywords, paragraph_indices AS paragraphIndices FROM topics WHERE document_id = ?')
      .all(Number(documentId))
      .map((topic) => ({
        ...topic,
        keywords: JSON.parse(topic.keywords || '[]'),
        paragraphIndices: JSON.parse(topic.paragraphIndices || '[]')
      }));

    const generated = generateInitialFlashcards({ text: doc.content, topics });
    const insert = db.prepare(
      'INSERT INTO flashcards (document_id, topic_id, front, back) VALUES (?, ?, ?, ?)'
    );

    generated.forEach((card) => {
      const topic = topics.find((entry) => entry.name === card.topic);
      insert.run(Number(documentId), topic?.id || null, card.front, card.back);
    });

    res.json({ added: generated.length });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/review', (req, res, next) => {
  try {
    const quality = Number(req.body?.quality);
    if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
      const err = new Error('quality must be an integer from 0 to 5.');
      err.status = 400;
      throw err;
    }

    const db = getDb();
    const updated = reviewFlashcard(db, Number(req.params.id), quality);
    res.json({ flashcard: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
