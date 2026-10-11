// Live ops L4: the score challenge card text (Explore and Community events). Plain strings, clock-corrected countdowns.
import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function card() {
  const sandbox: any = {};
  vm.createContext(sandbox);
  vm.runInContext(readFileSync('public/js/score-challenge-card.js', 'utf8'), sandbox, { filename: 'score-challenge-card.js' });
  return sandbox.ScoreChallengeCard;
}

const local = (ms: number) => `local(${new Date(ms).toISOString()})`;
const START = '2026-10-10T00:00:00.000Z';
const END = '2026-10-17T00:00:00.000Z';
const at = (iso: string) => Date.parse(iso);

function view(overrides: any = {}) {
  return {
    disabled: false, serverNow: '2026-10-11T12:00:00.000Z',
    challenge: {
      id: 'personal_run', name: 'Personal run', status: 'active', startsAt: START, endsAt: END, target: 1000, total: 400,
      tiers: [
        { threshold: 100, coins: 15, earned: true, claimed: true, canClaim: false },
        { threshold: 400, coins: 25, earned: true, claimed: false, canClaim: true },
        { threshold: 900, coins: 40, earned: false, claimed: false, canClaim: false },
      ],
      ...overrides,
    },
  };
}

describe('score challenge card text', () => {
  const C = card();

  test('UTC boundaries are always printed with the UTC label', () => {
    expect(C.utcText(at(START))).toBe('10 Oct 2026, 00:00 UTC');
    expect(C.utcText(at('2026-12-31T23:59:00Z'))).toBe('31 Dec 2026, 23:59 UTC');
  });

  test.each([
    [6 * 86400000 + 3 * 3600000, '6 days 3 hours'],
    [86400000 + 3600000, '1 day 1 hour'],
    [3 * 3600000 + 5 * 60000, '3 hours 5 minutes'],
    [3600000 + 60000, '1 hour 1 minute'],
    [2 * 86400000, '2 days'],
    [3 * 3600000, '3 hours'],
    [5 * 60000, '5 minutes'],
    [59000, 'under a minute'],
    [0, 'under a minute'],
    [-5, 'under a minute'],
  ])('countdown %p ms reads "%s"', (ms, text) => {
    expect(C.countdownText(ms)).toBe(text);
  });

  test('an active challenge says when it ends in local time and in UTC, and warns that late claims are refused', () => {
    const lines = C.cardLines(view(), at('2026-10-11T12:00:00Z'), local);
    expect(lines[0]).toBe('Personal score challenge: Personal run.');
    expect(lines[1]).toBe('Open now. Ends in 5 days 12 hours.');
    expect(lines[2]).toBe(`Ends local(${END}) your time (17 Oct 2026, 00:00 UTC).`);
    expect(lines[3]).toBe('Runs 10 Oct 2026, 00:00 UTC to 17 Oct 2026, 00:00 UTC. Claims after the end are not granted.');
    expect(lines[4]).toBe('400 of 1000 points.');
    expect(lines).toContain('1 tier ready to claim.');
  });

  test('an upcoming challenge counts down to the start', () => {
    const v = view({ status: 'upcoming', startsAt: '2026-10-12T00:00:00Z', endsAt: '2026-10-19T00:00:00Z', total: null });
    const lines = C.cardLines(v, at('2026-10-11T12:00:00Z'), local);
    expect(lines[1]).toBe('Starts in 12 hours.');
    expect(lines.join(' ')).toContain('Sign in to track your points. Target 1000 points.');
    expect(lines.join(' ')).not.toContain('ready to claim');
  });

  test('a guest sees the schedule and target only, never progress', () => {
    const guest = view({ total: null, tiers: [{ threshold: 100, coins: 15, earned: false, claimed: false, canClaim: false }] });
    expect(C.cardLines(guest, at('2026-10-11T12:00:00Z'), local)).toContain('Sign in to track your points. Target 1000 points.');
    expect(C.tierText(guest.challenge.tiers[0], null)).toBe('100 points: 15 coins.');
  });

  test('each tier label states claimed, ready, closed, or how many points remain', () => {
    const t = view().challenge.tiers;
    expect(C.tierText(t[0], 400)).toBe('100 points: 15 coins, claimed.');
    expect(C.tierText(t[1], 400)).toBe('400 points: 25 coins, ready to claim.');
    expect(C.tierText(t[2], 400)).toBe('900 points: 40 coins, 500 more points to unlock.');
    expect(C.tierText({ threshold: 100, coins: 15, earned: true, claimed: false, canClaim: false }, 400))
      .toBe('100 points: 15 coins, earned. Claiming is closed right now.');
  });

  test('a paused challenge says so and keeps saved points', () => {
    expect(C.cardLines({ disabled: true, challenge: null }, 0, local)).toEqual(
      ['The personal score challenge is paused. Saved points are kept.']);
  });

  test('nothing scheduled gives a plain message', () => {
    expect(C.cardLines({ disabled: false, challenge: null }, 0, local)).toEqual(
      ['No personal score challenge is scheduled. Check back soon.']);
  });

  test('a phone with a wrong clock is corrected to server time before counting down', () => {
    const phoneAtReply = Date.parse('2026-10-09T08:00:00Z');
    const offset = C.clockOffset('2026-10-11T12:00:00.000Z', phoneAtReply);
    expect(phoneAtReply + offset).toBe(Date.parse('2026-10-11T12:00:00Z'));
    const lines = C.cardLines(view(), phoneAtReply + offset, local);
    expect(lines[1]).toBe('Open now. Ends in 5 days 12 hours.');
  });

  test('a missing or invalid server time gives no offset', () => {
    expect(C.clockOffset(undefined, 1000)).toBe(0);
    expect(C.clockOffset('not a date', 1000)).toBe(0);
  });

  test('fetchView sends the token for progress and none for the public preview', async () => {
    const calls: any[] = [];
    const fetchImpl = async (url: string, init: any) => {
      calls.push([url, init.headers]);
      return { ok: true, json: async () => ({ success: true, challenge: null }) };
    };
    const signed = await C.fetchView('tok', fetchImpl);
    const guest = await C.fetchView(null, fetchImpl);
    expect(signed.ok).toBe(true);
    expect(calls).toEqual([
      ['/api/live-ops/score-challenge', { Authorization: 'Bearer tok' }],
      ['/api/live-ops/score-challenge/preview', {}],
    ]);
    expect(guest.ok).toBe(true);
  });

  test('card text never contains markup from the server; the strings are plain text', () => {
    const hostile = view({ name: '<img src=x onerror=alert(1)>' });
    const lines = C.cardLines(hostile, at('2026-10-11T12:00:00Z'), local);
    expect(lines[0]).toContain('<img');
    expect(lines.every((line: unknown) => typeof line === 'string')).toBe(true);
  });
});
