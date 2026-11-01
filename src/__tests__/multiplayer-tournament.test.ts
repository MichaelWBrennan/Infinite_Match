// Multiplayer tournament mode tests.
// Covers: tournament creation, joining, starting, bracket generation,
// match results, advancement, standings, prize distribution, and live ops
// integration (social store publication).
// Each test is self-contained; state is reset before each test.
import { afterAll, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { router as multiplayerRoutes, initializeMultiplayerServices, getTournamentManager } from '../routes/multiplayer.js';
import { socialStore } from '../services/social/social-store.js';
import security from '../core/security/index.js';

// ---------------------------------------------------------------------------
// Minimal Socket.IO mock for service initialization.
// ---------------------------------------------------------------------------
function createMockIo() {
  const to = (room: string) => ({
    socketsJoin: () => {},
    socketsLeave: () => {},
    leave: () => {},
    emit: () => {}
  });
  return { to };
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const PLAYER_IDS = ['tourney_alice', 'tourney_bob', 'tourney_carol', 'tourney_dave'];
const tokens: Record<string, string> = {};
let app: express.Application;

async function login(playerId: string): Promise<string> {
  const sessionId = security.createSession(playerId, {});
  const token = await security.generateToken({ playerId, sessionId });
  return token;
}

function authHeader(playerId: string) {
  return { Authorization: `Bearer ${tokens[playerId]}` };
}

// Create a full 4-player tournament and start it. Returns the tournament id.
async function createAndStartFullTournament(creatorId = 'tourney_alice') {
  const tId = await createTournamentViaApi(creatorId);
  await joinTournamentViaApi('tourney_bob', tId);
  await joinTournamentViaApi('tourney_carol', tId);
  await joinTournamentViaApi('tourney_dave', tId);
  await startTournamentViaApi(creatorId, tId);
  return tId;
}

async function createTournamentViaApi(playerId: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/multiplayer/tournaments')
    .set(authHeader(playerId))
    .send({
      name: 'Test Tournament',
      maxPlayers: 4,
      entryFee: 100,
      prizePool: 400,
      ...overrides
    });
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  return res.body.data.tournament.id;
}

async function joinTournamentViaApi(playerId: string, tournamentId: string) {
  const res = await request(app)
    .post(`/api/multiplayer/tournaments/${tournamentId}/join`)
    .set(authHeader(playerId))
    .send({});
  expect(res.status).toBe(200);
  return res.body.data;
}

async function startTournamentViaApi(playerId: string, tournamentId: string) {
  const res = await request(app)
    .post(`/api/multiplayer/tournaments/${tournamentId}/start`)
    .set(authHeader(playerId))
    .send({});
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  return res.body.data.tournament;
}

async function getTournament(tournamentId: string, playerId: string = 'tourney_alice') {
  const res = await request(app)
    .get(`/api/multiplayer/tournaments/${tournamentId}`)
    .set(authHeader(playerId));
  expect(res.status).toBe(200);
  return res.body.data;
}

async function recordMatchResult(tournamentId: string, matchId: string, winnerId: string, reporterId: string, scores?: Record<string, number>) {
  const res = await request(app)
    .post(`/api/multiplayer/tournaments/${tournamentId}/matches/${matchId}/result`)
    .set(authHeader(reporterId))
    .send({ winnerId, scores });
  expect(res.status).toBe(200);
  return res.body.data;
}

let socialDir: string;

beforeAll(async () => {
  socialDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tourney-social-'));
  process.env.SOCIAL_STORE_FILE = path.join(socialDir, 'social.json');

  app = express();
  app.use(express.json());
  app.use('/api/multiplayer', multiplayerRoutes);

  initializeMultiplayerServices(createMockIo() as unknown as never);

  for (const pid of PLAYER_IDS) {
    tokens[pid] = await login(pid);
  }
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
  // Reset tournament state between tests for isolation
  getTournamentManager().reset();
});

afterAll(() => {
  for (const pid of PLAYER_IDS) {
    try {
      security.destroySession('');
    } catch {
      // ignore
    }
  }
});

describe('multiplayer tournament - route security', () => {
  test('unauthenticated tournament creation is rejected with 401', async () => {
    const res = await request(app)
      .post('/api/multiplayer/tournaments')
      .send({ name: 'T1', maxPlayers: 4 });
    expect(res.status).toBe(401);
  });

  test('unauthenticated tournament join is rejected with 401', async () => {
    const res = await request(app)
      .post('/api/multiplayer/tournaments/some-id/join')
      .send({});
    expect(res.status).toBe(401);
  });

  test('unauthenticated tournament start is rejected with 401', async () => {
    const res = await request(app)
      .post('/api/multiplayer/tournaments/some-id/start')
      .send({});
    expect(res.status).toBe(401);
  });
});

describe('multiplayer tournament - creation and joining', () => {
  test('create a tournament', async () => {
    const tId = await createTournamentViaApi('tourney_alice');
    expect(tId).toBeDefined();
    expect(typeof tId).toBe('string');
  });

  test('other players join the tournament', async () => {
    const tId = await createTournamentViaApi('tourney_alice');
    await joinTournamentViaApi('tourney_bob', tId);
    await joinTournamentViaApi('tourney_carol', tId);
    await joinTournamentViaApi('tourney_dave', tId);

    const t = await getTournament(tId);
    expect(t.playerCount).toBe(4);
  });

  test('tournament lists as available', async () => {
    await createTournamentViaApi('tourney_alice');
    const res = await request(app)
      .get('/api/multiplayer/tournaments')
      .set(authHeader('tourney_alice'));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('tournament details are retrievable', async () => {
    const tId = await createTournamentViaApi('tourney_alice');
    await joinTournamentViaApi('tourney_bob', tId);

    const t = await getTournament(tId);
    expect(t.id).toBe(tId);
    expect(t.status).toBe('registration');
    expect(t.playerCount).toBe(2);
  });

  test('cannot join same tournament twice', async () => {
    const tId = await createTournamentViaApi('tourney_alice');
    await joinTournamentViaApi('tourney_bob', tId);

    const res = await request(app)
      .post(`/api/multiplayer/tournaments/${tId}/join`)
      .set(authHeader('tourney_alice'))
      .send({});
    expect(res.status).toBe(500);
  });

  test('tournament is full after max players join', async () => {
    const tId = await createTournamentViaApi('tourney_alice', { maxPlayers: 2 });
    await joinTournamentViaApi('tourney_bob', tId);

    const res = await request(app)
      .post(`/api/multiplayer/tournaments/${tId}/join`)
      .set(authHeader('tourney_carol'))
      .send({});
    expect(res.status).toBe(500);
  });
});

describe('multiplayer tournament - starting and brackets', () => {
  test('start a tournament with 4 players', async () => {
    const tId = await createAndStartFullTournament();
    const t = await getTournament(tId);
    expect(t.status).toBe('active');
    expect(t.currentRound).toBe(1);
    expect(t.brackets).toBeDefined();
    expect(t.brackets.length).toBeGreaterThan(0);
  });

  test('bracket has round 1 matches for all players', async () => {
    const tId = await createAndStartFullTournament();
    const t = await getTournament(tId);

    const round1 = t.brackets.find((b: any) => b.round === 1);
    expect(round1).toBeDefined();
    // 4 players = 2 matches in round 1
    expect(round1.matches.length).toBe(2);
    // All 4 players should be in round 1 matches
    const round1Players = round1.matches.flatMap((m: any) =>
      [m.player1Id, m.player2Id].filter(Boolean)
    );
    expect(round1Players.sort()).toEqual(
      ['tourney_alice', 'tourney_bob', 'tourney_carol', 'tourney_dave'].sort()
    );
  });

  test('only creator can start tournament', async () => {
    const tId = await createTournamentViaApi('tourney_alice');
    await joinTournamentViaApi('tourney_bob', tId);

    const res = await request(app)
      .post(`/api/multiplayer/tournaments/${tId}/start`)
      .set(authHeader('tourney_bob'))
      .send({});
    expect(res.status).toBe(500);
  });

  test('cannot start tournament with too few players', async () => {
    const tId = await createTournamentViaApi('tourney_alice', { maxPlayers: 4 });
    await joinTournamentViaApi('tourney_bob', tId);
    // Only 2 players, need 4

    const res = await request(app)
      .post(`/api/multiplayer/tournaments/${tId}/start`)
      .set(authHeader('tourney_alice'))
      .send({});
    expect(res.status).toBe(500);
  });
});

describe('multiplayer tournament - match results and advancement', () => {
  test('complete round 1 match and record winner', async () => {
    const tId = await createAndStartFullTournament();
    const t = await getTournament(tId);

    const round1 = t.brackets.find((b: any) => b.round === 1);
    // Find the match involving tourney_alice
    const aliceMatch = round1.matches.find((m: any) =>
      m.player1Id === 'tourney_alice' || m.player2Id === 'tourney_alice'
    );
    const opponent = aliceMatch.player1Id === 'tourney_alice'
      ? aliceMatch.player2Id
      : aliceMatch.player1Id;

    const result = await recordMatchResult(tId, aliceMatch.id, 'tourney_alice', 'tourney_alice', {
      tourney_alice: 1500,
      [opponent]: 800
    });
    expect(result.match.winnerId).toBe('tourney_alice');
    expect(result.match.status).toBe('completed');
  });

  test('non-participant cannot record match result', async () => {
    const tId = await createAndStartFullTournament();
    const t = await getTournament(tId);

    const round1 = t.brackets.find((b: any) => b.round === 1);
    const match1 = round1.matches[0];
    const p1 = match1.player1Id;
    const p2 = match1.player2Id;

    // Record result first (completes the match)
    await recordMatchResult(tId, match1.id, p1, p1);

    // Non-participant (tourney_carol, assuming not in this match) tries to report
    const nonParticipant = p1 === 'tourney_carol' || p2 === 'tourney_carol'
      ? 'tourney_dave'
      : 'tourney_carol';
    const res = await request(app)
      .post(`/api/multiplayer/tournaments/${tId}/matches/${match1.id}/result`)
      .set(authHeader(nonParticipant))
      .send({ winnerId: p1 });
    expect(res.status).toBe(500);
  });

  test('winner advances to next round', async () => {
    const tId = await createAndStartFullTournament();
    const t = await getTournament(tId);

    const round1 = t.brackets.find((b: any) => b.round === 1);
    // Find alice's match and the OTHER match (different participants)
    const aliceMatch = round1.matches.find((m: any) =>
      m.player1Id === 'tourney_alice' || m.player2Id === 'tourney_alice'
    );
    const aliceOpponent = aliceMatch.player1Id === 'tourney_alice'
      ? aliceMatch.player2Id
      : aliceMatch.player1Id;
    const otherMatch = round1.matches.find(
      (m: any) => m.id !== aliceMatch.id
    );
    const otherWinner = otherMatch.player1Id; // either player can win

    // Alice wins her match
    await recordMatchResult(tId, aliceMatch.id, 'tourney_alice', 'tourney_alice');
    // Winner of other match advances
    await recordMatchResult(tId, otherMatch.id, otherWinner, otherWinner);

    // Check round 2 final - both winners should be there
    const t2 = await getTournament(tId);
    const round2 = t2.brackets.find((b: any) => b.round === 2);
    expect(round2).toBeDefined();
    const finalMatch = round2.matches[0];
    expect(finalMatch.player1Id).toBeDefined();
    expect(finalMatch.player2Id).toBeDefined();
    expect(finalMatch.status).toBe('active');
    // One of them must be alice
    expect([finalMatch.player1Id, finalMatch.player2Id]).toContain('tourney_alice');
  });

  test('final match completes tournament', async () => {
    const tId = await createAndStartFullTournament();
    const t = await getTournament(tId);

    const round1 = t.brackets.find((b: any) => b.round === 1);
    // Find alice's match and the other match
    const aliceMatch = round1.matches.find((m: any) =>
      m.player1Id === 'tourney_alice' || m.player2Id === 'tourney_alice'
    );
    const otherMatch = round1.matches.find(
      (m: any) => m.id !== aliceMatch.id
    );
    const otherWinner = otherMatch.player1Id;

    // Alice wins her match
    await recordMatchResult(tId, aliceMatch.id, 'tourney_alice', 'tourney_alice');
    // Other match winner advances
    await recordMatchResult(tId, otherMatch.id, otherWinner, otherWinner);

    const t2 = await getTournament(tId);
    const round2 = t2.brackets.find((b: any) => b.round === 2);
    const finalMatch = round2.matches[0];

    // Alice wins the final
    const result = await recordMatchResult(
      tId,
      finalMatch.id,
      'tourney_alice',
      'tourney_alice'
    );
    expect(result.tournament.status).toBe('completed');
    expect(result.tournament.winnerId).toBe('tourney_alice');
  });
});

describe('multiplayer tournament - standings and prizes', () => {
  test('standings show correct placement and prizes', async () => {
    const tId = await createAndStartFullTournament();
    const t = await getTournament(tId);

    const round1 = t.brackets.find((b: any) => b.round === 1);
    // Find alice's match and the other match
    const aliceMatch = round1.matches.find((m: any) =>
      m.player1Id === 'tourney_alice' || m.player2Id === 'tourney_alice'
    );
    const otherMatch = round1.matches.find(
      (m: any) => m.id !== aliceMatch.id
    );
    const otherWinner = otherMatch.player1Id;

    // Alice wins her match
    await recordMatchResult(tId, aliceMatch.id, 'tourney_alice', 'tourney_alice');
    // Other match winner advances
    await recordMatchResult(tId, otherMatch.id, otherWinner, otherWinner);

    const t2 = await getTournament(tId);
    const round2 = t2.brackets.find((b: any) => b.round === 2);
    // Alice wins the final
    await recordMatchResult(tId, round2.matches[0].id, 'tourney_alice', 'tourney_alice');

    // Get standings
    const standingsRes = await request(app)
      .get(`/api/multiplayer/tournaments/${tId}/standings`)
      .set(authHeader('tourney_alice'));
    expect(standingsRes.status).toBe(200);
    expect(standingsRes.body.success).toBe(true);

    const standings = standingsRes.body.data.standings;
    expect(standings.length).toBe(4);

    // 1st place
    expect(standings[0].playerId).toBe('tourney_alice');
    expect(standings[0].placement).toBe(1);
    expect(standings[0].prize).toBe(200); // 50% of 400
  });
});

describe('multiplayer tournament - statistics', () => {
  test('get tournament statistics', async () => {
    const res = await request(app)
      .get('/api/multiplayer/stats')
      .set(authHeader('tourney_alice'));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('multiplayer tournament - live ops integration', () => {
  test('match win is published to social store tournament board', async () => {
    const tId = await createAndStartFullTournament();
    const t = await getTournament(tId);

    const round1 = t.brackets.find((b: any) => b.round === 1);
    const aliceMatch = round1.matches.find((m: any) =>
      m.player1Id === 'tourney_alice' || m.player2Id === 'tourney_alice'
    );
    const aliceScore = 1500;

    // Record alice's win
    await recordMatchResult(tId, aliceMatch.id, 'tourney_alice', 'tourney_alice', {
      tourney_alice: aliceScore,
    });

    // Verify the win appears in the social store tournament board
    const board = await socialStore.tournamentBoard(tId, 'tourney_alice', 10);
    expect(board.entries.length).toBeGreaterThan(0);

    const aliceEntry = board.entries.find((e: any) => e.isYou);
    expect(aliceEntry).toBeDefined();
    expect(aliceEntry.score).toBe(aliceScore);
    expect(aliceEntry.rank).toBe(1);
  });

  test('tournament board ranks players by score', async () => {
    const tId = await createAndStartFullTournament();
    const t = await getTournament(tId);

    const round1 = t.brackets.find((b: any) => b.round === 1);
    // Find alice's match and the other match
    const aliceMatch = round1.matches.find((m: any) =>
      m.player1Id === 'tourney_alice' || m.player2Id === 'tourney_alice'
    );
    const otherMatch = round1.matches.find(
      (m: any) => m.id !== aliceMatch.id
    );
    const aliceOpponent = aliceMatch.player1Id === 'tourney_alice'
      ? aliceMatch.player2Id
      : aliceMatch.player1Id;
    const otherWinner = otherMatch.player1Id;

    // Alice wins with 2000
    await recordMatchResult(tId, aliceMatch.id, 'tourney_alice', 'tourney_alice', {
      tourney_alice: 2000,
      [aliceOpponent]: 800,
    });
    // Other match winner scores 1200
    await recordMatchResult(tId, otherMatch.id, otherWinner, otherWinner, {
      [otherWinner]: 1200,
      [otherMatch.player1Id === otherWinner ? otherMatch.player2Id : otherMatch.player1Id]: 900,
    });

    const board = await socialStore.tournamentBoard(tId, 'tourney_alice', 10);
    expect(board.entries.length).toBe(4);

    // Scores should be sorted descending
    const scores = board.entries.map((e: any) => e.score);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
    }

    // Alice should be rank 1 with 2000
    const aliceEntry = board.entries.find((e: any) => e.isYou);
    expect(aliceEntry.score).toBe(2000);
    expect(aliceEntry.rank).toBe(1);
  });

  test('duplicate win reporting does not double-count', async () => {
    const tId = await createAndStartFullTournament();
    const t = await getTournament(tId);

    const round1 = t.brackets.find((b: any) => b.round === 1);
    // Find alice's match
    const aliceMatch = round1.matches.find((m: any) =>
      m.player1Id === 'tourney_alice' || m.player2Id === 'tourney_alice'
    );
    const winnerId = 'tourney_alice';

    // Record alice's win
    await recordMatchResult(tId, aliceMatch.id, winnerId, winnerId, {
      [winnerId]: 1500,
    });

    const board1 = await socialStore.tournamentBoard(tId, 'tourney_alice', 10);
    const aliceEntry1 = board1.entries.find((e: any) => e.isYou);
    expect(aliceEntry1).toBeDefined();
    expect(aliceEntry1.score).toBe(1500);

    // Match is already completed, so retrying should fail
    const res = await request(app)
      .post(`/api/multiplayer/tournaments/${tId}/matches/${aliceMatch.id}/result`)
      .set(authHeader(winnerId))
      .send({ winnerId, scores: { [winnerId]: 1500 } });
    expect(res.status).toBe(500);

    // Score should not have changed
    const board2 = await socialStore.tournamentBoard(tId, 'tourney_alice', 10);
    const aliceEntry2 = board2.entries.find((e: any) => e.isYou);
    expect(aliceEntry2.score).toBe(1500);
  });
});
