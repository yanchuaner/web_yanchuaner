import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  createOneTimeToken,
  normalizeEmail,
  readJsonBody,
  validEmail,
} from "@/lib/auth-utils";
import { sendPasswordResetEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const MESSAGE = "如果该邮箱已注册，我们会发送密码重置邮件。";

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<{ email?: unknown }>(req, 4096);
    const email = normalizeEmail(body.email);
    const [ipLimit, emailLimit] = await Promise.all([
      rateLimit(`forgot-password:ip:${getClientIp(req)}`, 5, 60_000),
      rateLimit(`forgot-password:email:${email}`, 3, 15 * 60_000),
    ]);
    if (!ipLimit.ok || !emailLimit.ok || !validEmail(email)) {
      return NextResponse.json({ message: MESSAGE });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || user.accountStatus !== "ACTIVE") {
      return NextResponse.json({ message: MESSAGE });
    }
    const reset = createOneTimeToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: reset.hash,
        passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await sendPasswordResetEmail(email, reset.token);
    return NextResponse.json({ message: MESSAGE });
  } catch {
    return NextResponse.json({ message: MESSAGE });
  }
}
