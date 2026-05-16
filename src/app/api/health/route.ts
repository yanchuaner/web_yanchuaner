import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {
    server: "ok",
    timestamp: new Date().toISOString(),
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

  const allHealthy = Object.values(checks).every((v) =>
    v === "ok" || v === "connected" || v === "not_configured" || v === "disconnected"
  );

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
