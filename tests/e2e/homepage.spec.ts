import { expect, test } from "@playwright/test";

test("homepage renders on desktop and mobile", async ({ page }, testInfo) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBeTruthy();
  await expect(page.locator("body")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("homepage.png"),
    fullPage: true,
  });
});
