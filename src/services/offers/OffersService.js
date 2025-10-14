import { Logger } from '../../core/logger/index.js';

const logger = new Logger('OffersService');

export class OffersService {
  constructor() {}

  getOffers(profile = {}) {
    const now = Date.now();
    const offers = [];

    const payer = String(profile.payer || '').toLowerCase();
    const skill = String(profile.skill || '').toLowerCase();
    const region = String(profile.region || '').toUpperCase();

    if (payer === 'nonpayer' && skill === 'newbie') {
      offers.push({ sku: 'pack_starter', reason: 'newbie_nonpayer', discount: 0.5 });
    }

    const lastPlay = profile.last_play ? new Date(profile.last_play).getTime() : null;
    if (lastPlay && now - lastPlay > 7 * 24 * 60 * 60 * 1000) {
      offers.push({ sku: 'pack_comeback', reason: 'lapsed_7d', discount: 0.5 });
    }

    if (region === 'IN') {
      offers.push({ sku: 'pack_value', reason: 'regional_value_pack' });
    }

    if (profile.level && profile.level < 10) {
      offers.push({ sku: 'pack_starter', reason: 'low_level' });
    }

    if (profile.flash_sale) {
      offers.push({ sku: 'pack_flash_sale', reason: 'event_flash_sale', expiresInSeconds: 3600 });
    }

    // De-duplicate by sku keeping the first rationale
    const unique = new Map();
    for (const offer of offers) {
      if (!unique.has(offer.sku)) unique.set(offer.sku, offer);
    }

    const result = Array.from(unique.values());
    logger.info('Generated offers', { count: result.length });
    return result;
  }
}

export default OffersService;
