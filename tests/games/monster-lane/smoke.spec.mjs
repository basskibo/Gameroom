import { test, expect, URL } from './fixtures.mjs';

test.describe('Monster Lane · smoke', () => {
  test('loads, shows the start card, no errors', async ({ game, page }) => {
    await game.open();
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.locator('#startScreen')).toBeVisible();
    await expect(page.locator('#gameroom-back')).toHaveAttribute('href', '../../');
    game.expectNoErrors();
  });

  test('ML-BUG-001: no 2 MB inline model bundle, three.js comes from shared/vendor', async ({ game, page }) => {
    const hits = [];
    page.on('request', r => hits.push(r.url()));
    await game.open();
    expect(await game.models()).toBe(true);
    expect(hits.filter(u => u.includes('kit-bundle'))).toEqual([]);
    expect(hits.filter(u => u.includes('cdn.jsdelivr'))).toEqual([]);
    expect(hits.some(u => u.includes('/assets/models/ship-pirate-large.glb'))).toBe(true);
    game.expectNoErrors();
  });

  test('PLAY starts wave 1 and the gun kills pirates', async ({ game }) => {
    await game.openAndPlay();
    const s = await game.run(60 * 12);
    expect(s.running).toBe(true);
    expect(s.score).toBeGreaterThan(0);
    game.expectNoErrors();
  });

  test('pause stops the simulation and resume continues it', async ({ game, page }) => {
    await game.openAndPlay();
    await page.keyboard.press('KeyP');
    await expect(page.locator('#pauseScreen')).toBeVisible();
    expect((await game.state()).paused).toBe(true);
    await page.locator('#resumeBtn').click();
    await expect(page.locator('#pauseScreen')).toBeHidden();
    expect((await game.state()).paused).toBe(false);
  });

  test('game over saves the best score (versioned) and AGAIN restarts', async ({ game, page }) => {
    await game.openAndPlay();
    await game.run(60 * 6);
    await page.evaluate(() => window.__kill());
    await game.run(2);
    await expect(page.locator('#overScreen')).toBeVisible();
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('monster-lane:stats')));
    expect(st.v).toBe(1);
    expect(st.games).toBe(1);
    expect(st.best).toBeGreaterThan(0);
    await page.locator('#restartBtn').click();
    await expect(page.locator('#overScreen')).toBeHidden();
    expect((await game.state()).running).toBe(true);
    game.expectNoErrors();
  });

  test('an old best score (monsterLaneBest) carries over', async ({ page, game }) => {
    await page.addInitScript(() => { if (!localStorage.getItem('monster-lane:stats')) localStorage.setItem('monsterLaneBest', '4321'); });
    await game.open();
    await expect(page.locator('#bestLine')).toContainText('4321');
  });

  test('first game shows the guide bubble, the second does not', async ({ game, page }) => {
    await game.openAndPlay();
    await expect(page.locator('#coach')).not.toHaveClass(/hidden/);
    await page.evaluate(() => localStorage.setItem('monster-lane:guide', 'done'));
    await page.reload();
    await game.play();
    await page.waitForTimeout(500);
    await expect(page.locator('#coach')).toHaveClass(/hidden/);
  });

  test('title carries the game name', async ({ page }) => {
    await page.goto(URL);
    await expect(page).toHaveTitle(/Monster Lane/);
  });
});
