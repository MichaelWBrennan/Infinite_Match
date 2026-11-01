/**
 * Push notification trigger engine.
 *
 * Defines the trigger conditions that automatically send push notifications to
 * players based on game events. Each trigger has a type, a title/body template,
 * and an `evaluate` function that receives the player's economy and game context
 * and returns { shouldSend, title, body, data } or null.
 *
 * Player preferences (which trigger types are enabled) are stored per player and
 * can be managed through the /api/push/triggers routes.
 *
 * Triggers are intentionally best-effort: failures are logged and never block
 * the game flow that triggered them.
 */

import { notifyPlayer } from './push-service.js';
import { Logger } from '../../core/logger/index.js';

const logger = new Logger('PushTriggers');

// Per-player trigger preferences: playerId -> Set of enabled trigger types.
// In production this should be persisted (e.g. in the player economy or a Db).
const playerPreferences = new Map();

function getPreferences(playerId) {
  let prefs = playerPreferences.get(playerId);
  if (!prefs) {
    prefs = new Set([
      'energy_full',
      'streak_reminder',
      'battle_pass_ending',
      'tournament_starting',
      'comeback',
      'new_level',
      'limited_offer',
      'gift_received',
    ]);
    playerPreferences.set(playerId, prefs);
  }
  return prefs;
}

function isEnabled(playerId, triggerType) {
  return getPreferences(playerId).has(triggerType);
}

function setEnabled(playerId, triggerType, enabled) {
  const prefs = getPreferences(playerId);
  if (enabled) prefs.add(triggerType);
  else prefs.delete(triggerType);
}

function getAll(playerId) {
  const prefs = getPreferences(playerId);
  return {
    energy_full: prefs.has('energy_full'),
    streak_reminder: prefs.has('streak_reminder'),
    battle_pass_ending: prefs.has('battle_pass_ending'),
    tournament_starting: prefs.has('tournament_starting'),
    comeback: prefs.has('comeback'),
    new_level: prefs.has('new_level'),
    limited_offer: prefs.has('limited_offer'),
    gift_received: prefs.has('gift_received'),
  };
}

/**
 * Trigger definitions. Each entry:
 *   type        - unique trigger identifier
 *   title/body  - default templates (can include {placeholders})
 *   cooldownMs  - minimum time between sends for the same player+trigger
 *   evaluate    - (context) => { shouldSend, title, body, data } | null
 */
const TRIGGERS = Object.freeze({
  energy_full: {
    type: 'energy_full',
    title: 'Energy is full!',
    body: 'Your energy has recharged. Come back and play more levels!',
    cooldownMs: 4 * 60 * 60 * 1000, // 4 hours
    evaluate: ({ playerId, economy, nowMs }) => {
      const energy = economy.currencies?.energy;
      if (!energy || energy.amount < energy.maxAmount) return null;
      if (energy.lastNotifiedFull && nowMs - energy.lastNotifiedFull < 60 * 60 * 1000) return null;
      return {
        shouldSend: true,
        title: 'Energy is full!',
        body: 'Your energy has recharged. Come back and play more levels!',
        data: { type: 'energy_full', playerId },
      };
    },
  },

  streak_reminder: {
    type: 'streak_reminder',
    title: "Don't break your streak!",
    body: "You're on a {streak}-day login streak. Log in today to keep it going!",
    cooldownMs: 24 * 60 * 60 * 1000, // 24 hours
    evaluate: ({ playerId, economy, nowMs }) => {
      const dailyRewards = economy.dailyRewards;
      if (!dailyRewards || dailyRewards.streak < 2) return null;
      const lastClaimed = dailyRewards.lastClaimed
        ? new Date(dailyRewards.lastClaimed).getTime()
        : 0;
      const now = new Date().getTime();
      const msPerDay = 24 * 60 * 60 * 1000;
      // If last claim was yesterday, remind them today
      if (now - lastClaimed > msPerDay && now - lastClaimed < msPerDay * 2) {
        return {
          shouldSend: true,
          title: "Don't break your streak!",
          body: `You're on a ${dailyRewards.streak}-day login streak. Log in today to keep it going!`,
          data: { type: 'streak_reminder', playerId, streak: dailyRewards.streak },
        };
      }
      return null;
    },
  },

  battle_pass_ending: {
    type: 'battle_pass_ending',
    title: 'Battle Pass ending soon!',
    body: 'Your season ends in {days} days. Claim your remaining rewards before it\'s too late!',
    cooldownMs: 24 * 60 * 60 * 1000, // 24 hours
    evaluate: ({ playerId, season, nowMs }) => {
      if (!season || season.status !== 'active') return null;
      const endMs = new Date(season.endsAt || season.endMs || 0).getTime();
      const daysLeft = Math.ceil((endMs - nowMs) / (24 * 60 * 60 * 1000));
      if (daysLeft > 0 && daysLeft <= 3) {
        return {
          shouldSend: true,
          title: 'Battle Pass ending soon!',
          body: `Your season ends in ${daysLeft} days. Claim your remaining rewards before it's too late!`,
          data: { type: 'battle_pass_ending', playerId, daysLeft },
        };
      }
      return null;
    },
  },

  tournament_starting: {
    type: 'tournament_starting',
    title: 'Tournament starting soon!',
    body: 'A new tournament begins in {minutes} minutes. Join before it fills up!',
    cooldownMs: 6 * 60 * 60 * 1000, // 6 hours
    evaluate: ({ playerId, tournament, nowMs }) => {
      if (!tournament || tournament.status !== 'registration') return null;
      const startMs = tournament.startMs || 0;
      const minutesLeft = Math.ceil((startMs - nowMs) / (60 * 1000));
      if (minutesLeft > 0 && minutesLeft <= 60) {
        return {
          shouldSend: true,
          title: 'Tournament starting soon!',
          body: `A new tournament begins in ${minutesLeft} minutes. Join before it fills up!`,
          data: { type: 'tournament_starting', playerId, tournamentId: tournament.id },
        };
      }
      return null;
    },
  },

  comeback: {
    type: 'comeback',
    title: 'We miss you!',
    body: "It's been {days} days since you last played. Come back and claim your daily reward!",
    cooldownMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    evaluate: ({ playerId, economy, nowMs }) => {
      const dailyRewards = economy.dailyRewards;
      if (!dailyRewards || !dailyRewards.lastClaimed) return null;
      const lastClaimed = new Date(dailyRewards.lastClaimed).getTime();
      const daysOffline = Math.floor((nowMs - lastClaimed) / (24 * 60 * 60 * 1000));
      if (daysOffline >= 3 && daysOffline <= 14) {
        return {
          shouldSend: true,
          title: 'We miss you!',
          body: `It's been ${daysOffline} days since you last played. Come back and claim your daily reward!`,
          data: { type: 'comeback', playerId, daysOffline },
        };
      }
      return null;
    },
  },

  new_level: {
    type: 'new_level',
    title: 'New levels available!',
    body: 'New levels have been added. Come check them out!',
    cooldownMs: 24 * 60 * 60 * 1000, // 24 hours
    evaluate: ({ playerId, newLevels, nowMs }) => {
      if (!newLevels || newLevels.length === 0) return null;
      return {
        shouldSend: true,
        title: 'New levels available!',
        body: `${newLevels.length} new level(s) have been added. Come check them out!`,
        data: { type: 'new_level', playerId, levels: newLevels },
      };
    },
  },

  limited_offer: {
    type: 'limited_offer',
    title: 'Limited-time offer!',
    body: 'A special deal is available for the next {hours} hours only.',
    cooldownMs: 12 * 60 * 60 * 1000, // 12 hours
    evaluate: ({ playerId, offer, nowMs }) => {
      if (!offer) return null;
      return {
        shouldSend: true,
        title: 'Limited-time offer!',
        body: `A special deal is available for the next ${offer.hours || 24} hours only.`,
        data: { type: 'limited_offer', playerId, offerId: offer.id || 'unknown' },
      };
    },
  },

  gift_received: {
    type: 'gift_received',
    title: 'Gift received!',
    body: '{sender} sent you a {giftType}! Open it to claim your reward.',
    cooldownMs: 0, // no cooldown - every gift should notify
    evaluate: ({ playerId, sender, giftType, giftId }) => {
      return {
        shouldSend: true,
        title: 'Gift received!',
        body: `${sender || 'A friend'} sent you a ${giftType || 'gift'}! Open it to claim your reward.`,
        data: { type: 'gift_received', playerId, sender, giftType, giftId },
      };
    },
  },
});

/**
 * Returns the trigger definition for a type, or null.
 */
export function getTrigger(type) {
  return TRIGGERS[type] || null;
}

/**
 * Returns all trigger definitions (without evaluate functions, for client exposure).
 */
export function getAllTriggers() {
  return Object.fromEntries(
    Object.entries(TRIGGERS).map(([type, def]) => [
      type,
      { type: def.type, title: def.title, body: def.body, cooldownMs: def.cooldownMs },
    ]),
  );
}

/**
 * Evaluates all applicable triggers for a given event context and sends
 * notifications for those that should fire. Returns the list of sent triggers.
 *
 * context must include: playerId
 * Optional context fields depend on the trigger being evaluated:
 *   economy, season, tournament, newLevels, offer, sender, giftType, giftId, nowMs
 */
export async function evaluateTriggers(context) {
  const { playerId } = context;
  if (!playerId) return [];

  const nowMs = context.nowMs ?? Date.now();
  const sent = [];

  for (const [type, def] of Object.entries(TRIGGERS)) {
    if (!isEnabled(playerId, type)) continue;

    // Cooldown check
    const cooldownKey = `${playerId}:${type}`;
    const lastSent = triggerLastSent.get(cooldownKey);
    if (lastSent !== undefined && nowMs - lastSent < def.cooldownMs) continue;

    try {
      const result = def.evaluate({ ...context, nowMs });
      if (result && result.shouldSend) {
        await notifyPlayer({
          userId: playerId,
          title: result.title,
          body: result.body,
          data: result.data,
        });
        triggerLastSent.set(cooldownKey, nowMs);
        sent.push({ type, title: result.title, body: result.body });
      }
    } catch (error) {
      logger.warn(`Trigger ${type} failed for player ${playerId}`, {
        error: error.message,
      });
    }
  }

  return sent;
}

/**
 * Send a specific named trigger to a player (e.g. after a gift is received).
 * Bypasses the generic evaluate loop and uses the trigger's template directly.
 */
export async function sendTrigger(playerId, type, templateVars = {}) {
  const def = TRIGGERS[type];
  if (!def) return { sent: false, reason: 'unknown_trigger' };

  if (!isEnabled(playerId, type)) return { sent: false, reason: 'disabled' };

  const nowMs = Date.now();
  const cooldownKey = `${playerId}:${type}`;
  const lastSent = triggerLastSent.get(cooldownKey);
  if (lastSent !== undefined && nowMs - lastSent < def.cooldownMs) {
    return { sent: false, reason: 'cooldown' };
  }

  let title = def.title;
  let body = def.body;
  // Simple placeholder replacement: {key} -> value
  for (const [key, value] of Object.entries(templateVars)) {
    title = title.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    body = body.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }

  try {
    await notifyPlayer({
      userId: playerId,
      title,
      body,
      data: { type, playerId, ...templateVars },
    });
    triggerLastSent.set(cooldownKey, nowMs);
    return { sent: true, title, body };
  } catch (error) {
    logger.warn(`Send trigger ${type} failed for player ${playerId}`, {
      error: error.message,
    });
    return { sent: false, reason: error.message };
  }
}

/** In-memory cooldown store: `${playerId}:${type}` -> lastSentMs. */
const triggerLastSent = new Map();

export { setEnabled, isEnabled, getAll };

export default {
  getTrigger,
  getAllTriggers,
  evaluateTriggers,
  sendTrigger,
  setEnabled,
  isEnabled,
  getAll,
};
