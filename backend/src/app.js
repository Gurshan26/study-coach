import express from 'express';
import cors from 'cors';
import uploadRoutes from './routes/upload.js';
import documentsRoutes from './routes/documents.js';
import quizRoutes from './routes/quiz.js';
import flashcardsRoutes from './routes/flashcards.js';
import topicsRoutes from './routes/topics.js';
import statsRoutes from './routes/stats.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
    })
  );
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api', uploadRoutes);
  app.use('/api/documents', documentsRoutes);
  app.use('/api/quiz', quizRoutes);
  app.use('/api/flashcards', flashcardsRoutes);
  app.use('/api/topics', topicsRoutes);
  app.use('/api/stats', statsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
