# Infinite Match vs. the match-3 field: refresh and platform gap check (2026-10-11)

This is a dated companion to [the competitive feature audit](COMPETITIVE_STRATEGY.md). It re-checks competitor public claims, checks what the repository actually ships on each platform, and states what "the definitive match game on all platforms" would require. It is not a claim of leadership, and it is not a hands-on playtest of competitor builds.

## Bottom line

- **Infinite Match is not yet a definitive match game, and this repository cannot make it one in one change.** The biggest gaps are puzzle variety, live-ops cadence and shipped native platforms. Those are product and operations gaps, not a missing feature list.
- **The competitors are very strong on scale and cadence.** Royal Match is publicly reported at more than $6 billion in lifetime player spending. Candy Crush has more than 16,000 levels with weekly additions. Match Masters runs real-time PvP.
- **Infinite Match's real edge is different:** unlimited procedurally generated levels that each carry a solver-checked witness, free hints, guest play without an account, shape and letter gems, a motion/text/contrast accessibility layer, and server-replayed win verification for ranked results. Competitors are not reviewed here for these features, so treat "differentiator" as an internal hypothesis until a real cohort confirms it.
- **"All platforms" is currently web-only in practice.** The browser client is the only tested target. There is no installable web app (no web manifest or service worker), and no shipped Android or iOS build.

## What changed in competitor claims since the October 10 audit

Third-party trackers disagree sharply on basic numbers. For example, one tracker reports Candy Crush monthly actives at 170–176 million and another at 88 million, so none of the figures below should be used for a launch promise.

| Competitor | Recent public signal | Relevance |
| --- | --- | --- |
| Royal Match | Its store listing shows version 37743 (July 31, 2026) with about 100 new levels and a new area, and says new levels arrive every two weeks [2](https://appmagic.rocks/google-play/royal-match/com.dreamgames.royalmatch/?hl=en). It is reported at over $6 billion lifetime spend [5](https://games.gg/news/players-spend-over-6-billion-in-royal-match/). A 2026 industry analysis says it runs six standard tournament formats where the casual-competitive average is 2.5, and ranked No. 2 in mobile-game revenue in June 2026 [3](https://www.raviosoft.com/post/best-match-3-games-of-2026-the-games-kpis-and-marketing-strategies-dominating-the-market). Card collection was added as a second progression layer [4](https://naavik.co/deep-dives/royal-match/). | Sets the bar for authored content cadence, events, and layered meta. Its paid-acquisition share has been reported as high, which we cannot match. |
| Candy Crush Saga | Trackers report over 16,000 levels, with 45–60 added per week and about 4% of players ever making a purchase [6](https://www.quantumrun.com/consulting/candy-crush-saga/). Another tracker reports over 17,000 levels [7](https://www.blog.udonis.co/mobile-marketing/mobile-games/candy-crush). | Our generated levels are a supply advantage in theory. The comparison that matters is designed variety per level, which the audit already flags as the main gap. |
| Match Masters | Live real-time PvP on a shared board, with boosters charged by matching stars and opponents collecting circles [8](https://play.google.com/store/apps/details?id=com.funtomic.matchmasters&hl=en_US). Its team-versus-team event and dynamic event schedule were added in 2026 [9](https://play.google.com/store/apps/details/Match_Masters?id=com.funtomic.matchmasters&hl=en_GB). | Our friends, guilds and tournaments are asynchronous score comparisons, not PvP. Live PvP is a separate product bet, as the audit says. |
| Toon Blast, Gardenscapes, Homescapes | Public guides still position Toon Blast around tap-to-blast cubes and the Scapes games around decoration and story. They are listed on iPhone, iPad and Android [10](https://madfox.dev/games_en/best-match-3-games-mobile-2026). | Confirms the platform benchmark: native phones and tablets are the default competitor surface. |

## Platform check: what this repository actually ships

| Platform | Evidence in repo | Verdict |
| --- | --- | --- |
| Desktop and mobile browser (root Phaser client) | Playable via `index.html` and `phaser3-game.js`; 1,056 Jest tests across 50 suites pass after restoring one missing devDependency (see below). Browser smoke (`scripts/player-browser-smoke.mjs`) covers seven viewports. | **Tested target, not verified in this sandbox.** The browser smoke could not run here because no Chromium is installed and Playwright's download host is outside the allowed network. |
| Installable web app (PWA) | No `manifest.json` link and no service worker in `index.html`. | **Missing.** Needed for home-screen install and any offline shell. |
| Android | `unity/Assets/Plugins/Android/AndroidManifest.xml` and `.github/workflows/android.yml` (Unity builder). | **Configured, not shipped.** No `.apk` or `.aab` is in the repository, and the workflow needs a Unity license and runner. |
| iOS | `unity/Assets/Plugins/iOS/Info.plist` and `.github/workflows/ios.yml` (macOS runner). | **Configured, not shipped.** No Xcode project or TestFlight evidence. |
| Portal WebGL builds (Poki and others) | `build-webgl-poki.sh` and `build-webgl-mobile.sh` cover Poki, Facebook, Snap, TikTok, Kongregate and CrazyGames. | **Scripts exist; no portal submission or live listing evidence.** |
| Store billing | Apple and Google receipt verification is implemented (`POST /api/monetization/receipt/verify`). | **Not validated on a device or with live stores.** |
| Cross-device sync | Signed-in balances need `ECONOMY_STORE=mongo`. The audit says signed-in offline reconciliation is not built. | **Partial.** Not competitive with the cloud-saved competitor experience yet. |

**Dependency note.** The three suites that failed in a clean sandbox (`weekly-event`, `kingdom-room`, `player-experience`) failed only because `linkedom`, a declared devDependency, was missing from `node_modules`. Installing it with `npm install --no-save linkedom@0.18.12` made all 50 suites pass. No code changed. A fresh `npm ci` should do the same.

## Scorecard (evidence-based, not a popularity ranking)

Ratings: **Ahead** = documented and unusual for the genre in public material reviewed; **Parity** = comparable in-repo capability; **Behind** = clearly weaker today; **Unknown** = no evidence either way.

| Dimension | Infinite Match | Royal Match / Candy Crush class | Verdict |
| --- | --- | --- | --- |
| Level supply | Unlimited generated levels with solver witnesses | Authored catalogs at 16k+ levels with weekly drops | **Parity on count, behind on designed variety** |
| Board mechanics | Swaps, cascades, six boosters, four earned specials, one shield obstacle family | Many blocker families, bosses, combinations, bonus games | **Behind** |
| Objectives | Score, one- and two-colour collection, mixed, and clear-shields goals | Wider objective set including delivery and terrain | **Behind** |
| Meta and progression | Six kingdom rooms, six décor types, battle-pass config, weekly Hall Lanterns | Renovation, albums, card collection, milestones, multiple events | **Behind** |
| Live-ops cadence | Ten contiguous UTC weeks of Hall Lanterns through December 14, 2026 | Two-week authored content drops and rotating team/solo events | **Behind**; operating a reliable cadence is still an open gate |
| Social | Friends, guilds, best-score board, asynchronous tournaments | Team events, co-op, PvP (Match Masters) | **Behind** |
| Fairness and access | Free hints, guest play, shape and letter gems, reduced-motion and high-contrast settings, text board | Mixed; not reviewed in this pass | **Ahead on documented controls; competitor comparison Unknown** |
| Win integrity | Server-replayed v4/v5 classic and daily wins; booster-assisted results verified but unranked | Not publicly documented | **Unknown** (not reviewed; do not assume) |
| Platforms | Browser-tested; native and PWA not shipped | Native iOS and Android with cloud sync and billing | **Behind** |
| Polish and audio | Original vector art, 16 opt-in sound cues, no music | Mature art and music pipelines and large studios | **Behind** |
| Evidence of players enjoying it | No cohort, retention, store rating or device data | Large audience and public metrics | **Behind; this is the biggest unknown** |

## What "definitive on all platforms" would require

No single PR can satisfy this. The ordered path, based on the audit's P0 and P1 items, is:

1. **Measure the player first.** Run the [first-play and fairness study](WEB_FIRST_PLAY_STUDY.md) with real phones (20+ first-time and 30+ observed-loss sessions). Competitor comparisons without this are guesses.
2. **Make the web client installable.** Add a web app manifest and a conservative service worker that caches only the static shell, not game state or API responses. Verify with the existing browser smoke on a real Chromium. This is the smallest honest step toward "all platforms."
3. **Ship one native build end to end.** Produce a signed Android build from the Unity project with a licensed runner, install it on a real phone, and log cold-start and frame-time numbers. Then do iOS through TestFlight. Until then, the native platforms should be described as configured, not shipped.
4. **Add board variety behind a new rules version.** Prototype a second obstacle family or delivery objective (the audit's item 8), prove replay and no-booster witnesses, and test it on real players. Do not add PvP before server-authoritative scores hold up under abuse tests.
5. **Run an event cadence for at least one full season.** Publish and verify each week on time, and track entry and claim rates. A stale or empty event is a failed launch.
6. **Get store-visible proof.** Real store listings, ratings and crash-free-session numbers are the only fair basis for claiming to be the best. Until then the honest claim is "fairest and most accessible endless match-3 we can measure," not "definitive."

## What this pass did not do

- It did not play competitor builds or review their accessibility, fairness or win-integrity features.
- It did not run the browser smoke test (no Chromium in the sandbox).
- It did not verify any store listing, billing flow or device build.
- Competitor figures come from public third-party trackers that disagree with one another, and they are dated as of their pages' metadata, not as of today.
