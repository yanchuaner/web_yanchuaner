const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");
const Database = require("better-sqlite3");

const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
const allowed = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const warningBytes = 2 * 1024 * 1024;

function readReferencedUploads() {
  const rawDbPath = (process.env.DATABASE_URL || "file:./prisma/dev.db").replace(/^file:/, "");
  const dbPath = path.isAbsolute(rawDbPath) ? rawDbPath : path.resolve(process.cwd(), rawDbPath);
  if (!fs.existsSync(dbPath)) return { dbPath, references: null };

  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    const references = new Set();
    const sources = [
      ["News", "imageUrl"],
      ["Event", "coverImage"],
      ["MemoryItem", "imagePath"],
    ];
    for (const [table, column] of sources) {
      const tableExists = db.prepare(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
      ).get(table);
      if (!tableExists) continue;
      const rows = db.prepare(
        `SELECT ${column} AS imagePath FROM ${table} WHERE ${column} LIKE '/uploads/%'`,
      ).all();
      for (const row of rows) references.add(path.basename(row.imagePath));
    }
    return { dbPath, references };
  } finally {
    db.close();
  }
}

async function main() {
  if (!fs.existsSync(uploadDir)) {
    console.log(`Image audit: ${uploadDir} does not exist; 0 files.`);
    return;
  }

  const files = fs.readdirSync(uploadDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && allowed.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.join(uploadDir, entry.name));
  const { dbPath, references } = readReferencedUploads();

  let totalBytes = 0;
  let oversized = 0;
  for (const file of files) {
    const stats = fs.statSync(file);
    const metadata = await sharp(file).metadata();
    totalBytes += stats.size;
    if (stats.size > warningBytes) oversized += 1;
    console.log(JSON.stringify({
      file: path.basename(file),
      bytes: stats.size,
      width: metadata.width || null,
      height: metadata.height || null,
      format: metadata.format || null,
      oversized: stats.size > warningBytes,
      referenced: references ? references.has(path.basename(file)) : null,
    }));
  }

  console.log(JSON.stringify({
    summary: true,
    directory: uploadDir,
    files: files.length,
    totalBytes,
    oversized,
    warningBytes,
    database: references ? dbPath : null,
    orphanCandidates: references
      ? files.filter((file) => !references.has(path.basename(file))).map((file) => path.basename(file))
      : null,
  }));
}

main().catch((error) => {
  console.error("Image audit failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
