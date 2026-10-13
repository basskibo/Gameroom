// Runs only in the "mobile" project (Pixel 7, touch). Tag: @mobile
import { test, expect } from './fixtures.mjs';

test.describe('Remi Vita · phone @mobile', () => {
  test('round sheet fits the screen and the keypad works by tap', async ({ game, page }) => {
    await game.open();
    await game.start(['Ana', 'Marko', 'Jovana', 'Nikola', 'Mila']);
    await page.locator('#enterBtn').tap();
    const vp = page.viewportSize();
    // wait for the slide-in to finish, then the whole sheet (save button included) is on screen
    await expect.poll(async () => { const s = await page.locator('#saveRound').boundingBox(); return s.y + s.height; }, { timeout: 10_000 }).toBeLessThanOrEqual(vp.height);
    expect((await page.locator('.sheet').boundingBox()).y).toBeGreaterThanOrEqual(-1);
    await page.locator('.wbtn[data-pid=p0]').tap();
    for (let i = 0; i < 4; i++) { await page.locator('#keypad [data-k="5"]').tap(); await page.locator('#keypad [data-k="next"]').tap(); }
    await page.locator('#saveRound').tap();
    expect((await game.state()).totals).toEqual({ p0: -20, p1: 5, p2: 5, p3: 5, p4: 5 });
    game.expectNoErrors();
  });

  test('the board fits: no horizontal page scroll with 6 players', async ({ game, page }) => {
    await game.open();
    await game.start(['Ana', 'Marko', 'Jovana', 'Nikola', 'Mila', 'Petar']);
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(w).toBeLessThanOrEqual(page.viewportSize().width);
    const btn = await page.locator('#enterBtn').boundingBox();
    expect(btn.y + btn.height).toBeLessThanOrEqual(page.viewportSize().height);
  });
});
