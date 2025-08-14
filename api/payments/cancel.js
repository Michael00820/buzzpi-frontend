import { piFetch } from '../_pi.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).end();
    const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
    const { paymentId } = body;
    if (!paymentId) return res.status(400).json({ error:'paymentId required' });

    const out = await piFetch(`/payments/${paymentId}/cancel`, 'POST');
    return res.status(200).json({ ok:true, out });
  } catch (e) {
    console.error('cancel error', e);
    return res.status(500).json({ error:e.message });
  }
}
