import { describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

const source = fs.readFileSync('public/js/play-flow.js', 'utf8');
function flow() {
  const sandbox: any = { Date };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.InfinitePlayFlow;
}
const NOW = Date.parse('2026-11-04T12:00:00Z');
function result(mode: string, stars: number, seconds = 60, at = NOW) {
  return { mode, stars, seconds, at };
}

describe('transparent local play flow', () => {
  test('normalizes preferences and bounds history without network or storage', () => {
    const api = flow();
    expect(api.normalizeSettings({ flowSession: 'huge', flowChallenge: 'wild', flowMode: 'battle' })).toEqual({
      flowEnabled: true, flowSession: 'medium', flowChallenge: 'steady', flowMode: 'auto',
    });
    expect(api.normalizeSettings({ flowEnabled: false }).flowEnabled).toBe(false);
    const history = Array.from({ length: 30 }, (_, i) => result('classic', i % 4, 30, NOW + i));
    const kept = api.normalizeHistory([...history, { mode: 'battle', stars: 9, seconds: -1, at: NOW }, null]);
    expect(kept).toHaveLength(api.MAX_HISTORY);
    expect(kept[0].at).toBe(NOW + 10);
    expect(source).not.toMatch(/fetch\(|XMLHttpRequest|localStorage|indexedDB|Math\.random|saveUserData|document\./);
  });

  test('recommendations are deterministic, explainable, and respect manual mode', () => {
    const api = flow();
    const settings = { flowEnabled: true, flowSession: 'short', flowChallenge: 'relaxed', flowMode: 'auto' };
    const a = api.recommend({ settings, history: [], nowMs: NOW });
    const b = api.recommend({ settings, history: [], nowMs: NOW });
    expect(a).toEqual(b);
    expect(a.mode).toBe('daily');
    expect(a.reason).toContain('short session');
    expect(api.recommend({ settings: { ...settings, flowMode: 'endless' }, nowMs: NOW }).mode).toBe('endless');
    expect(api.recommend({ settings: { flowEnabled: false }, nowMs: NOW })).toBeNull();
  });

  test('relaxed flow avoids clocks, loss streaks suggest a reset, and breaks are optional', () => {
    const api = flow();
    const relaxed = api.recommend({ settings: { flowSession: 'short', flowChallenge: 'relaxed' }, history: [result('daily', 1)], nowMs: NOW });
    expect(relaxed.mode).not.toBe('timed');
    const losses = [result('classic', 0), result('classic', 0), result('classic', 0)];
    const reset = api.recommend({ settings: { flowChallenge: 'steady' }, history: losses, nowMs: NOW });
    expect(['daily', 'classic']).toContain(reset.mode);
    expect(reset.reason).toContain('losses');
    const longRun = api.recommend({ settings: { flowSession: 'short' }, history: [result('classic', 1, 400)], nowMs: NOW });
    expect(longRun.breakSuggested).toBe(true);
    expect(api.cardLines(longRun).join(' ')).toContain('break');
  });

  test('endless results do not create win/loss streaks but still count toward session time', () => {
    const api = flow();
    const summary = api.summarize([result('classic', 0), result('endless', 0, 600), result('classic', 1)], NOW);
    expect(summary.lossStreak).toBe(0);
    expect(summary.winStreak).toBe(1);
    expect(summary.recentMinutes).toBe(12);
    expect(summary.scoredAttempts).toBe(2);
  });

  test('wiring loads before the game, caches the module, and exposes explicit controls', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    const game = fs.readFileSync('phaser3-game.js', 'utf8');
    const experience = fs.readFileSync('public/js/player-experience.js', 'utf8');
    const script = fs.readFileSync('script.js', 'utf8');
    const worker = fs.readFileSync('public/sw.js', 'utf8');
    expect(html.indexOf('src="js/play-flow.js"')).toBeLessThan(html.indexOf('src="phaser3-game.js"'));
    expect(worker).toContain('\'/js/play-flow.js\'');
    expect(game).toContain('flowRecommendation()');
    expect(game).toContain('recordFlowResult(stars)');
    expect(game).toContain('playFlowRecommendation()');
    expect(game).toContain('clearFlowHistory()');
    expect(experience).toContain('data-play-flow-card');
    expect(experience).toContain('flowEnabled');
    expect(experience).toContain('Clear local flow history');
    expect(script).toContain('playFlowSuggestion');
    expect(script).toContain('renderFlowSuggestion');
    expect(html).toContain('id="flow-suggestion"');
  });

  test('preferences UI saves explicit choices and can clear local history', () => {
    const { document, window } = parseHTML('<html><body><div id="host"></div></body></html>');
    const sandbox: any = { document, Date };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync('public/js/art-direction.js', 'utf8'), sandbox);
    vm.runInContext(source, sandbox);
    vm.runInContext(fs.readFileSync('public/js/player-experience.js', 'utf8'), sandbox);
    let saves = 0;
    let cleared = 0;
    const game: any = {
      mode: 'classic', isGameRunning: false, isPaused: false, settings: { sfx: false, flowEnabled: true, flowSession: 'medium', flowChallenge: 'steady', flowMode: 'auto' },
      score: 0, targetScore: 500, levelStarting: false, powerUpPending: false,
      getAuthToken: () => null, getSoundStatus: () => ({ enabled: false, supported: false, state: 'off', volume: 0.5 }),
      canInteractWithBoard: () => false, animationsReduced: () => false,
      saveUserData: () => { saves++; }, clearFlowHistory: () => { cleared++; },
      flowRecommendation: () => sandbox.InfinitePlayFlow.recommend({ settings: game.settings, history: [], nowMs: NOW }),
    };
    const ui = sandbox.InfinitePlayerExperience.mount(game, document.getElementById('host'));
    const dialog: any = ui.shell.querySelector('dialog');
    dialog.showModal = () => { dialog.open = true; }; dialog.close = () => { dialog.open = false; };
    game.openOverlay = (title: string) => ui.openOverlay(title);
    game.closeOverlay = () => ui.closeOverlay();
    ui.showPreferences(false);
    const session: any = dialog.querySelector('[data-flow-session]');
    session.querySelector('option[value="short"]').selected = true;
    session.dispatchEvent(new window.Event('change'));
    expect(game.settings.flowSession).toBe('short');
    const enabled: any = dialog.querySelector('[data-flow-enabled]');
    enabled.checked = false; enabled.dispatchEvent(new window.Event('change'));
    expect(game.settings.flowEnabled).toBe(false);
    const clear = Array.from(dialog.querySelectorAll('button')).find((button: any) => button.textContent === 'Clear local flow history') as any;
    clear.click();
    expect(cleared).toBe(1);
    expect(saves).toBeGreaterThanOrEqual(2);
  });
});
