/**
 * Transparent, local-first play flow. This module only recommends a mode and a
 * session shape. It never changes board generation, difficulty, rewards, prices,
 * energy, or offers. Players can disable it, choose a mode manually, and clear
 * the bounded local history at any time.
 */
(function (root) {
  'use strict';

  const MAX_HISTORY = 20;
  const MODES = Object.freeze(['classic', 'daily', 'timed', 'endless']);
  const SESSIONS = Object.freeze({ short: 5, medium: 15, long: 30 });
  const CHALLENGES = Object.freeze(['relaxed', 'steady', 'spicy']);
  const MODE_TITLES = Object.freeze({
    classic: 'Classic', daily: 'Today’s Local Level', timed: 'Timed', endless: 'Endless',
  });
  const SESSION_LABELS = Object.freeze({ short: 'Short session', medium: 'Standard session', long: 'Long session' });
  const CHALLENGE_LABELS = Object.freeze({ relaxed: 'Relaxed', steady: 'Steady', spicy: 'Spicy' });

  function clampInt(value, min, max, fallback) {
    return Number.isFinite(value) ? Math.max(min, Math.min(max, Math.floor(value))) : fallback;
  }

  function normalizeSettings(settings = {}) {
    return {
      flowEnabled: settings.flowEnabled !== false,
      flowSession: Object.hasOwn(SESSIONS, settings.flowSession) ? settings.flowSession : 'medium',
      flowChallenge: CHALLENGES.includes(settings.flowChallenge) ? settings.flowChallenge : 'steady',
      flowMode: settings.flowMode === 'auto' || MODES.includes(settings.flowMode) ? settings.flowMode : 'auto',
    };
  }

  function normalizeHistory(history) {
    if (!Array.isArray(history)) return [];
    const kept = [];
    for (const entry of history) {
      if (!entry || !MODES.includes(entry.mode)) continue;
      const at = Number(entry.at);
      if (!Number.isFinite(at)) continue;
      kept.push({
        mode: entry.mode,
        stars: clampInt(Number(entry.stars), 0, 3, 0),
        seconds: clampInt(Number(entry.seconds), 0, 7200, 0),
        at,
      });
    }
    return kept.slice(-MAX_HISTORY);
  }

  function recordResult(history, result) {
    const normalized = normalizeHistory(history);
    if (!result || !MODES.includes(result.mode)) return normalized;
    const at = Number.isFinite(Number(result.at)) ? Number(result.at) : Date.now();
    normalized.push({
      mode: result.mode,
      stars: clampInt(Number(result.stars), 0, 3, 0),
      seconds: clampInt(Number(result.seconds), 0, 7200, 0),
      at,
    });
    return normalized.slice(-MAX_HISTORY);
  }

  function dateKey(nowMs) {
    return new Date(nowMs).toISOString().slice(0, 10);
  }

  function summarize(history, nowMs = Date.now()) {
    const entries = normalizeHistory(history);
    const scored = entries.filter((entry) => entry.mode !== 'endless');
    const wins = scored.filter((entry) => entry.stars > 0).length;
    let lossStreak = 0;
    for (let i = scored.length - 1; i >= 0; i--) {
      if (scored[i].stars > 0) break;
      lossStreak++;
    }
    let winStreak = 0;
    for (let i = scored.length - 1; i >= 0; i--) {
      if (scored[i].stars === 0) break;
      winStreak++;
    }
    const recentSeconds = entries.reduce((sum, entry) => sum + entry.seconds, 0);
    const today = dateKey(nowMs);
    const lastDaily = entries.filter((entry) => entry.mode === 'daily').map((entry) => dateKey(entry.at)).sort().pop() || null;
    return {
      attempts: entries.length,
      scoredAttempts: scored.length,
      wins,
      winRate: scored.length > 0 ? wins / scored.length : null,
      lossStreak,
      winStreak,
      recentSeconds,
      recentMinutes: Math.round(recentSeconds / 60),
      dailyPlayedToday: lastDaily === today,
      lastMode: entries.length > 0 ? entries[entries.length - 1].mode : null,
    };
  }

  function recommend({ settings = {}, history = [], nowMs = Date.now() } = {}) {
    const prefs = normalizeSettings(settings);
    if (!prefs.flowEnabled) return null;
    const summary = summarize(history, nowMs);
    const sessionMinutes = SESSIONS[prefs.flowSession];
    const breakSuggested = summary.recentMinutes >= sessionMinutes;
    let mode;
    let reason;

    if (prefs.flowMode !== 'auto') {
      mode = prefs.flowMode;
      reason = `You chose ${MODE_TITLES[mode]}. Flow respects your manual mode.`;
    } else if (summary.lossStreak >= 3) {
      mode = prefs.flowChallenge === 'spicy' ? 'classic' : 'daily';
      reason = 'After a few losses, a no-clock board can reset the rhythm. Hints stay free.';
    } else if (prefs.flowSession === 'short') {
      mode = summary.dailyPlayedToday ? 'timed' : 'daily';
      reason = summary.dailyPlayedToday
        ? 'You already played today’s local level. A 60-second Timed run fits a short session.'
        : 'One local daily puzzle fits a short session without a long commitment.';
    } else if (prefs.flowSession === 'long') {
      mode = prefs.flowChallenge === 'relaxed' ? 'classic' : 'endless';
      reason = prefs.flowChallenge === 'relaxed'
        ? 'A long relaxed session stays on no-clock Classic boards.'
        : 'Endless gives a long session a steady chain of stages; bank rewards when you choose.';
    } else if (prefs.flowChallenge === 'spicy') {
      mode = summary.winStreak >= 3 ? 'timed' : 'classic';
      reason = summary.winStreak >= 3
        ? 'You are on a win streak. Timed adds a clock without changing rewards.'
        : 'Classic keeps the standard puzzle loop while you look for a streak.';
    } else if (prefs.flowChallenge === 'relaxed') {
      mode = summary.dailyPlayedToday ? 'classic' : 'daily';
      reason = summary.dailyPlayedToday
        ? 'Classic has no clock and keeps the relaxed pace.'
        : 'Today’s local level is a calm, one-board place to start.';
    } else {
      mode = summary.dailyPlayedToday ? 'classic' : 'daily';
      reason = summary.dailyPlayedToday
        ? 'You already played today’s local level. Classic continues the campaign.'
        : 'Start with today’s local level, then continue Classic if you want more.';
    }

    if (prefs.flowMode === 'auto' && prefs.flowChallenge === 'relaxed' && mode === 'timed') {
      mode = 'classic';
      reason = 'Relaxed flow avoids the clock. Classic keeps the same puzzle rewards.';
    }

    return {
      mode,
      title: MODE_TITLES[mode],
      reason,
      sessionMinutes,
      sessionLabel: SESSION_LABELS[prefs.flowSession],
      challengeLabel: CHALLENGE_LABELS[prefs.flowChallenge],
      breakSuggested,
      summary,
    };
  }

  function cardLines(recommendation) {
    if (!recommendation) return ['Flow suggestions are off. You can still choose any mode manually.'];
    const lines = [
      `${recommendation.title} · ${recommendation.sessionLabel} · ${recommendation.challengeLabel}`,
      recommendation.reason,
    ];
    if (recommendation.breakSuggested) {
      lines.push(`You have played about ${recommendation.summary.recentMinutes} recent minutes. A break is always allowed; nothing expires because you pause.`);
    }
    return lines;
  }

  const api = Object.freeze({
    MAX_HISTORY, MODES, SESSIONS, CHALLENGES, MODE_TITLES,
    normalizeSettings, normalizeHistory, recordResult, summarize, recommend, cardLines,
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.InfinitePlayFlow = api;
})(typeof window !== 'undefined' ? window : globalThis);
