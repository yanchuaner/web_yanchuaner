import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";

type WechatEnvironment = {
  WECHAT_MINIPROGRAM_APP_ID?: string;
  WECHAT_MINIPROGRAM_APP_SECRET?: string;
};

export type WechatMiniProgramConfig = {
  appId: string;
  appSecret: string;
};

export function getWechatMiniProgramConfig(
  env: WechatEnvironment = process.env as WechatEnvironment,
): WechatMiniProgramConfig | null {
  const appId = env.WECHAT_MINIPROGRAM_APP_ID?.trim() ?? "";
  const appSecret = env.WECHAT_MINIPROGRAM_APP_SECRET?.trim() ?? "";
  return appId && appSecret ? { appId, appSecret } : null;
}

export function parseWechatLoginCode(value: unknown) {
  if (typeof value !== "string") return null;
  const code = value.trim();
  return /^[A-Za-z0-9_-]{1,128}$/.test(code) ? code : null;
}

export type WechatCode2SessionResult =
  | { ok: true; openid: string; unionid: string | null }
  | { ok: false; reason: "REJECTED" | "INVALID_RESPONSE" };

export function parseWechatCode2SessionResponse(
  value: unknown,
): WechatCode2SessionResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, reason: "INVALID_RESPONSE" };
  }
  const body = value as Record<string, unknown>;
  if (typeof body.errcode === "number" && body.errcode !== 0) {
    return { ok: false, reason: "REJECTED" };
  }
  const openid = typeof body.openid === "string" ? body.openid.trim() : "";
  const unionid =
    typeof body.unionid === "string" && body.unionid.trim()
      ? body.unionid.trim()
      : null;
  if (!openid || openid.length > 128 || (unionid && unionid.length > 128)) {
    return { ok: false, reason: "INVALID_RESPONSE" };
  }
  return { ok: true, openid, unionid };
}

export async function exchangeWechatLoginCode(
  code: string,
  config: WechatMiniProgramConfig,
): Promise<
  WechatCode2SessionResult | { ok: false; reason: "UNAVAILABLE" }
> {
  const url = new URL("https://api.weixin.qq.com/sns/jscode2session");
  url.searchParams.set("appid", config.appId);
  url.searchParams.set("secret", config.appSecret);
  url.searchParams.set("js_code", code);
  url.searchParams.set("grant_type", "authorization_code");

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return { ok: false, reason: "UNAVAILABLE" };
    const text = await response.text();
    if (text.length > 16_384) {
      return { ok: false, reason: "INVALID_RESPONSE" };
    }
    return parseWechatCode2SessionResponse(JSON.parse(text) as unknown);
  } catch {
    return { ok: false, reason: "UNAVAILABLE" };
  }
}

const loginUserSelect = {
  id: true,
  name: true,
  role: true,
  status: true,
  verificationStatus: true,
  identityType: true,
  accountStatus: true,
  sessionVersion: true,
} satisfies Prisma.UserSelect;

export type WechatLoginUser = Prisma.UserGetPayload<{
  select: typeof loginUserSelect;
}>;

async function resolveExistingWechatUser(input: {
  appId: string;
  openid: string;
  unionid: string | null;
}): Promise<WechatLoginUser | null> {
  return prisma.$transaction(async (tx) => {
    const identity = await tx.wechatIdentity.findUnique({
      where: {
        appId_openid: { appId: input.appId, openid: input.openid },
      },
      select: { id: true, user: { select: loginUserSelect } },
    });
    if (!identity) return null;
    await tx.wechatIdentity.update({
      where: { id: identity.id },
      data: {
        lastLoginAt: new Date(),
        ...(input.unionid ? { unionid: input.unionid } : {}),
      },
    });
    return identity.user;
  });
}

export async function resolveWechatLoginUser(input: {
  appId: string;
  openid: string;
  unionid: string | null;
}): Promise<WechatLoginUser> {
  const existing = await resolveExistingWechatUser(input);
  if (existing) return existing;

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          role: "GUEST",
          status: "PENDING",
          verificationStatus: "NOT_SUBMITTED",
          accountStatus: "ACTIVE",
        },
        select: loginUserSelect,
      });
      await tx.wechatIdentity.create({
        data: {
          userId: user.id,
          appId: input.appId,
          openid: input.openid,
          unionid: input.unionid,
          lastLoginAt: new Date(),
        },
      });
      return user;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const raced = await resolveExistingWechatUser(input);
      if (raced) return raced;
    }
    throw error;
  }
}
