# Game-feel layer

The game-feel pass adds bounded, deterministic presentation feedback around the
existing resolver. It does **not** change matching, refill RNG, score, moves,
inventory, rewards, or network verification.

## What players get

- **Escalating cascade impact:** later waves and special activations earn larger
  particle bursts, rings, and a small camera shake. Ordinary matches stay light.
- **Special-gem detonations:** row/column beams draw a directional flash, bursts
  draw an expanding ring, and prisms draw a color-ring pulse. Combinations reuse
  the same bounded vocabulary instead of adding unbounded effects.
- **Opt-in haptics:** short vibration patterns for matches, cascades, specials,
  combinations, invalid swaps, and wins. Haptics remain off until the player
  enables **Touch vibration** in Play preferences.
- **Original procedural music:** title, gameplay, kingdom, win, and level-complete
  cues are synthesized locally. Music has its own opt-in, volume, and gain bus, so
  music-only play works while sound effects are muted. No audio files, streaming,
  trackers, or gameplay RNG are used.

## Safety and performance contract

- Visual effects are suppressed by reduced motion, the system
  `prefers-reduced-motion` setting, text-board mode, named-cell assistive mode,
  pause, hidden tabs, open dialogs, and the **Impact effects** preference.
- Haptics are independently opt-in and throttled.
- Particle/ring objects are capped at 96 active presentation objects. Music is
  capped at 24 active voices and uses a cancellable millisecond loop timer.
- Effects are destroyed on pause, new level definitions, visibility loss,
  reduced-motion changes, scene shutdown, and game teardown.
- The layer is read-only: it consumes settled resolver events and never writes
  board state, RNG state, score, moves, inventory, or save data.

## Files

- `public/js/game-feel.js` — deterministic impact plans, particles, rings, beams,
  camera shake, and haptics.
- `public/js/sound-effects.js` — opt-in SFX and independent procedural music bus.
- `public/js/match-feedback.js` — emits one game-feel wave per staged clear wave.
- `phaser3-game.js` — creates/destroys the layer and connects legacy swap, invalid
  swap, pause, new-definition, and win paths.
- `public/js/player-experience.js` — Impact effects preference and audio status
  copy.

## Verification

- `src/__tests__/game-feel.test.ts` checks bounded plans, haptic caps, opt-in and
  reduced-motion gates, object cleanup, and wiring.
- `src/__tests__/sound-effects.test.ts` checks music-only unlock, cue coverage,
  loop timing, voice bounds, mute/hide/teardown cancellation, and independent
  SFX/music volume.
- `var/juice-qa/juice-smoke.mjs` is a local Chromium smoke test for the phone
  viewport. It is a development probe, not a shipped runtime dependency.
