# Personalized flow

Bet #3 makes Infinite Match feel like it understands the player's current
session without hiding difficulty changes, selling urgency, or requiring an
account. Flow is a transparent, local-first suggestion layer.

## What the player sees

- **Explore → Suggested for this session** shows one recommended mode, a plain
  language reason, the chosen session length, and an optional break note.
- **Select Mode** shows the same suggestion above the manual mode cards.
- **Play preferences** exposes:
  - Local flow suggestions on/off.
  - Session length: short, standard, long.
  - Challenge preference: relaxed, steady, spicy.
  - Preferred mode: let flow suggest, Classic, Today's Local Level, Timed, Endless.
  - Clear local flow history.

Accepting a suggestion is always an explicit button press. Flow never starts a
run, spends energy, changes a board, or interrupts a run in progress.

## What it uses

Flow reads only:

1. The player's explicit flow preferences.
2. Up to 20 recent local results: mode, stars, duration, timestamp.

The history is stored with the existing local player data (`phaser3_game_data`
and the cache manager). It is not sent to the adaptive AI endpoints, offer
system, leaderboard, or analytics as a profile. The `flow_recommendation_accepted`
event records only the accepted mode, not the history.

## What it deliberately does not do

- No hidden difficulty tuning.
- No board, move, color, obstacle, or reward mutation.
- No price, offer, discount, energy, or inventory changes.
- No near-miss urgency or loss-chasing monetization.
- No automatic start, auto-play, or forced break.
- No network fetch in the flow module.

The existing `AdaptiveLevelService` and near-miss offer logic are intentionally
not wired into this layer. They need separate trust, verification, and consent
work before they could be player-facing.

## Recommendation rules

The rules are deterministic and inspectable in `public/js/play-flow.js`:

- Manual preferred mode always wins.
- Three recent scored losses suggest a no-clock reset mode.
- Short sessions prefer the daily local level, then Timed if today's daily was
  already played.
- Long sessions prefer Endless, or Classic when relaxed.
- Relaxed flow avoids Timed.
- Spicy flow may suggest Timed after a win streak.
- Recent played minutes at or above the chosen session length add a gentle break
  note. Nothing expires because the player pauses.

## Files

- `public/js/play-flow.js` — pure recommendation/history module.
- `phaser3-game.js` — settings, bounded history, record/clear/accept methods.
- `public/js/player-experience.js` — Explore card and preference controls.
- `script.js` / `index.html` — Select Mode suggestion panel.
- `styles.css` — accessible card/panel styles.
- `public/sw.js` — precaches the module and bumps the shell cache.
- `src/__tests__/play-flow.test.ts` — determinism, bounds, controls, wiring.

## Verification

- Unit tests cover normalization, bounded history, deterministic reasons,
  relaxed clock avoidance, loss-streak reset, break notes, Endless not creating
  win/loss streaks, preference saving, and history clearing.
- A local Chromium smoke verifies the Explore card, preference controls, Select
  Mode panel, and explicit accept path without real purchases or energy spend.
