import express from 'express';
import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import { accountEconomy } from '../services/economy/AccountEconomyService.js';
import { MinigameError, minigameStatus, planMinigamePlay } from '../services/meta/minigames.js';
const router = express.Router();
const logger = new Logger('MinigameRoutes');
// The games, and whether the signed-in player has played each one today (UTC).
router.get('/', security.sessionValidation, async (req, res) => {
    try {
        const economy = await accountEconomy.getPlayerEconomy(req.user.playerId);
        res.json({ success: true, games: minigameStatus(economy), requestId: req.requestId });
    }
    catch (error) {
        logger.error('Mini-game status failed', { error: error.message });
        res.status(500).json({ success: false, error: 'minigame_error', requestId: req.requestId });
    }
});
// Pays one play of a game, once per UTC day. The score is checked for range and the coins are
// capped per game. The lock keeps two plays from both passing the once-a-day check.
router.post('/:game/complete', security.sessionValidation, async (req, res) => {
    const { playerId } = req.user;
    const gameId = req.params.game;
    try {
        const result = await accountEconomy.withPlayerLock(playerId, async () => {
            const economy = await accountEconomy.getPlayerEconomy(playerId);
            const plan = planMinigamePlay(economy, gameId, req.body?.score);
            accountEconomy.applyReward(economy, { type: 'currency', currencyId: 'coins', amount: plan.coins });
            economy.minigames = plan.record;
            await accountEconomy.updatePlayerEconomyCache(playerId, economy);
            return { game: gameId, coins: plan.coins, balance: economy.currencies.coins.amount };
        });
        res.json({ success: true, result, requestId: req.requestId });
    }
    catch (error) {
        if (error instanceof MinigameError) {
            const status = error.code === 'already_played_today' ? 409 : 400;
            return res.status(status).json({ success: false, error: error.code, requestId: req.requestId });
        }
        logger.error('Mini-game payout failed', { error: error.message });
        res.status(500).json({ success: false, error: 'minigame_error', requestId: req.requestId });
    }
});
export default router;
//# sourceMappingURL=minigames.js.map