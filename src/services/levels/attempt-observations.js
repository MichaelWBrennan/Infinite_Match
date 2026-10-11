// Read-only, de-identified observations of server-issued generated attempts. Never used for
// rewards, ranking or automatic difficulty changes. No player/attempt ID, location, IP,
// raw seed, board, replay transcript or exact time is written to the JSONL file.
import { promises as fs } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHmac } from 'node:crypto';
import { Logger } from '../../core/logger/index.js';

const logger = new Logger('AttemptObservations');
export const MIN_OBSERVATION_SAMPLE = 20;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const OUTCOMES = new Set(['started', 'verified_win', 'unverified_win', 'reported_loss', 'reported_quit', 'replaced', 'expired']);
const PROFILE = new Set(['score', 'collect', 'score-and-collect', 'collect-pair', 'clear-shields']);
const DIFFICULTY = new Set(['gentle', 'steady', 'challenging', 'boss']);
const SEED_KEY = /^[0-9a-f]{16}$/;
const int = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
export const observationFile = () => process.env.ATTEMPT_OBSERVATIONS_FILE || resolve('var', 'attempt-observations.jsonl');

/** The key is operator-managed. Without it, seed grouping is deliberately omitted. */
export function observationMeta(definition, priorStarts = 0, key = process.env.OBSERVATION_SEED_KEY) {
  if (!definition || !['classic', 'daily'].includes(definition.mode) || !int(definition.generatorVersion, 4, 5)) return null;
  const seedGroup = int(definition.seed, 0, 0xffffffff) && typeof key === 'string' && key.length >= 32
    ? createHmac('sha256', key).update(`${definition.generatorVersion}:${definition.seed}`).digest('hex').slice(0, 16)
    : null;
  return { version: definition.generatorVersion, mode: definition.mode, level: definition.level,
    profile: PROFILE.has(definition.objectiveProfile) ? definition.objectiveProfile : 'score',
    difficulty: DIFFICULTY.has(definition.difficulty) ? definition.difficulty : 'steady',
    cohort: priorStarts === 0 ? 'first_observed' : priorStarts < 5 ? 'early_observed' : 'established_observed', seedGroup };
}

/** The signals are client-reported diagnostics only; never interpreted as proof of gameplay. */
export function observationRow(meta, outcome, signals = {}, nowMs = Date.now()) {
  if (!meta || !OUTCOMES.has(outcome)) return null;
  const hints = int(signals.hintsUsed, 0, 99) ? signals.hintsUsed : null;
  const used = int(signals.movesUsed, 0, 1000) ? signals.movesUsed : null;
  const budget = int(signals.moveBudget, 1, 1000) ? signals.moveBudget : null;
  const progress = used === null || budget === null || used > budget ? 'unknown'
    : used < budget / 3 ? 'early' : used < budget * 2 / 3 ? 'middle' : 'late';
  return { day: new Date(nowMs).toISOString().slice(0, 10), ...meta, outcome,
    inventoryUses: int(signals.inventoryUses, 0, 20) ? signals.inventoryUses : 0,
    reportedHints: hints, reportedProgress: progress };
}

/** Best effort: an unavailable telemetry file must never revoke a paid attempt or reward. */
export async function observeAttempt(meta, outcome, signals = {}, nowMs = Date.now(), file = observationFile()) {
  const row = observationRow(meta, outcome, signals, nowMs);
  if (!row) return;
  try {
    await fs.mkdir(dirname(file), { recursive: true });
    await fs.appendFile(file, `${JSON.stringify(row)}\n`, { encoding: 'utf8', mode: 0o600 });
  } catch (error) {
    logger.warn('Attempt observation unavailable; gameplay continues', { error: error.message });
  }
}

function validRow(row) {
  return row && typeof row.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.day)
    && int(row.level, 1, 100000) && int(row.version, 4, 5)
    && ['classic', 'daily'].includes(row.mode) && PROFILE.has(row.profile)
    && DIFFICULTY.has(row.difficulty) && ['first_observed', 'early_observed', 'established_observed'].includes(row.cohort)
    && (row.seedGroup === null || SEED_KEY.test(row.seedGroup)) && OUTCOMES.has(row.outcome)
    && int(row.inventoryUses, 0, 20) && (row.reportedHints === null || int(row.reportedHints, 0, 99))
    && ['early', 'middle', 'late', 'unknown'].includes(row.reportedProgress);
}

/** Read a bounded local file. Retain malformed-line counts, never echo raw lines. */
export async function readAttemptObservations(file = observationFile()) {
  let text;
  try {
    if ((await fs.stat(file)).size > MAX_FILE_BYTES) throw new Error('observation_file_too_large');
    text = await fs.readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return { rows: [], skipped: 0 };
    throw error;
  }
  const rows = []; let skipped = 0;
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (validRow(row)) rows.push(row); else skipped++;
    } catch { skipped++; }
  }
  return { rows, skipped };
}

const round3 = (n) => Math.round(n * 1000) / 1000;
/** Aggregate only stable, low-cardinality slices; suppress groups below k started attempts. */
export function summarizeAttemptObservations(rows, { minSample = MIN_OBSERVATION_SAMPLE, bySeed = false } = {}) {
  const groups = new Map();
  for (const row of rows) {
    if (!validRow(row)) continue;
    if (bySeed && !row.seedGroup) continue;
    const key = JSON.stringify([row.mode, row.version, row.level, row.profile, row.difficulty, row.cohort, bySeed ? row.seedGroup : null]);
    let group = groups.get(key);
    if (!group) {
      group = { mode: row.mode, version: row.version, level: row.level, profile: row.profile,
        difficulty: row.difficulty, cohort: row.cohort, ...(bySeed ? { seedGroup: row.seedGroup } : {}),
        started: 0, verifiedWins: 0, unverifiedWins: 0, reportedLosses: 0, reportedQuits: 0,
        replaced: 0, expired: 0, assistedVerifiedWins: 0, reportedHintWins: 0,
        lossProgress: { early: 0, middle: 0, late: 0, unknown: 0 } };
      groups.set(key, group);
    }
    switch (row.outcome) {
    case 'started': group.started++; break;
    case 'verified_win':
      group.verifiedWins++;
      if (row.inventoryUses > 0) group.assistedVerifiedWins++;
      if (row.reportedHints > 0) group.reportedHintWins++;
      break;
    case 'unverified_win': group.unverifiedWins++; break;
    case 'reported_loss': group.reportedLosses++; group.lossProgress[row.reportedProgress]++; break;
    case 'reported_quit': group.reportedQuits++; group.lossProgress[row.reportedProgress]++; break;
    case 'replaced': group.replaced++; break;
    case 'expired': group.expired++; break;
    }
  }
  const visible = [...groups.values()].filter((g) => g.started >= minSample).map((g) => {
    const settled = g.verifiedWins + g.unverifiedWins + g.reportedLosses + g.reportedQuits + g.replaced + g.expired;
    const incompleteLog = settled > g.started; // Failed append or truncated/rotated file invalidates the denominator.
    return { ...g, unsettled: Math.max(0, g.started - settled), incompleteLog,
      verifiedWinPerStart: incompleteLog ? null : round3(g.verifiedWins / g.started),
      verifiedShareOfSettled: incompleteLog || !settled ? null : round3(g.verifiedWins / settled) };
  });
  return { groups: visible.sort((a, b) => a.level - b.level || a.mode.localeCompare(b.mode)),
    suppressedGroups: groups.size - visible.length, minSample, source: 'server-issued starts and replay-verified wins; losses, quits and hints are client-reported' };
}
