// Stub endpoint: logs a payment intent. Replace with real Pi verification later.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = JSON.parse(req.body || "{}");
    // Expect: { amount, giftId, userId? }
    const { amount, giftId, userId } = body;

    if (!amount || !giftId) return res.status(400).json({ ok: false, error: "Missing amount or giftId" });

    // Simulate a server-generated paymentId you’d verify with Pi later.
    const paymentId = `test_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    console.log("[payments-create] intent", { amount, giftId, userId, paymentId });

    // In production: create a record in your DB here.

    return res.status(200).json({ ok: true, paymentId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
