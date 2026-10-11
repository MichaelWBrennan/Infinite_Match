import { describe, expect, test } from '@jest/globals';
import { validateScoreChallenge } from '../services/live-ops/score-challenge.js';
import { recordChallengeWin, claimChallengeTier, ScoreChallengeError } from '../services/live-ops/score-challenge-economy.js';

const { challenge } = validateScoreChallenge({
  id: 'lantern_climb_01', name: 'Lantern climb', start: '2026-10-12T00:00:00Z', end: '2026-10-19T00:00:00Z',
  target: 6000, tiers: [{ threshold: 2000, coins: 15 }, { threshold: 4000, coins: 25 }, { threshold: 6000, coins: 40 }],
});
const START = challenge!.startMs;
const END = challenge!.endMs;
const economy = (amount = 0, maxAmount = 9999) => ({ currencies: { coins: { amount, earned: 0, maxAmount } } } as any);
const codeOf = (fn: () => unknown) => { try { fn(); return null; } catch (error: any) { return error instanceof ScoreChallengeError ? error.code : 'other'; } };

describe('recording verified wins', () => {
  test('wins inside the window accumulate; outside the window they are not recorded', () => {
    const e = economy();
    expect(recordChallengeWin(e, challenge, 1500, START + 1)).toEqual({ challengeId: challenge!.id, total: 1500 });
    expect(recordChallengeWin(e, challenge, 900, START - 1)).toBeNull();
    expect(recordChallengeWin(e, challenge, 900, END)).toBeNull();
    expect(e.scoreChallenges[challenge!.id].total).toBe(1500);
  });

  test('a disabled challenge records nothing', () => {
    const e = economy();
    expect(recordChallengeWin(e, challenge, 1500, START + 1, true)).toBeNull();
    expect(e.scoreChallenges).toBeUndefined();
  });

  test('invalid scores are refused and nothing is written', () => {
    const e = economy();
    expect(codeOf(() => recordChallengeWin(e, challenge, -5, START + 1))).toBe('invalid_challenge_score');
    expect(codeOf(() => recordChallengeWin(e, challenge, 1.5, START + 1))).toBe('invalid_challenge_score');
    expect(e.scoreChallenges).toBeUndefined();
  });
});

describe('claiming tiers', () => {
  test('a tier needs enough recorded score, then pays its coins exactly once', () => {
    const e = economy();
    expect(codeOf(() => claimChallengeTier(e, challenge, 2000, START + 2))).toBe('challenge_progress_required');
    recordChallengeWin(e, challenge, 2100, START + 1);
    const first = claimChallengeTier(e, challenge, 2000, START + 2);
    expect(first).toEqual({ duplicate: false, coins: 15, balance: 15 });
    expect(e.currencies.coins.earned).toBe(15);
    const retry = claimChallengeTier(e, challenge, 2000, START + 3);
    expect(retry).toEqual({ duplicate: true, coins: 15, balance: 15 });
    expect(e.currencies.coins.amount).toBe(15);
  });

  test('a retry after the window closes is acknowledged without a second grant, and nothing new is granted late', () => {
    const e = economy();
    recordChallengeWin(e, challenge, 2100, START + 1);
    claimChallengeTier(e, challenge, 2000, START + 2);
    expect(claimChallengeTier(e, challenge, 2000, END + 1000)).toEqual({ duplicate: true, coins: 15, balance: 15 });
    expect(codeOf(() => claimChallengeTier(e, challenge, 4000, END + 1000))).toBe('challenge_closed');
    expect(e.currencies.coins.amount).toBe(15);
  });

  test('a disabled challenge refuses new claims', () => {
    const e = economy();
    recordChallengeWin(e, challenge, 4100, START + 1);
    expect(codeOf(() => claimChallengeTier(e, challenge, 2000, START + 2, true))).toBe('challenge_closed');
    expect(e.currencies.coins.amount).toBe(0);
  });

  test('a full wallet refuses the claim without any partial change', () => {
    const e = economy(9990, 9999);
    recordChallengeWin(e, challenge, 2100, START + 1);
    expect(codeOf(() => claimChallengeTier(e, challenge, 2000, START + 2))).toBe('challenge_wallet_full');
    expect(e.currencies.coins.amount).toBe(9990);
    expect(e.scoreChallenges[challenge!.id].claimed).toEqual([]);
  });

  test('an unknown tier is refused', () => {
    const e = economy();
    recordChallengeWin(e, challenge, 9000, START + 1);
    expect(codeOf(() => claimChallengeTier(e, challenge, 3000, START + 2))).toBe('challenge_tier_not_found');
  });

  test('the weekly event records are untouched by a challenge claim', () => {
    const e = economy();
    e.weeklyEvents = { hall_lanterns_20261005: { wins: 2, claimed: [] } };
    recordChallengeWin(e, challenge, 2100, START + 1);
    claimChallengeTier(e, challenge, 2000, START + 2);
    expect(e.weeklyEvents).toEqual({ hall_lanterns_20261005: { wins: 2, claimed: [] } });
  });
});
