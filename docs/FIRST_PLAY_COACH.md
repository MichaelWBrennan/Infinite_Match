# First-play coach

Bet #7 makes the first board easier to understand without taking control away from the player.

## What the player sees

On the first board, a small non-modal coach appears above the puzzle:

1. **Current goal** — exact score/collection/obstacle counts and remaining amounts.
2. **Free hint** — the player can ask the coach to reuse the existing free hint. The coach names the highlighted cells for touch, keyboard, and text-board play.
3. **Player-made move** — the coach waits. A valid ordinary move or earned-special activation completes the coach. Inventory boosters do not count as the coached first match; if one changes the board, a stale coach hint is reset.

The coach can be skipped at any point. Skip and completion are saved locally, so the coach does not nag on later boards. Explore → **First-play coach** can replay it during a run, or explain it from the title without starting a run.

## What it does not do

- It never spends moves, coins, energy, or inventory for the player.
- It never starts a run, retries a level, or claims a reward.
- It never changes the board, RNG, difficulty, prices, or reward settlement.
- It does not add telemetry or a new network endpoint.
- It does not replace the existing free Hint button; it teaches that hints are free.

## Files

- `public/js/first-play-coach.js` — pure goal/hint copy and accessible rendering.
- `phaser3-game.js` — coach state, persistence, free-hint reuse, and completion on a player-made valid move.
- `public/js/player-experience.js` — stable non-modal coach host and Explore replay entry.
- `public/sw.js` / `index.html` — offline shell, script order, and the player stylesheet link.
- `src/__tests__/first-play-coach.test.ts` and coach cases in `src/__tests__/procedural-client.test.ts`.

## Verification limits

Automated tests and Chromium smoke prove the coach states, free-hint reuse, explicit skip/replay, persistence, and that the coach itself does not spend moves. They do not prove that real first-time players learn faster or enjoy the game more. The [first-play and fairness study](WEB_FIRST_PLAY_STUDY.md) still requires a human facilitator and consenting participants.
