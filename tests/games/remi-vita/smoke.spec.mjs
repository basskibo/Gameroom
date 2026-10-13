import { test, expect } from './fixtures.mjs';

test.describe('Remi Vita · score sheet', () => {
  test('setup through the UI: add players, deal, the first player deals', async ({ game, page }) => {
    await game.open();
    await page.locator('#newBtn').click();
    for (const n of ['Ana', 'Marko', 'Jovana']) { await page.locator('#nameInput').fill(n); await page.locator('#nameInput').press('Enter'); }
    await expect(page.locator('#plist li')).toHaveCount(3);
    await page.locator('#startBtn').click();
    await expect(page.locator('#dealerName')).toHaveText('Ana');
    await expect(page.locator('#firstName')).toContainText('Marko');
    game.expectNoErrors();
  });

  test('close: winner −20, the others add what they hold (10 + 4 = 14)', async ({ game }) => {
    await game.open();
    await game.start();
    await game.round('p1', 'close', { p0: 10, p2: 7 });
    await game.round('p1', 'close', { p0: 4, p2: 3 });
    const s = await game.state();
    expect(s.totals).toEqual({ p0: 14, p1: -40, p2: 10 });
  });

  test('in one hand: winner −40 and everyone else pays double', async ({ game }) => {
    await game.open();
    await game.start();
    await game.round('p2', 'hand', { p0: 12, p1: 5 });
    const s = await game.state();
    expect(s.totals).toEqual({ p0: 24, p1: 10, p2: -40 });
  });

  test('not opened pays 100, doubled on a hand', async ({ game }) => {
    await game.open();
    await game.start();
    await game.round('p0', 'close', { p2: 3 }, { p1: true });
    await game.round('p0', 'hand', { p2: 1 }, { p1: true });
    expect((await game.state()).totals).toEqual({ p0: -60, p1: 300, p2: 5 });
  });

  test('the deal moves along the seats every round and wraps around', async ({ game, page }) => {
    await game.open();
    await game.start(['Ana', 'Marko', 'Jovana']);
    const dealers = [];
    for (let i = 0; i < 4; i++) {
      dealers.push(await page.locator('#dealerName').textContent());
      await game.round('p0', 'close', { p1: 1, p2: 1 });
    }
    expect(dealers).toEqual(['Ana', 'Marko', 'Jovana', 'Ana']);
  });

  test('undo removes the last round and gives the deal back', async ({ game, page }) => {
    await game.open();
    await game.start();
    await game.round('p0', 'close', { p1: 9, p2: 9 });
    await expect(page.locator('#dealerName')).toHaveText('Marko');
    await page.locator('#undoBtn').click();
    await expect(page.locator('#dealerName')).toHaveText('Ana');
    expect((await game.state()).roundNo).toBe(0);
  });

  test('the round sheet: winner, keypad entry, live preview, save', async ({ game, page }) => {
    await game.open();
    await game.start();
    await page.locator('#enterBtn').click();
    await page.locator('.wbtn[data-pid=p1]').click();
    await page.locator('#keypad [data-k="1"]').click();
    await page.locator('#keypad [data-k="4"]').click();
    await page.locator('#keypad [data-k="next"]').click();
    await page.locator('#keypad [data-k="no"]').click();
    await expect(page.locator('#saveRound')).toBeEnabled();
    await page.locator('#saveRound').click();
    await expect(page.locator('tfoot [data-tot=p0]')).toHaveText('14');
    await expect(page.locator('tfoot [data-tot=p2]')).toHaveText('100');
    await expect(page.locator('tfoot [data-tot=p1]')).toHaveText('−20');
    game.expectNoErrors();
  });

  test('editing a past round recomputes every total after it', async ({ game, page }) => {
    await game.open();
    await game.start();
    await game.round('p0', 'close', { p1: 10, p2: 10 });
    await game.round('p1', 'close', { p0: 5, p2: 5 });
    await page.locator('[data-edit="0"]').click();
    await page.locator('.wbtn[data-pid=p0]').click();
    await page.locator('#wtype [data-type=hand]').click();
    await page.locator('#saveRound').click();
    // round 1 becomes a hand by Ana: −40, the others 10 × 2; round 2 stays: Marko −20, Ana +5, Jovana +5
    expect((await game.state()).totals).toEqual({ p0: -35, p1: 0, p2: 25 });
  });

  test('over the limit: buy back in at the highest score, or out; last one standing wins', async ({ game, page }) => {
    await game.open();
    await game.start(['Ana', 'Marko', 'Jovana'], { limit: 301, rebuy: 1 });
    await game.round('p0', 'close', { p1: 320, p2: 40 });
    await expect(page.locator('#rbY')).toBeVisible();
    await page.locator('#rbY').click();
    let s = await game.state();
    expect(s.totals.p1).toBe(40);          // came back with Jovana's 40
    await game.round('p0', 'close', { p1: 300, p2: 300 });
    await expect(page.locator('#rbN')).toBeVisible();
    await page.locator('#rbN').click();       // Jovana is out (her one buy-in is left but she declines)
    s = await game.state();
    expect(s.out.p2).toBe(true);
    expect(s.out.p1).toBe(true);           // Marko had no buy-ins left
    await expect(page.locator('#end')).toBeVisible();
    await expect(page.locator('#end h3')).toContainText('Ana');
    const hist = await page.evaluate(() => JSON.parse(localStorage.getItem('remi-vita:history')));
    expect(hist[0].winner).toBe('Ana');
    game.expectNoErrors();
  });

  test('the game survives a reload', async ({ game, page }) => {
    await game.open();
    await game.start();
    await game.round('p2', 'hand', { p0: 3, p1: 4 });
    await game.open();
    await expect(page.locator('#resumeBtn')).toBeVisible();
    await page.locator('#resumeBtn').click();
    await expect(page.locator('tfoot [data-tot=p0]')).toHaveText('6');
    await expect(page.locator('#dealerName')).toHaveText('Marko');
  });

  test('3D table loads without errors and reacts to a hand', async ({ game, page }) => {
    await game.open('?lang=en');
    await page.waitForFunction(() => !!window.__remi.scene, null, { timeout: 30_000 });
    await game.start();
    await game.round('p1', 'hand', { p0: 2, p2: 2 });
    expect(await page.evaluate(() => window.__remi.scene.looseCount)).toBeGreaterThan(10);
    game.expectNoErrors();
  });

  test('Serbian strings', async ({ game, page }) => {
    await game.open('?no3d&lang=sr');
    await expect(page.locator('#newBtn')).toContainText('Nova igra');
  });
});
