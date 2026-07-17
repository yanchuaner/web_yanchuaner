import { NextRequest, NextResponse } from "next/server";
import { resolveOAuthAccessToken } from "@/lib/oauth-provider";

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer ([A-Za-z0-9_-]{32,256})$/);
  if (!match) {
    return NextResponse.json(
      { error: "invalid_token" },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
          "WWW-Authenticate": 'Bearer error="invalid_token"',
        },
      },
    );
  }

  try {
    const identity = await resolveOAuthAccessToken(match[1]);
    if (!identity) {
      return NextResponse.json(
        { error: "invalid_token" },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
            "WWW-Authenticate": 'Bearer error="invalid_token"',
          },
        },
      );
    }
    return NextResponse.json(identity, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "temporarily_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
