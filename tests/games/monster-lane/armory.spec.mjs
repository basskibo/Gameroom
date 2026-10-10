import { test, expect } from './fixtures.mjs';

async function loseRun(game, page) {
  await game.run(60 * 8);
  await page.evaluate(() => window.__kill());
  await game.run(2);
  await expect(page.locator('#overScreen')).toBeVisible();
}

test.describe('Monster Lane · armory (permanent upgrades)', () => {
  test('a run pays doubloons and the armory spends them for good', async ({ game, page }) => {
    await page.addInitScript(() => localStorage.setItem('monster-lane:stats', JSON.stringify({ v: 1, best: 0, bestWave: 0, games: 0, kills: 0, coins: 500 })));
    await game.open();
    await expect(page.locator('#armory1')).toContainText('500');
    await page.locator('#armory1 button[data-id="walls"]').click();
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('monster-lane:stats')));
    expect(st.armory.walls).toBe(1);
    expect(st.coins).toBe(380);
    await game.play();
    expect((await game.state()).baseHp).toBe(115);
    await loseRun(game, page);
    await expect(page.locator('#coinsGot')).toContainText('+');
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('monster-lane:stats')));
    expect(after.coins).toBeGreaterThan(380);
    game.expectNoErrors();
  });

  test('×2 doubloons after a watched ad', async ({ game, page }) => {
    await game.openAndPlay('?ads=test');
    await loseRun(game, page);
    const c0 = await page.evaluate(() => JSON.parse(localStorage.getItem('monster-lane:stats')).coins);
    await page.locator('#coinsBtn').click();
    await expect(page.locator('#gameroomFakeAd')).toBeVisible();
    await page.waitForTimeout(3300);
    await page.locator('#gameroomFakeAd button').click();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('monster-lane:stats')).coins)).toBe(c0 * 2);
  });

  test('stats from before the armory still load', async ({ game, page }) => {
    await page.addInitScript(() => localStorage.setItem('monster-lane:stats', JSON.stringify({ v: 1, best: 900, bestWave: 3, games: 4, kills: 300 })));
    await game.openAndPlay();
    expect((await game.state()).baseHp).toBe(100);
    game.expectNoErrors();
  });
});
