"use strict";

const fs = require("node:fs");
const path = require("node:path");

const SOURCE_FILE = path.resolve(__dirname, "source_alumni.json");
const TARGET_FILE = path.resolve(__dirname, "..", "src", "data", "alumni_encrypted.ts");

function assertValidRecord(record, index) {
  const prefix = `Invalid record at index ${index}`;

  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw new Error(`${prefix}: record must be an object`);
  }

  const fields = ["name", "className", "fixedID"];
  for (const field of fields) {
    if (typeof record[field] !== "string" || record[field].trim().length === 0) {
      throw new Error(`${prefix}: field \"${field}\" must be a non-empty string`);
    }
  }

  const optionalFields = ["message", "university", "major", "city"];
  for (const field of optionalFields) {
    if (record[field] !== undefined && typeof record[field] !== "string") {
      throw new Error(`${prefix}: optional field \"${field}\" must be a string when provided`);
    }
  }
}

function loadSourceRecords() {
  if (!fs.existsSync(SOURCE_FILE)) {
    throw new Error(`Source file not found: ${SOURCE_FILE}`);
  }

  const raw = fs.readFileSync(SOURCE_FILE, "utf8");
  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse source JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Source data must be an array");
  }

  parsed.forEach(assertValidRecord);
  return parsed.map((record) => ({
    name: record.name.trim(),
    className: record.className.trim(),
    fixedID: record.fixedID.trim(),
    message: typeof record.message === "string" ? record.message.trim() : "",
    university: typeof record.university === "string" ? record.university.trim() : "",
    major: typeof record.major === "string" ? record.major.trim() : "",
    city: typeof record.city === "string" ? record.city.trim() : "",
  }));
}

function buildTargetTs(base64) {
  return `export type AlumniRecord = {
  name: string;
  className: string;
  fixedID: string;
  message: string;
  university: string;
  major: string;
  city: string;
};

export const ALUMNI_ENCRYPTED_B64 = \"${base64}\";

function decodeBase64Utf8(base64Text: string): string {
  const maybeBuffer = (globalThis as unknown as {
    Buffer?: { from: (input: string, encoding: string) => { toString: (encoding: string) => string } };
  }).Buffer;

  if (maybeBuffer) {
    return maybeBuffer.from(base64Text, \"base64\").toString(\"utf-8\");
  }

  if (typeof globalThis.atob !== \"function\") {
    throw new Error(\"No base64 decoder available in current runtime\");
  }

  const binary = globalThis.atob(base64Text);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeAlumniList(): AlumniRecord[] {
  const jsonText = decodeBase64Utf8(ALUMNI_ENCRYPTED_B64);
  return JSON.parse(jsonText) as AlumniRecord[];
}
`;
}

function main() {
  const records = loadSourceRecords();
  const json = JSON.stringify(records);
  const encryptedBase64 = Buffer.from(json, "utf8").toString("base64");
  const targetContent = buildTargetTs(encryptedBase64);

  fs.writeFileSync(TARGET_FILE, targetContent, "utf8");

  const okMessage = `共处理了 ${records.length} 条校友数据，已成功写入！`;
  console.log(`\x1b[32m${okMessage}\x1b[0m`);
}

try {
  main();
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`\x1b[31m[update-list] ${msg}\x1b[0m`);
  process.exitCode = 1;
}
