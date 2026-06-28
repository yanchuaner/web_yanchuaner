import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { readJsonBody } from "@/lib/auth-utils";
import { getRouteId, type IdRouteParams } from "@/lib/route-params";
import {
  normalizeClassName,
  normalizeGraduationClass,
  validClassName,
  validGraduationClass,
} from "@/lib/identity-fields";

export async function GET(
  req: NextRequest,
  { params }: { params: IdRouteParams },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const id = await getRouteId(params);
    const alumni = await prisma.whitelistRoster.findUnique({
      where: { id },
    });
    if (!alumni) {
      return NextResponse.json({ error: "校友不存在" }, { status: 404 });
    }
    return NextResponse.json({ alumni });
  } catch (error) {
    console.error("Admin alumni GET by id error:", error);
    return NextResponse.json(
      { error: "获取校友信息失败" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: IdRouteParams },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const id = await getRouteId(params);
    const existing = await prisma.whitelistRoster.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "校友不存在" }, { status: 404 });
    }

    const body = await readJsonBody<{
      name?: unknown;
      graduationClass?: unknown;
      className?: unknown;
      email?: unknown;
      contact?: unknown;
      city?: unknown;
      university?: unknown;
      major?: unknown;
      industry?: unknown;
      certificateNo?: unknown;
    }>(req, 16384); // Roster forms are small, 16KB limit

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const graduationClass = normalizeGraduationClass(body.graduationClass);
    const className = normalizeClassName(body.className);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const contact = typeof body.contact === "string" ? body.contact.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const university = typeof body.university === "string" ? body.university.trim() : "";
    const major = typeof body.major === "string" ? body.major.trim() : "";
    const industry = typeof body.industry === "string" ? body.industry.trim() : "";
    const certificateNo = typeof body.certificateNo === "string" ? body.certificateNo.trim() : "";

    if (!name || name.length > 50) {
      return NextResponse.json(
        { error: "姓名不能为空且长度不超过50字" },
        { status: 400 },
      );
    }
    if (graduationClass && !validGraduationClass(graduationClass)) {
      return NextResponse.json(
        { error: "届别需为2025起的四位年份数字" },
        { status: 400 },
      );
    }
    if (className && !validClassName(className)) {
      return NextResponse.json(
        { error: "班级需为1-99的数字" },
        { status: 400 },
      );
    }
    if (email && (email.length > 254 || !email.includes("@"))) {
      return NextResponse.json({ error: "邮箱格式无效" }, { status: 400 });
    }
    if (contact && !/^\d{11}$/.test(contact)) {
      return NextResponse.json({ error: "联系方式需为11位手机号" }, { status: 400 });
    }
    if (certificateNo && certificateNo.length > 50) {
      return NextResponse.json(
        { error: "证书编号长度不超过50字" },
        { status: 400 },
      );
    }

    const alumni = await prisma.whitelistRoster.update({
      where: { id },
      data: {
        name,
        graduationClass: graduationClass || null,
        className: className || null,
        email: email || null,
        contact: contact || null,
        city: city || null,
        university: university || null,
        major: major || null,
        industry: industry || null,
        certificateNo: certificateNo || null,
      },
    });

    return NextResponse.json({ alumni });
  } catch (error: any) {
    console.error("Admin alumni PUT error:", error);
    if (error?.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "无效的 JSON 数据" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "更新校友失败" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: IdRouteParams },
) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const id = await getRouteId(params);
    const existing = await prisma.whitelistRoster.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "校友不存在" }, { status: 404 });
    }

    // 检查关联的待处理修正申请
    const pendingCount = await prisma.alumniCorrectionRequest.count({
      where: { rosterId: id, status: "PENDING" },
    });
    if (pendingCount > 0) {
      return NextResponse.json(
        { error: `该校友有 ${pendingCount} 条待处理修改申请，请先处理后再删除` },
        { status: 409 }
      );
    }

    await prisma.whitelistRoster.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin alumni DELETE error:", error);
    return NextResponse.json(
      { error: "删除校友失败" },
      { status: 500 },
    );
  }
}
