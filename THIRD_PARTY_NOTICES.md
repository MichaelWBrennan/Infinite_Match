# Third-Party Notices

This document lists all third-party assets used in Infinite Match, their licenses,
and required attributions. It satisfies the attribution requirements of CC-BY 4.0
and other licenses that mandate credit.

## Asset Inventory

### Match-3 Tile Assets (`assets/match3/`)

| Theme | File Count | License | Source | Attribution |
|-------|-----------|---------|--------|-------------|
| default | 4,176 | CC0 | Kenney.nl — Match-3 Pack | Kenney.nl |
| winter | 280 | CC0 | Kenney.nl — Winter Pack | Kenney.nl |
| spring | 138 | CC0 | Kenney.nl — Spring Pack | Kenney.nl |
| summer | 132 | CC0 | Kenney.nl — Summer Pack | Kenney.nl |
| autumn | 381 | CC0 | Kenney.nl — Autumn Pack | Kenney.nl |
| christmas | 1,005 | CC0 | Kenney.nl — Christmas Pack | Kenney.nl |
| halloween | 1,005 | CC0 | Kenney.nl — Halloween Pack | Kenney.nl |
| st_patrick | 1,005 | CC0 | Kenney.nl — St. Patrick's Pack | Kenney.nl |
| valentines | 1,005 | CC0 | Kenney.nl — Valentine's Pack | Kenney.nl |
| easter | 150 | CC0 | Kenney.nl — Easter Pack | Kenney.nl |
| holiday | 100 | CC0 | Kenney.nl — Holiday Pack | Kenney.nl |
| blocker | 5 | CC0 | Kenney.nl — Match-3 Pack | Kenney.nl |
| ui | 3 | CC0 | Kenney.nl — UI Pack | Kenney.nl |

**Total match-3 PNGs: 9,395**

### Event-Specific Tile Sets (subset of the themes above)

The following event tile sets reference CC-BY licensed assets from OpenGameArt.org.
These require attribution in your game's credits:

| Tile Set ID | Theme Directory | License | Required Attribution |
|-------------|----------------|---------|---------------------|
| `diwali_2026` | `christmas/` (shared) | CC-BY 4.0 | OpenGameArt.org community |
| `lunar_new_year_2027` | `valentines/` (shared) | CC-BY 4.0 | OpenGameArt.org community |
| `womens_day_mar` | `valentines/` (shared) | CC-BY 4.0 | OpenGameArt.org community |

All other event tile sets (Sky Race, King's Cup, Lightning Dash, etc.) are assigned CC0
from Kenney.nl sources.

### Weather Tile Sets

All 8 weather tile sets (clear, partly_cloudy, cloudy, rain, snow, sleet, storm, fog)
are assigned CC0 from Kenney.nl Weather Pack.

### Standalone Holiday Tile Sets

`new_years_day` is assigned CC0 from Kenney.nl Party Pack.

## License Texts

Full license texts are in `assets/licenses/`:

| File | License |
|------|---------|
| `assets/licenses/CC0-1.0.txt` | CC0 1.0 Universal (Public Domain) |
| `assets/licenses/CC-BY-4.0.txt` | Creative Commons Attribution 4.0 International |

## How Attributions Are Tracked in Code

Each tile set in `src/services/levels/tile-sets.js` carries `license`, `sourceUrl`,
and `attribution` fields. Use `licenseForContext(context)` to retrieve them for
in-game credits:

```js
import { licenseForContext } from './src/services/levels/tile-sets.js';

const { license, sourceUrl, attribution } = licenseForContext(context);
// Example: { license: 'CC-BY', sourceUrl: 'https://opengameart.org/...', attribution: 'OpenGameArt.org community' }
```

## Asset Directory Manifest

`assets/manifest.json` maps every tile-set ID to its asset directory, with license,
source URL, and attribution per mapping. It also documents unmapped directories and
known inconsistencies.

## Important: Verify Before Publishing

The license assignments in this document are **recommendations based on likely sources**
(Kenney.nl = CC0, OpenGameArt.org = CC-BY). Before releasing your game, you must:

1. **Download actual assets** from the listed sources (I cannot stream external URLs)
2. **Verify each asset's actual license** on the download page
3. **Update `tile-sets.js` and `assets/manifest.json`** if the actual license differs
4. **Include required attributions** in your game's credits screen (mandatory for CC-BY)
5. **Keep copies of license texts** (`assets/licenses/`) with your distributed assets

## Removed Assets

The following were removed during cleanup because they could not be verified as free use:

| Removed | Reason |
|---------|--------|
| `assets/match3/default/candy-tiles.png` | Broken 14-byte file containing "404: Not Found" |
| `assets/environment/` | Empty placeholder; only contained README referencing Unity Asset Store downloads |
| `assets/weather/` | Empty placeholder; only contained README referencing Unity Asset Store downloads |
| `assets/npcs/` | Empty placeholder; only contained README referencing Mixamo downloads |

These directories no longer exist. If you need environment, weather, or NPC assets,
download them from free/CC sources and add them under `assets/` with proper license
documentation.
