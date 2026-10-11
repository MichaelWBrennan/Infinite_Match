/**
 * Level results for difficulty tuning.
 *
 * Players report each finished level. The server checks the report, recomputes
 * the stars from the score, and appends one line to a JSONL file. The admin
 * tuning report summarises those lines per level and flags levels that are
 * too hard or too easy to be left alone.
 *
 * Stars are rule-compatible with the client: 1x, 1.5x and 2x the level target.
 */

import { promises as fs } from 'fs';
import { dirname, resolve } from 'path';
import {
  applyProposals,
  proposeOverrides,
  readLevelOverrides,
  writeLevelOverrides,
} from './meta/level-overrides.js';

// Console logger: keeps this module importable from plain Node (the free server).
const logger = { warn: (message, meta) => console.warn(`[LevelTuning] ${message}`, meta || '') };

// Read at call time so the path can be configured after import.
export function levelResultsFile() {
  return process.env.LEVEL_RESULTS_FILE || resolve('var', 'level-results.jsonl');
}

// A level needs this many attempts before it can be flagged.
export const MIN_ATTEMPTS_TO_FLAG = 20;
export const TOO_HARD_WIN_RATE = 0.3;
export const TOO_EASY_WIN_RATE = 0.95;

const LIMITS = {
  level: [1, 100000],
  score: [0, 10000000],
  targetScore: [1, 10000000],
  movesLeft: [0, 1000],
  durationSeconds: [0, 3600],
};

function isIntIn(value, [min, max]) {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function starsFor(score, targetScore) {
  const target = targetScore || 1000;
  if (score >= target * 2) return 3;
  if (score >= target * 1.5) return 2;
  if (score >= target) return 1;
  return 0;
}

/**
 * Checks a client report. Returns { value } with the normalised record, or { error }.
 * A win must reach the target score, and a loss must not.
 */
export function validateLevelResult(body) {
  if (!body || typeof body !== 'object') return { error: 'body_required' };
  const { level, outcome, score, targetScore, movesLeft, durationSeconds, isBoss } = body;

  for (const [field, range] of Object.entries(LIMITS)) {
    if (!isIntIn(body[field], range)) return { error: `invalid_${field}` };
  }
  if (outcome !== 'won' && outcome !== 'lost') return { error: 'invalid_outcome' };
  if (typeof isBoss !== 'boolean') return { error: 'invalid_isBoss' };
  if ((outcome === 'won') !== (score >= targetScore)) return { error: 'outcome_mismatch' };

  return {
    value: {
      level,
      outcome,
      score,
      targetScore,
      stars: starsFor(score, targetScore),
      movesLeft,
      durationSeconds,
      isBoss,
    },
  };
}

export async function appendLevelResult(record, file = levelResultsFile()) {
  await fs.mkdir(dirname(file), { recursive: true });
  await fs.appendFile(file, JSON.stringify({ ...record, ts: Date.now() }) + '\n', 'utf-8');
}

/** Reads all records. Lines that are not valid JSON are skipped and counted. */
export async function readLevelResults(file = levelResultsFile()) {
  let text;
  try {
    text = await fs.readFile(file, 'utf-8');
  } catch (error) {
    if (error.code === 'ENOENT') return { records: [], skipped: 0 };
    throw error;
  }
  const records = [];
  let skipped = 0;
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      records.push(JSON.parse(line));
    } catch {
      skipped++;
    }
  }
  if (skipped > 0) logger.warn('Skipped malformed level result lines', { skipped });
  return { records, skipped };
}

const round3 = (n) => Math.round(n * 1000) / 1000;

function flagFor(attempts, winRate) {
  if (attempts < MIN_ATTEMPTS_TO_FLAG) return 'insufficient_data';
  if (winRate < TOO_HARD_WIN_RATE) return 'too_hard';
  if (winRate > TOO_EASY_WIN_RATE) return 'too_easy';
  return 'ok';
}

/** Per-level summary, sorted by level number. */
export function summarizeLevelResults(records) {
  const byLevel = new Map();
  for (const r of records) {
    if (!isIntIn(r.level, LIMITS.level)) continue;
    let s = byLevel.get(r.level);
    if (!s) {
      s = { level: r.level, attempts: 0, wins: 0, bossAttempts: 0, sumStars: 0, sumScoreRatio: 0, sumMovesLeftOnWin: 0 };
      byLevel.set(r.level, s);
    }
    s.attempts++;
    if (r.outcome === 'won') {
      s.wins++;
      s.sumMovesLeftOnWin += r.movesLeft;
    }
    if (r.isBoss) s.bossAttempts++;
    s.sumStars += r.stars;
    s.sumScoreRatio += r.score / r.targetScore;
  }

  return [...byLevel.values()]
    .sort((a, b) => a.level - b.level)
    .map((s) => {
      const winRate = s.wins / s.attempts;
      return {
        level: s.level,
        attempts: s.attempts,
        winRate: round3(winRate),
        avgStars: round3(s.sumStars / s.attempts),
        avgScoreRatio: round3(s.sumScoreRatio / s.attempts),
        avgMovesLeftOnWin: s.wins > 0 ? round3(s.sumMovesLeftOnWin / s.wins) : null,
        isBoss: s.bossAttempts * 2 > s.attempts,
        flag: flagFor(s.attempts, winRate),
      };
    });
}

/**
 * Plans the tuning step from the results. Each level counts only results after its last move
 * (`tuned`), so a flagged level moves once per new batch of attempts, not once per run. Pure:
 * it returns the new levels and tuning times, and changes nothing.
 */
export function planTuning(records, { levels = {}, tuned = {} } = {}, now = Date.now()) {
  const windowed = records.filter((r) => {
    if (!isIntIn(r.level, LIMITS.level)) return false;
    const ts = Number.isFinite(r.ts) ? r.ts : 0;
    return ts > (tuned[r.level] || 0);
  });
  const summary = summarizeLevelResults(windowed);
  const proposals = proposeOverrides(summary, levels);
  const nextTuned = { ...tuned };
  for (const p of proposals) nextTuned[p.level] = now;
  return { summary, proposals, levels: applyProposals(levels, proposals), tuned: nextTuned };
}

let tuningChain = Promise.resolve();

/**
 * Reads the results and plans a tuning step. With `apply`, saves the new levels. Runs are
 * serialized, so two requests cannot both apply the same batch.
 */
export function runTuning({ store, file, apply = false, now = Date.now(), approvedLevel = null,
  expectedUpdatedAt = undefined, expectedFrom = undefined }) {
  const run = tuningChain.then(async () => {
    if (apply && (!Number.isSafeInteger(approvedLevel) || approvedLevel < 1
      || typeof expectedFrom !== 'number' || expectedUpdatedAt === undefined)) {
      throw Object.assign(new Error('tuning_approval_required'), { code: 'tuning_approval_required' });
    }
    const { records } = await store.read();
    const current = readLevelOverrides(file);
    if (apply && current.updatedAt !== expectedUpdatedAt) {
      throw Object.assign(new Error('tuning_plan_stale'), { code: 'tuning_plan_stale' });
    }
    const planned = planTuning(records, current, now);
    if (apply && !planned.proposals.some((p) => p.level === approvedLevel && p.from === expectedFrom)) {
      throw Object.assign(new Error('tuning_plan_stale'), { code: 'tuning_plan_stale' });
    }
    const plan = apply ? {
      ...planned,
      proposals: planned.proposals.filter((p) => p.level === approvedLevel),
      levels: applyProposals(current.levels, planned.proposals.filter((p) => p.level === approvedLevel)),
      tuned: { ...current.tuned, [approvedLevel]: now },
    } : planned;
    const applied = apply && plan.proposals.length > 0;
    if (applied) writeLevelOverrides(plan.levels, file, new Date(now), plan.tuned);
    return { ...plan, applied };
  });
  tuningChain = run.catch(() => {});
  return run;
}
