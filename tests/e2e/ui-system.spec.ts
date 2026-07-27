import { expect, test, type Page, type TestInfo } from "@playwright/test";

const INTRO_VERSION = "yanzhong-system-v3";
const ACCEPTANCE_PASSWORD = "AcceptancePass!2026";

async function setPreferences(
  page: Page,
  options: { theme: "dark" | "light"; locale: "zh" | "en"; introSeen?: boolean },
) {
  await page.addInitScript(({ theme, locale, introSeen, introVersion }) => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("locale", locale);
    if (introSeen) {
      localStorage.setItem("yz-intro-version", introVersion);
      sessionStorage.setItem("yz-intro-seen", introVersion);
    } else {
      localStorage.removeItem("yz-intro-version");
      sessionStorage.removeItem("yz-intro-seen");
    }
  }, { ...options, introVersion: INTRO_VERSION });
}

function watchRuntimeIssues(page: Page) {
  const issues: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !/status of 401 \(Unauthorized\)/.test(message.text())
    ) {
      issues.push(`console: ${message.text()}`);
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 500) {
      issues.push(`network: ${response.status()} ${response.url()}`);
    }
  });
  page.on("pageerror", (error) => issues.push(`page: ${error.message}`));
  return issues;
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
  }));
  expect(overflow.page, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.viewport + 1);
}

async function screenshot(page: Page, testInfo: TestInfo, name: string, fullPage = false) {
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage });
}

test("dark Chinese entrance pauses, resumes, and hands off to the measured home target", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop hover and handoff geometry test");
  const issues = watchRuntimeIssues(page);
  await setPreferences(page, { theme: "dark", locale: "zh", introSeen: false });
  await page.goto("/");

  const dialog = page.getByRole("dialog", { name: /燕中校友数字母港/ });
  await expect(dialog).toBeVisible();
  await expect(page.locator(".celestial-entrance__copy")).toHaveCSS("opacity", "1", { timeout: 3_000 });
  await expect(page.locator(".celestial-entrance__system-orbit")).toHaveCount(3);
  await screenshot(page, testInfo, "entrance-dark-zh");

  const firstOrbit = page.locator(".celestial-entrance__system-orbit").first();
  const firstSatellite = firstOrbit.locator(".celestial-entrance__satellite");
  await firstSatellite.hover({ force: true });
  await expect(firstOrbit).toHaveAttribute("data-paused", "true");
  await expect(firstSatellite.locator("[role=tooltip]")).toHaveCSS("opacity", "1");
  expect(await firstSatellite.evaluate((element) => getComputedStyle(element).animationPlayState)).toBe("paused");

  await page.mouse.move(2, 2);
  await expect(firstOrbit).not.toHaveAttribute("data-paused", "true");
  expect(await firstSatellite.evaluate((element) => getComputedStyle(element).animationPlayState)).toBe("running");

  const target = page.locator("[data-home-sphere-target]");
  const targetBox = await target.boundingBox();
  expect(targetBox).not.toBeNull();
  await page.getByRole("button", { name: /落印归航/ }).click();
  await page.waitForTimeout(1_500);
  await expect(page.locator("#home-hero-title")).toBeHidden();
  const movingBox = await page.locator(".celestial-entrance__visual").boundingBox();
  expect(movingBox).not.toBeNull();
  if (movingBox && targetBox) {
    const distance = Math.hypot(
      movingBox.x + movingBox.width / 2 - (targetBox.x + targetBox.width / 2),
      movingBox.y + movingBox.height / 2 - (targetBox.y + targetBox.height / 2),
    );
    expect(distance).toBeLessThan(64);
  }

  await expect(dialog).toBeHidden({ timeout: 3_000 });
  await expect(page.locator("#home-hero-title")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, testInfo, "home-after-handoff-dark-zh");
  expect(issues).toEqual([]);
});

test("mobile star tap holds its orbit and reveals a stable character-by-character note", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile touch interaction test");
  const issues = watchRuntimeIssues(page);
  await setPreferences(page, { theme: "dark", locale: "zh", introSeen: false });
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.waitForTimeout(1_300);

  const firstOrbit = page.locator(".celestial-entrance__system-orbit").first();
  const satellite = firstOrbit.locator(".celestial-entrance__satellite");
  await page.locator(".celestial-entrance__mobile-orbit-controls button").first().tap();
  await expect(firstOrbit).toHaveAttribute("data-paused", "true");
  await expect(page.locator(".celestial-entrance__mobile-orbit-note")).toHaveAttribute("data-visible", "true");
  await expect(page.locator(".celestial-entrance__mobile-orbit-note strong")).not.toBeEmpty();

  const before = await satellite.boundingBox();
  await page.waitForTimeout(450);
  const after = await satellite.boundingBox();
  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  if (before && after) {
    expect(Math.hypot(before.x - after.x, before.y - after.y)).toBeLessThan(1);
  }
  await expectNoHorizontalOverflow(page);
  await screenshot(page, testInfo, "entrance-mobile-star-note");
  expect(issues).toEqual([]);
});

test("light English authentication pages reflow without crowding", async ({ page }, testInfo) => {
  const issues = watchRuntimeIssues(page);
  await setPreferences(page, { theme: "light", locale: "en", introSeen: true });
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/register");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.addStyleTag({
    content: "body { line-height: 1.5 !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }",
  });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, testInfo, "register-light-en", true);
  expect(issues).toEqual([]);
});

test("OAuth login handoff uses a document navigation", async ({ page }) => {
  await setPreferences(page, { theme: "dark", locale: "zh", introSeen: true });
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, role: "admin" }),
    });
  });
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "oauth-admin",
          username: "oauth-admin",
          name: "OAuth Admin",
          email: "oauth-admin@example.invalid",
          emailVerified: new Date(0).toISOString(),
          graduationClass: null,
          className: null,
          status: "VERIFIED",
          role: "ADMIN",
        },
      }),
    });
  });

  let usedDocumentNavigation = false;
  await page.route("**/api/oauth/authorize?**", async (route) => {
    usedDocumentNavigation ||= route.request().isNavigationRequest();
    await route.abort();
  });

  const authorizationPath =
    "/api/oauth/authorize?client_id=test-client&redirect_uri=https%3A%2F%2Fexample.invalid%2Fcallback&response_type=code&state=test-state";
  await page.goto(`/login?redirect=${encodeURIComponent(authorizationPath)}`);
  await page.getByLabel(/用户名|Username/i).fill("oauth-admin");
  await page.getByLabel(/密码|Password/i).fill("unused-password");
  await page.getByRole("button", { name: /登录|Sign in/i }).click();

  await expect.poll(() => usedDocumentNavigation).toBe(true);
});

test("English content shells stay localized and fit mobile layouts", async ({ page }, testInfo) => {
  const issues = watchRuntimeIssues(page);
  await setPreferences(page, { theme: "light", locale: "en", introSeen: true });
  await page.goto("/login");
  await page.getByLabel(/Username/i).fill("acceptance-alumni");
  await page.getByLabel(/Password/i).fill(ACCEPTANCE_PASSWORD);
  await page.getByRole("button", { name: /Sign in/i }).click();
  await page.waitForURL(/\/$/, { timeout: 10_000 });

  const shells = [
    ["/students", "Student Resource Hub"],
    ["/alumni/achievements", "Alumni Achievements"],
    ["/alumni/memories", "Yan-Zhong Memories"],
  ] as const;
  for (const [pathname, heading] of shells) {
    await page.goto(pathname);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    await expectNoHorizontalOverflow(page);
    await screenshot(page, testInfo, `content-${pathname.slice(1).replaceAll("/", "-")}-light-en`, true);
  }
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(issues).toEqual([]);
});

test("admin story navigation has one selected item in both themes and locales", async ({ page }, testInfo) => {
  const issues = watchRuntimeIssues(page);
  await setPreferences(page, { theme: "dark", locale: "zh", introSeen: true });
  await page.goto("/login");
  await page.getByLabel(/用户名|Username/i).fill("acceptance-admin");
  await page.getByLabel(/密码|Password/i).fill(ACCEPTANCE_PASSWORD);
  await page.getByRole("button", { name: /登录|Sign in/i }).click();
  await page.waitForURL(/\/admin(?:\/)?$/, { timeout: 10_000 });

  await page.goto("/admin/stories/pending");
  const selected = page.locator("aside nav [aria-current=page]");
  await expect(selected).toHaveCount(1);
  await expect(selected).toHaveAttribute("href", "/admin/stories/pending");
  await expectNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "Switch to English" }).click();
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(selected).toHaveCount(1);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, testInfo, "admin-story-review-light-en", true);
  expect(issues).toEqual([]);
});
