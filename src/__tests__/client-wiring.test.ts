import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Static checks on the browser code. Jest here has no DOM, so these read the source and check the
// wiring that the browser would run: which object each call reaches, and that only one menu
// controller is ever created.
const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf-8');
const script = read('script.js');
const phaser = read('phaser3-game.js');
const indexHtml = read('index.html');

// Methods are declared as 4-space-indented `name(` or `async name(` lines in each class body.
const declares = (source: string, name: string) =>
  new RegExp(`^    (async )?${name}\\(`, 'm').test(source);

function wrapperTarget(name: string): string | null {
  const m = script.match(new RegExp(`^function ${name}\\([^)]*\\) \\{ return (call\\w+)\\('(\\w+)'`, 'm'));
  return m ? `${m[1]}:${m[2]}` : null;
}

describe('menu wrappers reach the menu controller', () => {
  const menuWrappers = [
    'showModeSelect', 'showSettings', 'showTitle', 'showLevelSelect', 'showNews', 'showOffers',
    'showLeaderboard', 'closeModal', 'closeTutorial', 'showAdvancedSettings', 'closeLoginModal',
    'handleLogin', 'handleRegister', 'syncWithPlatform',
  ];

  test.each(menuWrappers)('%s goes to the DOM controller and that controller defines it', (name) => {
    const target = wrapperTarget(name);
    expect(target).toBe(`callUi:${name}`);
    expect(declares(script, name)).toBe(true);
  });

  test('switchLoginTab passes its argument through', () => {
    expect(script).toMatch(/function switchLoginTab\(tab\) \{ return callUi\('switchLoginTab', tab\); \}/);
  });

  test('showLoginModal uses the controller and falls back to the modal markup', () => {
    expect(script).toMatch(/function showLoginModal\(\) \{[\s\S]*?window\.ui\.showLoginModal\(\)/);
    expect(script).toMatch(/getElementById\('login-modal'\)/);
  });
});

describe('gameplay wrappers reach the Phaser game, and it defines them', () => {
  const gameWrappers: Array<[string, string]> = [
    ['startGame', 'requestStart'],
    ['pauseGame', 'pauseGame'],
    ['usePowerUp', 'usePowerUp'],
    ['nextLevel', 'nextLevel'],
    ['selectLevel', 'selectLevel'],
  ];

  test.each(gameWrappers)('%s -> %s', (wrapper, method) => {
    expect(wrapperTarget(wrapper)).toBe(`callGame:${method}`);
    expect(declares(phaser, method)).toBe(true);
  });

  test('no wrapper calls a window.game method the Phaser game lacks', () => {
    const called = [...script.matchAll(/window\.game\.(\w+)/g)].map((m) => m[1]);
    const missing = [...new Set(called)].filter((name) => !declares(phaser, name));
    // isGameRunning and titleShowing are state fields, not methods.
    expect(missing.filter((n) => n !== 'isGameRunning' && n !== 'titleShowing')).toEqual([]);
  });
});

describe('one menu controller, one game', () => {
  test('script.js creates the menu controller in one place', () => {
    expect(script.match(/new InfiniteMatchGame\(/g)?.length).toBe(1);
    expect(script).toMatch(/window\.ui = new InfiniteMatchGame\(\)/);
  });

  test('index.html never constructs the menu controller', () => {
    expect(indexHtml).not.toMatch(/new InfiniteMatchGame\(/);
    expect(indexHtml).not.toMatch(/InfiniteMatchGame\(\)/);
  });

  test('the Phaser boot is the only game assignment on the page', () => {
    expect(indexHtml.match(/window\.game = new PhaserMatch3Game\(\)/g)?.length).toBe(1);
  });

  test('a missing WebGL or Phaser shows a notice instead of a second game', () => {
    expect(indexHtml).toMatch(/function showWebGLNotice\(\)/);
    expect(indexHtml).not.toMatch(/fallbackToJavaScriptGame\(\)\s*;?\s*\n\s*\}/);
  });
});

describe('the canvas title and sign-in', () => {
  const createBody = phaser.slice(phaser.indexOf('    create() {'), phaser.indexOf('    showTitleOverlay() {'));

  test('create() does not start an attempt or spend energy on load', () => {
    expect(createBody).not.toMatch(/claimAttempt|restartGame|requestStart|startGame/);
    expect(createBody).toMatch(/this\.showTitleOverlay\(\)/);
  });

  test('the title has Play and a sign-in path', () => {
    const titleBody = phaser.slice(phaser.indexOf('    showTitleOverlay() {'), phaser.indexOf('    openSignIn() {'));
    expect(titleBody).toMatch(/'Play', \(\) => this\.requestStart\(\)/);
    expect(titleBody).toMatch(/this\.openSignIn\(\)/);
    expect(phaser).toMatch(/window\.showLoginModal/);
  });

  test('a HUD account button opens sign-in', () => {
    expect(phaser).toMatch(/this\.accountBtn\.on\('pointerdown', \(\) => this\.openSignIn\(\)\)/);
  });

  test('sign-in notifies the canvas, which refreshes energy and the title', () => {
    expect(script.match(/dispatchEvent\(new Event\('auth:changed'\)\)/g)?.length).toBe(2);
    expect(phaser).toMatch(/addEventListener\('auth:changed'/);
  });

  test('requestStart claims an attempt before the board starts', () => {
    const start = phaser.slice(phaser.indexOf('    async requestStart() {'), phaser.indexOf('    nextLevel() {'));
    expect(start).toMatch(/this\.selectLevel\(Math\.floor\(this\.level\)\)/);
    const select = phaser.slice(phaser.indexOf('    selectLevel(levelNumber) {'), phaser.indexOf('    // The result of this level'));
    expect(select).toMatch(/this\.claimAttempt\(config\.level\)/);
    const restart = phaser.slice(phaser.indexOf('    async restartGame('), phaser.indexOf('    async restartGame(') + 300);
    expect(restart).toMatch(/claimAttempt\(\)/);
  });

  test('the attempt id is kept from the spend and sent with a win', () => {
    expect(phaser).toMatch(/this\.attemptId = data\.result\.attemptId;/);
    const endGame = phaser.slice(phaser.indexOf('    endGame() {'), phaser.indexOf('    showEndGameScreen('));
    expect(endGame).toMatch(/this\.submitLevelWin\(stars\)/);
    const submit = phaser.slice(phaser.indexOf('    async submitLevelWin('), phaser.indexOf('    // Refills energy on the server.'));
    expect(submit).toMatch(/stars <= 0/);
    expect(submit).toMatch(/attemptId, *\n?\s*\}/);
    expect(submit).toMatch(/\/api\/account-economy\/level\/complete/);
  });

  test('a level start claims the attempt for the level it is starting', () => {
    expect(phaser).toMatch(/this\.claimAttempt\(config\.level\)/);
  });
});

describe('energy and gems', () => {
  test('energy is not restored from localStorage over the server value', () => {
    expect(phaser).not.toMatch(/this\.energy = data\.energy \|\| 100;/);
  });

  test('the gems balance is gone from the game', () => {
    expect(phaser).not.toMatch(/this\.gems\b/);
    expect(phaser).not.toMatch(/gemsText/);
    expect(phaser).not.toMatch(/Gems: /);
  });
});

describe('keyboard shortcuts use real game state', () => {
  test('Escape pauses a running game, Enter presses Play on the title', () => {
    expect(script).toMatch(/window\.game\.isGameRunning[\s\S]*?window\.game\.pauseGame\(\)/);
    expect(script).toMatch(/window\.game\.titleShowing[\s\S]*?window\.game\.requestStart\(\)/);
    expect(script).not.toMatch(/currentScreen === 'game-screen'/);
  });
});

describe('energy has one spend path', () => {
  test('no local energy spend or grant is left in the game', () => {
    expect(phaser).not.toMatch(/consumeEnergy\(/);
    expect(phaser).not.toMatch(/addEnergy\(/);
  });
});
