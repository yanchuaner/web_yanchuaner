import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, requireAdmin } from "@/lib/admin-auth";
import { readJsonBody } from "@/lib/auth-utils";
import prisma from "@/lib/db";
import { getRouteId, type IdRouteParams } from "@/lib/route-params";

type ReviewAction = "approve" | "reject";

export async function POST(
  req: NextRequest,
  { params }: { params: IdRouteParams },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  const admin = await getAuthenticatedUser(req);
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const id = await getRouteId(params);
    if (!id || id.length > 100) {
      return NextResponse.json({ error: "申请编号无效" }, { status: 400 });
    }

    const body = await readJsonBody<{
      action?: unknown;
      adminNote?: unknown;
    }>(req, 4096);
    const action =
      typeof body.action === "string" ? body.action.trim() : "";
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "审核操作无效" }, { status: 400 });
    }
    if (
      body.adminNote !== undefined &&
      body.adminNote !== null &&
      typeof body.adminNote !== "string"
    ) {
      return NextResponse.json({ error: "审核备注格式无效" }, { status: 400 });
    }
    const adminNote =
      typeof body.adminNote === "string" ? body.adminNote.trim() : "";
    if (adminNote.length > 500) {
      return NextResponse.json(
        { error: "审核备注不可超过 500 个字符" },
        { status: 400 },
      );
    }

    const reviewed = await prisma.$transaction(async (tx) => {
      const current = await tx.identityVerificationRequest.findUnique({
        where: { id },
        select: {
          id: true,
          identityType: true,
          name: true,
          graduationClass: true,
          className: true,
          teacherPosition: true,
          matchResult: true,
          status: true,
          user: {
            select: {
              id: true,
              role: true,
              status: true,
              verificationStatus: true,
              identityType: true,
              sessionVersion: true,
            },
          },
        },
      });
      if (!current) throw new Error("VERIFICATION_NOT_FOUND");
      if (current.status !== "PENDING") {
        throw new Error("VERIFICATION_ALREADY_REVIEWED");
      }

      const requestStatus = action === "approve" ? "VERIFIED" : "REJECTED";
      const claimed = await tx.identityVerificationRequest.updateMany({
        where: { id: current.id, status: "PENDING" },
        data: {
          status: requestStatus,
          adminNote: adminNote || null,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });
      if (claimed.count !== 1) {
        throw new Error("VERIFICATION_ALREADY_REVIEWED");
      }

      const nextRole =
        current.user.role === "ADMIN" || current.user.role === "ALUMNI"
          ? current.user.role
          : action === "approve" && current.identityType === "ALUMNI"
            ? "ALUMNI"
            : "GUEST";
      const updatedUser = await tx.user.update({
        where: { id: current.user.id },
        data:
          action === "approve"
            ? {
                name: current.name,
                graduationClass: current.graduationClass,
                className: current.className,
                teacherPosition: current.teacherPosition,
                identityType: current.identityType,
                role: nextRole,
                status: "VERIFIED",
                verificationStatus: "VERIFIED",
                sessionVersion: { increment: 1 },
              }
            : {
                role: nextRole,
                status: "REJECTED",
                verificationStatus: "REJECTED",
                sessionVersion: { increment: 1 },
              },
        select: {
          id: true,
          username: true,
          role: true,
          status: true,
          verificationStatus: true,
          identityType: true,
          sessionVersion: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action: `identity-verification-${action}`,
          targetType: "IdentityVerificationRequest",
          targetId: current.id,
          adminId: admin.id,
          before: JSON.stringify({
            requestStatus: current.status,
            userStatus: current.user.status,
            verificationStatus: current.user.verificationStatus,
            role: current.user.role,
            identityType: current.user.identityType,
            sessionVersion: current.user.sessionVersion,
          }),
          after: JSON.stringify({
            requestStatus,
            userStatus: updatedUser.status,
            verificationStatus: updatedUser.verificationStatus,
            role: updatedUser.role,
            identityType: updatedUser.identityType,
            sessionVersion: updatedUser.sessionVersion,
          }),
        },
      });

      return tx.identityVerificationRequest.findUniqueOrThrow({
        where: { id: current.id },
        select: {
          id: true,
          status: true,
          adminNote: true,
          reviewedAt: true,
          user: {
            select: {
              id: true,
              username: true,
              role: true,
              status: true,
              verificationStatus: true,
              identityType: true,
            },
          },
        },
      });
    });

    return NextResponse.json(
      { request: reviewed },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "VERIFICATION_NOT_FOUND") {
      return NextResponse.json({ error: "认证申请不存在" }, { status: 404 });
    }
    if (
      error instanceof Error &&
      error.message === "VERIFICATION_ALREADY_REVIEWED"
    ) {
      return NextResponse.json(
        { error: "该申请已被处理，请刷新列表" },
        { status: 409 },
      );
    }
    console.error("Admin identity verification review error:", error);
    return NextResponse.json({ error: "审核操作失败" }, { status: 500 });
  }
}
