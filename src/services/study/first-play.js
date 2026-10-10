// Offline, operator-reviewed web playtest gate. No runtime endpoint, account identifiers,
// free text, raw seed, fine-grained geography or personal telemetry. Submitted observations
// are not proof that human sessions took place; other release gates remain independent.
export const STUDY_SCHEMA_VERSION = 1;
export const MIN_LEARNING = 20;
export const MIN_LOSS_PILOT = 30;
export const MIN_STRATUM = 5;
const MAX_SESSIONS = 500;
const DEVICES = new Set(['small_android', 'mid_android', 'small_iphone', 'notched_iphone', 'tablet', 'desktop']);
const PHONES = new Set(['small_android', 'mid_android', 'small_iphone', 'notched_iphone']);
const BROWSERS = new Set(['chrome', 'safari', 'firefox', 'edge', 'other']);
const NETWORKS = new Set(['wifi', '4g_throttled', 'offline', 'unknown']);
const INPUTS = new Set(['touch', 'keyboard', 'named_board']);
const ACCESS = new Set(['standard', 'large_text', 'reduced_motion', 'named_board', 'screen_reader', 'not_disclosed']);
const OBJECTIVES = new Set(['score', 'collect', 'collect_pair', 'score_and_collect', 'clear_shields', 'unknown']);
const DIFFICULTIES = new Set(['gentle', 'steady', 'challenging', 'boss', 'unknown']);
const OUTCOMES = new Set(['won', 'lost', 'quit', 'unfinished']);
const ROOT_KEYS = ['schemaVersion', 'studyId', 'build', 'sessions'];
const SESSION_KEYS = ['participantCode', 'device', 'browser', 'network', 'input', 'accessMode',
  'firstTime', 'coachedBeforeMove', 'firstMoveSeconds', 'goalExplained', 'objective',
  'difficulty', 'boardGroup', 'outcome', 'enjoyment', 'lossFair'];
const isRecord = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const exactKeys = (v, expected) => isRecord(v) && Object.keys(v).length === expected.length
  && expected.every((k) => Object.hasOwn(v, k));
const isNullableBool = (v) => v === null || typeof v === 'boolean';
const isNullableRating = (v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 5);

/** Strict schema: fail closed on extra fields so identifiers/notes cannot leak to reports. */
export function validateStudy(input) {
  if (!exactKeys(input, ROOT_KEYS) || input.schemaVersion !== STUDY_SCHEMA_VERSION
    || typeof input.studyId !== 'string' || !/^study-[a-z0-9-]{4,32}$/.test(input.studyId)
    || typeof input.build !== 'string' || !/^[a-f0-9]{8,40}$/.test(input.build)
    || /^0+$/.test(input.build) || !Array.isArray(input.sessions) || input.sessions.length > MAX_SESSIONS) {
    return { error: 'invalid_study' };
  }
  const codes = new Set();
  for (let i = 0; i < input.sessions.length; i++) {
    const s = input.sessions[i];
    if (!exactKeys(s, SESSION_KEYS) || typeof s.participantCode !== 'string'
      || !/^p-[a-z0-9-]{4,16}$/.test(s.participantCode) || codes.has(s.participantCode)
      || !DEVICES.has(s.device) || !BROWSERS.has(s.browser) || !NETWORKS.has(s.network)
      || !INPUTS.has(s.input) || !ACCESS.has(s.accessMode)
      || !OBJECTIVES.has(s.objective) || !DIFFICULTIES.has(s.difficulty)
      || !OUTCOMES.has(s.outcome) || typeof s.firstTime !== 'boolean'
      || typeof s.coachedBeforeMove !== 'boolean'
      || !(s.firstMoveSeconds === null || (Number.isInteger(s.firstMoveSeconds)
        && s.firstMoveSeconds >= 0 && s.firstMoveSeconds <= 300))
      || !isNullableBool(s.goalExplained) || !isNullableRating(s.enjoyment)
      || !isNullableBool(s.lossFair)
      || (s.outcome !== 'lost' && s.lossFair !== null)
      || typeof s.boardGroup !== 'string'
      || !(s.boardGroup === 'unknown' || /^group-[a-z]{1,12}$/.test(s.boardGroup))) {
      return { error: 'invalid_session', row: i + 1 }; // Do not echo values, codes or notes.
    }
    codes.add(s.participantCode);
  }
  return { value: input };
}

const rate = (n, d) => d ? Number((n / d).toFixed(3)) : null;
function gate(size, minimum, missing, meetsThreshold) {
  if (size < minimum) return 'insufficient_sample';
  if (missing > 0) return 'incomplete_responses';
  return meetsThreshold ? 'criteria_met_in_records' : 'below_threshold';
}
function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function stratum(rows, dimension, cohort = 'overall') {
  const cells = new Map();
  for (const row of rows) {
    if (!cells.has(row[dimension])) cells.set(row[dimension], []);
    cells.get(row[dimension]).push(row);
  }
  const groups = [...cells].filter(([, members]) => members.length >= MIN_STRATUM)
    .map(([label, members]) => {
      const base = { label, sessions: members.length };
      if (cohort === 'learning') return { ...base,
        unassistedMoveRate: rate(members.filter((s) => !s.coachedBeforeMove
          && s.firstMoveSeconds !== null && s.firstMoveSeconds <= 30).length, members.length),
        goalRate: rate(members.filter((s) => s.goalExplained === true && !s.coachedBeforeMove).length, members.length),
        missingGoal: members.filter((s) => s.goalExplained === null).length };
      if (cohort === 'fairness') return { ...base,
        fairRate: rate(members.filter((s) => s.lossFair === true).length, members.length),
        medianEnjoyment: median(members.map((s) => s.enjoyment).filter((v) => v !== null)),
        missingFairness: members.filter((s) => s.lossFair === null).length,
        missingEnjoyment: members.filter((s) => s.enjoyment === null).length };
      return base;
    }).sort((a, b) => a.label.localeCompare(b.label));
  return { groups, suppressedGroups: [...cells.values()].filter((members) => members.length < MIN_STRATUM).length };
}

/** Evaluates only the documented first-play and loss-fairness study gates. */
export function evaluateStudy(input) {
  const checked = validateStudy(input);
  if (checked.error) return checked;
  const rows = input.sessions;
  const first = rows.filter((s) => s.firstTime && PHONES.has(s.device));
  const quickMove = first.filter((s) => !s.coachedBeforeMove
    && s.firstMoveSeconds !== null && s.firstMoveSeconds <= 30).length;
  const understood = first.filter((s) => s.goalExplained === true && !s.coachedBeforeMove).length;
  const missingGoal = first.filter((s) => s.goalExplained === null).length;
  const losses = rows.filter((s) => s.outcome === 'lost');
  const missingFairness = losses.filter((s) => s.lossFair === null).length;
  const missingEnjoyment = losses.filter((s) => s.enjoyment === null).length;
  const fair = losses.filter((s) => s.lossFair === true).length;
  const med = median(losses.map((s) => s.enjoyment).filter((v) => v !== null));
  const learningStatus = gate(first.length, MIN_LEARNING, missingGoal,
    quickMove / first.length >= 0.9 && understood / first.length >= 0.9);
  const fairnessStatus = gate(losses.length, MIN_LOSS_PILOT, missingFairness + missingEnjoyment,
    fair / losses.length >= 0.8 && med >= 4);
  return {
    schemaVersion: STUDY_SCHEMA_VERSION, studyId: input.studyId, build: input.build,
    status: learningStatus === 'criteria_met_in_records' && fairnessStatus === 'criteria_met_in_records'
      ? 'criteria_met_in_submitted_records' : 'not_met',
    note: 'Not proof of real participants, retention, device performance, accessibility, or release readiness.',
    learning: { cohort: 'first_time_phone', sessions: first.length, minimum: MIN_LEARNING,
      unassistedMovesBy30s: quickMove, unassistedMoveRate: rate(quickMove, first.length),
      goalsExplained: understood, goalRate: rate(understood, first.length), missingGoal, status: learningStatus },
    fairness: { cohort: 'observed_loss', sessions: losses.length, minimum: MIN_LOSS_PILOT,
      fairLosses: fair, fairRate: rate(fair, losses.length), medianEnjoyment: med,
      missingFairness, missingEnjoyment, status: fairnessStatus },
    overallSessions: rows.length,
    // Suppress small strata. No individual row or pseudonymous code is ever emitted.
    breakdown: Object.fromEntries(['device', 'browser', 'network', 'input', 'accessMode', 'objective', 'difficulty', 'boardGroup']
      .map((dimension) => [dimension, stratum(rows, dimension)])),
    cohortBreakdown: Object.fromEntries([['learning', first], ['fairness', losses]].map(([cohort, members]) => [cohort,
      Object.fromEntries(['device', 'input', 'accessMode', 'objective', 'difficulty', 'boardGroup']
        .map((dimension) => [dimension, stratum(members, dimension, cohort)]))])),
  };
}
