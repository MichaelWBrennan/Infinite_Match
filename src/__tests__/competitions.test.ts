import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import authRoutes from '../routes/auth.js';
import liveOpsRoutes from '../routes/live-ops.js';
import { rbacProvider, ROLES } from '../core/security/rbac.js';
import {
  MAX_CHALLENGE_GOAL,
  MAX_PRIZE_COINS,
  activeCompetitions,
  prizeForRank,
  validateCompetitions,
} from '../services/live-ops/competitions.js';
import { socialStore } from '../services/social/social-store.js';

const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();

const liveTournament = (now: number) => ({
  id: 'cup_live',
  name: 'Live Cup',
  start: iso(now - DAY),
  end: iso(now + DAY),
  prizes: [
    { from: 1, to: 1, coins: 300 },
    { from: 2, to: 3, coins: 150 },
  ],
});
const endedTournament = (now: number) => ({
  id: 'cup_done',
  name: 'Last Cup',
  start: iso(now - 3 * DAY),
  end: iso(now - DAY),
  prizes: [{ from: 1, to: 1, coins: 500 }],
});
const liveChallenge = (now: number, goal = 2) => ({
  id: 'rush_live',
  name: 'Community Rush',
  start: iso(now - DAY),
  end: iso(now + DAY),
  goal,
  reward: { coins: 400 },
});

describe('competition config', () => {
  const now = Date.now();

  test('valid tournaments and challenges are kept', () => {
    const r = validateCompetitions({ tournaments: [liveTournament(now)], challenges: [liveChallenge(now)] });
    expect(r.errors).toEqual([]);
    expect(r.tournaments).toHaveLength(1);
    expect(r.challenges).toHaveLength(1);
  });

  test('an entry with a bad id, window, prize, or goal is dropped and reported', () => {
    const bad = [
      { ...liveTournament(now), id: 'Bad Id' },
      { ...liveTournament(now), end: liveTournament(now).start },
      { ...liveTournament(now), prizes: [{ from: 3, to: 2, coins: 10 }] },
      { ...liveTournament(now), prizes: [{ from: 1, to: 1, coins: MAX_PRIZE_COINS + 1 }] },
    ];
    const r = validateCompetitions({ tournaments: bad });
    expect(r.tournaments).toEqual([]);
    expect(r.errors.length).toBe(4);
    const badChallenges = validateCompetitions({
      challenges: [{ ...liveChallenge(now), goal: MAX_CHALLENGE_GOAL + 1 }, { ...liveChallenge(now), reward: { coins: 0 } }],
    });
    expect(badChallenges.challenges).toEqual([]);
    expect(badChallenges.errors.length).toBe(2);
  });

  test('a duplicate id keeps only the first entry', () => {
    const r = validateCompetitions({ tournaments: [liveTournament(now), liveTournament(now)] });
    expect(r.tournaments).toHaveLength(1);
    expect(r.errors.join(' ')).toMatch(/duplicate id/);
  });

  test('only competitions whose window contains now are active', () => {
    const config = validateCompetitions({
      tournaments: [liveTournament(now), endedTournament(now)],
      challenges: [liveChallenge(now)],
    });
    const active = activeCompetitions(config, now);
    expect(active.tournaments.map((t) => t.id)).toEqual(['cup_live']);
    expect(active.challenges.map((c) => c.id)).toEqual(['rush_live']);
  });

  test('a place earns the prize for its range, and no prize past the list', () => {
    const t = { prizes: [{ from: 1, to: 1, coins: 300 }, { from: 2, to: 3, coins: 150 }] } as any;
    expect(prizeForRank(t, 1)).toBe(300);
    expect(prizeForRank(t, 3)).toBe(150);
    expect(prizeForRank(t, 4)).toBe(0);
  });
});

describe('competition routes', () => {
  let dir: string;
  const now = Date.now();
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/live-ops', liveOpsRoutes);

  const player = `comp_p_${now}`;
  const admin = `comp_a_${now}`;
  let playerToken = '';
  let adminToken = '';

  beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'comp-'));
    process.env.SOCIAL_STORE_FILE = path.join(dir, 'social.json');
    const config = {
      events: [],
      deals: [],
      tournaments: [liveTournament(now), endedTournament(now)],
      challenges: [liveChallenge(now, 2)],
    };
    const file = path.join(dir, 'liveops.json');
    fs.writeFileSync(file, JSON.stringify(config));
    process.env.LIVE_OPS_CONFIG = file;

    // The auth route allows 5 registrations per 15 minutes per IP. This file registers two players.
    const a = await request(app).post('/api/auth/register').send({ playerId: player, email: `${player}@example.com`, password: 'secret123' });
    playerToken = a.body.token as string;
    const b = await request(app).post('/api/auth/register').send({ playerId: admin, email: `${admin}@example.com`, password: 'secret123' });
    adminToken = b.body.token as string;
    rbacProvider.assignRole(admin, ROLES.ADMIN, 'test');
  });

  afterAll(() => {
    delete process.env.LIVE_OPS_CONFIG;
    delete process.env.SOCIAL_STORE_FILE;
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('competitions need a session', async () => {
    expect((await request(app).get('/api/live-ops/competitions')).status).toBe(401);
  });

  test('the caller sees running tournaments and challenges, not ended ones', async () => {
    const res = await request(app).get('/api/live-ops/competitions').set('Authorization', `Bearer ${playerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.tournaments.map((t: any) => t.id)).toEqual(['cup_live']);
    expect(res.body.challenges[0]).toMatchObject({ id: 'rush_live', goal: 2, progress: 0, canClaim: false });
  });

  test('a challenge is claimed once the goal is reached, by a contributor, and only once', async () => {
    // One win from someone else is not enough: the goal is 2.
    await socialStore.recordWin(`other_${now}`, { level: 1, score: 900, challengeIds: ['rush_live'] });
    const early = await request(app).post('/api/live-ops/challenges/rush_live/claim').set('Authorization', `Bearer ${playerToken}`);
    expect(early.status).toBe(409);
    expect(early.body.error).toBe('goal_not_reached');

    await socialStore.recordWin(player, { level: 1, score: 900, challengeIds: ['rush_live'] });
    const claimed = await request(app).post('/api/live-ops/challenges/rush_live/claim').set('Authorization', `Bearer ${playerToken}`);
    expect(claimed.status).toBe(200);
    expect(claimed.body.result.reward).toEqual({ coins: 400 });
    expect(claimed.body.result.balances.coins).toBe(1400);

    const again = await request(app).post('/api/live-ops/challenges/rush_live/claim').set('Authorization', `Bearer ${playerToken}`);
    expect(again.status).toBe(409);
    expect(again.body.error).toBe('already_claimed');
  });

  test('a challenge that is not running cannot be claimed', async () => {
    const res = await request(app).post('/api/live-ops/challenges/nope/claim').set('Authorization', `Bearer ${playerToken}`);
    expect(res.status).toBe(404);
  });

  test('settling a tournament is for admins only', async () => {
    const res = await request(app).post('/api/live-ops/tournaments/cup_done/settle').set('Authorization', `Bearer ${playerToken}`);
    expect(res.status).toBe(403);
  });

  test('a running tournament cannot be settled yet', async () => {
    const res = await request(app).post('/api/live-ops/tournaments/cup_live/settle').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('tournament_not_ended');
  });

  test('settling pays each ranked player once', async () => {
    // The ended tournament's scores, as if the wins had happened while it ran.
    await socialStore.recordWin(player, { level: 1, score: 1000, tournamentIds: ['cup_done'] });
    await socialStore.recordWin(`rival_${now}`, { level: 1, score: 500, tournamentIds: ['cup_done'] });

    const first = await request(app).post('/api/live-ops/tournaments/cup_done/settle').set('Authorization', `Bearer ${adminToken}`);
    expect(first.status).toBe(200);
    expect(first.body.result.paid).toEqual([{ rank: 1, coins: 500 }]);
    expect(first.body.result.alreadyPaid).toEqual([]);

    const second = await request(app).post('/api/live-ops/tournaments/cup_done/settle').set('Authorization', `Bearer ${adminToken}`);
    expect(second.body.result.paid).toEqual([]);
    expect(second.body.result.alreadyPaid).toEqual([1]);
  });

  test('an unknown tournament cannot be settled', async () => {
    const res = await request(app).post('/api/live-ops/tournaments/none/settle').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
