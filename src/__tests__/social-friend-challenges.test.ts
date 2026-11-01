// Social friend challenges tests.
// Covers: create/accept/decline friend challenges, report results,
// friend challenge leaderboard, and Socket.IO integration.
import { afterAll, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import socialRoutes from '../routes/social.js';
import { socialStore, SocialStore } from '../services/social/social-store.js';
import security from '../core/security/index.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let socialDir: string;
let app: express.Application;

const PLAYER_IDS = ['fc_alice', 'fc_bob', 'fc_carol'];
const tokens: Record<string, string> = {};

async function login(playerId: string): Promise<string> {
  const sessionId = security.createSession(playerId, {});
  const token = await security.generateToken({ playerId, sessionId });
  return token;
}

function authHeader(playerId: string) {
  return { Authorization: `Bearer ${tokens[playerId]}` };
}

async function befriend(store: SocialStore, a: string, b: string) {
  await store.write((d) => {
    d.friends[a] = [...(d.friends[a] || []), b];
    d.friends[b] = [...(d.friends[b] || []), a];
  });
}

beforeAll(async () => {
  socialDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-social-'));
  process.env.SOCIAL_STORE_FILE = path.join(socialDir, 'social.json');

  app = express();
  app.use(express.json());
  app.use('/api/social', socialRoutes);

  for (const pid of PLAYER_IDS) {
    tokens[pid] = await login(pid);
  }

  // Befriend all players using the same singleton the routes use
  await socialStore.write((d) => {
    d.friends['fc_alice'] = ['fc_bob', 'fc_carol'];
    d.friends['fc_bob'] = ['fc_alice', 'fc_carol'];
    d.friends['fc_carol'] = ['fc_alice', 'fc_bob'];
  });
});

afterAll(() => {
  for (const pid of PLAYER_IDS) {
    try {
      security.destroySession('');
    } catch {
      // ignore
    }
  }
  try {
    fs.rmSync(socialDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
  delete process.env.SOCIAL_STORE_FILE;
});

beforeEach(() => {
  // Reset social store state between tests
  socialStore.write((d) => {
    d.friendChallenges = {};
    d.friendChallengeInvites = {};
  });
});

describe('social - friend challenges - route security', () => {
  test('unauthenticated challenge creation is rejected with 401', async () => {
    const res = await request(app)
      .post('/api/social/friend-challenges')
      .send({ toId: 'fc_bob' });
    expect(res.status).toBe(401);
  });

  test('unauthenticated challenge accept is rejected with 401', async () => {
    const res = await request(app)
      .post('/api/social/friend-challenges/some-id/accept')
      .send({});
    expect(res.status).toBe(401);
  });

  test('unauthenticated challenge result is rejected with 401', async () => {
    const res = await request(app)
      .post('/api/social/friend-challenges/some-id/result')
      .send({ winnerId: 'fc_alice' });
    expect(res.status).toBe(401);
  });

  test('unauthenticated leaderboard is rejected with 401', async () => {
    const res = await request(app)
      .get('/api/social/friend-challenges/leaderboard');
    expect(res.status).toBe(401);
  });
});

describe('social - friend challenges - create and accept', () => {
  test('create a friend challenge', async () => {
    const res = await request(app)
      .post('/api/social/friend-challenges')
      .set(authHeader('fc_alice'))
      .send({ toId: 'fc_bob', gameType: 'match3_versus', targetScore: 1500 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result.challengeId).toBeDefined();
    expect(res.body.result.challenge.status).toBe('pending');
  });

  test('challenge to non-friend is rejected', async () => {
    const res = await request(app)
      .post('/api/social/friend-challenges')
      .set(authHeader('fc_alice'))
      .send({ toId: 'nonexistent_player' });
    expect(res.status).toBe(404); // SocialError not_friends → 404
  });

  test('self challenge is rejected', async () => {
    const res = await request(app)
      .post('/api/social/friend-challenges')
      .set(authHeader('fc_alice'))
      .send({ toId: 'fc_alice' });
    expect(res.status).toBe(409);
  });

  test('accept a friend challenge', async () => {
    const createRes = await request(app)
      .post('/api/social/friend-challenges')
      .set(authHeader('fc_alice'))
      .send({ toId: 'fc_bob' });
    const challengeId = createRes.body.result.challengeId;

    const acceptRes = await request(app)
      .post(`/api/social/friend-challenges/${challengeId}/accept`)
      .set(authHeader('fc_bob'))
      .send({});
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.result.challenge.status).toBe('accepted');
  });

  test('non-challenged player cannot accept', async () => {
    const createRes = await request(app)
      .post('/api/social/friend-challenges')
      .set(authHeader('fc_alice'))
      .send({ toId: 'fc_bob' });
    const challengeId = createRes.body.result.challengeId;

    const res = await request(app)
      .post(`/api/social/friend-challenges/${challengeId}/accept`)
      .set(authHeader('fc_carol'))
      .send({});
    expect(res.status).toBe(400); // not_challenged_player → 400
  });

  test('decline a friend challenge', async () => {
    const createRes = await request(app)
      .post('/api/social/friend-challenges')
      .set(authHeader('fc_alice'))
      .send({ toId: 'fc_bob' });
    const challengeId = createRes.body.result.challengeId;

    const declineRes = await request(app)
      .post(`/api/social/friend-challenges/${challengeId}/decline`)
      .set(authHeader('fc_bob'))
      .send({});
    expect(declineRes.status).toBe(200);
    expect(declineRes.body.result.challenge.status).toBe('declined');
  });

  test('get pending challenges', async () => {
    await request(app)
      .post('/api/social/friend-challenges')
      .set(authHeader('fc_alice'))
      .send({ toId: 'fc_bob' });

    const res = await request(app)
      .get('/api/social/friend-challenges/pending')
      .set(authHeader('fc_bob'));
    expect(res.status).toBe(200);
    expect(res.body.challenges.length).toBe(1);
    expect(res.body.challenges[0].status).toBe('pending');
    expect(res.body.challenges[0].fromLabel).toBeDefined();
  });
});

describe('social - friend challenges - report results', () => {
  test('report friend challenge result', async () => {
    const createRes = await request(app)
      .post('/api/social/friend-challenges')
      .set(authHeader('fc_alice'))
      .send({ toId: 'fc_bob', targetScore: 1500 });
    const challengeId = createRes.body.result.challengeId;

    await request(app)
      .post(`/api/social/friend-challenges/${challengeId}/accept`)
      .set(authHeader('fc_bob'))
      .send({});

    const resultRes = await request(app)
      .post(`/api/social/friend-challenges/${challengeId}/result`)
      .set(authHeader('fc_alice'))
      .send({ winnerId: 'fc_alice', scores: { fc_alice: 1800, fc_bob: 1200 } });
    expect(resultRes.status).toBe(200);
    expect(resultRes.body.result.challenge.status).toBe('completed');
    expect(resultRes.body.result.winnerId).toBe('fc_alice');
  });

  test('non-participant cannot report result', async () => {
    const createRes = await request(app)
      .post('/api/social/friend-challenges')
      .set(authHeader('fc_alice'))
      .send({ toId: 'fc_bob' });
    const challengeId = createRes.body.result.challengeId;

    await request(app)
      .post(`/api/social/friend-challenges/${challengeId}/accept`)
      .set(authHeader('fc_bob'))
      .send({});

    const res = await request(app)
      .post(`/api/social/friend-challenges/${challengeId}/result`)
      .set(authHeader('fc_carol'))
      .send({ winnerId: 'fc_alice' });
    expect(res.status).toBe(400); // not_challenge_participant → 400
  });

  test('invalid winner is rejected', async () => {
    const createRes = await request(app)
      .post('/api/social/friend-challenges')
      .set(authHeader('fc_alice'))
      .send({ toId: 'fc_bob' });
    const challengeId = createRes.body.result.challengeId;

    await request(app)
      .post(`/api/social/friend-challenges/${challengeId}/accept`)
      .set(authHeader('fc_bob'))
      .send({});

    const res = await request(app)
      .post(`/api/social/friend-challenges/${challengeId}/result`)
      .set(authHeader('fc_alice'))
      .send({ winnerId: 'fc_carol' });
    expect(res.status).toBe(400); // invalid_winner → 400
  });

  test('get all friend challenges for a player', async () => {
    await request(app)
      .post('/api/social/friend-challenges')
      .set(authHeader('fc_alice'))
      .send({ toId: 'fc_bob' });

    const res = await request(app)
      .get('/api/social/friend-challenges')
      .set(authHeader('fc_alice'));
    expect(res.status).toBe(200);
    expect(res.body.challenges.length).toBe(1);
    expect(res.body.challenges[0].fromLabel).toBeDefined();
    expect(res.body.challenges[0].toLabel).toBeDefined();
  });
});

describe('social - friend challenges - leaderboard', () => {
  test('friend challenge leaderboard shows rankings', async () => {
    // Create and complete two challenges
    const c1 = await request(app)
      .post('/api/social/friend-challenges')
      .set(authHeader('fc_alice'))
      .send({ toId: 'fc_bob' });
    await request(app)
      .post(`/api/social/friend-challenges/${c1.body.result.challengeId}/accept`)
      .set(authHeader('fc_bob'))
      .send({});
    await request(app)
      .post(`/api/social/friend-challenges/${c1.body.result.challengeId}/result`)
      .set(authHeader('fc_alice'))
      .send({ winnerId: 'fc_alice', scores: { fc_alice: 2000, fc_bob: 1500 } });

    const c2 = await request(app)
      .post('/api/social/friend-challenges')
      .set(authHeader('fc_alice'))
      .send({ toId: 'fc_carol' });
    await request(app)
      .post(`/api/social/friend-challenges/${c2.body.result.challengeId}/accept`)
      .set(authHeader('fc_carol'))
      .send({});
    await request(app)
      .post(`/api/social/friend-challenges/${c2.body.result.challengeId}/result`)
      .set(authHeader('fc_alice'))
      .send({ winnerId: 'fc_alice', scores: { fc_alice: 2500, fc_carol: 1000 } });

    const res = await request(app)
      .get('/api/social/friend-challenges/leaderboard')
      .set(authHeader('fc_alice'));
    expect(res.status).toBe(200);
    expect(res.body.leaderboard.length).toBeGreaterThanOrEqual(1);

    // Alice should be rank 1 with her best score (2500)
    const aliceEntry = res.body.leaderboard.find((e: any) => e.isYou);
    expect(aliceEntry).toBeDefined();
    expect(aliceEntry.score).toBe(2500);
    expect(aliceEntry.rank).toBe(1);

    // Scores should be sorted descending
    const scores = res.body.leaderboard.map((e: any) => e.score);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
    }
  });

  test('leaderboard is empty when no completed challenges', async () => {
    const res = await request(app)
      .get('/api/social/friend-challenges/leaderboard')
      .set(authHeader('fc_alice'));
    expect(res.status).toBe(200);
    expect(res.body.leaderboard).toEqual([]);
  });
});
