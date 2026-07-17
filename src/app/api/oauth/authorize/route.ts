import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/admin-auth";
import {
  findOAuthProviderConfig,
  isOAuthEligibleUser,
  issueAuthorizationCode,
  validateAuthorizationRequest,
} from "@/lib/oauth-provider";

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(req: NextRequest) {
  try {
    const config = findOAuthProviderConfig(
      req.nextUrl.searchParams.get("client_id") ?? "",
    );
    if (!config) {
      return noStore(
        NextResponse.json({ error: "invalid_request" }, { status: 400 }),
      );
    }
    const request = validateAuthorizationRequest(
      req.nextUrl.searchParams,
      config,
    );
    if (!request) {
      return noStore(
        NextResponse.json({ error: "invalid_request" }, { status: 400 }),
      );
    }

    const user = await getAuthenticatedUser(req);
    if (!user) {
      const returnPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;
      const loginUrl = new URL(
        "/login",
        process.env.APP_URL || process.env.SITE_URL || req.nextUrl.origin,
      );
      loginUrl.searchParams.set("redirect", returnPath);
      return noStore(NextResponse.redirect(loginUrl));
    }

    const callback = new URL(config.redirectUri);
    callback.searchParams.set("state", request.state);
    if (!isOAuthEligibleUser(user)) {
      callback.searchParams.set("error", "access_denied");
      return noStore(NextResponse.redirect(callback));
    }

    const code = await issueAuthorizationCode(user, config, request.nonce);
    callback.searchParams.set("code", code);
    return noStore(NextResponse.redirect(callback));
  } catch {
    return noStore(
      NextResponse.json(
        { error: "temporarily_unavailable" },
        { status: 503 },
      ),
    );
  }
}
