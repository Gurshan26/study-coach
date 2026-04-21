import { useEffect, useMemo, useState } from 'react';

export default function QuizCard({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setSelected(null);
    setRevealed(false);
  }, [question.id, question.question]);

  const options = useMemo(
    () => [question.correct_answer, ...(question.distractors || [])].sort(() => Math.random() - 0.5),
    [question]
  );

  const choose = (option) => {
    if (revealed) {
      return;
    }
    setSelected(option);
    setRevealed(true);
    onAnswer(option);
  };

  const optionClass = (option) => {
    if (!revealed) {
      return 'bg-surface hover:bg-surface-soft border-border';
    }
    if (option === question.correct_answer) {
      return 'bg-success/30 border-success';
    }
    if (option === selected && option !== question.correct_answer) {
      return 'bg-danger/30 border-danger';
    }
    return 'bg-surface-soft border-border opacity-75';
  };

  return (
    <div className="card-shell paper-grain p-6 md:p-8">
      <div className="relative z-10">
        <h2 className="font-display text-3xl leading-tight text-text">{question.question}</h2>
        <div className="mt-6 space-y-3">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => choose(option)}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold text-text transition ${optionClass(option)}`}
              aria-label={`Answer option ${option}`}
            >
              {option}
            </button>
          ))}
        </div>
        {revealed ? (
          <p className="mt-4 rounded-xl bg-surface-soft p-3 text-sm text-text-muted">
            {question.explanation || `Correct answer: ${question.correct_answer}`}
          </p>
        ) : null}
      </div>
    </div>
  );
}
