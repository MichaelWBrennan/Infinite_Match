// Offline, operator-reviewed web stability study. No runtime tracker, network endpoint,
// account identifiers, stack traces, precise timestamps or free text. The evaluator
// cannot verify that submitted session rows came from real people or physical devices.
export const STABILITY_SCHEMA_VERSION = 1;
export const MIN_STABILITY_SESSIONS = 1000;
export const MIN_STABILITY_STRATUM = 20;
const MAX_SESSIONS = 10000;
const DEVICES = new Set(['small_android', 'mid_android', 'small_iphone', 'notched_iphone', 'tablet', 'desktop']);
const BROWSERS = new Set(['chrome', 'safari', 'firefox', 'edge', 'other']);
const ACCESS = new Set(['standard', 'large_text', 'reduced_motion', 'named_board', 'screen_reader', 'not_disclosed']);
const EVIDENCE = new Set(['facilitator', 'device_diagnostic', 'client_only', 'unknown']);
const OUTCOMES = new Set(['no_crash_observed', 'confirmed_crash', 'unknown']);
const ROOT_KEYS = ['schemaVersion', 'studyId', 'build', 'sessions'];
const SESSION_KEYS = ['sessionCode', 'device', 'browser', 'accessMode', 'evidence', 'outcome', 'clientErrorObserved'];
const isRecord = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const exactKeys = (v, keys) => isRecord(v) && Object.keys(v).length === keys.length
  && keys.every((key) => Object.hasOwn(v, key));
const rate = (count, total) => total ? Number((count / total).toFixed(4)) : null;

/** Reject unexpected fields so a private identifier or error stack cannot leak into a report. */
export function validateStabilityStudy(input) {
  if (!exactKeys(input, ROOT_KEYS) || input.schemaVersion !== STABILITY_SCHEMA_VERSION
    || typeof input.studyId !== 'string' || !/^study-[a-z0-9-]{4,32}$/.test(input.studyId)
    || typeof input.build !== 'string' || !/^[a-f0-9]{8,40}$/.test(input.build)
    || /^0+$/.test(input.build) || !Array.isArray(input.sessions) || input.sessions.length > MAX_SESSIONS) {
    return { error: 'invalid_study' };
  }
  const codes = new Set();
  for (let i = 0; i < input.sessions.length; i++) {
    const row = input.sessions[i];
    if (!exactKeys(row, SESSION_KEYS) || typeof row.sessionCode !== 'string'
      || !/^s-[a-z0-9-]{8,20}$/.test(row.sessionCode) || codes.has(row.sessionCode)
      || !DEVICES.has(row.device) || !BROWSERS.has(row.browser) || !ACCESS.has(row.accessMode)
      || !EVIDENCE.has(row.evidence) || !OUTCOMES.has(row.outcome)
      || !(row.clientErrorObserved === null || typeof row.clientErrorObserved === 'boolean')
      || (row.outcome !== 'unknown' && !['facilitator', 'device_diagnostic'].includes(row.evidence))) {
      return { error: 'invalid_session', row: i + 1 }; // Never echo row data or codes.
    }
    codes.add(row.sessionCode);
  }
  return { value: input };
}

// Approximate 95% Wilson interval for independent, fully observed session outcomes.
// Repeated players, biased recruitment or unreliable diagnostics invalidate that assumption.
function wilson(successes, count) {
  if (!count) return null;
  const z = 1.96; const z2 = z * z; const p = successes / count;
  const center = (p + z2 / (2 * count)) / (1 + z2 / count);
  const half = z * Math.sqrt(p * (1 - p) / count + z2 / (4 * count * count)) / (1 + z2 / count);
  return { lower: Number(Math.max(0, center - half).toFixed(4)), upper: Number(Math.min(1, center + half).toFixed(4)) };
}

function breakdown(rows, dimension) {
  const cells = new Map();
  for (const row of rows) {
    if (!cells.has(row[dimension])) cells.set(row[dimension], []);
    cells.get(row[dimension]).push(row);
  }
  const suppressedGroups = [...cells.values()].filter((members) => members.length < MIN_STABILITY_STRATUM).length;
  // A visible group's metrics plus the overall total would reveal a hidden group's
  // crashes by subtraction, so suppress the whole dimension if any cell is small.
  return {
    groups: suppressedGroups ? [] : [...cells]
      .map(([label, members]) => ({ label, sessions: members.length,
        confirmedCrashes: members.filter((s) => s.outcome === 'confirmed_crash').length,
        unknownOutcomes: members.filter((s) => s.outcome === 'unknown').length,
        clientErrorsObserved: members.filter((s) => s.clientErrorObserved === true).length }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    suppressedGroups,
  };
}

/** Descriptive check of the existing >=99.5% / >=1000-session proposed beta gate only. */
export function evaluateStabilityStudy(input) {
  const checked = validateStabilityStudy(input);
  if (checked.error) return checked;
  const rows = input.sessions;
  const crashes = rows.filter((s) => s.outcome === 'confirmed_crash').length;
  const unknown = rows.filter((s) => s.outcome === 'unknown').length;
  const clean = rows.length - crashes - unknown;
  const clientErrors = rows.filter((s) => s.clientErrorObserved === true).length;
  const missingErrorChecks = rows.filter((s) => s.clientErrorObserved === null).length;
  const status = rows.length < MIN_STABILITY_SESSIONS ? 'insufficient_sample'
    : unknown > 0 ? 'incomplete_outcomes'
      : clean / rows.length >= 0.995 ? 'criteria_met_in_records' : 'below_threshold';
  const visible = rows.length >= MIN_STABILITY_STRATUM;
  return {
    schemaVersion: STABILITY_SCHEMA_VERSION, studyId: input.studyId, build: input.build,
    status: status === 'criteria_met_in_records' ? 'criteria_met_in_submitted_records' : 'not_met',
    stability: { sessions: rows.length, minimum: MIN_STABILITY_SESSIONS, threshold: 0.995,
      noCrashObserved: visible ? clean : null, confirmedCrashes: visible ? crashes : null,
      unknownOutcomes: visible ? unknown : null,
      // Unknowns stay in the denominator and are not treated as healthy.
      conservativeNoCrashRate: visible ? rate(clean, rows.length) : null,
      approximate95PercentWilson: visible && !unknown ? wilson(clean, rows.length) : null, status },
    clientErrors: { observed: visible ? clientErrors : null, missingChecks: visible ? missingErrorChecks : null,
      note: 'A script error is not necessarily a browser crash; absence of an error report does not prove survival.' },
    breakdown: Object.fromEntries(['device', 'browser', 'accessMode', 'evidence']
      .map((dimension) => [dimension, breakdown(rows, dimension)])),
    note: 'Submitted outcomes are not proof of real consenting sessions, independent players, device coverage or release readiness. Validate diagnostics and investigate every crash separately.',
  };
}
