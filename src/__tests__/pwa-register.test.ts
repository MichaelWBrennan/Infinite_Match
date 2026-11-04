import { describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('public/js/pwa-register.js', 'utf8');

function load(options: { controller?: boolean; waiting?: boolean; installPrompt?: boolean } = {}) {
  const listeners = new Map<string, any[]>();
  const workerListeners = new Map<string, any[]>();
  const messages: any[] = [];
  let reloads = 0;
  const waiting: any = {
    state: 'installed',
    postMessage: (message: any) => messages.push(message),
    addEventListener: (type: string, fn: any) => workerListeners.set(type, [...(workerListeners.get(type) || []), fn]),
  };
  const registration: any = {
    waiting: options.waiting ? waiting : null,
    installing: null,
    active: {},
    addEventListener: (type: string, fn: any) => workerListeners.set(`reg:${type}`, [...(workerListeners.get(`reg:${type}`) || []), fn]),
    update: async () => undefined,
  };
  const sandbox: any = {
    console: { warn() {} },
    CustomEvent: class { type: string; detail: any; constructor(type: string, init: any) { this.type = type; this.detail = init?.detail; } },
    navigator: {
      onLine: true,
      serviceWorker: {
        controller: options.controller ? {} : null,
        register: async () => registration,
        addEventListener: (type: string, fn: any) => listeners.set(type, [...(listeners.get(type) || []), fn]),
      },
    },
    caches: { match: async (path: string) => path === '/index.html' || path.includes('phaser') || path.includes('procedural') || path.includes('offline-api') ? {} : null },
    location: { reload: () => { reloads++; } },
    matchMedia: () => ({ matches: false }),
    addEventListener: (type: string, fn: any) => listeners.set(type, [...(listeners.get(type) || []), fn]),
    dispatchEvent: () => true,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  const fire = (type: string, event: any = {}) => (listeners.get(type) || []).forEach((fn) => fn(event));
  return { api: sandbox.InfinitePWA, fire, messages, reloads: () => reloads, waiting, workerListeners };
}

describe('PWA registration is player-controlled', () => {
  test('reports offline readiness and does not reload on a background controller change', async () => {
    const { api, fire, reloads } = load({ controller: true });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(api.status().offlineReady).toBe(true);
    fire('controllerchange');
    expect(reloads()).toBe(0);
  });

  test('a waiting update reloads only after the explicit applyUpdate action', async () => {
    const { api, fire, messages, reloads } = load({ controller: true, waiting: true });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(api.status().updateReady).toBe(true);
    expect(reloads()).toBe(0);
    expect(api.applyUpdate()).toBe(true);
    expect(messages).toEqual([{ type: 'SKIP_WAITING' }]);
    fire('controllerchange');
    expect(reloads()).toBe(1);
  });

  test('install prompt is captured and only shown after a user action', async () => {
    const { api, fire } = load();
    let prevented = false;
    let prompted = 0;
    fire('beforeinstallprompt', { preventDefault: () => { prevented = true; }, prompt: async () => { prompted++; }, userChoice: Promise.resolve({ outcome: 'accepted' }) });
    expect(prevented).toBe(true);
    expect(api.status().installAvailable).toBe(true);
    expect(prompted).toBe(0);
    await expect(api.promptInstall()).resolves.toBe('accepted');
    expect(prompted).toBe(1);
    expect(api.status().installed).toBe(true);
  });
});
