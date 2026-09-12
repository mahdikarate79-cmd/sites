import http from "http";
import { validateInitData } from "./validateInitData.mjs";
import {
  loadDb,
  saveDb,
  findUserByTelegramId,
  findUserById,
  createUserFromTelegram,
  createSession,
  deleteSessionsForUser,
  deleteAccount,
  publicUser,
} from "./db.mjs";

const PORT = Number(process.env.AUTH_PORT ?? 8787);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const DEV_AUTH = process.env.AUTH_DEV_MODE === "true";
const COOKIE_NAME = "sheytoni_session";
const ORIGINS = (process.env.CORS_ORIGINS ?? "http://localhost:3000,https://mahdikarate79-cmd.github.io").split(",");

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
  const allowed = ORIGINS.some((o) => origin?.startsWith(o.replace(/\/$/, "")));
  const o = allowed ? origin : ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": o,
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

function sessionCookie(sessionId, secure) {
  const parts = [
    `${COOKIE_NAME}=${sessionId}`,
    "HttpOnly",
    "Path=/",
    "Max-Age=2592000",
    secure ? "Secure" : "",
    secure ? "SameSite=None" : "SameSite=Lax",
  ].filter(Boolean);
  return parts.join("; ");
}

function clearCookie(secure) {
  const parts = [`${COOKIE_NAME}=`, "HttpOnly", "Path=/", "Max-Age=0", secure ? "Secure" : "", secure ? "SameSite=None" : "SameSite=Lax"].filter(Boolean);
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

function parseTelegramUser(initData) {
  if (BOT_TOKEN) {
    return validateInitData(initData, BOT_TOKEN);
  }
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
    const body = JSON.parse(raw || "{}");
    initData = body.initData ?? "";
  } catch {
    return json(res, 400, { error: "Invalid body" }, corsHeaders(req.headers.origin));
  }

  const tgUser = parseTelegramUser(initData);
  if (!tgUser) {
    return json(res, 401, { error: "Invalid initData" }, corsHeaders(req.headers.origin));
  }

  const db = loadDb();
  const existingSession = getSession(req, db);

  if (existingSession && existingSession.telegramId !== tgUser.id) {
    delete db.sessions[existingSession.id];
  }

  let user = findUserByTelegramId(db, tgUser.id);
  if (!user) {
    user = createUserFromTelegram(db, tgUser);
    db.users[user.id] = user;
  } else {
    user.displayName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || user.displayName;
    if (tgUser.photo_url) user.avatar = tgUser.photo_url;
    if (tgUser.username) user.username = tgUser.username.toLowerCase();
  }

  const session = createSession(user.id, tgUser.id);
  db.sessions[session.id] = session;
  saveDb(db);

  const headers = {
    ...corsHeaders(req.headers.origin),
    "Set-Cookie": sessionCookie(session.id, secure),
  };

  return json(res, 200, { user: publicUser(user), loginMethod: "telegram" }, headers);
}

function handleMe(req, res) {
  const db = loadDb();
  const session = getSession(req, db);
  if (!session) {
    return json(res, 200, { user: null, loginMethod: "guest" }, corsHeaders(req.headers.origin));
  }

  const user = findUserById(db, session.userId);
  if (!user || session.telegramId !== user.telegramId) {
    delete db.sessions[session.id];
    saveDb(db);
    return json(res, 200, { user: null, loginMethod: "guest" }, corsHeaders(req.headers.origin));
  }

  return json(res, 200, { user: publicUser(user), loginMethod: "telegram" }, corsHeaders(req.headers.origin));
}

function handleLogout(req, res, secure) {
  const db = loadDb();
  const session = getSession(req, db);
  if (session) delete db.sessions[session.id];
  saveDb(db);
  return json(res, 200, { ok: true }, {
    ...corsHeaders(req.headers.origin),
    "Set-Cookie": clearCookie(secure),
  });
}

const PLANS = { "1m": { months: 1, stars: 100 }, "6m": { months: 6, stars: 300 }, "1y": { months: 12, stars: 500 } };

async function handlePremiumPurchase(req, res) {
  const db = loadDb();
  const session = getSession(req, db);
  if (!session) {
    return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));
  }

  const user = findUserById(db, session.userId);
  if (!user) return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));

  const raw = await readBody(req);
  let planId = "6m";
  try {
    planId = JSON.parse(raw || "{}").planId ?? "6m";
  } catch { /* default */ }

  const plan = PLANS[planId];
  if (!plan) return json(res, 400, { error: "Invalid plan" }, corsHeaders(req.headers.origin));

  if ((user.starBalance ?? 0) < plan.stars) {
    return json(res, 402, { error: "Insufficient stars" }, corsHeaders(req.headers.origin));
  }

  user.starBalance = (user.starBalance ?? 0) - plan.stars;
  user.premium = true;
  const expires = new Date();
  expires.setMonth(expires.getMonth() + plan.months);
  user.premiumExpiresAt = expires.toISOString();
  saveDb(db);

  return json(res, 200, { user: publicUser(user) }, corsHeaders(req.headers.origin));
}

async function handleDeleteAccount(req, res, secure) {
  const db = loadDb();
  const session = getSession(req, db);
  if (!session) {
    return json(res, 401, { error: "Unauthorized" }, corsHeaders(req.headers.origin));
  }

  deleteAccount(db, session.userId);
  delete db.sessions[session.id];
  saveDb(db);

  return json(res, 200, { ok: true }, {
    ...corsHeaders(req.headers.origin),
    "Set-Cookie": clearCookie(secure),
  });
}

const server = http.createServer(async (req, res) => {
  const secure = req.headers["x-forwarded-proto"] === "https" || process.env.NODE_ENV === "production";
  const origin = req.headers.origin;

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(origin));
    return res.end();
  }

  const url = req.url?.split("?")[0];

  try {
    if (url === "/api/health" && req.method === "GET") {
      return json(res, 200, { ok: true, dev: DEV_AUTH }, corsHeaders(origin));
    }
    if (url === "/api/auth/telegram" && req.method === "POST") {
      return handleTelegramAuth(req, res, secure);
    }
    if (url === "/api/auth/me" && req.method === "GET") {
      return handleMe(req, res);
    }
    if (url === "/api/auth/logout" && req.method === "POST") {
      return handleLogout(req, res, secure);
    }
    if (url === "/api/auth/delete-account" && req.method === "POST") {
      return handleDeleteAccount(req, res, secure);
    }
    if (url === "/api/premium/purchase" && req.method === "POST") {
      return handlePremiumPurchase(req, res);
    }
    return json(res, 404, { error: "Not found" }, corsHeaders(origin));
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: "Internal error" }, corsHeaders(origin));
  }
});

server.listen(PORT, () => {
  console.log(`Sheytoni auth server on :${PORT} (dev=${DEV_AUTH}, token=${BOT_TOKEN ? "set" : "missing"})`);
});
