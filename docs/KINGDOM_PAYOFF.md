# Post-win kingdom payoff

Bet #2 makes a level win visibly build the kingdom instead of ending at a score
screen. The result screen now reads the player's server-backed kingdom state and
shows the next meaningful room goal.

## Player loop

1. Win a level and see the coins/stars just earned.
2. See any newly unlocked room.
3. See the next kingdom goal:
   - **Renovate now** when the server says the room is eligible.
   - **More coins** or **more lifetime stars** with the exact gap and progress.
   - **Unlock the next room** when the current unlocked rooms are maxed.
   - **Kingdom complete** when every room is restored.
4. Renovate in one tap from the result screen, or open the full Kingdom scene.

## Trust and safety

- The client does not price renovations, grant rewards, or mutate the economy.
- `GET /api/kingdom` returns `nextGoal`, `coins`, and `lifetimeStars` alongside the
  existing room view.
- `POST /api/kingdom/renovate` remains the only renovation mutation. It still
  checks coins, lifetime stars, room unlock state, and the level cap under the
  player economy lock.
- The payoff panel is read-only presentation. If the kingdom read fails, the
  normal result screen remains usable.
- No new currency, loot box, energy shortcut, or pay-to-win path is introduced.

## Files

- `src/services/meta/kingdom.js` — `kingdomNextGoal()` read-only recommendation.
- `src/routes/kingdom.js` — exposes `nextGoal`, `coins`, and `lifetimeStars`.
- `public/js/kingdom-payoff.js` — accessible DOM panel, progress bars, actions.
- `public/js/player-experience.js` — mounts the panel inside the result dialog.
- `phaser3-game.js` — result-screen hook and one-tap renovate action.
- `styles.css` — payoff panel, high-contrast and reduced-motion-safe styles.

## Verification

- `src/__tests__/kingdom-payoff.test.ts` covers ready/coin/star/unlock/complete
  goals, exact gaps, accessible rendering, action callbacks, and wiring.
- The existing kingdom room tests still cover the full Kingdom scene.
- A local Chromium smoke can stub the signed-in kingdom read to verify the
  result-screen panel and renovate callback without spending real currency.
