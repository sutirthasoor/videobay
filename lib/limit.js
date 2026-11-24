const m = new Map();
export function limited(ip, k, max, win = 60000) {
  const key = k + ip, n = Date.now(), a = (m.get(key) || []).filter(t => n - t < win);
  a.push(n); m.set(key, a); return a.length > max;
}
export const ipOf = r => (r.headers.get('x-forwarded-for') || '0').split(',')[0].trim();
