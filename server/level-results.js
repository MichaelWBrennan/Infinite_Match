// Level results: the client reports each finished level (outcome, score, moves left), and the
// tuning job reads those reports to suggest target changes. Reports are client-reported and
// unverified, so they are used for review only. The record carries no player ID.
import path from 'node:path';
import { ApiError } from './errors.js';
import { FileLevelResultsStore } from '../src/services/level-results-store.js';
import { runTuning, validateLevelResult } from '../src/services/level-tuning.js';
import { readLevelOverrides } from '../src/services/meta/level-overrides.js';

const DEFAULT_RESULTS_FILE = path.resolve('server', 'data', 'level-results.jsonl');

let store = null;
function resultsStore() {
  if (!store) store = new FileLevelResultsStore(process.env.LEVEL_RESULTS_FILE || DEFAULT_RESULTS_FILE);
  return store;
}

/** Test seam: replace the store, or pass null to go back to the default. */
export function setLevelResultsStore(next) {
  store = next;
}

export function isOperator(username) {
  const names = (process.env.OPERATOR_USERNAMES || '').split(',').map((name) => name.trim()).filter(Boolean);
  return Boolean(username) && names.includes(username);
}

export function getTargets() {
  const overrides = readLevelOverrides();
  return { success: true, levels: overrides.levels, updatedAt: overrides.updatedAt };
}

export async function submitResult(body) {
  const parsed = validateLevelResult(body);
  if (parsed.error) throw new ApiError(400, parsed.error);
  try {
    await resultsStore().append(parsed.value);
  } catch {
    throw new ApiError(500, 'storage_failed', 'The level result could not be stored.');
  }
  return { success: true };
}

function requireOperator(player) {
  if (!isOperator(player.username)) throw new ApiError(403, 'forbidden');
}

export async function tuningReport(player) {
  requireOperator(player);
  const plan = await runTuning({ store: resultsStore(), apply: false });
  const overrides = readLevelOverrides();
  return {
    success: true,
    proposals: plan.proposals,
    current: overrides.levels,
    updatedAt: overrides.updatedAt,
    source: 'legacy_client_reported_only',
  };
}

export async function tuningApply(player, body) {
  requireOperator(player);
  if (process.env.LEVEL_TUNING_MANUAL_ENABLED !== '1') throw new ApiError(403, 'tuning_apply_disabled');
  const { level, expectedFrom, expectedUpdatedAt, reviewId } = body || {};
  if (!Number.isSafeInteger(level) || level < 1 || level > 10000
    || typeof expectedFrom !== 'number' || expectedFrom < 0.8 || expectedFrom > 1.2
    || !Object.hasOwn(body || {}, 'expectedUpdatedAt')
    || !(expectedUpdatedAt === null || typeof expectedUpdatedAt === 'string')
    || typeof reviewId !== 'string' || !/^review-[a-z0-9-]{8,48}$/.test(reviewId)) {
    throw new ApiError(400, 'invalid_tuning_approval');
  }
  let plan;
  try {
    plan = await runTuning({ store: resultsStore(), apply: true, approvedLevel: level, expectedFrom, expectedUpdatedAt });
  } catch (error) {
    if (error.code === 'tuning_plan_stale' || error.code === 'tuning_approval_required') {
      throw new ApiError(409, error.code);
    }
    throw new ApiError(500, 'tuning_error');
  }
  const saved = readLevelOverrides();
  return { success: true, applied: plan.proposals, levels: saved.levels, updatedAt: saved.updatedAt, reviewId };
}
