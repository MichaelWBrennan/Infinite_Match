import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { levelTarget, starsForScore, winRewards, WIN_REWARDS } from '../services/meta/rewards.js';

// The client's levelConfig() decides the target a player sees. The server must use the same
// number, or a legitimate win could be refused or a short one accepted.
const source = fs.readFileSync(path.join(process.cwd(), 'phaser3-game.js'), 'utf-8');
const clientLevelConfig = new Function(
  `${source.match(/function levelConfig\(level\) \{[\s\S]*?\n\}/)![0]}; return levelConfig;`,
)() as any;

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
