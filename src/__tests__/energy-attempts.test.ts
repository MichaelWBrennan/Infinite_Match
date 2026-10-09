import { describe, test, expect } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import authRoutes from '../routes/auth.js';
import accountEconomyRoutes from '../routes/account-economy.js';
import AccountEconomyService from '../services/economy/AccountEconomyService.js';
import { regenerateEnergy, nextRegenInMs, ATTEMPT_ENERGY_COST } from '../services/meta/energy.js';

const MIN = 60_000;
const energyAt = (amount: number, lastRegen: number, maxAmount = 100) => ({
  amount,
  maxAmount,
  earned: 0,
  spent: 0,
  regenRate: 1,
  lastRegen,
});

const uniq = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

describe('energy regeneration rules', () => {
  test('regenerates one point per minute since the last regeneration', () => {
    const e = energyAt(50, 0);
    regenerateEnergy(e, 3 * MIN);
    expect(e.amount).toBe(53);
    expect(e.lastRegen).toBe(3 * MIN);
  });

  test('keeps partial-minute progress', () => {
    const e = energyAt(50, 0);
    regenerateEnergy(e, 2.5 * MIN);
    expect(e.amount).toBe(52);
    expect(e.lastRegen).toBe(2 * MIN);
    regenerateEnergy(e, 3 * MIN);
    expect(e.amount).toBe(53);
  });

  test('stops at the cap and restarts the clock from now', () => {
    const e = energyAt(98, 0);
    regenerateEnergy(e, 10 * MIN);
    expect(e.amount).toBe(100);
    expect(e.lastRegen).toBe(10 * MIN);
  });

  test('full energy does not bank time, so the next spend starts a fresh countdown', () => {
    const e = energyAt(100, 0);
    regenerateEnergy(e, 5 * MIN);
    expect(e.amount).toBe(100);
    e.amount -= ATTEMPT_ENERGY_COST;
    // Thirty seconds after the spend, the next point is still thirty seconds away.
    expect(nextRegenInMs(e, 5 * MIN + 30_000)).toBe(30_000);
  });

  test('a currency with no timestamp starts its clock now', () => {
    const e: any = { amount: 40, maxAmount: 100, regenRate: 1 };
    regenerateEnergy(e, 7 * MIN);
    expect(e.amount).toBe(40);
    expect(e.lastRegen).toBe(7 * MIN);
  });

  test('next regeneration is reported only when energy is below the cap', () => {
    expect(nextRegenInMs(energyAt(50, 0), MIN + 15_000)).toBe(45_000);
    expect(nextRegenInMs(energyAt(100, 0), MIN)).toBeNull();
  });
});

describe('energy spending on the server', () => {
  test('an attempt spends one energy and is counted', async () => {
    const svc = new AccountEconomyService();
    const playerId = uniq('spend');
    await svc.initializePlayerEconomy(playerId, 'test');
    const now = Date.now();
    const result = await svc.spendAttemptEnergy(playerId, now);
    expect(result.energy).toBe(99);
    const eco = await svc.getPlayerEconomy(playerId);
    expect(eco.currencies.energy.spent).toBe(ATTEMPT_ENERGY_COST);
  });

  test('an attempt is refused at zero energy and allowed again after regeneration', async () => {
    const svc = new AccountEconomyService();
    const playerId = uniq('empty');
    await svc.initializePlayerEconomy(playerId, 'test');
    const now = Date.now();
    const eco = await svc.getPlayerEconomy(playerId);
    eco.currencies.energy.amount = 0;
    eco.currencies.energy.lastRegen = now;

    await expect(svc.spendAttemptEnergy(playerId, now + 30_000)).rejects.toMatchObject({ code: 'energy_empty' });
    const later = await svc.spendAttemptEnergy(playerId, now + 2 * MIN);
    expect(later.energy).toBe(1);
  });

  test('refill charges only for energy that has not regenerated yet', async () => {
    const svc = new AccountEconomyService();
    const playerId = uniq('refill');
    await svc.initializePlayerEconomy(playerId, 'test');
    const eco = await svc.getPlayerEconomy(playerId);
    eco.currencies.energy.amount = 0;
    eco.currencies.energy.lastRegen = Date.now() - 5 * MIN;
    // Five points have come back since the last update. The missing 95 cost 950 coins, not 1000.
    const result = await svc.refillEnergy(playerId);
    expect(result.costCoins).toBe(950);
    expect(result.energy).toBe(100);
  });

  test('refill is refused when energy is full', async () => {
    const svc = new AccountEconomyService();
    const playerId = uniq('full');
    await svc.initializePlayerEconomy(playerId, 'test');
    await expect(svc.refillEnergy(playerId)).rejects.toMatchObject({ code: 'energy_full' });
  });
});

describe('energy routes', () => {
  // The auth route allows 5 registrations per 15 minutes per IP, so this file registers one player.
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/account-economy', accountEconomyRoutes);

  test('spending energy requires a session', async () => {
    const res = await request(app).post('/api/account-economy/energy/spend');
    expect(res.status).toBe(401);
  });

  test('a signed-in attempt spends energy on the server', async () => {
    const id = uniq('route');
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ playerId: id, email: `${id}@example.com`, password: 'secret123' });
    const token = reg.body.token as string;
    expect(token).toBeTruthy();
    const res = await request(app)
      .post('/api/account-economy/energy/spend')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.result.energy).toBe(99);
  });
});

describe('client gates every attempt on the server', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'phaser3-game.js'), 'utf-8');

  test('the client calls the spend endpoint before a level starts', () => {
    expect(source).toMatch(/\/api\/account-economy\/energy\/spend/);
    expect(source).toMatch(/async restartGame\(attemptClaimed = false\)[\s\S]*?claimAttempt\(\)/);
    expect(source).toMatch(/beginFirstAttempt\(\);/);
  });

  test('the client no longer spends energy locally', () => {
    expect(source).not.toMatch(/this\.energy - 1/);
  });

  test('a restart keeps the level move limit instead of resetting to 30', () => {
    const restart = source.slice(source.indexOf('async restartGame('), source.indexOf('async restartGame(') + 600);
    expect(restart).toMatch(/this\.moves = levelConfig\(this\.level\)\.moves;/);
    expect(restart).not.toMatch(/this\.moves = 30;/);
  });
});
