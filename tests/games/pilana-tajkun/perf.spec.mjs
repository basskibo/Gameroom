// Performance guards. These run on SwiftShader, so they check budgets that do not depend on the GPU:
// bytes, time-to-playable on a throttled network, draw calls, heap. Real FPS: .cursor/skills/benchmark.
import { test, expect, URL } from './fixtures.mjs';

const countDrawCalls = () => {
  window.__dc = { calls: 0 };
  for (const P of [WebGL2RenderingContext.prototype, WebGLRenderingContext.prototype]) {
    for (const fn of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
      const orig = P[fn];
      if (!orig) continue;
      P[fn] = function (...a) { window.__dc.calls++; return orig.apply(this, a); };
    }
  }
};
const callsPerFrame = page => page.evaluate(() => new Promise(res => {
  requestAnimationFrame(() => {
    window.__dc.calls = 0; let n = 0;
    const tick = () => (++n < 10 ? requestAnimationFrame(tick) : res(Math.round(window.__dc.calls / 10)));
    requestAnimationFrame(tick);
  });
}));

test.describe('Pilana Tajkun · performance budgets', () => {
  test('playable in under 6 s on a Fast-4G connection', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8 });
    const t0 = Date.now();
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.__start === 'function', null, { timeout: 60_000 });
    const ms = Date.now() - t0;
    test.info().annotations.push({ type: 'time-to-playable', description: `${ms} ms` });
    expect(ms).toBeLessThan(6000);
  });

  test('draw calls stay under the regression ceiling (early game)', async ({ page, game }) => {
    await page.addInitScript(countDrawCalls);
    await game.openAndPlay();
    await game.models();
    await game.cam(-20, -1, 46); // the same view every time (the pre-2026-10-09 start view)
    await page.waitForTimeout(1000);
    const calls = await callsPerFrame(page);
    test.info().annotations.push({ type: 'draw-calls', description: String(calls) });
    expect(calls).toBeLessThan(400); // 2026-10-09: 644 before Phase B, ~237 after
  });

  test('draw calls reach the mobile target of 300 (early game)', async ({ page, game }) => {
    await page.addInitScript(countDrawCalls);
    await game.openAndPlay();
    await game.models();
    await game.cam(-20, -1, 46);
    await page.waitForTimeout(1000);
    expect(await callsPerFrame(page)).toBeLessThan(300);
  });

  test('JS heap stays under 200 MB after models load', async ({ page, game }) => {
    await game.openAndPlay();
    await game.models();
    const mb = await page.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 0);
    test.info().annotations.push({ type: 'heap-mb', description: mb.toFixed(1) });
    expect(mb).toBeLessThan(200);
  });

  test('total download stays under 5 MB', async ({ page, game }) => {
    await game.openAndPlay();
    await game.models();
    // Resource Timing exposes sizes for same-origin files; Playwright's response sizes undercount here
    const mb = await page.evaluate(() => [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')]
      .reduce((s, e) => s + (e.encodedBodySize || 0), 0) / 1048576);
    test.info().annotations.push({ type: 'download-mb', description: mb.toFixed(1) });
    expect(mb).toBeGreaterThan(0.5); // the counter works
    expect(mb).toBeLessThan(5); // 2026-10-09: 25.7 MB at audit, 17.4 MB after PT-BUG-001, ~3 MB after Phase B
  });
});
