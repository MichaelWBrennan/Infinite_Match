import express from 'express';
import security, { requireMinRole } from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import { liveOpsToday, loadLiveOps } from '../services/live-ops/live-ops.js';
import { activeCompetitions, loadCompetitions, prizeForRank } from '../services/live-ops/competitions.js';
import { accountEconomy as accountEconomyService } from '../services/economy/AccountEconomyService.js';
import { socialStore } from '../services/social/social-store.js';
import PurchaseLedgerDb from '../services/payments/PurchaseLedgerDb.js';
import { grantSeasonXp } from '../services/meta/battlepass-season.js';
import { PRODUCTS } from '../services/payments/product-catalog.js';
import { priceFor } from '../services/live-ops/live-ops.js';

const router = express.Router();
const logger = new Logger('LiveOpsRoutes');

// Adds coins to a player under the economy lock and saves. Returns the new coin balance.
async function grantCoins(playerId, coins) {
  return accountEconomyService.withPlayerLock(playerId, async () => {
    const playerEconomy = await accountEconomyService.getPlayerEconomy(playerId);
    accountEconomyService.applyReward(playerEconomy, { type: 'currency', currencyId: 'coins', amount: coins });
    await accountEconomyService.updatePlayerEconomyCache(playerId, playerEconomy);
    return playerEconomy.currencies.coins.amount;
  });
}

// Public: the coin packs at their current price (with any active deal), and the live events.
// Prices are read from the server catalog, so the offers screen never shows a price the server would not charge.
router.get('/offers', (req, res) => {
  try {
    const now = Date.now();
    const config = loadLiveOps();
    const today = liveOpsToday(now, config);
    const coinPacks = Object.entries(PRODUCTS)
      .filter(([, p]) => p.kind === 'consumable' && p.grants?.currency === 'coins')
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
  } catch (error) {
    logger.error('Offers lookup failed', { error: error.message });
    res.status(500).json({ success: false, error: 'live_ops_error', requestId: req.requestId });
  }
});

// Today's deals and events. Each deal says whether the caller already owns the product.
router.get('/today', security.sessionValidation, async (req, res) => {
  try {
    const today = liveOpsToday(Date.now(), loadLiveOps());
    const playerId = req.user?.playerId;
    const deals = await Promise.all(
      today.deals.map(async (deal) => ({
        ...deal,
        owned: playerId ? await PurchaseLedgerDb.hasPurchase(playerId, deal.productId) : false,
      })),
    );
    res.json({ success: true, ...today, deals, requestId: req.requestId });
  } catch (error) {
    logger.error('Live ops lookup failed', { error: error.message });
    res.status(500).json({ success: false, error: 'live_ops_error', requestId: req.requestId });
  }
});

// Running tournaments (top rows and the caller's place) and community challenges (progress and
// whether the caller can claim).
router.get('/competitions', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const active = activeCompetitions(loadCompetitions(), Date.now());
    const tournaments = await Promise.all(
      active.tournaments.map(async (t) => {
        const board = await socialStore.tournamentBoard(t.id, playerId, 10);
        return {
          id: t.id,
          name: t.name,
          endsAt: new Date(t.endMs).toISOString(),
          prizes: t.prizes,
          entries: board.entries,
          you: board.you,
        };
      }),
    );
    const challenges = await Promise.all(
      active.challenges.map(async (c) => {
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
      }),
    );
    res.json({ success: true, tournaments, challenges, requestId: req.requestId });
  } catch (error) {
    logger.error('Competitions lookup failed', { error: error.message });
    res.status(500).json({ success: false, error: 'live_ops_error', requestId: req.requestId });
  }
});

// Claims a community challenge reward. The goal must be reached while the challenge runs, and
// the caller must have won at least one level inside it. Each player claims once.
router.post('/challenges/:id/claim', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const challenge = activeCompetitions(loadCompetitions(), Date.now()).challenges.find(
      (c) => c.id === req.params.id,
    );
    if (!challenge) return res.status(404).json({ success: false, error: 'challenge_not_active', requestId: req.requestId });

    const standing = await socialStore.challengeStanding(challenge.id, playerId);
    if (standing.progress < challenge.goal) {
      return res.status(409).json({ success: false, error: 'goal_not_reached', requestId: req.requestId });
    }
    if (standing.contributed < 1) {
      return res.status(403).json({ success: false, error: 'not_a_contributor', requestId: req.requestId });
    }

    const key = `challenge:${challenge.id}`;
    if (!(await socialStore.reservePayout(key, playerId))) {
      return res.status(409).json({ success: false, error: 'already_claimed', requestId: req.requestId });
    }
    try {
      const coins = await grantCoins(playerId, challenge.reward.coins);
      // The challenge's season XP is granted after the coins. A failure here is logged, not refunded.
      try {
        await grantSeasonXp(playerId, 'challenge_complete');
      } catch (error) {
        logger.error('Season XP for a challenge was not granted', { error: error.message, playerId });
      }
      res.json({ success: true, result: { reward: challenge.reward, balances: { coins } }, requestId: req.requestId });
    } catch (error) {
      await socialStore.releasePayout(key, playerId);
      throw error;
    }
  } catch (error) {
    logger.error('Challenge claim failed', { error: error.message });
    res.status(500).json({ success: false, error: 'live_ops_error', requestId: req.requestId });
  }
});

// Operator only. Pays the prizes of a finished tournament. Each player is paid once, so running
// this again pays nobody twice.
router.post('/tournaments/:id/settle', security.sessionValidation, requireMinRole('admin'), async (req, res) => {
  try {
    const tournament = loadCompetitions().tournaments.find((t) => t.id === req.params.id);
    if (!tournament) return res.status(404).json({ success: false, error: 'tournament_not_found', requestId: req.requestId });
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
      if (!coins) continue;
      const { playerId } = ranking[i];
      if (!(await socialStore.reservePayout(key, playerId))) {
        alreadyPaid.push(rank);
        continue;
      }
      try {
        await grantCoins(playerId, coins);
        paid.push({ rank, coins });
      } catch (error) {
        await socialStore.releasePayout(key, playerId);
        failed.push(rank);
        logger.error('Tournament prize failed', { error: error.message, rank });
      }
    }
    res.json({ success: failed.length === 0, result: { paid, alreadyPaid, failed }, requestId: req.requestId });
  } catch (error) {
    logger.error('Tournament settle failed', { error: error.message });
    res.status(500).json({ success: false, error: 'live_ops_error', requestId: req.requestId });
  }
});

export default router;
