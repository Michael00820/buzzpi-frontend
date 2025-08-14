// api/_pi.js
import { readPiEnv } from './_utils/env';

export default async function handler(req, res) {
  const { ok, key, env } = readPiEnv();
  if (!ok) {
    console.error('PI_API_KEY missing in environment!');
    return res
      .status(500)
      .json({ ok: false, error: 'Server not configured: PI_API_KEY missing' });
  }

  // Quick sanity payload so you can confirm server has the key (but never returns it)
  return res.status(200).json({
    ok: true,
    env,
    hasKey: !!key,
  });
}