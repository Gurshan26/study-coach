import { nlpService } from './nlpService.js';

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30);
}

function chunkText(text, chunkSize = 20) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) {
    return [];
  }
  const chunks = [];
  for (let index = 0; index < words.length; index += chunkSize) {
    chunks.push(words.slice(index, index + chunkSize).join(' '));
  }
  return chunks;
}

function normalizeQuestion(question) {
  return question.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractTerms(text) {
  const fromCaps = (text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || []).map((t) => t.trim());
  const fromKeywords = (text.toLowerCase().match(/\b[a-z]{5,}\b/g) || []).slice(0, 200);
  return [...new Set([...fromCaps, ...fromKeywords])].filter((term) => term.length > 2);
}

function createDistractors(correctAnswer, termPool) {
  const normalizedCorrect = correctAnswer.toLowerCase();
  const distractors = [];

  for (const term of termPool) {
    const normalizedTerm = term.toLowerCase();
    if (normalizedTerm === normalizedCorrect) {
      continue;
    }
    if (distractors.some((item) => item.toLowerCase() === normalizedTerm)) {
      continue;
    }
    distractors.push(term);
    if (distractors.length === 3) {
      break;
    }
  }

  while (distractors.length < 3) {
    distractors.push(`Alternative concept ${distractors.length + 1}`);
  }

  return distractors;
}

function inferTopic(sentence, topics = []) {
  const lowered = sentence.toLowerCase();
  const match = topics.find((topic) =>
    topic.keywords.some((keyword) => lowered.includes(String(keyword).toLowerCase()))
  );
  return match?.name || topics[0]?.name || 'General';
}

function difficultyMix(total) {
  const easy = Math.round(total * 0.4);
  const medium = Math.round(total * 0.4);
  const hard = Math.max(total - easy - medium, 0);
  return [
    ...Array(easy).fill('easy'),
    ...Array(medium).fill('medium'),
    ...Array(hard).fill('hard')
  ];
}

function sanitizeQuestion(question, idx, difficulties, topics = []) {
  if (!question?.question || !question?.correct_answer || !Array.isArray(question?.distractors)) {
    return null;
  }

  const distractors = question.distractors.filter(Boolean).slice(0, 3);
  while (distractors.length < 3) {
    distractors.push(`Option ${distractors.length + 1}`);
  }

  return {
    question: question.question.trim(),
    correct_answer: question.correct_answer.trim(),
    distractors,
    difficulty: ['easy', 'medium', 'hard'].includes(question.difficulty)
      ? question.difficulty
      : difficulties[idx] || 'medium',
    topic: question.topic || topics[0]?.name || 'General',
    explanation: question.explanation || `The correct answer is ${question.correct_answer.trim()}.`
  };
}

export async function generateQuizQuestions({
  documentId,
  text,
  topics = [],
  existingQuestions = [],
  count,
  difficulty,
  externalNlpService = nlpService
}) {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const minimumByDensity = Math.max(1, Math.ceil(wordCount / 200));
  const defaultCount = Math.max(5, minimumByDensity);
  const targetCount = Math.min(50, count || defaultCount);
  const desiredDifficultyOrder = difficulty
    ? Array(targetCount).fill(difficulty)
    : difficultyMix(targetCount);

  const existingSet = new Set(existingQuestions.map((item) => normalizeQuestion(item.question || item)));

  const heuristicFallback = () => {
    const sentences = splitSentences(text);
    const fallbackSeeds = sentences.length ? sentences : chunkText(text, 20);
    const termPool = extractTerms(text);
    const questions = [];
    const localExistingSet = new Set(existingSet);

    for (const sentence of sentences) {
      if (questions.length >= targetCount) {
        break;
      }

      const definitionMatch = sentence.match(/\b([A-Za-z][A-Za-z\s-]{2,})\s+(?:is|are|refers to)\s+([^.!?]{10,})/i);
      const numberMatch = sentence.match(/\b(\d+(?:\.\d+)?)\b/);
      const namedMatch = sentence.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/);

      let question;
      let correctAnswer;

      if (definitionMatch) {
        question = `What best describes ${definitionMatch[1].trim()}?`;
        correctAnswer = definitionMatch[2].trim();
      } else if (numberMatch) {
        question = `In context, what does the value ${numberMatch[1]} relate to?`;
        correctAnswer = sentence;
      } else if (namedMatch) {
        question = `How does ${namedMatch[1].trim()} fit into this topic?`;
        correctAnswer = sentence;
      } else {
        question = `Complete the concept from this statement: "${sentence.slice(0, 80)}..."`;
        correctAnswer = sentence;
      }

      const normalized = normalizeQuestion(question);
      if (localExistingSet.has(normalized)) {
        continue;
      }

      localExistingSet.add(normalized);
      questions.push({
        question,
        correct_answer: correctAnswer,
        distractors: createDistractors(correctAnswer, termPool),
        difficulty: desiredDifficultyOrder[questions.length] || 'medium',
        topic: inferTopic(sentence, topics),
        explanation: sentence
      });
    }

    while (questions.length < targetCount) {
      const idx = questions.length;
      const seed = fallbackSeeds[idx % Math.max(fallbackSeeds.length, 1)] || text.slice(0, 120);
      const prompt = `Which concept is best supported by: "${seed.slice(0, 90)}..."?`;
      const normalized = normalizeQuestion(prompt);
      if (localExistingSet.has(normalized)) {
        if (fallbackSeeds.length <= 1) {
          break;
        }
        continue;
      }
      localExistingSet.add(normalized);
      questions.push({
        question: prompt,
        correct_answer: seed,
        distractors: createDistractors(seed, extractTerms(text)),
        difficulty: desiredDifficultyOrder[idx] || 'medium',
        topic: inferTopic(seed, topics),
        explanation: seed
      });
    }

    return { questions };
  };

  const prompt = [
    'Given this educational text excerpt, generate multiple-choice quiz questions.',
    `Need ${targetCount} questions. Mix difficulties with approx easy 40%, medium 40%, hard 20%.`,
    'Questions must test understanding and be unambiguous.',
    'Return JSON only: {"questions":[{"question":"...","correct_answer":"...","distractors":["...","...","..."],"difficulty":"easy|medium|hard","topic":"...","explanation":"..."}]}.',
    `Known topics: ${topics.map((topic) => topic.name).join(', ')}`,
    text.slice(0, 8000)
  ].join('\n\n');

  const { json } = await externalNlpService.generateJson({
    prompt,
    fallbackProducer: heuristicFallback
  });

  const rawQuestions = Array.isArray(json?.questions) ? json.questions : [];
  const prepared = rawQuestions
    .map((item, idx) => sanitizeQuestion(item, idx, desiredDifficultyOrder, topics))
    .filter(Boolean)
    .filter((item) => {
      const key = normalizeQuestion(item.question);
      if (existingSet.has(key)) {
        return false;
      }
      existingSet.add(key);
      return true;
    });

  if (prepared.length >= minimumByDensity) {
    return prepared.slice(0, targetCount);
  }

  const fallback = heuristicFallback().questions;
  const merged = [...prepared];
  for (const question of fallback) {
    if (merged.length >= targetCount) {
      break;
    }
    const key = normalizeQuestion(question.question);
    if (merged.some((item) => normalizeQuestion(item.question) === key)) {
      continue;
    }
    merged.push(question);
  }

  return merged.slice(0, targetCount);
}
