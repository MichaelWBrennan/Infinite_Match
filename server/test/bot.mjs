// A small greedy player used only by tests. It plays the server-generated board with the shared
// rules, and returns the moves in the same shape the browser sends (cell arrays), plus the
// score and objective progress it reached. Used to produce real verified wins.
import { levelActions, simulateLevelMove } from '../../src/services/levels/generator.js';
import { initialObjectiveProgress, objectiveStatus } from '../../src/services/levels/objective-rules.js';

export function playGreedy(definition) {
  let state = {
    board: definition.board,
    specials: definition.specials,
    shields: definition.shields,
    refillState: definition.refillState,
    objectiveProgress: initialObjectiveProgress(definition),
  };
  let score = 0;
  const moves = [];
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
    state = {
      board: best.result.board,
      specials: best.result.specials,
      shields: best.result.shields,
      refillState: best.result.refillState,
      objectiveProgress: best.result.objectiveProgress,
    };
  }
  return {
    moves,
    score,
    objectiveProgress: state.objectiveProgress,
    complete: objectiveStatus(definition, score, state.objectiveProgress).complete,
  };
}
