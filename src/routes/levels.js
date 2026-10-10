import express from 'express';
import { liveGeneratedLevel, liveLevelContext } from '../services/levels/level-service.js';
import { LevelInputError, locationCatalog } from '../services/levels/location-context.js';

const router = express.Router();
// Context depends on the requesting player's local day; shared proxy caches must not mix it.
router.use((req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  next();
});

async function handle(req, res, makeValue) {
  try {
    res.json({ success: true, ...await makeValue(), serverTime: new Date(Date.now()).toISOString() });
  } catch (error) {
    if (error instanceof LevelInputError) {
      res.status(400).json({ success: false, error: error.code });
    } else {
      res.status(500).json({ success: false, error: 'level_generation_failed' });
    }
  }
}

router.get('/context', (req, res) => handle(req, res, async () => ({ context: await liveLevelContext(req.query) })));
router.get('/regions', (req, res) => handle(req, res, () => locationCatalog(req.query.country)));
router.get('/daily', (req, res) => handle(req, res, async () => ({
  level: await liveGeneratedLevel({ mode: 'daily', location: req.query }),
})));
router.get('/:level', (req, res) => handle(req, res, async () => {
  const raw = req.params.level;
  if (!/^\d{1,16}$/.test(raw)) throw new LevelInputError('invalid_level');
  return { level: await liveGeneratedLevel({ level: Number(raw), mode: req.query.mode ?? 'classic', location: req.query }) };
}));

export default router;
