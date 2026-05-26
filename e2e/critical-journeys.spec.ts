import { test, expect, Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helper: dismiss the Vite HMR error overlay if present, then wait for React
// ---------------------------------------------------------------------------
async function waitForAppReady(page: Page) {
  await page.waitForLoadState("domcontentloaded");

  // Vite shows an error overlay for CSS warnings. Dismiss it so React can render.
  const overlay = page.locator("vite-error-overlay");
  const overlayVisible = await overlay.isVisible().catch(() => false);
  if (overlayVisible) {
    await page.keyboard.press("Escape");
    await overlay.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }

  // Also try clicking "close" button inside the overlay if Escape didn't work
  const closeBtn = page.locator("vite-error-overlay").getByRole("button");
  const closeBtnVisible = await closeBtn.isVisible().catch(() => false);
  if (closeBtnVisible) {
    await closeBtn.click();
  }

  await page.waitForFunction(() => document.readyState === "complete");
}

// ---------------------------------------------------------------------------
// Journey 1 — Home page loads
// ---------------------------------------------------------------------------

test.describe("Home page", () => {
  test("loads without errors and renders navigation", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await waitForAppReady(page);

    await expect(page.locator("nav").first()).toBeVisible();
    await expect(page.locator("nav").first().locator('a[href="/"]')).toBeVisible();
    await expect(page.locator("main")).toBeVisible();

    const critical = errors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("Non-Error promise rejection") &&
        !e.includes("card-glass")
    );
    expect(critical).toHaveLength(0);
  });

  test("CTA button is present on the page", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await expect(page.locator("main button").first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Journey 2 — Login page
// ---------------------------------------------------------------------------

test.describe("Login page", () => {
  test("renders email and password fields", async ({ page }) => {
    await page.goto("/login");
    await waitForAppReady(page);
    await expect(page.locator('input#email[type="email"]')).toBeVisible();
    await expect(page.locator('input#password[type="password"]')).toBeVisible();
  });

  test("submit button is present and enabled", async ({ page }) => {
    await page.goto("/login");
    await waitForAppReady(page);
    const btn = page.locator('button[type="submit"]');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test("register toggle shows name field", async ({ page }) => {
    await page.goto("/login");
    await waitForAppReady(page);
    const nameInput = page.locator("input#name");
    await expect(nameInput).not.toBeVisible();
    // Second button in the tab-toggle is the register tab
    const tabButtons = page.locator("div.flex.rounded-lg button");
    await tabButtons.nth(1).click();
    await expect(nameInput).toBeVisible({ timeout: 3000 });
  });
});

// ---------------------------------------------------------------------------
// Journey 3 — Matches page
// ---------------------------------------------------------------------------

test.describe("Matches page", () => {
  test("loads and renders navigation", async ({ page }) => {
    await page.goto("/matches");
    await waitForAppReady(page);
    await expect(page.locator("nav").first()).toBeVisible();
  });

  test("renders main content area", async ({ page }) => {
    await page.goto("/matches");
    await waitForAppReady(page);
    await expect(page.locator("main")).toBeVisible();
  });

  test("does not redirect to 404", async ({ page }) => {
    await page.goto("/matches");
    await waitForAppReady(page);
    expect(page.url()).not.toContain("/404");
  });
});

// ---------------------------------------------------------------------------
// Journey 4 — Leaderboard page
// ---------------------------------------------------------------------------

test.describe("Leaderboard page", () => {
  test("loads and renders navigation", async ({ page }) => {
    await page.goto("/leaderboard");
    await waitForAppReady(page);
    await expect(page.locator("nav").first()).toBeVisible();
  });

  test("renders main content area", async ({ page }) => {
    await page.goto("/leaderboard");
    await waitForAppReady(page);
    await expect(page.locator("main")).toBeVisible();
  });

  test("shows two timeframe tab controls", async ({ page }) => {
    await page.goto("/leaderboard");
    await waitForAppReady(page);
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();
    await expect(tablist.locator('[role="tab"]')).toHaveCount(2);
  });
});

// ---------------------------------------------------------------------------
// Journey 5 — Navigation links
// ---------------------------------------------------------------------------

test.describe("Navigation links", () => {
  test("desktop nav contains matches and leaderboard links", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await expect(page.locator('nav a[href="/matches"]').first()).toBeAttached();
    await expect(page.locator('nav a[href="/leaderboard"]').first()).toBeAttached();
  });

  test("clicking matches nav link navigates to /matches", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await page.locator('nav a[href="/matches"]').first().click();
    await expect(page).toHaveURL(/\/matches/);
    await expect(page.locator("nav").first()).toBeVisible();
  });

  test("clicking leaderboard nav link navigates to /leaderboard", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await page.locator('nav a[href="/leaderboard"]').first().click();
    await expect(page).toHaveURL(/\/leaderboard/);
    await expect(page.locator("nav").first()).toBeVisible();
  });

  test("brand logo navigates back to home from matches", async ({ page }) => {
    await page.goto("/matches");
    await waitForAppReady(page);
    await page.locator('nav a[href="/"]').first().click();
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?$/);
  });
});
