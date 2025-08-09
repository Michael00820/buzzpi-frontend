export default async function handler(req, res) {
  const { paymentId, txdata } = req.body || {};
  console.log('[SANDBOX] complete paymentId:', paymentId, 'tx:', txdata);
  // Here we would credit BuzzCoins to the user wallet after verifying on server.
  return res.status(200).json({ ok: true });
}
