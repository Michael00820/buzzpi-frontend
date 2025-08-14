// api/_utils/env.js
export function readPiEnv() {
  const key =
    process.env.PI_API_KEY ||
    process.env.NEXT_PUBLIC_PI_API_KEY ||
    '';

  const env = process.env.PI_ENV || 'sandbox'; // 'sandbox' | 'production'

  return { ok: Boolean(key), key, env };
}