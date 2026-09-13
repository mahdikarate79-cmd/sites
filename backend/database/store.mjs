import { getDatabase } from "./init.mjs";

function rowToUser(r) {
  if (!r) return null;
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

function userToRow(u) {
  return {
    id: u.id,
    telegramId: u.telegramId,
    username: u.username ?? null,
    displayName: u.displayName,
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
    fakeFollowers: u.fakeFollowers ?? 0,
    following: u.following ?? 0,
    postsCount: u.postsCount ?? 0,
    loginMethod: u.loginMethod ?? "telegram",
    createdAt: u.createdAt,
    lastActiveAt: u.lastActiveAt ?? null,
    deleted: u.deleted ? 1 : 0,
    deletedAt: u.deletedAt ?? null,
    verificationRequestPending: u.verificationRequestPending ? 1 : 0,
    usernameSet: u.usernameSet ? 1 : 0,
  };
}

/** Load full state (admin compatibility) */
export function loadDb() {
  const sqlite = getDatabase();

  const users = {};
  for (const r of sqlite.prepare("SELECT * FROM users").all()) {
    users[r.id] = rowToUser(r);
  }

  const sessions = {};
  for (const r of sqlite.prepare("SELECT * FROM sessions").all()) {
    sessions[r.id] = { id: r.id, userId: r.user_id, telegramId: r.telegram_id, createdAt: r.created_at, expiresAt: r.expires_at };
  }

  const adminSessions = {};
  for (const r of sqlite.prepare("SELECT * FROM admin_sessions").all()) {
    adminSessions[r.id] = { id: r.id, createdAt: r.created_at, expiresAt: r.expires_at };
  }

  const settings = { verificationMinFollowers: 10000 };
  for (const r of sqlite.prepare("SELECT * FROM settings").all()) {
    try { settings[r.key] = JSON.parse(r.value); } catch { settings[r.key] = r.value; }
  }

  const posts = {};
  for (const r of sqlite.prepare("SELECT * FROM posts").all()) {
    const p = JSON.parse(r.data);
    posts[r.id] = { ...p, id: r.id, authorId: r.author_id, content: r.content, mediaExpired: !!r.media_expired };
  }

  const notifications = {};
  for (const r of sqlite.prepare("SELECT * FROM notifications").all()) {
    notifications[r.id] = {
      id: r.id, userId: r.user_id, type: r.type, title: r.title, body: r.body,
      icon: r.icon, meta: JSON.parse(r.meta || "{}"), read: !!r.read, createdAt: r.created_at,
    };
  }

  const verificationRequests = sqlite.prepare("SELECT * FROM verification_requests").all().map((r) => ({
    id: r.id, userId: r.user_id, username: r.username, displayName: r.display_name,
    followers: r.followers, postsCount: r.posts_count, status: r.status,
    createdAt: r.created_at, resolvedAt: r.resolved_at,
  }));

  const withdrawalRequests = sqlite.prepare("SELECT * FROM withdrawal_requests").all().map((r) => JSON.parse(r.data));
  const bannedUsers = {};
  for (const r of sqlite.prepare("SELECT * FROM banned_users").all()) {
    bannedUsers[r.user_id] = JSON.parse(r.data);
  }

  const mediaObjects = {};
  for (const r of sqlite.prepare("SELECT * FROM media_objects").all()) {
    mediaObjects[r.object_key] = JSON.parse(r.data);
  }

  const paymentIntents = {};
  for (const r of sqlite.prepare("SELECT * FROM payment_intents").all()) {
    paymentIntents[r.id] = JSON.parse(r.data);
  }

  const processedCharges = {};
  for (const r of sqlite.prepare("SELECT charge_id FROM processed_charges").all()) {
    processedCharges[r.charge_id] = true;
  }

  const chats = {};
  for (const r of sqlite.prepare("SELECT * FROM chats").all()) {
    chats[r.id] = JSON.parse(r.data);
  }

  const reservedUsernames = sqlite.prepare("SELECT username FROM reserved_usernames").all().map((r) => r.username);
  const deletedUserIds = sqlite.prepare("SELECT user_id FROM deleted_user_ids").all().map((r) => r.user_id);
  const unlockedPosts = settings.unlockedPosts ?? {};
  const earningsLedger = settings.earningsLedger ?? {};
  const follows = settings.follows ?? {};
  const postLikes = settings.postLikes ?? {};
  const donations = settings.donations ?? {};
  const unlockedPaidMedia = settings.unlockedPaidMedia ?? {};
  delete settings.unlockedPosts;
  delete settings.earningsLedger;
  delete settings.follows;
  delete settings.postLikes;
  delete settings.donations;
  delete settings.unlockedPaidMedia;

  return {
    users, sessions, adminSessions, settings, posts, notifications,
    verificationRequests, withdrawalRequests, bannedUsers, mediaObjects,
    paymentIntents, processedCharges, chats, reservedUsernames, deletedUserIds,
    unlockedPosts, earningsLedger, follows, postLikes, donations, unlockedPaidMedia,
  };
}

/** Persist full state after mutations */
export function saveDb(db) {
  const sqlite = getDatabase();
  const tx = sqlite.transaction(() => {
    const upsertUser = sqlite.prepare(`
      INSERT OR REPLACE INTO users (
        id, telegram_id, username, display_name, avatar, cover, bio, verified, premium,
        premium_expires_at, banned, banned_at, star_balance, earnings, followers, fake_followers, following,
        posts_count, login_method, created_at, last_active_at, deleted, deleted_at,
        verification_request_pending, username_set
      ) VALUES (
        @id, @telegramId, @username, @displayName, @avatar, @cover, @bio, @verified, @premium,
        @premiumExpiresAt, @banned, @bannedAt, @starBalance, @earnings, @followers, @fakeFollowers, @following,
        @postsCount, @loginMethod, @createdAt, @lastActiveAt, @deleted, @deletedAt,
        @verificationRequestPending, @usernameSet
      )
    `);
    for (const u of Object.values(db.users ?? {})) upsertUser.run(userToRow(u));

    sqlite.prepare("DELETE FROM sessions").run();
    const insSession = sqlite.prepare("INSERT INTO sessions VALUES (?,?,?,?,?)");
    for (const s of Object.values(db.sessions ?? {})) {
      insSession.run(s.id, s.userId, s.telegramId, s.createdAt, s.expiresAt);
    }

    sqlite.prepare("DELETE FROM admin_sessions").run();
    const insAdmin = sqlite.prepare("INSERT INTO admin_sessions VALUES (?,?,?)");
    for (const s of Object.values(db.adminSessions ?? {})) {
      insAdmin.run(s.id, s.createdAt, s.expiresAt);
    }

    sqlite.prepare("DELETE FROM settings").run();
    const insSetting = sqlite.prepare("INSERT INTO settings VALUES (?,?)");
    const settingsToSave = { ...(db.settings ?? {}) };
    if (db.unlockedPosts) settingsToSave.unlockedPosts = db.unlockedPosts;
    if (db.earningsLedger) settingsToSave.earningsLedger = db.earningsLedger;
    if (db.follows) settingsToSave.follows = db.follows;
    if (db.postLikes) settingsToSave.postLikes = db.postLikes;
    if (db.donations) settingsToSave.donations = db.donations;
    if (db.unlockedPaidMedia) settingsToSave.unlockedPaidMedia = db.unlockedPaidMedia;
    for (const [k, v] of Object.entries(settingsToSave)) {
      insSetting.run(k, JSON.stringify(v));
    }

    sqlite.prepare("DELETE FROM reserved_usernames").run();
    const insReserved = sqlite.prepare("INSERT INTO reserved_usernames VALUES (?)");
    for (const u of db.reservedUsernames ?? []) insReserved.run(u);

    sqlite.prepare("DELETE FROM deleted_user_ids").run();
    const insDeleted = sqlite.prepare("INSERT INTO deleted_user_ids VALUES (?)");
    for (const id of db.deletedUserIds ?? []) insDeleted.run(id);

    sqlite.prepare("DELETE FROM posts").run();
    const insPost = sqlite.prepare("INSERT INTO posts VALUES (?,?,?,?,?,?)");
    for (const p of Object.values(db.posts ?? {})) {
      insPost.run(p.id, p.authorId, p.content ?? "", JSON.stringify(p), p.mediaExpired ? 1 : 0, p.createdAt ?? null);
    }

    sqlite.prepare("DELETE FROM notifications").run();
    const insNotif = sqlite.prepare("INSERT INTO notifications VALUES (?,?,?,?,?,?,?,?,?)");
    for (const n of Object.values(db.notifications ?? {})) {
      insNotif.run(n.id, n.userId, n.type, n.title, n.body, n.icon, JSON.stringify(n.meta ?? {}), n.read ? 1 : 0, n.createdAt);
    }

    sqlite.prepare("DELETE FROM verification_requests").run();
    const insVr = sqlite.prepare("INSERT INTO verification_requests VALUES (?,?,?,?,?,?,?,?,?)");
    for (const r of db.verificationRequests ?? []) {
      insVr.run(r.id, r.userId, r.username, r.displayName, r.followers ?? 0, r.postsCount ?? 0, r.status, r.createdAt, r.resolvedAt ?? null);
    }

    sqlite.prepare("DELETE FROM withdrawal_requests").run();
    const insWd = sqlite.prepare("INSERT INTO withdrawal_requests VALUES (?,?,?)");
    for (const w of db.withdrawalRequests ?? []) insWd.run(w.id, w.userId, JSON.stringify(w));

    sqlite.prepare("DELETE FROM banned_users").run();
    const insBan = sqlite.prepare("INSERT INTO banned_users VALUES (?,?)");
    for (const [uid, b] of Object.entries(db.bannedUsers ?? {})) insBan.run(uid, JSON.stringify(b));

    sqlite.prepare("DELETE FROM media_objects").run();
    const insMedia = sqlite.prepare("INSERT INTO media_objects VALUES (?,?)");
    for (const [k, m] of Object.entries(db.mediaObjects ?? {})) insMedia.run(k, JSON.stringify(m));

    sqlite.prepare("DELETE FROM payment_intents").run();
    const insPi = sqlite.prepare("INSERT INTO payment_intents VALUES (?,?)");
    for (const [id, pi] of Object.entries(db.paymentIntents ?? {})) insPi.run(id, JSON.stringify(pi));

    sqlite.prepare("DELETE FROM processed_charges").run();
    const insCharge = sqlite.prepare("INSERT INTO processed_charges VALUES (?)");
    for (const id of Object.keys(db.processedCharges ?? {})) insCharge.run(id);

    sqlite.prepare("DELETE FROM chats").run();
    const insChat = sqlite.prepare("INSERT INTO chats VALUES (?,?)");
    for (const [id, c] of Object.entries(db.chats ?? {})) insChat.run(id, JSON.stringify(c));
  });
  tx();
}
