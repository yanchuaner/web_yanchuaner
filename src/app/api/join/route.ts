import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "入轨联络舱已迁移至个人账号注册，请前往 /register" },
    { status: 410 },
  );
}
