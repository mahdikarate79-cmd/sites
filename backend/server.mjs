import http from "http";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { envStr } from "./env.mjs";
import { validateInitData } from "./validateInitData.mjs";
import {
  loadDb,
  saveDb,
  findUserByTelegramId,
  findUserByTelegramIdIncludingDeleted,
  findUserById,
  getDeletionCooldown,
  createUserFromTelegram,
  detachTelegramLeaks,
  expirePremiumIfNeeded,
  isPostUnlocked,
  unlockPost,
  createSession,
  deleteAccount,
  publicUser,
  touchUserActivity,
  usernameAvailable,
} from "./db.mjs";
import {
  ensureAdminSettings,
  handleAdminLogin,
  handleAdminLogout,
  handleAdminChangeCredentials,
  handleAdminStats,
  handleAdminAction,
  getAdminSession,
} from "./admin.mjs";
import { uploadToB2, isB2Configured, downloadFromB2, testB2Connection } from "./b2.mjs";
import { saveLocalMedia, readLocalMedia, isLocalMediaAvailable, localMediaRoot } from "./localMedia.mjs";
import {
  createStarsInvoice,
  answerPreCheckoutQuery,
  verifyWebhookSecret,
  isBotConfigured,
  sendWelcomeMessage,
  ensureWebhookConfigured,
} from "./telegramBot.mjs";
import { getPostComments, createComment, ensureComments } from "./comments.mjs";
import { createReport, ensureReports, markReportReviewed } from "./reports.mjs";
import { createNotification, getUserNotifications } from "./notifications.mjs";
import { startCleanupScheduler } from "./mediaCleanup.mjs";
import { serveStatic, staticDirExists } from "./static.mjs";
import { config } from "./config.mjs";
import { getDatabase } from "./database/init.mjs";
import { startHttpServer } from "./listen.mjs";
import {
  addEarningsCredit,
  consumeWithdrawable,
  getWalletInfo,
  getWithdrawableStars,
  MIN_STARS_21_DAYS,
} from "./wallet.mjs";
import {
  createPost,
  followUser,
  unfollowUser,
  getFeedPosts,
  getPostById,
  getPostsByAuthor,
  getFollowersList,
  getFollowingList,
  togglePostLike,
  resolveProfileUser,
  isFollowing,
  ensureSocial,
  recordDonation,
  searchUsers,
  displayFollowers,
  incrementPostView,
  incrementPostShare,
} from "./social.mjs";
import {
  listChats,
  getChat,
  getChatMessages,
  sendChatMessage,
  startChat,
  ensureChats,
} from "./chat.mjs";
import { USER_SESSION_COOKIE, resolveSessionId } from "./sessionAuth.mjs";
import { MIN_STARS_PAYMENT, MAX_STARS_PAYMENT, isValidPaidStars } from "./constants.mjs";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const DEV_AUTH = process.env.AUTH_DEV_MODE === "true";
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
const COOKIE_NAME = USER_SESSION_COOKIE;
const ORIGINS = config.corsOrigins;

const PLANS = {
  "1m": { months: 1, stars: 100 },
  "6m": { months: 6, stars: 300 },
  "1y": { months: 12, stars: 500 },
  lifetime: { months: 0, stars: 1200, permanent: true },
};

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k) out[k] = decodeURIComponent(v.join("="));
  }
  return out;
}

function corsHeaders(origin) {
  const normalized = (origin ?? "").replace(/\/$/, "");
  const allowed = ORIGINS.some((o) => normalized === o.replace(/\/$/, "") || normalized.startsWith(o.replace(/\/$/, "")));
  if (!allowed) {
    return { Vary: "Origin" };
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, { "Content-Type": "application/json", ...extraHeaders });
  res.end(JSON.stringify(body));
}

function readBody(req, maxBytes = 64 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    const fail = (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    };
    req.on("data", (c) => {
      size += c.length;
      if (size > maxBytes) {
        fail(new Error("Body too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
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

function isSecureRequest(req) {
  return config.isProduction
    || req.headers["x-forwarded-proto"] === "https"
    || process.env.NODE_ENV === "production";
}

function sessionCookie(sessionId, secure) {
  const parts = [
    `${COOKIE_NAME}=${sessionId}`,
    "HttpOnly",
    "Path=/",
    "Max-Age=2592000",
    secure ? "Secure" : "",
    secure ? "SameSite=None" : "SameSite=Lax",
    config.cookieDomain ? `Domain=${config.cookieDomain}` : "",
  ].filter(Boolean);
  return parts.join("; ");
}

function clearCookie(secure) {
  const parts = [
    `${COOKIE_NAME}=`,
    "HttpOnly",
    "Path=/",
    "Max-Age=0",
    secure ? "Secure" : "",
    secure ? "SameSite=None" : "SameSite=Lax",
    config.cookieDomain ? `Domain=${config.cookieDomain}` : "",
  ].filter(Boolean);
  return parts.join("; ");
}

function getSession(req, db) {
  const sid = resolveSessionId(req, COOKIE_NAME);
  if (!sid) return null;
  const session = db.sessions[sid];
  if (!session || session.expiresAt < Date.now()) {
    if (session) delete db.sessions[sid];
    return null;
  }
  return session;
}

function requireUser(req, db) {
  const session = getSession(req, db);
  if (!session) return null;
  const user = findUserById(db, session.userId);
  if (!user || user.banned || session.telegramId !== user.telegramId) return null;
  expirePremiumIfNeeded(user);
  touchUserActivity(db, user.id);
  return user;
}

function parseTelegramUser(initData) {
  if (BOT_TOKEN) return validateInitData(initData, BOT_TOKEN);
  if (!DEV_AUTH) return null;
  try {
    const params = new URLSearchParams(initData);
    const userRaw = params.get("user");
    if (!userRaw) return null;
    const user = JSON.parse(userRaw);
    return user?.id ? user : null;
  } catch {
    return null;
  }
}

async function handleTelegramAuth(req, res, secure) {
  const raw = await readBody(req);
  let initData = "";
  try {
    initData = JSON.parse(raw || "{}").initData ?? "";
  } catch {
    return json(res, 400, { error: "Invalid body" }, corsHeaders(req.headers.origin));
  }

  const tgUser = parseTelegramUser(initData);
  if (!tgUser) return json(res, 401, { error: "Invalid initData" }, corsHeaders(req.headers.origin));

  const db = loadDb();
  ensureAdminSettings(db);
  const existingSession = getSession(req, db);
  if (existingSession && existingSession.telegramId !== tgUser.id) {
    delete db.sessions[existingSession.id];
  }

  let user = findUserByTelegramId(db, tgUser.id);
  if (!user) {
    const deletedGhost = findUserByTelegramIdIncludingDeleted(db, tgUser.id);
    if (deletedGhost?.deleted) {
      const cooldown = getDeletionCooldown(deletedGhost);
      if (cooldown) {
        return json(res, 403, {
          error: "Account recently deleted",
          accountDeleted: true,
          canRecreateAt: cooldown.canRecreateAt,
          remainingMs: cooldown.remainingMs,
        }, corsHeaders(req.headers.origin));
      }
      deletedGhost.telegramId = null;
      getDatabase().prepare("UPDATE users SET telegram_id = NULL WHERE id = ?").run(deletedGhost.id);
    }
    user = createUserFromTelegram(db, tgUser);
    db.users[user.id] = user;
  } else {
    expirePremiumIfNeeded(user);
    detachTelegramLeaks(user, tgUser);
    touchUserActivity(db, user.id);
  }

  if (user.banned) {
    return json(res, 403, {
      error: "Account banned",
      banned: true,
      bannedAt: user.bannedAt ?? null,
    }, corsHeaders(req.headers.origin));
  }

  const session = createSession(user.id, tgUser.id);
  db.sessions[session.id] = session;
  saveDb(db);

  return json(res, 200, {
    user: publicUser(user),
    loginMethod: "telegram",
    sessionToken: session.id,
  }, {
    ...corsHeaders(req.headers.origin),
    "Set-Cookie": sessionCookie(session.id, secure),
  });
}

function handleMe(req, res) {
  const db = loadDb();
  ensureAdminSettings(db);
  const session = getSession(req, db);
  if (!session) return json(res, 200, { user: null, loginMethod: "guest" }, corsHeaders(req.headers.origin));

  const user = findUserById(db, session.userId);
  if (!user || user.banned || session.telegramId !== user.telegramId) {
    if (user?.banned) {
      delete db.sessions[session.id];
      saveDb(db);
      return json(res, 200, {
        user: null,
        loginMethod: "guest",
        banned: true,
        bannedAt: user.bannedAt ?? null,
      }, corsHeaders(req.headers.origin));
    }
    delete db.sessions[session.id];
    saveDb(db);
    return json(res, 200, { user: null, loginMethod: "guest" }, corsHeaders(req.headers.origin));
  }

  expirePremiumIfNeeded(user);
  touchUserActivity(db, user.id);
  saveDb(db);
  return json(res, 200, {
    user: publicUser(user),
    loginMethod: "telegram",
    sessionToken: session.id,
    verificationMinFollowers: db.settings.verificationMinFollowers,
  }, corsHeaders(req.headers.origin));
}

function handleLogout(req, res, secure) {
  const db = loadDb();
  const session = getSession(req, db);
  if (session) delete db.sessions[session.id];
  saveDb(db);
  return json(res, 200, { ok: true }, { ...corsHeaders(req.headers.origin), "Set-Cookie": clearCookie(secure) });
}

async function handleDeleteAccount(req, res, secure) {
  const db = loadDb();
  const session = getSession(req, db);
  if (!session) return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));
  deleteAccount(db, session.userId);
  delete db.sessions[session.id];
  saveDb(db);
  return json(res, 200, { ok: true }, { ...corsHeaders(req.headers.origin), "Set-Cookie": clearCookie(secure) });
}

async function handleVerificationRequest(req, res) {
  const db = loadDb();
  const user = requireUser(req, db);
  if (!user) return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));

  if (!user.username?.trim()) return json(res, 400, { error: "Set a username first" }, corsHeaders(req.headers.origin));
  if (user.verified) return json(res, 400, { error: "Already verified" }, corsHeaders(req.headers.origin));
  if (user.verificationRequestPending) return json(res, 400, { error: "Request pending" }, corsHeaders(req.headers.origin));

  const minFollowers = db.settings.verificationMinFollowers ?? 10000;
  const displayCount = displayFollowers(user);
  if (displayCount < minFollowers) {
    return json(res, 400, { error: `Minimum ${minFollowers} followers required` }, corsHeaders(req.headers.origin));
  }

  const id = `vr_${crypto.randomBytes(8).toString("hex")}`;
  const request = {
    id,
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    followers: displayCount,
    postsCount: user.postsCount,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  db.verificationRequests.push(request);
  user.verificationRequestPending = true;
  saveDb(db);
  return json(res, 200, { ok: true, request }, corsHeaders(req.headers.origin));
}

function handleNotifications(req, res) {
  const db = loadDb();
  const user = requireUser(req, db);
  if (!user) return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));
  const notifications = getUserNotifications(db, user.id);
  const unreadCount = notifications.filter((n) => !n.read).length;
  return json(res, 200, { notifications, unreadCount }, corsHeaders(req.headers.origin));
}

async function handleNotificationsMarkRead(req, res) {
  const db = loadDb();
  const user = requireUser(req, db);
  if (!user) return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));
  for (const n of Object.values(db.notifications ?? {})) {
    if (n.userId === user.id) n.read = true;
  }
  saveDb(db);
  return json(res, 200, { ok: true }, corsHeaders(req.headers.origin));
}

function handleUserUnlocks(req, res) {
  const db = loadDb();
  ensureAdminSettings(db);
  const user = requireUser(req, db);
  if (!user) return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));
  const postIds = Object.keys(db.unlockedPosts?.[user.id] ?? {});
  return json(res, 200, { postIds }, corsHeaders(req.headers.origin));
}

async function handleCreateInvoice(req, res) {
  const db = loadDb();
  const user = requireUser(req, db);
  if (!user) return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));

  const raw = await readBody(req);
  let body = {};
  try { body = JSON.parse(raw || "{}"); } catch { /* */ }

  const type = body.type ?? "premium";
  let stars = 0;
  let title = "Sheytoni";
  let description = "Payment";
  let meta = {};

  if (type === "premium") {
    const plan = PLANS[body.planId ?? "6m"];
    if (!plan) return json(res, 400, { error: "Invalid plan" }, corsHeaders(req.headers.origin));
    stars = plan.stars;
    title = "Sheytoni Premium";
    description = `Premium subscription (${body.planId})`;
    meta = { type: "premium", planId: body.planId ?? "6m" };
  } else if (type === "stars") {
    stars = Math.max(MIN_STARS_PAYMENT, Math.min(MAX_STARS_PAYMENT, Number(body.amount) || 0));
    title = "Sheytoni Stars";
    description = `Purchase ${stars} Stars`;
    meta = { type: "stars", amount: stars };
  } else if (type === "post_unlock") {
    stars = Number(body.stars) || 0;
    if (!isValidPaidStars(stars)) {
      return json(res, 400, { error: `Minimum ${MIN_STARS_PAYMENT} stars required` }, corsHeaders(req.headers.origin));
    }
    const postId = String(body.postId ?? "");
    if (!postId) return json(res, 400, { error: "postId required" }, corsHeaders(req.headers.origin));
    title = "Sheytoni — Unlock post";
    description = `Unlock paid content`;
    meta = { type: "post_unlock", postId, stars };
  } else if (type === "donation") {
    stars = Number(body.stars) || 0;
    if (!isValidPaidStars(stars)) {
      return json(res, 400, { error: `Minimum ${MIN_STARS_PAYMENT} stars required` }, corsHeaders(req.headers.origin));
    }
    const postId = String(body.postId ?? "");
    const recipientId = String(body.recipientId ?? "");
    if (!postId || !recipientId) return json(res, 400, { error: "postId and recipientId required" }, corsHeaders(req.headers.origin));
    title = "Sheytoni — Star donation";
    description = `Send ${stars} Stars`;
    meta = { type: "donation", postId, recipientId, stars, anonymous: !!body.anonymous };
  } else if (type === "paid_media") {
    stars = Number(body.stars) || 0;
    if (!isValidPaidStars(stars)) {
      return json(res, 400, { error: `Minimum ${MIN_STARS_PAYMENT} stars required` }, corsHeaders(req.headers.origin));
    }
    const chatId = String(body.chatId ?? "");
    const messageId = String(body.messageId ?? "");
    const recipientId = String(body.recipientId ?? "");
    if (!chatId || !messageId || !recipientId) {
      return json(res, 400, { error: "chatId, messageId, recipientId required" }, corsHeaders(req.headers.origin));
    }
    title = "Sheytoni — Unlock media";
    description = `Unlock paid media (${stars} Stars)`;
    meta = { type: "paid_media", chatId, messageId, recipientId, stars };
  } else {
    return json(res, 400, { error: "Invalid type" }, corsHeaders(req.headers.origin));
  }

  const intentId = `pi_${crypto.randomBytes(8).toString("hex")}`;

  db.paymentIntents[intentId] = {
    id: intentId,
    userId: user.id,
    stars,
    meta,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  saveDb(db);

  if (!isBotConfigured()) {
    return json(res, 503, { error: "Payments not configured" }, corsHeaders(req.headers.origin));
  }

  try {
    const invoiceUrl = await createStarsInvoice({ title, description, payload: intentId, amount: stars });
    return json(res, 200, { invoiceUrl, intentId }, corsHeaders(req.headers.origin));
  } catch (e) {
    console.error("Invoice creation failed:", e.message);
    return json(res, 502, { error: "invoice_failed", message: e.message }, corsHeaders(req.headers.origin));
  }
}

async function handleTelegramWebhook(req, res) {
  if (!verifyWebhookSecret(req, WEBHOOK_SECRET)) {
    return json(res, 403, { error: "Forbidden" });
  }

  const raw = await readBody(req);
  let update = {};
  try { update = JSON.parse(raw || "{}"); } catch {
    return json(res, 400, { error: "Invalid body" });
  }

  const db = loadDb();
  ensureAdminSettings(db);

  if (update.pre_checkout_query) {
    const q = update.pre_checkout_query;
    const intent = db.paymentIntents[q.invoice_payload];
    const ok = intent && intent.status === "pending" && intent.stars === q.total_amount;
    if (!ok) {
      console.warn("[payment] pre_checkout rejected", {
        payload: q.invoice_payload,
        intentStatus: intent?.status,
        intentStars: intent?.stars,
        queryAmount: q.total_amount,
      });
    }
    await answerPreCheckoutQuery(q.id, ok, ok ? undefined : "Payment unavailable");
    return json(res, 200, { ok: true });
  }

  const message = update.message;
  if (message?.chat?.id) {
    try {
      await sendWelcomeMessage(message.chat.id);
    } catch (e) {
      console.error("[bot] welcome message failed:", e.message);
    }
    return json(res, 200, { ok: true });
  }

  const payment = update.message?.successful_payment;
  if (payment) {
    const chargeId = payment.telegram_payment_charge_id;
    if (db.processedCharges?.[chargeId]) return json(res, 200, { ok: true });
    if (!db.processedCharges) db.processedCharges = {};

    try {
      const intent = db.paymentIntents[payment.invoice_payload];
      const user = intent ? findUserById(db, intent.userId) : null;
      if (intent && user && intent.stars === payment.total_amount && intent.status === "pending") {
        intent.status = "completed";
        intent.chargeId = chargeId;
        db.processedCharges[chargeId] = true;
        if (intent.meta?.type === "premium") {
          const plan = PLANS[intent.meta.planId] ?? PLANS["6m"];
          user.premium = true;
          if (plan.permanent) {
            user.premiumExpiresAt = null;
          } else {
            const exp = new Date();
            exp.setMonth(exp.getMonth() + plan.months);
            user.premiumExpiresAt = exp.toISOString();
          }
        } else if (intent.meta?.type === "post_unlock") {
          unlockPost(db, user.id, intent.meta.postId);
          const post = db.posts?.[intent.meta.postId];
          const author = post ? findUserById(db, post.authorId) : null;
          if (author) addEarningsCredit(db, author.id, intent.stars, "post_unlock", { postId: intent.meta.postId });
        } else if (intent.meta?.type === "donation") {
          const recipient = findUserById(db, intent.meta.recipientId);
          if (recipient) {
            addEarningsCredit(db, recipient.id, intent.stars, "donation", {
              postId: intent.meta.postId,
              donorId: user.id,
              donorName: user.displayName,
              donorUsername: user.username ?? null,
            });
            recordDonation(db, intent.meta.postId, user.id, intent.stars, intent.meta.anonymous);
          }
        } else if (intent.meta?.type === "paid_media") {
          if (!db.unlockedPaidMedia) db.unlockedPaidMedia = {};
          if (!db.unlockedPaidMedia[user.id]) db.unlockedPaidMedia[user.id] = {};
          const key = `${intent.meta.chatId}:${intent.meta.messageId}`;
          db.unlockedPaidMedia[user.id][key] = { unlockedAt: new Date().toISOString() };
          const recipient = findUserById(db, intent.meta.recipientId);
          if (recipient) {
            addEarningsCredit(db, recipient.id, intent.stars, "paid_media", {
              chatId: intent.meta.chatId,
              messageId: intent.meta.messageId,
            });
          }
        } else {
          user.starBalance = (user.starBalance ?? 0) + intent.stars;
        }
        saveDb(db);
      }
    } catch (e) {
      console.error("Payment processing error", e);
    }
    return json(res, 200, { ok: true });
  }

  return json(res, 200, { ok: true });
}

async function handleStorageUpload(req, res) {
  const db = loadDb();
  const user = requireUser(req, db);
  if (!user) return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));
  if (!isB2Configured()) {
    return json(res, 503, { error: "B2 storage required — configure B2 credentials" }, corsHeaders(req.headers.origin));
  }

  const raw = await readBody(req);
  let body = {};
  try { body = JSON.parse(raw || "{}"); } catch {
    return json(res, 400, { error: "Invalid body" }, corsHeaders(req.headers.origin));
  }

  const { data, contentType, category } = body;
  if (!data || !contentType) return json(res, 400, { error: "Missing data" }, corsHeaders(req.headers.origin));

  const buffer = Buffer.from(data, "base64");
  const maxSize = user.premium ? 50 * 1024 * 1024 : 15 * 1024 * 1024;
  if (buffer.length > maxSize) {
    return json(res, 400, { error: `File too large (max ${Math.round(maxSize / 1024 / 1024)}MB)` }, corsHeaders(req.headers.origin));
  }

  const ext = contentType.includes("video") ? ".mp4" : contentType.includes("gif") ? ".gif" : ".jpg";
  const objectKey = `${category ?? "post"}/${user.id}/${crypto.randomBytes(16).toString("hex")}${ext}`;
  const proxyUrl = `${config.apiUrl}/api/media/${encodeURIComponent(objectKey)}`;

  try {
    const uploaded = await uploadToB2(objectKey, buffer, contentType);
    db.mediaObjects[objectKey] = {
      ...uploaded,
      storage: "b2",
      userId: user.id,
      createdAt: new Date().toISOString(),
      url: proxyUrl,
    };
    saveDb(db);
    return json(res, 200, { objectKey, url: proxyUrl, size: uploaded.size, storage: "b2" }, corsHeaders(req.headers.origin));
  } catch (e) {
    console.error("B2 upload failed:", e.message);
    return json(res, 503, { error: "b2_upload_failed", message: e.message }, corsHeaders(req.headers.origin));
  }
}

async function handleMediaProxy(req, res, objectKey) {
  const origin = req.headers.origin;
  const extra = { "Cache-Control": "public, max-age=86400" };

  const local = readLocalMedia(objectKey);
  if (local) {
    res.writeHead(200, { "Content-Type": local.contentType, ...extra, ...corsHeaders(origin) });
    return res.end(local.buffer);
  }

  if (isB2Configured()) {
    try {
      const { buffer, contentType } = await downloadFromB2(objectKey);
      res.writeHead(200, { "Content-Type": contentType, ...extra, ...corsHeaders(origin) });
      return res.end(buffer);
    } catch (e) {
      console.error("Media proxy B2 error", objectKey, e.message);
    }
  }

  return json(res, 404, { error: "Not found" }, corsHeaders(origin));
}

async function handleProfileUpdate(req, res) {
  const db = loadDb();
  const user = requireUser(req, db);
  if (!user) return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));

  const raw = await readBody(req);
  let body = {};
  try { body = JSON.parse(raw || "{}"); } catch {
    return json(res, 400, { error: "Invalid body" }, corsHeaders(req.headers.origin));
  }

  // Sheytoni profile only — Telegram name/username changes do not affect verification
  if (body.displayName !== undefined) {
    const nextName = String(body.displayName).trim();
    if (nextName && nextName !== user.displayName) {
      if (user.verified) user.verified = false;
      user.displayName = nextName;
    }
  }

  if (body.bio !== undefined) user.bio = String(body.bio).slice(0, 500);
  if (body.avatar) {
    const av = String(body.avatar);
    if (av.startsWith("blob:") || av.startsWith("data:")) {
      return json(res, 400, { error: "Upload avatar via storage API" }, corsHeaders(req.headers.origin));
    }
    user.avatar = av;
  }
  if (body.cover !== undefined) {
    const cv = body.cover ? String(body.cover) : "";
    if (cv && (cv.startsWith("blob:") || cv.startsWith("data:"))) {
      return json(res, 400, { error: "Upload cover via storage API" }, corsHeaders(req.headers.origin));
    }
    user.cover = cv || undefined;
  }

  if (body.username !== undefined) {
    const nextUsername = String(body.username).trim().toLowerCase();
    const currentUsername = (user.username ?? "").toLowerCase();
    if (nextUsername !== currentUsername) {
      if (nextUsername) {
        if (!usernameAvailable(db, nextUsername)) {
          return json(res, 409, { error: "Username taken" }, corsHeaders(req.headers.origin));
        }
        if (user.verified) user.verified = false;
        user.username = nextUsername;
        user.usernameSet = true;
      } else if (currentUsername) {
        user.username = null;
        user.usernameSet = false;
      }
    }
  }

  if (body.age !== undefined) {
    const age = Math.max(18, Math.min(99, Number(body.age) || 0));
    if (age >= 18) user.age = age;
  }
  if (body.orientation !== undefined) {
    const allowed = ["straight", "gay", "lesbian", "bisexual", "trans", "pansexual", "asexual", "queer"];
    const o = String(body.orientation ?? "").trim();
    user.orientation = allowed.includes(o) ? o : null;
  }

  user.profileCustomized = true;
  saveDb(db);
  return json(res, 200, { user: publicUser(user) }, corsHeaders(req.headers.origin));
}

async function handleReport(req, res) {
  const db = loadDb();
  const user = requireUser(req, db);
  if (!user) return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));
  const raw = await readBody(req);
  let body = {};
  try { body = JSON.parse(raw || "{}"); } catch { /* */ }
  ensureReports(db);
  const report = createReport(db, user.id, body);
  saveDb(db);
  return json(res, 200, { ok: true, id: report.id }, corsHeaders(req.headers.origin));
}

function handleWallet(req, res) {
  const db = loadDb();
  ensureSocial(db);
  const user = requireUser(req, db);
  if (!user) return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));
  const wallet = getWalletInfo(db, user.id);
  return json(res, 200, wallet, corsHeaders(req.headers.origin));
}

async function handleWithdrawalRequest(req, res) {
  const db = loadDb();
  const user = requireUser(req, db);
  if (!user) return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));

  const raw = await readBody(req);
  let body = {};
  try { body = JSON.parse(raw || "{}"); } catch { /* */ }

  const stars = Math.max(1, Number(body.stars) || 0);
  const wallet = String(body.wallet ?? "").trim();
  if (!wallet) return json(res, 400, { error: "Wallet required" }, corsHeaders(req.headers.origin));
  if (!/^(UQ|EQ)[A-Za-z0-9_-]{46,48}$/.test(wallet)) {
    return json(res, 400, { error: "Invalid TON wallet" }, corsHeaders(req.headers.origin));
  }

  const info = getWalletInfo(db, user.id);
  if (!info.meetsMinimum) {
    return json(res, 403, {
      error: "minimum_not_met",
      message: `Minimum ${MIN_STARS_21_DAYS} stars earned in the last 21 days required`,
      starsLast21Days: info.starsLast21Days,
    }, corsHeaders(req.headers.origin));
  }
  if (stars > info.withdrawable) {
    return json(res, 402, { error: "Insufficient withdrawable balance", withdrawable: info.withdrawable }, corsHeaders(req.headers.origin));
  }

  try {
    consumeWithdrawable(db, user.id, stars);
  } catch {
    return json(res, 402, { error: "Insufficient withdrawable balance" }, corsHeaders(req.headers.origin));
  }

  user.earnings = Math.max(0, (user.earnings ?? 0) - stars);
  const usd = (stars * 0.013).toFixed(2);
  const id = `wd_${crypto.randomBytes(8).toString("hex")}`;
  db.withdrawalRequests.push({
    id,
    userId: user.id,
    username: user.username,
    stars,
    usd,
    wallet,
    balanceAfter: user.earnings,
    withdrawableAfter: getWithdrawableStars(db, user.id),
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  saveDb(db);
  return json(res, 200, { ok: true, id }, corsHeaders(req.headers.origin));
}

async function handleSocial(req, res, url) {
  const db = loadDb();
  ensureSocial(db);
  const user = requireUser(req, db);
  const origin = req.headers.origin;

  if (url === "/api/users/search" && req.method === "GET") {
    const q = new URL(req.url ?? "", "http://localhost").searchParams.get("q") ?? "";
    json(res, 200, { users: searchUsers(db, q, user?.id ?? null) }, corsHeaders(origin));
    return true;
  }

  if (url === "/api/feed" && req.method === "GET") {
    json(res, 200, { posts: getFeedPosts(db, user?.id ?? null) }, corsHeaders(origin));
    return true;
  }

  const commentsMatch = url.match(/^\/api\/posts\/([^/]+)\/comments$/);
  if (commentsMatch) {
    const postId = decodeURIComponent(commentsMatch[1]);
    ensureComments(db);
    if (req.method === "GET") {
      json(res, 200, { comments: getPostComments(db, postId) }, corsHeaders(origin));
      return true;
    }
    if (req.method === "POST") {
      if (!user) { json(res, 401, { error: "Unauthorized" }, corsHeaders(origin)); return true; }
      const raw = await readBody(req);
      let body = {};
      try { body = JSON.parse(raw || "{}"); } catch { /* */ }
      const result = createComment(db, postId, user.id, body.content);
      if (!result.ok) json(res, 400, { error: result.error }, corsHeaders(origin));
      else { saveDb(db); json(res, 200, { comment: result.comment }, corsHeaders(origin)); }
      return true;
    }
  }

  const viewMatch = url.match(/^\/api\/posts\/([^/]+)\/view$/);
  if (viewMatch && req.method === "POST") {
    const postId = decodeURIComponent(viewMatch[1]);
    const views = incrementPostView(db, postId);
    if (views == null) json(res, 404, { error: "Not found" }, corsHeaders(origin));
    else { saveDb(db); json(res, 200, { views }, corsHeaders(origin)); }
    return true;
  }

  const shareMatch = url.match(/^\/api\/posts\/([^/]+)\/share$/);
  if (shareMatch && req.method === "POST") {
    const postId = decodeURIComponent(shareMatch[1]);
    const shares = incrementPostShare(db, postId);
    if (shares == null) json(res, 404, { error: "Not found" }, corsHeaders(origin));
    else { saveDb(db); json(res, 200, { shares }, corsHeaders(origin)); }
    return true;
  }

  const postMatch = url.match(/^\/api\/posts\/([^/]+)$/);
  if (postMatch && req.method === "GET") {
    const post = getPostById(db, decodeURIComponent(postMatch[1]), user?.id ?? null);
    json(res, post ? 200 : 404, post ? { post } : { error: "Not found" }, corsHeaders(origin));
    return true;
  }

  if (url === "/api/posts/create" && req.method === "POST") {
    if (!user) { json(res, 401, { error: "Unauthorized" }, corsHeaders(origin)); return true; }
    const raw = await readBody(req);
    let body = {};
    try { body = JSON.parse(raw || "{}"); } catch { /* */ }
    const result = createPost(db, user.id, body);
    if (!result.ok) json(res, 400, { error: result.error }, corsHeaders(origin));
    else { saveDb(db); json(res, 200, { post: result.post }, corsHeaders(origin)); }
    return true;
  }

  const likeMatch = url.match(/^\/api\/posts\/([^/]+)\/like$/);
  if (likeMatch && req.method === "POST") {
    if (!user) { json(res, 401, { error: "Unauthorized" }, corsHeaders(origin)); return true; }
    const result = togglePostLike(db, user.id, likeMatch[1]);
    if (!result.ok) json(res, 404, { error: result.error }, corsHeaders(origin));
    else { saveDb(db); json(res, 200, result, corsHeaders(origin)); }
    return true;
  }

  const profileMatch = url.match(/^\/api\/users\/([^/]+)$/);
  if (profileMatch && req.method === "GET") {
    const profile = resolveProfileUser(db, decodeURIComponent(profileMatch[1]));
    if (!profile) json(res, 404, { error: "Not found" }, corsHeaders(origin));
    else {
      json(res, 200, {
        user: publicUser(profile),
        posts: getPostsByAuthor(db, profile.id, user?.id ?? null),
        following: user ? isFollowing(db, user.id, profile.id) : false,
      }, corsHeaders(origin));
    }
    return true;
  }

  const followersMatch = url.match(/^\/api\/users\/([^/]+)\/followers$/);
  if (followersMatch && req.method === "GET") {
    const profile = resolveProfileUser(db, followersMatch[1]);
    if (!profile) json(res, 404, { error: "Not found" }, corsHeaders(origin));
    else if (user && profile.id !== user.id && !user.premium) {
      json(res, 403, { error: "Premium required" }, corsHeaders(origin));
    } else json(res, 200, { users: getFollowersList(db, profile.id) }, corsHeaders(origin));
    return true;
  }

  const followingMatch = url.match(/^\/api\/users\/([^/]+)\/following$/);
  if (followingMatch && req.method === "GET") {
    const profile = resolveProfileUser(db, followingMatch[1]);
    if (!profile) json(res, 404, { error: "Not found" }, corsHeaders(origin));
    else if (user && profile.id !== user.id && !user.premium) {
      json(res, 403, { error: "Premium required" }, corsHeaders(origin));
    } else json(res, 200, { users: getFollowingList(db, profile.id) }, corsHeaders(origin));
    return true;
  }

  if (url === "/api/social/follow" && req.method === "POST") {
    if (!user) { json(res, 401, { error: "Unauthorized" }, corsHeaders(origin)); return true; }
    const raw = await readBody(req);
    let body = {};
    try { body = JSON.parse(raw || "{}"); } catch { /* */ }
    const targetId = String(body.userId ?? "");
    const result = body.unfollow ? unfollowUser(db, user.id, targetId) : followUser(db, user.id, targetId);
    if (!result.ok) json(res, 400, { error: result.error }, corsHeaders(origin));
    else { saveDb(db); json(res, 200, { ok: true, following: !body.unfollow }, corsHeaders(origin)); }
    return true;
  }

  if (url === "/api/user/paid-media-unlocks" && req.method === "GET") {
    if (!user) { json(res, 401, { error: "Unauthorized" }, corsHeaders(origin)); return true; }
    json(res, 200, { unlocks: Object.keys(db.unlockedPaidMedia?.[user.id] ?? {}) }, corsHeaders(origin));
    return true;
  }

  return false;
}

async function handleChat(req, res, url) {
  const isChatRoute =
    url === "/api/chats"
    || url === "/api/chats/start"
    || /^\/api\/chats\/[^/]+(\/messages)?$/.test(url ?? "");
  if (!isChatRoute) return false;

  const db = loadDb();
  ensureChats(db);
  const user = requireUser(req, db);
  const origin = req.headers.origin;
  if (!user) {
    json(res, 401, { error: "Unauthorized" }, corsHeaders(origin));
    return true;
  }

  if (url === "/api/chats" && req.method === "GET") {
    json(res, 200, { chats: listChats(db, user.id) }, corsHeaders(origin));
    return true;
  }

  if (url === "/api/chats/start" && req.method === "POST") {
    const raw = await readBody(req);
    let body = {};
    try { body = JSON.parse(raw || "{}"); } catch { /* */ }
    const result = startChat(db, user.id, String(body.userId ?? ""));
    if (!result.ok) json(res, 400, { error: result.error }, corsHeaders(origin));
    else { saveDb(db); json(res, 200, { chat: result.chat }, corsHeaders(origin)); }
    return true;
  }

  const messagesMatch = url.match(/^\/api\/chats\/([^/]+)\/messages$/);
  if (messagesMatch && req.method === "GET") {
    const messages = getChatMessages(db, messagesMatch[1], user.id);
    if (!messages) json(res, 404, { error: "Not found" }, corsHeaders(origin));
    else json(res, 200, { messages }, corsHeaders(origin));
    return true;
  }

  if (messagesMatch && req.method === "POST") {
    const raw = await readBody(req);
    let body = {};
    try { body = JSON.parse(raw || "{}"); } catch { /* */ }
    const result = sendChatMessage(db, messagesMatch[1], user.id, body);
    if (!result.ok) json(res, 400, { error: result.error }, corsHeaders(origin));
    else { saveDb(db); json(res, 200, { message: result.message }, corsHeaders(origin)); }
    return true;
  }

  const chatMatch = url.match(/^\/api\/chats\/([^/]+)$/);
  if (chatMatch && req.method === "GET") {
    const chat = getChat(db, chatMatch[1], user.id);
    json(res, chat ? 200 : 404, chat ? { chat } : { error: "Not found" }, corsHeaders(origin));
    return true;
  }

  return false;
}

function handleAdminMe(req, res) {
  const db = loadDb();
  ensureAdminSettings(db);
  const session = getAdminSession(req, db);
  if (!session) return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));
  return json(res, 200, { ok: true, username: db.settings.adminUsername }, corsHeaders(req.headers.origin));
}

const server = http.createServer(async (req, res) => {
  const secure = isSecureRequest(req);
  const origin = req.headers.origin;

  req.on("error", (err) => {
    if (err?.code === "ECONNRESET" || err?.message === "aborted") return;
    console.error("Request error:", err);
  });

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(origin));
    return res.end();
  }

  const url = req.url?.split("?")[0];

  try {
    if (url === "/api/health" && req.method === "GET") {
      const db = loadDb();
      ensureAdminSettings(db);
      const b2Status = isB2Configured() ? await testB2Connection() : { ok: false, error: "not_configured" };
      const dbPath = config.dbPath;
      let dbExists = false;
      let dbWritable = false;
      let dbSize = 0;
      try {
        const st = fs.statSync(dbPath);
        dbExists = true;
        dbSize = st.size;
        fs.accessSync(path.dirname(dbPath), fs.constants.W_OK);
        dbWritable = true;
      } catch { /* */ }
      const userCount = Object.values(db.users ?? {}).filter((u) => !u.deleted).length;
      return json(res, 200, {
        ok: true,
        dev: DEV_AUTH,
        cwd: process.cwd(),
        db: {
          path: dbPath,
          exists: dbExists,
          writable: dbWritable,
          size: dbSize,
          users: userCount,
          adminUsername: db.settings?.adminUsername ?? null,
        },
        env: {
          COOKIE_DOMAIN: !!envStr("COOKIE_DOMAIN"),
          B2_KEY_ID: !!envStr("B2_KEY_ID"),
          B2_APPLICATION_KEY: !!envStr("B2_APPLICATION_KEY"),
          B2_BUCKET_NAME: !!envStr("B2_BUCKET_NAME"),
          ADMIN_DEFAULT_USERNAME: !!envStr("ADMIN_DEFAULT_USERNAME"),
          ADMIN_DEFAULT_PASSWORD: !!envStr("ADMIN_DEFAULT_PASSWORD"),
          ADMIN_FORCE_RESET: envStr("ADMIN_FORCE_RESET") === "true",
          TELEGRAM_BOT_TOKEN: !!envStr("TELEGRAM_BOT_TOKEN"),
          API_PUBLIC_URL: !!envStr("API_PUBLIC_URL"),
        },
        b2: isB2Configured(),
        b2Connected: b2Status.ok,
        b2Error: b2Status.ok ? null : b2Status.error,
        b2KeyIdHint: envStr("B2_KEY_ID").slice(0, 4) || null,
        localMedia: isLocalMediaAvailable(),
        localMediaPath: localMediaRoot(),
        bot: isBotConfigured(),
        apiUrl: config.apiUrl,
      }, corsHeaders(origin));
    }
    if (url === "/api/auth/telegram" && req.method === "POST") return await handleTelegramAuth(req, res, secure);
    if (url === "/api/auth/me" && req.method === "GET") return handleMe(req, res);
    if (url === "/api/auth/logout" && req.method === "POST") return handleLogout(req, res, secure);
    if (url === "/api/auth/delete-account" && req.method === "POST") return await handleDeleteAccount(req, res, secure);
    if (url === "/api/verification/request" && req.method === "POST") return await handleVerificationRequest(req, res);
    if (url === "/api/notifications" && req.method === "GET") return handleNotifications(req, res);
    if (url === "/api/notifications/mark-read" && req.method === "POST") return await handleNotificationsMarkRead(req, res);
    if (url === "/api/reports" && req.method === "POST") return await handleReport(req, res);
    if (url === "/api/payments/invoice" && req.method === "POST") return await handleCreateInvoice(req, res);
    if (url === "/api/user/unlocks" && req.method === "GET") return handleUserUnlocks(req, res);
    if (url === "/api/profile/update" && req.method === "POST") return await handleProfileUpdate(req, res);
    if (url === "/api/telegram/webhook" && req.method === "POST") return await handleTelegramWebhook(req, res);
    if (url === "/api/storage/upload" && req.method === "POST") return await handleStorageUpload(req, res);
    if (url === "/api/wallet" && req.method === "GET") return handleWallet(req, res);
    if (url === "/api/withdrawals/request" && req.method === "POST") return await handleWithdrawalRequest(req, res);

    if (await handleSocial(req, res, url)) return;

    const mediaMatch = url?.match(/^\/api\/media\/(.+)$/);
    if (mediaMatch && req.method === "GET") {
      return await handleMediaProxy(req, res, decodeURIComponent(mediaMatch[1]));
    }

    if (await handleChat(req, res, url)) return;

    if (url === "/api/admin/login" && req.method === "POST") {
      const db = loadDb();
      ensureAdminSettings(db);
      saveDb(db);
      return await handleAdminLogin(req, res, db, secure, json, corsHeaders);
    }
    if (url === "/api/admin/logout" && req.method === "POST") {
      const db = loadDb();
      return await handleAdminLogout(req, res, db, secure, json, corsHeaders);
    }
    if (url === "/api/admin/me" && req.method === "GET") return handleAdminMe(req, res);
    if (url === "/api/admin/credentials" && req.method === "POST") {
      const db = loadDb();
      ensureAdminSettings(db);
      return await handleAdminChangeCredentials(req, res, db, secure, json, corsHeaders);
    }
    if (url === "/api/admin/stats" && req.method === "GET") {
      const db = loadDb();
      ensureAdminSettings(db);
      return await handleAdminStats(req, res, db, json, corsHeaders);
    }
    if (url === "/api/admin/action" && req.method === "POST") {
      const db = loadDb();
      ensureAdminSettings(db);
      return await handleAdminAction(req, res, db, json, corsHeaders);
    }

    if (config.serveStatic && serveStatic(req, res)) return;

    return json(res, 404, { error: "Not found" }, corsHeaders(origin));
  } catch (e) {
    if (e?.message === "Request aborted" || e?.message === "Connection closed" || e?.code === "ECONNRESET") {
      if (!res.headersSent) res.writeHead(499);
      return res.end();
    }
    console.error(e);
    return json(res, 500, { error: "Internal error" }, corsHeaders(origin));
  }
});

const dbRef = () => {
  const db = loadDb();
  ensureAdminSettings(db);
  return db;
};

startCleanupScheduler(dbRef, saveDb);

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection (server kept alive):", reason);
});

startHttpServer(server, () => {
  getDatabase();
  const db = loadDb();
  ensureAdminSettings(db);
  saveDb(db);
  ensureWebhookConfigured().catch((e) => console.error("[bot] webhook setup:", e.message));
  console.log(
    `Sheytoni API ready (env=${config.nodeEnv}, cwd=${process.cwd()}, db=${config.dbPath}, cors=${ORIGINS.join(",")})`,
  );
});
