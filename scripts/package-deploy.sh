#!/bin/bash
set -e
cd "$(dirname "$0")/.."

bash scripts/prepare-deploy.sh

ZIP_NAME="sheytoni-deploy.zip"
rm -f "$ZIP_NAME"

echo "Creating $ZIP_NAME ..."
cd deploy
zip -r "../$ZIP_NAME" . \
  -x "node_modules/*" "backend/data/sheytoni.db*" "*.git/*"

cd ..
echo ""
echo "✅ Ready: $ZIP_NAME"
echo "   Upload to x.venify.xyz, extract, then setup Node.js App in cPanel"
echo "   Startup file: backend/server.mjs"
