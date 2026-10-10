import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { certifyBoard, simulateMove } from '../services/levels/generator.js';
import { generatedLevel } from '../services/levels/level-service.js';

const location = { timeZone: 'America/New_York', country: 'US', region: 'PA' };
const now = Date.parse('2026-10-31T12:00:00Z');
const definition = (level = 1, mode = 'classic', at = now) => generatedLevel({ level, mode, location }, at);

function sprite(x = 0, y = 0, key = '') {
  const value: any = { x, y, key, data: {}, destroyed: false, text: '' };
  for (const method of ['setScale', 'setAlpha', 'setVisible', 'setOrigin', 'setInteractive', 'setColor', 'setTint', 'clearTint', 'on']) value[method] = () => value;
  value.setData = (name: string, data: any) => { value.data[name] = data; return value; };
  value.getData = (name: string) => value.data[name];
  value.setTexture = (texture: string) => { value.key = texture; return value; };
  value.setPosition = (px: number, py: number) => { value.x = px; value.y = py; return value; };
  value.setText = (text: string) => { value.text = text; return value; };
  value.destroy = () => { value.destroyed = true; };
  return value;
}

function makeBrowserGame() {
  const saved = new Map<string, string>();
  const events: any[] = [];
  const sandbox: any = {
    console: { log() {}, info() {}, error() {}, warn() {} },
    navigator: {}, Intl, Date, URLSearchParams, AbortSignal,
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
    localStorage: { getItem: (key: string) => saved.get(key) || null, setItem: (key: string, val: string) => saved.set(key, val) },
    document: { readyState: 'loading', addEventListener() {}, getElementById: () => null },
    addEventListener() {},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const file of ['public/js/procedural-levels.js', 'public/js/level-location.js', 'phaser3-game.js']) {
    vm.runInContext(readFileSync(file, 'utf8'), sandbox, { filename: file });
  }
  const game: any = Object.create(sandbox.PhaserMatch3Game.prototype);
  Object.assign(game, {
    scene: {
      add: { image: sprite, text: sprite },
      tweens: {
        killTweensOf() {},
        add: (options: any) => {
          if (options.x !== undefined && options.targets && !options.yoyo) {
            options.targets.x = options.x;
            options.targets.y = options.y;
          }
        },
      },
      cameras: { main: { setBackgroundColor() {} } },
    },
    gemSprites: [], mode: 'classic', level: 1, campaignLevel: 25,
    score: 0, energy: 100, maxEnergy: 100, stars: 0, achievements: [],
    settings: { sfx: false }, tutorialShown: true, isGameRunning: false, isPaused: false,
    analytics: { gamesPlayed: 0, totalScore: 0, totalTime: 0 },
    scoreText: sprite(), movesText: sprite(), timerText: sprite(), levelText: sprite(), energyText: sprite(), starsText: sprite(), goalText: sprite(), themeText: sprite(),
    getAuthToken: () => null,
    getLevelLocation: () => location,
    initializePlatform: async () => game.loadUserData(),
    syncPowerUpInventory: async () => {},
    updateEnergyDisplay() {}, closeOverlay() {}, showScorePopup() {}, checkAchievements() {}, playSound() {},
    showAttemptError: (message: string) => { game.lastError = message; },
    trackEvent: (event: string, data: any) => events.push({ event, data }),
    endGame: () => { game.isGameRunning = false; game.endCalls = (game.endCalls || 0) + 1; },
  });
  return { game, sandbox, saved, events };
}

function assertSprites(game: any) {
  for (let r = 0; r < game.boardSize; r++) {
    for (let c = 0; c < game.boardSize; c++) {
      const s = game.gemSprites[r][c];
      expect(s.key).toBe(`gem_${game.board[r][c]}`);
      expect(s.getData('type')).toBe(game.board[r][c]);
      expect(s.getData('row')).toBe(r);
      expect(s.getData('col')).toBe(c);
      expect(s.x).toBe(game.cellX(c));
      expect(s.y).toBe(game.cellY(r));
    }
  }
  expect(game.findMatches().size).toBe(0);
  expect(game.hasPossibleMove()).toBe(true);
}

describe('real Phaser core uses the certified definition', () => {
  test('certified winning moves work in the actual browser game, including refills and reshuffles', () => {
    for (let level = 1; level <= 25; level++) {
      const { game } = makeBrowserGame();
      const def = definition(level);
      game.applyGeneratedDefinition(def);
      game.isGameRunning = true;
      assertSprites(game);
      const proof = certifyBoard(def.board, def.refillState, def.gemTypes, def.gemWeights, def.moves);
      for (const cells of proof.witness) {
        if (!game.isGameRunning) break; // The actual game stops as soon as its goal is reached.
        const expected = simulateMove(game.board, game.levelRng.state, def.gemTypes, def.gemWeights, cells)!;
        const score = game.score;
        game.trySwap(...cells);
        expect(JSON.parse(JSON.stringify(game.board))).toEqual(expected.board);
        expect(game.score - score).toBe(expected.score);
        expect(game.levelRng.state).toBe(expected.refillState);
        assertSprites(game);
      }
      expect(game.score).toBeGreaterThanOrEqual(def.targetScore);
      expect(game.endCalls).toBe(1);
      expect(game.moves).toBeGreaterThanOrEqual(0);
    }
  });

  test('the opening board is identical for repeated attempts', () => {
    const { game } = makeBrowserGame();
    const def = definition(27);
    game.applyGeneratedDefinition(def);
    const first = JSON.stringify(game.board);
    game.randomGem();
    game.applyGeneratedDefinition(def);
    expect(JSON.stringify(game.board)).toBe(first);
    expect(game.levelRng.state).toBe(def.refillState);
  });

  test('a saved score/level cannot overwrite a fresh generated attempt during startup', async () => {
    const { game, saved } = makeBrowserGame();
    saved.set('phaser3_game_data', JSON.stringify({ level: 5000, score: 99999 }));
    const def = definition(3);
    game.fetchJson = async () => ({ ok: true, status: 200, data: { success: true, level: def } });
    expect(await game.selectLevel(3)).toBe(true);
    expect(game.level).toBe(3);
    expect(game.score).toBe(0);
    expect(game.targetScore).toBe(def.targetScore);
    expect(game.isGameRunning).toBe(true);
  });

  test('signed-in play uses the definition pinned by energy/spend, not a local target', async () => {
    const { game } = makeBrowserGame();
    const def = definition(100001);
    const calls: any[] = [];
    game.getAuthToken = () => 'token';
    game.fetchJson = async (url: string, options: any) => {
      calls.push({ url, body: JSON.parse(options.body) });
      return { ok: true, data: { success: true, result: { energy: 99, level: 100001, attemptId: 'attempt', generatedLevel: def } } };
    };
    expect(await game.selectLevel(100001)).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ url: '/api/account-economy/energy/spend', body: { mode: 'classic', level: 100001, location } });
    expect(game.targetScore).toBe(def.targetScore);
    expect(game.attemptId).toBe('attempt');
    expect(game.attemptLevel).toBe(100001);
    expect(JSON.parse(JSON.stringify(game.board))).toEqual(def.board);
  });

  test('repeated clicks while starting cannot charge a second attempt', async () => {
    const { game } = makeBrowserGame();
    game.getAuthToken = () => 'token';
    let calls = 0;
    game.fetchJson = async () => {
      calls++;
      return { ok: true, data: { success: true, result: { level: 1, energy: 99, attemptId: 'attempt', generatedLevel: definition() } } };
    };
    const results = await Promise.all([game.selectLevel(1), game.selectLevel(2)]);
    expect(results).toEqual([true, false]);
    expect(calls).toBe(1);
  });

  test('endless automatically advances while retaining its single paid attempt and context', () => {
    const { game, events } = makeBrowserGame();
    const def = definition(1, 'endless');
    game.applyGeneratedDefinition(def);
    game.isGameRunning = true;
    game.runStartedAt = 12345;
    game.attemptId = 'one-paid-attempt';
    game.attemptLevel = 1;
    game.score = def.targetScore + 50;
    const expectedTotal = game.score;
    game.checkEndConditions();
    expect(game.level).toBe(2);
    expect(game.generatedLevel.id).not.toBe(def.id);
    expect(game.generatedLevel.context).toEqual(def.context);
    expect(game.score).toBe(0);
    expect(game.endlessTotalScore).toBe(expectedTotal);
    expect(game.attemptId).toBe('one-paid-attempt');
    expect(game.attemptLevel).toBe(1);
    expect(game.runStartedAt).toBe(12345);
    expect(game.isGameRunning).toBe(true);
    expect(events.some((event) => event.event === 'endless_stage_started')).toBe(true);
    assertSprites(game);
  });

  test('numeric overflow banks an endless run rather than generating an invalid stage', () => {
    const { game } = makeBrowserGame();
    game.applyGeneratedDefinition(definition(Number.MAX_SAFE_INTEGER, 'endless'));
    let ended = false;
    game.endGame = () => { ended = true; };
    game.advanceEndlessStage();
    expect(ended).toBe(true);
  });

  test('banking an endless run submits the cumulative score, not just its last stage', async () => {
    const { game } = makeBrowserGame();
    game.applyGeneratedDefinition(definition(1, 'endless'));
    game.endlessTotalScore = 4500;
    game.score = 500;
    let submitted = 0;
    game.submitEndlessRun = async (score: number) => { submitted = score; return null; };
    game.showEndGameScreen = () => {};
    await game.finishEndless();
    expect(submitted).toBe(5000);
  });

  test('daily retry requests today again, so a midnight rollover gives a new definition', async () => {
    const { game } = makeBrowserGame();
    const definitions = [definition(1, 'daily'), definition(1, 'daily', Date.parse('2026-11-01T15:00:00Z'))];
    const urls: string[] = [];
    game.fetchJson = async (url: string) => {
      urls.push(url);
      return { ok: true, data: { success: true, level: definitions.shift() } };
    };
    await game.startDaily();
    const first = game.generatedLevel.id;
    await game.restartGame();
    expect(game.generatedLevel.id).not.toBe(first);
    expect(game.generatedLevel.context.localDate).toBe('2026-11-01');
    expect(urls.every((url) => url.startsWith('/api/levels/daily?'))).toBe(true);
  });

  test('daily and endless sessions do not overwrite saved campaign progress', async () => {
    const { game, saved } = makeBrowserGame();
    for (const mode of ['daily', 'endless']) {
      game.applyGeneratedDefinition(definition(1, mode));
      await game.saveUserData();
      expect(JSON.parse(saved.get('phaser3_game_data')!).level).toBe(25);
    }
  });

  test('Next Level waits for the reward to finish before replacing its attempt', async () => {
    const { game } = makeBrowserGame();
    let release!: () => void;
    game.rewardSubmission = new Promise<void>((resolve) => { release = resolve; });
    let started = false;
    game.selectLevel = async () => { started = true; };
    const next = game.nextLevel();
    expect(started).toBe(false);
    release();
    await next;
    expect(started).toBe(true);
  });

  test('offline guests still get a procedurally generated board, never a paid attempt', async () => {
    const { game } = makeBrowserGame();
    game.fetchJson = async () => { throw new Error('offline'); };
    expect(await game.selectLevel(100001)).toBe(true);
    expect(game.generatedLevel.generatorVersion).toBe(1);
    expect(game.generatedLevel.context.offline).toBe(true);
    expect(game.attemptId).toBeNull();
    assertSprites(game);
  });
});

describe('privacy-preserving browser location preferences', () => {
  test('southern hemisphere and local day are available even offline without GPS', () => {
    const { sandbox, saved } = makeBrowserGame();
    saved.set('infinite_match_level_location_v1', JSON.stringify({ timeZone: 'Australia/Sydney', country: 'AU', region: 'NSW' }));
    const preferences = sandbox.InfiniteLevelLocation.current();
    const context = sandbox.InfiniteLevelLocation.offlineContext(preferences, new Date('2026-01-15T18:00:00Z'));
    expect(context).toMatchObject({ localDate: '2026-01-16', hemisphere: 'south', season: 'summer', country: 'AU', region: 'NSW' });
    expect(context).not.toHaveProperty('latitude');
    expect(context).not.toHaveProperty('longitude');
    expect(readFileSync('public/js/level-location.js', 'utf8')).not.toMatch(/getCurrentPosition|watchPosition/);
  });

  test('the daily card, location settings and unlimited level browser are wired to real entry points', () => {
    const html = readFileSync('index.html', 'utf8');
    const menus = readFileSync('script.js', 'utf8');
    expect(html).toContain('onclick="chooseMode(\'daily\')"');
    expect(html).toContain('id="procedural-level-grid"');
    expect(html).toContain('id="level-time-zone"');
    expect(html).toContain('onclick="saveLevelLocation()"');
    expect(html.indexOf('js/procedural-levels.js')).toBeLessThan(html.indexOf('src="phaser3-game.js"'));
    expect(menus).toContain('callGame(\'startDaily\')');
    expect(menus).toContain('renderProceduralLevels()');
    expect(menus).toContain('Number.MAX_SAFE_INTEGER');
  });
});
