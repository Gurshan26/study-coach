import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/', (_req, res) => {
  const db = getDb();
  const documents = db
    .prepare(
      `SELECT d.*,
         (SELECT COUNT(*) FROM topics t WHERE t.document_id = d.id) AS topic_count,
         (SELECT COUNT(*) FROM quiz_questions q WHERE q.document_id = d.id) AS question_count,
         (SELECT COUNT(*) FROM flashcards f WHERE f.document_id = d.id) AS flashcard_count
       FROM documents d
       ORDER BY d.created_at DESC`
    )
    .all();

  res.json({ documents });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);

  const existing = db.prepare('SELECT id FROM documents WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Document not found.' });
    return;
  }

  db.prepare('DELETE FROM documents WHERE id = ?').run(id);
  res.json({ deleted: true });
});

export default router;
