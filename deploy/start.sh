#!/bin/bash
set -e
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Error: .env file missing"
  exit 1
fi

set -a
source .env
set +a

if [ ! -d node_modules ]; then
  echo "Installing server dependencies..."
  npm install --omit=dev
fi

echo "Starting Sheytoni on port ${PORT:-3000}..."
exec node backend/server.mjs
