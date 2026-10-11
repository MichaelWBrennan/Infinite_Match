// Live ops on the free server: coin pack prices, today's deals and events, and the weekly event.
// Rules come from src/services/live-ops/*.js and src/services/payments/product-catalog.js.
// Purchases are not available here, so every deal reports owned: false.
import { liveOpsToday, priceFor } from '../src/services/live-ops/live-ops.js';
import {
  claimWeeklyMilestone,
  visibleWeeklyEvent,
  weeklyDisabled,
  weeklyView,
  WeeklyEventError,
} from '../src/services/live-ops/weekly-event.js';
import { PRODUCTS } from '../src/services/payments/product-catalog.js';
import { ApiError } from './errors.js';
import { currentLiveOps } from './live-ops-config.js';
import { transaction } from './db.js';
import { loadEconomy, saveEconomy } from './economy.js';

export function getOffers(nowMs = Date.now()) {
  const config = currentLiveOps();
  const today = liveOpsToday(nowMs, config);
  const coinPacks = Object.entries(PRODUCTS)
    .filter(([, p]) => p.kind === 'consumable' && p.grants?.currency === 'coins')
    .map(([productId, product]) => {
      const price = priceFor(productId, nowMs, config);
      const deal = today.deals.find((d) => d.productId === productId);
      return {
        productId,
        coins: product.grants.amount,
        priceCents: price.priceCents,
        catalogPriceCents: product.priceCents,
        currency: product.currency,
        deal: price.deal,
        endsAt: deal ? deal.endsAt : null,
      };
    });
  return {
    success: true,
    coinPacks,
    deals: today.deals,
    activeEvents: today.activeEvents,
    upcomingEvents: today.upcomingEvents,
  };
}

export function getToday(nowMs = Date.now()) {
  const today = liveOpsToday(nowMs, currentLiveOps());
  return { success: true, ...today, deals: today.deals.map((deal) => ({ ...deal, owned: false })) };
}

export function getWeeklyPreview(nowMs = Date.now()) {
  const event = weeklyView(visibleWeeklyEvent(currentLiveOps(), nowMs), null, nowMs);
  return { success: true, event, disabled: weeklyDisabled(), serverNow: new Date(nowMs).toISOString() };
}

export function getWeekly(db, playerId, nowMs = Date.now()) {
  const config = currentLiveOps();
  const economy = loadEconomy(db, playerId);
  const event = weeklyView(visibleWeeklyEvent(config, nowMs), economy, nowMs);
  return { success: true, event, disabled: weeklyDisabled(), serverNow: new Date(nowMs).toISOString() };
}

export function claimWeekly(db, playerId, body, nowMs = Date.now()) {
  const config = currentLiveOps();
  return transaction(db, () => {
    const economy = loadEconomy(db, playerId);
    let claim;
    try {
      claim = claimWeeklyMilestone(economy, config, body?.eventId, body?.wins, nowMs);
    } catch (error) {
      if (error instanceof WeeklyEventError) {
        throw new ApiError(error.code === 'weekly_event_not_found' ? 404 : 409, error.code);
      }
      throw error;
    }
    if (!claim.duplicate) saveEconomy(db, playerId, economy);
    return claim;
  });
}
