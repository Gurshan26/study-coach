import { describe, expect, it } from 'vitest';
import { generateQuizQuestions } from '../../src/services/quizGenerator.js';

const text = `A perceptron is a binary linear classifier used in early neural networks.
Activation functions such as sigmoid, tanh, and ReLU introduce non-linearity.
Backpropagation computes gradients through the chain rule.
Gradient descent updates parameters by moving opposite the gradient.
Learning rates control step size and affect convergence speed.`;

describe('quizGenerator', () => {
  it('Mock LLM response returns expected shape', async () => {
    const mockNlp = {
      generateJson: async () => ({
        json: {
          questions: [
            {
              question: 'What does backpropagation compute?',
              correct_answer: 'Gradients',
              distractors: ['Datasets', 'Activations only', 'Noise'],
              difficulty: 'medium',
              topic: 'Backpropagation'
            }
          ]
        }
      })
    };

    const result = await generateQuizQuestions({
      documentId: 1,
      text,
      topics: [{ name: 'Backpropagation', keywords: ['gradients'], paragraphIndices: [2] }],
      existingQuestions: [],
      count: 1,
      externalNlpService: mockNlp
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        question: expect.any(String),
        correct_answer: expect.any(String),
        distractors: expect.arrayContaining([expect.any(String)]),
        difficulty: expect.any(String)
      })
    );
  });

  it('Heuristic fallback generates questions without LLM', async () => {
    const mockNlp = {
      generateJson: async ({ fallbackProducer }) => ({ json: await fallbackProducer() })
    };

    const result = await generateQuizQuestions({
      documentId: 1,
      text,
      topics: [{ name: 'Neural Networks', keywords: ['perceptron'], paragraphIndices: [0] }],
      existingQuestions: [],
      count: 5,
      externalNlpService: mockNlp
    });

    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('Deduplication avoids duplicate questions', async () => {
    const mockNlp = {
      generateJson: async () => ({
        json: {
          questions: [
            {
              question: 'What does backpropagation compute?',
              correct_answer: 'Gradients',
              distractors: ['Datasets', 'Activations only', 'Noise'],
              difficulty: 'medium',
              topic: 'Backpropagation'
            }
          ]
        }
      })
    };

    const result = await generateQuizQuestions({
      documentId: 1,
      text,
      topics: [{ name: 'Backpropagation', keywords: ['gradients'], paragraphIndices: [2] }],
      existingQuestions: [{ question: 'What does backpropagation compute?' }],
      count: 2,
      externalNlpService: mockNlp
    });

    expect(result.some((question) => question.question === 'What does backpropagation compute?')).toBe(false);
  });

  it('Generates at least 1 question per 200 words baseline', async () => {
    const longText = new Array(220).fill('neural network learning').join(' ');
    const mockNlp = {
      generateJson: async ({ fallbackProducer }) => ({ json: await fallbackProducer() })
    };

    const result = await generateQuizQuestions({
      documentId: 1,
      text: longText,
      topics: [{ name: 'Neural Networks', keywords: ['network'], paragraphIndices: [0] }],
      existingQuestions: [],
      count: undefined,
      externalNlpService: mockNlp
    });

    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});
