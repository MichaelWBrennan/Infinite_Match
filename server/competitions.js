// Tournaments and community challenges on the free server. Rules and config come from
// src/services/live-ops/competitions.js (config/liveops.json, tournaments and challenges).
// Scores and progress live in the social store. Prizes are paid into the economy once per key,
// using a receipt on the economy document, and the social store reserves each payout first.
import { activeCompetitions, loadCompetitions, prizeForRank } from '../src/services/live-ops/competitions.js';
import { ApiError } from './errors.js';
import { transaction } from './db.js';
import { grantCurrency, loadEconomy, saveEconomy } from './economy.js';
import { grantSeasonXp } from './season.js';
import { liveOpsPath } from './live-ops-config.js';
import { socialCall, socialStore } from './social.js';

const ID_LOOKUP = 'SELECT id FROM players WHERE username = ?';

function operatorNames() {
  return (process.env.OPERATOR_USERNAMES || '').split(',').map((name) => name.trim()).filter(Boolean);
}

function competitionConfig() {
  return loadCompetitions(liveOpsPath());
}

/** Coins for a player, paid once for a key. Returns { duplicate, balance }. */
function grantOnce(db, playerId, key, coins, nowMs, { xpEvent = null } = {}) {
  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    economy.competitionReceipts ??= {};
    if (Object.hasOwn(economy.competitionReceipts, key)) {
      return { duplicate: true, balance: economy.currencies.coins.amount };
    }
    grantCurrency(economy.currencies, 'coins', coins);
    economy.competitionReceipts[key] = coins;
    if (xpEvent) grantSeasonXp(economy, xpEvent, nowMs);
    saveEconomy(db, playerId, economy);
    return { duplicate: false, balance: economy.currencies.coins.amount };
  });
}

export async function getCompetitions(username, nowMs = Date.now()) {
  const active = activeCompetitions(competitionConfig(), nowMs);
  const store = socialStore();
  const tournaments = await Promise.all(active.tournaments.map(async (t) => {
    const board = await store.tournamentBoard(t.id, username, 10);
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
    const standing = await store.challengeStanding(c.id, username);
    const claimed = await store.hasPayout(`challenge:${c.id}`, username);
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
  return { success: true, tournaments, challenges };
}

export async function claimChallenge(db, player, challengeId, nowMs = Date.now()) {
  const challenge = activeCompetitions(competitionConfig(), nowMs).challenges.find((c) => c.id === challengeId);
  if (!challenge) throw new ApiError(404, 'challenge_not_active');
  const store = socialStore();
  const standing = await store.challengeStanding(challenge.id, player.username);
  if (standing.progress < challenge.goal) throw new ApiError(409, 'goal_not_reached');
  if (standing.contributed < 1) throw new ApiError(403, 'not_a_contributor');

  const key = `challenge:${challenge.id}`;
  if (!(await store.reservePayout(key, player.username))) throw new ApiError(409, 'already_claimed');
  try {
    const payout = grantOnce(db, player.id, key, challenge.reward.coins, nowMs, { xpEvent: 'challenge_complete' });
    return { success: true, result: { reward: challenge.reward, balances: { coins: payout.balance }, duplicate: payout.duplicate } };
  } catch (error) {
    await store.releasePayout(key, player.username);
    throw error;
  }
}

export async function settleTournament(db, player, tournamentId, nowMs = Date.now()) {
  if (!operatorNames().includes(player.username)) throw new ApiError(403, 'forbidden');
  const tournament = competitionConfig().tournaments.find((t) => t.id === tournamentId);
  if (!tournament) throw new ApiError(404, 'tournament_not_found');
  if (nowMs <= tournament.endMs) throw new ApiError(409, 'tournament_not_ended');

  const store = socialStore();
  const ranking = await store.tournamentRanking(tournament.id);
  const key = `tournament:${tournament.id}`;
  const paid = [];
  const alreadyPaid = [];
  const failed = [];
  for (let i = 0; i < ranking.length; i++) {
    const rank = i + 1;
    const coins = prizeForRank(tournament, rank);
    if (!coins) continue;
    const username = ranking[i].playerId;
    const row = db.prepare(ID_LOOKUP).get(username);
    if (!row) {
      failed.push(rank); // A ranked name with no account cannot be paid. Report it for manual review.
      continue;
    }
    if (!(await store.reservePayout(key, username))) {
      alreadyPaid.push(rank);
      continue;
    }
    try {
      const payout = grantOnce(db, row.id, key, coins, nowMs);
      if (payout.duplicate) alreadyPaid.push(rank);
      else paid.push({ rank, coins });
    } catch {
      await store.releasePayout(key, username);
      failed.push(rank);
    }
  }
  return { success: failed.length === 0, result: { paid, alreadyPaid, failed } };
}

/**
 * Records a paid level win with the social store: best score, tournament scores, and challenge
 * progress. Keyed by the attempt, so a retried completion counts once.
 */
export async function recordLevelWin(username, { level, score, attemptId }, nowMs = Date.now()) {
  const active = activeCompetitions(competitionConfig(), nowMs);
  return socialCall(() => socialStore().recordWin(username, {
    level,
    score,
    attemptId,
    tournamentIds: active.tournaments.map((t) => t.id),
    challengeIds: active.challenges.map((c) => c.id),
  }));
}

