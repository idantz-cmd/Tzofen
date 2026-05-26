import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test("home page loads", async ({ page }) => {
  await page.goto(BASE);
  await page.screenshot({ path: "e2e/screenshots/01-home.png", fullPage: false });
  await expect(page).toHaveTitle(/GetWinIL/i);
});

test("feature cards navigate correctly", async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState("networkidle");

  // Click "בחר משחק" card → should go to /matches
  await page.getByText("בחר משחק").first().click();
  await page.waitForURL("**/matches");
  await page.screenshot({ path: "e2e/screenshots/02-matches.png" });
  expect(page.url()).toContain("/matches");
});

test("how-it-works: עלה בדירוג card → /leaderboard", async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState("networkidle");
  // Target the link specifically (not the hero tagline that also contains the text)
  await page.locator('a[href="/leaderboard"]').first().click();
  await page.waitForURL("**/leaderboard");
  await page.screenshot({ path: "e2e/screenshots/03-leaderboard.png" });
  expect(page.url()).toContain("/leaderboard");
});

test("features: ניתוח מקצועי → /chat", async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState("networkidle");
  await page.getByText("ניתוח מקצועי").first().click();
  await page.waitForURL("**/chat");
  await page.screenshot({ path: "e2e/screenshots/04-chat.png" });
  expect(page.url()).toContain("/chat");
});

test("features: תחרויות ישירות → /competitions", async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState("networkidle");
  await page.getByText("תחרויות ישירות").first().click();
  await page.waitForURL("**/competitions");
  await page.screenshot({ path: "e2e/screenshots/05-competitions.png" });
  expect(page.url()).toContain("/competitions");
});

test("top nav: משחקים button → /matches", async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState("networkidle");
  // Desktop nav
  await page.locator("nav").getByText("משחקים").first().click();
  await page.waitForURL("**/matches");
  await page.screenshot({ path: "e2e/screenshots/06-nav-matches.png" });
  expect(page.url()).toContain("/matches");
});

test("top nav: דירוג button → /leaderboard", async ({ page }) => {
  await page.goto(BASE);
  await page.locator("nav").getByText("דירוג").first().click();
  await page.waitForURL("**/leaderboard");
  await page.screenshot({ path: "e2e/screenshots/07-nav-leaderboard.png" });
  expect(page.url()).toContain("/leaderboard");
});

test("standings page loads", async ({ page }) => {
  await page.goto(`${BASE}/standings`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "e2e/screenshots/08-standings.png" });
  expect(page.url()).toContain("/standings");
});
