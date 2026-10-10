/** Rules v5: fixed, two-layer shield tiles. Shields are terrain, not gems: they never fall,
 * swap, refill or block gem matches. Each actual clear on their cell removes one layer.
 * Only the second hit destroys a two-layer shield; protected special anchors and free
 * reshuffles do not hit them. These wrappers never alter the v2-v4 transition path. */
import { hashSeed } from './match-core.js';
import { blankSpecials, simulateSpecialMove, simulateSpecialClear, certifySpecialBoard } from './special-rules.js';

export function validShields(shields, size) {
  return Array.isArray(shields) && shields.length === size && shields.every((row) =>
    Array.isArray(row) && row.length === size && row.every((value) => Number.isInteger(value) && value >= 0 && value <= 2));
}

export function shieldCount(shields) {
  return shields.flat().filter(Boolean).length;
}

/** Place only on cells the existing no-inventory witness actually clears enough times.
 * This is an existence proof, not a promise of human-solvable difficulty. */
export function witnessedShields(board, refillState, palette, weights, specials, witness, seed) {
  const n = board.length;
  const clears = new Map();
  let state = { board, specials, refillState };
  for (const cells of witness) {
    const next = simulateSpecialMove(state.board, state.refillState, palette, weights, cells, state.specials);
    if (!next) throw new Error('shield_witness_invalid');
    for (const event of next.events) for (const key of event.cleared) clears.set(key, (clears.get(key) || 0) + 1);
    state = next;
  }
  // Prefer true two-hit obstacles; on short witnesses fall back to one-hit shields.
  const candidates = [...clears.entries()].filter(([, hits]) => hits >= 2).map(([key]) => key).sort();
  const fallback = candidates.length ? candidates : [...clears.keys()].sort();
  const shields = blankSpecials(n).map((row) => row.map(() => 0));
  if (!fallback.length) return shields;
  const offset = hashSeed(`${seed}|shield-cells`) % fallback.length;
  for (let i = 0; i < Math.min(3, fallback.length); i++) {
    const [row, col] = fallback[(offset + i) % fallback.length].split(',').map(Number);
    shields[row][col] = candidates.length ? 2 : 1;
  }
  return shields;
}

function validShieldState(definition, state) {
  const n = state?.board?.length;
  return validShields(definition.shields, n) && validShields(state.shields, n)
    && state.shields.every((row, r) => row.every((hits, c) => hits <= definition.shields[r][c]));
}

function withShieldHits(result, initial) {
  if (!result) return null;
  const shields = initial.map((row) => row.slice());
  // The trace is optional and read-only. Only the first three existing visual
  // frames receive terrain snapshots; all waves still resolve in the model.
  const trace = result.presentation;
  if (trace) trace.initial.shields = initial.map((row) => row.slice());
  let brokenShields = 0;
  const events = result.events.map((event, index) => {
    const visual = trace?.frames[index];
    if (visual) visual.before.shields = shields.map((row) => row.slice());
    const shieldHits = [];
    for (const key of event.cleared) {
      const [row, col] = key.split(',').map(Number);
      if (!shields[row][col]) continue;
      shields[row][col]--;
      if (!shields[row][col]) brokenShields++;
      shieldHits.push({ row, col, remaining: shields[row][col] });
    }
    if (visual) visual.after.shields = shields.map((row) => row.slice());
    return { ...event, shieldHits };
  });
  return { ...result, events, shields, brokenShields };
}

export function simulateShieldMove(definition, state, cells, visualTrace = false) {
  if (!validShieldState(definition, state)) return null;
  return withShieldHits(simulateSpecialMove(state.board, state.refillState, definition.gemTypes,
    definition.gemWeights, cells, state.specials, true, visualTrace), state.shields);
}

export function simulateShieldClear(definition, state, keys, points, visualTrace = false) {
  if (!validShieldState(definition, state)) return null;
  return withShieldHits(simulateSpecialClear(state.board, state.refillState, definition.gemTypes,
    definition.gemWeights, keys, state.specials, points, true, visualTrace), state.shields);
}

/** Replay the same no-booster path used to place shields, through the exact v5 transition. */
export function certifyShieldBoard(definition) {
  const { board, refillState, gemTypes, gemWeights, specials, shields } = definition;
  const budget = definition.quality?.verifiedMoves || Math.min(30, definition.moves);
  const base = certifySpecialBoard(board, refillState, gemTypes, gemWeights, budget, specials, true);
  let state = { board, refillState, specials, shields };
  let score = 0; let brokenShields = 0;
  const collected = Object.fromEntries(gemTypes.map((color) => [color, 0]));
  for (const cells of base.witness) {
    state = simulateShieldMove(definition, state, cells);
    if (!state) throw new Error('shield_witness_invalid');
    score += state.score; brokenShields += state.brokenShields;
    for (const color of gemTypes) collected[color] += state.collected[color];
  }
  return { score, witness: base.witness, collected, brokenShields, shields: state.shields };
}
