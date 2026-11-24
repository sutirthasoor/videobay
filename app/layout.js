import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
const font = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', weight: ['400', '500', '600', '700', '800'] });
const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const metadata = {
  metadataBase: new URL(site),
  title: { default: 'VideoBay – Free Online Video Downloader (MP4 & MP3)', template: '%s | VideoBay' },
  description: 'Download public videos from YouTube, TikTok, Instagram, Facebook and X as MP4 or MP3. Fast, free, no sign-up.',
  openGraph: { title: 'VideoBay – Free Video Downloader', description: 'Paste a link, pick a quality, download.', type: 'website' },
};
export default function RootLayout({ children }) {
  return (<html lang="en" className={font.className}><body>{children}</body></html>);
}