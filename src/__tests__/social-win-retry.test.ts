import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { SocialStore } from '../services/social/social-store.js';

describe('a verified receipt can safely recover its social progress', () => {
  test('a repeated or restarted write counts one challenge win, while a new attempt counts another', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'social-retry-'));
    try {
      const file = path.join(dir, 'social.json');
      const first = new SocialStore(file);
      const win = { level: 4, score: 1800, attemptId: 'paid-attempt-1',
        tournamentIds: ['cup'], challengeIds: ['group'] };
      expect((await first.recordWin('p', win)).duplicate).toBe(false);
      expect((await first.recordWin('p', win)).duplicate).toBe(true);
      expect((await first.challengeStanding('group', 'p')).contributed).toBe(1);
      const restarted = new SocialStore(file);
      expect((await restarted.recordWin('p', win)).duplicate).toBe(true);
      expect((await restarted.challengeStanding('group', 'p')).contributed).toBe(1);
      await restarted.recordWin('p', { ...win, attemptId: 'paid-attempt-2', score: 1900 });
      expect((await restarted.challengeStanding('group', 'p')).contributed).toBe(2);
      expect((await restarted.tournamentBoard('cup', 'p')).you.score).toBe(1900);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
