import { generateLevel, generationKey, LEVEL_MODES } from './generator.js';
import { LevelInputError, localLevelContext } from './location-context.js';
import { levelWeatherService } from './weather-context.js';

const levels = new Map();
const MAX_CACHED_LEVELS = 128;

function validate(level, mode) {
  if (!Number.isSafeInteger(level) || level < 1) throw new LevelInputError('invalid_level');
  if (!LEVEL_MODES.includes(mode)) throw new LevelInputError('invalid_mode');
}

export function levelForContext(level, mode, context) {
  validate(level, mode);
  const number = mode === 'daily' ? 1 : level;
  const key = generationKey(number, context, mode);
  let definition = levels.get(key);
  if (!definition) {
    definition = generateLevel(number, context, mode);
    if (levels.size >= MAX_CACHED_LEVELS) levels.delete(levels.keys().next().value);
    levels.set(key, definition);
  }
  const clone = structuredClone(definition);
  // Board/rules are shared only for identical bands; current forecast metadata
  // and server-clock synchronization still belong to THIS request/attempt.
  clone.context = structuredClone(context);
  return clone;
}

/** Synchronous, no-network generation for tooling, tests and calendar-only callers. */
export function generatedLevel({ level = 1, mode = 'classic', location = {} } = {}, nowMs = Date.now()) {
  validate(level, mode);
  return levelForContext(level, mode, localLevelContext(location, nowMs));
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

export async function liveGeneratedLevel({ level = 1, mode = 'classic', location = {} } = {}, nowMs = Date.now(), weatherService = levelWeatherService) {
  validate(level, mode);
  return levelForContext(level, mode, await liveLevelContext(location, nowMs, weatherService));
}
