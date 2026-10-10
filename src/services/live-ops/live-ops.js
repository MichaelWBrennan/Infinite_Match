/**
 * Live ops: time-boxed deals and events, read from config/liveops.json.
 *
 * A deal sets a lower price for one catalog product inside its time window. The
 * price is charged only while the window is open, and it can never go below
 * MIN_DEAL_PRICE_CENTS or reach the catalog price. Missing or invalid config means
 * no deals and no events: purchases then use catalog prices, so nothing is undercharged.
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { Logger } from '../../core/logger/index.js';
import { productFor } from '../payments/product-catalog.js';
import { validateWeeklyEvents } from './weekly-event.js';

const logger = new Logger('LiveOps');

export const MIN_DEAL_PRICE_CENTS = 99;
const EMPTY = Object.freeze({ events: Object.freeze([]), deals: Object.freeze([]), weeklyEvents: Object.freeze([]) });

export function liveOpsConfigPath() {
  return process.env.LIVE_OPS_CONFIG || resolve('config', 'liveops.json');
}

function parseTime(value) {
  if (typeof value !== 'string') return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : null;
}

/** Checks a raw config. Returns { errors, config } where config is normalised when valid. */
export function validateLiveOps(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { errors: ['config must be an object'], config: null };
  }
  const events = [];
  const deals = [];
  const weekly = validateWeeklyEvents(raw.weeklyEvents);
  errors.push(...weekly.errors);

  (Array.isArray(raw.events) ? raw.events : []).forEach((e, i) => {
    const startMs = parseTime(e?.start);
    const endMs = parseTime(e?.end);
    if (typeof e?.id !== 'string' || !e.id) errors.push(`events[${i}]: id required`);
    if (typeof e?.name !== 'string' || !e.name) errors.push(`events[${i}]: name required`);
    if (startMs === null || endMs === null || endMs <= startMs) {
      errors.push(`events[${i}]: start and end must be ISO times with end after start`);
      return;
    }
    events.push({ id: e.id, name: e.name, startMs, endMs, description: e.description || '' });
  });

  (Array.isArray(raw.deals) ? raw.deals : []).forEach((d, i) => {
    const product = productFor(d?.productId);
    const startMs = parseTime(d?.start);
    const endMs = parseTime(d?.end);
    if (!product) {
      errors.push(`deals[${i}]: productId is not in the catalog`);
      return;
    }
    if (!Number.isInteger(d.priceCents) || d.priceCents < MIN_DEAL_PRICE_CENTS) {
      errors.push(`deals[${i}]: priceCents must be an integer of at least ${MIN_DEAL_PRICE_CENTS}`);
      return;
    }
    if (d.priceCents >= product.priceCents) {
      errors.push(`deals[${i}]: priceCents must be below the catalog price ${product.priceCents}`);
      return;
    }
    if (startMs === null || endMs === null || endMs <= startMs) {
      errors.push(`deals[${i}]: start and end must be ISO times with end after start`);
      return;
    }
    deals.push({ productId: d.productId, priceCents: d.priceCents, startMs, endMs });
  });

  if (errors.length > 0) return { errors, config: null };
  return { errors, config: { events, deals, weeklyEvents: weekly.events } };
}

let cached = null;

/** Loads the config once per process. Restart the server to pick up changes. */
export function loadLiveOps({ path = liveOpsConfigPath(), reload = false } = {}) {
  if (cached && !reload) return cached;
  if (!existsSync(path)) {
    cached = EMPTY;
    return cached;
  }
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (error) {
    logger.error('Live ops config is unreadable; no deals or events are active', { error: error.message });
    cached = EMPTY;
    return cached;
  }
  const { errors, config } = validateLiveOps(raw);
  if (errors.length > 0) {
    logger.error('Live ops config is invalid; no deals or events are active', { errors });
    cached = EMPTY;
    return cached;
  }
  cached = config;
  return cached;
}

const toSeconds = (ms) => Math.floor(ms / 1000) * 1000;

/**
 * The price to charge for a catalog product at a given time. Deal windows are
 * compared at whole-second resolution so the purchase route and the webhook agree.
 */
export function priceFor(productId, nowMs = Date.now(), config = loadLiveOps()) {
  const product = productFor(productId);
  if (!product) return null;
  const t = toSeconds(nowMs);
  const active = config.deals.filter(
    (d) => d.productId === productId && t >= d.startMs && t < d.endMs,
  );
  if (active.length === 0) {
    return { priceCents: product.priceCents, currency: product.currency, deal: false };
  }
  const best = active.reduce((a, b) => (b.priceCents < a.priceCents ? b : a));
  return { priceCents: best.priceCents, currency: product.currency, deal: true };
}

/** What the game shows today: active deals, active events, and events coming up. */
export function liveOpsToday(nowMs = Date.now(), config = loadLiveOps()) {
  const t = toSeconds(nowMs);
  const deals = config.deals
    .filter((d) => t >= d.startMs && t < d.endMs)
    .map((d) => ({
      productId: d.productId,
      priceCents: d.priceCents,
      catalogPriceCents: productFor(d.productId).priceCents,
      endsAt: new Date(d.endMs).toISOString(),
    }));
  const active = config.events
    .filter((e) => t >= e.startMs && t < e.endMs)
    .map(({ id, name, description, startMs, endMs }) => ({
      id,
      name,
      description,
      startsAt: new Date(startMs).toISOString(),
      endsAt: new Date(endMs).toISOString(),
    }));
  const upcoming = config.events
    .filter((e) => e.startMs > t)
    .sort((a, b) => a.startMs - b.startMs)
    .slice(0, 10)
    .map(({ id, name, description, startMs, endMs }) => ({
      id,
      name,
      description,
      startsAt: new Date(startMs).toISOString(),
      endsAt: new Date(endMs).toISOString(),
    }));
  return { deals, activeEvents: active, upcomingEvents: upcoming };
}

export default { loadLiveOps, validateLiveOps, priceFor, liveOpsToday, MIN_DEAL_PRICE_CENTS };
