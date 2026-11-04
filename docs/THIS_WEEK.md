# This week: event, rhythm, and offline play

Bet #4 adds one calm return screen instead of a pressure loop. **This week** is
available from the title screen and Explore. It combines:

1. The existing server-owned free weekly event.
2. An optional local weekly play rhythm.
3. Honest PWA install, offline-readiness, and update status.

## Weekly event

The hub reads the existing endpoints:

- Guest: `GET /api/live-ops/weekly/preview`
- Signed in: `GET /api/live-ops/weekly`
- Claim: `POST /api/live-ops/weekly/claim` with only `{ eventId, wins }`

It does not create a second event economy. Progress still comes only from
server replay-verified classic/daily completions. Milestone coins are still
granted by the server under the player economy lock, once per milestone. The
hub shows the next missing milestone and any claimable milestone, but the full
Events tab remains available for score challenges, tournaments, and community
challenges.

If the event is paused, unscheduled, offline, or the request fails, guest play
remains available and the hub says so plainly.

## Optional weekly rhythm

The rhythm is **off by default**. When enabled, it records only the UTC date of
a finished run (win, loss, or Endless bank) in local player data. It does not
record app opens, purchases, location, board transcripts, or account identifiers.

Rules:

- Goal: finish a run on any **3 UTC days** in the current Monday–Sunday week.
- Days do not need to be consecutive.
- History is bounded to 84 distinct UTC days.
- The player can turn it off or clear history at any time.
- It grants no coins, stars, energy, boosters, or paid repair.
- A missed week only resets this local counter. It never removes rewards.

This intentionally does not use the existing paid streak-freeze/streak-repair
retention service.

## PWA and offline play

The service worker now:

- Precaches the critical guest-play shell, including the offline API shim and
  lazy loader.
- Fails a new install if a critical guest-play file is missing, instead of
  advertising a broken offline shell.
- Uses network-first navigation with cached-shell fallback.
- Leaves API and cross-origin requests untouched.
- Waits for an explicit player restart before applying a waiting update.

`public/js/pwa-register.js` exposes `InfinitePWA`:

- `status()` — supported, registered, offlineReady, updateReady,
  installAvailable, installed, online.
- `promptInstall()` — only after the player presses Install.
- `applyUpdate()` — posts `SKIP_WAITING`; reload happens only after that explicit
  player action. The This week screen refuses to restart while a run, level
  start, power-up, or Endless checkpoint is still active.
- `checkForUpdate()` / `refresh()`.

Offline mode is guest play. Signed-in attempts, rewards, weekly progress, and
claims still require the server. Existing queued-win reconciliation is unchanged.

## Files

- `public/js/weekly-hub.js` — pure rhythm math and accessible hub rendering.
- `public/js/player-experience.js` — This week overlay and callbacks.
- `phaser3-game.js` — opt-in setting, bounded local days, finished-run recording.
- `public/js/pwa-register.js` — install/update/offline status controller.
- `public/sw.js` — critical shell, network-first navigation, player-controlled updates.
- `src/__tests__/weekly-hub.test.ts`, `pwa-register.test.ts`, `pwa-shell.test.ts`.

## Verification limits

Automated tests and a local Chromium smoke can prove the UI, opt-in, bounds,
claim payload, service-worker logic, and offline guest boot. They do not prove
store installability on every device, human retention lift, or production
multi-replica economy safety. The weekly event operations runbook still applies.
