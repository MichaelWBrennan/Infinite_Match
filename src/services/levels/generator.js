/**
 * Pure, versioned match-3 generation shared by the server and the browser.
 * No AI, network, level files, wall clock or paid boosters are needed.
 * A deterministic simulation supplies a winning witness before a level ships.
 */
import { environmentRules, blendHex } from './environment.js';
import { hashSeed, nextRandom, legalSwaps, dealPlayableBoard, certifyBoard, simulateMove } from './match-core.js';
import { blankSpecials, specialActions, certifySpecialBoard, simulateSpecialMove } from './special-rules.js';
export { hashSeed, nextRandom, pickGem, matchingCells, legalSwaps, dealPlayableBoard, simulateMove, certifyBoard } from './match-core.js';
export { SPECIAL_TYPES, blankSpecials, earnedMatches, specialActions, simulateSpecialMove, simulateSpecialClear } from './special-rules.js';


export const GENERATOR_VERSION = 3;
export const GEM_TYPES = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
export const LEVEL_MODES = ['classic', 'timed', 'daily', 'endless'];

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
export function generationKey(levelNumber, context, mode = 'classic', version = GENERATOR_VERSION) {
  const level = mode === 'daily' ? 1 : levelNumber;
  const rules = environmentRules(context);
  const theme = levelTheme(context);
  const area = context.weatherEnabled === false ? '' : context.weather?.area?.key
    || (Number.isFinite(context.weatherLatitude) ? `${context.weatherLatitude},${context.weatherLongitude}` : '');
  return [version, mode, level, context.localDate, context.timeZone,
    context.country || '', context.region || '', context.hemisphere, theme.id, rules.key, area].join('|');
}

/** Any positive safe level number; bounded difficulty instead of impossible linear score growth. */
export function generateLevel(levelNumber, context, mode = 'classic', version = GENERATOR_VERSION) {
  if (!Number.isSafeInteger(levelNumber) || levelNumber < 1) throw new RangeError('invalid_level');
  if (!LEVEL_MODES.includes(mode)) throw new RangeError('invalid_mode');
  if (![2, 3].includes(version)) throw new RangeError('unsupported_generator_version');
  const level = mode === 'daily' ? 1 : levelNumber;
  const theme = levelTheme(context);
  const environment = environmentRules(context);
  const key = generationKey(level, context, mode, version);
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
  const proof = version === 3 ? certifySpecialBoard(board, refillState, palette, weights, moveBudget)
    : certifyBoard(board, refillState, palette, weights, moveBudget);
  const fraction = isBoss ? 0.86 : 0.62 + cycle * 0.04;
  const targetScore = Math.max(100, Math.floor(Math.min(2400, proof.score * fraction) / 50) * 50);
  if (proof.witness.length !== moveBudget || proof.score < targetScore) throw new Error('level_quality_failed');
  return {
    id: `v${version}-${mode}-${level}-${context.localDate}-${seed.toString(16)}`,
    generatorVersion: version,
    ...(version === 3 ? { specials: blankSpecials(size) } : {}),
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


/** Use the frozen definition's rules, never today's generator version, during an active attempt. */
export function levelActions(definition, board = definition.board, specials = definition.specials) {
  return definition.generatorVersion >= 3 ? specialActions(board, specials) : legalSwaps(board);
}

export function simulateLevelMove(definition, state, cells) {
  const { gemTypes, gemWeights } = definition;
  return definition.generatorVersion >= 3
    ? simulateSpecialMove(state.board, state.refillState, gemTypes, gemWeights, cells, state.specials)
    : simulateMove(state.board, state.refillState, gemTypes, gemWeights, cells);
}

export function certifyLevel(definition) {
  const { board, refillState, gemTypes, gemWeights, moves } = definition;
  // Timed/endless are certified with the bounded quality budget, not infinity/999 moves.
  const budget = definition.quality?.verifiedMoves || Math.min(30, moves);
  return definition.generatorVersion >= 3
    ? certifySpecialBoard(board, refillState, gemTypes, gemWeights, budget, definition.specials)
    : certifyBoard(board, refillState, gemTypes, gemWeights, budget);
}
