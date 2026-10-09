// Runs only in the "mobile" project (Pixel 7, touch). Tag: @mobile
import { test, expect } from './fixtures.mjs';

test.describe('Razori Kule · phone @mobile', () => {
  test('PLAY works with a tap and the HUD fits', async ({ game, page }) => {
    await game.open();
    await page.locator('#play').tap();
    await expect(page.locator('#veil')).toBeHidden();
    const vp = page.viewportSize();
    const hud = await page.locator('#hud').boundingBox();
    expect(hud.y + hud.height).toBeLessThan(vp.height * 0.25);
    game.expectNoErrors();
  });

  test('RK-BUG-004: portrait shows the hill, not only the own castle', async ({ game, page }) => {
    await game.openAndPlay();
    await page.waitForTimeout(3000);   // after the castle reveal the camera is back home
    const visibleWorldW = await page.evaluate(() => window.__razori.view().w);
    expect(visibleWorldW).toBeGreaterThan(600);
  });

  test('a drag back and release fires a rocket', async ({ game, page }) => {
    await game.openAndPlay();
    await page.waitForTimeout(2600);
    const vp = page.viewportSize();
    const cdp = await page.context().newCDPSession(page);
    const pt = (x, y) => [{ x, y }];
    const x0 = vp.width * 0.7, y0 = vp.height * 0.5;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0, y0) });
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x0 - i * 12, y0 + i * 9) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(async () => (await game.state()).ammo, { timeout: 5000 }).toBeLessThan(6);
  });
});
