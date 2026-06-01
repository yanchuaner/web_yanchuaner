import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeTags } from "@/lib/tags";

function parseCSVLine(text: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else if (ch === "\n" || ch === "\r") {
        continue;
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function detectHeaders(
  fields: string[],
): { nameIdx: number; classIdx: number; tagsIdx: number } {
  const headerMap: Record<string, string> = {
    姓名: "name",
    name: "name",
    届别: "graduationClass",
    graduationclass: "graduationClass",
    标签: "tags",
    tags: "tags",
  };

  let nameIdx = -1;
  let classIdx = -1;
  let tagsIdx = -1;

  fields.forEach((f, i) => {
    const key = f.toLowerCase().replace(/[\s_-]/g, "");
    const mapped = headerMap[key];
    if (mapped === "name") nameIdx = i;
    else if (mapped === "graduationClass") classIdx = i;
    else if (mapped === "tags") tagsIdx = i;
  });

  return { nameIdx, classIdx, tagsIdx };
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "请上传 CSV 文件" }, { status: 400 });
    }

    const raw = new TextDecoder("utf-8").decode(
      new Uint8Array(await file.arrayBuffer()),
    );
    const lines = raw.split("\n").filter((l) => l.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV 文件至少需要表头行和一行数据" },
        { status: 400 },
      );
    }

    const headers = parseCSVLine(lines[0]);
    const { nameIdx, classIdx, tagsIdx } = detectHeaders(headers);

    if (nameIdx === -1) {
      return NextResponse.json(
        { error: "CSV 缺少必需的列：姓名 (name)" },
        { status: 400 },
      );
    }

    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      if (errors.length >= 20) {
        errors.push(`已达错误上限，第 ${i + 1} 行及之后已跳过`);
        break;
      }
      try {
        const fields = parseCSVLine(lines[i]);
        const name = (fields[nameIdx] || "").trim();
        if (!name) {
          skipped++;
          continue;
        }
        const graduationClass =
          classIdx >= 0 ? (fields[classIdx] || "").trim() || null : null;
        const rawTags =
          tagsIdx >= 0 ? (fields[tagsIdx] || "").trim() || null : null;
        const tags = rawTags ? normalizeTags(rawTags) : null;

        if (name.length > 50) {
          errors.push(`第 ${i + 1} 行：姓名过长`);
          skipped++;
          continue;
        }

        // 按 name + graduationClass 简单去重
        const existing = await prisma.whitelistRoster.findFirst({
          where: {
            name,
            graduationClass: graduationClass || undefined,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await prisma.whitelistRoster.create({
          data: { name, graduationClass, tags },
        });
        imported++;
      } catch {
        errors.push(`第 ${i + 1} 行：解析失败`);
        skipped++;
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      failed: errors.length,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    console.error("Admin alumni import error:", error);
    return NextResponse.json(
      { error: "导入失败，请检查文件格式" },
      { status: 500 },
    );
  }
}
