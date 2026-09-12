import crypto from "crypto";

export function createNotification(db, { userId, type, title, body, meta = {}, icon = "info" }) {
  if (!db.notifications) db.notifications = {};
  const id = `n_${crypto.randomBytes(8).toString("hex")}`;
  const n = {
    id,
    userId,
    type,
    title,
    body,
    icon,
    meta,
    read: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications[id] = n;
  return n;
}

export function getUserNotifications(db, userId) {
  return Object.values(db.notifications ?? {})
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function broadcastNotification(db, { type, title, body, icon = "info", meta = {} }) {
  const users = Object.values(db.users).filter((u) => !u.deleted && !u.banned);
  return users.map((u) => createNotification(db, { userId: u.id, type, title, body, icon, meta }));
}
