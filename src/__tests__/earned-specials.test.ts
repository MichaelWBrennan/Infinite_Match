import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { blankSpecials, earnedMatches, specialActions, simulateSpecialMove, simulateSpecialClear } from '../services/levels/special-rules.js';
import { generateLevel, certifyLevel, simulateLevelMove, matchingCells, legalSwaps, levelActions } from '../services/levels/generator.js';

const palette = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const rng = 12345;
const board = (size = 7) => Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => palette[(r * 2 + c) % palette.length]!));
const freeze = (value: any): any => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
function fourFixture() {
  const tiles = board();
  tiles[3]![0] = 'blue'; tiles[3]![1] = 'red'; tiles[3]![2] = 'red'; tiles[3]![4] = 'red'; tiles[2]![3] = 'red';
  expect(matchingCells(tiles).size).toBe(0);
  return tiles;
}
function assertStable(result: any) {
  expect(matchingCells(result.board).size).toBe(0);
  expect(specialActions(result.board, result.specials).length).toBeGreaterThan(0);
  expect(result.specials.length).toBe(result.board.length);
  for (const row of result.board) for (const type of row) expect(palette).toContain(type);
  const origins = result.origins.flat().filter(Boolean);
  expect(new Set(origins).size).toBe(origins.length);
  expect(result.events.length).toBeLessThanOrEqual(64);
}

describe('earned creation rules', () => {
  test.each(['row', 'column'])('four in a %s earns the matching Beam', (kind) => {
    const tiles = board();
    if (kind === 'row') tiles[3]![0] = 'blue';
    for (let i = 1; i <= 4; i++) tiles[kind === 'row' ? 3 : i]![kind === 'row' ? i : 3] = 'red';
    expect(earnedMatches(tiles).creations.map((item) => item.type)).toEqual([kind]);
  });

  test.each([5, 6, 7])('a %s-gem line earns one Prism, not multiple Beams', (length) => {
    const tiles = board();
    for (let i = 0; i < length; i++) tiles[3]![i] = 'red';
    expect(earnedMatches(tiles).creations).toHaveLength(1);
    expect(earnedMatches(tiles).creations[0]!.type).toBe('prism');
  });

  test.each([
    [[3, 2], [3, 3], [3, 4], [2, 3], [1, 3]],
    [[2, 2], [2, 3], [2, 4], [3, 2], [4, 2]],
    [[3, 2], [3, 3], [3, 4], [2, 3], [4, 3]],
  ])('intersecting L/T/+ matches earn one Burst', (...cells: any[]) => {
    const tiles = board();
    for (const [r, c] of cells) tiles[r]![c] = 'red';
    expect(earnedMatches(tiles).creations.map((item) => item.type)).toEqual(['burst']);
  });

  test('line-five precedence wins over an intersecting Burst', () => {
    const tiles = board();
    for (let c = 1; c <= 5; c++) tiles[3]![c] = 'red';
    tiles[1]![3] = 'red'; tiles[2]![3] = 'red';
    expect(earnedMatches(tiles).creations.map((item) => item.type)).toEqual(['prism']);
  });

  test('the swapped destination anchors a newly earned special, without consuming it immediately', () => {
    const tiles = fourFixture();
    const result = simulateSpecialMove(tiles, rng, palette, {}, [2, 3, 3, 3])!;
    expect(result.events[0]!.created).toEqual([{ row: 3, col: 3, type: 'row', color: 'red' }]);
    expect(result.events[0]!.cleared).not.toContain('3,3');
    expect(result.events[0]!.cleared).toHaveLength(3);
    expect(result.events[0]!.points).toBe(30);
    assertStable(result);
  });

  test('new anchors survive another special firing during the same wave', () => {
    const tiles = fourFixture();
    const specials = blankSpecials(7);
    specials[3]![1] = 'column';
    const result = simulateSpecialMove(tiles, rng, palette, {}, [2, 3, 3, 3], specials)!;
    expect(result.events[0]!.created[0]).toMatchObject({ row: 3, col: 3, type: 'row' });
    expect(result.events[0]!.activated).toEqual([{ row: 3, col: 1, type: 'column' }]);
    expect(result.events[0]!.cleared).not.toContain('3,3');
    assertStable(result);
  });

  test('an ordinary three does not award a special', () => {
    const tiles = board();
    tiles[3]![1] = 'blue'; tiles[3]![2] = 'blue'; tiles[3]![3] = 'blue';
    expect(earnedMatches(tiles).creations).toEqual([]);
  });
});

describe('activation and combinations', () => {
  test.each([['row', 7], ['column', 7], ['burst', 9]] as const)('tap %s clears its expected footprint (%s)', (kind, count) => {
    const specials = blankSpecials(7); specials[3]![3] = kind;
    const result = simulateSpecialMove(board(), rng, palette, {}, [3, 3], specials)!;
    expect(result.events[0]!.cleared).toHaveLength(count);
    expect(result.events[0]!.activated).toEqual([{ row: 3, col: 3, type: kind }]);
    assertStable(result);
  });

  test('Prism taps its own color and swaps to its neighbour’s color', () => {
    const tiles = board();
    const specials = blankSpecials(7); specials[3]![3] = 'prism';
    const tap = simulateSpecialMove(tiles, rng, palette, {}, [3, 3], specials)!;
    const ownCount = tiles.flat().filter((type) => type === tiles[3]![3]).length;
    expect(tap.events[0]!.cleared).toHaveLength(ownCount);
    const swap = simulateSpecialMove(tiles, rng, palette, {}, [3, 3, 3, 4], specials)!;
    const neighbour = tiles[3]![4];
    const targetCount = tiles.flat().filter((type) => type === neighbour).length;
    expect(swap.events[0]!.cleared).toHaveLength(targetCount + 1);
    expect(swap.events[0]!.cleared).toContain('3,4');
    assertStable(swap);
  });

  test('a non-matching swap still activates an earned special in its new position', () => {
    const specials = blankSpecials(7); specials[3]![3] = 'row';
    const result = simulateSpecialMove(board(), rng, palette, {}, [3, 3, 4, 3], specials)!;
    expect(result.events[0]!.cleared).toHaveLength(7);
    expect(result.events[0]!.cleared).toContain('4,0');
    expect(result.events[0]!.activated[0]).toMatchObject({ row: 4, col: 3, type: 'row' });
  });

  test('specials hit by another effect fire exactly once in that wave', () => {
    const specials = blankSpecials(7); specials[3]![3] = 'row'; specials[3]![5] = 'column';
    const result = simulateSpecialMove(board(), rng, palette, {}, [3, 3], specials)!;
    expect(result.events[0]!.activated).toHaveLength(2);
    expect(result.events[0]!.cleared).toHaveLength(13);
    expect(new Set(result.events[0]!.cleared).size).toBe(13);
  });

  test.each([
    ['row', 'column', 'beam+beam', 13], ['row', 'row', 'beam+beam', 13],
    ['column', 'column', 'beam+beam', 13], ['burst', 'burst', 'burst+burst', 25],
    ['row', 'burst', 'beam+burst', 33], ['prism', 'prism', 'prism+prism', 49],
  ])('%s + %s uses the documented %s footprint', (one, two, combo, count) => {
    const specials = blankSpecials(7); specials[3]![3] = one; specials[3]![4] = two;
    const result = simulateSpecialMove(board(), rng, palette, {}, [3, 3, 3, 4], specials)!;
    expect(result.events[0]!.combo).toBe(combo);
    expect(result.events[0]!.cleared).toHaveLength(count);
    assertStable(result);
  });

  test.each(['row', 'column', 'burst'])('Prism + %s converts and fires that color, including the original partner', (kind) => {
    const specials = blankSpecials(7); specials[3]![3] = 'prism'; specials[3]![4] = kind;
    const tiles = board();
    const count = tiles.flat().filter((color) => color === tiles[3]![4]).length;
    const result = simulateSpecialMove(tiles, rng, palette, {}, [3, 3, 3, 4], specials)!;
    expect(result.events[0]!.combo).toBe(`prism+${kind}`);
    expect(result.events[0]!.activated.filter((item) => item.type === kind)).toHaveLength(count);
    expect(result.events[0]!.activated.some((item) => item.row === 3 && item.col === 3 && item.type === kind)).toBe(true);
    assertStable(result);
  });

  test('edge Bursts and combinations are clipped, never wrapped to another edge', () => {
    const specials = blankSpecials(7); specials[0]![0] = 'burst';
    const result = simulateSpecialMove(board(), rng, palette, {}, [0, 0], specials)!;
    expect(result.events[0]!.cleared.sort()).toEqual(['0,0', '0,1', '1,0', '1,1']);
  });

  test('a special remains a free legal opportunity when plain swaps deadlock', () => {
    const tiles = Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => palette[(r + c) % 6]!));
    expect(legalSwaps(tiles)).toHaveLength(0);
    const specials = blankSpecials(6); specials[0]![0] = 'burst';
    expect(specialActions(tiles, specials).some((action) => action.cells.length === 2)).toBe(true);
  });

  test('inventory clears can trigger earned gems, keeping their base award and consuming no move in the engine', () => {
    const tiles = board(); const specials = blankSpecials(7); specials[3]![3] = 'row';
    const result = simulateSpecialClear(tiles, rng, palette, {}, ['3,3'], specials, 500)!;
    expect(result.events[0]!.points).toBe(560); // 500 base + six additional cells from the earned Beam.
    expect(result.events[0]!.activated).toEqual([{ row: 3, col: 3, type: 'row' }]);
    assertStable(result);
  });
});

describe('determinism, certification and upgrade safety', () => {
  test('frozen inputs and hint enumeration are never mutated', () => {
    const tiles = freeze(fourFixture()); const specials = freeze(blankSpecials(7));
    const before = JSON.stringify([tiles, specials]);
    const first = simulateSpecialMove(tiles, rng, palette, {}, [2, 3, 3, 3], specials);
    expect(simulateSpecialMove(tiles, rng, palette, {}, [2, 3, 3, 3], specials)).toEqual(first);
    specialActions(tiles, specials);
    expect(JSON.stringify([tiles, specials])).toBe(before);
  });

  test.each([[0, 0], [0, 0, 2, 0], [-1, 0, 0, 0], [0, 0, 7, 0], [0, 0, 0, 0], [0, 0, 0.5, 1]])('invalid action %j costs nothing and does not advance RNG', (...cells) => {
    const tiles = fourFixture(); const specials = blankSpecials(7);
    const before = JSON.stringify([tiles, specials]);
    expect(simulateSpecialMove(tiles, rng, palette, {}, cells, specials)).toBeNull();
    expect(JSON.stringify([tiles, specials])).toBe(before);
  });

  test('malformed states/clear keys are refused without throwing', () => {
    expect(simulateSpecialMove(null, rng, palette, {}, [0, 0])).toBeNull();
    expect(simulateSpecialMove(board(), -1, palette, {}, [0, 0])).toBeNull();
    expect(simulateSpecialMove(board(), rng, palette, {}, [0, 0], [['fake']])).toBeNull();
    expect(simulateSpecialClear(board(), rng, palette, {}, ['not-a-cell'])).toBeNull();
    expect(simulateSpecialClear(board(), rng, palette, {}, {})).toBeNull();
    expect(simulateSpecialClear(board(), rng, palette, {}, ['7,0'])).toBeNull();
  });

  test('cascade repair is bounded under deliberately extreme refill weights', () => {
    const specials = blankSpecials(7); specials[3]![3] = 'prism';
    const result = simulateSpecialMove(board(), rng, palette, { red: 1e100 }, [3, 3], specials)!;
    assertStable(result);
    expect(Number.isFinite(result.score)).toBe(true);
  });

  test('frozen v2 fixtures reproduce exactly and use plain-gem rules', () => {
    const fixtures = JSON.parse(readFileSync('src/__tests__/fixtures/generator-v2.json', 'utf8'));
    for (const old of fixtures) {
      expect(generateLevel(old.level, old.context, old.mode, 2)).toEqual(old);
      expect(old.specials).toBeUndefined();
      const proof = certifyLevel(old);
      expect(proof.score).toBe(old.quality.verifiedScore);
      expect(proof.witness.every((cells: number[]) => cells.length === 4)).toBe(true);
    }
  });

  test('v3 no-inventory witnesses replay through the exact same browser bundle', () => {
    const sandbox: any = {};
    vm.createContext(sandbox);
    vm.runInContext(readFileSync('public/js/procedural-levels.js', 'utf8'), sandbox);
    const context = { localDate: '2026-10-10', timeZone: 'America/New_York', country: 'US', region: 'PA', month: 10,
      season: 'autumn', hemisphere: 'north', holidays: [], timeOfDay: { period: 'evening' }, weather: { available: false } };
    let earned = 0;
    for (let number = 1; number <= 25; number++) {
      const definition = generateLevel(number, context, 'classic', 3);
      let state: any = { board: definition.board, specials: definition.specials, refillState: definition.refillState };
      const proof = certifyLevel(definition);
      let total = 0;
      for (const cells of proof.witness) {
        const next = simulateLevelMove(definition, state, cells)!;
        const browser = sandbox.InfiniteLevels.simulateLevelMove(definition, state, cells);
        expect(JSON.parse(JSON.stringify(browser))).toEqual(next);
        earned += next.events.flatMap((event: any) => event.created).length;
        total += next.score; state = next;
        expect(levelActions(definition, state.board, state.specials).length).toBeGreaterThan(0);
      }
      expect(total).toBe(definition.quality.verifiedScore);
      expect(total).toBeGreaterThanOrEqual(definition.targetScore);
    }
    expect(earned).toBeGreaterThan(0);
  }, 20000);
});
