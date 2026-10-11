# Social store and social features: operator runbook

Scope: friends, energy gifts (S2), guild milestone (S3), and offline win reconciliation (S4). Plan and
decisions: `docs/SOCIAL_SYNC_V1_PLAN.md`. Nothing here publishes a change on its own.

## 1. Store setup (one time, before the first production start)

- Production requires `ECONOMY_STORE=mongo` and `SOCIAL_STORE=mongo`. The server refuses to start
  otherwise (`assertEconomyStoreForEnvironment`, `assertSocialStoreForEnvironment`).
- Set `MONGODB_URI` to the same database the economy uses. All social state lives in one MongoDB document
  (key `social`) with a revision number. Writes are compare-and-set; a conflicting write retries up to
  five times, then the player gets `503 social_store_busy` and should try again.
- Import the existing JSON social file once, with the server stopped or idle:

  ```sh
  SOCIAL_STORE=mongo MONGODB_URI='<same connection string as the server>' node scripts/import-social-store.mjs
  ```

  It prints `Social import: <outcome>`. The import is idempotent: if the shared document already exists,
  nothing changes. Run it again only after checking the printed outcome.

**Not yet verified:** no real MongoDB was available when this was built. The tests use a fake
collection that follows the same compare-and-set and unique-key rules. Before launch, run the import and
two server instances against a real database, and check that concurrent guild joins respect the limit of 30.

## 2. Limits in force (code constants, changing them needs a deploy)

| Setting | Value | Where |
| --- | --- | --- |
| Energy gift amount | 1 | `ENERGY_GIFT_AMOUNT` (`social-store.js`) |
| Gifts sent per sender per UTC day | 3 | `GIFT_DAILY_LIMIT` |
| Gifts received per receiver per UTC day | 3 (owner to confirm) | `GIFT_DAILY_LIMIT` |
| Gift records kept | 14 days | `GIFT_RECORD_MS` |
| Milestone goal (verified wins per guild per UTC week) | 50 (proposal) | `MILESTONE_GOAL` |
| Milestone reward per contributing member | 25 coins (proposal) | `MILESTONE_REWARD_COINS` |
| Milestone records kept | 21 days | `MILESTONE_RECORD_MS` |
| Queued offline wins per browser | 20, dropped after 3 hours | `public/js/win-queue.js` |
| Guild members | 30 | `MAX_GUILD_MEMBERS` |

Milestone claims are limited to the UTC week the goal was reached in. A reward not claimed by the end of
the week is not granted later.

## 3. Checks when something looks wrong

- **Gift refused:** the error code shows the reason (`not_friends`, `self_gift`, `gift_sender_limit`,
  `gift_receiver_limit`, `gift_id_reused`). These are expected, not faults.
- **Gift recorded but energy not added:** the receiver was full (`credited: 0`). The gift is
  kept as recorded, and a retry with the same id is a no-op.
- **Milestone shows progress but no claim:** the member has no counted win this week, the goal is not
  reached, or the member has left the guild. Check `GET /api/social/milestone` as that player.
- **Claim refused with `milestone_wallet_full`:** the coin wallet is at its maximum. The claim is not
  lost; the player can claim after spending coins, within the same week.
- **A queued offline win was not counted:** the browser console shows
  `A saved level result was not counted`. `attempt_not_found` means a newer attempt replaced it;
  `attempt_expired` means it was older than 3 hours. Either way no coins or stars were granted for it.
- **A reward was granted twice:** this should not be possible. Every economy grant is keyed by the
  attempt or the milestone and stored with its receipt. Report it with the player id and the time.

## 4. Rollback

- Turning off the gift route or milestone claims needs a code change. Stopping the server does not
  reverse anything already granted. Social state is additive: no paid item, coin balance, or purchase is
  changed by these features except the coin grant from a claim, which has its own receipt.
- To return to the JSON file (single server only), unset `SOCIAL_STORE`. The social data in MongoDB is
  not deleted, and it is not copied back to the file.

## 5. Not included in this pass

- Real-time PvP (separate plan).
- Gifts and milestones on the free server (`server/`). Only the Express routes have them.
- The phone check and owner sign-off (S5 gate). Nothing is published until those are recorded in the plan.
