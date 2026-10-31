/** Rules: locked gem obstacle. A locked gem is terrain on an ordinary gem cell:
 * the gem underneath stays playable but the cell cannot be swapped until a match
 * clears the lock's cell. Locked gems never fall, swap, refill, or spread.
 * Only the v7 path calls these. Locked gems never share a level with spreading
 * blockers (each v7 definition adds exactly one obstacle objective). */
import { hashSeed } from './match-core.js';
import { simulateSpecialMove, certifySpecialBoard } from './special-rules.js';

export const LOCKED_GEM_CAP = 8;
export const LOCKED_GEM_STAGE_COUNT = 3;

const lockedKeyOf = (row, col) => `${row},${col}`;

export function blankLockedGems(size) {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

export function validLockedGems(locked, size) {
  return Array.isArray(locked) && locked.length === size && locked.every((row) =>
    Array.isArray(row) && row.length === size && row.every((value) => value === 0 || value === 1));
}

export function lockedGemCount(locked) {
  return locked.flat().filter(Boolean).length;
}

export function lockedGemKeys(locked) {
  const keys = [];
  locked.forEach((row, r) => row.forEach((value, c) => { if (value) keys.push(lockedKeyOf(r, c)); }));
  return keys;
}

/** An ordinary gem cell that may hold a lock. Not a special anchor, not a shield cell. */
export function lockEligible(locked, specials, shields, row, col) {
  return !locked[row][col] && !specials[row][col] && !shields[row][col];
}

/** Removes locks on the cleared keys. Returns { locked, cleared } with cleared sorted
 * by (row, col). Keys that are not locks are ignored. Returns null for invalid input. */
export function clearLockedGems(locked, clearedKeys) {
  const size = locked?.length;
  if (!validLockedGems(locked, size) || !Array.isArray(clearedKeys)) return null;
  const copy = locked.map((row) => row.slice());
  const cleared = [];
  for (const key of new Set(clearedKeys)) {
    if (typeof key !== 'string') return null;
    const [row, col] = key.split(',').map(Number);
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= size || col >= size) continue;
    if (!copy[row][col]) continue;
    copy[row][col] = 0;
    cleared.push([row, col]);
  }
  cleared.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return { locked: copy, cleared: cleared.map(([r, c]) => lockedKeyOf(r, c)) };
}

/** Place up to LOCKED_GEM_STAGE_COUNT locks only on cells the no-booster witness clears.
 * Same deterministic witness-based placement as shields and blockers. */
export function witnessedLockedGems(board, refillState, palette, weights, specials, witness, seed) {
  const n = board.length;
  const clears = new Map();
  let state = { board, specials, refillState };
  for (const cells of witness) {
    const next = simulateSpecialMove(state.board, state.refillState, palette, weights, cells, state.specials);
    if (!next) throw new Error('locked_gem_witness_invalid');
    for (const event of next.events) for (const key of event.cleared) clears.set(key, (clears.get(key) || 0) + 1);
    state = next;
  }
  const candidates = [...clears.keys()].filter((key) => {
    const [row, col] = key.split(',').map(Number);
    return !specials[row][col];
  }).sort();
  const locked = blankLockedGems(n);
  if (!candidates.length) return locked;
  const offset = hashSeed(`${seed}|locked-gem-cells`) % candidates.length;
  for (let i = 0; i < Math.min(LOCKED_GEM_STAGE_COUNT, candidates.length); i++) {
    const [row, col] = candidates[(offset + i) % candidates.length].split(',').map(Number);
    locked[row][col] = 1;
  }
  return locked;
}

/** Apply removal (by cleared cells) to a shield-aware result. Locks never spread. */
function withLockedGemHits(result, initial) {
  if (!result) return null;
  let locked = initial.map((row) => row.slice());
  let brokenLocks = 0;
  const events = result.events.map((event) => {
    const lockHits = [];
    for (const key of event.cleared) {
      const [row, col] = key.split(',').map(Number);
      if (!locked[row][col]) continue;
      locked[row][col] = 0;
      brokenLocks++;
      lockHits.push({ row, col });
    }
    return { ...event, lockHits };
  });
  return { ...result, events, locked, brokenLocks };
}

/** One accepted player move: shield transition, then lock clears. No spread. */
export function simulateLockedGemMove(definition, state, cells, visualTrace = false) {
  const locked = state.locked ?? definition.lockedGems;
  const shielded = state.shields !== undefined
    ? simulateSpecialMove(state.board, state.refillState, definition.gemTypes,
      definition.gemWeights, cells, state.specials, true, visualTrace)
    : null;
  if (!shielded || !validLockedGems(locked, shielded.board.length)) return null;
  return withLockedGemHits(shielded, locked);
}

/** Booster clears remove locks they hit but never spread. */
export function simulateLockedGemClear(definition, state, keys, points, visualTrace = false) {
  const locked = state.locked ?? definition.lockedGems;
  const shielded = state.shields !== undefined
    ? simulateSpecialMove(state.board, state.refillState, definition.gemTypes,
      definition.gemWeights, keys, state.specials, false, visualTrace)
    : null;
  if (!shielded || !validLockedGems(locked, shielded.board.length)) return null;
  return withLockedGemHits(shielded, locked);
}

/** Replay the same no-booster path used to place locks, through the exact v7 transition. */
export function certifyLockedGemBoard(definition) {
  const { board, refillState, gemTypes, gemWeights, specials, lockedGems } = definition;
  const budget = definition.quality?.verifiedMoves || Math.min(30, definition.moves);
  const base = certifySpecialBoard(board, refillState, gemTypes, gemWeights, budget, specials, true);
  let state = { board, refillState, specials, shields: definition.shields, locked: lockedGems };
  let score = 0; let brokenLocks = 0;
  const collected = Object.fromEntries(gemTypes.map((color) => [color, 0]));
  for (const cells of base.witness) {
    state = simulateLockedGemMove(definition, state, cells);
    if (!state) throw new Error('locked_gem_witness_invalid');
    score += state.score; brokenLocks += state.brokenLocks;
    for (const color of gemTypes) collected[color] += state.collected[color];
  }
  return { score, witness: base.witness, collected, brokenLocks, locked: state.locked };
}

/** Exclude locked gem cells from legal swaps: a locked cell cannot be part of a swap. */
export function legalSwapsExcludingLocks(board, locked) {
  const size = board.length;
  const swaps = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (locked[r][c]) continue;
      // Right neighbor
      if (c + 1 < size && !locked[r][c + 1]) swaps.push([r, c, r, c + 1]);
      // Down neighbor
      if (r + 1 < size && !locked[r + 1][c]) swaps.push([r, c, r + 1, c]);
    }
  }
  return swaps;
}
