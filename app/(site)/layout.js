import Script from 'next/script';
import Link from 'next/link';
import Header from '@/components/Header';
import AdSlot from '@/components/AdSlot';
import Tracker from '@/components/Tracker';
export default function SiteLayout({ children }) {
  const pub = process.env.NEXT_PUBLIC_ADSENSE_ID;
  return (<>
    <Script src="https://www.googletagmanager.com/gtag/js?id=G-QP2Q9TJY86" strategy="afterInteractive" />
    <Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-QP2Q9TJY86');`}</Script>
    {pub && <Script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pub}`} crossOrigin="anonymous" strategy="afterInteractive" />}
    <Tracker />
    <Header />
    <div className="mx-auto max-w-6xl px-4"><AdSlot slot="header" /></div>
    {children}
    <div className="mx-auto max-w-6xl px-4"><AdSlot slot="footer" /></div>
    <footer className="mt-20 border-t bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 font-bold text-white">↓</span><span className="text-lg font-extrabold">VideoBay</span></div>
          <p className="mt-3 max-w-xs text-sm text-slate-500">Fast, free downloads of public videos as MP4 or MP3. No sign-up required.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Product</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/" className="hover:text-indigo-600">Downloader</Link></li>
            <li><Link href="/how-to" className="hover:text-indigo-600">How it works</Link></li>
            <li><Link href="/faq" className="hover:text-indigo-600">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Legal</h4>
          <p className="mt-3 text-sm text-slate-500">Only download content you own or have permission to save. VideoBay does not host content or bypass DRM or privacy restrictions.</p>
        </div>
      </div>
      <div className="border-t py-5 text-center text-xs text-slate-400 px-4">Not affiliated with YouTube, TikTok, Instagram, Facebook or X. © {new Date().getFullYear()} VideoBay.</div>
    </footer>
  </>);
}