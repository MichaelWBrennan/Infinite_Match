# Third-Party Notices

## Active game assets

The active web runtime does not load third-party image packs. Gems, shields, terrain,
boosters, UI icons, and app/brand icons are generated from the canonical project art
system:

- `public/js/art-direction.js` (`InfiniteArt`, `celestial-facets-v1`)
- `src/services/levels/tile-sets.js`
- `scripts/build-art.mjs`
- exports under `public/art/`, `public/icons/`, `assets/ui/`, and Unity UI icon folders

These active assets are original project art under the repository **MIT** license,
attribution **Infinite Match contributors**.

## Dormant reference libraries

The repository contains large reference-only image libraries, including:

- `assets/match3/`
- `assets_external/`
- Unity reference texture folders where present

Their provenance is **unverified**. Historical manifests/notes described them as
likely CC0 from Kenney.nl or CC-BY from OpenGameArt.org, but those were source
recommendations, not confirmed license grants. They are not loaded by the active web
runtime and are not covered by the active canonical asset license grant.

Do not publish or redistribute these reference libraries until each asset’s upstream
source, license, and attribution requirements have been verified and recorded.

## Verified third-party runtime code

Third-party JavaScript/runtime libraries remain subject to their own licenses. In
particular, Phaser is vendored under `public/js/phaser.min.js` and is licensed under
the MIT license; see its source/header and the repository dependency notices where
applicable.
