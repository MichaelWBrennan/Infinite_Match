// HTTP app for the free self-hosted server. Plain node:http, no framework, no extra dependencies.
import { createServer } from 'node:http';
import { authenticate, login, register } from './auth.js';
import { claimDailyReward, closeAttempt, completeLevel, getEconomyView, openLootbox, refillEnergy, spendEnergy } from './economy.js';
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
  'POST /api/account-economy/level/complete': { handler: ({ body, db, player, now }) => ({ success: true, result: completeLevel(db, player.id, body, now) }), auth: true },
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

    const key = `${req.method} ${url.pathname}`;
    const route = ROUTES[key];
    if (!route) {
      return send(res, 503, errorBody('api_unavailable',
        'This feature is not available on the free server yet. Guest play still works.'), headers);
    }

    try {
      if (route.limited && !allowLogin(req.socket.remoteAddress || 'unknown')) {
        throw new ApiError(429, 'too_many_attempts');
      }
      const body = req.method === 'POST' ? await readJson(req) : {};
      const player = route.auth ? authenticate(db, req.headers.authorization) : null;
      const result = await route.handler({ body, db, player, req, now: now() });
      return send(res, 200, result, headers);
    } catch (error) {
      if (error instanceof ApiError) return send(res, error.status, errorBody(error.code, error.message), headers);
      console.error('Unhandled error', error);
      return send(res, 500, errorBody('internal_error', 'Something went wrong.'), headers);
    }
  }

  return { db, handle, server: createServer((req, res) => { void handle(req, res); }) };
}
