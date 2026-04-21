import { useEffect } from 'react';
import { getWeakTopics } from '../api/client.js';
import { useStore } from '../store/useStore.js';

export function useWeakTopics(documentId) {
  const { weakTopics, setWeakTopics, setLoading, addToast } = useStore();

  useEffect(() => {
    setLoading('weakTopics', true);

    getWeakTopics(documentId)
      .then((response) => setWeakTopics(response.topics))
      .catch(() => addToast({ type: 'error', message: 'Unable to load weak topics.', action: 'Retry' }))
      .finally(() => setLoading('weakTopics', false));
  }, [documentId, setWeakTopics, setLoading, addToast]);

  return weakTopics;
}
