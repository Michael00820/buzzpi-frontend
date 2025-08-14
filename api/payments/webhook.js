export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    const body = await req.json();
    console.log('Pi webhook:', body?.type, body?.data?.payment?.identifier);
  } catch {}
  return new Response(JSON.stringify({ received: true }), { status: 200, headers: {'Content-Type':'application/json'} });
}
