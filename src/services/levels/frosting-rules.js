/** Rules v6: frosting terrain tiles. Frosting is a layered obstacle on top of
 * ordinary gem cells, like shields but applied to gems. Each cell can carry 1-3
 * layers of frosting. A match that clears the gem on a frosted cell removes one
 * layer; once all layers are gone the cell is clear. Frosting never blocks swaps
 * and never spreads. Classic only: daily, timed and endless never receive frosting.
 */
import { hashSeed } from './match-core.js';
import { simulateSpecialMove, blankSpecials } from './special-rules.js';

export const FROSTING_MAX_LAYERS = 3;

export function validFrosting(frosting, size) {
  return Array.isArray(frosting) && frosting.length === size && frosting.every((row) =>
    Array.isArray(row) && row.length === size && row.every((value) =>
      Number.isInteger(value) && value >= 0 && value <= FROSTING_MAX_LAYERS));
}

export function frostingCount(frosting) {
  return frosting.flat().filter(Boolean).length;
}

/** Blank grid of zeros. */
export function blankFrosting(size) {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

/** Place frosting only on cells the no-inventory witness actually clears, up to FROSTING_CAP.
 * Same existence-proof pattern as witnessedShields. Cells cleared 2+ times get 2 layers,
 * cells cleared 3+ times get 3 layers.
 */
export function witnessedFrosting(board, refillState, palette, weights, specials, witness, seed) {
  const n = board.length;
  const clears = new Map();
  let state = { board, specials, refillState };
  for (const cells of witness) {
    const next = simulateSpecialMove(state.board, state.refillState, palette, weights, cells, state.specials);
    if (!next) throw new Error('frosting_witness_invalid');
    for (const event of next.events) for (const key of event.cleared) clears.set(key, (clears.get(key) || 0) + 1);
    state = next;
  }
  const candidates = [...clears.entries()].filter(([, hits]) => hits >= 1).map(([key]) => key).sort();
  const frosting = blankFrosting(n);
  if (!candidates.length) return frosting;
  const offset = hashSeed(`${seed}|frosting-cells`) % candidates.length;
  const cap = Math.min(6, candidates.length);
  for (let i = 0; i < cap; i++) {
    const [row, col] = candidates[(offset + i) % candidates.length].split(',').map(Number);
    const hits = clears.get(`${row},${col}`);
    frosting[row][col] = hits >= 3 ? 3 : hits >= 2 ? 2 : 1;
  }
  return frosting;
}

/** Clear frosting layers on cells covered by a clear event. Each covered cell loses
 * one layer. Returns { frosting, cleared: number of layers removed }. */
export function clearFrosting(frosting, clearedKeys) {
  const copy = frosting.map((row) => row.slice());
  let lost = 0;
  for (const key of clearedKeys) {
    const [row, col] = key.split(',').map(Number);
    if (copy[row][col] > 0) {
      copy[row][col] -= 1;
      lost += 1;
    }
  }
  return { frosting: copy, cleared: lost };
}

/** Thread frosting layers through a simulate-style result. Frosting on cleared cells
 * loses one layer per clear. Never mutates input. */
export function applyFrostingClear(result, initialFrosting) {
  if (!result) return null;
  let grid = initialFrosting.map((row) => row.slice());
  const trace = result.presentation;
  if (trace) trace.initial.frosting = initialFrosting.map((row) => row.slice());
  const events = result.events.map((event, index) => {
    const visual = trace?.frames[index];
    if (visual) visual.before.frosting = grid.map((row) => row.slice());
    const cleared = clearFrosting(grid, event.cleared);
    grid = cleared.frosting;
    if (visual) visual.after.frosting = grid.map((row) => row.slice());
    return { ...event, frostingHits: cleared.cleared };
  });
  let totalFrostingHits = 0;
  for (const event of events) totalFrostingHits += event.frostingHits.length;
  return { ...result, events, frosting: grid, frostingCleared: totalFrostingHits };
}

/** Certify a frosting level: run the no-inventory witness and confirm every frosting
 * cell is fully cleared by the witness path. Returns { score, collected, frostingCleared, events }.
 */
export function certifyFrostingBoard(definition) {
  const { board, refillState, gemTypes, gemWeights, specials, witness, frosting } = definition;
  if (!Array.isArray(witness) || witness.length === 0) throw new Error('frosting_certify_no_witness');
  let state = { board, specials: specials || blankSpecials(board.length), refillState };
  let score = 0;
  const collected = Object.fromEntries(gemTypes.map((color) => [color, 0]));
  let frostingCleared = 0;
  for (const cells of witness) {
    const next = simulateSpecialMove(state.board, state.refillState, gemTypes, gemWeights, cells, state.specials, true);
    if (!next) throw new Error('frosting_certify_move_failed');
    score += next.score || 0;
    for (const color of gemTypes) collected[color] = (collected[color] || 0) + (next.collected?.[color] || 0);
    const cleared = applyFrostingClear(next, state.frosting || blankFrosting(board.length));
    state.frosting = cleared.frosting;
    frostingCleared += cleared.frostingCleared || 0;
    state = { board: next.board, specials: next.specials, refillState: next.refillState };
  }
  const remaining = frostingCount(state.frosting || blankFrosting(board.length));
  if (remaining > 0) throw new Error(`frosting_certify_incomplete:${remaining}`);
  return { score, collected, frostingCleared, events: [] };
}

export default {
  validFrosting, frostingCount, blankFrosting, witnessedFrosting, clearFrosting,
  applyFrostingClear, certifyFrostingBoard, FROSTING_MAX_LAYERS,
};
