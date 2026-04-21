import { Link } from 'react-router-dom';
import Button from '../shared/Button.jsx';

export default function QuizResults({ attempts, total }) {
  const correct = attempts.filter((attempt) => attempt.correct).length;
  const score = total ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="card-shell paper-grain p-8 text-center">
      <div className="relative z-10">
        <h2 className="font-display text-4xl text-text">Quiz Complete</h2>
        <p className="mt-3 font-display text-5xl text-text">{score}%</p>
        <p className="mt-2 text-sm text-text-muted">
          {correct} correct out of {total}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/quiz">
            <Button variant="ghost">Retry Quiz</Button>
          </Link>
          <Link to="/flashcards">
            <Button>Go to Flashcards</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
