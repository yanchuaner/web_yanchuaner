import sharp from "sharp";
import { mkdir, writeFile, rename, unlink } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export const CARD_TARGET_WIDTH = 2752;
export const CARD_TARGET_HEIGHT = 1548;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type ProcessResult = { width: number; height: number; bytes: number };

export async function processToCard16x9(
  buffer: Buffer,
  destPath: string,
): Promise<ProcessResult> {
  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height || meta.width < 320 || meta.height < 180) {
    throw new Error("INVALID_OR_TOO_SMALL");
  }

  const dir = path.dirname(destPath);
  await mkdir(dir, { recursive: true });

  const tmpPath = `${destPath}.${randomBytes(6).toString("hex")}.tmp`;
  const out = await sharp(buffer)
    .rotate()
    .resize({
      width: CARD_TARGET_WIDTH,
      height: CARD_TARGET_HEIGHT,
      fit: "cover",
      position: "centre",
    })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  await writeFile(tmpPath, out);
  try {
    await rename(tmpPath, destPath);
  } catch (e) {
    await unlink(tmpPath).catch(() => {});
    throw e;
  }

  return {
    width: CARD_TARGET_WIDTH,
    height: CARD_TARGET_HEIGHT,
    bytes: out.byteLength,
  };
}

export function getDataDir(): string {
  return process.env.UPLOAD_DIR
    ? path.dirname(process.env.UPLOAD_DIR)
    : path.join(process.cwd(), "data");
}

export function getUploadDir(): string {
  return (
    process.env.UPLOAD_DIR ||
    path.join(process.cwd(), "public", "uploads")
  );
}

export function getBackupDir(): string {
  return (
    process.env.BACKUP_DIR ||
    path.join(getDataDir(), "backups")
  );
}

export function isImageMime(mime: string | null | undefined): boolean {
  return !!mime && ALLOWED_UPLOAD_MIME_TYPES.has(mime);
}
