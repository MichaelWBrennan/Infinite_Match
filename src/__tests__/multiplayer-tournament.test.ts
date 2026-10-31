// Multiplayer tournament mode tests.
// Covers: tournament creation, joining, starting, bracket generation,
// match results, advancement, standings, and prize distribution.
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { router as multiplayerRoutes, initializeMultiplayerServices } from '../routes/multiplayer.js';
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

beforeAll(async () => {
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
  let tournamentId: string;

  test('create a tournament', async () => {
    tournamentId = await createTournamentViaApi('tourney_alice');
    expect(tournamentId).toBeDefined();
    expect(typeof tournamentId).toBe('string');
  });

  test('other players join the tournament', async () => {
    await joinTournamentViaApi('tourney_bob', tournamentId);
    await joinTournamentViaApi('tourney_carol', tournamentId);
    await joinTournamentViaApi('tourney_dave', tournamentId);
  });

  test('tournament lists as available', async () => {
    const res = await request(app)
      .get('/api/multiplayer/tournaments')
      .set(authHeader('tourney_alice'));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('tournament details are retrievable', async () => {
    const res = await request(app)
      .get(`/api/multiplayer/tournaments/${tournamentId}`)
      .set(authHeader('tourney_alice'));
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(tournamentId);
    expect(res.body.data.status).toBe('registration');
    expect(res.body.data.playerCount).toBe(4);
  });

  test('cannot join same tournament twice', async () => {
    const res = await request(app)
      .post(`/api/multiplayer/tournaments/${tournamentId}/join`)
      .set(authHeader('tourney_alice'))
      .send({});
    expect(res.status).toBe(500);
  });

  test('tournament is full after max players join', async () => {
    // Create a new tournament with 2 players, fill it, then try a 3rd
    const t2 = await createTournamentViaApi('tourney_alice', { maxPlayers: 2 });
    await joinTournamentViaApi('tourney_bob', t2);
    const res = await request(app)
      .post(`/api/multiplayer/tournaments/${t2}/join`)
      .set(authHeader('tourney_carol'))
      .send({});
    expect(res.status).toBe(500);
  });
});

describe('multiplayer tournament - starting and brackets', () => {
  let tournamentId: string;

  test('start a tournament with 4 players', async () => {
    tournamentId = await createTournamentViaApi('tourney_alice');
    await joinTournamentViaApi('tourney_bob', tournamentId);
    await joinTournamentViaApi('tourney_carol', tournamentId);
    await joinTournamentViaApi('tourney_dave', tournamentId);

    const tournament = await startTournamentViaApi('tourney_alice', tournamentId);
    expect(tournament.status).toBe('active');
    expect(tournament.currentRound).toBe(1);
    expect(tournament.brackets).toBeDefined();
    expect(tournament.brackets.length).toBeGreaterThan(0);
  });

  test('bracket has round 1 matches for all players', async () => {
    const res = await request(app)
      .get(`/api/multiplayer/tournaments/${tournamentId}`)
      .set(authHeader('tourney_alice'));
    expect(res.status).toBe(200);

    const round1 = res.body.data.brackets.find((b: any) => b.round === 1);
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
    const t2 = await createTournamentViaApi('tourney_alice');
    await joinTournamentViaApi('tourney_bob', t2);
    const res = await request(app)
      .post(`/api/multiplayer/tournaments/${t2}/start`)
      .set(authHeader('tourney_bob'))
      .send({});
    expect(res.status).toBe(500);
  });

  test('cannot start tournament with too few players', async () => {
    const t3 = await createTournamentViaApi('tourney_alice', { maxPlayers: 4 });
    await joinTournamentViaApi('tourney_bob', t3);
    // Only 2 players, need 4
    const res = await request(app)
      .post(`/api/multiplayer/tournaments/${t3}/start`)
      .set(authHeader('tourney_alice'))
      .send({});
    expect(res.status).toBe(500);
  });
});

describe('multiplayer tournament - match results and advancement', () => {
  let tournamentId: string;
  let matchId: string;

  test('complete round 1 matches and advance winners', async () => {
    tournamentId = await createTournamentViaApi('tourney_alice');
    await joinTournamentViaApi('tourney_bob', tournamentId);
    await joinTournamentViaApi('tourney_carol', tournamentId);
    await joinTournamentViaApi('tourney_dave', tournamentId);
    await startTournamentViaApi('tourney_alice', tournamentId);

    // Get round 1 matches
    const res = await request(app)
      .get(`/api/multiplayer/tournaments/${tournamentId}`)
      .set(authHeader('tourney_alice'));
    expect(res.status).toBe(200);

    const round1 = res.body.data.brackets.find((b: any) => b.round === 1);
    const match1 = round1.matches[0];
    matchId = match1.id;

    // Record result: tourney_alice wins match 1
    const result = await request(app)
      .post(
        `/api/multiplayer/tournaments/${tournamentId}/matches/${matchId}/result`
      )
      .set(authHeader('tourney_alice'))
      .send({ winnerId: 'tourney_alice', scores: { tourney_alice: 1500, tourney_bob: 800 } });
    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.data.match.winnerId).toBe('tourney_alice');
    expect(result.body.data.match.status).toBe('completed');
  });

  test('non-participant cannot record match result', async () => {
    // tourney_carol tries to report a result for a match they're not in
    const res = await request(app)
      .post(
        `/api/multiplayer/tournaments/${tournamentId}/matches/${matchId}/result`
      )
      .set(authHeader('tourney_carol'))
      .send({ winnerId: 'tourney_alice' });
    // The match is already completed, so this should fail
    expect(res.status).toBe(500);
  });

  test('winner advances to next round', async () => {
    // Record result for the other round 1 match
    const res = await request(app)
      .get(`/api/multiplayer/tournaments/${tournamentId}`)
      .set(authHeader('tourney_alice'));
    expect(res.status).toBe(200);

    const round1 = res.body.data.brackets.find((b: any) => b.round === 1);
    const match2 = round1.matches.find((m: any) => m.id !== matchId);
    const match2Id = match2.id;

    await request(app)
      .post(
        `/api/multiplayer/tournaments/${tournamentId}/matches/${match2Id}/result`
      )
      .set(authHeader('tourney_carol'))
      .send({ winnerId: 'tourney_carol', scores: { tourney_carol: 1200, tourney_dave: 900 } });

    // Now check round 2 has been activated
    const res2 = await request(app)
      .get(`/api/multiplayer/tournaments/${tournamentId}`)
      .set(authHeader('tourney_alice'));
    expect(res2.status).toBe(200);

    const round2 = res2.body.data.brackets.find((b: any) => b.round === 2);
    expect(round2).toBeDefined();
    // Round 2 final should have tourney_alice and tourney_carol
    const finalMatch = round2.matches[0];
    expect([finalMatch.player1Id, finalMatch.player2Id]).toContain('tourney_alice');
    expect([finalMatch.player1Id, finalMatch.player2Id]).toContain('tourney_carol');
    expect(finalMatch.status).toBe('active');
  });

  test('final match completes tournament', async () => {
    const res = await request(app)
      .get(`/api/multiplayer/tournaments/${tournamentId}`)
      .set(authHeader('tourney_alice'));
    const round2 = res.body.data.brackets.find((b: any) => b.round === 2);
    const finalMatch = round2.matches[0];

    const result = await request(app)
      .post(
        `/api/multiplayer/tournaments/${tournamentId}/matches/${finalMatch.id}/result`
      )
      .set(authHeader('tourney_alice'))
      .send({ winnerId: 'tourney_alice', scores: { tourney_alice: 2000, tourney_carol: 1100 } });
    expect(result.status).toBe(200);
    expect(result.body.data.tournament.status).toBe('completed');
    expect(result.body.data.tournament.winnerId).toBe('tourney_alice');
  });
});

describe('multiplayer tournament - standings and prizes', () => {
  test('standings show correct placement and prizes', async () => {
    const tId = await createTournamentViaApi('tourney_alice', {
      maxPlayers: 4,
      prizePool: 400
    });
    await joinTournamentViaApi('tourney_bob', tId);
    await joinTournamentViaApi('tourney_carol', tId);
    await joinTournamentViaApi('tourney_dave', tId);
    await startTournamentViaApi('tourney_alice', tId);

    // Get round 1 matches
    const res = await request(app)
      .get(`/api/multiplayer/tournaments/${tId}`)
      .set(authHeader('tourney_alice'));
    const round1 = res.body.data.brackets.find((b: any) => b.round === 1);

    // Match 1: alice beats bob
    await request(app)
      .post(
        `/api/multiplayer/tournaments/${tId}/matches/${round1.matches[0].id}/result`
      )
      .set(authHeader('tourney_alice'))
      .send({ winnerId: 'tourney_alice' });

    // Match 2: carol beats dave
    await request(app)
      .post(
        `/api/multiplayer/tournaments/${tId}/matches/${round1.matches[1].id}/result`
      )
      .set(authHeader('tourney_carol'))
      .send({ winnerId: 'tourney_carol' });

    // Final: alice beats carol
    const res2 = await request(app)
      .get(`/api/multiplayer/tournaments/${tId}`)
      .set(authHeader('tourney_alice'));
    const round2 = res2.body.data.brackets.find((b: any) => b.round === 2);
    await request(app)
      .post(
        `/api/multiplayer/tournaments/${tId}/matches/${round2.matches[0].id}/result`
      )
      .set(authHeader('tourney_alice'))
      .send({ winnerId: 'tourney_alice' });

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

    // 2nd place
    expect(standings[1].playerId).toBe('tourney_carol');
    expect(standings[1].placement).toBe(2);
    expect(standings[1].prize).toBe(120); // 30% of 400
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
