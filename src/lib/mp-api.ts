import { NextResponse } from "next/server";

export const MP_API_VERSION = "1";

export const MP_ERROR_CODES = {
  AUTH_REQUIRED: "MP_AUTH_REQUIRED",
  AUTH_HEADER_INVALID: "MP_AUTH_HEADER_INVALID",
  TOKEN_INVALID: "MP_TOKEN_INVALID",
  FORBIDDEN: "MP_FORBIDDEN",
  VALIDATION_ERROR: "MP_VALIDATION_ERROR",
  INVALID_JSON: "MP_INVALID_JSON",
  PAYLOAD_TOO_LARGE: "MP_PAYLOAD_TOO_LARGE",
  RATE_LIMITED: "MP_RATE_LIMITED",
  DEV_LOGIN_DISABLED: "MP_DEV_LOGIN_DISABLED",
  DEV_USER_NOT_ALLOWED: "MP_DEV_USER_NOT_ALLOWED",
  USER_UNAVAILABLE: "MP_USER_UNAVAILABLE",
  WECHAT_NOT_CONFIGURED: "MP_WECHAT_NOT_CONFIGURED",
  WECHAT_LOGIN_FAILED: "MP_WECHAT_LOGIN_FAILED",
  WECHAT_UPSTREAM_ERROR: "MP_WECHAT_UPSTREAM_ERROR",
  VERIFICATION_PENDING: "MP_VERIFICATION_PENDING",
  ALREADY_VERIFIED: "MP_ALREADY_VERIFIED",
  NOT_FOUND: "MP_NOT_FOUND",
  EVENT_CLOSED: "MP_EVENT_CLOSED",
  EVENT_FULL: "MP_EVENT_FULL",
  ALREADY_REGISTERED: "MP_ALREADY_REGISTERED",
  REGISTRATION_NOT_FOUND: "MP_REGISTRATION_NOT_FOUND",
  INTERNAL_ERROR: "MP_INTERNAL_ERROR",
} as const;

export type MpErrorCode =
  (typeof MP_ERROR_CODES)[keyof typeof MP_ERROR_CODES];

export type MpSuccessBody<T> = {
  ok: true;
  data: T;
};

export type MpErrorBody = {
  ok: false;
  error: {
    code: MpErrorCode;
    message: string;
    requestId: string;
  };
};

function noStoreHeaders(headers?: HeadersInit) {
  const result = new Headers(headers);
  result.set("Cache-Control", "no-store");
  result.set("X-MP-API-Version", MP_API_VERSION);
  return result;
}

export function mpSuccess<T>(data: T, init: ResponseInit = {}) {
  return NextResponse.json<MpSuccessBody<T>>(
    { ok: true, data },
    { ...init, headers: noStoreHeaders(init.headers) },
  );
}

export function mpError(
  code: MpErrorCode,
  message: string,
  status: number,
  init: Omit<ResponseInit, "status"> = {},
) {
  const requestId = crypto.randomUUID();
  const headers = noStoreHeaders(init.headers);
  headers.set("X-Request-ID", requestId);
  return NextResponse.json<MpErrorBody>(
    {
      ok: false,
      error: {
        code,
        message,
        requestId,
      },
    },
    { ...init, status, headers },
  );
}
