import { describe, expect, test } from '@jest/globals';
import {
  regenerateLives,
  nextRegenInMs,
  spendLife,
  grantLives,
  MAX_LIVES,
  LIFE_REGEN_MINUTES,
} from '../services/meta/lives.js';

const MINUTE_MS = 60_000;

function freshLives() {
  return {
    amount: MAX_LIVES,
    maxAmount: MAX_LIVES,
    regenRate: 1,
    lastRegen: Date.now(),
  };
}

describe('lives service', () => {
  test('MAX_LIVES constant', () => {
    expect(MAX_LIVES).toBe(5);
    expect(LIFE_REGEN_MINUTES).toBe(30);
  });

  test('regenerateLives does nothing when full', () => {
    const lives = freshLives();
    const now = Date.now();
    const result = regenerateLives(lives, now);
    expect(result.amount).toBe(MAX_LIVES);
    expect(result.lastRegen).toBe(now);
  });

  test('regenerateLives adds lives after regen interval', () => {
    const lives = freshLives();
    lives.amount = 2;
    const originalLastRegen = Date.now() - 40 * MINUTE_MS; // 40 minutes ago
    lives.lastRegen = originalLastRegen;
    const now = Date.now();
    const result = regenerateLives(lives, now);
    expect(result.amount).toBe(3);
    expect(result.lastRegen).toBeGreaterThan(originalLastRegen);
  });

  test('regenerateLives caps at max', () => {
    const lives = freshLives();
    lives.amount = 4;
    lives.lastRegen = Date.now() - 200 * MINUTE_MS; // enough to regen many lives
    const now = Date.now();
    const result = regenerateLives(lives, now);
    expect(result.amount).toBe(MAX_LIVES);
  });

  test('nextRegenInMs returns null when full', () => {
    const lives = freshLives();
    expect(nextRegenInMs(lives, Date.now())).toBeNull();
  });

  test('nextRegenInMs returns positive when not full', () => {
    const lives = freshLives();
    lives.amount = 0;
    lives.lastRegen = Date.now() - 10 * MINUTE_MS; // 10 min ago, need 30 min total
    const ms = nextRegenInMs(lives, Date.now());
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(20 * MINUTE_MS);
  });

  test('spendLife decrements lives', () => {
    const lives = freshLives();
    const result = spendLife(lives);
    expect(result.success).toBe(true);
    expect(result.livesRemaining).toBe(MAX_LIVES - 1);
    expect(lives.amount).toBe(MAX_LIVES - 1);
  });

  test('spendLife fails when no lives', () => {
    const lives = freshLives();
    lives.amount = 0;
    const result = spendLife(lives);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('no_lives');
  });

  test('grantLives adds lives up to max', () => {
    const lives = freshLives();
    lives.amount = 1;
    const result = grantLives(lives, 5);
    expect(result.success).toBe(true);
    expect(result.livesAdded).toBe(4); // capped at max
    expect(result.livesRemaining).toBe(MAX_LIVES);
  });
});
