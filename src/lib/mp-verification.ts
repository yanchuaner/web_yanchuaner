import {
  normalizeClassName,
  normalizeGraduationClass,
  normalizeIdentityName,
  validClassName,
  validGraduationClass,
} from "@/lib/identity-fields";

export const MP_IDENTITY_TYPES = ["ALUMNI", "STUDENT", "TEACHER"] as const;

export type MpIdentityType = (typeof MP_IDENTITY_TYPES)[number];

export type MpVerificationSubmission = {
  identityType: MpIdentityType;
  name: string;
  graduationClass: string | null;
  className: string | null;
  teacherPosition: string | null;
};

export type MpVerificationParseResult =
  | { ok: true; value: MpVerificationSubmission }
  | { ok: false; message: string };

export type MpVerificationMatch = {
  matchResult: "MATCHED" | "CONFLICT" | "NOT_FOUND" | "NOT_APPLICABLE";
  matchedRosterId: string | null;
};

const ALLOWED_KEYS = new Set([
  "identityType",
  "name",
  "graduationClass",
  "className",
  "teacherPosition",
]);
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

function text(value: unknown) {
  return typeof value === "string" ? value.trim().normalize("NFC") : "";
}

function optionalText(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string" ? value.trim().normalize("NFC") : null;
}

export function classifyMpVerificationMatch(
  identityType: MpIdentityType,
  matches: Array<{ id: string }>,
): MpVerificationMatch {
  if (identityType === "TEACHER") {
    return { matchResult: "NOT_APPLICABLE", matchedRosterId: null };
  }
  if (matches.length === 1) {
    return { matchResult: "MATCHED", matchedRosterId: matches[0].id };
  }
  if (matches.length > 1) {
    return { matchResult: "CONFLICT", matchedRosterId: null };
  }
  return { matchResult: "NOT_FOUND", matchedRosterId: null };
}

export function parseMpVerificationSubmission(
  input: unknown,
): MpVerificationParseResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, message: "认证资料格式无效" };
  }

  const body = input as Record<string, unknown>;
  if (Object.keys(body).some((key) => !ALLOWED_KEYS.has(key))) {
    return { ok: false, message: "认证资料包含不支持的字段" };
  }

  const identityType = body.identityType;
  if (
    identityType !== "ALUMNI" &&
    identityType !== "STUDENT" &&
    identityType !== "TEACHER"
  ) {
    return { ok: false, message: "身份类型无效" };
  }

  const name = normalizeIdentityName(body.name);
  if (!name || name.length > 64 || CONTROL_CHARACTERS.test(name)) {
    return { ok: false, message: "姓名不能为空且不超过 64 个字符" };
  }

  if (identityType === "TEACHER") {
    const teacherPosition = text(body.teacherPosition);
    const graduationClass = optionalText(body.graduationClass);
    const className = optionalText(body.className);
    if (graduationClass || className) {
      return { ok: false, message: "教师认证不填写毕业年份或班级" };
    }
    if (
      !teacherPosition ||
      teacherPosition.length > 50 ||
      CONTROL_CHARACTERS.test(teacherPosition)
    ) {
      return { ok: false, message: "教师职位不能为空且不超过 50 个字符" };
    }
    return {
      ok: true,
      value: {
        identityType,
        name,
        graduationClass: null,
        className: null,
        teacherPosition,
      },
    };
  }

  if (optionalText(body.teacherPosition)) {
    return { ok: false, message: "校友或学生认证不填写教师职位" };
  }
  const graduationClass = normalizeGraduationClass(body.graduationClass);
  if (!validGraduationClass(graduationClass)) {
    return { ok: false, message: "毕业或预计毕业年份格式无效" };
  }

  const rawClassName = optionalText(body.className);
  const className = rawClassName ? normalizeClassName(rawClassName) : null;
  if (className && !validClassName(className)) {
    return { ok: false, message: "班级需为 1-99 的数字" };
  }

  return {
    ok: true,
    value: {
      identityType,
      name,
      graduationClass,
      className,
      teacherPosition: null,
    },
  };
}
