import { hashPassword, verifyPassword, randomToken } from "./crypto.mjs";
import { createNotification, broadcastNotification } from "./notifications.mjs";
import { isB2Configured } from "./b2.mjs";
import { deletePostMedia } from "./mediaCleanup.mjs";
import {
  findUserById,
  findUserByUsername,
  findUserByTelegramId,
  resolveUserLookup,
  publicUser,
  saveDb,
} from "./db.mjs";
import { config } from "./config.mjs";
import { envStr } from "./env.mjs";
import { ADMIN_SESSION_COOKIE, resolveSessionId } from "./sessionAuth.mjs";
import { adjustPostStats, displayLikes } from "./social.mjs";
import { listReports, markReportReviewed } from "./reports.mjs";
import { addEarningsCredit } from "./wallet.mjs";

const ADMIN_COOKIE = ADMIN_SESSION_COOKIE;
const SESSION_TTL = 12 * 60 * 60 * 1000;

export function ensureAdminSettings(db) {
  if (!db.settings) {
    db.settings = { verificationMinFollowers: 10000 };
  }
  const adminUser = envStr("ADMIN_DEFAULT_USERNAME");
  const adminPass = envStr("ADMIN_DEFAULT_PASSWORD");
  const forceReset = envStr("ADMIN_FORCE_RESET") === "true";

  if (!db.settings.adminUsername || forceReset) {
    if (!adminUser || !adminPass) {
      if (process.env.NODE_ENV === "production" && !db.settings.adminUsername) {
        throw new Error("ADMIN_DEFAULT_USERNAME and ADMIN_DEFAULT_PASSWORD must be set in production");
      }
    }
    const { salt, hash } = hashPassword(adminPass ?? "changeme");
    db.settings.adminUsername = adminUser ?? db.settings.adminUsername ?? "admin";
    db.settings.adminPasswordSalt = salt;
    db.settings.adminPasswordHash = hash;
    if (forceReset) console.log("[admin] Credentials reset from env (ADMIN_FORCE_RESET=true)");
  }
  if (!db.adminSessions) db.adminSessions = {};
  if (!db.posts) db.posts = {};
  if (!db.notifications) db.notifications = {};
  if (!db.verificationRequests) db.verificationRequests = [];
  if (!db.withdrawalRequests) db.withdrawalRequests = [];
  if (!db.bannedUsers) db.bannedUsers = {};
  if (!db.mediaObjects) db.mediaObjects = {};
  if (!db.paymentIntents) db.paymentIntents = {};
  if (!db.chats) db.chats = {};
  if (!db.unlockedPosts) db.unlockedPosts = {};
}

export function getAdminSession(req, db) {
  const sid = resolveSessionId(req, ADMIN_COOKIE);
  if (!sid) return null;
  const s = db.adminSessions[sid];
  if (!s || s.expiresAt < Date.now()) {
    if (s) delete db.adminSessions[sid];
    return null;
  }
  return s;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k) out[k] = decodeURIComponent(v.join("="));
  }
  return out;
}

function adminCookie(sessionId, secure) {
  const parts = [
    `${ADMIN_COOKIE}=${sessionId}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${SESSION_TTL / 1000}`,
    secure ? "Secure" : "",
    secure ? "SameSite=None" : "SameSite=Lax",
    config.cookieDomain ? `Domain=${config.cookieDomain}` : "",
  ].filter(Boolean);
  return parts.join("; ");
}

function clearAdminCookie(secure) {
  const parts = [
    `${ADMIN_COOKIE}=`,
    "HttpOnly",
    "Path=/",
    "Max-Age=0",
    secure ? "Secure" : "",
    secure ? "SameSite=None" : "SameSite=Lax",
    config.cookieDomain ? `Domain=${config.cookieDomain}` : "",
  ].filter(Boolean);
  return parts.join("; ");
}

export function requireAdmin(req, db) {
  const session = getAdminSession(req, db);
  if (!session) return null;
  return session;
}

function adminCredentialsValid(username, password, db) {
  if (username === db.settings.adminUsername) {
    if (verifyPassword(password, db.settings.adminPasswordSalt, db.settings.adminPasswordHash)) {
      return true;
    }
  }
  const envUser = envStr("ADMIN_DEFAULT_USERNAME");
  const envPass = envStr("ADMIN_DEFAULT_PASSWORD");
  return !!(envUser && envPass && username === envUser && password === envPass);
}

export function handleAdminLogin(req, res, db, secure, json, corsHeaders) {
  return readBody(req).then((raw) => {
    let body = {};
    try { body = JSON.parse(raw || "{}"); } catch { /* */ }
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    ensureAdminSettings(db);

    if (!adminCredentialsValid(username, password, db)) {
      return json(res, 401, { error: "Invalid credentials" }, corsHeaders(req.headers.origin));
    }

    const sessionId = randomToken();
    db.adminSessions[sessionId] = { id: sessionId, createdAt: Date.now(), expiresAt: Date.now() + SESSION_TTL };
    saveDb(db);
    return json(res, 200, { ok: true, adminToken: sessionId }, {
      ...corsHeaders(req.headers.origin),
      "Set-Cookie": adminCookie(sessionId, secure),
    });
  });
}

export function handleAdminLogout(req, res, db, secure, json, corsHeaders) {
  const session = getAdminSession(req, db);
  if (session) delete db.adminSessions[session.id];
  saveDb(db);
  return json(res, 200, { ok: true }, {
    ...corsHeaders(req.headers.origin),
    "Set-Cookie": clearAdminCookie(secure),
  });
}

export function handleAdminChangeCredentials(req, res, db, secure, json, corsHeaders) {
  if (!requireAdmin(req, db)) return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));
  return readBody(req).then((raw) => {
    let body = {};
    try { body = JSON.parse(raw || "{}"); } catch { /* */ }
    const currentPassword = String(body.currentPassword ?? "");
    const newUsername = String(body.newUsername ?? "").trim();
    const newPassword = String(body.newPassword ?? "");

    if (!verifyPassword(currentPassword, db.settings.adminPasswordSalt, db.settings.adminPasswordHash)) {
      return json(res, 403, { error: "Current password incorrect" }, corsHeaders(req.headers.origin));
    }
    if (newUsername) db.settings.adminUsername = newUsername;
    if (newPassword) {
      const { salt, hash } = hashPassword(newPassword);
      db.settings.adminPasswordSalt = salt;
      db.settings.adminPasswordHash = hash;
    }
    saveDb(db);
    return json(res, 200, { ok: true, username: db.settings.adminUsername }, corsHeaders(req.headers.origin));
  });
}

export function handleAdminStats(req, res, db, json, corsHeaders) {
  if (!requireAdmin(req, db)) return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));
  const users = Object.values(db.users).filter((u) => !u.deleted);
  const activeCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const posts = Object.values(db.posts ?? {});
  let mediaBytes = 0;
  let b2Objects = 0;
  let localObjects = 0;
  for (const m of Object.values(db.mediaObjects ?? {})) {
    mediaBytes += m.size ?? 0;
    if (m.storage === "local") localObjects++;
    else b2Objects++;
  }

  return json(res, 200, {
    users: users.length,
    activeUsers: users.filter((u) => new Date(u.lastActiveAt ?? u.createdAt).getTime() > activeCutoff).length,
    posters: users.filter((u) => (u.postsCount ?? 0) > 0).length,
    posts: posts.length,
    mediaBytes,
    b2Objects,
    localObjects,
    b2Configured: isB2Configured(),
    banned: Object.keys(db.bannedUsers).length,
    pendingVerifications: (db.verificationRequests ?? []).filter((r) => r.status === "pending").length,
    pendingWithdrawals: (db.withdrawalRequests ?? []).filter((r) => r.status === "pending").length,
    verificationMinFollowers: db.settings.verificationMinFollowers,
  }, corsHeaders(req.headers.origin));
}

function resolveUser(db, { username, telegramId, userId, query }) {
  if (userId) return findUserById(db, userId);
  if (query) return resolveUserLookup(db, query);
  if (username) return resolveUserLookup(db, username);
  if (telegramId) return findUserByTelegramId(db, Number(telegramId));
  return null;
}

export async function handleAdminAction(req, res, db, json, corsHeaders) {
  if (!requireAdmin(req, db)) return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));

  const raw = await readBody(req);
  let body = {};
  try { body = JSON.parse(raw || "{}"); } catch { /* */ }

  const action = body.action;

  switch (action) {
    case "set_verification_min_followers":
      db.settings.verificationMinFollowers = Math.max(0, Number(body.value) || 10000);
      saveDb(db);
      return json(res, 200, { ok: true, value: db.settings.verificationMinFollowers }, corsHeaders(req.headers.origin));

    case "ban_user": {
      const user = resolveUser(db, { ...body, query: body.query ?? body.username ?? body.telegramId });
      if (!user) return json(res, 404, { error: "User not found" }, corsHeaders(req.headers.origin));
      user.banned = true;
      user.bannedAt = new Date().toISOString();
      db.bannedUsers[user.id] = { userId: user.id, username: user.username, telegramId: user.telegramId, bannedAt: user.bannedAt };
      saveDb(db);
      return json(res, 200, { ok: true, user: publicUser(user) }, corsHeaders(req.headers.origin));
    }

    case "unban_user": {
      const user = resolveUser(db, body);
      if (!user) return json(res, 404, { error: "User not found" }, corsHeaders(req.headers.origin));
      user.banned = false;
      delete db.bannedUsers[user.id];
      saveDb(db);
      return json(res, 200, { ok: true, user: publicUser(user) }, corsHeaders(req.headers.origin));
    }

    case "unban_all":
      for (const u of Object.values(db.users)) u.banned = false;
      db.bannedUsers = {};
      saveDb(db);
      return json(res, 200, { ok: true }, corsHeaders(req.headers.origin));

    case "set_verified": {
      const user = resolveUser(db, body);
      if (!user) return json(res, 404, { error: "User not found" }, corsHeaders(req.headers.origin));
      user.verified = !!body.verified;
      saveDb(db);
      if (body.verified) {
        createNotification(db, { userId: user.id, type: "verification_approved", title: "Verification approved", body: "Your official verification badge is now active.", icon: "verified" });
      }
      return json(res, 200, { ok: true, user: publicUser(user) }, corsHeaders(req.headers.origin));
    }

    case "set_premium": {
      const user = resolveUser(db, body);
      if (!user) return json(res, 404, { error: "User not found" }, corsHeaders(req.headers.origin));
      user.premium = !!body.premium;
      if (body.premium && body.lifetime) {
        user.premiumExpiresAt = null;
      } else if (body.premium && body.months) {
        const exp = new Date();
        exp.setMonth(exp.getMonth() + Number(body.months));
        user.premiumExpiresAt = exp.toISOString();
      } else if (!body.premium) {
        user.premiumExpiresAt = null;
      }
      saveDb(db);
      return json(res, 200, { ok: true, user: publicUser(user) }, corsHeaders(req.headers.origin));
    }

    case "add_fake_followers": {
      const user = resolveUser(db, body);
      if (!user) return json(res, 404, { error: "User not found" }, corsHeaders(req.headers.origin));
      const delta = Number(body.count) || 0;
      user.fakeFollowers = Math.max(0, (user.fakeFollowers ?? 0) + delta);
      saveDb(db);
      return json(res, 200, {
        ok: true,
        user: publicUser(user),
        realFollowers: user.followers ?? 0,
        fakeFollowers: user.fakeFollowers,
        displayFollowers: (user.followers ?? 0) + user.fakeFollowers,
      }, corsHeaders(req.headers.origin));
    }

    case "add_fake_likes": {
      const post = db.posts[body.postId];
      if (!post) return json(res, 404, { error: "Post not found" }, corsHeaders(req.headers.origin));
      const delta = Number(body.count) || 0;
      post.fakeLikes = Math.max(0, (post.fakeLikes ?? 0) + delta);
      saveDb(db);
      return json(res, 200, {
        ok: true,
        realLikes: post.likes ?? 0,
        fakeLikes: post.fakeLikes,
        displayLikes: displayLikes(post),
      }, corsHeaders(req.headers.origin));
    }

    case "adjust_post_stats": {
      const result = adjustPostStats(db, body.postId, {
        likesDelta: Number(body.likesDelta) || 0,
        viewsDelta: Number(body.viewsDelta) || 0,
        fakeLikesDelta: Number(body.fakeLikesDelta) || 0,
        fakeViewsDelta: Number(body.fakeViewsDelta) || 0,
      });
      if (!result.ok) return json(res, 404, { error: result.error }, corsHeaders(req.headers.origin));
      saveDb(db);
      return json(res, 200, { ok: true, ...result }, corsHeaders(req.headers.origin));
    }

    case "adjust_stars": {
      const user = resolveUser(db, body);
      if (!user) return json(res, 404, { error: "User not found" }, corsHeaders(req.headers.origin));
      const delta = Number(body.delta) || 0;
      if (delta > 0) {
        addEarningsCredit(db, user.id, delta, "admin_adjustment", { label: "Admin earnings adjustment" });
      } else if (delta < 0) {
        user.earnings = Math.max(0, (user.earnings ?? 0) + delta);
      }
      saveDb(db);
      return json(res, 200, { ok: true, user: publicUser(user), earnings: user.earnings ?? 0 }, corsHeaders(req.headers.origin));
    }

    case "mark_report_reviewed": {
      const result = markReportReviewed(db, body.reportId);
      if (!result.ok) return json(res, 404, { error: result.error }, corsHeaders(req.headers.origin));
      saveDb(db);
      return json(res, 200, { ok: true }, corsHeaders(req.headers.origin));
    }

    case "send_notification": {
      const title = String(body.title ?? "");
      const text = String(body.body ?? "");
      if (body.broadcast) {
        broadcastNotification(db, { type: "admin", title, body: text, icon: body.icon ?? "info" });
      } else {
        const user = resolveUser(db, body);
        if (!user) return json(res, 404, { error: "User not found" }, corsHeaders(req.headers.origin));
        createNotification(db, { userId: user.id, type: "admin", title, body: text, icon: body.icon ?? "info" });
      }
      saveDb(db);
      return json(res, 200, { ok: true }, corsHeaders(req.headers.origin));
    }

    case "delete_post": {
      const post = db.posts[body.postId];
      if (!post) return json(res, 404, { error: "Post not found" }, corsHeaders(req.headers.origin));
      const author = findUserById(db, post.authorId);
      if (body.notify && author) {
        createNotification(db, {
          userId: author.id,
          type: "post_removed",
          title: "Post removed",
          body: "Your post was removed by moderation.",
          icon: "removed",
        });
      }
      if (body.banAuthor && author) {
        author.banned = true;
        db.bannedUsers[author.id] = { userId: author.id, bannedAt: new Date().toISOString() };
      }
      const mediaRemoved = await deletePostMedia(db, post);
      delete db.posts[body.postId];
      if (author) author.postsCount = Math.max(0, (author.postsCount ?? 1) - 1);
      saveDb(db);
      return json(res, 200, { ok: true, mediaRemoved }, corsHeaders(req.headers.origin));
    }

    case "strip_post_media": {
      const post = db.posts[body.postId];
      if (!post) return json(res, 404, { error: "Post not found" }, corsHeaders(req.headers.origin));
      const mediaRemoved = await deletePostMedia(db, post);
      const author = findUserById(db, post.authorId);
      if (body.notify && author) {
        createNotification(db, { userId: author.id, type: "media_removed", title: "Media removed", body: "Media on your post was removed by moderation.", icon: "removed" });
      }
      saveDb(db);
      return json(res, 200, { ok: true, mediaRemoved }, corsHeaders(req.headers.origin));
    }

    case "approve_verification": {
      const reqId = body.requestId;
      const vr = db.verificationRequests.find((r) => r.id === reqId);
      if (!vr) return json(res, 404, { error: "Request not found" }, corsHeaders(req.headers.origin));
      const user = findUserById(db, vr.userId);
      if (!user) return json(res, 404, { error: "User not found" }, corsHeaders(req.headers.origin));
      vr.status = "approved";
      vr.resolvedAt = new Date().toISOString();
      user.verified = true;
      user.verificationRequestPending = false;
      createNotification(db, { userId: user.id, type: "verification_approved", title: "Verification approved", body: "Congratulations! Your official badge is active.", icon: "verified" });
      saveDb(db);
      return json(res, 200, { ok: true }, corsHeaders(req.headers.origin));
    }

    case "reject_verification": {
      const reqId = body.requestId;
      const vr = db.verificationRequests.find((r) => r.id === reqId);
      if (!vr) return json(res, 404, { error: "Request not found" }, corsHeaders(req.headers.origin));
      vr.status = "rejected";
      vr.resolvedAt = new Date().toISOString();
      const rejectedUser = findUserById(db, vr.userId);
      if (rejectedUser) rejectedUser.verificationRequestPending = false;
      createNotification(db, { userId: vr.userId, type: "verification_rejected", title: "Verification rejected", body: body.reason || "Your verification request was not approved.", icon: "rejected" });
      saveDb(db);
      return json(res, 200, { ok: true }, corsHeaders(req.headers.origin));
    }

    case "complete_withdrawal": {
      const w = db.withdrawalRequests.find((r) => r.id === body.requestId);
      if (!w) return json(res, 404, { error: "Not found" }, corsHeaders(req.headers.origin));
      w.status = "completed";
      w.completedAt = new Date().toISOString();
      w.txHash = body.txHash ?? w.txHash;
      saveDb(db);
      return json(res, 200, { ok: true }, corsHeaders(req.headers.origin));
    }

    case "reject_withdrawal": {
      const w = db.withdrawalRequests.find((r) => r.id === body.requestId);
      if (!w) return json(res, 404, { error: "Not found" }, corsHeaders(req.headers.origin));
      const { refundWithdrawal } = await import("./wallet.mjs");
      refundWithdrawal(db, w.userId, w.stars);
      w.status = "rejected";
      w.rejectedAt = new Date().toISOString();
      saveDb(db);
      return json(res, 200, { ok: true }, corsHeaders(req.headers.origin));
    }

    case "search_user": {
      const user = resolveUser(db, { query: body.query ?? body.username ?? body.telegramId });
      if (!user) return json(res, 404, { error: "User not found" }, corsHeaders(req.headers.origin));
      const posts = Object.values(db.posts ?? {}).filter((p) => p.authorId === user.id);
      return json(res, 200, { user: publicUser(user, { includeTelegramId: true }), posts }, corsHeaders(req.headers.origin));
    }

    case "list_users":
      return json(res, 200, {
        users: Object.values(db.users).filter((u) => !u.deleted).map((u) => publicUser(u, { includeTelegramId: true })),
        banned: Object.values(db.bannedUsers),
      }, corsHeaders(req.headers.origin));

    case "list_posts":
      return json(res, 200, {
        posts: Object.values(db.posts ?? {}).map((p) => {
          const author = findUserById(db, p.authorId);
          return {
            ...p,
            displayLikes: displayLikes(p),
            displayViews: (p.views ?? 0) + (p.fakeViews ?? 0),
            authorUsername: author?.username ?? null,
            authorDisplayName: author?.displayName ?? null,
          };
        }),
      }, corsHeaders(req.headers.origin));

    case "list_reports":
      return json(res, 200, { reports: listReports(db) }, corsHeaders(req.headers.origin));

    case "list_verifications":
      return json(res, 200, { requests: db.verificationRequests ?? [] }, corsHeaders(req.headers.origin));

    case "list_withdrawals":
      return json(res, 200, { requests: db.withdrawalRequests ?? [] }, corsHeaders(req.headers.origin));

    default:
      return json(res, 400, { error: "Unknown action" }, corsHeaders(req.headers.origin));
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let settled = false;
    const fail = (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    };
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", fail);
    req.on("aborted", () => fail(new Error("Request aborted")));
    req.on("close", () => {
      if (!settled && !req.complete) fail(new Error("Connection closed"));
    });
  });
}
