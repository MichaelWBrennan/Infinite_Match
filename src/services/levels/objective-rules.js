/** Shared objective rules v4. Counts are cleared gems, never spawns, protected anchors or repairs. */
import { hashSeed } from './match-core.js';
import { specialActions, simulateSpecialMove, simulateSpecialClear, certifySpecialBoard } from './special-rules.js';
import { starsForTarget } from '../meta/rewards.js';
import { validShields, shieldCount, simulateShieldMove, simulateShieldClear, certifyShieldBoard } from './shield-rules.js';
import { validBlockers, blockerCount, simulateBlockerMove, simulateBlockerClear, certifyBlockerBoard } from './blocker-rules.js';
import { validLockedGems, lockedGemCount, simulateLockedGemMove, simulateLockedGemClear, certifyLockedGemBoard, legalSwapsExcludingLocks } from './locked-gem-rules.js';
import { validJelly, jellyCount, blankJelly, applyJellyClear, certifyJellyBoard } from './jelly-rules.js';
import { validChocolate, chocolateCount, blankChocolate, applyChocolateClear, certifyChocolateBoard } from './chocolate-rules.js';
import { validLiquorice, liquoriceCount, blankLiquorice, applyLiquoriceClear, certifyLiquoriceBoard } from './liquorice-rules.js';
import { validMarmalade, marmaladeCount, blankMarmalade, applyMarmaladeClear, certifyMarmaladeBoard } from './marmalade-rules.js';
import { validFrosting, frostingCount, blankFrosting, applyFrostingClear, certifyFrostingBoard } from './frosting-rules.js';

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
    } else if (goal.type === 'clear-blockers') {
      if (definition.generatorVersion < 6 || !validBlockers(definition.blockers, definition.boardSize) || goal.target !== blockerCount(definition.blockers)) return false;
    } else if (goal.type === 'clear-locked-gems') {
      if (definition.generatorVersion < 6 || !validLockedGems(definition.lockedGems, definition.boardSize) || goal.target !== lockedGemCount(definition.lockedGems)) return false;
    } else if (goal.type === 'clear-jelly') {
      if (definition.generatorVersion < 6 || !validJelly(definition.jelly, definition.boardSize) || goal.target !== jellyCount(definition.jelly)) return false;
    } else if (goal.type === 'clear-chocolate') {
      if (definition.generatorVersion < 6 || !validChocolate(definition.chocolate, definition.boardSize) || goal.target !== chocolateCount(definition.chocolate)) return false;
    } else if (goal.type === 'clear-liquorice') {
      if (definition.generatorVersion < 6 || !validLiquorice(definition.liquorice, definition.boardSize) || goal.target !== liquoriceCount(definition.liquorice)) return false;
    } else if (goal.type === 'clear-marmalade') {
      if (definition.generatorVersion < 6 || !validMarmalade(definition.marmalade, definition.boardSize) || goal.target !== marmaladeCount(definition.marmalade)) return false;
    } else if (goal.type === 'clear-frosting') {
      if (definition.generatorVersion < 6 || !validFrosting(definition.frosting, definition.boardSize) || goal.target !== frostingCount(definition.frosting)) return false;
    } else if (goal.type !== 'score' && (goal.type !== 'collect' || !Array.isArray(definition.gemTypes) || !definition.gemTypes.includes(goal.gemType))) return false;
    const identity = goal.type === 'collect' ? `collect:${goal.gemType}` : goal.type;
    if (identities.has(identity)) return false;
    identities.add(identity);
  }
  return true;
}

export function initialObjectiveProgress(definition) {
  const base = { collected: Object.fromEntries(definition.gemTypes.map((color) => [color, 0])),
    ...(definition.generatorVersion >= 5 ? { shieldsCleared: 0 } : {}) };
  const extra = {};
  if (definition.generatorVersion >= 6) {
    if (blockerCount(definition.blockers) > 0) extra.blockersCleared = 0;
    if (lockedGemCount(definition.lockedGems) > 0) extra.lockedCleared = 0;
    if (jellyCount(definition.jelly) > 0) extra.jellyCleared = 0;
    if (chocolateCount(definition.chocolate) > 0) extra.chocolateCleared = 0;
    if (liquoriceCount(definition.liquorice) > 0) extra.liquoriceCleared = 0;
    if (marmaladeCount(definition.marmalade) > 0) extra.marmaladeCleared = 0;
    if (frostingCount(definition.frosting) > 0) extra.frostingCleared = 0;
  }
  return { ...base, ...extra };
}

/** Strict completion/input boundary: no coercion, unknown colors, fractions, negatives or unbounded counts. */
export function validObjectiveProgress(definition, progress) {
  const record = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
  const hasShields = definition?.generatorVersion >= 5;
  const hasBlockers = definition?.generatorVersion >= 6 && blockerCount(definition.blockers) > 0;
  const hasLocked = definition?.generatorVersion >= 6 && lockedGemCount(definition.lockedGems) > 0;
  const hasJelly = definition?.generatorVersion >= 6 && jellyCount(definition.jelly) > 0;
  const hasChocolate = definition?.generatorVersion >= 6 && chocolateCount(definition.chocolate) > 0;
  const hasLiquorice = definition?.generatorVersion >= 6 && liquoriceCount(definition.liquorice) > 0;
  const hasMarmalade = definition?.generatorVersion >= 6 && marmaladeCount(definition.marmalade) > 0;
  const hasFrosting = definition?.generatorVersion >= 6 && frostingCount(definition.frosting) > 0;
  const keys = 1 + (hasShields ? 1 : 0) + (hasBlockers ? 1 : 0) + (hasLocked ? 1 : 0) + (hasJelly ? 1 : 0) + (hasChocolate ? 1 : 0) + (hasLiquorice ? 1 : 0) + (hasMarmalade ? 1 : 0) + (hasFrosting ? 1 : 0);
  return Array.isArray(definition?.gemTypes) && record(progress) && Object.hasOwn(progress, 'collected') && Object.keys(progress).length === keys
    && (!hasShields || (validShields(definition.shields, definition.boardSize)
      && Object.hasOwn(progress, 'shieldsCleared') && Number.isSafeInteger(progress.shieldsCleared) && progress.shieldsCleared >= 0
      && progress.shieldsCleared <= shieldCount(definition.shields)))
    && (!hasBlockers || (validBlockers(definition.blockers, definition.boardSize)
      && Object.hasOwn(progress, 'blockersCleared') && Number.isSafeInteger(progress.blockersCleared) && progress.blockersCleared >= 0
      && progress.blockersCleared <= MAX_COLLECTED_GEMS))
    && (!hasLocked || (validLockedGems(definition.lockedGems, definition.boardSize)
      && Object.hasOwn(progress, 'lockedCleared') && Number.isSafeInteger(progress.lockedCleared) && progress.lockedCleared >= 0
      && progress.lockedCleared <= MAX_COLLECTED_GEMS))
    && (!hasJelly || (validJelly(definition.jelly, definition.boardSize)
      && Object.hasOwn(progress, 'jellyCleared') && Number.isSafeInteger(progress.jellyCleared) && progress.jellyCleared >= 0
      && progress.jellyCleared <= MAX_COLLECTED_GEMS))
    && (!hasChocolate || (validChocolate(definition.chocolate, definition.boardSize)
      && Object.hasOwn(progress, 'chocolateCleared') && Number.isSafeInteger(progress.chocolateCleared) && progress.chocolateCleared >= 0
      && progress.chocolateCleared <= MAX_COLLECTED_GEMS))
    && (!hasLiquorice || (validLiquorice(definition.liquorice, definition.boardSize)
      && Object.hasOwn(progress, 'liquoriceCleared') && Number.isSafeInteger(progress.liquoriceCleared) && progress.liquoriceCleared >= 0
      && progress.liquoriceCleared <= MAX_COLLECTED_GEMS))
    && (!hasMarmalade || (validMarmalade(definition.marmalade, definition.boardSize)
      && Object.hasOwn(progress, 'marmaladeCleared') && Number.isSafeInteger(progress.marmaladeCleared) && progress.marmaladeCleared >= 0
      && progress.marmaladeCleared <= MAX_COLLECTED_GEMS))
    && (!hasFrosting || (validFrosting(definition.frosting, definition.boardSize)
      && Object.hasOwn(progress, 'frostingCleared') && Number.isSafeInteger(progress.frostingCleared) && progress.frostingCleared >= 0
      && progress.frostingCleared <= MAX_COLLECTED_GEMS)) && record(progress.collected)
    && Object.keys(progress.collected).length <= definition.gemTypes.length
    && Object.entries(progress.collected).every(([color, count]) => definition.gemTypes.includes(color)
      && Number.isSafeInteger(count) && count >= 0 && count <= MAX_COLLECTED_GEMS);
}

export function addObjectiveProgress(definition, previous, collected, brokenShields = 0, brokenBlockers = 0, brokenLocks = 0, brokenJelly = 0, brokenChocolate = 0, brokenLiquorice = 0, brokenMarmalade = 0, brokenFrosting = 0) {
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
  const hasBlockers = definition.blockers && blockerCount(definition.blockers) > 0;
  const hasLocked = definition.lockedGems && lockedGemCount(definition.lockedGems) > 0;
  if (definition.generatorVersion >= 6) {
    if (hasBlockers) {
      if (!Number.isSafeInteger(brokenBlockers) || brokenBlockers < 0 || previous.blockersCleared + brokenBlockers > MAX_COLLECTED_GEMS) throw new RangeError('invalid_blocker_delta');
      next.blockersCleared = previous.blockersCleared + brokenBlockers;
    }
    if (hasLocked) {
      if (!Number.isSafeInteger(brokenLocks) || brokenLocks < 0 || previous.lockedCleared + brokenLocks > MAX_COLLECTED_GEMS) throw new RangeError('invalid_locked_gem_delta');
      next.lockedCleared = previous.lockedCleared + brokenLocks;
    }
    const hasJelly = definition.jelly && jellyCount(definition.jelly) > 0;
    if (definition.generatorVersion >= 6 && hasJelly) {
      if (!Number.isSafeInteger(brokenJelly) || brokenJelly < 0 || previous.jellyCleared + brokenJelly > MAX_COLLECTED_GEMS) throw new RangeError('invalid_jelly_delta');
      next.jellyCleared = previous.jellyCleared + brokenJelly;
    }
    const hasChocolate = definition.chocolate && chocolateCount(definition.chocolate) > 0;
    if (definition.generatorVersion >= 6 && hasChocolate) {
      if (!Number.isSafeInteger(brokenChocolate) || brokenChocolate < 0 || previous.chocolateCleared + brokenChocolate > MAX_COLLECTED_GEMS) throw new RangeError('invalid_chocolate_delta');
      next.chocolateCleared = previous.chocolateCleared + brokenChocolate;
    }
    const hasLiquorice = definition.liquorice && liquoriceCount(definition.liquorice) > 0;
    if (definition.generatorVersion >= 6 && hasLiquorice) {
      if (!Number.isSafeInteger(brokenLiquorice) || brokenLiquorice < 0 || previous.liquoriceCleared + brokenLiquorice > MAX_COLLECTED_GEMS) throw new RangeError('invalid_liquorice_delta');
      next.liquoriceCleared = previous.liquoriceCleared + brokenLiquorice;
    }
    const hasMarmalade = definition.marmalade && marmaladeCount(definition.marmalade) > 0;
    if (definition.generatorVersion >= 6 && hasMarmalade) {
      if (!Number.isSafeInteger(brokenMarmalade) || brokenMarmalade < 0 || previous.marmaladeCleared + brokenMarmalade > MAX_COLLECTED_GEMS) throw new RangeError('invalid_marmalade_delta');
      next.marmaladeCleared = previous.marmaladeCleared + brokenMarmalade;
    }
    const hasFrosting = definition.frosting && frostingCount(definition.frosting) > 0;
    if (definition.generatorVersion >= 6 && hasFrosting) {
      if (!Number.isSafeInteger(brokenFrosting) || brokenFrosting < 0 || previous.frostingCleared + brokenFrosting > MAX_COLLECTED_GEMS) throw new RangeError('invalid_frosting_delta');
      next.frostingCleared = previous.frostingCleared + brokenFrosting;
    }
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
      : goal.type === 'clear-shields' ? progress.shieldsCleared
        : goal.type === 'clear-blockers' ? progress.blockersCleared
          : goal.type === 'clear-locked-gems' ? progress.lockedCleared
            : goal.type === 'clear-jelly' ? progress.jellyCleared
              : goal.type === 'clear-chocolate' ? progress.chocolateCleared
                : goal.type === 'clear-liquorice' ? progress.liquoriceCleared
                  : goal.type === 'clear-marmalade' ? progress.marmaladeCleared
                    : goal.type === 'clear-frosting' ? progress.frostingCleared : ownCount(progress.collected, goal.gemType);
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
  const collects = levelObjectives(definition).some((goal) => goal.type === 'collect' || goal.type === 'clear-shields' || goal.type === 'clear-blockers' || goal.type === 'clear-jelly' || goal.type === 'clear-chocolate' || goal.type === 'clear-liquorice' || goal.type === 'clear-marmalade' || goal.type === 'clear-frosting');
  if (collects && progress === undefined) return 'objective_progress_required';
  if (progress !== undefined && !validObjectiveProgress(definition, progress)) return 'invalid_objective_progress';
  const status = objectiveStatus(definition, score, progress);
  if (status.items.some((goal) => goal.type === 'score' && !goal.complete)) return 'score_below_target';
  return status.complete ? null : 'objectives_incomplete';
}

export function objectiveDescription(definition) {
  return (levelObjectives(definition) || []).map((goal) => goal.type === 'collect'
    ? `Collect ${goal.target} ${goal.gemType}` : goal.type === 'clear-shields'
      ? `Clear ${goal.target} shields (numbered hits)` : goal.type === 'clear-blockers'
        ? `Clear ${goal.target} blockers` : goal.type === 'clear-locked-gems'
          ? `Free ${goal.target} locked gems` : goal.type === 'clear-jelly'
            ? `Clear ${goal.target} jelly layers` : goal.type === 'clear-chocolate'
              ? `Clear ${goal.target} chocolate` : goal.type === 'clear-liquorice'
                ? `Clear ${goal.target} liquorice locks` : goal.type === 'clear-marmalade'
                  ? `Clear ${goal.target} marmalade` : goal.type === 'clear-frosting'
                    ? `Clear ${goal.target} frosting layers` : `Score ${goal.target.toLocaleString('en-US')}`).join(' + ');
}

export function objectiveSummary(definition, score, progress, showRemaining = false) {
  return objectiveStatus(definition, score, progress).items.map((goal) => {
    const name = goal.type === 'collect' ? goal.gemType : goal.type === 'clear-shields' ? 'Shields'
      : goal.type === 'clear-blockers' ? 'Blockers' : goal.type === 'clear-locked-gems' ? 'Locked gems' : goal.type === 'clear-jelly' ? 'Jelly' : goal.type === 'clear-chocolate' ? 'Chocolate' : goal.type === 'clear-liquorice' ? 'Liquorice' : goal.type === 'clear-marmalade' ? 'Marmalade' : goal.type === 'clear-frosting' ? 'Frosting' : 'Score';
    const total = `${name} ${Math.min(goal.current, goal.target).toLocaleString('en-US')}/${goal.target.toLocaleString('en-US')}`;
    return showRemaining ? `${total} (${goal.complete ? 'done' : `${goal.remaining.toLocaleString('en-US')} left`})` : total;
  }).join(' · ');
}

/** Immediate goal-aware hints without consuming RNG or running every full cascade. Not an optimal-win promise. */
export function objectiveActions(definition, board, specials, progress, score = 0, shields = null, refillState = 0, blockers = null, lockedGems = null, jelly = null, chocolate = null, liquorice = null, marmalade = null, frosting = null) {
  const goals = objectiveStatus(definition, score, progress).items;
  const actions = specialActions(board, specials, true);
  for (const action of actions) {
    const shieldResult = goals.some((goal) => goal.type === 'clear-shields') && shields
      ? simulateShieldMove(definition, { board, specials, refillState, shields }, action.cells) : null;
    const blockerResult = goals.some((goal) => goal.type === 'clear-blockers') && blockers
      ? simulateBlockerMove(definition, { board, specials, refillState, shields, blockers }, action.cells) : null;
    const lockedResult = goals.some((goal) => goal.type === 'clear-locked-gems') && lockedGems
      ? simulateLockedGemMove(definition, { board, specials, refillState, shields, locked: lockedGems }, action.cells) : null;
    const jellyResult = goals.some((goal) => goal.type === 'clear-jelly') && jelly
      ? applyJellyClear({ events: [{ cleared: action.cells }] }, jelly) : null;
    const chocolateResult = goals.some((goal) => goal.type === 'clear-chocolate') && chocolate
      ? applyChocolateClear({ events: [{ cleared: action.cells }] }, chocolate) : null;
    const liquoriceResult = goals.some((goal) => goal.type === 'clear-liquorice') && liquorice
      ? applyLiquoriceClear({ events: [{ cleared: action.cells }], board: { length: liquorice.length } }, liquorice) : null;
    const marmaladeResult = goals.some((goal) => goal.type === 'clear-marmalade') && marmalade
      ? applyMarmaladeClear({ events: [{ cleared: action.cells }] }, marmalade) : null;
    const frostingResult = goals.some((goal) => goal.type === 'clear-frosting') && frosting
      ? applyFrostingClear({ events: [{ cleared: action.cells }] }, frosting) : null;
    action.priority = goals.reduce((sum, goal) => sum + Math.min(goal.remaining,
      goal.type === 'score' ? action.points : goal.type === 'clear-shields'
        ? (shieldResult?.brokenShields || 0) + (shieldResult?.events.flatMap((e) => e.shieldHits).length || 0) * 0.1
        : goal.type === 'clear-blockers' ? (blockerResult?.brokenBlockers || 0)
          : goal.type === 'clear-locked-gems' ? (lockedResult?.brokenLocks || 0)
            : goal.type === 'clear-jelly' ? (jellyResult?.cleared || 0)
              : goal.type === 'clear-chocolate' ? (chocolateResult?.cleared || 0)
                : goal.type === 'clear-liquorice' ? (liquoriceResult?.liquoriceCleared || 0)
                  : goal.type === 'clear-marmalade' ? (marmaladeResult?.cleared || 0)
                    : goal.type === 'clear-frosting' ? (frostingResult?.cleared || 0)
                      : action.collected[goal.gemType] || 0) / goal.target, 0);
  }
  return actions;
}

export function simulateObjectiveMove(definition, state, cells, visualTrace = false) {
  const previous = state.objectiveProgress === undefined ? initialObjectiveProgress(definition) : state.objectiveProgress;
  if (!validObjectiveProgress(definition, previous)) return null;
  const hasLocked = state.locked && lockedGemCount(state.locked) > 0;
  const hasJelly = state.jelly && jellyCount(state.jelly) > 0;
  const hasChocolate = state.chocolate && chocolateCount(state.chocolate) > 0;
  const hasLiquorice = state.liquorice && liquoriceCount(state.liquorice) > 0;
  const hasMarmalade = state.marmalade && marmaladeCount(state.marmalade) > 0;
  const hasFrosting = state.frosting && frostingCount(state.frosting) > 0;
  const result = definition.generatorVersion >= 6
    ? (hasLocked ? simulateLockedGemMove(definition, state, cells, visualTrace)
      : hasJelly ? applyJellyClear(simulateSpecialMove(state.board, state.refillState, definition.gemTypes, definition.gemWeights, cells, state.specials, true, visualTrace), state.jelly)
        : hasChocolate ? applyChocolateClear(simulateSpecialMove(state.board, state.refillState, definition.gemTypes, definition.gemWeights, cells, state.specials, true, visualTrace), state.chocolate)
          : hasLiquorice ? applyLiquoriceClear(simulateSpecialMove(state.board, state.refillState, definition.gemTypes, definition.gemWeights, cells, state.specials, true, visualTrace), state.liquorice)
            : hasMarmalade ? applyMarmaladeClear(simulateSpecialMove(state.board, state.refillState, definition.gemTypes, definition.gemWeights, cells, state.specials, true, visualTrace), state.marmalade)
              : hasFrosting ? applyFrostingClear(simulateSpecialMove(state.board, state.refillState, definition.gemTypes, definition.gemWeights, cells, state.specials, true, visualTrace), state.frosting)
                : simulateBlockerMove(definition, state, cells, visualTrace))
    : definition.generatorVersion >= 5
      ? simulateShieldMove(definition, state, cells, visualTrace)
      : simulateSpecialMove(state.board, state.refillState, definition.gemTypes, definition.gemWeights, cells, state.specials, true, visualTrace);
  if (!result) return null;
  const brokenJelly = hasJelly ? result.jellyCleared || 0 : 0;
  const brokenChocolate = hasChocolate ? result.chocolateCleared || 0 : 0;
  const brokenLiquorice = hasLiquorice ? result.liquoriceCleared || 0 : 0;
  const brokenMarmalade = hasMarmalade ? result.marmaladeCleared || 0 : 0;
  const brokenFrosting = hasFrosting ? result.frostingCleared || 0 : 0;
  return { ...result, objectiveProgress: addObjectiveProgress(definition, previous, result.collected, result.brokenShields, result.brokenBlockers, result.brokenLocks, brokenJelly, brokenChocolate, brokenLiquorice, brokenMarmalade, brokenFrosting) };
}

export function simulateObjectiveClear(definition, state, keys, points, visualTrace = false) {
  const previous = state.objectiveProgress === undefined ? initialObjectiveProgress(definition) : state.objectiveProgress;
  if (!validObjectiveProgress(definition, previous)) return null;
  const hasLocked = state.locked && lockedGemCount(state.locked) > 0;
  const hasJelly = state.jelly && jellyCount(state.jelly) > 0;
  const hasChocolate = state.chocolate && chocolateCount(state.chocolate) > 0;
  const hasLiquorice = state.liquorice && liquoriceCount(state.liquorice) > 0;
  const hasMarmalade = state.marmalade && marmaladeCount(state.marmalade) > 0;
  const hasFrosting = state.frosting && frostingCount(state.frosting) > 0;
  const baseResult = definition.generatorVersion >= 6
    ? (hasLocked ? simulateLockedGemClear(definition, state, keys, points, visualTrace)
      : simulateBlockerClear(definition, state, keys, points, visualTrace))
    : definition.generatorVersion >= 5
      ? simulateShieldClear(definition, state, keys, points, visualTrace)
      : simulateSpecialClear(state.board, state.refillState, definition.gemTypes, definition.gemWeights, keys, state.specials, points, true, visualTrace);
  if (!baseResult) return null;
  const result = hasJelly ? applyJellyClear(baseResult, state.jelly) : hasChocolate ? applyChocolateClear(baseResult, state.chocolate) : hasLiquorice ? applyLiquoriceClear(baseResult, state.liquorice) : hasMarmalade ? applyMarmaladeClear(baseResult, state.marmalade) : hasFrosting ? applyFrostingClear(baseResult, state.frosting) : baseResult;
  const brokenJelly = hasJelly ? (result.jellyCleared || 0) : 0;
  const brokenChocolate = hasChocolate ? (result.chocolateCleared || 0) : 0;
  const brokenLiquorice = hasLiquorice ? (result.liquoriceCleared || 0) : 0;
  const brokenMarmalade = hasMarmalade ? (result.marmaladeCleared || 0) : 0;
  const brokenFrosting = hasFrosting ? (result.frostingCleared || 0) : 0;
  return { ...result, objectiveProgress: addObjectiveProgress(definition, previous, result.collected, result.brokenShields, result.brokenBlockers, result.brokenLocks, brokenJelly, brokenChocolate, brokenLiquorice, brokenMarmalade, brokenFrosting) };
}

/** The same bounded witness used to compose goals must satisfy every goal, not only a score threshold. */
export function certifyObjectiveLevel(definition) {
  const budget = definition.quality?.verifiedMoves || Math.min(30, definition.moves);
  const isLocked = definition.generatorVersion >= 6 && lockedGemCount(definition.lockedGems) > 0;
  const isJelly = definition.generatorVersion >= 6 && jellyCount(definition.jelly) > 0;
  const isChocolate = definition.generatorVersion >= 6 && chocolateCount(definition.chocolate) > 0;
  const isLiquorice = definition.generatorVersion >= 6 && liquoriceCount(definition.liquorice) > 0;
  const isMarmalade = definition.generatorVersion >= 6 && marmaladeCount(definition.marmalade) > 0;
  const isFrosting = definition.generatorVersion >= 6 && frostingCount(definition.frosting) > 0;
  const proof = definition.generatorVersion >= 6
    ? (isLocked ? certifyLockedGemBoard(definition) : isJelly ? certifyJellyBoard(definition) : isChocolate ? certifyChocolateBoard(definition) : isLiquorice ? certifyLiquoriceBoard(definition) : isMarmalade ? certifyMarmaladeBoard(definition) : isFrosting ? certifyFrostingBoard(definition) : certifyBlockerBoard(definition))
    : definition.generatorVersion >= 5 ? certifyShieldBoard(definition)
      : certifySpecialBoard(definition.board, definition.refillState, definition.gemTypes, definition.gemWeights, budget, definition.specials, true);
  const objectiveProgress = { collected: proof.collected,
    ...(definition.generatorVersion >= 5 ? { shieldsCleared: proof.brokenShields } : {}),
    ...(definition.generatorVersion >= 6 && !isLocked && !isJelly && !isChocolate && !isLiquorice && !isMarmalade && !isFrosting ? { blockersCleared: proof.brokenBlockers } : {}),
    ...(definition.generatorVersion >= 6 && isLocked ? { lockedCleared: proof.brokenLocks } : {}),
    ...(definition.generatorVersion >= 6 && isJelly ? { jellyCleared: proof.jellyCleared } : {}),
    ...(definition.generatorVersion >= 6 && isChocolate ? { chocolateCleared: proof.chocolateCleared } : {}),
    ...(definition.generatorVersion >= 6 && isLiquorice ? { liquoriceCleared: proof.liquoriceCleared } : {}),
    ...(definition.generatorVersion >= 6 && isMarmalade ? { marmaladeCleared: proof.marmaladeCleared } : {}),
    ...(definition.generatorVersion >= 6 && isFrosting ? { frostingCleared: proof.frostingCleared } : {}) };
  return { ...proof, objectiveProgress, objectivesComplete: objectiveStatus(definition, proof.score, objectiveProgress).complete };
}
