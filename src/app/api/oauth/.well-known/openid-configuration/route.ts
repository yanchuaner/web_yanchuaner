import { NextResponse } from "next/server";
import { getOAuthProviderMetadata } from "@/lib/oauth-provider";

export function GET() {
  try {
    const metadata = getOAuthProviderMetadata();
    return NextResponse.json(
      {
        issuer: metadata.issuer,
        authorization_endpoint: metadata.authorizationEndpoint,
        token_endpoint: metadata.tokenEndpoint,
        userinfo_endpoint: metadata.userInfoEndpoint,
        jwks_uri: metadata.jwksUri,
        response_types_supported: ["code"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"],
        scopes_supported: ["openid", "profile", "email"],
        claims_supported: [
          "sub",
          "name",
          "preferred_username",
          "email",
          "email_verified",
          "role",
        ],
        code_challenge_methods_supported: ["S256"],
        token_endpoint_auth_methods_supported: [
          "client_secret_post",
          "client_secret_basic",
        ],
      },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  } catch {
    return NextResponse.json(
      { error: "temporarily_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
