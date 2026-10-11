/** Live ops v1 (L1): personal score challenge. Pure definition, validation and progress only.
 * Not wired into config or claims yet (L2 and L3). A challenge counts verified classic wins
 * inside its window, sums their scores, and unlocks up to three coin tiers. The coin ceiling
 * matches the Hall Lanterns weekly event: each tier at most 40 coins, all tiers at most 80. */

export const CHALLENGE_MAX_TIERS = 3;
export const CHALLENGE_TIER_COINS_MAX = 40;
export const CHALLENGE_COIN_CEILING = 80;
export const CHALLENGE_MAX_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const CHALLENGE_TARGET_MIN = 1000;
export const CHALLENGE_TARGET_MAX = 100000;
const MAX_SAFE_TOTAL = 1000000000;
const ALLOWED_KEYS = new Set(['id', 'name', 'start', 'end', 'target', 'tiers']);
const ID = /^[a-z0-9_]{3,40}$/;

const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;

function parseTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(value)) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

/** Returns { errors, challenge } where challenge is a normalised copy, or null when invalid. */
export function validateScoreChallenge(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { errors: ['challenge must be an object'], challenge: null };
  for (const key of Object.keys(raw)) if (!ALLOWED_KEYS.has(key)) errors.push(`unknown field ${key}`);
  if (typeof raw.id !== 'string' || !ID.test(raw.id)) errors.push('id must be 3-40 lowercase letters, digits or underscores');
  if (typeof raw.name !== 'string' || !raw.name.trim() || raw.name.length > 60) errors.push('name must be 1-60 characters');
  const startMs = parseTime(raw.start);
  const endMs = parseTime(raw.end);
  if (startMs === null || endMs === null) errors.push('start and end must be UTC ISO times');
  else if (endMs <= startMs) errors.push('end must be after start');
  else if (endMs - startMs > CHALLENGE_MAX_DURATION_MS) errors.push('a challenge lasts at most seven days');
  if (!integer(raw.target, CHALLENGE_TARGET_MIN, CHALLENGE_TARGET_MAX)) {
    errors.push(`target must be an integer from ${CHALLENGE_TARGET_MIN} to ${CHALLENGE_TARGET_MAX}`);
  }
  const tiers = Array.isArray(raw.tiers) ? raw.tiers : null;
  if (!tiers || tiers.length < 1 || tiers.length > CHALLENGE_MAX_TIERS) {
    errors.push(`tiers must be a list of 1 to ${CHALLENGE_MAX_TIERS}`);
  } else {
    let previous = 0;
    let total = 0;
    tiers.forEach((tier, i) => {
      if (!tier || typeof tier !== 'object' || Array.isArray(tier) || Object.keys(tier).some((k) => k !== 'threshold' && k !== 'coins')) {
        errors.push(`tiers[${i}] must have only threshold and coins`);
        return;
      }
      if (!integer(tier.threshold, previous + 1, Number.isSafeInteger(raw.target) ? raw.target : CHALLENGE_TARGET_MAX)) {
        errors.push(`tiers[${i}].threshold must increase and stay within the target`);
      }
      if (!integer(tier.coins, 1, CHALLENGE_TIER_COINS_MAX)) errors.push(`tiers[${i}].coins must be 1 to ${CHALLENGE_TIER_COINS_MAX}`);
      else total += tier.coins;
      previous = Number.isSafeInteger(tier.threshold) ? tier.threshold : previous;
    });
    if (total > CHALLENGE_COIN_CEILING) errors.push(`tiers total at most ${CHALLENGE_COIN_CEILING} coins`);
  }
  if (errors.length) return { errors, challenge: null };
  return {
    errors,
    challenge: {
      id: raw.id, name: raw.name, startMs, endMs, target: raw.target,
      tiers: tiers.map((tier) => ({ threshold: tier.threshold, coins: tier.coins })),
    },
  };
}

/** Half-open window: a result counts from start (inclusive) to end (exclusive). */
export function challengeOpen(challenge, nowMs) {
  return Number.isFinite(nowMs) && nowMs >= challenge.startMs && nowMs < challenge.endMs;
}

/** results: verified classic wins as { score, verifiedAtMs }. Only wins inside the window count. */
export function challengeProgress(challenge, results) {
  if (!Array.isArray(results)) throw new RangeError('invalid_challenge_results');
  let total = 0;
  for (const result of results) {
    if (!result || !integer(result.score, 0, MAX_SAFE_TOTAL) || !Number.isFinite(result.verifiedAtMs)) {
      throw new RangeError('invalid_challenge_result');
    }
    if (result.verifiedAtMs >= challenge.startMs && result.verifiedAtMs < challenge.endMs) {
      total = Math.min(MAX_SAFE_TOTAL, total + result.score);
    }
  }
  return {
    total,
    target: challenge.target,
    complete: total >= challenge.target,
    tiers: challenge.tiers.map((tier) => ({ ...tier, earned: total >= tier.threshold })),
  };
}

/** Tiers earned and not yet claimed. claimed holds the thresholds already paid. */
export function claimableTiers(challenge, progress, claimed = []) {
  const done = new Set(claimed);
  return progress.tiers.filter((tier) => tier.earned && !done.has(tier.threshold));
}
