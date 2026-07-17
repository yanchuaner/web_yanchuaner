import { NextResponse } from "next/server";
import { getOAuthPublicJwk } from "@/lib/oauth-provider";

export function GET() {
  try {
    return NextResponse.json(
      { keys: [getOAuthPublicJwk()] },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  } catch {
    return NextResponse.json(
      { error: "temporarily_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
