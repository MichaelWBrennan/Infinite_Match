# Live Ops Design

## Systems
- Rotation calendar with seasonal themes and daily event sets
- Tournaments (weekly seed), team chests, bingo/treasure hooks
- Battle pass (free/premium), XP gain per tiles cleared

## Controls
- Remote-config for events toggles and rewards
- Offers autoload emits on eligibility: starter, comeback, flash

## Events Telemetry
- `offer_available/view/cta/dismiss`, `star_chest_claim`, `team_chest_claim`

## Seasonal Content
- Theme assets loaded via `Theme.gd` provider and `config/themes/*.json`

## Next steps
- Multi-track events, leagues, divisions; team events with milestones
- Limited-time blockers (frost/honey variants) via level tags
