# Infinite Match - Royal Puzzle Adventure

A captivating match-3 puzzle game featuring royal themes, magical gems, and endless entertainment. Experience the thrill of matching colorful gems while helping restore a magnificent kingdom!

## Implementation status

This section lists what is built and tested, and what is mounted on the server. The feature lists below are the product goals. Anything not marked **Built** is not implemented yet.

**Built and tested**
- Match-3 core: swaps, matches of 3+, cascades, gravity, refill, and a no-moves reshuffle.
- Power-ups: bomb (3x3), rainbow (whole board), lightning (column), diamond (one colour), target (plus shape), star (row and column). Diamond, target, and star arm on press and fire on the next gem tap.
- Power-up inventory: signed-in players load their counts from the server and confirm each use before it takes effect. Guests keep local counts.
- Levels: procedural, no fixed cap. Every 10th level is a boss with a doubled target. Stars are relative to each level's target. A daily challenge is derived from the date.
- Lucky wheel: one free spin per day with weighted rewards, granted on the server.
- Level results for tuning. Signed-in players report each finished level (`POST /api/level-results`). The server checks that a win reaches the target score and recomputes the stars. Admins read `GET /api/admin/level-tuning`, which flags a level as `too_hard` (win rate under 30%) or `too_easy` (over 95%) after 20 attempts. Results are stored in `var/level-results.jsonl` (git-ignored) with no player ID.
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
- Ad event revenue reported by the client is not counted. `POST /api/ads/event` stores it as `clientReportedRevenueUsd` for debugging. The revenue total comes only from a server-verified source, which is not built yet.
- Store billing (`POST /api/monetization/receipt/verify`, session required). iOS: a StoreKit 2 `signedTransaction` is verified offline against the pinned Apple Root CA G3 (`APPLE_ROOT_CA_G3`), with the bundle ID (`APPLE_BUNDLE_ID`) checked and Sandbox refused unless `APPLE_ALLOW_SANDBOX=true`. Legacy receipts check the bundle and environment too. Android: the purchase is checked with the Google Play API for the package in `GOOGLE_PACKAGE_NAME`. Store SKUs map to catalog products in `src/services/payments/product-catalog.js`. Each purchase is granted once per transaction, and a transaction owned by one player is refused to others (`transaction_claimed`, 409).
- Live ops (`GET /api/live-ops/today`, session required). Reads `config/liveops.json`: dated events and deal windows. A deal price applies only inside its window, is at least $0.99, and is below the catalog price. An invalid config is logged and ignored, so catalog prices apply.

**Built, but not verified against the live service**
- Stripe, Apple, and Google calls have not been tested against their live APIs. The sandbox cannot reach them. The Apple verifier is tested with locally generated keys and certificates. The Google Play purchase check is not verified: this sandbox cannot reach `androidpublisher.googleapis.com`, so it fails closed here.
- Store SKUs. `product-catalog.js` uses the catalog IDs (`remove_ads`, `unlock_all_themes`) as the store product IDs. The real App Store Connect and Google Play product IDs are not known to this repository and must be set there.
- Device billing (StoreKit and Play Billing on a phone) has not been run. Only the server side of store purchases is built.
- Live ops deals are not yet in the game client. The server reports them; the client does not show them.
- Canvas title, sign-in, and the menu wiring are checked by static tests (`src/__tests__/client-wiring.test.ts`). They have not been run in a browser, because this sandbox has no browser.
- Subscription events are recorded, but they do not yet change entitlements.
- Durable economy (opt-in). With `ECONOMY_STORE=mongo`, player balances are saved to MongoDB, and a coin purchase is credited only when that store is on. Without it, balances are in memory and lost on restart, so purchases refuse to credit and the provider retries them. Run production with `ECONOMY_STORE=mongo`. The save, reload, and rollback rules are tested against an in-memory stand-in for the store (`src/__tests__/durable-economy.test.ts`). No MongoDB server has been run against them yet.
- Client shop. Gems, stars, and energy are no longer sold or given out by the shop, and loot boxes are paid for in coins through the server. The old client code granted currency for free.

**Not built yet** (listed in the sections below, but not implemented)
- Timed and endless modes as separate game modes. Every level currently has the 60-second timer.
- Guilds, friends, and social leaderboards. Services exist, but no routes or UI.
- Weather effects. The weather service needs Supabase, which is not configured here.
- Kingdom garden design and room customization. Kingdom renovation is built (see Built), but levels do not change gameplay yet.
- Mini-games: treasure hunts, memory games, and rhythm challenges.
- VIP system. Live ops deals exist on the server (see Built), but there is no VIP tier.
- Seasonal events, tournaments, community challenges, and boss mechanics beyond a higher target.
- Battle pass premium rewards. `POST /api/battlepass/premium/reward` returns 501 until it grants items.
- A season pass purchase. No price exists in the repository, so the product is not sold.
- Gameplay stars are still kept in the browser (`localStorage`). They can be edited there, so they must not be used as a sale currency until the game reads them from the server. Gems were removed from the game: nothing ever earned or spent them.
- Consumable refunds and chargebacks are not handled. Coins credited for a payment that is later refunded stay with the player.
- Coin packs in the client show fixed labels that mirror `product-catalog.js`. Change both when prices change.
- The Stripe checkout button is built but has not run against Stripe. The sandbox cannot reach Stripe.
- Automatic difficulty adjustment. The level-tuning report is read-only: a person changes the level config after reading it.
- Level results are kept in a single JSONL file. That works for one server; it needs a database before scaling out.
- Economy write routes (`/api/economy/*`) are intentionally not mounted. Players cannot write economy data.
- Customer relationship messaging (`src/routes/crm.js`). Its webhook and push send only log and report success. Nothing is delivered, so it is not mounted.

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