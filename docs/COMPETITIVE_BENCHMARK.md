# Infinite Match vs. Industry-Leading Match-3 Games

**Product:** Infinite Match — endless generated swap match-3 with kingdom renovation meta  
**Stack:** Phaser 3 web client (tested target), Unity WebGL/native builds (configured, not shipped), Node.js/Express backend  
**Comparison date:** 2026-10-31  
**Primary competitors:** Royal Match (Dream Games), Candy Crush Saga (King), Match Masters (Candivore), plus Gardenscapes/Homescapes (Playrix) and Toon Blast (Peak) for meta reference.

---

## 1. Executive summary

On the repo's own competitive audit (`docs/COMPETITIVE_STRATEGY.md`, snapshot 2026-10-11), Infinite Match ranks **4th of 4** on feature breadth against Royal Match (4.2), Candy Crush Saga (4.0) and Match Masters (3.9), averaging **2.3** across the ten ranked dimensions.

The honest bottom line: **Infinite Match's core swap match-3 is complete and tested (swaps, cascades, refill, reshuffle, earned specials, six inventory boosters), but everything that surrounds the board — obstacle variety, authored level design, live-ops cadence, social depth, native platforms, and audiovisual polish — is partial or missing.** Its genuine, defensible advantages are **supply without a level cap** (unlimited generated levels with solver witnesses), **free hints**, **guest-first play**, **server-verified result integrity**, and an **accessibility layer** (text board, reduced motion, high contrast, large text, keyboard) that competitors have not been assessed on.

This document bencharks Infinite Match against the genre leaders dimension by dimension, then gives a prioritized gap list.

---

## 2. Ranked feature matrix (per repository audit, 0–5)

| # | Dimension | Infinite Match | Royal Match | Candy Crush Saga | Match Masters |
|---|-----------|:---:|:---:|:---:|:---:|
| 1 | Core swap match-3 (swaps, cascades, refill) | **5** | 5 | 5 | 5 |
| 2 | Boosters and special items | **3** | 5 | 5 | 5 |
| 3 | Board obstacles and terrain | **1** | 5 | 5 | 2 |
| 4 | Objectives and design variety | **2** | 4 | 5 | 3 |
| 5 | Level supply and volume | **4** | 4 | 5 | n/a |
| 6 | Meta-progression and story | **3** | 5 | 3 | 3 |
| 7 | Live ops and event cadence | **2** | 5 | 5 | 4 |
| 8 | Social and asynchronous competition | **2** | 4 | 3 | 4 |
| 9 | Real-time PvP | **0** | 0 | 0 | 5 |
| 10 | Platforms and distribution | **3** | 5 | 5 | 4 |
| | **Average (rows 1–4, 6–10, 13)** | **2.3** | **4.2** | **4.0** | **3.9** |

*Row 12 (accessibility) scores Infinite Match at 4 but is excluded from the average because competitors were not assessed. Row 13 (audiovisual polish) is subjective and scored 2 for Infinite Match vs. 4 for each competitor.*

**Key takeaway from the audit itself:** even raising every Infinite Match sub-5 score by one point yields only a 3.2 average — still behind all three competitors. The gap is structural, not a few missing icons.

---

## 3. Dimension-by-dimension breakdown

### 3.1 Core swap match-3 — parity achieved
Infinite Match: swap adjacent gems, matches of 3+, cascades, gravity refill, no-moves reshuffle, 6×6–8×8 generated boards, 6 gem colors (red, blue, green, yellow, purple, orange). Four game modes: Classic (moves + 60s clock), Timed (60s clock only), Endless (no limits), Daily (themed variants).

Competitors: identical core. Royal Match, Candy Crush and Match Masters all execute this at 5/5.

**Verdict:** parity. The core is not the differentiator or the gap.

### 3.2 Boosters and special items — solid but shallow
Infinite Match (built & tested):
- **Earned specials:** 4-gem Beams, L/T Bursts, 5-gem Prisms, with deterministic combinations.
- **Inventory boosters (6):** Bomb (3×3), Rainbow (whole board), Lightning (column), Diamond (one colour), Target (plus shape), Star (row + column). Diamond/Target/Star arm on press, fire on next tap. Each costs one ordinary move, never inventory.
- Inventory backed by signed-in server counts with confirm-before-use; guests keep local counts.

Competitors:
- **Royal Match:** rockets, TNT, propellers, light balls, plus level-specific tools; combinations are a signature feel.
- **Candy Crush:** colour bombs, striped and wrapped candies, jelly fish, lollipop hammer, free switch, UFO, party boosters — one of the deepest booster kits in the genre.
- **Match Masters:** "20+ available boosters" per its Play listing, charged and used in live PvP.

**Verdict:** Infinite Match covers the essentials but lacks depth (no area-of-effect tiers, no limited-use level tools, no charging/pre-level loadout strategy). Score 3 vs. 5.

### 3.3 Board obstacles and terrain — the biggest board gap
Infinite Match: **one** obstacle family — v5 fixed two-hit shield overlay (numbered 1–2 layers, stays fixed while gems swap/fall/refill; cleared by actual clears over it, specials and inventory). Clear-shields objective exists. No jelly, chocolate, liquorice, marmalade, frosting, candy bombs, crates, birds, potion bottles, cabinets, magic hats, safes, mailboxes, or pigs. No terrain that blocks swaps, no delivery objectives, no true bosses.

Competitors:
- **Royal Match:** birds, crates, potion bottles, cabinets, diamonds, magic hats, coin safes, mailboxes, pigs — many interactive blockers plus bonus levels.
- **Candy Crush:** chocolate, liquorice locks, jelly, marmalade, frosting layers, candy bombs — one of the deepest obstacle sets, built over a decade.
- **Match Masters:** obstacles not documented in reviewed sources; scored conservatively at 2.

**Verdict:** Infinite Match is at 1/5. The v5 shield is a credible first slice (numbered, readable, server-verifiable), but a single fixed overlay does not create board texture. The repo's own roadmap (v6 board-variety plan, spreading blocker) is planned, not implemented.

### 3.4 Objectives and level-design variety — functional but repetitive
Infinite Match: score, single-colour collection, two-colour collection, mixed goals, clear-shields — all **procedurally generated**, each with a certified no-booster winning path, bounded move budget, no starting matches, and every tenth stage a harder "boss profile" (really just a higher target). No hand-authored levels, no delivery objectives, no timed objectives beyond the 60s clock, no boss mechanics with state or counterplay.

Competitors:
- **Candy Crush:** clearing jelly, dropping ingredients, target score, orders — thousands of authored levels with intentional pacing and "teach then test" design.
- **Royal Match:** bonus levels, varied event modes (Balloon Rise, Hidden Temple, Weekly Contest), 100 new levels every two weeks.
- **Match Masters:** solo-mode events described as difficult challenges; real-time PvP objectives.

**Verdict:** 2/5 for Infinite Match. Supply is infinite, but designed variety per level is not. A certified winning path is not a satisfying puzzle — this is the repo's own stated gap.

### 3.5 Level supply and volume — a genuine advantage
Infinite Match: unlimited generated levels (6×6 to 8×8, seeded, reproducible), solver witnesses on every definition, no authored-level cap. Daily variants at local midnight plus morning/afternoon/evening/night and forecast variants, season/holiday/weather theming.

Competitors:
- **Candy Crush:** 22,445+ levels across ~1,497 episodes (mid-2026 community data), 45–60 new weekly.
- **Royal Match:** 100 new levels every two weeks, new area cadence.
- **Match Masters:** PvP product, not a level catalogue.

**Verdict:** 4/5 — Infinite Match wins on raw availability; loses because generated ≠ designed variety. This is its strongest board-related asset.

### 3.6 Meta-progression and story — partial
Infinite Match: six kingdom rooms, each level 0→5 (base cost × level² in coins, star gates at 5/15/30/50 lifetime stars, power-ups at levels 3 and 5), six décor types (120–500 coins, up to 5 each, one per room), six illustrated room web scenes with skippable story beats, room coin bonus (+1% per level, capped +15%). Battle pass (free track open; premium track needs unpurchased `season_pass_premium` entitlement — no SKU exists). VIP benefit (1.5× coins) exists but nothing grants it.

Competitors:
- **Royal Match:** castle renovation, explorable rooms, star-gated areas — the meta is a reason to keep playing.
- **Gardenscapes/Homescapes:** room/garden restoration with characters, chapter narrative, choice-based decoration — the benchmark for "meta loop pulls you into the next puzzle."
- **Candy Crush:** map progression only, no castle meta.
- **Match Masters:** trophies, studios, sticker albums.

**Verdict:** 3/5. Functional renovation/decor loop, but no explorable world, no characters, no chapter narrative, and decoration is numeric/textual rather than scene-driven choice. Playrix-style meta is the clear reference point.

### 3.7 Live ops and event cadence — early stage
Infinite Match: one weekly event (Hall Lanterns, ten UTC windows Oct 5–Dec 14 2026, verified-win milestones, free coin milestones, kill switch, idempotent claims), daily reward wheel, battle-pass config, live-ops config (`config/liveops.json`), daily mini-games (Memory Match, Treasure Dig, Rhythm Tap, once per UTC day). Generic events/deals/tournaments/challenges arrays are empty; premium pass has no purchasable SKU.

Competitors:
- **Royal Match:** King's Cup, Sky Race, Team Battle, Lightning Rush, Balloon Rise, Hidden Temple, Weekly Contest; new levels/area every two weeks.
- **Candy Crush:** weekly level drops, rotating events, daily rewards.
- **Match Masters:** dynamic team-event schedule, Team vs Team, Friends Fiesta, Play Fest.

**Verdict:** 2/5. The skeleton is there (one operational event loop), but cadence is thin, no rotating event variety, no team events, no live-ops content pipeline proven at scale.

### 3.8 Social and asynchronous competition — thin
Infinite Match: display names (3–16 chars), friend codes, friend requests (accept required, 50 friend cap), guilds (30 members, ownership succession), best-score board, async score tournaments, community challenges, energy gifts (3 sent/3 received per UTC day, receiver cap pending). **No life/booster gifting, no co-op events, no real-time PvP.** Social state is a single JSON file (no shared DB store yet).

Competitors:
- **Match Masters:** friend challenges, team events, Friends Fiesta, real-time PvP (the differentiator).
- **Royal Match:** Team Battle, team tournaments.
- **Candy Crush:** sending lives to friends (per third-party guides).
- **Toon Blast:** teams, shared lives, cross-device sync.

**Verdict:** 2/5. Foundation exists; depth (gifting, cooperation, cross-device sync) does not.

### 3.9 Real-time PvP — absent
Infinite Match: none. Competition is asynchronous score comparison only.

Competitors:
- **Match Masters:** live turn-based PvP on a shared board, knockout tournaments — its core differentiator.

**Verdict:** 0/5, and the repo correctly treats live PvP as "a separate product bet, not a checkbox," requiring authoritative turns, matchmaking, reconnect and anti-cheat before consideration.

### 3.10 Platforms and distribution — web-first (decided)
Infinite Match: browser Phaser client is the tested target; installable PWA (manifest, 192/512/maskable icons, shell-only service worker) added but not browser/device-verified; install prompt did not fire in headless mode. Android (`AndroidManifest.xml`, GitHub Actions Unity builder) and iOS (`Info.plist`, macOS workflow) configured but **no APK/AAB, no Xcode project, no TestFlight, no live store listing**. Portal build scripts exist (Poki, Facebook, Snap, TikTok, Kongregate, CrazyGames) with no submission evidence. **Platform decision: web-first.** Stripe Checkout is the purchase path; native store billing, push, and cross-device offline sync are not promised until a native build ships to a store.

Competitors:
- **Candy Crush:** iOS, Android, Amazon, Facebook, Microsoft Store.
- **Royal Match:** Google Play and Amazon Appstore verified; App Store downloads reported by trackers.
- **Match Masters:** Google Play verified.

**Verdict:** 3/5. Web is real and is the committed platform; native and store presence remain "configured, not shipped." Cross-device billing, push, and offline sync are not promised.

### 3.11 Offline play and cloud sync — partial
Infinite Match: guest fallback supports certified offline play for temporary errors; signed-in level wins queue and re-send (one grant per attempt); no signed-in offline queue/reconciliation built; durable balances require `ECONOMY_STORE=mongo` (untested against live Mongo).

Competitors: Candy Crush and Royal Match offer cloud-saved progress and offline play (per listings, not re-verified in audit).

**Verdict:** 2/5. Not yet competitive with cloud-saved cross-device experiences.

### 3.12 Accessibility and free-play controls — a real strength (unassessed for competitors)
Infinite Match: free legal-swap hints, guest play (no account required), semantic named-cell text board, keyboard (arrow/Home/End) navigation, reduced-motion, high-contrast, large-text preferences, opt-in sound and haptics, 52px minimum scrollable cells, shape/letter gems, goal-aware hints. Scored 4/5, held back only by lack of screen-reader (VoiceOver/TalkBack/NVDA) and physical-device validation.

Competitors: **not assessed** in the audit, so excluded from ranking. This is arguably Infinite Match's most defensible differentiation if validated.

### 3.13 Audio and visual polish — subjective, early
Infinite Match: original vector gem shapes/badges, 16 short Web Audio cues (matches, specials, hints, stages, results), silent by default with versioned opt-in, volume/test controls, **no music**. Original six room web scenes exist but are first looks, not an explorable world.

Competitors: scored equally at 4 in the audit because no playtest/AV review was done; subjectively, Royal Match and Candy Crush benefit from years of production art, animation, and music.

**Verdict:** 2/5 subjective. Readable and original, but thin on music, animation depth, and character/brand identity.

---

## 4. Monetization and economy (not in the audit matrix, highly relevant)

| Area | Infinite Match | Genre norm |
|------|---------------|------------|
| Currency | Coins (server), stars (server); gems removed (nothing earns/spends them) | Coins + lives + boosters common |
| Booster sales | Inventory boosters earned; six playable effects with server receipts | Boosters commonly sold |
| Lives/energy | Energy gate: 1 per attempt, regens 1/min to 100, 10 coins/point refill, guests ungated | Lives gating is standard |
| Purchases | Coin packs via Stripe Checkout; Apple/Google receipt verification; loot boxes for coins | Standard store + app-store billing |
| Ads | Ad events logged but **revenue not counted from client**; no rewarded ads built | Rewarded ads for extra moves/lives are standard |
| Pass | Battle pass free track built; premium track has no SKU | Paid season passes common |
| Integrity | Replay-verified wins for v4/v5 classic/daily; booster-assisted results verified but **unranked**; only booster-free results enter boards/tournaments | Varies widely; cheating is a known genre problem |

**Verdict:** The economy plumbing is unusually rigorous (server prices, receipt verification, no client-trusted balances, refund reversal, no pay-to-escape levels by design). Missing: VIP purchase, season-pass SKU, rewarded ads, bundle/deal depth, cross-currency offers.

---

## 5. Trust and integrity — Infinite Match's clearest differentiation

Where most match-3 games trust client-reported scores, Infinite Match:
- Replays pinned move transcripts through the actual Phaser match-core for v4/v5 classic/daily wins.
- Derives booster effects server-side rather than trusting client clears.
- Separates `verified` from `ranked`: booster-assisted replays verify but do not rank; only booster-free results enter best-score boards/tournaments/challenges.
- Issues attempt-bound, one-charge inventory receipts with per-tap retry keys.
- Rejects malformed/incomplete collection reports before consumption.

Open gaps: timed and endless results remain client-reported and unranked; no secure timed deadlines or multi-stage endless verification; no live multi-server economy storage; false-rejection telemetry not yet added.

---

## 6. Gap analysis: what separates Infinite Match from the leaders

| Gap | Severity | What it would take |
|-----|----------|-------------------|
| Obstacle variety (1 family vs. 6–10+) | High | Implement v6 board-variety plan (spreading blocker + more families), prove replay/witnesses, test on real phones |
| Authored level design | High | Hand-crafted levels with teach/test pacing; generated supply is not enough |
| Live-ops cadence | High | Rotating weekly events beyond Hall Lanterns; team events; filled events/deals/tournaments arrays |
| Native builds & store presence | High | Ship signed Android build via Unity Cloud, iOS via TestFlight, store listings |
| Social depth | Medium | Life/booster gifting, co-op milestones, shared DB social store |
| Real-time PvP | Low (deferred) | Authoritative rooms, matchmaking, reconnect, anti-cheat — repo correctly defers |
| Audiovisual polish / music | Medium | Original music, animation, character/brand identity |
| Accessibility validation | Medium | VoiceOver/TalkBack/NVDA + physical device testing |
| Meta world & story | Medium | Explorable kingdom, characters, chapter narrative (Playrix benchmark) |
| Monetization breadth | Medium | VIP SKU, season-pass SKU, rewarded ads, deeper deals/bundles |

---

## 7. Prioritized recommendations (adopted from the repo's own roadmap)

**P0 — prove fun and close trust gaps (before monetizing difficulty):**
1. Run the first-play/fairness study with real phones (20+ first-time, 30+ observed-loss sessions). Synthetic tests are not player evidence.
2. Ship the v5 shield obstacle to real players; refine based on observed comprehension and fairness.
3. Make renovation visibly rewarding (completion, not just upgrade API calls).
4. Result integrity before consequential prizes: finish replay verification, false-rejection telemetry, durable multi-server storage.

**P1 — give each win a reason; run one dependable event:**
5. Operate one reliable weekly event loop end-to-end (publish, verify, rotate before Dec 14 2026; don't let the schedule go stale).
6. Tuning/observability: one controlled, versioned difficulty adjustment only after preregistered guardrails (first-play, fairness, D1/D7 return, completion, crash-free sessions) are measured.

**P2 — only after P0/P1 hold:**
7. Team cooperation (limited, abuse-resistant gifts/milestones) after durable shared social storage. Real-time PvP is a separate product bet.
8. Broader obstacles/objectives, episodic world, cosmetic collections, platform distribution.
9. Optional experiments: premium pass/subscription, rewarded ads — with clear opt-in, transparent odds/prices, no forced interstitials; never monetize hints or accessibility.

---

## 8. Honest positioning statement

Until the gaps above are closed, the defensible claim for Infinite Match is not "the best match-3 on the market." It is:

> **An endlessly replayable, readable, fair-feeling match-3 adventure with unlimited generated levels, free hints, guest-first play, server-verified results, and an accessibility-first web client — playable without an account.**

That is a real niche (especially for web-first, privacy-sensitive, accessibility-conscious players), but it is not yet competitive on board richness, live-ops volume, social depth, or native distribution with Royal Match, Candy Crush Saga, or Match Masters.

---

### Sources used
- Repository: `README.md`, `docs/COMPETITIVE_STRATEGY.md`, `docs/PLAYER_EXPERIENCE.md`, `docs/BOARD_VARIETY_V6_PLAN.md`, `phaser3-game.js`, `src/services/levels/*`, `config/*` (audited from local checkout).
- Competitor facts: public store listings and wikis cited in `docs/COMPETITIVE_STRATEGY.md` (Royal Match Google Play/Amazon, Candy Crush Saga wiki/riftwoodstudio, Match Masters Google Play/naavik, Dream Games site). Tracker figures (spend, MAU, level counts) are dated and disagree across sources; none should be used for launch promises.
- No competitor builds were playtested; this is a repository-inspection + public-source comparison, not hands-on QA.