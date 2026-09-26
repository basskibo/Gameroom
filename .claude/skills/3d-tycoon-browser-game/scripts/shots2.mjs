import { chromium } from 'playwright';
const [,, prefix = 'v', w = '390', h = '844', setup = ''] = process.argv;
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.log('[pageerror]', e.message));
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL')) console.log('[console]', m.text()); });
const t0 = Date.now();
await page.goto(`${process.env.GAME_URL || 'http://localhost:8766/games/pilana-tajkun/index.html'}?auto`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__debug, null, { timeout: 60000 });
console.log('loaded', Date.now() - t0, 'ms');
await page.evaluate(() => window.__start());
if (setup) await page.evaluate(setup);
const views = JSON.parse(process.argv[6] || '[["start",null]]');
for (const [name, v] of views) {
  if (v) await page.evaluate(v => window.__cam(v[0], v[1], v[2]), v);
  await page.waitForTimeout(+(process.argv[7] || 2500));
  await page.screenshot({ path: `${prefix}_${name}.png` });
  console.log('shot', name, Date.now() - t0, 'ms');
}
console.log(JSON.stringify(await page.evaluate(() => window.__debug())));
await browser.close();
