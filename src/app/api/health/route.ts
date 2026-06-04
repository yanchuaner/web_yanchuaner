import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {
    server: "ok",
    database: "",
  };

  // 数据库连接检查
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "connected";
  } catch {
    checks.database = "disconnected";
  }

  // Redis 连接检查 (可选)
  try {
    const { default: getRedisClient } = await import("@/lib/redis");
    const redis = getRedisClient();
    if (redis) {
      await redis.ping();
      checks.redis = "connected";
    } else {
      checks.redis = "not_configured";
    }
  } catch {
    checks.redis = "disconnected";
  }

  const allHealthy = Object.entries(checks).every(([key, v]) =>
    v === "ok" || v === "connected" || v === "not_configured"
  );

  const response: Record<string, string> = {
    ...checks,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(
    { status: allHealthy ? "healthy" : "degraded", checks: response },
    { status: allHealthy ? 200 : 503 }
  );
}
