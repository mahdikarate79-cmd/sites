#!/bin/bash
# Test production backend package (Node 20 compatible)
set -euo pipefail
cd "$(dirname "$0")/.."

bash scripts/build-backend-production.sh

cd dist-backend
echo "==> npm install --production ..."
rm -rf node_modules package-lock.json
npm install --production

echo "==> Test better-sqlite3 load (createRequire) ..."
node --input-type=module -e "
import Database from './lib/database/sqlite.mjs';
const db = new Database(':memory:');
db.exec('SELECT 1');
db.close();
console.log('better-sqlite3 OK');
"

echo "==> Test server with PORT (standalone) ..."
PORT=39999 NODE_ENV=production HOST=0.0.0.0 \
  CORS_ORIGINS=https://x.venify.xyz SERVE_STATIC=false \
  DATABASE_PATH=data/test.db \
  ADMIN_DEFAULT_USERNAME=t ADMIN_DEFAULT_PASSWORD=t \
  node server.mjs &
PID=$!
sleep 2
HEALTH=$(curl -sf http://127.0.0.1:39999/api/health || echo FAIL)
kill $PID 2>/dev/null || true
wait $PID 2>/dev/null || true

if echo "$HEALTH" | grep -q '"ok":true'; then
  echo "Health check OK: $HEALTH"
else
  echo "Health check FAILED: $HEALTH"
  exit 1
fi

echo ""
echo "✅ All production backend tests passed"
