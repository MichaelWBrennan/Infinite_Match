/**
 * Daily quests system.
 *
 * Provides daily quests that players can complete for rewards. Quests reset
 * each UTC day. Progress is tracked per player and quests can be claimed once
 * per day.
 *
 * Quest types:
 *   - levels_played: Complete N levels
 *   - levels_won: Win N levels
 *   - stars_earned: Earn N stars total
 *   - booster_used: Use N boosters
 *   - coins_earned: Earn N coins from wins
 *
 * All tracking happens server-side; the client only reports completions.
 */

import { Logger } from '../../../core/logger/index.js';

const logger = new Logger('DailyQuests');

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Start of the current UTC day. */
export function todayStartMs(nowMs = Date.now()) {
  const d = new Date(nowMs);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

/** Start of the next UTC day. */
export function tomorrowStartMs(nowMs = Date.now()) {
  return todayStartMs(nowMs) + DAY_MS;
}

/** Default daily quest definitions. */
const DEFAULT_QUESTS = Object.freeze([
  {
    id: 'daily_play_3',
    label: 'Play 3 levels',
    type: 'levels_played',
    target: 3,
    reward: { coins: 200, xp: 100 },
    description: 'Complete 3 levels today',
  },
  {
    id: 'daily_win_2',
    label: 'Win 2 levels',
    type: 'levels_won',
    target: 2,
    reward: { coins: 300, xp: 150 },
    description: 'Win 2 levels today',
  },
  {
    id: 'daily_stars_5',
    label: 'Earn 5 stars',
    type: 'stars_earned',
    target: 5,
    reward: { coins: 500, xp: 250 },
    description: 'Earn 5 stars from level wins today',
  },
  {
    id: 'daily_booster_1',
    label: 'Use a booster',
    type: 'booster_used',
    target: 1,
    reward: { coins: 150, xp: 75 },
    description: 'Use 1 booster in a level today',
  },
]);

/**
 * Returns all quest definitions.
 */
export function getQuestDefinitions() {
  return DEFAULT_QUESTS;
}

/**
 * Returns the quest definition for an id, or null.
 */
export function getQuestDefinition(questId) {
  return DEFAULT_QUESTS.find((q) => q.id === questId) || null;
}

/**
 * Initializes a player's daily quests state for today.
 * Returns { quests: [], dayStartMs }.
 */
export function initializeDailyQuests(existing = null, nowMs = Date.now()) {
  const dayStart = todayStartMs(nowMs);

  // If existing state is from today, keep it
  if (existing && existing.dayStartMs === dayStart) {
    return existing;
  }

  // Otherwise, start fresh for today
  const quests = DEFAULT_QUESTS.map((q) => ({
    id: q.id,
    type: q.type,
    target: q.target,
    progress: 0,
    claimed: false,
    reward: q.reward,
  }));

  return { quests, dayStartMs: dayStart };
}

/**
 * Returns true if the player can claim the quest (progress >= target and not claimed).
 */
export function canClaimQuest(quest) {
  return quest.progress >= quest.target && !quest.claimed;
}

/**
 * Updates quest progress for a player. Returns the updated quests array.
 * `event` is one of: 'level_played', 'level_won', 'stars_earned', 'booster_used', 'coins_earned'.
 * `amount` is the amount to add (e.g., stars earned, coins earned).
 */
export function updateQuestProgress(quests, event, amount = 1, nowMs = Date.now()) {
  const dayStart = todayStartMs(nowMs);

  // Reset if it's a new day
  let currentQuests = quests;
  if (!quests || quests.dayStartMs !== dayStart) {
    currentQuests = initializeDailyQuests(quests, nowMs);
  }

  const updatedQuests = { ...currentQuests };
  updatedQuests.quests = currentQuests.quests.map((q) => {
    if (q.claimed) return q;

    let progress = q.progress;
    switch (q.type) {
      case 'levels_played':
        if (event === 'level_played') progress = Math.min(q.target, q.progress + amount);
        break;
      case 'levels_won':
        if (event === 'level_won') progress = Math.min(q.target, q.progress + amount);
        break;
      case 'stars_earned':
        if (event === 'stars_earned') progress = Math.min(q.target, q.progress + amount);
        break;
      case 'booster_used':
        if (event === 'booster_used') progress = Math.min(q.target, q.progress + amount);
        break;
      case 'coins_earned':
        if (event === 'coins_earned') progress = Math.min(q.target, q.progress + amount);
        break;
    }

    return { ...q, progress };
  });

  return updatedQuests;
}

/**
 * Claims a quest reward. Returns { success, reward } or { success: false, reason }.
 */
export function claimQuest(quests, questId, nowMs = Date.now()) {
  const dayStart = todayStartMs(nowMs);

  let currentQuests = quests;
  if (!quests || quests.dayStartMs !== dayStart) {
    currentQuests = initializeDailyQuests(quests, nowMs);
  }

  const quest = currentQuests.quests.find((q) => q.id === questId);
  if (!quest) {
    return { success: false, reason: 'quest_not_found' };
  }

  if (quest.claimed) {
    return { success: false, reason: 'already_claimed' };
  }

  if (quest.progress < quest.target) {
    return { success: false, reason: 'quest_not_complete' };
  }

  const updatedQuests = { ...currentQuests };
  updatedQuests.quests = currentQuests.quests.map((q) =>
    q.id === questId ? { ...q, claimed: true } : q
  );

  return {
    success: true,
    reward: quest.reward,
    quests: updatedQuests,
  };
}

/**
 * Returns quests that are claimable (complete but not claimed).
 */
export function getClaimableQuests(quests) {
  if (!quests) return [];
  return quests.quests.filter((q) => canClaimQuest(q));
}

export default {
  getQuestDefinitions,
  getQuestDefinition,
  initializeDailyQuests,
  updateQuestProgress,
  claimQuest,
  getClaimableQuests,
  todayStartMs,
  tomorrowStartMs,
};
