import axios from 'axios';

const defaultBaseURL = import.meta.env.PROD ? '/_/backend' : 'http://localhost:3001';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseURL
});

function isOfflineError(error) {
  return !error.response;
}

export async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await client.post('/api/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function getJob(jobId) {
  const { data } = await client.get(`/api/jobs/${jobId}`);
  return data;
}

export async function getDocuments() {
  const { data } = await client.get('/api/documents');
  return data;
}

export async function deleteDocument(id) {
  const { data } = await client.delete(`/api/documents/${id}`);
  return data;
}

export async function getQuiz(documentId, params = {}) {
  const { data } = await client.get(`/api/quiz/${documentId}`, { params });
  return data;
}

export async function generateQuiz(payload) {
  const { data } = await client.post('/api/quiz/generate', payload);
  return data;
}

export async function submitAttempt(payload) {
  try {
    const { data } = await client.post('/api/quiz/attempt', payload);
    return data;
  } catch (error) {
    if (isOfflineError(error)) {
      throw Object.assign(new Error('offline'), { offline: true, payload });
    }
    throw error;
  }
}

export async function getDueCards(docId) {
  const { data } = await client.get('/api/flashcards/due', {
    params: docId ? { docId } : {}
  });
  return data;
}

export async function reviewCard(cardId, quality) {
  try {
    const { data } = await client.post(`/api/flashcards/${cardId}/review`, { quality });
    return data;
  } catch (error) {
    if (isOfflineError(error)) {
      throw Object.assign(new Error('offline'), {
        offline: true,
        payload: { cardId, quality }
      });
    }
    throw error;
  }
}

export async function getWeakTopics(documentId) {
  const { data } = await client.get('/api/topics/weak', {
    params: documentId ? { documentId } : {}
  });
  return data;
}

export async function getStats() {
  const { data } = await client.get('/api/stats');
  return data;
}

export default client;
