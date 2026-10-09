import { test, expect, URL } from './fixtures.mjs';

test.describe('Kamp Tajkun · smoke', () => {
  test('loads, start card, no errors, three.js from shared/vendor', async ({ game, page }) => {
    const cdn = [];
    page.on('request', r => { if (r.url().includes('cdn.jsdelivr')) cdn.push(r.url()); });
    await game.open();
    await expect(page.locator('#startScreen')).toBeVisible();
    expect(cdn).toEqual([]);
    game.expectNoErrors();
  });

  test('KT-BUG-001: a first-time player does not see "New game (erases progress)"', async ({ game, page }) => {
    await game.open();
    await expect(page.locator('#newBtn')).toBeHidden();
    await expect(page.locator('#startBtn')).toHaveText(/PLAY|IGRAJ/);
  });

  test('KT-BUG-002: opening and leaving without playing writes no save', async ({ game, page }) => {
    await game.open();
    await page.reload();
    await page.waitForFunction(() => typeof window.__state === 'function');
    expect(await page.evaluate(() => localStorage.getItem('kamp-tajkun:save'))).toBeNull();
    await expect(page.locator('#newBtn')).toBeHidden();
  });

  test('play: the camp runs, progress saves and comes back', async ({ game, page }) => {
    await game.openAndPlay();
    await page.evaluate(() => { window.__money(200); window.__unlock('sawmill'); });
    await game.run(30 * 6);
    await page.keyboard.press('KeyP');
    await expect(page.locator('#pauseScreen')).toBeVisible();
    await page.reload();
    await page.waitForFunction(() => typeof window.__state === 'function');
    await expect(page.locator('#newBtn')).toBeVisible();
    expect((await game.state()).unlocked).toContain('sawmill');
    game.expectNoErrors();
  });

  test('how to play opens the rules', async ({ game, page }) => {
    await game.open();
    await expect(page.locator('#steps')).toBeHidden();
    await page.locator('#howBtn').click();
    await expect(page.locator('#steps')).toBeVisible();
  });

  test('graphics setting cycles Auto → High → Low', async ({ game, page }) => {
    await game.openAndPlay();
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#menuGfx')).toContainText('Auto');
    await page.locator('#menuGfx').click();
    await expect(page.locator('#menuGfx')).toContainText('High');
    await page.locator('#menuGfx').click();
    await expect(page.locator('#menuGfx')).toContainText('Low');
    game.expectNoErrors();
  });
});
