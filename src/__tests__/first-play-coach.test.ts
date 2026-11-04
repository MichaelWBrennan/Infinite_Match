import { describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

const source = fs.readFileSync('public/js/first-play-coach.js', 'utf8');
function load() {
  const sandbox: any = {};
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.InfiniteFirstPlayCoach;
}

describe('first-play coach', () => {
  test('normalizes persistent status and explains the exact current goal', () => {
    const api = load();
    expect(api.normalizeStatus('completed')).toBe('completed');
    expect(api.normalizeStatus('skipped')).toBe('skipped');
    expect(api.normalizeStatus('bogus')).toBe('new');
    const view = api.view({
      step: 'goal',
      goals: [
        { type: 'score', target: 1200, current: 200 },
        { type: 'collect', gemType: 'blue', target: 25, current: 10 },
      ],
      earnedSpecials: true,
    });
    expect(view.lines.join(' ')).toContain('Score: 200/1200 — 1000 left');
    expect(view.lines.join(' ')).toContain('Collect blue: 10/25 — 15 left');
    expect(view.lines.join(' ')).toContain('Hints are free');
    expect(view.actions).toEqual({ hint: true, focus: false, finish: false, skip: true });
  });

  test('hint step names cells for touch, keyboard, and text board without moving for the player', () => {
    const api = load();
    const swap = api.view({ step: 'hint', hint: [0, 1, 0, 2] });
    expect(swap.lines.join(' ')).toContain('row 1, column 2');
    expect(swap.lines.join(' ')).toContain('row 1, column 3');
    expect(swap.lines.join(' ')).toContain('Keyboard');
    expect(swap.lines.join(' ')).toContain('Text board');
    expect(swap.lines.join(' ')).toContain('never moves for you');
    const special = api.hintInstruction([3, 4]);
    expect(special).toContain('row 4, column 5');
    expect(special).toContain('Enter');
    expect(special).toContain('Activate special');
    expect(api.view({ step: 'done' }).actions.finish).toBe(true);
  });

  test('module is presentation-only: no network, storage, random, or economy mutation', () => {
    expect(source).not.toMatch(/fetch\(|XMLHttpRequest|localStorage|indexedDB|Math\.random|coins\s*\+|stars\s*\+|energy\s*-|moves\s*--/);
  });

  test('renders accessible coach actions with textContent and explicit callbacks', () => {
    const { document, window } = parseHTML('<html><body><div id="host"></div></body></html>');
    const api = load();
    const calls: string[] = [];
    const host = document.getElementById('host')!;
    api.render(host, api.view({ step: 'goal', targetScore: 500 }), {
      hint: () => calls.push('hint'),
      skip: () => calls.push('skip'),
    });
    expect(host.querySelector('[data-first-play-coach]')).not.toBeNull();
    expect(host.textContent).toContain('Score: 0/500 — 500 left');
    const buttons = [...host.querySelectorAll('button')] as any[];
    buttons.find((b) => b.dataset.coachHint === 'true').dispatchEvent(new window.Event('click'));
    buttons.find((b) => b.dataset.coachSkip === 'true').dispatchEvent(new window.Event('click'));
    expect(calls).toEqual(['hint', 'skip']);
  });

  test('wiring loads before the game, caches the module, and exposes replay from Explore', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    const game = fs.readFileSync('phaser3-game.js', 'utf8');
    const experience = fs.readFileSync('public/js/player-experience.js', 'utf8');
    const worker = fs.readFileSync('public/sw.js', 'utf8');
    expect(html.indexOf('src="js/first-play-coach.js"')).toBeLessThan(html.indexOf('src="phaser3-game.js"'));
    expect(worker).toContain('\'/js/first-play-coach.js\'');
    expect(game).toContain('startFirstPlayCoach()');
    expect(game).toContain('noteFirstPlayMove()');
    expect(game).toContain('skipFirstPlayCoach()');
    expect(game).toContain('openFirstPlayCoach(');
    expect(experience).toContain('renderFirstPlayCoach');
    expect(experience).toContain('First-play coach');
    expect(game).toContain('this.coachStatus = \'skipped\'');
    expect(game).toContain('this.coachStatus = \'completed\'');
  });

  test('player UI keeps coach nodes stable across HUD refreshes', () => {
    const { document, window } = parseHTML('<html><body><div id="host"></div></body></html>');
    const sandbox: any = { document };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync('public/js/art-direction.js', 'utf8'), sandbox);
    vm.runInContext(source, sandbox);
    vm.runInContext(fs.readFileSync('public/js/player-experience.js', 'utf8'), sandbox);
    let skipped = 0;
    const game: any = {
      mode: 'classic', isGameRunning: true, isPaused: false, titleShowing: false,
      settings: { sfx: false }, score: 0, targetScore: 500, levelStarting: false, powerUpPending: false,
      getAuthToken: () => null, getSoundStatus: () => ({ enabled: false, supported: false, state: 'off', volume: 0.5 }),
      canInteractWithBoard: () => true, animationsReduced: () => false, saveUserData: () => {},
    };
    const ui = sandbox.InfinitePlayerExperience.mount(game, document.getElementById('host'));
    const host = ui.shell.querySelector('[data-first-play-coach-host]') as any;
    expect(host.hidden).toBe(true);
    const payload = sandbox.InfiniteFirstPlayCoach.view({ step: 'goal', targetScore: 500 });
    ui.renderFirstPlayCoach(payload, { skip: () => { skipped++; } });
    expect(host.hidden).toBe(false);
    const section = host.querySelector('[data-first-play-coach]');
    ui.refresh();
    ui.renderFirstPlayCoach(payload, { skip: () => { skipped++; } });
    expect(host.querySelector('[data-first-play-coach]')).toBe(section);
    (section.querySelector('[data-coach-skip]') as any).dispatchEvent(new window.Event('click'));
    expect(skipped).toBe(1);
    ui.renderFirstPlayCoach(null);
    expect(host.hidden).toBe(true);
  });
});
