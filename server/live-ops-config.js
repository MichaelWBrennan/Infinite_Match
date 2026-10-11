// Live ops config for the free server. Kept separate so economy.js can read it without importing liveops.js.
import { fileURLToPath } from 'node:url';
import { loadLiveOps } from '../src/services/live-ops/live-ops.js';

// LIVE_OPS_CONFIG overrides the shipped config (tests and staging use this).
export function liveOpsPath() {
  return process.env.LIVE_OPS_CONFIG || fileURLToPath(new URL('../config/liveops.json', import.meta.url));
}

// Read on each call, so an operator edit or a test fixture takes effect without a restart.
export function currentLiveOps() {
  return loadLiveOps({ path: liveOpsPath(), reload: true });
}
