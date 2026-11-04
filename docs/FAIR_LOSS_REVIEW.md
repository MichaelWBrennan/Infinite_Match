# Fair loss review

Bet #5 makes losing understandable instead of monetizing frustration.

When a non-endless attempt ends with zero stars, the result screen now shows:

- Every goal with exact current/target counts and remaining amount.
- Moves used or timed clock used.
- Free hints used, with a reminder that hints never cost moves, coins, or energy.
- One deterministic goal-aware tip (collection color, shields, blockers, delivery, score, etc.).
- Transparent retry cost: signed-in retry starts a new attempt and uses 1 energy; guest retry is free.
- Explicit **Retry** and **Goal guide** actions. Nothing auto-starts.

## What it does not do

- No discounted continue, extra-moves sale, countdown, or near-miss urgency offer.
- No hidden difficulty change, board reroll, or reward mutation.
- No new telemetry endpoint. Existing anonymous attempt observations are unchanged.
- No change to server replay, energy spend, or reward settlement.

The existing `src/services/level-tuning.js` near-miss urgency helpers are **not** wired into this client flow.

## Files

- `public/js/loss-review.js` — pure review math and accessible DOM rendering.
- `phaser3-game.js` — `showLossReview()` / `showLossGuide()` on the result screen.
- `public/js/player-experience.js` — `renderLossReview()` overlay host.
- `public/sw.js` / `index.html` — offline shell and script order.
- `src/__tests__/loss-review.test.ts`.

## Verification limits

Automated tests and Chromium smoke prove the UI, exact remaining counts, explicit retry, and absence of urgency/paid-continue copy. They do not prove that real players perceive losses as fair. The [first-play and loss-fairness study](WEB_FIRST_PLAY_STUDY.md) still requires a human facilitator and consenting participants.
