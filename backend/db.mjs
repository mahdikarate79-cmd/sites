import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "backend", "data");
const DB_FILE = path.join(DATA_DIR, "store.json");

const DEFAULT_DB = {
  users: {},
  sessions: {},
  reservedUsernames: [],
  deletedUserIds: [],
  posts: {},
  notifications: {},
  verificationRequests: [],
  withdrawalRequests: [],
  bannedUsers: {},
  mediaObjects: {},
  paymentIntents: {},
  chats: {},
  adminSessions: {},
  settings: { verificationMinFollowers: 10000 },
};

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
  }
}

export function loadDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

export function saveDb(db) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export function findUserByTelegramId(db, telegramId) {
  return Object.values(db.users).find((u) => u.telegramId === telegramId && !u.deleted);
}

export function findUserByUsername(db, username) {
  const lower = String(username).toLowerCase();
  return Object.values(db.users).find((u) => u.username?.toLowerCase() === lower && !u.deleted);
}

export function findUserById(db, id) {
  const user = db.users[id];
  if (!user || user.deleted) return null;
  return user;
}

export function usernameAvailable(db, username) {
  const lower = username.toLowerCase();
  if (db.reservedUsernames.includes(lower)) return false;
  return !Object.values(db.users).some((u) => u.username?.toLowerCase() === lower && !u.deleted);
}

export function createUserFromTelegram(db, tgUser) {
  const id = `tg_${tgUser.id}`;
  const displayName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || "User";
  return {
    id,
    telegramId: tgUser.id,
    username: null,
    displayName,
    avatar: tgUser.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tgUser.id}`,
    verified: false,
    premium: false,
    banned: false,
    starBalance: 0,
    earnings: 0,
    followers: 0,
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
  const user = db.users[userId];
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
  for (const [sid, session] of Object.entries(db.sessions)) {
    if (session.userId === userId) delete db.sessions[sid];
  }
}

export function deleteSessionsExcept(db, keepSessionId) {
  for (const sid of Object.keys(db.sessions)) {
    if (sid !== keepSessionId) delete db.sessions[sid];
  }
}

export function deleteAccount(db, userId) {
  const user = db.users[userId];
  if (!user) return false;

  user.deleted = true;
  user.deletedAt = new Date().toISOString();
  if (user.username) db.reservedUsernames.push(user.username.toLowerCase());
  if (!db.deletedUserIds.includes(userId)) db.deletedUserIds.push(userId);

  deleteSessionsForUser(db, userId);
  return true;
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
    followers: user.followers ?? 0,
    following: user.following ?? 0,
    postsCount: user.postsCount ?? 0,
    loginMethod: user.loginMethod ?? "telegram",
    verificationRequestPending: !!user.verificationRequestPending,
    telegramId: user.telegramId,
  };
}
