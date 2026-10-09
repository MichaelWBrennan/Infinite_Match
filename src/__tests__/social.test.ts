import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import authRoutes from '../routes/auth.js';
import socialRoutes from '../routes/social.js';
import { MAX_FRIENDS, MAX_GUILD_MEMBERS, SocialStore, SocialError, socialStoreFile } from '../services/social/social-store.js';

let dir: string;
let file: string;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'social-'));
  file = path.join(dir, 'social.json');
  process.env.SOCIAL_STORE_FILE = file;
});
afterAll(() => {
  delete process.env.SOCIAL_STORE_FILE;
  fs.rmSync(dir, { recursive: true, force: true });
});

/** The error code a store call rejects with, or null when it succeeds. */
const codeOf = async (p: Promise<unknown>): Promise<string | null> => {
  try {
    await p;
    return null;
  } catch (e: any) {
    if (e instanceof SocialError) return e.code;
    throw e;
  }
};

const freshStore = () => new SocialStore(path.join(dir, `s-${Math.random().toString(36).slice(2)}.json`));

describe('names and friend codes', () => {
  test('a profile gets a friend code and no name until one is set', async () => {
    const s = freshStore();
    const me = await s.profile('p1');
    expect(me.code).toMatch(/^[A-Z2-9]{8}$/);
    expect(me.name).toBeNull();
    expect(me.guild).toBeNull();
  });

  test('names are checked for length and characters', async () => {
    const s = freshStore();
    await s.profile('p1');
    for (const bad of ['ab', 'a'.repeat(17), 'bad!name', ' spaced', 'trailing ', '']) {
      expect(await codeOf(s.setName('p1', bad))).toBe('invalid_name');
    }
    await expect(s.setName('p1', 'Royal_Fan-1')).resolves.toEqual({ name: 'Royal_Fan-1' });
  });

  test('names are unique without regard to case', async () => {
    const s = freshStore();
    await s.setName('p1', 'Sparkle');
    expect(await codeOf(s.setName('p2', 'SPARKLE'))).toBe('name_taken');
    // A player may keep their own name.
    await expect(s.setName('p1', 'Sparkle')).resolves.toEqual({ name: 'Sparkle' });
  });
});

describe('friends', () => {
  test('a request by code becomes a friendship when accepted, on both sides', async () => {
    const s = freshStore();
    await s.setName('alice', 'Alice');
    await s.setName('bob', 'Bobby');
    const bobCode = (await s.profile('bob')).code;

    await expect(s.requestFriend('alice', bobCode)).resolves.toMatchObject({ status: 'requested' });
    const bobsView = await s.friends('bob');
    expect(bobsView.incoming).toEqual([expect.objectContaining({ playerId: 'alice', label: 'Alice' })]);
    expect(bobsView.friends).toEqual([]);

    await s.acceptFriend('bob', 'alice');
    expect((await s.friends('alice')).friends.map((f) => f.label)).toEqual(['Bobby']);
    expect((await s.friends('bob')).friends.map((f) => f.label)).toEqual(['Alice']);
    expect((await s.friends('bob')).incoming).toEqual([]);
  });

  test('a player needs a name to send a request, and cannot friend themselves', async () => {
    const s = freshStore();
    await s.setName('bob', 'Bobby');
    const bobCode = (await s.profile('bob')).code;
    expect(await codeOf(s.requestFriend('nameless', bobCode))).toBe('name_required');
    await s.setName('bob2', 'Bobby2');
    expect(await codeOf(s.requestFriend('bob2', (await s.profile('bob2')).code))).toBe('self_request');
  });

  test('an unknown code is refused', async () => {
    const s = freshStore();
    await s.setName('alice', 'Alice');
    expect(await codeOf(s.requestFriend('alice', 'ZZZZZZZZ'))).toBe('code_not_found');
  });

  test('two requests between the same players make a friendship at once', async () => {
    const s = freshStore();
    await s.setName('alice', 'Alice');
    await s.setName('bob', 'Bobby');
    await s.requestFriend('alice', (await s.profile('bob')).code);
    const result = await s.requestFriend('bob', (await s.profile('alice')).code);
    expect(result).toMatchObject({ status: 'friends' });
    expect((await s.friends('alice')).friends).toHaveLength(1);
  });

  test('declining removes the request, and removing ends the friendship on both sides', async () => {
    const s = freshStore();
    await s.setName('alice', 'Alice');
    await s.setName('bob', 'Bobby');
    await s.requestFriend('alice', (await s.profile('bob')).code);
    await s.declineFriend('bob', 'alice');
    expect((await s.friends('bob')).incoming).toEqual([]);
    expect(await codeOf(s.declineFriend('bob', 'alice'))).toBe('no_request');

    await s.requestFriend('alice', (await s.profile('bob')).code);
    await s.acceptFriend('bob', 'alice');
    await s.removeFriend('alice', (await s.friends('alice')).friends[0].playerId);
    expect((await s.friends('alice')).friends).toEqual([]);
    expect((await s.friends('bob')).friends).toEqual([]);
  });

  test('the friend list has a limit, and a full list refuses more', async () => {
    const s = freshStore();
    await s.setName('hub', 'Hub');
    const hubCode = (await s.profile('hub')).code;
    for (let i = 0; i < MAX_FRIENDS; i++) {
      await s.setName(`f${i}`, `Friend${i}`);
      await s.requestFriend(`f${i}`, hubCode);
      await s.acceptFriend('hub', `f${i}`);
    }
    await s.setName('late', 'Late');
    expect(await codeOf(s.requestFriend('late', hubCode))).toBe('friend_limit_target');
  });

  test('the friend board ranks the player and their friends by best score', async () => {
    const s = freshStore();
    await s.setName('alice', 'Alice');
    await s.setName('bob', 'Bobby');
    await s.setName('stranger', 'Stranger');
    await s.requestFriend('alice', (await s.profile('bob')).code);
    await s.acceptFriend('bob', 'alice');
    await s.recordWin('alice', { level: 1, score: 900 });
    await s.recordWin('bob', { level: 3, score: 1500 });
    await s.recordWin('stranger', { level: 1, score: 9999 });
    const board = await s.friendBoard('alice');
    expect(board.map((r) => r.label)).toEqual(['Bobby', 'Alice']);
    expect(board[1].isYou).toBe(true);
    expect(board.some((r) => r.label === 'Stranger')).toBe(false);
  });
});

describe('guilds', () => {
  test('a guild is created with a unique name, and a player is in one guild at a time', async () => {
    const s = freshStore();
    await s.setName('alice', 'Alice');
    const g = await s.createGuild('alice', 'Crown Kings');
    expect(await codeOf(s.createGuild('bob', 'crown kings'))).toBe('guild_name_taken');
    expect(await codeOf(s.createGuild('alice', 'Other'))).toBe('already_in_guild');
    expect(await codeOf(s.joinGuild('alice', g.id))).toBe('already_in_guild');
    const mine = await s.myGuild('alice');
    expect(mine).toMatchObject({ name: 'Crown Kings', memberCount: 1, isOwner: true });
  });

  test('a guild fills up, then refuses more members', async () => {
    const s = freshStore();
    const owner = await s.createGuild('owner', 'Full House');
    for (let i = 1; i < MAX_GUILD_MEMBERS; i++) await s.joinGuild(`m${i}`, owner.id);
    expect(await codeOf(s.joinGuild('late', owner.id))).toBe('guild_full');
    expect((await s.listGuilds())[0]).toMatchObject({ name: 'Full House', memberCount: MAX_GUILD_MEMBERS });
  });

  test('when the owner leaves, the longest-standing member takes over; an empty guild is removed', async () => {
    const s = freshStore();
    const g = await s.createGuild('owner', 'Handover');
    await s.joinGuild('second', g.id);
    await s.joinGuild('third', g.id);
    await s.leaveGuild('owner');
    expect((await s.myGuild('second'))?.isOwner).toBe(true);
    await s.leaveGuild('second');
    await s.leaveGuild('third');
    expect(await s.myGuild('third')).toBeNull();
    expect(await s.listGuilds()).toEqual([]);
    expect(await codeOf(s.leaveGuild('third'))).toBe('not_in_guild');
  });

  test('joining an unknown guild is refused', async () => {
    const s = freshStore();
    expect(await codeOf(s.joinGuild('alice', 'nope'))).toBe('guild_not_found');
  });
});

describe('scores and payouts', () => {
  test('the best score only goes up', async () => {
    const s = freshStore();
    await s.recordWin('alice', { level: 1, score: 900 });
    await s.recordWin('alice', { level: 2, score: 700 });
    expect(await s.recordWin('alice', { level: 2, score: 1200 })).toEqual({ bestScore: 1200 });
  });

  test('a tournament ranks each player by their best score in it', async () => {
    const s = freshStore();
    await s.recordWin('alice', { level: 1, score: 900, tournamentIds: ['cup'] });
    await s.recordWin('alice', { level: 1, score: 1000, tournamentIds: ['cup'] });
    await s.recordWin('bob', { level: 1, score: 1500, tournamentIds: ['cup'] });
    await s.recordWin('carol', { level: 1, score: 9000 });
    const ranking = await s.tournamentRanking('cup');
    expect(ranking.map((r) => r.playerId)).toEqual(['bob', 'alice']);
    const board = await s.tournamentBoard('cup', 'alice');
    expect(board.you).toMatchObject({ rank: 2, score: 1000, isYou: true });
  });

  test('a challenge counts every win and each contributor', async () => {
    const s = freshStore();
    await s.recordWin('alice', { level: 1, score: 900, challengeIds: ['rush'] });
    await s.recordWin('alice', { level: 1, score: 900, challengeIds: ['rush'] });
    await s.recordWin('bob', { level: 1, score: 900, challengeIds: ['rush'] });
    expect(await s.challengeStanding('rush', 'alice')).toEqual({ progress: 3, contributed: 2 });
    expect(await s.challengeStanding('rush', 'carol')).toEqual({ progress: 3, contributed: 0 });
  });

  test('a payout is taken once, and can be released after a failed grant', async () => {
    const s = freshStore();
    expect(await s.reservePayout('tournament:cup', 'alice')).toBe(true);
    expect(await s.reservePayout('tournament:cup', 'alice')).toBe(false);
    await s.releasePayout('tournament:cup', 'alice');
    expect(await s.hasPayout('tournament:cup', 'alice')).toBe(false);
    expect(await s.reservePayout('tournament:cup', 'alice')).toBe(true);
  });
});

describe('storage', () => {
  test('state survives a restart: a new store reads the same file', async () => {
    const f = path.join(dir, 'restart.json');
    const first = new SocialStore(f);
    await first.setName('alice', 'Alice');
    await first.recordWin('alice', { level: 1, score: 880 });
    const second = new SocialStore(f);
    expect((await second.friendBoard('alice'))[0]).toMatchObject({ label: 'Alice', score: 880 });
  });

  test('a change that fails leaves the stored data as it was', async () => {
    const f = path.join(dir, 'atomic.json');
    const s = new SocialStore(f);
    await s.setName('alice', 'Alice');
    // The guild name is taken, so this call throws after it has begun to change the data.
    await s.createGuild('alice', 'Mine');
    expect(await codeOf(s.createGuild('newbie', 'Mine'))).toBe('guild_name_taken');
    const saved = JSON.parse(fs.readFileSync(f, 'utf-8'));
    expect(saved.profiles.newbie).toBeUndefined();
    expect(Object.keys(saved.guilds)).toHaveLength(1);
  });

  test('the default file is under var/ unless SOCIAL_STORE_FILE is set', () => {
    delete process.env.SOCIAL_STORE_FILE;
    expect(socialStoreFile()).toMatch(/var[\\/]social[\\/]social\.json$/);
    process.env.SOCIAL_STORE_FILE = file;
  });
});

describe('social routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/social', socialRoutes);

  // The auth route allows 5 registrations per 15 minutes per IP. This file registers two players.
  const ids = [`soc_a_${Date.now()}`, `soc_b_${Date.now()}`];
  const tokens: string[] = [];
  beforeAll(async () => {
    for (const id of ids) {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({ playerId: id, email: `${id}@example.com`, password: 'secret123' });
      tokens.push(reg.body.token as string);
    }
  });

  test('social routes need a session', async () => {
    expect((await request(app).get('/api/social/me')).status).toBe(401);
    expect((await request(app).get('/api/social/friends')).status).toBe(401);
  });

  test('two players befriend each other by code and see each other on the board', async () => {
    const [a, b] = tokens;
    await request(app).put('/api/social/name').set('Authorization', `Bearer ${a}`).send({ name: 'Ann' });
    await request(app).put('/api/social/name').set('Authorization', `Bearer ${b}`).send({ name: 'Ben' });
    const bMe = await request(app).get('/api/social/me').set('Authorization', `Bearer ${b}`);
    expect(bMe.body.profile.name).toBe('Ben');

    const sent = await request(app)
      .post('/api/social/friends/request')
      .set('Authorization', `Bearer ${a}`)
      .send({ code: bMe.body.profile.code });
    expect(sent.status).toBe(200);
    expect(sent.body.result.status).toBe('requested');

    const incoming = await request(app).get('/api/social/friends').set('Authorization', `Bearer ${b}`);
    const from = incoming.body.incoming[0].playerId;
    const accepted = await request(app).post(`/api/social/friends/${from}/accept`).set('Authorization', `Bearer ${b}`);
    expect(accepted.status).toBe(200);

    const board = await request(app).get('/api/social/friends/leaderboard').set('Authorization', `Bearer ${a}`);
    expect(board.body.rows.map((r: any) => r.label)).toEqual(expect.arrayContaining(['Ann', 'Ben']));
    // Player ids are not shown on the board.
    expect(JSON.stringify(board.body)).not.toContain(ids[1]);
  });

  test('a bad guild name is refused with a clear code', async () => {
    const res = await request(app)
      .post('/api/social/guilds')
      .set('Authorization', `Bearer ${tokens[0]}`)
      .send({ name: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_name');
  });

  test('a player creates a guild and another joins it', async () => {
    const [a, b] = tokens;
    const created = await request(app).post('/api/social/guilds').set('Authorization', `Bearer ${a}`).send({ name: 'Round Table' });
    expect(created.status).toBe(200);
    const guildId = created.body.result.id;
    const joined = await request(app).post(`/api/social/guilds/${guildId}/join`).set('Authorization', `Bearer ${b}`);
    expect(joined.status).toBe(200);
    const mine = await request(app).get('/api/social/guilds/mine').set('Authorization', `Bearer ${b}`);
    expect(mine.body.guild.name).toBe('Round Table');
    expect(mine.body.guild.members.some((m: any) => m.isYou)).toBe(true);
    const list = await request(app).get('/api/social/guilds').set('Authorization', `Bearer ${a}`);
    expect(list.status).toBe(200);
    expect(list.body.guilds.some((g: any) => g.name === 'Round Table')).toBe(true);
  });
});
