/** Rules v6: liquorice lock terrain tiles. A liquorice lock sits on a cell and
 * prevents swaps involving that cell until an adjacent match clears it. Unlike
 * locked gems (which block the gem underneath until freed), liquorice locks block
 * the swap path itself: no swap may originate from or land on a locked cell.
 * A match that includes a cell adjacent to a lock clears the lock on the next
 * transition. Single-layer: one adjacent clear removes it entirely.
 *
 * Liquorice never spreads and never blocks gem matches directly — only swaps.
 * Classic only: daily, timed and endless never receive liquorice.
 */
import { hashSeed } from './match-core.js';
import { simulateSpecialMove, blankSpecials } from './special-rules.js';

export const LIQUORICE_CAP = 6;

export function validLiquorice(liquorice, size) {
  return Array.isArray(liquorice) && liquorice.length === size && liquorice.every((row) =>
    Array.isArray(row) && row.length === size && row.every((value) => value === 0 || value === 1));
}

export function liquoriceCount(liquorice) {
  return liquorice.flat().filter(Boolean).length;
}

/** Blank grid of zeros. */
export function blankLiquorice(size) {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

/** Check whether a cell has a liquorice lock. */
export function isLocked(liquorice, row, col, size) {
  return row >= 0 && row < size && col >= 0 && col < size && liquorice[row][col] === 1;
}

/** Check whether a swap between two cells is legal given liquorice locks.
 * A swap is illegal if either cell is locked. Returns true if the swap is allowed.
 */
export function swapLegalWithLiquorice(liquorice, cellA, cellB, size) {
  return !isLocked(liquorice, cellA[0], cellA[1], size)
    && !isLocked(liquorice, cellB[0], cellB[1], size);
}

/** Place liquorice only on cells the no-inventory witness actually clears, up to LIQUORICE_CAP.
 * Same existence-proof pattern as witnessedShields. One lock per cell.
 */
export function witnessedLiquorice(board, refillState, palette, weights, specials, witness, seed) {
  const n = board.length;
  const clears = new Map();
  let state = { board, specials, refillState };
  for (const cells of witness) {
    const next = simulateSpecialMove(state.board, state.refillState, palette, weights, cells, state.specials);
    if (!next) throw new Error('liquorice_witness_invalid');
    for (const event of next.events) for (const key of event.cleared) clears.set(key, (clears.get(key) || 0) + 1);
    state = next;
  }
  const candidates = [...clears.entries()].filter(([, hits]) => hits >= 1).map(([key]) => key).sort();
  const liquorice = blankLiquorice(n);
  if (!candidates.length) return liquorice;
  const offset = hashSeed(`${seed}|liquorice-cells`) % candidates.length;
  const cap = Math.min(LIQUORICE_CAP, candidates.length);
  for (let i = 0; i < cap; i++) {
    const [row, col] = candidates[(offset + i) % candidates.length].split(',').map(Number);
    liquorice[row][col] = 1;
  }
  return liquorice;
}

/** Return the set of liquorice lock keys adjacent to any cleared key. These locks
 * are cleared by the clear event. Returns { liquorice, cleared: [keys] }.
 */
export function clearLiquoriceAdjacent(liquorice, clearedKeys, size) {
  const copy = liquorice.map((row) => row.slice());
  const cleared = [];
  for (const key of clearedKeys) {
    const [r, c] = key.split(',').map(Number);
    for (const [nr, nc] of [[r - 1, c], [r, c - 1], [r + 1, c], [r, c + 1]]) {
      if (isLocked(copy, nr, nc, size)) {
        copy[nr][nc] = 0;
        cleared.push(`${nr},${nc}`);
      }
    }
  }
  return { liquorice: copy, cleared };
}

function validLiquoriceState(definition, state) {
  const n = state?.board?.length;
  return validLiquorice(definition.liquorice, n) && validLiquorice(state.liquorice, n)
    && state.liquorice.every((row, r) => row.every((v, c) => v <= definition.liquorice[r][c]));
}

/** Thread liquorice locks through a simulate-style result. Locks adjacent to cleared
 * cells are removed. Never mutates input. */
export function applyLiquoriceClear(result, initialLiquorice) {
  if (!result) return null;
  const size = result.board?.length || initialLiquorice.length;
  const liquorice = initialLiquorice.map((row) => row.slice());
  const trace = result.presentation;
  if (trace) trace.initial.liquorice = initialLiquorice.map((row) => row.slice());
  const events = result.events.map((event, index) => {
    const visual = trace?.frames[index];
    if (visual) visual.before.liquorice = liquorice.map((row) => row.slice());
    const cleared = clearLiquoriceAdjacent(liquorice, event.cleared, size);
    liquorice = cleared.liquorice;
    if (visual) visual.after.liquorice = liquorice.map((row) => row.slice());
    return { ...event, liquoriceHits: cleared.cleared };
  });
  let totalLiquoriceHits = 0;
  for (const event of events) totalLiquoriceHits += event.liquoriceHits.length;
  return { ...result, events, liquorice, liquoriceCleared: totalLiquoriceHits };
}

/** Certify a liquorice level: run the no-inventory witness and confirm every liquorice
 * cell is cleared by the witness path. Returns { score, collected, liquoriceCleared, events }.
 */
export function certifyLiquoriceBoard(definition) {
  const { board, refillState, gemTypes, gemWeights, specials, witness, liquorice } = definition;
  if (!Array.isArray(witness) || witness.length === 0) throw new Error('liquorice_certify_no_witness');
  let state = { board, specials: specials || blankSpecials(board.length), refillState };
  let score = 0;
  const collected = Object.fromEntries(gemTypes.map((color) => [color, 0]));
  let liquoriceCleared = 0;
  for (const cells of witness) {
    const next = simulateSpecialMove(state.board, state.refillState, gemTypes, gemWeights, cells, state.specials, true);
    if (!next) throw new Error('liquorice_certify_move_failed');
    score += next.score || 0;
    for (const color of gemTypes) collected[color] = (collected[color] || 0) + (next.collected?.[color] || 0);
    const cleared = applyLiquoriceClear(next, state.liquorice || blankLiquorice(board.length));
    state.liquorice = cleared.liquorice;
    liquoriceCleared += cleared.liquoriceCleared || 0;
    state = { board: next.board, specials: next.specials, refillState: next.refillState };
  }
  const remaining = liquoriceCount(state.liquorice || blankLiquorice(board.length));
  if (remaining > 0) throw new Error(`liquorice_certify_incomplete:${remaining}`);
  return { score, collected, liquoriceCleared, events: [] };
}

export default {
  validLiquorice, liquoriceCount, blankLiquorice, witnessedLiquorice, swapLegalWithLiquorice,
  clearLiquoriceAdjacent, applyLiquoriceClear, certifyLiquoriceBoard, LIQUORICE_CAP,
};
