import { spawn } from 'child_process';

const HOSTS = {
  youtube: ['youtube.com', 'youtu.be'],
  tiktok: ['tiktok.com'],
  instagram: ['instagram.com'],
  facebook: ['facebook.com', 'fb.watch'],
  x: ['x.com', 'twitter.com'],
};

export function platformOf(u) {
  try {
    const x = new URL(u);
    if (!/^https?:$/.test(x.protocol)) return null;
    const h = x.hostname.replace(/^www\./, '');
    for (const [k, v] of Object.entries(HOSTS)) if (v.some(d => h === d || h.endsWith('.' + d))) return k;
  } catch {}
  return null;
}

// strip tracking params (e.g. Instagram ?cnvx=...) that are not needed for extraction
export function cleanUrl(u) {
  try {
    const x = new URL(u.trim());
    const p = platformOf(x.toString());
    x.hash = '';
    if (p === 'instagram' || p === 'tiktok' || p === 'x') x.search = '';
    return x.toString();
  } catch {
    return u;
  }
}

function baseArgs() {
  const a = [];
  if (process.env.YTDLP_ARGS) a.push(...process.env.YTDLP_ARGS.split(' ').filter(Boolean));
  if (process.env.YTDLP_COOKIES) a.push('--cookies', process.env.YTDLP_COOKIES);
  else if (process.env.YTDLP_COOKIES_BROWSER) a.push('--cookies-from-browser', process.env.YTDLP_COOKIES_BROWSER);
  if (process.env.YTDLP_PROXY) a.push('--proxy', process.env.YTDLP_PROXY);
  return a;
}

export function friendlyError(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('not installed')) return 'yt-dlp is not installed on the server';
  if (m.includes('login') || m.includes('log in') || m.includes('cookies') || m.includes('rate-limit'))
    return 'This video needs login or the platform is rate-limiting the server. Add cookies (YTDLP_COOKIES) and retry.';
  if (m.includes('private')) return 'This video is private.';
  if (m.includes('not available') || m.includes('unavailable') || m.includes('removed')) return 'This video is unavailable or removed.';
  if (m.includes('drm')) return 'This video is DRM-protected and cannot be downloaded.';
  if (m.includes('sign in') || m.includes('confirm you')) return 'YouTube is asking for sign-in. Add cookies (YTDLP_COOKIES).';
  if (m.includes('timed out') || m.includes('killed')) return 'Timed out while fetching the video.';
  return 'Could not fetch this video.';
}

export function run(args, { ms = 30000, signal } = {}) {
  return new Promise((res, rej) => {
    const p = spawn(process.env.YTDLP || 'yt-dlp', [...baseArgs(), ...args], { windowsHide: true });
    let o = '', e = '';
    p.stdout.on('data', d => (o += d));
    p.stderr.on('data', d => (e += d));
    const kill = () => { try { p.kill('SIGKILL'); } catch {} };
    const t = setTimeout(kill, ms);
    signal?.addEventListener('abort', kill, { once: true });
    p.on('error', () => { clearTimeout(t); rej(new Error('yt-dlp not installed')); });
    p.on('close', code => {
      clearTimeout(t);
      if (code === 0) return res(o);
      console.error('[yt-dlp] failed:', args.filter(a => !/^https?:/.test(a)).join(' '), '\n', e.trim());
      const line =
        e.split('\n').filter(l => l.startsWith('ERROR')).pop() ||
        e.split('\n').filter(Boolean).pop() ||
        'failed';
      rej(Object.assign(new Error(line), { stderr: e }));
    });
  });
}

export async function info(url) {
  const out = await run(['-J', '--no-playlist', '--no-warnings', '--no-write-comments', url], { ms: 60000 });
  return JSON.parse(out);
}

// Instagram embeds duration_s inside the signed "efg" query param of media URLs
function durationFromUrls(formats) {
  for (const f of formats) {
    try {
      const efg = new URL(f.url).searchParams.get('efg');
      if (!efg) continue;
      const j = JSON.parse(Buffer.from(efg, 'base64').toString());
      if (j.duration_s) return Number(j.duration_s);
    } catch {}
  }
  return 0;
}

function pickThumb(d) {
  const list = (d.thumbnails || []).filter(t => t.url && t.width);
  const ok = list.filter(t => t.width <= 720).sort((a, b) => b.width * (b.height || 0) - a.width * (a.height || 0));
  return (ok[0] || list[list.length - 1] || {}).url || d.thumbnail || '';
}

export function toResponse(d, url, platform) {
  const src = d.entries?.find(Boolean) || d; // carousels / multi-item posts: first item
  const fs = Array.isArray(src.formats) ? src.formats : [];
  const hasAnyMedia = fs.length > 0 || !!src.url;
  if (!hasAnyMedia) throw new Error('NO_FORMATS');

  // heights of real video formats (label by short side so vertical 720x1280 shows as 720p)
  const byH = new Map();
  for (const f of fs) {
    if (f.vcodec === 'none' || !f.height) continue;
    const prev = byH.get(f.height);
    const size = f.filesize || f.filesize_approx || 0;
    if (!prev) byH.set(f.height, { h: f.height, w: f.width, size });
    else prev.size = Math.max(prev.size, size);
  }
  const heights = [...byH.values()].sort((a, b) => b.h - a.h).slice(0, 8);

  const q = encodeURIComponent;
  const title = src.title || src.fulltitle || 'video';
  const dl = id => `/api/download?url=${q(url)}&q=${id}&title=${q(title.slice(0, 80))}`;

  const options = heights.map(({ h, w, size }) => ({
    id: String(h),
    kind: 'video',
    label: `${Math.min(w || h, h)}p`,
    height: h,
    ext: 'mp4',
    size: size || null,
    downloadUrl: dl(h),
  }));
  // no usable height (progressive "unknown" formats, some TikTok/FB/X): still downloadable as "best"
  if (!options.length) {
    options.push({ id: 'best', kind: 'video', label: 'Best available', height: null, ext: 'mp4', size: null, downloadUrl: dl('best') });
  }
  options.push({ id: 'audio', kind: 'audio', label: 'MP3 audio', height: null, ext: 'mp3', size: null, downloadUrl: dl('audio') });

  return {
    platform,
    title,
    thumbnail: pickThumb(src) ? `/api/thumb?u=${q(pickThumb(src))}` : '',
    duration: Math.round(src.duration || d.duration || durationFromUrls(fs) || 0),
    uploader: src.uploader || src.channel || '',
    items: d.entries ? d.entries.filter(Boolean).length : 1,
    heights: options.filter(o => o.height).map(o => o.height),
    options,
  };
}
