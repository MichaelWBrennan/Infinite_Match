// Multiplayer PvP end-to-end tests.
// Covers: session-secured routes, room lifecycle, matchmaking, game sessions,
// moves, game end conditions, and anti-cheat for match3_versus.
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { router as multiplayerRoutes, initializeMultiplayerServices } from '../routes/multiplayer.js';
import liveOpsRoutes from '../routes/live-ops.js';
import security from '../core/security/index.js';

// ---------------------------------------------------------------------------
// Minimal Socket.IO mock for service initialization.
// Services call io.to(room).emit(...), io.to(playerId).socketsJoin(...),
// and io.to(playerId).socketsLeave(...).
// ---------------------------------------------------------------------------
function createMockIo() {
  const to = (room: string) => ({
    socketsJoin: () => {},
    socketsLeave: () => {},
    leave: () => {},
    emit: () => {},
  });
  return { to };
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const PLAYER_IDS = ['pvp_alice', 'pvp_bob', 'pvp_carol'];
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

async function createRoomViaApi(playerId: string, gameType = 'match3_versus') {
  const res = await request(app)
    .post('/api/multiplayer/rooms')
    .set(authHeader(playerId))
    .send({ gameType });
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  return res.body.data.room.id;
}

async function joinRoomViaApi(playerId: string, roomId: string) {
  const res = await request(app)
    .post(`/api/multiplayer/rooms/${roomId}/join`)
    .set(authHeader(playerId))
    .send({});
  expect(res.status).toBe(200);
  return res.body.data;
}

async function startSessionViaApi(playerId: string, roomId: string, gameType = 'match3_versus') {
  const res = await request(app)
    .post('/api/multiplayer/sessions/start')
    .set(authHeader(playerId))
    .send({ roomId, gameType });
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  return res.body.data.sessionId;
}

function makeMovePayload(fromX: number, fromY: number, toX: number, toY: number) {
  return { from: [fromX, fromY], to: [toX, toY] };
}

beforeAll(async () => {
  app = express();
  app.use(express.json());
  app.use('/api/multiplayer', multiplayerRoutes);
  app.use('/api/live-ops', liveOpsRoutes);

  initializeMultiplayerServices(createMockIo() as unknown as never);

  for (const pid of PLAYER_IDS) {
    tokens[pid] = await login(pid);
  }
});

afterAll(() => {
  // Best-effort cleanup of test sessions
  for (const pid of PLAYER_IDS) {
    try {
      security.destroySession('');
    } catch {
      // ignore
    }
  }
});

describe('multiplayer PvP - route security', () => {
  test('unauthenticated create room is rejected with 401', async () => {
    const res = await request(app).post('/api/multiplayer/rooms').send({ gameType: 'match3_versus' });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('authentication');
  });

  test('unauthenticated join room is rejected with 401', async () => {
    const res = await request(app)
      .post('/api/multiplayer/rooms/some-room/join')
      .send({});
    expect(res.status).toBe(401);
  });

  test('unauthenticated matchmaking start is rejected with 401', async () => {
    const res = await request(app)
      .post('/api/multiplayer/matchmaking/start')
      .send({ gameType: 'match3_versus' });
    expect(res.status).toBe(401);
  });

  test('unauthenticated move is rejected with 401', async () => {
    const res = await request(app)
      .post('/api/multiplayer/sessions/abc/move')
      .send({ move: { from: [0, 0], to: [0, 1] } });
    expect(res.status).toBe(401);
  });

  test('unauthenticated session start is rejected with 401', async () => {
    const res = await request(app)
      .post('/api/multiplayer/sessions/start')
      .send({ roomId: 'r1', gameType: 'match3_versus' });
    expect(res.status).toBe(401);
  });
});

describe('multiplayer PvP - room lifecycle', () => {
  let roomId: string;

  test('create a match3_versus room', async () => {
    roomId = await createRoomViaApi('pvp_alice');
    expect(roomId).toBeDefined();
    expect(typeof roomId).toBe('string');
  });

  test('second player joins the room', async () => {
    const data = await joinRoomViaApi('pvp_bob', roomId);
    expect(data.room.playerCount).toBeGreaterThanOrEqual(2);
  });

  test('room is listed as available', async () => {
    const res = await request(app)
      .get('/api/multiplayer/rooms')
      .set(authHeader('pvp_alice'))
      .query({ gameType: 'match3_versus' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('player can get room details', async () => {
    const res = await request(app)
      .get(`/api/multiplayer/rooms/${roomId}`)
      .set(authHeader('pvp_alice'));
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(roomId);
    expect(res.body.data.gameType).toBe('match3_versus');
  });

  test('player can leave the room', async () => {
    const res = await request(app)
      .post(`/api/multiplayer/rooms/${roomId}/leave`)
      .set(authHeader('pvp_bob'));
    expect(res.status).toBe(200);
  });
});

describe('multiplayer PvP - matchmaking', () => {
  test('start matchmaking for match3_versus', async () => {
    // Use pvp_carol who is not in any room (pvp_alice may still be in one
    // from the room lifecycle tests)
    const res = await request(app)
      .post('/api/multiplayer/matchmaking/start')
      .set(authHeader('pvp_carol'))
      .send({ gameType: 'match3_versus' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Matchmaking started');
  });

  test('stop matchmaking', async () => {
    const res = await request(app)
      .post('/api/multiplayer/matchmaking/stop')
      .set(authHeader('pvp_carol'));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('multiplayer PvP - game session end-to-end', () => {
  let sessionId: string;

  test('start a versus session', async () => {
    const roomId = await createRoomViaApi('pvp_alice');
    const res = await request(app)
      .post('/api/multiplayer/sessions/start')
      .set(authHeader('pvp_alice'))
      .send({ roomId, gameType: 'match3_versus' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    sessionId = res.body.data.sessionId;
    expect(sessionId).toBeDefined();
  });

  test('session has correct initial state', async () => {
    const res = await request(app)
      .get(`/api/multiplayer/sessions/${sessionId}`)
      .set(authHeader('pvp_alice'));
    expect(res.status).toBe(200);
    expect(res.body.data.gameType).toBe('match3_versus');
    expect(res.body.data.players).toContain('pvp_alice');
    expect(res.body.data.status).toBe('active');
  });

  test('player can make a valid match3 move', async () => {
    const res = await request(app)
      .post(`/api/multiplayer/sessions/${sessionId}/move`)
      .set(authHeader('pvp_alice'))
      .send({ move: makeMovePayload(0, 0, 0, 1) });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.moveResult).toBeDefined();
  });

  test('cannot make a move when not your turn (other player)', async () => {
    const res = await request(app)
      .post(`/api/multiplayer/sessions/${sessionId}/move`)
      .set(authHeader('pvp_bob'))
      .send({ move: makeMovePayload(1, 0, 1, 1) });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('invalid move - non-adjacent tiles rejected by game validation', async () => {
    const res = await request(app)
      .post(`/api/multiplayer/sessions/${sessionId}/move`)
      .set(authHeader('pvp_alice'))
      .send({ move: makeMovePayload(0, 0, 2, 0) });
    // Non-adjacent move (dx=2, dy=0, dx+dy=2 !== 1) fails game validation
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('invalid move - outside board bounds rejected by anti-cheat', async () => {
    const res = await request(app)
      .post(`/api/multiplayer/sessions/${sessionId}/move`)
      .set(authHeader('pvp_alice'))
      .send({ move: makeMovePayload(0, 0, 10, 0) });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('move with missing move body is rejected', async () => {
    const res = await request(app)
      .post(`/api/multiplayer/sessions/${sessionId}/move`)
      .set(authHeader('pvp_alice'))
      .send({});
    expect(res.status).toBe(400);
  });

  test('pause and resume session', async () => {
    const pause = await request(app)
      .post(`/api/multiplayer/sessions/${sessionId}/pause`)
      .set(authHeader('pvp_alice'));
    expect(pause.status).toBe(200);

    const resume = await request(app)
      .post(`/api/multiplayer/sessions/${sessionId}/resume`)
      .set(authHeader('pvp_alice'));
    expect(resume.status).toBe(200);
  });

  test('player can leave session', async () => {
    const res = await request(app)
      .post(`/api/multiplayer/sessions/${sessionId}/leave`)
      .set(authHeader('pvp_alice'));
    expect(res.status).toBe(200);
  });
});

describe('multiplayer PvP - anti-cheat system', () => {
  test('get player anti-cheat statistics', async () => {
    const res = await request(app)
      .get('/api/multiplayer/anti-cheat/players/pvp_alice')
      .set(authHeader('pvp_alice'));
    expect(res.status).toBe(200);
    expect(res.body.data.playerId).toBe('pvp_alice');
    expect(res.body.data).toHaveProperty('isBanned');
    expect(res.body.data).toHaveProperty('totalMoves');
  });

  test('get anti-cheat system statistics', async () => {
    const res = await request(app)
      .get('/api/multiplayer/anti-cheat/stats')
      .set(authHeader('pvp_alice'));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('multiplayer PvP - statistics and metadata', () => {
  test('get multiplayer stats', async () => {
    const res = await request(app)
      .get('/api/multiplayer/stats')
      .set(authHeader('pvp_alice'));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('rooms');
    expect(res.body.data).toHaveProperty('sessions');
    expect(res.body.data).toHaveProperty('antiCheat');
  });

  test('get supported game types includes match3_versus', async () => {
    const res = await request(app)
      .get('/api/multiplayer/game-types')
      .set(authHeader('pvp_alice'));
    expect(res.status).toBe(200);
    const versus = res.body.data['match3_versus'];
    expect(versus).toBeDefined();
    expect(versus.isCompetitive).toBe(true);
    expect(versus.minPlayers).toBe(2);
    expect(versus.maxPlayers).toBe(2);
  });
});

describe('multiplayer PvP - health', () => {
  test('health endpoint reports service status', async () => {
    const res = await request(app)
      .get('/api/multiplayer/health')
      .set(authHeader('pvp_alice'));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.services).toBeDefined();
  });
});

describe('multiplayer PvP - record win toward score challenge', () => {
  test('record a PvP win with valid score', async () => {
    // Use pvp_carol who has no existing room/session
    const roomId = await createRoomViaApi('pvp_carol');
    const sessionId = await startSessionViaApi('pvp_carol', roomId);

    const res = await request(app)
      .post(`/api/multiplayer/sessions/${sessionId}/record-win`)
      .set(authHeader('pvp_carol'))
      .send({ score: 1500 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('record win with invalid score is rejected', async () => {
    const roomId = await createRoomViaApi('pvp_carol');
    const sessionId = await startSessionViaApi('pvp_carol', roomId);

    const res = await request(app)
      .post(`/api/multiplayer/sessions/${sessionId}/record-win`)
      .set(authHeader('pvp_carol'))
      .send({ score: -100 });
    expect(res.status).toBe(400);
  });

  test('record win for nonexistent session is rejected', async () => {
    const res = await request(app)
      .post('/api/multiplayer/sessions/nonexistent/record-win')
      .set(authHeader('pvp_carol'))
      .send({ score: 100 });
    expect(res.status).toBe(404);
  });

  test('record win without score is rejected', async () => {
    const roomId = await createRoomViaApi('pvp_carol');
    const sessionId = await startSessionViaApi('pvp_carol', roomId);

    const res = await request(app)
      .post(`/api/multiplayer/sessions/${sessionId}/record-win`)
      .set(authHeader('pvp_carol'))
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('multiplayer PvP - live ops calendar', () => {
  test('event calendar returns upcoming events', async () => {
    const res = await request(app)
      .get('/api/live-ops/calendar')
      .set(authHeader('pvp_alice'));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.serverNow).toBeDefined();
  });

  test('calendar events are sorted by start time', async () => {
    const res = await request(app)
      .get('/api/live-ops/calendar')
      .set(authHeader('pvp_alice'));
    expect(res.status).toBe(200);
    const events = res.body.events;
    for (let i = 1; i < events.length; i++) {
      expect(new Date(events[i - 1].startsAt).getTime()).toBeLessThanOrEqual(
        new Date(events[i].startsAt).getTime()
      );
    }
  });

  test('unauthenticated calendar access is rejected', async () => {
    const res = await request(app).get('/api/live-ops/calendar');
    expect(res.status).toBe(401);
  });
});
