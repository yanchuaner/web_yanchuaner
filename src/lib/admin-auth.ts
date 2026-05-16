import { NextRequest, NextResponse } from "next/server";

export function requireAdmin(req: NextRequest): Response | null {
  const token = req.cookies.get("yc_access_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const payload = JSON.parse(decoded);
    if (payload.v === 1 && typeof payload.exp === "number" && payload.exp > Date.now()) {
      return null;
    }
  } catch {}
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
