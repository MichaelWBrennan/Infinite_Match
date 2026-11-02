# Asset Licenses

This directory contains license texts for third-party assets used in the
Infinite Match tile sets. Each tile set in `src/services/levels/tile-sets.js`
references a license here via its `license` field.

## License Files

| File | License | Attribution Required |
|------|---------|---------------------|
| `CC0-1.0.txt` | CC0 1.0 Universal (Public Domain) | No |
| `CC-BY-4.0.txt` | Creative Commons Attribution 4.0 International | **Yes** |

## How Licenses Are Assigned

License, source URL, and attribution for each tile set are defined in
`src/services/levels/tile-sets.js` on each tile set object via the `license`,
`sourceUrl`, and `attribution` fields.

## CC-BY Attribution Requirements

Three tile sets are assigned CC-BY 4.0 (from OpenGameArt.org sources):

| Tile Set | Required Attribution |
|----------|---------------------|
| `diwali_2026` | OpenGameArt.org community |
| `lunar_new_year_2027` | OpenGameArt.org community |
| `womens_day_mar` | OpenGameArt.org community |

CC-BY assets **require attribution** in your game's credits screen. See
`THIRD_PARTY_NOTICES.md` at the repository root for the complete attribution list.

## Adding a New Asset

1. Download the asset from a free/CC source (Kenney.nl, OpenGameArt.org, etc.)
2. Place it in the appropriate directory under `assets/match3/`
3. Record the license, source URL, and attribution in `tile-sets.js`
4. If using a license not yet represented here, add its text to this directory
5. Update `assets/manifest.json` with the same license information
6. Update `THIRD_PARTY_NOTICES.md` with the new attribution

## Important

All 44 CC0-assigned assets and 3 CC-BY-assigned assets are **recommendations based
on likely sources**. Before releasing, verify each downloaded asset's actual license
on the source website and update `tile-sets.js` / `assets/manifest.json` if different.

See `THIRD_PARTY_NOTICES.md` for the full third-party asset inventory.
