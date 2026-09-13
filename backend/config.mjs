/**
 * Central config — all values from environment variables in production.
 */
export const config = {
  siteUrl: process.env.SITE_URL ?? "https://x.venify.xyz",
  port: Number(process.env.PORT ?? process.env.AUTH_PORT ?? 8787),
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
