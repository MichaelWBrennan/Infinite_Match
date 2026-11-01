/**
 * Experiment Service - A/B testing framework for match-3 LiveOps.
 *
 * Supports segment-based rollout: each experiment defines variants, traffic
 * allocation, and optional segment filters (e.g. "level < 50", "payer == true").
 * Players are stickily assigned to a variant via SHA-1 hash of experiment+playerId,
 * so the same player always sees the same variant for the same experiment.
 *
 * Conversion events are logged per (experiment, variant, player) and the results
 * endpoint computes conversion rates and lift per variant for analysis.
 *
 * All state lives in JSONL files under monitoring/reports/; no database required.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { dirname } from 'path';
import { Logger } from '../../core/logger/index.js';

const logger = new Logger('ExperimentService');

const REPORTS_DIR = 'monitoring/reports';
const EXPERIMENTS_FILE = join(REPORTS_DIR, 'experiments.jsonl');
const ASSIGNMENTS_FILE = join(REPORTS_DIR, 'experiment-assignments.jsonl');
const CONVERSIONS_FILE = join(REPORTS_DIR, 'experiment-conversions.jsonl');

async function ensureDir() {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
}

async function appendJsonl(file, obj) {
  await ensureDir();
  await fs.appendFile(file, JSON.stringify(obj) + '\n', 'utf-8');
}

async function readJsonl(file) {
  try {
    const text = await fs.readFile(file, 'utf-8');
    const rows = [];
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try { rows.push(JSON.parse(line)); } catch { /* skip malformed */ }
    }
    return rows;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

/**
 * Registered experiment definitions. In production these would come from a config
 * or remote config; here they are defined in code so the framework works out of
 * the box.
 *
 * Each experiment:
 *  - id: unique experiment id
 *  - name: display name
 *  - variants: array of { id, label, config } — config is what the client receives
 *  - traffic: fraction of players to include (0-1). Rest are control (no variant).
 *  - segment: optional filter function(player) -> boolean
 *  - goalEvent: the conversion event name to track (e.g. 'purchase', 'level_complete')
 */
const EXPERIMENTS = {
  'continue_price_test': {
    id: 'continue_price_test',
    name: 'Continue price sensitivity',
    description: 'Test discounted continue prices after near-miss losses.',
    variants: [
      { id: 'control', label: 'Control (100 coins)', config: { discountPercent: 0 } },
      { id: 'discount_30', label: '30% off', config: { discountPercent: 30 } },
      { id: 'discount_50', label: '50% off', config: { discountPercent: 50 } },
    ],
    traffic: 1.0,
    goalEvent: 'continue_purchase',
  },
  'life_refill_price_test': {
    id: 'life_refill_price_test',
    name: 'Life refill price test',
    description: 'Test life refill bundle pricing.',
    variants: [
      { id: 'control', label: 'Control (5 lives, $1.99)', config: { priceCents: 199, lives: 5 } },
      { id: 'bundle_10', label: '10 lives, $2.99', config: { priceCents: 299, lives: 10 } },
    ],
    traffic: 1.0,
    goalEvent: 'life_refill_purchase',
  },
};

/** Returns all registered experiment definitions. */
export function listExperiments() {
  return Object.values(EXPERIMENTS);
}

/** Returns a single experiment definition, or null. */
export function getExperiment(id) {
  return EXPERIMENTS[id] ?? null;
}

/**
 * Legacy sticky assignment: hash experiment+userId to pick a variant.
 * Kept for backward compatibility with existing tests and callers.
 */
export function stickyAssign(experiment, userId, variants) {
  const h = createHash('sha1').update(`${experiment}:${userId}`).digest('hex').slice(0, 8);
  const n = parseInt(h, 16);
  const idx = n % variants.length;
  return variants[idx];
}

/**
 * Sticky assignment: hash experiment+playerId to pick a variant deterministically.
 * Returns { variantId, variant, inExperiment } where inExperiment is false when
 * the player falls outside the traffic allocation or fails the segment filter.
 */
export function assignPlayer(experimentId, playerId, player = {}) {
  const experiment = EXPERIMENTS[experimentId];
  if (!experiment) return { variantId: null, variant: null, inExperiment: false };

  // Segment filter: if the player doesn't match, they are not in the experiment.
  if (experiment.segment && !experiment.segment(player)) {
    return { variantId: null, variant: null, inExperiment: false };
  }

  // Traffic allocation: hash decides whether the player is included at all.
  const includeHash = createHash('sha1').update(`${experimentId}:include:${playerId}`).digest('hex').slice(0, 8);
  const includeRoll = parseInt(includeHash, 16) / 0xffffffff;
  if (includeRoll >= experiment.traffic) {
    return { variantId: null, variant: null, inExperiment: false };
  }

  // Variant selection within the included population.
  const h = createHash('sha1').update(`${experimentId}:${playerId}`).digest('hex').slice(0, 8);
  const n = parseInt(h, 16);
  const idx = n % experiment.variants.length;
  const variant = experiment.variants[idx];

  return { variantId: variant.id, variant, inExperiment: true };
}

/** Records an assignment event (called when the client requests a variant). */
export async function recordAssignment(experimentId, playerId, variantId, inExperiment) {
  await appendJsonl(ASSIGNMENTS_FILE, {
    type: 'assign',
    experimentId,
    playerId,
    variantId,
    inExperiment,
    ts: Date.now(),
  });
}

/** Records a conversion event for an experiment variant. */
export async function recordConversion(experimentId, playerId, variantId, event, value = 1) {
  await appendJsonl(CONVERSIONS_FILE, {
    type: 'convert',
    experimentId,
    playerId,
    variantId,
    event,
    value,
    ts: Date.now(),
  });
}

/**
 * Computes experiment results: conversion rate per variant, lift vs control,
 * and sample sizes. Returns an array of result rows.
 */
export async function computeResults(experimentId) {
  const experiment = EXPERIMENTS[experimentId];
  if (!experiment) return null;

  const assignments = await readJsonl(ASSIGNMENTS_FILE);
  const conversions = await readJsonl(CONVERSIONS_FILE);

  // Latest assignment per player (a player can be reassigned only if config changes).
  const latestAssignment = new Map();
  for (const a of assignments) {
    if (a.experimentId !== experimentId || !a.inExperiment) continue;
    latestAssignment.set(a.playerId, a);
  }

  // Count players per variant.
  const playersPerVariant = new Map();
  for (const [, a] of latestAssignment) {
    playersPerVariant.set(a.variantId, (playersPerVariant.get(a.variantId) || 0) + 1);
  }

  // Count converting players per variant (unique players who triggered the goal event).
  const convertersPerVariant = new Map();
  for (const c of conversions) {
    if (c.experimentId !== experimentId || c.variantId === null) continue;
    const a = latestAssignment.get(c.playerId);
    if (!a || a.variantId !== c.variantId) continue;
    convertersPerVariant.set(c.variantId, new Set([...(convertersPerVariant.get(c.variantId) || []), c.playerId]));
  }

  const controlId = 'control';
  const controlPlayers = playersPerVariant.get(controlId) || 0;
  const controlConverters = (convertersPerVariant.get(controlId) || new Set()).size;
  const controlRate = controlPlayers > 0 ? controlConverters / controlPlayers : 0;

  const results = [];
  for (const variant of experiment.variants) {
    const players = playersPerVariant.get(variant.id) || 0;
    const converters = (convertersPerVariant.get(variant.id) || new Set()).size;
    const rate = players > 0 ? converters / players : 0;
    const lift = controlRate > 0 ? (rate - controlRate) / controlRate : 0;
    results.push({
      variantId: variant.id,
      label: variant.label,
      players,
      converters,
      conversionRate: Math.round(rate * 10000) / 100,
      liftPercent: Math.round(lift * 10000) / 100,
      isControl: variant.id === controlId,
    });
  }

  // Include a row for players not in the experiment (traffic holdout).
  const totalAssigned = latestAssignment.size;
  const holdoutPlayers = totalAssigned > 0 ? (/* total players seen */ totalAssigned) - Array.from(playersPerVariant.values()).reduce((a, b) => a + b, 0) : 0;

  return {
    experimentId,
    name: experiment.name,
    goalEvent: experiment.goalEvent,
    totalPlayers: totalAssigned,
    results,
    holdoutPlayers,
    controlConversionRate: Math.round(controlRate * 10000) / 100,
  };
}

export default {
  listExperiments,
  getExperiment,
  assignPlayer,
  recordAssignment,
  recordConversion,
  computeResults,
};
