// Social on the free server: profile names, friends, and guilds. The data lives in one JSON file,
// written through the shared SocialStore (src/services/social/social-store.js), so the rules are
// the same ones the existing server uses. Identity is the account username.
import { fileURLToPath } from 'node:url';
import { SocialError, SocialStore } from '../src/services/social/social-store.js';
import { ApiError } from './errors.js';

const ERROR_STATUS = {
  invalid_name: 400,
  self_request: 400,
  code_not_found: 404,
  guild_not_found: 404,
  no_request: 404,
  not_friends: 404,
  not_in_guild: 404,
  name_taken: 409,
  name_required: 409,
  guild_name_taken: 409,
  already_friends: 409,
  already_requested: 409,
  already_in_guild: 409,
  guild_full: 409,
  friend_limit: 409,
  friend_limit_target: 409,
};

// SOCIAL_STORE_FILE overrides the default location (tests use a temporary file).
export function socialFilePath() {
  return process.env.SOCIAL_STORE_FILE || fileURLToPath(new URL('./data/social.json', import.meta.url));
}

let store = null;
/** The one social store for this process. Created on first use, so tests can set the file first. */
export function socialStore() {
  if (!store) store = new SocialStore(socialFilePath());
  return store;
}

/** Runs a store call and turns its SocialError into the matching API error. */
export async function socialCall(fn) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof SocialError) throw new ApiError(ERROR_STATUS[error.code] || 400, error.code);
    throw error;
  }
}

const idParam = (value) => {
  if (typeof value !== 'string' || value.length === 0 || value.length > 100) {
    throw new ApiError(400, 'invalid_id');
  }
  return value;
};

export const social = {
  me: (username) => socialCall(async () => ({ success: true, profile: await socialStore().profile(username) })),
  setName: (username, name) => socialCall(async () => ({ success: true, result: await socialStore().setName(username, name) })),
  friends: (username) => socialCall(async () => ({ success: true, ...(await socialStore().friends(username)) })),
  friendLeaderboard: (username) => socialCall(async () => ({ success: true, rows: await socialStore().friendBoard(username) })),
  requestFriend: (username, code) => socialCall(async () => ({ success: true, result: await socialStore().requestFriend(username, code) })),
  acceptFriend: (username, otherId) => socialCall(async () => ({
    success: true, result: await socialStore().acceptFriend(username, idParam(otherId)),
  })),
  declineFriend: (username, otherId) => socialCall(async () => ({
    success: true, result: await socialStore().declineFriend(username, idParam(otherId)),
  })),
  removeFriend: (username, otherId) => socialCall(async () => ({
    success: true, result: await socialStore().removeFriend(username, idParam(otherId)),
  })),
  listGuilds: (limit) => socialCall(async () => ({ success: true, guilds: await socialStore().listGuilds(Number(limit) || 20) })),
  myGuild: (username) => socialCall(async () => ({ success: true, guild: await socialStore().myGuild(username) })),
  createGuild: (username, name) => socialCall(async () => ({ success: true, result: await socialStore().createGuild(username, name) })),
  joinGuild: (username, guildId) => socialCall(async () => ({
    success: true, result: await socialStore().joinGuild(username, idParam(guildId)),
  })),
  leaveGuild: (username) => socialCall(async () => ({ success: true, result: await socialStore().leaveGuild(username) })),
};
