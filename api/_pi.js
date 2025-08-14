const BASE = 'https://api.minepi.com/v2';

export async function piFetch(path, method = 'GET', body) {
  const key = process.env.PI_API_KEY;
  if (!key) throw new Error('Missing PI_API_KEY env var');

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Key ${key}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store'
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pi API ${method} ${path} ${res.status}: ${text}`);
  }
  try { return await res.json(); } catch { return {}; }
}
