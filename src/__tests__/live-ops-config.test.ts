// Live ops L3: every top-level array is either validated or rejected at load. The checked-in file must still load.
import { readFileSync } from 'fs';
import { validateLiveOps } from '../services/live-ops/live-ops.js';
import { activeScoreChallenge, claimScoreChallenge, findScoreChallenge, recordVerifiedChallengeWin } from '../services/live-ops/score-challenge-economy.js';

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
    expect(config?.scoreChallenges).toEqual([]);
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
