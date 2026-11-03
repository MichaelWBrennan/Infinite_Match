# Asset Licenses

## Active canonical art

The active tile sets in `src/services/levels/tile-sets.js` and the procedural art in
`public/js/art-direction.js` are original Infinite Match project art:

- License: **MIT** (repository license)
- Attribution: **Infinite Match contributors**
- Source URL: none; generated locally by `scripts/build-art.mjs`

The license texts in this directory are retained for reference only. They are **not**
the license of the active canonical gem/UI/terrain exports.

## Dormant reference libraries

`assets/match3/`, `assets_external/`, and any Unity reference texture libraries have
**unverified provenance**. Older notes in this repository described them as likely
CC0/CC-BY from Kenney.nl or OpenGameArt.org; those descriptions were recommendations,
not verified license grants.

Before using any reference asset in a shipped build:

1. Identify the exact upstream source and download page.
2. Verify the actual license and attribution requirements.
3. Record the verified license, source URL, and attribution in the asset manifest.
4. Add required credits to `THIRD_PARTY_NOTICES.md` and the game credits screen.
5. Keep the applicable license text with the distributed asset.

Until then, treat these libraries as internal reference only.
