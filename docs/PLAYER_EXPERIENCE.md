# Player experience: mobile-first web

**Direction chosen by the owner:** best player experience first, on the existing Phaser web client. This is a path toward a competitive match game, **not evidence or a guarantee of industry leadership**. Feature count, purchases and retention alone do not measure whether a puzzle is enjoyable.

## Delivered foundation

The playable root web client now uses lightweight native HTML controls around its existing deterministic Phaser board. “Native” here means browser controls, not an iOS/Android build.

- **Board-first layout:** safe-area padding, dynamic viewport height, portrait/landscape layouts, camera fitting, and responsive HUD/dialogs. Only the puzzle is rendered on canvas; text and buttons are no longer shrunk with an entire 800×600 screen. Explore contains secondary systems instead of crowding the puzzle.
- **Touch, mouse and keyboard:** tap two adjacent gems or swipe one cardinal neighbour. Arrows navigate; Enter/Space select; H gives a hint; Escape clears selection/armed power-ups. Native dialogs support focus containment and explicit close actions; Escape invokes a dialog's existing Back/Close action where available.
- **Readable gems:** each of the six colors has a distinct shape and letter (heart/R, diamond/B, square/G, triangle/Y, hexagon/P, star/O). No remote art, font or tracker is required for these textures. Color alone is not required to distinguish gem types.
- **Free hints:** a legal swap with a large immediate match, selected from the shared rules. Hints do not change the board/RNG or spend moves/inventory; they cancel armed boosters to avoid accidentally spending one while following a hint. Hints are not an optimal strategy or a promise of a win.
- **Feedback and preferences:** goal progress, match/cascade and invalid-swap messages, visible pause state, high contrast, larger HUD text, reduced motion, and opt-in vibration where supported. Preferences persist locally. System reduced-motion settings are respected even if the game toggle is off. Ordinary controls have a 44×44 CSS-pixel minimum. Browser zoom is no longer disabled globally.
- **Safer interaction:** pointer identity, cancelled-gesture and board-epoch checks; guards while paused, starting, modal, inventory-pending or visually settling. Secondary navigation preserves a player-initiated pause. Async shop/kingdom/decor views reject stale responses instead of writing into a different modal or reopening one the player closed.
- **Temporary service failures:** guest 408/429/5xx responses use certified offline play and show an offline label; paid attempts still require server approval. A refused start can return to the title. Production rate limits are unchanged.
- **Honest startup:** remove the random loading-progress timer and artificial post-load wait; readiness comes from the actual Phaser scene. Saved preferences are available at the title as well as during play.

The shared generator, score/cascade/refill rules, weather/time variants, paid-attempt targets, inventory prices and rewards are not redesigned in this pass. No new location permission prompt is introduced. Legacy shells without the player-UI script retain the canvas-only path.

## Known gaps — do not overstate this release

- Boosters are still **inventory items**, not specials earned by making four/five-gem matches; there are no earned-special combinations. Most generated objectives are still score goals. Sound remains a placeholder, and cascade presentation is basic, not a fully staged animation system.
- A certified winning witness proves one feasible no-booster path, **not** fun, intuitive difficulty, good hint quality or a human win within a timed limit. Submitted scores are not server-replay verified.
- Canvas keyboard navigation plus announcements is an accessibility improvement, **not** a complete semantic screen-reader grid or an accessibility conformance claim. A dedicated cell representation and assistive-technology testing remain necessary.
- Gem-cell pitch can be below 44px on small/short screens (about 38px on the tested 320px portrait layout). The ordinary-button minimum must not be presented as a guarantee for every gem. Large text and browser zoom need further real-device/reflow validation.
- Automated browser runs use Chromium viewport/touch emulation. They are not real iPhone/Safari/Android-device tests, performance benchmarks, human playtests, full payment/account E2E, or a production-stack certification. Real external forecasts remain unavailable in this sandbox; generation uses the documented provider-off fallback here.
- All future mechanics must preserve **100% passive level generation**. Design the rules and automatic quality checks, not a library of manually authored daily puzzles.

## Prioritized roadmap

These are implementation priorities and **proposed acceptance gates**, not measurements already achieved or calendar promises. Keep each increment small and playable before expanding scope.

| Priority | Work | Why / completion gate |
| --- | --- | --- |
| **P0 — validate this foundation** | Physical phone/tablet testing, Safari/Firefox coverage, fast-tap/multitouch interruptions, timed pause/background/reconnect behavior, text/zoom/focus audits, error recovery, staged match feedback and real sound with mute controls | No blocking input/layout/lost-state defects in the device matrix; deterministic parity with motion on/off; no automatic sound or vibration surprise; meet the performance and usability gates below. |
| **P1 — satisfying strategic depth** | Earned specials from long/L/T matches, predictable activation, and a small set of special combinations; clear previews/feedback | Implement rules once in the shared simulation; version the generator and pin old paid attempts; certify every new procedural board with the new rules. At least 80% of test players can predict the basic effects after a short introduction. Earned specials must not require buying inventory. |
| **P1 — varied, legible objectives** | Procedurally composed collection/obstacle objectives, gradual mechanic introduction, optional contextual guidance, more informative retry/win summaries | Shared objective validation and solver support, no authored level dependency; at least 90% of new players can explain the current goal after 20 seconds; failures identify what remained rather than pushing a purchase. |
| **P2 — prove quality at scale** | Seed-cohort playtests, automatic difficulty/variety diagnostics, reliable save/reconnect, score replay validation, consent-respecting quality telemetry | Report player-experience metrics with sample sizes and device breakdowns; no stale/duplicate rewards; rankings are replay-verified before claiming competitive fairness. Runtime safeguards remain useful without telemetry consent. |
| **P3 — polish progression** | Cohesive original art/audio, calm progression and optional social features, localization and assistive grid improvements | Compare against the prior build with representative players; release only if readability, perceived fairness and enjoyment improve without slower first play or disruptive popups. Do not copy another game's branding/assets. |

### Measurable release gates

Record the device/browser, build, seed/context, network profile and sample size for every result. Store performance traces/playtest notes separately from player identities; avoid exact location, touch-coordinate tracking or advertising identifiers.

| Area | Proposed gate | How to validate |
| --- | --- | --- |
| First playable | p75 ≤3s to usable title and ≤2s from Play to interactable board on the agreed mid-range phone/4G profile | Cold-cache browser performance traces plus server timings; measure real readiness, not an animated loading bar. Report offline/cache-hit separately. |
| Input feel | p95 input-to-first-visible-feedback ≤75ms; p95 animation frame time ≤20ms during representative swaps | Physical Android/iOS traces or high-speed recording. Synthetic headless runs are not evidence for this gate. |
| Stability | Zero blockers in scripted/device QA; ≥99.5% crash-free sessions during a consented beta with ≥1,000 sessions | Exercise resize, cancelled fingers, fast taps, backgrounding, reconnect, pending transactions, and new-stage boundaries. Publish denominators and confidence/coverage limits. |
| Learning | ≥90% of ≥20 first-time mobile players make a valid move unassisted within 30s; ≥90% correctly describe the goal | Observed first-play study, no coach/hint before the task; include different ages/vision/input needs. |
| Enjoyment and fairness | Median enjoyment ≥4/5; ≥80% rate losses as understandable/fair in a ≥30-player pilot | Ask after a complete short session and a loss; inspect qualitative complaints and device/seed cohorts, not only an aggregate number. These are internal gates, not market rankings. |
| Procedural quality | Every served definition has no opening matches, a legal opening, and replayable no-booster feasibility; no duplicate variant ID for different rules | Existing certification plus cross-client replay tests and a broad seed/calendar/weather/time-zone corpus. Add objective/special-aware certification before new mechanics ship. |
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

If a constrained CI container requires it, set `BROWSER_NO_SANDBOX=1`; this flag is for trusted test containers, not a recommendation to disable sandboxing on a normal workstation. `BROWSER_SINGLE_PROCESS=1` supports constrained bundled Chromium. `BROWSER_QA_OUTPUT` overrides `var/browser-player-qa` (already Git-ignored). Do not run this smoke against a personal authenticated session; it intentionally creates fresh guest contexts and does not submit payments.

### Verification snapshot — 2026-10-10

- **31 Jest suites / 638 tests pass**, including pure UI helpers, real Phaser-method replay, free-hint/motion parity, pending-input, pointer/epoch/cancel and stale-overlay regressions.
- **Actual Chromium 153 smoke** covers 390×844, 320×568, 360×640, 375×667, 844×390, 768×1024 and 1440×900. All seven pass layout/ordinary-target, free-hint, tap/click, keyboard, invalid-swap, pause, preferences and secondary-navigation checks with **zero page JavaScript errors**. Mobile cases use actual synthesized touch taps/swipes, not just direct calls to `trySwap`; every valid move is checked against the shared board/score/RNG simulator.
- The phone case additionally checks account-dialog focus, active-board preservation during rotation and preference persistence after reload. This tests opening/closing sign-in, **not a real account authentication transaction**.
- Machine-local screenshots/results are produced in `var/browser-player-qa`; they are QA artifacts, not product assets or a claim of real-device/performance validation.

See [PROCEDURAL_LEVELS.md](PROCEDURAL_LEVELS.md) for generation/provider/economy limits and [OPENSOURCE_MIGRATION.md](../OPENSOURCE_MIGRATION.md) for the FOSS architecture. Existing dependency audit warnings and the deferred workflow modernization remain separate concerns; this experience pass does not resolve them.
