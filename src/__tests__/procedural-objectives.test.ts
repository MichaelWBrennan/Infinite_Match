import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { generateLevel, certifyLevel, simulateLevelMove, simulateObjectiveClear, initialObjectiveProgress, objectiveStatus, objectiveStars,
  objectiveCompletionError, levelActions, matchingCells } from '../services/levels/generator.js';
import { validObjectives, validObjectiveProgress, addObjectiveProgress, objectiveDescription, MAX_COLLECTED_GEMS } from '../services/levels/objective-rules.js';
import { blankSpecials, simulateSpecialMove } from '../services/levels/special-rules.js';

const old = JSON.parse(readFileSync('src/__tests__/fixtures/generator-v3.json', 'utf8'))[0];
const palette = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const tiles = () => Array.from({ length: 7 }, (_, r) => Array.from({ length: 7 }, (_, c) => palette[(r * 2 + c) % 6]!));
function fixture(objectives: any[] = [{ type: 'collect', gemType: 'red', target: 30 }]) {
  return { ...old, generatorVersion: 4, boardSize: 7, board: tiles(), specials: blankSpecials(7), gemTypes: palette,
    gemWeights: {}, refillState: 12345, targetScore: 1000, moves: 30, objectives };
}
const stateOf = (definition: any) => ({ board: definition.board, specials: definition.specials, refillState: definition.refillState,
  objectiveProgress: initialObjectiveProgress(definition) });
const freeze = (value: any): any => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };

function verifyCounts(result: any) {
  let total = 0;
  const totals = Object.fromEntries(palette.map((color) => [color, 0]));
  for (const event of result.events) {
    expect(Object.values(event.collected).reduce((sum: number, value: any) => sum + value, 0)).toBe(event.cleared.length);
    for (const color of palette) totals[color]! += event.collected[color] || 0;
    total += event.cleared.length;
  }
  expect(result.collected).toEqual(totals);
  expect(Object.values(result.collected).reduce((sum: number, value: any) => sum + value, 0)).toBe(total);
}

describe('fully passive objective composition and certification', () => {
  test('v2 and v3 complete definitions remain frozen, including all four modes', () => {
    for (const version of [2, 3]) for (const definition of JSON.parse(readFileSync(`src/__tests__/fixtures/generator-v${version}.json`, 'utf8'))) {
      expect(generateLevel(definition.level, definition.context, definition.mode, version)).toEqual(definition);
    }
  });

  test('v4 composes score, one-color, two-color and mixed goals without authored level files', () => {
    const definitions = Array.from({ length: 40 }, (_, index) => generateLevel(index + 1, old.context, 'classic', 4));
    expect(new Set(definitions.map((definition) => definition.objectiveProfile))).toEqual(new Set(['score', 'collect', 'collect-pair', 'score-and-collect']));
    expect(definitions[0].objectiveProfile).toBe('score');
    expect(definitions[1].objectiveProfile).toBe('collect'); expect(definitions[2].objectiveProfile).toBe('collect');
    for (const definition of definitions) {
      expect(validObjectives(definition)).toBe(true);
      expect(definition.quality.verifiedObjectives).toBe(true);
      expect(definition.objectives.length).toBeLessThanOrEqual(2);
      for (const goal of definition.objectives) if (goal.type === 'collect') {
        expect(definition.gemTypes).toContain(goal.gemType);
        expect(goal.target).toBeGreaterThanOrEqual(5);
        expect(goal.target).toBeLessThanOrEqual(70);
        expect(goal.target).toBeLessThanOrEqual(definition.quality.verifiedCollected[goal.gemType]);
      }
      expect(generateLevel(definition.level, old.context, 'classic', 4)).toEqual(definition);
    }
  });

  test('daily goal profiles vary with seeds, not campaign progress or a manually published bank', () => {
    const profiles = new Set(); const ids = new Set();
    for (let day = 1; day <= 28; day++) {
      const context = { ...old.context, localDate: `2026-02-${String(day).padStart(2, '0')}`, month: 2, season: 'winter', holidays: [] };
      const one = generateLevel(1, context, 'daily', 4); const progressed = generateLevel(100001, context, 'daily', 4);
      expect(one).toEqual(progressed); ids.add(one.id); profiles.add(one.objectiveProfile);
      expect(objectiveStatus(one, one.quality.verifiedScore, { collected: one.quality.verifiedCollected }).complete).toBe(true);
    }
    expect(ids.size).toBe(28); expect(profiles.size).toBe(4);
  });

  test.each(['classic', 'daily', 'timed', 'endless'])('%s witnesses meet every goal through shared browser/server transitions', (mode) => {
    const sandbox: any = {}; vm.createContext(sandbox);
    vm.runInContext(readFileSync('public/js/procedural-levels.js', 'utf8'), sandbox);
    for (const period of ['morning', 'night']) for (const condition of ['rain', 'snow', 'storm']) {
      const context = { ...old.context, timeOfDay: { period }, weather: { available: true, condition, temperatureBand: 'cold', windBand: 'windy' } };
      const definition = generateLevel(7, context, mode, 4);
      expect(JSON.parse(JSON.stringify(sandbox.InfiniteLevels.generateLevel(7, context, mode, 4)))).toEqual(definition);
      const proof = certifyLevel(definition); let state: any = stateOf(definition); let score = 0;
      for (const cells of proof.witness) {
        const expected = simulateLevelMove(definition, state, cells)!;
        expect(JSON.parse(JSON.stringify(sandbox.InfiniteLevels.simulateLevelMove(definition, state, cells)))).toEqual(expected);
        score += expected.score; state = expected;
        expect(matchingCells(state.board).size).toBe(0);
      }
      expect(proof.objectivesComplete).toBe(true);
      expect(score).toBe(definition.quality.verifiedScore);
      expect(state.objectiveProgress.collected).toEqual(definition.quality.verifiedCollected);
      expect(objectiveStatus(definition, score, state.objectiveProgress).complete).toBe(true);
    }
  }, 20000);
});

describe('cleared-color accounting', () => {
  test('creating a four-match counts three cleared gems, not the protected anchor or its replacement spawns', () => {
    const definition = fixture();
    definition.board[3]![0] = 'blue'; definition.board[3]![1] = 'red'; definition.board[3]![2] = 'red';
    definition.board[3]![4] = 'red'; definition.board[2]![3] = 'red';
    const state = stateOf(definition); state.objectiveProgress.collected.red = 7;
    const result = simulateLevelMove(definition, state, [2, 3, 3, 3])!;
    expect(result.events[0]!.created[0]).toMatchObject({ type: 'row', row: 3, col: 3 });
    expect(result.events[0]!.collected.red).toBe(3);
    expect(result.objectiveProgress.collected.red).toBe(7 + result.collected.red);
    expect(state.objectiveProgress.collected.red).toBe(7);
    verifyCounts(result);
  });

  test.each(['row', 'column', 'burst', 'prism'])('%s activation and later cascades count actual cleared base colors', (kind) => {
    const definition = fixture(); definition.specials[3]![3] = kind;
    const result = simulateLevelMove(definition, stateOf(definition), [3, 3])!;
    verifyCounts(result);
    const before = definition.board;
    const firstCounts: any = Object.fromEntries(palette.map((color) => [color, 0]));
    for (const key of result.events[0]!.cleared) { const [r, c] = key.split(',').map(Number); firstCounts[before[r]![c]]++; }
    expect(result.events[0]!.collected).toEqual(firstCounts);
  });

  test('Prism combinations preserve base colors while converting gems and chain each cleared cell once', () => {
    const definition = fixture(); definition.specials[3]![3] = 'prism'; definition.specials[3]![4] = 'burst';
    const result = simulateLevelMove(definition, stateOf(definition), [3, 3, 3, 4])!;
    expect(result.events[0]!.combo).toBe('prism+burst'); verifyCounts(result);
    expect(result.objectiveProgress.collected).toEqual(result.collected);
  });

  test('inventory clears count toward goals without inventing collection for the base score award', () => {
    const definition = fixture(); definition.specials[3]![3] = 'row';
    const result = simulateObjectiveClear(definition, stateOf(definition), new Set(['3,3']), 500)!;
    expect(result.events[0]!.points).toBe(560); expect(result.events[0]!.cleared).toHaveLength(7);
    verifyCounts(result);
  });

  test('free pathological-refill repair never grants collection for the replacement board', () => {
    const definition = fixture(); definition.gemWeights = { red: 1e100 }; definition.specials[3]![3] = 'prism';
    const result = simulateLevelMove(definition, stateOf(definition), [3, 3])!;
    expect(result.events.length).toBeLessThanOrEqual(64); expect(result.reshuffled).toBe(true);
    verifyCounts(result); expect(matchingCells(result.board).size).toBe(0);
  });

  test('v3 move outputs are unchanged when color recording is not requested', () => {
    const definition = fixture(); definition.specials[3]![3] = 'row';
    const legacy = simulateSpecialMove(definition.board, definition.refillState, palette, {}, [3, 3], definition.specials)!;
    const recorded: any = simulateSpecialMove(definition.board, definition.refillState, palette, {}, [3, 3], definition.specials, true)!;
    const withoutColors = structuredClone(recorded); delete withoutColors.collected;
    withoutColors.events.forEach((event: any) => { delete event.collected; });
    expect(withoutColors).toEqual(legacy);
  });
});

describe('progress, completion, ratings and free hints', () => {
  test('collection-only completion does not hide a score requirement; mixed goals require both', () => {
    const definition = fixture(); const progress = initialObjectiveProgress(definition); progress.collected.red = 30;
    expect(objectiveStatus(definition, 30, progress).complete).toBe(true);
    expect(objectiveStars(definition, 30, progress)).toBe(1);
    expect(objectiveStars(definition, 1500, progress)).toBe(2);
    expect(objectiveStars(definition, 2000, progress)).toBe(3);
    definition.objectives.unshift({ type: 'score', target: 1000 });
    expect(objectiveStatus(definition, 30, progress).complete).toBe(false);
    expect(objectiveStars(definition, 30, progress)).toBe(0);
    expect(objectiveCompletionError(definition, 30, progress)).toBe('score_below_target');
    expect(objectiveStatus(definition, 1000, progress).complete).toBe(true);
  });

  test('two-color levels cannot win on only one color, even with a huge score', () => {
    const definition = fixture([{ type: 'collect', gemType: 'red', target: 30 }, { type: 'collect', gemType: 'blue', target: 20 }]);
    const progress = initialObjectiveProgress(definition); progress.collected.red = 100;
    expect(objectiveStatus(definition, 100000, progress)).toMatchObject({ complete: false, fraction: 0.5 });
    expect(objectiveStars(definition, 100000, progress)).toBe(0);
    expect(objectiveCompletionError(definition, 100000, progress)).toBe('objectives_incomplete');
    progress.collected.blue = 20; expect(objectiveStatus(definition, 100, progress).complete).toBe(true);
  });

  test.each([null, [], {}, { collected: [] }, { collected: { red: -1 } }, { collected: { red: 1.5 } },
    { collected: { red: '30' } }, { collected: { cyan: 30 } }, { collected: { red: Infinity } },
    { collected: { red: MAX_COLLECTED_GEMS + 1 } }, { collected: { red: 30 }, target: 1 }])('malformed progress %j is refused before mutation', (progress) => {
    const definition = fixture();
    expect(validObjectiveProgress(definition, progress)).toBe(false);
    expect(objectiveCompletionError(definition, 1000, progress)).toBe('invalid_objective_progress');
    expect(simulateLevelMove(definition, { ...stateOf(definition), objectiveProgress: progress }, [0, 0, 0, 1])).toBeNull();
  });

  test.each([-1, NaN, Infinity, 1.5, '1000'])('invalid score %j cannot complete even a collection-only goal', (score) => {
    const definition = fixture(); const progress = initialObjectiveProgress(definition); progress.collected.red = 30;
    expect(objectiveStatus(definition, score, progress).complete).toBe(false);
  });

  test('missing progress, inherited counts and unknown/duplicated objective types fail closed', () => {
    const definition = fixture();
    expect(objectiveCompletionError(definition, 100000, undefined)).toBe('objective_progress_required');
    expect(objectiveStatus(definition, 100000, { collected: Object.create({ red: 99999 }) }).complete).toBe(false);
    expect(validObjectiveProgress(definition, Object.assign(Object.create({ collected: { red: 30 } }), { other: 1 }))).toBe(false);
    expect(objectiveStatus(null, 100000, undefined).complete).toBe(false);
    for (const goals of [[], [{ type: 'unknown', target: 1 }], [{ type: 'collect', gemType: 'cyan', target: 1 }],
      [{ type: 'collect', gemType: 'red', target: 0 }], [{ type: 'score', target: 1 }, { type: 'score', target: 2 }]]) {
      expect(validObjectives({ ...definition, objectives: goals })).toBe(false);
      expect(objectiveStatus({ ...definition, objectives: goals }, 999999, initialObjectiveProgress(definition)).complete).toBe(false);
    }
  });

  test('old score-only definitions ignore new goal metadata and need no collection report', () => {
    for (const version of [2, 3]) {
      const definition = { ...fixture(), generatorVersion: version };
      expect(objectiveStatus(definition, 999, undefined).complete).toBe(false);
      expect(objectiveStatus(definition, 1000, undefined).complete).toBe(true);
      expect(objectiveStars(definition, 2000, undefined)).toBe(3);
    }
  });

  test('frozen progress is immutable, additive and bounded', () => {
    const definition = fixture(); const previous = freeze(initialObjectiveProgress(definition));
    const delta: any = { red: 10 };
    const next = addObjectiveProgress(definition, previous, delta);
    expect(previous.collected.red).toBe(0); expect(next.collected.red).toBe(10);
    expect(() => addObjectiveProgress(definition, previous, { red: -1 })).toThrow();
    expect(() => addObjectiveProgress(definition, previous, { red: NaN })).toThrow();
    next.collected.red = MAX_COLLECTED_GEMS;
    expect(addObjectiveProgress(definition, next, { red: 100 }).collected.red).toBe(MAX_COLLECTED_GEMS);
  });

  test('goal-aware hints preserve board, specials, RNG and progress while preferring unfinished colors', () => {
    const definition = fixture(); definition.specials[3]![3] = 'prism'; definition.board[3]![3] = 'red';
    const state = freeze(stateOf(definition)); const before = JSON.stringify(state);
    const actions = levelActions(definition, state.board, state.specials, state.objectiveProgress, 0);
    actions.sort((a, b) => b.priority - a.priority || b.count - a.count);
    expect(actions[0]!.collected.red).toBeGreaterThan(0);
    expect(actions[0]!.priority).toBe(Math.min(30, actions[0]!.collected.red) / 30);
    expect(JSON.stringify(state)).toBe(before);
    expect(simulateLevelMove(definition, state, actions[0]!.cells)).not.toBeNull();
    expect(objectiveDescription(definition)).toBe('Collect 30 red');
  });
});
