# Economy & Monetization

## Currencies
- **Coins** (soft) - Earned per clear, chests, events
- **Gems** (hard) - IAP packs, rewards, sinks: continues, boosters

## Sinks
- Boosters (coins/gems)
- Continues (gems/rescue bundle)
- Mastery upgrades
- Decoration meta (future)

## Offers
- Starter, comeback, flash, piggy, rescue bundle
- Dynamic ladder via RemoteConfig

## Ads
- **Rewarded:** energy, extra moves, double-win, offerwall fallback
- **Interstitials:** controlled via caps and percentages

## Pricing (USD)
- **Coins:** 0.99/4.99/9.99/19.99 → 500/3,000/7,500/20,000
- **Gems:** 0.99/4.99/9.99/19.99 → 20/120/300/700
- **Rescue bundle:** 0.99 (configurable)

## Remote Config Keys
- `interstitial_on_gameover_pct`, `rv_prelevel_booster_enabled`
- `booster_mastery_*`, `dda_*`
- `rescue_bundle_moves`, `rescue_bundle_booster`

## Telemetry
- `offer_*`, `shop_*`, `econ_*`, `level_result`, `arpdau_usd`

## Future Features
- Dynamic pricing per segment and country
- Mystery chests and key loops
- Decoration meta store and subscriptions