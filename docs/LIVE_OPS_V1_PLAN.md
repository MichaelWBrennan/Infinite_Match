# Live ops v1: plan and acceptance gates

**Status (2026-10-11): L1 built, not wired.** The owner chose a personal score challenge, the same coin ceiling as the weekly event, and no deals in v1. L1 is the pure definition, validator and progress module in `src/services/live-ops/score-challenge.js`. Config and claims are unchanged (L2 and L3 are not started). This is the second bundle from the parity request ("board variety, live ops, social and sync, in that order"). Board variety is built and gated (see [BOARD_VARIETY_V6_PLAN.md](BOARD_VARIETY_V6_PLAN.md)). This plan changes no config, no rule, no economy path and no published event.

## Owner decisions (2026-10-11)

- **Event type:** personal score challenge (option A).
- **Ceiling:** the Hall Lanterns weekly ceiling. Each tier at most 40 coins, all tiers at most 80. A test guards this against drift from `config/liveops.json`.
- **Deals:** out of v1.
- **Still open:** production store (`ECONOMY_STORE=mongo`). Confirm before L2.

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

**L2: claim path and rewards.** Claims use the same single-save, idempotent path as the weekly event. Expired events grant nothing late. *Gate:* duplicate-claim, lost-response and post-window tests; the reward ceiling is enforced in the validator, not only in the UI.

**L3: validation of every array.** `tournaments` and `challenges` are either validated or rejected at load. An unknown array name fails the load. *Gate:* a config with an unknown key fails; the checked-in file still loads.

**L4: client presentation.** An event card in Explore and the Community events tab, with a local end time and the UTC boundary named, and assistive labels for progress. *Gate:* unit tests for labels and countdown text; a browser check on a phone is required before publication.

**L5: operator gate and publication.** The preview script is extended to the new type, and the schedule is published at least 14 days ahead. *Gate:* the preview passes at the planned boundaries and the owner signs off. Publication is never automatic.

## Known blockers for this plan

- **The live-ops config validator silently ignores `tournaments` and `challenges`.** This is fixed in L3.
- **Production store.** `ECONOMY_STORE=mongo` must be confirmed (see design choice 4).
- **Browser smoke is not green** on the baseline (see the board-variety plan). Event UI cannot be verified end to end until that is fixed.
- **No player evidence.** Event rewards and difficulty are unvalidated until the first-play study and an event review have run.

## Owner questions

1. Which second event type? (A, B or C above; recommended A.)
2. What is the per-event coin ceiling?
3. Keep deals out of v1? (recommended yes)
4. Is production running with `ECONOMY_STORE=mongo`?
