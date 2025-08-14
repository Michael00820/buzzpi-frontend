// api/payments-approve.js
import { readPiEnv } from './_utils/env';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Use POST' });
  }

  const { ok, env } = readPiEnv();
  if (!ok) {
    console.error('PI_API_KEY missing in environment!');
    return res.status(500).json({ ok: false, error: 'Server not configured' });
  }

  const { paymentId } = req.body || {};
  if (!paymentId) {
    return res.status(400).json({ ok: false, error: 'paymentId required' });
  }

  // SANDBOX approve
  return res.status(200).json({ ok: true, payment: { id: paymentId, status: 'approved', env } });
}