import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { copyFile, mkdir } from "fs/promises";
import { requireAdmin } from "@/lib/admin-auth";
import {
  MAX_UPLOAD_BYTES,
  getBackupDir,
  isImageMime,
  processToCard16x9,
} from "@/lib/image-pipeline";

export const runtime = "nodejs";

const CARD_PUBLIC_PATH = path.join(process.cwd(), "public", "card.jpg");

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请上传文件" }, { status: 400 });
  }
  if (!isImageMime(file.type)) {
    return NextResponse.json({ error: "仅支持图片格式" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "文件超过 10MB" }, { status: 400 });
  }

  try {
    const ts = Date.now();
    const backupDir = getBackupDir();
    await mkdir(backupDir, { recursive: true });

    let backupRel: string | null = null;
    if (fs.existsSync(CARD_PUBLIC_PATH)) {
      const backupPath = path.join(backupDir, `card-${ts}.jpg`);
      await copyFile(CARD_PUBLIC_PATH, backupPath);
      backupRel = path.relative(process.cwd(), backupPath).replace(/\\/g, "/");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processToCard16x9(buffer, CARD_PUBLIC_PATH);

    return NextResponse.json({
      success: true,
      url: "/card.jpg",
      backup: backupRel,
      width: result.width,
      height: result.height,
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "INVALID_OR_TOO_SMALL") {
      return NextResponse.json(
        { error: "图片无效或尺寸过小（最小 320×180）" },
        { status: 400 },
      );
    }
    console.error("card-bg upload error:", msg);
    return NextResponse.json({ error: "处理失败，请重试" }, { status: 500 });
  }
}
