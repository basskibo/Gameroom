import { test, expect } from './fixtures.mjs';

// The first minute (PT-IMP-U01): a short title card, then coach marks that point at the real thing.
test.describe('Pilana Tajkun · first minute', () => {
  test('title card: PLAY up front, the rules only behind "How to play"', async ({ game, page }) => {
    await game.open();
    await expect(page.locator('#startBtn')).toBeInViewport();
    await expect(page.locator('#rules')).toBeHidden();
    await page.locator('#howBtn').click();
    await expect(page.locator('#rules')).toBeVisible();
    await expect(page.locator('#rules')).toContainText('lumberjack');
    await game.play();
    game.expectNoErrors();
  });

  test('guide: tap the saw, buy a faster saw, then it hands over', async ({ game, page }) => {
    await game.openAndPlay('?auto&guide');
    await expect(page.locator('#coach')).not.toHaveClass(/hidden/, { timeout: 15_000 });
    await expect(page.locator('#coachTitle')).toHaveText('Tap the saw');
    await game.tapStation('saw');
    await expect(page.locator('#coachTitle')).toContainText('Faster saw', { timeout: 10_000 });
    await expect(page.locator('#shopRows button[data-up="saw"]')).toHaveClass(/coach/);
    await page.locator('#shopRows button[data-up="saw"]').click();
    await expect.poll(async () => (await game.debug()).lv.saw).toBe(1);
    await expect(page.locator('#coachTitle')).toHaveText('Jobs pay a bonus', { timeout: 10_000 });
    // it ends by itself and never comes back
    await expect.poll(() => page.evaluate(() => localStorage.getItem('pilana-tajkun:guide')), { timeout: 20_000 }).toBe('1');
    await expect(page.locator('#coach')).toHaveClass(/hidden/);
    game.expectNoErrors();
  });

  test('no guide for a returning player or with ?nointro', async ({ game, page }) => {
    await game.openAndPlay('?auto');
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.__guide())).toBeNull();
  });
});
