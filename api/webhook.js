// api/webhook.js
// Placeholder for Pi webhook; validates env and immediately 200s.
// Add signature validation + business logic when we enable real webhooks.
import { readPiEnv } from './_utils/env';

export default async function handler(req, res) {
  const { ok, env } = readPiEnv();
  if (!ok) {
    console.error('PI_API_KEY missing in environment!');
    return res.status(500).json({ ok: false, error: 'Server not configured' });
  }

  console.log('Webhook hit:', { method: req