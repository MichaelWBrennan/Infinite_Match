# Live ops v1: plan and acceptance gates

**Status (2026-10-11): L1 to L5 tooling built; nothing published (L4 needs a phone check, and the owner must sign off before publication); the challenge is wired to settlement and claims on both servers, and is OFF until a `scoreChallenges` entry is published.** L1 is the pure definition, validator and progress module (`src/services/live-ops/score-challenge.js`). L2 is the economy functions (`src/services/live-ops/score-challenge-economy.js`). L3 is the config and wiring: `scoreChallenges` is validated at load, a verified win is counted in both settlement paths (`src/services/economy/AccountEconomyService.js` and `server/economy.js`), and `POST /api/live-ops/score-challenge/claim` exists on both servers. The checked-in `config/liveops.json` has no `scoreChallenges`, so no player sees the feature yet. L4 is the player-visible card: the Community events tab and the Explore overlay, via `public/js/score-challenge-card.js`. Deals, prices and the weekly event are unchanged.

## Owner decisions (2026-10-11)

- **Event type:** personal score challenge (option A).
- **Ceiling:** the Hall Lanterns weekly ceiling. Each tier at most 40 coins, all tiers at most 80. A test guards this against drift from `config/liveops.json`.
- **Deals:** out of v1.
- **Production store:** the code refuses to start in production without `ECONOMY_STORE=mongo` (`assertEconomyStoreForEnvironment`, called in `src/server/index.ts` before services start, with a test). **Confirmed by the owner (2026-10-11):** production runs `NODE_ENV=production` with `ECONOMY_STORE=mongo`. The guard applies. Publication still needs the L5 sign-off.

## Config key and kill switch (L3)

- The personal challenge lives under **`scoreChallenges`**, not `challenges`. `challenges` is already the community challenge list read by `src/services/live-ops/competitions.js` (goal and reward, one shared total). Reusing the key would make the two systems collide.
- `SCORE_CHALLENGE_DISABLED=1` stops new wins and new claims. Saved progress is kept.
- Claims: `POST /api/live-ops/score-challenge/claim` with `{ challengeId, threshold }`. Responses: 404 `challenge_not_found` or `challenge_tier_not_found`; 409 `challenge_progress_required`, `challenge_closed` or `challenge_wallet_full`.

## L1 rules (built)

- A challenge has an ID, name, a UTC window of at most seven days, a personal target of 1,000 to 100,000 verified classic points, and one to three coin tiers with strictly increasing thresholds.
- Unknown fields are rejected, so no hidden reward field can ride along.
- A result counts only inside the window: start inclusive, end exclusive. Only verified classic wins are counted.
- A claimed tier is not offered again.

## What exists today (checked in the repository)

| Piece | State | Source |
| --- | --- | --- |
| Weekly event (Hall Lanterns) | Ten Monday 00:00 UTC windows through 14 December 2026, modest 1/3/5-win coin rewards, verified wins only, idempotent claims | `config/liveops.json`, [WEEKLY_EVENT_OPERATIONS.md](WEEKLY_EVENT_OPERATIONS.md) |
| Calendar tooling | Read-only preview and comparison script; 14-day future check | `scripts/preview-weekly-event.mjs` |
| Generic `events` array | Validated, but each entry has only id, name, window and description. **No rules, no rewards, no claim path.** Empty. | `src/services/live-ops/live-ops.js` |
| `deals` array | Validated against the catalog. Changes a **real-money price**. Empty. | same |
| `tournaments`, `challenges` arrays | **Not validated and not read.** Anything placed there is silently ignored. Empty. | same |
| Competitions | Module exists. Not part of the weekly event. | `src/services/live-ops/competitions.js`, `server/competitions.js` |
| Battle pass, daily wheel | Configured, not part of this plan | `src/services/meta/battlepass*.js` |

Gap, from the [competitive ranking](COMPETITIVE_STRATEGY.md): live ops scores **2/5** against 5 for Royal Match and Candy Crush. Competitors rotate several event types with different rules. This repository has one event type, one calendar, and an operations gate that is not yet closed.

## Design choices to confirm before any code

1. **The second event type.** Options:
   - **A. Personal score challenge (recommended).** A fixed window with a personal score goal, using classic levels only. No ranking and no shared state. It reuses the weekly claim path.
   - **B. Board-rule event.** Classic levels with a weekly rule, such as v6 blockers. This depends on the M5 default, which waits for the first-play study.
   - **C. Community collective goal.** Players contribute toward a shared target. This needs a shared counter store that does not exist yet.
2. **Rewards.** Coins only, with a per-event ceiling set by the owner. Rewards must not be paid definitions and must not change a paid level.
3. **Deals.** Recommended: **out of scope for v1.** A deal changes a real-money price and needs the payments review in [ECONOMY.md](ECONOMY.md) first.
4. **Production store.** The runbook requires `ECONOMY_STORE=mongo` in production, because the per-player lock is process-local. The owner must confirm that this is true for the deployment that will serve events.

## Non-goals for v1

- Real-time PvP, team battles, guilds, or any ranking that reads a shared social store. The social store is a separate single-file store and is not safe for live rankings.
- Prize tournaments or prize pools.
- Automatic publication. An agent never writes to the live config. A human publishes, as the runbook describes.
- A new payment product, price change or currency.

## Milestones and acceptance gates

**L1: pure definition and rules.** A validator for the chosen event type, with every field typed and bounded, and a pure function that computes progress from verified results. *Gate:* unit tests for each rule and each rejected field; no change to `weeklyEvents`; the existing live-ops tests pass.

**L2: claim path and rewards (built).** Claims use the same single-save, idempotent path as the weekly event. Expired events grant nothing late. *Gate:* duplicate-claim, lost-response and post-window tests; the reward ceiling is enforced in the validator, not only in the UI.

**L3: validation of every array (built).** An unknown top-level key fails the load. `scoreChallenges` entries are validated and duplicate ids fail. `tournaments` and `challenges` must be lists; their entries are validated per entry by `competitions.js`, which drops invalid entries and logs them. `events` and `deals` are validated as before; `events` are display-only and `deals` are prices, so neither has a claim path. *Gate met:* `src/__tests__/live-ops-config.test.ts`; the checked-in file loads; the server test `server/test/liveops.mjs` and the Express test in `weekly-event.test.ts` cover the wired claim path.

**L4: client presentation (built, phone check open).** A card in the Community events tab and a line plus button in Explore. Each shows the local end time with the UTC boundary, a countdown corrected to server time, a progress meter with an aria label, and one labelled row per tier (claimed, ready to claim, closed, or points remaining). Guests see the schedule and no buttons. *Gate met:* 21 unit tests for label and countdown text, browser-harness tests for the events tab and claim, and free-server and Express tests for the views. *Still open:* a real browser check on a phone. No browser is installed in this environment, so that check has not run. The service-worker shell is bumped to `v3`.

**L5: operator gate and publication (tooling built; NOT published).** `scripts/preview-weekly-event.mjs` now also validates the whole live-ops file, prints each score challenge with its UTC window and the view at four boundary instants (1 ms before start, start, 1 ms before end, end), and fails when a challenge starts less than `SCORE_CHALLENGE_MIN_LEAD_DAYS` (default 14) after the preview. Run it with the candidate file: `LIVE_OPS_CONFIG=<file> node scripts/preview-weekly-event.mjs <ISO instant>`. *Gate status:* the checks are in `src/__tests__/score-challenge-preview.test.ts`. The owner has NOT signed off, and `config/liveops.json` has no `scoreChallenges`. Publication is a separate, owner-approved config change, never automatic.

## Known blockers for this plan

- **Correction (L3):** `tournaments` and `challenges` were not ignored. `competitions.js` validates them per entry. What was missing was an unknown-key check, which L3 adds.
- **Production store.** `ECONOMY_STORE=mongo` must be confirmed (see design choice 4).
- **Browser smoke is not green** on the baseline (see the board-variety plan). Event UI cannot be verified end to end until that is fixed.
- **No player evidence.** Event rewards and difficulty are unvalidated until the first-play study and an event review have run.

## Owner questions (answered in part)

1. Which second event type? (A, B or C above; recommended A.)
2. What is the per-event coin ceiling?
3. Keep deals out of v1? (recommended yes)
4. Production store: answered (see Owner decisions).
