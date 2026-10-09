// Gameroom audit: load time (normal + Fast 4G), bytes, draw calls, triangles, heap, console errors,
// and screenshots (desktop, phone portrait, phone landscape). Output: JSON on stdout + PNGs in --out.
//
//   node .claude/skills/game-audit/scripts/audit.mjs <slug> [--out .cache/audit/<slug>] [--late "<js>"] [--no-throttle]
//
// --late runs JS in the page before the second draw-call sample (e.g. buy everything with debug hooks).
// Uses headless Chrome + SwiftShader: FPS here is NOT real, use .cursor/skills/benchmark for FPS.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const argv = process.argv.slice(2);
const slug = argv[0];
if (!slug || slug.startsWith('--')) { console.error('usage: audit.mjs <slug> [--out dir] [--late "<js>"] [--no-throttle]'); process.exit(1); }
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const out = resolve(root, opt('--out', `.cache/audit/${slug}`));
const late = opt('--late', '');
const throttle = !argv.includes('--no-throttle');
mkdirSync(out, { recursive: true });

let chromium;
for (const p of ['tests/node_modules/playwright-core/index.mjs', '.cache/tools/node_modules/playwright-core/index.mjs']) {
  if (existsSync(resolve(root, p))) { ({ chromium } = await import(pathToFileURL(resolve(root, p)).href)); break; }
}
if (!chromium) { console.error('playwright-core not found: run `cd tests && npm install`'); process.exit(1); }

const PORT = 4300 + Math.floor(Math.random() * 500);
const server = spawn(process.execPath, [resolve(root, 'serve.mjs')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 400));
const URL = `http://127.0.0.1:${PORT}/games/${slug}/`;

const browser = await chromium.launch({
  headless: true, executablePath: process.env.CHROME || '/usr/bin/google-chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

const countDraws = () => {
  window.__dc = { calls: 0, tris: 0 };
  for (const P of [WebGL2RenderingContext.prototype, WebGLRenderingContext.prototype]) {
    const wrap = (fn, tri) => { const o = P[fn]; if (!o) return; P[fn] = function (...a) { window.__dc.calls++; window.__dc.tris += tri(a); return o.apply(this, a); }; };
    wrap('drawElements', a => a[1] / 3); wrap('drawArrays', a => a[2] / 3);
    wrap('drawElementsInstanced', a => a[1] / 3 * a[4]); wrap('drawArraysInstanced', a => a[2] / 3 * a[3]);
  }
};
const perFrame = page => page.evaluate(() => new Promise(res => requestAnimationFrame(() => {
  window.__dc.calls = 0; window.__dc.tris = 0; let n = 0;
  const t = () => (++n < 10 ? requestAnimationFrame(t) : res({ calls: Math.round(window.__dc.calls / 10), tris: Math.round(window.__dc.tris / 10) }));
  requestAnimationFrame(t);
})));
const startGame = page => page.evaluate(() => {
  const b = document.querySelector('#startBtn');
  if (b && b.offsetParent) b.click(); else if (typeof window.__start === 'function') window.__start();
});
const ready = page => page.waitForFunction(() => !!document.querySelector('canvas') && (typeof window.__start === 'function' || !!document.querySelector('#startBtn')), null, { timeout: 120_000 });
const models = page => page.waitForFunction(() => window.__yardModels !== undefined, null, { timeout: 120_000 }).then(() => page.evaluate(() => window.__yardModels)).catch(() => 'n/a');

// bytes from Resource Timing (same-origin, so sizes are exposed): page + every resource it fetched
const downloadedMB = () => {
  const all = [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')];
  return +(all.reduce((s, e) => s + (e.encodedBodySize || 0), 0) / 1048576).toFixed(1);
};
async function load(net) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  if (net) {
    const s = await ctx.newCDPSession(page);
    await s.send('Network.enable');
    await s.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8 });
  }
  const t0 = Date.now();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 300_000 });
  await ready(page);
  const playableMs = Date.now() - t0;
  const m = await models(page);
  const modelsMs = Date.now() - t0;
  await page.waitForTimeout(500);
  const mb = await page.evaluate(downloadedMB);
  await ctx.close();
  return { playableMs, modelsMs, models: m, mb };
}

const result = { slug, url: URL, when: new Date().toISOString() };
result.load = await load(false);
if (throttle) result.load4g = await load(true);

{ // desktop: errors, draw calls, heap, screenshots
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`.slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`.slice(0, 300)); });
  await page.addInitScript(countDraws);
  await page.goto(URL);
  await ready(page);
  await models(page);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/desktop-start.png` });
  await startGame(page);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/desktop-play.png` });
  result.drawEarly = await perFrame(page);
  if (late) {
    await page.evaluate(late);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${out}/desktop-late.png` });
    result.drawLate = await perFrame(page);
  }
  result.heapMB = await page.evaluate(() => performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null);
  result.errors = errors;
  await ctx.close();
}

for (const [name, vp] of [['phone', { width: 390, height: 844 }], ['landscape', { width: 844, height: 390 }]]) {
  const ctx = await browser.newContext({ viewport: vp, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(URL);
  await ready(page);
  await models(page);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${name}-start.png` });
  await startGame(page);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/${name}-play.png` });
  await ctx.close();
}

result.screenshots = out;
console.log(JSON.stringify(result, null, 1));
await browser.close();
server.kill();
