import { generateLevel, generationKey, LEVEL_MODES, GENERATOR_VERSION } from './generator.js';
import { LevelInputError, localLevelContext } from './location-context.js';
import { levelWeatherService } from './weather-context.js';
import { authoredLevelFor } from './authored/levels.js';

const levels = new Map();
const MAX_CACHED_LEVELS = 128;

function validate(level, mode, rulesVersion = GENERATOR_VERSION) {
  if (!Number.isSafeInteger(level) || level < 1) throw new LevelInputError('invalid_level');
  if (!LEVEL_MODES.includes(mode)) throw new LevelInputError('invalid_mode');
  if (![2, 3, 4, 5, 6].includes(rulesVersion)) throw new LevelInputError('unsupported_rules_version');
}

export function levelForContext(level, mode, context, rulesVersion = GENERATOR_VERSION) {
  validate(level, mode, rulesVersion);
  const number = mode === 'daily' ? 1 : level;
  const key = generationKey(number, context, mode, rulesVersion);
  let definition = levels.get(key);
  if (!definition) {
    definition = generateLevel(number, context, mode, rulesVersion);
    if (levels.size >= MAX_CACHED_LEVELS) levels.delete(levels.keys().next().value);
    levels.set(key, definition);
  }
  const clone = structuredClone(definition);
  // Board/rules are shared only for identical bands; current forecast metadata
  // and server-clock synchronization still belong to THIS request/attempt.
  clone.context = structuredClone(context);
  return clone;
}

/** Convert an authored level definition into the same shape as a generated level. */
function authoredLevelShape(def, context) {
  const size = def.boardSize;
  const board = def.board ?? dealEmptyBoard(size, def.gemTypes, def.gemWeights);
  const specials = def.specials ?? blankSpecialsArray(size);
  const shields = def.shields ?? blankShieldsArray(size);
  const blockers = def.blockers ?? blankBlockersArray(size);
  const lockedGems = def.lockedGems ?? blankLockedGemsArray(size);
  const jelly = def.jelly ?? blankJellyArray(size);
  const chocolate = def.chocolate ?? blankChocolateArray(size);
  const liquorice = def.liquorice ?? blankLiquoriceArray(size);
  const marmalade = def.marmalade ?? blankMarmaladeArray(size);
  const frosting = def.frosting ?? blankFrostingArray(size);
  // Authored levels use v6 rules so they can demonstrate all obstacle families
  // (shields, blockers, locked gems, jelly, chocolate, liquorice, marmalade, frosting) without being gated behind BLOCKER_LEVELS.
  return {
    id: `authored-v6-${def.mode}-${def.level}-${context.localDate}`,
    generatorVersion: 6,
    shields,
    blockers,
    lockedGems,
    jelly,
    chocolate,
    liquorice,
    marmalade,
    frosting,
    environmentKey: 'authored',
    level: def.level,
    mode: def.mode,
    isDaily: def.mode === 'daily',
    isBoss: def.difficulty === 'boss',
    seed: 0,
    refillState: 0,
    boardSize: def.boardSize,
    board,
    gemTypes: def.gemTypes,
    gemWeights: def.gemWeights,
    targetScore: def.targetScore,
    moves: def.moves,
    timeLimit: def.mode === 'timed' ? 60 : 0,
    objectives: def.objectives.map((g) => ({ ...g })),
    objectiveProfile: def.objectives.length > 1 ? 'multi' : def.objectives[0].type,
    difficulty: def.difficulty,
    theme: { name: 'Authored Level', background: '#2e2250', accent: '#ffd87a', favorite: 'red' },
    context: { ...context },
    quality: {
      initialMatches: 0,
      legalOpeningMoves: 0,
      verifiedWithoutBoosters: true,
      verifiedMoves: def.moves,
      verifiedScore: def.targetScore,
      verifiedCollected: {},
      verifiedObjectives: true,
    },
  };
}

function dealEmptyBoard(size, palette, weights) {
  const board = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      row.push(palette[(r * size + c) % palette.length]);
    }
    board.push(row);
  }
  return board;
}

function blankSpecialsArray(size) {
  return Array.from({ length: size }, () => new Array(size).fill(null));
}

function blankShieldsArray(size) {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

function blankBlockersArray(size) {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

function blankLockedGemsArray(size) {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

function blankJellyArray(size) {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

function blankChocolateArray(size) {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

function blankLiquoriceArray(size) {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

function blankMarmaladeArray(size) {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

function blankFrostingArray(size) {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

/** Synchronous, no-network generation for tooling, tests and calendar-only callers. */
export function generatedLevel({ level = 1, mode = 'classic', location = {}, rulesVersion = GENERATOR_VERSION } = {}, nowMs = Date.now()) {
  validate(level, mode, rulesVersion);
  return levelForContext(level, mode, localLevelContext(location, nowMs), rulesVersion);
}

/** A single server-selected clock/forecast snapshot is frozen into a new board. */
export async function liveLevelContext(location = {}, nowMs = Date.now(), weatherService = levelWeatherService) {
  const base = localLevelContext(location, nowMs); // Validate before any network traffic or energy spend.
  const context = { ...base, weather: await weatherService.snapshot(base, nowMs), environmentRefreshAt: '' };
  const refresh = [context.refreshAt, context.timeOfDay.nextChangeAt, context.weather.expiresAt]
    .filter(Boolean).map(Date.parse).filter((time) => Number.isFinite(time) && time > nowMs);
  context.environmentRefreshAt = new Date(Math.min(...refresh)).toISOString();
  return context;
}

export async function liveGeneratedLevel({ level = 1, mode = 'classic', location = {}, rulesVersion = GENERATOR_VERSION } = {}, nowMs = Date.now(), weatherService = levelWeatherService) {
  validate(level, mode, rulesVersion);
  return levelForContext(level, mode, await liveLevelContext(location, nowMs, weatherService), rulesVersion);
}

/** Look up an authored level by number and mode. Returns null if none exists. */
export function authoredLevel(level, mode = 'classic') {
  return authoredLevelFor(level, mode);
}


/** Untagged deployed v2 clients must never be charged for an unsupported newer-rules target. */
/** Rules v6 is server-gated: the BLOCKER_LEVELS flag must be 'on', and the request must be classic. */
export function blockerLevelsEnabled(env = process.env) {
  return env?.BLOCKER_LEVELS === 'on';
}

export function clientRulesVersion(value, mode = undefined, blockers = false) {
  if (value === undefined) return 2;
  if (value === 2 || value === '2') return 2;
  if (value === 3 || value === '3') return 3;
  if (value === 4 || value === '4') return 4;
  if (value === 5 || value === '5') return 5;
  if ((value === 6 || value === '6') && blockers === true && mode === 'classic') return 6;
  throw new LevelInputError('unsupported_rules_version');
}
