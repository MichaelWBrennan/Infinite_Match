// Live ops S4: the browser's offline win queue (public/js/win-queue.js). Loaded as a classic script
// in a vm context with a storage stub, the same way the other browser modules are tested.
import { describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function load() {
  const storage = new Map<string, string>();
  const stub = { getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null), setItem: (k: string, v: string) => storage.set(k, String(v)) };
  const context: any = { globalThis: null, console, atob: globalThis.atob };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.resolve('public/js/win-queue.js'), 'utf8'), context);
  return { api: context.WinQueue, storage, queue: () => context.WinQueue.create(stub) };
}

const NOW = Date.UTC(2026, 9, 11, 12);
const body = (attemptId: string) => JSON.stringify({ level: 4, score: 1200, attemptId });
const ok = (result = { balances: { stars: 2 } }) => ({ ok: true, status: 200, data: { success: true, result } });

describe('offline win queue (S4)', () => {
  test('keeps one entry per attempt, scoped to its account, and drops the oldest when full', () => {
    const { queue, api } = load();
    const q = queue();
    q.add('alice', 'att_1', body('att_1'), NOW);
    q.add('alice', 'att_1', body('att_1'), NOW + 1000);
    q.add('bob', 'att_2', body('att_2'), NOW);
    expect(q.pendingFor('alice', NOW).map((i: any) => i.attemptId)).toEqual(['att_1']);
    expect(q.pendingFor('bob', NOW).map((i: any) => i.attemptId)).toEqual(['att_2']);
    for (let i = 0; i < api.MAX_ITEMS + 2; i++) q.add('alice', `att_full_${i}`, body(`att_full_${i}`), NOW + i);
    const ids = q.pendingFor('alice', NOW + 100).map((i: any) => i.attemptId);
    expect(ids).toHaveLength(api.MAX_ITEMS);
    expect(ids).not.toContain('att_full_0');
  });

  test('expired entries are removed on read, so a win older than the server limit is never sent', () => {
    const { queue, api, storage } = load();
    const q = queue();
    q.add('alice', 'att_old', body('att_old'), NOW - api.MAX_AGE_MS - 1);
    q.add('alice', 'att_new', body('att_new'), NOW);
    expect(q.pendingFor('alice', NOW).map((i: any) => i.attemptId)).toEqual(['att_new']);
    expect(storage.get(api.KEY)).not.toContain('att_old');
  });

  test('a settled win is removed; a second send of the same win leaves nothing to send', async () => {
    const { queue, api } = load();
    const q = queue();
    q.add('alice', 'att_1', body('att_1'), NOW);
    const sent: string[] = [];
    const send = async (b: string) => { sent.push(b); return ok(); };
    const first = await api.flush(q, 'alice', send, NOW);
    expect(first).toEqual([{ attemptId: 'att_1', outcome: 'settled', result: { balances: { stars: 2 } } }]);
    expect(await api.flush(q, 'alice', send, NOW)).toEqual([]);
    expect(sent).toHaveLength(1);
  });

  test('a refused win is dropped with its reason, and the queue moves on', async () => {
    const { queue, api } = load();
    const q = queue();
    q.add('alice', 'att_stale', body('att_stale'), NOW);
    q.add('alice', 'att_next', body('att_next'), NOW + 1);
    const send = async (b: string) => (b.includes('att_stale')
      ? { ok: false, status: 400, data: { success: false, error: 'attempt_not_found' } } : ok());
    const outcomes = await api.flush(q, 'alice', send, NOW + 2);
    expect(outcomes).toEqual([
      { attemptId: 'att_stale', outcome: 'refused', reason: 'attempt_not_found' },
      { attemptId: 'att_next', outcome: 'settled', result: { balances: { stars: 2 } } },
    ]);
    expect(q.pendingFor('alice', NOW + 2)).toEqual([]);
  });

  test('a network failure or server error keeps the win and stops the rest of the queue', async () => {
    const { queue, api } = load();
    const q = queue();
    q.add('alice', 'att_1', body('att_1'), NOW);
    q.add('alice', 'att_2', body('att_2'), NOW + 1);
    const offline = await api.flush(q, 'alice', async () => { throw new TypeError('Failed to fetch'); }, NOW + 2);
    expect(offline).toEqual([{ attemptId: 'att_1', outcome: 'kept' }]);
    const broken = await api.flush(q, 'alice', async () => ({ ok: false, status: 503, data: {} }), NOW + 2);
    expect(broken).toEqual([{ attemptId: 'att_1', outcome: 'kept' }]);
    expect(q.pendingFor('alice', NOW + 2).map((i: any) => i.attemptId)).toEqual(['att_1', 'att_2']);
  });

  test('another account never sends this account’s wins', async () => {
    const { queue, api } = load();
    const q = queue();
    q.add('bob', 'att_bob', body('att_bob'), NOW);
    expect(await api.flush(q, 'alice', async () => ok(), NOW)).toEqual([]);
    expect(q.pendingFor('bob', NOW)).toHaveLength(1);
  });

  test('the account is read from the token payload only for keeping wins apart', () => {
    const { api } = load();
    const payload = Buffer.from(JSON.stringify({ playerId: 'alice', sessionId: 's' })).toString('base64url');
    expect(api.playerIdFromToken(`h.${payload}.sig`)).toBe('alice');
    expect(api.playerIdFromToken('not-a-token')).toBe('');
    expect(api.playerIdFromToken('')).toBe('');
  });
});
