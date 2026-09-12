/**
 * Central site config — change domain here via .env without touching code.
 */
export const config = {
  siteUrl: process.env.SITE_URL ?? "https://x.venify.xyz",
  port: Number(process.env.PORT ?? process.env.AUTH_PORT ?? 3000),
  host: process.env.HOST ?? "0.0.0.0",
  corsOrigins: (process.env.CORS_ORIGINS ?? process.env.SITE_URL ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  staticDir: process.env.STATIC_DIR ?? "out",
  dbPath: process.env.DATABASE_PATH ?? "backend/data/sheytoni.db",
};
