import { createHmac, randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db";

export type IdentityEventName =
  | "account.disabled"
  | "account.enabled"
  | "sessions.revoked"
  | "role.changed"
  | "account.verified"
  | "account.rejected";

export type IdentityEventData = {
  userId: string;
  event: IdentityEventName;
  role?: string | null;
  accountStatus?: string | null;
  status?: string | null;
};

export type IdentityEventConfig = {
  webhookUrls: URL[];
  secret: string;
};

export type IdentityEventDeliverySummary = {
  attempted: number;
  delivered: number;
  failed: number;
};

const IDENTITY_EVENT_SIGNATURE_PREFIX = "sha256=";
const IDENTITY_EVENT_MAX_BODY_BYTES = 16 * 1024;

export function getIdentityEventConfig(): IdentityEventConfig | null {
  const rawUrls = (process.env.IDENTITY_EVENT_WEBHOOK_URLS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const secret = (process.env.IDENTITY_EVENT_WEBHOOK_SECRET ?? "").trim();
  if (rawUrls.length === 0 || secret.length < 32) return null;
  const webhookUrls: URL[] = [];
  for (const raw of rawUrls) {
    try {
      const url = new URL(raw);
      if (url.protocol === "https:" || url.protocol === "http:") {
        webhookUrls.push(url);
      }
    } catch {
      // 忽略无效地址，避免配置错误导致整体不可用。
    }
  }
  if (webhookUrls.length === 0) return null;
  return { webhookUrls, secret };
}

export function buildIdentityEventPayload(
  data: IdentityEventData,
  eventId: string,
  occurredAt: number,
): string {
  return JSON.stringify({
    event_id: eventId,
    subject: data.userId,
    event: data.event,
    role: data.role ?? null,
    account_status: data.accountStatus ?? null,
    status: data.status ?? null,
    occurred_at: occurredAt,
  });
}

export function identityEventSignature(secret: string, payload: string): string {
  return (
    IDENTITY_EVENT_SIGNATURE_PREFIX +
    createHmac("sha256", secret).update(payload, "utf8").digest("hex")
  );
}

export async function queueIdentityEvent(
  tx: Prisma.TransactionClient,
  data: IdentityEventData,
): Promise<void> {
  const eventId = randomUUID();
  const occurredAt = Math.floor(Date.now() / 1000);
  await tx.identityEvent.create({
    data: {
      eventId,
      userId: data.userId,
      event: data.event,
      role: data.role ?? null,
      accountStatus: data.accountStatus ?? null,
      status: data.status ?? null,
      payload: buildIdentityEventPayload(data, eventId, occurredAt),
    },
  });
}

async function deliverEvent(
  config: IdentityEventConfig,
  payload: string,
  occurredAt: number,
): Promise<void> {
  const signature = identityEventSignature(config.secret, payload);
  const body = new TextEncoder().encode(payload);
  if (body.byteLength > IDENTITY_EVENT_MAX_BODY_BYTES) {
    throw new Error("identity event payload exceeds 16 KiB");
  }
  const results = await Promise.allSettled(
    config.webhookUrls.map(async (url) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);
      try {
        const response = await fetch(url, {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "X-Yanchuaner-Event-Id": JSON.parse(payload).event_id,
            "X-Yanchuaner-Event-Time": String(occurredAt),
            "X-Yanchuaner-Signature": signature,
          },
          body,
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      } finally {
        clearTimeout(timer);
      }
    }),
  );
  const failed = results.filter((result) => result.status === "rejected");
  if (failed.length > 0) {
    throw new Error(
      failed
        .map((result) => (result.status === "rejected" ? String(result.reason) : ""))
        .filter(Boolean)
        .join("; "),
    );
  }
}

export async function deliverPendingIdentityEvents(
  limit = 25,
): Promise<IdentityEventDeliverySummary> {
  const config = getIdentityEventConfig();
  if (!config) return { attempted: 0, delivered: 0, failed: 0 };
  const now = new Date();
  const events = await prisma.identityEvent.findMany({
    where: {
      OR: [
        { state: "PENDING" },
        { state: "FAILED", nextAttemptAt: { lte: now } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  let delivered = 0;
  let failed = 0;
  for (const event of events) {
    let payload: {
      occurred_at?: number;
    };
    try {
      payload = JSON.parse(event.payload) as { occurred_at?: number };
    } catch {
      await prisma.identityEvent.update({
        where: { id: event.id },
        data: {
          state: "FAILED",
          attempts: { increment: 1 },
          lastError: "payload is not valid JSON",
          nextAttemptAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      failed += 1;
      continue;
    }
    const occurredAt = payload.occurred_at ?? Math.floor(Date.now() / 1000);
    try {
      await deliverEvent(config, event.payload, occurredAt);
      await prisma.identityEvent.update({
        where: { id: event.id },
        data: { state: "SENT", deliveredAt: new Date(), lastError: null },
      });
      delivered += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const backoffMs = Math.min(
        60 * 60 * 1000,
        (event.attempts + 1) * 5 * 60 * 1000,
      );
      await prisma.identityEvent.update({
        where: { id: event.id },
        data: {
          state: "FAILED",
          attempts: { increment: 1 },
          lastError: message,
          nextAttemptAt: new Date(Date.now() + backoffMs),
        },
      });
      failed += 1;
    }
  }
  return { attempted: events.length, delivered, failed };
}

export function identityEventNameForAction(
  action: string,
): IdentityEventName | null {
  switch (action) {
    case "disable-account":
      return "account.disabled";
    case "enable-account":
      return "account.enabled";
    case "logout-all-sessions":
      return "sessions.revoked";
    case "grant-admin":
    case "revoke-admin":
      return "role.changed";
    case "reject-alumni":
      return "account.rejected";
    case "approve-alumni":
      return "account.verified";
    default:
      return null;
  }
}
