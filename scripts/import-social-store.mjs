#!/usr/bin/env node
// One-time import of the JSON social file into the shared MongoDB store (live ops S1).
// Idempotent: if the shared document already exists, nothing changes. Needs SOCIAL_STORE=mongo and the database URL.
import fs from 'node:fs';
import { importSocialFile, isMongoSocialStore, socialBackendFromEnv } from '../src/services/social/social-backend.js';
import { socialStoreFile } from '../src/services/social/social-store.js';

if (!isMongoSocialStore()) {
  console.error('Set SOCIAL_STORE=mongo before importing. The JSON file is the only store otherwise.');
  process.exit(1);
}
const file = socialStoreFile();
const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
const outcome = await importSocialFile(socialBackendFromEnv(), data);
console.log(`Social import: ${outcome} (${file})`);
process.exit(0);
