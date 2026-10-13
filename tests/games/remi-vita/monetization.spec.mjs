import { test, expect } from './fixtures.mjs';

const events = page => page.evaluate(() => window.Gameroom.events.map(e => e.event));

test.describe('Remi Vita · ads and analytics', () => {
  test('plain web: no locks, every table is free; game_start and round_saved are tracked', async ({ game, page }) => {
    await game.open();
    await page.locator('[data-open=settings]').click();
    await expect(page.locator('.theme .lock')).toHaveCount(0);
    await page.locator('[data-theme-id=noir]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'noir');
    await page.locator('#layer [data-close]').click();
    await game.start();
    await game.round('p0', 'close', { p1: 1, p2: 1 });
    const ev = await events(page);
    expect(ev).toContain('game_start');
    expect(ev).toContain('round_saved');
    game.expectNoErrors();
  });

  test('with ads: a premium table unlocks after a watched rewarded ad', async ({ game, page }) => {
    await game.open('?no3d&lang=en&ads=test');
    await page.locator('[data-open=settings]').click();
    await expect(page.locator('[data-theme-id=bordo] .lock')).toBeVisible();
    await page.locator('[data-theme-id=bordo]').click();
    await expect(page.locator('#gameroomFakeAd')).toBeVisible();
    await page.waitForTimeout(3300);
    await page.locator('#gameroomFakeAd button').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'bordo');
    await expect(page.locator('[data-theme-id=bordo] .lock')).toHaveCount(0);
    const ev = await events(page);
    expect(ev).toContain('rewarded_offer');
    expect(ev).toContain('rewarded_watched');
  });

  test('with ads: closing the ad early unlocks nothing', async ({ game, page }) => {
    await game.open('?no3d&lang=en&ads=test');
    await page.locator('[data-open=settings]').click();
    await page.locator('[data-theme-id=noir]').click();
    await page.locator('#gameroomFakeAd button').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'classic');
    await expect(page.locator('[data-theme-id=noir] .lock')).toBeVisible();
  });
});
