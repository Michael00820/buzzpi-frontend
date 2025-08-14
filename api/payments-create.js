// api/payments-create.js
import { readPiEnv } from './_utils/env';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Use POST' });
  }

  const { ok, key, env } = readPiEnv();
  if (!ok) {
    console.error('PI_API_KEY missing in environment!');
    return res.status(500).json({ ok: false, error: 'Server not configured' });
  }

  const { amount, memo = '', metadata = {} } = req.body || {};
  const nAmount = Number(amount);
  if (!Number.isFinite(nAmount) || nAmount <= 0) {
    return res.status(400).json({ ok: false, error: 'Invalid amount' });
  }

  // SANDBOX response (no external calls yet)
  const payment = {
    id: `sandbox_${Date.now()}`,
    amount: nAmount,
    memo,
    metadata,
    status: 'created',
    env,
  };

  // Never return the key
  return res.status(200).json({ ok: true, payment });
}