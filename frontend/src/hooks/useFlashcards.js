import { useEffect } from 'react';
import { getDueCards, reviewCard } from '../api/client.js';
import { useStore } from '../store/useStore.js';

export function applySm2Preview(card, quality) {
  if (quality < 3) {
    return { ...card, interval: 1, repetitions: 0 };
  }
  if (card.repetitions === 0) {
    return { ...card, interval: 1, repetitions: 1 };
  }
  if (card.repetitions === 1) {
    return { ...card, interval: 6, repetitions: 2 };
  }
  return {
    ...card,
    interval: Math.round(card.interval * card.ease_factor),
    repetitions: card.repetitions + 1
  };
}

export function useFlashcards(documentId) {
  const { flashcards, setFlashcards, setLoading, addToast, enqueueAction, markOffline } = useStore();

  useEffect(() => {
    let mounted = true;
    setLoading('flashcards', true);

    getDueCards(documentId)
      .then((response) => {
        if (!mounted) {
          return;
        }
        setFlashcards({
          dueCards: response.cards,
          currentIndex: 0,
          sessionComplete: response.cards.length === 0
        });
      })
      .catch(() => addToast({ type: 'error', message: 'Failed to load due flashcards.', action: 'Retry' }))
      .finally(() => setLoading('flashcards', false));

    return () => {
      mounted = false;
    };
  }, [documentId, setFlashcards, setLoading, addToast]);

  const rateCard = async (card, quality) => {
    try {
      markOffline(false);
      await reviewCard(card.id, quality);

      const remaining = [...flashcards.dueCards];
      remaining.splice(flashcards.currentIndex, 1);
      if (quality === 0) {
        remaining.push(card);
      }

      const currentIndex = Math.min(flashcards.currentIndex, Math.max(remaining.length - 1, 0));
      setFlashcards({
        dueCards: remaining,
        currentIndex,
        sessionComplete: remaining.length === 0
      });
    } catch (error) {
      if (error.offline) {
        markOffline(true);
        enqueueAction({ type: 'flashcard-review', payload: error.payload });
        addToast({ type: 'warning', message: 'Offline: flashcard review queued.', action: 'Retry' });
        return;
      }
      addToast({ type: 'error', message: 'Could not save flashcard review.', action: 'Retry' });
      throw error;
    }
  };

  return {
    flashcards,
    rateCard
  };
}
