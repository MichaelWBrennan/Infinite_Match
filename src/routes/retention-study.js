import express from 'express';
import security from '../core/security/index.js';
import { Logger } from '../core/logger/index.js';
import { retentionEnabled, retentionStudyStore } from '../services/study/retention-study.js';

const router = express.Router();
const logger = new Logger('RetentionStudyRoutes');
router.use(security.sessionValidation);
router.use((req, res, next) => { res.set('Cache-Control', 'private, no-store'); next(); });

function unavailable(res, req) {
  return res.status(503).json({ success: false, error: 'retention_study_unavailable', requestId: req.requestId });
}
function fail(res, req, error) {
  logger.warn('Retention study storage unavailable', { error: error.message });
  return unavailable(res, req);
}

// Reading one's own consent and withdrawing stay possible when enrollment is paused.
router.get('/me', async (req, res) => {
  try {
    res.json({ success: true, ...(await retentionStudyStore.status(req.user.playerId)), requestId: req.requestId });
  } catch (error) { fail(res, req, error); }
});
router.delete('/me', async (req, res) => {
  try {
    res.json({ success: true, ...(await retentionStudyStore.withdraw(req.user.playerId)), requestId: req.requestId });
  } catch (error) { fail(res, req, error); }
});

router.post('/opt-in', security.generalRateLimit, async (req, res) => {
  if (!retentionEnabled()) return unavailable(res, req);
  if (req.body && Object.keys(req.body).length) {
    return res.status(400).json({ success: false, error: 'unexpected_fields', requestId: req.requestId });
  }
  try {
    res.json({ success: true, ...(await retentionStudyStore.optIn(req.user.playerId)), requestId: req.requestId });
  } catch (error) { fail(res, req, error); }
});

// Called at most once per signed-in web app open by the client, never by a reward path.
// Idempotent per UTC day; an unconsented caller has no record and creates none.
router.post('/visit', security.generalRateLimit, async (req, res) => {
  if (!retentionEnabled()) return unavailable(res, req);
  if (req.body && Object.keys(req.body).length) {
    return res.status(400).json({ success: false, error: 'unexpected_fields', requestId: req.requestId });
  }
  try {
    res.json({ success: true, ...(await retentionStudyStore.visit(req.user.playerId)), requestId: req.requestId });
  } catch (error) { fail(res, req, error); }
});

export default router;
