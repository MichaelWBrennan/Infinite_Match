/**
 * Server-side price list for purchasable products. The amount charged is always
 * taken from here, never from the client. Products without a price are not sold.
 */
export const PRODUCTS = Object.freeze({
  remove_ads: Object.freeze({ priceCents: 499, currency: 'usd' }),
  unlock_all_themes: Object.freeze({ priceCents: 799, currency: 'usd' }),
});

export function productFor(productId) {
  if (typeof productId !== 'string') return null;
  return Object.prototype.hasOwnProperty.call(PRODUCTS, productId) ? PRODUCTS[productId] : null;
}

export default { PRODUCTS, productFor };
