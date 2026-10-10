# Passive procedural levels and local daily challenges

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
  Players with the same normalized date/location context get the same challenge.

Difficulty cycles through gentler and harder profiles. Every tenth numbered
stage is a harder boss profile, not a new boss combat mechanic. Scores do not
keep growing linearly until levels become impossible. Any positive safe integer
is supported (JavaScript's numeric representation limit is 9,007,199,254,740,991,
not an authored level cap).

## Automatic quality gate

Every definition has:

1. No pre-existing three-in-a-row matches.
2. At least one legal opening swap.
3. A deterministic simulation of a successful path, including cascades, refills,
   and free deadlock repairs, without purchasing or using boosters.
4. A goal below the simulated score and within a bounded move budget.

The client uses **exactly the same refill PRNG, gem weights, column order and
scoring** as the certifier. Tests play the witness through the real Phaser game
methods and compare board/sprite state and score, not just generator metadata.
The target is 100–2,400 points and classic/daily budgets are 20–30 moves.

This is an existence proof of a winning path, not a promise that every choice
wins, that every puzzle is equally enjoyable, or that every human can meet a
60-second timed deadline. The current mechanics are score-based match-3;
obstacles, portals, and collection-goal mechanics are not introduced by this work.

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
  so the daily seed does not change at 6 p.m.
- The preview updates at local midnight and when the tab regains focus. An active
  attempt is never reset mid-game. Its context stays fixed, including all stages
  of an endless run; a new attempt picks up the new day or changed preferences.

The bundled calendar covers 207 countries/territories, with state/province rules
where available. Unknown country estimates still get local-date seasonal boards.
Calendar coverage and newly declared one-off holidays depend on upstream data.
The library documents Islamic-date coverage for 1970–2080 (moon sighting may
change the actual observance) and Hebrew dates for 1970–2100; normal dependency
updates may be needed for policy changes.
No manual **level design** is needed, but this does not eliminate ordinary software
or calendar-data maintenance.

## Privacy and offline play

No GPS permission, latitude/longitude, IP geolocation, geocoder, or paid location
service is used. Explicit preferences live in local storage on that device.
Only coarse date/region context accompanies the generated paid attempt in the
existing account-economy store; no separate location-tracking database is created.
Changing region settings does not change an already purchased attempt.

Anonymous players can play without spending server energy or earning server
rewards. If the server is unavailable, guests still get locally seeded, playable
seasonal boards. Full regional holiday data is server-side; the offline fallback
uses same-day cached holiday context when available and never recycles yesterday's
holidays. Signed-in rewarded play does not fall back to a client-authored goal.

## API

Common optional location parameters:

```
timeZone=America/New_York&country=US&region=PA&hemisphere=north&holidayThemes=true
```

Omit country/hemisphere to use the coarse time-zone estimate. Omit region for
country-wide holidays. Precise coordinates are neither used nor needed.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/levels/context` | Current local date/month/season, regional holidays, next local midnight |
| `GET /api/levels/regions?country=US` | Country catalog and optional state's/province's supported codes |
| `GET /api/levels/daily` | Today's complete generated daily definition |
| `GET /api/levels/12345?mode=classic` | A generated numbered level (`classic`, `timed`, `endless`) |

All are public previews, marked `Cache-Control: private, no-store`. Invalid
numbers, time zones, countries and regional codes return 400. Definitions are
cached in a bounded server cache keyed by normalized local context and level.

Signed-in play obtains its definition **atomically with the energy spend**:

```json
{
  "level": 1,
  "mode": "daily",
  "location": {
    "timeZone": "America/New_York",
    "country": "US",
    "region": "PA"
  }
}
```

Send this to `POST /api/account-economy/energy/spend`. The response includes
`attemptId`, numeric `level`, energy, and `generatedLevel`. Daily starts at 1;
endless must start at 1 and keeps that attempt while progressing through stages.

Normal/daily wins still use `POST /api/account-economy/level/complete`; endless
banking uses `/endless/complete`. Completion uses the stored target, not a new
calendar lookup, and validates/consumes the attempt under the player lock. Goals
and stars supplied by the client cannot change the payout. An attempt cannot
switch between normal/daily and endless reward paths. Existing reward caps,
energy cost, replay protection, and **3-hour paid-attempt expiry** remain in place;
bank an endless run before its paid attempt expires.

The server still does not replay client moves for anti-cheat: a fabricated score
can earn the bounded payout once per paid attempt, as documented in README.
The solver certifies **level feasibility**, not the truth of a submitted score.

## Source and build

- `src/services/levels/generator.js`: pure generator, PRNG, board simulator and quality gate.
- `location-context.js`: location validation, local civil dates/DST and holiday calculation.
- `time-zone-regions.js`: public-domain IANA country/hemisphere estimates, not player coordinates.
- `level-service.js`: bounded generated-definition cache.
- `src/routes/levels.js`: public API.
- `public/js/level-location.js`: preferences, regional settings, daily preview refresh and guest fallback.
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
