import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePdf = path.resolve(__dirname, '../fixtures/sample_lecture.pdf');

async function waitForJob(app, jobId, timeoutMs = 60000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const response = await request(app).get(`/api/jobs/${jobId}`);
    if (response.body.status === 'completed' || response.body.status === 'failed') {
      return response.body;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error('Timed out waiting for job completion.');
}

describe('upload routes', () => {
  it('POST valid PDF returns jobId and job completes', async () => {
    const app = createApp();

    const response = await request(app).post('/api/upload').attach('file', fixturePdf);

    expect(response.status).toBe(200);
    expect(response.body.jobId).toBeTruthy();

    const job = await waitForJob(app, response.body.jobId);
    expect(job.status).toBe('completed');
    expect(job.result.topicCount).toBeGreaterThanOrEqual(1);
    expect(job.result.flashcardCount).toBeGreaterThanOrEqual(5);
    expect(job.result.questionCount).toBeGreaterThanOrEqual(5);
  });

  it('POST invalid type returns 400', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('hello world'), 'notes.docx');

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Only PDF, TXT, and MD');
  });

  it('POST corrupted PDF returns 422', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('corrupted bytes'), 'broken.pdf');

    expect(response.status).toBe(422);
    expect(response.body.error.toLowerCase()).toContain('corrupted');
  });

  it('POST 51MB file returns 413', async () => {
    const app = createApp();

    const tooLarge = Buffer.alloc(51 * 1024 * 1024, 'a');
    const response = await request(app).post('/api/upload').attach('file', tooLarge, 'large.txt');

    expect(response.status).toBe(413);
  });

  it('Fixture exists', () => {
    expect(fs.existsSync(fixturePdf)).toBe(true);
  });
});
