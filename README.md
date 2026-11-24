# VideoBay
Next.js 14 + Tailwind + Firebase (Firestore/Auth) + yt-dlp/ffmpeg.
## Run locally
1. Install yt-dlp + ffmpeg (`pip install yt-dlp`, `apt install ffmpeg`), Node 20.
2. `cp .env.example .env.local` → set values. `npm install && npm run dev`
## Firebase setup
- Console → Authentication → enable Email/Password → add your admin user.
- Firestore → create DB → paste `firestore.rules` (replace ADMIN_EMAIL_HERE).
- Firestore index: none needed. Analytics: GA4 ID G-QP2Q9TJY86 is in layout.js.
## Deploy (needs a server that can run binaries — NOT Vercel/Firebase Functions)
`docker build -t videobay . && docker run -p 8080:8080 videobay` on a VPS, or Google Cloud Run.
Update yt-dlp daily (cron: `yt-dlp -U`) — platforms change often and extraction breaks without updates.
## Admin: /admin (stats, ads, content)
## Compliance: only public videos; private/DRM/live rejected; no cookies or login bypass. Add Terms/DMCA pages before launch.
## Known limits: download-log writes are client-SDK based (spoofable); use firebase-admin + service account for stricter stats.
