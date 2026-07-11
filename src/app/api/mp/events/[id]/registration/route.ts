import { NextRequest } from "next/server";
import { readJsonBody } from "@/lib/auth-utils";
import {
  cancelEventRegistration,
  parseEventRegistrationInput,
  registerForEvent,
  type EventRegistrationRecord,
} from "@/lib/event-registration";
import { authenticateMpRequest } from "@/lib/mp-auth";
import { MP_ERROR_CODES, mpError, mpSuccess } from "@/lib/mp-api";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getRouteId, type IdRouteParams } from "@/lib/route-params";

function registrationDto(registration: EventRegistrationRecord) {
  return {
    id: registration.id,
    eventId: registration.eventId,
    name: registration.name,
    contact: registration.contact,
    message: registration.message,
    status: registration.status,
    cancelledAt: registration.cancelledAt?.toISOString() ?? null,
    createdAt: registration.createdAt.toISOString(),
    updatedAt: registration.updatedAt.toISOString(),
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: IdRouteParams },
) {
  const auth = await authenticateMpRequest(req);
  if (!auth.ok) return auth.response;
  if (auth.auth.user.verificationStatus !== "VERIFIED") {
    return mpError(
      MP_ERROR_CODES.FORBIDDEN,
      "完成身份认证后才能报名活动",
      403,
    );
  }

  const [userLimit, ipLimit] = await Promise.all([
    rateLimit(
      `mp:event-registration:user:${auth.auth.user.id}`,
      20,
      60 * 60 * 1000,
    ),
    rateLimit(
      `mp:event-registration:ip:${getClientIp(req)}`,
      50,
      60 * 60 * 1000,
    ),
  ]);
  if (!userLimit.ok || !ipLimit.ok) {
    return mpError(
      MP_ERROR_CODES.RATE_LIMITED,
      "报名操作过于频繁，请稍后再试",
      429,
      {
        headers: {
          "Retry-After": String(
            Math.max(userLimit.retryAfter, ipLimit.retryAfter),
          ),
        },
      },
    );
  }

  try {
    const body = await readJsonBody<unknown>(req, 4096);
    const parsed = parseEventRegistrationInput(body);
    if (!parsed.ok) {
      return mpError(
        MP_ERROR_CODES.VALIDATION_ERROR,
        parsed.message,
        400,
      );
    }
    const name = auth.auth.user.name?.trim().normalize("NFC") ?? "";
    if (!name || name.length > 64) {
      return mpError(
        MP_ERROR_CODES.VALIDATION_ERROR,
        "认证姓名不可用，请联系管理员",
        409,
      );
    }

    const eventId = await getRouteId(params);
    const result = await registerForEvent({
      eventId,
      userId: auth.auth.user.id,
      name,
      ...parsed.value,
    });
    if (result.kind === "NOT_FOUND") {
      return mpError(MP_ERROR_CODES.NOT_FOUND, "活动不存在", 404);
    }
    if (result.kind === "CLOSED") {
      return mpError(
        MP_ERROR_CODES.EVENT_CLOSED,
        "活动已开始，报名已关闭",
        409,
      );
    }
    if (result.kind === "FULL") {
      return mpError(MP_ERROR_CODES.EVENT_FULL, "活动名额已满", 409);
    }
    if (result.kind === "ALREADY_REGISTERED") {
      return mpError(
        MP_ERROR_CODES.ALREADY_REGISTERED,
        "你已报名该活动",
        409,
      );
    }
    if (result.kind === "REJECTED") {
      return mpError(
        MP_ERROR_CODES.ALREADY_REGISTERED,
        "该报名已被拒绝，请联系管理员",
        409,
      );
    }
    return mpSuccess(
      {
        registration: registrationDto(result.registration),
        registrationStatus: result.registration.status,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return mpError(MP_ERROR_CODES.PAYLOAD_TOO_LARGE, "请求体过大", 413);
    }
    if (error instanceof SyntaxError) {
      return mpError(MP_ERROR_CODES.INVALID_JSON, "JSON 格式无效", 400);
    }
    return mpError(
      MP_ERROR_CODES.INTERNAL_ERROR,
      "活动报名失败，请稍后再试",
      500,
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: IdRouteParams },
) {
  const auth = await authenticateMpRequest(req);
  if (!auth.ok) return auth.response;
  if (auth.auth.user.verificationStatus !== "VERIFIED") {
    return mpError(
      MP_ERROR_CODES.FORBIDDEN,
      "完成身份认证后才能取消报名",
      403,
    );
  }

  const limit = await rateLimit(
    `mp:event-registration-cancel:${auth.auth.user.id}`,
    20,
    60 * 60 * 1000,
  );
  if (!limit.ok) {
    return mpError(
      MP_ERROR_CODES.RATE_LIMITED,
      "取消报名操作过于频繁，请稍后再试",
      429,
      { headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  try {
    const eventId = await getRouteId(params);
    const result = await cancelEventRegistration({
      eventId,
      userId: auth.auth.user.id,
    });
    if (result.kind === "NOT_FOUND") {
      return mpError(
        MP_ERROR_CODES.REGISTRATION_NOT_FOUND,
        "未找到该活动的报名记录",
        404,
      );
    }
    if (result.kind === "CLOSED") {
      return mpError(
        MP_ERROR_CODES.EVENT_CLOSED,
        "活动已开始，不能取消报名",
        409,
      );
    }
    if (result.kind === "NOT_ACTIVE") {
      return mpError(
        MP_ERROR_CODES.ALREADY_REGISTERED,
        "该报名当前不可取消",
        409,
      );
    }
    return mpSuccess({
      registration: registrationDto(result.registration),
      registrationStatus: result.registration.status,
    });
  } catch {
    return mpError(
      MP_ERROR_CODES.INTERNAL_ERROR,
      "取消报名失败，请稍后再试",
      500,
    );
  }
}
