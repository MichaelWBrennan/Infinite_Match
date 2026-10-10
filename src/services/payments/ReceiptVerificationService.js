/**
 * ReceiptVerificationService
 * Server-side verification for Apple App Store and Google Play purchases.
 */

import crypto from 'crypto';
import { AppConfig } from '../../core/config/index.js';
import { Logger } from '../../core/logger/index.js';
import { verifyAppleSignedPayload } from './store-notifications.js';

let GoogleAuth;
try {
  GoogleAuth = (await import('google-auth-library')).GoogleAuth;
} catch (_) {
  GoogleAuth = null;
}

const logger = new Logger('ReceiptVerificationService');


export class ReceiptVerificationService {
  static get iosEndpoints() {
    return {
      production: 'https://buy.itunes.apple.com/verifyReceipt',
      sandbox: 'https://sandbox.itunes.apple.com/verifyReceipt',
    };
  }

  static async verify({ platform, payload }) {
    if (platform === 'ios') {
      // StoreKit 2 (preferred): verified offline. Legacy receipts go to verifyReceipt.
      if (payload?.signedTransaction) return this.verifyAppleSignedTransaction(payload.signedTransaction);
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
      const bundleCheck = this.checkAppleBundleAndEnvironment({
        bundleId: data.receipt?.bundle_id,
        environment: data.environment,
      });
      if (!bundleCheck.ok) {
        return { success: false, platform: 'ios', reason: bundleCheck.reason };
      }
      const latest = Array.isArray(data.latest_receipt_info)
        ? data.latest_receipt_info[data.latest_receipt_info.length - 1]
        : data.latest_receipt_info || data.receipt;
      // The original transaction ID is stable across restores, so one purchase keeps one ID.
      const transactionId = latest?.original_transaction_id || latest?.transaction_id;
      const productId = latest?.product_id;
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

  /**
   * Checks a StoreKit 2 signed transaction (Transaction.jwsRepresentation) offline:
   * the Apple signature chain is verified against the pinned root, then the bundle,
   * environment and revocation fields are checked. Needs no network call to Apple.
   */
  static verifyAppleSignedTransaction(signedTransaction) {
    const rootCertPem = process.env.APPLE_ROOT_CA_G3;
    if (!rootCertPem || !process.env.APPLE_BUNDLE_ID) {
      return { success: false, platform: 'ios', reason: 'store_not_configured' };
    }
    let transaction;
    try {
      transaction = verifyAppleSignedPayload(signedTransaction, { rootCertPem });
    } catch (error) {
      logger.warn('Apple signed transaction rejected', { error: error.message });
      return { success: false, platform: 'ios', reason: 'signature_invalid' };
    }
    const check = this.checkAppleBundleAndEnvironment({
      bundleId: transaction.bundleId,
      environment: transaction.environment,
    });
    if (!check.ok) return { success: false, platform: 'ios', reason: check.reason };
    if (transaction.revocationDate) {
      return { success: false, platform: 'ios', reason: 'revoked' };
    }
    const transactionId = transaction.originalTransactionId || transaction.transactionId;
    if (typeof transaction.productId !== 'string' || transactionId === undefined) {
      return { success: false, platform: 'ios', reason: 'malformed_transaction' };
    }
    return {
      success: true,
      platform: 'ios',
      productId: transaction.productId,
      transactionId: String(transactionId),
      environment: transaction.environment,
    };
  }

  /** The app must be ours, and sandbox purchases are accepted only when explicitly allowed. */
  static checkAppleBundleAndEnvironment({ bundleId, environment }) {
    const expected = process.env.APPLE_BUNDLE_ID;
    if (!expected) return { ok: false, reason: 'store_not_configured' };
    if (bundleId !== expected) return { ok: false, reason: 'bundle_mismatch' };
    if (environment === 'Sandbox' && process.env.APPLE_ALLOW_SANDBOX !== 'true') {
      return { ok: false, reason: 'sandbox_not_allowed' };
    }
    return { ok: true };
  }

  static async verifyAndroidPurchase(payload) {
    const { packageName, productId, purchaseToken } = payload || {};
    if (!packageName || !productId || !purchaseToken) {
      return { success: false, reason: 'missing_android_params' };
    }
    if (!process.env.GOOGLE_PACKAGE_NAME || packageName !== process.env.GOOGLE_PACKAGE_NAME) {
      return { success: false, platform: 'android', reason: 'package_mismatch' };
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
        packageName,
      )}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(
        purchaseToken,
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
      // Try to acknowledge if not already acknowledged
      let acknowledged = Boolean(data.acknowledged);
      if (!acknowledged) {
        try {
          const ackUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(
            packageName,
          )}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(
            purchaseToken,
          )}:acknowledge`;
          const ackRes = await fetch(ackUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ developerPayload: productId }),
          });
          if (ackRes.ok) {
            acknowledged = true;
          } else {
            const txt = await ackRes.text();
            logger.warn('Android acknowledge failed', { status: ackRes.status, body: txt });
          }
        } catch (ackError) {
          logger.warn('Android acknowledge error', { error: ackError.message });
        }
      }
      return {
        success: true,
        platform: 'android',
        productId,
        transactionId,
        acknowledged,
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
