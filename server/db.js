// SQLite storage for the free self-hosted server. Uses Node's built-in node:sqlite,
// so there are no extra npm dependencies. Requires Node 22.13 or newer.
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const DEFAULT_DATA_FILE = resolve('server', 'data', 'app.sqlite');

export function openDatabase(file = process.env.DATA_FILE || DEFAULT_DATA_FILE) {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS purchases (
      session_id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      granted_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS economy (
      player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
      state TEXT NOT NULL
    );
  `);
  return db;
}

// Every write runs inside a single synchronous statement sequence. Node runs one
// JavaScript thread, so a read-modify-write of one player's economy cannot interleave.
export function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
