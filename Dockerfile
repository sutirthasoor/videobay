FROM node:20-bookworm-slim AS b
WORKDIR /a
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y python3 ffmpeg curl ca-certificates && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp && rm -rf /var/lib/apt/lists/*
WORKDIR /a
COPY --from=b /a/.next/standalone ./
COPY --from=b /a/.next/static ./.next/static
COPY --from=b /a/public ./public
ENV PORT=8080 HOSTNAME=0.0.0.0 NODE_ENV=production
CMD ["node","server.js"]
