#!/bin/bash
# Build Node.js API package for cPanel — https://api.venify.xyz
set -euo pipefail
cd "$(dirname "$0")/.."

OUT_DIR="dist-backend"
ZIP_NAME="sheytoni-backend-production.zip"

echo "==> Preparing backend package..."
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR/lib" "$OUT_DIR/data"

# Copy backend modules (except server.mjs) into lib/
for f in backend/*.mjs; do
  base=$(basename "$f")
  if [ "$base" != "server.mjs" ]; then
    cp "$f" "$OUT_DIR/lib/"
  fi
done
cp -r backend/database "$OUT_DIR/lib/database"
touch "$OUT_DIR/data/.gitkeep"

# server.mjs at package root (cPanel startup file)
sed 's|from "./|from "./lib/|g' backend/server.mjs > "$OUT_DIR/server.mjs"

# package.json — production dependencies only
cat > "$OUT_DIR/package.json" << 'EOF'
{
  "name": "sheytoni-api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=18" },
  "dependencies": {
    "better-sqlite3": "^13.0.3"
  }
}
EOF

# .env.example for cPanel Environment Variables
cat > "$OUT_DIR/.env.example" << 'EOF'
NODE_ENV=production
PORT=
HOST=0.0.0.0

SITE_URL=https://x.venify.xyz
CORS_ORIGINS=https://x.venify.xyz
COOKIE_DOMAIN=.venify.xyz

TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=

B2_KEY_ID=
B2_APPLICATION_KEY=
B2_BUCKET_NAME=Sheytoni
B2_BUCKET_ID=

DATABASE_PATH=data/sheytoni.db

ADMIN_DEFAULT_USERNAME=
ADMIN_DEFAULT_PASSWORD=

SERVE_STATIC=false
EOF

echo "==> Verifying package structure..."
test -f "$OUT_DIR/server.mjs" || { echo "ERROR: server.mjs missing at root"; exit 1; }
test -f "$OUT_DIR/lib/config.mjs" || { echo "ERROR: lib/config.mjs missing"; exit 1; }

if grep -rqE '8948568241|0052f59d50d7ac20000000001|K005zlvRNoTjlRmN4f' "$OUT_DIR" 2>/dev/null; then
  echo "ERROR: Hardcoded secrets found in backend package!"
  exit 1
fi

echo "==> Creating $ZIP_NAME ..."
rm -f "$ZIP_NAME"
(cd "$OUT_DIR" && zip -r "../$ZIP_NAME" . -x "node_modules/*" "data/sheytoni.db*" "*.DS_Store")

echo ""
echo "✅ Backend package ready: $ZIP_NAME"
echo "   Extract into: /home/venifybo/api.venify.xyz"
echo "   Startup file: server.mjs"
echo "   Then: npm install && set Environment Variables in cPanel"
