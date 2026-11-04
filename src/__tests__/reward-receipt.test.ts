import { describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

const source = fs.readFileSync('public/js/reward-receipt.js', 'utf8');
function load() {
  const sandbox: any = {};
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.InfiniteRewardReceipt;
}

describe('reward receipt and saved-win sync', () => {
  test('distinguishes verified ranked, booster-assisted, unverified, duplicate, guest, and pending states', () => {
    const api = load();
    const ranked = api.view({ signedIn: true, result: { verified: true, ranked: true, rewards: [{ type: 'currency', currencyId: 'coins', amount: 25 }], balances: { stars: 4 } } });
    expect(ranked.state).toBe('settled');
    expect(ranked.lines.join(' ')).toContain('can enter ranked boards');
    expect(ranked.lines.join(' ')).toContain('+25 coins');
    const assisted = api.view({ signedIn: true, result: { verified: true, ranked: false } });
    expect(assisted.lines.join(' ')).toContain('booster-assisted');
    const unverified = api.view({ signedIn: true, result: { verified: false, ranked: false } });
    expect(unverified.lines.join(' ')).toContain('not verified');
    const duplicate = api.view({ signedIn: true, result: { duplicate: true, verified: true, ranked: true } });
    expect(duplicate.state).toBe('duplicate');
    expect(duplicate.lines.join(' ')).toContain('no second reward');
    expect(api.view({ signedIn: false }).state).toBe('guest');
    const pending = api.view({ signedIn: true, result: null, pendingCount: 2 });
    expect(pending.state).toBe('pending');
    expect(pending.lines.join(' ')).toContain('2 wins waiting');
    expect(api.view({ signedIn: true, result: null, pendingCount: 0 }).state).toBe('unconfirmed');
    const endless = api.view({ signedIn: true, mode: 'endless', result: { verified: true } });
    expect(endless.lines.join(' ')).toContain('Endless results do not enter ranked boards');
  });

  test('sync summary reports confirmed/refused/waiting without granting anything', () => {
    const api = load();
    expect(api.syncLines([])).toContain('No saved wins');
    expect(api.syncLines([{ outcome: 'settled' }, { outcome: 'refused' }, { outcome: 'kept' }])).toBe('Sync: 1 confirmed, 1 refused by the server, 1 still waiting.');
  });

  test('module is presentation-only: no network, storage, random, or balance mutation', () => {
    expect(source).not.toMatch(/fetch\(|XMLHttpRequest|localStorage|indexedDB|Math\.random|balances\s*\.\w+\s*=|coins\s*\+|stars\s*\+/);
  });

  test('renders receipt and explicit sync/guide actions with textContent', () => {
    const { document, window } = parseHTML('<html><body><div id="host"></div></body></html>');
    const api = load();
    const calls: string[] = [];
    const host = document.getElementById('host')!;
    const view = api.view({ signedIn: true, result: null, pendingCount: 1 });
    api.render(host, view, { sync: () => calls.push('sync'), guide: () => calls.push('guide') });
    expect(host.querySelector('[data-reward-receipt]')).not.toBeNull();
    expect(host.textContent).toContain('Reward saved on this device');
    const buttons = [...host.querySelectorAll('button')] as any[];
    buttons.find((b) => b.dataset.rewardSync === 'true').dispatchEvent(new window.Event('click'));
    buttons.find((b) => b.dataset.rewardGuide === 'true').dispatchEvent(new window.Event('click'));
    expect(calls).toEqual(['sync', 'guide']);
  });

  test('wiring loads before the game, caches the module, and exposes saved wins from Explore', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    const game = fs.readFileSync('phaser3-game.js', 'utf8');
    const experience = fs.readFileSync('public/js/player-experience.js', 'utf8');
    const worker = fs.readFileSync('public/sw.js', 'utf8');
    expect(html.indexOf('src="js/reward-receipt.js"')).toBeLessThan(html.indexOf('src="phaser3-game.js"'));
    expect(worker).toContain('\'/js/reward-receipt.js\'');
    expect(game).toContain('showRewardReceipt()');
    expect(game).toContain('syncSavedWins()');
    expect(game).toContain('showSavedWins()');
    expect(game).toContain('flushPendingWins()');
    expect(experience).toContain('renderRewardReceipt');
    expect(experience).toContain('Saved wins and reward receipts');
  });

  test('player UI mounts the receipt and keeps sync explicit', () => {
    const { document, window } = parseHTML('<html><body><div id="host"></div></body></html>');
    const sandbox: any = { document };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync('public/js/art-direction.js', 'utf8'), sandbox);
    vm.runInContext(source, sandbox);
    vm.runInContext(fs.readFileSync('public/js/player-experience.js', 'utf8'), sandbox);
    let synced = 0;
    const game: any = {
      mode: 'classic', isGameRunning: false, isPaused: false, titleShowing: false,
      settings: { sfx: false }, score: 0, targetScore: 500, levelStarting: false, powerUpPending: false,
      getAuthToken: () => 'token', getSoundStatus: () => ({ enabled: false, supported: false, state: 'off', volume: 0.5 }),
      canInteractWithBoard: () => false, animationsReduced: () => false, saveUserData: () => {},
    };
    const ui = sandbox.InfinitePlayerExperience.mount(game, document.getElementById('host'));
    const dialog: any = ui.shell.querySelector('dialog');
    dialog.showModal = () => { dialog.open = true; }; dialog.close = () => { dialog.open = false; };
    game.openOverlay = (title: string) => { game.activeOverlay = ui.openOverlay(title); return game.activeOverlay; };
    game.closeOverlay = () => { ui.closeOverlay(); game.activeOverlay = null; };
    game.openOverlay('Saved wins');
    const view = sandbox.InfiniteRewardReceipt.view({ signedIn: true, result: null, pendingCount: 1 });
    ui.renderRewardReceipt(view, { sync: () => { synced++; } });
    const button = dialog.querySelector('[data-reward-sync]') as any;
    expect(button).not.toBeNull();
    expect(synced).toBe(0);
    button.dispatchEvent(new window.Event('click'));
    expect(synced).toBe(1);
  });
});
