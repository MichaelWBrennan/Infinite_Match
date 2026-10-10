import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { certifyLevel, simulateLevelMove, simulateObjectiveClear, generateLevel } from '../services/levels/generator.js';
import { generatedLevel } from '../services/levels/level-service.js';

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
  for (const file of ['public/js/procedural-levels.js', 'public/js/level-location.js', 'public/js/player-experience.js', 'phaser3-game.js']) {
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
      expect(s.key).toBe(game.gemTexture(game.board[r][c], game.specials?.[r]?.[c]));
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
    expect(calls[0]).toMatchObject({ url: '/api/account-economy/energy/spend', body: { mode: 'classic', level: 100001, location, rulesVersion: 4 } });
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
    expect(game.generatedLevel.generatorVersion).toBe(4);
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
