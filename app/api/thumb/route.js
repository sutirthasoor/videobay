export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// only proxy known image CDNs (prevents SSRF); thumbnails from IG/FB are signed and hotlink-protected
const ALLOWED = ['fbcdn.net', 'cdninstagram.com', 'ytimg.com', 'ggpht.com', 'googleusercontent.com',
  'tiktokcdn.com', 'tiktokcdn-us.com', 'byteimg.com', 'ibyteimg.com', 'twimg.com', 'fbsbx.com'];

export async function GET(req) {
  const u = new URL(req.url).searchParams.get('u');
  let t;
  try { t = new URL(u); } catch { return new Response('bad url', { status: 400 }); }
  if (t.protocol !== 'https:' || !ALLOWED.some(d => t.hostname === d || t.hostname.endsWith('.' + d)))
    return new Response('host not allowed', { status: 400 });
  try {
    const r = await fetch(t, {
      headers: { Referer: 'https://www.instagram.com/', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36' },
    });
    if (!r.ok) return new Response('upstream ' + r.status, { status: 502 });
    return new Response(r.body, {
      headers: { 'Content-Type': r.headers.get('content-type') || 'image/jpeg', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    return new Response('fetch failed', { status: 502 });
  }
}
