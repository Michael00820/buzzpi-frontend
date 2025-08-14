export default async function handler(req, res) {
  const hasKey = !!process.env.PI_API_KEY || !!process.env.NEXT_PUBLIC_PI_API_KEY;
  const env = process.env.PI_ENV || 'unset';

  // log to server logs (safe – no secrets)
  console.log('[env-check]', { PI_API_KEY_present: hasKey, PI_ENV: env });

  return res.status(200).json({
    ok: true,
    PI_API_KEY_present: hasKey,
    PI_ENV: env
  });
}
