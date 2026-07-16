import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { readJsonBody } from "@/lib/auth-utils";
import {
  ACCESS_CODE_HINT_MAX_LENGTH,
  hashAccessCode,
  normalizeAccessCode,
  publicRegistrationPolicy,
  REGISTRATION_POLICY_ID,
  validAccessCode,
} from "@/lib/registration-policy";

function responsePolicy(policy: {
  accessCodeEnabled: boolean;
  accessCodeHash: string | null;
  accessCodeHint: string;
  updatedAt: Date;
}) {
  return {
    ...publicRegistrationPolicy(policy),
    hasAccessCode: Boolean(policy.accessCodeHash),
    updatedAt: policy.updatedAt.toISOString(),
  };
}

async function requirePolicyAdmin(req: NextRequest) {
  const admin = await getAuthenticatedUser(req);
  return admin?.role === "ADMIN" ? admin : null;
}

export async function GET(req: NextRequest) {
  const admin = await requirePolicyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const policy = await prisma.registrationPolicy.findUnique({
    where: { id: REGISTRATION_POLICY_ID },
  });
  if (!policy) {
    return NextResponse.json({
      accessCodeEnabled: false,
      accessCodeHint: "",
      hasAccessCode: false,
      updatedAt: null,
    });
  }
  return NextResponse.json(responsePolicy(policy));
}

export async function PATCH(req: NextRequest) {
  const admin = await requirePolicyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await readJsonBody<{
      accessCodeEnabled?: unknown;
      accessCode?: unknown;
      accessCodeHint?: unknown;
    }>(req, 4096);
    const accessCodeEnabled = body.accessCodeEnabled === true;
    const accessCode = normalizeAccessCode(body.accessCode);
    const accessCodeHint =
      typeof body.accessCodeHint === "string" ? body.accessCodeHint.trim() : "";

    if (accessCodeHint.length > ACCESS_CODE_HINT_MAX_LENGTH) {
      return NextResponse.json({ error: "口令提示过长" }, { status: 400 });
    }
    if (accessCode && !validAccessCode(accessCode)) {
      return NextResponse.json(
        { error: "内部口令需为 8-64 个字符" },
        { status: 400 },
      );
    }

    const current = await prisma.registrationPolicy.findUnique({
      where: { id: REGISTRATION_POLICY_ID },
    });
    if (accessCodeEnabled && !accessCode && !current?.accessCodeHash) {
      return NextResponse.json(
        { error: "启用前请先设置内部口令" },
        { status: 400 },
      );
    }

    const accessCodeHash = accessCode
      ? await hashAccessCode(accessCode)
      : current?.accessCodeHash || null;
    const updated = await prisma.$transaction(async (tx) => {
      const policy = await tx.registrationPolicy.upsert({
        where: { id: REGISTRATION_POLICY_ID },
        create: {
          id: REGISTRATION_POLICY_ID,
          accessCodeEnabled,
          accessCodeHash,
          accessCodeHint,
        },
        update: { accessCodeEnabled, accessCodeHash, accessCodeHint },
      });
      await tx.auditLog.create({
        data: {
          action: "registration-policy-update",
          targetType: "RegistrationPolicy",
          targetId: policy.id,
          adminId: admin.id,
          before: JSON.stringify({
            accessCodeEnabled: current?.accessCodeEnabled || false,
            hasAccessCode: Boolean(current?.accessCodeHash),
            accessCodeHint: current?.accessCodeHint || "",
          }),
          after: JSON.stringify({
            accessCodeEnabled: policy.accessCodeEnabled,
            hasAccessCode: Boolean(policy.accessCodeHash),
            accessCodeRotated: Boolean(accessCode),
            accessCodeHint: policy.accessCodeHint,
          }),
        },
      });
      return policy;
    });

    return NextResponse.json(responsePolicy(updated));
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求内容过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    console.error("Registration policy update error:", error);
    return NextResponse.json({ error: "注册策略保存失败" }, { status: 500 });
  }
}
