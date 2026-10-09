// Shared fixture for Pilana Tajkun. The game exposes debug hooks on window
// (__debug, __start, __run, __step, __cheat, __addMoney, __cam, __camInfo, __padScreen, __deal, __rush),
// so tests drive the real game instead of mocking it.
import { test as base, expect } from '@playwright/test';

export const URL = '/games/pilana-tajkun/';

// World positions of tap spots, so a test can point the camera at a station before tapping it.
export const SPOTS = {
  saw: { x: -36.6, z: -20 },
  forks: { x: -13.0, z: -16.4 },
  shop: { x: -12.4, z: -31.2 },
};

class Game {
  constructor(page, hasTouch) {
    this.page = page;
    this.touch = !!hasTouch;
    this.errors = [];
    page.on('pageerror', e => this.errors.push(`pageerror: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') this.errors.push(`console: ${m.text()}`); });
  }
  async open(query = '') {
    // ?nointro skips the first-run camera fly-in, so camera tests start from a still camera
    await this.page.goto(URL + (query ? query + '&nointro' : '?nointro'));
    await this.page.waitForFunction(() => typeof window.__start === 'function' && typeof window.__debug === 'function');
  }
  async play() {
    await this.page.locator('#startBtn').click();
    await expect(this.page.locator('#startScreen')).toBeHidden();
  }
  async openAndPlay(query = '') { await this.open(query); await this.play(); }
  async models(timeout = 60_000) {
    await this.page.waitForFunction(() => window.__yardModels !== undefined, null, { timeout });
    return this.page.evaluate(() => window.__yardModels);
  }
  debug() { return this.page.evaluate(() => window.__debug()); }
  money(v) { return this.page.evaluate(n => window.__addMoney(n), v); }
  run(steps, dt = 0.1) { return this.page.evaluate(([n, d]) => window.__run(n, d), [steps, dt]); }
  cheat(id, n = 1) { return this.page.evaluate(([i, k]) => window.__cheat(i, k), [id, n]); }
  cam(x, z, d) { return this.page.evaluate(([a, b, c]) => window.__cam(a, b, c), [x, z, d]); }
  camInfo() { return this.page.evaluate(() => window.__camInfo()); }
  /** Point the camera at a station and tap its pad, like a player would. */
  async tapStation(id, upgradeId = id) {
    const s = SPOTS[id];
    if (s) await this.cam(s.x, s.z, 30);
    await this.page.waitForTimeout(100);
    const [x, y] = await this.page.evaluate(u => window.__padScreen(u), upgradeId);
    if (this.touch) await this.page.touchscreen.tap(x, y);
    else await this.page.mouse.click(x, y);
  }
  /** Fails the test if the page logged errors. Call at the end of a test. */
  expectNoErrors() { expect(this.errors, this.errors.join('\n')).toEqual([]); }
}

export const test = base.extend({
  game: async ({ page, hasTouch }, use) => { await use(new Game(page, hasTouch)); },
});
export { expect };
