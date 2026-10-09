import { test, expect } from './fixtures.mjs';

// Ads and analytics go only through shared/gameroom-sdk.js. ?ads=test swaps in a fake ad (3 s, ✕ to close).
const events = page => page.evaluate(() => window.Gameroom.events.map(e => e.event));
const watchFakeAd = async page => {
  await expect(page.locator('#gameroomFakeAd')).toBeVisible();
  await page.waitForTimeout(3300);
  await page.locator('#gameroomFakeAd button').click();
};
async function loseGame(game, page) {
  await game.run(60 * 4);
  await page.evaluate(() => window.__kill());
  await game.run(2);
  await expect(page.locator('#overScreen')).toBeVisible();
}

test.describe('Monster Lane · ads and analytics', () => {
  test('plain web: no ad network, no offers, events are tracked', async ({ game, page }) => {
    await game.openAndPlay();
    await loseGame(game, page);
    expect(await page.evaluate(() => window.Gameroom.adapter)).toBe('none');
    await expect(page.locator('#reviveBtn')).toBeHidden();
    await expect(page.locator('#gunBtn2')).toBeHidden();
    const ev = await events(page);
    expect(ev).toContain('game_start');
    expect(ev).toContain('game_over');
    game.expectNoErrors();
  });

  test('revive: watched ad brings the base back and the run goes on (once)', async ({ game, page }) => {
    await game.openAndPlay('?ads=test');
    await loseGame(game, page);
    await page.locator('#reviveBtn').click();
    await watchFakeAd(page);
    await expect(page.locator('#overScreen')).toBeHidden();
    const s = await game.state();
    expect(s.running).toBe(true);
    expect(s.revived).toBe(true);
    expect(s.baseHp).toBe(60);
    await page.evaluate(() => window.__kill());
    await game.run(2);
    await expect(page.locator('#overScreen')).toBeVisible();
    await expect(page.locator('#reviveBtn')).toBeHidden();   // only one revive per run
    expect(await events(page)).toContain('revive');
    game.expectNoErrors();
  });

  test('revive ad closed early: no revive, the game over card stays', async ({ game, page }) => {
    await game.openAndPlay('?ads=test');
    await loseGame(game, page);
    await page.locator('#reviveBtn').click();
    await page.locator('#gameroomFakeAd button').click();
    await expect(page.locator('#overScreen')).toBeVisible();
    expect((await game.state()).running).toBe(false);
  });

  test('start weapon: the next run starts with a Minigun and an extra barrel', async ({ game, page }) => {
    await game.open('?ads=test');
    await page.locator('#gunBtn').click();
    await watchFakeAd(page);
    await expect(page.locator('#gunOn')).toBeVisible();
    await game.play();
    const s = await game.state();
    expect(s.tier).toBe(1);
    expect(s.barrels).toBe(1);
    const watched = await page.evaluate(() => window.Gameroom.events.filter(e => e.event === 'rewarded_watched').map(e => e.props));
    expect(watched).toHaveLength(1);
    expect(watched[0]).toMatchObject({ placement: 'start_weapon', ok: true });
    game.expectNoErrors();
  });
});
