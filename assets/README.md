# Infinite Match Assets

## Active art direction

The shipped game uses one canonical, procedural art system:

- **Source of truth:** `public/js/art-direction.js` (`InfiniteArt`, art direction `celestial-facets-v1`).
- **Theme/palette data:** `src/services/levels/tile-sets.js`, compiled to `public/js/procedural-levels.js`.
- **Runtime rendering:** Phaser and the DOM player experience draw gems, shields, terrain, boosters, UI icons, and the brand mark from the same module. No external image CDN is required for gameplay.
- **Canonical exports:** `public/art/` contains deterministic PNG exports for gems, boosters, UI icons, terrain layers, shields, and app icons. `assets/manifest.json` and `public/art/manifest.json` describe the same export set.
- **Unity UI icons:** `unity/Assets/Resources/UI/Icons/` and `unity-refactored/Assets/Resources/UI/Icons/` are synced from the same exporter.

## Build and verify

```bash
npm run art:build   # regenerate level client + all canonical PNG/manifest exports
npm run art:check   # fail if any exported asset is stale or missing
npm run build       # art:build + TypeScript build
```

The exporter is `scripts/build-art.mjs`. It uses `@napi-rs/canvas` so the same drawing code runs in Node and in the browser. `scripts/build-pwa-icons.py` is a compatibility wrapper around the Node exporter.

## Visual contract

- 64×64 logical tiles, transparent padding, ink outline `#10213a`, paper `#f8fbff`, gold `#f5d58b`.
- Six accessible slot silhouettes: heart, diamond, square, triangle, hexagon, star.
- Every visible board palette gets distinct silhouettes and uppercase symbols, even when the generator mixes a legacy/base color into a themed set.
- Jewel colors are luminance-normalized and checked for at least 4.5:1 contrast against ink.
- Specials, shields, terrain, boosters, and UI icons use the same rounded navy tile, gold accent, bevel/glint, and badge language.
- Brand mark: gold crown over teal diamond on a navy gradient. PWA/maskable/apple icons are generated from the same mark.

## Reference libraries (dormant)

The following directories are **reference-only** and are not loaded by the active web runtime:

- `assets/match3/`
- `assets_external/`
- `unity-refactored/Assets/Textures/` (where present)

Their provenance is **unverified**. Do not ship, attribute, or relicence them as CC0/CC-BY until each source is confirmed. The canonical manifest marks them as reference libraries with unverified provenance.

## License

Active canonical art and tile-set data are original project art licensed under the repository MIT license, attribution: **Infinite Match contributors**. Third-party reference material is not part of the active asset license grant; see `THIRD_PARTY_NOTICES.md`.
