import { describe, expect, test } from '@jest/globals';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { generateLevel, certifyLevel, simulateLevelMove, objectiveStatus, initialObjectiveProgress, simulateObjectiveClear } from '../services/levels/generator.js';
import { shieldCount, validShields, simulateShieldMove } from '../services/levels/shield-rules.js';
import { blankSpecials, simulateSpecialClear } from '../services/levels/special-rules.js';

const context = JSON.parse(readFileSync('src/__tests__/fixtures/generator-v3.json', 'utf8'))[0].context;
const board = () => Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => ['red', 'blue', 'green', 'yellow'][(r + c * 2) % 4]));
const palette = ['red', 'blue', 'green', 'yellow'];
const fixture = () => ({ board: board(), specials: blankSpecials(6), shields: blankSpecials(6).map((r) => r.map(() => 0)),
  refillState: 2718, gemTypes: palette, gemWeights: {}, generatorVersion: 5, boardSize: 6,
  objectives: [{ type: 'clear-shields', target: 1 }], targetScore: 100 });

describe('fixed shield tiles, shared v5 rules', () => {
  test('each genuine hit removes one layer; a free repair or match elsewhere does not; the gem still clears', () => {
    const def = fixture(); def.shields[3]![3] = 2;
    const original = structuredClone(def.shields);
    let state: any = { ...def, objectiveProgress: initialObjectiveProgress(def) };
    const first = simulateObjectiveClear(def, state, new Set(['3,3']), 50)!;
    const staged: any = simulateObjectiveClear(def, state, new Set(['3,3']), 50, true)!;
    const { presentation, ...sameRules } = staged;
    expect(sameRules).toEqual(first);
    expect(presentation.initial.shields[3][3]).toBe(2);
    expect(presentation.frames[0].before.shields[3][3]).toBe(2);
    expect(presentation.frames[0].after.shields[3][3]).toBe(1);
    expect(first.shields[3][3]).toBe(1);
    expect(first.brokenShields).toBe(0);
    expect(first.events[0].shieldHits).toEqual([{ row: 3, col: 3, remaining: 1 }]);
    expect(first.objectiveProgress.shieldsCleared).toBe(0);
    expect(def.shields).toEqual(original); // Never mutate a pinned definition.
    const second = simulateObjectiveClear(def, first, new Set(['3,3']), 50)!;
    expect(second.shields[3][3]).toBe(0);
    expect(second.brokenShields).toBe(1);
    expect(second.objectiveProgress.shieldsCleared).toBe(1);
    expect(objectiveStatus(def, second.score, second.objectiveProgress).complete).toBe(true);
    expect(first.shields[3][3]).toBe(1);
    const plain = simulateSpecialClear(def.board, def.refillState, palette, {}, new Set(['3,3']), def.specials, 50, true)!;
    expect(first.score).toBe(plain.score);
    expect(first.collected).toEqual(plain.collected);
    expect(simulateObjectiveClear(def, second, new Set(['3,3']), 50)!.brokenShields).toBe(0);
  });

  test('a newly earned protected special does not accidentally damage its shield cell', () => {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    const gems = Array.from({ length: 7 }, (_, r) => Array.from({ length: 7 }, (_, c) => colors[(r * 2 + c) % 6]));
    gems[3][0] = 'blue'; gems[3][1] = 'red'; gems[3][2] = 'red';
    gems[3][4] = 'red'; gems[2][3] = 'red';
    const shields = blankSpecials(7).map((row) => row.map(() => 0)); shields[3][3] = 2;
    const def = { board: gems, specials: blankSpecials(7), shields, gemTypes: colors,
      gemWeights: {}, refillState: 12345, boardSize: 7, generatorVersion: 5 };
    const result = simulateShieldMove(def, def, [2, 3, 3, 3])!;
    expect(result.events[0].created).toContainEqual(expect.objectContaining({ row: 3, col: 3, type: 'row' }));
    expect(result.events[0].shieldHits).not.toContainEqual(expect.objectContaining({ row: 3, col: 3 }));
    expect(shields[3][3]).toBe(2);
  });

  test('invalid shield definitions and impossible progress fail closed', () => {
    const def = fixture(); def.shields[3]![3] = 2;
    expect(validShields(def.shields, 6)).toBe(true);
    expect(shieldCount(def.shields)).toBe(1);
    expect(validShields([[3]], 6)).toBe(false);
    const invented = blankSpecials(6).map((row) => row.map(() => 0)); invented[0][0] = 1; invented[3][3] = 2;
    expect(simulateShieldMove(def, { ...def, shields: invented }, [0, 0, 0, 1])).toBeNull();
    const initial = initialObjectiveProgress(def);
    expect(objectiveStatus(def, 9999, initial).complete).toBe(false);
    for (const report of [{ collected: {}, shieldsCleared: -1 }, { collected: {}, shieldsCleared: 2 },
      { collected: {}, shieldsCleared: 1.5 }, { collected: {} }, { collected: {}, shieldsCleared: 1, invented: 1 }]) {
      expect(objectiveStatus(def, 9999, report).complete).toBe(false);
    }
  });

  test('v5 generated shields are on a witnessed two-hit path, with browser/server parity in every mode', () => {
    const sandbox: any = {}; vm.createContext(sandbox);
    vm.runInContext(readFileSync('public/js/procedural-levels.js', 'utf8'), sandbox);
    for (const mode of ['classic', 'daily', 'timed', 'endless']) for (const level of mode === 'daily' ? [1] : [4, 8, 12, 20]) {
      const def = generateLevel(level, context, mode, 5);
      expect(JSON.parse(JSON.stringify(sandbox.InfiniteLevels.generateLevel(level, context, mode, 5)))).toEqual(def);
      expect(validShields(def.shields, def.boardSize)).toBe(true);
      const proof = certifyLevel(def);
      let state: any = { board: def.board, specials: def.specials, shields: def.shields, refillState: def.refillState,
        objectiveProgress: initialObjectiveProgress(def) };
      let score = 0;
      for (const cells of proof.witness) {
        const server = simulateLevelMove(def, state, cells)!;
        expect(server).not.toBeNull();
        expect(JSON.parse(JSON.stringify(sandbox.InfiniteLevels.simulateLevelMove(def, state, cells)))).toEqual(server);
        score += server.score; state = server;
      }
      expect(score).toBe(def.quality.verifiedScore);
      expect(proof.objectivesComplete).toBe(true);
      expect(state.objectiveProgress.shieldsCleared).toBe(def.quality.verifiedShields);
      expect(shieldCount(state.shields)).toBe(0);
      expect(objectiveStatus(def, score, state.objectiveProgress).complete).toBe(true);
    }
  }, 30000);
});
