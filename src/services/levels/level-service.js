import { generateLevel, LEVEL_MODES } from './generator.js';
import { LevelInputError, localLevelContext } from './location-context.js';

const levels = new Map();
const MAX_CACHED_LEVELS = 128;

/** Pure definitions cached only until that region's next local day (date is in the key). */
export function generatedLevel({ level = 1, mode = 'classic', location = {} } = {}, nowMs = Date.now()) {
  if (!Number.isSafeInteger(level) || level < 1) throw new LevelInputError('invalid_level');
  if (!LEVEL_MODES.includes(mode)) throw new LevelInputError('invalid_mode');
  const context = localLevelContext(location, nowMs);
  const number = mode === 'daily' ? 1 : level;
  const key = JSON.stringify([number, mode, context]);
  let definition = levels.get(key);
  if (!definition) {
    definition = generateLevel(number, context, mode);
    if (levels.size >= MAX_CACHED_LEVELS) levels.delete(levels.keys().next().value);
    levels.set(key, definition);
  }
  // Attempt persistence or other callers must not mutate a shared cached definition.
  return structuredClone(definition);
}
