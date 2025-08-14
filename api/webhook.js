// /api/webhook.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const event = req.body || {};
    console.log("Webhook received:", JSON.stringify(event));
    // TODO: verify signature when you move beyond sandbox
    // TODO: update any local DB / state here if needed

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).json({ ok: false, error: "Webhook handler failed" });
  }
}

// Ensure JSON body parsing (we're not doing raw signature verification yet)
export const config = {
  api: { bodyParser: true }
};