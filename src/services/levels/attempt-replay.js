import { simulateLevelMove } from './generator.js';
import { initialObjectiveProgress, objectiveStatus, simulateObjectiveClear } from './objective-rules.js';
import { inventoryReplayEffect } from './inventory-replay.js';

/** A replay is evidence of a reachable result, not proof of human play or elapsed time.
 * Only deterministic, single-board classic/daily attempts are eligible. Inventory receipts
 * are minted and pinned by the economy service, never sourced from the completion body.
 */
export function replayLevelAttempt(definition, moves, reportedScore, reportedProgress, receipts = []) {
  if (!definition || definition.generatorVersion < 4 || !['classic', 'daily'].includes(definition.mode)) {
    return { error: 'replay_unsupported' };
  }
  if (!Number.isSafeInteger(definition.moves) || definition.moves < 1 || definition.moves > 1000
    || !Array.isArray(receipts) || receipts.length > 20 || !Array.isArray(moves) || moves.length < 1
    || moves.length > definition.moves + receipts.length) {
    return { error: 'invalid_move_history' };
  }
  const receiptById = new Map(receipts.map((receipt) => [receipt.id, receipt.type]));
  if (receiptById.size !== receipts.length) return { error: 'invalid_move_history' };
  const used = new Set();
  let ordinaryMoves = 0;
  let state = {
    board: definition.board, specials: definition.specials, shields: definition.shields,
    refillState: definition.refillState, objectiveProgress: initialObjectiveProgress(definition),
  };
  let score = 0;
  for (let i = 0; i < moves.length; i++) {
    const action = moves[i];
    let result;
    if (Array.isArray(action)) {
      if (++ordinaryMoves > definition.moves) return { error: 'invalid_move_history' };
      const size = definition.boardSize;
      if (![2, 4].includes(action.length)
        || action.some((n) => !Number.isSafeInteger(n) || n < 0 || n >= size)
        || (action.length === 2 && !state.specials?.[action[0]]?.[action[1]])) {
        return { error: 'invalid_move_history' };
      }
      result = simulateLevelMove(definition, state, action);
    } else if (action && typeof action === 'object' && !Array.isArray(action)
      && typeof action.receiptId === 'string' && receiptById.get(action.receiptId) === action.type
      && !used.has(action.receiptId)) {
      const effect = inventoryReplayEffect(definition, state, action);
      if (!effect) return { error: 'invalid_move_history' };
      used.add(action.receiptId);
      result = simulateObjectiveClear(definition, state, effect.keys, effect.points);
    } else {
      return { error: 'invalid_move_history' };
    }
    if (!result || !Number.isSafeInteger(result.score) || result.score < 0) {
      return { error: 'invalid_move_history' };
    }
    score += result.score;
    if (!Number.isSafeInteger(score) || score > 1000000) return { error: 'invalid_move_history' };
    state = {
      board: result.board, specials: result.specials, shields: result.shields,
      refillState: result.refillState, objectiveProgress: result.objectiveProgress,
    };
    // The browser ends the level immediately when the first winning action resolves.
    if (objectiveStatus(definition, score, state.objectiveProgress).complete && i !== moves.length - 1) {
      return { error: 'invalid_move_history' };
    }
  }
  // All spent receipts must be accounted for; a lost response can still use legacy
  // unverified completion rather than inventing an effect or claiming a ranked result.
  if (used.size !== receipts.length) return { error: 'unused_powerup_receipt' };
  if (score !== reportedScore || !objectiveStatus(definition, score, state.objectiveProgress).complete) {
    return { error: 'replay_result_mismatch' };
  }
  const expected = state.objectiveProgress;
  if (!reportedProgress || typeof reportedProgress !== 'object'
    || definition.gemTypes.some((color) => (reportedProgress.collected?.[color] || 0) !== expected.collected[color])
    || (definition.generatorVersion >= 5 && reportedProgress.shieldsCleared !== expected.shieldsCleared)) {
    return { error: 'replay_result_mismatch' };
  }
  return { verified: true, score };
}
