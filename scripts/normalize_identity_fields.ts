import prisma from "../src/lib/db";
import {
  normalizeClassName,
  normalizeGraduationClass,
} from "../src/lib/identity-fields";

type ModelName =
  | "user"
  | "whitelistRoster"
  | "achievement"
  | "alumniCorrectionRequest";

async function normalizeModel(
  modelName: ModelName,
  fields: Array<"graduationClass" | "className" | "currentGraduationClass" | "currentClassName" | "requestedGraduationClass" | "requestedClassName">,
) {
  const model = prisma[modelName] as any;
  const rows = await model.findMany({
    select: {
      id: true,
      ...Object.fromEntries(fields.map((field) => [field, true])),
    },
  });

  let updated = 0;
  for (const row of rows) {
    const data: Record<string, string | null> = {};
    for (const field of fields) {
      const value = row[field];
      if (typeof value !== "string" || !value) continue;
      const normalized = field.toLowerCase().includes("classname")
        ? normalizeClassName(value)
        : normalizeGraduationClass(value);
      if (normalized && normalized !== value) {
        data[field] = normalized;
      }
    }
    if (Object.keys(data).length > 0) {
      await model.update({ where: { id: row.id }, data });
      updated++;
    }
  }

  console.log(`${modelName}: normalized ${updated} rows`);
}

async function main() {
  await normalizeModel("user", ["graduationClass", "className"]);
  await normalizeModel("whitelistRoster", ["graduationClass", "className"]);
  await normalizeModel("achievement", ["graduationClass"]);
  await normalizeModel("alumniCorrectionRequest", [
    "currentGraduationClass",
    "currentClassName",
    "requestedGraduationClass",
    "requestedClassName",
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
