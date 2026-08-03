require("dotenv/config");

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const NEWS_CATEGORIES = new Set([
  "STUDENT_GUIDE",
  "CAMPUS_MEMORY",
  "ALUMNI_STORY",
  "TEACHER_VOICE",
  "ALUMNI_UPDATE",
  "SEASONAL",
]);
const dataPath = path.resolve(process.cwd(), "prisma/data/curated-wechat-articles.json");
const dataDirectory = path.dirname(dataPath);
const rawData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const data = {
  ...rawData,
  articles: rawData.articles.map((article) => {
    const contentPath = path.resolve(dataDirectory, article.contentFile || "");
    if (!isInsideDirectory(dataDirectory, contentPath) || !fs.existsSync(contentPath)) {
      throw new Error(`Missing or unsafe Markdown source: ${article.id}`);
    }
    return { ...article, content: fs.readFileSync(contentPath, "utf8").trim() };
  }),
};
const databaseUrl = process.env.DATABASE_URL || "";
const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "public/uploads"));
const assetDir = process.env.CURATED_CONTENT_ASSET_DIR
  ? path.resolve(process.env.CURATED_CONTENT_ASSET_DIR)
  : null;

function databasePathFromUrl() {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("Curated content import only supports a SQLite file DATABASE_URL");
  }
  return path.resolve(process.cwd(), databaseUrl.slice("file:".length));
}

function isInsideDirectory(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

function isSafeLocalImagePath(value) {
  return typeof value === "string"
    && /^\/uploads\/[a-z0-9][a-z0-9._-]*\.(?:avif|jpe?g|png|webp)$/i.test(value)
    && !value.includes("..");
}

function isSafeArticleSourceUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.hostname === "mp.weixin.qq.com"
      && url.pathname.startsWith("/s/")
      && !url.username
      && !url.password;
  } catch {
    return false;
  }
}

function assertProductionBackup() {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.CURATED_CONTENT_ALLOW_PRODUCTION !== "true") {
    throw new Error("Production import requires CURATED_CONTENT_ALLOW_PRODUCTION=true");
  }
  const backupValue = process.env.CURATED_CONTENT_BACKUP_PATH;
  if (!backupValue) throw new Error("Production import requires CURATED_CONTENT_BACKUP_PATH");
  const backupPath = path.resolve(backupValue);
  if (backupPath === databasePathFromUrl()) throw new Error("Backup path must differ from the production database");
  if (!fs.existsSync(backupPath) || !fs.statSync(backupPath).isFile()) {
    throw new Error("Production database backup does not exist");
  }
  const backup = new Database(backupPath, { readonly: true });
  try {
    const check = backup.pragma("quick_check", { simple: true });
    if (check !== "ok") throw new Error(`Production backup quick_check failed: ${String(check)}`);
  } finally {
    backup.close();
  }
}

function assertDataset() {
  if (data.version !== 2 || !Array.isArray(data.articles) || data.articles.length !== 19) {
    throw new Error("Unexpected curated dataset version or article count");
  }
  if (!Array.isArray(data.legacyNews) || data.legacyNews.length !== 2) {
    throw new Error("Unexpected legacy news policy count");
  }
  const ids = new Set();
  const privateContact = /微信号[:：]|QQ\s*\d{5,}|SPACE\s*\d{5,}|投稿邮箱|校友交流群|群二维码|1\d{10}|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/i;
  for (const article of data.articles) {
    if (ids.has(article.id)) throw new Error(`Duplicate article id: ${article.id}`);
    ids.add(article.id);
    if (!article.id.startsWith("wechat-") || !article.title || !article.content) {
      throw new Error(`Invalid article: ${article.id}`);
    }
    if (!/^curated-wechat\/[a-z0-9][a-z0-9-]*\.md$/.test(article.contentFile)) {
      throw new Error(`Invalid Markdown source path: ${article.id}`);
    }
    if (article.title.length > 120 || article.summary.length > 500 || article.content.length > 20_000) {
      throw new Error(`Article exceeds limits: ${article.id}`);
    }
    if (!NEWS_CATEGORIES.has(article.category)) throw new Error(`Invalid category: ${article.id}`);
    if (article.contentFormat !== "MARKDOWN") throw new Error(`Invalid content format: ${article.id}`);
    if (!isSafeLocalImagePath(article.imageUrl) || !isSafeArticleSourceUrl(article.sourceUrl)) {
      throw new Error(`Unsafe asset or source URL: ${article.id}`);
    }
    if (privateContact.test(`${article.title}\n${article.summary}\n${article.content}`)) {
      throw new Error(`Private contact pattern found: ${article.id}`);
    }
    if (Number.isNaN(new Date(article.publishedAt).getTime())) {
      throw new Error(`Invalid publish date: ${article.id}`);
    }
  }
  const legacyIds = new Set();
  for (const policy of data.legacyNews) {
    if (legacyIds.has(policy.id)) throw new Error(`Duplicate legacy policy: ${policy.id}`);
    legacyIds.add(policy.id);
    if (policy.action !== "ARCHIVE" || policy.digestAlgorithm !== "sha256"
      || !/^[a-f0-9]{64}$/.test(policy.expectedDigest) || !policy.reason) {
      throw new Error(`Invalid legacy policy: ${policy.id}`);
    }
  }
}

function prepareAssets() {
  fs.mkdirSync(uploadDir, { recursive: true });
  for (const article of data.articles) {
    const filename = path.basename(article.imageUrl);
    const destination = path.join(uploadDir, filename);
    if (!isInsideDirectory(uploadDir, destination)) throw new Error(`Unsafe destination: ${article.id}`);
    if (!fs.existsSync(destination)) {
      if (!assetDir) throw new Error(`Missing ${filename}; set CURATED_CONTENT_ASSET_DIR`);
      const source = path.join(assetDir, filename);
      if (!isInsideDirectory(assetDir, source) || !fs.existsSync(source) || !fs.statSync(source).isFile()) {
        throw new Error(`Missing source asset: ${filename}`);
      }
      fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
    }
    if (!fs.statSync(destination).isFile() || fs.statSync(destination).size < 1024) {
      throw new Error(`Invalid cover asset: ${filename}`);
    }
  }
}

function assertMigratedSchema(db) {
  const newsColumns = new Set(db.prepare('PRAGMA table_info("News")').all().map((column) => column.name));
  const memoryColumns = new Set(db.prepare('PRAGMA table_info("MemoryItem")').all().map((column) => column.name));
  for (const column of ["category", "sourceName", "sourceUrl", "contentFormat", "visibility"]) {
    if (!newsColumns.has(column)) throw new Error(`Database migration is missing News.${column}`);
  }
  if (!memoryColumns.has("href")) throw new Error("Database migration is missing MemoryItem.href");
}

function importContent() {
  const db = new Database(databasePathFromUrl());
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 10000");
  try {
    assertMigratedSchema(db);
    const adminUsername = process.env.CURATED_IMPORT_ADMIN_USERNAME || "yanchuaner";
    const admin = db.prepare(
      'SELECT "id" FROM "User" WHERE "username" = ? AND "role" = ? AND "accountStatus" = ? LIMIT 1',
    ).get(adminUsername, "ADMIN", "ACTIVE");
    if (!admin) throw new Error(`Active administrator not found: ${adminUsername}`);

    const findNews = db.prepare('SELECT "id" FROM "News" WHERE "id" = ?');
    const findLegacyNews = db.prepare('SELECT "id", "title", "content", "status" FROM "News" WHERE "id" = ?');
    const findContentSection = db.prepare('SELECT "id" FROM "ContentSection" WHERE "id" = ?');
    const findMemory = db.prepare('SELECT "id" FROM "MemoryItem" WHERE "id" = ?');
    const insertNews = db.prepare(`
      INSERT INTO "News" (
      "id", "title", "summary", "content", "imageUrl", "category", "sourceName", "sourceUrl",
        "contentFormat", "status", "visibility", "publishedAt", "createdAt", "updatedAt"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertAudit = db.prepare(`
      INSERT INTO "AuditLog" ("id", "action", "targetType", "targetId", "adminId", "after", "createdAt")
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertLegacyAudit = db.prepare(`
      INSERT INTO "AuditLog" (
        "id", "action", "targetType", "targetId", "adminId", "before", "after", "createdAt"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const archiveLegacyNews = db.prepare('UPDATE "News" SET "status" = ?, "updatedAt" = ? WHERE "id" = ?');
    const insertContentSection = db.prepare(`
      INSERT INTO "ContentSection" (
        "id", "page", "title", "description", "icon", "href", "actionLabel", "sortOrder", "createdAt", "updatedAt"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMemory = db.prepare(`
      INSERT INTO "MemoryItem" (
        "id", "title", "subtitle", "description", "imagePath", "imageAlt", "icon", "href", "sortOrder",
        "createdAt", "updatedAt"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const runImport = db.transaction(() => {
      const counts = {
        newsCreated: 0,
        newsPreserved: 0,
        legacyArchived: 0,
        legacyPreserved: 0,
        studentCreated: 0,
        teacherCreated: 0,
        memoryCreated: 0,
      };
      for (const policy of data.legacyNews) {
        const existing = findLegacyNews.get(policy.id);
        const digest = existing
          ? crypto.createHash("sha256").update(`${existing.title}\n${existing.content}`).digest("hex")
          : null;
        if (!existing || existing.status !== "PUBLISHED" || digest !== policy.expectedDigest) {
          counts.legacyPreserved += 1;
          continue;
        }
        const now = new Date().toISOString();
        archiveLegacyNews.run("DRAFT", now, policy.id);
        insertLegacyAudit.run(
          crypto.randomUUID(),
          "curated-legacy-archive",
          "News",
          policy.id,
          admin.id,
          JSON.stringify({ title: existing.title, status: existing.status, contentDigest: digest }),
          JSON.stringify({ status: "DRAFT", reason: policy.reason }),
          now,
        );
        counts.legacyArchived += 1;
      }
      for (const article of data.articles) {
        const now = new Date().toISOString();
        if (findNews.get(article.id)) {
          counts.newsPreserved += 1;
        } else {
          insertNews.run(
            article.id,
            article.title,
            article.summary,
            article.content,
            article.imageUrl,
            article.category,
            article.sourceName,
            article.sourceUrl,
            article.contentFormat,
            "PUBLISHED",
            article.visibility || "PUBLIC",
            new Date(article.publishedAt).toISOString(),
            now,
            now,
          );
          insertAudit.run(
            crypto.randomUUID(),
            "curated-news-import",
            "News",
            article.id,
            admin.id,
            JSON.stringify({ title: article.title, category: article.category, sourceUrl: article.sourceUrl }),
            now,
          );
          counts.newsCreated += 1;
        }

        const href = `/news/${article.id}`;
        if (article.placements.student) {
          const [title, description, icon, sortOrder] = article.placements.student;
          const id = `curated-student-${article.slug}`;
          if (!findContentSection.get(id)) {
            insertContentSection.run(id, "students", title, description, icon, href, "阅读全文", sortOrder, now, now);
            counts.studentCreated += 1;
          }
        }
        if (article.placements.teacher) {
          const [title, description, icon, sortOrder] = article.placements.teacher;
          const id = `curated-teacher-${article.slug}`;
          if (!findContentSection.get(id)) {
            insertContentSection.run(id, "teachers", title, description, icon, href, "阅读全文", sortOrder, now, now);
            counts.teacherCreated += 1;
          }
        }
        if (article.placements.memory) {
          const [title, subtitle, description, icon, sortOrder] = article.placements.memory;
          const id = `curated-memory-${article.slug}`;
          if (!findMemory.get(id)) {
            insertMemory.run(
              id,
              title,
              subtitle,
              description,
              article.imageUrl,
              article.title,
              icon,
              href,
              sortOrder,
              now,
              now,
            );
            counts.memoryCreated += 1;
          }
        }
      }
      return counts;
    });

    const result = runImport.immediate();
    const quickCheck = db.pragma("quick_check", { simple: true });
    if (quickCheck !== "ok") throw new Error(`Imported database quick_check failed: ${String(quickCheck)}`);
    return result;
  } finally {
    db.close();
  }
}

try {
  assertDataset();
  assertProductionBackup();
  prepareAssets();
  const result = importContent();
  console.log(JSON.stringify({ datasetVersion: data.version, articles: data.articles.length, ...result }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
