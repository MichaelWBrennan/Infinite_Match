/** Rules v6: marmalade terrain tiles. Marmalade is a single-layer sticky
 * substance placed on top of ordinary gem cells. A match that clears the gem
 * on a marmalade cell removes the marmalade. Marmalade never blocks swaps
 * and never spreads. Classic only: daily, timed and endless never receive
 * marmalade.
 */
import { hashSeed } from './match-core.js';
import { simulateSpecialMove, blankSpecials } from './special-rules.js';

export const MARMALADE_CAP = 5;

export function validMarmalade(marmalade, size) {
  return Array.isArray(marmalade) && marmalade.length === size && marmalade.every((row) =>
    Array.isArray(row) && row.length === size && row.every((value) =>
      value === 0 || value === 1));
}

export function marmaladeCount(marmalade) {
  return marmalade.flat().filter(Boolean).length;
}

/** Blank grid of zeros. */
export function blankMarmalade(size) {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

/** Place marmalade only on cells the no-inventory witness actually clears, up to MARMALADE_CAP.
 * Same existence-proof pattern as witnessedShields.
 */
export function witnessedMarmalade(board, refillState, palette, weights, specials, witness, seed) {
  const n = board.length;
  const clears = new Map();
  let state = { board, specials, refillState };
  for (const cells of witness) {
    const next = simulateSpecialMove(state.board, state.refillState, palette, weights, cells, state.specials);
    if (!next) throw new Error('marmalade_witness_invalid');
    for (const event of next.events) for (const key of event.cleared) clears.set(key, (clears.get(key) || 0) + 1);
    state = next;
  }
  const candidates = [...clears.keys()].sort();
  const marmalade = blankMarmalade(n);
  if (!candidates.length) return marmalade;
  const offset = hashSeed(`${seed}|marmalade-cells`) % candidates.length;
  const cap = Math.min(MARMALADE_CAP, candidates.length);
  for (let i = 0; i < cap; i++) {
    const [row, col] = candidates[(offset + i) % candidates.length].split(',').map(Number);
    marmalade[row][col] = 1;
  }
  return marmalade;
}

/** Clear marmalade on cells covered by a clear event. Returns { marmalade, cleared: number removed }. */
export function clearMarmalade(marmalade, clearedKeys) {
  const copy = marmalade.map((row) => row.slice());
  let lost = 0;
  for (const key of clearedKeys) {
    const [row, col] = key.split(',').map(Number);
    if (copy[row][col] === 1) {
      copy[row][col] = 0;
      lost += 1;
    }
  }
  return { marmalade: copy, cleared: lost };
}

/** Thread marmalade through a simulate-style result. Marmalade on cleared cells
 * is removed. Never mutates input. */
export function applyMarmaladeClear(result, initialMarmalade) {
  if (!result) return null;
  let grid = initialMarmalade.map((row) => row.slice());
  const trace = result.presentation;
  if (trace) trace.initial.marmalade = initialMarmalade.map((row) => row.slice());
  const events = result.events.map((event, index) => {
    const visual = trace?.frames[index];
    if (visual) visual.before.marmalade = grid.map((row) => row.slice());
    const cleared = clearMarmalade(grid, event.cleared);
    grid = cleared.marmalade;
    if (visual) visual.after.marmalade = grid.map((row) => row.slice());
    return { ...event, marmaladeHits: cleared.cleared };
  });
  let totalMarmaladeHits = 0;
  for (const event of events) totalMarmaladeHits += event.marmaladeHits.length;
  return { ...result, events, marmalade: grid, marmaladeCleared: totalMarmaladeHits };
}

/** Certify a marmalade level: run the no-inventory witness and confirm every marmalade
 * cell is cleared by the witness path. Returns { score, collected, marmaladeCleared, events }.
 */
export function certifyMarmaladeBoard(definition) {
  const { board, refillState, gemTypes, gemWeights, specials, witness, marmalade } = definition;
  if (!Array.isArray(witness) || witness.length === 0) throw new Error('marmalade_certify_no_witness');
  let state = { board, specials: specials || blankSpecials(board.length), refillState, marmalade };
  let score = 0;
  const collected = Object.fromEntries(gemTypes.map((color) => [color, 0]));
  let marmaladeCleared = 0;
  for (const cells of witness) {
    const next = simulateSpecialMove(state.board, state.refillState, gemTypes, gemWeights, cells, state.specials, true);
    if (!next) throw new Error('marmalade_certify_move_failed');
    score += next.score || 0;
    for (const color of gemTypes) collected[color] = (collected[color] || 0) + (next.collected?.[color] || 0);
    const cleared = applyMarmaladeClear(next, state.marmalade || blankMarmalade(board.length));
    state.marmalade = cleared.marmalade;
    marmaladeCleared += cleared.marmaladeCleared || 0;
    state = { board: next.board, specials: next.specials, refillState: next.refillState };
  }
  const remaining = marmaladeCount(state.marmalade || blankMarmalade(board.length));
  if (remaining > 0) throw new Error(`marmalade_certify_incomplete:${remaining}`);
  return { score, collected, marmaladeCleared, events: [] };
}

export default {
  validMarmalade, marmaladeCount, blankMarmalade, witnessedMarmalade, clearMarmalade,
  applyMarmaladeClear, certifyMarmaladeBoard, MARMALADE_CAP,
};
