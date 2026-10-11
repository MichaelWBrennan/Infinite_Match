// Accounts and sessions. Passwords use scrypt from Node's crypto module.
// Session tokens are random; only their SHA-256 hash is stored.
import { createHash, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { ApiError } from './errors.js';
import { defaultEconomy } from './economy.js';

const scrypt = promisify(scryptCb);
const USERNAME = /^[A-Za-z0-9_]{3,20}$/;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 200;
const DUMMY_HASH = await hashPassword(randomBytes(16).toString('hex'));

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, saltB64, keyB64] = String(stored).split('$');
  if (scheme !== 'scrypt' || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length);
  return timingSafeEqual(actual, expected);
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function validateCredentials(body) {
  const username = typeof body?.playerId === 'string' ? body.playerId.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!USERNAME.test(username)) throw new ApiError(400, 'invalid_username');
  if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) throw new ApiError(400, 'invalid_password');
  return { username, password };
}

function createSession(db, playerId, nowIso) {
  const token = randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO sessions (token_hash, player_id, created_at) VALUES (?, ?, ?)')
    .run(hashToken(token), playerId, nowIso);
  return { token, sessionId: randomUUID() };
}

export async function register(db, body, nowMs = Date.now()) {
  const { username, password } = validateCredentials(body);
  const existing = db.prepare('SELECT id FROM players WHERE username = ?').get(username);
  if (existing) throw new ApiError(409, 'username_taken');
  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  const nowIso = new Date(nowMs).toISOString();
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('INSERT INTO players (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)')
      .run(id, username, passwordHash, nowIso);
    db.prepare('INSERT INTO economy (player_id, state) VALUES (?, ?)')
      .run(id, JSON.stringify(defaultEconomy(nowMs)));
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return { success: true, playerId: username, ...createSession(db, id, nowIso) };
}

export async function login(db, body, nowMs = Date.now()) {
  const { username, password } = validateCredentials(body);
  const row = db.prepare('SELECT id, password_hash FROM players WHERE username = ?').get(username);
  // Unknown usernames still pay one scrypt comparison, so timing does not reveal accounts.
  const ok = await verifyPassword(password, row ? row.password_hash : DUMMY_HASH);
  if (!row || !ok) throw new ApiError(401, 'invalid_credentials');
  return { success: true, playerId: username, ...createSession(db, row.id, new Date(nowMs).toISOString()) };
}

// Returns the player row for a valid bearer token, or throws 401.
export function authenticate(db, authorization) {
  const match = /^Bearer\s+(\S+)$/.exec(authorization || '');
  if (!match) throw new ApiError(401, 'unauthorized');
  const row = db.prepare(`
    SELECT p.id, p.username FROM sessions s JOIN players p ON p.id = s.player_id
    WHERE s.token_hash = ?`).get(hashToken(match[1]));
  if (!row) throw new ApiError(401, 'unauthorized');
  return { id: row.id, username: row.username };
}
