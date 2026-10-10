# Open Source Architecture & Migration Guide (2026)

This document describes Infinite Match's free/open-source-first architecture:
what replaced each proprietary service, what runs in
`docker-compose.opensource.yml`, and which touchpoints remain proprietary and
why.

## Design rule

> Every capability has a self-hosted, OSI-licensed default. A proprietary
> service may exist only behind an optional adapter (payments, app stores),
> never as the only path.

## Stack at a glance

| Layer | 2026 default (all FOSS) | Replaces | License |
|---|---|---|---|
| Runtime | Node.js 22 LTS / 24 LTS, ESM, TypeScript `nodenext` | Node 20 (EOL) | MIT |
| HTTP API | Express 5 | — | MIT |
| Relational DB | PostgreSQL 17/18 | DynamoDB, Firestore, Cosmos DB | PostgreSQL |
| Data API | PostgREST (native-fetch client in `src/core/api/postgrest-client.js`) | `@supabase/supabase-js` | Apache-2.0 |
| Document store | FerretDB 2 on Postgres (`ECONOMY_STORE=mongo` wire protocol) | MongoDB (SSPL) | Apache-2.0 |
| Cache / queue broker | Valkey 8 | Redis (RSAL/SSPL) | BSD-3-Clause |
| Job queue | BullMQ | Bull (unmaintained) | MIT |
| Object storage | MinIO (S3 API) | AWS S3 | AGPL-3.0 |
| Email | nodemailer → Mailpit (dev) / any SMTP (prod) | AWS SES | MIT |
| Analytics | PostHog self-hosted | Amplitude, Mixpanel, Unity Analytics | MIT core |
| Metrics | Prometheus + Grafana | Datadog | Apache-2.0 / AGPL-3.0 |
| Error tracking | GlitchTip (Sentry-SDK-compatible) | Sentry SaaS | MIT |
| Push | ntfy self-hosted + W3C Web Push (`src/services/push/push-transports.js`) | Firebase Admin SDK (FCM) | BSD-2 / MPL-2.0 |
| Procedural levels / calendar | In-repo seeded generator + solver / date-holidays | Manual level batches, hosted calendar APIs | MIT code / ISC calendar code; CC BY-SA 3.0 calendar data |
| Level weather | MET Norway open forecast data / self-hosted Open-Meteo-compatible feed | Paid weather/location APIs, fake fallback observations | CC BY 4.0 data / AGPL-3.0 optional server |
| AI models | Ollama / vLLM / any OpenAI-compatible server | OpenAI hosted, Hugging Face Inference | MIT / Apache-2.0 |
| JWT | `jose` (ESM-native) | `jsonwebtoken` | MIT |
| Dates | Day.js + timezone plugins (`src/core/utils/datetime.js`) | `moment-timezone` (deprecated) | MIT |
| HTTP client | native `fetch` (`src/core/utils/http.js`) | `axios`, `node-fetch` | — |
| IDs | `crypto.randomUUID()` | `uuid` package | — |
| Input sanitizing | `src/core/security/nosql-sanitize.js` | `express-mongo-sanitize` (broken on Express 5) | in-repo |

The single Docker stack brings all of it up:

```bash
docker compose -f docker-compose.opensource.yml up -d
cp .env.opensource .env   # then edit secrets
npm ci && npm run dev
```

| Service | URL | Notes |
|---|---|---|
| Game server | http://localhost:3000 | |
| PostgREST | http://localhost:3001 | `POSTGREST_URL` |
| MinIO console | http://localhost:9001 | minioadmin / minioadmin |
| Grafana | http://localhost:3002 | admin / admin |
| GlitchTip | http://localhost:9003 | point `SENTRY_DSN` here |
| PostHog | http://localhost:8000 | optional, heavy |
| Mailpit | http://localhost:8025 | SMTP on :1025 |
| ntfy | http://localhost:8081 | `PUSH_TRANSPORT=ntfy` |
| Ollama | http://localhost:11434 | `OLLAMA_BASE_URL` |
| Prometheus | http://localhost:9090 | |
| FerretDB | localhost:27017 | `MONGODB_URI` |

## What changed in the code

### Cloud providers removed entirely
`cloud-services.js` (AWS SDK + Google Cloud SDK + Azure SDK, 15 vendor
packages) is gone. `src/services/open-source-cloud-services.js` is the only
cloud layer: MinIO for assets, PostgreSQL for player data, Valkey for cache,
BullMQ for events, SMTP for mail. Game routes resolve it under the legacy
`'cloud'` service name, so nothing else changed. Every backend is optional —
a missing one degrades the feature instead of taking the server down.

### Data layer: PostgREST instead of supabase-js
`createSupabaseClient()` now returns a dependency-free PostgREST client
(`from().select().eq()...insert()/upsert()/update()/delete()`, resolving to
`{ data, error }`). Configure `POSTGREST_URL` + `POSTGREST_TOKEN` (or the
legacy `SUPABASE_URL` / `SUPABASE_ANON_KEY` names) against any self-hosted
PostgREST or Supabase instance.

### Push: ntfy / Web Push / raw FCM
`firebase-admin` is gone. `createPushTransport()` picks, in order of
preference: explicit `PUSH_TRANSPORT`, then FCM HTTP v1 (if
`FIREBASE_*` service-account credentials exist — called with `fetch` + a
jose-signed service-account JWT, no SDK), then Web Push (VAPID keys), then a
self-hosted ntfy server (`NTFY_URL`), then a logging transport so engagement
features work offline.

### AI: local models first
`OPENAI_API_KEY` is no longer required. Set `OLLAMA_BASE_URL` (or
`OPENAI_BASE_URL` pointing at vLLM / LiteLLM / llama.cpp `/v1`) to run the AI
content pipeline on local, open-weights models. The Hugging Face factory
(`textGeneration`) likewise targets Ollama or any HF-Inference-compatible
endpoint (`HF_INFERENCE_URL`) — the `@huggingface/inference` SDK is gone.

### 2026 runtime standards
- Node engines `>=22.12.0` (22 LTS and 24 LTS); `.nvmrc` pins 24.
- TypeScript `module`/`moduleResolution` = `nodenext`, target/lib `ES2023`;
  unused legacy `experimentalDecorators` removed.
- Native `fetch` + `AbortSignal.timeout` replaces axios/node-fetch.
- `jose` replaces `jsonwebtoken`; `crypto.randomUUID()` replaces `uuid`.
- Day.js replaces deprecated `moment-timezone` (20/20 parity checks on the
  exact call patterns, including DST arithmetic, in the migration).
- Express 5-safe NoSQL sanitizer replaces `express-mongo-sanitize`, which
  throws on Express 5's getter-only `req.query`.

### Deferred CI modernization

The 11 GitHub Actions workflow updates are saved separately in a local-only
`ci-modernization.patch`, not included in this branch. `.github/workflows`
retains the pre-upgrade versions because the current GitHub connection cannot
write workflows.

The saved patch updates action majors (checkout/setup-node v7, cache v6,
CodeQL v4, Docker actions v4/v6/v7), adds a Node 22 + 24 CI matrix, removes
unneeded MongoDB test service containers, and adds a critical-advisory audit
gate. Until it is applied, hosted CI retains its previous runtime and audit
configuration; use Node 22.12+ to run `npm run build` and `npm test` locally.

After workflow-write access is available, apply the separately supplied patch:

```bash
git apply --check /path/to/ci-modernization.patch
git apply /path/to/ci-modernization.patch
```

## What remains proprietary (and the FOSS path for each)

| Touchpoint | Why it stays | FOSS path |
|---|---|---|
| Stripe payments | iOS/Android/web IAP economics and app-store tax rules | Web payments can move to a self-hosted processor (e.g. BTCPay Server); IAP receipts are an Apple/Google protocol with no alternative |
| Apple App Store / Google Play billing APIs | The only way to sell IAP in those stores | none — store policy |
| Unity (game client build) | The shipped WebGL client is a Unity build | Godot (MIT) is the realistic FOSS engine target for a future client rewrite; the server and web shell are engine-agnostic |
| FCM (optional push adapter) | Android deliverability for store builds | ntfy + UnifiedPush / W3C Web Push cover app and web clients |
| PostHog/Stripe/etc. SDKs | Client libraries are FOSS (MIT/Apache) and work against self-hosted backends | already self-hosted by default |

## Service configuration notes

### PostHog analytics
Self-host with the compose stack or the PostHog hobby chart; set
`POSTHOG_API_KEY` and `POSTHOG_HOST=http://localhost:8000`. Leave keys empty
to log events locally only.

### GlitchTip error tracking
The `@sentry/node` SDK (MIT) works unchanged against GlitchTip; set
`SENTRY_DSN` to the GlitchTip project DSN. Invalid/placeholder DSNs are
ignored at boot instead of crashing the server.

### MinIO
Create the bucket from the console (`match3game` by default) or let the
server create it on first use.

### FerretDB (document store)
`ECONOMY_STORE=mongo` keeps its name for compatibility; the wire endpoint is
FerretDB (Apache-2.0) backed by Postgres. Point `MONGODB_URI` at
`mongodb://localhost:27017/match3game`.

### Local AI (Ollama)
```bash
docker compose -f docker-compose.opensource.yml up -d ollama
docker compose -f docker-compose.opensource.yml exec ollama ollama pull llama3.1
```
Then `OLLAMA_BASE_URL=http://localhost:11434` is enough — no API key.

## Security notes

1. Change every default credential in `.env.opensource` before any shared deployment.
2. Terminate TLS in front of the stack (nginx service is included).
3. Keep `ADMIN_API_TOKEN` (≥32 chars) and `ADMIN_IDS` out of version control.
4. Run `npm audit` regularly. The deferred CI patch adds a critical-advisory
   gate and reports the rest; this branch retains the pre-upgrade workflows.
5. Back up the Postgres and Valkey volumes; everything durable lives there
   (plus MinIO objects).

## Historical savings

The original migration (Amplitude/Mixpanel/Datadog/Sentry SaaS/multi-cloud)
replaced roughly $1,700–6,900/month of hosted services with self-hosted
infrastructure. The 2026 refresh extends that to the SDK layer: fewer
dependencies (36 production packages, down from 60+), no vendor SDKs for
cloud, database, push, or AI, and one `docker compose` file that stands up
the entire platform on open-source software.


## Passive procedural levels

The playable root web client now uses a self-contained, seeded generator with a
winning-path quality check, local daily challenges and automatic endless stages.
Regional holidays come from the free self-hosted `date-holidays` calendar; no
AI, GPS or paid calendar API is required. [Implementation and attribution](docs/PROCEDURAL_LEVELS.md)
describes the full contract, offline behavior, limits, and the calendar parser's
intentional transitive Moment Timezone dependency. Application date helpers remain
on Day.js / native Intl. CI workflow changes remain deferred.


Time and weather now alter real board generation. MET Norway is the free public
forecast default, with explicit attribution, fair-use caching and no key. The
optional Open-Meteo endpoint is operator-configured; its hosted free tier is
non-commercial, so commercial use needs self-hosting or an appropriate license.
Device-area use is explicit opt-in, rounded to a 1° grid before transmission,
and can be cleared/disabled. See the procedural guide for deployment request
budgets, cache limits, failed-feed behavior and current verification scope.
