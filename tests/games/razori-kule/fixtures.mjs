// Shared fixture for Razori Kule (Smash the Towers). The game exposes window.__razori (fireVelocity, state,
// winNow, loseNow, setLevel, progress, …) and window.__start, so tests drive the real game.
import { test as base, expect } from '@playwright/test';

export const URL = '/games/razori-kule/';

class Game {
  constructor(page) {
    this.page = page;
    this.errors = [];
    page.on('pageerror', e => this.errors.push(`pageerror: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') this.errors.push(`console: ${m.text()}`); });
  }
  async open(query = '') {
    await this.page.goto(URL + query);
    await this.page.waitForFunction(() => !!window.__razori && typeof window.__start === 'function');
  }
  async play() {
    await this.page.locator('#play').click();
    await expect(this.page.locator('#veil')).toBeHidden();
  }
  async openAndPlay(query = '') { await this.open(query); await this.play(); }
  state() { return this.page.evaluate(() => window.__razori.state); }
  async win() {
    await this.page.evaluate(() => window.__razori.winNow());
    await expect(this.page.locator('#end')).toBeVisible({ timeout: 10_000 });
  }
  async lose() {
    await this.page.evaluate(() => window.__razori.loseNow());
    await expect(this.page.locator('#end')).toBeVisible({ timeout: 10_000 });
  }
  expectNoErrors() { expect(this.errors, this.errors.join('\n')).toEqual([]); }
}

export const test = base.extend({
  game: async ({ page }, use) => { await use(new Game(page)); },
});
export { expect };
