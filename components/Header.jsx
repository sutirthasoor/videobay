'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const links = [['/', 'Home'], ['/how-to', 'How it works'], ['/faq', 'FAQ']];
export default function Header() {
  const path = usePathname(), [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-extrabold tracking-tight text-slate-900">VideoBay</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map(([h, t]) => (
            <Link key={h} href={h} className={'rounded-lg px-3 py-2 text-sm font-medium transition ' + (path === h ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}>{t}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/" className="hidden rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:block">Download now</Link>
          <button onClick={() => setOpen(!open)} aria-label="Menu" className="rounded-lg border px-3 py-2 text-sm md:hidden">{open ? '✕' : '☰'}</button>
        </div>
      </div>
      {open && (
        <div className="space-y-1 border-t bg-white px-4 py-3 md:hidden">
          {links.map(([h, t]) => (
            <Link key={h} href={h} onClick={() => setOpen(false)} className={'block rounded-lg px-3 py-2 text-sm font-medium ' + (path === h ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700')}>{t}</Link>
          ))}
        </div>
      )}
    </header>
  );
}