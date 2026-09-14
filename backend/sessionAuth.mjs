export const USER_SESSION_COOKIE = "sheytoni_session";
export const ADMIN_SESSION_COOKIE = "sheytoni_admin_session";

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k) out[k] = decodeURIComponent(v.join("="));
  }
  return out;
}

export function parseBearerToken(req) {
  const auth = req.headers.authorization ?? req.headers.Authorization;
  if (!auth || typeof auth !== "string") return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/** Bearer token first (cross-domain / Telegram WebView), then HttpOnly cookie */
export function resolveSessionId(req, cookieName) {
  const bearer = parseBearerToken(req);
  if (bearer) return bearer;
  const cookies = parseCookies(req.headers.cookie);
  return cookies[cookieName] ?? null;
}
