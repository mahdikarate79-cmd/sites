#!/bin/bash
set -e
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Missing .env file"
  exit 1
fi

export $(grep -v '^#' .env | xargs)

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install --omit=dev
fi

if [ ! -d out ]; then
  echo "Building frontend..."
  npm run build:prod
fi

echo "Starting Sheytoni on port ${PORT:-3000}..."
exec node backend/server.mjs
