// Shared fixture for Remi Vita. The app exposes window.__remi (start, round, rebuy, derive, scoreRound, state,
// match, scene), so tests drive the real score sheet. ?no3d skips the WebGL table for fast logic tests.
import { test as base, expect } from '@playwright/test';

export const URL = '/games/remi-vita/';

class Game {
  constructor(page) {
    this.page = page;
    this.errors = [];
    page.on('pageerror', e => this.errors.push(`pageerror: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') this.errors.push(`console: ${m.text()}`); });
  }
  async open(query = '?no3d&lang=en') {
    await this.page.goto(URL + query);
    await this.page.waitForFunction(() => !!window.__remi);
  }
  async start(names = ['Ana', 'Marko', 'Jovana'], rules = {}) {
    await this.page.evaluate(([n, r]) => window.__remi.start(n, r), [names, rules]);
    await expect(this.page.locator('#board')).toBeVisible();
  }
  round(winner, type, hands, no = {}) {
    return this.page.evaluate(([w, t, h, n]) => window.__remi.round(w, t, h, n), [winner, type, hands, no]);
  }
  state() { return this.page.evaluate(() => window.__remi.derive(window.__remi.match)); }
  expectNoErrors() { expect(this.errors, this.errors.join('\n')).toEqual([]); }
}

export const test = base.extend({
  game: async ({ page }, use) => { await use(new Game(page)); },
});
export { expect };
