# Reward receipts and saved-win sync

Bet #6 makes the reward path visible and recoverable.

## What the player sees

- After a signed-in win, the result screen shows a **server receipt**:
  - whether the replay was verified,
  - whether the result can rank (booster-free) or is reward-only/unranked,
  - the exact server-granted coins/stars,
  - duplicate retries showing the original receipt with no second grant.
- Endless banks show that the server confirmed the bank but Endless does not enter ranked boards.
- Guest wins are labelled local/free; no account reward is implied.
- Explore → **Saved wins and reward receipts** shows wins waiting to sync and offers an explicit **Sync** action.

## Offline recovery

The existing `public/js/win-queue.js` is unchanged. A win whose reward request failed on network/5xx is stored with its attempt id and original body. Sync calls the existing `flushPendingWins()` path:

- `settled`: server paid or confirmed the original payment.
- `refused`: server rejected the stale/mismatched attempt; the queue drops it.
- `kept`: still offline/server error; it stays queued.

The client never grants coins, stars, or ranked status locally. The server remains the only source of settlement and replay verification.

## Files

- `public/js/reward-receipt.js` — pure receipt/sync copy and accessible rendering.
- `phaser3-game.js` — `showRewardReceipt()`, `syncSavedWins()`, `showSavedWins()`, `pendingWinCount()`.
- `public/js/player-experience.js` — `renderRewardReceipt()` and Explore entry.
- `public/sw.js` / `index.html` — offline shell and script order.
- `src/__tests__/reward-receipt.test.ts`.

## Verification limits

Tests and Chromium smoke prove the UI states, explicit sync action, and wiring to the existing idempotent queue. They do not prove production multi-server storage, real payment rails, or that a human trusts the explanation. The existing result-integrity gates in `docs/COMPETITIVE_STRATEGY.md` remain open.
