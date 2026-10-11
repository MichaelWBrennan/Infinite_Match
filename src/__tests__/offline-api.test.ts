import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// public/js/offline-api.js is a classic script that wraps window.fetch on the free static host.
function runShim(href: string) {
  const native = { calls: [] as string[] };
  const sandbox: any = {
    location: new URL(href),
    URL,
    URLSearchParams,
    Response,
    Promise,
    JSON,
    fetch: (input: any) => {
      native.calls.push(typeof input === 'string' ? input : input.url);
      return Promise.resolve(new Response('native', { status: 200 }));
    },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(readFileSync('public/js/offline-api.js', 'utf8'), sandbox);
  return { sandbox, native };
}

describe('offline API shim', () => {
  test('on the free static host, same-origin /api calls are answered locally with 503 and never reach the network', async () => {
    const { sandbox, native } = runShim('https://infinite-match.example/');
    expect(sandbox.InfiniteMatchApi.mode).toBe('offline');
    const response = await sandbox.fetch('/api/account-economy/data', { method: 'GET' });
    expect(response.status).toBe(503);
    expect(response.headers.get('content-type')).toBe('application/json');
    const body = await response.json();
    expect(body).toMatchObject({ success: false, ok: false, code: 'api_unavailable', error: 'api_unavailable' });
    expect(native.calls).toEqual([]);
  });

  test('other same-origin requests and absolute /api URLs on other hosts still use the network', async () => {
    const { sandbox, native } = runShim('https://infinite-match.example/');
    await sandbox.fetch('/js/procedural-levels.js');
    await sandbox.fetch(new Request('https://other.example/api/levels/daily'));
    expect(native.calls).toEqual(['/js/procedural-levels.js', 'https://other.example/api/levels/daily']);
  });

  test('localhost keeps the live API for development', async () => {
    for (const href of ['http://localhost:3000/', 'http://127.0.0.1:3000/']) {
      const { sandbox, native } = runShim(href);
      expect(sandbox.InfiniteMatchApi.mode).toBe('live');
      await sandbox.fetch('/api/levels/daily');
      expect(native.calls).toEqual(['/api/levels/daily']);
    }
  });

  test('?api=live forces the live path on any host', async () => {
    const { sandbox, native } = runShim('https://infinite-match.example/?api=live');
    expect(sandbox.InfiniteMatchApi.mode).toBe('live');
    await sandbox.fetch('/api/levels/daily');
    expect(native.calls).toEqual(['/api/levels/daily']);
  });

  test('the shim loads before every game script in the canonical page', () => {
    const page = readFileSync('index.html', 'utf8');
    const sources = [...page.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
    const shim = sources.indexOf('js/offline-api.js');
    expect(shim).toBeGreaterThan(-1);
    for (const later of ['js/phaser.min.js', 'js/procedural-levels.js', 'phaser3-game.js', 'script.js']) {
      expect(sources.indexOf(later)).toBeGreaterThan(shim);
    }
  });
});
