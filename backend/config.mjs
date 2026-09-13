/**
 * Central config — all values from environment variables in production.
 */
function resolvePort() {
  const raw = process.env.PORT ?? process.env.AUTH_PORT;
  if (raw !== undefined && String(raw).trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
    console.warn(`[config] Invalid PORT="${raw}" — check cPanel Environment Variables`);
  }
  if (process.env.NODE_ENV === "production") {
    console.warn("[config] PORT not set — cPanel usually injects this; app may return 503");
  }
  return 8787;
}

export const config = {
  siteUrl: process.env.SITE_URL ?? "https://x.venify.xyz",
  port: resolvePort(),
  host: process.env.HOST ?? "0.0.0.0",
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigins: (process.env.CORS_ORIGINS ?? "https://x.venify.xyz")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  /** e.g. .venify.xyz — required for cookies across x.venify.xyz ↔ api.venify.xyz */
  cookieDomain: process.env.COOKIE_DOMAIN ?? "",
  serveStatic: process.env.SERVE_STATIC === "true",
  staticDir: process.env.STATIC_DIR ?? "out",
  dbPath: process.env.DATABASE_PATH ?? "data/sheytoni.db",
  isProduction: process.env.NODE_ENV === "production",
};
