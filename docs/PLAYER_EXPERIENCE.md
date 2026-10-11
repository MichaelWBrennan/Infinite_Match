# Player experience: mobile-first web

**Direction chosen by the owner:** best player experience first, on the existing Phaser web client. This is a path toward a competitive match game, **not evidence or a guarantee of industry leadership**. Feature count, purchases and retention alone do not measure whether a puzzle is enjoyable.

## Delivered foundation

The playable root web client now uses lightweight native HTML controls around its existing deterministic Phaser board. “Native” here means browser controls, not an iOS/Android build.

- **Board-first layout:** safe-area padding, dynamic viewport height, portrait/landscape layouts, camera fitting, and responsive HUD/dialogs. Only the puzzle is rendered on canvas; text and buttons are no longer shrunk with an entire 800×600 screen. Explore contains secondary systems instead of crowding the puzzle.
- **Touch, mouse and keyboard:** tap two adjacent gems or swipe one cardinal neighbour. Arrows navigate; Space selects for swaps, Enter selects an ordinary gem or activates a special; H gives a hint; M toggles optional sound (even while paused); Escape clears selection/armed power-ups. Native dialogs support focus containment and explicit close actions; Escape invokes a dialog's existing Back/Close action where available.
- **Readable gems:** each of the six colors has a distinct shape and letter (heart/R, diamond/B, square/G, triangle/Y, hexagon/P, star/O). No remote art, font or tracker is required for these textures. Color alone is not required to distinguish gem types.
- **Free hints:** a legal swap or earned-special tap with a large estimated immediate effect, selected from the shared rules. Hints do not change the board/RNG or spend moves/inventory; they cancel armed boosters to avoid accidentally spending one while following a hint. Hints are not an optimal strategy or a promise of a win.
- **Feedback and preferences:** goal progress, match/cascade and invalid-swap messages, visible pause state, high contrast, larger HUD text, reduced motion, opt-in local sound with volume/mute controls, and opt-in vibration where supported. Preferences persist locally. System reduced-motion settings are respected even if the game toggle is off. Ordinary controls have a 44×44 CSS-pixel minimum. Browser zoom is no longer disabled globally.
- **Safer interaction:** pointer identity, cancelled-gesture and board-epoch checks; guards while paused, starting, modal, inventory-pending or visually settling. Secondary navigation preserves a player-initiated pause. Async shop/kingdom/decor views reject stale responses instead of writing into a different modal or reopening one the player closed.
- **Temporary service failures:** guest 408/429/5xx responses use certified offline play and show an offline label; paid attempts still require server approval. A refused start can return to the title. Production rate limits are unchanged.
- **Honest startup:** remove the random loading-progress timer and artificial post-load wait; readiness comes from the actual Phaser scene. Saved preferences are available at the title as well as during play.

The initial foundation did not redesign match rules or the economy. The earned-special and objective increments below version the shared rules; weather/time behavior, energy costs, inventory prices and rewards remain unchanged. No new permission prompt or dependency is introduced. Legacy shells without the player-UI/generator scripts retain the canvas-only path.

## Delivered next increment — earned special gems (rules v3)

- **Earn, do not buy:** four in a row/column creates a Row/Column Beam; L/T or intersecting matches create a 3×3 Burst; five or more in a line create a Prism. Each connected match group earns at most one, with Prism > Burst > Beam precedence. The swapped destination is the preferred anchor; newly created anchors survive that wave. Cascades can earn and later activate specials.
- **Predictable use:** tap or Enter activates a special; swipe it with a neighbour to activate in the new cell. A Prism taps its own color or swaps to clear its neighbour's color. Space selects a special without activating it so keyboard players can combine it. Each successful activation/combination spends **one ordinary move and no inventory**; invalid actions cost nothing. Timed/endless remain without a practical move limit.
- **Six combination families:** Beam + Beam cross; Beam + Burst three rows and columns; Burst + Burst 5×5; Prism + Row/Column Beam or Burst converts ordinary gems of the partner color and fires them, including the partner; Prism + Prism whole board. Effects clip at board edges, chain old specials once per wave, and resolve/refill deterministically.
- **Clear identities:** retain each gem's color, shape and letter, with a separate high-contrast **vector-drawn** horizontal-arrow, vertical-arrow, burst-cross or prism-star badge. No Unicode glyph/remote font is required for badge rendering. Keyboard announcements name specials. Explore → Special gem guide displays the actual icons and rules; it pauses/resumes without surprise. Staged feedback now shows actual clears and protected earning anchors (see below); haptic feedback remains independently opt-in.
- **One rules implementation:** `special-rules.js` drives certification, free hints, browser moves and inventory-clearing chains. Origins track surviving pieces for sprite reuse; tests check unique sprites, texture/data/positions, special state, RNG and scores. Inventory boosters remain separate, retain server-confirmed spending/base awards and do not consume an ordinary move.
- **Safe upgrade:** that increment introduced `rulesVersion: 3` (subsequent objective clients advertised 4; the current shield client advertises 5); untagged procedural API clients receive frozen v2 definitions. Explicit v2 stays available; unsupported versions are rejected before energy spend. Existing paid definitions keep their target/rules, and old endless runs retain v2 at new stage boundaries. The original one-pending-attempt replacement policy is unchanged.
- **Still 100% passive:** all production boards are generated and certified on demand, with no authored levels, paid boosters required, AI calls, art downloads or new services. Synthetic boards in automated tests are effect/input fixtures only, not a production level bank.

This is implemented and automatically tested; the human learning/enjoyment and physical-device gates below are **not yet achieved**.


## Delivered Endless in-app checkpoint option (web)

Generated Endless stages already advance automatically without a clock or
level bank. A **new, off-by-default local preference** can bank a signed-in
run after a completed stage at 100,000 points or roughly 2h45m, ahead of the
server's three-hour attempt expiry. Only a confirmed bank starts the next
server-issued stage-one attempt, charging its existing **one energy**. No
energy is bought or refilled automatically. A denied, expired or uncertain
bank never triggers a second charge; the in-game text explains the three-hour
claim window and the current 300-coin/500-XP per-run caps. Guests continue
without a paid attempt; manual Bank Run remains available. The next run can
be refused if energy/network access is unavailable, and a long unfinished
stage can still cross the three-hour payout deadline. This is not a literal
promise of infinite saved state or unlimited rewards.

**Business/player ROI is unmeasured.** Measure voluntary continued play,
completion/banking success, drop-off, return, support/refund reports and net
contribution per consenting cohort before changing monetization. Endless
banking still accepts a bounded client-reported score and is unranked; server
replay is required before consequential rewards. Endless settlement now uses a
single economy-document write under the in-process player lock for the attempt,
XP (including level-up coin/star/inventory rewards), coins, stats and a bounded
receipt. A lost response is retried once with the **same** attempt ID and score;
a duplicate returns the original payout, while a changed score is rejected and
no additional energy is spent until a bank is confirmed. The last 32 receipts
are kept; older retries are rejected, never repaid. A second uncertain response
still stops auto-continuation. Endless XP now uses the same 1.2 threshold
progression as ordinary rewards; a parity test covers the level, leftover XP,
coins, stars and inventory.

In Mongo mode, every economy save now compares the document revision and only
initialization may insert a missing document. A stale worker fails and drops
its cached copy rather than erasing a newer receipt or balance. An Endless
claim additionally checks the pending ID and can re-evaluate on a fresh revision;
other conflicting operations are **not** silently retried (some are not safely
idempotent). In-process currency, inventory, progression and daily calls share
a re-entrant per-player lock with existing reward flows. The revision guard is
not a distributed transaction: paid classic/daily and Endless wins now settle
in one write with bounded retry receipts; the daily claim (including season XP),
wheel prize, level-up XP/rewards and catalog purchase also each save together.
Other flows such as provider-ledger grants and refunds still span stores, some
route-level mutations remain outside a player lock, and reads may be briefly stale. The stand-in
store tests exercise stale workers and legacy revision migration; no live Mongo
concurrency/integration test has been run. Keep single-writer deployment and
low-stakes rewards until the remaining multi-store flows and production fault
injection are addressed. A replay-verified social win retries idempotently with
its original competition IDs if a social-file write failed, but no background
outbox or distributed social store is available. A client-reported classic or
daily result without a transcript can still earn bounded account rewards and
inflate personal stats; these results remain unranked.
Do not convert the opt-in into a surprise energy spend or a pressure loop.

## Delivered kingdom scene increment — Royal Library (web)

Explore → Kingdom now lets players switch between two original authored rooms:
**Throne Hall** (Hall of Echoes) and **Royal Library** (Library of Lanterns).
The library has its own book-lined SVG setting, unlit/repaired states, short skippable
story and three room-specific first-look previews. Each room reads its own server
level, star/coin gate, décor, inventory availability and prices. Guest previews
remain read-only, and the broader six-room décor screen remains available.
The room buttons are labeled native controls; focus returns to the chosen room
button after a load, or the chosen décor after a purchase. Tab changes reuse the
last server snapshot; repair/choice responses refresh it. Requests and old button
callbacks are room-bound so rapid switching cannot buy or repair the other room.
This is not a new economy or puzzle rules version. Four rooms remain numeric;
real-device visuals, keyboard/screen-reader behavior and human discovery/interest
are still unvalidated.

## Delivered kingdom scene expansion — all six rooms (web)

The four remaining server-owned rooms now have their own original illustrated
before/after scenes and optional short story beats: the Royal Garden, Armory,
Gatehouse and Chapel. Alongside the Hall and Library, all six native room buttons
share the same server-priced repair/stock rules and read-only guest previews.
Tab changes reuse the latest kingdom snapshot; old room callbacks cannot spend
in the currently selected room. A responsive two- or three-column room selector
remains scrollable in the existing native dialog. This completes a visible first
look for every existing room, **not** an explorable world or chapter campaign.
Physical-device, screen-reader and first-session comprehension testing remain open.

## Delivered first obstacle slice — fixed shields (rules v5)

The shared engine now has numbered fixed shield terrain. A clear over a shield
removes one layer without blocking normal gem scoring, color collection, gravity
or refills. Some numbered/daily levels require clearing every shield, optionally
alongside score. Generation places shields only where a no-booster witness clears
them twice; hints, server-pinned progress checks and the browser use the shared
v5 rules. The board has original numbered shield textures, and native goals and
named cells expose remaining hits. Old v2/v3/v4 definitions stay frozen.
V5 shield boards now use bounded read/fade/fall staging with fixed numbered terrain
frames: each hit changes the number in place, never on a falling gem. The same
read-only three-wave trace is used for inventory clears and ordinary actions;
read-only stage labels and one live announcement identify shield damage. Reduced
motion, text-board preference, background/pause or failed presentation falls back
to the already-committed board. No scoring, replay, reward or paid-definition rule
changed. Automated rule/Phaser parity and paid-validation tests pass;
physical devices, assistive-tech users and human fairness testing remain open.
The Chromium smoke script includes a shield-board touch/texture/goal check, but
has **not been rerun for this increment** in this sandbox (no Chrome/Chromium executable installed).
The older verification snapshot below predates the shield increment.
See [the rules and limits](PROCEDURAL_LEVELS.md#fixed-shield-tiles--shared-rules-v5).

## Delivered objective increment — passive collection goals (rules v4)

- **Variety without authored levels:** score, single-color collection, two-color collection and mixed objectives are automatically composed against a replayed no-inventory witness. Gradual numbered onboarding and seeded daily profiles use rules, not a manually published level bank. Every goal is certified by the same shared transitions as the game.
- **Clear progress:** gem icons preserve color, shape and letter; named current/target counters and a multi-goal meter stay above/beside the puzzle. Remaining-goal summaries explain wins/losses. Explore → Level goal guide gives counting rules, extra-star thresholds and active local-variant details. Short-screen context/status text is bounded so feedback does not take over the board; landscape status text no longer overlays puzzle cells.
- **Consistent collection:** count actual clears from matches, cascades, earned specials and optional inventory effects. Do not count protected creation anchors, newly spawned gems, conversion without clearing, free repairs or inventory score awards. Counters persist across actions and reset on replay/new attempts or completed endless stages.
- **Fair declared conditions:** every visible goal is required. Collection-only completion earns at least one star without a hidden score condition; score can earn extra stars using the pinned rating baseline. Mixed/pair goals cannot be bypassed with a huge score. Goal-aware free hints favor useful immediate progress without changing model/RNG/counters or spending a move/charge.
- **Funded compatibility:** that increment advertised v4; the current client advertises v5; explicit v2/v3 and untagged HTTP v2 retain their exact definitions/score goals. Server completion checks only the pinned goals and bounded reported counters under the player lock, before consumption. Invalid/incomplete claims retain the attempt; simultaneous valid claims award once. Client-authored goals/stars are ignored; one-pending-attempt replacement, energy/inventory costs, reward table and partial-stage endless banking remain unchanged.
- **Limits remain honest:** reported counters are not server replay anti-cheat. Automated solvability is not evidence that players understand/enjoy these goals or finish timed levels. Human and physical-device gates remain open.

## Delivered presentation increment — original optional sound

- **Explicit choice, silent defaults:** the old `sfx: true` placeholder is not consent. Only a literal opt-in saved with `soundChoiceVersion: 1` enables effects. No AudioContext is created at initial load, including with a saved choice; trusted player input is required. Phaser's own eager audio manager is disabled so this controller is the sole context owner. Music is not implemented; the legacy music toggle is disabled and honestly labelled.
- **Local original cues:** sixteen short oscillator/envelope cues cover selection, invalid swaps, settled matches/cascades, earned gems, Beam/Burst/Prism, combinations, free hints, inventory clears, stage starts, banking, wins/losses and a volume test. Select one semantic cue per settled action rather than a sound per cleared gem; completion cues can replace unfinished action feedback. No audio downloads, copied assets, network service or new dependency is involved.
- **Accessible controls:** title → Play preferences and in-game Preferences provide a native checkbox, labelled range and Test sound button with a status message. Explore provides a quick mute; **M** toggles sound when the board is focused, including during a player pause, without resuming the puzzle. Key repeats and Ctrl/Alt/Meta combinations do not toggle it again. Sound and vibration are independent local preferences. Sound is supplemental; text, icons, goals and the silent game remain intact.
- **Bounded lifecycle:** at most eight oscillator voices, throttled cue scheduling, low master gain and short fade envelopes. Mute/zero volume stops active voices; pause, hidden tabs and pagehide cancel them. Returning to the page does not autoplay; the next trusted gesture may unlock the reused context. Teardown releases nodes/listeners and closes it. Dropped cues are never queued for later, and stale asynchronous resumes cannot undo a mute or cancel a newer trusted unlock. Missing/failing Web Audio remains silent and does not block play.
- **Presentation only:** identical sound-on/off witness replays preserve board, specials, scores, collection counters and refill RNG. Sound preferences, free hints, invalid swaps, preview and mute do not spend moves/inventory or replace paid attempts. Shared v2/v3/v4 rules, energy, rewards and the authoritative economy are unchanged.

Chromium checks validate actual context/oscillator creation, controls, lifecycle, silent fallbacks and sixteen distinct finite nonzero OfflineAudioContext signals. This is **not a listening-quality, loudness/safety, Safari autoplay or physical-device certification**. Player device mute, output routing and browser media policy can still silence opted-in sound; human preference/balance testing remains necessary.

## Delivered access increment — named cells and an optional text board

- **Same puzzle, not another engine:** a bounded semantic grid observes the existing board/specials and exposes one-based row/column indices, base color and non-color shape, full special names, selection, and free-hint endpoints. Native buttons call the same guarded Phaser selection/activation methods. The canvas is hidden from the accessibility tree to avoid a duplicate board; no alternate scoring, generation, refill RNG, reward or inventory-spend implementation exists.
- **Visible, optional text view:** Explore → **Use text board** or title/in-game Play preferences → **Text board (named cells and larger targets)**. The choice persists locally. Cells show letters/shapes and special labels; every named cell retains at least 52×52 CSS pixels with internal horizontal/vertical scrolling on small screens. This trades whole-board visibility for readable targets, rather than shrinking the grid. High contrast and larger HUD text retain their preferences. Keyboard focus reveals the named controls even when the saved text preference is off; it never stays in invisible cells. Pointer play still starts with the original visual board.
- **One entry, no trap:** a roving cell Tab stop, arrow navigation, Home/End for row edges and Control Home/End for board corners. Tab/Shift+Tab leave the grid. Native DOM cell focus survives refills; changed dimensions clamp it to a valid new cell. Secondary dialogs restore the current cell; activating or clearing returns focus from a newly disabled action button to the cell. No `role="application"` or global screen-reader key capture is introduced.
- **Intentional actions:** clicking/double-tap-style zero-detail activation or Space **selects** a cell for a swap, including a special; choose its neighbour to swap/combine. Enter follows the existing select/activate behavior. **Activate special** explicitly fires the focused earned special, never an armed inventory charge. Cells targeted after deliberately arming an inventory booster use the original server-confirmed spend path. Clear selection cancels selection/hints/armed inventory for free; Read board status announces current moves/clock and pinned goal progress through the existing polite status region. H and M retain their free-hint/optional-sound meanings; held action keys do not repeat moves.
- **Guarded and bounded:** pause permits reading/focus navigation but not moves or activation. Modal, starting, inventory-confirmation and settling states block actions and expose readonly/busy/disabled semantics. Pointer identity, movement/cancellation and board-epoch checks reject stale gestures. At most 64 native cells, one settling-refresh timer, no live region over all changing cells, no automatic speech or new permission. Teardown removes listeners/controls and cancels its timer.

**Evidence versus remaining gates:** shared witnesses replay through named inputs for exact frozen v2/v3 and v4 collection/mixed/pair/large levels. Real Chromium accessibility trees expose one named grid with every cell/button; native touch/click/keyboard and simulated zero-detail activation preserve the same board/specials/score/RNG/counters without inventory spend. This is an accessibility implementation foundation, **not evidence that a real screen-reader user can comfortably play the game or a WCAG conformance claim**. VoiceOver, TalkBack, NVDA/JAWS, Safari/Firefox, speech order/verbosity, physical touch exploration, zoom/reflow and human learning remain release gates. The scrollable text-board tradeoff needs real-user validation.

## Staged resolution feedback foundation

- **Observe, never resimulate:** v3/v4 actions optionally capture the initial grid and before/after snapshots of the first three actual waves inside the existing shared resolver. The client renders their real clear coordinates, protected earning anchors, special conversions/activations and supplied refill cells. The visual gravity map only remaps images; it never matches, deals gems or advances RNG. Server/solver calls remain untraced by default; definitions, version IDs, certification, score/collection rules and paid goals are unchanged.
- **Bounded, calm sequence:** show the swap, an actual clear footprint, the earned badge/clear fade, and survivor/refill falling. Local translucent footprints replace the previous first-wave-only effect; no camera shake, screen zoom, particles or repeated whole-screen flash. At most three waves are shown; further real cascades are summarized and the exact final board is revealed. Free repairs are identified as repairs, not counted as clears. Absolute phase deadlines schedule at most **810ms** of feedback, with a separate **1200ms watchdog** for slow/lost callbacks; these are scheduling budgets, not measured physical-device performance guarantees.
- **Free and skippable:** **Finish animation** temporarily replaces Hint (not an extra toolbar row), has a native ≥44px target and supports touch/click/Enter. It finishes visuals without another move or inventory charge. Pause/Explore, a system motion change, focusing a named cell, background/pagehide, a replacement board, scene shutdown and teardown cancel the visual work. Board-epoch and current-run guards make stale callbacks inert. The pool is bounded to 64 non-interactive images, one container, two graphics objects/one mask and two timers; teardown releases them.
- **Immediate alternatives:** game/system reduced motion and saved/focused named-cell views commit/show the final state immediately, without trace allocation or a visual input delay. Focusing the named grid during an effect finishes that picture only; it does not select or activate a gem. One polite final action summary remains available; fast phase labels are deliberately excluded from the accessibility tree. The semantic grid always describes the committed board, not the temporary pictures. Hint/inventory input is guarded while visuals settle. Canvas input bounds are refreshed before hit-testing, including when a changed goal/status row moves the canvas without resizing it.
- **Authority stays immediate:** a successful action commits its model, score, counters and refill state once. Ordinary win/loss finalization, reporting and reward submission happen immediately, just as in instant mode; **only the result screen waits** for completion/Finish. Pausing, hiding or destroying a picture cannot delay an earned submission or replay it. The Timed clock is not paused, extended or restarted by an effect, and an already-won Timed game ends its clock immediately. Endless defers replacing its stage until the picture finishes (or a deliberately paused run resumes), still under the same single attempt. Existing inventory effects keep their original server-acknowledged spending path and base award.

This is presentation work, not a new generator/rules version or another level designer. **Frozen v2/plain boards keep their legacy basic presentation**; unavailable graphics/invalid observations degrade to the already-committed final state. Human learning, preferred pacing and low-end/Safari/Firefox performance still need physical validation.

## Known gaps — do not overstate this release

- Earned specials and combinations are implemented; inventory boosters are a separate optional system. Score/collection objectives and one fixed shield family are implemented; other obstacles are not. Original optional audio is implemented, but physical-device/autoplay/output-policy and human listening-quality validation remain open. Staged v3/v4 feedback is implemented with a three-wave cap; frozen v2 retains basic presentation. Human balance/learning/pacing and physical-device performance studies remain work.
- A certified winning witness proves one feasible no-booster path, **not** fun, intuitive difficulty, good hint quality or a human win within a timed limit. Only booster-free v4/v5 classic/daily submissions with valid ordered transcripts enter competitive boards. Receipt-bound inventory effects can now be server-replayed and paid as `verified` but stay `ranked: false` to avoid pay-to-win boards; timed, endless and old-client wins remain unverified but payable.
- A semantic named-cell grid, roving native controls and text-board view are implemented. They are **not** a complete screen-reader usability or accessibility conformance result. Real assistive-technology testing of navigation, activation, speech order, verbosity and touch exploration remains necessary.
- Gem-cell pitch can be below 44px on small/short screens (about 36px for the tested 320px 8×8 large-text layout; about 38px in the earlier standard-text 8×8 check). The ordinary-button minimum must not be presented as a guarantee for every visual gem. The named text view keeps ≥52px targets by scrolling; this does not enlarge the default canvas grid or prove usable touch exploration. Large text and browser zoom need further real-device/reflow validation.
- Automated browser runs use Chromium viewport/touch emulation. They are not real iPhone/Safari/Android-device tests, performance benchmarks, human playtests, full payment/account E2E, or a production-stack certification. Real external forecasts remain unavailable in this sandbox; generation uses the documented provider-off fallback here.
- All future mechanics must preserve **100% passive level generation**. Design the rules and automatic quality checks, not a library of manually authored daily puzzles.

## Prioritized roadmap

These are implementation priorities and **proposed acceptance gates**, not measurements already achieved or calendar promises. Keep each increment small and playable before expanding scope.

| Priority | Work | Why / completion gate |
| --- | --- | --- |
| **P0 — validate this foundation** | Physical phone/tablet testing, Safari/Firefox coverage, fast-tap/multitouch interruptions, timed pause/background/reconnect behavior, named-grid assistive-technology/text/zoom/focus audits, error recovery, learning/pacing/performance validation of the delivered staged feedback and opt-in sound/mute controls | No blocking input/layout/lost-state defects in the device matrix; deterministic parity with motion on/off; no automatic sound or vibration surprise; meet the performance and usability gates below. |
| **P1 — strategic depth implemented; validate learning** | Earned specials and combinations now use shared v3 rules, accessible controls, icons/guide and feedback | Automated certification, upgrade/economy and client parity checks pass. Still require at least 80% of representative test players to predict the basic effects after a short introduction; that human gate has not been measured. |
| **P1 — collection objectives implemented; validate learning** | Shared v4 score/collection composition, gradual onboarding, goal-aware hints, icon/counter HUD, guide and remaining-goal summaries | Automatic all-goal certification and pinned paid compatibility pass without authored levels. Still require at least 90% of new players to explain the current goal after 20 seconds; this human gate is unmeasured. Other obstacles and human validation remain future work. |
| **P2 — prove quality at scale** | Seed-cohort playtests, automatic difficulty/variety diagnostics, reliable save/reconnect, score replay validation, consent-respecting quality telemetry | Report player-experience metrics with sample sizes and device breakdowns; no stale/duplicate rewards; rankings are replay-verified before claiming competitive fairness. Runtime safeguards remain useful without telemetry consent. |
| **P3 — polish progression** | Cohesive original art/audio, calm progression and optional social features, localization and real assistive-technology validation of the delivered named grid | Compare against the prior build with representative players; release only if readability, perceived fairness and enjoyment improve without slower first play or disruptive popups. Do not copy another game's branding/assets. |

### Measurable release gates

The [offline web first-play/fairness study kit](WEB_FIRST_PLAY_STUDY.md) is ready for an operator to conduct the learning and loss-fairness pilot, but **no real-player result has been collected**. A green local report evaluates submitted records only; it is not proof of observed people or a release decision. The separate [optional signed-in D1/D7 web return study](WEB_RETURN_STUDY.md) is off by default and also has no real cohort evidence yet. An [offline consented session-stability evaluator](WEB_SESSION_STABILITY.md) is also ready but has no real beta sessions and cannot detect crashes by itself. Device, access and crash-free gates remain open.

Record device/browser, build, coarse network profile and sample size for every result. Track seed/context coverage separately using a secret-keyed group or operator-assigned non-reversible label; do not put raw seeds or precise location into study records. Store performance traces/playtest notes separately from player identities; avoid touch-coordinate tracking or advertising identifiers.

| Area | Proposed gate | How to validate |
| --- | --- | --- |
| First playable | p75 ≤3s to usable title and ≤2s from Play to interactable board on the agreed mid-range phone/4G profile | Cold-cache browser performance traces plus server timings; measure real readiness, not an animated loading bar. Report offline/cache-hit separately. |
| Input feel | p95 input-to-first-visible-feedback ≤75ms; p95 animation frame time ≤20ms during representative swaps | Physical Android/iOS traces or high-speed recording. Synthetic headless runs are not evidence for this gate. |
| Stability | Zero blockers in scripted/device QA; ≥99.5% crash-free sessions during a consented beta with ≥1,000 sessions | Exercise resize, cancelled fingers, fast taps, backgrounding, reconnect, pending transactions, and new-stage boundaries. Publish denominators and confidence/coverage limits. |
| Learning | ≥90% of ≥20 first-time mobile players make a valid move unassisted within 30s; ≥90% correctly describe the goal | Observed first-play study, no coach/hint before the task; include different ages/vision/input needs. |
| Enjoyment and fairness | Median enjoyment ≥4/5; ≥80% rate losses as understandable/fair in a ≥30-player pilot | Ask after a complete short session and a loss; inspect qualitative complaints and device/seed cohorts, not only an aggregate number. These are internal gates, not market rankings. |
| Procedural quality | Every served definition has no opening matches, a legal opening, and replayable no-booster feasibility; no duplicate variant ID for different rules | Existing certification plus cross-client replay tests and a broad seed/calendar/weather/time-zone corpus. Shared special/objective-aware certification is in place; extend it before any future obstacle mechanics ship. |
| Access and layout | No clipped puzzle/ordinary controls at supported phone sizes; ordinary targets ≥44px; text/meaning not color-only; no focus traps; motion-off parity | Current browser smoke plus physical devices, keyboard, VoiceOver/TalkBack, 200% text/browser zoom and color-vision checks. Resolve the sub-44px gem tradeoff explicitly; do not claim full WCAG conformance from this smoke. |
| Player trust | No second spend on retries/double taps, frozen active attempts, no surprise navigation or permission prompts; purchases optional | Server economy tests, fault-injected browser flows and configured payment sandbox. Accessibility and hints remain free. |

**Suggested physical matrix:** a small/older Android phone, a current mid-range Android, an iPhone SE-sized phone, a notched iPhone, iPad/tablet and desktop keyboard; current Safari, Chrome, Firefox and Edge. Define the oldest supported OS/browser in the release checklist. External provider and payment tests require their own operator-configured environments.

## Reproduce the checks

```sh
npm ci
npm run build
npm test -- --runInBand
npm run lint
```

Browser smoke uses Apache-2.0 Playwright Core as a development-only dependency. Browser executables are **not vendored into Git**. Use an installed Chrome/Chromium or install a matching test browser outside the repository:

```sh
npx playwright-core install chromium
# Start the normal development/preview server first, on 0.0.0.0.
# BROWSER_QA_URL defaults to http://127.0.0.1:3000/ for local test tooling only.
BROWSER_EXECUTABLE_PATH=/absolute/path/to/chromium npm run test:browser
```

If a constrained CI container requires it, set `BROWSER_NO_SANDBOX=1`; this flag is for trusted test containers, not a recommendation to disable sandboxing on a normal workstation. Prefer the default multiprocess browser where available (used for this final verification); `BROWSER_SINGLE_PROCESS=1` is an optional workaround for constrained bundled Chromium, not required and not a performance baseline. `BROWSER_QA_OUTPUT` overrides `var/browser-player-qa` (already Git-ignored). Do not run this smoke against a personal authenticated session; it intentionally creates fresh guest contexts and does not submit payments.

### Verification snapshot — 2026-10-10

- **36 Jest suites / 894 tests pass**, including earning/activation/all combination families, chains/edge clipping/protected anchors, bounded cascades, exact frozen-v2/v3 fixtures, all-goal witness/browser parity, cascade/special/inventory clear counts, bounded progress validation, pinned paid collection/mixed/pair completion, counter reset and extra-star rules, pre-spend version negotiation, pure UI helpers, real Phaser-method replay, free-hint/motion parity, pending-input, pointer/epoch/cancel and stale-overlay regressions, audio-consent migration, trusted-gesture/resource/lifecycle/error handling, stale-resume cancellation, sound-on/off rule parity, semantic names/navigation/action guards, named-input witness parity across v2/v3/v4, server-confirmed targeting and assistive presentation teardown. The 49 new feedback cases cover opt-in/default trace parity (including browser bundles, v3/v4 combinations, frozen v2, generated witnesses and 64-wave repairs), real intermediate colors/anchors/falling, instant alternatives, current-run/epoch/lifecycle cleanup, image/timer budgets, absolute deadlines, lost-timer/error fallback, immediate result submission through pause/teardown, Timed deadline parity and single-attempt Endless advancement.
- **Actual Chromium 153 smoke** covers 390×844, 320×568, 360×640, 375×667, 844×390, 768×1024 and 1440×900. All seven pass layout/ordinary-target, free-hint, tap/click, keyboard, invalid-swap, pause, preferences, secondary-navigation, earned-special creation/tap, touch/mouse swipe combinations, keyboard combinations/activation, special/goal guides, real collection progress, mixed/pair guards, collection-only wins below the score baseline, actual Replay counter resets and generated 8×8 two-color large-text checks with **zero page JavaScript errors**. Mobile cases use actual synthesized touch taps/swipes, not just direct calls to `trySwap`; every valid action is checked against the shared board/specials/score/RNG/collection-progress simulator and unique sprite textures/data/positions. Rendered board corners, unclipped goal chips and absence of status-message overlap are checked before and after input/rotation. Canvas-pixel checks verify that all badges remain visible without Unicode fonts.
- All seven additionally check **real Phaser intermediate textures/coordinates** against the shared snapshots, protected earning badges, non-interactive temporary images/hidden authoritative sprites, the three-wave cap and real fourth-wave summary, final board restoration, native Finish (touch or desktop Enter) and focus recovery, blocked extra moves/activation/hints/inventory, immediate game/system motion-off and text views, and pause/overlay/motion/named-focus/new-board cancellation. First touch inputs are checked after a changed goal/status row moves the canvas; cached input bounds must align before hit-testing. Background/pagehide are synthetic handler checks, not a physical OS lifecycle test. The final **multiprocess Chromium run passes all seven with zero page errors**, full three-frame natural-cascade playback in each viewport and no inventory spend. Watchdog fallbacks are also exercised in deterministic tests and permitted (with faithful prefix/final restoration checks) in constrained software-rendered browsers; these are not phone performance measurements.
- All seven cases additionally check real AudioContext/oscillator creation only after opt-in/trusted input, volume/Test, semantic combination sound, paused M, muted node budgets, context reuse and synthetic pagehide/pageshow cancellation without gameplay drift. The phone case renders all sixteen cues offline and checks finite nonzero/distinct waveforms, bounded peaks and sub-0.4-second tails; this is not a human listening or loudness-safety test. Separate fresh phone processes verify legacy-placeholder migration, unavailable APIs and title-preferences Escape/Play recovery.
- All seven additionally inspect **Chromium's actual accessibility tree** (one named grid, indexed rows/cells and named native buttons), roving focus/Tab exit, Home/End/corner navigation, native selection/activation/combination, zero-detail simulated assistive activation, free hint/status/clear, paused/modal guard parity, pointer identity/cancellation/drag/epoch protection, focus recovery after activation/clear/dialogs, 8×8→6×6 focus clamping, internal scrolling and ≥52px text-cell targets. This does not run a physical screen reader. The phone also checks saved text-board choice through a real reload and actual semantic-control teardown.
- The phone case additionally checks account-dialog focus, active-board preservation during rotation and preference/explicit audio consent persistence after reload. This tests opening/closing sign-in, **not a real account authentication transaction**.
- Machine-local screenshots/results (including `sound-render-metrics.json` and `phone-sound-preferences.png`, `assistive-ax-summary.json` and `*-text-board.png`) are produced in `var/browser-player-qa`; they are QA artifacts, not product assets or a claim of real-device/performance validation.

See [PROCEDURAL_LEVELS.md](PROCEDURAL_LEVELS.md) for generation/provider/economy limits and [OPENSOURCE_MIGRATION.md](../OPENSOURCE_MIGRATION.md) for the FOSS architecture. Existing dependency audit warnings and the deferred workflow modernization remain separate concerns; this experience pass does not resolve them.
