#!/usr/bin/env node
// Regenerate the committed golden rule vectors from the canonical JavaScript rules.
// Usage: npm run vectors:build   (CI and the test suite fail if the fixture is stale)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serializeGoldenVectors } from '../src/services/levels/golden-vectors.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, 'fixtures/golden/rules-v5.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, serializeGoldenVectors());
console.log(`wrote ${target.replace(`${root}/`, '')}`);
