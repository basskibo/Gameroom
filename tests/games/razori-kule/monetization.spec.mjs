import { test, expect } from './fixtures.mjs';

const events = page => page.evaluate(() => window.Gameroom.events.map(e => e.event));
const watchFakeAd = async page => {
  await expect(page.locator('#gameroomFakeAd')).toBeVisible();
  await page.waitForTimeout(3300);
  await page.locator('#gameroomFakeAd button').click();
};

test.describe('Razori Kule · ads and analytics', () => {
  test('plain web: no offers, level_end is tracked', async ({ game, page }) => {
    await game.openAndPlay();
    await game.lose();
    await expect(page.locator('#end-reward')).toBeHidden();
    const ev = await events(page);
    expect(ev).toContain('game_start');
    expect(ev).toContain('level_end');
    expect(ev).not.toContain('session_end');   // the SDK sends session_end itself on pagehide
    game.expectNoErrors();
  });

  test('lost castle: 5 more rockets after a watched ad, the fight goes on', async ({ game, page }) => {
    await game.openAndPlay('?ads=test');
    await game.lose();
    await page.locator('#end-reward').click();
    await watchFakeAd(page);
    await expect(page.locator('#end')).toBeHidden();
    const s = await game.state();
    expect(s.over).toBe(null);
    expect(s.hpP).toBeGreaterThan(0);
    game.expectNoErrors();
  });

  test('won castle: ×2 points after a watched ad, offered once', async ({ game, page }) => {
    await game.openAndPlay('?ads=test');
    await game.win();
    const before = (await game.state()).score;
    await page.locator('#end-reward').click();
    await watchFakeAd(page);
    await expect.poll(async () => (await game.state()).score).toBe(before * 2);
    await expect(page.locator('#end-reward')).toBeHidden();
    expect(await events(page)).toContain('rewarded_watched');
  });

  test('refill: shown when the rockets run out, refills them all', async ({ game, page }) => {
    await game.openAndPlay('?ads=test');
    await page.evaluate(() => { for (let i = 0; i < 6; i++) window.__razori.state; });
    await page.evaluate(() => window.__razori.setAmmo(0));
    await expect(page.locator('#refill')).toBeVisible({ timeout: 5000 });
    await page.locator('#refill').click();
    await watchFakeAd(page);
    await expect.poll(async () => (await game.state()).ammo).toBe(6);
  });
});
