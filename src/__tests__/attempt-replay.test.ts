import { describe, expect, test } from '@jest/globals';
import { generatedLevel } from '../services/levels/level-service.js';
import { certifyLevel, simulateLevelMove } from '../services/levels/generator.js';
import { initialObjectiveProgress, objectiveStatus } from '../services/levels/objective-rules.js';
import { replayLevelAttempt } from '../services/levels/attempt-replay.js';

const location = { timeZone: 'America/New_York', country: 'US', region: 'PA' };
const now = Date.parse('2026-10-10T16:00:00Z');

export function winningTranscript(definition: any) {
  let state: any = { board: definition.board, specials: definition.specials, shields: definition.shields,
    refillState: definition.refillState, objectiveProgress: initialObjectiveProgress(definition) };
  const moves: number[][] = [];
  let score = 0;
  for (const cells of certifyLevel(definition).witness) {
    const result = simulateLevelMove(definition, state, cells);
    if (!result) throw new Error('invalid witness');
    moves.push(cells);
    score += result.score;
    state = { board: result.board, specials: result.specials, shields: result.shields,
      refillState: result.refillState, objectiveProgress: result.objectiveProgress };
    if (objectiveStatus(definition, score, state.objectiveProgress).complete) break;
  }
  if (!objectiveStatus(definition, score, state.objectiveProgress).complete) throw new Error('unwinnable witness');
  return { moves, score, objectiveProgress: state.objectiveProgress };
}

describe('bounded paid-result replay', () => {
  for (const [version, level, mode] of [[4, 2, 'classic'], [5, 4, 'classic'], [5, 1, 'daily']] as const) {
    test(`replays the pinned v${version} ${mode} board through its first winning move`, () => {
      const definition = generatedLevel({ level, mode, location, rulesVersion: version }, now);
      const proof = winningTranscript(definition);
      expect(replayLevelAttempt(definition, proof.moves, proof.score, proof.objectiveProgress))
        .toEqual({ verified: true, score: proof.score });
      expect(replayLevelAttempt(definition, proof.moves, proof.score + 1, proof.objectiveProgress).error)
        .toBe('replay_result_mismatch');
      const inflated = structuredClone(proof.objectiveProgress);
      inflated.collected[definition.gemTypes[0]]++;
      expect(replayLevelAttempt(definition, proof.moves, proof.score, inflated).error)
        .toBe('replay_result_mismatch');
      if (version === 5) {
        const shields = structuredClone(proof.objectiveProgress);
        shields.shieldsCleared++;
        expect(replayLevelAttempt(definition, proof.moves, proof.score, shields).error)
          .toBe('replay_result_mismatch');
      }
      expect(replayLevelAttempt(definition, [...proof.moves, proof.moves[0]], proof.score, proof.objectiveProgress).error)
        .toBe('invalid_move_history');
    });
  }

  test('refuses malformed, impossible and over-budget actions without changing the pinned board', () => {
    const definition = generatedLevel({ level: 4, location, rulesVersion: 5 }, now);
    const original = JSON.stringify(definition);
    const { score, objectiveProgress } = winningTranscript(definition);
    for (const moves of [null, [], [[-1, 0, 0, 0]], [[0.5, 0, 0, 1]], [[0, 0]],
      [[0, 0, 0]], Array(definition.moves + 1).fill([0, 0, 0, 1])]) {
      expect(replayLevelAttempt(definition, moves, score, objectiveProgress).error).toBe('invalid_move_history');
    }
    expect(JSON.stringify(definition)).toBe(original);
  });

  test('timed, endless, and legacy definitions cannot masquerade as replayable wins', () => {
    for (const mode of ['timed', 'endless'] as const) {
      const definition = generatedLevel({ level: 1, mode, location, rulesVersion: 5 }, now);
      expect(replayLevelAttempt(definition, [[0, 0]], 100, {}).error).toBe('replay_unsupported');
    }
    const old = generatedLevel({ level: 1, location, rulesVersion: 3 }, now);
    expect(replayLevelAttempt(old, [[0, 0]], 100, {}).error).toBe('replay_unsupported');
  });
});
