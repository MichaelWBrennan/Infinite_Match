import { describe, expect, test } from '@jest/globals';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluateStabilityStudy, validateStabilityStudy } from '../services/study/session-stability.js';

const row = (i: number) => ({ sessionCode: `s-${String(i).padStart(8, '0')}`, device: 'mid_android', browser: 'chrome',
  accessMode: 'standard', evidence: 'facilitator', outcome: 'no_crash_observed', clientErrorObserved: false });
const study = (n = 1000) => ({ schemaVersion: 1, studyId: 'study-web-stability-beta', build: 'b98a509e',
  sessions: Array.from({ length: n }, (_, i) => row(i)) });

describe('offline consented web stability beta evaluator', () => {
  test('proposed threshold counts all started sessions, reports uncertainty and hides small strata and codes', () => {
    const input = study();
    for (let i = 0; i < 5; i++) input.sessions[i].outcome = 'confirmed_crash'; // 995 / 1000 = 99.5%.
    for (let i = 0; i < 19; i++) input.sessions[i].accessMode = 'screen_reader';
    const result: any = evaluateStabilityStudy(input);
    expect(result.status).toBe('criteria_met_in_submitted_records');
    expect(result.stability).toMatchObject({ sessions: 1000, minimum: 1000, confirmedCrashes: 5,
      noCrashObserved: 995, unknownOutcomes: 0, conservativeNoCrashRate: 0.995, status: 'criteria_met_in_records' });
    expect(result.stability.approximate95PercentWilson.lower).toBeLessThan(0.995);
    expect(result.breakdown.accessMode).toMatchObject({ suppressedGroups: 1, groups: [] });
    // Publishing the 981-person standard group would reveal the 19-person group's crash count by subtraction.
    expect(JSON.stringify(result)).not.toMatch(/s-00000000|sessionCode|screen_reader|stack|playerId/);
    input.sessions[19].accessMode = 'screen_reader';
    expect((evaluateStabilityStudy(input) as any).breakdown.accessMode.groups).toEqual([
      expect.objectContaining({ label: 'screen_reader', sessions: 20, confirmedCrashes: 5 }),
      expect.objectContaining({ label: 'standard', sessions: 980, confirmedCrashes: 0 }),
    ]);
    input.sessions[5].outcome = 'confirmed_crash';
    expect((evaluateStabilityStudy(input) as any).stability).toMatchObject({
      confirmedCrashes: 6, conservativeNoCrashRate: 0.994, status: 'below_threshold' });
  });

  test('insufficient sample, uncertain outcomes and script errors never masquerade as crash-free play', () => {
    expect((evaluateStabilityStudy(study(999)) as any).stability.status).toBe('insufficient_sample');
    const input = study();
    input.sessions[0].outcome = 'unknown'; input.sessions[0].evidence = 'client_only';
    input.sessions[1].clientErrorObserved = true;
    input.sessions[2].clientErrorObserved = null;
    const result: any = evaluateStabilityStudy(input);
    expect(result.status).toBe('not_met');
    expect(result.stability).toMatchObject({ noCrashObserved: 999, unknownOutcomes: 1,
      conservativeNoCrashRate: 0.999, approximate95PercentWilson: null, status: 'incomplete_outcomes' });
    expect(result.clientErrors).toMatchObject({ observed: 1, missingChecks: 1 });
    input.sessions[0].outcome = 'confirmed_crash'; input.sessions[0].evidence = 'device_diagnostic';
    expect((evaluateStabilityStudy(input) as any).stability).toMatchObject({ confirmedCrashes: 1, unknownOutcomes: 0 });
    const zeroCrashes: any = evaluateStabilityStudy(study());
    expect(zeroCrashes.stability.approximate95PercentWilson.lower).toBeGreaterThan(0.995);
    expect((evaluateStabilityStudy(study(0)) as any).stability).toMatchObject({
      sessions: 0, noCrashObserved: null, confirmedCrashes: null, conservativeNoCrashRate: null,
      approximate95PercentWilson: null, status: 'insufficient_sample' });
    expect((evaluateStabilityStudy(study(1)) as any).clientErrors).toMatchObject({ observed: null, missingChecks: null });
  });

  test('strict schema rejects duplicate codes, identifiable fields, bad evidence and malformed rows', () => {
    const input = study(2);
    expect(validateStabilityStudy(input).error).toBeUndefined();
    input.sessions[1].sessionCode = input.sessions[0].sessionCode;
    expect(validateStabilityStudy(input)).toMatchObject({ error: 'invalid_session', row: 2 });
    input.sessions[1].sessionCode = 's-00000001';
    input.sessions[1].evidence = 'client_only';
    expect(validateStabilityStudy(input)).toMatchObject({ error: 'invalid_session', row: 2 });
    input.sessions[1].outcome = 'unknown';
    expect(validateStabilityStudy(input).error).toBeUndefined();
    (input.sessions[1] as any).errorStack = 'private stack';
    expect(validateStabilityStudy(input)).toMatchObject({ error: 'invalid_session', row: 2 });
    delete (input.sessions[1] as any).errorStack;
    (input as any).accountId = 'private id';
    expect(validateStabilityStudy(input)).toMatchObject({ error: 'invalid_study' });
    delete (input as any).accountId;
    input.build = 'REPLACE_WITH_BUILD_COMMIT_SHA';
    expect(validateStabilityStudy(input)).toMatchObject({ error: 'invalid_study' });
    expect(validateStabilityStudy({ ...study(0), sessions: Array.from({ length: 10001 }, (_, i) => row(i)) })).toMatchObject({ error: 'invalid_study' });
  });

  test('CLI reports only aggregates and exits 0/2/1 for met/incomplete/invalid without exposing input', () => {
    const dir = mkdtempSync(join(tmpdir(), 'web-stability-'));
    try {
      const file = join(dir, 'study.json');
      const run = () => spawnSync(process.execPath, ['scripts/evaluate-web-stability.mjs', file, '--json'],
        { cwd: process.cwd(), encoding: 'utf8' });
      writeFileSync(file, JSON.stringify(study()));
      let result = run();
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout).stability.sessions).toBe(1000);
      expect(result.stdout).not.toContain('s-00000000');
      const incomplete = study(); incomplete.sessions[0].outcome = 'unknown';
      writeFileSync(file, JSON.stringify(incomplete));
      result = run(); expect(result.status).toBe(2);
      expect(JSON.parse(result.stdout).stability.status).toBe('incomplete_outcomes');
      writeFileSync(file, JSON.stringify({ ...study(0), accountId: 'never-print-me' }));
      result = run(); expect(result.status).toBe(1);
      expect(result.stderr).not.toContain('never-print-me');
      writeFileSync(file, 'x'.repeat(2 * 1024 * 1024 + 1));
      result = run(); expect(result.status).toBe(1); expect(result.stderr).toContain('study_file_too_large');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
