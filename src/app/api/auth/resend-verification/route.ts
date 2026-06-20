import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  createOneTimeToken,
  normalizeEmail,
  readJsonBody,
  validEmail,
} from "@/lib/auth-utils";
import { sendVerificationEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const GENERIC_MESSAGE =
  "如果该邮箱对应未验证账号，我们会发送一封新的验证邮件。";

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody<{ email?: unknown }>(req, 4096);
    const email = normalizeEmail(body.email);
    const [ipLimit, emailLimit] = await Promise.all([
      rateLimit(`resend-verification:ip:${getClientIp(req)}`, 5, 60_000),
      rateLimit(`resend-verification:email:${email}`, 3, 15 * 60_000),
    ]);
    if (!ipLimit.ok || !emailLimit.ok) {
      return NextResponse.json(
        { message: GENERIC_MESSAGE },
        { status: 202 },
      );
    }
    if (!validEmail(email)) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified || user.accountStatus !== "ACTIVE") {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }
    const verification = createOneTimeToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyTokenHash: verification.hash,
        emailVerifyExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    await sendVerificationEmail(email, verification.token);
    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }
}
