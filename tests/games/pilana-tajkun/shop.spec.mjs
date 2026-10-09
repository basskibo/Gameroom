import { test, expect } from './fixtures.mjs';

test.describe('Pilana Tajkun · upgrade panel', () => {
  test.beforeEach(async ({ game }) => { await game.openAndPlay(); });

  test('tapping the saw opens the Sawmill panel', async ({ game, page }) => {
    await game.tapStation('saw');
    await expect(page.locator('#shop')).toBeVisible();
    await expect(page.locator('#shopTitle')).toHaveText('Sawmill');
    await expect(page.locator('#shopRows button.urow').first()).toContainText('Faster saw');
  });

  test('buying spends money and raises the level', async ({ game, page }) => {
    await game.money(1000);
    await game.tapStation('saw');
    const before = await game.debug();
    await page.locator('#shopRows button[data-up="saw"]').click();
    const after = await game.debug();
    expect(after.lv.saw).toBe(before.lv.saw + 1);
    expect(after.money).toBeLessThan(before.money);
    await expect(page.locator('#shopRows button[data-up="saw"] .ulv')).toHaveText(/^1\//);
    game.expectNoErrors();
  });

  test('PT-BUG-002: every press registers while money keeps ticking', async ({ game, page }) => {
    await game.money(1e6);
    await game.tapStation('saw');
    await page.evaluate(() => { window.__tickT = setInterval(() => window.__addMoney(3), 40); });
    const row = page.locator('#shopRows button.urow').first(); // "Faster saw"
    await expect(row).toContainText('Faster saw');
    const start = (await game.debug()).lv.saw;
    for (let i = 0; i < 8; i++) {
      const box = await row.boundingBox();
      await page.mouse.move(box.x + 40, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(150 + (i % 3) * 60); // a normal human press, longer than one HUD refresh
      await page.mouse.up();
      await page.waitForTimeout(80);
    }
    await page.evaluate(() => clearInterval(window.__tickT));
    expect((await game.debug()).lv.saw).toBe(start + 8);
  });

  test('not enough money: red toast, nothing bought', async ({ game, page }) => {
    await game.tapStation('saw');
    const lv = (await game.debug()).lv.sawN;
    await page.locator('#shopRows button[data-up="sawN"]').click();
    await expect(page.locator('#toast')).toHaveClass(/show/);
    await expect(page.locator('#toast')).toHaveClass(/err/);
    await expect(page.locator('#toast')).toContainText('Not enough money');
    expect((await game.debug()).lv.sawN).toBe(lv);
  });

  test('a maxed upgrade shows MAX', async ({ game, page }) => {
    await game.cheat('sawN', 5);
    await game.tapStation('saw');
    await expect(page.locator('#shopRows button[data-up="sawN"]')).toHaveClass(/maxed/);
    await expect(page.locator('#shopRows button[data-up="sawN"] .uprice')).toHaveText('MAX');
  });

  test('closes with ✕ and with Escape', async ({ game, page }) => {
    await game.tapStation('saw');
    await page.locator('#shopClose').click();
    await expect(page.locator('#shop')).toBeHidden();
    await game.tapStation('saw');
    await page.keyboard.press('Escape');
    await expect(page.locator('#shop')).toBeHidden();
    expect((await game.debug()).time).toBeGreaterThan(0);
  });

  test('forklift panel has Unstick, and it does not throw', async ({ game, page }) => {
    await game.tapStation('forks', 'forkN');
    await expect(page.locator('#shopTitle')).toHaveText('Forklifts');
    await page.locator('#shopRows button.urow.act').click();
    await expect(page.locator('#toast')).toContainText('Forklifts freed');
    game.expectNoErrors();
  });

  test('mill books open from the money pill and switch tabs', async ({ game, page }) => {
    await game.run(300);
    await page.locator('#moneyPill').click();
    await expect(page.locator('#books')).toBeVisible();
    for (const tab of ['money', 'crew', 'pieces', 'overview']) {
      await page.locator(`#booksTabs button[data-book="${tab}"]`).click();
      await expect(page.locator(`#booksTabs button[data-book="${tab}"]`)).toHaveClass(/on/);
    }
    await page.locator('#booksClose').click();
    await expect(page.locator('#books')).toBeHidden();
    game.expectNoErrors();
  });
});
