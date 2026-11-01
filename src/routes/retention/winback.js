/**
 * Win-Back Routes
 *
 * POST /api/retention/winback/run - Run a win-back cycle (admin)
 * GET /api/retention/winback/stats - Get win-back statistics (admin)
 */

import express from 'express';
import security from '../../core/security/index.js';
import { Logger } from '../../core/logger/index.js';
import { accountEconomy } from '../../services/economy/AccountEconomyService.js';
import { segmentPlayer, getChurnRiskPlayers, getChurnedPlayers, getHighValueAtRiskPlayers } from '../../services/retention/player-segmentation-service.js';
import { notifyPlayers } from '../../services/push/push-service.js';

const router = express.Router();
const logger = new Logger('WinBackRoutes');

// In-memory win-back state per server instance
const winBackHistory = new Map();
let isRunning = false;
let cronJob = null;

const DAY_MS = 24 * 60 * 60 * 1000;

const WINBACK_OFFERS = {
  free_churn_risk: { title: "We miss you!", body: "It's been {days} days. Come back and claim {coins} bonus coins!", coins: 200, cooldownDays: 3 },
  paying_churn_risk: { title: 'Welcome back!', body: "It's been {days} days. Here's {coins} coins and a free streak repair.", coins: 500, cooldownDays: 3 },
  high_value_churn: { title: 'Exclusive offer just for you', body: "We've saved {coins} coins and a special gift for your return.", coins: 1000, cooldownDays: 3 },
  streak_broken: { title: 'Repair your streak!', body: 'Your {day}-day streak is waiting. Log in today to restore it.', coins: 100, cooldownDays: 3 },
};

function canSendWinBack(playerId, offerType, nowMs) {
  const history = winBackHistory.get(playerId);
  if (!history) return true;
  const offer = WINBACK_OFFERS[offerType];
  const cooldownMs = offer.cooldownDays * DAY_MS;
  if (history.offerType === offerType && nowMs - history.lastSentAt < cooldownMs) return false;
  if (nowMs - history.lastSentAt < DAY_MS) return false;
  return true;
}

router.use(security.sessionValidation);

/** Run a win-back cycle (admin only). */
router.post('/run', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const nowMs = Date.now();
    const allEconomies = await accountEconomy.getAllPlayerEconomies();
    if (!allEconomies || allEconomies.size === 0) {
      return res.json({ success: true, sent: 0, atRisk: 0, churned: 0, requestId: req.requestId });
    }

    const atRiskPlayers = getChurnRiskPlayers(allEconomies, { nowMs });
    const churnedPlayers = getChurnedPlayers(allEconomies, { nowMs });
    const highValueAtRisk = getHighValueAtRiskPlayers(allEconomies, { nowMs });

    const toNotify = [];

    for (const player of atRiskPlayers) {
      const isHighValue = highValueAtRisk.some((hv) => hv.playerId === player.playerId);
      const offerType = isHighValue ? 'high_value_churn' : player.segment === 'paying_churn_risk' ? 'paying_churn_risk' : 'free_churn_risk';
      if (canSendWinBack(player.playerId, offerType, nowMs)) {
        toNotify.push({ playerId: player.playerId, offerType, days: player.daysInactive, coins: WINBACK_OFFERS[offerType].coins });
      }
    }

    for (const player of churnedPlayers) {
      const isHighValue = player.totalSpent > 100;
      const offerType = isHighValue ? 'high_value_churn' : 'free_churn_risk';
      if (canSendWinBack(player.playerId, offerType, nowMs)) {
        toNotify.push({ playerId: player.playerId, offerType, days: player.daysInactive, coins: WINBACK_OFFERS[offerType].coins });
      }
    }

    // Send notifications grouped by offer type
    const byOffer = new Map();
    for (const n of toNotify) {
      if (!byOffer.has(n.offerType)) byOffer.set(n.offerType, []);
      byOffer.get(n.offerType).push(n);
    }

    let sent = 0;
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
        const result = await notifyPlayers({ userIds: playerIds, title: titles.join(' | '), body: bodies.join(' | '), data: { type: 'winback', offerType, coins: offer.coins } });
        sent += result.successCount;
        for (const p of players) {
          winBackHistory.set(p.playerId, { lastSentAt: nowMs, offerType, sentCount: (winBackHistory.get(p.playerId)?.sentCount || 0) + 1 });
        }
      } catch (error) {
        logger.error('Failed to send win-back notifications', { offerType, error: error.message });
      }
    }

    res.json({ success: true, sent, atRisk: atRiskPlayers.length, churned: churnedPlayers.length, highValueAtRisk: highValueAtRisk.length, requestId: req.requestId });
  } catch (error) {
    logger.error('Win-back cycle failed', { error: error.message });
    res.status(500).json({ success: false, error: 'winback_error', requestId: req.requestId });
  }
});

/** Get win-back statistics (admin only). */
router.get('/stats', async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.playerId !== 'admin') {
      return res.status(403).json({ success: false, error: 'admin_required', requestId: req.requestId });
    }
    const totalSent = Array.from(winBackHistory.values()).reduce((sum, h) => sum + (h.sentCount || 0), 0);
    const conversions = Array.from(winBackHistory.values()).filter((h) => h.lastConvertedAt).length;
    res.json({ success: true, totalPlayersContacted: winBackHistory.size, totalNotificationsSent: totalSent, totalConversions: conversions, isRunning, requestId: req.requestId });
  } catch (error) {
    logger.error('Get win-back stats failed', { error: error.message });
    res.status(500).json({ success: false, error: 'winback_stats_error', requestId: req.requestId });
  }
});

export default router;
