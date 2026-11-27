import { spawn } from 'child_process';

function exec(bin, args, ms = 240000) {
  return new Promise((res, rej) => {
    const p = spawn(bin, args, { windowsHide: true });
    let o = '', e = '';
    p.stdout.on('data', d => (o += d));
    p.stderr.on('data', d => (e += d));
    const t = setTimeout(() => { try { p.kill('SIGKILL'); } catch {} }, ms);
    p.on('error', () => { clearTimeout(t); rej(new Error('ffmpeg/ffprobe not installed')); });
    p.on('close', c => {
      clearTimeout(t);
      c === 0 ? res(o) : rej(new Error(e.split('\n').filter(Boolean).pop() || 'ffmpeg failed'));
    });
  });
}

export async function probe(file) {
  const o = await exec(process.env.FFPROBE || 'ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', file], 30000);
  return JSON.parse(o).streams || [];
}

// WhatsApp / iOS / most phones need: MP4, H.264 (yuv420p, even dimensions), AAC-LC, faststart.
// Instagram/YouTube DASH is usually VP9/AV1 + HE-AAC, which WhatsApp refuses or shows as a broken file.
export async function makeCompatible(file, out) {
  const s = await probe(file);
  const v = s.find(x => x.codec_type === 'video');
  const a = s.find(x => x.codec_type === 'audio');
  const vOk = !v || (v.codec_name === 'h264' && v.pix_fmt === 'yuv420p' && v.width % 2 === 0 && v.height % 2 === 0);
  const aOk = !a || (a.codec_name === 'aac' && a.profile === 'LC');

  const args = ['-y', '-i', file, '-map', '0:v:0?', '-map', '0:a:0?'];
  if (vOk) args.push('-c:v', 'copy');
  else args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p',
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-profile:v', 'high', '-level', '4.1');
  if (aOk) args.push('-c:a', 'copy');
  else args.push('-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '2');
  args.push('-movflags', '+faststart', out);

  await exec(process.env.FFMPEG || 'ffmpeg', args);
  return out;
}
