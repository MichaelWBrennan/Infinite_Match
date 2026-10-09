import express from 'express';
import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import { liveOpsToday, loadLiveOps } from '../services/live-ops/live-ops.js';
import PurchaseLedgerDb from '../services/payments/PurchaseLedgerDb.js';

const router = express.Router();
const logger = new Logger('LiveOpsRoutes');

// Today's deals and events. Each deal says whether the caller already owns the product.
router.get('/today', security.sessionValidation, async (req, res) => {
  try {
    const today = liveOpsToday(Date.now(), loadLiveOps());
    const playerId = req.user?.playerId;
    const deals = await Promise.all(
      today.deals.map(async (deal) => ({
        ...deal,
        owned: playerId ? await PurchaseLedgerDb.hasPurchase(playerId, deal.productId) : false,
      })),
    );
    res.json({ success: true, ...today, deals, requestId: req.requestId });
  } catch (error) {
    logger.error('Live ops lookup failed', { error: error.message });
    res.status(500).json({ success: false, error: 'live_ops_error', requestId: req.requestId });
  }
});

export default router;
