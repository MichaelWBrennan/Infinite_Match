/** Rules v6: spreading blocker overlay. A blocker is terrain on an ordinary gem cell, like a
 * shield, but it never changes the gem grid. The witnessed no-booster path is therefore the
 * same path as v5. A match that clears a blocker's cell removes it. After each ACCEPTED player
 * move, one blocker spreads into the lowest (row, col) eligible orthogonal neighbour: never a
 * special anchor, a shield cell, or an existing blocker. Total blockers are capped at
 * BLOCKER_CAP. Booster clears remove blockers but do not spread. Only the v6 path calls these. */
import { hashSeed } from './match-core.js';
import { simulateSpecialMove, certifySpecialBoard } from './special-rules.js';
import { simulateShieldMove, simulateShieldClear } from './shield-rules.js';

export const BLOCKER_CAP = 6;
export const BLOCKER_STAGE_COUNT = 3;

const blockerKeyOf = (row, col) => `${row},${col}`;

export function blankBlockers(size) {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

export function validBlockers(blockers, size) {
  return Array.isArray(blockers) && blockers.length === size && blockers.every((row) =>
    Array.isArray(row) && row.length === size && row.every((value) => value === 0 || value === 1));
}

export function blockerCount(blockers) {
  return blockers.flat().filter(Boolean).length;
}

export function blockerKeys(blockers) {
  const keys = [];
  blockers.forEach((row, r) => row.forEach((value, c) => { if (value) keys.push(blockerKeyOf(r, c)); }));
  return keys;
}

/** An ordinary gem cell that a blocker may grow into. */
export function spreadEligible(blockers, specials, shields, row, col) {
  return !blockers[row][col] && !specials[row][col] && !shields[row][col];
}

function compareKeys(a, b) {
  return a[0] - b[0] || a[1] - b[1];
}

/** Returns { blockers, spread } where spread is the 'r,c' key that gained a blocker, or null.
 * Returns null for invalid input. Never mutates its arguments. */
export function spreadBlockers(blockers, specials, shields, cap = BLOCKER_CAP) {
  const size = blockers?.length;
  if (!validBlockers(blockers, size) || !Array.isArray(specials) || specials.length !== size
    || !Array.isArray(shields) || shields.length !== size) return null;
  const copy = blockers.map((row) => row.slice());
  if (blockerCount(blockers) >= cap) return { blockers: copy, spread: null };
  let best = null;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!blockers[r][c]) continue;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue;
        if (!spreadEligible(blockers, specials, shields, nr, nc)) continue;
        if (!best || compareKeys([nr, nc], best) < 0) best = [nr, nc];
      }
    }
  }
  if (!best) return { blockers: copy, spread: null };
  copy[best[0]][best[1]] = 1;
  return { blockers: copy, spread: blockerKeyOf(best[0], best[1]) };
}

/** Removes blockers on the cleared keys. Returns { blockers, cleared } with cleared sorted
 * by (row, col). Keys that are not blockers are ignored. Returns null for invalid input. */
export function clearBlockers(blockers, clearedKeys) {
  const size = blockers?.length;
  if (!validBlockers(blockers, size) || !Array.isArray(clearedKeys)) return null;
  const copy = blockers.map((row) => row.slice());
  const cleared = [];
  for (const key of new Set(clearedKeys)) {
    if (typeof key !== 'string') return null;
    const [row, col] = key.split(',').map(Number);
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= size || col >= size) continue;
    if (!copy[row][col]) continue;
    copy[row][col] = 0;
    cleared.push([row, col]);
  }
  cleared.sort(compareKeys);
  return { blockers: copy, cleared: cleared.map(([r, c]) => blockerKeyOf(r, c)) };
}

/** Place up to BLOCKER_STAGE_COUNT blockers only on cells the no-booster witness clears.
 * Same deterministic witness-based placement as shields, but on non-special cells. */
export function witnessedBlockers(board, refillState, palette, weights, specials, witness, seed) {
  const n = board.length;
  const clears = new Map();
  let state = { board, specials, refillState };
  for (const cells of witness) {
    const next = simulateSpecialMove(state.board, state.refillState, palette, weights, cells, state.specials);
    if (!next) throw new Error('blocker_witness_invalid');
    for (const event of next.events) for (const key of event.cleared) clears.set(key, (clears.get(key) || 0) + 1);
    state = next;
  }
  const candidates = [...clears.keys()].filter((key) => {
    const [row, col] = key.split(',').map(Number);
    return !specials[row][col];
  }).sort();
  const blockers = blankBlockers(n);
  if (!candidates.length) return blockers;
  const offset = hashSeed(`${seed}|blocker-cells`) % candidates.length;
  for (let i = 0; i < Math.min(BLOCKER_STAGE_COUNT, candidates.length); i++) {
    const [row, col] = candidates[(offset + i) % candidates.length].split(',').map(Number);
    blockers[row][col] = 1;
  }
  return blockers;
}

/** Apply removal (by cleared cells) and optional spread to a shield-aware result. */
function withBlockerHits(result, initial, spreadAfterMove) {
  if (!result) return null;
  let blockers = initial.map((row) => row.slice());
  let brokenBlockers = 0;
  const events = result.events.map((event) => {
    const blockerHits = [];
    for (const key of event.cleared) {
      const [row, col] = key.split(',').map(Number);
      if (!blockers[row][col]) continue;
      blockers[row][col] = 0;
      brokenBlockers++;
      blockerHits.push({ row, col });
    }
    return { ...event, blockerHits };
  });
  let spread = null;
  if (spreadAfterMove) {
    const next = spreadBlockers(blockers, result.specials, result.shields);
    if (!next) return null;
    blockers = next.blockers;
    spread = next.spread;
  }
  return { ...result, events, blockers, brokenBlockers, blockerSpread: spread };
}

/** One accepted player move: shield transition, then blocker clears, then one spread. */
export function simulateBlockerMove(definition, state, cells, visualTrace = false) {
  const blockers = state.blockers ?? definition.blockers;
  const shielded = simulateShieldMove(definition, { ...state, shields: state.shields ?? definition.shields }, cells, visualTrace);
  if (!shielded || !validBlockers(blockers, shielded.board.length)) return null;
  return withBlockerHits(shielded, blockers, true);
}

/** Booster clears remove blockers they hit but never spread. */
export function simulateBlockerClear(definition, state, keys, points, visualTrace = false) {
  const blockers = state.blockers ?? definition.blockers;
  const shielded = simulateShieldClear(definition, { ...state, shields: state.shields ?? definition.shields }, keys, points, visualTrace);
  if (!shielded || !validBlockers(blockers, shielded.board.length)) return null;
  return withBlockerHits(shielded, blockers, false);
}

/** Replay the same no-booster path used to place blockers, through the exact v6 transition. */
export function certifyBlockerBoard(definition) {
  const { board, refillState, gemTypes, gemWeights, specials } = definition;
  const budget = definition.quality?.verifiedMoves || Math.min(30, definition.moves);
  const base = certifySpecialBoard(board, refillState, gemTypes, gemWeights, budget, specials, true);
  let state = { board, refillState, specials, shields: definition.shields, blockers: definition.blockers };
  let score = 0; let brokenBlockers = 0; let brokenShields = 0;
  const collected = Object.fromEntries(gemTypes.map((color) => [color, 0]));
  for (const cells of base.witness) {
    state = simulateBlockerMove(definition, state, cells);
    if (!state) throw new Error('blocker_witness_invalid');
    score += state.score; brokenBlockers += state.brokenBlockers; brokenShields += state.brokenShields;
    for (const color of gemTypes) collected[color] += state.collected[color];
  }
  return { score, witness: base.witness, collected, brokenBlockers, brokenShields, blockers: state.blockers,
    shields: state.shields };
}
