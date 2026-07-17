import { NextRequest, NextResponse } from "next/server";
import { authLimiter, getClientIp } from "@/lib/rate-limit";
import {
  constantTimeSecretEqual,
  consumeAuthorizationCode,
  findOAuthProviderConfig,
  issueOAuthAccessToken,
  issueOAuthIdToken,
  readOAuthClientCredentials,
  readOAuthForm,
} from "@/lib/oauth-provider";

function oauthJson(body: object, status = 200) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export async function POST(req: NextRequest) {
  try {
    const limiter = await authLimiter.limit(`oauth-token:${getClientIp(req)}`);
    if (!limiter.success) {
      return NextResponse.json(
        { error: "slow_down" },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(limiter.retryAfter),
          },
        },
      );
    }
    const form = await readOAuthForm(req);
    const credentials = readOAuthClientCredentials(req, form);
    const config = findOAuthProviderConfig(credentials.clientId);
    if (
      !config ||
      !constantTimeSecretEqual(
        credentials.clientSecret,
        config?.clientSecret ?? "",
      )
    ) {
      return oauthJson({ error: "invalid_client" }, 401);
    }
    if (form.get("grant_type") !== "authorization_code") {
      return oauthJson({ error: "unsupported_grant_type" }, 400);
    }

    const record = await consumeAuthorizationCode(form.get("code") ?? "");
    if (
      !record ||
      record.clientId !== config.clientId ||
      record.redirectUri !== form.get("redirect_uri")
    ) {
      return oauthJson({ error: "invalid_grant" }, 400);
    }

    const token = await issueOAuthAccessToken(record.identity);
    const idToken = issueOAuthIdToken(record.identity, config, record.nonce);
    return oauthJson({
      access_token: token.accessToken,
      id_token: idToken,
      token_type: "Bearer",
      expires_in: token.expiresIn,
      scope: "openid profile email",
    });
  } catch (error) {
    if (error instanceof RangeError) {
      return oauthJson({ error: "invalid_request" }, 413);
    }
    if (error instanceof TypeError) {
      return oauthJson({ error: "invalid_request" }, 415);
    }
    return oauthJson({ error: "temporarily_unavailable" }, 503);
  }
}
