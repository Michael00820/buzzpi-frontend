export default async function handler(req, res) {
  // NOTE: In real prod we verify the payment with Pi platform using your server secret.
  // For sandbox smoke test we just log and 200.
  const { paymentId } = req.body || {};
  console.log('[SANDBOX] approve paymentId:', paymentId);
  return res.status(200).json({ ok: true });
}
