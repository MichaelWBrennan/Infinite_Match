/** Earned-special rules v3. Pure transitions: no DOM, inventory, time, network or Math.random. */
import { matchingCells, legalSwaps, pickGem, dealPlayableBoard } from './match-core.js';

export const SPECIAL_TYPES = Object.freeze(['row', 'column', 'burst', 'prism']);
export function blankSpecials(size) {
  return Array.from({ length: size }, () => new Array(size).fill(null));
}
const keyOf = (r, c) => `${r},${c}`;
const coordinates = (key) => key.split(',').map(Number);
const cloneGrid = (grid) => grid.map((row) => row.slice());
const inBounds = (r, c, n) => Number.isInteger(r) && Number.isInteger(c) && r >= 0 && c >= 0 && r < n && c < n;

/** One special per connected match, precedence: line 5+ > intersecting runs > line 4. */
export function earnedMatches(board, specials = blankSpecials(board.length), preferred = []) {
  const n = board.length;
  const runs = [];
  for (const direction of ['row', 'column']) {
    for (let line = 0; line < n; line++) {
      for (let start = 0; start < n;) {
        const cell = (offset) => direction === 'row' ? [line, offset] : [offset, line];
        const [r, c] = cell(start);
        const color = board[r][c];
        let end = start + 1;
        while (color && end < n && board[cell(end)[0]][cell(end)[1]] === color) end++;
        if (color && end - start >= 3) runs.push({ direction, color,
          cells: Array.from({ length: end - start }, (_, index) => keyOf(...cell(start + index))) });
        start = end;
      }
    }
  }
  const matches = new Set(runs.flatMap((run) => run.cells));
  const seen = new Set();
  const creations = [];
  for (let index = 0; index < runs.length; index++) {
    if (seen.has(index)) continue;
    const group = [];
    const queue = [index];
    seen.add(index);
    while (queue.length) {
      const run = runs[queue.shift()];
      group.push(run);
      for (let other = 0; other < runs.length; other++) {
        if (!seen.has(other) && runs[other].cells.some((key) => run.cells.includes(key))) {
          seen.add(other); queue.push(other);
        }
      }
    }
    const longest = group.slice().sort((a, b) => b.cells.length - a.cells.length)[0];
    const crossing = group.some((run) => run.direction !== longest.direction);
    const type = longest.cells.length >= 5 ? 'prism' : crossing ? 'burst' : longest.cells.length === 4 ? longest.direction : null;
    if (!type) continue;
    const cells = [...new Set(group.flatMap((run) => run.cells))];
    const intersections = cells.filter((key) => group.filter((run) => run.cells.includes(key)).length > 1);
    const priorities = [...preferred.map(([r, c]) => keyOf(r, c)), ...intersections,
      longest.cells[Math.floor((longest.cells.length - 1) / 2)], ...cells];
    const anchor = priorities.find((key) => cells.includes(key) && !specials[coordinates(key)[0]][coordinates(key)[1]]);
    if (anchor) {
      const [row, col] = coordinates(anchor);
      creations.push({ row, col, type, color: board[row][col] });
    }
  }
  return { matches, creations };
}

function squareKeys(n, row, col, radius) {
  const keys = new Set();
  for (let r = row - radius; r <= row + radius; r++) {
    for (let c = col - radius; c <= col + radius; c++) if (inBounds(r, c, n)) keys.add(keyOf(r, c));
  }
  return keys;
}
function beamKeys(n, row, col, kind) {
  return new Set(Array.from({ length: n }, (_, i) => kind === 'row' ? keyOf(row, i) : keyOf(i, col)));
}
function colorKeys(board, color) {
  const keys = new Set();
  board.forEach((row, r) => row.forEach((value, c) => { if (value === color) keys.add(keyOf(r, c)); }));
  return keys;
}
function allKeys(n) {
  return new Set(Array.from({ length: n * n }, (_, i) => keyOf(Math.floor(i / n), i % n)));
}
function crossKeys(n, row, col, radius = 0) {
  const keys = new Set();
  for (let offset = -radius; offset <= radius; offset++) {
    if (inBounds(row + offset, 0, n)) for (const key of beamKeys(n, row + offset, col, 'row')) keys.add(key);
    if (inBounds(0, col + offset, n)) for (const key of beamKeys(n, row, col + offset, 'column')) keys.add(key);
  }
  return keys;
}

function validState(board, specials, palette, refillState) {
  const n = board?.length;
  return Array.isArray(board) && Number.isInteger(n) && n >= 3 && n <= 8 && Array.isArray(palette) && palette.length >= 3
    && Number.isInteger(refillState) && refillState >= 0 && refillState <= 0xffffffff
    && board.every((row) => Array.isArray(row) && row.length === n && row.every((color) => palette.includes(color)))
    && specials.every((row) => Array.isArray(row) && row.length === n && row.every((type) => type === null || SPECIAL_TYPES.includes(type)))
    && specials.length === n;
}

function prepareAction(initialBoard, initialSpecials, cells) {
  const n = initialBoard.length;
  if (!Array.isArray(cells) || ![2, 4].includes(cells.length) || !cells.every((v) => Number.isInteger(v) && v >= 0 && v < n)) return null;
  const board = cloneGrid(initialBoard);
  const specials = cloneGrid(initialSpecials);
  const origins = board.map((row, r) => row.map((_value, c) => keyOf(r, c)));
  const [r, c, nr, nc] = cells;
  const suppressed = new Set();
  const prismTargets = new Map();
  let seeds = null;
  let combo = null;
  let preferred = [];
  if (cells.length === 2) {
    if (!specials[r][c]) return null;
    seeds = new Set([keyOf(r, c)]);
  } else {
    if (Math.abs(r - nr) + Math.abs(c - nc) !== 1) return null;
    for (const grid of [board, specials, origins]) [grid[r][c], grid[nr][nc]] = [grid[nr][nc], grid[r][c]];
    preferred = [[nr, nc], [r, c]];
    const first = specials[r][c];
    const second = specials[nr][nc];
    const one = keyOf(r, c);
    const two = keyOf(nr, nc);
    if (first && second) {
      suppressed.add(one); suppressed.add(two);
      if (first === 'prism' && second === 'prism') {
        combo = 'prism+prism'; seeds = allKeys(n);
      } else if (first === 'prism' || second === 'prism') {
        const partner = first === 'prism' ? second : first;
        suppressed.delete(first === 'prism' ? two : one); // The partner and every converted gem must fire.
        const color = first === 'prism' ? board[nr][nc] : board[r][c];
        seeds = colorKeys(board, color);
        for (const key of seeds) {
          const [row, col] = coordinates(key);
          if (!specials[row][col]) specials[row][col] = partner;
        }
        combo = `prism+${partner}`;
      } else if (first === 'burst' && second === 'burst') {
        combo = 'burst+burst'; seeds = squareKeys(n, nr, nc, 2);
      } else if (first === 'burst' || second === 'burst') {
        combo = 'beam+burst'; seeds = crossKeys(n, nr, nc, 1);
      } else {
        combo = 'beam+beam'; seeds = crossKeys(n, nr, nc);
      }
      seeds.add(one); seeds.add(two);
    } else if (first || second) {
      const key = first ? one : two;
      seeds = new Set([key]);
      if ((first || second) === 'prism') prismTargets.set(key, first ? board[nr][nc] : board[r][c]);
    } else if (!matchingCells(board).size) return null;
  }
  return { board, specials, origins, seeds, suppressed, prismTargets, preferred, combo };
}

/** Every old special hit by an effect fires once; newly earned anchors survive this wave. */
function expandClears(board, specials, seeds, protectedKeys, suppressed, prismTargets) {
  const n = board.length;
  const keys = new Set();
  const queue = [];
  const activated = [];
  const add = (key) => {
    if (keys.has(key) || protectedKeys.has(key)) return;
    keys.add(key); queue.push(key);
  };
  for (const key of seeds) add(key);
  while (queue.length) {
    const key = queue.shift();
    const [r, c] = coordinates(key);
    const type = specials[r][c];
    if (!type) continue;
    activated.push({ row: r, col: c, type });
    if (suppressed.has(key)) continue;
    const effect = type === 'burst' ? squareKeys(n, r, c, 1)
      : type === 'prism' ? colorKeys(board, prismTargets.get(key) || board[r][c]) : beamKeys(n, r, c, type);
    for (const affected of effect) add(affected);
  }
  return { keys, activated };
}

function settle(plan, refillState, palette, weights, bonusScore = null) {
  let { board, specials, origins } = plan;
  const n = board.length;
  const rng = { state: refillState };
  const events = [];
  let score = 0;
  let seeds = plan.seeds;
  for (let wave = 0; wave < 64; wave++) {
    const matched = earnedMatches(board, specials, wave === 0 ? plan.preferred : []);
    if (!seeds?.size && !matched.matches.size) break;
    const protectedKeys = new Set(matched.creations.map((item) => keyOf(item.row, item.col)));
    const initialSeeds = seeds || new Set();
    const merged = new Set([...initialSeeds, ...matched.matches]);
    const clear = expandClears(board, specials, merged, protectedKeys,
      wave === 0 ? plan.suppressed : new Set(), wave === 0 ? plan.prismTargets : new Map());
    for (const item of matched.creations) specials[item.row][item.col] = item.type;
    const points = wave === 0 && bonusScore !== null ? bonusScore + Math.max(0, clear.keys.size - initialSeeds.size) * 10
      : clear.keys.size * 10 * (bonusScore === null ? wave + 1 : wave);
    score += points;
    events.push({ cleared: [...clear.keys], created: matched.creations, activated: clear.activated,
      points, combo: wave === 0 ? plan.combo : null });
    for (const key of clear.keys) {
      const [r, c] = coordinates(key);
      board[r][c] = null; specials[r][c] = null; origins[r][c] = null;
    }
    for (let col = 0; col < n; col++) {
      const survivors = [];
      for (let row = n - 1; row >= 0; row--) {
        if (board[row][col]) survivors.push([board[row][col], specials[row][col], origins[row][col]]);
      }
      for (let row = n - 1, i = 0; row >= 0; row--, i++) {
        const tile = survivors[i] || [pickGem(rng, palette, weights), null, null];
        [board[row][col], specials[row][col], origins[row][col]] = tile;
      }
    }
    seeds = null;
  }
  // An earned special is itself a legal action. Never erase one merely because plain swaps deadlock.
  const reshuffled = !!matchingCells(board).size || (!specials.some((row) => row.some(Boolean)) && !legalSwaps(board).length);
  if (reshuffled) {
    board = dealPlayableBoard(n, palette, weights, rng);
    specials = blankSpecials(n); origins = blankSpecials(n);
  }
  return { board, specials, origins, refillState: rng.state, score, cascades: events.length, events, reshuffled };
}

/** Swap adjacent cells, or tap one earned special. A successful action costs ONE ordinary move. */
export function simulateSpecialMove(board, refillState, palette, weights, cells, specials = null) {
  if (specials === null) specials = Array.isArray(board) ? blankSpecials(board.length) : [];
  if (!Array.isArray(specials) || !validState(board, specials, palette, refillState)) return null;
  const plan = prepareAction(board, specials, cells);
  return plan ? settle(plan, refillState, palette, weights) : null;
}

/** Existing inventory boosters keep their base award; effects can chain earned specials. No inventory logic here. */
export function simulateSpecialClear(board, refillState, palette, weights, keys, specials = null, bonusScore = 0) {
  if (specials === null) specials = Array.isArray(board) ? blankSpecials(board.length) : [];
  if (!Array.isArray(specials) || !validState(board, specials, palette, refillState) || !Number.isFinite(bonusScore) || bonusScore < 0) return null;
  if (typeof keys === 'string' || typeof keys?.[Symbol.iterator] !== 'function') return null;
  const seeds = new Set(keys);
  if (!seeds.size || [...seeds].some((key) => typeof key !== 'string' || !/^\d+,\d+$/.test(key) || !inBounds(...coordinates(key), board.length))) return null;
  const plan = { board: cloneGrid(board), specials: cloneGrid(specials),
    origins: board.map((row, r) => row.map((_value, c) => keyOf(r, c))), seeds,
    suppressed: new Set(), prismTargets: new Map(), preferred: [], combo: null };
  return settle(plan, refillState, palette, weights, bonusScore);
}

/** Fast deterministic hint/certification candidates. Count is an immediate estimate, not an optimal win promise. */
export function specialActions(board, specials = blankSpecials(board.length)) {
  const n = board.length;
  const ordinary = legalSwaps(cloneGrid(board));
  const seen = new Set(ordinary.map((move) => move.cells.join(',')));
  const actions = ordinary;
  const add = (cells) => {
    const identity = cells.join(',');
    if (seen.has(identity)) return;
    const plan = prepareAction(board, specials, cells);
    if (!plan) return;
    const estimate = expandClears(plan.board, plan.specials, new Set([...(plan.seeds || []), ...matchingCells(plan.board)]),
      new Set(), plan.suppressed, plan.prismTargets);
    actions.push({ cells, count: estimate.keys.size }); seen.add(identity);
  };
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (specials[r][c]) add([r, c]);
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const nr = r + dr; const nc = c + dc;
        if (inBounds(nr, nc, n) && (specials[r][c] || specials[nr][nc])) {
          // A swap already listed as an ordinary match needs its special footprint instead.
          const identity = [r, c, nr, nc].join(',');
          const index = actions.findIndex((move) => move.cells.join(',') === identity);
          if (index >= 0) { actions.splice(index, 1); seen.delete(identity); }
          add([r, c, nr, nc]);
        }
      }
    }
  }
  return actions;
}

export function certifySpecialBoard(board, refillState, palette, weights, moveBudget, specials = blankSpecials(board.length)) {
  let state = { board, specials, refillState };
  let score = 0;
  const witness = [];
  for (let i = 0; i < moveBudget; i++) {
    const moves = specialActions(state.board, state.specials);
    moves.sort((a, b) => b.count - a.count);
    if (!moves.length) break;
    const cells = moves[0].cells;
    state = simulateSpecialMove(state.board, state.refillState, palette, weights, cells, state.specials);
    if (!state) break;
    score += state.score; witness.push(cells);
  }
  return { score, witness };
}
