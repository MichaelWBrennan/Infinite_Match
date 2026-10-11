/** Live ops v1 (L2): economy functions for the personal score challenge. The caller holds the
 * player economy lock and saves once. Not wired into the completion path or a route yet: those
 * need the challenge in validated config (L3). Mirrors the weekly event: check every rule before
 * mutating, acknowledge a retry as duplicate, and never grant after the window closes. */
import { challengeOpen } from './score-challenge.js';

export class ScoreChallengeError extends Error {
  constructor(code) { super(code); this.code = code; }
}

const MAX_SCORE = 1000000;
const MAX_TOTAL = 1000000000;
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;

/** Add one verified classic win to the challenge total. Only wins inside the window count. */
export function recordChallengeWin(economy, challenge, score, nowMs = Date.now(), disabled = false) {
  if (disabled || !challenge || !challengeOpen(challenge, nowMs)) return null;
  if (!integer(score, 0, MAX_SCORE)) throw new ScoreChallengeError('invalid_challenge_score');
  const records = (economy.scoreChallenges ??= {});
  if (!Object.hasOwn(records, challenge.id)) records[challenge.id] = { total: 0, claimed: [] };
  const record = records[challenge.id];
  record.total = Math.min(MAX_TOTAL, (integer(record.total, 0, MAX_TOTAL) ? record.total : 0) + score);
  return { challengeId: challenge.id, total: record.total };
}

/** Grant one earned tier's coins once. Returns the same result for a retry. */
export function claimChallengeTier(economy, challenge, threshold, nowMs = Date.now(), disabled = false) {
  const tier = challenge.tiers.find((candidate) => candidate.threshold === threshold);
  if (!tier) throw new ScoreChallengeError('challenge_tier_not_found');
  const record = Object.hasOwn(economy.scoreChallenges || {}, challenge.id) ? economy.scoreChallenges[challenge.id] : null;
  if (record?.claimed?.includes(threshold)) {
    return { duplicate: true, coins: tier.coins, balance: economy.currencies.coins.amount };
  }
  if (disabled || !challengeOpen(challenge, nowMs)) throw new ScoreChallengeError('challenge_closed');
  if (!record || record.total < threshold) throw new ScoreChallengeError('challenge_progress_required');
  const wallet = economy.currencies.coins;
  if (wallet.amount + tier.coins > wallet.maxAmount) throw new ScoreChallengeError('challenge_wallet_full');
  wallet.amount += tier.coins;
  wallet.earned += tier.coins;
  record.claimed.push(threshold);
  return { duplicate: false, coins: tier.coins, balance: wallet.amount };
}

/** Operator kill switch. Set SCORE_CHALLENGE_DISABLED=1 to stop new wins and claims. */
export function scoreChallengeDisabled() { return process.env.SCORE_CHALLENGE_DISABLED === '1'; }

export function findScoreChallenge(config, challengeId) {
  return (config?.scoreChallenges || []).find((c) => c.id === challengeId) || null;
}

/** The challenge whose window contains nowMs, or null (also null while the kill switch is on). */
export function activeScoreChallenge(config, nowMs = Date.now()) {
  if (scoreChallengeDisabled()) return null;
  return (config?.scoreChallenges || []).find((c) => challengeOpen(c, nowMs)) || null;
}

/** Settlement hook: counts a server-verified win. Never throws, so a win is never blocked by the challenge. */
export function recordVerifiedChallengeWin(economy, config, score, nowMs = Date.now()) {
  const challenge = activeScoreChallenge(config, nowMs);
  if (!challenge || !integer(score, 0, MAX_SCORE)) return null;
  return recordChallengeWin(economy, challenge, score, nowMs);
}

/** Claim route entry: resolves the challenge from validated config, then claims once. */
export function claimScoreChallenge(economy, config, challengeId, threshold, nowMs = Date.now()) {
  const challenge = findScoreChallenge(config, challengeId);
  if (!challenge) throw new ScoreChallengeError('challenge_not_found');
  return claimChallengeTier(economy, challenge, threshold, nowMs, scoreChallengeDisabled());
}
