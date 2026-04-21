export default function FlashCard({ card, flipped, onFlip }) {
  if (!card) {
    return null;
  }

  return (
    <button
      className={`flip-card relative h-80 w-full rounded-[20px] text-left ${flipped ? 'flipped' : ''}`}
      onClick={onFlip}
      aria-label="Flashcard"
      aria-pressed={flipped}
    >
      <div className="flip-face card-shell paper-grain absolute inset-0 p-6">
        <div className="relative z-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">Front</p>
          <p className="mt-5 font-display text-3xl text-text">{card.front}</p>
        </div>
      </div>
      <div className="flip-face flip-back card-shell paper-grain absolute inset-0 p-6">
        <div className="relative z-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">Back</p>
          <p className="mt-5 text-lg font-semibold text-text">{card.back}</p>
        </div>
      </div>
    </button>
  );
}
