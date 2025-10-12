/**
 * ReceiptVerificationService
 * Server-side verification for Apple App Store and Google Play purchases.
 */

import crypto from 'crypto';
import fetch from 'node-fetch';
import { AppConfig } from '../../core/config/index.js';
import { Logger } from '../../core/logger/index.js';

let GoogleAuth;
try {
  GoogleAuth = (await import('google-auth-library')).GoogleAuth;
} catch (_) {
  GoogleAuth = null;
}

const logger = new Logger('ReceiptVerificationService');

class DedupCache {
  constructor() {
    this.transactionIdToExpiry = new Map();
    this.defaultTtlMs = 10 * 60 * 1000;
  }
  has(transactionId) {
    const expiry = this.transactionIdToExpiry.get(transactionId);
    if (!expiry) return false;
    if (Date.now() > expiry) {
      this.transactionIdToExpiry.delete(transactionId);
      return false;
    }
    return true;
  }
  add(transactionId, ttlMs = this.defaultTtlMs) {
    this.transactionIdToExpiry.set(transactionId, Date.now() + ttlMs);
  }
}

const dedupCache = new DedupCache();

export class ReceiptVerificationService {
  static get iosEndpoints() {
    return {
      production: 'https://buy.itunes.apple.com/verifyReceipt',
      sandbox: 'https://sandbox.itunes.apple.com/verifyReceipt',
    };
  }

  static async verify({ platform, payload }) {
    if (platform === 'ios') {
      return this.verifyIOSReceipt(payload);
    }
    if (platform === 'android') {
      return this.verifyAndroidPurchase(payload);
    }
    throw new Error(`Unsupported platform: ${platform}`);
  }

  static async verifyIOSReceipt(payload) {
    const { receiptData, isSandbox } = payload || {};
    if (!receiptData) {
      return { success: false, reason: 'missing_receipt_data' };
    }
    const endpoint = isSandbox ? this.iosEndpoints.sandbox : this.iosEndpoints.production;
    const requestBody = {
      'receipt-data': receiptData,
      password: AppConfig.payments?.apple?.sharedSecret || undefined,
      exclude_old_transactions: true,
    };
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      const status = Number(data.status);
      if (status !== 0) {
        logger.warn('Apple receipt invalid', { status });
        return { success: false, platform: 'ios', status, raw: data };
      }
      const latest = Array.isArray(data.latest_receipt_info)
        ? data.latest_receipt_info[data.latest_receipt_info.length - 1]
        : data.latest_receipt_info || data.receipt;
      const transactionId = latest?.transaction_id || latest?.original_transaction_id;
      const productId = latest?.product_id;
      if (transactionId && dedupCache.has(transactionId)) {
        return { success: true, platform: 'ios', duplicate: true, productId, transactionId };
      }
      if (transactionId) dedupCache.add(transactionId);
      return {
        success: true,
        platform: 'ios',
        productId,
        transactionId,
        raw: data,
      };
    } catch (error) {
      logger.error('Apple verification failed', { error: error.message });
      return { success: false, platform: 'ios', reason: 'verification_error' };
    }
  }

  static async verifyAndroidPurchase(payload) {
    const { packageName, productId, purchaseToken } = payload || {};
    if (!packageName || !productId || !purchaseToken) {
      return { success: false, reason: 'missing_android_params' };
    }
    if (!GoogleAuth) {
      logger.warn('google-auth-library not installed');
      return { success: false, platform: 'android', reason: 'missing_google_auth_library' };
    }
    try {
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
        keyFile: AppConfig.payments?.google?.serviceAccountKeyPath || undefined,
      });
      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();
      const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(
        packageName
      )}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(
        purchaseToken
      )}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken.token}` },
      });
      const data = await res.json();
      if (Number(data.purchaseState) !== 0) {
        logger.warn('Android purchase not in purchased state', { state: data.purchaseState });
        return { success: false, platform: 'android', state: data.purchaseState, raw: data };
      }
      const transactionId = this.buildAndroidTransactionId({ productId, purchaseToken });
      if (transactionId && dedupCache.has(transactionId)) {
        return { success: true, platform: 'android', duplicate: true, productId, transactionId };
      }
      if (transactionId) dedupCache.add(transactionId);
      return {
        success: true,
        platform: 'android',
        productId,
        transactionId,
        acknowledged: Boolean(data.acknowledged),
        raw: data,
      };
    } catch (error) {
      logger.error('Android verification failed', { error: error.message });
      return { success: false, platform: 'android', reason: 'verification_error' };
    }
  }

  static buildAndroidTransactionId({ productId, purchaseToken }) {
    const hash = crypto.createHash('sha256');
    hash.update(`${productId}:${purchaseToken}`);
    return hash.digest('hex');
  }
}

export default ReceiptVerificationService;
