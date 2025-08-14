// Centralized, server-only env reader.
// Never export the secret itself to the client.

export function readPiEnv() {
  const key =
    process.env.PI_API_KEY || process.env.NEXT_PUBLIC_PI_API_KEY || ''; // keep NEXT_PUBLIC fallback only while debugging
  const env = process.env.PI_ENV || 'sandbox';

  return {
    ok: !!key,
    key,     // use only on server to call Pi API
    env,     // "sandbox" | "production" (or whatever you set)
  };
}
