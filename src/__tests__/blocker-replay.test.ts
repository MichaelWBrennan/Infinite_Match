import { describe, expect, test } from '@jest/globals';
import { generatedLevel } from '../services/levels/level-service.js';
import { certifyLevel, simulateLevelMove } from '../services/levels/generator.js';
import { initialObjectiveProgress, objectiveStatus } from '../services/levels/objective-rules.js';
import { replayLevelAttempt } from '../services/levels/attempt-replay.js';
import { observationMeta, observationRow } from '../services/levels/attempt-observations.js';
import { blockerCount } from '../services/levels/blocker-rules.js';
import { objectiveCompletionError } from '../services/levels/objective-rules.js';

const loc = { timeZone: 'America/New_York', country: 'US', region: 'PA' };
const NOW = Date.parse('2026-10-31T12:00:00Z');
const make = (level: number, rulesVersion: number, nowMs = NOW) => generatedLevel({ level, mode: 'classic', location: loc, rulesVersion } as any, nowMs);
const KEY = 'a'.repeat(40);

/** The browser ends a level at the first winning action, so the attempt is the witness cut at that
 * point. Replay rejects any move after completion, so the cut is required. */
function winningAttempt(definition: any) {
  const cert = certifyLevel(definition) as any;
  let state: any = { board: definition.board, specials: definition.specials, shields: definition.shields,
    refillState: definition.refillState, objectiveProgress: initialObjectiveProgress(definition), blockers: definition.blockers };
  let score = 0;
  for (let i = 0; i < cert.witness.length; i++) {
    const result = simulateLevelMove(definition, state, cert.witness[i]) as any;
    if (!result) throw new Error('witness move failed');
    score += result.score;
    state = { board: result.board, specials: result.specials, shields: result.shields, refillState: result.refillState,
      objectiveProgress: result.objectiveProgress, blockers: result.blockers };
    if (objectiveStatus(definition, score, state.objectiveProgress).complete) {
      return { moves: cert.witness.slice(0, i + 1), score, progress: state.objectiveProgress };
    }
  }
  throw new Error('witness never completes the objectives');
}

describe('replay of a v6 blocker win', () => {
  test('a certified v6 win replays and verifies (blockers carried across moves)', () => {
    const d = make(6, 6);
    expect(blockerCount(d.blockers)).toBeGreaterThan(0);
    const a = winningAttempt(d);
    expect(a.moves.length).toBeGreaterThan(1);
    const out = replayLevelAttempt(d, a.moves, a.score, a.progress, []) as any;
    expect(out).toEqual({ verified: true, score: a.score });
  });

  test('tampered blockersCleared is rejected', () => {
    const d = make(6, 6);
    const a = winningAttempt(d);
    const bad = { ...a.progress, blockersCleared: a.progress.blockersCleared + 1 };
    expect(replayLevelAttempt(d, a.moves, a.score, bad, [])).toEqual({ error: 'replay_result_mismatch' });
  });

  test('a missing blockersCleared is rejected for v6', () => {
    const d = make(6, 6);
    const a = winningAttempt(d);
    const rest: any = { ...a.progress };
    delete rest.blockersCleared;
    expect(replayLevelAttempt(d, a.moves, a.score, rest, [])).toEqual({ error: 'replay_result_mismatch' });
  });

  test('a tampered blocker count in the pinned definition is rejected', () => {
    const d = make(6, 6);
    const a = winningAttempt(d);
    const extra = d.blockers.map((row: number[]) => row.slice());
    const free = extra.flatMap((row: number[], r: number) => row.map((v, c) => (v ? null : [r, c])).filter(Boolean))[0] as number[];
    extra[free[0]][free[1]] = 1;
    expect(replayLevelAttempt({ ...d, blockers: extra }, a.moves, a.score, a.progress, [])).toEqual({ error: 'invalid_level_objectives' });
  });

  test('a wrong reported score is rejected', () => {
    const d = make(6, 6);
    const a = winningAttempt(d);
    expect(replayLevelAttempt(d, a.moves, a.score + 1, a.progress, [])).toEqual({ error: 'replay_result_mismatch' });
  });

  test('a v6 definition whose blockers are missing is rejected, not replayed as v5', () => {
    const d = make(6, 6);
    const a = winningAttempt(d);
    const noBlockers: any = { ...d };
    delete noBlockers.blockers;
    expect(replayLevelAttempt(noBlockers, a.moves, a.score, a.progress, [])).toEqual({ error: 'invalid_level_objectives' });
  });
});

describe('paid definitions keep their own rules', () => {
  test('a v5 shield win still replays under v5 rules', () => {
    const d = make(4, 5);
    expect(d.generatorVersion).toBe(5);
    const a = winningAttempt(d);
    expect(replayLevelAttempt(d, a.moves, a.score, a.progress, [])).toEqual({ verified: true, score: a.score });
  });

  test('a v5 win does not require a blockersCleared field', () => {
    const d = make(6, 5);
    expect(d.blockers).toBeUndefined();
    const a = winningAttempt(d);
    expect(a.progress).not.toHaveProperty('blockersCleared');
    expect(replayLevelAttempt(d, a.moves, a.score, a.progress, [])).toEqual({ verified: true, score: a.score });
  });

  test('a v5 win with an extra blockersCleared field is rejected by the strict progress check before replay', () => {
    const d = make(6, 5);
    const a = winningAttempt(d);
    expect(objectiveCompletionError(d, a.score, { ...a.progress, blockersCleared: 0 })).toBe('invalid_objective_progress');
  });
});

describe('observation telemetry accepts v6 blocker levels', () => {
  test('v6 classic levels are observed with the clear-blockers profile', () => {
    const d = make(6, 6);
    const meta = observationMeta(d, 0, KEY) as any;
    expect(meta).not.toBeNull();
    expect(meta.version).toBe(6);
    expect(meta.profile).toBe('clear-blockers');
    expect(observationRow(meta, 'verified_win', {}, NOW)).not.toBeNull();
  });
});
