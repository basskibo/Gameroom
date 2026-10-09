import { test, expect } from './fixtures.mjs';

const ready = page => page.waitForFunction(() => typeof window.__debug === 'function');

test.describe('Pilana Tajkun · save / load', () => {
  test('progress survives a reload', async ({ game, page }) => {
    await game.openAndPlay();
    await game.cheat('saw', 3);
    await game.cheat('truckN', 1);
    await page.reload();
    await ready(page);
    const d = await game.debug();
    expect(d.lv.saw).toBe(3);
    expect(d.lv.truckN).toBe(1);
  });

  test('the save is versioned', async ({ game, page }) => {
    await game.openAndPlay();
    await game.cheat('saw', 1);
    await page.evaluate(() => window.dispatchEvent(new Event('beforeunload')));
    const raw = await page.evaluate(() => JSON.parse(localStorage.getItem('pilana-tajkun:v2')));
    expect(raw.v).toBeGreaterThanOrEqual(2);
    expect(raw.lv.saw).toBe(1);
  });

  test('a named save shows up under Load and loads back', async ({ game, page }) => {
    await game.openAndPlay();
    await game.cheat('yield', 2);
    await page.locator('#settingsBtn').click();
    await page.locator('#menuSave').click();
    await page.locator('#saveName').fill('Test mill');
    await page.locator('#saveConfirm').click();
    await expect(page.locator('#toast')).toContainText('Saved');

    await game.cheat('yield', 3); // change the live game after saving
    await page.locator('#settingsBtn').click();
    await page.locator('#menuLoad').click();
    const slot = page.locator('#saveList button.slot', { hasText: 'Test mill' });
    await expect(slot).toBeVisible();
    await slot.click();
    await ready(page);
    expect((await game.debug()).lv.yield).toBe(2);
  });

  test('New game starts fresh and keeps the old mill under Load', async ({ game, page }) => {
    await game.openAndPlay();
    await game.cheat('saw', 4);
    await page.locator('#settingsBtn').click();
    await page.locator('#menuNew').click();
    await page.locator('#saveConfirm').click();
    await ready(page);
    expect((await game.debug()).lv.saw).toBe(0);
    const slots = await page.evaluate(() => JSON.parse(localStorage.getItem('pilana-tajkun:slots')));
    expect(slots.some(s => s.name === 'Before new game' && s.snap.lv.saw === 4)).toBe(true);
  });

  test('a corrupt save does not break the game', async ({ page, game }) => {
    await page.addInitScript(() => { if (!sessionStorage.seeded) { localStorage.setItem('pilana-tajkun:v2', '{not json'); sessionStorage.seeded = 1; } });
    await game.open();
    await game.play();
    expect((await game.debug()).money).toBeGreaterThan(0);
    game.expectNoErrors();
  });

  test('PT-BUG-005: a save name is shown as text, not HTML (list and toast)', async ({ game, page }) => {
    await game.openAndPlay();
    await page.locator('#settingsBtn').click();
    await page.locator('#menuSave').click();
    await page.locator('#saveName').fill('<i>Mill</i>');
    await page.locator('#saveConfirm').click();
    await expect(page.locator('#toast small')).toHaveText('<i>Mill</i>');
    await page.locator('#settingsBtn').click();
    await page.locator('#menuLoad').click();
    await expect(page.locator('#saveList button.slot').first()).toContainText('<i>Mill</i>');
  });
});
