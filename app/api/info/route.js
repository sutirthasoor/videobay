import { info, platformOf } from '@/lib/ytdlp';
import { limited, ipOf } from '@/lib/limit';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
const bad = (error, status = 400) => Response.json({ error }, { status });
export async function POST(req) {
  const { url } = await req.json().catch(() => ({}));
  const platform = platformOf(url || '');
  if (!platform) return bad('Unsupported link. Supported: YouTube, TikTok, Instagram, Facebook, X.');
  if (limited(ipOf(req), 'i', 15)) return bad('Too many requests. Try again in a minute.', 429);
  try {
    const d = await info(url);
    if (d.is_live) return bad('Live streams are not supported.');
    if (d.availability && !['public', 'unlisted'].includes(d.availability)) return bad('This video is private or restricted and cannot be downloaded.');
    const vf = (d.formats || []).filter(f => f.vcodec && f.vcodec !== 'none' && f.height && !f.has_drm);
    if (!vf.length) return bad('This video is protected (DRM) or unavailable.');
    const heights = [...new Set(vf.map(f => f.height))].filter(h => h >= 144).sort((a, b) => b - a).slice(0, 6);
    return Response.json({ platform, title: d.title || 'Video', thumbnail: d.thumbnail, duration: d.duration || 0, heights });
  } catch (e) { return bad('Could not fetch this video. It may be private, removed, or region-locked.', 422); }
}
