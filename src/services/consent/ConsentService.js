import { promises as fs } from 'fs';
import { join } from 'path';

const STORE_PATH = 'monitoring/reports/consent.jsonl';

class ConsentServiceImpl {
  constructor() {
    this.userIdToConsent = new Map();
  }

  async setConsent(userId, partial) {
    const current = this.userIdToConsent.get(userId) || {};
    const updated = { ...current, ...partial, userId, ts: Date.now() };
    this.userIdToConsent.set(userId, updated);
    try {
      await fs.appendFile(STORE_PATH, JSON.stringify(updated) + '\n', 'utf-8');
    } catch (_) {}
    return updated;
  }

  getDefault() {
    return {
      adsAllowed: true,
      npa: false,
      gdpr: null, // null unknown, true consented, false denied
      att: 'not_determined', // iOS ATT: authorized/denied/not_determined
    };
  }

  async getConsent(userId) {
    return this.userIdToConsent.get(userId) || this.getDefault();
  }
}

export const ConsentService = new ConsentServiceImpl();
export default ConsentService;
