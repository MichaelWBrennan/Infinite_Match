import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { levelTarget, starsForScore, winRewards, WIN_REWARDS } from '../services/meta/rewards.js';

// The client's levelConfig() decides the target a player sees. The server must use the same
// number, or a legitimate win could be refused or a short one accepted.
const source = fs.readFileSync(path.join(process.cwd(), 'phaser3-game.js'), 'utf-8');
// levelConfig(level, mode) reads the server's tuning overrides through its first parameter.
const levelConfigSource = source.match(/function levelConfig\([^)]*\) \{[\s\S]*?\n\}/)![0];
const clientLevelConfigWith = (overrides: unknown) =>
  new Function('levelOverrides', `${levelConfigSource}; return levelConfig;`)(overrides) as any;
const clientLevelConfig = clientLevelConfigWith({ levels: {} });

describe('server level target matches the client', () => {
  test.each(Array.from({ length: 60 }, (_, i) => i + 1))('level %i has the same target', (level) => {
    expect(levelTarget(level)).toBe(clientLevelConfig(level).targetScore);
  });

  test('the client star thresholds are the same multipliers the server uses', () => {
    expect(source).toMatch(/if \(score >= target \* 2\) return 3;/);
    expect(source).toMatch(/if \(score >= target \* 1\.5\) return 2;/);
    expect(source).toMatch(/if \(score >= target\) return 1;/);
  });
});

describe('stars and rewards', () => {
  test('stars follow the target: 0 below it, 1 at it, 2 at 1.5x, 3 at 2x', () => {
    const t = levelTarget(2);
    expect(starsForScore(t - 1, 2)).toBe(0);
    expect(starsForScore(t, 2)).toBe(1);
    expect(starsForScore(Math.ceil(t * 1.5), 2)).toBe(2);
    expect(starsForScore(t * 2, 2)).toBe(3);
  });

  test('boss levels need twice the target', () => {
    expect(levelTarget(9)).toBe(800 + 9 * 60);
    expect(levelTarget(10)).toBe((800 + 10 * 60) * 2);
  });

  test('a win pays the base plus a per-star amount', () => {
    expect(winRewards(1)).toEqual({ coins: WIN_REWARDS.coinsBase + WIN_REWARDS.coinsPerStar, xp: 100, stars: 1 });
    expect(winRewards(3).coins).toBe(35);
  });
});

describe('tuning overrides and game modes on the client', () => {
  test('a level override scales the client target the same way the server does', () => {
    const client = clientLevelConfigWith({ levels: { 12: 1.1, 30: 0.9 } });
    expect(client(12).targetScore).toBe(levelTarget(12, 1.1));
    expect(client(30).targetScore).toBe(levelTarget(30, 0.9));
    expect(client(13).targetScore).toBe(levelTarget(13));
  });

  test('timed mode has a 60-second clock and no move limit', () => {
    const timed = clientLevelConfig(3, 'timed');
    expect(timed.timeLimit).toBe(60);
    expect(timed.moves).toBeGreaterThan(900);
    expect(timed.targetScore).toBe(levelTarget(3));
  });

  test('endless mode has no clock and no reachable target', () => {
    const endless = clientLevelConfig(1, 'endless');
    expect(endless.timeLimit).toBe(0);
    expect(endless.targetScore).toBe(Number.MAX_SAFE_INTEGER);
  });

  test('classic mode is the default and keeps the 60-second clock', () => {
    expect(clientLevelConfig(4).mode).toBe('classic');
    expect(clientLevelConfig(4, 'classic').timeLimit).toBe(60);
  });
});
