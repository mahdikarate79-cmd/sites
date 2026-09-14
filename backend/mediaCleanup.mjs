import fs from "fs";
import path from "path";
import { deleteFromB2, isB2Configured } from "./b2.mjs";
import { localMediaRoot } from "./localMedia.mjs";

const INACTIVE_DAYS = Number(process.env.MEDIA_INACTIVE_DAYS ?? 30);
const CHAT_MSG_LIMIT = Number(process.env.CHAT_MEDIA_MSG_LIMIT ?? 100);

function safeKey(objectKey) {
  const normalized = String(objectKey).replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.includes("..")) return null;
  return normalized;
}

export function deleteLocalMedia(objectKey) {
  const key = safeKey(objectKey);
  if (!key) return false;
  const filePath = path.join(localMediaRoot(), key);
  const metaPath = `${filePath}.meta.json`;
  let removed = false;
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    removed = true;
  }
  if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
  return removed;
}

export async function deleteMediaObject(db, mediaItem) {
  if (!mediaItem?.objectKey) return false;
  const meta = db.mediaObjects?.[mediaItem.objectKey];
  let removed = false;

  if (meta?.storage === "local" || !isB2Configured()) {
    removed = deleteLocalMedia(mediaItem.objectKey) || removed;
  }

  if (isB2Configured() && meta?.fileId && meta?.fileName) {
    try {
      await deleteFromB2(meta.fileId, meta.fileName);
      removed = true;
    } catch (e) {
      console.error("B2 delete failed:", mediaItem.objectKey, e.message);
    }
  }

  delete db.mediaObjects[mediaItem.objectKey];
  return removed;
}

export async function deletePostMedia(db, post) {
  let removed = 0;
  for (const m of post?.media ?? []) {
    if (await deleteMediaObject(db, m)) removed++;
    m.expired = true;
    m.url = null;
    m.objectKey = null;
  }
  if (post) post.mediaExpired = true;
  return removed;
}

export async function cleanupInactivePostMedia(db) {
  if (!isB2Configured()) return { removed: 0 };
  const cutoff = Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000;
  let removed = 0;

  for (const user of Object.values(db.users)) {
    if (user.deleted) continue;
    const lastActive = new Date(user.lastActiveAt ?? user.createdAt).getTime();
    if (lastActive > cutoff) continue;

    for (const post of Object.values(db.posts ?? {})) {
      if (post.authorId !== user.id || post.mediaExpired) continue;
      for (const m of post.media ?? []) {
        if (m.fileId && m.fileName) {
          try {
            await deleteFromB2(m.fileId, m.fileName);
            removed++;
          } catch { /* log in production */ }
        }
        m.expired = true;
        m.url = null;
      }
      post.mediaExpired = true;
    }
  }
  return { removed };
}

export async function cleanupOldChatMedia(db) {
  if (!isB2Configured()) return { removed: 0 };
  let removed = 0;

  for (const chat of Object.values(db.chats ?? {})) {
    const msgs = (chat.messages ?? []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (msgs.length <= CHAT_MSG_LIMIT) continue;
    const toClean = msgs.slice(0, msgs.length - CHAT_MSG_LIMIT);
    for (const msg of toClean) {
      if (!msg.objectKey || msg.mediaExpired) continue;
      const meta = db.mediaObjects?.[msg.objectKey];
      if (meta?.fileId && meta?.fileName) {
        try {
          await deleteFromB2(meta.fileId, meta.fileName);
          removed++;
        } catch { /* ignore */ }
      }
      msg.mediaExpired = true;
      msg.url = null;
    }
  }
  return { removed };
}

export function startCleanupScheduler(dbRef, saveDb) {
  const intervalMs = Number(process.env.MEDIA_CLEANUP_INTERVAL_MS ?? 6 * 60 * 60 * 1000);
  const run = async () => {
    const db = dbRef();
    const a = await cleanupInactivePostMedia(db);
    const b = await cleanupOldChatMedia(db);
    saveDb(db);
    if (a.removed + b.removed > 0) {
      console.log(`Media cleanup: posts=${a.removed}, chat=${b.removed}`);
    }
  };
  setInterval(run, intervalMs);
  setTimeout(run, 60_000);
}
