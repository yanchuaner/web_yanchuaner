import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/db";

const STATUS_FILTERS = ["ALL", "PENDING", "VERIFIED", "REJECTED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function isStatusFilter(value: string): value is StatusFilter {
  return STATUS_FILTERS.some((status) => status === value);
}

function parsePositiveInteger(value: string | null, fallback: number) {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const rawStatus = (searchParams.get("status") || "PENDING").trim().toUpperCase();
    if (!isStatusFilter(rawStatus)) {
      return NextResponse.json({ error: "审核状态无效" }, { status: 400 });
    }

    const page = parsePositiveInteger(searchParams.get("page"), 1);
    const pageSize = Math.min(
      parsePositiveInteger(searchParams.get("pageSize"), 20),
      50,
    );
    const where = rawStatus === "ALL" ? {} : { status: rawStatus };

    const [requests, total] = await Promise.all([
      prisma.identityVerificationRequest.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          identityType: true,
          name: true,
          graduationClass: true,
          className: true,
          teacherPosition: true,
          matchResult: true,
          status: true,
          adminNote: true,
          reviewedAt: true,
          createdAt: true,
          updatedAt: true,
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
          reviewedBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      }),
      prisma.identityVerificationRequest.count({ where }),
    ]);

    return NextResponse.json(
      {
        requests,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Admin identity verifications GET error:", error);
    return NextResponse.json(
      { error: "获取身份认证申请失败" },
      { status: 500 },
    );
  }
}
