/**
 * Player Segmentation Service
 *
 * Segments real players (from their economy data) into retention-relevant cohorts:
 *  - New players (D0-D7)
 *  - Regular players (active in last 7 days)
 *  - At-risk / churn risk (inactive 3-14 days)
 *  - Churned (inactive 15+ days)
 *  - Spenders (lifetime spend > $0)
 *  - Whales (top 5% by spend)
 *  - Free players (never spent)
 *  - High engagement (5+ sessions in last 7 days)
 *  - Low engagement (1-2 sessions in last 7 days)
 *
 * These segments power targeted push notifications, win-back offers, and
 * retention interventions. All segmentation is computed from the player's
 * economy data, not simulated data.
 */

import { Logger } from '../../core/logger/index.js';

const logger = new Logger('PlayerSegmentationService');

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Segment a single player based on their economy data and context.
 * Returns an array of segment IDs the player belongs to.
 */
export function segmentPlayer(playerId, economy, context = {}) {
  const segments = [];
  const nowMs = context.nowMs ?? Date.now();

  const stats = economy.statistics || {};
  const social = economy.social || {};
  const currencies = economy.currencies || {};
  const dailyRewards = economy.dailyRewards || {};
  const subscription = economy.subscription || {};

  const lastPlayed = stats.lastPlayed ? new Date(stats.lastPlayed).getTime() : 0;
  const createdAt = economy.createdAt ? new Date(economy.createdAt).getTime() : nowMs;
  const daysSinceCreated = Math.floor((nowMs - createdAt) / DAY_MS);
  const daysInactive = lastPlayed > 0 ? Math.floor((nowMs - lastPlayed) / DAY_MS) : Infinity;
  const streak = dailyRewards.streak || 0;
  const totalSpent = stats.totalSpent || 0;
  const gamesPlayed = stats.gamesPlayed || 0;
  const levelsCompleted = stats.levelsCompleted || 0;

  // --- Tenure segments ---
  if (daysSinceCreated <= 7) segments.push('new_player');
  if (daysSinceCreated > 7 && daysSinceCreated <= 30) segments.push('early_player');
  if (daysSinceCreated > 30) segments.push('veteran_player');

  // --- Activity segments ---
  if (daysInactive <= 1) segments.push('active_today');
  if (daysInactive <= 7) segments.push('active_this_week');
  if (daysInactive > 7 && daysInactive <= 14) segments.push('at_risk');
  if (daysInactive > 14 && daysInactive <= 30) segments.push('churn_risk');
  if (daysInactive > 30) segments.push('churned');

  // --- Engagement segments ---
  const sessionsPerWeek = gamesPlayed > 0 ? Math.min(gamesPlayed / Math.max(daysSinceCreated, 1) * 7, 99) : 0;
  if (sessionsPerWeek >= 5) segments.push('high_engagement');
  if (sessionsPerWeek > 0 && sessionsPerWeek < 3) segments.push('low_engagement');

  // --- Spending segments ---
  if (totalSpent > 0) segments.push('spender');
  if (totalSpent === 0) segments.push('free_player');
  if (subscription.active) segments.push('subscriber');

  // --- Streak segments ---
  if (streak >= 7) segments.push('strong_streak');
  if (streak >= 3 && streak < 7) segments.push('building_streak');
  if (streak === 0 && daysInactive > 1) segments.push('streak_broken');

  // --- Level segments ---
  if (levelsCompleted < 5) segments.push('early_game');
  if (levelsCompleted >= 5 && levelsCompleted < 50) segments.push('mid_game');
  if (levelsCompleted >= 50) segments.push('late_game');

  // --- Social segments ---
  const friendCount = social.friends ? social.friends.length : 0;
  if (friendCount >= 5) segments.push('social_player');
  if (friendCount === 0) segments.push('solo_player');

  return segments;
}

/**
 * Segment all players from a map of playerId -> economy.
 * Returns { segments: Map<segmentId, Set<playerId>>, playerSegments: Map<playerId, Set<segmentId>> }.
 */
export function segmentAllPlayers(playerEconomies, context = {}) {
  const segments = new Map();
  const playerSegments = new Map();

  for (const [playerId, economy] of playerEconomies) {
    const playerSegmentList = segmentPlayer(playerId, economy, context);
    playerSegments.set(playerId, new Set(playerSegmentList));

    for (const segmentId of playerSegmentList) {
      if (!segments.has(segmentId)) segments.set(segmentId, new Set());
      segments.get(segmentId).add(playerId);
    }
  }

  return { segments, playerSegments };
}

/**
 * Get players who are at risk of churning (inactive 7-14 days, previously active).
 */
export function getChurnRiskPlayers(playerEconomies, context = {}) {
  const nowMs = context.nowMs ?? Date.now();
  const atRisk = [];

  for (const [playerId, economy] of playerEconomies) {
    const stats = economy.statistics || {};
    const dailyRewards = economy.dailyRewards || {};
    const lastPlayed = stats.lastPlayed ? new Date(stats.lastPlayed).getTime() : 0;
    const daysInactive = lastPlayed > 0 ? Math.floor((nowMs - lastPlayed) / DAY_MS) : Infinity;
    const streak = dailyRewards.streak || 0;
    const totalSpent = stats.totalSpent || 0;
    const levelsCompleted = stats.levelsCompleted || 0;

    if (daysInactive > 7 && daysInactive <= 14) {
      atRisk.push({
        playerId,
        daysInactive,
        streak,
        totalSpent,
        levelsCompleted,
        segment: totalSpent > 0 ? 'paying_churn_risk' : 'free_churn_risk',
        priority: totalSpent > 100 ? 'high' : streak >= 7 ? 'high' : 'medium',
      });
    }
  }

  // Sort by priority: high first, then by daysInactive (longer = more urgent)
  atRisk.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.daysInactive - a.daysInactive;
  });

  return atRisk;
}

/**
 * Get players who have churned (inactive 15+ days).
 */
export function getChurnedPlayers(playerEconomies, context = {}) {
  const nowMs = context.nowMs ?? Date.now();
  const churned = [];

  for (const [playerId, economy] of playerEconomies) {
    const stats = economy.statistics || {};
    const dailyRewards = economy.dailyRewards || {};
    const lastPlayed = stats.lastPlayed ? new Date(stats.lastPlayed).getTime() : 0;
    const daysInactive = lastPlayed > 0 ? Math.floor((nowMs - lastPlayed) / DAY_MS) : Infinity;

    if (daysInactive > 14) {
      churned.push({
        playerId,
        daysInactive,
        totalSpent: stats.totalSpent || 0,
        levelsCompleted: stats.levelsCompleted || 0,
        streak: dailyRewards.streak || 0,
      });
    }
  }

  churned.sort((a, b) => b.daysInactive - a.daysInactive);
  return churned;
}

/**
 * Get high-value players who are at risk (spenders with churn probability).
 */
export function getHighValueAtRiskPlayers(playerEconomies, context = {}) {
  const nowMs = context.nowMs ?? Date.now();
  const highValue = [];

  for (const [playerId, economy] of playerEconomies) {
    const stats = economy.statistics || {};
    const dailyRewards = economy.dailyRewards || {};
    const lastPlayed = stats.lastPlayed ? new Date(stats.lastPlayed).getTime() : 0;
    const daysInactive = lastPlayed > 0 ? Math.floor((nowMs - lastPlayed) / DAY_MS) : Infinity;
    const totalSpent = stats.totalSpent || 0;
    const streak = dailyRewards.streak || 0;

    if (totalSpent > 50 && daysInactive > 3 && daysInactive <= 30) {
      highValue.push({
        playerId,
        daysInactive,
        totalSpent,
        streak,
        churnRisk: daysInactive > 14 ? 'high' : 'medium',
      });
    }
  }

  highValue.sort((a, b) => b.totalSpent - a.totalSpent);
  return highValue;
}

export default {
  segmentPlayer,
  segmentAllPlayers,
  getChurnRiskPlayers,
  getChurnedPlayers,
  getHighValueAtRiskPlayers,
};
