import { getPayment, approvePayment } from '../_pi.js';

// Basic server-side validation rules
const MEMO_PREFIX = 'BuzzPi • ';
const MIN_PI = 0.001;
const MAX_PI = 5.0; // sanity cap for gifts; adjust if you add bigger tiers

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).end();
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const { paymentId } = body;
    if (!paymentId) return res.status(400).json({ error:'paymentId required' });

    // 1) Look up payment details from Pi
    const pay = await getPayment(paymentId);
    // pay contains { amount, memo, metadata, status, ... }
    if (!pay || typeof pay.amount !== 'number') {
      return res.status(400).json({ error: 'Invalid payment data' });
    }

    // 2) Verify amount & memo
    if (pay.amount < MIN_PI || pay.amount > MAX_PI) {
      return res.status(400).json({ error: 'Amount out of allowed range' });
    }
    if (!String(pay.memo||'').startsWith(MEMO_PREFIX)) {
      return res.status(400).json({ error: 'Unexpected memo prefix' });
    }

    // (Optional) verify metadata.giftId matches a known gift id in your catalog

    // 3) Approve with Pi
    const out = await approvePayment(paymentId);
    return res.status(200).json({ ok:true, out });
  } catch (e) {
    console.error('approve error', e);
    return res.status(500).json({ error:e.message });
  }
}