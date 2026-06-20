import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.whitelistRoster.findMany({
    where: { graduationClass: { not: null } },
    select: { graduationClass: true },
    distinct: ["graduationClass"],
    orderBy: { graduationClass: "desc" },
  });
  return NextResponse.json({
    graduationClasses: rows
      .map((row) => row.graduationClass)
      .filter((value): value is string => !!value),
  });
}
