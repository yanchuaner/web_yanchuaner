import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  BCRYPT_COST,
  hashToken,
  readJsonBody,
  validPassword,
} from "@/lib/auth-utils";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limit = await rateLimit(`reset-password:${getClientIp(req)}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }
  try {
    const body = await readJsonBody<{
      token?: unknown;
      password?: unknown;
      confirmPassword?: unknown;
    }>(req, 4096);
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (
      !token ||
      token.length > 256 ||
      !validPassword(password) ||
      password !== body.confirmPassword
    ) {
      return NextResponse.json({ error: "重置资料无效" }, { status: 400 });
    }
    const user = await prisma.user.findFirst({
      where: { passwordResetTokenHash: hashToken(token) },
    });
    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt <= new Date()
    ) {
      return NextResponse.json({ error: "重置链接无效或已过期" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hash(password, BCRYPT_COST),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        sessionVersion: { increment: 1 },
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "密码重置失败" }, { status: 500 });
  }
}
