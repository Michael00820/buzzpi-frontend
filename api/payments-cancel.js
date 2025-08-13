export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = JSON.parse(req.body || "{}");
    const { paymentId } = body;
    if (!paymentId) return res.status(400).json({ ok: false, error: "Missing paymentId" });

    console.log("[payments-cancel] cancel", { paymentId });

    // In production: mark payment as canceled in DB.

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}