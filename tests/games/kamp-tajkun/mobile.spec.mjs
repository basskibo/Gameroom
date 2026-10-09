// Runs only in the "mobile" project (Pixel 7, touch). Tag: @mobile
import { test, expect } from './fixtures.mjs';

test.describe('Kamp Tajkun · phone @mobile', () => {
  test('PLAY is on screen and works with a tap', async ({ game, page }) => {
    await game.open();
    await expect(page.locator('#startBtn')).toBeInViewport();
    await page.locator('#startBtn').tap();
    await expect(page.locator('#startScreen')).toBeHidden();
    game.expectNoErrors();
  });

  test('the joystick drag moves the player', async ({ game, page }) => {
    await game.openAndPlay();
    const vp = page.viewportSize();
    const cdp = await page.context().newCDPSession(page);
    const p0 = await page.evaluate(() => window.__state().time);
    const pt = (x, y) => [{ x, y }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(vp.width / 2, vp.height * 0.7) });
    for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(vp.width / 2 + i * 10, vp.height * 0.7) });
    await expect(page.locator('#joy')).toBeVisible();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(page.locator('#joy')).toBeHidden();
    expect(await page.evaluate(() => window.__state().time)).toBeGreaterThanOrEqual(p0);
  });
});
