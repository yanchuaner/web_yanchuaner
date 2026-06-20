import { compare, hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import {
  BCRYPT_COST,
  readJsonBody,
  validPassword,
} from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await readJsonBody<{
      currentPassword?: unknown;
      newPassword?: unknown;
      confirmPassword?: unknown;
    }>(req, 4096);
    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";
    if (
      !validPassword(newPassword) ||
      newPassword !== body.confirmPassword
    ) {
      return NextResponse.json({ error: "新密码格式无效" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (
      !user?.passwordHash ||
      !(await compare(currentPassword, user.passwordHash))
    ) {
      return NextResponse.json({ error: "当前密码错误" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hash(newPassword, BCRYPT_COST),
        sessionVersion: { increment: 1 },
      },
    });
    const response = NextResponse.json({ success: true });
    response.cookies.set("yc_access_token", "", { path: "/", maxAge: 0 });
    return response;
  } catch {
    return NextResponse.json({ error: "修改密码失败" }, { status: 500 });
  }
}
