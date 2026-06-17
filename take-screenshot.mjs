import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
await page.setViewportSize({ width: 390, height: 844 });

// Login first
await page.goto('http://localhost:3000/');
await page.waitForLoadState('networkidle');
await page.evaluate(async () => {
  await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'idan1164@gmail.com', password: 'Admin1234' }),
    credentials: 'include',
  });
});

// Navigate to competitions
await page.goto('http://localhost:3000/competitions');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1500);

await page.screenshot({ path: 'comp-1-tournament.png' });
console.log('1. Tournament tab saved');

// Scroll down
await page.evaluate(() => window.scrollBy(0, 600));
await page.waitForTimeout(400);
await page.screenshot({ path: 'comp-2-leaderboard.png' });
console.log('2. Leaderboard saved');

// Switch to duels tab
await page.locator('button').filter({ hasText: 'דו-קרבות' }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: 'comp-3-duels.png' });
console.log('3. Duels tab saved');

// Open first duel
await page.locator('button').filter({ hasText: 'מכבי חיפה' }).first().click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'comp-4-duel-open.png' });
console.log('4. Duel open saved');

await browser.close();
