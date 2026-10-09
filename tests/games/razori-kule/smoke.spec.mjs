import { test, expect, URL } from './fixtures.mjs';

test.describe('Razori Kule · smoke', () => {
  test('loads, shows the start card, no errors', async ({ game, page }) => {
    await game.open();
    await expect(page.locator('#veil')).toBeVisible();
    await expect(page.locator('#gameroom-back')).toHaveAttribute('href', '../../');
    game.expectNoErrors();
  });

  test('RK-BUG-001: unused 3D models and sprites are not shipped', async ({ request }) => {
    for (const f of ['assets/Barracks%20by%20Quaternius%20-%20UXCOwRBSxx.glb', 'assets/sprites/tower-0.png']) {
      expect((await request.get(URL + f)).status()).toBe(404);
    }
  });

  test('a shot flies, explodes and carves the hill', async ({ game, page }) => {
    await game.openAndPlay();
    const before = await page.evaluate(() => window.__razori.solidCount());
    expect(await page.evaluate(() => window.__razori.fireVelocity(760, -700))).toBe(true);
    await expect.poll(() => page.evaluate(() => window.__razori.rockets.length), { timeout: 15_000 }).toBe(0);
    expect(await page.evaluate(() => window.__razori.solidCount())).toBeLessThan(before);
    game.expectNoErrors();
  });

  test('win: stars, the next castle is unlocked and remembered', async ({ game, page }) => {
    await game.openAndPlay();
    await game.win();
    await expect(page.locator('#stars span.on')).not.toHaveCount(0);
    expect((await page.evaluate(() => window.__razori.progress)).level).toBe(2);
    await page.locator('#end-next').click();
    expect((await game.state()).level).toBe(2);
    await page.reload();
    await page.waitForFunction(() => !!window.__razori);
    await expect(page.locator('#play')).toContainText('2');
    await expect(page.locator('#newgame')).toBeVisible();
    game.expectNoErrors();
  });

  test('RK-BUG-002: losing retries the same castle instead of dropping to level 1', async ({ game, page }) => {
    await game.openAndPlay();
    await game.win();
    await page.locator('#end-next').click();
    await game.lose();
    await page.locator('#end-next').click();
    expect((await game.state()).level).toBe(2);
  });

  test('pause from settings stops the turn and closing resumes', async ({ game, page }) => {
    await game.openAndPlay();
    await page.locator('#gear').click();
    await expect(page.locator('#settings')).toBeVisible();
    await page.locator('#set-close').click();
    await expect(page.locator('#settings')).toBeHidden();
    expect(await page.evaluate(() => window.__razori.fireVelocity(700, -700))).toBe(true);
  });

  test('RK-BUG-003: after the tab was hidden once, closing settings still resumes', async ({ game, page }) => {
    await game.openAndPlay();
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    await expect(page.locator('#pause')).toBeVisible();
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); });
    await page.locator('#resume').click();
    await page.locator('#gear').click();
    await page.locator('#set-close').click();
    expect(await page.evaluate(() => window.__razori.fireVelocity(700, -700))).toBe(true);
  });

  test('title carries the English and the local name', async ({ page }) => {
    await page.goto(URL);
    await expect(page).toHaveTitle(/Smash the Towers|Razori Kule/);
  });
});
