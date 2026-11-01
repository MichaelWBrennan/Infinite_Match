/**
 * Social Competition Service
 *
 * Adds social retention mechanics beyond friend lives gifting:
 *  - Guild events (team-based competitions)
 * * Friend leaderboards with rewards
 *  - Team challenges that require coordination
 *  - Social pressure to log in (guild mates depending on you)
 *
 * These mechanics drive D7/D30 retention by creating social obligations
 * and shared goals.
 */

import { Logger } from '../../core/logger/index.js';
import { notifyPlayers } from '../push/push-service.js';

const logger = new Logger('SocialCompetitionService');

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// Guild event types
const GUILD_EVENT_TYPES = {
  guild_race: {
    name: 'Guild Race',
    description: 'Compete with your guild to complete the most levels this week!',
    durationHours: 168, // 1 week
    minMembers: 3,
    rewardMultiplier: 1.5,
  },
  guild_tournament: {
    name: 'Guild Tournament',
    description: 'Your guild vs. another guild - highest average score wins!',
    durationHours: 72, // 3 days
    minMembers: 5,
    rewardMultiplier: 2.0,
  },
  collective_goal: {
    name: 'Collective Goal',
    description: 'Work together to reach a combined score target!',
    durationHours: 48, // 2 days
    minMembers: 3,
    rewardMultiplier: 1.25,
  },
};

class SocialCompetitionService {
  constructor(accountEconomy, socialStore) {
    this.accountEconomy = accountEconomy;
    this.socialStore = socialStore;

    // Active guild events: eventId -> event definition
    this.guildEvents = new Map();

    // Guild memberships: guildId -> Set of playerIds (loaded from social store)
    this.guildCache = new Map();

    // Friend leaderboards: 'weekly' | 'monthly' | 'allTime' -> Map<playerId, score>
    this.friendLeaderboards = new Map();
  }

  /**
   * Create a guild event.
   * Returns { success, eventId, event }.
   */
  async createGuildEvent(guildId, eventType, { createdBy, nowMs = Date.now() } = {}) {
    const template = GUILD_EVENT_TYPES[eventType];
    if (!template) {
      return { success: false, error: 'unknown_event_type' };
    }

    // Verify guild exists and has enough members
    const guild = await this.socialStore.getGuild(guildId);
    if (!guild) {
      return { success: false, error: 'guild_not_found' };
    }
    const memberCount = guild.members ? guild.members.length : 0;
    if (memberCount < template.minMembers) {
      return { success: false, error: 'insufficient_members', required: template.minMembers, current: memberCount };
    }

    const eventId = `guild_${eventType}_${Date.now()}`;
    const event = {
      id: eventId,
      guildId,
      type: eventType,
      name: template.name,
      description: template.description,
      status: 'active',
      startMs: nowMs,
      endMs: nowMs + template.durationHours * HOUR_MS,
      minMembers: template.minMembers,
      rewardMultiplier: template.rewardMultiplier,
      createdBy,
      createdAt: nowMs,
      participants: new Set(),
      scores: new Map(), // playerId -> score
      rewardsClaimed: new Set(),
    };

    this.guildEvents.set(eventId, event);

    // Notify guild members
    const memberIds = guild.members ? guild.members.map((m) => m.id || m) : [];
    try {
      await notifyPlayers({
        userIds: memberIds,
        title: `${template.name} started!`,
        body: `${template.description} Join your guild and start competing!`,
        data: { type: 'guild_event_started', eventId, guildId, eventType },
      });
    } catch (error) {
      logger.error('Failed to notify guild members of event', { eventId, error: error.message });
    }

    logger.info('Guild event created', { eventId, guildId, eventType, memberCount });

    return { success: true, eventId, event: { ...event, participants: Array.from(event.participants), scores: Object.fromEntries(event.scores) } };
  }

  /**
   * Join a guild event.
   */
  async joinGuildEvent(playerId, eventId, { nowMs = Date.now() } = {}) {
    const event = this.guildEvents.get(eventId);
    if (!event) {
      return { success: false, error: 'event_not_found' };
    }
    if (event.status !== 'active') {
      return { success: false, error: 'event_not_active' };
    }
    if (nowMs >= event.endMs) {
      return { success: false, error: 'event_ended' };
    }

    event.participants.add(playerId);

    logger.info('Player joined guild event', { playerId, eventId });
    return { success: true, eventId, participantCount: event.participants.size };
  }

  /**
   * Record a score for a player in a guild event.
   */
  async recordEventScore(playerId, eventId, score, { nowMs = Date.now() } = {}) {
    const event = this.guildEvents.get(eventId);
    if (!event) {
      return { success: false, error: 'event_not_found' };
    }
    if (!event.participants.has(playerId)) {
      return { success: false, error: 'not_participant' };
    }

    const previousScore = event.scores.get(playerId) || 0;
    event.scores.set(playerId, Math.max(previousScore, score));

    logger.debug('Event score recorded', { playerId, eventId, score, previousScore });
    return { success: true, eventId, score: event.scores.get(playerId), previousScore };
  }

  /**
   * Get guild event standings.
   */
  getEventStandings(eventId) {
    const event = this.guildEvents.get(eventId);
    if (!event) return null;

    const standings = Array.from(event.scores.entries())
      .map(([playerId, score]) => ({ playerId, score }))
      .sort((a, b) => b.score - a.score);

    return {
      eventId,
      eventName: event.name,
      status: event.status,
      endMs: event.endMs,
      participantCount: event.participants.size,
      standings,
    };
  }

  /**
   * End a guild event and distribute rewards.
   */
  async endGuildEvent(eventId, { nowMs = Date.now() } = {}) {
    const event = this.guildEvents.get(eventId);
    if (!event) return { success: false, error: 'event_not_found' };
    if (event.status === 'ended') return { success: false, error: 'event_already_ended' };

    event.status = 'ended';
    event.endedAt = nowMs;

    const standings = this.getEventStandings(eventId);
    if (!standings || standings.standings.length === 0) {
      return { success: true, eventId, message: 'No participants' };
    }

    // Award rewards to top 3
    const rewards = [];
    const top3 = standings.standings.slice(0, 3);
    const rewardTiers = [
      { rank: 1, coins: 500, stars: 20 },
      { rank: 2, coins: 300, stars: 10 },
      { rank: 3, coins: 200, stars: 5 },
    ];

    for (const [index, entry] of top3.entries()) {
      const tier = rewardTiers[index];
      if (!tier) break;
      const playerId = entry.playerId;
      if (event.rewardsClaimed.has(playerId)) continue;

      try {
        const economy = await this.accountEconomy.getPlayerEconomy(playerId);
        if (tier.coins) this.accountEconomy.applyReward(economy, { type: 'currency', currencyId: 'coins', amount: tier.coins });
        if (tier.stars) this.accountEconomy.applyReward(economy, { type: 'currency', currencyId: 'stars', amount: tier.stars });
        await this.accountEconomy.updatePlayerEconomyCache(playerId, economy);

        event.rewardsClaimed.add(playerId);
        rewards.push({ playerId, rank: tier.rank, coins: tier.coins, stars: tier.stars });
      } catch (error) {
        logger.error('Failed to award guild event reward', { playerId, eventId, error: error.message });
      }
    }

    // Notify participants of event end
    const participantIds = Array.from(event.participants);
    try {
      await notifyPlayers({
        userIds: participantIds,
        title: `${event.name} has ended!`,
        body: `Congratulations to the top players! Check your rewards.`,
        data: { type: 'guild_event_ended', eventId, guildId: event.guildId },
      });
    } catch (error) {
      logger.error('Failed to notify guild event end', { eventId, error: error.message });
    }

    logger.info('Guild event ended', { eventId, rewardsDistributed: rewards.length });

    return { success: true, eventId, standings, rewards };
  }

  /**
   * Get a player's active guild events.
   */
  getPlayerGuildEvents(playerId) {
    const active = [];
    for (const [eventId, event] of this.guildEvents.entries()) {
      if (event.status === 'active' && event.participants.has(playerId)) {
        active.push({ eventId, ...event, participants: Array.from(event.participants) });
      }
    }
    return active;
  }

  /**
   * Update friend leaderboard score for a player.
   */
  updateFriendScore(playerId, score, period = 'weekly', { nowMs = Date.now() } = {}) {
    if (!this.friendLeaderboards.has(period)) {
      this.friendLeaderboards.set(period, new Map());
    }
    const leaderboard = this.friendLeaderboards.get(period);
    const previous = leaderboard.get(playerId) || 0;
    leaderboard.set(playerId, Math.max(previous, score));

    return { playerId, score: leaderboard.get(playerId), previous, period };
  }

  /**
   * Get friend leaderboard for a period.
   */
  getFriendLeaderboard(period = 'weekly', limit = 50) {
    const leaderboard = this.friendLeaderboards.get(period);
    if (!leaderboard) return { period, entries: [] };

    const entries = Array.from(leaderboard.entries())
      .map(([playerId, score]) => ({ playerId, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return { period, entries };
  }

  /**
   * Get social competition stats for admin dashboard.
   */
  getStats() {
    const now = Date.now();
    const activeEvents = Array.from(this.guildEvents.values()).filter((e) => e.status === 'active' && now < e.endMs).length;
    const totalEvents = this.guildEvents.size;
    const totalParticipants = Array.from(this.guildEvents.values()).reduce((sum, e) => sum + e.participants.size, 0);

    return {
      activeGuildEvents: activeEvents,
      totalGuildEvents: totalEvents,
      totalParticipants: totalParticipants,
      leaderboardPeriods: Array.from(this.friendLeaderboards.keys()),
    };
  }
}

export default SocialCompetitionService;
export { SocialCompetitionService, GUILD_EVENT_TYPES };
