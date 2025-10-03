import express from 'express';
const app = express();
app.use(express.json());

app.post('/verify_receipt', (req, res) => {
  // naive stub: accept everything
  res.json({ valid: true });
});

app.post('/segments', (req, res) => {
  const profile = req.body || {};
  const overrides = {};
  if (profile.payer === 'nonpayer' && profile.skill === 'newbie') {
    overrides.best_value_sku = 'starter_pack_small';
  }
  if (profile.region === 'IN') {
    overrides.most_popular_sku = 'gems_medium';
  }
  res.json(overrides);
});

app.post('/promo', (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ ok: false });
  // accept a couple of test codes
  const upper = String(code).toUpperCase();
  if (upper === 'WELCOME' || upper === 'FREE100') return res.json({ ok: true });
  return res.status(404).json({ ok: false });
});

app.post('/push', (req, res) => {
  res.json({ ok: true });
});

app.post('/log', (req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT || 3030;
app.listen(port, () => console.log(`Stub backend listening on ${port}`));
