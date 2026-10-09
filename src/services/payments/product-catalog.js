/**
 * Server-side price list for purchasable products. The amount charged is always
 * taken from here (or from an active deal, see live-ops.js), never from the client.
 * Products without a price are not sold.
 *
 * `skus` are the store product IDs created in App Store Connect and Google Play
 * Console. They default to the catalog ID; change them here if the store IDs differ.
 */
export const PRODUCTS = Object.freeze({
  remove_ads: Object.freeze({
    priceCents: 499,
    currency: 'usd',
    skus: Object.freeze({ ios: 'remove_ads', android: 'remove_ads' }),
  }),
  unlock_all_themes: Object.freeze({
    priceCents: 799,
    currency: 'usd',
    skus: Object.freeze({ ios: 'unlock_all_themes', android: 'unlock_all_themes' }),
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
