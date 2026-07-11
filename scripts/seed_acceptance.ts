import { hash } from "bcryptjs";
import prisma from "../src/lib/db";

export const ACCEPTANCE_IDS = {
  admin: "acceptance-admin",
  verified: "acceptance-verified",
  candidate: "acceptance-candidate",
  deletion: "acceptance-deletion",
  roster: "acceptance-roster",
  news: "acceptance-news",
  event: "acceptance-event",
} as const;

function assertIsolatedDatabase() {
  const databaseUrl = process.env.DATABASE_URL || "";
  const allowed = process.env.ACCEPTANCE_ALLOW_MUTATION === "true";
  const looksIsolated = /(?:acceptance|\.tmp|staging|ci\.db)/i.test(databaseUrl);
  if (!allowed || !looksIsolated || process.env.NODE_ENV === "production") {
    throw new Error(
      "Acceptance seed requires ACCEPTANCE_ALLOW_MUTATION=true, a clearly isolated DATABASE_URL, and a non-production NODE_ENV",
    );
  }
}

async function upsertUser(input: {
  id: string;
  username: string;
  email: string;
  name: string;
  role?: string;
  verificationStatus?: "NOT_SUBMITTED" | "VERIFIED";
  identityType?: "ALUMNI" | null;
  passwordHash: string;
}) {
  const data = {
    username: input.username,
    passwordHash: input.passwordHash,
    email: input.email,
    emailVerified: new Date(),
    name: input.name,
    role: input.role ?? "ALUMNI",
    status: input.verificationStatus === "VERIFIED" ? "VERIFIED" : "PENDING",
    accountStatus: "ACTIVE",
    verificationStatus: input.verificationStatus ?? "NOT_SUBMITTED",
    identityType: input.identityType ?? null,
    graduationClass: input.identityType === "ALUMNI" ? "2025" : null,
    className: input.identityType === "ALUMNI" ? "1" : null,
    sessionVersion: 0,
  };
  return prisma.user.upsert({
    where: { id: input.id },
    create: { id: input.id, ...data },
    update: data,
  });
}

async function main() {
  assertIsolatedDatabase();
  const passwordHash = await hash("AcceptancePass!2026", 10);

  await upsertUser({
    id: ACCEPTANCE_IDS.admin,
    username: "acceptance-admin",
    email: "acceptance-admin@example.test",
    name: "验收管理员",
    role: "ADMIN",
    verificationStatus: "VERIFIED",
    identityType: "ALUMNI",
    passwordHash,
  });
  await upsertUser({
    id: ACCEPTANCE_IDS.verified,
    username: "acceptance-alumni",
    email: "acceptance-alumni@example.test",
    name: "验收校友",
    verificationStatus: "VERIFIED",
    identityType: "ALUMNI",
    passwordHash,
  });
  await upsertUser({
    id: ACCEPTANCE_IDS.candidate,
    username: "acceptance-candidate",
    email: "acceptance-candidate@example.test",
    name: "待认证校友",
    passwordHash,
  });
  await upsertUser({
    id: "acceptance-pending-web",
    username: "acceptance-pending",
    email: "acceptance-pending@example.test",
    name: "待审核校友",
    verificationStatus: "NOT_SUBMITTED",
    identityType: "ALUMNI",
    passwordHash,
  });
  await prisma.user.update({
    where: { id: "acceptance-pending-web" },
    data: {
      status: "PENDING",
      verificationStatus: "PENDING",
      graduationClass: "2025",
      className: "1",
    },
  });
  await upsertUser({
    id: ACCEPTANCE_IDS.deletion,
    username: "acceptance-deletion",
    email: "acceptance-deletion@example.test",
    name: "待注销用户",
    passwordHash,
  });

  await prisma.identityVerificationRequest.deleteMany({
    where: { userId: ACCEPTANCE_IDS.candidate },
  });
  await prisma.user.update({
    where: { id: ACCEPTANCE_IDS.candidate },
    data: {
      verificationStatus: "NOT_SUBMITTED",
      identityType: null,
      graduationClass: null,
      className: null,
      teacherPosition: null,
    },
  });

  await prisma.whitelistRoster.upsert({
    where: { id: ACCEPTANCE_IDS.roster },
    create: {
      id: ACCEPTANCE_IDS.roster,
      name: "待认证校友",
      graduationClass: "2025",
      className: "1",
    },
    update: {
      name: "待认证校友",
      graduationClass: "2025",
      className: "1",
    },
  });

  await prisma.news.upsert({
    where: { id: ACCEPTANCE_IDS.news },
    create: {
      id: ACCEPTANCE_IDS.news,
      title: "验收新闻",
      summary: "用于隔离环境全流程验收",
      content: "这是一条不包含真实个人信息的验收新闻。",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
    update: {
      title: "验收新闻",
      summary: "用于隔离环境全流程验收",
      content: "这是一条不包含真实个人信息的验收新闻。",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  const eventDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  await prisma.event.upsert({
    where: { id: ACCEPTANCE_IDS.event },
    create: {
      id: ACCEPTANCE_IDS.event,
      title: "验收活动",
      summary: "用于隔离环境报名与取消测试",
      content: "仅供自动化验收。",
      location: "深圳",
      eventDate,
      maxAttendees: 50,
      status: "PUBLISHED",
    },
    update: {
      title: "验收活动",
      summary: "用于隔离环境报名与取消测试",
      content: "仅供自动化验收。",
      location: "深圳",
      eventDate,
      maxAttendees: 50,
      status: "PUBLISHED",
    },
  });
  await prisma.eventRegistration.deleteMany({
    where: {
      eventId: ACCEPTANCE_IDS.event,
      userId: { in: [ACCEPTANCE_IDS.verified, ACCEPTANCE_IDS.deletion] },
    },
  });
  await prisma.story.deleteMany({
    where: { title: "验收投稿", authorId: ACCEPTANCE_IDS.verified },
  });

  console.log(JSON.stringify({
    adminUsername: "acceptance-admin",
    alumniUsername: "acceptance-alumni",
    password: "AcceptancePass!2026",
    mockUserIds: [
      ACCEPTANCE_IDS.verified,
      ACCEPTANCE_IDS.candidate,
      ACCEPTANCE_IDS.deletion,
    ].join(","),
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
