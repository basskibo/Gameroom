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
    await page.locator('.entry[data-pid=p2] [data-no]').click();
    await expect(page.locator('#keypad [data-k="10"]')).toHaveCount(0);
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
    await page.locator('#changeWinner').click();
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
    // a few cards land on the felt, never a pile (capped at 6)
    const n = await page.evaluate(() => window.__remi.scene.looseCount);
    expect(n).toBeGreaterThan(2); expect(n).toBeLessThanOrEqual(6);
    game.expectNoErrors();
  });

  test('crown sits on the leader, the D chip on the dealer (also with non-sticky Firefox cells)', async ({ game, page }) => {
    await game.open();
    await game.start(['Lela', 'Gobla', 'Bojan']);
    await game.round('p0', 'close', { p1: 24, p2: 12 });
    await game.round('p2', 'close', { p0: 52, p1: 15 });   // Bojan leads with −8 and deals the third round
    const check = async () => page.evaluate(() => {
      const inside = (el, th) => { const a = el.getBoundingClientRect(), b = th.getBoundingClientRect(); return a.left >= b.left - 1 && a.right <= b.right + 1; };
      const crown = document.querySelector('.ph .crown'), d = document.querySelector('.ph .dtag');
      return { crown: inside(crown, document.querySelector('.ph[data-pid=p2]')), dealer: inside(d, document.querySelector(`.ph[data-pid=${window.__remi.state.dealer}]`)) };
    });
    expect(await check()).toEqual({ crown: true, dealer: true });
    // what Firefox gets (BUG-001 workaround): cells must stay positioned so the badges stay in their column
    await page.addStyleTag({ content: '.score thead th, .score tfoot td, .score .rn { position: relative !important; }' });
    expect(await check()).toEqual({ crown: true, dealer: true });
    const ffRule = await page.evaluate(() => [...document.styleSheets].flatMap(sh => { try { return [...sh.cssRules]; } catch (e) { return []; } })
      .filter(r => r instanceof CSSSupportsRule).flatMap(r => [...r.cssRules]).filter(r => /thead th/.test(r.selectorText)).map(r => r.style.position));
    expect(ffRule).toEqual(['relative']);
  });

  test('a gold rule after every full turn of the deal (every n rounds for n players)', async ({ game, page }) => {
    await game.open();
    await game.start(['Lela', 'Gobla', 'Bojan']);
    for (let i = 0; i < 7; i++) await game.round('p' + (i % 3), 'close', { p0: 3, p1: 3, p2: 3 });
    const cycles = await page.locator('#score tbody tr').evaluateAll(trs => trs.map((tr, i) => tr.classList.contains('cycle') ? i + 1 : 0).filter(Boolean));
    expect(cycles).toEqual([3, 6]);
  });

  test('a player who is out: whole column dark, a tag on the round; the buy-back dialog can finish the game', async ({ game, page }) => {
    await game.open();
    await game.start(['Lela', 'Gobla', 'Bojan'], { limit: 301, rebuy: 1 });
    await game.round('p0', 'close', { p1: 320, p2: 40 });
    await expect(page.locator('#rbEnd')).toBeVisible();
    await page.locator('#rbN').click();
    await game.round('p0', 'close', { p2: 10 });
    await expect(page.locator('td.out-now .outtag')).toHaveText('Out');
    await expect(page.locator('#score td.col-out')).toHaveCount(3); // the out round, the empty round after it, the total
    await expect(page.locator('#score [data-out]')).toHaveCount(0); // the old stamp overlay is gone
  });

  test('buy-back dialog: "Finish the game" ends it on the spot', async ({ game, page }) => {
    await game.open();
    await game.start(['Lela', 'Gobla', 'Bojan'], { limit: 301, rebuy: 1 });
    await game.round('p0', 'close', { p1: 320, p2: 40 });
    await page.locator('#rbEnd').click();
    await expect(page.locator('#eAgain')).toBeVisible();
    expect((await game.state()).over || !!(await page.evaluate(() => window.__remi.match.ended))).toBe(true);
    game.expectNoErrors();
  });

  test('loader: the home screen shows only after the 3D café is ready, then the loader is removed', async ({ game, page }) => {
    await page.goto('/games/remi-vita/?lang=en');   // not game.open(): that waits for the loader to finish
    await page.waitForFunction(() => !!window.__remi);
    // while the scene is building the screens are hidden behind the loader
    const early = await page.evaluate(() => ({ loader: !!document.getElementById('loader'), scene: !!window.__remi.scene, homeShown: getComputedStyle(document.getElementById('home')).display !== 'none' }));
    if (!early.scene) expect(early).toEqual({ loader: true, scene: false, homeShown: false });
    await page.waitForFunction(() => !!window.__remi.scene, null, { timeout: 60_000 });
    await expect(page.locator('#loader')).toHaveCount(0, { timeout: 5_000 });
    await expect(page.locator('#newBtn')).toBeVisible();
    expect(await page.evaluate(() => document.body.classList.contains('booting'))).toBe(false);
    game.expectNoErrors();
  });

  test('loader: without 3D (?no3d) it gets out of the way at once', async ({ game, page }) => {
    await game.open();
    await expect(page.locator('#loader')).toHaveCount(0, { timeout: 2_000 });
    await expect(page.locator('#newBtn')).toBeVisible();
  });

  test('history: export to a file, import it on a clean device, no duplicates, a foreign file is refused', async ({ game, page }) => {
    await game.open();
    await game.start(['Lela', 'Gobla', 'Bojan'], { limit: 301, rebuy: 0 });
    await game.round('p0', 'close', { p1: 320, p2: 10 });           // Gobla goes over, no buy-back
    await game.round('p0', 'close', { p2: 400 });                    // Bojan goes over: Lela wins, the game lands in history
    await expect(page.locator('#eHome')).toBeVisible();
    await page.locator('#eHome').click();
    await page.locator('[data-open=history]').click();
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#hExport').click()]);
    expect(dl.suggestedFilename()).toMatch(/^remi-vita-history-\d{4}-\d{2}-\d{2}\.json$/);
    const file = await dl.path();
    // another phone: empty history
    await page.evaluate(() => localStorage.setItem('remi-vita:history', '[]'));
    await page.locator('[data-close]').first().click();
    await page.locator('[data-open=history]').click();
    await page.locator('#hFile').setInputFiles(file);
    await expect(page.locator('#toast')).toHaveText('Imported 1 game');
    await page.locator('[data-tab=games]').click();
    await expect(page.locator('.hist-item')).toHaveCount(1);
    await expect(page.locator('.hist-item b')).toHaveText('Winner: Lela');
    await page.locator('#hFile').setInputFiles(file);                // same file again
    await expect(page.locator('#toast')).toHaveText('No new games in that file');
    await page.locator('#hFile').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
    await expect(page.locator('#toast')).toHaveText('That file is not a Remi Vita history');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('remi-vita:history')).length)).toBe(1);
    game.expectNoErrors();
  });

  test('Serbian strings', async ({ game, page }) => {
    await game.open('?no3d&lang=sr');
    await expect(page.locator('#newBtn')).toContainText('Nova igra');
  });
});
