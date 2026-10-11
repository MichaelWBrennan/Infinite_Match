# Free self-hosted server

A small Node server that runs on your own machine. It has no paid services: SQLite is the database, `node:sqlite` is built into Node, and the only exposure is an outbound Cloudflare Tunnel. It lives in `server/` and uses no npm dependencies.

Status: **first slice, not full parity yet.** The browser game is still offline. Nothing in `public/` calls this server yet.

## Requirements

- Node.js 22.13 or newer (for the built-in `node:sqlite` module).
- A domain on Cloudflare DNS, if you want the server reachable from the internet (the free plan works).

## Run it

```bash
npm run test:server                    # 18 tests, in-memory database
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
| `POST /api/account-economy/energy/spend` | Spends 1 energy, returns an `attemptId`. Classic levels only. |
| `POST /api/account-economy/energy/refill` | Refills missing energy for 10 coins per point |
| `POST /api/account-economy/attempt/close` | Idempotent |

Any other `/api/*` path returns HTTP 503 with `{"code":"api_unavailable"}`. It never returns HTML with a success status, which the browser client would otherwise treat as success.

## Not implemented yet

- `level/complete`, which pays out rewards. It needs replay validation against the shared rules before rewards can be trusted. Until then, wins pay nothing on the free server.
- Mode-based (generated) levels. These currently return 503 `generated_levels_unavailable`.
- Daily rewards, power-ups, inventory, lootboxes, endless mode.
- Kingdom, battle pass, live ops, social (friends, guilds, leaderboards), retention study.
- Payments. Stripe needs a processor, and processing fees apply. This is not free.
- Connecting the browser client to this server. That changes the public site's behavior, so it is a separate, deliberate step.

## Security notes

- Passwords use scrypt with a per-user salt. Session tokens are random, and only their SHA-256 hash is stored.
- Sign-in and registration are limited to 20 requests per client address per 15 minutes.
- Request bodies are capped at 16 KB.
- The economy state is read and written inside a single synchronous SQLite transaction, so concurrent requests cannot corrupt one player's balance.
- Energy and coin rules come from the shared pure modules in `src/services/meta/`, the same code the existing server uses.

## Tests

`npm run test:server` runs `server/test/free-server.mjs` with Node's built-in test runner. Jest (`npm test`) does not run it.
