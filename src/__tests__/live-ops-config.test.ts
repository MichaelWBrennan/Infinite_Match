// Live ops L3: every top-level array is either validated or rejected at load. The checked-in file must still load.
import { readFileSync } from 'fs';
import { validateLiveOps } from '../services/live-ops/live-ops.js';
import { activeScoreChallenge, claimScoreChallenge, findScoreChallenge, recordVerifiedChallengeWin, scoreChallengeView } from '../services/live-ops/score-challenge-economy.js';

const challenge = {
  id: 'personal_run_test', name: 'Personal run', start: '2026-10-10T00:00:00Z', end: '2026-10-17T00:00:00Z',
  target: 1000, tiers: [{ threshold: 1, coins: 15 }, { threshold: 1000, coins: 25 }],
};
const at = Date.parse('2026-10-11T12:00:00Z');

describe('live ops config validation (L3)', () => {
  test('the checked-in config loads with no errors', () => {
    const raw = JSON.parse(readFileSync('config/liveops.json', 'utf8'));
    const { errors, config } = validateLiveOps(raw);
    expect(errors).toEqual([]);
    expect(config?.scoreChallenges.length).toBeGreaterThan(0);
  });

  test('an unknown top-level key fails the load, so a typo cannot drop a section silently', () => {
    const { errors, config } = validateLiveOps({ events: [], challnges: [challenge] });
    expect(config).toBeNull();
    expect(errors).toContain('unknown top-level key challnges');
  });

  test('a non-list tournaments or challenges value fails the load', () => {
    expect(validateLiveOps({ tournaments: {} }).errors).toContain('tournaments must be a list');
    expect(validateLiveOps({ challenges: 'x' }).errors).toContain('challenges must be a list');
  });

  test('a valid score challenge is normalised into config', () => {
    const { errors, config } = validateLiveOps({ scoreChallenges: [challenge] });
    expect(errors).toEqual([]);
    expect(config?.scoreChallenges).toEqual([{
      id: 'personal_run_test', name: 'Personal run', startMs: Date.parse(challenge.start), endMs: Date.parse(challenge.end),
      target: 1000, tiers: [{ threshold: 1, coins: 15 }, { threshold: 1000, coins: 25 }],
    }]);
  });

  test('invalid score challenges fail the load, including the coin ceiling and duplicate ids', () => {
    expect(validateLiveOps({ scoreChallenges: [{ ...challenge, tiers: [{ threshold: 1, coins: 41 }] }] }).config).toBeNull();
    const overCeiling = { ...challenge, tiers: [{ threshold: 1, coins: 40 }, { threshold: 1000, coins: 41 }] };
    expect(validateLiveOps({ scoreChallenges: [overCeiling] }).errors.join(' ')).toMatch(/tiers/);
    const dup = validateLiveOps({ scoreChallenges: [challenge, { ...challenge }] });
    expect(dup.config).toBeNull();
    expect(dup.errors.join(' ')).toMatch(/duplicate id personal_run_test/);
  });
});

describe('score challenge settlement and claim helpers (L3)', () => {
  const config = validateLiveOps({ scoreChallenges: [challenge] }).config!;
  const wallet = () => ({ currencies: { coins: { amount: 0, earned: 0, maxAmount: 999999 } } }) as any;

  test('a verified win counts only while the window is open', () => {
    const economy = wallet();
    expect(recordVerifiedChallengeWin(economy, config, 300, at)).toEqual({ challengeId: 'personal_run_test', total: 300 });
    expect(recordVerifiedChallengeWin(economy, config, 300, Date.parse('2026-10-18T00:00:00Z'))).toBeNull();
  });

  test('a bad score never throws inside settlement, and never counts', () => {
    const economy = wallet();
    expect(recordVerifiedChallengeWin(economy, config, 1.5, at)).toBeNull();
    expect(recordVerifiedChallengeWin(economy, config, -4, at)).toBeNull();
    expect(economy.scoreChallenges).toBeUndefined();
  });

  test('claims resolve the challenge from config and grant an earned tier once', () => {
    const economy = wallet();
    recordVerifiedChallengeWin(economy, config, 1200, at);
    expect(claimScoreChallenge(economy, config, 'personal_run_test', 1, at)).toEqual({ duplicate: false, coins: 15, balance: 15 });
    expect(claimScoreChallenge(economy, config, 'personal_run_test', 1000, at)).toEqual({ duplicate: false, coins: 25, balance: 40 });
    expect(claimScoreChallenge(economy, config, 'personal_run_test', 1, at)).toEqual({ duplicate: true, coins: 15, balance: 40 });
    expect(() => claimScoreChallenge(economy, config, 'missing_one', 1, at)).toThrow('challenge_not_found');
  });

  test('lookup and active helpers agree with the window', () => {
    expect(findScoreChallenge(config, 'personal_run_test')?.id).toBe('personal_run_test');
    expect(activeScoreChallenge(config, at)?.id).toBe('personal_run_test');
    expect(activeScoreChallenge(config, Date.parse('2026-10-17T00:00:00Z'))).toBeNull();
  });
});

describe('score challenge view for the client (L4)', () => {
  const config = validateLiveOps({ scoreChallenges: [challenge] }).config!;

  test('a guest gets the schedule and no progress or claim flags', () => {
    const view = scoreChallengeView(config, null, at);
    expect(view.challenge).toMatchObject({ id: 'personal_run_test', status: 'active', total: null, startsAt: '2026-10-10T00:00:00.000Z', endsAt: '2026-10-17T00:00:00.000Z' });
    expect(view.challenge!.tiers.every((t) => !t.canClaim && !t.earned)).toBe(true);
    expect(view.serverNow).toBe('2026-10-11T12:00:00.000Z');
  });

  test('a signed-in player sees progress, earned and claimable tiers, and claimed tiers', () => {
    const economy: any = { currencies: { coins: { amount: 0, earned: 0, maxAmount: 999999 } } };
    recordVerifiedChallengeWin(economy, config, 1200, at);
    claimScoreChallenge(economy, config, 'personal_run_test', 1, at);
    const view = scoreChallengeView(config, economy, at);
    expect(view.challenge!.total).toBe(1200);
    expect(view.challenge!.tiers).toEqual([
      { threshold: 1, coins: 15, earned: true, claimed: true, canClaim: false },
      { threshold: 1000, coins: 25, earned: true, claimed: false, canClaim: true },
    ]);
  });

  test('a paused challenge shows no claimable tiers', () => {
    const economy: any = { currencies: { coins: { amount: 0, earned: 0, maxAmount: 999999 } } };
    recordVerifiedChallengeWin(economy, config, 1200, at);
    const view = scoreChallengeView(config, economy, at, true);
    expect(view.disabled).toBe(true);
    expect(view.challenge!.tiers.some((t) => t.canClaim)).toBe(false);
  });

  test('an upcoming challenge is shown until it starts, and nothing after it ends', () => {
    const next = validateLiveOps({ scoreChallenges: [{ ...challenge, id: 'next_run_test', start: '2026-10-20T00:00:00Z', end: '2026-10-27T00:00:00Z' }] }).config!;
    expect(scoreChallengeView(next, null, at).challenge).toMatchObject({ id: 'next_run_test', status: 'upcoming' });
    expect(scoreChallengeView(config, null, Date.parse('2026-10-17T00:00:00Z')).challenge).toBeNull();
  });
});
