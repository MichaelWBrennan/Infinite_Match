/**
 * Retention Service - D1/D7/D30 cohort tracking for the retention dashboard.
 *
 * Tracks each player's first login date (cohort date) and subsequent login dates.
 * Computes retention rates by cohort day against genre benchmarks:
 *   - Match-3 median: D1 38%, D7 18%, D30 8%
 *   - Match-3 top quartile: D1 45%, D7 25%, D30 12%
 *
 * All state lives in JSONL files under monitoring/reports/; no database required.
 */

import { promises as fs } from 'fs';
import { join } from 'path';

const logger = { warn: (m, meta) => console.warn(`[Retention] ${m}`, meta || '') };

function reportsDir() {
  return process.env.RETENTION_REPORTS_DIR || 'monitoring/reports';
}
function cohortsFile() {
  return join(reportsDir(), 'retention-cohorts.jsonl');
}
function loginsFile() {
  return join(reportsDir(), 'retention-logins.jsonl');
}

const DAY_MS = 24 * 60 * 60 * 1000;

async function ensureDir() {
  await fs.mkdir(reportsDir(), { recursive: true });
}

async function appendJsonl(file, obj) {
  await ensureDir();
  await fs.appendFile(file, JSON.stringify(obj) + '\n', 'utf-8');
}

async function readJsonl(file) {
  try {
    const text = await fs.readFile(file, 'utf-8');
    const rows = [];
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try { rows.push(JSON.parse(line)); } catch { /* skip malformed */ }
    }
    return rows;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

/** UTC date string (YYYY-MM-DD) for a timestamp. */
const utcDay = (ms) => new Date(ms).toISOString().slice(0, 10);

/** Records a player's first login (cohort date) — idempotent per player. */
export async function recordFirstLogin(playerId, nowMs = Date.now()) {
  // Check if already recorded
  const logins = await readJsonl(loginsFile());
  const existing = logins.find(l => l.playerId === playerId && l.event === 'first_login');
  if (existing) return { alreadyRecorded: true, cohortDate: existing.cohortDate };

  const cohortDate = utcDay(nowMs);
  await appendJsonl(loginsFile(), {
    event: 'first_login',
    playerId,
    cohortDate,
    ts: nowMs,
  });
  return { alreadyRecorded: false, cohortDate };
}

/** Records a player login on a given day (for retention tracking). */
export async function recordLogin(playerId, nowMs = Date.now()) {
  const day = utcDay(nowMs);
  await appendJsonl(loginsFile(), {
    event: 'login',
    playerId,
    day,
    ts: nowMs,
  });
  return { day };
}

/** Genre benchmark retention rates (from industry research). */
const BENCHMARKS = {
  match3_median: { d1: 0.38, d7: 0.18, d30: 0.08 },
  match3_top: { d1: 0.45, d7: 0.25, d30: 0.12 },
};

/**
 * Computes retention by cohort day.
 * Returns { cohorts: [{ cohortDate, size, d1, d7, d30, d1Benchmarks, d7Benchmarks, d30Benchmarks }], overall }
 */
export async function computeRetention(nowMs = Date.now()) {
  const logins = await readJsonl(loginsFile());

  // First login per player = cohort date.
  const firstLogin = new Map();
  const loginDays = new Map(); // playerId -> Set of days

  for (const l of logins) {
    if (l.event === 'first_login') {
      firstLogin.set(l.playerId, l.cohortDate);
    } else if (l.event === 'login') {
      let days = loginDays.get(l.playerId);
      if (!days) { days = new Set(); loginDays.set(l.playerId, days); }
      days.add(l.day);
    }
  }

  // Group players by cohort date.
  const cohorts = new Map(); // cohortDate -> Set of playerIds
  for (const [playerId, cohortDate] of firstLogin) {
    let set = cohorts.get(cohortDate);
    if (!set) { set = new Set(); cohorts.set(cohortDate, set); }
    set.add(playerId);
  }

  const today = utcDay(nowMs);
  const todayMs = Date.parse(today + 'T00:00:00Z');

  const cohortResults = [];
  for (const [cohortDate, players] of cohorts) {
    const cohortStartMs = Date.parse(cohortDate + 'T00:00:00Z');
    const daysSinceCohort = Math.floor((todayMs - cohortStartMs) / DAY_MS);

    let d1Retained = 0, d7Retained = 0, d30Retained = 0;
    for (const playerId of players) {
      const days = loginDays.get(playerId) || new Set();
      // D1: logged in on cohortDate + 1 day
      if (days.has(addDays(cohortDate, 1))) d1Retained += 1;
      // D7: logged in on cohortDate + 7 days
      if (days.has(addDays(cohortDate, 7))) d7Retained += 1;
      // D30: logged in on cohortDate + 30 days
      if (days.has(addDays(cohortDate, 30))) d30Retained += 1;
    }

    const size = players.size;
    cohortResults.push({
      cohortDate,
      size,
      d1: size > 0 ? Math.round((d1Retained / size) * 10000) / 100 : 0,
      d7: size > 0 ? Math.round((d7Retained / size) * 10000) / 100 : 0,
      d30: size > 0 ? Math.round((d30Retained / size) * 10000) / 100 : 0,
      d1Benchmarks: BENCHMARKS,
      d7Benchmarks: BENCHMARKS,
      d30Benchmarks: BENCHMARKS,
      daysSinceCohort,
      canMeasureD1: daysSinceCohort >= 1,
      canMeasureD7: daysSinceCohort >= 7,
      canMeasureD30: daysSinceCohort >= 30,
    });
  }

  // Sort by cohort date descending (most recent first).
  cohortResults.sort((a, b) => b.cohortDate.localeCompare(a.cohortDate));

  // Overall averages across measurable cohorts.
  const measurableD1 = cohortResults.filter(c => c.canMeasureD1);
  const measurableD7 = cohortResults.filter(c => c.canMeasureD7);
  const measurableD30 = cohortResults.filter(c => c.canMeasureD30);

  const overall = {
    d1: avg(measurableD1, 'd1'),
    d7: avg(measurableD7, 'd7'),
    d30: avg(measurableD30, 'd30'),
    benchmarks: BENCHMARKS,
  };

  return { cohorts: cohortResults, overall, totalPlayers: firstLogin.size };
}

function addDays(day, n) {
  const d = new Date(Date.parse(day + 'T00:00:00Z'));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function avg(rows, field) {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((a, b) => a + b[field], 0);
  return Math.round((sum / rows.length) * 10000) / 100;
}

export default {
  recordFirstLogin,
  recordLogin,
  computeRetention,
};
