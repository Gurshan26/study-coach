import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz.js';
import QuizCard from '../components/quiz/QuizCard.jsx';
import QuizResults from '../components/quiz/QuizResults.jsx';
import ProgressBar from '../components/quiz/ProgressBar.jsx';
import EmptyState from '../components/shared/EmptyState.jsx';

export default function Quiz() {
  const [params] = useSearchParams();
  const docId = params.get('docId');
  const { quiz, answerQuestion } = useQuiz(docId);
  const [startedAt, setStartedAt] = useState(Date.now());
  const currentQuestion = quiz.questions[quiz.currentIndex];

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowRight' && quiz.sessionComplete) {
        window.location.assign('/flashcards');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [quiz.sessionComplete]);

  const handleAnswer = async (selected) => {
    const elapsed = Date.now() - startedAt;
    await answerQuestion(currentQuestion, selected, elapsed);
    setStartedAt(Date.now());
  };

  const summary = useMemo(() => {
    const correct = quiz.attempts.filter((attempt) => attempt.correct).length;
    return {
      correct,
      total: quiz.questions.length
    };
  }, [quiz.attempts, quiz.questions.length]);

  if (!docId) {
    return <EmptyState title="Select a document" description="Upload notes first, then start a quiz from dashboard actions." />;
  }

  if (!quiz.questions.length) {
    return <EmptyState title="No quiz questions yet" description="Generate questions by uploading a richer document." />;
  }

  if (quiz.sessionComplete) {
    return <QuizResults attempts={quiz.attempts} total={summary.total} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="card-shell p-4">
        <ProgressBar current={quiz.currentIndex + 1} total={quiz.questions.length} />
        <p className="mt-2 text-right font-mono text-xs text-text-muted">
          Question {quiz.currentIndex + 1}/{quiz.questions.length}
        </p>
      </div>
      <QuizCard question={currentQuestion} onAnswer={handleAnswer} />
    </div>
  );
}
