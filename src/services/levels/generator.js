/**
 * Pure, versioned match-3 generation shared by the server and the browser.
 * No AI, network, level files, wall clock or paid boosters are needed.
 * A deterministic simulation supplies a winning witness before a level ships.
 */
import { environmentRules, blendHex } from './environment.js';

export const GENERATOR_VERSION = 2;
export const GEM_TYPES = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
export const LEVEL_MODES = ['classic', 'timed', 'daily', 'endless'];

export function hashSeed(text) {
  let hash = 2166136261;
  for (const ch of String(text)) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

/** The serializable state is also used for the game's refill stream. */
export function nextRandom(rng) {
  rng.state = (rng.state + 0x6d2b79f5) >>> 0;
  let t = rng.state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function pickGem(rng, palette, weights = {}) {
  const total = palette.reduce((sum, color) => sum + (weights[color] || 1), 0);
  let roll = nextRandom(rng) * total;
  for (const color of palette) {
    roll -= weights[color] || 1;
    if (roll < 0) return color;
  }
  return palette[palette.length - 1];
}

export function matchingCells(board) {
  const found = new Set();
  const n = board.length;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n;) {
      const color = board[r][c];
      let end = c + 1;
      while (color && end < n && board[r][end] === color) end++;
      if (color && end - c >= 3) for (let k = c; k < end; k++) found.add(`${r},${k}`);
      c = end;
    }
  }
  for (let c = 0; c < n; c++) {
    for (let r = 0; r < n;) {
      const color = board[r][c];
      let end = r + 1;
      while (color && end < n && board[end][c] === color) end++;
      if (color && end - r >= 3) for (let k = r; k < end; k++) found.add(`${k},${c}`);
      r = end;
    }
  }
  return found;
}

export function legalSwaps(board) {
  const moves = [];
  const n = board.length;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= n || nc >= n || board[r][c] === board[nr][nc]) continue;
        [board[r][c], board[nr][nc]] = [board[nr][nc], board[r][c]];
        const count = matchingCells(board).size;
        [board[r][c], board[nr][nc]] = [board[nr][nc], board[r][c]];
        if (count) moves.push({ cells: [r, c, nr, nc], count });
      }
    }
  }
  return moves;
}

/** Stable AND playable, including the fallback; no unbounded rejection loop. */
export function dealPlayableBoard(size, palette, weights, rng) {
  for (let attempt = 0; attempt <= 12; attempt++) {
    const board = Array.from({ length: size }, () => new Array(size).fill(null));
    // This motif guarantees a legal swap if random dealing repeatedly deadlocks.
    const motif = [[palette[0], palette[1], palette[0]], [palette[2], palette[0], palette[2]]];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (attempt === 12 && r < 2 && c < 3) {
          board[r][c] = motif[r][c];
          continue;
        }
        const banned = new Set();
        if (c > 1 && board[r][c - 1] === board[r][c - 2]) banned.add(board[r][c - 1]);
        if (r > 1 && board[r - 1][c] === board[r - 2][c]) banned.add(board[r - 1][c]);
        board[r][c] = pickGem(rng, palette.filter((color) => !banned.has(color)), weights);
      }
    }
    if (legalSwaps(board).length) return board;
  }
  throw new Error('Unable to generate a playable board');
}

/** Identical column/refill order and cascade scoring to the Phaser match-3 core. */
export function simulateMove(initialBoard, refillState, palette, weights, cells) {
  const board = initialBoard.map((row) => row.slice());
  const rng = { state: refillState >>> 0 };
  const [r, c, nr, nc] = cells;
  const n = board.length;
  if (![r, c, nr, nc].every((v) => Number.isInteger(v) && v >= 0 && v < n)
      || Math.abs(r - nr) + Math.abs(c - nc) !== 1) return null;
  [board[r][c], board[nr][nc]] = [board[nr][nc], board[r][c]];
  let matches = matchingCells(board);
  if (!matches.size) return null;
  let score = 0;
  let chain = 0;
  while (matches.size && chain < 64) {
    chain++;
    score += matches.size * 10 * chain;
    for (const key of matches) {
      const [row, col] = key.split(',').map(Number);
      board[row][col] = null;
    }
    for (let col = 0; col < n; col++) {
      const survivors = [];
      for (let row = n - 1; row >= 0; row--) if (board[row][col]) survivors.push(board[row][col]);
      for (let row = n - 1, i = 0; row >= 0; row--, i++) {
        board[row][col] = i < survivors.length ? survivors[i] : pickGem(rng, palette, weights);
      }
    }
    matches = matchingCells(board);
  }
  // A pathological cascade or deadlock is repaired for free, never sold as a shuffle.
  const stable = matches.size || !legalSwaps(board).length
    ? dealPlayableBoard(n, palette, weights, rng) : board;
  return { board: stable, refillState: rng.state, score, cascades: chain };
}

/** Existence proof, not a claim that every choice wins or that humans meet a timed deadline. */
export function certifyBoard(board, refillState, palette, weights, moveBudget) {
  let state = { board, refillState, score: 0 };
  let score = 0;
  const witness = [];
  for (let i = 0; i < moveBudget; i++) {
    const moves = legalSwaps(state.board);
    moves.sort((a, b) => b.count - a.count);
    if (!moves.length) break;
    const cells = moves[0].cells;
    state = simulateMove(state.board, state.refillState, palette, weights, cells);
    score += state.score;
    witness.push(cells);
  }
  return { score, witness };
}

export function levelTheme(context) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const seasonal = {
    winter: { name: 'Crystal Winter', background: '#142c46', accent: '#9edfff', favorite: 'blue' },
    spring: { name: 'Blooming Gardens', background: '#183f38', accent: '#9cf0b5', favorite: 'green' },
    summer: { name: 'Sunlit Shores', background: '#163d54', accent: '#ffe082', favorite: 'yellow' },
    autumn: { name: 'Harvest Skies', background: '#40253d', accent: '#ffc078', favorite: 'orange' },
  };
  const season = seasonal[context.season] || seasonal.spring;
  const monthlyColors = {
    winter: ['blue', 'purple', 'green'], spring: ['green', 'purple', 'yellow'],
    summer: ['yellow', 'orange', 'blue'], autumn: ['orange', 'red', 'purple'],
  };
  const seasonalFavorite = (monthlyColors[context.season] || monthlyColors.spring)[context.month % 3];
  const holidays = context.holidays || [];
  const holidayName = holidays.map((holiday) => holiday.name).join(' · ');
  const special = /halloween/i.test(holidayName)
    ? { name: 'Halloween', background: '#25133b', accent: '#ffa658', favorite: 'orange' }
    : /christmas|no[eë]l/i.test(holidayName)
      ? { name: 'Christmas', background: '#19372f', accent: '#f7d987', favorite: 'red' }
      : /valentine/i.test(holidayName)
        ? { name: 'Valentine Celebration', background: '#461e38', accent: '#ff9ec2', favorite: 'red' }
        : /easter/i.test(holidayName)
          ? { name: 'Easter Celebration', background: '#323b54', accent: '#d8b5ff', favorite: 'purple' }
          : holidays.length
            ? { name: holidays[0].name, background: '#2e2250', accent: '#ffd87a', favorite: 'purple' }
            : null;
  const selected = special || { ...season, favorite: seasonalFavorite };
  const environment = environmentRules(context);
  const monthName = monthNames[context.month - 1] || 'Local';
  return {
    ...selected,
    id: special ? `holiday-${hashSeed(holidayName).toString(16)}` : `${context.season}-${context.month}`,
    name: special ? selected.name : `${monthName} · ${selected.name}`,
    background: blendHex(selected.background, environment.tint),
    accent: special ? selected.accent : environment.accent || selected.accent,
    environmentLabel: environment.label,
    monthName,
    season: context.season,
    holidayNames: holidays.map((holiday) => holiday.name),
  };
}

/** Cache/seed identity excludes fetch timestamps and small changes within weather bands. */
export function generationKey(levelNumber, context, mode = 'classic') {
  const level = mode === 'daily' ? 1 : levelNumber;
  const rules = environmentRules(context);
  const theme = levelTheme(context);
  const area = context.weatherEnabled === false ? '' : context.weather?.area?.key
    || (Number.isFinite(context.weatherLatitude) ? `${context.weatherLatitude},${context.weatherLongitude}` : '');
  return [GENERATOR_VERSION, mode, level, context.localDate, context.timeZone,
    context.country || '', context.region || '', context.hemisphere, theme.id, rules.key, area].join('|');
}

/** Any positive safe level number; bounded difficulty instead of impossible linear score growth. */
export function generateLevel(levelNumber, context, mode = 'classic') {
  if (!Number.isSafeInteger(levelNumber) || levelNumber < 1) throw new RangeError('invalid_level');
  if (!LEVEL_MODES.includes(mode)) throw new RangeError('invalid_mode');
  const level = mode === 'daily' ? 1 : levelNumber;
  const theme = levelTheme(context);
  const environment = environmentRules(context);
  const key = generationKey(level, context, mode);
  const seed = hashSeed(key);
  const rng = { state: seed };
  const cycle = mode === 'daily' ? Math.floor(nextRandom(rng) * 5) : (level - 1) % 5;
  const isBoss = mode !== 'daily' && level % 10 === 0;
  const size = 6 + Math.floor(nextRandom(rng) * 3);
  const baseColorCount = isBoss ? 6 : level <= 3 && mode !== 'daily' ? 4 : 4 + Math.floor(nextRandom(rng) * 3);
  const colorCount = Math.max(baseColorCount, environment.minimumColors);
  const priorities = [...new Set([theme.favorite, ...environment.priorities])];
  const others = GEM_TYPES.filter((color) => !priorities.includes(color));
  // Seeded Fisher-Yates: month/season/holiday changes the palette and refill mix.
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(rng) * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const palette = [...priorities, ...others].slice(0, colorCount);
  const weights = Object.fromEntries(palette.map((color) => [color,
    Math.min(2.2, (color === theme.favorite ? 1.35 : 1) + (environment.gemBonuses[color] || 0))]));
  const moveBudget = Math.max(20, Math.min(30, 30 - cycle - (isBoss ? 5 : 0) + environment.moveBonus));
  const board = dealPlayableBoard(size, palette, weights, rng);
  const refillState = rng.state;
  const proof = certifyBoard(board, refillState, palette, weights, moveBudget);
  const fraction = isBoss ? 0.86 : 0.62 + cycle * 0.04;
  const targetScore = Math.max(100, Math.floor(Math.min(2400, proof.score * fraction) / 50) * 50);
  if (proof.witness.length !== moveBudget || proof.score < targetScore) throw new Error('level_quality_failed');
  return {
    id: `v${GENERATOR_VERSION}-${mode}-${level}-${context.localDate}-${seed.toString(16)}`,
    generatorVersion: GENERATOR_VERSION,
    environmentKey: environment.key,
    level,
    mode,
    isDaily: mode === 'daily',
    isBoss,
    seed,
    refillState,
    boardSize: size,
    board,
    gemTypes: palette,
    gemWeights: weights,
    targetScore,
    moves: mode === 'timed' ? 999 : mode === 'endless' ? Number.MAX_SAFE_INTEGER : moveBudget,
    timeLimit: mode === 'timed' ? 60 : 0,
    objectives: [{ type: 'score', target: targetScore }],
    difficulty: isBoss ? 'boss' : ['gentle', 'steady', 'steady', 'challenging', 'challenging'][cycle],
    theme,
    context: { ...context },
    quality: {
      initialMatches: 0,
      legalOpeningMoves: legalSwaps(board).length,
      verifiedWithoutBoosters: true,
      verifiedMoves: moveBudget,
      verifiedScore: proof.score,
    },
  };
}
