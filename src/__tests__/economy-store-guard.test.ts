import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { assertEconomyStoreForEnvironment } from '../services/economy/PlayerEconomyDb.js';

describe('production refuses an in-memory economy', () => {
  test('production without ECONOMY_STORE=mongo does not start', () => {
    expect(() => assertEconomyStoreForEnvironment({ NODE_ENV: 'production' } as any)).toThrow(/ECONOMY_STORE=mongo/);
    expect(() => assertEconomyStoreForEnvironment({ NODE_ENV: 'production', ECONOMY_STORE: 'memory' } as any)).toThrow();
  });

  test('production with the database store starts', () => {
    expect(() => assertEconomyStoreForEnvironment({ NODE_ENV: 'production', ECONOMY_STORE: 'mongo' } as any)).not.toThrow();
  });

  test('development and test may run in memory', () => {
    expect(() => assertEconomyStoreForEnvironment({ NODE_ENV: 'development' } as any)).not.toThrow();
    expect(() => assertEconomyStoreForEnvironment({} as any)).not.toThrow();
  });

  test('the server checks the store before it listens', () => {
    const server = fs.readFileSync(path.join(process.cwd(), 'src/server/index.ts'), 'utf-8');
    const start = server.indexOf('public async start(): Promise<void> {');
    const body = server.slice(start, start + 400);
    expect(body.indexOf('assertEconomyStoreForEnvironment')).toBeGreaterThan(-1);
    expect(body.indexOf('assertEconomyStoreForEnvironment')).toBeLessThan(body.indexOf('initializeServices'));
  });
});
