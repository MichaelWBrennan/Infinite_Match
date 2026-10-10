/**
 * Account Economy Routes
 * Handles account-linked economy operations and Unity synchronization
 */
import express from 'express';
import { body, validationResult } from 'express-validator';
import security, { requireMinRole } from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import { accountEconomy as accountEconomyService, EconomyRuleError } from '../services/economy/AccountEconomyService.js';
import { ITEM_CATALOG, LEVEL_LIMITS } from '../services/economy/item-catalog.js';
import { endlessRewards, levelTarget, winRewards } from '../services/meta/rewards.js';
import { levelMultiplier, readLevelOverrides } from '../services/meta/level-overrides.js';
import { applyVip, VIP_ENTITLEMENT } from '../services/meta/vip.js';
import { kingdomCoinMultiplier } from '../services/meta/kingdom.js';
import { addSeasonXp } from '../services/meta/battlepass.js';
import { grantSeasonXp, loadSeasonSafely } from '../services/meta/battlepass-season.js';
import PurchaseLedgerDb from '../services/payments/PurchaseLedgerDb.js';
import { socialStore } from '../services/social/social-store.js';
import { activeCompetitions, loadCompetitions } from '../services/live-ops/competitions.js';
import { liveGeneratedLevel, clientRulesVersion } from '../services/levels/level-service.js';
import { LevelInputError } from '../services/levels/location-context.js';
const router = express.Router();
const logger = new Logger('AccountEconomyRoutes');
// The shared instance: balances live in it, so every route must use the same one.
// Helper function for consistent error handling
const handleRouteError = (res, error, operation, requestId) => {
    logger.error(`Failed to ${operation}`, { error: error.message });
    res.status(500).json({
        success: false,
        error: `Failed to ${operation}`,
        requestId,
    });
};
// Validation middleware
// Records a won level for the social boards: the player's best score, and their score and progress
// in any running tournament or challenge. A failure is logged and does not undo the reward.
async function recordCompetitionWin(playerId, level, score) {
    try {
        const active = activeCompetitions(loadCompetitions(), Date.now());
        await socialStore.recordWin(playerId, {
            level,
            score,
            tournamentIds: active.tournaments.map((t) => t.id),
            challengeIds: active.challenges.map((c) => c.id),
        });
    }
    catch (error) {
        logger.error('Could not record the win for boards', { error: error.message, playerId });
    }
}
const validateCurrencyUpdate = [
    body('currencyId').isString().notEmpty().withMessage('Currency ID is required'),
    body('amount').isInt({ min: 0 }).withMessage('Amount must be a positive integer'),
    // Players may only spend. Grants come from server flows.
    body('operation').isIn(['spend']).withMessage('Operation must be spend'),
    body('source').optional().isString().withMessage('Source must be a string'),
];
const validateInventoryUpdate = [
    body('category').isString().notEmpty().withMessage('Category is required'),
    body('itemId').isString().notEmpty().withMessage('Item ID is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive integer'),
    // Players may only consume items. Grants come from server flows.
    body('operation').isIn(['remove']).withMessage('Operation must be remove'),
];
// Initialize player economy
router.post('/initialize', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        const { platform = 'local' } = req.body;
        const playerEconomy = await accountEconomyService.initializePlayerEconomy(playerId, platform);
        security.logSecurityEvent('economy_initialized', {
            playerId,
            platform,
            ip: req.ip,
        });
        res.json({
            success: true,
            data: playerEconomy,
            requestId: req.requestId,
        });
    }
    catch (error) {
        handleRouteError(res, error, 'initialize player economy', req.requestId);
    }
});
// Get player economy data
router.get('/data', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        // Energy is shown as it is now, not as it was at the last save. Nothing is written here.
        const playerEconomy = await accountEconomyService.getPlayerEconomyView(playerId);
        res.json({
            success: true,
            data: playerEconomy,
            requestId: req.requestId,
        });
    }
    catch (error) {
        handleRouteError(res, error, 'get player economy data', req.requestId);
    }
});
// Update currency
router.post('/currency/update', security.sessionValidation, validateCurrencyUpdate, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
                requestId: req.requestId,
            });
        }
        const { playerId } = req.user;
        const { currencyId, amount, operation, source } = req.body;
        const result = await accountEconomyService.updateCurrency(playerId, currencyId, amount, operation, source);
        security.logSecurityEvent('currency_updated', {
            playerId,
            currencyId,
            amount,
            operation,
            source,
            ip: req.ip,
        });
        res.json({
            success: true,
            result,
            requestId: req.requestId,
        });
    }
    catch (error) {
        handleRouteError(res, error, 'update currency', req.requestId);
    }
});
// Update inventory
router.post('/inventory/update', security.sessionValidation, validateInventoryUpdate, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array(),
                requestId: req.requestId,
            });
        }
        const { playerId } = req.user;
        const { category, itemId, quantity, operation } = req.body;
        const result = await accountEconomyService.updateInventory(playerId, category, itemId, quantity, operation);
        security.logSecurityEvent('inventory_updated', {
            playerId,
            category,
            itemId,
            quantity,
            operation,
            ip: req.ip,
        });
        res.json({
            success: true,
            result,
            requestId: req.requestId,
        });
    }
    catch (error) {
        handleRouteError(res, error, 'update inventory', req.requestId);
    }
});
// Update progression
// XP is granted only by /level/complete, which computes it on the server.
// Accepting client XP let a player level up without limit and collect the rewards.
router.post('/progression/update', security.sessionValidation, (req, res) => {
    res.status(403).json({
        success: false,
        error: 'XP is granted by level completion',
        requestId: req.requestId,
    });
});
// Lucky wheel: one spin per day, reward chosen and granted on the server.
router.post('/wheel/spin', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        const { reward, spunAt } = await accountEconomyService.spinLuckyWheel(playerId);
        security.logSecurityEvent('lucky_wheel_spun', { playerId, reward: reward.id, ip: req.ip });
        res.json({ success: true, result: { reward, spunAt }, requestId: req.requestId });
    }
    catch (error) {
        if (error.message.includes('already spun')) {
            return res.status(400).json({ success: false, error: error.message, requestId: req.requestId });
        }
        handleRouteError(res, error, 'spin lucky wheel', req.requestId);
    }
});
// Claim daily reward
router.post('/daily-reward/claim', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        const result = await accountEconomyService.claimDailyReward(playerId);
        await grantSeasonXp(playerId, 'daily_login');
        security.logSecurityEvent('daily_reward_claimed', {
            playerId,
            streak: result.streak,
            ip: req.ip,
        });
        res.json({
            success: true,
            result,
            requestId: req.requestId,
        });
    }
    catch (error) {
        if (error.message.includes('already claimed')) {
            return res.status(400).json({
                success: false,
                error: error.message,
                requestId: req.requestId,
            });
        }
        handleRouteError(res, error, 'claim daily reward', req.requestId);
    }
});
// Sync with Unity
router.post('/sync/unity', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        const { unityData } = req.body;
        const result = await accountEconomyService.syncWithUnity(playerId, unityData);
        security.logSecurityEvent('economy_synced_unity', {
            playerId,
            ip: req.ip,
        });
        res.json({
            success: true,
            result,
            requestId: req.requestId,
        });
    }
    catch (error) {
        handleRouteError(res, error, 'sync with Unity', req.requestId);
    }
});
// Get economy statistics
router.get('/stats', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        const stats = await accountEconomyService.getEconomyStats(playerId);
        res.json({
            success: true,
            stats,
            requestId: req.requestId,
        });
    }
    catch (error) {
        handleRouteError(res, error, 'get economy statistics', req.requestId);
    }
});
// Get service statistics (admin only)
router.get('/service/stats', security.sessionValidation, requireMinRole('admin'), async (req, res) => {
    try {
        const stats = accountEconomyService.getStats();
        res.json({
            success: true,
            stats,
            requestId: req.requestId,
        });
    }
    catch (error) {
        handleRouteError(res, error, 'get service statistics', req.requestId);
    }
});
// Purchase item (integrates with Unity Economy)
router.post('/purchase', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        const { itemId } = req.body;
        // The price comes from the server catalog. A client-supplied amount is ignored.
        const item = Object.prototype.hasOwnProperty.call(ITEM_CATALOG, itemId) ? ITEM_CATALOG[itemId] : null;
        if (!item) {
            return res.status(400).json({
                success: false,
                error: 'Unknown item',
                requestId: req.requestId,
            });
        }
        const { currencyId, price, category } = item;
        const currencyResult = await accountEconomyService.updateCurrency(playerId, currencyId, price, 'spend', 'purchase');
        const inventoryResult = await accountEconomyService.updateInventory(playerId, category, itemId, 1, 'add');
        security.logSecurityEvent('item_purchased', {
            playerId,
            itemId,
            currencyId,
            price,
            ip: req.ip,
        });
        res.json({
            success: true,
            result: {
                currency: currencyResult,
                inventory: inventoryResult,
            },
            requestId: req.requestId,
        });
    }
    catch (error) {
        if (error.message.includes('Insufficient')) {
            return res.status(400).json({ success: false, error: error.message, requestId: req.requestId });
        }
        handleRouteError(res, error, 'purchase item', req.requestId);
    }
});
// Use powerup
router.post('/powerup/use', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        const { powerupId, quantity = 1 } = req.body;
        if (!powerupId) {
            return res.status(400).json({
                success: false,
                error: 'Powerup ID is required',
                requestId: req.requestId,
            });
        }
        // Remove powerup from inventory
        const result = await accountEconomyService.updateInventory(playerId, 'powerups', powerupId, quantity, 'remove');
        security.logSecurityEvent('powerup_used', {
            playerId,
            powerupId,
            quantity,
            ip: req.ip,
        });
        res.json({
            success: true,
            result,
            requestId: req.requestId,
        });
    }
    catch (error) {
        if (error.message.includes('Insufficient')) {
            return res.status(400).json({
                success: false,
                error: error.message,
                requestId: req.requestId,
            });
        }
        handleRouteError(res, error, 'use powerup', req.requestId);
    }
});
// Complete a level the player won. Needs the attempt id from energy/spend. The server works out
// the stars from the score and the level target, and pays the server's reward for them. A reported
// star count is ignored.
router.post('/level/complete', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        const { level, score, attemptId } = req.body || {};
        const validLevel = Number.isInteger(level) && level >= 1 && level <= LEVEL_LIMITS.maxLevel;
        const validScore = Number.isInteger(score) && score >= 0 && score <= LEVEL_LIMITS.maxScore;
        if (!validLevel || !validScore) {
            return res.status(400).json({
                success: false,
                error: 'Invalid level or score',
                requestId: req.requestId,
            });
        }
        if (typeof attemptId !== 'string' || attemptId.length === 0 || attemptId.length > 64) {
            return res.status(400).json({ success: false, error: 'attempt_required', requestId: req.requestId });
        }
        let completed;
        try {
            completed = await accountEconomyService.consumeAttempt(playerId, attemptId, level, undefined, {
                mode: 'level', score, objectiveProgress: req.body.objectiveProgress,
                legacyTarget: levelTarget(level, levelMultiplier(level, readLevelOverrides())),
            });
        }
        catch (error) {
            if (error instanceof EconomyRuleError) {
                return res.status(400).json({ success: false, error: error.code, requestId: req.requestId });
            }
            throw error;
        }
        const stars = completed.stars;
        // Kingdom rooms add a coin bonus, then VIP multiplies coins. The player must hold the vip
        // entitlement on the server. Both are read here; neither is taken from the client.
        const economyNow = await accountEconomyService.getPlayerEconomy(playerId);
        const base = winRewards(stars);
        const roomBoosted = { ...base, coins: Math.floor(base.coins * kingdomCoinMultiplier(economyNow.kingdom)) };
        const isVip = await PurchaseLedgerDb.hasPurchase(playerId, VIP_ENTITLEMENT);
        const reward = applyVip(roomBoosted, isVip);
        const progressionResult = await accountEconomyService.updateProgression(playerId, reward.xp, true);
        const rewards = [
            { type: 'currency', currencyId: 'coins', amount: reward.coins },
            { type: 'currency', currencyId: 'stars', amount: reward.stars },
        ];
        await accountEconomyService.updateCurrency(playerId, 'coins', reward.coins, 'add', 'level_complete');
        await accountEconomyService.updateCurrency(playerId, 'stars', reward.stars, 'add', 'level_complete');
        // Statistics show what the client reported. They are not used for any reward.
        const playerEconomy = await accountEconomyService.getPlayerEconomy(playerId);
        playerEconomy.statistics.gamesPlayed++;
        playerEconomy.statistics.levelsCompleted++;
        playerEconomy.statistics.totalScore += score;
        playerEconomy.statistics.averageScore = Math.floor(playerEconomy.statistics.totalScore / playerEconomy.statistics.gamesPlayed);
        playerEconomy.statistics.bestScore = Math.max(playerEconomy.statistics.bestScore, score);
        playerEconomy.statistics.lastPlayed = new Date().toISOString();
        const season = await loadSeasonSafely();
        if (season)
            addSeasonXp(playerEconomy, season, 'level_complete');
        await accountEconomyService.updatePlayerEconomyCache(playerId, playerEconomy);
        await recordCompetitionWin(playerId, level, score);
        security.logSecurityEvent('level_completed', {
            playerId,
            level,
            score,
            stars,
            xpGained: reward.xp,
            ip: req.ip,
        });
        res.json({
            success: true,
            result: {
                progression: progressionResult,
                rewards,
                stars,
                vip: isVip,
                balances: {
                    coins: playerEconomy.currencies.coins.amount,
                    stars: playerEconomy.currencies.stars.amount,
                },
                statistics: {
                    gamesPlayed: playerEconomy.statistics.gamesPlayed,
                    levelsCompleted: playerEconomy.statistics.levelsCompleted,
                    totalScore: playerEconomy.statistics.totalScore,
                    averageScore: playerEconomy.statistics.averageScore,
                    bestScore: playerEconomy.statistics.bestScore,
                },
            },
            requestId: req.requestId,
        });
    }
    catch (error) {
        handleRouteError(res, error, 'complete level', req.requestId);
    }
});
// Buy a loot box with coins. The reward is rolled and granted on the server.
// Endless mode: no target and no clock. A run ends when the board has no move left. The score
// is paid as coins and XP. An endless run uses one energy point, spent as attempt level 1.
const ENDLESS_ATTEMPT_LEVEL = 1;
router.post('/endless/complete', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        const { score, attemptId } = req.body || {};
        if (!Number.isInteger(score) || score < 0 || score > LEVEL_LIMITS.maxScore) {
            return res.status(400).json({ success: false, error: 'Invalid score', requestId: req.requestId });
        }
        if (typeof attemptId !== 'string' || attemptId.length === 0 || attemptId.length > 64) {
            return res.status(400).json({ success: false, error: 'attempt_required', requestId: req.requestId });
        }
        try {
            await accountEconomyService.consumeAttempt(playerId, attemptId, ENDLESS_ATTEMPT_LEVEL, undefined, { mode: 'endless' });
        }
        catch (error) {
            if (error instanceof EconomyRuleError) {
                return res.status(400).json({ success: false, error: error.code, requestId: req.requestId });
            }
            throw error;
        }
        const reward = endlessRewards(score);
        if (reward.xp > 0)
            await accountEconomyService.updateProgression(playerId, reward.xp, false);
        if (reward.coins > 0)
            await accountEconomyService.updateCurrency(playerId, 'coins', reward.coins, 'add', 'endless_run');
        const playerEconomy = await accountEconomyService.getPlayerEconomy(playerId);
        const stats = playerEconomy.statistics;
        stats.endlessRuns = (stats.endlessRuns || 0) + 1;
        stats.endlessBest = Math.max(stats.endlessBest || 0, score);
        await accountEconomyService.updatePlayerEconomyCache(playerId, playerEconomy);
        res.json({
            success: true,
            result: {
                reward,
                endlessBest: stats.endlessBest,
                balances: { coins: playerEconomy.currencies.coins.amount },
            },
            requestId: req.requestId,
        });
    }
    catch (error) {
        handleRouteError(res, error, 'complete endless run', req.requestId);
    }
});
router.post('/lootbox/open', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        const { type } = req.body || {};
        const result = await accountEconomyService.openLootbox(playerId, type);
        security.logSecurityEvent('lootbox_opened', { playerId, type, reward: result.reward.id, ip: req.ip });
        res.json({ success: true, result, requestId: req.requestId });
    }
    catch (error) {
        if (error instanceof EconomyRuleError) {
            return res.status(400).json({ success: false, error: error.code, requestId: req.requestId });
        }
        handleRouteError(res, error, 'open loot box', req.requestId);
    }
});
// Spends the energy for one attempt at a level and returns the attempt id. Completing the level
// needs that id, so a reward cannot be claimed without an attempt.
router.post('/energy/spend', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        // Legacy clients may omit mode. New clients receive and pin the generated
        // definition in the SAME request that spends energy, not from client-supplied goals.
        if (req.body?.mode === 'endless' && req.body?.level !== undefined && req.body.level !== 1) {
            throw new LevelInputError('invalid_endless_start_level');
        }
        const definition = req.body?.mode === undefined ? null : await liveGeneratedLevel({
            level: req.body?.level, mode: req.body.mode, location: req.body.location ?? {},
            rulesVersion: clientRulesVersion(req.body.rulesVersion),
        });
        const result = await accountEconomyService.spendAttemptEnergy(playerId, definition?.level ?? req.body?.level, Date.now(), definition);
        res.json({ success: true, result, serverTime: new Date().toISOString(), requestId: req.requestId });
    }
    catch (error) {
        if (error instanceof EconomyRuleError || error instanceof LevelInputError) {
            return res.status(400).json({ success: false, error: error.code, requestId: req.requestId });
        }
        handleRouteError(res, error, 'spend attempt energy', req.requestId);
    }
});
// Refill energy to full with coins. Charges only for the energy that is missing.
router.post('/energy/refill', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        const result = await accountEconomyService.refillEnergy(playerId);
        security.logSecurityEvent('energy_refilled', { playerId, costCoins: result.costCoins, ip: req.ip });
        res.json({ success: true, result, requestId: req.requestId });
    }
    catch (error) {
        if (error instanceof EconomyRuleError) {
            return res.status(400).json({ success: false, error: error.code, requestId: req.requestId });
        }
        handleRouteError(res, error, 'refill energy', req.requestId);
    }
});
export default router;
//# sourceMappingURL=account-economy.js.map