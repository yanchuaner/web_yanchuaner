import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "旧共享口令登录已停用，请使用个人账号登录" },
    { status: 410 },
  );
}
