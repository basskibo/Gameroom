// Budgets that do not depend on the GPU (SwiftShader): bytes, time-to-playable, draw calls, heap.
import { test, expect, URL } from './fixtures.mjs';

test.describe('Monster Lane · performance budgets', () => {
  test('playable in under 4 s on Fast 4G, under 2 MB downloaded', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8 });
    const t0 = Date.now();
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.__state === 'function', null, { timeout: 60_000 });
    const ms = Date.now() - t0;
    await page.waitForFunction(() => window.__models !== undefined, null, { timeout: 60_000 });
    const mb = await page.evaluate(() => [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')]
      .reduce((s, e) => s + (e.encodedBodySize || 0), 0) / 1048576);
    test.info().annotations.push({ type: 'time-to-playable', description: `${ms} ms` }, { type: 'download-mb', description: mb.toFixed(2) });
    expect(ms).toBeLessThan(4000);   // 2026-10-10: 3.5 s before (2 MB inline bundle), ~2.8 s after
    expect(mb).toBeLessThan(2);       // 2.3 MB before, 1.3 MB after
  });

  test('JS heap stays under 120 MB in a busy wave', async ({ game, page }) => {
    await game.openAndPlay();
    await game.run(60 * 20);
    const mb = await page.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 0);
    test.info().annotations.push({ type: 'heap-mb', description: mb.toFixed(1) });
    expect(mb).toBeLessThan(120);
  });
});
