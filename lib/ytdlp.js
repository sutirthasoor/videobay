import { spawn } from 'child_process';
const HOSTS = { youtube: ['youtube.com', 'youtu.be'], tiktok: ['tiktok.com'], instagram: ['instagram.com'], facebook: ['facebook.com', 'fb.watch'], x: ['x.com', 'twitter.com'] };
export function platformOf(u) {
  try {
    const x = new URL(u); if (!/^https?:$/.test(x.protocol)) return null;
    const h = x.hostname.replace(/^www\./, '');
    for (const [k, v] of Object.entries(HOSTS)) if (v.some(d => h === d || h.endsWith('.' + d))) return k;
  } catch {}
  return null;
}
export function run(args, ms = 30000) {
  return new Promise((res, rej) => {
    const p = spawn(process.env.YTDLP || 'yt-dlp', [...(process.env.YTDLP_ARGS ? process.env.YTDLP_ARGS.split(' ').filter(Boolean) : []), ...args]); let o = '', e = '';
    p.stdout.on('data', d => (o += d)); p.stderr.on('data', d => (e += d));
    const t = setTimeout(() => p.kill('SIGKILL'), ms);
    p.on('error', () => { clearTimeout(t); rej(new Error('yt-dlp not installed')); });
    p.on('close', c => { clearTimeout(t); c === 0 ? res(o) : rej(new Error(e.split('\n').filter(Boolean).pop() || 'failed')); });
  });
}
export const info = async url => JSON.parse(await run(['-J', '--no-playlist', '--no-warnings', url]));
