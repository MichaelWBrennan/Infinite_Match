import { describe, expect, test } from '@jest/globals';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createCanvas } from '@napi-rs/canvas';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8');

function artSandbox() {
  const sandbox: any = { console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const file of ['public/js/procedural-levels.js', 'public/js/art-direction.js']) {
    vm.runInContext(read(file), sandbox, { filename: file });
  }
  return sandbox;
}

function opaquePixels(draw: (ctx: any) => void, size = 64) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  draw(ctx);
  const data = ctx.getImageData(0, 0, size, size).data;
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
  return count;
}

describe('canonical art direction', () => {
  test('every theme gem keeps accessible contrast and a distinct silhouette/symbol', () => {
    const { InfiniteArt: art } = artSandbox();
    expect(art.VERSION).toBe('celestial-facets-v1');
    expect(art.SIZE).toBe(64);
    const themes = art.themeCatalog();
    expect(themes.length).toBeGreaterThanOrEqual(30);
    for (const theme of themes) {
      expect(theme.gems).toHaveLength(6);
      const shapes = new Set(theme.gems.map((gem: any) => gem.shape));
      const symbols = new Set(theme.gems.map((gem: any) => gem.symbol));
      expect(shapes.size).toBe(6);
      expect(symbols.size).toBe(6);
      for (const gem of theme.gems) {
        expect(art.contrast(gem.color, art.INK)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test('mixed generated palettes still receive six distinct non-color identities', () => {
    const { InfiniteArt: art } = artSandbox();
    const context = { season: 'autumn', month: 11, hemisphere: 'north', holidays: [], events: [] };
    const types = ['amethyst_purple', 'orange', 'maple_yellow', 'pumpkin_gold', 'rust_orange', 'acorn_brown'];
    const visuals = art.setContext(context, types);
    expect(Object.keys(visuals)).toEqual(types);
    expect(new Set(types.map((type) => visuals[type].shape)).size).toBe(types.length);
    expect(new Set(types.map((type) => visuals[type].symbol)).size).toBe(types.length);
    for (const type of types) expect(art.contrast(visuals[type].color, art.INK)).toBeGreaterThanOrEqual(4.5);
  });

  test('gems, specials, shields, terrain, boosters, UI icons and brand all rasterize locally', () => {
    const { InfiniteArt: art } = artSandbox();
    const visuals = art.visuals;
    const type = Object.keys(visuals)[0];
    expect(opaquePixels((ctx) => art.drawGem(ctx, type, null, visuals))).toBeGreaterThan(200);
    for (const special of art.specialTypes) {
      expect(opaquePixels((ctx) => art.drawGem(ctx, type, special, visuals))).toBeGreaterThan(200);
    }
    for (const layers of [1, 2]) expect(opaquePixels((ctx) => art.drawShield(ctx, layers))).toBeGreaterThan(100);
    for (const kind of art.terrainTypes) expect(opaquePixels((ctx) => art.drawTerrain(ctx, kind, 2))).toBeGreaterThan(100);
    for (const booster of art.boosterTypes) expect(opaquePixels((ctx) => art.drawBooster(ctx, booster))).toBeGreaterThan(200);
    for (const icon of art.uiIcons) expect(opaquePixels((ctx) => art.drawUiIcon(ctx, icon))).toBeGreaterThan(200);
    expect(opaquePixels((ctx) => art.drawBrand(ctx, 64), 64)).toBeGreaterThan(2000);
    expect(opaquePixels((ctx) => art.drawBrand(ctx, 64, { maskable: true }), 64)).toBeGreaterThan(3000);
  });
});

describe('texture atlas packing', () => {
  test('builds a power-of-two atlas with padded, non-overlapping frames', async () => {
    const sandbox: any = { console };
    sandbox.window = sandbox;
    sandbox.document = { createElement: () => createCanvas(64, 64) };
    vm.createContext(sandbox);
    vm.runInContext(read('public/js/texture-atlas.js'), sandbox, { filename: 'texture-atlas.js' });
    const added: string[] = [];
    const scene = {
      textures: {
        createCanvas: (_key: string, width: number, height: number) => {
          const canvas = createCanvas(width, height);
          return {
            canvas,
            getContext: () => canvas.getContext('2d'),
            add: (name: string) => added.push(name),
            refresh: () => {},
            destroy: () => {},
          };
        },
      },
    };
    const atlas = new sandbox.TextureAtlas(scene, { size: 64, padding: 2, maxAtlasSize: 2048 });
    const visuals = { red: {}, blue: {} };
    await atlas.buildFromVisuals(visuals, ['row', 'column', 'burst', 'prism'], () => {}, () => {});
    expect(atlas.built).toBe(true);
    expect(atlas.frames.size).toBe(30);
    expect(added.length).toBe(30);
    expect(Math.log2(atlas.width) % 1).toBe(0);
    expect(atlas.width).toBe(atlas.height);
    const frames = [...atlas.frames.values()];
    for (const frame of frames) {
      expect(frame.x % 66).toBe(0);
      expect(frame.y % 66).toBe(0);
      expect(frame.x + 64).toBeLessThanOrEqual(atlas.width);
      expect(frame.y + 64).toBeLessThanOrEqual(atlas.height);
    }
    for (let i = 0; i < frames.length; i++) {
      for (let j = i + 1; j < frames.length; j++) {
        const a = frames[i]; const b = frames[j];
        const overlap = a.x < b.x + 64 && b.x < a.x + 64 && a.y < b.y + 64 && b.y < a.y + 64;
        expect(overlap).toBe(false);
      }
    }
    expect(atlas.textureFor('red', 'row', 2)).toEqual({ texture: 'gem_atlas', frame: 'gem_red_row_shield2' });
  });
});

describe('canonical asset exports', () => {
  const manifest = JSON.parse(read('public/art/manifest.json'));
  const rootManifest = JSON.parse(read('assets/manifest.json'));

  test('web and repository manifests describe the same canonical set', () => {
    expect(manifest.artDirection).toBe('celestial-facets-v1');
    expect(manifest.basePath).toBe('.');
    expect(rootManifest.basePath).toBe('public/art');
    expect({ ...manifest, basePath: 'public/art' }).toEqual(rootManifest);
    expect(manifest.license).toBe('MIT');
    expect(manifest.referenceLibraries.every((entry: any) => entry.status === 'reference-only')).toBe(true);
  });

  test('every exported PNG exists and has a valid PNG signature', () => {
    const files: string[] = [];
    for (const theme of Object.values<any>(manifest.themes)) for (const gem of theme.gems) files.push(gem.file);
    files.push(...Object.values<string>(manifest.boosters));
    files.push(...Object.values<string>(manifest.uiIcons));
    for (const layers of Object.values<any>(manifest.terrain)) files.push(...Object.values<string>(layers));
    files.push(...Object.values<string>(manifest.shields));
    expect(files.length).toBeGreaterThan(250);
    for (const file of files) {
      const full = path.join(ROOT, 'public/art', file);
      expect(existsSync(full)).toBe(true);
      const buf = readFileSync(full);
      expect(buf.subarray(1, 4).toString('ascii')).toBe('PNG');
    }
    // App/PWA icons live under public/icons, one level above the art atlas root.
    for (const icon of Object.values<any>(manifest.icons)) {
      const full = path.join(ROOT, 'public/art', icon.file);
      expect(existsSync(full)).toBe(true);
      const buf = readFileSync(full);
      expect(buf.subarray(1, 4).toString('ascii')).toBe('PNG');
    }
    for (const icon of ['bomb', 'coin', 'gear', 'hammer', 'heart', 'rocket', 'shop', 'shuffle', 'star', 'timer']) {
      for (const dir of ['assets/ui/icons', 'unity/Assets/Resources/UI/Icons', 'unity-refactored/Assets/Resources/UI/Icons']) {
        expect(existsSync(path.join(ROOT, dir, `${icon}.png`))).toBe(true);
      }
    }
  });

  test('deployment serves the canonical art folder and keeps its manifest', () => {
    const vercel = JSON.parse(read('vercel.json'));
    expect(vercel.rewrites).toEqual(expect.arrayContaining([
      { source: '/art/(.*)', destination: '/public/art/$1' },
    ]));
    const ignore = read('.vercelignore').split('\n');
    expect(ignore).toContain('!public/art/manifest.json');
    const sw = read('public/sw.js');
    expect(sw).toContain("'/js/art-direction.js'");
    expect(sw).toContain("'/js/texture-atlas.js'");
  });
});
