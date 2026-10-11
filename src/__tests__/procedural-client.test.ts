import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { setImmediate } from 'node:timers';
import { certifyLevel, simulateLevelMove, simulateObjectiveClear, generateLevel } from '../services/levels/generator.js';
import { generatedLevel } from '../services/levels/level-service.js';
import { inventoryReplayEffect, REPLAY_POWERUPS } from '../services/levels/inventory-replay.js';
import { initialObjectiveProgress } from '../services/levels/objective-rules.js';

const location = { timeZone: 'America/New_York', country: 'US', region: 'PA' };
const now = Date.parse('2026-10-31T12:00:00Z');
const definition = (level = 1, mode = 'classic', at = now) => generatedLevel({ level, mode, location, rulesVersion: 3 }, at);

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
  for (const file of ['public/js/procedural-levels.js', 'public/js/level-location.js', 'public/js/sound-effects.js', 'public/js/player-experience.js', 'public/js/assistive-board.js', 'public/js/match-feedback.js', 'phaser3-game.js']) {
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
      expect(s.key).toBe(game.gemTexture(game.board[r][c], game.specials?.[r]?.[c], game.shields?.[r]?.[c]));
      expect(s.getData('special')).toBe(game.specials?.[r]?.[c] || null);
      expect(s.getData('type')).toBe(game.board[r][c]);
      expect(s.getData('row')).toBe(r);
      expect(s.getData('col')).toBe(c);
      expect(s.x).toBe(game.cellX(c));
      expect(s.y).toBe(game.cellY(r));
    }
  }
  expect(game.findMatches().size).toBe(0);
  expect(game.hasPossibleMove()).toBe(true);
  expect(new Set(game.gemSprites.flat()).size).toBe(game.boardSize ** 2);
}

describe('real Phaser core uses the certified definition', () => {
  test('certified winning moves work in the actual browser game, including refills and reshuffles', () => {
    for (let level = 1; level <= 25; level++) {
      const { game } = makeBrowserGame();
      const def = definition(level);
      game.applyGeneratedDefinition(def);
      game.isGameRunning = true;
      assertSprites(game);
      const proof = certifyLevel(def);
      for (const cells of proof.witness) {
        if (!game.isGameRunning) break; // The actual game stops as soon as its goal is reached.
        const expected = simulateLevelMove(def, { board: game.board, specials: game.specials, refillState: game.levelRng.state }, cells)!;
        const score = game.score;
        if (cells.length === 2) game.activateEarnedSpecial(...cells); else game.trySwap(...cells);
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

  test('weather/time winning witnesses also replay through real Phaser rules and sprites', () => {
    for (const period of ['morning', 'afternoon', 'evening', 'night']) {
      for (const condition of ['rain', 'snow', 'storm']) {
        const { game, sandbox } = makeBrowserGame();
        const base = definition(10);
        const context = { ...base.context, timeOfDay: { period }, weather: { available: true, condition,
          temperatureBand: 'cold', windBand: 'windy', expiresAt: new Date(now + 3600000).toISOString() } };
        const def = sandbox.InfiniteLevels.generateLevel(10, context, 'classic', 3);
        game.applyGeneratedDefinition(def);
        game.isGameRunning = true;
        const proof = certifyLevel(def);
        for (const cells of proof.witness) {
          if (!game.isGameRunning) break;
          const expected = simulateLevelMove(def, { board: game.board, specials: game.specials, refillState: game.levelRng.state }, cells)!;
          const score = game.score;
          if (cells.length === 2) game.activateEarnedSpecial(...cells); else game.trySwap(...cells);
          expect(JSON.parse(JSON.stringify(game.board))).toEqual(expected.board);
          expect(game.score - score).toBe(expected.score);
          expect(game.levelRng.state).toBe(expected.refillState);
          assertSprites(game);
        }
        expect(game.score).toBeGreaterThanOrEqual(def.targetScore);
        expect(game.endCalls).toBe(1);
      }
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
    expect(calls[0]).toMatchObject({ url: '/api/account-economy/energy/spend', body: { mode: 'classic', level: 100001, location, rulesVersion: 5 } });
    expect(game.targetScore).toBe(def.targetScore);
    expect(game.attemptId).toBe('attempt');
    expect(game.attemptLevel).toBe(100001);
    expect(JSON.parse(JSON.stringify(game.board))).toEqual(def.board);
  });

  test('frozen v2 definitions still replay through the legacy Phaser path', () => {
    const { game } = makeBrowserGame();
    const def = generateLevel(1, definition().context, 'classic', 2);
    game.applyGeneratedDefinition(def); game.isGameRunning = true;
    expect(game.usesEarnedSpecials()).toBe(false);
    expect(game.specials).toBeNull();
    for (const cells of certifyLevel(def).witness) {
      if (!game.isGameRunning) break;
      const expected = simulateLevelMove(def, { board: game.board, refillState: game.levelRng.state }, cells)!;
      game.trySwap(...cells);
      expect(JSON.parse(JSON.stringify(game.board))).toEqual(expected.board);
      assertSprites(game);
    }
    expect(game.score).toBeGreaterThanOrEqual(def.targetScore);
  });

  test('an existing v2 endless attempt never upgrades its rules mid-run', () => {
    const { game } = makeBrowserGame();
    const def = generateLevel(1, definition().context, 'endless', 2);
    game.applyGeneratedDefinition(def); game.isGameRunning = true; game.attemptId = 'v2-paid';
    game.score = def.targetScore;
    game.checkEndConditions();
    expect(game.generatedLevel.generatorVersion).toBe(2);
    expect(game.specials).toBeNull(); expect(game.attemptId).toBe('v2-paid');
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
    expect(game.generatedLevel.context.localDate).toEqual(def.context.localDate);
    expect(game.generatedLevel.context.holidays).toEqual(def.context.holidays);
    expect(game.score).toBe(0);
    expect(game.endlessTotalScore).toBe(expectedTotal);
    expect(game.attemptId).toBe('one-paid-attempt');
    expect(game.attemptLevel).toBe(1);
    expect(game.runStartedAt).toBe(12345);
    expect(game.isGameRunning).toBe(true);
    expect(events.some((event) => event.event === 'endless_stage_started')).toBe(true);
    assertSprites(game);
  });

  test('new time/weather only affects the next endless stage; its paid attempt and current board stay intact', () => {
    const { game, sandbox } = makeBrowserGame();
    const def = definition(1, 'endless');
    game.applyGeneratedDefinition(def);
    game.isGameRunning = true;
    game.attemptId = 'same-paid-attempt'; game.attemptLevel = 1; game.runStartedAt = 12345;
    const board = JSON.stringify(game.board);
    const context = { ...def.context, evaluatedAt: '2026-10-31T16:01:00.000Z', timeOfDay: { period: 'afternoon' },
      weather: { available: true, source: 'metno', condition: 'storm', temperatureBand: 'mild', windBand: 'windy',
        area: { key: '42,-77' }, expiresAt: '2026-10-31T17:00:00.000Z' } };
    sandbox.InfiniteLevelLocation.rememberContext(context, location);
    expect(JSON.stringify(game.board)).toBe(board);
    expect(game.generatedLevel.id).toBe(def.id);
    game.score = def.targetScore;
    game.checkEndConditions();
    expect(game.level).toBe(2);
    expect(game.generatedLevel.environmentKey).toBe('afternoon-storm-mild-windy');
    expect(game.gemTypes.length).toBe(6);
    expect(game.attemptId).toBe('same-paid-attempt'); expect(game.attemptLevel).toBe(1);
    expect(game.runStartedAt).toBe(12345); expect(game.endlessTotalScore).toBe(def.targetScore);
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
    expect(game.generatedLevel.generatorVersion).toBe(5);
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
    // GPS is now explicitly opt-in, never invoked during adapter construction.
    expect(sandbox.navigator.geolocation).toBeUndefined();
    expect(readFileSync('public/js/level-location.js', 'utf8')).not.toContain('watchPosition');
  });

  test('device area requires an explicit action, rounds before storage/request and handles permission refusal', () => {
    const { sandbox, saved } = makeBrowserGame();
    const fields: any = {
      'level-location-message': { textContent: '' },
      'level-weather-latitude': { value: '' }, 'level-weather-longitude': { value: '' },
    };
    sandbox.document.getElementById = (id: string) => fields[id] || null;
    let requested = 0;
    sandbox.navigator.geolocation = { getCurrentPosition: (success: any) => {
      requested++; success({ coords: { latitude: 41.978532, longitude: -76.517862 } });
    } };
    sandbox.InfiniteLevelLocation.current();
    expect(requested).toBe(0);
    sandbox.useWeatherLocation();
    expect(requested).toBe(1);
    expect(fields['level-weather-latitude'].value).toBe('42');
    expect(fields['level-weather-longitude'].value).toBe('-77');
    expect(saved.has('infinite_match_level_location_v1')).toBe(false); // Apply is required.
    saved.set('infinite_match_level_location_v1', JSON.stringify({ ...location, weatherLatitude: 41.978532, weatherLongitude: -76.517862 }));
    const query = sandbox.InfiniteLevelLocation.query();
    expect(query).toContain('weatherLatitude=42'); expect(query).toContain('weatherLongitude=-77');
    expect(query).not.toMatch(/41\.978532|76\.517862/);
    saved.set('infinite_match_level_location_v1', JSON.stringify({ ...location, weatherLatitude: 42, weatherLongitude: -77, weatherEnabled: false }));
    expect(sandbox.InfiniteLevelLocation.query()).not.toMatch(/weatherLatitude|weatherLongitude/);
    sandbox.navigator.geolocation.getCurrentPosition = (_success: any, fail: any) => fail({ code: 1 });
    sandbox.useWeatherLocation();
    expect(fields['level-location-message'].textContent).toContain('denied');
  });

  test('cached weather is reused only for the matching area while still fresh, never synthesized', () => {
    const { sandbox } = makeBrowserGame();
    const def = definition();
    const context = { ...def.context, weather: { available: true, condition: 'rain', source: 'metno',
      temperatureBand: 'cool', windBand: 'calm', area: { key: '41,-74' }, expiresAt: new Date(now + 600000).toISOString() } };
    sandbox.InfiniteLevelLocation.rememberContext(context, location);
    expect(sandbox.InfiniteLevelLocation.offlineContext(location, new Date(now + 1000)).weather.available).toBe(true);
    expect(sandbox.InfiniteLevelLocation.offlineContext(location, new Date(now + 600001)).weather.available).toBe(false);
    expect(sandbox.InfiniteLevelLocation.offlineContext({ ...location, weatherLatitude: 0, weatherLongitude: 0 }, new Date(now + 1000)).weather.available).toBe(false);
    expect(sandbox.InfiniteLevelLocation.offlineContext({ ...location, weatherEnabled: false }, new Date(now + 1000)).weather.source).toBe('disabled');
  });

  test('the daily card, location settings and unlimited level browser are wired to real entry points', () => {
    const html = readFileSync('index.html', 'utf8');
    const menus = readFileSync('script.js', 'utf8');
    expect(html).toContain('onclick="chooseMode(\'daily\')"');
    expect(html).toContain('id="procedural-level-grid"');
    expect(html).toContain('id="level-time-zone"');
    expect(html).toContain('onclick="saveLevelLocation()"');
    expect(html).toContain('onclick="useWeatherLocation()"');
    expect(html).toContain('id="level-time-effects"');
    expect(html).toContain('id="level-weather-effects"');
    expect(html.indexOf('js/procedural-levels.js')).toBeLessThan(html.indexOf('src="phaser3-game.js"'));
    expect(menus).toContain('callGame(\'startDaily\')');
    expect(menus).toContain('renderProceduralLevels()');
    expect(menus).toContain('Number.MAX_SAFE_INTEGER');
  });
});


describe('native player input keeps shared rules and economy untouched', () => {
  function playable() {
    const result = makeBrowserGame();
    const { game } = result;
    game.applyGeneratedDefinition(definition());
    game.isGameRunning = true;
    game.playerUI = {
      surface: { focus() {} }, shell: { querySelector: () => ({ open: false }) },
      refresh() {}, announce: (message: string) => { game.announcement = message; },
    };
    return result;
  }

  test('native first-play guidance is immediate and cannot overwrite a later hint', async () => {
    const { game, sandbox } = playable();
    game.tutorialShown = false;
    let timers = 0;
    sandbox.setTimeout = () => { timers++; return 1; };
    await game.startGame();
    expect(timers).toBe(0);
    expect(game.tutorialShown).toBe(true);
    game.showHint();
    expect(game.announcement).toContain('Free hint');
  });

  test('free hints preserve board, RNG, moves and score and point to a real legal swap', () => {
    const { game, sandbox } = playable();
    const before = JSON.stringify([game.board, game.levelRng.state, game.moves, game.score]);
    const hint = Array.from(game.showHint());
    expect(sandbox.InfiniteLevels.legalSwaps(game.board).some((move: any) => JSON.stringify(move.cells) === JSON.stringify(hint))).toBe(true);
    expect(JSON.stringify([game.board, game.levelRng.state, game.moves, game.score])).toBe(before);
    expect(game.announcement).toContain('No move or charge spent');
  });

  test.each(['isPaused', 'powerUpPending', 'levelStarting'])('%s blocks hints, swaps and selections', (flag) => {
    const { game } = playable();
    game[flag] = true;
    const before = JSON.stringify(game.board);
    expect(game.showHint()).toBeNull();
    game.selectGem(game.gemSprites[0][0]);
    game.trySwap(0, 0, 0, 1);
    expect(game.selectedGem).toBeNull();
    expect(JSON.stringify(game.board)).toBe(before);
  });

  test('a modal or visual-settle lock blocks board input', () => {
    const { game } = playable();
    game.playerUI.shell.querySelector = () => ({ open: true });
    expect(game.canInteractWithBoard()).toBe(false);
    game.playerUI.shell.querySelector = () => ({ open: false });
    game.inputLockedUntil = Date.now() + 1000;
    expect(game.canInteractWithBoard()).toBe(false);
  });

  test('only the starting finger may commit a gesture; new boards and cancellations invalidate it', () => {
    const { game } = playable();
    const swaps: any[] = [];
    game.trySwap = (...cells: any[]) => swaps.push(cells);
    const gem = game.gemSprites[2][2];
    game.beginGemGesture(gem, { id: 1, x: 100, y: 100 });
    game.endGemGesture({ id: 2, x: 140, y: 100 });
    expect(swaps).toHaveLength(0);
    expect(game.gestureStart.id).toBe(1);
    game.endGemGesture({ id: 1, x: 140, y: 100 });
    expect(swaps).toEqual([[2, 2, 2, 3]]);
    game.beginGemGesture(gem, { id: 1, x: 100, y: 100 });
    game.boardEpoch++;
    game.endGemGesture({ id: 1, x: 140, y: 100 });
    game.beginGemGesture(gem, { id: 1, x: 100, y: 100 });
    game.endGemGesture({ id: 1, x: 140, y: 100 }, true);
    expect(swaps).toHaveLength(1);
  });

  test('small drags remain taps; edge swipes do not wrap across the board', () => {
    const { game } = playable();
    const gem = game.gemSprites[0][0];
    game.beginGemGesture(gem, { id: 1, x: 100, y: 100 });
    game.endGemGesture({ id: 1, x: 107, y: 108 });
    expect(game.selectedGem).toBe(gem);
    game.setSelectedGem(null);
    game.beginGemGesture(gem, { id: 1, x: 100, y: 100 });
    game.endGemGesture({ id: 1, x: 60, y: 100 });
    expect(game.selectedGem).toBeNull();
  });

  test('keyboard H is free; Escape cancels selection without pausing; arrows announce shape', () => {
    const { game } = playable();
    game.disarmPowerUp = () => {};
    let prevented = 0;
    const key = (value: string) => ({ key: value, preventDefault() { prevented++; }, stopPropagation() {} });
    const moves = game.moves;
    game.handleBoardKey(key('ArrowRight'));
    expect(Array.from(game.keyboardCursor)).toEqual([0, 1]);
    expect(game.announcement).toContain('Enter selects');
    game.handleBoardKey(key('Enter'));
    expect(game.selectedGem).toBe(game.gemSprites[0][1]);
    game.handleBoardKey(key('Escape'));
    expect(game.selectedGem).toBeNull();
    expect(game.isPaused).toBe(false);
    game.handleBoardKey(key('h'));
    expect(game.moves).toBe(moves);
    expect(prevented).toBe(4);
  });

  function earnedFixture(types: string[]) {
    const { game } = makeBrowserGame();
    const palette = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    const def: any = { ...definition(), boardSize: 7, gemTypes: palette, refillState: 12345, targetScore: 1000000,
      board: Array.from({ length: 7 }, (_, r) => Array.from({ length: 7 }, (_, c) => palette[(r * 2 + c) % 6])),
      specials: Array.from({ length: 7 }, () => Array(7).fill(null)) };
    for (let i = 0; i < types.length; i++) def.specials[3][3 + i] = types[i];
    game.applyGeneratedDefinition(def); game.isGameRunning = true; game.settings.reduceAnimations = true;
    game.playerUI = { surface: { focus() {} }, shell: { querySelector: () => ({ open: false }) },
      refresh() {}, announce: (message: string) => { game.announcement = message; } };
    let requests = 0;
    game.spendPowerUp = () => { requests++; throw new Error('Earned specials must not spend inventory'); };
    return { game, def, requests: () => requests };
  }

  test('tap activates an earned special for exactly one move and no inventory request', () => {
    const { game, def, requests } = earnedFixture(['row']);
    const expected = simulateLevelMove(def, { board: game.board, specials: game.specials, refillState: game.levelRng.state }, [3, 3])!;
    const moves = game.moves;
    game.selectGem(game.gemSprites[3][3]);
    expect(game.moves).toBe(moves - 1); expect(requests()).toBe(0);
    expect(game.score).toBe(expected.score);
    expect(JSON.parse(JSON.stringify(game.specials))).toEqual(expected.specials);
    assertSprites(game);
  });

  test('keyboard Space selects specials for combinations; Enter activates them', () => {
    const { game, def, requests } = earnedFixture(['prism', 'burst']);
    const expected = simulateLevelMove(def, { board: game.board, specials: game.specials, refillState: game.levelRng.state }, [3, 3, 3, 4])!;
    const key = (name: string) => game.handleBoardKey({ key: name, preventDefault() {}, stopPropagation() {} });
    game.keyboardCursor = [3, 3];
    key('Space'); // Browser KeyboardEvent uses a single space, not the word Space.
    key(' ');
    expect(game.moves).toBe(def.moves); expect(game.selectedGem).toBe(game.gemSprites[3][3]);
    key('ArrowRight'); key(' ');
    expect(game.moves).toBe(def.moves - 1); expect(requests()).toBe(0);
    expect(game.score).toBe(expected.score); assertSprites(game);
    const solo = earnedFixture(['column']); solo.game.keyboardCursor = [3, 3];
    solo.game.handleBoardKey({ key: 'Enter', preventDefault() {}, stopPropagation() {} });
    expect(solo.game.moves).toBe(solo.def.moves - 1); expect(solo.requests()).toBe(0);
  });

  test('paused, pending, modal and animation locks also block earned activations', () => {
    for (const flag of ['isPaused', 'powerUpPending', 'levelStarting', 'inputLockedUntil']) {
      const { game, def, requests } = earnedFixture(['row']);
      game[flag] = flag === 'inputLockedUntil' ? Date.now() + 1000 : true;
      expect(game.activateEarnedSpecial(3, 3)).toBeNull();
      expect(game.moves).toBe(def.moves); expect(requests()).toBe(0);
    }
  });

  test('inventory blast chaining uses shared rules without spending an ordinary move', () => {
    const { game, def } = earnedFixture(['row']);
    const before = game.moves;
    const expected = globalThis.JSON.parse(JSON.stringify(def));
    game.clearAndCascade(new Set(['3,3']), 500);
    expect(game.moves).toBe(before); expect(game.score).toBeGreaterThanOrEqual(560);
    expect(JSON.parse(JSON.stringify(def))).toEqual(expected); assertSprites(game);
  });

  test('special hints preserve persistent special state and RNG as well as moves', () => {
    const { game } = earnedFixture(['prism', 'prism']);
    const before = JSON.stringify([game.board, game.specials, game.moves, game.levelRng.state]);
    const cells = Array.from(game.showHint());
    expect(cells).toEqual([3, 3, 3, 4]);
    expect(game.announcement).toContain('swipe');
    expect(JSON.stringify([game.board, game.specials, game.moves, game.levelRng.state])).toBe(before);
  });

  test('reduced motion changes presentation, never board, RNG or scores', () => {
    const run = (reduce: boolean) => {
      const { game } = playable();
      game.settings.reduceAnimations = reduce;
      const cells = game.showHint();
      game.trySwap(...cells);
      return JSON.stringify([game.board, game.levelRng.state, game.score, game.moves]);
    };
    expect(run(true)).toBe(run(false));
  });

  test('a new level cannot replace a board during a pending inventory spend', async () => {
    const { game } = playable();
    game.powerUpPending = true;
    const before = JSON.stringify(game.board);
    expect(await game.startProceduralLevel(2)).toBe(false);
    expect(JSON.stringify(game.board)).toBe(before);
  });

  test('a stale shop response cannot write into a newly opened overlay', async () => {
    const { game, sandbox } = playable();
    let resolve: any;
    sandbox.fetch = () => new Promise((done) => { resolve = done; });
    game.activeOverlay = {};
    game.shopCoinsText = { active: true };
    const writes: string[] = [];
    game.overlayText = (_x: number, _y: number, label: string) => writes.push(label);
    const request = game.loadShopPrices([{ productId: 'coins_small' }]);
    game.activeOverlay = {};
    resolve({ json: async () => ({ success: true, coinPacks: [{ productId: 'coins_small', priceCents: 99 }] }) });
    await request;
    expect(writes).toEqual([]);
  });

  test('a stale kingdom response cannot populate preferences or another kingdom view', async () => {
    const { game } = playable();
    game.getAuthToken = () => 'test';
    let resolve: any;
    game.fetchJson = () => new Promise((done) => { resolve = done; });
    game.activeOverlay = {};
    const writes: string[] = [];
    game.overlayText = (_x: number, _y: number, label: string) => writes.push(label);
    game.kingdomCoinsText = { setText: (label: string) => writes.push(label) };
    const request = game.renderKingdom();
    game.activeOverlay = {};
    resolve({ ok: true, data: { success: true, coins: 10, kingdom: { rooms: [] } } });
    await request;
    expect(writes).toEqual([]);
  });

  test('a guest sees the room without a network request and a signed-in choice refreshes its payoff', async () => {
    const { game } = playable();
    const views: any[] = []; const messages: string[] = []; const calls: any[] = [];
    game.playerUI.renderKingdomScene = (data: any, callbacks: any) => { views.push({ data, callbacks }); };
    game.setOverlayStatus = (message: string) => messages.push(message);
    game.activeOverlay = {};
    game.fetchJson = async (url: string, options: any) => {
      calls.push([url, options]);
      return url.endsWith('/choose')
        ? { ok: true, data: { success: true, result: { buy: true, costCoins: 140 } } }
        : { ok: true, data: { success: true, kingdom: { rooms: [] }, coins: 660, decor: { catalog: [] } } };
    };
    await game.renderKingdom();
    expect(views[0].data.guest).toBe(true);
    expect(calls).toHaveLength(0);
    game.getAuthToken = () => 'test';
    await game.chooseKingdomDecor('mosaic');
    expect(calls.map(([url]) => url)).toEqual(['/api/kingdom/decor/choose', '/api/kingdom']);
    expect(JSON.parse(calls[0][1].body)).toEqual({ roomId: 'throne', decorId: 'mosaic' });
    expect(views[1].callbacks.focusChoice).toBe('mosaic');
    expect(messages.at(-1)).toContain('140 coins spent');
    expect(game.kingdomPending).toBe(false);
  });

  test('room tabs reuse a snapshot and bind each repair and choice to its displayed room', async () => {
    const { game } = playable();
    const views: any[] = []; const calls: any[] = [];
    game.getAuthToken = () => 'test'; game.activeOverlay = {};
    game.playerUI.renderKingdomScene = (data: any, callbacks: any) => views.push({ data, callbacks });
    game.setOverlayStatus = () => {};
    game.fetchJson = async (url: string, options: any) => {
      calls.push([url, options]);
      if (url.endsWith('/choose')) return { ok: true, data: { success: true, result: { buy: true, costCoins: 140 } } };
      if (url.endsWith('/renovate')) return { ok: true, data: { success: true, result: { level: 1 } } };
      return { ok: true, data: { success: true, kingdom: { rooms: [] }, coins: 660, decor: { catalog: [] } } };
    };
    await game.renderKingdom();
    const hall = views.at(-1).callbacks;
    hall.selectRoom('library');
    expect(views.at(-1).callbacks.roomId).toBe('library');
    expect(views.at(-1).callbacks.focusRoom).toBe(true);
    expect(calls.map(([url]) => url)).toEqual(['/api/kingdom']); // no request on tab change
    await hall.choose('mosaic'); // stale button cannot write the hall while library is shown
    expect(calls).toHaveLength(1);
    await views.at(-1).callbacks.choose('mosaic');
    expect(JSON.parse(calls[1][1].body)).toEqual({ roomId: 'library', decorId: 'mosaic' });
    expect(views.at(-1).callbacks.focusChoice).toBe('mosaic');
    await views.at(-1).callbacks.renovate();
    expect(JSON.parse(calls[3][1].body)).toEqual({ roomId: 'library' });
    views.at(-1).callbacks.selectRoom('throne');
    expect(views.at(-1).callbacks.roomId).toBe('throne');
    expect(calls.map(([url]) => url)).toEqual([
      '/api/kingdom', '/api/kingdom/decor/choose', '/api/kingdom', '/api/kingdom/renovate', '/api/kingdom',
    ]);
  });

  test('another authored room can be selected and purchased without spending on the hall', async () => {
    const { game } = playable();
    const views: any[] = []; const calls: any[] = [];
    game.getAuthToken = () => 'test'; game.activeOverlay = {};
    game.playerUI.renderKingdomScene = (_data: any, callbacks: any) => views.push(callbacks);
    game.setOverlayStatus = () => {};
    game.fetchJson = async (url: string, options: any) => {
      calls.push([url, options]);
      return url.endsWith('/choose') ? { ok: true, data: { success: true, result: { buy: true, costCoins: 140 } } }
        : { ok: true, data: { success: true, kingdom: { rooms: [] }, coins: 860 } };
    };
    await game.renderKingdom();
    const hall = views.at(-1);
    hall.selectRoom('garden');
    await hall.choose('mosaic'); // stale hall action must not spend
    await views.at(-1).choose('mosaic');
    expect(JSON.parse(calls[1][1].body)).toEqual({ roomId: 'garden', decorId: 'mosaic' });
    expect(views.at(-1).roomId).toBe('garden');
    expect(views.at(-1).focusChoice).toBe('mosaic');
  });

  test('an older kingdom load cannot replace a newly selected room', async () => {
    const { game } = playable();
    const views: any[] = []; const pending: any[] = [];
    game.getAuthToken = () => 'test'; game.activeOverlay = {};
    game.playerUI.renderKingdomScene = (_data: any, callbacks: any) => views.push(callbacks);
    game.setOverlayStatus = () => {};
    game.fetchJson = () => new Promise((done) => { pending.push(done); });
    const first = game.renderKingdom();
    game.selectKingdomRoom('library'); // no snapshot yet; starts a newer read
    pending[1]({ ok: true, data: { success: true, kingdom: { rooms: [] }, coins: 1 } });
    await Promise.resolve();
    pending[0]({ ok: true, data: { success: true, kingdom: { rooms: [] }, coins: 2 } });
    await first;
    expect(views).toHaveLength(1);
    expect(views[0].roomId).toBe('library');
  });

  test('a choice in flight keeps its original room even if the player switches tabs', async () => {
    const { game } = playable();
    const views: any[] = []; const calls: any[] = []; let finish: any;
    game.getAuthToken = () => 'test'; game.activeOverlay = {};
    game.playerUI.renderKingdomScene = (_data: any, callbacks: any) => views.push(callbacks);
    game.setOverlayStatus = () => {};
    game.fetchJson = (url: string, options: any) => {
      calls.push([url, options]);
      if (url.endsWith('/choose')) return new Promise((done) => { finish = done; });
      return Promise.resolve({ ok: true, data: { success: true, kingdom: { rooms: [] }, coins: 600 } });
    };
    await game.renderKingdom();
    views.at(-1).selectRoom('library');
    const choice = views.at(-1).choose('tapestry');
    views.at(-1).selectRoom('throne');
    finish({ ok: true, data: { success: true, result: { buy: true, costCoins: 200 } } });
    await choice;
    expect(JSON.parse(calls[1][1].body)).toEqual({ roomId: 'library', decorId: 'tapestry' });
    expect(views.at(-1).roomId).toBe('throne');
    expect(views.at(-1).focusChoice).toBeNull();
    expect(game.kingdomPending).toBe(false);
  });

  test('closing a room while its one-tap choice is in flight cannot write into another screen', async () => {
    const { game } = playable();
    let finish: any; let writes = 0;
    game.getAuthToken = () => 'test';
    game.playerUI.renderKingdomScene = () => { writes++; };
    game.activeOverlay = {};
    game.setOverlayStatus = () => { writes++; };
    game.fetchJson = () => new Promise((done) => { finish = done; });
    const pending = game.chooseKingdomDecor('sconces');
    game.activeOverlay = {};
    finish({ ok: true, data: { success: true, result: { buy: true, costCoins: 180 } } });
    await pending;
    expect(writes).toBe(1); // Initial status only; never re-render the next overlay.
    expect(game.kingdomPending).toBe(false);
  });

  test('finishing an old decoration action cannot reopen a closed modal', async () => {
    const { game } = playable();
    let resolve: any;
    game.fetchJson = () => new Promise((done) => { resolve = done; });
    game.activeOverlay = {};
    game.setOverlayStatus = () => {};
    let opens = 0;
    game.openDecor = () => { opens++; };
    const request = game.decorAction('/fake', {}, 'Done');
    game.activeOverlay = null;
    resolve({ ok: true, data: { success: true } });
    await request;
    expect(opens).toBe(0);
    expect(game.decorPending).toBe(false);
  });
});


describe('temporary server throttling is not a player settings error', () => {
  test.each([408, 429, 503])('guest %s response uses certified offline play, never a paid attempt', async (status) => {
    const { game } = makeBrowserGame();
    game.fetchJson = async () => ({ ok: false, status, data: {} });
    expect(await game.selectLevel(1)).toBe(true);
    expect(game.generatedLevel.context.offline).toBe(true);
    expect(game.attemptId).toBeNull();
    expect(game.isGameRunning).toBe(true);
    assertSprites(game);
  });

  test('a signed-in throttled attempt stays refused with a useful message, never offline rewards', async () => {
    const { game } = makeBrowserGame();
    game.getAuthToken = () => 'test';
    game.fetchJson = async () => ({ ok: false, status: 429, data: {} });
    const energy = game.energy;
    expect(await game.selectLevel(1)).toBe(false);
    expect(game.lastError).toContain('server is busy');
    expect(game.energy).toBe(energy);
    expect(game.generatedLevel).toBeUndefined();
    expect(game.isGameRunning).toBe(false);
  });
});

describe('objective-aware Phaser v4', () => {
  function objectiveFixture(goals: any[] = [{ type: 'collect', gemType: 'red', target: 30 }]) {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    const board = Array.from({ length: 7 }, (_, r) => Array.from({ length: 7 }, (_, c) => colors[(r * 2 + c) % 6]));
    const def = { ...definition(1), generatorVersion: 4, boardSize: 7, board, gemTypes: colors, gemWeights: {}, refillState: 12345,
      specials: Array.from({ length: 7 }, () => Array(7).fill(null)), targetScore: 1000000, objectives: goals };
    board[3]![0] = 'blue'; board[3]![1] = 'red'; board[3]![2] = 'red'; board[3]![4] = 'red'; board[2]![3] = 'red';
    return def;
  }

  test.each([1, 2, 3, 4, 7, 8, 12, 21, 100001])('level %d reaches every procedurally composed goal in the actual game', (level) => {
    const { game } = makeBrowserGame();
    const def = generatedLevel({ level, mode: 'classic', location, rulesVersion: 4 }, now);
    game.applyGeneratedDefinition(def); game.isGameRunning = true;
    for (const cells of certifyLevel(def).witness) {
      if (!game.isGameRunning) break;
      const expected = simulateLevelMove(def, { board: game.board, specials: game.specials, refillState: game.levelRng.state,
        objectiveProgress: game.objectiveProgress }, cells)!;
      if (cells.length === 2) game.activateEarnedSpecial(...cells); else game.trySwap(...cells);
      expect(JSON.parse(JSON.stringify(game.objectiveProgress))).toEqual(expected.objectiveProgress);
      expect(game.levelRng.state).toBe(expected.refillState); assertSprites(game);
    }
    expect(game.hasWonLevel()).toBe(true); expect(game.endCalls).toBe(1);
    expect(game.starsFor(game.score)).toBeGreaterThanOrEqual(1);
  });

  test('a collection-only goal ends below the rating score and replay resets counters', () => {
    const { game } = makeBrowserGame(); const def = objectiveFixture([{ type: 'collect', gemType: 'red', target: 3 }]);
    game.applyGeneratedDefinition(def); game.isGameRunning = true;
    game.trySwap(2, 3, 3, 3);
    expect(game.objectiveProgress.collected.red).toBeGreaterThanOrEqual(3);
    expect(game.score).toBeLessThan(def.targetScore);
    expect(game.endCalls).toBe(1); expect(game.starsFor(game.score)).toBe(1);
    game.applyGeneratedDefinition(def);
    expect(Object.values(game.objectiveProgress.collected)).toEqual(Array(6).fill(0));
    expect(game.score).toBe(0); expect(game.hasWonLevel()).toBe(false); assertSprites(game);
  });

  test('a high score cannot bypass either a mixed or a two-color collection goal', () => {
    for (const goals of [[{ type: 'score', target: 100 }, { type: 'collect', gemType: 'red', target: 30 }],
      [{ type: 'collect', gemType: 'red', target: 30 }, { type: 'collect', gemType: 'blue', target: 20 }]]) {
      const { game } = makeBrowserGame(); game.applyGeneratedDefinition(objectiveFixture(goals)); game.isGameRunning = true;
      game.score = 1000000; game.checkEndConditions(); expect(game.isGameRunning).toBe(true); expect(game.starsFor(game.score)).toBe(0);
      game.objectiveProgress.collected.red = 30; game.checkEndConditions();
      if (goals[0].type === 'collect') {
        expect(game.isGameRunning).toBe(true); game.objectiveProgress.collected.blue = 20; game.checkEndConditions();
      }
      expect(game.endCalls).toBe(1); expect(game.hasWonLevel()).toBe(true);
    }
  });

  test('running out of moves without all collections is a zero-star loss, regardless of score', () => {
    const { game } = makeBrowserGame(); game.applyGeneratedDefinition(objectiveFixture()); game.isGameRunning = true;
    game.score = 1000000; game.moves = 0; game.checkEndConditions();
    expect(game.endCalls).toBe(1); expect(game.hasWonLevel()).toBe(false); expect(game.starsFor(game.score)).toBe(0);
  });

  test('inventory transitions and later earned moves accumulate the same shared progress', () => {
    const { game, sandbox } = makeBrowserGame(); const def = objectiveFixture(); game.applyGeneratedDefinition(def); game.isGameRunning = true;
    const keys = new Set(['0,0']);
    const expected = simulateObjectiveClear(def, { board: game.board, specials: game.specials, refillState: game.levelRng.state,
      objectiveProgress: game.objectiveProgress }, keys, 500)!;
    const moves = game.moves; game.clearAndCascade(keys, 500);
    expect(JSON.parse(JSON.stringify(game.objectiveProgress))).toEqual(expected.objectiveProgress); expect(game.moves).toBe(moves);
    const action = sandbox.InfiniteLevels.levelActions(def, game.board, game.specials, game.objectiveProgress, game.score)[0].cells;
    const next = simulateLevelMove(def, { board: game.board, specials: game.specials, refillState: game.levelRng.state,
      objectiveProgress: game.objectiveProgress }, action)!;
    if (action.length === 2) game.activateEarnedSpecial(...action); else game.trySwap(...action);
    expect(JSON.parse(JSON.stringify(game.objectiveProgress))).toEqual(next.objectiveProgress); assertSprites(game);
  });

  test('goal-aware free hints do not change the board, score, move count, RNG or goal counters', () => {
    const { game } = makeBrowserGame(); const def = objectiveFixture();
    // A stable board with a red Prism gives an immediate, visible red-clearing choice.
    def.board = Array.from({ length: 7 }, (_, r) => Array.from({ length: 7 }, (_, c) => def.gemTypes[(r * 2 + c) % 6]));
    def.board[3]![3] = 'red'; def.specials[3]![3] = 'prism';
    game.applyGeneratedDefinition(def); game.isGameRunning = true;
    const before = JSON.stringify({ board: game.board, specials: game.specials, score: game.score, moves: game.moves,
      rng: game.levelRng.state, progress: game.objectiveProgress });
    expect(game.showHint()).toEqual([3, 3]);
    expect(JSON.stringify({ board: game.board, specials: game.specials, score: game.score, moves: game.moves,
      rng: game.levelRng.state, progress: game.objectiveProgress })).toBe(before);
    expect(game.hintsUsed).toBe(1); // Assistance is recorded, but the hint costs no move or charge.
  });

  test('paid v4 completion sends counters, not client-authored goals, targets or stars', async () => {
    const { game, sandbox } = makeBrowserGame(); game.applyGeneratedDefinition(objectiveFixture());
    game.attemptId = 'v4_paid'; game.attemptLevel = 1; game.getAuthToken = () => 'token'; game.objectiveProgress.collected.red = 30; game.score = 30;
    let sent: any;
    sandbox.fetch = async (_url: string, options: any) => {
      sent = JSON.parse(options.body); return { ok: true, json: async () => ({ success: true, result: { stars: 1, balances: { stars: 1 } } }) };
    };
    await game.submitLevelWin(1); expect(game.stars).toBe(1);
    expect(sent).toEqual({ level: 1, score: 30, attemptId: 'v4_paid', objectiveProgress: game.objectiveProgress });
    expect(game.attemptId).toBeNull();
  });

  test('legacy restart displays the target pinned by the paid spend, not a later client override', async () => {
    const { game, sandbox } = makeBrowserGame();
    game.getAuthToken = () => 'token'; game.generatedLevel = null; game.level = 1;
    game.scene.children = { list: [] }; game.setSelectedGem = () => {};
    game.reshuffleBoard = () => {}; game.startGame = async () => {};
    sandbox.fetch = async () => ({ ok: true, json: async () => ({ success: true,
      result: { attemptId: 'legacy', level: 1, energy: 99, legacyTarget: 1350 } }) });
    expect(await game.claimAttempt(1)).toBe(true);
    await game.restartGame(true);
    expect(game.targetScore).toBe(1350);
  });

  test('signed-in app open checks voluntary return study at most once per UTC day without auto-enrolling', async () => {
    const { game } = makeBrowserGame();
    let signedIn = true; game.getAuthToken = () => signedIn ? 'session-token' : null;
    game.updateUI = () => {};
    const calls: string[] = [];
    game.fetchJson = async (url: string) => {
      calls.push(url);
      if (url.endsWith('/data')) return { ok: true, data: { success: true, data: {
        currencies: { energy: { amount: 99, maxAmount: 100 }, stars: { amount: 1 } } } } };
      return { ok: true, data: { success: true, consented: false, counted: false } };
    };
    await game.syncAccountFromServer();
    await game.syncAccountFromServer();
    expect(calls.filter((url) => url.endsWith('/visit'))).toHaveLength(1);
    expect(calls.every((url) => !url.endsWith('/opt-in'))).toBe(true);
    signedIn = false; await game.syncAccountFromServer();
    expect(game.retentionVisitStamp).toBeNull();
  });

  test('guest research entry never makes a network call or collects visit data', async () => {
    const { game } = makeBrowserGame(); game.getAuthToken = () => null;
    game.openOverlay = () => { game.activeOverlay = {}; return game.activeOverlay; };
    game.overlayButton = () => {};
    game.overlayText = () => {};
    game.fetchJson = () => { throw new Error('guest must not call study'); };
    await expect(game.showRetentionResearch()).resolves.toBeUndefined();
  });

  test('research controls require an explicit choice and confirmation before deletion', async () => {
    const { game } = makeBrowserGame(); game.getAuthToken = () => 'session-token';
    game.isPaused = true;
    const buttons: any[] = []; const calls: string[] = [];
    let consented = false;
    game.openOverlay = () => { game.activeOverlay = {}; buttons.length = 0; return game.activeOverlay; };
    game.overlayButton = (_x: number, _y: number, _w: number, _h: number, _color: number, label: string, onClick: Function) => {
      buttons.push({ label, onClick });
    };
    game.overlayText = () => {};
    game.setOverlayStatus = () => {};
    game.fetchJson = async (url: string, options: any = {}) => {
      calls.push(`${options.method || 'GET'} ${url}`);
      if (url.endsWith('/opt-in')) consented = true;
      if (options.method === 'DELETE') consented = false;
      return { ok: true, data: { success: true, consented } };
    };
    await game.showRetentionResearch();
    expect(calls).toEqual(['GET /api/retention-study/me']);
    expect(buttons.some((button) => button.label === 'I agree to join')).toBe(true);
    await buttons.find((button) => button.label === 'I agree to join').onClick();
    expect(calls).toEqual(['GET /api/retention-study/me', 'POST /api/retention-study/opt-in', 'GET /api/retention-study/me']);
    buttons.find((button) => button.label === 'Stop and delete my study days').onClick();
    expect(calls).toHaveLength(3);
    await buttons.find((button) => button.label === 'Delete my study days').onClick();
    expect(calls).toContain('DELETE /api/retention-study/me');
    expect(buttons.some((button) => button.label === 'I agree to join')).toBe(true);
  });

  test('an actual web loss reports a bounded diagnostic close once, never a completion payout', async () => {
    const { game, sandbox } = makeBrowserGame(); const def = objectiveFixture();
    game.applyGeneratedDefinition(def); game.isGameRunning = true; game.runStartedAt = Date.now();
    game.attemptId = 'paid_loss'; game.getAuthToken = () => 'token'; game.moves = def.moves - 5;
    game.hintsUsed = 2; delete game.endGame; game.showEndGameScreen = () => {};
    const requests: any[] = [];
    sandbox.fetch = async (url: string, options: any) => {
      requests.push({ url, body: JSON.parse(options.body) });
      return { ok: true, json: async () => ({ success: true, result: { closed: true } }) };
    };
    game.endGame(); await game.rewardSubmission;
    expect(requests).toEqual([{ url: '/api/account-economy/attempt/close',
      body: { attemptId: 'paid_loss', outcome: 'lost', movesUsed: 5, hintsUsed: 2 } }]);
    expect(game.attemptId).toBeNull();
  });

  test('endless stays on the collection stage until all goals finish, then pins v4 and resets only stage counters', () => {
    const { game } = makeBrowserGame(); const def = { ...objectiveFixture(), mode: 'endless', level: 2 };
    game.applyGeneratedDefinition(def); game.isGameRunning = true; game.attemptId = 'one_run'; game.endlessTotalScore = 500;
    game.score = 1000000; game.checkEndConditions(); expect(game.level).toBe(2);
    game.objectiveProgress.collected.red = 30; game.checkEndConditions();
    expect(game.level).toBe(3); expect(game.generatedLevel.generatorVersion).toBe(4);
    expect(game.endlessTotalScore).toBe(1000500); expect(game.score).toBe(0);
    expect(Object.values(game.objectiveProgress.collected).every((count) => count === 0)).toBe(true);
    expect(game.attemptId).toBe('one_run'); expect(game.isGameRunning).toBe(true); assertSprites(game);
  });
});

describe('optional sound is presentation only', () => {
  function soundGame(on = true) {
    const result = makeBrowserGame(); const { game } = result; const cues: string[] = [];
    delete game.playSound;
    Object.assign(game.settings, { sfx: on, soundChoiceVersion: 1, soundVolume: 0.55 });
    let interruptions = 0; let destruction = 0;
    game.soundEffects = { play: (cue: string) => { cues.push(cue); return true; }, configure() {}, unlock: async () => true,
      status: () => ({ supported: true, enabled: game.settings.sfx, volume: game.settings.soundVolume }), stop() {},
      interrupt: () => interruptions++, destroy: () => destruction++ };
    return { ...result, cues, interruptions: () => interruptions, destruction: () => destruction };
  }
  const model = (game: any) => JSON.stringify({ board: game.board, specials: game.specials, progress: game.objectiveProgress,
    score: game.score, moves: game.moves, refillState: game.levelRng.state });

  test('repeated legacy settings loads cannot turn placeholder sfx:true into opt-in', async () => {
    const { game, saved } = makeBrowserGame();
    saved.set('phaser3_game_data', JSON.stringify({ settings: { sfx: true, highContrast: true } }));
    await game.loadUserData(); await game.loadUserData();
    expect(game.settings.sfx).toBe(false); expect(game.settings.highContrast).toBe(true); expect(game.settings.soundChoiceVersion).toBe(1);
    saved.set('phaser3_game_data', JSON.stringify({ settings: { sfx: true, soundChoiceVersion: 1, soundVolume: 0.25 } }));
    await game.loadUserData(); expect(game.settings.sfx).toBe(true); expect(game.settings.soundVolume).toBe(0.25);
  });

  test.each([2, 4, 7, 100001])('sound on/off replays identical goal-aware level %d including every RNG refill', (level) => {
    const definition = generatedLevel({ level, mode: 'classic', location, rulesVersion: 4 }, now);
    const snapshots: string[][] = [];
    for (const enabled of [false, true]) {
      const { game, cues } = soundGame(enabled); game.applyGeneratedDefinition(definition); game.isGameRunning = true;
      const steps = [];
      for (const cells of certifyLevel(definition).witness) {
        if (!game.isGameRunning) break;
        if (cells.length === 2) game.activateEarnedSpecial(...cells); else game.trySwap(...cells);
        steps.push(model(game)); assertSprites(game);
      }
      expect(game.hasWonLevel()).toBe(true); expect(cues.length > 0).toBe(enabled); snapshots.push(steps);
    }
    expect(snapshots[0]).toEqual(snapshots[1]);
  });

  test('mute, volume and keyboard M change only local preferences, even on a paused/locked board', async () => {
    const { game, saved, cues } = soundGame(); game.applyGeneratedDefinition(generatedLevel({ level: 7, location, rulesVersion: 4 }, now));
    game.isGameRunning = true; game.isPaused = true; game.powerUpPending = true;
    const before = model(game); game.fetchJson = () => { throw new Error('audio must not access economy'); };
    const key = (repeat = false) => ({ key: 'm', repeat, isTrusted: true, preventDefault() {}, stopPropagation() {} });
    game.handleBoardKey(key()); expect(game.settings.sfx).toBe(false);
    game.handleBoardKey(key(true)); expect(game.settings.sfx).toBe(false);
    game.handleBoardKey(key()); expect(game.settings.sfx).toBe(true);
    game.setSoundVolume(0.25, key()); await game.previewSound(key());
    expect(game.settings.soundVolume).toBe(0.25); expect(model(game)).toBe(before); expect(game.isPaused).toBe(true);
    expect(JSON.parse(saved.get('phaser3_game_data')!).settings).toMatchObject({ sfx: true, soundChoiceVersion: 1, soundVolume: 0.25 });
    expect(cues).toContain('test');
  });

  test('only ordinary winning moves are submitted for competitive replay; inventory effects opt out', async () => {
    const { game } = soundGame();
    const def = generatedLevel({ level: 4, location, rulesVersion: 5 }, now);
    game.applyGeneratedDefinition(def); game.isGameRunning = true;
    game.checkEndConditions = () => {};
    const cells = certifyLevel(def).witness[0]!;
    if (cells.length === 2) game.activateEarnedSpecial(...cells); else game.trySwap(...cells);
    expect(JSON.parse(JSON.stringify(game.attemptMoves))).toEqual([cells]);
    const bodies: any[] = [];
    game.getAuthToken = () => 'token'; game.attemptId = 'pinned'; game.attemptLevel = 4;
    game.fetchJson = async (_url: string, options: any) => {
      bodies.push(JSON.parse(options.body)); return { ok: false, data: { error: 'test' } };
    };
    await game.submitLevelWin(1);
    expect(bodies[0].moves).toEqual([cells]);
    game.attemptId = 'second'; game.activateBomb();
    expect(game.replayEligible).toBe(false);
    await game.submitLevelWin(1);
    expect(bodies[1].moves).toBeUndefined();
  });

  test('all six server-confirmed inventory effects record receipt-bound actions matching shared v5 terrain transitions', async () => {
    for (const type of REPLAY_POWERUPS) {
      const { game } = soundGame();
      const def = generatedLevel({ level: 4, location, rulesVersion: 5 }, now);
      game.applyGeneratedDefinition(def); game.isGameRunning = true; game.attemptId = 'paid-attempt';
      game.getAuthToken = () => 'token'; game.checkEndConditions = () => {};
      game.showPowerUpAnimation = () => {};
      game.consumePowerUpOnServer = async () => ({ ok: true, receiptId: `receipt-${type}` });
      const slot = { btn: sprite().setData('count', 3), text: sprite() };
      if (type === 'bomb' || type === 'rainbow' || type === 'lightning') {
        game[`${type}Btn`] = slot.btn; game[`${type}Text`] = slot.text;
        game.usePowerUp(type);
      } else {
        game.powerButtons = { [type]: slot };
        game.toggleArmedPowerUp(type);
        game.fireTargetedPowerUp(game.gemSprites[0][0]);
      }
      await new Promise((resolve) => setImmediate(resolve));
      const [action] = JSON.parse(JSON.stringify(game.attemptMoves));
      expect(action).toMatchObject({ type, receiptId: `receipt-${type}` });
      expect(game.replayEligible).toBe(true);
      expect(slot.btn.getData('count')).toBe(2);
      const state: any = { board: def.board, specials: def.specials, shields: def.shields,
        refillState: def.refillState, objectiveProgress: initialObjectiveProgress(def) };
      const effect = inventoryReplayEffect(def, state, action)!;
      const result = simulateObjectiveClear(def, state, effect.keys, effect.points)!;
      expect(game.score).toBe(result.score);
      expect(JSON.parse(JSON.stringify(game.board))).toEqual(result.board);
      expect(JSON.parse(JSON.stringify(game.shields))).toEqual(result.shields);
      expect(JSON.parse(JSON.stringify(game.objectiveProgress))).toEqual(result.objectiveProgress);
      expect(game.levelRng.state).toBe(result.refillState);
      expect(game.moves).toBe(def.moves);
    }
  });

  test('a lost receipt response retries the same use id and applies the effect once', async () => {
    const { game } = makeBrowserGame();
    game.applyGeneratedDefinition(generatedLevel({ level: 4, location, rulesVersion: 5 }, now));
    game.isGameRunning = true; game.attemptId = 'pinned'; game.getAuthToken = () => 'token';
    game.checkEndConditions = () => {}; game.showPowerUpAnimation = () => {};
    game.bombBtn = sprite().setData('count', 1); game.bombText = sprite();
    const calls: any[] = [];
    game.consumePowerUpOnServer = async (type: string, token: string, useId: string, attemptId: string) => {
      calls.push({ type, token, useId, attemptId });
      if (calls.length === 1) throw new Error('response lost after spend');
      return { ok: true, receiptId: 'recovered-receipt' };
    };
    game.usePowerUp('bomb');
    await new Promise((resolve) => setImmediate(resolve));
    expect(calls).toHaveLength(2);
    expect(calls[0]).toEqual(calls[1]);
    expect(calls[0]).toMatchObject({ type: 'bomb', token: 'token', attemptId: 'pinned', useId: expect.any(String) });
    expect(calls[0].useId.length).toBeGreaterThanOrEqual(8);
    expect(game.bombBtn.getData('count')).toBe(0);
    expect(game.attemptMoves).toHaveLength(1);
    expect(game.attemptMoves[0].receiptId).toBe('recovered-receipt');
    expect(game.replayEligible).toBe(true);
  });

  test('a late receipt cannot apply an old booster to a replacement board', async () => {
    const { game } = makeBrowserGame();
    const def = generatedLevel({ level: 4, location, rulesVersion: 5 }, now);
    game.applyGeneratedDefinition(def); game.isGameRunning = true; game.attemptId = 'old';
    game.getAuthToken = () => 'token'; game.bombBtn = sprite().setData('count', 1); game.bombText = sprite();
    let confirm = (value: any) => { void value; };
    game.consumePowerUpOnServer = () => new Promise((resolve) => { confirm = resolve; });
    game.usePowerUp('bomb');
    const next = generatedLevel({ level: 5, location, rulesVersion: 5 }, now);
    game.applyGeneratedDefinition(next); game.attemptId = 'new'; game.isGameRunning = true;
    confirm({ ok: true, receiptId: 'old-receipt' });
    await new Promise((resolve) => setImmediate(resolve));
    expect(JSON.parse(JSON.stringify(game.board))).toEqual(next.board);
    expect(game.score).toBe(0); expect(game.attemptMoves).toHaveLength(0);
    expect(game.bombBtn.getData('count')).toBe(1);
    expect(game.powerUpPending).toBe(false);
  });

  test('an uncertain booster response keeps rewards possible but disables ranked replay', async () => {
    const { game } = makeBrowserGame();
    game.applyGeneratedDefinition(generatedLevel({ level: 4, location, rulesVersion: 5 }, now));
    game.isGameRunning = true; game.attemptId = 'pinned'; game.getAuthToken = () => 'token';
    game.bombBtn = sprite().setData('count', 1); game.bombText = sprite();
    const calls: string[] = [];
    game.consumePowerUpOnServer = async (_type: string, _token: string, useId: string) => {
      calls.push(useId); throw new Error('lost response');
    };
    game.usePowerUp('bomb');
    await new Promise((resolve) => setImmediate(resolve));
    expect(calls).toHaveLength(2); expect(calls[0]).toBe(calls[1]);
    expect(game.replayEligible).toBe(false);
    expect(game.bombBtn.getData('count')).toBe(1);
    expect(game.attemptMoves).toHaveLength(0);
  });

  test('the player is told that a confirmed booster win is not competitive', () => {
    const { game } = makeBrowserGame();
    const messages: string[] = [];
    game.playerUI = { announce: (message: string) => messages.push(message) };
    game.powerReceipt = { receiptId: 'bound', type: 'bomb' };
    game.showPowerUpAnimation('bomb');
    expect(messages[0]).toContain('do not rank in competitions');
  });

  test('the signed-in spend sends the pinned attempt and receives only a server-minted receipt', async () => {
    const { game, sandbox } = makeBrowserGame();
    game.applyGeneratedDefinition(generatedLevel({ level: 4, location, rulesVersion: 5 }, now));
    game.attemptId = 'paid-attempt';
    let payload: any;
    sandbox.fetch = async (_url: string, options: any) => {
      payload = JSON.parse(options.body);
      return { ok: true, json: async () => ({ success: true, result: { receiptId: 'receipt' } }) };
    };
    expect(await game.consumePowerUpOnServer('bomb', 'token')).toEqual({ ok: true, receiptId: 'receipt' });
    expect(payload).toEqual({ powerupId: 'bomb', quantity: 1, attemptId: 'paid-attempt' });
    await game.consumePowerUpOnServer('bomb', 'token', 'stable-use-001', 'paid-attempt');
    expect(payload).toEqual({ powerupId: 'bomb', quantity: 1, attemptId: 'paid-attempt', useId: 'stable-use-001' });
    sandbox.fetch = async () => ({ ok: false, status: 503 });
    await expect(game.consumePowerUpOnServer('bomb', 'token', 'stable-use-001', 'paid-attempt'))
      .rejects.toThrow('powerup_response_uncertain');
    sandbox.fetch = async () => ({ ok: false, status: 400 });
    expect(await game.consumePowerUpOnServer('bomb', 'token', 'stable-use-001', 'paid-attempt')).toEqual({ ok: false });
  });

  test('unsupported audio cannot gate valid swaps or request a reward or inventory spend', () => {
    const { game } = makeBrowserGame(); delete game.playSound;
    const definition = generatedLevel({ level: 2, location, rulesVersion: 4 }, now); game.applyGeneratedDefinition(definition); game.isGameRunning = true;
    game.fetchJson = () => { throw new Error('unexpected economy request'); };
    expect(game.setSoundEffects(true, { isTrusted: true })).toBe(false);
    const cells = certifyLevel(definition).witness[0]!;
    const expected = simulateLevelMove(definition, { board: game.board, specials: game.specials, refillState: game.levelRng.state,
      objectiveProgress: game.objectiveProgress }, cells)!;
    if (cells.length === 2) game.activateEarnedSpecial(...cells); else game.trySwap(...cells);
    expect(JSON.parse(JSON.stringify(game.board))).toEqual(expected.board); expect(game.score).toBe(expected.score);
  });

  test('free hints and invalid-swap sounds never spend a move, advance RNG or change counters', () => {
    const { game, cues, sandbox } = soundGame(); const definition = generatedLevel({ level: 7, location, rulesVersion: 4 }, now);
    game.applyGeneratedDefinition(definition); game.isGameRunning = true; const before = model(game);
    game.showHint(); expect(cues).toContain('hint'); expect(model(game)).toBe(before);
    const legal = new Set(sandbox.InfiniteLevels.legalSwaps(game.board).map((move: any) => JSON.stringify(move.cells)));
    let invalid: any;
    for (let r = 0; r < game.boardSize && !invalid; r++) for (let c = 0; c < game.boardSize - 1 && !invalid; c++)
      if (!legal.has(JSON.stringify([r, c, r, c + 1]))) invalid = [r, c, r, c + 1];
    game.trySwap(...invalid); expect(cues).toContain('invalid'); expect(model(game)).toBe(before);
  });

  test('a failed audio backend cannot interrupt shared transitions', () => {
    const { game } = soundGame(); game.soundEffects.play = () => { throw new Error('device audio'); };
    const definition = generatedLevel({ level: 4, location, rulesVersion: 4 }, now); game.applyGeneratedDefinition(definition); game.isGameRunning = true;
    const cells = certifyLevel(definition).witness[0]!;
    const expected = simulateLevelMove(definition, { board: game.board, specials: game.specials, refillState: game.levelRng.state,
      objectiveProgress: game.objectiveProgress }, cells)!;
    expect(() => { if (cells.length === 2) game.activateEarnedSpecial(...cells); else game.trySwap(...cells); }).not.toThrow();
    expect(JSON.parse(JSON.stringify(game.board))).toEqual(expected.board); expect(game.score).toBe(expected.score); assertSprites(game);
  });

  test('result sound uses all-goal success, not score alone or reward-payment success', () => {
    for (const completed of [false, true]) {
      const { game, cues } = soundGame(); delete game.endGame;
      const definition = generatedLevel({ level: 2, location, rulesVersion: 4 }, now);
      game.applyGeneratedDefinition(definition); game.isGameRunning = true;
      game.score = completed ? 30 : 1000000;
      if (completed) for (const goal of definition.objectives) game.objectiveProgress.collected[goal.gemType!] = goal.target;
      game.reportLevelResult = () => {}; game.submitLevelWin = async () => {}; game.showEndGameScreen = () => {};
      game.endGame(); expect(cues.at(-1)).toBe(completed ? 'win' : 'loss');
    }
  });

  test('inventory effects keep one semantic cue per settled clear and do not spend an ordinary move', () => {
    for (const [activate, cue] of [['activateBomb', 'burst'], ['activateRainbow', 'prism'], ['activateLightning', 'beam']]) {
      const { game, cues } = soundGame();
      const definition = generatedLevel({ level: 1, location, rulesVersion: 4 }, now);
      definition.objectives = [{ type: 'score', target: 1000000 }]; definition.targetScore = 1000000;
      game.applyGeneratedDefinition(definition); game.isGameRunning = true;
      const moves = game.moves; game[activate]();
      expect(cues).toEqual([cue]); expect(game.moves).toBe(moves); assertSprites(game);
    }
  });

  test('pause and teardown release sound without touching the model', () => {
    const { game, interruptions, destruction } = soundGame();
    game.applyGeneratedDefinition(generatedLevel({ level: 2, location, rulesVersion: 4 }, now)); game.isGameRunning = true;
    const before = model(game); game.pauseGame(); expect(interruptions()).toBe(1); expect(model(game)).toBe(before);
    game.destroy(); expect(destruction()).toBe(1);
  });
});

describe('named semantic controls preserve the real Phaser rules', () => {
  test.each([[2, 9], [3, 18], [4, 2], [4, 4], [4, 7], [4, 100001]])('v%s level %s witness can be played only through named cell actions', (rulesVersion, level) => {
    const { game, sandbox } = makeBrowserGame();
    const def = generatedLevel({ level, location, rulesVersion }, now);
    game.applyGeneratedDefinition(def); game.isGameRunning = true; game.attemptId = 'same-paid-attempt';
    const proof = certifyLevel(def); const api = sandbox.InfiniteAssistiveBoard;
    for (const cells of proof.witness) {
      if (!game.isGameRunning) break;
      const state = { board: game.board, specials: game.specials, refillState: game.levelRng.state, objectiveProgress: game.objectiveProgress };
      const expected = simulateLevelMove(def, state, cells)!; const score = game.score; const moves = game.moves;
      const beforeReading = JSON.stringify(state); api.describeCell(game, cells[0], cells[1]);
      expect(JSON.stringify(state)).toBe(beforeReading);
      if (cells.length === 2) expect(api.interact(game, ...cells, true)).toBe(true);
      else {
        expect(api.interact(game, cells[0], cells[1])).toBe(true); expect(game.moves).toBe(moves);
        expect(api.describeCell(game, cells[0], cells[1]).selected).toBe(true);
        expect(api.interact(game, cells[2], cells[3])).toBe(true);
      }
      expect(JSON.parse(JSON.stringify(game.board))).toEqual(expected.board);
      expect(JSON.parse(JSON.stringify(game.specials))).toEqual(expected.specials ?? null);
      if (expected.objectiveProgress) expect(JSON.parse(JSON.stringify(game.objectiveProgress))).toEqual(expected.objectiveProgress);
      expect(game.score - score).toBe(expected.score); expect(game.moves).toBe(moves - 1); expect(game.levelRng.state).toBe(expected.refillState);
      expect(game.attemptId).toBe('same-paid-attempt'); assertSprites(game);
    }
    expect(game.endCalls).toBe(1); expect(game.moves).toBeGreaterThanOrEqual(0);
  });

  test('named reading and navigation, free hints, invalid swaps and disabled actions do not spend or refill', () => {
    const { game, sandbox } = makeBrowserGame(); game.applyGeneratedDefinition(definition(2)); game.isGameRunning = true;
    const api = sandbox.InfiniteAssistiveBoard;
    const before = JSON.stringify({ board: game.board, specials: game.specials, rng: game.levelRng.state, score: game.score, moves: game.moves });
    const hint = game.showHint(); expect(api.describeCell(game, hint[0], hint[1]).hinted).toMatch(/^Hint/);
    for (let row = 0; row < game.boardSize; row++) for (let col = 0; col < game.boardSize; col++) api.describeCell(game, row, col);
    game.keyboardCursor = api.navigationCell(0, 0, 'End', game.boardSize, true);
    for (const flag of ['isPaused', 'powerUpPending', 'levelStarting']) {
      game[flag] = true; expect(api.interact(game, hint[0], hint[1])).toBe(false); game[flag] = false;
    }
    game.inputLockedUntil = Date.now() + 1000; expect(api.interact(game, hint[0], hint[1])).toBe(false); game.inputLockedUntil = 0;
    const invalid = [];
    for (let row = 0; row < game.boardSize && !invalid.length; row++) for (let col = 0; col < game.boardSize - 1; col++) {
      if (!sandbox.InfiniteLevels.simulateLevelMove(game.generatedLevel, { board: game.board, specials: game.specials, refillState: game.levelRng.state }, [row, col, row, col + 1])) { invalid.push(row, col, row, col + 1); break; }
    }
    api.interact(game, invalid[0], invalid[1]); api.interact(game, invalid[2], invalid[3]);
    expect(JSON.stringify({ board: game.board, specials: game.specials, rng: game.levelRng.state, score: game.score, moves: game.moves })).toBe(before);
  });

  test('named inventory targeting uses server-confirmed spending, never the special-activation shortcut', async () => {
    const { game, sandbox } = makeBrowserGame(); game.applyGeneratedDefinition(definition(2)); game.isGameRunning = true;
    const btn = sprite().setData('type', 'target').setData('count', 1);
    game.powerButtons = { target: { btn, text: sprite() } }; game.getAuthToken = () => 'token';
    let acknowledge = (value: boolean) => { void value; }; const calls: string[] = [];
    game.consumePowerUpOnServer = (type: string) => { calls.push(type); return new Promise((resolve) => { acknowledge = resolve; }); };
    const before = JSON.stringify(game.board); const moves = game.moves;
    game.toggleArmedPowerUp('target');
    expect(sandbox.InfiniteAssistiveBoard.interact(game, 0, 0, true)).toBe(false); expect(calls).toEqual([]);
    expect(sandbox.InfiniteAssistiveBoard.interact(game, 0, 0)).toBe(true); expect(calls).toEqual(['target']);
    expect(JSON.stringify(game.board)).toBe(before); expect(game.powerUpPending).toBe(true);
    expect(sandbox.InfiniteAssistiveBoard.interact(game, 0, 1)).toBe(false); expect(calls).toHaveLength(1);
    acknowledge(true); await new Promise((resolve) => setImmediate(resolve));
    expect(game.powerUpPending).toBe(false); expect(btn.getData('count')).toBe(0); expect(game.moves).toBe(moves); assertSprites(game);
  });

  test('selection and hint changes notify only the assistive presentation; teardown releases it', () => {
    const { game } = makeBrowserGame(); game.applyGeneratedDefinition(definition(2)); game.isGameRunning = true;
    let refreshes = 0; let destroys = 0;
    game.playerUI = { assistiveBoard: { sync: () => refreshes++, destroy: () => destroys++ }, shell: { querySelector: () => ({ open: false }), remove() {} },
      refresh() {}, closeOverlay() {}, announce() {} };
    game.setSelectedGem(game.gemSprites[0][0]); game.setSelectedGem(null); game.showHint();
    expect(refreshes).toBeGreaterThanOrEqual(3); game.destroy(); expect(destroys).toBe(1); expect(game.playerUI).toBeNull();
  });
});


describe('v5 shield boards through the real Phaser methods', () => {
  test.each([4, 8, 12])('level %d keeps fixed shield hits, counters and textures in parity with the shared witness', (level) => {
    const { game, sandbox } = makeBrowserGame();
    const def = generatedLevel({ level, location, rulesVersion: 5 }, now);
    expect(def.objectives.some((goal: any) => goal.type === 'clear-shields')).toBe(true);
    game.applyGeneratedDefinition(def); game.isGameRunning = true;
    assertSprites(game);
    const initial = JSON.stringify(game.shields);
    const hint = game.showHint();
    expect(hint).toBeTruthy(); expect(JSON.stringify(game.shields)).toBe(initial);
    expect(game.objectiveProgress.shieldsCleared).toBe(0);
    const proof = certifyLevel(def);
    for (const cells of proof.witness) {
      if (!game.isGameRunning) break;
      const state = { board: game.board, specials: game.specials, shields: game.shields,
        refillState: game.levelRng.state, objectiveProgress: game.objectiveProgress };
      const expected = simulateLevelMove(def, state, cells)!;
      if (cells.length === 2) game.activateEarnedSpecial(...cells); else game.trySwap(...cells);
      expect(JSON.parse(JSON.stringify(game.board))).toEqual(expected.board);
      expect(JSON.parse(JSON.stringify(game.shields))).toEqual(expected.shields);
      expect(JSON.parse(JSON.stringify(game.objectiveProgress))).toEqual(expected.objectiveProgress);
      expect(game.levelRng.state).toBe(expected.refillState);
      assertSprites(game);
    }
    expect(game.hasWonLevel()).toBe(true); expect(game.endCalls).toBe(1);
    expect(game.objectiveProgress.shieldsCleared).toBe(def.quality.verifiedShields);
    const named = sandbox.InfiniteAssistiveBoard.describeCell(game, 0, 0);
    expect(named).toBeTruthy();
    game.applyGeneratedDefinition(def);
    expect(JSON.stringify(game.shields)).toBe(initial);
    expect(game.objectiveProgress.shieldsCleared).toBe(0);
    assertSprites(game);
  }, 20000);
});
