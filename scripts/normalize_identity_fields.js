#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dryRun = process.argv.includes("--dry-run");

function resolveDatabasePath() {
  const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("normalize-identity-fields only supports SQLite file: DATABASE_URL values");
  }

  const rawPath = databaseUrl.slice("file:".length);
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
}

function quoteIdent(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Unsafe SQL identifier: ${value}`);
  }
  return `"${value}"`;
}

function normalizeGraduationClass(value) {
  if (typeof value !== "string") return "";
  const normalized = value.trim().normalize("NFC");
  const match = normalized.match(/^(20\d{2})届?$/);
  return match ? match[1] : normalized;
}

function normalizeIdentityName(value) {
  return typeof value === "string" ? value.trim().normalize("NFC") : "";
}

function normalizeClassName(value) {
  if (typeof value !== "string") return "";
  const normalized = value.trim().normalize("NFC");
  const match = normalized.match(/^(\d{1,2})(?:班)?$/);
  return match ? match[1] : normalized;
}

const targets = [
  {
    table: "User",
    fields: [
      ["name", normalizeIdentityName],
      ["graduationClass", normalizeGraduationClass],
      ["className", normalizeClassName],
    ],
  },
  {
    table: "WhitelistRoster",
    fields: [
      ["name", normalizeIdentityName],
      ["graduationClass", normalizeGraduationClass],
      ["className", normalizeClassName],
    ],
  },
  {
    table: "Achievement",
    fields: [["graduationClass", normalizeGraduationClass]],
  },
  {
    table: "AlumniCorrectionRequest",
    fields: [
      ["currentGraduationClass", normalizeGraduationClass],
      ["currentClassName", normalizeClassName],
      ["requestedGraduationClass", normalizeGraduationClass],
      ["requestedClassName", normalizeClassName],
    ],
  },
];

function tableExists(db, table) {
  return Boolean(
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(table),
  );
}

function getColumns(db, table) {
  return new Set(db.prepare(`PRAGMA table_info(${quoteIdent(table)})`).all().map((column) => column.name));
}

function normalizeTarget(db, target) {
  if (!tableExists(db, target.table)) {
    console.log(`${target.table}: skipped (table not found)`);
    return { scanned: 0, updated: 0 };
  }

  const availableColumns = getColumns(db, target.table);
  const fields = target.fields.filter(([field]) => {
    const exists = availableColumns.has(field);
    if (!exists) {
      console.log(`${target.table}.${field}: skipped (column not found)`);
    }
    return exists;
  });

  if (!availableColumns.has("id") || fields.length === 0) {
    console.log(`${target.table}: skipped (no compatible identity fields)`);
    return { scanned: 0, updated: 0 };
  }

  const columns = ["id", ...fields.map(([field]) => field)]
    .map(quoteIdent)
    .join(", ");
  const rows = db.prepare(`SELECT ${columns} FROM ${quoteIdent(target.table)}`).all();
  let updated = 0;

  for (const row of rows) {
    const changes = {};
    for (const [field, normalize] of fields) {
      const value = row[field];
      if (typeof value !== "string" || value.length === 0) continue;

      const normalized = normalize(value);
      if (normalized && normalized !== value) {
        changes[field] = normalized;
      }
    }

    const changedFields = Object.keys(changes);
    if (changedFields.length === 0) continue;

    updated++;
    if (dryRun) continue;

    const assignments = changedFields
      .map((field) => `${quoteIdent(field)} = @${field}`)
      .join(", ");
    db.prepare(
      `UPDATE ${quoteIdent(target.table)} SET ${assignments} WHERE ${quoteIdent("id")} = @id`,
    ).run({ id: row.id, ...changes });
  }

  console.log(
    `${target.table}: scanned ${rows.length} rows, ${dryRun ? "would normalize" : "normalized"} ${updated} rows`,
  );
  return { scanned: rows.length, updated };
}

function main() {
  const dbPath = resolveDatabasePath();
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database file not found: ${dbPath}`);
  }

  console.log(
    `${dryRun ? "Dry run" : "Normalizing"} identity fields in ${dbPath}`,
  );

  const db = new Database(dbPath);
  db.pragma("busy_timeout = 5000");

  try {
    const run = db.transaction(() => {
      let scanned = 0;
      let updated = 0;
      for (const target of targets) {
        const result = normalizeTarget(db, target);
        scanned += result.scanned;
        updated += result.updated;
      }
      return { scanned, updated };
    });

    const result = run();
    console.log(
      `${dryRun ? "Dry run complete" : "Normalization complete"}: scanned ${result.scanned} rows, ${dryRun ? "would update" : "updated"} ${result.updated} rows`,
    );
  } finally {
    db.close();
  }
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
