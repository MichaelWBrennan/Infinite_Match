/**
 * Win-Back Scheduler
 *
 * Automated cron-based system that identifies churned and at-risk players and
 * sends them win-back push notifications with personalized offers.
 *
 * Runs every hour and:
 *  1. Queries all player economies for at-risk (3-14 days offline) and churned (15+ days) players
 *  2. Sends comeback push notifications with cooldown protection
 *  3. Offers streak repair, bonus coins, or limited-time offers based on player segment
 *  4. Tracks win-back campaign results for attribution
 */

import { Logger } from '../../core/logger/index.js';
import { notifyPlayers } from '../push/push-service.js';
import { evaluateTriggers } from '../push/push-triggers.js';
import { getChurnRiskPlayers, getChurnedPlayers, getHighValueAtRiskPlayers } from './player-segmentation-service.js';

const logger = new Logger('WinBackScheduler');

const DAY_MS = 24 * 60 * 60 * 1000;

// Win-back offer tiers based on player value and churn risk
const WINBACK_OFFERS = {
  free_churn_risk: {
    title: "We miss you!",
    body: "It's been {days} days. Come back and claim {coins} bonus coins!",
    coins: 200,
    cooldownDays: 3,
  },
  paying_churn_risk: {
    title: "Welcome back!",
    body: "It's been {days} days. Here's {coins} coins and a free streak repair.",
    coins: 500,
    cooldownDays: 3,
  },
  high_value_churn: {
    title: "Exclusive offer just for you",
    body: "We've saved {coins} coins and a special gift for your return.",
    coins: 1000,
    cooldownDays: 3,
  },
  streak_broken: {
    title: "Repair your streak!",
    body: "Your {day}-day streak is waiting. Log in today to restore it.",
    coins: 100,
    cooldownDays: 3,
  },
};

class WinBackScheduler {
  constructor(accountEconomy, playerSegmentationService) {
    this.accountEconomy = accountEconomy;
    this.playerSegmentationService = playerSegmentationService;

    // Win-back history: playerId -> { lastSentAt, offerType, sentCount }
    this.winBackHistory = new Map();

    // Cron job handle
    this.cronJob = null;

    // Whether the scheduler is running
    this.isRunning = false;
  }

  /**
   * Start the win-back scheduler. Runs every hour by default.
   */
  start({ intervalMs = 60 * 60 * 1000 } = {}) {
    if (this.isRunning) return;
    this.isRunning = true;

    this.cronJob = setInterval(async () => {
      try {
        await this.runWinBackCycle();
      } catch (error) {
        logger.error('Win-back cycle failed', { error: error.message });
      }
    }, intervalMs);

    logger.info('Win-back scheduler started', { intervalMs });
  }

  /**
   * Stop the win-back scheduler.
   */
  stop() {
    if (this.cronJob) {
      clearInterval(this.cronJob);
      this.cronJob = null;
    }
    this.isRunning = false;
    logger.info('Win-back scheduler stopped');
  }

  /**
   * Run a single win-back cycle: find at-risk/churned players and send notifications.
   */
  async runWinBackCycle() {
    const nowMs = Date.now();

    // Get all player economies
    const playerEconomies = await this.accountEconomy.getAllPlayerEconomies();

    if (!playerEconomies || playerEconomies.size === 0) {
      logger.debug('No player economies found for win-back cycle');
      return { sent: 0, atRisk: 0, churned: 0 };
    }

    // Segment players
    const { segments } = this.playerSegmentationService.segmentAllPlayers(playerEconomies, { nowMs });

    // Get at-risk and churned players
    const atRiskPlayers = getChurnRiskPlayers(playerEconomies, { nowMs });
    const churnedPlayers = getChurnedPlayers(playerEconomies, { nowMs });
    const highValueAtRisk = getHighValueAtRiskPlayers(playerEconomies, { nowMs });

    const toNotify = [];

    // Process at-risk players
    for (const player of atRiskPlayers) {
      const isHighValue = highValueAtRisk.some((hv) => hv.playerId === player.playerId);
      const offerType = isHighValue ? 'high_value_churn' : player.segment === 'paying_churn_risk' ? 'paying_churn_risk' : 'free_churn_risk';

      if (this.canSendWinBack(player.playerId, offerType, nowMs)) {
        toNotify.push({ playerId: player.playerId, offerType, days: player.daysInactive, coins: WINBACK_OFFERS[offerType].coins });
      }
    }

    // Process churned players (lower priority than at-risk)
    for (const player of churnedPlayers) {
      const isHighValue = player.totalSpent > 100;
      const offerType = isHighValue ? 'high_value_churn' : 'free_churn_risk';

      if (this.canSendWinBack(player.playerId, offerType, nowMs)) {
        toNotify.push({ playerId: player.playerId, offerType, days: player.daysInactive, coins: WINBACK_OFFERS[offerType].coins });
      }
    }

    // Process streak-broken players
    const streakBrokenPlayers = Array.from(playerEconomies.entries())
      .filter(([pid, econ]) => {
        const dr = econ.dailyRewards || {};
        return dr.streak === 0 && (econ.statistics?.lastPlayed ? Math.floor((nowMs - new Date(econ.statistics.lastPlayed).getTime()) / DAY_MS) : Infinity) > 1;
      })
      .map(([pid]) => ({ playerId: pid }));

    for (const player of streakBrokenPlayers.slice(0, 50)) { // Cap to avoid spam
      if (this.canSendWinBack(player.playerId, 'streak_broken', nowMs)) {
        toNotify.push({ playerId: player.playerId, offerType: 'streak_broken', days: 0, coins: WINBACK_OFFERS.streak_broken.coins });
      }
    }

    // Send notifications (batch for efficiency)
    let sent = 0;
    const userIds = toNotify.map((n) => n.playerId);

    // Group by offer type for personalized messages
    const byOffer = new Map();
    for (const n of toNotify) {
      if (!byOffer.has(n.offerType)) byOffer.set(n.offerType, []);
      byOffer.get(n.offerType).push(n);
    }

    for (const [offerType, players] of byOffer.entries()) {
      const offer = WINBACK_OFFERS[offerType];
      const titles = [];
      const bodies = [];
      const playerIds = [];

      for (const p of players) {
        titles.push(offer.title.replace('{days}', p.days).replace('{coins}', p.coins));
        bodies.push(offer.body.replace('{days}', p.days).replace('{coins}', p.coins));
        playerIds.push(p.playerId);
      }

      try {
        const result = await notifyPlayers({
          userIds: playerIds,
          title: titles.join(' | '),
          body: bodies.join(' | '),
          data: { type: 'winback', offerType, coins: offer.coins },
        });
        sent += result.successCount;

        // Record win-back history
        for (const p of players) {
          this.winBackHistory.set(p.playerId, {
            lastSentAt: nowMs,
            offerType,
            sentCount: (this.winBackHistory.get(p.playerId)?.sentCount || 0) + 1,
          });
        }

        logger.info('Win-back notifications sent', { offerType, count: players.length, successCount: result.successCount });
      } catch (error) {
        logger.error('Failed to send win-back notifications', { offerType, error: error.message });
      }
    }

    return {
      sent,
      atRisk: atRiskPlayers.length,
      churned: churnedPlayers.length,
      highValueAtRisk: highValueAtRisk.length,
      notificationsByOffer: Array.from(byOffer.entries()).map(([type, players]) => ({ type, count: players.length })),
    };
  }

  /**
   * Check if a win-back notification can be sent to a player (cooldown protection).
   */
  canSendWinBack(playerId, offerType, nowMs = Date.now()) {
    const history = this.winBackHistory.get(playerId);
    if (!history) return true;

    const offer = WINBACK_OFFERS[offerType];
    const cooldownMs = offer.cooldownDays * DAY_MS;

    // Don't send the same offer within cooldown
    if (history.offerType === offerType && nowMs - history.lastSentAt < cooldownMs) {
      return false;
    }

    // Don't send any win-back within 24 hours regardless of type
    if (nowMs - history.lastSentAt < DAY_MS) {
      return false;
    }

    return true;
  }

  /**
   * Record that a win-back offer was claimed/converted.
   */
  recordConversion(playerId, offerType, reward) {
    const history = this.winBackHistory.get(playerId) || {};
    history.lastConvertedAt = Date.now();
    history.lastConvertedOffer = offerType;
    history.conversionReward = reward;
    this.winBackHistory.set(playerId, history);

    logger.info('Win-back conversion recorded', { playerId, offerType, reward });
  }

  /**
   * Get win-back statistics.
   */
  getStats() {
    const totalSent = Array.from(this.winBackHistory.values()).reduce((sum, h) => sum + (h.sentCount || 0), 0);
    const conversions = Array.from(this.winBackHistory.values()).filter((h) => h.lastConvertedAt).length;

    return {
      totalPlayersContacted: this.winBackHistory.size,
      totalNotificationsSent: totalSent,
      totalConversions: conversions,
      conversionRate: this.winBackHistory.size > 0 ? (conversions / this.winBackHistory.size) * 100 : 0,
      isRunning: this.isRunning,
    };
  }
}

export default WinBackScheduler;

export { WinBackScheduler, WINBACK_OFFERS };
