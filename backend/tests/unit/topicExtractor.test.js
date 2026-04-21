import { describe, expect, it } from 'vitest';
import { extractTopics } from '../../src/services/topicExtractor.js';

describe('topicExtractor', () => {
  it('Extracts expected number of topics for word count', async () => {
    const text = new Array(1000)
      .fill('perceptron activation function backpropagation gradient descent optimization neural network model')
      .join(' ');
    const topics = await extractTopics(text, { renameTopics: async (input) => input });
    expect(topics.length).toBeGreaterThanOrEqual(5);
  });

  it('Topics contain required fields', async () => {
    const text = `Perceptrons are linear models. Activation functions include sigmoid and ReLU.

Backpropagation computes gradients for each layer.

Gradient descent updates weights iteratively.`;
    const topics = await extractTopics(text, { renameTopics: async (input) => input });

    expect(topics[0]).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        keywords: expect.any(Array),
        paragraphIndices: expect.any(Array)
      })
    );
  });

  it('Short documents are handled gracefully', async () => {
    const text = 'Neural networks use weighted sums and activation functions.';
    const topics = await extractTopics(text, { renameTopics: async (input) => input });

    expect(topics.length).toBe(1);
    expect(topics[0].name).toBe('Core Concepts');
  });
});
