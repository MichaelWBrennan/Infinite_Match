// Monetization PvP tests.
// Covers: PvP booster purchases with coins, insufficient coins rejection.
// Entry fees and prize payouts are tested in multiplayer-tournament.test.ts.
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import monetizationRoutes from '../routes/monetization.js';
import { accountEconomy as accountEconomyService } from '../services/economy/AccountEconomyService.js';
import security from '../core/security/index.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const PLAYER_IDS = ['monet_alice', 'monet_bob', 'monet_carol'];
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

async function setCoins(playerId: string, amount: number) {
  const economy = await accountEconomyService.getPlayerEconomy(playerId);
  economy.currencies.coins.amount = amount;
  economy.currencies.coins.lastRegen = Date.now();
  await accountEconomyService.updatePlayerEconomyCache(playerId, economy);
}

async function getCoins(playerId: string): Promise<number> {
  const economy = await accountEconomyService.getPlayerEconomy(playerId);
  return economy.currencies.coins.amount;
}

beforeAll(async () => {
  app = express();
  app.use(express.json());
  app.use('/api/monetization', monetizationRoutes);

  for (const pid of PLAYER_IDS) {
    tokens[pid] = await login(pid);
    await setCoins(pid, 1000);
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

describe('monetization - PvP booster purchases', () => {
  test('buy extra moves booster with coins', async () => {
    const coinsBefore = await getCoins('monet_alice');

    const res = await request(app)
      .post('/api/monetization/pvp/booster')
      .set(authHeader('monet_alice'))
      .send({ boosterId: 'pvp_booster_extra_moves' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.boosterId).toBe('pvp_booster_extra_moves');
    expect(res.body.costCoins).toBe(50);

    const coinsAfter = await getCoins('monet_alice');
    expect(coinsAfter).toBe(coinsBefore - 50);
  });

  test('buy color bomb booster with coins', async () => {
    const coinsBefore = await getCoins('monet_bob');

    const res = await request(app)
      .post('/api/monetization/pvp/booster')
      .set(authHeader('monet_bob'))
      .send({ boosterId: 'pvp_booster_color_bomb' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.costCoins).toBe(75);

    const coinsAfter = await getCoins('monet_bob');
    expect(coinsAfter).toBe(coinsBefore - 75);
  });

  test('buy extra time booster with coins', async () => {
    const coinsBefore = await getCoins('monet_carol');

    const res = await request(app)
      .post('/api/monetization/pvp/booster')
      .set(authHeader('monet_carol'))
      .send({ boosterId: 'pvp_booster_extra_time' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.costCoins).toBe(60);

    const coinsAfter = await getCoins('monet_carol');
    expect(coinsAfter).toBe(coinsBefore - 60);
  });

  test('insufficient coins for booster is rejected', async () => {
    await setCoins('monet_alice', 10); // Only 10 coins, booster costs 50+

    const res = await request(app)
      .post('/api/monetization/pvp/booster')
      .set(authHeader('monet_alice'))
      .send({ boosterId: 'pvp_booster_extra_moves' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('insufficient_coins');
  });

  test('unknown booster is rejected', async () => {
    const res = await request(app)
      .post('/api/monetization/pvp/booster')
      .set(authHeader('monet_alice'))
      .send({ boosterId: 'unknown_booster' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('unknown_booster');
  });

  test('missing boosterId is rejected', async () => {
    const res = await request(app)
      .post('/api/monetization/pvp/booster')
      .set(authHeader('monet_alice'))
      .send({});
    expect(res.status).toBe(400);
  });

  test('unauthenticated booster purchase is rejected', async () => {
    const res = await request(app)
      .post('/api/monetization/pvp/booster')
      .send({ boosterId: 'pvp_booster_extra_moves' });
    expect(res.status).toBe(401);
  });
});
