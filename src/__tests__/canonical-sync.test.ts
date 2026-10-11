import { describe, expect, test } from '@jest/globals';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';
import { buildGoldenVectors, serializeGoldenVectors, GOLDEN_FORMAT } from '../services/levels/golden-vectors.js';
import { renderLevelClient } from '../../scripts/build-level-client.js';

// Canonical client = the Phaser web game. Its rules come from src/services/levels/*; the browser
// artifact public/js/procedural-levels.js and the committed golden fixture must both stay in sync.
// Jest runs from the repository root (npm test / npm run check:sync), like the other suites.
const fixturePath = 'fixtures/golden/rules-v5.json';
const bundlePath = 'public/js/procedural-levels.js';

function loadBundle() {
  const sandbox: any = {};
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(bundlePath, 'utf8'), sandbox);
  return sandbox.InfiniteLevels;
}

describe('canonical client sync', () => {
  test('the committed browser bundle is the one generated from the pure rules', () => {
    expect(readFileSync(bundlePath, 'utf8')).toBe(renderLevelClient());
  });

  test('the committed golden fixture is current with the rules that generate it', () => {
    expect(readFileSync(fixturePath, 'utf8')).toBe(serializeGoldenVectors());
  });

  test('the golden fixture has the declared format and covers every rule family', () => {
    const doc = JSON.parse(readFileSync(fixturePath, 'utf8'));
    expect(doc.format).toBe(GOLDEN_FORMAT);
    expect(doc.rulesVersion).toBe(5);
    expect(doc.hash.length).toBeGreaterThanOrEqual(4);
    expect(doc.rng.every((seed: any) => seed.outputs.length === 8)).toBe(true);
    const modes = new Set(doc.levels.map((level: any) => level.input.mode));
    expect([...modes].sort()).toEqual(['classic', 'daily', 'endless', 'timed']);
    // Shield stages (levels 4 and 8) and the boss (level 10) must be represented.
    const names = doc.levels.map((level: any) => level.name);
    expect(names).toEqual(expect.arrayContaining(['classic-4-us-east-shield-stage', 'classic-8-us-east-shield-stage', 'classic-10-boss']));
  });

  test('every golden level has a legal opening move and a verified first move', () => {
    const doc = buildGoldenVectors();
    for (const level of doc.levels) {
      expect(level.expected.firstLegalSwap).not.toBeNull();
      expect(level.expected.firstMove).not.toBeNull();
      expect(level.expected.legalOpeningMoves).toBeGreaterThan(0);
    }
  });

  test('the browser bundle reproduces hashes, RNG streams and levels exactly', () => {
    const doc = JSON.parse(readFileSync(fixturePath, 'utf8'));
    const bundle = loadBundle();
    expect(typeof bundle.generateLevel).toBe('function');

    for (const { text, seed } of doc.hash) expect(bundle.hashSeed(text)).toBe(seed);

    for (const { seed, outputs } of doc.rng) {
      const rng = { state: seed >>> 0 };
      for (const output of outputs) {
        const value = bundle.nextRandom(rng);
        expect(rng.state).toBe(output.state);
        expect(value * 4294967296).toBe(output.numerator);
      }
    }

    for (const level of doc.levels) {
      const { input, expected } = level;
      const definition = bundle.generateLevel(input.level, expected.context, input.mode, input.rulesVersion);
      expect(definition.id).toBe(expected.id);
      expect(definition.seed).toBe(expected.seed);
      expect(definition.refillState).toBe(expected.refillState);
      expect(definition.board).toEqual(expected.board);
      expect(definition.gemTypes).toEqual(expected.gemTypes);
      expect(definition.gemWeights).toEqual(expected.gemWeights);
      expect(definition.targetScore).toBe(expected.targetScore);
      expect(definition.objectives).toEqual(expected.objectives);
      expect(definition.shields ?? null).toEqual(expected.shields);

      const [r, c, nr, nc] = expected.firstLegalSwap;
      const bundleMove = bundle.simulateLevelMove(definition, {
        board: definition.board,
        refillState: definition.refillState,
        specials: definition.specials,
        shields: definition.shields,
        objectiveProgress: bundle.initialObjectiveProgress(definition),
        score: 0,
      }, [r, c, nr, nc]);
      expect(bundleMove.score).toBe(expected.firstMove.score);
      expect(bundleMove.board).toEqual(expected.firstMove.board);
      expect(bundleMove.refillState).toBe(expected.firstMove.refillState);
    }
  });

  test('production routing serves the canonical page and every local asset it references', () => {
    const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
    const rewrites: Array<{ source: string; destination: string }> = vercel.rewrites;
    const rootRewrite = rewrites.find((rule) => rule.source === '/');
    expect(rootRewrite?.destination).toBe('/index.html');

    // Emulate the Vercel order: an existing repository file wins, otherwise the first matching rewrite.
    const resolveRoute = (path: string) => {
      const file = path.replace(/^\//, '') || 'index.html';
      if (existsSync(file)) return file;
      for (const rule of rewrites) {
        const pattern = new RegExp(`^${rule.source.replace(/\(\.\*\)/g, '(.*)')}$`);
        const match = path.match(pattern);
        if (!match) continue;
        const target = rule.destination.replace(/\$(\d+)/g, (_, index) => match[Number(index)] ?? '').replace(/^\//, '');
        return existsSync(target) ? target : null;
      }
      return null;
    };

    const page = readFileSync('index.html', 'utf8');
    const refs = new Set<string>();
    for (const match of page.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const ref = match[1];
      if (/^(https?:|\/\/|#|data:|mailto:)/.test(ref)) continue;
      refs.add(`/${ref.split(/[?#]/)[0].replace(/^\//, '')}`);
    }
    expect(refs.size).toBeGreaterThan(5);
    const unresolved = [...refs].filter((ref) => resolveRoute(ref) === null);
    expect(unresolved).toEqual([]);
    // The bundle the browser needs must come from the canonical public folder.
    expect(resolveRoute('/js/procedural-levels.js')).toBe('public/js/procedural-levels.js');
  });
});
