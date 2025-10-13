import express from 'express';
import security from 'core/security/index.js';
import { Logger } from 'core/logger/index.js';
import PurchaseLedgerDb from 'services/payments/PurchaseLedgerDb.js';

const router = express.Router();
const logger = new Logger('EntitlementsRoutes');

router.get('/', security.sessionValidation, async (req, res) => {
  try {
    const playerId = req.user?.playerId;
    const purchases = await PurchaseLedgerDb.listPurchases(playerId);
    const entitlements = {
      removeAds: purchases.some((p) => p.productId === 'remove_ads'),
      premiumPass: purchases.some((p) => p.productId === 'season_pass_premium'),
    };
    res.json({ success: true, entitlements, purchases });
  } catch (error) {
    logger.error('Entitlements error', { error: error.message });
    res.status(500).json({ success: false });
  }
});

export default router;
