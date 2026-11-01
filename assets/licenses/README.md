# Asset Licenses

This directory contains license texts for third-party assets used in the
Infinite Match tile sets. Each tile set in `src/services/levels/tile-sets.js`
references a license here via its `license` field.

## License Files

| File | License | Attribution Required |
|------|---------|---------------------|
| `CC0-1.0.txt` | CC0 1.0 Universal (Public Domain) | No |
| `CC-BY-4.0.txt` | Creative Commons Attribution 4.0 International | Yes |

## How Licenses Are Assigned

- **CC0** — Assets from Kenney.nl (kenney.nl). These are public domain; no
  attribution is required, though crediting Kenney is appreciated.
- **CC-BY 4.0** — Assets from OpenGameArt.org (opengameart.org) or other
  community contributors. Attribution to the original author is required.

## Per-Tile-Set License Information

License, source URL, and attribution for each tile set are defined in
`src/services/levels/tile-sets.js` on each tile set object via the `license`,
`sourceUrl`, and `attribution` fields.

## Adding a New Asset

1. Download the asset from a free/CC source (Kenney.nl, OpenGameArt.org, etc.)
2. Place it in the appropriate directory under `assets/match3/`
3. Record the license, source URL, and attribution in `tile-sets.js`
4. If using a license not yet represented here, add its text to this directory
5. Update `assets/manifest.json` with the same license information
