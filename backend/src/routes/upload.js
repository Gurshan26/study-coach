import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { parseUploadedFile } from '../services/pdfParser.js';
import { extractTopics } from '../services/topicExtractor.js';
import { generateQuizQuestions } from '../services/quizGenerator.js';
import { generateInitialFlashcards } from '../services/flashcardService.js';
import { createJob, getJob, updateJob } from '../services/jobStore.js';
import { getDb } from '../db/database.js';

const router = Router();

async function processUploadJob(jobId, file) {
  const db = getDb();

  try {
    updateJob(jobId, { status: 'processing', steps: { parsing: 'in_progress' } });
    const parsed = await parseUploadedFile(file);
    updateJob(jobId, { steps: { parsing: 'done', topics: 'in_progress' } });

    const documentInsert = db
      .prepare(
        'INSERT INTO documents (filename, original_name, content, word_count) VALUES (?, ?, ?, ?)'
      )
      .run(`${Date.now()}-${file.originalname}`, file.originalname, parsed.text, parsed.wordCount);

    const documentId = documentInsert.lastInsertRowid;

    const topics = await extractTopics(parsed.text);
    const topicInsert = db.prepare(
      'INSERT INTO topics (document_id, name, keywords, paragraph_indices) VALUES (?, ?, ?, ?)'
    );

    const topicIdByName = new Map();
    topics.forEach((topic) => {
      const inserted = topicInsert.run(
        documentId,
        topic.name,
        JSON.stringify(topic.keywords || []),
        JSON.stringify(topic.paragraphIndices || [])
      );
      topicIdByName.set(topic.name, inserted.lastInsertRowid);
    });

    updateJob(jobId, { steps: { topics: 'done', quiz: 'in_progress' } });

    const questions = await generateQuizQuestions({
      documentId,
      text: parsed.text,
      topics,
      existingQuestions: [],
      count: Math.max(5, Math.ceil(parsed.wordCount / 200))
    });

    const insertQuestion = db.prepare(
      `INSERT INTO quiz_questions
       (document_id, topic_id, question, correct_answer, distractors, difficulty)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    questions.forEach((question) => {
      insertQuestion.run(
        documentId,
        topicIdByName.get(question.topic) || null,
        question.question,
        question.correct_answer,
        JSON.stringify(question.distractors),
        question.difficulty
      );
    });

    updateJob(jobId, { steps: { quiz: 'done', flashcards: 'in_progress' } });

    const cards = generateInitialFlashcards({ text: parsed.text, topics });
    const insertCard = db.prepare(
      'INSERT INTO flashcards (document_id, topic_id, front, back) VALUES (?, ?, ?, ?)'
    );

    cards.forEach((card) => {
      insertCard.run(documentId, topicIdByName.get(card.topic) || null, card.front, card.back);
    });

    updateJob(jobId, {
      status: 'completed',
      steps: { flashcards: 'done' },
      result: {
        documentId,
        topicCount: topics.length,
        flashcardCount: cards.length,
        questionCount: questions.length
      }
    });
  } catch (error) {
    updateJob(jobId, {
      status: 'failed',
      error: error.message || 'Upload processing failed.'
    });
  }
}

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('Missing file field.');
      err.status = 400;
      throw err;
    }

    const lowerName = req.file.originalname.toLowerCase();
    if (lowerName.endsWith('.pdf') && !req.file.buffer.slice(0, 5).toString().startsWith('%PDF-')) {
      const err = new Error('Unable to parse PDF: file is corrupted or unreadable.');
      err.status = 422;
      throw err;
    }

    const jobId = createJob();
    processUploadJob(jobId, req.file);

    res.json({ jobId });
  } catch (error) {
    next(error);
  }
});

router.get('/jobs/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found.' });
    return;
  }
  res.json(job);
});

export default router;
