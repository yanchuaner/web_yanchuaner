import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { readJsonBody } from "@/lib/auth-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const request = await prisma.alumniCorrectionRequest.findUnique({
      where: { id: params.id },
    });
    if (!request) {
      return NextResponse.json({ error: "申请不存在" }, { status: 404 });
    }
    return NextResponse.json({ request });
  } catch (error) {
    console.error("Admin correction GET error:", error);
    return NextResponse.json(
      { error: "获取修改申请失败" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await readJsonBody<{
      action?: unknown;
      adminNote?: unknown;
    }>(req, 16384); // 16KB limit

    const action = typeof body.action === "string" ? body.action.trim() : "";
    const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim() : "";

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "操作类型无效" },
        { status: 400 },
      );
    }
    if (adminNote.length > 500) {
      return NextResponse.json(
        { error: "管理员备注不可超过500字" },
        { status: 400 },
      );
    }

    const request = await prisma.alumniCorrectionRequest.findUnique({
      where: { id: params.id },
    });
    if (!request) {
      return NextResponse.json({ error: "申请不存在" }, { status: 404 });
    }
    if (request.status !== "PENDING") {
      return NextResponse.json(
        { error: "该申请已审核，不能重复操作" },
        { status: 400 },
      );
    }

    if (action === "approve") {
      const roster = await prisma.whitelistRoster.findUnique({ where: { id: request.rosterId } });
      if (!roster) return NextResponse.json({ error: "该校友已从名单中删除，无法应用修改" }, { status: 400 });

      // 使用 transaction 保证一致性
      await prisma.$transaction(async (tx) => {
        // 1. 更新审核状态
        await tx.alumniCorrectionRequest.update({
          where: { id: params.id },
          data: { status: "APPROVED", adminNote: adminNote || null, reviewedAt: new Date() },
        });

        // 2. 更新 WhitelistRoster
        const rosterUpdate: Record<string, string | null> = {};
        if (request.requestedName) rosterUpdate.name = request.requestedName;
        if (request.requestedGraduationClass) rosterUpdate.graduationClass = request.requestedGraduationClass;
        if (request.requestedClassName) rosterUpdate.className = request.requestedClassName;
        if (request.requestedCity) rosterUpdate.city = request.requestedCity;
        if (request.requestedUniversity) rosterUpdate.university = request.requestedUniversity;
        if (request.requestedMajor) rosterUpdate.major = request.requestedMajor;
        if (request.requestedIndustry) rosterUpdate.industry = request.requestedIndustry;
        if (request.requestedContact) rosterUpdate.contact = request.requestedContact;

        await tx.whitelistRoster.update({ where: { id: request.rosterId }, data: rosterUpdate });

        // 3. 同步更新匹配的 User 账号 (按 name + graduationClass)
        const matchCriteria: Record<string, string> = {
          name: rosterUpdate.name || roster.name,
          graduationClass: rosterUpdate.graduationClass || roster.graduationClass || '',
        };
        const matchedUser = await tx.user.findFirst({
          where: { name: matchCriteria.name, graduationClass: matchCriteria.graduationClass },
        });
        if (matchedUser) {
          const userUpdate: Record<string, string | null> = {};
          if (request.requestedClassName) userUpdate.className = request.requestedClassName;
          if (request.requestedCity) userUpdate.city = request.requestedCity;
          if (request.requestedUniversity) userUpdate.university = request.requestedUniversity;
          if (request.requestedMajor) userUpdate.major = request.requestedMajor;
          if (request.requestedIndustry) userUpdate.industry = request.requestedIndustry;
          if (request.requestedContact) userUpdate.contact = request.requestedContact;
          if (Object.keys(userUpdate).length > 0) {
            await tx.user.update({ where: { id: matchedUser.id }, data: userUpdate });
          }
        }
      });

      return NextResponse.json({ success: true, status: "APPROVED" });
    }

    // reject
    await prisma.alumniCorrectionRequest.update({
      where: { id: params.id },
      data: {
        status: "REJECTED",
        adminNote: adminNote || null,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, status: "REJECTED" });
  } catch (error: any) {
    console.error("Admin correction PATCH error:", error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "审核修改申请失败" },
      { status: 500 },
    );
  }
}
