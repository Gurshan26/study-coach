import { calculateSM2 } from './sm2.js';

function splitParagraphs(text) {
  return text
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function sentenceSnippet(paragraph, maxLength = 180) {
  const sentence = paragraph.split(/(?<=[.!?])\s+/).find(Boolean) || paragraph;
  if (sentence.length <= maxLength) {
    return sentence;
  }
  return `${sentence.slice(0, maxLength).trim()}...`;
}

export function generateInitialFlashcards({ text, topics }) {
  const paragraphs = splitParagraphs(text);
  const cards = [];

  topics.forEach((topic) => {
    const firstParagraphIndex = topic.paragraphIndices?.[0] ?? 0;
    const paragraph = paragraphs[firstParagraphIndex] || paragraphs[0] || text;
    cards.push({
      topic: topic.name,
      front: `Explain ${topic.name} in your own words.`,
      back: sentenceSnippet(paragraph)
    });

    if (topic.keywords?.length) {
      const keyword = topic.keywords[0];
      cards.push({
        topic: topic.name,
        front: `What is the role of "${keyword}" in ${topic.name}?`,
        back: sentenceSnippet(paragraphs[(topic.paragraphIndices?.[1] ?? firstParagraphIndex)] || paragraph)
      });
    }
  });

  const deduped = [];
  const seen = new Set();
  for (const card of cards) {
    const key = `${card.front}::${card.back}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(card);
    }
  }

  if (deduped.length < 5) {
    const fallbackParagraphs = paragraphs.length ? paragraphs : [text];
    let index = 0;
    while (deduped.length < 5 && index < fallbackParagraphs.length * 2) {
      const paragraph = fallbackParagraphs[index % fallbackParagraphs.length];
      deduped.push({
        topic: topics[0]?.name || 'General',
        front: `Summarize this key idea #${deduped.length + 1}.`,
        back: sentenceSnippet(paragraph)
      });
      index += 1;
    }
  }

  return deduped;
}

export function getDueFlashcards(db, docId) {
  const query = docId
    ? db.prepare(
        `SELECT f.*, t.name AS topic_name
         FROM flashcards f
         LEFT JOIN topics t ON t.id = f.topic_id
         WHERE f.next_review <= CURRENT_TIMESTAMP AND f.document_id = ?
         ORDER BY f.next_review ASC`
      )
    : db.prepare(
        `SELECT f.*, t.name AS topic_name
         FROM flashcards f
         LEFT JOIN topics t ON t.id = f.topic_id
         WHERE f.next_review <= CURRENT_TIMESTAMP
         ORDER BY f.next_review ASC`
      );

  return docId ? query.all(docId) : query.all();
}

export function reviewFlashcard(db, flashcardId, quality) {
  const card = db
    .prepare('SELECT id, interval, repetitions, ease_factor AS easeFactor FROM flashcards WHERE id = ?')
    .get(flashcardId);

  if (!card) {
    const err = new Error('Flashcard not found.');
    err.status = 404;
    throw err;
  }

  const sm2 = calculateSM2({
    easeFactor: card.easeFactor,
    interval: card.interval,
    repetitions: card.repetitions,
    quality
  });

  const transaction = db.transaction(() => {
    db.prepare('INSERT INTO flashcard_reviews (flashcard_id, quality) VALUES (?, ?)').run(flashcardId, quality);
    db.prepare(
      `UPDATE flashcards
       SET interval = ?, repetitions = ?, ease_factor = ?, next_review = ?
       WHERE id = ?`
    ).run(
      sm2.newInterval,
      sm2.newRepetitions,
      sm2.newEaseFactor,
      sm2.nextReview.toISOString(),
      flashcardId
    );
  });

  transaction();

  return db.prepare('SELECT * FROM flashcards WHERE id = ?').get(flashcardId);
}
