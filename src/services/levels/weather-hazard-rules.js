/** Rules v6: weather-driven board hazards. Each active weather condition places
 * a thematic hazard overlay on ordinary gem cells. Hazards are placed only on
 * cells the no-inventory witness path clears, so every placed hazard is
 * guaranteed clearable without boosters. Storm lightning spreads one cell per
 * accepted move; other hazards never spread. Classic only: daily, timed and
 * endless never receive weather hazards. */
import { hashSeed } from './match-core.js';
import { simulateSpecialMove, blankSpecials } from './special-rules.js';

export const WEATHER_HAZARD_CAP = 8;

/** Validate a weather hazard grid: size x size, each cell 0..3 layers. */
export function validWeatherHazards(hazards, size) {
  return Array.isArray(hazards) && hazards.length === size && hazards.every((row) =>
    Array.isArray(row) && row.length === size && row.every((value) =>
      Number.isInteger(value) && value >= 0 && value <= 3));
}

/** Count cells with at least one hazard layer. */
export function weatherHazardCount(hazards) {
  return hazards.flat().filter(Boolean).length;
}

/** Blank grid of zeros. */
export function blankWeatherHazards(size) {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

/** Place weather hazards only on cells the witness path clears. Cells cleared
 * multiple times get more layers, capped at 3. Returns a size x size grid. */
export function witnessedWeatherHazards(board, refillState, palette, weights, specials, witness, seed, hazardDef) {
  const n = board.length;
  const clears = new Map();
  let state = { board, specials, refillState };
  for (const cells of witness) {
    const next = simulateSpecialMove(state.board, state.refillState, palette, weights, cells, state.specials);
    if (!next) throw new Error('weather_hazard_witness_invalid');
    for (const event of next.events) for (const key of event.cleared) clears.set(key, (clears.get(key) || 0) + 1);
    state = next;
  }
  const candidates = [...clears.entries()].filter(([, hits]) => hits >= 1).map(([key]) => key).sort();
  const hazards = blankWeatherHazards(n);
  if (!candidates.length) return hazards;
  const offset = hashSeed(`${seed}|weather-hazard-cells`) % candidates.length;
  const cap = Math.min(hazardDef.cap, candidates.length);
  const layers = Math.min(3, hazardDef.layers);
  for (let i = 0; i < cap; i++) {
    const [row, col] = candidates[(offset + i) % candidates.length].split(',').map(Number);
    const hits = clears.get(`${row},${col}`);
    hazards[row][col] = Math.min(3, hits >= layers ? layers : hits);
  }
  return hazards;
}

/** Clear one hazard layer on each cell covered by clearedKeys. Returns
 * { hazards, cleared } where cleared is the number of layers removed. */
export function clearWeatherHazards(hazards, clearedKeys) {
  const size = hazards?.length;
  if (!validWeatherHazards(hazards, size) || !Array.isArray(clearedKeys)) return null;
  const copy = hazards.map((row) => row.slice());
  let lost = 0;
  for (const key of new Set(clearedKeys)) {
    if (typeof key !== 'string') return null;
    const [row, col] = key.split(',').map(Number);
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= size || col >= size) continue;
    if (!copy[row][col]) continue;
    copy[row][col] -= 1;
    lost += 1;
  }
  return { hazards: copy, cleared: lost };
}

/** Spread weather hazards: one new hazard cell per accepted move on the lowest
 * eligible orthogonal neighbour of an existing hazard cell. Never spreads onto
 * specials, shields, or existing hazards. Only used by storm lightning. */
export function spreadWeatherHazards(hazards, specials, shields, cap = WEATHER_HAZARD_CAP) {
  const size = hazards?.length;
  if (!validWeatherHazards(hazards, size) || !Array.isArray(specials) || specials.length !== size
    || !Array.isArray(shields) || shields.length !== size) return null;
  const copy = hazards.map((row) => row.slice());
  if (weatherHazardCount(hazards) >= cap) return { hazards: copy, spread: null };
  let best = null;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!copy[r][c]) continue;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue;
        if (copy[nr][nc] || specials[nr][nc] || shields[nr][nc]) continue;
        if (!best || nr < best[0] || (nr === best[0] && nc < best[1])) best = [nr, nc];
      }
    }
  }
  if (!best) return { hazards: copy, spread: null };
  copy[best[0]][best[1]] = 1;
  return { hazards: copy, spread: `${best[0]},${best[1]}` };
}

/** Thread hazard layers through a simulate-style result. Hazards on cleared cells
 * lose one layer per clear. Returns { ...result, hazards, hazardCleared }. */
export function applyWeatherHazardClear(result, initialHazards) {
  if (!result) return null;
  let grid = initialHazards.map((row) => row.slice());
  const events = result.events.map((event) => {
    const cleared = clearWeatherHazards(grid, event.cleared);
    if (!cleared) return event;
    grid = cleared.hazards;
    return { ...event, hazardHits: cleared.cleared };
  });
  let totalHazardHits = 0;
  for (const event of events) totalHazardHits += event.hazardHits || 0;
  return { ...result, events, hazards: grid, hazardCleared: totalHazardHits };
}

/** Simulate one accepted player move with weather hazards: hazard clears on hit
 * cells, then optional spread (storm lightning only). Never mutates input. */
export function simulateWeatherHazardMove(definition, state, cells, visualTrace = false) {
  const hazards = state.hazards ?? definition.hazards;
  const shielded = simulateSpecialMove(state.board, state.refillState, definition.gemTypes, definition.gemWeights, cells, state.specials, visualTrace);
  if (!shielded || !validWeatherHazards(hazards, shielded.board.length)) return null;
  const cleared = clearWeatherHazards(hazards, shielded.events.flatMap((e) => e.cleared));
  if (!cleared) return null;
  let result = { ...shielded, hazards: cleared.hazards, hazardCleared: cleared.cleared };
  let spread = null;
  if (definition.environment?.hazard?.spreads) {
    const next = spreadWeatherHazards(result.hazards, result.specials, result.shields);
    if (!next) return null;
    result = { ...result, hazards: next.hazards };
    spread = next.spread;
  }
  return { ...result, hazardSpread: spread };
}

/** Booster clear: removes hazard layers on hit cells but never spreads. */
export function simulateWeatherHazardClear(definition, state, keys, points, visualTrace = false) {
  const hazards = state.hazards ?? definition.hazards;
  const cleared = clearWeatherHazards(hazards, keys);
  if (!cleared) return null;
  return { hazards: cleared.hazards, hazardCleared: cleared.cleared };
}

/** Certify a weather-hazard level: replay the witness and confirm every hazard
 * cell is fully cleared by the witness path. Throws if any hazard remains. */
export function certifyWeatherHazardBoard(definition) {
  const { board, refillState, gemTypes, gemWeights, specials, witness, hazards } = definition;
  if (!Array.isArray(witness) || witness.length === 0) throw new Error('weather_hazard_certify_no_witness');
  let state = { board, specials: specials || blankSpecials(board.length), refillState, hazards };
  let score = 0;
  const collected = Object.fromEntries(gemTypes.map((color) => [color, 0]));
  let hazardCleared = 0;
  for (const cells of witness) {
    const next = simulateSpecialMove(state.board, state.refillState, gemTypes, gemWeights, cells, state.specials, true);
    if (!next) throw new Error('weather_hazard_certify_move_failed');
    score += next.score || 0;
    for (const color of gemTypes) collected[color] = (collected[color] || 0) + (next.collected?.[color] || 0);
    const cleared = clearWeatherHazards(state.hazards, next.events.flatMap((e) => e.cleared));
    if (!cleared) throw new Error('weather_hazard_certify_clear_failed');
    state.hazards = cleared.hazards;
    hazardCleared += cleared.cleared;
    state = { board: next.board, specials: next.specials, refillState: next.refillState };
  }
  const remaining = weatherHazardCount(state.hazards);
  if (remaining > 0) throw new Error(`weather_hazard_certify_incomplete:${remaining}`);
  return { score, collected, hazardCleared, witness, events: [] };
}

export default {
  validWeatherHazards, weatherHazardCount, blankWeatherHazards,
  witnessedWeatherHazards, clearWeatherHazards, spreadWeatherHazards,
  applyWeatherHazardClear, simulateWeatherHazardMove, simulateWeatherHazardClear,
  certifyWeatherHazardBoard, WEATHER_HAZARD_CAP,
};
