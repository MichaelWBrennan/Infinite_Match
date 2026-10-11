// Battle pass season config (synchronous, for the free server) and season XP grants.
// Rules come from src/services/meta/battlepass.js. Kept separate so economy.js and battlepass.js
// do not import each other.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { addSeasonXp, validateSeason } from '../src/services/meta/battlepass.js';

// BATTLEPASS_CONFIG overrides the shipped config (tests and staging use this).
export function seasonConfigPath() {
  return process.env.BATTLEPASS_CONFIG || fileURLToPath(new URL('../config/battlepass/config.json', import.meta.url));
}

/** Reads the raw season config file. Throws if it is missing or not JSON. */
export function readSeasonConfig() {
  return JSON.parse(readFileSync(seasonConfigPath(), 'utf8'));
}

/** Validated season, or throws with the list of problems. */
export function loadSeason() {
  const { errors, season } = validateSeason(readSeasonConfig());
  if (errors.length) throw new Error(`invalid battle pass config: ${errors.join('; ')}`);
  return season;
}

/**
 * Adds season XP for a gameplay event to an economy document that is already loaded inside a
 * transaction. If the config is missing or invalid, rewards still work and XP is skipped.
 */
export function grantSeasonXp(economy, event, nowMs) {
  let season;
  try {
    season = loadSeason();
  } catch {
    return null;
  }
  return addSeasonXp(economy, season, event, nowMs);
}
