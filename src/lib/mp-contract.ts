import type { MpErrorCode, MpErrorBody, MpSuccessBody } from "@/lib/mp-api";
import type { MpPagination } from "@/lib/mp-pagination";
import type { MpSessionUser } from "@/lib/mp-auth-contract";

export type { MpErrorBody, MpErrorCode, MpPagination, MpSessionUser, MpSuccessBody };

export type MpIsoDateString = string;
export type MpNullableIsoDateString = MpIsoDateString | null;

export type MpLoginData = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  expiresAt: MpIsoDateString;
  user: MpSessionUser;
};

export type MpProfileDto = {
  id: string;
  name: string | null;
  identityType: "ALUMNI" | "STUDENT" | "TEACHER" | null;
  verificationStatus: "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "REJECTED";
  graduationClass: string | null;
  className: string | null;
  teacherPosition: string | null;
  contact: string | null;
  city: string | null;
  university: string | null;
  major: string | null;
  industry: string | null;
  contactVisibility: "PRIVATE" | "VERIFIED_USERS";
};

export type MpNewsListItem = {
  id: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: MpNullableIsoDateString;
  createdAt: MpIsoDateString;
};

export type MpNewsDetail = MpNewsListItem & {
  content: string;
  updatedAt: MpIsoDateString;
};

export type MpEventListItem = {
  id: string;
  title: string;
  summary: string | null;
  location: string | null;
  eventDate: MpIsoDateString;
  endDate: MpNullableIsoDateString;
  coverImage: string | null;
  maxAttendees: number | null;
  registrationStatus: string | null;
  registrationCount: number;
  remainingSlots: number | null;
};

export type MpEventDetail = MpEventListItem & { content: string };

export type MpRegistrationDto = {
  id: string;
  eventId: string;
  name: string;
  contact: string | null;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  cancelledAt: MpNullableIsoDateString;
  createdAt: MpIsoDateString;
  updatedAt: MpIsoDateString;
};

export type MpVerificationRequestDto = {
  id: string;
  identityType: "ALUMNI" | "STUDENT" | "TEACHER";
  name: string;
  graduationClass: string | null;
  className: string | null;
  teacherPosition: string | null;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  adminNote: string | null;
  createdAt: MpIsoDateString;
  updatedAt: MpIsoDateString;
};

export const MP_API_ENDPOINTS = [
  { method: "POST", path: "/api/mp/auth/wechat-login", auth: "public" },
  { method: "POST", path: "/api/mp/auth/dev-login", auth: "development" },
  { method: "GET", path: "/api/mp/auth/me", auth: "bearer" },
  { method: "GET", path: "/api/mp/profile", auth: "bearer" },
  { method: "PATCH", path: "/api/mp/profile", auth: "bearer" },
  { method: "GET", path: "/api/mp/verification", auth: "bearer" },
  { method: "POST", path: "/api/mp/verification", auth: "bearer" },
  { method: "GET", path: "/api/mp/news", auth: "bearer" },
  { method: "GET", path: "/api/mp/news/[id]", auth: "bearer" },
  { method: "GET", path: "/api/mp/events", auth: "bearer" },
  { method: "GET", path: "/api/mp/events/[id]", auth: "bearer" },
  { method: "POST", path: "/api/mp/events/[id]/registration", auth: "verified" },
  { method: "DELETE", path: "/api/mp/events/[id]/registration", auth: "verified" },
  { method: "GET", path: "/api/mp/registrations", auth: "bearer" },
  { method: "POST", path: "/api/mp/account/deletion", auth: "bearer" },
] as const;

export type MpApiEndpoint = (typeof MP_API_ENDPOINTS)[number];
