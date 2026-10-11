import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { clientRulesVersion, blockerLevelsEnabled, generatedLevel } from '../services/levels/level-service.js';
import { blockerCount } from '../services/levels/blocker-rules.js';

// Plan M5: rules v6 is off by default. It is served only when the server flag BLOCKER_LEVELS is 'on',
// only for classic levels, and only to a client that asks for it (?blockers=1 playtest opt-in).

const loc = { timeZone: 'America/New_York', country: 'US', region: 'PA' };
const NOW = Date.parse('2026-10-31T12:00:00Z');

describe('rules v6 is server-gated', () => {
  test('the flag is on only when BLOCKER_LEVELS is exactly on', () => {
    expect(blockerLevelsEnabled({ BLOCKER_LEVELS: 'on' } as any)).toBe(true);
    expect(blockerLevelsEnabled({ BLOCKER_LEVELS: 'off' } as any)).toBe(false);
    expect(blockerLevelsEnabled({ BLOCKER_LEVELS: 'ON' } as any)).toBe(false);
    expect(blockerLevelsEnabled({} as any)).toBe(false);
  });

  test('6 is refused by default and for every non-classic mode, even when enabled', () => {
    expect(() => clientRulesVersion('6')).toThrow();
    expect(() => clientRulesVersion(6, 'classic', false)).toThrow();
    expect(() => clientRulesVersion(6, 'daily', true)).toThrow();
    expect(() => clientRulesVersion(6, 'endless', true)).toThrow();
    expect(() => clientRulesVersion(6, 'timed', true)).toThrow();
    expect(() => clientRulesVersion(6, undefined, true)).toThrow();
  });

  test('classic 6 is accepted only when enabled', () => {
    expect(clientRulesVersion(6, 'classic', true)).toBe(6);
    expect(clientRulesVersion('6', 'classic', true)).toBe(6);
  });

  test('v2-v5 requests are unchanged by the gate', () => {
    expect(clientRulesVersion(undefined)).toBe(2);
    expect(clientRulesVersion('5')).toBe(5);
    expect(clientRulesVersion(5, 'daily')).toBe(5);
    expect(clientRulesVersion(4, 'endless')).toBe(4);
  });
});

describe('blockers are classic-only', () => {
  test('daily, timed and endless v6 levels never carry blockers or a blocker objective', () => {
    for (const mode of ['timed', 'endless']) {
      for (let level = 1; level <= 24; level++) {
        const d = generatedLevel({ level, mode, location: loc, rulesVersion: 6 } as any, NOW);
        expect(blockerCount(d.blockers)).toBe(0);
        expect(d.objectives.some((goal: any) => goal.type === 'clear-blockers')).toBe(false);
      }
    }
    const daily = generatedLevel({ level: 1, mode: 'daily', location: loc, rulesVersion: 6 } as any, NOW);
    expect(blockerCount(daily.blockers)).toBe(0);
  });

  test('a classic v6 level at a blocker stage still carries blockers', () => {
    const d = generatedLevel({ level: 6, mode: 'classic', location: loc, rulesVersion: 6 } as any, NOW);
    expect(blockerCount(d.blockers)).toBeGreaterThan(0);
  });
});

describe('client opt-in for rules v6', () => {
  function loadClient() {
    const files = ['public/js/procedural-levels.js', 'public/js/level-location.js', 'public/js/sound-effects.js',
      'public/js/player-experience.js', 'public/js/assistive-board.js', 'public/js/match-feedback.js', 'phaser3-game.js'];
    const sandbox: any = {
      console: { log() {}, info() {}, error() {}, warn() {} },
      navigator: {}, Intl, Date, URLSearchParams, AbortSignal,
      setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
      localStorage: { getItem: () => null, setItem() {} },
      document: { readyState: 'loading', addEventListener() {}, getElementById: () => null },
      addEventListener() {}, location: { search: '' },
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    for (const file of files) vm.runInContext(readFileSync(file, 'utf8'), sandbox, { filename: file });
    return { sandbox, game: Object.create(sandbox.PhaserMatch3Game.prototype) };
  }

  test('a classic request asks for v6 only with ?blockers=1', () => {
    const { sandbox, game } = loadClient();
    expect(game.requestedRulesVersion('classic')).toBe(5);
    sandbox.location = { search: '?blockers=1' };
    expect(game.requestedRulesVersion('classic')).toBe(6);
    expect(game.requestedRulesVersion(undefined)).toBe(5);
  });

  test('daily, timed and endless never ask for v6, even with the playtest flag', () => {
    const { sandbox, game } = loadClient();
    sandbox.location = { search: '?blockers=1' };
    for (const mode of ['daily', 'timed', 'endless']) expect(game.requestedRulesVersion(mode)).toBe(5);
  });

  test('the server wiring passes the mode and the flag at every call site', () => {
    const sites = ['server/economy.js', 'server/levels.js', 'src/routes/account-economy.js', 'src/routes/levels.js'];
    for (const file of sites) {
      const code = readFileSync(file, 'utf8');
      expect(code).toContain('blockerLevelsEnabled');
      expect(code).not.toMatch(/clientRulesVersion\((?:[^,()]|\([^)]*\))*\)/);
    }
  });
});
