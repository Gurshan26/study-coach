import { Router } from 'express';
import { getDb } from '../db/database.js';
import { generateQuizQuestions } from '../services/quizGenerator.js';

const router = Router();

router.post('/generate', async (req, res, next) => {
  try {
    const db = getDb();
    const { documentId, topicId, count, difficulty } = req.body || {};

    if (!documentId) {
      const err = new Error('documentId is required.');
      err.status = 400;
      throw err;
    }

    const document = db
      .prepare('SELECT id, content, word_count FROM documents WHERE id = ?')
      .get(Number(documentId));
    if (!document) {
      const err = new Error('Document not found.');
      err.status = 404;
      throw err;
    }

    const topics = topicId
      ? db
          .prepare('SELECT id, name, keywords, paragraph_indices AS paragraphIndices FROM topics WHERE id = ?')
          .all(Number(topicId))
          .map((topic) => ({
            ...topic,
            keywords: JSON.parse(topic.keywords || '[]'),
            paragraphIndices: JSON.parse(topic.paragraphIndices || '[]')
          }))
      : db
          .prepare('SELECT id, name, keywords, paragraph_indices AS paragraphIndices FROM topics WHERE document_id = ?')
          .all(Number(documentId))
          .map((topic) => ({
            ...topic,
            keywords: JSON.parse(topic.keywords || '[]'),
            paragraphIndices: JSON.parse(topic.paragraphIndices || '[]')
          }));

    const existingQuestions = db
      .prepare('SELECT question FROM quiz_questions WHERE document_id = ?')
      .all(Number(documentId));

    const questions = await generateQuizQuestions({
      documentId: Number(documentId),
      text: document.content,
      topics,
      existingQuestions,
      count,
      difficulty
    });

    const insert = db.prepare(
      `INSERT INTO quiz_questions (document_id, topic_id, question, correct_answer, distractors, difficulty)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    questions.forEach((question) => {
      const matchedTopic = topics.find((topic) => topic.name === question.topic);
      insert.run(
        Number(documentId),
        matchedTopic?.id || null,
        question.question,
        question.correct_answer,
        JSON.stringify(question.distractors),
        question.difficulty
      );
    });

    res.json({ added: questions.length, questions });
  } catch (error) {
    next(error);
  }
});

router.get('/:docId', (req, res) => {
  const db = getDb();
  const docId = Number(req.params.docId);
  const { topic, difficulty, limit } = req.query;

  const clauses = ['q.document_id = ?'];
  const values = [docId];

  if (topic) {
    clauses.push('(q.topic_id = ? OR t.name = ?)');
    values.push(Number(topic), String(topic));
  }

  if (difficulty) {
    clauses.push('q.difficulty = ?');
    values.push(String(difficulty));
  }

  const sql = `SELECT q.*, t.name AS topic_name
               FROM quiz_questions q
               LEFT JOIN topics t ON t.id = q.topic_id
               WHERE ${clauses.join(' AND ')}
               ORDER BY q.created_at DESC
               ${limit ? `LIMIT ${Number(limit)}` : ''}`;

  const questions = db.prepare(sql).all(...values).map((question) => ({
    ...question,
    distractors: JSON.parse(question.distractors || '[]')
  }));

  res.json({ questions });
});

router.post('/attempt', (req, res, next) => {
  try {
    const db = getDb();
    const { questionId, chosenAnswer, timeTakenMs } = req.body || {};

    if (!questionId || typeof chosenAnswer !== 'string') {
      const err = new Error('questionId and chosenAnswer are required.');
      err.status = 400;
      throw err;
    }

    const question = db
      .prepare('SELECT id, correct_answer FROM quiz_questions WHERE id = ?')
      .get(Number(questionId));

    if (!question) {
      const err = new Error('Question not found.');
      err.status = 404;
      throw err;
    }

    const isCorrect = question.correct_answer.trim().toLowerCase() === chosenAnswer.trim().toLowerCase() ? 1 : 0;

    db.prepare(
      `INSERT INTO quiz_attempts (question_id, chosen_answer, is_correct, time_taken_ms)
       VALUES (?, ?, ?, ?)`
    ).run(Number(questionId), chosenAnswer, isCorrect, timeTakenMs || null);

    res.json({
      correct: Boolean(isCorrect),
      explanation: `The correct answer is: ${question.correct_answer}.`
    });
  } catch (error) {
    next(error);
  }
});

export default router;
