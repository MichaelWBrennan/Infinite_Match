/**
 * Onboarding Service - First-Time User Experience (FTUE)
 *
 * Drives D1 retention by guiding new players through their first 3 levels with:
 *  - A guaranteed first win (level 1 is always winnable with a tutorial hint)
 *  - Onboarding quests that reward early progress
 *  - A "first win celebration" that hooks the compulsion loop
 *  - Progressive tutorial hints that fade as the player gains competence
 *
 * All state is stored in the player's economy under `onboarding`.
 */

import { Logger } from '../../core/logger/index.js';

const logger = new Logger('OnboardingService');

/**
 * Onboarding tutorial stages. Each stage unlocks the next when completed.
 */
const TUTORIAL_STAGES = [
  {
    id: 'welcome',
    name: 'Welcome',
    level: 1,
    hint: 'Swap two adjacent gems to make a match of 3 or more.',
    reward: { coins: 100, xp: 50 },
    requiredAction: 'complete_level_1',
  },
  {
    id: 'first_match',
    name: 'Your First Match',
    level: 1,
    hint: 'Try making a match of 4 to earn a special gem!',
    reward: { coins: 150, xp: 75 },
    requiredAction: 'make_special_match',
  },
  {
    id: 'first_win',
    name: 'First Victory',
    level: 2,
    hint: 'Complete the level goal before you run out of moves.',
    reward: { coins: 200, stars: 5, xp: 100 },
    requiredAction: 'win_level_2',
  },
  {
    id: 'daily_login',
    name: 'Daily Rewards',
    level: 3,
    hint: 'Come back tomorrow for your daily login bonus!',
    reward: { coins: 300, stars: 10, xp: 150 },
    requiredAction: 'claim_daily_reward',
  },
];

/**
 * Default onboarding state for a new player.
 */
function defaultOnboardingState() {
  return {
    completed: false,
    currentStage: 0,
    completedStages: [],
    firstWinAt: null,
    tutorialHintsSeen: [],
    onboardingQuestsCompleted: 0,
    totalOnboardingReward: { coins: 0, stars: 0, xp: 0 },
    lastHintAt: null,
  };
}

/**
 * Get (or initialize) the onboarding state for a player.
 */
export function getOnboardingState(economy) {
  if (!economy.onboarding) {
    economy.onboarding = defaultOnboardingState();
  }
  return economy.onboarding;
}

/**
 * Check if a player is still in onboarding (hasn't completed all stages).
 */
export function isOnboardingComplete(onboarding) {
  return onboarding.completed || onboarding.completedStages.length >= TUTORIAL_STAGES.length;
}

/**
 * Get the current tutorial stage for a player, or null if onboarding is complete.
 */
export function getCurrentStage(onboarding) {
  if (isOnboardingComplete(onboarding)) return null;
  const stageIndex = onboarding.currentStage < TUTORIAL_STAGES.length
    ? onboarding.currentStage
    : TUTORIAL_STAGES.length - 1;
  return TUTORIAL_STAGES[stageIndex];
}

/**
 * Get the hint for the current stage, if the player hasn't seen it yet.
 * Returns null if no hint should be shown (already seen or onboarding complete).
 */
export function getTutorialHint(onboarding, nowMs = Date.now()) {
  if (isOnboardingComplete(onboarding)) return null;
  const stage = getCurrentStage(onboarding);
  if (!stage) return null;
  if (onboarding.tutorialHintsSeen.includes(stage.id)) return null;
  return {
    stageId: stage.id,
    hint: stage.hint,
    level: stage.level,
    reward: stage.reward,
  };
}

/**
 * Mark a tutorial hint as seen for the current stage.
 */
export function markHintSeen(onboarding, stageId, nowMs = Date.now()) {
  if (!onboarding.tutorialHintsSeen.includes(stageId)) {
    onboarding.tutorialHintsSeen.push(stageId);
  }
  onboarding.lastHintAt = nowMs;
}

/**
 * Complete a tutorial stage. Awards the stage reward and advances to the next stage.
 * Returns { completed, stage, reward, nextStage, onboardingComplete }.
 */
export async function completeStage(onboarding, stageId, economy, accountEconomy, nowMs = Date.now()) {
  const stage = TUTORIAL_STAGES.find((s) => s.id === stageId);
  if (!stage) throw new Error('unknown_tutorial_stage');
  if (onboarding.completedStages.includes(stageId)) {
    return { completed: false, stage, reward: null, nextStage: null, onboardingComplete: isOnboardingComplete(onboarding) };
  }

  // Mark stage complete
  onboarding.completedStages.push(stageId);
  onboarding.currentStage = Math.min(onboarding.currentStage + 1, TUTORIAL_STAGES.length);

  // Award reward
  const reward = { ...stage.reward };
  if (reward.coins) accountEconomy.applyReward(economy, { type: 'currency', currencyId: 'coins', amount: reward.coins });
  if (reward.stars) accountEconomy.applyReward(economy, { type: 'currency', currencyId: 'stars', amount: reward.stars });
  if (reward.xp) accountEconomy.applyXp(economy, reward.xp, nowMs);

  onboarding.totalOnboardingReward.coins += reward.coins || 0;
  onboarding.totalOnboardingReward.stars += reward.stars || 0;
  onboarding.totalOnboardingReward.xp += reward.xp || 0;

  // Record first win
  if (stage.requiredAction === 'win_level_2') {
    onboarding.firstWinAt = new Date(nowMs).toISOString();
  }

  const nextStage = getCurrentStage(onboarding);
  const onboardingComplete = isOnboardingComplete(onboarding);
  if (onboardingComplete) {
    onboarding.completed = true;
    onboarding.completedAt = new Date(nowMs).toISOString();
  }

  logger.info('Onboarding stage completed', { playerId: economy.playerId, stageId, onboardingComplete });

  return {
    completed: true,
    stage,
    reward,
    nextStage,
    onboardingComplete,
  };
}

/**
 * Get onboarding quests - daily-style quests specific to new players.
 */
export function getOnboardingQuests(onboarding) {
  return [
    {
      id: 'play_first_level',
      name: 'Play Your First Level',
      description: 'Complete level 1 to start your journey.',
      progress: onboarding.completedStages.includes('welcome') ? 1 : 0,
      maxProgress: 1,
      reward: { coins: 100 },
      completed: onboarding.completedStages.includes('welcome'),
    },
    {
      id: 'make_special_match',
      name: 'Make a Special Match',
      description: 'Match 4 gems to create a special gem.',
      progress: onboarding.completedStages.includes('first_match') ? 1 : 0,
      maxProgress: 1,
      reward: { coins: 150 },
      completed: onboarding.completedStages.includes('first_match'),
    },
    {
      id: 'win_two_levels',
      name: 'Win Two Levels',
      description: 'Win levels 1 and 2.',
      progress: onboarding.completedStages.filter((s) => s === 'welcome' || s === 'first_win').length,
      maxProgress: 2,
      reward: { stars: 10 },
      completed: onboarding.completedStages.includes('first_win'),
    },
  ];
}

/**
 * Check if a player qualifies for the "first win guaranteed" boost.
 * Level 1 boards are always certified winnable; this service marks them as tutorial levels.
 */
export function isTutorialLevel(levelNumber) {
  return levelNumber === 1;
}

export default {
  getOnboardingState,
  isOnboardingComplete,
  getCurrentStage,
  getTutorialHint,
  markHintSeen,
  completeStage,
  getOnboardingQuests,
  isTutorialLevel,
  defaultOnboardingState,
  TUTORIAL_STAGES,
};
