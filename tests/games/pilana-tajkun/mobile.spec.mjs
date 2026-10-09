// Runs only in the "mobile" project (Pixel 7, touch). Tag: @mobile
import { test, expect } from './fixtures.mjs';

test.describe('Pilana Tajkun · phone @mobile', () => {
  test('PLAY works with a tap and the game starts', async ({ game, page }) => {
    await game.open();
    await page.locator('#startBtn').tap();
    await expect(page.locator('#startScreen')).toBeHidden();
    await page.waitForTimeout(1000);
    expect((await game.debug()).time).toBeGreaterThan(0.3);
    game.expectNoErrors();
  });

  test('PLAY is on screen without scrolling the rules', async ({ game, page }) => {
    test.fail(true, 'Known UX bug PT-BUG-010: the rules are ~20 paragraphs, PLAY sits far below the fold on a phone');
    await game.open();
    await expect(page.locator('#startBtn')).toBeInViewport();
  });

  test('HUD stays in the top half of the screen', async ({ game, page }) => {
    await game.openAndPlay();
    const vp = page.viewportSize();
    const top = await page.locator('#top').boundingBox();
    expect(top.y + top.height).toBeLessThan(vp.height * 0.5);
    const nav = await page.locator('#nav').boundingBox();
    expect(nav.y).toBeGreaterThan(vp.height * 0.8);
  });

  test('tapping the saw opens a panel that fits the screen', async ({ game, page }) => {
    await game.openAndPlay();
    await game.tapStation('saw');
    await expect(page.locator('#shop')).toBeVisible();
    const vp = page.viewportSize();
    const box = await page.locator('#shop').boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
  });

  test('a toast never covers the buyer offer', async ({ game, page }) => {

    await game.openAndPlay();
    await page.evaluate(() => { window.__deal('logs'); window.__rush('raw'); });
    const toast = await page.locator('#toast').boundingBox();
    const deal = await page.locator('#deal').boundingBox();
    const overlap = !(toast.y > deal.y + deal.height || toast.y + toast.height < deal.y || toast.x > deal.x + deal.width || toast.x + toast.width < deal.x);
    expect(overlap).toBe(false);
  });
});
