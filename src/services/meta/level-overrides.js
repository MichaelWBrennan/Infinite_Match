/**
 * Automatic difficulty adjustment. The level-tuning report flags levels that are too hard or too
 * easy. Applying the report moves that level's target by one step (5%). The total change from the
 * base target is capped at 20% either way, so tuning cannot run away.
 *
 * Overrides are one file (LEVEL_OVERRIDES_CONFIG, default config/level-overrides.json):
 *   { "updatedAt": "...", "levels": { "12": 0.95 } }
 * A multiplier of 1 (or no entry) means the base target. Both the server and the game read it.
 */

import { existsSync, readFileSync, statSync, mkdirSync, writeFileSync, renameSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

export const MULTIPLIER_MIN = 0.8;
export const MULTIPLIER_MAX = 1.2;
export const TUNING_STEP = 0.05;
const MAX_LEVEL = 10000;

export function levelOverridesPath() {
  return process.env.LEVEL_OVERRIDES_CONFIG || path.resolve('config', 'level-overrides.json');
}

const round2 = (n) => Math.round(n * 100) / 100;

/** Checks a raw overrides file. Returns { errors, levels } with levels as numbers. */
export function validateOverrides(raw) {
  const errors = [];
  const levels = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { errors: ['overrides must be an object'], levels };
  }
  const entries = raw.levels && typeof raw.levels === 'object' && !Array.isArray(raw.levels) ? raw.levels : {};
  for (const [key, value] of Object.entries(entries)) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL) {
      errors.push(`level ${key} is not a level number`);
      continue;
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || value < MULTIPLIER_MIN || value > MULTIPLIER_MAX) {
      errors.push(`level ${key} multiplier must be ${MULTIPLIER_MIN} to ${MULTIPLIER_MAX}`);
      continue;
    }
    if (value !== 1) levels[level] = round2(value);
  }
  return { errors, levels };
}

/**
 * Moves each flagged level one step toward balance. `summary` is summarizeLevelResults() output;
 * `current` is the levels map. Returns the proposals; nothing is changed here.
 */
export function proposeOverrides(summary, current = {}) {
  const proposals = [];
  for (const row of summary) {
    if (row.flag !== 'too_hard' && row.flag !== 'too_easy') continue;
    const from = current[row.level] ?? 1;
    const direction = row.flag === 'too_hard' ? -1 : 1;
    const to = round2(Math.min(MULTIPLIER_MAX, Math.max(MULTIPLIER_MIN, from + direction * TUNING_STEP)));
    if (to === round2(from)) continue;
    proposals.push({ level: row.level, flag: row.flag, winRate: row.winRate, attempts: row.attempts, from: round2(from), to });
  }
  return proposals;
}

/** The levels map after the proposals are applied. Multipliers of 1 are dropped. */
export function applyProposals(current, proposals) {
  const next = { ...current };
  for (const p of proposals) {
    if (p.to === 1) delete next[p.level];
    else next[p.level] = p.to;
  }
  return next;
}

const EMPTY = Object.freeze({ levels: Object.freeze({}), updatedAt: null });
let cache = { file: null, mtimeMs: -1, value: EMPTY };

/** Reads the overrides, cached until the file changes. A missing or invalid file means none. */
export function readLevelOverrides(file = levelOverridesPath()) {
  if (!existsSync(file)) return EMPTY;
  const mtimeMs = statSync(file).mtimeMs;
  if (cache.file === file && cache.mtimeMs === mtimeMs) return cache.value;
  let value = EMPTY;
  try {
    const raw = JSON.parse(readFileSync(file, 'utf-8'));
    const { errors, levels } = validateOverrides(raw);
    if (errors.length) throw new Error(errors.join('; '));
    value = { levels, updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null };
  } catch (error) {
    // A bad file must not change targets half-way. Log via the caller; use the base targets.
    value = EMPTY;
    process.emitWarning(`Ignoring level overrides: ${error.message}`);
  }
  cache = { file, mtimeMs, value };
  return value;
}

/** The tuning multiplier for one level. 1 when there is no override. */
export function levelMultiplier(level, overrides = readLevelOverrides()) {
  return overrides.levels[level] ?? 1;
}

/** Writes the levels map atomically. */
export function writeLevelOverrides(levels, file = levelOverridesPath(), now = new Date()) {
  mkdirSync(path.dirname(file), { recursive: true });
  const body = { updatedAt: now.toISOString(), levels };
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  writeFileSync(tmp, JSON.stringify(body, null, 2));
  renameSync(tmp, file);
  cache = { file: null, mtimeMs: -1, value: EMPTY };
  return body;
}
