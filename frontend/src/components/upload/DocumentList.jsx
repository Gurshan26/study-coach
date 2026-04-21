import Button from '../shared/Button.jsx';

export default function DocumentList({ documents, onOpenQuiz, onOpenFlashcards, onOpenTopics }) {
  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div key={doc.id} className="card-shell lift flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-bold text-text">{doc.original_name}</p>
            <p className="text-xs text-text-muted">
              {doc.word_count} words • {doc.question_count} questions • {doc.flashcard_count} cards
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="soft" onClick={() => onOpenQuiz(doc.id)}>
              Quiz
            </Button>
            <Button variant="soft" onClick={() => onOpenFlashcards(doc.id)}>
              Flashcards
            </Button>
            <Button variant="ghost" onClick={() => onOpenTopics(doc.id)}>
              Topics
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
