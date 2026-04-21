import fs from 'node:fs/promises';
import path from 'node:path';

function extractJsonBlock(rawText) {
  if (!rawText) {
    return null;
  }
  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

class NLPService {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.modelsCacheDir = path.resolve(process.cwd(), process.env.MODELS_CACHE_DIR || './models');
    this.ollamaCheck = {
      ts: 0,
      ok: false
    };
    this.transformersPipelines = null;
    this.transformersUnavailable = false;
  }

  async ensureCacheDir() {
    await fs.mkdir(this.modelsCacheDir, { recursive: true });
  }

  async isOllamaAvailable(force = false) {
    const now = Date.now();
    if (!force && now - this.ollamaCheck.ts < 5000) {
      return this.ollamaCheck.ok;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const response = await fetch(`${this.ollamaUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timeout);
      this.ollamaCheck = { ts: now, ok: response.ok };
      return response.ok;
    } catch {
      this.ollamaCheck = { ts: now, ok: false };
      return false;
    }
  }

  async generateWithOllama(prompt) {
    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3',
        stream: false,
        format: 'json',
        prompt
      })
    });

    if (!response.ok) {
      throw new Error('Ollama generation failed.');
    }

    const payload = await response.json();
    return extractJsonBlock(payload.response);
  }

  async generateJson({ prompt, fallbackProducer }) {
    if (await this.isOllamaAvailable()) {
      try {
        const json = await this.generateWithOllama(prompt);
        if (json) {
          return { json, provider: 'ollama' };
        }
      } catch {
        // fallback below
      }
    }

    if (fallbackProducer) {
      const json = await fallbackProducer();
      return { json, provider: 'fallback' };
    }

    return { json: null, provider: 'none' };
  }

  async getTransformersPipelines() {
    if (this.transformersUnavailable) {
      return null;
    }
    if (this.transformersPipelines) {
      return this.transformersPipelines;
    }

    try {
      await this.ensureCacheDir();
      const { pipeline, env } = await import('@xenova/transformers');
      env.allowRemoteModels = true;
      env.localModelPath = this.modelsCacheDir;

      const summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-12-6', {
        cache_dir: this.modelsCacheDir
      });
      const qa = await pipeline('question-answering', 'Xenova/bert-base-uncased', {
        cache_dir: this.modelsCacheDir
      });

      this.transformersPipelines = { summarizer, qa };
      return this.transformersPipelines;
    } catch {
      this.transformersUnavailable = true;
      return null;
    }
  }

  async summarize(text) {
    if (!text?.trim()) {
      return '';
    }

    const short = text.slice(0, 2500);

    if (await this.isOllamaAvailable()) {
      const prompt = [
        'Summarize this lecture text in 5 concise bullet points.',
        'Return JSON only: {"summary": ["..."]}',
        short
      ].join('\n\n');

      try {
        const output = await this.generateWithOllama(prompt);
        if (Array.isArray(output?.summary)) {
          return output.summary.join('\n');
        }
      } catch {
        // fallback below
      }
    }

    const pipelines = await this.getTransformersPipelines();
    if (!pipelines) {
      return short.split(/[.!?]/).filter(Boolean).slice(0, 4).join('. ').trim();
    }

    const result = await pipelines.summarizer(short, {
      max_length: 130,
      min_length: 30
    });
    return result?.[0]?.summary_text || '';
  }

  async renameTopics(rawTopics) {
    if (!rawTopics.length) {
      return rawTopics;
    }

    const prompt = [
      'Rename these raw topic clusters into clear academic topic names.',
      'Return JSON only: {"topics": [{"name": "..."}]}.',
      JSON.stringify(rawTopics)
    ].join('\n\n');

    if (!(await this.isOllamaAvailable())) {
      return rawTopics;
    }

    try {
      const output = await this.generateWithOllama(prompt);
      if (!Array.isArray(output?.topics)) {
        return rawTopics;
      }
      return rawTopics.map((topic, index) => ({
        ...topic,
        name: output.topics[index]?.name?.trim() || topic.name
      }));
    } catch {
      return rawTopics;
    }
  }

  getModeSummary() {
    return {
      ollamaAvailable: this.ollamaCheck.ok,
      transformersUnavailable: this.transformersUnavailable
    };
  }
}

export const nlpService = new NLPService();
