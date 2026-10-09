import { test, expect, URL } from './fixtures.mjs';

const ALL = ['sawN', 'sawN', 'truckN', 'truckN', 'truckN', 'forkN', 'forkN', 'planer', 'planerN', 'planerN', 'shop', 'joinery',
  'firewood', 'kit', 'veneer', 'veneerN', 'chipper', 'cutterN', 'cutterN', 'cutterN', 'frame', 'ranger', 'char', 'nursery',
  'rushN', 'rushN', 'export', 'haul', 'haul', 'haul', 'haul', 'joinFeed', 'kitFeed', 'fireHaul', 'fireHaul', 'fireHaul', 'boardHaul', 'boardHaul', 'dust', 'tip'];

test.describe('Pilana Tajkun · economy', () => {
  test('headless balance sim (?sim=900&smart) finishes without errors and grows', async ({ page, game }) => {
    await page.goto(URL + '?auto&sim=900&smart');
    await page.waitForFunction(() => window.__simDone === true, null, { timeout: 60_000 });
    const info = await page.evaluate(() => ({ ...window.simInfo, buys: window.simLog.length }));
    expect(info.buys).toBeGreaterThan(8);
    expect(info.earned).toBeGreaterThan(1500);
    game.expectNoErrors();
  });

  test('the first truck load sells within the first two minutes', async ({ game }) => {
    await game.openAndPlay();
    for (let i = 0; i < 12; i++) {
      const d = await game.run(100); // 10 s of mill time
      if (d.jobs.load) return;
    }
    throw new Error('no truck load sold in 120 s of mill time');
  });

  test('a full late-game mill keeps its books sane for 5 minutes', async ({ game }) => {
    await game.openAndPlay();
    await game.money(5e6);
    for (const id of ALL) await game.cheat(id);
    for (let chunk = 0; chunk < 10; chunk++) {
      const d = await game.run(300); // 30 s per chunk
      for (const k of ['money', 'stock', 'timber', 'boards', 'grove']) {
        expect(Number.isFinite(d[k]), `${k} is ${d[k]}`).toBe(true);
        expect(d[k], `${k} went negative`).toBeGreaterThanOrEqual(0);
      }
      expect(d.pieces).toBeLessThanOrEqual(1400);
      expect(d.shop.fire).toBeGreaterThanOrEqual(0);
    }
    game.expectNoErrors();
  });

  test('forklifts do not stay jammed in a busy yard', async ({ game }) => {
    await game.openAndPlay();
    await game.money(2e5);
    for (const id of ['forkN', 'forkN', 'forkN', 'forkN', 'truckN', 'truckN', 'truckN', 'sawN', 'sawN', 'dockN', 'dockN']) await game.cheat(id);
    let jammedTwice = 0;
    for (let i = 0; i < 6; i++) {
      const d = await game.run(200);
      const stuck = d.forks.filter(f => f[3] > 6).length;
      if (stuck) jammedTwice++;
    }
    expect(jammedTwice, 'a forklift was blocked for more than 6 s in several samples').toBeLessThan(2);
  });

  test('rush order can be summoned and its van parks', async ({ game, page }) => {
    await game.openAndPlay();
    await page.evaluate(() => window.__rush('raw'));
    await expect(page.locator('#orderWrap')).toBeVisible();
    const d = await game.run(200);
    expect(d.order.some(o => o.on && (o.phase === 'parked' || o.phase === 'arrive' || o.phase === 'idle'))).toBe(true);
    game.expectNoErrors();
  });

  test('buyer deal: offer, accept, then it runs', async ({ game, page }) => {
    await game.openAndPlay();
    await page.evaluate(() => window.__deal('logs'));
    await expect(page.locator('#deal')).toBeVisible();
    await page.locator('#dealYes').click();
    await expect(page.locator('#dealActs')).toBeHidden();
    await expect(page.locator('#dealTitle')).toHaveText(/×2/);
  });
});
