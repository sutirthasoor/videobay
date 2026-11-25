import fs from 'fs'; import os from 'os'; import path from 'path'; import { Readable } from 'stream';
import { spawn } from 'child_process';
import { run, platformOf } from '@/lib/ytdlp';
import { limited, ipOf } from '@/lib/limit';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
let active = 0;
const sh = (cmd, args, ms = 300000) => new Promise((res, rej) => {
  const p = spawn(cmd, args); let o = ''; p.stdout.on('data', d => (o += d)); p.stderr.on('data', () => {});
  const t = setTimeout(() => p.kill('SIGKILL'), ms);
  p.on('error', rej); p.on('close', c => { clearTimeout(t); c === 0 ? res(o) : rej(new Error(cmd + ' failed')); });
});
// Make MP4 playable everywhere (WhatsApp, iPhone, Android): H.264 + AAC + yuv420p + faststart
async function mobileSafe(file) {
  const out = file.replace(/\.[^.]+$/, '') + '-ok.mp4'; let v = '', a = '', pf = '';
  try {
    const j = JSON.parse(await sh(process.env.FFPROBE || 'ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,pix_fmt', '-of', 'json', file], 30000));
    for (const x of j.streams) { if (x.codec_type === 'video') { v = x.codec_name; pf = x.pix_fmt; } if (x.codec_type === 'audio') a = x.codec_name; }
  } catch {}
  const ok = v === 'h264' && pf === 'yuv420p' && (!a || a === 'aac') && file.endsWith('.mp4');
  await sh(process.env.FFMPEG || 'ffmpeg', ['-y', '-i', file, ...(ok ? ['-c', 'copy'] : ['-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k']), '-movflags', '+faststart', out]);
  fs.unlink(file, () => {}); return out;
}
export async function GET(req) {
  const p = new URL(req.url).searchParams, url = p.get('url') || '';
  const type = p.get('type') === 'mp3' ? 'mp3' : 'mp4', h = Math.min(parseInt(p.get('h')) || 720, 2160);
  const platform = platformOf(url);
  if (!platform) return new Response('Unsupported link', { status: 400 });
  if (limited(ipOf(req), 'd', 6)) return new Response('Too many requests', { status: 429 });
  if (active >= Number(process.env.MAX_JOBS || 4)) return new Response('Server busy, retry shortly', { status: 503 });
  active++;
  const tpl = path.join(os.tmpdir(), 'vb-' + crypto.randomUUID() + '.%(ext)s');
  const args = ['--no-playlist', '--no-warnings', '-q', '--no-simulate', '--max-filesize', '500M', '--print', 'after_move:filepath', '-o', tpl,
    ...(type === 'mp3' ? ['-x', '--audio-format', 'mp3', '--audio-quality', '0']
      : ['-f', `bv*[height<=${h}]+ba/b[height<=${h}]/b`, '-S', 'vcodec:h264,acodec:aac', '--merge-output-format', 'mp4']), url];
  let file;
  try { file = (await run(args, 300000)).trim().split('\n').pop(); }
  catch (e) { return new Response('Download failed: ' + e.message, { status: 502 }); }
  finally { active--; }
  if (file && type === 'mp4') { try { file = await mobileSafe(file); } catch (e) { return new Response('Could not prepare a compatible MP4: ' + e.message, { status: 502 }); } }
  if (!file || !fs.existsSync(file)) return new Response('Download failed', { status: 502 });
  addDoc(collection(db, 'downloads'), { platform, type, quality: type === 'mp3' ? 'mp3' : h + 'p', createdAt: serverTimestamp() }).catch(() => {});
  const name = (p.get('title') || 'video').replace(/[^\w\- ]+/g, '').trim().slice(0, 80) || 'video';
  const rs = fs.createReadStream(file); rs.on('close', () => fs.unlink(file, () => {}));
  return new Response(Readable.toWeb(rs), { headers: {
    'Content-Type': type === 'mp3' ? 'audio/mpeg' : 'video/mp4',
    'Content-Length': String(fs.statSync(file).size),
    'Content-Disposition': `attachment; filename="${name}.${type}"` } });
}
