# Infinite Match - Royal Puzzle Adventure

A captivating match-3 puzzle game featuring royal themes, magical gems, and endless entertainment. Experience the thrill of matching colorful gems while helping restore a magnificent kingdom!

## Implementation status

This section lists what is built and tested, and what is mounted on the server. The feature lists below are the product goals. Anything not marked **Built** is not implemented yet.

**Built and tested**
- Match-3 core: swaps, matches of 3+, cascades, gravity, refill, and a no-moves reshuffle.
- Power-ups: bomb (3x3), rainbow (whole board), lightning (column), diamond (one colour), target (plus shape), star (row and column). Diamond, target, and star arm on press and fire on the next gem tap.
- Power-up inventory: signed-in players load their counts from the server and confirm each use before it takes effect. Guests keep local counts.
- Passive procedural levels: seeded 6×6 to 8×8 boards, varied gem mixes, bounded move budgets and difficulty, and no hand-authored level cap. Every definition is checked for no starting matches, a legal swap, and a simulated winning path without boosters. Every tenth numbered stage is a harder boss profile. The playable web client and server share the same generator and refill stream; tests replay its winning paths through the actual Phaser methods.
- Local daily variants (`GET /api/levels/daily`): new daily content at local midnight plus separate morning/afternoon/evening/night and forecast variants. Month, hemisphere/season, moving regional holidays and weather alter the theme, gem mix, palettes and bounded move budgets. MET Norway supplies free attributed forecast data; an operator-configured self-hosted Open-Meteo endpoint is optional. No location permission is requested in normal play. Players can opt in to a rounded 1° device area, correct calendar settings or disable time/weather/holiday effects. Active boards and paid goals remain frozen; endless picks up changes at its next stage. [Implementation, privacy, provider licensing and offline limits](docs/PROCEDURAL_LEVELS.md).
- Lucky wheel: one free spin per day with weighted rewards, granted on the server.
- Legacy level results for tuning. Older clients report each finished level (`POST /api/level-results`). The server checks that a win reaches the target score and recomputes the stars. Admins read `GET /api/admin/level-tuning`, which flags a level as `too_hard` (win rate under 30%) or `too_easy` (over 95%) after 20 attempts. Results are stored in `var/level-results.jsonl` (git-ignored) with no player ID.
- Experiment assignment hashes the experiment name with the player ID, so one player is not in the same bucket for every experiment.
- Achievements, daily reward, and login with the account economy (coins, stars, energy, inventory). Economy writes are validated on the server: no negative spends, no client-set balances, and purchases are not trusted from the client.
- Session-gated analytics, ARPU, ads, entitlements, and monetization routes.
- Consent, device-token registration, and experiment assignment. Each uses the signed-in player's own identity.
- Battle pass config (`GET /api/battlepass/config`).
- Economy statistics (`GET /api/admin/economy/stats`). Reads `config/currencies.csv`, `config/inventory.csv`, and `config/catalog.csv`. Returns 503 `economy_data_missing` if a file is absent.
- Admin logs (`GET /api/admin/logs`). Returns the last 500 log entries from memory, with only timestamp, level, message, and context. Logs also go to stdout.
- AI-optimized routes (`/api/ai-optimized/*`). Mounted behind admin auth. Returns 503 `ai_not_configured` when no OpenAI key is set, and 504 `generation_timeout` after 30 seconds. A failed AI call (including an unconfigured client) now fails its own request instead of leaving it waiting.
- Operator admin routes (`/api/admin/*`). Access requires `ADMIN_API_TOKEN` (at least 32 characters) and `ADMIN_IDS`. Without both, every admin request is refused. See `.env.example`.
- Store subscription webhooks (`/api/subscriptions/*`). Apple payloads must chain to a pinned Apple Root CA G3 (`APPLE_ROOT_CA_G3`). Google payloads need a valid Pub/Sub OIDC token for the configured audience and service account. Unverified payloads are rejected, and the routes return 503 until configured.
- Stripe payment intents (`/api/stripe/payment-intent`). The price is the catalog price, or an active deal at that moment, from the server. The webhook grants a purchase only when the charged amount matches the price in effect when the intent was created. Grants go to the database the entitlement checks read (`PurchaseLedgerDb`).
- Coin packs (`coins_small`, `coins_medium`, `coins_large`). Bought through hosted Stripe Checkout (`POST /api/stripe/checkout-session`, session required). The price is set on the server, and the webhook credits the coins once per payment. A quote is honoured for up to 2 hours after it was made, so a deal that ends during checkout still applies. Checkout needs `STRIPE_CHECKOUT_SUCCESS_URL` and `STRIPE_CHECKOUT_CANCEL_URL`.
- Kingdom renovation (`GET /api/kingdom`, `POST /api/kingdom/renovate`, session required). Six rooms, each upgraded from level 0 to 5. Costs are base cost × level² in coins. Levels 2 to 5 need 5, 15, 30, and 50 lifetime stars. Levels 3 and 5 grant a powerup. Rules are in `src/services/meta/kingdom.js`.
- Loot boxes (`POST /api/account-economy/lootbox/open`). Bought with coins, with the reward rolled and granted on the server. Rules are in `src/services/meta/lootbox.js`.
- Energy gate. Each attempt at a level spends 1 energy on the server (`POST /api/account-economy/energy/spend`). The attempt does not start unless the server says yes. Energy regenerates 1 point per minute up to 100. The out-of-energy screen offers a refill (`POST /api/account-economy/energy/refill`), which charges 10 coins per missing point and never charges for points that have already regenerated. Signed-in players only: guests have no server economy, so they are not gated. The spend returns an `attemptId` for that level. A win is rewarded once, by `POST /api/account-economy/level/complete` with that id. The id is used up on the first completion, is refused for a different level, and expires after 3 hours. Losses pay nothing. `GET /api/account-economy/data` shows energy as it is now, with regeneration applied.
- Level wins pay the server's reward. The server works out stars from the score and the target stored in the generated attempt; midnight or holiday changes cannot move that goal. Older clients without a generated mode use the legacy target parity rules (`src/__tests__/level-rewards.test.ts`). A win pays 20 coins plus 5 per star, and 50 XP plus 50 per star. Rules and tuning values are in `src/services/meta/rewards.js`. A reported star count is ignored, and a score below the target is refused without using the attempt.
- Refunds and disputes take back what they paid for. Stripe: a full refund (`charge.refunded`) or a dispute opening (`charge.dispute.created`) reverses the payment. Apple: `REFUND` and `REVOKE` notifications reverse the purchase. Google: a voided purchase (RTDN `voidedPurchaseNotification`) reverses it. Coin packs lose the coins they granted, down to zero. Entitlements such as `remove_ads` stop counting as owned. A reversed purchase is never granted later. Each reversal happens once. The rules are in `src/services/payments/refunds.js`.
- Game modes. Generated Classic and Daily have moves but no clock. Timed uses a 60-second clock without a move limit. Endless has no clock or move limit and automatically advances through fresh generated stages when each finite goal is reached. Bank Run submits the cumulative score once. One energy attempt covers the run (`POST /api/account-economy/energy/spend`); `POST /api/account-economy/endless/complete` pays 1 coin per 80 points (up to 300) and 1 XP per 200 points (up to 500). Existing 3-hour paid-attempt expiry remains; bank before it expires. Endless runs never count as level wins.
- Legacy feedback-based difficulty. New procedural boards calibrate their own goals against a simulated solution and do not mix region/date variants into this pool. `POST /api/level-results/tuning/apply` (admin only) reads the tuning report and moves each `too_hard` level down, and each `too_easy` level up, by 5%. A level's target can move 20% at most in either direction (multiplier 0.8 to 1.2). The result is written to `config/level-overrides.json` (`LEVEL_OVERRIDES_CONFIG`). An optional schedule runs the same step on a timer: set `LEVEL_TUNING_INTERVAL_HOURS` to 1 or more (off by default). Each level counts only results since its last move, so one batch of attempts moves a level once. `GET /api/level-results/targets` is public, and the game reads it on load. The server applies the same multiplier to every win, so the client and server targets match (`src/__tests__/level-rewards.test.ts`). Results are kept behind a store (`src/services/level-results-store.js`): the default is the JSONL file, and an in-memory double is used in tests. The rules and the apply step are tested in `src/__tests__/remainder.test.ts`.
- Community screen (COMMUNITY on the title screen, and the battle pass from the game menu). Four tabs read the server: Season (battle pass tiers and claims), Friends (name, friend code, requests, friends, best-score board), Guild (create, join, leave, members), and Events (tournaments, community challenges and claims, live deals, live events). Player names are written as text, not as HTML.
- Kingdom decorations (`POST /api/kingdom/decor/buy`, `/decor/place`, `/decor/remove`, session required). Four decorations cost 120 to 500 coins, and a player can own up to 5 of each kind. Each room holds one decoration and needs a room level from 1 to 4 (`src/services/meta/kingdom-decor.js`). The Kingdom screen has a Decor button: buy, select a decoration, then place or remove it in a room.
- Kingdom room bonus. Each room level adds 1% to the coins from a level win, capped at +15%, applied before VIP. The values are in `src/services/meta/kingdom.js` (`ROOM_COIN_BONUS_PER_LEVEL`, `ROOM_COIN_BONUS_CAP`). The Kingdom screen shows the bonus.
- Daily mini-games (`GET /api/minigames`, `POST /api/minigames/:game/complete`, session required). Memory Match, Treasure Dig, and Rhythm Tap. Each game pays once per UTC day, with coins from the score and a per-game cap. The server checks that the score is a whole number in range. It cannot check how the game was played, so a made-up score can earn the cap once a day. Rules are in `src/services/meta/minigames.js`.
- Offers screen. Coin packs at the server's price (deal prices included), active events, and upcoming events, from the public `GET /api/live-ops/offers`. The old gem packs were removed because the game has no gems. The Shop screen shows the same prices.
- Canvas menu. A Menu button opens the DOM screens (news, offers, leaderboard, settings, login). It hides the game canvas and pauses a running level. "Back to game" shows the canvas again and resumes the level.
- Production refuses to start unless `ECONOMY_STORE=mongo` is set (`assertEconomyStoreForEnvironment`).
- Ad event revenue reported by the client is not counted. `POST /api/ads/event` stores it as `clientReportedRevenueUsd` for debugging. The revenue total comes only from a server-verified source, which is not built yet.
- Store billing (`POST /api/monetization/receipt/verify`, session required). iOS: a StoreKit 2 `signedTransaction` is verified offline against the pinned Apple Root CA G3 (`APPLE_ROOT_CA_G3`), with the bundle ID (`APPLE_BUNDLE_ID`) checked and Sandbox refused unless `APPLE_ALLOW_SANDBOX=true`. Legacy receipts check the bundle and environment too. Android: the purchase is checked with the Google Play API for the package in `GOOGLE_PACKAGE_NAME`. Store SKUs map to catalog products in `src/services/payments/product-catalog.js`. Each purchase is granted once per transaction, and a transaction owned by one player is refused to others (`transaction_claimed`, 409).
- Live ops (`GET /api/live-ops/today`, session required). Reads `config/liveops.json`: dated events and deal windows. A deal price applies only inside its window, is at least $0.99, and is below the catalog price. An invalid config is logged and ignored, so catalog prices apply.
- Battle pass (`GET /api/battlepass/progress` and `POST /api/battlepass/claim`, session required). Season XP comes from wins (50) and daily login (10). Each tier is claimed once per track. The free track is open to everyone. The premium track needs the `season_pass_premium` entitlement. Coins and power-ups are granted on the server. A completed community challenge grants 100 season XP (`challenge_complete`). The season is in `config/battlepass/config.json`, and `BATTLEPASS_CONFIG` can point to another file. A claim is refused outside the season's dates, so the config must be updated for each season.
- VIP benefit. A player who holds the `vip` entitlement gets 1.5 times the coins from a win (`src/services/meta/vip.js`). No store product grants `vip` yet.
- Friends, guilds, and boards (`/api/social/*`, session required). A player sets a display name of 3 to 16 characters and shares a friend code. A friend request needs accepting, and a player can have up to 50 friends. A guild holds up to 30 members, and when the owner leaves, the longest-standing member takes over. The friend leaderboard shows best winning scores by name. The data is one JSON file, `SOCIAL_STORE_FILE` (default `var/social/social.json`).
- Tournaments and community challenges (`GET /api/live-ops/competitions`, `POST /api/live-ops/challenges/:id/claim`, and `POST /api/live-ops/tournaments/:id/settle`, which is admin only). They are defined in the `tournaments` and `challenges` lists of `config/liveops.json`. A tournament ranks players by their best winning score inside its window. Settling pays each ranked player once after the window ends. A community challenge counts every player's wins toward one goal, and each player who contributed a win can claim the reward once.

**Built, but not verified against the live service**
- The new daily card, unlimited level browser and region settings are wired and covered by static/VM tests. Procedural witnesses run through the real Phaser core in a stub scene. The real external weather feed is not reachable in this sandbox; fixture/local-HTTP forecast integration is verified. Full visual interaction in a real browser and a rebuilt Unity binary have not been verified; the root playable web client is the implemented integration.
- Stripe, Apple, and Google calls have not been tested against their live APIs. The sandbox cannot reach them. The Apple verifier is tested with locally generated keys and certificates. The Google Play purchase check is not verified: this sandbox cannot reach `androidpublisher.googleapis.com`, so it fails closed here.
- Store SKUs. `product-catalog.js` uses the catalog IDs (`remove_ads`, `unlock_all_themes`) as the store product IDs. The real App Store Connect and Google Play product IDs are not known to this repository and must be set there.
- Device billing (StoreKit and Play Billing on a phone) has not been run. Only the server side of store purchases is built.
- The Offers screen, the Shop prices, the Decor screen, and the mini-games are checked by static tests and the server routes' tests. They have not been run in a browser.
- Community screen, timed and endless modes, and the mode cards are checked by static tests (`src/__tests__/client-wiring.test.ts`) and by the server routes' tests. They have not been run in a browser.
- Canvas title, sign-in, the Menu button, and the menu wiring are checked by static tests (`src/__tests__/client-wiring.test.ts`). They have not been run in a browser, because this sandbox has no browser.
- Refunds are tested against an in-memory stand-in for the purchase ledger, and the Apple and Google notification routes are not exercised end to end. Stripe, Apple, and Google have not been called live.
- Durable economy (opt-in). With `ECONOMY_STORE=mongo`, player balances are saved to MongoDB, and a coin purchase is credited only when that store is on. Without it, balances are in memory and lost on restart, so purchases refuse to credit and the provider retries them. Production refuses to start without `ECONOMY_STORE=mongo`. The save, reload, and rollback rules are tested against an in-memory stand-in for the store (`src/__tests__/durable-economy.test.ts`). No MongoDB server has been run against them yet.
- Client shop. Gems, stars, and energy are no longer sold or given out by the shop, and loot boxes are paid for in coins through the server. The old client code granted currency for free.

**Not built yet** (listed in the sections below, but not implemented)
- Weather effects. The weather service needs the PostgREST data layer (`POSTGREST_URL`), which is not configured here.
- Kingdom garden layout and room art. Renovation, decorations, and the room coin bonus are built (see Built).
- Boss mechanics beyond a higher target. This needs a design decision: what the boss does, and how the server checks a win. Seasonal events are the dated windows in `config/liveops.json`.
- Level results, friends, guilds, and tournaments are kept in single files. That works for one server. Scaling out needs a shared database store, which is not built and has not been run against a MongoDB server.
- A VIP purchase and a season pass purchase. Neither has a price in the repository, so no store product grants them. The benefit and the premium track are built and wait for a product.
- Economy write routes (`/api/economy/*`) are intentionally not mounted. Players cannot write economy data.
- Customer relationship messaging (`src/routes/crm.js`). Its webhook and push send only log and report success. Nothing is delivered, so it is not mounted.
- Gems were removed from the game: nothing ever earned or spent them. Stars are the server's: the HUD shows the server value for signed-in players, and guests see a sign-in prompt instead of a balance.
- Partial refunds are not reversed automatically; they are logged for a manual decision. Coins already spent before a refund are not recovered, and the balance stops at zero.
- Level wins check the score against the target, but the server does not replay the board. A player can still claim a win with a made-up score, once per paid attempt. Each win pays a fixed reward, so this is limited by energy. The same score feeds the best-score boards, tournaments, and challenges, so those rankings can be inflated the same way.
- The Stripe checkout button is built but has not run against Stripe. The sandbox cannot reach Stripe.
- Subscription entitlements (blocked): the catalog has no subscription products, and the store product IDs are not known to this repository, so events cannot be mapped to an entitlement.

## 🛠 Technology & open-source stack

The platform is built free/open-source-first: every capability has a
self-hosted, OSI-licensed default, and proprietary services exist only behind
optional adapters (payments, app stores). The 2026 stack:

- **Runtime**: Node.js 22/24 LTS, ESM, TypeScript (`nodenext`), Express 5, native `fetch`.
- **Levels**: in-repo seeded generator and solver; self-hosted `date-holidays` calendar (ISC code; CC BY-SA 3.0 data). No AI or paid location/calendar service is required for generation. Optional attributed MET Norway forecasts or a self-hosted Open-Meteo-compatible feed provide weather effects.
- **CI**: workflow modernization is deferred in a separate local-only patch; this branch leaves `.github/workflows` unchanged. See [the migration guide](OPENSOURCE_MIGRATION.md#deferred-ci-modernization) for details.
- **Data**: PostgreSQL + PostgREST (data API), FerretDB (document store), Valkey (cache/queue), MinIO (S3-compatible object storage).
- **AI**: Ollama or any OpenAI-compatible server (vLLM, LiteLLM) for local, open-weights models — no hosted AI vendor required.
- **Push**: self-hosted ntfy or W3C Web Push (VAPID); FCM HTTP v1 remains an optional adapter.
- **Observability**: PostHog (analytics), Prometheus + Grafana (metrics), GlitchTip (error tracking), Mailpit (email).
- **Payments**: Stripe behind a payment adapter, plus Apple/Google store billing — the one unavoidable proprietary touchpoint.

Bring the whole stack up with `docker compose -f docker-compose.opensource.yml up -d`
and `.env.opensource`. Full architecture, migration notes, and the remaining
proprietary touchpoints are documented in [OPENSOURCE_MIGRATION.md](OPENSOURCE_MIGRATION.md).

## 🎮 Gameplay Features

### Core Gameplay
- **Match-3 Mechanics** - Connect 3 or more gems of the same color to clear them from the board
- **Strategic Thinking** - Plan your moves carefully as each level has limited moves
- **Progressive Difficulty** - Levels become increasingly challenging with new obstacles and objectives
- **Multiple Objectives** - Complete various goals like collecting gems, clearing obstacles, or reaching target scores

### Game Modes
- **Classic Mode** - Traditional match-3 gameplay with increasing difficulty
- **Timed Challenges** - Race against the clock to achieve high scores
- **Special Events** - Limited-time modes with unique rewards and mechanics
- **Daily Challenges** - Fresh puzzles every day with exclusive rewards

### Power-ups & Special Items
- **💥 Bomb** - Explodes to clear gems in a 3x3 area
- **🌈 Rainbow Gem** - Matches with any color when used
- **⚡ Lightning** - Clears entire rows or columns
- **🎯 Target Gem** - Destroys specific colored gems
- **💎 Diamond** - Clears all gems of one color
- **🌟 Star** - Creates powerful chain reactions

### Level Progression
- **1000+ Levels** - Endless content with new challenges
- **Star Rating System** - Earn 1-3 stars based on performance
- **Level Objectives** - Clear specific targets, collect items, or survive time limits
- **Boss Levels** - Special challenging levels with unique mechanics
- **Bonus Rounds** - Extra opportunities to earn rewards

### Visual & Audio Experience
- **Royal Theme** - Beautiful castle and kingdom aesthetics
- **Smooth Animations** - Fluid gem movements and satisfying effects
- **Particle Effects** - Spectacular visual feedback for matches
- **Dynamic Backgrounds** - Changing environments as you progress
- **Immersive Sound** - Royal music and satisfying sound effects

### Social Features
- **Leaderboards** - Compete with players worldwide
- **Achievements** - Unlock badges for various accomplishments
- **Daily Rewards** - Login bonuses and special gifts
- **Friends System** - Connect with friends and compare progress
- **Guilds** - Join teams and work together on challenges

### Monetization & Rewards
- **In-Game Currency** - Earn coins through gameplay
- **Special Offers** - Limited-time deals on power-ups and currency
- **Daily Deals** - Discounted items available each day
- **VIP System** - Premium benefits for dedicated players
- **Lucky Wheel** - Spin for random rewards and prizes

### Special Events
- **Seasonal Events** - Holiday-themed levels and rewards
- **Tournaments** - Competitive events with exclusive prizes
- **Limited-Time Modes** - Special gameplay variations
- **Community Challenges** - Global events where everyone contributes
- **Celebration Events** - Anniversary and milestone celebrations

## 🎯 How to Play

### Basic Controls
1. **Select Gems** - Click or tap on gems to select them
2. **Make Matches** - Connect 3 or more gems of the same color
3. **Use Power-ups** - Tap power-up buttons to activate special abilities
4. **Complete Objectives** - Achieve the level's specific goals
5. **Earn Stars** - Perform well to earn 1-3 stars per level

### Tips for Success
- **Plan Ahead** - Look for potential matches before making moves
- **Use Power-ups Wisely** - Save special items for difficult situations
- **Create Combos** - Chain matches together for bonus points
- **Clear Obstacles** - Focus on removing blocking elements first
- **Watch the Timer** - Manage your time effectively in timed levels

### Scoring System
- **Basic Match** - 10 points per gem
- **Combo Bonus** - Extra points for chaining matches
- **Power-up Bonus** - Additional points for using special items
- **Time Bonus** - Extra points for completing levels quickly
- **Perfect Score** - Maximum points for optimal performance

## 🏆 Achievements & Progression

### Achievement Categories
- **Explorer** - Complete levels and discover new areas
- **Collector** - Gather gems, coins, and special items
- **Strategist** - Use power-ups effectively and plan moves
- **Speedster** - Complete levels quickly and efficiently
- **Perfectionist** - Earn 3 stars on multiple levels
- **Social** - Connect with friends and participate in events

### Progression Rewards
- **Level Unlocks** - Access new areas and challenges
- **Power-up Upgrades** - Enhance your special abilities
- **New Characters** - Unlock royal characters and companions
- **Cosmetic Items** - Customize your game experience
- **Exclusive Content** - Special levels and features for dedicated players

## 🌟 Special Features

### Dynamic Weather
- **Weather Effects** - Rain, snow, and sunshine affect gameplay
- **Seasonal Changes** - Different challenges based on the time of year
- **Environmental Hazards** - Weather can create new obstacles
- **Weather Bonuses** - Special rewards during certain conditions

### Kingdom Building
- **Castle Restoration** - Rebuild and decorate your royal castle
- **Garden Design** - Create beautiful gardens with earned decorations
- **Room Customization** - Personalize different areas of your kingdom
- **Unlock New Areas** - Discover new parts of the kingdom as you progress

### Mini-Games
- **Treasure Hunts** - Search for hidden treasures in special levels
- **Memory Games** - Test your memory with royal-themed puzzles
- **Rhythm Challenges** - Tap to the beat of royal music
- **Puzzle Variations** - Different types of matching challenges

## 🎨 Visual Themes

### Royal Aesthetics
- **Golden Palaces** - Luxurious castle environments
- **Magical Gardens** - Enchanted outdoor areas
- **Crystal Caves** - Mysterious underground locations
- **Cloud Kingdoms** - Floating castles in the sky
- **Underwater Palaces** - Aquatic royal environments

### Character Design
- **Royal Family** - Meet the king, queen, and royal court
- **Magical Creatures** - Dragons, unicorns, and fairy companions
- **Villainous Characters** - Challenging antagonists to overcome
- **Friendly NPCs** - Helpful characters that guide your journey

## 🚀 Getting Started

1. **Launch the Game** - Open the game in your web browser
2. **Complete Tutorial** - Learn the basics through guided gameplay
3. **Start Playing** - Begin your royal adventure with level 1
4. **Explore Features** - Discover all the game has to offer
5. **Connect Socially** - Join the community and compete with friends

## 🎵 Immersive Experience

- **Royal Soundtrack** - Orchestral music that enhances the royal theme
- **Sound Effects** - Satisfying audio feedback for every action
- **Voice Acting** - Character voices and narration
- **Ambient Sounds** - Environmental audio that brings the kingdom to life

---

**Ready to begin your royal adventure? Start matching gems and restore the kingdom to its former glory! 👑✨**