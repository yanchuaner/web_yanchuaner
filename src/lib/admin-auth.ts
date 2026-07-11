import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { TokenPayload, verifyToken } from "@/lib/verify-token";

export const AUTH_COOKIE = "yc_access_token";

export type AuthenticatedUser = {
  id: string;
  username: string | null;
  email: string | null;
  emailVerified: Date | null;
  name: string | null;
  graduationClass: string | null;
  className: string | null;
  verificationStatus: string;
  identityType: string | null;
  role: string;
  status: string;
  accountStatus: string;
  sessionVersion: number;
};

function unauthorized(message = "Unauthorized", status = 401) {
  return NextResponse.json({ error: message }, { status });
}

function tokenFromRequest(req: NextRequest): TokenPayload | null {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

export function tokenMatchesUser(
  user: AuthenticatedUser | null,
  payload: TokenPayload,
  requireVerifiedEmail = true,
): user is AuthenticatedUser {
  if (
    !user ||
    user.accountStatus !== "ACTIVE" ||
    (requireVerifiedEmail && !user.emailVerified) ||
    user.sessionVersion !== payload.sessionVersion
  ) {
    return false;
  }
  const expectedRole = user.role === "ADMIN" ? "admin" : "user";
  return payload.role === expectedRole;
}

export async function resolveAuthenticatedUser(
  payload: TokenPayload | null,
  options: { requireVerifiedEmail?: boolean } = {},
) {
  if (!payload) return null;
  const requireVerifiedEmail = options.requireVerifiedEmail ?? true;
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      username: true,
      email: true,
      emailVerified: true,
      name: true,
      graduationClass: true,
      className: true,
      verificationStatus: true,
      identityType: true,
      role: true,
      status: true,
      accountStatus: true,
      sessionVersion: true,
    },
  });
  if (!tokenMatchesUser(user, payload, requireVerifiedEmail)) return null;
  return user;
}

export async function getAuthenticatedUser(
  req: NextRequest,
): Promise<AuthenticatedUser | null> {
  return resolveAuthenticatedUser(tokenFromRequest(req), {
    requireVerifiedEmail: true,
  });
}

export async function requireUser(
  req: NextRequest,
): Promise<Response | null> {
  return (await getAuthenticatedUser(req)) ? null : unauthorized();
}

export async function requireVerifiedAlumni(
  req: NextRequest,
): Promise<Response | null> {
  const user = await getAuthenticatedUser(req);
  if (!user) return unauthorized();
  if (
    user.role !== "ADMIN" &&
    (user.role !== "ALUMNI" || user.status !== "VERIFIED")
  ) {
    return unauthorized("Forbidden", 403);
  }
  return null;
}

export async function requireAdmin(
  req: NextRequest,
): Promise<Response | null> {
  const user = await getAuthenticatedUser(req);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return unauthorized("Forbidden", 403);
  return null;
}

async function pageUser() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  return resolveAuthenticatedUser(token ? verifyToken(token) : null, {
    requireVerifiedEmail: true,
  });
}

export async function getPageUser() {
  return pageUser();
}

export async function requirePageUser() {
  const user = await pageUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePageAlumni() {
  const user = await pageUser();
  if (!user) redirect("/login");
  if (
    user.role !== "ADMIN" &&
    (user.role !== "ALUMNI" || user.status !== "VERIFIED")
  ) {
    redirect("/me");
  }
  return user;
}

export async function requirePageAdmin() {
  const user = await pageUser();
  if (!user || user.role !== "ADMIN") redirect("/login?redirect=/admin");
  return user;
}
