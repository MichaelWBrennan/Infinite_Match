// Live ops L5: the operator preview checks score challenges as a whole, at their planned boundaries,
// and refuses a challenge announced less than the lead time before it starts.
import { describe, expect, test } from '@jest/globals';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const NOW = '2026-10-11T12:00:00Z';
const DAY = 86400000;
const real = JSON.parse(fs.readFileSync('config/liveops.json', 'utf8'));

function run(config: unknown, env: Record<string, string> = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'score-preview-'));
  const file = path.join(dir, 'liveops.json');
  fs.writeFileSync(file, JSON.stringify(config));
  try {
    const result = spawnSync(process.execPath, ['scripts/preview-weekly-event.mjs', NOW], {
      env: { ...process.env, LIVE_OPS_CONFIG: file, ...env }, encoding: 'utf8',
    });
    return { status: result.status, out: result.stdout, err: result.stderr };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const challenge = (startDays: number, lengthDays = 7) => {
  const start = Date.parse(NOW) + startDays * DAY;
  return {
    id: `run_in_${startDays}d`, name: 'Personal run', start: new Date(start).toISOString(),
    end: new Date(start + lengthDays * DAY).toISOString(), target: 1000,
    tiers: [{ threshold: 1, coins: 15 }, { threshold: 1000, coins: 25 }],
  };
};

describe('score challenge operator preview (L5)', () => {
  test('the checked-in calendar still passes, with zero score challenges', () => {
    const result = run(real);
    expect(result.status).toBe(0);
    expect(result.out).toContain('Score challenges: 0');
  });

  test('a challenge announced 20 days ahead passes and prints each planned boundary', () => {
    const result = run({ ...real, scoreChallenges: [challenge(20)] });
    expect(result.status).toBe(0);
    expect(result.out).toContain('run_in_20d');
    expect(result.out).toContain('1 ms before start (2026-10-31T11:59:59.999Z): upcoming');
    expect(result.out).toContain('start (2026-10-31T12:00:00.000Z): active');
    expect(result.out).toContain('1 ms before end (2026-11-07T11:59:59.999Z): active');
    expect(result.out).toContain('end (2026-11-07T12:00:00.000Z): not shown');
  });

  test('a challenge announced less than 14 days ahead fails, with a clear message', () => {
    const result = run({ ...real, scoreChallenges: [challenge(5)] });
    expect(result.status).toBe(1);
    expect(result.err).toContain('starts less than 14 days after this preview');
  });

  test('the lead time is configurable, and zero allows any start', () => {
    expect(run({ ...real, scoreChallenges: [challenge(5)] }, { SCORE_CHALLENGE_MIN_LEAD_DAYS: '0' }).status).toBe(0);
    expect(run({ ...real, scoreChallenges: [challenge(5)] }, { SCORE_CHALLENGE_MIN_LEAD_DAYS: '99' }).status).toBe(1);
  });

  test('an invalid challenge or an unknown top-level key fails the preview', () => {
    const tooRich = { ...challenge(20), tiers: [{ threshold: 1, coins: 41 }] };
    expect(run({ ...real, scoreChallenges: [tooRich] }).status).toBe(1);
    expect(run({ ...real, scoreChallenge: [challenge(20)] }).status).toBe(1);
  });
});
