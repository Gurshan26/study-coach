import { nanoid } from 'nanoid';

const jobs = new Map();

export function createJob() {
  const id = nanoid(10);
  jobs.set(id, {
    id,
    status: 'queued',
    steps: {
      parsing: 'pending',
      topics: 'pending',
      quiz: 'pending',
      flashcards: 'pending'
    },
    createdAt: new Date().toISOString()
  });
  return id;
}

export function updateJob(id, patch) {
  const current = jobs.get(id);
  if (!current) {
    return null;
  }
  const next = {
    ...current,
    ...patch,
    steps: {
      ...current.steps,
      ...(patch.steps || {})
    }
  };
  jobs.set(id, next);
  return next;
}

export function getJob(id) {
  return jobs.get(id) || null;
}
