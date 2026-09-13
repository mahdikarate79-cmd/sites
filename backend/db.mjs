import crypto from "crypto";
import { loadDb, saveDb } from "./database/store.mjs";
import { getDatabase } from "./database/init.mjs";

export { loadDb, saveDb };

const DELETE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function findUserByTelegramId(db, telegramId) {
  const r = getDatabase().prepare("SELECT * FROM users WHERE telegram_id = ? AND deleted = 0").get(telegramId);
  return r ? rowToUser(r) : null;
}

export function findUserByTelegramIdIncludingDeleted(db, telegramId) {
  const r = getDatabase().prepare("SELECT * FROM users WHERE telegram_id = ?").get(telegramId);
  return r ? rowToUser(r) : null;
}

export function getDeletionCooldown(user) {
  if (!user?.deleted || !user.deletedAt) return null;
  const canRecreateAt = new Date(user.deletedAt).getTime() + DELETE_COOLDOWN_MS;
  const remainingMs = canRecreateAt - Date.now();
  if (remainingMs <= 0) return null;
  return { canRecreateAt: new Date(canRecreateAt).toISOString(), remainingMs };
}

export function purgeDeletedUser(db, userId) {
  const sqlite = getDatabase();
  sqlite.prepare("DELETE FROM users WHERE id = ?").run(userId);
  sqlite.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  delete db.users[userId];
  for (const sid of Object.keys(db.sessions ?? {})) {
    if (db.sessions[sid].userId === userId) delete db.sessions[sid];
  }
  db.deletedUserIds = (db.deletedUserIds ?? []).filter((id) => id !== userId);
}

export function findUserByUsername(db, username) {
  const lower = String(username).toLowerCase();
  const r = getDatabase().prepare("SELECT * FROM users WHERE lower(username) = ? AND deleted = 0").get(lower);
  return r ? rowToUser(r) : null;
}

export function findUserById(db, id) {
  const r = getDatabase().prepare("SELECT * FROM users WHERE id = ? AND deleted = 0").get(id);
  return r ? rowToUser(r) : null;
}

export function usernameAvailable(db, username) {
  const lower = username.toLowerCase();
  const sqlite = getDatabase();
  if (sqlite.prepare("SELECT 1 FROM reserved_usernames WHERE username = ?").get(lower)) return false;
  return !sqlite.prepare("SELECT 1 FROM users WHERE lower(username) = ? AND deleted = 0").get(lower);
}

export function createUserFromTelegram(db, tgUser) {
  const id = `tg_${tgUser.id}`;
  // Sheytoni profile is independent from Telegram name/username/photo
  const displayName = "User";
  return {
    id,
    telegramId: tgUser.id,
    username: null,
    displayName,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${tgUser.id}`,
    verified: false,
    premium: false,
    banned: false,
    starBalance: 0,
    earnings: 0,
    followers: 0,
    fakeFollowers: 0,
    following: 0,
    postsCount: 0,
    loginMethod: "telegram",
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    deleted: false,
    verificationRequestPending: false,
    usernameSet: false,
  };
}

export function userHasUsername(user) {
  return !!(user?.username && String(user.username).trim());
}

export function touchUserActivity(db, userId) {
  getDatabase().prepare("UPDATE users SET last_active_at = ? WHERE id = ?").run(new Date().toISOString(), userId);
  const user = db.users?.[userId];
  if (user) user.lastActiveAt = new Date().toISOString();
}

export function createSession(userId, telegramId) {
  return {
    id: crypto.randomBytes(32).toString("hex"),
    userId,
    telegramId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
}

export function deleteSessionsForUser(db, userId) {
  getDatabase().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  for (const sid of Object.keys(db.sessions ?? {})) {
    if (db.sessions[sid].userId === userId) delete db.sessions[sid];
  }
}

export function deleteSessionsExcept(db, keepSessionId) {
  getDatabase().prepare("DELETE FROM sessions WHERE id != ?").run(keepSessionId);
  for (const sid of Object.keys(db.sessions ?? {})) {
    if (sid !== keepSessionId) delete db.sessions[sid];
  }
}

export function deleteAccount(db, userId) {
  const user = db.users[userId];
  if (!user) return false;
  user.deleted = true;
  user.deletedAt = new Date().toISOString();
  if (user.username) {
    const lower = user.username.toLowerCase();
    if (!db.reservedUsernames.includes(lower)) db.reservedUsernames.push(lower);
    const sqlite = getDatabase();
    sqlite.prepare("INSERT OR IGNORE INTO reserved_usernames VALUES (?)").run(lower);
  }
  if (!db.deletedUserIds.includes(userId)) db.deletedUserIds.push(userId);
  deleteSessionsForUser(db, userId);
  return true;
}

export function resolveUserLookup(db, query) {
  if (!query) return null;
  const s = String(query).trim().replace(/^@/, "");
  if (!s) return null;
  if (/^\d+$/.test(s)) {
    return findUserByTelegramId(db, Number(s)) ?? findUserById(db, `tg_${s}`) ?? findUserById(db, s);
  }
  return findUserByUsername(db, s) ?? findUserById(db, s);
}

export function isPostUnlocked(db, userId, postId) {
  return !!(db.unlockedPosts?.[userId]?.[postId]);
}

export function unlockPost(db, userId, postId) {
  if (!db.unlockedPosts) db.unlockedPosts = {};
  if (!db.unlockedPosts[userId]) db.unlockedPosts[userId] = {};
  db.unlockedPosts[userId][postId] = { unlockedAt: new Date().toISOString() };
}

export function isDeletedUserId(db, userId) {
  return db.deletedUserIds.includes(userId);
}

export function publicUser(user) {
  if (!user) return null;
  const premiumActive = user.premium && (!user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date());
  return {
    id: user.id,
    username: user.username ?? null,
    displayName: user.displayName,
    usernameSet: !!user.usernameSet,
    avatar: user.avatar,
    cover: user.cover,
    bio: user.bio,
    verified: user.verified,
    premium: premiumActive,
    banned: !!user.banned,
    starBalance: user.starBalance ?? 0,
    earnings: user.earnings ?? 0,
    followers: (user.followers ?? 0) + (user.fakeFollowers ?? 0),
    following: user.following ?? 0,
    realFollowers: user.followers ?? 0,
    fakeFollowers: user.fakeFollowers ?? 0,
    postsCount: user.postsCount ?? 0,
    loginMethod: user.loginMethod ?? "telegram",
    verificationRequestPending: !!user.verificationRequestPending,
    telegramId: user.telegramId,
  };
}

function rowToUser(r) {
  return {
    id: r.id,
    telegramId: r.telegram_id,
    username: r.username,
    displayName: r.display_name,
    avatar: r.avatar,
    cover: r.cover,
    bio: r.bio,
    verified: !!r.verified,
    premium: !!r.premium,
    premiumExpiresAt: r.premium_expires_at,
    banned: !!r.banned,
    bannedAt: r.banned_at,
    starBalance: r.star_balance,
    earnings: r.earnings,
    followers: r.followers,
    fakeFollowers: r.fake_followers ?? 0,
    following: r.following,
    postsCount: r.posts_count,
    loginMethod: r.login_method,
    createdAt: r.created_at,
    lastActiveAt: r.last_active_at,
    deleted: !!r.deleted,
    deletedAt: r.deleted_at,
    verificationRequestPending: !!r.verification_request_pending,
    usernameSet: !!r.username_set,
  };
}
