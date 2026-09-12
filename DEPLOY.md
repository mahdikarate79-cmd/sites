# Sheytoni — Deploy on x.venify.xyz

## Quick start (one command)

1. Upload `sheytoni-deploy.zip` to your host
2. Extract into the subdomain folder (e.g. `public_html/x.venify.xyz`)
3. Run:

```bash
chmod +x start.sh
./start.sh
```

The server serves both the website and API on the same port (default `3000`).

## Node.js on cPanel

1. Setup Node.js App → Application root = your folder
2. Application startup file: `backend/server.mjs`
3. Or use `start.sh` as startup command
4. Set environment variables from `.env` in the panel (or keep `.env` in folder)

## Telegram webhook

Set bot webhook to:

```
https://x.venify.xyz/api/telegram/webhook
```

With secret token matching `TELEGRAM_WEBHOOK_SECRET` in `.env`.

## Database

Data is stored in `backend/data/store.json` (JSON file). Lightweight, no MySQL required.

## Build zip locally

```bash
npm run package
```
