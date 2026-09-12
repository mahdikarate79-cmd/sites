import { deleteFromB2, isB2Configured } from "./b2.mjs";

const INACTIVE_DAYS = Number(process.env.MEDIA_INACTIVE_DAYS ?? 30);
const CHAT_MSG_LIMIT = Number(process.env.CHAT_MEDIA_MSG_LIMIT ?? 100);

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
