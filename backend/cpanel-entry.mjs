/**
 * cPanel startup file — must live at application root as server.mjs
 *
 * IMPORTANT: use dynamic import() so process.chdir() runs BEFORE the API boots.
 * Static `import` is hoisted and would open SQLite in the wrong directory.
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { loadEnvFile } from "./lib/env.mjs";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

process.chdir(appRoot);

// Fallback when cPanel UI env is missing — create .env next to server.mjs
loadEnvFile(path.join(appRoot, ".env"));

const dataDir = path.join(appRoot, "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbRel = process.env.DATABASE_PATH?.trim() || "data/sheytoni.db";
if (!path.isAbsolute(dbRel)) {
  process.env.DATABASE_PATH = path.join(appRoot, dbRel);
}

await import("./lib/server.mjs");
