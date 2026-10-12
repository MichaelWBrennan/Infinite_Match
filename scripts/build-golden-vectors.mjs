#!/usr/bin/env node
// Regenerate the committed golden rule vectors from the canonical JavaScript rules.
// Usage: npm run vectors:build   (CI and the test suite fail if a fixture is stale)
// rules-v5.json is frozen history for shipped v5 definitions; rules-v6.json covers the blocker stage.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeGoldenVectors, buildGoldenVectors, LEVEL_CASES, BLOCKER_LEVEL_CASES } from '../src/services/levels/golden-vectors.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputs = [
  ['fixtures/golden/rules-v5.json', serializeGoldenVectors(buildGoldenVectors(5, LEVEL_CASES))],
  ['fixtures/golden/rules-v6.json', serializeGoldenVectors(buildGoldenVectors(6, [...LEVEL_CASES, ...BLOCKER_LEVEL_CASES]))],
];
for (const [path, text] of outputs) {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, text);
  console.log(`wrote ${path}`);
}
