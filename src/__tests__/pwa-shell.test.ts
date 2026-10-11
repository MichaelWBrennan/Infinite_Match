import { describe, expect, test } from '@jest/globals';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

// Installable web app + offline shell. These tests exercise the service worker
// logic against mock caches/fetch/events. They cannot prove installability in a
// real browser (no Chromium in the sandbox); see docs/COMPETITIVE_STRATEGY.md.

const ROOT = process.cwd();
const ORIGIN = 'https://game.example';
const read = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8');

function pngSize(file: string): { width: number; height: number } {
  const buf = readFileSync(path.join(ROOT, file));
  // PNG signature (8 bytes) then IHDR: width at offset 16, height at 20, big-endian.
  expect(buf.subarray(1, 4).toString('ascii')).toBe('PNG');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe('web app manifest', () => {
  const manifest = JSON.parse(read('public/manifest.webmanifest'));

  test('is installable standalone with root start_url and scope', () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  test('declares 192 and 512 PNG icons, plus a maskable icon', () => {
    const icons: Array<{ src: string; sizes: string; type: string; purpose?: string }> = manifest.icons;
    const any = icons.filter((i) => i.purpose === 'any' || !i.purpose);
    expect(any.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
    expect(icons.some((i) => i.purpose === 'maskable')).toBe(true);
    for (const icon of icons) {
      expect(icon.type).toBe('image/png');
      const file = path.join('public', icon.src.replace(/^\//, ''));
      expect(existsSync(path.join(ROOT, file))).toBe(true);
      const [w, h] = icon.sizes.split('x').map(Number);
      expect(pngSize(file)).toEqual({ width: w, height: h });
    }
  });
});

describe('index.html wiring', () => {
  const html = read('index.html');

  test('links the manifest, icons and theme colour', () => {
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest">');
    expect(html).toContain('<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">');
    expect(html).toContain('<meta name="theme-color" content="#2b2d4a">');
  });

  test('loads the service worker registration script, which exists', () => {
    expect(html).toContain('<script src="js/pwa-register.js"></script>');
    expect(existsSync(path.join(ROOT, 'public/js/pwa-register.js'))).toBe(true);
  });
});

describe('deployment wiring', () => {
  const vercel = JSON.parse(read('vercel.json'));

  test('vercel rewrites serve manifest, icons and the worker from public/', () => {
    const rewrites: Array<{ source: string; destination: string }> = vercel.rewrites;
    expect(rewrites).toEqual(expect.arrayContaining([
      { source: '/sw.js', destination: '/public/sw.js' },
      { source: '/manifest.webmanifest', destination: '/public/manifest.webmanifest' },
      { source: '/icons/(.*)', destination: '/public/icons/$1' },
    ]));
    // Specific rewrites must come before the catch-all that serves index.html.
    const swIndex = rewrites.findIndex((r) => r.source === '/sw.js');
    const catchAll = rewrites.findIndex((r) => r.source === '/(.*)');
    expect(swIndex).toBeGreaterThanOrEqual(0);
    expect(swIndex).toBeLessThan(catchAll);
  });

  test('the worker is not cached by the CDN so updates reach players', () => {
    const header = vercel.headers.find((h: { source: string }) => h.source === '/sw.js');
    expect(header.headers).toEqual([{ key: 'Cache-Control', value: 'no-cache' }]);
  });

  test('.vercelignore re-includes the worker and registration script (it ignores **/*.js)', () => {
    const ignore = read('.vercelignore').split('\n');
    expect(ignore).toContain('**/*.js');
    expect(ignore).toContain('!public/sw.js');
    expect(ignore).toContain('!public/js/pwa-register.js');
    expect(ignore.indexOf('!public/sw.js')).toBeGreaterThan(ignore.indexOf('**/*.js'));
  });

  test('.vercelignore keeps every runtime script index.html loads (the **/*.js rule would drop them)', () => {
    const ignore = read('.vercelignore').split('\n');
    expect(ignore).toEqual(expect.arrayContaining(['!script.js', '!phaser3-game.js', '!public/js/*.js']));
    expect(ignore.indexOf('!public/js/*.js')).toBeGreaterThan(ignore.indexOf('**/*.js'));
  });
});

// ---------------------------------------------------------------------------
// Service worker behaviour
// ---------------------------------------------------------------------------

type Handler = (...args: any[]) => void;

function loadWorker(opts: {
  origin?: string;
  network?: (...args: any[]) => Promise<Response> | Response;
  existing?: Record<string, Map<string, Response>>;
} = {}) {
  const origin = opts.origin ?? ORIGIN;
  const listeners: Record<string, Handler> = {};
  const caches = new Map<string, Map<string, Response>>(Object.entries(opts.existing ?? {}));
  const networkCalls: string[] = [];

  const normalise = (input: string | { url: string }) =>
    new URL(typeof input === 'string' ? input : input.url, origin).href;

  const cacheApi = {
    open: async (name: string) => {
      if (!caches.has(name)) caches.set(name, new Map());
      const store = caches.get(name)!;
      const key = (req: any) => new URL(normalise(req), origin).pathname;
      return {
        put: async (req: any, res: Response) => {
          store.set(key(req), res);
        },
        match: async (req: any) => store.get(key(req)),
      };
    },
    keys: async () => [...caches.keys()],
    delete: async (name: string) => caches.delete(name),
  };

  class FakeRequest {
    url: string;
    method: string;
    mode: string;
    constructor(input: string | { url: string }, init: any = {}) {
      this.url = normalise(input);
      this.method = (init.method ?? 'GET').toUpperCase();
      this.mode = init.mode ?? 'cors';
    }
  }

  const sandbox: any = {
    console,
    URL,
    Request: FakeRequest,
    Response,
    Promise,
    caches: cacheApi,
    self: null,
    fetch: async (input: any) => {
      const req = typeof input === 'string' || !(input instanceof FakeRequest) ? new FakeRequest(input) : input;
      networkCalls.push(req.url);
      if (opts.network) return opts.network(req.url, req);
      return new Response('network', { status: 200 });
    },
  };
  sandbox.self = {
    location: new URL(`${origin}/sw.js`),
    addEventListener: (type: string, fn: Handler) => {
      listeners[type] = fn;
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(read('public/sw.js'), sandbox);

  async function install() {
    const waits: Promise<unknown>[] = [];
    listeners.install({ waitUntil: (p: Promise<unknown>) => waits.push(p) });
    await Promise.all(waits);
  }
  async function activate() {
    const waits: Promise<unknown>[] = [];
    listeners.activate({ waitUntil: (p: Promise<unknown>) => waits.push(p) });
    await Promise.all(waits);
  }
  // Returns { intercepted, response, background } for a fetch event.
  async function fetchEvent(req: { url: string; method?: string; mode?: string }) {
    let responded: Promise<Response> | undefined;
    const background: Promise<unknown>[] = [];
    const request = new FakeRequest(req.url, { method: req.method, mode: req.mode });
    listeners.fetch({
      request,
      respondWith: (p: Promise<Response>) => {
        responded = p;
      },
      waitUntil: (p: Promise<unknown>) => background.push(p),
    });
    const response = responded ? await responded : undefined;
    await Promise.all(background);
    return { intercepted: responded !== undefined, response, background };
  }

  return { caches, networkCalls, install, activate, fetchEvent, listeners };
}

const SHELL_CACHE = 'infinite-match-shell-v1';

describe('service worker: precache', () => {
  test('installs every shell file that the deploy provides', async () => {
    const w = loadWorker();
    await w.install();
    const cached = w.caches.get(SHELL_CACHE)!;
    expect(cached).toBeDefined();
    expect(cached.has('/index.html')).toBe(true);
    expect(cached.has('/js/phaser.min.js')).toBe(true);
    expect(cached.has('/manifest.webmanifest')).toBe(true);
    expect(cached.has('/icons/icon-192.png')).toBe(true);
  });

  test('a file missing from one deploy does not stop the rest of the shell installing', async () => {
    const w = loadWorker({
      network: (url) => {
        if (url.endsWith('/script.js')) return new Response('nope', { status: 404 });
        if (url.endsWith('/phaser3-game.js')) throw new TypeError('network down');
        return new Response('ok', { status: 200 });
      },
    });
    await expect(w.install()).resolves.toBeUndefined();
    const cached = w.caches.get(SHELL_CACHE)!;
    expect(cached.has('/script.js')).toBe(false);
    expect(cached.has('/phaser3-game.js')).toBe(false);
    expect(cached.has('/js/phaser.min.js')).toBe(true);
  });

  test('precaches only same-origin files from the explicit list (never API or CDN URLs)', async () => {
    const w = loadWorker();
    await w.install();
    for (const key of w.caches.get(SHELL_CACHE)!.keys()) {
      expect(key.startsWith('/api')).toBe(false);
    }
    expect(w.networkCalls.every((u) => u.startsWith(ORIGIN))).toBe(true);
  });
});

describe('service worker: activate', () => {
  test('removes old shell caches and keeps unrelated caches', async () => {
    const w = loadWorker({
      existing: {
        'infinite-match-shell-v0': new Map(),
        [SHELL_CACHE]: new Map(),
        'some-other-app-cache': new Map(),
      },
    });
    await w.activate();
    expect([...w.caches.keys()].sort()).toEqual([SHELL_CACHE, 'some-other-app-cache']);
  });
});

describe('service worker: what it must never intercept', () => {
  test.each([
    ['API GET', `${ORIGIN}/api/economy/balance`, 'GET', 'cors'],
    ['API POST', `${ORIGIN}/api/monetization/receipt/verify`, 'POST', 'cors'],
    ['cross-origin script', 'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js', 'GET', 'no-cors'],
    ['cross-origin analytics', 'https://eu.posthog.example/e', 'GET', 'cors'],
    ['POST to a shell path', `${ORIGIN}/script.js`, 'POST', 'cors'],
    ['same-origin non-shell data', `${ORIGIN}/player/save.json`, 'GET', 'cors'],
  ])('%s is left to the network untouched', async (_label, url, method, mode) => {
    const w = loadWorker();
    await w.install();
    const before = new Map(w.caches.get(SHELL_CACHE)!);
    const result = await w.fetchEvent({ url, method, mode });
    expect(result.intercepted).toBe(false);
    // Nothing new was stored for it.
    expect(w.caches.get(SHELL_CACHE)!.size).toBe(before.size);
    expect(w.caches.get(SHELL_CACHE)!.has(new URL(url).pathname)).toBe(
      before.has(new URL(url).pathname),
    );
  });
});

describe('service worker: navigations (network-first, offline shell)', () => {
  test('online navigation returns the network page and refreshes the cached shell', async () => {
    const w = loadWorker({
      network: () => new Response('<html>v2</html>', { status: 200 }),
    });
    const result = await w.fetchEvent({ url: `${ORIGIN}/`, mode: 'navigate' });
    expect(result.intercepted).toBe(true);
    expect(await result.response!.text()).toBe('<html>v2</html>');
    const cached = await w.caches.get(SHELL_CACHE)!.get('/index.html')!.text();
    expect(cached).toBe('<html>v2</html>');
  });

  test('offline deep-link navigation falls back to the cached shell', async () => {
    const w = loadWorker({
      network: (url) => {
        if (url === `${ORIGIN}/`) return new Response('<html>shell</html>', { status: 200 });
        throw new TypeError('offline');
      },
    });
    await w.fetchEvent({ url: `${ORIGIN}/`, mode: 'navigate' });
    const result = await w.fetchEvent({ url: `${ORIGIN}/some/deep/link?x=1`, mode: 'navigate' });
    expect(result.response!.status).toBe(200);
    expect(await result.response!.text()).toBe('<html>shell</html>');
  });

  test('offline with nothing cached returns a clear 503, not a blank page', async () => {
    const w = loadWorker({ network: () => { throw new TypeError('offline'); } });
    const result = await w.fetchEvent({ url: `${ORIGIN}/`, mode: 'navigate' });
    expect(result.response!.status).toBe(503);
    expect(await result.response!.text()).toMatch(/offline/i);
  });

  test('a non-OK navigation response is returned but never cached as the shell', async () => {
    const w = loadWorker({ network: () => new Response('boom', { status: 500 }) });
    const result = await w.fetchEvent({ url: `${ORIGIN}/`, mode: 'navigate' });
    expect(result.response!.status).toBe(500);
    expect(w.caches.get(SHELL_CACHE)?.has('/index.html') ?? false).toBe(false);
  });
});

describe('service worker: shell assets (stale-while-revalidate)', () => {
  test('serves the cached copy at once and refreshes it in the background', async () => {
    let version = 1;
    const w = loadWorker({
      network: () => new Response(`v${version}`, { status: 200 }),
    });
    await w.install();
    version = 2;
    const result = await w.fetchEvent({ url: `${ORIGIN}/js/phaser.min.js` });
    expect(await result.response!.text()).toBe('v1');
    expect(result.background.length).toBe(1);
    expect(await w.caches.get(SHELL_CACHE)!.get('/js/phaser.min.js')!.text()).toBe('v2');
  });

  test('with nothing cached yet, goes to the network', async () => {
    const w = loadWorker({ network: () => new Response('live', { status: 200 }) });
    const result = await w.fetchEvent({ url: `${ORIGIN}/script.js` });
    expect(result.intercepted).toBe(true);
    expect(await result.response!.text()).toBe('live');
  });

  test('ignores query strings when matching shell files', async () => {
    const w = loadWorker({ network: () => new Response('ok', { status: 200 }) });
    await w.install();
    const result = await w.fetchEvent({ url: `${ORIGIN}/styles.css?v=123` });
    expect(result.intercepted).toBe(true);
  });
});

describe('service worker: shell list points at real files', () => {
  test('every precached path exists in the repository (root or public/)', () => {
    const src = read('public/sw.js');
    const block = src.slice(src.indexOf('const SHELL = ['), src.indexOf('];', src.indexOf('const SHELL = [')));
    const paths = [...block.matchAll(/'(\/[^']*)'/g)].map((m) => m[1]);
    expect(paths.length).toBeGreaterThan(10);
    for (const p of paths) {
      if (p === '/') continue; // served from index.html
      const rel = p.replace(/^\//, '');
      const found = existsSync(path.join(ROOT, rel)) || existsSync(path.join(ROOT, 'public', rel));
      expect({ path: p, found }).toEqual({ path: p, found: true });
    }
  });
});
