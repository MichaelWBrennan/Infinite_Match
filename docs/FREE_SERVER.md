# Free self-hosted server

A small Node server that runs on your own machine. It has no paid services: SQLite is the database, `node:sqlite` is built into Node, and the only exposure is an outbound Cloudflare Tunnel. It lives in `server/` and uses no npm dependencies.

Status: **partial.** Accounts, energy, generated levels, and verified level wins work. Many features are still missing (see below). The public site stays offline until you set the server address in `index.html`.

## Requirements

- Node.js 22.13 or newer (for the built-in `node:sqlite` module).
- A domain on Cloudflare DNS, if you want the server reachable from the internet (the free plan works).

## Run it

```bash
npm run test:server                    # 35 tests, in-memory database
node server/index.js                   # serves http://127.0.0.1:8787
```

Environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8787` | Port to listen on |
| `HOST` | `127.0.0.1` | Keep this local. The tunnel connects locally. |
| `DATA_FILE` | `server/data/app.sqlite` | SQLite file (gitignored) |
| `ALLOWED_ORIGINS` | empty | Comma-separated browser origins allowed to call the API, e.g. `https://your-game.example` |

## Expose it with Cloudflare Tunnel

The server binds to `127.0.0.1`. `cloudflared` makes an outbound connection to Cloudflare, so no port is opened on your router. In the Cloudflare Zero Trust dashboard, create a tunnel, add a public hostname such as `api.your-domain.example`, and point it at `http://127.0.0.1:8787`. Run `cloudflared` as a service so it restarts with your machine. Set `ALLOWED_ORIGINS` to the game's origin.

The machine has to stay on and online. If it sleeps, the game's account features stop working.

## Implemented endpoints

| Method and path | Notes |
|---|---|
| `GET /api/health` | Liveness check |
| `POST /api/auth/register` | `{playerId, password}`. Returns `{success, token, sessionId}`. Rate limited per client. |
| `POST /api/auth/login` | Same response. Unknown users and wrong passwords return the same error. |
| `POST /api/account-economy/initialize` | Returns the economy view |
| `GET /api/account-economy/data` | Energy, coins, and stars, with energy regenerated to the current time |
| `POST /api/account-economy/energy/spend` | Spends 1 energy, returns an `attemptId`. With a `mode` (`classic`, `daily`, `timed`, `endless`), the server generates the board and pins it to the attempt. Send `rulesVersion: 5`, as the current client does. |
| `POST /api/account-economy/energy/refill` | Refills missing energy for 10 coins per point |
| `POST /api/account-economy/attempt/close` | Idempotent |
| `POST /api/account-economy/daily-reward/claim` | One claim per local calendar day. Same 7-day schedule as the existing server. The streak resets after a missed day. |
| `POST /api/account-economy/lootbox/open` | `{type}` = `common`, `rare`, or `epic`. Coins are charged, and the reward is rolled with a cryptographic RNG on the server. Inventory rewards go to the power-up inventory, which `data` returns. |
| `POST /api/account-economy/powerup/use` | `{powerupId, attemptId, useId}`. Spends one power-up from the inventory and returns a receipt bound to the open attempt. A repeated `useId` returns the same receipt without spending again. Quantity is 1 only. Put the receipt in the level moves as `{receiptId, type, target}`. |
| `POST /api/account-economy/endless/complete` | `{attemptId, score}`. Pays `endlessRewards(score)` with the existing caps (300 coins, 500 XP max). **Unverified:** the score is trusted, as in the existing server. The caps limit the damage. |
| `GET /api/kingdom` | Rooms (level, next upgrade cost and stars), coins, coin bonus, and the decor catalog with owned and placed items. |
| `GET /api/live-ops/offers` | Coin packs with their current price (active deals applied) and today's events. Public. Prices come from the server catalog. Purchases are not available on the free server. |
| `GET /api/live-ops/today` | Today's deals and events. Every deal shows `owned: false`, since there are no purchases here. |
| `GET /api/live-ops/weekly/preview` | The current or next weekly event with no player data. Public. `disabled` is true when `WEEKLY_EVENT_DISABLED=1`. |
| `GET /api/live-ops/weekly` | The same event with the player's wins and which milestones they can claim. |
| `POST /api/live-ops/weekly/claim` | `{eventId, wins}`. Pays a milestone once, when the player has the wins. Wins come from verified level wins only. |
| `GET /api/social/me` | The caller's profile, including the friend code. Creates the profile on first use. |
| `PUT /api/social/name` | `{name}`. Sets the display name (3 to 16 characters, letters, digits, space, `_`, `-`). Names are unique. |
| `GET /api/social/friends` | Friends and pending requests. |
| `GET /api/social/friends/leaderboard` | Friends ranked by best verified score. Shows labels, not player ids. |
| `POST /api/social/friends/request` | `{code}`. Sends a request by friend code. |
| `POST /api/social/friends/:playerId/accept` | Accepts a request from that player (username). |
| `POST /api/social/friends/:playerId/decline` | Declines a request. |
| `DELETE /api/social/friends/:playerId` | Removes a friend. |
| `GET /api/social/guilds?limit=` | Guild list (default 20). |
| `GET /api/social/guilds/mine` | The caller's guild, or null. |
| `POST /api/social/guilds` | `{name}`. Creates a guild and makes the caller its owner. |
| `POST /api/social/guilds/:guildId/join` | Joins a guild (max 30 members). |
| `POST /api/social/guilds/leave` | Leaves the caller's guild. |
| `GET /api/live-ops/competitions` | Active tournaments (top 10 and the caller's place) and community challenges (progress, and whether the caller can claim). |
| `POST /api/live-ops/challenges/:id/claim` | Pays a community challenge once, when the shared goal is reached and the caller contributed at least one verified win. |
| `POST /api/live-ops/tournaments/:id/settle` | Operator only (`OPERATOR_USERNAMES`, comma list). Pays finished tournament prizes once per place. |
| `GET /api/levels/context` | The local level context for a place and time: time of day, holiday themes, and the refresh time. No weather. Public. |
| `GET /api/levels/regions?country=` | The country and region catalog. An unknown country returns 400 `invalid_country`. Public. |
| `GET /api/levels/daily` | Today's daily board for a place. Same place and day give the same board. Public. |
| `GET /api/levels/:level?mode=&rulesVersion=` | A board by level number. A malformed number returns 400 `invalid_level`. Public. |
| `GET /api/battlepass/config` | The season config from `config/battlepass/config.json` (or `BATTLEPASS_CONFIG`). Public. |
| `GET /api/battlepass/progress` | Season XP, current tier, claimed tiers, and whether premium is unlocked. Premium is always locked here (no purchases). |
| `POST /api/battlepass/claim` | `{level, track}` where track is `free` or `premium`. Grants the tier reward once, when the player has its XP. Premium returns 403 `premium_required`. Season XP: +50 per verified win, +10 per daily reward claim (from the config's `xpEvents`). |
| `POST /api/kingdom/renovate` | `{roomId}`. Upgrades a room one level. Cost = baseCost x level squared. Level 2+ needs lifetime stars. Level 3 and 5 grant a bomb and a rainbow. |
| `POST /api/kingdom/decor/buy` | `{decorId}`. Buys one decoration into stock (max 5 owned per kind). |
| `POST /api/kingdom/decor/place` | `{roomId, decorId}`. Shows an owned, unplaced decoration in a room. The room must be empty and at the level the item needs. |
| `POST /api/kingdom/decor/choose` | `{roomId, decorId}`. Shows the decoration in the room, buying one first if none is in stock. Choosing what is already shown costs nothing. |
| `POST /api/kingdom/decor/remove` | `{roomId}`. Clears a room. The item goes back to stock. |
| Coin bonus (not an endpoint) | Room coin bonus is 1% per room level, capped at 15%. It applies to coin payouts from wins and endless runs. |
| `POST /api/account-economy/level/complete` | Pays a win only when the server replays the moves on the board it pinned at spend time and reaches the same score and objectives. Reward = `winRewards(stars)` (coins, XP, stars). A retry returns the original result without paying again. Forged scores are rejected and the attempt is closed. Legacy attempts with no pinned board cannot win (`replay_required`). |

Any other `/api/*` path returns HTTP 503 with `{"code":"api_unavailable"}`. It never returns HTML with a success status, which the browser client would otherwise treat as success.

## Not implemented yet

- `timed` level completion. Timed attempts can be spent but not yet completed.
- Level boards use the local context only. The existing server also adds live weather to the context. This changes the forecast metadata, not the board rules.
- Retention study and level-results targets (`/api/retention-study`, `/api/level-results`).
- Minigames (`/api/minigames`), `account-economy/inventory/update` and `currency/update`, and `auth/platform-sync`. Only the legacy `script.js` calls these. Platform sign-in needs platform tokens that this server does not have.
- Scores and progress for social are verified only through `level/complete`. Endless scores are not ranked.
- Competition payouts do not check a live payment receipt. They are guarded by the social store reservation and an economy receipt.
- Premium battle pass track (needs a purchase). The config grants a `rocket` item, which is not a replayable power-up, so it cannot be used in verified levels yet.
- Payments. Stripe needs a processor, and processing fees apply. This is not free.

Social data is one JSON file: `server/data/social.json` (`SOCIAL_STORE_FILE` overrides). Back it up with the database.

Config files: `config/liveops.json` (`LIVE_OPS_CONFIG` overrides) and `config/battlepass/config.json` (`BATTLEPASS_CONFIG` overrides). They are read on each request, so edits apply without a restart.

## Connect the game to your server

1. Set `ALLOWED_ORIGINS` on the server to the game's origin (for example `https://your-game.example`).
2. In `index.html`, set the `infinite-match-api-base` meta tag to your server address, for example `https://api.your-domain.example`. Only `https://` (or `http://localhost` for development) is accepted. An invalid value leaves the game offline.
3. Redeploy the static site.

The browser then sends every same-origin `/api/*` call to your server. Anything not implemented returns a JSON 503, which the game treats as an offline feature.

## Security notes

- Passwords use scrypt with a per-user salt. Session tokens are random, and only their SHA-256 hash is stored.
- Sign-in and registration are limited to 20 requests per client address per 15 minutes.
- Request bodies are capped at 16 KB.
- The economy state is read and written inside a single synchronous SQLite transaction, so concurrent requests cannot corrupt one player's balance.
- Energy and coin rules come from the shared pure modules in `src/services/meta/`, the same code the existing server uses.

## Tests

`npm run test:server` runs `server/test/free-server.mjs` with Node's built-in test runner. Jest (`npm test`) does not run it. `server/test/bot.mjs` is a greedy test player that wins generated levels, so the tests exercise real verified wins.
