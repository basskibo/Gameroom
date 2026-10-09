import { test, expect } from './fixtures.mjs';

// Ads and analytics go only through shared/gameroom-sdk.js. ?ads=test swaps in a fake ad (3 s, ✕ to close).
const events = page => page.evaluate(() => window.Gameroom.events.map(e => e.event));

test.describe('Pilana Tajkun · ads and analytics', () => {
  test('plain web: no ad network, no reward button, game_start is tracked', async ({ game, page }) => {
    await game.openAndPlay('?auto');
    await game.run(1000, 0.1); // 100 s of play
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.Gameroom.adapter)).toBe('none');
    await expect(page.locator('#boostBtn')).toBeHidden();
    expect(await events(page)).toContain('game_start');
    game.expectNoErrors();
  });

  test('rewarded ad: watched to the end doubles income for 3 minutes', async ({ game, page }) => {
    await game.openAndPlay('?auto&ads=test');
    await game.run(1000, 0.1);
    const btn = page.locator('#boostBtn');
    await expect(btn).toBeVisible({ timeout: 5000 });
    await btn.click();
    await expect(page.locator('#gameroomFakeAd')).toBeVisible();
    await page.waitForTimeout(3300);
    await page.locator('#gameroomFakeAd button').click();
    await expect(btn).toHaveClass(/on/);
    await expect(page.locator('#boostTxt')).toContainText(/×2 · [23]:\d\d/);
    const ev = await page.evaluate(() => window.Gameroom.events.filter(e => e.event === 'rewarded_watched').map(e => e.props.ok));
    expect(ev).toEqual([true]);
    expect(await events(page)).toContain('rewarded_offer');
    game.expectNoErrors();
  });

  test('rewarded ad closed early: no reward, the game goes on', async ({ game, page }) => {
    await game.openAndPlay('?auto&ads=test');
    await game.run(1000, 0.1);
    await page.locator('#boostBtn').click();
    await page.locator('#gameroomFakeAd button').click();
    await expect(page.locator('#boostBtn')).not.toHaveClass(/on/);
    const t0 = (await game.debug()).time;
    await page.waitForTimeout(800);
    expect((await game.debug()).time).toBeGreaterThan(t0);
    game.expectNoErrors();
  });
});
