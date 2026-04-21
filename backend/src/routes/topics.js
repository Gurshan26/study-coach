import { Router } from 'express';
import { getDb } from '../db/database.js';
import { analyzeWeakTopics } from '../services/weakTopicAnalyser.js';

const router = Router();

router.get('/weak', (req, res) => {
  const db = getDb();
  const documentId = req.query.documentId ? Number(req.query.documentId) : undefined;
  const topics = analyzeWeakTopics(db, { documentId });
  res.json({ topics });
});

export default router;
