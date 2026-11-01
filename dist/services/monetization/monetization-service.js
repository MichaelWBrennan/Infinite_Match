/**
 * Monetization Service - revenue-generating features for Infinite Match.
 *
 * Core revenue mechanics:
 * 1. Level Continue - spend coins/boosters to continue after running out of moves
 * 2. Skip Level - spend coins/stars to bypass a level you're stuck on
 * 3. Streak Freeze - pay to preserve login streak for 24 hours
 * 4. Instant Life Refill - buy lives with real money (USD via Stripe)
 * 5. Ad Reward Grant - grant coins/lives for watching rewarded ads
 *
 * All operations are server-authoritative. The client reports intent; the server
 * validates, deducts, and grants. No client-supplied amounts are trusted.
 */
import { Logger } from '../../core/logger/index.js';
import { spendLife, grantLives, MAX_LIVES } from '../meta/lives.js';
import { getMaxLives } from '../meta/vip.js';
import PurchaseLedgerDb from '../payments/PurchaseLedgerDb.js';
import { productFor } from '../payments/product-catalog.js';
import { priceFor } from '../live-ops/live-ops.js';
import StripeService from '../payments/StripeService.js';
import { accountEconomy } from '../economy/AccountEconomyService.js';
const logger = new Logger('MonetizationService');
// Costs (in coins) for continue and skip. Server-set; client cannot override.
const CONTINUE_COST_COINS = 100; // +5 moves when you run out
const SKIP_LEVEL_COST_COINS = 250; // Skip a level entirely, keep stars
const STREAK_FREEZE_COST_COINS = 150; // Freeze streak for 24 hours
const STREAK_FREEZE_COST_USD_CENTS = 99; // Or $0.99 via real money
// Max continues per level to prevent infinite retry loops
const MAX_CONTINUES_PER_LEVEL = 3;
// How long a streak freeze lasts (24 hours)
const STREAK_FREEZE_DURATION_MS = 24 * 60 * 60 * 1000;
// How many extra moves a continue grants
const CONTINUE_EXTRA_MOVES = 5;
/**
 * MonetizationService - handles all paid continue/skip/refill operations.
 */
export class MonetizationService {
    constructor() {
        this.logger = new Logger('MonetizationService');
        // Active streak freezes: playerId -> { expiresAt }
        this.streakFreezes = new Map();
        // Continued levels: `playerId:level` -> { continuesUsed, lastContinueAt }
        this.levelContinues = new Map();
        // Skipped levels: `playerId:level` -> { skippedAt }
        this.levelSkips = new Map();
        // Ad reward grants: playerId -> { lastGrantAt, grantsToday }
        this.adGrants = new Map();
        // Max ad rewards per day per player (prevent ad abuse)
        this.maxAdGrantsPerDay = 10;
    }
    // ========================================================================
    // LEVEL CONTINUE
    // ========================================================================
    /**
     * Check if a player can continue a level (hasn't exceeded max continues).
     */
    canContinue(playerId, levelNumber) {
        const key = `${playerId}:${levelNumber}`;
        const record = this.levelContinues.get(key);
        if (!record)
            return { canContinue: true, continuesUsed: 0 };
        return {
            canContinue: record.continuesUsed < MAX_CONTINUES_PER_LEVEL,
            continuesUsed: record.continuesUsed,
            remaining: MAX_CONTINUES_PER_LEVEL - record.continuesUsed,
        };
    }
    /**
     * Record a level continue. Deducts coins from the player's account.
     * Returns { success, continuesUsed, movesAdded, coinsDeducted } or error.
     */
    async continueLevel(playerId, levelNumber, { nowMs = Date.now() } = {}) {
        const canContinue = this.canContinue(playerId, levelNumber);
        if (!canContinue.canContinue) {
            return { success: false, error: 'max_continues_reached' };
        }
        const playerEconomy = await accountEconomy.getPlayerEconomy(playerId);
        const coins = playerEconomy.currencies.coins;
        if (coins.amount < CONTINUE_COST_COINS) {
            return { success: false, error: 'insufficient_coins', required: CONTINUE_COST_COINS, balance: coins.amount };
        }
        // Deduct coins
        await accountEconomy.updateCurrency(playerId, 'coins', CONTINUE_COST_COINS, 'spend', `continue_level:${levelNumber}`);
        // Record the continue
        const key = `${playerId}:${levelNumber}`;
        const record = this.levelContinues.get(key) || { continuesUsed: 0, lastContinueAt: 0 };
        record.continuesUsed += 1;
        record.lastContinueAt = nowMs;
        this.levelContinues.set(key, record);
        logger.info('Level continue granted', { playerId, levelNumber, continuesUsed: record.continuesUsed, cost: CONTINUE_COST_COINS });
        return {
            success: true,
            continuesUsed: record.continuesUsed,
            movesAdded: CONTINUE_EXTRA_MOVES,
            coinsDeducted: CONTINUE_COST_COINS,
            remaining: MAX_CONTINUES_PER_LEVEL - record.continuesUsed,
        };
    }
    // ========================================================================
    // SKIP LEVEL
    // ========================================================================
    /**
     * Check if a player has already skipped a level.
     */
    isLevelSkipped(playerId, levelNumber) {
        const key = `${playerId}:${levelNumber}`;
        return this.levelSkips.has(key);
    }
    /**
     * Skip a level. Deducts coins from the player's account.
     * Player keeps the stars they would have earned (treated as a win with 1 star).
     */
    async skipLevel(playerId, levelNumber, { nowMs = Date.now() } = {}) {
        if (this.isLevelSkipped(playerId, levelNumber)) {
            return { success: false, error: 'level_already_skipped' };
        }
        const playerEconomy = await accountEconomy.getPlayerEconomy(playerId);
        const coins = playerEconomy.currencies.coins;
        if (coins.amount < SKIP_LEVEL_COST_COINS) {
            return { success: false, error: 'insufficient_coins', required: SKIP_LEVEL_COST_COINS, balance: coins.amount };
        }
        // Deduct coins
        await accountEconomy.updateCurrency(playerId, 'coins', SKIP_LEVEL_COST_COINS, 'spend', `skip_level:${levelNumber}`);
        // Record the skip
        const key = `${playerId}:${levelNumber}`;
        this.levelSkips.set(key, { skippedAt: nowMs });
        // Grant 1-star win reward for the skipped level
        const winReward = { stars: 1, coins: 100, xp: 50 };
        await accountEconomy.applyReward(playerEconomy, { type: 'currency', currencyId: 'coins', amount: winReward.coins });
        await accountEconomy.applyReward(playerEconomy, { type: 'currency', currencyId: 'stars', amount: winReward.stars });
        logger.info('Level skipped', { playerId, levelNumber, cost: SKIP_LEVEL_COST_COINS });
        return {
            success: true,
            levelSkipped: levelNumber,
            coinsDeducted: SKIP_LEVEL_COST_COINS,
            reward: { stars: 1, coins: 100, xp: 50 },
        };
    }
    // ========================================================================
    // STREAK FREEZE
    // ========================================================================
    /**
     * Check if a player has an active streak freeze.
     */
    hasActiveStreakFreeze(playerId, { nowMs = Date.now() } = {}) {
        const freeze = this.streakFreezes.get(playerId);
        if (!freeze)
            return false;
        if (nowMs >= freeze.expiresAt) {
            this.streakFreezes.delete(playerId);
            return false;
        }
        return true;
    }
    /**
     * Purchase a streak freeze. Can be paid with coins or real money.
     */
    async purchaseStreakFreeze(playerId, { payWith = 'coins', nowMs = Date.now() } = {}) {
        // Can't stack freezes
        if (this.hasActiveStreakFreeze(playerId, { nowMs })) {
            return { success: false, error: 'freeze_already_active' };
        }
        if (payWith === 'coins') {
            const playerEconomy = await accountEconomy.getPlayerEconomy(playerId);
            const coins = playerEconomy.currencies.coins;
            if (coins.amount < STREAK_FREEZE_COST_COINS) {
                return { success: false, error: 'insufficient_coins', required: STREAK_FREEZE_COST_COINS, balance: coins.amount };
            }
            await accountEconomy.updateCurrency(playerId, 'coins', STREAK_FREEZE_COST_COINS, 'spend', 'streak_freeze');
        }
        else if (payWith === 'usd') {
            // Real-money purchase handled via Stripe checkout; this just records intent
            // The actual grant happens after payment confirmation via webhook.
            return { success: false, error: 'use_stripe_checkout', checkoutProduct: 'streak_freeze' };
        }
        else {
            return { success: false, error: 'invalid_payment_method' };
        }
        const expiresAt = nowMs + STREAK_FREEZE_DURATION_MS;
        this.streakFreezes.set(playerId, { expiresAt, purchasedAt: nowMs, payWith });
        logger.info('Streak freeze purchased', { playerId, payWith, expiresAt });
        return {
            success: true,
            freezeExpiresAt: expiresAt,
            durationHours: STREAK_FREEZE_DURATION_MS / (60 * 60 * 1000),
            payWith,
        };
    }
    /**
     * Grant a streak freeze after a successful real-money purchase.
     * Called from the economy service's webhook handler.
     */
    grantStreakFreezeViaPurchase(playerId, { nowMs = Date.now() } = {}) {
        if (this.hasActiveStreakFreeze(playerId, { nowMs })) {
            return { success: false, error: 'freeze_already_active' };
        }
        const expiresAt = nowMs + STREAK_FREEZE_DURATION_MS;
        this.streakFreezes.set(playerId, { expiresAt, purchasedAt: nowMs, payWith: 'usd' });
        logger.info('Streak freeze granted via purchase', { playerId, expiresAt });
        return { success: true, freezeExpiresAt: expiresAt };
    }
    /**
     * Consume a streak freeze when a player misses a daily login.
     * Returns true if a freeze was consumed (streak preserved), false otherwise.
     */
    consumeStreakFreeze(playerId, { nowMs = Date.now() } = {}) {
        const freeze = this.streakFreezes.get(playerId);
        if (!freeze || nowMs >= freeze.expiresAt) {
            this.streakFreezes.delete(playerId);
            return false;
        }
        this.streakFreezes.delete(playerId);
        logger.info('Streak freeze consumed', { playerId });
        return true;
    }
    // ========================================================================
    // INSTANT LIFE REFILL (USD)
    // ========================================================================
    /**
     * Create a Stripe checkout session for an instant life refill.
     * Price is set server-side from the catalog.
     */
    async createLifeRefillCheckout(playerId, { nowMs = Date.now() } = {}) {
        const productId = 'lives_refill';
        const product = productFor(productId);
        if (!product) {
            return { success: false, error: 'unknown_product' };
        }
        const price = priceFor(productId, nowMs);
        if (!price) {
            return { success: false, error: 'unknown_price' };
        }
        const successUrl = process.env.STRIPE_CHECKOUT_SUCCESS_URL;
        const cancelUrl = process.env.STRIPE_CHECKOUT_CANCEL_URL;
        if (!successUrl || !cancelUrl) {
            return { success: false, error: 'checkout_not_configured' };
        }
        const result = await StripeService.createCheckoutSession({
            amountCents: price.priceCents,
            currency: price.currency,
            productName: product.label || productId,
            metadata: {
                playerId,
                productId,
                priceCents: String(price.priceCents),
                quotedAtMs: String(nowMs),
            },
            clientReferenceId: playerId,
            successUrl,
            cancelUrl,
        });
        if (!result.success) {
            return { success: false, error: 'checkout_failed' };
        }
        return {
            success: true,
            productId,
            url: result.url,
            sessionId: result.sessionId,
            priceCents: price.priceCents,
            currency: price.currency,
        };
    }
    /**
     * Create a Stripe checkout session for a streak freeze purchase ($0.99).
     */
    async createStreakFreezeCheckout(playerId, { nowMs = Date.now() } = {}) {
        const productId = 'streak_freeze';
        const product = productFor(productId);
        if (!product) {
            return { success: false, error: 'unknown_product' };
        }
        const price = priceFor(productId, nowMs);
        if (!price) {
            return { success: false, error: 'unknown_price' };
        }
        const successUrl = process.env.STRIPE_CHECKOUT_SUCCESS_URL;
        const cancelUrl = process.env.STRIPE_CHECKOUT_CANCEL_URL;
        if (!successUrl || !cancelUrl) {
            return { success: false, error: 'checkout_not_configured' };
        }
        const result = await StripeService.createCheckoutSession({
            amountCents: price.priceCents,
            currency: price.currency,
            productName: product.label || productId,
            metadata: {
                playerId,
                productId,
                priceCents: String(price.priceCents),
                quotedAtMs: String(nowMs),
            },
            clientReferenceId: playerId,
            successUrl,
            cancelUrl,
        });
        if (!result.success) {
            return { success: false, error: 'checkout_failed' };
        }
        return {
            success: true,
            productId,
            url: result.url,
            sessionId: result.sessionId,
            priceCents: price.priceCents,
            currency: price.currency,
        };
    }
    /**
     * Grant lives after a successful life refill purchase.
     * Called from the Stripe webhook handler after payment confirmation.
     */
    async grantLifeRefill(playerId, amount = 5, { nowMs = Date.now() } = {}) {
        const playerEconomy = await accountEconomy.getPlayerEconomy(playerId);
        const lives = playerEconomy.currencies.lives;
        // Apply VIP max lives bonus
        const hasVip = await PurchaseLedgerDb.hasPurchase(playerId, 'vip');
        const maxLives = getMaxLives(hasVip, MAX_LIVES);
        const result = grantLives(lives, amount);
        // If lives were over max due to VIP, cap at the VIP max
        if (lives.amount > maxLives) {
            lives.amount = maxLives;
        }
        await accountEconomy.updatePlayerEconomyCache(playerId, playerEconomy);
        logger.info('Life refill granted', { playerId, livesAdded: result.livesAdded, livesRemaining: lives.amount });
        return {
            success: true,
            livesAdded: result.livesAdded,
            livesRemaining: lives.amount,
            maxLives,
        };
    }
    // ========================================================================
    // AD REWARD GRANT
    // ========================================================================
    /**
     * Grant a reward for watching a rewarded ad.
     * Limited to maxAdGrantsPerDay per player to prevent abuse.
     * rewardType: 'coins' or 'lives'
     */
    async grantAdReward(playerId, rewardType, { nowMs = Date.now() } = {}) {
        if (rewardType !== 'coins' && rewardType !== 'lives') {
            return { success: false, error: 'invalid_reward_type' };
        }
        // Check daily limit
        const todayStart = new Date(nowMs);
        todayStart.setUTCHours(0, 0, 0, 0);
        const todayStartMs = todayStart.getTime();
        const record = this.adGrants.get(playerId) || { lastGrantAt: 0, grantsToday: 0, grantDay: 0 };
        if (record.grantDay !== todayStartMs) {
            record.grantsToday = 0;
            record.grantDay = todayStartMs;
        }
        if (record.grantsToday >= this.maxAdGrantsPerDay) {
            return { success: false, error: 'daily_ad_limit_reached', limit: this.maxAdGrantsPerDay };
        }
        const playerEconomy = await accountEconomy.getPlayerEconomy(playerId);
        let amount;
        if (rewardType === 'coins') {
            amount = 50; // 50 coins per ad
            await accountEconomy.updateCurrency(playerId, 'coins', amount, 'earn', 'ad_reward');
        }
        else {
            // Lives: grant 1 life
            amount = 1;
            const lives = playerEconomy.currencies.lives;
            const hasVip = await PurchaseLedgerDb.hasPurchase(playerId, 'vip');
            const maxLives = getMaxLives(hasVip, MAX_LIVES);
            const result = grantLives(lives, amount);
            if (lives.amount > maxLives)
                lives.amount = maxLives;
            await accountEconomy.updatePlayerEconomyCache(playerId, playerEconomy);
        }
        record.grantsToday += 1;
        record.lastGrantAt = nowMs;
        this.adGrants.set(playerId, record);
        logger.info('Ad reward granted', { playerId, rewardType, amount, grantsToday: record.grantsToday });
        return {
            success: true,
            rewardType,
            amount,
            grantsToday: record.grantsToday,
            remainingToday: this.maxAdGrantsPerDay - record.grantsToday,
        };
    }
    // ========================================================================
    // PUBLIC VIEW
    // ========================================================================
    /**
     * Get a player's monetization status (for the client UI).
     */
    async getPlayerStatus(playerId, { nowMs = Date.now() } = {}) {
        const [continueStatus, streakFreeze, adRecord] = [
            this.canContinue(playerId, 0), // level 0 = generic check
            this.hasActiveStreakFreeze(playerId, { nowMs }),
            this.adGrants.get(playerId),
        ];
        const todayStart = new Date(nowMs);
        todayStart.setUTCHours(0, 0, 0, 0);
        const grantsToday = adRecord && adRecord.grantDay === todayStart.getTime() ? adRecord.grantsToday : 0;
        return {
            playerId,
            canContinue: continueStatus.canContinue,
            continuesRemaining: continueStatus.remaining,
            streakFreezeActive: streakFreeze,
            adGrantsToday: grantsToday,
            adGrantsRemaining: Math.max(0, this.maxAdGrantsPerDay - grantsToday),
            continueCostCoins: CONTINUE_COST_COINS,
            skipCostCoins: SKIP_LEVEL_COST_COINS,
            streakFreezeCostCoins: STREAK_FREEZE_COST_COINS,
            streakFreezeCostUsdCents: STREAK_FREEZE_COST_USD_CENTS,
        };
    }
    /**
     * Clear all in-memory state (testing only).
     */
    resetForTesting() {
        this.streakFreezes.clear();
        this.levelContinues.clear();
        this.levelSkips.clear();
        this.adGrants.clear();
    }
}
export const monetizationService = new MonetizationService();
export default MonetizationService;
//# sourceMappingURL=monetization-service.js.map