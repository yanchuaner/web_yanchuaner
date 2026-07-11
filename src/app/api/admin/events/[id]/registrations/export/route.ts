import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/db";
import { getRouteId, type IdRouteParams } from "@/lib/route-params";

const MAX_EXPORT_ROWS = 5_000;
const FORMULA_PREFIX = /^\s*[=+\-@]/;

function csvCell(value: string | number | null) {
  let text = value === null ? "" : String(value);
  if (FORMULA_PREFIX.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function csvDate(value: Date | null) {
  return value ? value.toISOString() : "";
}

function safeFilenameSegment(value: string) {
  return (
    value
      .normalize("NFC")
      .replace(/[\u0000-\u001f\u007f/\\:*?"<>|]/g, "_")
      .slice(0, 60) || "event"
  );
}

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
      return NextResponse.json({ error: "活动编号无效" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id },
        select: { id: true, title: true },
      });
      if (!event) throw new Error("EVENT_NOT_FOUND");

      const registrations = await tx.eventRegistration.findMany({
        where: { eventId: event.id },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: MAX_EXPORT_ROWS + 1,
        select: {
          name: true,
          contact: true,
          message: true,
          status: true,
          cancelledAt: true,
          createdAt: true,
        },
      });
      if (registrations.length > MAX_EXPORT_ROWS) {
        throw new Error("EXPORT_TOO_LARGE");
      }

      const activeCount = registrations.filter(
        (registration) =>
          registration.status === "PENDING" ||
          registration.status === "APPROVED",
      ).length;
      await tx.auditLog.create({
        data: {
          action: "event-registrations-export",
          targetType: "Event",
          targetId: event.id,
          adminId: admin.id,
          after: JSON.stringify({
            rowCount: registrations.length,
            activeCount,
            fields: [
              "name",
              "contact",
              "message",
              "status",
              "createdAt",
              "cancelledAt",
            ],
          }),
        },
      });

      return { event, registrations };
    });

    const header = [
      "序号",
      "姓名",
      "联系方式",
      "留言",
      "状态",
      "报名时间",
      "取消时间",
    ];
    const rows = result.registrations.map((registration, index) => [
      index + 1,
      registration.name,
      registration.contact,
      registration.message,
      registration.status,
      csvDate(registration.createdAt),
      csvDate(registration.cancelledAt),
    ]);
    const csv = `\uFEFF${[header, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")}`;
    const date = new Date().toISOString().slice(0, 10);
    const displayFilename = `报名名单_${safeFilenameSegment(result.event.title)}_${date}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition":
          `attachment; filename="event-registrations-${date}.csv"; ` +
          `filename*=UTF-8''${encodeURIComponent(displayFilename)}`,
        "Content-Type": "text/csv; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EVENT_NOT_FOUND") {
      return NextResponse.json({ error: "活动不存在" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "EXPORT_TOO_LARGE") {
      return NextResponse.json(
        { error: `单次最多导出 ${MAX_EXPORT_ROWS} 条报名记录` },
        { status: 409 },
      );
    }
    console.error("Admin registrations export error:", error);
    return NextResponse.json({ error: "导出报名名单失败" }, { status: 500 });
  }
}
