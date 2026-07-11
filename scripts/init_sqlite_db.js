const fs = require("fs");
const path = require("path");
require("dotenv/config");

if (process.env.NODE_ENV === "production") {
  throw new Error("db:init is disabled in production; use the documented migration flow");
}

const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
if (!databaseUrl.startsWith("file:")) {
  throw new Error("db:init only supports a SQLite file: DATABASE_URL");
}

const configuredPath = databaseUrl.slice("file:".length).split("?", 1)[0];
if (!configuredPath) {
  throw new Error("DATABASE_URL must include a SQLite file path");
}

const databasePath = path.isAbsolute(configuredPath)
  ? configuredPath
  : path.resolve(process.cwd(), configuredPath);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

if (fs.existsSync(databasePath)) {
  if (!fs.statSync(databasePath).isFile()) {
    throw new Error(`Database path is not a file: ${databasePath}`);
  }
  console.log(`[db:init] Existing SQLite database: ${databasePath}`);
} else {
  fs.closeSync(fs.openSync(databasePath, "wx", 0o600));
  console.log(`[db:init] Created empty SQLite database: ${databasePath}`);
}
