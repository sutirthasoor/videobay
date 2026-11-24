export default function sitemap() {
  const s = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return ['', '/how-to', '/faq'].map((p, i) => ({ url: s + p, changeFrequency: 'weekly', priority: i ? 0.7 : 1 }));
}
