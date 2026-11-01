import express from 'express';
import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import AdEventDb from '../services/ads/AdEventDb.js';
import AdConfigService from '../services/ad/AdConfigService.js';
const router = express.Router();
const logger = new Logger('AdsRoutes');
const adConfigService = new AdConfigService();
// Only known values are stored, so the metrics cannot be polluted with arbitrary strings.
const ALLOWED_EVENTS = new Set(['request', 'impression', 'click', 'completed', 'closed', 'failed']);
const ALLOWED_FORMATS = new Set(['rewarded', 'interstitial', 'banner']);
router.post('/event', security.sessionValidation, async (req, res) => {
    try {
        const { network, format, event, revenueUsd, placement, country } = req.body || {};
        const userId = req.user?.playerId;
        if (!network || !format || !event)
            return res.status(400).json({ success: false, error: 'network, format, event required' });
        if (!ALLOWED_EVENTS.has(event) || !ALLOWED_FORMATS.has(format))
            return res.status(400).json({ success: false, error: 'unknown_event_or_format' });
        // Revenue from the client cannot be verified, so it never enters the revenue total.
        // revenueUsd is set only from a verified source (network server-to-server postbacks).
        // Until those exist it stays 0 and the client's figure is kept, labelled, for debugging.
        const reported = Number(revenueUsd);
        await AdEventDb.record({
            userId,
            network,
            format,
            event,
            revenueUsd: 0,
            clientReportedRevenueUsd: Number.isFinite(reported) && reported >= 0 && reported < 1000 ? reported : 0,
            placement,
            country,
        });
        res.json({ success: true });
    }
    catch (error) {
        logger.error('ad event error', { error: error.message });
        res.status(500).json({ success: false });
    }
});
router.get('/metrics', security.sessionValidation, async (req, res) => {
    try {
        const days = parseInt(req.query.days || '7');
        const country = req.query.country;
        const format = req.query.format;
        const data = await AdEventDb.metrics({ days, country, format });
        res.json({ success: true, data });
    }
    catch (error) {
        logger.error('ad metrics error', { error: error.message });
        res.status(500).json({ success: false });
    }
});
// Ad mediation config for the client: frequency caps, intervals, waterfall order.
// The client must never decide ad frequency or revenue on its own.
router.get('/config', security.sessionValidation, async (req, res) => {
    try {
        const profile = {
            country: req.query.country || undefined,
            region: req.query.region || undefined,
        };
        const adConfig = await adConfigService.getAdConfigForPlayer(profile);
        res.json({ success: true, config: adConfig });
    }
    catch (error) {
        logger.error('ad config error', { error: error.message });
        res.status(500).json({ success: false, error: 'ad_config_error' });
    }
});
export default router;
//# sourceMappingURL=ads.js.map