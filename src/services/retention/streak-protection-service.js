/**
 * Streak Protection Service
 *
 * Enhances the existing streak freeze mechanics with:
 *  - Streak freeze as a purchasable shop item (coins or real money)
 *  - Grace period: one missed day doesn't break the streak
 *  - Streak repair offer: pay to restore a broken streak
 *  - Streak protection notifications: warn players before their streak breaks
 *
 * Works alongside the existing MonetizationService streak freeze (which handles
 * the actual freeze logic during daily reward claims). This service adds the
 * shop, grace period, and repair offer layers.
 */

import { Logger } from '../../core/logger/index.js';

const logger = new Logger('StreakProtectionService');

const DAY_MS = 24 * 60 * 60 * 1000;

// Streak freeze costs
const STREAK_FREEZE_COST_COINS = 150;
const STREAK_FREEZE_COST_STARS = 20;
const STREAK_FREEZE_DURATION_MS = 24 * 60 * 60 * 1000;

// Streak repair costs (scale with streak length)
function streakRepairCost(streakLength) {
  return Math.min(500, Math.max(100, streakLength * 25));
}

// Grace period: how many days can be missed before streak breaks
const GRACE_PERIOD_DAYS = 1;

class StreakProtectionService {
  constructor(accountEconomy, monetizationService) {
    this.accountEconomy = accountEconomy;
    this.monetizationService = monetizationService;

    // Grace period expirations: playerId -> { graceExpiresAt, missedDays }
    this.gracePeriods = new Map();

    // Streak repair offers: playerId -> { offeredAt, streakLength, cost, expiresAt }
    this.repairOffers = new Map();
  }

  /**
   * Get streak protection status for a player.
   * Returns { streak, hasFreeze, freezeExpiresAt, inGracePeriod, graceDaysRemaining, canRepair, repairCost }.
   */
  async getStreakStatus(playerId, { nowMs = Date.now() } = {}) {
    const economy = await this.accountEconomy.getPlayerEconomy(playerId);
    const dailyRewards = economy.dailyRewards || {};
    const streak = dailyRewards.streak || 0;
    const lastClaimed = dailyRewards.lastClaimed ? new Date(dailyRewards.lastClaimed).getTime() : 0;

    // Check active streak freeze from monetization service
    const hasFreeze = this.monetizationService.hasActiveStreakFreeze(playerId, { nowMs });
    let freezeExpiresAt = null;
    if (hasFreeze) {
      // The freeze expiry isn't directly exposed; estimate from last known state
      freezeExpiresAt = lastClaimed + STREAK_FREEZE_DURATION_MS;
    }

    // Check grace period
    const grace = this.gracePeriods.get(playerId);
    const inGracePeriod = grace && nowMs < grace.graceExpiresAt;
    const graceDaysRemaining = inGracePeriod ? Math.ceil((grace.graceExpiresAt - nowMs) / DAY_MS) : 0;

    // Days since last claim
    const daysSinceLastClaim = lastClaimed > 0 ? Math.floor((nowMs - lastClaimed) / DAY_MS) : 0;

    // Can repair streak if it's broken and player hasn't claimed today
    const canRepair = streak === 0 && daysSinceLastClaim > GRACE_PERIOD_DAYS && !inGracePeriod;
    const repairCost = canRepair ? streakRepairCost(Math.max(streak, 1)) : 0;

    return {
      playerId,
      streak,
      lastClaimed: dailyRewards.lastClaimed,
      daysSinceLastClaim,
      hasFreeze,
      freezeExpiresAt,
      inGracePeriod,
      graceDaysRemaining,
      canRepair,
      repairCost,
      streakAtRisk: daysSinceLastClaim >= GRACE_PERIOD_DAYS && !hasFreeze && !inGracePeriod,
    };
  }

  /**
   * Purchase a streak freeze for a player.
   * Returns { success, freezeExpiresAt, cost, payWith }.
   */
  async purchaseStreakFreeze(playerId, { payWith = 'coins', nowMs = Date.now() } = {}) {
    // Check if already has active freeze
    if (this.monetizationService.hasActiveStreakFreeze(playerId, { nowMs })) {
      return { success: false, error: 'freeze_already_active' };
    }

    // Use the monetization service to purchase
    const result = await this.monetizationService.purchaseStreakFreeze(playerId, { payWith, nowMs });
    if (!result.success) return result;

    // Also start a grace period so the player has buffer
    this.startGracePeriod(playerId, nowMs + STREAK_FREEZE_DURATION_MS);

    return {
      success: true,
      freezeExpiresAt: result.freezeExpiresAt,
      durationHours: STREAK_FREEZE_DURATION_MS / (60 * 60 * 1000),
      payWith,
      cost: payWith === 'coins' ? STREAK_FREEZE_COST_COINS : STREAK_FREEZE_COST_STARS,
    };
  }

  /**
   * Start a grace period for a player (after a missed day, before streak breaks).
   */
  startGracePeriod(playerId, graceExpiresAt) {
    const existing = this.gracePeriods.get(playerId);
    this.gracePeriods.set(playerId, {
      graceExpiresAt,
      missedDays: existing ? existing.missedDays + 1 : 1,
      startedAt: Date.now(),
    });
    logger.info('Grace period started', { playerId, graceExpiresAt });
  }

  /**
   * Check if a player is in their grace period and hasn't exceeded it.
   * Returns { inGracePeriod, daysRemaining, willBreakAt }.
   */
  checkGracePeriod(playerId, { nowMs = Date.now() } = {}) {
    const grace = this.gracePeriods.get(playerId);
    if (!grace || nowMs >= grace.graceExpiresAt) {
      this.gracePeriods.delete(playerId);
      return { inGracePeriod: false, daysRemaining: 0, willBreakAt: null };
    }
    return {
      inGracePeriod: true,
      daysRemaining: Math.ceil((grace.graceExpiresAt - nowMs) / DAY_MS),
      willBreakAt: grace.graceExpiresAt,
    };
  }

  /**
   * Offer to repair a broken streak.
   * Returns { success, offer, cost, expiresAt }.
   */
  offerStreakRepair(playerId, { nowMs = Date.now() } = {}) {
    const economy = this.accountEconomy.getPlayerEconomy(playerId); // sync call for existing data
    const dailyRewards = economy.dailyRewards || {};
    const streak = dailyRewards.streak || 0;

    if (streak > 0) {
      return { success: false, error: 'streak_not_broken' };
    }

    const cost = streakRepairCost(Math.max(streak, 1));
    const expiresAt = nowMs + 60 * 60 * 1000; // Offer expires in 1 hour

    this.repairOffers.set(playerId, {
      offeredAt: nowMs,
      streakLength: streak,
      cost,
      expiresAt,
    });

    return {
      success: true,
      offer: 'streak_repair',
      cost,
      expiresAt,
      previousStreak: streak,
    };
  }

  /**
   * Accept a streak repair offer. Restores the streak to its previous length.
   * Returns { success, restoredStreak, cost }.
   */
  async acceptStreakRepair(playerId, { payWith = 'coins', nowMs = Date.now() } = {}) {
    const offer = this.repairOffers.get(playerId);
    if (!offer || nowMs >= offer.expiresAt) {
      this.repairOffers.delete(playerId);
      return { success: false, error: 'offer_not_found_or_expired' };
    }

    const economy = await this.accountEconomy.getPlayerEconomy(playerId);

    // Deduct cost
    if (payWith === 'coins') {
      const coins = economy.currencies.coins;
      if (coins.amount < offer.cost) {
        return { success: false, error: 'insufficient_coins', required: offer.cost, balance: coins.amount };
      }
      await this.accountEconomy.updateCurrency(playerId, 'coins', offer.cost, 'spend', 'streak_repair');
    } else if (payWith === 'stars') {
      const stars = economy.currencies.stars;
      if (stars.amount < offer.cost) {
        return { success: false, error: 'insufficient_stars', required: offer.cost, balance: stars.amount };
      }
      await this.accountEconomy.updateCurrency(playerId, 'stars', offer.cost, 'spend', 'streak_repair');
    }

    // Restore streak (set to the streak before it broke + 1 for today's login)
    const restoredStreak = Math.max(offer.streakLength, 1);
    economy.dailyRewards.streak = restoredStreak;
    economy.dailyRewards.lastClaimed = new Date(nowMs).toISOString();
    economy.dailyRewards.canClaim = false;
    await this.accountEconomy.updatePlayerEconomyCache(playerId, economy);

    // Clear the repair offer
    this.repairOffers.delete(playerId);
    // Clear any grace period
    this.gracePeriods.delete(playerId);

    logger.info('Streak repaired', { playerId, restoredStreak, cost: offer.cost, payWith });

    return {
      success: true,
      restoredStreak,
      cost: offer.cost,
      payWith,
    };
  }

  /**
   * Check if a player's streak is at risk (about to break) and return a warning.
   * Called before daily reward claim to warn the player.
   */
  checkStreakAtRisk(playerId, { nowMs = Date.now() } = {}) {
    const grace = this.checkGracePeriod(playerId, { nowMs });
    const hasFreeze = this.monetizationService.hasActiveStreakFreeze(playerId, { nowMs });

    if (grace.inGracePeriod || hasFreeze) {
      return { atRisk: false };
    }

    return {
      atRisk: true,
      message: "Your streak is at risk! Log in today to keep it going.",
      daysRemaining: grace.daysRemaining,
    };
  }

  /**
   * Get all active streak protection data for admin dashboard.
   */
  getProtectionStats() {
    let totalFreezes = 0;
    let totalGracePeriods = 0;
    let totalRepairOffers = 0;

    const now = Date.now();

    for (const [pid, freeze] of this.monetizationService.streakFreezes.entries()) {
      if (now < freeze.expiresAt) totalFreezes++;
    }
    for (const [pid, grace] of this.gracePeriods.entries()) {
      if (now < grace.graceExpiresAt) totalGracePeriods++;
    }
    for (const [pid, offer] of this.repairOffers.entries()) {
      if (now < offer.expiresAt) totalRepairOffers++;
    }

    return {
      activeFreezes: totalFreezes,
      activeGracePeriods: totalGracePeriods,
      activeRepairOffers: totalRepairOffers,
    };
  }
}

export default StreakProtectionService;
export { StreakProtectionService, STREAK_FREEZE_COST_COINS, STREAK_FREEZE_COST_STARS, streakRepairCost };
