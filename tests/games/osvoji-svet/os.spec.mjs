// Osvoji svet (Conquer the World). Debug hooks: window.__os (ready, state, begin, finish, advance, troops).
import { test, expect } from '@playwright/test';

const URL = '/games/osvoji-svet/';
const errorsOf = page => {
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/flagcdn|Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
  return errors;
};
const ready = page => page.waitForFunction(() => window.__os && window.__os.ready(), null, { timeout: 60_000 });
async function startRandom(page) {
  await ready(page);
  await page.locator('#random').click();
  await page.locator('#play').click();
  await expect(page.locator('#dock')).toBeVisible();
}
const watchFakeAd = async page => {
  await expect(page.locator('#gameroomFakeAd')).toBeVisible();
  await page.waitForTimeout(3300);
  await page.locator('#gameroomFakeAd button').click();
};

test.describe('Osvoji svet · smoke and ads', () => {
  test('loads the world, start card, a random country plays, no errors', async ({ page }) => {
    const errors = errorsOf(page);
    await page.goto(URL);
    await startRandom(page);
    await expect.poll(async () => (await page.evaluate(() => window.__os.state())).worldT, { timeout: 15_000 }).toBeGreaterThan(0.5);
    expect(errors).toEqual([]);
  });

  test('SDK runs as a kids game: game_start tracked, no offers on plain web', async ({ page }) => {
    await page.goto(URL);
    await startRandom(page);
    await page.evaluate(() => window.__os.advance(60));
    await expect(page.locator('#reinforce')).toBeHidden();
    const ev = await page.evaluate(() => window.Gameroom.events.map(e => e.event));
    expect(ev).toContain('game_start');
  });

  test('reinforcements: a watched ad adds half an army, once per game', async ({ page }) => {
    await page.goto(URL + '?ads=test');
    await startRandom(page);
    await page.evaluate(() => window.__os.advance(50));
    await expect(page.locator('#reinforce')).toBeVisible();
    const before = await page.evaluate(() => window.__os.troops());
    await page.locator('#reinforce').click();
    await watchFakeAd(page);
    await expect.poll(() => page.evaluate(() => window.__os.troops())).toBeGreaterThan(before + 40);
    await page.evaluate(() => window.__os.advance(5));
    await expect(page.locator('#reinforce')).toBeHidden();
  });

  test('game end is tracked and AGAIN returns to the country picker', async ({ page }) => {
    await page.goto(URL);
    await startRandom(page);
    await page.evaluate(() => window.__os.finish('lose'));
    await expect(page.locator('#end')).toBeVisible();
    const ev = await page.evaluate(() => window.Gameroom.events.map(e => e.event));
    expect(ev).toContain('game_end');
    await page.locator('#again').click();
    await expect(page.locator('#start')).toBeVisible();
  });
});
