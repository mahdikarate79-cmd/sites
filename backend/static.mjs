import fs from "fs";
import path from "path";

import { config } from "./config.mjs";

const STATIC_DIR = path.isAbsolute(config.staticDir)
  ? config.staticDir
  : path.join(process.cwd(), config.staticDir);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function resolveFile(urlPath) {
  const safe = urlPath.replace(/\.\./g, "").replace(/^\//, "");
  let filePath = path.join(STATIC_DIR, safe);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return filePath;

  if (!path.extname(safe)) {
    const withIndex = path.join(STATIC_DIR, safe, "index.html");
    if (fs.existsSync(withIndex)) return withIndex;
    const htmlFile = path.join(STATIC_DIR, `${safe}.html`);
    if (fs.existsSync(htmlFile)) return htmlFile;
  }

  const fallback = path.join(STATIC_DIR, "index.html");
  if (fs.existsSync(fallback)) return fallback;
  return null;
}

export function serveStatic(req, res) {
  if (!req.url || req.url.startsWith("/api")) return false;

  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  const filePath = resolveFile(urlPath === "/" ? "/index.html" : urlPath);
  if (!filePath) return false;

  const ext = path.extname(filePath);
  res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

export function staticDirExists() {
  return fs.existsSync(STATIC_DIR);
}
