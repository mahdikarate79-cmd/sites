#!/bin/bash
# Builds site and fills deploy/ folder — ready to upload to host
set -e
cd "$(dirname "$0")/.."

echo "==> Building frontend..."
npm run build:prod

DEPLOY_DIR="deploy"
echo "==> Preparing $DEPLOY_DIR/ ..."

# Keep config files, remove old built assets
find "$DEPLOY_DIR" -mindepth 1 -maxdepth 1 \
  ! -name '.env' ! -name '.htaccess' ! -name 'package.json' \
  ! -name 'start.sh' ! -name 'README-FA.txt' ! -name '.gitignore' \
  -exec rm -rf {} +

# Flatten: site files at root (index.html visible to browser)
echo "==> Copying built site to deploy root..."
cp -r out/. "$DEPLOY_DIR/"

# Backend (no database — created on first run)
echo "==> Copying backend..."
rm -rf "$DEPLOY_DIR/backend"
mkdir -p "$DEPLOY_DIR/backend/data"
cp -r backend/*.mjs "$DEPLOY_DIR/backend/"
cp -r backend/database "$DEPLOY_DIR/backend/database"
touch "$DEPLOY_DIR/backend/data/.gitkeep"

# Public assets referenced by site
if [ -d public ]; then
  for f in public/*; do
    base=$(basename "$f")
    if [ ! -e "$DEPLOY_DIR/$base" ]; then
      cp -r "$f" "$DEPLOY_DIR/$base" 2>/dev/null || cp "$f" "$DEPLOY_DIR/$base"
    fi
  done
fi

chmod +x "$DEPLOY_DIR/start.sh"

echo "==> Done! Upload everything inside deploy/ to your host."
echo "    Or run: npm run package"
