// Runs only in the "mobile" project (Pixel 7, touch). Tag: @mobile
import { test, expect } from './fixtures.mjs';

test.describe('Monster Lane · phone @mobile', () => {
  test('PLAY is on screen and works with a tap', async ({ game, page }) => {
    await game.open();
    await expect(page.locator('#startBtn')).toBeInViewport();
    await page.locator('#startBtn').tap();
    await expect(page.locator('#startScreen')).toBeHidden();
    game.expectNoErrors();
  });

  test('a drag moves the pirate', async ({ game, page }) => {
    await game.openAndPlay();
    const vp = page.viewportSize();
    const cdp = await page.context().newCDPSession(page);
    const pt = x => [{ x, y: vp.height * 0.7 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(vp.width / 2) });
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(vp.width / 2 + i * 15) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => page.evaluate(() => window.__state && window.__targetX()), { timeout: 5000 }).toBeGreaterThan(1);
  });

  test('HUD stays clear of the bottom half', async ({ game, page }) => {
    await game.openAndPlay();
    const vp = page.viewportSize();
    for (const id of ['#top', '#weapon']) {
      const b = await page.locator(id).boundingBox();
      expect(b.y + b.height).toBeLessThan(vp.height * 0.5);
    }
  });
});
