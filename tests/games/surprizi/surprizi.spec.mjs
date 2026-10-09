// Surprizi (Surprise Toys). Debug: window.__debug (phase, tokens, mode), window.__surprizi (setTokens, tokens), ?open=<rarity>.
import { test, expect } from '@playwright/test';

const URL = '/games/surprizi/';
const ready = page => page.waitForFunction(() => window.__debug && window.__surprizi, null, { timeout: 60_000 });
const watchFakeAd = async page => {
  await expect(page.locator('#gameroomFakeAd')).toBeVisible();
  await page.waitForTimeout(3300);
  await page.locator('#gameroomFakeAd button').click();
};

test.describe('Surprizi · smoke and ads', () => {
  test('SU-BUG-001: loads without the 600 KB inline three.js, no errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const res = await page.goto(URL);
    const html = await res.text();
    expect(html.length).toBeLessThan(400_000);
    await ready(page);
    expect(errors).toEqual([]);
  });

  test('opening a bag adds a figure and tracks bag_opened', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.locator('#open-btn').click();
    await expect.poll(() => page.evaluate(() => window.__debug.phase), { timeout: 20_000 }).not.toBe('idle');
    await expect(page.locator('#progress-text')).toHaveText(/^1\//);
    const ev = await page.evaluate(() => window.Gameroom.events.map(e => e.event));
    expect(ev).toContain('bag_opened');
    expect(ev).toContain('game_start');
  });

  test('plain web: no daily-bag offer even with no tokens', async ({ page }) => {
    await page.goto(URL);
    await ready(page);
    await page.evaluate(() => window.__surprizi.setTokens(0));
    await expect(page.locator('#daily-btn')).toBeHidden();
  });

  test('daily bag: one free bag a day after a watched ad', async ({ page }) => {
    await page.goto(URL + '?ads=test');
    await ready(page);
    await page.evaluate(() => window.__surprizi.setTokens(0));
    await expect(page.locator('#daily-btn')).toBeVisible();
    await page.locator('#daily-btn').click();
    await watchFakeAd(page);
    await expect.poll(() => page.evaluate(() => window.__surprizi.tokens)).toBe(1);
    await page.evaluate(() => window.__surprizi.setTokens(0));
    await expect(page.locator('#daily-btn')).toBeHidden();   // used today
  });
});
