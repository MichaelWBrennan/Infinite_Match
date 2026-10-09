/**
 * Server-side price list for purchasable products. The amount charged is always
 * taken from here (or from an active deal, see live-ops.js), never from the client.
 *
 * kind:
 *   'entitlement' - a one-time unlock recorded in the purchase ledger.
 *   'consumable'  - adds `grants.amount` of `grants.currency` to the player's account, once per purchase.
 *
 * `skus` are the store product IDs created in App Store Connect and Google Play
 * Console. They default to the catalog ID; change them here if the store IDs differ.
 */
const sku = (id) => Object.freeze({ ios: id, android: id });

export const PRODUCTS = Object.freeze({
  remove_ads: Object.freeze({
    kind: 'entitlement',
    priceCents: 499,
    currency: 'usd',
    label: 'Remove ads',
    skus: sku('remove_ads'),
  }),
  unlock_all_themes: Object.freeze({
    kind: 'entitlement',
    priceCents: 799,
    currency: 'usd',
    label: 'Unlock all themes',
    skus: sku('unlock_all_themes'),
  }),
  coins_small: Object.freeze({
    kind: 'consumable',
    priceCents: 99,
    currency: 'usd',
    label: '500 coins',
    grants: Object.freeze({ currency: 'coins', amount: 500 }),
    skus: sku('coins_small'),
  }),
  coins_medium: Object.freeze({
    kind: 'consumable',
    priceCents: 499,
    currency: 'usd',
    label: '3,000 coins',
    grants: Object.freeze({ currency: 'coins', amount: 3000 }),
    skus: sku('coins_medium'),
  }),
  coins_large: Object.freeze({
    kind: 'consumable',
    priceCents: 999,
    currency: 'usd',
    label: '8,000 coins',
    grants: Object.freeze({ currency: 'coins', amount: 8000 }),
    skus: sku('coins_large'),
  }),
});

export function productFor(productId) {
  if (typeof productId !== 'string') return null;
  return Object.prototype.hasOwnProperty.call(PRODUCTS, productId) ? PRODUCTS[productId] : null;
}

/** Maps a store product ID (per platform) back to a catalog product ID, or null. */
export function productIdForSku(platform, sku) {
  if (platform !== 'ios' && platform !== 'android') return null;
  if (typeof sku !== 'string' || sku === '') return null;
  for (const [productId, product] of Object.entries(PRODUCTS)) {
    if (product.skus[platform] === sku) return productId;
  }
  return null;
}

export default { PRODUCTS, productFor, productIdForSku };
