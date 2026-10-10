/** Shared objective rules v4. Counts are cleared gems, never spawns, protected anchors or repairs. */
import { hashSeed } from './match-core.js';
import { specialActions, simulateSpecialMove, simulateSpecialClear, certifySpecialBoard } from './special-rules.js';
import { starsForTarget } from '../meta/rewards.js';
import { validShields, shieldCount, simulateShieldMove, simulateShieldClear, certifyShieldBoard } from './shield-rules.js';

export const MAX_COLLECTED_GEMS = 1000000;
const ownCount = (counts, color) => Object.hasOwn(counts, color) ? counts[color] : 0;

/** Deterministic goals are calibrated against an already-replayed no-inventory witness. */
export function composeObjectives({ level, mode, seed, palette, favorite, proof, targetScore, fraction }) {
  const choice = mode === 'daily' ? hashSeed(`${seed}|objectives`) % 4
    : level === 1 ? 0 : level <= 3 ? 1 : (level - 1) % 4;
  const profiles = ['score', 'collect', 'collect-pair', 'score-and-collect'];
  const profile = profiles[choice];
  const scoreGoal = { type: 'score', target: targetScore };
  if (choice === 0) return { profile, objectives: [scoreGoal] };
  const candidates = palette.filter((color) => proof.collected[color] >= 5)
    .sort((a, b) => (b === favorite ? 1 : 0) - (a === favorite ? 1 : 0)
      || proof.collected[b] - proof.collected[a] || a.localeCompare(b, 'en'));
  if (candidates.length < (choice === 2 ? 2 : 1)) return { profile: 'score', objectives: [scoreGoal] };
  // A witnessed palette color, never a color absent from the board/refill stream.
  const offset = level <= 3 && mode !== 'daily' ? 0 : hashSeed(`${seed}|collection-color`) % candidates.length;
  const selected = choice === 2 ? [candidates[offset], candidates[(offset + 1) % candidates.length]] : [candidates[offset]];
  const limit = choice === 2 ? 45 : level <= 3 && mode !== 'daily' ? 25 : 70;
  const goals = selected.map((gemType) => ({ type: 'collect', gemType,
    target: Math.max(5, Math.floor(Math.min(limit, proof.collected[gemType] * fraction) / 5) * 5) }));
  return { profile, objectives: choice === 3 ? [scoreGoal, ...goals] : goals };
}

/** Older funded definitions keep their score-only interpretation, even if caller metadata changes. */
export function levelObjectives(definition) {
  if (!definition || typeof definition !== 'object') return null;
  return definition.generatorVersion >= 4 ? definition.objectives : [{ type: 'score', target: definition.targetScore }];
}

export function validObjectives(definition) {
  const objectives = levelObjectives(definition);
  if (!Array.isArray(objectives) || objectives.length < 1 || objectives.length > 2) return false;
  const identities = new Set();
  for (const goal of objectives) {
    if (!goal || !Number.isSafeInteger(goal.target) || goal.target <= 0 || goal.target > MAX_COLLECTED_GEMS) return false;
    if (goal.type === 'clear-shields') {
      if (definition.generatorVersion < 5 || !validShields(definition.shields, definition.boardSize) || goal.target !== shieldCount(definition.shields)) return false;
    } else if (goal.type !== 'score' && (goal.type !== 'collect' || !Array.isArray(definition.gemTypes) || !definition.gemTypes.includes(goal.gemType))) return false;
    const identity = goal.type === 'collect' ? `collect:${goal.gemType}` : goal.type;
    if (identities.has(identity)) return false;
    identities.add(identity);
  }
  return true;
}

export function initialObjectiveProgress(definition) {
  return { collected: Object.fromEntries(definition.gemTypes.map((color) => [color, 0])),
    ...(definition.generatorVersion >= 5 ? { shieldsCleared: 0 } : {}) };
}

/** Strict completion/input boundary: no coercion, unknown colors, fractions, negatives or unbounded counts. */
export function validObjectiveProgress(definition, progress) {
  const record = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
  return Array.isArray(definition?.gemTypes) && record(progress) && Object.hasOwn(progress, 'collected') && Object.keys(progress).length === (definition.generatorVersion >= 5 ? 2 : 1)
    && (definition.generatorVersion < 5 || (validShields(definition.shields, definition.boardSize)
      && Object.hasOwn(progress, 'shieldsCleared') && Number.isSafeInteger(progress.shieldsCleared) && progress.shieldsCleared >= 0
      && progress.shieldsCleared <= shieldCount(definition.shields))) && record(progress.collected)
    && Object.keys(progress.collected).length <= definition.gemTypes.length
    && Object.entries(progress.collected).every(([color, count]) => definition.gemTypes.includes(color)
      && Number.isSafeInteger(count) && count >= 0 && count <= MAX_COLLECTED_GEMS);
}

export function addObjectiveProgress(definition, previous, collected, brokenShields = 0) {
  if (!validObjectiveProgress(definition, previous)) throw new RangeError('invalid_objective_progress');
  const next = initialObjectiveProgress(definition);
  for (const color of definition.gemTypes) {
    const increment = ownCount(collected, color);
    if (!Number.isSafeInteger(increment) || increment < 0) throw new RangeError('invalid_collection_delta');
    next.collected[color] = Math.min(MAX_COLLECTED_GEMS, ownCount(previous.collected, color) + increment);
  }
  if (definition.generatorVersion >= 5) {
    if (!Number.isSafeInteger(brokenShields) || brokenShields < 0 || previous.shieldsCleared + brokenShields > shieldCount(definition.shields)) throw new RangeError('invalid_shield_delta');
    next.shieldsCleared = previous.shieldsCleared + brokenShields;
  }
  return next;
}

/** Every declared goal is required; targetScore alone is only a rating baseline on collection-only levels. */
export function objectiveStatus(definition, score, progress) {
  if (!validObjectives(definition)) return { complete: false, items: [], fraction: 0 };
  const scoreValid = Number.isSafeInteger(score) && score >= 0;
  const safeScore = scoreValid ? score : 0;
  const validProgress = progress !== undefined && validObjectiveProgress(definition, progress);
  const items = levelObjectives(definition).map((goal) => {
    const current = goal.type === 'score' ? safeScore : !validProgress ? 0
      : goal.type === 'clear-shields' ? progress.shieldsCleared : ownCount(progress.collected, goal.gemType);
    return { ...goal, current, remaining: Math.max(0, goal.target - current), complete: current >= goal.target };
  });
  return { items, complete: scoreValid && items.every((goal) => goal.complete),
    fraction: items.reduce((sum, goal) => sum + Math.min(1, goal.current / goal.target), 0) / items.length };
}

/** One star for satisfying collection goals; further stars still use the pinned score thresholds. */
export function objectiveStars(definition, score, progress) {
  return objectiveStatus(definition, score, progress).complete ? Math.max(1, starsForTarget(score, definition.targetScore)) : 0;
}

export function objectiveCompletionError(definition, score, progress) {
  if (!Number.isSafeInteger(score) || score < 0) return 'invalid_score';
  if (!validObjectives(definition)) return 'invalid_level_objectives';
  const collects = levelObjectives(definition).some((goal) => goal.type === 'collect' || goal.type === 'clear-shields');
  if (collects && progress === undefined) return 'objective_progress_required';
  if (progress !== undefined && !validObjectiveProgress(definition, progress)) return 'invalid_objective_progress';
  const status = objectiveStatus(definition, score, progress);
  if (status.items.some((goal) => goal.type === 'score' && !goal.complete)) return 'score_below_target';
  return status.complete ? null : 'objectives_incomplete';
}

export function objectiveDescription(definition) {
  return (levelObjectives(definition) || []).map((goal) => goal.type === 'collect'
    ? `Collect ${goal.target} ${goal.gemType}` : goal.type === 'clear-shields'
      ? `Clear ${goal.target} shields (numbered hits)` : `Score ${goal.target.toLocaleString('en-US')}`).join(' + ');
}

export function objectiveSummary(definition, score, progress, showRemaining = false) {
  return objectiveStatus(definition, score, progress).items.map((goal) => {
    const name = goal.type === 'collect' ? goal.gemType : goal.type === 'clear-shields' ? 'Shields' : 'Score';
    const total = `${name} ${Math.min(goal.current, goal.target).toLocaleString('en-US')}/${goal.target.toLocaleString('en-US')}`;
    return showRemaining ? `${total} (${goal.complete ? 'done' : `${goal.remaining.toLocaleString('en-US')} left`})` : total;
  }).join(' · ');
}

/** Immediate goal-aware hints without consuming RNG or running every full cascade. Not an optimal-win promise. */
export function objectiveActions(definition, board, specials, progress, score = 0, shields = null, refillState = 0) {
  const goals = objectiveStatus(definition, score, progress).items;
  const actions = specialActions(board, specials, true);
  for (const action of actions) {
    const shieldResult = goals.some((goal) => goal.type === 'clear-shields') && shields
      ? simulateShieldMove(definition, { board, specials, refillState, shields }, action.cells) : null;
    action.priority = goals.reduce((sum, goal) => sum + Math.min(goal.remaining,
      goal.type === 'score' ? action.points : goal.type === 'clear-shields'
        ? (shieldResult?.brokenShields || 0) + (shieldResult?.events.flatMap((e) => e.shieldHits).length || 0) * 0.1
        : action.collected[goal.gemType] || 0) / goal.target, 0);
  }
  return actions;
}

export function simulateObjectiveMove(definition, state, cells, visualTrace = false) {
  const previous = state.objectiveProgress === undefined ? initialObjectiveProgress(definition) : state.objectiveProgress;
  if (!validObjectiveProgress(definition, previous)) return null;
  const result = definition.generatorVersion >= 5
    ? simulateShieldMove(definition, state, cells, visualTrace)
    : simulateSpecialMove(state.board, state.refillState, definition.gemTypes, definition.gemWeights, cells, state.specials, true, visualTrace);
  return result ? { ...result, objectiveProgress: addObjectiveProgress(definition, previous, result.collected, result.brokenShields) } : null;
}

export function simulateObjectiveClear(definition, state, keys, points, visualTrace = false) {
  const previous = state.objectiveProgress === undefined ? initialObjectiveProgress(definition) : state.objectiveProgress;
  if (!validObjectiveProgress(definition, previous)) return null;
  const result = definition.generatorVersion >= 5
    ? simulateShieldClear(definition, state, keys, points, visualTrace)
    : simulateSpecialClear(state.board, state.refillState, definition.gemTypes, definition.gemWeights, keys, state.specials, points, true, visualTrace);
  return result ? { ...result, objectiveProgress: addObjectiveProgress(definition, previous, result.collected, result.brokenShields) } : null;
}

/** The same bounded witness used to compose goals must satisfy every goal, not only a score threshold. */
export function certifyObjectiveLevel(definition) {
  const budget = definition.quality?.verifiedMoves || Math.min(30, definition.moves);
  const proof = definition.generatorVersion >= 5 ? certifyShieldBoard(definition)
    : certifySpecialBoard(definition.board, definition.refillState, definition.gemTypes, definition.gemWeights, budget, definition.specials, true);
  const objectiveProgress = { collected: proof.collected, ...(definition.generatorVersion >= 5 ? { shieldsCleared: proof.brokenShields } : {}) };
  return { ...proof, objectiveProgress, objectivesComplete: objectiveStatus(definition, proof.score, objectiveProgress).complete };
}
