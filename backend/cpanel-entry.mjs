/**
 * cPanel startup file — must live at application root as server.mjs
 */
import { fileURLToPath } from "node:url";
import path from "node:path";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
process.chdir(appRoot);

import "./lib/server.mjs";
