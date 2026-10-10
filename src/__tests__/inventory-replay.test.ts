import { beforeAll, describe, expect, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import authRoutes from '../routes/auth.js';
import accountEconomyRoutes from '../routes/account-economy.js';
import { accountEconomy } from '../services/economy/AccountEconomyService.js';
import { generatedLevel } from '../services/levels/level-service.js';
import { initialObjectiveProgress, objectiveStatus, simulateObjectiveClear } from '../services/levels/objective-rules.js';
import { inventoryReplayEffect, REPLAY_POWERUPS } from '../services/levels/inventory-replay.js';
import { replayLevelAttempt } from '../services/levels/attempt-replay.js';
import { socialStore } from '../services/social/social-store.js';
import { certifyLevel, simulateLevelMove } from '../services/levels/generator.js';

const location = { timeZone: 'America/New_York', country: 'US', region: 'PA' };
const now = Date.parse('2026-10-10T16:00:00Z');
const definition = generatedLevel({ level: 4, location, rulesVersion: 5 }, now);
const initial = () => ({ board: definition.board, specials: definition.specials, shields: definition.shields,
  refillState: definition.refillState, objectiveProgress: initialObjectiveProgress(definition) });

const targets: Record<string, any> = {
  bomb: [0, 0], rainbow: undefined, lightning: [0, 1], diamond: [2, 2], target: [0, 0], star: [2, 2],
};

describe('server inventory-effect replay', () => {
  test.each(REPLAY_POWERUPS)('%s only clears server-derived geometry with its own paid receipt', (type) => {
    const receipt = { id: `receipt-${type}`, type };
    const action = { type, receiptId: receipt.id, ...(targets[type] ? { target: targets[type] } : {}) };
    const effect = inventoryReplayEffect(definition, initial(), action)!;
    expect(effect.keys.size).toBeGreaterThan(0);
    const result = simulateObjectiveClear(definition, initial(), effect.keys, effect.points)!;
    expect(result.score).toBeGreaterThan(0);
    // Deliberately stop before a win: a single booster is not automatically enough.
    const claim = replayLevelAttempt(definition, [action], result.score, result.objectiveProgress, [receipt]);
    expect(claim).toEqual({ error: 'replay_result_mismatch' });
    expect(replayLevelAttempt(definition, [action], result.score, result.objectiveProgress).error).toBe('invalid_move_history');
    expect(replayLevelAttempt(definition, [action, action], result.score, result.objectiveProgress, [receipt]).error)
      .toBe('invalid_move_history');
    expect(replayLevelAttempt(definition, [{ ...action, type: 'rainbow' }], result.score, result.objectiveProgress, [receipt]).error)
      .toBe(type === 'rainbow' ? 'replay_result_mismatch' : 'invalid_move_history');
  });

  test('rejects altered target geometry, wrong receipts and unaccounted spends', () => {
    const action = { type: 'bomb', receiptId: 'paid', target: [0, 0] };
    const receipts = [{ id: 'paid', type: 'bomb' }];
    for (const wrong of [{ ...action, target: [99, 0] }, { ...action, target: [0.5, 0] },
      { ...action, target: [0] }, { ...action, receiptId: 'other' }]) {
      expect(replayLevelAttempt(definition, [wrong], 500, initial().objectiveProgress, receipts).error)
        .toBe('invalid_move_history');
    }
    expect(replayLevelAttempt(definition, [certifyLevel(definition).witness[0]], 500,
      initial().objectiveProgress, receipts).error).toBe('unused_powerup_receipt');
    const original = JSON.stringify(definition);
    expect(inventoryReplayEffect(definition, initial(), action)).toBeTruthy();
    expect(JSON.stringify(definition)).toBe(original);
  });
});

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/account-economy', accountEconomyRoutes);
let player = '';
let token = '';
const auth = () => ({ Authorization: `Bearer ${token}` });
const post = (path: string, body: any) => request(app).post(`/api/account-economy${path}`).set(auth()).send(body);

beforeAll(async () => {
  player = `boost_replay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const registered = await request(app).post('/api/auth/register').send({ playerId: player,
    email: `${player}@example.com`, password: 'secret123' });
  expect(registered.status).toBe(200);
  token = registered.body.token;
});

describe('paid booster receipts and completion', () => {
  test('a wrong attempt and an unsupported effect cannot spend inventory', async () => {
    const spend = await post('/energy/spend', { level: 4, mode: 'classic', location, rulesVersion: 5 });
    expect(spend.status).toBe(200);
    const { attemptId } = spend.body.result;
    const before = (await request(app).get('/api/account-economy/data').set(auth())).body.data.inventory.powerups.bomb.count;
    const invalid = await post('/powerup/use', { powerupId: 'bomb', attemptId: 'wrong', quantity: 1 });
    expect(invalid.status).toBe(400); expect(invalid.body.error).toBe('attempt_not_found');
    const unsupported = await post('/powerup/use', { powerupId: 'rocket', attemptId, quantity: 1 });
    expect(unsupported.status).toBe(400); expect(unsupported.body.error).toBe('replay_unsupported');
    const bulk = await post('/powerup/use', { powerupId: 'bomb', attemptId, quantity: 2 });
    expect(bulk.status).toBe(400); expect(bulk.body.error).toBe('replay_unsupported');
    const after = (await request(app).get('/api/account-economy/data').set(auth())).body.data.inventory.powerups.bomb.count;
    expect(after).toBe(before);
  });

  test('concurrent spends cannot mint two receipts from one remaining charge', async () => {
    const spent = await post('/energy/spend', { level: 4, mode: 'classic', location, rulesVersion: 5 });
    expect(spent.status).toBe(200);
    const attemptId = spent.body.result.attemptId;
    await accountEconomy.updateInventory(player, 'powerups', 'target', 1, 'add');
    const [one, two] = await Promise.all([
      post('/powerup/use', { attemptId, powerupId: 'target' }),
      post('/powerup/use', { attemptId, powerupId: 'target' }),
    ]);
    expect([one.status, two.status].sort()).toEqual([200, 400]);
    expect([one.body.result?.receiptId, two.body.result?.receiptId].filter(Boolean)).toHaveLength(1);
    const economy = await accountEconomy.getPlayerEconomy(player);
    expect(economy.inventory.powerups.target.count).toBe(0);
    expect(economy.pendingAttempt.powerupReceipts).toHaveLength(1);
  });

  test('each receipt authorizes one replayed effect; a verified assisted win is paid but not ranked', async () => {
    // Spending on a new attempt replaces the prior one without reusing its receipts.
    const spent = await post('/energy/spend', { level: 4, mode: 'classic', location, rulesVersion: 5 });
    expect(spent.status).toBe(200);
    const { attemptId, generatedLevel: def } = spent.body.result;
    await accountEconomy.updateInventory(player, 'powerups', 'rainbow', 12, 'add');
    const actions: any[] = [];
    let state: any = { board: def.board, specials: def.specials, shields: def.shields,
      refillState: def.refillState, objectiveProgress: initialObjectiveProgress(def) };
    let score = 0;
    for (let i = 0; i < 10 && !objectiveStatus(def, score, state.objectiveProgress).complete; i++) {
      const spend = await post('/powerup/use', { attemptId, powerupId: 'rainbow', quantity: 1 });
      expect(spend.status).toBe(200);
      const receiptId = spend.body.result.receiptId;
      expect(receiptId).toMatch(/^[0-9a-f-]{36}$/i);
      const action = { type: 'rainbow', receiptId };
      actions.push(action);
      const effect = inventoryReplayEffect(def, state, action)!;
      const result = simulateObjectiveClear(def, state, effect.keys, effect.points)!;
      score += result.score;
      state = { board: result.board, specials: result.specials, shields: result.shields,
        refillState: result.refillState, objectiveProgress: result.objectiveProgress };
    }
    expect(objectiveStatus(def, score, state.objectiveProgress).complete).toBe(true);
    expect(new Set(actions.map((a) => a.receiptId)).size).toBe(actions.length);
    const payload = { level: 4, attemptId, score, objectiveProgress: state.objectiveProgress, moves: actions };
    const fake = await post('/level/complete', { ...payload, moves: actions.map((a) => ({ ...a, receiptId: 'forged' })) });
    expect(fake.status).toBe(400); expect(fake.body.error).toBe('invalid_move_history');
    const missing = await post('/level/complete', { ...payload, moves: actions.slice(1) });
    expect(missing.status).toBe(400); expect(missing.body.error).toBe('unused_powerup_receipt');
    const won = await post('/level/complete', payload);
    expect(won.status).toBe(200); expect(won.body.result).toMatchObject({ verified: true, ranked: false });
    expect((await socialStore.friendBoard(player))[0].score).toBe(0);
    const again = await post('/level/complete', payload);
    expect(again.status).toBe(400); expect(again.body.error).toBe('attempt_not_found');
    const lateBoost = await post('/powerup/use', { attemptId, powerupId: 'rainbow' });
    expect(lateBoost.status).toBe(400); expect(lateBoost.body.error).toBe('attempt_not_found');
  });

  test('legacy untracked spends cannot be ranked using a later pure-move transcript', async () => {
    const spent = await post('/energy/spend', { level: 1, mode: 'classic', location, rulesVersion: 5 });
    expect(spent.status).toBe(200);
    const { attemptId, generatedLevel: def } = spent.body.result;
    const item = await post('/powerup/use', { powerupId: 'bomb', quantity: 1 });
    expect(item.status).toBe(200); expect(item.body.result.receiptId).toBeUndefined();
    let state: any = { board: def.board, specials: def.specials, shields: def.shields,
      refillState: def.refillState, objectiveProgress: initialObjectiveProgress(def) };
    let score = 0;
    const moves: any[] = [];
    for (const cells of certifyLevel(def).witness) {
      const next = simulateLevelMove(def, state, cells)!;
      score += next.score; moves.push(cells);
      state = { board: next.board, specials: next.specials, shields: next.shields,
        refillState: next.refillState, objectiveProgress: next.objectiveProgress };
      if (objectiveStatus(def, score, state.objectiveProgress).complete) break;
    }
    const won = await post('/level/complete', { level: 1, attemptId, score, objectiveProgress: state.objectiveProgress, moves });
    expect(won.status).toBe(200); expect(won.body.result).toMatchObject({ verified: true, ranked: false });
    expect((await socialStore.friendBoard(player))[0].score).toBe(0);
  });
});
