/**
 * Social state: display names, friend codes, friends, guilds, best scores, and the progress of
 * tournaments and community challenges.
 *
 * Storage is one JSON file (SOCIAL_STORE_FILE, default var/social/social.json). That is enough for
 * one server. Several servers would each need the same shared store, and this does not provide one.
 *
 * Every change runs on a copy of the data. The copy replaces the data only when the change
 * succeeds, and the file is written to a temp file and renamed. A failed change leaves nothing
 * half-written.
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export const MAX_FRIENDS = 50;
export const MAX_GUILD_MEMBERS = 30;
export const NAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9 _-]{1,14}[A-Za-z0-9])$/;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export class SocialError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

export function socialStoreFile() {
  return process.env.SOCIAL_STORE_FILE || path.resolve('var', 'social', 'social.json');
}

const emptyData = () => ({
  version: 2, // v2 scores only come from pinned replay; v1 client claims cannot remain ranked.
  profiles: {}, // playerId -> { name, code, createdAt }
  friends: {}, // playerId -> [playerId] (always symmetric)
  requests: {}, // toPlayerId -> [fromPlayerId]
  guildOf: {}, // playerId -> guildId
  guilds: {}, // guildId -> { id, name, ownerId, members: [playerId], createdAt }
  bestScores: {}, // playerId -> { score, level, at }
  competitions: {}, // 't:<id>' or 'c:<id>' -> tournament scores or challenge progress
  payouts: {}, // '<kind>:<id>' -> [playerId] that have been paid
});

const randomCode = () => {
  let code = '';
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  return code;
};

const anonLabel = (playerId) =>
  `Player ${crypto.createHash('sha256').update(playerId).digest('hex').slice(0, 4).toUpperCase()}`;

function ensureProfile(d, playerId) {
  if (!d.profiles[playerId]) {
    let code = randomCode();
    const used = new Set(Object.values(d.profiles).map((p) => p.code));
    while (used.has(code)) code = randomCode();
    d.profiles[playerId] = { name: null, code, createdAt: new Date().toISOString() };
  }
  return d.profiles[playerId];
}

const labelOf = (d, playerId) => d.profiles[playerId]?.name || anonLabel(playerId);

const friendsOf = (d, playerId) => d.friends[playerId] || [];

export class SocialStore {
  constructor(file = null) {
    this.file = file;
    this.data = null;
    this.queue = Promise.resolve();
  }

  path() {
    return this.file || socialStoreFile();
  }

  async load() {
    if (this.data) return;
    try {
      const raw = await fs.readFile(this.path(), 'utf-8');
      this.data = { ...emptyData(), ...JSON.parse(raw) };
      if (this.data.version < 2) {
        // Do not migrate unverifiable scores or shared progress into verified boards.
        // Preserve profiles, social links and payout receipts: resetting receipts would
        // allow already-paid tournament/challenge prizes to be claimed twice.
        this.data.bestScores = {};
        this.data.competitions = {};
        this.data.version = 2;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      this.data = emptyData();
    }
  }

  async persist(data) {
    const file = this.path();
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data));
    await fs.rename(tmp, file);
  }

  /** Runs fn on a copy of the data, saves it, and only then replaces the data. Serialised. */
  write(fn) {
    const run = this.queue.then(async () => {
      await this.load();
      const draft = structuredClone(this.data);
      const result = await fn(draft);
      await this.persist(draft);
      this.data = draft;
      return result;
    });
    this.queue = run.catch(() => {});
    return run;
  }

  /** Runs fn on the current data without changing it. Waits for pending writes first. */
  read(fn) {
    const run = this.queue.then(async () => {
      await this.load();
      return fn(this.data);
    });
    this.queue = run.catch(() => {});
    return run;
  }

  // ----- profiles -------------------------------------------------------------------------------

  /** The player's own profile, with their friend code. Creates the profile on first use. */
  profile(playerId) {
    return this.write((d) => {
      const p = ensureProfile(d, playerId);
      return {
        name: p.name,
        code: p.code,
        guild: this.guildSummary(d, playerId),
        friendCount: friendsOf(d, playerId).length,
      };
    });
  }

  setName(playerId, name) {
    return this.write((d) => {
      if (typeof name !== 'string' || !NAME_PATTERN.test(name)) throw new SocialError('invalid_name');
      const lower = name.toLowerCase();
      for (const [id, p] of Object.entries(d.profiles)) {
        if (id !== playerId && p.name && p.name.toLowerCase() === lower) throw new SocialError('name_taken');
      }
      ensureProfile(d, playerId).name = name;
      return { name };
    });
  }

  // ----- friends --------------------------------------------------------------------------------

  requestFriend(playerId, rawCode) {
    return this.write((d) => {
      const me = ensureProfile(d, playerId);
      if (!me.name) throw new SocialError('name_required');
      const code = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';
      const target = Object.keys(d.profiles).find((id) => d.profiles[id].code === code);
      if (!target) throw new SocialError('code_not_found');
      if (target === playerId) throw new SocialError('self_request');
      if (friendsOf(d, playerId).includes(target)) throw new SocialError('already_friends');
      // If the other player already asked us, the two requests make a friendship.
      if ((d.requests[playerId] || []).includes(target)) return this.acceptIn(d, playerId, target);
      if ((d.requests[target] || []).includes(playerId)) throw new SocialError('already_requested');
      if (friendsOf(d, playerId).length >= MAX_FRIENDS) throw new SocialError('friend_limit');
      if (friendsOf(d, target).length >= MAX_FRIENDS) throw new SocialError('friend_limit_target');
      d.requests[target] = [...(d.requests[target] || []), playerId];
      return { status: 'requested', label: labelOf(d, target) };
    });
  }

  acceptIn(d, playerId, fromId) {
    if (!(d.requests[playerId] || []).includes(fromId)) throw new SocialError('no_request');
    if (friendsOf(d, playerId).length >= MAX_FRIENDS) throw new SocialError('friend_limit');
    if (friendsOf(d, fromId).length >= MAX_FRIENDS) throw new SocialError('friend_limit_target');
    d.requests[playerId] = d.requests[playerId].filter((id) => id !== fromId);
    if (d.requests[playerId].length === 0) delete d.requests[playerId];
    d.friends[playerId] = [...friendsOf(d, playerId), fromId];
    d.friends[fromId] = [...friendsOf(d, fromId), playerId];
    return { status: 'friends', label: labelOf(d, fromId) };
  }

  acceptFriend(playerId, fromId) {
    return this.write((d) => this.acceptIn(d, playerId, fromId));
  }

  declineFriend(playerId, fromId) {
    return this.write((d) => {
      if (!(d.requests[playerId] || []).includes(fromId)) throw new SocialError('no_request');
      d.requests[playerId] = d.requests[playerId].filter((id) => id !== fromId);
      if (d.requests[playerId].length === 0) delete d.requests[playerId];
      return { status: 'declined' };
    });
  }

  removeFriend(playerId, friendId) {
    return this.write((d) => {
      if (!friendsOf(d, playerId).includes(friendId)) throw new SocialError('not_friends');
      d.friends[playerId] = friendsOf(d, playerId).filter((id) => id !== friendId);
      d.friends[friendId] = friendsOf(d, friendId).filter((id) => id !== playerId);
      return { status: 'removed' };
    });
  }

  /** Friends and incoming requests. Ids are included only for the player's own list. */
  friends(playerId) {
    return this.read((d) => ({
      friends: friendsOf(d, playerId).map((id) => ({
        playerId: id,
        label: labelOf(d, id),
        bestScore: d.bestScores[id]?.score ?? 0,
      })),
      incoming: (d.requests[playerId] || []).map((id) => ({ playerId: id, label: labelOf(d, id) })),
    }));
  }

  /** Best scores for the player and their friends. Labels only, no ids. */
  friendBoard(playerId) {
    return this.read((d) => {
      const ids = [playerId, ...friendsOf(d, playerId)];
      return ids
        .map((id) => ({ label: labelOf(d, id), score: d.bestScores[id]?.score ?? 0, isYou: id === playerId }))
        .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
        .map((row, i) => ({ rank: i + 1, ...row }));
    });
  }

  // ----- guilds ---------------------------------------------------------------------------------

  guildSummary(d, playerId) {
    const id = d.guildOf[playerId];
    const g = id && d.guilds[id];
    if (!g) return null;
    return { id: g.id, name: g.name, memberCount: g.members.length, isOwner: g.ownerId === playerId };
  }

  createGuild(playerId, name) {
    return this.write((d) => {
      ensureProfile(d, playerId);
      if (typeof name !== 'string' || !NAME_PATTERN.test(name)) throw new SocialError('invalid_name');
      if (d.guildOf[playerId]) throw new SocialError('already_in_guild');
      const lower = name.toLowerCase();
      if (Object.values(d.guilds).some((g) => g.name.toLowerCase() === lower)) throw new SocialError('guild_name_taken');
      const id = crypto.randomBytes(6).toString('hex');
      d.guilds[id] = { id, name, ownerId: playerId, members: [playerId], createdAt: new Date().toISOString() };
      d.guildOf[playerId] = id;
      return { id, name };
    });
  }

  joinGuild(playerId, guildId) {
    return this.write((d) => {
      ensureProfile(d, playerId);
      const g = d.guilds[guildId];
      if (!g) throw new SocialError('guild_not_found');
      if (d.guildOf[playerId]) throw new SocialError('already_in_guild');
      if (g.members.length >= MAX_GUILD_MEMBERS) throw new SocialError('guild_full');
      g.members.push(playerId);
      d.guildOf[playerId] = guildId;
      return { id: g.id, name: g.name };
    });
  }

  leaveGuild(playerId) {
    return this.write((d) => {
      const id = d.guildOf[playerId];
      const g = id && d.guilds[id];
      if (!g) throw new SocialError('not_in_guild');
      delete d.guildOf[playerId];
      g.members = g.members.filter((m) => m !== playerId);
      if (g.members.length === 0) {
        delete d.guilds[id];
      } else if (g.ownerId === playerId) {
        g.ownerId = g.members[0]; // the longest-standing member takes over
      }
      return { status: 'left' };
    });
  }

  /** The player's guild with member labels, or null. */
  myGuild(playerId) {
    return this.read((d) => {
      const id = d.guildOf[playerId];
      const g = id && d.guilds[id];
      if (!g) return null;
      return {
        id: g.id,
        name: g.name,
        memberCount: g.members.length,
        isOwner: g.ownerId === playerId,
        members: g.members.map((m) => ({ label: labelOf(d, m), isYou: m === playerId, bestScore: d.bestScores[m]?.score ?? 0 })),
      };
    });
  }

  /** Guilds ranked by member count, then total best score. */
  listGuilds(limit = 20) {
    return this.read((d) =>
      Object.values(d.guilds)
        .map((g) => ({
          id: g.id,
          name: g.name,
          memberCount: g.members.length,
          totalBestScore: g.members.reduce((sum, m) => sum + (d.bestScores[m]?.score ?? 0), 0),
        }))
        .sort((a, b) => b.memberCount - a.memberCount || b.totalBestScore - a.totalBestScore || a.name.localeCompare(b.name))
        .slice(0, Math.max(1, Math.min(limit, 100))),
    );
  }

  // ----- scores and competitions ----------------------------------------------------------------

  /**
   * Records a won level. Updates the player's best score, and their score and progress in each
   * active tournament and challenge. The caller decides which competitions are active.
   */
  recordWin(playerId, { level, score, tournamentIds = [], challengeIds = [] }) {
    return this.write((d) => {
      const best = d.bestScores[playerId];
      if (!best || score > best.score) d.bestScores[playerId] = { score, level, at: new Date().toISOString() };
      for (const id of tournamentIds) {
        const key = `t:${id}`;
        const t = (d.competitions[key] ??= { scores: {} });
        t.scores[playerId] = Math.max(t.scores[playerId] ?? 0, score);
      }
      for (const id of challengeIds) {
        const key = `c:${id}`;
        const c = (d.competitions[key] ??= { progress: 0, contributors: {} });
        c.progress += 1;
        c.contributors[playerId] = (c.contributors[playerId] || 0) + 1;
      }
      return { bestScore: d.bestScores[playerId].score };
    });
  }

  /** Full ranking for a tournament: [{ playerId, score }], highest first. */
  tournamentRanking(tournamentId) {
    return this.read((d) => {
      const t = d.competitions[`t:${tournamentId}`];
      return Object.entries(t?.scores || {})
        .map(([playerId, score]) => ({ playerId, score }))
        .sort((a, b) => b.score - a.score || a.playerId.localeCompare(b.playerId));
    });
  }

  /** Top rows for display, and the viewer's own rank. Labels only, no ids. */
  tournamentBoard(tournamentId, viewerId, limit = 10) {
    return this.read((d) => {
      const t = d.competitions[`t:${tournamentId}`];
      const ranked = Object.entries(t?.scores || {})
        .map(([playerId, score]) => ({ playerId, score }))
        .sort((a, b) => b.score - a.score || a.playerId.localeCompare(b.playerId));
      const rows = ranked.map((row, i) => ({
        rank: i + 1,
        label: labelOf(d, row.playerId),
        score: row.score,
        isYou: row.playerId === viewerId,
      }));
      const you = rows.find((r) => r.isYou) || null;
      return { entries: rows.slice(0, limit), you };
    });
  }

  challengeStanding(challengeId, playerId) {
    return this.read((d) => {
      const c = d.competitions[`c:${challengeId}`];
      return {
        progress: c?.progress ?? 0,
        contributed: c?.contributors?.[playerId] ?? 0,
      };
    });
  }

  /**
   * Marks a payout as taken for one player. Returns false if it was already taken. Pair with
   * releasePayout when the grant fails, so a failed grant can be retried.
   */
  reservePayout(key, playerId) {
    return this.write((d) => {
      const list = (d.payouts[key] ??= []);
      if (list.includes(playerId)) return false;
      list.push(playerId);
      return true;
    });
  }

  hasPayout(key, playerId) {
    return this.read((d) => (d.payouts[key] || []).includes(playerId));
  }

  releasePayout(key, playerId) {
    return this.write((d) => {
      if (d.payouts[key]) d.payouts[key] = d.payouts[key].filter((id) => id !== playerId);
      return true;
    });
  }
}

export const socialStore = new SocialStore();

export default socialStore;
