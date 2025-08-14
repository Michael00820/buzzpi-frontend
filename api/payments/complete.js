import { getPayment, completePayment } from '../_pi.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).end();
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const { paymentId, txid } = body;
    if (!paymentId) return res.status(400).json({ error:'paymentId required' });

    // Re-fetch to verify still valid & in correct state
    const pay = await getPayment(paymentId);

    // Guard: only complete if it was approved & ready
    const allowedStatuses = ['pending','approved'];
    if (!pay || !allowedStatuses.includes(String(pay.status||'').toLowerCase())) {
      return res.status(400).json({ error: `Payment not in completable state: ${pay?.status}` });
    }

    // Complete with (optional) txid
    const out = await completePayment(paymentId, txid);
    return res.status(200).json({ ok:true, out });
  } catch (e) {
    console.error('complete error', e);
    return res.status(500).json({ error:e.message });
  }
}