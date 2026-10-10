# Passive procedural levels, local daily variants, time and weather

## What runs without a level designer

The playable **Phaser web client** and `/api/levels` use a single, versioned,
seeded generator. There are no per-level JSON files, monthly level batches,
AI prompts, paid inference calls, calendar API subscriptions, or daily cron jobs.
Levels are made and checked on demand.

- **Classic / Infinite Journey:** numbered levels with generated 6×6, 7×7 or 8×8
  boards, 4–6 gem types, monthly/seasonal gem mixes, score goals, and move budgets.
  There is no clock. The level browser generates another page whenever needed.
- **Timed:** generated boards with a 60-second clock and no move limit.
- **Endless:** one attempt, unlimited generated stages with finite goals. Reaching
  a goal automatically creates the next board. There is no clock or move limit;
  the **Bank Run** button finishes the run and submits its cumulative score once.
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
4. A goal below the simulated score and within a bounded move budget.

The client uses **exactly the same earned-special rules, refill PRNG, gem weights, column order and
scoring** as the certifier. Tests play the witness through the real Phaser game
methods and compare board/sprite state and score, not just generator metadata.
The target is 100–2,400 points and classic/daily budgets are 20–30 moves.

This is an existence proof of a winning path, not a promise that every choice
wins, that every puzzle is equally enjoyable, or that every human can meet a
60-second timed deadline. The current mechanics are score-based match-3;
obstacles, portals, and collection-goal mechanics are not introduced by this work.

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
definition's generator version; callers must preserve both grids and refill
state between actions. Two-coordinate witness actions are taps, four-coordinate
actions are swaps. Use these wrappers for new play instead of the legacy plain
`simulateMove`/`certifyBoard` functions. Hints estimate immediate effects, not the
optimal winning sequence. The rendered icons retain the base shape/letter and
use font-independent vector badges. Explore provides the icon/rule guide;
Space selects for keyboard combinations and Enter activates.

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
  its score goal never change mid-play. New attempts and the next endless stage
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
add a bounded move allowance; the usual **20–30 moves, 100–2,400-point goals and
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
| `GET /api/levels/daily?rulesVersion=3` | Current local daily time/weather variant |
| `GET /api/levels/12345?mode=classic&rulesVersion=3` | A generated numbered level (`classic`, `timed`, `endless`) |

All are public previews, marked `Cache-Control: private, no-store`. Invalid
numbers, time zones, countries and regional codes return 400. Definitions are
cached in a bounded server cache keyed by normalized calendar, clock/weather
bands, area and level. Fetch timestamps/small temperature changes do not alter
puzzle identity. Version 2 introduced time/weather seed rules; version 3 adds
earned specials and special-aware certification. The cache includes the rules version.

**Compatibility handshake:** omit `rulesVersion` to receive v2 (for deployed
plain-gem procedural clients); send numeric/string `2` or `3` explicitly to choose
a supported version. Unsupported values return 400 `unsupported_rules_version`.
The new browser always advertises 3. Frozen v2 board definitions and witnesses
remain unchanged, rather than recertifying an old paid goal under different rules.

Signed-in play obtains its definition **atomically with the energy spend**:

```json
{
  "level": 1,
  "mode": "daily",
  "rulesVersion": 3,
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
energy spending. Internal generation/tooling defaults to v3; untagged HTTP
procedural clients deliberately default to v2.

Normal/daily wins still use `POST /api/account-economy/level/complete`; endless
banking uses `/endless/complete`. Completion uses the stored target, not a new
calendar lookup, and validates/consumes the attempt under the player lock. Goals
and stars supplied by the client cannot change the payout. An attempt cannot
switch between normal/daily and endless reward paths. Existing reward caps,
energy cost, replay protection, and **3-hour paid-attempt expiry** remain in place;
bank an endless run before its paid attempt expires. The original policy of one
pending attempt per player is unchanged: paying for a new attempt replaces an
uncompleted earlier attempt, regardless of rules version.

The server still does not replay client moves for anti-cheat: a fabricated score
can earn the bounded payout once per paid attempt, as documented in README.
The solver certifies **level feasibility**, not the truth of a submitted score.

## Source and build

- `src/services/levels/generator.js`: versioned pure generator and dispatch/quality wrappers.
- `match-core.js`: frozen legacy PRNG/plain-gem simulation, retaining v2 compatibility.
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
Existing Unity sources/binaries are not rebuilt or wired to this API here; the
playable root web client is the integration covered by these tests.

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
