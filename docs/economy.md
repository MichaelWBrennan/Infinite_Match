# Economy and Monetization

## Currencies
- Soft currency: coins (earned per clear, chests, events)
- Hard currency: gems (IAP packs, rewards, sinks: continues, boosters)

## Sinks
- Boosters (coins/gems), continues (gems/rescue bundle), mastery upgrades, decoration meta (future)

## Offers
- Starter, comeback, flash, piggy, rescue bundle; dynamic ladder via RemoteConfig

## Ads
- Rewarded: energy, extra moves, double-win, offerwall fallback
- Interstitials: controlled via caps and percentages; segmentation keys

## Pricing (USD defaults)
- Coins: 0.99/4.99/9.99/19.99 -> 500/3,000/7,500/20,000
- Gems: 0.99/4.99/9.99/19.99 -> 20/120/300/700
- Rescue bundle: 0.99 (configurable)

## Remote-config keys
- `interstitial_on_gameover_pct`, `rv_prelevel_booster_enabled`
- `booster_mastery_*`, `dda_*`
- `rescue_bundle_moves`, `rescue_bundle_booster`

## Telemetry
- `offer_*`, `shop_*`, `econ_*`, `level_result`, `arpdau_usd`

## Roadmap hooks
- Dynamic pricing per segment and per country
- Mystery chests and key loops
- Decoration meta store and subscriptions
