/** Rules v6: chocolate terrain tiles. Chocolate spreads across the board like a
 * contagious obstacle: after each accepted player move, chocolate spreads from
 * each chocolate cell to one adjacent ordinary gem cell (lowest row,col eligible
 * neighbour), unless blocked by shields, specials, blockers, locked gems, or
 * existing chocolate. Chocolate can be cleared by matches over its cell, by
 * specials, or by inventory hits. Each chocolate cell is a single-layer obstacle
 * (cleared in one hit). Classic only: daily, timed and endless never receive chocolate.
 *
 * Chocolate never blocks swaps. It sits on top of gems like jelly, but unlike jelly
 * it spreads after each move, creating time pressure. Cap of 8 chocolate cells per
 * board stops runaway growth.
 */
import { hashSeed } from './match-core.js';
import { simulateSpecialMove, blankSpecials } from './special-rules.js';

export const CHOCOLATE_CAP = 8;

export function validChocolate(chocolate, size) {
  return Array.isArray(chocolate) && chocolate.length === size && chocolate.every((row) =>
    Array.isArray(row) && row.length === size && row.every((value) => value === 0 || value === 1));
}

export function chocolateCount(chocolate) {
  return chocolate.flat().filter(Boolean).length;
}

/** Blank grid of zeros. */
export function blankChocolate(size) {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

/** Place chocolate only on cells the no-inventory witness actually clears, up to CHOCOLATE_CAP.
 * Same existence-proof pattern as witnessedShields. One layer per cell.
 */
export function witnessedChocolate(board, refillState, palette, weights, specials, witness, seed) {
  const n = board.length;
  const clears = new Map();
  let state = { board, specials, refillState };
  for (const cells of witness) {
    const next = simulateSpecialMove(state.board, state.refillState, palette, weights, cells, state.specials);
    if (!next) throw new Error('chocolate_witness_invalid');
    for (const event of next.events) for (const key of event.cleared) clears.set(key, (clears.get(key) || 0) + 1);
    state = next;
  }
  const candidates = [...clears.entries()].filter(([, hits]) => hits >= 1).map(([key]) => key).sort();
  const chocolate = blankChocolate(n);
  if (!candidates.length) return chocolate;
  const offset = hashSeed(`${seed}|chocolate-cells`) % candidates.length;
  const cap = Math.min(CHOCOLATE_CAP, candidates.length);
  for (let i = 0; i < cap; i++) {
    const [row, col] = candidates[(offset + i) % candidates.length].split(',').map(Number);
    chocolate[row][col] = 1;
  }
  return chocolate;
}

/** Check if a cell is eligible for chocolate to spread into. */
export function spreadEligible(chocolate, specials, shields, blockers, locked, row, col, size) {
  if (row < 0 || row >= size || col < 0 || col >= size) return false;
  return !chocolate[row][col] && !specials[row][col] && !shields[row][col]
    && !blockers[row][col] && !locked[row][col];
}

/** Spread chocolate from each existing chocolate cell to one eligible neighbour.
 * Returns { chocolate, spread: [keys] } where spread is the list of newly chocolate cells.
 * Never mutates input. Deterministic: lowest row,col neighbour chosen.
 */
export function spreadChocolate(chocolate, specials, shields, blockers, locked) {
  const size = chocolate?.length;
  if (!validChocolate(chocolate, size)) return null;
  const copy = chocolate.map((row) => row.slice());
  const spread = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!copy[r][c]) continue;
      // Try neighbours in lowest row,col order: up, left, down, right
      const neighbours = [
        [r - 1, c], [r, c - 1], [r + 1, c], [r, c + 1],
      ];
      for (const [nr, nc] of neighbours) {
        if (spreadEligible(copy, specials, shields, blockers, locked, nr, nc, size)) {
          copy[nr][nc] = 1;
          spread.push(`${nr},${nc}`);
          break; // One spread per source cell per move
        }
      }
    }
  }
  return { chocolate: copy, spread };
}

/** Clear chocolate cells covered by a clear event. Returns { chocolate, cleared: count }. */
export function clearChocolate(chocolate, clearedKeys) {
  const copy = chocolate.map((row) => row.slice());
  let lost = 0;
  for (const key of clearedKeys) {
    const [row, col] = key.split(',').map(Number);
    if (copy[row][col] === 1) {
      copy[row][col] = 0;
      lost += 1;
    }
  }
  return { chocolate: copy, cleared: lost };
}

function validChocolateState(definition, state) {
  const n = state?.board?.length;
  return validChocolate(definition.chocolate, n) && validChocolate(state.chocolate, n)
    && state.chocolate.every((row, r) => row.every((v, c) => v <= definition.chocolate[r][c]));
}

/** Thread chocolate through a simulate-style result. Used by match-core's v6
 * transition to clear chocolate on cleared cells and rebuild state. Never mutates input.
 */
export function applyChocolateClear(result, initialChocolate) {
  if (!result) return null;
  const chocolate = initialChocolate.map((row) => row.slice());
  const trace = result.presentation;
  if (trace) trace.initial.chocolate = initialChocolate.map((row) => row.slice());
  const events = result.events.map((event, index) => {
    const visual = trace?.frames[index];
    if (visual) visual.before.chocolate = chocolate.map((row) => row.slice());
    const chocolateHits = [];
    for (const key of event.cleared) {
      const [row, col] = key.split(',').map(Number);
      if (chocolate[row][col] === 1) {
        chocolate[row][col] = 0;
        chocolateHits.push(key);
      }
    }
    if (visual) visual.after.chocolate = chocolate.map((row) => row.slice());
    return { ...event, chocolateHits };
  });
  let totalChocolateHits = 0;
  for (const event of events) totalChocolateHits += event.chocolateHits.length;
  return { ...result, events, chocolate, chocolateCleared: totalChocolateHits };
}

/** Certify a chocolate level: run the no-inventory witness and confirm every chocolate
 * cell is cleared by the witness path. Returns { score, collected, chocolateCleared, events }.
 */
export function certifyChocolateBoard(definition) {
  const { board, refillState, gemTypes, gemWeights, specials, witness, chocolate } = definition;
  if (!Array.isArray(witness) || witness.length === 0) throw new Error('chocolate_certify_no_witness');
  let state = { board, specials: specials || blankSpecials(board.length), refillState };
  let score = 0;
  const collected = Object.fromEntries(gemTypes.map((color) => [color, 0]));
  let chocolateCleared = 0;
  for (const cells of witness) {
    const next = simulateSpecialMove(state.board, state.refillState, gemTypes, gemWeights, cells, state.specials, true);
    if (!next) throw new Error('chocolate_certify_move_failed');
    score += next.score || 0;
    for (const color of gemTypes) collected[color] = (collected[color] || 0) + (next.collected?.[color] || 0);
    const cleared = applyChocolateClear(next, state.chocolate || blankChocolate(board.length));
    state.chocolate = cleared.chocolate;
    chocolateCleared += cleared.chocolateCleared || 0;
    state = { board: next.board, specials: next.specials, refillState: next.refillState };
  }
  const remaining = chocolateCount(state.chocolate || blankChocolate(board.length));
  if (remaining > 0) throw new Error(`chocolate_certify_incomplete:${remaining}`);
  return { score, collected, chocolateCleared, events: [] };
}

export default {
  validChocolate, chocolateCount, blankChocolate, witnessedChocolate, spreadChocolate,
  clearChocolate, applyChocolateClear, certifyChocolateBoard, CHOCOLATE_CAP,
};
