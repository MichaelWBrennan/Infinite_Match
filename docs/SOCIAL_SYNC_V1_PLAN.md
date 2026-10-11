# Social and sync v1: plan and acceptance gates

**Status (2026-10-11): S1 built and tested against an in-memory stand-in; S2 to S5 not started.** This is bundle 3 of the parity request. It starts after the live-ops bundle and needs the owner decisions at the end before any code.

## What exists today (checked in the repository)

- **Friends and guilds.** Friend codes, friend requests, accept and decline, and a friend leaderboard (`src/routes/social.js`, mirrored in `server/app.js`). Guild create, join, leave, and listing (same files). Limits: 50 friends and 30 guild members (`src/services/social/social-store.js`).
- **Best-score board and score tournaments.** `competitions.js` ranks tournaments from verified wins. Community challenges count every verified win across players (`src/services/live-ops/competitions.js`).
- **Storage is one JSON file.** `SOCIAL_STORE_FILE`, default `var/social/social.json`. The file's own header says it "does not provide" a store shared by several servers. Writes are atomic per server, not across servers.
- **Economy storage is already durable.** `ECONOMY_STORE=mongo` keeps balances in MongoDB, and production requires it (`src/services/economy/PlayerEconomyDb.js`). The owner has confirmed production uses it.
- **Multiplayer code exists but is not product.** `src/services/multiplayer/` (room manager, session manager, anti-cheat, about 2,200 lines) is in memory, mounted at `/api/multiplayer`, and **no client code calls it**. It is not a live PvP feature and must not be called one.
- **Offline and sync.** The client keeps a guest fallback for temporary errors. There is **no** queue of offline results and **no** reconciliation with the server. Signed-in progress needs the server.

## Prerequisites from the repository's own strategy

`docs/COMPETITIVE_STRATEGY.md` says team cooperation comes "**after** durable shared social storage and result verification", and that team contributions, gifts or consequential rewards need a transactional shared store first. Real-time PvP is "a separate product bet", needs an authoritative clock and turn log, reconnect, and abuse tests, and must not be called "live PvP" before then.

So bundle 3 starts with the store, not with gifts or PvP.

## Milestones and acceptance gates

**S1: durable shared social store (built, live MongoDB check open).** `src/services/social/social-backend.js` holds the whole social state in one MongoDB document with a revision. A write is a compare-and-set: it reloads, applies the change to a copy, and saves only if the revision is unchanged, retrying up to five times, then `social_store_busy`. `SocialStore` takes the backend; the JSON file path is unchanged. Production requires `SOCIAL_STORE=mongo` (`assertSocialStoreForEnvironment`, called at startup). `scripts/import-social-store.mjs` imports the JSON file once and is idempotent. *Gate status:* `src/__tests__/social-shared-store.test.ts` (6 tests) covers two stores sharing one document, 40 concurrent guild joins across two stores admitting exactly the free slots, the busy error, validation that saves nothing, idempotent import, and the production guard. **Open:** no real MongoDB is available here, so the compare-and-set has been checked only against a fake that follows MongoDB's rules. The import script has not been run against a database. Move friends, requests, guilds, best scores, and competition entries into a transactional store behind the same opt-in and production guard as the economy (`SOCIAL_STORE=mongo`, required in production). Keep the JSON file for local and tests. Migrate existing data once, idempotently. *Gate:* the existing social tests pass on both stores; two server instances against one store see the same friend and guild state; a concurrent guild join at the 30-member limit admits exactly 30; a migration run twice changes nothing.

**S2: energy gifts between friends (limited).** A friend can send energy, never coins, stars, boosters, or paid items. Limits: friends only; a daily cap per sender and per receiver (value to be set by the owner); no self-gifts; each gift has an idempotency key so a retry is one gift. *Gate:* duplicate, cap, self-gift, non-friend, and concurrent-send tests; a gift never exceeds the receiver's energy maximum; the economy records each gift with a receipt.

**S3: shared milestone (guild or friend team goal).** Contributions count only from server-verified classic or daily wins, one per attempt, and the reward is granted once per member. No paid items. *Gate:* a contribution cannot be counted twice across retries; an unverified win adds nothing; a member who leaves before the claim gets nothing new.

**S4: signed-in offline reconciliation.** Results played offline are queued with their attempt IDs and sent when the player is back online. The server accepts them only against the existing attempt receipts, so no result is granted twice, and a stale attempt is refused with a clear message. *Gate:* offline-then-online tests show one grant per attempt; a queue that is replayed twice grants once; expired attempts are refused; no change to paid definitions.

**S5: client and operator gate.** Friend, gift, and milestone screens with assistive labels, a phone check, and an operator runbook for the store and its migration. *Gate:* the phone check and owner sign-off. Nothing is published automatically.

## Explicitly out of this pass

- **Real-time PvP.** It is a separate product bet. The current multiplayer code is not authoritative for scores, has no clock, no reconnect, and no client. Building it is a separate plan with its own owner decision.
- **Competitor team tournaments and co-op events.** They need S1 and S3 first, and content design the owner has not chosen.
- **Cross-device save as a new feature.** The economy already saves server-side when `ECONOMY_STORE=mongo` is set. S4 covers offline reconciliation only.

## Owner decisions (2026-10-11, answered)

- **Scope:** option B. S1 to S4 in one pass, then S5 (client and operator gate).
- **Storage:** MongoDB behind `SOCIAL_STORE=mongo`, required in production, as the economy is.
- **Gift cap:** 3 energy gifts per sender per day. The option text also said receivers are capped at 3 per day. Taken as written; the owner should confirm the receiver cap.
- **PvP:** stays out of this pass.

## Decisions still to make (originally listed)

1. **Scope of this pass.** Option A: S1 and S2 now, then S3 after review. Option B: S1 to S4 in one pass. Option C: S1 only, then decide. (Recommended: A.)
2. **Storage.** Use MongoDB for social state behind `SOCIAL_STORE=mongo`, required in production as the economy is. Confirm, or name another store.
3. **Gift cap.** Maximum energy gifts per sender per day (for example 3 or 5), and whether receivers also have a daily cap.
4. **PvP.** Confirm that real-time PvP stays out of this parity pass.

## Known blockers

- No player evidence yet. Social features have no measured effect on retention.
- No browser or phone check is possible in this environment (no browser is installed).
