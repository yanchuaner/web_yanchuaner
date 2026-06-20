import { writeFile } from "node:fs/promises";
import prisma from "../src/lib/db";

function csv(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

async function main() {
  const users = await prisma.user.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { createdAt: "asc" },
  });
  const nameCounts = new Map<string, number>();
  for (const user of users) {
    const name = user.name?.trim() || "";
    if (name) nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
  }
  const rows = [
    [
      "id",
      "name",
      "contact",
      "identityCode",
      "postCount",
      "possibleDuplicate",
      "missingContact",
      "claimableLegacyRecord",
    ].map(csv).join(","),
    ...users.map((user) =>
      [
        user.id,
        user.name,
        user.contact,
        user.identityCode,
        user._count.posts,
        (nameCounts.get(user.name?.trim() || "") || 0) > 1,
        !user.contact,
        !user.username &&
          !user.email &&
          !user.passwordHash &&
          !user.mergedIntoUserId,
      ]
        .map(csv)
        .join(","),
    ),
  ];
  const output = "user-migration-review.csv";
  await writeFile(output, `\uFEFF${rows.join("\n")}`, "utf8");
  console.log(
    JSON.stringify(
      {
        totalUsers: users.length,
        duplicateNameRecords: users.filter(
          (user) => (nameCounts.get(user.name?.trim() || "") || 0) > 1,
        ).length,
        missingContact: users.filter((user) => !user.contact).length,
        linkedPosts: users.reduce((sum, user) => sum + user._count.posts, 0),
        output,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
