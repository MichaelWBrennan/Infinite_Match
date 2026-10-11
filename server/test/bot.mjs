// A small greedy player used only by tests. It plays the server-generated board with the shared
// rules, and returns the moves in the same shape the browser sends: cell arrays for ordinary moves,
// and {receiptId, type, target} objects for power-ups. Used to produce real verified wins.
import { levelActions, simulateLevelMove } from '../../src/services/levels/generator.js';
import { initialObjectiveProgress, objectiveStatus, simulateObjectiveClear } from '../../src/services/levels/objective-rules.js';
import { inventoryReplayEffect } from '../../src/services/levels/inventory-replay.js';

function nextState(result) {
  return {
    board: result.board,
    specials: result.specials,
    shields: result.shields,
    refillState: result.refillState,
    objectiveProgress: result.objectiveProgress,
  };
}

// `prefix` is a list of power-up actions to apply first, exactly as the server's replay applies them.
export function playGreedy(definition, prefix = []) {
  let state = {
    board: definition.board,
    specials: definition.specials,
    shields: definition.shields,
    refillState: definition.refillState,
    objectiveProgress: initialObjectiveProgress(definition),
  };
  let score = 0;
  const moves = [];

  for (const item of prefix) {
    const effect = inventoryReplayEffect(definition, state, item);
    if (!effect) throw new Error('invalid power-up in test prefix');
    const applied = simulateObjectiveClear(definition, state, effect.keys, effect.points);
    score += applied.score;
    moves.push(item);
    state = nextState(applied);
  }

  for (let i = 0; i < definition.moves; i++) {
    if (objectiveStatus(definition, score, state.objectiveProgress).complete) break;
    const actions = levelActions(definition, state.board, state.specials, state.objectiveProgress, score,
      state.shields, state.refillState);
    let best = null;
    for (const action of actions) {
      let result;
      try {
        result = simulateLevelMove(definition, state, action.cells);
      } catch {
        continue;
      }
      if (!result || !Number.isSafeInteger(result.score)) continue;
      const progress = objectiveStatus(definition, score + result.score, result.objectiveProgress).fraction || 0;
      const gain = result.score + progress * 1000;
      if (!best || gain > best.gain) best = { cells: action.cells, result, gain };
    }
    if (!best) break;
    moves.push(best.cells);
    score += best.result.score;
    state = nextState(best.result);
  }

  return {
    moves,
    score,
    objectiveProgress: state.objectiveProgress,
    complete: objectiveStatus(definition, score, state.objectiveProgress).complete,
  };
}
