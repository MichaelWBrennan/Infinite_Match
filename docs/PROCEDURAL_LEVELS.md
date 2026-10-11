# Passive procedural levels, local daily variants, time and weather

## What runs without a level designer

The playable **Phaser web client** and `/api/levels` use a single, versioned,
seeded generator. There are no per-level JSON files, monthly level batches,
AI prompts, paid inference calls, calendar API subscriptions, or daily cron jobs.
Levels are made and checked on demand.

- **Classic / Infinite Journey:** numbered levels with generated 6×6, 7×7 or 8×8
  boards, 4–6 gem types, monthly/seasonal gem mixes, score/collection goals, and move budgets.
  There is no clock. The level browser generates another page whenever needed.
- **Timed:** generated boards with a 60-second clock and no move limit.
- **Endless:** one attempt, unlimited generated stages with finite goals. Reaching
  every declared stage goal automatically creates the next board. There is no clock or move limit;
  the **Bank Run** button finishes the run and submits its cumulative score once.
  Signed-in attempts expire for rewards after 3 hours. An optional local Play
  preference (off by default) banks at a completed stage when the run reaches
  100,000 points (the current 500-XP cap) or about 2h45m, then starts a fresh
  one-energy run in the same app **only after a confirmed bank**. It never buys
  energy or auto-refills. An uncertain payout is retried once with the same
  attempt ID and score; a duplicate receipt returns the original reward. If
  banking is refused, the player gets a clear result instead of another charge. Guest stages still
  advance without account spending or a clock. This is a bounded paid-run
  checkpoint, not a guarantee of literal infinity, uninterrupted offline
  account rewards, or a verified Endless score.
- **Today's Local Level:** a new daily seed/ID at the player's next local midnight.
  It is a real generated board, not a date mapped into a fixed bank of 300 levels.
  Morning/afternoon/evening/night and forecast bands now produce separate daily
  variants, each with its own ID. Same date, area and normalized environment
  produce the same puzzle; tiny changes within a weather band do not reshuffle it.

Difficulty cycles through gentler and harder profiles. Every tenth numbered
stage is a harder boss profile, not a new boss combat mechanic. Scores do not
keep growing linearly until levels become impossible. Any positive safe integer
is supported (JavaScript's numeric representation limit is 9,007,199,254,740,991,
not an authored level cap).

## Automatic quality gate

Every definition has:

1. No pre-existing three-in-a-row matches.
2. At least one legal opening swap.
3. A deterministic simulation of a successful path, including earned specials/combination chains, cascades, refills,
   and free deadlock repairs, without purchasing or using boosters.
4. Every declared objective is satisfied by that same no-inventory witness within the bounded move budget; collection colors/targets are derived from actual witnessed clears.

The client uses **exactly the same earned-special rules, refill PRNG, gem weights, column order and
scoring and cleared-color accounting** as the certifier. Tests play the witness through the real Phaser game
methods and compare board/sprite state, score and persistent collection progress, not just generator metadata.
The score-rating baseline is 100–2,400 points and classic/daily budgets are 20–30 moves.

This is an existence proof of a winning path, not a promise that every choice
wins, that every puzzle is equally enjoyable, or that every human can meet a
60-second timed deadline. The current mechanics are score/collection/shield-based match-3; other blockers,
delivery goals, portals and boss combat are not implemented.

## Earned specials — shared rules v3

New boards start with ordinary gems and earn specials through play, with no inventory requirement:

| Match / use | Effect |
| --- | --- |
| Four in a row / column | Row Beam / Column Beam clears its row / column |
| L/T or intersecting runs | Burst clears a clipped 3×3 area |
| Five or more in a line | Prism clears a color |
| Tap / Enter on a special | Activate; a Prism uses its own base color |
| Adjacent swap involving a special | Activate after swapping; a Prism uses the other gem's color |
| Beam + Beam | One row and one column centered on the swap destination |
| Beam + Burst | Three rows and three columns centered on the destination |
| Burst + Burst | Clipped 5×5 centered on the destination |
| Prism + Beam / Burst | Convert ordinary gems of the partner color into that special, then fire them and the partner |
| Prism + Prism | Clear the whole board |

One special is earned per connected match group; precedence is Prism > Burst >
Beam. Prefer the swapped destination, then source, then a deterministic eligible
anchor; never overwrite an existing special. The anchor survives its creation
wave (so four creates a special and clears/scores three cells), but can chain in
later waves. Old specials hit by an effect fire once per wave. Match scoring is
cleared cells × 10 × cascade wave number. Cascades are bounded at 64; free stable
board repair handles pathological refills/deadlocks. A remaining special is
itself a legal action, so plain-swap deadlock must not erase it unnecessarily.

Every successful swap, tap or combination spends **one ordinary move**, with no
inventory charge. Timed/endless still have no practical move limit. Inventory
boosters remain a separate server-authoritative system: their base award is
retained, extra special-chain clears score normally, and their use does not
spend an ordinary move. No energy cost/reward or inventory price is changed.

The model is a color board plus a parallel `specials` grid (null/row/column/burst/prism).
`levelActions`, `simulateLevelMove` and `certifyLevel` dispatch by the frozen
definition's generator version; callers must preserve both grids, refill state
and v4/v5 `objectiveProgress` (plus v5 `shields`) between actions. Two-coordinate witness actions are taps, four-coordinate
actions are swaps. Use these wrappers for new play instead of the legacy plain
`simulateMove`/`certifyBoard` functions. Hints estimate immediate effects, not the
optimal winning sequence. The rendered icons retain the base shape/letter and
use font-independent vector badges. Explore provides the icon/rule guide;
Space selects for keyboard combinations and Enter activates.


## Fixed shield tiles — shared rules v5

Every fourth numbered level from level 4 and some seeded daily variants introduce up
to three shields on fixed board cells. A number on each blue-white border shows one
or two hits remaining. A gem clears normally on that cell (including with earned
specials or confirmed inventory boosters), removes one layer and refills; the shield
**stays on the cell**, not the gem. Later cascades may hit it again. Protected
special anchors, refills, no-move repairs and invalid swaps never hit a shield.
A shield is gone at zero; only this removal counts toward `shieldsCleared`. No
additional move, charge, score or random draw is introduced by the terrain.

V5 `clear-shields` objectives target **all shields on the original board**, with
an optional score goal. Every placement is selected from cells actually cleared
sufficient times by the deterministic no-inventory witness; the witness is
replayed through v5 transitions to verify the goals. The other stages continue
to use the v4 goal families under v5's seed. This proves feasibility, not human
balance. Hints prefer remaining shield hits; names and HUD say how many hits
remain and how many shields are gone. Optional v5 presentation snapshots capture
the first three shield waves without altering the deterministic resolver. A fixed
numbered terrain overlay stays in its cell while gems fall; each hit updates its
remaining number in place. Reduced-motion/text-board modes use immediate results.
This is not a screen-reader/device or human-comprehension sign-off.

Older v2/v3/v4 definition IDs, generator output, paid attempts and score/goal
behavior remain frozen. V5 clients carry `shields` in the transition state and
send `{collected: {...}, shieldsCleared: integer}` for a paid win. The server
requires a bounded count between zero and the original number of shields, and
checks every pinned goal. Current v4/v5 classic/daily clients also submit pinned
moves for deterministic server replay (including attempt-bound inventory receipts)
before a result is `verified`. Old clients, timed and endless paths can still
receive existing account rewards without replay, but not competitive progress;
this does not prove human play or safe consequential prizes. See the competitive
replay boundary below.

## Varied objectives — shared rules v4

Production objectives are **composed by rules**, never authored per level:

| Profile | Required to win |
| --- | --- |
| Score | Reach the displayed score target |
| Collect | Clear the displayed count of one gem color |
| Collect pair | Clear both displayed color targets |
| Score and collect | Meet both score and collection targets |

Numbered classic/timed/endless levels begin with score onboarding, then one-color
collection at levels 2–3; later profiles follow a deterministic cycle. Daily
profiles are selected from the daily variant's seed rather than campaign progress.
Colors must appear in the certified palette and witness. Targets are bounded,
rounded in steps of five, and calibrated below/equal to witnessed clears (early
single-color cap 25, pair cap 45 per color, later single/mixed cap 70). Every
served definition checks that **all** goals are satisfied by its no-inventory
witness. Synthetic board fixtures are tests only, not a production content bank.

Collection counts **actual unique cleared cells per wave**, using each gem's base
color before gravity. Matches, cascades, earned activations/combinations and
optional inventory clears all count. A surviving newly earned anchor, merely
spawning a gem, converting a Prism partner without clearing it, or a free repair
never grants collection. Inventory base score awards do not create artificial
collection. Pure simulation returns clear deltas and a new accumulated state:

```json
{ "collected": { "red": 12, "blue": 4 } }
```

This is `objectiveProgress`, not the objectives themselves. Pass it with board,
specials and `refillState` into `simulateLevelMove`/`simulateObjectiveClear` and
retain the returned progress. New attempts/replay reset it; endless resets it at
each completed stage and preserves the original paid attempt/rules version.
Banking a partial endless stage remains allowed and uses the unchanged cumulative
score payout, not stage-completion rewards.

**No hidden win requirement:** on collection-only levels, `targetScore` is only a
rating baseline. Completing collection earns at least one star. Two/three stars
still require score ≥1.5×/2× that baseline and every goal complete; the existing
coin/XP reward table is unchanged. A mixed level explicitly displays both goals.
An unfinished collection cannot be bypassed with a huge score.

The mobile HUD uses color **plus shape and letter**, named counters, per-goal
completion and a meter averaged across all required goals. Win/loss summaries
show what remained; Explore → Level goal guide explains counting, extra-star
thresholds and the frozen local variant. Hints prefer immediate useful progress
on unfinished goals without advancing RNG or spending anything, but do not
simulate every full cascade or promise an optimal winning strategy. Short-screen
context text is compact; its full accessible label and guide retain the details.

## Local day, month, season and holidays

The server chooses the date using its current instant and the player's **IANA
time zone**, not the server's calendar date or a client-authored date string.
Midnight is calculated across DST, including 23/25-hour days and non-hour offsets.

- Browser time zone supplies a coarse country/hemisphere estimate from public
  IANA tzdb metadata. It does **not** prove the player's physical location.
- **Settings → Local levels** can correct the time zone, holiday country,
  state/province, hemisphere, or turn off holiday themes.
- Northern and southern meteorological season palettes are reversed. This is a
  four-season visual calendar, not a weather/climate forecast; tropical/equatorial
  players may prefer a manual hemisphere choice or seasonal themes without holidays.
- Month, season, location and local date participate in generation. Months change
  the gem mix; holidays change the visual theme, favored gem and resulting board.
- Regional public holidays and observances come from `date-holidays`, including
  recurring, moving, observed and lunar-calendar dates supported by that library.
  For example, US Thanksgiving is calculated as the fourth Thursday in November.
- An observance starting in the evening (Halloween) themes the **whole local day**,
  independently of clock/weather variants; Halloween remains the holiday identity
  in both morning and evening boards.
- The preview updates at the next clock/day/forecast boundary and when the tab
  regains focus. It does not poll when the page is hidden. An active board and
  its objectives never change mid-play. New attempts and the next endless stage
  pick up new time/weather/preferences without extra energy charges for stages.

The bundled calendar covers 207 countries/territories, with state/province rules
where available. Unknown country estimates still get local-date seasonal boards.
Calendar coverage and newly declared one-off holidays depend on upstream data.
The library documents Islamic-date coverage for 1970–2080 (moon sighting may
change the actual observance) and Hebrew dates for 1970–2100; normal dependency
updates may be needed for policy changes.
No manual **level design** is needed, but this does not eliminate ordinary software
or calendar-data maintenance.

## Privacy and offline play

Normal play requests **no location permission**. The default weather area is a
public IANA representative point (or a country reference area), not proof of the
player's town or holiday state. Settings can optionally request device location
**only on the player's button press**, or accept a manually entered approximate
area. Both coordinates are rounded on-device to a **1° grid** (~111 km north/south)
before transmission/storage; the server independently rounds crafted requests too.
Exact GPS coordinates are discarded, not stored or forwarded. Disabling weather
stops forecast requests and omits the saved device-area coordinates from gameplay
requests. Clear the approximate area and Apply to remove it from preferences.

Explicit preferences remain device-local. Coarse date/region/forecast context is
stored with an active paid attempt in the existing economy store; no separate
player-location history/database is created. The feed is accessed through the
server, so the provider receives the server's IP and coarse area, not player
IP addresses, account IDs or authorization tokens. These controls apply to the
procedural feature, not the separate legacy realtime/location APIs.

Anonymous players can play without server energy/rewards. When disconnected,
clock and seasonal generation continue; holidays use matching same-day context
only, and weather uses only an **unexpired forecast for matching preferences and
area**. Missing/stale/unreachable forecasts are labeled unavailable, never replaced
by invented observations. Signed-in rewarded starts still require server authority.

## Time-of-day and real forecast effects

Four fixed **local clock periods**, not astronomical sunrise/sunset:

| Period | Local hours | Typical generation effect |
| --- | --- | --- |
| Morning | 06:00–11:59 | More yellow/green gems, warm visual tint |
| Afternoon | 12:00–17:59 | More orange/yellow gems |
| Evening | 18:00–21:59 | More red/purple gems, a small move allowance |
| Night | 22:00–05:59 | More purple/blue gems, at least five types, dark visual tint |

Rain/snow/sleet favor cooler gems; storms use six gem types; fog favors warmer,
readable colors without obscuring the board. Cold/hot temperatures and wind
adjust weights when the corresponding colors are present. Wet/stormy profiles
add a bounded move allowance; the usual **20–30 moves, 100–2,400-point score-rating baselines and
60-second Timed limit** remain. Every altered board is certified again. No weather
hazard can block input, demand a booster or mutate an active paid target.

The default is **MET Norway Locationforecast 2.0**, a free public global model
forecast with CC BY 4.0 attribution. It is **forecast data**, not exact-town
observations or safety advice. Requests carry the application's identifying
User-Agent and are deduplicated, cached until provider `Expires`, conditionally
revalidated with `If-Modified-Since`, and bounded by a 1.8-second timeout. Errors,
capacity and throttling use neutral weather rather than interrupt gameplay.

Configuration (no API key needed for MET Norway):

```dotenv
LEVEL_WEATHER_PROVIDER=metno
# Use your operator contact URL/email for production identification.
LEVEL_WEATHER_USER_AGENT=InfiniteMatch/2.0 github.com/MichaelWBrennan/Infinite_Match
LEVEL_WEATHER_CACHE_AREAS=512
LEVEL_WEATHER_REQUESTS_PER_SECOND=4
```

`LEVEL_WEATHER_PROVIDER=off` disables the feed. Tests default to `off`; adapter
tests use recorded-format fixtures and a local HTTP server, not external internet.
The sandbox cannot reach the real MET host, so the live external feed has **not**
been verified here. Normal deployments must permit outbound HTTPS to `api.met.no`.

For a FOSS/self-hosted **Open-Meteo-compatible** endpoint:

```dotenv
LEVEL_WEATHER_PROVIDER=open-meteo
LEVEL_WEATHER_OPEN_METEO_URL=http://weather:8080/v1/forecast
```

Only operator configuration can choose the URL; players cannot cause arbitrary
URL fetches. The Open-Meteo server is AGPL-3.0. Its hosted free endpoint is
**non-commercial**; commercial operators must self-host or use a properly licensed
hosted endpoint. It is not silently used as this game's commercial default.

The cache is bounded (512 areas by default, configurable 1–4,096), with at most
two concurrent fetches and four starts/second per process. Fresh entries are not
evicted just to refetch them before provider expiry. At scale, centralize this
adapter/cache behind a shared weather gateway or reduce each worker's request
budget: MET's limit is **20 requests/second across the whole application**, not
per player/worker. Public feeds have fair-use requirements and no availability SLA.
Source/license, transformations and provider policy are linked in Settings and
[the weather attribution notice](../public/licenses/weather.txt).

## API

Common optional location parameters:

```
timeZone=America/New_York&country=US&region=PA&hemisphere=north&holidayThemes=true
```

Omit country/hemisphere to use the coarse time-zone estimate. Omit region for
country-wide holidays. Optional `timeOfDayEnabled=false`, `weatherEnabled=false`,
and paired `weatherLatitude`/`weatherLongitude` select effects/coarse weather area.
Exact coordinates are never needed; precision is discarded. Client-authored hours,
weather conditions, dates and endpoint URLs are ignored.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/levels/context` | Local date/season/holidays, clock period, forecast bands/source and next variant boundary |
| `GET /api/levels/regions?country=US` | Country catalog and optional state's/province's supported codes |
| `GET /api/levels/daily?rulesVersion=5` | Current local daily time/weather variant |
| `GET /api/levels/12345?mode=classic&rulesVersion=5` | A generated numbered level (`classic`, `timed`, `endless`) |

All are public previews, marked `Cache-Control: private, no-store`. Invalid
numbers, time zones, countries and regional codes return 400. Definitions are
cached in a bounded server cache keyed by normalized calendar, clock/weather
bands, area and level. Fetch timestamps/small temperature changes do not alter
puzzle identity. Version 2 introduced time/weather seed rules; version 3 adds
earned specials and special-aware certification; version 4 adds shared collection
objectives/progress; version 5 adds fixed shield tiles and clear-shields goals. The cache includes the rules version.

**Compatibility handshake:** omit `rulesVersion` to receive v2 (for deployed
plain-gem procedural clients); send numeric/string `2`, `3`, `4` or `5` explicitly to choose
a supported version. Unsupported values return 400 `unsupported_rules_version`.
The new browser always advertises 5. Full frozen v2/v3/v4 definitions and witnesses
remain unchanged, rather than recertifying an old paid goal under different rules.

Signed-in play obtains its definition **atomically with the energy spend**:

```json
{
  "level": 1,
  "mode": "daily",
  "rulesVersion": 5,
  "location": {
    "timeZone": "America/New_York",
    "country": "US",
    "region": "PA"
  }
}
```

Send this to `POST /api/account-economy/energy/spend`. The response includes
`attemptId`, numeric `level`, energy, and `generatedLevel`. Daily starts at 1;
endless must start at 1 and keeps that attempt while progressing through stages,
using the original attempt's rule version. Unsupported versions are refused before
energy spending. Internal generation/tooling defaults to v5; untagged HTTP
procedural clients deliberately default to v2.

Normal/daily wins still use `POST /api/account-economy/level/complete`; endless
banking uses `/endless/complete`. Completion uses the stored definition/objectives, not a new
calendar lookup, and validates/consumes the attempt under the player lock. Goals
and stars supplied by the client cannot change the payout. An attempt cannot
switch between normal/daily and endless reward paths. Existing reward caps,
energy cost, replay protection, and **3-hour paid-attempt expiry** remain in place;
bank an endless run before its paid attempt expires. The original policy of one
pending attempt per player is unchanged: paying for a new attempt replaces an
uncompleted earlier attempt, regardless of rules version.

For v4 collection/mixed wins, send `objectiveProgress` alongside `level`, `score`
and `attemptId`. The strict shape is `{collected: {...}}`: palette keys only,
nonnegative safe integers ≤1,000,000 per color; omitted palette entries count as
zero. Goals/targets/stars in the request are never trusted. V4 score-only goals
can omit progress. V5 paid wins send the strict shape `{collected: {...}, shieldsCleared: 0..originalShieldCount}`; even score-only v5 play keeps this state locally. V2/v3 remain score-only and require no new counters.

Missing collection progress returns `objective_progress_required`; malformed
progress returns `invalid_objective_progress`; unmet score returns
`score_below_target`; unmet colors return `objectives_incomplete`. Invalid or
incomplete claims do not consume the pending attempt. Concurrent identical
claims pay once and return the original receipt on retry; a different score,
progress or transcript for that attempt is rejected. Validation and the capped
XP/level-up, coin/star, statistics, weekly-win and season grants now share one
revision-guarded economy write under the player lock. The last 32 receipts are
retained; older attempts are rejected, never repaid. The browser retries an
uncertain payout once using the identical request body. The separate social
score file can lag an economy commit; a pinned, replay-verified receipt can
reapply its tournament/challenge contribution idempotently on retry, but there
is no background delivery or multi-server social store yet.

### Competitive replay boundary

For a v4/v5 **classic or daily** win, the web client sends `moves` with `level`,
`score`, `objectiveProgress` and `attemptId`. `moves` is an ordered array of
zero-based two-integer taps (`[row,col]`), four-integer swaps
(`[row,col,row,col]`) and optional inventory actions such as
`{receiptId, type: 'target', target: [row,col]}`. Rainbow has no target;
lightning uses `[0,column]`. The server re-simulates from the **paid, pinned
definition** under the same per-player lock as attempt consumption. An ordinary
move spends one budget slot; inventory actions spend no move, but must each
match a unique server-minted receipt on this attempt. A transcript has at most
`definition.moves + issuedReceipts` actions (at most 20 receipts). It must end
at the first goal-completing action with exact score and collection/shield
counters. Invalid transcripts return `invalid_move_history`,
`unused_powerup_receipt` or `replay_result_mismatch` without consuming the
pending attempt. Duplicate completions cannot pay or contribute again.

For the six playable inventory effects (bomb, rainbow, lightning, diamond,
target, star), the signed-in client sends `attemptId` to `/powerup/use`. Under
the player lock, one charge is deducted and an opaque `receiptId` is saved on
the pending attempt in the same update. The client records the receipt and
selected cell/column, not a client-authored list of affected cells or score.
Server replay computes the effect's cells, points, cascades, refill, earned
specials and shields from the current board. Forged/reused/cross-attempt
receipts and impossible targets cannot enter a verified replay. A legacy spend
without `attemptId` is marked **untracked** on the pending attempt and cannot
enter competitive boards, even if the client later submits a pure-move path.
For current classic/daily clients, the spend also carries a per-tap `useId` (8–64
ASCII letters/digits/`_`/`-`) bound to that paid attempt. Repeating the same
`attemptId + useId + powerupId` returns the **same receipt and original counts**
without another charge, even if the inventory is now empty or requests race.
Reusing the key for another power-up is refused; a new attempt cannot recover
the old receipt. The client retries a network/response failure **once with the
same key** and applies the effect only after confirmation. A late response is
never applied to a replacement board. Legacy calls without `useId` keep their
existing per-call spending behavior. If both attempts fail, the client omits the
transcript and can still claim an unverified ordinary reward; no automatic
refund is promised for a charge whose receipt could not be recovered. A random
instant booster target is reported by the client and geometry-checked, **not**
proven randomly chosen.

The response separates `verified` (the reported path was replayed) from
`ranked` (eligible for competition). A receipt-backed booster win can be
`verified: true, ranked: false`: purchased help is deliberately **not** admitted
to friend/guild best scores, tournaments or shared challenges. A booster-free
replay with no untracked spends returns `verified: true, ranked: true` and may
contribute to those boards. Older clients, v2/v3 definitions, timed levels,
endless runs and wins without a transcript still receive existing one-time
payouts but return `verified: false, ranked: false`. Timed play relies on a
client clock; endless banking and account personal statistics still use
bounded *client-reported* scores. Missing transcripts can therefore still
fabricate bounded account rewards once per paid attempt. No clock, human input,
random-booster placement or bot resistance is proven by a reachable transcript:
the level definition and winning witness are public. Before consequential
prize launches, address these remaining economy gaps, time enforcement and
multi-server durable storage.

On upgrade, the social store's schema v2 discards *previously unverified* best
scores, tournament scores and shared challenge progress. Profiles, friends,
guilds and **payout receipts** are retained, so already-claimed prizes cannot be
claimed twice. Do not merge old rank data back into the verified board. The
solver still certifies level feasibility rather than human enjoyment.

## Source and build

- `src/services/levels/generator.js`: versioned pure generator and dispatch/quality wrappers.
- `match-core.js`: frozen legacy PRNG/plain-gem simulation, retaining v2 compatibility.
- `objective-rules.js`: shared composition, strict progress, counting wrappers, hints, all-goal completion, ratings and certification.
- `special-rules.js`: pure earning, activation, combinations, origin/event tracking and special-aware certification.
- `location-context.js`: coarse preferences, local civil dates/DST and holidays.
- `environment.js`: shared pure clock periods and weather/temperature/wind rules.
- `weather-context.js`: forecast adapters, validation, coalescing, backoff and cache.
- `time-zone-weather-points.js`: public representative weather areas, not player GPS.
- `time-zone-regions.js`: public-domain IANA country/hemisphere estimates, not player coordinates.
- `level-service.js`: bounded generated-definition cache.
- `src/routes/levels.js`: public API.
- `public/js/level-location.js`: preferences, explicit rounded-area opt-in, forecast refresh and offline fallback.
- `phaser3-game.js`: seeded board/refill integration, daily play and endless stage progression.

`npm run build` derives `public/js/procedural-levels.js` from the exact server
source, then runs TypeScript. Do not edit that generated browser asset manually.
Legacy clients that omit `mode` on energy/spend retain the old reward rules and
legacy tuning endpoints. The new generator does not pool date/region variants
into legacy per-number difficulty reports; it calibrates every board independently.
Generated v4/v5 classic/daily paid starts and replay-verified wins now have a
separate, aggregate-only [difficulty observation guide](DIFFICULTY_OBSERVATIONS.md).
The legacy self-reported tuning pool is still separate; its schedule can propose
reviews but no longer applies changes automatically. Older legacy targets are
pinned when energy is spent so changing the override file cannot alter that
in-flight attempt. Neither generated board difficulty nor paid objectives are
auto-tuned. Existing Unity sources/binaries are not rebuilt or wired to this API
here; the playable root web client is the integration covered by these tests.

## Open-source calendar attribution

`date-holidays` by **commenthol**: https://github.com/commenthol/date-holidays.
Code is ISC. Its shipped LICENSE identifies calendar data as **CC BY-SA 3.0**
(with Wikipedia-source attributions), although npm metadata says CC-BY-3.0.
The shipped LICENSE is preserved in [the full third-party notice](../public/licenses/date-holidays.txt)
and linked from the player's local-level settings. The build refreshes this
notice from the installed package automatically.
Calendar-derived labels/metadata retain their data license; the procedural
puzzle generator and in-repo code follow the repository license. Calendar rules
are not modified; this application filters public/observance dates and formats
local-day metadata. IANA `zone.tab` metadata is public domain.

The maintained holiday parser uses Moment Timezone internally as a transitive
calendar dependency. Gameplay/date helpers remain on Day.js and native Intl;
there is no direct Moment dependency in application code.
