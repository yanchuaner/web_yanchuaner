import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  getAuthenticatedUser,
} from "@/lib/admin-auth";
import { readJsonBody } from "@/lib/auth-utils";
import {
  cancelEventRegistration,
  parseEventRegistrationInput,
  registerForEvent,
} from "@/lib/event-registration";
import { getRouteId, type IdRouteParams } from "@/lib/route-params";
import { getPublishedEvent } from "@/lib/published-content";

export async function GET(req: NextRequest, { params }: { params: IdRouteParams }) {
  const user = await getAuthenticatedUser(req);
  if (!user || (user.role !== "ALUMNI" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const id = await getRouteId(params);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const event = await getPublishedEvent(id, user.id);

    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: IdRouteParams }) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.verificationStatus !== "VERIFIED") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // 限流：每 30 秒 3 次
  const ip = getClientIp(req);
  const limit = await rateLimit(`event-reg:${user.id}:${ip}`, 3, 30_000);
  if (!limit.ok) {
    return NextResponse.json({ error: '报名过于频繁，请稍后再试' }, { status: 429 });
  }

  try {
    const id = await getRouteId(params);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await readJsonBody<unknown>(req, 4096);
    const parsed = parseEventRegistrationInput(body, {
      allowLegacyName: true,
    });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.message }, { status: 400 });
    }
    const name = user.name?.trim().normalize("NFC") ?? "";
    if (!name || name.length > 64) {
      return NextResponse.json(
        { error: "认证姓名不可用，请联系管理员" },
        { status: 409 },
      );
    }

    const result = await registerForEvent({
      eventId: id,
      userId: user.id,
      name,
      ...parsed.value,
    });
    if (result.kind === "NOT_FOUND") {
      return NextResponse.json({ error: "活动不存在" }, { status: 404 });
    }
    if (result.kind === "CLOSED") {
      return NextResponse.json({ error: "活动已开始，报名已关闭" }, { status: 409 });
    }
    if (result.kind === "FULL") {
      return NextResponse.json({ error: "报名已满" }, { status: 409 });
    }
    if (result.kind === "ALREADY_REGISTERED") {
      return NextResponse.json({ error: "你已报名该活动" }, { status: 409 });
    }
    if (result.kind === "REJECTED") {
      return NextResponse.json(
        { error: "该报名已被拒绝，请联系管理员" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: true, registration: result.registration },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "请求体过大" }, { status: 413 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "JSON 格式无效" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: IdRouteParams }) {
  const user = await getAuthenticatedUser(req);
  if (!user || (user.role !== "ALUMNI" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limit = await rateLimit(`event-cancel:${user.id}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "取消操作过于频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  try {
    const id = await getRouteId(params);
    const result = await cancelEventRegistration({ eventId: id, userId: user.id });
    if (result.kind === "NOT_FOUND") {
      return NextResponse.json({ error: "未找到报名记录" }, { status: 404 });
    }
    if (result.kind === "CLOSED") {
      return NextResponse.json({ error: "活动已开始，不能取消报名" }, { status: 409 });
    }
    if (result.kind === "NOT_ACTIVE") {
      return NextResponse.json({ error: "该报名当前不可取消" }, { status: 409 });
    }
    return NextResponse.json({ success: true, registration: result.registration });
  } catch {
    return NextResponse.json({ error: "取消报名失败" }, { status: 500 });
  }
}
