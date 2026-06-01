import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeTags } from "@/lib/tags";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const graduationClass = (
      searchParams.get("graduationClass") || ""
    ).trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10)),
    );

    const where: Record<string, unknown> = {};
    const andConditions: Record<string, unknown>[] = [];

    if (q) {
      andConditions.push({
        OR: [
          { name: { contains: q } },
          { tags: { contains: q } },
          { graduationClass: { contains: q } },
        ],
      });
    }
    if (graduationClass) {
      andConditions.push({ graduationClass: { contains: graduationClass } });
    }
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [total, rows] = await Promise.all([
      prisma.whitelistRoster.count({ where }),
      prisma.whitelistRoster.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({ alumni: rows, total, page, pageSize });
  } catch (error) {
    console.error("Admin alumni GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alumni" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const name = (body.name || "").trim();
    const graduationClass = (body.graduationClass || "").trim() || null;
    const tags = normalizeTags((body.tags || "").trim()) || null;
    const certificateNo = (body.certificateNo || "").trim() || null;

    if (!name || name.length > 50) {
      return NextResponse.json(
        { error: "姓名不能为空且长度不超过50字" },
        { status: 400 },
      );
    }
    if (graduationClass && graduationClass.length > 50) {
      return NextResponse.json(
        { error: "届别长度不超过50字" },
        { status: 400 },
      );
    }
    if (tags && tags.length > 500) {
      return NextResponse.json(
        { error: "标签长度不超过500字" },
        { status: 400 },
      );
    }

    const alumni = await prisma.whitelistRoster.create({
      data: { name, graduationClass, tags, certificateNo },
    });

    return NextResponse.json({ alumni }, { status: 201 });
  } catch (error) {
    console.error("Admin alumni POST error:", error);
    return NextResponse.json(
      { error: "Failed to create alumni" },
      { status: 500 },
    );
  }
}
