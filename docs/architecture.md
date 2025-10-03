# Architecture Overview

This project is a modular, data-driven Match-3 mobile game built with Godot 4.x, organized to support live ops, monetization, and rapid content iteration.

## High-level layers
- Runtime core (Godot): match-3 engine, UI, scenes
- Content: JSON levels in `config/levels`, themes in `config/themes`
- Live ops: remote config (`scripts/RemoteConfig.gd`), events (`scripts/Events.gd`), offers (`scripts/Offers.gd`), tournament/team systems
- Monetization: IAP (`scripts/IAPManager.gd`), ads (`scripts/AdManager.gd`, `scripts/AdMediation.gd`), piggy bank and passes
- Analytics: ByteBrew bridge with custom events; extensible to Firebase/GameAnalytics hooks
- Platform bridges: Android/iOS native plugin placeholders already present

## Strengths
- Data-driven levels and goals with blockers and specials
- Robust remote config for tuning and experiments
- Breadth of monetization and live-ops primitives (offers, pass, piggy, tournament)
- Modular UI scenes and autoload singletons for subsystems

## Gaps (now addressed)
- Advanced board systems: portals, conveyors, licorice, honey, vines (added)
- Special-combo richness: expanded color-bomb combos (added)
- Content scale: demo levels + JSON schema; roadmap to 1000+ levels
- Visual clarity: overlays for blockers and systems (added)

## Clean architecture & extensibility
- Autoloads for cross-cutting systems (Analytics, RemoteConfig, Offers)
- Match-3 engine as `Resource` for testability; Solver clone used to estimate difficulty
- UI uses composition with `TileView` overlays; new overlays are additive

## Data model
- Levels JSON fields: `size, num_colors, move_limit, goals[], jelly, holes, crates, ice, locks, chocolate, vines, licorice, honey, portals, conveyors, preplaced, spawn_weights`
- Goals: `collect_color, clear_jelly, deliver_ingredients, clear_vines, clear_licorice, clear_honey`

## Live ops
- Remote-config keys for pricing, ads frequency, DDA, offers; ByteBrew remote-config bridge
- Events calendar routing to seasonal themes; tournaments and team chests with weekly seeds

## Monetization
- Energy/lives, RV placements, interstitials with caps, offerwall
- IAP: coin/gem packs, passes, piggy, dynamic offers, rescue bundle

## Testing & telemetry
- `scripts/tests/Tests.gd` scaffolding; Solver difficulty estimator; analytics events on key actions

## Next steps
- Decoration meta layer (rooms, tasks) as separate Autoload + scene stack
- Cloud save via PlayFab/Firebase; A/B buckets; GameAnalytics/Firebase adapters
- CI: build/export pipelines; unit tests; automated level validation
