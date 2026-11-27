import { platformOf, cleanUrl, info, toResponse, friendlyError } from '@/lib/ytdlp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function handle(raw) {
  const url = typeof raw === 'string' ? cleanUrl(raw) : '';
  const platform = platformOf(url);
  if (!platform) return Response.json({ error: 'UNSUPPORTED_URL', message: 'Paste a valid YouTube, TikTok, Instagram, Facebook or X link.' }, { status: 400 });
  try {
    const d = await info(url);
    return Response.json(toResponse(d, url, platform));
  } catch (e) {
    return Response.json({ error: 'EXTRACTION_FAILED', message: friendlyError(e.message), detail: e.message }, { status: 422 });
  }
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  return handle(body.url);
}

export async function GET(req) {
  return handle(new URL(req.url).searchParams.get('url'));
}
