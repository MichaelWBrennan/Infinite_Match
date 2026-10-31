/**
 * Pure, versioned match-3 generation shared by the server and the browser.
 * No AI, network, level files, wall clock or paid boosters are needed.
 * A deterministic simulation supplies a winning witness before a level ships.
 */
import { environmentRules, blendHex } from './environment.js';
import { hashSeed, nextRandom, legalSwaps, dealPlayableBoard, certifyBoard, simulateMove } from './match-core.js';
import { blankSpecials, specialActions, certifySpecialBoard, simulateSpecialMove } from './special-rules.js';
import { witnessedShields, shieldCount } from './shield-rules.js';
import { witnessedBlockers, blockerCount, blankBlockers } from './blocker-rules.js';
import { witnessedLockedGems, lockedGemCount, blankLockedGems, legalSwapsExcludingLocks } from './locked-gem-rules.js';
import { witnessedJelly, jellyCount, blankJelly } from './jelly-rules.js';
import { witnessedChocolate, chocolateCount, blankChocolate } from './chocolate-rules.js';
import { witnessedLiquorice, liquoriceCount, blankLiquorice } from './liquorice-rules.js';
import { witnessedMarmalade, marmaladeCount, blankMarmalade } from './marmalade-rules.js';
import { witnessedFrosting, frostingCount, blankFrosting } from './frosting-rules.js';
import { composeObjectives, objectiveStatus, objectiveActions, simulateObjectiveMove, certifyObjectiveLevel } from './objective-rules.js';
export { hashSeed, nextRandom, pickGem, matchingCells, legalSwaps, dealPlayableBoard, simulateMove, certifyBoard } from './match-core.js';
export { SPECIAL_TYPES, blankSpecials, earnedMatches, specialActions, simulateSpecialMove, simulateSpecialClear } from './special-rules.js';
export { composeObjectives, levelObjectives, initialObjectiveProgress, validObjectiveProgress, addObjectiveProgress, objectiveStatus, objectiveStars, objectiveCompletionError, objectiveDescription, objectiveSummary, simulateObjectiveClear } from './objective-rules.js';


export const GENERATOR_VERSION = 5;
export const GEM_TYPES = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
export const LEVEL_MODES = ['classic', 'timed', 'daily', 'endless'];

export function levelTheme(context) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const seasonal = {
    winter: { name: 'Crystal Winter', background: '#142c46', accent: '#9edfff', favorite: 'blue' },
    spring: { name: 'Blooming Gardens', background: '#183f38', accent: '#9cf0b5', favorite: 'green' },
    summer: { name: 'Sunlit Shores', background: '#163d54', accent: '#ffe082', favorite: 'yellow' },
    autumn: { name: 'Harvest Skies', background: '#40253d', accent: '#ffc078', favorite: 'orange' },
  };
  const season = seasonal[context.season] || seasonal.spring;
  const monthlyColors = {
    winter: ['blue', 'purple', 'green'], spring: ['green', 'purple', 'yellow'],
    summer: ['yellow', 'orange', 'blue'], autumn: ['orange', 'red', 'purple'],
  };
  const seasonalFavorite = (monthlyColors[context.season] || monthlyColors.spring)[context.month % 3];
  const holidays = context.holidays || [];
  const holidayName = holidays.map((holiday) => holiday.name).join(' · ');
  const special = /halloween/i.test(holidayName)
    ? { name: 'Halloween', background: '#25133b', accent: '#ffa658', favorite: 'orange' }
    : /christmas|no[eë]l/i.test(holidayName)
      ? { name: 'Christmas', background: '#19372f', accent: '#f7d987', favorite: 'red' }
      : /valentine/i.test(holidayName)
        ? { name: 'Valentine Celebration', background: '#461e38', accent: '#ff9ec2', favorite: 'red' }
        : /easter/i.test(holidayName)
          ? { name: 'Easter Celebration', background: '#323b54', accent: '#d8b5ff', favorite: 'purple' }
          : holidays.length
            ? { name: holidays[0].name, background: '#2e2250', accent: '#ffd87a', favorite: 'purple' }
            : null;
  const selected = special || { ...season, favorite: seasonalFavorite };
  const environment = environmentRules(context);
  const monthName = monthNames[context.month - 1] || 'Local';
  return {
    ...selected,
    id: special ? `holiday-${hashSeed(holidayName).toString(16)}` : `${context.season}-${context.month}`,
    name: special ? selected.name : `${monthName} · ${selected.name}`,
    background: blendHex(selected.background, environment.tint),
    accent: special ? selected.accent : environment.accent || selected.accent,
    environmentLabel: environment.label,
    monthName,
    season: context.season,
    holidayNames: holidays.map((holiday) => holiday.name),
  };
}

/** Cache/seed identity excludes fetch timestamps and small changes within weather bands. */
export function generationKey(levelNumber, context, mode = 'classic', version = GENERATOR_VERSION) {
  const level = mode === 'daily' ? 1 : levelNumber;
  const rules = environmentRules(context);
  const theme = levelTheme(context);
  const area = context.weatherEnabled === false ? '' : context.weather?.area?.key
    || (Number.isFinite(context.weatherLatitude) ? `${context.weatherLatitude},${context.weatherLongitude}` : '');
  return [version, mode, level, context.localDate, context.timeZone,
    context.country || '', context.region || '', context.hemisphere, theme.id, rules.key, area].join('|');
}

/** Any positive safe level number; bounded difficulty instead of impossible linear score growth. */
export function generateLevel(levelNumber, context, mode = 'classic', version = GENERATOR_VERSION) {
  if (!Number.isSafeInteger(levelNumber) || levelNumber < 1) throw new RangeError('invalid_level');
  if (!LEVEL_MODES.includes(mode)) throw new RangeError('invalid_mode');
  if (![2, 3, 4, 5, 6].includes(version)) throw new RangeError('unsupported_generator_version');
  const level = mode === 'daily' ? 1 : levelNumber;
  const theme = levelTheme(context);
  const environment = environmentRules(context);
  const key = generationKey(level, context, mode, version);
  const seed = hashSeed(key);
  const rng = { state: seed };
  const cycle = mode === 'daily' ? Math.floor(nextRandom(rng) * 5) : (level - 1) % 5;
  const isBoss = mode !== 'daily' && level % 10 === 0;
  const size = 6 + Math.floor(nextRandom(rng) * 3);
  const baseColorCount = isBoss ? 6 : level <= 3 && mode !== 'daily' ? 4 : 4 + Math.floor(nextRandom(rng) * 3);
  const colorCount = Math.max(baseColorCount, environment.minimumColors);
  const priorities = [...new Set([theme.favorite, ...environment.priorities])];
  const others = GEM_TYPES.filter((color) => !priorities.includes(color));
  // Seeded Fisher-Yates: month/season/holiday changes the palette and refill mix.
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(rng) * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const palette = [...priorities, ...others].slice(0, colorCount);
  const weights = Object.fromEntries(palette.map((color) => [color,
    Math.min(2.2, (color === theme.favorite ? 1.35 : 1) + (environment.gemBonuses[color] || 0))]));
  const moveBudget = Math.max(20, Math.min(30, 30 - cycle - (isBoss ? 5 : 0) + environment.moveBonus));
  const board = dealPlayableBoard(size, palette, weights, rng);
  const refillState = rng.state;
  const proof = version >= 3 ? certifySpecialBoard(board, refillState, palette, weights, moveBudget, blankSpecials(size), version >= 4)
    : certifyBoard(board, refillState, palette, weights, moveBudget);
  const fraction = isBoss ? 0.86 : 0.62 + cycle * 0.04;
  const targetScore = Math.max(100, Math.floor(Math.min(2400, proof.score * fraction) / 50) * 50);
  if (proof.witness.length !== moveBudget || proof.score < targetScore) throw new Error('level_quality_failed');
  let goals = version >= 4 ? composeObjectives({ level, mode, seed, palette, favorite: theme.favorite, proof, targetScore, fraction })
    : { objectives: [{ type: 'score', target: targetScore }] };
  // Frozen v2-v4 definitions are untouched. V5 shields occupy fixed cells cleared twice
  // on the witnessed path; score/collection mechanics and the refill stream are unchanged.
  const shieldStage = version >= 5 && (mode === 'daily' ? hashSeed(`${seed}|shield-day`) % 3 === 0 : level >= 4 && level % 4 === 0);
  const shields = version >= 5 ? shieldStage
    ? witnessedShields(board, refillState, palette, weights, blankSpecials(size), proof.witness, seed)
    : blankSpecials(size).map((row) => row.map(() => 0)) : null;
  const shieldsTotal = shields ? shieldCount(shields) : 0;
  if (shieldStage && shieldsTotal) {
    const scoreGoal = goals.objectives.find((goal) => goal.type === 'score');
    goals = { profile: 'clear-shields', objectives: [...(scoreGoal ? [scoreGoal] : []), { type: 'clear-shields', target: shieldsTotal }] };
  }
  // V6 obstacles occupy distinct stages (never with shields), each adding one objective.
  // Their overlays never change gems, so the witness and score are the v5 witness and score.
  // Classic only (plan M5): daily, timed and endless never receive v6 obstacles.
  // Stages cycle every 8 levels: %8===0 locked gems, %8===1 jelly, %8===2 blockers,
  // %8===3 chocolate, %8===4 liquorice, %8===5 marmalade, %8===6 frosting, %8===7 no obstacle.
  const lockedGemStage = version >= 6 && !shieldStage && mode === 'classic' && level >= 3 && level % 8 === 0;
  const lockedGems = version >= 6 ? lockedGemStage
    ? witnessedLockedGems(board, refillState, palette, weights, blankSpecials(size), proof.witness, seed)
    : blankLockedGems(size) : null;
  const lockedTotal = lockedGems ? lockedGemCount(lockedGems) : 0;
  if (lockedGemStage && lockedTotal) {
    const scoreGoal = goals.objectives.find((goal) => goal.type === 'score');
    goals = { profile: 'clear-locked-gems', objectives: [...(scoreGoal ? [scoreGoal] : []), { type: 'clear-locked-gems', target: lockedTotal }] };
  }
  // V6 jelly occupies its own stage (never with shields, blockers, or locked gems). Jelly
  // sits on top of gems and is consumed one layer at a time by clears over its cell.
  // Classic only: daily, timed and endless never receive jelly.
  const jellyStage = version >= 6 && !shieldStage && !lockedGemStage && mode === 'classic' && level >= 3 && level % 8 === 1;
  const jelly = version >= 6 ? jellyStage
    ? witnessedJelly(board, refillState, palette, weights, blankSpecials(size), proof.witness, seed)
    : blankJelly(size) : null;
  const jellyTotal = jelly ? jellyCount(jelly) : 0;
  if (jellyStage && jellyTotal) {
    const scoreGoal = goals.objectives.find((goal) => goal.type === 'score');
    goals = { profile: 'clear-jelly', objectives: [...(scoreGoal ? [scoreGoal] : []), { type: 'clear-jelly', target: jellyTotal }] };
  }
  // V6 blockers occupy a stage of their own (never with shields). Their overlay never
  // changes gems, so the witness and score are the v5 witness and score.
  // Classic only (plan M5): daily, timed and endless never receive blockers.
  const blockerStage = version >= 6 && !shieldStage && !lockedGemStage && !jellyStage && mode === 'classic' && level >= 3 && level % 8 === 2;
  const blockers = version >= 6 ? blockerStage
    ? witnessedBlockers(board, refillState, palette, weights, blankSpecials(size), proof.witness, seed)
    : blankBlockers(size) : null;
  const blockersTotal = blockers ? blockerCount(blockers) : 0;
  if (blockerStage && blockersTotal) {
    const scoreGoal = goals.objectives.find((goal) => goal.type === 'score');
    goals = { profile: 'clear-blockers', objectives: [...(scoreGoal ? [scoreGoal] : []), { type: 'clear-blockers', target: blockersTotal }] };
  }
  // V6 chocolate occupies its own stage (never with shields, blockers, locked gems, or jelly).
  // Chocolate spreads one cell per accepted move to a lowest eligible neighbour, cap 8.
  // Classic only: daily, timed and endless never receive chocolate.
  const chocolateStage = version >= 6 && !shieldStage && !lockedGemStage && !jellyStage && !blockerStage && mode === 'classic' && level >= 3 && level % 8 === 3;
  const chocolate = version >= 6 ? chocolateStage
    ? witnessedChocolate(board, refillState, palette, weights, blankSpecials(size), proof.witness, seed)
    : blankChocolate(size) : null;
  const chocolateTotal = chocolate ? chocolateCount(chocolate) : 0;
  if (chocolateStage && chocolateTotal) {
    const scoreGoal = goals.objectives.find((goal) => goal.type === 'score');
    goals = { profile: 'clear-chocolate', objectives: [...(scoreGoal ? [scoreGoal] : []), { type: 'clear-chocolate', target: chocolateTotal }] };
  }
  // V6 liquorice occupies its own stage (never with other v6 obstacles). Liquorice locks
  // block swaps involving their cell until an adjacent match clears them, cap 6.
  // Classic only: daily, timed and endless never receive liquorice.
  const liquoriceStage = version >= 6 && !shieldStage && !lockedGemStage && !jellyStage && !blockerStage && !chocolateStage && mode === 'classic' && level >= 3 && level % 8 === 4;
  const liquorice = version >= 6 ? liquoriceStage
    ? witnessedLiquorice(board, refillState, palette, weights, blankSpecials(size), proof.witness, seed)
    : blankLiquorice(size) : null;
  const liquoriceTotal = liquorice ? liquoriceCount(liquorice) : 0;
  if (liquoriceStage && liquoriceTotal) {
    const scoreGoal = goals.objectives.find((goal) => goal.type === 'score');
    goals = { profile: 'clear-liquorice', objectives: [...(scoreGoal ? [scoreGoal] : []), { type: 'clear-liquorice', target: liquoriceTotal }] };
  }
  // V6 marmalade occupies its own stage (never with other v6 obstacles). Marmalade is a
  // single-layer sticky substance cleared by matches over its cell, cap 5.
  // Classic only: daily, timed and endless never receive marmalade.
  const marmaladeStage = version >= 6 && !shieldStage && !lockedGemStage && !jellyStage && !blockerStage && !chocolateStage && !liquoriceStage && mode === 'classic' && level >= 3 && level % 8 === 5;
  const marmalade = version >= 6 ? marmaladeStage
    ? witnessedMarmalade(board, refillState, palette, weights, blankSpecials(size), proof.witness, seed)
    : blankMarmalade(size) : null;
  const marmaladeTotal = marmalade ? marmaladeCount(marmalade) : 0;
  if (marmaladeStage && marmaladeTotal) {
    const scoreGoal = goals.objectives.find((goal) => goal.type === 'score');
    goals = { profile: 'clear-marmalade', objectives: [...(scoreGoal ? [scoreGoal] : []), { type: 'clear-marmalade', target: marmaladeTotal }] };
  }
  // V6 frosting occupies its own stage (never with other v6 obstacles). Frosting is a
  // layered obstacle (1-3 layers per cell) consumed one layer per clear, cap 6.
  // Classic only: daily, timed and endless never receive frosting.
  const frostingStage = version >= 6 && !shieldStage && !lockedGemStage && !jellyStage && !blockerStage && !chocolateStage && !liquoriceStage && !marmaladeStage && mode === 'classic' && level >= 3 && level % 8 === 6;
  const frosting = version >= 6 ? frostingStage
    ? witnessedFrosting(board, refillState, palette, weights, blankSpecials(size), proof.witness, seed)
    : blankFrosting(size) : null;
  const frostingTotal = frosting ? frostingCount(frosting) : 0;
  if (frostingStage && frostingTotal) {
    const scoreGoal = goals.objectives.find((goal) => goal.type === 'score');
    goals = { profile: 'clear-frosting', objectives: [...(scoreGoal ? [scoreGoal] : []), { type: 'clear-frosting', target: frostingTotal }] };
  }
  if (version >= 4 && !objectiveStatus({ generatorVersion: version, gemTypes: palette, boardSize: size, shields, blockers, lockedGems, jelly, chocolate, liquorice, marmalade, frosting, objectives: goals.objectives }, proof.score,
    { collected: proof.collected,
      ...(version >= 5 ? { shieldsCleared: shieldsTotal } : {}),
      ...(version >= 6 && blockersTotal > 0 ? { blockersCleared: blockersTotal } : {}),
      ...(version >= 6 && lockedTotal > 0 ? { lockedCleared: lockedTotal } : {}),
      ...(version >= 6 && jellyTotal > 0 ? { jellyCleared: jellyTotal } : {}),
      ...(version >= 6 && chocolateTotal > 0 ? { chocolateCleared: chocolateTotal } : {}),
      ...(version >= 6 && liquoriceTotal > 0 ? { liquoriceCleared: liquoriceTotal } : {}),
      ...(version >= 6 && marmaladeTotal > 0 ? { marmaladeCleared: marmaladeTotal } : {}),
      ...(version >= 6 && frostingTotal > 0 ? { frostingCleared: frostingTotal } : {}) }).complete) throw new Error('objective_quality_failed');
  return {
    id: `v${version}-${mode}-${level}-${context.localDate}-${seed.toString(16)}`,
    generatorVersion: version,
    ...(version >= 3 ? { specials: blankSpecials(size) } : {}),
    ...(version >= 5 ? { shields } : {}),
    ...(version >= 6 ? { blockers } : {}),
    ...(version >= 6 ? { lockedGems } : {}),
    ...(version >= 6 ? { jelly } : {}),
    ...(version >= 6 ? { chocolate } : {}),
    ...(version >= 6 ? { liquorice } : {}),
    ...(version >= 6 ? { marmalade } : {}),
    ...(version >= 6 ? { frosting } : {}),
    environmentKey: environment.key,
    level,
    mode,
    isDaily: mode === 'daily',
    isBoss,
    seed,
    refillState,
    boardSize: size,
    board,
    gemTypes: palette,
    gemWeights: weights,
    targetScore,
    moves: mode === 'timed' ? 999 : mode === 'endless' ? Number.MAX_SAFE_INTEGER : moveBudget,
    timeLimit: mode === 'timed' ? 60 : 0,
    objectives: goals.objectives,
    ...(version >= 4 ? { objectiveProfile: goals.profile } : {}),
    difficulty: isBoss ? 'boss' : ['gentle', 'steady', 'steady', 'challenging', 'challenging'][cycle],
    theme,
    context: { ...context },
    quality: {
      initialMatches: 0,
      legalOpeningMoves: lockedGems ? legalSwapsExcludingLocks(board, lockedGems).length : legalSwaps(board).length,
      verifiedWithoutBoosters: true,
      verifiedMoves: moveBudget,
      verifiedScore: proof.score,
      ...(version >= 4 ? { verifiedCollected: proof.collected, verifiedObjectives: true } : {}),
      ...(version >= 5 ? { verifiedShields: shieldsTotal } : {}),
      ...(version >= 6 ? { verifiedBlockers: blockersTotal } : {}),
      ...(version >= 6 ? { verifiedLockedGems: lockedTotal } : {}),
      ...(version >= 6 ? { verifiedJelly: jellyTotal } : {}),
      ...(version >= 6 ? { verifiedChocolate: chocolateTotal } : {}),
      ...(version >= 6 ? { verifiedLiquorice: liquoriceTotal } : {}),
      ...(version >= 6 ? { verifiedMarmalade: marmaladeTotal } : {}),
      ...(version >= 6 ? { verifiedFrosting: frostingTotal } : {}),
    },
  };
}


/** Use the frozen definition's rules, never today's generator version, during an active attempt. */
export function levelActions(definition, board = definition.board, specials = definition.specials, progress, score = 0, shields = definition.shields, refillState = definition.refillState, blockers = definition.blockers, lockedGems = definition.lockedGems, jelly = definition.jelly, chocolate = definition.chocolate, liquorice = definition.liquorice, marmalade = definition.marmalade, frosting = definition.frosting) {
  if (definition.generatorVersion >= 4) return objectiveActions(definition, board, specials, progress, score, shields, refillState, blockers, lockedGems, jelly, chocolate, liquorice, marmalade, frosting);
  return definition.generatorVersion >= 3 ? specialActions(board, specials) : legalSwaps(board);
}

export function simulateLevelMove(definition, state, cells, visualTrace = false) {
  if (definition.generatorVersion >= 4) return simulateObjectiveMove(definition, state, cells, visualTrace);
  const { gemTypes, gemWeights } = definition;
  return definition.generatorVersion >= 3
    ? simulateSpecialMove(state.board, state.refillState, gemTypes, gemWeights, cells, state.specials, false, visualTrace)
    : simulateMove(state.board, state.refillState, gemTypes, gemWeights, cells);
}

export function certifyLevel(definition) {
  if (definition.generatorVersion >= 4) return certifyObjectiveLevel(definition);
  const { board, refillState, gemTypes, gemWeights, moves } = definition;
  // Timed/endless are certified with the bounded quality budget, not infinity/999 moves.
  const budget = definition.quality?.verifiedMoves || Math.min(30, moves);
  return definition.generatorVersion >= 3
    ? certifySpecialBoard(board, refillState, gemTypes, gemWeights, budget, definition.specials)
    : certifyBoard(board, refillState, gemTypes, gemWeights, budget);
}
