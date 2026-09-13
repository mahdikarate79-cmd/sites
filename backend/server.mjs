import http from "http";
import crypto from "crypto";
import { validateInitData } from "./validateInitData.mjs";
import {
  loadDb,
  saveDb,
  findUserByTelegramId,
  findUserById,
  createUserFromTelegram,
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
import { uploadToB2, isB2Configured } from "./b2.mjs";
import { createStarsInvoice, answerPreCheckoutQuery, verifyWebhookSecret, isBotConfigured } from "./telegramBot.mjs";
import { createNotification, getUserNotifications } from "./notifications.mjs";
import { startCleanupScheduler } from "./mediaCleanup.mjs";
import { serveStatic, staticDirExists } from "./static.mjs";
import { config } from "./config.mjs";
import { getDatabase } from "./database/init.mjs";
import { startHttpServer } from "./listen.mjs";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const DEV_AUTH = process.env.AUTH_DEV_MODE === "true";
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
const COOKIE_NAME = "sheytoni_session";
const ORIGINS = config.corsOrigins;

const PLANS = { "1m": { months: 1, stars: 100 }, "6m": { months: 6, stars: 300 }, "1y": { months: 12, stars: 500 } };

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
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, { "Content-Type": "application/json", ...extraHeaders });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
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
  const cookies = parseCookies(req.headers.cookie);
  const sid = cookies[COOKIE_NAME];
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
    user = createUserFromTelegram(db, tgUser);
    db.users[user.id] = user;
  } else {
    if (tgUser.photo_url) user.avatar = tgUser.photo_url;
    touchUserActivity(db, user.id);
  }

  if (user.banned) return json(res, 403, { error: "Account banned" }, corsHeaders(req.headers.origin));

  const session = createSession(user.id, tgUser.id);
  db.sessions[session.id] = session;
  saveDb(db);

  return json(res, 200, { user: publicUser(user), loginMethod: "telegram" }, {
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
    delete db.sessions[session.id];
    saveDb(db);
    return json(res, 200, { user: null, loginMethod: "guest" }, corsHeaders(req.headers.origin));
  }

  touchUserActivity(db, user.id);
  saveDb(db);
  return json(res, 200, {
    user: publicUser(user),
    loginMethod: "telegram",
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
  if ((user.followers ?? 0) < minFollowers) {
    return json(res, 400, { error: `Minimum ${minFollowers} followers required` }, corsHeaders(req.headers.origin));
  }

  const id = `vr_${crypto.randomBytes(8).toString("hex")}`;
  const request = {
    id,
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    followers: user.followers,
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
  return json(res, 200, { notifications: getUserNotifications(db, user.id) }, corsHeaders(req.headers.origin));
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
    stars = Math.max(1, Math.min(25000, Number(body.amount) || 0));
    title = "Sheytoni Stars";
    description = `Purchase ${stars} Stars`;
    meta = { type: "stars", amount: stars };
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

  const invoiceUrl = await createStarsInvoice({ title, description, payload: intentId, amount: stars });
  return json(res, 200, { invoiceUrl, intentId }, corsHeaders(req.headers.origin));
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
    await answerPreCheckoutQuery(q.id, ok, ok ? undefined : "Invalid payment");
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
          const exp = new Date();
          exp.setMonth(exp.getMonth() + plan.months);
          user.premiumExpiresAt = exp.toISOString();
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
  if (!isB2Configured()) return json(res, 503, { error: "Storage not configured" }, corsHeaders(req.headers.origin));

  const raw = await readBody(req);
  let body = {};
  try { body = JSON.parse(raw || "{}"); } catch {
    return json(res, 400, { error: "Invalid body" }, corsHeaders(req.headers.origin));
  }

  const { data, contentType, category } = body;
  if (!data || !contentType) return json(res, 400, { error: "Missing data" }, corsHeaders(req.headers.origin));

  const buffer = Buffer.from(data, "base64");
  const maxSize = user.premium ? 1024 * 1024 * 1024 : 10 * 1024 * 1024;
  if (buffer.length > maxSize) return json(res, 400, { error: "File too large" }, corsHeaders(req.headers.origin));

  const ext = contentType.includes("video") ? ".mp4" : contentType.includes("gif") ? ".gif" : ".jpg";
  const objectKey = `${category ?? "post"}/${user.id}/${crypto.randomBytes(16).toString("hex")}${ext}`;
  const uploaded = await uploadToB2(objectKey, buffer, contentType);
  db.mediaObjects[objectKey] = { ...uploaded, userId: user.id, createdAt: new Date().toISOString() };
  saveDb(db);
  return json(res, 200, { objectKey, url: uploaded.url, size: uploaded.size }, corsHeaders(req.headers.origin));
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
  if (body.avatar) user.avatar = String(body.avatar);
  if (body.cover !== undefined) user.cover = body.cover ? String(body.cover) : undefined;

  if (body.username !== undefined) {
    const nextUsername = String(body.username).trim().toLowerCase();
    const currentUsername = (user.username ?? "").toLowerCase();
    if (nextUsername && nextUsername !== currentUsername) {
      if (!usernameAvailable(db, nextUsername)) {
        return json(res, 409, { error: "Username taken" }, corsHeaders(req.headers.origin));
      }
      if (user.verified) user.verified = false;
      user.username = nextUsername;
      user.usernameSet = true;
    }
  }

  saveDb(db);
  return json(res, 200, { user: publicUser(user) }, corsHeaders(req.headers.origin));
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
  if ((user.earnings ?? 0) < stars) return json(res, 402, { error: "Insufficient earnings" }, corsHeaders(req.headers.origin));

  user.earnings = (user.earnings ?? 0) - stars;
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
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  saveDb(db);
  return json(res, 200, { ok: true, id }, corsHeaders(req.headers.origin));
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

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(origin));
    return res.end();
  }

  const url = req.url?.split("?")[0];

  try {
    if (url === "/api/health" && req.method === "GET") {
      return json(res, 200, { ok: true, dev: DEV_AUTH, b2: isB2Configured(), bot: isBotConfigured() }, corsHeaders(origin));
    }
    if (url === "/api/auth/telegram" && req.method === "POST") return handleTelegramAuth(req, res, secure);
    if (url === "/api/auth/me" && req.method === "GET") return handleMe(req, res);
    if (url === "/api/auth/logout" && req.method === "POST") return handleLogout(req, res, secure);
    if (url === "/api/auth/delete-account" && req.method === "POST") return handleDeleteAccount(req, res, secure);
    if (url === "/api/verification/request" && req.method === "POST") return handleVerificationRequest(req, res);
    if (url === "/api/notifications" && req.method === "GET") return handleNotifications(req, res);
    if (url === "/api/payments/invoice" && req.method === "POST") return handleCreateInvoice(req, res);
    if (url === "/api/profile/update" && req.method === "POST") return handleProfileUpdate(req, res);
    if (url === "/api/telegram/webhook" && req.method === "POST") return handleTelegramWebhook(req, res);
    if (url === "/api/storage/upload" && req.method === "POST") return handleStorageUpload(req, res);
    if (url === "/api/withdrawals/request" && req.method === "POST") return handleWithdrawalRequest(req, res);

    if (url === "/api/admin/login" && req.method === "POST") {
      const db = loadDb();
      ensureAdminSettings(db);
      return handleAdminLogin(req, res, db, secure, json, corsHeaders);
    }
    if (url === "/api/admin/logout" && req.method === "POST") {
      const db = loadDb();
      return handleAdminLogout(req, res, db, secure, json, corsHeaders);
    }
    if (url === "/api/admin/me" && req.method === "GET") return handleAdminMe(req, res);
    if (url === "/api/admin/credentials" && req.method === "POST") {
      const db = loadDb();
      ensureAdminSettings(db);
      return handleAdminChangeCredentials(req, res, db, secure, json, corsHeaders);
    }
    if (url === "/api/admin/stats" && req.method === "GET") {
      const db = loadDb();
      ensureAdminSettings(db);
      return handleAdminStats(req, res, db, json, corsHeaders);
    }
    if (url === "/api/admin/action" && req.method === "POST") {
      const db = loadDb();
      ensureAdminSettings(db);
      return handleAdminAction(req, res, db, json, corsHeaders);
    }

    if (config.serveStatic && serveStatic(req, res)) return;

    return json(res, 404, { error: "Not found" }, corsHeaders(origin));
  } catch (e) {
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

startHttpServer(server, () => {
  getDatabase();
  const db = loadDb();
  ensureAdminSettings(db);
  saveDb(db);
  console.log(
    `Sheytoni API ready (env=${config.nodeEnv}, cwd=${process.cwd()}, cors=${ORIGINS.join(",")})`,
  );
});
