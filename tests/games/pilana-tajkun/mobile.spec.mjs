// Runs only in the "mobile" project (Pixel 7, touch). Tag: @mobile
import { test, expect } from './fixtures.mjs';

test.describe('Pilana Tajkun · phone @mobile', () => {
  test('PLAY works with a tap and the game starts', async ({ game, page }) => {
    await game.open();
    await page.locator('#startBtn').tap();
    await expect(page.locator('#startScreen')).toBeHidden();
    // software WebGL on a loaded machine can starve the first frames, so poll instead of a fixed wait
    await expect.poll(async () => (await game.debug()).time, { timeout: 15_000 }).toBeGreaterThan(0.3);
    game.expectNoErrors();
  });

  test('PT-BUG-010: PLAY is on screen without scrolling the rules', async ({ game, page }) => {
    await game.open();
    await expect(page.locator('#startBtn')).toBeInViewport();
  });

  test('HUD stays in the top half of the screen', async ({ game, page }) => {
    await game.openAndPlay();
    const vp = page.viewportSize();
    const top = await page.locator('#top').boundingBox();
    expect(top.y + top.height).toBeLessThan(vp.height * 0.5);
    const nav = await page.locator('#nav').boundingBox();
    expect(nav.y).toBeGreaterThan(vp.height * 0.8);
  });

  test('tapping the saw opens a panel that fits the screen', async ({ game, page }) => {
    await game.openAndPlay();
    await game.tapStation('saw');
    await expect(page.locator('#shop')).toBeVisible();
    const vp = page.viewportSize();
    const box = await page.locator('#shop').boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
  });

  test('a toast never covers the buyer offer', async ({ game, page }) => {

    await game.openAndPlay();
    await page.evaluate(() => { window.__deal('logs'); window.__rush('raw'); });
    const toast = await page.locator('#toast').boundingBox();
    const deal = await page.locator('#deal').boundingBox();
    const overlap = !(toast.y > deal.y + deal.height || toast.y + toast.height < deal.y || toast.x > deal.x + deal.width || toast.x + toast.width < deal.x);
    expect(overlap).toBe(false);
  });

  test('order, job, offer and toast sit in separate rows and leave the world visible', async ({ game, page }) => {
    await game.openAndPlay();
    await page.evaluate(() => { window.__deal('logs'); window.__rush('raw'); });
    await page.waitForTimeout(600);
    const vp = page.viewportSize();
    const box = id => page.locator(id).boundingBox();
    const [order, job, deal, toast, hint] = await Promise.all(['#orderBar', '#jobBar', '#deal', '#toast', '#hint'].map(box));
    const hits = (a, b) => !(a.y >= b.y + b.height || a.y + a.height <= b.y || a.x >= b.x + b.width || a.x + a.width <= b.x);
    expect(hits(order, job)).toBe(false);
    expect(hits(order, deal)).toBe(false);
    expect(hits(job, deal)).toBe(false);
    expect(hits(toast, deal)).toBe(false);
    expect(deal.y + deal.height).toBeLessThan(vp.height * 0.4);
    expect(hint.height).toBeLessThan(40); // one line (PT-BUG-022)
  });

  test('the HUD cards stay inside the screen', async ({ game, page }) => {
    await game.openAndPlay();
    await page.evaluate(() => { window.__deal('logs'); window.__rush('raw'); });
    // the cards slide in; software WebGL starves the frames, so wait for the animations themselves
    await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
    const vp = page.viewportSize();
    for (const id of ['#moneyPill', '#orderBar', '#jobBar', '#deal', '#nav', '#settingsBtn']) {
      const b = await page.locator(id).boundingBox();
      expect(b.x, id).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width, id).toBeLessThanOrEqual(vp.width);
    }
  });
});
