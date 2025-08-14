const PI_API_KEY =
  process.env.PI_API_KEY || process.env.NEXT_PUBLIC_PI_API_KEY || '';

const PI_ENV = process.env.PI_ENV || 'sandbox';

if (!PI_API_KEY) {
  console.error('PI_API_KEY missing in environment!');
  return res.status(500).json({ ok: false, error: 'Server not configured' });
}
// Stub endpoint: marks a payment as "complete" (no real Pi verification yet).
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = JSON.parse(req.body || "{}");
    const { paymentId } = body;
    if (!paymentId) return res.status(400).json({ ok: false, error: "Missing paymentId" });

    console.log("[payments-complete] complete", { paymentId });

    // In production: verify with Pi, update DB, credit balance.

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}