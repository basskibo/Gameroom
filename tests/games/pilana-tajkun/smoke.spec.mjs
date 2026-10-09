import { test, expect, URL } from './fixtures.mjs';

test.describe('Pilana Tajkun · smoke', () => {
  test('loads over http, shows the start screen, no errors', async ({ game, page }) => {
    await game.open();
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.locator('#startScreen')).toBeVisible();
    await expect(page.locator('#startBtn')).toBeVisible();
    await expect(page.locator('#gameroom-back')).toHaveAttribute('href', '../../');
    game.expectNoErrors();
  });

  test('PT-BUG-001: does not block on the 25 MB models-bundle.js over http', async ({ page, game }) => {
    const hits = [];
    page.on('request', r => { if (r.url().includes('models-bundle')) hits.push(r.url()); });
    await game.open();
    expect(hits, 'models-bundle.js is only for file://').toEqual([]);
  });

  test('PLAY starts the mill and the HUD ticks', async ({ game, page }) => {
    await game.openAndPlay();
    await expect.poll(async () => (await game.debug()).time, { timeout: 20_000 }).toBeGreaterThan(1.5);
    await expect(page.locator('#money')).toHaveText(/^\d/);
    await expect(page.locator('#jobBar')).toBeVisible();
    game.expectNoErrors();
  });

  test('3D models stream in after the game is already playable', async ({ game }) => {
    await game.openAndPlay();
    expect(await game.models()).toBe(true);
    game.expectNoErrors();
  });

  test('a returning player skips the start screen', async ({ game, page }) => {
    await game.openAndPlay();
    await page.reload();
    await page.waitForFunction(() => typeof window.__debug === 'function');
    await expect(page.locator('#startScreen')).toBeHidden();
  });

  test('help reopens from settings and BACK resumes', async ({ game, page }) => {
    await game.openAndPlay();
    await page.locator('#settingsBtn').click();
    await page.locator('#menuHelp').click();
    await expect(page.locator('#startScreen')).toBeVisible();
    await expect(page.locator('#startBtn')).toHaveText('BACK');
    const t0 = (await game.debug()).time;
    await page.waitForTimeout(600);
    expect((await game.debug()).time).toBeCloseTo(t0, 1);
    await page.locator('#startBtn').click();
    await expect(page.locator('#startScreen')).toBeHidden();
  });

  test('page title and landing name agree (plan: one searchable name)', async ({ page }) => {
    test.fail(true, 'Known: <title> is "Sawmill Tycoon", landing says "Pilana Tajkun" — MONETIZATION.md Faza 0');
    await page.goto(URL);
    await expect(page).toHaveTitle(/Pilana/);
  });
});
