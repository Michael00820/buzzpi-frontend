export default async function handler(req, res) {
  res.status(200).json({ ok: true, ts: Date.now(), region: process.env.VERCEL_REGION || "local" });
}