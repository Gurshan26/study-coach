import { useEffect } from 'react';
import { getQuiz, submitAttempt } from '../api/client.js';
import { useStore } from '../store/useStore.js';

export function useQuiz(documentId) {
  const { quiz, setQuiz, setLoading, addToast, enqueueAction, markOffline } = useStore();

  useEffect(() => {
    if (!documentId) {
      return;
    }

    let mounted = true;
    setLoading('quiz', true);

    getQuiz(documentId, { limit: 50 })
      .then((response) => {
        if (!mounted) {
          return;
        }
        setQuiz({
          questions: response.questions,
          currentIndex: 0,
          attempts: [],
          sessionComplete: false
        });
      })
      .catch(() => addToast({ type: 'error', message: 'Failed to load quiz questions.', action: 'Retry' }))
      .finally(() => setLoading('quiz', false));

    return () => {
      mounted = false;
    };
  }, [documentId, setQuiz, setLoading, addToast]);

  const answerQuestion = async (question, answer, timeTakenMs) => {
    try {
      markOffline(false);
      const result = await submitAttempt({
        questionId: question.id,
        chosenAnswer: answer,
        timeTakenMs
      });

      const attempts = [...quiz.attempts, { questionId: question.id, answer, correct: result.correct }];
      const currentIndex = quiz.currentIndex + 1;

      setQuiz({
        attempts,
        currentIndex,
        sessionComplete: currentIndex >= quiz.questions.length
      });

      return result;
    } catch (error) {
      if (error.offline) {
        markOffline(true);
        enqueueAction({ type: 'quiz-attempt', payload: error.payload });
        addToast({ type: 'warning', message: 'Offline: quiz attempt queued.', action: 'Retry' });
        return { correct: false, explanation: 'Attempt queued while offline.' };
      }
      addToast({ type: 'error', message: 'Unable to submit quiz attempt.', action: 'Retry' });
      throw error;
    }
  };

  return {
    quiz,
    answerQuestion
  };
}
