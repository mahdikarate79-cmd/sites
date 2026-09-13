#!/bin/bash
# Build Node.js API package for cPanel — https://api.venify.xyz
set -euo pipefail
cd "$(dirname "$0")/.."

OUT_DIR="dist-backend"
ZIP_NAME="sheytoni-backend-production.zip"

echo "==> Preparing backend package..."
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR/lib" "$OUT_DIR/data"

# All backend modules (including server.mjs) live in lib/ — relative imports unchanged
for f in backend/*.mjs; do
  base=$(basename "$f")
  if [ "$base" = "cpanel-entry.mjs" ]; then continue; fi
  cp "$f" "$OUT_DIR/lib/"
done
cp -r backend/database "$OUT_DIR/lib/database"
touch "$OUT_DIR/data/.gitkeep"

# cPanel startup file at package root
cp backend/cpanel-entry.mjs "$OUT_DIR/server.mjs"

cat > "$OUT_DIR/package.json" << 'EOF'
{
  "name": "sheytoni-api",
  "version": "1.0.3",
  "private": true,
  "type": "module",
  "engines": { "node": ">=18 <=22" },
  "scripts": {
    "start": "node server.mjs"
  },
  "dependencies": {
    "better-sqlite3": "11.8.1"
  }
}
EOF

cat > "$OUT_DIR/.npmrc" << 'EOF'
engine-strict=false
EOF

cat > "$OUT_DIR/.env.example" << 'EOF'
NODE_ENV=production
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
test -f "$OUT_DIR/lib/server.mjs" || { echo "ERROR: lib/server.mjs missing"; exit 1; }
test -f "$OUT_DIR/lib/listen.mjs" || { echo "ERROR: lib/listen.mjs missing"; exit 1; }
test -f "$OUT_DIR/lib/database/sqlite.mjs" || { echo "ERROR: lib/database/sqlite.mjs missing"; exit 1; }

if grep -q './config.mjs' "$OUT_DIR/server.mjs"; then
  echo "ERROR: root server.mjs must not import ./config.mjs"
  exit 1
fi

if grep -rqE '8948568241|0052f59d50d7ac20000000001|K005zlvRNoTjlRmN4f' "$OUT_DIR" 2>/dev/null; then
  echo "ERROR: Hardcoded secrets found in backend package!"
  exit 1
fi

echo "==> Creating $ZIP_NAME ..."
rm -f "$ZIP_NAME"
(cd "$OUT_DIR" && zip -r "../$ZIP_NAME" . \
  -x "node_modules/*" "data/sheytoni.db*" "*.DS_Store" "tmp/*" "public/*")

echo ""
echo "✅ Backend package ready: $ZIP_NAME"
echo "   Run: bash scripts/test-backend-production.sh"
