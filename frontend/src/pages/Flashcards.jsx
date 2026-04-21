import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CardDeck from '../components/flashcards/CardDeck.jsx';
import ReviewButtons from '../components/flashcards/ReviewButtons.jsx';
import { useFlashcards } from '../hooks/useFlashcards.js';
import EmptyState from '../components/shared/EmptyState.jsx';

export default function Flashcards() {
  const [params] = useSearchParams();
  const docId = params.get('docId');
  const { flashcards, rateCard } = useFlashcards(docId);
  const [flipped, setFlipped] = useState(false);

  const currentCard = flashcards.dueCards[flashcards.currentIndex];

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === ' ') {
        event.preventDefault();
        setFlipped((value) => !value);
      }
      if (/^[0-5]$/.test(event.key) && currentCard) {
        rateCard(currentCard, Number(event.key));
        setFlipped(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentCard, rateCard]);

  if (!flashcards.dueCards.length && !flashcards.sessionComplete) {
    return <EmptyState title="No cards due" description="You are caught up for now." />;
  }

  if (flashcards.sessionComplete) {
    return (
      <div className="card-shell paper-grain p-8 text-center">
        <div className="relative z-10">
          <h2 className="font-display text-4xl text-text">Session Complete</h2>
          <p className="mt-2 text-text-muted">Cards reviewed and schedule updated.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <CardDeck
        cards={flashcards.dueCards}
        index={flashcards.currentIndex}
        flipped={flipped}
        onFlip={() => setFlipped(!flipped)}
      />
      <ReviewButtons
        onRate={(quality) => {
          rateCard(currentCard, quality);
          setFlipped(false);
        }}
      />
    </div>
  );
}
