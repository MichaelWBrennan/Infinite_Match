import PurchaseLedgerDb from '../services/payments/PurchaseLedgerDb.js';

export function requireEntitlement(productId) {
  return async (req, res, next) => {
    try {
      const playerId = req.user?.playerId;
      if (!playerId) return res.status(401).json({ success: false, error: 'unauthorized' });
      const has = await PurchaseLedgerDb.hasPurchase(playerId, productId);
      if (!has) return res.status(403).json({ success: false, error: `entitlement_required:${productId}` });
      next();
    } catch (error) {
      return res.status(500).json({ success: false, error: 'entitlement_check_error' });
    }
  };
}

export default { requireEntitlement };
