import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { generateLevel, simulateLevelMove, simulateObjectiveClear, certifyLevel, initialObjectiveProgress } from '../services/levels/generator.js';
import { blankSpecials, simulateSpecialClear, PRESENTATION_FRAME_LIMIT } from '../services/levels/special-rules.js';

const palette = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const context = { localDate: '2026-10-10', timeZone: 'America/New_York', country: 'US', region: 'PA', month: 10,
  season: 'autumn', hemisphere: 'north', holidays: [], timeOfDay: { period: 'evening' }, weather: { available: false } };
const base = generateLevel(7, context);
const json = (value: any) => JSON.parse(JSON.stringify(value));

// Authored fixtures exist only in tests; production levels still come from the shared generator.
function fixture(kinds: string[] = [], four = true, version = 4) {
  const board = Array.from({ length: 7 }, (_, r) => Array.from({ length: 7 }, (_, c) => palette[(r * 2 + c) % 6]));
  const specials = blankSpecials(7);
  kinds.forEach((kind, index) => { specials[3]![3 + index] = kind; });
  if (four) {
    board[3]![0] = 'blue'; board[3]![1] = board[3]![2] = board[3]![4] = board[2]![3] = 'red';
  }
  return { ...base, generatorVersion: version, boardSize: 7, board, specials, gemTypes: palette, gemWeights: {}, refillState: 12345,
    mode: 'classic', moves: 30, targetScore: 1000000, objectives: [{ type: 'score', target: 1000000 }] };
}
function state(definition: any) { return { board: definition.board, specials: definition.specials, refillState: definition.refillState, objectiveProgress: definition.generatorVersion >= 4 ? initialObjectiveProgress(definition) : null }; }
function observe(definition = fixture(), cells = [2, 3, 3, 3]) { return simulateLevelMove(definition, state(definition), cells, true) as any; }
function freeze(value: any): any { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }

function eventTarget() {
  const listeners = new Map<string, Set<() => void>>();
  return { addEventListener(name: string, fn: () => void) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name)!.add(fn); },
    removeEventListener(name: string, fn: () => void) { listeners.get(name)?.delete(fn); },
    emit(name: string) { [...(listeners.get(name) || [])].forEach((fn) => fn()); },
    count: () => [...listeners.values()].reduce((sum, values) => sum + values.size, 0) };
}
function clock() {
  let now = 0; let next = 0;
  const tasks = new Map<number, { at: number; fn: () => void; interval: number }>();
  const add = (fn: () => void, delay: number, interval = 0) => { tasks.set(++next, { at: now + delay, fn, interval }); return next; };
  return { tasks, now: () => now, consume: (ms: number) => { now += ms; }, setTimeout: add, clearTimeout: (id: number) => tasks.delete(id),
    setInterval: (fn: () => void, delay: number) => add(fn, delay, delay), clearInterval: (id: number) => tasks.delete(id),
    tick(ms: number) {
      const until = now + ms;
      for (let iteration = 0; iteration < 10000; iteration++) {
        const first = [...tasks].sort((a, b) => a[1].at - b[1].at)[0];
        if (!first || first[1].at > until) break;
        const [id, task] = first; now = Math.max(now, task.at);
        if (task.interval) task.at += task.interval; else tasks.delete(id);
        task.fn();
      }
      now = Math.max(now, until);
    } };
}
function image(x = 0, y = 0, key = '') {
  const value: any = { x, y, key, data: {}, alpha: 1, visible: true, active: true, interactive: false, destroyed: false };
  for (const method of ['setOrigin', 'setColor', 'setTint', 'clearTint', 'on']) value[method] = () => value;
  value.setPosition = (x: number, y: number) => { value.x = x; value.y = y; return value; };
  value.setTexture = (key: string) => { value.key = key; return value; };
  value.setScale = (scale: number) => { value.scale = scale; return value; };
  value.setName = (name: string) => { value.name = name; return value; };
  value.setDepth = (depth: number) => { value.depth = depth; return value; };
  value.setAlpha = (alpha: number) => { value.alpha = alpha; return value; };
  value.setVisible = (visible: boolean) => { value.visible = visible; return value; };
  value.setInteractive = () => { value.interactive = true; return value; };
  value.setData = (name: string, data: any) => { value.data[name] = data; return value; };
  value.getData = (name: string) => value.data[name];
  value.setText = (text: string) => { value.text = text; return value; };
  value.destroy = () => { value.destroyed = true; value.active = false; };
  return value;
}
function harness(definition = fixture()) {
  const time = clock(); const windowEvents = eventTarget(); const doc = { ...eventTarget(), hidden: false, readyState: 'loading', getElementById: () => null };
  const motion = { ...eventTarget(), matches: false };
  const flags = new Set<string>(); const surface = { ...eventTarget(), classList: { contains: (name: string) => flags.has(name) } };
  const layers: any[] = []; const graphics: any[] = []; const images: any[] = []; const masks: any[] = []; const tweens: any[] = [];
  const liveTweens = new Set<any>(); const labels: any[] = []; const rewards: any[] = []; const screens: number[] = [];
  const sandbox: any = { ...windowEvents, ...time, document: doc, matchMedia: () => motion, navigator: {}, Date, Intl, URLSearchParams,
    console: { log() {}, info() {}, warn() {}, error() {} }, localStorage: { getItem: () => null, setItem() {} } };
  sandbox.performance = { now: time.now };
  sandbox.window = sandbox; vm.createContext(sandbox);
  for (const file of ['public/js/procedural-levels.js', 'public/js/player-experience.js', 'public/js/match-feedback.js', 'phaser3-game.js']) {
    vm.runInContext(readFileSync(file, 'utf8'), sandbox, { filename: file });
  }
  function graphic() {
    const value = image(); value.rects = [];
    value.clear = () => { value.rects = []; return value; };
    value.fillStyle = () => value;
    value.fillRect = value.fillRoundedRect = (...rect: number[]) => { value.rects.push(rect); return value; };
    value.createGeometryMask = () => { const mask = image(); masks.push(mask); return mask; };
    graphics.push(value); return value;
  }
  const scene = { add: { image: (...args: any[]) => { const value = image(...args); images.push(value); return value; }, text: image, graphics: graphic,
    container: () => {
      const value = image(); value.children = [];
      value.add = (child: any) => { value.children.push(child); return value; };
      value.bringToTop = () => value; value.setMask = () => value;
      value.destroy = (children: boolean) => { value.destroyed = true; if (children) value.children.forEach((child: any) => child.destroy()); };
      layers.push(value); return value;
    } }, make: { graphics: graphic },
  tweens: { add: (options: any) => {
    tweens.push(options); liveTweens.add(options);
    for (const target of Array.isArray(options.targets) ? options.targets : [options.targets]) {
      for (const field of ['x', 'y', 'alpha']) if (options[field] !== undefined) target[field] = options[field];
    }
    return options;
  }, killTweensOf: (target: any) => {
    for (const tween of liveTweens) if ((Array.isArray(tween.targets) ? tween.targets : [tween.targets]).includes(target)) liveTweens.delete(tween);
  } }, cameras: { main: { setBackgroundColor() {} } } };
  const game: any = Object.create(sandbox.PhaserMatch3Game.prototype);
  Object.assign(game, { scene, settings: { sfx: false, haptics: false }, gemSprites: [], isGameRunning: false, isPaused: false,
    powerUpPending: false, levelStarting: false, campaignLevel: 25, energy: 80, stars: 5, maxEnergy: 100,
    analytics: { gamesPlayed: 0, totalScore: 0, totalTime: 0 }, getAuthToken: () => null, getLevelLocation: () => context,
    closeOverlay() {}, fitBoardViewport() {}, checkAchievements() {}, showScorePopup() {}, saveUserData() {},
    trackEvent() {}, playSound() {}, reportLevelResult() {}, showEndGameScreen: (stars: number) => screens.push(stars),
    submitLevelWin: (stars: number) => { rewards.push({ stars, board: json(game.board), score: game.score, progress: json(game.objectiveProgress) }); return Promise.resolve(); },
    playerUI: { surface, shell: { querySelector: () => ({ open: false }), style: { setProperty() {} }, remove() {} },
      announce() {}, refresh() {}, setResolution: (value: any) => labels.push(value), assistiveBoard: { sync() {}, destroy() {} }, closeOverlay() {} } });
  for (const field of ['score', 'moves', 'timer', 'level', 'energy', 'stars', 'goal', 'theme']) game[`${field}Text`] = image();
  game.applyGeneratedDefinition(definition); game.isGameRunning = true; game.runStartedAt = Date.now();
  game.matchFeedback = sandbox.InfiniteMatchFeedback.create(game, sandbox);
  return { game, sandbox, time, flags, surface, doc, motion, layers, graphics, images, masks, tweens, liveTweens, labels, rewards, screens, feedback: sandbox.InfiniteMatchFeedback };
}
function model(game: any) {
  return json({ board: game.board, specials: game.specials, progress: game.objectiveProgress, rng: game.levelRng.state,
    score: game.score, moves: game.moves, energy: game.energy, stars: game.stars, time: game.time });
}
function coreVisible(game: any) { return game.gemSprites.flat().every((sprite: any) => sprite.visible); }

const actions: [string, string[], number[], boolean][] = [
  ['earned row anchor', [], [2, 3, 3, 3], true],
  ['row', ['row'], [3, 3], false], ['column', ['column'], [3, 3], false], ['burst', ['burst'], [3, 3], false], ['prism', ['prism'], [3, 3], false],
  ['two beams', ['row', 'column'], [3, 3, 3, 4], false], ['beam + burst', ['row', 'burst'], [3, 3, 3, 4], false],
  ['two bursts', ['burst', 'burst'], [3, 3, 3, 4], false], ['prism + beam', ['prism', 'row'], [3, 3, 3, 4], false],
  ['prism + burst', ['prism', 'burst'], [3, 3, 3, 4], false], ['two prisms', ['prism', 'prism'], [3, 3, 3, 4], false],
];

describe('shared read-only visual observations', () => {
  test.each(actions)('%s traces preserve v3/v4 results, inputs, real clear colors and protected anchors', (_name, kinds, cells, four) => {
    const h = harness();
    for (const version of [3, 4]) {
      const definition = freeze(fixture(kinds, four, version)); const input = freeze(state(definition));
      const plain = simulateLevelMove(definition, input, cells) as any;
      const observed = simulateLevelMove(definition, input, cells, true) as any;
      const { presentation, ...rest } = observed;
      expect(rest).toEqual(plain); expect(plain.presentation).toBeUndefined();
      expect(presentation.frames).toHaveLength(Math.min(observed.cascades, PRESENTATION_FRAME_LIMIT));
      expect(json(h.sandbox.InfiniteLevels.simulateLevelMove(definition, input, cells, true))).toEqual(observed);
      expect(presentation.initial.board).toEqual(input.board); expect(presentation.initial.board).not.toBe(input.board);
      const plan = h.feedback.planFor(freeze(observed)); expect(plan).not.toBeNull();
      plan.waves.forEach((wave: any, index: number) => {
        if (index) expect(wave.before).toEqual(presentation.frames[index - 1].after);
        const created = new Map(wave.event.created.map((item: any) => [`${item.row},${item.col}`, item.type]));
        for (const key of created.keys()) expect(wave.event.cleared).not.toContain(key);
        for (const cell of wave.falls) {
          if (cell.refill) expect(wave.after.specials[cell.row][cell.col]).toBeNull();
          else {
            expect(wave.after.board[cell.row][cell.col]).toBe(wave.before.board[cell.from][cell.col]);
            expect(wave.after.specials[cell.row][cell.col]).toBe(created.get(`${cell.from},${cell.col}`) || wave.before.specials[cell.from][cell.col]);
          }
        }
        if (version === 4) for (const color of palette) expect(wave.event.collected[color]).toBe(wave.event.cleared.filter((key: string) => {
          const [r, c] = key.split(',').map(Number); return wave.before.board[r!][c!] === color;
        }).length);
      });
      if (observed.cascades <= PRESENTATION_FRAME_LIMIT && !observed.reshuffled) {
        expect(presentation.frames.at(-1).after.board).toEqual(observed.board);
        expect(presentation.frames.at(-1).after.specials).toEqual(observed.specials);
      }
    }
  });
  test('frozen v2 ignores observations and true is the only opt-in value', () => {
    const old = fixture([], true, 2); const current = fixture();
    expect(simulateLevelMove(old, state(old), [2, 3, 3, 3], true)).toEqual(simulateLevelMove(old, state(old), [2, 3, 3, 3]));
    expect((simulateLevelMove(current, state(current), [2, 3, 3, 3], 'true' as any) as any).presentation).toBeUndefined();
  });
  test('invalid actions do not produce snapshots or modify state', () => {
    const definition = freeze(fixture()); const input = freeze(state(definition));
    expect(simulateLevelMove(definition, input, [-1, 0, 0, 0], true)).toBeNull();
    expect(simulateLevelMove(definition, input, [0, 0], true)).toBeNull();
  });
  test('inventory clears keep their existing base award and color counters, without another refill', () => {
    const definition = fixture(['burst'], false); const input = freeze(state(definition)); const keys = ['3,3'];
    const plain = simulateObjectiveClear(definition, input, keys, 200) as any;
    const observed = simulateObjectiveClear(definition, input, keys, 200, true) as any;
    const { presentation, ...rest } = observed;
    expect(rest).toEqual(plain); expect(presentation.cells).toBeNull();
    const v3 = simulateSpecialClear(input.board, input.refillState, palette, {}, keys, input.specials, 200, false, true) as any;
    expect(v3.score).toBe(observed.score); expect(v3.refillState).toBe(observed.refillState);
  });
  test('64-wave cap/repair records only three isolated frames and remains exactly deterministic', () => {
    const definition = { ...fixture(), gemWeights: { red: 1e12 } };
    const observed = observe(definition); const { presentation, ...rest } = observed;
    expect(rest).toEqual(simulateLevelMove(definition, state(definition), [2, 3, 3, 3]));
    expect(observed.cascades).toBe(64); expect(observed.reshuffled).toBe(true); expect(presentation.frames).toHaveLength(3);
    expect(presentation.frames[0].after.board).not.toBe(presentation.frames[1].before.board);
    const original = json(observed.board); presentation.frames[0].before.board[0][0] = 'red';
    expect(observed.board).toEqual(original);
  });
  test.each([2, 4, 7, 18])('generated level %s witnesses are unchanged with observation opt-in', (level) => {
    const definition = generateLevel(level, context); const proof = certifyLevel(definition);
    let input: any = { ...state(definition), objectiveProgress: undefined };
    for (const cells of proof.witness) {
      const observed = simulateLevelMove(definition, input, cells, true) as any;
      const { presentation, ...rest } = observed;
      expect(rest).toEqual(simulateLevelMove(definition, input, cells)); expect(presentation.frames.length).toBeLessThanOrEqual(3);
      input = rest;
    }
  });
});

describe('bounded cancellable feedback uses the real Phaser action paths', () => {
  test('commits the model once, keeps final sprite metadata, stages a protected earned anchor, then unlocks', () => {
    const h = harness(); const { game, time } = h; const before = model(game);
    const expected = observe(); const result = game.trySwap(2, 3, 3, 3);
    expect(json(result)).toEqual(expected); expect(game.moves).toBe(before.moves - 1);
    expect(game.score).toBe(expected.score); expect(game.levelRng.state).toBe(expected.refillState);
    expect(game.matchFeedback.isActive()).toBe(true); expect(game.canInteractWithBoard()).toBe(false); expect(coreVisible(game)).toBe(false);
    const committed = model(game);
    expect(game.commitEarnedAction([2, 3, 3, 3])).toBeNull(); game.showHint(); game.trySwap(2, 3, 3, 3);
    expect(model(game)).toEqual(committed);
    for (let r = 0; r < game.boardSize; r++) for (let c = 0; c < game.boardSize; c++) {
      const sprite = game.gemSprites[r][c];
      expect(sprite.key).toBe(game.gemTexture(game.board[r][c], game.specials[r][c])); expect([sprite.x, sprite.y]).toEqual([game.cellX(c), game.cellY(r)]);
    }
    time.tick(90 + 65);
    const ghosts = h.images.filter((image) => !image.interactive);
    expect(ghosts[3 * 7 + 3].key).toBe('gem_red_row');
    expect(ghosts[3 * 7 + 3].alpha).toBe(1); expect(ghosts[3 * 7 + 1].alpha).toBe(0);
    time.tick(1000);
    expect(model(game)).toEqual(committed); expect(game.matchFeedback.isActive()).toBe(false); expect(game.canInteractWithBoard()).toBe(true);
    expect(coreVisible(game)).toBe(true); expect(time.tasks.size).toBe(0); expect(h.liveTweens.size).toBe(0); expect(h.rewards).toHaveLength(0);
  });
  test('read/fade/fall ordering follows actual waves, with one small non-live phase label', () => {
    const h = harness(fixture(['prism', 'burst'], false)); h.game.trySwap(3, 3, 3, 4);
    h.time.tick(90); expect(h.game.matchFeedback.status().phase).toBe('read');
    expect(h.labels.at(-1).text).toContain('Prism + Burst combo');
    h.time.tick(65); expect(h.game.matchFeedback.status().phase).toBe('clear');
    h.time.tick(65); expect(h.game.matchFeedback.status().phase).toBe('fall');
    h.time.tick(1000); expect(h.game.matchFeedback.status().phase).toBe('idle');
    expect(h.labels.at(-1)).toBeNull();
    const source = readFileSync('public/js/player-experience.js', 'utf8');
    expect(source).toContain('class="match-resolution-label" aria-hidden="true"');
    expect(source).toContain('class="match-announcement-message" role="status"');
  });
  test.each(['setting', 'system', 'text-preference', 'named-focus', 'paused', 'hidden'])('%s mode is immediate and does not allocate an effect layer', (mode) => {
    const h = harness();
    if (mode === 'setting') h.game.settings.reduceAnimations = true;
    if (mode === 'system') h.motion.matches = true;
    if (mode === 'text-preference') h.game.settings.textBoard = true;
    if (mode === 'named-focus') h.flags.add('match-text-board-active');
    if (mode === 'paused') h.game.isPaused = true;
    if (mode === 'hidden') h.doc.hidden = true;
    const before = model(h.game); const result = h.game.trySwap(2, 3, 3, 3);
    expect(h.game.matchFeedback.isActive()).toBe(false); expect(h.layers).toHaveLength(0); expect(h.time.tasks.size).toBe(0);
    if (mode === 'paused') expect(model(h.game)).toEqual(before);
    else { expect(result.presentation).toBeUndefined(); expect(h.game.moves).toBe(before.moves - 1); expect(h.game.inputLockedUntil).toBe(0); }
    expect(coreVisible(h.game)).toBe(true);
  });
  test.each(['skip', 'pause', 'background', 'pagehide', 'reduced-motion', 'named-cell-view'])('%s interrupts promptly; stale callbacks cannot replay or resurrect a board', (reason) => {
    const h = harness(); h.game.trySwap(2, 3, 3, 3); const committed = model(h.game);
    const stale = [...h.time.tasks.values()].map((task) => task.fn);
    if (reason === 'pause') h.game.pauseGame();
    else if (reason === 'background') { h.doc.hidden = true; h.doc.emit('visibilitychange'); }
    else if (reason === 'pagehide') h.sandbox.emit('pagehide');
    else if (reason === 'reduced-motion') { h.motion.matches = true; h.motion.emit('change'); }
    else if (reason === 'named-cell-view') { h.flags.add('match-text-board-active'); h.surface.emit('focusin'); }
    else h.game.matchFeedback.finish(reason);
    stale.forEach((fn) => fn()); h.time.tick(1000);
    expect(model(h.game)).toEqual(committed); expect(coreVisible(h.game)).toBe(true); expect(h.game.matchFeedback.isActive()).toBe(false);
    expect(h.time.tasks.size).toBe(0); expect(h.liveTweens.size).toBe(0); expect(h.rewards).toHaveLength(0);
    if (reason === 'pause') { expect(h.game.canInteractWithBoard()).toBe(false); h.game.resumeGame(); expect(h.game.canInteractWithBoard()).toBe(true); }
  });
  test('a winning last move finalizes/reports immediately; only its screen waits, even on pause or teardown', () => {
    for (const action of ['complete', 'pause', 'destroy']) {
      const h = harness({ ...fixture(), moves: 1, objectives: [{ type: 'score', target: 1 }] });
      h.game.trySwap(2, 3, 3, 3);
      expect(h.game.moves).toBe(0); expect(h.rewards).toHaveLength(1); expect(h.game.isGameRunning).toBe(false);
      expect(h.rewards[0].stars).toBeGreaterThanOrEqual(1); expect(h.screens).toHaveLength(0); expect(h.game.matchFeedback.isActive()).toBe(true);
      if (action === 'pause') h.game.pauseGame();
      if (action === 'destroy') h.game.destroy();
      h.time.tick(1200); expect(h.screens).toHaveLength(action === 'destroy' ? 0 : 1);
      h.game.matchFeedback.finish(); h.game.resumeGame(); h.time.tick(1200); expect(h.rewards).toHaveLength(1);
    }
  });
  test('timer expiry during an effect does not grant more time, duplicate a result or change counters', () => {
    const h = harness({ ...fixture(), mode: 'timed', timeLimit: 60 });
    h.game.time = 1; h.game.startTimer(); h.time.tick(950); h.game.trySwap(2, 3, 3, 3);
    const committed = model(h.game); h.time.tick(50);
    expect(h.game.time).toBe(0); expect(h.game.isGameRunning).toBe(false); expect(h.game.matchFeedback.isActive()).toBe(false);
    expect(h.rewards).toHaveLength(1); h.time.tick(1000); expect(h.rewards).toHaveLength(1);
    expect({ ...model(h.game), time: committed.time }).toEqual(committed); expect(coreVisible(h.game)).toBe(true);
  });
  test('Endless advances exactly one generated stage after feedback; no new attempt or spending', () => {
    const h = harness({ ...fixture(), mode: 'endless', objectives: [{ type: 'score', target: 1 }] }); h.game.attemptId = 'fixture-attempt';
    const level = h.game.level; const energy = h.game.energy;
    h.game.trySwap(2, 3, 3, 3); const score = h.game.score;
    expect(h.game.level).toBe(level); h.time.tick(1000);
    expect(h.game.level).toBe(level + 1); expect(h.game.endlessTotalScore).toBe(score);
    expect(h.game.attemptId).toBe('fixture-attempt'); expect(h.game.energy).toBe(energy); expect(h.rewards).toHaveLength(0);
    expect(h.game.isGameRunning).toBe(true); expect(h.game.feedbackEndPending).toBe(false); expect(coreVisible(h.game)).toBe(true);
  });
  test('inventory presentation applies existing points/RNG once and spends no ordinary move', () => {
    const definition = fixture(['burst'], false); const h = harness(definition); const moves = h.game.moves;
    const expected = simulateObjectiveClear(definition, state(definition), ['3,3'], 200) as any;
    h.game.clearAndCascade(['3,3'], 200);
    expect(h.game.matchFeedback.isActive()).toBe(true); expect(h.game.moves).toBe(moves); expect(h.game.score).toBe(expected.score);
    expect(h.game.levelRng.state).toBe(expected.refillState); const committed = model(h.game); h.time.tick(1000);
    expect(model(h.game)).toEqual(committed); expect(coreVisible(h.game)).toBe(true);
  });
  test('replacement and teardown clear timers, listeners, masks, images and stale result callbacks', () => {
    const h = harness(); h.game.trySwap(2, 3, 3, 3); const stale = [...h.time.tasks.values()].map((task) => task.fn);
    h.game.applyGeneratedDefinition(fixture(['burst'], false)); const replacement = model(h.game);
    stale.forEach((fn) => fn()); h.time.tick(1000);
    expect(model(h.game)).toEqual(replacement); expect(coreVisible(h.game)).toBe(true); expect(h.rewards).toHaveLength(0);
    h.game.activateEarnedSpecial(3, 3); h.game.destroy(); h.game.matchFeedback.destroy();
    h.time.tick(1000);
    expect(h.time.tasks.size).toBe(0); expect(h.liveTweens.size).toBe(0);
    expect(h.layers.every((layer) => layer.destroyed)).toBe(true); expect(h.graphics.every((graphic) => graphic.destroyed)).toBe(true);
    expect(h.masks.every((mask) => mask.destroyed)).toBe(true); expect(h.images.every((sprite) => sprite.destroyed || sprite.interactive)).toBe(true);
    expect(h.doc.count() + h.motion.count() + h.surface.count()).toBe(0); expect(h.rewards).toHaveLength(0);
  });
  test('many actions reuse at most 64 non-interactive images and two timers; capped waves are summarized faithfully', () => {
    const definition = { ...fixture(), gemWeights: { red: 1e12 } }; const h = harness(definition);
    for (let action = 0; action < 10; action++) {
      h.game.applyGeneratedDefinition(definition); h.game.isGameRunning = true;
      h.game.trySwap(2, 3, 3, 3); const committed = model(h.game);
      expect(h.time.tasks.size).toBeLessThanOrEqual(2); h.time.tick(810);
      expect(h.game.matchFeedback.isActive()).toBe(false); expect(model(h.game)).toEqual(committed);
      expect(h.labels.some((label) => label?.text === 'Free board repair · settled')).toBe(true);
    }
    expect(h.layers).toHaveLength(1); expect(h.graphics).toHaveLength(2); expect(h.images.filter((image) => !image.interactive)).toHaveLength(49);
    expect(h.game.matchFeedback.status().images).toBeLessThanOrEqual(64); expect(h.time.tasks.size).toBe(0);
  });
  test('refreshing moved-canvas input bounds is read-only and harmless without a scale manager', () => {
    const h = harness(); const before = model(h.game); let updates = 0;
    h.game.refreshBoardInputBounds(); h.game.game = { scale: { updateBounds: () => updates++ } };
    h.game.refreshBoardInputBounds(); expect(updates).toBe(1); expect(model(h.game)).toEqual(before);
  });
  test('a lost phase timer is released by the 1200ms watchdog, without any simulation callback', () => {
    const h = harness(); h.game.trySwap(2, 3, 3, 3); const committed = model(h.game);
    expect(h.feedback.MAX_FRAMES).toBe(PRESENTATION_FRAME_LIMIT); expect(h.feedback.MAX_DURATION_MS).toBe(810);
    const phase = [...h.time.tasks].find((entry) => entry[1].at === 90)!; h.time.tasks.delete(phase[0]);
    h.time.tick(1200);
    expect(h.game.matchFeedback.isActive()).toBe(false); expect(model(h.game)).toEqual(committed); expect(coreVisible(h.game)).toBe(true);
    expect(h.time.tasks.size).toBe(0); expect(h.game.canInteractWithBoard()).toBe(true); expect(h.rewards).toHaveLength(0);
  });
  test('an overlay interrupts an unfinished level and preserves pause until explicit resume', () => {
    const h = harness(); h.game.playerUI.openOverlay = () => ({ destroy() {} }); h.game.trySwap(2, 3, 3, 3);
    const committed = model(h.game); h.game.openOverlay('Test overlay'); h.time.tick(1200);
    expect(h.game.isPaused).toBe(true); expect(h.game.matchFeedback.isActive()).toBe(false); expect(h.rewards).toHaveLength(0);
    expect(model(h.game)).toEqual(committed); h.game.resumeGame(); expect(h.game.canInteractWithBoard()).toBe(true);
  });
  test('natural fourth and later waves are summarized, not painted on the wrong intermediate board', () => {
    const h = harness({ ...fixture(['prism', 'prism'], false), refillState: 9 });
    const result = h.game.trySwap(3, 3, 3, 4); const committed = model(h.game);
    expect(result.cascades).toBe(4); expect(result.reshuffled).toBe(false); h.time.tick(810);
    expect(h.labels.some((label) => label?.text === '1 more cascade resolved · settled')).toBe(true);
    expect(h.labels.filter((label) => label?.text.startsWith('Cascade 4/'))).toHaveLength(0);
    expect(model(h.game)).toEqual(committed); expect(coreVisible(h.game)).toBe(true);
  });
  test('pool growth/shrink remains capped at 64 images and keeps unused images hidden', () => {
    const h = harness();
    for (const size of [8, 6, 8, 6]) {
      const definition = { ...fixture(['row'], false), boardSize: size,
        board: Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => palette[(r * 2 + c) % 6])), specials: blankSpecials(size) };
      definition.specials[3]![3] = 'row'; h.game.applyGeneratedDefinition(definition); h.game.isGameRunning = true;
      h.game.activateEarnedSpecial(3, 3);
      expect(h.images.filter((sprite) => !sprite.interactive && sprite.visible)).toHaveLength(size * size);
      h.time.tick(900); expect(h.game.matchFeedback.status().images).toBe(64); expect(coreVisible(h.game)).toBe(true);
    }
    expect(h.images.filter((sprite) => !sprite.interactive)).toHaveLength(64); expect(h.layers).toHaveLength(1);
  });
  test('a mid-effect tween failure still restores the committed board and resolves a win once', () => {
    const h = harness({ ...fixture(), objectives: [{ type: 'score', target: 1 }] }); h.game.trySwap(2, 3, 3, 3);
    const committed = model(h.game); h.game.scene.tweens.add = () => { throw new Error('tween backend lost'); };
    h.time.tick(155); expect(h.game.matchFeedback.isActive()).toBe(false); expect(coreVisible(h.game)).toBe(true);
    expect(model(h.game)).toEqual(committed); expect(h.time.tasks.size).toBe(0); expect(h.rewards).toHaveLength(1);
  });
  test('absolute phase deadlines do not add synchronous UI work to every animation delay', () => {
    const h = harness({ ...fixture(['prism', 'prism'], false), refillState: 9 });
    h.game.playerUI.setResolution = (value: any) => { h.time.consume(20); h.labels.push(value); };
    h.game.trySwap(3, 3, 3, 4); h.time.tick(810);
    expect(h.game.matchFeedback.isActive()).toBe(false); expect(h.game.matchFeedback.status().lastReason).toBe('complete');
    expect(h.time.now()).toBeLessThanOrEqual(850); expect(h.time.tasks.size).toBe(0); expect(coreVisible(h.game)).toBe(true);
  });
  test('winning before timed expiry freezes the authoritative clock/result immediately, not after the animation', () => {
    const h = harness({ ...fixture(), mode: 'timed', timeLimit: 60, objectives: [{ type: 'score', target: 1 }] });
    h.game.time = 1; h.game.startTimer(); h.time.tick(950); h.game.trySwap(2, 3, 3, 3);
    expect(h.rewards).toHaveLength(1); expect(h.game.isGameRunning).toBe(false); expect(h.game.matchFeedback.isActive()).toBe(true);
    h.time.tick(1200); expect(h.game.time).toBe(1); expect(h.rewards).toHaveLength(1); expect(h.screens).toHaveLength(1);
  });
  test('scene shutdown releases presentation resources without submitting a stale result', () => {
    const h = harness(); h.game.matchFeedback.destroy(); let shutdown = () => {};
    h.game.scene.events = { once: (_name: string, handler: () => void) => { shutdown = handler; }, off() {} };
    h.game.matchFeedback = h.feedback.create(h.game, h.sandbox); h.game.trySwap(2, 3, 3, 3);
    shutdown(); h.time.tick(1000);
    expect(h.game.matchFeedback.isActive()).toBe(false); expect(h.game.matchFeedback.canStage()).toBe(false);
    expect(h.time.tasks.size).toBe(0); expect(h.layers.every((layer) => layer.destroyed)).toBe(true); expect(h.rewards).toHaveLength(0);
  });
  test('malformed/missing observations and graphics failures fall back to the final board, never a locked game', () => {
    const h = harness(); const bad = observe(); bad.presentation.frames[0].before.board = [];
    expect(h.game.matchFeedback.play(bad)).toBe(false); expect(h.game.matchFeedback.isActive()).toBe(false);
    h.game.scene.add.container = () => { throw new Error('graphics unavailable'); };
    h.game.trySwap(2, 3, 3, 3); expect(h.game.matchFeedback.isActive()).toBe(false); expect(coreVisible(h.game)).toBe(true);
    expect(h.game.canInteractWithBoard()).toBe(true); expect(h.time.tasks.size).toBe(0); expect(h.game.score).toBe(30);
  });
});
