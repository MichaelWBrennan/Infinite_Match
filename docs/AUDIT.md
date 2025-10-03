# Technical Audit

## Architecture and Patterns
- Autoload singletons for cross-cutting (Analytics, RemoteConfig, Offers, SeasonPass, PiggyBank) — good for modularity
- Match3 engine encapsulated as `Resource`; Solver for difficulty estimate — solid for testing/AI
- UI scenes composed with `TileView` overlays and modal scenes — modular

## Strengths
- Data-driven levels and live tuning via RemoteConfig
- Breadth of monetization (IAP, ads, offers, pass, piggy) and analytics hooks
- Live-ops scaffolding (events calendar, tournaments, teams)

## Weaknesses / Risks
- Limited automated tests; add level validation and board sim tests
- Visual polish and VFX/audio layers can be expanded
- Missing cloud save and backup analytics providers

## Missing Systems (now addressed or planned)
- Advanced blockers (licorice, honey), portals, conveyors — added
- Rescue bundle and richer CB combos — added
- Decoration meta layer — planned
- CI/CD export workflows — planned

## Scaling to 1000+ levels
- Keep JSON schema stable; add editor tooling and validation
- Use spawn weights, preplaced specials, conveyors/portals to scale puzzle variety
- Add content linting CI job
