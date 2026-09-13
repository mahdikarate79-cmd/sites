import fs from "fs";
import path from "path";

/** Load .env from app root — cPanel UI vars take precedence */
export function loadEnvFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!key || process.env[key] !== undefined) continue;
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"'))
        || (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {
    /* optional file */
  }
}

export function envStr(key, fallback = "") {
  const raw = process.env[key];
  if (raw === undefined || raw === null) return fallback;
  const val = String(raw).trim();
  if (
    (val.startsWith('"') && val.endsWith('"'))
    || (val.startsWith("'") && val.endsWith("'"))
  ) {
    return val.slice(1, -1).trim();
  }
  return val;
}
