/**
 * Segmented Retention Service
 *
 * Computes D1/D7/D30 retention broken down by player segments:
 *  - New vs. veteran players
 *  - Spenders vs. free players
 *  - High vs. low engagement
 *  - Social vs. solo players
 *
 * This helps identify which segments are leaking and need targeted interventions.
 */

import { Logger } from '../../core/logger/index.js';
import { segmentPlayer } from './player-segmentation-service.js';

const logger = new Logger('SegmentedRetentionService');

const DAY_MS = 24 * 60 * 60 * 1000;

class SegmentedRetentionService {
  constructor(retentionService) {
    this.retentionService = retentionService;
  }

  /**
   * Compute retention for a specific segment of players.
   * 
   * @param {Map} playerEconomies - Map of playerId -> economy
   * @param {string} segmentId - Segment ID to filter by
   * @param {Object} context - Context with nowMs
   * @returns {Object} Retention data for the segment
   */
  async computeSegmentRetention(playerEconomies, segmentId, { nowMs = Date.now() } = {}) {
    // Filter players by segment
    const segmentPlayers = new Map();
    for (const [playerId, economy] of playerEconomies) {
      const segments = segmentPlayer(playerId, economy, { nowMs });
      if (segments.includes(segmentId)) {
        segmentPlayers.set(playerId, economy);
      }
    }

    if (segmentPlayers.size === 0) {
      return {
        segmentId,
        segmentSize: 0,
        d1: 0,
        d7: 0,
        d30: 0,
        cohorts: [],
        message: 'No players in this segment',
      };
    }

    // Build login data for this segment
    const logins = [];
    const firstLogin = new Map();
    const loginDays = new Map();

    for (const [playerId, economy] of segmentPlayers) {
      const createdAt = economy.createdAt ? new Date(economy.createdAt).getTime() : nowMs;
      const cohortDate = this.utcDay(createdAt);
      firstLogin.set(playerId, cohortDate);

      const stats = economy.statistics || {};
      const lastPlayed = stats.lastPlayed ? new Date(stats.lastPlayed).getTime() : 0;
      if (lastPlayed > 0) {
        const day = this.utcDay(lastPlayed);
        let days = loginDays.get(playerId);
        if (!days) { days = new Set(); loginDays.set(playerId, days); }
        days.add(day);
      }

      logins.push({
        event: 'first_login',
        playerId,
        cohortDate,
        ts: createdAt,
      });
    }

    // Compute retention for segment
    const today = this.utcDay(nowMs);
    const todayMs = Date.parse(today + 'T00:00:00Z');

    const cohorts = new Map();
    for (const [playerId, cohortDate] of firstLogin) {
      let set = cohorts.get(cohortDate);
      if (!set) { set = new Set(); cohorts.set(cohortDate, set); }
      set.add(playerId);
    }

    const cohortResults = [];
    for (const [cohortDate, players] of cohorts) {
      const cohortStartMs = Date.parse(cohortDate + 'T00:00:00Z');
      const daysSinceCohort = Math.floor((todayMs - cohortStartMs) / DAY_MS);

      let d1Retained = 0, d7Retained = 0, d30Retained = 0;
      for (const playerId of players) {
        const days = loginDays.get(playerId) || new Set();
        if (days.has(this.addDays(cohortDate, 1))) d1Retained += 1;
        if (days.has(this.addDays(cohortDate, 7))) d7Retained += 1;
        if (days.has(this.addDays(cohortDate, 30))) d30Retained += 1;
      }

      const size = players.size;
      cohortResults.push({
        cohortDate,
        size,
        d1: size > 0 ? Math.round((d1Retained / size) * 10000) / 100 : 0,
        d7: size > 0 ? Math.round((d7Retained / size) * 10000) / 100 : 0,
        d30: size > 0 ? Math.round((d30Retained / size) * 10000) / 100 : 0,
        daysSinceCohort,
        canMeasureD1: daysSinceCohort >= 1,
        canMeasureD7: daysSinceCohort >= 7,
        canMeasureD30: daysSinceCohort >= 30,
      });
    }

    cohortResults.sort((a, b) => b.cohortDate.localeCompare(a.cohortDate));

    const overall = {
      d1: this._avg(cohortResults.filter(c => c.canMeasureD1), 'd1'),
      d7: this._avg(cohortResults.filter(c => c.canMeasureD7), 'd7'),
      d30: this._avg(cohortResults.filter(c => c.canMeasureD30), 'd30'),
    };

    return {
      segmentId,
      segmentSize: segmentPlayers.size,
      d1: overall.d1,
      d7: overall.d7,
      d30: overall.d30,
      cohorts: cohortResults,
      overall,
    };
  }

  /**
   * Compute retention for ALL segments at once.
   * Returns { segments: { segmentId: retentionData }, summary: {} }.
   */
  async computeAllSegmentRetention(playerEconomies, { nowMs = Date.now() } = {}) {
    const segmentsToTrack = [
      'new_player', 'early_player', 'veteran_player',
      'spender', 'free_player', 'subscriber',
      'active_this_week', 'at_risk', 'churn_risk', 'churned',
      'high_engagement', 'low_engagement',
      'social_player', 'solo_player',
      'strong_streak', 'building_streak', 'streak_broken',
      'early_game', 'mid_game', 'late_game',
    ];

    const segmentResults = {};
    for (const segmentId of segmentsToTrack) {
      try {
        segmentResults[segmentId] = await this.computeSegmentRetention(playerEconomies, segmentId, { nowMs });
      } catch (error) {
        logger.error(`Failed to compute retention for segment ${segmentId}`, { error: error.message });
        segmentResults[segmentId] = {
          segmentId,
          segmentSize: 0,
          d1: 0, d7: 0, d30: 0,
          cohorts: [],
          error: error.message,
        };
      }
    }

    // Build summary: which segments are below benchmark
    const benchmarks = { d1: 38, d7: 18, d30: 8 }; // match-3 median
    const belowBenchmark = [];
    for (const [segmentId, data] of Object.entries(segmentResults)) {
      if (data.segmentSize < 5) continue; // Too small to be meaningful
      if (data.d1 > 0 && data.d1 < benchmarks.d1) belowBenchmark.push({ segmentId, metric: 'd1', value: data.d1, benchmark: benchmarks.d1 });
      if (data.d7 > 0 && data.d7 < benchmarks.d7) belowBenchmark.push({ segmentId, metric: 'd7', value: data.d7, benchmark: benchmarks.d7 });
      if (data.d30 > 0 && data.d30 < benchmarks.d30) belowBenchmark.push({ segmentId, metric: 'd30', value: data.d30, benchmark: benchmarks.d30 });
    }

    belowBenchmark.sort((a, b) => (b.benchmark - b.value) - (a.benchmark - a.value));

    return {
      segments: segmentResults,
      belowBenchmark,
      computedAt: new Date(nowMs).toISOString(),
    };
  }

  /**
   * Get the segments that need immediate attention (lowest retention).
   */
  async getPrioritySegments(playerEconomies, { nowMs = Date.now(), limit = 5 } = {}) {
    const all = await this.computeAllSegmentRetention(playerEconomies, { nowMs });

    const priorities = all.belowBenchmark.slice(0, limit).map((item) => ({
      segmentId: item.segmentId,
      metric: item.metric,
      currentValue: item.value,
      benchmark: item.benchmark,
      gap: Math.round((item.benchmark - item.value) * 100) / 100,
      segmentSize: all.segments[item.segmentId]?.segmentSize || 0,
    }));

    return priorities;
  }

  utcDay(ms) {
    return new Date(ms).toISOString().slice(0, 10);
  }

  addDays(day, n) {
    const d = new Date(Date.parse(day + 'T00:00:00Z'));
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  _avg(rows, field) {
    if (rows.length === 0) return 0;
    const sum = rows.reduce((a, b) => a + b[field], 0);
    return Math.round((sum / rows.length) * 10000) / 100;
  }
}

export default SegmentedRetentionService;
export { SegmentedRetentionService };
