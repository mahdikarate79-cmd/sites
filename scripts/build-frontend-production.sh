#!/bin/bash
# Build static frontend for cPanel — https://x.venify.xyz
set -euo pipefail
cd "$(dirname "$0")/.."

OUT_DIR="dist-frontend"
ZIP_NAME="sheytoni-frontend-production.zip"

echo "==> Building Next.js static export (production API URL)..."
export NEXT_PUBLIC_API_URL="https://api.venify.xyz"
npm run build

echo "==> Preparing frontend package..."
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
cp -r out/. "$OUT_DIR/"

# SPA routing for cPanel Apache
cat > "$OUT_DIR/.htaccess" << 'EOF'
DirectoryIndex index.html
Options -Indexes

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
EOF

# Public assets not emitted by Next export
if [ -d public ]; then
  for f in public/*; do
    base=$(basename "$f")
    if [ ! -e "$OUT_DIR/$base" ]; then
      cp -r "$f" "$OUT_DIR/$base"
    fi
  done
fi

echo "==> Verifying build..."
test -f "$OUT_DIR/index.html" || { echo "ERROR: index.html missing"; exit 1; }
test -d "$OUT_DIR/_next" || { echo "ERROR: _next/ missing"; exit 1; }

if grep -rqE 'TELEGRAM_BOT_TOKEN|B2_KEY_ID|B2_APPLICATION_KEY|ADMIN_DEFAULT_PASSWORD|8948568241' "$OUT_DIR" 2>/dev/null; then
  echo "ERROR: Possible secrets found in frontend build!"
  exit 1
fi

echo "==> Creating $ZIP_NAME ..."
rm -f "$ZIP_NAME"
(cd "$OUT_DIR" && zip -r "../$ZIP_NAME" . -x "*.DS_Store")

echo ""
echo "✅ Frontend package ready: $ZIP_NAME"
echo "   Extract into: /home/venifybo/x.venify.xyz"
echo "   index.html and _next/ must be at document root."
