import express from 'express';

import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import { socialStore, SocialError } from '../services/social/social-store.js';
import { accountEconomy as accountEconomyService } from '../services/economy/AccountEconomyService.js';
import { notifyPlayer } from '../services/push/push-service.js';

const router = express.Router();
const logger = new Logger('SocialRoutes');

const ERROR_STATUS = {
  invalid_name: 400,
  self_request: 400,
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

// Guild milestone (S3): this week's shared goal. Progress is counted only from server-verified wins.
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

export default router;
