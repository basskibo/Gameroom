import { test, expect } from './fixtures.mjs';

// four finished games in the old (v1.1) history format: final results only, no rounds, no places
const OLD = { app: 'remi-vita', kind: 'history', v: 1, exported: '2026-10-17T01:57:16.084Z', history: [
  { id: 'g4', ended: 1792202189130, rounds: 10, winner: 'Lela', players: [
    { name: 'Gobla', color: '#e7b866', suit: '♠', total: 470, out: false }, { name: 'Lela', color: '#ef6b5b', suit: '♥', total: -163, out: false }, { name: 'Bojan', color: '#5fd39a', suit: '♦', total: 619, out: true }] },
  { id: 'g3', ended: 1792197206480, rounds: 12, winner: 'Gobla', players: [
    { name: 'Gobla', color: '#e7b866', suit: '♠', total: 341, out: false }, { name: 'Lela', color: '#ef6b5b', suit: '♥', total: 610, out: true }, { name: 'Bojan', color: '#5fd39a', suit: '♦', total: 412, out: false }] },
  { id: 'g2', ended: 1792190084744, rounds: 19, winner: 'Bojan', players: [
    { name: 'Gobla', color: '#e7b866', suit: '♠', total: 549, out: true }, { name: 'Lela', color: '#ef6b5b', suit: '♥', total: 359, out: false }, { name: 'Bojan', color: '#5fd39a', suit: '♦', total: -53, out: false }] },
  { id: 'g1', ended: 1792180290167, rounds: 6, winner: 'Gobla', players: [
    { name: 'Gobla', color: '#e7b866', suit: '♠', total: 110, out: false }, { name: 'Lela', color: '#ef6b5b', suit: '♥', total: 353, out: false }, { name: 'Bojan', color: '#5fd39a', suit: '♦', total: 598, out: true }] },
] };

async function importOld(page) {
  await page.locator('[data-open=history]').click();
  await page.locator('#hFile').setInputFiles({ name: 'h.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(OLD)) });
  await expect(page.locator('#toast')).toHaveText('Imported 4 games');
}

test.describe('Remi Vita · history', () => {
  test('leaderboard over every game: most wins first, tap a player to see their games', async ({ game, page }) => {
    await game.open();
    await importOld(page);
    // Gobla 2 wins, then Lela and Bojan 1 each; Lela places better on average (1, 3, 2, 2 → 2.0 vs 3, 2, 1, 3 → 2.25)
    await expect(page.locator('.lb-row .meta b')).toHaveText(['Gobla', 'Lela', 'Bojan']);
    await expect(page.locator('.lb-row').first().locator('.lb-w b')).toHaveText('2');
    await expect(page.locator('.lb-row').nth(1)).toContainText('best −163');
    await page.locator('.lb-row[data-who=lela]').click();
    await expect(page.locator('.hfilter')).toContainText('Games with Lela');
    await expect(page.locator('.hist-item')).toHaveCount(4);
    // full ranking in each game, winner first, the out player last
    await expect(page.locator('.hist-item').first().locator('.hrank > span')).toHaveText(['1. Lela −163', '2. Gobla 470', '3. Bojan 619']);
    game.expectNoErrors();
  });

  test('a finished game keeps its whole table and opens round by round; an old entry shows the final result', async ({ game, page }) => {
    await game.open();
    await game.start(['Ana', 'Marko', 'Jovana'], { limit: 101, rebuy: 0 });
    await game.round('p0', 'close', { p1: 30, p2: 5 });
    await game.round('p1', 'hand', { p0: 10, p2: 50 });    // Jovana: 5 + 100 = 105, over 101 → out
    await game.round('p0', 'close', { p1: 90 });            // Marko: 30 − 40 + 90 = 80, Ana −20 + 20 − 20 = −20
    await page.locator('#menuBtn').click();
    page.once('dialog', d => d.accept());
    await page.locator('#mFinish').click();
    await expect(page.locator('#eHome')).toBeVisible();
    const h = await page.evaluate(() => JSON.parse(localStorage.getItem('remi-vita:history'))[0]);
    expect(h.rows).toHaveLength(3);
    expect(h.players.map(p => p.place)).toEqual([1, 2, 3]);
    expect(h.rows[1]).toMatchObject({ w: 1, t: 'h', s: [20, -40, 100], a: [0, -10, 105] });
    await page.locator('#eHome').click();
    await importOld(page);
    await page.locator('[data-tab=games]').click();
    await expect(page.locator('.hist-item')).toHaveCount(5);
    await page.locator('.hist-item').first().click();       // ours: newest
    await expect(page.locator('.htable tbody tr')).toHaveCount(3);
    await expect(page.locator('.htable tfoot td')).toHaveText(['Σ', '−20', '80', '105']);
    await expect(page.locator('.final-list li').last()).toContainText('Out');
    // export → import keeps the rounds
    const [dl] = await Promise.all([page.waitForEvent('download'), (async () => { await page.locator('#gBack').click(); await page.locator('#hExport').click(); })()]);
    await page.evaluate(() => localStorage.setItem('remi-vita:history', '[]'));
    await page.locator('#hFile').setInputFiles(await dl.path());
    await expect(page.locator('#toast')).toHaveText('Imported 5 games');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('remi-vita:history'))[0].rows.length)).toBe(3);
    await page.locator('[data-tab=games]').click();
    await page.locator('.hist-item').last().click();        // an old entry
    await expect(page.locator('.htable')).toHaveCount(0);
    await expect(page.locator('.modal .hint')).toContainText('final result only');
    game.expectNoErrors();
  });

  test('deleting asks first: one game, or the whole history', async ({ game, page }) => {
    await game.open();
    await importOld(page);
    await page.locator('[data-tab=games]').click();
    await page.locator('.hist-item').first().click();
    page.once('dialog', d => d.dismiss());
    await page.locator('#gDel').click();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('remi-vita:history')).length)).toBe(4);
    page.once('dialog', d => d.accept());
    await page.locator('#gDel').click();
    await expect(page.locator('#toast')).toHaveText('Game deleted');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('remi-vita:history')).map(h => h.id))).toEqual(['g3', 'g2', 'g1']);
    page.once('dialog', d => d.dismiss());
    await page.locator('#hClear').click();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('remi-vita:history')).length)).toBe(3);
    game.expectNoErrors();
  });
});

test.describe('Remi Vita · board', () => {
  test('after one round the row shows that round, Σ shows where everyone stands (no look-alike rows)', async ({ game, page }) => {
    await game.open();
    await game.start();
    await game.round('p1', 'close', { p0: 10, p2: 4 });
    const row = page.locator('#score tbody tr').first();
    await expect(row).toHaveClass(/last/);
    await expect(row.locator('.pts')).toHaveText(['+10', '−20', '+4']);
    await expect(row.locator('.run')).toHaveText(['Σ 10', 'Σ −20', 'Σ 4']);
    await expect(page.locator('tfoot .rn')).toContainText('Total');
    await game.round('p0', 'close', { p1: 5, p2: 6 });
    await expect(page.locator('#score tbody tr.last')).toHaveCount(1);
    await expect(page.locator('#score tbody tr').nth(1)).toHaveClass(/last/);
    await expect(page.locator('#score tbody tr').nth(1).locator('.run')).toHaveText(['Σ −10', 'Σ −15', 'Σ 10']);
    game.expectNoErrors();
  });
});
