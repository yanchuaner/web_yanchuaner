import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken } from "@/lib/mp-auth-contract";
import { MP_ERROR_CODES, mpError } from "@/lib/mp-api";

const SESSION_SECRET = process.env.SESSION_SECRET || "";

type TokenPayload = {
  v: 3;
  role: "user" | "admin";
  userId: string;
  sessionVersion: number;
  exp: number;
};

const PUBLIC_PAGES = new Set([
  "/",
  "/about",
  "/login",
  "/register",
  "/verify-email",
  "/reset-password",
  "/starfield",
]);

const PUBLIC_APIS = new Set([
  "/api/health",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/graduation-classes",
]);

const PUBLIC_MP_APIS = new Set([
  "/api/mp/auth/dev-login",
  "/api/mp/auth/wechat-login",
]);

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

async function verifyTokenEdge(token: string): Promise<TokenPayload | null> {
  if (!SESSION_SECRET) return null;
  try {
    const [encoded, signature, extra] = token.split(".");
    if (!encoded || !signature || extra) return null;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signature),
      new TextEncoder().encode(encoded),
    );
    if (!valid) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(encoded)),
    ) as Partial<TokenPayload>;
    if (
      payload.v !== 3 ||
      (payload.role !== "user" && payload.role !== "admin") ||
      typeof payload.userId !== "string" ||
      !Number.isInteger(payload.sessionVersion) ||
      typeof payload.exp !== "number" ||
      payload.exp <= Date.now()
    ) {
      return null;
    }
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

function isStatic(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/leaflet/") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/card.jpg" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(?:avif|css|gif|ico|jpe?g|js|json|map|png|svg|txt|webmanifest|webp|woff2?)$/i.test(
      pathname,
    )
  );
}

function normalizeOrigin(value: string | null) {
  if (!value || value === "null") return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins(req: NextRequest) {
  const allowed = new Set<string>();
  allowed.add(req.nextUrl.origin);

  const appOrigin = normalizeOrigin(process.env.APP_URL || null);
  if (appOrigin) allowed.add(appOrigin);

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) {
    const proto =
      req.headers.get("x-forwarded-proto") ||
      req.nextUrl.protocol.replace(":", "");
    allowed.add(`${proto}://${host}`);
    allowed.add(`https://${host}`);
    if (process.env.NODE_ENV !== "production") {
      allowed.add(`http://${host}`);
    }
  }

  return allowed;
}

function requiresSameOriginCheck(req: NextRequest, pathname: string) {
  return (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/mp/") &&
    MUTATING_METHODS.has(req.method.toUpperCase()) &&
    !PUBLIC_APIS.has(pathname)
  );
}

function isSameOriginRequest(req: NextRequest) {
  const allowedOrigins = getAllowedOrigins(req);
  const origin = normalizeOrigin(req.headers.get("origin"));
  if (origin) return allowedOrigins.has(origin);
  if (req.headers.has("origin")) return false;

  const referer = normalizeOrigin(req.headers.get("referer"));
  if (referer) return allowedOrigins.has(referer);

  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);
  const next = () => NextResponse.next({ request: { headers } });

  if (isStatic(pathname)) {
    return next();
  }

  if (requiresSameOriginCheck(req, pathname) && !isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (PUBLIC_APIS.has(pathname) || PUBLIC_MP_APIS.has(pathname)) {
    return next();
  }

  const isMpApi = pathname.startsWith("/api/mp/");
  const bearer = isMpApi ? extractBearerToken(req) : null;
  const token = isMpApi
    ? bearer?.ok
      ? bearer.token
      : undefined
    : req.cookies.get("yc_access_token")?.value;
  const payload = token ? await verifyTokenEdge(token) : null;

  if (isMpApi && !payload) {
    const code = bearer && !bearer.ok && bearer.reason === "MALFORMED"
      ? MP_ERROR_CODES.AUTH_HEADER_INVALID
      : bearer?.ok
        ? MP_ERROR_CODES.TOKEN_INVALID
        : MP_ERROR_CODES.AUTH_REQUIRED;
    const message = bearer?.ok
      ? "登录状态已失效，请重新登录"
      : bearer?.reason === "MALFORMED"
        ? "Authorization 请求头格式无效"
        : "需要登录";
    return mpError(code, message, 401, {
      headers: { "WWW-Authenticate": "Bearer" },
    });
  }

  if (pathname === "/admin/login") {
    if (payload?.role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (payload?.role === "user") {
      return NextResponse.redirect(new URL("/me", req.url));
    }
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", "/admin");
    return NextResponse.redirect(url);
  }

  if (PUBLIC_PAGES.has(pathname)) {
    return next();
  }

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && payload.role !== "admin") {
    return pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
      : NextResponse.redirect(new URL("/me", req.url));
  }
  return next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
