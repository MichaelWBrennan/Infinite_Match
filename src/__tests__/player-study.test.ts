import { describe, expect, test } from '@jest/globals';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { evaluateStudy, validateStudy } from '../services/study/first-play.js';

const session = (i: number) => ({
  participantCode: `p-${String(i).padStart(4, '0')}`, device: i < 20 ? 'small_android' : 'small_iphone',
  browser: i < 20 ? 'chrome' : 'safari', network: '4g_throttled', input: 'touch',
  accessMode: 'standard', firstTime: i < 20, coachedBeforeMove: false, firstMoveSeconds: 20,
  goalExplained: true, objective: 'score', difficulty: 'gentle', boardGroup: 'group-a',
  outcome: 'lost', enjoyment: 4, lossFair: true,
});
const pilot = () => ({ schemaVersion: 1, studyId: 'study-web-v5-pilot', build: 'b98a509e',
  sessions: Array.from({ length: 30 }, (_, i) => session(i)) });

describe('offline first-play/fairness gate', () => {
  test('reports thresholds exactly, separate denominators and small-stratum suppression; never publishes rows or codes', () => {
    const input = pilot();
    input.sessions[0].accessMode = 'screen_reader'; // A single-person stratum must not appear.
    for (let i = 0; i < 2; i++) input.sessions[i].coachedBeforeMove = true; // 18/20 = 90%.
    for (let i = 0; i < 2; i++) input.sessions[i].goalExplained = false; // 18/20 = 90%.
    for (let i = 0; i < 6; i++) input.sessions[i].lossFair = false; // 24/30 = 80%.
    const result: any = evaluateStudy(input);
    expect(result.status).toBe('criteria_met_in_submitted_records');
    expect(result.learning).toMatchObject({ sessions: 20, unassistedMovesBy30s: 18,
      unassistedMoveRate: 0.9, goalsExplained: 18, goalRate: 0.9, missingGoal: 0 });
    expect(result.fairness).toMatchObject({ sessions: 30, fairLosses: 24, fairRate: 0.8,
      medianEnjoyment: 4, missingFairness: 0, missingEnjoyment: 0 });
    expect(result.breakdown.accessMode).toMatchObject({ suppressedGroups: 1,
      groups: [{ label: 'standard', sessions: 29 }] });
    expect(result.cohortBreakdown.learning.accessMode.suppressedGroups).toBe(1);
    expect(result.cohortBreakdown.fairness.device.groups).toEqual([
      expect.objectContaining({ label: 'small_android', sessions: 20, fairRate: 0.7 }),
      expect.objectContaining({ label: 'small_iphone', sessions: 10, fairRate: 1 }),
    ]);
    expect(JSON.stringify(result)).not.toMatch(/p-0000|participantCode|firstMoveSeconds|lossFair|screen_reader/);
  });

  test('a coached first move or slow first move cannot be counted as an unassisted 30-second success', () => {
    const input = pilot();
    input.sessions[0].coachedBeforeMove = true;
    input.sessions[1].firstMoveSeconds = 31;
    expect((evaluateStudy(input) as any).learning).toMatchObject({ unassistedMovesBy30s: 18, goalsExplained: 19 });
    input.sessions[2].coachedBeforeMove = true;
    expect((evaluateStudy(input) as any).learning.status).toBe('below_threshold');
  });

  test('insufficient or unanswered sessions cannot silently pass by dropping nonrespondents', () => {
    const input = pilot();
    input.sessions = input.sessions.slice(0, 19);
    const short: any = evaluateStudy(input);
    expect(short.learning.status).toBe('insufficient_sample');
    expect(short.fairness.status).toBe('insufficient_sample');
    input.sessions = pilot().sessions;
    input.sessions[1].goalExplained = null;
    input.sessions[2].lossFair = null;
    input.sessions[3].enjoyment = null;
    const incomplete: any = evaluateStudy(input);
    expect(incomplete.learning).toMatchObject({ status: 'incomplete_responses', missingGoal: 1 });
    expect(incomplete.fairness).toMatchObject({ status: 'incomplete_responses', missingFairness: 1, missingEnjoyment: 1 });
    input.sessions[1].goalExplained = true;
    input.sessions[2].lossFair = true;
    input.sessions[3].enjoyment = 1;
    expect((evaluateStudy(input) as any).fairness.status).toBe('criteria_met_in_records'); // Median remains 4.
    for (let i = 0; i < 16; i++) input.sessions[i].enjoyment = 3;
    expect((evaluateStudy(input) as any).fairness.status).toBe('below_threshold');
  });

  test('non-loss sessions do not inflate fairness denominator or masquerade as lost play', () => {
    const input = pilot();
    input.sessions[29].outcome = 'won'; input.sessions[29].lossFair = null;
    const report: any = evaluateStudy(input);
    expect(report.fairness.sessions).toBe(29);
    expect(report.fairness.status).toBe('insufficient_sample');
    expect(report.overallSessions).toBe(30);
  });

  test('strict validation rejects duplicates, raw identifiers, free text, malformed ratings and inconsistent answers', () => {
    const input = pilot();
    expect(validateStudy(input).error).toBeUndefined();
    input.sessions[1].participantCode = input.sessions[0].participantCode;
    expect(validateStudy(input)).toMatchObject({ error: 'invalid_session', row: 2 });
    input.sessions[1].participantCode = 'p-0001';
    (input.sessions[1] as any).playerId = 'private-id';
    expect(validateStudy(input)).toMatchObject({ error: 'invalid_session', row: 2 });
    delete (input.sessions[1] as any).playerId;
    input.sessions[1].boardGroup = '123456789';
    expect(validateStudy(input)).toMatchObject({ error: 'invalid_session', row: 2 });
    input.sessions[1].boardGroup = 'group-a'; input.sessions[1].enjoyment = 6;
    expect(validateStudy(input)).toMatchObject({ error: 'invalid_session', row: 2 });
    input.sessions[1].enjoyment = 4;
    input.sessions[1].outcome = 'won';
    expect(validateStudy(input)).toMatchObject({ error: 'invalid_session', row: 2 });
    (input as any).preciseLocation = 'hidden';
    expect(validateStudy(input)).toMatchObject({ error: 'invalid_study' });
    delete (input as any).preciseLocation;
    input.build = 'REPLACE_WITH_BUILD_COMMIT_SHA';
    expect(validateStudy(input)).toMatchObject({ error: 'invalid_study' });
  });

  test('CLI outputs aggregate only and uses 0/2/1 for met, insufficient and invalid schema', () => {
    const dir = mkdtempSync(join(tmpdir(), 'player-study-'));
    try {
      const file = join(dir, 'local.json');
      const run = () => spawnSync(process.execPath, ['scripts/evaluate-player-study.mjs', file, '--json'],
        { cwd: process.cwd(), encoding: 'utf8' });
      writeFileSync(file, JSON.stringify(pilot()));
      let result = run();
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout).learning.sessions).toBe(20);
      expect(result.stdout).not.toContain('p-0000');
      writeFileSync(file, JSON.stringify({ ...pilot(), sessions: [] }));
      result = run(); expect(result.status).toBe(2);
      expect(JSON.parse(result.stdout).status).toBe('not_met');
      writeFileSync(file, JSON.stringify({ ...pilot(), sessions: [], playerId: 'do-not-print' }));
      result = run(); expect(result.status).toBe(1);
      expect(result.stderr).not.toContain('do-not-print');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
