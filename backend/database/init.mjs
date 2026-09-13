import fs from "fs";
import path from "path";
import Database from "./sqlite.mjs";
import { config } from "../config.mjs";
import { SCHEMA_SQL } from "./schema.mjs";
import { importJsonStoreIfNeeded } from "./migrate-json.mjs";

let dbInstance = null;

export function getDatabase() {
  if (dbInstance) return dbInstance;

  const dbPath = path.isAbsolute(config.dbPath)
    ? config.dbPath
    : path.join(process.cwd(), config.dbPath);

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  dbInstance = new Database(dbPath);
  dbInstance.pragma("journal_mode = WAL");
  dbInstance.pragma("foreign_keys = ON");
  dbInstance.exec(SCHEMA_SQL);

  const version = dbInstance.prepare("SELECT MAX(version) as v FROM schema_migrations").get()?.v ?? 0;
  if (!version) {
    dbInstance.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(1, new Date().toISOString());
  }

  const userCols = dbInstance.prepare("PRAGMA table_info(users)").all();
  if (!userCols.some((c) => c.name === "fake_followers")) {
    dbInstance.exec("ALTER TABLE users ADD COLUMN fake_followers INTEGER DEFAULT 0");
    dbInstance.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(2, new Date().toISOString());
  }

  importJsonStoreIfNeeded(dbInstance);
  return dbInstance;
}

export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
