# Infinite Match: competitive feature ranking, audit and product strategy

**Snapshot: 2026-10-11.** This is the single competitive document for the repository. It merges the October 10 feature audit with the October 11 refresh, which has been folded in here and removed. It is a decision document, not a claim that Infinite Match leads its genre. Scope is *swap-based match-3 and adjacent puzzle competitors*. Competitor facts come from public store listings, wikis and third-party trackers, not hands-on playtests. Trackers disagree on basic figures, and features change often, so recheck before any launch promise. No competitor assets, character names or proprietary level layouts should be reused.

## Summary ranking

On feature breadth, Infinite Match ranks **fourth of four** in this audit. Royal Match, Candy Crush Saga and Match Masters are ahead on boards, obstacles, live operations, social play and platforms. Infinite Match's strengths are the things it built deliberately: unlimited generated levels with solver witnesses, free hints, guest play and a documented accessibility layer. The accessibility layer was not assessed for competitors, so it is shown in the matrix but excluded from the ranking.

| Rank | Game | Average (10 common dimensions, 0–5) | Read-across |
| --- | --- | --- | --- |
| 1 | Royal Match | **4.2** | Broadest combination of boosters, obstacles, castle meta and live events. |
| 2 | Candy Crush Saga | **4.0** | Largest authored catalogue, deepest obstacle set, weekly cadence. |
| 3 | Match Masters | **3.9** | The only real-time PvP in the set; thinner single-player board design. |
| 4 | Infinite Match | **2.2** | Strong on supply and fairness controls; behind on board richness, live ops, social and platforms. |

The gap between the top three is within judgment error. The gap to Infinite Match is not. Even if every Infinite Match score below 5 were raised by one point, the average would be 3.1, still behind all three competitors.

## Method and rubric

- **Thirteen dimensions** cover the board, the meta, live operations, social, platforms and polish. Each is scored 0–5.
- **Rubric:** 0 = absent; 1 = minimal, or unverified; 2 = partial or shallow; 3 = functional with limited depth; 4 = strong with known gaps; 5 = comprehensive and genre-leading.
- **Ranking uses only the 10 dimensions scored for all four games** (rows 1–4, 6–10 and 13 below). Rows marked n/a or *not assessed* are shown for context but excluded from the average, so no game is ranked on a dimension it was not checked on.
- **Scores are analyst judgment** from the sources listed in the evidence table. They are not player-preference, revenue or market-share measures. To change a score, add a source.
- **Infinite Match is scored on built and tested scope.** Open validation gates (physical devices, screen readers, real cohorts) are noted, but they do not raise a score.

## Feature ranking matrix

| # | Dimension | Infinite Match | Royal Match | Candy Crush Saga | Match Masters |
| --- | --- | :---: | :---: | :---: | :---: |
| 1 | Core swap match-3 (swaps, cascades, refill) | 5 | 5 | 5 | 5 |
| 2 | Boosters and special items | 3 | 5 | 5 | 5 |
| 3 | Board obstacles and terrain | 1 | 5 | 5 | 2 |
| 4 | Objectives and design variety | 2 | 4 | 5 | 3 |
| 5 | Level supply and volume | 4 | 4 | 5 | n/a |
| 6 | Meta-progression and story | 3 | 5 | 3 | 3 |
| 7 | Live ops and event cadence | 2 | 5 | 5 | 4 |
| 8 | Social and asynchronous competition | 2 | 4 | 3 | 4 |
| 9 | Real-time PvP | 0 | 0 | 0 | 5 |
| 10 | Platforms and distribution | 2 | 5 | 5 | 4 |
| 11 | Offline play and cloud sync | 2 | 3 | 4 | n/a |
| 12 | Accessibility and free-play controls | 4 | not assessed | not assessed | not assessed |
| 13 | Audio and visual polish (subjective) | 2 | 4 | 4 | 4 |
| | **Average, rows 1–4, 6–10, 13** | **2.2** | **4.2** | **4.0** | **3.9** |

## Evidence for each score

| # | Infinite Match (repository) | Competitors (public sources) |
| --- | --- | --- |
| 1 | Swaps, cascades, refill and no-moves reshuffle are built and covered by tests (README). | Core mechanic in all three; not a differentiator. |
| 2 | Six inventory boosters (bomb, rainbow, lightning, diamond, target, star) plus three earned special types (Beams, L/T Bursts, Prisms) and their combinations. Specials spend a normal move. | Royal Match: rockets, TNT, propellers, light balls and combinations ([baike.baidu.com](https://baike.baidu.com/en/item/Royal%20Match/3340334)). Candy Crush: colour bombs, striped and wrapped candies, jelly fish, lollipop hammer, free switch, UFO and party boosters ([candycrush.fandom.com](https://candycrush.fandom.com/wiki/Candy_Crush_Saga)). Match Masters: "one of 20+ available boosters" ([Google Play](https://play.google.com/store/apps/details?id=com.funtomic.matchmasters&hl=en_IN)). |
| 3 | One fixed two-hit shield overlay (v5). No other terrain. | Royal Match: birds, crates, potion bottles, cabinets, diamonds, magic hats, coin safes, mailboxes and pigs ([baike.baidu.com](https://baike.baidu.com/en/item/Royal%20Match/3340334)). Candy Crush: chocolate, liquorice, jelly, marmalade, frosting and candy bombs ([candycrush.fandom.com](https://candycrush.fandom.com/wiki/Candy_Crush_Saga)). Match Masters: obstacles not documented in the sources reviewed, so scored conservatively at 2. |
| 4 | Score, one-colour, two-colour, mixed and clear-shields goals, all generated. No delivery, timed or boss objectives. | Candy Crush: clearing jelly, dropping ingredients, reaching a target score ([softonic.com](https://candy-crush-saga.en.softonic.com/android)). Royal Match: bonus levels and varied event modes ([Google Play](https://play.google.com/store/apps/details?id=com.dreamgames.royalmatch&hl=en_IN)). Match Masters: solo-mode events described as "some of the most difficult challenges" ([Google Play](https://play.google.com/store/apps/details?id=com.funtomic.matchmasters&hl=en_IN)). |
| 5 | Unlimited generated levels, each with a solver witness. Designed variety per level is the real gap (row 4). | Royal Match: 100 new levels every two weeks ([Google Play](https://play.google.com/store/apps/details?id=com.dreamgames.royalmatch&hl=en_IN)). Candy Crush: 22,445 levels as of mid-2026, with weekly drops ([riftwoodstudio.com](https://riftwoodstudio.com/blog/how-many-levels-in-candy-crush-saga-the-answer-will-surprise-you/)). Match Masters: a PvP product, not a level catalogue. |
| 6 | Six kingdom rooms, six décor types, six illustrated room scenes and a skippable story. No explorable world. | Royal Match: castle renovation, rooms and star-gated areas ([Amazon Appstore](https://www.amazon.com/Dream-Games-Royal-Match/dp/B0BP83FJ64)). Candy Crush: map progression with no castle meta. Match Masters: trophies, studios and sticker albums ([Google Play](https://play.google.com/store/apps/details?id=com.funtomic.matchmasters&hl=en_IN)). |
| 7 | One weekly event (Hall Lanterns, ten UTC windows through 14 December 2026), a daily reward wheel and a battle-pass config. The generic event arrays are empty. Operational gate open. | Royal Match: new levels every two weeks, and King's Cup, Sky Race, Team Battle and Lightning Rush ([Google Play](https://play.google.com/store/apps/details?id=com.dreamgames.royalmatch&hl=en_IN)). Candy Crush: weekly level drops and rotating events ([riftwoodstudio.com](https://riftwoodstudio.com/blog/how-many-levels-in-candy-crush-saga-the-answer-will-surprise-you/)). Match Masters: a dynamic team-event schedule, Team vs Team and Friends Fiesta ([Google Play](https://play.google.com/store/apps/details?id=com.funtomic.matchmasters&hl=en_IN)). |
| 8 | Friend codes, guilds, a best-score board and asynchronous score tournaments. No life or booster gifting. | Royal Match: Team Battle and team tournaments, per a 2023 event guide ([hubpages.com](https://discover.hubpages.com/games-hobbies/Royal-Match-Events-Guide)). Candy Crush: sending lives to friends, per third-party guides, not re-verified. Match Masters: friend challenges, team events and Friends Fiesta ([Google Play](https://play.google.com/store/apps/details?id=com.funtomic.matchmasters&hl=en_IN)). |
| 9 | No real-time PvP. Competition is asynchronous only. | Match Masters: live turn-based PvP on a shared board, with knockout tournaments ([Google Play](https://play.google.com/store/apps/details?id=com.funtomic.matchmasters&hl=en_IN)). No real-time PvP was found for Royal Match or Candy Crush in the sources reviewed. |
| 10 | Browser client is the tested target. No installable web app (no manifest or service worker). Android and iOS are configured in the repository but not shipped. | Royal Match: Amazon Appstore and Google Play verified; App Store downloads are reported by a tracker ([rec0ded88.com](https://rec0ded88.com/live-player-count/royal-match/)). Candy Crush: iOS, Android, Amazon, Facebook and Microsoft Store ([riftwoodstudio.com](https://riftwoodstudio.com/blog/how-many-levels-in-candy-crush-saga-the-answer-will-surprise-you/)). Match Masters: Google Play verified; iOS not checked in this pass. |
| 11 | Guest fallback for temporary errors. Signed-in progress needs the server. Offline reconciliation not built. | Royal Match: offline play per a 2021 third-party listing, not re-verified. Candy Crush: cloud-saved, per the October 10 audit, not re-verified this pass. Match Masters: not assessed. |
| 12 | Free hints, guest play, text board, reduced motion, high contrast, large text, keyboard controls and opt-in haptics. Scored 4, not 5, because screen-reader and physical-device validation is still open. | Not assessed for any competitor, so excluded from the ranking. |
| 13 | Original vector art and 16 opt-in sound cues. No music. | Subjective. The three competitors are scored equally because no playtest or audio-visual review was done. |

## Executive decision

Do **not** try to reproduce every event icon or monetize difficulty before the board earns trust. The differentiated proposition should be: **an endlessly replayable, readable, fair-feeling match-3 adventure whose local daily puzzle reflects the player's chosen region and season, playable first without an account**. The procedural system is already a genuine advantage in *content availability*, but a certified winning path is not equivalent to a satisfying puzzle. The biggest near-term gap is *puzzle variety and evidenced player enjoyment*, followed by a compelling visible kingdom and repeatable live-ops execution. Competition with the incumbents is a quality/operations problem, not a count-the-features problem.

Recommended order: **(1) validate first-play, fairness and device performance; (2) validate the new versioned shield obstacle with real players and refine it; (3) make renovation visibly rewarding; (4) operate one reliable weekly event loop; (5) scale social/competitive play only after server-authoritative results.** Keep the existing free hints, guest play and accessibility controls free.

## Competitor feature map

| Game | Observable strengths | What this means for us |
| --- | --- | --- |
| **Royal Match** | Castle renovation, boosters and combinations, many interactive blockers, bonus levels, chests, and parallel solo/team events; official examples include Balloon Rise, Hidden Temple, Weekly Contest, Team Battle and Sky Race. [dreamgames.com](https://www.dreamgames.com/games/royal-match) · [play.google.com](https://play.google.com/store/apps/details?id=com.dreamgames.royalmatch) | Infinite Match has earned specials and six numeric renovation rooms, but not a similarly varied board or explorable visual castle (v5 now adds one fixed shield family). Do not copy its event names or art. |
| **Candy Crush Saga** | Thousands of levels, jelly and chocolate blockers, varied level objectives, boosters, daily rewards, rotating events, offline play. [play.google.com](https://play.google.com/store/apps/details?id=com.king.candycrushsaga) · [apps.apple.com](https://apps.apple.com/us/app/candy-crush-saga/id553834731) | Our score/color-collection objectives are a good foundation; v5 adds a fixed clear-shields objective, but no delivery/other terrain objective yet. Guest offline fallback is narrower than unconditional offline support for accounts; opt-in Endless checkpoints still require a server for account rewards. |
| **Gardenscapes / Homescapes** | Room/garden restoration, characters and chapter story, choice-based decoration, boosters, expeditions and competitions. [play.google.com](https://play.google.com/store/apps/details?id=com.playrix.gardenscapes) · [play.google.com](https://play.google.com/store/apps/details?id=com.playrix.homescapes) | Our renovation/decor is functional but mostly textual/numeric, with no shipped scene art or chapter narrative. Their meta loop is a reason to complete the *next* puzzle. |
| **Royal Kingdom** | Distinct kingdom areas and family/antagonist story; publisher describes Kingdom/Dark Kingdom levels and a Golem that reacts to matches. [dreamgames.com](https://www.dreamgames.com/games/royal-kingdom) | Our every-tenth-stage “boss” is only a harder profile. An actual boss needs explicit deterministic state, legible counterplay and server-verifiable wins, not a label. |
| **Toon Blast** | Tap-to-blast cubes (a different core mechanic), objectives and obstacles, episode progression, star rewards, teams and shared lives, cross-device sync. [play.google.com](https://play.google.com/store/apps/details?id=net.peakgames.toonblast) | Borrow the principle of low-friction onboarding and cooperation, not the tap-to-blast mechanic wholesale. Our guilds cannot gift energy/lives today. |
| **Match Masters** | Real-time turn-based PvP on a shared board, charged boosters, tournaments, trophies and sticker albums. [play.google.com](https://play.google.com/store/apps/details?id=com.funtomic.matchmasters) · [naavik.co](https://naavik.co/deep-dives/match-masters-deconstruction/) | Our friends/guilds and score-based tournaments are **not** live PvP. Building live PvP would require authoritative turns, timing, reconnects, matchmaking and anti-cheat. Defer until fair score reporting works. |
| **Project Makeover** | Match puzzles tied to character makeovers, clothing/room choices, drama, player avatar and friend visits. [play.google.com](https://play.google.com/store/apps/details?id=com.bgg.jump) | Player expression is more memorable than another currency. Consider a small original visual room/decor story before adding a separate avatar economy. |

These are representative major competitors, **not** an exhaustive catalog of every limited-time feature in every region. Merge titles such as Gossip Harbor compete for the same time and narrative attention but are *not* swap match-3; do not treat their merge mechanics as a missing feature here.

## Competitor claims refreshed (2026-10-11)

Figures are dated and disagree across trackers. None should be used for a launch promise.

| Competitor | Current public signal | Relevance |
| --- | --- | --- |
| Royal Match | Its Google Play listing (updated 28 August 2026) promises 100 new levels, a new area and new levels every two weeks ([Google Play](https://play.google.com/store/apps/details?id=com.dreamgames.royalmatch&hl=en_IN)). AppMagic reported over $6 billion in lifetime player spending in May 2025 ([wnhub.io](https://wnhub.io/news/other/item-47827)). One tracker estimates 60–100 million monthly actives in mid-2026 ([rec0ded88.com](https://rec0ded88.com/live-player-count/royal-match/)). | Sets the bar for authored content cadence, events and layered meta. |
| Candy Crush Saga | Community-wiki data cited by a June 2026 guide gives 22,445 levels across 1,497 episodes on mobile ([riftwoodstudio.com](https://riftwoodstudio.com/blog/how-many-levels-in-candy-crush-saga-the-answer-will-surprise-you/)). The wiki's own HTML5 count was 23,525 at its September 2025 snapshot ([candycrush.fandom.com](https://candycrush.fandom.com/wiki/Level)). Trackers differ on weekly additions (45 vs 60). **This corrects the October 10 and October 11 figure of "over 16,000".** | Our generated levels are a supply advantage in theory. The comparison that matters is designed variety per level. |
| Match Masters | Its Google Play listing (updated 28 September 2026) adds a Team vs Team event on a dynamic schedule, Friends Fiesta rewards and a Play Fest event. Trophies unlock studios, and knockout tournaments are live ([Google Play](https://play.google.com/store/apps/details?id=com.funtomic.matchmasters&hl=en_IN)). | Our friends, guilds and tournaments are asynchronous score comparisons, not PvP. Live PvP is a separate product bet. |
| Toon Blast, Gardenscapes, Homescapes | Not re-researched in this pass. Excluded from the ranking. | Toon Blast is a different core mechanic. The Scapes games are relevant for decoration and story, not for board rules. |

The October 10 audit's claim that Royal Match had "version 37743 (July 31, 2026)" could not be verified in this pass, so this document uses the listing's dated update note instead. The vendor-analysis claim about tournament formats (2.5 average) was also dropped, since it could not be verified against a primary source.

## Platform check: what this repository actually ships

| Platform | Evidence in repository | Verdict |
| --- | --- | --- |
| Desktop and mobile browser (root Phaser client) | Playable via `index.html` and `phaser3-game.js`. The October 11 refresh reports 1,056 Jest tests across 50 suites passing, after restoring the declared `linkedom` devDependency. Browser smoke covers seven viewports. | **Tested target, not verified in the refresh sandbox.** No Chromium was installed there, and the Playwright download host was outside the allowed network. The test count was not re-run for this merge. |
| Installable web app (PWA) | No `manifest.json` link and no service worker in `index.html` or `public/`. | **Missing.** Needed for home-screen install and any offline shell. |
| Android | `unity/Assets/Plugins/Android/AndroidManifest.xml` and `.github/workflows/android.yml` (Unity builder). | **Configured, not shipped.** No `.apk` or `.aab` is in the repository. The workflow needs a Unity licence and runner. |
| iOS | `unity/Assets/Plugins/iOS/Info.plist` and `.github/workflows/ios.yml` (macOS runner). | **Configured, not shipped.** No Xcode project or TestFlight evidence. |
| Portal WebGL builds (Poki and others) | `build-webgl-poki.sh` and `build-webgl-mobile.sh` cover Poki, Facebook, Snap, TikTok, Kongregate and CrazyGames. | **Scripts exist; no portal submission or live listing evidence.** |
| Store billing | Apple and Google receipt verification is implemented (`POST /api/monetization/receipt/verify`). | **Not validated on a device or with live stores.** |
| Cross-device sync | Signed-in balances need `ECONOMY_STORE=mongo`. Signed-in offline reconciliation is not built. | **Partial.** Not competitive with the cloud-saved competitor experience yet. |

## Infinite Match status, by player-visible capability

Legend: **Working** = code/test support on the root web client or mounted server, not a verified production deployment; **Partial** = basic system exists but the comparable experience is absent or unverified; **Missing** = not present on the playable product. Source of truth is [README implementation status](../README.md), [player-experience evidence](PLAYER_EXPERIENCE.md) and the linked implementation files, not the aspirational README feature list or unmounted `Local*` modules.

| Capability | Status and evidence | Critical caveat |
| --- | --- | --- |
| Swaps, cascades, refills, reshuffle, earned specials, combinations, boosters | **Working** — `src/services/levels/{match-core,special-rules}.js`, `phaser3-game.js`, gameplay tests | V5 adds fixed two-hit shield terrain and a goal, but not blockers that prevent swapping, delivery objectives or true bosses. v2/v3/v4 behavior remains frozen for existing paid attempts. |
| Goals, level supply, daily variants | **Working** — `generator.js`, `objective-rules.js`, `level-service.js`; certified no-booster witnesses, score/one-color/two-color/mixed goals | V5 now includes fixed shield stages; infinite generated levels are not infinite *designed variety*. Human fairness, timed completability and balance are not certified by a witness. |
| Mode choice and accessible input | **Working**, with limits — classic, timed, daily, endless; hints, shapes/letters, keyboard, semantic text board, motion/text/contrast preferences, opt-in sound; browser smoke in `docs/PLAYER_EXPERIENCE.md` | No real-device/screen-reader certification. Timed/endless/community screens have lighter browser coverage than the core board. |
| Progression and story | **Partial** — six upgradable rooms, six purchasable décor types and star/coin gates. Six web-only illustrated scenes now show each existing room repaired and three level-one looks per room (`public/js/kingdom-scene.js`). | All six rooms have a first visual scene, but there is no explorable kingdom or chapter system. Phone/screen-reader and first-session comprehension have not been validated. |
| Events, quests and pass | **Partial** — daily reward, wheel, battle-pass XP/claims, tournaments and community challenge code; `config/battlepass/config.json` has a season | The free Hall Lanterns weekly calendar now has ten checked-in UTC windows through December 14, 2026, with verified-win milestones and locked claims; deploying/verifying the candidate weeks, continued publishing before December 14, production storage/concurrency and real-device checks remain necessary. The older generic events/deals/tournaments/challenges arrays remain empty; the premium pass has no purchasable SKU. |
| Social and competition | **Partial** — friend codes, guild membership, best-score board, score tournaments (`src/services/social/social-store.js`, `src/services/live-ops/competitions.js`) | No team life gifting, co-op event, or live PvP. Stores are single files. Only replayed **booster-free** v4/v5 classic/daily wins rank; receipt-backed booster results may be verified but remain unranked, as do timed/endless results. |
| Economy / purchases | **Partial** — server-gated energy and rewards, coin packs, Stripe/Apple/Google verification paths, server-priced shop | Live payment/device billing not validated here; durable balances require Mongo opt-in and production config. Avoid designing pay-to-escape levels around untested billing. |
| Offline and platforms | **Partial** — guest fallback supports certified offline play for temporary errors; account purchases/attempts require a server | Browser web client is the tested target; Unity artifacts and phone-store binaries are not proven equivalent. Signed-in cross-device/offline reconciliation is not built. |
| Polished visual/audio identity | **Partial** — readable original gem shapes/badges, motion feedback and 16 local opt-in cues | Original web scenes for all six rooms and skippable story beats are implemented; broader world/story, music, device profiling and human listening/visual quality testing remain open. |
| Board replay integrity | **Partial** — pinned move and receipt-bound inventory replay verifies v4/v5 classic/daily score/goal counters; only booster-free paths rank | Old clients, timed and endless results still pay without replay. Booster-assisted replay is verified but unranked. Random instant-booster locations are client-reported and a public witness can be computed by a bot. Do not launch consequential prizes without completing the remaining trust gates. |

## Ranked roadmap (build in this order; gates before launch)

### P0 — prove the fun and close trust gaps

1. **First-play and fairness study (protocol/evaluator ready; real pilot not conducted).** An [offline web study kit](WEB_FIRST_PLAY_STUDY.md) now validates 20+ first-time phone observations for unassisted move/goal learning and 30+ observed-loss sessions for fairness/enjoyment, with missing-answer accounting and small-stratum suppression. It collects no account IDs, raw seeds, IPs, location, or free text, and does not prove human participation. Have a facilitator recruit consenting people, check board diversity and loss reasons separately, and run physical Android/iPhone, assistive-tech and performance gates. Reject “leadership” claims until a real cohort enjoys and understands the game; synthetic unit tests are not player evidence.
2. **First obstacle family, versioned and original.** The first slice is now implemented as a readable **two-hit fixed shield overlay** over existing gems: each actual clear on that cell removes one layer, while the gem scores/collects and refills normally; specials and inventory clears hit it, gravity does not move it and free repairs do not hit it. It has a visible clear-shields goal, numbered border, onboarding announcement, free goal-aware hints and named-cell semantics. Read-only terrain-aware staged feedback now holds numbered shields fixed through gem falls, with an immediate reduced-motion/text-board fallback and one shield-hit announcement; next test recognition/balance on physical phones. Shared transitions, generated witness, Phaser rendering, inventory clears and deterministic tests are versioned as v5; old v2/v3/v4 paid definitions remain supported. **Open gate:** physical-device layout/performance, actual screen readers, broad seed corpus and observed human comprehension/fairness. This is an implemented first slice, **not** a complete obstacle system or a release certification.
3. **Result integrity before prizes.** V4/v5 classic/daily transcript replay under the attempt lock now checks pinned moves, RNG/refill, specials, score and goals; all six playable boosters receive attempt-bound inventory receipts and server-derived effects. Booster-backed paths can verify account results, but do **not** rank alongside booster-free paths. Legacy, timed and endless wins still pay existing account rewards but cannot enter boards; old unverifiable social scores/progress are discarded while payout receipts survive. **Remaining gate:** secure timed deadlines and multi-stage endless, prevent unverified account rewards/statistics from being exploitable, add false-rejection telemetry and durable multi-server storage. Reported random booster locations and a public winning witness do not prove honest human play. Do not launch consequential prizes until these gaps and real-player tests are addressed.

### P1 — give each win a reason and run one dependable event

4. **Visible kingdom slice (web implementation, not a release gate pass).** All six existing rooms now render distinct unlit-to-restored authored scenes with three first looks each and a skippable short story. Native room buttons switch views without a network request after the initial read; each locked, server-priced one-tap choice buys or reuses available stock for its own room. Repairs, star/coin gates and guest puzzle access stay server-owned. Route, pure-scene, DOM and Phaser regression tests cover room pricing, six-room presentation and stale room-switch responses. **Open gate:** test first-session room discovery/comprehension, before/after recognition, physical phone/screen-reader behavior and whether players choose to continue; all six scenes are still only first looks, not an explorable chapter world. Measure completion, not just upgrade API calls.
5. **One operational event loop (first web implementation; operational gate open).** Hall Lanterns now has ten contiguous checked-in UTC windows (October 5–December 14, 2026) in `config/liveops.json`, with the original six windows and rewards unchanged: only replay-verified classic/daily wins count, including assisted ordinary wins that stay unranked. Server-locked progress and free coin milestones have preview, validation, expiry, a kill switch, an idempotent claim, local-time messaging and an [operator runbook](WEEKLY_EVENT_OPERATIONS.md). Concurrency, expiry and reconnect have deterministic/route tests. A bounded expired-week archive, optional previous-vs-candidate publishing check and optional 14-day schedule-horizon preview now support safe continued publishing; the 35-day archive floor is operator-enforced and no seeded week has been rotated yet. **Open gate:** compare the four new candidate weeks against the actual deployed snapshot, deploy and verify them, publish the next validated week before December 14, observe deployment/restarts and retention behavior, test on physical phones, and add distributed locks/transactions before multi-server or consequential prizes. The remaining empty event schemas are not live operations.
6. **Tuning and observability (instrumentation slice delivered; adjustment gate open).** A [web observation slice](DIFFICULTY_OBSERVATIONS.md) now distinguishes server-issued v4/v5 classic/daily starts and replay-verified wins from unverified wins and explicitly client-reported losses, quits, hints and progress; account-bound booster receipts are counted without logging identifiers, boards or location. The restricted report suppresses groups under 20 starts, exposes unsettled outcomes and can show keyed seed groups. The old legacy tuning timer is now review-only; legacy targets are pinned at paid spend, and manual one-level changes require an opt-in, preview match and review ID. **No generated adjustment was applied**: an [optional, deletable, off-by-default web D1/D7 study](WEB_RETURN_STUDY.md) now supplies a limited UTC app-open return signal, but no real cohort data, crash-free-session baseline, randomized experiment, or first-play/fairness evidence has been gathered. A separate [offline consented web stability evaluator](WEB_SESSION_STABILITY.md) now checks a submitted ≥1,000-session/99.5% proposed gate with missing-outcome accounting; it has no real observations or automatic crash telemetry. Do one controlled versioned adjustment only after first-play, fairness, consent-based D1/D7 return, completion and crash-free-session guardrails are preregistered and actually measured. The 20-start threshold is privacy suppression, not causal evidence, statistical power or human accessibility validation. Never quietly change an active paid level definition.

### P2 — only after the foundations hold

7. Team cooperation (limited, abuse-resistant energy gifts or shared milestones) **after** durable shared social storage and result verification. Real-time PvP is a separate product bet, not a checkbox: authoritative rooms, clocks, reconnect, matched skill bands and non-pay-to-win rules.
8. Broader objective/obstacle families, episodic world, cosmetic collection and platform distribution **only** if P0/P1 improve player outcomes. Premium pass/subscription, rewarded ads and richer monetization are optional experiments with clear opt-in/consent, transparent odds/prices and no forced interstitials. Avoid monetizing accessibility, hints or deceptive near-win frustration.

## Endless play and sustainable return

Endless already generates and certifies stages on demand with no clock or authored
content bank. The web client now offers an off-by-default, explicit signed-in
checkpoint preference at a completed stage near the existing score reward cap or
three-hour paid-attempt deadline. It banks first, then requests the normal
one-energy next run; failure/unknown payout never authorizes a fresh spend.
Guests and manual banking are unchanged. This is about uninterrupted in-app
play and transparent limits, **not** measured retention or the highest ROI.

To evaluate ROI without damaging trust, preregister net contribution per
consenting cohort alongside unassisted first-play success, D1/D7 return,
voluntary next-stage starts, fair-loss ratings, confirmed bank failures,
refunds/support contacts and real-device performance. Do not infer LTV, CAC or
"forever" engagement from generated-stage count alone. Server-replayed,
idempotently recoverable Endless payouts and honest offline account
reconciliation remain open before increasing stakes.

## Comprehensive request: what code cannot honestly complete at once

The October 10 expansion made all six existing rooms visible without changing economy.
It did **not** ship new puzzle rules, live PvP, native builds, production-grade shared
social storage, signed-in offline synchronization or real-world certification.
Those are separate, stateful systems: shipping superficial stubs in one batch would
mislead players or weaken ranked/economy integrity. A single coordinated release
candidate could combine them only after these explicit gates:

- **Board variety:** prototype a second deterministic obstacle/objective family behind
  a new version, prove server/browser replay and no-booster witnesses, then observe
  fairness on real phones before broadening the paid level generator.
- **Team events/PvP:** migrate social state to a transactional shared store before
  team contributions, gifts or consequential rewards. PvP additionally needs an
  authoritative clock/turn log, reconnect and abuse tests. Do not label the existing
  score tournament "live PvP".
- **Calendar and platforms:** publish and rotate each future weekly window using
  the deployed schedule comparison and real operations; native builds, billing,
  signed-in offline queue/reconciliation and multi-device save tests require separate
  infrastructure and store/device validation.
- **Experience evidence:** recruit consenting first-time players and observed-loss
  sessions; test real phones, VoiceOver/TalkBack and low-end frame times. Automated
  tests and generated fixtures cannot certify enjoyment, fairness or accessibility.

These are release dependencies, not optional polish. Keep guest play, free hints,
server prices and ranked booster separation intact throughout.

## Operating scorecard

| Dimension | Baseline needed before targets | Guardrail / decision rule |
| --- | --- | --- |
| Puzzle joy | Observed first-play comprehension, enjoyment and loss fairness, segmented by input/access needs | Use [player-experience proposed gates](PLAYER_EXPERIENCE.md#measurable-release-gates); if fairness falls, stop adding monetization/friction. |
| Core performance | Cold-start p75, interaction p95, frame-time p95 on mid-range real phones | Measure real readiness, crashes and background/resume; synthetic desktop browser runs are regression checks, not device evidence. |
| Level quality | Win/retry/quit by seed, difficulty, objective and cohort; track no-booster feasible path | Hardness distributions and human solvability matter; one solver witness is a floor, not a player success metric. |
| Retention | Consent-based D1/D7 return cohorts, median session length, second-level starts | Compare controlled experiments to baseline; do not assert industry benchmark numbers as a promise. |
| Trust & economy | Verified vs unverified wins, failed/duplicate spends, refund and support rates | No consequential leaderboard reward from unverified client score; zero double grants in fault tests. |
| Live ops | Event discoverability, entry/claim success, on-time operator publishing | A stale season or empty event schedule is a failed event launch even if endpoints return 200. |

## Explicit non-goals and unresolved decisions

- Do not chase *all* Royal Match events, licensed art, identical blocker behavior or the same economy. Differentiate rather than clone.
- Decide whether the product is **web-first** or native-store-first before promising cross-device billing, push, offline sync or performance parity. The present QA evidence is strongest for the root web game.
- Decide whether competition is skill-focused. If so, server-verified scores and non-pay-to-win competition rules take precedence over more leaderboard UI.
- Decide whether castle storytelling is a core pillar; if yes, budget sustained original art/writing/UX production, not just API work.
- This audit is based on public descriptions and repository inspection, **not hands-on competitor playtests**, store device QA or market-share analysis. Repeat quarterly and annotate actual competitor versions/regions when running a hands-on study.

## Path to "definitive on all platforms"

No single change can satisfy this. The ordered path, based on the P0 and P1 items above, is:

1. **Measure the player first.** Run the [first-play and fairness study](WEB_FIRST_PLAY_STUDY.md) with real phones (20+ first-time and 30+ observed-loss sessions). Competitor comparisons without this are guesses.
2. **Make the web client installable.** Add a web app manifest and a conservative service worker that caches only the static shell, not game state or API responses. Verify with the existing browser smoke on a real Chromium. This is the smallest honest step toward "all platforms".
3. **Ship one native build end to end.** Produce a signed Android build from the Unity project with a licensed runner, install it on a real phone, and log cold-start and frame-time numbers. Then do iOS through TestFlight. Until then, the native platforms should be described as configured, not shipped.
4. **Add board variety behind a new rules version.** Prototype a second obstacle family or delivery objective (the audit's item 8), prove replay and no-booster witnesses, and test it on real players. Do not add PvP before server-authoritative scores hold up under abuse tests.
5. **Run an event cadence for at least one full season.** Publish and verify each week on time, and track entry and claim rates. A stale or empty event is a failed launch.
6. **Get store-visible proof.** Real store listings, ratings and crash-free-session numbers are the only fair basis for claiming to be the best. Until then the honest claim is "the fairest and most accessible endless match-3 we can measure", not "definitive".

## Limitations of this comparison

- **Judgment, not playtests.** Scores come from public descriptions and repository inspection. No competitor build was played, and no store device QA or market-share analysis was done.
- **Trackers disagree.** Level counts, player numbers and spend figures vary by source and date. Where they conflict, this document says so.
- **Not assessed.** Competitor accessibility, fairness and win integrity; Toon Blast and the Scapes games in the ranking; Royal Match and Candy Crush real-time PvP beyond the sources reviewed.
- **Repository claims are as stated.** Test counts and platform checks come from the October 11 refresh or the repository's own docs. This merge did not re-run the test suite or the browser smoke.

## Change log for this merge

- Merged `COMPETITIVE_REFRESH_2026-10-11.md` into this file and removed the refresh file. The README link to this file still works.
- Added the ranking matrix, scoring rubric and per-score evidence.
- Corrected the Candy Crush level count from "over 16,000" to 22,000+, with a note on tracker disagreement.
- Replaced an unverified Royal Match version number with the listing's dated update note.
- Dropped an unverifiable vendor claim about tournament formats.
- Normalized citations to domain-labelled links, because the two source docs reused the same numbers for different URLs.
- Unified the snapshot date to 2026-10-11.

