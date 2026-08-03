import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import {
  CARD_TARGET_HEIGHT,
  CARD_TARGET_WIDTH,
  processToCard16x9,
} from "../src/lib/image-pipeline";
import {
  isSafeArticleSourceUrl,
  isSafeInternalHref,
  isSafeLocalImagePath,
} from "../src/lib/content-safety";
import {
  isNewsCategory,
  isNewsVisibility,
  isPreoptimizedNewsImage,
  NEWS_CATEGORIES,
} from "../src/lib/news";

test("news visibility values stay within the public/member contract", () => {
  assert.equal(isNewsVisibility("PUBLIC"), true);
  assert.equal(isNewsVisibility("MEMBER"), true);
  assert.equal(isNewsVisibility("PRIVATE"), false);
});

test("content image paths only allow normalized local assets", () => {
  assert.equal(isSafeLocalImagePath("/uploads/news-cover.webp"), true);
  assert.equal(isSafeLocalImagePath("/card.jpg"), true);
  assert.equal(isSafeLocalImagePath("https://example.com/image.jpg"), false);
  assert.equal(isSafeLocalImagePath("//example.com/image.jpg"), false);
  assert.equal(isSafeLocalImagePath("/uploads/../secret.jpg"), false);
  assert.equal(isSafeLocalImagePath("/uploads/image.svg"), false);
});

test("curated content links stay within explicit trust boundaries", () => {
  assert.equal(isSafeInternalHref("/news/wechat-freshman-life"), true);
  assert.equal(isSafeInternalHref("https://example.com"), false);
  assert.equal(isSafeInternalHref("//example.com/news"), false);
  assert.equal(isSafeInternalHref("/news/../admin"), false);
  assert.equal(isSafeArticleSourceUrl("https://mp.weixin.qq.com/s/example"), true);
  assert.equal(isSafeArticleSourceUrl("http://mp.weixin.qq.com/s/example"), false);
  assert.equal(isSafeArticleSourceUrl("https://example.com/s/example"), false);
});

test("curated news dataset is classified, bounded, and privacy-clean", async () => {
  const raw = await readFile(
    path.join(process.cwd(), "prisma/data/curated-wechat-articles.json"),
    "utf8",
  );
  const data = JSON.parse(raw) as {
    version: number;
    legacyNews: Array<{
      id: string;
      digestAlgorithm: string;
      expectedDigest: string;
      action: string;
      reason: string;
    }>;
    articles: Array<{
      id: string;
      title: string;
      summary: string;
      contentFile: string;
      category: string;
      imageUrl: string;
      sourceUrl: string;
      publishedAt: string;
    }>;
  };
  const privateContact = /微信号[:：]|QQ\s*\d{5,}|SPACE\s*\d{5,}|投稿邮箱|校友交流群|群二维码|1\d{10}|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/i;
  const staleInteraction = /二维码|扫码|转发福利|提前投稿|欢迎在评论区|一纸燕情|�/i;

  assert.equal(data.version, 2);
  assert.equal(data.articles.length, 19);
  assert.equal(data.legacyNews.length, 2);
  assert.equal(new Set(data.articles.map((article) => article.id)).size, 19);
  assert.equal(new Set(data.legacyNews.map((policy) => policy.id)).size, 2);
  assert.equal(new Set(NEWS_CATEGORIES.map((category) => category.value)).size, 6);
  for (const policy of data.legacyNews) {
    assert.equal(policy.action, "ARCHIVE");
    assert.equal(policy.digestAlgorithm, "sha256");
    assert.match(policy.expectedDigest, /^[a-f0-9]{64}$/);
    assert.equal(policy.reason.length > 10, true);
  }
  for (const article of data.articles) {
    assert.match(article.contentFile, /^curated-wechat\/[a-z0-9][a-z0-9-]*\.md$/);
    const content = await readFile(path.join(process.cwd(), "prisma/data", article.contentFile), "utf8");
    const headings = content.match(/^#{2,3}\s+.+$/gm) || [];
    assert.equal(isNewsCategory(article.category), true, article.id);
    assert.equal(isPreoptimizedNewsImage(article.imageUrl), true, article.id);
    assert.equal(isSafeArticleSourceUrl(article.sourceUrl), true, article.id);
    assert.equal(article.title.length <= 120, true, article.id);
    assert.equal(article.summary.length <= 500, true, article.id);
    assert.equal(content.length >= 200 && content.length <= 20_000, true, article.id);
    assert.equal(Number.isNaN(new Date(article.publishedAt).getTime()), false, article.id);
    assert.equal(privateContact.test(`${article.title}\n${article.summary}\n${content}`), false, article.id);
    assert.equal(staleInteraction.test(content), false, article.id);
    assert.equal(/^#\s/m.test(content), false, article.id);
    assert.equal(/^#{4,6}\s/m.test(content), false, article.id);
    assert.equal(headings.length <= 25, true, article.id);
    assert.equal(/\n{3,}/.test(content), false, article.id);
  }
});

test("uploaded images are validated and normalized to the shared card format", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "yanchuaner-content-"));
  const outputPath = path.join(tempDir, "card.jpg");

  try {
    const input = await sharp({
      create: {
        width: 640,
        height: 480,
        channels: 3,
        background: { r: 20, g: 100, b: 110 },
      },
    }).png().toBuffer();

    const result = await processToCard16x9(input, outputPath);
    const metadata = await sharp(await readFile(outputPath)).metadata();

    assert.equal(result.width, CARD_TARGET_WIDTH);
    assert.equal(result.height, CARD_TARGET_HEIGHT);
    assert.equal(metadata.format, "jpeg");
    assert.equal(metadata.width, CARD_TARGET_WIDTH);
    assert.equal(metadata.height, CARD_TARGET_HEIGHT);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("undersized image input is rejected before writing", async () => {
  const input = await sharp({
    create: {
      width: 319,
      height: 180,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  }).png().toBuffer();

  await assert.rejects(
    processToCard16x9(input, path.join(os.tmpdir(), "must-not-exist.jpg")),
    /INVALID_OR_TOO_SMALL/,
  );
});
