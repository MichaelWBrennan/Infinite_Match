import { describe, expect, test } from '@jest/globals';
import {
  BLOCKER_CAP, blankBlockers, validBlockers, blockerCount, blockerKeys,
  spreadBlockers, clearBlockers,
} from '../services/levels/blocker-rules.js';

const grid = (size) => Array.from({ length: size }, () => new Array(size).fill(null));
const zeros = (size) => blankBlockers(size);
const place = (size, keys) => {
  const b = zeros(size);
  for (const key of keys) { const [r, c] = key.split(',').map(Number); b[r][c] = 1; }
  return b;
};

describe('blocker validation and counting', () => {
  test('blank grid is valid and empty', () => {
    expect(validBlockers(blankBlockers(5), 5)).toBe(true);
    expect(blockerCount(blankBlockers(5))).toBe(0);
  });
  test('rejects wrong size, non-binary values and non-arrays', () => {
    expect(validBlockers(blankBlockers(4), 5)).toBe(false);
    const bad = zeros(3);
    bad[1][1] = 2;
    expect(validBlockers(bad, 3)).toBe(false);
    expect(validBlockers(null, 3)).toBe(false);
  });
  test('blockerKeys lists row-major keys', () => {
    expect(blockerKeys(place(3, ['2,0', '0,1']))).toEqual(['0,1', '2,0']);
  });
});

describe('spread rule', () => {
  test('grows into one orthogonal neighbour, lowest row,col first', () => {
    const b = place(5, ['2,2']);
    const out = spreadBlockers(b, grid(5), zeros(5));
    // neighbours: (1,2) (3,2) (2,1) (2,3). Lowest by (row,col) is (1,2).
    expect(out.spread).toBe('1,2');
    expect(blockerKeys(out.blockers)).toEqual(['1,2', '2,2']);
  });

  test('a single spread per move, even with several blockers', () => {
    const out = spreadBlockers(place(5, ['1,1', '3,3']), grid(5), zeros(5));
    expect(blockerCount(out.blockers)).toBe(3);
    expect(out.spread).toBe('0,1');
  });

  test('tie-break uses numeric order, not string order', () => {
    // '10,0' sorts before '2,0' as a string; numeric order must pick '2,0' first.
    const b = place(12, ['1,0', '11,0']);
    expect(spreadBlockers(b, grid(12), zeros(12)).spread).toBe('0,0');
    const c = place(12, ['2,1', '10,0']);
    expect(spreadBlockers(c, grid(12), zeros(12)).spread).toBe('1,1');
  });

  test('never enters a special anchor', () => {
    const specials = grid(3);
    specials[0][1] = 'striped';
    const out = spreadBlockers(place(3, ['0,0']), specials, zeros(3));
    expect(out.spread).toBe('1,0');
  });

  test('never enters a shield cell', () => {
    const shields = zeros(3);
    shields[1][0] = 1;
    const out = spreadBlockers(place(3, ['0,0']), grid(3), shields);
    expect(out.spread).toBe('0,1');
  });

  test('does not enter an existing blocker', () => {
    // Neighbours: (1,0) from 0,0; (0,2) and (1,1) from 0,1. (0,1) itself is never chosen.
    const out = spreadBlockers(place(3, ['0,0', '0,1']), grid(3), zeros(3));
    expect(out.spread).toBe('0,2');
    expect(out.spread).not.toBe('0,1');
  });

  test('no eligible neighbour means no spread', () => {
    const specials = grid(2);
    specials[0][1] = 'x';
    specials[1][0] = 'x';
    const out = spreadBlockers(place(2, ['0,0']), specials, zeros(2));
    expect(out.spread).toBeNull();
    expect(blockerCount(out.blockers)).toBe(1);
  });

  test('stops at the cap', () => {
    const keys = ['0,0', '0,2', '2,0', '2,2', '1,1', '0,4'];
    const b = place(7, keys);
    expect(blockerCount(b)).toBe(BLOCKER_CAP);
    const out = spreadBlockers(b, grid(7), zeros(7));
    expect(out.spread).toBeNull();
    expect(blockerCount(out.blockers)).toBe(BLOCKER_CAP);
  });

  test('spreads up to the cap, not past it', () => {
    let b = place(7, ['3,3']);
    for (let i = 0; i < 20; i++) {
      const out = spreadBlockers(b, grid(7), zeros(7));
      b = out.blockers;
    }
    expect(blockerCount(b)).toBe(BLOCKER_CAP);
  });

  test('is deterministic and does not mutate its inputs', () => {
    const b = place(5, ['2,2']);
    const snapshot = JSON.stringify(b);
    const first = spreadBlockers(b, grid(5), zeros(5));
    const second = spreadBlockers(b, grid(5), zeros(5));
    expect(first).toEqual(second);
    expect(JSON.stringify(b)).toBe(snapshot);
  });

  test('rejects invalid input', () => {
    expect(spreadBlockers(zeros(3), grid(2), zeros(3))).toBeNull();
    expect(spreadBlockers(zeros(3), grid(3), zeros(2))).toBeNull();
    expect(spreadBlockers(null, grid(3), zeros(3))).toBeNull();
  });
});

describe('clear rule', () => {
  test('removes only the blockers on the cleared keys', () => {
    const b = place(4, ['0,0', '1,1', '3,3']);
    const out = clearBlockers(b, ['1,1', '2,2']);
    expect(blockerKeys(out.blockers)).toEqual(['0,0', '3,3']);
    expect(out.cleared).toEqual(['1,1']);
  });

  test('cleared list is sorted and deduplicated', () => {
    const b = place(4, ['3,3', '0,1']);
    const out = clearBlockers(b, ['3,3', '0,1', '3,3']);
    expect(out.cleared).toEqual(['0,1', '3,3']);
  });

  test('does not mutate its input', () => {
    const b = place(3, ['1,1']);
    clearBlockers(b, ['1,1']);
    expect(blockerKeys(b)).toEqual(['1,1']);
  });

  test('rejects invalid keys and input', () => {
    expect(clearBlockers(zeros(3), [42])).toBeNull();
    expect(clearBlockers(zeros(3), 'nope')).toBeNull();
    expect(clearBlockers(null, [])).toBeNull();
  });

  test('ignores out-of-range keys', () => {
    const out = clearBlockers(place(3, ['0,0']), ['9,9', '-1,0']);
    expect(out.cleared).toEqual([]);
    expect(blockerKeys(out.blockers)).toEqual(['0,0']);
  });
});
