import express from 'express';
import { body, validationResult } from 'express-validator';
import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import { accountEconomy, EconomyRuleError } from '../services/economy/AccountEconomyService.js';
import { ensureKingdom, kingdomView } from '../services/meta/kingdom.js';

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
    res.json({ success: true, kingdom: view, coins: economy.currencies.coins.amount, requestId: req.requestId });
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

export default router;
