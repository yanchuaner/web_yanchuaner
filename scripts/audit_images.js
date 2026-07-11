const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
const allowed = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const warningBytes = 2 * 1024 * 1024;

async function main() {
  if (!fs.existsSync(uploadDir)) {
    console.log(`Image audit: ${uploadDir} does not exist; 0 files.`);
    return;
  }

  const files = fs.readdirSync(uploadDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && allowed.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.join(uploadDir, entry.name));

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
    }));
  }

  console.log(JSON.stringify({
    summary: true,
    directory: uploadDir,
    files: files.length,
    totalBytes,
    oversized,
    warningBytes,
  }));
}

main().catch((error) => {
  console.error("Image audit failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
