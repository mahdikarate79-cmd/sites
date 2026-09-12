#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "Building production frontend..."
npm run build:prod

ZIP_NAME="sheytoni-deploy.zip"
rm -f "$ZIP_NAME"

echo "Creating $ZIP_NAME ..."
zip -r "$ZIP_NAME" \
  backend \
  out \
  public \
  package.json \
  package-lock.json \
  start.sh \
  .env \
  DEPLOY.md \
  -x "backend/data/store.json" "backend/data/sheytoni.db*" "*/node_modules/*" "*/.git/*"

echo "Done: $ZIP_NAME"
echo "Upload to your host, extract into x.venify.xyz folder, then run: chmod +x start.sh && ./start.sh"
