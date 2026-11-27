import { mkdtemp, readdir, stat, rm } from 'fs/promises';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import { tmpdir } from 'os';
import { join } from 'path';
import { platformOf, cleanUrl, run, friendlyError } from '@/lib/ytdlp';
import { makeCompatible } from '@/lib/compat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

let active = 0;
const MAX_ACTIVE = Number(process.env.MAX_DOWNLOADS || 3);

// each list is tried in order until one succeeds -> maximises the chance every video downloads
function selectors(q) {
  if (q === 'audio') return ['ba/b'];
  if (/^\d+$/.test(q)) {
    const h = Number(q);
    return [`bv*[height<=${h}]+ba/b[height<=${h}]`, 'bv*+ba/b', 'b', 'w'];
  }
  return ['bv*+ba/b', 'b', 'w'];
}

function safeName(t) {
  const n = (t || 'video').replace(/[\\/:*?"<>|\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
  return n || 'video';
}

export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const url = cleanUrl(sp.get('url') || '');
  const q = sp.get('q') || 'best';
  if (!platformOf(url)) return Response.json({ error: 'UNSUPPORTED_URL' }, { status: 400 });
  if (active >= MAX_ACTIVE) return Response.json({ error: 'BUSY', message: 'Server is busy, retry in a few seconds.' }, { status: 429 });

  active++;
  const dir = await mkdtemp(join(tmpdir(), 'vb-'));
  const cleanup = () => rm(dir, { recursive: true, force: true }).catch(() => {});
  const audio = q === 'audio';
  let lastErr;

  try {
    for (const sel of selectors(q)) {
      const args = [
        '--no-playlist', '--playlist-items', '1', '--no-warnings', '--no-part',
        '-f', sel,
        '-o', join(dir, 'out.%(ext)s'),
      ];
      if (audio) args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
      else args.push('--merge-output-format', 'mp4', '-S', 'res,vcodec:h264,acodec:m4a');
      if (process.env.YTDLP_MAX_FILESIZE) args.push('--max-filesize', process.env.YTDLP_MAX_FILESIZE);
      args.push(url);
      try {
        await run(args, { ms: 280000, signal: req.signal });
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        if (req.signal?.aborted) break;
        await rm(dir, { recursive: true, force: true }).catch(() => {});
        await import('fs/promises').then(m => m.mkdir(dir, { recursive: true }));
      }
    }
    if (lastErr) throw lastErr;

    const files = (await readdir(dir)).filter(f => !/\.(part|ytdl|tmp)$/i.test(f));
    if (!files.length) throw new Error('no output file');
    let file = join(dir, files[0]);
    let ext = files[0].split('.').pop().toLowerCase();

    // make video playable/sendable on WhatsApp, iPhone, Android (H.264 + AAC-LC, faststart)
    if (!audio && process.env.COMPAT !== '0') {
      try {
        file = await makeCompatible(file, join(dir, 'compat.mp4'));
        ext = 'mp4';
      } catch (e) {
        console.error('[compat] skipped:', e.message); // serve original if ffmpeg fails
      }
    }
    const size = (await stat(file)).size;

    const name = `${safeName(sp.get('title'))}.${ext}`;
    const ascii = name.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '');
    const stream = createReadStream(file);
    const done = () => { active--; cleanup(); };
    stream.on('close', done);
    stream.on('error', done);

    return new Response(Readable.toWeb(stream), {
      headers: {
        'Content-Type': ext === 'mp3' ? 'audio/mpeg' : ext === 'webm' ? 'video/webm' : 'video/mp4',
        'Content-Length': String(size),
        'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    active--;
    cleanup();
    return Response.json({ error: 'DOWNLOAD_FAILED', message: friendlyError(e.message), detail: e.message }, { status: 422 });
  }
}
