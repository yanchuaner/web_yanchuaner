import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const alumni = await prisma.whitelistRoster.findUnique({
      where: { id: params.id },
    });
    if (!alumni) {
      return NextResponse.json({ error: "校友不存在" }, { status: 404 });
    }
    return NextResponse.json({ alumni });
  } catch (error) {
    console.error("Admin alumni GET by id error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alumni" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const existing = await prisma.whitelistRoster.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "校友不存在" }, { status: 404 });
    }

    const body = await req.json();
    const name = (body.name || "").trim();
    const graduationClass = (body.graduationClass || "").trim() || null;
    const tags = (body.tags || "").trim() || null;

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

    const alumni = await prisma.whitelistRoster.update({
      where: { id: params.id },
      data: { name, graduationClass, tags },
    });

    return NextResponse.json({ alumni });
  } catch (error) {
    console.error("Admin alumni PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update alumni" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const existing = await prisma.whitelistRoster.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "校友不存在" }, { status: 404 });
    }

    await prisma.whitelistRoster.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin alumni DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete alumni" },
      { status: 500 },
    );
  }
}
