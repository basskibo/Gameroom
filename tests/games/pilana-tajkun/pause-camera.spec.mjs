import { test, expect } from './fixtures.mjs';

test.describe('Pilana Tajkun · pause', () => {
  test.beforeEach(async ({ game }) => { await game.openAndPlay(); });

  test('P pauses and resumes; mill time stands still while paused', async ({ game, page }) => {
    await page.keyboard.press('p');
    await expect(page.locator('#pauseScreen')).toBeVisible();
    const t0 = (await game.debug()).time;
    await page.waitForTimeout(800);
    expect((await game.debug()).time).toBeCloseTo(t0, 2);
    await page.locator('#resumeBtn').click();
    await expect(page.locator('#pauseScreen')).toBeHidden();
    await expect.poll(async () => (await game.debug()).time, { timeout: 10_000 }).toBeGreaterThan(t0 + 0.2);
  });

  test('Escape closes an open panel before it pauses', async ({ game, page }) => {
    await game.tapStation('saw');
    await expect(page.locator('#shop')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#shop')).toBeHidden();
    await expect(page.locator('#pauseScreen')).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(page.locator('#pauseScreen')).toBeVisible();
  });

  test('switching tabs pauses the game', async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page.locator('#pauseScreen')).toBeVisible();
  });

  test('PT-BUG-006: the scene holds still while paused', async ({ page }) => {
    await page.keyboard.press('p');
    // let the pause card finish its entrance animation (it sits over the canvas)
    await page.evaluate(() => Promise.all(document.getAnimations()
      .filter(a => a.effect?.getComputedTiming().iterations !== Infinity).map(a => a.finished)));
    await page.waitForTimeout(100);
    const a = await page.locator('canvas').screenshot();
    await page.waitForTimeout(400);
    const b = await page.locator('canvas').screenshot();
    expect(Buffer.compare(a, b)).toBe(0);
  });

  test('settings menu pause button toggles', async ({ page }) => {
    await page.locator('#settingsBtn').click();
    await page.locator('#menuPause').click();
    await expect(page.locator('#pauseScreen')).toBeVisible();
    await expect(page.locator('#menuPause')).toHaveText(/Resume/);
  });
});

test.describe('Pilana Tajkun · camera', () => {
  test.beforeEach(async ({ game }) => { await game.openAndPlay(); });

  test('nav buttons fly the camera to each area', async ({ game, page }) => {
    const seen = new Set();
    for (const go of ['saw', 'forest', 'yard', 'bridge', 'market']) {
      await page.locator(`#nav button[data-go="${go}"]`).click();
      await page.waitForTimeout(1000); // tween is 0.8 s
      const [x, z] = await game.camInfo();
      seen.add(`${Math.round(x)},${Math.round(z)}`);
    }
    expect(seen.size).toBe(5);
  });

  test('wheel zoom stays inside its limits', async ({ game, page }) => {
    const box = await page.locator('canvas').boundingBox();
    await page.mouse.move(box.width / 2, box.height / 2);
    for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 1500);
    await expect.poll(async () => (await game.camInfo())[2]).toBe(95);
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -1500);
    await expect.poll(async () => (await game.camInfo())[2]).toBe(14);
  });

  test('WASD pans the camera', async ({ game, page }) => {
    const [x0, z0] = await game.camInfo();
    await page.keyboard.down('d');
    await page.waitForTimeout(500);
    await page.keyboard.up('d');
    const [x1, z1] = await game.camInfo();
    expect(Math.hypot(x1 - x0, z1 - z0)).toBeGreaterThan(2);
  });

  test('dragging the map pans it', async ({ game, page }) => {
    const [x0, z0] = await game.camInfo();
    await page.mouse.move(640, 400);
    await page.mouse.down();
    await page.mouse.move(400, 300, { steps: 8 });
    await page.mouse.up();
    const [x1, z1] = await game.camInfo();
    expect(Math.hypot(x1 - x0, z1 - z0)).toBeGreaterThan(2);
  });

  test('PT-BUG-004: camera stops when the window loses focus while a key is held', async ({ game, page }) => {
    await page.keyboard.down('d');
    await page.waitForTimeout(150);
    await page.evaluate(() => window.dispatchEvent(new Event('blur'))); // alt-tab: keyup never arrives
    const [x0] = await game.camInfo();
    await page.waitForTimeout(600);
    const [x1] = await game.camInfo();
    expect(Math.abs(x1 - x0)).toBeLessThan(0.5);
  });
});
