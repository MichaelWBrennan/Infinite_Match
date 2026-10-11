/** Rules v6 (M1): spreading blocker bookkeeping. Pure functions only: no board,
 * no RNG, no generator wiring. A blocker sits on one ordinary gem cell. After each
 * player move it may grow into ONE orthogonal neighbour, the lowest (row, col) among
 * all eligible neighbours of every blocker. Spread never enters a special anchor, a
 * shield cell, or an existing blocker. The number of blockers is capped. A match that
 * clears a blocker's cell removes the blocker. Matching and generator integration are
 * M2; nothing here changes v2-v5 behaviour. Design is provisional until the owner
 * confirms it (see docs/BOARD_VARIETY_V6_PLAN.md). */

export const BLOCKER_CAP = 6;

const keyOf = (row, col) => `${row},${col}`;

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
  blockers.forEach((row, r) => row.forEach((value, c) => { if (value) keys.push(keyOf(r, c)); }));
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
  return { blockers: copy, spread: keyOf(best[0], best[1]) };
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
  return { blockers: copy, cleared: cleared.map(([r, c]) => keyOf(r, c)) };
}
