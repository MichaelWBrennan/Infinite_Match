import { describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

const source = fs.readFileSync('public/js/loss-review.js', 'utf8');
function load() {
  const sandbox: any = {};
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.InfiniteLossReview;
}

describe('fair loss review', () => {
  test('reports exact remaining goals and a free goal-aware tip without urgency or paid continues', () => {
    const api = load();
    const view = api.review({
      mode: 'classic', signedIn: true, score: 900, targetScore: 1500,
      goals: [
        { type: 'score', target: 1500, current: 900 },
        { type: 'collect', gemType: 'blue', target: 20, current: 15 },
      ],
      moves: 0, movesLimit: 24, hintsUsed: 2,
    });
    expect(view.unfinished).toHaveLength(2);
    expect(view.goals[0].remaining).toBe(600);
    expect(view.goals[1].remaining).toBe(5);
    expect(view.lines.join(' ')).toContain('Moves used: 24 of 24');
    expect(view.lines.join(' ')).toContain('Free hints used: 2');
    expect(view.tip).toContain('blue');
    expect(view.retryLine).toContain('1 energy');
    expect(view.retryLine).toContain('No discounted continue');
    expect(JSON.stringify(view)).not.toMatch(/discountPercent|urgency|buy|sale|limited time/i);
  });

  test('guest retry is free, timed losses explain the clock, and completed goals are not nagged', () => {
    const api = load();
    const guest = api.review({ mode: 'classic', signedIn: false, goals: [{ type: 'score', target: 100, current: 99 }], moves: 1, movesLimit: 10 });
    expect(guest.retryLine).toContain('Guest retry is free');
    const timed = api.review({ mode: 'timed', signedIn: false, goals: [{ type: 'timed', target: 1000, current: 800 }], time: 0, timeLimit: 60 });
    expect(timed.lines.join(' ')).toContain('Time used: 60s of 60s');
    expect(timed.tip).toContain('Timed goal');
    const done = api.review({ goals: [{ type: 'score', target: 100, current: 120 }] });
    expect(done.unfinished).toHaveLength(0);
    expect(done.goals[0].current).toBe(100);
    expect(done.tip).toContain('Every goal was complete');
  });

  test('module is presentation-only: no network, storage, random, or economy mutation', () => {
    expect(source).not.toMatch(/fetch\(|XMLHttpRequest|localStorage|indexedDB|Math\.random|coins\s*\+|stars\s*\+|energy\s*-/);
  });

  test('renders accessible remaining goals and explicit retry/guide actions with textContent', () => {
    const { document, window } = parseHTML('<html><body><div id="host"></div></body></html>');
    const api = load();
    const calls: string[] = [];
    const host = document.getElementById('host')!;
    const view = api.review({ goals: [{ type: 'clear-shields', target: 6, current: 4 }], signedIn: false, moves: 0, movesLimit: 20 });
    api.render(host, view, { retry: () => calls.push('retry'), guide: () => calls.push('guide') });
    expect(host.querySelector('[data-loss-review]')).not.toBeNull();
    expect(host.textContent).toContain('Shields: 4/6 — 2 left');
    expect(host.textContent).toContain('Guest retry is free');
    const buttons = [...host.querySelectorAll('button')] as any[];
    buttons.find((b) => b.dataset.lossRetry === 'true').dispatchEvent(new window.Event('click'));
    buttons.find((b) => b.dataset.lossGuide === 'true').dispatchEvent(new window.Event('click'));
    expect(calls).toEqual(['retry', 'guide']);
  });

  test('wiring loads before the game, caches the module, and shows review only on non-endless losses', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    const game = fs.readFileSync('phaser3-game.js', 'utf8');
    const experience = fs.readFileSync('public/js/player-experience.js', 'utf8');
    const worker = fs.readFileSync('public/sw.js', 'utf8');
    expect(html.indexOf('src="js/loss-review.js"')).toBeLessThan(html.indexOf('src="phaser3-game.js"'));
    expect(worker).toContain('\'/js/loss-review.js\'');
    expect(game).toContain('showLossReview()');
    expect(game).toContain('if (stars === 0 && this.mode !== \'endless\') this.showLossReview();');
    expect(game).toContain('showLossGuide()');
    expect(experience).toContain('renderLossReview');
    expect(game).not.toContain('level-tuning');
    expect(experience).not.toContain('discounted continue');
  });

  test('player UI mounts the loss review and keeps retry explicit', () => {
    const { document, window } = parseHTML('<html><body><div id="host"></div></body></html>');
    const sandbox: any = { document };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync('public/js/art-direction.js', 'utf8'), sandbox);
    vm.runInContext(source, sandbox);
    vm.runInContext(fs.readFileSync('public/js/player-experience.js', 'utf8'), sandbox);
    let retried = 0;
    const game: any = {
      mode: 'classic', isGameRunning: false, isPaused: false, titleShowing: false,
      settings: { sfx: false }, score: 0, targetScore: 500, levelStarting: false, powerUpPending: false,
      getAuthToken: () => null, getSoundStatus: () => ({ enabled: false, supported: false, state: 'off', volume: 0.5 }),
      canInteractWithBoard: () => false, animationsReduced: () => false,
      saveUserData: () => {}, restartGame: () => { retried++; },
    };
    const ui = sandbox.InfinitePlayerExperience.mount(game, document.getElementById('host'));
    const dialog: any = ui.shell.querySelector('dialog');
    dialog.showModal = () => { dialog.open = true; }; dialog.close = () => { dialog.open = false; };
    game.openOverlay = (title: string) => { game.activeOverlay = ui.openOverlay(title); return game.activeOverlay; };
    game.closeOverlay = () => { ui.closeOverlay(); game.activeOverlay = null; };
    game.openOverlay('Level Failed');
    const view = sandbox.InfiniteLossReview.review({ goals: [{ type: 'score', target: 500, current: 100 }], signedIn: false, moves: 0, movesLimit: 20 });
    ui.renderLossReview(view, { retry: () => game.restartGame() });
    const button = dialog.querySelector('[data-loss-retry]') as any;
    expect(button).not.toBeNull();
    expect(retried).toBe(0);
    button.dispatchEvent(new window.Event('click'));
    expect(retried).toBe(1);
  });
});
