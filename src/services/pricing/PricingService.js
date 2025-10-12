import { readFile } from 'fs/promises';
import { Logger } from '../../core/logger/index.js';
import { AppConfig } from '../../core/config/index.js';

const logger = new Logger('PricingService');

const FX = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149,
  KRW: 1370,
  INR: 83,
  BRL: 5.5,
  IDR: 15500,
};

const COUNTRY_TO_CURRENCY = {
  US: 'USD',
  DE: 'EUR',
  FR: 'EUR',
  GB: 'GBP',
  JP: 'JPY',
  KR: 'KRW',
  IN: 'INR',
  BR: 'BRL',
  ID: 'IDR',
};

export class PricingService {
  constructor(tiersPath = 'config/pricing/tiers.json', overridesPath = AppConfig.payments?.pricing?.countryOverridesPath || 'config/pricing/overrides.json') {
    this.tiersPath = tiersPath;
    this.overridesPath = overridesPath;
  }

  async loadJson(path, fallback = {}) {
    try {
      const content = await readFile(path, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      logger.warn(`Failed to load ${path}, using fallback`, { error: error.message });
      return fallback;
    }
  }

  normalizeCurrency(currency, country) {
    if (currency) return currency.toUpperCase();
    const byCountry = COUNTRY_TO_CURRENCY[country?.toUpperCase?.()];
    return byCountry || AppConfig.payments?.pricing?.defaultCurrency || 'USD';
  }

  computeLocalizedPrice(usdPrice, currency) {
    const fx = FX[currency] || 1;
    const raw = usdPrice * fx;
    // Psychological pricing to .99 or nearest sensible steps
    const rounded = this.roundPrice(raw);
    return { amount: rounded, currency };
  }

  roundPrice(amount) {
    if (amount < 2) return Math.round(amount * 100) / 100; // keep cents for very low
    // round to .99 for higher prices
    const base = Math.round(amount);
    return base >= 2 ? Math.max(0.99, base - 0.01) : amount;
  }

  async getLocalizedTiers({ country, currency }) {
    const tiers = await this.loadJson(this.tiersPath, { tiers: [] });
    const overrides = await this.loadJson(this.overridesPath, {});

    const targetCurrency = this.normalizeCurrency(currency, country);

    return tiers.tiers.map((tier) => {
      const usdPrice = overrides?.[country?.toUpperCase?.()]?.[tier.sku]?.usdPrice ?? tier.usdPrice;
      const localized = this.computeLocalizedPrice(usdPrice, targetCurrency);
      return {
        sku: tier.sku,
        baseUsd: usdPrice,
        price: localized,
        title: tier.title,
        description: tier.description,
      };
    });
  }
}

export default PricingService;
