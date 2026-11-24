'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const DEFAULTS = {
  siteName: 'VideoBay',
  announcement: '',
  footerText: 'Only download content you own or have permission to save. VideoBay does not host content or bypass DRM or privacy restrictions.',
  home: {
    badge: 'Free · No sign-up · MP4 & MP3',
    title: 'Free Online Video Downloader',
    sub: 'Paste a link from YouTube, TikTok, Instagram, Facebook or X and download public videos as MP4 or MP3.',
    showPlatforms: true, platforms: ['YouTube', 'TikTok', 'Instagram', 'Facebook', 'X (Twitter)'],
    showStats: true, stats: [{ n: '5', l: 'Platforms' }, { n: 'MP4', l: 'Up to best quality' }, { n: 'MP3', l: 'Audio extraction' }, { n: '0', l: 'Sign-ups needed' }],
    showFeatures: true, featuresBadge: 'Features', featuresTitle: "Everything you need, nothing you don't", featuresSub: 'A fast, clean downloader that works on every device.',
    features: [
      { t: 'Fast processing', d: 'Optimized server-side processing gets your file ready in seconds.' },
      { t: 'Multiple qualities', d: 'Choose from the MP4 qualities available for each video.' },
      { t: 'MP3 extraction', d: 'Save just the audio as a high-quality MP3 where permitted.' },
      { t: 'Works everywhere', d: 'Fully responsive. Use it on phone, tablet or desktop.' },
      { t: 'Private by design', d: 'No accounts and no stored videos. Files are deleted after delivery.' },
      { t: 'Completely free', d: 'No sign-up, no watermarks, no hidden limits on normal use.' }],
    showSteps: true, stepsBadge: 'How it works', stepsTitle: 'Download in 3 simple steps',
    showFaq: true, faqBadge: 'FAQ', faqTitle: 'Questions? Answers.', faqCount: 3,
    showCta: true, ctaTitle: 'Ready to download your first video?', ctaSub: 'Paste a link and get your MP4 or MP3 in seconds. Free, fast and no sign-up.', ctaButton: 'Start downloading',
  },
  steps: [
    { t: 'Copy the link', d: 'Open the video on YouTube, TikTok, Instagram, Facebook or X and copy its URL.' },
    { t: 'Paste it in', d: 'Paste the link into the box on the homepage and press Download.' },
    { t: 'Choose a format', d: 'Pick an MP4 quality or MP3 audio and save the file to your device.' }],
  howto: {
    badge: 'Guide', title: 'How to use VideoBay', sub: 'Download any public video in under a minute. No account needed.', tipsTitle: 'Tips for best results',
    tips: [
      { t: 'Use the full link', d: 'Copy the URL from the address bar or the Share button. Short links like youtu.be also work.' },
      { t: 'Pick the right quality', d: 'Higher resolutions make larger files. Choose 360p or 720p for quick mobile downloads.' },
      { t: 'Need only the audio?', d: 'Choose MP3 to save the soundtrack without the video.' },
      { t: 'Public videos only', d: 'Private, deleted, live and protected videos cannot be downloaded.' }],
  },
  faqPage: { badge: 'Help center', title: 'Frequently asked questions', sub: 'Everything you need to know about downloading with VideoBay.' },
  faqs: [
    { q: 'Is it free?', a: 'Yes, VideoBay is free to use with no sign-up.' },
    { q: 'Which sites are supported?', a: 'YouTube, TikTok, Instagram, Facebook and X (Twitter).' },
    { q: 'Can I download private or DRM-protected videos?', a: 'No. Only publicly available videos can be processed. We do not bypass DRM or access restrictions.' },
    { q: 'Is downloading legal?', a: "Only download content you own or have permission to save. You are responsible for respecting copyright and each platform's terms." },
    { q: 'Why is my video not found?', a: 'The video may be private, deleted, age/region restricted, or a live stream.' }],
};
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
export const merge = (d, s) => { const o = { ...d }; for (const k in s) o[k] = isObj(d[k]) && isObj(s[k]) ? merge(d[k], s[k]) : s[k]; return o; };
let cache;
export const loadContent = force => { if (!cache || force) cache = getDoc(doc(db, 'content', 'site')).then(s => (s.exists() ? merge(DEFAULTS, s.data()) : DEFAULTS)).catch(() => DEFAULTS); return cache; };
export function useContent() { const [c, setC] = useState(DEFAULTS); useEffect(() => { loadContent().then(setC); }, []); return c; }
export const SiteName = () => useContent().siteName;
export const FooterText = () => useContent().footerText;

function SectionHead({ badge, title, sub }) {
  return (<div className="mx-auto mb-10 max-w-2xl text-center">
    {badge && <span className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-black">{badge}</span>}
    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-black sm:text-4xl">{title}</h2>
    {sub && <p className="mt-3 text-black">{sub}</p>}</div>);
}
function Cards({ items, num }) {
  return (<div className="mx-auto grid max-w-6xl gap-5 px-4 sm:grid-cols-2 lg:grid-cols-3">
    {items.map((x, i) => (<div key={i} className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-black">{String(i + 1).padStart(2, '0')}</div>
      <h3 className="font-bold text-black">{x.t}</h3><p className="mt-1 text-sm text-black">{x.d}</p></div>))}</div>);
}
function Steps({ items }) {
  return (<div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
    {items.map((x, i) => (<div key={i} className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-black font-bold text-white">{i + 1}</div>
      <h3 className="font-bold text-black">{x.t}</h3><p className="mt-1 text-sm text-black">{x.d}</p></div>))}</div>);
}
function FaqList({ list, more, schema }) {
  return (<div className="mx-auto max-w-3xl px-4"><div className="space-y-3">
    {list.map((f, i) => (<details key={i} className="group rounded-2xl border bg-white p-5 shadow-sm open:ring-1 open:ring-black/20">
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-black">{f.q}<span className="ml-4 transition group-open:rotate-45">+</span></summary>
      <p className="mt-3 text-sm leading-relaxed text-black">{f.a}</p></details>))}</div>
    {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: list.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }) }} />}
    {more && <div className="mt-6 text-center"><Link href="/faq" className="text-sm font-semibold text-black underline">View all questions</Link></div>}</div>);
}
function Cta({ h }) {
  return (<section className="mx-auto mt-24 max-w-6xl px-4"><div className="rounded-3xl bg-slate-100 px-6 py-14 text-center shadow-sm">
    <h2 className="text-3xl font-extrabold text-black sm:text-4xl">{h.ctaTitle}</h2><p className="mx-auto mt-3 max-w-xl text-black">{h.ctaSub}</p>
    <Link href="/" className="mt-7 inline-block rounded-xl bg-black px-7 py-3 font-bold text-white shadow transition hover:bg-slate-800">{h.ctaButton}</Link></div></section>);
}
function PageHero({ badge, title, sub }) {
  return (<section className="bg-gradient-to-b from-slate-100 via-white to-white"><div className="mx-auto max-w-3xl px-4 pb-12 pt-14 text-center">
    <span className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-black shadow-sm">{badge}</span>
    <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-black sm:text-5xl">{title}</h1><p className="mt-4 text-lg text-black">{sub}</p></div></section>);
}

export function Home({ children }) {
  const c = useContent(), h = c.home;
  return (<main>
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-100 via-white to-white"><div className="mx-auto max-w-4xl px-4 pb-16 pt-14 sm:pt-20">
      <div className="text-center">
        <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-black shadow-sm">{h.badge}</span>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-black sm:text-6xl">{h.title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-black">{h.sub}</p></div>
      {children}
      {h.showPlatforms && <div className="mt-8 text-center"><p className="text-xs font-semibold uppercase tracking-wider text-black">Works with</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">{h.platforms.map((p, i) => <span key={i} className="rounded-full border bg-white px-4 py-1.5 text-sm font-medium text-black shadow-sm">{p}</span>)}</div></div>}
    </div></section>
    {h.showStats && <section className="px-4 pb-4"><div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 rounded-2xl border bg-white p-6 shadow-sm sm:grid-cols-4">
      {h.stats.map((s, i) => <div key={i} className="text-center"><p className="text-3xl font-extrabold text-black">{s.n}</p><p className="text-sm text-black">{s.l}</p></div>)}</div></section>}
    {h.showFeatures && <section className="mt-24"><SectionHead badge={h.featuresBadge} title={h.featuresTitle} sub={h.featuresSub} /><Cards items={h.features} /></section>}
    {h.showSteps && <section className="mt-24"><SectionHead badge={h.stepsBadge} title={h.stepsTitle} /><Steps items={c.steps} /></section>}
    {h.showFaq && <section className="mt-24"><SectionHead badge={h.faqBadge} title={h.faqTitle} /><FaqList list={c.faqs.slice(0, Number(h.faqCount) || 3)} more /></section>}
    {h.showCta && <Cta h={h} />}
  </main>);
}
export function HowToPage() {
  const c = useContent(), w = c.howto;
  return (<main><PageHero badge={w.badge} title={w.title} sub={w.sub} /><Steps items={c.steps} />
    <section className="mt-20"><SectionHead title={w.tipsTitle} /><div className="mx-auto grid max-w-6xl gap-5 px-4 sm:grid-cols-2">
      {w.tips.map((x, i) => <div key={i} className="rounded-2xl border bg-white p-6 shadow-sm"><h3 className="font-bold text-black">{x.t}</h3><p className="mt-1 text-sm text-black">{x.d}</p></div>)}</div></section>
    <Cta h={c.home} /></main>);
}
export function FaqPage() {
  const c = useContent(), p = c.faqPage;
  return (<main><PageHero badge={p.badge} title={p.title} sub={p.sub} /><FaqList list={c.faqs} schema /><Cta h={c.home} /></main>);
}