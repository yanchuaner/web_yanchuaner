export const MP_CONTACT_VISIBILITIES = [
  "PRIVATE",
  "VERIFIED_USERS",
] as const;

export type MpContactVisibility =
  (typeof MP_CONTACT_VISIBILITIES)[number];

export type MpProfilePatch = {
  contact?: string | null;
  city?: string | null;
  university?: string | null;
  major?: string | null;
  industry?: string | null;
  contactVisibility?: MpContactVisibility;
};

export type MpProfileParseResult =
  | { ok: true; value: MpProfilePatch }
  | { ok: false; message: string };

const LIMITS = {
  contact: 128,
  city: 100,
  university: 150,
  major: 100,
  industry: 100,
} as const;
const ALLOWED_KEYS = new Set([...Object.keys(LIMITS), "contactVisibility"]);
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

export function parseMpProfilePatch(input: unknown): MpProfileParseResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, message: "个人资料格式无效" };
  }

  const body = input as Record<string, unknown>;
  const keys = Object.keys(body);
  if (keys.length === 0) {
    return { ok: false, message: "请至少提交一个可编辑字段" };
  }
  if (keys.some((key) => !ALLOWED_KEYS.has(key))) {
    return { ok: false, message: "个人资料包含只读或不支持的字段" };
  }

  const value: MpProfilePatch = {};
  for (const field of Object.keys(LIMITS) as Array<keyof typeof LIMITS>) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    const raw = body[field];
    if (raw !== null && typeof raw !== "string") {
      return { ok: false, message: `${field} 字段格式无效` };
    }
    const normalized =
      typeof raw === "string" ? raw.trim().normalize("NFC") : "";
    if (
      normalized.length > LIMITS[field] ||
      CONTROL_CHARACTERS.test(normalized)
    ) {
      return { ok: false, message: `${field} 字段内容无效或过长` };
    }
    value[field] = normalized || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, "contactVisibility")) {
    if (
      body.contactVisibility !== "PRIVATE" &&
      body.contactVisibility !== "VERIFIED_USERS"
    ) {
      return { ok: false, message: "联系方式可见性无效" };
    }
    value.contactVisibility = body.contactVisibility;
  }

  return { ok: true, value };
}
