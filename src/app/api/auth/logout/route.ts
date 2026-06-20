import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth) return auth;
  const response = NextResponse.json({ success: true });
  response.cookies.set("yc_access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
