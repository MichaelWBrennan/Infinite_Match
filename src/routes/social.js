import express from 'express';

import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import { socialStore, SocialError } from '../services/social/social-store.js';
import { accountEconomy as accountEconomyService } from '../services/economy/AccountEconomyService.js';
import { notifyPlayer } from '../services/push/push-service.js';
import {
  generateInvite,
  validateInviteCode,
  useInviteCode,
  getInvitedBy,
  getPlayerInvites,
  reachMilestone,
  getInviteStats,
} from '../services/social/friend-invites/friend-invites.js';

const router = express.Router();
const logger = new Logger('SocialRoutes');

const ERROR_STATUS = {
  invalid_name: 400,
  self_request: 400,
  self_challenge: 409,
  code_not_found: 404,
  guild_not_found: 404,
  no_request: 404,
  not_friends: 404,
  not_in_guild: 404,
  name_taken: 409,
  name_required: 409,
  guild_name_taken: 409,
  already_friends: 409,
  already_requested: 409,
  already_in_guild: 409,
  guild_full: 409,
  friend_limit: 409,
  friend_limit_target: 409,
  invalid_gift: 400,
  self_gift: 400,
  gift_id_reused: 409,
  gift_sender_limit: 409,
  gift_receiver_limit: 409,
  gift_not_found: 404,
  invalid_gift_type: 400,
  invalid_booster: 400,
  invalid_attempt: 400,
  milestone_not_reached: 409,
  no_milestone_contribution: 409,
  milestone_not_found: 404,
  milestone_wallet_full: 409,
  // Shared store contention: retryable, so the client should try again rather than treat it as a refusal.
  social_store_busy: 503,
};

const handleError = (res, error, requestId) => {
  if (error instanceof SocialError) {
    return res.status(ERROR_STATUS[error.code] || 400).json({ success: false, error: error.code, requestId });
  }
  logger.error('Social request failed', { error: error.message });
  return res.status(500).json({ success: false, error: 'social_error', requestId });
};

const idParam = (value) => (typeof value === 'string' && value.length > 0 && value.length <= 100 ? value : null);

// Everything here is about the caller. Friend and guild data is shown to members only, and
// leaderboards show names or anonymous labels, not player ids.
router.use(security.sessionValidation);

router.get('/me', async (req, res) => {
  try {
    res.json({ success: true, profile: await socialStore.profile(req.user.playerId), requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

router.put('/name', async (req, res) => {
  try {
    const result = await socialStore.setName(req.user.playerId, req.body?.name);
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

router.get('/friends', async (req, res) => {
  try {
    res.json({ success: true, ...(await socialStore.friends(req.user.playerId)), requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

router.get('/friends/leaderboard', async (req, res) => {
  try {
    const rows = await socialStore.friendBoard(req.user.playerId);
    res.json({ success: true, rows, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

router.post('/friends/request', async (req, res) => {
  try {
    const result = await socialStore.requestFriend(req.user.playerId, req.body?.code);
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

router.post('/friends/:playerId/accept', async (req, res) => {
  const other = idParam(req.params.playerId);
  if (!other) return res.status(400).json({ success: false, error: 'invalid_player', requestId: req.requestId });
  try {
    const result = await socialStore.acceptFriend(req.user.playerId, other);
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

router.post('/friends/:playerId/decline', async (req, res) => {
  const other = idParam(req.params.playerId);
  if (!other) return res.status(400).json({ success: false, error: 'invalid_player', requestId: req.requestId });
  try {
    const result = await socialStore.declineFriend(req.user.playerId, other);
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

// Energy gift (S2): a friend gives one energy. Recorded in the shared social store first, then
// credited to the receiver once (the economy keeps a receipt per gift id). A retry with the same
// giftId is safe at both steps.
router.post('/gifts/energy', async (req, res) => {
  const receiverId = idParam(req.body?.receiverId);
  if (!receiverId) return res.status(400).json({ success: false, error: 'invalid_player', requestId: req.requestId });
  try {
    const nowMs = Date.now();
    const { gift, reserved } = await socialStore.reserveEnergyGift(req.user.playerId, receiverId, req.body?.giftId, nowMs);
    const credit = await accountEconomyService.creditEnergyGift(receiverId, gift.id, gift.amount, nowMs);
    if (gift.status !== 'credited') await socialStore.markEnergyGiftCredited(gift.id, credit.credited);
    // Notify the receiver they have a new energy gift (fire and forget; push is best-effort).
    void notifyPlayer({
      userId: receiverId,
      title: 'Energy gift received',
      body: 'A friend sent you an energy gift!',
      data: { type: 'energy_gift', from: req.user.playerId, giftId: gift.id },
    });
    res.json({ success: true, result: { giftId: gift.id, credited: credit.credited, duplicate: !reserved || credit.duplicate },
      requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

// Booster gift (S2): a friend gives one booster. Recorded in the shared social store first, then
// credited to the receiver once (the economy keeps a receipt per gift id). A retry with the same
// giftId is safe at both steps.
router.post('/gifts/booster', async (req, res) => {
  const receiverId = idParam(req.body?.receiverId);
  const boosterId = typeof req.body?.boosterId === 'string' ? req.body.boosterId : null;
  if (!receiverId) return res.status(400).json({ success: false, error: 'invalid_player', requestId: req.requestId });
  if (!boosterId) return res.status(400).json({ success: false, error: 'invalid_booster', requestId: req.requestId });
  try {
    const nowMs = Date.now();
    const { gift, reserved } = await socialStore.reserveEnergyGift(
      req.user.playerId, receiverId, req.body?.giftId, nowMs, 'booster', boosterId);
    const credit = await accountEconomyService.creditBoosterGift(receiverId, gift.id, gift.boosterId, gift.amount, nowMs);
    if (gift.status !== 'credited') await socialStore.markEnergyGiftCredited(gift.id, credit.credited);
    // Notify the receiver they have a new booster gift (fire and forget; push is best-effort).
    void notifyPlayer({
      userId: receiverId,
      title: 'Booster gift received',
      body: 'A friend sent you a booster!',
      data: { type: 'booster_gift', from: req.user.playerId, giftId: gift.id, boosterId },
    });
    res.json({ success: true, result: { giftId: gift.id, boosterId: gift.boosterId, credited: credit.credited,
      duplicate: !reserved || credit.duplicate }, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

// Gift inbox: view pending (unclaimed) energy and booster gifts sent to the player.
router.get('/gifts/inbox', async (req, res) => {
  try {
    const playerId = req.user.playerId;
    const inbox = await socialStore.read((d) => {
      const now = Date.now();
      const energyGifts = Object.values(d.energyGifts || {})
        .filter((g) => g.to === playerId && g.status !== 'credited')
        .map((g) => ({
          giftId: g.id,
          type: 'energy',
          from: g.from,
          amount: g.amount,
          createdAt: g.createdAt,
          status: g.status,
        }));
      const boosterGifts = Object.values(d.boosterGifts || {})
        .filter((g) => g.to === playerId && g.status !== 'credited')
        .map((g) => ({
          giftId: g.id,
          type: 'booster',
          from: g.from,
          boosterId: g.boosterId,
          amount: g.amount,
          createdAt: g.createdAt,
          status: g.status,
        }));
      const all = [...energyGifts, ...boosterGifts].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      return { gifts: all, count: all.length };
    });
    res.json({ success: true, result: inbox, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

// ----- friend invites ----------------------------------------------------------

// Generate a new invite code for the player.
router.post('/invites/generate', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const result = generateInvite(playerId);
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    logger.error('Generate invite failed', { error: error.message });
    res.status(500).json({ success: false, error: 'invite_generate_error', requestId: req.requestId });
  }
});

// Get all invites generated by the player.
router.get('/invites/mine', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const result = getPlayerInvites(playerId);
    res.json({ success: true, invites: result, requestId: req.requestId });
  } catch (error) {
    logger.error('Get player invites failed', { error: error.message });
    res.status(500).json({ success: false, error: 'invites_get_error', requestId: req.requestId });
  }
});

// Get invite statistics for the player.
router.get('/invites/stats', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const result = getInviteStats(playerId);
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    logger.error('Get invite stats failed', { error: error.message });
    res.status(500).json({ success: false, error: 'invite_stats_error', requestId: req.requestId });
  }
});

// Validate an invite code (public - no session required).
router.get('/invites/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = validateInviteCode(code);
    res.json({ success: result.valid, invite: result.invite, reason: result.reason, requestId: req.requestId });
  } catch (error) {
    logger.error('Validate invite failed', { error: error.message });
    res.status(500).json({ success: false, error: 'invite_validate_error', requestId: req.requestId });
  }
});

// Record that a player reached an invite milestone (e.g., first level win).
// Grants rewards to both inviter and invitee.
router.post('/invites/milestone', security.sessionValidation, async (req, res) => {
  try {
    const { playerId } = req.user;
    const { code, milestone } = req.body || {};
    if (!code || !milestone) {
      return res.status(400).json({ success: false, error: 'code and milestone required', requestId: req.requestId });
    }

    // Verify this player was invited by this code
    const invitedBy = getInvitedBy(playerId);
    if (invitedBy !== code) {
      return res.status(403).json({ success: false, error: 'invite_mismatch', requestId: req.requestId });
    }

    const result = reachMilestone(code, milestone);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.reason, requestId: req.requestId });
    }

    // Grant rewards to both players
    if (result.inviteeReward?.coins) {
      await accountEconomyService.applyReward(
        await accountEconomyService.getPlayerEconomy(playerId),
        { type: 'currency', currencyId: 'coins', amount: result.inviteeReward.coins },
      );
    }
    if (result.inviterReward?.coins) {
      const inviterEconomy = await accountEconomyService.getPlayerEconomy(result.inviterId);
      await accountEconomyService.applyReward(
        inviterEconomy,
        { type: 'currency', currencyId: 'coins', amount: result.inviterReward.coins },
      );
      await accountEconomyService.updatePlayerEconomyCache(result.inviterId, inviterEconomy);
    }

    res.json({
      success: true,
      milestone,
      inviterReward: result.inviterReward,
      inviteeReward: result.inviteeReward,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('Invite milestone failed', { error: error.message });
    res.status(500).json({ success: false, error: 'invite_milestone_error', requestId: req.requestId });
  }
});

// ----- guild milestone ---------------------------------------------------------
router.get('/milestone', async (req, res) => {
  try {
    const result = await socialStore.milestoneView(req.user.playerId, Date.now());
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

// A member who contributed claims the reward once. The economy grant is idempotent per milestone,
// so a retry after a lost response does not grant twice.
router.post('/milestone/claim', async (req, res) => {
  const playerId = req.user.playerId;
  try {
    const nowMs = Date.now();
    const claim = await socialStore.milestoneClaim(playerId, nowMs);
    const grant = await accountEconomyService.creditMilestoneReward(playerId, claim.key, claim.coins, nowMs);
    if (!claim.claimed) await socialStore.markMilestoneClaimed(claim.key, playerId, nowMs);
    res.json({ success: true, result: { week: claim.week, coins: claim.coins, duplicate: grant.duplicate || claim.claimed },
      requestId: req.requestId });
  } catch (error) {
    if (error?.code === 'milestone_wallet_full') {
      return res.status(409).json({ success: false, error: 'milestone_wallet_full', requestId: req.requestId });
    }
    handleError(res, error, req.requestId);
  }
});

router.delete('/friends/:playerId', async (req, res) => {
  const other = idParam(req.params.playerId);
  if (!other) return res.status(400).json({ success: false, error: 'invalid_player', requestId: req.requestId });
  try {
    const result = await socialStore.removeFriend(req.user.playerId, other);
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

router.get('/guilds', async (req, res) => {
  try {
    const guilds = await socialStore.listGuilds(Number(req.query.limit) || 20);
    res.json({ success: true, guilds, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

router.get('/guilds/mine', async (req, res) => {
  try {
    res.json({ success: true, guild: await socialStore.myGuild(req.user.playerId), requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

router.post('/guilds', async (req, res) => {
  try {
    const result = await socialStore.createGuild(req.user.playerId, req.body?.name);
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

router.post('/guilds/:guildId/join', async (req, res) => {
  const guildId = idParam(req.params.guildId);
  if (!guildId) return res.status(400).json({ success: false, error: 'invalid_guild', requestId: req.requestId });
  try {
    const result = await socialStore.joinGuild(req.user.playerId, guildId);
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

router.post('/guilds/leave', async (req, res) => {
  try {
    const result = await socialStore.leaveGuild(req.user.playerId);
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

// ----- friend challenges ---------------------------------------------------

router.post('/friend-challenges', async (req, res) => {
  try {
    const fromId = req.user.playerId;
    const { toId, gameType = 'match3_versus', targetScore = 1000 } = req.body || {};

    if (!toId) {
      return res.status(400).json({ success: false, error: 'toId is required', requestId: req.requestId });
    }

    const result = await socialStore.createFriendChallenge(fromId, toId, gameType, targetScore);
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

router.post('/friend-challenges/:challengeId/accept', async (req, res) => {
  try {
    const playerId = req.user.playerId;
    const { challengeId } = req.params;
    const result = await socialStore.acceptFriendChallenge(playerId, challengeId);
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

router.post('/friend-challenges/:challengeId/decline', async (req, res) => {
  try {
    const playerId = req.user.playerId;
    const { challengeId } = req.params;
    const result = await socialStore.declineFriendChallenge(playerId, challengeId);
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

router.get('/friend-challenges/pending', async (req, res) => {
  try {
    const playerId = req.user.playerId;
    const challenges = await socialStore.getPendingFriendChallenges(playerId);
    res.json({ success: true, challenges, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

router.get('/friend-challenges', async (req, res) => {
  try {
    const playerId = req.user.playerId;
    const challenges = await socialStore.getFriendChallenges(playerId);
    res.json({ success: true, challenges, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

router.post('/friend-challenges/:challengeId/result', async (req, res) => {
  try {
    const playerId = req.user.playerId;
    const { challengeId } = req.params;
    const { winnerId, scores = {} } = req.body || {};

    if (!winnerId) {
      return res.status(400).json({ success: false, error: 'winnerId is required', requestId: req.requestId });
    }

    const result = await socialStore.reportFriendChallengeResult(playerId, challengeId, winnerId, scores);
    res.json({ success: true, result, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

router.get('/friend-challenges/leaderboard', async (req, res) => {
  try {
    const playerId = req.user.playerId;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const leaderboard = await socialStore.friendChallengeLeaderboard(playerId, limit);
    res.json({ success: true, leaderboard, requestId: req.requestId });
  } catch (error) {
    handleError(res, error, req.requestId);
  }
});

export default router;
