/**
 * Load better-sqlite3 from application root — reliable on cPanel ESM + Node 20.
 * Native CJS package; createRequire avoids ERR_MODULE_NOT_FOUND from nested lib/ paths.
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(appRoot, "package.json"));

let Database;
try {
  Database = require("better-sqlite3");
} catch (err) {
  console.error(`[sqlite] Cannot load better-sqlite3 (app root: ${appRoot})`);
  console.error("[sqlite] Fix: cd", appRoot, "&& npm install --production && npm rebuild better-sqlite3");
  throw err;
}

export default Database;
