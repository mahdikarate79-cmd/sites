import fs from "fs";
import path from "path";

const JSON_STORE_CANDIDATES = [
  path.join(process.cwd(), "data", "store.json"),
  path.join(process.cwd(), "backend", "data", "store.json"),
];

/** One-time import from legacy store.json — data survives code/domain updates */
export function importJsonStoreIfNeeded(sqlite) {
  const count = sqlite.prepare("SELECT COUNT(*) as c FROM users").get().c;
  const jsonStore = JSON_STORE_CANDIDATES.find((p) => fs.existsSync(p));
  if (count > 0 || !jsonStore) return;

  console.log("Migrating legacy store.json → SQLite...");
  const legacy = JSON.parse(fs.readFileSync(jsonStore, "utf8"));

  const insertUser = sqlite.prepare(`
    INSERT OR REPLACE INTO users (
      id, telegram_id, username, display_name, avatar, cover, bio, verified, premium,
      premium_expires_at, banned, banned_at, star_balance, earnings, followers, following,
      posts_count, login_method, created_at, last_active_at, deleted, deleted_at,
      verification_request_pending, username_set
    ) VALUES (
      @id, @telegramId, @username, @displayName, @avatar, @cover, @bio, @verified, @premium,
      @premiumExpiresAt, @banned, @bannedAt, @starBalance, @earnings, @followers, @following,
      @postsCount, @loginMethod, @createdAt, @lastActiveAt, @deleted, @deletedAt,
      @verificationRequestPending, @usernameSet
    )
  `);

  for (const u of Object.values(legacy.users ?? {})) {
    insertUser.run({
      id: u.id,
      telegramId: u.telegramId,
      username: u.username ?? null,
      displayName: u.displayName ?? "User",
      avatar: u.avatar ?? null,
      cover: u.cover ?? null,
      bio: u.bio ?? null,
      verified: u.verified ? 1 : 0,
      premium: u.premium ? 1 : 0,
      premiumExpiresAt: u.premiumExpiresAt ?? null,
      banned: u.banned ? 1 : 0,
      bannedAt: u.bannedAt ?? null,
      starBalance: u.starBalance ?? 0,
      earnings: u.earnings ?? 0,
      followers: u.followers ?? 0,
      following: u.following ?? 0,
      postsCount: u.postsCount ?? 0,
      loginMethod: u.loginMethod ?? "telegram",
      createdAt: u.createdAt ?? new Date().toISOString(),
      lastActiveAt: u.lastActiveAt ?? null,
      deleted: u.deleted ? 1 : 0,
      deletedAt: u.deletedAt ?? null,
      verificationRequestPending: u.verificationRequestPending ? 1 : 0,
      usernameSet: u.usernameSet ? 1 : 0,
    });
  }

  for (const [sid, s] of Object.entries(legacy.sessions ?? {})) {
    sqlite.prepare("INSERT OR REPLACE INTO sessions VALUES (?,?,?,?,?)").run(
      sid, s.userId, s.telegramId, s.createdAt, s.expiresAt
    );
  }

  for (const u of legacy.reservedUsernames ?? []) {
    sqlite.prepare("INSERT OR IGNORE INTO reserved_usernames VALUES (?)").run(u);
  }
  for (const id of legacy.deletedUserIds ?? []) {
    sqlite.prepare("INSERT OR IGNORE INTO deleted_user_ids VALUES (?)").run(id);
  }

  for (const [k, v] of Object.entries(legacy.settings ?? {})) {
    sqlite.prepare("INSERT OR REPLACE INTO settings VALUES (?,?)").run(k, JSON.stringify(v));
  }

  for (const [id, p] of Object.entries(legacy.posts ?? {})) {
    sqlite.prepare("INSERT OR REPLACE INTO posts VALUES (?,?,?,?,?,?)").run(
      id, p.authorId, p.content ?? "", JSON.stringify(p), p.mediaExpired ? 1 : 0, p.createdAt ?? null
    );
  }

  for (const n of Object.values(legacy.notifications ?? {})) {
    sqlite.prepare("INSERT OR REPLACE INTO notifications VALUES (?,?,?,?,?,?,?,?,?)").run(
      n.id, n.userId, n.type, n.title, n.body, n.icon, JSON.stringify(n.meta ?? {}), n.read ? 1 : 0, n.createdAt
    );
  }

  for (const r of legacy.verificationRequests ?? []) {
    sqlite.prepare("INSERT OR REPLACE INTO verification_requests VALUES (?,?,?,?,?,?,?,?,?)").run(
      r.id, r.userId, r.username, r.displayName, r.followers ?? 0, r.postsCount ?? 0, r.status, r.createdAt, r.resolvedAt ?? null
    );
  }

  for (const w of legacy.withdrawalRequests ?? []) {
    sqlite.prepare("INSERT OR REPLACE INTO withdrawal_requests VALUES (?,?,?)").run(w.id, w.userId, JSON.stringify(w));
  }

  for (const [uid, b] of Object.entries(legacy.bannedUsers ?? {})) {
    sqlite.prepare("INSERT OR REPLACE INTO banned_users VALUES (?,?)").run(uid, JSON.stringify(b));
  }

  for (const [key, m] of Object.entries(legacy.mediaObjects ?? {})) {
    sqlite.prepare("INSERT OR REPLACE INTO media_objects VALUES (?,?)").run(key, JSON.stringify(m));
  }

  for (const [id, pi] of Object.entries(legacy.paymentIntents ?? {})) {
    sqlite.prepare("INSERT OR REPLACE INTO payment_intents VALUES (?,?)").run(id, JSON.stringify(pi));
  }

  for (const id of Object.keys(legacy.processedCharges ?? {})) {
    sqlite.prepare("INSERT OR IGNORE INTO processed_charges VALUES (?)").run(id);
  }

  for (const [id, s] of Object.entries(legacy.adminSessions ?? {})) {
    sqlite.prepare("INSERT OR REPLACE INTO admin_sessions VALUES (?,?,?)").run(id, s.createdAt, s.expiresAt);
  }

  for (const [id, c] of Object.entries(legacy.chats ?? {})) {
    sqlite.prepare("INSERT OR REPLACE INTO chats VALUES (?,?)").run(id, JSON.stringify(c));
  }

  console.log("Migration complete.");
}
