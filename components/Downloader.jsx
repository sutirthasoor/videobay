'use client';
import { useEffect, useState } from 'react';
import AdSlot from './AdSlot';
const fmt = s => { s = Math.round(s || 0); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
export default function Downloader() {
  const [url, setUrl] = useState(''), [busy, setBusy] = useState(false), [err, setErr] = useState(''), [d, setD] = useState(null), [hist, setHist] = useState([]);
  useEffect(() => { try { setHist(JSON.parse(localStorage.getItem('vb_hist') || '[]')); } catch {} }, []);
  const save = h => { setHist(h); try { localStorage.setItem('vb_hist', JSON.stringify(h)); } catch {} };
  async function go(u = url) {
    setErr(''); setD(null); if (!u.trim()) return setErr('Paste a video link first.'); setBusy(true);
    try {
      const r = await fetch('/api/info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: u.trim() }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error);
      setD({ ...j, url: u.trim() });
      save([{ url: u.trim(), title: j.title, thumbnail: j.thumbnail }, ...hist.filter(x => x.url !== u.trim())].slice(0, 10));
    } catch (e) { setErr(e.message || 'Something went wrong.'); } finally { setBusy(false); }
  }
  const link = (type, h) => `/api/download?url=${encodeURIComponent(d.url)}&type=${type}&h=${h || ''}&title=${encodeURIComponent(d.title)}`;
  const btn = 'rounded-lg px-4 py-2 text-sm font-semibold text-white';
  return (<div>
    <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-2 rounded-2xl bg-white p-3 shadow-lg sm:flex-row">
      <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()} placeholder="Paste video link here…" className="min-w-0 flex-1 rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" />
      <button onClick={async () => { try { const t = await navigator.clipboard.readText(); setUrl(t); go(t); } catch { setErr('Clipboard blocked — paste manually.'); } }} className="rounded-lg border px-4 py-3 font-semibold">Paste</button>
      <button onClick={() => go()} disabled={busy} className="rounded-lg bg-indigo-600 px-6 py-3 font-bold text-white disabled:opacity-60">{busy ? 'Loading…' : 'Download'}</button>
    </div>
    {err && <p className="mx-auto mt-3 max-w-3xl rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
    {d && (<div className="mx-auto mt-6 max-w-3xl rounded-2xl border bg-white p-4 shadow">
      <div className="flex flex-col gap-4 sm:flex-row">
        {d.thumbnail && <img src={d.thumbnail} referrerPolicy="no-referrer" alt="" className="w-full rounded-lg object-cover sm:w-56" />}
        <div className="min-w-0"><h3 className="line-clamp-2 font-bold">{d.title}</h3>
          <p className="text-sm text-slate-500">{d.platform.toUpperCase()} · {fmt(d.duration)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {d.heights.map(h => <a key={h} href={link('mp4', h)} className={btn + ' bg-indigo-600'}>MP4 {h}p</a>)}
            <a href={link('mp3')} className={btn + ' bg-emerald-600'}>MP3</a></div>
          <p className="mt-2 text-xs text-slate-400">Processing may take a few seconds before the download starts.</p></div></div></div>)}
    <AdSlot slot="inline" />
    {hist.length > 0 && (<div className="mx-auto mt-8 max-w-3xl"><div className="mb-2 flex justify-between"><h2 className="font-bold">Recent</h2><button onClick={() => save([])} className="text-sm text-slate-500">Clear</button></div>
      {hist.map(h => (<button key={h.url} onClick={() => { setUrl(h.url); go(h.url); }} className="mb-2 flex w-full items-center gap-3 rounded-lg border bg-white p-2 text-left">
        {h.thumbnail && <img src={h.thumbnail} referrerPolicy="no-referrer" alt="" className="h-12 w-20 rounded object-cover" />}<span className="line-clamp-2 text-sm">{h.title}</span></button>))}</div>)}
  </div>);
}
