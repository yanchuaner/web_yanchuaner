import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { randomBytes } from "crypto";
import {
  MAX_UPLOAD_BYTES,
  getUploadDir,
  isImageMime,
  processToCard16x9,
} from "@/lib/image-pipeline";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await rateLimit(`upload-bg:${ip}`, 6, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "上传过于频繁，请稍后再试" },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      },
    );
  }

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
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `bg-${Date.now()}-${randomBytes(4).toString("hex")}.jpg`;
    const destPath = path.join(getUploadDir(), filename);
    const result = await processToCard16x9(buffer, destPath);
    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
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
    console.error("upload-bg error:", msg);
    return NextResponse.json({ error: "处理失败，请重试" }, { status: 500 });
  }
}
