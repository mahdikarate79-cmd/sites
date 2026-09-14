import fs from "fs";
import path from "path";
import { config } from "./config.mjs";

function mediaRoot() {
  const dbPath = config.dbPath;
  const base = path.isAbsolute(dbPath)
    ? path.dirname(dbPath)
    : path.join(process.cwd(), path.dirname(dbPath));
  return path.join(base, "media");
}

function safeKey(objectKey) {
  const normalized = String(objectKey).replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.includes("..")) throw new Error("Invalid object key");
  return normalized;
}

export function saveLocalMedia(objectKey, buffer, contentType) {
  const key = safeKey(objectKey);
  const filePath = path.join(mediaRoot(), key);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
  const metaPath = `${filePath}.meta.json`;
  fs.writeFileSync(metaPath, JSON.stringify({ contentType, size: buffer.length }));
  return { objectKey: key, size: buffer.length, contentType, storage: "local" };
}

export function readLocalMedia(objectKey) {
  const key = safeKey(objectKey);
  const filePath = path.join(mediaRoot(), key);
  if (!fs.existsSync(filePath)) return null;
  const metaPath = `${filePath}.meta.json`;
  let contentType = "application/octet-stream";
  if (fs.existsSync(metaPath)) {
    try {
      contentType = JSON.parse(fs.readFileSync(metaPath, "utf8")).contentType ?? contentType;
    } catch { /* */ }
  }
  return { buffer: fs.readFileSync(filePath), contentType, storage: "local" };
}

export function localMediaRoot() {
  return mediaRoot();
}

export function isLocalMediaAvailable() {
  try {
    const root = mediaRoot();
    fs.mkdirSync(root, { recursive: true });
    fs.accessSync(root, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}
