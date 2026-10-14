// Runs only in the "mobile" project (Pixel 7, touch). Tag: @mobile
import { test, expect } from './fixtures.mjs';

test.describe('Remi Vita · phone @mobile', () => {
  test('round sheet: everyone is visible in both steps and the keypad works by tap', async ({ game, page }) => {
    await game.open();
    await game.start(['Ana', 'Marko', 'Jovana', 'Nikola', 'Mila', 'Petar']);
    await page.locator('#enterBtn').tap();
    const vp = page.viewportSize();
    const inView = async sel => { const b = await page.locator(sel).boundingBox(); return b && b.y >= -1 && b.y + b.height <= vp.height; };
    // step 1: every player is a big button, the last one is on screen without scrolling
    await expect.poll(() => inView('.wbtn[data-pid=p5]'), { timeout: 10_000 }).toBe(true);
    await page.locator('.wbtn[data-pid=p0]').tap();
    // step 2: every other player's row and the save button fit on screen
    for (const id of ['p1', 'p5']) expect(await inView(`.entry[data-pid=${id}]`)).toBe(true);
    expect(await inView('#saveRound')).toBe(true);
    for (let i = 0; i < 5; i++) { await page.locator('#keypad [data-k="5"]').tap(); await page.locator('#keypad [data-k="next"]').tap(); }
    await page.locator('#saveRound').tap();
    expect((await game.state()).totals).toEqual({ p0: -20, p1: 5, p2: 5, p3: 5, p4: 5, p5: 5 });
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
