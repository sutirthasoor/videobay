import fs from 'fs'; import os from 'os'; import path from 'path'; import { Readable } from 'stream';
import { run, platformOf } from '@/lib/ytdlp';
import { limited, ipOf } from '@/lib/limit';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
let active = 0;
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
      : ['-f', `bv*[height<=${h}][ext=mp4]+ba[ext=m4a]/b[height<=${h}][ext=mp4]/b[height<=${h}]/b`, '--merge-output-format', 'mp4']), url];
  let file;
  try { file = (await run(args, 300000)).trim().split('\n').pop(); }
  catch (e) { return new Response('Download failed: ' + e.message, { status: 502 }); }
  finally { active--; }
  if (!file || !fs.existsSync(file)) return new Response('Download failed', { status: 502 });
  addDoc(collection(db, 'downloads'), { platform, type, quality: type === 'mp3' ? 'mp3' : h + 'p', createdAt: serverTimestamp() }).catch(() => {});
  const name = (p.get('title') || 'video').replace(/[^\w\- ]+/g, '').trim().slice(0, 80) || 'video';
  const rs = fs.createReadStream(file); rs.on('close', () => fs.unlink(file, () => {}));
  return new Response(Readable.toWeb(rs), { headers: {
    'Content-Type': type === 'mp3' ? 'audio/mpeg' : 'video/mp4',
    'Content-Length': String(fs.statSync(file).size),
    'Content-Disposition': `attachment; filename="${name}.${type}"` } });
}
