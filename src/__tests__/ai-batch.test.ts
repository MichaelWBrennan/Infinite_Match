import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { AIContentGenerator } from '../services/ai-content-generator.js';

const savedEnv = { ...process.env };
const SETTLE_MS = 3000;

// Resolves to 'timeout' if the promise has not settled in time, so a hang fails the test instead of stalling jest.
function settleWithin<T>(promise: Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: unknown } | 'timeout'> {
  const timeout = new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), SETTLE_MS));
  return Promise.race([
    promise.then(
      (value) => ({ ok: true as const, value }),
      (error) => ({ ok: false as const, error }),
    ),
    timeout,
  ]);
}

describe('AI content batching', () => {
  beforeAll(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OLLAMA_BASE_URL;
  });
  afterAll(() => {
    process.env = savedEnv;
  });

  test('a request with no OpenAI key rejects instead of hanging', async () => {
    const generator = new AIContentGenerator() as any;
    const result = await settleWithin(generator.processBatchedRequest({ model: 'test', messages: [] }));
    expect(result).not.toBe('timeout');
    expect((result as any).ok).toBe(false);
    expect(String((result as any).error.message)).toMatch(/OpenAI is not configured/);
  });

  test('a client that throws synchronously rejects every queued request and frees the queue', async () => {
    const generator = new AIContentGenerator() as any;
    generator.openai = {
      chat: {
        completions: {
          create: () => {
            throw new Error('sync boom');
          },
        },
      },
    };
    const first = settleWithin(generator.processBatchedRequest({ model: 'a', messages: [] }));
    const second = settleWithin(generator.processBatchedRequest({ model: 'b', messages: [] }));
    const [a, b] = await Promise.all([first, second]);
    for (const outcome of [a, b]) {
      expect(outcome).not.toBe('timeout');
      expect((outcome as any).ok).toBe(false);
      expect(String((outcome as any).error.message)).toBe('sync boom');
    }
    expect(generator.isProcessingBatch).toBe(false);
    expect(generator.requestQueue).toHaveLength(0);
  });

  test('a successful call resolves with the client response', async () => {
    const generator = new AIContentGenerator() as any;
    generator.openai = {
      chat: { completions: { create: async (data: any) => ({ echoed: data.model }) } },
    };
    const result = await settleWithin(generator.processBatchedRequest({ model: 'ok', messages: [] }));
    expect(result).toEqual({ ok: true, value: { echoed: 'ok' } });
  });
});
