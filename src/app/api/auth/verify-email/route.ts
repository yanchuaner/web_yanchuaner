import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashToken, readJsonBody } from "@/lib/auth-utils";
import { getClientIp, emailLimiter } from "@/lib/rate-limit";
import { resolveWebAccountState } from "@/lib/web-account-state";
import { upsertRosterEntry } from "@/lib/roster";

export async function POST(req: NextRequest) {
  // 使用 Upstash Redis 对邀请验证接口限流（1次/分钟，单日10次），无 Redis 时自动降级为内存限流
  // TODO: 生产环境请配置 UPSTASH_REDIS_REST_URL 和 UPSTASH_REDIS_REST_TOKEN 环境变量
  const limiterResult = await emailLimiter.limit(getClientIp(req));
  if (!limiterResult.success) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429, headers: { "Retry-After": String(limiterResult.retryAfter) } });
  }
  try {
    const body = await readJsonBody<{ token?: unknown }>(req, 4096);
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
    const updated = await prisma.$transaction(async (tx) => {
      const verified = await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          emailVerifyTokenHash: null,
          emailVerifyExpiresAt: null,
        },
      });
      if (
        verified.verificationMethod === "INTERNAL_CODE" &&
        resolveWebAccountState(verified) === "ACTIVE" &&
        verified.name
      ) {
        await upsertRosterEntry(tx, {
          name: verified.name,
          graduationClass: verified.graduationClass,
          className: verified.className,
          email: verified.email,
          contact: verified.contact,
        });
      }
      return verified;
    });
    return NextResponse.json({
      success: true,
      accountState: resolveWebAccountState(updated),
      account: {
        name: updated.name,
        graduationClass: updated.graduationClass,
        className: updated.className,
      },
    });
  } catch {
    return NextResponse.json({ error: "邮箱验证失败" }, { status: 500 });
  }
}
