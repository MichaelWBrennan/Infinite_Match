import express from 'express';
import { body, validationResult } from 'express-validator';
import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import { accountEconomy, EconomyRuleError } from '../services/economy/AccountEconomyService.js';
import { ensureKingdom, kingdomCoinMultiplier, kingdomView } from '../services/meta/kingdom.js';
import {
  DecorError,
  decorView,
  ensureDecor,
  planBuyDecor,
  planPlaceDecor,
  planRemoveDecor,
} from '../services/meta/kingdom-decor.js';

const router = express.Router();
const logger = new Logger('KingdomRoutes');

// The kingdom as the signed-in player sees it: rooms, levels, and what each upgrade costs.
router.get('/', security.sessionValidation, async (req, res) => {
  try {
    const economy = await accountEconomy.getPlayerEconomy(req.user.playerId);
    const view = kingdomView({
      kingdom: ensureKingdom(economy),
      coins: economy.currencies.coins.amount,
      lifetimeStars: economy.currencies.stars.earned,
    });
    const decor = decorView(ensureDecor(ensureKingdom(economy)));
    const coinBonus = kingdomCoinMultiplier(economy.kingdom) - 1;
    res.json({
      success: true,
      kingdom: view,
      decor,
      coins: economy.currencies.coins.amount,
      coinBonus,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Kingdom lookup failed', { error: error.message });
    res.status(500).json({ success: false, error: 'kingdom_error', requestId: req.requestId });
  }
});

// Upgrade one room one level. The server checks coins, stars, and the level cap.
router.post(
  '/renovate',
  security.sessionValidation,
  [body('roomId').isString().isLength({ min: 1, max: 40 }).withMessage('roomId required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array(), requestId: req.requestId });
    }
    try {
      const { playerId } = req.user;
      const result = await accountEconomy.renovateRoom(playerId, req.body.roomId);
      security.logSecurityEvent('kingdom_room_renovated', {
        playerId,
        roomId: result.roomId,
        level: result.level,
        ip: req.ip,
      });
      res.json({ success: true, result, requestId: req.requestId });
    } catch (error) {
      if (error instanceof EconomyRuleError) {
        return res.status(400).json({ success: false, error: error.code, requestId: req.requestId });
      }
      logger.error('Renovation failed', { error: error.message });
      res.status(500).json({ success: false, error: 'renovation_error', requestId: req.requestId });
    }
  },
);

// Decorations. Each action runs under the player's economy lock and saves once. Errors are
// returned with a code the client can show.
const sendDecorError = (res, error, requestId) => {
  if (error instanceof DecorError || error instanceof EconomyRuleError) {
    return res.status(400).json({ success: false, error: error.code, requestId });
  }
  logger.error('Decor action failed', { error: error.message });
  return res.status(500).json({ success: false, error: 'decor_error', requestId });
};

router.post('/decor/buy', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const decorId = req.body?.decorId;
    const result = await accountEconomy.withPlayerLock(playerId, async () => {
      const economy = await accountEconomy.getPlayerEconomy(playerId);
      const decor = ensureDecor(ensureKingdom(economy));
      const { costCoins } = planBuyDecor(decor, decorId, economy.currencies.coins.amount);
      accountEconomy.spendCoins(economy, costCoins);
      decor.owned[decorId] = (decor.owned[decorId] || 0) + 1;
      await accountEconomy.updatePlayerEconomyCache(playerId, economy);
      return { decorId, costCoins, owned: decor.owned[decorId], coins: economy.currencies.coins.amount };
    });
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    sendDecorError(res, error, req.requestId);
  }
});

router.post('/decor/place', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const { roomId, decorId } = req.body || {};
    const result = await accountEconomy.withPlayerLock(playerId, async () => {
      const economy = await accountEconomy.getPlayerEconomy(playerId);
      const kingdom = ensureKingdom(economy);
      const decor = ensureDecor(kingdom);
      const plan = planPlaceDecor(kingdom, decor, roomId, decorId);
      decor.placed[plan.roomId] = plan.decorId;
      await accountEconomy.updatePlayerEconomyCache(playerId, economy);
      return plan;
    });
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    sendDecorError(res, error, req.requestId);
  }
});

router.post('/decor/remove', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const roomId = req.body?.roomId;
    const result = await accountEconomy.withPlayerLock(playerId, async () => {
      const economy = await accountEconomy.getPlayerEconomy(playerId);
      const decor = ensureDecor(ensureKingdom(economy));
      const plan = planRemoveDecor(decor, roomId);
      delete decor.placed[plan.roomId];
      await accountEconomy.updatePlayerEconomyCache(playerId, economy);
      return plan;
    });
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    sendDecorError(res, error, req.requestId);
  }
});

export default router;
