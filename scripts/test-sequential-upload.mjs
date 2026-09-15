#!/usr/bin/env node
/** Test multiple sequential image uploads through storage API */
import http from "http";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const PORT = Number(process.env.UPLOAD_TEST_PORT ?? 38901);
const HOST = "127.0.0.1";

function makeJpeg(seed, size = 8000) {
  const header = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]);
  const body = Buffer.alloc(size, seed % 255);
  const end = Buffer.from([0xff, 0xd9]);
  return Buffer.concat([header, body, end]);
}

async function startServer() {
  process.env.PORT = String(PORT);
  process.env.AUTH_DEV_MODE = "true";
  process.env.NODE_ENV = "production";
  process.env.CORS_ORIGINS = `http://${HOST}:${PORT}`;
  process.env.SERVE_STATIC = "false";
  process.env.DATABASE_PATH = path.join(process.cwd(), "data/test-upload.db");
  process.env.ADMIN_DEFAULT_USERNAME = "t";
  process.env.ADMIN_DEFAULT_PASSWORD = "t";
  await import(`file://${path.join(process.cwd(), "backend/server.mjs")}`);
  await new Promise((r) => setTimeout(r, 1500));
}

function request(method, urlPath, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: HOST, port: PORT, path: urlPath, method, headers },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          let json = {};
          try { json = JSON.parse(raw); } catch { /* */ }
          resolve({ status: res.statusCode, json, raw });
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  await startServer();

  const auth = await request("POST", "/api/auth/telegram", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      initData: 'user={"id":999001,"first_name":"Test"}&auth_date=1700000000&hash=dev',
    }),
  });
  if (!auth.json.sessionToken) {
    console.error("Auth failed", auth);
    process.exit(1);
  }
  const token = auth.json.sessionToken;

  for (let i = 1; i <= 5; i++) {
    const buf = makeJpeg(i, 4000 + i * 500);
    const res = await request("POST", `/api/storage/upload/binary?category=post`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "image/jpeg",
        "Content-Length": String(buf.length),
      },
      body: buf,
    });
    if (res.status !== 200 || !res.json.objectKey) {
      console.error(`Upload ${i} FAILED`, res.status, res.json);
      process.exit(1);
    }
    const proxy = await request("GET", `/api/media/${encodeURIComponent(res.json.objectKey)}`);
    if (proxy.status !== 200 || proxy.raw.length < 100) {
      console.error(`Proxy ${i} FAILED`, proxy.status, proxy.raw.length);
      process.exit(1);
    }
    console.log(`Upload ${i} OK — ${res.json.objectKey} (${buf.length} → ${proxy.raw.length} bytes)`);
  }

  console.log("\n✅ All 5 sequential uploads passed");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
