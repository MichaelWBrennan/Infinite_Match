/**
 * Infinite Match Game Worker
 *
 * Runs CPU-intensive game logic off the main thread:
 *   - Match detection and cascade resolution
 *   - Board generation and certification
 *   - Legal swap computation
 *   - Objective status evaluation
 *
 * Self-contained: pure algorithms only, zero DOM dependencies.
 * Communicates with the main thread via postMessage with transferable ArrayBuffers
 * where possible for zero-copy performance.
 */

// ============================================================================
// Pure game logic (inlined for worker self-containment)
// ============================================================================

const SHAPES = Object.freeze({
  heart: 'heart', diamond: 'diamond', square: 'square',
  triangle: 'triangle', hexagon: 'hexagon', star: 'star',
});

const DEFAULT_GEM_TYPES = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const GENERATOR_VERSION = 5;

/** Seeded RNG (xorshift32) - deterministic, fast, no Math.random. */
function createRNG(seed) {
  let state = seed || 1;
  return {
    next() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 0x100000000;
    },
    int(max) {
      return Math.floor(this.next() * max);
    },
    get state() { return state; },
    set state(v) { state = v | 0; },
  };
}

function hashSeed(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

/** Find all cells that are part of a match of 3+ identical gems. */
function findMatches(board) {
  const n = board.length;
  const found = new Set();
  for (let r = 0; r < n; r++) {
    let i = 0;
    while (i < n) {
      const t = board[r][i];
      let j = i + 1;
      while (t && j < n && board[r][j] === t) j++;
      if (t && j - i >= 3) {
        for (let k = i; k < j; k++) found.add(`${r},${k}`);
      }
      i = j;
    }
  }
  for (let c = 0; c < n; c++) {
    let i = 0;
    while (i < n) {
      const t = board[i][c];
      let j = i + 1;
      while (t && j < n && board[j][c] === t) j++;
      if (t && j - i >= 3) {
        for (let k = i; k < j; k++) found.add(`${k},${c}`);
      }
      i = j;
    }
  }
  return found;
}

/** All legal adjacent swaps that produce at least one match. */
function legalSwaps(board) {
  const n = board.length;
  const swaps = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= n || nc >= n) continue;
        // Swap
        const tmp = board[r][c];
        board[r][c] = board[nr][nc];
        board[nr][nc] = tmp;
        const ok = findMatches(board).size > 0;
        // Undo
        board[nr][nc] = board[r][c];
        board[r][c] = tmp;
        if (ok) swaps.push([r, c, nr, nc]);
      }
    }
  }
  return swaps;
}

/** Deal a playable board: no initial matches, at least one legal move. */
function dealPlayableBoard(size, palette, weights, rng) {
  const MAX_ATTEMPTS = 200;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const board = Array.from({ length: size }, () => Array(size).fill(null));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        board[r][c] = palette[rng.int(palette.length)];
      }
    }
    if (findMatches(board).size === 0 && legalSwaps(board).length > 0) {
      return board;
    }
  }
  // Fallback: just return any board
  const board = Array.from({ length: size }, () => Array(size).fill(null));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      board[r][c] = palette[rng.int(palette.length)];
    }
  }
  return board;
}

/** Resolve matches, apply gravity, repeat until stable. Returns cascade chain count. */
function resolveBoard(board, palette, weights, rng) {
  let chain = 0;
  const n = board.length;
  let matches = findMatches(board);
  while (matches.size > 0 && chain < 64) {
    chain++;
    // Remove matched cells
    for (const key of matches) {
      const [r, c] = key.split(',').map(Number);
      board[r][c] = null;
    }
    // Gravity: survivors fall, new gems drop from top
    for (let c = 0; c < n; c++) {
      const survivors = [];
      for (let r = n - 1; r >= 0; r--) {
        if (board[r][c] !== null) survivors.push(board[r][c]);
      }
      for (let r = n - 1, i = 0; r >= 0; r--, i++) {
        if (i < survivors.length) {
          board[r][c] = survivors[i];
        } else {
          board[r][c] = palette[rng.int(palette.length)];
        }
      }
    }
    matches = findMatches(board);
  }
  return chain;
}

/** Simulate a swap: returns result object or null if invalid. */
function simulateMove(board, palette, weights, rng, cells) {
  const [r1, c1, r2, c2] = cells;
  const n = board.length;
  if (!isInBounds(r1, c1, n) || !isInBounds(r2, c2, n)) return null;
  if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return null;

  // Work on a clone
  const clone = board.map((row) => row.slice());
  const tmp = clone[r1][c1];
  clone[r1][c1] = clone[r2][c2];
  clone[r2][c2] = tmp;

  const matches = findMatches(clone);
  if (matches.size === 0) return null;

  const chain = resolveBoard(clone, palette, weights, rng);
  const score = matches.size * 10 * chain;

  return {
    board: clone,
    matches: Array.from(matches),
    chain,
    score,
    refillState: rng.state,
  };
}

function isInBounds(r, c, n) {
  return r >= 0 && r < n && c >= 0 && c < n;
}

/** Generate a complete level definition. */
function generateLevelWorker(levelNumber, context, mode, version) {
  const rng = createRNG(hashSeed(`${levelNumber}-${context.season || 'default'}-${context.month || 1}-${mode}`));
  const isBoss = levelNumber % 10 === 0;
  const baseColorCount = isBoss ? 6 : levelNumber <= 3 && mode !== 'daily' ? 4 : 4 + Math.floor(rng.next() * 3);
  const colorCount = Math.max(baseColorCount, 4);
  const palette = DEFAULT_GEM_TYPES.slice(0, colorCount);
  const weights = Object.fromEntries(palette.map((c) => [c, 1.0]));
  const moveBudget = Math.max(20, Math.min(30, 30 - Math.floor(levelNumber / 25) - (isBoss ? 5 : 0)));
  const board = dealPlayableBoard(8, palette, weights, rng);
  const targetScore = Math.max(100, Math.floor((800 + levelNumber * 60) * (isBoss ? 2 : 1) / 50) * 50);

  return {
    level: levelNumber,
    mode: mode || 'classic',
    seed: rng.state,
    board,
    gemTypes: palette,
    gemWeights: weights,
    moveBudget,
    targetScore,
    isBoss,
    generatorVersion: version || GENERATOR_VERSION,
    context: context || { season: 'default', month: 1, holidays: [], events: [], weather: { condition: 'clear' } },
    theme: {
      name: `${context.season || 'Default'} Level`,
      background: '#0c1445',
      accent: '#ffd700',
      favorite: palette[0],
    },
    objectives: [{ type: 'score', target: targetScore }],
  };
}

// ============================================================================
// Message handling
// ============================================================================

const MSG_READY = 'ready';
const MSG_GENERATE_LEVEL = 'generate_level';
const MSG_SIMULATE_MOVE = 'simulate_move';
const MSG_LEGAL_SWAPS = 'legal_swaps';
const MSG_FIND_MATCHES = 'find_matches';
const MSG_RESOLVE_BOARD = 'resolve_board';
const MSG_ERROR = 'error';

self.onmessage = (event) => {
  const { type, id, payload } = event.data || {};
  const start = performance.now();

  try {
    switch (type) {
      case MSG_GENERATE_LEVEL: {
        const { level, context, mode, version } = payload;
        const definition = generateLevelWorker(level, context, mode, version);
        postMessage({
          type: MSG_GENERATE_LEVEL,
          id,
          payload: { definition },
          timestamp: performance.now(),
        });
        break;
      }

      case MSG_SIMULATE_MOVE: {
        const { board, palette, weights, refillState, cells } = payload;
        const rng = createRNG(refillState);
        rng.state = refillState;
        const result = simulateMove(board, palette, weights, rng, cells);
        postMessage({
          type: MSG_SIMULATE_MOVE,
          id,
          payload: { result },
          timestamp: performance.now(),
        });
        break;
      }

      case MSG_LEGAL_SWAPS: {
        const { board } = payload;
        // Clone to avoid mutating the original
        const clone = board.map((row) => row.slice());
        const swaps = legalSwaps(clone);
        postMessage({
          type: MSG_LEGAL_SWAPS,
          id,
          payload: { swaps },
          timestamp: performance.now(),
        });
        break;
      }

      case MSG_FIND_MATCHES: {
        const { board } = payload;
        const matches = findMatches(board);
        postMessage({
          type: MSG_FIND_MATCHES,
          id,
          payload: { matches: Array.from(matches) },
          timestamp: performance.now(),
        });
        break;
      }

      case MSG_RESOLVE_BOARD: {
        const { board, palette, weights, refillState } = payload;
        const rng = createRNG(refillState);
        const chain = resolveBoard(board, palette, weights, rng);
        const score = board.flat().filter(Boolean).length * 10 * chain;
        postMessage({
          type: MSG_RESOLVE_BOARD,
          id,
          payload: { chain, score },
          timestamp: performance.now(),
        });
        break;
      }

      default:
        postMessage({ type: MSG_ERROR, id, payload: { message: `Unknown type: ${type}` } });
    }
  } catch (error) {
    postMessage({
      type: MSG_ERROR,
      id,
      payload: { message: error.message, stack: error.stack },
    });
  }
};

// Signal readiness
postMessage({ type: MSG_READY, timestamp: performance.now() });
