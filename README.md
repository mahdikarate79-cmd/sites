# Sheytoni

Modern social media platform — clean, minimal, and fast.

## Features

- **Feed** — X-style posts with text, images, and video
- **Telegram Stars Donate** — UI-ready donate modal with slider and top donators
- **Explore** — Search, trending, filters
- **Chat** — Messenger-style messaging with media support
- **Profile** — Cover, avatar, bio, followers, posts
- **Dark / Light Mode** — Minimal theme switching
- **Mobile First** — Responsive design with liquid glass bottom nav

## Tech Stack

- Next.js 16 (App Router, Static Export)
- React 19
- TypeScript
- Tailwind CSS 4

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build          # Local build
npm run build:gh-pages # GitHub Pages build (base path /sites)
```

## Architecture

- **API Layer** (`src/lib/api/`) — Ready for backend integration
- **Object Storage** (`src/lib/api/storage.ts`) — Cloudflare R2 architecture
- **Mock Data** (`src/data/mock/`) — Development data
- **Components** — Modular, reusable UI components

## Deployment

On push to `main`, GitHub Actions builds the site and publishes to the `gh-pages` branch.

### One-time setup

1. Go to **Settings → Pages** in the repository
2. Set **Source** to **Deploy from a branch**
3. Select branch: `gh-pages` / folder: `/ (root)`
4. Save

Live URL: https://mahdikarate79-cmd.github.io/sites/
