// Retention study: an opt-in, pseudonymous count of which days a player returns. The store keys
// each player by an HMAC of their username, so the file holds no names. Reading your own consent
// and withdrawing always work. Enrolling and counting visits need RETENTION_STUDY_ENABLED=1 and a
// RETENTION_STUDY_KEY of at least 32 characters, or they answer 503 like the existing server.
import path from 'node:path';
import { ApiError } from './errors.js';
import { RetentionStudyStore, retentionEnabled } from '../src/services/study/retention-study.js';

const DEFAULT_FILE = path.resolve('server', 'data', 'retention-study.json');

let store = null;
function retentionStore() {
  if (!store) store = new RetentionStudyStore(process.env.RETENTION_STUDY_FILE || DEFAULT_FILE);
  return store;
}

/** Test seam: replace the store, or pass null to go back to the default. */
export function setRetentionStore(next) {
  store = next;
}

function unavailable() {
  return new ApiError(503, 'retention_study_unavailable');
}

async function guarded(fn) {
  try {
    return await fn();
  } catch {
    // Storage or key problems must not reveal details or erase consent.
    throw unavailable();
  }
}

function requireEmptyBody(body) {
  if (body && Object.keys(body).length) throw new ApiError(400, 'unexpected_fields');
}

export function getStudyStatus(player) {
  return guarded(async () => ({ success: true, ...(await retentionStore().status(player.username)) }));
}

export function withdrawStudy(player) {
  return guarded(async () => ({ success: true, ...(await retentionStore().withdraw(player.username)) }));
}

export async function optInStudy(player, body) {
  if (!retentionEnabled()) throw unavailable();
  requireEmptyBody(body);
  return guarded(async () => ({ success: true, ...(await retentionStore().optIn(player.username)) }));
}

export async function recordVisit(player, body) {
  if (!retentionEnabled()) throw unavailable();
  requireEmptyBody(body);
  return guarded(async () => ({ success: true, ...(await retentionStore().visit(player.username)) }));
}
