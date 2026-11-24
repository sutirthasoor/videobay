'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { DEFAULTS } from '@/components/Content';

const SLOTS = ['header', 'inline', 'footer'];
const NAV = [['stats', 'Dashboard'], ['downloads', 'Download log'], ['visitors', 'Visitors'], ['ads', 'Advertisements'], ['content', 'Site content'], ['settings', 'Settings']];
const BLUE = '#2f4cf5';
const inp = 'w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-black outline-none focus:border-[#2f4cf5]';
const card = 'rounded-md bg-white p-5 shadow-sm';
const btn = 'rounded bg-[#2f4cf5] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2440d8]';
const last = n => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return d.toISOString().slice(0, 10); });

function Spark({ data, color = '#6366f1', w = 110, h = 36 }) {
  const m = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 2 - (v / m) * (h - 4)}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" /></svg>;
}
function Chart({ labels, series }) {
  const w = 640, h = 240, p = 30, m = Math.max(...series.flatMap(s => s.data), 1);
  const x = i => p + (i / (labels.length - 1)) * (w - p * 2), y = v => h - p - (v / m) * (h - p * 2);
  return (<svg viewBox={`0 0 ${w} ${h}`} className="w-full">
    {[0, 0.5, 1].map(t => <g key={t}><line x1={p} x2={w - p} y1={y(m * t)} y2={y(m * t)} stroke="#e5e7eb" /><text x={2} y={y(m * t) + 4} fontSize="10" fill="#000">{Math.round(m * t)}</text></g>)}
    {series.map(s => { const pts = s.data.map((v, i) => `${x(i)},${y(v)}`); return (<g key={s.name}>
      <polygon points={`${x(0)},${y(0)} ${pts.join(' ')} ${x(labels.length - 1)},${y(0)}`} fill={s.color} opacity=".12" />
      <polyline points={pts.join(' ')} fill="none" stroke={s.color} strokeWidth="2" /></g>); })}
    {labels.map((l, i) => i % 2 === 0 && <text key={l} x={x(i)} y={h - 8} fontSize="10" textAnchor="middle" fill="#000">{l.slice(5)}</text>)}
  </svg>);
}
function Donut({ o }) {
  const e = Object.entries(o), t = e.reduce((a, [, v]) => a + v, 0) || 1, C = ['#2f4cf5', '#7c5cf5', '#22c55e', '#f59e0b', '#ef4444']; let off = 0;
  return (<div className="flex flex-wrap items-center gap-6">
    <svg width="150" height="150" viewBox="0 0 42 42"><circle cx="21" cy="21" r="15.9" fill="none" stroke="#eef2f7" strokeWidth="6" />
      {e.map(([k, v], i) => { const d = (v / t) * 100, el = <circle key={k} cx="21" cy="21" r="15.9" fill="none" stroke={C[i % 5]} strokeWidth="6" strokeDasharray={`${d} ${100 - d}`} strokeDashoffset={25 - off} />; off += d; return el; })}</svg>
    <ul className="space-y-1 text-sm text-black">{e.length ? e.map(([k, v], i) => <li key={k} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: C[i % 5] }} />{k} <b>{v}</b></li>) : <li>No data yet</li>}</ul></div>);
}
function Rows({ t, o }) {
  return (<div className={card}><h3 className="mb-3 font-bold text-black">{t}</h3>
    {Object.keys(o).length ? Object.entries(o).map(([k, v]) => <div key={k} className="flex justify-between border-b border-slate-100 py-1.5 text-sm text-black last:border-0"><span>{k}</span><b>{v}</b></div>) : <p className="text-sm text-black">No data yet</p>}</div>);
}

function Stats() {
  const [s, setS] = useState(null), [err, setErr] = useState('');
  useEffect(() => { (async () => {
    try {
      const dl = (await getDocs(query(collection(db, 'downloads'), orderBy('createdAt', 'desc'), limit(5000)))).docs.map(d => d.data());
      const vs = Object.fromEntries((await getDocs(query(collection(db, 'stats'), orderBy('day', 'desc'), limit(30)))).docs.map(d => [d.data().day, d.data().count]));
      const by = k => dl.reduce((a, x) => ((a[x[k]] = (a[x[k]] || 0) + 1), a), {});
      const dd = {}; dl.forEach(x => { const k = x.createdAt?.toDate?.().toISOString().slice(0, 10); if (k) dd[k] = (dd[k] || 0) + 1; });
      const days = last(14);
      setS({ days, total: dl.length, platform: by('platform'), type: by('type'), quality: by('quality'), dls: days.map(d => dd[d] || 0), vis: days.map(d => vs[d] || 0), visits30: Object.values(vs).reduce((a, b) => a + b, 0) });
    } catch (e) { setErr('Cannot read stats: ' + e.message + ' (check firestore.rules admin email)'); }
  })(); }, []);
  if (err) return <p className="text-red-600">{err}</p>;
  if (!s) return <p className="text-black">Loading…</p>;
  const kpis = [['Visits (30d)', s.visits30, s.vis], ['Downloads', s.total, s.dls], ['MP4 files', s.type.mp4 || 0, s.dls], ['MP3 files', s.type.mp3 || 0, s.dls]];
  return (<div className="space-y-6">
    <div className={card + ' grid gap-6 sm:grid-cols-2 lg:grid-cols-4'}>
      {kpis.map(([l, n, d]) => (<div key={l} className="flex items-center justify-between gap-3">
        <div><p className="text-3xl font-bold text-black">{n}</p><p className="text-sm font-medium text-black">{l}</p></div><Spark data={d} color="#6366f1" /></div>))}
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[['Downloads today', s.dls[13]], ['Last 7 days', s.dls.slice(7).reduce((a, b) => a + b, 0)], ['Daily average (14d)', (s.dls.reduce((a, b) => a + b, 0) / 14).toFixed(1)], ['Top platform', Object.entries(s.platform).sort((a, b) => b[1] - a[1])[0]?.[0] || '-']].map(([l, v]) => <div key={l} className={card}><p className="text-xs font-medium text-black">{l}</p><p className="mt-1 text-2xl font-bold capitalize text-black">{v}</p></div>)}
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <div className={card + ' lg:col-span-2'}>
        <h3 className="font-bold text-black">Traffic overview</h3><p className="text-xs text-black">Last 14 days</p>
        <div className="mt-2 flex gap-4 text-xs text-black"><span><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: BLUE }} />Visits</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Downloads</span></div>
        <Chart labels={s.days} series={[{ name: 'Visits', data: s.vis, color: BLUE }, { name: 'Downloads', data: s.dls, color: '#10b981' }]} />
      </div>
      <div className={card}><h3 className="mb-4 font-bold text-black">Downloads by platform</h3><Donut o={s.platform} /></div>
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <Rows t="By format" o={s.type} /><Rows t="By quality" o={s.quality} />
      <Rows t="Visits per day" o={Object.fromEntries(s.days.map((d, i) => [d, s.vis[i]]).reverse().slice(0, 7))} />
    </div>
  </div>);
}

function Ads() {
  const [a, setA] = useState({}), [m, setM] = useState('');
  useEffect(() => { SLOTS.forEach(async s => { const d = await getDoc(doc(db, 'ads', s)); setA(p => ({ ...p, [s]: d.exists() ? d.data() : { enabled: false, adsenseSlotId: '', html: '' } })); }); }, []);
  const up = (s, k, v) => setA(p => ({ ...p, [s]: { ...p[s], [k]: v } }));
  return (<div className="grid gap-6 lg:grid-cols-3">{SLOTS.map(s => a[s] && (<div key={s} className={card + ' space-y-3'}><h3 className="font-bold capitalize text-black">{s} slot</h3>
    <label className="flex gap-2 text-sm text-black"><input type="checkbox" checked={!!a[s].enabled} onChange={e => up(s, 'enabled', e.target.checked)} />Enabled</label>
    <input className={inp} placeholder="AdSense ad slot ID" value={a[s].adsenseSlotId || ''} onChange={e => up(s, 'adsenseSlotId', e.target.value)} />
    <textarea className={inp} rows={4} placeholder="…or custom HTML banner (used if no slot ID)" value={a[s].html || ''} onChange={e => up(s, 'html', e.target.value)} />
    <button className={btn} onClick={() => setDoc(doc(db, 'ads', s), a[s]).then(() => setM('Saved ' + s)).catch(e => setM(e.message))}>Save</button></div>))}
    {m && <p className="text-sm text-black lg:col-span-3">{m}</p>}</div>);
}

function Content() {
  const [c, setC] = useState(null), [m, setM] = useState('');
  useEffect(() => { getDoc(doc(db, 'content', 'site')).then(d => setC({ ...DEFAULTS, ...(d.exists() ? d.data() : {}) })); }, []);
  if (!c) return <p className="text-black">Loading…</p>;
  const txt = c.faqs.map(f => f.q + ' | ' + f.a).join('\n');
  return (<div className={card + ' max-w-3xl space-y-3'}>
    <label className="text-xs font-medium text-black">Hero title</label>
    <input className={inp} value={c.heroTitle} onChange={e => setC({ ...c, heroTitle: e.target.value })} />
    <label className="text-xs font-medium text-black">Hero subtitle</label>
    <textarea className={inp} rows={2} value={c.heroSub} onChange={e => setC({ ...c, heroSub: e.target.value })} />
    <label className="text-xs font-medium text-black">Announcement bar (shown at top of public site; leave empty to hide)</label>
    <input className={inp} value={c.announcement || ''} onChange={e => setC({ ...c, announcement: e.target.value })} />
    <label className="text-xs font-medium text-black">FAQ — one per line: Question | Answer</label>
    <textarea className={inp} rows={10} defaultValue={txt} onChange={e => setC({ ...c, faqs: e.target.value.split('\n').filter(l => l.includes('|')).map(l => { const [q, ...r] = l.split('|'); return { q: q.trim(), a: r.join('|').trim() }; }) })} />
    <button className={btn} onClick={() => setDoc(doc(db, 'content', 'site'), c).then(() => setM('Saved')).catch(e => setM(e.message))}>Save</button> <span className="text-sm text-black">{m}</span></div>);
}

const th = 'px-3 py-2 text-left text-xs font-semibold text-black';
const td = 'px-3 py-2 text-sm text-black';
const PLATS = ['all', 'youtube', 'tiktok', 'instagram', 'facebook', 'x'];

function Downloads() {
  const [rows, setRows] = useState(null), [f, setF] = useState('all'), [err, setErr] = useState(''), [pg, setPg] = useState(0);
  useEffect(() => { getDocs(query(collection(db, 'downloads'), orderBy('createdAt', 'desc'), limit(1000))).then(s => setRows(s.docs.map(d => { const x = d.data(); return { ...x, t: x.createdAt?.toDate?.() || null }; }))).catch(e => setErr(e.message)); }, []);
  if (err) return <p className="text-red-600">{err}</p>;
  if (!rows) return <p className="text-black">Loading…</p>;
  const list = rows.filter(r => f === 'all' || r.platform === f), per = 25, pages = Math.max(1, Math.ceil(list.length / per)), view = list.slice(pg * per, pg * per + per);
  const csv = () => { const t = 'time,platform,format,quality\n' + list.map(r => [r.t?.toISOString() || '', r.platform, r.type, r.quality].join(',')).join('\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/csv' })); a.download = 'downloads.csv'; a.click(); };
  return (<div className={card}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-bold text-black">Download log <span className="font-normal">({list.length} of latest 1000)</span></h3>
      <div className="flex gap-2"><select value={f} onChange={e => { setF(e.target.value); setPg(0); }} className={inp + ' !w-auto capitalize'}>{PLATS.map(p => <option key={p}>{p}</option>)}</select>
        <button className={btn} onClick={csv}>Export CSV</button></div></div>
    <div className="overflow-x-auto"><table className="w-full"><thead className="bg-slate-50"><tr><th className={th}>Time</th><th className={th}>Platform</th><th className={th}>Format</th><th className={th}>Quality</th></tr></thead>
      <tbody>{view.map((r, i) => <tr key={i} className="border-b border-slate-100"><td className={td}>{r.t ? r.t.toLocaleString() : '-'}</td><td className={td + ' capitalize'}>{r.platform}</td><td className={td + ' uppercase'}>{r.type}</td><td className={td}>{r.quality}</td></tr>)}
        {!view.length && <tr><td className={td} colSpan={4}>No downloads yet</td></tr>}</tbody></table></div>
    <div className="mt-4 flex items-center justify-between text-sm text-black">
      <button disabled={pg === 0} onClick={() => setPg(pg - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Previous</button><span>Page {pg + 1} of {pages}</span>
      <button disabled={pg + 1 >= pages} onClick={() => setPg(pg + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Next</button></div></div>);
}

function Visitors() {
  const [d, setD] = useState(null), [err, setErr] = useState('');
  useEffect(() => { getDocs(query(collection(db, 'stats'), orderBy('day', 'desc'), limit(60))).then(s => setD(Object.fromEntries(s.docs.map(x => [x.data().day, x.data().count])))).catch(e => setErr(e.message)); }, []);
  if (err) return <p className="text-red-600">{err}</p>;
  if (!d) return <p className="text-black">Loading…</p>;
  const days = last(30), vals = days.map(x => d[x] || 0), total = vals.reduce((a, b) => a + b, 0);
  return (<div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-3">{[['Visits (30 days)', total], ['Daily average', (total / 30).toFixed(1)], ['Best day', Math.max(...vals)]].map(([l, v]) => <div key={l} className={card}><p className="text-xs font-medium text-black">{l}</p><p className="mt-1 text-3xl font-bold text-black">{v}</p></div>)}</div>
    <div className={card}><h3 className="mb-2 font-bold text-black">Visits per day</h3><Chart labels={days} series={[{ name: 'Visits', data: vals, color: BLUE }]} /></div>
    <div className={card}><h3 className="mb-3 font-bold text-black">Daily log</h3><div className="max-h-80 overflow-auto"><table className="w-full"><thead className="sticky top-0 bg-slate-50"><tr><th className={th}>Date</th><th className={th}>Visits</th></tr></thead>
      <tbody>{[...days].reverse().map(x => <tr key={x} className="border-b border-slate-100"><td className={td}>{x}</td><td className={td}>{d[x] || 0}</td></tr>)}</tbody></table></div>
      <p className="mt-3 text-xs text-black">Counts one visit per browser session. For sources and countries, open Google Analytics (G-QP2Q9TJY86).</p></div></div>);
}

function Settings({ user }) {
  const [p1, setP1] = useState(''), [p2, setP2] = useState(''), [m, setM] = useState('');
  const save = () => {
    if (p1.length < 8) return setM('Use at least 8 characters.');
    if (p1 !== p2) return setM('Passwords do not match.');
    updatePassword(auth.currentUser, p1).then(() => { setM('Password updated.'); setP1(''); setP2(''); })
      .catch(e => setM(e.code === 'auth/requires-recent-login' ? 'Please sign out, sign in again, then retry.' : e.message));
  };
  const rows = [['Admin email', user.email], ['Firebase project', 'creator360-51a6c'], ['Google Analytics', 'G-QP2Q9TJY86'], ['AdSense publisher', process.env.NEXT_PUBLIC_ADSENSE_ID || 'Not set (add NEXT_PUBLIC_ADSENSE_ID)']];
  return (<div className="grid gap-6 lg:grid-cols-2">
    <div className={card + ' space-y-3'}><h3 className="font-bold text-black">Change password</h3>
      <input className={inp} type="password" placeholder="New password" value={p1} onChange={e => setP1(e.target.value)} />
      <input className={inp} type="password" placeholder="Confirm new password" value={p2} onChange={e => setP2(e.target.value)} />
      <button className={btn} onClick={save}>Update password</button>{m && <p className="text-sm text-black">{m}</p>}</div>
    <div className={card}><h3 className="mb-3 font-bold text-black">Site configuration</h3>
      {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm text-black last:border-0"><span>{k}</span><b className="break-all text-right">{v}</b></div>)}</div></div>);
}

export default function Admin() {
  const [u, setU] = useState(undefined), [tab, setTab] = useState('stats'), [em, setEm] = useState(''), [pw, setPw] = useState(''), [err, setErr] = useState('');
  const [show, setShow] = useState(false);
  useEffect(() => onAuthStateChanged(auth, setU), []);
  if (u === undefined) return <p className="p-8 text-black">Loading…</p>;

  if (!u) {
    const login = () => signInWithEmailAndPassword(auth, em, pw).catch(e => setErr(e.message));
    const field = 'w-full rounded-full bg-[#fbf8ec] px-5 py-3 text-sm text-black outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-[#ffd75a]';
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-[#9aa3b2] p-4">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[36px] bg-gradient-to-b from-slate-200 via-[#f1eedd] to-[#fbe9a6] p-3 shadow-2xl md:grid-cols-2">
          <div className="relative flex min-h-[560px] flex-col px-8 py-8 sm:px-12">
            <span className="w-fit rounded-full border border-black/30 px-5 py-1.5 text-sm font-medium text-black">VideoBay</span>
            <div className="mx-auto my-auto w-full max-w-sm py-8">
              <h1 className="text-center text-3xl font-medium text-black">Admin sign in</h1>
              <p className="mt-1 text-center text-xs text-black">Manage traffic, ads and site content</p>
              <label className="mt-8 block text-xs text-black">Email</label>
              <input className={field + ' mt-1'} placeholder="admin@yourdomain.com" value={em} onChange={e => setEm(e.target.value)} />
              <label className="mt-4 block text-xs text-black">Password</label>
              <div className="relative mt-1">
                <input className={field + ' pr-16'} type={show ? 'text' : 'password'} placeholder="Enter your password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-black">{show ? 'Hide' : 'Show'}</button>
              </div>
              {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
              <button onClick={login} className="mt-6 w-full rounded-full bg-[#ffd75a] py-3.5 text-sm font-semibold text-black shadow-sm transition hover:bg-[#ffcd36]">Submit</button>
            </div>
            <div className="flex justify-between text-xs text-black"><a href="/" className="underline">Back to site</a><span>Admin access only</span></div>
          </div>
          <div className="relative hidden overflow-hidden rounded-[28px] md:block">
            <img src="/login-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </div>
      </div>
    );
  }

  const title = NAV.find(n => n[0] === tab)[1];
  return (
    <div className="flex min-h-screen bg-[#f4f5f7] text-black">
      <aside className="hidden w-64 shrink-0 flex-col bg-[#2f4cf5] text-white md:flex">
        <div className="flex h-16 items-center gap-3 bg-[#2f4cf5] px-6">
  <span className="text-lg font-bold text-white">VideoBay</span>
</div>
        <div className="m-5 rounded border border-white/30 px-4 py-3">
          <p className="truncate text-sm font-semibold">{u.email}</p><p className="text-xs text-white/70">Administrator</p>
        </div>
        <p className="px-6 pb-2 text-xs text-white/70">Main Menu</p>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={'flex w-full items-center justify-between rounded px-3 py-3 text-sm transition ' + (tab === k ? 'bg-white/20 font-semibold' : 'hover:bg-white/10')}>
              <span className="flex items-center gap-3"><span className="h-2 w-2 rounded-full border border-white" />{l}</span><span>&rsaquo;</span>
            </button>))}
        </nav>
        <a href="/" target="_blank" className="m-5 rounded border border-white/30 px-3 py-2 text-center text-sm hover:bg-white/10">View website</a>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between bg-[#2f4cf5] px-6 shadow-sm">
  <h1 className="text-lg font-semibold text-white">{title}</h1>
  <button
    onClick={() => signOut(auth)}
    className="rounded border border-white/40 px-4 py-1.5 text-sm text-white hover:bg-white/10"
  >
    Sign out
  </button>
</header>
        <div className="flex gap-2 overflow-x-auto bg-white px-4 py-2 md:hidden">
          {NAV.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={'whitespace-nowrap rounded px-3 py-1.5 text-sm ' + (tab === k ? 'bg-[#2f4cf5] text-white' : 'border text-black')}>{l}</button>)}
        </div>
        <main className="p-6">{({ stats: <Stats />, downloads: <Downloads />, visitors: <Visitors />, ads: <Ads />, content: <Content />, settings: <Settings user={u} /> })[tab]}</main>
      </div>
    </div>
  );
}