import express from 'express';
import security, { requireMinRole } from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import { liveOpsToday, loadLiveOps } from '../services/live-ops/live-ops.js';
import { activeCompetitions, loadCompetitions, prizeForRank } from '../services/live-ops/competitions.js';
import { accountEconomy as accountEconomyService } from '../services/economy/AccountEconomyService.js';
import { socialStore } from '../services/social/social-store.js';
import PurchaseLedgerDb from '../services/payments/PurchaseLedgerDb.js';
import { loadSeasonSafely } from '../services/meta/battlepass-season.js';
import { isDurableEconomy } from '../services/economy/PlayerEconomyDb.js';
import { PRODUCTS } from '../services/payments/product-catalog.js';
import { priceFor } from '../services/live-ops/live-ops.js';
import { visibleWeeklyEvent, weeklyView, claimWeeklyMilestone, WeeklyEventError, weeklyDisabled } from '../services/live-ops/weekly-event.js';
import { claimScoreChallenge, scoreChallengeView, ScoreChallengeError } from '../services/live-ops/score-challenge-economy.js';
const router = express.Router();
const logger = new Logger('LiveOpsRoutes');
// A social-file reservation alone cannot prove an economy credit. Never treat an
// unreceipted held reservation as a successful payout in durable mode.
async function confirmedCompetitionPayout(playerId, key, amount) {
    if (!isDurableEconomy())
        return true; // Legacy memory-mode tests; production requires Mongo.
    return Boolean(await accountEconomyService.getCompetitionPayoutReceipt(playerId, key, amount));
}
// Public: the coin packs at their current price (with any active deal), and the live events.
// Prices are read from the server catalog, so the offers screen never shows a price the server would not charge.
router.get('/offers', (req, res) => {
    try {
        const now = Date.now();
        const config = loadLiveOps();
        const today = liveOpsToday(now, config);
        const coinPacks = Object.entries(PRODUCTS)
            .filter(([, p]) => p.kind === 'consumable' &&
            p.grants?.currency === 'coins' &&
            !p.tournamentEntry &&
            !p.pvpBooster)
            .map(([productId, product]) => {
            const price = priceFor(productId, now, config);
            const deal = today.deals.find((d) => d.productId === productId);
            return {
                productId,
                coins: product.grants.amount,
                priceCents: price.priceCents,
                catalogPriceCents: product.priceCents,
                currency: product.currency,
                deal: price.deal,
                endsAt: deal ? deal.endsAt : null,
            };
        });
        res.json({
            success: true,
            coinPacks,
            deals: today.deals,
            activeEvents: today.activeEvents,
            upcomingEvents: today.upcomingEvents,
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger.error('Offers lookup failed', { error: error.message });
        res.status(500).json({ success: false, error: 'live_ops_error', requestId: req.requestId });
    }
});
// Today's deals and events. Each deal says whether the caller already owns the product.
router.get('/today', security.sessionValidation, async (req, res) => {
    try {
        const today = liveOpsToday(Date.now(), loadLiveOps());
        const playerId = req.user?.playerId;
        const deals = await Promise.all(today.deals.map(async (deal) => ({
            ...deal,
            owned: playerId ? await PurchaseLedgerDb.hasPurchase(playerId, deal.productId) : false,
        })));
        res.json({ success: true, ...today, deals, requestId: req.requestId });
    }
    catch (error) {
        logger.error('Live ops lookup failed', { error: error.message });
        res.status(500).json({ success: false, error: 'live_ops_error', requestId: req.requestId });
    }
});
// Public schedule preview has no progress or player identifiers; guests can still see when
// the next free event runs. All timestamps are server-owned UTC instants.
router.get('/weekly/preview', (req, res) => {
    const now = Date.now();
    const event = weeklyView(visibleWeeklyEvent(loadLiveOps(), now), null, now);
    res.json({ success: true, event, disabled: weeklyDisabled(), serverNow: new Date(now).toISOString(), requestId: req.requestId });
});
router.get('/weekly', security.sessionValidation, async (req, res) => {
    try {
        const now = Date.now();
        const economy = await accountEconomyService.getPlayerEconomy(req.user.playerId);
        const event = weeklyView(visibleWeeklyEvent(loadLiveOps(), now), economy, now);
        res.json({ success: true, event, disabled: weeklyDisabled(), serverNow: new Date(now).toISOString(), requestId: req.requestId });
    }
    catch (error) {
        logger.error('Weekly event lookup failed', { error: error.message });
        res.status(500).json({ success: false, error: 'weekly_event_error', requestId: req.requestId });
    }
});
router.post('/weekly/claim', security.sessionValidation, async (req, res) => {
    try {
        const { eventId, wins } = req.body || {};
        const config = loadLiveOps();
        const result = await accountEconomyService.withPlayerLock(req.user.playerId, async () => {
            const economy = await accountEconomyService.getPlayerEconomy(req.user.playerId);
            const claim = claimWeeklyMilestone(economy, config, eventId, wins, Date.now());
            if (!claim.duplicate)
                await accountEconomyService.updatePlayerEconomyCache(req.user.playerId, economy);
            return claim;
        });
        logger.info('Weekly milestone claim', { playerId: req.user.playerId, eventId, wins, duplicate: result.duplicate });
        if (!result.duplicate)
            security.logSecurityEvent('weekly_milestone_claimed', {
                playerId: req.user.playerId, eventId, wins, coins: result.coins, ip: req.ip,
            });
        res.json({ success: true, result, requestId: req.requestId });
    }
    catch (error) {
        if (error instanceof WeeklyEventError)
            return res.status(error.code === 'weekly_event_not_found' ? 404 : 409)
                .json({ success: false, error: error.code, requestId: req.requestId });
        logger.error('Weekly milestone claim failed', { error: error.message });
        res.status(500).json({ success: false, error: 'weekly_event_error', requestId: req.requestId });
    }
});
// Personal score challenge: the public schedule (no progress), then the caller's progress.
router.get('/score-challenge/preview', (req, res) => {
    res.json({ success: true, ...scoreChallengeView(loadLiveOps(), null, Date.now()), requestId: req.requestId });
});
router.get('/score-challenge', security.sessionValidation, async (req, res) => {
    try {
        const economy = await accountEconomyService.getPlayerEconomy(req.user.playerId);
        res.json({ success: true, ...scoreChallengeView(loadLiveOps(), economy, Date.now()), requestId: req.requestId });
    }
    catch (error) {
        logger.error('Score challenge lookup failed', { error: error.message });
        res.status(500).json({ success: false, error: 'score_challenge_error', requestId: req.requestId });
    }
});
// Personal score challenge: claim one earned tier's coins, once. Progress is shown by the economy data.
router.post('/score-challenge/claim', security.sessionValidation, async (req, res) => {
    try {
        const { challengeId, threshold } = req.body || {};
        const config = loadLiveOps();
        const result = await accountEconomyService.withPlayerLock(req.user.playerId, async () => {
            const economy = await accountEconomyService.getPlayerEconomy(req.user.playerId);
            const claim = claimScoreChallenge(economy, config, challengeId, threshold, Date.now());
            if (!claim.duplicate)
                await accountEconomyService.updatePlayerEconomyCache(req.user.playerId, economy);
            return claim;
        });
        logger.info('Score challenge claim', { playerId: req.user.playerId, challengeId, threshold, duplicate: result.duplicate });
        if (!result.duplicate)
            security.logSecurityEvent('score_challenge_claimed', {
                playerId: req.user.playerId, challengeId, threshold, coins: result.coins, ip: req.ip,
            });
        res.json({ success: true, result, requestId: req.requestId });
    }
    catch (error) {
        if (error instanceof ScoreChallengeError) {
            const status = /not_found$/.test(error.code) ? 404 : 409;
            return res.status(status).json({ success: false, error: error.code, requestId: req.requestId });
        }
        logger.error('Score challenge claim failed', { error: error.message });
        res.status(500).json({ success: false, error: 'score_challenge_error', requestId: req.requestId });
    }
});
// Running tournaments (top rows and the caller's place) and community challenges (progress and
// whether the caller can claim).
router.get('/competitions', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        const active = activeCompetitions(loadCompetitions(), Date.now());
        const tournaments = await Promise.all(active.tournaments.map(async (t) => {
            const board = await socialStore.tournamentBoard(t.id, playerId, 10);
            return {
                id: t.id,
                name: t.name,
                endsAt: new Date(t.endMs).toISOString(),
                prizes: t.prizes,
                entries: board.entries,
                you: board.you,
            };
        }));
        const challenges = await Promise.all(active.challenges.map(async (c) => {
            const standing = await socialStore.challengeStanding(c.id, playerId);
            const claimed = await socialStore.hasPayout(`challenge:${c.id}`, playerId);
            return {
                id: c.id,
                name: c.name,
                endsAt: new Date(c.endMs).toISOString(),
                goal: c.goal,
                progress: standing.progress,
                contributed: standing.contributed,
                reward: c.reward,
                claimed,
                canClaim: standing.progress >= c.goal && standing.contributed > 0 && !claimed,
            };
        }));
        res.json({ success: true, tournaments, challenges, requestId: req.requestId });
    }
    catch (error) {
        logger.error('Competitions lookup failed', { error: error.message });
        res.status(500).json({ success: false, error: 'live_ops_error', requestId: req.requestId });
    }
});
// Claims a community challenge reward. The goal must be reached while the challenge runs, and
// the caller must have won at least one level inside it. Each player claims once.
router.post('/challenges/:id/claim', security.sessionValidation, async (req, res) => {
    try {
        const { playerId } = req.user;
        const challenge = activeCompetitions(loadCompetitions(), Date.now()).challenges.find((c) => c.id === req.params.id);
        if (!challenge)
            return res.status(404).json({ success: false, error: 'challenge_not_active', requestId: req.requestId });
        const standing = await socialStore.challengeStanding(challenge.id, playerId);
        if (standing.progress < challenge.goal) {
            return res.status(409).json({ success: false, error: 'goal_not_reached', requestId: req.requestId });
        }
        if (standing.contributed < 1) {
            return res.status(403).json({ success: false, error: 'not_a_contributor', requestId: req.requestId });
        }
        const key = `challenge:${challenge.id}`;
        if (!(await socialStore.reservePayout(key, playerId))) {
            const confirmed = await confirmedCompetitionPayout(playerId, key, challenge.reward.coins);
            return res.status(confirmed ? 409 : 503).json({ success: false,
                error: confirmed ? 'already_claimed' : 'payout_unconfirmed', requestId: req.requestId });
        }
        try {
            const season = await loadSeasonSafely();
            const payout = await accountEconomyService.grantCompetitionRewardOnce(playerId, key, challenge.reward.coins, season);
            res.json({ success: true, result: { reward: challenge.reward,
                    balances: { coins: payout.balance }, duplicate: payout.duplicate }, requestId: req.requestId });
        }
        catch (error) {
            // The economy write might have committed. Its receipt makes redelivery safe,
            // but the absent receipt on a held claim is not proof of nonpayment.
            await socialStore.releasePayout(key, playerId);
            throw error;
        }
    }
    catch (error) {
        logger.error('Challenge claim failed', { error: error.message });
        res.status(500).json({ success: false, error: 'live_ops_error', requestId: req.requestId });
    }
});
// Operator only. Pays the prizes of a finished tournament. Each player is paid once, so running
// this again pays nobody twice.
router.post('/tournaments/:id/settle', security.sessionValidation, requireMinRole('admin'), async (req, res) => {
    try {
        const tournament = loadCompetitions().tournaments.find((t) => t.id === req.params.id);
        if (!tournament)
            return res.status(404).json({ success: false, error: 'tournament_not_found', requestId: req.requestId });
        if (Date.now() <= tournament.endMs) {
            return res.status(409).json({ success: false, error: 'tournament_not_ended', requestId: req.requestId });
        }
        const ranking = await socialStore.tournamentRanking(tournament.id);
        const key = `tournament:${tournament.id}`;
        const paid = [];
        const alreadyPaid = [];
        const failed = [];
        for (let i = 0; i < ranking.length; i++) {
            const rank = i + 1;
            const coins = prizeForRank(tournament, rank);
            if (!coins)
                continue;
            const { playerId } = ranking[i];
            if (!(await socialStore.reservePayout(key, playerId))) {
                if (await confirmedCompetitionPayout(playerId, key, coins))
                    alreadyPaid.push(rank);
                else
                    failed.push(rank); // Held without proof: manual reconciliation, never report paid.
                continue;
            }
            try {
                const payout = await accountEconomyService.grantCompetitionRewardOnce(playerId, key, coins);
                if (payout.duplicate)
                    alreadyPaid.push(rank);
                else
                    paid.push({ rank, coins });
            }
            catch (error) {
                await socialStore.releasePayout(key, playerId);
                failed.push(rank);
                logger.error('Tournament prize failed', { error: error.message, rank });
            }
        }
        res.json({ success: failed.length === 0, result: { paid, alreadyPaid, failed }, requestId: req.requestId });
    }
    catch (error) {
        logger.error('Tournament settle failed', { error: error.message });
        res.status(500).json({ success: false, error: 'live_ops_error', requestId: req.requestId });
    }
});
// Upcoming events calendar: all deals, tournaments, challenges, score challenges,
// and weekly events whose start time is in the future, sorted by start time.
router.get('/calendar', security.sessionValidation, async (req, res) => {
    try {
        const now = Date.now();
        const config = loadLiveOps();
        const events = [];
        // Deals
        for (const deal of config.deals || []) {
            const start = Date.parse(deal.start);
            const end = Date.parse(deal.end);
            if (start && end && end > now) {
                events.push({
                    type: 'deal',
                    id: deal.id,
                    name: deal.name,
                    productId: deal.productId,
                    priceCents: deal.priceCents,
                    catalogPriceCents: deal.catalogPriceCents,
                    startsAt: new Date(start).toISOString(),
                    endsAt: new Date(end).toISOString(),
                });
            }
        }
        // Tournaments
        for (const t of config.tournaments || []) {
            events.push({
                type: 'tournament',
                id: t.id,
                name: t.name,
                description: t.description,
                startsAt: new Date(t.startMs).toISOString(),
                endsAt: new Date(t.endMs).toISOString(),
                prizes: t.prizes,
            });
        }
        // Community challenges
        for (const c of config.challenges || []) {
            events.push({
                type: 'challenge',
                id: c.id,
                name: c.name,
                description: c.description,
                startsAt: new Date(c.startMs).toISOString(),
                endsAt: new Date(c.endMs).toISOString(),
                goal: c.goal,
                reward: c.reward,
            });
        }
        // Score challenges
        for (const c of config.scoreChallenges || []) {
            const start = Date.parse(c.start);
            const end = Date.parse(c.end);
            if (start && end && end > now) {
                events.push({
                    type: 'score_challenge',
                    id: c.id,
                    name: c.name,
                    target: c.target,
                    tiers: c.tiers,
                    startsAt: new Date(start).toISOString(),
                    endsAt: new Date(end).toISOString(),
                });
            }
        }
        // Weekly events
        for (const w of config.weeklyEvents || []) {
            const start = Date.parse(w.start);
            const end = Date.parse(w.end);
            if (start && end && end > now) {
                events.push({
                    type: 'weekly_event',
                    id: w.id,
                    name: w.name,
                    description: w.description,
                    startsAt: new Date(start).toISOString(),
                    endsAt: new Date(end).toISOString(),
                    milestones: w.milestones,
                });
            }
        }
        events.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
        res.json({ success: true, events, serverNow: new Date(now).toISOString(), requestId: req.requestId });
    }
    catch (error) {
        logger.error('Event calendar lookup failed', { error: error.message });
        res.status(500).json({ success: false, error: 'live_ops_error', requestId: req.requestId });
    }
});
export default router;
//# sourceMappingURL=live-ops.js.map