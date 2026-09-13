/**
 * Central config — all values from environment variables in production.
 * cPanel/Passenger often omits PORT; server uses listen("passenger") instead.
 */
import { envStr } from "./env.mjs";

function resolvePort() {
  for (const key of ["PORT", "PASSENGER_LISTEN_PORT", "NODE_PORT", "AUTH_PORT"]) {
    const raw = process.env[key];
    if (raw !== undefined && String(raw).trim() !== "") {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

export const config = {
  siteUrl: envStr("SITE_URL", "https://x.venify.xyz"),
  apiUrl: envStr("API_PUBLIC_URL") || envStr("SITE_URL", "https://x.venify.xyz").replace("x.", "api.") || "https://api.venify.xyz",
  port: resolvePort(),
  host: envStr("HOST", "0.0.0.0"),
  nodeEnv: envStr("NODE_ENV", "development"),
  corsOrigins: envStr("CORS_ORIGINS", "https://x.venify.xyz")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  /** e.g. .venify.xyz — required for cookies across x.venify.xyz ↔ api.venify.xyz */
  cookieDomain: envStr("COOKIE_DOMAIN"),
  serveStatic: envStr("SERVE_STATIC") === "true",
  staticDir: envStr("STATIC_DIR", "out"),
  dbPath: envStr("DATABASE_PATH", "data/sheytoni.db"),
  isProduction: envStr("NODE_ENV", "development") === "production",
};
