import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import { readJsonBody } from "@/lib/auth-utils";
import {
  normalizeClassName,
  normalizeGraduationClass,
  validClassName,
  validGraduationClass,
} from "@/lib/identity-fields";

function requireAdminUser(req: NextRequest) {
  return getAuthenticatedUser(req).then((user) => {
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return user;
  });
}

const correctionSelect = {
  id: true,
  rosterId: true,
  currentName: true,
  currentGraduationClass: true,
  currentClassName: true,
  requestedName: true,
  requestedGraduationClass: true,
  requestedClassName: true,
  contact: true,
  reason: true,
  status: true,
  adminNote: true,
  createdAt: true,
  reviewedAt: true,
} as const;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdminUser(req);
  if (admin instanceof NextResponse) return admin;

  try {
    const request = await prisma.alumniCorrectionRequest.findUnique({
      where: { id: params.id },
      select: correctionSelect,
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
  const admin = await requireAdminUser(req);
  if (admin instanceof NextResponse) return admin;

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
      select: correctionSelect,
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

      const requestedGraduationClass = normalizeGraduationClass(request.requestedGraduationClass);
      const requestedClassName = normalizeClassName(request.requestedClassName);
      if (requestedGraduationClass && !validGraduationClass(requestedGraduationClass)) {
        return NextResponse.json({ error: "届别需为2025起的四位年份数字" }, { status: 400 });
      }
      if (requestedClassName && !validClassName(requestedClassName)) {
        return NextResponse.json({ error: "班级需为1-99的数字" }, { status: 400 });
      }

      // 使用 transaction 保证一致性
      await prisma.$transaction(async (tx) => {
        // 1. 更新审核状态
        const updatedRequest = await tx.alumniCorrectionRequest.update({
          where: { id: params.id },
          data: { status: "APPROVED", adminNote: adminNote || null, reviewedAt: new Date() },
        });

        // 2. 更新 WhitelistRoster
        const rosterUpdate: Record<string, string | null> = {};
        if (request.requestedName) rosterUpdate.name = request.requestedName;
        if (requestedGraduationClass) rosterUpdate.graduationClass = requestedGraduationClass;
        if (requestedClassName) rosterUpdate.className = requestedClassName;

        if (Object.keys(rosterUpdate).length === 0) throw new Error("NO_SUPPORTED_FIELDS");

        const updatedRoster = await tx.whitelistRoster.update({ where: { id: request.rosterId }, data: rosterUpdate });

        // 3. 同步更新匹配的 User 账号 (按 name + graduationClass)
        const matchCriteria: Record<string, string> = {
          name: roster.name,
          graduationClass: normalizeGraduationClass(roster.graduationClass),
        };
        const matchedUser = await tx.user.findFirst({
          where: { name: matchCriteria.name, graduationClass: matchCriteria.graduationClass },
        });
        if (matchedUser) {
          const userUpdate: Record<string, string | null> = {};
          if (request.requestedName) userUpdate.name = request.requestedName;
          if (requestedGraduationClass) userUpdate.graduationClass = requestedGraduationClass;
          if (requestedClassName) userUpdate.className = requestedClassName;
          if (Object.keys(userUpdate).length > 0) {
            await tx.user.update({ where: { id: matchedUser.id }, data: userUpdate });
          }
        }

        await tx.auditLog.create({
          data: {
            action: "approve-alumni-correction",
            targetType: "AlumniCorrectionRequest",
            targetId: request.id,
            adminId: admin.id,
            before: JSON.stringify({
              requestStatus: request.status,
              roster: {
                id: roster.id,
                name: roster.name,
                graduationClass: normalizeGraduationClass(roster.graduationClass),
                className: normalizeClassName(roster.className),
              },
            }),
            after: JSON.stringify({
              requestStatus: updatedRequest.status,
              fields: Object.keys(rosterUpdate),
              roster: {
                id: updatedRoster.id,
                name: updatedRoster.name,
                graduationClass: normalizeGraduationClass(updatedRoster.graduationClass),
                className: normalizeClassName(updatedRoster.className),
              },
              syncedUserId: matchedUser?.id || null,
            }),
          },
        });
      });

      return NextResponse.json({ success: true, status: "APPROVED" });
    }

    // reject
    await prisma.$transaction(async (tx) => {
      const updated = await tx.alumniCorrectionRequest.update({
        where: { id: params.id },
        data: {
          status: "REJECTED",
          adminNote: adminNote || null,
          reviewedAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          action: "reject-alumni-correction",
          targetType: "AlumniCorrectionRequest",
          targetId: request.id,
          adminId: admin.id,
          before: JSON.stringify({ requestStatus: request.status }),
          after: JSON.stringify({ requestStatus: updated.status }),
        },
      });
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
    if (error?.message === "NO_SUPPORTED_FIELDS") {
      return NextResponse.json(
        { error: "该申请不包含当前支持的修改字段，请驳回并请校友重新提交" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "审核修改申请失败" },
      { status: 500 },
    );
  }
}
