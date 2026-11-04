import { describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

const source = fs.readFileSync('public/js/weekly-hub.js', 'utf8');
function hub() {
  const sandbox: any = { Date };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.InfiniteWeeklyHub;
}
const NOW = Date.parse('2026-11-04T12:00:00Z'); // Wednesday.
const MONDAY = Date.parse('2026-11-02T00:00:00Z');

describe('optional local weekly rhythm', () => {
  test('counts distinct finished-run UTC days, not app opens or consecutive logins', () => {
    const api = hub();
    let days: string[] = [];
    days = api.recordDay(days, MONDAY);
    days = api.recordDay(days, MONDAY + 3600000);
    days = api.recordDay(days, MONDAY + 2 * 86400000);
    expect(days).toEqual(['2026-11-02', '2026-11-04']);
    const view = api.rhythmView(days, NOW);
    expect(view.daysThisWeek).toBe(2);
    expect(view.remaining).toBe(1);
    expect(view.met).toBe(false);
    expect(api.rhythmView(api.recordDay(days, NOW + 86400000), NOW).met).toBe(true);
  });

  test('history is bounded and a missed week only resets the local counter', () => {
    const api = hub();
    const old = Array.from({ length: 100 }, (_, i) => api.dayKey(MONDAY - (i + 1) * 86400000));
    const days = api.normalizeDays([...old, 'bad-date', '2026-02-30', '2026-11-04']);
    expect(days.length).toBeLessThanOrEqual(api.MAX_DAYS);
    expect(days).toContain('2026-11-04');
    expect(days).not.toContain('2026-02-30');
    const previous = ['2026-10-26', '2026-10-28', '2026-10-30'];
    // Last week is marked; the current week is still in progress, so the counter is kept.
    expect(api.rhythmView(previous, NOW).streakWeeks).toBe(1);
    expect(api.rhythmView([...previous, '2026-11-02', '2026-11-03', '2026-11-04'], NOW).streakWeeks).toBe(2);
    // A fully missed week between marked weeks breaks only this local counter.
    expect(api.rhythmView(['2026-10-19', '2026-10-21', '2026-10-23', '2026-11-02', '2026-11-03', '2026-11-04'], NOW).streakWeeks).toBe(1);
    expect(api.rhythmLines(api.rhythmView([], NOW), false).join(' ')).toContain('off');
    expect(api.rhythmLines(api.rhythmView([], NOW), true).join(' ')).toContain('never removes');
  });

  test('module has no network, storage, random, or economy mutation', () => {
    expect(source).not.toMatch(/fetch\(|XMLHttpRequest|localStorage|indexedDB|Math\.random|coins\s*\+|stars\s*\+/);
  });
});

describe('This week hub', () => {
  test('summarizes the server weekly event without inventing progress for guests', () => {
    const api = hub();
    const data = { event: { id: 'hall', name: 'Hall Lanterns', description: 'Free weekly wins.', status: 'active',
      startsAt: '2026-11-02T00:00:00Z', endsAt: '2026-11-09T00:00:00Z', wins: 1,
      milestones: [{ wins: 1, coins: 15, claimed: false, canClaim: true }, { wins: 3, coins: 25, claimed: false, canClaim: false }] } };
    const guest = api.weeklySummary(data, false, NOW);
    expect(guest.lines.join(' ')).toContain('Guest puzzles remain playable');
    expect(guest.lines.join(' ')).not.toContain('1 verified win');
    const signed = api.weeklySummary(data, true, NOW);
    expect(signed.lines.join(' ')).toContain('1 verified win');
    expect(signed.lines.join(' ')).toContain('2 more');
    expect(api.weeklySummary({ disabled: true }, true, NOW).state).toBe('paused');
  });

  test('renders accessible progress and explicit opt-in/claim/install controls with textContent', () => {
    const { document, window } = parseHTML('<html><body><div id="host"></div></body></html>');
    const api = hub();
    const calls: string[] = [];
    const host = document.getElementById('host')!;
    api.render(host, {
      weekly: api.weeklySummary({ event: { id: 'hall', name: '<img src=x>', description: 'Finish puzzles', status: 'active',
        startsAt: '2026-11-02T00:00:00Z', endsAt: '2026-11-09T00:00:00Z', wins: 1,
        milestones: [{ wins: 1, coins: 15, claimed: false, canClaim: true }] } }, true, NOW),
      signedIn: true,
      rhythm: api.rhythmView(['2026-11-02'], NOW),
      rhythmEnabled: false,
      pwa: { offlineReady: true, installAvailable: true, updateReady: true, online: true },
    }, {
      claim: (id: string, wins: number) => calls.push(`claim:${id}:${wins}`),
      setRhythmEnabled: (enabled: boolean) => calls.push(`rhythm:${enabled}`),
      install: () => calls.push('install'),
      applyUpdate: () => calls.push('update'),
    });
    expect(host.querySelector('img')).toBeNull();
    expect(host.textContent).toContain('&lt;img src=x&gt;'.replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
    expect(host.querySelectorAll('progress').length).toBe(1);
    const buttons = [...host.querySelectorAll('button')] as any[];
    buttons.find((b) => b.textContent === 'Claim free coins').dispatchEvent(new window.Event('click'));
    buttons.find((b) => b.textContent === 'Enable local rhythm').dispatchEvent(new window.Event('click'));
    buttons.find((b) => b.textContent === 'Install Infinite Match').dispatchEvent(new window.Event('click'));
    buttons.find((b) => b.textContent === 'Restart to apply update').dispatchEvent(new window.Event('click'));
    expect(calls).toEqual(['claim:hall:1', 'rhythm:true', 'install', 'update']);
  });

  test('wiring adds the hub, records only after opt-in, and keeps paid streak repairs out', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    const game = fs.readFileSync('phaser3-game.js', 'utf8');
    const experience = fs.readFileSync('public/js/player-experience.js', 'utf8');
    const worker = fs.readFileSync('public/sw.js', 'utf8');
    expect(html.indexOf('src="js/weekly-hub.js"')).toBeLessThan(html.indexOf('src="phaser3-game.js"'));
    expect(worker).toContain('\'/js/weekly-hub.js\'');
    expect(game).toContain('weeklyRhythmEnabled: false');
    expect(game).toContain('recordWeeklyRhythmDay()');
    expect(game).toContain('this.settings.weeklyRhythmEnabled !== true');
    expect(game).toContain('showThisWeek()');
    expect(experience).toContain('showThisWeek: thisWeek');
    expect(experience).toContain('/api/live-ops/weekly/claim');
    expect(experience).not.toContain('streak-protection');
    expect(game).not.toContain('streak-protection');
  });

  test('player UI opens This week, saves opt-in locally, and clears history', async () => {
    const { document, window } = parseHTML('<html><body><div id="host"></div></body></html>');
    const sandbox: any = { document, Date };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync('public/js/art-direction.js', 'utf8'), sandbox);
    vm.runInContext(source, sandbox);
    vm.runInContext(fs.readFileSync('public/js/player-experience.js', 'utf8'), sandbox);
    let saves = 0;
    const game: any = {
      mode: 'classic', isGameRunning: false, isPaused: false, titleShowing: false,
      settings: { sfx: false, weeklyRhythmEnabled: false }, weeklyRhythmDays: ['2026-11-02'],
      score: 0, targetScore: 500, levelStarting: false, powerUpPending: false,
      getAuthToken: () => null, getSoundStatus: () => ({ enabled: false, supported: false, state: 'off', volume: 0.5 }),
      canInteractWithBoard: () => false, animationsReduced: () => false,
      saveUserData: () => { saves++; }, clearWeeklyRhythm: () => { game.weeklyRhythmDays = []; },
      fetchJson: async () => ({ ok: true, data: { success: true, event: null } }),
      showWeeklyEvent: () => {}, openSignIn: () => {},
    };
    const ui = sandbox.InfinitePlayerExperience.mount(game, document.getElementById('host'));
    const dialog: any = ui.shell.querySelector('dialog');
    dialog.showModal = () => { dialog.open = true; }; dialog.close = () => { dialog.open = false; };
    game.openOverlay = (title: string) => { game.activeOverlay = ui.openOverlay(title); return game.activeOverlay; };
    game.closeOverlay = () => { ui.closeOverlay(); game.activeOverlay = null; };
    ui.showThisWeek(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const enable = [...dialog.querySelectorAll('button')].find((b: any) => b.textContent === 'Enable local rhythm') as any;
    enable.dispatchEvent(new window.Event('click'));
    expect(game.settings.weeklyRhythmEnabled).toBe(true);
    expect(saves).toBe(1);
    const clear = [...dialog.querySelectorAll('button')].find((b: any) => b.textContent === 'Clear local rhythm history') as any;
    clear.dispatchEvent(new window.Event('click'));
    expect(game.weeklyRhythmDays).toEqual([]);
  });
});
