import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

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

function parseCSV(content: string) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const data: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length === 0 || !fields[0]) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = fields[idx] !== undefined ? fields[idx].trim() : "";
    });
    data.push(row);
  }
  return data;
}

async function main() {
  console.log("🌱 开始执行自动化数据播种 (Database Seeding)...");

  // 1. 播种 WhitelistRoster
  const whitelistPath = path.join(process.cwd(), "prisma", "data", "whitelist.csv");
  if (fs.existsSync(whitelistPath)) {
    console.log("👉 正在解析校友名册白名单 (whitelist.csv)...");
    const content = fs.readFileSync(whitelistPath, "utf-8");
    const rows = parseCSV(content);
    console.log(`💬 共读取到 ${rows.length} 条白名单记录`);

    let createdCount = 0;
    let updatedCount = 0;

    for (const row of rows) {
      const name = (row.name || "").trim();
      if (!name) continue;

      const graduationClass = (row.graduationClass || "").trim() || null;
      const className = (row.className || "").trim() || null;
      const email = (row.email || "").trim().toLowerCase() || null;
      const contact = (row.contact || "").trim() || null;
      const tags = (row.tags || "").trim() || null;

      let city = (row.city || "").trim() || null;
      if (city) {
        if (city.endsWith("市") && city.length > 1) {
          city = city.slice(0, -1).trim();
        }
        if (!city) city = null;
      }
      const university = (row.university || "").trim() || null;
      const major = (row.major || "").trim() || null;
      const industry = (row.industry || "").trim() || null;
      const certificateNo = (row.certificateNo || "").trim() || null;

      const identity = {
        name,
        graduationClass,
        className,
        email,
      };

      const existing = await prisma.whitelistRoster.findFirst({
        where: identity,
      });

      if (existing) {
        await prisma.whitelistRoster.update({
          where: { id: existing.id },
          data: {
            contact,
            city,
            university,
            major,
            industry,
            certificateNo,
          },
        });
        updatedCount++;
      } else {
        await prisma.whitelistRoster.create({
          data: {
            ...identity,
            contact,
            city,
            university,
            major,
            industry,
            certificateNo,
          },
        });
        createdCount++;
      }
    }
    console.log(`  ✓ 白名单播种完毕：新增 ${createdCount} 条，更新 ${updatedCount} 条`);
  } else {
    console.log("⚠️ 未找到 whitelist.csv，已跳过白名单播种");
  }

  // 2. 播种 Story
  const storiesPath = path.join(process.cwd(), "prisma", "data", "stories.json");
  if (fs.existsSync(storiesPath)) {
    console.log("👉 正在解析初始燕中故事 (stories.json)...");
    const content = fs.readFileSync(storiesPath, "utf-8");
    const items = JSON.parse(content) as Array<{
      title: string;
      author: string;
      tags?: string;
      body?: string;
      date?: string;
    }>;
    console.log(`💬 共读取到 ${items.length} 个故事记录`);

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      const title = (item.title || "").trim();
      const author = (item.author || "").trim();
      if (!title || !author) continue;

      const tags = (item.tags || "").trim();
      const body = (item.body || "").trim();
      const date = (item.date || "").trim();

      const existing = await prisma.story.findFirst({
        where: {
          title,
          author,
        },
      });

      if (existing) {
        await prisma.story.update({
          where: { id: existing.id },
          data: {
            tags,
            body,
            date,
          },
        });
        updatedCount++;
      } else {
        await prisma.story.create({
          data: {
            title,
            author,
            tags,
            body,
            date,
          },
        });
        createdCount++;
      }
    }
    console.log(`  ✓ 燕中故事播种完毕：新增 ${createdCount} 条，更新 ${updatedCount} 条`);
  } else {
    console.log("⚠️ 未找到 stories.json，已跳过故事播种");
  }

  console.log("🎉 自动化数据播种全部执行完毕！");
}

main()
  .catch((e) => {
    console.error("❌ 播种失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
