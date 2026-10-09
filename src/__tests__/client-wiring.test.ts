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
  const m = script.match(new RegExp(`^function ${name}\\([^)]*\\) \\{ (?:revealCanvas\\(\\); )?return (call\\w+)\\('(\\w+)'`, 'm'));
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

describe('the DOM menus are reachable from the canvas', () => {
  test('the canvas has a Menu button that opens the DOM menu and pauses a running level', () => {
    expect(phaser).toMatch(/this\.menuBtn\.on\('pointerdown', \(\) => this\.openMenu\(\)\)/);
    const open = phaser.slice(phaser.indexOf('    openMenu() {'), phaser.indexOf('    closeMenu() {'));
    expect(open).toMatch(/this\.pauseGame\(\)/);
    expect(open).toMatch(/window\.openDomMenu\(\)/);
  });

  test('returning to the canvas resumes a level the menu paused', () => {
    const close = phaser.slice(phaser.indexOf('    closeMenu() {'), phaser.indexOf('    returnToMenu() {'));
    expect(close).toMatch(/this\.menuPausedRun/);
    expect(close).toMatch(/this\.resumeGame\(\)/);
  });

  test('the end-of-level Main Menu opens the DOM menu', () => {
    const body = phaser.slice(phaser.indexOf('    returnToMenu() {'), phaser.indexOf('    destroy() {'));
    expect(body).toMatch(/this\.openMenu\(\)/);
  });

  test('index.html hides the canvas for the menu and has a way back', () => {
    expect(indexHtml).toMatch(/function openDomMenu\(\)[\s\S]*?display = 'none'/);
    expect(indexHtml).toMatch(/function showGameCanvas\(\)[\s\S]*?display = ''/);
    expect(indexHtml).toMatch(/id="menu-return"[^>]*onclick="returnToGame\(\)"/);
  });

  test('gameplay entry points bring the canvas back', () => {
    for (const name of ['startGame', 'selectLevel', 'nextLevel']) {
      const m = script.match(new RegExp(`function ${name}\\([^)]*\\) \\{ ?(?:revealCanvas\\(\\);)`));
      expect(m).not.toBeNull();
    }
  });
});

describe('stars belong to the server', () => {
  test('the client never invents a star balance', () => {
    expect(phaser).not.toMatch(/1250/);
    expect(phaser).toMatch(/this\.stars = 0;/);
  });

  test('a win shows the star count the server returned, not the client count', () => {
    const submit = phaser.slice(phaser.indexOf('    async submitLevelWin('), phaser.indexOf('    // Refills energy on the server.'));
    expect(submit).toMatch(/this\.stars = data\.result\.balances\.stars;/);
    expect(submit).not.toMatch(/stars,\s*\n/);
  });

  test('loot-box stars are re-read from the server', () => {
    const apply = phaser.slice(phaser.indexOf('    applyLootReward(reward) {'), phaser.indexOf('    applyLootReward(reward) {') + 400);
    expect(apply).toMatch(/syncAccountFromServer/);
    expect(apply).not.toMatch(/this\.stars \+=/);
  });
});

describe('community screen, modes, and the battle pass entry', () => {
  // The community code is the slice of script.js between its first and last community method.
  const community = script.slice(script.indexOf('    showCommunity('), script.indexOf('    showLevelSelect() {'));

  test('the community methods exist on the controller', () => {
    for (const name of ['showCommunity', 'showCommunityTab', 'loadCommunitySeason', 'loadCommunityFriends', 'loadCommunityGuild', 'loadCommunityEvents']) {
      expect(declares(script, name)).toBe(true);
    }
  });

  test('player-chosen names are written with textContent, never innerHTML', () => {
    expect(community.length).toBeGreaterThan(1000);
    expect(community).not.toMatch(/innerHTML/);
    expect(community).not.toMatch(/insertAdjacentHTML/);
  });

  test('every community request sends the session token', () => {
    expect(community).toMatch(/Authorization = `Bearer \$\{token\}`/);
    expect(community).toMatch(/const token = this\.getAuthToken\(\)/);
  });

  test('the community screen exists and each tab is wired to the controller', () => {
    expect(indexHtml).toMatch(/<div id="community-screen" class="screen">/);
    expect(indexHtml).toMatch(/<div id="community-body"/);
    for (const tab of ['battlepass', 'friends', 'guild', 'events']) {
      expect(indexHtml).toMatch(new RegExp(`data-tab="${tab}" onclick="ui\\.showCommunityTab\\('${tab}'\\)"`));
    }
  });

  test('the title screen opens the community, and the old canvas battle pass is no longer opened', () => {
    expect(indexHtml).toMatch(/onclick="showCommunity\(\)"/);
    expect(script).toMatch(/function showCommunity\(tab\) \{ return callUi\('showCommunity', tab\); \}/);
    const showBp = phaser.slice(phaser.indexOf('    showBattlePass() {'), phaser.indexOf('    showBattlePass() {') + 400);
    expect(showBp).toMatch(/showCommunity\('battlepass'\)/);
    expect(showBp).not.toMatch(/createBattlePassUI\(\)/);
  });

  test('the mode cards call chooseMode, and classic goes through it too', () => {
    expect(indexHtml).toMatch(/onclick="chooseMode\('classic'\)"/);
    expect(indexHtml).toMatch(/onclick="chooseMode\('timed'\)"/);
    expect(indexHtml).toMatch(/onclick="chooseMode\('endless'\)"/);
    expect(indexHtml).not.toMatch(/onclick="showLevelSelect\(\)">\s*<span class="play-text">START/);
    expect(script).toMatch(/function chooseMode\(mode\) \{[\s\S]*?callGame\('setMode', mode\)[\s\S]*?callGame\('startEndless'\)/);
  });

  test('endless runs pay through the server and never report a level result', () => {
    const endless = phaser.slice(phaser.indexOf('    async finishEndless() {'), phaser.indexOf('    async finishEndless() {') + 900);
    expect(endless).toMatch(/submitEndlessRun\(score\)/);
    expect(endless).not.toMatch(/reportLevelResult/);
    const submit = phaser.slice(phaser.indexOf('    async submitEndlessRun('), phaser.indexOf('    async submitEndlessRun(') + 700);
    expect(submit).toMatch(/\/api\/account-economy\/endless\/complete/);
  });

  test('the client loads the tuning overrides from the public targets route', () => {
    expect(phaser).toMatch(/fetch\('\/api\/level-results\/targets'\)/);
    expect(phaser).toMatch(/const multiplier = \(levelOverrides && levelOverrides\.levels && levelOverrides\.levels\[n\]\) \|\| 1;/);
  });
});

describe('decorations, shop prices, offers, and mini-games', () => {
  test('the Kingdom screen opens the decoration screen, which calls the three decor routes', () => {
    expect(phaser).toMatch(/this\.overlayButton\(250, 500, 100, 50, 0x9b59b6, 'Decor', \(\) => this\.openDecor\(\)\)/);
    const decor = phaser.slice(phaser.indexOf('    openDecor('), phaser.indexOf('    async renderKingdom()'));
    expect(decor).toMatch(/'\/api\/kingdom\/decor\/buy'/);
    expect(decor).toMatch(/'\/api\/kingdom\/decor\/place'/);
    expect(decor).toMatch(/'\/api\/kingdom\/decor\/remove'/);
    expect(decor).toMatch(/this\.createKingdomUI\(\)/);
  });

  test('overlay labels are destroyed with their buttons, so an upgrade does not leave old labels', () => {
    expect(phaser).toMatch(/box\.labelText = this\.overlayText\(x, y, label\);/);
    expect(phaser).toMatch(/function destroyOverlayObjects\(objects\)/);
    const kingdom = phaser.slice(phaser.indexOf('    async renderKingdom()'), phaser.indexOf('    async renderKingdom()') + 300);
    expect(kingdom).toMatch(/destroyOverlayObjects\(this\.kingdomRowObjects\)/);
  });

  test('the Kingdom screen shows the room coin bonus from the server', () => {
    expect(phaser).toMatch(/data\.coinBonus/);
    expect(phaser).toMatch(/Room bonus \+\$\{bonus\}% coins/);
  });

  test('shop pack prices come from the server offers route, not a fixed label', () => {
    const shop = phaser.slice(phaser.indexOf('    createShopUI() {'), phaser.indexOf('    async refreshCoinBalance('));
    expect(shop).not.toMatch(/\$0\.99|\$4\.99|\$9\.99/);
    expect(shop).toMatch(/this\.loadShopPrices\(packs\)/);
    const load = phaser.slice(phaser.indexOf('    async loadShopPrices('), phaser.indexOf('    async loadShopPrices(') + 500);
    expect(load).toMatch(/fetch\('\/api\/live-ops\/offers'\)/);
  });

  test('the offers screen has no gem packs and loads its list from the server', () => {
    const offers = indexHtml.slice(indexHtml.indexOf('<div id="offers-screen"'), indexHtml.indexOf('<div id="leaderboard-screen"'));
    expect(offers).not.toMatch(/Gem Pack|Starter Pack|\$4\.99|\$1\.99/);
    expect(offers).toMatch(/id="offers-list"/);
    const load = script.slice(script.indexOf('    async loadOffers()'), script.indexOf('    async loadOffers()') + 400);
    expect(load).toMatch(/fetch\('\/api\/live-ops\/offers'\)/);
  });

  test('the Events tab reads the active events the server sends', () => {
    expect(script).toMatch(/today\.data\.activeEvents/);
    expect(script).not.toMatch(/today\.data\.events/);
  });

  test('each mini-game sends its score to the server once, through finishMinigame', () => {
    expect(script).toMatch(/finishMinigame\('memory'/);
    expect(script).toMatch(/finishMinigame\('treasure'/);
    expect(script).toMatch(/finishMinigame\('rhythm'/);
    const finish = script.slice(script.indexOf('    async finishMinigame('), script.indexOf('    async finishMinigame(') + 1200);
    expect(finish).toMatch(/\/api\/minigames\/\$\{encodeURIComponent\(gameId\)\}\/complete/);
    expect(finish).toMatch(/already_played_today/);
  });

  test('the mini-games screen and title button exist', () => {
    expect(indexHtml).toMatch(/<div id="minigames-screen" class="screen">/);
    expect(indexHtml).toMatch(/onclick="showMiniGames\(\)"/);
    expect(script).toMatch(/function showMiniGames\(\) \{ return callUi\('showMiniGames'\); \}/);
  });
});
