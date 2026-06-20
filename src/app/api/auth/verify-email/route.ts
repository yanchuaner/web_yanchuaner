import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashToken } from "@/lib/auth-utils";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limit = await rateLimit(`verify-email:${getClientIp(req)}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }
  try {
    const body = (await req.json()) as { token?: unknown };
    const token = typeof body.token === "string" ? body.token : "";
    if (!token || token.length > 256) {
      return NextResponse.json({ error: "验证链接无效" }, { status: 400 });
    }
    const user = await prisma.user.findFirst({
      where: { emailVerifyTokenHash: hashToken(token) },
    });
    if (!user) {
      return NextResponse.json(
        { success: true, alreadyUsed: true, message: "链接已使用或无效" },
      );
    }
    if (!user.emailVerifyExpiresAt || user.emailVerifyExpiresAt <= new Date()) {
      return NextResponse.json({ error: "验证链接已过期" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerifyTokenHash: null,
        emailVerifyExpiresAt: null,
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "邮箱验证失败" }, { status: 500 });
  }
}
