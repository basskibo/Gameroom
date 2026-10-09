import { test, expect } from './fixtures.mjs';

const events = page => page.evaluate(() => window.Gameroom.events.map(e => e.event));
const watchFakeAd = async page => {
  await expect(page.locator('#gameroomFakeAd')).toBeVisible();
  await page.waitForTimeout(3300);
  await page.locator('#gameroomFakeAd button').click();
};
async function readyForHelper(game, page) {
  await page.evaluate(() => { window.__money(200); window.__unlock('sawmill'); window.__unlock('plankStand'); });
  await game.run(30 * 62);
}

test.describe('Kamp Tajkun · ads and analytics', () => {
  test('plain web: no offers, game_start and unlock are tracked', async ({ game, page }) => {
    await game.openAndPlay();
    await readyForHelper(game, page);
    await page.waitForTimeout(400);
    await expect(page.locator('#helperBtn')).toBeHidden();
    expect(await events(page)).toContain('game_start');
    expect(await events(page)).toContain('first_minute');
    game.expectNoErrors();
  });

  test('free helper: a watched ad adds a worker for 2 minutes, then he leaves', async ({ game, page }) => {
    await game.openAndPlay('?ads=test');
    await readyForHelper(game, page);
    await expect(page.locator('#helperBtn')).toBeVisible();
    await page.locator('#helperBtn').click();
    await watchFakeAd(page);
    await expect.poll(() => page.evaluate(() => window.__helper())).not.toBeNull();
    expect((await page.evaluate(() => window.__helper())).workers).toBe(1);
    await expect(page.locator('#helperBtn')).toHaveClass(/on/);
    await game.run(30 * 121);
    expect(await page.evaluate(() => window.__helper())).toBeNull();
    expect((await game.state()).workers).toBe(0);
    game.expectNoErrors();
  });

  test('order truck: ×2 reward after a watched ad', async ({ game, page }) => {
    await game.openAndPlay('?ads=test');
    const o = await page.evaluate(() => window.__forceOrder());
    expect(o.state).toBe('waiting');
    await expect(page.locator('#orderX2Btn')).toBeVisible();
    await page.locator('#orderX2Btn').click();
    await watchFakeAd(page);
    await expect.poll(() => page.evaluate(() => window.__order().doubled)).toBe(true);
    expect((await page.evaluate(() => window.__order())).reward).toBe(o.reward * 2);
    await expect(page.locator('#orderX2Btn')).toBeHidden();
  });
});
