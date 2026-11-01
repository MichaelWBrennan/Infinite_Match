// Card collection: secondary progression (Royal Match-style collectible cards).
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import authRoutes from '../routes/auth.js';
import cardsRoutes from '../routes/cards.js';
import { accountEconomy } from '../services/economy/AccountEconomyService.js';
import {
  allSets, cardsInSet, setGoal, evaluateCollection,
  openCardPack, convertDuplicates, pickRandomCard,
  cardFor, PACK_COST_COINS, PACK_CARD_COUNT,
} from '../services/meta/card-collection.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardsRoutes);

let dir: string;
const tokens: Record<string, string> = {};

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cards-'));
  process.env.SOCIAL_STORE_FILE = path.join(dir, 'social.json');
  const registered = await request(app).post('/api/auth/register').send({ playerId: 'alice', email: 'alice@example.com', password: 'secret123' });
  expect(registered.status).toBe(200);
  tokens.alice = registered.body.token;
});

afterAll(() => {
  delete process.env.SOCIAL_STORE_FILE;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('card catalog', () => {
  test('allSets returns three sets with rewards', () => {
    const sets = allSets();
    const setIds = sets.map(s => s.id);
    expect(setIds).toContain('kingdom');
    expect(setIds).toContain('jungle');
    expect(setIds).toContain('winter');
    for (const set of sets) {
      expect(set.reward.coins).toBeGreaterThan(0);
      expect(set.reward.stars).toBeGreaterThan(0);
    }
  });

  test('setGoal matches number of cards in set', () => {
    for (const set of allSets()) {
      const cards = cardsInSet(set.id);
      expect(setGoal(set.id)).toBe(cards.length);
    }
  });

  test('cardFor returns definition for known card, null for unknown', () => {
    expect(cardFor('king_card')?.name).toBe('The King');
    expect(cardFor('crown_card')?.rarity).toBe('legendary');
    expect(cardFor('no_such_card')).toBeNull();
  });
});

describe('collection evaluation', () => {
  test('empty collection has zero progress on all sets', () => {
    const result = evaluateCollection(new Map());
    expect(result.totalCards).toBe(0);
    expect(result.uniqueCards).toBe(0);
    for (const set of result.sets) {
      expect(set.progress).toBe(0);
      expect(set.complete).toBe(false);
    }
  });

  test('partial collection shows progress per set', () => {
    const collection = new Map([['king_card', 1], ['queen_card', 1]]);
    const result = evaluateCollection(collection);
    const kingdom = result.sets.find(s => s.id === 'kingdom');
    expect(kingdom.progress).toBe(2);
    expect(kingdom.goal).toBe(5);
    expect(kingdom.complete).toBe(false);
    expect(result.uniqueCards).toBe(2);
  });

  test('complete collection marks set complete', () => {
    const kingdomCards = cardsInSet('kingdom');
    const collection = new Map(kingdomCards.map(c => [c.id, 1]));
    const result = evaluateCollection(collection);
    const kingdom = result.sets.find(s => s.id === 'kingdom');
    expect(kingdom.progress).toBe(5);
    expect(kingdom.complete).toBe(true);
  });

  test('duplicates count toward totalCards but not uniqueCards', () => {
    const collection = new Map([['king_card', 3], ['queen_card', 1]]);
    const result = evaluateCollection(collection);
    expect(result.totalCards).toBe(4);
    expect(result.uniqueCards).toBe(2);
  });
});

describe('card pack opening', () => {
  test('pickRandomCard returns a valid card id', () => {
    // randomInt(max) must return [0, max); use a deterministic stub that respects max.
    const cardId = pickRandomCard((max) => 42 % max);
    expect(cardFor(cardId)).not.toBeNull();
  });

  test('insufficient coins refuses pack opening', async () => {
    const economy: any = await accountEconomy.getPlayerEconomy('alice');
    economy.currencies.coins.amount = 0;
    await accountEconomy.updatePlayerEconomyCache('alice', economy);

    const res = await request(app).post('/api/cards/pack').set({ Authorization: `Bearer ${tokens.alice}` });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('insufficient_coins');
  });

  test('pack opening deducts coins and returns cards', async () => {
    const economy: any = await accountEconomy.getPlayerEconomy('alice');
    economy.currencies.coins.amount = 1000;
    await accountEconomy.updatePlayerEconomyCache('alice', economy);

    const res = await request(app).post('/api/cards/pack').set({ Authorization: `Bearer ${tokens.alice}` });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.coinsDeducted).toBe(PACK_COST_COINS);
    expect(res.body.cards.length).toBe(PACK_CARD_COUNT);
    for (const card of res.body.cards) {
      expect(card.id).toBeDefined();
      expect(card.name).toBeDefined();
      expect(card.rarity).toBeDefined();
    }
  });

  test('collection view shows set progress after pack opening', async () => {
    const res = await request(app).get('/api/cards/collection').set({ Authorization: `Bearer ${tokens.alice}` });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sets.length).toBeGreaterThan(0);
    expect(typeof res.body.totalCards).toBe('number');
    expect(typeof res.body.uniqueCards).toBe('number');
  });
});

describe('duplicate conversion', () => {
  test('converting with no duplicates earns zero coins', async () => {
    // Give alice one of each kingdom card (no duplicates)
    const kingdomCards = cardsInSet('kingdom');
    const cards: Record<string, number> = {};
    for (const c of kingdomCards) cards[c.id] = 1;
    await accountEconomy.setCardCollection('alice', cards);

    const res = await request(app).post('/api/cards/convert').set({ Authorization: `Bearer ${tokens.alice}` });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.coinsEarned).toBe(0);
    expect(res.body.cardsConverted.length).toBe(0);
  });

  test('converting duplicates earns coins by rarity', async () => {
    // king_card is common: 3 copies → 2 duplicates → 2 * 10 = 20 coins
    await accountEconomy.setCardCollection('alice', { king_card: 3 });
    const res = await request(app).post('/api/cards/convert').set({ Authorization: `Bearer ${tokens.alice}` });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.coinsEarned).toBe(20);
    expect(res.body.cardsConverted.length).toBe(1);
    expect(res.body.cardsConverted[0].duplicates).toBe(2);
  });
});
