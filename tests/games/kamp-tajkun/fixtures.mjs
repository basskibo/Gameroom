// Shared fixture for Kamp Tajkun (Camp Tycoon). Debug hooks on window: __state, __run, __start, __money,
// __unlock, __helper, __order, __forceOrder.
import { test as base, expect } from '@playwright/test';

export const URL = '/games/kamp-tajkun/';

class Game {
  constructor(page) {
    this.page = page;
    this.errors = [];
    page.on('pageerror', e => this.errors.push(`pageerror: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') this.errors.push(`console: ${m.text()}`); });
  }
  async open(query = '') {
    await this.page.goto(URL + query);
    await this.page.waitForFunction(() => typeof window.__state === 'function');
  }
  async play() {
    await this.page.locator('#startBtn').click();
    await expect(this.page.locator('#startScreen')).toBeHidden();
  }
  async openAndPlay(query = '') { await this.open(query); await this.play(); }
  state() { return this.page.evaluate(() => window.__state()); }
  run(n, dt = 1 / 30) { return this.page.evaluate(([k, d]) => window.__run(k, d), [n, dt]); }
  expectNoErrors() { expect(this.errors, this.errors.join('\n')).toEqual([]); }
}

export const test = base.extend({
  game: async ({ page }, use) => { await use(new Game(page)); },
});
export { expect };
