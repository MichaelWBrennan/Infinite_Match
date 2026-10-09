/**
 * Tournaments and community challenges, read from config/liveops.json (the `tournaments` and
 * `challenges` lists).
 *
 * - A tournament ranks players by their best winning score inside its time window. When it ends,
 *   an admin settles it and the prizes are granted once per player.
 * - A community challenge counts every won level from all players inside its window. Once the
 *   total reaches the goal, each player who contributed at least one win can claim the reward once.
 *
 * Invalid entries are dropped and the error is reported. Valid entries are kept.
 */

import { existsSync, readFileSync } from 'fs';
import { Logger } from '../../core/logger/index.js';
import { liveOpsConfigPath } from './live-ops.js';

const logger = new Logger('Competitions');

export const MAX_PRIZE_COINS = 100000;
export const MAX_CHALLENGE_GOAL = 1000000;
export const MAX_RANKED_PLACE = 100;

const ID_PATTERN = /^[a-z0-9][a-z0-9_-]{2,39}$/;

const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const parseTime = (v) => {
  if (typeof v !== 'string') return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
};

function validateWindow(entry, errors, label) {
  const startMs = parseTime(entry.start);
  const endMs = parseTime(entry.end);
  if (startMs === null || endMs === null) errors.push(`${label}: start and end must be dates`);
  else if (endMs <= startMs) errors.push(`${label}: end must be after start`);
  return startMs !== null && endMs !== null && endMs > startMs ? { startMs, endMs } : null;
}

function validateTournament(t, errors) {
  const label = `tournament ${t?.id ?? '?'}`;
  if (typeof t?.id !== 'string' || !ID_PATTERN.test(t.id)) {
    errors.push(`${label}: id must be 3-40 lowercase letters, digits, - or _`);
    return null;
  }
  if (typeof t.name !== 'string' || t.name.trim() === '') {
    errors.push(`${label}: name is required`);
    return null;
  }
  const window = validateWindow(t, errors, label);
  if (!window || !Array.isArray(t.prizes) || t.prizes.length === 0) {
    if (window && !Array.isArray(t.prizes)) errors.push(`${label}: prizes is required`);
    return null;
  }
  const prizes = [];
  for (const p of t.prizes) {
    if (!isInt(p?.from, 1, MAX_RANKED_PLACE) || !isInt(p?.to, 1, MAX_RANKED_PLACE) || p.to < p.from) {
      errors.push(`${label}: prize places must be whole numbers from 1 to ${MAX_RANKED_PLACE}, from <= to`);
      return null;
    }
    if (!isInt(p.coins, 1, MAX_PRIZE_COINS)) {
      errors.push(`${label}: prize coins must be 1 to ${MAX_PRIZE_COINS}`);
      return null;
    }
    prizes.push({ from: p.from, to: p.to, coins: p.coins });
  }
  return { id: t.id, name: t.name.trim(), ...window, prizes };
}

function validateChallenge(c, errors) {
  const label = `challenge ${c?.id ?? '?'}`;
  if (typeof c?.id !== 'string' || !ID_PATTERN.test(c.id)) {
    errors.push(`${label}: id must be 3-40 lowercase letters, digits, - or _`);
    return null;
  }
  if (typeof c.name !== 'string' || c.name.trim() === '') {
    errors.push(`${label}: name is required`);
    return null;
  }
  const window = validateWindow(c, errors, label);
  if (!isInt(c.goal, 1, MAX_CHALLENGE_GOAL)) {
    errors.push(`${label}: goal must be 1 to ${MAX_CHALLENGE_GOAL}`);
    return null;
  }
  if (!isInt(c.reward?.coins, 1, MAX_PRIZE_COINS)) {
    errors.push(`${label}: reward.coins must be 1 to ${MAX_PRIZE_COINS}`);
    return null;
  }
  if (!window) return null;
  return { id: c.id, name: c.name.trim(), goal: c.goal, reward: { coins: c.reward.coins }, ...window };
}

/** Checks the competitions part of a live ops config. Returns { errors, tournaments, challenges }. */
export function validateCompetitions(raw) {
  const errors = [];
  const tournaments = [];
  const challenges = [];
  const seen = new Set();
  const dedupe = (id, kind) => {
    if (seen.has(id)) {
      errors.push(`${kind} ${id}: duplicate id`);
      return false;
    }
    seen.add(id);
    return true;
  };
  for (const t of Array.isArray(raw?.tournaments) ? raw.tournaments : []) {
    const v = validateTournament(t, errors);
    if (v && dedupe(v.id, 'tournament')) tournaments.push(v);
  }
  for (const c of Array.isArray(raw?.challenges) ? raw.challenges : []) {
    const v = validateChallenge(c, errors);
    if (v && dedupe(v.id, 'challenge')) challenges.push(v);
  }
  return { errors, tournaments, challenges };
}

/** Reads the competitions from the live ops file. Missing or invalid config gives none. */
export function loadCompetitions(path = liveOpsConfigPath()) {
  if (!existsSync(path)) return { tournaments: [], challenges: [] };
  try {
    const { errors, tournaments, challenges } = validateCompetitions(JSON.parse(readFileSync(path, 'utf-8')));
    for (const e of errors) logger.error('Invalid competition ignored', { error: e });
    return { tournaments, challenges };
  } catch (error) {
    logger.error('Could not read competitions', { error: error.message });
    return { tournaments: [], challenges: [] };
  }
}

/** Competitions whose window contains `nowMs`. */
export function activeCompetitions(config, nowMs = Date.now()) {
  const inside = (c) => nowMs >= c.startMs && nowMs <= c.endMs;
  return {
    tournaments: config.tournaments.filter(inside),
    challenges: config.challenges.filter(inside),
  };
}

/** Coins for a tournament place, or 0 when the place does not earn a prize. */
export function prizeForRank(tournament, rank) {
  const prize = tournament.prizes.find((p) => rank >= p.from && rank <= p.to);
  return prize ? prize.coins : 0;
}

export default { validateCompetitions, loadCompetitions, activeCompetitions, prizeForRank };
