import { nlpService } from './nlpService.js';

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'that',
  'with',
  'this',
  'from',
  'you',
  'your',
  'are',
  'was',
  'were',
  'has',
  'have',
  'had',
  'but',
  'not',
  'can',
  'all',
  'into',
  'then',
  'than',
  'its',
  'their',
  'they',
  'them',
  'about',
  'also',
  'when',
  'where',
  'what',
  'which',
  'while',
  'will',
  'would',
  'could',
  'should',
  'more',
  'most',
  'some',
  'each',
  'such',
  'between',
  'through',
  'over',
  'under',
  'within',
  'without',
  'been',
  'being',
  'because',
  'there',
  'these',
  'those',
  'using',
  'use',
  'used',
  'very',
  'into',
  'onto',
  'during',
  'after',
  'before',
  'lecture',
  'notes'
]);

function splitParagraphs(text) {
  return text
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function extractCandidatePhrases(paragraph) {
  const tokens = tokenize(paragraph);
  const phrases = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    phrases.push(token);
    if (tokens[i + 1]) {
      phrases.push(`${token} ${tokens[i + 1]}`);
    }
  }

  return phrases;
}

function cosineSimilarity(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const key of keys) {
    const av = a[key] || 0;
    const bv = b[key] || 0;
    dot += av * bv;
    magA += av * av;
    magB += bv * bv;
  }

  if (!magA || !magB) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function vectorizePhrase(phrase) {
  const tokens = phrase.split(' ');
  return tokens.reduce((acc, token) => {
    acc[token] = (acc[token] || 0) + 1;
    return acc;
  }, {});
}

function titleCase(input) {
  return input
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function extractTopics(text, externalNlpService = nlpService) {
  const paragraphs = splitParagraphs(text);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  if (wordCount < 100) {
    return [
      {
        name: 'Core Concepts',
        keywords: [...new Set(tokenize(text).slice(0, 6))],
        paragraphIndices: paragraphs.length ? [0] : []
      }
    ];
  }

  const topicTarget = Math.max(5, Math.round(wordCount / 200));

  const phraseStats = new Map();
  const docFrequency = new Map();

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const phrases = extractCandidatePhrases(paragraph);
    const seenInParagraph = new Set();

    phrases.forEach((phrase) => {
      const existing = phraseStats.get(phrase) || {
        tf: 0,
        paragraphs: new Set()
      };
      existing.tf += 1;
      existing.paragraphs.add(paragraphIndex);
      phraseStats.set(phrase, existing);

      if (!seenInParagraph.has(phrase)) {
        docFrequency.set(phrase, (docFrequency.get(phrase) || 0) + 1);
        seenInParagraph.add(phrase);
      }
    });
  });

  const scored = [...phraseStats.entries()]
    .map(([phrase, stats]) => {
      const df = docFrequency.get(phrase) || 1;
      const idf = Math.log((paragraphs.length + 1) / df);
      return {
        phrase,
        score: stats.tf * idf,
        paragraphs: [...stats.paragraphs]
      };
    })
    .filter((entry) => entry.phrase.split(' ').length <= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, topicTarget * 4);

  const clusters = [];

  scored.forEach((entry) => {
    const vector = vectorizePhrase(entry.phrase);
    let chosenCluster = null;

    for (const cluster of clusters) {
      const similarity = cosineSimilarity(cluster.vector, vector);
      if (similarity >= 0.45) {
        chosenCluster = cluster;
        break;
      }
    }

    if (!chosenCluster) {
      chosenCluster = {
        phrases: [],
        vector: {},
        paragraphIndices: new Set()
      };
      clusters.push(chosenCluster);
    }

    chosenCluster.phrases.push(entry);
    entry.phrase.split(' ').forEach((token) => {
      chosenCluster.vector[token] = (chosenCluster.vector[token] || 0) + 1;
    });
    entry.paragraphs.forEach((idx) => chosenCluster.paragraphIndices.add(idx));
  });

  const rawTopics = clusters
    .sort((a, b) => b.phrases.length - a.phrases.length)
    .slice(0, topicTarget)
    .map((cluster) => {
      const sortedKeywords = cluster.phrases.map((phrase) => phrase.phrase).slice(0, 5);
      const name = titleCase(sortedKeywords[0] || 'General Topic');
      return {
        name,
        keywords: [...new Set(sortedKeywords)],
        paragraphIndices: [...cluster.paragraphIndices].sort((a, b) => a - b)
      };
    });

  return externalNlpService.renameTopics(rawTopics);
}
