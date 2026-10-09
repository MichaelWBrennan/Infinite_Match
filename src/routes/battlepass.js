import express from 'express';
import { promises as fs } from 'fs';

import { Logger } from '../core/logger/index.js';
import security from '../core/security/index.js';
import { accountEconomy as accountEconomyService } from '../services/economy/AccountEconomyService.js';
import PurchaseLedgerDb from '../services/payments/PurchaseLedgerDb.js';
import { BattlePassError, planTierClaim, progressView, seasonStatus } from '../services/meta/battlepass.js';
import { loadSeason, seasonConfigPath } from '../services/meta/battlepass-season.js';

const router = express.Router();
const logger = new Logger('BattlePassRoutes');

const BATTLE_PASS_ERRORS = {
  season_not_active: 409,
  tier_not_found: 404,
  tier_locked: 409,
  already_claimed: 409,
  premium_required: 403,
  no_reward: 400,
  invalid_track: 400,
  invalid_level: 400,
};

router.get('/config', async (req, res) => {
  try {
    const raw = await fs.readFile(seasonConfigPath(), 'utf-8');
    const json = JSON.parse(raw);
    res.json({ success: true, pass: json });
  } catch (error) {
    logger.error('Failed to load battle pass config', { error: error.message });
    res.status(500).json({ success: false, error: 'config_error' });
  }
});

// The player's season progress: XP, the tier they are on, and what they have claimed.
router.get('/progress', security.sessionValidation, async (req, res) => {
  try {
    const season = await loadSeason();
    const { playerId } = req.user;
    const owned = await PurchaseLedgerDb.hasPurchase(playerId, season.premiumSku);
    const playerEconomy = await accountEconomyService.getPlayerEconomy(playerId);
    res.json({
      success: true,
      progress: progressView(playerEconomy, season, { owned }),
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Battle pass progress failed', { error: error.message });
    res.status(500).json({ success: false, error: 'battlepass_error', requestId: req.requestId });
  }
});

// Claims one tier on one track. The reward is granted on the server, once per tier and track.
router.post('/claim', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const { level, track } = req.body || {};
    const season = await loadSeason();
    if (seasonStatus(season) !== 'active') {
      return res.status(409).json({ success: false, error: 'season_not_active', requestId: req.requestId });
    }
    const owned = track === 'premium' ? await PurchaseLedgerDb.hasPurchase(playerId, season.premiumSku) : false;

    const granted = await accountEconomyService.withPlayerLock(playerId, async () => {
      const playerEconomy = await accountEconomyService.getPlayerEconomy(playerId);
      const plan = planTierClaim(playerEconomy, season, { level, track, owned });
      for (const op of plan.operations) accountEconomyService.applyReward(playerEconomy, op);
      plan.mark();
      await accountEconomyService.updatePlayerEconomyCache(playerId, playerEconomy);
      return { reward: plan.reward, balances: { coins: playerEconomy.currencies.coins.amount } };
    });

    security.logSecurityEvent('battlepass_tier_claimed', { playerId, level, track, ip: req.ip });
    res.json({ success: true, result: granted, requestId: req.requestId });
  } catch (error) {
    if (error instanceof BattlePassError) {
      return res.status(BATTLE_PASS_ERRORS[error.code] || 400).json({
        success: false,
        error: error.code,
        requestId: req.requestId,
      });
    }
    logger.error('Battle pass claim failed', { error: error.message });
    res.status(500).json({ success: false, error: 'battlepass_error', requestId: req.requestId });
  }
});

export default router;
