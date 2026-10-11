import { describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

function helpers() {
  const sandbox: any = {};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('public/js/player-experience.js', 'utf8'), sandbox);
  return sandbox.InfinitePlayerExperience;
}

describe('mobile-first player experience helpers', () => {
  test('every color has a distinct non-color shape and readable symbol', () => {
    const styles = Object.values(helpers().visuals) as any[];
    expect(styles).toHaveLength(6);
    expect(new Set(styles.map((style) => style.shape)).size).toBe(6);
    expect(new Set(styles.map((style) => style.symbol)).size).toBe(6);
    expect(styles.every((style) => /^#[0-9a-f]{6}$/i.test(style.color))).toBe(true);
  });

  test.each([[390, 490, 8], [360, 380, 8], [768, 640, 7], [720, 300, 6]])('camera fits %s×%s without changing board geometry', (width, height, size) => {
    const zoom = helpers().boardZoom(width, height, size);
    expect(zoom * size * 54).toBeLessThanOrEqual(Math.min(width, height));
    expect(zoom).toBeGreaterThan(0);
    expect(zoom).toBeLessThanOrEqual(1.35);
  });

  test.each([
    [40, 3, [2, 2, 2, 3]], [-40, 3, [2, 2, 2, 1]],
    [3, 40, [2, 2, 3, 2]], [3, -40, [2, 2, 1, 2]],
  ])('a swipe maps to exactly one cardinal neighbour (%s,%s)', (dx, dy, cells) => {
    expect(Array.from(helpers().swipeCells(2, 2, dx, dy, 8))).toEqual(cells);
  });

  test('small drags remain taps and edge swipes cannot access invalid cells', () => {
    expect(helpers().swipeCells(0, 0, 8, 10, 8)).toBeNull();
    expect(helpers().swipeCells(0, 0, -40, 0, 8)).toBeNull();
    expect(helpers().swipeCells(7, 7, 0, 40, 8)).toBeNull();
  });

  test('keyboard cursor is clamped and unknown keys do nothing', () => {
    expect(Array.from(helpers().keyboardCell(0, 0, 'ArrowUp', 8))).toEqual([0, 0]);
    expect(Array.from(helpers().keyboardCell(7, 7, 'ArrowRight', 8))).toEqual([7, 7]);
    expect(Array.from(helpers().keyboardCell(3, 3, 'ArrowLeft', 8))).toEqual([3, 2]);
    expect(helpers().keyboardCell(3, 3, 'Enter', 8)).toBeNull();
  });

  test('gem drawing needs no external image, font or tracker', () => {
    const paths: string[] = [];
    const context: any = {
      clearRect() {}, beginPath() {}, closePath() {}, fill() {}, stroke() {}, moveTo() {}, lineTo() {},
      bezierCurveTo() {}, roundRect() {}, fillText: (symbol: string) => paths.push(symbol),
      createLinearGradient: () => ({ addColorStop() {} }),
    };
    const experience = helpers();
    for (const type of Object.keys(experience.visuals)) experience.drawGem(context, type);
    expect(paths.sort()).toEqual(['B', 'G', 'O', 'P', 'R', 'Y']);
  });

  test('earned badges use distinct font-independent geometry and retain base gem identity', () => {
    const experience = helpers();
    expect(Array.from(experience.specialTypes)).toEqual(['row', 'column', 'burst', 'prism']);
    const signatures = new Set();
    for (const kind of experience.specialTypes) {
      const symbols: string[] = []; const paths: any[] = [];
      const context: any = { clearRect() {}, beginPath() {}, closePath() {}, fill() {}, stroke() {},
        moveTo: (...point: number[]) => paths.push(['move', ...point]), lineTo: (...point: number[]) => paths.push(['line', ...point]),
        bezierCurveTo() {}, roundRect() {}, fillText: (symbol: string) => symbols.push(symbol),
        createLinearGradient: () => ({ addColorStop() {} }) };
      experience.drawGem(context, 'red', kind);
      expect(symbols).toEqual(['R']); // No missing glyph can hide the earned badge.
      expect(experience.specialNames[kind]).toBeTruthy();
      signatures.add(JSON.stringify(paths));
    }
    expect(signatures.size).toBe(4);
  });

  test('Endless auto-checkpoints require a saved, explicit preference and explain energy/reward limits', () => {
    const { document, window } = parseHTML('<html><body><div id="host"></div></body></html>');
    const sandbox: any = { document };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync('public/js/player-experience.js', 'utf8'), sandbox);
    let saves = 0;
    const game: any = { mode: 'endless', isGameRunning: true, settings: { sfx: false, endlessAutoContinue: false },
      score: 0, targetScore: 500, isPaused: false, levelStarting: false, powerUpPending: false,
      getAuthToken: () => 'signed-in', getSoundStatus: () => ({ enabled: false, supported: false, state: 'off', volume: 0.5 }),
      canInteractWithBoard: () => false, animationsReduced: () => false, saveUserData: () => { saves++; } };
    const ui = sandbox.InfinitePlayerExperience.mount(game, document.getElementById('host'));
    const dialog: any = ui.shell.querySelector('dialog');
    dialog.showModal = () => { dialog.open = true; }; dialog.close = () => { dialog.open = false; };
    game.openOverlay = (title: string) => ui.openOverlay(title);
    game.closeOverlay = () => ui.closeOverlay();
    ui.refresh();
    expect(ui.shell.querySelector('.match-endless-terms').textContent).toContain('Auto-checkpoints off');
    ui.showPreferences(false);
    const checkbox: any = dialog.querySelector('[data-endless-auto-continue]');
    expect(checkbox).toBeTruthy(); expect(checkbox.checked).toBe(false);
    expect(checkbox.parentElement.textContent).toContain('1 energy');
    checkbox.checked = true; checkbox.dispatchEvent(new window.Event('change'));
    expect(game.settings.endlessAutoContinue).toBe(true); expect(saves).toBe(1);
    expect(ui.shell.querySelector('.match-endless-terms').textContent).toContain('Auto-checkpoints on');
    game.mode = 'classic'; ui.refresh();
    expect(ui.shell.querySelector('.match-endless-terms').hidden).toBe(true);
  });

  test('player UI precedes the game class and keeps canvas-only shell compatibility', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    const game = fs.readFileSync('phaser3-game.js', 'utf8');
    expect(html.indexOf('src="js/player-experience.js"')).toBeLessThan(html.indexOf('src="phaser3-game.js"'));
    expect(game).toContain('this.playerUI ? Phaser.Scale.RESIZE : Phaser.Scale.FIT');
    expect(game).toContain('if (this.playerUI) return this.playerUI.overlayText(label)');
    expect(html).not.toMatch(/user-scalable=no|maximum-scale=1(?:\.0)?/);
    expect(html).toContain('viewport-fit=cover');
    expect(html).not.toContain('lastTouchEnd');
    expect(html).not.toContain('Simulate loading progress');
    expect(html).toContain('window.addEventListener(\'match:ready\', ready');
  });
});
