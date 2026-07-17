import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  BCRYPT_COST,
  createOneTimeToken,
  normalizeEmail,
  normalizeUsername,
  readJsonBody,
  USERNAME_PATTERN,
  validEmail,
  validPassword,
} from "@/lib/auth-utils";
import { sendVerificationEmail } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import {
  normalizeClassName,
  normalizeGraduationClass,
  normalizeIdentityName,
  validClassName,
  validGraduationClass,
} from "@/lib/identity-fields";
import {
  REGISTRATION_POLICY_ID,
  verifyRegistrationAccessCode,
} from "@/lib/registration-policy";

type RegisterBody = {
  username?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
  email?: unknown;
  name?: unknown;
  graduationClass?: unknown;
  className?: unknown;
  contact?: unknown;
  internalCode?: unknown;
};

export async function POST(req: NextRequest) {
  const ipLimit = await rateLimit(`register:${getClientIp(req)}`, 5, 60_000);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } },
    );
  }

  try {
    const body = await readJsonBody<RegisterBody>(req);
    const username = normalizeUsername(body.username);
    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword =
      typeof body.confirmPassword === "string" ? body.confirmPassword : "";
    const name = normalizeIdentityName(body.name);
    const graduationClass = normalizeGraduationClass(body.graduationClass);
    const className = normalizeClassName(body.className);
    const contact =
      typeof body.contact === "string" ? body.contact.trim() : "";

    if (!USERNAME_PATTERN.test(username)) {
      return NextResponse.json(
        { error: "用户名需为 1-32 位中文、英文字母、数字、下划线或短横线" },
        { status: 400 },
      );
    }
    if (!validEmail(email) || !validPassword(password)) {
      return NextResponse.json(
        { error: "邮箱格式无效，或密码长度不在 8-64 位之间" },
        { status: 400 },
      );
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "两次输入的密码不一致" }, { status: 400 });
    }
    if (
      !name ||
      name.length > 64 ||
      !validGraduationClass(graduationClass) ||
      !validClassName(className) ||
      contact.length > 128
    ) {
      return NextResponse.json(
        { error: "注册资料格式无效：届别需为2025起的四位年份数字，班级需为1-99的数字" },
        { status: 400 },
      );
    }

    const policy = await prisma.registrationPolicy.findUnique({
      where: { id: REGISTRATION_POLICY_ID },
      select: {
        accessCodeEnabled: true,
        accessCodeHash: true,
        accessCodeHint: true,
      },
    });
    const [passwordHash, accessCodeAccepted] = await Promise.all([
      hash(password, BCRYPT_COST),
      verifyRegistrationAccessCode(body.internalCode, policy),
    ]);
    const verification = createOneTimeToken();
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username,
          passwordHash,
          email,
          name,
          graduationClass: graduationClass || null,
          className: className || null,
          contact: contact || null,
          role: accessCodeAccepted ? "ALUMNI" : "GUEST",
          status: accessCodeAccepted ? "VERIFIED" : "PENDING",
          verificationStatus: accessCodeAccepted ? "VERIFIED" : "PENDING",
          verificationMethod: accessCodeAccepted
            ? "INTERNAL_CODE"
            : "ADMIN_REVIEW",
          identityType: "ALUMNI",
          accountStatus: "ACTIVE",
          emailVerifyTokenHash: verification.hash,
          emailVerifyExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      return created;
    });

    const emailSent = await sendVerificationEmail(email, verification.token);
    return NextResponse.json(
      {
        success: true,
        userId: user.id,
        emailSent,
        accessCodeAccepted,
        reviewRequired: !accessCodeAccepted,
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "用户名或邮箱已被使用" },
        { status: 409 },
      );
    }
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求内容过大" }, { status: 413 });
    }
    return NextResponse.json({ error: "注册失败，请稍后再试" }, { status: 500 });
  }
}
