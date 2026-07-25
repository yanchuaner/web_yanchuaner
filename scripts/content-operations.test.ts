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
import { isSafeLocalImagePath } from "../src/lib/content-safety";

test("content image paths only allow normalized local assets", () => {
  assert.equal(isSafeLocalImagePath("/uploads/news-cover.webp"), true);
  assert.equal(isSafeLocalImagePath("/card.jpg"), true);
  assert.equal(isSafeLocalImagePath("https://example.com/image.jpg"), false);
  assert.equal(isSafeLocalImagePath("//example.com/image.jpg"), false);
  assert.equal(isSafeLocalImagePath("/uploads/../secret.jpg"), false);
  assert.equal(isSafeLocalImagePath("/uploads/image.svg"), false);
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
