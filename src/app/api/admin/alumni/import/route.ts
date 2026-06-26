import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeTags } from "@/lib/tags";
import { upsertRosterEntry } from "@/lib/roster";

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
): {
  nameIdx: number;
  graduationClassIdx: number;
  classNameIdx: number;
  emailIdx: number;
  tagsIdx: number;
  cityIdx: number;
  universityIdx: number;
  majorIdx: number;
  industryIdx: number;
} {
  const headerMap: Record<string, string> = {
    姓名: "name",
    name: "name",
    届别: "graduationClass",
    graduationclass: "graduationClass",
    班级: "className",
    classname: "className",
    邮箱: "email",
    email: "email",
    标签: "tags",
    tags: "tags",
    城市: "city",
    所在城市: "city",
    city: "city",
    院校: "university",
    毕业院校: "university",
    就读院校: "university",
    大学: "university",
    university: "university",
    专业: "major",
    就读专业: "major",
    major: "major",
    行业: "industry",
    从事行业: "industry",
    industry: "industry",
  };

  let nameIdx = -1;
  let graduationClassIdx = -1;
  let classNameIdx = -1;
  let emailIdx = -1;
  let tagsIdx = -1;
  let cityIdx = -1;
  let universityIdx = -1;
  let majorIdx = -1;
  let industryIdx = -1;

  fields.forEach((f, i) => {
    const key = f.toLowerCase().replace(/[\s_-]/g, "");
    const mapped = headerMap[key];
    if (mapped === "name") nameIdx = i;
    else if (mapped === "graduationClass") graduationClassIdx = i;
    else if (mapped === "className") classNameIdx = i;
    else if (mapped === "email") emailIdx = i;
    else if (mapped === "tags") tagsIdx = i;
    else if (mapped === "city") cityIdx = i;
    else if (mapped === "university") universityIdx = i;
    else if (mapped === "major") majorIdx = i;
    else if (mapped === "industry") industryIdx = i;
  });

  return {
    nameIdx,
    graduationClassIdx,
    classNameIdx,
    emailIdx,
    tagsIdx,
    cityIdx,
    universityIdx,
    majorIdx,
    industryIdx,
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "请上传 CSV 文件" }, { status: 400 });
    }

    // 防御大体积文件攻击 (DoS)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "文件过大，请保持在 2MB 以内" }, { status: 400 });
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
    const {
      nameIdx,
      graduationClassIdx,
      classNameIdx,
      emailIdx,
      tagsIdx,
      cityIdx,
      universityIdx,
      majorIdx,
      industryIdx,
    } = detectHeaders(headers);

    if (nameIdx === -1) {
      return NextResponse.json(
        { error: "CSV 缺少必需的列：姓名 (name)" },
        { status: 400 },
      );
    }

    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    await prisma.$transaction(async (tx) => {
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
            graduationClassIdx >= 0
              ? (fields[graduationClassIdx] || "").trim() || null
              : null;
          const className =
            classNameIdx >= 0 ? (fields[classNameIdx] || "").trim() || null : null;
          const email =
            emailIdx >= 0
              ? (fields[emailIdx] || "").trim().toLowerCase() || null
              : null;
          const rawTags =
            tagsIdx >= 0 ? (fields[tagsIdx] || "").trim() || null : null;
          const tags = rawTags ? normalizeTags(rawTags) : null;

          let city = cityIdx >= 0 ? (fields[cityIdx] || "").trim() || null : null;
          if (city) {
            if (city.endsWith("市") && city.length > 1) {
              city = city.slice(0, -1).trim();
            }
            if (!city) city = null;
          }
          const university =
            universityIdx >= 0 ? (fields[universityIdx] || "").trim() || null : null;
          const major =
            majorIdx >= 0 ? (fields[majorIdx] || "").trim() || null : null;
          const industry =
            industryIdx >= 0 ? (fields[industryIdx] || "").trim() || null : null;

          if (name.length > 50) {
            errors.push(`第 ${i + 1} 行：姓名过长`);
            skipped++;
            continue;
          }
          if (
            (graduationClass && graduationClass.length > 50) ||
            (className && className.length > 64) ||
            (email && (email.length > 254 || !email.includes("@")))
          ) {
            errors.push(`第 ${i + 1} 行：届别、班级或邮箱格式无效`);
            skipped++;
            continue;
          }

          const { created } = await upsertRosterEntry(tx, {
            name,
            graduationClass,
            className,
            email,
            tags,
            city,
            university,
            major,
            industry,
          });
          if (!created) {
            skipped++;
            continue;
          }
          imported++;
        } catch {
          errors.push(`第 ${i + 1} 行：解析失败`);
          skipped++;
        }
      }
    });

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
