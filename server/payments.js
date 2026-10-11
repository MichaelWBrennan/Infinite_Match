// Stripe checkout for the coin packs. Only consumable products are sold here: the amount charged
// comes from the server's catalog, and coins are granted only from a webhook that Stripe signed.
// Entitlements (remove ads, unlock themes) are refused, because the free server has no entitlement
// ledger yet. Refunds do not take coins back automatically; handle them by hand.
//
// Configuration (all required for checkout to answer 200):
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
//   STRIPE_CHECKOUT_SUCCESS_URL, STRIPE_CHECKOUT_CANCEL_URL
import Stripe from 'stripe';
import { productFor } from '../src/services/payments/product-catalog.js';
import { priceFor } from '../src/services/live-ops/live-ops.js';
import { currentLiveOps } from './live-ops-config.js';
import { transaction } from './db.js';
import { ApiError } from './errors.js';
import { grantCurrency, loadEconomy, saveEconomy } from './economy.js';

let client = null;
let clientKey = null;

/** Test seam: use this client instead of creating one from the secret key. Pass null to reset. */
export function setStripeClientForFree(next) {
  client = next;
  clientKey = next ? 'injected' : null;
}

function stripeClient() {
  if (clientKey === 'injected') return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client || clientKey !== key) {
    client = new Stripe(key);
    clientKey = key;
  }
  return client;
}

function configured() {
  const stripe = stripeClient();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET
    || !process.env.STRIPE_CHECKOUT_SUCCESS_URL || !process.env.STRIPE_CHECKOUT_CANCEL_URL) {
    return null;
  }
  return stripe;
}

/** Starts a Stripe Checkout session for one coin pack. The player id travels in the metadata. */
export async function createCheckout(player, body, nowMs = Date.now()) {
  const productId = body?.productId;
  const product = productFor(productId);
  if (!product) throw new ApiError(400, 'unknown_product');
  if (product.kind !== 'consumable') throw new ApiError(400, 'product_not_available');
  // The price shown in the offers, including an active deal. Never a client-sent amount.
  const price = priceFor(productId, nowMs, currentLiveOps());
  const stripe = configured();
  if (!stripe) throw new ApiError(503, 'checkout_not_configured');

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: product.currency,
          unit_amount: price.priceCents,
          product_data: { name: product.label },
        },
      }],
      success_url: process.env.STRIPE_CHECKOUT_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CHECKOUT_CANCEL_URL,
      client_reference_id: player.id,
      metadata: { playerId: player.id, productId, priceCents: String(price.priceCents) },
    });
  } catch {
    throw new ApiError(502, 'checkout_failed', 'Stripe could not start the checkout.');
  }
  return { success: true, url: session.url, sessionId: session.id };
}

/**
 * Handles one Stripe webhook. `rawBody` must be the exact bytes Stripe sent, so the signature
 * can be checked. Grants a coin pack once per Checkout session, after checking the amount paid.
 */
export function handleWebhook(db, rawBody, signature) {
  const stripe = configured();
  if (!stripe) throw new ApiError(503, 'checkout_not_configured');
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature || '', process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new ApiError(400, 'invalid_signature');
  }
  if (event.type !== 'checkout.session.completed') return { success: true, received: true, ignored: true };

  const session = event.data.object;
  if (session.payment_status !== 'paid') return { success: true, received: true, ignored: true };

  const productId = session.metadata?.productId;
  const product = productFor(productId);
  if (!product || product.kind !== 'consumable') return { success: true, received: true, ignored: true };
  // The price the server quoted at checkout is stored in the metadata Stripe signed. Grant only
  // when Stripe charged exactly that, and that quote is no higher than the catalog price.
  const quoted = Number(session.metadata?.priceCents);
  if (!Number.isSafeInteger(quoted) || quoted <= 0 || quoted > product.priceCents
    || session.amount_total !== quoted || session.currency !== product.currency) {
    // Stripe retries this, which is correct: nothing is granted for a price we did not quote.
    throw new ApiError(400, 'amount_mismatch');
  }

  const playerId = session.metadata?.playerId;
  const outcome = transaction(db, () => {
    const player = typeof playerId === 'string'
      ? db.prepare('SELECT id FROM players WHERE id = ?').get(playerId)
      : null;
    if (!player) {
      console.error('Stripe purchase for an unknown player; grant it by hand', { sessionId: session.id, productId });
      return 'unknown_player';
    }
    const seen = db.prepare('SELECT 1 FROM purchases WHERE session_id = ?').get(session.id);
    if (seen) return 'duplicate';
    db.prepare(`INSERT INTO purchases (session_id, player_id, product_id, amount_cents, granted_at)
      VALUES (?, ?, ?, ?, ?)`).run(session.id, player.id, productId, quoted, new Date().toISOString());
    const economy = loadEconomy(db, player.id);
    grantCurrency(economy.currencies, product.grants.currency, product.grants.amount);
    saveEconomy(db, player.id, economy);
    return 'granted';
  });
  return { success: true, received: true, outcome };
}

