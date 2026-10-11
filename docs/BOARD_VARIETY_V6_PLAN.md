# Board variety, rules v6: plan and acceptance gates

**Status (2026-10-11): M1 to M3 done, not shipped.** M1 is the pure rules module. M2 adds generator v6 behind the version gate, the `clear-blockers` objective, and `fixtures/golden/rules-v6.json`. `rules-v5.json` and the v2–v4 tests are unchanged. M3 makes replay carry blockers between moves, requires `blockersCleared` for v6, rejects a pinned v6 definition with an invalid blocker grid or objective, and lets v6 attempts reach observation telemetry. `GENERATOR_VERSION` stays 5, and `clientRulesVersion` still rejects 6, so no player receives a v6 level. M4 and M5 are not started.

## Why this is a plan first

A new obstacle family changes the rules engine that paid levels depend on. The v5 shield took about fifteen files, and each one has to agree with the others. Changing rules without a versioned path would alter level results that players have already paid for. So the work is staged, and each stage has its own gate.

## What v5 touches (the template v6 must follow)

| Layer | Files | What changes for a new family |
| --- | --- | --- |
| Rules | `src/services/levels/shield-rules.js`, `special-rules.js`, `match-core.js` | A new terrain module, plus the transition hook that runs after each move |
| Generation | `generator.js` (`GENERATOR_VERSION = 5`, version lists `[2,3,4,5]`), `level-service.js` (`validate`) | Add v6 to both version lists; gate every new step with `version >= 6` |
| Objectives | `objective-rules.js` (`objectiveStatus`, `addObjectiveProgress`, `validObjectiveProgress`) | Any new progress counter must be validated like `shieldsCleared` |
| Replay | `attempt-replay.js`, `attempt-observations.js`, `inventory-replay.js` | Replay must rebuild the new terrain from the pinned definition |
| Golden vectors | `golden-vectors.js`, `fixtures/golden/rules-v5.json` | Add `rules-v6.json`; **leave `rules-v5.json` byte-identical** |
| Browser bundle | `scripts/build-level-client.js` → `public/js/procedural-levels.js` (generated) | Regenerate with `npm run build`; never hand-edit |
| Rendering and UX | `phaser3-game.js`, `public/js/match-feedback.js`, `public/js/assistive-board.js`, `public/js/player-experience.js` | Draw the terrain, announce its changes, name its cells for assistive tech |
| Hints | `objective-rules.js` free hints | Hints must respect the new terrain |
| Tests | `src/__tests__/*` (13 files mention shields), `server/test/bot.mjs`, `scripts/player-browser-smoke.mjs` | Parity tests, certification tests, and a browser case |

Rule for the whole bundle: `npm run check:sync` must pass after each stage, and `canonical-sync.test.ts` must keep every committed v2–v5 golden hash unchanged.

## Design choice: a spreading obstacle (recommended)

I considered three first families:

| Option | Mechanic | Why not first (or why first) |
| --- | --- | --- |
| **Spreading blocker (recommended)** | A cell with a blocker grows into one adjacent ordinary gem cell after each move, unless it is cleared. Spread is deterministic: the lowest-index eligible neighbour, with no new RNG draws. | Distinct from the shield. It creates time pressure, which both leaders use. Deterministic spread keeps the witness and replay exact. |
| Locked gem | A gem under a lock cannot be swapped until an adjacent match frees it. | Blocks swaps, which touches the hint and swap-validity paths in every layer. Higher risk. |
| Moving obstacle | A cell that moves one step each turn. | Movement needs collision rules with gravity and refill. Largest change to the engine. |

The one-hit fallback that already exists in `witnessedShields` is not a new family. It is still the same fixed overlay, so it does not count toward variety.

### Spread rule (to confirm before stage M1)

- Spread happens after each **player move**, not on each cascade step, so a cascade cannot chain growth in one move.
- A blocker spreads into at most one neighbour per move, chosen by the lowest `row,col` key. Ties are impossible, so no RNG is consumed.
- Spread never enters a special-anchor cell, a shield cell, or a cell that is already a blocker.
- A cap of **6 blockers** on any board stops runaway growth. Above the cap, spread stops.
- Clearing a blocker removes it. A blocker's gem is not counted as collected.

## Objective for the family

The v5 shield uses a `clear-shields` objective. v6 adds `clear-blockers` as a second, separate objective, and the generator may use either or both. Its progress counter is `blockersCleared`, validated exactly like `shieldsCleared`. The delivery objective is **out of scope for this bundle**; it needs its own design.

## Milestones and acceptance gates

**M1 — pure rules module.** New `src/services/levels/blocker-rules.js` with the spread rule, clear, and cap, plus unit tests for each rule and the tie-break. No generator change. *Gate:* all tests pass; `rules-v5.json` unchanged.

**M2 — generator v6, behind the version gate.** Add `6` to the version lists. Place blockers only on cells the no-booster witness actually clears, as the shield does. Certify the board with the exact v6 transition. *Gates:* `npm run vectors:build` produces `rules-v6.json`; a v6 definition certifies on 200 seeds from the witness; `rules-v2` … `rules-v5` are byte-identical; `npm run check:sync` passes.

**M3 — replay and paid-definition safety.** Replay rebuilds blockers from the pinned definition. A v5 paid definition still replays under v5 rules. *Gates:* replay tests for a v6 win and a v5 win; a tampered blocker count is rejected.

**M4 — client.** Phaser draws blockers; `match-feedback.js` announces spread and clears; `assistive-board.js` names blocker cells; hints avoid stalling on blockers. Rebuild the bundle. *Gates:* unit tests for named cells and feedback; the browser smoke gains a blocker case.

**M5 — ship behind a flag.** Only v6 definitions for new classic levels use blockers. Daily and endless stay on v5 until a playtest. *Gates:* the first-play study (see [WEB_FIRST_PLAY_STUDY.md](WEB_FIRST_PLAY_STUDY.md)) is run before any default change.

## Decisions taken (owner, 2026-10-11)

- **First family:** spreading blocker. **Spread:** once per accepted player move, lowest `row,col` eligible orthogonal neighbour, cap 6 blockers total. Delivery objective deferred.
- **Match model: overlay, not locked.** The owner first chose "locked, shield-like". A locked gem needs gravity and refill to treat the cell as fixed, which changes the shared match path. The owner then chose the overlay: the gem stays normal, and a match that clears the blocker's cell removes the blocker. This is weaker than a lock, and the lock is a possible later bundle.
- **Booster clears** remove a blocker they hit but do not spread. The plan only names player moves for spread.
- **Stages:** blockers are placed on witness-cleared cells, up to 3, and never share a level with shields, so each v6 definition adds exactly one objective. Stage: level >= 3 with level % 4 === 2, or the daily hash stage.
- **Replay and client:** M2 threads blockers through the v6 objective path. M3 adds replay carry-over, tamper rejection, and a regression test that fails if carry-over is removed. M4 owns rendering, feedback, and assistive names.
- **Replay cut point:** the server rejects any move after the objectives complete, so a witness is cut at its first winning move, as the browser does.

## Known blockers for this plan

- **Browser smoke is not green on the baseline.** `scripts/player-browser-smoke.mjs` fails at the kingdom step on both the PWA build and the pre-PWA build, because it expects a Decor button in guest mode. Fix the test's guest expectation before M4 relies on it.
- **No real-device evidence.** Automated parity does not show that blockers are readable or fair on a phone.
- **`.vercelignore` fix is unverified** on a real Vercel build (see the platform check).

## Open questions for the owner

1. Confirm the spreading blocker as the first family (or pick the locked gem instead).
2. Confirm the cap of 6 blockers and the once-per-move spread.
3. Confirm whether the delivery objective is in scope for this bundle, or a later one.

## What this plan does not do

It does not change any rule, golden fixture, generated bundle, or paid definition. Live ops and social are separate bundles, with their own plans, and they are not started.
