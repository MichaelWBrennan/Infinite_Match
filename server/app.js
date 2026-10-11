// HTTP app for the free self-hosted server. Plain node:http, no framework, no extra dependencies.
import { createServer } from 'node:http';
import { authenticate, login, register } from './auth.js';
import { claimDailyReward, closeAttempt, completeLevel, getEconomyView, openLootbox, refillEnergy, settleEndless, spendEnergy, usePowerUp } from './economy.js';
import { buyDecor, chooseDecor, getKingdom, placeDecor, removeDecor, renovateRoom } from './kingdom.js';
import { claimTier, getBattlePassConfig, getProgress } from './battlepass.js';
import { claimWeekly, getOffers, getToday, getWeekly, getWeeklyPreview } from './liveops.js';
import { social } from './social.js';
import { getStudyStatus, optInStudy, recordVisit, withdrawStudy } from './retention.js';
import { getTargets, submitResult, tuningApply, tuningReport } from './level-results.js';
import { completeMinigame, listMinigames } from './minigames.js';
import { createCheckout, handleWebhook } from './payments.js';
import { getDailyLevel, getLevel, getLevelContext, getRegions } from './levels.js';
import { claimChallenge, getCompetitions, recordLevelWin, settleTournament } from './competitions.js';
import { openDatabase } from './db.js';
import { ApiError } from './errors.js';

const MAX_BODY_BYTES = 64 * 1024;
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_LIMIT_PER_WINDOW = 20;

// Routes that are implemented. Any other /api path answers 503 api_unavailable.
const ROUTES = {
  'POST /api/auth/register': { handler: ({ body, db }) => register(db, body), auth: false, limited: true },
  'POST /api/auth/login': { handler: ({ body, db }) => login(db, body), auth: false, limited: true },
  'POST /api/account-economy/initialize': { handler: ({ db, player, now }) => ({ success: true, data: getEconomyView(db, player.id, now) }), auth: true },
  'GET /api/account-economy/data': { handler: ({ db, player, now }) => ({ success: true, data: getEconomyView(db, player.id, now) }), auth: true },
  'POST /api/account-economy/energy/spend': { handler: ({ body, db, player, now }) => ({ success: true, result: spendEnergy(db, player.id, body, now) }), auth: true },
  'POST /api/account-economy/energy/refill': { handler: ({ db, player, now }) => ({ success: true, result: refillEnergy(db, player.id, now) }), auth: true },
  'POST /api/account-economy/attempt/close': { handler: ({ body, db, player, now }) => ({ success: true, ...closeAttempt(db, player.id, body, now) }), auth: true },
  'POST /api/account-economy/daily-reward/claim': { handler: ({ db, player, now }) => ({ success: true, result: claimDailyReward(db, player.id, now) }), auth: true },
  'POST /api/account-economy/lootbox/open': { handler: ({ body, db, player }) => ({ success: true, result: openLootbox(db, player.id, body?.type) }), auth: true },
  'POST /api/account-economy/powerup/use': { handler: ({ body, db, player, now }) => ({ success: true, result: usePowerUp(db, player.id, body, now) }), auth: true },
  'POST /api/account-economy/endless/complete': { handler: ({ body, db, player, now }) => ({ success: true, result: settleEndless(db, player.id, body, now) }), auth: true },
  'GET /api/live-ops/offers': { handler: ({ now }) => getOffers(now), auth: false },
  'GET /api/live-ops/today': { handler: ({ now }) => getToday(now), auth: true },
  'GET /api/live-ops/weekly/preview': { handler: ({ now }) => getWeeklyPreview(now), auth: false },
  'GET /api/live-ops/weekly': { handler: ({ db, player, now }) => getWeekly(db, player.id, now), auth: true },
  'POST /api/live-ops/weekly/claim': { handler: ({ body, db, player, now }) => ({ success: true, result: claimWeekly(db, player.id, body, now) }), auth: true },
  'GET /api/battlepass/config': { handler: () => getBattlePassConfig(), auth: false },
  'GET /api/battlepass/progress': { handler: ({ db, player, now }) => getProgress(db, player.id, now), auth: true },
  'POST /api/battlepass/claim': { handler: ({ body, db, player, now }) => ({ success: true, result: claimTier(db, player.id, body, now) }), auth: true },
  'GET /api/social/me': { handler: ({ player }) => social.me(player.username), auth: true },
  'PUT /api/social/name': { handler: ({ body, player }) => social.setName(player.username, body?.name), auth: true },
  'GET /api/social/friends': { handler: ({ player }) => social.friends(player.username), auth: true },
  'GET /api/social/friends/leaderboard': { handler: ({ player }) => social.friendLeaderboard(player.username), auth: true },
  'POST /api/social/friends/request': { handler: ({ body, player }) => social.requestFriend(player.username, body?.code), auth: true },
  'POST /api/social/friends/:playerId/accept': { handler: ({ params, player }) => social.acceptFriend(player.username, params.playerId), auth: true },
  'POST /api/social/friends/:playerId/decline': { handler: ({ params, player }) => social.declineFriend(player.username, params.playerId), auth: true },
  'DELETE /api/social/friends/:playerId': { handler: ({ params, player }) => social.removeFriend(player.username, params.playerId), auth: true },
  'GET /api/social/guilds': { handler: ({ query }) => social.listGuilds(query.get('limit')), auth: true },
  'GET /api/social/guilds/mine': { handler: ({ player }) => social.myGuild(player.username), auth: true },
  'POST /api/social/guilds': { handler: ({ body, player }) => social.createGuild(player.username, body?.name), auth: true },
  'POST /api/social/guilds/:guildId/join': { handler: ({ params, player }) => social.joinGuild(player.username, params.guildId), auth: true },
  'POST /api/social/guilds/leave': { handler: ({ player }) => social.leaveGuild(player.username), auth: true },
  'GET /api/live-ops/competitions': { handler: ({ player, now }) => getCompetitions(player.username, now), auth: true },
  'POST /api/live-ops/challenges/:id/claim': { handler: ({ db, params, player, now }) => claimChallenge(db, player, params.id, now), auth: true },
  'POST /api/live-ops/tournaments/:id/settle': { handler: ({ db, params, player, now }) => settleTournament(db, player, params.id, now), auth: true },
  // Level results and tuning. Results are client-reported and used for review only.
  'GET /api/level-results/targets': { handler: () => getTargets(), auth: false },
  'POST /api/level-results': { handler: ({ body }) => submitResult(body), auth: true },
  'GET /api/level-results/tuning': { handler: ({ player }) => tuningReport(player), auth: true },
  'POST /api/level-results/tuning/apply': { handler: ({ body, player }) => tuningApply(player, body), auth: true },
  // Retention study: opt-in, pseudonymous. Enrolling and visits need RETENTION_STUDY_ENABLED=1.
  'GET /api/retention-study/me': { handler: ({ player }) => getStudyStatus(player), auth: true },
  'DELETE /api/retention-study/me': { handler: ({ player }) => withdrawStudy(player), auth: true },
  'POST /api/retention-study/opt-in': { handler: ({ body, player }) => optInStudy(player, body), auth: true },
  'POST /api/retention-study/visit': { handler: ({ body, player }) => recordVisit(player, body), auth: true },
  // Daily mini-games: one paid play per game per UTC day, coins capped per game.
  'GET /api/minigames': { handler: ({ db, player, now }) => listMinigames(db, player, now), auth: true },
  'POST /api/minigames/:game/complete': { handler: ({ body, db, params, player, now }) => completeMinigame(db, player, params.game, body, now), auth: true },
  // Stripe. Checkout returns a link; coins are granted only from the signed webhook.
  'POST /api/stripe/checkout-session': { handler: ({ body, player, now }) => createCheckout(player, body, now), auth: true },
  'POST /api/stripe/webhook': { handler: ({ body, db, req }) => handleWebhook(db, body, req.headers['stripe-signature']), auth: false, raw: true },
  // Refused on purpose: the free server never lets a client set its own balances or items.
  // The legacy client defines these calls but never makes them (script.js has no call sites).
  'POST /api/account-economy/currency/update': { handler: () => { throw new ApiError(403, 'client_grant_disabled', 'Balances change only through server-verified actions.'); }, auth: true },
  'POST /api/account-economy/inventory/update': { handler: () => { throw new ApiError(403, 'client_grant_disabled', 'Items change only through server-verified actions.'); }, auth: true },
  // Refused on purpose: platform identity cannot be verified here, so a client-claimed link is not stored.
  'POST /api/auth/platform-sync': { handler: () => { throw new ApiError(503, 'platform_sync_unavailable', 'Platform account linking is not available on the free server.'); }, auth: true },
  'GET /api/levels/context': { handler: ({ query, now }) => getLevelContext(query, now), auth: false },
  'GET /api/levels/regions': { handler: ({ query, now }) => getRegions(query, now), auth: false },
  'GET /api/levels/daily': { handler: ({ query, now }) => getDailyLevel(query, now), auth: false },
  'GET /api/levels/:level': { handler: ({ params, query, now }) => getLevel(params.level, query, now), auth: false },
  'GET /api/kingdom': { handler: ({ db, player }) => getKingdom(db, player.id), auth: true },
  'POST /api/kingdom/renovate': { handler: ({ body, db, player }) => ({ success: true, result: renovateRoom(db, player.id, body?.roomId) }), auth: true },
  'POST /api/kingdom/decor/buy': { handler: ({ body, db, player }) => ({ success: true, result: buyDecor(db, player.id, body?.decorId) }), auth: true },
  'POST /api/kingdom/decor/place': { handler: ({ body, db, player }) => ({ success: true, result: placeDecor(db, player.id, body?.roomId, body?.decorId) }), auth: true },
  'POST /api/kingdom/decor/choose': { handler: ({ body, db, player }) => ({ success: true, result: chooseDecor(db, player.id, body?.roomId, body?.decorId) }), auth: true },
  'POST /api/kingdom/decor/remove': { handler: ({ body, db, player }) => ({ success: true, result: removeDecor(db, player.id, body?.roomId) }), auth: true },
  'POST /api/account-economy/level/complete': { handler: async ({ body, db, player, now }) => {
    // The social write happens after the economy commit. Its attempt key makes a retry count once.
    const { attemptId, score, ...result } = completeLevel(db, player.id, body, now);
    if (result.reward && typeof score === 'number') {
      await recordLevelWin(player.username, { level: result.level, score, attemptId }, now);
    }
    return { success: true, result };
  }, auth: true },
};

function jsonHeaders(origin, allowedOrigins) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
  }
  return headers;
}

function send(res, status, body, headers) {
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

function errorBody(code, message = code) {
  return { success: false, ok: false, error: code, code, message };
}

// The raw bytes of a body, for signed webhooks. Parsing first would change the bytes the signature covers.
async function readRaw(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new ApiError(413, 'body_too_large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new ApiError(413, 'body_too_large');
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ApiError(400, 'invalid_json');
  }
}

// Fixed-window counter per client address for sign-in and registration.
function createLimiter(now = () => Date.now(), limit = AUTH_LIMIT_PER_WINDOW) {
  const windows = new Map();
  return (key) => {
    const t = now();
    const entry = windows.get(key);
    if (!entry || t - entry.start >= AUTH_WINDOW_MS) {
      windows.set(key, { start: t, count: 1 });
      return true;
    }
    entry.count += 1;
    return entry.count <= limit;
  };
}

// Routes whose keys contain `:name` segments (for example `/api/social/friends/:playerId/accept`).
// Exact keys are tried first, so a fixed path always wins over a pattern.
const PARAM_ROUTES = Object.entries(ROUTES)
  .filter(([key]) => key.includes('/:'))
  .map(([key, route]) => {
    const [method, pattern] = key.split(' ');
    const source = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:(\w+)/g, '(?<$1>[^/]+)');
    return { method, regex: new RegExp(`^${source}$`), route };
  });

function matchRoute(method, pathname) {
  const exact = ROUTES[`${method} ${pathname}`];
  if (exact) return { route: exact, params: {} };
  for (const candidate of PARAM_ROUTES) {
    if (candidate.method !== method) continue;
    const match = candidate.regex.exec(pathname);
    if (match) {
      const params = {};
      for (const [name, value] of Object.entries(match.groups)) params[name] = decodeURIComponent(value);
      return { route: candidate.route, params };
    }
  }
  return null;
}

export function createApp({
  db = openDatabase(),
  allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
  now = () => Date.now(),
  authLimitPerWindow = AUTH_LIMIT_PER_WINDOW,
} = {}) {
  const allowLogin = createLimiter(now, authLimitPerWindow);

  async function handle(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const origin = req.headers.origin;
    const headers = jsonHeaders(origin, allowedOrigins);

    if (req.method === 'OPTIONS') {
      res.writeHead(204, headers);
      return res.end();
    }
    if (url.pathname === '/api/health' && req.method === 'GET') {
      return send(res, 200, { success: true, ok: true, service: 'infinite-match-free-server' }, headers);
    }
    if (!url.pathname.startsWith('/api/')) {
      return send(res, 404, errorBody('not_found'), headers);
    }

    const matched = matchRoute(req.method, url.pathname);
    if (!matched) {
      return send(res, 503, errorBody('api_unavailable',
        'This feature is not available on the free server yet. Guest play still works.'), headers);
    }

    const { route, params } = matched;
    try {
      if (route.limited && !allowLogin(req.socket.remoteAddress || 'unknown')) {
        throw new ApiError(429, 'too_many_attempts');
      }
      let body = {};
      if (route.raw) body = await readRaw(req);
      else if (['POST', 'PUT', 'DELETE'].includes(req.method)) body = await readJson(req);
      const player = route.auth ? authenticate(db, req.headers.authorization) : null;
      const result = await route.handler({ body, db, player, req, now: now(), params, query: url.searchParams });
      return send(res, 200, result, headers);
    } catch (error) {
      if (error instanceof ApiError) return send(res, error.status, errorBody(error.code, error.message), headers);
      console.error('Unhandled error', error);
      return send(res, 500, errorBody('internal_error', 'Something went wrong.'), headers);
    }
  }

  return { db, handle, server: createServer((req, res) => { void handle(req, res); }) };
}
