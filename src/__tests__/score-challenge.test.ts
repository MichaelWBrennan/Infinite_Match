import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import {
  validateScoreChallenge, challengeOpen, challengeProgress, claimableTiers,
  CHALLENGE_TIER_COINS_MAX, CHALLENGE_COIN_CEILING,
} from '../services/live-ops/score-challenge.js';

const good = () => ({
  id: 'lantern_climb_01', name: 'Lantern climb', start: '2026-10-12T00:00:00Z', end: '2026-10-19T00:00:00Z',
  target: 6000, tiers: [{ threshold: 2000, coins: 15 }, { threshold: 4000, coins: 25 }, { threshold: 6000, coins: 40 }],
});
const errorsOf = (raw: any) => validateScoreChallenge(raw).errors;
const DAY = Date.parse('2026-10-12T00:00:00Z');

describe('score challenge validation (L1)', () => {
  test('a well-formed challenge is accepted and normalised', () => {
    const { errors, challenge } = validateScoreChallenge(good());
    expect(errors).toEqual([]);
    expect(challenge?.startMs).toBe(DAY);
    expect(challenge?.tiers).toHaveLength(3);
  });

  test('unknown fields are rejected, so no hidden reward field can ride along', () => {
    expect(errorsOf({ ...good(), bonusCoins: 500 })).toContain('unknown field bonusCoins');
    expect(errorsOf({ ...good(), mode: 'endless' })).toContain('unknown field mode');
  });

  test.each([
    ['id with a capital', { id: 'Lantern' }],
    ['id too short', { id: 'ab' }],
    ['empty name', { name: '   ' }],
    ['local time without Z', { start: '2026-10-12T00:00:00' }],
    ['end before start', { end: '2026-10-11T00:00:00Z' }],
    ['longer than seven days', { end: '2026-10-20T00:00:01Z' }],
    ['target below minimum', { target: 999 }],
    ['target above maximum', { target: 100001 }],
    ['fractional target', { target: 1500.5 }],
  ])('rejects %s', (_label, change) => {
    expect(errorsOf({ ...good(), ...change }).length).toBeGreaterThan(0);
  });

  test('tiers: count, order, bounds and the coin ceiling', () => {
    expect(errorsOf({ ...good(), tiers: [] }).length).toBeGreaterThan(0);
    expect(errorsOf({ ...good(), tiers: [1, 2, 3, 4].map((i) => ({ threshold: i * 1000, coins: 5 })) }).length).toBeGreaterThan(0);
    expect(errorsOf({ ...good(), tiers: [{ threshold: 4000, coins: 5 }, { threshold: 2000, coins: 5 }] }).length).toBeGreaterThan(0);
    expect(errorsOf({ ...good(), tiers: [{ threshold: 7000, coins: 5 }] }).length).toBeGreaterThan(0);
    expect(errorsOf({ ...good(), tiers: [{ threshold: 2000, coins: CHALLENGE_TIER_COINS_MAX + 1 }] }).length).toBeGreaterThan(0);
    expect(errorsOf({ ...good(), tiers: [{ threshold: 2000, coins: 40 }, { threshold: 4000, coins: 40 }, { threshold: 6000, coins: 5 }] }))
      .toContain(`tiers total at most ${CHALLENGE_COIN_CEILING} coins`);
    expect(errorsOf({ ...good(), tiers: [{ threshold: 2000, coins: 5, extra: 1 }] }).length).toBeGreaterThan(0);
  });

  test('the coin ceiling matches the top Hall Lanterns milestone (no silent drift from the weekly event)', () => {
    const weekly = JSON.parse(readFileSync('config/liveops.json', 'utf8')).weeklyEvents[0].milestones;
    expect(CHALLENGE_TIER_COINS_MAX).toBe(Math.max(...weekly.map((m: any) => m.coins)));
    expect(CHALLENGE_COIN_CEILING).toBe(weekly.reduce((sum: number, m: any) => sum + m.coins, 0));
  });
});

describe('score challenge window and progress', () => {
  const { challenge } = validateScoreChallenge(good());

  test('the window is start-inclusive and end-exclusive', () => {
    expect(challengeOpen(challenge, challenge!.startMs)).toBe(true);
    expect(challengeOpen(challenge, challenge!.endMs - 1)).toBe(true);
    expect(challengeOpen(challenge, challenge!.endMs)).toBe(false);
    expect(challengeOpen(challenge, challenge!.startMs - 1)).toBe(false);
  });

  test('only verified wins inside the window count toward the total', () => {
    const results = [
      { score: 1500, verifiedAtMs: challenge!.startMs - 1 },
      { score: 1000, verifiedAtMs: challenge!.startMs },
      { score: 2000, verifiedAtMs: challenge!.endMs - 1 },
      { score: 9000, verifiedAtMs: challenge!.endMs },
    ];
    const progress = challengeProgress(challenge, results);
    expect(progress.total).toBe(3000);
    expect(progress.complete).toBe(false);
    expect(progress.tiers.map((t) => t.earned)).toEqual([true, false, false]);
  });

  test('reaching the target completes the challenge and every tier at or below it', () => {
    const progress = challengeProgress(challenge, [{ score: 6000, verifiedAtMs: DAY + 1 }]);
    expect(progress.complete).toBe(true);
    expect(progress.tiers.every((t) => t.earned)).toBe(true);
  });

  test('invalid result rows are refused, never coerced', () => {
    expect(() => challengeProgress(challenge, [{ score: -1, verifiedAtMs: DAY }])).toThrow(RangeError);
    expect(() => challengeProgress(challenge, [{ score: '100', verifiedAtMs: DAY }])).toThrow(RangeError);
    expect(() => challengeProgress(challenge, [{ score: 1.5, verifiedAtMs: DAY }])).toThrow(RangeError);
    expect(() => challengeProgress(challenge, 'nope' as any)).toThrow(RangeError);
  });

  test('a claimed tier is not offered again', () => {
    const progress = challengeProgress(challenge, [{ score: 4500, verifiedAtMs: DAY + 1 }]);
    expect(claimableTiers(challenge, progress, []).map((t) => t.threshold)).toEqual([2000, 4000]);
    expect(claimableTiers(challenge, progress, [2000]).map((t) => t.threshold)).toEqual([4000]);
    expect(claimableTiers(challenge, progress, [2000, 4000])).toEqual([]);
  });
});
