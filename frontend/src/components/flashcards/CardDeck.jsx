import FlashCard from './FlashCard.jsx';

export default function CardDeck({ cards, index, flipped, onFlip }) {
  const current = cards[index];

  return (
    <div className="relative mx-auto max-w-2xl">
      <div className="absolute inset-x-8 top-4 h-80 rounded-[20px] border border-border bg-secondary/22" aria-hidden="true" />
      <div className="absolute inset-x-4 top-2 h-80 rounded-[20px] border border-border bg-primary/22" aria-hidden="true" />
      <FlashCard card={current} flipped={flipped} onFlip={onFlip} />
    </div>
  );
}
